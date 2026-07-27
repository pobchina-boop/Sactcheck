const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'js', 'ctcae-descriptors.js'), 'utf8'), context);
const lib = context.window.SACTCheckCTCAE;
assert(lib, 'CTCAE descriptor library did not initialise');
assert(lib.version.includes('0.48.4'));
assert(lib.sourceUrlV6.endsWith('/ctcae-v6.pdf'));

const composite = {
  id: 'grade4_neutropenia_with_grade2_fever',
  label: 'Grade 4 neutropenia with ≥grade 2 fever',
  type: 'boolean'
};
const compositeGuide = lib.guide(composite);
assert.strictEqual(compositeGuide.category, 'neutropenia_with_fever');
assert.strictEqual(compositeGuide.version, 'CTCAE v6.0');
assert(compositeGuide.grades[4].description.includes('<0.1 ×10⁹/L'));
assert.strictEqual(compositeGuide.related.length, 2);
assert(compositeGuide.related.some(item => item.term === 'Fever'));
assert(compositeGuide.related.some(item => item.term === 'Febrile neutropenia'));
assert(compositeGuide.comparison.grades[4].description.includes('<0.5 ×10⁹/L'));
assert(compositeGuide.note.includes('must not silently redefine'));

const anc = { id: 'anc_x10e9_l', label: 'ANC', type: 'number', unit: '×10⁹/L' };
assert.strictEqual(lib.categoryFor(anc), 'neutrophil_count_decreased');
assert.strictEqual(lib.gradeForValue(anc, 0.4).grade, 3);
assert.strictEqual(lib.gradeForValue(anc, 0.08).grade, 4);
assert.strictEqual(lib.gradeForValue({ ...anc, ctcae_version: '5.0' }, 0.4).grade, 4);

const platelets = { id: 'platelets_x10e9_l', label: 'Platelets', type: 'number', unit: '×10⁹/L' };
assert.strictEqual(lib.categoryFor(platelets), 'thrombocytopenia');
assert.strictEqual(lib.gradeForValue(platelets, 20).grade, 3);
assert.strictEqual(lib.gradeForValue(platelets, 8).grade, 4);
assert.strictEqual(lib.gradeForValue({ ...platelets, ctcae_version: '5.0' }, 20).grade, 4);

const hbDl = { id: 'haemoglobin', label: 'Haemoglobin', type: 'number', unit: 'g/dL' };
const hbL = { id: 'haemoglobin_g_l', label: 'Haemoglobin', type: 'number', unit: 'g/L' };
assert.strictEqual(lib.gradeForValue(hbDl, 7.5).grade, 3);
assert.strictEqual(lib.gradeForValue(hbL, 75).grade, 3);
assert.strictEqual(lib.gradeForValue(hbDl, 9).grade, 2);

const wbc = { id: 'wbc_x10e9_l', label: 'White blood cell count', type: 'number', unit: '×10⁹/L' };
assert.strictEqual(lib.gradeForValue(wbc, 0.8).grade, 4);
assert.strictEqual(lib.gradeForValue(wbc, 1.5).grade, 3);

const temperature = { id: 'current_temperature_c', label: 'Current temperature', type: 'number', unit: '°C' };
assert.strictEqual(lib.gradeForValue(temperature, 37.8).grade, 0);
assert.strictEqual(lib.gradeForValue(temperature, 38.5).grade, 1);
assert.strictEqual(lib.gradeForValue(temperature, 39.5).grade, 2);
assert.strictEqual(lib.gradeForValue(temperature, 40.5).grade, null);
assert(lib.gradeForValue(temperature, 40.5).description.includes('duration is required'));

const occurrence = { id: 'day1_anc_low_occurrence', label: 'Occurrence number: Day 1 ANC <1.5', type: 'select' };
assert.strictEqual(lib.guide(occurrence), null, 'Occurrence fields should not receive a laboratory grading panel');

const thrombocytopeniaGuide = lib.guide({ id: 'thrombocytopenia_grade', label: 'Thrombocytopenia grade', type: 'select' });
assert.strictEqual(thrombocytopeniaGuide.category, 'thrombocytopenia');
assert(thrombocytopeniaGuide.grades[3].description.includes('<50 to 10'));
assert(thrombocytopeniaGuide.comparison.grades[4].description.includes('<25'));

const febrileGuide = lib.guide({ id: 'febrile_neutropenia_grade', label: 'Febrile neutropenia grade', type: 'select', ctcae_version: '5.0' });
assert.strictEqual(febrileGuide.version, 'CTCAE v5.0');
assert(febrileGuide.grades[3].description.includes('single temperature >38.3°C'));

const ui = fs.readFileSync(path.join(root, 'js', 'generic-assessment-ui.js'), 'utf8');
assert(ui.includes('${escapeHtml(guide.version)} grading — ${escapeHtml(guide.term)}'));
assert(ui.includes('data-ctcae-calculated'));
assert(ui.includes('Show ${escapeHtml(guide.comparison.version)}'));
assert(ui.includes('Open the ${escapeHtml(guide.sourceLabel)} source'), 'Source label must be version-aware');

const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert(index.includes('SACTCheck v0.48.4 — oral anti-cancer service filter'));
assert(index.includes('js/ctcae-descriptors.js?v=0.48.4'));
assert(index.includes('ctcae-calculated-grade'));
assert(fs.existsSync(path.join(root, 'CTCAE_HAEMATOLOGY_SOURCE_REGISTER_v0.48.4.md')));

console.log('v0.48.4 CTCAE haematology tests passed: exact v6 grading, v5 comparisons and educational auto-grading verified.');
