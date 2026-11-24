'use strict';
// Replay unchanged calibrated cases against an explicit external candidate directory.
// This never alters original snapshots, cases, manifests or results.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict'),cp=require('child_process');
const home=__dirname,arg=n=>{const i=process.argv.indexOf(n);return i<0?undefined:process.argv[i+1];};
assert.ok(arg('--candidate-dir')&&arg('--output-dir'),'Use --candidate-dir <external protocols folder> --output-dir <new evidence folder>');
const candidates=path.resolve(arg('--candidate-dir')),out=path.resolve(arg('--output-dir'));
assert.ok(fs.statSync(candidates).isDirectory());assert.ok(!fs.existsSync(out),'Preserve existing evidence: output directory must be new');
fs.mkdirSync(out,{recursive:true});
const read=p=>JSON.parse(fs.readFileSync(p)),sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const copy=(a,b)=>{fs.mkdirSync(path.dirname(b),{recursive:true});fs.copyFileSync(a,b);};
const write=(f,x)=>fs.writeFileSync(f,JSON.stringify(x,null,2)+'\n');
const base=read(path.join(home,'input-manifest.json')),transition=[];
const core=path.join(out,'core');fs.mkdirSync(core);
fs.cpSync(path.join(home,'snapshot'),path.join(core,'snapshot'),{recursive:true});
for(const f of ['core-cases.json','run-core-audits.cjs'])copy(path.join(home,f),path.join(core,f));
for(const p of base.protocols){
  const candidate=path.join(candidates,path.basename(p.snapshot_path));
  const before=p.sha256;
  if(fs.existsSync(candidate)){copy(candidate,path.join(core,p.snapshot_path));p.original_candidate_path=p.candidate_path;p.candidate_path=candidate;p.sha256=sha(candidate);}
  transition.push({code:p.code,original_sha256:before,replay_sha256:p.sha256,changed:before!==p.sha256,source:fs.existsSync(candidate)?candidate:'original frozen snapshot'});
}
assert.ok(transition.some(x=>x.changed),'No candidate change supplied; use verify-frozen-replay.cjs for unchanged originals');
base.replay_transition=transition;base.audited_stage='explicit-external-candidate-replay';base.application_replay_pending=true;
write(path.join(core,'input-manifest.json'),base);
const delegatedHome=path.join(home,'delegated-00100-00680'),delegated=path.join(out,'delegated');
for(const f of ['run.cjs','cases.json','prior-inputs.json'])copy(path.join(delegatedHome,f),path.join(delegated,f));
const dm=read(path.join(delegatedHome,'input-manifest.json'));
for(const p of dm.files.filter(x=>x.kind!=='prior_suite_dedup_reference_not_execution_dependency')){
  const candidate=p.kind==='accepted_candidate'?path.join(candidates,path.basename(p.path)):null;
  const from=candidate&&fs.existsSync(candidate)?candidate:path.join(delegatedHome,p.path);
  copy(from,path.join(delegated,p.path));p.sha256=sha(from);if(candidate&&fs.existsSync(candidate))p.replay_source_path=candidate;
}
dm.replay_transition=transition.filter(x=>['00100','00680'].includes(x.code));dm.scope='Explicit external candidate replay with frozen unchanged original inputs and runtime; not original-candidate acceptance';
write(path.join(delegated,'input-manifest.json'),dm);
function run(dir,script,args){
  const r=cp.spawnSync(process.execPath,[path.join(dir,script),...args],{cwd:dir,encoding:'utf8',timeout:15000,maxBuffer:8*1024*1024});
  assert.equal(r.error,undefined);assert.ok(r.status===0||r.status===1,'Runner execution failed: '+r.stderr);
  const report=read(path.join(dir,'results.json'));assert.equal(r.status,report.failed?1:0);return report;
}
const cr=run(core,'run-core-audits.cjs',['--output','results.json']),dr=run(delegated,'run.cjs',['--out','results.json']);
const originalCore=read(path.join(home,'core-calibrated-original-results.json')),originalDelegated=read(path.join(delegatedHome,'results.initial.json'));
for(let i=0;i<cr.results.length;i++){assert.deepEqual(cr.results[i].inputs,originalCore.results[i].inputs);assert.deepEqual(cr.results[i].expected,originalCore.results[i].expected);}
for(let i=0;i<dr.results.length;i++){assert.deepEqual(dr.results[i].input,originalDelegated.results[i].input);assert.deepEqual(dr.results[i].expected,originalDelegated.results[i].expected);}
const results=cr.results.concat(dr.results),summary={replayed_utc:new Date().toISOString(),scope:['00420','00463','00100','00596','00680'],suites:5,distinct_scenario_inputs:100,total:results.length,passed:cr.passed+dr.passed,failed:cr.failed+dr.failed,transition,inputs_and_calibrated_expectations_unchanged:true,original_raw:{passed:87,failed:13},original_after_lexical_fixture_correction:{passed:89,failed:11},failures:results.filter(r=>r.status==='failed').map(r=>({id:r.case_id||r.id,code:r.code,error:r.error||r.errors})),runtime_frozen:true,application_replay_pending:true,clinical_approval:false,pharmacy_approval:false};
assert.equal(summary.total,100);write(path.join(out,'candidate-replay-summary.json'),summary);
console.log(JSON.stringify(summary,null,2));process.exitCode=summary.failed?1:0;
