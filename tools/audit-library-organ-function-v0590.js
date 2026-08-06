#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const protocolRoot = path.join(root, 'protocols');
const sourceRegister = JSON.parse(fs.readFileSync(path.join(root, 'V0590_ORGAN_FUNCTION_SOURCE_REGISTER.json'), 'utf8'));
const reconciledCodes = new Set(sourceRegister.records.map(r => r.nccp_code));
const OUTPUT_JSON = path.join(root, 'V0590_ORGAN_FUNCTION_RECONCILIATION_AUDIT.json');
const OUTPUT_CSV = path.join(root, 'V0590_ORGAN_FUNCTION_RECONCILIATION_AUDIT.csv');
const OUTPUT_MD = path.join(root, 'V0590_ORGAN_FUNCTION_RECONCILIATION_AUDIT.md');

function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return files(full);
    return entry.isFile() && entry.name.endsWith('.json') && entry.name !== 'index.json' ? [full] : [];
  });
}
function asArray(v) { return v == null ? [] : Array.isArray(v) ? v : [v]; }
function conditionFields(node, out = []) {
  if (!node) return out;
  if (Array.isArray(node)) { node.forEach(x => conditionFields(x, out)); return out; }
  if (typeof node !== 'object') return out;
  if (node.field) out.push(String(node.field));
  ['all', 'any', 'none', 'not', 'when', 'condition'].forEach(k => conditionFields(node[k], out));
  return out;
}
const organPattern = /(?:renal|kidney|crcl|egfr|gfr|creatinine|dialysis|haemodialysis|hepatic|liver|bilirubin|bili|ast|alt|transaminase|child[ _-]?pugh|alp)/i;
function organInputs(protocol) {
  const defs = protocol.input_definitions || {};
  return Object.entries(defs).filter(([id, d]) => organPattern.test(`${id} ${d?.label || ''} ${d?.unit || ''}`)).map(([id]) => id);
}
function organRules(protocol) {
  return asArray(protocol.rule_engine?.rules).filter(r => conditionFields(r.when || r.condition || r).some(f => organPattern.test(f))).map(r => r.id || r.rule_id || '(unnamed)');
}

const records = files(protocolRoot).filter(file => !file.includes(`${path.sep}_template${path.sep}`)).map(file => {
  const protocol = JSON.parse(fs.readFileSync(file, 'utf8'));
  const m = protocol.metadata || {};
  const code = String(m.nccp_regimen_code || '');
  const rec = m.organ_function_reconciliation || null;
  const inScope = reconciledCodes.has(code);
  const inputs = organInputs(protocol);
  const rules = organRules(protocol);
  const issues = [];
  if (inScope) {
    if (!rec) issues.push('missing_reconciliation_metadata');
    if (rec?.release !== '0.59.0') issues.push('wrong_reconciliation_release');
    if (rec?.source_reconciled !== true) issues.push('source_reconciled_not_true');
    if (m.encoding_maturity?.level !== 'source_reconciled_rule_encoding') issues.push('wrong_encoding_maturity');
    if (m.validation?.rule_level_source_reconciliation_status !== 'source_reconciled_organ_function_v0590') issues.push('wrong_validation_status');
    if (rec?.resolution === 'structured_rules' && !rules.some(id => String(id).startsWith('OF590_'))) issues.push('structured_resolution_without_v0590_rule');
    if (rec?.resolution === 'source_reviewed_no_prescriptive_adjustment' && rules.some(id => String(id).startsWith('OF590_'))) issues.push('no_prescriptive_resolution_with_artificial_rule');
    if (!['structured_rules', 'source_reviewed_no_prescriptive_adjustment'].includes(rec?.resolution)) issues.push('invalid_resolution');
  }
  if (m.encoding_maturity?.level === 'partial_rule_encoding') issues.push('remaining_partial_rule_encoding');
  return {
    code,
    protocol_id: protocol.protocol_id,
    path: path.relative(root, file).replace(/\\/g, '/'),
    title: m.title || '',
    in_v0590_scope: inScope,
    encoding_maturity: m.encoding_maturity?.level || 'not_formally_audited',
    resolution: rec?.resolution || '',
    source_url: rec?.source_url || m.source_url || '',
    organ_inputs: inputs,
    organ_rules: rules,
    issues,
  };
}).sort((a, b) => a.code.localeCompare(b.code));

const scopeRecords = records.filter(r => r.in_v0590_scope);
const issueRecords = records.filter(r => r.issues.length);
const summary = {
  release: '0.59.0',
  generated: '2026-08-05',
  protocols_scanned: records.length,
  protocols_in_reconciliation_scope: scopeRecords.length,
  structured_rule_records: scopeRecords.filter(r => r.resolution === 'structured_rules').length,
  source_reviewed_no_prescriptive_adjustment_records: scopeRecords.filter(r => r.resolution === 'source_reviewed_no_prescriptive_adjustment').length,
  remaining_partial_rule_encoding_records: records.filter(r => r.encoding_maturity === 'partial_rule_encoding').length,
  records_with_audit_issues: issueRecords.length,
  total_v0590_rules: scopeRecords.reduce((n, r) => n + r.organ_rules.filter(id => String(id).startsWith('OF590_')).length, 0),
  note: 'The v0.59.0 scope is the 74 records marked partial by v0.58.1. A source-reviewed no-prescriptive-adjustment resolution intentionally avoids introducing an unsupported cutoff. Independent Consultant and oncology-pharmacy validation remains pending.'
};

fs.writeFileSync(OUTPUT_JSON, JSON.stringify({ summary, records }, null, 2) + '\n');
const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
const rows = [['code','protocol_id','path','title','in_scope','encoding_maturity','resolution','source_url','organ_inputs','organ_rules','issues']];
records.forEach(r => rows.push([r.code,r.protocol_id,r.path,r.title,r.in_v0590_scope,r.encoding_maturity,r.resolution,r.source_url,r.organ_inputs.join('|'),r.organ_rules.join('|'),r.issues.join('|')]));
fs.writeFileSync(OUTPUT_CSV, rows.map(r => r.map(esc).join(',')).join('\n') + '\n');
const md = [
  '# SACTCheck v0.59.0 Library-Wide Organ-Function Reconciliation Audit','',
  `- Protocols scanned: **${summary.protocols_scanned}**`,
  `- Previously partial records reconciled: **${summary.protocols_in_reconciliation_scope}**`,
  `- Structured renal/hepatic rule records: **${summary.structured_rule_records}**`,
  `- Source-reviewed records with no prescriptive organ-function adjustment table: **${summary.source_reviewed_no_prescriptive_adjustment_records}**`,
  `- Remaining \`partial_rule_encoding\` records: **${summary.remaining_partial_rule_encoding_records}**`,
  `- Audit issues: **${summary.records_with_audit_issues}**`,
  `- New v0.59.0 organ-function rules: **${summary.total_v0590_rules}**`,'',
  summary.note,'','## Audit issues',''
];
if (!issueRecords.length) md.push('No reconciliation audit issues detected.');
else issueRecords.forEach(r => md.push(`- **${r.code} — ${r.title}**: ${r.issues.join(', ')} (${r.path})`));
fs.writeFileSync(OUTPUT_MD, md.join('\n') + '\n');
console.log(JSON.stringify(summary, null, 2));
if (process.argv.includes('--fail-on-issue') && issueRecords.length) process.exit(1);
