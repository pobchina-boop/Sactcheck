"use strict";
const assert=require("assert"),fs=require("fs"),path=require("path"),crypto=require("crypto");
const root=path.resolve(__dirname,"..");
const app=JSON.parse(fs.readFileSync(path.join(root,"data/app-release.json"),"utf8"));
assert.strictEqual(app.version,"0.81.3"); assert.strictEqual(app.release,app.version);
const portal=fs.readFileSync(path.join(root,"patient/00568/index.html"),"utf8");
assert(portal.includes("sactcard.pdf")); assert(portal.includes("passport.pdf")); assert(portal.includes("Open patient portal online"));
const registry=require(path.join(root,"js/patient-asset-registry-v0810.js"));
assert.strictEqual(registry.relativePath("00568","sact-card"),"patient/00568/sactcard.pdf");
for(const f of ["guide.pdf","passport.pdf","sactcard.pdf"]){assert(fs.existsSync(path.join(root,"patient/00568",f)));assert(fs.statSync(path.join(root,"patient/00568",f)).size>10000);assert.strictEqual(crypto.createHash("sha256").update(fs.readFileSync(path.join(root,"patient/00568",f))).digest("hex"),crypto.createHash("sha256").update(fs.readFileSync(path.join(root,"docs/patient/00568",f))).digest("hex"));}
const guideHtml=fs.readFileSync(path.join(root,"patient/00568/guide.html"),"utf8"); assert(guideHtml.includes("guide.pdf"));
console.log("v0.81.3 patient experience checks passed");
