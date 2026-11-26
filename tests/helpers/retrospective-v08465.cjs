'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const RECORD = path.join(root, 'validation/gynae-v08465/patient-assets.json');
const NEW_ROUTES = ["00303", "00306", "00308", "00624", "00819"];
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const bytes = fs.readFileSync(RECORD);
assert.equal(digest(bytes), '059a58c0cff3724a86a158d2dc15d990c27f9e93a1f50400e2e9257daddaf951');
const reviewed = JSON.parse(bytes);
function createMigration(record) {
  assert.deepEqual(record, reviewed);
  assert.deepEqual(record.routes, NEW_ROUTES);
  for (const [file, entry] of Object.entries(record.files)) {
    assert(NEW_ROUTES.some(route => ['patient', 'docs/patient'].some(prefix => path.dirname(file) === prefix + '/' + route)));
    assert.equal(entry.before, null);
    const next=require('./retrospective-v08466.cjs');
    const changed=next.approvedPath(file);
    const actual=changed ? require('node:child_process').execFileSync('git',['show','3368f80d8c6f0390ccd085b34609a87cbea4cf50:'+file],{cwd:root,maxBuffer:32*1024*1024}) : fs.readFileSync(path.join(root,file));
    if (changed) assert.equal(next.beforeHash(file),entry.after,file);
    assert.equal(actual.length, entry.after_bytes, file);
    assert.equal(digest(actual), entry.after, file);
  }
  return record;
}
function expectedHash(file, previous) {
  return reviewed.files[file]?.after ?? previous;
}
function expectedBytes(file, previous) {
  return reviewed.files[file]?.after_bytes ?? previous;
}
const priorInventory = require('./retrospective-v08464.cjs').inventory;
const releaseRoutes = NEW_ROUTES;
const inventory = Object.fromEntries(Object.entries(priorInventory).map(([key,value])=>[key,value+NEW_ROUTES.length]));
function approvedPath(file) { return Object.hasOwn(reviewed.files,file); }
module.exports = { releaseRoutes, inventory, approvedPath, RECORD, NEW_ROUTES, createMigration, expectedHash, expectedBytes };
