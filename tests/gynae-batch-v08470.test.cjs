'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
const engine = require('../js/assessment-engine');
const catalogue = require('../protocols/index.json').protocols;
const sources = require('../validation/gynae-v08470/sources.json');
const workflow = require('../data/regimen-workflow-v0750.json');
require('../js/emetogenic-risk');
const risk = globalThis.SACTCheckEmetogenicRisk;
function get(code) { return require(path.join(root, catalogue.find(row=>row.path.includes('/'+code+'-')).path)); }
let checks = 0;
function verify(code, inputs, id, match=true) {
  const result = engine.assess(get(code),inputs);
  assert.deepEqual(result.invalid,[],code+JSON.stringify(inputs));
  assert.deepEqual(result.errors,[],code);
  assert.equal(result.findings.some(f=>f.ruleId===id),match,JSON.stringify({code,id,inputs,match}));
  checks++;
}
function boundary(code,visit,field,rule,pairs,extra={}) {
  for (const [v,match] of pairs) verify(code,{...extra,...(visit?{treatment_visit:visit}:{}),[field]:v},rule,Boolean(match));
}
for (const c of ['00247','00248']) boundary(c,null,'post_mtx_hcg','HCG_1000',[[999,0],[1000,1],[1001,0]]);
boundary('00248','ema','anc','COUNTS',[[0.99,1],[1,1],[1.01,0]]);
boundary('00266','tp','anc','COUNTS',[[0.99,1],[1,0],[1.01,0]]);
for (const [c,v] of [['00248','ema'],['00266','te']]) boundary(c,v,'platelets','COUNTS',[[74.9,1],[75,1],[75.1,0]]);
boundary('00249','intrathecal','previous_spinal_doses','IT_LIMIT',[[2,0],[3,1],[4,1]]);
boundary('00249','intrathecal','crcl_ml_min','IT_RENAL',[[29.9,1],[30,0]]);
verify('00249',{treatment_visit:'rescue',crcl_ml_min:20},'IT_RENAL',false);
verify('00249',{treatment_visit:'intrathecal',intrathecal_checks_confirmed:false},'IT_SAFETY');
for(const c of ['00248','00264','00249']) verify(c,{treatment_visit:'rescue',folinic_acid_rescue_confirmed:false},'RESCUE');
for(const c of ['00248','00264']){
  boundary(c,'ema','crcl_ml_min','MTX_OVERLAP',[[44.99,0],[45,1],[45.01,0],[59.99,0],[60,1],[60.01,0]]);
  boundary(c,'ema','crcl_ml_min','MTX_LT30',[[29.99,1],[30,0]]);
  boundary(c,'ema','bilirubin_umol_l','MTX_HEP_STOP',[[85,0],[85.1,1]]);
  boundary(c,'ema','bilirubin_umol_l','MTX_HEP_GAP',[[49.9,0],[50,1],[50.99,1],[51,0]]);
  verify(c,{treatment_visit:'ema',third_space_fluid:true},'THIRD_SPACE_FLUID');
  for(const [visit,expect] of [['ema',true],['rescue',false]])verify(c,{treatment_visit:visit,previous_gut_grade:4,gut_grade:1,episode_number:2},'GI_4_2',expect);
  verify(c,{treatment_visit:'ema',previous_gut_grade:3,gut_grade:2,episode_number:1},'GI_RECOVERY');
  verify(c,{treatment_visit:'ema',previous_gut_grade:3,gut_grade:1,episode_number:2},'GI_3_2');
}
for (const [v,m] of [['ema',false],['co',true]])verify('00248',{treatment_visit:v,neuropathy_grade:3},'VCR_G3',m);
verify('00248',{treatment_visit:'co',neuropathy_grade:2,neuropathy_persistent:true},'VCR_PERSIST');
boundary('00248','co','bilirubin_umol_l','VCR_LIVER_OMIT',[[51,0],[51.01,1]],{ast_u_l:181});
boundary('00264','ep','crcl_ml_min','CIS_GAP',[[59,0],[59.01,1],[60,1],[60.01,0]]);
boundary('00264','ep','neuropathy_grade','CIS_NEURO',[[1,0],[2,1],[4,1]]);
boundary('00266','tp','crcl_ml_min','ENTRY_CIS',[[50,1],[59.99,1],[60,0]],{assessment_phase:'pre_treatment'});
boundary('00266','tp','crcl_ml_min','CIS_50_59',[[49.99,0],[50,1],[59,1],[59.99,0]],{assessment_phase:'on_treatment'});
for (const [v,m] of [['tp',true],['te',false]])verify('00266',{treatment_visit:v,crcl_ml_min:39.9,assessment_phase:'on_treatment'},'CIS_LT40',m);
for (const [code,visit] of [['00248','ema'],['00264','ep'],['00266','te']]) {
  boundary(code,visit,'crcl_ml_min','ETO_15_50',[[14.99,0],[15,1],[50,1],[50.01,0]]);
  boundary(code,visit,'ast_u_l','ETO_SEVERE',[[180,0],[180.01,1]]);
}
const expected = {
 '00247':[14,1,{day1:'moderate'}], '00248':[14,3,{ema:'moderate',ema2:'moderate',rescue:'minimal',co:'moderate'}],
 '00249':[14,2,{intrathecal:'low',rescue:'minimal'}],'00264':[14,2,{ema:'moderate',rescue:'minimal',ep:'high'}],'00266':[28,1,{tp:'high',te:'low'}]
};
for(const [code,[cycle,indications,visits]] of Object.entries(expected)){
 const d=get(code),profile=require('../data/patient-knowledge/'+code+'.json'),selector=workflow.supportive_phase_selectors[code];
 assert.equal(d.treatment.cycle_length_days,cycle);assert.equal(profile.cycle_days,cycle);assert.equal(d.indications.length,indications);
 assert.equal(selector.protocol_id,d.protocol_id);assert.equal(sources[code].version,d.metadata.nccp_version);assert.match(sources[code].pdf_sha256,/^[0-9a-f]{64}$/);
 assert.deepEqual(selector.phases.map(x=>x.id),Object.keys(visits));
 for(const [visit,level] of Object.entries(visits)){
  const result=risk.get(d,{treatmentPhase:visit});
  assert.equal(result.level,level);assert.equal(result.proformaUrl,'patient/'+code+'/antiemetic-'+visit+'.pdf');
  assert.equal(fs.readFileSync(path.join(root,result.proformaUrl)).subarray(0,5).toString(),'%PDF-');
 }
}
const register=require('../data/clinical-validation-register-v0630.json');
for (const code of Object.keys(expected)) {
  const row=register.protocols.find(p=>p.nccp_code===code), protocol=get(code);
  assert.equal(row.input_count,Object.keys(protocol.input_definitions).length);
  assert.equal(row.rule_count,protocol.rule_engine.rules.length);
  assert.equal(row.domain_hints.renal,true);
  assert.equal(row.formal_consultant_reviewed,false);
  assert.equal(row.formal_pharmacy_reviewed,false);
}
const emaVisits=workflow.supportive_phase_selectors['00248'].phases;
for(const id of ['ema','ema2']) assert.equal(emaVisits.find(p=>p.id===id).plan_id,'gtn_ema_multiday');
for (const id of ['ema','ema2']) {
  const page=fs.readFileSync(path.join(root,'patient/00248/support-'+id+'.html'),'utf8');
  assert.match(page,/Continue the same course when you return on day 2/);
  assert.doesNotMatch(page,/counted from this visit/);
}
const lab=require('../js/local-lab-profile');
for (const [field,analyte,uln] of [['alt_ast_uln_multiple','ast',36],['alt_ast_uln_multiple','alt',32],['alp_uln_multiple','alp',115]]) {
  for (const ratio of [2,2.5]) {
    const actual=lab.calculate(field,{[analyte]:ratio*uln},{...lab.read(),[analyte+'Uln']:uln});
    assert.equal(actual.ratio,ratio);
    verify('00248',{treatment_visit:'co',[field]:actual.ratio},'CYC_LIVER',ratio>2);
    verify('00248',{treatment_visit:'ema',[field]:actual.ratio},'CYC_LIVER',false);
  }
}
const emaPlan=workflow.antiemetic_plans.gtn_ema_multiday;
assert(emaPlan.day1.some(m=>m.medicine==='Ondansetron' && /Days 1 and 2/.test(m.timing)));
assert(emaPlan.subsequent.some(m=>m.medicine==='Dexamethasone' && /Days 3 and 4/.test(m.timing)));
const precautions=require('../data/patient-knowledge/00249.json');
assert.equal(precautions.patient_summary.card_cycle_count,3);
assert(precautions.sources.some(s=>s.id==='it_safety'));
for(const code of ['00248','00264']) assert(require('../data/patient-knowledge/'+code+'.json').questions.some(q=>/eight weeks/i.test(q.a)));
const it=get('00249').treatment_phases[0];assert.deepEqual(it.cycles,[1,2,3]);
assert.deepEqual(it.administration.map(r=>[r.drug,r.dose.value,r.route,r.days]),[['methotrexate',12.5,'Intrathecal',[1]],['folinic acid',15,'PO',[2]]]);
const co=get('00248').treatment_phases[1].administration[0];assert.equal(co.drug,'vincristine');assert.equal(co.route,'IV infusion');assert.match(co.note,/2 mg/);
for(const c of ['00248','00264']) assert.match(get(c).treatment_phases[0].administration.find(r=>r.drug==='folinic acid').note,/24 hours after the START/);
assert.deepEqual(get('00266').treatment_phases.map(p=>p.administration.map(r=>[r.drug,r.days[0]])),[[['paclitaxel',1],['cisplatin',1]],[['paclitaxel',15],['etoposide',15]]]);
for(const code of ['00246','00300','00312','00375','00676'])assert(require('../data/patient-knowledge/'+code+'.json').questions.some(q=>q.a===sources[code].retrospective_focus));
console.log(checks+' clinical boundary and visit checks passed. Source identity, indications, routes, timing, rescue, consent resources, phase prescriptions and five retrospective records checked.');
