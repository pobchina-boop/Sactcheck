#!/usr/bin/env node
"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = path.resolve(__dirname, "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const ui = fs.readFileSync(path.join(root, "js", "nccp-change-tracker.js"), "utf8");
const feed = JSON.parse(fs.readFileSync(path.join(root, "data", "nccp-change-tracker", "change-feed.json"), "utf8"));

assert.strictEqual(pkg.version, "0.62.1", "package version must be 0.62.1");
assert.ok(html.includes("NCCP protocol surveillance and clinical review"), "tracker must open with clinician facing purpose");
assert.ok(html.includes("Detect</strong>") && html.includes("Compare</strong>") && html.includes("Review</strong>") && html.includes("Reconcile</strong>"), "visible tracker pathway must use Detect, Compare, Review and Reconcile");
assert.ok(html.includes("NCCP protocol register"), "source register must use clinician facing wording");
assert.ok(html.includes("Unannounced change"), "silent source changes must have a clear clinician facing label");
assert.ok(ui.includes("Initial source comparison pending"), "pending state must use source comparison wording");
assert.ok(ui.includes("Last completed source check"), "status must use source check wording");
assert.ok(feed.features.every(feature => feature.function && feature.strength), "every feature must explain function and strength");

const trackerStart = html.indexOf('<div id="nccpChangeTrackerScreen"');
const trackerEnd = html.indexOf('<div id="assessmentScreen"', trackerStart);
const trackerHtml = html.slice(trackerStart, trackerEnd);
const forbiddenVisiblePhrases = [
  "GitHub",
  "pull request",
  "PDF fingerprint",
  "extracted text fingerprint",
  "local protocol fingerprint",
  "remote capture",
  "remote scan",
  "scheduled workflow"
];
for (const phrase of forbiddenVisiblePhrases) {
  assert.ok(!trackerHtml.toLowerCase().includes(phrase.toLowerCase()), `tracker interface must not expose internal phrase: ${phrase}`);
  const featureText = JSON.stringify(feed.features).toLowerCase();
  assert.ok(!featureText.includes(phrase.toLowerCase()), `feature explanations must not expose internal phrase: ${phrase}`);
}

const integrity = JSON.parse(fs.readFileSync(path.join(root, "V0621_PROTOCOL_JSON_HASHES.json"), "utf8"));
assert.strictEqual(integrity.changed_count, 0, "v0.62.1 must not change protocol JSON files");
for (const [relative, expected] of Object.entries(integrity.hashes || {})) {
  const actual = crypto.createHash("sha256").update(fs.readFileSync(path.join(root, "protocols", relative))).digest("hex");
  assert.strictEqual(actual, expected, `protocol JSON changed unexpectedly: ${relative}`);
}

console.log("v0.62.1 clinician facing NCCP Change Tracker copy tests passed.");
