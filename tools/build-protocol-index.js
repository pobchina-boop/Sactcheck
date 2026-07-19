#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
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

  entries.push(Validator.buildIndexEntry(protocol, displayPath));
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

fs.writeFileSync(INDEX_FILE, `${JSON.stringify(index, null, 2)}\n`, "utf8");
console.log(`\nGenerated protocols/index.json with ${entries.length} protocol${entries.length === 1 ? "" : "s"}.`);
