const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const Engine = require('../js/assessment-engine.js');

const root = path.resolve(__dirname, '..');
const pkg = require(path.join(root, 'package.json'));
const p451 = require(path.join(root, 'protocols/gastrointestinal/00451-5-fluorouracil-4-day-mitomycin-and-radiotherapy.json'));
const p450 = require(path.join(root, 'protocols/genitourinary/00450-mitomycin-and-5-fluorouracil-with-radiotherapy.json'));

assert(pkg.version.localeCompare('0.58.1', undefined, { numeric: true }) >= 0);

for (const protocol of [p451, p450]) {
  const defs = protocol.input_definitions;
  for (const field of ['crcl_ml_min', 'renal_impairment_severity', 'bilirubin_umol_l', 'ast_uln_multiple', 'ast_u_l', 'hepatic_impairment_severity']) {
    assert.ok(defs[field], `${protocol.protocol_id} missing ${field}`);
    assert.strictEqual(defs[field].required, false, `${protocol.protocol_id}/${field} must remain optional for partial assessment`);
  }
  assert.strictEqual(defs.ast_u_l.visible, false, 'Absolute AST should be derived from the visible local-lab AST input.');
  assert.strictEqual(defs.ast_uln_multiple.derived_actual_field, 'ast_u_l');
  assert.strictEqual(protocol.metadata.encoding_maturity.level, 'rule_level_source_reconciled');
  assert.strictEqual(protocol.metadata.validation.clinical_use_authorised, false);
  assert.ok(protocol.rule_engine.rules.some(rule => rule.id === '5FU_BILIRUBIN_GT_85'));
  assert.ok(protocol.rule_engine.rules.some(rule => rule.id === '5FU_AST_GT_180'));
  assert.ok(protocol.rule_engine.rules.some(rule => rule.id === 'MITOMYCIN_CRCL_LT_10'));
  assert.ok(protocol.rule_engine.rules.some(rule => rule.id === 'MITOMYCIN_AST_GT_2_ULN'));
}

assert.ok(!p450.input_definitions.alt_ast_uln_multiple, '00450 must not use combined ALT/AST ×ULN for an AST-specific rule.');
assert.ok(!p450.input_definitions.bilirubin_uln_multiple, '00450 must use the source absolute bilirubin threshold rather than bilirubin ×ULN.');

function assess(protocol, values) {
  return Engine.assess(protocol, values, { profileId: 'default' });
}

let result = assess(p451, { platelets_x10e9_l: 80 });
assert.strictEqual(result.actionType, 'delay', 'Platelets 75–99 must no longer return a permissive result.');
result = assess(p451, { platelets_x10e9_l: 40 });
assert.strictEqual(result.actionType, 'delay_then_dose_reduce');
result = assess(p451, { crcl_ml_min: 8 });
assert.strictEqual(result.actionType, 'dose_reduce');
result = assess(p451, { bilirubin_umol_l: 90 });
assert.strictEqual(result.actionType, 'contraindicated');
result = assess(p451, { ast_u_l: 200 });
assert.strictEqual(result.actionType, 'contraindicated');
result = assess(p451, { ast_uln_multiple: 2.5 });
assert.strictEqual(result.actionType, 'consultant_review');
result = assess(p451, { hepatic_impairment_severity: 'moderate' });
assert.strictEqual(result.actionType, 'dose_reduce');
result = assess(p451, { diarrhoea_grade: 3 });
assert.strictEqual(result.actionType, 'delay_then_dose_reduce');
result = assess(p450, { platelets: 80 });
assert.strictEqual(result.actionType, 'delay');
result = assess(p450, { crcl_ml_min: 40 });
assert.strictEqual(result.actionType, 'consultant_review', '00450 uses mitomycin 12 mg/m² and must surface the high-dose CrCl 10–60 caution.');

const ui = fs.readFileSync(path.join(root, 'js/generic-assessment-ui.js'), 'utf8');
const loader = fs.readFileSync(path.join(root, 'js/protocol-loader.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.ok(ui.includes('derivedActualField'));
assert.ok(ui.includes('calculation.highestPart.actual'));
assert.ok(loader.includes('encodingMaturityBadge'));
assert.ok(html.includes('SACTCheck v0.59.0 — Library-Wide Organ-Function Reconciliation'));
assert.ok(html.includes('js/generic-assessment-ui.js?v=0.59.0'));
assert.ok(html.includes('js/protocol-loader.js?v=0.59.0'));

execFileSync(process.execPath, [path.join(root, 'tools/audit-organ-function-rule-coverage.js'), '--fail-on-mismatch'], { cwd: root, stdio: 'pipe' });
const audit = JSON.parse(fs.readFileSync(path.join(root, 'V0581_ORGAN_FUNCTION_RULE_COVERAGE_AUDIT.json'), 'utf8'));
assert.strictEqual(audit.summary.protocols_with_rule_level_claim_mismatch, 0);
assert.strictEqual(audit.summary.protocols_scanned, 381);

const partial = audit.records.filter(record => record.encoding_maturity === 'partial_rule_encoding');
assert.strictEqual(partial.length, 0, 'v0.59.0 should reconcile all records previously marked partial.');

console.log('v0.58.1 organ-function reconciliation tests passed.');
