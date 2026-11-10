'use strict';
// Retain every original clinical assertion. Only the source-checked date and
// explicitly documented new HN prerequisite inputs differ from old scenarios.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const {createRequire} = require('node:module');
const m = require('./helpers/retrospective-v08446.cjs');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'validation/head-neck-v08446/clinical');
const selected = process.argv[2];
assert(['nivolumab', 'carboplatin'].includes(selected));
const sourceRelative = selected === 'nivolumab' ? 'validation/lung-nivolumab-v08427/nivo-mono/source-cases.cjs' : 'validation/endocrine-next-v08420/carboplatin/source-cases.cjs';
const source = path.join(root, sourceRelative);
const original = fs.readFileSync(source);
assert(original.equals(m.readFrozen(sourceRelative)), 'Historical source-case script must stay byte-exact');
let code = original.toString();
const amendments = [];
function replaceOnce(before, after, reason) {
  assert.equal(code.split(before).length, 2, 'Exact historical anchor: ' + before);
  code = code.replace(before, after);
  amendments.push(reason);
}
if (selected === 'nivolumab') {
  replaceOnce("assert.equal(P.metadata.source_checked_date,'2026-10-29');", "assert.equal(P.metadata.source_checked_date,'2026-11-09');require(path.join(root,'tests/helpers/head-neck-inputs-v08446.cjs')).validate(P);", 'Fresh source retrieval date only; source version and all clinical assertions retained.');
} else {
  replaceOnce(" const out={code,name,input,source};try{", " if(code==='00261'&&input.disease_context==='head_neck')input={head_neck_cisplatin_unsuitable:true,head_neck_radiotherapy_confirmed:true,target_auc:5,cycle_number:1,...input};\n const out={code,name,input,source};try{", 'Historical AUC/course cases receive explicit HN prerequisite confirmations; supplied overrides remain authoritative and current source cases independently test missing values.');
  replaceOnce("for(const p of Object.values(P))for(const r of p.rule_engine.rules){assert(coverage.has(r.id)", "for(const p of Object.values(P))for(const r of p.rule_engine.rules.filter(rule=>!rule.id.startsWith('HN46_'))){assert(coverage.has(r.id)", 'Original every-rule coverage and source-date assertion retained for original rules; new HN46 rules are covered by the current independent source-case suite.');
  const protocolPath = 'protocols/breast/00261-carboplatin-q21d.json';
  const current = JSON.parse(fs.readFileSync(path.join(root, protocolPath)));
  require('./helpers/head-neck-inputs-v08446.cjs').validate(current);
  const old = JSON.parse(m.readFrozen(protocolPath));
  assert.deepEqual(current.rule_engine.rules.filter(r => !r.id.startsWith('HN46_')).map(r => r.id), old.rule_engine.rules.map(r => r.id), 'No historical rule silently omitted');
}
const req = createRequire(source);
const originalResult = path.join(path.dirname(source), selected === 'nivolumab' ? 'integrated-results.json' : 'source-cases-integrated.json');
const originalResultBytes = fs.readFileSync(originalResult);
const destination = path.join(out, 'retained-' + selected + '-results.json');
let writes = 0;
const wrappedFs = {...fs, writeFileSync(file, data, ...args) {
  assert.equal(path.resolve(String(file)), originalResult);
  writes++;
  return fs.writeFileSync(destination, data, ...args);
}};
const scopedRequire = name => ['fs', 'node:fs'].includes(name) ? wrappedFs : req(name);
const localProcess = {...process, argv: [process.execPath, source, ...(selected === 'nivolumab' ? ['--integrated'] : ['--mode', 'integrated'])], exitCode: 0};
vm.compileFunction(code, ['require', '__dirname', 'process', 'console'], {filename: source})(scopedRequire, path.dirname(source), localProcess, {...console, log() {}});
assert.equal(writes, 1);
assert(originalResultBytes.equals(fs.readFileSync(originalResult)), 'Historical report was not rewritten');
assert(original.equals(fs.readFileSync(source)), 'Historical script was not rewritten');
const result = JSON.parse(fs.readFileSync(destination));
assert.equal(result.failed, 0, JSON.stringify((result.results || result.cases).filter(r => !r.pass)));
assert.equal(result.passed, result.total);
fs.writeFileSync(path.join(out, 'retained-' + selected + '-verification.json'), JSON.stringify({release: '0.84.46', source: sourceRelative, source_sha256: m.sha(original), prior_report_sha256: m.sha(originalResultBytes), amendments, passed: result.passed, total: result.total, historical_files_unchanged: true}, null, 2) + '\n');
console.log('v46 ' + selected + ': ' + result.passed + ' historical clinical assertions retained with explicit current-source inputs.');
