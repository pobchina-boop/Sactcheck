"use strict";
const assert=require('assert'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const json=p=>JSON.parse(read(p));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');

const pkg=json('package.json'),app=json('data/app-release.json');
assert.strictEqual(pkg.version,'0.81.0');
assert.strictEqual(app.version,pkg.version);
assert.strictEqual(app.release,pkg.version,'app-release.release must remain a version, not a prose label');
assert.strictEqual(app.knowledge_module_release,'0.68.0');
assert.strictEqual(app.validation_module_release,'0.68.0');

const registry=require('../js/patient-asset-registry-v0810.js');
assert.strictEqual(registry.release,'0.81.0');
assert.strictEqual(registry.codes.length,13);
assert.strictEqual(registry.publicUrl('00568','portal'),'https://sactcheck.com/patient/00568/');
assert.strictEqual(registry.publicUrl('00568','guide'),'https://sactcheck.com/patient/00568/guide.pdf');
assert.strictEqual(registry.publicUrl('00568','passport'),'https://sactcheck.com/patient/00568/passport.pdf');
assert.ok(registry.definitionFor('00831').contactCard);

// User-journey assertion: a dedicated Patient guide action opens the canonical static PDF,
// not the legacy about:blank renderer.
let opened='';
global.location={href:'http://127.0.0.1:5500/index.html'};
global.open=(url)=>{opened=url;return {opener:null};};
global.SACTCheckPatientAssets=registry;
const patient=require('../js/patient-support-v0750.js');
const p568={protocol_id:'nccp-00568-v5',metadata:{nccp_regimen_code:'00568'}};
patient.openPrintablePassport(p568,{},{});
assert.strictEqual(opened,'http://127.0.0.1:5500/patient/00568/guide.pdf');
assert.ok(!opened.includes('about:blank'));

const patientSrc=read('js/patient-support-v0750.js');
assert.ok(patientSrc.indexOf('registry?.hasDedicated?.(protocol)')<patientSrc.indexOf('root.open?.("about:blank"'),'dedicated guard must precede legacy renderer');
assert.ok(patientSrc.includes('return registry.openGuide(live);'),'auto-PDF path must resolve dedicated guide before loading dynamic content');
const workflow=read('js/regimen-workflow-engine-v0750.js');
assert.ok(!workflow.includes('DEDICATED_PATIENT_PIPELINES'),'workflow must not own a second patient-route registry');
assert.ok(workflow.includes('root.SACTCheckPatientAssets'),'workflow must use canonical patient registry');
assert.ok(workflow.includes('registry.openPassport(protocol)'),'dedicated workflow passport must open protected static PDF');
assert.ok(workflow.includes('const WORKFLOW_DATA_RELEASE="0.78.0"'),'workflow data contract must remain independent from public app release');

const index=read('index.html');
const order=[
  'sactcheck-release.js?app=0.81.0',
  'runtime-performance-v0810.js?app=0.81.0',
  'patient-asset-registry-v0810.js?app=0.81.0',
  'patient-support-v0750.js?app=0.81.0',
  'regimen-workflow-engine-v0750.js?app=0.81.0',
  'sactcheck-interface-v0750.js?app=0.81.0',
  'ui-stability-v0810.js?app=0.81.0',
  'antiemetic-print-v0810.js?app=0.81.0',
  'protocol-loader.js?v=0.59.0&app=0.81.0'
];
let last=-1;for(const token of order){const pos=index.indexOf(token);assert.ok(pos>last,`bootstrap order invalid at ${token}`);last=pos;}
assert.ok(!index.includes('ui-stability-v0804.js?app=0.81.0'));
assert.ok(!index.includes('antiemetic-print-v0804.js?app=0.81.0'));
assert.ok(!read('js/study-release.js').includes('function loadScript('),'study layer must not perform a second runtime bootstrap');

const perf=read('js/runtime-performance-v0810.js');
for(const marker of ['CACHE_NAME','inFlight','PREFETCH_CONCURRENCY=16','root.fetch=cachedFetch','warmProtocolCache','sactcheck:protocol-cache-warmed']) assert.ok(perf.includes(marker),`runtime performance guard missing ${marker}`);
const anti=read('js/antiemetic-print-v0810.js');
assert.ok(anti.includes('openSupportivePdf'),'traffic light must open regimen-derived printable prescribing support');
assert.ok(anti.includes('stopImmediatePropagation'),'traffic light action must own the click instead of falling through to older dropdown handlers');

const protectedManifest=json('data/protected-patient-assets-v0810.json');
assert.deepStrictEqual(Object.keys(protectedManifest.assets).sort(),registry.codes.slice().sort());
for(const code of registry.codes){
  for(const file of ['index.html','guide.pdf','passport.pdf']){
    const rel=`patient/${code}/${file}`;
    assert.ok(fs.existsSync(path.join(root,rel)),`${rel} missing`);
    const expected=protectedManifest.assets[code][file];
    assert.strictEqual(sha(rel),expected.sha256,`${rel} changed without updating the protected-asset manifest`);
    assert.strictEqual(fs.statSync(path.join(root,rel)).size,expected.bytes,`${rel} size drift`);
  }
  assert.ok(read(`docs/patient/${code}/index.html`).includes(`https://sactcheck.com/patient/${code}/`),`legacy docs route ${code} must redirect to canonical portal`);
  assert.strictEqual(sha(`docs/patient/${code}/guide.pdf`),sha(`patient/${code}/guide.pdf`),`legacy guide copy drift for ${code}`);
  assert.strictEqual(sha(`docs/patient/${code}/passport.pdf`),sha(`patient/${code}/passport.pdf`),`legacy passport copy drift for ${code}`);
}
const p568html=read('patient/00568/index.html');
for(const marker of ['hcc-visual-stage','Pembrolizumab','Pemetrexed / carboplatin','Hormones / brain','Blood / infection']) assert.ok(p568html.includes(marker),`00568 protected anatomy marker missing: ${marker}`);
assert.ok(fs.statSync(path.join(root,'patient/00568/guide.pdf')).size>800000,'00568 rich guide unexpectedly downgraded');

const notFound=read('404.html');for(const code of registry.codes)assert.ok(notFound.includes(code),`404 compatibility routing missing ${code}`);

console.log('v0.81.0 architecture consolidation gate passed: one patient registry, direct protected guides/passports, stable bootstrap, cached protocol startup and 13 protected patient pipelines.');
