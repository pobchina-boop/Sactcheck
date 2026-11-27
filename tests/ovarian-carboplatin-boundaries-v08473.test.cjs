'use strict';
const assert = require('node:assert/strict');
const engine = require('../js/assessment-engine');
const protocols = [
  { protocol: require('../protocols/breast/00251-carboplatin-q28d.json'), days: 28, version: 6 },
  { protocol: require('../protocols/breast/00261-carboplatin-q21d.json'), days: 21, version: 7 }
];

// NCCP 00251 v6 and 00261 v7, pages 1–4: interval, treatment setting, Table 1 and renal notes.
let assessments = 0;
for (const { protocol, days, version } of protocols) {
  const code = protocol.metadata.nccp_regimen_code;
  const prefix = 'CARBO' + code + '_';
  function check(inputs, present = [], absent = []) {
    const result = engine.assess(protocol, inputs);
    assert.deepEqual(result.invalid, [], code + ' invalid inputs');
    assert.deepEqual(result.errors, [], code + ' engine errors');
    const ids = result.findings.map(finding => finding.ruleId);
    for (const id of present) assert(ids.includes(prefix + id), code + ' expected ' + id + ' for ' + JSON.stringify(inputs));
    for (const id of absent) assert(!ids.includes(prefix + id), code + ' unexpected ' + id + ' for ' + JSON.stringify(inputs));
    assessments++;
    return result;
  }

  assert.equal(Number(protocol.metadata.nccp_version), version);
  assert.equal(protocol.treatment_phases[0].cycle_length_days, days);
  const letters = {gyn_adjuvant: 'abc', gyn_advanced: 'def', gyn_recurrent: 'ghi', breast_metastatic: 'j'};
  const native = new Map(protocol.indications.map(item => [item.code, item.indication_id]));
  assert.deepEqual(protocol.input_definitions.indication_id.options.map(option => option.value), [...native.values()]);
  for (const [context, eligible] of Object.entries(letters)) {
    for (const letter of eligible) {
      const id = native.get(code + letter);
      assert(id);
      check({indication_id: id}, [], ['INDICATION_CONTEXT_CONFLICT']);
      for (const other of Object.keys(letters)) {
        const mismatch = other !== context;
        const findings = check({indication_id:id, disease_context:other},
          mismatch ? ['INDICATION_CONTEXT_CONFLICT'] : [],
          mismatch ? [] : ['INDICATION_CONTEXT_CONFLICT']).findings;
        if (mismatch) assert.equal(findings.find(f => f.ruleId === prefix + 'INDICATION_CONTEXT_CONFLICT').action.type,'consultant_review');
      }
    }
  }
  check({}, [], ['INDICATION_CONTEXT_CONFLICT']);
  check({planned_interval_days:days}, [], ['WRONG_INTERVAL']);
  check({planned_interval_days:days===21?28:21}, ['WRONG_INTERVAL']);
  check({anc:0.99,platelets:101}, ['ANC_LOW'], ['EXACT_ANC']);
  check({anc:1,platelets:101}, [], ['EXACT_ANC','ANC_LOW']);
  check({anc:1.01,platelets:99.9}, ['PLATELETS_LOW'], ['EXACT_PLATELETS']);
  check({anc:1.01,platelets:100}, [], ['EXACT_PLATELETS','PLATELETS_LOW']);
  check({anc:1,platelets:100}, [], ['EXACT_ANC','ANC_LOW','EXACT_PLATELETS','PLATELETS_LOW']);
  check({anc:1.01,platelets:100.1}, [], ['ANC_LOW','EXACT_ANC','PLATELETS_LOW','EXACT_PLATELETS']);
  for (const [gfr,tag] of [[19.9,'GFR_STOP'],[20,'GFR_STOP'],[20.1,'GFR_EXTREME_CAUTION'],[30,'GFR_EXTREME_CAUTION'],[30.1,'GFR_MYELORISK'],[59.9,'GFR_MYELORISK'],[60,null],[125,null],[125.1,'GFR_CAP']]) {
    const names=['GFR_STOP','GFR_EXTREME_CAUTION','GFR_MYELORISK','GFR_CAP'];
    check({gfr},tag?[tag]:[],names.filter(item=>item!==tag));
  }
  for(const method of ['cockcroft_gault','wright']) {
    check({renal_measure_type:method},['ESTIMATE_AGE_UNKNOWN']);
    check({renal_measure_type:method,creatinine_result_age_hours:48},[],['ESTIMATE_OLD']);
    check({renal_measure_type:method,creatinine_result_age_hours:48.1},['ESTIMATE_OLD']);
  }
  check({renal_measure_type:'indexed_egfr'},['RENAL_METHOD']);
  check({renal_measure_type:'measured',baseline_creatinine:100,current_creatinine:110},[],['ISOTOPE_TREND','ISOTOPE_TREND_MISSING']);
  check({renal_measure_type:'measured',baseline_creatinine:100,current_creatinine:111},['ISOTOPE_TREND']);
  for (const [auc,outside] of [[3.9,true],[4,false],[6,false],[6.1,true]]) {
    check({target_auc:auc},outside?['AUC_OUTSIDE']:[],outside?[]:['AUC_OUTSIDE']);
  }
  check({ecog:3,disease_context:'gyn_advanced',ps3_due_to_advanced_gynaecologic_cancer:true},[],['ECOG3']);
  check({ecog:3,disease_context:'gyn_advanced',ps3_due_to_advanced_gynaecologic_cancer:false},['ECOG3']);
  check({ecog:3,disease_context:'gyn_adjuvant',ps3_due_to_advanced_gynaecologic_cancer:true},['ECOG3']);
  assert.equal(/days 13–15 and day 21/i.test(protocol.monitoring.regular.join(' ')),days===28);
  if(days===21) {
    const hnscc = native.get('00261k');
    const finding = check({indication_id:hnscc,disease_context:'gyn_advanced'}).findings;
    assert(finding.some(f=> f.ruleId==='HN46_CARBO_HN_CONTEXT_CONFLICT'));
    check({indication_id:native.get('00261d'),disease_context:'head_neck'},['INDICATION_CONTEXT_CONFLICT']);
  }
}
console.log(assessments+' ovarian carboplatin indication, schedule, count and renal boundary assessments passed.');
