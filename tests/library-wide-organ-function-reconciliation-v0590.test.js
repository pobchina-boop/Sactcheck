const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const Engine = require('../js/assessment-engine.js');

const root = path.resolve(__dirname, '..');
const pkg = require(path.join(root, 'package.json'));
const index = require(path.join(root, 'protocols/index.json'));
const register = require(path.join(root, 'V0590_ORGAN_FUNCTION_SOURCE_REGISTER.json'));

assert.strictEqual(pkg.version, '0.59.0');
assert.strictEqual(register.release, '0.59.0');
assert.strictEqual(register.protocol_count, 74);
assert.strictEqual(register.structured_rule_records, 70);
assert.strictEqual(register.source_reviewed_no_prescriptive_adjustment_records, 4);
assert.strictEqual(new Set(register.records.map(r => r.nccp_code)).size, 74);

function protocol(code) {
  const entry = index.protocols.find(item => String(item.metadata?.nccp_regimen_code || item.code || '').padStart(5, '0') === code || item.path.includes(`/${code}-`));
  assert(entry, `Missing protocol ${code}`);
  return JSON.parse(fs.readFileSync(path.join(root, entry.path), 'utf8'));
}
function assess(code, values) {
  return Engine.assess(protocol(code), values, { profileId: 'default' });
}

for (const item of register.records) {
  const p = protocol(item.nccp_code);
  const m = p.metadata || {};
  const rec = m.organ_function_reconciliation;
  assert(rec, `${item.nccp_code}: missing organ-function reconciliation metadata`);
  assert.strictEqual(rec.release, '0.59.0');
  assert.strictEqual(rec.source_reconciled, true);
  assert.strictEqual(rec.partial_assessment_supported, true);
  assert.strictEqual(rec.consultant_reviewed, false);
  assert.strictEqual(rec.oncology_pharmacy_reviewed, false);
  assert.strictEqual(rec.clinical_use_authorised, false);
  assert.strictEqual(m.encoding_maturity.level, 'source_reconciled_rule_encoding');
  assert.strictEqual(m.validation.rule_level_source_reconciliation_status, 'source_reconciled_organ_function_v0590');
  for (const [field, def] of Object.entries(p.input_definitions || {})) {
    if (/renal|crcl|gfr|dialysis|hepatic|bilirubin|bili|ast|alt|child_pugh|alp/i.test(`${field} ${def.label || ''}`)) {
      assert.strictEqual(def.required, false, `${item.nccp_code}/${field} must remain optional for independent partial assessment`);
      assert.notStrictEqual(def.demo_value, undefined, `${item.nccp_code}/${field} requires demo_value`);
    }
  }
  const releaseRules = (p.rule_engine?.rules || []).filter(r => String(r.id || r.rule_id || '').startsWith('OF590_'));
  if (rec.resolution === 'structured_rules') assert(releaseRules.length > 0, `${item.nccp_code}: structured resolution lacks v0.59.0 rules`);
  else {
    assert.strictEqual(rec.resolution, 'source_reviewed_no_prescriptive_adjustment');
    assert.strictEqual(releaseRules.length, 0, `${item.nccp_code}: no-prescriptive-adjustment record must not invent a rule`);
  }
}

const allProtocols = index.protocols.map(e => JSON.parse(fs.readFileSync(path.join(root, e.path), 'utf8')));
assert.strictEqual(allProtocols.filter(p => p.metadata?.encoding_maturity?.level === 'partial_rule_encoding').length, 0, 'No v0.58.1 partial organ-function records should remain.');

function rawValueForDecision(definition, desired) {
  if (definition?.type === 'select') {
    const option = (definition.options || []).find(item => String(
      Object.prototype.hasOwnProperty.call(item, 'decision_value') ? item.decision_value : item.value
    ) === String(desired));
    if (option) return option.value;
  }
  return desired;
}

function witnessForCondition(node, definitions) {
  const values = {};
  if (!node || typeof node !== 'object') return values;
  if (Array.isArray(node.all)) {
    for (const condition of node.all) Object.assign(values, witnessForCondition(condition, definitions));
    return values;
  }
  if (Array.isArray(node.any)) return node.any.length ? witnessForCondition(node.any[0], definitions) : values;
  const { field, operator, value } = node;
  if (!field) return values;
  let desired = value;
  if (operator === 'in') desired = Array.isArray(value) ? value[0] : value;
  else if (operator === '>') desired = Number(value) + 0.1;
  else if (operator === '>=') desired = value;
  else if (operator === '<') desired = Math.max(0, Number(value) - 0.1);
  else if (operator === '<=') desired = value;
  else if (operator === '!=') desired = typeof value === 'boolean' ? !value : Number(value) + 1;
  values[field] = rawValueForDecision(definitions[field], desired);
  return values;
}

let triggerableRuleCount = 0;
for (const p of allProtocols) {
  for (const rule of p.rule_engine?.rules || []) {
    const ruleId = String(rule.id || rule.rule_id || '');
    if (!ruleId.startsWith('OF590_')) continue;
    triggerableRuleCount += 1;
    const values = witnessForCondition(rule.when || rule.condition, p.input_definitions || {});
    const result = Engine.assess(p, values, { profileId: 'default' });
    assert(
      result.findings.some(finding => finding.ruleId === ruleId),
      `${p.protocol_id}/${ruleId} could not be triggered through the assessment engine with ${JSON.stringify(values)}`
    );
  }
}
assert.strictEqual(triggerableRuleCount, 299, 'Every v0.59.0 organ-function rule must be executable through the live assessment engine.');

// Sentinel source pathways and single-value partial assessments.
let result = assess('00205', { pld_bilirubin_band: '51_86' });
assert.strictEqual(result.actionType, 'dose_reduce');
assert(result.findings.some(f => String(f.ruleId || '').includes('PLD_BILI_51_86')));

result = assess('00460', { cisplatin_crcl_band: '40_49' });
assert.strictEqual(result.actionType, 'dose_reduce');
result = assess('00460', { fluorouracil_bilirubin_umol_l: 90 });
assert.strictEqual(result.actionType, 'contraindicated');

result = assess('00284', { gemcitabine_bilirubin_band: 'ge27' });
assert.strictEqual(result.actionType, 'dose_reduce');

result = assess('00311', { topotecan_renal_band: '20_39' });
assert.strictEqual(result.actionType, 'dose_reduce');
result = assess('00311', { topotecan_bilirubin_band: 'gt171' });
assert.strictEqual(result.actionType, 'contraindicated');

result = assess('00587', { topotecan_oral_renal_band: '30_49' });
assert.strictEqual(result.actionType, 'dose_reduce');

result = assess('00642', { lutathera_renal_band: 'lt30' });
assert.strictEqual(result.actionType, 'contraindicated');
result = assess('00642', { lutathera_hepatic_band: 'severe' });
assert.strictEqual(result.actionType, 'consultant_review');

result = assess('00889', { targeted_renal_band: 'lt30' });
assert.strictEqual(result.actionType, 'dose_reduce');
result = assess('00890', { targeted_hepatic_band: 'severe' });
assert.strictEqual(result.actionType, 'contraindicated');
result = assess('00823', { targeted_hepatic_band: 'C' });
assert.strictEqual(result.actionType, 'contraindicated');
result = assess('00320', { child_pugh_class: 'B' });
assert.strictEqual(result.actionType, 'dose_reduce');

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert(html.includes('SACTCheck v0.59.0 — Library-Wide Organ-Function Reconciliation'));
assert(html.includes('v0.59.0 · What changed?'));
assert(html.includes('js/generic-assessment-ui.js?v=0.59.0'));
assert(html.includes('js/protocol-loader.js?v=0.59.0'));

execFileSync(process.execPath, [path.join(root, 'tools/audit-library-organ-function-v0590.js'), '--fail-on-issue'], { cwd: root, stdio: 'pipe' });
const audit = JSON.parse(fs.readFileSync(path.join(root, 'V0590_ORGAN_FUNCTION_RECONCILIATION_AUDIT.json'), 'utf8'));
assert.strictEqual(audit.summary.protocols_in_reconciliation_scope, 74);
assert.strictEqual(audit.summary.remaining_partial_rule_encoding_records, 0);
assert.strictEqual(audit.summary.records_with_audit_issues, 0);
assert(audit.summary.total_v0590_rules >= 250);

console.log('v0.59.0 library-wide organ-function reconciliation tests passed.');
