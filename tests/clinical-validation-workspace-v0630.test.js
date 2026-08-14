#!/usr/bin/env node
"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = path.resolve(__dirname, "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const ui = fs.readFileSync(path.join(root, "js", "clinical-validation-workspace.js"), "utf8");
const register = JSON.parse(fs.readFileSync(path.join(root, "data", "clinical-validation-register-v0630.json"), "utf8"));
const protocolIndex = JSON.parse(fs.readFileSync(path.join(root, "protocols", "index.json"), "utf8"));

assert.ok(pkg.version.localeCompare("0.63.0", undefined, { numeric: true }) >= 0, "package version must be at least 0.63.0");
assert.strictEqual(register.protocol_count, protocolIndex.protocols.filter(item => item.enabled !== false).length, "validation register must include every enabled protocol");
assert.strictEqual(register.protocol_count, 376, "expected enabled protocol count must remain 376");
assert.strictEqual(register.tissue_context_count, 451, "shared protocols must create separate tissue review contexts");
assert.ok(register.protocols.every(item => item.protocol_id && item.path && item.tumour_groups.length), "every validation record must have protocol identity, path and tissue context");
assert.ok(register.protocols.every(item => typeof item.rule_count === "number" && typeof item.input_count === "number"), "register must expose encoded rule and input counts");
assert.ok(register.protocols.some(item => item.tumour_groups.length > 1), "register must retain shared tissue protocols");
assert.ok(html.includes('id="clinicalValidationScreen"'), "clinical validation screen must be present");
assert.ok(html.includes("Validation workspace"), "validation workspace must be accessible from the header");
assert.ok(html.includes("tissue by tissue") || html.includes("Tissue by tissue"), "interface must describe the tissue review model");
assert.ok(html.includes("does not change the published clinical validation status"), "interface must keep primary review separate from formal validation");
assert.ok(ui.includes("sactcheck_primary_clinical_validation_v1"), "validation log must use dedicated local storage");
assert.ok(ui.includes("Export full validation log") || html.includes("Export full validation log"), "workspace must support validation log export");
assert.ok(ui.includes("primary_review_complete"), "workspace must support a completed primary review state");
assert.ok(ui.includes("pharmacy_review_required") && ui.includes("consultant_review_required"), "workspace must support specialist escalation states");
assert.ok(ui.includes("Do not enter patient information") || html.includes("Do not enter patient names"), "workspace must prohibit patient information");
assert.ok(ui.includes("openAssessment") && ui.includes("Open SACTCheck assessment"), "reviewer must be able to inspect the live SACTCheck encoding");
assert.ok(ui.includes("Open current NCCP source"), "reviewer must be able to open the official source");
assert.ok(ui.includes("issues") && ui.includes("correction_required"), "workspace must support discrepancy logging");
assert.ok(ui.includes("Import validation log" ) || html.includes("Import validation log"), "workspace must support validation log import");

if (pkg.version === "0.63.0") {
  const baseline = JSON.parse(fs.readFileSync(path.join(root, "V0621_PROTOCOL_JSON_HASHES.json"), "utf8"));
  for (const [relative, expected] of Object.entries(baseline.hashes || {})) {
    const actual = crypto.createHash("sha256").update(fs.readFileSync(path.join(root, "protocols", relative))).digest("hex");
    assert.strictEqual(actual, expected, `clinical validation workspace must not alter protocol JSON: ${relative}`);
  }
}

console.log(`v0.63.0 clinical validation workspace tests passed for ${register.protocol_count} protocols and ${register.tissue_context_count} tissue contexts.`);
