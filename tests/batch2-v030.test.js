"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const Engine = require("../js/assessment-engine.js");
const Validator = require("../js/protocol-validator.js");

const ROOT = path.resolve(__dirname, "..");
const read = relative => JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));

const expected = [
  ["protocols/lung/00689-atezolizumab-carboplatin-etoposide.json", "00689"],
  ["protocols/lung/00304-carboplatin-paclitaxel.json", "00304"],
  ["protocols/lung/00310-gemcitabine-carboplatin.json", "00310"],
  ["protocols/lung/00281-gemcitabine-cisplatin.json", "00281"],
  ["protocols/lung/00317-pemetrexed-cisplatin.json", "00317"]
];

const index = read("protocols/index.json");
assert.ok(index.protocol_count >= 38, "v0.30 protocols should remain published in later cumulative releases");

const protocols = {};
for (const [relative, code] of expected) {
  const protocol = read(relative);
  const validation = Validator.validate(protocol, { strict: true });
  assert.ok(validation.valid, `${code} should validate: ${Validator.formatIssues(validation).join("; ")}`);
  assert.strictEqual(protocol.metadata.nccp_regimen_code, code);
  assert.strictEqual(protocol.metadata.migration.mode, "live_json");
  assert.ok(protocol.metadata.source_url.startsWith("https://healthservice.hse.ie/"), `${code} requires an official HSE source link`);
  assert.ok(protocol.rule_engine.rules.length >= 12, `${code} requires a substantive rule set`);
  assert.ok(index.protocols.some(item => item.id === protocol.protocol_id && item.mode === "live_json"), `${code} should be published in the index`);
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

// 00689: cytotoxic thresholds are induction-only; maintenance remains ICI-specific.
let result = assess("00689", { treatment_phase: "induction", anc: 0.8 });
assert.strictEqual(result.actionType, "delay", "00689 induction ANC 0.5–<1.0 should delay chemotherapy");
result = assess("00689", { treatment_phase: "induction", anc: 0.4 });
assert.strictEqual(result.actionType, "delay_then_dose_reduce", "00689 induction ANC <0.5 should delay and prompt 25% chemotherapy reduction review");
result = assess("00689", { treatment_phase: "induction", platelets: 40 });
assert.strictEqual(result.actionType, "delay_then_dose_reduce", "00689 induction platelets <50 should delay and prompt chemotherapy reduction review");
result = assess("00689", { treatment_phase: "maintenance", anc: 0.4, fbc_clinical_concern: false });
assert.ok(!["delay", "delay_then_dose_reduce", "contraindicated"].includes(result.actionType), "00689 maintenance must not inherit induction ANC holds");
result = assess("00689", { treatment_phase: "maintenance", pneumonitis_grade: 2 });
assert.strictEqual(result.actionType, "withhold", "00689 maintenance grade 2 pneumonitis should withhold atezolizumab");
result = assess("00689", { treatment_phase: "maintenance", pneumonitis_grade: 3 });
assert.strictEqual(result.actionType, "permanently_discontinue", "00689 maintenance grade 3 pneumonitis should permanently discontinue atezolizumab");

// 00304: lung carboplatin/paclitaxel boundary rules.
result = assess("00304", { anc: 0.8 });
assert.strictEqual(result.actionType, "delay", "00304 ANC 0.5–<1.0 should delay");
result = assess("00304", { anc: 0.4 });
assert.strictEqual(result.actionType, "delay_then_dose_reduce", "00304 ANC <0.5 should delay and prompt 25% reduction");
result = assess("00304", { platelets: 40 });
assert.strictEqual(result.actionType, "delay_then_dose_reduce", "00304 platelets <50 should delay and prompt 25% reduction");
result = assess("00304", { bilirubin_uln_multiple: 1.5, transaminases_uln_multiple: 2 });
assert.strictEqual(result.actionType, "dose_reduce", "00304 bilirubin 1.26–2 ×ULN should reduce paclitaxel to 75%");
result = assess("00304", { gfr_ml_min: 20 });
assert.strictEqual(result.actionType, "contraindicated", "00304 carboplatin should not be administered at GFR ≤20");
result = assess("00304", { neuropathy_grade: 3 });
assert.strictEqual(result.actionType, "omit", "00304 grade ≥3 neuropathy should omit paclitaxel");

// 00310: day-specific gemcitabine/carboplatin rules.
result = assess("00310", { treatment_day: "day1", anc: 1.0 });
assert.strictEqual(result.actionType, "delay", "00310 Day 1 ANC exactly 1.0 should delay because NCCP requires >1.0");
result = assess("00310", { treatment_day: "day8", anc: 0.8 });
assert.strictEqual(result.actionType, "dose_reduce", "00310 Day 8 ANC 0.5–1.0 should give 75% gemcitabine");
result = assess("00310", { treatment_day: "day8", anc: 0.4 });
assert.strictEqual(result.actionType, "omit", "00310 Day 8 ANC <0.5 should omit gemcitabine");
result = assess("00310", { gfr_ml_min: 20 });
assert.strictEqual(result.actionType, "contraindicated", "00310 carboplatin should not be administered at GFR ≤20");
result = assess("00310", { pneumonitis_grade: 2 });
assert.strictEqual(result.actionType, "discontinue", "00310 grade ≥2 pneumonitis should discontinue gemcitabine");

// 00281: day-specific gemcitabine/cisplatin and renal/neuropathy rules.
result = assess("00281", { treatment_day: "day1", anc: 1.0 });
assert.strictEqual(result.actionType, "delay", "00281 Day 1 ANC exactly 1.0 should delay because NCCP requires >1.0");
result = assess("00281", { treatment_day: "day8", anc: 0.8 });
assert.strictEqual(result.actionType, "dose_reduce", "00281 Day 8 ANC 0.5–1.0 should give 75% gemcitabine");
result = assess("00281", { crcl_ml_min: 50 });
assert.strictEqual(result.actionType, "dose_reduce", "00281 CrCl 45–59 should reduce cisplatin to 75%");
result = assess("00281", { crcl_ml_min: 40 });
assert.strictEqual(result.actionType, "consultant_review", "00281 CrCl <45 should prompt carboplatin/clinical-decision review");
result = assess("00281", { neuropathy_grade: 2 });
assert.strictEqual(result.actionType, "withhold_then_reduce", "00281 grade ≥2 neuropathy should modify cisplatin after recovery");
result = assess("00281", { pneumonitis_grade: 2 });
assert.strictEqual(result.actionType, "discontinue", "00281 grade ≥2 pneumonitis should discontinue gemcitabine");

// 00317: pemetrexed/cisplatin count, renal and toxicity rules.
result = assess("00317", { anc: 1.2 });
assert.strictEqual(result.actionType, "consultant_review", "00317 ANC 1.0–<1.5 should prompt team review");
result = assess("00317", { anc: 0.8 });
assert.strictEqual(result.actionType, "delay", "00317 ANC 0.5–<1.0 should delay");
result = assess("00317", { anc: 0.4 });
assert.strictEqual(result.actionType, "delay_then_dose_reduce", "00317 ANC <0.5 should delay then reduce both drugs 25%");
result = assess("00317", { crcl_ml_min: 44 });
assert.strictEqual(result.actionType, "contraindicated", "00317 pemetrexed should not be administered at CrCl <45");
result = assess("00317", { diarrhoea_grade: 3 });
assert.strictEqual(result.actionType, "withhold_then_reduce", "00317 grade ≥3 diarrhoea should withhold then resume both drugs at 75%");
result = assess("00317", { mucositis_grade: 3 });
assert.strictEqual(result.actionType, "withhold_then_reduce", "00317 grade ≥3 mucositis should withhold then reduce pemetrexed");
result = assess("00317", { neuropathy_grade: 3 });
assert.strictEqual(result.actionType, "discontinue", "00317 grade ≥3 neurotoxicity should discontinue");

for (const code of Object.keys(protocols)) {
  result = assess(code);
  assert.strictEqual(result.actionType, "proceed", `${code} demonstration values should produce a proceed output`);
}

const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
assert.ok(html.includes("SACTCheck v0.37.0 — Platform standardisation"));
assert.ok(html.includes("Version 0.37.0 · Platform standardisation"));
assert.ok(html.includes("js/protocol-loader.js?v=0.37.0"));

console.log("v0.30 Batch 2 lung protocol tests passed.");
