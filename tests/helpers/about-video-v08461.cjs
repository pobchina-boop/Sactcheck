'use strict';
// Exact, source-authenticated About-page/media publication. Historical records remain immutable.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),recordPath='validation/about-video-v08461/transition.json',helperPath='tests/helpers/about-video-v08461.cjs';
const baseCommit='a827d2bed3761997a3cc0b26f5bc68a810a8cfd0',sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const raw=fs.readFileSync(path.join(root,recordPath));
assert.equal(sha(raw),'e8c10b0641bb1262739c6c9ffb92145d4a3ba75052abd2f97d7de7de9d9877c4','Reviewed About publication record');
const record=JSON.parse(raw);assert.equal(record.base_commit,baseCommit);
const allowed=["about.html", "css/about-sactcheck.css", "tests/helpers/ribociclib-review-v08461.cjs", "assets/video/sactcheck-overview-en.vtt", "assets/video/sactcheck-overview-poster.jpg", "assets/video/sactcheck-overview.mp4"];
assert.deepEqual(Object.keys(record.files).sort(),allowed.slice().sort(),'Exact About page, stylesheet, media and provenance scope');
const cache=new Map();
function baseline(f){if(!cache.has(f))cache.set(f,cp.execFileSync('git',['show',baseCommit+':'+f],{cwd:root,env:{...process.env,GIT_NO_LAZY_FETCH:'1',GIT_TERMINAL_PROMPT:'0'},maxBuffer:8*1024*1024}));return cache.get(f);}
function reconstruct(f,c){
 const before=baseline(f);assert.equal(sha(before),c.before,f+' authenticated Git origin');assert.equal(before.length,c.before_bytes);
 const lines=before.toString('utf8').match(/[^\n]*\n|[^\n]+$/g)||[],out=[];let cursor=0;
 for(const edit of c.edits){
  assert(Number.isInteger(edit.start_line)&&edit.start_line>=cursor&&edit.start_line<=lines.length,f+' ordered edit');
  assert(Array.isArray(edit.old_lines)&&Array.isArray(edit.new_lines));
  assert.deepEqual(lines.slice(edit.start_line,edit.start_line+edit.old_lines.length),edit.old_lines,f+' exact reviewed removed text');
  out.push(...lines.slice(cursor,edit.start_line),...edit.new_lines);cursor=edit.start_line+edit.old_lines.length;
 }
 out.push(...lines.slice(cursor));const after=Buffer.from(out.join(''));assert.equal(sha(after),c.after,f+' reviewed text reconstruction');assert.equal(after.length,c.after_bytes);return after;
}
function expected(f,h,n){const c=record.files[f];if(!c)return{sha256:h,bytes:n};assert.equal(h,c.before,f+' About publication origin');if(n!==undefined)assert.equal(n,c.before_bytes,f+' About publication origin size');return{sha256:c.after,bytes:c.after_bytes};}
function verify(){
 for(const[f,c]of Object.entries(record.files)){
  const bytes=fs.readFileSync(path.join(root,f));
  if(c.before!==null)assert.deepEqual(bytes,reconstruct(f,c),f+' exact reviewed text');
  else {assert.equal(cp.spawnSync('git',['cat-file','-e',baseCommit+':'+f],{cwd:root,env:{...process.env,GIT_NO_LAZY_FETCH:'1',GIT_TERMINAL_PROMPT:'0'}}).status,128,f+' authenticated new media path');assert.equal(sha(bytes),c.after,f+' approved media bytes');assert.equal(bytes.length,c.after_bytes);assert(bytes.length<=20*1024*1024,f+' file size limit');}
 }
 for(const[f,h]of Object.entries(record.unchanged_clinical_files)){assert.equal(sha(baseline(f)),h,f+' clinical Git origin');assert.equal(sha(fs.readFileSync(path.join(root,f))),h,f+' clinical bytes unchanged');}
 return true;
}
function isAddition(f){return f===recordPath||f===helperPath||record.files[f]?.before===null;}
module.exports={expected,verify,isAddition,reconstruct,files:record.files};
