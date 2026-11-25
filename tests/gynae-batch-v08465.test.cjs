'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname,'..');
const read = file => JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const digest = file => crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
const records = read('validation/gynae-v08465/sources.json');
const engine = require('../js/assessment-engine');
const workflow = require('../js/regimen-workflow-engine-v0750');
const printer = require('../js/supportive-care-pdf-v0750');
const registry = require('../js/patient-asset-registry-v0810');
const config = read('data/regimen-workflow-v0750.json');
const risk = read('data/emetogenic-risk-map.json');
const knowledge = read('data/regimen-knowledge-gynae-v08465.json');
const protocols = {};
for(const r of records){
  const p=read(r.protocol);protocols[r.code]=p;
  assert.equal(digest(r.pdf),r.sha256,r.code+' primary source');
  assert.equal(p.metadata.nccp_version,r.version);
  if(r.role==='retrospective') continue;
  assert.equal(p.metadata.source_pdf_sha256,r.sha256);
  assert.equal(read('data/nccp-change-tracker/source-register-v0620.json').records.find(x=>x.nccp_regimen_code===r.code).protocol_json_sha256,digest(r.protocol));
  assert.deepEqual(registry.bundleRoutes(r.code),[r.code]);
  assert.equal(engine.assess(p,{}).actionType,'incomplete');
  assert(knowledge.regimen_profiles.some(v=>v.protocol_id===p.protocol_id));
  assert(knowledge.evidence_records.some(v=>v.protocol_id===p.protocol_id && v.publication_url && v.primary_endpoint));
}
let checks=0;
function expect(code,input,rule,action,components){
  const result=engine.assess(protocols[code],input);
  assert.deepEqual(result.errors,[]);assert.deepEqual(result.invalid,[]);
  const hit=result.findings.find(f=>f.ruleId===rule);
  if(action){assert.equal(hit?.actionType,action,code+' '+rule+' '+JSON.stringify(input)); assert.deepEqual(hit.action.components,components);}
  else assert.equal(hit,undefined,code+' '+rule+' '+JSON.stringify(input));
  checks++;
}
const both=['paclitaxel','carboplatin'],tax=['paclitaxel'],carb=['carboplatin'],gem=['gemcitabine'],pld=['pegylated liposomal doxorubicin'],io=['dostarlimab'];
for(const code of ['00303','00308']){
 const day=code==='00308'?{treatment_day:'day1'}:{};
 expect(code,{...day,cycle_number:1,anc:1.49},'BASELINE_ANC','withhold',both);
 expect(code,{...day,cycle_number:1,anc:1.5},'BASELINE_ANC');
 for(const [gfr,expected] of [[19.9,1],[20,1],[20.01,2],[30,2],[30.01,0]]){
  expect(code,{...day,gfr_ml_min:gfr},'CARBO_GFR_STOP',expected===1?'contraindicated':null,carb);
  expect(code,{...day,gfr_ml_min:gfr},'CARBO_GFR_CAUTION',expected===2?'consultant_review':null,carb);
 }
 for(const [b,id] of [[1.25,null],[1.255,'TAXANE_LIVER_BOUNDARY'],[1.26,'TAXANE_LIVER_75'],[2,'TAXANE_LIVER_75'],[2.01,'TAXANE_LIVER_50'],[5,'TAXANE_LIVER_50'],[5.01,'PACLITAXEL_HEPATIC']]){
  for(const k of ['TAXANE_LIVER_75','TAXANE_LIVER_50','TAXANE_LIVER_BOUNDARY','PACLITAXEL_HEPATIC']){
   const action=k==='TAXANE_LIVER_BOUNDARY'?'consultant_review':k==='PACLITAXEL_HEPATIC'?'contraindicated':'dose_reduce';
   expect(code,{alt_uln_multiple:3,bilirubin_uln_multiple:b},k,id===k?action:null,tax);
  }
 }
 expect(code,{alt_uln_multiple:10,bilirubin_uln_multiple:1},'PACLITAXEL_HEPATIC','contraindicated',tax);
}
expect('00303',{neuropathy_grade:3},'PACLITAXEL_NEURO_SEVERE','omit',tax);
expect('00303',{neuropathy_grade:2},'PACLITAXEL_NEURO_SEVERE');
for(const day of ['day8','day15']){
 const d={cycle_number:2,treatment_day:day};
 expect('00308',{...d,anc:0.49,platelets:90},'WEEKLY_OMIT','omit',tax);
 expect('00308',{...d,anc:0.5,platelets:50},'WEEKLY_OMIT');
 expect('00308',{...d,gfr_ml_min:18},'CARBO_GFR_STOP');
 expect('00308',{...d,anc:0.8,platelets:74},'DAY1_COUNTS');
}
expect('00308',{cycle_number:2,treatment_day:'day1',anc:1,platelets:74},'DAY1_COUNTS','delay',both);
expect('00308',{cycle_number:2,treatment_day:'day1',anc:1,platelets:75},'DAY1_COUNTS');
for(const [anc,plt,omit,reduce] of [[0.49,60,true,false],[0.7,49,true,false],[0.5,50,false,true],[1,100,false,true],[1.01,101,false,false]]){
 const input={treatment_day:'day8',anc,platelets:plt};
 expect('00306',input,'DAY8_OMIT',omit?'omit':null,gem);
 expect('00306',input,'DAY8_75_PERCENT',reduce?'dose_reduce':null,gem);
}
expect('00306',{anc:1.5,platelets:100,treatment_day:'day1',restart_after_day8_omission:false},'DAY1_COUNTS_LOW','delay',['gemcitabine','carboplatin']);
expect('00306',{anc:1.5,platelets:100,treatment_day:'day1',restart_after_day8_omission:true},'POST_OMISSION_RESTART');
expect('00306',{anc:1.49,platelets:100,treatment_day:'day1',restart_after_day8_omission:true},'POST_OMISSION_RESTART','delay',['gemcitabine','carboplatin']);
for(const [wk,grade,id,act] of [['week4',3,'STOMATITIS_G3_4_WEEK4_5','delay'],['week5',4,'STOMATITIS_G3_4_WEEK4_5','delay'],['week6',3,'STOMATITIS_G3_4_WEEK6','discontinue']])expect('00624',{toxicity_assessment_week:wk,stomatitis_grade:grade},id,act,pld);
expect('00624',{prolonged_cytopenia:true,recovered_after_14_day_delay:false,current_pld_dose_level:'30'},'NO_RECOVERY_AFTER_REDUCTION');
expect('00624',{prolonged_cytopenia:true,recovered_after_14_day_delay:false,current_pld_dose_level:'25'},'NO_RECOVERY_AFTER_REDUCTION','discontinue',pld);
expect('00819',{pneumonitis_grade:2,pneumonitis_recurrence:true},'ICI_PNEUM_RECURRENCE','permanently_discontinue',io);
expect('00819',{pneumonitis_grade:2,pneumonitis_recurrence:false},'ICI_PNEUM_RECURRENCE');
expect('00819',{diarrhoea_colitis_grade:4},'ICI_COLITIS_G4','permanently_discontinue',io);
expect('00819',{alt_ast_uln_multiple:6},'ICI_HEP_G3','withhold',io);
expect('00819',{alt_ast_uln_multiple:6},'IMMUNE_HEPATITIS_SEVERE');
expect('00819',{interval_dose4_to_5:20},'EARLY_TRANSITION','withhold',io);
expect('00819',{interval_dose4_to_5:21},'EARLY_TRANSITION');
for(const [c,day,plan,drugs] of [['00303','combination','high_carboplatin',both],['00308','day1','high_carboplatin',both],['00308','weekly','low',tax],['00306','day1','high_carboplatin',['gemcitabine','carboplatin']],['00306','day8','low',gem],['00624','combination','high_carboplatin',[...pld,...carb]],['00819','initial','minimal',io],['00819','continuation','minimal',io]]){
 const result=workflow.buildManifest(protocols[c],config,risk.protocols[c],day);
 assert.equal(result.supportiveCare.planId,plan);
 assert.deepEqual(result.components,drugs);
 const warning=result.interactionOverrides.find(row=>row.id==='nccp_'+c+'_medication_review');
 if(c==='00306' && day==='day8') assert.equal(warning,undefined);
 else assert.equal(warning.source.url,protocols[c].metadata.source_url);
 const environmental=read('data/sustainability-regimen-metadata-v08445-addendum.json').profiles[protocols[c].protocol_id];
 assert.equal(environmental.route_classification.value,'parenteral_only');
 assert.equal(environmental.travel_model_inputs.value,null);
 const pdf=Buffer.from(printer.buildPdf({manifest:result,sources:config.sources}));
 assert(pdf.toString('ascii',0,4)==='%PDF');checks++;
}
for (const [code,field] of [['00303','egfr'],['00308','gfr_or_crcl_ml_min']]) {
  expect(code,{[field]:30},'LEGACY_RENAL_MEASURE_REVIEW','consultant_review',['carboplatin']);
  expect(code,{[field]:31},'LEGACY_RENAL_MEASURE_REVIEW');
}
for (const [anc,confirmed,action] of [[0.99,false,null],[0.99,true,'dose_reduce_one_level'],[1,true,null]]) {
  expect('00624',{anc,table2_neutropenia_review_confirmed:confirmed},'TABLE2_CONFIRMED_NEUTROPENIA',action,['carboplatin',...pld]);
}
expect('00624',{anc:0.99},'GRADE4_NEUTROPENIA','consultant_review',['carboplatin',...pld]);
for (const code of ['00303','00308']) {
  expect(code,{confirmed_grade3plus_table3_reaction:true},'TABLE3_CONFIRMED_REACTION','discontinue',both);
  expect(code,{confirmed_grade3plus_table3_reaction:false},'TABLE3_CONFIRMED_REACTION');
}
console.log(checks+' source-boundary and phase-specific prescription checks passed.');
// These regression fixtures preserve executable rule behaviour. Independently
// authored NCCP boundary and phase cases above provide the source-backed checks.
const frozenReplays = read('validation/gynae-v08465/rule-replays.json');
for (const [code, protocol] of Object.entries(protocols)) {
  if (!records.some(record => record.code === code && record.role === 'new')) continue;
  const fixtures = frozenReplays.filter(row => row.code === code);
  assert.deepEqual(fixtures.map(row => row.rule).sort(), protocol.rule_engine.rules.map(row => row.rule_id || row.id).sort());
  for (const test of fixtures) {
    expect(code,test.positive,test.rule,test.action,test.components);
    expect(code,test.control,test.rule);
  }
}
console.log(frozenReplays.length + ' encoded rules replayed with a triggering input and a control each.');
