'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../js/assessment-engine.js');
const schedule = require('../js/protocol-dose-schedule.js');
const hcc = require('../protocols/gastrointestinal/00926-tremelimumab-durvalumab.json');
const fortnightly = require('../protocols/lung/00576-durvalumab-monotherapy-10-mg-kg-14-day.json');
const fourWeekly = require('../protocols/lung/00655-durvalumab-maintenance.json');
const knowledge = require('../data/regimen-knowledge-durvalumab-hcc-v08462.json');

function check(protocol, input) {
  const result = engine.assess(protocol, input);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.invalid, []);
  return result;
}
function sourceRuleIds(result) {
  return result.findings.filter(f => !f.domainAssessment).map(f => f.ruleId);
}
function scenario(title, input, expected, excluded = [], expectedAction) {
  test(title, () => {
    const result = check(hcc, input);
    const ids = sourceRuleIds(result);
    for (const id of expected) assert.ok(ids.includes(id), JSON.stringify({input, id, ids}));
    for (const id of excluded) assert.ok(!ids.includes(id), JSON.stringify({input, id, ids}));
    if (expectedAction) assert.equal(result.actionType, expectedAction);
  });
}
const stop = 'permanently_discontinue';
const hold = 'withhold';
const review = 'consultant_review';
const assumedHepatitis = {immune_hepatitis_assessed: true, cycle_number: 1};
const normal = {...assumedHepatitis, alt_baseline_uln: 1, ast_baseline_uln: 1};
const abnormal = {...assumedHepatitis, alt_baseline_uln: 2, ast_baseline_uln: 1};
const alt = (context, current, extra = {}) => ({...context, alt_current_uln: current, ...extra});
const bilirubin = (value, cause) => ({bilirubin_uln_multiple: value, ...(cause ? {bilirubin_alternative_cause: cause} : {})});

test('Current HCC source and reference profile have the same identity and appropriate clinical review status', () => {
  assert.equal(hcc.protocol_id, 'nccp-00926-v1');
  assert.equal(knowledge.regimen_profiles[0].protocol_id, hcc.protocol_id);
  assert.equal(hcc.metadata.validation.clinical_use_authorised, false);
  assert.equal(check(hcc, {}).actionType, 'incomplete');
  for (const rule of hcc.rule_engine.rules) {
    assert.equal(rule.source.url, hcc.metadata.source_url);
    assert.ok(rule.source.page >= 1 && rule.source.page <= 9);
  }
});
test('Lung consolidation 42-day rule and progression findings do not apply in HCC', () => {
  for (const protocol of [fortnightly, fourWeekly]) {
    assert.ok(!sourceRuleIds(check(protocol, {days_since_chemoradiotherapy: 42})).includes('CRT_START_WINDOW'));
    assert.ok(sourceRuleIds(check(protocol, {days_since_chemoradiotherapy: 43})).includes('CRT_START_WINDOW'));
    assert.ok(sourceRuleIds(check(protocol, {disease_progressed_after_crt: true})).includes('DISEASE_PROGRESSION_AFTER_CRT'));
    for (const [field, grade, expected] of [['pneumonitis_grade',2,hold],['pneumonitis_grade',3,stop],['pneumonitis_grade',4,stop],['diarrhoea_colitis_grade',2,hold],['diarrhoea_colitis_grade',4,stop]]) {
      assert.equal(check(protocol, {[field]: grade}).actionType, expected);
    }
  }
  assert.deepEqual(sourceRuleIds(check(hcc, {days_since_chemoradiotherapy: 43, disease_progressed_after_crt: true})), []);
  assert.equal(check(hcc, {days_since_chemoradiotherapy: 43}).actionType, 'incomplete');
  assert.deepEqual(hcc.input_definitions.indication_id.options, [{value:'00926a',label:hcc.metadata.indication}]);
  assert.doesNotMatch(JSON.stringify(hcc), /00655a|NSCLC|chemoradiotherapy/i);
  assert.equal(hcc.input_definitions.days_since_chemoradiotherapy, undefined);
  assert.equal(hcc.input_definitions.disease_progressed_after_crt, undefined);
});
scenario('Child–Pugh B7, BCLC B and ECOG 2 are within the source range', {child_pugh_class:'B7',bclc_stage:'B',ecog_placeholder:2}, [], ['CHILD_PUGH_OUTSIDE_SOURCE','BCLC_OUTSIDE_SOURCE','ECOG_OUTSIDE_SOURCE']);
scenario('Outside HCC eligibility requires prescriber review', {child_pugh_class:'other',bclc_stage:'other',ecog_placeholder:3,hcc_eligible_setting:false}, ['CHILD_PUGH_OUTSIDE_SOURCE','BCLC_OUTSIDE_SOURCE','ECOG_OUTSIDE_SOURCE','HCC_SETTING'], [], review);
scenario('40 kg single priming weight boundary', {weight_kg:40,cycle_number:1}, ['TREMELIMUMAB_LOW_WEIGHT'], ['LOW_BODY_WEIGHT_SCHEDULE']);
scenario('Above 40 kg neither exception applies',{weight_kg:40.01,cycle_number:1}, [], ['TREMELIMUMAB_LOW_WEIGHT','LOW_BODY_WEIGHT_SCHEDULE']);
scenario('At 30 kg both weight exceptions apply in cycle 1',{weight_kg:30,cycle_number:1}, ['TREMELIMUMAB_LOW_WEIGHT','LOW_BODY_WEIGHT_SCHEDULE']);
scenario('At 30.01 kg only the priming exception applies',{weight_kg:30.01,cycle_number:1}, ['TREMELIMUMAB_LOW_WEIGHT'], ['LOW_BODY_WEIGHT_SCHEDULE']);
test('Dose table shows both weight-based exceptions in the reference printed alongside an action', () => {
  const r = check(hcc, {cycle_number:1,weight_kg:30});
  const rows = Object.fromEntries(schedule.buildModificationModel(hcc,r).rows.map(row => [row.component,row.startingDose]));
  assert.match(rows.Tremelimumab,/4 mg\/kg at or below 40 kg/);
  assert.match(rows.Durvalumab,/20 mg\/kg at or below 30 kg/);
});
scenario('At cycle 14 durvalumab continues alone',{weight_kg:30,cycle_number:14}, ['LOW_BODY_WEIGHT_SCHEDULE'], ['TREMELIMUMAB_LOW_WEIGHT']);
scenario('Grade 2 immune colitis interrupts scheduled treatment',{diarrhoea_colitis_grade:2},['COLITIS_G2_G3'],['COLITIS_G3_COMPONENTS'],hold);
scenario('Grade 4 immune colitis stops scheduled treatment',{diarrhoea_colitis_grade:4},['COLITIS_G4'],[],stop);
for (const trigger of [
  {diarrhoea_colitis_grade:3}, alt(normal,6), alt(abnormal,12), alt(abnormal,6,bilirubin(1.8,'no'))
]) {
  test('Split clinical action follows scheduled components for '+JSON.stringify(trigger), () => {
    for (const cycle of [1,2,20]) {
      const result = check(hcc, {...trigger,cycle_number:cycle});
      assert.equal(result.actionType,hold);
      const rows = schedule.buildModificationModel(hcc,result).rows;
      assert.deepEqual(Object.fromEntries(rows.map(row => [row.component, row.actionType])),
        cycle === 1 ? {Tremelimumab:stop,Durvalumab:hold} : {Durvalumab:hold});
      if (cycle===1) assert.equal(rows.find(r=>r.component==='Tremelimumab').actionLabel,'Permanently discontinue');
    }
  });
}
scenario('Normal baseline transaminase 3 exactly',alt(normal,3),[],['HEPATITIS_WITHHOLD','HEP_NORMAL_MIXED','HEP_NORMAL_STOP']);
scenario('Normal baseline transaminase 3.01',alt(normal,3.01),['HEPATITIS_WITHHOLD'],[],hold);
scenario('Normal baseline transaminase 5 exactly',alt(normal,5),['HEPATITIS_WITHHOLD'],['HEP_NORMAL_MIXED'],hold);
scenario('Normal baseline transaminase 5.01',alt(normal,5.01),['HEP_NORMAL_MIXED'],[],hold);
scenario('Normal baseline transaminase 10 exactly',alt(normal,10),['HEP_NORMAL_MIXED'],['HEP_NORMAL_STOP'],hold);
scenario('Normal baseline transaminase 10.01',alt(normal,10.01),['HEP_NORMAL_STOP'],[],stop);
scenario('Concomitant high ALT and bilirubin without competing cause',alt(normal,6,bilirubin(2.5,'no')),['HEP_NORMAL_STOP'],[],stop);
scenario('Concomitant ALT and bilirubin with competing cause follows the enzyme',alt(normal,6,bilirubin(3.2,'yes')),['HEP_NORMAL_MIXED'],['HEPATITIS_PERMANENT','HEP_NORMAL_STOP'],hold);
scenario('Uncertain cause of concomitant elevations requires review alongside independent enzyme hold',alt(normal,4,bilirubin(3.2)),['HEP_CONCURRENT_CAUSE','HEPATITIS_WITHHOLD'],['HEP_NORMAL_STOP','HEPATITIS_PERMANENT'],hold);
scenario('Bilirubin independently exceeds 3 times ULN',{...normal,...bilirubin(3.01)},['HEPATITIS_PERMANENT'],[],stop);
scenario('Abnormal baseline at 2.5-fold without bilirubin trigger',alt(abnormal,5,bilirubin(1)),[],['HEP_ABNORMAL_HOLD','HEP_ABNORMAL_MIXED','HEP_ABNORMAL_STOP']);
scenario('Abnormal baseline just beyond 2.5-fold',alt(abnormal,5.02),['HEP_ABNORMAL_HOLD'],['HEP_ABNORMAL_MIXED'],hold);
scenario('Abnormal baseline exactly five-fold',alt(abnormal,10),['HEP_ABNORMAL_HOLD'],['HEP_ABNORMAL_MIXED'],hold);
scenario('Abnormal baseline over five-fold',alt(abnormal,10.02),['HEP_ABNORMAL_MIXED'],['HEP_NORMAL_STOP'],hold);
scenario('Abnormal baseline exactly seven-fold',alt(abnormal,14),['HEP_ABNORMAL_MIXED'],['HEP_ABNORMAL_STOP'],hold);
scenario('Abnormal baseline beyond seven-fold',alt(abnormal,14.02),['HEP_ABNORMAL_STOP'],[],stop);
scenario('Abnormal baseline exceeds absolute ceiling before seven-fold',alt({...abnormal,alt_baseline_uln:5},20.01),['HEPATITIS_PERMANENT'],[],stop);
scenario('Concurrent abnormal baseline at exactly 2.5-fold with bilirubin >1.5',alt(abnormal,5,bilirubin(1.51,'no')),['HEP_ABNORMAL_MIXED'],[],hold);
scenario('Concurrent abnormal baseline at exactly 1.5 bilirubin',alt(abnormal,5,bilirubin(1.5,'no')),[],['HEP_ABNORMAL_MIXED']);
scenario('Concurrent abnormal baseline at exactly 2 bilirubin',alt(abnormal,5,bilirubin(2,'no')),['HEP_ABNORMAL_UNSPECIFIED'],['HEP_ABNORMAL_MIXED'],review);
scenario('Concurrent abnormal baseline with competing cause',alt(abnormal,6,bilirubin(1.8,'yes')),['HEP_ABNORMAL_HOLD'],['HEP_ABNORMAL_MIXED'],hold);
scenario('When pooled value cannot supply paired change, request specific enzymes',{...abnormal,alt_ast_uln_multiple:6},['HEP_ABNORMAL_PAIRED_ENZYME_REQUIRED'],['HEP_ABNORMAL_MIXED','HEP_NORMAL_MIXED'],review);
scenario('No accidental comparison between one enzyme and the other pretreatment value',{...abnormal,alt_baseline_uln:1,ast_baseline_uln:4,alt_current_uln:2,ast_current_uln:5},[],['HEP_ABNORMAL_HOLD','HEP_ABNORMAL_MIXED','HEP_ABNORMAL_STOP']);
scenario('Missing baseline needs review',alt(assumedHepatitis,6),['HEP_BASELINE_REVIEW'],['HEP_NORMAL_MIXED','HEP_ABNORMAL_MIXED'],review);
scenario('Unclassified extreme liver result urgently referred rather than unconditionally stopped',{alt_current_uln:22,immune_hepatitis_assessed:false},['HEP_CAUSALITY_REVIEW'],['HEPATITIS_PERMANENT'],review);
scenario('Grade two meningitis differs from grade two myasthenia',{neurological_syndrome:'meningitis',neurological_grade:2},['MENINGITIS_G2'],['NEURO_STOP'],hold);
scenario('Grade two myasthenia warrants permanent discontinuation',{neurological_syndrome:'myasthenia',neurological_grade:2},['NEURO_STOP'],[],stop);
scenario('Any confirmed transverse myelitis',{neurological_syndrome:'myelitis',neurological_grade:1},['NEURO_STOP'],[],stop);
scenario('Pooled grade alone needs classification',{serious_neurological_irae_grade:2},['SERIOUS_NEUROLOGICAL_IRAE'],['NEURO_STOP'],review);
scenario('Infection alone requires clinical assessment',{active_infection_requiring_therapy:true,infection_grade:3},['ACTIVE_INFECTION_REQUIRING_THERAPY','INFECTION_G3_G4'],[],review);
scenario('Grade 4 isolated or uncertain laboratory abnormality', {other_nonimmune_toxicity_grade:4,grade4_lab_only:true}, ['NONIMMUNE_G4_LAB_REVIEW'],['NONIMMUNE_G4'],review);
scenario('Grade 4 non-lab toxicity',{other_nonimmune_toxicity_grade:4,grade4_lab_only:false},['NONIMMUNE_G4'],[],stop);
scenario('Myositis unresolved at 30 days overrides generic grade two hold',{myositis_grade:2,myositis_not_recovered_30d:true},['MYOSITIS_FOOTNOTE_F'],[],stop);
scenario('Myositis and respiratory insufficiency stop treatment',{myositis_respiratory_insufficiency:true},['MYOSITIS_FOOTNOTE_F'],[],stop);
scenario('Unqualified recurrent grade three stays with the consultant',{recurrent_grade_3_immune_toxicity:true},['RECURRENT_G3_CONTEXT'],['RECURRENT_G3_IMMUNE'],review);
scenario('Confirmed applicable footnote b on recurrence',{recurrent_grade_3_immune_toxicity:true,recurrent_grade3_stop_applicable:true},['RECURRENT_G3_IMMUNE'],[],stop);
scenario('Recovery criteria at exact boundary require consultant decision',{assessment_type:'restart',weeks_from_hold:12,recovery_grade:1,systemic_steroids_mg_pred:10},['RESTART_CONSULT'],['RESTART_NOT_MET'],review);
scenario('Outside 12 weeks after withholding',{assessment_type:'restart',weeks_from_hold:12.01,recovery_grade:1,systemic_steroids_mg_pred:10},['RESTART_NOT_MET'],[],hold);
scenario('Steroid dose >10 mg excludes routine resumption',{assessment_type:'restart',weeks_from_hold:10,recovery_grade:1,systemic_steroids_mg_pred:10.01},['RESTART_NOT_MET'],[],hold);
scenario('Missing restart context never clears rechallenge',{assessment_type:'restart'},['RESTART_CONSULT'],['RESTART_NOT_MET'],review);
