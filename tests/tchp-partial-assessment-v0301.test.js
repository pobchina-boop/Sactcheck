const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const context = { console };
context.globalThis = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync('js/rule-engine.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('js/assessment-engine.js', 'utf8'), context);

const protocol = JSON.parse(fs.readFileSync('protocols/breast/00722-tchp-docetaxel-carboplatin-trastuzumab-pertuzumab.json', 'utf8'));
const Engine = context.SACTCheckAssessmentEngine;

assert.deepEqual(protocol.required_inputs, []);
for (const field of ['cycle_number', 'assessment_stage']) {
  assert.equal(protocol.input_definitions[field].required, false, `${field} must not block a partial assessment`);
}

const lowAnc = Engine.assess(protocol, { anc: '0.8' });
assert.equal(lowAnc.missing.length, 0);
assert.ok(lowAnc.findings.length > 0, 'ANC alone should produce an assessed finding');
assert.notEqual(lowAnc.actionType, 'proceed', 'low ANC must not be cleared');

const lowPlatelets = Engine.assess(protocol, { platelets: '50' });
assert.equal(lowPlatelets.missing.length, 0);
assert.ok(lowPlatelets.findings.length > 0, 'platelets alone should produce an assessed finding');

console.log('v0.30.1 TCHP partial-assessment regression tests passed.');
