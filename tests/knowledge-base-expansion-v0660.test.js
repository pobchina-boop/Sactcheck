#!/usr/bin/env node
"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const ROOT = path.resolve(__dirname, "..");
const read = p => fs.readFileSync(path.join(ROOT, p), "utf8");
const readJson = p => JSON.parse(read(p));

const pkg = readJson("package.json");
const kb = readJson("data/regimen-knowledge-base-v0660.json");
const js = read("js/regimen-knowledge-base.js");
const register = readJson("data/clinical-validation-register-v0630.json");

assert.strictEqual(pkg.version, "0.66.0");
assert.strictEqual(kb.release, "0.66.0");
assert.strictEqual(kb.regimen_profiles.length, 27, "knowledge base must contain 27 profiles");
assert.strictEqual(kb.evidence_records.length, 61, "knowledge base must contain 61 principal evidence records");
assert.strictEqual(kb.drug_profiles.length, 32, "knowledge base must contain 32 medicine profiles");
assert.ok(js.includes('const VERSION = "0.66.0"'));
assert.ok(js.includes('data/regimen-knowledge-base-v0660.json'));
assert.strictEqual(register.release, "0.66.0");

for (const id of ["nccp-00344-v9", "nccp-00353-v5", "nccp-00588-v5b"]) {
  const profile = kb.regimen_profiles.find(x => x.protocol_id === id);
  assert.ok(profile, `${id} profile missing`);
  for (const field of ["patient_selection", "supportive_care", "monitoring_and_toxicity", "administration", "evidence_audit"]) {
    assert.ok(profile[field], `${id} missing ${field}`);
  }
  assert.strictEqual(profile.source_checked_date, "2026-08-15");
  assert.ok(/Two pass evidence audit/i.test(profile.evidence_audit.status));
}

assert.ok(kb.drug_profiles.some(x => x.id === "osimertinib"), "osimertinib medicine profile missing");
assert.ok(kb.drug_profiles.some(x => x.id === "olaparib"), "olaparib medicine profile missing");

const evidence = (id, acronym) => kb.evidence_records.find(x => x.protocol_id === id && x.trial_acronym === acronym);
assert.ok(evidence("nccp-00344-v9", "FLOT4 AIO"), "FLOT4 evidence missing");

for (const acronym of ["AURA3", "FLAURA", "ADAURA", "FLAURA2"]) {
  assert.ok(evidence("nccp-00353-v5", acronym), `${acronym} osimertinib evidence missing`);
}
assert.ok((evidence("nccp-00353-v5", "FLAURA").supporting_publications || []).some(x => /overall survival/i.test(x.label || "")), "FLAURA overall survival follow up missing");
assert.ok((evidence("nccp-00353-v5", "ADAURA").supporting_publications || []).some(x => /overall survival/i.test(x.label || "")), "ADAURA overall survival follow up missing");
const flaura2 = evidence("nccp-00353-v5", "FLAURA2");
assert.ok(/contextual combination/i.test(flaura2.match_type || ""), "FLAURA2 must remain contextual combination evidence");
assert.ok(/must not create/i.test(flaura2.limitations || ""), "FLAURA2 must not generate an unencoded pathway");

for (const acronym of ["SOLO1", "SOLO2", "PROfound", "OlympiA", "POLO", "PAOLA 1"]) {
  assert.ok(evidence("nccp-00588-v5b", acronym), `${acronym} olaparib evidence missing`);
}
const paola = evidence("nccp-00588-v5b", "PAOLA 1");
assert.ok(/contextual combination/i.test(paola.match_type || ""), "PAOLA 1 must remain contextual combination evidence");
assert.ok(/must not create/i.test(paola.limitations || ""), "PAOLA 1 must not create a combination pathway within monotherapy");

const olaparibProfile = kb.regimen_profiles.find(x => x.protocol_id === "nccp-00588-v5b");
for (const expected of ["ovarian", "prostate", "breast", "pancreatic"]) {
  assert.ok(JSON.stringify(olaparibProfile.evidence_audit).toLowerCase().includes(expected), `olaparib audit missing ${expected} context`);
}

// Clinical protocol JSON must remain byte identical to the v0.65.0 project baseline hashes.
const baseline = readJson("V0650_PROTOCOL_JSON_HASHES.json");
const currentFiles = [];
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full);
    else if (name.endsWith(".json")) currentFiles.push(full);
  }
}
walk(path.join(ROOT, "protocols"));
for (const full of currentFiles) {
  const rel = path.relative(ROOT, full).replace(/\\/g, "/");
  const expected = baseline[rel];
  if (!expected) continue;
  const actual = crypto.createHash("sha256").update(fs.readFileSync(full)).digest("hex");
  assert.strictEqual(actual, expected, `${rel} changed unexpectedly`);
}

console.log("v0.66.0 knowledge base expansion tests passed for 27 profiles, 61 evidence records, two new medicine profiles and unchanged clinical protocol JSON.");
