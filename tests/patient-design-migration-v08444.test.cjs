'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const m=require('./helpers/retrospective-v08444.cjs');
const latest=require('./helpers/retrospective-v08445.cjs');
const successor=require('./helpers/retrospective-v08446.cjs');
const recent=require('./helpers/retrospective-v08449.cjs');
const preceding=require('./helpers/retrospective-v08448.cjs');
const batch=require('./helpers/retrospective-v08447.cjs');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const file='patient/00642/knowledge.pdf',old=m.BASE_FILES.get(file),after=sha('An independently reviewed revised document');
const fixture=(files={[file]:{before:old.sha256,before_bytes:old.bytes,after,after_bytes:43}})=>({schema_version:1,release:'0.84.44',base_release:'0.84.43',base_commit:m.BASE_COMMIT,baseline_tree_sha:m.BASE_TREE,baseline_manifest_sha256:m.BASELINE_MANIFEST_SHA256,baseline_archive_sha256:m.BASELINE_ARCHIVE_SHA256,route_set_sha256:m.ROUTE_SET_SHA256,routes:m.ROUTES,status:'recorded',files});

test('v44 migration pins the complete previously delivered package and rejects unreviewed transitions',()=>{
 const migrate=m.createMigration(fixture());
 assert.equal(migrate(file,old.sha256),after);assert.equal(migrate(file,after),after);
 assert.throws(()=>migrate(file,sha('Other bytes')),/Unexpected v44 original hash/);
 const f=fixture();f.files[file].after=sha('Mutated record');assert.equal(migrate(file,old.sha256),after);
 for(const change of [{release:'0.84.43'},{base_release:'0.84.42'},{base_commit:'0'.repeat(40)},{baseline_manifest_sha256:'0'.repeat(64)},{baseline_archive_sha256:'0'.repeat(64)},{routes:m.ROUTES.slice(1)},{status:'pending'}])assert.throws(()=>m.createMigration({...fixture(),...change}),/Invalid reviewed/);
 for(const change of [{before:sha('Wrong original')},{before_bytes:old.bytes+1},{after:old.sha256},{after:'bad'},{after_bytes:0}])assert.throws(()=>m.createMigration(fixture({[file]:{...fixture().files[file],...change}})),/Invalid v44 reviewed hash/);
});

test('v44 allowed scope excludes clinician rules, anatomy artwork, wallet and QR assets',()=>{
 for(const f of ['protocols/index.json','protocols/neuroendocrine/00642-lutetium.json','js/assessment-engine.js','assets/patient/anatomy-hcc-v0762.png','js/patient-anatomy-v08431.js','patient/00642/sactcard.pdf','patient/00642/qr.png','patient/00642/oncowiki-qr.png','patient/00642/consent-form.pdf','patient/99999/knowledge.pdf','data/patient-knowledge/99999.json','../patient/00642/guide.pdf','patient//00642/guide.pdf','patient\\00642\\guide.pdf'])assert.equal(m.approvedPath(f),false,f);
 assert(m.approvedPath('data/patient-knowledge/00642.json'));
 assert(m.approvedPath('patient/00642/passport.pdf'));
 assert(m.approvedPath('docs/patient/00642/knowledge.pdf'));
});

test('v44 exact current bytes follow the pinned v43 package; every protected asset remains accounted for',()=>{
 const record=JSON.parse(fs.readFileSync(m.RECORD,'utf8')),migrate=m.createMigration(record);
 const latestRecord=JSON.parse(fs.readFileSync(latest.RECORD,'utf8'));latest.createMigration(latestRecord);
 const successorRecord=JSON.parse(fs.readFileSync(successor.RECORD,'utf8'));successor.createMigration(successorRecord);
 const batchRecord=JSON.parse(fs.readFileSync(batch.RECORD,'utf8'));batch.createMigration(batchRecord);batch.verifyCurrent(batchRecord);
  const recentRecord=JSON.parse(fs.readFileSync(recent.RECORD,'utf8'));recent.createMigration(recentRecord);
 const precedingRecord=JSON.parse(fs.readFileSync(preceding.RECORD,'utf8'));preceding.createMigration(precedingRecord);
 assert.equal(cp.execFileSync('git',['rev-parse',m.BASE_COMMIT+'^{tree}'],{cwd:m.ROOT,encoding:'utf8'}).trim(),m.BASE_TREE);
 const historical=JSON.parse(fs.readFileSync(path.join(m.ROOT,'validation/patient-design-v08443/asset-migrations.json'),'utf8'));
 assert.equal(sha(fs.readFileSync(path.join(m.ROOT,'validation/patient-design-v08443/asset-migrations.json'))),m.BASE_FILES.get('validation/patient-design-v08443/asset-migrations.json').sha256,'Historical v43 approvals are immutable');
 for(const [f,c]of Object.entries(historical.files)){
  assert.equal(m.BASE_FILES.get(f)?.sha256,c.after,f+' previous approved content');
  assert.equal(m.BASE_FILES.get(f)?.bytes,c.after_bytes,f+' previous approved size');
 }
 for(const [f,c]of Object.entries(record.files)){
  const bytes=fs.readFileSync(path.join(m.ROOT,f));assert.equal(sha(bytes),latest.expectedHash(f,migrate(f,c.before)),f+' exact v44 or explicit v45 reviewed bytes');assert.equal(bytes.length,latest.expectedBytes(f,c.after_bytes,c.after),f+' exact reviewed size');
 }
 let protectedCount=0;
 for(const [f,b]of m.BASE_FILES){
  if(!/^(?:patient\/|docs\/patient\/|protocols\/|data\/|assets\/patient\/|js\/)/.test(f))continue;
  // These two files only identify the application and patient release. All
  // clinician engines and every other clinical data file stay byte-exact.
  if(f==='data/app-release.json'||f==='js/sactcheck-release.js')continue;
  const bytes=fs.readFileSync(path.join(m.ROOT,f));
  assert.equal(sha(bytes),latest.expectedHash(f,migrate(f,b.sha256)),f+' retained or explicit content transition');protectedCount++;
 }
 assert.equal(protectedCount,9997,'Every file in the pinned v43 protected patient/protocol inventory must be checked');
 // Checking old bytes alone would miss an entirely new, unrecorded clinical
 // file. Every current member of the protected trees must also be accounted for.
 function checkMembership(directory){
  for(const entry of fs.readdirSync(path.join(m.ROOT,directory),{withFileTypes:true})){
   const f=directory+'/'+entry.name;
   if(entry.isDirectory())checkMembership(f);
   else{
    assert(entry.isFile(),f+' must be a regular protected asset');
    assert(m.BASE_FILES.has(f)||Object.hasOwn(record.files,f)||Object.hasOwn(latestRecord.files,f)||Object.hasOwn(successorRecord.files,f)||Object.hasOwn(batchRecord.files,f)||Object.hasOwn(recentRecord.files,f)||Object.hasOwn(precedingRecord.files,f),f+' is an unrecorded addition to a protected directory');
   }
  }
 }
 for(const directory of ['patient','docs/patient','protocols','data','assets/patient','js'])checkMembership(directory);
});

test('v44 patient editorial changes preserve numeric treatment data, anatomy and clinical identity at frozen Git44',()=>{
 const record=JSON.parse(fs.readFileSync(m.RECORD,'utf8'));
 const dataFiles=Object.keys(record.files).filter(f=>/^data\/patient-knowledge(?:-contexts)?\//.test(f));
 assert(dataFiles.length>=36,'All identified NCCN-based patient sources must be revised');
 function numbers(value,at='',out={}){
  if(at.startsWith('/sources/')||at.startsWith('/patient_editorial_revision'))return out;
  if(typeof value==='number')out[at]=value;
  else if(Array.isArray(value))value.forEach((v,i)=>numbers(v,at+'/'+i,out));
  else if(value&&typeof value==='object')for(const [k,v]of Object.entries(value))numbers(v,at+'/'+k,out);
  return out;
 }
 const originalFiles=latest.readGitFiles(m.BASE_COMMIT,dataFiles),frozenFiles=latest.readFrozenMany(dataFiles);
 for(const f of dataFiles){
  const original=JSON.parse(originalFiles.get(f));
  // The historical v44 contract is retained against its exact published Git44 bytes.
  // Current v45 source changes need the explicit v45 provenance and clinical tests.
  const current=JSON.parse(frozenFiles.get(f));
  for(const k of ['code','protocol_id','protocol_version','suite_release','cycle_days','schedule_kind','anatomy'])assert.deepEqual(current[k],original[k],f+' retained '+k);
  const before=numbers(original),now=numbers(current);for(const [at,n]of Object.entries(before))assert.equal(now[at],n,f+' numeric treatment value '+at);
  assert(!current.sources?.some(s=>/nccn/i.test(JSON.stringify(s))),f+' active source list');
 }
});

test('v44 patient publication stays idempotent and preserves script data and exact links',()=>{
 const editorial=require('../tools/patient-editorial-v08444.cjs');
 const input='<html><head><title>PRRT</title></head><body><p>PRRT may involve an MRI and ECG.</p><p>PRRT is written again.</p><a href="https://example.test/PRRT">More information</a><script type="application/json">{"term":"PRRT","value":12}</script></body></html>';
 const once=editorial.applyEditorial(input,{route:'00642',documentKind:'knowledge',root:m.ROOT});
 assert.equal(editorial.applyEditorial(once,{route:'00642',documentKind:'knowledge',root:m.ROOT}),once);
 assert(once.includes('peptide receptor radionuclide therapy'));
 assert(once.includes('https://example.test/PRRT'));
 assert(once.includes('{"term":"PRRT","value":12}'));
 assert(once.includes('<title>PRRT</title>'));
});
