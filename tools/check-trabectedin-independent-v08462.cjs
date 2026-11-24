'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'validation/sarcoma-v08462/trabectedin-phase-correction/independent-review'),sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
assert.equal(sha(path.join(dir,'SHA256SUMS')),'f7b42b4bcc3273223f7ce1a1f8207e31aa9d1b0447a3497f876a13632aeb9ef5');
for(const line of fs.readFileSync(path.join(dir,'SHA256SUMS'),'utf8').trim().split('\n')){const match=/^([a-f0-9]{64})  (.+)$/.exec(line);assert(match);assert(!match[2].startsWith('/')&&!match[2].split('/').includes('..'));assert.equal(sha(path.join(dir,match[2])),match[1],match[2]);}
const original=JSON.parse(fs.readFileSync(path.join(dir,'phase-cue-original-results.json'))),expected=JSON.parse(fs.readFileSync(path.join(dir,'phase-cue-corrected-results.json')));
assert.equal(original.total,18);assert.equal(original.passed,12);assert.equal(original.failed,6);assert.equal(expected.total,18);assert.equal(expected.passed,18);assert.equal(expected.failed,0);
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'sactcheck-trabectedin-independent-'));
try{
 const out=path.join(temp,'results.json'),run=cp.spawnSync(process.execPath,[path.join(dir,'phase-cue-supplement.cjs'),'--current',root,'--output',out],{cwd:root,encoding:'utf8',timeout:30000});assert.equal(run.status,0,run.stdout+run.stderr);
 const current=JSON.parse(fs.readFileSync(out)),strip=j=>{const copy=structuredClone(j);delete copy.started_utc;delete copy.finished_utc;return copy;};
 assert.deepEqual(strip(current),require('./lib/sarcoma-inherited-runtime.cjs').currentReport(strip(expected)),'All independent assertions and observations must equal the accepted current candidate');
 assert.equal(new Set(current.results.map(r=>JSON.stringify(r.inputs))).size,15,'18 assertions cover15 distinct input scenarios');
}finally{fs.rmSync(temp,{recursive:true,force:true});}
console.log('Independent trabectedin phase supplement passed:18 assertions over15 distinct inputs; original12/18 failing snapshot retained.');
