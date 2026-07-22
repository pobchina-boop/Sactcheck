const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const map = JSON.parse(fs.readFileSync(path.join(root, 'data', 'emetogenic-risk-map.json'), 'utf8'));
const resolver = fs.readFileSync(path.join(root, 'js', 'emetogenic-risk.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
if (pkg.version.localeCompare('0.36.7', undefined, { numeric: true }) < 0) throw new Error('package version predates 0.36.7');
for (const test of ['breast-remediation-v0365.test.js','breast-remediation-v0366.test.js','technical-consolidation-v0367.test.js']) {
  if (!pkg.scripts.test.includes(test)) throw new Error(`${test} missing from default npm test`);
}
for (const id of ['generic-high-cuh-v2-05-21','generic-moderate-cuh','generic-low-cuh-v2-05-21']) {
  if (!map.scripts[id]) throw new Error(`supportive script ${id} missing`);
}
for (const level of ['high','moderate','low']) if (!map.levels[level].default_script_id) throw new Error(`${level} default script missing`);
for (const id of ['generic-high-cuh-v2-05-21','generic-low-cuh-v2-05-21']) {
  const url = map.scripts[id].url;
  if (!url || !fs.existsSync(path.join(root, url))) throw new Error(`${id} PDF path broken`);
}
if (!['document_not_supplied','available_local_document'].includes(map.scripts['generic-moderate-cuh'].status)) throw new Error('moderate script status invalid');
if (map.scripts['generic-moderate-cuh'].status === 'available_local_document') { const url=map.scripts['generic-moderate-cuh'].url; if (!url || !fs.existsSync(path.join(root,url))) throw new Error('moderate supportive PDF path broken'); }
if (!resolver.includes('supportive.script_id') || !resolver.includes('levelDefinition.default_script_id')) throw new Error('central supportive-care resolution hierarchy missing');
if (!html.includes('healthPlaceholders') || !html.includes('healthSupportiveMapped')) throw new Error('health dashboard consolidation metrics missing');
console.log('v0.36.7 technical consolidation tests passed');
