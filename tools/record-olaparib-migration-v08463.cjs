'use strict';
// --scope is read-only. Normal --write never changes a pinned candidate.
// --write --revise-candidate --reason-file <path> explicitly archives a prior
// v63 review candidate and records a reason before pinning a new candidate.
// Published/pre-v63 transitions are never rewritten or treated as candidates.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const m=require('../tests/helpers/retrospective-v08463.cjs');
function revisionPlan(previousBytes,expectedSha,reason){
 assert.match(expectedSha,/^[a-f\d]{64}$/,'A previous candidate must have a pinned digest');
 assert.equal(m.sha(previousBytes),expectedSha,'Authenticate the prior candidate before archiving');
 const previous=JSON.parse(previousBytes);
 assert.equal(previous.release,'0.84.63');assert.equal(previous.base_release,'0.84.62');
 assert.equal(previous.base_commit,m.BASE_COMMIT);assert.equal(previous.base_tree,m.BASE_TREE);
 assert.equal(previous.record_status,'review_candidate','Only an unpublished v63 review candidate may be revised');
 assert(Array.isArray(previous.review_revisions),'Candidate history must be explicit');
 assert.equal(typeof reason,'string');reason=reason.trim();
 assert(reason.length>=20&&reason.length<=5000&&!reason.includes('\0'),'Write a concrete revision reason of20–5000 characters');
 const archivePath='validation/olaparib-v08463/candidate-history/'+expectedSha+'.json';
 const reasonPath='validation/olaparib-v08463/candidate-history/'+expectedSha+'-reason.json';
 const reasonBytes=Buffer.from(JSON.stringify({schema_version:1,previous_candidate_sha256:expectedSha,revision_number:previous.review_revisions.length+1,reason},null,2)+'\n');
 return {archivePath,archiveBytes:Buffer.from(previousBytes),reasonPath,reasonBytes,history:[...previous.review_revisions,{previous_candidate_sha256:expectedSha,archive_path:archivePath,reason_path:reasonPath}]};
}
function writeArchive(file,bytes){
 const disk=path.join(m.ROOT,file);
 if(fs.existsSync(disk))assert(fs.readFileSync(disk).equals(bytes),'A previous candidate archive must remain immutable: '+file);
 else{fs.mkdirSync(path.dirname(disk),{recursive:true});fs.writeFileSync(disk,bytes);}
}
function main(){
const paths=m.changedPaths();
if(process.argv.includes('--scope')){
 const review=paths.filter(file=>![m.RECORD_PATH,m.HELPER_PATH].includes(file)).map(file=>({path:file,approved:m.approvedPath(file),origin:m.treeEntries().has(file)?'existing':'new'}));
 console.log(JSON.stringify({release:'0.84.63',base_commit:m.BASE_COMMIT,base_tree:m.BASE_TREE,new_routes:m.NEW_ROUTES,source_ownership:m.SOURCE_OWNERSHIP,paths:review,unapproved:review.filter(item=>!item.approved).map(item=>item.path)},null,2));
 process.exitCode=review.some(item=>!item.approved)?1:0;
}else{
 assert.equal(JSON.parse(fs.readFileSync(path.join(m.ROOT,'package.json'))).version,'0.84.63','Root release integration must be complete before final recording');
 const helperFile=path.join(m.ROOT,m.HELPER_PATH),helperSource=fs.readFileSync(helperFile,'utf8');
 const oldPin=helperSource.match(/const REVIEWED_SHA256='([^']*)';/)[1];
 const previousBytes=fs.existsSync(m.RECORD)?fs.readFileSync(m.RECORD):null;
 const previous=previousBytes?JSON.parse(previousBytes):null;
 let history=previous?.review_revisions||[];
 const revise=process.argv.includes('--revise-candidate'),reasonIndex=process.argv.indexOf('--reason-file');
 if(revise){
  assert(process.argv.includes('--write'),'Candidate revision requires explicit --write');
  assert(previousBytes,'There is no previous candidate to revise');
  assert(reasonIndex>=0&&process.argv[reasonIndex+1],'Candidate revision requires --reason-file with a concrete review reason');
  const reason=fs.readFileSync(process.argv[reasonIndex+1],'utf8'),plan=revisionPlan(previousBytes,oldPin,reason);
  writeArchive(plan.archivePath,plan.archiveBytes);writeArchive(plan.reasonPath,plan.reasonBytes);history=plan.history;
 }else assert.equal(reasonIndex,-1,'A revision reason requires explicit --revise-candidate');
 const files={};
 for(const file of m.changedPaths()){
  if([m.RECORD_PATH,m.HELPER_PATH].includes(file))continue;
  assert(m.approvedPath(file),'Explicit scope review required for '+file);
  const disk=path.join(m.ROOT,file);
  assert(fs.existsSync(disk)&&fs.lstatSync(disk).isFile()&&!fs.lstatSync(disk).isSymbolicLink(),'Deletion, symlink or non-file is not an allowed transition: '+file);
  const current=fs.readFileSync(disk),origin=m.before(file),after=m.sha(current);
  if(after===origin.before)continue;
  files[file]={...origin,after,after_bytes:current.length};
 }
 for(const route of m.ROUTES)for(const leaf of ['index.html','guide.pdf','passport.pdf','sactcard.pdf','handbook.pdf','consent-form.pdf','support-treatment.pdf']){
  const file='patient/'+route+'/'+leaf;assert(fs.existsSync(path.join(m.ROOT,file)),file+' must be generated before recording');
  if(leaf.endsWith('.pdf')){
   const current=fs.readFileSync(path.join(m.ROOT,file));assert.equal(current.subarray(0,5).toString(),'%PDF-');
   assert(current.equals(fs.readFileSync(path.join(m.ROOT,'docs',file))),file+' compatibility mirror must match');
  }
 }
 for(const file of [...Object.values(m.PROTOCOLS),...m.PROFILE_PATHS])assert(files[file],file+' must have an explicit review transition');
 const record={
  schema_version:1,release:'0.84.63',base_release:'0.84.62',base_commit:m.BASE_COMMIT,base_tree:m.BASE_TREE,production_base_commit:m.PRODUCTION_BASE_COMMIT,
  record_status:'review_candidate',review_revisions:history,
  regimens:m.CODES,reviewed_routes:m.ROUTES,new_routes:m.NEW_ROUTES,source_ownership:m.SOURCE_OWNERSHIP,
  inherited_enhertu_review_status:'unmerged_pending_validation',review_date:'2026-11-24',
  clinical_use_authorised:false,independent_clinical_pharmacy_review:'pending',patient_video_change:'none_requested_voice_clone_pending',
  helper_template_sha256:m.sha(m.normalisedHelper(helperSource)),files
 };
 const bytes=Buffer.from(JSON.stringify(record,null,2)+'\n'),digest=m.sha(bytes);
 if(process.argv.includes('--write')){
  assert(!previousBytes||m.sha(previousBytes)===oldPin,'The prior record must still match its pinned digest');
  assert(revise||!/^[a-f\d]{64}$/.test(oldPin)||oldPin===digest,'The frozen olaparib assembly changed. Review the change and use --revise-candidate with --reason-file to preserve a new candidate and its authenticated predecessor.');
  fs.mkdirSync(path.dirname(m.RECORD),{recursive:true});fs.writeFileSync(m.RECORD,bytes);
  fs.writeFileSync(helperFile,helperSource.replace(/const REVIEWED_SHA256='[^']*';/,"const REVIEWED_SHA256='"+digest+"';"));
 }else{
  assert(fs.existsSync(m.RECORD)&&fs.readFileSync(m.RECORD).equals(bytes),'Current assembly differs from the exact reviewed record');
  assert.equal(oldPin,digest,'Helper and frozen transition must agree');m.verify();
 }
 console.log(JSON.stringify({record:m.RECORD_PATH,sha256:digest,changed_files:Object.keys(files).length,new_routes:m.NEW_ROUTES,clinical_use_authorised:false},null,2));
}
}
if(require.main===module)main();
module.exports={revisionPlan};
