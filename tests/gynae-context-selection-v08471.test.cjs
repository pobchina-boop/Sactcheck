'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const registry = require('../js/patient-asset-registry-v0810');
const index = require('../protocols/index.json').protocols;
const protocol = code => require(path.join(root, index.find(r => r.path.includes('/' + code + '-')).path));
const missing = '00203 00205 00212 00215 00226 00232 00251 00261 00279 00311 00385 00419 00455 00558 00621 00812'.split(' ');

global.SACTCheckProtocolContext = {activeTumourGroup: () => 'Gynaecology'};
for (const code of missing) {
  const p = protocol(code);
  for (const asset of ['portal', 'guide', 'passport', 'sact-card', 'consent-draft']) {
    const route = 'patient/' + code + '/scope.html?asset=' + asset;
    // The normal workflow passes the active protocol and gets the tumour group from the catalogue.
    assert.equal(registry.relativePath(p, asset), route);
    assert.equal(registry.compatibilityUrl(p, asset), 'https://sactcheck.com/' + route);
    assert(fs.existsSync(path.join(root, route.split('?')[0])), route);
  }
}
const carbo = protocol('00251');
global.SACTCheckProtocolContext.activeTumourGroup = () => 'Breast';
assert.equal(registry.relativePath(carbo, 'guide'), 'patient/00251/guide.pdf');
assert.equal(registry.relativePath({...carbo, selected_indication_id: '00251a'}, 'guide'), 'patient/00251/scope.html?asset=guide');
assert.equal(registry.relativePath({...carbo, selected_indication_id: '00251j'}, 'guide'), 'patient/00251/guide.pdf');
assert.equal(registry.relativePath(carbo, 'guide', 'Gynaecology'), 'patient/00251/scope.html?asset=guide');

const selector = fs.readFileSync(path.join(root, 'assets/patient/context-selector-v08425.js'), 'utf8');
for (const [code, asset, expected] of [
  ['00251', 'guide', ['./guide.pdf']],
  ['00205', 'guide', ['./guide.pdf', 'sarcoma/guide.pdf']],
  ['00205', 'passport', ['./passport.pdf', 'sarcoma/passport.pdf']]
]) {
  const html = fs.readFileSync(path.join(root, 'patient', code, 'scope.html'), 'utf8');
  const links = Array.from(html.matchAll(/data-context="([^"]+)" data-route="([^"]+)"/g),
    ([, context, route]) => ({dataset: {context, route}, setAttribute(k, v) {this[k] = v;}}));
  vm.runInNewContext(selector, {
    window: {location: {pathname: '/patient/' + code + '/scope.html', search: '?asset=' + asset}},
    document: {querySelectorAll: () => links}, URLSearchParams
  });
  assert.deepEqual(links.map(l => l.href), expected);
  for (const link of links) assert(fs.existsSync(path.join(root, 'patient', code, link.href)));
}
delete global.SACTCheckProtocolContext;
console.log('Sixteen gynae context gaps resolve through a real scope page. Breast, sarcoma and selected-indication boundaries passed.');
