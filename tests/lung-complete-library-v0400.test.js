const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const expectedCodes = [
  '00221',
  '00401',
  '00544',
  '00593',
  '00592',
  '00214',
  '00689',
  '00215',
  '00562',
  '00271',
  '00561',
  '00319',
  '00304',
  '00614',
  '00340',
  '00456',
  '00280',
  '00279',
  '00243',
  '00565',
  '00576',
  '00655',
  '00203',
  '00702',
  '00219',
  '00220',
  '00310',
  '00281',
  '00284',
  '00570',
  '00232',
  '00372',
  '00849',
  '00483',
  '00484',
  '00792',
  '00712',
  '00713',
  '00714',
  '00388',
  '00259',
  '00353',
  '00226',
  '00621',
  '00455',
  '00558',
  '00568',
  '00569',
  '00579',
  '00318',
  '00317',
  '00222',
  '00908',
  '00823',
  '00311',
  '00587',
  '00339',
  '00343',
  '00309'
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
    .filter(file => !['index.json','protocol-schema.json','package.json'].includes(path.basename(file)))
    .map(file => { try { return { file, data: JSON.parse(fs.readFileSync(file, 'utf8')) }; } catch { return null; } })
    .filter(Boolean)
    .filter(({ data }) => data?.protocol_id && data?.metadata?.nccp_regimen_code && data.metadata.nccp_regimen_code !== '00000');
}
function tumourGroups(protocol) {
  const m = protocol.metadata || {}; const values=[];
  if (typeof m.tumour_group === 'string') values.push(m.tumour_group);
  for (const value of m.tumour_groups || []) if (!values.includes(value)) values.push(value);
  return values;
}
function trueGradeField(field, definition) {
  if (definition?.ctcae_version) return true;
  const text = `${field} ${definition?.label || ''}`.toLowerCase();
  if (definition?.type !== 'select') return false;
  const exclusions = ['occurrence','duration','days','weeks','recurrent','prior grade','prior_grade','not recovered','persists','resolution','requiring interruption','unresolved','with fever','fever or infection'];
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
const lung = all.filter(({ data }) => tumourGroups(data).includes('Lung'));
const codes = lung.map(({ data }) => String(data.metadata.nccp_regimen_code).padStart(5,'0')).sort();
assert.deepStrictEqual(codes, expectedCodes, 'The Lung deck does not match the official NCCP Lung catalogue inventory.');
assert.strictEqual(lung.length, 59, 'Expected 59 distinct active Lung protocols.');
assert.strictEqual(new Set(codes).size, 59, 'The Lung deck contains duplicate NCCP codes.');
assert.strictEqual(new Set(lung.map(({ data }) => data.protocol_id)).size, 59, 'The Lung deck contains duplicate protocol IDs.');

const index = JSON.parse(fs.readFileSync(path.join(root,'protocols','index.json'),'utf8'));
assert.strictEqual(index.protocol_count, 376, 'Complete protocol index must contain 270 protocols.');
assert.strictEqual(index.protocols.length, 376, 'Complete protocol index array must contain 270 entries.');
assert.strictEqual(new Set(index.protocols.map(item => item.id)).size, 376, 'Protocol index contains duplicate IDs.');

const riskMap = JSON.parse(fs.readFileSync(path.join(root,'data','emetogenic-risk-map.json'),'utf8'));
assert.strictEqual(riskMap.release, '0.48.0');
assert.strictEqual(Object.keys(riskMap.protocols || {}).length, 376, 'Supportive-care map must cover all protocols.');

const ctcaeContext = { window: {} };
vm.createContext(ctcaeContext);
vm.runInContext(fs.readFileSync(path.join(root,'js','ctcae-descriptors.js'),'utf8'), ctcaeContext);
const CTCAE = ctcaeContext.window.SACTCheckCTCAE;
assert(CTCAE?.guide, 'CTCAE library failed to initialise.');
const Lab = require('../js/local-lab-profile.js');

let inputCount=0, ruleCount=0, ctcaeFields=0, renalBands=0, exactCarboplatin=0, immunePanels=0;
for (const { file, data } of lung) {
  const code=String(data.metadata.nccp_regimen_code).padStart(5,'0'); const m=data.metadata || {};
  assert.strictEqual(data.status,'encoded_prototype_pending_clinical_and_pharmacy_validation',`${code} is not an active encoded prototype.`);
  assert(!/placeholder|draft/i.test(String(data.status || '')),`${code} remains a placeholder/draft.`);
  assert(['0.40.0','0.43.0','0.44.0','0.45.0','0.45.1','0.46.0','0.47.0'].includes(m.sactcheck_encoding_version),`${code} lacks a supported Lung/Gynaecology reconciliation encoding marker.`);
  assert.strictEqual(m.partial_assessment_supported,true,`${code} lacks single-entry support.`);
  assert(/^https:\/\/healthservice\.hse\.ie\/documents\//.test(m.source_url || ''),`${code} lacks direct official HSE/NCCP PDF.`);
  assert(m.lung_subgroup,`${code} lacks Lung subgroup.`);
  assert(Array.isArray(m.treatment_class) && m.treatment_class.length,`${code} lacks treatment-class metadata.`);
  assert(m.catalogue_section,`${code} lacks catalogue section.`);
  assert(Array.isArray(data.required_inputs) && data.required_inputs.length===0,`${code} has blocking required inputs.`);
  const defs=data.input_definitions || {}; const rules=data.rule_engine?.rules || [];
  assert(Object.keys(defs).length>0,`${code} has no active inputs.`); assert(rules.length>0,`${code} has no decision rules.`);
  inputCount += Object.keys(defs).length; ruleCount += rules.length;
  const sc=data.supportive_care || {};
  assert(sc.emetogenic_risk,`${code} lacks emetogenic classification.`);
  assert(sc.mapping_source_url,`${code} lacks supportive-care source.`);
  assert(sc.validation_status,`${code} lacks supportive-care validation status.`);
  assert(riskMap.protocols[code],`${code} is missing from central supportive-care map.`);
  if (!['phase_dependent','variable'].includes(sc.emetogenic_risk)) {
    assert(sc.script_id,`${code} lacks supportive-care script.`);
    assert(riskMap.scripts[sc.script_id],`${code} references unknown script ${sc.script_id}.`);
    assert.strictEqual(sc.supportive_medications_pdf_url,riskMap.scripts[sc.script_id].url,`${code} supportive link is not registry controlled.`);
  }
  const immune = (m.treatment_class || []).includes('immunotherapy');
  if (immune) {
    for (const field of ['tsh_miu_l','free_t4_pmol_l','cortisol_nmol_l','acth_result','glucose_mmol_l','ketones_mmol_l']) {
      assert(defs[field],`${code} immunotherapy pathway lacks optional ${field}.`);
      assert.notStrictEqual(defs[field].required,true,`${code}/${field} is incorrectly mandatory.`);
    }
    immunePanels += 1;
  }
  for (const [field,definition] of Object.entries(defs)) {
    assert.notStrictEqual(definition.required,true,`${code}/${field} is blocking.`);
    const text=`${field} ${definition.label || ''}`.toLowerCase();
    if (trueGradeField(field,definition)) {
      ctcaeFields += 1;
      assert.strictEqual(definition.type,'select',`${code}/${field} CTCAE input must be select.`);
      assert.strictEqual(definition.ctcae_version,'5.0',`${code}/${field} lacks CTCAE v5.0.`);
      assert(definition.assessment_guidance,`${code}/${field} lacks assessment guidance.`);
      const grades=new Set((definition.options || []).map(item => Number(item.value)));
      [0,1,2,3,4].forEach(g => assert(grades.has(g),`${code}/${field} lacks Grade ${g}.`));
      const guide=CTCAE.guide({...definition,id:field});
      assert(guide?.grades?.length>=5,`${code}/${field} lacks beside-control grading guide.`);
      guide.grades.slice(0,5).forEach(item => assert(item.description,`${code}/${field}/Grade ${item.grade} lacks explanation.`));
    }
    if (/crcl|creatinine clearance|egfr|renal function/.test(text)) {
      if (definition.type==='select') {
        renalBands += 1;
        assert.strictEqual(definition.renal_input?.mode,'protocol_specific_band',`${code}/${field} lacks renal-band metadata.`);
        assert.strictEqual(definition.renal_input?.exact_value_required,false,`${code}/${field} incorrectly requires exact value.`);
        assert((definition.options || []).length>=2,`${code}/${field} lacks tiered renal choices.`);
      } else if (/carboplatin|calvert/i.test(`${m.title} ${text}`)) {
        exactCarboplatin += 1;
        assert.strictEqual(definition.renal_input?.mode,'exact_continuous',`${code}/${field} lacks Calvert exact-value declaration.`);
      }
    }
    if (/^(bilirubin_ratio_uln|bilirubin_uln_multiple|bilirubin_uln|alt_uln_multiple|ast_uln_multiple|ast_uln|alt_ast_uln_multiple|alt_ast_ratio_uln|ast_alt_uln|transaminases_uln_multiple|alt_ratio_uln)$/.test(field)) {
      assert(Lab.adapterFor(field),`${code}/${field} lacks automatic actual-result ULN conversion.`);
    }
  }
}
assert(inputCount>=950,`Expected broad Lung input coverage; found ${inputCount}.`);
assert(ruleCount>=900,`Expected broad Lung rule coverage; found ${ruleCount}.`);
assert(ctcaeFields>=200,`Expected broad Lung CTCAE coverage; found ${ctcaeFields}.`);
assert(renalBands>=20,`Expected broad Lung renal-band coverage; found ${renalBands}.`);
assert(exactCarboplatin>=5,`Expected carboplatin exact-CrCl/GFR exceptions; found ${exactCarboplatin}.`);
assert(immunePanels>=10,`Expected optional endocrine panels on immunotherapy protocols; found ${immunePanels}.`);

// Single-entry regression across every visible rule-linked Lung field.
const engineContext={ console }; engineContext.globalThis=engineContext; vm.createContext(engineContext);
vm.runInContext(fs.readFileSync(path.join(root,'js','rule-engine.js'),'utf8'),engineContext);
vm.runInContext(fs.readFileSync(path.join(root,'js','assessment-engine.js'),'utf8'),engineContext);
const Engine=engineContext.SACTCheckAssessmentEngine; const RuleEngine=engineContext.SACTCheckRuleEngine;
let auditedFields=0;
for (const { data } of lung) {
  const code=String(data.metadata.nccp_regimen_code).padStart(5,'0');
  const profileId=Engine.getProfiles(data)[0]?.id || 'default';
  const definitions=Engine.getInputDefinitions(data,profileId,{});
  const ruleFields=new Set((data.rule_engine?.rules || []).flatMap(rule => RuleEngine.collectConditionFields(RuleEngine.conditionFromRule(rule))));
  const candidates=definitions.filter(definition => definition.visible!==false && ruleFields.has(definition.id) && demoValue(definition)!=='');
  assert(candidates.length>0,`${code} has no independently testable field.`);
  for (const definition of candidates) {
    const result=Engine.assess(data,{[definition.id]:demoValue(definition)},{profileId});
    assert(result.findings.length>0,`${code}/${definition.id} produced no partial finding.`);
    assert(!/insufficient data/i.test(String(result.status || '')),`${code}/${definition.id} returned insufficient-data state.`);
    auditedFields += 1;
  }
}
assert(auditedFields>=700,`Expected at least 700 independently assessed Lung inputs; found ${auditedFields}.`);

// Targeted-agent trade-name discoverability.
const aliasContext={globalThis:null};aliasContext.globalThis=aliasContext;vm.createContext(aliasContext);
vm.runInContext(fs.readFileSync(path.join(root,'js','drug-aliases.js'),'utf8'),aliasContext);
const Aliases=aliasContext.SACTCheckDrugAliases;assert.strictEqual(Aliases.version,'0.48.0');
const byCode=code => lung.find(({data})=>String(data.metadata.nccp_regimen_code).padStart(5,'0')===code).data;
const aliases={'00221':'Giotrif','00401':'Alecensa','00562':'Alunbrig','00340':'Zykadia','00243':'Xalkori','00565':'Vizimpro','00702':'Rozlytrek','00219':'Tarceva','00220':'Iressa','00570':'Lorviqua','00372':'Vargatef','00353':'Tagrisso','00823':'Tepmetko','00908':'Hetronifly'};
for (const [code,alias] of Object.entries(aliases)) assert(Aliases.forProtocol(byCode(code)).includes(alias),`${code} is not searchable by ${alias}.`);

// Permanent tumour-site leakage regression.
for (const code of ['00507','00797','00688']) {
  const protocol=all.find(({data})=>String(data.metadata.nccp_regimen_code).padStart(5,'0')===code)?.data;
  assert(protocol,`${code} missing from canonical library.`);
  assert(!tumourGroups(protocol).includes('Lung'),`${code} incorrectly leaked into Lung.`);
}
for (const {data} of all) {
  const m=data.metadata || {};
  if (typeof m.tumour_group==='string' && Array.isArray(m.tumour_groups)) {
    assert(m.tumour_groups.includes(m.tumour_group),`${m.nccp_regimen_code} has conflicting singular/plural tumour metadata.`);
  }
}

const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert(html.includes('v0.53.0 · What changed?'),'current release badge missing.');
assert(html.includes('js/protocol-loader.js?v=0.51.0'),'current loader cache key missing.');
assert(html.includes('js/drug-aliases.js?v=0.48.4'),'current alias cache key missing.');

console.log(`v0.40.0 Lung library tests passed: 59 active protocols, ${inputCount} inputs, ${ruleCount} rules and ${auditedFields} independently assessed rule-linked fields.`);
