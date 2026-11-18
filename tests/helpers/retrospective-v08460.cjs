'use strict';
// Current baseline bytes were checked against all 20,819 Git59 blobs before edits.
// This manifest allows current-release preservation checks without downloading
// historical PDFs. It does not replace the full historical regression gate.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'../..'),BASE_COMMIT='c01f1a2b236afced0c3ebfdb6b6ff864e58e7d4c',BASE_TREE='9334b681add517c77a4797bf0b9ff441f4a112bb';
const RECORD=path.join(ROOT,'validation/sarcoma-v08460/asset-migrations.json');
const baselineManifestSha256='1800b2eed06065101339a6464b0367075bcc66e01b4faff4ec44bac4de4c4783',previousMigrationSha256='408a5504a612dcfa60ec3c36e93de60d60caa9b79096f7bde00b3fca9f8bfb8c';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),blobHash=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const source=fs.readFileSync(path.join(ROOT,'validation/sarcoma-v08460/baseline-v59-manifest.json'));assert.equal(sha(source),baselineManifestSha256);const base=JSON.parse(source);assert.equal(base.commit,BASE_COMMIT);assert.equal(base.tree,BASE_TREE);
assert.equal(cp.execFileSync('git',['rev-parse',BASE_COMMIT+'^{tree}'],{cwd:ROOT,env:{...process.env,GIT_NO_LAZY_FETCH:'1',GIT_TERMINAL_PROMPT:'0'}}).toString().trim(),BASE_TREE);
const tree=cp.execFileSync('git',['ls-tree','-rz',BASE_COMMIT],{cwd:ROOT,env:{...process.env,GIT_NO_LAZY_FETCH:'1',GIT_TERMINAL_PROMPT:'0'},maxBuffer:64*1024*1024}).toString().split('\0').filter(Boolean);assert.equal(tree.length,Object.keys(base.files).length);
for(const row of tree){const [info,file]=row.split('\t'),[mode,type,blob]=info.split(' ');assert.deepEqual([base.files[file]?.mode,base.files[file]?.type,base.files[file]?.blob],[mode,type,blob]);}
assert.equal(sha(fs.readFileSync(path.join(ROOT,'validation/gu-v08459/asset-migrations.json'))),previousMigrationSha256);
const CODES=['00500','00391','00392','00501','00511'],NEW_ROUTES=[...CODES];
const CLINICAL_ROUTES=[...CODES,'00453','00602','00807','00894','00945'];
const ROUTES=[...new Set([...JSON.parse(fs.readFileSync(path.join(ROOT,'validation/gu-v08459/asset-migrations.json'))).routes,...NEW_ROUTES])].sort();assert.equal(ROUTES.length,310);
const SHARED_PATHS=["AGENTS.md","README.md","package.json","index.html","about.html","sustainability.html","404.html","REGIMEN_CARD_METADATA_REVIEW.csv","data/app-release.json","data/regimen-card-metadata.json","data/clinical-validation-register-v0630.json","js/sactcheck-release.js","js/patient-asset-registry-v0810.js","protocols/index.json","protocols/catalogue-bundle.json.gz","data/breast-treatment-journeys-v0837.json","js/treatment-journey-v0837.js","data/phase-support-v0838.json","data/regimen-workflow-v0750.json","data/patient-presentation-v08431.json","data/regimen-knowledge-base-v08460-addendum.json","js/regimen-knowledge-base.js","js/protocol-id-migrations.js","js/patient-anatomy-data-v08431.js","tools/patient-presentation-v08431.cjs","tools/build-complete-pathways.cjs","tools/build-patient-knowledge.cjs","tools/build-phase-support-v0838.cjs","tools/consent-core-v08455.cjs","tools/patient-visual-standard-v08443.cjs","tests/gu-v08459.test.cjs","tests/helpers/retrospective-v08459.cjs","docs/WORK_RELIABILITY.md","validation/work-reliability/open-issues.json","tests/full-suite-v08437.test.cjs","tests/full-suite-v08438.test.cjs","tests/full-suite-v08439.test.cjs","tests/full-suite-v08440.test.cjs","tests/full-suite-v08441.test.cjs","tests/full-suite-v08445.test.cjs","tests/full-suite-v08446.test.cjs","tests/full-suite-v08447.test.cjs","tests/full-suite-v08448.test.cjs","tests/full-suite-v08449.test.cjs","tests/full-suite-v08450.test.cjs","tests/full-suite-v08451.test.cjs","tests/full-suite-v08452.test.cjs","tests/full-suite-v08453.test.cjs","tests/full-suite-v08454.test.cjs","tests/full-suite-v08456.test.cjs","tests/full-suite-v08457.test.cjs","tests/full-suite-v08458.test.cjs"];
SHARED_PATHS.push('tools/build-sarcoma-v08460-pdfs.py','tools/build-sarcoma-v08460-qr.py','tools/sarcoma-v08460-facts.py','tools/verify-sarcoma-v08460-pdfs.py','tests/platform-standardisation-v0370.test.js','tests/sarcoma-complete-library-v0410.test.js','tests/preservation-v08460.test.cjs','tests/renal-field-semantics-v08460.test.cjs','tests/sarcoma-v08460.test.cjs');
const PROTECTED_DOMAINS=['patient','docs/patient','protocols','data','assets/patient','js'];
const safeRelative=f=>typeof f==='string'&&f&&!f.startsWith('/')&&!f.includes('\\')&&!f.split('/').some(x=>!x||x==='..'||x==='.')&&!f.includes('\0');
function approvedPath(f){
 if(!safeRelative(f))return false;if(SHARED_PATHS.includes(f))return true;
 if(/^validation\/sarcoma-v08460\//.test(f))return true;
 if(/^(?:tools|tests|tests\/helpers)\/[^/]*v08460\.(?:py|cjs)$/.test(f))return true;
 if(CODES.some(c=>f.startsWith('protocols/sarcoma/'+c+'-')&&f.endsWith('.json')))return true;
 if(CODES.some(c=>f==='data/patient-knowledge/'+c+'.json'))return true;
 return CODES.some(c=>['patient/','docs/patient/'].some(prefix=>f.startsWith(prefix+c+'/')&&/\.(?:html|pdf|png)$/.test(f)));
}
const baselineFiles=()=>new Map(Object.entries(base.files)),beforeHash=f=>base.files[f]?.sha256??null;
function createMigration(r){
 assert.equal(r.release,'0.84.60');assert.equal(r.base_commit,BASE_COMMIT);assert.equal(r.baseline_manifest_sha256,baselineManifestSha256);assert.equal(r.previous_migration_sha256,previousMigrationSha256);assert.deepEqual(r.routes,ROUTES);
 for(const [f,c]of Object.entries(r.files)){assert(approvedPath(f),'Unapproved v60 transition '+f);assert.equal(c.before,beforeHash(f));assert.equal(c.before_bytes,base.files[f]?.bytes??null);assert.match(c.after,/^[a-f0-9]{64}$/);assert.notEqual(c.after,c.before);assert(c.after_bytes>0);}
 return(f,h)=>{assert(safeRelative(f));const c=r.files[f];if(!c)return h;assert(h===c.before||h===c.after,'Unexpected prior bytes '+f);return c.after;};
}
let record,convert;function load(){if(!record){record=JSON.parse(fs.readFileSync(RECORD));convert=createMigration(record);}return record;}
function expectedHash(f,h){load();return require('./release-repair-v08460.cjs').expected(f,convert(f,h)).sha256;}
function expectedBytes(f,n,h){const r=load();convert(f,h);const c=r.files[f];if(!c)return require('./release-repair-v08460.cjs').expected(f,h,n).bytes;assert.equal(n,h===c.before?c.before_bytes:c.after_bytes);return require('./release-repair-v08460.cjs').expected(f,c.after,c.after_bytes).bytes;}
function verifyCurrent(r=load()){
 createMigration(r);const repair=require('./release-repair-v08460.cjs');repair.verify();let protectedCount=0,historicalCount=0;
 for(const [f,b]of Object.entries(base.files)){const bytes=fs.readFileSync(path.join(ROOT,f)),c=r.files[f];const expected=repair.expected(f,c?c.after:b.sha256,c?c.after_bytes:b.bytes);assert.equal(sha(bytes),expected.sha256,f+' baseline or approved transition');assert.equal(bytes.length,expected.bytes);if(f.startsWith('validation/'))historicalCount++;else protectedCount++;}
 for(const [f,c]of Object.entries(r.files)){const bytes=fs.readFileSync(path.join(ROOT,f));const expected=repair.expected(f,c.after,c.after_bytes);assert.equal(sha(bytes),expected.sha256,f);assert.equal(bytes.length,expected.bytes);}
 for(const f of cp.execFileSync('git',['ls-files','--others','--exclude-standard','-z'],{cwd:ROOT,env:{...process.env,GIT_NO_LAZY_FETCH:'1',GIT_TERMINAL_PROMPT:'0'}}).toString().split('\0').filter(Boolean))assert(f==='validation/sarcoma-v08460/asset-migrations.json'||r.files[f]||repair.isAddition(f), 'Unrecorded new file '+f);
 return {protectedCount,historicalCount,currentCount:Object.keys(base.files).length+Object.keys(r.files).filter(f=>!base.files[f]).length,changedFiles:Object.keys(r.files).length};
}
module.exports={ROOT,BASE_COMMIT,BASE_TREE,RECORD,CODES,NEW_ROUTES,CLINICAL_ROUTES,ROUTES,SHARED_PATHS,PROTECTED_DOMAINS,sha,blobHash,safeRelative,approvedPath,baselineFiles,beforeHash,createMigration,expectedHash,expectedBytes,expectedBuilderHash:expectedHash,verifyCurrent,previousMigrationSha256,baselineManifestSha256};
