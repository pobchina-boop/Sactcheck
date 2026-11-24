'use strict';
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
const base = 'b373bf45522a1fec556eabf657daf3f72ab485c4';
const codes = new Set(['00353','00576','00655','00897','00926','00953','00588','00746','00776','00947']);
const git = (...args) => execFileSync('git', args, {cwd: root, maxBuffer: 32*1024*1024});
const read = name => fs.readFileSync(path.join(root, name));
const published = git('ls-tree', '-rz', base).toString().split('\0').filter(Boolean);
const gitBlob = data => crypto.createHash('sha1').update('blob '+data.length+'\0').update(data).digest('hex');
let files = 0;
for (const item of published) {
  const [entry, name] = item.split('\t');
  const patient = name.match(/^(?:docs\/)?patient\/(\d{5})\//);
  const protocol = name.match(/^protocols\/[^/]+\/(\d{5})-/);
  const profile = name.match(/^data\/patient-knowledge(?:-contexts)?\/(\d{5})[./]/);
  if (![patient, protocol, profile].some(match => match && codes.has(match[1])) && !name.startsWith('assets/media/')) continue;
  assert.equal(gitBlob(read(name)), entry.split(' ')[2], 'AstraZeneca publication changed: ' + name);
  files++;
}
assert(files > 300);
const oldJson = file => JSON.parse(git('show', base+':'+file));
for (const [file,key,field] of [
  ['data/clinical-validation-register-v0630.json','protocols','nccp_code'],
  ['data/nccp-change-tracker/source-register-v0620.json','records','nccp_regimen_code'],
  ['data/emetogenic-risk-map.json','protocols'],
  ['data/patient-presentation-v08431.json','routes'],
  ['data/phase-support-v0838.json','regimens'],
  ['data/regimen-workflow-v0750.json','supportive_phase_selectors'],
  ['data/regimen-workflow-v0750.json','context_supportive_phase_selectors'],
  ['data/breast-treatment-journeys-v0837.json',null]
]) {
  function select(data) {
    const group = key ? data[key] : data;
    return field ? group.filter(row => codes.has(row[field])) :
      Object.fromEntries(Object.entries(group).filter(([name]) => codes.has(name.split(/[:/]/)[0])));
  }
  assert.deepEqual(select(JSON.parse(read(file))), select(oldJson(file)), file);
}
const registry = require('../js/patient-asset-registry-v0810.js');
const registryFile = 'js/patient-asset-registry-v0810.js';
const context = {module: {exports: {}}};
vm.runInNewContext(git('show', base+':'+registryFile).toString(), context);
const previous = context.module.exports;
const fresh = require('./helpers/retrospective-v08464.cjs').NEW_ROUTES;
const routes = provider => provider.codes.flatMap(code => [...provider.bundleRoutes(code)]);
assert.deepEqual(routes(registry).slice().sort(), [...routes(previous),...fresh].sort());
for (const code of codes) {
  for (const selected of ['', 'breast','lung','prostate','ovarian_first_line','ovarian_relapsed','pancreatic','combination','unknown']) {
    for (const asset of ['guide','sactCard','passport','knowledge','handbook','consentDraft']) {
      assert.equal(registry.relativePath(code,asset,selected),previous.relativePath(code,asset,selected),[code,selected,asset].join('/'));
    }
  }
}
console.log(files+' protected AstraZeneca and media files match Git, eight shared data collections match, and every prior patient route is retained alongside the 15 sarcoma routes.');
