const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pkg = require(path.join(root, 'package.json'));
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const uiSource = fs.readFileSync(path.join(root, 'js/generic-assessment-ui.js'), 'utf8');
const doseSource = fs.readFileSync(path.join(root, 'js/protocol-dose-schedule.js'), 'utf8');
const doseCss = fs.readFileSync(path.join(root, 'css/protocol-dose-schedule.css'), 'utf8');
const Dose = require(path.join(root, 'js/protocol-dose-schedule.js'));
const Engine = require(path.join(root, 'js/assessment-engine.js'));

assert.strictEqual(pkg.version, '0.52.5');
assert.strictEqual(Dose.version, '0.52.5');
assert(html.includes('SACTCheck v0.52.5 — Dose Action Navigation'));
assert(html.includes('js/protocol-dose-schedule.js?v=0.52.5'));
assert(html.includes('js/generic-assessment-ui.js?v=0.52.5'));

// Laboratory and clinical-toxicity separation.
[
  'Bloods and organ function',
  'jsonHaematologyInputGrid',
  'jsonRenalInputGrid',
  'jsonHepaticInputGrid',
  'jsonOtherLaboratoryInputGrid',
  'Clinical toxicities',
  'Other treatment criteria',
  'jsonDoseModificationPrompt'
].forEach(text => assert(uiSource.includes(text), `Missing v0.52.5 interface marker: ${text}`));
assert(uiSource.includes('laboratoryDomain(definition)'));
assert(uiSource.includes('isCtcaeToxicity(definition)'));
assert(uiSource.includes('SACTCheckProtocolDoseSchedule?.updateAssessment'));
assert(doseCss.includes('.dose-modification-prompt'));
assert(doseCss.includes('.laboratory-domain'));

// The dose workspace remains short of a patient-specific calculator.
assert(!/<input[^>]+type=["']number/i.test(doseSource));
assert(!/oncoassist/i.test(doseSource));
assert(doseSource.includes('No BSA, weight-based or patient-specific final dose is calculated'));

const ac = require(path.join(root, 'protocols/breast/00252-ac-doxorubicin-cyclophosphamide.json'));
const acModel = Dose.buildModel(ac);
assert.strictEqual(acModel.phases[0].components[0].dose, '60 mg/m²');
assert.strictEqual(acModel.phases[0].components[1].dose, '600 mg/m²');

let result = Engine.assess(ac, { anc: 1.2, platelets: 80 }, {});
let modification = Dose.buildModificationModel(ac, result, acModel);
assert.strictEqual(modification.title, 'Protocol dose modification applies');
assert.strictEqual(modification.labTriggered, true);
assert.deepStrictEqual(
  modification.rows.map(row => [row.component, row.protocolDose]).sort(),
  [['Cyclophosphamide', '450 mg/m²'], ['Doxorubicin', '45 mg/m²']]
);

result = Engine.assess(ac, { egfr: 'renal_0_9' }, {});
modification = Dose.buildModificationModel(ac, result, acModel);
assert.strictEqual(modification.rows[0].component, 'Cyclophosphamide');
assert.strictEqual(modification.rows[0].protocolDose, '300 mg/m²');
assert(modification.rows[0].trigger.includes('<10 mL/min'));

result = Engine.assess(ac, { anc: 1.2, platelets: 80, bilirubin_uln_multiple: 4 }, {});
modification = Dose.buildModificationModel(ac, result, acModel);
const doxorubicin = modification.rows.find(row => row.component === 'Doxorubicin');
const cyclophosphamide = modification.rows.find(row => row.component === 'Cyclophosphamide');
assert.strictEqual(doxorubicin.actionLabel, 'Omit component');
assert.strictEqual(doxorubicin.protocolDose, 'Not to be administered');
assert.strictEqual(doxorubicin.allActions.length, 2, 'The more restrictive action must govern without hiding the other triggered dose rule.');
assert.strictEqual(cyclophosphamide.protocolDose, '450 mg/m²');

result = Engine.assess(ac, { anc: 0.8 }, {});
modification = Dose.buildModificationModel(ac, result, acModel);
assert(modification.rows.every(row => row.protocolDose === 'No dose now'));

const folfox = require(path.join(root, 'protocols/gastrointestinal/00209-modified-folfox6.json'));
result = Engine.assess(folfox, { neuropathy_grade: 2 }, {});
modification = Dose.buildModificationModel(folfox, result, Dose.buildModel(folfox));
assert.strictEqual(modification.rows[0].component, 'Oxaliplatin');
assert.strictEqual(modification.rows[0].actionLabel, 'Dose level -1');
assert.strictEqual(modification.rows[0].protocolDose, '65 mg/m²');
assert.strictEqual(modification.labTriggered, false);

result = Engine.assess(ac, {}, {});
modification = Dose.buildModificationModel(ac, result, acModel);
assert.strictEqual(modification.rows.length, 0, 'Blank values must not imply a dose modification or standard-dose suitability.');

console.log('v0.52.5 integrated laboratory and protocol dose-modification tests passed.');
