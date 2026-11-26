'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const engine = require('../js/assessment-engine');
const registry = require('../js/patient-asset-registry-v0810');
const workflow = require('../js/regimen-workflow-engine-v0750');
const root = path.resolve(__dirname,'..');
const protocols = require('../protocols/index.json').protocols;
const settings = require('../data/regimen-workflow-v0750.json');
const evidence = require('../data/regimen-knowledge-gynae-v08468.json').evidence_records;
const sources = require('../validation/gynae-v08468/sources.json');
const codes = ['00499','00766','00799','00811','00817'];
const protocol = code => require(path.join(root,protocols.find(x=>x.path.includes('/'+code+'-')).path));
let checks = 0;
function check(code,visit,inputs,id,expected=true) {
  const result = engine.assess(protocol(code),{treatment_visit:visit,...inputs});
  assert.deepEqual(result.errors,[]); assert.deepEqual(result.invalid,[]);
  assert.equal(result.findings.some(x=>x.ruleId===id),expected,JSON.stringify({code,visit,inputs,id}));
  checks++;
}
for (const c of ['00811','00817']) {
  for (const [field,lo,edge,hi] of [['anc',0.5,1,1.5],['platelets',50,75,100]]) {
    for(const [v,match] of [[lo-.01,'SEVERE'],[lo,'DELAY'],[edge,'OVERLAP'],[edge+.01,'REVIEW'],[hi,'none']]){
      for(const band of ['SEVERE','DELAY','OVERLAP','REVIEW']) check(c,'combination',{[field]:v},field.toUpperCase()+'_'+band,band===match);
    }
    check(c,'maintenance',{[field]:lo-.01},field.toUpperCase()+'_SEVERE',false);
  }
  check(c,'maintenance',{pneumonitis_grade:2,immune_recurrence:'pneum'},'PNEUM_STOP');
  check(c,'maintenance',{pneumonitis_grade:2,immune_recurrence:'none'},'PNEUM_STOP',false);
  check(c,'maintenance',{diarrhoea_colitis_grade:3,immune_recurrence:'colitis'},'COLITIS_STOP');
  for(const [v,grade,hold,stop] of [[1.5,2,false,false],[1.51,2,true,false],[3,2,true,false],[3.01,3,false,true],[3.01,2,false,false]]){
    check(c,'maintenance',{creatinine_uln_multiple:v,immune_nephritis_grade:grade},'NEPHRITIS_HOLD',hold);
    check(c,'maintenance',{creatinine_uln_multiple:v,immune_nephritis_grade:grade},'NEPHRITIS_STOP',stop);
  }
  check(c,'combination',{alt_ast_uln_multiple:10,bilirubin_uln_multiple:1},'TAXANE_HEPATIC_STOP');
  check(c,'maintenance',{alt_ast_uln_multiple:10,bilirubin_uln_multiple:1},'TAXANE_HEPATIC_STOP',false);
}
for(const c of ['00499','00766','00811','00817'])for(const [v,stop,caution] of [[20,true,false],[20.01,false,true],[30,false,true],[30.01,false,false]]){
 const visit=c==='00499'?'day1':'combination';
 check(c,visit,{gfr_or_crcl_ml_min:v},'CARBO_GFR_STOP',stop);
 check(c,visit,{gfr_or_crcl_ml_min:v},'CARBO_GFR_CAUTION',caution);
 check(c,'maintenance',{gfr_or_crcl_ml_min:v},'CARBO_GFR_CAUTION',false);
}
for(const [anc,platelets,omit,reduce] of [[.49,80,true,false],[.8,49,true,false],[.5,50,false,true],[1,100,false,true],[1.01,100,false,true],[1.01,101,false,false]]){
 check('00499','day8',{anc,platelets},'GEM_DAY8_OMIT',omit);check('00499','day8',{anc,platelets},'GEM_DAY8_75',reduce);
 check('00499','maintenance',{anc,platelets},'GEM_DAY8_OMIT',false);
}
check('00499','day1',{anc:1.5,platelets:100,restart_after_omission:'ordinary'},'DAY1_COUNTS');
check('00499','day1',{anc:1.5,platelets:100,restart_after_omission:'restart'},'DAY1_RESTART',false);
check('00766','combination',{platelets:99},'PLT_DELAY');check('00766','combination',{platelets:100},'PLT_DELAY',false);
check('00766','maintenance',{platelets:99},'PLT_DELAY',false);check('00766','postop',{},'POSTOP_BEV');
check('00799','combination',{hypertension_grade:3,persistent_grade3_htn:false},'BEV_HYPERTENSION_SEVERE',false);
check('00799','combination',{hypertension_grade:3,persistent_grade3_htn:true},'BEV_HYPERTENSION_SEVERE');
for(const c of ['00499','00766','00811']) {
 const v=c==='00499'?'day1':'combination';
 for(const [x,hold,stop] of [[2,false,false],[2.1,true,false],[4,true,false],[4.1,false,true]]){
  check(c,v,{urine_protein_g_24h:x},'BEV_URINE_HOLD',hold);check(c,v,{urine_protein_g_24h:x},'BEV_URINE_STOP',stop);
 }
}
for(const c of ['00766','00799','00811','00817']){
  check(c,'combination',{anc:1.49,first_treatment_assessment:true},'BASELINE_ANC');
  check(c,'combination',{anc:1.5,first_treatment_assessment:true},'BASELINE_ANC',false);
  check(c,'combination',{anc:1.49,first_treatment_assessment:false},'BASELINE_ANC',false);
}
for(const c of ['00811','00817']){
  check(c,'combination',{ecog:'2',first_treatment_assessment:true},'BASELINE_ECOG');
  check(c,'maintenance',{classified_immune_event:'confirmed_skin'},'ICI_CONFIRMED_SKIN');
  check(c,'maintenance',{classified_immune_event:'suspect_skin'},'ICI_CONFIRMED_SKIN',false);
}
let visits=0;
for (const c of Object.keys(sources)){
  const p=protocol(c),profile=require('../data/patient-knowledge/'+c+'.json');
  assert.equal(p.metadata.source_url,sources[c].url);assert.deepEqual(registry.bundleRoutes(c),[c]);
  if(codes.includes(c))assert.equal(evidence.filter(e=>e.protocol_id===p.protocol_id).length,1);
  for(const phase of settings.supportive_phase_selectors[c].phases){
    const model=workflow.buildManifest(p,settings,{},phase.id);
    assert.equal(model.emetogenicRisk?.level??model.supportiveCare.risk_level, settings.antiemetic_plans[phase.plan_id].risk_level);
    const pdf=path.join('patient',c,'antiemetic-'+phase.id+'.pdf');
    assert(fs.readFileSync(path.join(root,pdf)).equals(fs.readFileSync(path.join(root,'docs',pdf))));visits++;
  }
  assert.equal(profile.protocol_id,p.protocol_id);
}
console.log(checks+' clinical boundary checks and '+visits+' prescription visits across ten suites passed.');
