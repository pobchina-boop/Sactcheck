const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const Lab = require('../js/local-lab-profile.js');
const Engine = require('../js/assessment-engine.js');

const settings = Lab.read();
assert.strictEqual(settings.altUln, 34, 'CUH ALT ULN must default to 34 U/L.');
assert.strictEqual(settings.astUln, 42, 'CUH AST ULN must default to 42 U/L.');
assert.strictEqual(settings.bilirubinUln, 20, 'CUH bilirubin ULN must default to 20 µmol/L.');
assert.strictEqual(settings.tshLower, 0.38);
assert.strictEqual(settings.tshUpper, 5.33);
assert.strictEqual(settings.freeT4Lower, 8);
assert.strictEqual(settings.freeT4Upper, 18);

assert.strictEqual(Lab.calculate('alt_uln_multiple', { alt: 68 }).ratio, 2);
assert.strictEqual(Lab.calculate('ast_uln_multiple', { ast: 84 }).ratio, 2);
assert.strictEqual(Lab.calculate('bilirubin_ratio_uln', { bilirubin: 40 }).ratio, 2);
assert.strictEqual(Lab.calculate('alt_ast_uln_multiple', { alt: 34, ast: 84 }).ratio, 2, 'Combined transaminase fields must use the highest calculated multiple.');
assert.strictEqual(Lab.calculate('alt_ast_uln_multiple', { alt: 51 }).ratio, 1.5, 'A single entered transaminase must still be assessable.');

// v0.82.1 LFT hotfix: component-prefixed and historical field aliases must use
// the same actual-result conversion rather than asking clinicians for manual ×ULN.
for (const [id, values, expected] of [
  ['ast_alt_uln_multiple', { alt: 34, ast: 84 }, 2],
  ['ast_alt_uln', { alt: 51, ast: 42 }, 1.5],
  ['capecitabine_alt_ast_uln', { alt: 68, ast: 42 }, 2],
  ['capecitabine_bilirubin_uln', { bilirubin: 40 }, 2],
  ['irinotecan_bilirubin_uln', { bilirubin: 30 }, 1.5],
  ['epirubicin_ast_uln', { ast: 84 }, 2],
  ['mitomycin_ast_uln', { ast: 63 }, 1.5],
  ['transaminase_uln_multiple', { alt: 34, ast: 63 }, 1.5]
]) {
  const calculation = Lab.calculate(id, values);
  assert(calculation, `${id} must have an automatic actual-result adapter.`);
  assert.strictEqual(calculation.ratio, expected, `${id} calculated the wrong ×ULN value.`);
}

// Older protocols occasionally retain an ALT-named field while the displayed
// source-facing label explicitly requires the higher ALT/AST result.
const combinedByLabel = { id:'alt_uln_multiple', type:'number', unit:'× ULN', label:'ALT / AST' };
assert.strictEqual(Lab.calculate(combinedByLabel, { alt:34, ast:84 }).ratio, 2, 'ALT/AST-labelled legacy fields must use the higher entered transaminase.');
const partial = Lab.calculate('alt_ast_uln_multiple', { alt:68 });
assert.deepStrictEqual(partial.missingAnalytes, ['ast']);
assert.match(partial.display, /AST not entered \(not assumed normal\)/);
assert.match(partial.display, /ALT 68 U\/L \(ULN 34; above limit, 2 ×ULN\)/);
assert.doesNotMatch(partial.display, /÷| = /);

// Invalid edited ULNs must not silently revert to another denominator.
Lab.reset();
Lab.write({ altUln: 40, astUln: 50, bilirubinUln: 25 });
Lab.write({ altUln: '', astUln: 0, bilirubinUln: 'bad' });
const retained = Lab.read();
assert.strictEqual(retained.altUln, 40);
assert.strictEqual(retained.astUln, 50);
assert.strictEqual(retained.bilirubinUln, 25);
assert.deepStrictEqual(Lab.validatePatch({ altUln:'', astUln:42 }).invalid, ['altUln']);
Lab.reset();

// End-to-end decision boundaries for the 00568 immune-hepatitis rules remain
// unchanged; only the clinician-facing input is converted from actual results.
const p568 = JSON.parse(fs.readFileSync(path.join(root, 'protocols/lung/00568-pembrolizumab-pemetrexed-and-carboplatin-auc5-therapy.json'), 'utf8'));
let lftInputs = { alt_ast_uln_multiple: Lab.calculate('alt_ast_uln_multiple', { alt:102, ast:126 }).ratio };
let lftResult = Engine.assess(p568, lftInputs);
assert(!lftResult.findings.some(item => (item.ruleId || item.id) === 'ICI_HEPATITIS_WITHHOLD'), 'Exactly 3 ×ULN must not cross the >3 threshold.');
lftInputs = { alt_ast_uln_multiple: Lab.calculate('alt_ast_uln_multiple', { alt:102.34, ast:126 }).ratio };
lftResult = Engine.assess(p568, lftInputs);
assert(lftResult.findings.some(item => (item.ruleId || item.id) === 'ICI_HEPATITIS_WITHHOLD'), 'ALT >3 ×ULN must trigger the existing withholding rule.');
lftInputs = { bilirubin_uln_multiple: Lab.calculate('bilirubin_uln_multiple', { bilirubin:30 }).ratio };
lftResult = Engine.assess(p568, lftInputs);
assert(!lftResult.findings.some(item => (item.ruleId || item.id) === 'ICI_BILI_WITHHOLD'), 'Exactly 1.5 ×ULN bilirubin must not cross the >1.5 threshold.');
lftInputs = { bilirubin_uln_multiple: Lab.calculate('bilirubin_uln_multiple', { bilirubin:30.2 }).ratio };
lftResult = Engine.assess(p568, lftInputs);
assert(lftResult.findings.some(item => (item.ruleId || item.id) === 'ICI_BILI_WITHHOLD'), 'Bilirubin >1.5 ×ULN must trigger the existing withholding rule.');

const mappedFieldPatterns = /^(bilirubin_ratio_uln|bilirubin_uln_multiple|bilirubin_uln|alt_uln_multiple|ast_uln_multiple|ast_uln|alt_ast_uln_multiple|alt_ast_ratio_uln|ast_alt_uln|transaminases_uln_multiple|alt_ratio_uln)$/;
let mappedDefinitions = 0;
let allNumericLftUlnDefinitions = 0;
for (const group of fs.readdirSync(path.join(root, 'protocols'))) {
  const dir = path.join(root, 'protocols', group);
  if (!fs.statSync(dir).isDirectory()) continue;
  for (const file of fs.readdirSync(dir).filter(name => name.endsWith('.json'))) {
    const protocol = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    const raw = protocol.input_definitions || protocol.assessment?.inputs || {};
    const entries = Array.isArray(raw) ? raw.map(item => [item.id, item]) : Object.entries(raw);
    for (const [id, definition] of entries) {
      if (mappedFieldPatterns.test(id)) {
        mappedDefinitions += 1;
        assert(Lab.adapterFor({ id, ...definition }), `${group}/${file}: ${id} lacks an automatic actual-result adapter.`);
      }
      const signature = `${id} ${definition?.label || ''} ${definition?.unit || ''}`.toLowerCase();
      const numericLftUln = definition?.type === 'number' && signature.includes('uln') && /(?:^|\b)(?:bilirubin|alt|ast|transamin)/.test(signature) && !/grade|band|category|toxicity/.test(id.toLowerCase());
      if (numericLftUln) {
        allNumericLftUlnDefinitions += 1;
        assert(Lab.adapterFor({ id, ...definition }), `${group}/${file}: ${id} is a numeric LFT ×ULN field without an automatic actual-result adapter.`);
      }
    }
  }
}
assert(mappedDefinitions > 50, 'Expected broad platform-wide ULN coverage.');
assert(allNumericLftUlnDefinitions > 400, 'Expected platform-wide numeric LFT ×ULN coverage.');

const ici = JSON.parse(fs.readFileSync(path.join(root, 'protocols/lung/00655-durvalumab-maintenance.json'), 'utf8'));
const iciDefinitions = Engine.getInputDefinitions(ici, Engine.getProfiles(ici)[0].id, {});
for (const id of ['tsh_miu_l', 'free_t4_pmol_l', 'cortisol_nmol_l', 'cortisol_sample_time', 'acth_result', 'glucose_mmol_l', 'ketones_mmol_l']) {
  const definition = iciDefinitions.find(item => item.id === id);
  assert(definition, `Immunotherapy optional field ${id} is missing.`);
  assert.strictEqual(definition.required, false, `${id} must remain optional.`);
  assert.strictEqual(definition.ui_section, 'immunotherapy_bloods');
}
const endocrineOnly = Engine.assess(ici, { tsh_miu_l: '1.2' }, { profileId: Engine.getProfiles(ici)[0].id });
assert.notStrictEqual(endocrineOnly.actionType, 'incomplete', 'A single optional immunotherapy blood must be retained as a partial assessment.');

const cytotoxic = JSON.parse(fs.readFileSync(path.join(root, 'protocols/gynaecology/00624-carboplatin-pegylated-liposomal-doxorubicin.json'), 'utf8'));
const cytotoxicDefinitions = Engine.getInputDefinitions(cytotoxic, Engine.getProfiles(cytotoxic)[0].id, {});
assert(!cytotoxicDefinitions.some(item => item.ui_section === 'immunotherapy_bloods'), 'Non-immunotherapy protocols must not display endocrine screening fields.');

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert(html.includes('id="tissueTypeGrid"'));
assert(html.includes('id="tissueLandingPanel"'));
assert(html.includes('js/local-lab-profile.js?v=0.48.4'));
assert(html.includes('lft=0.82.2'), 'LFT hotfix cache key must be present.');
assert(html.includes('js/tissue-ui.js?v=0.51.0'));
const genericUi = fs.readFileSync(path.join(root, 'js/generic-assessment-ui.js'), 'utf8');
assert(genericUi.includes('id="jsonImmunotherapyBloodSection"'));
assert(genericUi.includes('id="jsonLabProfilePanel"'));
assert(genericUi.includes('higher entered multiple is used'));
assert(genericUi.includes('Previous laboratory limits were kept'));

const tissueUi = fs.readFileSync(path.join(root, 'js/tissue-ui.js'), 'utf8');
for (const expected of ['Gastrointestinal', 'Breast', 'Lung', 'Gynaecology', 'Genitourinary', 'Neuro-oncology', 'Sarcoma', 'Skin / Melanoma', 'Head & Neck']) {
  assert(tissueUi.includes(expected), `Tissue UI is missing ${expected}.`);
}
assert(!tissueUi.includes('id: "haem"'), 'Haematology must be excluded from Solid Tumour tissue navigation.');
console.log(`v0.82.1 LFT/ULN hotfix checks passed; ${allNumericLftUlnDefinitions} numeric LFT ×ULN definitions accept actual-result conversion.`);
