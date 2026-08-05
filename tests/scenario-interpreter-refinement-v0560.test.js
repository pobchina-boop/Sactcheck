const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const scenario = require(path.join(root, 'js', 'scenario-interpreter.js'));
global.SACTCheckScenarioInterpreter = scenario;
const globalInterpreter = require(path.join(root, 'js', 'global-scenario-interpreter.js'));

function json(relative) {
  return JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
}

const analysis = globalInterpreter.analyseScenario('my patient is on bevicizumab, the patient systolic blood pressure is 190? what to do?');
assert.strictEqual(globalInterpreter.version, '0.56.0');
assert.strictEqual(scenario.version, '0.56.0');
assert.ok(analysis.regimens.some(item => item.id === 'bevacizumab'), 'Misspelled bevacizumab was not recognised.');
assert.ok(analysis.corrections.some(item => /bevicizumab.*Bevacizumab/i.test(item)), 'Typo correction was not made transparent.');
assert.ok(analysis.candidateValues.some(item => item.key === 'systolic_bp' && item.value === 190), 'Systolic blood pressure was not extracted before regimen selection.');
assert.deepStrictEqual(analysis.codes, [], 'Blood pressure was incorrectly interpreted as an NCCP number.');

const candidates = [
  json('protocols/shared/00215-bevacizumab-15mgkg.json'),
  json('protocols/gastrointestinal/00446-bevacizumab-modified-folfox6.json'),
  json('protocols/gynaecology/00716-bevacizumab-15-mg-kg-carboplatin-auc-5-and-paclitaxel-175-mg-m-therapy.json'),
  json('protocols/neuro-oncology/00813-bevacizumab-5-mg-kg-monotherapy-14-day.json')
];
const matchResult = globalInterpreter.matchProtocols('bevicizumab, systolic blood pressure 190', candidates.map(protocol => ({ protocol })));
assert.ok(matchResult.matches.length > 1, 'Medication-only scenario should return several possible protocols.');
assert.ok(matchResult.matches.every(item => /bevacizumab/i.test(`${item.title} ${item.protocol?.metadata?.title || ''}`)), 'A non-bevacizumab protocol was returned.');

const selected = candidates[0];
const definitions = Object.entries(selected.input_definitions || {}).map(([id, definition]) => ({ id, ...definition }));
scenario.prepare(selected, definitions, {});
const parsed = scenario.parse('Bevacizumab, systolic blood pressure 190.');
assert.ok(parsed.warnings.some(item => /recognised.*no structured numeric blood pressure field/i.test(item)), 'Missing numeric blood-pressure-field warning was not shown.');
assert.ok(!parsed.extractions.some(item => /blood pressure|systolic|sbp/i.test(`${item.fieldId} ${item.label}`)), 'Numeric BP was incorrectly mapped to a non-numeric protocol criterion.');

const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const globalSource = fs.readFileSync(path.join(root, 'js', 'global-scenario-interpreter.js'), 'utf8');
const inRegimenSource = fs.readFileSync(path.join(root, 'js', 'scenario-interpreter.js'), 'utf8');
assert.ok(index.includes('Clinical scenario interpreter'));
assert.ok(!index.includes('Clinical Scenario Interpreter'));
assert.ok(index.includes('js/global-scenario-interpreter.js?v=0.56.0'));
assert.ok(index.includes('js/scenario-interpreter.js?v=0.56.0'));
assert.ok(globalSource.includes('Candidate clinical information — not assessed yet'));
assert.ok(globalSource.includes('No reliable regimen match was identified.'));
assert.ok(globalSource.includes('groupedMatchMarkup'));
assert.ok(!globalSource.includes('AssessmentEngine.assess'));
assert.ok(inRegimenSource.includes('no treatment action has been generated'));

console.log('v0.56.0 clinical scenario interpreter refinement tests passed.');
