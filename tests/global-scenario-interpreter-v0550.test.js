const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const globalInterpreter = require(path.join(root, 'js', 'global-scenario-interpreter.js'));
const scenarioInterpreter = require(path.join(root, 'js', 'scenario-interpreter.js'));

function readJson(relative) {
  return JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
}

const lonsurf = readJson('protocols/gastrointestinal/00382-trifluridine-tipiracil.json');
const folfox = readJson('protocols/gastrointestinal/00209-modified-folfox6.json');
const weeklyPaclitaxel = readJson('protocols/shared/00226-paclitaxel-monotherapy-weekly.json');
const pembroPaclitaxel = readJson('protocols/breast/00857-pembro-carbo-paclitaxel-ac.json');

let result = globalInterpreter.matchProtocols(
  'Metastatic CRC on Lonsurf and Avastin, ANC 0.3, afebrile and due to restart tomorrow.',
  [{ protocol: folfox }, { protocol: lonsurf }]
);
assert.ok(result.matches.length >= 1, 'Lonsurf scenario did not produce a protocol match.');
assert.strictEqual(result.matches[0].protocol.protocol_id, lonsurf.protocol_id, 'Lonsurf was not the leading match.');
assert.ok(result.matches[0].reasons.includes('Lonsurf'));
assert.ok(result.matches[0].reasons.includes('Colorectal cancer'));
assert.ok(!result.analysis.warnings.length);

result = globalInterpreter.matchProtocols('NCCP 00382, ANC 0.3', [{ protocol: folfox }, { protocol: lonsurf }]);
assert.strictEqual(result.matches[0].protocol.protocol_id, lonsurf.protocol_id, 'Exact NCCP number did not govern matching.');
assert.strictEqual(result.matches[0].confidence, 'Strong match');

result = globalInterpreter.matchProtocols('Breast cancer on weekly Taxol with grade 2 neuropathy', [
  { protocol: weeklyPaclitaxel },
  { protocol: pembroPaclitaxel }
]);
assert.ok(result.matches.length >= 1, 'Paclitaxel scenario did not identify any possible protocol.');
assert.ok(result.matches.every(item => /paclitaxel/i.test(`${item.title} ${item.protocol?.metadata?.title || ''}`)), 'Non-paclitaxel match returned.');

result = globalInterpreter.matchProtocols('MRN 12345678, metastatic CRC on Lonsurf', [{ protocol: lonsurf }]);
assert.ok(result.analysis.warnings.some(item => /patient-identifiable information/i.test(item)));

const definitions = Object.entries(lonsurf.input_definitions).map(([id, definition]) => ({ id, ...definition }));
scenarioInterpreter.prepare(lonsurf, definitions, {});
const parsed = scenarioInterpreter.parse('ANC 0.3, cycle 3, current dose 30 mg/m2 twice daily.');
assert.strictEqual(parsed.extractions.find(item => item.fieldId === 'anc_x10e9_l').value, '0.3');
assert.strictEqual(scenarioInterpreter.version, '0.55.0');

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const globalSource = fs.readFileSync(path.join(root, 'js', 'global-scenario-interpreter.js'), 'utf8');
assert.ok(html.includes('id="globalScenarioInterpreter"'));
assert.ok(html.includes('Clinical scenario interpreter'));
assert.ok(html.includes('Regimen agnostic entry point'));
assert.ok(html.includes('js/global-scenario-interpreter.js?v=0.55.0'));
assert.ok(html.includes('css/global-scenario-interpreter.css?v=0.55.0'));
assert.ok(html.includes('js/scenario-interpreter.js?v=0.55.0'));
assert.ok(globalSource.includes('Select this regimen and continue'));
assert.ok(globalSource.includes('No protocol assessment is produced at this stage.'));
assert.ok(globalSource.includes('draftText: scenarioText()'));
assert.ok(globalSource.includes('autoParse: true'));
assert.ok(!globalSource.includes('AssessmentEngine.assess'));
assert.ok(!globalSource.includes('fetch('));
assert.ok(!globalSource.includes('apiKey'));

console.log('v0.55.0 global clinical scenario interpreter tests passed.');
