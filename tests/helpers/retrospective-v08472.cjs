'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const RECORD = path.join(root, 'validation/gynae-v08472/patient-assets.json');
const NEW_ROUTES = ["00385/cervical_definitive", "00385/cervical_postoperative", "00419/cervical", "00812/cervical", "00455/cervical_maintenance", "00558/cervical_maintenance"];
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const bytes = fs.readFileSync(RECORD);
assert.equal(digest(bytes), 'bd11447e5b91a054243d4a65f2493cd7e4a56f6ad6d238efaab46d7913f466e1');
const reviewed = JSON.parse(bytes);
function createMigration(record) {
  assert.deepEqual(record, reviewed);
  assert.deepEqual(record.routes, NEW_ROUTES);
  assert.equal(record.base, '1cea3d6140defcbc8a4fc29aca463b3b130e538f');
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
const priorInventory = require('./retrospective-v08471.cjs').inventory;
const releaseRoutes = NEW_ROUTES;
const inventory = {...priorInventory, routes: priorInventory.routes + NEW_ROUTES.length, visualRoutes: priorInventory.visualRoutes + NEW_ROUTES.length};
function approvedPath(file) { return Object.hasOwn(reviewed.files,file); }
function beforeHash(file) { return reviewed.files[file]?.before; }
module.exports = { beforeHash, releaseRoutes, inventory, approvedPath, RECORD, NEW_ROUTES, createMigration, expectedHash, expectedBytes };
