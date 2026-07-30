const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const pkg = require(path.join(root, 'package.json'));
const catalogue = require(path.join(root, 'protocols/index.json'));
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const genericUi = fs.readFileSync(path.join(root, 'js/generic-assessment-ui.js'), 'utf8');
const doseSource = fs.readFileSync(path.join(root, 'js/protocol-dose-schedule.js'), 'utf8');
const doseCss = fs.readFileSync(path.join(root, 'css/protocol-dose-schedule.css'), 'utf8');

assert.strictEqual(pkg.version, '0.52.0');
assert(html.includes('<title>SACTCheck v0.52.0 — Protocol Dose &amp; Schedule</title>'));
assert(html.includes('<span class="header-version">v0.52.0</span>'));
assert(html.includes('v0.52.0 · What changed?'));
assert(html.includes('css/protocol-dose-schedule.css?v=0.52.0'));
assert(html.includes('js/protocol-dose-schedule.js?v=0.52.0'));
assert(html.indexOf('js/protocol-dose-schedule.js?v=0.52.0') < html.indexOf('js/generic-assessment-ui.js?v=0.52.0'), 'Dose schedule module must load before generic UI.');
assert(genericUi.includes('id="jsonDoseScheduleButton"'));
assert(genericUi.includes('id="jsonDoseSchedulePanel"'));
assert(genericUi.includes('SACTCheckProtocolDoseSchedule?.prepare'));
assert(genericUi.includes('SACTCheckProtocolDoseSchedule?.open'));
assert(doseCss.includes('.dose-schedule-panel'));

const context = { console, globalThis: {} };
context.globalThis = context;
vm.createContext(context);
vm.runInContext(doseSource, context);
const DoseSchedule = context.SACTCheckProtocolDoseSchedule;
assert(DoseSchedule, 'Protocol Dose & Schedule module did not initialise.');
assert.strictEqual(DoseSchedule.version, '0.52.0');

let scheduleCoverage = 0;
let selectableDoseCoverage = 0;
let structuredPhaseCoverage = 0;
let structuredTreatmentCoverage = 0;
let modificationCoverage = 0;

for (const entry of catalogue.protocols) {
  const protocol = require(path.join(root, entry.path));
  const model = DoseSchedule.buildModel(protocol);
  if (DoseSchedule.hasData(protocol)) scheduleCoverage += 1;
  if (model.doseLevels.length) selectableDoseCoverage += 1;
  if (Array.isArray(protocol.treatment_phases) && protocol.treatment_phases.length) structuredPhaseCoverage += 1;
  if (protocol.treatment && typeof protocol.treatment === 'object') structuredTreatmentCoverage += 1;
  if (model.modificationRules.length) modificationCoverage += 1;
}

assert.strictEqual(catalogue.protocols.length, 376);
assert.strictEqual(scheduleCoverage, 328, `Expected 328 protocols with structured schedule data, found ${scheduleCoverage}.`);
assert.strictEqual(structuredPhaseCoverage, 65);
assert.strictEqual(structuredTreatmentCoverage, 264);
assert(selectableDoseCoverage >= 23, `Expected at least 23 protocols with selectable dose levels, found ${selectableDoseCoverage}.`);
assert(modificationCoverage >= 350, `Expected broad source-linked modification coverage, found ${modificationCoverage}.`);

const folfox = require(path.join(root, 'protocols/gastrointestinal/00209-modified-folfox6.json'));
const folfoxModel = DoseSchedule.buildModel(folfox);
assert.strictEqual(folfoxModel.phases.length, 1);
assert.strictEqual(folfoxModel.phases[0].cycleLength, 14);
assert.deepStrictEqual(
  Array.from(folfoxModel.phases[0].components, item => item.drug),
  ['Oxaliplatin', 'Folinic acid', 'Bolus 5-FU', 'Infusional 5-FU']
);
assert.strictEqual(folfoxModel.doseLevels.length, 4);
assert(folfoxModel.modificationRules.some(item => item.components.includes('oxaliplatin')));

const paclitaxel = require(path.join(root, 'protocols/breast/00621-paclitaxel-weekly-3-of-4.json'));
const paclitaxelModel = DoseSchedule.buildModel(paclitaxel);
assert.strictEqual(paclitaxelModel.phases[0].cycleLength, 28);
assert.deepStrictEqual(Array.from(paclitaxelModel.phases[0].components[0].days), ['1', '8', '15', '22']);
assert.strictEqual(paclitaxelModel.doseLevels[0].levels.length, 3);
assert(paclitaxelModel.doseLevels[0].levels.some(level => /65/.test(level.dose)));

const cybord = require(path.join(root, 'protocols/haemato-oncology/plasma-cell/00273-cybord-21-day.json'));
const cybordModel = DoseSchedule.buildModel(cybord);
assert.strictEqual(cybordModel.phases[0].cycleLength, 21);
assert.deepStrictEqual(
  Array.from(cybordModel.phases[0].components, item => item.drug),
  ['Bortezomib', 'Cyclophosphamide', 'Dexamethasone']
);
assert.deepStrictEqual(Array.from(cybordModel.phases[0].components[0].days), ['1', '4', '8', '11']);

assert(!/<input[^>]+type=["']number/i.test(doseSource), 'The first iteration must not create patient-specific numeric dose inputs.');
assert(!/oncoassist/i.test(doseSource), 'No ONCOassist link should be included in the first iteration.');
assert(/does not calculate BSA/i.test(doseSource));
assert(/does not calculate a patient-specific dose/i.test(doseSource));

console.log(`v0.52.0 Protocol Dose & Schedule tests passed: ${scheduleCoverage} protocols with schedule data, ${selectableDoseCoverage} with selectable dose levels and ${modificationCoverage} with encoded modification pathways.`);
