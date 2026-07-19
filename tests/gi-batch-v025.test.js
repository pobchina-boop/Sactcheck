const fs = require('fs');
const assert = require('assert');
const Engine = require('../js/assessment-engine.js');
const Validator = require('../js/protocol-validator.js');

const cases = [
  ['protocols/gastrointestinal/00216-capecitabine-monotherapy.json', 'nccp-00216-v8', 'CRCL_LT30', {crcl_ml_min: 25}],
  ['protocols/gastrointestinal/00660-5fu-folinic-acid.json', 'nccp-00660-v2b', 'ANC_DAY1_HOLD', {anc_x10e9_l: 0.8}],
  ['protocols/gastrointestinal/00555-folfoxiri.json', 'nccp-00555-v6b', 'CRCL_LT30', {crcl_ml_min: 20}],
  ['protocols/gastrointestinal/00244-regorafenib.json', 'nccp-00244-v5', 'LIVER_G4', {alt_ast_ratio_uln: 25}],
  ['protocols/gastrointestinal/00382-trifluridine-tipiracil.json', 'nccp-00382-v3', 'RENAL_15_29', {crcl_ml_min: 20}]
];

for (const [file, id, expectedRule, override] of cases) {
  const protocol = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.strictEqual(protocol.protocol_id, id);
  const validation = Validator.validate(protocol, {strict: true});
  assert(validation.valid, `${file} must validate: ${Validator.formatIssues(validation).join('\n')}`);
  assert(protocol.metadata.source_url.includes('healthservice.hse.ie/documents/'), `${file} must include official NCCP PDF`);
  assert.strictEqual(protocol.metadata.migration.mode, 'live_json');
  const defs = Engine.getInputDefinitions(protocol);
  const demo = Object.fromEntries(defs.map(d => [d.id, d.demo_value]));
  const result = Engine.assess(protocol, {...demo, ...override});
  assert(result.findings.some(r => r.ruleId === expectedRule), `${file} should trigger ${expectedRule}`);
}

const index = JSON.parse(fs.readFileSync('protocols/index.json','utf8'));
for (const [, id] of cases) {
  const item = index.protocols.find(p => p.id === id);
  assert(item, `${id} must be in index`);
  assert.strictEqual(item.mode, 'live_json');
}
assert.strictEqual(index.protocol_count, 13);
console.log('v0.25 GI five-protocol batch tests passed.');
