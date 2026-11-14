'use strict';
// Proposed destination: tests/helpers/retrospective-v08449.cjs.
// Terminal, explicitly reviewed v49 transitions; no expected hash is read from
// the current asset. Git48 proves every before blob. Historical records remain frozen.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process'),assert=require('node:assert/strict');
function findRoot(at){for(let p=path.resolve(at);;p=path.dirname(p)){if(fs.existsSync(path.join(p,'package.json'))&&fs.existsSync(path.join(p,'protocols')))return p;if(path.dirname(p)===p)throw Error('Cannot locate SACTCheck checkout');}}
const ROOT=findRoot(__dirname),BASE_COMMIT='a54aa0e5306c06c0e02f203b30b6f094ad13382c',BASE_TREE='7341ab58dabb13c6c33ca14316175dd4a995636b';
const RECORD=path.join(ROOT,'validation/head-neck-v08449/asset-migrations.json');
const SHA=/^[a-f0-9]{64}$/,SHA1=/^[a-f0-9]{40}$/;
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const blobHash=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const git=args=>cp.execFileSync('git',args,{cwd:ROOT,maxBuffer:128*1024*1024});
const CODES=Object.freeze(["00315", "00323", "00324", "00332", "00419", "00514", "00517", "00589", "00591", "00903"]);
const NEW_ROUTES=Object.freeze(["00514", "00517", "00903", "00589", "00591"]);
const CLINICAL_ROUTES=Object.freeze(["00315", "00323", "00324", "00332", "00419/head_neck", "00514", "00517", "00589", "00591", "00903"]);
const ROUTE_SET_SHA256='614451df27237af3ffcbb3842fe5d0e55d8a5234ba31e9f20290760e7ef24e60';
const CLINICAL_ROUTE_SET_SHA256='eb901d6dd0822cb5a15ecf2a33211a52e85533af8e1bb3be73ade59bb5c3f57f';
assert.equal(git(['rev-parse',BASE_COMMIT+'^{tree}']).toString().trim(),BASE_TREE,'Pinned v48 Git tree required');
assert.equal(JSON.parse(git(['show',BASE_COMMIT+':package.json'])).version,'0.84.48');
const oldRoutes=JSON.parse(git(['show',BASE_COMMIT+':validation/head-neck-v08448/asset-migrations.json'])).routes;
const ROUTES=Object.freeze([...new Set([...oldRoutes,...NEW_ROUTES])].sort());
assert.equal(ROUTES.length,254);assert.equal(sha(ROUTES.join('\n')+'\n'),ROUTE_SET_SHA256);assert.equal(sha(CLINICAL_ROUTES.join('\n')+'\n'),CLINICAL_ROUTE_SET_SHA256);
const clinical=new Set(CLINICAL_ROUTES),routes=new Set(ROUTES);
const PROTOCOLS=Object.freeze(["protocols/head-neck/00514-gemcitabine-1250-mg-m-monotherapy-21-day.json", "protocols/head-neck/00517-gemcitabine-1250-mg-m-and-cisplatin-80-mg-m-21-day.json", "protocols/head-neck/00903-gemcitabine-1000-mg-m-and-cisplatin-80-mg-m-induction.json", "protocols/head-neck/00589-carboplatin-70-mg-m-and-5-fluorouracil-600-mg-m-with-radiotherapy.json", "protocols/head-neck/00591-carboplatin-auc-4-and-5-fluorouracil-600-mg-m-with-radiotherapy.json"]);
const protocols=new Set(PROTOCOLS);
const SHARED_PATHS=Object.freeze(["data/regimen-workflow-v0750.json", "data/emetogenic-risk-map.json", "404.html", "about.html", "index.html", "sustainability.html", "package.json", "data/app-release.json", "js/sactcheck-release.js", "protocols/index.json", "data/regimen-card-metadata.json", "data/regimen-card-overrides.json", "data/breast-treatment-journeys-v0837.json", "data/patient-presentation-v08431.json", "data/phase-support-v0838.json", "data/consent-content-v0710.json", "data/phase-support-contexts-v08449.json", "data/regimen-knowledge-base-v08449-addendum.json", "js/patient-asset-registry-v0810.js", "js/regimen-knowledge-base.js", "js/protocol-id-migrations.js", "js/regimen-workflow-engine-v0750.js", "js/treatment-journey-v0837.js", "assets/patient/context-selector-v08425.js", "assets/patient/phase-support-v0838.js", "tools/system-health-audit-v0810.js", "tools/validate-pages-site.js", "tools/patient-suite-context-v08425.cjs", "tools/patient-visual-standard-v08443.cjs", "tools/refresh-patient-ui.cjs", "tools/build-patient-knowledge.cjs", "tools/build-complete-pathways.cjs", "tools/build-phase-support-v0838.cjs", "tools/patient-presentation-v08431.cjs", "tools/patient-pack-v08449.cjs", "tools/draft-migration-v08449.cjs", "tools/audit-patient-companions-v08449.py", "tools/build-patient-documents-v08449.py", "tools/verify-patient-documents-v08449.py", "tools/verify-pdf-metadata-equivalence-v08449.py", "tools/build-head-neck-v08449-pdfs.py", "tools/verify-head-neck-v08449-pdfs.py", "tools/render-head-neck-packs-v08449.py", "tools/verify-head-neck-packs-v08449.py", "data/patient-document-sections-v08449.json", "tools/build-head-neck-v08449-qr.py"]);
const shared=new Set(SHARED_PATHS);
const PRESENTATION_FILES=new Set(['index.html','guide.html','guide.pdf','knowledge.html','knowledge-print.html','knowledge.pdf','handbook.pdf','passport.html','passport.pdf','treatment-journey.html','treatment-journey.pdf','treatment-timeline.html','treatment-timeline.pdf','logistics.html','logistics.pdf','supportive-care.html','supportive-care.pdf','supportive-care-overview.html','consent.html']);
const CLINICAL_FILES=new Set([...PRESENTATION_FILES,'consent-form.html','consent-form.pdf','sactcard.html','sactcard.pdf','qr.png','oncowiki-qr.png','port-pump.html','port-pump.pdf','scope.html']);
const PROTECTED_DOMAINS=Object.freeze(['patient','docs/patient','protocols','data','assets/patient','js']);
const sourcePath=r=>r.includes('/')?'data/patient-knowledge-contexts/'+r+'.json':'data/patient-knowledge/'+r+'.json';
const clinicalSources=new Set(CLINICAL_ROUTES.map(sourcePath));
function safeRelative(f){return typeof f==='string'&&f.length>0&&!f.startsWith('/')&&!f.includes('\\')&&!f.includes('\0')&&!f.split('/').some(x=>!x||x==='.'||x==='..');}
function protectedPath(f){return PROTECTED_DOMAINS.some(d=>f===d||f.startsWith(d+'/'));}
function approvedPath(f){
 if(!safeRelative(f))return false;
 if(protocols.has(f)||shared.has(f)||clinicalSources.has(f)||['patient/00419/index.html','patient/00419/scope.html','docs/patient/00419/index.html'].includes(f))return true;
 const m=f.match(/^(?:patient|docs\/patient)\/(\d{5}(?:\/[a-z0-9_]+)?)\/([^/]+)$/);
 if(!m)return false;
 if(clinical.has(m[1]))return CLINICAL_FILES.has(m[2])||/^support-[a-z0-9_-]+\.(html|pdf)$/.test(m[2]);
 return false;
}
let tree;
function baselineFiles(){
 if(tree)return tree;tree=new Map();
 for(const line of git(['ls-tree','-rlz',BASE_COMMIT]).toString().split('\0').filter(Boolean)){
  const m=line.match(/^([0-9]{6}) ([a-z]+) ([a-f0-9]{40}) +([0-9]+|-)\t([\s\S]+)$/);assert(m,'Invalid Git tree entry');
  tree.set(m[5],Object.freeze({mode:m[1],type:m[2],blob:m[3],bytes:Number(m[4])}));
 }
 return tree;
}
function historicalPath(f){return /^validation\//.test(f)&&/\/(?:retrospective-hashes|shared-builder-revisions|ui-asset-hashes|clinical-migration|asset-migrations|migration-baseline|scope|baseline-[^/]*manifest)\.json$/.test(f)&&!f.includes('v08449/');}
function createMigration(record){
 if(!record||record.schema_version!==1||record.release!=='0.84.49'||record.base_release!=='0.84.48'||record.base_commit!==BASE_COMMIT||record.baseline_tree_sha!==BASE_TREE||record.status!=='recorded'||record.route_set_sha256!==ROUTE_SET_SHA256||record.clinical_route_set_sha256!==CLINICAL_ROUTE_SET_SHA256||JSON.stringify(record.codes)!==JSON.stringify(CODES)||JSON.stringify(record.clinical_routes)!==JSON.stringify(CLINICAL_ROUTES)||JSON.stringify(record.routes)!==JSON.stringify(ROUTES)||!record.files||Array.isArray(record.files)||!Object.keys(record.files).length)throw Error('Invalid reviewed v49 migration record');
 const changes=new Map(),base=baselineFiles();
 for(const [f,c]of Object.entries(record.files)){
  if(!approvedPath(f))throw Error('Unapproved v49 migration path '+f);
  const old=base.get(f);
  if(!c||!SHA.test(c.after)||c.after===c.before||!Number.isSafeInteger(c.after_bytes)||c.after_bytes<=0||
     (old?(old.type!=='blob'||!['100644','100755'].includes(old.mode)||!SHA.test(c.before)||c.before_git_blob_sha1!==old.blob||c.before_bytes!==old.bytes):(c.before!==null||c.before_bytes!==null||c.before_git_blob_sha1!==null)))throw Error('Invalid v49 baseline/hash transition '+f);
  changes.set(f,Object.freeze({...c}));
 }
 return function migrate(f,original){if(!safeRelative(f))throw Error('Unsafe v49 lookup '+f);const c=changes.get(f);if(!c)return original;if(original!==c.before&&original!==c.after)throw Error('Unexpected v49 original hash '+f);return c.after;};
}
async function verifyBeforeHashes(record){
 createMigration(record);
 const entries=Object.entries(record.files).filter(([,c])=>c.before!==null);
 if(!entries.length)return 0;
 const child=cp.spawn('git',['cat-file','--batch'],{cwd:ROOT,stdio:['pipe','pipe','pipe']});
 const done=new Promise((resolve,reject)=>{child.once('close',resolve);child.once('error',reject);});
 let stderr='';child.stderr.on('data',c=>stderr+=c);
 child.stdin.end(entries.map(([f])=>BASE_COMMIT+':'+f).join('\n')+'\n');
 let state='header',head=Buffer.alloc(0),remaining=0,hash,index=0;
 try{
  for await(const chunk of child.stdout){let at=0;while(at<chunk.length){
   if(state==='header'){
    const n=chunk.indexOf(10,at);if(n<0){head=Buffer.concat([head,chunk.subarray(at)]);break;}head=Buffer.concat([head,chunk.subarray(at,n)]);at=n+1;
    const m=head.toString().match(/^([a-f0-9]{40}) blob (\d+)$/);head=Buffer.alloc(0);assert(m,'Missing baseline blob');
    const [f,c]=entries[index]||[];assert(f,'Unexpected Git output');assert.equal(m[1],c.before_git_blob_sha1,f+' Git identity');assert.equal(Number(m[2]),c.before_bytes,f+' baseline bytes');remaining=Number(m[2]);hash=crypto.createHash('sha256');state=remaining?'body':'delimiter';
   }else if(state==='body'){const n=Math.min(remaining,chunk.length-at);hash.update(chunk.subarray(at,at+n));at+=n;remaining-=n;if(!remaining)state='delimiter';}
   else{assert.equal(chunk[at++],10);assert.equal(hash.digest('hex'),entries[index][1].before,entries[index][0]+' baseline SHA256');index++;state='header';}
  }}
  assert.equal(await done,0,stderr);assert.equal(index,entries.length);assert.equal(state,'header');assert.equal(head.length,0);
 }finally{if(child.exitCode===null)child.kill();}
 return entries.length;
}
function assertRegular(f){const st=fs.lstatSync(path.join(ROOT,f));assert(st.isFile()&&!st.isSymbolicLink(),f+' must be a regular asset');return st;}
function assertMember(f,record){assert(safeRelative(f),'Unsafe membership path');assert(baselineFiles().has(f)||Object.hasOwn(record.files,f),f+' unrecorded new protected file');}
function verifyCurrent(record){
 createMigration(record);
 const endpoint='15c524e0a843b8d869cc6bc6e3ecc6a26f18f2a6';
 const frozen=JSON.parse(readGitFiles(endpoint,['validation/head-neck-v08449/asset-migrations.json']).get('validation/head-neck-v08449/asset-migrations.json'));
 assert.deepEqual(record,frozen,'Historical v49 migration record remains exactly committed');
 // Read bounded batches so retained PDF history does not exceed spawnSync's
 // output limit. Every endpoint byte/hash check is preserved.
 const entries=Object.entries(record.files);
 for(let i=0;i<entries.length;i+=16){const batch=entries.slice(i,i+16);const blobs=readGitFiles(endpoint,batch.map(([f])=>f));
  for(const [f,c]of batch){const b=blobs.get(f);assert.equal(sha(b),c.after,f+' verified v49 endpoint hash');assert.equal(b.length,c.after_bytes,f+' verified v49 endpoint size');}
 }
 const next=require('./retrospective-v08450.cjs');
 return next.verifyCurrent(JSON.parse(fs.readFileSync(next.RECORD,'utf8')));
}
let activeRecord,migrate;
function load(){if(!migrate){activeRecord=JSON.parse(fs.readFileSync(RECORD,'utf8'));migrate=createMigration(activeRecord);}}
function expectedHash(f,h){load();return require('./retrospective-v08450.cjs').expectedHash(f,migrate(f,h));}
function expectedBytes(f,n,h){load();migrate(f,h);const next=require('./retrospective-v08450.cjs'),c=activeRecord.files[f];if(!c)return next.expectedBytes(f,n,h);assert.equal(n,h===c.before?c.before_bytes:c.after_bytes,'Unexpected v49 original byte count '+f);return next.expectedBytes(f,c.after_bytes,c.after);}
function expectedBuilderHash(f,h){if(!safeRelative(f)||!/^tools\/[a-zA-Z0-9_-]+\.(?:cjs|js|py)$/.test(f))throw Error('Unsafe v49 builder lookup');return expectedHash(f,h);}
function readFrozen(f){if(!safeRelative(f))throw Error('Unsafe frozen lookup');return git(['show',BASE_COMMIT+':'+f]);}
function readGitFiles(commit,files){
 assert(SHA1.test(commit),'Full Git commit required');for(const f of files)assert(safeRelative(f),'Unsafe historical path');
 if(!files.length)return new Map();
 const bytes=cp.execFileSync('git',['cat-file','--batch'],{cwd:ROOT,input:files.map(f=>commit+':'+f).join('\n')+'\n',maxBuffer:128*1024*1024});
 const result=new Map();let at=0;
 for(const f of files){const end=bytes.indexOf(10,at);assert(end>=0);const m=bytes.subarray(at,end).toString().match(/^([a-f0-9]{40}) blob (\d+)$/);assert(m,'Missing historical blob '+f);const start=end+1,stop=start+Number(m[2]);assert(stop<bytes.length);const data=bytes.subarray(start,stop);assert.equal(blobHash(data),m[1],f+' Git body identity');assert.equal(bytes[stop],10);result.set(f,data);at=stop+1;}
 assert.equal(at,bytes.length,'Unexpected historical output');return result;
}
const readFrozenMany=files=>readGitFiles(BASE_COMMIT,files);
module.exports={ROOT,BASE_COMMIT,BASE_TREE,RECORD,CODES,NEW_ROUTES,CLINICAL_ROUTES,ROUTES,ROUTE_SET_SHA256,CLINICAL_ROUTE_SET_SHA256,PROTOCOLS,SHARED_PATHS,PROTECTED_DOMAINS,sha,blobHash,safeRelative,approvedPath,protectedPath,historicalPath,baselineFiles,createMigration,verifyBeforeHashes,verifyCurrent,assertMember,expectedHash,expectedBytes,expectedBuilderHash,readFrozen,readGitFiles,readFrozenMany};
