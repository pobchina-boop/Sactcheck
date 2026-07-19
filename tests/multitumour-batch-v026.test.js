"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const Validator = require("../js/protocol-validator.js");

const ROOT = path.resolve(__dirname, "..");
const expected = [
  ["breast/00250-docetaxel-cyclophosphamide.json", "00250"],
  ["breast/00252-ac-doxorubicin-cyclophosphamide.json", "00252"],
  ["breast/00512-paclitaxel-trastuzumab-weekly.json", "00512"],
  ["breast/00858-pembro-weekly-carbo-paclitaxel-ac.json", "00858"],
  ["lung/00271-carboplatin-etoposide.json", "00271"],
  ["lung/00280-cisplatin-etoposide.json", "00280"],
  ["lung/00593-atezolizumab-maintenance.json", "00593"],
  ["lung/00655-durvalumab-maintenance.json", "00655"],
  ["gynaecology/00303-carboplatin-paclitaxel-21-day.json", "00303"],
  ["gynaecology/00766-bevacizumab-carboplatin-paclitaxel.json", "00766"]
];
const index = JSON.parse(fs.readFileSync(path.join(ROOT, "protocols/index.json"), "utf8"));
assert.strictEqual(index.protocol_count, 23, "v0.26 index should contain 23 protocols");
for (const [relative, code] of expected) {
  const full = path.join(ROOT, "protocols", relative);
  assert.ok(fs.existsSync(full), `${relative} should exist`);
  const protocol = JSON.parse(fs.readFileSync(full, "utf8"));
  const result = Validator.validate(protocol, { strict: true });
  assert.ok(result.valid, `${relative} should validate: ${Validator.formatIssues(result).join("; ")}`);
  assert.strictEqual(protocol.metadata.nccp_regimen_code, code);
  assert.strictEqual(protocol.metadata.migration.mode, "live_json");
  assert.ok(protocol.metadata.source_url, `${relative} should provide an official source link`);
  assert.ok(protocol.rule_engine.rules.length >= 9, `${relative} should contain encoded assessment rules`);
  assert.ok(index.protocols.some(item => item.id === protocol.protocol_id && item.mode === "live_json"), `${code} should be published in the index`);
}
console.log("v0.26 ten-protocol batch tests passed.");
