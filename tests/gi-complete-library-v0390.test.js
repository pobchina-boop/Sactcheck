const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const expectedCodes = [
  '00238','00831','00212','00214','00215','00623','00791','00449','00446','00783',
  '00216','00586','00523','00505','00321','00422','00207','00732','00330','00331',
  '00692','00733','00328','00585','00473','00594','00460','00235','00203','00386',
  '00897','00240','00380','00429','00239','00320','00344','00486','00227','00210',
  '00209','00509','00555','00329','00515','00691','00660','00451','00421','00890',
  '00284','00283','00522','00559','00521','00384','00524','00383','00213','00654',
  '00901','00644','00642','00727','00256','00844','00832','00816','00551','00900',
  '00483','00484','00843','00588','00621','00225','00448','00447','00889','00455',
  '00558','00739','00839','00428','00244','00427','00294','00924','00925','00502',
  '00704','00926','00382'
].sort();

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const current = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(current) : [current];
  });
}

function protocols() {
  return walk(path.join(root, 'protocols'))
    .filter(file => file.endsWith('.json'))
    .filter(file => !file.includes(`${path.sep}protocols${path.sep}protocols${path.sep}`))
    .filter(file => !['index.json', 'protocol-schema.json', 'package.json'].includes(path.basename(file)))
    .map(file => {
      try { return { file, data: JSON.parse(fs.readFileSync(file, 'utf8')) }; }
      catch { return null; }
    })
    .filter(Boolean)
    .filter(({ data }) => data?.metadata?.nccp_regimen_code && data.metadata.nccp_regimen_code !== '00000');
}

function tumourGroups(protocol) {
  const metadata = protocol.metadata || {};
  const values = [];
  if (typeof metadata.tumour_group === 'string') values.push(metadata.tumour_group);
  for (const value of metadata.tumour_groups || []) if (!values.includes(value)) values.push(value);
  return values;
}


function trueGradeField(field, definition) {
  if (definition?.ctcae_version) return true;
  const text = `${field} ${definition?.label || ''}`.toLowerCase();
  if (definition?.type !== 'select') return false;
  const exclusions = ['occurrence', 'duration', 'days', 'weeks', 'recurrent', 'prior grade', 'prior_grade', 'not recovered', 'persists', 'over one week', 'resolution', 'requiring interruption', 'unresolved', 'meeting protocol criteria', 'with fever', 'fever or infection', 'complicated diarrhoea'];
  if (exclusions.some(token => text.includes(token))) return false;
  return field.endsWith('_grade') || field.includes('current_grade') || field.includes('highest_grade');
}

function demoValue(definition) {
  if (definition.demo_value !== undefined && definition.demo_value !== null) return String(definition.demo_value);
  if (definition.type === 'select') return String(definition.options?.[0]?.value ?? '');
  if (definition.type === 'boolean') return 'false';
  if (definition.type === 'number') return String(Number.isFinite(Number(definition.min)) ? definition.min : 0);
  return 'test';
}

const all = protocols();
const gi = all.filter(({ data }) => tumourGroups(data).includes('Gastrointestinal'));
const codes = gi.map(({ data }) => String(data.metadata.nccp_regimen_code).padStart(5, '0')).sort();
assert.deepStrictEqual(codes, expectedCodes, 'The GI deck does not match the current official NCCP GI catalogue inventory.');
assert.strictEqual(gi.length, 93, 'Expected 93 distinct active gastrointestinal regimen protocols.');
assert.strictEqual(new Set(codes).size, 93, 'The GI deck contains duplicate NCCP codes.');
assert.strictEqual(new Set(gi.map(({ data }) => data.protocol_id)).size, 93, 'The GI deck contains duplicate protocol IDs.');

const index = JSON.parse(fs.readFileSync(path.join(root, 'protocols', 'index.json'), 'utf8'));
assert.strictEqual(index.protocol_count, 376, 'Complete protocol index must contain 210 distinct protocols.');
assert.strictEqual(index.protocols.length, 376, 'Complete protocol index array must contain 210 entries.');

const riskMap = JSON.parse(fs.readFileSync(path.join(root, 'data', 'emetogenic-risk-map.json'), 'utf8'));
assert.strictEqual(riskMap.release, '0.48.0');
assert.strictEqual(Object.keys(riskMap.protocols || {}).length, 376, 'Central supportive-care map must cover all 210 protocols.');

const ctcaeContext = { window: {} };
vm.createContext(ctcaeContext);
vm.runInContext(fs.readFileSync(path.join(root, 'js', 'ctcae-descriptors.js'), 'utf8'), ctcaeContext);
const CTCAE = ctcaeContext.window.SACTCheckCTCAE;
assert(CTCAE?.guide, 'CTCAE descriptor library failed to initialise.');

const Lab = require('../js/local-lab-profile.js');
let inputCount = 0;
let ruleCount = 0;
let ctcaeFields = 0;
let renalBands = 0;
let exactCarboplatin = 0;
for (const { file, data } of gi) {
  const code = String(data.metadata.nccp_regimen_code).padStart(5, '0');
  const metadata = data.metadata || {};
  assert(!/placeholder|draft/i.test(String(data.status || '')), `${code} remains a placeholder or draft.`);
  assert.strictEqual(data.status, 'encoded_prototype_pending_clinical_and_pharmacy_validation', `${code} lacks active encoded-prototype status.`);
  assert(['0.39.0','0.40.0','0.41.0','0.43.0','0.44.0','0.45.0', '0.45.1','0.46.0','0.47.0'].includes(metadata.sactcheck_encoding_version), `${code} lacks a supported GI/Lung encoding marker.`);
  assert.strictEqual(metadata.partial_assessment_supported, true, `${code} does not declare single-entry support.`);
  assert(/^https:\/\/healthservice\.hse\.ie\/documents\//.test(metadata.source_url || ''), `${code} does not link directly to an official HSE/NCCP source PDF.`);
  assert(metadata.gi_subgroup, `${code} lacks a GI subgroup.`);
  assert(Array.isArray(metadata.treatment_class) && metadata.treatment_class.length, `${code} lacks treatment-class metadata.`);
  assert(metadata.catalogue_section, `${code} lacks catalogue-section metadata.`);
  assert(Array.isArray(data.required_inputs) && data.required_inputs.length === 0, `${code} still has blocking top-level required inputs.`);
  assert(data.treatment || data.treatment_phases, `${code} lacks an encoded treatment schedule.`);
  const definitions = data.input_definitions || {};
  const rules = data.rule_engine?.rules || [];
  assert(Object.keys(definitions).length > 0, `${code} has no active assessment inputs.`);
  assert(rules.length > 0, `${code} has no active decision rules.`);
  inputCount += Object.keys(definitions).length;
  ruleCount += rules.length;
  const supportive = data.supportive_care || {};
  assert(supportive.emetogenic_risk, `${code} lacks emetogenic-risk classification.`);
  assert(supportive.mapping_source_url, `${code} lacks the NCCP antiemetic source link.`);
  assert(supportive.validation_status, `${code} lacks supportive-care validation status.`);
  assert(riskMap.protocols[code], `${code} is missing from the central supportive-care map.`);
  if (!['phase_dependent', 'variable'].includes(supportive.emetogenic_risk)) {
    assert(supportive.script_id, `${code} lacks a supportive-care script.`);
    const script = riskMap.scripts[supportive.script_id];
    assert(script, `${code} references an unknown supportive-care script ${supportive.script_id}.`);
    assert.strictEqual(supportive.supportive_medications_pdf_url, script.url, `${code} supportive-care URL is not central-registry controlled.`);
  }

  for (const [field, definition] of Object.entries(definitions)) {
    assert.notStrictEqual(definition.required, true, `${code}/${field} is still a blocking required field.`);
    const text = `${field} ${definition.label || ''}`.toLowerCase();
    if (trueGradeField(field, definition)) {
      ctcaeFields += 1;
      assert.strictEqual(definition.type, 'select', `${code}/${field} CTCAE input must be a selector.`);
      assert.strictEqual(definition.ctcae_version, '5.0', `${code}/${field} lacks CTCAE v5.0 metadata.`);
      assert(definition.assessment_guidance, `${code}/${field} lacks practical assessment guidance.`);
      const grades = new Set((definition.options || []).map(item => Number(item.value)));
      [0, 1, 2, 3, 4].forEach(grade => assert(grades.has(grade), `${code}/${field} lacks Grade ${grade}.`));
      const guide = CTCAE.guide({ ...definition, id: field });
      assert(guide?.grades?.length >= 5, `${code}/${field} has no beside-control grade guide.`);
      guide.grades.slice(0, 5).forEach(item => assert(item.description, `${code}/${field}/Grade ${item.grade} lacks an explanation.`));
    }
    if (/crcl|creatinine clearance|\begfr\b|renal function/.test(text)) {
      if (definition.type === 'select') {
        renalBands += 1;
        assert.strictEqual(definition.renal_input?.mode, 'protocol_specific_band', `${code}/${field} lacks tiered renal-input metadata.`);
        assert.strictEqual(definition.renal_input?.exact_value_required, false, `${code}/${field} incorrectly requires an exact value.`);
        assert((definition.options || []).length >= 2, `${code}/${field} has no tiered renal choices.`);
      } else if (/carboplatin|calvert/i.test(`${metadata.title} ${text}`)) {
        exactCarboplatin += 1;
        assert.strictEqual(definition.renal_input?.mode, 'exact_continuous', `${code}/${field} exact CrCl exception is not declared.`);
      }
    }
    if (/^(bilirubin_ratio_uln|bilirubin_uln_multiple|bilirubin_uln|alt_uln_multiple|ast_uln_multiple|ast_uln|alt_ast_uln_multiple|alt_ast_ratio_uln|ast_alt_uln|transaminases_uln_multiple|alt_ratio_uln)$/.test(field)) {
      assert(Lab.adapterFor(field), `${code}/${field} lacks automatic actual-result ULN conversion.`);
    }
  }
}
assert(inputCount >= 1600, `Expected broad GI input coverage; found ${inputCount}.`);
assert(ruleCount >= 1700, `Expected broad GI rule coverage; found ${ruleCount}.`);
assert(ctcaeFields >= 390, `Expected broad GI CTCAE coverage; found ${ctcaeFields}.`);
assert(renalBands >= 25, `Expected broad GI renal-band coverage; found ${renalBands}.`);
assert(exactCarboplatin >= 1, 'Expected at least one carboplatin exact-CrCl exception.');

// Single-entry regression across every visible rule-linked GI field.
const engineContext = { console };
engineContext.globalThis = engineContext;
vm.createContext(engineContext);
vm.runInContext(fs.readFileSync(path.join(root, 'js', 'rule-engine.js'), 'utf8'), engineContext);
vm.runInContext(fs.readFileSync(path.join(root, 'js', 'assessment-engine.js'), 'utf8'), engineContext);
const Engine = engineContext.SACTCheckAssessmentEngine;
const RuleEngine = engineContext.SACTCheckRuleEngine;
let auditedFields = 0;
for (const { data } of gi) {
  const code = String(data.metadata.nccp_regimen_code).padStart(5, '0');
  const profileId = Engine.getProfiles(data)[0]?.id || 'default';
  const definitions = Engine.getInputDefinitions(data, profileId, {});
  const ruleFields = new Set((data.rule_engine?.rules || []).flatMap(rule =>
    RuleEngine.collectConditionFields(RuleEngine.conditionFromRule(rule))
  ));
  const candidates = definitions.filter(definition => definition.visible !== false && ruleFields.has(definition.id) && demoValue(definition) !== '');
  assert(candidates.length > 0, `${code} has no independently testable clinical field.`);
  for (const definition of candidates) {
    const result = Engine.assess(data, { [definition.id]: demoValue(definition) }, { profileId });
    assert(result.findings.length > 0, `${code}/${definition.id} produced no partial finding.`);
    assert(!/insufficient data/i.test(String(result.status || '')), `${code}/${definition.id} returned the obsolete insufficient-data state.`);
    auditedFields += 1;
  }
}
assert(auditedFields >= 1000, `Expected at least 1,000 independently assessed GI inputs; found ${auditedFields}.`);

// Alias precision and discoverability.
const aliasContext = { globalThis: null };
aliasContext.globalThis = aliasContext;
vm.createContext(aliasContext);
vm.runInContext(fs.readFileSync(path.join(root, 'js', 'drug-aliases.js'), 'utf8'), aliasContext);
const Aliases = aliasContext.SACTCheckDrugAliases;
assert.strictEqual(Aliases.version, '0.48.0');
const byCode = code => gi.find(({ data }) => String(data.metadata.nccp_regimen_code).padStart(5, '0') === code).data;
const aliases = {
  '00207': 'Erbitux', '00238': 'Zaltrap', '00235': 'Teysuno', '00642': 'Lutathera',
  '00382': 'Lonsurf', '00644': 'Lenvima', '00901': 'Tibsovo', '00889': 'Pemazyre',
  '00924': 'Tevimbra', '00551': 'Yervoy', '00294': 'Nexavar', '00505': 'Temodal'
};
for (const [code, alias] of Object.entries(aliases)) {
  assert(Aliases.forProtocol(byCode(code)).includes(alias), `${code} is not searchable by ${alias}.`);
}

// Permanent tumour-site leakage regression.
const breast00688 = all.find(({ data }) => String(data.metadata.nccp_regimen_code).padStart(5, '0') === '00688').data;
assert(!tumourGroups(breast00688).includes('Gastrointestinal'), 'Breast NCCP 00688 leaked into the GI deck.');
for (const code of ['00924', '00925', '00926']) assert(byCode(code), `${code} current GI regimen is missing.`);

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert(html.includes('v0.52.5 · What changed?'), 'v0.39.0 release badge is missing.');
assert(html.includes('js/protocol-loader.js?v=0.51.0'), 'v0.39.0 cache key is missing.');
assert(html.includes('js/drug-aliases.js?v=0.48.4'), 'v0.39.0 alias cache key is missing.');

console.log(`v0.39.0 GI library tests passed: 93 active protocols, ${inputCount} inputs, ${ruleCount} rules and ${auditedFields} independently assessed rule-linked fields.`);
