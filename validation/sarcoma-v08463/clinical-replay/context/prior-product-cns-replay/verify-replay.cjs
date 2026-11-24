'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict'),cp=require('child_process');
const home=__dirname,idx=process.argv.indexOf('--output-dir');assert.ok(idx>=0&&process.argv[idx+1],'Use --output-dir <new evidence directory>');
const out=path.resolve(process.argv[idx+1]);assert.ok(!fs.existsSync(out),'Existing evidence must not be overwritten');fs.mkdirSync(out,{recursive:true});
const read=f=>JSON.parse(fs.readFileSync(f)),sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const manifest=read(path.join(home,'input-manifest.json'));
for(const f of manifest.files){const a=path.join(home,f.path),b=path.join(out,f.path);assert.equal(sha(a),f.sha256,'Frozen input changed: '+f.path);fs.mkdirSync(path.dirname(b),{recursive:true});fs.copyFileSync(a,b);}
const env={...process.env,SACTCHECK_ROOT:path.join(out,'runtime'),SACTCHECK_IFOS_DRAFT_ROOT:path.join(out,'seven-candidates')};
function run(part,script,args,resultName,expectedExit){const r=cp.spawnSync(process.execPath,[script,...args],{cwd:path.join(out,part),env,encoding:'utf8',timeout:20000,maxBuffer:8*1024*1024});assert.equal(r.error,undefined);assert.equal(r.status,expectedExit,r.stderr);fs.writeFileSync(path.join(out,part,'stdout.log'),r.stdout);fs.writeFileSync(path.join(out,part,'stderr.log'),r.stderr);const actual=read(path.join(out,part,resultName)),frozen=read(path.join(home,part,resultName));assert.deepEqual(actual.results,frozen.results,'Replay differs from retained raw result');return actual;}
const product=run('product','independent-product-cases.cjs',['--current'],'current-results.json',0),semantic=run('semantic','semantic-cases.cjs',[],'semantic-candidate-results.json',1);
assert.equal(product.total,347);assert.equal(product.passed,347);assert.equal(semantic.total,123);assert.equal(semantic.passed,121);assert.equal(semantic.failed,2);
const failures=semantic.results.filter(r=>r.status==='failed');assert.deepEqual(failures.map(r=>[r.code,r.name]),[['00596','Bounded transition preserves other clinical rules'],['00680','Bounded transition preserves other clinical rules']]);
const acceptedProduct=read(path.join(out,'accepted-reference/current-results.json')),acceptedSemantic=read(path.join(out,'accepted-reference/semantic-candidate-results.json'));
assert.deepEqual(product.results,acceptedProduct.results,'Previously accepted product observations changed');
for(let i=0;i<semantic.results.length;i++){const a=semantic.results[i],b=acceptedSemantic.results[i];assert.deepEqual(a.input,b.input);assert.equal(a.expected,b.expected);if(a.status==='passed')assert.deepEqual(a,b,'Previously accepted clinical/UI or unaffected structural observation changed');}
const allowed={'00596':['IE_ADMINISTRATION_DAY_REVIEW'],'00680':['KNOWN_INDICATION_CONTEXT_REVIEW','OTHER_NONHAEM_EVENT_REVIEW']},appendVerification=[];
for(const [code,ids] of Object.entries(allowed)){
 const file=fs.readdirSync(path.join(out,'accepted-future-candidates')).find(f=>f.startsWith(code)),a=read(path.join(out,'accepted-future-candidates',file)),b=read(path.join(out,'seven-candidates',file));
 const oldRules=a.rule_engine.rules,newRules=b.rule_engine.rules;assert.deepEqual(newRules.slice(0,oldRules.length),oldRules);assert.deepEqual(newRules.slice(oldRules.length).map(r=>r.rule_id),ids);
 for(const r of newRules.slice(oldRules.length)){assert.equal(r.action.type,'consultant_review');assert.equal(r.action.block_numeric_dose,true);assert.equal(r.action.dose_calculation,'specialist_review');}
 const ac=structuredClone(a),bc=structuredClone(b);delete ac.rule_engine.rules;delete bc.rule_engine.rules;assert.deepEqual(ac,bc);
 appendVerification.push({code,accepted_sha256:sha(path.join(out,'accepted-future-candidates',file)),corrected_sha256:sha(path.join(out,'seven-candidates',file)),all_existing_json_preserved:true,appended_review_rule_ids:ids});
}
const report={verified_utc:new Date().toISOString(),product:{total:347,passed:347,failed:0,all_case_inputs_assertions_and_observations_unchanged:true},semantic_raw:{total:123,passed:121,failed:2,clinical_and_ui_checks_passed:118,unaffected_structural_checks_passed:3,historical_cns_only_structural_mismatches:2},semantic_all_121_passing_observations_unchanged:true,authorized_append_only_delta_verification:appendVerification,classification:'The two old CNS-only structural assertions intentionally prohibit the separately authorized later context/calendar additions. Original raw failures remain preserved; no assertion was edited or relabelled as passed.',new_scenario_count:0,application_changes:false,clinical_approval:false,pharmacy_approval:false};
fs.writeFileSync(path.join(out,'compatibility-verification.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
