'use strict';
const assert = require('node:assert/strict');
const engine = require('../js/assessment-engine');
const validator = require('../js/protocol-validator');
const adc = require('../protocols/gynaecology/00921-mirvetuximab-soravtansine-therapy.json');
const ep = require('../protocols/shared/00279-cisplatin-75-mg-m2-etoposide-100-mg-m2-and-radiotherapy-21-day.json');
require('../js/emetogenic-risk');
let count = 0;
function finding(protocol, inputs, id, action) {
  const outcome = engine.assess(protocol, inputs);
  assert.deepEqual(outcome.invalid, [], JSON.stringify(inputs));
  assert.deepEqual(outcome.errors, [], JSON.stringify(inputs));
  const actual = outcome.findings.find(row => row.ruleId === id)?.action.type;
  assert.equal(actual, action || undefined, JSON.stringify({inputs, id, actual, action}));
  count++;
}
assert.deepEqual(validator.formatIssues(validator.validate(adc)), []);
assert.equal(validator.validate(ep).errors.length, 0);
assert.equal(adc.indications[0].code, '00921a');
const card=require('../js/regimen-course-metadata').summarise(adc);
assert.equal(card.complete,true);
assert.deepEqual(card.tokens,['Advanced disease','Until progression/toxicity','Day 1 every 21 days']);
for(const field of ['pneumonitis_grade','neuropathy_grade','irr_grade','haematological_grade','other_toxicity_grade']) {
  const def=adc.input_definitions[field];
  assert.equal(def.ctcae_version,'5.0');
  assert.equal(def.grading_source_url,adc.metadata.source_url);
  assert.deepEqual(def.options.map(option=>option.value),[0,1,2,3,4]);
}

assert.equal(adc.metadata.regimen_card.provenance.source_sha256, '52201e464f05bc0be67c828b465a2df67d08a14b45a2d1161ea8927a302e4f51');
assert.deepEqual(adc.dose_levels.map(row => row.dose_mg_per_kg_aibw), [6,5,4]);
assert.match(adc.treatment.dose_basis,/0.9 × height.*92.*0.4/);
const phases = adc.treatment_phases;
assert.deepEqual(phases.map(row => row.phase_id), ['first_infusion','subsequent_infusion']);
assert.deepEqual(adc.input_definitions.treatment_visit.options.map(row=>row.value), phases.map(row=>row.phase_id));
for (const phase of phases) {
  assert.equal(phase.cycle_length_days,21);
  assert.equal(phase.administration[0].dose.unit,'mg/kg AIBW');
  assert.deepEqual(phase.administration[0].days,[1]);
  const risk=global.SACTCheckEmetogenicRisk.get(adc,{treatmentPhase:phase.phase_id});
  assert.equal(risk.level,'moderate');
  assert.equal(risk.proformaUrl,'patient/00921/antiemetic-'+phase.phase_id+'.pdf');
}
assert.match(phases[0].administration[0].note,/1 mg\/min.*30 minutes.*3 mg\/min.*30 minutes.*5 mg\/min/);
assert.match(phases[1].administration[0].note,/highest previously tolerated rate/);
const boundary = (field,id,action,points,extra={}) => {
  for (const [value,triggers] of points) finding(adc,{...extra,[field]:value},id,triggers ? action : null);
};
boundary('age_years','ADULT','withhold',[[17,1],[18,0]]);
boundary('prior_systemic_regimens','PRIOR_LOW','withhold',[[0,1],[1,0]]);
boundary('prior_systemic_regimens','PRIOR_HIGH','withhold',[[3,0],[4,1]]);
boundary('fra_positive_percent','FRA_LOW','withhold',[[74.9,1],[75,0],[100,0]]);
boundary('ecog','ECOG','withhold',[[2,0],[3,1]]);
boundary('crcl_ml_min','RENAL','withhold',[[29.9,1],[30,0]]);
boundary('bilirubin_uln_multiple','HEPATIC','withhold',[[1.5,0],[1.51,1]]);
for(const f of ['hypersensitivity','pregnancy','breastfeeding']) boundary(f,f.toUpperCase(),'contraindicated',[[true,1],[false,0]]);
boundary('baseline_eye_exam','BASELINE_EYE','withhold',[[false,1],[true,0]]);
finding(adc,{treatment_visit:'first_infusion'},'FIRST_DOSE_INFORMATION','consultant_review');
finding(adc,{treatment_visit:'subsequent_infusion'},'FIRST_DOSE_INFORMATION',null);
finding(adc,{new_worsening_eye_symptoms:true},'EYE_REPORT','withhold');
finding(adc,{new_worsening_eye_symptoms:true,eye_report_reviewed:true},'EYE_FINDING_MISSING','consultant_review');
for(const [value,action] of [['nonconfluent','proceed_with_caution'],['confluent','withhold'],['ulcer','withhold'],['perforation','permanently_discontinue']]) finding(adc,{corneal_findings:value},'CORNEA_'+value.toUpperCase(),action);
for (const [grade,rule,action] of [[1,'PNEUMONITIS_G1','proceed_with_caution'],[2,'PNEUMONITIS_G2','withhold'],[3,'PNEUMONITIS_G34','permanently_discontinue'],[4,'PNEUMONITIS_G34','permanently_discontinue']]) finding(adc,{pneumonitis_grade:grade},rule,action);
finding(adc,{assessment_stage:'baseline',neuropathy_grade:3},'NEURO_BASELINE','consultant_review');
finding(adc,{assessment_stage:'baseline',neuropathy_grade:3},'NEURO_G34',null);
finding(adc,{neuropathy_grade:3},'NEURO_STAGE','withhold');
finding(adc,{assessment_stage:'on_treatment',neuropathy_grade:2},'NEURO_G2','withhold');
finding(adc,{assessment_stage:'on_treatment',neuropathy_grade:3},'NEURO_G34','permanently_discontinue');
for(const [grade,rule,action] of [[1,'IRR_1','proceed_with_caution'],[2,'IRR_2','withhold'],[3,'IRR_3','permanently_discontinue'],[4,'IRR_3','permanently_discontinue']]) finding(adc,{irr_grade:grade},rule,action);
boundary('haematological_grade','COUNTS_G34','withhold',[[2,0],[3,1],[4,1]]);
boundary('other_toxicity_grade','OTHER_G4','permanently_discontinue',[[3,0],[4,1]]);
finding(adc,{other_toxicity_grade:3},'OTHER_G3','withhold');
for (const event of ['cornea_ulcer','counts_g34','neuropathy_g2','other_g3']) {
  finding(adc,{recovered_event:event},'RECOVERY_UNCONFIRMED','withhold');
  finding(adc,{recovered_event:event,documented_recovery:true},'RECOVERY_NO_DOSE','consultant_review');
  for(const level of ['6','5','4']) finding(adc,{recovered_event:event,documented_recovery:true,current_dose:level},'RESTART_'+level,level==='4'?'permanently_discontinue':'dose_reduce');
}
for(const [event,days] of [['cornea_confluent',14],['pneumonitis_g2',28]]) {
  const extra={recovered_event:event,documented_recovery:true},id='RECURRENT_OR_PROLONGED_'+event.toUpperCase();
  boundary('event_duration_days',id,'consultant_review',[[days,0],[days+1,1]],extra);
  finding(adc,{...extra,recurrent_event:true,event_duration_days:2},id,'consultant_review');
}
finding(adc,{cannot_tolerate_four:true},'DOSE_FLOOR','permanently_discontinue');
assert.equal(engine.assess(adc,{recovered_event:'counts_g34',documented_recovery:true,current_dose:'6',corneal_findings:'perforation'}).actionType,'permanently_discontinue');

const doseSchedule=require('../js/protocol-dose-schedule');
assert.deepEqual(doseSchedule.buildModel(adc).doseLevels[0].levels.map(row=>row.dose),['6 mg/kg AIBW','5 mg/kg AIBW','4 mg/kg AIBW']);
const afterRecovery={treatment_visit:'subsequent_infusion',current_dose:'6',documented_recovery:true,recovered_event:'counts_g34'};
for(const [extra,action,expected] of [[{},'dose_reduce','5 mg/kg AIBW'],[{irr_grade:2},'withhold','No dose now'],[{corneal_findings:'perforation'},'permanently_discontinue','Not to be administered']]) {
  const result=engine.assess(adc,{...afterRecovery,...extra});
  const row=doseSchedule.buildModificationModel(adc,result).rows[0];
  assert.equal(row.actionType,action);
  assert.equal(row.protocolDose,expected);
}

const cervical = {indication_id:'00279b',assessment_stage:'baseline'};
const confirmed={...cervical,cervical_primary_confirmed:true,off_label_consent_documented:true,local_off_label_acknowledged:true};
for(const id of ['OFFLABEL_CONSENT','OFFLABEL_GOVERNANCE']) {
  finding(ep,cervical,id,'withhold');
  finding(ep,confirmed,id,null);
  finding(ep,{...cervical,indication_id:'00279a'},id,null);
}
finding(ep,cervical,'OTHER_SITE_CONTEXT','consultant_review');
finding(ep,{...cervical,cervical_primary_confirmed:false},'OTHER_SITE_CONTEXT','consultant_review');
finding(ep,confirmed,'OTHER_SITE_CONTEXT',null);
finding(ep,{indication_id:'00279a'},'OTHER_SITE_CONTEXT',null);
for(const ind of ['00279a','00279b']) {
  const cycle={indication_id:ind,cervical_primary_confirmed:true,assessment_stage:'on_treatment',schedule_variant:'iv_21',radiotherapy_plan_confirmed:true,haemodialysis:false};
  const check=(values,id,action)=>finding(ep,{...cycle,...values},id,action);
  // The underlined symbols in NCCP v8 Table 3 are greater-than-or-equal in the PDF.
  check({anc_x10e9_l:1.5,platelets_x10e9_l:100},'COUNT_DECIMAL_GAP',null);
  check({anc_x10e9_l:1.5,platelets_x10e9_l:100},'COUNTS_75',null);
  check({anc_x10e9_l:1.49},'COUNTS_75','consultant_review');
  check({platelets_x10e9_l:99},'COUNTS_75','consultant_review');
  check({anc_x10e9_l:1.495},'COUNT_DECIMAL_GAP','consultant_review');
  check({anc_x10e9_l:0.99},'LOW_ANC','withhold');
  check({platelets_x10e9_l:74},'LOW_PLATELETS','withhold');
  check({assessment_stage:'baseline',crcl_ml_min:59},'BASELINE_CIS_RENAL_EXCLUSION','contraindicated');
  check({assessment_stage:'baseline',crcl_ml_min:60},'BASELINE_CIS_RENAL_EXCLUSION',null);
  check({crcl_ml_min:39,haemodialysis:undefined},'RENAL_DIALYSIS_STATUS','consultant_review');
  check({crcl_ml_min:39},'CIS_RENAL_LT40','contraindicated');
  check({crcl_ml_min:40},'CIS_RENAL_40','consultant_review');
  check({crcl_ml_min:50},'CIS_RENAL_50','consultant_review');
  check({bilirubin_micromol_l:50},'ETO_HEPATIC_REDUCTION','consultant_review');
  check({suitable_for_radiation:false},'RT_UNSUITABLE','contraindicated');
}
console.log(count+' NCCP 00921 and shared 00279 source, decision, recovery and indication checks passed.');
