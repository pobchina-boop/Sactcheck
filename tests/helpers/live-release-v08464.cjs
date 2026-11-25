'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const prior = require('./gynaecology-release-checkpoint.cjs');
const root = path.resolve(__dirname, '../..');
const manifest = 'validation/sarcoma-batch-1/production-files.json';
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const raw = fs.readFileSync(path.join(root, manifest));
assert.equal(sha(raw), '7453862c52edc4651b1137f2dea73ebe5e3a324769a093dc070b170e2eadf898');
const {base,files} = JSON.parse(raw);
assert.equal(base, '68063d01357a61bf5ec9dffcb7e6ccdc0145d2a7');
const historical = (ref,file) => cp.execFileSync('git',['show',ref+':'+file],{cwd:root,maxBuffer:64*1024*1024});
assert(fs.readFileSync(require.resolve('./gynaecology-release-checkpoint.cjs')).equals(historical(base,'tests/helpers/live-release-v08464.cjs')));
function verifyFile(file) {
  if (!files[file]) return prior.verifyFile(file);
  const current = fs.readFileSync(path.join(root,file));
  assert.equal(sha(current), files[file].after, file+' sarcoma release bytes');
  assert.equal(current.length, files[file].after_bytes, file+' sarcoma release size');
}
function isCurrent(file,digest,size) {
  const e = files[file];
  return e ? e.after === digest && (size === undefined || e.after_bytes === size) : prior.isCurrent(file,digest,size);
}
function expected(file,digest,size) {
  const e = files[file];
  if (!e) return prior.expected(file,digest,size);
  if (!isCurrent(file,digest,size)) {
    const before = prior.expected(file,digest,size);
    assert.equal(before.sha256,e.before,file+' predecessor digest');
    if (before.bytes !== undefined) assert.equal(before.bytes,e.before_bytes,file+' predecessor size');
  }
  return {sha256:e.after,bytes:e.after_bytes};
}
function archived(file,revision) {
  verifyFile(file);
  const before = historical(base,file);
  assert.equal(sha(before),files[file].before,file+' published predecessor');
  return revision===base ? before : historical(revision,file);
}
const astraBytes = file => files[file] ? archived(file,'51bded8c59210c052873b577af444f07579fd44f') : prior.astraBytes(file);
const approvedJson = file => files[file] ? JSON.parse(archived(file,base)) : prior.approvedJson(file);
function owns(file) {
  if (file===manifest) return true;
  if (!files[file]) return prior.owns(file);
  verifyFile(file); return true;
}
function gynaecologyInventory() {
  const gsk = prior.gynaecologyInventory();
  return {...gsk,helper:{approvedPath(file) {
    if (gsk.record.files[file] && files[file]) { verifyFile(file); return true; }
    return gsk.helper.approvedPath(file);
  }}};
}
function sarcomaInventory() {
  return {version:64,record:{files},helper:{approvedPath(file) {
    if (!files[file]) return false;
    verifyFile(file); return true;
  }}};
}
const addition = file => file===manifest || files[file]?.before === null || prior.addition(file);
module.exports = {...prior,verifyFile,isCurrent,expected,astraBytes,astraJson:f=>JSON.parse(astraBytes(f)),approvedJson,owns,addition,gynaecologyInventory,sarcomaInventory};
