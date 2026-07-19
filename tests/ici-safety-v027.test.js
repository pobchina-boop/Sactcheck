"use strict";
const assert = require("assert");
const fs = require("fs");
const Engine = require("../js/assessment-engine.js");
const Validator = require("../js/protocol-validator.js");

const read = file => JSON.parse(fs.readFileSync(file, "utf8"));
const durvalumab = read("protocols/lung/00655-durvalumab-maintenance.json");
const atezolizumab = read("protocols/lung/00593-atezolizumab-maintenance.json");
const pembroChemo = read("protocols/breast/00857-pembro-carbo-paclitaxel-ac.json");

function demo(protocol) {
  const definitions = Engine.getInputDefinitions(protocol, "default");
  return Object.fromEntries(definitions.map(definition => [definition.id, definition.demo_value]));
}

for (const [name, protocol] of [["durvalumab", durvalumab], ["atezolizumab", atezolizumab]]) {
  const validation = Validator.validate(protocol, { strict: true });
  assert.equal(validation.valid, true, `${name} must validate`);
  assert.equal(protocol.metadata.assessment_model, "single_agent_ici");
  const rules = protocol.rule_engine.rules;
  assert(!rules.some(rule => ["ANC_LOW", "PLATELETS_LOW"].includes(rule.rule_id)), `${name} must not contain cytotoxic count holds`);
  const serialisedRules = JSON.stringify(rules);
  assert(!serialisedRules.includes('"field":"anc"'), `${name} must not evaluate ANC as a protocol hold threshold`);
  assert(!serialisedRules.includes('"field":"platelets"'), `${name} must not evaluate platelets as a protocol hold threshold`);
  const result = Engine.assess(protocol, { ...demo(protocol), anc: 0.1, platelets: 5 }, { profileId: "default" });
  assert(!["delay", "withhold", "permanently_discontinue"].includes(result.actionType), `${name}: low count values supplied outside the ICI schema must not create an automatic hold`);
  assert(!result.findings.some(finding => /ANC|PLATELET/i.test(finding.ruleId)), `${name}: no count finding expected`);
}

let result = Engine.assess(durvalumab, { ...demo(durvalumab), pneumonitis_grade: 2 }, { profileId: "default" });
assert.equal(result.actionType, "withhold");
assert(result.findings.some(finding => finding.ruleId === "PNEUMONITIS_G2"));

result = Engine.assess(durvalumab, { ...demo(durvalumab), pneumonitis_grade: 3 }, { profileId: "default" });
assert.equal(result.actionType, "permanently_discontinue");

result = Engine.assess(durvalumab, { ...demo(durvalumab), endocrine_status: "symptomatic_hypothyroidism" }, { profileId: "default" });
assert.equal(result.actionType, "proceed_with_caution");

result = Engine.assess(durvalumab, { ...demo(durvalumab), endocrine_status: "symptomatic_hyperthyroidism_or_thyroiditis" }, { profileId: "default" });
assert.equal(result.actionType, "withhold");

result = Engine.assess(durvalumab, { ...demo(durvalumab), alt_ast_uln_multiple: 4 }, { profileId: "default" });
assert.equal(result.actionType, "withhold");

result = Engine.assess(durvalumab, { ...demo(durvalumab), alt_ast_uln_multiple: 6 }, { profileId: "default" });
assert.equal(result.actionType, "permanently_discontinue");

result = Engine.assess(atezolizumab, { ...demo(atezolizumab), endocrine_status: "symptomatic_hypothyroidism" }, { profileId: "default" });
assert.equal(result.actionType, "withhold");

result = Engine.assess(atezolizumab, { ...demo(atezolizumab), immune_diabetes_suspected: true, glucose_mmol_l: 14 }, { profileId: "default" });
assert.equal(result.actionType, "withhold");

const pembroInputs = {
  cycle_number: 2, day_number: 1, anc_x10e9_l: 0.8, platelets_x10e9_l: 200,
  gfr_ml_min: 90, alt_ratio_uln: 1, bilirubin_ratio_uln: 1, neuropathy_grade: 0,
  active_pembrolizumab_irae: false, febrile_neutropenia: false,
  anc_below_0_5_duration_days: 0, platelet_nadir_x10e9_l: 200,
  bleeding_tendency: false, haematological_delay_days: 0,
  haematological_delay_occurrence: 0, neuropathy_occurrence: 0,
  neuropathy_persistent_or_second_occurrence: false,
  other_non_haematological_toxicity_grade: 0,
  paclitaxel_non_haematological_toxicity_grade: 0,
  paclitaxel_dose_reduction_count: 0, paclitaxel_delay_days: 0
};
result = Engine.assess(pembroChemo, pembroInputs, { profileId: "neoadjuvant_cycles_1_to_4_day_1" });
assert.equal(result.actionType, "delay", "chemo-immunotherapy must retain cytotoxic count rules for chemotherapy components");

console.log("v0.27 single-agent ICI safety tests passed.");
