const assert = require('assert');
const fs = require('fs');
const path = require('path');
const RuleEngine = require('../js/rule-engine.js');

const root = path.resolve(__dirname, '..');
const ui = fs.readFileSync(path.join(root, 'js', 'generic-assessment-ui.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const protocol = {
  rule_engine: {
    action_priority: ['delay', 'proceed'],
    rules: [{
      rule_id: 'ANC_BELOW_THRESHOLD',
      field: 'anc',
      operator: '<',
      value: 1,
      action: { type: 'delay' }
    }]
  }
};
const result = RuleEngine.evaluate(protocol, { anc: 0.8 }, {});
assert.strictEqual(result.findings.length, 1);
assert.deepStrictEqual(result.findings[0].condition, { field: 'anc', operator: '<', value: 1 });
assert(ui.includes('renderThresholdComparison(finding, result)'), 'Result renderer must show threshold comparison');
assert(ui.includes('Protocol cutoff'), 'Protocol cutoff label is missing');
assert(ui.includes('patient-value'), 'Patient value styling is missing');
assert(html.includes('.threshold-comparison-row'), 'Threshold comparison CSS is missing');
console.log('v0.34.0 threshold comparison tests passed');
