const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');
const root = path.join(__dirname, '..');

const ui = fs.readFileSync(path.join(root, 'js', 'generic-assessment-ui.js'), 'utf8');
const loader = fs.readFileSync(path.join(root, 'js', 'protocol-loader.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const riskMap = JSON.parse(fs.readFileSync(path.join(root, 'data', 'emetogenic-risk-map.json'), 'utf8'));
const protocolIndex = JSON.parse(fs.readFileSync(path.join(root, 'protocols', 'index.json'), 'utf8'));
const rows = Array.isArray(protocolIndex) ? protocolIndex : protocolIndex.protocols;

assert(ui.includes('id="jsonBloodInputGrid"'), 'Blood threshold grid missing');
assert(ui.indexOf('id="jsonBloodInputGrid"') < ui.indexOf('id="jsonTreatmentContextSection"'), 'Blood thresholds must appear before treatment context');
assert(ui.includes('BLOOD_FIELD_PRIORITIES'), 'Blood threshold priority logic missing');
assert(ui.includes('compact-assessment-input'), 'Compact optional input controls missing');
assert(ui.includes('Not assessed'), 'Compact controls must expose a Not assessed state');
assert(ui.includes('coverage-gap-details'), 'Unassessed result domains must collapse into a clickable summary');
assert(ui.includes('<form id="jsonAssessmentForm" novalidate>'), 'Form-level browser validation must be disabled');
assert(!ui.includes(' requiredAttribute'), 'UI should not create required HTML attributes');
assert(ui.includes('control.required = false'), 'Dynamic inputs must remain non-mandatory');
assert(indexHtml.includes('js/emetogenic-risk.js?v='), 'Emetogenic risk module not loaded');
assert(indexHtml.indexOf('js/emetogenic-risk.js') < indexHtml.indexOf('js/protocol-loader.js'), 'Emetogenic risk module must load before protocol loader');
assert(loader.includes('emetogenicBadge(protocol)'), 'Protocol cards must render emetogenic status');

const activeCodes = [];
for (const row of rows.filter(row => row.enabled !== false)) {
  const protocol = JSON.parse(fs.readFileSync(path.join(root, row.path), 'utf8'));
  const code = String(protocol.metadata?.nccp_regimen_code || protocol.protocol_id || row.id);
  if (!activeCodes.includes(code)) activeCodes.push(code);
}
assert.strictEqual(Object.keys(riskMap.protocols).length, activeCodes.length, 'Risk map must cover each active protocol');
for (const code of activeCodes) {
  assert(riskMap.protocols[code], `Missing emetogenic map entry for ${code}`);
  const mapped = { '00776':'high', '00605':'low', '00785':'low', '00796':'low', '00797':'low', '00798':'low' };
  const expected = mapped[code] || 'pending';
  assert.strictEqual(riskMap.protocols[code].level, expected, `Unexpected emetogenic mapping for ${code}`);
}

const context = { console };
context.globalThis = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'js', 'rule-engine.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'js', 'assessment-engine.js'), 'utf8'), context);
const tchp = JSON.parse(fs.readFileSync(path.join(root, 'protocols', 'breast', '00722-tchp-docetaxel-carboplatin-trastuzumab-pertuzumab.json'), 'utf8'));
const result = context.SACTCheckAssessmentEngine.assess(tchp, { anc: '0.8' });
assert.strictEqual(result.missing.length, 0, 'Single-value assessment must not be blocked by missing context');
assert(result.findings.length > 0, 'Single ANC value should evaluate an encoded rule');

console.log('v0.33 early breast expansion with rapid threshold comparison tests passed.');
