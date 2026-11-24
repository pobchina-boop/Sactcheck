'use strict';
// Portable: default uses the preserved original protocols AND original runtime.
// Optional replay: node run-audits.cjs --current /absolute/Sactcheck --output final-results.json
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const home=__dirname,manifest=require('./input-manifest.json'),spec=require('./core-cases.json');
const arg=n=>{let i=process.argv.indexOf(n);return i<0?undefined:process.argv[i+1];};
const current=arg('--current'),output=path.resolve(home,arg('--output')||'original-results.json');
if(fs.existsSync(output))throw new Error('Refusing to overwrite existing evidence: '+output);
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const runtime=current?path.resolve(current,'js'):path.join(home,'snapshot/js');
const E=require(path.join(runtime,'assessment-engine.js')),D=require(path.join(runtime,'protocol-dose-schedule.js'));
const hold=['withhold','delay','withhold_then_reduce','omit','discontinue','permanently_discontinue','contraindicated'];
const stop=['discontinue','permanently_discontinue'];
const protocols={},protocolInputs=[];
for(const x of manifest.protocols){const file=current?path.resolve(current,x.application_path):path.resolve(home,x.snapshot_path);const b=fs.readFileSync(file);if(!current)assert.equal(hash(b),x.sha256);protocols[x.code]=JSON.parse(b);protocolInputs.push({code:x.code,path:current?x.application_path:x.snapshot_path,sha256:hash(b)});assert.equal(hash(fs.readFileSync(path.resolve(home,x.source_path))),x.source_sha256);}
const runtimeInputs=manifest.runtime.map(x=>{const file=path.join(runtime,path.basename(x.path));const sha256=hash(fs.readFileSync(file));if(!current)assert.equal(sha256,x.sha256);return {file:path.basename(file),sha256};});
const started=new Date().toISOString();
const results=spec.cases.map(c=>{
 let a,m,findings=[],checks=[],error=null;
 function check(value,message){checks.push({pass:!!value,message});assert.ok(value,message);}
 try{
  for(const key of Object.keys(c.inputs))check(!!protocols[c.code].input_definitions[key],'Input declared: '+key);
  a=E.assess(protocols[c.code],c.inputs);m=D.buildModificationModel(protocols[c.code],a);
  findings=a.findings.filter(f=>!f.domainAssessment&&!/^PARTIAL_/.test(f.ruleId));
  const messages=findings.map(f=>f.action.message||f.action.recommendation||'').join('\n');
  check(a.errors.length===0,'No engine execution errors');check(a.invalid.length===0,'Inputs valid against clinical UI schema');
  check(m.rows.every(r=>!r.quantified||(r.actionType==='contraindicated'&&r.protocolDose==='Not to be administered')),'No automatic numeric treatment dose; a quantified do-not-administer label is not a dose');
  if(c.expected.kind==='hold'){check(hold.includes(a.actionType),'Known active risk retains an overall hold/stop');check(m.rows.some(r=>hold.includes(r.actionType)),'Dose-action component retains hold/stop');}
  if(c.expected.kind==='stop'){check(stop.includes(a.actionType),'Specific irreversible/no-rechallenge rule retains discontinuation');check(m.rows.some(r=>stop.includes(r.actionType)),'Dose-action component retains discontinuation');}
  if(c.expected.kind==='contra')check(a.actionType==='contraindicated','Explicit source exclusion remains contraindicated');
  if(c.expected.kind==='review')check(findings.length>0&&!['proceed','proceed_with_caution'].includes(a.actionType),'Source-specific review cannot become a proceed decision');
  if(c.expected.kind==='partial'){check(a.complete===false&&a.coverageComplete===false,'Omitted current laboratory criterion remains incomplete');check(a.unassessed.some(x=>x.id===c.expected.missing_input),'Specific omitted criterion remains explicitly unassessed: '+c.expected.missing_input);}
  for(const component of c.expected.component_hold||[])check(m.rows.some(r=>r.componentId===component&&hold.includes(r.actionType)),'Required component hold: '+component);
  for(const component of c.expected.component_review||[])check(m.rows.some(r=>r.componentId===component&&r.actionType==='consultant_review'),'Separate component review: '+component);
  for(const component of c.expected.component_not_hold||[])check(!m.rows.some(r=>r.componentId===component&&hold.includes(r.actionType)),'No unsupported hold on other component: '+component);
  for(const component of c.expected.component_attention||[])check(m.rows.some(r=>r.componentId===component&&!['proceed','proceed_with_caution'].includes(r.actionType)),'Clinical component review/hold remains visible: '+component);
  for(const component of c.expected.component_not_stop||[])check(!m.rows.some(r=>r.componentId===component&&['discontinue','permanently_discontinue'].includes(r.actionType)),'No unsupported permanent stop on other component: '+component);
  if(c.expected.forbid_text)check(!new RegExp(c.expected.forbid_text,'i').test(messages),'No source-unsupported instruction: '+c.expected.forbid_text);
  if(c.expected.match)check(new RegExp(c.expected.match,'i').test(messages),'Expected source topic visible: '+c.expected.match);
  if(c.expected.absent)check(!new RegExp(c.expected.absent,'i').test(messages),'No wrong-context finding: '+c.expected.absent);
  if(c.expected.forbid_action)check(!c.expected.forbid_action.includes(a.actionType),'Caution not converted into unsupported contraindication');
 }catch(e){error=e.message;}
 return {...c,status:error?'failed':'passed',error,checks,observed:a?{action:a.actionType,complete:a.complete,coverageComplete:a.coverageComplete,invalid:a.invalid,unassessed:a.unassessed,findings:findings.map(f=>({rule_id:f.ruleId,action:f.actionType,message:f.action.message||f.action.recommendation,components:f.action.components})),dose_model:m?{hasQuantified:m.hasQuantified,rows:m.rows.map(r=>({componentId:r.componentId,actionType:r.actionType,quantified:r.quantified,protocolDose:r.protocolDose}))}:null}:null};
});
const report={started_utc:started,finished_utc:new Date().toISOString(),mode:current?'current-replay':'original-snapshot',node:process.version,scope:[...new Set(spec.cases.map(x=>x.code))],application_replay_pending:true,source_manifest_sha256:hash(fs.readFileSync(path.join(home,'input-manifest.json'))),cases_sha256:hash(fs.readFileSync(path.join(home,'core-cases.json'))),runner_sha256:hash(fs.readFileSync(__filename)),protocols:protocolInputs,runtime:runtimeInputs,independent_clinical_approval:false,independent_pharmacy_approval:false,total:results.length,passed:results.filter(r=>r.status==='passed').length,failed:results.filter(r=>r.status==='failed').length,results};
fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({output,total:report.total,passed:report.passed,failed:report.failed,by_protocol:Object.fromEntries(manifest.scope.map(code=>[code,{total:results.filter(r=>r.code===code).length,failed:results.filter(r=>r.code===code&&r.status==='failed').length}])),failures:results.filter(r=>r.status==='failed').map(r=>({case_id:r.case_id,title:r.title,error:r.error,action:r.observed?.action}))},null,2));
process.exitCode=report.failed?1:0;
