'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const home=__dirname,read=f=>JSON.parse(fs.readFileSync(path.join(home,f))),sha=f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(home,f))).digest('hex');
const output=process.argv[2]||'independent-verification.json';assert.equal(path.basename(output),output);assert.ok(!fs.existsSync(path.join(home,output)),'Preserve existing independent evidence');
const inputs=read('input-manifest.json');for(const f of inputs.files)assert.equal(sha(f.path),f.sha256,'Pinned input changed '+f.path);
const ledger=read('prior-replays/failure-ledger.json'),contract=read('independent-contract-results.json'),author=read('adjudicated-prior-contract-results.final.json');
assert.equal(sha('prior-replays/failure-ledger.json'),'16880765624b9ac924bab1744d97641c326ca511c2f5676f8a0aaf5169ae6c29');
assert.equal(sha('adjudicated-prior-contract.cjs'),'7615b2fe3a4a1fc816ca121fe1f02758bb1c3517cd32656efbbc5122b97659f9');
assert.deepEqual(contract.results,author.results);assert.equal(contract.passed,20);assert.equal(contract.failed,0);
const E=require('./runtime/js/assessment-engine.js'),D=require('./runtime/js/protocol-dose-schedule.js');
const transition=read('transition-manifest.json'),protocols={};for(const p of transition.protocols){assert.equal(sha(p.candidate),p.candidate_sha256);protocols[p.code]=read(p.candidate);}
const hold=new Set(['withhold','delay','omit','withhold_then_reduce','contraindicated','discontinue','permanently_discontinue']);
const originals=ledger.entries.filter(e=>e.input);assert.equal(originals.length,14);
const current=[];
for(const e of originals){
 const p=protocols[e.code],a=E.assess(p,e.input),m=D.buildModificationModel(p,a);
 const observed={action:a.actionType,complete:a.complete,coverageComplete:a.coverageComplete,invalid:a.invalid,errors:a.errors,clinical_findings:a.findings.filter(f=>p.rule_engine.rules.some(r=>r.rule_id===f.ruleId)).map(f=>({id:f.ruleId,actionType:f.actionType,action:f.action,source:p.rule_engine.rules.find(r=>r.rule_id===f.ruleId).source})),component_rows:m.rows.map(r=>({id:r.componentId,action:r.actionType,quantified:r.quantified,protocolDose:r.protocolDose,allActions:r.allActions})),hasQuantified:m.hasQuantified,no_automatic_numeric_dose:m.rows.every(r=>!r.quantified||(r.actionType==='contraindicated'&&r.protocolDose==='Not to be administered'))};
 assert.deepEqual(observed,e.stage_observations['corrected-after'],'Current observation differs from exact frozen ledger: '+e.code+' '+e.name);
 const matching=contract.results.filter(r=>r.code===e.code&&JSON.stringify(r.input)===JSON.stringify(e.input));assert.equal(matching.length,1,'Original input must appear unchanged exactly once in contract');
 current.push({code:e.code,name:e.name,exact_input_and_full_observation_match:true,action:a.actionType,component_actions:m.rows.map(r=>({id:r.componentId,action:r.actionType}))});
}
const controls=[],checked=[];
for(const r of contract.results){
 const p=protocols[r.code];for(const key of Object.keys(r.input))assert.ok(p.input_definitions[key],'Undeclared contract input: '+key);const a=E.assess(p,r.input),m=D.buildModificationModel(p,a),findings=a.findings.filter(f=>!f.domainAssessment&&!/^PARTIAL_/.test(f.ruleId));
 assert.deepEqual(a.invalid,[]);assert.deepEqual(a.errors,[]);assert.equal(a.complete,false);assert.equal(a.coverageComplete,false);assert.notEqual(a.actionType,'proceed');
 assert.equal(m.hasQuantified,false);for(const row of m.rows){assert.equal(row.quantified,false);for(const sub of row.allActions||[])assert.equal(sub.quantified,false,'Nested automatic dose');}
 if(r.code==='00596')for(const row of m.rows.filter(x=>x.componentId==='etoposide')){assert.equal(row.actionType,'consultant_review');for(const sub of row.allActions||[])assert.ok(!hold.has(sub.actionType),'Ifosfamide-specific hold leaked into an etoposide subaction');}
 for(const f of findings.filter(f=>/^IFO_PRODUCT_|^IFO_NEURO_|^IFO_SEVERE_CURRENT|^NEURO_NOW$|^HIGH_DOSE_NEURO_STOP$|^IE_NEURO_/.test(f.ruleId)))assert.deepEqual(f.action.components,['ifosfamide'],'Product/neuro action component attribution');
 if(r.classification.startsWith('new_control')){
  const base=originals.find(e=>e.code===r.code&&e.name===r.name.replace('Product-source reconciliation control: ',''));assert.ok(base);
  for(const [key,value] of Object.entries(base.input))assert.deepEqual(r.input[key],value,'Original renal risk changed in supplied-product control');
  const added=Object.keys(r.input).filter(k=>!(k in base.input));assert.deepEqual(added.slice().sort(),[...(r.code==='00596'?['cycle_day']:[]),'ifosfamide_product','ifosfamide_laboratory_units_verified','serum_creatinine_umol_l','bilirubin_umol_l','alt_uln_multiple','ast_uln_multiple','alp_uln_multiple'].sort());
  const ids=findings.map(f=>f.ruleId);for(const id of ['IFOS_RENAL_REVIEW','IFOS_RENAL_CONFLICT'])assert.ok(ids.includes(id));
  for(const id of ['IFO_PRODUCT_IDENTIFICATION_REQUIRED','IFO_PRODUCT_LABS_MISSING','IFO_PRODUCT_UNITS_UNVERIFIED'])assert.ok(!ids.includes(id));
  assert.equal(m.rows.find(x=>x.componentId==='ifosfamide').actionType,'consultant_review');
  controls.push({code:r.code,name:r.name,original_renal_input_preserved:true,added_fields:added,precision_note:r.code==='00596'?'Also supplies cycle_day1. This reconciles the IE calendar cue as well as product context; it is not a single-variable product experiment.':'No undeclared cycle_day. Original ignored extra control key explicitly removed.'});
 }
 checked.push({code:r.code,name:r.name,no_numeric_dose_at_any_action_level:true,whole_assessment_still_incomplete:true,no_etoposide_hold_leak:true});
}
assert.equal(controls.length,6);
const preliminary=read('preliminary-contract-results.json'),fixtureChanges=[];for(let i=0;i<contract.results.length;i++){const before=preliminary.results[i],after=contract.results[i];assert.deepEqual(after.observed,before.observed);assert.equal(after.status,before.status);if(JSON.stringify(before.input)!==JSON.stringify(after.input)){assert.equal(after.code,'00680');assert.ok(after.classification.startsWith('new_control'));const corrected={...before.input};delete corrected.cycle_day;assert.deepEqual(after.input,corrected);fixtureChanges.push({code:after.code,name:after.name,removed_ignored_undeclared_field:'cycle_day',all_clinical_observations_identical:true});}}assert.equal(fixtureChanges.length,3);
const report={status:'ACCEPTED_NARROW_HISTORICAL_ADJUDICATION_SOFTWARE_CONTRACT',checked_utc:new Date().toISOString(),contract_script_sha256:sha('adjudicated-prior-contract.cjs'),failure_ledger_sha256:sha('prior-replays/failure-ledger.json'),source_adjudication_sha256:sha('HISTORICAL-REGRESSION-ADJUDICATION.md'),transition_manifest_sha256:sha('transition-manifest.json'),candidate_pins:transition.protocols.map(p=>({code:p.code,sha256:p.candidate_sha256})),exact_contract_replay:{total:20,passed:20,failed:0,identical_to_source_owner_report:true,all_inputs_declared:true},explicit_control_fixture_corrections:fixtureChanges,historical_inputs_and_current_observations:current,supplied_product_controls:controls,additional_independent_output_checks:checked,raw_results_preserved:{historical_author:{passed:639,total:650},historical_independent:{passed:191,total:197},historical_cns_semantic:{passed:121,total:123}},interpretation_limits:['Neurological localisation ambiguity hold is conservative software policy; a broad named-event grade alone does not establish current CNS toxicity.','NCCP00596 severe neurotoxicity review/rechallenge and NCCP00680 grade>=3 discontinuation remain distinct.','Missing product identity/laboratory/units holds are explicit reconciliation policy, not new NCCP universal numeric criteria.','Three historical exhaustive-coverage checks and two historical CNS-only structural checks remain failed; separate current coverage/append evidence does not rewrite them.'],application_changes:false,application_replay_pending:true,clinical_approval:false,pharmacy_approval:false};
fs.writeFileSync(path.join(home,output),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,contract:report.exact_contract_replay,ledger_matches:current.length,controls:controls.length,output:path.join(home,output)}));
