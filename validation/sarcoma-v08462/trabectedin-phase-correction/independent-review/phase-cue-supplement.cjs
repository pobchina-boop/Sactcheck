'use strict';
//18 additional00374 scenarios after source adjudication; not replacements for the100 primary cases.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const home=__dirname,pin=require('./input-manifest.json');
const arg=n=>{const i=process.argv.indexOf(n);return i<0?undefined:process.argv[i+1];};
const root=arg('--current'),output=path.resolve(home,arg('--output')||'phase-cue-original-results.json');
if(fs.existsSync(output))throw new Error('Refusing to overwrite preserved evidence');
const row=pin.protocols.find(x=>x.code==='00374'),file=root?path.resolve(root,row.application_path):path.join(home,row.snapshot_path);
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),bytes=fs.readFileSync(file),p=JSON.parse(bytes);
if(!root)assert.equal(hash(bytes),row.sha256);
const runtime=root?path.resolve(root,'js'):path.join(home,'snapshot/js');
const E=require(path.join(runtime,'assessment-engine.js')),D=require(path.join(runtime,'protocol-dose-schedule.js'));
const cases=[];
for(const field of ['dex_premed_confirmed','eligible_sts_context_confirmed'])for(const phase of ['baseline','on_treatment','restart'])for(const state of ['missing',false,true]){
 const inputs={assessment_phase:phase,actual_dose_mg_m2:1.2,anc:2,platelets:160,current_other_toxicity_grade:0,prior_cycle_other_toxicity_grade:0,dex_premed_confirmed:true,eligible_sts_context_confirmed:true};
 if(state==='missing')delete inputs[field];else inputs[field]=state;
 cases.push({case_id:`00374-cue-${cases.length+1}`,inputs,field,phase,state,expect_cue:state!==true,source_url:'https://healthservice.hse.ie/documents/6729/374_Trabectedin_monotherapy.pdf',source_lines:field==='dex_premed_confirmed'?'L178–L181':'L19–L22',rationale:field==='dex_premed_confirmed'?'Required premedication must be confirmed before an infusion, including a restart; a consultant review that blocks numeric dosing and explicitly requires confirmation implements this cue.':'The indication must be confirmed regardless of stage; toxicity recovery alone does not establish eligible disease or previous-treatment context.'});
}
const started=new Date().toISOString();
const results=cases.map(c=>{
 const a=E.assess(p,c.inputs),m=D.buildModificationModel(p,a),clinical=a.findings.filter(f=>!f.domainAssessment&&!/^PARTIAL_/.test(f.ruleId));
 const pattern=c.field==='dex_premed_confirmed'?/corticosteroid|dexamethasone|premedication/i:/anthracycline|ifosfamide|advanced.STS/i;
 const matching=clinical.filter(f=>pattern.test(f.action.message||f.action.recommendation||''));const errors=[];
 for(const key of Object.keys(c.inputs))if(!p.input_definitions[key])errors.push('Undeclared input:'+key);
 if(a.errors.length||a.invalid.length)errors.push('Unexpected engine/input error');
 if(a.complete!==false||a.coverageComplete!==false)errors.push('Partial scenario must remain incomplete');
 if(m.rows.some(r=>r.quantified))errors.push('No numeric dose from cue-only review');
 if(c.expect_cue){if(!matching.length)errors.push('Missing source-specific cue');if(!matching.some(f=>f.actionType==='consultant_review'))errors.push('Cue requires qualitative consultant review, not fabricated dose/hold');if(!m.rows.some(r=>r.componentId==='trabectedin'&&r.actionType==='consultant_review'))errors.push('Review must remain visible in dose-action component');}
 else if(matching.length)errors.push('Confirmed field must not keep firing the unconfirmed-context cue');
 return {...c,status:errors.length?'failed':'passed',errors,observed:{action:a.actionType,complete:a.complete,coverageComplete:a.coverageComplete,findings:clinical.map(f=>({id:f.ruleId,type:f.actionType,message:f.action.message||f.action.recommendation})),dose_rows:m.rows.map(r=>({componentId:r.componentId,actionType:r.actionType,quantified:r.quantified,protocolDose:r.protocolDose}))}};
});
const report={started_utc:started,finished_utc:new Date().toISOString(),mode:root?'current-replay':'original-snapshot',scope:['00374'],supplement_to_five_suite_primary_case_count:100,total:18,passed:results.filter(r=>r.status==='passed').length,failed:results.filter(r=>r.status==='failed').length,protocol_sha256:hash(bytes),engine_sha256:hash(fs.readFileSync(path.join(runtime,'assessment-engine.js'))),dose_model_sha256:hash(fs.readFileSync(path.join(runtime,'protocol-dose-schedule.js'))),script_sha256:hash(fs.readFileSync(__filename)),source_sha256:row.source_sha256,independent_clinical_approval:false,independent_pharmacy_approval:false,results};
fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({output,total:18,passed:report.passed,failed:report.failed,failures:results.filter(r=>r.status==='failed').map(r=>({id:r.case_id,field:r.field,phase:r.phase,state:r.state,errors:r.errors}))},null,2));process.exitCode=report.failed?1:0;
