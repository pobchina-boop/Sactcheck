const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const context = { console };
context.globalThis = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'js', 'rule-engine.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'js', 'assessment-engine.js'), 'utf8'), context);
const Engine = context.SACTCheckAssessmentEngine;

const pldCarbo = JSON.parse(fs.readFileSync(path.join(root, 'protocols/gynaecology/00624-carboplatin-pegylated-liposomal-doxorubicin.json'), 'utf8'));
const normalAnc = Engine.assess(pldCarbo, { anc: '2.0' });
assert.equal(normalAnc.actionType, 'proceed_with_caution', 'PLD/carboplatin ANC alone should produce an assessed-domain result.');
assert(normalAnc.findings.some(item => item.domainAssessment && item.conditionFields.includes('anc')), 'PLD/carboplatin normal ANC lacks a visible partial-domain finding.');
assert(!/insufficient data/i.test(normalAnc.status), 'Normal ANC still returns the former generic insufficient-data status.');
assert(normalAnc.recommendation.includes('not an overall proceed decision'), 'Partial normal result must not clear the whole regimen.');

const lowAnc = Engine.assess(pldCarbo, { anc: '0.8' });
assert.notEqual(lowAnc.actionType, 'proceed_with_caution', 'Low ANC must retain the restrictive encoded action.');
assert(lowAnc.findings.some(item => item.ruleId === 'GRADE4_NEUTROPENIA'), 'Low ANC no longer triggers the PLD/carboplatin haematology rule.');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const current = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(current) : [current];
  });
}
function protocolFiles() {
  return walk(path.join(root, 'protocols')).filter(file => file.endsWith('.json') && !['index.json','protocol-schema.json','package.json'].includes(path.basename(file)));
}
function demoValue(definition) {
  if (definition.demo_value !== undefined && definition.demo_value !== null) return String(definition.demo_value);
  if (definition.type === 'select') return String(definition.options?.[0]?.value ?? '');
  if (definition.type === 'boolean') return 'false';
  if (definition.type === 'number') return String(definition.min !== undefined && Number(definition.min) > 0 ? definition.min : 0);
  return 'test';
}

let auditedProtocols = 0;
let auditedFields = 0;
for (const file of protocolFiles()) {
  const protocol = JSON.parse(fs.readFileSync(file, 'utf8'));
  const code = String(protocol?.metadata?.nccp_regimen_code || '');
  if (!code || code === '00000') continue;
  const profileId = Engine.getProfiles(protocol)[0]?.id || 'default';
  const definitions = Engine.getInputDefinitions(protocol, profileId, {});
  const ruleFields = new Set((protocol.rule_engine?.rules || []).flatMap(rule => context.SACTCheckRuleEngine.collectConditionFields(context.SACTCheckRuleEngine.conditionFromRule(rule))));
  const candidates = definitions.filter(def => def.visible !== false && ruleFields.has(def.id) && demoValue(def) !== '');
  assert(candidates.length, `${code} has no testable single-entry rule input.`);
  for (const candidate of candidates) {
    const result = Engine.assess(protocol, { [candidate.id]: demoValue(candidate) }, { profileId });
    assert(result.findings.length > 0, `${code}/${candidate.id} produced no meaningful partial finding.`);
    assert.notEqual(result.status, 'Partial assessment — insufficient data for an action', `${code}/${candidate.id} returned the obsolete generic partial status.`);
    auditedFields += 1;
  }
  auditedProtocols += 1;
}
assert(auditedProtocols >= 121, `Expected to audit at least 121 regimens, audited ${auditedProtocols}.`);
assert(auditedFields >= 500, `Expected broad single-field coverage, audited only ${auditedFields} fields.`);

const aliasContext = { globalThis: null };
aliasContext.globalThis = aliasContext;
vm.createContext(aliasContext);
vm.runInContext(fs.readFileSync(path.join(root, 'js', 'drug-aliases.js'), 'utf8'), aliasContext);
const Aliases = aliasContext.SACTCheckDrugAliases;
assert(Aliases.forProtocol(pldCarbo).includes('Caelyx'), 'PLD/carboplatin does not expose Caelyx.');
assert(Aliases.forProtocol(pldCarbo).includes('PLD'), 'PLD/carboplatin does not expose the PLD abbreviation.');
assert(!Aliases.forProtocol(pldCarbo).includes('Adriamycin'), 'PLD must not be mislabeled as conventional Adriamycin.');
const enhertu = JSON.parse(fs.readFileSync(path.join(root, 'protocols/breast/00776-trastuzumab-deruxtecan.json'), 'utf8'));
assert(Aliases.forProtocol(enhertu).includes('Enhertu'), 'Trastuzumab deruxtecan does not expose Enhertu.');
const phesgo = JSON.parse(fs.readFileSync(path.join(root, 'protocols/breast/00785-phesgo-maintenance.json'), 'utf8'));
assert(!Aliases.forProtocol(phesgo).includes('Herceptin'), 'Phesgo should not be displayed as Herceptin.');

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const loader = fs.readFileSync(path.join(root, 'js', 'protocol-loader.js'), 'utf8');
assert(html.includes('Version 0.37.2 · Tissue UI + automatic ULN'), 'v0.37.2 badge is missing.');
assert(html.includes('js/drug-aliases.js?v=0.37.2'), 'Alias registry is not loaded with the current cache key.');
assert(loader.includes('Common / trade names:'), 'Catalogue cards do not display common/trade names.');
assert(loader.includes('aliases.join(" ")'), 'Trade names are not added to catalogue search text.');

console.log(`v0.37.2 single-entry and alias tests passed across ${auditedProtocols} regimens and ${auditedFields} visible rule inputs.`);
