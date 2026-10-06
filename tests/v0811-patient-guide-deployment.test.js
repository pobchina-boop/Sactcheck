"use strict";
const assert=require("assert"),fs=require("fs"),path=require("path"),crypto=require("crypto");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const json=p=>JSON.parse(read(p));
const app=json("data/app-release.json"),pkg=json("package.json");
assert.strictEqual(pkg.version,"0.81.1");assert.strictEqual(app.version,"0.81.1");assert.strictEqual(app.release,"0.81.1");
const codes=["00209","00222","00317","00318","00382","00568","00569","00619","00713","00714","00722","00831","00857"];
for(const code of codes){
 const guide=read(`patient/${code}/guide.html`);
 assert.ok(guide.includes("hcc-static-connectors"),`${code} guide missing deterministic connector layer`);
 assert.ok(guide.includes("Important medicine-specific effects"),`${code} guide missing agent-specific toxicity section`);
 assert.ok(guide.includes(`qr-${code}-v0811.png`),`${code} guide is not using high-resolution v0.81.1 QR asset`);
 assert.ok(guide.includes(`https://sactcheck.com/patient/${code}/`),`${code} guide QR destination is not canonical`);
 const portal=read(`patient/${code}/index.html`);
 assert.ok(portal.includes("hcc-static-connectors"),`${code} portal missing deterministic connector layer`);
 assert.ok(fs.existsSync(path.join(root,`patient/${code}/guide.pdf`)),`${code} guide PDF missing`);
 assert.strictEqual(crypto.createHash("sha256").update(fs.readFileSync(path.join(root,`patient/${code}/guide.pdf`))).digest("hex"),crypto.createHash("sha256").update(fs.readFileSync(path.join(root,`docs/patient/${code}/guide.pdf`))).digest("hex"),`${code} canonical/compat guide PDFs differ`);
}
const g568=read("patient/00568/guide.html");
for(const marker of ["Pembrolizumab - immune effects","Pemetrexed","Carboplatin","When to call - do not wait for the next appointment"])assert.ok(g568.includes(marker),`00568 distilled guide missing ${marker}`);
const old=read("tests/search-first-v0570.test.js");assert.ok(old.includes("patient-asset-registry-v0810.js"),"v0.57 regression must test central patient registry after v0.81 consolidation");assert.ok(!old.includes("patientSupport.includes('https://sactcheck.com/patient/${code}/')"),"stale v0.57 patient-support route assertion remains");
console.log("v0.81.1 patient-guide/deployment hotfix checks passed for all 13 dedicated portals.");
