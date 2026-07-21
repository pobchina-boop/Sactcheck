"use strict";
const assert = require("assert");
const fs = require("fs");

const html = fs.readFileSync("index.html", "utf8");
const loader = fs.readFileSync("js/protocol-loader.js", "utf8");
const importer = fs.readFileSync("js/protocol-importer-ui.js", "utf8");
const olaparib = JSON.parse(fs.readFileSync("protocols/shared/00588-olaparib-tablet-monotherapy.json", "utf8"));
const atezo = JSON.parse(fs.readFileSync("protocols/lung/00593-atezolizumab-maintenance.json", "utf8"));

assert(html.includes("SACTCheck v0.34.0"));
assert(html.includes("Version 0.34.0 · Batch 6 early breast completion"));
assert(html.includes("js/protocol-loader.js?v=0.34.0"));
assert(!html.includes("Version 0.17 · Conditional JSON assessments"));
assert(html.includes("Protocol publisher v0.31.0"));
assert(importer.includes('version: "0.31.0"'));
assert(importer.includes("schema 2.x protocol contract"));
assert(loader.includes("Engine · ${escapeHtml(engine)}"));
assert(loader.includes("Clinical · ${clinicalValidated ? \"Validated\" : \"Pending validation\"}"));
assert(loader.includes("Source · ${sourceUrl ? \"Official NCCP\" : \"Not linked\"}"));
assert(loader.includes("normaliseRemainingLegacyCards"));
assert(loader.includes("Triggered rules shown in assessment"));
assert(html.includes("regimen-description"));
assert(html.includes("assessment-explainer"));
assert(olaparib.metadata.source_url.includes("588_Olaparib_tablet_monotherapy"));
assert(atezo.metadata.source_url.includes("593_v10a_Atezolizumab_1680mg_Monotherapy.pdf"));
assert.equal(atezo.metadata.nccp_version, "10a");

console.log("v0.30.0 catalogue UI tests passed.");
