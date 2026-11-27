'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const engine = require('../js/assessment-engine');
const catalogue = require('../protocols/index.json').protocols;
const review = require('../validation/gynae-v08471/retrospective-review.json').protocols;
const knowledge = require('../data/regimen-knowledge-gynae-v08470.json').regimen_profiles;

// Expected actions were transcribed from the NCCP protocol tables before exercising the engine.
const cases = {
  '00247': [
    [{post_mtx_hcg: 999}, [], ['HCG_ELIGIBILITY', 'HCG_1000']],
    [{post_mtx_hcg: 1000}, ['HCG_1000'], ['HCG_ELIGIBILITY']],
    [{post_mtx_hcg: 1001}, ['HCG_ELIGIBILITY'], ['HCG_1000']],
    [{iv_site_pain: true}, ['IV_SITE_PAIN'], []],
    [{iv_site_pain: false}, [], ['IV_SITE_PAIN']]
  ],
  '00248': [
    [{treatment_visit: 'co', crcl_ml_min: 9.9}, ['CYC_LT10'], ['CYC_10_20']],
    [{treatment_visit: 'co', crcl_ml_min: 10}, ['CYC_10_20'], ['CYC_LT10']],
    [{treatment_visit: 'ema', crcl_ml_min: 9.9}, [], ['CYC_LT10']],
    [{treatment_visit: 'co', neuropathy_grade: 3}, ['VCR_G3'], []],
    [{treatment_visit: 'ema2', neuropathy_grade: 3}, [], ['VCR_G3']]
  ],
  '00249': [
    [{treatment_visit: 'intrathecal', previous_spinal_doses: 2}, [], ['IT_LIMIT']],
    [{treatment_visit: 'intrathecal', previous_spinal_doses: 3}, ['IT_LIMIT'], []],
    [{treatment_visit: 'rescue', previous_spinal_doses: 3}, [], ['IT_LIMIT']],
    [{treatment_visit: 'intrathecal', crcl_ml_min: 29.9}, ['IT_RENAL'], []],
    [{treatment_visit: 'intrathecal', crcl_ml_min: 30}, [], ['IT_RENAL']]
  ],
  '00264': [
    [{treatment_visit: 'ep', crcl_ml_min: 44.9}, ['CIS_LT45'], ['CIS_45_59']],
    [{treatment_visit: 'ep', crcl_ml_min: 45}, ['CIS_45_59'], ['CIS_LT45']],
    [{treatment_visit: 'ep', crcl_ml_min: 59.5}, ['CIS_GAP'], ['CIS_45_59']],
    [{treatment_visit: 'ema', crcl_ml_min: 44.9}, [], ['CIS_LT45']],
    [{treatment_visit: 'ep', neuropathy_grade: 2}, ['CIS_NEURO'], []]
  ],
  '00266': [
    [{treatment_visit: 'tp', assessment_phase: 'pre_treatment', neuropathy_grade: 1}, [], ['ENTRY_NEURO']],
    [{treatment_visit: 'tp', assessment_phase: 'pre_treatment', neuropathy_grade: 2}, ['ENTRY_NEURO'], []],
    [{treatment_visit: 'tp', assessment_phase: 'on_treatment', neuropathy_grade: 2}, [], ['ENTRY_NEURO']],
    [{treatment_visit: 'tp', major_hearing_symptoms: true}, ['MAJOR_HEARING_SYMPTOMS'], []],
    [{treatment_visit: 'te', major_hearing_symptoms: true}, [], ['MAJOR_HEARING_SYMPTOMS']]
  ]
};
assert.deepEqual(Object.keys(cases).sort(), Object.keys(review).sort());
let total = 0;
for (const [code, matrix] of Object.entries(cases)) {
  const source = review[code];
  const protocol = require(path.join(root, catalogue.find(r => r.path.includes('/' + code + '-')).path));
  const patient = require('../data/patient-knowledge/' + code + '.json');
  const clinician = knowledge.find(k => k.protocol_id === protocol.protocol_id);
  assert.equal(source.nccp_version, protocol.metadata.nccp_version);
  assert.match(source.pdf_sha256, /^[a-f0-9]{64}$/);
  assert(patient.questions.some(q => q.q === source.patient_question && q.a === source.patient_answer));
  assert(clinician.key_points.includes(source.clinician_update));
  for (const [input, expected, excluded] of matrix) {
    const result = engine.assess(protocol, input);
    assert.deepEqual(result.invalid, []);
    assert.deepEqual(result.errors, []);
    const findings = result.findings.map(f => f.ruleId);
    for (const id of expected) assert(findings.includes(id), code + ' missing ' + id);
    for (const id of excluded) assert(!findings.includes(id), code + ' unexpected ' + id);
    total++;
  }
}
console.log(total + ' retrospective clinical cases and five matched patient and clinician advice updates passed.');
