"use strict";
const fs=require("fs");
const assert=require("assert");
const read=p=>fs.readFileSync(p,"utf8");
const html=read("index.html");
const release=read("js/sactcheck-release.js");
const patient=require("../js/patient-asset-registry-v0810.js");
const build=read("tools/build-pages-site.js");
// Exercise current direct-entry/modal behaviour instead of matching a removed helper.
require("./landing-ui-v0823.test.cjs");
const version=JSON.parse(read("package.json")).version;
assert(release.includes(`RELEASE="${version}"`),"canonical release must match package version");
assert(html.includes('Operationalising NCCP protocols at the point of care.'),"mission-led homepage missing");
assert(!html.includes('Launch SACTCheck Engine'),"legacy launch gate still visible");
for(const code of ["00209","00831"]){
  assert.equal(patient.publicUrl(code),`https://sactcheck.com/patient/${code}/`,`canonical patient route ${code} missing`);
  assert(fs.existsSync(`patient/${code}/index.html`),`source patient alias ${code} missing`);
  assert(fs.existsSync(`docs/patient/${code}/index.html`),`legacy patient route ${code} missing`);
}
assert(build.includes('"patient"'),"Pages build does not publish patient aliases");
console.log("Current homepage/routing compatibility checks passed");
