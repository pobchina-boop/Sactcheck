'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const engine = require('../js/assessment-engine');
const validator = require('../js/protocol-validator');
require('../js/emetogenic-risk');
const emetogenicRisk = globalThis.SACTCheckEmetogenicRisk;
const sources = require('../validation/gynae-v08471/new-suite-sources.json');

const dir = path.join(__dirname, '../protocols/gynaecology');
const cases = ['00267', '00301', '00904'];
const protocols = Object.fromEntries(cases.map(code => {
  const files = fs.readdirSync(dir).filter(f => f.startsWith(code + '-'));
  assert.equal(files.length, 1);
  return [code, require(path.join(dir, files[0]))];
}));
let checked = 0;
function verify(code, inputs, id, expected = true) {
  const out = engine.assess(protocols[code], inputs);
  assert.deepEqual(out.invalid, [], code + ': invalid input ' + JSON.stringify(inputs));
  assert.deepEqual(out.errors, []);
  assert.equal(out.findings.some(row => row.ruleId === id), expected,
    JSON.stringify({ code, inputs, id, expected, found: out.findings.map(row => row.ruleId) }));
  checked++;
}
function boundary(code, field, id, points, extra = {}) {
  for (const [v, triggered] of points) verify(code, { ...extra, [field]: v }, id, Boolean(triggered));
}
const pre = { assessment_phase: 'pre_treatment' };
const on = { assessment_phase: 'on_treatment' };
for (const code of cases) {
  const p = protocols[code];
  assert.deepEqual(validator.formatIssues(validator.validate(p)), []);
  const visit = engine.getInputDefinitions(p).find(field => field.id === 'treatment_visit');
  assert.equal(visit?.ui_section, 'treatment_context', code + ': visit selector visible on form');
  assert.deepEqual(visit.options.map(option => option.value), p.treatment_phases.map(phase => phase.phase_id));
  assert.equal(p.metadata.source_url, sources[code].url);
  assert.equal(p.metadata.nccp_version, sources[code].version);
  assert.match(sources[code].pdf_sha256, /^[0-9a-f]{64}$/);
  for (const phase of [undefined, 'unrecognised', ...visit.options.map(option => option.value)]) {
    const known = visit.options.some(option => option.value === phase);
    const result = emetogenicRisk.get(p, { treatmentPhase: phase });
    const file = known ? 'antiemetic-' + phase + '.pdf' : 'antiemetic-prescriptions.html';
    assert.equal(result.proformaUrl, 'patient/' + code + '/' + file);
    assert.equal(result.level, code === '00904' ? 'oral_moderate_high' : 'high');
    if (known) assert.equal(fs.readFileSync(path.join(__dirname, '..', result.proformaUrl)).subarray(0,5).toString(), '%PDF-');
  }
  verify(code, { known_hypersensitivity: true }, 'KNOWN_ALLERGY');
}
for (const [code, days, visits] of [
  ['00267', [1, 2], ['day1', 'day2']], ['00301', [1, 2, 3, 4, 5], ['day1', 'days2to5']]
]) {
  const p = protocols[code], phases = p.treatment_phases;
  assert.deepEqual(phases.map(row => row.phase_id), visits);
  assert.deepEqual(phases.flatMap(row => row.administration[0].days), days);
  for (const phase of phases) {
    assert.deepEqual(phase.administration.map(a => [a.drug, a.dose.value, a.dose.unit]),
      [['etoposide', 100, 'mg/m²'], ['cisplatin', 20, 'mg/m²']]);
    assert.deepEqual(phase.administration[0].days, phase.administration[1].days);
    assert.equal(p.supportive_care.phase_profiles[phase.phase_id].level, 'high');
  }
  for (const v of visits) {
    verify(code, { ...pre, treatment_visit: v, neuropathy_grade: 2 }, 'ENTRY_NEURO');
    verify(code, { ...pre, treatment_visit: v, neuropathy_grade: 1 }, 'ENTRY_NEURO', false);
    verify(code, { ...on, treatment_visit: v, neuropathy_grade: 2 }, 'ENTRY_NEURO', false);
    verify(code, { ...on, treatment_visit: v, neuropathy_grade: 2 }, 'NEW_NEURO');
    verify(code, { treatment_visit: v, major_hearing_symptoms: true }, 'HEARING');
    verify(code, { treatment_visit: v, hydration_ready: false }, 'HYDRATE');
  }
}
assert.deepEqual(protocols['00301'].indications.map(i => i.code), ['00301a']);
assert.deepEqual(protocols['00904'].indications.map(i => i.code), ['00904a', '00904b', '00904c']);
assert.equal(protocols['00904'].treatment_phases[0].administration[0].dose.value, 600);
const schedule = require('../js/protocol-dose-schedule');
for (const code of cases) {
  const model = schedule.buildModel(protocols[code]);
  assert.deepEqual(model.allPhases.map(phase => phase.label),
    protocols[code].input_definitions.treatment_visit.options.map(option => option.label));
  assert(model.allPhases.every(phase => phase.complete && phase.duration));
}
const oralSchedule = schedule.buildModel(protocols['00904']);
assert.equal(oralSchedule.allPhases[0].components[0].route, 'Oral');
assert.deepEqual(oralSchedule.doseLevels[0].levels.map(level => [level.key, level.dose]),
  [['0','600 mg twice daily'],['-1','500 mg twice daily'],['-2','400 mg twice daily'],['-3','300 mg twice daily']]);
assert.equal(protocols['00904'].supportive_care.phase_profiles.daily.level, 'oral_moderate_high');

// Two-day emergency GTN induction. Source pp1–2: separate entry and later renal rules.
const g = '00267';
boundary(g, 'crcl_ml_min', 'ENTRY_RENAL', [[59.99,1],[60,0]], pre);
boundary(g, 'crcl_ml_min', 'CIS_RENAL75', [[44.99,0],[45,1],[59,1],[59.01,0]], on);
boundary(g, 'crcl_ml_min', 'CIS_GAP', [[59,0],[59.001,1],[60,1],[60.01,0]], on);
boundary(g, 'crcl_ml_min', 'CIS_ALTERNATIVE', [[44.99,1],[45,0]], on);
verify(g, { crcl_ml_min: 55 }, 'RENAL_PHASE');
verify(g, { ...pre, crcl_ml_min: 55 }, 'CIS_RENAL75', false);
boundary(g, 'crcl_ml_min', 'ETO_RENAL75', [[14.99,0],[15,1],[50,1],[50.01,0]]);
boundary(g, 'crcl_ml_min', 'ETO_RENAL50', [[14.99,1],[15,0]]);
boundary(g, 'bilirubin_umol_l', 'ETO_LIVER50', [[25.9,0],[26,1],[51,1],[51.1,0]]);
boundary(g, 'ast_u_l', 'ETO_LIVER50', [[59.9,0],[60,1],[180,1],[180.1,0]]);
verify(g, { ast_u_l: 181, bilirubin_umol_l: 30 }, 'ETO_LIVER50', false);
verify(g, { ast_u_l: 181, bilirubin_umol_l: 30 }, 'ETO_LIVER_REVIEW');
boundary(g, 'anc', 'COUNTS', [[0.99,1],[1,0],[1.01,0]]);
boundary(g, 'platelets', 'COUNTS', [[74.99,1],[75,1],[75.01,0]]);
boundary(g, 'cycle_number', 'CYCLE3_CRCL', [[2,0],[3,1],[4,0]]);
verify(g, {cycle_number:4}, 'PLAN_TRANSITION');
verify(g, {severe_hepatic_disease:true}, 'SEVERE_LIVER');
verify(g, {serum_hcg_trend:'rising'}, 'HCG');
assert(!('folinic_acid_rescue_confirmed' in protocols[g].input_definitions));

// Five-day germ-cell regimen: preserve curative dose intensity, including the renal footnote.
const e = '00301';
boundary(e, 'ecog','ECOG',[[2,0],[3,0],[4,1]]);
boundary(e,'crcl_ml_min','ENTRY_RENAL',[[39.99,1],[40,0]],pre);
boundary(e,'crcl_ml_min','CIS_LT40',[[39.99,1],[40,0]],on);
boundary(e,'crcl_ml_min','CIS_40_49',[[39.99,0],[40,1],[49,1],[49.99,0]]);
boundary(e,'crcl_ml_min','CIS_50_59',[[49.99,0],[50,1],[59,1],[59.99,0],[60,0]]);
boundary(e,'crcl_ml_min','CIS_GAP',[[49,0],[49.99,1],[50,0],[59,0],[59.9,1],[60,0]]);
boundary(e,'crcl_ml_min','ETO_10_50',[[9.99,0],[10,1],[50,1],[50.01,0]]);
for (const id of ['CIS_LT40','ETO_LT10']) verify(e, {...on,haemodialysis:true,crcl_ml_min:5},id,false);
verify(e,{haemodialysis:true},'DIALYSIS');
boundary(e,'bilirubin_umol_l','ETO_HEP',[[49.9,0],[50,1]]);
verify(e,{albumin_low:true,bilirubin_umol_l:8},'ETO_HEP');
boundary(e,'cycle_number','SECONDARY_GCSF',[[1,0],[2,1],[3,1]],{prior_febrile_neutropenia:true});
verify(e,{cycle_number:2,day5_recovery_failure:true},'SECONDARY_GCSF');
verify(e,{cycle_number:2,day5_recovery_failure:false,prior_febrile_neutropenia:false},'SECONDARY_GCSF',false);
for (const counts of [{anc:0.9},{platelets:70}]) {
  verify(e,counts,'INTENSITY');
  assert(!engine.assess(protocols[e],counts).findings.some(f=>['delay','withhold','dose_reduce'].includes(f.actionType)));
}

// First-line rucaparib maintenance; separate interruption and recovery thresholds.
const r = '00904';
boundary(r,'weeks_since_platinum','FIRST_LINE_WINDOW',[[7.99,0],[8,0],[8.01,1]]);
boundary(r,'months_of_maintenance','MAX_DURATION',[[23.99,0],[24,1]]);
boundary(r,'crcl_ml_min','RENAL_HIGH_RISK',[[29.99,1],[30,0]]);
boundary(r,'ecog','ECOG',[[1,0],[2,1]]);
boundary(r,'anc','COUNTS_INTERRUPT',[[0.99,1],[1,0]]);
boundary(r,'hb_g_dl','COUNTS_INTERRUPT',[[7.99,1],[8,0]]);
boundary(r,'platelets','COUNTS_INTERRUPT',[[99.99,1],[100,0]]);
const recovered={held_for_counts:true,anc:1.5,hb_g_dl:9,platelets:100};
for (const dose of [600,500,400]) {
  verify(r,{...recovered,dose_mg_bid:dose},'COUNTS_RESTART_'+dose);
  for(const field of ['anc','hb_g_dl','platelets']){
    const below={...recovered,dose_mg_bid:dose,[field]:recovered[field]-0.01};
    verify(r,below,'COUNTS_RESTART_'+dose,false);
    verify(r,below,'COUNTS_HELD');
    delete below[field];
    verify(r,below,'COUNTS_INCOMPLETE');
    verify(r,below,'COUNTS_RESTART_'+dose,false);
  }
}
verify(r,{...recovered,dose_mg_bid:300},'NO_LOWER_LEVEL');
verify(r,recovered,'UNKNOWN_LEVEL');
boundary(r,'weeks_held','COUNTS_4W',[[3.99,0],[4,1],[4.01,1]],{...recovered,anc:1.49});
verify(r,{...recovered,weeks_held:4},'COUNTS_4W',false);
verify(r,{mds_aml_status:'suspected'},'MDS_SUSPECT');
verify(r,{mds_aml_status:'suspected'},'MDS_CONFIRMED',false);
verify(r,{mds_aml_status:'confirmed'},'MDS_CONFIRMED');
const lab = require('../js/local-lab-profile');
const limits = {...lab.read(),bilirubinUln:20,alpUln:100};
function actualLiver(bilirubin,alp,settings = limits) {
  return {
    bilirubin_uln_multiple: lab.calculate('bilirubin_uln_multiple',{bilirubin},settings)?.ratio,
    alp_uln_multiple: lab.calculate('alp_uln_multiple',{alp},settings)?.ratio
  };
}
const liver={transaminase_grade:3,other_liver_dysfunction:false,transaminase_course:'monitoring',
  ...actualLiver(19.99,299.99)};
verify(r,liver,'LFT_G3_WEEKLY');
for (const changes of [actualLiver(20,299.99),actualLiver(19.99,300),{other_liver_dysfunction:true},
  actualLiver('',299.99),actualLiver(19.99,''),{transaminase_course:''}]) {
  verify(r,{...liver,...changes},'LFT_G3_REVIEW');
  verify(r,{...liver,...changes},'LFT_G3_WEEKLY',false);
}
const missingAlpLimit = engine.assess(protocols[r],{...liver,...actualLiver(19.99,299.99,{...limits,alpUln:null})});
assert(missingAlpLimit.invalid.some(item => item.id === 'alp_uln_multiple'));
assert(!missingAlpLimit.findings.some(item => item.ruleId === 'LFT_G3_WEEKLY'));
verify(r,{...liver,transaminase_course:'not_declining_2w'},'LFT_G3_FAILTREND');
verify(r,{...liver,transaminase_course:'not_declining_2w'},'LFT_G3_WEEKLY',false);
boundary(r,'transaminase_grade','LFT_G4',[[3,0],[4,1]]);
boundary(r,'transaminase_grade','LFT_RECOVERY_4',[[1,1],[2,1],[3,0]],{previous_transaminase_grade:4});
verify(r,{non_haematological_toxicity_grade:3,symptoms_controlled:true},'OTHER_G3',false);
verify(r,{non_haematological_toxicity_grade:3,symptoms_controlled:false},'OTHER_G3');
function doseRows(code, inputs) {
  return schedule.buildModificationModel(protocols[code], engine.assess(protocols[code], inputs)).rows;
}
const epRenal = {treatment_visit:'day1',assessment_phase:'on_treatment',crcl_ml_min:47};
const epUnspecified = doseRows(e,epRenal);
assert.equal(epUnspecified.find(row => row.componentId === 'etoposide').quantified,false);
assert.equal(epUnspecified.find(row => row.componentId === 'cisplatin').quantified,false);
const individual = doseRows(e,{...epRenal,original_etoposide_mg_m2:80});
assert.equal(individual.find(row => row.componentId === 'etoposide').protocolDose,'60 mg/m²');
for (const [dose,next] of [[600,500],[500,400],[400,300]]) {
  const result = doseRows(r,{...recovered,treatment_visit:'daily',dose_mg_bid:dose});
  assert.equal(result.find(item => item.componentId === 'rucaparib').protocolDose,next+' mg twice daily');
}
for (const mds of ['suspected','confirmed']) {
  const row = doseRows(r,{...recovered,dose_mg_bid:500,mds_aml_status:mds})[0];
  assert.equal(row.ruleId,mds==='confirmed'?'MDS_CONFIRMED':'MDS_SUSPECT');
}
console.log(checked+' source-boundary, decision and visit checks passed for the two EP schedules and first-line rucaparib maintenance.');
