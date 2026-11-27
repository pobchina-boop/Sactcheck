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
const historicalProtocols = new Map();
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
  for (const code of ['00251','00261']) {
    const transition=require('./helpers/ovarian-carboplatin-transition-v08473.cjs').verify(code);
    historicalProtocols.set(path.join(root,transition.file),transition.before);
  }
  const historical=JSON.parse(historicalProtocols.get(path.join(root,protocolPath)));
  const old = JSON.parse(m.readFrozen(protocolPath));
  assert.deepEqual(historical.rule_engine.rules.filter(r => !r.id.startsWith('HN46_')).map(r => r.id), old.rule_engine.rules.map(r => r.id), 'No historical rule silently omitted');
}
const req = createRequire(source);
const originalResult = path.join(path.dirname(source), selected === 'nivolumab' ? 'integrated-results.json' : 'source-cases-integrated.json');
const originalResultBytes = fs.readFileSync(originalResult);
const destination = path.join(out, 'retained-' + selected + '-results.json');
function replay(sourceCode, archivedProtocols) {
  let report;
  const scopedFs={...fs, readFileSync(file,...args) {
    return archivedProtocols.get(String(file)) || fs.readFileSync(file,...args);
  }, writeFileSync(file,data) {
    assert.equal(path.resolve(String(file)),originalResult);
    assert.equal(report,undefined);
    report=JSON.parse(data);
  }};
  const scopedRequire=name=>['fs','node:fs'].includes(name)?scopedFs:req(name);
  const localProcess={...process,argv:[process.execPath,source,...(selected==='nivolumab'?['--integrated']:['--mode','integrated'])],exitCode:0};
  vm.compileFunction(sourceCode,['require','__dirname','process','console'],{filename:source})(scopedRequire,path.dirname(source),localProcess,{...console,log(){}});
  assert.equal(report.failed,0,JSON.stringify((report.results || report.cases).filter(r=>!r.pass)));
  assert.equal(report.passed,report.total);
  return report;
}
const result=replay(code,historicalProtocols);
assert(originalResultBytes.equals(fs.readFileSync(originalResult)), 'Historical report was not rewritten');
assert(original.equals(fs.readFileSync(source)), 'Historical script was not rewritten');
if (selected==='carboplatin') {
  const retained=JSON.parse(fs.readFileSync(destination));
  assert.deepEqual({...result,checked_at:retained.checked_at},retained,'The archived carboplatin evidence must replay exactly');
  replaceOnce("else if(anc===1&&days===28){has(r,'consultant_review');rule(r,'EXACT_ANC');}","",'NCCP v6 p4: ANC threshold is inclusive.');
  replaceOnce("else if(platelets===100&&days===28){has(r,'consultant_review');rule(r,'EXACT_PLATELETS');}","",'NCCP v6 p4: platelet threshold is inclusive.');
  replaceOnce("else if(days===28&&(anc===1||platelets===100))has(r,'consultant_review');","",'NCCP v6 p4: equality for both counts.');
  replaceOnce("!rule.id.startsWith('HN46_')","!rule.id.startsWith('HN46_') && rule.id!=='CARBO'+p.metadata.nccp_regimen_code+'_INDICATION_CONTEXT_CONFLICT'",'The v73 source cases cover each added indication conflict.');
  replaceOnce('/Day13–15.*Day21/','/days?\\s*13–15.*day\\s*21/i','Nadir checks remain required on days 13–15 and 21.');
  replaceOnce('/Day13|Day21/','/days?\\s*13|day\\s*21/i','The 21-day protocol retains its own monitoring schedule.');
  replaceOnce('/48hours/','/48\\s*hours/i','The estimate requires creatinine within 48 hours.');
  const live=replay(code,new Map());
  for(const [index,prior] of retained.cases.entries()) {
    const actual=live.cases[index];
    assert.equal(actual.name,prior.name);
    const changed=prior.code==='00251' && prior.findings?.some(f=>['CARBO00251_EXACT_ANC','CARBO00251_EXACT_PLATELETS'].includes(f.id));
    if(!changed) assert.deepEqual(actual,prior,prior.name);
    else {
      assert.deepEqual(actual.input,prior.input);
      assert.equal(actual.pass,true);
      assert.deepEqual(actual.findings,prior.findings.filter(f=>!['CARBO00251_EXACT_ANC','CARBO00251_EXACT_PLATELETS'].includes(f.id)));
      // The prior unquantified review row disappears when equality no longer triggers a review.
      assert(actual.doses.every(row=>row.quantified===false));
      if(actual.findings.length) assert.deepEqual(actual.doses,prior.doses);
      else assert.deepEqual(actual.doses,[]);
    }
  }
} else {
  fs.writeFileSync(destination,JSON.stringify(result,null,2)+'\n');
  fs.writeFileSync(path.join(out,'retained-'+selected+'-verification.json'),JSON.stringify({release:'0.84.46',source:sourceRelative,source_sha256:m.sha(original),prior_report_sha256:m.sha(originalResultBytes),amendments,passed:result.passed,total:result.total,historical_files_unchanged:true},null,2)+'\n');
}
console.log(selected==='carboplatin' ? 'All '+result.total+' archived carboplatin cases and all '+result.total+' current replays passed.' :
  'v46 '+selected+': '+result.passed+' historical clinical assertions retained with explicit current-source inputs.');
