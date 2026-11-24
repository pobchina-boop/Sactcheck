'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict'),cp=require('child_process');
const home=__dirname,i=process.argv.indexOf('--output-dir');
assert.ok(i>=0&&process.argv[i+1],'Use --output-dir <new evidence directory>');
const out=path.resolve(process.argv[i+1]),frozen=path.join(home,'corrected-candidate-replay'),candidateDir=path.join(frozen,'core/snapshot/protocols');
const read=p=>JSON.parse(fs.readFileSync(p)),hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const accepted=read(path.join(frozen,'candidate-replay-summary.json')),manifest=read(path.join(home,'input-manifest.json'));
for(const t of accepted.transition){const p=manifest.protocols.find(p=>p.code===t.code);assert.equal(hash(path.join(candidateDir,path.basename(p.snapshot_path))),t.replay_sha256);}
const r=cp.spawnSync(process.execPath,[path.join(home,'replay-candidate.cjs'),'--candidate-dir',candidateDir,'--output-dir',out],{cwd:out.endsWith('/')?path.dirname(out.slice(0,-1)):path.dirname(out),encoding:'utf8',timeout:20000,maxBuffer:8*1024*1024});
assert.equal(r.error,undefined);assert.equal(r.status,0,r.stdout+'\n'+r.stderr);
for(const part of ['core','delegated'])assert.deepEqual(read(path.join(out,part,'results.json')).results,read(path.join(frozen,part,'results.json')).results,'Corrected replay observations changed');
const actual=read(path.join(out,'candidate-replay-summary.json'));assert.equal(actual.passed,100);assert.equal(actual.failed,0);
const report={verified_utc:new Date().toISOString(),suites:5,distinct_scenario_inputs:100,passed:100,failed:0,exact_case_results_reproduced:true,original_raw:{passed:87,failed:13},original_after_two_lexical_fixture_corrections:{passed:89,failed:11},policy_limit:'00680 generic other-grade3/4 review is a local conservative policy pending clinician approval, not an NCCP dose algorithm.',application_replay_pending:true,clinical_approval:false,pharmacy_approval:false};
fs.writeFileSync(path.join(out,'corrected-verification.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
