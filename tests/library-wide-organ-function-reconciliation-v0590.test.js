const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const Engine = require('../js/assessment-engine.js');

const root = path.resolve(__dirname, '..');
const pkg = require(path.join(root, 'package.json'));
const index = require(path.join(root, 'protocols/index.json'));
const register = require(path.join(root, 'V0590_ORGAN_FUNCTION_SOURCE_REGISTER.json'));
const crypto = require('crypto');
const net37=require('../tools/neuroendocrine-organ-migration-v08437.cjs');
const migrations36=require('../validation/colorectal-v08436/organ-function-migrations.json').records;
const migrations35=require('../validation/colorectal-v08435/organ-function-migrations.json').records;
const migrations24=require('../validation/targeted-lung-v08424/organ-function-migrations.json').records;

assert.ok(Number(pkg.version.split('.').slice(0, 2).join('.')) >= 0.59, 'Current package must retain the v0.59.0 organ-function release.');
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

// Exact v36 migration membership, current sources and retained before evidence.
// 00216 is deliberately checked without adding it to the historical 74-record register.
assert.deepStrictEqual(Object.keys(migrations36).sort(), ['00216','00692']);
for (const [code, migration] of Object.entries(migrations36)) {
  const p=protocol(code),m=p.metadata, inScope=register.records.some(r=>r.nccp_code===code);
  assert.strictEqual(inScope,migration.in_historical_v0590_scope);
  assert.strictEqual(m.clinical_audit_release,'0.84.36');
  assert.strictEqual(m.validation.audit_release,'0.84.36');
  assert.strictEqual(m.nccp_version,migration.source_version);
  assert.strictEqual(m.source_url,migration.source_url);
  assert.strictEqual(m.source_pdf_sha256,migration.source_sha256);
  assert.strictEqual(m.encoding_maturity.level,migration.maturity);
  assert.strictEqual(m.validation.rule_level_source_reconciliation_status,migration.status);
  for(const flag of ['consultant_reviewed','oncology_pharmacy_reviewed','clinical_use_authorised']){assert.strictEqual(m.validation[flag],false);assert.strictEqual(m.encoding_maturity[flag],false);}
  for(const [field,def] of Object.entries(p.input_definitions||{}))if(/renal|crcl|gfr|dialysis|hepatic|bilirubin|bili|ast|alt|child_pugh|alp/i.test(`${field} ${def.label||''}`)){assert.strictEqual(def.required,false,code+'/'+field+' v36 partial assessment');assert.notStrictEqual(def.demo_value,undefined);}
  for(const [file,hash] of [[migration.source_pdf,migration.source_sha256],[migration.supplementary_pdf,migration.supplementary_sha256],[migration.baseline_path,migration.baseline_sha256]])assert.strictEqual(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex'),hash,code+' retained v36 evidence');
  const old=JSON.parse(fs.readFileSync(path.join(root,migration.baseline_path)));
  assert.strictEqual(old.metadata.source_pdf_sha256,migration.baseline_source_sha256);
  assert.strictEqual(migration.baseline_source_sha256,migration.source_sha256,'These two source versions are unchanged; do not silently migrate their PDF identity');
  assert.deepStrictEqual(old.rule_engine.rules.map(r=>r.rule_id||r.id).filter(id=>id.startsWith('OF590_')),migration.replaced_legacy_rules);
  assert.deepStrictEqual(migration.replaced_legacy_rules,[],'v36 does not remove any further historical OF590 rules');
  assert(!p.rule_engine.rules.some(r=>String(r.rule_id||r.id).startsWith('OF590_')));
  for(const id of migration.required_rules){const r=p.rule_engine.rules.find(r=>(r.rule_id||r.id)===id),s=migration.required_rule_sources[id];assert(r,code+' v36 organ rule '+id);assert.strictEqual(r.source.url,s.url);assert.deepStrictEqual(r.source.page,s.page);assert.strictEqual(r.source.checked_date,'2026-11-05');}
  assert(fs.existsSync(path.join(root,migration.source_case_path)));
  assert(fs.existsSync(path.join(root,migration.audit_path)));
  const result=JSON.parse(fs.readFileSync(path.join(root,migration.source_result_path)));assert.strictEqual(result.failed,0);assert(result.total>0);assert.strictEqual(result.passed,result.total);
  if(inScope){assert.strictEqual(m.organ_function_reconciliation.release,migration.reconciliation_release);assert.strictEqual(m.organ_function_reconciliation.resolution,migration.resolution);}
  else assert.strictEqual(migration.resolution,'outside_historical_v0590_scope');
}

for(const code of ['00320','00327','00505','00642'])net37.validate(code,protocol(code));
assert.deepStrictEqual(Object.values(net37.records).flatMap(x=>x.replaced_legacy_rules).sort(),['OF590_00505_CAPE_RENAL_30_50','OF590_00505_CAPE_RENAL_LT30','OF590_00505_CAPE_HEPATIC_HOLD','OF590_00505_TMZ_RENAL_LOW','OF590_00505_TMZ_HEP_SEV','OF590_00642_LUTA_LT30','OF590_00642_LUTA_30_39','OF590_00642_LUTA_HEP_SEV','OF590_00642_LUTA_RENAL_TOX','OF590_00642_LUTA_HEP_TOX'].sort());

for (const item of register.records) {
  const p = protocol(item.nccp_code);
  const m = p.metadata || {};
  const migration45=require('./helpers/head-neck-inputs-v08445.cjs').validate(p);
  const rec = m.organ_function_reconciliation;
  const migration37=net37.records[item.nccp_code];
  const migration36=m.clinical_audit_release==='0.84.36'&&migrations36[item.nccp_code];
  const migration35=m.clinical_audit_release==='0.84.35'&&migrations35[item.nccp_code];
  const migration34=m.sactcheck_encoding_version==='0.84.34'&&require('../validation/colorectal-v08434/organ-function-migrations.json').records[item.nccp_code];
  const migration33=rec?.reconciled_release==='0.84.33'&&require('../validation/colorectal-v08433/organ-function-migrations.json').records[item.nccp_code];
  const migration32=rec?.reconciled_release==='0.84.32'&&require('../validation/colorectal-v08432/organ-function-migrations.json').records[item.nccp_code];
  const migration30=m.sactcheck_encoding_version==='0.84.30'&&require('../validation/lung-completion-v08430/organ-function-migrations.json').records[item.nccp_code];
  const migration29=m.sactcheck_encoding_version==='0.84.29'&&require('../validation/lung-cytotoxic-v08429/organ-function-migrations.json').records[item.nccp_code];
  const migration26=m.sactcheck_encoding_version==='0.84.26'&&require('../validation/lung-next-v08426/organ-function-migrations.json').records[item.nccp_code];
  const migration25=['0.84.25','0.84.29'].includes(m.sactcheck_encoding_version)&&require('../validation/targeted-lung-v08425/organ-function-migrations.json').records[item.nccp_code];
  const migration24=m.sactcheck_encoding_version==='0.84.24'&&migrations24[item.nccp_code];
  const v08422 = (item.nccp_code === '00318' && ['0.84.22','0.84.28'].includes(m.sactcheck_encoding_version)) || (item.nccp_code === '00222' && ['0.84.23','0.84.29'].includes(m.sactcheck_encoding_version));
  const v0836 = m.validation?.audit_release === '0.83.6';
  const superseded = (['00207','00447','00448','00732','00328','00585','00330','00331','00692','00733','00210','00213','00586','00623','00225'].includes(item.nccp_code) && m.validation?.audit_release === '0.84.21') || v0836 || (['00586','00623'].includes(item.nccp_code) && m.validation?.audit_release === '0.83.4') || (item.nccp_code === '00225' && m.validation?.audit_release === '0.83.5');
  assert(rec, `${item.nccp_code}: missing organ-function reconciliation metadata`);
  assert.strictEqual(rec.release, migration37?migration37.reconciliation_release:migration36?migration36.reconciliation_release:migration25?migration25.release:migration24&&item.nccp_code==='00243'?'0.84.24':item.nccp_code === '00205' ? '0.84.1' : '0.59.0');
  assert.strictEqual(rec.source_reconciled, true);
  assert.strictEqual(rec.partial_assessment_supported, true);
  assert.strictEqual(rec.consultant_reviewed, false);
  assert.strictEqual(rec.oncology_pharmacy_reviewed, false);
  assert.strictEqual(rec.clinical_use_authorised, false);
  assert.strictEqual(m.encoding_maturity.level, migration45 ? migration45.maturity : migration37 ? migration37.maturity : migration36 ? migration36.maturity : migration35 ? migration35.maturity : migration34 ? migration34.maturity : (migration30||migration29||v08422||migration24||migration25||migration26) ? 'source_reconciled_pending_independent_review' : 'source_reconciled_rule_encoding');
  assert.strictEqual(m.validation.rule_level_source_reconciliation_status, migration45?migration45.status:migration37?migration37.status:migration36?migration36.status:migration35?migration35.status:migration34?migration34.status:migration33?migration33.status:migration32?'source_reconciled_v08432_independent_review_pending':migration30?'source_reconciled_v08430_independent_review_pending':m.sactcheck_encoding_version==='0.84.29'?'source_reconciled_v08429_independent_review_pending':m.sactcheck_encoding_version==='0.84.28'?'source_reconciled_v08428_independent_review_pending':migration26?'source_reconciled_v08426_independent_review_pending':migration25?'source_reconciled_v08425_independent_review_pending':migration24?'source_reconciled_v08424_independent_review_pending':v08422 ? 'source_reconciled_pending_independent_clinical_and_pharmacy_review' : item.nccp_code === '00205' ? 'full_source_audit_v0841_pending_independent_validation' : superseded ? 'source_mapped_with_declared_conflicts_pending_independent_clinical_review' : 'source_reconciled_organ_function_v0590');
  for (const [field, def] of Object.entries(p.input_definitions || {})) {
    if (/renal|crcl|gfr|dialysis|hepatic|bilirubin|bili|ast|alt|child_pugh|alp/i.test(`${field} ${def.label || ''}`)) {
      assert.strictEqual(def.required, false, `${item.nccp_code}/${field} must remain optional for independent partial assessment`);
      assert.notStrictEqual(def.demo_value, undefined, `${item.nccp_code}/${field} requires demo_value`);
    }
  }
  const releaseRules = (p.rule_engine?.rules || []).filter(r => String(r.id || r.rule_id || '').startsWith('OF590_'));
  if(migration45){assert.deepStrictEqual(releaseRules.map(r=>r.id||r.rule_id),migration45.retained_legacy_organ_rule_ids);}
  else if(migration37){assert.equal(rec.resolution,migration37.resolution);assert.deepStrictEqual(releaseRules.map(r=>r.id||r.rule_id),migration37.retained_legacy_rules);}
  else if(migration36){
    assert.equal(rec.resolution,migration36.resolution);
    assert.equal(releaseRules.length,0,'v36 source audit retains no superseded historical organ rule');
  }
  else if(migration35){
    assert.equal(rec.resolution,migration35.resolution);
    assert.equal(m.validation.audit_release,'0.84.35');
    assert.equal(m.nccp_version,migration35.source_version);
    assert.equal(m.source_url,migration35.source_url);
    for(const [file,hash] of [[migration35.source_pdf,migration35.source_sha256],[migration35.baseline_path,migration35.baseline_sha256]])assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex'),hash,item.nccp_code+' retained migration evidence');
    const old=JSON.parse(fs.readFileSync(path.join(root,migration35.baseline_path)));
    assert.deepStrictEqual(old.rule_engine.rules.map(r=>r.rule_id||r.id).filter(id=>id.startsWith('OF590_')),migration35.replaced_legacy_rules);
    assert.equal(releaseRules.length,0,'Current audit removes superseded legacy organ rules');
    for(const id of migration35.required_rules)assert(p.rule_engine.rules.some(r=>(r.rule_id||r.id)===id&&r.source?.url===m.source_url&&r.source?.page),item.nccp_code+' current source rule '+id);
    assert(fs.existsSync(path.join(root,'validation/colorectal-v08435',migration35.group,'source-cases.cjs')));
  }
  else if(migration34){assert.equal(rec.resolution,migration34.resolution);assert.equal(m.validation.audit_release,'0.84.34');assert.equal(releaseRules.length,0);for(const id of migration34.required_rules)assert(p.rule_engine.rules.some(r=>r.rule_id===id&&r.source?.url===m.source_url&&r.source?.page),item.nccp_code+' audited organ rule '+id);assert(fs.existsSync(path.join(root,'validation/colorectal-v08434',migration34.group,'source-cases.cjs')));}
  else if(migration33){assert.equal(rec.reconciled_release,'0.84.33');for(const id of migration33.required_rules)assert(p.rule_engine.rules.some(r=>(r.rule_id||r.id)===id&&r.source?.url===m.source_url&&r.source?.page),item.nccp_code+' source rule '+id);assert(fs.existsSync(path.join(root,'validation/colorectal-v08433',migration33.group,'source-cases.cjs')));assert.equal(releaseRules.length,0);}
  else if(migration32){assert.equal(rec.reconciled_release,'0.84.32');for(const id of migration32.required_rules)assert(p.rule_engine.rules.some(r=>(r.rule_id||r.id)===id&&r.source?.url===m.source_url&&r.source?.page),item.nccp_code+' source rule '+id);assert(fs.existsSync(path.join(root,'tests/clinical-audit-v08432.test.cjs')));}
  else if(migration30){assert.equal(rec.reconciled_release,'0.84.30');assert.equal(rec.resolution,migration30.resolution);assert.equal(releaseRules.length,0,'Conflicting legacy organ rules must be removed');for(const id of migration30.required_rules)assert(p.rule_engine.rules.some(r=>(r.rule_id||r.id)===id&&r.source?.url===m.source_url&&r.source?.page));assert(fs.existsSync(path.join(root,'validation/lung-completion-v08430',migration30.group,'source-cases.cjs')));}
  else if(migration29){for(const id of migration29.required_rules)assert(p.rule_engine.rules.some(r=>(r.rule_id||r.id)===id&&r.source?.url===m.source_url&&r.source?.page));assert(fs.existsSync(path.join(root,'validation/lung-cytotoxic-v08429',migration29.group,'source-cases.cjs')));}
  else if(migration26){assert.equal(rec.reconciled_release,'0.84.26');assert.equal(rec.resolution,migration26.resolution);for(const id of migration26.required_rules)assert(p.rule_engine.rules.some(r=>(r.rule_id||r.id)===id&&r.source?.url&&r.source?.page));assert(fs.existsSync(path.join(root,'validation/lung-next-v08426',migration26.group,'source-cases.cjs')));}
  else if(migration25){assert.equal(rec.resolution,migration25.resolution);for(const id of migration25.required_rules)assert(p.rule_engine.rules.some(r=>(r.rule_id||r.id)===id&&r.source?.url&&r.source?.page),item.nccp_code+': missing audited v25 rule '+id);assert(fs.existsSync(path.join(root,'validation/targeted-lung-v08425',migration25.group,'source-cases.cjs')));}
  else if (rec.resolution === 'structured_rules') {
    if(migration24){
      for(const id of migration24.required_rules)assert(p.rule_engine.rules.some(r=>(r.rule_id||r.id)===id&&r.source?.url&&r.source?.page),item.nccp_code+': missing audited replacement '+id);
      assert(fs.existsSync(path.join(root,'validation/targeted-lung-v08424',migration24.group,'source-cases.cjs')));
    }else if(v08422){
      for(const id of (item.nccp_code === '00222' ? ['PEMETREXED_CRCL_LT45','SEVERE_HEPATIC_IMPAIRMENT'] : ['PEMETREXED_CRCL_LT45','CARBO_GFR_20_OR_LESS','CARBO_GFR_20_30','SEVERE_HEPATIC_IMPAIRMENT']))assert(p.rule_engine.rules.some(r=>r.rule_id===id && r.source.url===m.source_url));
      assert.equal(releaseRules.length,0);
    } else if(superseded) {
      for(const id of (v0836 ? (['00207','00732'].includes(item.nccp_code)?['ORGAN_REVIEW']:['00213','00330','00331'].includes(item.nccp_code)?['RENAL_IRI','BILI_CI']:['FU_HEPATIC_CI','FU_HEPATIC_EQUALITY']) : ['RENAL_LT30','HEPATOTOXICITY'])) assert(p.rule_engine.rules.some(r=>r.rule_id===id && r.source.url===m.source_url && r.source.page), `${item.nccp_code}: missing replacement source-mapped rule ${id}`);
      assert.equal(releaseRules.length,0,'Superseded renal rules must not remain active');
    } else assert(releaseRules.length > 0, `${item.nccp_code}: structured resolution lacks v0.59.0 rules`);
  }
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
assert.strictEqual(triggerableRuleCount, 193, 'Five fluorouracil/oxaliplatin legacy rules are superseded by v32 boundary and source cases. Six nintedanib/docetaxel legacy rules are superseded by v30 source cases. Six legacy gemcitabine/topotecan rules are superseded by source-specific v29 cases. Five obsolete NCCP00791 fluorouracil organ rules are replaced by v33 source cases. Four fruquintinib legacy rules are replaced by v35 source and dose-history cases, with the exact removed IDs and original PDF/JSON hashes retained. Ten CAPTEM/PRRT legacy rules are superseded by the v37 source cases with exact original IDs and hashes; three everolimus legacy IDs remain with dose-history guards. All 193 retained v0.59.0 rules remain executable; two ceritinib rules are replaced by four source-conflict review rules verified by v0.84.25 cases; six capecitabine rules and 46 v0.83.6 batch rules are superseded by source-mapped suites with independent boundary tests; nine ALK organ-function rules are superseded by v0.84.24 source tests; two pemetrexed monotherapy rules are superseded by the v0.84.23 source audit; PLD bilirubin >86 is superseded by its v0.84.1 source-mapped rule.');

// Sentinel source pathways and single-value partial assessments.
let result = assess('00205', { pld_bilirubin_band: '51_86' });
assert.strictEqual(result.actionType, 'dose_reduce');
assert(result.findings.some(f => String(f.ruleId || '').includes('PLD_BILI_51_86')));

result = assess('00460', { cisplatin_crcl_band: '40_49' });
assert.strictEqual(result.actionType, 'dose_reduce');
result = assess('00460', { fluorouracil_bilirubin_umol_l: 90 });
assert.strictEqual(result.actionType, 'contraindicated');

result = assess('00284', { bilirubin_micromol_l: 27 });
assert.strictEqual(result.actionType, 'dose_reduce');

result = assess('00311', { topotecan_renal_band: '20_39' });
assert.strictEqual(result.actionType, 'dose_reduce');
result = assess('00311', { topotecan_bilirubin_band: 'gt171' });
assert.strictEqual(result.actionType, 'consultant_review'); // Source says not recommended; do not invent a formal contraindication.

result = assess('00587', { topotecan_oral_renal_band: '30_49', current_topotecan_dose_mg_m2: 2.3 });
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
assert.strictEqual(result.actionType, 'consultant_review'); // v2/SmPC evidence gap is not a formal contraindication
result = assess('00320', { child_pugh_class: 'B' });
assert.strictEqual(result.actionType, 'consultant_review'); // v37: establish baseline/prior dose before a numeric hepatic dose.

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
assert.strictEqual(audit.summary.total_v0590_rules, 193);

console.log('v0.59.0 library-wide organ-function reconciliation tests passed.');
