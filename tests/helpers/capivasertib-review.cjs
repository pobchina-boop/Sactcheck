'use strict';
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const base = '71d089b071bff6f8ed3ff6eb3cad49a5e6577105';
const manifestPath = 'validation/capivasertib-review/changes.json';
const helperPath = 'tests/helpers/capivasertib-review.cjs';
const manifestHash = '09281753cbf676841c9a6935c09be14b2e909cf39e22c7efe2c4da6da667e0b1';
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const manifest = fs.readFileSync(path.join(root, manifestPath));
assert.equal(hash(manifest), manifestHash, 'Capivasertib review manifest');
const record = JSON.parse(manifest);
assert.equal(record.base, base);
const sourceHelper = fs.readFileSync(__filename, 'utf8').replace(/^const manifestHash = '.*';$/m, "const manifestHash = 'PENDING';");
assert.equal(hash(sourceHelper), record.verifier, 'Reviewed capivasertib verifier');

function original(file) {
  return cp.execFileSync('git', ['show', base + ':' + file], {cwd: root, maxBuffer: 32 * 1024 * 1024});
}

function expected(file, digest, size) {
  const entry = record.files[file];
  if (!entry) return {sha256: digest, bytes: size};
  assert(digest === entry.before || digest === entry.after, file + ' unexpected capivasertib review origin');
  if (size !== undefined) assert.equal(size, digest === entry.before ? entry.before_bytes : entry.after_bytes);
  return {sha256: entry.after, bytes: entry.after_bytes};
}

function addition(file) {
  return file === manifestPath || file === helperPath || record.files[file]?.before === null;
}

function verify() {
  for (const [file, entry] of Object.entries(record.files)) {
    if (entry.before !== null) {
      const prior = original(file);
      assert.equal(hash(prior), entry.before, file + ' source hash');
      assert.equal(prior.length, entry.before_bytes);
    } else {
      const absent = cp.spawnSync('git', ['cat-file', '-e', base + ':' + file], {cwd: root, maxBuffer: 32 * 1024 * 1024});
      assert.equal(absent.status, 128, file + ' must be new at baseline');
    }
    const bytes = fs.readFileSync(path.join(root, file));
    assert.equal(hash(bytes), entry.after, file + ' review hash');
    assert.equal(bytes.length, entry.after_bytes);
  }
}

function owns(file) {
  return Object.hasOwn(record.files, file) || addition(file);
}

function getInventoryMigrations() {
  // The release catalogue is pinned by earlier deployment evidence. Include
  // both additional review branches when checking today's full asset tree.
  const catalogue = require('./patient-migration-catalogue.cjs').getInventoryMigrations();
  const olaparib = require('./retrospective-v08463.cjs');
  const enhertu = require('./enhertu-review-v08462.cjs');
  olaparib.verifyPriorEnhertu(enhertu);
  verify();
  return [...catalogue,
    {version: 62, helper: enhertu, record: enhertu.load()},
    {version: 63, helper: {approvedPath: owns}, record}
  ];
}

module.exports = {original, expected, addition, verify, owns, getInventoryMigrations};
