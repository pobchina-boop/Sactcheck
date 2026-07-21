"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const Validator = require("../js/protocol-validator.js");
const ROOT = path.resolve(__dirname, "..");
const read = p => JSON.parse(fs.readFileSync(path.join(ROOT,p),"utf8"));
const expected = [
 ["00238","protocols/gastrointestinal/00238-aflibercept-folfiri.json"],
 ["00256","protocols/gastrointestinal/00256-nab-paclitaxel-gemcitabine.json"],
 ["00446","protocols/gastrointestinal/00446-bevacizumab-modified-folfox6.json"],
 ["00447","protocols/gastrointestinal/00447-panitumumab-modified-folfox6.json"],
 ["00448","protocols/gastrointestinal/00448-panitumumab-folfiri.json"],
 ["00449","protocols/gastrointestinal/00449-bevacizumab-folfiri.json"],
 ["00704","protocols/gastrointestinal/00704-trastuzumab-modified-folfox6.json"],
 ["00843","protocols/gastrointestinal/00843-nivolumab-xelox.json"],
 ["00844","protocols/gastrointestinal/00844-nivolumab-modified-folfox6.json"],
 ["00926","protocols/gastrointestinal/00926-tremelimumab-durvalumab.json"]
];
const index=read("protocols/index.json");
assert.ok(index.protocol_count>=48,"v0.31 protocols must remain present in later releases");
const ids=index.protocols.map(x=>x.id), paths=index.protocols.map(x=>x.path);
assert.strictEqual(new Set(ids).size,ids.length,"protocol IDs must be unique");
assert.strictEqual(new Set(paths).size,paths.length,"protocol paths must be unique");
for(const [code,p] of expected){
 const d=read(p), v=Validator.validate(d,{strict:true});
 assert.ok(v.valid,`${code} should validate: ${Validator.formatIssues(v).join('; ')}`);
 assert.strictEqual(d.metadata.nccp_regimen_code,code);
 assert.strictEqual(d.metadata.sactcheck_encoding_version,"0.31.0");
 assert.ok(index.protocols.some(x=>x.id===d.protocol_id && x.path===p),`${code} must be indexed`);
 assert.deepStrictEqual(d.required_inputs,[],`${code} must permit partial assessment`);
}
const ecog=read("protocols/_shared/ecog-context-placeholder.json");
assert.strictEqual(ecog.status,"placeholder_inactive");
console.log("v0.31 Batch 4 ten-protocol and duplicate-regression tests passed.");
