'use strict';
// Expected actions are independently enumerated from the source tables and their gaps.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const B=__dirname,R=path.resolve(B,'../../..'),E=require(R+'/js/assessment-engine'),V=require(R+'/js/protocol-validator'),D=require(R+'/js/protocol-dose-schedule');
const mode=process.argv.includes('--integrated')?'integrated':process.argv.includes('--baseline')?'baseline':'proposed';
const manifest=JSON.parse(fs.readFileSync(B+'/proposal-manifest.json')),results=[];
function check(name,fn){try{fn();results.push({name,pass:true});}catch(e){results.push({name,pass:false,error:e.message});}}
function read(c){const f=manifest.files.find(f=>f.code===c);return JSON.parse(fs.readFileSync(mode==='integrated'?R+'/'+f.target:B+'/'+mode+'/'+path.basename(f.target)));}
function evaluate(p,x){const r=E.assess(p,x);assert.deepEqual(r.errors,[]);assert.deepEqual(r.invalid,[]);return r;}
function caseOf(p,label,x,yes=[],no=[],component){check(p.metadata.nccp_regimen_code+' '+label,()=>{const r=evaluate(p,x),ids=r.findings.map(f=>f.ruleId);for(const id of yes){assert(ids.includes(id),'missing '+id+'; actual '+ids.join(', '));if(component)assert(r.findings.find(f=>f.ruleId===id).action.components.includes(component),'missing component '+component);}for(const id of no)assert(!ids.includes(id),'unexpected '+id);});}
const pf=['fluorouracil_bolus','fluorouracil_infusion','folinic_acid'];
for(const c of ['00207','00328','00733','00456']){
 const p=read(c);
 check(c+' strict schema',()=>{const r=V.validate(p,{strict:true});assert(r.valid,V.formatIssues(r).join('\n'));});
 check(c+' no clinical authorisation manufactured',()=>{for(const k of ['consultant_reviewed','oncology_pharmacy_reviewed','clinical_use_authorised'])assert.equal(p.metadata.validation[k],false);});
 check(c+' empty remains partial',()=>{const r=evaluate(p,{});assert(!r.complete);assert.notEqual(r.actionType,'proceed');});
 if(c!=='00456'){
  for(const g of [0,1,2,3,4])caseOf(p,'current infusion reaction '+g,{infusion_reaction_grade:g},g>=3?['INFUSION_G34']:[],g<3?['INFUSION_G34']:[]);
  caseOf(p,'recovered severe cetuximab reaction',{infusion_reaction_grade:0,previous_severe_cetuximab_infusion_reaction:true},['CETUXIMAB_PRIOR_SEVERE_REACTION']);
  caseOf(p,'no previous severe reaction',{previous_severe_cetuximab_infusion_reaction:false},[],['CETUXIMAB_PRIOR_SEVERE_REACTION']);
  caseOf(p,'first15min reaction',{reaction_first_15_minutes:true},['FIRST_15_MINUTES']);
  caseOf(p,'confirmed ILD',{interstitial_lung_disease:true},['ILD']);
  for(const g of [0,1,2,3,4])caseOf(p,'rash '+g,{acneiform_rash_grade:g},g>=3?['SKIN_HOLD']:[],g<3?['SKIN_HOLD']:[]);
  for(const n of [1,2,3,4])caseOf(p,'skin episode '+n,{skin_occurrence:n},n===4?['SKIN_FOURTH']:[],n<4?['SKIN_FOURTH']:[]);
  const doses=c==='00733'?[500,400,300]:[250,200,150];
  for(let n=1;n<=3;n++){
   caseOf(p,'skin restart '+n,{skin_occurrence:n,acneiform_rash_grade:2,skin_delay_weeks:1,skin_failed_recovery:false,previous_cetuximab_dose_mg_m2:doses[n-1]},['SKIN_RESTART_'+n]);
   caseOf(p,'no skin re-escalation '+n,{skin_occurrence:n,acneiform_rash_grade:2,skin_delay_weeks:1,skin_failed_recovery:false,previous_cetuximab_dose_mg_m2:doses[n-1]-1},[],['SKIN_RESTART_'+n]);
  }
  check(c+' observation conflict retained',()=>{assert.match(p.monitoring.join(' '),/SmPC.*4\.2/);assert.match(p.monitoring.join(' '),/each infusion/);});
 }
 if(c==='00207'){
  for(const id of ['00207-head-neck','00207b'])caseOf(p,'HN no RAS exclusion '+id,{indication_id:id,ras_status:'mutant'},[],['RAS_EXCLUSION','CRC_PRIOR_TREATMENT_V6']);
  caseOf(p,'CRC mutant exclusion',{indication_id:'00207a',ras_status:'mutant'},['RAS_EXCLUSION']);
  caseOf(p,'CRC unknown RAS',{indication_id:'00207a',ras_status:'unknown'},['RAS_EXCLUSION']);
  caseOf(p,'CRC wrong prior therapy',{indication_id:'00207a',colorectal_prior_therapy_criteria_met:false},['CRC_PRIOR_TREATMENT_V6']);
  caseOf(p,'CRC absent EGFR',{indication_id:'00207a',egfr_expression_confirmed:false},['CRC_EGFR_ELIGIBILITY']);
  for(const field of ['renal_impairment','hepatic_impairment_present','haemodialysis'])check(c+' no invented organ reduction '+field,()=>{const r=evaluate(p,{[field]:true});assert(r.findings.some(f=>f.ruleId==='ORGAN_REVIEW'));assert(D.buildModificationModel(p,r).rows.every(r=>!r.quantified));});
  check(c+' exact distinct indications',()=>{const text=p.indications.find(i=>i.indication_id==='00207a').description;assert.match(text,/RAS wild-type/);assert.match(text,/oxaliplatin/);assert.match(text,/irinotecan/);assert(!/radiotherapy|Bonner/i.test(text));});
 }
 if(c==='00328'||c==='00733'){
  for(const [field,bound] of [['fluorouracil_bilirubin_umol_l',85],['fluorouracil_ast_u_l',180]]){
   caseOf(p,field+' below',{[field]:bound-.01},[],['FU_HEPATIC_CI','FU_HEPATIC_EQUALITY']);
   caseOf(p,field+' equal',{[field]:bound},['FU_HEPATIC_EQUALITY'],['FU_HEPATIC_CI'],'folinic_acid');
   caseOf(p,field+' above',{[field]:bound+.01},['FU_HEPATIC_CI'],[],'folinic_acid');
  }
  for(const [label,x,id] of [['complete DPD',{dpd_status:'complete'},'DPD_COMPLETE'],['unknown DPD',{dpd_status:'unknown'},'DPD_UNKNOWN'],['5FU cardiac',{suspected_fluoropyrimidine_cardiotoxicity:true},'FU_CARDIAC'],['DPD inhibitor',{concurrent_brivudin_sorivudin_or_analogue:true},'FU_DPD_INHIBITOR_CONTRAINDICATION']])check(c+' linked folinic '+label,()=>{const r=evaluate(p,x),f=r.findings.find(f=>f.ruleId===id);assert(f,'missing '+id);for(const comp of pf)assert(f.action.components.includes(comp));});
  caseOf(p,'ambiguous AST interpretation',{fluorouracil_transaminase_source_uncertain:true},['FU_TRANSAMINASE_SOURCE_LABEL_REVIEW']);
  caseOf(p,'partial DPD review',{dpd_status:'partial'},['DPD_PARTIAL']);
  caseOf(p,'renal DPD phenotype',{renal_impairment_dpd_phenotype:true},['DPD_RENAL_PHENOTYPE_REVIEW']);
  for(const n of [1.49,1.5,1.51])caseOf(p,'day1 ANC '+n,{anc_x10e9_l:n},n<1.5?['ANC_HOLD']:[],n>=1.5?['ANC_HOLD']:[]);
  for(const n of [74.99,75,75.01])caseOf(p,'day1 platelets '+n,{platelets_x10e9_l:n},n<75?['PLATELETS_HOLD']:[],n>=75?['PLATELETS_HOLD']:[]);
 }
 if(c==='00328'){
  for(const n of [.99,1,1.01,2.99,3,3.01])caseOf(p,'irinotecan bilirubin '+n,{bilirubin_uln_multiple:n},n>3?['BILI_CI']:n>1?['BILI_ABNORMAL_REVIEW']:[],n<=3?['BILI_CI']:[]);
  caseOf(p,'UGT1A1 homozygous28',{ugt1a1_homozygous_28:true},['UGT_REVIEW']);
  caseOf(p,'UGT1A1 poor metaboliser6',{ugt1a1_poor_metaboliser:true},['UGT_REVIEW']);
  check(c+' UGT no invented reduction',()=>{const r=evaluate(p,{ugt1a1_poor_metaboliser:true});assert(D.buildModificationModel(p,r).rows.every(r=>!r.quantified));});
  check(c+' irinotecan renal no borrowed cutoff',()=>{const r=evaluate(p,{renal_impairment:true,crcl_ml_min:8});assert(r.findings.some(f=>f.ruleId==='RENAL_IRI'));assert(D.buildModificationModel(p,r).rows.filter(r=>r.componentId==='irinotecan').every(r=>!r.quantified));});
 }
 if(c==='00733'){
  for(const n of [0,1,2,3,4])caseOf(p,'previous grade4 now '+n,{neuropathy_highest_grade:4,neuropathy_grade:n},['NEUROPATHY_PRIOR_G4_STOP']);
  for(const n of [0,1,2])caseOf(p,'recovered grade3 now '+n,{neuropathy_highest_grade:3,neuropathy_grade:n},['NEUROPATHY_G3_RECOVERY_REVIEW']);
  caseOf(p,'grade3 recovery missing',{neuropathy_highest_grade:3},['NEUROPATHY_HISTORY_CONTEXT']);
  for(const n of [29.99,30,30.01])caseOf(p,'oxaliplatin renal '+n,{crcl_ml_min:n},n<30?['OX_RENAL_REDUCTION']:[],n>=30?['OX_RENAL_REDUCTION']:[]);
  check(c+' renal50percent is a choice',()=>{assert(D.buildModificationModel(p,evaluate(p,{crcl_ml_min:29})).rows.filter(r=>r.componentId==='oxaliplatin').every(r=>!r.quantified));});
 }
 if(c==='00456'){
  for(const n of [.99,1,1.49,1.495,1.5,1.501])caseOf(p,'etoposide ANC '+n,{anc_x10e9_l:n},n<1?['ETOP_COUNTS_DELAY']:n<=1.49?['ETOP_COUNTS_75']:n<1.5?['COUNTS_SOURCE_GAP']:[],n>=1.5?['COUNTS_SOURCE_GAP']:[]);
  for(const n of [74.99,75,99,99.5,100,100.01])caseOf(p,'etoposide platelets '+n,{platelets_x10e9_l:n},n<75?['ETOP_COUNTS_DELAY']:n<=99?['ETOP_COUNTS_75']:n<100?['COUNTS_SOURCE_GAP']:[],n>=100?['COUNTS_SOURCE_GAP']:[]);
  for(const [n,yes] of [[9.99,['CIS_RENAL_LT40','ETOP_RENAL_LT10']],[10,['CIS_RENAL_LT40','ETOP_RENAL_10_50']],[39.99,['CIS_RENAL_LT40','ETOP_RENAL_10_50']],[40,['CIS_RENAL_40_49','ETOP_RENAL_10_50']],[49,['CIS_RENAL_40_49','ETOP_RENAL_10_50']],[49.5,['CIS_RENAL_GAP','ETOP_RENAL_10_50']],[50,['CIS_RENAL_50_59','ETOP_RENAL_10_50']],[59,['CIS_RENAL_50_59']],[59.5,['CIS_RENAL_GAP']],[60,[]]])caseOf(p,'renal '+n,{crcl_ml_min:n},yes);
  caseOf(p,'dialysis separate',{crcl_ml_min:10,haemodialysis:true},['DIALYSIS'],['CIS_RENAL_LT40','CIS_RENAL_50_59','ETOP_RENAL_10_50']);
  caseOf(p,'g3 only recovered to2',{other_nonhaem_highest_grade:3,other_nonhaem_toxicity_grade:2},['NONHAEM_G3_RECOVERY_HOLD']);
  for(const n of [0,1])caseOf(p,'g3 recovered to'+n,{other_nonhaem_highest_grade:3,other_nonhaem_toxicity_grade:n},['NONHAEM_G3_RECOVERED_REVIEW']);
  caseOf(p,'g3 current unknown',{other_nonhaem_highest_grade:3},['NONHAEM_HISTORY_CONTEXT']);
  caseOf(p,'g4 recovered not g3 pathway',{other_nonhaem_highest_grade:4,other_nonhaem_toxicity_grade:0},['NONHAEM_PRIOR_G4_REVIEW'],['NONHAEM_G3_RECOVERED_REVIEW']);
  for(const n of [0,1])caseOf(p,'neuro2 recovered to'+n,{neuropathy_highest_grade:2,neuropathy_grade:n},['CIS_NEURO_RECOVERED_REVIEW']);
  caseOf(p,'neuro recovery unknown',{neuropathy_highest_grade:2},['CIS_NEURO_HISTORY_CONTEXT']);
  check(c+' cisplatin recovered neuro not automatic order',()=>{assert(D.buildModificationModel(p,evaluate(p,{neuropathy_highest_grade:2,neuropathy_grade:0})).rows.every(r=>!r.quantified));});
 }
}
const report={mode,total:results.length,passed:results.filter(r=>r.pass).length,failed:results.filter(r=>!r.pass).length,results};
fs.writeFileSync(B+'/'+mode+'-results.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,results:results.filter(r=>!r.pass)},null,2));if(report.failed)process.exitCode=1;
