'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '../..');
const BASE_COMMIT = '5ec7fca1ad575e783feda56d5713b89125c3f201';
const BASE_TREE = '29ea7f620e4f787e0566bab0332210cdfffda819';
const manifestPath = 'validation/durvalumab-v08462/asset-migrations.json';
const helperPath = 'tests/helpers/retrospective-v08462.cjs';
const RECORD = path.join(ROOT, manifestPath);
const REVIEWED_SHA256 = '0a33be6e6bfcfd71b36868c4a181f30da721ee8372d76405de0e0149cf19af24';
const NEW_ROUTES = ['00897','00926','00953'];
const CODES = ['00576','00655',...NEW_ROUTES];
const sha = buffer => crypto.createHash('sha256').update(buffer).digest('hex');
const git = args => cp.execFileSync('git',args,{cwd:ROOT,maxBuffer:16*1024*1024,env:{...process.env,GIT_NO_LAZY_FETCH:'1',GIT_TERMINAL_PROMPT:'0'}});
const validPath = f => typeof f==='string' && !f.startsWith('/') && !f.includes('\\') && !f.split('/').some(v=>!v || v==='.' || v==='..') && !f.includes('\0');
let tree;
function treeEntries() {
  if (tree) return tree;
  assert.equal(git(['rev-parse',BASE_COMMIT+'^{tree}']).toString().trim(), BASE_TREE);
  tree = new Map();
  for(const line of git(['ls-tree','-rlz',BASE_COMMIT]).toString().split('\0').filter(Boolean)){
    const [head,f]=line.split('\t');const [mode,type,oid,size]=head.trim().split(/\s+/);
    if(type==='blob')tree.set(f,{mode,oid,bytes:Number(size)});
  }
  return tree;
}
const baseDigests = new Map();
function before(f){
  const item=treeEntries().get(f);
  if(!item)return {before:null,before_bytes:null};
  if(!baseDigests.has(item.oid)){
    const bytes=git(['cat-file','blob',item.oid]);assert.equal(bytes.length,item.bytes);
    baseDigests.set(item.oid,sha(bytes));
  }
  return {before:baseDigests.get(item.oid),before_bytes:item.bytes};
}
const shared = new Set([
  '404.html','about.html','index.html','sustainability.html','package.json','README.md','REGIMEN_CARD_METADATA_REVIEW.csv',
  'protocols/index.json','protocols/catalogue-bundle.json.gz',
  'data/app-release.json','data/nccp-change-tracker/source-register-v0620.json','data/clinical-validation-register-v0630.json','data/emetogenic-risk-map.json','data/regimen-card-metadata.json','data/regimen-card-overrides.json','data/regimen-workflow-v0750.json',
  'data/regimen-knowledge-base-v08426-addendum.json','data/patient-presentation-v08431.json','data/phase-support-v0838.json','data/patient-symptom-pictures.json','data/regimen-knowledge-durvalumab-hcc-v08462.json','data/regimen-knowledge-durvalumab-biliary-v08462.json','data/regimen-knowledge-durvalumab-endometrial-v08462.json',
  'js/local-lab-profile.js','js/patient-anatomy-data-v08431.js','js/patient-asset-registry-v0810.js','js/patient-support-v0750.js','js/protocol-dose-schedule.js','js/protocol-id-migrations.js','js/regimen-knowledge-base.js','js/sactcheck-release.js',
  'assets/patient/durvalumab-documents.css','patient/assets/symptom-pictures.css',
  'tests/helpers/head-neck-suite-registration-v08445.cjs','tests/helpers/about-video-v08461.cjs','tests/helpers/patient-migration-catalogue.cjs','tests/helpers/live-inventory-v08462.cjs',
  'tools/durvalumab-symptom-entry.cjs','tools/refresh-patient-ui.cjs','tools/build-complete-pathways.cjs','tools/build-patient-knowledge.cjs','tools/patient-publication-v08444.cjs','tools/check-sarcoma-retrospective-v08462.cjs','tools/check-sarcoma-independent-v08460.cjs','tools/check-sarcoma-independent-v08461.cjs','tools/reconcile-solid-tumour-library.js','tools/audit-organ-function-rule-coverage.js','tools/audit-patient-companions-ribociclib-v08461.py','tools/patient-presentation-v08431.cjs',
  'tools/build-durvalumab-patient-suites.cjs','tools/render-durvalumab-patient-pdfs.py','tools/durvalumab-symptom-pictures.py','tools/durvalumab-lung-presentation.cjs','tools/build-durvalumab-lung-print-v08462.py','tools/record-durvalumab-migration-v08462.cjs',
  'protocols/gastrointestinal/00897-durvalumab-gemcitabine-cisplatin.json','protocols/gastrointestinal/00926-tremelimumab-durvalumab.json','protocols/gynaecology/00953-durvalumab-carboplatin-paclitaxel.json'
]);
function approvedPath(f){
  if(!validPath(f)||f===manifestPath||f===helperPath)return false;
  if(shared.has(f))return true;
  if(CODES.some(id=>f==='data/patient-knowledge/'+id+'.json'))return true;
  if(CODES.some(id=>new RegExp('^(?:patient|docs/patient)/'+id+'/[a-z0-9_-]+\\.(?:html|pdf|png)$').test(f)))return true;
  if(/^patient\/assets\/symptom-icons\/[a-z][a-z0-9-]+\.svg$/.test(f))return true;
  if(/^validation\/durvalumab-v08462\/[a-z][a-z0-9-]+\.(?:json(?:\.gz)?|md)$/.test(f))return true;
  if(/^(tools|tests)\/(?:[a-z0-9-]*durvalumab[a-z0-9-]*|preservation)-v08462(?:\.test)?\.(?:cjs|py|js)$/.test(f))return true;
  // Existing legacy tests in this release may only receive explicitly captured, before-authenticated edits.
  if(/^tests\/[a-z][a-z0-9-]+\.test\.(?:js|cjs)$/.test(f) && treeEntries().has(f))return true;
  return false;
}
let verified, manifest;
function createMigration(record){
  const digest=sha(Buffer.from(JSON.stringify(record,null,2)+'\n'));
  assert.equal(digest,REVIEWED_SHA256,'Immutable reviewed durvalumab transition');
  if(verified===digest)return expected;
  assert.equal(record.base_release,'0.84.61');assert.equal(record.release,'0.84.62');
  assert.equal(record.base_commit,BASE_COMMIT);assert.equal(record.base_tree,BASE_TREE);
  assert.deepEqual(record.new_routes,NEW_ROUTES);
  for(const [f,entry] of Object.entries(record.files)){
    assert(approvedPath(f),'Unapproved durvalumab path '+f);
    const b=before(f);assert.equal(entry.before,b.before,f+' authentic Git bytes');assert.equal(entry.before_bytes,b.before_bytes,f+' Git size');
    assert.match(entry.after,/^[a-f\d]{64}$/);assert(Number.isSafeInteger(entry.after_bytes) && entry.after_bytes>0);assert.notEqual(entry.after,entry.before);
  }
  for(const id of NEW_ROUTES)for(const leaf of ['index.html','guide.pdf','passport.pdf'])assert(record.files['patient/'+id+'/'+leaf]);
  verified=digest;manifest=record;return expected;
}
function load(){if(!manifest){const raw=fs.readFileSync(RECORD);assert.equal(sha(raw),REVIEWED_SHA256,'Review record bytes');createMigration(JSON.parse(raw));}return manifest;}
// Additional reviewed publication, relative to the released five-pathway tree.
const filmRecordPath = 'validation/durvalumab-film-v08462/transition.json';
const filmBytes = fs.readFileSync(path.join(ROOT, filmRecordPath));
assert.equal(sha(filmBytes), '3ff8cbd9057f40a212daee133252cbfbd324aee791a41de31c186e54aaba35e6', 'Reviewed durvalumab film publication');
const filmRecord = JSON.parse(filmBytes);
assert.deepEqual(filmRecord.regimens, ['00576', '00655']);
const strideRecordPath = 'validation/stride-film-v08462/transition.json';
const strideBytes = fs.readFileSync(path.join(ROOT, strideRecordPath));
assert.equal(sha(strideBytes), 'a539d91f2e308efd12be8a01776c8fed459dc3de452b57f52a38c75092199713', 'Reviewed STRIDE film publication');
const strideRecord = JSON.parse(strideBytes);
assert.deepEqual(strideRecord.regimens, ['00926']);
const filmRecords = [filmRecord, strideRecord];
function filmExpected(f, h, n) {
  const changes = filmRecords.map(record => record.files[f]).filter(Boolean);
  if (!changes.length) return {sha256: h, bytes: n};
  const versions = [{hash: changes[0].before, bytes: changes[0].before_bytes},
    ...changes.map(change => ({hash: change.after, bytes: change.after_bytes}))];
  assert(versions.some(v => v.hash === h && (n === undefined || v.bytes === n)), f + ' unexpected film publication origin');
  const latest = changes[changes.length - 1];
  return {sha256: latest.after, bytes: latest.after_bytes};
}
function expected(f,h,n){
  assert(validPath(f));const c=load().files[f];if(!c)return filmExpected(f,h,n);
  assert(h===c.before || h===c.after,f+' mismatched transition origin');
  if(n!==undefined)assert.equal(n,h===c.before?c.before_bytes:c.after_bytes,f+' mismatched origin size');
  return {sha256:c.after,bytes:c.after_bytes};
}
function currentReplayHash(file, historicalHash){
  assert(['js/protocol-dose-schedule.js','js/local-lab-profile.js'].includes(file));
  const prior=before(file);
  assert.equal(historicalHash,prior.before,file+' archived independent-review fingerprint must match its Git blob');
  const reviewed=expected(file,prior.before,prior.before_bytes);
  const live=fs.readFileSync(path.join(ROOT,file));
  assert.equal(sha(live),reviewed.sha256,file+' live tool must match the pinned transition');
  assert.equal(live.length,reviewed.bytes,file+' live tool size');
  return reviewed.sha256;
}
function isAddition(f){return f===filmRecordPath||f===strideRecordPath||filmRecords.some(record=>record.files[f]?.before===null)||f===manifestPath||f===helperPath||load().files[f]?.before===null;}
function verify(){
  const latest = new Map();
  for (const record of filmRecords) {
    for (const [f, change] of Object.entries(record.files)) {
      assert(validPath(f));
      if (change.before !== null) {
        const original = git(['show', record.base_commit + ':' + f]);
        assert.equal(sha(original), change.before, f + ' pre-publication Git bytes');
        assert.equal(original.length, change.before_bytes);
      } else {
        assert.equal(cp.spawnSync('git', ['cat-file', '-e', record.base_commit + ':' + f], {cwd: ROOT}).status, 128, f + ' new publication asset');
      }
      if (latest.has(f)) {
        assert.equal(change.before, latest.get(f).after, f + ' previous film publication');
        assert.equal(change.before_bytes, latest.get(f).after_bytes);
      }
      latest.set(f, change);
    }
  }
  for (const [f, change] of latest) {
    const bytes = fs.readFileSync(path.join(ROOT, f));
    assert.equal(sha(bytes), change.after, f + ' published film asset');
    assert.equal(bytes.length, change.after_bytes);
  }
  for(const [f,v] of Object.entries(load().files)){
    const bytes=fs.readFileSync(path.join(ROOT,f));assert.equal(sha(bytes),v.after,f+' reviewed output');assert.equal(bytes.length,v.after_bytes);
  }
  return true;
}
module.exports={ROOT,BASE_COMMIT,BASE_TREE,RECORD,NEW_ROUTES,CODES,sha,approvedPath,before,createMigration,expected,currentReplayHash,expectedHash:(f,h)=>expected(f,h).sha256,expectedBytes:(f,n,h)=>expected(f,h,n).bytes,isAddition,verify};
