"use strict";
const assert=require("assert"),fs=require("fs"),path=require("path"),crypto=require("crypto");
const root=path.resolve(__dirname,".."); const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const pkg=JSON.parse(read("package.json")),app=JSON.parse(read("data/app-release.json"));
assert.ok(pkg.version.localeCompare("0.81.6",undefined,{numeric:true})>=0);assert.strictEqual(app.version,pkg.version);assert.strictEqual(app.release,pkg.version);
const profile=JSON.parse(read("data/patient-passport-profiles-v0816.json"));
assert.strictEqual(profile.design_contract.cycle_page_rule,"One treatment cycle per page.");
assert.strictEqual(profile.design_contract.table_unit,"One symptom-grading table per treatment agent active in that cycle.");
const pass=read("patient/00568/passport.html");
for(const marker of ["Induction cycle · carboplatin included","Maintenance cycle · carboplatin stopped","Pembrolizumab","Pemetrexed","Carboplatin","Red flags override the table"]) assert.ok(pass.includes(marker),`passport missing ${marker}`);
const sheets=pass.split('<section class="suite-page suite-cycle">').slice(1);assert.equal(sheets.length,4);assert(sheets.slice(0,2).every(s=>s.includes('<h3>Carboplatin')));assert(sheets.slice(2).every(s=>!s.includes('<h3>Carboplatin')));
assert.ok(!pass.includes("<th>Cycle</th>"),"passport reverted to cycle-as-columns layout");
const portal=read("patient/00568/index.html");
assert.ok(/one cycle, one page|One cycle per page|One page per cycle/i.test(portal),"portal passport explanation missing");
assert.ok(!portal.includes("passport-preview-table"),"portal still embeds cluttered grading snapshot");
for(const f of ["passport.pdf","sactcard.pdf"]){const a=path.join(root,"patient/00568",f),b=path.join(root,"docs/patient/00568",f);assert.ok(fs.existsSync(a)&&fs.existsSync(b),`${f} missing`);assert.strictEqual(crypto.createHash("sha256").update(fs.readFileSync(a)).digest("hex"),crypto.createHash("sha256").update(fs.readFileSync(b)).digest("hex"),`${f} compatibility drift`);}
console.log("v0.81.6 cycle-per-page, agent-specific patient passport checks passed.");
