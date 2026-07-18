const assert = require('assert');
const fs = require('fs');
const path = require('path');
const Engine = require('../js/assessment-engine.js');

const protocol = JSON.parse(fs.readFileSync(
  path.join(__dirname, '..', 'protocols/shared/00226-paclitaxel-monotherapy-weekly.json'),
  'utf8'
));

function base(overrides = {}) {
  return {
    indication_id: '00226a_metastatic_breast',
    assessment_type: 'routine',
    treatment_day: '1',
    cycle_number: 1,
    original_dose_mg_m2: 80,
    current_dose_mg_m2: 80,
    known_hypersensitivity: false,
    breastfeeding: false,
    severe_hepatic_impairment: false,
    anc_x10e9_l: 2,
    platelets_x10e9_l: 200,
    febrile_neutropenia: false,
    alt_ratio_uln: 1,
    bilirubin_ratio_uln: 1,
    neuropathy_grade: 0,
    other_nonhaematological_highest_grade: 0,
    ...overrides
  };
}

function assess(overrides = {}) {
  return Engine.assess(protocol, base(overrides), { profileId: 'default' });
}

const cases = [
  ['normal values proceed', assess(), 'proceed'],
  ['ANC exactly 1.0 proceeds', assess({ anc_x10e9_l: 1 }), 'proceed'],
  ['ANC 0.99 delays', assess({ anc_x10e9_l: 0.99 }), 'delay'],
  ['platelets exactly 90 proceed', assess({ platelets_x10e9_l: 90 }), 'proceed'],
  ['platelets 89 delay', assess({ platelets_x10e9_l: 89 }), 'delay'],
  ['ANC below 0.5 for 6 days delays only', assess({ anc_x10e9_l: 0.49, anc_below_0_5_duration_days: 6 }), 'delay'],
  ['ANC below 0.5 for 7 days delays and reduces', assess({ anc_x10e9_l: 0.49, anc_below_0_5_duration_days: 7 }), 'delay_then_dose_reduce'],
  ['platelets 69 delays and reduces', assess({ platelets_x10e9_l: 69 }), 'delay_then_dose_reduce'],
  ['febrile neutropenia delays and reduces', assess({ febrile_neutropenia: true }), 'delay_then_dose_reduce'],
  ['bilirubin 1.25 has no hepatic reduction', assess({ bilirubin_ratio_uln: 1.25 }), 'proceed'],
  ['bilirubin 1.26 gives 75 percent', assess({ bilirubin_ratio_uln: 1.26 }), 'dose_reduce'],
  ['bilirubin 2.01 gives 50 percent', assess({ bilirubin_ratio_uln: 2.01 }), 'dose_reduce'],
  ['bilirubin 5.01 contraindicated', assess({ bilirubin_ratio_uln: 5.01 }), 'contraindicated'],
  ['transaminases 10 contraindicated', assess({ alt_ratio_uln: 10 }), 'contraindicated'],
  ['grade 2 neuropathy reduces by 10', assess({ neuropathy_grade: 2, previous_dose_reductions: 0 }), 'dose_reduce'],
  ['grade 3 neuropathy discontinues', assess({ neuropathy_grade: 3 }), 'discontinue'],
  ['unresolved other grade 2 toxicity withholds then reduces', assess({ other_nonhaematological_highest_grade: 2, other_nonhaematological_current_grade: 2, previous_dose_reductions: 0 }), 'withhold_then_reduce'],
  ['resolved other grade 2 toxicity reduces', assess({ other_nonhaematological_highest_grade: 2, other_nonhaematological_current_grade: 1, previous_dose_reductions: 0 }), 'dose_reduce'],
  ['baseline ANC 1.49 contraindicated', assess({ assessment_type: 'baseline', anc_x10e9_l: 1.49 }), 'contraindicated']
];

for (const [name, result, expected] of cases) {
  assert.equal(result.actionType, expected, `${name}: expected ${expected}, got ${result.actionType}\n${JSON.stringify(result, null, 2)}`);
  assert.equal(result.complete, true, `${name}: expected complete result`);
  console.log(`✓ ${name}`);
}

const hepatic75 = assess({ bilirubin_ratio_uln: 1.26 });
const hepatic75Finding = hepatic75.findings.find(item => item.ruleId === 'HEPATIC_75_PERCENT');
assert.equal(hepatic75Finding.action.calculated_dose_mg_m2, 60);
console.log('✓ 75% hepatic dose calculation returns 60 mg/m² from 80 mg/m²');

const neuropathy = assess({ neuropathy_grade: 2, previous_dose_reductions: 0 });
const neuropathyFinding = neuropathy.findings.find(item => item.ruleId === 'NEUROPATHY_GRADE_2_REDUCE');
assert.equal(neuropathyFinding.action.calculated_dose_mg_m2, 70);
console.log('✓ grade 2 neuropathy calculates a 10 mg/m² reduction');

const missingDuration = Engine.assess(protocol, base({ anc_x10e9_l: 0.4 }), { profileId: 'default' });
assert.equal(missingDuration.complete, false);
assert.equal(missingDuration.actionType, 'delay');
assert.ok(missingDuration.unassessed.some(item => item.id === 'anc_below_0_5_duration_days'));
console.log('✓ ANC below 0.5 triggers immediate delay while duration remains a dose-refinement gap');

const missingOtherCurrent = Engine.assess(protocol, base({ other_nonhaematological_highest_grade: 2 }), { profileId: 'default' });
assert.equal(missingOtherCurrent.complete, false);
assert.ok(missingOtherCurrent.unassessed.some(item => item.id === 'other_nonhaematological_current_grade'));
assert.ok(missingOtherCurrent.unassessed.some(item => item.id === 'previous_dose_reductions'));
console.log('✓ grade 2 toxicity reveals dependent fields as explicit unresolved coverage');

const optionalGaps = Engine.assess(protocol, {
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
}, { profileId: 'default' });
assert.equal(optionalGaps.complete, false);
assert.equal(optionalGaps.actionType, 'proceed_with_caution');
assert.ok(optionalGaps.unassessed.some(item => item.id === 'known_hypersensitivity'));
console.log('✓ optional exclusion fields do not block but remain visible as coverage gaps');


const ancOnly = Engine.assess(protocol, { anc_x10e9_l: 0.4 }, { profileId: 'default' });
assert.equal(ancOnly.actionType, 'delay');
assert.equal(ancOnly.complete, false);
assert.ok(ancOnly.findings.some(item => item.ruleId === 'ANC_LT_0_5_IMMEDIATE_HOLD'));
console.log('✓ paclitaxel ANC 0.4 alone produces an immediate delay result');

const plateletsOnly = Engine.assess(protocol, { platelets_x10e9_l: 40 }, { profileId: 'default' });
assert.equal(plateletsOnly.actionType, 'delay');
assert.equal(plateletsOnly.complete, false);
assert.ok(plateletsOnly.findings.some(item => item.ruleId === 'PLATELETS_LT_70_IMMEDIATE_HOLD'));
console.log('✓ paclitaxel platelets 40 alone produces an immediate delay result');

const normalAncOnly = Engine.assess(protocol, { anc_x10e9_l: 2 }, { profileId: 'default' });
assert.equal(normalAncOnly.actionType, 'incomplete');
assert.equal(normalAncOnly.complete, false);
console.log('✓ a normal paclitaxel ANC alone does not produce an overall proceed result');

console.log(`\n${cases.length + 8} weekly paclitaxel JSON tests passed.`);
