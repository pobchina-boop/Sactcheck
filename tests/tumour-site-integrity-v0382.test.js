const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const protocolRoot = path.join(root, 'protocols');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.isFile() && entry.name.endsWith('.json') && !['index.json', 'protocol-schema.json'].includes(entry.name) ? [full] : [];
  });
}

const protocol = JSON.parse(fs.readFileSync(path.join(protocolRoot, 'breast', '00688-atezolizumab-nab-paclitaxel.json'), 'utf8'));
assert.strictEqual(protocol.metadata.tumour_group, 'Breast');
assert.deepStrictEqual(protocol.metadata.tumour_groups, ['Breast']);
assert(/triple-negative breast cancer/i.test(protocol.metadata.indication));

const index = JSON.parse(fs.readFileSync(path.join(protocolRoot, 'index.json'), 'utf8'));
const entry = index.protocols.find(item => item.id === 'nccp-00688-v2a');
assert(entry, 'NCCP 00688 index entry missing.');
assert.strictEqual(entry.tumour_group, 'Breast', 'NCCP 00688 must be indexed as Breast only.');

for (const file of walk(protocolRoot)) {
  const item = JSON.parse(fs.readFileSync(file, 'utf8'));
  const metadata = item.metadata || {};
  const primary = typeof metadata.tumour_group === 'string' ? metadata.tumour_group.trim() : '';
  const plural = (Array.isArray(metadata.tumour_groups) ? metadata.tumour_groups : metadata.tumour_groups ? [metadata.tumour_groups] : [])
    .flatMap(value => String(value).split(','))
    .map(value => value.trim())
    .filter(Boolean);
  if (primary && plural.length) {
    assert(plural.includes(primary), `${path.relative(root, file)} has conflicting tumour_group and tumour_groups metadata.`);
  }
}

const validatorContext = { module: { exports: {} }, exports: {}, require, console };
validatorContext.globalThis = validatorContext;
vm.createContext(validatorContext);
vm.runInContext(fs.readFileSync(path.join(root, 'js', 'protocol-validator.js'), 'utf8'), validatorContext);
const Validator = validatorContext.module.exports;
assert.deepStrictEqual(Array.from(Validator.canonicalTumourGroups({ tumour_group: 'Breast', tumour_groups: ['Lung', 'Genitourinary'] })), ['Breast']);
assert.deepStrictEqual(Array.from(Validator.canonicalTumourGroups({ tumour_group: 'Breast', tumour_groups: ['Breast', 'Genitourinary'] })), ['Breast', 'Genitourinary']);

const tissueContext = {
  globalThis: null,
  document: { readyState: 'loading', addEventListener() {}, getElementById() { return null; }, querySelectorAll() { return []; } }
};
tissueContext.globalThis = tissueContext;
vm.createContext(tissueContext);
vm.runInContext(fs.readFileSync(path.join(root, 'js', 'tissue-ui.js'), 'utf8'), tissueContext);
assert.strictEqual(tissueContext.SACTCheckTissueUI.version, '0.38.2');

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert(html.includes('Version 0.41.0 · complete sarcoma library'));
assert(html.includes('js/tissue-ui.js?v=0.41.0'));
assert(html.includes('js/protocol-loader.js?v=0.41.0'));

console.log('v0.38.2 tumour-site metadata integrity tests passed.');
