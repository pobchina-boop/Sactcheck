const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const pkg = require(path.join(root, 'package.json'));
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const uiSource = fs.readFileSync(path.join(root, 'js', 'generic-assessment-ui.js'), 'utf8');
const ctcaeSource = fs.readFileSync(path.join(root, 'js', 'ctcae-descriptors.js'), 'utf8');

assert.strictEqual(pkg.version, '0.52.4');
assert(html.includes('SACTCheck v0.52.4 — Compact Clinical Inputs &amp; Phase Naming'));
assert(html.includes('v0.52.4 · What changed?'));
assert(html.includes('js/generic-assessment-ui.js?v=0.52.4'));
assert(html.includes('js/protocol-dose-schedule.js?v=0.52.4'));
assert(uiSource.includes('ECOG performance status is not a CTCAE adverse-event grade'));
assert(uiSource.includes('Other treatment criteria'));

const context = {
  console,
  SACTCheckAssessmentEngine: { version: 'test' },
  SACTCheckAssessmentOutput: {},
  SACTCheckAssessmentPdf: {},
  document: {
    readyState: 'loading',
    addEventListener() {},
    querySelector() { return null; },
    getElementById() { return null; }
  }
};
context.globalThis = context;
vm.createContext(context);
vm.runInContext(ctcaeSource, context, { filename: 'ctcae-descriptors.js' });
vm.runInContext(uiSource, context, { filename: 'generic-assessment-ui.js' });

const Classification = context.SACTCheckAssessmentFieldClassification;
const CTCAE = context.SACTCheckCTCAE;
assert(Classification, 'Field-classification helper was not exported.');
assert.strictEqual(Classification.version, '0.52.4');

const pregnancy = { id: 'pregnancy', label: 'Pregnant', type: 'boolean' };
const breastfeeding = { id: 'breastfeeding', label: 'Breastfeeding', type: 'boolean' };
const ecog = {
  id: 'ecog',
  label: 'ECOG performance status',
  type: 'select',
  options: [0, 1, 2, 3, 4].map(value => ({ value, label: String(value) }))
};
const hypersensitivity = { id: 'hypersensitivity', label: 'Relevant hypersensitivity', type: 'boolean' };

assert.strictEqual(Classification.laboratoryDomain(pregnancy), null, 'Pregnancy must not be classified as haematology.');
assert.strictEqual(Classification.laboratoryDomain(breastfeeding), null, 'Breastfeeding must not be classified as a laboratory input.');
assert.strictEqual(Classification.laboratoryDomain(ecog), null, 'ECOG must not be classified as haematology.');
assert.strictEqual(Classification.laboratoryDomain(hypersensitivity), null, 'Hypersensitivity must not be classified as a laboratory input.');
assert.strictEqual(Classification.laboratoryDomain({ id: 'anc', label: 'ANC', unit: '×10⁹/L' }), 'haematology');
assert.strictEqual(Classification.laboratoryDomain({ id: 'platelets', label: 'Platelet count', unit: '×10⁹/L' }), 'haematology');
assert.strictEqual(Classification.laboratoryDomain({ id: 'creatinine_clearance', label: 'Creatinine clearance', unit: 'mL/min' }), 'renal');
assert.strictEqual(Classification.laboratoryDomain({ id: 'bilirubin_x_uln', label: 'Bilirubin × ULN' }), 'hepatic');

assert.strictEqual(CTCAE.guide(ecog), null, 'ECOG must not receive a CTCAE guide.');
assert.strictEqual(CTCAE.optionLabel(ecog, { value: 0, label: '0' }), '0', 'ECOG option must not receive generic CTCAE severity text.');
assert.strictEqual(Classification.ecogOptionLabel({ value: 0, label: '0' }), '0 — Fully active');
assert.strictEqual(Classification.ecogOptionLabel({ value: 4, label: '4' }), '4 — Completely disabled; bed/chair bound');
assert.strictEqual(Object.keys(Classification.ecogLevels).length, 6, 'ECOG guide must include levels 0–5.');
assert(Classification.ecogLevels[2].includes('more than half of waking hours'));
assert(Classification.ecogLevels[5].includes('not an active treatment-assessment state'));

const index = JSON.parse(fs.readFileSync(path.join(root, 'protocols', 'index.json'), 'utf8'));
let scanned = 0;
let protectedCount = 0;
for (const entry of index.protocols) {
  const protocol = JSON.parse(fs.readFileSync(path.join(root, entry.path), 'utf8'));
  for (const [id, raw] of Object.entries(protocol.input_definitions || {})) {
    const definition = { id, ...raw };
    scanned += 1;
    if (/ecog|performance status|pregnan|breastfeed/i.test(`${id} ${raw.label || ''}`)) {
      protectedCount += 1;
      assert.strictEqual(
        Classification.laboratoryDomain(definition),
        null,
        `${entry.path}: ${id} was incorrectly classified as a laboratory input.`
      );
    }
  }
}
assert(scanned > 5000, `Expected a library-wide input scan; saw ${scanned}.`);
assert(protectedCount > 100, `Expected substantial ECOG/reproductive criteria coverage; saw ${protectedCount}.`);

console.log(`v0.52.4 input-classification and ECOG tests passed across ${scanned} input definitions; ${protectedCount} ECOG/reproductive fields protected from laboratory classification.`);
