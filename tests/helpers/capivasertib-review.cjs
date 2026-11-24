'use strict';
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const release = require('./live-release-v08464.cjs');
const root = path.resolve(__dirname, '../..');
const base = '71d089b071bff6f8ed3ff6eb3cad49a5e6577105';
const manifestPath = 'validation/capivasertib-review/changes.json';
const helperPath = 'tests/helpers/capivasertib-review.cjs';
const manifestHash = 'bbbf1ea6735e1911d694842104453bba08c709ac00e712e66d5122aa1ae2869e';
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const manifest = fs.readFileSync(path.join(root, manifestPath));
assert.equal(hash(manifest), manifestHash, 'Capivasertib review manifest');
const record = JSON.parse(manifest);
assert.equal(record.base, base);
const sourceHelper = release.astraBytes(helperPath).toString('utf8').replace(/^const manifestHash = '.*';$/m, "const manifestHash = 'PENDING';");
assert.equal(hash(sourceHelper), record.verifier, 'Reviewed capivasertib verifier');

function original(file) {
  return cp.execFileSync('git', ['show', base + ':' + file], {cwd: root, maxBuffer: 32 * 1024 * 1024});
}

function expected(file, digest, size) {
  if (release.isCurrent(file,digest,size)) return {sha256:digest,bytes:size};
  const entry = record.files[file];
  if (!entry) return release.expected(file,digest,size);
  assert(digest === entry.before || digest === entry.after, file + ' unexpected capivasertib review origin');
  if (size !== undefined) assert.equal(size, digest === entry.before ? entry.before_bytes : entry.after_bytes);
  return release.expected(file,entry.after,entry.after_bytes);
}

function addition(file) {
  return release.addition(file) || file === manifestPath || file === helperPath || record.files[file]?.before === null;
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
    const target = release.expected(file,entry.after,entry.after_bytes);
    assert.equal(hash(bytes), target.sha256, file + ' review hash');
    assert.equal(bytes.length, target.bytes);
  }
}

function owns(file) {
  return Object.hasOwn(record.files, file) || addition(file) || release.owns(file);
}

function withReviewInventories(catalogue) {
  // The release catalogue is pinned by earlier deployment evidence. Include
  // both additional review branches when checking today's full asset tree.
  const olaparib = require('./retrospective-v08463.cjs');
  const enhertu = require('./enhertu-review-v08462.cjs');
  olaparib.verifyPriorEnhertu(enhertu);
  verify();
  return [...catalogue,
    {version: 62, helper: enhertu, record: enhertu.load()},
    {version: 63, helper: {approvedPath: owns}, record}
  ];
}

module.exports = {original, expected, addition, verify, owns, withReviewInventories};
