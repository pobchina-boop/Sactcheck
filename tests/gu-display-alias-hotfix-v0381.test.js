const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const root = path.resolve(__dirname, '..');

function loadJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

// Alias extraction must reflect drugs in the regimen, not treatments mentioned in indication prose.
const aliasContext = { globalThis: null };
aliasContext.globalThis = aliasContext;
vm.createContext(aliasContext);
vm.runInContext(fs.readFileSync(path.join(root, 'js', 'drug-aliases.js'), 'utf8'), aliasContext);
const Aliases = aliasContext.SACTCheckDrugAliases;
assert.strictEqual(Aliases.version, '0.38.1');

const abiraterone = loadJson('protocols/genitourinary/00103-abiraterone-prednisolone-mcrpc.json');
const abirateroneAliases = Aliases.forProtocol(abiraterone);
assert(abirateroneAliases.includes('Zytiga'), 'Abiraterone should expose Zytiga.');
assert(!abirateroneAliases.includes('Taxotere'), 'Docetaxel mentioned only in indication prose must not add Taxotere to abiraterone.');

const gemCarbo = loadJson('protocols/lung/00310-gemcitabine-carboplatin.json');
const gemCarboAliases = Aliases.forProtocol(gemCarbo);
assert(gemCarboAliases.includes('Gemzar'), 'Gemcitabine/carboplatin should expose Gemzar.');
assert(!gemCarboAliases.includes('Opdivo'), 'Nivolumab mentioned only in indication prose must not add Opdivo.');

// Visible titles should use normal casing while the underlying source URL remains untouched.
const engineContext = { console };
engineContext.globalThis = engineContext;
vm.createContext(engineContext);
vm.runInContext(fs.readFileSync(path.join(root, 'js', 'rule-engine.js'), 'utf8'), engineContext);
vm.runInContext(fs.readFileSync(path.join(root, 'js', 'assessment-engine.js'), 'utf8'), engineContext);
const Engine = engineContext.SACTCheckAssessmentEngine;
assert.strictEqual(Engine.getProtocolTitle(abiraterone), 'Abiraterone and prednisolone');
assert(!Engine.getProtocolTitle(abiraterone).includes('LONE'), 'Visible title still contains Tall Man suffix casing.');
assert(abiraterone.metadata.source_url.includes('prednisoLONE'), 'Official NCCP source URL should remain unchanged.');

// Shared protocols should inherit the actively selected tissue identity.
const tissueContext = {
  globalThis: null,
  document: {
    readyState: 'loading',
    addEventListener() {},
    getElementById() { return null; },
    querySelectorAll() { return []; }
  }
};
tissueContext.globalThis = tissueContext;
vm.createContext(tissueContext);
vm.runInContext(fs.readFileSync(path.join(root, 'js', 'tissue-ui.js'), 'utf8'), tissueContext);
const Tissue = tissueContext.SACTCheckTissueUI;
assert.strictEqual(Tissue.version, '0.38.1');
const gu = Tissue.tissues.find(item => item.id === 'gu');
const sharedGroups = ['Breast', 'Genitourinary'];
assert.strictEqual(Tissue.tissueForGroups(sharedGroups, gu).id, 'gu', 'GU selection should override first-listed Breast tissue for a shared regimen.');
assert.strictEqual(Tissue.contextualTumourLabel(sharedGroups, gu), 'Genitourinary · Also: Breast');

const lungGuGroups = ['Lung', 'Genitourinary'];
assert.strictEqual(Tissue.tissueForGroups(lungGuGroups, gu).id, 'gu', 'GU selection should override first-listed Lung tissue for a shared regimen.');
assert.strictEqual(Tissue.contextualTumourLabel(lungGuGroups, gu), 'Genitourinary · Also: Lung');

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert(html.includes('Version 0.38.1 · GU display and alias hotfix'));
assert(html.includes('js/tissue-ui.js?v=0.38.1'));
assert(html.includes('js/drug-aliases.js?v=0.38.1'));

console.log('v0.38.1 GU display, title casing and alias precision tests passed.');
