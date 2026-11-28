'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const RECORD = path.join(root, 'validation/ovarian-v08474/patient-assets.json');
const NEW_ROUTES = ["00203/ovarian", "00212/ovarian", "00215/ovarian", "00226/ovarian", "00621/ovarian"];
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const bytes = fs.readFileSync(RECORD);
assert.equal(digest(bytes), '4074ca5e6bdc29b9fb55d4f9c9d58652a7cc8b137d5d4a9a98dd92b2e15e20a7');
const reviewed = JSON.parse(bytes);
function createMigration(record) {
  assert.deepEqual(record, reviewed);
  assert.deepEqual(record.routes, NEW_ROUTES);
  assert.equal(record.base, '15749dced473f0e3defab8f744a855e0fec08772');
  const baselinePaths = require('node:child_process').execFileSync(
    'git', ['ls-tree', '-r', '-z', '--name-only', record.base, '--', 'patient', 'docs/patient'],
    {cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024}
  );
  const existing = new Set(baselinePaths.split('\0'));
  for (const [file, entry] of Object.entries(record.files)) {
    assert(NEW_ROUTES.some(route => ['patient', 'docs/patient'].some(prefix => path.dirname(file) === prefix + '/' + route)));
    assert.equal(existing.has(file), entry.before !== null, file + ' baseline existence');
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
const priorInventory = require('./retrospective-v08473.cjs').inventory;
const releaseRoutes = NEW_ROUTES;
const inventory = {...priorInventory, codes: priorInventory.codes + NEW_ROUTES.filter(route => !route.includes('/')).length, routes: priorInventory.routes + NEW_ROUTES.length, visualRoutes: priorInventory.visualRoutes + NEW_ROUTES.length};
function approvedPath(file) { return Object.hasOwn(reviewed.files,file); }
function beforeHash(file) { return reviewed.files[file]?.before; }
module.exports = { beforeHash, releaseRoutes, inventory, approvedPath, RECORD, NEW_ROUTES, createMigration, expectedHash, expectedBytes };
