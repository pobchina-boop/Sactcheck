'use strict';
// Prepared delivered v54 baseline over immutable Git52; no invented v53 commit.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'../..'),BASE_COMMIT='18426a999fa2b1ad441b82ee5dfbea6fa4ee9ea5',BASE_TREE='73a3fd87c050e623273bb9f8a2df539cdf2fd202';
const RECORD=path.join(ROOT,'validation/usability-consent-v08455/asset-migrations.json');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),blobHash=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const git=a=>cp.execFileSync('git',a,{cwd:ROOT,maxBuffer:128*1024*1024});
const safeRelative=f=>typeof f==='string'&&f&&!f.startsWith('/')&&!f.includes('\\')&&!f.split('/').some(x=>!x||x==='..'||x==='.')&&!f.includes('\0');
const CODES=[],NEW_ROUTES=[],CLINICAL_ROUTES=[];
const previousRecordBytes=fs.readFileSync(path.join(ROOT,'validation/prostate-v08454/asset-migrations.json'));assert.equal(sha(previousRecordBytes),'0224fdbe6e4ff928ad503346ce17c141b537a51fd3bc9b9447d155a02a44adce');
const AFFECTED_ROUTES=Object.freeze([...JSON.parse(previousRecordBytes).routes]);
const manifestBytes=fs.readFileSync(path.join(ROOT,'validation/usability-consent-v08455/baseline-v54-manifest.json'));assert.equal(sha(manifestBytes),'c033f4da57febbf7384a9e394551a1798228b42bb55c454d80b9959307454248');const manifest=JSON.parse(manifestBytes),prepared=new Map(manifest.files.map(x=>[x.path,x]));assert.equal(manifest.release,'0.84.54');assert.equal(manifest.base_commit,BASE_COMMIT);for(const[f,x]of Object.entries(JSON.parse(previousRecordBytes).files)){assert.equal(prepared.get(f)?.sha256,x.after);assert.equal(prepared.get(f)?.bytes,x.after_bytes);}
assert.equal(git(['rev-parse',BASE_COMMIT+'^{tree}']).toString().trim(),BASE_TREE);
const ROUTES=[...new Set([...JSON.parse(previousRecordBytes).routes,...NEW_ROUTES])].sort();assert.equal(ROUTES.length,279);
const PROTECTED_DOMAINS=['patient','docs/patient','protocols','data','assets/patient','js'];
const SHARED_PATHS=["package.json", "index.html", "about.html", "sustainability.html", "404.html", "data/app-release.json", "js/sactcheck-release.js", "js/patient-asset-registry-v0810.js", "protocols/index.json", "protocols/catalogue-bundle.json.gz", "js/protocol-loader.js", "js/runtime-performance-v0810.js", "data/consent-core-v08455.json", "assets/patient/consent-core-v08455.css", "tools/build-complete-pathways.cjs", "tools/build-pages-site.js", "tools/build-protocol-index.js", "tools/consent-core-v08455.cjs", "tools/update-consents-v08455.cjs", "tools/render-consents-v08455.py"];
const PROTOCOLS=[];
function approvedPath(f){if(!safeRelative(f))return false;if(SHARED_PATHS.includes(f))return true;return AFFECTED_ROUTES.some(route=>['patient/','docs/patient/'].some(base=>f===base+route+'/consent-form.html'||f===base+route+'/consent-form.pdf'));}
const protectedPath=f=>PROTECTED_DOMAINS.some(d=>f===d||f.startsWith(d+'/'));
let base;
function baselineFiles(){if(base)return base;base=new Map();for(const l of git(['ls-tree','-rlz',BASE_COMMIT]).toString().split('\0').filter(Boolean)){const m=l.match(/^([0-9]{6}) ([a-z]+) ([a-f0-9]{40}) +([0-9]+|-)\t([\s\S]+)$/);assert(m);base.set(m[5],{blob:m[3],bytes:Number(m[4]),type:m[2]});}for(const[f,x]of prepared)base.set(f,{sha256:x.sha256,bytes:x.bytes,type:'blob'});return base;}
function beforeHash(f){const b=baselineFiles().get(f);if(!b)return null;return b.sha256||(b.sha256=sha(git(['show',BASE_COMMIT+':'+f])));}
function createMigration(r){assert.equal(r.schema_version,1);assert.equal(r.release,'0.84.55');assert.equal(r.base_release,'0.84.54');assert.equal(r.base_commit,BASE_COMMIT);assert.equal(r.previous_migration_sha256,sha(previousRecordBytes));assert.equal(r.baseline_manifest_sha256,sha(manifestBytes));assert.equal(r.status,'recorded');assert.deepEqual(r.routes,ROUTES);assert.deepEqual(r.clinical_routes,CLINICAL_ROUTES);for(const[f,c]of Object.entries(r.files)){assert(approvedPath(f),'Unapproved v55 transition '+f);assert.equal(c.before,beforeHash(f),f+' prepared v54/Git52 before hash');assert.equal(c.before_bytes,baselineFiles().get(f)?.bytes??null);assert(/^[a-f0-9]{64}$/.test(c.after)&&c.after!==c.before);assert(Number.isSafeInteger(c.after_bytes)&&c.after_bytes>0);}return(f,h)=>{assert(safeRelative(f));const c=r.files[f];if(!c)return h;assert(h===c.before||h===c.after,'Unexpected v55 original '+f);return c.after;};}
let record,migrate;
function load(){if(!record){record=JSON.parse(fs.readFileSync(RECORD));migrate=createMigration(record);}return record;}
function expectedHash(f,h){load();return migrate(f,h);}
function expectedBytes(f,n,h){const r=load();migrate(f,h);const c=r.files[f];if(!c)return n;assert.equal(n,h===c.before?c.before_bytes:c.after_bytes);return c.after_bytes;}
function expectedBuilderHash(f,h){return expectedHash(f,h);}
function assertMember(f,r=load()){assert(safeRelative(f));assert(baselineFiles().has(f)||Object.hasOwn(r.files,f),f+' unrecorded new protected file');}
function verifyCurrent(r=load()){
 createMigration(r);let protectedCount=0,historicalCount=0,currentCount=0;
 for(const[f,b]of baselineFiles()){
  const historical=f.startsWith('validation/')&&/(?:asset-migrations|clinical-migration|scope|baseline-[^/]*manifest|retrospective-hashes|shared-builder-revisions)\.json$/.test(f);
  if(!protectedPath(f)&&!historical&&!SHARED_PATHS.includes(f))continue;
  const bytes=fs.readFileSync(path.join(ROOT,f)),c=r.files[f];
  if(c){assert.equal(sha(bytes),c.after,f+' v55 endpoint');assert.equal(bytes.length,c.after_bytes);}
  else{assert.equal(b.sha256?sha(bytes):blobHash(bytes),b.sha256||b.blob,f+' unchanged prepared-v54 baseline');assert.equal(bytes.length,b.bytes);}
  if(historical)historicalCount++;else protectedCount++;
 }
 for(const[f,c]of Object.entries(r.files)){const st=fs.lstatSync(path.join(ROOT,f));assert(st.isFile()&&!st.isSymbolicLink());const bytes=fs.readFileSync(path.join(ROOT,f));assert.equal(sha(bytes),c.after,f);assert.equal(bytes.length,c.after_bytes);}
 function walk(d){for(const e of fs.readdirSync(path.join(ROOT,d),{withFileTypes:true})){const f=d+'/'+e.name;if(e.isDirectory())walk(f);else{assert(e.isFile());assertMember(f,r);currentCount++;}}}for(const d of PROTECTED_DOMAINS)walk(d);
 // Count the same domain in both totals: shared root/build files are protected
 // above, but are outside the directory walk. Historical evidence is separate.
 for(const f of SHARED_PATHS.filter(f=>!protectedPath(f))){const st=fs.lstatSync(path.join(ROOT,f));assert(st.isFile()&&!st.isSymbolicLink());assertMember(f,r);currentCount++;}
 return{protectedCount,historicalCount,currentCount,changedFiles:Object.keys(r.files).length};
}
async function verifyBeforeHashes(r=load()){createMigration(r);await require('./retrospective-v08454.cjs').verifyBeforeHashes(JSON.parse(previousRecordBytes));return Object.values(r.files).filter(x=>x.before!==null).length;}
module.exports={ROOT,BASE_COMMIT,BASE_TREE,RECORD,CODES,NEW_ROUTES,AFFECTED_ROUTES,CLINICAL_ROUTES,ROUTES,PROTOCOLS,SHARED_PATHS,PROTECTED_DOMAINS,sha,blobHash,safeRelative,approvedPath,protectedPath,baselineFiles,beforeHash,createMigration,expectedHash,expectedBytes,expectedBuilderHash,assertMember,verifyCurrent,verifyBeforeHashes,previousMigrationSha256:sha(previousRecordBytes),baselineManifestSha256:sha(manifestBytes)};
