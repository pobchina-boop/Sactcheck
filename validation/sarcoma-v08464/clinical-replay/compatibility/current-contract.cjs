'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const home=__dirname,protocolDir=path.resolve(process.argv[2]||path.join(home,'final-graded/drafts/protocols')),runtime=path.resolve(process.argv[3]||path.join(home,'final-graded/Sactcheck')),output=path.resolve(process.argv[4]||path.join(home,'current-contract-results.json'));
const E=require(path.join(runtime,'js/assessment-engine')),D=require(path.join(runtime,'js/protocol-dose-schedule')),cases=require('./current-contract-cases.json').cases;
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),cache={},results=[];
for(const c of cases){
 const file=path.join(protocolDir,fs.readdirSync(protocolDir).find(n=>n.startsWith(c.code+'-')&&n.endsWith('.json'))),p=cache[c.code]||(cache[c.code]=JSON.parse(fs.readFileSync(file)));
 let a,m,error;try{
  for(const k of Object.keys(c.input))assert.ok(p.input_definitions[k],'Undeclared input '+k);
  a=E.assess(p,c.input);m=D.buildModificationModel(p,a);assert.deepEqual(a.errors,[]);assert.deepEqual(a.invalid,[]);assert.equal(a.complete,false);
  const ids=a.findings.map(f=>f.ruleId);for(const id of c.required)assert.ok(ids.includes(id),'Required '+id);for(const id of c.forbidden)assert.ok(!ids.includes(id),'Forbidden '+id);
  const rows=Object.fromEntries(m.rows.map(r=>[r.componentId,r]));assert.equal(rows.ifosfamide?.actionType,c.ifos_action);
  if(c.etoposide_action)assert.equal(rows.etoposide?.actionType,c.etoposide_action);
  assert.ok(m.rows.every(r=>!r.quantified),'No numeric dose');
  if(c.no_permanent_stop)assert.ok(!['discontinue','permanently_discontinue'].includes(a.actionType),'No universal permanent ban');
  if(c.historical){
   const before=JSON.parse(fs.readFileSync(path.join(home,'original-accepted',c.historical.suite+'-trace.json')))[c.historical.trace_index];
   const after=JSON.parse(fs.readFileSync(path.join(home,'final-pregrading',c.historical.suite+'-trace.json')))[c.historical.trace_index];
   assert.deepEqual(before.input,c.input);assert.deepEqual(after.input,c.input);
   const observed={actionType:a.actionType,complete:a.complete,coverageComplete:a.coverageComplete,invalid:a.invalid,errors:a.errors,findings:a.findings.map(f=>({ruleId:f.ruleId,domainAssessment:f.domainAssessment,actionType:f.actionType,action:f.action})),doseRows:m.rows};
   assert.deepEqual(JSON.parse(JSON.stringify(observed)),after.observed,'Exact preserved current observation');
   if(c.preserve_non_ifos_actions){const prior=Object.fromEntries(before.observed.doseRows.map(r=>[r.componentId,r]));for(const k of new Set([...Object.keys(prior),...Object.keys(rows)]))if(k!=='ifosfamide')assert.equal(rows[k]?.actionType,prior[k]?.actionType,'Other component '+k);}
  }
 }catch(e){error=e.message;}
 results.push({code:c.code,name:c.name,kind:c.kind,input:c.input,protocol_sha256:sha(file),passed:!error,error:error||null,observed:a?{action:a.actionType,complete:a.complete,findings:a.findings.filter(f=>!f.domainAssessment&&!f.ruleId.startsWith('PARTIAL_')).map(f=>({id:f.ruleId,type:f.actionType,action:f.action})),rows:m?.rows}:null});
}
const report={date:'2026-11-18',script_sha256:sha(__filename),case_file_sha256:sha(path.join(home,'current-contract-cases.json')),clinical_approval:false,total:results.length,passed:results.filter(x=>x.passed).length,failed:results.filter(x=>!x.passed).length,results};fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({total:report.total,passed:report.passed,failed:report.failed,failures:results.filter(x=>!x.passed).map(x=>({code:x.code,name:x.name,error:x.error}))},null,2));process.exitCode=report.failed?1:0;
