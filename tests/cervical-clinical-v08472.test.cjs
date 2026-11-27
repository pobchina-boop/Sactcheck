'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const engine = require('../js/assessment-engine');
const lab = require('../js/local-lab-profile');
const audit = require('../validation/cervical-v08472/source-audit.json');
const catalogue = require('../protocols/index.json').protocols;

const codes = ['00385', '00419', '00812', '00455', '00558'];
const protocols = {};
for (const code of codes) {
  const rows = catalogue.filter(row => row.id.startsWith('nccp-' + code + '-'));
  assert.equal(rows.length, 1);
  const protocol = require(path.join(__dirname, '..', rows[0].path));
  const source = audit.protocols[code];
  assert.equal(protocol.metadata.nccp_version, source.version);
  assert.equal(protocol.metadata.source_url, source.url);
  for (const indication of source.indications) {
    assert.ok(protocol.indications.some(row => row.code === indication), indication);
  }
  protocols[code] = protocol;
}
for (const source of [...Object.values(audit.protocols), ...Object.values(audit.supporting_sources)]) {
  assert.match(source.pdf_sha256, /^[0-9a-f]{64}$/);
  assert.ok(source.pages > 0 && source.bytes > 1000);
}
assert.deepEqual(Object.keys(audit.supporting_sources).sort(), ['00811', '00817', 'keytruda', 'libtayo', 'prior-pd1']);

let checks = 0;
function verify(code, inputs, ruleId, actionType) {
  const out = engine.assess(protocols[code], inputs);
  assert.deepEqual(out.invalid, [], code + ' ' + JSON.stringify(inputs));
  assert.deepEqual(out.errors, []);
  const finding = out.findings.find(row => row.ruleId === ruleId);
  assert.equal(finding?.actionType, actionType, JSON.stringify({ code, inputs, ruleId, actionType }));
  if (finding) assert.equal(finding.source.url, audit.protocols[code].url);
  checks++;
}
function boundary(code, field, ruleId, actionType, rows, extra = {}) {
  for (const [value, shouldMatch] of rows) {
    verify(code, { ...extra, [field]: value }, ruleId, shouldMatch ? actionType : undefined);
  }
}
function card(code, id) {
  return protocols[code].metadata.regimen_card.contexts.find(row => row.id === id);
}

for (const id of ['00385a', '00385e']) {
  assert.equal(card('00385', id).cycle_length_days, 7);
  assert.equal(card('00385', id).planned_cycles, 5);
  assert.match(card('00385', id).duration_text, /consultant/i);
}
const cisplatin = protocols['00385'].treatment_phases[0].administration[0];
assert.deepEqual([cisplatin.dose.value, cisplatin.dose.unit, cisplatin.day], [40, 'mg/m2', 1]);
assert.equal(protocols['00385'].treatment.infusion_duration_minutes, 60);
verify('00385', { radiotherapy_cancelled_today: true }, 'RT_CANCELLED', 'withhold');
verify('00385', { magnesium_low_or_unreplaced: true }, 'CIS_HYDRATION', 'withhold');
verify('00385', { significant_hearing_impairment_or_tinnitus: true }, 'SIGNIFICANT_HEARING', 'contraindicated');
verify('00385', { pregnancy: true }, 'PREGNANCY', 'contraindicated');
verify('00385', { breastfeeding: true }, 'BREASTFEEDING', 'contraindicated');
verify('00385', { assessment_phase: 'pre_treatment', pre_existing_renal_impairment: true }, 'BASELINE_RENAL_EXCLUSION', 'contraindicated');
verify('00385', { assessment_phase: 'on_treatment', pre_existing_renal_impairment: true }, 'BASELINE_RENAL_EXCLUSION');
boundary('00385', 'anc', 'ANC_LT1', 'delay', [[0.99, true], [1, false]]);
boundary('00385', 'platelets', 'PLT_LT100', 'delay', [[99.99, true], [100, false]]);
boundary('00385', 'crcl_ml_min', 'CRCL_LT40', 'contraindicated', [[39.99, true], [40, false]]);
boundary('00385', 'crcl_ml_min', 'CRCL_40_49', 'dose_reduce', [[39.99, false], [40, true], [49, true], [49.5, false]]);
boundary('00385', 'crcl_ml_min', 'CRCL_50_59', 'dose_reduce', [[49.5, false], [50, true], [59, true], [59.5, false]]);
boundary('00385', 'crcl_ml_min', 'CRCL_PRINTED_GAP', 'consultant_review', [[49, false], [49.5, true], [50, false], [59.5, true], [60, false]]);
verify('00385', { haemodialysis: true, crcl_ml_min: 12 }, 'HAEMODIALYSIS', 'consultant_review');
verify('00385', { haemodialysis: true, crcl_ml_min: 12 }, 'CRCL_LT40');
boundary('00385', 'peripheral_neuropathy_grade', 'NEURO_G2', 'dose_reduce', [[1, false], [2, true], [3, false]]);
boundary('00385', 'peripheral_neuropathy_grade', 'NEURO_G3_4', 'omit', [[2, false], [3, true], [4, true]]);

const cervicalCarboplatin = card('00419', '00419-gyn');
assert.equal(cervicalCarboplatin.intent, 'curative');
assert.deepEqual([cervicalCarboplatin.cycle_length_days, cervicalCarboplatin.planned_cycles], [7, 6]);
assert.doesNotMatch(cervicalCarboplatin.duration_text, /00552|adjuvant/i);
assert.ok(card('00419', '00419-head-neck'));
assert.match(protocols['00419'].treatment.schedule_summary, /AUC 2 IV over 30 minutes/i);
verify('00419', { concurrent_radiotherapy_confirmed: false }, 'HN48_RT_NOT_CONCURRENT', 'withhold');
verify('00419', { radiotherapy_truncated: true }, 'HN48_RT_TRUNCATED', 'discontinue');
boundary('00419', 'cycle_number', 'HN48_COURSE_LIMIT', 'consultant_review', [[6, false], [7, true]]);
const preCarbo = { assessment_phase: 'pre_treatment' };
verify('00419', preCarbo, 'HN48_CISPLATIN_UNSUITABLE', 'consultant_review');
for (const confirmed of [false, true]) {
  verify('00419', { ...preCarbo, cisplatin_contraindicated_or_not_tolerated: confirmed }, 'HN48_CISPLATIN_UNSUITABLE', confirmed ? undefined : 'consultant_review');
}
verify('00419', { carboplatin_hypersensitivity_history: true }, 'CARBO_HSR', 'contraindicated');
boundary('00419', 'gfr_or_crcl_ml_min', 'CARBO_GFR_LE20', 'contraindicated', [[20, true], [20.1, false]]);
boundary('00419', 'gfr_or_crcl_ml_min', 'HN48_CARBO_20_30', 'consultant_review', [[20, false], [20.1, true], [30, true], [30.1, false]]);
boundary('00419', 'gfr_or_crcl_ml_min', 'CARBO_GFR_LOW', 'proceed_with_caution', [[30, false], [30.1, true], [59.9, true], [60, false]]);
boundary('00419', 'gfr_or_crcl_ml_min', 'CARBO_GFR_CAP', 'consultant_review', [[125, false], [125.01, true]]);
boundary('00419', 'creatinine_sample_age_hours', 'CARBO_ESTIMATED_CREATININE', 'withhold', [[48, false], [48.1, true]], { gfr_measurement_method: 'estimated' });
boundary('00419', 'creatinine_percent_isotope_baseline', 'CARBO_ISOTOPE_RECHECK', 'consultant_review', [[110, false], [110.1, true]], { gfr_measurement_method: 'measured' });
boundary('00419', 'anc', 'ANC_LOW', 'delay', [[0.49, true], [0.5, false]]);
boundary('00419', 'anc', 'ANC_INTERMEDIATE', 'delay', [[0.5, true], [0.99, true], [1, false]]);
boundary('00419', 'anc', 'ANC_FRACTION_GAP', 'consultant_review', [[0.99, false], [0.995, true], [1, false]]);
boundary('00419', 'platelets', 'PLT_LOW', 'delay', [[49.9, true], [50, false]]);
boundary('00419', 'platelets', 'PLT_INTERMEDIATE', 'delay', [[50, true], [99, true], [100, false]]);
verify('00419', { platelets: 100, platelet_nadir: 49 }, 'PLT_NADIR_LOW_RECOVERED', 'consultant_review');
verify('00419', { platelets: 99, platelet_nadir: 49 }, 'PLT_NADIR_LOW', 'delay');
verify('00419', { febrile_neutropenia: true }, 'FN', 'delay');

const cervix = { indication_id: '00812-gyn' };
const skin = { indication_id: '00812b' };
const cemi = protocols['00812'];
assert.deepEqual(cemi.treatment.administration[0].days, [1]);
assert.equal(cemi.treatment.administration[0].dose, '350 mg');
assert.match(cemi.treatment.administration[0].note, /30 minutes every 21 days/);
assert.equal(card('00812', '00812-gyn').duration_type, 'until_progression_or_unacceptable_toxicity');
verify('00812', { ...cervix, cervical_progressed_after_platinum: false }, 'CERVICAL_PRIOR_PLATINUM', 'consultant_review');
verify('00812', { ...skin, cervical_progressed_after_platinum: false }, 'CERVICAL_PRIOR_PLATINUM');
const unknownPlatinum = engine.assess(cemi, cervix);
assert.equal(unknownPlatinum.complete, false);
assert.ok(unknownPlatinum.unassessed.some(item => item.id === 'cervical_progressed_after_platinum'));
boundary('00812', 'age_years', 'ADULT_INDICATION', 'consultant_review', [[17, true], [18, false]], cervix);
boundary('00812', 'ecog', 'ECOG_OUTSIDE_RANGE', 'consultant_review', [[2, false], [3, true]], cervix);
for (const [field, id] of [['active_cns_metastases', 'ACTIVE_CNS_METASTASES'], ['active_significant_infection', 'ACTIVE_SIGNIFICANT_INFECTION'], ['pregnancy', 'PREGNANCY_OR_BREASTFEEDING']]) {
  verify('00812', { ...cervix, [field]: true }, id, 'contraindicated');
}
boundary('00812', 'prednisolone_equivalent_mg_day', 'BASELINE_IMMUNOSUPPRESSION', 'contraindicated', [[10, false], [10.1, true]], { ...cervix, assessment_phase: 'baseline' });
verify('00812', { ...cervix, prior_pd1_pdl1: true }, 'PRIOR_PD1_PDL1', 'consultant_review');
for (const [domain, id] of [['pneumonitis', 'PNEUMONITIS'], ['nephritis', 'NEPHRITIS']]) {
  verify('00812', { ...cervix, [domain + '_grade']: 2 }, id + '_GRADE_HOLD', 'withhold');
  boundary('00812', domain + '_grade', id + '_GRADE_STOP', 'permanently_discontinue', [[2, false], [3, true], [4, true]], cervix);
}
verify('00812', { ...cervix, pneumonitis_recurrent_grade2: true }, 'PNEUMONITIS_RECURRENT_GRADE2', 'permanently_discontinue');

// Enter actual laboratory results through the same local-reference adapter used by the form.
const ref = { altUln: 40, astUln: 40, bilirubinUln: 20 };
for (const [analyte, field, points] of [
  ['alt', 'alt_ast_uln_multiple', [[120, null], [121, 'hold'], [200, 'hold'], [201, 'stop']]],
  ['ast', 'alt_ast_uln_multiple', [[120, null], [121, 'hold'], [200, 'hold'], [201, 'stop']]],
  ['bilirubin', 'bilirubin_uln_multiple', [[30, null], [31, 'hold'], [60, 'hold'], [61, 'stop']]]
]) {
  for (const [actual, action] of points) {
    const ratio = lab.calculate(field, { [analyte]: actual }, ref).ratio;
    const values = { ...cervix, [field]: ratio };
    for (const attribution of [{}, { immune_hepatitis_assessed: false }]) {
      verify('00812', { ...values, ...attribution }, 'HEPATIC_ATTRIBUTION_REVIEW', action ? 'withhold' : undefined);
      verify('00812', { ...values, ...attribution }, 'HEPATITIS_HOLD');
      verify('00812', { ...values, ...attribution }, 'HEPATITIS_STOP');
    }
    const confirmed = { ...values, immune_hepatitis_assessed: true };
    verify('00812', confirmed, 'HEPATIC_ATTRIBUTION_REVIEW');
    verify('00812', confirmed, 'HEPATITIS_HOLD', action === 'hold' ? 'withhold' : undefined);
    verify('00812', confirmed, 'HEPATITIS_STOP', action === 'stop' ? 'permanently_discontinue' : undefined);
  }
}
for (const selection of [cervix, skin, {}, { indication_id: '00812a' }, { indication_id: 'invalid-indication' }]) {
  for (const [field, threshold] of [['alt_ast_uln_multiple', 5], ['bilirubin_uln_multiple', 3]]) {
    for (const value of [threshold, threshold + 0.01]) {
      for (const attribution of [{}, { immune_hepatitis_assessed: false }, { immune_hepatitis_assessed: true }]) {
        const result = engine.assess(cemi, { ...selection, [field]: value, ...attribution });
        const expectedInvalid = selection.indication_id === 'invalid-indication' ? ['indication_id'] : [];
        assert.deepEqual(result.invalid.map(row => row.id), expectedInvalid);
        assert.deepEqual(result.errors, []);
        const liver = result.findings.filter(row => /^(?:HEPATITIS|HEPATIC_ATTRIBUTION)/.test(row.ruleId));
        const expected = attribution.immune_hepatitis_assessed
          ? (value > threshold ? ['HEPATITIS_STOP', 'permanently_discontinue'] : ['HEPATITIS_HOLD', 'withhold'])
          : ['HEPATIC_ATTRIBUTION_REVIEW', 'withhold'];
        assert.deepEqual(liver.map(row => [row.ruleId, row.actionType]), [expected]);
        checks++;
      }
    }
  }
}
verify('00812', { indication_id: '00812a', cervical_progressed_after_platinum: false }, 'CERVICAL_PRIOR_PLATINUM', 'consultant_review');
for (const labs of [{ alt_ast_uln_multiple: 5, bilirubin_uln_multiple: 3.1 }, { alt_ast_uln_multiple: 5.1, bilirubin_uln_multiple: 3 }]) {
  verify('00812', { ...labs, immune_hepatitis_assessed: true }, 'HEPATITIS_HOLD');
  verify('00812', { ...labs, immune_hepatitis_assessed: true }, 'HEPATITIS_STOP', 'permanently_discontinue');
}

for (const [code, id, lungId, dose, days] of [
  ['00455', '00455-gyn', '00455-lung', 200, 21],
  ['00558', '00558j', '00558a', 400, 42]
]) {
  const ctx = { indication_id: id };
  const phase = protocols[code].treatment_phases[0];
  const infusion = phase.administration[0];
  assert.equal(phase.cycle_length_days, days);
  assert.deepEqual([infusion.dose.value, infusion.dose.unit, infusion.route, infusion.duration_minutes], [dose, 'mg', 'IV infusion', 30]);
  for (const [field, ruleId] of [
    ['cervical_adult', 'HN45_CERVICAL_ADULT'],
    ['cervical_induction_completed', 'HN45_CERVICAL_INDUCTION_COMPLETED'],
    ['cervical_persistent_recurrent_metastatic', 'HN45_CERVICAL_PERSISTENT_RECURRENT_METASTATIC'],
    ['pd_l1_validated', 'HN45_CERVICAL_PDL1_ASSAY']
  ]) {
    verify(code, ctx, ruleId, 'consultant_review');
    verify(code, { ...ctx, [field]: false }, ruleId, 'consultant_review');
    verify(code, { ...ctx, [field]: true }, ruleId);
    verify(code, { indication_id: lungId, [field]: false }, ruleId);
  }
  verify(code, { ...ctx, pd_l1_tps: 95 }, 'HN45_CERVICAL_CPS_MISSING', 'consultant_review');
  verify(code, { ...ctx, pd_l1_cps: 1 }, 'HN45_CERVICAL_CPS_MISSING');
  verify(code, { indication_id: code + 'j', pd_l1_cps: 0 }, 'HN45_CERVICAL_CPS_LOW', 'consultant_review');
  boundary(code, 'pd_l1_cps', 'HN45_CERVICAL_CPS_LOW', 'consultant_review', [[0.99, true], [1, false]], ctx);
  boundary(code, 'ecog', 'ECOG_INDICATION_0_2', 'consultant_review', [[2, false], [3, true]], ctx);
  boundary(code, 'treatment_duration_months', 'ADVANCED_24_MONTH_REVIEW', 'consultant_review', [[23.9, false], [24, true], [25, true]], ctx);
  verify(code, { ...ctx, pneumonitis_grade: 2 }, 'PNEUMONITIS_G2', 'withhold');
  verify(code, { ...ctx, pneumonitis_grade: 3 }, 'PNEUMONITIS_SEVERE_OR_RECURRENT', 'permanently_discontinue');
  verify(code, { ...ctx, recurrent_grade2_pneumonitis: true }, 'PNEUMONITIS_SEVERE_OR_RECURRENT', 'permanently_discontinue');
  verify(code, { ...ctx, creatinine_ratio_baseline_or_uln: 1.6 }, 'NEPHRITIS_G2');
  boundary(code, 'creatinine_ratio_baseline_or_uln', 'NEPHRITIS_G2', 'withhold', [[1.5, false], [1.51, true], [3, true], [3.01, false]], { ...ctx, pembro_immune_nephritis_assessed: true });
  verify(code, { ...ctx, alt_ast_uln_multiple: 5.1 }, 'HEPATITIS_PERMANENT');
  boundary(code, 'alt_ast_uln_multiple', 'HEPATITIS_PERMANENT', 'permanently_discontinue', [[5, false], [5.01, true]], { ...ctx, pembro_immune_hepatitis_assessed: true });
}
console.log('Cervical clinical audit passed for five protocols and six indications (' + checks + ' source-linked assessment assertions).');
