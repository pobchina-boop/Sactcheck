'use strict';
// This transition starts from the exact unmerged Enhertu review tree.
// Earlier records and route origins remain immutable; only named successors
// may change a current output. No digest is final until the assembly is frozen.
const assert=require('node:assert/strict'),crypto=require('node:crypto'),cp=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'../..');
const BASE_COMMIT='159532b7cd04238588804a504fff5427ce24a057';
const BASE_TREE='d286a0df563173c404f0f6edbd13306aafbbdaae';
const PRODUCTION_BASE_COMMIT='f3b923b247b5663b2bd90b2ffb352fccc5a347ea';
const RECORD_PATH='validation/olaparib-v08463/asset-migrations.json';
const HELPER_PATH='tests/helpers/retrospective-v08463.cjs';
const RECORD=path.join(ROOT,RECORD_PATH);
const REVIEWED_SHA256='aca197519ab569d6ab0e7805023fa5107d23cc60c5ed5071657bd8726d5d07d9';
const CODES=['00588','00746'];
const ROUTES=['00588','00588/prostate','00588/ovarian_first_line','00588/ovarian_relapsed','00588/pancreatic','00746'];
const NEW_ROUTES=['00588/ovarian_first_line','00588/ovarian_relapsed','00588/pancreatic','00746'];
const PROTOCOLS={'00588':'protocols/shared/00588-olaparib-tablet-monotherapy.json','00746':'protocols/gynaecology/00746-olaparib-tablet-and-bevacizumab-therapy.json'};
const PROFILE_PATHS=ROUTES.map(route=>'data/patient-knowledge'+(route.includes('/')?'-contexts':'')+'/'+route+'.json');
const SOURCE_OWNERSHIP={
 clinical_protocols:Object.values(PROTOCOLS),
 patient_profiles:PROFILE_PATHS,
 clinical_education:['data/regimen-knowledge-base-v08463-addendum.json','js/regimen-knowledge-base.js'],
 routing:['js/patient-asset-registry-v0810.js','assets/patient/context-selector-v08425.js','tools/patient-suite-context-v08425.cjs','tools/targeted-patient-suite-v0849.cjs'],
 patient_outputs:ROUTES.flatMap(route=>['patient/'+route+'/','docs/patient/'+route+'/']),
 evidence:['validation/olaparib-v08463/']
};
const SHARED_PATHS=[
 '404.html','about.html','index.html','sustainability.html','package.json','README.md','REGIMEN_CARD_METADATA_REVIEW.csv',
 'protocols/index.json','protocols/catalogue-bundle.json.gz','data/app-release.json','data/nccp-change-tracker/source-register-v0620.json','data/clinical-validation-register-v0630.json',
 'data/emetogenic-risk-map.json','data/regimen-card-metadata.json','data/regimen-card-overrides.json','data/regimen-workflow-v0750.json','data/consent-content-v0710.json',
 'data/breast-treatment-journeys-v0837.json','data/patient-presentation-v08431.json','data/phase-support-v0838.json','data/phase-support-contexts-v08463.json','data/olaparib-patient-review-v08463.json',
 'data/regimen-knowledge-base-v08463-addendum.json','js/regimen-knowledge-base.js','js/treatment-journey-v0837.js','js/patient-asset-registry-v0810.js','js/sactcheck-release.js','js/assessment-engine.js','js/regimen-consent-builder-v0710.js',
 'assets/patient/context-selector-v08425.js','assets/patient/olaparib-v08463.css',
 'tools/build-complete-pathways.cjs','tools/build-patient-knowledge.cjs','tools/build-phase-support-v0838.cjs','tools/patient-presentation-v08431.cjs','tools/patient-publication-v08444.cjs','tools/patient-suite-context-v08425.cjs','tools/targeted-patient-suite-v0849.cjs','tools/patient-canonical-retention-v08445.cjs','tools/patient-pack-v08463.cjs',
 'tests/helpers/retrospective-v08462.cjs','tests/helpers/prostate-inputs-v08457.cjs','tests/helpers/patient-migration-catalogue.cjs','tests/helpers/live-inventory-v08462.cjs','tests/helpers/head-neck-suite-registration-v08445.cjs',
 'tests/enhertu-transition-v08462.test.cjs','tests/enhertu-catalogue-card-v08462.test.cjs','tests/enhertu-review-v08462.test.cjs','tests/enhertu-support-schedule-v08462.test.cjs','tests/gynaecology-complete-library-v0430.test.js','tests/version-consistency-v0671.test.js','tests/release-repair-v08460.test.cjs','tests/sarcoma-v08460.test.cjs',
 'tests/full-suite-v0849.test.cjs','tests/full-suite-v08451.test.cjs','tests/full-suite-v08452.test.cjs','tests/full-suite-v08453.test.cjs','tests/full-suite-v08454.test.cjs','tests/full-suite-v08456.test.cjs','tests/full-suite-v08457.test.cjs','tests/full-suite-v08458.test.cjs','tests/gu-v08459.test.cjs',
 'tests/full-suite-v08421.test.cjs','tests/full-suite-v08437.test.cjs','tests/full-suite-v08438.test.cjs','tests/full-suite-v08439.test.cjs','tests/full-suite-v08440.test.cjs','tests/full-suite-v08441.test.cjs','tests/full-suite-v08445.test.cjs','tests/full-suite-v08446.test.cjs','tests/full-suite-v08447.test.cjs','tests/full-suite-v08448.test.cjs','tests/full-suite-v08449.test.cjs','tests/full-suite-v08450.test.cjs','tests/sarcoma-v08461.test.cjs',
 'validation/targeted-breast-v0849/olaparib-source-cases.cjs'
];
const shared=new Set(SHARED_PATHS);
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const git=args=>cp.execFileSync('git',args,{cwd:ROOT,maxBuffer:64*1024*1024,env:{...process.env,GIT_NO_LAZY_FETCH:'1',GIT_TERMINAL_PROMPT:'0'}});
const validPath=f=>typeof f==='string'&&f.length>0&&!path.isAbsolute(f)&&!f.includes('\\')&&!f.includes('\0')&&!f.split('/').some(x=>!x||x==='.'||x==='..');
function approvedPath(f){
 if(!validPath(f)||[RECORD_PATH,HELPER_PATH].includes(f))return false;
 if(shared.has(f)||Object.values(PROTOCOLS).includes(f)||PROFILE_PATHS.includes(f))return true;
 if(f==='patient/00588/scope.html')return true;
 if(ROUTES.some(route=>['patient/','docs/patient/'].some(prefix=>{
  if(!f.startsWith(prefix+route+'/'))return false;
  const leaf=f.slice((prefix+route+'/').length);
  return /^(?:index|guide|knowledge|knowledge-print|handbook|passport|sactcard|consent|consent-form|supportive-care|supportive-care-overview|treatment-journey|treatment-timeline|logistics|support-treatment)\.(?:html|pdf)$/.test(leaf)||/^(?:qr|oncowiki-qr)\.png$/.test(leaf);
 })))return true;
 if(/^(?:tools|tests)\/[a-z0-9-]*olaparib[a-z0-9-]*-v08463(?:\.test)?\.(?:cjs|js|py)$/.test(f))return true;
 if(/^validation\/olaparib-v08463\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(?:json(?:\.gz)?|md|txt|pdf|jpg|png|cjs|log)$/.test(f))return true;
 return false;
}
let tree;
function treeEntries(){
 if(tree)return tree;
 assert.equal(git(['rev-parse',BASE_COMMIT+'^{tree}']).toString().trim(),BASE_TREE,'Exact inherited Enhertu tree');
 assert.equal(git(['merge-base',BASE_COMMIT,PRODUCTION_BASE_COMMIT]).toString().trim(),PRODUCTION_BASE_COMMIT,'The review base includes production main');
 tree=new Map();
 for(const line of git(['ls-tree','-rlz',BASE_COMMIT]).toString().split('\0').filter(Boolean)){
  const [head,file]=line.split('\t'),[mode,type,oid,size]=head.trim().split(/\s+/);
  if(type==='blob')tree.set(file,{mode,oid,bytes:Number(size)});
 }
 return tree;
}
const digests=new Map();
function baselineBytes(file){
 assert(validPath(file));const entry=treeEntries().get(file);assert(entry,'Missing authenticated baseline file '+file);
 const bytes=git(['cat-file','blob',entry.oid]);assert.equal(bytes.length,entry.bytes,file+' baseline blob size');return bytes;
}
function before(file){
 assert(validPath(file));const entry=treeEntries().get(file);if(!entry)return {before:null,before_bytes:null};
 if(!digests.has(entry.oid))digests.set(entry.oid,sha(baselineBytes(file)));
 return {before:digests.get(entry.oid),before_bytes:entry.bytes};
}
function normalisedHelper(bytes){return bytes.toString('utf8').replace(/const REVIEWED_SHA256='[^']*';/,"const REVIEWED_SHA256='__REVIEWED_MANIFEST_SHA256__';");}
const capivasertibReview = require('./capivasertib-review.cjs');
let record,verifiedDigest;
function createMigration(candidate){
 assert.match(REVIEWED_SHA256,/^[a-f\d]{64}$/,'Freeze and review the olaparib assembly before pinning the transition');
 const digest=sha(Buffer.from(JSON.stringify(candidate,null,2)+'\n'));
 assert.equal(digest,REVIEWED_SHA256,'Immutable reviewed olaparib transition');
 if(verifiedDigest===digest)return expected;
 assert.equal(candidate.schema_version,1);assert.equal(candidate.base_release,'0.84.62');assert.equal(candidate.release,'0.84.63');
 assert.equal(candidate.base_commit,BASE_COMMIT);assert.equal(candidate.base_tree,BASE_TREE);assert.equal(candidate.production_base_commit,PRODUCTION_BASE_COMMIT);
 assert.equal(candidate.record_status,'review_candidate');assert(Array.isArray(candidate.review_revisions));
 assert.deepEqual(candidate.regimens,CODES);assert.deepEqual(candidate.reviewed_routes,ROUTES);assert.deepEqual(candidate.new_routes,NEW_ROUTES);
 assert.deepEqual(candidate.source_ownership,SOURCE_OWNERSHIP);
 assert.equal(candidate.inherited_enhertu_review_status,'unmerged_pending_validation');assert.equal(candidate.clinical_use_authorised,false);
 assert.equal(candidate.independent_clinical_pharmacy_review,'pending');assert.equal(candidate.patient_video_change,'none_requested_voice_clone_pending');
 assert.equal(candidate.helper_template_sha256,sha(normalisedHelper(capivasertibReview.original(HELPER_PATH))),'Reviewed olaparib verification code');
 for(const [file,entry]of Object.entries(candidate.files)){
  assert(approvedPath(file),'Unapproved olaparib scope '+file);
  const origin=before(file);assert.equal(entry.before,origin.before,file+' authentic Git origin');assert.equal(entry.before_bytes,origin.before_bytes,file+' authentic origin size');
  assert.match(entry.after,/^[a-f\d]{64}$/);assert(Number.isSafeInteger(entry.after_bytes)&&entry.after_bytes>0);assert.notEqual(entry.before,entry.after,file+' unchanged file is not a transition');
 }
 for(const [index,revision]of candidate.review_revisions.entries()){
  assert.match(revision.previous_candidate_sha256,/^[a-f\d]{64}$/);
  assert.equal(revision.archive_path,'validation/olaparib-v08463/candidate-history/'+revision.previous_candidate_sha256+'.json');
  assert.equal(revision.reason_path,'validation/olaparib-v08463/candidate-history/'+revision.previous_candidate_sha256+'-reason.json');
  const bytes=fs.readFileSync(path.join(ROOT,revision.archive_path)),reasonBytes=fs.readFileSync(path.join(ROOT,revision.reason_path));
  assert.equal(sha(bytes),revision.previous_candidate_sha256,'Prior candidate record remains byte-identical');
  const archived=JSON.parse(bytes),reason=JSON.parse(reasonBytes);
  assert.equal(archived.release,'0.84.63');assert.equal(archived.base_release,'0.84.62');assert.equal(archived.base_commit,BASE_COMMIT);assert.equal(archived.base_tree,BASE_TREE);
  assert.equal(archived.record_status,'review_candidate');assert.deepEqual(archived.review_revisions,candidate.review_revisions.slice(0,index),'Candidate revision chain remains ordered and complete');
  assert.equal(reason.schema_version,1);assert.equal(reason.previous_candidate_sha256,revision.previous_candidate_sha256);assert.equal(reason.revision_number,index+1);
  assert(typeof reason.reason==='string'&&reason.reason.trim().length>=20&&reason.reason.length<=5000&&!reason.reason.includes('\0'),'Candidate revision has a concrete written reason');
  assert.equal(candidate.files[revision.archive_path]?.after,sha(bytes));assert.equal(candidate.files[revision.archive_path]?.after_bytes,bytes.length);
  assert.equal(candidate.files[revision.reason_path]?.after,sha(reasonBytes));assert.equal(candidate.files[revision.reason_path]?.after_bytes,reasonBytes.length);
 }
 for(const route of NEW_ROUTES){
  assert(!treeEntries().has('patient/'+route+'/index.html'),route+' must have no older route origin');
  for(const leaf of ['index.html','guide.pdf','passport.pdf'])assert(candidate.files['patient/'+route+'/'+leaf],route+'/'+leaf+' required');
 }
 for(const file of [...Object.values(PROTOCOLS),...PROFILE_PATHS,'js/patient-asset-registry-v0810.js','tests/olaparib-patient-routing-v08463.test.cjs'])assert(candidate.files[file],file+' must be captured');
 record=candidate;verifiedDigest=digest;return expected;
}
function load(){
 if(record)return record;
 const bytes=fs.readFileSync(RECORD);assert.equal(sha(bytes),REVIEWED_SHA256,'Exact reviewed olaparib record bytes');createMigration(JSON.parse(bytes));return record;
}
function isCurrent(file,hash,size){const change=load().files[file];return Boolean(change&&change.after===hash&&(size===undefined||change.after_bytes===size));}
function expected(file,hash,size){
 assert(validPath(file));const change=load().files[file];if(!change)return capivasertibReview.expected(file,hash,size);
 assert(hash===change.before||hash===change.after,file+' unexpected olaparib transition origin');
 if(size!==undefined)assert.equal(size,hash===change.before?change.before_bytes:change.after_bytes,file+' mismatched olaparib origin size');
 return {sha256:change.after,bytes:change.after_bytes};
}
function assertCurrent(file,hash,size){
 const current=fs.readFileSync(path.join(ROOT,file)),inherited=expected(file,hash,size),target=capivasertibReview.expected(file,inherited.sha256,inherited.bytes);
 assert.equal(sha(current),target.sha256,file+' current reviewed successor');if(target.bytes!==undefined)assert.equal(current.length,target.bytes,file+' current successor size');return current;
}
function baselineJson(file){
 const original=baselineBytes(file);assertCurrent(file,sha(original),original.length);return JSON.parse(original);
}
function validateProtocol(protocol){
 const code=protocol?.metadata?.nccp_regimen_code;assert(CODES.includes(code),'Olaparib protocol validator is scoped to00588/00746');
 const file=PROTOCOLS[code],change=load().files[file];assert(change,file+' must have an explicit clinical transition');
 const current=assertCurrent(file,change.before,change.before_bytes);assert.deepEqual(protocol,JSON.parse(current),'Only the exact reviewed current olaparib protocol is accepted');
 assert.equal(protocol.metadata.sactcheck_encoding_version,'0.84.63');
 for(const flag of ['clinical_use_authorised','consultant_reviewed','oncology_pharmacy_reviewed'])assert.equal(protocol.metadata.validation[flag],false);
 return {code,path:file,change,historical:JSON.parse(baselineBytes(file))};
}
function historicalProtocol(protocol){return validateProtocol(protocol).historical;}
function verifyPriorEnhertu(prior=require('./enhertu-review-v08462.cjs')){
 // load() retains the original immutable record/helper hash checks.
 const inherited=prior.load();
 assert.equal(sha(fs.readFileSync(path.join(ROOT,prior.HELPER_PATH))),sha(baselineBytes(prior.HELPER_PATH)),'The original Enhertu verifier remains unchanged');
 assert.equal(sha(fs.readFileSync(path.join(ROOT,prior.RECORD_PATH))),sha(baselineBytes(prior.RECORD_PATH)),'The original Enhertu transition remains unchanged');
 for(const [file,entry]of Object.entries(inherited.files)){
  if(entry.before===null)assert.equal(cp.spawnSync('git',['cat-file','-e',prior.BASE_COMMIT+':'+file],{cwd:ROOT,env:{...process.env,GIT_NO_LAZY_FETCH:'1',GIT_TERMINAL_PROMPT:'0'}}).status,128,file+' original addition absent from baseline');
  else{
   const original=git(['show',prior.BASE_COMMIT+':'+file]);assert.equal(sha(original),entry.before,file+' original Enhertu Git bytes');assert.equal(original.length,entry.before_bytes);
  }
  const priorState=before(file);assert.equal(priorState.before,entry.after,file+' inherited exact Enhertu output');assert.equal(priorState.before_bytes,entry.after_bytes);
  assertCurrent(file,entry.after,entry.after_bytes);
 }
 return true;
}
function isAddition(file){return capivasertibReview.addition(file)||[RECORD_PATH,HELPER_PATH].includes(file)||load().files[file]?.before===null;}
function changedPaths(){return [...new Set([...git(['diff','--name-only','-z',BASE_COMMIT,'--']).toString().split('\0'),...git(['ls-files','--others','--exclude-standard','-z']).toString().split('\0')].filter(Boolean))].sort();}
function verify(){
 const current=load();
 capivasertibReview.verify();
 for(const [file,entry]of Object.entries(current.files)){
  const disk=path.join(ROOT,file);assert(fs.existsSync(disk)&&fs.lstatSync(disk).isFile()&&!fs.lstatSync(disk).isSymbolicLink(),file+' must remain a regular file');assertCurrent(file,entry.before,entry.before_bytes);
 }
 for(const file of changedPaths())assert([RECORD_PATH,HELPER_PATH].includes(file)||current.files[file]||capivasertibReview.owns(file),'Unrecorded change outside the frozen olaparib assembly: '+file);
 verifyPriorEnhertu();
 return true;
}
module.exports={ROOT,BASE_COMMIT,BASE_TREE,PRODUCTION_BASE_COMMIT,RECORD,RECORD_PATH,HELPER_PATH,CODES,ROUTES,NEW_ROUTES,PROTOCOLS,PROFILE_PATHS,SOURCE_OWNERSHIP,SHARED_PATHS,sha,validPath,approvedPath,treeEntries,baselineBytes,before,normalisedHelper,createMigration,load,isCurrent,expected,expectedHash:(f,h)=>expected(f,h).sha256,expectedBytes:(f,n,h)=>expected(f,h,n).bytes,assertCurrent,baselineJson,validateProtocol,historicalProtocol,verifyPriorEnhertu,isAddition,changedPaths,verify};
