const fs=require('fs');
const path=require('path');
const assert=require('assert');
const root=path.resolve(__dirname,'..');
const support=fs.readFileSync(path.join(root,'js','patient-support-v0750.js'),'utf8');
const release=fs.readFileSync(path.join(root,'js','sactcheck-release.js'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const codes=['00209','00382','00568','00619','00722','00831','00857'];
assert.ok(support.includes('https://sactcheck.com/patient/${code}/'),'Canonical /patient/ route generator missing.');
assert.ok(!support.includes('return `https://sactcheck.com/docs/patient/${code}/`;'),'Dedicated routes must not generate /docs/patient/ URLs.');
assert.ok(release.includes('const RELEASE="0.80.3"'),'Canonical release is not v0.80.3.');
assert.ok(index.includes('SACTCheck v0.80.3'),'Index visible release is not v0.80.3.');
for(const code of codes){
  for(const base of ['patient','docs/patient']){
    for(const f of ['index.html','guide.pdf','passport.pdf']){
      assert.ok(fs.existsSync(path.join(root,base,code,f)),`${base}/${code}/${f} missing`);
    }
  }
}
const p568=fs.readFileSync(path.join(root,'patient','00568','index.html'),'utf8');
for(const phrase of ['Pembrolizumab - immune effects','Pemetrexed','Carboplatin + chemotherapy','Kidney toxicity','Low blood counts / infection']) assert.ok(p568.includes(phrase),`00568 missing ${phrase}`);
console.log('v0.80.3 canonical patient routing and seven-portal anatomy checks passed.');
