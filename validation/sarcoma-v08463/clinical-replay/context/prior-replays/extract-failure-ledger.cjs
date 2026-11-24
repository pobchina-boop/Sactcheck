'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const home=__dirname,read=f=>JSON.parse(fs.readFileSync(f)),manifest=read(path.join(home,'authenticated-replay-manifest.json'));
const E=require(path.join(home,'corrected-after/Sactcheck/js/assessment-engine.js'));
const D=require(path.join(home,'corrected-after/Sactcheck/js/protocol-dose-schedule.js'));
const stages=['original-clinical','accepted-before','corrected-after'];
const protocols=Object.fromEntries(stages.map(stage=>[stage,Object.fromEntries(manifest.stages.find(s=>s.stage===stage).protocols.map(p=>[p.code,read(p.stage_path)]))]));
function observed(stage,code,input){
 const p=protocols[stage][code],a=E.assess(p,input),m=D.buildModificationModel(p,a);
 return {action:a.actionType,complete:a.complete,coverageComplete:a.coverageComplete,invalid:a.invalid,errors:a.errors,
  clinical_findings:a.findings.filter(f=>p.rule_engine.rules.some(r=>r.rule_id===f.ruleId)).map(f=>({id:f.ruleId,actionType:f.actionType,action:f.action,source:p.rule_engine.rules.find(r=>r.rule_id===f.ruleId).source})),
  component_rows:m.rows.map(r=>({id:r.componentId,action:r.actionType,quantified:r.quantified,protocolDose:r.protocolDose,allActions:r.allActions})),
  hasQuantified:m.hasQuantified,no_automatic_numeric_dose:m.rows.every(r=>!r.quantified||(r.actionType==='contraindicated'&&r.protocolDose==='Not to be administered'))};
}
const classification=read(path.join(home,'replay-delta-classification.json')),entries=[];
for(const code of ['00596','00680'])for(const grade of [1,2,3,4]){
 const name='Current neurotoxicity '+grade,input={encephalopathy_grade:grade};
 entries.push({code,name,kind:'historical_clinical_rule_id_expectation',input,original_expectation:'NEURO_NOW finding must be present and attributable only to ifosfamide',source_adjudication_status:'Pending source-owner explicit acceptance contract; original assertion remains failed.',stage_observations:Object.fromEntries(stages.map(s=>[s,observed(s,code,input)]))});
}
const independent=read(path.join(home,'corrected-after/independent/current-results.json'));
for(const row of independent.results.filter(r=>r.status==='failed')){
 assert(row.name.startsWith('Renal value versus reassuring band'));
 entries.push({code:row.code,name:row.name,kind:'historical_exact_component_action_expectation',input:row.input,original_expectation:'At CrCl<50, ifosfamide component must be consultant_review; IE etoposide at CrCl≤50 must be consultant_review; no contraindicated finding imported from another protocol.',source_adjudication_status:'Pending source-owner explicit product-contract adjudication; original assertion remains failed.',stage_observations:Object.fromEntries(stages.map(s=>[s,observed(s,row.code,row.input)]))});
}
for(const code of ['00100','00596','00680']){
 entries.push({code,name:'Every authored rule positively exercised',kind:'historical_exhaustive_coverage_expectation',original_expectation:'Every rule in the currently loaded protocol is positively exercised by unchanged historical author fixtures.',source_adjudication_status:'Structural coverage classification; separate positive coverage of added/changed rules required. This entry is not counted as a clinical pass.',stage_observations:Object.fromEntries(stages.map(s=>{const r=read(path.join(home,s,'drafts/mifamurtide-ifos-source-case-results.json'));return[s,{assertion:r.cases.find(c=>c.code===code&&c.name==='Every authored rule positively exercised'),coverage:r.rule_coverage[code]}];}))});
}
assert.equal(entries.length,17);
const clinical=entries.filter(e=>e.input);assert.equal(clinical.length,14);
for(const e of clinical)for(const s of stages){const o=e.stage_observations[s];assert.deepEqual(o.invalid,[]);assert.deepEqual(o.errors,[]);assert(o.no_automatic_numeric_dose);}
const ledger={date:'2026-11-18',scope:'Exact 8 original neuro +6 original renal clinical fixtures and3 exhaustive-coverage failures across original/before/after. Observation ledger; source-owner adjudication remains separate.',total_entries:17,pre_existing_failed_assertions:16,new_historical_coverage_failure:1,clinical_observation_cases:14,all_42_stage_observations_have_no_invalid_or_errors_and_no_numeric_automatic_doses:true,original_assertions_changed:false,application_modified:false,clinical_approval:false,pharmacy_approval:false,entries};
fs.writeFileSync(path.join(home,'failure-ledger.json'),JSON.stringify(ledger,null,2)+'\n');
console.log(JSON.stringify({entries:17,clinical_fixtures:14,stage_observations:42,no_numeric_automatic_doses:true,source_adjudication:'pending separate owner acceptance'}));
