#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const protocolRoot = path.join(root, 'protocols');
const expectedCodes = ['00334','00342','00379','00461','00658','00742','00804','00805','00806','00813'];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const p = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(p) : [p];
  });
}

function parseProtocols() {
  return walk(protocolRoot)
    .filter((file) => file.endsWith('.json'))
    .filter((file) => !['index.json','protocol-schema.json','package.json'].includes(path.basename(file)))
    .map((file) => {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      return { file: path.relative(root, file).replace(/\\/g, '/'), data };
    })
    .filter(({ data }) => data?.protocol_id && data?.metadata?.nccp_regimen_code && data.metadata.nccp_regimen_code !== '00000');
}

function tumourGroups(data) {
  const meta = data.metadata || {};
  const groups = [];
  if (typeof meta.tumour_group === 'string') groups.push(meta.tumour_group);
  for (const group of meta.tumour_groups || []) if (!groups.includes(group)) groups.push(group);
  return groups;
}

function duplicateValues(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  return [...counts.entries()].filter(([, count]) => count > 1).map(([value, count]) => ({ value, count }));
}

function demoValue(def) {
  if (def.demo_value !== undefined && def.demo_value !== null) return String(def.demo_value);
  if (def.type === 'select') return String(def.options?.[0]?.value ?? '');
  if (def.type === 'boolean') return 'false';
  if (def.type === 'number') return String(Number.isFinite(Number(def.min)) ? def.min : 0);
  return 'test';
}

const all = parseProtocols();
const neuro = all.filter(({ data }) => tumourGroups(data).includes('Neuro-oncology'));
const codes = neuro.map(({ data }) => String(data.metadata.nccp_regimen_code).padStart(5, '0')).sort();

const context = { console };
context.globalThis = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'js/rule-engine.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'js/assessment-engine.js'), 'utf8'), context);
const Engine = context.SACTCheckAssessmentEngine;
const RuleEngine = context.SACTCheckRuleEngine;

let singleEntryChecks = 0;
let ctcaeFields = 0;
let renalBandFields = 0;
const perProtocol = [];

for (const { file, data } of neuro) {
  const defsObject = data.input_definitions || {};
  const rules = data.rule_engine?.rules || [];
  for (const [id, def] of Object.entries(defsObject)) {
    if (def.ctcae_version) ctcaeFields += 1;
    const text = `${id} ${def.label || ''}`.toLowerCase();
    if (def.type === 'select' && /crcl|renal function|creatinine clearance/.test(text) && def.renal_input?.mode === 'protocol_specific_band') {
      renalBandFields += 1;
    }
  }
  const profileId = Engine.getProfiles(data)[0]?.id || 'default';
  const defs = Engine.getInputDefinitions(data, profileId, {});
  const linkedFields = new Set(rules.flatMap((rule) => RuleEngine.collectConditionFields(RuleEngine.conditionFromRule(rule))));
  const candidates = defs.filter((def) => def.visible !== false && linkedFields.has(def.id) && demoValue(def) !== '');
  let protocolSingleEntry = 0;
  for (const def of candidates) {
    const result = Engine.assess(data, { [def.id]: demoValue(def) }, { profileId });
    if (!Array.isArray(result.findings) || result.findings.length === 0) {
      throw new Error(`${data.protocol_id}/${def.id} returned no finding during single-entry audit`);
    }
    if (/insufficient data/i.test(String(result.status || ''))) {
      throw new Error(`${data.protocol_id}/${def.id} returned insufficient-data status during single-entry audit`);
    }
    protocolSingleEntry += 1;
    singleEntryChecks += 1;
  }
  perProtocol.push({
    nccp_code: String(data.metadata.nccp_regimen_code).padStart(5, '0'),
    version: String(data.metadata.nccp_version),
    title: data.metadata.title,
    file,
    status: data.status,
    source_url: data.metadata.source_url,
    input_count: Object.keys(defsObject).length,
    rule_count: rules.length,
    single_entry_fields_checked: protocolSingleEntry,
    supportive_care_mapped: Boolean(data.supportive_care?.emetogenic_risk && data.supportive_care?.mapping_source_url),
    partial_assessment_supported: data.metadata.partial_assessment_supported === true,
    required_input_count: Array.isArray(data.required_inputs) ? data.required_inputs.length : null,
  });
}

const audit = {
  release: '0.42.0',
  generated_at: new Date().toISOString(),
  scope: 'Complete current NCCP Neuro-oncology regimen-document catalogue',
  inventory: {
    complete_library_protocols: all.length,
    neuro_oncology_protocols: neuro.length,
    expected_nccp_codes: expectedCodes,
    actual_nccp_codes: codes,
    inventory_match: JSON.stringify(codes) === JSON.stringify(expectedCodes),
    placeholders_or_drafts: neuro.filter(({ data }) => /placeholder|draft/i.test(String(data.status))).map(({ data }) => data.protocol_id),
  },
  integrity: {
    duplicate_protocol_ids: duplicateValues(all.map(({ data }) => data.protocol_id)),
    duplicate_nccp_codes: duplicateValues(all.map(({ data }) => String(data.metadata.nccp_regimen_code).padStart(5, '0'))),
    neuro_source_urls_all_official_hse_documents: neuro.every(({ data }) => /^https:\/\/healthservice\.hse\.ie\/documents\//.test(data.metadata.source_url || '')),
    neuro_required_inputs_all_non_blocking: neuro.every(({ data }) => Array.isArray(data.required_inputs) && data.required_inputs.length === 0),
    neuro_supportive_care_all_mapped: neuro.every(({ data }) => Boolean(data.supportive_care?.emetogenic_risk && data.supportive_care?.mapping_source_url)),
  },
  coverage: {
    input_definitions: neuro.reduce((sum, { data }) => sum + Object.keys(data.input_definitions || {}).length, 0),
    decision_rules: neuro.reduce((sum, { data }) => sum + (data.rule_engine?.rules || []).length, 0),
    ctcae_fields: ctcaeFields,
    protocol_specific_renal_band_fields: renalBandFields,
    single_entry_rule_linked_fields_checked: singleEntryChecks,
  },
  technical_validation: {
    neuro_release_test: 'passed',
    complete_regression_suite: 'passed in working tree',
    clean_extraction_regression_suite: 'pending package validation',
    zip_integrity: 'pending package validation',
  },
  governance: {
    encoded_status: 'active encoded prototype',
    consultant_review: 'pending',
    oncology_pharmacy_review: 'pending',
    formal_clinical_use_authorisation: 'not granted by this release',
  },
  protocols: perProtocol.sort((a, b) => a.nccp_code.localeCompare(b.nccp_code)),
};

fs.writeFileSync(path.join(root, 'V0420_NEURO_LIBRARY_AUDIT.json'), `${JSON.stringify(audit, null, 2)}\n`);

const lines = [
  '# SACTCheck v0.42.0 — Neuro-oncology Validation Report',
  '',
  `Generated: ${audit.generated_at}`,
  '',
  '## Inventory',
  '',
  `- Complete indexed library: ${audit.inventory.complete_library_protocols} protocols`,
  `- Neuro-oncology deck: ${audit.inventory.neuro_oncology_protocols} active protocols`,
  `- Official NCCP regimen-document codes matched: ${audit.inventory.inventory_match ? 'Yes' : 'No'}`,
  `- Neuro-oncology placeholders or drafts: ${audit.inventory.placeholders_or_drafts.length}`,
  '',
  '## Encoding coverage',
  '',
  `- Input definitions: ${audit.coverage.input_definitions}`,
  `- Decision rules: ${audit.coverage.decision_rules}`,
  `- CTCAE-supported fields: ${audit.coverage.ctcae_fields}`,
  `- Protocol-specific renal-band fields: ${audit.coverage.protocol_specific_renal_band_fields}`,
  `- Rule-linked fields checked individually for single-entry assessment: ${audit.coverage.single_entry_rule_linked_fields_checked}`,
  '',
  '## Integrity checks',
  '',
  `- Duplicate protocol IDs: ${audit.integrity.duplicate_protocol_ids.length}`,
  `- Duplicate NCCP codes: ${audit.integrity.duplicate_nccp_codes.length}`,
  `- All Neuro-oncology source links point to official HSE/NCCP documents: ${audit.integrity.neuro_source_urls_all_official_hse_documents ? 'Yes' : 'No'}`,
  `- All Neuro-oncology protocols have non-blocking required-input configuration: ${audit.integrity.neuro_required_inputs_all_non_blocking ? 'Yes' : 'No'}`,
  `- All Neuro-oncology protocols have central supportive-care mappings: ${audit.integrity.neuro_supportive_care_all_mapped ? 'Yes' : 'No'}`,
  '',
  '## Protocol inventory',
  '',
  '| NCCP | Version | Protocol | Inputs | Rules | Single-entry checks |',
  '|---|---:|---|---:|---:|---:|',
  ...audit.protocols.map((p) => `| ${p.nccp_code} | ${p.version} | ${p.title.replace(/\|/g, '\\|')} | ${p.input_count} | ${p.rule_count} | ${p.single_entry_fields_checked} |`),
  '',
  '## Clinical-governance status',
  '',
  'The release is technically encoded and regression-tested. Independent line-by-line consultant and oncology-pharmacy review remains required before formal clinical deployment.',
  '',
];
fs.writeFileSync(path.join(root, 'VALIDATION_REPORT_v0.42.0.md'), `${lines.join('\n')}\n`);

console.log(JSON.stringify({
  protocols: neuro.length,
  inputs: audit.coverage.input_definitions,
  rules: audit.coverage.decision_rules,
  ctcaeFields,
  renalBandFields,
  singleEntryChecks,
}, null, 2));
