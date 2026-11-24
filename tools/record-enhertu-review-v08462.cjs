'use strict';
// Run once after the complete00776 review scope is frozen. This authenticates
// every pre-change byte against the fetched baseline and refuses unrelated paths.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),review=require('../tests/helpers/enhertu-review-v08462.cjs');
const git=args=>cp.execFileSync('git',args,{cwd:root,maxBuffer:64*1024*1024,env:{...process.env,GIT_NO_LAZY_FETCH:'1',GIT_TERMINAL_PROMPT:'0'}});
assert.equal(git(['rev-parse','HEAD']).toString().trim(),review.BASE_COMMIT,'Review must be assembled on the fetched baseline');
const retrospectiveFile=path.join(root,'tests/helpers/retrospective-v08462.cjs');
let retrospective=fs.readFileSync(retrospectiveFile,'utf8');
if(!retrospective.includes('const enhertuReview = require("./enhertu-review-v08462.cjs");')){
 const anchor='const filmRecords = [filmRecord, strideRecord, osimertinibRecord, biliaryFilmRecord, biliaryAudioRecord];';
 assert(retrospective.includes(anchor),'Retained publication chain changed; review before wiring');
 retrospective=retrospective.replace(anchor,anchor+'\nconst enhertuReview = require("./enhertu-review-v08462.cjs");');
 const original=`function expected(f,h,n){
  assert(validPath(f));const c=load().files[f];if(!c)return filmExpected(f,h,n);
  assert(h===c.before || h===c.after,f+' mismatched transition origin');
  if(n!==undefined)assert.equal(n,h===c.before?c.before_bytes:c.after_bytes,f+' mismatched origin size');
  return {sha256:c.after,bytes:c.after_bytes};
}`;
 const revised=`function expected(f,h,n){
  assert(validPath(f));
  if(enhertuReview.isCurrent(f,h,n))return enhertuReview.expected(f,h,n);
  const c=load().files[f];let prior;
  if(!c)prior=filmExpected(f,h,n);
  else{
    assert(h===c.before || h===c.after,f+' mismatched transition origin');
    if(n!==undefined)assert.equal(n,h===c.before?c.before_bytes:c.after_bytes,f+' mismatched origin size');
    prior=filmExpected(f,c.after,c.after_bytes);
  }
  return enhertuReview.expected(f,prior.sha256,prior.bytes);
}`;
 assert(retrospective.includes(original),'Retained expected-hash resolver changed; review before wiring');
 retrospective=retrospective.replace(original,revised);
 retrospective=retrospective.replace('function isAddition(f){return ', 'function isAddition(f){return enhertuReview.isAddition(f)||');
 retrospective=retrospective.replace('function verify(){\n  const latest', 'function verify(){\n  enhertuReview.verify();\n  const latest');
 retrospective=retrospective.replace("assert.equal(sha(bytes), change.after, f + ' published film asset');\n    assert.equal(bytes.length, change.after_bytes);", "const reviewed=enhertuReview.expected(f,change.after,change.after_bytes);\n    assert.equal(sha(bytes), reviewed.sha256, f + ' published film asset / reviewed successor');\n    assert.equal(bytes.length, reviewed.bytes);");
 retrospective=retrospective.replace("const bytes=fs.readFileSync(path.join(ROOT,f));assert.equal(sha(bytes),v.after,f+' reviewed output');assert.equal(bytes.length,v.after_bytes);", "const reviewed=enhertuReview.expected(f,v.after,v.after_bytes);const bytes=fs.readFileSync(path.join(ROOT,f));assert.equal(sha(bytes),reviewed.sha256,f+' reviewed output');assert.equal(bytes.length,reviewed.bytes);");
 fs.writeFileSync(retrospectiveFile,retrospective);
}
const packageFile=path.join(root,'package.json'),pkg=JSON.parse(fs.readFileSync(packageFile));
const transitionTest='node tests/enhertu-transition-v08462.test.cjs';
assert(pkg.scripts['test:enhertu-review'],'Clinical review script must remain registered');
if(!pkg.scripts['test:enhertu-review'].includes(transitionTest)){pkg.scripts['test:enhertu-review']+=' && '+transitionTest;fs.writeFileSync(packageFile,JSON.stringify(pkg,null,2)+'\n');}
const paths=[...new Set([...git(['diff','--name-only','-z',review.BASE_COMMIT]).toString().split('\0'),...git(['ls-files','--others','--exclude-standard','-z']).toString().split('\0')].filter(Boolean))].sort();
const files={};
for(const f of paths){
 if([review.RECORD_PATH,review.HELPER_PATH].includes(f))continue;
 assert(review.approvedPath(f),'Explicit review required for out-of-scope path '+f);
 const local=path.join(root,f);assert(fs.existsSync(local)&&fs.lstatSync(local).isFile(),'Deletion or non-file not allowed: '+f);
 const after=fs.readFileSync(local);
 let before=null;const exists=cp.spawnSync('git',['cat-file','-e',review.BASE_COMMIT+':'+f],{cwd:root,env:{...process.env,GIT_NO_LAZY_FETCH:'1'}});
 if(exists.status===0)before=git(['show',review.BASE_COMMIT+':'+f]);else assert.equal(exists.status,128,'Unexpected Git failure for '+f);
 if(before&&before.equals(after))continue;
 files[f]={before:before&&review.sha(before),before_bytes:before&&before.length,after:review.sha(after),after_bytes:after.length};
}
assert(files['protocols/breast/00776-trastuzumab-deruxtecan.json'],'Repaired clinical schema required');
assert(files['patient/00776/index.html'],'Reviewed patient portal required');
assert(files['tests/enhertu-review-v08462.test.cjs'],'Clinical acceptance tests required');
const helperFile=path.join(root,review.HELPER_PATH);
const record={schema_version:1,base_commit:review.BASE_COMMIT,base_tree:git(['rev-parse',review.BASE_COMMIT+'^{tree}']).toString().trim(),base_release:'0.84.62',release:'0.84.62',regimens:['00776'],new_routes:[],review_date:'2026-11-23',scope:'Enhertu clinical calculation and mixed-risk repair, patient suite and fixed patient-video standard',clinical_use_authorised:false,independent_clinical_pharmacy_review:'pending',browser_acceptance:'blocked_environment_not_established_by_function_tests',helper_template_sha256:review.sha(review.normalisedHelper(fs.readFileSync(helperFile))),files};
const bytes=Buffer.from(JSON.stringify(record,null,2)+'\n'),digest=review.sha(bytes);
fs.writeFileSync(path.join(root,review.RECORD_PATH),bytes);
const helper=fs.readFileSync(helperFile,'utf8').replace(/const REVIEWED_SHA256='[^']*';/,`const REVIEWED_SHA256='${digest}';`);fs.writeFileSync(helperFile,helper);
console.log(JSON.stringify({record:review.RECORD_PATH,sha256:digest,files:Object.keys(files).length,base_commit:review.BASE_COMMIT,warning:'Validate pinned scope and complete release checks before delivery; this record does not authorise clinical use or publication.'},null,2));
