'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const engine=require('../js/assessment-engine.js');
const validator=require('../js/protocol-validator.js');
const index=read('protocols/index.json').protocols;
const workflow=read('data/regimen-workflow-v0750.json');
const patterns={
 '00235':[['day1','high'],['s1_only','oral_minimal_low']],
 '00239':[['day1','moderate']],
 '00240':[['day1','high'],['day8','low'],['day15','low']],
 '00380':[['day1','high']],
 '00429':[['day1','moderate'],['day8','low'],['day15','low']]
};
let count=0;
for(const [code,visits] of Object.entries(patterns)){
 const protocol=read(index.find(e=>e.path.includes('/'+code+'-')).path);
 const patient=read('data/patient-knowledge/'+code+'.json');
 assert(validator.validate(protocol,{strict:true}).valid,code+' protocol schema');
 assert.deepEqual(patient.prescription_phases.map(p=>[p.id,p.emetogenic_risk]),visits);
 for(const [i,p] of patient.prescription_phases.entries()){
  const choice=workflow.supportive_phase_selectors[code].phases[i];
  assert.equal(choice.id,p.id);
  assert.equal(workflow.antiemetic_plans[choice.plan_id].risk_level,p.emetogenic_risk);
  if(p.id==='day8'||p.id==='day15'){
   assert.deepEqual(p.active_medicines,['Fluorouracil']);
   assert.equal(patient.pump_hours,168);
   assert(!p.medicines.some(m=>['Aprepitant','Olanzapine','Dexamethasone'].includes(m.name)));
  }
 }
 for(const [status,expect] of [['complete','DPD_COMPLETE_DEFICIENCY'],['partial','DPD_PARTIAL_DEFICIENCY'],['unknown','DPD_UNKNOWN']]){
  assert(engine.assess(protocol,{dpd_status:status},{profileId:'default'}).findings.some(f=>f.ruleId===expect),code+' '+status);
  count++;
 }
 if(code!=='00235')continue;
 const refs=read('data/regimen-knowledge-gi-v08477.json').regimen_profiles.find(r=>r.protocol_id===protocol.protocol_id).reference_links;
 assert(refs.some(r=>r.url.includes('ema.europa.eu')));
 for(const a of [undefined,'gt50','30_50','lt30','dialysis'])for(const b of [undefined,'ge60','50_59','40_49','lt40','dialysis']){
  const findings=engine.assess(protocol,{teysuno_renal_band:a,cisplatin_crcl_band:b},{profileId:'default'}).findings;
  const ids=findings.map(f=>f.ruleId);
  assert.equal(ids.includes('S1_DIALYSIS'),a==='dialysis'||b==='dialysis');
  assert.equal(ids.includes('S1_SEVERE_RENAL'),a==='lt30');
  assert.equal(ids.includes('S1_RENAL_PLAN'),a==='30_50'||['50_59','40_49','lt40'].includes(b));
  assert.equal(ids.includes('S1_RENAL_INCOMPLETE'),a===undefined||b===undefined);
  assert(!ids.some(id=>/^OF590_00235_(CIS|TEYSUNO)_/.test(id)));
  if(ids.includes('S1_DIALYSIS'))assert.equal(protocol.rule_engine.rules.find(r=>r.id==='S1_DIALYSIS').action.type,'contraindicated');
  count++;
 }
 for(const f of ['recent_dpd_inhibitor','other_fluoropyrimidine','prior_severe_unexpected_fluoropyrimidine_reaction']){
  for(const value of [false,true]){
   const result=engine.assess(protocol,{[f]:value},{profileId:'default'});
   assert.equal(result.findings.some(x=>x.ruleId==='S1_'+f.toUpperCase()),value);
   count++;
  }
 }
}
console.log('Five GI pathways, ten treatment-visit plans and '+count+' assessment cases passed.');
