'use strict';
// Prepared v50 package is the baseline. No fictitious v50 Git commit is used.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'../..'),BASE_COMMIT='15c524e0a843b8d869cc6bc6e3ecc6a26f18f2a6',BASE_TREE='a21a76f2de9906b4ee9cb5a04f417228217f58b9';
const RECORD=path.join(ROOT,'validation/prostate-v08451/asset-migrations.json');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),blobHash=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const git=a=>cp.execFileSync('git',a,{cwd:ROOT,maxBuffer:128*1024*1024});
const safeRelative=f=>typeof f==='string'&&f&&!f.startsWith('/')&&!f.includes('\\')&&!f.split('/').some(x=>!x||x==='..'||x==='.')&&!f.includes('\0');
const CODES=['00103','00577','00233','00574','00693'],NEW_ROUTES=CODES,CLINICAL_ROUTES=[...CODES,'00294/head_neck','00242','00295','00615','00893'];
const manifestBytes=fs.readFileSync(path.join(ROOT,'validation/prostate-v08451/baseline-v50-manifest.json'));
assert.equal(sha(manifestBytes),'24e050b83d495580e09794dae6d6e033bcfd0217c4c7105d89fd0779b188d582');
const manifest=JSON.parse(manifestBytes),prepared=new Map(manifest.files.map(x=>[x.path,x]));
assert.equal(manifest.release,'0.84.50');assert.equal(manifest.base_commit,BASE_COMMIT);
assert.equal(git(['rev-parse',BASE_COMMIT+'^{tree}']).toString().trim(),BASE_TREE);
const record50=JSON.parse(fs.readFileSync(path.join(ROOT,'validation/head-neck-v08450/asset-migrations.json')));
assert.equal(sha(fs.readFileSync(path.join(ROOT,'validation/head-neck-v08450/asset-migrations.json'))),'644fa2009dbcb395530ead9a9d73a2dac57b931ec5d004e2f25d794b28cb8031');
for(const[f,c]of Object.entries(record50.files)){assert.equal(prepared.get(f)?.sha256,c.after,f+' exact delivered v50 endpoint');assert.equal(prepared.get(f).bytes,c.after_bytes);}
const ROUTES=[...new Set([...record50.routes,...NEW_ROUTES])].sort();assert.equal(ROUTES.length,264);
const PROTECTED_DOMAINS=['patient','docs/patient','protocols','data','assets/patient','js'];
const SHARED_PATHS=['package.json','index.html','about.html','sustainability.html','404.html','data/app-release.json','js/sactcheck-release.js','protocols/index.json','data/regimen-card-metadata.json','data/regimen-card-overrides.json','data/regimen-workflow-v0750.json','data/emetogenic-risk-map.json','data/consent-content-v0710.json','data/breast-treatment-journeys-v0837.json','data/phase-support-v0838.json','data/phase-support-contexts-v08451.json','data/patient-presentation-v08431.json','data/regimen-knowledge-base-v08451-addendum.json','data/prostate-treatment-explainer-v08451.json','js/regimen-knowledge-base.js','css/regimen-knowledge-base.css','js/patient-asset-registry-v0810.js','js/protocol-id-migrations.js','js/local-lab-profile.js','js/treatment-journey-v0837.js','tools/build-patient-knowledge.cjs','tools/build-complete-pathways.cjs','tools/build-phase-support-v0838.cjs','tools/patient-presentation-v08431.cjs','tools/patient-pack-v08451.cjs','tools/refresh-patient-ui.cjs','tools/patient-visual-standard-v08443.cjs','tools/system-health-audit-v0810.js','tools/validate-pages-site.js','data/patient-document-sections-v08451.json'];
const PROTOCOLS=CODES.map(c=>'protocols/genitourinary/'+fs.readdirSync(path.join(ROOT,'protocols/genitourinary')).find(f=>f.startsWith(c+'-')));
function approvedPath(f){if(!safeRelative(f))return false;if(SHARED_PATHS.includes(f)||PROTOCOLS.includes(f)||CODES.some(c=>f==='data/patient-knowledge/'+c+'.json'))return true;const m=f.match(/^(?:patient|docs\/patient)\/(\d{5})\/([^/]+)$/);return Boolean(m&&CODES.includes(m[1])&&(/^(?:index|guide|knowledge|knowledge-print|handbook|passport|sactcard|consent|consent-form|supportive-care|supportive-care-overview|treatment-journey|treatment-timeline|logistics|support-continuous)\.(?:html|pdf)$/.test(m[2])||/^(?:qr|oncowiki-qr)\.png$/.test(m[2])));}
const protectedPath=f=>PROTECTED_DOMAINS.some(d=>f===d||f.startsWith(d+'/'));
let base;
function baselineFiles(){if(base)return base;base=new Map();for(const l of git(['ls-tree','-rlz',BASE_COMMIT]).toString().split('\0').filter(Boolean)){const m=l.match(/^([0-9]{6}) ([a-z]+) ([a-f0-9]{40}) +([0-9]+|-)\t([\s\S]+)$/);assert(m);base.set(m[5],{blob:m[3],bytes:Number(m[4]),type:m[2]});}for(const[f,r]of prepared)base.set(f,{sha256:r.sha256,bytes:r.bytes,type:'blob'});return base;}
function beforeHash(f){const b=baselineFiles().get(f);if(!b)return null;return b.sha256||sha(git(['show',BASE_COMMIT+':'+f]));}
function createMigration(r){assert.equal(r.schema_version,1);assert.equal(r.release,'0.84.51');assert.equal(r.base_release,'0.84.50');assert.equal(r.base_commit,BASE_COMMIT);assert.equal(r.baseline_manifest_sha256,sha(manifestBytes));assert.equal(r.status,'recorded');assert.deepEqual(r.routes,ROUTES);assert.deepEqual(r.clinical_routes,CLINICAL_ROUTES);for(const[f,c]of Object.entries(r.files)){assert(approvedPath(f),'Unapproved v51 transition '+f);assert.equal(c.before,beforeHash(f),f+' prepared-v50/Git49 before hash');assert.equal(c.before_bytes,baselineFiles().get(f)?.bytes??null);assert(/^[a-f0-9]{64}$/.test(c.after)&&c.after!==c.before);assert(Number.isSafeInteger(c.after_bytes)&&c.after_bytes>0);}return(f,h)=>{assert(safeRelative(f));const c=r.files[f];if(!c)return h;assert(h===c.before||h===c.after,'Unexpected v51 original '+f);return c.after;};}
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
  if(c){assert.equal(sha(bytes),c.after,f+' v51 endpoint');assert.equal(bytes.length,c.after_bytes);}
  else{assert.equal(b.sha256?sha(bytes):blobHash(bytes),b.sha256||b.blob,f+' unchanged prepared baseline');assert.equal(bytes.length,b.bytes);}
  if(historical)historicalCount++;else protectedCount++;
 }
 for(const[f,c]of Object.entries(r.files)){const st=fs.lstatSync(path.join(ROOT,f));assert(st.isFile()&&!st.isSymbolicLink());const bytes=fs.readFileSync(path.join(ROOT,f));assert.equal(sha(bytes),c.after,f);assert.equal(bytes.length,c.after_bytes);}
 function walk(d){for(const e of fs.readdirSync(path.join(ROOT,d),{withFileTypes:true})){const f=d+'/'+e.name;if(e.isDirectory())walk(f);else{assert(e.isFile());assertMember(f,r);currentCount++;}}}for(const d of PROTECTED_DOMAINS)walk(d);
 return{protectedCount,historicalCount,currentCount,changedFiles:Object.keys(r.files).length};
}
async function verifyBeforeHashes(r=load()){createMigration(r);await require('./retrospective-v08450.cjs').verifyBeforeHashes(record50);return Object.values(r.files).filter(x=>x.before!==null).length;}
module.exports={ROOT,BASE_COMMIT,BASE_TREE,RECORD,CODES,NEW_ROUTES,CLINICAL_ROUTES,ROUTES,PROTOCOLS,SHARED_PATHS,PROTECTED_DOMAINS,sha,blobHash,safeRelative,approvedPath,protectedPath,baselineFiles,beforeHash,createMigration,expectedHash,expectedBytes,expectedBuilderHash,assertMember,verifyCurrent,verifyBeforeHashes,baselineManifestSha256:sha(manifestBytes)};
