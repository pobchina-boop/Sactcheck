'use strict';
// Unchanged independent cases replayed against current app JSON through temporary paths.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),source=path.join(root,'validation/sarcoma-v08462/independent-review');
const expected=JSON.parse(fs.readFileSync(path.join(source,'current-results.json'))),pin=JSON.parse(fs.readFileSync(path.join(source,'input-manifest.json')));
const checkpoint=JSON.parse(fs.readFileSync(path.join(root,'validation/sarcoma-v08462/clinical/clinical-draft-checkpoint.json')));
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const transition=require('./lib/sarcoma-v08462-transitions.cjs').verify(root);
// Only fingerprints of explicitly reconstructed integration transitions change in memory.
const integratedExpected=structuredClone(expected);
for(const p of integratedExpected.protocols){const r=transition.records.get(p.code);assert.equal(p.sha256,r.before_sha256);p.sha256=r.after_sha256;}
assert.equal(expected.mode,'current');assert.equal(expected.independent_from_author_cases,true);assert.equal(expected.total,154);assert.equal(expected.passed,154);assert.equal(expected.failed,0);
assert.equal(sha(path.join(source,'independent-cases.cjs')),expected.script_sha256,'Archived independent script changed');
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'sactcheck-independent-v08462-')),overlay=path.join(temporary,'draft-overlay');
const deterministic=r=>{const copy=structuredClone(r);delete copy.started_utc;delete copy.finished_utc;return copy;};
try{
 for(const f of ['independent-cases.cjs','input-manifest.json'])fs.copyFileSync(path.join(source,f),path.join(temporary,f));
 for(const p of pin.protocols){
  const entry=checkpoint.protocols.find(x=>x.code===p.code);assert.ok(entry,'Unmapped protocol '+p.code);
  assert.equal(entry.draft_path,p.path,'Draft path mismatch');
  const current=path.join(root,entry.repository_relative_path),target=path.join(overlay,p.path);
  assert.equal(sha(current),transition.records.get(p.code).after_sha256,'Current app differs from verified integration '+p.code);
  fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(current,target);
 }
 const run=cp.spawnSync(process.execPath,[path.join(temporary,'independent-cases.cjs'),'--current'],{cwd:root,env:{...process.env,SACTCHECK_ROOT:root,SACTCHECK_DRAFT_ROOT:overlay},encoding:'utf8',timeout:30000,maxBuffer:4*1024*1024});
 if(run.stdout)process.stdout.write(run.stdout);if(run.stderr)process.stderr.write(run.stderr);if(run.error)throw run.error;assert.equal(run.status,0,'Independent current-protocol replay failed');
 const actual=JSON.parse(fs.readFileSync(path.join(temporary,'current-results.json')));
 require('./lib/sarcoma-v08462-trabectedin-output-delta.cjs').compare(root,'independent',deterministic(actual),deterministic(integratedExpected));
 for(const p of checkpoint.protocols)assert.equal(sha(path.join(root,p.repository_relative_path)),transition.records.get(p.code).after_sha256,'App protocol changed during replay');
 console.log('Independent v62 replay passed:154/154; unchanged case assertions; exactly36 trabectedin raw outputs contain only enumerated source-authorised review findings. Every other non-time result and tool hash matches retained evidence; protocol fingerprints match verified explicit integration transitions. No clinical approval is inferred.');
}finally{fs.rmSync(temporary,{recursive:true,force:true});}
