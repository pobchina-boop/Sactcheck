'use strict';
// A correction is a new candidate with an authenticated predecessor and a
// written reason. It must never rewrite an earlier release or erase a review.
const assert=require('node:assert/strict');
const migration=require('./helpers/retrospective-v08463.cjs');
const {revisionPlan}=require('../tools/record-olaparib-migration-v08463.cjs');
const previous={schema_version:1,release:'0.84.63',base_release:'0.84.62',base_commit:migration.BASE_COMMIT,base_tree:migration.BASE_TREE,record_status:'review_candidate',review_revisions:[],files:{'patient/00588/index.html':{before:'a'.repeat(64),after:'b'.repeat(64)}}};
const bytes=Buffer.from(JSON.stringify(previous,null,2)+'\n'),digest=migration.sha(bytes);
const reason='Corrected a context-preserving document link found by the historical route gate.';
const plan=revisionPlan(bytes,digest,reason);
assert(plan.archiveBytes.equals(bytes),'The previous candidate must be archived byte-for-byte');
assert.equal(migration.sha(plan.archiveBytes),digest);
assert.equal(plan.archivePath,'validation/olaparib-v08463/candidate-history/'+digest+'.json');
const note=JSON.parse(plan.reasonBytes);
assert.equal(note.reason,reason);assert.equal(note.previous_candidate_sha256,digest);assert.equal(note.revision_number,1);
assert.equal(plan.history.length,1);assert.equal(previous.review_revisions.length,0,'Planning must not rewrite the prior object');
const next={...previous,review_revisions:plan.history};
const nextBytes=Buffer.from(JSON.stringify(next,null,2)+'\n');
const second=revisionPlan(nextBytes,migration.sha(nextBytes),'Corrected an independently identified consent compatibility issue.');
assert.equal(second.history.length,2);assert.deepEqual(second.history[0],plan.history[0]);
assert.equal(JSON.parse(second.reasonBytes).revision_number,2);
assert.throws(()=>revisionPlan(bytes,'0'.repeat(64),reason),/Authenticate the prior candidate/);
assert.throws(()=>revisionPlan(bytes,digest,'fix'),/concrete revision reason/);
assert.throws(()=>revisionPlan(bytes,digest,'x'.repeat(5001)),/concrete revision reason/);
assert.throws(()=>revisionPlan(bytes,digest,'A reason containing an unexpected\0 control character'),/concrete revision reason/);
for(const change of [{release:'0.84.62'},{base_commit:'f'.repeat(40)},{base_tree:'f'.repeat(40)},{record_status:'published'},{review_revisions:undefined}]){
 const invalid=Buffer.from(JSON.stringify({...previous,...change},null,2)+'\n');
 assert.throws(()=>revisionPlan(invalid,migration.sha(invalid),reason),'Published/other release/unanchored candidates cannot enter the revision chain');
}
console.log('Olaparib candidate revision guards passed: exact archived bytes, retained history, concrete reasons and rejection of published/unrelated/unpinned candidates.');
