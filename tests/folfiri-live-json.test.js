const assert = require('assert');
const fs = require('fs');
const path = require('path');
const Engine = require('../js/assessment-engine.js');
const Validator = require('../js/protocol-validator.js');

const protocol = JSON.parse(fs.readFileSync(path.join(__dirname, '../protocols/gastrointestinal/00227-folfiri.json'), 'utf8'));
const validation = Validator.validate(protocol, { strict: true });
assert.equal(validation.valid, true, Validator.formatIssues(validation).join('\n'));

function assess(overrides = {}) {
  const defs = Engine.getInputDefinitions(protocol, 'default');
  const inputs = Object.fromEntries(defs.map(d => [d.id, d.demo_value]));
  return Engine.assess(protocol, { ...inputs, ...overrides }, { profileId: 'default' });
}

let result = assess();
assert.equal(result.complete, true);
assert.equal(result.actionType, 'proceed');

result = assess({ anc_x10e9_l: 1.2, toxicity_delay_weeks: 0 });
assert.equal(result.actionType, 'withhold');
assert.ok(result.findings.some(f => f.ruleId === 'ANC_DAY1_HOLD'));

result = assess({ anc_x10e9_l: 1.8, lowest_anc_during_delay_x10e9_l: 0.8 });
assert.equal(result.actionType, 'dose_reduce');
assert.ok(result.findings.some(f => f.ruleId === 'ANC_DELAY_NADIR_G3'));

result = assess({ platelets_x10e9_l: 80, lowest_platelets_during_delay_x10e9_l: 8 });
assert.equal(result.actionType, 'dose_reduce');
assert.ok(result.findings.some(f => f.ruleId === 'PLATELETS_DELAY_NADIR_G4'));

result = assess({ crcl_ml_min: 8 });
assert.equal(result.actionType, 'dose_reduce');
assert.ok(result.findings.some(f => f.ruleId === 'IRINOTECAN_CRCL_LT10'));

result = assess({ bilirubin_ratio_uln: 3.2 });
assert.equal(result.actionType, 'contraindicated');

result = assess({ diarrhoea_current_grade: 2, toxicity_delay_weeks: 0 });
assert.equal(result.actionType, 'withhold');

result = assess({ diarrhoea_current_grade: 2, toxicity_delay_weeks: 2 });
assert.equal(result.actionType, 'discontinue');

result = assess({ stomatitis_highest_grade: 3 });
assert.equal(result.actionType, 'dose_reduce');
assert.ok(result.findings.some(f => f.ruleId === 'STOMATITIS_HIGHEST_G3'));

console.log('✓ FOLFIRI live JSON assessment tests passed');
