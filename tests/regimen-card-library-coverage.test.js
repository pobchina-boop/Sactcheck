"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const Metadata = require("../js/regimen-course-metadata.js");

const ROOT = path.resolve(__dirname, "..");
const indexPath = path.join(ROOT, "protocols", "index.json");
assert.ok(fs.existsSync(indexPath), "protocols/index.json is required");
const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
const publishedEntries = (index.protocols || []).filter(entry => entry && entry.enabled !== false && entry.path);
assert.ok(publishedEntries.length > 0, "published protocol index must not be empty");

const publishedIds = new Set();
for (const entry of publishedEntries) {
  assert.ok(entry.id, "every published index entry requires id");
  assert.ok(!publishedIds.has(entry.id), `duplicate published protocol id ${entry.id}`);
  publishedIds.add(entry.id);
  const source = path.resolve(ROOT, String(entry.path).replace(/^\.\//, ""));
  assert.ok(source.startsWith(ROOT + path.sep), `${entry.id} has an unsafe source path`);
  assert.ok(fs.existsSync(source), `published protocol ${entry.id} has no source JSON at ${entry.path}`);
  const protocol = JSON.parse(fs.readFileSync(source, "utf8"));
  assert.strictEqual(protocol.protocol_id, entry.id, `${entry.path} protocol_id must match its index id`);
}

const sidecarPath = path.join(ROOT, "data", "regimen-card-metadata.json");
assert.ok(fs.existsSync(sidecarPath), "data/regimen-card-metadata.json is required");
const sidecar = JSON.parse(fs.readFileSync(sidecarPath, "utf8"));
assert.strictEqual(sidecar.schema_version, Metadata.version, "sidecar schema version mismatch");
assert.strictEqual(sidecar.protocol_count, publishedEntries.length, "sidecar protocol count must match the published index");
assert.strictEqual(sidecar.protocols.length, publishedEntries.length, "sidecar must include every published protocol");

const sidecarIds = new Set();
const incomplete = [];
for (const item of sidecar.protocols) {
  assert.ok(item.id, "every sidecar item requires id");
  assert.ok(publishedIds.has(item.id), `sidecar contains unpublished or unknown protocol ${item.id}`);
  assert.ok(!sidecarIds.has(item.id), `sidecar contains duplicate protocol ${item.id}`);
  sidecarIds.add(item.id);
  const card = item.regimen_card;
  assert.ok(card && typeof card === "object", `${item.id} requires regimen_card`);
  assert.strictEqual(card.schema_version, Metadata.version, `${item.id} has an unsupported regimen_card schema`);
  assert.ok(Array.isArray(card.contexts) && card.contexts.length > 0, `${item.id} requires at least one card context`);
  assert.ok(card.display && typeof card.display === "object", `${item.id} requires regimen_card.display`);
  if (!item.complete) incomplete.push(`${item.id}: ${(item.unresolved || []).join(", ") || "review required"}`);
}

assert.deepStrictEqual([...sidecarIds].sort(), [...publishedIds].sort(), "sidecar protocol IDs must exactly match the published index");
console.log(`Regimen-card metadata coverage passed for ${publishedEntries.length} published protocols.`);
if (incomplete.length) console.log(`${incomplete.length} protocol(s) retain non-blocking review items; see REGIMEN_CARD_METADATA_REVIEW.csv.`);
