'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const RECORD = path.join(root, 'validation/sarcoma-batch-1/patient-assets.json');
const NEW_ROUTES = ['00374', '00228/liposarcoma', '00205/sarcoma', '00462', '00554'];
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const bytes = fs.readFileSync(RECORD);
assert.equal(digest(bytes), '5c69836a02a4023a7e308623775484bf600e7a90159ecfba6524aaa37fb3f9fd');
const reviewed = JSON.parse(bytes);
function createMigration(record) {
  assert.deepEqual(record, reviewed);
  assert.deepEqual(record.routes, NEW_ROUTES);
  for (const [file, entry] of Object.entries(record.files)) {
    assert(NEW_ROUTES.some(route => ['patient', 'docs/patient'].some(prefix => path.dirname(file) === prefix + '/' + route)));
    assert.equal(entry.before, null);
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
module.exports = { RECORD, NEW_ROUTES, createMigration, expectedHash, expectedBytes };
