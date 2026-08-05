const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const interpreter = require(path.join(root, 'js', 'scenario-interpreter.js'));
const lonsurf = JSON.parse(fs.readFileSync(path.join(root, 'protocols', 'gastrointestinal', '00382-trifluridine-tipiracil.json'), 'utf8'));
const definitions = Object.entries(lonsurf.input_definitions).map(([id, definition]) => ({ id, ...definition }));

interpreter.prepare(lonsurf, definitions, {});
let parsed = interpreter.parse('Metastatic CRC on Lonsurf, ANC 0.3, afebrile, cycle 3 day 1, current dose 30 mg/m2 twice daily.');
let byId = new Map(parsed.extractions.map(item => [item.fieldId, item]));
assert.strictEqual(byId.get('anc_x10e9_l').value, '0.3');
assert.ok(!byId.has('febrile_neutropenia'));
assert.ok(parsed.warnings.some(item => /fever status/i.test(item)));
assert.strictEqual(byId.get('cycle_number').value, '3');
assert.strictEqual(byId.get('current_dose_mg_m2_bd').value, '30');
assert.ok(parsed.extractions.every(item => item.confirmed === true));

parsed = interpreter.parse('ANC 0.3, MRN 12345678');
assert.ok(parsed.warnings.some(item => /patient-identifiable information/i.test(item)));

const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'js', 'generic-assessment-ui.js'), 'utf8');
const immune = fs.readFileSync(path.join(root, 'js', 'immunotherapy-safety.js'), 'utf8');
assert.ok(index.includes('js/scenario-interpreter.js?v=0.55.0'));
assert.ok(index.includes('css/scenario-interpreter.css?v=0.55.0'));
assert.ok(ui.includes('jsonScenarioInterpreterButton'));
assert.ok(ui.includes('jsonScenarioInterpreterPanel'));
assert.ok(ui.includes('applyScenarioValues'));
assert.ok(immune.includes('Immunotherapy toxicity map'));
assert.ok(immune.includes('Go to rash inputs'));
assert.ok(!immune.includes('Immune-mediated toxicity map'));

console.log('v0.55.0 constrained scenario interpreter tests passed.');
