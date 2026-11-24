'use strict';
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const record = require('../../validation/gynaecology-00862-00929/patient-assets.json');
const NEW_ROUTES = ['00862', '00929'];
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
assert.equal(digest(JSON.stringify(record)), '608e2df82015bd9b96576f672489b8f00d1546f5c3db12e30b3e889d632ce2bd');
function approvedPath(file) { return Object.hasOwn(record.files, file); }
function expectedHash(file, original) { return record.files[file]?.after ?? original; }
function expectedBytes(file, original) { return record.files[file]?.after_bytes ?? original; }
function verify() {
  for (const [file, entry] of Object.entries(record.files)) {
    assert.match(file, /^(docs\/)?patient\/(00862|00929)\/[^/]+$/);
    const bytes = fs.readFileSync(path.join(root, file));
    assert.equal(digest(bytes), entry.after, file);
    assert.equal(bytes.length, entry.after_bytes, file);
  }
}
module.exports = {NEW_ROUTES, approvedPath, expectedHash, expectedBytes, verify, record};
