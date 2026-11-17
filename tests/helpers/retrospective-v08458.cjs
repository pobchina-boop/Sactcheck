'use strict';
// v58 transitions are anchored to the actual, verified v57 commit and tree.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'../..'),BASE_COMMIT='0eba2249a65dce9bcdf6be1b2115869b9563cd38',BASE_TREE='6475f55dd490914c0df0f1e65d5a7866fc5f583f';
const RECORD=path.join(ROOT,'validation/gu-v08458/asset-migrations.json'),previousMigrationSha256='e090aab39647a225856c5aa5c315cf7ad4be7bc4d92a8d7f60a320cb8f915371';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),blobHash=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const git=a=>cp.execFileSync('git',a,{cwd:ROOT,maxBuffer:128*1024*1024});
assert.equal(git(['rev-parse',BASE_COMMIT+'^{tree}']).toString().trim(),BASE_TREE);
assert.equal(sha(fs.readFileSync(path.join(ROOT,'validation/prostate-v08457/asset-migrations.json'))),previousMigrationSha256);
const CODES=["00282", "00622", "00628", "00450", "00759", "00333", "00337", "00338", "00583", "00846"],NEW_ROUTES=[...CODES],CLINICAL_ROUTES=[...CODES,"00104","00518","00564","00326","00588/prostate"];
const ROUTES=[...new Set([...JSON.parse(fs.readFileSync(path.join(ROOT,'validation/prostate-v08457/asset-migrations.json'))).routes,...NEW_ROUTES])].sort();assert.equal(ROUTES.length,299);
const PROTECTED_DOMAINS=['patient','docs/patient','protocols','data','assets/patient','js'];
const SHARED_PATHS=["package.json", "index.html", "about.html", "sustainability.html", "404.html", "data/app-release.json", "data/regimen-card-metadata.json", "data/clinical-validation-register-v0630.json", "js/sactcheck-release.js", "js/patient-asset-registry-v0810.js", "protocols/index.json", "protocols/catalogue-bundle.json.gz", "data/breast-treatment-journeys-v0837.json", "js/treatment-journey-v0837.js", "data/phase-support-v0838.json", "data/regimen-workflow-v0750.json", "data/patient-presentation-v08431.json", "data/regimen-knowledge-base-v08458-addendum.json", "js/regimen-knowledge-base.js", "js/protocol-id-migrations.js", "js/patient-anatomy-data-v08431.js", "js/treatment-relationship-v0835.js", "tools/patient-presentation-v08431.cjs", "tools/patient-pack-v08458.cjs", "tools/build-complete-pathways.cjs", "tools/build-patient-knowledge.cjs", "tools/build-phase-support-v0838.cjs", "tools/verify-patient-documents-v08444.py"];
const PROTOCOLS=CODES.map(c=>{const folder='genitourinary';return 'protocols/'+folder+'/'+fs.readdirSync(path.join(ROOT,'protocols',folder)).find(f=>f.startsWith(c+'-'));});
const safeRelative=f=>typeof f==='string'&&f&&!f.startsWith('/')&&!f.includes('\\')&&!f.split('/').some(x=>!x||x==='..'||x==='.')&&!f.includes('\0');
function approvedPath(f){if(!safeRelative(f))return false;if(['00104','00326','00518','00564','00588/prostate'].some(r=>f==='patient/'+r+'/knowledge-print.html'||f==='docs/patient/'+r+'/knowledge-print.html'))return true;if(SHARED_PATHS.includes(f)||PROTOCOLS.includes(f))return true;if(NEW_ROUTES.some(r=>f===('data/patient-knowledge'+(r.includes('/')?'-contexts':'')+'/'+r+'.json')))return true;return NEW_ROUTES.some(r=>['patient/','docs/patient/'].some(prefix=>f.startsWith(prefix+r+'/')&&/^(?:index|guide|knowledge|knowledge-print|handbook|passport|sactcard|consent|consent-form|supportive-care|supportive-care-overview|treatment-journey|treatment-timeline|logistics|support-treatment|support-day1|support-day8|support-gemcitabine|support-fluorouracil|support-weekly|support-mtx|support-vac|support-mv|support-cis|support-continuous|support-infusion|port-pump)\.(?:html|pdf)$|^(?:qr|oncowiki-qr)\.png$/.test(f.slice((prefix+r+'/').length))));}
const protectedPath=f=>PROTECTED_DOMAINS.some(d=>f===d||f.startsWith(d+'/'));
let baseline;
function baselineFiles(){if(baseline)return baseline;baseline=new Map();for(const line of git(['ls-tree','-rlz',BASE_COMMIT]).toString().split('\0').filter(Boolean)){const m=line.match(/^([0-9]{6}) ([a-z]+) ([a-f0-9]{40}) +([0-9]+|-)\t([\s\S]+)$/);assert(m);baseline.set(m[5],{blob:m[3],bytes:Number(m[4]),type:m[2]});}return baseline;}
function beforeHash(f){const b=baselineFiles().get(f);if(!b)return null;return b.sha256||(b.sha256=sha(git(['show',BASE_COMMIT+':'+f])));}
function createMigration(r){assert.equal(r.schema_version,1);assert.equal(r.release,'0.84.58');assert.equal(r.base_release,'0.84.57');assert.equal(r.base_commit,BASE_COMMIT);assert.equal(r.previous_migration_sha256,previousMigrationSha256);assert.equal(r.status,'recorded');assert.deepEqual(r.routes,ROUTES);assert.deepEqual(r.clinical_routes,CLINICAL_ROUTES);for(const[f,c]of Object.entries(r.files)){assert(approvedPath(f),'Unapproved v58 transition '+f);assert.equal(c.before,beforeHash(f),f+' Git55 origin');assert.equal(c.before_bytes,baselineFiles().get(f)?.bytes??null);assert(/^[a-f0-9]{64}$/.test(c.after)&&c.after!==c.before);assert(Number.isSafeInteger(c.after_bytes)&&c.after_bytes>0);}return(f,h)=>{assert(safeRelative(f));const c=r.files[f];if(!c)return h;assert(h===c.before||h===c.after,'Unexpected v58 original '+f);return c.after;};}
let record,migrate;
function load(){if(!record){record=JSON.parse(fs.readFileSync(RECORD));migrate=createMigration(record);}return record;}
function expectedHash(f,h){load();return migrate(f,h);}
function expectedBytes(f,n,h){const r=load();migrate(f,h);const c=r.files[f];if(!c)return n;assert.equal(n,h===c.before?c.before_bytes:c.after_bytes);return c.after_bytes;}
function assertMember(f,r=load()){assert(safeRelative(f));assert(baselineFiles().has(f)||Object.hasOwn(r.files,f),'Unrecorded protected file '+f);}
function verifyCurrent(r=load()){
 createMigration(r);let protectedCount=0,historicalCount=0,currentCount=0;
 for(const[f,b]of baselineFiles()){
  const historical=f.startsWith('validation/')&&/(?:asset-migrations|clinical-migration|scope|baseline-[^/]*manifest|retrospective-hashes|shared-builder-revisions)\.json$/.test(f);
  if(!protectedPath(f)&&!historical&&!SHARED_PATHS.includes(f))continue;
  const bytes=fs.readFileSync(path.join(ROOT,f)),c=r.files[f];assert.equal(c?sha(bytes):blobHash(bytes),c?c.after:b.blob,f+' exact v57 or approved v58');assert.equal(bytes.length,c?c.after_bytes:b.bytes);if(historical)historicalCount++;else protectedCount++;
 }
 for(const[f,c]of Object.entries(r.files)){const b=fs.readFileSync(path.join(ROOT,f));assert.equal(sha(b),c.after,f);assert.equal(b.length,c.after_bytes);}
 function walk(d){for(const e of fs.readdirSync(path.join(ROOT,d),{withFileTypes:true})){const f=d+'/'+e.name;if(e.isDirectory())walk(f);else{assert(e.isFile());assertMember(f,r);currentCount++;}}}for(const d of PROTECTED_DOMAINS)walk(d);
 for(const f of SHARED_PATHS.filter(f=>!protectedPath(f))){assert(fs.lstatSync(path.join(ROOT,f)).isFile());assertMember(f,r);currentCount++;}
 return{protectedCount,historicalCount,currentCount,changedFiles:Object.keys(r.files).length};
}
async function verifyBeforeHashes(r=load()){createMigration(r);await require('./retrospective-v08457.cjs').verifyBeforeHashes();return Object.values(r.files).filter(x=>x.before!==null).length;}
module.exports={ROOT,BASE_COMMIT,BASE_TREE,RECORD,CODES,NEW_ROUTES,CLINICAL_ROUTES,ROUTES,PROTOCOLS,SHARED_PATHS,PROTECTED_DOMAINS,sha,blobHash,safeRelative,approvedPath,protectedPath,baselineFiles,beforeHash,createMigration,expectedHash,expectedBytes,expectedBuilderHash:expectedHash,assertMember,verifyCurrent,verifyBeforeHashes,previousMigrationSha256};
