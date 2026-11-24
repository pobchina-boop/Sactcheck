'use strict';
// Authenticated post-release00776 repair. The final manifest is pinned only
// after the clinical, patient and video files have been assembled and reviewed.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'../..');
const BASE_COMMIT='f3b923b247b5663b2bd90b2ffb352fccc5a347ea';
const RECORD_PATH='validation/enhertu-review-v08462/transition.json';
const HELPER_PATH='tests/helpers/enhertu-review-v08462.cjs';
const REVIEWED_SHA256='fdc5f62e7d692b06ac5fa2d70573dcf4d555e591018445df737d2600d15b9260';
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const git=args=>cp.execFileSync('git',args,{cwd:ROOT,maxBuffer:64*1024*1024,env:{...process.env,GIT_NO_LAZY_FETCH:'1',GIT_TERMINAL_PROMPT:'0'}});
const validPath=f=>typeof f==='string'&&!path.isAbsolute(f)&&!f.includes('\\')&&!f.includes('\0')&&!f.split('/').some(x=>!x||x==='.'||x==='..');
const shared=new Set([
 'data/regimen-card-overrides.json','data/regimen-card-metadata.json','REGIMEN_CARD_METADATA_REVIEW.csv',
 'AGENTS.md','index.html','package.json','data/app-release.json','data/clinical-validation-register-v0630.json','js/sactcheck-release.js','tests/version-consistency-v0671.test.js','protocols/index.json','protocols/catalogue-bundle.json.gz',
 'protocols/breast/00776-trastuzumab-deruxtecan.json','js/generic-assessment-ui.js','js/protocol-dose-schedule.js',
 'data/breast-completion-v08421-authoring.json','data/breast-completion-v08421-source-index.json','data/patient-knowledge/00776.json',
 'data/patient-presentation-v08431.json','data/phase-support-v0838.json','data/regimen-knowledge-base-v08421-addendum.json',
 'data/enhertu-patient-review-v08462.json','data/patient-video-standard.json','docs/PATIENT_VIDEO_STANDARD.md',
 'tools/patient-canonical-retention-v08445.cjs','tools/patient-presentation-v08431.cjs','tools/patient-publication-v08444.cjs','tools/build-pages-site.js',
 'tools/validate-patient-video-standard.cjs','tests/patient-video-standard.test.cjs','tests/helpers/retrospective-v08462.cjs','tests/full-suite-v0849.test.cjs',
 'tools/build-targeted-v0849-support.py',
 'validation/targeted-breast-v0849/enhertu-source-cases.cjs'
]);
function approvedPath(f){
 if(!validPath(f)||[RECORD_PATH,HELPER_PATH].includes(f))return false;
 return shared.has(f)||/^(?:patient|docs\/patient)\/00776\/[a-z0-9-]+\.(?:html|pdf|png)$/.test(f)||
 /^(?:tools|tests)\/(?:[a-z0-9-]*enhertu[a-z0-9-]*)(?:\.test)?\.(?:cjs|js|py|html)$/.test(f)||
 /^validation\/enhertu-review-v08462\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(?:json(?:\.gz)?|md|txt|pdf|jpg|png|cjs|log)$/.test(f);
}
function normalisedHelper(bytes){return bytes.toString('utf8').replace(/const REVIEWED_SHA256='[^']*';/,"const REVIEWED_SHA256='__REVIEWED_MANIFEST_SHA256__';");}
let record;
function load(){
 if(record)return record;
 const bytes=fs.readFileSync(path.join(ROOT,RECORD_PATH));
 assert.match(REVIEWED_SHA256,/^[a-f\d]{64}$/,'Enhertu final bytes must be pinned before release validation');
 assert.equal(sha(bytes),REVIEWED_SHA256,'Reviewed Enhertu transition bytes');
 const parsed=JSON.parse(bytes);
 assert.equal(parsed.base_commit,BASE_COMMIT);assert.equal(parsed.base_release,'0.84.62');assert.equal(parsed.release,'0.84.62');
 assert.deepEqual(parsed.regimens,['00776']);assert.deepEqual(parsed.new_routes,[]);
 assert.equal(git(['rev-parse',BASE_COMMIT+'^{tree}']).toString().trim(),parsed.base_tree);
 assert.equal(sha(normalisedHelper(fs.readFileSync(path.join(ROOT,HELPER_PATH)))),parsed.helper_template_sha256,'Reviewed Enhertu verification code');
 for(const[f,entry]of Object.entries(parsed.files)){
  assert(approvedPath(f),'Unapproved Enhertu scope: '+f);
  assert(entry.before===null||/^[a-f\d]{64}$/.test(entry.before));assert.match(entry.after,/^[a-f\d]{64}$/);
  assert(Number.isSafeInteger(entry.after_bytes)&&entry.after_bytes>0);assert.notEqual(entry.before,entry.after,f+' unchanged file is not a transition');
 }
 record=parsed;return record;
}
function isCurrent(f,h,n){const entry=load().files[f];return Boolean(entry&&entry.after===h&&(n===undefined||entry.after_bytes===n));}
function expected(f,h,n){
 assert(validPath(f));const entry=load().files[f];if(!entry)return{sha256:h,bytes:n};
 assert(h===entry.before||h===entry.after,f+' unexpected Enhertu transition origin');
 if(n!==undefined)assert.equal(n,h===entry.before?entry.before_bytes:entry.after_bytes,f+' mismatched Enhertu origin size');
 return{sha256:entry.after,bytes:entry.after_bytes};
}
function isAddition(f){return f===RECORD_PATH||f===HELPER_PATH||load().files[f]?.before===null;}
function historicalRuleCount(protocol){
 assert.equal(protocol.metadata?.nccp_regimen_code,'00776','Historical Enhertu rule count is scoped to00776');
 const file='protocols/breast/00776-trastuzumab-deruxtecan.json',entry=load().files[file];
 const before=git(['show',BASE_COMMIT+':'+file]),current=fs.readFileSync(path.join(ROOT,file));
 assert.equal(sha(before),entry.before,'Authentic pre-review Enhertu schema');
 assert.equal(sha(current),entry.after,'Exact reviewed current Enhertu schema');
 assert.deepEqual(protocol,JSON.parse(current),'Legacy count accepts only the exact reviewed protocol');
 const historicalFile='data/targeted-breast-v0849-source-index.json',historical=git(['show',BASE_COMMIT+':'+historicalFile]);
 assert.equal(sha(fs.readFileSync(path.join(ROOT,historicalFile))),sha(historical),'Historical source index remains unchanged');
 const previous=JSON.parse(before).rule_engine.rules.length;
 assert.equal(previous,JSON.parse(historical).regimens['00776'].rule_count,'Historical schema and historical index agree');
 const reviewedFile='data/breast-completion-v08421-source-index.json',reviewed=fs.readFileSync(path.join(ROOT,reviewedFile));
 assert.equal(sha(reviewed),load().files[reviewedFile].after,'Reviewed current source index');
 assert.equal(protocol.rule_engine.rules.length,JSON.parse(reviewed).regimens['00776'].rule_count,'Current schema and current index agree');
 return previous;
}
function verify(){
 const current=load();
 for(const[f,entry]of Object.entries(current.files)){
  if(entry.before===null){assert.equal(cp.spawnSync('git',['cat-file','-e',BASE_COMMIT+':'+f],{cwd:ROOT,env:{...process.env,GIT_NO_LAZY_FETCH:'1'}}).status,128,f+' recorded addition must be absent from baseline');}
  else{const original=git(['show',BASE_COMMIT+':'+f]);assert.equal(sha(original),entry.before,f+' authentic baseline Git bytes');assert.equal(original.length,entry.before_bytes);}
  const live=fs.readFileSync(path.join(ROOT,f));assert.equal(sha(live),entry.after,f+' reviewed Enhertu output');assert.equal(live.length,entry.after_bytes);
 }
 return true;
}
module.exports={ROOT,BASE_COMMIT,RECORD_PATH,HELPER_PATH,approvedPath,normalisedHelper,load,isCurrent,expected,isAddition,historicalRuleCount,verify,sha};
