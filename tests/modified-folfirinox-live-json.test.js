const assert = require('assert');
const fs = require('fs');
const path = require('path');
const Engine = require('../js/assessment-engine.js');
const Validator = require('../js/protocol-validator.js');
const protocol = JSON.parse(fs.readFileSync(path.join(__dirname, '../protocols/gastrointestinal/00515-modified-folfirinox.json'), 'utf8'));
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
result = assess({ anc_x10e9_l: 1.2, day1_anc_low_occurrence: 1 });
assert.ok(['withhold','dose_reduce'].includes(result.actionType));
assert.ok(result.findings.some(f => f.ruleId === 'ANC_LOW_FIRST'));
result = assess({ bilirubin_ratio_uln: 3.2 });
assert.equal(result.actionType, 'contraindicated');
result = assess({ diarrhoea_highest_grade: 3, diarrhoea_occurrence: 1 });
assert.equal(result.actionType, 'dose_reduce');
result = assess({ hand_foot_syndrome_highest_grade: 3 });
assert.equal(result.actionType, 'dose_reduce');
console.log('✓ Modified FOLFIRINOX live JSON assessment tests passed');
