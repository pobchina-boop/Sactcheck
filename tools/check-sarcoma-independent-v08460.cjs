'use strict';
// Replay the independent review unchanged without overwriting its retained evidence.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),source=path.join(root,'validation/sarcoma-v08460/independent-review');
const expected=JSON.parse(fs.readFileSync(path.join(source,'current-independent-results.json')));
assert.equal(expected.mode,'current');assert.equal(expected.independent_from_author_cases,true);assert.equal(expected.total,112);assert.equal(expected.passed,112);assert.equal(expected.failed,0);
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'sactcheck-independent-v08460-'));
const deterministic=r=>{const copy=structuredClone(r);delete copy.started_utc;delete copy.finished_utc;return copy;};
try{
 for(const f of ['independent-cases.cjs','frozen-inputs.json'])fs.copyFileSync(path.join(source,f),path.join(temporary,f));
 const run=cp.spawnSync(process.execPath,[path.join(temporary,'independent-cases.cjs'),'--current'],{cwd:root,env:{...process.env,SACTCHECK_ROOT:root,GIT_NO_LAZY_FETCH:'1',GIT_TERMINAL_PROMPT:'0'},encoding:'utf8',timeout:30000,maxBuffer:4*1024*1024});
 if(run.stdout)process.stdout.write(run.stdout);if(run.stderr)process.stderr.write(run.stderr);if(run.error)throw run.error;assert.equal(run.status,0,'Independent current-protocol replay failed');
 const actual=JSON.parse(fs.readFileSync(path.join(temporary,'current-independent-results.json')));
 assert.deepEqual(deterministic(actual),deterministic(expected),'Independent expectations, findings, protocol/tool hashes or case count changed; review and retain explicit replacement evidence');
 console.log('Independent v60 replay passed:112/112; all non-timestamp results and protocol/tool hashes match retained review evidence. No clinical approval is inferred.');
}finally{fs.rmSync(temporary,{recursive:true,force:true});}
