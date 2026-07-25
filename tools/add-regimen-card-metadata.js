#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const Metadata = require("../js/regimen-course-metadata.js");

function parseArgs(argv) {
  const args = { root: process.cwd(), embed: false, strict: false, force: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--embed" || arg === "--write") args.embed = true;
    else if (arg === "--strict") args.strict = true;
    else if (arg === "--force") args.force = true;
    else if (arg === "--root") args.root = path.resolve(argv[++index]);
    else if (arg.startsWith("--root=")) args.root = path.resolve(arg.slice(7));
    else if (arg === "--help" || arg === "-h") args.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function usage() {
  return [
    "SACTCheck regimen-card metadata build/audit",
    "",
    "Usage:",
    "  node tools/add-regimen-card-metadata.js [--root PATH] [--embed] [--strict] [--force]",
    "",
    "The published protocols/index.json is the canonical library source.",
    "Default: build the sidecar and audit report without changing protocol JSON.",
    "--embed writes metadata.regimen_card into published protocol JSON files.",
    "--strict exits non-zero if any published protocol retains unresolved fields."
  ].join("\n");
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function csvEscape(value) {
  const text = Array.isArray(value) ? value.join(";") : String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function loadOverrides(root) {
  const file = path.join(root, "data", "regimen-card-overrides.json");
  if (!fs.existsSync(file)) return new Map();
  const data = readJson(file);
  const source = data.protocols || {};
  if (Array.isArray(source)) return new Map(source.filter(Boolean).map(item => [item.id, item.regimen_card || item]));
  return new Map(Object.entries(source).map(([id, value]) => [id, value?.regimen_card || value]));
}

function normaliseRegimenCard(protocol, card) {
  if (!card) return Metadata.serialisableRegimenCard(protocol);
  const effective = { ...protocol, metadata: { ...(protocol.metadata || {}), regimen_card: card } };
  const normalised = Metadata.serialisableRegimenCard(effective);
  normalised.provenance = {
    ...(normalised.provenance || {}),
    ...(card.provenance || {}),
    ...(card.reviewed === true ? { reviewed: true } : {})
  };
  return normalised;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    return;
  }

  const root = path.resolve(args.root);
  const indexPath = path.join(root, "protocols", "index.json");
  if (!fs.existsSync(indexPath)) throw new Error(`Missing ${indexPath}`);
  const index = readJson(indexPath);
  const entries = (index.protocols || []).filter(entry => entry && entry.enabled !== false && entry.path);
  if (!entries.length) throw new Error("protocols/index.json contains no published protocol entries.");

  const duplicateIds = entries.map(entry => entry.id).filter((id, i, all) => all.indexOf(id) !== i);
  if (duplicateIds.length) throw new Error(`Duplicate published protocol IDs: ${[...new Set(duplicateIds)].join(", ")}`);

  const overrides = loadOverrides(root);
  const rows = [];
  const sidecarItems = [];
  let changed = 0;
  let preserved = 0;
  let invalid = 0;

  for (const entry of entries) {
    const relative = String(entry.path).replace(/^\.\//, "");
    const file = path.resolve(root, relative);
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) {
      invalid += 1;
      rows.push({
        file: relative, protocol_id: entry.id || "", nccp_code: "", title: "", intent: "",
        duration: "", cycle_interval: "", contexts: 0, complete: "no",
        unresolved: ["missing_source_json"], action: "error: indexed source file missing"
      });
      continue;
    }

    let protocol;
    try {
      protocol = readJson(file);
    } catch (error) {
      invalid += 1;
      rows.push({
        file: relative, protocol_id: entry.id || "", nccp_code: "", title: "", intent: "",
        duration: "", cycle_interval: "", contexts: 0, complete: "no",
        unresolved: ["invalid_json"], action: `error: ${error.message}`
      });
      continue;
    }

    if (!protocol.protocol_id) throw new Error(`${relative} requires protocol_id`);
    if (entry.id && entry.id !== protocol.protocol_id) {
      throw new Error(`${relative}: index id ${entry.id} does not match protocol_id ${protocol.protocol_id}`);
    }

    const existing = protocol?.metadata?.regimen_card;
    const reviewed = existing?.provenance?.reviewed === true || existing?.reviewed === true;
    const override = overrides.get(protocol.protocol_id);
    const normalisedOverride = override ? normaliseRegimenCard(protocol, override) : null;
    const normalisedExisting = existing ? normaliseRegimenCard(protocol, existing) : null;
    let action = override ? "manual override applied" : "sidecar generated";

    if (args.embed) {
      if (reviewed && !args.force) {
        preserved += 1;
        action = override ? "manual override applied; reviewed embedded metadata preserved" : "preserved reviewed metadata";
      } else {
        protocol.metadata = protocol.metadata || {};
        protocol.metadata.regimen_card = normalisedOverride || Metadata.serialisableRegimenCard(protocol);
        writeJson(file, protocol);
        changed += 1;
        action = override ? "manual override embedded" : existing ? "refreshed derived metadata" : "added derived metadata";
      }
    }

    const regimenCard = normalisedOverride || normalisedExisting || Metadata.serialisableRegimenCard(protocol);
    const effectiveProtocol = { ...protocol, metadata: { ...(protocol.metadata || {}), regimen_card: regimenCard } };
    const summary = Metadata.summarise(effectiveProtocol);
    const metadata = protocol.metadata || {};

    rows.push({
      file: relative,
      protocol_id: protocol.protocol_id,
      nccp_code: metadata.nccp_regimen_code || "",
      title: metadata.short_title || metadata.title || "",
      intent: summary.intent || "",
      duration: summary.duration || "",
      cycle_interval: summary.interval || "",
      contexts: summary.contexts.length,
      complete: summary.complete ? "yes" : "no",
      unresolved: summary.unresolved,
      action
    });

    sidecarItems.push({
      id: protocol.protocol_id,
      nccp_code: metadata.nccp_regimen_code || "",
      path: relative,
      legacy_card_id: entry.legacy_card_id || undefined,
      tumour_group: entry.tumour_group || metadata.tumour_group || undefined,
      regimen_card: regimenCard,
      complete: summary.complete,
      unresolved: summary.unresolved
    });
  }

  rows.sort((a, b) => a.file.localeCompare(b.file));
  sidecarItems.sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const columns = [
    "file", "protocol_id", "nccp_code", "title", "intent", "duration",
    "cycle_interval", "contexts", "complete", "unresolved", "action"
  ];
  const csv = [
    columns.join(","),
    ...rows.map(row => columns.map(column => csvEscape(row[column])).join(","))
  ].join("\n") + "\n";
  fs.writeFileSync(path.join(root, "REGIMEN_CARD_METADATA_REVIEW.csv"), csv, "utf8");

  writeJson(path.join(root, "data", "regimen-card-metadata.json"), {
    schema_version: Metadata.version,
    protocol_count: sidecarItems.length,
    protocols: sidecarItems.map(item => Object.fromEntries(Object.entries(item).filter(([, value]) => value !== undefined)))
  });

  const incomplete = sidecarItems.filter(item => item.complete !== true).length;
  console.log(`Published protocols audited: ${entries.length}`);
  console.log(`Metadata entries generated: ${sidecarItems.length}`);
  console.log(`Protocol files embedded/changed: ${changed}`);
  console.log(`Reviewed metadata preserved: ${preserved}`);
  console.log(`Manual override entries available: ${overrides.size}`);
  console.log(`Invalid or missing indexed files: ${invalid}`);
  console.log(`Protocols requiring metadata review: ${incomplete}`);
  console.log(`Review report: ${path.join(root, "REGIMEN_CARD_METADATA_REVIEW.csv")}`);
  console.log(`Browser metadata sidecar: ${path.join(root, "data", "regimen-card-metadata.json")}`);

  if (invalid > 0 || (args.strict && incomplete > 0)) process.exitCode = 1;
}

try {
  main();
} catch (error) {
  console.error(error.stack || error.message || String(error));
  process.exitCode = 1;
}
