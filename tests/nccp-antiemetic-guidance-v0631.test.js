#!/usr/bin/env node
"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const readJson = file => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const pkg = readJson("package.json");
const riskMap = readJson("data/emetogenic-risk-map.json");
const index = readJson("protocols/index.json");
const classificationBaseline = readJson("V0630_EMETOGENIC_CLASSIFICATION_SNAPSHOT.json");
const clinicalCoreBaseline = readJson("V0630_CLINICAL_CORE_HASHES.json");
// NCCP source-audited v0.84.0 phases replace legacy whole-course classifications.
const familyPhases = {
  '00858':{taxane_platinum:'moderate',ac:'high',adjuvant:'minimal'},'00860':{taxane_platinum:'high',ac:'high',paclitaxel_only:'low',adjuvant:'minimal'},'00861':{taxane_platinum:'moderate',ac:'high',adjuvant:'minimal'},'00348':{taxane_platinum:'high',ac:'high',paclitaxel_only:'low'},'00734':{taxane_platinum:'moderate',ac:'high'},
  '00260':{ac:'high',paclitaxel:'low'}, '00278':{ac:'high',paclitaxel:'low'},
  '00316':{ac:'high',paclitaxel:'low',continuation:'minimal'},
  '00432':{ac:'high',paclitaxel:'low',continuation:'minimal'},
  '00433':{ac:'high',paclitaxel:'low',continuation:'minimal'},
  '00745':{ac:'high',paclitaxel:'low',continuation:'minimal'},
  '00258':{combination:'high',continuation:'minimal'},
  '00204':{combination:'low',continuation:'minimal'},
  '00507':{combination:'low',continuation:'minimal'},
  '00512':{combination:'low',continuation:'minimal'}
};
const resolver = fs.readFileSync(path.join(root, "js", "emetogenic-risk.js"), "utf8");
const ui = fs.readFileSync(path.join(root, "js", "generic-assessment-ui.js"), "utf8");

const MED = "https://healthservice.hse.ie/documents/7180/Supportive_Care_Antiemetics_for_inclusion_NCIS_Medical_Oncology.pdf";
const HAEM = "https://assets.hse.ie/media/documents/NCCP_Antiemetics_in_NCISHaem-Onc.pdf";

assert.ok(pkg.version.localeCompare("0.63.1", undefined, { numeric: true }) >= 0, "package version must retain v0.63.1 or later functionality");
assert.strictEqual(riskMap.release, "0.48.0", "emetogenic classification release must remain unchanged");
assert.strictEqual(riskMap.guidance_link_release, "0.63.1");
assert.strictEqual(riskMap.source.medical_oncology_antiemetic_guidance_url, MED);
assert.strictEqual(riskMap.source.haemato_oncology_antiemetic_guidance_url, HAEM);
assert.ok(resolver.includes("medical_oncology_antiemetic_guidance_url"));
assert.ok(resolver.includes("haemato_oncology_antiemetic_guidance_url"));
assert.ok(ui.includes("Open NCCP emetogenic classification source"));

for (const [id, script] of Object.entries(riskMap.scripts || {})) {
  assert.ok(/^https:\/\//.test(script.url || ""), `${id} must use a national NCCP web link`);
  assert.ok(!/CUH/i.test(script.label || ""), `${id} must not expose a CUH antiemetic label`);
  assert.strictEqual(script.status, "national_guidance_link", `${id} must be marked as national guidance`);
}

const currentMapLevels = Object.fromEntries(Object.entries(riskMap.protocols || {}).map(([code, rec]) => [code, {
  level: rec.level,
  phase_levels: Object.fromEntries(Object.entries(rec.phase_profiles || {}).map(([k, v]) => [k, v?.level]))
}]));
if (pkg.version.localeCompare("0.64.0", undefined, { numeric: true }) < 0) {
  assert.deepStrictEqual(currentMapLevels, classificationBaseline.protocol_risk_map_levels, "central emetogenic classifications must remain unchanged");
} else {
  const allowedCorrections = {
    "00225": "low", // v0.83.5: NCCP V6 table 7 and 00225 v6
    "00586": "oral_minimal_low", // v0.83.4 NCCP capecitabine oral risk
    "00623": "oral_minimal_low",
    "00844": "moderate",
    "00449": "moderate", // v0.83.3: NCCP 00449 v6a p6
    "00446": "moderate", // v0.83.3: NCCP 00446 v7b p6
    "00945": "low",
    "00431": "low"
  };
  for (const [code, baseline] of Object.entries(classificationBaseline.protocol_risk_map_levels)) {
    const expected = allowedCorrections[code] || baseline.level;
    assert.strictEqual(currentMapLevels[code]?.level, expected, `${code} emetogenic classification differs from the retained baseline or approved v0.64.0 correction`);
  }
}

let protocolCount = 0;
let medicalLinks = 0;
let haemLinks = 0;
for (const record of index.protocols || []) {
  if (record.enabled === false) continue;
  const file = path.join(root, record.path);
  const protocol = JSON.parse(fs.readFileSync(file, "utf8"));
  protocolCount += 1;
  const relative = path.relative(path.join(root, "protocols"), file).replace(/\\/g, "/");
  const sc = protocol.supportive_care || {};
  const md = protocol.metadata || {};
  const baseline = classificationBaseline.protocol_supportive_care_levels[relative];
  if(sc.phase_specific_plan&&!sc.emetogenic_risk){assert(fs.existsSync(path.join(root,sc.phase_specific_plan)),relative+' lacks authored phase selector');assert(sc.source_url,relative+' lacks source');}
  else if (baseline) {
    const correctionByPath = {
      "gastrointestinal/00225-panitumumab-6-mg-kg-therapy.json": "low",
      "gastrointestinal/00586-capecitabine-825-mg-m2-and-radiotherapy-7-day.json": "oral_minimal_low",
      "gastrointestinal/00623-bevacizumab-7-5-mg-kg-and-capecitabine-1250-mg-m2-therapy.json": "oral_minimal_low",
      "gastrointestinal/00844-nivolumab-modified-folfox6.json": "moderate",
      "gastrointestinal/00449-bevacizumab-folfiri.json": "moderate",
      "gastrointestinal/00446-bevacizumab-modified-folfox6.json": "moderate",
      "genitourinary/00945-enfortumab-vedotin-and-pembrolizumab-therapy.json": "low",
      "skin/00431-nivolumab-1-mg-kg-and-ipilimumab-3-mg-kg-therapy.json": "low"
    };
    const expectedRisk = pkg.version.localeCompare("0.64.0", undefined, { numeric: true }) >= 0 && correctionByPath[relative]
      ? correctionByPath[relative]
      : (baseline.emetogenic_risk ?? null);
    const auditedPhases = familyPhases[md.nccp_regimen_code];
    assert.strictEqual(sc.emetogenic_risk ?? null, auditedPhases ? 'phase_dependent' : expectedRisk, `${relative} emetogenic risk changed outside approved source reconciliation`);
    const phaseLevels = Object.fromEntries(Object.entries(sc.phase_profiles || {}).map(([k, v]) => [k, v?.emetogenic_risk ?? v?.level]));
    assert.deepStrictEqual(phaseLevels, auditedPhases || baseline.phase_levels || {}, `${relative} phase risk classification changed`);
  }
  for (const [label, url] of [["supportive", sc.supportive_medications_pdf_url], ["metadata", md.antiemetic_proforma_url]]) {
    if (!url) continue;
    assert.ok(url === MED || url === HAEM, `${relative} ${label} antiemetic link must use national NCCP guidance`);
    if (url === MED) medicalLinks += 1;
    if (url === HAEM) haemLinks += 1;
  }
  assert.ok(!/CUH.*(?:antiem|supportive|prescription sheet)|(?:antiem|supportive).*CUH/i.test(JSON.stringify({
    supportive_medications_label: sc.supportive_medications_label,
    provenance: sc.provenance,
    antiemetic_proforma_url: md.antiemetic_proforma_url
  })), `${relative} must not expose CUH antiemetic source wording`);

  const core = {
    input_definitions: protocol.input_definitions,
    required_inputs: protocol.required_inputs,
    rule_engine: protocol.rule_engine,
    treatment: protocol.treatment,
    eligibility: protocol.eligibility,
    exclusions: protocol.exclusions
  };
  const actualCoreHash = crypto.createHash("sha256").update(JSON.stringify(core, Object.keys(core).sort())).digest("hex");
  // Use stable deep sort to match baseline.
  function stable(value) {
    if (Array.isArray(value)) return value.map(stable);
    if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(k => [k, stable(value[k])]));
    return value;
  }
  const stableHash = crypto.createHash("sha256").update(JSON.stringify(stable(core))).digest("hex");
  if (pkg.version === "0.63.1") {
    assert.strictEqual(stableHash, clinicalCoreBaseline.hashes[relative], `${relative} clinical core changed during antiemetic link migration`);
  }
}

assert.strictEqual(protocolCount, 376);
assert.ok(medicalLinks > 0, "medical oncology protocols must link national NCCP medical oncology antiemetic guidance");

const localDir = path.join(root, "assets", "supportive-care");
if (fs.existsSync(localDir)) {
  const localPdfs = fs.readdirSync(localDir).filter(name => /Antiemetics_|Docetaxel_Supportive/i.test(name));
  assert.deepStrictEqual(localPdfs, [], "local CUH antiemetic and supportive prescription PDFs must not remain in active assets");
}


(async () => {
  const context = {
    console,
    fetch: async () => ({ ok: true, json: async () => riskMap })
  };
  context.globalThis = context;
  vm.runInNewContext(resolver, context);
  await context.SACTCheckEmetogenicRisk.load("data/emetogenic-risk-map.json");
  for (const [code, phases] of Object.entries(familyPhases)) {
    const record = index.protocols.find(p=>String(p.nccp_regimen_code || p.code || p.id).includes(code) || p.path.includes('/'+code+'-'));
    const protocol = readJson(record.path), risk = context.SACTCheckEmetogenicRisk;
    assert.strictEqual(risk.get(protocol).level, 'phase_dependent');
    assert.strictEqual(risk.get(protocol).scriptId, null, 'No old whole-course script without a selected phase');
    assert.strictEqual(risk.get(protocol).subsequentDays, null);
    for (const [phase, level] of Object.entries(phases)) {
      const selected=risk.get(protocol,{treatmentPhase:phase});
      assert.strictEqual(selected.level,level,code+'/'+phase);
      assert.strictEqual(selected.scriptId,['00858','00860','00861'].includes(code)&&level==='minimal'?'nccp-minimal-no-routine-prophylaxis':'nccp-parenteral-'+level);
    }
    for (const [alias,phase] of Object.entries(protocol.supportive_care.phase_aliases || {})) assert.strictEqual(risk.get(protocol,{treatmentPhase:alias}).level,phases[phase]);
    assert.strictEqual(risk.get(protocol,{treatmentPhase:'unknown'}).scriptId,null);
  }

  const breast = context.SACTCheckEmetogenicRisk.get({
    metadata: { nccp_regimen_code: "TESTMED", tumour_group: "Breast" },
    supportive_care: { emetogenic_risk: "high", script_id: "nccp-parenteral-high" }
  }, { tumourGroup: "Breast" });
  assert.strictEqual(breast.proformaUrl, MED, "medical oncology context must resolve to the national Medical Oncology antiemetic document");

  const haem = context.SACTCheckEmetogenicRisk.get({
    metadata: { nccp_regimen_code: "TESTHAEM", tumour_group: "Haemato Oncology" },
    supportive_care: { emetogenic_risk: "high", script_id: "nccp-parenteral-high" }
  }, { tumourGroup: "Haemato Oncology" });
  assert.strictEqual(haem.proformaUrl, HAEM, "haemato oncology context must resolve to the national Haemato Oncology antiemetic document");

  console.log(`v0.63.1 NCCP antiemetic guidance tests passed for ${protocolCount} enabled protocols. Medical links: ${medicalLinks}. Haem contexts resolve dynamically to the national Haemato Oncology document.`);
})().catch(error => {
  console.error(error);
  process.exit(1);
});
