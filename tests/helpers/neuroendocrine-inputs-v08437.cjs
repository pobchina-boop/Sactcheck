'use strict';
// Narrow compatibility for source-audited NET37 inputs. Every exception is bound
// to retained source/baseline/current hashes and successful real-engine cases.
// Tumour differentiation and aggregate escalation history are not CTCAE widgets.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const migration=require('../../tools/neuroendocrine-organ-migration-v08437.cjs');
const root=path.resolve(__dirname,'../..'),checked=new WeakSet(),reports=new Map();
const netCodes=new Set(['00320','00327','00505','00642']);
const everolimusSourceGrades=new Set(['febrile_neutropenia_episode_grade','stomatitis_highest_grade','other_nonhaem_highest_grade','pneumonitis_highest_grade','hyperglycaemia_grade','hyperglycaemia_highest_grade','dyslipidaemia_grade','dyslipidaemia_highest_grade']);
function validateProtocol(p){
 const code=p.metadata.nccp_regimen_code;
 if(!netCodes.has(code))return false;
 if(!checked.has(p)){
  const record=migration.validate(code,p);
  assert(record,code+' requires exact source migration evidence');
  assert.equal(p.metadata.sactcheck_encoding_version,'0.84.37');
  const report=JSON.parse(fs.readFileSync(path.join(root,record.source_result_path)));
  assert.equal(report.release,'0.84.37');
  assert.equal(report.failed,0);assert.equal(report.passed,report.cases.length);
  assert(report.cases.every(c=>c.pass===true),code+' source cases must individually pass');
  reports.set(p,report);checked.add(p);
 }
 return true;
}
function evidence(p,field,values){
 validateProtocol(p);const cases=reports.get(p).cases.filter(c=>Object.hasOwn(c.input||{},field));
 assert(cases.length,`${p.metadata.nccp_regimen_code}/${field}: source-case evidence missing`);
 for(const value of values||[])assert(cases.some(c=>c.input[field]===value),`${field}: no passing source case for ${value}`);
}
function optional(def){assert.equal(def.required,false);assert.equal(def.input_role,'decision');}
function sourceReferences(p,field){
 const R=require('../../js/rule-engine');
 const rules=p.rule_engine.rules.filter(r=>R.collectConditionFields(R.conditionFromRule(r)).includes(field));
 assert(rules.length,field+' must be source-rule linked');
 assert(rules.every(r=>r.source?.url&&r.source.page),field+' requires rule-level source references');
}
function sourceGrade(p,field,def){
 const code=p.metadata.nccp_regimen_code;
 const tumour=code==='00642'&&field==='net_grade';
 const aggregate=code==='00327'&&field==='haematological_toxicity_grade';
 const source=code==='00320'&&everolimusSourceGrades.has(field);
 const numeric=code==='00642'&&field==='other_toxicity_grade';
 if(!tumour&&!aggregate&&!source&&!numeric)return false;
 validateProtocol(p);optional(def);sourceReferences(p,field);
 // The new fields must not quietly acquire an unsupported edition or generic
 // adverse-event conversion. Source criteria remain clinician assessed.
 assert.equal(def.ctcae_version,undefined);assert.equal(def.ctcae_source_url,undefined);
 if(tumour){
  assert.equal(def.label,'NET differentiation / grade');assert.equal(def.type,'select');
  const values=['well_differentiated_g1_g2','other','unknown'];
  assert.deepEqual(def.options.map(o=>o.value),values);
  assert.deepEqual(def.options.map(o=>o.label),['Well differentiated G1 or G2','G3, poorly differentiated or another diagnosis','Not confirmed']);
  evidence(p,field,values);
 }else if(numeric){
  assert.equal(def.type,'number');assert.equal(def.min,0);assert.equal(def.max,4);assert.equal(def.step,1);
  assert.equal(def.label,'Other CTCAE adverse reaction grade (exclude the separately entered renal/hepatic/count pathways)');
  evidence(p,field,[0,1,2,3,4]);
 }else{
  assert.equal(def.type,'select');
  const values=field==='febrile_neutropenia_episode_grade'?[0,3,4]:[0,1,2,3,4];
  assert.deepEqual(def.options.map(o=>o.value),values);
  evidence(p,field);
  if(aggregate){
   assert.equal(def.label,'Highest treatment-related haematological toxicity grade');
   assert.equal(def.assessment_guidance,'Used only for the source escalation eligibility review; CBC delay thresholds remain independently applicable.');
   evidence(p,field,[1,2,3]);
  }else if(field==='febrile_neutropenia_episode_grade'){
   assert.match(def.assessment_guidance,/ANC recovery ≥1\.25.*AND no fever/);
   assert.match(def.assessment_guidance,/Grade 4 requires discontinuation/);
   assert.match(def.assessment_guidance,/not calculated from a single temperature or count/);
   evidence(p,field,[3,4]);
  }else{
   assert.match(def.assessment_guidance,/clinician-verified source grade/);
   assert.match(def.assessment_guidance,/NCCP 00320 v6 Table 3 does not identify a CTCAE edition/);
   assert.match(def.assessment_guidance,/EMA SmPC Table 1 is explicitly based on CTCAE v3\.0/);
   assert.match(def.assessment_guidance,/Do not automatically convert/);
  }
 }
 return true;
}
function numericRenal(p,field,def){
 const code=p.metadata.nccp_regimen_code;
 if(!(code==='00505'&&field==='crcl_ml_min')&&!(code==='00642'&&['crcl_ml_min','baseline_crcl_ml_min','prrt_crcl_ratio'].includes(field)))return false;
 validateProtocol(p);optional(def);assert.equal(def.type,'number');assert.equal(def.step,.01);
 assert.equal(def.renal_input,undefined,'Audited direct-measurement fields must not be silently converted into old renal bands');
 if(code==='00505'){
  require('./captem-grading-v08437.cjs').metadata(p);
  assert.equal(def.min,0);assert.equal(def.unit,'mL/min');assert.equal(def.label,'Measured/calculated creatinine clearance');
  assert.match(def.assessment_guidance,/CrCl measure, not an unexamined eGFR substitution/);
  assert.match(def.assessment_guidance,/>50 and <51/);
  evidence(p,field,[29.99,30,35.99,36,50,50.01,50.99,51]);
  sourceReferences(p,field);
 }else if(field==='prrt_crcl_ratio'){
  assert.equal(def.min,0);assert.equal(def.label,'Current / baseline creatinine clearance');
  assert.deepEqual(def.derived_value,{operation:'ratio',fields:['crcl_ml_min','baseline_crcl_ml_min']});
  assert.equal(def.help,'Calculated from direct measurements; a supplied ratio is never trusted.');
  evidence(p,'crcl_ml_min');evidence(p,'baseline_crcl_ml_min');sourceReferences(p,field);
 }else{
  assert.equal(def.unit,'mL/min');assert.equal(def.min,field==='crcl_ml_min'?0:.01);
  assert.equal(def.label,field==='crcl_ml_min'?'Current creatinine clearance (Cockcroft–Gault, actual body weight)':'Pretreatment baseline creatinine clearance (same method)');
  if(field==='crcl_ml_min')assert.match(def.help,/Cockcroft–Gault creatinine clearance with actual body weight; do not substitute indexed eGFR/);
  evidence(p,field);
 }
 return true;
}
function handFoot(p,field,def){
 if(p.metadata.nccp_regimen_code!=='00327'||!['hand_foot_syndrome_grade','hand_foot_highest_grade'].includes(field))return false;
 validateProtocol(p);optional(def);assert.equal(def.type,'select');assert.equal(def.ctcae_version,'5.0');
 assert.equal(def.ctcae_source_url,'https://dctd.cancer.gov/research/ctep-trials/for-sites/adverse-events/ctcae-v5-5x7.pdf');
 assert.deepEqual(def.options.map(o=>o.value),[0,1,2,3]);assert(def.options.every(o=>o.description));
 assert.match(def.assessment_guidance,/NCCP 00327 table 3 does not name a CTCAE edition/);
 assert.match(def.assessment_guidance,/First grade 2 still requires interruption/);
 evidence(p,field);return true;
}
module.exports={validateProtocol,sourceGrade,numericRenal,handFoot};
