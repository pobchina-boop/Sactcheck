"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const Engine = require("../js/assessment-engine.js");
const Validator = require("../js/protocol-validator.js");

const ROOT = path.resolve(__dirname, "..");
const read = relative => JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));

const expected = [
  ["protocols/breast/00722-tchp-docetaxel-carboplatin-trastuzumab-pertuzumab.json", "00722"],
  ["protocols/breast/00726-pertuzumab-trastuzumab-maintenance.json", "00726"],
  ["protocols/gastrointestinal/00831-atezolizumab-bevacizumab-hcc.json", "00831"],
  ["protocols/gastrointestinal/00897-durvalumab-gemcitabine-cisplatin.json", "00897"],
  ["protocols/shared/00558-pembrolizumab-400mg-monotherapy.json", "00558"]
];

const index = read("protocols/index.json");
assert.ok(index.protocol_count >= 28, "The cumulative index should retain all v0.28 protocols.");

const protocols = {};
for (const [relative, code] of expected) {
  const protocol = read(relative);
  const validation = Validator.validate(protocol, { strict: true });
  assert.ok(validation.valid, `${code} should validate: ${Validator.formatIssues(validation).join("; ")}`);
  assert.strictEqual(protocol.metadata.nccp_regimen_code, code);
  assert.strictEqual(protocol.metadata.migration.mode, "live_json");
  assert.ok(protocol.metadata.source_url.startsWith("https://healthservice.hse.ie/"), `${code} requires an official HSE source link`);
  assert.ok(protocol.rule_engine.rules.length >= 10, `${code} requires a substantive rule set`);
  assert.ok(index.protocols.some(item => item.id === protocol.protocol_id && item.mode === "live_json"), `${code} should be published in the catalogue index`);
  protocols[code] = protocol;
}

function demo(protocol, raw = {}) {
  const definitions = Engine.getInputDefinitions(protocol, "default", raw);
  const values = Object.fromEntries(
    definitions
      .filter(definition => definition.demo_value !== undefined)
      .map(definition => [definition.id, definition.demo_value])
  );
  return { ...values, ...raw };
}

function assess(code, overrides = {}) {
  const protocol = protocols[code];
  return Engine.assess(protocol, demo(protocol, overrides), { profileId: "default" });
}

let result = assess("00722", { anc: 1.2, platelets: 200, gcsf_strategy: "dose_reduction" });
assert.strictEqual(result.actionType, "dose_reduce", "TCHP intermediate counts should activate the encoded dose-reduction option");
assert.ok(result.findings.some(finding => finding.ruleId === "COUNTS_INTERMEDIATE_REDUCE"));

result = assess("00722", { anc: 1.2, platelets: 200, gcsf_strategy: "gcsf" });
assert.strictEqual(result.actionType, "proceed_with_caution", "TCHP G-CSF pathway should remain a clearly flagged alternative");

result = assess("00722", { gfr_ml_min: 20 });
assert.strictEqual(result.actionType, "contraindicated", "TCHP carboplatin should not be administered at GFR 20 or below");

result = assess("00722", { lvef_percent: 49, lvef_drop_points: 12 });
assert.strictEqual(result.actionType, "withhold", "TCHP HER2-directed therapy should be withheld for the encoded LVEF criterion");

result = assess("00722", { febrile_neutropenia_event_number: 1, gcsf_strategy: "gcsf", anc: 2, platelets: 200 });
assert.strictEqual(result.actionType, "proceed_with_caution", "First febrile-neutropenia event in the G-CSF pathway should retain 100% dosing after count recovery");

result = assess("00722", { febrile_neutropenia_event_number: 2, gcsf_strategy: "gcsf", anc: 2, platelets: 200 });
assert.strictEqual(result.actionType, "dose_reduce", "Second febrile-neutropenia event in the G-CSF pathway should use 75% dosing");

result = assess("00722", { alt_ast_uln_multiple: 6, alk_phos_uln_multiple: 2 });
assert.strictEqual(result.actionType, "consultant_review", "An unlisted TCHP hepatic combination must not be extrapolated to an automatic delay");

result = assess("00722", { alt_ast_uln_multiple: 6, alk_phos_uln_multiple: 6 });
assert.strictEqual(result.actionType, "delay", "The explicit Table 5 >5×ULN / >5×ULN combination should delay chemotherapy");

result = assess("00726", { lvef_percent: 39 });
assert.strictEqual(result.actionType, "withhold", "Pertuzumab/trastuzumab should be withheld below 40% LVEF");

result = assess("00726", { weeks_since_last_dose: 6 });
assert.strictEqual(result.actionType, "proceed_with_caution", "A gap of at least six weeks should prompt reloading-dose guidance");
assert.ok(result.findings.some(finding => finding.ruleId === "MISSED_DOSE_RELOAD"));

result = assess("00831", { child_pugh_class: "B" });
assert.strictEqual(result.actionType, "consultant_review", "HCC eligibility outside Child-Pugh A should require consultant review");

result = assess("00831", { urine_protein_g_24h: 3 });
assert.strictEqual(result.actionType, "withhold", "Bevacizumab should be withheld for urine protein above 2 to 4 g/24 h");

result = assess("00831", { pneumonitis_grade: 2 });
assert.strictEqual(result.actionType, "withhold", "Atezolizumab should be withheld for grade 2 pneumonitis");

const hccSerialised = JSON.stringify(protocols["00831"].rule_engine.rules);
assert.ok(!hccSerialised.includes('"field":"anc"'), "Atezolizumab/bevacizumab HCC must not inherit a chemotherapy ANC hold");
assert.ok(!hccSerialised.includes('"field":"platelets"'), "Atezolizumab/bevacizumab HCC must not inherit a chemotherapy platelet hold");

result = assess("00897", { treatment_phase: "induction_day1", anc: 0.8, platelets: 200 });
assert.strictEqual(result.actionType, "dose_reduce", "Durvalumab/gemcitabine/cisplatin induction ANC 0.5–0.99 should reduce gemcitabine to 75%");

result = assess("00897", { treatment_phase: "induction_day1", anc: 0.4, platelets: 200 });
assert.strictEqual(result.actionType, "omit", "Durvalumab/gemcitabine/cisplatin induction ANC below 0.5 should omit gemcitabine and cisplatin");

const maintenanceDefinitions = Engine.getInputDefinitions(protocols["00897"], "default", { treatment_phase: "maintenance" });
assert.ok(maintenanceDefinitions.some(definition => definition.id === "anc" && definition.visible === false), "Chemotherapy count inputs must be hidden in durvalumab-only maintenance");
assert.ok(maintenanceDefinitions.some(definition => definition.id === "platelets" && definition.visible === false), "Chemotherapy platelet inputs must be hidden in durvalumab-only maintenance");
result = assess("00897", { treatment_phase: "maintenance", anc: 0.1, platelets: 5 });
assert.ok(!["dose_reduce", "omit", "delay", "withhold", "permanently_discontinue"].includes(result.actionType), "Injected low counts must not create a chemotherapy hold during durvalumab-only maintenance");

result = assess("00897", { treatment_phase: "maintenance", pneumonitis_grade: 2 });
assert.strictEqual(result.actionType, "withhold", "Durvalumab maintenance should retain ICI pneumonitis logic");

const pembrolizumab = protocols["00558"];
assert.strictEqual(pembrolizumab.metadata.assessment_model, "single_agent_ici");
assert.ok(!Object.prototype.hasOwnProperty.call(pembrolizumab.input_definitions, "anc"), "Pembrolizumab monotherapy should not require an ANC threshold input");
assert.ok(!Object.prototype.hasOwnProperty.call(pembrolizumab.input_definitions, "platelets"), "Pembrolizumab monotherapy should not require a platelet threshold input");
const pembrolizumabRules = JSON.stringify(pembrolizumab.rule_engine.rules);
assert.ok(!pembrolizumabRules.includes('"field":"anc"'));
assert.ok(!pembrolizumabRules.includes('"field":"platelets"'));

result = assess("00558", { anc: 0.1, platelets: 5 });
assert.ok(!["delay", "withhold", "permanently_discontinue"].includes(result.actionType), "External low counts must not create an invented pembrolizumab monotherapy hold");

result = assess("00558", { pneumonitis_grade: 2 });
assert.strictEqual(result.actionType, "withhold", "Pembrolizumab should be withheld for grade 2 pneumonitis");

result = assess("00558", { endocrine_status: "hypothyroidism" });
assert.strictEqual(result.actionType, "proceed_with_caution", "Controlled hypothyroidism should use replacement/monitoring rather than an automatic pembrolizumab hold");

console.log("v0.28 Batch 4 protocol tests passed.");
