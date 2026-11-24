'use strict';
const assert = require('node:assert/strict');
const engine = require('../js/assessment-engine.js');
const combination = require('../protocols/gynaecology/00929-dostarlimab-paclitaxel-and-carboplatin-therapy.json');
const oral = require('../protocols/gynaecology/00862-niraparib-tablets-monotherapy.json');
let cases = 0;
function check(protocol, inputs, rule, components) {
  const result = engine.assess(protocol, inputs);
  assert.deepEqual(result.errors, []);
  const finding = result.findings.find(f => f.ruleId === rule);
  if (components) assert.deepEqual(finding?.action.components, components, JSON.stringify(inputs) + ' ' + rule);
  else assert.equal(finding, undefined, JSON.stringify(inputs) + ' ' + rule);
  cases++;
}
const chemo = ['paclitaxel', 'carboplatin'];
const ici = ['dostarlimab'];
const niraparib = ['niraparib'];
for (const [count, rule] of [[49,'SEVERE_CYTOPENIA'], [50,'PLT_LT100'], [75,'PLT_LT100'], [99,'PLT_LT100']]) {
  check(combination, {treatment_phase:'combination', platelets:count}, rule, chemo);
  check(combination, {treatment_phase:'maintenance', platelets:count}, rule);
}
check(combination, {platelets:90}, 'REVIEW_PHASE', ['whole_regimen']);
check(combination, {treatment_phase:'combination',platelets:100}, 'PLT_LT100');
for (const [value, rule] of [[0.49,'SEVERE_CYTOPENIA'], [0.5,'ANC_LT1'], [0.99,'ANC_LT1']]) {
  check(combination, {treatment_phase:'combination',anc:value}, rule, chemo);
}
check(combination, {treatment_phase:'combination',anc:1}, 'ANC_LT1');
check(combination, {starting_first_cycle:true,anc:1.49}, 'FIRST_DOSE_ANC', ['whole_regimen']);
check(combination, {starting_first_cycle:true,anc:1.5}, 'FIRST_DOSE_ANC');
for (const [gfr, rule] of [[20,'CARBO_GFR_20'],[21,'CARBO_GFR_LOW'],[30,'CARBO_GFR_LOW']]) {
  check(combination, {treatment_phase:'combination',gfr_or_crcl_ml_min:gfr}, rule,['carboplatin']);
  check(combination, {treatment_phase:'maintenance',gfr_or_crcl_ml_min:gfr}, rule);
}
check(combination, {pneumonitis_grade:'2',pneumonitis_recurrence:true}, 'ICI_PNEUM_RECURRENCE', ici);
check(combination, {diarrhoea_colitis_grade:'4'}, 'ICI_COLITIS_G4', ici);
for (const count of [74,75,99]) check(oral,{platelets:count},'PLATELET_HISTORY_UNKNOWN',niraparib);
check(oral,{platelets:100},'PLATELET_HISTORY_UNKNOWN');
check(oral,{platelets:99,platelet_event_occurrence:'first'},'PLATELETS_FIRST_EVENT',niraparib);
check(oral,{platelets:99,platelet_event_occurrence:'second_or_later',current_dose_mg:'100'},'CYTOPENIA_AT_100',niraparib);
check(oral,{weight_kg:76.9,starting_dose_mg:'300'},'STARTING_WEIGHT_LT77',niraparib);
check(oral,{weight_kg:77,starting_dose_mg:'300'},'STARTING_WEIGHT_LT77');
for (const n of [149,150]) {
  check(oral,{weight_kg:77,starting_dose_mg:'300',baseline_platelets:n,indication_id:'first_line_advanced_maintenance'},'STARTING_DOSE_WEIGHT',n<150?niraparib:undefined);
}
check(oral,{uncontrolled_clinically_significant_hypertension:true},'UNCONTROLLED_HYPERTENSION',niraparib);
console.log(cases + ' regimen assessment cases passed.');
