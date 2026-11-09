'use strict';
// Expected actions are transcribed independently from the cited source pages;
// neither expected results nor input thresholds are obtained from candidate rules.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const args=process.argv.slice(2),arg=k=>args.includes(k)?args[args.indexOf(k)+1]:null;
const repo=path.resolve(arg('--repo')||path.resolve(__dirname,'../../..'));
const candidate=args.includes('--candidates');
const E=require(path.join(repo,'js/assessment-engine.js'));
const Validator=require(path.join(repo,'js/protocol-validator.js'));
const files={
 '00385':'protocols/gynaecology/00385-cisplatin-40-mg-m-weekly-with-radiotherapy.json',
 '00387':'protocols/head-neck/00387-cisplatin-100-mg-m-with-radiotherapy.json'
};
const protocols=Object.fromEntries(Object.entries(files).map(([c,f])=>[c,JSON.parse(fs.readFileSync(candidate?path.join(__dirname,'candidates',path.basename(f)):path.join(repo,f),'utf8'))]));
const cases=[];
function add(code,name,input,action,options={}){cases.push({code,name,input,action,...options});}
function safe(code,name,input,options={}){add(code,name,input,'proceed_with_caution',{partial:true,...options});}
for(const c of Object.keys(files)){
 const wp=c==='00385',pages={counts:wp?3:2,renal:wp?4:2,neuro:wp?4:3,exclusions:wp?2:1};
 add(c,'Blank is incomplete',{},'incomplete',{partial:true});
 for(const x of [0,0.01,0.5,0.99,0.9999])add(c,'ANC below one '+x,{anc:x},'delay',{page:pages.counts,rule:'ANC_LT1',partial:true});
 for(const x of [1,1.01,1.2,1.49])add(c,'ANC '+x,{anc:x},wp?'proceed_with_caution':'dose_reduce',{page:pages.counts,partial:true,...(!wp?{match:/75%/}:{})});
 for(const x of [1.4901,1.495,1.4999])add(c,'Unrounded ANC '+x,{anc:x},wp?'proceed_with_caution':'consultant_review',{page:pages.counts,partial:true});
 for(const x of [1.5,1.51,2,10])safe(c,'ANC at or above1.5 '+x,{anc:x},{page:pages.counts});
 for(const x of [0,50,74,74.99])add(c,'Platelets '+x,{platelets:x},'delay',{page:pages.counts,partial:true});
 for(const x of [75,75.01,80,99])add(c,'Platelets75–99 '+x,{platelets:x},wp?'delay':'dose_reduce',{page:pages.counts,partial:true,...(!wp?{match:/75%/}:{})});
 for(const x of [99.01,99.5,99.999])add(c,'Unrounded platelets '+x,{platelets:x},wp?'delay':'consultant_review',{page:pages.counts,partial:true});
 for(const x of [100,100.01,150,300])safe(c,'Platelets recovery boundary '+x,{platelets:x},{page:pages.counts});
 for(const x of [0,20,39,39.9999])add(c,'CrClbelow40 '+x,{crcl_ml_min:x},'contraindicated',{page:pages.renal,rule:'CRCL_LT40',match:/not recommended/,partial:true});
 for(const x of [40,40.01,44.99,45,48.99,49])add(c,'CrCl40–49 '+x,{crcl_ml_min:x},'dose_reduce',{page:pages.renal,rule:'CRCL_40_49',match:/50%.*ORIGINAL/,percent:50,partial:true});
 for(const x of [49.001,49.5,49.999,59.001,59.5,59.999])add(c,'Fractional renal gap '+x,{crcl_ml_min:x},'consultant_review',{page:pages.renal,rule:'CRCL_PRINTED_GAP',partial:true});
 for(const x of [50,50.01,55,58.99,59])add(c,'CrCl50–59 '+x,{crcl_ml_min:x},'dose_reduce',{page:pages.renal,rule:'CRCL_50_59',match:/75%.*ORIGINAL/,percent:75,partial:true});
 for(const x of [60,60.01,90,150])safe(c,'CrCl no table reduction '+x,{crcl_ml_min:x},{page:pages.renal});
 for(const x of [20,45,55,80])add(c,'Dialysis specialist path '+x,{haemodialysis:true,crcl_ml_min:x},'consultant_review',{page:pages.renal,rule:'HAEMODIALYSIS',match:/50%.*MAY/,absent:['CRCL_LT40','CRCL_40_49','CRCL_50_59'],partial:true});
 add(c,'Dialysis alone',{haemodialysis:true},'consultant_review',{rule:'HAEMODIALYSIS',partial:true});
 for(const x of [0,1])safe(c,'Peripheral neuropathyG'+x,{peripheral_neuropathy_grade:x},{page:pages.neuro});
 add(c,'Peripheral neuropathyG2',{peripheral_neuropathy_grade:2},'dose_reduce',{page:pages.neuro,rule:'NEURO_G2',match:/25%/,partial:true});
 for(const x of [3,4])add(c,'Peripheral neuropathyG'+x,{peripheral_neuropathy_grade:x},'omit',{page:pages.neuro,rule:'NEURO_G3_4',partial:true});
 for(const field of ['pregnancy','breastfeeding','hypersensitivity','significant_hearing_impairment_or_tinnitus']){
  add(c,field+'yes',{[field]:true},'contraindicated',{page:pages.exclusions,partial:true});safe(c,field+'no',{[field]:false});
 }
 for(const x of [0,1,2])safe(c,'ECOG eligible '+x,{ecog:x},{page:pages.exclusions});
 for(const x of [3,4])add(c,'ECOG outside '+x,{ecog:x},'consultant_review',{page:pages.exclusions,partial:true});
 add(c,'RT cancellation',{radiotherapy_cancelled_today:true},'withhold',{page:pages.exclusions,rule:'RT_CANCELLED',match:/until RT resumes/,partial:true});
 safe(c,'RT not cancelled alone is not clearance',{radiotherapy_cancelled_today:false});
 add(c,'Missing mandated tests',{required_tests_missing:true},'withhold',{rule:'TESTS_MISSING',partial:true});
 add(c,'New hearing symptoms',{new_or_worsening_hearing_symptoms:true},'withhold',{rule:'NEW_HEARING',partial:true});
 add(c,'Fever needs acute management without invented automatic reduction',{febrile_neutropenia:true},'withhold',{rule:'FN',match:/does not specify.*reduction/,partial:true});
 for(const x of [3,4])add(c,'Other severe toxicity '+x,{non_haematological_toxicity_grade:x},'withhold',{rule:'NONHAEM_G3',partial:true});
 add(c,'Hydration incomplete',{[wp?'magnesium_low_or_unreplaced':'electrolytes_hydration_not_corrected']:true},'withhold',{rule:'CIS_HYDRATION',partial:true});
 add(c,'Dose history unverified',{dose_history_unverified:true},'consultant_review',{rule:'DOSE_HISTORY',partial:true});
 add(c,'Restart no recovery/history',{restarting_after_toxicity:true},'withhold',{rule:'RESTART_NOT_RECOVERED',partial:true});
 add(c,'Restart missing recovery',{restarting_after_toxicity:true,dose_history_unverified:false,current_cisplatin_dose_percent:75},'withhold',{rule:'RESTART_NOT_RECOVERED',partial:true});
 add(c,'Restart missing history',{restarting_after_toxicity:true,toxicity_recovered:true},'withhold',{rule:'RESTART_HISTORY_MISSING',partial:true});
 add(c,'Restart known unrecovered',{restarting_after_toxicity:true,toxicity_recovered:false,dose_history_unverified:false,current_cisplatin_dose_percent:75},'withhold',{rule:'RESTART_NOT_RECOVERED',partial:true});
 add(c,'Restart recovered still requires decision',{restarting_after_toxicity:true,toxicity_recovered:true,dose_history_unverified:false,current_cisplatin_dose_percent:75},'consultant_review',{rule:'RESTART_REVIEW',partial:true});
 add(c,'Prior severe neuropathy not erased by recovery',{previous_cisplatin_omitted_for_neuropathy:true,peripheral_neuropathy_grade:0},'consultant_review',{rule:'PREVIOUS_NEURO_OMISSION',partial:true});
 add(c,'Multiple dose adjustments require reconciliation',{concurrent_dose_modifications:true,crcl_ml_min:55,peripheral_neuropathy_grade:2},'consultant_review',{rule:'COMBINED_MODIFICATIONS',partial:true});
 add(c,'Automatic concurrent renal and neuropathy review',{crcl_ml_min:55,peripheral_neuropathy_grade:2},'consultant_review',{rule:'RENAL_NEURO_COMBINATION',partial:true});
 add(c,'Prior reduced dose cannot silently re-escalate',{crcl_ml_min:55,current_cisplatin_dose_percent:50},'consultant_review',{rule:'PRIOR_REDUCED_DOSE',partial:true});
 if(!wp)add(c,'Automatic count plus organ review',{anc:1.2,crcl_ml_min:45},'consultant_review',{rule:'COUNTS_ORGAN_COMBINATION',partial:true});
 add(c,'Acute low counts win over dose reduction',{anc:0.5,crcl_ml_min:55},'delay',{rule:'ANC_LT1',partial:true});
 add(c,'Neuropathy omission wins over renal reduction',{peripheral_neuropathy_grade:3,crcl_ml_min:55},'omit',{rule:'NEURO_G3_4',partial:true});
 add(c,'RT cancellation wins over platelet reduction',{radiotherapy_cancelled_today:true,platelets:80},'withhold',{rule:'RT_CANCELLED',partial:true});
 add(c,'Normal counts cannot erase pregnancy',{anc:2,platelets:200,pregnancy:true},'contraindicated',{rule:'PREGNANCY',partial:true});
 add(c,'Baseline renal exclusion versus caution',{assessment_phase:'pre_treatment',pre_existing_renal_impairment:true,crcl_ml_min:55},wp?'contraindicated':'consultant_review',{rule:wp?'BASELINE_RENAL_EXCLUSION':'BASELINE_RENAL_CAUTION',partial:true});
 add(c,'Baseline renal unknown phase',{pre_existing_renal_impairment:true},'consultant_review',{partial:true});
 if(wp)add(c,'Treatment renal adjustment is distinct from baseline exclusion',{assessment_phase:'on_treatment',pre_existing_renal_impairment:true,crcl_ml_min:55},'dose_reduce',{rule:'CRCL_50_59',partial:true});
 const band=wp?'cisplatin_renal_band':'cisplatin_crcl_band',neuro=wp?'hearing_or_neuropathy_grade':'cisplatin_neuro_hearing_grade';
 for(const [value,action,regex] of [['40_49','dose_reduce',/50%/],['50_59','dose_reduce',/75%/],['lt40','contraindicated',/not recommended/],['dialysis','consultant_review',/MAY/]])add(c,'Legacy exact renalband '+value,{[band]:value},action,{match:regex,partial:true});
 for(const x of [1,2,3,4])add(c,'Legacy neuro-hearing ambiguous '+x,{[neuro]:x},'consultant_review',{rule:'LEGACY_NEURO_HEARING',partial:true});
 add(c,'Contradictory renal benign numeric unsafe band',{crcl_ml_min:80,[band]:'lt40'},'consultant_review',{rule:'RENAL_CONFLICT_lt40',partial:true});
 add(c,'Contradictory renal unsafe numeric benign band',{crcl_ml_min:20,[band]:'ge60'},'contraindicated',{rule:'CRCL_LT40',partial:true});
 add(c,'Contradictory dialysis',{haemodialysis:false,[band]:'dialysis'},'consultant_review',{rule:'DIALYSIS_CONFLICT',partial:true});
 if(!wp){for(const val of ['45_59','lt45'])add(c,'Legacy nonsource renalband '+val,{[band]:val},'consultant_review',{rule:'LEGACY_AMBIGUOUS_RENAL',partial:true});add(c,'Progression stops course',{progression_or_unacceptable_toxicity:true},'discontinue',{rule:'PROGRESSION_OR_UNACCEPTABLE',partial:true});}
 if(wp)for(const x of [1,2,3,4])add(c,'Infusion reactionG'+x,{hypersensitivity_grade:x},'withhold',{rule:'HSR_REACTION',partial:true});
 // Missing domains must never be interpreted as normal, including zero/false handling.
 for(const field of ['anc','platelets','crcl_ml_min','haemodialysis','peripheral_neuropathy_grade','pregnancy','radiotherapy_cancelled_today','dose_history_unverified'])
  for(const missing of [null,'','   '])add(c,'Missing '+field+' '+JSON.stringify(missing),{[field]:missing},null,{partial:true,noClearance:true});
 for(const [field,bad] of [['anc',-1],['platelets',-1],['crcl_ml_min',-1],['crcl_ml_min','NaN'],['crcl_ml_min','Infinity'],['crcl_ml_min',true],['crcl_ml_min',[]],['peripheral_neuropathy_grade',5],['pregnancy','unknown-value'],['current_cisplatin_dose_percent',101]])add(c,'Invalid '+field+' '+JSON.stringify(bad),{[field]:bad},null,{partial:true,invalid:field,noClearance:true});
 for(const field of ['crcl_ml_min','peripheral_neuropathy_grade','haemodialysis'])add(c,'Urgent ANC survives invalid '+field,{anc:0.1,[field]:'not-valid'},'delay',{partial:true,invalid:field,rule:'ANC_LT1'});
}
const results=[];
for(const t of cases){
 try{
  const r=E.assess(protocols[t.code],t.input);
  if(t.action)assert.equal(r.actionType,t.action,JSON.stringify(r.findings));
  if(t.partial)assert.equal(r.complete,false,'partial evidence must not clear all domains');
  if(t.noClearance)assert.notEqual(r.actionType,'proceed','missing/invalid input cannot authorise treatment');
  if(t.invalid)assert(r.invalid.some(x=>x.id===t.invalid),'invalid input not flagged');
  if(t.rule)assert(r.findings.some(x=>x.ruleId===t.rule),'required source/guard finding absent');
  if(t.absent)for(const id of t.absent)assert(!r.findings.some(x=>x.ruleId===id),'wrong pathway '+id);
  if(t.match)assert(t.match.test(r.findings.map(x=>x.explanation).join('\n')),'required dose/limit text absent');
  if(t.percent)assert(r.findings.some(x=>x.action.dose_percent_of_original===t.percent),'original-dose percentage not encoded');
  assert(!(r.evaluation?.errors?.length),'evaluation errors');
  results.push({code:t.code,name:t.name,passed:true,action:r.actionType});
 }catch(e){results.push({code:t.code,name:t.name,passed:false,error:e.message});}
}
const structural=[];
function check(name,fn){try{fn();structural.push({name,passed:true});}catch(e){structural.push({name,passed:false,error:e.message});}}
check('Exact00385indications',()=>assert.deepEqual(protocols['00385'].indications.map(x=>x.code),['00385a','00385b','00385c','00385d','00385e']));
check('00385contextcycles',()=>{const cs=protocols['00385'].metadata.regimen_card.contexts;for(const [id,n]of [['00385a',5],['00385b',6],['00385c',6],['00385d',6],['00385e',5]])assert.equal(cs.find(x=>x.indication_id===id)?.planned_cycles,n,id);});
for(const [code,p]of Object.entries(protocols)){
 check(code+'strict protocol schema',()=>{const v=Validator.validate(p,{strict:true});assert.equal(v.valid,true,Validator.formatIssues(v).join('\n'));assert(!v.errors.some(x=>x.code==='OPERATOR_UNSUPPORTED'),'unsupported source-rule operator');});
 check(code+'sourceidentity',()=>{assert.equal(p.protocol_id,'nccp-'+code+'-v5');assert.equal(p.metadata.nccp_version,'5');assert.equal(p.metadata.source_document_pages,code==='00385'?7:4);assert.equal(p.metadata.validation.clinical_use_authorised,false);});
 check(code+'numeric renal UI',()=>{assert.equal(p.input_definitions.crcl_ml_min.type,'number');assert.equal(p.input_definitions.peripheral_neuropathy_grade.visible,true);});
 check(code+'source traceability',()=>{for(const r of p.rule_engine.rules){assert(r.source.url.startsWith('https://healthservice.hse.ie/documents/'));assert(Number.isInteger(r.source.page));assert(r.source.basis);}});
 check(code+'no invented hepatic thresholds',()=>{for(const r of p.rule_engine.rules)assert(!/alt_ast|bilirubin/.test(JSON.stringify(r.when)));});
}
const all=[...results,...structural],summary={clinical_cases:results.length,structural_checks:structural.length,passed:all.filter(x=>x.passed).length,failed:all.filter(x=>!x.passed).length};
const report={checked_at:new Date().toISOString(),repo,mode:candidate?'candidate':'actual checkout',summary,limitations:['Software/source reconciliation is not independent clinical or pharmacy approval.','Clinical cases use source tables and explicit local guards; no patient dose is prescribed.'],results,structural};
const reportPath=arg('--report');if(reportPath)fs.writeFileSync(path.resolve(reportPath),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(summary));for(const f of all.filter(x=>!x.passed).slice(0,15))console.error(f.code||'',f.name,f.error);
if(summary.failed)process.exitCode=1;
