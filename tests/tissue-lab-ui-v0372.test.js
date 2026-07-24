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

const mappedFieldPatterns = /^(bilirubin_ratio_uln|bilirubin_uln_multiple|bilirubin_uln|alt_uln_multiple|ast_uln_multiple|ast_uln|alt_ast_uln_multiple|alt_ast_ratio_uln|ast_alt_uln|transaminases_uln_multiple|alt_ratio_uln)$/;
let mappedDefinitions = 0;
for (const group of fs.readdirSync(path.join(root, 'protocols'))) {
  const dir = path.join(root, 'protocols', group);
  if (!fs.statSync(dir).isDirectory()) continue;
  for (const file of fs.readdirSync(dir).filter(name => name.endsWith('.json'))) {
    const protocol = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    const raw = protocol.input_definitions || protocol.assessment?.inputs || {};
    const entries = Array.isArray(raw) ? raw.map(item => [item.id, item]) : Object.entries(raw);
    for (const [id] of entries) {
      if (!mappedFieldPatterns.test(id)) continue;
      mappedDefinitions += 1;
      assert(Lab.adapterFor(id), `${group}/${file}: ${id} lacks an automatic actual-result adapter.`);
    }
  }
}
assert(mappedDefinitions > 50, 'Expected broad platform-wide ULN coverage.');

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
assert(html.includes('Version 0.38.0 · Complete prostate library'));
assert(html.includes('id="tissueTypeGrid"'));
assert(html.includes('id="tissueLandingPanel"'));
assert(html.includes('js/local-lab-profile.js?v=0.38.0'));
assert(html.includes('js/tissue-ui.js?v=0.38.0'));
const genericUi = fs.readFileSync(path.join(root, 'js/generic-assessment-ui.js'), 'utf8');
assert(genericUi.includes('id="jsonImmunotherapyBloodSection"'));
assert(genericUi.includes('id="jsonLabProfilePanel"'));

const tissueUi = fs.readFileSync(path.join(root, 'js/tissue-ui.js'), 'utf8');
for (const expected of ['Gastrointestinal', 'Breast', 'Lung', 'Gynaecology', 'Genitourinary', 'Neuro-oncology', 'Sarcoma', 'Haematology', 'Skin / Melanoma', 'Head & Neck']) {
  assert(tissueUi.includes(expected), `Tissue UI is missing ${expected}.`);
}
console.log(`v0.37.2 tissue/lab UI tests passed; ${mappedDefinitions} ULN definitions use automatic actual-result adapters.`);
