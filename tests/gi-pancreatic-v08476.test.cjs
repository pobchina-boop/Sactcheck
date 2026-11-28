'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const Engine = require('../js/assessment-engine.js');
const Validator = require('../js/protocol-validator.js');
const read = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const index = read('protocols/index.json').protocols;
const riskMap = read('data/emetogenic-risk-map.json').protocols;
const workflow = read('data/regimen-workflow-v0750.json').supportive_phase_selectors;
const codes = read('tools/lib/gi-patient-routes-v08476.json');
function protocol(code) {
  return read(index.find(entry => entry.path.includes('/' + code + '-')).path);
}
let cases = 0;
for (const code of codes) {
  const p = protocol(code);
  assert(Validator.validate(p, {strict:true}).valid);
  const template = read('data/patient-knowledge/' + code + '.json');
  const high = ['00329','00515'].includes(code);
  assert.equal(riskMap[code].level, high ? 'high' : 'low');
  for (const [i, phase] of workflow[code].phases.entries()) {
    assert.equal(phase.plan_id, high ? 'high_standard' : 'low');
    assert.equal(phase.id, template.prescription_phases[i].id);
    assert.equal(template.prescription_phases[i].emetogenic_risk,riskMap[code].level);
  }
  if (high) {
    const doses = p.treatment_phases[0].administration;
    assert.equal(doses.some(x => x.drug === 'fluorouracil_bolus'),code === '00329');
    assert.equal(doses.find(x => x.drug === 'irinotecan').dose.value,code === '00329' ? 180 : 150);
    assert.equal(template.pump_hours,46);
    assert.equal(template.cycle_days,14);
  }
}
for (const code of ['00384','00524']) {
  const p = protocol(code);
  assert.equal(Validator.validate(p,{strict:true}).issues?.filter(x=>x.severity==='error').length || 0,0);
  const days = code === '00384' ? ['day1','day8'] : ['day1','day8','day15'];
  assert.deepEqual(p.input_definitions.treatment_day.options.map(x=>x.value),days);
  for (const day of days) {
    for (const anc of [0.49,0.5,0.99,1,1.5]) {
      for (const plt of [49,50,74,75,99,100]) {
        const input = {treatment_day:day,anc_x10e9_l:anc,platelets_x10e9_l:plt};
        const result = Engine.assess(p,input,{profileId:'default'});
        const ids = result.findings.map(x=>x.ruleId).filter(x=>x.startsWith('GEMCAP_'));
        const low = anc<1 || plt<100;
        const severe = anc<0.5 || plt<50;
        const expected = day==='day1' ? (low?['GEMCAP_CYCLE_START']:[]) :
          severe ? ['GEMCAP_WITHIN_CYCLE_OMIT','GEMCAP_WITHIN_CYCLE_INTERRUPT'] :
          low ? ['GEMCAP_WITHIN_CYCLE_INTERMEDIATE'] : [];
        assert.deepEqual(ids.sort(),expected.sort(),code+' '+JSON.stringify(input));
        cases++;
      }
    }
  }
  for(const [input,needed] of [
    [{platelets_x10e9_l:99},'GEMCAP_COUNTS_WITHOUT_DAY'],
    [{treatment_day:'day8',anc_x10e9_l:0.7},'GEMCAP_INCOMPLETE_COUNTS'],
    [{treatment_day:'day8',anc_x10e9_l:0.3},'GEMCAP_WITHIN_CYCLE_OMIT'],
    [{prior_gemcap_haematologic_event:'yes'},'GEMCAP_SUBSEQUENT_CYCLE_HISTORY']
  ]){
    assert(Engine.assess(p,input,{profileId:'default'}).findings.some(x=>x.ruleId===needed));
    cases++;
  }
}
assert.deepEqual(protocol('00384').indications.map(i=>i.indication_id),['00384a','00384b']);
assert(!protocol('00384').indications[1].description.toLowerCase().includes('metastatic'));
console.log('Five GI suites and '+cases+' GemCap assessment scenarios passed.');
