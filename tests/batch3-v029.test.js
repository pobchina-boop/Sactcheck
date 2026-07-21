"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const Engine = require("../js/assessment-engine.js");
const Validator = require("../js/protocol-validator.js");

const ROOT = path.resolve(__dirname, "..");
const read = relative => JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));

const expected = [
  ["protocols/shared/00215-bevacizumab-15mgkg.json", "00215"],
  ["protocols/gynaecology/00306-gemcitabine-carboplatin.json", "00306"],
  ["protocols/gynaecology/00624-carboplatin-pegylated-liposomal-doxorubicin.json", "00624"],
  ["protocols/gynaecology/00799-bevacizumab-paclitaxel-cisplatin.json", "00799"],
  ["protocols/gynaecology/00862-niraparib-tablets-monotherapy.json", "00862"]
];

const index = read("protocols/index.json");
assert.ok(index.protocol_count >= 33, "The cumulative build must retain all v0.29 protocols");

const protocols = {};
for (const [relative, code] of expected) {
  const protocol = read(relative);
  const validation = Validator.validate(protocol, { strict: true });
  assert.ok(validation.valid, `${code} should validate: ${Validator.formatIssues(validation).join("; ")}`);
  assert.strictEqual(protocol.metadata.nccp_regimen_code, code);
  assert.strictEqual(protocol.metadata.migration.mode, "live_json");
  assert.ok(protocol.metadata.source_url.startsWith("https://healthservice.hse.ie/"), `${code} requires an official HSE source link`);
  assert.ok(protocol.rule_engine.rules.length >= 10, `${code} requires a substantive rule set`);
  assert.ok(index.protocols.some(item => item.id === protocol.protocol_id && item.mode === "live_json"), `${code} should be published in the index`);
  protocols[code] = protocol;
}

assert.strictEqual(
  protocols["00624"].metadata.migration.legacy_card_id,
  "openPldCarbo",
  "NCCP 00624 must replace the existing legacy catalogue card rather than create a duplicate"
);

const protocolSerialisation = expected.map(([relative]) => fs.readFileSync(path.join(ROOT, relative), "utf8")).join("\n").toLowerCase();
assert.ok(!protocolSerialisation.includes("bevacizumab + carboplatin + pegylated liposomal doxorubicin"), "Do not publish the unsupported planned triple regimen");
assert.ok(protocolSerialisation.includes("carboplatin auc 5 and pegylated liposomal doxorubicin"), "Publish official NCCP 00624 instead");

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

let result = assess("00215", { proteinuria_dipstick: "4+" });
assert.strictEqual(result.actionType, "withhold", "4+ dipstick should withhold bevacizumab pending 24-hour urine protein");
result = assess("00215", { proteinuria_dipstick: "4+", urine_protein_g_24h: 5 });
assert.strictEqual(result.actionType, "discontinue", "Urine protein >4 g/24 h should discontinue bevacizumab");
result = assess("00215", { fbc_clinical_concern: true });
assert.strictEqual(result.actionType, "consultant_review", "Bevacizumab FBC concern should be a clinical review flag, not an invented count hold");
const bevRules = JSON.stringify(protocols["00215"].rule_engine.rules);
assert.ok(!bevRules.includes('"field":"anc"'), "NCCP 00215 must not invent a cycle-by-cycle ANC threshold");
assert.ok(!bevRules.includes('"field":"platelets"'), "NCCP 00215 must not invent a cycle-by-cycle platelet threshold");

result = assess("00306", { treatment_day: "day1", anc: 1.5, platelets: 200 });
assert.strictEqual(result.actionType, "delay", "Day-1 ANC exactly 1.5 should delay because NCCP requires >1.5");
result = assess("00306", { treatment_day: "day8", anc: 0.8, platelets: 200 });
assert.strictEqual(result.actionType, "dose_reduce", "Day-8 ANC 0.5–1.0 should give 75% gemcitabine");
result = assess("00306", { treatment_day: "day8", anc: 0.4, platelets: 200 });
assert.strictEqual(result.actionType, "omit", "Day-8 ANC <0.5 should omit gemcitabine");
result = assess("00306", { gfr_ml_min: 20 });
assert.strictEqual(result.actionType, "contraindicated", "Carboplatin should not be given at GFR ≤20");
result = assess("00306", { pneumonitis_grade: 2 });
assert.strictEqual(result.actionType, "discontinue", "Grade ≥2 pneumonitis should discontinue gemcitabine");

result = assess("00624", { anc: 0.8 });
assert.strictEqual(result.actionType, "dose_reduce_one_level", "NCCP 00624 ANC <1.0 should reduce both drugs one level");
result = assess("00624", { gfr_ml_min: 20 });
assert.strictEqual(result.actionType, "contraindicated", "NCCP 00624 carboplatin should not be administered at GFR ≤20");
result = assess("00624", { ppe_grade: 3, toxicity_assessment_week: "week6" });
assert.strictEqual(result.actionType, "discontinue", "Grade 3 PPE persisting to week 6 should discontinue PLD");

result = assess("00799", { anc: 0.8 });
assert.strictEqual(result.actionType, "delay", "Cervical regimen ANC 0.5–<1.0 should delay");
result = assess("00799", { anc: 0.4 });
assert.strictEqual(result.actionType, "delay_then_dose_reduce", "ANC <0.5 should delay and prompt 25% paclitaxel/cisplatin reduction review");
result = assess("00799", { platelets: 80 });
assert.strictEqual(result.actionType, "consultant_review", "Platelets 75–<100 should remain a clinician decision");
result = assess("00799", { crcl_ml_min: 45 });
assert.strictEqual(result.actionType, "dose_reduce", "CrCl 40–49 should reduce cisplatin to 50%");
result = assess("00799", { neuropathy_grade: 3 });
assert.strictEqual(result.actionType, "cease", "Grade ≥3 neuropathy should cease paclitaxel/cisplatin");
result = assess("00799", { proteinuria_dipstick: "4+", urine_protein_g_24h: 5 });
assert.strictEqual(result.actionType, "discontinue", "Urine protein >4 g/24 h should discontinue bevacizumab");

result = assess("00862", { anc: 0.8 });
assert.strictEqual(result.actionType, "withhold_then_reduce", "Niraparib ANC <1.0 should withhold then reduce after recovery");
result = assess("00862", { platelets: 50, platelet_event_occurrence: "first" });
assert.strictEqual(result.actionType, "withhold_then_reduce", "Platelets <75 should resume niraparib one level lower after recovery");
result = assess("00862", { confirmed_mds_or_aml: true });
assert.strictEqual(result.actionType, "permanently_discontinue", "Confirmed MDS/AML should permanently discontinue niraparib");
result = assess("00862", { hepatic_impairment: "moderate" });
assert.strictEqual(result.actionType, "dose_reduce", "Moderate hepatic impairment should use about 66% of the original dose");
result = assess("00862", { other_ae_grade: 3, other_ae_occurrence: "first" });
assert.strictEqual(result.actionType, "withhold_then_reduce", "First grade ≥3 non-haematologic AE should withhold then reduce");
result = assess("00862", { hypertensive_crisis: true });
assert.strictEqual(result.actionType, "permanently_discontinue", "Hypertensive crisis should permanently discontinue niraparib");

const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
assert.ok(html.includes('id="openPldCarbo"'), "The legacy 00624 card must have a stable migration target");
assert.ok(html.includes("SACTCheck v0.34.0"));
assert.ok(html.includes("Version 0.34.0 · Batch 6 early breast completion"));
assert.ok(html.includes("js/protocol-loader.js?v=0.34.0"));

console.log("v0.29 Batch 3 protocol tests passed.");
