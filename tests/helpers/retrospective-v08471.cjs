'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const RECORD = path.join(root, 'validation/gynae-v08471/patient-assets.json');
const NEW_ROUTES = ["00267", "00301", "00904"];
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const bytes = fs.readFileSync(RECORD);
assert.equal(digest(bytes), '01652f78f300d239bf44b30b6806f9d9959330dc6d5eadee5cfbac4955849ad8');
const reviewed = JSON.parse(bytes);
function createMigration(record) {
  assert.deepEqual(record, reviewed);
  assert.deepEqual(record.routes, NEW_ROUTES);
  for (const [file, entry] of Object.entries(record.files)) {
    assert(NEW_ROUTES.some(route => ['patient', 'docs/patient'].some(prefix => path.dirname(file) === prefix + '/' + route)));
    if (entry.before !== null) {
      const before=require('node:child_process').execFileSync('git',['show',reviewed.base+':'+file],{cwd:root,maxBuffer:32*1024*1024});
      assert.equal(digest(before),entry.before,file);
    }
    const actual = fs.readFileSync(path.join(root,file));
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
const priorInventory = require('./retrospective-v08470.cjs').inventory;
const releaseRoutes = NEW_ROUTES;
const inventory = Object.fromEntries(Object.entries(priorInventory).map(([key,value])=>[key,value+NEW_ROUTES.length]));
function approvedPath(file) { return Object.hasOwn(reviewed.files,file); }
function beforeHash(file) { return reviewed.files[file]?.before; }
module.exports = { beforeHash, releaseRoutes, inventory, approvedPath, RECORD, NEW_ROUTES, createMigration, expectedHash, expectedBytes };
