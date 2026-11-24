'use strict';
// Portable retrospective audit. Run this copy only; no application imports or writes.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const home=__dirname, manifest=require('./input-manifest.json'),cases=require('./cases.json'),prior=require('./prior-inputs.json');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const canonical=x=>Array.isArray(x)?'['+x.map(canonical).join(',')+']':x&&typeof x==='object'?'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}':JSON.stringify(x);
const hashInput=x=>sha(canonical(x));
const pins=manifest.files.filter(x=>x.kind!=='prior_suite_dedup_reference_not_execution_dependency');
function verifyPins(){for(const p of pins)assert.equal(sha(fs.readFileSync(path.join(home,p.path))),p.sha256,'Frozen artifact altered: '+p.path);}
verifyPins();
const E=require('./snapshot/js/assessment-engine.js'),D=require('./snapshot/js/protocol-dose-schedule.js');
const protocols=Object.fromEntries(manifest.files.filter(x=>x.kind==='accepted_candidate').map(x=>[path.basename(x.path).slice(0,5),JSON.parse(fs.readFileSync(path.join(home,x.path)))]));
const allowed=new Set(['consultant_review','withhold','delay','omit','contraindicated','discontinue','permanently_discontinue','withhold_then_reduce']);
const clinical=a=>a.findings.filter(x=>!x.domainAssessment&&!/^PARTIAL_/.test(x.ruleId));
const started=new Date().toISOString(),results=[];
const existing=new Map();for(const p of prior){let h=hashInput(p.input);if(!existing.has(h))existing.set(h,[]);existing.get(h).push({source:p.source,code:p.code,name:p.name});}
const distinct=new Set(),overlaps=[];
for(const c of cases){
 const errors=[],runcheck=fn=>{try{fn();}catch(e){errors.push(e.message)}};let a,m,s;
 const input_sha256=hashInput(c.input);runcheck(()=>assert.ok(!distinct.has(c.code+':'+input_sha256),'Duplicate within new suite'));distinct.add(c.code+':'+input_sha256);
 if(existing.has(input_sha256))overlaps.push({id:c.id,prior:existing.get(input_sha256)});
 runcheck(()=>{for(const k of Object.keys(c.input))assert.ok(protocols[c.code].input_definitions[k],'Undeclared fixture input: '+k);a=E.assess(protocols[c.code],c.input);s=D.buildModel(protocols[c.code]);m=D.buildModificationModel(protocols[c.code],a,s);assert.deepEqual(a.errors,[]);assert.deepEqual(a.invalid,[],'Invalid fixture');});
 if(a&&m){
  const findings=clinical(a),ids=findings.map(f=>f.ruleId),component=c.code==='00100'?'mifamurtide':'ifosfamide',row=m.rows.find(r=>r.componentId===component),x=c.expected;
  runcheck(()=>assert.ok(m.rows.every(r=>(!r.quantified||(r.actionType==='contraindicated'&&r.protocolDose==='Not to be administered'))&&(r.allActions||[]).every(y=>!y.quantified||(y.actionType==='contraindicated'&&y.protocolDose==='Not to be administered'))),'No automatic numeric administration dose, compounding or re-escalation'));
  runcheck(()=>assert.notEqual(a.actionType,'proceed','Partial case must not be whole-patient clearance'));
  if(x.rules)for(const id of x.rules)runcheck(()=>assert.ok(ids.includes(id),'Missing expected finding '+id));
  if(x.absent_rules)for(const id of x.absent_rules)runcheck(()=>assert.ok(!ids.includes(id),'Unexpected finding '+id));
  if(x.component_action)runcheck(()=>assert.ok(x.component_action.includes(row?.actionType),'Expected component action '+x.component_action.join('/')+'; actual '+row?.actionType));
  if(x.no_clinical_restriction)runcheck(()=>assert.equal(findings.filter(f=>allowed.has(f.actionType)).length,0,'Positive counterpart acquired an unsupported clinical restriction'));
  if(x.clinical_restriction)runcheck(()=>assert.ok(findings.some(f=>allowed.has(f.actionType))&&row&&allowed.has(row.actionType),'Explicit adverse context must produce actionable specialist review/restriction and component dose-action row; only partial/no-restriction findings observed'));
  if(x.schedule==='mifamurtide')runcheck(()=>{assert.equal(s.phases.length,2);const [early,late]=s.phases;assert.deepEqual(early.components[0].days,['1','4']);assert.deepEqual(late.components[0].days,['1']);assert.equal(early.cycles,12);assert.equal(late.cycles,24);assert.equal(early.cycles*2+late.cycles,48);assert.equal(early.components[0].dose,'2 mg/m²');assert.equal(late.components[0].dose,'2 mg/m²');});
  if(x.schedule==='high-dose-ifosfamide')runcheck(()=>{assert.equal(s.phases.length,1);const p=s.phases[0];assert.equal(p.cycleLength,21);assert.equal(p.cycles,4);assert.deepEqual(p.components.map(z=>({id:z.id,days:z.days,dose:z.dose})),[{id:'ifosfamide',days:['1','2','3','4','5'],dose:'3000 mg/m²'},{id:'mesna',days:['1'],dose:'400 mg/m²'},{id:'mesna',days:['1','2','3','4','5'],dose:'3000 mg/m² per day'},{id:'mesna',days:['6'],dose:'800 mg/m²'}]);assert.match(p.components[1].note,/hour before/);assert.match(p.components[3].note,/After the final/);});
 }
 results.push({...c,input_sha256,status:errors.length?'failed':'passed',errors,observed:a?{action:a.actionType,complete:a.complete,coverage_complete:a.coverageComplete,errors:a.errors,invalid:a.invalid,clinical_findings:clinical(a).map(f=>({rule_id:f.ruleId,action:f.actionType,components:f.action.components,message:f.action.message||f.action.recommendation,block_numeric_dose:f.action.block_numeric_dose})),all_finding_ids:a.findings.map(f=>f.ruleId),dose_model:m,schedule_model:s}:null});
}
verifyPins();assert.equal(distinct.size,40);assert.equal(overlaps.length,0,'Exact inputs duplicated a prior acceptance suite');
const report={started_utc:started,finished_utc:new Date().toISOString(),status:'external_retrospective_probe_with_preserved_findings_not_clinical_acceptance',total:results.length,distinct_inputs:distinct.size,passed:results.filter(r=>r.status==='passed').length,failed:results.filter(r=>r.status==='failed').length,by_regimen:Object.fromEntries(['00100','00680'].map(code=>{const rr=results.filter(r=>r.code===code);return[code,{cases:rr.length,passed:rr.filter(r=>r.status==='passed').length,failed:rr.filter(r=>r.status==='failed').length}]})),prior_suite_exact_input_overlap:overlaps,prior_inputs_compared:prior.length,novelty_scope:'New mixed-context scenarios and explicit-negative phase matrix; accepted product/CNS boundary suites were not counted as new. Exact full-input dedup is supplemental, not a claim of semantic independence alone.',manifest_sha256:sha(fs.readFileSync(path.join(home,'input-manifest.json'))),cases_sha256:sha(fs.readFileSync(path.join(home,'cases.json'))),script_sha256:sha(fs.readFileSync(__filename)),frozen_hashes_verified_before_and_after:true,application_changes:false,clinical_approval:false,pharmacy_approval:false,browser_verification:false,pdf_binary_verification:false,fixture_corrections:[],results};
const arg=process.argv.indexOf('--out'),name=arg>=0?process.argv[arg+1]:'replay-results.json';assert.ok(name&&path.basename(name)===name,'Output must be a local filename');const out=path.join(home,name);assert.ok(!fs.existsSync(out),'Preserve prior outcomes: output already exists '+name);fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output:out,total:report.total,distinct_inputs:report.distinct_inputs,passed:report.passed,failed:report.failed,by_regimen:report.by_regimen,failures:results.filter(r=>r.status==='failed').map(r=>({id:r.id,name:r.name,kind:r.expectation_kind,errors:r.errors}))},null,2));process.exitCode=report.failed?1:0;
