'use strict';
// Proposed destination: tests/patient-design-migration-v08445.test.cjs.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const local=path.join(__dirname,'retrospective-v08445.cjs');
const m=require(fs.existsSync(local)?local:'./helpers/retrospective-v08445.cjs');
const file='patient/00642/index.html',before=m.readFrozen(file),base=m.baselineFiles().get(file),after=Buffer.from('A separately reviewed presentation candidate');
const entry={before:m.sha(before),before_git_blob_sha1:base.blob,before_bytes:before.length,after:m.sha(after),after_bytes:after.length};
function fixture(files={[file]:{...entry}}){return {schema_version:1,release:'0.84.45',base_release:'0.84.44',base_commit:m.BASE_COMMIT,baseline_tree_sha:m.BASE_TREE,status:'recorded',route_set_sha256:m.ROUTE_SET_SHA256,clinical_route_set_sha256:m.CLINICAL_ROUTE_SET_SHA256,codes:m.CODES,clinical_routes:m.CLINICAL_ROUTES,routes:m.ROUTES,files};}
test('v45 scope is fixed at exact Git44,10 protocols,19clinical and234presentation routes',()=>{
 assert.equal(m.BASE_COMMIT,'a4575d67a985c97a1dfa545813a8c1a25b2ed5a2');assert.equal(m.BASE_TREE,'917b15594ef865cb85c7178d5252813311bbd383');assert.equal(m.ROUTES.length,234);assert.equal(m.CLINICAL_ROUTES.length,19);assert.equal(m.PROTOCOLS.length,10);assert.equal(m.CODES.length,10);assert.equal(m.NEW_ROUTES.length,6);
});
test('v45 exact transitions are immutable and reject changed baseline identity',()=>{
 const f=fixture(),go=m.createMigration(f);assert.equal(go(file,entry.before),entry.after);assert.equal(go(file,entry.after),entry.after);assert.throws(()=>go(file,m.sha('unreviewed')),/Unexpected/);f.files[file].after=m.sha('Mutated');assert.equal(go(file,entry.before),entry.after);
 for(const change of [{release:'0.84.44'},{base_release:'0.84.43'},{base_commit:'0'.repeat(40)},{baseline_tree_sha:'0'.repeat(40)},{status:'candidate'},{route_set_sha256:'0'.repeat(64)},{clinical_route_set_sha256:'0'.repeat(64)},{routes:m.ROUTES.slice(1)},{codes:m.CODES.slice(1)},{clinical_routes:m.CLINICAL_ROUTES.slice(1)}])assert.throws(()=>m.createMigration({...fixture(),...change}),/Invalid reviewed/);
 for(const change of [{before:null},{before_git_blob_sha1:'0'.repeat(40)},{before_bytes:entry.before_bytes+1},{after:entry.before},{after:'bad'},{after_bytes:0},{after_bytes:-1},{after_bytes:1.5}])assert.throws(()=>m.createMigration(fixture({[file]:{...entry,...change}})),/Invalid v45 baseline/);
});
test('v45 existing and new before hashes are verified against actual Git blobs',async()=>{
 assert.equal(await m.verifyBeforeHashes(fixture()),1);
 await assert.rejects(()=>m.verifyBeforeHashes(fixture({[file]:{...entry,before:m.sha('Wrong baseline bytes')}})),/baseline SHA256/);
 const added='patient/00705/guide.html';assert.equal(m.baselineFiles().has(added),false);
 const c={before:null,before_git_blob_sha1:null,before_bytes:null,after:m.sha('New guide'),after_bytes:9};assert.equal(await m.verifyBeforeHashes(fixture({[added]:c})),0);
 assert.throws(()=>m.createMigration(fixture({[added]:{...c,before:entry.before}})),/Invalid v45 baseline/);
});
test('v45 route-specific clinical scope cannot leak into unrelated data or protected drawings',()=>{
 for(const f of ['protocols/gastrointestinal/00209-folfox6.json','js/assessment-engine.js','assets/patient/anatomy-hcc-v0762.png','js/patient-anatomy-v08431.js','patient/00642/sactcard.pdf','patient/00642/qr.png','patient/00642/oncowiki-qr.png','patient/00642/consent-form.pdf','data/patient-knowledge/00642.json','data/patient-knowledge-contexts/00385/unreviewed.json','patient/00385/renal/guide.pdf','patient/99999/guide.html','patient/00705/unreviewed.js','patient/00705/unreviewed.pdf','patient/00705/qr.svg','../patient/00705/guide.pdf','patient//00705/guide.pdf','patient\\00705\\guide.pdf'])assert.equal(m.approvedPath(f),false,f);
 for(const f of ['patient/00642/index.html','patient/00642/handbook.pdf','patient/00705/guide.pdf','docs/patient/00385/head_neck/consent-form.pdf','patient/00455/melanoma_adjuvant/sactcard.pdf','data/patient-knowledge-contexts/00385/nasopharyngeal.json',m.PROTOCOLS[0]])assert.equal(m.approvedPath(f),true,f);
 assert.throws(()=>m.createMigration(fixture({'patient/00642/sactcard.pdf':entry})),/Unapproved/);
});
test('v45 membership rejects every unrecorded new protected asset even inside a permitted route',()=>{
 const f=fixture();for(const added of ['patient/00705/guide.html','patient/00705/rogue.html','data/patient-knowledge/99999.json','js/unreviewed-engine.js'])assert.throws(()=>m.assertMember(added,f),/unrecorded new/);
 m.assertMember(file,f);assert.throws(()=>m.assertMember('../unsafe',f),/Unsafe/);
});
test('v45 frozen historical reads use Git44 instead of current working files',()=>{
 const f='data/patient-knowledge/00642.json',bytes=m.readFrozen(f),old=m.baselineFiles().get(f);
 assert.equal(m.blobHash(bytes),old.blob);assert.equal(bytes.length,old.bytes);
 assert.equal(JSON.parse(bytes).code,'00642');
 // All historical numeric comparisons remain in the proposed unchanged-scope
 // v44 test, which reads Git44 for every prior editorial source.
});
// This actual release check intentionally fails until the integrating agent has
// reviewed final bytes and recorded the explicit migration. It is never skipped
// merely because rendering, browser validation or a record is missing.
test('v45 exact final inventory proves baseline blobs and every current protected member',async()=>{
 const r=JSON.parse(fs.readFileSync(m.RECORD,'utf8'));await m.verifyBeforeHashes(r);const counts=m.verifyCurrent(r);assert(counts.protectedCount>9900);assert(counts.currentCount>=counts.protectedCount);assert(counts.historicalCount>30);assert(counts.changedFiles>0);
});
