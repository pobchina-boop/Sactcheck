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
const kb = readJson("data/regimen-knowledge-base-v0670.json");
const js = read("js/regimen-knowledge-base.js");
const register = readJson("data/clinical-validation-register-v0630.json");

assert.strictEqual(pkg.version, "0.67.0");
assert.strictEqual(kb.release, "0.67.0");
assert.strictEqual(kb.regimen_profiles.length, 30, "knowledge base must contain 30 profiles");
assert.strictEqual(kb.evidence_records.length, 66, "knowledge base must contain 66 principal evidence records");
assert.strictEqual(kb.drug_profiles.length, 35, "knowledge base must contain 35 medicine profiles");
assert.ok(js.includes('const VERSION = "0.67.0"'));
assert.ok(js.includes('data/regimen-knowledge-base-v0670.json'));
assert.strictEqual(register.release, "0.67.0");

for (const id of ["nccp-00689-v4", "nccp-00204-v11", "nccp-00415-v4"]) {
  const profile = kb.regimen_profiles.find(x => x.protocol_id === id);
  assert.ok(profile, `${id} profile missing`);
  for (const field of ["patient_selection", "supportive_care", "monitoring_and_toxicity", "administration", "evidence_audit"]) {
    assert.ok(profile[field], `${id} missing ${field}`);
  }
  assert.strictEqual(profile.source_checked_date, "2026-08-15");
  assert.ok(/Two pass evidence audit/i.test(profile.evidence_audit.status));
  const reg = register.protocols.find(x => x.protocol_id === id);
  assert.ok(reg && reg.knowledge_base_profile === true, `${id} validation register not updated`);
}

for (const drug of ["etoposide", "dabrafenib", "trametinib"]) {
  assert.ok(kb.drug_profiles.some(x => x.id === drug), `${drug} medicine profile missing`);
}

const evidence = (id, acronym) => kb.evidence_records.find(x => x.protocol_id === id && x.trial_acronym === acronym);
const impower = evidence("nccp-00689-v4", "IMpower133");
assert.ok(impower, "IMpower133 evidence missing");
assert.ok((impower.supporting_publications || []).some(x => /five year/i.test(x.label || "")), "IMpower133 five year follow up missing");

const cleopatra = evidence("nccp-00204-v11", "CLEOPATRA");
assert.ok(cleopatra, "CLEOPATRA evidence missing");
assert.ok((cleopatra.supporting_publications || []).some(x => /end of study/i.test(x.label || "")), "CLEOPATRA end of study follow up missing");

for (const acronym of ["COMBI d", "COMBI v", "COMBI AD"]) {
  assert.ok(evidence("nccp-00415-v4", acronym), `${acronym} evidence missing`);
}
const combiAd = evidence("nccp-00415-v4", "COMBI AD");
assert.ok((combiAd.supporting_publications || []).some(x => /Final overall survival/i.test(x.label || "")), "COMBI AD final overall survival missing");
assert.ok(/not met|not meet/i.test(combiAd.limitations + " " + (combiAd.key_findings || []).join(" ")), "COMBI AD final OS statistical limitation must remain visible");

const p689 = kb.regimen_profiles.find(x => x.protocol_id === "nccp-00689-v4");
assert.ok(JSON.stringify(p689).toLowerCase().includes("maintenance"), "00689 maintenance context missing");
assert.ok(JSON.stringify(p689).toLowerCase().includes("subcutaneous"), "00689 current subcutaneous atezolizumab option missing");
const p415 = kb.regimen_profiles.find(x => x.protocol_id === "nccp-00415-v4");
assert.ok(JSON.stringify(p415.evidence_audit).toLowerCase().includes("adjuvant"), "00415 adjuvant evidence audit missing");
assert.ok(JSON.stringify(p415.evidence_audit).toLowerCase().includes("metastatic"), "00415 metastatic evidence audit missing");

// Clinical protocol JSON must remain byte identical to the v0.66.0 baseline hashes.
const baseline = readJson("V0660_PROTOCOL_JSON_HASHES.json");
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

console.log("v0.67.0 knowledge base expansion tests passed for 30 profiles, 66 evidence records, three new medicine profiles and unchanged clinical protocol JSON.");
