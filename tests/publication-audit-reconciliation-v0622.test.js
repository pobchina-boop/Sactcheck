"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const Engine = require("../js/assessment-engine.js");
const Validator = require("../js/protocol-validator.js");

const ROOT = path.resolve(__dirname, "..");
const read = relative => JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));

const files = {
  "00202": "protocols/breast/00202-docetaxel-100-21-day.json",
  "00254": "protocols/breast/00254-anastrozole-monotherapy.json",
  "00262": "protocols/breast/00262-ec90.json",
  "00263": "protocols/breast/00263-ec75.json",
  "00269": "protocols/breast/00269-fec50.json",
  "00322": "protocols/breast/00322-everolimus-exemestane.json",
  "00361": "protocols/breast/00361-fulvestrant-monotherapy.json",
  "00371": "protocols/breast/00371-letrozole-monotherapy.json",
  "00376": "protocols/breast/00376-exemestane-monotherapy.json",
  "00377": "protocols/breast/00377-cmf-oral.json",
  "00378": "protocols/breast/00378-cmf-iv-28-day.json",
  "00381": "protocols/breast/00381-cmf-iv-21-day.json",
  "00423": "protocols/breast/00423-at-doxorubicin-docetaxel.json",
  "00743": "protocols/breast/00743-eribulin-monotherapy-28-day.json",
  "00749": "protocols/breast/00749-gemcitabine-800-monotherapy.json",
  "00815": "protocols/breast/00815-paclitaxel-weekly-trastuzumab-3weekly.json"
};


const crypto = require("crypto");
const integrity = read("V0622_PROTOCOL_JSON_HASHES.json");
assert.strictEqual(integrity.current_release, "0.62.2");
assert.strictEqual(integrity.baseline_release, "0.62.1");
assert.strictEqual(integrity.protocol_json_count, 382);
assert.strictEqual(integrity.changed_count, 24);
for (const relative of integrity.changed_files) {
  const raw = fs.readFileSync(path.join(ROOT, "protocols", relative));
  const actual = crypto.createHash("sha256").update(raw).digest("hex");
  assert.strictEqual(actual, integrity.hashes[relative], `v0.62.2 protocol integrity mismatch: ${relative}`);
}

const protocols = {};
for (const [code, relative] of Object.entries(files)) {
  const protocol = read(relative);
  const validation = Validator.validate(protocol, { strict: true });
  assert.ok(validation.valid, `${code} should validate: ${Validator.formatIssues(validation).join("; ")}`);
  assert.strictEqual(protocol.metadata.nccp_regimen_code, code);
  assert.strictEqual(protocol.metadata.source_version_verified, true, `${code} source version should be marked reconciled`);
  assert.strictEqual(protocol.metadata.validation.source_document_checked, true, `${code} source document should be marked checked`);
  protocols[code] = protocol;
}

function assess(code, raw) {
  return Engine.assess(protocols[code], raw, { profileId: "default" });
}
function rule(code, id) {
  return protocols[code].rule_engine.rules.find(item => item.id === id);
}

// 00202 docetaxel
assert.strictEqual(rule("00202", "platelets_below_cutoff"), undefined, "00202 must not retain an unsupported platelet cutoff");
assert.strictEqual(rule("00202", "anc_below_cutoff").when.value, 1.5);
assert.strictEqual(assess("00202", { anc_x10e9_l: 1.49 }).actionType, "delay");
assert.notStrictEqual(assess("00202", { anc_x10e9_l: 1.5 }).actionType, "delay");
assert.strictEqual(assess("00202", { febrile_neutropenia: true }).actionType, "dose_reduce");

// Endocrine monotherapies: remove invented generic grade 3 haematology rules and use source-specific hepatic logic.
for (const code of ["00254", "00361", "00371", "00376"]) {
  assert.strictEqual(rule(code, "severe_reported_toxicity_review"), undefined, `${code} must not retain generic unsupported haematological grade logic`);
}
assert.strictEqual(assess("00254", { child_pugh_class: "C" }).actionType, "withhold");
assert.strictEqual(assess("00361", { child_pugh_class: "B" }).actionType, "dose_reduce");
assert.strictEqual(assess("00361", { child_pugh_class: "C" }).actionType, "withhold");
assert.strictEqual(assess("00371", { child_pugh_class: "C" }).actionType, "dose_reduce");
assert.strictEqual(assess("00376", { child_pugh_class: "C" }).actionType, "proceed");

// Everolimus/exemestane: exact count bands and Child-Pugh dose percentages.
assert.strictEqual(assess("00322", { anc_x10e9_l: 0.8 }).actionType, "withhold");
assert.strictEqual(assess("00322", { anc_x10e9_l: 0.4 }).actionType, "withhold_then_reduce");
assert.strictEqual(assess("00322", { platelets_x10e9_l: 60 }).actionType, "withhold");
assert.strictEqual(assess("00322", { platelets_x10e9_l: 40 }).actionType, "withhold_then_reduce");
for (const cp of ["A", "B", "C"]) assert.strictEqual(assess("00322", { child_pugh_class: cp }).actionType, "dose_reduce");

// FEC50 and AT corrected ANC thresholds; already-concordant platelet rules gain source pointers.
assert.strictEqual(rule("00269", "anc_below_cutoff").when.value, 1.5);
assert.strictEqual(assess("00269", { anc_x10e9_l: 1.2 }).actionType, "delay");
assert.ok(rule("00269", "platelets_below_cutoff").source);
assert.strictEqual(rule("00423", "anc_below_cutoff").when.value, 1.5);
assert.strictEqual(assess("00423", { anc_x10e9_l: 1.2 }).actionType, "delay");

// CMF: 1.0-1.49 ANC and 70-89 platelets now produce 75% dose rather than delay.
for (const code of ["00377", "00378", "00381"]) {
  assert.strictEqual(assess(code, { anc_x10e9_l: 1.2 }).actionType, "dose_reduce", `${code} ANC 1.2 should give 75% dose`);
  assert.strictEqual(assess(code, { anc_x10e9_l: 0.9 }).actionType, "delay", `${code} ANC 0.9 should delay`);
  assert.strictEqual(assess(code, { platelets_x10e9_l: 80 }).actionType, "dose_reduce", `${code} platelets 80 should give 75% dose`);
  assert.strictEqual(assess(code, { platelets_x10e9_l: 60 }).actionType, "delay", `${code} platelets 60 should delay`);
}

// Eribulin platelet threshold corrected to <75.
assert.strictEqual(rule("00743", "platelets_below_cutoff").when.value, 75);
assert.notStrictEqual(assess("00743", { platelets_x10e9_l: 80 }).actionType, "delay");
assert.strictEqual(assess("00743", { platelets_x10e9_l: 70 }).actionType, "delay");

// Gemcitabine monotherapy: day-specific logic.
assert.strictEqual(assess("00749", { treatment_day: "day1", anc_x10e9_l: 1.0, platelets_x10e9_l: 150 }).actionType, "delay");
assert.strictEqual(assess("00749", { treatment_day: "day1", anc_x10e9_l: 1.1, platelets_x10e9_l: 100 }).actionType, "delay");
assert.strictEqual(assess("00749", { treatment_day: "day8", anc_x10e9_l: 0.8, platelets_x10e9_l: 150 }).actionType, "dose_reduce");
assert.strictEqual(assess("00749", { treatment_day: "day15", anc_x10e9_l: 0.4, platelets_x10e9_l: 150 }).actionType, "omit");
assert.strictEqual(assess("00749", { anc_x10e9_l: 0.8 }).actionType, "partial_context_required", "missing treatment day should not invent a day-specific action");

// Weekly paclitaxel/trastuzumab: exact platelet/ANC bands and duration-dependent severe neutropenia reduction.
assert.notStrictEqual(assess("00815", { platelets_x10e9_l: 90 }).actionType, "delay");
assert.strictEqual(assess("00815", { platelets_x10e9_l: 80 }).actionType, "delay");
assert.strictEqual(assess("00815", { platelets_x10e9_l: 60 }).actionType, "delay_then_dose_reduce");
assert.strictEqual(assess("00815", { anc_x10e9_l: 0.8 }).actionType, "delay");
assert.strictEqual(assess("00815", { anc_x10e9_l: 0.4, anc_below_0_5_duration_days: 3 }).actionType, "delay");
assert.strictEqual(assess("00815", { anc_x10e9_l: 0.4, anc_below_0_5_duration_days: 7 }).actionType, "delay_then_dose_reduce");

// Previously source-less but concordant rules must now carry explicit source objects.
for (const [code, id] of [
  ["00262", "anc_below_cutoff"], ["00262", "platelets_below_cutoff"],
  ["00263", "anc_below_cutoff"], ["00263", "platelets_below_cutoff"],
  ["00269", "platelets_below_cutoff"], ["00377", "platelets_below_cutoff"],
  ["00378", "platelets_below_cutoff"], ["00381", "platelets_below_cutoff"],
  ["00423", "platelets_below_cutoff"], ["00743", "anc_below_cutoff"]
]) assert.ok(rule(code, id).source, `${code}/${id} should have a source pointer`);

console.log("v0.62.2 publication audit reconciliation regression tests passed.");
