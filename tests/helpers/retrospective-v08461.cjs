'use strict';
// v61 starts from the completed v60 working state, anchored to the actual v59 Git commit.
// Authenticate that state by reconstruction; never invent a v60 commit or refresh old hashes.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'../..'),BASE_COMMIT='c01f1a2b236afced0c3ebfdb6b6ff864e58e7d4c';
const RECORD=path.join(ROOT,'validation/sarcoma-v08461/asset-migrations.json');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const baselineManifestSha256='755e5185a4dc5c1b1f6d57f9c9249c4721c456d0a4711b528d582298206f372a',baselineStateSha256='05fea16334b6dff1bb04231254ed0b1f92ab44de63981073da08ae82132d39f6',previousMigrationSha256='9ae29ea9052303d9207a7b9e9ac687b5de9d43e744d51df28d5e568e60cd5c7e';
const stateBytes=fs.readFileSync(path.join(ROOT,'validation/sarcoma-v08461/baseline-v60-state.json'));assert.equal(sha(stateBytes),baselineStateSha256);const state=JSON.parse(stateBytes);assert.equal(state.state_kind,'verified_working_state');assert.equal(state.base_release,'0.84.60');assert.equal(state.git_anchor_commit,BASE_COMMIT);
const source=fs.readFileSync(path.join(ROOT,state.files_manifest_path));assert.equal(sha(source),baselineManifestSha256);const files=JSON.parse(source);assert.equal(Object.keys(files).length,21288);
const priorPath=path.join(ROOT,'validation/sarcoma-v08460/asset-migrations.json'),priorBytes=fs.readFileSync(priorPath);assert.equal(sha(priorBytes),previousMigrationSha256);const prior=JSON.parse(priorBytes),previous=require('./retrospective-v08460.cjs');previous.createMigration(prior);
const reconstructed=Object.fromEntries([...previous.baselineFiles()].map(([f,b])=>[f,{sha256:b.sha256,bytes:b.bytes}]));
for(const [f,c]of Object.entries(prior.files))reconstructed[f]={sha256:c.after,bytes:c.after_bytes};
reconstructed['validation/sarcoma-v08460/asset-migrations.json']={sha256:sha(priorBytes),bytes:priorBytes.length};
assert.deepEqual(files,reconstructed,'The v60 working baseline must reconstruct exactly from authenticated prior evidence');
const base={files};
const CODES=['00335','00325','00719','00244'],NEW_ROUTES=['00335','00325/gist','00719/gist','00244/gist'];
const CLINICAL_ROUTES=[...CODES,'00500','00391','00392','00501','00511'];
const ROUTES=[...new Set([...prior.routes,...NEW_ROUTES])].sort();assert.equal(ROUTES.length,314);
const SHARED_PATHS=["404.html","AGENTS.md","README.md","REGIMEN_CARD_METADATA_REVIEW.csv","about.html","data/app-release.json","data/breast-treatment-journeys-v0837.json","data/clinical-validation-register-v0630.json","data/patient-presentation-v08431.json","data/phase-support-contexts-v08461.json","data/phase-support-v0838.json","data/regimen-card-metadata.json","data/regimen-knowledge-base-v08461-addendum.json","data/regimen-workflow-v0750.json","docs/WORK_RELIABILITY.md","index.html","js/patient-anatomy-data-v08431.js","js/patient-asset-registry-v0810.js","js/protocol-id-migrations.js","js/regimen-knowledge-base.js","js/sactcheck-release.js","js/treatment-journey-v0837.js","package.json","protocols/catalogue-bundle.json.gz","protocols/index.json","sustainability.html","tests/full-suite-v08437.test.cjs","tests/full-suite-v08438.test.cjs","tests/full-suite-v08439.test.cjs","tests/full-suite-v08440.test.cjs","tests/full-suite-v08441.test.cjs","tests/full-suite-v08445.test.cjs","tests/full-suite-v08446.test.cjs","tests/full-suite-v08447.test.cjs","tests/full-suite-v08448.test.cjs","tests/full-suite-v08449.test.cjs","tests/full-suite-v08450.test.cjs","tests/full-suite-v08451.test.cjs","tests/full-suite-v08452.test.cjs","tests/full-suite-v08453.test.cjs","tests/full-suite-v08454.test.cjs","tests/full-suite-v08456.test.cjs","tests/full-suite-v08457.test.cjs","tests/full-suite-v08458.test.cjs","tests/gu-v08459.test.cjs","tests/helpers/retrospective-v08459.cjs","tests/helpers/retrospective-v08460.cjs","tests/platform-standardisation-v0370.test.js","tests/sarcoma-complete-library-v0410.test.js","tests/sarcoma-v08460.test.cjs","tools/build-complete-pathways.cjs","tools/build-patient-knowledge.cjs","tools/build-phase-support-v0838.cjs","tools/consent-core-v08455.cjs","tools/patient-presentation-v08431.cjs","tools/patient-publication-v08444.cjs","tools/patient-suite-context-v08425.cjs","tools/patient-visual-standard-v08443.cjs","validation/work-reliability/open-issues.json"];
const PROTECTED_DOMAINS=['patient','docs/patient','protocols','data','assets/patient','js'];
const safeRelative=f=>typeof f==='string'&&f&&!f.startsWith('/')&&!f.includes('\\')&&!f.split('/').some(x=>!x||x==='..'||x==='.')&&!f.includes('\0');
function approvedPath(f){
 if(!safeRelative(f))return false;if(SHARED_PATHS.includes(f))return true;
 if(/^validation\/sarcoma-v08461\//.test(f))return true;
 if(f==='tools/lib/sarcoma-v08461-transitions.cjs')return true;
 if(/^(?:tools|tests|tests\/helpers)\/[^/]*v08461(?:-facts|-qr|-pdfs|\.test)?\.(?:py|cjs|js)$/.test(f))return true;
 if(CODES.some(c=>new RegExp('^protocols/[^/]+/'+c+'-[^/]+\\.json$').test(f)))return true;
 if(f==='data/patient-knowledge/00335.json')return true;
 if(['00325','00719','00244'].some(c=>f==='data/patient-knowledge-contexts/'+c+'/gist.json'))return true;
 if(['00325','00719'].some(c=>f==='patient/'+c+'/index.html'||f==='patient/'+c+'/scope.html')||f==='patient/00244/scope.html')return true;
 return NEW_ROUTES.some(route=>['patient/','docs/patient/'].some(prefix=>f.startsWith(prefix+route+'/')&&/\.(?:html|pdf|png)$/.test(f)));
}
const baselineFiles=()=>new Map(Object.entries(files)),beforeHash=f=>files[f]?.sha256??null;
function createMigration(r){
 assert.equal(r.release,'0.84.61');assert.equal(r.base_release,'0.84.60');assert.equal(r.git_anchor_commit,BASE_COMMIT);assert.equal(r.baseline_state_sha256,baselineStateSha256);assert.equal(r.baseline_manifest_sha256,baselineManifestSha256);assert.equal(r.previous_migration_sha256,previousMigrationSha256);assert.deepEqual(r.routes,ROUTES);
 for(const [f,c]of Object.entries(r.files)){assert(approvedPath(f),'Unapproved v61 transition '+f);assert.equal(c.before,beforeHash(f));assert.equal(c.before_bytes,files[f]?.bytes??null);assert.match(c.after,/^[a-f0-9]{64}$/);assert.notEqual(c.after,c.before);assert(c.after_bytes>0);}
 return(f,h)=>{assert(safeRelative(f));const c=r.files[f];if(!c)return h;assert(h===c.before||h===c.after,'Unexpected prior bytes '+f);return c.after;};
}
let record,convert;function load(){if(!record){record=JSON.parse(fs.readFileSync(RECORD));convert=createMigration(record);}return record;}
function expectedHash(f,h){load();return convert(f,h);}
function expectedBytes(f,n,h){const r=load();convert(f,h);const c=r.files[f];if(!c)return n;assert.equal(n,h===c.before?c.before_bytes:c.after_bytes);return c.after_bytes;}
function verifyCurrent(r=load()){
 createMigration(r);let protectedCount=0,historicalCount=0;
 for(const [f,b]of Object.entries(base.files)){const bytes=fs.readFileSync(path.join(ROOT,f)),c=r.files[f];assert.equal(sha(bytes),c?c.after:b.sha256,f+' baseline or approved transition');assert.equal(bytes.length,c?c.after_bytes:b.bytes);if(f.startsWith('validation/'))historicalCount++;else protectedCount++;}
 for(const [f,c]of Object.entries(r.files)){const bytes=fs.readFileSync(path.join(ROOT,f));assert.equal(sha(bytes),c.after,f);assert.equal(bytes.length,c.after_bytes);}
 for(const f of cp.execFileSync('git',['ls-files','--others','--exclude-standard','-z'],{cwd:ROOT,env:{...process.env,GIT_NO_LAZY_FETCH:'1',GIT_TERMINAL_PROMPT:'0'}}).toString().split('\0').filter(Boolean))assert(f==='validation/sarcoma-v08461/asset-migrations.json'||files[f]||r.files[f], 'Unrecorded new file '+f);
 return {protectedCount,historicalCount,currentCount:Object.keys(base.files).length+Object.keys(r.files).filter(f=>!base.files[f]).length,changedFiles:Object.keys(r.files).length};
}
module.exports={ROOT,BASE_COMMIT,RECORD,CODES,NEW_ROUTES,CLINICAL_ROUTES,ROUTES,SHARED_PATHS,PROTECTED_DOMAINS,sha,safeRelative,approvedPath,baselineFiles,beforeHash,createMigration,expectedHash,expectedBytes,expectedBuilderHash:expectedHash,verifyCurrent,previousMigrationSha256,baselineManifestSha256,baselineStateSha256};
