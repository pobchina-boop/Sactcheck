'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const test = require('node:test');
const m = require('./helpers/retrospective-v08443.cjs');
const next = require('./helpers/retrospective-v08444.cjs');
const latest = require('./helpers/retrospective-v08445.cjs');
const successor = require('./helpers/retrospective-v08446.cjs');
const root = path.resolve(__dirname, '..');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const before = sha('Original authored treatment document');
const after = sha('Reviewed presentation of the same authored treatment');
const file = 'patient/00642/guide.pdf';
const change = {before, after, before_git_blob_sha1: 'a'.repeat(40), before_bytes: Buffer.byteLength('Original authored treatment document'), after_bytes: Buffer.byteLength('Reviewed presentation of the same authored treatment')};
const fixture = (files = {[file]: change}) => ({
  schema_version: 1, release: '0.84.43', base_release: '0.84.42',
  base_commit: m.BASE_COMMIT, baseline_tree_sha: m.BASE_TREE,
  route_set_sha256: m.ROUTE_SET_SHA256, routes: m.ROUTES,
  status: 'recorded', files
});
const readRecord = () => JSON.parse(fs.readFileSync(m.RECORD, 'utf8'));

test('v43 fixture: exact authored routes and filenames bound the presentation migration', () => {
  assert.equal(m.ROUTES.length, 228);
  assert.equal(new Set(m.ROUTES.map(r => r.split('/')[0])).size, 199);
  for (const route of m.ROUTES) for (const name of m.FILE_NAMES) {
    assert(m.approvedPath(`patient/${route}/${name}`));
    assert(m.approvedPath(`docs/patient/${route}/${name}`));
  }
  for (const shared of m.SHARED_PATHS) assert(m.approvedPath(shared));
  for (const bad of [
    '../patient/00642/guide.pdf', '/patient/00642/guide.pdf',
    'patient/00642/../guide.pdf', 'patient//00642/guide.pdf',
    'patient\\00642\\guide.pdf', 'patient/00642/guide.pdf\0',
    'patient/00320/index.html', 'patient/00372/index.html', 'patient/00388/index.html',
    'patient/00535/index.html', 'patient/00849/index.html',
    'patient/00535/renal/guide.pdf', 'patient/00558/melanoma_perioperative/guide.pdf',
    'patient/99999/guide.pdf', 'patient/00642/nested/knowledge.pdf',
    'patient/00642/sactcard.pdf', 'patient/00642/sactcard.html',
    'patient/00642/qr.png', 'patient/00642/oncowiki-qr.png',
    'patient/00642/passport.pdf', 'patient/00642/consent-form.pdf',
    'patient/00642/supportive-care.pdf', 'patient/00642/support-treatment.html',
    'patient/00642/treatment-journey.pdf', 'patient/00642/logistics.pdf',
    'data/patient-knowledge/00642.json', 'data/patient-knowledge-contexts/00320/neuroendocrine.json',
    'protocols/index.json', 'assets/patient/anatomy-hcc-v0762.png',
    'js/patient-anatomy-v08431.js', 'assets/patient/patient-knowledge.js',
    'assets/patient/phase-support-v0838.js.map', 'tools/unreviewed.cjs'
  ]) {
    assert.equal(m.approvedPath(bad), false, bad);
    assert.throws(() => m.createMigration(fixture({[bad]: change})), /Unapproved v43 presentation migration path/, bad);
  }
});

test('v43 fixture: only exact original or already migrated hashes advance', () => {
  const migrate = m.createMigration(fixture());
  assert.equal(migrate(file, before), after);
  assert.equal(migrate(file, after), after);
  assert.throws(() => migrate(file, sha('Unreviewed older bytes')), /Unexpected v43 original hash/);
  assert.equal(migrate('patient/00642/sactcard.pdf', before), before);
  assert.equal(migrate('data/patient-knowledge/00642.json', before), before);
  assert.throws(() => migrate('../' + file, before), /Unsafe v43 presentation migration lookup/);
  const added = m.createMigration(fixture({'patient/00203/knowledge.pdf': {before: null, before_git_blob_sha1: null, before_bytes: null, after, after_bytes: change.after_bytes}}));
  assert.equal(added('patient/00203/knowledge.pdf', null), after);
  assert.equal(added('patient/00203/knowledge.pdf', after), after);
  assert.throws(() => added('patient/00203/knowledge.pdf', before), /Unexpected v43 original hash/);
});

test('v43 fixture: scope, baseline commit/tree and transition hashes cannot be silently substituted', () => {
  for (const changes of [
    {base_commit: 'b'.repeat(40)}, {baseline_tree_sha: 'c'.repeat(40)},
    {release: '0.84.42'}, {base_release: '0.84.41'}, {status: 'pending-render-and-record'},
    {route_set_sha256: '0'.repeat(64)}, {routes: m.ROUTES.slice(1)},
    {routes: [...m.ROUTES, '99999']}, {files: {}}
  ]) assert.throws(() => m.createMigration({...fixture(), ...changes}), /Invalid reviewed v43 presentation migration record/);
  for (const override of [
    {after: before}, {before: 'invalid'}, {after: 'invalid'},
    {before_git_blob_sha1: null}, {before: null},
    {before_bytes: null}, {after_bytes: -1}, {after_bytes: 1.5}
  ]) assert.throws(() => m.createMigration(fixture({[file]: {...change, ...override}})), /Invalid v43 presentation migration hashes/);
});

test('v43 fixture: changed and untouched file mutations fail without redefining expectations', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'sactcheck-v43-migration-'));
  t.after(() => fs.rmSync(directory, {recursive: true, force: true}));
  const reviewed = path.join(directory, 'guide.pdf');
  const preserved = path.join(directory, 'sactcard.pdf');
  fs.writeFileSync(reviewed, 'Reviewed presentation of the same authored treatment');
  fs.writeFileSync(preserved, 'Original authored treatment document');
  const record = fixture({[file]: {...change}});
  const migrate = m.createMigration(record);
  record.files[file].after = sha('A later unreviewed document');
  const verify = (actual, name) => assert.equal(sha(fs.readFileSync(actual)), migrate(name, before));
  verify(reviewed, file);
  verify(preserved, 'patient/00642/sactcard.pdf');
  fs.appendFileSync(reviewed, ' mutation');
  fs.appendFileSync(preserved, ' mutation');
  assert.throws(() => verify(reviewed, file), assert.AssertionError);
  assert.throws(() => verify(preserved, 'patient/00642/sactcard.pdf'), assert.AssertionError);
  assert.equal(migrate(file, before), after);
});

function requireBaseline() {
  try {
    cp.execFileSync('git', ['cat-file', '-e', m.BASE_COMMIT + '^{commit}'], {cwd: root, stdio: ['ignore', 'ignore', 'pipe']});
    assert.equal(cp.execFileSync('git', ['rev-parse', m.BASE_COMMIT + '^{tree}'], {cwd: root, encoding: 'utf8'}).trim(), m.BASE_TREE);
  } catch (error) {
    throw Error(`v43 UI migration provenance requires the exact Git commit ${m.BASE_COMMIT} and tree ${m.BASE_TREE}. A source archive or shallow checkout without these objects cannot prove the baseline; retain full-history checkout. ${error.message}`);
  }
}

test('v43 recorded migration proves every before hash against the pinned v42 Git blobs', async () => {
  const record = readRecord();
  m.createMigration(record);
  requireBaseline();
  const entries = Object.entries(record.files);
  const git = cp.spawn('git', ['cat-file', '--batch'], {cwd: root, stdio: ['pipe', 'pipe', 'pipe']});
  const finished = new Promise((resolve, reject) => {git.once('close', resolve); git.once('error', reject);});
  let stderr = '';
  git.stderr.on('data', chunk => {stderr += chunk;});
  git.stdin.end(entries.map(([name]) => `${m.BASE_COMMIT}:${name}`).join('\n') + '\n');
  let header = Buffer.alloc(0), remaining = 0, digest, index = 0, state = 'header';
  try {
    for await (const chunk of git.stdout) {
      let offset = 0;
      while (offset < chunk.length) {
        if (state === 'header') {
          const newline = chunk.indexOf(10, offset);
          if (newline < 0) {header = Buffer.concat([header, chunk.subarray(offset)]); break;}
          header = Buffer.concat([header, chunk.subarray(offset, newline)]);
          offset = newline + 1;
          const line = header.toString('utf8');
          header = Buffer.alloc(0);
          const [name, entry] = entries[index] || [];
          assert(name, 'Unexpected extra Git blob');
          if (line === `${m.BASE_COMMIT}:${name} missing`) {
            assert.equal(entry.before, null, name + ' must exist at baseline');
            assert.equal(entry.before_git_blob_sha1, null);
            index++;
            continue;
          }
          const match = line.match(/^([a-f0-9]{40}) blob (\d+)$/);
          assert(match, 'Missing or invalid baseline blob ' + name);
          assert.notEqual(entry.before, null, name + ' was incorrectly recorded as new');
          assert.equal(match[1], entry.before_git_blob_sha1, name + ' pinned Git blob');
          remaining = Number(match[2]);
          assert.equal(remaining, entry.before_bytes, name + ' pinned baseline byte count');
          digest = crypto.createHash('sha256');
          state = remaining ? 'body' : 'newline';
        } else if (state === 'body') {
          const size = Math.min(remaining, chunk.length - offset);
          digest.update(chunk.subarray(offset, offset + size));
          offset += size;
          remaining -= size;
          if (!remaining) state = 'newline';
        } else {
          assert.equal(chunk[offset++], 10, 'Git blob delimiter');
          assert.equal(digest.digest('hex'), entries[index][1].before, entries[index][0] + ' verified baseline bytes');
          index++;
          state = 'header';
        }
      }
    }
    assert.equal(await finished, 0, stderr);
    assert.equal(index, entries.length);
    assert.equal(state, 'header');
    assert.equal(header.length, 0);
  } finally {
    if (git.exitCode === null) git.kill();
  }
});

test('v43, v44 and the explicit source-reviewed v45 migration cover the complete current asset diff', () => {
  const record = readRecord();
  const migrate = m.createMigration(record);
  requireBaseline();
  const nextRecord=JSON.parse(fs.readFileSync(next.RECORD,'utf8'));
  next.createMigration(nextRecord);
  const latestRecord=JSON.parse(fs.readFileSync(latest.RECORD,'utf8'));latest.createMigration(latestRecord);
  const successorRecord=JSON.parse(fs.readFileSync(successor.RECORD,'utf8'));successor.createMigration(successorRecord);
  const domains = ['patient', 'docs/patient', 'data/patient-knowledge', 'data/patient-knowledge-contexts', 'protocols', 'assets/patient', 'js/patient-anatomy-v08431.js', ...m.SHARED_PATHS, ...next.SHARED_PATHS];
  const latestFiles=Object.keys(latestRecord.files).filter(f=>domains.some(d=>f===d||f.startsWith(d+'/')));
  const successorFiles=Object.keys(successorRecord.files).filter(f=>domains.some(d=>f===d||f.startsWith(d+'/')));
  const lines = args => cp.execFileSync('git', args, {cwd: root, maxBuffer: 32 * 1024 * 1024}).toString().split('\0').filter(Boolean);
  const changed = lines(['diff', '--name-only', '-z', m.BASE_COMMIT, '--', ...domains]);
  const added = lines(['ls-files', '--others', '--exclude-standard', '-z', '--', ...domains]);
  const actual = [...new Set([...changed, ...added])].sort();
  for (const name of actual) assert(m.approvedPath(name)||next.approvedPath(name)||latest.approvedPath(name)||successor.approvedPath(name), 'Unapproved clinical, anatomy, wallet, QR or presentation change: ' + name);
  assert.deepEqual([...new Set([...Object.keys(record.files),...Object.keys(nextRecord.files),...latestFiles,...successorFiles])].sort(), actual, 'The immutable v43/v44 records plus the explicit v45 record must cover every changed/new asset');
  for (const [name, entry] of Object.entries(record.files)) {
    const bytes = fs.readFileSync(path.join(root, name));
    assert.equal(sha(bytes), next.expectedHash(name,migrate(name, entry.before)), name + ' exact candidate bytes');
    const currentBytes=next.expectedBytes(name,entry.after_bytes,entry.after);
    assert.equal(bytes.length, currentBytes, name + ' exact candidate byte count');
    assert.equal(m.expectedBytes(name, entry.before_bytes, entry.before), currentBytes, name + ' exact migrated byte count');
  }
  const [changedName, changedEntry] = Object.entries(record.files).find(([, entry]) => entry.before !== null);
  assert.throws(() => m.expectedBytes(changedName, changedEntry.before_bytes + 1, changedEntry.before), /Unexpected v43 original byte count/);
  const historicalChanges = lines(['diff', '--name-only', '-z', m.BASE_COMMIT, '--', 'validation']).filter(name =>
    !name.startsWith('validation/patient-design-v08443/') && /\/(?:retrospective-hashes|shared-builder-revisions|ui-asset-hashes)\.json$/.test(name));
  assert.deepEqual(historicalChanges, [], 'Historical approvals must not be rewritten for a new presentation release');
});

test('v43 protection remains exact except explicitly reviewed v44 patient-content transitions', () => {
  const record = readRecord();
  m.createMigration(record);
  const scope = JSON.parse(fs.readFileSync(m.SCOPE, 'utf8'));
  const preserved = new Map();
  for (const row of Object.values(scope.route_inventory)) {
    preserved.set(row.source.path, row.source.sha256);
    preserved.set(row.protocol.path, row.protocol.sha256);
    for (const pair of Object.values(row.files)) for (const kind of ['patient', 'docs']) {
      const info = pair[kind];
      if (info.present && !m.approvedPath(info.path)) preserved.set(info.path, info.sha256);
    }
  }
  for (const pair of Object.values(scope.preserved_root_selectors)) for (const info of Object.values(pair)) {
    if (info.present) preserved.set(info.path, info.sha256);
  }
  assert(preserved.size > 5000, 'Expected full authored asset preservation inventory');
  for (const [name, expected] of preserved) {
    assert.equal(sha(fs.readFileSync(path.join(root, name))), next.expectedHash(name,expected), name + ' retained baseline or explicit reviewed patient content');
    assert.equal(Object.hasOwn(record.files, name), false, name + ' must not enter a UI migration');
  }
});
