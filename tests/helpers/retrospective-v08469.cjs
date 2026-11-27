'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const RECORD = path.join(root, 'validation/gynae-v08469/patient-assets.json');
const NEW_ROUTES = ["00246", "00300", "00312", "00375", "00676"];
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const bytes = fs.readFileSync(RECORD);
assert.equal(digest(bytes), '30d09d6817c48136be013ae49334b02dedfbca4fd9b7a0e98236efeb06bf9a84');
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
    const release = require('./live-release-v08464.cjs');
    const next = release.gynae70Inventory().record.files[file];
    if (next) {
      assert.equal(next.before, entry.after, file + ' predecessor digest');
      assert.equal(next.before_bytes, entry.after_bytes, file + ' predecessor size');
      release.verifyFile(file);
    } else {
      assert.equal(actual.length, entry.after_bytes, file);
      assert.equal(digest(actual), entry.after, file);
    }
  }
  return record;
}
function expectedHash(file, previous) {
  const entry=reviewed.files[file];
  return entry ? require('./live-release-v08464.cjs').expected(file,entry.after,entry.after_bytes).sha256 : previous;
}
function expectedBytes(file, previous) {
  const entry=reviewed.files[file];
  return entry ? require('./live-release-v08464.cjs').expected(file,entry.after,entry.after_bytes).bytes : previous;
}
const priorInventory = require('./retrospective-v08468.cjs').inventory;
const releaseRoutes = NEW_ROUTES;
const inventory = Object.fromEntries(Object.entries(priorInventory).map(([key,value])=>[key,value+NEW_ROUTES.length]));
function approvedPath(file) { return Object.hasOwn(reviewed.files,file); }
function beforeHash(file) { return reviewed.files[file]?.before; }
module.exports = { beforeHash, releaseRoutes, inventory, approvedPath, RECORD, NEW_ROUTES, createMigration, expectedHash, expectedBytes };
