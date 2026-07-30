const assert = require("assert");
const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const pkg = require(path.join(root, "package.json"));
const Components = require(path.join(root, "js/regimen-components.js"));
const Attribution = require(path.join(root, "js/toxicity-attribution.js"));
const Course = require(path.join(root, "js/regimen-course-metadata.js"));
const catalogue = require(path.join(root, "protocols/index.json"));

assert.strictEqual(pkg.version, "0.52.4");
assert(index.includes("SACTCheck v0.52.4 — Compact Clinical Inputs &amp; Phase Naming"));
assert(index.includes('<strong>376</strong><span>protocols across Solid Tumour and Haematology</span>'));
assert(!index.includes("361 + 15"));
assert(index.includes("js/regimen-components.js?v=0.51.0"));
assert(index.includes("js/toxicity-attribution.js?v=0.51.0"));
assert(index.includes("css/regimen-components-v0503.css?v=0.51.0"));

const cybord = require(path.join(root, "protocols/haemato-oncology/plasma-cell/00299-modified-weekly-cybord.json"));
assert.deepStrictEqual(Components.cardComponents(cybord), ["Bortezomib", "Cyclophosphamide", "Dexamethasone"]);
assert.strictEqual(Course.summarise(cybord).interval, "q28d");

const allHaem = catalogue.protocols.filter(entry => /haemato-oncology/.test(entry.path));
assert.strictEqual(allHaem.length, 15);
allHaem.forEach(entry => {
  const protocol = require(path.join(root, entry.path));
  const expected = Number(protocol?.treatment?.cycle?.length_days);
  assert(expected > 0, `${entry.id}: missing treatment cycle length`);
  assert.strictEqual(Course.summarise(protocol).interval, `q${expected}d`, `${entry.id}: cycle chip not standardised`);
});

let attributedProtocols = 0;
let attributedFields = 0;
let clinicalRulesBefore = 0;
let clinicalRulesAfter = 0;
catalogue.protocols.forEach(entry => {
  const protocol = require(path.join(root, entry.path));
  const before = JSON.stringify(protocol.rule_engine?.rules || []);
  const decorated = Attribution.decorate(protocol);
  const records = Attribution.audit(protocol);
  if (records.length) attributedProtocols += 1;
  attributedFields += records.length;
  clinicalRulesBefore += before.length;
  clinicalRulesAfter += JSON.stringify(decorated.rule_engine?.rules || []).length;
  assert.strictEqual(JSON.stringify(decorated.rule_engine?.rules || []), before, `${entry.id}: attribution changed rules`);
});
assert(attributedProtocols >= 80, `only ${attributedProtocols} protocols received source-linked attribution`);
assert(attributedFields >= 250, `only ${attributedFields} toxicity fields received source-linked attribution`);
assert.strictEqual(clinicalRulesAfter, clinicalRulesBefore);

const docetaxel = require(path.join(root, "protocols/breast/00204-pertuzumab-trastuzumab-docetaxel.json"));
const decorated = Attribution.decorate(docetaxel);
assert.strictEqual(decorated.input_definitions.neuropathy_grade.label, "Peripheral neuropathy grade (Docetaxel)");
assert.strictEqual(decorated.input_definitions.hypersensitivity_grade.label, "Infusion/hypersensitivity reaction grade");

console.log(`v0.51.0 card clarity tests passed: ${allHaem.length} Haematology cycles standardised, ${attributedFields} toxicity labels attributed across ${attributedProtocols} protocols.`);
