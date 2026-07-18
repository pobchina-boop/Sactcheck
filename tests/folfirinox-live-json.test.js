const assert = require('assert');
const fs = require('fs');
const path = require('path');
const Engine = require('../js/assessment-engine.js');
const Validator = require('../js/protocol-validator.js');
const protocol = JSON.parse(fs.readFileSync(path.join(__dirname, '../protocols/gastrointestinal/00329-folfirinox.json'), 'utf8'));
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
assert.ok(result.findings.some(f => f.ruleId === 'DAY1_COUNTS_HOLD'));
result = assess({ bilirubin_ratio_uln: 3.2 });
assert.equal(result.actionType, 'contraindicated');
result = assess({ diarrhoea_current_grade: 2, toxicity_delay_weeks: 0 });
assert.equal(result.actionType, 'withhold');
result = assess({ neuropathy_pattern: 'grade4_any_duration' });
assert.equal(result.actionType, 'discontinue');
console.log('✓ FOLFIRINOX live JSON assessment tests passed');
