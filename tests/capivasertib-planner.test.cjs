'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, 'patient/00947', file), 'utf8');
const protocol = require('../protocols/breast/00947-capivasertib-fulvestrant.json');
const data = require('../data/regimen-workflow-v0750.json');
const workflow = require('../js/regimen-workflow-engine-v0750.js');
const manifest = workflow.buildManifest(protocol, data);
assert.equal(manifest.extravasation.status, 'intramuscular');
assert.deepEqual(manifest.extravasation.emergencySteps, []);
assert(manifest.interactionOverrides.some(rule => rule.id === 'capivasertib_cyp3a4_review'));
assert(!workflow.interactionOverrides(protocol, data, ['fulvestrant']).some(rule => rule.id === 'capivasertib_cyp3a4_review'));
const mixed = structuredClone(protocol);
mixed.treatment_phases[0].administration.push({drug: 'paclitaxel', route: 'IV'});
assert.notEqual(workflow.resolveExtravasation(mixed, data).status, 'intramuscular');

const portal = read('index.html');
assert.equal(portal.split('href="first-cycle.html"').length, 2);
const profile = require('../data/patient-knowledge/00947.json');
const publish = require('../tools/patient-publication-v08444.cjs').decorateGenerated;
assert.equal(publish('patient/00947/index.html', portal, root), portal, 'Canonical publication reproduces the review portal');
const generated = require('../tools/patient-overview-v08445.cjs').buildOverview(portal, {root, route: '00947', profile});
assert.equal(generated.split('href="first-cycle.html"').length, 2);
for (const [slug, visits] of [['first-cycle', [1, 15]], ['later-cycles', [1]]]) {
  const html = read(slug + '.html');
  assert(html.includes('href="' + slug + '.html" aria-current="page"'));
  const cells = Array.from(html.matchAll(/<li class="(on|off)"><strong><small>Day <\/small>(\d+)<\/strong>(.*?)<\/li>/gs));
  assert.deepEqual(cells.map(cell => Number(cell[2])), Array.from({length: 28}, (_, i) => i + 1));
  assert.deepEqual(cells.filter(cell => cell[1] === 'on').map(cell => +cell[2]), [1,2,3,4,8,9,10,11,15,16,17,18,22,23,24,25]);
  assert.deepEqual(cells.filter(cell => cell[3].includes('Injection')).map(cell => +cell[2]), visits);
  for (const suffix of ['.pdf', '-pack.pdf']) {
    const name = slug + suffix;
    assert(html.includes('href="' + name + '" download'));
    assert.deepEqual(fs.readFileSync(path.join(root, 'patient/00947', name)), fs.readFileSync(path.join(root, 'docs/patient/00947', name)));
  }
}
for (const page of ['symptom-plan', 'glucose-record']) {
  assert(portal.includes('href="' + page + '.html"'));
  assert(generated.includes('href="' + page + '.html"'));
  assert(read(page + '.html').includes('href="' + page + '.pdf" download'));
}
for (const name of ['symptom-plan.pdf', 'glucose-record.pdf', 'handbook.pdf']) {
  assert.deepEqual(fs.readFileSync(path.join(root, 'patient/00947', name)), fs.readFileSync(path.join(root, 'docs/patient/00947', name)));
}
assert(read('symptom-plan.html').includes('112 or 999'));
assert(read('glucose-record.html').includes('mmol/L'));
console.log('Both 28-day calendars, injection visits, published links, PDF mirrors and scoped clinician checks passed.');
