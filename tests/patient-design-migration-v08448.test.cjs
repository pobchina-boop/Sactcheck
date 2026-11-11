'use strict';
// Proposed destination: tests/patient-design-migration-v08448.test.cjs.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const local=path.join(__dirname,'retrospective-v08448.cjs');
const m=require(fs.existsSync(local)?local:'./helpers/retrospective-v08448.cjs');
const file='patient/00314/index.html',before=m.readFrozen(file),base=m.baselineFiles().get(file),after=Buffer.from('A separately reviewed presentation candidate');
const entry={before:m.sha(before),before_git_blob_sha1:base.blob,before_bytes:before.length,after:m.sha(after),after_bytes:after.length};
function fixture(files={[file]:{...entry}}){return {schema_version:1,release:'0.84.48',base_release:'0.84.47',base_commit:m.BASE_COMMIT,baseline_tree_sha:m.BASE_TREE,status:'recorded',route_set_sha256:m.ROUTE_SET_SHA256,clinical_route_set_sha256:m.CLINICAL_ROUTE_SET_SHA256,codes:m.CODES,clinical_routes:m.CLINICAL_ROUTES,routes:m.ROUTES,files};}
test('v48 is pinned to the exact published v47 tree and five new contexts',()=>{
 assert.equal(m.BASE_COMMIT,'5380c7d8665645d54b06c76011d420efc4e767a6');assert.equal(m.BASE_TREE,'dc5cfba6ba05f953c4afddeb3bef696a53a989fe');assert.equal(m.ROUTES.length,249);assert.equal(m.CLINICAL_ROUTES.length,10);assert.equal(m.PROTOCOLS.length,10);assert.equal(m.CODES.length,10);assert.equal(m.NEW_ROUTES.length,5);
});
test('v48 exact transitions are immutable and reject changed baseline identity',()=>{
 const f=fixture(),go=m.createMigration(f);assert.equal(go(file,entry.before),entry.after);assert.equal(go(file,entry.after),entry.after);assert.throws(()=>go(file,m.sha('unreviewed')),/Unexpected/);f.files[file].after=m.sha('Mutated');assert.equal(go(file,entry.before),entry.after);
 for(const change of [{release:'0.84.44'},{base_release:'0.84.43'},{base_commit:'0'.repeat(40)},{baseline_tree_sha:'0'.repeat(40)},{status:'candidate'},{route_set_sha256:'0'.repeat(64)},{clinical_route_set_sha256:'0'.repeat(64)},{routes:m.ROUTES.slice(1)},{codes:m.CODES.slice(1)},{clinical_routes:m.CLINICAL_ROUTES.slice(1)}])assert.throws(()=>m.createMigration({...fixture(),...change}),/Invalid reviewed/);
 for(const change of [{before:null},{before_git_blob_sha1:'0'.repeat(40)},{before_bytes:entry.before_bytes+1},{after:entry.before},{after:'bad'},{after_bytes:0},{after_bytes:-1},{after_bytes:1.5}])assert.throws(()=>m.createMigration(fixture({[file]:{...entry,...change}})),/Invalid v48 baseline/);
});
test('v48 existing and new before hashes are verified against actual Git blobs',async()=>{
 assert.equal(await m.verifyBeforeHashes(fixture()),1);
 await assert.rejects(()=>m.verifyBeforeHashes(fixture({[file]:{...entry,before:m.sha('Wrong baseline bytes')}})),/baseline SHA256/);
 const added='patient/00315/guide.html';assert.equal(m.baselineFiles().has(added),false);
 const c={before:null,before_git_blob_sha1:null,before_bytes:null,after:m.sha('New guide'),after_bytes:9};assert.equal(await m.verifyBeforeHashes(fixture({[added]:c})),0);
 assert.throws(()=>m.createMigration(fixture({[added]:{...c,before:entry.before}})),/Invalid v48 baseline/);
});
test('v48 only permits the named protocol families and exact context outputs',()=>{
 for(const f of ['protocols/gastrointestinal/00209-folfox6.json','js/assessment-engine.js','assets/patient/anatomy-hcc-v0762.png','js/patient-anatomy-v08431.js','patient/00642/guide.pdf','patient/00483/head_neck/handbook.pdf','data/patient-knowledge/00642.json','patient/99999/guide.html','patient/00315/unreviewed.pdf','../patient/00315/guide.pdf'])assert.equal(m.approvedPath(f),false,f);
 for(const f of ['patient/00314/index.html','patient/00315/guide.pdf','docs/patient/00552/consent-form.pdf','patient/00419/head_neck/sactcard.pdf','data/patient-knowledge-contexts/00419/head_neck.json',m.PROTOCOLS[0]])assert.equal(m.approvedPath(f),true,f);
 assert.throws(()=>m.createMigration(fixture({'patient/00642/guide.pdf':entry})),/Unapproved/);
});
test('v48 membership rejects every unrecorded new protected asset even inside a permitted route',()=>{
 const f=fixture();for(const added of ['patient/00315/guide.html','patient/00483/rogue.html','data/patient-knowledge/99999.json','js/unreviewed-engine.js'])assert.throws(()=>m.assertMember(added,f),/unrecorded new/);
 m.assertMember(file,f);assert.throws(()=>m.assertMember('../unsafe',f),/Unsafe/);
});
test('v48 frozen historical reads use Git47 instead of current working files',()=>{
 const f='data/patient-knowledge/00314.json',bytes=m.readFrozen(f),old=m.baselineFiles().get(f);
 assert.equal(m.blobHash(bytes),old.blob);assert.equal(bytes.length,old.bytes);
 assert.equal(JSON.parse(bytes).code,'00314');
 // The current v48 verifier independently protects every baseline member.
});
// This actual release check intentionally fails until the integrating agent has
// reviewed final bytes and recorded the explicit migration. It is never skipped
// merely because rendering, browser validation or a record is missing.
test('v48 exact final inventory proves baseline blobs and every current protected member',async()=>{
 const r=JSON.parse(fs.readFileSync(m.RECORD,'utf8'));await m.verifyBeforeHashes(r);const counts=m.verifyCurrent(r);assert(counts.protectedCount>9900);assert(counts.currentCount>=counts.protectedCount);assert(counts.historicalCount>30);assert(counts.changedFiles>0);
});
