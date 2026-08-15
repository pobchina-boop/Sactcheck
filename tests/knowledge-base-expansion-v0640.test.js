#!/usr/bin/env node
"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const read = p => fs.readFileSync(path.join(ROOT, p), "utf8");
const readJson = p => JSON.parse(read(p));

const pkg = readJson("package.json");
const kb = readJson("data/regimen-knowledge-base-v0640.json");
const risk = readJson("data/emetogenic-risk-map.json");
const js = read("js/regimen-knowledge-base.js");
const register = readJson("data/clinical-validation-register-v0630.json");

assert.ok(pkg.version.localeCompare("0.64.0", undefined, { numeric: true }) >= 0);
assert.strictEqual(kb.release, "0.64.0");
assert.strictEqual(kb.regimen_profiles.length, 21, "knowledge base must contain 21 full regimen profiles");
assert.strictEqual(kb.evidence_records.length, 45, "knowledge base must contain 45 principal evidence records");
assert.ok(kb.drug_profiles.some(x => x.id === "ipilimumab"), "ipilimumab drug profile missing");
assert.ok(/const VERSION = \"0\.(?:64\.0|65\.0)\";/.test(js));
assert.ok(/data\/regimen-knowledge-base-v0(?:640|650)\.json/.test(js));
assert.ok(register.release.localeCompare("0.64.0", undefined, { numeric: true }) >= 0);

const requiredProfiles = {
  "nccp-00945-v1": ["patient_selection", "supportive_care", "monitoring_and_toxicity", "administration", "evidence_audit"],
  "nccp-00844-v4a": ["patient_selection", "supportive_care", "monitoring_and_toxicity", "administration", "evidence_audit"],
  "nccp-00431-v10": ["patient_selection", "supportive_care", "monitoring_and_toxicity", "administration", "evidence_audit"]
};
for (const [id, fields] of Object.entries(requiredProfiles)) {
  const profile = kb.regimen_profiles.find(x => x.protocol_id === id);
  assert.ok(profile, `${id} full profile missing`);
  for (const field of fields) assert.ok(profile[field], `${id} missing ${field}`);
  assert.strictEqual(profile.source_checked_date, "2026-08-14");
}

const evidence = (id, acronym) => kb.evidence_records.find(x => x.protocol_id === id && x.trial_acronym === acronym);
assert.ok(evidence("nccp-00945-v1", "EV-302 / KEYNOTE-A39"), "EV 302 missing");
assert.ok((evidence("nccp-00945-v1", "EV-302 / KEYNOTE-A39").supporting_publications || []).some(x => /2\.5 year/i.test(x.label || "")), "EV 302 mature follow up missing");
assert.ok(evidence("nccp-00844-v4a", "CheckMate 649"), "CheckMate 649 missing");
assert.ok(evidence("nccp-00844-v4a", "CheckMate 648"), "CheckMate 648 missing for OSCC indication");
assert.ok((evidence("nccp-00844-v4a", "CheckMate 649").supporting_publications || []).some(x => /5 year/i.test(x.label || "")), "CheckMate 649 5 year follow up missing");
assert.ok(evidence("nccp-00431-v10", "CheckMate 067"), "CheckMate 067 missing");
assert.ok((evidence("nccp-00431-v10", "CheckMate 067").supporting_publications || []).some(x => /10 year/i.test(x.label || "")), "CheckMate 067 final 10 year outcomes missing");
assert.ok(evidence("nccp-00431-v10", "CheckMate 204"), "CheckMate 204 CNS context missing");

const expectedRisk = { "00844": "moderate", "00945": "low", "00431": "low" };
for (const [code, level] of Object.entries(expectedRisk)) {
  assert.strictEqual(risk.protocols[code].level, level, `${code} central emetogenic classification incorrect`);
}
const protocolPaths = {
  "00844": "protocols/gastrointestinal/00844-nivolumab-modified-folfox6.json",
  "00945": "protocols/genitourinary/00945-enfortumab-vedotin-and-pembrolizumab-therapy.json",
  "00431": "protocols/skin/00431-nivolumab-1-mg-kg-and-ipilimumab-3-mg-kg-therapy.json"
};
for (const [code, p] of Object.entries(protocolPaths)) {
  const protocol = readJson(p);
  assert.strictEqual(protocol.supportive_care.emetogenic_risk, expectedRisk[code], `${code} protocol emetogenic risk incorrect`);
  assert.ok(/NCCP antiemetic guidance/i.test(protocol.supportive_care.supportive_medications_label || ""));
}

const text = JSON.stringify(kb);
assert.ok(!/CUH.*antiemetic|antiemetic.*CUH/i.test(text), "knowledge base must not expose CUH antiemetic wording");
assert.ok(!/use local low-risk antiemetic policy/i.test(text), "knowledge base must not direct users to retired local antiemetic policy wording");

console.log("v0.64.0 knowledge base expansion tests passed for 21 profiles, 45 principal evidence records and three source confirmed emetogenic corrections.");
