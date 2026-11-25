'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {archived} = require('./helpers/archived-sarcoma-candidates.cjs');
const root = path.resolve(__dirname,'..');
const codes = ['00391','00392','00596','00680','00675','00747','00754'];
const temp = fs.mkdtempSync(path.join(os.tmpdir(),'sarcoma-products-'));
try {
  const profiles = path.join(temp,'protocols');
  fs.mkdirSync(profiles);
  for (const code of codes) {
    const dir = path.join(root,'protocols/sarcoma');
    const names = fs.readdirSync(dir).filter(name => name.startsWith(code+'-'));
    assert.equal(names.length,1);
    fs.copyFileSync(path.join(dir,names[0]),path.join(profiles,names[0]));
  }
  const script = path.join(temp,'independent-product-cases.cjs');
  fs.writeFileSync(script,archived('validation/sarcoma-v08462/ifosfamide-product/review/independent-product-cases.cjs'));
  execFileSync(process.execPath,[script,'--current'],{cwd:root,stdio:'inherit',env:{...process.env,
    SACTCHECK_ROOT:root,SACTCHECK_IFOS_DRAFT_ROOT:profiles}});
  const result=JSON.parse(fs.readFileSync(path.join(temp,'current-results.json')));
  assert.equal(result.total,347);
  assert.equal(result.passed,347);
  assert.equal(result.failed,0);
} finally {
  fs.rmSync(temp,{recursive:true,force:true});
}
