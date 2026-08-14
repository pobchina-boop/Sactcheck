#!/usr/bin/env node
"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const Tracker = require("../tools/nccp-change-tracker.js");

const root = path.resolve(__dirname, "..");
const register = JSON.parse(fs.readFileSync(path.join(root, "data", "nccp-change-tracker", "source-register-v0620.json"), "utf8"));
const feed = JSON.parse(fs.readFileSync(path.join(root, "data", "nccp-change-tracker", "change-feed.json"), "utf8"));
const config = JSON.parse(fs.readFileSync(path.join(root, "data", "nccp-change-tracker", "catalogue-pages.json"), "utf8"));
const index = JSON.parse(fs.readFileSync(path.join(root, "protocols", "index.json"), "utf8"));
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const workflow = fs.readFileSync(path.join(root, ".github", "workflows", "nccp-change-tracker.yml"), "utf8");
const ui = fs.readFileSync(path.join(root, "js", "nccp-change-tracker.js"), "utf8");

assert.ok(Number(pkg.version.split(".")[1]) >= 62, "package version must include or supersede the v0.62 tracker foundation");
assert.strictEqual(register.tracked_protocol_count, index.protocols.filter(item => item.enabled !== false).length, "source register must cover every enabled indexed protocol");
assert.strictEqual(register.records.length, register.tracked_protocol_count, "source register count must match record count");
assert.ok(register.records.every(record => record.tracking_key && record.protocol_path && record.nccp_regimen_code && record.title), "every source record must have a stable identity");
assert.ok(register.records.every(record => /^[a-f0-9]{64}$/.test(record.protocol_json_sha256)), "every source record must have a protocol JSON fingerprint");
assert.ok(register.records.every(record => record.clinical_rule_update_status === "no_automatic_change_permitted"), "automatic clinical rule updates must be prohibited");
assert.ok(config.catalogue_pages.length >= 10, "tracker must monitor the configured NCCP catalogue pages");
assert.strictEqual(feed.safety_gate.automatic_rule_updates, false, "change feed must retain the human review gate");
assert.strictEqual(feed.features.length, 8, "tracker must explain eight core capabilities");
assert.ok(html.includes('id="nccpChangeTrackerScreen"'), "tracker screen must be present");
assert.ok(html.includes("What the tracker does and why each feature matters"), "tracker function and value must be visible in the interface");
assert.ok(html.includes("No detected change can modify a clinical rule automatically"), "interface must state the safety boundary");
assert.ok(html.includes('data-open-nccp-tracker'), "tracker must be accessible from the application");
assert.ok(ui.includes("Previous source") && ui.includes("Current source"), "UI must support previous and current source comparison");
assert.ok(workflow.includes("schedule:") && workflow.includes("workflow_dispatch:"), "tracker workflow must support scheduled and manual runs");
assert.ok(workflow.includes("pull request") || workflow.includes("pull-request"), "generated source changes must enter a review workflow");

const baseline = [
  { tracking_key: "00001:a", nccp_regimen_code: "00001", title: "A", tumour_group: "Test", nccp_version: "1", source_url: "https://example.test/a.pdf", pdf_sha256: "old-a", extracted_text_sha256: "old-text-a", extracted_text: "Platelet threshold 100" },
  { tracking_key: "00002:b", nccp_regimen_code: "00002", title: "B", tumour_group: "Test", nccp_version: "1", source_url: "https://example.test/b.pdf", pdf_sha256: "old-b", extracted_text_sha256: "old-text-b", extracted_text: "Monitoring guidance" },
  { tracking_key: "00003:c", nccp_regimen_code: "00003", title: "C", tumour_group: "Test", nccp_version: "1", source_url: "https://example.test/c.pdf", pdf_sha256: "old-c", extracted_text_sha256: "old-text-c", extracted_text: "Dose 100 mg" },
  { tracking_key: "00005:e", nccp_regimen_code: "00005", title: "E", tumour_group: "Test", nccp_version: "1", source_url: "https://example.test/e.pdf", pdf_sha256: null, extracted_text_sha256: null }
];
const current = [
  { tracking_key: "00001:a", nccp_regimen_code: "00001", title: "A", tumour_group: "Test", nccp_version: "2", source_url: "https://example.test/a-v2.pdf", pdf_sha256: "new-a", extracted_text_sha256: "new-text-a", extracted_text: "Platelet threshold 75" },
  { tracking_key: "00002:b", nccp_regimen_code: "00002", title: "B", tumour_group: "Test", nccp_version: "1", source_url: "https://example.test/b.pdf", pdf_sha256: "new-b", extracted_text_sha256: "new-text-b", extracted_text: "Monitoring and hydration guidance" },
  { tracking_key: "00004:d", nccp_regimen_code: "00004", title: "D", tumour_group: "Test", nccp_version: "1", source_url: "https://example.test/d.pdf", pdf_sha256: "new-d", extracted_text_sha256: "new-text-d", extracted_text: "New protocol" },
  { tracking_key: "00005:e", nccp_regimen_code: "00005", title: "E", tumour_group: "Test", nccp_version: "1", source_url: "https://example.test/e.pdf", pdf_sha256: "captured-e", extracted_text_sha256: "captured-text-e" }
];
const comparison = Tracker.compareSourceStates(baseline, current);
const types = comparison.changes.map(change => change.change_type).sort();
assert.deepStrictEqual(types, ["new_protocol", "removed_protocol", "silent_replacement", "updated_protocol"], "comparison must detect all four source change types");
assert.strictEqual(comparison.initialCaptures.length, 1, "first fingerprint capture must not be presented as a source change");
assert.strictEqual(comparison.changes.find(change => change.change_type === "updated_protocol").severity.level, "high", "treatment threshold change must receive high priority triage");
assert.strictEqual(comparison.changes.find(change => change.change_type === "silent_replacement").severity.level, "medium", "monitoring change must receive workflow priority triage");

const parsed = Tracker.parsePdfLinks('<a href="/documents/9999/321_v10_XELOX.pdf">XELOX Therapy</a><div>00321a</div>', "https://healthservice.hse.ie/example/");
assert.strictEqual(parsed.length, 1, "catalogue parser must identify PDF links");
assert.ok(parsed[0].url.startsWith("https://healthservice.hse.ie/documents/"), "catalogue parser must resolve absolute links");
assert.strictEqual(Tracker.extractVersion("Version 10a"), "10a", "version parser must support alphanumeric versions");

const hashFile = path.join(root, "V0620_PROTOCOL_JSON_HASHES.json");
if (fs.existsSync(hashFile) && pkg.version.localeCompare("0.63.1", undefined, { numeric: true }) < 0) {
  const hashes = JSON.parse(fs.readFileSync(hashFile, "utf8"));
  assert.strictEqual(hashes.changed_count, 0, "v0.62.0 must not change protocol JSON files");
  for (const [relative, expected] of Object.entries(hashes.hashes || {})) {
    const file = fs.readFileSync(path.join(root, "protocols", relative));
    const actual = crypto.createHash("sha256").update(file).digest("hex");
    assert.strictEqual(actual, expected, `protocol JSON fingerprint mismatch: ${relative}`);
  }
}

console.log(`v0.62 NCCP Change Tracker foundation tests passed for ${register.tracked_protocol_count} registered protocols.`);
