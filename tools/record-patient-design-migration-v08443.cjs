#!/usr/bin/env node
'use strict';
// Record a concrete candidate after rendering. This does not approve the content
// or bypass the separate Git-provenance, retention, PDF and browser gates.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const migration = require('../tests/helpers/retrospective-v08443.cjs');
const baselineFile = 'validation/patient-design-v08443/migration-baseline.json';
const baselineBytes = fs.readFileSync(path.join(root, baselineFile));
const baseline = JSON.parse(baselineBytes);
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
if (process.argv.slice(2).join(' ') !== '--write') {
  throw Error('After rendering and reviewing the candidate, run with --write to record its exact current hashes.');
}
if (baseline.base_commit !== migration.BASE_COMMIT || baseline.baseline_tree_sha !== migration.BASE_TREE ||
    baseline.route_set_sha256 !== migration.ROUTE_SET_SHA256) {
  throw Error('Unexpected v43 migration baseline provenance');
}
const candidates = new Set(migration.SHARED_PATHS);
for (const route of migration.ROUTES) for (const name of migration.FILE_NAMES) {
  candidates.add(`patient/${route}/${name}`);
  candidates.add(`docs/patient/${route}/${name}`);
}
for (const file of Object.keys(baseline.files)) {
  if (!candidates.has(file) || !migration.approvedPath(file)) throw Error('Unapproved baseline path ' + file);
}
const files = {};
for (const file of [...candidates].sort()) {
  const old = baseline.files[file];
  const actual = path.join(root, file);
  if (!fs.existsSync(actual)) {
    if (old) throw Error('UI migration cannot delete an existing asset: ' + file);
    continue;
  }
  const bytes = fs.readFileSync(actual);
  const after = sha(bytes);
  if (after === old?.sha256) continue;
  files[file] = {before: old?.sha256 ?? null, before_git_blob_sha1: old?.git_blob_sha1 ?? null, before_bytes: old?.bytes ?? null, after, after_bytes: bytes.length};
}
const record = {
  schema_version: 1, release: '0.84.43', base_release: '0.84.42',
  base_commit: migration.BASE_COMMIT, baseline_tree_sha: migration.BASE_TREE,
  route_set_sha256: migration.ROUTE_SET_SHA256, status: 'recorded',
  scope: 'Presentation only; authored clinical data, protocols, anatomy, wallet outputs and QR assets remain unchanged.',
  baseline_manifest: baselineFile, baseline_manifest_sha256: sha(baselineBytes),
  routes: migration.ROUTES,
  evidence: ['validation/patient-design-v08443/scope.json', 'validation/patient-design-v08443/AUDIT.md'],
  files
};
migration.createMigration(record);
fs.writeFileSync(migration.RECORD, JSON.stringify(record, null, 2) + '\n');
console.log(JSON.stringify({record: path.relative(root, migration.RECORD), changed_files: Object.keys(files).length, added_files: Object.values(files).filter(e => e.before === null).length, baseline_commit: migration.BASE_COMMIT}, null, 2));
