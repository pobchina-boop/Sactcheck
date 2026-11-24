'use strict';
const assert = require('node:assert/strict');
const engine = require('../js/assessment-engine.js');
const cases = require('../validation/gynaecology-00862-00929/clinical-cases.json');
const protocols = {
  '00862': require('../protocols/gynaecology/00862-niraparib-tablets-monotherapy.json'),
  '00929': require('../protocols/gynaecology/00929-dostarlimab-paclitaxel-and-carboplatin-therapy.json')
};
for (const [code, protocol] of Object.entries(protocols)) {
  const scenarios = cases.filter(c => c.code === code);
  const ids = new Set(scenarios.map(c => c.rule));
  assert.deepEqual(ids, new Set(protocol.rule_engine.rules.map(r => r.id || r.rule_id)));
  let checks = 0;
  for (const c of scenarios) {
    for (const [kind, input] of Object.entries({trigger:c.trigger, control:c.control})) {
      const a = engine.assess(protocol, input);
      const label = code + ' ' + c.rule + ' ' + kind;
      assert.deepEqual(a.errors, [], label);
      assert.deepEqual(a.invalid, [], label);
      const finding = a.findings.find(f => f.ruleId === c.rule);
      if (kind === 'control') assert.equal(finding, undefined, label);
      else {
        assert.equal(finding?.actionType, c.action, label);
        assert.deepEqual(finding.action.components, c.components, label);
      }
      checks++;
    }
    if (c.trigger.treatment_phase === 'combination') {
      const a = engine.assess(protocol, {...c.trigger, treatment_phase:'maintenance'});
      assert(!a.findings.some(f => f.ruleId === c.rule), c.rule+' on inactive chemotherapy');
      checks++;
    }
  }
  console.log(code + ': '+ids.size+' rules, '+checks+' source cases passed');
}

const comparators = [
  ['lung/00353-osimertinib-monotherapy', 'QTC_CONFIRMED_HIGH', {qtc_second_ecg_gt500:true}, {qtc_second_ecg_gt500:false}, 'withhold_then_reduce', 'osimertinib'],
  ['gastrointestinal/00897-durvalumab-gemcitabine-cisplatin', 'PNEUMONITIS_G2', {pneumonitis_grade:2}, {pneumonitis_grade:1}, 'withhold', 'durvalumab'],
  ['gastrointestinal/00926-tremelimumab-durvalumab', 'PNEUMONITIS_G2', {pneumonitis_grade:2}, {pneumonitis_grade:1}, 'withhold', 'whole_regimen'],
  ['shared/00588-olaparib-tablet-monotherapy', 'HAEM_COUNTS_PROCEED', {anc_x10e9_l:1,platelets_x10e9_l:100}, {anc_x10e9_l:0.99,platelets_x10e9_l:100}, 'proceed', 'olaparib'],
  ['gynaecology/00746-olaparib-tablet-and-bevacizumab-therapy', 'BEV_GRADE4_PROTEINURIA', {grade4_proteinuria:true}, {grade4_proteinuria:false}, 'permanently_discontinue', 'bevacizumab']
];
for (const [file, rule, trigger, control, action, component] of comparators) {
  const protocol = require('../protocols/'+file+'.json');
  const find = input => engine.assess(protocol,input).findings.find(f => f.ruleId === rule);
  const positive = find(trigger);
  assert.equal(positive?.actionType, action, file+' '+rule);
  assert.deepEqual(positive.action.components,[component], file+' active component');
  assert.equal(find(control),undefined, file+' control');
}
console.log('Five retrospective comparators passed ten positive/control cases.');
