const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const protocolRoot = path.join(root, 'protocols');
const validSections = new Set([
  'chemotherapy_combination_sact',
  'targeted_her2_therapy',
  'immunotherapy',
  'endocrine_hormonal_therapy',
  'bone_modifying_therapy',
  'supportive_other'
]);
const validRiskLevels = new Set([
  'high', 'moderate', 'low', 'minimal', 'oral_moderate_high',
  'oral_minimal_low', 'phase_dependent', 'variable'
]);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const current = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(current) : [current];
  });
}

function loadProtocols() {
  return walk(protocolRoot)
    .filter(file => file.endsWith('.json'))
    .map(file => {
      try { return { file, data: JSON.parse(fs.readFileSync(file, 'utf8')) }; }
      catch { return null; }
    })
    .filter(Boolean)
    .filter(({ file, data }) => {
      const code = String(data?.metadata?.nccp_regimen_code || '');
      return code && code !== '00000' && !file.includes(`${path.sep}_template${path.sep}`) && !['index.json', 'package.json', 'protocol-schema.json'].includes(path.basename(file));
    });
}

function collectComparisons(node, field, output = []) {
  if (Array.isArray(node)) node.forEach(item => collectComparisons(item, field, output));
  else if (node && typeof node === 'object') {
    if (node.field === field && ['<', '<=', '>', '>=', '==', 'lt', 'lte', 'gt', 'gte', 'eq'].includes(node.operator)) output.push(node.value);
    Object.values(node).forEach(value => collectComparisons(value, field, output));
  }
  return output;
}

function trueGradeField(id, def) {
  const text = `${id} ${def?.label || ''}`.toLowerCase();
  if (!text.includes('grade') && !text.includes('ctcae')) return false;
  const exclusions = ['occurrence', 'duration', ' days', 'weeks', 'recurrent', 'prior grade', 'prior_grade', 'not recovered', 'persists', 'over one week', 'resolution', 'requiring interruption', 'unresolved', 'meeting protocol criteria', 'with fever', 'fever or infection', 'complicated diarrhoea', 'grade4_', 'grade3_', 'grade2_', 'grade1_'];
  if (exclusions.some(token => text.includes(token))) return false;
  return id.endsWith('_grade') || id.includes('current_grade') || id.includes('highest_grade') || def?.ctcae_version;
}

const protocols = loadProtocols();
assert.equal(protocols.length, 145, `Expected 145 regimen protocols, found ${protocols.length}`);
const riskMap = JSON.parse(fs.readFileSync(path.join(root, 'data', 'emetogenic-risk-map.json'), 'utf8'));

const ids = new Map();
const codes = new Map();
const normalisedTitles = new Map();
let ctcaeFields = 0;
let renalBandFields = 0;
let exactCarboplatinFields = 0;
let variableRisk = 0;
const endocrineCodes = new Set();

const ctcaeContext = { window: {} };
vm.createContext(ctcaeContext);
vm.runInContext(fs.readFileSync(path.join(root, 'js', 'ctcae-descriptors.js'), 'utf8'), ctcaeContext);
const ctcae = ctcaeContext.window.SACTCheckCTCAE;
assert(ctcae?.guide, 'CTCAE guide API must be available.');

for (const { file, data } of protocols) {
  const metadata = data.metadata || {};
  const id = data.protocol_id;
  const code = String(metadata.nccp_regimen_code);
  const normalisedTitle = String(metadata.title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  assert(id, `${file} has no protocol_id`);
  assert(!ids.has(id), `Duplicate protocol_id ${id}: ${file} and ${ids.get(id)}`);
  assert(!codes.has(code), `Duplicate NCCP code ${code}: ${file} and ${codes.get(code)}`);
  assert(!normalisedTitles.has(normalisedTitle), `Duplicate normalised title ${metadata.title}: ${file} and ${normalisedTitles.get(normalisedTitle)}`);
  ids.set(id, file); codes.set(code, file);
  normalisedTitles.set(normalisedTitle, file);

  assert(validSections.has(metadata.catalogue_section), `${code} has invalid catalogue section ${metadata.catalogue_section}`);
  assert(Array.isArray(metadata.treatment_class) && metadata.treatment_class.length, `${code} lacks treatment_class metadata`);
  assert(['0.37.0', '0.38.0'].includes(metadata.sactcheck_encoding_version), `${code} has unsupported SACTCheck encoding version ${metadata.sactcheck_encoding_version}`);
  if (metadata.catalogue_section === 'supportive_other') {
    assert.equal(code, '00257', `${code} remains incorrectly unclassified as supportive/other`);
    assert(metadata.treatment_class.includes('radiopharmaceutical'), 'Radium-223 must be classified as a specialist radiopharmaceutical.');
  }
  assert(!/placeholder|draft/i.test(String(data.status || '')), `${code} remains a regimen placeholder/draft`);

  if (metadata.catalogue_section === 'endocrine_hormonal_therapy') {
    endocrineCodes.add(code);
    assert.equal(metadata.cytotoxic, false, `${code} endocrine therapy must not be marked cytotoxic`);
    assert(metadata.treatment_class.includes('endocrine_therapy'), `${code} endocrine therapy lacks endocrine class`);
  }

  const supportive = data.supportive_care || {};
  assert(validRiskLevels.has(supportive.emetogenic_risk), `${code} has unsupported emetogenic risk ${supportive.emetogenic_risk}`);
  assert(supportive.mapping_source_url, `${code} lacks antiemetic source link`);
  assert(supportive.mapping_basis, `${code} lacks antiemetic mapping basis`);
  assert(supportive.validation_status, `${code} lacks supportive-care validation status`);
  if (supportive.emetogenic_risk === 'variable') variableRisk += 1;
  else if (supportive.emetogenic_risk === 'phase_dependent') {
    assert(Object.keys(supportive.phase_profiles || {}).length >= 2, `${code} phase-dependent risk lacks phase profiles`);
    assert(!supportive.supportive_medications_pdf_url, `${code} phase-dependent regimen has a misleading static supportive-care link`);
  } else {
    assert(supportive.script_id, `${code} lacks supportive-care script mapping`);
    const script = riskMap.scripts?.[supportive.script_id];
    assert(script, `${code} references missing supportive-care script ${supportive.script_id}`);
    assert.equal(supportive.supportive_medications_pdf_url, script.url, `${code} retains a stale supportive-care URL`);
    assert.equal(supportive.supportive_medications_label, script.label, `${code} retains a stale supportive-care label`);
  }

  const definitions = data.input_definitions || {};
  const rules = data.rule_engine?.rules || [];
  for (const [field, def] of Object.entries(definitions)) {
    if (trueGradeField(field, def)) {
      ctcaeFields += 1;
      assert.equal(def.type, 'select', `${code}/${field} must be a CTCAE select, not ${def.type}`);
      assert.equal(def.ctcae_version, '5.0', `${code}/${field} lacks CTCAE v5.0 declaration`);
      assert(def.ctcae_category, `${code}/${field} lacks a toxicity-specific CTCAE category`);
      assert(def.assessment_guidance, `${code}/${field} lacks practical assessment guidance`);
      const grades = new Set((def.options || []).map(option => Number(option.value)));
      [0, 1, 2, 3, 4].forEach(grade => assert(grades.has(grade), `${code}/${field} lacks Grade ${grade}`));
      const guide = ctcae.guide({ ...def, id: field });
      assert(guide && guide.grades.length >= 5, `${code}/${field} has no rendered CTCAE grade guide`);
      guide.grades.forEach(item => assert(item.description, `${code}/${field} Grade ${item.grade} has no explanation`));
      const fieldText = `${field} ${def.label || ''}`.toLowerCase();
      if (/non[-_ ]?ha?em|non[-_ ]?hemat|non[-_ ]?haemat/.test(fieldText)) {
        assert.equal(def.ctcae_category, 'other_nonhaematological', `${code}/${field} is incorrectly classified as haematological`);
      }
      if (fieldText.includes('colitis') && !fieldText.includes('mucositis')) {
        assert.equal(def.ctcae_category, 'diarrhoea_or_colitis', `${code}/${field} must show both diarrhoea and colitis criteria`);
      }
      if (fieldText.includes('acneiform')) {
        assert.equal(def.ctcae_category, 'rash_acneiform', `${code}/${field} lacks acneiform-rash criteria`);
      }
      if (field.includes('allergic_reaction')) {
        assert.equal(def.ctcae_category, 'allergic_reaction', `${code}/${field} lacks allergic-reaction criteria`);
      }
      if (fieldText.includes('anaphyl')) {
        assert.equal(def.ctcae_category, 'hypersensitivity_anaphylaxis', `${code}/${field} lacks hypersensitivity/anaphylaxis criteria`);
      }
    }

    const renalText = `${field} ${def?.label || ''}`.toLowerCase();
    if (!/crcl|creatinine clearance|\bgfr\b|egfr/.test(renalText)) continue;
    const comparisons = collectComparisons(rules, field).filter(value => Number.isFinite(Number(value)));
    if (!comparisons.length) continue;
    const mode = def.renal_input?.mode;
    if (mode === 'exact_continuous') {
      exactCarboplatinFields += 1;
      assert(/carboplatin/i.test(metadata.title || ''), `${code}/${field} exact renal exception is not carboplatin-related`);
      assert.equal(def.type, 'number', `${code}/${field} exact carboplatin field must remain numerical`);
    } else {
      renalBandFields += 1;
      assert.equal(mode, 'protocol_specific_band', `${code}/${field} tiered renal rule must declare protocol-specific bands`);
      assert.equal(def.type, 'select', `${code}/${field} tiered renal rule must use a selector`);
      assert((def.options || []).length >= 2, `${code}/${field} lacks renal band options`);
      for (const option of def.options || []) {
        assert(option.label, `${code}/${field} has an unlabelled renal band`);
        assert(Object.prototype.hasOwnProperty.call(option, 'decision_value'), `${code}/${field}/${option.value} lacks decision_value`);
      }
    }
  }
}

const expectedEndocrineCodes = [
  '00103', '00233', '00253', '00254', '00361', '00371', '00376',
  '00477', '00478', '00479', '00480', '00481', '00482', '00488',
  '00489', '00490', '00491', '00492', '00493', '00494', '00574',
  '00577', '00693', '00830'
].sort();
assert.deepEqual([...endocrineCodes].sort(), expectedEndocrineCodes, 'Pure endocrine medicines are not cleanly separated.');
assert(ctcaeFields >= 400, `Expected at least 400 CTCAE-enabled fields; found ${ctcaeFields}`);
assert(renalBandFields >= 25, `Expected broad protocol-specific renal band migration; found ${renalBandFields}`);
assert(exactCarboplatinFields >= 20, `Expected carboplatin continuous-value exceptions; found ${exactCarboplatinFields}`);
assert.equal(variableRisk, 1, 'Only the regimen with an unspecified chemotherapy companion should remain variable.');

assert.equal(Object.keys(riskMap.protocols || {}).length, 145, 'Central supportive-care map must cover every regimen.');
for (const code of codes.keys()) assert(riskMap.protocols[code], `Central supportive-care map is missing ${code}`);

// Confirm band selections are converted to the rule-engine decision value while
// documentation retains the clinician-facing tier label.
const RuleEngine = require(path.join(root, 'js', 'rule-engine.js'));
globalThis.SACTCheckRuleEngine = RuleEngine;
const AssessmentEngine = require(path.join(root, 'js', 'assessment-engine.js'));
const synthetic = {
  protocol_id: 'v0370-renal-band-test',
  status: 'clinical_encoding_complete_pending_validation',
  metadata: { title: 'Renal band test', nccp_regimen_code: 'TEST', nccp_version: '1' },
  required_inputs: ['crcl_ml_min', 'dialysis'],
  input_definitions: {
    crcl_ml_min: {
      type: 'select', label: 'Creatinine clearance category',
      options: [
        { value: 'renal_30_49', label: '30–49 mL/min', decision_value: 40 },
        { value: 'renal_0_29', label: '<30 mL/min', decision_value: 20 },
        { value: 'dialysis', label: 'Dialysis', decision_value: 0, sets_fields: { dialysis: true } }
      ]
    },
    dialysis: { type: 'boolean', label: 'Dialysis', visible: false }
  },
  rule_engine: { rules: [
    { rule_id: 'LOW_RENAL', when: { field: 'crcl_ml_min', operator: '<', value: 30 }, action: { type: 'withhold' }, explanation: 'Withhold for low renal function.', source: { page: 1 } },
    { rule_id: 'DIALYSIS', when: { field: 'dialysis', operator: '==', value: true }, action: { type: 'consultant_review' }, explanation: 'Dialysis review.', source: { page: 1 } }
  ] }
};
const bandResult = AssessmentEngine.assess(synthetic, { crcl_ml_min: 'renal_0_29' });
assert.equal(bandResult.inputs.crcl_ml_min, 20, 'Renal band decision_value was not passed to the rule engine.');
assert.equal(bandResult.displayInputs.crcl_ml_min, '<30 mL/min', 'Documentation did not preserve the selected renal band label.');
assert.equal(bandResult.actionType, 'withhold', 'Renal band did not trigger the expected threshold rule.');
const dialysisResult = AssessmentEngine.assess(synthetic, { crcl_ml_min: 'dialysis' });
assert.equal(dialysisResult.inputs.dialysis, true, 'Dialysis selector did not set the linked dialysis pathway.');

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const loader = fs.readFileSync(path.join(root, 'js', 'protocol-loader.js'), 'utf8');
assert(html.includes('id="treatmentFilter"'), 'Catalogue lacks treatment-category filtering.');
assert(html.includes('Endocrine (hormonal) therapies'), 'Catalogue lacks a distinct endocrine section.');
assert(html.includes('catalogue-section-heading'), 'Catalogue lacks visual treatment-class grouping.');
assert(html.includes('ctcae-guide'), 'Assessment UI lacks beside-control CTCAE grading guidance.');
assert(html.includes('Version 0.38.0 · Complete prostate library'), 'Release badge is stale.');
assert(html.includes('js/protocol-loader.js?v=0.38.0'), 'Protocol loader cache key is stale.');
assert(!loader.includes('\u0008'), 'Protocol loader contains a stray control character in treatment-class formatting.');

console.log(`v0.37.0 platform standardisation tests passed: ${protocols.length} regimens, ${ctcaeFields} CTCAE fields, ${renalBandFields} renal-band fields, ${exactCarboplatinFields} carboplatin exact-value fields.`);
