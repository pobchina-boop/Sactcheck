'use strict';
// Current-source and rendered-document verification are recorded separately.
// This regression checks that the five new context services are actually wired.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const R = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(R, f));
const json = f => JSON.parse(read(f));
const registry = require('../js/patient-asset-registry-v0810.js');
const codes = ['00261', '00455', '00483', '00484', '00558'];
const routes = codes.map(c => c + '/head_neck');
const index = json('protocols/index.json').protocols;
assert.equal(json('package.json').version, '0.84.46');
assert.equal(registry.release, '0.84.46');
assert.equal(index.length, 377);
for (const route of routes) {
  const code = route.split('/')[0];
  const d = json('data/patient-knowledge-contexts/' + route + '.json');
  const p = json(index.find(x => x.path.includes('/' + code + '-')).path);
  require('./helpers/head-neck-inputs-v08446.cjs').validate(p, {allowUnchanged: true});
  assert.equal(d.protocol_id, p.protocol_id, route + ' canonical protocol');
  assert.equal(String(d.protocol_version), p.metadata.nccp_version);
  assert.equal(d.patient_context, 'head_neck');
  assert.equal(d.suite_release, '0.84.46');
  assert(d.anatomy.length >= 6, route + ' detailed anatomy');
  assert(d.chapters.length >= 9, route + ' complete patient reference');
  assert(d.monitoring_schedule.rows.length >= 3, route + ' monitoring');
  assert.equal(registry.relativePath(code, 'portal', 'head_neck'), 'patient/' + route + '/');
  assert.equal(registry.relativePath(code, 'knowledge', 'Head and Neck'), 'patient/' + route + '/knowledge.html');
  assert(registry.bundleRoutes(code).includes(route));
  const guide = read('patient/' + route + '/guide.html').toString();
  assert.equal((guide.match(/class="pt-page /g) || []).length, 3, route + ' three-page pack');
  assert(guide.includes('Full-body anatomical illustration'));
  assert(guide.includes('oncowiki-qr.png'));
  require('./helpers/patient-overview-v08445.cjs').validate(read('patient/' + route + '/index.html').toString(), route);
  for (const name of ['guide', 'sactcard', 'knowledge', 'handbook', 'passport', 'consent-form', 'supportive-care', 'treatment-journey', 'logistics']) {
    const b = read('patient/' + route + '/' + name + '.pdf');
    assert.equal(b.subarray(0, 4).toString(), '%PDF', route + ' ' + name);
    assert(b.equals(read('docs/patient/' + route + '/' + name + '.pdf')), route + ' ' + name + ' mirror');
  }
  const card = read('patient/' + route + '/sactcard.html').toString();
  for (const text of ['85.6 × 54 mm', 'Do not cut the centre line', 'EXAMPLE', 'oncowiki-qr.png', 'Add to Home Screen']) assert(card.includes(text), route + ' ' + text);
  const text = JSON.stringify(d);
  assert(!/PD-L1 TPS.*50|first-line metastatic NSCLC|adjuvant NSCLC|Breslow|platinum-sensitive ovarian/.test(text), route + ' unrelated indication contamination');
  if (code === '00261') {
    assert(/3|three/.test(d.schedule_summary));
    assert(/radiotherapy/i.test(d.schedule_summary));
    assert.equal(d.cycle_days, 21);
  } else {
    assert(/immune|immunotherapy/i.test(text));
    assert(!/fixed.*(?:12.month|one.year).*course/i.test(d.schedule_summary), route + ' no adjuvant course substitution');
  }
}
// The prior indication routes remain available independently of the additions.
for (const code of codes) assert(registry.bundleRoutes(code).includes(code));
for (const code of ['00455', '00558']) assert.equal(registry.relativePath(code, 'portal', 'colorectal'), 'patient/' + code + '/colorectal/');
for (const code of ['00455', '00558', '00483', '00484']) assert.equal(registry.relativePath(code, 'portal', 'melanoma_advanced'), 'patient/' + code + '/melanoma_advanced/');
const visibility = require('../js/library-scope-v08441.js');
assert.equal(visibility.haematologyEnabled, false);
assert.equal(index.filter(e => visibility.isHaematology(json(e.path))).length, 15);
console.log('v0.84.46: five new head-and-neck context suites, preserved existing routes, anatomy, pack, wallet and mirrored full-service PDFs verified.');
