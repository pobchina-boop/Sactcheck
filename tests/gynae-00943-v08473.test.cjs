'use strict';
const assert = require('node:assert/strict');
const Engine = require('../js/assessment-engine');
const Lab = require('../js/local-lab-profile');
const Validator = require('../js/protocol-validator');
const Schedule = require('../js/protocol-dose-schedule');
const protocol = require('../protocols/gynaecology/00943-pembrolizumab-cisplatin-chemoradiotherapy.json');
const audit = require('../validation/gynae-v08473/00943-source-audit.json');
require('../js/emetogenic-risk');

const cis = ['cisplatin'];
const io = ['pembrolizumab'];
const both = ['pembrolizumab', 'cisplatin'];
const ready = { concurrent_radiation_confirmed: true, hydration_ready: true };
const concurrent = { ...ready, treatment_visit: 'concurrent_day1', cycle_number: 1, day_number: 1 };
const q3 = { treatment_visit: 'pembro_q3w', cycle_number: 3, day_number: 1 };
const q6 = { treatment_visit: 'pembro_q6w', cycle_number: 6, day_number: 1 };
const optional = { ...ready, treatment_visit: 'optional_c2d15', cycle_number: 2, day_number: 15 };
const visitIds = ['concurrent_day1', 'cisplatin_weekly', 'optional_c2d15', 'pembro_q3w', 'pembro_q6w'];
const covered = new Set();
let checks = 0;
function check(inputs, id, action, components) {
  const result = Engine.assess(protocol, inputs);
  const row = result.findings.find(r => r.ruleId === id);
  assert.deepEqual(result.invalid, [], JSON.stringify(inputs));
  assert.deepEqual(result.errors, []);
  assert.equal(row?.actionType, action, JSON.stringify({ inputs, id, action, actual: row?.actionType }));
  if (row) {
    covered.add(id);
    assert.equal(row.source.url, audit.source_url);
    if (components) assert.deepEqual(row.action.components, components, id);
  }
  checks++;
}
function boundary(ctx, field, id, action, components, values) {
  for (const [value, triggered] of values) check({ ...ctx, [field]: value }, id, triggered ? action : undefined, components);
}
assert.deepEqual(Validator.formatIssues(Validator.validate(protocol)), []);
assert.equal(protocol.metadata.nccp_version, audit.version);
assert.equal(protocol.metadata.source_url, audit.source_url);
assert.equal(protocol.indications[0].code, '00943a');
assert.equal(audit.pdf_sha256, 'f9f54f396f64987525fe901a48a9628d95ebeda8f67133e548664a03e05ff148');
assert.equal(protocol.metadata.regimen_card.contexts[0].planned_cycles, 20);
const course = require('../js/regimen-course-metadata').summarise(protocol);
assert.equal(course.complete, true);
assert.equal(course.interval, 'Cycles 1–5 every 21 days, then cycles 6–20 every 42 days');
assert.match(course.duration, /20 cycles.*24 months.*progression or unacceptable toxicity/);
assert.ok(!Object.keys(protocol.input_definitions).some(k => /pd_l1|cps/i.test(k) && !k.includes('prior_')));
assert.deepEqual(Engine.getInputDefinitions(protocol).find(v => v.id === 'treatment_visit').options.map(o => o.value), visitIds);
const model = Schedule.buildModel(protocol);
assert.deepEqual(model.phases.map(p => p.id), visitIds);
assert.deepEqual(model.phases.map(p => p.cycleLength), [21, 21, 21, 21, 42]);
const [combo, weekly, discretionary, shortInterval, longInterval] = protocol.treatment_phases;
assert.deepEqual(combo.administration.map(a => [a.drug, a.dose.value, a.duration_minutes, a.days, a.order]), [
  ['pembrolizumab', 200, 30, [1], 1], ['cisplatin', 40, 60, [1], 2]
]);
assert.deepEqual(weekly.administration.map(a => [a.cycles, a.days]), [[[1, 2], [8]], [[1], [15]]]);
assert.match(model.phases[1].components[1].note, /Cycle 1 only/i);
assert.deepEqual([discretionary.cycles, discretionary.administration[0].days, discretionary.administration[0].optional], [[2], [15], true]);
assert.deepEqual(shortInterval.cycles, [3, 4, 5]);
assert.deepEqual(longInterval.cycles, Array.from({ length: 15 }, (_, i) => i + 6));
assert.deepEqual([shortInterval.administration[0].dose.value, longInterval.administration[0].dose.value], [200, 400]);
for (const [i, phase] of protocol.treatment_phases.entries()) {
  const risk = globalThis.SACTCheckEmetogenicRisk.get(protocol, { treatmentPhase: phase.phase_id });
  assert.equal(risk.level, i < 3 ? 'high' : 'minimal');
  assert.equal(risk.proformaUrl, 'patient/00943/antiemetic-' + phase.phase_id + '.pdf');
}
const entry = { assessment_phase: 'pre_treatment', age_years: 50, figo_2014_stage: 'III', prior_definitive_therapy: false, ecog: 1, organ_function_adequate: true, radiation_plan_confirmed: true };
check(entry, 'ENTRY_INCOMPLETE');
check({ assessment_phase: 'pre_treatment' }, 'ENTRY_INCOMPLETE', 'consultant_review', both);
boundary(entry, 'age_years', 'ADULT', 'consultant_review', both, [[17, true], [18, false]]);
boundary(entry, 'figo_2014_stage', 'FIGO_ELIGIBILITY', 'consultant_review', both, [['III', false], ['IVA', false], ['other', true], ['uncertain', true]]);
check({ ...entry, prior_definitive_therapy: true }, 'PRIOR_DEFINITIVE', 'consultant_review', both);
check({ ...entry, organ_function_adequate: false }, 'ENTRY_ORGAN', 'consultant_review', both);
check({ ...entry, radiation_plan_confirmed: false }, 'RADIATION_PLAN', 'consultant_review', both);
boundary(entry, 'ecog', 'ECOG2_DISCRETION', 'consultant_review', both, [[1, false], [2, true], [3, false]]);
check({ ...entry, ecog: 2, ecog2_consultant_approved: true }, 'ECOG2_DISCRETION');
boundary(entry, 'ecog', 'ECOG_HIGH', 'consultant_review', both, [[2, false], [3, true]]);
for (const f of ['pre_existing_renal_impairment', 'significant_hearing_impairment_or_tinnitus']) {
  check({ ...entry, [f]: true }, 'ENTRY_' + f.toUpperCase(), 'contraindicated', both);
  check({ [f]: true }, 'CHECK_' + f.toUpperCase(), 'consultant_review', cis);
  check({ assessment_phase: 'on_treatment', [f]: true }, 'ENTRY_' + f.toUpperCase());
}
for (const f of ['pregnancy', 'breastfeeding', 'hypersensitivity']) check({ [f]: true }, f.toUpperCase(), 'contraindicated', both);
check({ confirmed_disease_progression: true }, 'PROGRESSION', 'discontinue', both);
check({ initial_progression_clinically_stable: true }, 'INITIAL_PROGRESSION_REVIEW', 'consultant_review', io);
check({ unacceptable_toxicity: true }, 'UNACCEPTABLE_TOXICITY', 'discontinue', both);
boundary(q6, 'cycle_number', 'CYCLE_LIMIT', 'withhold', io, [[20, false], [21, true]]);
boundary(q6, 'treatment_duration_months', 'DURATION_LIMIT', 'withhold', io, [[23.99, false], [24, true], [24.1, true]]);
for (const [id, good, badCycle, badDay] of [
  ['concurrent_day1', concurrent, 3, 8],
  ['cisplatin_weekly', { ...ready, treatment_visit: 'cisplatin_weekly', cycle_number: 1, day_number: 15 }, 3, 1],
  ['optional_c2d15', optional, 1, 8], ['pembro_q3w', q3, 6, 8], ['pembro_q6w', q6, 5, 8]
]) {
  const cycleRule = 'CYCLE_MISMATCH_' + id.toUpperCase(), dayRule = 'DAY_MISMATCH_' + id.toUpperCase();
  check(good, cycleRule); check(good, dayRule);
  check({ ...good, cycle_number: badCycle }, cycleRule, 'withhold');
  check({ ...good, day_number: badDay }, dayRule, 'withhold');
}
check({ treatment_visit: 'cisplatin_weekly', cycle_number: 2, day_number: 15 }, 'DAY_MISMATCH_CISPLATIN_WEEKLY', 'withhold', cis);
check(optional, 'OPTIONAL_APPROVAL', 'withhold', cis);
check({ ...optional, optional_cisplatin_authorised: false }, 'OPTIONAL_APPROVAL', 'withhold', cis);
check({ ...optional, optional_cisplatin_authorised: true }, 'OPTIONAL_APPROVAL');
check({ ...optional, crcl_ml_min: 42 }, 'CIS_RENAL_40_49');
check({ ...optional, optional_cisplatin_authorised: true, crcl_ml_min: 42 }, 'CIS_RENAL_40_49', 'dose_reduce', cis);
for (const v of visitIds) {
  const ctx = { treatment_visit: v };
  const hasCis = visitIds.indexOf(v) < 3;
  check({ ...ctx, concurrent_radiation_confirmed: false }, 'CIS_RT', hasCis ? 'withhold' : undefined, cis);
  check({ ...ctx, hydration_ready: false }, 'CIS_HYDRATE', hasCis ? 'withhold' : undefined, cis);
  check({ ...ctx, anc: 0.99 }, 'CIS_ANC', hasCis ? 'delay' : undefined, cis);
  check({ ...ctx, platelets: 99 }, 'CIS_PLATELETS', hasCis ? 'delay' : undefined, cis);
  check({ ...ctx, anc: 0.99 }, 'PEMBRO_COUNTS_REVIEW', hasCis ? undefined : 'consultant_review', io);
}
boundary(concurrent, 'anc', 'CIS_ANC', 'delay', cis, [[0.99, true], [1, false]]);
boundary(concurrent, 'platelets', 'CIS_PLATELETS', 'delay', cis, [[99.99, true], [100, false]]);
boundary(concurrent, 'crcl_ml_min', 'CIS_LOW_CLEARANCE', 'contraindicated', cis, [[39.99, true], [40, false]]);
boundary(concurrent, 'crcl_ml_min', 'CIS_RENAL_40_49', 'dose_reduce', cis, [[39.99, false], [40, true], [49, true], [49.1, false]]);
boundary(concurrent, 'crcl_ml_min', 'CIS_RENAL_50_59', 'dose_reduce', cis, [[49.9, false], [50, true], [59, true], [59.1, false]]);
boundary(concurrent, 'crcl_ml_min', 'CIS_FRACTION', 'consultant_review', cis, [[49, false], [49.9, true], [50, false], [59, false], [59.1, true], [60, false]]);
for (const value of [40, 50]) {
  const out = Engine.assess(protocol, { ...concurrent, crcl_ml_min: value });
  const byDrug = Schedule.buildModificationModel(protocol, out).rows;
  assert.deepEqual(byDrug.map(r => [r.componentId, r.protocolDose]), [['cisplatin', (value === 40 ? '20' : '30') + ' mg/m²']]);
}
check({ ...concurrent, haemodialysis: true, crcl_ml_min: 12 }, 'CIS_LOW_CLEARANCE');
check({ ...concurrent, haemodialysis: true, crcl_ml_min: 12 }, 'CIS_DIALYSIS', 'consultant_review', cis);
boundary(concurrent, 'peripheral_neuropathy_grade', 'CIS_NEURO_G2', 'dose_reduce', cis, [[1, false], [2, true], [3, false]]);
boundary(concurrent, 'peripheral_neuropathy_grade', 'CIS_NEURO_G3_4', 'omit', cis, [[2, false], [3, true], [4, true]]);
check({ ...concurrent, crcl_ml_min: 43, current_cisplatin_dose_percent: 75 }, 'CIS_DOSE_HISTORY', 'consultant_review', cis);
check({ ...concurrent, crcl_ml_min: 43, peripheral_neuropathy_grade: 2 }, 'CIS_DOSE_HISTORY', 'consultant_review', cis);
check({ ...concurrent, new_or_worsening_hearing_symptoms: true }, 'CIS_NEW_HEARING', 'withhold', cis);
check({ ...concurrent, previous_cisplatin_omitted_for_neuropathy: true }, 'CIS_PREVIOUS_OMIT', 'consultant_review', cis);
check({ febrile_neutropenia: true }, 'CIS_FN', 'withhold', both);
check({ required_tests_missing: true }, 'TESTS_MISSING', 'withhold', both);
check({ crcl_ml_min: 39 }, 'CIS_VISIT_UNKNOWN', 'consultant_review', cis);
check({ ...q3, crcl_ml_min: 39 }, 'CIS_LOW_CLEARANCE');
for (const [f, id] of [
  ['prior_serious_autoimmune_disease', 'AUTOIMMUNE_DISEASE_REVIEW'], ['active_infection_requiring_therapy', 'ACTIVE_INFECTION'],
  ['untreated_brain_metastases', 'BRAIN_METASTASES_REVIEW'], ['prior_interstitial_lung_disease', 'ILD_HISTORY_REVIEW'],
  ['prior_pd1_pdl1_treatment', 'PRIOR_PD1_POLICY'], ['other_immunosuppression', 'OTHER_IMMUNOSUPPRESSION']
]) check({ ...entry, [f]: true }, id, 'consultant_review', io);
boundary(entry, 'systemic_steroids_mg_pred', 'SYSTEMIC_STEROIDS', 'consultant_review', io, [[10, false], [10.1, true]]);
check({ assessment_phase: 'on_treatment', systemic_steroids_mg_pred: 40 }, 'SYSTEMIC_STEROIDS');

const references = { altUln: 40, astUln: 40, bilirubinUln: 20, creatinineUln: 90 };
for (const [analyte, field, attribution, pending, hold, stop, values] of [
  ['alt', 'alt_ast_uln_multiple', 'pembro_immune_hepatitis_assessed', 'LIVER_ATTRIBUTION_REVIEW', 'HEPATITIS_WITHHOLD', 'HEPATITIS_PERMANENT', [[120, null], [121, 'hold'], [200, 'hold'], [201, 'stop']]],
  ['ast', 'alt_ast_uln_multiple', 'pembro_immune_hepatitis_assessed', 'LIVER_ATTRIBUTION_REVIEW', 'HEPATITIS_WITHHOLD', 'HEPATITIS_PERMANENT', [[120, null], [121, 'hold'], [200, 'hold'], [201, 'stop']]],
  ['bilirubin', 'bilirubin_uln_multiple', 'pembro_immune_hepatitis_assessed', 'LIVER_ATTRIBUTION_REVIEW', 'HEPATITIS_WITHHOLD', 'HEPATITIS_PERMANENT', [[30, null], [31, 'hold'], [60, 'hold'], [61, 'stop']]],
  ['creatinine', 'creatinine_ratio_baseline_or_uln', 'pembro_immune_nephritis_assessed', 'RENAL_ATTRIBUTION_REVIEW', 'NEPHRITIS_G2', 'NEPHRITIS_G3_PLUS', [[135, null], [136, 'hold'], [270, 'hold'], [271, 'stop']]]
]) {
  for (const [actual, severity] of values) {
    const definition = { id: field, ...protocol.input_definitions[field] };
    const ratio = Lab.calculate(definition, { [analyte]: actual }, references).ratio;
    for (const visit of [concurrent, q3, q6]) {
      const input = { ...visit, [field]: ratio };
      check(input, pending, severity ? 'withhold' : undefined, io);
      check(input, stop); check(input, hold);
      check({ ...input, [attribution]: true }, hold, severity === 'hold' ? 'withhold' : undefined, io);
      check({ ...input, [attribution]: true }, stop, severity === 'stop' ? 'permanently_discontinue' : undefined, io);
    }
  }
}
for (const [field, id, action, inputs] of [
  ['pneumonitis_grade', 'PNEUMONITIS_G2', 'withhold', [2]], ['pneumonitis_grade', 'PNEUMONITIS_SEVERE_OR_RECURRENT', 'permanently_discontinue', [3, 4]],
  ['recurrent_grade2_pneumonitis', 'PNEUMONITIS_SEVERE_OR_RECURRENT', 'permanently_discontinue', [true]],
  ['diarrhoea_colitis_grade', 'COLITIS_G2_G3', 'withhold', [2, 3]], ['diarrhoea_colitis_grade', 'COLITIS_G4_OR_RECURRENT_G3', 'permanently_discontinue', [4]],
  ['recurrent_grade3_colitis', 'COLITIS_G4_OR_RECURRENT_G3', 'permanently_discontinue', [true]],
  ['scar_status', 'SKIN_WITHHOLD', 'withhold', ['suspected']], ['scar_status', 'SKIN_PERMANENT', 'permanently_discontinue', ['confirmed']],
  ['rash_grade', 'SKIN_WITHHOLD', 'withhold', [3]], ['rash_grade', 'SKIN_PERMANENT', 'permanently_discontinue', [4]],
  ['myocarditis_grade', 'SERIOUS_NEURO_CARDIAC', 'permanently_discontinue', [3, 4]], ['encephalitis_grade', 'SERIOUS_NEURO_CARDIAC', 'permanently_discontinue', [3]],
  ['guillain_barre_grade', 'SERIOUS_NEURO_CARDIAC', 'permanently_discontinue', [3]], ['myocarditis_or_neurological_red_flags', 'SUSPECTED_CARDIAC_NEURO', 'withhold', [true]],
  ['other_immune_toxicity_grade', 'OTHER_IMMUNE_G2_G3', 'withhold', [2, 3]], ['other_immune_toxicity_grade', 'OTHER_IMMUNE_G4_OR_RECURRENT_G3', 'permanently_discontinue', [4]],
  ['infusion_reaction_grade', 'INFUSION_G3_G4', 'permanently_discontinue', [3, 4]], ['endocrine_status', 'ENDOCRINE_WITHHOLD', 'withhold', ['adrenal_g2', 'adrenal_g3plus', 'hyperthyroid_g3plus']],
  ['endocrine_status', 'CONTROLLED_HYPOTHYROIDISM', 'proceed_with_caution', ['hypothyroidism']], ['endocrine_status', 'ENDOCRINE_CONTROLLED_REVIEW', 'consultant_review', ['controlled_after_severe']],
  ['endocrine_status', 'ENDOCRINE_G2_CONTROLLED_REVIEW', 'consultant_review', ['adrenal_g2_controlled']], ['endocrine_status', 'ENDOCRINE_FAILED_CONTROL', 'discontinue', ['failed_control_after_severe']],
  ['type1_diabetes_ketoacidosis', 'TYPE1_KETOACIDOSIS', 'withhold', [true]], ['ici_failed_recovery_12_weeks', 'ICI_12_WEEK_STOP', 'permanently_discontinue', [true]],
  ['ici_steroid_gt10_at_12_weeks', 'ICI_12_WEEK_STOP', 'permanently_discontinue', [true]], ['stable_renal_impairment', 'CHRONIC_RENAL_NO_REDUCTION', 'proceed_with_caution', [true]],
  ['hepatic_impairment', 'CHRONIC_HEPATIC_NO_REDUCTION', 'proceed_with_caution', ['mild', 'moderate', 'severe']],
  ['pembro_prior_permanent_stop', 'PEMBRO_PRIOR_PERMANENT_STOP', 'permanently_discontinue', [true]],
  ['pembro_restart_requested', 'PEMBRO_RESTART_UNCONFIRMED', 'withhold', [true]], ['pembro_restart_requested', 'PEMBRO_RESTART_HISTORY_UNASSESSED', 'withhold', [true]]
]) for (const v of inputs) check({ ...q6, [field]: v }, id, action, io);
boundary({ type1_diabetes: true }, 'glucose_mmol_l', 'TYPE1_HIGH_GLUCOSE', 'withhold', io, [[13.9, false], [13.91, true]]);
check({ glucose_mmol_l: 14 }, 'TYPE1_HIGH_GLUCOSE');
const metastases = { pembro_immune_hepatitis_assessed: true, liver_metastases_baseline_grade2: true };
for (const [percent, days, stop] of [[49.9, 7, false], [50, 6.9, false], [50, 7, true]]) {
  check({ ...metastases, ast_alt_increase_percent: percent, ast_alt_elevation_days: days }, 'LIVER_METS_BASELINE_G2_STOP', stop ? 'permanently_discontinue' : undefined, io);
}
check({ ...metastases, pembro_immune_hepatitis_assessed: false, ast_alt_increase_percent: 60, ast_alt_elevation_days: 8 }, 'LIVER_METS_BASELINE_G2_STOP');
assert.deepEqual(protocol.rule_engine.rules.map(r => r.rule_id).filter(id => !covered.has(id)), []);
console.log('00943a source audit passed: ' + checks + ' assessment assertions, ' + covered.size + ' clinical rules and five treatment visits.');
