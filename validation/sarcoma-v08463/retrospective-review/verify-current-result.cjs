'use strict';
// Accept only the exact source-adjudicated classification. Original hold assertions stay failed.
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const home=__dirname,read=f=>JSON.parse(fs.readFileSync(f));
assert.ok(process.argv[2]&&process.argv[3],'Supply primary and phase-supplement current reports');
const primary=read(process.argv[2]),supplement=read(process.argv[3]),expected=read(path.join(home,'integrated-current-results.json')),expectedSupplement=read(path.join(home,'phase-cue-integrated-results.json')),adjudication=read(path.join(home,'adjudication.json'));
assert.deepEqual(primary.scope,['00374','00228','00205','00462','00554']);
assert.equal(primary.total,100);assert.equal(primary.passed,97);assert.equal(primary.failed,3);
assert.equal(supplement.total,18);assert.equal(supplement.passed,18);assert.equal(supplement.failed,0);
assert.deepEqual(primary.results,expected.results,'Primary clinical inputs, observations or original assertions changed');
assert.deepEqual(supplement.results,expectedSupplement.results,'Phase-cue input, observation or assertion changed');
assert.deepEqual(primary.protocols,expected.protocols,'Audited clinical protocol bytes changed');assert.deepEqual(primary.runtime,expected.runtime,'Audited actual runtime changed');
assert.equal(supplement.protocol_sha256,expectedSupplement.protocol_sha256);assert.equal(supplement.engine_sha256,expectedSupplement.engine_sha256);assert.equal(supplement.dose_model_sha256,expectedSupplement.dose_model_sha256);
const failed=primary.results.filter(r=>r.status==='failed');assert.deepEqual(failed.map(r=>r.case_id),['00374-01','00374-05','00374-09']);
assert.equal(adjudication.decisions[0].classification,'conservative_action_severity_expectation_not_required_by_source');assert.equal(adjudication.decisions[0].original_expectations_preserved,true);assert.deepEqual(adjudication.decisions[0].case_ids,failed.map(r=>r.case_id));
for(const c of failed){
 assert.equal(c.expected.kind,'hold');assert.equal(c.error,'Known active risk retains an overall hold/stop');assert.equal(c.observed.action,'consultant_review');assert.equal(c.observed.complete,false);assert.equal(c.observed.coverageComplete,false);
 const cue=c.observed.findings.find(f=>f.rule_id==='DEX_PREMED_REVIEW');assert.ok(cue);assert.equal(cue.action,'consultant_review');assert.match(cue.message,/corticosteroid premedication/i);assert.match(cue.message,/Confirm the prescription before infusion/i);
 assert.equal(c.observed.dose_model.hasQuantified,false);assert.ok(c.observed.dose_model.rows.some(r=>r.componentId==='trabectedin'&&r.actionType==='consultant_review'&&!r.quantified));
}
const canonical=x=>Array.isArray(x)?'['+x.map(canonical).join(',')+']':x&&typeof x==='object'?'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}':JSON.stringify(x);
const primaryInputs=new Set(primary.results.map(r=>r.code+':'+canonical(r.inputs))),supplementInputs=new Set(supplement.results.map(r=>'00374:'+canonical(r.inputs))),combined=new Set([...primaryInputs,...supplementInputs]);
assert.equal(primaryInputs.size,100);assert.equal(supplementInputs.size,15);assert.equal(combined.size,115);
for(const code of primary.scope)assert.equal(primary.results.filter(r=>r.code===code).length,20);
console.log(JSON.stringify({status:'accepted_exact_classification',suites:5,primary_assertions:100,primary_actual_passes:97,preserved_adjudicated_severity_mismatches:3,supplementary_assertions:18,supplementary_actual_passes:18,supplementary_unique_inputs:15,total_unique_inputs:115,total_assertions:118,clinical_approval:false,pharmacy_approval:false}));
