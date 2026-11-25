'use strict';
// Replay the independent review unchanged without overwriting its retained evidence.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),source=path.join(root,'validation/sarcoma-v08460/independent-review');
const expected=JSON.parse(fs.readFileSync(path.join(source,'current-independent-results.json')));
assert.equal(expected.mode,'current');assert.equal(expected.independent_from_author_cases,true);assert.equal(expected.total,112);assert.equal(expected.passed,112);assert.equal(expected.failed,0);
// Replay all 112 original cases with the two reviewed shared-tool transitions.
const {currentReplayHash}=require('../tests/helpers/retrospective-v08462.cjs');
const currentExpected=structuredClone(expected);
currentExpected.engine_sha256 = require('./lib/sarcoma-engine-replay.cjs').publishedEngineHash(root,currentExpected.engine_sha256);
currentExpected.dose_model_sha256=currentReplayHash('js/protocol-dose-schedule.js',expected.dose_model_sha256);
currentExpected.lab_adapter_sha256=currentReplayHash('js/local-lab-profile.js',expected.lab_adapter_sha256);
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'sactcheck-independent-v08460-'));
const deterministic=r=>{const copy=structuredClone(r);delete copy.started_utc;delete copy.finished_utc;return copy;};
try{
 for(const f of ['independent-cases.cjs','frozen-inputs.json'])fs.copyFileSync(path.join(source,f),path.join(temporary,f));
 const clinicalRoot=path.join(temporary,'historical');
 fs.mkdirSync(path.join(clinicalRoot,'protocols/sarcoma'),{recursive:true});
 fs.symlinkSync(path.join(root,'js'),path.join(clinicalRoot,'js'),'dir');
 for (const entry of expected.protocols) {
   const bytes=['00391','00392'].includes(entry.code) ? cp.execFileSync('git',['show','68063d01357a61bf5ec9dffcb7e6ccdc0145d2a7:'+entry.path],{cwd:root}) : fs.readFileSync(path.join(root,entry.path));
   assert.equal(require('node:crypto').createHash('sha256').update(bytes).digest('hex'),entry.sha256);
   fs.writeFileSync(path.join(clinicalRoot,entry.path),bytes);
 }
 const run=cp.spawnSync(process.execPath,[path.join(temporary,'independent-cases.cjs'),'--current'],{cwd:root,env:{...process.env,SACTCHECK_ROOT:clinicalRoot,GIT_NO_LAZY_FETCH:'1',GIT_TERMINAL_PROMPT:'0'},encoding:'utf8',timeout:30000,maxBuffer:4*1024*1024});
 if(run.stdout)process.stdout.write(run.stdout);if(run.stderr)process.stderr.write(run.stderr);if(run.error)throw run.error;assert.equal(run.status,0,'Independent current-protocol replay failed');
 const actual=JSON.parse(fs.readFileSync(path.join(temporary,'current-independent-results.json')));
 assert.deepEqual(deterministic(actual),deterministic(currentExpected),'Independent expectations, findings, protocol/tool hashes or case count changed; review and retain explicit replacement evidence');
 const replay=cp.spawnSync(process.execPath,[path.join(temporary,'independent-cases.cjs'),'--current'],{cwd:root,env:{...process.env,SACTCHECK_ROOT:root},encoding:'utf8'});
 if(replay.error)throw replay.error;
 const live=JSON.parse(fs.readFileSync(path.join(temporary,'current-independent-results.json')));
 require('./lib/sarcoma-product-replay.cjs').verify(live,actual);
 console.log('Historical v60 replay passed:112/112; all retained case outcomes and protocol fingerprints match; dose-renderer and laboratory-adapter fingerprints follow their verified transitions. No clinical approval is inferred.');
}finally{fs.rmSync(temporary,{recursive:true,force:true});}
