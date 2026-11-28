'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const registry = require('../js/patient-asset-registry-v0810');
const workflow = require('../js/regimen-workflow-engine-v0750');
const data = require('../data/regimen-workflow-v0750.json');
require('../js/emetogenic-risk');
const index = require('../protocols/index.json').protocols;
const protocol = code => require(path.join(root, index.find(item => item.path.includes('/' + code + '-')).path));
const rows = [
  ['00385', 'cervical_definitive', '00385a', '00385a', 'weekly_rt', 'high'],
  ['00385', 'cervical_postoperative', '00385e', '00385e', 'weekly_rt', 'high'],
  ['00419', 'cervical', '00419b', '00419-gyn', 'weekly_rt', 'moderate'],
  ['00812', 'cervical', '00812a', '00812-gyn', 'cemiplimab', 'minimal'],
  ['00455', 'cervical_maintenance', '00455j', '00455-gyn', 'maintenance', 'minimal'],
  ['00558', 'cervical_maintenance', '00558j', '00558j', 'maintenance', 'minimal']
];

const assets = {
  portal: '', guide: 'guide.pdf', passport: 'passport.pdf', 'sact-card': 'sactcard.pdf', handbook: 'handbook.pdf',
  knowledge: 'knowledge.html', longitudinal: 'treatment-journey.html', 'consent-draft': 'consent-form.html',
  'consent-pdf': 'consent-form.pdf', 'supportive-care-selector': 'supportive-care.html', 'supportive-care': 'supportive-care.pdf'
};
const selector = read('assets/patient/context-selector-v08425.js');
const fallback = read('404.html').match(/<script>([\s\S]*?)<\/script>/)[1];
function scopeChoices(code, asset, group = '') {
  const html = read('patient/' + code + '/scope.html');
  const links = [...html.matchAll(/<article([^>]*)>(.*?)<\/article>/gs)].flatMap(([, attributes, body]) => {
    const match = body.match(/data-context="([^"]+)" data-route="([^"]+)"/);
    return match ? [{other: attributes.includes('data-other-settings'), dataset: {context: match[1], route: match[2]},
      setAttribute(name, value) { this[name] = value; }}] : [];
  });
  vm.runInNewContext(selector, {
    window: {location: {pathname: '/patient/' + code + '/scope.html', search: '?asset=' + asset + group}},
    URLSearchParams, document: {querySelectorAll: key => key === '[data-other-settings]' ? links.filter(l => l.other) : links}
  });
  return links.filter(l => !l.hidden);
}
function fallbackTarget(pathname) {
  let result;
  vm.runInNewContext(fallback, {URLSearchParams, location: {pathname, search: '?from=patient', hash: '#review', replace: value => { result = value; }}});
  return result;
}
global.SACTCheckProtocolContext = {activeTumourGroup: () => 'Gynaecology'};
for (const [code, context, published, native, phase, level] of rows) {
  const base = protocol(code);
  const p = {...base, selected_indication_id: native};
  const dir = 'patient/' + code + '/' + context + '/';
  assert(registry.bundleRoutes(code).includes(code + '/' + context));
  assert.equal(registry.contextFor(base), code === '00385' ? '' : context);
  assert.equal(registry.contextFor(p), context);
  assert.equal(registry.contextFor({...base, patient_context: context}, 'all'), context);
  assert.equal(registry.contextFor({...base, patient_context: context}, 'Gynaecology'), context);
  assert.equal(registry.contextFor({...base, selected_indication: {code: published}}), context);
  assert.equal(registry.cervicalAssessmentIndication({...base, reimbursement_code: published}), native);
  assert.equal(registry.contextFor({...base, selected_indication_id: 'different-indication'}), '');
  for (const [asset, file] of Object.entries({...assets, 'antiemetic-prescription': 'antiemetic-' + phase + '.pdf'})) {
    assert.equal(registry.relativePath(p, asset), dir + file);
    assert.equal(registry.compatibilityUrl(p, asset), 'https://sactcheck.com/' + dir + file);
    assert.equal(scopeChoices(code, asset).find(l => l.dataset.context === context).href, context + '/' + file);
    const target = path.join(root, dir, file || 'index.html');
    assert(fs.existsSync(target), target);
    if(file.endsWith('.pdf')) assert.equal(fs.readFileSync(target).subarray(0, 5).toString(), '%PDF-');
  }
  const manifest = workflow.buildManifest(p, data);
  assert.equal(manifest.supportPhase.id, phase);
  assert.equal(manifest.supportiveCare.risk_level, level);
  assert.equal(global.SACTCheckEmetogenicRisk.get(p).proformaUrl, dir + 'antiemetic-' + phase + '.pdf');
  assert.equal(fallbackTarget('/docs/' + dir + 'guide.html'), '/' + dir + 'guide.pdf?from=patient#review');
  assert.equal(fallbackTarget('/docs/' + dir + 'antiemetic-' + phase + '.pdf'), '/' + dir + 'antiemetic-' + phase + '.pdf?from=patient#review');
  assert.equal(fallbackTarget('/' + dir.slice(0, -1)), '/' + dir + '?from=patient#review');
  assert.equal(fallbackTarget('/docs/' + dir + 'antiemetic-wrong-visit.pdf'), undefined);
}
assert.equal(fallbackTarget('/docs/patient/00385/cervical/guide.html'), undefined);
for(const code of ['00385','00419']) {
  assert.equal(fallbackTarget('/docs/patient/' + code + '/guide.html'), '/patient/' + code + '/scope.html?from=patient&asset=guide#review');
  assert.equal(fallbackTarget('/patient/' + code + '/consent-form.pdf'), '/patient/' + code + '/scope.html?from=patient&asset=consent-pdf#review');
  for (const file of ['scope.html','index.html']) {
    const script = read('docs/patient/' + code + '/' + file).match(/<script>([\s\S]*?)<\/script>/)[1];
    let target;
    vm.runInNewContext(script,{location: {search:'?asset=guide&group=gynaecology',hash:'#review',replace:value=>{target=value;}}});
    assert.equal(target, '/patient/' + code + '/scope.html?asset=guide&group=gynaecology#review');
  }
}

assert.equal(registry.relativePath(protocol('00385'), 'guide'), 'patient/00385/scope.html?asset=guide&group=gynaecology');
assert.deepEqual(scopeChoices('00385','guide','&group=gynaecology').map(l => l.dataset.context), ['cervical_definitive','cervical_postoperative']);
assert.deepEqual(scopeChoices('00385','guide').map(l => l.dataset.context), ['head_neck','nasopharyngeal','cervical_definitive','cervical_postoperative']);
assert.equal(workflow.buildManifest(protocol('00385'), data).supportPhase, null);
for(const [code, context, prefix] of [
  ['00385','head_neck','head_neck/'], ['00385','nasopharyngeal','nasopharyngeal/'],
  ['00419','head_neck','head_neck/'], ['00812','cutaneous-scc',''],
  ['00455','lung',''], ['00558','colorectal','colorectal/'], ['00455','melanoma_perioperative','melanoma_perioperative/']
]) assert.equal(registry.relativePath(code,'guide',context), 'patient/' + code + '/' + prefix + 'guide.pdf');
for(const code of ['00811', '00817']) {
  for(const name of ['index.html','knowledge.html','treatment-journey.html','support-maintenance.html']) {
    const html = read('patient/' + code + '/' + name);
    const section = html.match(/<section id="maintenance-options">([\s\S]*?)<\/section>/)?.[1];
    assert(section, code + '/' + name);
    assert.match(section, /href="\.\.\/00455\/cervical_maintenance\/">Pembrolizumab alone every 3 weeks/);
    assert.match(section, /href="\.\.\/00558\/cervical_maintenance\/">Pembrolizumab alone every 6 weeks/);
    assert.match(section, code === '00811' ? /bevacizumab/ : /only if your oncology team has prescribed/);
  }
}
// A deliberate tissue-specific setting choice exists for both ovarian olaparib and cervical cisplatin.
const gynae = index.filter(entry => [entry.tumour_group].flat().includes('Gynaecology'));
const archivalFiles = require('node:child_process');
const release72 = '16f504405ecf1333c2e7dbcac2c2a8ebab7ab3b1';
const archived = name => archivalFiles.execFileSync('git',['show',release72+':'+name],{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024});
const oldIndex = JSON.parse(archived('protocols/index.json')).protocols;
const oldRegistry = {URL,SACTCheckProtocolContext:global.SACTCheckProtocolContext};
vm.runInNewContext(archived('js/patient-asset-registry-v0810.js'),oldRegistry);
const published = oldIndex.filter(entry=>[entry.tumour_group].flat().includes('Gynaecology'));
assert.equal(published.length,49);
assert.equal(published.filter(entry=>[entry.tumour_group].flat()[0]==='Gynaecology').length,36);
const oldGaps = ['00203','00205','00212','00215','00226','00232','00251','00261','00279','00311','00621'];
const currentGaps = oldGaps.filter(code=>!['00251','00261','00279','00203','00212','00215','00226','00621'].includes(code));
function checkRemaining(entries,assets,load,expected) {
  const guarded=entries.map(load).filter(p=>assets.relativePath(p,'guide','Gynaecology').includes('/scope.html?')).map(p=>p.metadata.nccp_regimen_code);
  assert.deepEqual(guarded.sort(),[...expected,'00385','00588'].sort());
}
checkRemaining(published,oldRegistry.SACTCheckPatientAssets,entry=>JSON.parse(archived(entry.path)),oldGaps);
assert.equal(gynae.length,51);
assert.equal(gynae.filter(entry=>[entry.tumour_group].flat()[0]==='Gynaecology').length,38);
checkRemaining(gynae,registry,entry=>require(path.join(root,entry.path)),currentGaps);
for(const context of ['ovarian_first_line','ovarian_relapsed'])
  assert(fs.existsSync(path.join(root, registry.relativePath(protocol('00588'),'guide',context))));
delete global.SACTCheckProtocolContext;
console.log('Verified six cervical portal, print, prescription and assessment routes, guarded intent selection, legacy links and both induction handoffs.');
