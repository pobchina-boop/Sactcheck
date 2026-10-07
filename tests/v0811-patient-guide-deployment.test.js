"use strict";
const assert=require("assert"),fs=require("fs"),path=require("path"),crypto=require("crypto");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const json=p=>JSON.parse(read(p));
const app=json("data/app-release.json"),pkg=json("package.json");
assert.ok(pkg.version.localeCompare("0.81.1",undefined,{numeric:true})>=0);assert.strictEqual(app.version,pkg.version);assert.strictEqual(app.release,pkg.version);
const codes=["00209","00222","00317","00318","00382","00568","00569","00619","00713","00714","00722","00831","00857"];
for(const code of codes){
 const guide=read(`patient/${code}/guide.html`),portal=read(`patient/${code}/index.html`);
 const direct=guide.includes("hcc-static-connectors"),wrapper=guide.includes('iframe src="guide.pdf"')||guide.includes('href="guide.pdf"');
 assert.ok(direct||wrapper,`${code} guide has neither deterministic anatomy nor protected-PDF wrapper`);
 assert.ok(portal.includes("hcc-static-connectors"),`${code} portal missing deterministic connector layer`);
 if(!wrapper) assert.ok(guide.includes("Important medicine-specific effects"),`${code} guide missing agent-specific toxicity section`);
 assert.ok(fs.existsSync(path.join(root,`patient/${code}/guide.pdf`)),`${code} guide PDF missing`);
 assert.strictEqual(crypto.createHash("sha256").update(fs.readFileSync(path.join(root,`patient/${code}/guide.pdf`))).digest("hex"),crypto.createHash("sha256").update(fs.readFileSync(path.join(root,`docs/patient/${code}/guide.pdf`))).digest("hex"),`${code} canonical/compat guide PDFs differ`);
}
const p568=read("patient/00568/index.html");for(const marker of ["Pembrolizumab","Pemetrexed","Carboplatin","Do not wait for the next appointment"])assert.ok(p568.includes(marker),`00568 portal missing ${marker}`);
console.log("v0.81.1 patient-guide/deployment regression checks passed under cumulative protected-PDF architecture.");
