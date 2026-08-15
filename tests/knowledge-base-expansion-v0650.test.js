#!/usr/bin/env node
"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const read = p => fs.readFileSync(path.join(ROOT, p), "utf8");
const readJson = p => JSON.parse(read(p));

const pkg = readJson("package.json");
const kb = readJson("data/regimen-knowledge-base-v0650.json");
const js = read("js/regimen-knowledge-base.js");
const register = readJson("data/clinical-validation-register-v0630.json");

assert.strictEqual(pkg.version, "0.65.0");
assert.strictEqual(kb.release, "0.65.0");
assert.strictEqual(kb.regimen_profiles.length, 24, "knowledge base must contain 24 profiles");
assert.strictEqual(kb.evidence_records.length, 50, "knowledge base must contain 50 principal evidence records");
assert.strictEqual(kb.drug_profiles.length, 30, "knowledge base must contain 30 medicine profiles");
assert.ok(js.includes('const VERSION = "0.65.0"'));
assert.ok(js.includes('data/regimen-knowledge-base-v0650.json'));
assert.strictEqual(register.release, "0.65.0");

for (const id of ["nccp-00546-v3", "nccp-00583-v3b", "nccp-00535-v6b"]) {
  const profile = kb.regimen_profiles.find(x => x.protocol_id === id);
  assert.ok(profile, `${id} profile missing`);
  for (const field of ["patient_selection", "supportive_care", "monitoring_and_toxicity", "administration", "evidence_audit"]) {
    assert.ok(profile[field], `${id} missing ${field}`);
  }
  assert.strictEqual(profile.source_checked_date, "2026-08-15");
  assert.ok(/Two pass evidence audit/i.test(profile.evidence_audit.status));
}

assert.ok(kb.drug_profiles.some(x => x.id === "prednisolone"), "prednisolone medicine profile missing");
assert.ok(kb.drug_profiles.some(x => x.id === "avelumab"), "avelumab medicine profile missing");

const evidence = (id, acronym) => kb.evidence_records.find(x => x.protocol_id === id && x.trial_acronym === acronym);
assert.ok(evidence("nccp-00546-v3", "TAX 327"), "TAX 327 evidence missing");
assert.ok((evidence("nccp-00546-v3", "TAX 327").supporting_publications || []).some(x => /updated survival/i.test(x.label || "")), "TAX 327 updated survival missing");
assert.ok(evidence("nccp-00583-v3b", "KEYNOTE 426"), "KEYNOTE 426 evidence missing");
assert.ok((evidence("nccp-00583-v3b", "KEYNOTE 426").supporting_publications || []).some(x => /5 year/i.test(x.label || "")), "KEYNOTE 426 five year follow up missing");
assert.ok(evidence("nccp-00535-v6b", "JAVELIN Bladder 100"), "JAVELIN Bladder 100 missing");
assert.ok(evidence("nccp-00535-v6b", "JAVELIN Merkel 200 Part A"), "JAVELIN Merkel 200 Part A missing");
const mccB = evidence("nccp-00535-v6b", "JAVELIN Merkel 200 Part B");
assert.ok(mccB, "JAVELIN Merkel 200 Part B contextual evidence missing");
assert.ok(/contextual/i.test(mccB.match_type), "first line Merkel evidence must remain contextual");
assert.ok(/must not create an unencoded/i.test(mccB.limitations), "first line Merkel evidence boundary missing");

const avelumab = readJson("protocols/genitourinary/00535-avelumab-monotherapy.json");
assert.strictEqual(avelumab.metadata.source_url, "https://healthservice.hse.ie/documents/8038/535_Avelumab.pdf", "Avelumab must use the current official source URL");
const uc = avelumab.indications.find(x => x.indication_id === "00535-gu");
assert.ok(uc, "Avelumab urothelial indication missing");
assert.strictEqual(uc.code, "00535b", "urothelial avelumab regimen code must be 00535b");
const mcc = avelumab.indications.find(x => x.indication_id === "00535a");
assert.ok(mcc && mcc.code === "00535a", "Merkel avelumab regimen code must remain 00535a");

for (const f of ["protocols/genitourinary/00546-docetaxel-prednisolone.json", "protocols/genitourinary/00583-pembrolizumab-200-mg-and-axitinib-therapy.json", "protocols/genitourinary/00535-avelumab-monotherapy.json"]) {
  const p = readJson(f);
  assert.ok(p.supportive_care && p.supportive_care.emetogenic_risk, `${f} emetogenic risk missing`);
}

console.log("v0.65.0 knowledge base expansion tests passed for 24 profiles, 50 evidence records and current Avelumab source mapping.");
