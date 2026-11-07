'use strict';

// A presentation-only terminal migration. Historical clinical/source approvals
// remain immutable; only explicit reviewed byte transitions can advance them.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const ROOT = path.resolve(__dirname, '../..');
const BASE_COMMIT = '67aaa3579794278074478b3f6cce4e57c803e4db';
const BASE_TREE = 'ba65db9ba843ef3d191f7acd5af2b195f453e229';
const ROUTE_SET_SHA256 = '73a7a58b514aec07a6392406328f63a84b1ac0311c3c55c4f9607f8af1175657';
const RECORD = path.join(ROOT, 'validation/patient-design-v08443/asset-migrations.json');
const SCOPE = path.join(ROOT, 'validation/patient-design-v08443/scope.json');
const SHA256 = /^[a-f0-9]{64}$/;
const SHA1 = /^[a-f0-9]{40}$/;
const scope = JSON.parse(fs.readFileSync(SCOPE, 'utf8'));
const routeHash = routes => crypto.createHash('sha256').update(routes.join('\n') + '\n').digest('hex');
if (scope.baseline_commit !== BASE_COMMIT || scope.baseline_tree_sha !== BASE_TREE ||
    !Array.isArray(scope.routes) || scope.routes.length !== 228 ||
    new Set(scope.routes).size !== 228 ||
    JSON.stringify(scope.routes) !== JSON.stringify([...scope.routes].sort()) ||
    routeHash(scope.routes) !== ROUTE_SET_SHA256) {
  throw Error('Invalid pinned v43 authored-route inventory');
}
const ROUTES = Object.freeze([...scope.routes]);
const routeSet = new Set(ROUTES);
const FILE_NAMES = Object.freeze([
  'index.html', 'guide.html', 'guide.pdf', 'knowledge.html',
  'knowledge-print.html', 'knowledge.pdf', 'handbook.pdf', 'supportive-care.html'
]);
const fileNames = new Set(FILE_NAMES);
const SHARED_PATHS = Object.freeze([
  'assets/patient/phase-support-v0838.js',
  'assets/patient/patient-visual-standard-v08443.css',
  'css/homepage-search-v0847.css',
  'css/regimen-workflow-v0720.css',
  'data/patient-document-sections-v08443.json',
  'data/patient-visual-layout-v08443.json',
  'js/patient-asset-registry-v0810.js',
  'js/regimen-workflow-engine-v0750.js',
  'tools/apply-patient-visual-standard-v08443.cjs',
  'tools/build-complete-pathways.cjs',
  'tools/patient-visual-standard-v08443.cjs',
  'tools/patient-suite-context-v08425.cjs',
  'tools/refresh-patient-ui.cjs'
]);
const sharedPaths = new Set(SHARED_PATHS);

function safeRelative(file) {
  return typeof file === 'string' && !file.startsWith('/') &&
    !file.includes('\\') && !file.includes('\0') &&
    !file.split('/').some(part => !part || part === '.' || part === '..');
}

function approvedPath(file) {
  if (!safeRelative(file)) return false;
  if (sharedPaths.has(file)) return true;
  const match = file.match(/^(?:patient|docs\/patient)\/(\d{5}(?:\/[a-z0-9_]+)?)\/([^/]+)$/);
  return Boolean(match && routeSet.has(match[1]) && fileNames.has(match[2]));
}

function createMigration(record) {
  if (!record || record.schema_version !== 1 || record.release !== '0.84.43' ||
      record.base_release !== '0.84.42' || record.base_commit !== BASE_COMMIT ||
      record.baseline_tree_sha !== BASE_TREE || record.status !== 'recorded' ||
      record.route_set_sha256 !== ROUTE_SET_SHA256 ||
      !Array.isArray(record.routes) || JSON.stringify(record.routes) !== JSON.stringify(ROUTES) ||
      !record.files || typeof record.files !== 'object' || Array.isArray(record.files) ||
      !Object.keys(record.files).length) {
    throw Error('Invalid reviewed v43 presentation migration record; finish rendering and record the exact diff');
  }
  const entries = new Map();
  for (const [file, change] of Object.entries(record.files)) {
    if (!approvedPath(file)) throw Error('Unapproved v43 presentation migration path ' + file);
    if (!change || (change.before !== null && !SHA256.test(change.before)) ||
        !SHA256.test(change.after) || change.before === change.after ||
        !Number.isSafeInteger(change.after_bytes) || change.after_bytes <= 0 ||
        (change.before === null ? change.before_git_blob_sha1 !== null || change.before_bytes !== null :
          !SHA1.test(change.before_git_blob_sha1) || !Number.isSafeInteger(change.before_bytes) || change.before_bytes <= 0)) {
      throw Error('Invalid v43 presentation migration hashes ' + file);
    }
    entries.set(file, Object.freeze({...change}));
  }
  return function migrate(file, original) {
    if (!safeRelative(file)) throw Error('Unsafe v43 presentation migration lookup ' + file);
    const change = entries.get(file);
    if (!change) return original;
    if (original !== change.before && original !== change.after) {
      throw Error('Unexpected v43 original hash ' + file);
    }
    return change.after;
  };
}

let migration, activeRecord;
function expectedHash(file, original) {
  if (!migration) {
    activeRecord = JSON.parse(fs.readFileSync(RECORD, 'utf8'));
    migration = createMigration(activeRecord);
  }
  return require('./retrospective-v08444.cjs').expectedHash(file, migration(file, original));
}

function expectedBytes(file, originalBytes, originalHash) {
  expectedHash(file, originalHash); // Apply the same exact hash/provenance guard.
  const change = activeRecord.files[file];
  if (!change) return require('./retrospective-v08444.cjs').expectedBytes(file, originalBytes, originalHash);
  const expectedOriginal = originalHash === change.before ? change.before_bytes : change.after_bytes;
  if (originalBytes !== expectedOriginal) throw Error('Unexpected v43 original byte count ' + file);
  return require('./retrospective-v08444.cjs').expectedBytes(file, change.after_bytes, change.after);
}

function expectedBuilderHash(file, original) {
  if (!safeRelative(file) || !/^tools\/[a-zA-Z0-9_-]+\.(cjs|js|py)$/.test(file)) {
    throw Error('Unsafe v43 builder migration lookup ' + file);
  }
  return expectedHash(file, original);
}

module.exports = {
  expectedHash, expectedBytes, expectedBuilderHash, createMigration, approvedPath, safeRelative,
  BASE_COMMIT, BASE_TREE, ROUTE_SET_SHA256, ROUTES, FILE_NAMES, SHARED_PATHS, RECORD, SCOPE
};
