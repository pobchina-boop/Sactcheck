#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const indexPath = path.join(root, "protocols", "index.json");
const outPath = path.join(root, "data", "clinical-validation-register-v0630.json");
const kbPath = path.join(root, "data", "regimen-knowledge-base-v0650.json");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function asArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function flattenText(value) {
  if (value === undefined || value === null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(flattenText).join(" ");
  if (typeof value === "object") return Object.entries(value).map(([key, item]) => `${key} ${flattenText(item)}`).join(" ");
  return "";
}

function domainHints(protocol) {
  const text = flattenText({
    inputs: protocol.input_definitions,
    rules: protocol.rule_engine?.rules,
    eligibility: protocol.eligibility,
    exclusions: protocol.exclusions,
    monitoring: protocol.monitoring,
    dose_modifications: protocol.dose_modifications,
    supportive_care: protocol.supportive_care,
    treatment: protocol.treatment
  }).toLowerCase();
  return {
    haematology: /\banc\b|neutroph|platelet|haemoglobin|hemoglobin|white cell|wbc|haematolog|hematolog/.test(text),
    renal: /\bcrcl\b|egfr|creatinine|renal|kidney|dialysis/.test(text),
    hepatic: /bilirubin|\bast\b|\balt\b|hepatic|liver|transaminase|child.?pugh/.test(text),
    cardiovascular: /blood pressure|systolic|diastolic|cardiac|lvef|ejection fraction|ecg|qt\b|hypertension/.test(text),
    endocrine: /\btsh\b|free t4|ft4|cortisol|acth|pituitary|thyroid|endocrine|glucose|ketone/.test(text),
    proteinuria: /proteinuria|urine protein|upcr|acr\b/.test(text),
    toxicity: /ctcae|toxicity|neuropath|diarrhoea|diarrhea|mucositis|stomatitis|rash|hand.?foot|pneumonitis|colitis|hepatitis/.test(text),
    supportive_care: /antiemetic|g.?csf|hydration|premed|prophylaxis|supportive|folic acid|vitamin b12|steroid/.test(text),
    administration: /infusion|administration|sequence|observation|intravenous|oral|subcutaneous|route/.test(text)
  };
}

const index = readJson(indexPath);
const knowledge = fs.existsSync(kbPath) ? readJson(kbPath) : { regimen_profiles: [] };
const kbIds = new Set(asArray(knowledge.regimen_profiles).map(item => item.protocol_id));
const protocols = [];

for (const record of asArray(index.protocols)) {
  if (!record.enabled) continue;
  const filePath = path.join(root, record.path);
  const protocol = readJson(filePath);
  const metadata = protocol.metadata || {};
  const tumourGroups = asArray(record.tumour_group || metadata.tumour_groups || metadata.tumour_group || "Uncategorised")
    .map(value => String(value).trim()).filter(Boolean);
  const rules = asArray(protocol.rule_engine?.rules);
  const inputDefinitions = protocol.input_definitions || {};
  protocols.push({
    protocol_id: protocol.protocol_id || record.id,
    path: record.path,
    nccp_code: metadata.nccp_regimen_code || "",
    nccp_version: metadata.nccp_version === undefined || metadata.nccp_version === null ? "" : String(metadata.nccp_version),
    title: metadata.title || metadata.short_title || protocol.name || protocol.protocol_id || record.id,
    short_title: metadata.short_title || metadata.title || protocol.name || protocol.protocol_id || record.id,
    indication: metadata.indication || asArray(protocol.indications).map(item => item.description).filter(Boolean).join(" | "),
    tumour_groups: tumourGroups,
    source_url: metadata.source_url || "",
    source_review_date: metadata.last_reviewed_date || metadata.review_date || "",
    encoding_version: metadata.sactcheck_encoding_version || "",
    rule_count: rules.length,
    input_count: Object.keys(inputDefinitions).length,
    knowledge_base_profile: kbIds.has(protocol.protocol_id || record.id),
    domain_hints: domainHints(protocol),
    source_document_checked: Boolean(metadata.validation?.source_document_checked),
    software_tests_completed: Boolean(metadata.validation?.software_tests_completed),
    formal_consultant_reviewed: Boolean(metadata.validation?.consultant_reviewed),
    formal_pharmacy_reviewed: Boolean(metadata.validation?.oncology_pharmacy_reviewed)
  });
}

protocols.sort((a, b) => {
  const groupA = a.tumour_groups[0] || "";
  const groupB = b.tumour_groups[0] || "";
  return groupA.localeCompare(groupB) || String(a.nccp_code).localeCompare(String(b.nccp_code)) || a.title.localeCompare(b.title);
});

const tissueCounts = {};
let contextCount = 0;
for (const protocol of protocols) {
  for (const tissue of protocol.tumour_groups) {
    tissueCounts[tissue] = (tissueCounts[tissue] || 0) + 1;
    contextCount += 1;
  }
}

const output = {
  schema_version: "1.0",
  release: "0.65.0",
  generated_date: "2026-08-15",
  purpose: "Primary clinical review register for tissue specific manual validation against the current NCCP source.",
  governance: {
    record_scope: "Primary clinical review only. Independent consultant oncology and oncology pharmacy validation remain separate governance steps.",
    patient_data_policy: "Do not record patient names, identifiers, dates of birth or clinical case data in this validation workspace.",
    public_status_policy: "Local validation records do not change reader facing clinical validation status until incorporated into a controlled release."
  },
  protocol_count: protocols.length,
  tissue_context_count: contextCount,
  tissue_counts: tissueCounts,
  protocols
};

fs.writeFileSync(outPath, JSON.stringify(output, null, 2) + "\n", "utf8");
console.log(`Wrote ${outPath}`);
console.log(`Protocols: ${protocols.length}`);
console.log(`Tissue validation contexts: ${contextCount}`);
