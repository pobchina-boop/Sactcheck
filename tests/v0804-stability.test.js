const assert=require('assert'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const codes=["00209", "00222", "00317", "00318", "00382", "00568", "00569", "00619", "00713", "00714", "00722", "00831", "00857"];
const workflow=fs.readFileSync(path.join(root,'js','regimen-workflow-engine-v0750.js'),'utf8');
assert.ok(workflow.includes('const WORKFLOW_DATA_RELEASE="0.78.0"'),'workflow data release must be independent from app release');
assert.ok(workflow.includes('payload?.release!==WORKFLOW_DATA_RELEASE'),'workflow must validate the workflow-data contract, not the public app version');
for(const code of codes) assert.ok(workflow.includes(`"${code}":"patient/${code}/"`),`canonical workflow route missing for ${code}`);
const patient=fs.readFileSync(path.join(root,'js','patient-support-v0750.js'),'utf8');
assert.ok(patient.includes('root.SACTCHECK_RELEASE||"0.78.0"'),'patient module fallback must preserve its historical unit-test contract');
assert.ok(patient.includes('https://sactcheck.com/patient/${code}/'),'patient links must use canonical public routes');
const study=fs.readFileSync(path.join(root,'js','study-release.js'),'utf8');
assert.ok(!study.includes('function loadScript('),'study-release must not dynamically reload clinical UI modules');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const file of ['patient-support-v0750.js','regimen-workflow-engine-v0750.js','treatment-passport-card-v0780.js','antiemetic-card-v0780.js','sactcheck-interface-v0750.js','ui-stability-v0804.js','antiemetic-print-v0804.js']) assert.ok(index.includes(file),`${file} missing from stable bootstrap`);
assert.ok(index.indexOf('sactcheck-interface-v0750.js')<index.indexOf('protocol-loader.js'),'interface must install before regimen cards are loaded');
assert.ok(fs.readFileSync(path.join(root,'js','antiemetic-print-v0804.js'),'utf8').includes('openSupportivePdf'),'traffic light must open the printable antiemetic script');
for(const code of codes){for(const base of ['patient','docs/patient']){const d=path.join(root,base,code);for(const f of ['index.html','guide.html','guide.pdf','passport.pdf'])assert.ok(fs.existsSync(path.join(d,f)),`${base}/${code}/${f} missing`);const html=fs.readFileSync(path.join(d,'index.html'),'utf8');assert.ok(html.includes('anatomy-hcc-v0762.png'),`${base}/${code} lost anatomy format`);assert.ok(html.includes('hcc-visual-stage'),`${base}/${code} lost rich anatomy layout`);assert.ok(html.includes(`https://sactcheck.com/patient/${code}/`),`${base}/${code} canonical route missing`);assert.ok(fs.statSync(path.join(d,'guide.pdf')).size>500000,`${base}/${code}/guide.pdf lost embedded anatomy artwork`);assert.ok(fs.statSync(path.join(d,'passport.pdf')).size>30000,`${base}/${code}/passport.pdf appears downgraded`);}}

const protectedMarkers={
 '00209':['HOME PUMP','Oxaliplatin'],
 '00382':['Trifluridine','oral chemotherapy'],
 '00568':['Pembrolizumab','Pemetrexed / carboplatin'],
 '00619':['Abemaciclib','endocrine'],
 '00722':['HER2','Docetaxel / carboplatin'],
 '00831':['Atezolizumab','Bevacizumab'],
 '00857':['Pembrolizumab','paclitaxel']
};
for(const [code,markers] of Object.entries(protectedMarkers)){const html=fs.readFileSync(path.join(root,'patient',code,'index.html'),'utf8');for(const marker of markers)assert.ok(html.toLowerCase().includes(marker.toLowerCase()),`${code} protected visual/content marker missing: ${marker}`);}

const p568=fs.readFileSync(path.join(root,'patient','00568','index.html'),'utf8');for(const marker of ['Pembrolizumab','Pemetrexed / carboplatin','hcc-visual-stage','Hormones / brain','Blood / infection'])assert.ok(p568.includes(marker),`00568 approved anatomy marker missing: ${marker}`);
console.log(`v0.80.4 stability gate passed: ${codes.length} patient portals, fixed workflow-data contract, stable card bootstrap and printable antiemetic action.`);
