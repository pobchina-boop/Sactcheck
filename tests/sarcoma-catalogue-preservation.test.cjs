'use strict';

const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const published = '68063d01357a61bf5ec9dffcb7e6ccdc0145d2a7';
const reviewed = '5b063b3f390cfe9a5a324c4615a3fba3a6eb8878';
const integratedCodes = new Set([
  '00374','00228','00205','00462','00554','00391','00392',
  '00420','00463','00100','00596','00680','00675','00747','00504','00754','00757'
]);
function git(...args) {
  return execFileSync('git', args, {cwd: root, maxBuffer: 24 * 1024 * 1024});
}
function recordPaths(revision) {
  const inventory = JSON.parse(git('show', revision + ':protocols/index.json'));
  assert.equal(inventory.protocol_count, 378);
  return inventory.protocols.map(entry => entry.path).sort();
}
const paths = recordPaths(published);
assert.deepEqual(recordPaths(reviewed), paths);
assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, 'protocols/index.json'))).protocols.map(entry => entry.path).sort(), paths);
const protectedCodes = new Set();
for (const file of paths) {
  const code = path.basename(file).slice(0,5);
  const reference = integratedCodes.has(code) ? reviewed : published;
  const expected = git('show', reference + ':' + file);
  const actual = fs.readFileSync(path.join(root,file));
  if (['00303','00306','00308','00624','00819'].includes(code)) {
    const release = require('./helpers/live-release-v08464.cjs');
    const transition = release.gynae65Inventory().record.files[file];
    assert(expected.equals(git('show',release.gynae65Inventory().record.base+':'+file)),file+' predecessor');
    assert.equal(require('node:crypto').createHash('sha256').update(expected).digest('hex'),transition.before,file);
    release.verifyFile(file);
  } else if (['00620','00716','00769','00771','00772'].includes(code)) {
    const release = require('./helpers/live-release-v08464.cjs');
    const {record} = release.gynae66Inventory();
    assert(expected.equals(git('show',record.base+':'+file)),file+' predecessor');
    assert.equal(require('node:crypto').createHash('sha256').update(expected).digest('hex'),record.files[file].before,file);
    release.verifyFile(file);
  } else if (['00499','00766','00799','00811','00817'].includes(code)) {
    const release = require('./helpers/live-release-v08464.cjs');
    const {record} = release.gynae68Inventory();
    assert(expected.equals(git('show',record.base+':'+file)),file+' predecessor');
    release.verifyFile(file);
  } else if (["00246", "00300", "00312", "00375", "00676"].includes(code)) {
    const release = require('./helpers/live-release-v08464.cjs');
    const {record} = release.gynae69Inventory();
    assert(expected.equals(git('show',record.base+':'+file)),file+' predecessor');
    release.verifyFile(file);
  } else if (["00247", "00248", "00249", "00264", "00266"].includes(code)) {
    const release = require('./helpers/live-release-v08464.cjs');
    const {record} = release.gynae70Inventory();
    assert(expected.equals(git('show',record.base+':'+file)),file+' predecessor');
    release.verifyFile(file);
  } else if (["00267", "00301", "00904"].includes(code)) {
    const release = require('./helpers/live-release-v08464.cjs');
    const {record} = release.gynae71Inventory();
    assert(expected.equals(git('show',record.base+':'+file)),file+' predecessor');
    release.verifyFile(file);
  } else if (code === '00812') {
    const hash = buffer => require('node:crypto').createHash('sha256').update(buffer).digest('hex');
    assert.equal(hash(expected), '343bf7d8b4123b959bf6b1b2174f307be931c26c1f84f615bf105df0e7726ad2');
    assert.equal(hash(actual), '619e27c96b5e4d80dc9519f6cc54a5b75515185860c60f072b3633b9fa49d3a9');
    const current = JSON.parse(actual);
    const original = JSON.parse(expected);
    delete current.input_definitions.immune_hepatitis_assessed;
    assert.equal(current.rule_engine.rules.pop().rule_id, 'HEPATIC_ATTRIBUTION_REVIEW');
    for (const rule of current.rule_engine.rules) {
      if (!['HEPATITIS_HOLD', 'HEPATITIS_STOP'].includes(rule.rule_id)) continue;
      const oldRule = original.rule_engine.rules.find(r => r.rule_id === rule.rule_id);
      assert.deepEqual(rule.when.all[1], oldRule.when, 'Original numeric liver thresholds are retained');
      for (const key of ['when', 'source', 'action', 'explanation']) rule[key] = oldRule[key];
    }
    assert.deepEqual(current, original, 'Only the shared immunotherapy hepatitis changes may differ');
  } else if (code === '00419') {
    const original = JSON.parse(expected);
    const current = JSON.parse(actual);
    const additional = current.metadata.regimen_card.contexts.pop();
    assert.equal(additional.id, '00419-gyn');
    assert.equal(additional.planned_cycles, 6);
    assert.equal(additional.cycle_length_days, 7);
    assert.deepEqual(current, original, 'Only the reviewed cervical regimen card may change');
    require('./helpers/live-release-v08464.cjs').verifyFile(file);
  } else if (code === '00344') {
    const release = require('./helpers/live-release-v08464.cjs');
    const {record} = release.flot67Inventory();
    assert(expected.equals(git('show',record.base+':'+file)),file+' FLOT predecessor');
    assert.equal(require('node:crypto').createHash('sha256').update(expected).digest('hex'),record.files[file].before,file);
    release.verifyFile(file);
  } else if (code === '00205') {
    const prior = JSON.parse(expected);
    const breast = prior.assessment_by_indication['00205a'];
    breast.input_definitions.current_to_original_pld_ratio.input_role = 'decision';
    for (const key of ['input_definitions','rule_engine']) prior[key] = breast[key];
    assert.deepEqual(JSON.parse(actual), prior, 'Only the two common 00205 assessment fields may change');
  } else {
    assert(actual.equals(expected), file + ' must match its reviewed Git blob');
  }
  if (integratedCodes.has(code)) protectedCodes.add(code);
}
assert.deepEqual(protectedCodes, integratedCodes);
console.log(paths.length + ' clinical records checked against published main or the reviewed sarcoma source.');
