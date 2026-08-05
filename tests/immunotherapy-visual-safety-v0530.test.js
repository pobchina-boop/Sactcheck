const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pkg = require(path.join(root, 'package.json'));
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'js/generic-assessment-ui.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css/immunotherapy-safety.css'), 'utf8');
const Safety = require(path.join(root, 'js/immunotherapy-safety.js'));
const Engine = require(path.join(root, 'js/assessment-engine.js'));

assert.strictEqual(pkg.version, '0.55.0');
assert.strictEqual(Safety.version, '0.55.0');
assert(html.includes('SACTCheck v0.55.0 — Global Clinical Scenario Interpreter'));
assert(html.includes('css/immunotherapy-safety.css?v=0.55.0'));
assert(html.includes('js/immunotherapy-safety.js?v=0.55.0'));
assert(ui.includes('jsonImmuneSafetyButton'));
assert(ui.includes('jsonImmuneSafetyPanel'));
assert(ui.includes('SACTCheckImmunotherapySafety?.updateAssessment'));
assert(css.includes('.immune-organ-grid'));
assert.strictEqual(Safety.domains.length, 9);

const pembro = require(path.join(root, 'protocols/shared/00558-pembrolizumab-400mg-monotherapy.json'));
const ac = require(path.join(root, 'protocols/breast/00252-ac-doxorubicin-cyclophosphamide.json'));
const definitions = Engine.getInputDefinitions(pembro, Engine.getProfiles(pembro)[0].id, {});
assert.strictEqual(Safety.supports(pembro, definitions), true);
assert.strictEqual(Safety.supports(ac, Engine.getInputDefinitions(ac, Engine.getProfiles(ac)[0].id, {})), false);
assert.deepStrictEqual(Safety.agentsForProtocol(pembro), ['pembrolizumab']);

const sources = Safety.sourcesForProtocol(pembro);
assert(sources.some(source => /Official NCCP/.test(source.label)));
assert(sources.some(source => /ESMO/.test(source.label)));
assert(sources.some(source => /SITC/.test(source.label)));
assert(sources.some(source => /Keytruda EMA/.test(source.label)));

const endocrine = Safety.domains.find(domain => domain.id === 'endocrine');
const endocrineFields = Safety.linkedDefinitions(endocrine, definitions).map(field => field.id);
for (const id of ['tsh_miu_l', 'free_t4_pmol_l', 'cortisol_nmol_l', 'glucose_mmol_l']) {
  assert(endocrineFields.includes(id), `${id} should link to the endocrine tile.`);
}

const result = Engine.assess(pembro, { pneumonitis_grade: '2', tsh_miu_l: '1.2' }, { profileId: Engine.getProfiles(pembro)[0].id });
const model = Safety.buildModel(pembro, definitions, { pneumonitis_grade: '2', tsh_miu_l: '1.2' }, result);
assert.strictEqual(model.supported, true);
assert.strictEqual(model.domains.find(domain => domain.id === 'lung').status.level, 'review');
assert.strictEqual(model.domains.find(domain => domain.id === 'endocrine').status.level, 'entered');
assert(model.domains.find(domain => domain.id === 'lung').status.findings.some(finding => finding.ruleId === 'PNEUMONITIS_G2'));

const criticalResult = Engine.assess(pembro, { pneumonitis_grade: '4' }, { profileId: Engine.getProfiles(pembro)[0].id });
const criticalModel = Safety.buildModel(pembro, definitions, { pneumonitis_grade: '4' }, criticalResult);
assert.strictEqual(criticalModel.domains.find(domain => domain.id === 'lung').status.level, 'critical');

console.log('v0.55.0 immunotherapy visual safety tests passed.');
