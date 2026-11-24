'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const ROOT = path.resolve(__dirname, '../..');
const RECORD = path.join(ROOT, 'validation/sarcoma-integration/asset-migrations.json');
const DIGEST = 'edf16aadecd3d5592e34e022f950c78188525af9a649392678cf19e2b3b73945';
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
const bytes = fs.readFileSync(RECORD);
assert.equal(sha(bytes), DIGEST, 'Exact cumulative sarcoma integration record');
const record = JSON.parse(bytes);
const NEW_ROUTES = Object.freeze(record.new_routes);
assert.equal(new Set(NEW_ROUTES).size, 15);
const baseTree = execFileSync('git', ['rev-parse', record.base_commit + '^{tree}'], {cwd: ROOT, encoding: 'utf8'}).trim();
assert.equal(baseTree, record.base_tree, 'Authenticated AstraZeneca baseline');
function expected(file, hash, size) {
  const change = record.files[file];
  if (!change) return {sha256: hash, bytes: size};
  assert(hash === change.before || hash === change.after, 'Unexpected sarcoma integration input for ' + file);
  if (size !== undefined) assert.equal(size, hash === change.before ? change.before_bytes : change.after_bytes, file);
  return {sha256: change.after, bytes: change.after_bytes};
}
function createMigration(candidate) {
  assert.equal(sha(Buffer.from(JSON.stringify(candidate, null, 2) + '\n')), DIGEST);
  return (file, hash) => expected(file, hash).sha256;
}
module.exports = {
  ROOT, RECORD, NEW_ROUTES, createMigration, expected,
  approvedPath: file => Object.hasOwn(record.files, file),
  expectedHash: (file, hash) => expected(file, hash).sha256,
  expectedBytes: (file, size, hash) => expected(file, hash, size).bytes
};
