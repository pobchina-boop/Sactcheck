const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const protocolRoot = path.join(root, 'protocols');
const validSections = new Set([
  'haem_plasma_cell_disorders',
  'chemotherapy_combination_sact',
  'targeted_her2_therapy',
  'immunotherapy',
  'endocrine_hormonal_therapy',
  'bone_modifying_therapy',
  'supportive_other',
  'targeted_therapy',
  'small_cell_lung_cancer',
  'chemoradiation',
  'soft_tissue_sarcoma',
  'bone_sarcoma',
  'ewing_sarcoma',
  'rhabdomyosarcoma',
  'kaposi_sarcoma',
  'medulloblastoma_pnet',
  'lower_grade_and_recurrent_glioma',
  'newly_diagnosed_glioblastoma',
  'recurrent_high_grade_glioma',
  'intravesical_therapy',
  'immunotherapy_combination',
  'skin_melanoma',
  'oral_targeted_therapy'
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
      return code && code !== '00000' && !file.includes(`${path.sep}protocols${path.sep}protocols${path.sep}`) && !file.includes(`${path.sep}_template${path.sep}`) && !['index.json', 'package.json', 'protocol-schema.json'].includes(path.basename(file));
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
  // History flags and an aggregate recovery score are not named-event grading aids.
  if(def?.type==='boolean' || id==='restart_residual_immune_grade') return false;
  const text = `${id} ${def?.label || ''}`.toLowerCase();
  if (!text.includes('grade') && !text.includes('ctcae')) return false;
  const exclusions = ['occurrence', 'duration', ' days', 'weeks', 'recurrent', 'prior grade', 'prior_grade', 'not recovered', 'persists', 'over one week', 'resolution', 'requiring interruption', 'unresolved', 'meeting protocol criteria', 'with fever', 'fever or infection', 'complicated diarrhoea', 'grade4_', 'grade3_', 'grade2_', 'grade1_'];
  if (exclusions.some(token => text.includes(token))) return false;
  return id.endsWith('_grade') || id.includes('current_grade') || id.includes('highest_grade') || def?.ctcae_version;
}

const protocols = loadProtocols();
assert.equal(protocols.length, 377, `Expected 377 canonical regimen protocols, found ${protocols.length}`);
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
  assert(/^0\.(?:3[7-9]|[4-9][0-9])\.\d+$/.test(String(metadata.sactcheck_encoding_version || '')), `${code} has unsupported SACTCheck encoding version ${metadata.sactcheck_encoding_version}`);
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
  if(supportive.phase_specific_plan){
    // Authored phase selectors supersede the legacy single-script metadata contract.
    assert(fs.existsSync(path.join(root,supportive.phase_specific_plan.split('?')[0])),`${code} phase plan missing`);
    const phaseData=JSON.parse(fs.readFileSync(path.join(root,'data/phase-support-v0838.json'),'utf8')).regimens[code];
    assert(phaseData?.length,`${code} phase selector lacks authored phases`);
    for(const phase of phaseData){assert(phase.emetogenic_risk&&Array.isArray(phase.medicines)&&phase.active_medicines.length,`${code}/${phase.id} incomplete phase plan`);assert(fs.existsSync(path.join(root,`patient/${code}/support-${phase.id}.html`)));}
    assert(supportive.source_url,`${code} phase plan lacks source`);
  } else {
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
    const tumourText = String(metadata.tumour_group || '').toLowerCase();
    const nationalContextUrl = /haem|lymph|myeloma|leuka/.test(tumourText)
      ? riskMap.source?.haemato_oncology_antiemetic_guidance_url
      : riskMap.source?.medical_oncology_antiemetic_guidance_url;
    const expectedSupportiveUrl = nationalContextUrl || script.url;
    assert.equal(supportive.supportive_medications_pdf_url, expectedSupportiveUrl, `${code} retains a stale supportive-care URL`);
    assert.equal(supportive.supportive_medications_label, script.label, `${code} retains a stale supportive-care label`);
  }

  }

  const definitions = data.input_definitions || {};
  const rules = data.rule_engine?.rules || [];
  for (const [field, def] of Object.entries(definitions)) {
    if (trueGradeField(field, def)) {
      ctcaeFields += 1;
      assert.equal(def.type, 'select', `${code}/${field} must be a CTCAE select, not ${def.type}`);
      const sourceDiarrhoea = ['00216','00586','00623'].includes(code) && ['diarrhoea_grade','diarrhoea_highest_grade'].includes(field);
      const folfoxSourceDiarrhoea = (['00447','00733'].includes(code)) && ['diarrhoea_current_grade','diarrhoea_grade','diarrhoea_highest_grade'].includes(field);
      const everolimusSource = code === '00322';
      const palbociclibSource = code === '00414' && field === 'nonhaem_toxicity_grade';
      const pldSource = code === '00205' && ['mucositis_grade','stomatitis_grade','ppe_grade'].includes(field);
      const newSourceGrade = (['00212','00215','00568'].includes(code) && !def.ctcae_version) || (['00232','00259'].includes(code) && field.endsWith('_grade')) || (code==='00947' && field.endsWith('_event_peak_grade')) || (code === '00605' && field === 'nonhaem_toxicity_grade') || (['00430','00749'].includes(code) && ['nonhaem_toxicity_grade','pneumonitis_grade'].includes(field)) || (code === '00217' && ['cardiac_toxicity_grade','pulmonary_toxicity_grade'].includes(field)) || (code === '00350' && field === 'her2_hypersensitivity_grade') || (['00265','00269'].includes(code) && field === 'stomatitis_grade') || (code === '00423' && ['stomatitis_grade','neuropathy_grade','skin_reaction_grade'].includes(field));
      const lungNextSource=["00689","00908","00271","00280","00319","00222"].includes(code);
      const lungSource=["00455","00558","00569","00579","00576","00655","00713","00714","00317","00318"].includes(code)||lungNextSource;
      const targetedV24Source=metadata.sactcheck_encoding_version==='0.84.24'&&['00353','00401','00562','00570','00243','00382','00831'].includes(code);
      const targetedV25Source=metadata.sactcheck_encoding_version==='0.84.25'&&['00823','00702','00221','00565','00340','00203','00226','00232','00259','00215'].includes(code);
      if(targetedV25Source){assert.equal(def.grading_source_url,metadata.source_url);assert.equal(def.ctcae_version,['00702','00565'].includes(code)?'4.0':undefined);assert(def.grading_source_label&&def.source_grading_note);assert(def.options.every(o=>o.description)||/not a complete grading table/.test(def.source_grading_note));}else if(targetedV24Source){
        const avastin=code==='00831'&&['haemorrhage_grade','venous_thromboembolism_grade'].includes(field);
        const hccImmune=code==='00831'&&!['hypertension_grade','infection_grade','other_nonimmune_toxicity_grade'].includes(field)&&!avastin;
        const source=code==='00353'?'https://evs.nci.nih.gov/ftp1/CTCAE/CTCAE_4.03/CTCAE_4.03_2010-06-14_QuickReference_5x7.pdf':avastin?'https://www.ema.europa.eu/en/documents/product-information/avastin-epar-product-information_en.pdf':metadata.source_url;
        assert.equal(def.grading_source_url,source,`${code}/${field} must retain its exact grading source`);
        assert.equal(def.ctcae_version,code==='00353'||hccImmune?'4.0':avastin?'3.0':undefined);
        assert(def.grading_source_label&&def.source_grading_note,`${code}/${field} needs source-specific grading context`);
      }else if(lungSource){assert.equal(def.grading_source_url,metadata.source_url);if(lungNextSource){assert(def.grading_source_label);assert(def.source_grading_note.length>=40);assert([undefined,"5.0"].includes(def.ctcae_version));}else{assert.match(def.source_grading_note,/not a complete grading table/);assert([undefined,"4.0","4.03"].includes(def.ctcae_version));}}else if(newSourceGrade){assert.equal(def.grading_source_url,metadata.source_url);assert.match(def.source_grading_note,/not a complete grading table/);assert(!def.ctcae_version);}else if(pldSource){assert.equal(def.grading_source_label,'NCCP 00205 / Caelyx NCI-CTC source table');assert.match(def.grading_source_url,/ema\.europa\.eu/);assert(!def.ctcae_version);}else assert.equal(def.ctcae_version, everolimusSource ? '3.0' : palbociclibSource ? '4.0' : folfoxSourceDiarrhoea ? 'NCCP source table 6' : sourceDiarrhoea || ['00858','00860','00861','00348','00734','00688','00720'].includes(code) ? '4.0' : '5.0', `${code}/${field} has wrong source grading version`);
      if(palbociclibSource){assert.equal(def.grading_source_label,'NCCP 00414 / CTCAE v4.0');assert.match(def.grading_source_url,/cancer.gov.*ctcae-v403/);assert(def.options.every(x=>x.description));}
      if(folfoxSourceDiarrhoea) assert.match(def.assessment_guidance,/NCCP.*[Tt]able 6/);
      if(sourceDiarrhoea) { assert.match(def.ctcae_source_url,/healthservice.hse.ie/); assert.match(def.assessment_guidance,/legacy|NCCP/i); }
      if(!pldSource && !newSourceGrade && !lungSource && !targetedV24Source && !targetedV25Source) assert(def.ctcae_category, `${code}/${field} lacks a toxicity-specific CTCAE category`);
      assert(def.assessment_guidance, `${code}/${field} lacks practical assessment guidance`);
      const grades = new Set((def.options || []).map(option => Number(option.value)));
      const sourceHfs = (['00216','00586','00623'].includes(code) && ['hand_foot_syndrome_grade','hand_foot_highest_grade'].includes(field)) || (code === '00217' && field === 'hand_foot_grade');
      const sourceNausea = code === '00794' && field === 'nausea_grade';
      const expectedGrades = code==='00702'&&field==='hyperuricaemia_grade' ? [0,1,3,4] : code==='00947' && field.endsWith('_event_peak_grade') ? [2,3,4] : sourceNausea ? [0,1,2,3] : ['00322','00588'].includes(code) && field === 'febrile_neutropenia_grade' ? [0,3,4] : sourceHfs ? [0,1,2,3] : [0,1,2,3,4];
      if (everolimusSource) {
        assert.equal(def.grading_source_label, 'NCCP 00322 / NCI CTCAE v3.0');
        assert.match(def.grading_source_url, /cancer.gov.*ctcae-v3/);
        assert.deepEqual((def.options || []).map(x => Number(x.value)), expectedGrades);
        assert((def.options || []).every(x => x.description), 'Everolimus source descriptions must override shared defaults');
      }
      expectedGrades.forEach(grade => assert(grades.has(grade), `${code}/${field} lacks Grade ${grade}`));
      if(sourceNausea) {assert(!grades.has(4), 'CTCAE v5 nausea has no grade 4');assert.match(def.grading_source_label,/v5.0.*nausea/);assert.match(def.grading_source_url,/cancer.gov.*ctcae-v5/);assert(def.options.every(x=>x.description));}
      if(sourceHfs) assert(!grades.has(4), 'HFS has no grade 4 in the source table');
      const guide = ctcae.guide({ ...def, id: field });
      assert(guide && guide.grades.length >= expectedGrades.length, `${code}/${field} has no rendered CTCAE grade guide`);
      guide.grades.forEach(item => assert(item.description, `${code}/${field} Grade ${item.grade} has no explanation`));
      if(lungSource||targetedV24Source||targetedV25Source)assert(guide.sourceSpecific, 'Source-specific grading must override generic descriptors');
      const fieldText = `${field} ${def.label || ''}`.toLowerCase();
      if(!lungSource&&!targetedV24Source && !targetedV25Source){
      if (/non[-_ ]?ha?em|non[-_ ]?hemat|non[-_ ]?haemat/.test(fieldText)) {
        assert.equal(def.ctcae_category, 'other_nonhaematological', `${code}/${field} is incorrectly classified as haematological`);
      }
      if (fieldText.includes('colitis') && !fieldText.includes('mucositis') && !['00858','00860','00861'].includes(code)) {
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
    }

    // These fields qualify the age/reuse of a GFR estimate; they are not GFR measurements.
    if(['00430','00251','00261','00318','00579','00713','00689','00908','00271','00280','00319'].includes(code) && ['creatinine_sample_age_hours','creatinine_age_hours','creatinine_percent_of_isotope_baseline','creatinine_percent_reference','serum_creatinine_percent_isotope_baseline'].includes(field)){assert.equal(def.type,'number');continue;}
    const renalText = `${field} ${def?.label || ''}`.toLowerCase();
    if (!/crcl|creatinine clearance|\bgfr\b|egfr/.test(renalText)) continue;
    if (!['number', 'select'].includes(def.type)) continue;
    const comparisons = collectComparisons(rules, field).filter(value => Number.isFinite(Number(value)));
    if (!comparisons.length) continue;
    const mode = def.renal_input?.mode;
    if (mode === 'exact_continuous') {
      exactCarboplatinFields += 1;
      assert.equal(def.type, 'number', `${code}/${field} exact renal field must remain numerical`);
      assert.equal(def.renal_input?.exact_value_required, true, `${code}/${field} exact renal field must declare why a continuous value is required`);
      assert(String(def.renal_input?.reason || '').length >= 20, `${code}/${field} exact renal field lacks a source-specific rationale`);
    } else if (mode === 'source_threshold_numeric') {
      assert(['00823','00702','00221','00565','00340','00203','00226','00232','00259','00215','00353','00401','00562','00570','00243','00382','00831','00689','00908','00271','00280','00319','00222','00455','00558','00569','00579','00576','00655','00713','00714','00317','00318','00205','00217','00228','00230','00736','00743','00254','00371','00262','00263','00265','00269','00423','00377','00378','00381','00545','00605','00688','00720','00738','00947'].includes(code),`${code}: numeric threshold entry requires an audited source`);
      assert.equal(def.type,'number');assert.equal(def.renal_input.exact_value_required,false);
      const auditedSources=[metadata.source_url,...(metadata.source_supplements||[]).map(s=>s.url)];
      assert(auditedSources.includes(def.renal_input.source_url),`${code}/${field}: numeric renal source must be NCCP or an explicitly audited supplement`);assert(def.renal_input.reason.length>=20);
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
assert.equal(variableRisk, 16, 'One solid-tumour regimen plus fifteen Haematology protocols should remain variable pending component/local pharmacy reconciliation.');

assert.equal(Object.keys(riskMap.protocols || {}).length, 377, 'Central supportive-care map must cover every regimen.');
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
assert(html.includes('v0.56.1 · What changed?'), 'Release badge is stale.');
assert(html.includes('js/protocol-loader.js?v=0.56.1'), 'Protocol loader cache key is stale.');
assert(!loader.includes('\u0008'), 'Protocol loader contains a stray control character in treatment-class formatting.');

console.log(`v0.37.0 platform standardisation tests passed: ${protocols.length} regimens, ${ctcaeFields} CTCAE fields, ${renalBandFields} renal-band fields, ${exactCarboplatinFields} carboplatin exact-value fields.`);
