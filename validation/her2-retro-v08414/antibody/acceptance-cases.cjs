#!/usr/bin/env node
'use strict';

// Independent, source-derived scenario checks. These do not confer clinical approval.
// Run from any directory. --baseline loads both protocols and engine from the audited commit.
// Optional --output <filename> writes a compact result beside this script.
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const Module = require('module');
const audit = JSON.parse(fs.readFileSync(path.join(__dirname, 'source-audit.json'), 'utf8'));
const root = path.resolve(__dirname, '../../..');
const baseline = process.argv.includes('--baseline');
const outputIndex = process.argv.indexOf('--output');
const outputName = outputIndex < 0 ? null : process.argv[outputIndex + 1];
if (outputIndex >= 0 && (!outputName || path.basename(outputName) !== outputName)) {
  throw new Error('--output must be a filename within the antibody audit folder');
}
const read = relative => baseline
  ? cp.execFileSync('git', ['show', `${audit.baseline_commit}:${relative}`], { cwd: root, encoding: 'utf8' })
  : fs.readFileSync(path.join(root, relative), 'utf8');
let engine;
if (baseline) {
  const filename = path.join(root, 'js/assessment-engine.js');
  const mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  mod._compile(read('js/assessment-engine.js'), filename);
  engine = mod.exports;
} else {
  engine = require(path.join(root, 'js/assessment-engine.js'));
}
const files = {
  '00200': 'protocols/breast/00200-trastuzumab-iv-q21d.json',
  '00201': 'protocols/breast/00201-trastuzumab-iv-weekly.json',
  '00726': 'protocols/breast/00726-pertuzumab-trastuzumab-maintenance.json'
};
const protocols = Object.fromEntries(Object.entries(files).map(([code, file]) => [code, JSON.parse(read(file))]));
const results = [];
for (const test of audit.acceptance_cases) {
  const result = engine.assess(protocols[test.code], test.inputs);
  const findings = (result.findings || []).filter(finding => !finding.domainAssessment);
  const ruleIds = findings.map(finding => finding.ruleId);
  const prose = findings.map(finding => `${finding.explanation || ''} ${finding.action?.recommendation || ''}`).join('\n');
  const failures = [];
  if ((result.errors || []).length) failures.push(`engine errors: ${JSON.stringify(result.errors)}`);
  if ((result.invalid || []).length) failures.push(`invalid input: ${JSON.stringify(result.invalid)}`);
  if (test.expect.actions && !test.expect.actions.includes(result.actionType)) {
    failures.push(`action ${result.actionType}, expected ${test.expect.actions.join(' or ')}`);
  }
  for (const rule of test.expect.forbid_rules || []) {
    if (ruleIds.includes(rule)) failures.push(`unexpected rule ${rule}`);
  }
  for (const action of test.expect.forbid_actions || []) {
    if (result.actionType === action || findings.some(finding => finding.actionType === action)) {
      failures.push(`unexpected action ${action}`);
    }
  }
  for (const key of ['text', 'text2']) {
    if (test.expect[key] && !new RegExp(test.expect[key], 'i').test(prose)) failures.push(`missing recommendation matching ${test.expect[key]}`);
  }
  results.push({ id: test.id, pass: failures.length === 0, action: result.actionType, matched_rules: ruleIds, failures });
}

function check(id, condition, detail) {
  results.push({ id, pass: Boolean(condition), failures: condition ? [] : [detail] });
}
for (const [field, expected] of Object.entries(audit.proposed_changes['00201'].metadata_patch)) {
  const actual = protocols['00201'].metadata[field];
  check(`00201-metadata-${field}`, String(actual) === String(expected), `${field}: ${JSON.stringify(actual)}; expected ${JSON.stringify(expected)}`);
}
check('00200-indication-codes', JSON.stringify(protocols['00200'].indications.map(i => i.code).sort()) === JSON.stringify(['00200a', '00200b']), 'Expected distinct metastatic 00200a and early 00200b records');
check('00201-indication-code', protocols['00201'].indications.length === 1 && protocols['00201'].indications[0].code === '00201a', 'Weekly monotherapy must identify 00201a');
check('00201-indication-description', protocols['00201'].indications.every(i => /metastatic/i.test(i.description) && !/21 days|early breast/i.test(i.description)), 'Weekly indication must describe metastatic disease without inherited q21/early context');
for (const code of audit.scope) {
  const validation = protocols[code].metadata.validation;
  check(`${code}-clinical-approval-separate`, validation?.clinical_use_authorised === false, 'Source/software checks cannot confer independent clinical authorisation');
}
const failed = results.filter(result => !result.pass);
const report = {
  checked_at: new Date().toISOString(),
  mode: baseline ? 'audited-baseline' : 'working-tree',
  baseline_commit: audit.baseline_commit,
  clinical_use_authorised: false,
  engine_scenarios: audit.acceptance_cases.length,
  total_checks: results.length,
  passed: results.length - failed.length,
  failed: failed.length,
  results
};
if (outputName) fs.writeFileSync(path.join(__dirname, outputName), JSON.stringify(report, null, 2) + '\n');
console.log(`${report.mode}: ${report.passed}/${report.total_checks} passed (${report.engine_scenarios} clinical-engine scenarios plus metadata/governance checks)`);
for (const result of failed) console.log(`FAIL ${result.id}: ${result.failures.join('; ')}`);
process.exitCode = failed.length ? 1 : 0;
