'use strict';
// Exactly five preceding-v63 suites, 100 preserved calibrated inputs.
// Original 87/100 and calibrated-original 89/100 are retained, never rewritten.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),assert=require('node:assert/strict'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),home=path.join(root,'validation/sarcoma-v08464/retrospective-review');
const read=p=>JSON.parse(fs.readFileSync(p)),sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const arg=n=>{const i=process.argv.indexOf(n);return i<0?undefined:process.argv[i+1];};
const canonical=x=>Array.isArray(x)?'['+x.map(canonical).join(',')+']':x&&typeof x==='object'?'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}':JSON.stringify(x);
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const pins={
 'checkpoint-final-manifest.json':'cf547d061bdc5e4a75579114f3f3950a7a18151c410c225a24378479020d4596',
 'integration-lineage/final-installed-protocols.json':'feba65cd1d4fc69c294dca1ddb05d26c1332a66cc4a5017792ac17686b3a73d2',
 'integration-lineage/metadata-transitions.json':'9f9a9dbbae2ffb14321cad477bb83d9a090f1ba14d22cf282cf168339865df9e',
 'integration-lineage/grading-transitions.json':'63e2483b0881bedf674be6fc054bd71b997fa555fb057883f43e653176a8c2d1'
};
for(const [name,hash] of Object.entries(pins))assert.equal(sha(path.join(home,name)),hash,'Pinned retrospective/lineage artifact changed: '+name);
const freeze=read(path.join(home,'checkpoint-final-manifest.json'));
assert.equal(freeze.file_count,106);
for(const f of freeze.files){const file=path.resolve(home,f.path);assert.ok(file.startsWith(home+path.sep));assert.equal(sha(file),f.sha256,'Original evidence altered: '+f.path);assert.equal(fs.statSync(file).size,f.bytes);}
const meta=read(path.join(home,'integration-lineage/metadata-transitions.json')),grading=read(path.join(home,'integration-lineage/grading-transitions.json')),installed=read(path.join(home,'integration-lineage/final-installed-protocols.json')),input=read(path.join(home,'input-manifest.json'));
assert.equal(installed.metadata_transition_sha256,pins['integration-lineage/metadata-transitions.json']);assert.equal(installed.grading_transition_sha256,pins['integration-lineage/grading-transitions.json']);
function apply(obj,edits){for(const e of edits){let target=obj;for(const key of e.path.slice(0,-1)){assert.ok(Object.hasOwn(target,key),'Transition parent missing');target=target[key];}const key=e.path.at(-1);if(Object.hasOwn(e,'before_exists'))assert.equal(Object.hasOwn(target,key),e.before_exists);if(e.before_exists!==false)assert.deepEqual(target[key],e.before,'Transition before value changed');if(e.after_exists===false)delete target[key];else target[key]=structuredClone(e.after);}}
const currentPins=[],runtimePins=[];
for(const r of installed.protocols){
 const file=path.join(root,r.path);assert.equal(sha(file),r.sha256,'Installed preceding-five protocol changed: '+r.code);
 const m=meta.records.find(x=>x.code===r.code),g=grading.records.find(x=>x.code===r.code),candidate=path.join(home,'corrected-candidate-replay/core/snapshot/protocols',path.basename(r.path));
 assert.equal(sha(candidate),m.before_sha256,'Accepted corrected candidate');const projected=read(candidate);apply(projected,m.edits);if(g){assert.equal(m.after_sha256,g.before_sha256,'Metadata/grading chain');apply(projected,g.edits);assert.equal(g.after_sha256,r.sha256);}else assert.equal(m.after_sha256,r.sha256);
 assert.deepEqual(projected,read(file),'Only exact reviewed provenance/grading transitions permitted');currentPins.push({...r});
}
for(const r of input.runtime){const file=path.join(root,'js',path.basename(r.path));const rel='js/'+path.basename(r.path),installed=require('./lib/sarcoma-inherited-runtime.cjs').verifiedSuccessor(rel,r.sha256);assert.equal(sha(file),installed);runtimePins.push({path:rel,sha256:installed});}
const output=arg('--output-dir')?path.resolve(arg('--output-dir')):null;if(output){assert.ok(!fs.existsSync(output),'Refuse to overwrite retained output');fs.mkdirSync(output,{recursive:true});}
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'sactcheck-retrospective-v08464-'));
try{
 const staged=path.join(temp,'evidence');fs.cpSync(home,staged,{recursive:true});
 // Both immutable runners receive byte-identical copies of the actual installed runtime.
 for(const dir of ['snapshot/js','delegated-00100-00680/snapshot/js'])for(const r of runtimePins)fs.copyFileSync(path.join(root,r.path),path.join(staged,dir,path.basename(r.path)));
 require('./lib/sarcoma-inherited-runtime.cjs').stageRuntimePins(staged);
 const out=path.join(temp,'current-output');
 const command=[path.join(staged,'replay-candidate.cjs'),'--candidate-dir',path.join(root,'protocols/sarcoma'),'--output-dir',out];
 const result=cp.spawnSync(process.execPath,command,{cwd:root,encoding:'utf8',timeout:30000,maxBuffer:8*1024*1024});
 if(output){fs.writeFileSync(path.join(output,'stdout.log'),result.stdout||'');fs.writeFileSync(path.join(output,'stderr.log'),result.stderr||'');}
 assert.ifError(result.error);assert.equal(result.status,0,'Current 100-case replay failed: '+result.stdout+'\n'+result.stderr);
 const summary=read(path.join(out,'candidate-replay-summary.json'));assert.equal(summary.total,100);assert.equal(summary.passed,100);assert.equal(summary.failed,0);
 let labels=0;const cases=[];
 for(const part of ['core','delegated']){
  const actual=read(path.join(out,part,'results.json')),expected=read(path.join(home,'corrected-candidate-replay',part,'results.json')),adjusted=structuredClone(expected.results);
  for(const r of adjusted)for(const u of r.observed?.unassessed||[]){const e=grading.records.find(x=>x.code===r.code)?.edits.find(x=>x.path[0]==='input_definitions'&&x.path[1]===u.id);if(e&&e.before.label!==e.after.label){assert.equal(u.label,e.before.label);u.label=e.after.label;labels++;}}
  assert.deepEqual(actual.results,adjusted,'Full results changed outside exact reviewed unassessed-label updates: '+part);
  cases.push(...actual.results);if(output)fs.copyFileSync(path.join(out,part,'results.json'),path.join(output,part+'-results.json'));
 }
 const byProtocol=Object.fromEntries(['00420','00463','00100','00596','00680'].map(code=>[code,{total:cases.filter(c=>c.code===code).length,passed:cases.filter(c=>c.code===code&&c.status==='passed').length}]));
 assert.deepEqual(Object.values(byProtocol).map(x=>x.total),[20,24,20,16,20]);
 const unique=new Set(cases.map(c=>canonical(c.inputs||c.input)));assert.equal(unique.size,100,'Exactly 100 distinct full clinical inputs');
 for(const r of currentPins.concat(runtimePins))assert.equal(sha(path.join(root,r.path)),r.sha256,'Current input modified during replay');
 const report={check:'v08464_preceding_five_retrospective_current_replay',status:'passed',suites:5,distinct_full_inputs:100,total:100,passed:100,failed:0,by_protocol:byProtocol,original_raw:{passed:87,failed:13},original_after_two_lexical_fixture_corrections:{passed:89,failed:11},corrected_candidate:{passed:100,failed:0},application_current_replay:true,full_results_exact_except_reviewed_unassessed_labels:true,reviewed_unassessed_label_occurrences:labels,protocols:currentPins,runtime:runtimePins,source_package_manifest_sha256:pins['checkpoint-final-manifest.json'],lineage_pins:pins,grading_boundary:'13 reviewed definitions are separate from source clinical corrections. MAP prior_fn_grade values 1/2 are unsupported; this 100-input retrospective set does not newly test that separate validation correction.',policy_limit:'00680 generic other-grade3/4 review is accepted local conservative review policy pending clinical approval, not an NCCP dose/hold/permanent-stop algorithm.',clinical_approval:false,pharmacy_approval:false,scope_limit:'Clinical decision and dose-model replay of these 100 existing retrospective scenarios; no new browser, patient/PDF or whole-system acceptance claim.'};
 if(output){write(path.join(output,'current-acceptance.json'),report);write(path.join(output,'raw-candidate-replay-summary.json'),summary);}
 console.log(JSON.stringify(report,null,2));
}catch(e){if(output)write(path.join(output,'failure.json'),{status:'failed',error:e.stack,clinical_approval:false});throw e;}finally{fs.rmSync(temp,{recursive:true,force:true});}
