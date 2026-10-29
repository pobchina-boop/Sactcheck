const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const catalogue = require(path.join(root, 'protocols/index.json'));
const source = fs.readFileSync(path.join(root, 'js/protocol-dose-schedule.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css/protocol-dose-schedule.css'), 'utf8');

const context = { console, globalThis: {} };
context.globalThis = context;
vm.createContext(context);
vm.runInContext(source, context);
const DoseSchedule = context.SACTCheckProtocolDoseSchedule;

assert(DoseSchedule);
assert.strictEqual(DoseSchedule.version, '0.55.0');
assert(!source.includes('Protocol dose modification pathways'));
assert(!source.includes('normaliseModificationRules'));
assert(!source.includes('modificationRules'));
assert(!source.includes('Not structured'));
assert(!source.includes('rule_engine'));
assert(css.includes('.dose-level-table .is-selected'));

let usefulCoverage = 0;
let scheduleCoverage = 0;
let doseLevelCoverage = 0;
for (const entry of catalogue.protocols) {
  const protocol = require(path.join(root, entry.path));
  const model = DoseSchedule.buildModel(protocol);
  if (DoseSchedule.hasData(protocol)) usefulCoverage += 1;
  if (model.phases.length) scheduleCoverage += 1;
  if (model.doseLevels.length) doseLevelCoverage += 1;
  assert(!Object.prototype.hasOwnProperty.call(model, 'modificationRules'));
  for (const phase of model.phases) {
    assert(phase.components.length > 0);
    for (const component of phase.components) {
      assert(component.dose, `${entry.id} displayed a schedule component without a dose.`);
      assert(component.days.length, `${entry.id} displayed a schedule component without treatment days.`);
    }
  }
}

assert.strictEqual(catalogue.protocols.length, 377);
// v0.84.9 adds the four previously unstructured targeted schedules; olaparib gains its continuous schedule alongside its existing dose table.
// PLD reductions depend on the toxicity/history pathway, so no generic ladder is inferred.
// v0.84.16 adds the structured lapatinib/capecitabine schedule.
// v0.84.17 adds EC90, EC75, FEC100, FEC50 and AT schedules.
// v0.84.18 adds oral CMF, IV CMF q28/q21 and gemcitabine 800 schedules;
// gemcitabine/carboplatin already had a schedule and is corrected in place.
// v0.84.19 adds structured talazoparib and neratinib schedules; combination schedules are corrected in place.
// v0.84.22 adds seven structured schedules; three existing schedules are corrected.
// v0.84.23 adds four structured schedules; two IV platinum/etoposide schedules are reconciled.
// v0.84.24 adds five targeted lung schedules and the missing Lonsurf phase.
// v0.84.26 adds erlotinib, gefitinib and two atezolizumab schedules; the third is reconciled.
assert.strictEqual(usefulCoverage, 173);
assert.strictEqual(scheduleCoverage, 173);
assert.strictEqual(doseLevelCoverage, 58);

const incomplete = require(path.join(root, 'protocols/gastrointestinal/00451-5-fluorouracil-4-day-mitomycin-and-radiotherapy.json'));
assert.strictEqual(DoseSchedule.hasData(incomplete), false, 'Incomplete placeholder-only schedule should not display the button.');

const folfox = require(path.join(root, 'protocols/gastrointestinal/00209-modified-folfox6.json'));
const folfoxModel = DoseSchedule.buildModel(folfox);
assert.strictEqual(folfoxModel.phases[0].cycleLength, 14);
assert.strictEqual(folfoxModel.phases[0].components[0].dose, '85 mg/m²');
assert.deepStrictEqual(
  Array.from(folfoxModel.doseLevels[0].levels, item => `${item.label}: ${item.dose}`),
  ['Starting dose: 85 mg/m²', 'Dose level -1: 65 mg/m²', 'Dose level -2: 50 mg/m²', 'Dose level -3: discontinue']
);

const paclitaxelCombination = require(path.join(root, 'protocols/breast/00507-pertuzumab-trastuzumab-paclitaxel.json'));
const paclitaxelModel = DoseSchedule.buildModel(paclitaxelCombination);
assert.strictEqual(paclitaxelModel.phases.length, 2);
assert.deepStrictEqual(paclitaxelModel.phases[0].components.map(c=>c.id), ['pertuzumab','trastuzumab','paclitaxel']);
assert.deepStrictEqual(paclitaxelModel.phases[1].components.map(c=>c.id), ['pertuzumab','trastuzumab']);
assert.strictEqual(paclitaxelModel.doseLevels[0].levels[1].dose, '65 mg/m²');

const olaparib = require(path.join(root, 'protocols/shared/00588-olaparib-tablet-monotherapy.json'));
const olaparibModel = DoseSchedule.buildModel(olaparib);
assert.strictEqual(olaparibModel.doseLevels[0].levels[0].dose, '300 mg twice daily');

console.log(`v0.52.1 clarity guarantees retained in v0.55.0: ${usefulCoverage} useful protocols, ${scheduleCoverage} complete schedules and ${doseLevelCoverage} genuine dose-level tables.`);

const abemaciclib = require('../protocols/breast/00619-abemaciclib-adjuvant.json');
assert.deepStrictEqual(Array.from(DoseSchedule.buildModel(abemaciclib).doseLevels[0].levels, x=>x.dose), ['150 mg twice daily','100 mg twice daily','50 mg twice daily']);
