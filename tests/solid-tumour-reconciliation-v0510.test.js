const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const APP_RELEASE = '0.55.0';
const RECONCILIATION_RELEASE = '0.51.0';
const CHECK_DATE = '2026-07-29';
const HSE_HOSTS = new Set(['healthservice.hse.ie', 'assets.hse.ie', 'www.hse.ie']);

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}
function protocolGroups(protocol) {
  const metadata = protocol.metadata || {};
  const values = [];
  const add = item => {
    if (item !== undefined && item !== null && item !== '' && !values.includes(item)) values.push(item);
  };
  if (Array.isArray(metadata.tumour_group)) metadata.tumour_group.forEach(add);
  else add(metadata.tumour_group);
  (metadata.tumour_groups || []).forEach(add);
  return values;
}
function isHaematology(protocol) {
  return protocolGroups(protocol).some(group => /haemato|haematology/i.test(String(group)));
}
function code(protocol) {
  return String(protocol?.metadata?.nccp_regimen_code || '').padStart(5, '0');
}
function duplicateValues(values) {
  const counts = new Map();
  for (const value of values.filter(Boolean)) counts.set(value, (counts.get(value) || 0) + 1);
  return [...counts.entries()].filter(([, count]) => count > 1);
}
function conditionFromRule(rule) {
  if (rule.when) return rule.when;
  if (rule.all) return { all: rule.all };
  if (rule.any) return { any: rule.any };
  if (rule.none) return { none: rule.none };
  if (rule.not) return { not: rule.not };
  if (rule.field) return { field: rule.field, operator: rule.operator, value: rule.value };
  return null;
}
function conditionLeaves(node, output = []) {
  if (!node) return output;
  if (Array.isArray(node)) {
    node.forEach(item => conditionLeaves(item, output));
    return output;
  }
  if (typeof node !== 'object') return output;
  if (node.field) output.push(node);
  for (const key of ['all', 'any', 'none', 'not']) {
    if (node[key]) conditionLeaves(node[key], output);
  }
  return output;
}
function demoValue(definition) {
  if (definition.demo_value !== undefined && definition.demo_value !== null) return String(definition.demo_value);
  if (definition.type === 'select') {
    const option = (definition.options || []).find(item => item && item.value !== undefined && item.value !== '');
    return option ? String(option.value) : '';
  }
  if (definition.type === 'boolean') return 'false';
  if (definition.type === 'number') {
    if (definition.min !== undefined && Number.isFinite(Number(definition.min))) return String(definition.min);
    return '1';
  }
  return 'test';
}

const pkg = readJson('package.json');
const catalogue = readJson('protocols/index.json');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert.equal(pkg.version, APP_RELEASE, 'package.json version is not v0.55.0.');
assert(html.includes('<title>SACTCheck v0.55.0 — Global Clinical Scenario Interpreter</title>'), 'Current release title is missing.');
assert(html.includes('<span class="header-version">v0.55.0</span>'), 'Current header version is missing.');
assert(html.includes('v0.55.0 · What changed?'), 'Current release summary is missing.');
assert(html.includes('js/protocol-loader.js?v=0.51.0'), 'Protocol-loader cache key is stale.');
assert.equal(catalogue.protocols.length, 376, 'Expected 376 indexed protocols.');
assert.equal(catalogue.protocol_count, 376, 'Catalogue protocol_count is not 376.');

const loaded = catalogue.protocols.map(entry => ({
  entry,
  protocol: readJson(entry.path)
}));
const solid = loaded.filter(item => !isHaematology(item.protocol));
const haem = loaded.filter(item => isHaematology(item.protocol));
assert.equal(solid.length, 361, 'Expected 361 Solid Tumour protocols.');
assert.equal(haem.length, 15, 'Expected 15 Haematology protocols.');

assert.equal(duplicateValues(solid.map(item => item.entry.id)).length, 0, 'Duplicate Solid Tumour index IDs found.');
assert.equal(duplicateValues(solid.map(item => item.entry.path)).length, 0, 'Duplicate Solid Tumour index paths found.');
assert.equal(duplicateValues(solid.map(item => item.protocol.protocol_id)).length, 0, 'Duplicate Solid Tumour protocol IDs found.');
assert.equal(duplicateValues(solid.map(item => code(item.protocol))).length, 0, 'Duplicate Solid Tumour NCCP codes found.');
assert.equal(duplicateValues(solid.map(item => item.protocol.metadata?.source_url)).length, 0, 'Duplicate Solid Tumour source URLs found.');
assert(!fs.existsSync(path.join(root, 'protocols', 'protocols')), 'Stale nested protocols/protocols directory remains.');

let inputCount = 0;
let ruleCount = 0;
for (const { entry, protocol } of solid) {
  const protocolCode = code(protocol);
  const metadata = protocol.metadata || {};
  assert.equal(entry.id, protocol.protocol_id, `${protocolCode}: index ID and protocol_id differ.`);
  assert(fs.existsSync(path.join(root, entry.path)), `${protocolCode}: indexed protocol file is missing.`);
  assert(metadata.source_url, `${protocolCode}: official source URL is missing.`);
  const source = new URL(metadata.source_url);
  assert.equal(source.protocol, 'https:', `${protocolCode}: source URL is not HTTPS.`);
  assert(HSE_HOSTS.has(source.hostname), `${protocolCode}: source URL is not on an approved HSE host.`);
  assert(metadata.nccp_version, `${protocolCode}: source version is missing.`);
  assert(!/^(current|latest|unknown|tbc)$/i.test(String(metadata.nccp_version)), `${protocolCode}: source version remains unspecified.`);
  assert.deepEqual(protocol.required_inputs || [], [], `${protocolCode}: top-level required_inputs must be empty.`);
  for (const profile of protocol.assessment_profiles || []) {
    assert.deepEqual(profile.required_inputs || [], [], `${protocolCode}/${profile.id}: profile required_inputs must be empty.`);
  }
  for (const [phase, required] of Object.entries(protocol.required_inputs_by_phase || {})) {
    assert.deepEqual(required || [], [], `${protocolCode}/${phase}: phase required_inputs must be empty.`);
  }
  for (const [field, definition] of Object.entries(protocol.input_definitions || {})) {
    assert.notEqual(definition.required, true, `${protocolCode}/${field}: static required flag remains true.`);
  }
  assert.equal(metadata.partial_assessment_supported, true, `${protocolCode}: partial-assessment flag is missing.`);
  assert(/entered value is assessed independently/i.test(metadata.partial_assessment_policy || ''), `${protocolCode}: partial-assessment policy is missing.`);
  assert.equal(metadata.catalogue_reconciliation?.release, RECONCILIATION_RELEASE, `${protocolCode}: reconciliation release metadata is missing.`);
  assert.equal(metadata.catalogue_reconciliation?.checked_date, CHECK_DATE, `${protocolCode}: reconciliation date metadata is missing.`);
  assert.equal(metadata.catalogue_reconciliation?.clinical_use_authorised, false, `${protocolCode}: reconciliation must not authorise clinical use.`);
  assert.notEqual(metadata.validation?.clinical_use_authorised, true, `${protocolCode}: protocol is incorrectly marked authorised.`);
  inputCount += Object.keys(protocol.input_definitions || {}).length;
  ruleCount += (protocol.rule_engine?.rules || []).length;
}
assert.equal(inputCount, 5879, 'Solid Tumour input count changed unexpectedly.');
assert.equal(ruleCount, 5577, 'Solid Tumour rule count changed unexpectedly.');

const expectedSourceResolutions = {
  '00200': { version: '8', published: '2014-02-10', review: '2021-07-21', url: 'https://healthservice.hse.ie/documents/6330/200_Trastuzumab_21days_Ubeecpc.pdf' },
  '00206': { version: '5', published: '2015-10-01', review: '2021-07-28', url: 'https://healthservice.hse.ie/documents/6547/206_Trastuzumab_Emtansine_21days.pdf' },
  '00217': { version: '7', published: '2015-01-11', review: '2031-04-21', url: 'https://healthservice.hse.ie/documents/6559/217_Lapatinib_and_Capecitabine_therapy.pdf' },
  '00253': { version: '6', published: '2014-11-01', review: '2030-12-19', url: 'https://healthservice.hse.ie/documents/6357/253_Tamoxifen_Monotherapy.pdf' },
  '00262': { version: '8', published: '2015-04-29', review: '2021-05-12', url: 'https://healthservice.hse.ie/documents/6367/262_EC90.pdf' },
  '00263': { version: '7', published: '2015-04-29', review: '2021-05-12', url: 'https://healthservice.hse.ie/documents/6368/263_EC75.pdf' },
  '00361': { version: '4', published: '2016-11-11', review: '2031-01-20', url: 'https://healthservice.hse.ie/documents/6816/361_Fulvestrant_Therapy.pdf' },
  '00371': { version: '4', published: '2016-11-11', review: '2031-02-23', url: 'https://healthservice.hse.ie/documents/6817/371_Letrozole_.pdf' },
  '00376': { version: '4', published: '2016-11-11', review: '2031-01-20', url: 'https://healthservice.hse.ie/documents/6568/376_Exemestane_therapy.pdf' },
  '00423': { version: '5', published: '2017-07-07', review: '2021-06-23', url: 'https://healthservice.hse.ie/documents/6823/423_DOXO_DOCEtaxel_AT_50_75-21day.pdf' },
  '00619': { version: '4a', published: '2024-05-31', review: '2030-08-11', url: 'https://healthservice.hse.ie/documents/6415/619_Abemaciclib.pdf' },
  '00936': { version: '1', published: '2026-02-18', review: '2027-02-18', url: 'https://healthservice.hse.ie/documents/8391/936_Tucatinib_Regimen.pdf' }
};
for (const [protocolCode, expected] of Object.entries(expectedSourceResolutions)) {
  const match = solid.find(item => code(item.protocol) === protocolCode);
  assert(match, `${protocolCode}: expected source-resolution protocol is absent.`);
  const metadata = match.protocol.metadata;
  assert.equal(String(metadata.nccp_version), expected.version, `${protocolCode}: source version mismatch.`);
  assert.equal(metadata.published_date, expected.published, `${protocolCode}: publication date mismatch.`);
  assert.equal(metadata.review_date || metadata.last_reviewed_date, expected.review, `${protocolCode}: review date mismatch.`);
  assert.equal(metadata.source_url, expected.url, `${protocolCode}: source URL mismatch.`);
  assert.equal(metadata.source_version_verified, true, `${protocolCode}: source version is not marked verified.`);
  assert.equal(metadata.source_version_verified_date, CHECK_DATE, `${protocolCode}: source verification date mismatch.`);
}

const context = { console };
context.globalThis = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'js', 'rule-engine.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'js', 'assessment-engine.js'), 'utf8'), context);
const RuleEngine = context.SACTCheckRuleEngine;
const AssessmentEngine = context.SACTCheckAssessmentEngine;

let singleValueProtocols = 0;
let singleValueFields = 0;
for (const { protocol } of solid) {
  const protocolCode = code(protocol);
  const conditionFields = new Set((protocol.rule_engine?.rules || []).flatMap(rule =>
    RuleEngine.collectConditionFields(RuleEngine.conditionFromRule(rule))
  ));
  let protocolPassed = false;
  for (const profile of AssessmentEngine.getProfiles(protocol)) {
    const definitions = AssessmentEngine.getInputDefinitions(protocol, profile.id, {});
    for (const definition of definitions) {
      const value = demoValue(definition);
      if (definition.visible === false || !conditionFields.has(definition.id) || value === '') continue;
      const result = AssessmentEngine.assess(protocol, { [definition.id]: value }, { profileId: profile.id });
      assert(Array.isArray(result.findings), `${protocolCode}/${definition.id}: findings are missing.`);
      if (result.findings.length > 0) {
        assert(!/insufficient data for an action/i.test(result.status || ''), `${protocolCode}/${definition.id}: obsolete generic partial status returned.`);
        protocolPassed = true;
        singleValueFields += 1;
        break;
      }
    }
    if (protocolPassed) break;
  }
  assert(protocolPassed, `${protocolCode}: no rule-linked field produced a meaningful single-value assessment.`);
  singleValueProtocols += 1;
}
assert.equal(singleValueProtocols, 361, 'Single-value assessment did not cover all 361 Solid Tumour protocols.');

let numericBoundaryLeaves = 0;
const epsilonFor = value => Math.max(1e-9, Math.abs(value) * 1e-9);
for (const { protocol } of solid) {
  const protocolCode = code(protocol);
  for (const rule of protocol.rule_engine?.rules || []) {
    for (const leaf of conditionLeaves(conditionFromRule(rule))) {
      const operator = String(leaf.operator || '==').toLowerCase();
      if (!['<', '<=', '>', '>=', '==', '=', 'eq', 'equals'].includes(operator)) continue;
      const threshold = Number(leaf.value);
      const isOrderedComparator = ['<', '<=', '>', '>='].includes(operator);
      if (!Number.isFinite(threshold)) {
        assert(!isOrderedComparator, `${protocolCode}/${rule.id || 'rule'}/${leaf.field}: ordered comparator has a non-numeric threshold.`);
        continue;
      }
      const epsilon = epsilonFor(threshold);
      const evaluate = actual => RuleEngine.evaluateCondition({ field: leaf.field, operator: leaf.operator, value: threshold }, { [leaf.field]: actual }).state;
      if (['>', 'gt'].includes(operator)) {
        assert.equal(evaluate(threshold), false, `${protocolCode}/${leaf.field}: strict > boundary is incorrect.`);
        assert.equal(evaluate(threshold + epsilon), true, `${protocolCode}/${leaf.field}: > threshold does not trigger above boundary.`);
      } else if (['>=', 'gte'].includes(operator)) {
        assert.equal(evaluate(threshold), true, `${protocolCode}/${leaf.field}: >= threshold does not include boundary.`);
        assert.equal(evaluate(threshold - epsilon), false, `${protocolCode}/${leaf.field}: >= threshold triggers below boundary.`);
      } else if (['<', 'lt'].includes(operator)) {
        assert.equal(evaluate(threshold), false, `${protocolCode}/${leaf.field}: strict < boundary is incorrect.`);
        assert.equal(evaluate(threshold - epsilon), true, `${protocolCode}/${leaf.field}: < threshold does not trigger below boundary.`);
      } else if (['<=', 'lte'].includes(operator)) {
        assert.equal(evaluate(threshold), true, `${protocolCode}/${leaf.field}: <= threshold does not include boundary.`);
        assert.equal(evaluate(threshold + epsilon), false, `${protocolCode}/${leaf.field}: <= threshold triggers above boundary.`);
      } else {
        assert.equal(evaluate(threshold), true, `${protocolCode}/${leaf.field}: equality boundary is incorrect.`);
      }
      numericBoundaryLeaves += 1;
    }
  }
}
assert(numericBoundaryLeaves >= 4000, `Expected at least 4,000 numeric condition leaves, audited ${numericBoundaryLeaves}.`);

execFileSync(process.execPath, [path.join(root, 'tools', 'reconcile-solid-tumour-library.js')], { cwd: root, stdio: 'pipe' });
const report = readJson('V0510_SOLID_TUMOUR_RECONCILIATION.json');
assert.equal(report.pass, true, 'Generated reconciliation report does not pass.');
assert.equal(report.hard_failure_count, 0, 'Generated reconciliation report contains hard findings.');
assert.equal(report.counts.solid_tumour_protocols, 361, 'Generated report Solid Tumour count is wrong.');
assert.equal(report.counts.haematology_protocols, 15, 'Generated report Haematology count is wrong.');
assert.equal(report.counts.primary_storage_groups['Cross-listed/shared'], 5, 'Shared-protocol storage count is wrong.');
assert.equal(report.counts.tumour_site_coverage.Breast, 82, 'Breast site-coverage count is wrong.');
assert.equal(report.counts.tumour_site_coverage.Gastrointestinal, 93, 'GI site-coverage count is wrong.');

console.log(`v0.51.0 Solid Tumour reconciliation passed: 361 protocols, ${inputCount} inputs, ${ruleCount} rules, ${singleValueProtocols} single-value protocol checks and ${numericBoundaryLeaves} numeric boundary leaves.`);
