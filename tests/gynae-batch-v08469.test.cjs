'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const engine = require('../js/assessment-engine');
const settings = require('../data/regimen-workflow-v0750.json');
const sources = require('../validation/gynae-v08469/sources.json');
const records = require('../protocols/index.json').protocols;
const root = path.resolve(__dirname, '..');
function protocol(code) {
  return require(path.join(root, records.find(row => row.path.includes('/' + code + '-')).path));
}
let checks = 0;
function check(code, inputs, rule, expected=true) {
  const result = engine.assess(protocol(code), inputs);
  assert.deepEqual(result.invalid, [], code);
  assert.deepEqual(result.errors, [], code);
  assert.equal(result.findings.some(finding => finding.ruleId === rule), expected, JSON.stringify({code,inputs,rule,expected}));
  checks++;
}
for (const [field, value, expected] of [['anc',0.99,true],['anc',1,false],['platelets',99.9,true],['platelets',100,false],['haemoglobin',8.9,true],['haemoglobin',9,false]]) {
  check('00312',{[field]:value},'WEEKLY_COUNTS',expected);
}
for (const [n,match] of [[1.5,true],[1.51,false]]) check('00312',{assessment_phase:'pre_treatment',anc:n},'BASELINE_ANC',match);
for (const [v,match] of [[171,false],[172,true]]) check('00312',{bilirubin_umol_l:v},'BILI',match);
for (const [k,cut,delta] of [['anc',1.5,-0.01],['platelets',100,-1],['haemoglobin',9,-0.1],['albumin_g_l',25,-0.1],['alk_phos_uln',2.5,0.01],['bilirubin_uln_multiple',1,0.01],['alt_ast_uln_multiple',2.5,0.01],['ck_uln_multiple',2.5,0.01]]) {
  check('00375',{[k]:cut},'ENTRY_'+k,false);
  check('00375',{[k]:cut+delta},'ENTRY_'+k);
}
for (const [crcl,cr,match] of [[59,133,true],[60,133,false],[59,132.6,false]]) check('00375',{crcl_ml_min:crcl,creatinine_umol_l:cr},'RENAL_BOTH',match);
check('00375',{creatinine_umol_l:150},'RENAL_PARTIAL');
for(const [visit,match] of [['radiation',true],['chemotherapy',false]]) {
  check('00676',{treatment_visit:visit,radiation_cancelled:true},'RT_CANCELLED',match);
  check('00676',{treatment_visit:visit,anc:1.2},'CIS_COUNTS',match);
  check('00676',{treatment_visit:visit,gfr_or_crcl_ml_min:20},'CARBO_GFR_STOP',!match);
}
for(const [v,stop,caution] of [[20,true,false],[20.01,false,true],[30,false,true],[30.01,false,false]]) {
  const inputs={treatment_visit:'chemotherapy',gfr_or_crcl_ml_min:v};
  check('00676',inputs,'CARBO_GFR_STOP',stop);
  check('00676',inputs,'CARBO_GFR_CAUTION',caution);
}
for (const [total,stop,risk] of [[300000,false,false],[300001,false,true],[400000,false,true],[400001,true,false]]) {
  const inputs={treatment_visit:'bleomycin',planned_cumulative_bleomycin:total};
  check('00300',inputs,'BLEO_MAX',stop);check('00300',inputs,'BLEO_RISK',risk);
}
check('00300',{treatment_visit:'days2to5',cisplatin_renal_band:'40_49'},'CIS_CURATIVE');
check('00300',{treatment_visit:'bleomycin',cisplatin_renal_band:'40_49'},'CIS_CURATIVE',false);
assert.deepEqual(protocol('00300').indications.map(i=>i.code),['00300a','00300b','00300c','00300d']);
assert.match(protocol('00300').indications.find(i=>i.code==='00300c').description,/ovarian dysgerminoma/i);
for(const [crcl,id] of [[19.99,'MTX_LT20'],[20,'MTX_20_49'],[49.99,'MTX_20_49'],[50,'MTX_AT50'],[50.01,null]]) {
  for(const rule of ['MTX_LT20','MTX_20_49','MTX_AT50']) check('00246',{crcl_ml_min:crcl},rule,rule===id);
}
for(const c of ['00300','00312','00375','00676','00246']) {
  const source=protocol(c), patient=require('../data/patient-knowledge/'+c+'.json');
  assert.equal(settings.supportive_phase_selectors[c].protocol_id,source.protocol_id);
  assert.equal(sources[c].version,source.metadata.nccp_version);
  assert.match(sources[c].retrieved_text_sha256,/^[a-f0-9]{64}$/);
  const form=fs.readFileSync(path.join(root,'patient',c,'consent-form.html'),'utf8');
  for(const agent of patient.agents) assert(form.includes('<h3>'+agent.name+'</h3>'));
  for(const phase of patient.phases) assert(fs.readFileSync(path.join(root,'patient',c,'antiemetic-'+phase.id+'.pdf')).subarray(0,5).equals(Buffer.from('%PDF-')));
}
const mtx=protocol('00246').treatment_phases[0].administration;
assert.deepEqual(mtx.map(r=>[r.drug,r.dose.value,r.days,r.route]),[['methotrexate',50,[1,3,5,7],'IM'],['folinic acid',15,[2,4,6,8],'PO']]);
assert.match(mtx[1].note,/24 hours/);
for(const c of ['00499','00766','00799','00811','00817']) {
  const p=require('../data/patient-knowledge/'+c+'.json');
  assert(p.questions.some(q=>q.a===sources[c].retrospective_focus));
}
for (const [value,mid,low] of [[9.99,false,true],[10,true,false],[50,true,false],[50.01,false,false]]) {
  const v = {treatment_visit:'day1',crcl_ml_min:value};
  check('00300',v,'BLEO_RENAL_10TO50',mid);check('00300',v,'BLEO_RENAL_LT10',low);
  check('00300',{...v,treatment_visit:'days2to5'},'BLEO_RENAL_10TO50',false);
}
for (const [value,rule] of [[19.9,null],[20,'PLD_BILI_20'],[50,'PLD_BILI_20'],[50.5,'PLD_BILI_GAP'],[51,'PLD_BILI_51'],[86,'PLD_BILI_51'],[86.1,'PLD_BILI_STOP']]) {
  for(const id of ['PLD_BILI_20','PLD_BILI_51','PLD_BILI_GAP','PLD_BILI_STOP']) check('00375',{bilirubin_umol_l:value},id,rule===id);
}
require('../js/emetogenic-risk');
const risk = globalThis.SACTCheckEmetogenicRisk;
for (const code of ["00246", "00300", "00312", "00375", "00676", "00499", "00766", "00799", "00811", "00817"]) {
  const d=protocol(code), index=d.supportive_care.prescription_index;
  assert.equal(risk.get(d).proformaUrl,index);
  const record=require('../data/emetogenic-risk-map.json').protocols[code];
  assert.equal(record.level,d.supportive_care.emetogenic_risk);
  for(const phase of settings.supportive_phase_selectors[code].phases) {
    const result=risk.get(d,{treatmentPhase:phase.id});
    assert.equal(result.proformaUrl,'patient/'+code+'/antiemetic-'+phase.id+'.pdf');
    assert.equal(result.level,settings.antiemetic_plans[phase.plan_id].risk_level);
    assert.equal(record.phase_profiles[phase.id].level,result.level);
    assert.match(risk.badge(d,{treatmentPhase:phase.id}),/download/);
  }
}
console.log(checks+' clinical boundary and visit checks passed, with consent, prescription, schedule, indication and retrospective checks.');
