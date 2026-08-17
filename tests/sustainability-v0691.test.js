"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..");
const read = rel => fs.readFileSync(path.join(root, rel), "utf8");
const json = rel => JSON.parse(read(rel));

const build = read("tools/build-pages-site.js");
const validate = read("tools/validate-pages-site.js");
const page = read("sustainability.html");
const moduleJs = read("js/sustainability-module.js");
const metadata = json("data/sustainability-regimen-metadata-v0691.json");

assert.ok(build.includes('"sustainability.html"'));
assert.ok(validate.includes('"sustainability.html"'));
assert.ok(validate.includes('"js/sustainability-module.js"'));
assert.ok(validate.includes('"data/sustainability-regimen-metadata-v0691.json"'));
assert.ok(page.includes('js/sustainability-module.js?v=0.69.1'));
assert.ok(moduleJs.includes('version:"0.69.1"'));
assert.strictEqual(metadata.release, "0.69.1");
assert.strictEqual(metadata.evidence_boundary.no_unvalidated_carbon_estimates, true);
assert.strictEqual(metadata.evidence_boundary.no_environmental_traffic_light, true);
assert.ok(Object.keys(metadata.field_definitions).length >= 10);
assert.deepStrictEqual(metadata.profiles, {});
console.log("SACTCheck v0.69.1 sustainability deployment and metadata tests passed.");
