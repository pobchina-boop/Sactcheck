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
