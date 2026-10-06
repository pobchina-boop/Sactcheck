// Historical v0.80.4 patient-content regression fixtures retained under v0.81.0.
const assert=require('assert'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.join(__dirname,'..');
const codes=["00209","00222","00317","00318","00382","00568","00569","00619","00713","00714","00722","00831","00857"];
const workflow=fs.readFileSync(path.join(root,'js','regimen-workflow-engine-v0750.js'),'utf8');
assert.ok(workflow.includes('const WORKFLOW_DATA_RELEASE="0.78.0"'),'workflow data release must remain independent from app release');
assert.ok(workflow.includes('payload?.release!==WORKFLOW_DATA_RELEASE'),'workflow validates its data contract');
const patient=fs.readFileSync(path.join(root,'js','patient-support-v0750.js'),'utf8');
assert.ok(patient.includes('registry?.hasDedicated?.(protocol)'),'dedicated patient assets must override dynamic rendering');
const study=fs.readFileSync(path.join(root,'js','study-release.js'),'utf8');
assert.ok(!study.includes('function loadScript('),'study-release must not dynamically reload clinical UI modules');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const file of ['patient-asset-registry-v0810.js','patient-support-v0750.js','regimen-workflow-engine-v0750.js','treatment-passport-card-v0780.js','antiemetic-card-v0780.js','sactcheck-interface-v0750.js','ui-stability-v0810.js','antiemetic-print-v0810.js']) assert.ok(index.includes(file),`${file} missing from stable bootstrap`);
assert.ok(index.indexOf('patient-asset-registry-v0810.js')<index.indexOf('patient-support-v0750.js'),'asset registry must load before patient support');
assert.ok(index.indexOf('sactcheck-interface-v0750.js')<index.indexOf('protocol-loader.js'),'interface must install before regimen cards are loaded');
function sha(p){return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');}
for(const code of codes){
  const d=path.join(root,'patient',code);
  for(const f of ['index.html','guide.html','guide.pdf','passport.pdf']) assert.ok(fs.existsSync(path.join(d,f)),`patient/${code}/${f} missing`);
  const html=fs.readFileSync(path.join(d,'index.html'),'utf8');
  assert.ok(html.includes('anatomy-hcc-v0762.png'),`patient/${code} lost approved anatomy visual`);
  assert.ok(html.includes('hcc-visual-stage'),`patient/${code} lost rich anatomy layout`);
  assert.ok(html.includes(`https://sactcheck.com/patient/${code}/`),`patient/${code} canonical route missing`);
  assert.ok(fs.statSync(path.join(d,'guide.pdf')).size>500000,`patient/${code}/guide.pdf lost embedded anatomy artwork`);
  assert.ok(fs.statSync(path.join(d,'passport.pdf')).size>30000,`patient/${code}/passport.pdf appears downgraded`);
  const compat=path.join(root,'docs','patient',code);
  assert.ok(fs.readFileSync(path.join(compat,'index.html'),'utf8').includes(`https://sactcheck.com/patient/${code}/`),`compatibility route ${code} must redirect to canonical portal`);
  assert.strictEqual(sha(path.join(d,'guide.pdf')),sha(path.join(compat,'guide.pdf')),`compatibility guide PDF drift for ${code}`);
  assert.strictEqual(sha(path.join(d,'passport.pdf')),sha(path.join(compat,'passport.pdf')),`compatibility passport PDF drift for ${code}`);
}
const p568=fs.readFileSync(path.join(root,'patient','00568','index.html'),'utf8');
for(const marker of ['Pembrolizumab','Pemetrexed / carboplatin','hcc-visual-stage','Hormones / brain','Blood / infection']) assert.ok(p568.includes(marker),`00568 approved anatomy marker missing: ${marker}`);
console.log(`v0.80.4 protected patient-content fixtures retained for ${codes.length} canonical portals under the v0.81.0 architecture.`);
