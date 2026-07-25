#!/usr/bin/env node
"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const protocolsRoot = path.join(root, "protocols");
const audit = JSON.parse(fs.readFileSync(path.join(root, "V0411_TITLE_NORMALISATION_AUDIT.json"), "utf8"));

const bannedDisplayForms = [
  "CARBOplatin", "PACLitaxel", "CISplatin", "DOXOrubicin", "PEMEtrexed",
  "DOCEtaxel", "cycloPHOSphamide", "SUNitinib", "vinCRIStine", "epiRUBicin",
  "eriBULin", "PAZOPanib", "DACTINomycin", "VinBLAStine", "prednisoLONE", "predniSONE"
];

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.isFile() && entry.name.endsWith(".json") ? [full] : [];
  });
}

let checked = 0;
let sourceTitlesRetained = 0;
for (const file of walk(protocolsRoot)) {
  if (["index.json", "protocol-schema.json"].includes(path.basename(file))) continue;
  const protocol = JSON.parse(fs.readFileSync(file, "utf8"));
  const metadata = protocol.metadata || {};
  const displayFields = [metadata.title, metadata.short_title, protocol.treatment?.schedule_summary]
    .filter(value => typeof value === "string");
  for (const value of displayFields) {
    for (const banned of bannedDisplayForms) {
      assert(!value.includes(banned), `${path.relative(root, file)} still exposes source-styled casing ${banned}: ${value}`);
    }
    checked += 1;
  }
  if (metadata.display_title_normalised) {
    assert.strictEqual(metadata.display_title_normalisation_version, "0.41.1");
    assert(typeof metadata.source_title_exact === "string" && metadata.source_title_exact.length > 0,
      `${path.relative(root, file)} must retain the exact source title when display casing is normalised.`);
    sourceTitlesRetained += 1;
  }
}

assert.strictEqual(audit.changed_protocol_count, 85, "Expected 85 protocols in the v0.41.1 display-title audit.");
assert.strictEqual(sourceTitlesRetained, 85, "All 85 changed protocols should retain their exact NCCP source title.");
assert(checked > 650, "Expected to inspect title, short-title and schedule-summary fields across the full library.");

const loader = fs.readFileSync(path.join(root, "js", "protocol-loader.js"), "utf8");
const engine = fs.readFileSync(path.join(root, "js", "assessment-engine.js"), "utf8");
const importer = fs.readFileSync(path.join(root, "js", "protocol-importer-ui.js"), "utf8");
for (const token of bannedDisplayForms) {
  assert(loader.includes(`replaceAll("${token}"`), `Catalogue display guard missing ${token}.`);
  assert(engine.includes(`replaceAll("${token}"`), `Assessment display guard missing ${token}.`);
  assert(importer.includes(`replaceAll("${token}"`), `Importer display guard missing ${token}.`);
}

console.log(`v0.41.1 title normalisation tests passed: ${checked} display fields checked; ${sourceTitlesRetained} source titles retained.`);
