"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const Engine = require("../js/assessment-engine.js");
const Validator = require("../js/protocol-validator.js");
const Reconciliation = require("../js/source-reconciliation-v0700.js");

const ROOT = path.resolve(__dirname, "..");
const read = rel => JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
const clone = value => JSON.parse(JSON.stringify(value));
const ruleId = rule => String(rule?.id || rule?.rule_id || "");

const FILES = {
  "00101": "protocols/genitourinary/00101-cabazitaxel-prednisolone.json",
  "00256": "protocols/gastrointestinal/00256-nab-paclitaxel-gemcitabine.json",
  "00783": "protocols/gastrointestinal/00783-bevacizumab-5-mg-kg-and-folfoxiri-therapy-14-day.json"
};

function patched(code) {
  const original = read(FILES[code]);
  const protocol = clone(original);
  const originalStatus = protocol.status;
  const originalEncodingVersion = protocol.metadata.sactcheck_encoding_version;

  // Apply twice to prove the runtime overlay is idempotent.
  Reconciliation.apply(protocol);
  Reconciliation.apply(protocol);

  assert.strictEqual(protocol.status, originalStatus, `${code}: top-level lifecycle status must remain unchanged`);
  assert.strictEqual(
    protocol.metadata.sactcheck_encoding_version,
    originalEncodingVersion,
    `${code}: historical encoding-version provenance must remain unchanged`
  );
  assert.strictEqual(protocol.metadata.encoding_maturity.source_reconciled, true, `${code}: source-reconciled flag missing`);
  assert.strictEqual(protocol.metadata.encoding_maturity.reconciled_release, "0.70.0", `${code}: reconciliation release missing`);
  assert.strictEqual(protocol.metadata.validation.consultant_reviewed, false, `${code}: consultant validation must remain pending`);
  assert.strictEqual(protocol.metadata.validation.oncology_pharmacy_reviewed, false, `${code}: pharmacy validation must remain pending`);
  assert.strictEqual(protocol.metadata.validation.clinical_use_authorised, false, `${code}: clinical use must not be auto-authorised`);

  const ids = (protocol.rule_engine?.rules || []).map(ruleId).filter(Boolean);
  assert.strictEqual(new Set(ids).size, ids.length, `${code}: reconciliation must not create duplicate rule IDs`);

  const validation = Validator.validate(protocol, { strict: true });
  assert.ok(validation.valid, `${code}: reconciled runtime protocol should validate: ${Validator.formatIssues(validation).join("; ")}`);
  return protocol;
}

function assess(protocol, values) {
  return Engine.assess(protocol, values, { profileId: "default" });
}
function hasFinding(result, id) {
  return (result.findings || []).some(finding => finding.ruleId === id);
}

function assertCtcaeSelector(protocol, field) {
  const definition = protocol.input_definitions?.[field];
  assert(definition, `${protocol.metadata?.nccp_regimen_code}/${field}: CTCAE definition missing`);
  assert.strictEqual(definition.type, "select", `${field}: CTCAE control must be a selector`);
  assert.strictEqual(definition.ctcae_version, "5.0", `${field}: CTCAE v5.0 metadata missing`);
  assert(definition.assessment_guidance, `${field}: practical assessment guidance missing`);
  const options = definition.options || [];
  assert(options.length >= 5, `${field}: Grade 0-4 options missing`);
  [0,1,2,3,4].forEach(grade => {
    const option = options.find(item => Number(item.value) === grade);
    assert(option && option.description, `${field}: Grade ${grade} explanation missing`);
  });
}

// NCCP 00101 Version 8 — source-sensitive count wording remains explicit.
const cab = patched("00101");
assertCtcaeSelector(cab, "nausea_vomiting_grade");
assertCtcaeSelector(cab, "renal_failure_grade");
let result = assess(cab, { platelets_x10e9_l: 90 });
assert.notStrictEqual(result.actionType, "delay", "00101: platelets <100 alone must not recreate the unsupported independent delay");
assert.notStrictEqual(result.actionType, "withhold", "00101: platelets <100 alone must not recreate the unsupported independent withhold");

result = assess(cab, { assessment_phase: "treatment_day", anc_x10e9_l: 1.2, platelets_x10e9_l: 90 });
assert.strictEqual(result.actionType, "delay", "00101: literal combined treatment-day count criterion must delay");
assert(hasFinding(result, "CAB_COUNTS_COMBINED"));

result = assess(cab, { assessment_phase: "baseline", anc_x10e9_l: 1.2 });
assert.strictEqual(result.actionType, "contraindicated", "00101: baseline ANC <1.5 is an exclusion");
assert(hasFinding(result, "CAB_BASELINE_ANC_LT_1_5"));

result = assess(cab, { assessment_phase: "treatment_day", anc_x10e9_l: 1.2, platelets_x10e9_l: 120 });
assert.strictEqual(result.actionType, "consultant_review", "00101: isolated treatment-day ANC <1.5 should surface source ambiguity, not invent a hold");
assert(hasFinding(result, "CAB_ANC_LT_1_5_SOURCE_REVIEW"));

result = assess(cab, { renal_failure_grade: 3 });
assert.strictEqual(result.actionType, "discontinue", "00101: grade >=3 renal failure should discontinue cabazitaxel");
assert(hasFinding(result, "CAB_RENAL_FAILURE_G3"));

// NCCP 00256 Version 7 — day-specific haematology.
const nab = patched("00256");
result = assess(nab, { assessment_day: 1, anc: 1.4, platelets: 150 });
assert.strictEqual(result.actionType, "withhold", "00256: Day 1 ANC <1.5 should withhold/delay treatment");
assert(hasFinding(result, "DAY1_COUNTS"));

result = assess(nab, { assessment_day: 8, anc: 1.2, platelets: 60 });
assert.strictEqual(result.actionType, "dose_reduce", "00256: Day 8 platelets 50-<75 should reduce one dose level");
assert(hasFinding(result, "DAY8_INTERMEDIATE"));

result = assess(nab, { assessment_day: 8, anc: 0.4, platelets: 150 });
assert.strictEqual(result.actionType, "withhold", "00256: Day 8 ANC <0.5 should withhold");
assert(hasFinding(result, "DAY8_LOW"));

result = assess(nab, { assessment_day: 15, day8_action: "full", anc: 0.7, platelets: 100 });
assert.strictEqual(result.actionType, "consultant_review", "00256: source-permitted Day 15 alternatives must stay clinician-selectable");
assert(hasFinding(result, "DAY15_AFTER_FULL_INTERMEDIATE"));

// NCCP 00783 Version 2a — baseline/ongoing counts and component-specific bevacizumab pathways.
const folfoxiri = patched("00783");
for (const field of ["hypertension_grade","fistula_grade","thromboembolic_event_grade","haemorrhagic_event_grade"]) {
  assertCtcaeSelector(folfoxiri, field);
}
assert.strictEqual(folfoxiri.supportive_care.emetogenic_risk, "high", "00783: source-stated overall emetogenic risk should be high");

result = assess(folfoxiri, { assessment_phase: "baseline", anc_x10e9_l: 2, platelets_x10e9_l: 90 });
assert.strictEqual(result.actionType, "contraindicated", "00783: baseline platelets <100 are an exclusion");
assert(hasFinding(result, "FOLFOXIRI_BASELINE_COUNTS"));

result = assess(folfoxiri, { assessment_phase: "treatment_day", anc_x10e9_l: 2, platelets_x10e9_l: 90 });
assert.notStrictEqual(result.actionType, "delay", "00783: ongoing platelets 90 meet the >=75 Day 1 threshold");

result = assess(folfoxiri, {
  assessment_phase: "treatment_day",
  anc_x10e9_l: 1.2,
  platelets_x10e9_l: 120,
  anc_low_occurrence: 1
});
assert.strictEqual(result.actionType, "delay", "00783: low ongoing ANC should delay current treatment");
assert(hasFinding(result, "FOLFOXIRI_TREATMENT_COUNTS"));
assert(hasFinding(result, "FOLFOXIRI_ANC_OCC1"), "00783: first-occurrence subsequent-dose pathway should also be shown");

result = assess(folfoxiri, { proteinuria_dipstick: "2+" });
assert.strictEqual(result.actionType, "proceed_with_caution", "00783: 2+ proteinuria should not automatically withhold bevacizumab");
assert(hasFinding(result, "BEV_PROTEIN_2_3"));

result = assess(folfoxiri, { proteinuria_dipstick: "4+" });
assert.strictEqual(result.actionType, "withhold", "00783: 4+ proteinuria should withhold bevacizumab");
assert(hasFinding(result, "BEV_PROTEIN_4"));

result = assess(folfoxiri, { urine_protein_24h_g: 2.0 });
assert(["proceed","proceed_with_caution"].includes(result.actionType), "00783: <=2 g/24h must not trigger a bevacizumab hold");
assert(hasFinding(result, "BEV_24H_LE2"));

result = assess(folfoxiri, { urine_protein_24h_g: 2.1 });
assert.strictEqual(result.actionType, "withhold", "00783: >2 to 4 g/24h should hold bevacizumab");
assert(hasFinding(result, "BEV_24H_2_4"));

result = assess(folfoxiri, { urine_protein_24h_g: 4.1 });
assert.strictEqual(result.actionType, "discontinue", "00783: >4 g/24h should discontinue bevacizumab");
assert(hasFinding(result, "BEV_24H_GT4"));

result = assess(folfoxiri, { on_antihypertensive_treatment: true, hypertension_reading_confirmed_sustained: true, systolic_bp_mmhg: 150, diastolic_bp_mmhg: 100 });
assert(!hasFinding(result, "BEV_HTN_UNCONTROLLED_NUMERIC"), "00783: exact 150/100 must not trigger the source's >150/100 numeric uncontrolled threshold");

result = assess(folfoxiri, { on_antihypertensive_treatment: true, hypertension_reading_confirmed_sustained: false, systolic_bp_mmhg: 151, diastolic_bp_mmhg: 100 });
assert(!hasFinding(result, "BEV_HTN_UNCONTROLLED_NUMERIC"), "00783: a single unconfirmed elevated reading must not be treated as sustained uncontrolled hypertension");

result = assess(folfoxiri, { on_antihypertensive_treatment: true, hypertension_reading_confirmed_sustained: true, systolic_bp_mmhg: 151, diastolic_bp_mmhg: 100 });
assert.strictEqual(result.actionType, "withhold", "00783: BP >150/100 on antihypertensive treatment should withhold bevacizumab");
assert(hasFinding(result, "BEV_HTN_UNCONTROLLED_NUMERIC"));

result = assess(folfoxiri, { gastrointestinal_perforation: true });
assert.strictEqual(result.actionType, "discontinue", "00783: gastrointestinal perforation should discontinue bevacizumab");
assert(hasFinding(result, "BEV_GI_PERF"));


// Knowledge addendum integration is additive and must not rewrite the historical base release label.
const knowledgeAddendum = read("data/regimen-knowledge-base-v0700-addendum.json");
const syntheticBase = { release:"0.68.0", drug_profiles:[], regimen_profiles:[], evidence_records:[] };
Reconciliation.mergeKnowledgePayload(syntheticBase, clone(knowledgeAddendum));
assert.strictEqual(syntheticBase.release,"0.68.0","v0.70.0 addendum must not rewrite the historical canonical knowledge-base release");
assert.strictEqual(syntheticBase.regimen_profiles.length,3);
assert.strictEqual(syntheticBase.evidence_records.length,6);
assert.ok(syntheticBase.addenda.some(item=>item.release==="0.70.0"));

console.log("v0.70.0 runtime source-reconciliation tests passed for NCCP 00101, 00256 and 00783, including idempotency and source-sensitive boundaries.");
