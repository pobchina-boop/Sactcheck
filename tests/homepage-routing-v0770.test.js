"use strict";
const fs=require("fs");
const assert=require("assert");
const read=p=>fs.readFileSync(p,"utf8");
const html=read("index.html");
const release=read("js/sactcheck-release.js");
const patient=read("js/patient-support-v0750.js");
const build=read("tools/build-pages-site.js");
const study=read("js/study-release.js");
assert(release.includes('RELEASE="0.77.0"'),"canonical release missing");
assert(html.includes('Regimen-specific oncology information pipeline'),"mission-led homepage missing");
assert(!html.includes('Launch SACTCheck Engine'),"legacy launch gate still visible");
assert(study.includes('function shouldAutoOpen() { return false; }'),"welcome modal still auto-opens");
for(const code of ["00209","00831"]){
  assert(patient.includes(`https://sactcheck.com/patient/${code}/`) || patient.includes('https://sactcheck.com/patient/${code}/'),`canonical patient route ${code} missing`);
  assert(fs.existsSync(`patient/${code}/index.html`),`source patient alias ${code} missing`);
  assert(fs.existsSync(`docs/patient/${code}/index.html`),`legacy patient route ${code} missing`);
}
assert(build.includes('"patient"'),"Pages build does not publish patient aliases");
console.log("v0.77.0 homepage/routing regression checks passed");
