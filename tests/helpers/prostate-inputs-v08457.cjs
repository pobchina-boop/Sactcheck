'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),cp=require('node:child_process');
const root=path.resolve(__dirname,'../..'),codes=['00104','00518','00564','00326','00588'];
const read=f=>JSON.parse(fs.readFileSync(path.join(root,f))),sha=f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex');
function validate(p){
 const c=p.metadata?.nccp_regimen_code;if(!codes.includes(c))return null;
 const rec=read('validation/prostate-v08457/clinical/clinical-migration.json'),row=rec.records[c];
 assert.equal(rec.release,'0.84.57');assert.equal(rec.base_commit,'90ae67a0a3f565cb57f73072137c52c4851fec5b');assert(row);
 if(c==='00588'&&p.metadata.sactcheck_encoding_version==='0.84.63'){
  const successor=require('./retrospective-v08463.cjs'),reviewed=successor.validateProtocol(p),original=successor.baselineBytes(row.path);
  assert.equal(crypto.createHash('sha256').update(original).digest('hex'),row.sha256,'The inherited00588 protocol is the exact original v57 review');
  p=reviewed.historical;
 }else{assert.deepEqual(p,read(row.path));assert.equal(sha(row.path),row.sha256);}
 assert.equal(crypto.createHash('sha256').update(cp.execFileSync('git',['show',rec.base_commit+':'+row.path],{cwd:root})).digest('hex'),row.before_sha256);
 assert.equal(sha(row.source_pdf),row.source_sha256);assert.equal(p.metadata.source_url,row.source_url);assert.equal(p.metadata.nccp_version,row.source_version);
 assert.equal(p.metadata.sactcheck_encoding_version,'0.84.57');
 for(const flag of ['clinical_use_authorised','consultant_reviewed','oncology_pharmacy_reviewed'])assert.equal(p.metadata.validation[flag],false);
 const results=read(row.results);assert.equal(results.total,results.passed);assert(results.cases.some(x=>x.code===c));assert(results.cases.every(x=>x.pass));return row;
}
function grade(p,field,d){
 if(p.metadata?.nccp_regimen_code==='00588'||!codes.includes(p.metadata?.nccp_regimen_code)||d.type!=='select'||!field.includes('grade'))return false;
 const row=validate(p),c=p.metadata.nccp_regimen_code;assert.deepEqual(d,row.grading_fields[field]);assert.equal(d.required,false);assert.equal(d.grading_source_url,row.source_url);assert(d.source_grading_note&&d.assessment_guidance);
 assert.equal(d.ctcae_version,row.grading_fields[field].ctcae_version);assert.deepEqual(d.options.map(x=>Number(x.value)),[0,1,2,3,4]);
 const guide=require('../../js/ctcae-descriptors.js').guide({...d,id:field});assert.equal(guide.sourceSpecific,true);assert.equal(guide.calculable,false);assert.equal(guide.grades.length,5);assert(guide.grades.every(x=>x.description));return true;
}
function numericRenal(p,field,d){if(p.metadata?.nccp_regimen_code!=='00518'||field!=='crcl_ml_min')return false;validate(p);assert.equal(d.type,'number');assert.equal(d.renal_input.mode,'source_threshold_numeric');assert.equal(d.renal_input.source_url,p.metadata.source_url);return true;}
function retainedBreastRuleCount(p){const row=validate(p);assert.equal(p.metadata.nccp_regimen_code,'00588');if(p.metadata.sactcheck_encoding_version==='0.84.63')p=require('./retrospective-v08463.cjs').historicalProtocol(p);const baseline=JSON.parse(cp.execFileSync('git',['show','90ae67a0a3f565cb57f73072137c52c4851fec5b:'+row.path],{cwd:root}));const original=baseline.rule_engine.rules;assert.deepEqual(p.rule_engine.rules.slice(0,original.length),original);const added=p.rule_engine.rules.slice(original.length);assert.equal(added.length,5);for(const rule of added){assert(rule.when.all.some(c=>c.field==='indication_id'&&c.operator==='=='&&c.value==='mcrpc_brca_monotherapy'),'New eligibility rule must be confined to the prostate monotherapy indication');}return original.length;}
module.exports={validate,grade,numericRenal,retainedBreastRuleCount,codes};
