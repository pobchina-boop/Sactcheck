'use strict';
// Authenticate the explicit integration changes without rewriting reviewed drafts.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const manifestPath='validation/sarcoma-v08461/integrated-protocol-transitions.json';
const checkpointPath='validation/sarcoma-v08461/clinical/clinical-draft-checkpoint.json';
const codes=['00244','00325','00335','00719'];
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const sha=file=>hash(fs.readFileSync(file));
function verify(root){
 const read=relative=>JSON.parse(fs.readFileSync(path.join(root,relative)));
 const manifest=read(manifestPath);assert.equal(manifest.release,'0.84.61');assert.equal(manifest.source_checkpoint_path,checkpointPath);assert.equal(sha(path.join(root,checkpointPath)),manifest.source_checkpoint_sha256,'Original clinical checkpoint changed');
 const gradingPath='validation/sarcoma-v08461/clinical/source-grading-replacements.json';
 assert.equal(sha(path.join(root,gradingPath)),'4e6a2f3a77e382c7a630c67b67700e8d9f7c516608e178bb54d1850d3a826536','Source-reviewed grading handoff changed');
 const grading=read(gradingPath);
 const checkpoint=read(checkpointPath);assert.deepEqual(manifest.records.map(r=>r.code).sort(),codes,'Transition scope must be the four reviewed protocols');
 const records=new Map();
 for(const r of manifest.records){
  const entry=checkpoint.protocols.find(p=>p.code===r.code);assert(entry,'Missing original protocol');assert.equal(r.path,entry.repository_path);assert.equal(r.before_sha256,entry.draft_sha256);assert.equal(r.archived_path,`validation/sarcoma-v08461/independent-review/${r.code}-corrected-draft.json`);
  assert.equal(sha(path.join(root,r.archived_path)),r.before_sha256,'Archived corrected draft changed '+r.code);assert.equal(sha(path.join(root,r.path)),r.after_sha256,'Integrated protocol changed '+r.code);
  const reconstructed=read(r.archived_path),seen=new Set();assert(Array.isArray(r.edits));
  for(const edit of r.edits){
   assert(Array.isArray(edit.path)&&edit.path.length>=2,'Explicit JSON path required');assert(edit.path.every(k=>typeof k==='string'&&!['__proto__','prototype','constructor'].includes(k)),'Unsafe JSON path');
   assert(['metadata','input_definitions','indications'].includes(edit.path[0]),'Only declared integration metadata, grading or exact national indication codes may change');
   if(edit.path[0]==='indications'){
    assert.equal(r.code,'00325');assert.equal(edit.path.length,3);assert.equal(edit.path[2],'code');assert(['0','1'].includes(edit.path[1]));
    const first=edit.path[1]==='0';assert.equal(edit.before_exists,!first);assert.equal(edit.before,first?undefined:'00325g');assert.equal(edit.after,first?'00325a':'00325b');
    const source={path:'validation/sarcoma-v08461/clinical/sources/00325-current-merged.txt',sha256:'ca07e019a2d58d044cb2f4fe6e3540ae2e156fbd883cfecb2f76c94bf1780345',url:'https://healthservice.hse.ie/documents/6721/325_v6_SUNitinib_50mg_42_days.pdf',page:1,web_page:0,web_lines:[24,25]};
    assert.deepEqual(edit.source,source,'National indication correction source differs');assert.equal(sha(path.join(root,source.path)),source.sha256);
    const text=fs.readFileSync(path.join(root,source.path),'utf8');assert.match(text,/L24@P0: 00325a CDS/);assert.match(text,/L25@P0: Treatment of advanced\/metastatic renal cell carcinoma \(mRCC\) in adults\. C64 00325b CDS/);
   }
   if(edit.path[0]==='input_definitions'){
    assert.equal(edit.path.length,2,'Grading replacement must use exact reviewed field');
    const reviewed=grading.protocols.find(p=>p.code===r.code);assert(reviewed&&reviewed.repository_path===r.path,'No source-reviewed grading handoff');
    assert(Object.hasOwn(reviewed.input_definitions_replacements,edit.path[1]),'Unreviewed clinical input change');
    assert.deepEqual(edit.after,reviewed.input_definitions_replacements[edit.path[1]],'Grading differs from exact source-reviewed handoff');
   }
   const key=JSON.stringify(edit.path);assert(!seen.has(key),'Duplicate transition path');seen.add(key);assert(typeof edit.reason==='string'&&edit.reason.trim(),'Transition rationale required');assert.equal(typeof edit.before_exists,'boolean');assert(Object.hasOwn(edit,'after'),'Removal is not an accepted integration transition');
   let parent=reconstructed;for(const key of edit.path.slice(0,-1)){assert(parent&&typeof parent==='object'&&Object.hasOwn(parent,key),'Missing transition parent');parent=parent[key];}
   const leaf=edit.path.at(-1);assert.equal(Object.hasOwn(parent,leaf),edit.before_exists,'Before existence differs '+r.code+'/'+edit.path.join('/'));
   if(edit.before_exists)assert.deepEqual(parent[leaf],edit.before,'Before value differs '+r.code+'/'+edit.path.join('/'));
   parent[leaf]=structuredClone(edit.after);
  }
  assert.deepEqual(read(r.path),reconstructed,'Protocol fields changed beyond declared integration transitions '+r.code);
  records.set(r.code,r);
 }
 return {manifest,records,manifest_sha256:sha(path.join(root,manifestPath))};
}
module.exports={verify,manifestPath,checkpointPath,sha};
