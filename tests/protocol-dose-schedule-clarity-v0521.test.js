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

assert.strictEqual(catalogue.protocols.length, require('./helpers/live-inventory-v08462.cjs').total);
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
// v0.84.37 adds four source-audited NET schedules; generic dose ladders remain absent.
// v0.84.40 adds exactly five source-audited skin schedules.
// v0.84.42 supplies seven complete source-audited skin schedules.
// v0.84.45 adds cisplatin RT (weekly/3-weekly) and two pembrolizumab/platinum/5-FU schedules.
// v0.84.47 adds exactly five audited H&N schedules. 00696 also exposes
// its explicit source dose-level table; assessment retains recovery/history guards.
// v0.84.56 supplies usable source schedules for cabazitaxel and radium-223;
// the three docetaxel schedules are reconciled in place.
// v0.84.57 adds four renal monotherapy schedules, with no invented generic dose ladders.
// The two GI schedules retain structured coverage. NCCP 00953 adds the 256th.
const endometrial=require('../protocols/gynaecology/00953-durvalumab-carboplatin-paclitaxel.json');
assert(DoseSchedule.hasData(endometrial));
assert.equal(DoseSchedule.buildModel(endometrial).phases.length,2);
const combination=require('../protocols/gynaecology/00746-olaparib-tablet-and-bevacizumab-therapy.json');
assert(DoseSchedule.hasData(combination));
const combinationModel=DoseSchedule.buildModel(combination);
assert(combinationModel.phases.length && combinationModel.doseLevels.length);
const gynaecologyCombination=require('../protocols/gynaecology/00929-dostarlimab-paclitaxel-and-carboplatin-therapy.json');
const auditedPhases=DoseSchedule.buildModel(gynaecologyCombination).phases;
assert.deepEqual(Array.from(auditedPhases, phase => phase.id), ['combination','maintenance']);
assert.equal(auditedPhases[0].components.length,3);
assert.equal(auditedPhases[1].components.length,1);
assert.equal(auditedPhases[1].components[0].id,'dostarlimab');
assert.equal(auditedPhases[1].cycleLength,42);
assert.match(auditedPhases[1].intervalLabel,/3 weeks after cycle 6/);
const newSarcomaSchedules = ['00100','00462','00504','00596','00680','00754','00757'];
for (const code of newSarcomaSchedules) {
  const row = catalogue.protocols.find(p => p.path.includes('/'+code+'-'));
  const previous = JSON.parse(require('node:child_process').execFileSync('git',['show','68063d01357a61bf5ec9dffcb7e6ccdc0145d2a7:'+row.path],{cwd:root}));
  assert.equal(DoseSchedule.hasData(previous),false);
  assert(DoseSchedule.buildModel(require(path.join(root,row.path))).phases.length);
}
const gynaeSchedules = ['00308','00819'];
for (const code of gynaeSchedules) {
  const row = catalogue.protocols.find(entry=>entry.path.includes('/'+code+'-'));
  const previous=JSON.parse(require('node:child_process').execFileSync('git',['show','eb2bf4aa5b0e7a2de3b50c386517b68d1e059d7d:'+row.path],{cwd:root}));
  assert.equal(DoseSchedule.hasData(previous),false);
  const model=DoseSchedule.buildModel(require(path.join(root,row.path)));
  assert.deepEqual(Array.from(model.phases,phase=>phase.cycleLength),code==='00308'?[21]:[21,42]);
}
assert.strictEqual(usefulCoverage,258+newSarcomaSchedules.length+gynaeSchedules.length);
assert.strictEqual(scheduleCoverage,258+newSarcomaSchedules.length+gynaeSchedules.length);
assert.strictEqual(doseLevelCoverage, 67);
// v61 adds precisely the source-reviewed 00719 schedule and dose-level table.
// The other three GIST protocols retain their prior structured-model coverage.
for(const code of ['00244','00325','00335','00719']){
 const entry=catalogue.protocols.find(p=>p.path.includes('/'+code+'-'));
 const current=require(path.join(root,entry.path));require('./helpers/gist-inputs-v08461.cjs').validate(current);
 const before=JSON.parse(require('node:child_process').execFileSync('git',['show','b9f502e43794579e732431354ceb5314981b78ad:'+entry.path],{cwd:root}));
 const a=DoseSchedule.buildModel(before),b=DoseSchedule.buildModel(current);
 assert.equal(DoseSchedule.hasData(before),code==='00244');
 assert.equal(DoseSchedule.hasData(current),['00244','00719'].includes(code));
 assert.equal(b.phases.length-a.phases.length,code==='00719'?1:0);
 assert.equal(b.doseLevels.length-a.doseLevels.length,code==='00719'?1:0);
}
// v58/v59 add exactly these fifteen structured schedules; no generic dose ladders.
for(const code of ['00282','00622','00628','00450','00759','00333','00337','00338','00583','00846','00453','00602','00885','00894','00945']){
 const entry=catalogue.protocols.find(p=>p.path.includes('/'+code+'-'));
 const p=require(path.join(root,entry.path));
 assert(require('./helpers/gu-inputs-v08458.cjs').validate(p),code+' reviewed source contract');
 const before=JSON.parse(require('node:child_process').execFileSync('git',['show','0eba2249a65dce9bcdf6be1b2115869b9563cd38:'+entry.path],{cwd:root}));
 assert.equal(DoseSchedule.hasData(before),false,code+' exact Git57 schedule baseline');
 assert.equal(DoseSchedule.hasData(p),true);assert.equal(DoseSchedule.buildModel(p).phases.length,1);
 assert.equal(DoseSchedule.buildModel(p).doseLevels.length,0,code+' no inferred dose ladder');
}

for(const code of ['00104','00326','00518','00564']){
 const entry=catalogue.protocols.find(p=>p.path.includes('/'+code+'-'));
 const p=require(path.join(root,entry.path));require('./helpers/prostate-inputs-v08457.cjs').validate(p);
 const before=JSON.parse(require('node:child_process').execFileSync('git',['show','90ae67a0a3f565cb57f73072137c52c4851fec5b:'+entry.path],{cwd:root}));
 assert.equal(DoseSchedule.hasData(before),false,code+' exact Git56 schedule baseline');
 assert.equal(DoseSchedule.hasData(p),true);assert(DoseSchedule.buildModel(p).phases.length>0);
 assert.equal(DoseSchedule.buildModel(p).doseLevels.length,0,code+' dose-history safeguards remain in assessment');
}

for(const code of ['00314','00552','00417','00418','00696']){
 const entry=catalogue.protocols.find(p=>p.path.includes('/'+code+'-'));
 const p=require(path.join(root,entry.path));require('./helpers/head-neck-inputs-v08447.cjs').validate(p);
 const before=JSON.parse(require('./helpers/retrospective-v08447.cjs').readFrozen(entry.path));
 assert.equal(DoseSchedule.hasData(before),false,code+' exact Git46 coverage baseline');
 const current=DoseSchedule.buildModel(p);assert.equal(DoseSchedule.hasData(p),true);assert(current.phases.length>0);
 assert.equal(current.doseLevels.length,code==='00696'?1:0,code+' only explicit source dose ladder');
}

// Exactly five additional source-audited glioma schedules; dose-history decisions remain in assessment.
for(const code of ['00334','00342','00379','00461','00658']) {
 const entry=catalogue.protocols.find(p=>p.path.includes('/'+code+'-'));
 const protocol=require(path.join(root,entry.path));
 assert.equal(protocol.metadata.clinical_audit_release,'0.84.38');
 assert(DoseSchedule.buildModel(protocol).phases.length>0,code+' must expose authored phase components');
 assert.equal(DoseSchedule.buildModel(protocol).doseLevels.length,0,code+' must not infer a generic dose ladder');
}

for(const code of ['00236','00415','00563','00431','00812']) {
 const entry=catalogue.protocols.find(p=>p.path.includes('/'+code+'-'));
 const protocol=require(path.join(root,entry.path));
 require('./helpers/skin-inputs-v08440.cjs').validate(protocol);
 assert(DoseSchedule.buildModel(protocol).phases.length>0,code+' source-authored skin schedule');
 assert.equal(DoseSchedule.buildModel(protocol).doseLevels.length,0,code+' no generic dose ladder in place of component/history-specific rules');
}
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

for(const code of ['00742','00804','00805','00806','00813']){const entry=catalogue.protocols.find(p=>p.path.includes('/'+code+'-'));const p=require(path.join(root,entry.path));assert.equal(p.metadata.clinical_audit_release,'0.84.39');assert(DoseSchedule.buildModel(p).phases.length>0);assert.equal(DoseSchedule.buildModel(p).doseLevels.length,0);}
