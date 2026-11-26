'use strict';
// NCCP NCIS v8 Table 1 p4: Enhertu metoclopramide is scheduled TDS on
// subsequent days. A PRN conversion is an explicit individual/local decision.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const cp = require('node:child_process');
const root = path.resolve(__dirname, '..');
const baseline = 'f3b923b247b5663b2bd90b2ffb352fccc5a347ea';
const read = name => fs.readFileSync(path.join(root, name));
const json = name => JSON.parse(read(name));
const old = name => cp.execFileSync('git', ['show', baseline + ':' + name], {cwd: root, maxBuffer: 8 * 1024 * 1024});
const expected = {
  name: 'Metoclopramide',
  dose: '10 mg orally three times daily',
  timing: 'Subsequent days; exact days and duration to be completed by prescriber',
  note: 'Short-term use, maximum 5 days. Review renal function, neurological contraindications and individual dose limits. Any when-needed plan requires an explicit individual or local prescribing instruction.'
};
const phase = json('data/phase-support-v0838.json');
const authoring = json('data/breast-completion-v08421-authoring.json');
const target = phase.regimens['00776'];
assert.equal(target.length, 1);
assert.deepEqual(target[0].medicines.find(m => m.name === 'Metoclopramide'), expected);
assert.deepEqual(authoring.regimens['00776'].support_plans, target, 'Authored support plan and live registry agree');
assert(!/up to|rescue|when.needed|PRN/i.test(expected.dose + ' ' + expected.timing));
assert(!/Days?\s*2\s*[–-]\s*4/i.test(expected.timing), 'No unsupported fixed subsequent-day range');
assert(target[0].source_links.some(s => /ema\.europa\.eu/.test(s.url) && /metoclopramide/i.test(s.url)), 'EMA duration restriction has its primary source');
assert.deepEqual(target[0].medicines.slice(0, 5).map(({name, dose, timing}) => ({name, dose, timing})), [
  {name: 'Aprepitant', dose: '125 mg orally', timing: 'Day 1 before treatment'},
  {name: 'Ondansetron', dose: '16 mg orally', timing: 'Day 1 before treatment'},
  {name: 'Dexamethasone', dose: '12 mg orally', timing: 'Day 1 before treatment'},
  {name: 'Aprepitant', dose: '80 mg orally once daily', timing: 'Days 2–3'},
  {name: 'Dexamethasone', dose: '8 mg orally once daily', timing: 'Days 2–4'}
]);
assert.match(target[0].medicines.find(m => m.name === 'Ondansetron').note, /8 mg in 24 hours/);
const otherRegimens = value => {
  const copy = structuredClone(value); delete copy.regimens['00776']; return copy;
};
const olaparib = ['0.84.63','0.84.64','0.84.65','0.84.66','0.84.67'].includes(json('package.json').version) ? require('./helpers/retrospective-v08463.cjs') : null;
const inheritedPhase = olaparib ? olaparib.baselineJson('data/phase-support-v0838.json') : phase;
assert.deepEqual(otherRegimens(inheritedPhase), otherRegimens(JSON.parse(old('data/phase-support-v0838.json'))), 'All other live support plans and registry metadata are unchanged in the authenticated Enhertu state');
if (olaparib) {
  const withoutOlaparib = value => {
    const copy = structuredClone(value);
    for (const code of ['00588', '00746', '00862', '00929']) delete copy.regimens[code];
    return copy;
  };
  assert.deepEqual(withoutOlaparib(require('./helpers/live-release-v08464.cjs').approvedJson('data/phase-support-v0838.json')), withoutOlaparib(inheritedPhase), 'Only the four authenticated successor support plans may succeed the Enhertu state; every other plan and all registry metadata remain exact');
  for (const code of ['00588', '00746', '00862', '00929']) {
    assert(Array.isArray(phase.regimens[code]) && phase.regimens[code].length, code + ' keeps an explicit current support plan');
    assert.notDeepEqual(phase.regimens[code], inheritedPhase.regimens[code], code + ' has an explicit reviewed support transition');
  }
}
function historicalFixtureBytes(file) {
  if (!olaparib) return read(file);
  const inherited = olaparib.baselineBytes(file);
  olaparib.assertCurrent(file, olaparib.sha(inherited), inherited.length);
  return inherited;
}

// Run the actual historical generator in two disposable, minimal fixtures.
// Never run this old five-regimen migration against the live registry.
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'enhertu-support-generator-'));
try {
  const generator = 'tools/build-targeted-v0849-support.py';
  if (olaparib) assert(read(generator).equals(historicalFixtureBytes(generator)), 'The original reviewed Enhertu generator remains byte-identical');
  const results = {};
  for (const [kind, script] of [['before', old(generator)], ['after', read(generator)]]) {
    const fixture = path.join(temp, kind);
    for (const file of ['data/phase-support-v0838.json', ...['00414', '00322', '00776', '00794', '00588'].map(code => `data/patient-knowledge/${code}.json`)]) {
      const destination = path.join(fixture, file);
      fs.mkdirSync(path.dirname(destination), {recursive: true});
      fs.writeFileSync(destination, historicalFixtureBytes(file));
    }
    fs.mkdirSync(path.join(fixture, 'tools'), {recursive: true});
    fs.writeFileSync(path.join(fixture, generator), script);
    cp.execFileSync('python3', [path.join(fixture, generator)], {cwd: fixture, stdio: 'pipe'});
    results[kind] = JSON.parse(fs.readFileSync(path.join(fixture, 'data/phase-support-v0838.json')));
  }
  assert.deepEqual(otherRegimens(results.after), otherRegimens(results.before), 'The generator change affects no other regimen or envelope field');
  const before = results.before.regimens['00776'];
  const after = results.after.regimens['00776'];
  assert.match(before[0].medicines.at(-1).dose, /up to three times daily/);
  assert.deepEqual(after[0].medicines.at(-1), expected);
  const repaired = structuredClone(before); repaired[0].medicines[5] = expected;
  assert.deepEqual(after, repaired, 'Only the scheduled metoclopramide record changes in the 00776 generator output');
} finally {
  fs.rmSync(temp, {recursive: true, force: true});
}

const content = json('data/enhertu-patient-review-v08462.json');
const explanation = content.support_explanations.find(m => /metoclopramide/i.test(m.name));
assert(explanation, 'Regimen-specific support explanation retained');
assert.match(explanation.schedule, /three times daily/i);
assert.match(explanation.schedule, /subsequent days/i);
assert.match(explanation.schedule, /prescriber.*exact days.*short.course duration/i);
assert.match(explanation.precautions, /do not continue beyond the prescribed short course/i);
const knowledge = json('data/patient-knowledge/00776.json');
assert.match(knowledge.support.map(s => s.text).join(' '), /metoclopramide/i);

const html = read('patient/00776/support-treatment.html').toString();
const plain = value => value.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const rows = [...html.matchAll(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi)].map(match => plain(match[0]));
const metoclopramide = rows.filter(row => /Metoclopramide/i.test(row));
assert(metoclopramide.length > 0, 'Generated support plan retains its medicine row');
for (const row of metoclopramide) {
  assert.match(row, /10 mg orally three times daily/i);
  assert.match(row, /Subsequent days; exact days and duration to be completed by prescriber/i);
  assert(!/10 mg orally up to|Rescue use \/ duration/i.test(row), 'Old PRN template must not return');
}
assert(!/Individual changes \/ rescue duration|the rescue-medicine duration/i.test(html), 'Scheduled support must not be relabelled as rescue in the prescriber completion field');
assert.match(plain(html), /Individual changes \/ exact support-medicine days and duration/i);
assert.match(plain(html), /prescribed support-medicine durations/i);
console.log('Enhertu scheduled metoclopramide source row, prescriber-completed subsequent days, short-course limit, retained antiemetic doses and authored/live/generated agreement passed. ' + (olaparib ? 'All original support/generator preservation assertions passed against authenticated inherited inputs; current differences are restricted to the two reviewed olaparib plans.' : 'All other support-regimen outputs remain unchanged.'));
