const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const expectedCodes = [
  '00101', '00103', '00203', '00233', '00257', '00313', '00477', '00478',
  '00479', '00480', '00481', '00482', '00488', '00489', '00490', '00491',
  '00492', '00493', '00494', '00546', '00574', '00577', '00588', '00693',
  '00830', '00848'
].sort();

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const current = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(current) : [current];
  });
}

function readProtocols() {
  return walk(path.join(root, 'protocols'))
    .filter(file => file.endsWith('.json'))
    .filter(file => !['index.json', 'protocol-schema.json', 'package.json'].includes(path.basename(file)))
    .map(file => {
      try { return { file, data: JSON.parse(fs.readFileSync(file, 'utf8')) }; }
      catch { return null; }
    })
    .filter(Boolean)
    .filter(({ data }) => data?.metadata?.nccp_regimen_code && data.metadata.nccp_regimen_code !== '00000');
}

function includesProstate(protocol) {
  const metadata = protocol.metadata || {};
  const groups = [metadata.tumour_group, ...(metadata.tumour_groups || [])].filter(Boolean);
  const metadataIcd = Array.isArray(metadata.icd10) ? metadata.icd10 : [metadata.icd10];
  const indicationIcd = (protocol.indications || []).flatMap(item => item.icd10 || []);
  return groups.includes('Genitourinary') && [...metadataIcd, ...indicationIcd].includes('C61');
}

function definitionEntries(protocol) {
  const raw = protocol.input_definitions || protocol.assessment?.inputs || {};
  return Array.isArray(raw) ? raw.map(item => [item.id, item]) : Object.entries(raw);
}

function demoValue(definition) {
  if (definition.demo_value !== undefined && definition.demo_value !== null) return String(definition.demo_value);
  if (definition.type === 'select') return String(definition.options?.[0]?.value ?? '');
  if (definition.type === 'boolean') return 'false';
  if (definition.type === 'number') return String(definition.min !== undefined && Number(definition.min) > 0 ? definition.min : 0);
  return 'test';
}

const allProtocols = readProtocols();
const prostate = allProtocols.filter(({ data }) => includesProstate(data));
const codes = prostate.map(({ data }) => String(data.metadata.nccp_regimen_code)).sort();
assert.deepStrictEqual(codes, expectedCodes, 'The encoded prostate deck does not match the current NCCP prostate regimen list.');
assert.strictEqual(prostate.length, 26, 'Expected 26 distinct fully encoded prostate regimen protocols.');

const index = JSON.parse(fs.readFileSync(path.join(root, 'protocols', 'index.json'), 'utf8'));
assert.strictEqual(index.protocol_count, 145, 'The protocol index must contain 145 distinct regimen protocols.');
assert.strictEqual(index.protocols.length, 145, 'The protocol index array must contain 145 entries.');
assert.strictEqual(new Set(index.protocols.map(item => item.id)).size, 145, 'Protocol index contains duplicate IDs.');

const riskMap = JSON.parse(fs.readFileSync(path.join(root, 'data', 'emetogenic-risk-map.json'), 'utf8'));
assert.strictEqual(riskMap.release, '0.38.0');
assert.strictEqual(Object.keys(riskMap.protocols || {}).length, 145, 'Central supportive-care map must cover the entire indexed library.');

for (const { file, data } of prostate) {
  const code = String(data.metadata.nccp_regimen_code);
  assert(!/placeholder|draft/i.test(String(data.status || '')), `${code} remains a placeholder or draft.`);
  assert.strictEqual(data.status, 'encoded_prototype_pending_clinical_and_pharmacy_validation', `${code} lacks the fully encoded prototype status.`);
  assert(data.metadata.partial_assessment_supported === true, `${code} does not declare single-entry partial assessment support.`);
  assert(/^https:\/\/healthservice\.hse\.ie\/documents\//.test(data.metadata.source_url || ''), `${code} does not link directly to an official HSE/NCCP PDF.`);
  assert(Number(data.metadata.source_document_pages) > 0, `${code} lacks source-document page metadata.`);
  assert(Array.isArray(data.metadata.treatment_class) && data.metadata.treatment_class.length, `${code} lacks treatment-class metadata.`);
  assert(data.metadata.catalogue_section, `${code} lacks a catalogue section.`);
  assert(data.treatment && Object.keys(data.treatment).length, `${code} lacks an encoded treatment schedule.`);
  assert(Array.isArray(data.rule_engine?.rules) && data.rule_engine.rules.length, `${code} lacks encoded decision rules.`);
  assert(data.supportive_care?.script_id, `${code} lacks a supportive-care/antiemetic script mapping.`);
  assert(riskMap.protocols[code], `${code} is missing from the central supportive-care map.`);
  assert.strictEqual(riskMap.protocols[code].script_id, data.supportive_care.script_id, `${code} supportive-care mapping is inconsistent.`);
  assert(!Array.isArray(data.required_inputs) || data.required_inputs.length === 0, `${code} still has blocking mandatory inputs.`);
  for (const [field, definition] of definitionEntries(data)) {
    assert.notStrictEqual(definition.required, true, `${code}/${field} is still marked as a blocking required input.`);
    if (definition.ctcae_version || /(?:^|_)grade(?:$|_)/i.test(field)) {
      assert.strictEqual(definition.type, 'select', `${code}/${field} CTCAE input must be a selector.`);
      assert.strictEqual(definition.ctcae_version, '5.0', `${code}/${field} lacks CTCAE v5.0 metadata.`);
      assert(definition.assessment_guidance, `${code}/${field} lacks practical grading guidance.`);
      const options = definition.options || [];
      assert(options.length >= 5, `${code}/${field} does not display Grade 0–4 choices.`);
      options.forEach(option => assert(option.description, `${code}/${field}/${option.value} lacks a grade explanation.`));
    }
    if (field === 'renal_band') {
      assert.strictEqual(definition.type, 'select', `${code}/${field} must use protocol-specific renal bands rather than exact entry.`);
      assert.strictEqual(definition.renal_input?.mode, 'protocol_specific_band', `${code}/${field} lacks renal-band metadata.`);
      assert.strictEqual(definition.renal_input?.exact_value_required, false, `${code}/${field} incorrectly requests an exact value.`);
      assert((definition.options || []).length >= 2, `${code}/${field} lacks tiered renal options.`);
    }
  }
}

// Current NCCP prostate indications already encoded in shared protocols must remain visible.
const docetaxel = prostate.find(({ data }) => data.metadata.nccp_regimen_code === '00203').data;
assert((docetaxel.metadata.tumour_groups || []).includes('Genitourinary'), 'NCCP 00203 no longer exposes the prostate tumour group.');
assert.deepStrictEqual(
  docetaxel.indications.filter(item => (item.icd10 || []).includes('C61')).flatMap(item => item.reimbursement_codes).sort(),
  ['00203b', '00203c'],
  'NCCP 00203 prostate indications are incomplete.'
);
const olaparib = prostate.find(({ data }) => data.metadata.nccp_regimen_code === '00588').data;
assert(olaparib.indications.some(item => (item.reimbursement_codes || []).includes('00588g')), 'NCCP 00588g mCRPC indication is missing.');

// Single-entry capability: every visible rule-linked field must return a meaningful partial result by itself.
const engineContext = { console };
engineContext.globalThis = engineContext;
vm.createContext(engineContext);
vm.runInContext(fs.readFileSync(path.join(root, 'js', 'rule-engine.js'), 'utf8'), engineContext);
vm.runInContext(fs.readFileSync(path.join(root, 'js', 'assessment-engine.js'), 'utf8'), engineContext);
const Engine = engineContext.SACTCheckAssessmentEngine;
const RuleEngine = engineContext.SACTCheckRuleEngine;
let auditedFields = 0;
for (const { data } of prostate) {
  const code = String(data.metadata.nccp_regimen_code);
  const profileId = Engine.getProfiles(data)[0]?.id || 'default';
  const definitions = Engine.getInputDefinitions(data, profileId, {});
  const ruleFields = new Set((data.rule_engine?.rules || []).flatMap(rule =>
    RuleEngine.collectConditionFields(RuleEngine.conditionFromRule(rule))
  ));
  const candidates = definitions.filter(definition => definition.visible !== false && ruleFields.has(definition.id) && demoValue(definition) !== '');
  assert(candidates.length, `${code} has no independently testable clinical input.`);
  for (const definition of candidates) {
    const result = Engine.assess(data, { [definition.id]: demoValue(definition) }, { profileId });
    assert(result.findings.length > 0, `${code}/${definition.id} produced no partial finding.`);
    assert(!/insufficient data/i.test(result.status), `${code}/${definition.id} returned the obsolete insufficient-data state.`);
    auditedFields += 1;
  }
}
assert(auditedFields >= 150, `Expected broad prostate single-entry coverage; only ${auditedFields} fields were audited.`);

// Search aliases: official generic title remains primary, but common names are discoverable.
const aliasContext = { globalThis: null };
aliasContext.globalThis = aliasContext;
vm.createContext(aliasContext);
vm.runInContext(fs.readFileSync(path.join(root, 'js', 'drug-aliases.js'), 'utf8'), aliasContext);
const Aliases = aliasContext.SACTCheckDrugAliases;
const byCode = code => prostate.find(({ data }) => data.metadata.nccp_regimen_code === code).data;
const aliasExpectations = {
  '00101': 'Jevtana', '00103': 'Zytiga', '00233': 'Xtandi', '00257': 'Xofigo',
  '00477': 'Zoladex', '00481': 'Firmagon', '00482': 'Casodex', '00574': 'Erleada',
  '00693': 'Nubeqa', '00830': 'Orgovyx', '00848': 'Akeega', '00588': 'Lynparza'
};
for (const [code, alias] of Object.entries(aliasExpectations)) {
  assert(Aliases.forProtocol(byCode(code)).includes(alias), `${code} is not searchable by ${alias}.`);
}
const akeegaAliases = Aliases.forProtocol(byCode('00848'));
assert(akeegaAliases.includes('Akeega'), 'Akeega alias is missing.');
assert(!akeegaAliases.includes('Zejula'), 'Akeega must not be mislabeled as single-agent Zejula.');
assert(!akeegaAliases.includes('Zytiga'), 'Akeega must not be mislabeled as single-agent Zytiga.');

const relugolix = byCode('00830');
const inducerRule = relugolix.rule_engine.rules.find(rule => rule.id === 'INDUCER');
assert.strictEqual(inducerRule.action.type, 'consultant_review', 'Relugolix dose escalation must not be mislabeled as a dose reduction.');
assert(/240 mg/.test(inducerRule.explanation), 'Relugolix combined-inducer pathway lacks the encoded 240 mg instruction.');

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert(html.includes('Version 0.38.1 · GU display and alias hotfix'), 'v0.38.0 release badge is missing.');
assert(html.includes('js/drug-aliases.js?v=0.38.1'), 'v0.38.0 alias cache key is missing.');
assert.strictEqual(Aliases.version, '0.38.1');

console.log(`v0.38.0 prostate library tests passed: 26 fully encoded NCCP prostate protocols and ${auditedFields} independently assessed rule inputs.`);
