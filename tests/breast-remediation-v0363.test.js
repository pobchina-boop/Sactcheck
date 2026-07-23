const fs = require('fs');
const path = require('path');
const assert = require('assert');
const files = [
  '00204-pertuzumab-trastuzumab-docetaxel.json',
  '00206-t-dm1-metastatic.json',
  '00414-palbociclib.json',
  '00525-ribociclib-metastatic.json',
  '00794-sacituzumab-govitecan.json'
];
for (const file of files) {
  const p = path.join(__dirname, '..', 'protocols', 'breast', file);
  const protocol = JSON.parse(fs.readFileSync(p, 'utf8'));
  assert.equal(protocol.status, 'encoded_prototype_pending_clinical_and_pharmacy_validation');
  assert.strictEqual(protocol.metadata.sactcheck_encoding_version, '0.37.0');
  assert.ok(Object.keys(protocol.input_definitions).length >= 9);
  assert.ok(protocol.rule_engine.rules.length >= 10);
  assert.ok(protocol.metadata.source_url.startsWith('https://'));
}
const p204 = JSON.parse(fs.readFileSync(path.join(__dirname,'..','protocols','breast',files[0]),'utf8'));
assert.ok(p204.rule_engine.rules.some(r=>r.rule_id==='BASELINE_ANC'));
const tdm1 = JSON.parse(fs.readFileSync(path.join(__dirname,'..','protocols','breast',files[1]),'utf8'));
assert.ok(tdm1.rule_engine.rules.some(r=>r.rule_id==='PLT_LT25'));
const palbo = JSON.parse(fs.readFileSync(path.join(__dirname,'..','protocols','breast',files[2]),'utf8'));
assert.ok(palbo.rule_engine.rules.some(r=>r.rule_id==='DAY1_G3_ANC'));
const ribo = JSON.parse(fs.readFileSync(path.join(__dirname,'..','protocols','breast',files[3]),'utf8'));
assert.ok(ribo.rule_engine.rules.some(r=>r.rule_id==='QT_500'));
const saci = JSON.parse(fs.readFileSync(path.join(__dirname,'..','protocols','breast',files[4]),'utf8'));
assert.ok(saci.rule_engine.rules.some(r=>r.rule_id==='D1_ANC'));
assert.ok(saci.rule_engine.rules.some(r=>r.rule_id==='D8_ANC'));
console.log('v0.36.3 breast remediation tests passed');
