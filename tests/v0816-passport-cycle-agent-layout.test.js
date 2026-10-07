"use strict";
const assert=require("assert"),fs=require("fs"),path=require("path"),crypto=require("crypto");
const root=path.resolve(__dirname,".."); const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const pkg=JSON.parse(read("package.json")),app=JSON.parse(read("data/app-release.json"));
assert.strictEqual(pkg.version,"0.81.6");assert.strictEqual(app.version,pkg.version);assert.strictEqual(app.release,pkg.version);
const profile=JSON.parse(read("data/patient-passport-profiles-v0816.json"));
assert.strictEqual(profile.design_contract.cycle_page_rule,"One treatment cycle per page.");
assert.strictEqual(profile.design_contract.table_unit,"One symptom-grading table per treatment agent active in that cycle.");
const pass=read("patient/00568/passport.html");
for(const marker of ["C1 · one cycle, one page","C4 · one cycle, one page","M1 · one cycle, one page","M4 · one cycle, one page","Pembrolizumab · immunotherapy","Pemetrexed · chemotherapy","Carboplatin · chemotherapy","Grade 0 · none","Grade 4 · emergency","Shortness of breath","Mouth soreness / ulcers","Numbness / tingling","Red flags override the grading table"]) assert.ok(pass.includes(marker),`passport missing ${marker}`);
assert.ok(!pass.includes("<th>Cycle</th>"),"passport reverted to cycle-as-columns layout");
const portal=read("patient/00568/index.html");
assert.ok(portal.includes("One page for each cycle"),"portal passport explanation missing");
assert.ok(!portal.includes("passport-preview-table"),"portal still embeds cluttered grading snapshot");
for(const f of ["passport.pdf","sactcard.pdf"]){const a=path.join(root,"patient/00568",f),b=path.join(root,"docs/patient/00568",f);assert.ok(fs.existsSync(a)&&fs.existsSync(b),`${f} missing`);assert.strictEqual(crypto.createHash("sha256").update(fs.readFileSync(a)).digest("hex"),crypto.createHash("sha256").update(fs.readFileSync(b)).digest("hex"),`${f} compatibility drift`);}
console.log("v0.81.6 cycle-per-page, agent-specific patient passport checks passed.");
