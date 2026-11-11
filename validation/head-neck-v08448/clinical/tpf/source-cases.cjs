'use strict';
// Bounded review-proposal checks. Expected boundaries are transcribed from current
// official source PDFs listed in audit-proposal.json, not from generated rules.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const dir=__dirname,repo=process.env.SACT_REPO||path.resolve(dir,'../../../..');
const E=require(path.join(repo,'js/assessment-engine')),L=require(path.join(repo,'js/local-lab-profile')),D=require(path.join(repo,'js/protocol-dose-schedule'));
const codes=['00315','00323','00324'];
const ps=Object.fromEntries(codes.map(c=>[c,JSON.parse(fs.readFileSync(path.join(repo,'protocols/head-neck',fs.readdirSync(path.join(repo,'protocols/head-neck')).find(f=>f.startsWith(c+'-')&&f.endsWith('.json')))))]));
const results=[];let failed=0;
function test(code,name,input,expected=[],absent=[],verify=()=>{}){
 const p=ps[code],r=E.assess(p,input);const hits=r.findings.filter(f=>!f.domainAssessment);const ids=hits.map(f=>f.ruleId);let error;
 try{assert.deepEqual(r.errors,[]);assert.deepEqual(r.invalid,[]);for(const id of expected)assert(ids.includes(id),`${id} absent (${ids.join(', ')})`);for(const id of absent)assert(!ids.includes(id),`${id} unexpectedly triggered`);verify(r,D.buildModificationModel(p,r));}catch(e){failed++;error=e.message;}
 results.push({code,name,input,expected_rule_ids:expected,forbidden_rule_ids:absent,actual_rule_ids:ids,action:r.actionType,passed:!error,...(error?{error}:{})});
}
const comp=(id,expected)=>(r)=>assert.deepEqual(r.findings.find(f=>f.ruleId===id).action.components,expected);
const special=(id)=>(r)=>assert.equal(r.findings.find(f=>f.ruleId===id).action.dose_calculation,'specialist_review');
for(const c of codes){
 test(c,'Empty assessment cannot authorise treatment',{},[],[],r=>assert(!['proceed','proceed_with_caution'].includes(r.actionType)));
 test(c,'ECOG2 outside0–1 eligibility',{ecog:2},['ECOG_OUTSIDE_ELIGIBILITY']);
 test(c,'ECOG1 has no performance restriction',{ecog:1},[],['ECOG_OUTSIDE_ELIGIBILITY']);
 test(c,'Pregnancy exclusion',{pregnancy:true},['PREGNANCY']);test(c,'Lactation exclusion',{breastfeeding:true},['BREASTFEEDING']);
 test(c,'Baseline neuropathy2 excluded',{pre_existing_neuropathy_grade:2},['BASELINE_NEUROPATHY']);
 test(c,'Baseline ANC1.5 does not meet >1.5',{assessment_phase:'pre_treatment',anc:1.5},['BASELINE_ANC']);
 test(c,'ANC1.49 requires delay independently',{anc:1.49},['ANC_LOW'],[],comp('ANC_LOW',['docetaxel','cisplatin','fluorouracil']));
 test(c,'Platelets99.9 low',{platelets:99.9},['PLATELETS_LOW']);
 test(c,'Partial DPD no invented fixed dose',{dpd_status:'partial'},['DPD_PARTIAL'],[],special('DPD_PARTIAL'));
 test(c,'Complete DPD blocks FU only',{dpd_status:'complete'},['DPD_COMPLETE'],[],comp('DPD_COMPLETE',['fluorouracil']));
 test(c,'Before first FU unresolved DPD',{assessment_phase:'pre_treatment',dpd_status:'unknown'},['DPD_TESTING_INCOMPLETE']);
 test(c,'Renal uracil phenotype caution',{renal_impairment_severity:'moderate',dpd_test_method:'phenotype'},['DPD_PHENOTYPE_RENAL_CAUTION']);
 test(c,'Renal genotype is not uracil phenotype',{renal_impairment_severity:'moderate',dpd_test_method:'genotype'},[],['DPD_PHENOTYPE_RENAL_CAUTION']);
 test(c,'CrCl59.5 source interval gap',{assessment_phase:'on_treatment',crcl_ml_min:59.5},['CIS_RENAL_GAP_59']);
 test(c,'Current grade2 mucositis alone has no imported table cutoff',{mucositis_grade:2},[],['5FU_MUC_G2','MUCOSITIS_ACTIVE','MUCOSITIS_ACTIVE_REVIEW']);
 test(c,'Persistent FU stop survives recovered mucositis',{mucositis_grade:0,fluorouracil_permanently_stopped_for_mucositis:true},['FU_MUCOSITIS_PERMANENT_STOP'],[],comp('FU_MUCOSITIS_PERMANENT_STOP',['fluorouracil']));
 test(c,'Second grade4 diarrhoea stops treatment',{diarrhoea_worst_grade:4,diarrhoea_occurrence:2},['DIARRHOEA_G4_O2']);
 test(c,'Second grade3 mucositis stops FU permanently',{mucositis_worst_grade:3,mucositis_occurrence:2},['MUCOSITIS_G3_O2','FU_MUCOSITIS_PERMANENT_STOP']);
 test(c,'First grade4 mucositis stops FU permanently',{mucositis_worst_grade:4,mucositis_occurrence:1},['MUCOSITIS_G4_O1','FU_MUCOSITIS_PERMANENT_STOP']);
 test(c,'PPE2 holds only FU',{ppe_grade:2},['PPE_ACTIVE'],[],comp('PPE_ACTIVE',['fluorouracil']));
 test(c,'Recovered PPE reduces20 percent with dose history review',{ppe_grade:1,ppe_worst_grade:2},['PPE_RECOVERED'],[],special('PPE_RECOVERED'));
 test(c,'Recurrent grade3 skin reaction at doc60 stops treatment',{skin_reaction_worst_grade:3,skin_reaction_at_docetaxel_60:true},['SKIN_REACTION_AT60_STOP']);
 test(c,'Grade4 skin is not extrapolated into grade3 dose pathway',{skin_reaction_worst_grade:4,skin_reaction_grade:0,skin_reaction_at_docetaxel_60:false,current_docetaxel_dose_mg_m2:75,toxicity_recovery_confirmed:true},['SKIN_G4_UNSPECIFIED'],['SKIN_REACTION_DOC60']);
 test(c,'Missing dexamethasone requires consultant choice',{docetaxel_premedication_complete:false},['DOC_PREMED_INCOMPLETE']);
 const recovered=c==='00315'?{diarrhoea_grade:1}:{diarrhoea_grade:1,toxicity_recovery_confirmed:true};
 test(c,'First recovered grade3 diarrhoea modifies FU',{...recovered,diarrhoea_worst_grade:3,diarrhoea_occurrence:1},['DIARRHOEA_G3_O1'],[],comp('DIARRHOEA_G3_O1',['fluorouracil']));
 test(c,'Second recovered grade3 diarrhoea modifies doc',{...recovered,diarrhoea_worst_grade:3,diarrhoea_occurrence:2},['DIARRHOEA_G3_O2'],[],comp('DIARRHOEA_G3_O2',['docetaxel']));
 test(c,'Recovered skin3 at doc75 reduces to60',{skin_reaction_worst_grade:3,skin_reaction_grade:1,skin_reaction_at_docetaxel_60:false,current_docetaxel_dose_mg_m2:75,toxicity_recovery_confirmed:true},['SKIN_REACTION_DOC60'],[],r=>assert.equal(r.findings.find(f=>f.ruleId==='SKIN_REACTION_DOC60').action.dose_mg_m2,60));
 test(c,'Skin recurrence cannot raise doc45 to60',{skin_reaction_worst_grade:3,skin_reaction_grade:1,skin_reaction_at_docetaxel_60:false,current_docetaxel_dose_mg_m2:45,toxicity_recovery_confirmed:true},['SKIN_REACTION_DOSE_HISTORY'],['SKIN_REACTION_DOC60']);
}
test('00315','Platelets100 permitted by count table',{assessment_phase:'on_treatment',platelets:100},[],['PLATELETS_LOW','PLATELETS_EXACT_SOURCE_GAP']);
test('00315','On-treatment ANC1.5 permitted by count table',{assessment_phase:'on_treatment',anc:1.5},[],['BASELINE_ANC','ANC_LOW','ANC_EXACT_SOURCE_CONFLICT']);
test('00315','ANC1.5 phase needed',{anc:1.5},['BASELINE_ANC_PHASE_UNKNOWN']);
test('00315','GCSF mandatory every cycle',{gcsf_prophylaxis_planned:false},['GCSF_REQUIRED']);
test('00315','Post-FN recovery changes all3',{complicated_neutropenia_despite_gcsf:true,haematological_recovery_confirmed:true},['COMPLICATED_NEUTROPENIA_RECOVERED'],[],comp('COMPLICATED_NEUTROPENIA_RECOVERED',['docetaxel','cisplatin','fluorouracil']));
test('00315','Unresolved complicated neutropenia does not restart',{complicated_neutropenia_despite_gcsf:true,haematological_recovery_confirmed:false},['COMPLICATED_NEUTROPENIA_UNRECOVERED'],['COMPLICATED_NEUTROPENIA_RECOVERED']);
test('00315','Persistent FN after reduction is not invented second step',{neutropenia_persists_after_reduction_and_gcsf:true},['PERSISTENT_NEUTROPENIA_AFTER_REDUCTION']);
for(const [value,id]of [[40,'CIS_RENAL_40_49'],[49,'CIS_RENAL_40_49'],[49.5,'CIS_RENAL_GAP_49'],[50,'CIS_RENAL_50_59'],[59,'CIS_RENAL_50_59']])test('00315','CrCl '+value,{crcl_ml_min:value},[id]);
test('00315','CrCl39.99 not recommended off dialysis',{crcl_ml_min:39.99,haemodialysis:false},['CIS_RENAL_BELOW40']);
test('00315','Dialysis uses discretionary50 percent',{crcl_ml_min:10,haemodialysis:true},['CIS_HAEMODIALYSIS'],['CIS_RENAL_BELOW40'],special('CIS_HAEMODIALYSIS'));
test('00315','Dialysis status takes precedence over numeric band',{crcl_ml_min:50,haemodialysis:true},['CIS_HAEMODIALYSIS'],['CIS_RENAL_50_59']);
test('00315','Obsolete FU85/180 rules removed',{bilirubin_umol_l:86,ast_u_l:181},[],['5FU_HEPATIC','5FU_AST','FU_BILIRUBIN_UMOL_L_HIGH','FU_AST_U_L_HIGH']);
test('00315','Severe hepatic FU not recommended',{hepatic_impairment_severity:'severe'},['FU_HEPATIC_SEVERE']);
test('00315','Mild hepatic with renal disease lacks normal-dose permission',{hepatic_impairment_severity:'mild',renal_impairment_severity:'moderate'},['FU_HEPATIC_RENAL_COIMPAIRMENT']);
test('00315','Mild hepatic renal status missing',{hepatic_impairment_severity:'mild'},['FU_HEPATIC_RENAL_UNKNOWN']);
test('00315','Doc first combined row considers75 percent',{ast_uln_multiple:2,alt_uln_multiple:1,alp_uln_multiple:3,bilirubin_uln_multiple:1},['DOC_HEPATIC_CONSIDER75'],[],special('DOC_HEPATIC_CONSIDER75'));
test('00315','Isolated AST2 cannot trigger combined75 row',{ast_uln_multiple:2,alt_uln_multiple:1,alp_uln_multiple:2,bilirubin_uln_multiple:1},[],['DOC_HEPATIC_CONSIDER75']);
test('00315','Doc second row remains specialist review',{ast_uln_multiple:6,alt_uln_multiple:2,alp_uln_multiple:4,bilirubin_uln_multiple:1.2},['DOC_HEPATIC_ROW2_REVIEW'],[],special('DOC_HEPATIC_ROW2_REVIEW'));
test('00315','ALP exact6 not silently contraindicated',{alp_uln_multiple:6},['DOC_ALP_EXACT6'],['DOC_HEPATIC_NOT_RECOMMENDED']);
for(const f of ['ast_uln_multiple','alt_uln_multiple','alp_uln_multiple','bilirubin_uln_multiple']){const n=f.startsWith('alp')?6:f.startsWith('bilirubin')?1.5:10;test('00315',f+' exact upper threshold',{[f]:n},[],['DOC_HEPATIC_NOT_RECOMMENDED']);test('00315',f+' just above upper threshold',{[f]:n+.001},['DOC_HEPATIC_NOT_RECOMMENDED']);}
test('00315','Grade3 diarrhoea now2 still delays to≤1',{diarrhoea_grade:2,diarrhoea_worst_grade:3,diarrhoea_occurrence:1},['DIARRHOEA_ACTIVE'],['DIARRHOEA_G3_O1']);
for(const c of ['00323','00324']){
 test(c,'Platelets100 unresolved printed equality',{platelets:100},['PLATELETS_EXACT_SOURCE_GAP'],['PLATELETS_LOW']);
 test(c,'ANC1.5 source narrative/table conflict',{assessment_phase:'on_treatment',anc:1.5},['ANC_EXACT_SOURCE_CONFLICT']);
 test(c,'Baseline renal59 excluded',{assessment_phase:'pre_treatment',crcl_ml_min:59},['BASELINE_CIS_RENAL'],['CIS_RENAL_45_59']);
 for(const value of [45,59])test(c,'On-treatment renal '+value,{assessment_phase:'on_treatment',crcl_ml_min:value},['CIS_RENAL_45_59'],['BASELINE_CIS_RENAL']);
 test(c,'CrCl44.99 is clinical decision not absolute contraindication',{assessment_phase:'on_treatment',crcl_ml_min:44.99},['CIS_RENAL_BELOW45'],[],r=>assert.equal(r.findings.find(f=>f.ruleId==='CIS_RENAL_BELOW45').actionType,'consultant_review'));
 test(c,'Low renal phase missing cannot borrow on-treatment table',{crcl_ml_min:50},['CIS_RENAL_PHASE_UNKNOWN'],['CIS_RENAL_45_59']);
 test(c,'GCSF not required for all cycles by this source alone',{gcsf_prophylaxis_planned:false},[],['GCSF_REQUIRED']);
 test(c,'FNfirst75→60',{complicated_neutropenia_despite_gcsf:true,haematological_recovery_confirmed:true,complicated_neutropenia_recurrent:false,current_docetaxel_dose_mg_m2:75},['COMPLICATED_NEUTROPENIA_DOC_60']);
 test(c,'FNrecurrent60→45',{complicated_neutropenia_despite_gcsf:true,haematological_recovery_confirmed:true,complicated_neutropenia_recurrent:true,current_docetaxel_dose_mg_m2:60},['COMPLICATED_NEUTROPENIA_DOC_45']);
 test(c,'FN at45 no fabricated dose escalation',{complicated_neutropenia_despite_gcsf:true,haematological_recovery_confirmed:true,complicated_neutropenia_recurrent:true,current_docetaxel_dose_mg_m2:45},['COMPLICATED_NEUTROPENIA_HISTORY_REVIEW'],['COMPLICATED_NEUTROPENIA_DOC_60','COMPLICATED_NEUTROPENIA_DOC_45']);
 test(c,'FN first at60 needs source-history review',{complicated_neutropenia_despite_gcsf:true,haematological_recovery_confirmed:true,complicated_neutropenia_recurrent:false,current_docetaxel_dose_mg_m2:60},['COMPLICATED_NEUTROPENIA_HISTORY_REVIEW'],['COMPLICATED_NEUTROPENIA_DOC_45']);
 test(c,'Recovered platelet nadir24.99 changes doc only',{platelet_nadir:24.99,haematological_recovery_confirmed:true,current_docetaxel_dose_mg_m2:75},['PLATELET_NADIR_LT25_RECOVERED'],[],comp('PLATELET_NADIR_LT25_RECOVERED',['docetaxel']));
 for(const [field,n]of [['bilirubin_umol_l',85],['ast_u_l',180]]){
  const id='FU_'+field.toUpperCase();test(c,field+' exact boundary',{[field]:n},[id+'_EQUAL'],[id+'_HIGH']);test(c,field+' above boundary',{[field]:n+.01},[id+'_HIGH']);test(c,field+' below boundary',{[field]:n-.01},[],[id+'_HIGH',id+'_EQUAL']);
 }
 test(c,'FU numeric prohibition outranks qualitative reduction',{hepatic_impairment_severity:'moderate',ast_u_l:181},['FU_AST_U_L_HIGH','FU_HEPATIC_MODERATE'],[],r=>assert.equal(r.actionType,'contraindicated'));
 test(c,'Doc hepatic75mg row is no75percent reduction',{ast_uln_multiple:2,alt_uln_multiple:1,alp_uln_multiple:3,bilirubin_uln_multiple:1},['DOC_HEPATIC_75MG_REFERENCE'],[],r=>{const a=r.findings.find(f=>f.ruleId==='DOC_HEPATIC_75MG_REFERENCE').action;assert.equal(a.dose_percent_of_original,undefined);assert.equal(a.dose_calculation,'specialist_review');});
 test(c,'Doc bilirubin>ULN stops independently',{bilirubin_uln_multiple:1.001},['DOC_HEPATIC_STOP']);
 test(c,'Combined AST and ALT both>3.5 ALP>6 stops',{ast_uln_multiple:3.51,alt_uln_multiple:3.51,alp_uln_multiple:6.01,bilirubin_uln_multiple:1},['DOC_HEPATIC_STOP']);
 test(c,'Single enzyme high is not silent AST/ALTOR substitution',{ast_uln_multiple:3.51,alt_uln_multiple:1,alp_uln_multiple:6.01,bilirubin_uln_multiple:1},['DOC_HEPATIC_SINGLE_ENZYME_HIGH'],['DOC_HEPATIC_STOP']);
 test(c,'Exact AST/ALT3.5 not greater than3.5',{ast_uln_multiple:3.5,alt_uln_multiple:3.5,alp_uln_multiple:6.1,bilirubin_uln_multiple:1},[],['DOC_HEPATIC_STOP']);
 test(c,'Severe liver baseline excluded',{assessment_phase:'pre_treatment',hepatic_impairment_severity:'severe'},['BASELINE_SEVERE_LIVER']);
}
test('00323','Chemoradiation excludes induction component rules',{treatment_phase:'chemoradiation',assessment_phase:'on_treatment',crcl_ml_min:20,ast_uln_multiple:11,platelets:20},['FOLLOWON_PHASE'],['CIS_RENAL_BELOW45','PLATELETS_LOW','DOC_HEPATIC_STOP','CARBO_GFR_LE20']);
// Use the exact existing raw-result adapter called by the clinician form.
const settings={altUln:40,astUln:40,bilirubinUln:20,alpUln:100,lftProfile:'custom'};
function raw(code,vals){const p=ps[code],input={};for(const [field,analyte]of [['ast_uln_multiple','ast'],['alt_uln_multiple','alt'],['alp_uln_multiple','alp'],['bilirubin_uln_multiple','bilirubin']]){if(vals[analyte]===undefined)continue;const def={...p.input_definitions[field],id:field},actual={[analyte]:vals[analyte]};Object.assign(input,L.derivedActualFields(def,actual));const calc=L.calculate(def,actual,settings);if(calc&&!calc.invalid)input[field]=calc.ratio;}return input;}
for(const c of codes){
 test(c,'Raw AST/ALT/ALP correctly reach combined hepatic row',raw(c,{ast:80,alt:40,alp:300,bilirubin:20}),[c==='00315'?'DOC_HEPATIC_CONSIDER75':'DOC_HEPATIC_75MG_REFERENCE']);
 test(c,'Raw bilirubin minimal threshold crossing not rounded into equality',raw(c,{bilirubin:c==='00315'?30.001:20.001}),[c==='00315'?'DOC_HEPATIC_NOT_RECOMMENDED':'DOC_HEPATIC_STOP']);
 if(c!=='00315')test(c,'Raw AST also reaches absolute FU threshold',raw(c,{ast:180.001}),['FU_AST_U_L_HIGH']);
}
try{const missing=L.calculate({id:'alp_uln_multiple',...ps['00315'].input_definitions.alp_uln_multiple},{alp:300},{...settings,alpUln:null});assert(missing===null||missing.invalid===true);results.push({code:'shared',name:'Missing ALP ULN cannot generate a ratio',passed:true});}catch(e){failed++;results.push({code:'shared',name:'Missing ALP ULN cannot generate a ratio',passed:false,error:e.message});}
fs.writeFileSync(path.join(dir,'source-case-results.json'),JSON.stringify({status:'integrated_source_tests',tested_at:new Date().toISOString(),scope:'Integrated protocol JSON plus existing deterministic engine and raw-laboratory adapters; no browser/CI/clinical authorisation.',passed:results.length-failed,failed,cases:results},null,2)+'\n');
console.log(JSON.stringify({cases:results.length,passed:results.length-failed,failed,failures:results.filter(x=>!x.passed).map(x=>({code:x.code,name:x.name,error:x.error}))},null,2));process.exitCode=failed?1:0;
