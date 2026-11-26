'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const engine = require('../js/assessment-engine');
const workflow = require('../js/regimen-workflow-engine-v0750');
const registry = require('../js/patient-asset-registry-v0810');
const root = path.join(__dirname, '..');
const protocol = require('../protocols/gastrointestinal/00344-flot-therapy-14-day.json');
const patient = require('../data/patient-knowledge/00344.json');
const source = require('../validation/flot-v08467/source.json');
const kb = require('../data/regimen-knowledge-flot.json');
function read(file) { return fs.readFileSync(path.join(root,file)); }
assert.equal(crypto.createHash('sha256').update(read('validation/flot-v08467/00344.pdf')).digest('hex'),source.sha256);
assert.deepEqual(protocol.indications.map(i=>i.code),['00344a','00344b']);
assert.equal(engine.assess(protocol,{}).actionType,'incomplete');
let total = 0;
function check(input, id, expected) {
  const result = engine.assess(protocol,input);
  assert.deepEqual(result.errors,[]); assert.deepEqual(result.invalid,[]);
  assert.equal(result.findings.some(f=>f.ruleId===id),expected,JSON.stringify({input,id}));
  total++;
}
for (const [field,threshold] of [['anc_x10e9_l',1],['platelets_x10e9_l',100],['wbc_x10e9_l',3]]) {
  for(const value of [threshold-.1,threshold,threshold+.1]) check({[field]:value},'FLOT_COUNT_'+field,value<threshold);
}
for(const [value,low,equal] of [[29.9,true,false],[30,false,true],[30.1,false,false]]) {
  check({creatinine_clearance_ml_min:value},'FLOT_RENAL',low);
  check({creatinine_clearance_ml_min:value},'FLOT_RENAL_EQUAL',equal);
}
for (const [field,limit] of [['ast_u_l',180],['bilirubin_umol_l',85]]) {
  for(const v of [limit-.1,limit,limit+.1]) {
    check({[field]:v},'FLOT_FU_'+field+'STOP',v>limit);
    check({[field]:v},'FLOT_FU_'+field+'EQUAL',v===limit);
  }
}
for(const [bilirubin,alp,ast,alt,stop] of [[1.1,6,3.5,3.5,false],[1.1,6.1,1,1,true],[1,6.1,4,4,false],[1.1,5,3.6,3.5,false],[1.1,5,3.6,3.6,true]]) {
  check({bilirubin_uln_multiple:bilirubin,alkaline_phosphatase_multiple:alp,ast_uln_multiple:ast,alt_uln_multiple:alt},'FLOT_DOC_LIVER_STOP',stop);
}
for(const h of ['first','second','persistent']) {
  check({neuropathy_grade:3,g3_neuropathy_history:h},'FLOT_G3_'+h,true);
  check({neuropathy_grade:2,g3_neuropathy_history:h},'FLOT_G3_'+h,false);
}
check({neuropathy_grade:3},'FLOT_G3_None',true);
check({neuropathy_grade:4},'FLOT_NEURO_G4',true);
for(const h of ['first','second']) {
  check({other_nonhaem_toxicity_grade:2,nonhaem_episode:h},'FLOT_OTHER_'+h,false);
  check({other_nonhaem_toxicity_grade:3,nonhaem_episode:h},'FLOT_OTHER_'+h,true);
}
for(const h of ['first','second_gcsf','further']) check({fn_history:h},'FLOT_FN_'+h,true);
for(const [key,id] of [['bleeding_thrombocytopenia','FLOT_BLEED'],['brivudine_sorivudine','FLOT_BRIV'],['postop_complication','FLOT_POST_RECOVERY'],['severe_hepatic_impairment','FLOT_HEP_EXCLUSION']]) {
  for(const v of [true,false]) check({[key]:v},id,v);
}
for(const v of [5.9,6,8,12,12.1]) {
  check({postop_weeks:v},'FLOT_POST_WINDOW',v<6||v>12);
  check({postop_weeks:v},'FLOT_POST_REVIEW',v>=6&&v<=12);
}
assert.equal(engine.assess(protocol,{postop_complication:true,postop_weeks:8}).actionType,'withhold');
assert.equal(engine.assess(protocol,{dpd_status:'complete',neuropathy_grade:2}).actionType,'contraindicated');
const dose = require('../js/protocol-dose-schedule').buildModel(protocol).phases[0];
assert.equal(dose.components.length,4); assert.equal(dose.cycleLength,14); assert.equal(dose.cycles,8);
const manifest = workflow.buildManifest(protocol,require('../data/regimen-workflow-v0750.json'));
assert.equal(manifest.supportiveCare.risk_level,'moderate');
assert.equal(manifest.supportiveCare.day1.filter(r=>r.medicine==='Dexamethasone').length,1);
assert.match(manifest.supportiveCare.subsequent.find(r=>r.medicine==='Metoclopramide').frequency,/PRN/);
assert.deepEqual(registry.bundleRoutes('00344'),['00344']);
assert.match(kb.regimen_profiles[0].schedule_context,/6–12 weeks/);
const consent = read('patient/00344/consent-form.html').toString();
assert.equal((consent.match(/class="agent"/g)||[]).length,4);
for(const a of patient.agents) assert(consent.includes('<h3>'+a.name+'</h3>'));
for(const file of ['handbook','passport','guide','sactcard','port-pump','consent-form','antiemetic-flot','supportive-care','knowledge','treatment-journey']) {
  const bytes=read('patient/00344/'+file+'.pdf');
  assert.equal(bytes.subarray(0,5).toString(),'%PDF-');
  assert(bytes.equals(read('docs/patient/00344/'+file+'.pdf')));
}
console.log(total+' FLOT boundary checks plus clinical schedule, prescription, consent and patient document checks passed.');

