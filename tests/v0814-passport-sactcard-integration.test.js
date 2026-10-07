"use strict";
const assert=require("assert"),fs=require("fs"),path=require("path"),crypto=require("crypto");
const root=path.resolve(__dirname,"..");
const app=JSON.parse(fs.readFileSync(path.join(root,"data/app-release.json"),"utf8"));const pkg=JSON.parse(fs.readFileSync(path.join(root,"package.json"),"utf8"));assert.ok(pkg.version.localeCompare("0.81.4",undefined,{numeric:true})>=0);assert.strictEqual(app.version,pkg.version);assert.strictEqual(app.release,pkg.version);
const portal=fs.readFileSync(path.join(root,"patient/00568/index.html"),"utf8");
for(const m of ["passport.html","passport.pdf","sactcard.html","sactcard.pdf"]) assert(portal.includes(m),`portal missing ${m}`);
const passport=fs.readFileSync(path.join(root,"patient/00568/passport.html"),"utf8");
for(const m of ["Shortness of breath","Grade 1","Grade 2","Grade 3","Grade 4","Fever / shivers / suddenly unwell","CTCAE v6"]) assert(passport.includes(m),`passport missing ${m}`);
assert(!passport.includes("Hormones / brain</td><td>C1"),"passport reverted to organ-first cycle grading");
const card=fs.readFileSync(path.join(root,"patient/00568/sactcard.html"),"utf8");for(const m of ["Cycle stamp tracker","C1","C4","M1","M4","087 181 9645"])assert(card.includes(m),`SACTCard missing ${m}`);
for(const f of ["passport.pdf","sactcard.pdf"]){const a=path.join(root,"patient/00568",f),b=path.join(root,"docs/patient/00568",f);assert(fs.existsSync(a)&&fs.existsSync(b),`${f} missing`);assert.strictEqual(crypto.createHash("sha256").update(fs.readFileSync(a)).digest("hex"),crypto.createHash("sha256").update(fs.readFileSync(b)).digest("hex"),`${f} compatibility drift`);}
console.log("v0.81.4 patient-first passport and SACTCard integration checks passed.");
