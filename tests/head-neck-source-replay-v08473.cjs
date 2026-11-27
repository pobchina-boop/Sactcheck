'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname,'..');
const revision = 'a47e75b2765fdb10f5795152c0866f016aceb14e';
const directory = 'validation/head-neck-v08446/clinical';
const report = directory+'/source-case-results.json';
const source = directory+'/source-cases.cjs';
const index = directory+'/sources/index.json';
const archived = file => execFileSync('git',['show',revision+':'+file],{cwd:root,maxBuffer:16*1024*1024});
const read = file => fs.readFileSync(path.join(root,file));
const evidence = process.env.SACT_REGRESSION_REPORT_DIR;
if(evidence) fs.mkdirSync(evidence,{recursive:true});
const work = fs.mkdtempSync(path.join(os.tmpdir(),'sactcheck-head-neck-replay-'));

function replay(name) {
  const workspace = path.join(work,name);
  const write = (file,bytes) => {
    const target = path.join(workspace,file);
    fs.mkdirSync(path.dirname(target),{recursive:true});
    fs.writeFileSync(target,bytes);
  };
  write(source,archived(source));
  write(index,archived(index));
  if(name==='historical') {
    for(const entry of JSON.parse(archived(index))) write(entry.path,archived(entry.path));
    for(const module of ['assessment-engine','protocol-dose-schedule','protocol-validator','rule-engine','endocrine-context-v0844']) {
      const file='js/'+module+'.js';
      write(file,archived(file));
    }
  } else {
    for(const dir of ['protocols','js']) fs.symlinkSync(path.join(root,dir),path.join(workspace,dir),'dir');
  }
  execFileSync(process.execPath,[path.join(workspace,source)],{cwd:workspace});
  const bytes=fs.readFileSync(path.join(workspace,report));
  const result=JSON.parse(bytes);
  assert.equal(result.total,386);
  assert.equal(result.passed,result.total);
  assert.deepEqual(result.failed,[]);
  return {bytes,result};
}

try {
  for(const file of [source,index,report]) assert.deepEqual(read(file),archived(file),file+' published bytes');
  const historical=replay('historical');
  assert.deepEqual(historical.bytes,archived(report),'Exact November 2026 v46 case outcomes');
  const current=replay('current');
  const changedCases=new Set(['HN cisplatin suitability true','HN AUC 5','HN cycle 2','HN cycle 3','Breast cycle4 AUC6 not HN']);
  const target='PARTIAL_TARGET_AUC_NO_RESTRICTION', indication='PARTIAL_INDICATION_ID_NO_RESTRICTION';
  // The v73 indication conflict check changes the display order of two partial-input
  // notices. Inputs, actions and every clinical finding still have to match.
  const expected=structuredClone(historical.result);
  for(const row of expected.cases) {
    if(row.code!=='00261' || !changedCases.delete(row.name)) continue;
    const at=row.actual.ids.indexOf(target);
    assert(at >= 0 && row.actual.ids[at+1]===indication,row.name);
    row.actual.ids.splice(at,2,indication,target);
  }
  assert.equal(changedCases.size,0);
  assert.deepEqual(current.result,expected,'Current outcomes and ordered findings');
  assert.deepEqual(read(report),historical.bytes,'The published report was preserved');
  if(evidence) {
    const destination=fs.mkdtempSync(path.join(evidence,'head-neck-v08446-'));
    fs.writeFileSync(path.join(destination,'historical.json'),historical.bytes);
    fs.writeFileSync(path.join(destination,'current.json'),current.bytes);
  }
  console.log('386 archived head-and-neck cases and 386 current cases passed; the published evidence is byte-identical.');
} finally {
  fs.rmSync(work,{recursive:true,force:true});
}
