const assert = require("assert");
const fs = require("fs");
const path = require("path");
const Engine = require("../js/assessment-engine.js");

const root = path.resolve(__dirname, "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const app = JSON.parse(fs.readFileSync(path.join(root, "data/app-release.json"), "utf8"));
const index = JSON.parse(fs.readFileSync(path.join(root, "protocols/index.json"), "utf8"));

assert.ok(pkg.version.localeCompare("0.68.0", undefined, { numeric: true }) >= 0);
assert.strictEqual(app.release, pkg.version);
assert.strictEqual(index.protocols.length, 376);

function read(rel) { return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8")); }
function protocol(code) {
  const entry = index.protocols.find(item => item.path.includes(`/${code}-`) || String(item.metadata?.nccp_regimen_code || "").padStart(5,"0") === code);
  assert(entry, `Missing protocol ${code}`);
  return read(entry.path);
}
function assess(code, values) { return Engine.assess(protocol(code), values, { profileId: "default" }); }
function ruleId(rule) { return String(rule.id || rule.rule_id || ""); }
function condition(rule) {
  if (rule.when && typeof rule.when === "object") return rule.when;
  for (const key of ["all","any","none","not"]) if (rule[key] !== undefined) return { [key]: rule[key] };
  if (rule.field) {
    const out = {};
    for (const key of ["field","operator","value","min","max","values"]) if (rule[key] !== undefined) out[key] = rule[key];
    return out;
  }
  return {};
}
function canonical(value) { return JSON.stringify(value, Object.keys(value || {}).sort()); }
function scanSelectReachability(node, defs, protocolId, rid) {
  if (!node || typeof node !== "object") return;
  if (node.field && ["==","in"].includes(node.operator) && defs[node.field]?.type === "select") {
    const options = new Set((defs[node.field].options || []).map(item => String(item.value)));
    const values = node.operator === "in" ? (Array.isArray(node.value) ? node.value : []) : [node.value];
    for (const value of values) assert(options.has(String(value)), `${protocolId}/${rid}: unreachable select value ${value} for ${node.field}`);
  }
  for (const key of ["all","any","none"]) for (const child of Array.isArray(node[key]) ? node[key] : []) scanSelectReachability(child, defs, protocolId, rid);
  if (node.not && typeof node.not === "object") scanSelectReachability(node.not, defs, protocolId, rid);
}

// Library wide provenance, maturity, role and rule integrity controls.
for (const entry of index.protocols) {
  const p = read(entry.path);
  assert(p.metadata?.encoding_maturity, `${entry.path}: missing encoding maturity`);
  assert.strictEqual(p.metadata?.validation?.clinical_use_authorised, false, `${entry.path}: must remain unauthorised pending formal validation`);
  const defs = p.input_definitions || {};
  for (const [field, def] of Object.entries(defs)) {
    assert(def.input_role, `${entry.path}/${field}: missing input role`);
    assert.notStrictEqual(def.demo_value, undefined, `${entry.path}/${field}: missing demo value`);
  }
  const grouped = new Map();
  for (const rule of p.rule_engine?.rules || []) {
    const rid = ruleId(rule);
    assert(rule.source && typeof rule.source === "object", `${entry.path}/${rid}: missing source object`);
    assert(rule.explanation, `${entry.path}/${rid}: missing explanation`);
    scanSelectReachability(condition(rule), defs, p.protocol_id, rid);
    const key = JSON.stringify(condition(rule));
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(rule);
  }
  for (const rules of grouped.values()) {
    for (let i=0; i<rules.length; i++) for (let j=i+1; j<rules.length; j++) {
      const ai = rules[i].action || {}, aj = rules[j].action || {};
      if (ai.type === aj.type) continue;
      const ci = new Set(ai.components || rules[i].components || []);
      const cj = new Set(aj.components || rules[j].components || []);
      const overlap = ci.size === 0 || cj.size === 0 || [...ci].some(component => cj.has(component));
      assert(!overlap, `${entry.path}: identical condition has conflicting actions for overlapping components: ${ruleId(rules[i])} and ${ruleId(rules[j])}`);
    }
  }
}

const sourceReconciled = ["00202","00815","00423","00377","00378","00381","00262","00263","00269","00743","00749"];
for (const code of sourceReconciled) {
  const p = protocol(code);
  assert.strictEqual(p.metadata.encoding_maturity.source_reconciled, true, `${code} source reconciliation flag`);
  assert.strictEqual(p.metadata.encoding_maturity.reconciled_release, "0.68.0", `${code} reconciliation release`);
}

// Source fidelity sentinels from the v0.68.0 audit remediation.
let result = assess("00202", { anc_x10e9_l: 1.2 });
assert.strictEqual(result.actionType, "delay");
assert(result.findings.some(f => f.ruleId === "DOC202_ANC_LT1_5"));
assert.strictEqual(protocol("00202").input_definitions.platelets_x10e9_l.input_role, "monitoring");
assert(!protocol("00202").rule_engine.rules.some(r => /PLT|platelet/i.test(ruleId(r))));

result = assess("00815", { platelets_x10e9_l: 95 });
assert(!["delay","withhold","dose_reduce","delay_then_dose_reduce"].includes(result.actionType), "00815 platelets 95 should not hit the old 100 threshold");
result = assess("00815", { platelets_x10e9_l: 85 });
assert.strictEqual(result.actionType, "delay");
result = assess("00815", { lvef_drop_points_from_baseline: 12, current_lvef_percent: 45 });
assert.strictEqual(result.actionType, "withhold");

result = assess("00423", { anc_x10e9_l: 1.2 });
assert.strictEqual(result.actionType, "delay");

for (const code of ["00377","00378","00381"]) {
  result = assess(code, { anc_x10e9_l: 1.2 });
  assert.strictEqual(result.actionType, "dose_reduce", `${code}: ANC intermediate band`);
  result = assess(code, { dpd_status: "complete" });
  assert.strictEqual(result.actionType, "contraindicated", `${code}: complete DPD deficiency`);
}

for (const code of ["00262","00263"]) {
  result = assess(code, { bilirubin_umol_l: 90 });
  assert(["omit","withhold","contraindicated"].includes(result.actionType), `${code}: high bilirubin epirubicin action`);
  result = assess(code, { crcl_ml_min: "10_20" });
  assert.strictEqual(result.actionType, "dose_reduce", `${code}: cyclophosphamide renal action`);
}

result = assess("00269", { dpd_status: "complete" });
assert.strictEqual(result.actionType, "contraindicated");
result = assess("00269", { anc_x10e9_l: 1.2 });
assert.strictEqual(result.actionType, "delay");

result = assess("00743", { assessment_phase: "treatment_day", platelets_x10e9_l: 60 });
assert.strictEqual(result.actionType, "delay");
result = assess("00743", { child_pugh_class: "C" });
assert.strictEqual(result.actionType, "contraindicated");
result = assess("00743", { current_eribulin_dose_level: "0.97", anc_below_0_5_more_than_7_days: true });
assert.strictEqual(result.actionType, "dose_reduce");
assert(result.findings.some(f => f.ruleId === "ERI743_TRIGGER_AT_0_97"));

result = assess("00749", { assessment_phase: "cycle_day_8_15", anc_x10e9_l: 0.8 });
assert.strictEqual(result.actionType, "dose_reduce");
result = assess("00749", { assessment_phase: "cycle_day_8_15", platelets_x10e9_l: 40 });
assert.strictEqual(result.actionType, "omit");
result = assess("00749", { bilirubin_umol_l: 30 });
assert.strictEqual(result.actionType, "consultant_review");

// Specific structural defects found in the deep audit.
const mf = protocol("00515");
const hfs = mf.rule_engine.rules.find(r => ruleId(r) === "HAND_FOOT_CURRENT_G2_HOLD");
assert(hfs);
assert.strictEqual(hfs.all[0].field, "hand_foot_syndrome_current_grade");
assert.strictEqual(hfs.field, undefined);
for (const code of ["00235","00380","00460","00473","00502"]) {
  const ids = new Set(protocol(code).rule_engine.rules.map(ruleId));
  for (const stale of ["CISPLATIN_CRCL_45_59","CISPLATIN_CRCL_LT45","CISPLATIN_DIALYSIS"]) assert(!ids.has(stale), `${code}: stale cisplatin rule ${stale}`);
}
assert(!protocol("00212").metadata.tumour_groups.includes("Lung"));
assert(protocol("00215").metadata.tumour_groups.includes("Breast"));

// UI semantics, injection protection and clinician facing boundaries.
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const ui = fs.readFileSync(path.join(root, "js/generic-assessment-ui.js"), "utf8");
const validationUi = fs.readFileSync(path.join(root, "js/clinical-validation-workspace.js"), "utf8");
assert(!html.includes("searchSummary.innerHTML=q?"), "search query must not be interpolated into innerHTML");
assert(html.includes("searchSummary.replaceChildren()"));
assert(ui.includes("Encoded rule coverage complete"));
assert(ui.includes("encoded applicable rules assessed"));
assert(ui.includes("Monitoring only"));
assert(!html.includes("place the validated JSON under <code>protocols/</code> and push it"));
assert(!html.includes("repository workflow validates it"));
assert(html.includes("Protocol preview"));
assert(validationUi.includes("Do not enter names, MRNs, dates of birth"));
assert(validationUi.includes("Before exporting, confirm that this validation record contains no patient identifiers"));
for (const match of html.matchAll(/(?:src|href)="([^\"#]+\.(?:js|css)(?:\?[^\"#]*)?)"/g)) {
  const url = match[1];
  if (/^(?:https?:)?\/\//.test(url)) continue;
  assert(url.includes(`app=${pkg.version}`), `Runtime asset lacks cumulative app cache key: ${url}`);
}

// Knowledge evidence governance.
const kb = read("data/regimen-knowledge-base-v0680.json");
assert.strictEqual(kb.release, "0.68.0");
assert.strictEqual(kb.regimen_profiles.length, 30);
assert.strictEqual(kb.evidence_records.length, 66);
const allowedRelationships = new Set([
  "Protocol-defining evidence",
  "Indication-supporting evidence",
  "Practice-changing subsequent evidence",
  "Combination/add-on evidence",
  "Contextual or sequencing evidence",
  "Negative or limiting evidence",
  "Not directly applicable to encoded protocol"
]);
for (const evidence of kb.evidence_records) {
  assert(allowedRelationships.has(evidence.evidence_relationship), `Non canonical evidence relationship: ${evidence.evidence_relationship}`);
  assert.strictEqual(evidence.structured_evidence_status, "complete_structured_trial_fields", `${evidence.trial_acronym}: incomplete structured evidence`);
  assert(evidence.evidence_id, `${evidence.trial_acronym}: missing canonical evidence ID`);
  for (const field of ["trial_population","intervention","comparator","primary_endpoint","key_findings"]) assert(evidence[field] && (Array.isArray(evidence[field]) ? evidence[field].length : true), `${evidence.trial_acronym}: missing ${field}`);
}
const build = fs.readFileSync(path.join(root, "tools/build-pages-site.js"), "utf8");
assert(build.includes("regimen-knowledge-base-v0680.json"));

console.log("v0.68.0 deep system remediation tests passed across source fidelity, rule integrity, UI safety, governance and evidence structure.");
