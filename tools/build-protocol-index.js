#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("node:crypto"), zlib = require("node:zlib");
const Validator = require("../js/protocol-validator.js");

const ROOT = path.resolve(__dirname, "..");
const PROTOCOLS_DIR = path.join(ROOT, "protocols");
const INDEX_FILE = path.join(PROTOCOLS_DIR, "index.json");
const EXCLUDED_NAMES = new Set(["index.json", "protocol-schema.json", "package.json"]);

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const absolute = path.join(directory, entry.name);
    const relative = path.relative(PROTOCOLS_DIR, absolute).replace(/\\/g, "/");
    if (entry.isDirectory()) {
      if (entry.name.startsWith("_") || entry.name.startsWith(".") || entry.name === "protocols") return [];
      return walk(absolute);
    }
    if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== ".json") return [];
    if (EXCLUDED_NAMES.has(entry.name)) return [];
    return [{ absolute, relative }];
  });
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    throw new Error(`${path.relative(ROOT, file)} is not valid JSON: ${error.message}`);
  }
}

const files = walk(PROTOCOLS_DIR).sort((a, b) => a.relative.localeCompare(b.relative));
if (!files.length) {
  console.error("No protocol JSON files were found.");
  process.exit(1);
}

const entries = [];
const records = [];
let failed = false;

for (const file of files) {
  const protocol = readJson(file.absolute);
  const validation = Validator.validate(protocol, { strict: true });
  const displayPath = `protocols/${file.relative}`;

  if (!validation.valid) {
    failed = true;
    console.error(`\n✗ ${displayPath}`);
    Validator.formatIssues(validation).forEach(line => console.error(`  ${line}`));
    continue;
  }

  const duplicate = entries.find(entry => entry.id === protocol.protocol_id);
  if (duplicate) {
    failed = true;
    console.error(`\n✗ Duplicate protocol_id '${protocol.protocol_id}' in ${displayPath} and ${duplicate.path}`);
    continue;
  }

  const entry = Validator.buildIndexEntry(protocol, displayPath);
  entries.push(entry); records.push({entry, protocol});
  console.log(`✓ ${displayPath}: ${validation.summary.inputCount} inputs, ${validation.summary.ruleCount} rules, ${validation.warnings.length} warnings`);
}

if (failed) {
  console.error("\nProtocol index was not generated because validation failed.");
  process.exit(1);
}

entries.sort((a, b) => {
  const tumourA = Array.isArray(a.tumour_group) ? a.tumour_group.join(" ") : a.tumour_group;
  const tumourB = Array.isArray(b.tumour_group) ? b.tumour_group.join(" ") : b.tumour_group;
  return String(tumourA).localeCompare(String(tumourB)) || a.id.localeCompare(b.id);
});

const index = {
  schema_version: "2.0.0",
  generated_by: "tools/build-protocol-index.js",
  protocol_count: entries.length,
  protocols: entries
};

// One compressed, source-complete catalogue avoids hundreds of startup requests.
// It contains the exact parsed protocol records, including all clinical rules.
const bundle = Buffer.from(JSON.stringify({schema_version:1,records}));
const compressed = zlib.gzipSync(bundle, {level:9});
index.bundle = {path:"protocols/catalogue-bundle.json.gz", encoding:"gzip", schema_version:1,
  sha256:crypto.createHash("sha256").update(bundle).digest("hex"),
  bytes:bundle.length, compressed_bytes:compressed.length, protocol_count:records.length};
fs.writeFileSync(path.join(PROTOCOLS_DIR,"catalogue-bundle.json.gz"),compressed);
fs.writeFileSync(INDEX_FILE, `${JSON.stringify(index, null, 2)}\n`, "utf8");
console.log(`\nGenerated protocols/index.json with ${entries.length} protocol${entries.length === 1 ? "" : "s"}.`);
