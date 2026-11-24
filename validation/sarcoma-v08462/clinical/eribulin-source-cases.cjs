'use strict';
// External clinical review draft: no application writes. Tests use actual engine
// and dose-action model; thresholds derive from current NCCP 00228 text.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=process.env.SACT_REPO||path.resolve(__dirname,'../Sactcheck');
const E=require(path.join(root,'js/assessment-engine')),D=require(path.join(root,'js/protocol-dose-schedule')),V=require(path.join(root,'js/protocol-validator'));
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'eribulin-draft-manifest.json'))),p=JSON.parse(fs.readFileSync(path.join(__dirname,manifest.draft_path)));
const base=JSON.parse(fs.readFileSync(path.join(root,manifest.base_path))),results=[],seen=new Set(),rules=new Set(p.rule_engine.rules.map(r=>r.id||r.rule_id));
const prefix='ERI00228_',id=s=>prefix+s,sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function check(name,fn){try{fn();results.push({name,passed:true});}catch(e){results.push({name,passed:false,error:e.stack});}}
function test(name,input,expected=[],absent=[],extra=()=>{}){check(name,()=>{
  const r=E.assess(p,input),m=D.buildModificationModel(p,r),findings=r.findings.filter(f=>rules.has(f.ruleId)),ids=findings.map(f=>f.ruleId);
  assert.deepEqual(r.errors,[]);assert.deepEqual(r.invalid,[]);
  for(const f of findings){seen.add(f.ruleId);assert.deepEqual(f.action.components,['eribulin']);}
  for(const s of expected)assert(ids.includes(id(s)),`${s} absent: ${ids}`);
  for(const s of absent)assert(!ids.includes(id(s)),`${s} unexpectedly present: ${ids}`);
  for(const row of m.rows)for(const a of row.allActions)if(a.quantified){assert.equal(a.actionType,'contraindicated','No quantified modified treatment dose before prescription confirmation');assert.equal(a.protocolDose,'Not to be administered');}
  for(const row of m.rows)assert.equal(row.componentId,'eribulin');
  extra(r,m);
});}
const action=a=>r=>assert.equal(r.actionType,a);
const partial=(fields=[])=>r=>{assert.equal(r.complete,false);assert.equal(r.coverageComplete,false);assert.equal(r.partialAssessment,true);for(const f of fields)assert(r.unassessed.some(v=>v.id===f),f+' must remain unassessed');assert.match(r.recommendation,/unassessed|not assessed|not.*overall|not.*clearance|context/i);};
const visible=s=>(r,m)=>assert(m.rows.some(row=>row.allActions.some(a=>a.ruleId===id(s))),s+' must remain visible in dose-actions model');
check('Strict schema with explicit existing review-date warning',()=>{const v=V.validate(p,{strict:true});assert.equal(v.valid,true,JSON.stringify(v));assert.deepEqual(v.warnings.map(x=>x.code),['REVIEW_DATE_MISSING']);});
check('Both official indications and complete shared treatment structure preserved',()=>{for(const k of ['indications','treatment_phases','dose_levels','eligibility','exclusions','monitoring'])assert.deepEqual(p[k],base[k],k);assert.equal(p.protocol_id,'nccp-00228-v8');assert.deepEqual(p.indications.map(x=>x.nccp_indication_id||x.code||x.id),base.indications.map(x=>x.nccp_indication_id||x.code||x.id));});
check('Source discrepancy and current evidence limits remain explicit',()=>{assert.equal(p.metadata.source_pdf_sha256,null);assert.equal(p.metadata.historical_source_pdf_provenance.sha256,base.metadata.source_pdf_sha256);assert.equal(p.metadata.batch3_draft_review.original_current_pdf_binary_retrieved,false);assert.equal(p.metadata.batch3_draft_review.visual_table_layout_verified,false);assert.equal(p.metadata.batch3_draft_review.independent_clinical_approval,false);assert.equal(p.metadata.source_version_discrepancy.footer_version,'8');assert.equal(p.metadata.source_version_discrepancy.change_log_version,'9');});
test('Empty input cannot clear treatment',{},[],[],action('incomplete'));
test('Assessment phase only remains partial',{assessment_phase:'treatment_day'},[],[],partial(['anc_x10e9_l','platelets_x10e9_l']));
test('Normal ANC with absent platelets remains partial',{assessment_phase:'treatment_day',anc_x10e9_l:2},[],[],partial(['platelets_x10e9_l','child_pugh','neuropathy_grade']));
test('Normal counts cannot clear missing organs/current toxicity/history',{assessment_phase:'treatment_day',anc_x10e9_l:2,platelets_x10e9_l:150},[],[],partial(['child_pugh','creatinine_clearance_ml_min','neuropathy_grade','previous_grade_3_4_nonhaem']));
for(const [f,s]of [['hypersensitivity','HYPERSENSITIVITY'],['breastfeeding','BREASTFEEDING'],['congenital_long_qt','CONGENITAL_LONG_QT'],['significant_cardiovascular_impairment','SIGNIFICANT_CARDIOVASCULAR_IMPAIRMENT']])test(f+' source exclusion',{[f]:true},[s],[],action('contraindicated'));
test('Pregnancy receives source/product risk-benefit review',{pregnancy:true},['PREGNANCY']);
test('ECOG2 source eligible range',{ecog:2},[],['ECOG']);test('ECOG3 exceeds source range',{ecog:3},['ECOG']);
for(const [v,trigger]of [[1.499,true],[1.5,false],[1.501,false]])test('Initial ANC '+v,{assessment_phase:'initial_eligibility',anc_x10e9_l:v},trigger?['INITIAL_ANC_X10E9_L']:[],trigger?[]:['INITIAL_ANC_X10E9_L']);
for(const [v,trigger]of [[99.999,true],[100,true],[100.001,false]])test('Initial platelet strict greater-than100 '+v,{assessment_phase:'initial_eligibility',platelets_x10e9_l:v},trigger?['INITIAL_PLATELETS_X10E9_L']:[],trigger?[]:['INITIAL_PLATELETS_X10E9_L']);
for(const day of [1,8]){
  for(const [v,trigger]of [[.999,true],[1,false],[1.001,false]])test('Treatment day'+day+' ANC '+v,{assessment_phase:'treatment_day',assessment_day:day,anc_x10e9_l:v},trigger?['DAY_ANC_X10E9_L']:[],trigger?[]:['DAY_ANC_X10E9_L']);
  for(const [v,trigger]of [[74.999,true],[75,false],[75.001,false]])test('Treatment day'+day+' platelet '+v,{assessment_phase:'treatment_day',assessment_day:day,platelets_x10e9_l:v},trigger?['DAY_PLATELETS_X10E9_L']:[],trigger?[]:['DAY_PLATELETS_X10E9_L']);
}
test('Missing stage cannot clear ANC1.2',{anc_x10e9_l:1.2},['STAGE_MISSING_ANC_X10E9_L']);
test('Missing stage cannot clear platelets100',{platelets_x10e9_l:100},['STAGE_MISSING_PLATELETS_X10E9_L']);
test('Severe current counts hold with absent stage',{anc_x10e9_l:.1,platelets_x10e9_l:10},['DAY_ANC_X10E9_L','DAY_PLATELETS_X10E9_L'],[],action('delay'));
for(const f of ['other_nonhaem_toxicity_grade','neuropathy_grade','mucositis_grade'])for(const grade of [2,3,4])test(f+' current grade'+grade,{[f]:grade},grade>=3?['CURRENT_'+f.toUpperCase()]:[],grade<3?['CURRENT_'+f.toUpperCase()]:[]);
test('Active infection remains a review decision',{active_infection:true},['ACTIVE_INFECTION']);
test('Acute FN holds despite recovered counts',{acute_febrile_neutropenia:true,anc_x10e9_l:2,platelets_x10e9_l:150},['ACUTE_FN'],[],action('withhold'));
const dose={current_eribulin_dose_level:'1.23'},trigger='TRIGGER_AT_1_23';
for(const f of ['prolonged_anc_below_0_5_over_7d','febrile_neutropenia','platelets_below_25_previous_cycle','platelets_below_50_with_bleeding_or_transfusion','previous_grade_3_4_nonhaem'])test('Legacy historical event retained '+f,{...dose,[f]:true},[trigger],[],visible(trigger));
for(const [anc,days,qual]of [[.499,7.001,true],[.5,8,false],[.499,7,false],[.499,6.999,false]])test('Prior ANC duration strict boundary '+anc+'/'+days,{...dose,prior_anc_nadir_x10e9_l:anc,days_prior_anc_below_05:days,prior_neutropenic_fever_or_infection:false},qual?[trigger]:[],qual?[]:[trigger]);
for(const [anc,fever,qual]of [[.999,true,true],[1,true,false],[.999,false,false]])test('Prior neutropenic fever strict ANC '+anc+'/'+fever,{...dose,prior_anc_nadir_x10e9_l:anc,prior_neutropenic_fever_or_infection:fever,days_prior_anc_below_05:0},qual?[trigger]:[],qual?[]:[trigger]);
for(const [plt,bleed,qual]of [[24.999,false,true],[25,false,false],[49.999,true,true],[50,true,false],[49.999,false,false]])test('Prior platelet event strict boundary '+plt+'/'+bleed,{...dose,prior_platelet_nadir_x10e9_l:plt,prior_platelet_bleeding_or_transfusion:bleed},qual?[trigger]:[],qual?[]:[trigger]);
for(const input of [{prior_neutropenic_fever_or_infection:true},{days_prior_anc_below_05:8},{prior_anc_nadir_x10e9_l:.4},{prior_anc_nadir_x10e9_l:.4,days_prior_anc_below_05:5},{prior_anc_nadir_x10e9_l:.7},{prior_anc_nadir_x10e9_l:.4,prior_neutropenic_fever_or_infection:false},{prior_platelet_bleeding_or_transfusion:true},{prior_platelet_nadir_x10e9_l:40}])test('Incomplete prior-event pair '+JSON.stringify(input),{...dose,...input},['PRIOR_EVENT_DETAILS'],[trigger]);
test('Current low counts do not stand in for a historical nadir',{...dose,anc_x10e9_l:.4,platelets_x10e9_l:20},['DAY_ANC_X10E9_L','DAY_PLATELETS_X10E9_L'],[trigger]);
for(const level of [undefined,'other'])test('Prior event without known prescribed dose '+level,{previous_grade_3_4_nonhaem:true,...(level?{current_eribulin_dose_level:level}:{})},['TRIGGER_UNKNOWN_DOSE'],[trigger]);
for(const level of ['0.97','0.62']){
  const suffix=level.replace('.','_');
  for(const recurrent of [undefined,false])test('Historical event at '+level+' with recurrence '+recurrent,{previous_grade_3_4_nonhaem:true,current_eribulin_dose_level:level,...(recurrent===undefined?{}:{toxicity_recurred_at_reduced_dose:recurrent})},['RECURRENCE_UNCONFIRMED_'+suffix],['RECURRENCE_'+suffix]);
  test('Confirmed recurrence despite '+level,{previous_grade_3_4_nonhaem:true,current_eribulin_dose_level:level,toxicity_recurred_at_reduced_dose:true},['RECURRENCE_'+suffix],[],(r,m)=>{assert.equal(r.actionType,'consultant_review');if(level==='0.62')assert.match(r.recommendation,/consider.*discontinu/i);else visible('RECURRENCE_'+suffix)(r,m);});
}
test('History reference cannot quantify an immediately usable dose',{...dose,previous_grade_3_4_nonhaem:true},[trigger],[],(r,m)=>{partial(['anc_x10e9_l','platelets_x10e9_l'])(r);visible(trigger)(r,m);assert.equal(m.hasQuantified,false);assert(m.rows.every(x=>!x.quantified));assert.equal(r.findings.find(x=>x.ruleId===id(trigger)).action.dose_mg_m2,.97);});
test('Current grade3 and low counts dominate future history dose',{...dose,previous_grade_3_4_nonhaem:true,other_nonhaem_toxicity_grade:3,anc_x10e9_l:.2,platelets_x10e9_l:20},[trigger,'CURRENT_OTHER_NONHAEM_TOXICITY_GRADE','DAY_ANC_X10E9_L','DAY_PLATELETS_X10E9_L'],[],(r,m)=>{assert.equal(r.actionType,'delay');assert.equal(m.rows[0].protocolDose,'No dose now');visible(trigger)(r,m);});
for(const [v,expected,absent]of [[49.999,['RENAL_LT50'],['CRCL50_BOUNDARY']],[50,['CRCL50_BOUNDARY'],['RENAL_LT50']],[50.001,[],['CRCL50_BOUNDARY','RENAL_LT50']]])test('Renal numerical boundary '+v,{creatinine_clearance_ml_min:v},expected,absent);
test('Haemodialysis source may-consider review',{eribulin_renal_band:'dialysis'},['DIALYSIS']);
test('Legacy renal ge50 band requires actual boundary',{eribulin_renal_band:'ge50'},['CRCL50_BOUNDARY']);
for(const [band,value]of [['gt50',50],['gt50',49],['lt50',50],['lt50',51],['eq50',49],['ge50',49]])test('Renal selected-band contradiction '+band+'/'+value,{eribulin_renal_band:band,creatinine_clearance_ml_min:value},['RENAL_INPUT_CONFLICT']);
test('Renal selected-band agreement',{eribulin_renal_band:'gt50',creatinine_clearance_ml_min:51},[],['RENAL_INPUT_CONFLICT','RENAL_LT50','CRCL50_BOUNDARY']);
for(const cp of ['A','B','C'])test('Child-Pugh '+cp,{child_pugh:cp},['CHILD_PUGH_'+cp],[],cp==='C'?action('withhold'):()=>{});
for(const [f,threshold]of [['alt_uln_multiple',3],['ast_uln_multiple',3],['bilirubin_uln_multiple',1.5]]){test(f+' exact risk boundary',{[f]:threshold},[],['LFT_RISK']);test(f+' above risk boundary',{[f]:threshold+.001},['LFT_RISK']);}
test('QT risk needs targeted assessment',{qt_risk_factors:true},['QT_RISK']);test('Uncorrected electrolytes preclude administration',{uncorrected_low_electrolytes:true},['ELECTROLYTES']);
test('Liposarcoma requires indication confirmation',{indication_id:'00228b'},['LIPOSARCOMA_CONTEXT']);
test('Confirmed liposarcoma eligibility does not trigger missing context',{indication_id:'00228b',liposarcoma_eligibility_confirmed:true},[],['LIPOSARCOMA_CONTEXT']);
test('Breast context preserves independent eligibility',{indication_id:'00228a'},[],['LIPOSARCOMA_CONTEXT']);
test('Other sarcoma is not automatically liposarcoma eligibility',{indication_id:'other'},['OTHER_INDICATION']);
test('Breast trastuzumab footnote does not transfer to liposarcoma',{indication_id:'00228b',liposarcoma_eligibility_confirmed:true,additional_trastuzumab:true},['TRASTUZUMAB_CONTEXT']);
test('Breast trastuzumab context not incorrectly blocked',{indication_id:'00228a',additional_trastuzumab:true},[],['TRASTUZUMAB_CONTEXT']);
for(const basis of ['mesilate','unknown'])test('Dose convention '+basis+' requires reconciliation',{dose_basis:basis},['DOSE_BASIS_REVIEW'],[],action('withhold'));
test('EU base1.23 reference preserved',{dose_basis:'base',planned_eribulin_base_dose_mg_m2:1.23},[],['DOSE_BASIS_REVIEW','BASE_DOSE_ABOVE_REFERENCE']);
test('Salt-equivalent1.4 cannot become base1.4',{dose_basis:'base',planned_eribulin_base_dose_mg_m2:1.4},['BASE_DOSE_ABOVE_REFERENCE'],[],action('withhold'));
for(const [level,planned,blocked]of [['0.97',.97,false],['0.97',.971,true],['0.62',.62,false],['0.62',.621,true]])test('Numerical proposed reescalation '+level+'/'+planned,{current_eribulin_dose_level:level,planned_eribulin_base_dose_mg_m2:planned,dose_reescalation_requested:false},blocked?['NO_REESCALATION']:[],blocked?[]:['NO_REESCALATION']);
test('No reescalation after prior reduction',{dose_reescalation_requested:true,current_eribulin_dose_level:'0.97'},['NO_REESCALATION'],[],action('withhold'));
for(const recovery of [undefined,false,true])for(const plan of [undefined,false,true]){
  const input={restart_requested:true,...(recovery===undefined?{}:{current_delay_criteria_resolved:recovery}),...(plan===undefined?{}:{consultant_restart_plan_confirmed:plan})},qual=!(recovery===true&&plan===true);
  test('Restart recovery/plan '+recovery+'/'+plan,input,qual?['RESTART_NOT_CONFIRMED']:[],qual?[]:['RESTART_NOT_CONFIRMED']);
}
test('Restart attestation cannot override current grade3 toxicity',{restart_requested:true,current_delay_criteria_resolved:true,consultant_restart_plan_confirmed:true,neuropathy_grade:3},['CURRENT_NEUROPATHY_GRADE'],[],action('delay'));
test('Severe blistering rash receives urgent hold not routine restart',{severe_blistering_or_peeling_rash:true},['SCAR_URGENT_REVIEW'],[],action('withhold'));
const demo=Object.fromEntries(Object.entries(p.input_definitions).filter(([,v])=>v.demo_value!==undefined).map(([k,v])=>[k,v.demo_value]));
test('Nonstandard current dose has explicit visible review with otherwise normal inputs',{...demo,current_eribulin_dose_level:'other',planned_eribulin_base_dose_mg_m2:1.23},['NONSTANDARD_DOSE'],[],visible('NONSTANDARD_DOSE'));
test('Demo defaults cannot clear exact renal50 boundary',{...demo,creatinine_clearance_ml_min:50},['CRCL50_BOUNDARY']);
test('Demo normal counts cannot erase known prior recurrence',{...demo,previous_grade_3_4_nonhaem:true,current_eribulin_dose_level:'0.62',toxicity_recurred_at_reduced_dose:true},['RECURRENCE_0_62']);
check('Every draft rule is positively exercised',()=>assert.deepEqual([...rules].filter(x=>!seen.has(x)),[]));
check('Application source file remains byte-identical',()=>assert.equal(sha(fs.readFileSync(path.join(root,manifest.base_path))),manifest.base_sha256));
const report={checked_date:'2026-11-18',mode:'external_draft_only',protocol_sha256:sha(fs.readFileSync(path.join(__dirname,manifest.draft_path))),cases:results.length,passed:results.filter(x=>x.passed).length,failed:results.filter(x=>!x.passed).length,rule_count:rules.size,positively_exercised_rules:[...seen].sort(),source_basis:'Complete current NCCP extracted text plus identified primary supplements; no current PDF binary or visual-table verification',results};
fs.writeFileSync(path.join(__dirname,'eribulin-source-case-results.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({cases:report.cases,passed:report.passed,failed:report.failed,exercised:seen.size,rules:rules.size}));
for(const r of results.filter(x=>!x.passed))console.error(r.name+'\n'+r.error);if(report.failed)process.exitCode=1;
