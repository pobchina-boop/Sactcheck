const assert = require('assert');
const fs = require('fs');
const path = require('path');
const Engine = require('../js/assessment-engine.js');

const read = file => JSON.parse(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'));
const pembro = read('protocols/breast/00857-pembro-carbo-paclitaxel-ac.json');
const olaparib = read('protocols/shared/00588-olaparib-tablet-monotherapy.json');

function assessOlaparib(overrides = {}) {
  return Engine.assess(olaparib, {
    indication_id: 'first_line_advanced_ovarian_maintenance',
    anc_x10e9_l: 2,
    platelets_x10e9_l: 200,
    haematological_toxicity_occurrence_number: 0,
    febrile_neutropenia: false,
    febrile_neutropenia_grade: 0,
    crcl_ml_min: 70,
    haemodialysis: false,
    child_pugh_class: 'A',
    cyp3a_inhibitor_class: 'none',
    current_dose_level: 'starting',
    ...overrides
  }, { profileId: 'default' });
}

function assessPembroDay1(overrides = {}) {
  return Engine.assess(pembro, {
    cycle_number: 2,
    day_number: 1,
    anc_x10e9_l: 2,
    platelets_x10e9_l: 200,
    gfr_ml_min: 90,
    alt_ratio_uln: 1,
    bilirubin_ratio_uln: 1,
    neuropathy_grade: 0,
    active_pembrolizumab_irae: false,
    febrile_neutropenia: false,
    anc_below_0_5_duration_days: 0,
    platelet_nadir_x10e9_l: 200,
    bleeding_tendency: false,
    haematological_delay_days: 0,
    haematological_delay_occurrence: 0,
    neuropathy_occurrence: 0,
    neuropathy_persistent_or_second_occurrence: false,
    other_non_haematological_toxicity_grade: 0,
    paclitaxel_non_haematological_toxicity_grade: 0,
    paclitaxel_dose_reduction_count: 0,
    paclitaxel_delay_days: 0,
    ...overrides
  }, { profileId: 'neoadjuvant_cycles_1_to_4_day_1' });
}

function assessPembroDay8(overrides = {}) {
  return Engine.assess(pembro, {
    cycle_number: 2,
    day_number: 8,
    anc_x10e9_l: 2,
    platelets_x10e9_l: 200,
    alt_ratio_uln: 1,
    bilirubin_ratio_uln: 1,
    neuropathy_grade: 0,
    neuropathy_occurrence: 0,
    neuropathy_persistent_or_second_occurrence: false,
    other_non_haematological_toxicity_grade: 0,
    paclitaxel_non_haematological_toxicity_grade: 0,
    paclitaxel_dose_reduction_count: 0,
    paclitaxel_delay_days: 0,
    ...overrides
  }, { profileId: 'neoadjuvant_cycles_1_to_4_day_8_or_15' });
}

function assessAc(overrides = {}) {
  return Engine.assess(pembro, {
    cycle_number: 5,
    anc_x10e9_l: 2,
    platelets_x10e9_l: 200,
    crcl_ml_min: 70,
    bilirubin_umol_l: 10,
    child_pugh_class: 'A',
    lvef_percent: 60,
    active_pembrolizumab_irae: false,
    haemodialysis: false,
    ...overrides
  }, { profileId: 'neoadjuvant_cycles_5_to_8_day_1' });
}

const cases = [
  ['olaparib normal proceeds', assessOlaparib(), 'proceed'],
  ['olaparib renal dose reduction', assessOlaparib({ crcl_ml_min: 40 }), 'dose_reduce'],
  ['olaparib low counts delays/reduces', assessOlaparib({ anc_x10e9_l: 0.7 }), 'delay_then_dose_reduce'],
  ['olaparib fourth occurrence ceases', assessOlaparib({ haematological_toxicity_occurrence_number: 4 }), 'cease'],
  ['pembro/carbo/paclitaxel day 1 normal proceeds', assessPembroDay1(), 'proceed'],
  ['pembro/carbo/paclitaxel day 1 low ANC delays', assessPembroDay1({ anc_x10e9_l: 0.8 }), 'delay'],
  ['pembro/carbo/paclitaxel day 8 normal proceeds', assessPembroDay8(), 'proceed'],
  ['pembro/carbo/paclitaxel day 8 low ANC omits paclitaxel', assessPembroDay8({ anc_x10e9_l: 0.4 }), 'omit'],
  ['AC normal proceeds', assessAc(), 'proceed'],
  ['AC low counts delays', assessAc({ anc_x10e9_l: 0.8 }), 'delay'],
  ['AC unlisted count combination requires review', assessAc({ anc_x10e9_l: 1.2, platelets_x10e9_l: 100 }), 'consultant_review'],
  ['active irAE requires review', assessPembroDay1({ active_pembrolizumab_irae: true }), 'consultant_review']
];

for (const [name, result, expected] of cases) {
  assert.equal(result.actionType, expected, `${name}: expected ${expected}, got ${result.actionType}\n${JSON.stringify(result.findings, null, 2)}`);
  assert.equal(result.complete, true, `${name}: expected complete assessment`);
  console.log(`✓ ${name}`);
}

const incomplete = Engine.assess(olaparib, { anc_x10e9_l: 2 }, { profileId: 'default' });
assert.equal(incomplete.actionType, 'incomplete');
assert.equal(incomplete.complete, false);
assert.ok(incomplete.missing.length > 0);
console.log('✓ missing inputs return incomplete');

console.log(`\n${cases.length + 1} engine tests passed.`);
