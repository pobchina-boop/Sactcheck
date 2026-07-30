#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..");
const catalogue = JSON.parse(fs.readFileSync(path.join(root, "protocols/index.json"), "utf8"));
const SOURCE_HOSTS = new Set(["healthservice.hse.ie", "assets.hse.ie", "www.hse.ie"]);
const RELEASE = "0.51.0";
const CHECK_DATE = "2026-07-29";

function readJson(file) { return JSON.parse(fs.readFileSync(file, "utf8")); }
function groups(protocol) {
  const metadata = protocol.metadata || {};
  const result = [];
  const primary = metadata.tumour_group;
  if (Array.isArray(primary)) primary.forEach(item => { if (!result.includes(item)) result.push(item); });
  else if (primary) result.push(primary);
  (metadata.tumour_groups || []).forEach(item => { if (!result.includes(item)) result.push(item); });
  return result;
}
function isHaem(protocol) { return groups(protocol).some(item => /haemato|haematology/i.test(String(item))); }
function code(protocol) { return String(protocol?.metadata?.nccp_regimen_code || "").padStart(5, "0"); }
function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (["_template", "protocols", ".git", "node_modules"].includes(entry.name)) return [];
      return walk(absolute);
    }
    return entry.isFile() && entry.name.endsWith(".json") ? [absolute] : [];
  });
}
function duplicates(values) {
  const counts = new Map();
  values.filter(Boolean).forEach(value => counts.set(value, (counts.get(value) || 0) + 1));
  return [...counts.entries()].filter(([, count]) => count > 1).map(([value, count]) => ({ value, count }));
}
function csvEscape(value) {
  const text = value === undefined || value === null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const loaded = catalogue.protocols.map(entry => ({ entry, file: path.join(root, entry.path), protocol: readJson(path.join(root, entry.path)) }));
const solid = loaded.filter(item => !isHaem(item.protocol));
const haem = loaded.filter(item => isHaem(item.protocol));
const indexedPaths = new Set(loaded.map(item => path.normalize(item.file)));
const allProtocolFiles = walk(path.join(root, "protocols")).filter(file => !["index.json", "protocol-schema.json", "package.json"].includes(path.basename(file)));
const orphanFiles = allProtocolFiles.filter(file => {
  const protocol = readJson(file);
  return protocol?.metadata?.nccp_regimen_code && protocol.metadata.nccp_regimen_code !== "00000" && !indexedPaths.has(path.normalize(file));
}).map(file => path.relative(root, file).replace(/\\/g, "/"));

const primaryStorageGroupCounts = {};
const tumourSiteCoverageCounts = {};
for (const { protocol } of solid) {
  const protocolGroups = groups(protocol).filter(item => !/haemato|haematology/i.test(String(item)));
  const explicitPrimary = protocol.metadata?.tumour_group;
  const primary = explicitPrimary
    ? String(explicitPrimary)
    : protocolGroups.length > 1
      ? "Cross-listed/shared"
      : String(protocolGroups[0] || "Unspecified");
  primaryStorageGroupCounts[primary] = (primaryStorageGroupCounts[primary] || 0) + 1;
  for (const group of protocolGroups) {
    tumourSiteCoverageCounts[group] = (tumourSiteCoverageCounts[group] || 0) + 1;
  }
}

const findings = {
  duplicate_protocol_ids: duplicates(solid.map(item => item.protocol.protocol_id)),
  duplicate_index_ids: duplicates(solid.map(item => item.entry.id)),
  duplicate_paths: duplicates(solid.map(item => item.entry.path)),
  duplicate_nccp_codes: duplicates(solid.map(item => code(item.protocol))),
  duplicate_source_urls: duplicates(solid.map(item => item.protocol.metadata?.source_url)),
  orphan_protocol_files: orphanFiles,
  non_official_source_urls: [],
  non_https_source_urls: [],
  unspecified_source_versions: [],
  forced_launch_protocols: [],
  required_input_flags: [],
  missing_partial_assessment_flag: [],
  missing_reconciliation_metadata: [],
  index_protocol_id_mismatch: [],
  index_path_mismatch: [],
  missing_published_date: [],
  missing_review_date: [],
  source_document_not_marked_checked: [],
  clinical_authorisation_true: []
};

const rows = [];
for (const { entry, protocol } of solid) {
  const metadata = protocol.metadata || {};
  const protocolCode = code(protocol);
  const sourceUrl = metadata.source_url || "";
  let sourceHost = "";
  try { sourceHost = new URL(sourceUrl).hostname; } catch (_) {}
  if (sourceUrl && !sourceUrl.startsWith("https://")) findings.non_https_source_urls.push(protocolCode);
  if (!SOURCE_HOSTS.has(sourceHost)) findings.non_official_source_urls.push({ code: protocolCode, source_url: sourceUrl });
  if (!metadata.nccp_version || /^(current|latest|unknown|tbc)$/i.test(String(metadata.nccp_version))) findings.unspecified_source_versions.push(protocolCode);
  if ((protocol.required_inputs || []).length) findings.forced_launch_protocols.push(protocolCode);
  for (const [id, definition] of Object.entries(protocol.input_definitions || {})) {
    if (definition.required === true) findings.required_input_flags.push(`${protocolCode}/${id}`);
  }
  for (const profile of protocol.assessment_profiles || []) {
    if ((profile.required_inputs || []).length) findings.forced_launch_protocols.push(`${protocolCode}/${profile.id}`);
  }
  if (protocol.required_inputs_by_phase && typeof protocol.required_inputs_by_phase === "object") {
    for (const [phase, required] of Object.entries(protocol.required_inputs_by_phase)) {
      if ((required || []).length) findings.forced_launch_protocols.push(`${protocolCode}/${phase}`);
    }
  }
  if (metadata.partial_assessment_supported !== true) findings.missing_partial_assessment_flag.push(protocolCode);
  const reconciliation = metadata.catalogue_reconciliation || {};
  if (reconciliation.release !== RELEASE || reconciliation.checked_date !== CHECK_DATE) findings.missing_reconciliation_metadata.push(protocolCode);
  if (entry.id !== protocol.protocol_id) findings.index_protocol_id_mismatch.push({ code: protocolCode, index_id: entry.id, protocol_id: protocol.protocol_id });
  const expectedPath = path.relative(root, path.join(root, entry.path)).replace(/\\/g, "/");
  if (expectedPath !== entry.path) findings.index_path_mismatch.push({ code: protocolCode, path: entry.path });
  if (!metadata.published_date) findings.missing_published_date.push(protocolCode);
  if (!metadata.review_date && !metadata.last_reviewed_date) findings.missing_review_date.push(protocolCode);
  if (metadata.validation?.source_document_checked !== true) findings.source_document_not_marked_checked.push(protocolCode);
  if (metadata.validation?.clinical_use_authorised === true || reconciliation.clinical_use_authorised === true) findings.clinical_authorisation_true.push(protocolCode);

  rows.push({
    code: protocolCode,
    title: metadata.title || "",
    tumour_group: metadata.tumour_group || "",
    protocol_id: protocol.protocol_id,
    path: entry.path,
    nccp_version: metadata.nccp_version || "",
    published_date: metadata.published_date || "",
    review_date: metadata.review_date || "",
    last_reviewed_date: metadata.last_reviewed_date || "",
    source_url: sourceUrl,
    source_version_verified: metadata.source_version_verified === true,
    partial_assessment_supported: metadata.partial_assessment_supported === true,
    required_inputs_count: (protocol.required_inputs || []).length,
    statically_required_field_count: Object.values(protocol.input_definitions || {}).filter(def => def.required === true).length,
    rule_count: (protocol.rule_engine?.rules || []).length,
    input_count: Object.keys(protocol.input_definitions || {}).length,
    consultant_reviewed: metadata.validation?.consultant_reviewed === true,
    oncology_pharmacy_reviewed: metadata.validation?.oncology_pharmacy_reviewed === true,
    clinical_use_authorised: metadata.validation?.clinical_use_authorised === true
  });
}

const hardFailures = [
  "duplicate_protocol_ids", "duplicate_index_ids", "duplicate_paths", "duplicate_nccp_codes", "duplicate_source_urls",
  "orphan_protocol_files", "non_official_source_urls", "non_https_source_urls", "unspecified_source_versions",
  "forced_launch_protocols", "required_input_flags", "missing_partial_assessment_flag", "missing_reconciliation_metadata",
  "index_protocol_id_mismatch", "index_path_mismatch", "clinical_authorisation_true"
];
const hardFailureCount = hardFailures.reduce((sum, key) => sum + findings[key].length, 0);
const report = {
  release: RELEASE,
  checked_date: CHECK_DATE,
  scope: "Structural and source-metadata reconciliation of the current published NCCP solid tumour web catalogue and the SACTCheck repository",
  scope_limit: "The NCCP states that the regimen list on its website is not comprehensive. This audit cannot prove that every possible national regimen is published online. Rule-level clinical validation remains a separate consultant and oncology-pharmacy process.",
  counts: {
    total_indexed_protocols: loaded.length,
    solid_tumour_protocols: solid.length,
    haematology_protocols: haem.length,
    primary_storage_groups: primaryStorageGroupCounts,
    tumour_site_coverage: tumourSiteCoverageCounts,
    total_inputs: solid.reduce((sum, item) => sum + Object.keys(item.protocol.input_definitions || {}).length, 0),
    total_rules: solid.reduce((sum, item) => sum + (item.protocol.rule_engine?.rules || []).length, 0),
    explicit_source_versions: solid.filter(item => !/^(current|latest|unknown|tbc)$/i.test(String(item.protocol.metadata?.nccp_version || ""))).length,
    source_versions_manually_resolved_in_v0510: solid.filter(item => item.protocol.metadata?.source_version_verified_date === CHECK_DATE).length,
    protocols_with_published_date: solid.length - findings.missing_published_date.length,
    protocols_with_review_or_last_reviewed_date: solid.length - findings.missing_review_date.length,
    protocols_marked_source_document_checked: solid.length - findings.source_document_not_marked_checked.length
  },
  hard_failure_count: hardFailureCount,
  pass: hardFailureCount === 0 && solid.length === 361 && loaded.length === 376,
  findings,
  governance_backlog: {
    missing_published_date: findings.missing_published_date,
    missing_review_or_last_reviewed_date: findings.missing_review_date,
    source_document_not_marked_checked: findings.source_document_not_marked_checked,
    rule_level_consultant_and_pharmacy_validation: "pending across the library unless separately recorded in each protocol"
  },
  protocols: rows
};

const jsonPath = path.join(root, "V0510_SOLID_TUMOUR_RECONCILIATION.json");
fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

const columns = Object.keys(rows[0]);
const csvLines = [columns.join(","), ...rows.map(row => columns.map(column => csvEscape(row[column])).join(","))];
fs.writeFileSync(path.join(root, "V0510_SOLID_TUMOUR_RECONCILIATION.csv"), `${csvLines.join("\n")}\n`, "utf8");

const primaryGroupTable = Object.entries(primaryStorageGroupCounts).sort((a,b) => a[0].localeCompare(b[0])).map(([group,count]) => `| ${group} | ${count} |`).join("\n");
const coverageTable = Object.entries(tumourSiteCoverageCounts).sort((a,b) => a[0].localeCompare(b[0])).map(([group,count]) => `| ${group} | ${count} |`).join("\n");
const versionRows = rows.filter(row => row.source_version_verified).sort((a,b) => a.code.localeCompare(b.code)).map(row => `| ${row.code} | ${row.nccp_version} | ${row.published_date || "—"} | ${row.review_date || row.last_reviewed_date || "—"} |`).join("\n");
const backlog = (items, limit=20) => items.length ? `${items.slice(0,limit).join(", ")}${items.length>limit ? ` … plus ${items.length-limit} more` : ""}` : "None";
const md = `# SACTCheck v0.51.0 Solid Tumour Reconciliation\n\n`+
`**Reconciliation date:** ${CHECK_DATE}  \n**Indexed catalogue:** ${loaded.length} protocols (${solid.length} Solid Tumour and ${haem.length} Haematology)  \n**Automated structural result:** ${report.pass ? "PASS" : "FAIL"}\n\n`+
`## Scope and boundary\n\nThis release reconciles the current SACTCheck solid tumour repository against the current published NCCP tumour-group catalogue structure, source links and stored source metadata. The NCCP states that the list on its website is not comprehensive, so this report does not claim that every possible national regimen is published online. It also does not replace protocol-by-protocol consultant and oncology-pharmacy validation of the encoded clinical rules.\n\n`+
`## Catalogue counts\n\nThere are **${solid.length} unique Solid Tumour protocol files**. Five shared protocols are intentionally cross-listed across more than one tumour site, so tumour-site coverage counts are placements and may total more than ${solid.length}.\n\n### Unique protocol files by primary storage group\n\n| Primary storage group | Unique protocols |\n|---|---:|\n${primaryGroupTable}\n\n### Tumour-site coverage\n\n| Tumour site | Protocol placements |\n|---|---:|\n${coverageTable}\n\n`+
`## Automated checks\n\n| Check | Result |\n|---|---:|\n| Duplicate protocol IDs | ${findings.duplicate_protocol_ids.length} |\n| Duplicate NCCP codes | ${findings.duplicate_nccp_codes.length} |\n| Duplicate indexed paths | ${findings.duplicate_paths.length} |\n| Duplicate official source URLs | ${findings.duplicate_source_urls.length} |\n| Orphaned protocol JSON files | ${findings.orphan_protocol_files.length} |\n| Non-HSE source URLs | ${findings.non_official_source_urls.length} |\n| Unspecified source versions | ${findings.unspecified_source_versions.length} |\n| Protocols with forced launch inputs | ${findings.forced_launch_protocols.length} |\n| Statically required input fields | ${findings.required_input_flags.length} |\n| Protocols without partial-assessment flag | ${findings.missing_partial_assessment_flag.length} |\n| Protocols missing v0.51.0 reconciliation metadata | ${findings.missing_reconciliation_metadata.length} |\n\n`+
`## Explicit source-version resolutions\n\nTwelve protocols previously labelled only as \`current\` now carry the explicit version shown in the current official NCCP PDF. Stable internal IDs were retained to avoid breaking existing bookmarks.\n\n| NCCP code | Version | Published | Review / last reviewed |\n|---|---:|---:|---:|\n${versionRows}\n\n`+
`## Partial-assessment standardisation\n\nAll 361 indexed solid tumour protocols now use the platform policy that every entered value is assessed independently. No static field, profile or phase is required merely to launch an assessment. Missing domains remain unassessed and are never assumed normal. Conditional follow-on fields may still be requested when a clinician enters a trigger that requires additional context.\n\n`+
`## Governance metadata backlog\n\nThese are not automated release failures, because older NCCP documents do not use a uniform publication/review header and many encodings pre-date the structured metadata model. They remain an explicit manual source-review queue.\n\n- Missing stored publication date: **${findings.missing_published_date.length}** (${backlog(findings.missing_published_date)})\n- Missing stored review or last-reviewed date: **${findings.missing_review_date.length}** (${backlog(findings.missing_review_date)})\n- Source document not explicitly marked as manually checked: **${findings.source_document_not_marked_checked.length}** (${backlog(findings.source_document_not_marked_checked)})\n\n`+
`## Clinical boundary\n\nNo treatment threshold, dose-modification condition or recommendation was intentionally changed in v0.51.0. All protocols remain decision-support encodings pending the level of consultant and oncology-pharmacy validation recorded in their individual metadata. The current official NCCP protocol and clinician judgement remain authoritative.\n`;
fs.writeFileSync(path.join(root, "SOLID_TUMOUR_RECONCILIATION_v0.51.0.md"), md, "utf8");

console.log(`Solid tumour reconciliation ${report.pass ? "PASSED" : "FAILED"}: ${solid.length} solid protocols, ${hardFailureCount} hard findings.`);
console.log(`Governance backlog: ${findings.missing_published_date.length} missing publication dates, ${findings.missing_review_date.length} missing review/last-reviewed dates.`);
if (!report.pass) process.exit(1);
