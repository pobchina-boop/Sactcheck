'use strict';
// Reproduces preserved outcomes, including failures. Exit 0 is provenance verification,
// not clinical acceptance and not a claim that all one hundred scenarios passed.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),cp=require('child_process'),crypto=require('crypto');
const home=__dirname,flag=process.argv.indexOf('--output-dir');
assert.ok(flag>=0&&process.argv[flag+1],'Use --output-dir <new directory>');
const out=path.resolve(process.argv[flag+1]);
assert.ok(!fs.existsSync(out),'Refusing to overwrite replay evidence');
fs.mkdirSync(out,{recursive:true});
const read=p=>JSON.parse(fs.readFileSync(p));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
function copy(source,dest){fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(source,dest);}
function execute(dir,script,args,expectedFile){
  const result=cp.spawnSync(process.execPath,[path.join(dir,script),...args],{cwd:dir,encoding:'utf8',timeout:15000,maxBuffer:8*1024*1024});
  assert.equal(result.error,undefined);assert.equal(result.status,1,'Original retained findings should produce exit 1');
  const actual=read(path.join(dir,'results.json')),expected=read(path.join(home,expectedFile));
  assert.deepEqual(actual.results,expected.results,'Changed case inputs, observations or classifications');
  assert.equal(actual.passed,expected.passed);assert.equal(actual.failed,expected.failed);
  return {total:actual.total,passed:actual.passed,failed:actual.failed,identical_case_results:true,expected_report:expectedFile,expected_sha256:sha(path.join(home,expectedFile)),replay_report:path.relative(out,path.join(dir,'results.json')),replay_sha256:sha(path.join(dir,'results.json'))};
}
function core(name,raw){
  const dir=path.join(out,name);fs.mkdirSync(dir);
  copy(path.join(home,'input-manifest.json'),path.join(dir,'input-manifest.json'));
  fs.cpSync(path.join(home,'snapshot'),path.join(dir,'snapshot'),{recursive:true});
  const fixture=raw?path.join(home,'raw-first-run-fixtures'):home;
  for(const f of ['core-cases.json','run-core-audits.cjs'])copy(path.join(fixture,f),path.join(dir,f));
  return execute(dir,'run-core-audits.cjs',['--output','results.json'],raw?'core-original-results.json':'core-calibrated-original-results.json');
}
const original=core('core-original',true),calibrated=core('core-lexical-correction',false);
const delegatedHome=path.join(home,'delegated-00100-00680'),delegatedOut=path.join(out,'delegated');
for(const f of ['input-manifest.json','run.cjs','cases.json','prior-inputs.json'])copy(path.join(delegatedHome,f),path.join(delegatedOut,f));
for(const f of read(path.join(delegatedHome,'input-manifest.json')).files.filter(x=>x.kind!=='prior_suite_dedup_reference_not_execution_dependency'))copy(path.join(delegatedHome,f.path),path.join(delegatedOut,f.path));
const delegated=execute(delegatedOut,'run.cjs',['--out','results.json'],'delegated-00100-00680/results.initial.json');
const report={verified_utc:new Date().toISOString(),meaning:'Identical frozen original and explicitly calibrated observations, including all retained findings; not clinical acceptance.',suites:5,distinct_scenario_inputs:100,raw_original:{passed:original.passed+delegated.passed,failed:original.failed+delegated.failed},after_lexical_fixture_correction:{passed:calibrated.passed+delegated.passed,failed:calibrated.failed+delegated.failed},replays:{original,calibrated,delegated},application_replay_pending:true,clinical_approval:false,pharmacy_approval:false};
assert.deepEqual(report.raw_original,{passed:87,failed:13});assert.deepEqual(report.after_lexical_fixture_correction,{passed:89,failed:11});
fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
