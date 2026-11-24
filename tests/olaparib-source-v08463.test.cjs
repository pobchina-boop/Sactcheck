'use strict';
// Current-source boundaries and component safety, not authority to prescribe.
// NCCP 00588 v6 pp1–6; NCCP 00746 v2 pp1–10; EMA Lynparza/Avastin SmPC.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const E = require('../js/assessment-engine');
const D = require('../js/protocol-dose-schedule');
const V = require('../js/protocol-validator');
const G = require('../js/ctcae-descriptors');
const files = {
  '00588': 'protocols/shared/00588-olaparib-tablet-monotherapy.json',
  '00746': 'protocols/gynaecology/00746-olaparib-tablet-and-bevacizumab-therapy.json'
};
const protocols = Object.fromEntries(Object.entries(files).map(([code, file]) => [code,
  JSON.parse(fs.readFileSync(process.env.OLAPARIB_PROTOCOL_DIR ? path.join(process.env.OLAPARIB_PROTOCOL_DIR, code + '.json') : path.join(root, file)))]));
const results = [], covered = {'00588': new Set(), '00746': new Set()};
const FIRST = 'first_line_advanced_ovarian_maintenance', RELAPSE = 'platinum_sensitive_relapsed_ovarian_maintenance';
const BREAST = 'adjuvant_high_risk_early_breast', PROSTATE = 'mcrpc_brca_monotherapy', PANCREAS = 'pancreatic_maintenance';
const clinical = r => r.findings.filter(f => !f.domainAssessment && !/^PARTIAL_/.test(f.ruleId || ''));
function noNumber(model, component) {
  for (const row of model.rows.filter(r => !component || r.componentId === component)) {
    assert(!/^\s*\d/.test(row.protocolDose || ''), 'Unresolved state produced a numerical dose: ' + row.protocolDose);
  }
}
function run(code, name, input, expected, check) {
  const item = {code, name, input, expected};
  try {
    const r = E.assess(protocols[code], input), model = D.buildModificationModel(protocols[code], r);
    assert.deepEqual(r.errors, []); assert.deepEqual(r.invalid, []);
    if (expected) assert.equal(r.actionType, expected);
    const findings = clinical(r); findings.forEach(f => covered[code].add(f.ruleId));
    if (check) check(r, model, findings);
    item.pass = true; item.actual = r.actionType;
    item.findings = findings.map(f => ({id: f.ruleId, action: f.actionType, components: f.action.components}));
    item.doses = model.rows.map(r => ({component: r.componentId, action: r.actionType, dose: r.protocolDose, quantified: r.quantified}));
  } catch (error) { item.pass = false; item.error = error.message; }
  results.push(item);
}
function structure(name, fn) {
  try { fn(); results.push({name, pass: true}); }
  catch (error) { results.push({name, pass: false, error: error.message}); }
}
const has = (findings, id) => assert(findings.some(f => f.ruleId === id), 'Missing ' + id);
const lacks = (findings, id) => assert(!findings.some(f => f.ruleId === id), 'Unexpected ' + id);
const manual = (r, m) => noNumber(m, 'olaparib');
for (const code of Object.keys(protocols)) {
  structure(code + ' strict schema and review flags', () => {
    const p = protocols[code], v = V.validate(p, {strict: true});
    assert.equal(v.valid, true); assert.deepEqual(v.errors, []); assert.deepEqual(v.warnings, []);
    if (code === '00588') {
      assert.equal(p.metadata.review_schedule, 'as_required');
      assert.equal(p.metadata.last_reviewed_date, '2026-11-02');
      for (const invalid of [{last_reviewed_date:null},{last_reviewed_date:'2026-02-31'},{review_schedule:null}]) {
        const changed={...p, metadata:{...p.metadata,...invalid}};
        assert(V.validate(changed,{strict:true}).warnings.some(issue=>issue.code==='REVIEW_DATE_MISSING'));
      }
    }
    assert.equal(p.metadata.sactcheck_encoding_version, '0.84.63');
    for (const flag of ['clinical_use_authorised', 'consultant_reviewed', 'oncology_pharmacy_reviewed']) assert.equal(p.metadata.validation[flag], false);
    assert.deepEqual(p.required_inputs, []);
    for (const r of p.rule_engine.rules) { assert(r.source.url); assert(r.source.page); assert(r.explanation); }
  });
  run(code, 'Blank input remains incomplete', {}, 'incomplete', (r,m) => assert.deepEqual(m.rows, []));
  for (const value of [0, .99]) run(code, 'ANC below 1: ' + value, {anc_x10e9_l: value}, 'delay_then_dose_reduce', manual);
  for (const value of [1, 1.01]) run(code, 'ANC at/above 1 is partial: ' + value, {anc_x10e9_l: value}, 'proceed_with_caution', r => assert(r.partialAssessment));
  run(code, 'Platelets below 100', {platelets_x10e9_l: 99.99}, 'delay_then_dose_reduce', manual);
  for (const value of [100, 100.01]) run(code, 'Platelets boundary ' + value, {platelets_x10e9_l: value}, 'proceed_with_caution');
  run(code, 'Both continuation counts do not reset prior dose', {anc_x10e9_l: 1, platelets_x10e9_l: 100, current_dose_level: '-2'}, 'proceed_with_caution', (r,m,f) => { has(f,'HAEM_COUNTS_PROCEED'); assert(!m.rows.some(x => /300/.test(x.protocolDose))); });
  run(code, 'Third occurrence is not fourth', {haematological_toxicity_occurrence_number: 3}, null, (r,m,f) => lacks(f,'HAEM_TOXICITY_FOURTH_OCCURRENCE_CEASE'));
  run(code, 'Fourth qualifying occurrence ceases olaparib', {haematological_toxicity_occurrence_number: 4}, 'cease', (r,m) => { noNumber(m); assert(m.rows.every(x => x.componentId === 'olaparib')); });
  run(code, 'Febrile neutropenia alone is actionable', {febrile_neutropenia: true}, 'delay_then_dose_reduce', manual);
  for (const g of [3,4]) run(code, 'Febrile neutropenia grade ' + g, {febrile_neutropenia_grade: g}, 'delay_then_dose_reduce', manual);
  for (const value of [0,29.99,30]) run(code, 'Renal unresolved source boundary ' + value, {crcl_ml_min:value}, 'consultant_review', manual);
  for (const value of [30.001,31,50]) run(code, 'Renal concordant dose band ' + value, {crcl_ml_min:value}, 'dose_reduce', (r,m) => assert(m.rows.some(x => x.componentId==='olaparib' && x.protocolDose==='200 mg twice daily')));
  run(code, 'Above 50 does not re-escalate reduced dose', {crcl_ml_min:50.001,current_dose_level:'-2'}, 'proceed_with_caution', (r,m) => assert(!m.rows.some(x=>/300/.test(x.protocolDose))));
  for (const [band,action] of [['renal_0_29','consultant_review'],['renal_exact30','consultant_review'],['renal_30_50','dose_reduce'],['renal_51_plus','proceed_with_caution'],['dialysis','consultant_review']]) run(code,'Actual renal selector '+band,{crcl_ml_min:band},action);
  run(code,'Dialysis without a numerical CrCl',{haemodialysis:true},'consultant_review',manual);
  for(const value of ['A','B']) run(code,'Child Pugh '+value,{child_pugh_class:value,current_dose_level:'-2'},'proceed_with_caution');
  run(code,'Child Pugh C retains source conflict',{child_pugh_class:'C'},'consultant_review',manual);
  for(const cls of ['strong','moderate']) {
    run(code,cls+' inhibitor without unavoidable decision',{cyp3a_inhibitor_class:cls},'consultant_review',manual);
    run(code,cls+' inhibitor avoidable',{cyp3a_inhibitor_class:cls,cyp3a_inhibitor_unavoidable:false},'consultant_review',manual);
    run(code,cls+' inhibitor unavoidable',{cyp3a_inhibitor_class:cls,cyp3a_inhibitor_unavoidable:true},'dose_reduce',(r,m)=>assert(m.rows.some(x=>x.protocolDose===(cls==='strong'?'100':'150')+' mg twice daily')));
    run(code,cls+' inhibitor plus renal restriction is not arithmetic',{cyp3a_inhibitor_class:cls,cyp3a_inhibitor_unavoidable:true,crcl_ml_min:40},'consultant_review',manual);
    run(code,cls+' inhibitor plus prior toxicity reduction',{cyp3a_inhibitor_class:cls,cyp3a_inhibitor_unavoidable:true,current_dose_level:'-1'},'consultant_review',manual);
  }
  for(const level of ['-1','-2']) run(code,'Renal plus prior toxicity restriction '+level,{crcl_ml_min:40,current_dose_level:level},'consultant_review',manual);
  run(code,'Indexed or unconfirmed renal method blocks automatic dose',{crcl_ml_min:40,renal_measurement_context:'other_or_uncertain'},'consultant_review',manual);
  for(const f of ['olaparib_hypersensitivity','previous_parp_inhibitor','pregnancy','breastfeeding']) run(code,f+' exclusion',{[f]:true},'contraindicated',manual);
  for(const f of ['severe_haematological_toxicity','blood_transfusion_dependence','persistent_cytopenia_after_4_week_hold','suspected_pneumonitis','suspected_drug_induced_liver_injury']) run(code,f+' interrupts olaparib',{[f]:true},'withhold',(r,m)=>{noNumber(m);assert(m.rows.every(x=>x.componentId==='olaparib'));});
  for(const f of ['confirmed_mds_aml','confirmed_pneumonitis']) run(code,f+' stops only olaparib',{[f]:true},'permanently_discontinue',(r,m)=>{noNumber(m);assert(m.rows.every(x=>x.componentId==='olaparib'));});
  for(const f of ['suspected_mds_aml','suspected_vte','strong_or_moderate_cyp3a_inducer','intolerable_nonhaematological_toxicity']) run(code,f+' review is not automatic permanent stop',{[f]:true},'consultant_review',manual);
  run(code,'Initial blood recovery differs from continuation counts',{treatment_stage:'initial',recovered_previous_haematological_toxicity:false,anc_x10e9_l:1.2,platelets_x10e9_l:110},'withhold',manual);
  run(code,'Unknown stage does not waive initial recovery',{recovered_previous_haematological_toxicity:false},'withhold',manual);
  for(const stage of ['ongoing','restart']) run(code,'Historical initial recovery flag at '+stage,{treatment_stage:stage,recovered_previous_haematological_toxicity:false},'consultant_review',(r,m,f)=>{manual(r,m);lacks(f,'START_RECOVERY_NOT_MET');has(f,'ONGOING_INITIAL_RECOVERY_HISTORY');});
  run(code,'No third toxicity dose step',{current_dose_level:'-2',anc_x10e9_l:.5},'delay_then_dose_reduce',(r,m,f)=>{noNumber(m);has(f,'OLAPARIB_TOXICITY_LADDER_EXHAUSTED');});
  run(code,'Two-level FN reduction cannot pass below ladder',{current_dose_level:'-1',febrile_neutropenia_grade:4},'delay_then_dose_reduce',(r,m,f)=>{noNumber(m);has(f,'OLAPARIB_TWO_LEVEL_REDUCTION_EXCEEDS_LADDER');});
  run(code,'Severe Hb toxicity remains independent of ANC/platelets',{hb_g_dl:7.99,anc_x10e9_l:2,platelets_x10e9_l:200},'withhold',manual);
  for(const hb of [8,9.99]) run(code,'Moderate anaemia '+hb,{hb_g_dl:hb},'consultant_review',manual);
  run(code,'Hb concentration 10 is only one domain',{hb_g_dl:10},'proceed_with_caution');
  run(code,'Under 18 requires specialist review',{age_years:17},'consultant_review',manual);
  run(code,'Adult age does not supply other domains',{age_years:18},null,(r,m,f)=>lacks(f,'AGE_UNDER18'));
  run(code,'Acute DILI overrides a renal numerical dose',{crcl_ml_min:40,suspected_drug_induced_liver_injury:true},'withhold',manual);
  run(code,'Confirmed pneumonitis overrides haem dose pathway',{anc_x10e9_l:.4,confirmed_pneumonitis:true},'permanently_discontinue',manual);
  structure(code+' source grading does not manufacture grades from treatment thresholds',()=>{
    for(const id of ['anc_x10e9_l','platelets_x10e9_l']) { const g=G.guide({id,...protocols[code].input_definitions[id]});assert(g.sourceSpecific);assert.equal(g.calculable,false);assert.deepEqual(g.grades,[]); }
    const hb={id:'hb_g_dl',...protocols[code].input_definitions.hb_g_dl};assert.equal(G.gradeForValue(hb,7.99).grade,3);assert.equal(G.gradeForValue(hb,8).grade,2);
    assert.deepEqual(protocols[code].input_definitions.febrile_neutropenia_grade.options.map(x=>x.value),[0,3,4]);
  });
}

// Breast's four branches and prostate scope remain distinct from new ovarian/pancreatic rules.
for(const [field,value,id] of [['germline_brca_status','negative','BREAST_GERMLINE_BRCA'],['her2_status','positive','BREAST_HER2'],['ecog',3,'BREAST_ECOG'],['prior_neoadjuvant_or_adjuvant_chemotherapy',false,'BREAST_PRIOR_CHEMO']]) run('00588','Breast '+id,{indication_id:BREAST,[field]:value},'consultant_review',(r,m,f)=>has(f,id));
for(const value of [12,12.01]) run('00588','Breast ideal start window '+value,{indication_id:BREAST,weeks_since_completion_of_last_local_or_systemic_treatment:value},value>12?'consultant_review':null,(r,m,f)=>value>12?has(f,'BREAST_START_WINDOW'):lacks(f,'BREAST_START_WINDOW'));
run('00588','Breast neoadjuvant pCR',{indication_id:BREAST,breast_chemotherapy_setting:'neoadjuvant',residual_invasive_disease:false},'consultant_review',(r,m,f)=>has(f,'BREAST_NEO_PCR'));
for(const score of [2.99,3]) run('00588','Breast HR positive neoadjuvant CPS+EG '+score,{indication_id:BREAST,breast_receptor_group:'hr_positive',breast_chemotherapy_setting:'neoadjuvant',residual_invasive_disease:true,cps_eg_score:score},score<3?'consultant_review':null,(r,m,f)=>score<3?has(f,'BREAST_HRPOS_NEO_CPS_EG'):lacks(f,'BREAST_HRPOS_NEO_CPS_EG'));
for(const nodes of [3,4]) run('00588','Breast HR positive adjuvant nodes '+nodes,{indication_id:BREAST,breast_receptor_group:'hr_positive',breast_chemotherapy_setting:'adjuvant',positive_axillary_nodes:nodes},nodes<4?'consultant_review':null,(r,m,f)=>nodes<4?has(f,'BREAST_HRPOS_ADJ_NODES'):lacks(f,'BREAST_HRPOS_ADJ_NODES'));
for(const size of [1.99,2]) run('00588','TNBC node negative size '+size,{indication_id:BREAST,breast_receptor_group:'tnbc',breast_chemotherapy_setting:'adjuvant',positive_axillary_nodes:0,primary_tumour_cm:size},size<2?'consultant_review':null,(r,m,f)=>size<2?has(f,'BREAST_TNBC_ADJ_SIZE'):lacks(f,'BREAST_TNBC_ADJ_SIZE'));
run('00588','TNBC node positive does not need 2cm',{indication_id:BREAST,breast_receptor_group:'tnbc',breast_chemotherapy_setting:'adjuvant',positive_axillary_nodes:1,primary_tumour_cm:1},null,(r,m,f)=>lacks(f,'BREAST_TNBC_ADJ_SIZE'));
run('00588','Breast one-year completion',{indication_id:BREAST,months_on_olaparib:12},'consultant_review',(r,m,f)=>has(f,'BREAST_DURATION'));
for(const weeks of [1.99,2]) run('00588','Radiotherapy sequencing '+weeks,{indication_id:BREAST,weeks_since_radiotherapy:weeks},weeks<2?'consultant_review':null,(r,m,f)=>weeks<2?has(f,'BREAST_RADIATION_GAP'):lacks(f,'BREAST_RADIATION_GAP'));
for(const [field,value,id] of [['prostate_brca_status','unknown','PROSTATE_BRCA'],['prostate_prior_new_hormonal_agent',false,'PROSTATE_PRIOR_NHA'],['prostate_mcrpc_confirmed',false,'PROSTATE_DISEASE_SETTING'],['prostate_castration_maintained',false,'PROSTATE_CASTRATION'],['prostate_formulation_tablets',false,'PROSTATE_FORMULATION'],['ecog',3,'PROSTATE_ECOG']]) run('00588','Prostate '+id,{indication_id:PROSTATE,[field]:value},'consultant_review',(r,m,f)=>has(f,id));
for(const status of ['germline','somatic']) run('00588','Prostate accepts pathogenic '+status,{indication_id:PROSTATE,prostate_brca_status:status},null,(r,m,f)=>lacks(f,'PROSTATE_BRCA'));

for(const indication of [FIRST,RELAPSE]) {
  run('00588',indication+' BRCA unknown',{indication_id:indication,ovarian_brca_status:'unknown'},'consultant_review',(r,m,f)=>has(f,'OVARIAN_BRCA'));
  run('00588',indication+' stable disease is not CR/PR',{indication_id:indication,ovarian_platinum_response:'stable'},'consultant_review',(r,m,f)=>has(f,'OVARIAN_PLATINUM_RESPONSE'));
  for(const value of ['complete','partial']) run('00588',indication+' response '+value,{indication_id:indication,ovarian_platinum_response:value},null,(r,m,f)=>lacks(f,'OVARIAN_PLATINUM_RESPONSE'));
}
for(const [field,value,id] of [['ovarian_histology','other','FIRST_OVARIAN_HISTOLOGY'],['figo_stage','other','FIRST_OVARIAN_FIGO'],['first_line_platinum_cycles',3,'FIRST_OVARIAN_PLATINUM_CYCLES'],['ecog',2,'FIRST_OVARIAN_ECOG']]) run('00588','First-line ovarian '+id,{indication_id:FIRST,[field]:value},'consultant_review',(r,m,f)=>has(f,id));
run('00588','First-line ovarian four platinum cycles',{indication_id:FIRST,first_line_platinum_cycles:4},null,(r,m,f)=>lacks(f,'FIRST_OVARIAN_PLATINUM_CYCLES'));
for(const [weeks,debulking,expected] of [[8,false,false],[8.01,false,true],[12,true,false],[12.01,true,true]]) run('00588','Ovarian start '+weeks+' debulking '+debulking,{indication_id:FIRST,weeks_since_last_platinum:weeks,debulking_after_platinum_required:debulking},expected?'consultant_review':null,(r,m,f)=>assert.equal(f.some(x=>['FIRST_OVARIAN_START_WINDOW','FIRST_OVARIAN_DEBULKING_WINDOW'].includes(x.ruleId)),expected));
run('00588','Late start does not assume debulking exception',{indication_id:FIRST,weeks_since_last_platinum:9},'consultant_review',(r,m,f)=>has(f,'FIRST_OVARIAN_START_WINDOW'));
for(const weeks of [3.99,4,8,8.01]) run('00588','Clinician-selected bevacizumab switch timing '+weeks,{indication_id:FIRST,switch_from_bevacizumab_after_brca_result:true,bevacizumab_stopped_for_monotherapy:true,weeks_since_last_platinum:weeks},(weeks<4||weeks>8)?'consultant_review':null,(r,m,f)=>(weeks<4||weeks>8)?has(f,'FIRST_OVARIAN_BEV_SWITCH_WINDOW'):lacks(f,'FIRST_OVARIAN_BEV_SWITCH_WINDOW'));
run('00588','Switch plan must record bevacizumab stop',{indication_id:FIRST,switch_from_bevacizumab_after_brca_result:true,weeks_since_last_platinum:6},'consultant_review',(r,m,f)=>has(f,'FIRST_OVARIAN_BEV_SWITCH_PLAN'));
run('00588','First-line two-year review',{indication_id:FIRST,months_on_olaparib:24},'consultant_review',(r,m,f)=>has(f,'FIRST_OVARIAN_TWO_YEAR_REVIEW'));
for(const [field,value,id] of [['ovarian_histology','high_grade_endometrioid','RELAPSED_OVARIAN_HISTOLOGY'],['previous_platinum_courses',1,'RELAPSED_OVARIAN_PLATINUM_COURSES'],['weeks_since_last_platinum',8.01,'RELAPSED_OVARIAN_START_WINDOW'],['ecog',3,'RELAPSED_OVARIAN_ECOG'],['life_expectancy_weeks',15.99,'RELAPSED_OVARIAN_LIFE_EXPECTANCY']]) run('00588','Relapsed ovarian '+id,{indication_id:RELAPSE,[field]:value},'consultant_review',(r,m,f)=>has(f,id));
for(const months of [6,6.001]) run('00588','Platinum sensitivity strict >6 '+months,{indication_id:RELAPSE,penultimate_platinum_response_months:months},months<=6?'consultant_review':null,(r,m,f)=>months<=6?has(f,'RELAPSED_OVARIAN_PLATINUM_SENSITIVITY'):lacks(f,'RELAPSED_OVARIAN_PLATINUM_SENSITIVITY'));
run('00588','Elevated CA125 missing repeat',{indication_id:RELAPSE,ca125_xuln:1.01},'consultant_review',(r,m,f)=>has(f,'RELAPSED_OVARIAN_CA125_REPEAT_REQUIRED'));
run('00588','CA125 at ULN does not require elevated-result repeat',{indication_id:RELAPSE,ca125_xuln:1},null,(r,m,f)=>lacks(f,'RELAPSED_OVARIAN_CA125_REPEAT_REQUIRED'));
run('00588','CA125 repeat before seven days',{indication_id:RELAPSE,ca125_xuln:2,ca125_repeat_interval_days:6.99,ca125_repeat_percent_change:0},'consultant_review',(r,m,f)=>has(f,'RELAPSED_OVARIAN_CA125_INTERVAL'));
for(const value of [-10,14.99,15]) run('00588','CA125 strict <15% '+value,{indication_id:RELAPSE,ca125_xuln:2,ca125_repeat_interval_days:7,ca125_repeat_percent_change:value},value>=15?'consultant_review':null,(r,m,f)=>value>=15?has(f,'RELAPSED_OVARIAN_CA125_INCREASE'):lacks(f,'RELAPSED_OVARIAN_CA125_INCREASE'));
for(const [field,value,id] of [['germline_brca_status','negative','PANCREATIC_GERMLINE_BRCA'],['pancreatic_metastatic_adenocarcinoma',false,'PANCREATIC_DISEASE_SETTING'],['pancreatic_first_line_platinum',false,'PANCREATIC_FIRST_LINE_PLATINUM'],['pancreatic_platinum_weeks',15.99,'PANCREATIC_PLATINUM_DURATION'],['pancreatic_response','progressive','PANCREATIC_NO_PROGRESSION'],['ecog',3,'PANCREATIC_ECOG']]) run('00588','Pancreatic '+id,{indication_id:PANCREAS,[field]:value},'consultant_review',(r,m,f)=>has(f,id));
run('00588','Pancreatic sixteen weeks and stable disease are permitted criteria',{indication_id:PANCREAS,pancreatic_platinum_weeks:16,pancreatic_response:'stable'},null,(r,m,f)=>{lacks(f,'PANCREATIC_PLATINUM_DURATION');lacks(f,'PANCREATIC_NO_PROGRESSION');lacks(f,'OVARIAN_PLATINUM_RESPONSE');});
for(const indication of [RELAPSE,PROSTATE,PANCREAS]) run('00588','No one/two-year cap imported to '+indication,{indication_id:indication,months_on_olaparib:36,anc_x10e9_l:2},'proceed_with_caution',(r,m,f)=>assert(!f.some(x=>['BREAST_DURATION','FIRST_OVARIAN_TWO_YEAR_REVIEW'].includes(x.ruleId))));
run('00588','Breast does not inherit ovarian or pancreatic flags',{indication_id:BREAST,ovarian_brca_status:'negative',pancreatic_response:'progressive',first_line_platinum_cycles:0,anc_x10e9_l:2},'proceed_with_caution',(r,m,f)=>assert(!f.some(x=>/^(OVARIAN_|FIRST_OVARIAN_|RELAPSED_OVARIAN_|PANCREATIC_)/.test(x.ruleId))));

// Combination eligibility and both independent treatment clocks.
for(const [field,value,id] of [['first_line_maintenance_confirmed',false,'COMBINATION_FIRST_LINE'],['figo_stage','other','COMBINATION_FIGO'],['hrd_status','unknown','COMBINATION_HRD'],['ovarian_histology','mucinous_or_other','COMBINATION_HISTOLOGY'],['ecog',2,'COMBINATION_ECOG'],['platinum_bevacizumab_response','stable','COMBINATION_RESPONSE']]) run('00746',id,{[field]:value},'consultant_review',(r,m,f)=>has(f,id));
run('00746','Genomic instability qualifies without BRCA mutation',{hrd_status:'genomic_instability'},null,(r,m,f)=>lacks(f,'COMBINATION_HRD'));
for(const flag of [false,true]) run('00746','Other non-mucinous histology germline exception '+flag,{ovarian_histology:'other_non_mucinous',germline_brca_confirmed:flag},flag?null:'consultant_review',(r,m,f)=>flag?lacks(f,'COMBINATION_OTHER_HISTOLOGY_GERMLINE'):has(f,'COMBINATION_OTHER_HISTOLOGY_GERMLINE'));
for(const cycles of [5,6,9,10]) run('00746','Platinum-taxane cycles '+cycles,{platinum_taxane_cycles:cycles},(cycles<6||cycles>9)?'consultant_review':null,(r,m,f)=>(cycles<6||cycles>9)?has(f,'COMBINATION_PLATINUM_CYCLES'):lacks(f,'COMBINATION_PLATINUM_CYCLES'));
run('00746','One previous bevacizumab cycle insufficient',{bevacizumab_last_platinum_cycles:1,interval_debulking_surgery:true},'consultant_review',(r,m,f)=>has(f,'COMBINATION_BEV_CYCLES_MINIMUM'));
for(const flag of [false,true]) run('00746','Two bevacizumab cycles with surgery exception '+flag,{bevacizumab_last_platinum_cycles:2,interval_debulking_surgery:flag},flag?null:'consultant_review',(r,m,f)=>flag?lacks(f,'COMBINATION_BEV_CYCLES_SURGERY_EXCEPTION'):has(f,'COMBINATION_BEV_CYCLES_SURGERY_EXCEPTION'));
run('00746','Three prior bevacizumab cycles do not need surgery exception',{bevacizumab_last_platinum_cycles:3,interval_debulking_surgery:false},null,(r,m,f)=>lacks(f,'COMBINATION_BEV_CYCLES_SURGERY_EXCEPTION'));
run('00746','Olaparib two-year clock only',{months_on_olaparib:24},'consultant_review',(r,m)=>assert(m.rows.every(x=>x.componentId==='olaparib')));
run('00746','Bevacizumab clock includes prior chemotherapy',{bevacizumab_total_months_including_chemotherapy:15},'cease',(r,m)=>assert(m.rows.every(x=>x.componentId==='bevacizumab')));
run('00746','Before fifteen-month endpoint',{bevacizumab_total_months_including_chemotherapy:14.99},null,(r,m,f)=>lacks(f,'BEV_MAXIMUM_TOTAL_DURATION'));
for(const field of ['bevacizumab_hypersensitivity','cho_recombinant_antibody_hypersensitivity']) run('00746',field,{[field]:true},'contraindicated',(r,m)=>assert(m.rows.every(x=>x.componentId==='bevacizumab')));

// Protein concentrations, dipsticks and timed amounts are never interchangeable.
for(const dip of ['negative','1+']) run('00746','Low dipstick '+dip,{urine_protein_dipstick:dip},'proceed_with_caution',(r,m,f)=>has(f,'BEV_DIPSTICK_LOW'));
for(const dip of ['2+','3+']) run('00746','Dipstick surveillance '+dip,{urine_protein_dipstick:dip},'proceed_with_caution',(r,m,f)=>{has(f,'BEV_DIPSTICK_COLLECTION');assert(!f.some(x=>['withhold','permanently_discontinue'].includes(x.actionType)));});
run('00746','Dipstick 4+ is a hold, not automatic protein grade4',{urine_protein_dipstick:'4+'},'withhold',(r,m,f)=>{has(f,'BEV_DIPSTICK_FOUR_PLUS');lacks(f,'BEV_GRADE4_PROTEINURIA');});
for(const value of [.99,1,4]) run('00746','Spot concentration '+value+' g/L',{urine_protein_g_l:value},'proceed_with_caution',(r,m,f)=>{has(f,value<1?'BEV_SPOT_PROTEIN_LOW':'BEV_SPOT_COLLECTION');assert(!f.some(x=>x.ruleId.startsWith('BEV_PROTEIN_24H')));});
for(const value of [0,1.999,2]) run('00746','Timed protein ≤2 '+value,{protein_24h_g:value},'proceed_with_caution',(r,m,f)=>has(f,'BEV_PROTEIN_24H_UP_TO_TWO'));
for(const value of [2.001,3,4]) run('00746','Timed protein >2–4 '+value,{protein_24h_g:value},'withhold',(r,m,f)=>has(f,'BEV_PROTEIN_24H_OVER_TWO_TO_FOUR'));
run('00746','Timed protein above4 stops bevacizumab',{protein_24h_g:4.001},'permanently_discontinue',(r,m)=>assert(m.rows.every(x=>x.componentId==='bevacizumab')));
for(const field of ['grade4_proteinuria','nephrotic_syndrome']) run('00746',field+' overrides low timed protein',{[field]:true,protein_24h_g:1},'permanently_discontinue',(r,m)=>assert(m.rows.every(x=>x.componentId==='bevacizumab')));
run('00746','Reassuring dipstick cannot override quantitative hold',{urine_protein_dipstick:'negative',protein_24h_g:3},'withhold');
run('00746','Reassuring spot cannot override quantitative stop',{urine_protein_g_l:.1,protein_24h_g:5},'permanently_discontinue');
run('00746','Concurrent 4+ dipstick and low timed result require reconciliation',{urine_protein_dipstick:'4+',protein_24h_g:1},'withhold');

for(const value of [130,160]) run('00746','Single systolic reading needs control context '+value,{systolic_bp:value},'consultant_review',(r,m,f)=>has(f,'BEV_BP_CONTROL_CONTEXT'));
run('00746','Controlled BP is not a generic automatic numeric hold',{systolic_bp:150,diastolic_bp:90,hypertension_control:'controlled'},null,(r,m,f)=>{lacks(f,'BEV_BP_CONTROL_CONTEXT');lacks(f,'BEV_UNCONTROLLED_OR_SYMPTOMATIC_BP');});
for(const input of [{hypertension_control:'uncontrolled'},{symptomatic_hypertension:true}]) run('00746','Uncontrolled/symptomatic BP '+JSON.stringify(input),input,'withhold');
for(const grade of [2,3]) run('00746','Grade '+grade+' BP review',{hypertension_grade:grade},'consultant_review',(r,m,f)=>has(f,'BEV_GRADE2_3_BP'));
for(const input of [{hypertension_grade:4},{persistent_grade3_hypertension:true},{medically_significant_hypertension_uncontrolled_by_medication:true},{hypertensive_crisis_or_encephalopathy:true}]) run('00746','Severe BP pathway '+JSON.stringify(input),input,'permanently_discontinue',(r,m)=>assert(m.rows.every(x=>x.componentId==='bevacizumab')));
run('00746','Grade3 bleeding stops bevacizumab',{haemorrhage_grade:3},'permanently_discontinue');
run('00746','Intracranial bleed independent of generic grade',{intracranial_bleeding:true,haemorrhage_grade:1},'permanently_discontinue',(r,m,f)=>has(f,'BEV_INTRACRANIAL_BLEEDING'));
run('00746','Arterial event not limited to grade4',{arterial_thromboembolic_event:true},'permanently_discontinue');
run('00746','Grade4 VTE',{venous_thromboembolism_grade:4},'permanently_discontinue');
for(const grade of [1,2,3]) run('00746','Lower-grade VTE review '+grade,{venous_thromboembolism_grade:grade},'consultant_review');
run('00746','GI perforation',{gi_perforation:true},'permanently_discontinue');
run('00746','TE fistula despite lower generic grade',{fistula_type:'tracheoesophageal',fistula_grade:1},'permanently_discontinue');
run('00746','Grade4 fistula',{fistula_grade:4},'permanently_discontinue');
for(const type of ['internal_non_gi','other','unclassified']) run('00746','Other fistula needs type-specific review '+type,{fistula_type:type,fistula_grade:2},'consultant_review');
run('00746','Suspected PRES is urgent hold, not a diagnosis',{suspected_pres_or_new_neurological_symptoms:true},'withhold');
run('00746','Confirmed PRES',{confirmed_pres:true},'permanently_discontinue');
run('00746','Surgery day27.99 even if wound marked healed',{days_since_major_surgery:27.99,wound_fully_healed:true},'withhold');
run('00746','Day28 does not waive unhealed wound',{days_since_major_surgery:28,wound_fully_healed:false},'withhold');
run('00746','Day28 healing unknown',{days_since_major_surgery:28},'consultant_review');
run('00746','Day28 and healed passes these two criteria only',{days_since_major_surgery:28,wound_fully_healed:true},null,(r,m,f)=>assert(!f.some(x=>/^BEV_(RECENT_SURGERY|UNHEALED_WOUND_OR_SURGERY_PLAN|SURGERY_HEALING_CONTEXT)$/.test(x.ruleId))));
for(const field of ['wound_healing_complication','planned_elective_surgery']) run('00746',field,{[field]:true},'withhold');
run('00746','Necrotising fasciitis',{necrotising_fasciitis:true},'permanently_discontinue');
run('00746','Active infusion reaction stops infusion but not automatically both drugs forever',{active_infusion_reaction:true},'withhold',(r,m)=>assert(m.rows.every(x=>x.componentId==='bevacizumab'&&x.actionType==='withhold')));
run('00746','Caution is individual review',{bevacizumab_caution_requires_review:true},'consultant_review');

// The real dose model must preserve all findings and independently govern each component.
run('00746','Low counts do not generate bevacizumab stop',{anc_x10e9_l:.4,protein_24h_g:1},'delay_then_dose_reduce',(r,m)=>assert(m.rows.every(x=>x.componentId==='olaparib')));
run('00746','Bevacizumab hold does not erase source renal olaparib dose',{protein_24h_g:3,crcl_ml_min:40},'withhold',(r,m)=>{
  assert.equal(m.rows.find(x=>x.componentId==='bevacizumab').protocolDose,'No dose now');
  assert.equal(m.rows.find(x=>x.componentId==='olaparib').protocolDose,'200 mg twice daily');
});
run('00746','Confirmed MDS plus bevacizumab hold retains both component decisions',{confirmed_mds_aml:true,protein_24h_g:3},'permanently_discontinue',(r,m)=>{
  assert.equal(m.rows.find(x=>x.componentId==='olaparib').actionType,'permanently_discontinue');
  assert.equal(m.rows.find(x=>x.componentId==='bevacizumab').actionType,'withhold');
});
run('00746','Confirmed PRES does not authorise olaparib during severe cytopenia',{confirmed_pres:true,anc_x10e9_l:.4},'permanently_discontinue',(r,m)=>{
  assert.equal(m.rows.find(x=>x.componentId==='bevacizumab').actionType,'permanently_discontinue');
  assert.equal(m.rows.find(x=>x.componentId==='olaparib').actionType,'delay_then_dose_reduce'); noNumber(m);
});
structure('Separate combination clocks and monitoring survive schedule rendering',()=>{
  const p=protocols['00746'],m=D.buildModel(p);
  assert.equal(p.treatment.cycle_length_days,21);assert.equal(m.phases[0].cycleLength,21);
  const ola=m.phases[0].components.find(c=>c.drug.toLowerCase().includes('olaparib'));
  const bev=m.phases[0].components.find(c=>c.drug.toLowerCase().includes('bevacizumab'));
  assert.deepEqual(ola.days,['Every day']);assert.equal(ola.dose,'300 mg twice daily');assert.equal(bev.dose,'15 mg/kg');
  assert(p.monitoring.regular.some(r=>r.frequency==='every_3_weeks'&&r.duration_months===12));
  assert(protocols['00588'].monitoring.regular.some(r=>r.frequency==='every_4_weeks'&&r.duration_months===12));
  assert.match(p.supportive_care.breastfeeding,/6 months/);assert.equal(p.supportive_care.emetogenic_risk,'oral_moderate_high');
  assert.deepEqual(p.dose_levels.map(x=>x.dose_mg_twice_daily),[300,250,200]);
});
structure('Dose action HTML names the affected component',()=>{
  const nodes=new Map();
  const node=id=>{if(!nodes.has(id)){const classes=new Set(['hidden']);nodes.set(id,{innerHTML:'',classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),toggle:(x,on)=>on?classes.add(x):classes.delete(x),contains:x=>classes.has(x)},addEventListener(){},scrollIntoView(){}});}return nodes.get(id);};
  const context={document:{getElementById:node},console};vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root,'js/protocol-dose-schedule.js'),'utf8'),context);
  const p=protocols['00746'],r=E.assess(p,{confirmed_mds_aml:true,protein_24h_g:3}),api=context.SACTCheckProtocolDoseSchedule;
  api.prepare(p);api.updateAssessment(r);api.open(p);
  const html=node('jsonDoseSchedulePanel').innerHTML;
  assert.match(html,/olaparib/i);assert.match(html,/bevacizumab/i);assert.match(html,/Not to be administered/);assert.match(html,/No dose now/);
});
for(const code of Object.keys(protocols)) structure(code+' every reviewed source rule has a positive scenario',()=>{
  const missing=protocols[code].rule_engine.rules.map(r=>r.rule_id||r.id).filter(id=>!covered[code].has(id));assert.deepEqual(missing,[]);
});
const report={checked_at:new Date().toISOString(),release:'0.84.63',scope:'NCCP 00588 and 00746 source boundaries, indication isolation and component dose actions',clinical_use_authorised:false,
  protocols:Object.fromEntries(Object.entries(protocols).map(([code,p])=>[code,{id:p.protocol_id,rules:p.rule_engine.rules.length,inputs:Object.keys(p.input_definitions).length,covered_rules:covered[code].size,sha256:crypto.createHash('sha256').update(fs.readFileSync(process.env.OLAPARIB_PROTOCOL_DIR?path.join(process.env.OLAPARIB_PROTOCOL_DIR,code+'.json'):path.join(root,files[code]))).digest('hex')}])),
  total:results.length,passed:results.filter(x=>x.pass).length,failed:results.filter(x=>!x.pass).length,cases:results};
if(process.env.OLAPARIB_CASE_REPORT){fs.mkdirSync(path.dirname(process.env.OLAPARIB_CASE_REPORT),{recursive:true});fs.writeFileSync(process.env.OLAPARIB_CASE_REPORT,JSON.stringify(report,null,2)+'\n');}
for(const item of results.filter(x=>!x.pass))console.error(item.code||'',item.name,item.error);
console.log(`Olaparib source cases: ${report.passed}/${report.total}; 00588 ${covered['00588'].size}/${protocols['00588'].rule_engine.rules.length} rules; 00746 ${covered['00746'].size}/${protocols['00746'].rule_engine.rules.length} rules.`);
process.exitCode=report.failed?1:0;
