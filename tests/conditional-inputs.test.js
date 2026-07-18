const assert = require('assert');
const fs = require('fs');
const path = require('path');
const Engine = require('../js/assessment-engine.js');
const Validator = require('../js/protocol-validator.js');

function read(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8'));
}

const olaparib = read('protocols/shared/00588-olaparib-tablet-monotherapy.json');
const paclitaxel = read('protocols/shared/00226-paclitaxel-monotherapy-weekly.json');

const olaparibCore = {
  indication_id: 'first_line_advanced_ovarian_maintenance',
  anc_x10e9_l: 2,
  platelets_x10e9_l: 200,
  febrile_neutropenia: false,
  crcl_ml_min: 70,
  current_dose_level: 'starting'
};

let result = Engine.assess(olaparib, olaparibCore, { profileId: 'default' });
assert.equal(result.complete, false);
assert.equal(result.actionType, 'proceed_with_caution');
assert.ok(result.unassessed.some(item => item.id === 'child_pugh_class'));
assert.ok(result.unassessed.some(item => item.id === 'cyp3a_inhibitor_class'));
console.log('✓ optional olaparib domains remain explicit gaps without blocking assessed-domain findings');

let definitions = Engine.getInputDefinitions(olaparib, 'default', olaparibCore);
let grade = definitions.find(item => item.id === 'febrile_neutropenia_grade');
let occurrence = definitions.find(item => item.id === 'haematological_toxicity_occurrence_number');
let dialysis = definitions.find(item => item.id === 'haemodialysis');
assert.equal(grade.visible, false);
assert.equal(grade.required, false);
assert.equal(occurrence.visible, false);
assert.equal(dialysis.visible, false);
console.log('✓ irrelevant olaparib conditional fields remain hidden');

const fnInputs = { ...olaparibCore, febrile_neutropenia: true };
definitions = Engine.getInputDefinitions(olaparib, 'default', fnInputs);
grade = definitions.find(item => item.id === 'febrile_neutropenia_grade');
occurrence = definitions.find(item => item.id === 'haematological_toxicity_occurrence_number');
assert.equal(grade.visible, true);
assert.equal(grade.required, true);
assert.equal(occurrence.visible, true);
assert.equal(occurrence.required, true);
result = Engine.assess(olaparib, fnInputs, { profileId: 'default' });
assert.equal(result.complete, false);
assert.equal(result.actionType, 'delay_then_dose_reduce');
assert.ok(result.unassessed.some(item => item.id === 'febrile_neutropenia_grade'));
assert.ok(result.unassessed.some(item => item.id === 'haematological_toxicity_occurrence_number'));
console.log('✓ febrile neutropenia gives an immediate action while dependent fields remain coverage gaps');

const renalInputs = { ...olaparibCore, crcl_ml_min: 25 };
definitions = Engine.getInputDefinitions(olaparib, 'default', renalInputs);
dialysis = definitions.find(item => item.id === 'haemodialysis');
assert.equal(dialysis.visible, true);
assert.equal(dialysis.required, true);
result = Engine.assess(olaparib, renalInputs, { profileId: 'default' });
assert.equal(result.complete, false);
assert.equal(result.actionType, 'consultant_review');
assert.ok(result.unassessed.some(item => item.id === 'haemodialysis'));
console.log('✓ severe renal impairment remains actionable while dialysis status is an explicit coverage gap');

const paclitaxelNormal = {
  indication_id: '00226a_metastatic_breast',
  assessment_type: 'routine',
  treatment_day: '1',
  cycle_number: 1,
  original_dose_mg_m2: 80,
  current_dose_mg_m2: 80,
  anc_x10e9_l: 2,
  platelets_x10e9_l: 200,
  febrile_neutropenia: false,
  alt_ratio_uln: 1,
  bilirubin_ratio_uln: 1,
  neuropathy_grade: 0,
  other_nonhaematological_highest_grade: 0
};
definitions = Engine.getInputDefinitions(paclitaxel, 'default', paclitaxelNormal);
let duration = definitions.find(item => item.id === 'anc_below_0_5_duration_days');
assert.equal(duration.visible, false);
assert.equal(duration.required, false);
definitions = Engine.getInputDefinitions(paclitaxel, 'default', { ...paclitaxelNormal, anc_x10e9_l: 0.4 });
duration = definitions.find(item => item.id === 'anc_below_0_5_duration_days');
assert.equal(duration.visible, true);
assert.equal(duration.required, true);
console.log('✓ weekly paclitaxel ANC-duration field is conditionally displayed and required');

const invalid = JSON.parse(JSON.stringify(paclitaxel));
invalid.input_definitions.anc_below_0_5_duration_days.required_when.field = 'undefined_trigger';
let validation = Validator.validate(invalid, { strict: true });
assert.equal(validation.valid, false);
assert.ok(validation.errors.some(item => item.code === 'INPUT_CONDITION_FIELD_UNDEFINED'));
console.log('✓ validator blocks conditional inputs that reference undefined triggers');

const selfReference = JSON.parse(JSON.stringify(paclitaxel));
selfReference.input_definitions.anc_below_0_5_duration_days.required_when.field = 'anc_below_0_5_duration_days';
validation = Validator.validate(selfReference, { strict: true });
assert.equal(validation.valid, false);
assert.ok(validation.errors.some(item => item.code === 'INPUT_CONDITION_SELF_REFERENCE'));
console.log('✓ validator blocks self-referential conditional inputs');

console.log('\n7 conditional-input tests passed.');
