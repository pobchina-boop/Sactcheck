'use strict';
// Chain the two gynaecology suites to the immutable published olaparib checkpoint.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const prior = require('./olaparib-release-checkpoint.cjs');
const root = path.resolve(__dirname, '../..');
const baseline = '0dd8f23fbdf18895fc1ca2aeb45e5cfa6ac380aa';
const manifestFile = 'validation/gynaecology-00862-00929/release-transition.json';
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const raw = fs.readFileSync(path.join(root, manifestFile));
assert.equal(hash(raw), '44a91ae82598583f22c97c6f5d376840b34360c752e67652caaf8bfb7e2737a6');
const transition = JSON.parse(raw);
assert.equal(transition.base, baseline);
const verifier = fs.readFileSync(__filename, 'utf8').replace(/(assert\.equal\(hash\(raw\), ')[a-f0-9]{64}/, '$1PENDING');
assert.equal(hash(verifier), transition.verifier_sha256);
const historical = (rev, file) => cp.execFileSync('git', ['show', rev+':'+file], {cwd: root, maxBuffer:64*1024*1024});
assert(fs.readFileSync(require.resolve('./olaparib-release-checkpoint.cjs')).equals(historical(baseline,'tests/helpers/live-release-v08464.cjs')));
function verifyFile(file) {
  const e = transition.files[file];
  if (!e) return prior.verifyFile(file);
  const b = fs.readFileSync(path.join(root,file));
  assert.equal(hash(b), e.after, file+' audited bytes');
  assert.equal(b.length, e.after_bytes, file+' audited length');
}
function isCurrent(file, digest, size) {
  const e = transition.files[file];
  return e ? digest === e.after && (size === undefined || size === e.after_bytes) : prior.isCurrent(file,digest,size);
}
function expected(file,digest,size) {
  const e = transition.files[file];
  if (!e) return prior.expected(file,digest,size);
  if (!isCurrent(file,digest,size)) {
    const source = prior.expected(file,digest,size);
    assert.equal(source.sha256,e.before,file+' predecessor digest');
    if (source.bytes !== undefined) assert.equal(source.bytes,e.before_bytes,file+' predecessor size');
  }
  return {sha256:e.after,bytes:e.after_bytes};
}
function checkedHistorical(file,rev) {
  const e=transition.files[file];
  verifyFile(file);
  const before=historical(baseline,file);
  assert.equal(hash(before),e.before,file+' published predecessor');
  assert.equal(before.length,e.before_bytes);
  return rev===baseline ? before : historical(rev,file);
}
const astraBytes = file => transition.files[file] ? checkedHistorical(file,'51bded8c59210c052873b577af444f07579fd44f') : prior.astraBytes(file);
const approvedJson = file => transition.files[file] ? JSON.parse(checkedHistorical(file,baseline)) : prior.approvedJson(file);
const addition = file => file === manifestFile || transition.files[file]?.before === null || prior.addition(file);
function owns(file) {
  if (file === manifestFile) return true;
  if (!Object.hasOwn(transition.files,file)) return prior.owns(file);
  verifyFile(file); return true;
}
function gynaecologyInventory() {
  return {version:63,record:transition,helper:{approvedPath(file) {
    if (!Object.hasOwn(transition.files,file)) return false;
    verifyFile(file);
    return true;
  }}};
}
module.exports = {...prior,gynaecologyInventory,expected,isCurrent,verifyFile,owns,addition,astraBytes,astraJson:f=>JSON.parse(astraBytes(f)),approvedJson};
