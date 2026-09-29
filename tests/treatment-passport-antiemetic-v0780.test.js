"use strict";
const assert=require("assert");
const fs=require("fs");
const path=require("path");
const repo=path.join(__dirname,"..");
const read=p=>fs.readFileSync(path.join(repo,p),"utf8");
const json=p=>JSON.parse(read(p));

const passport=require(path.join(repo,"js/treatment-passport-card-v0780.js"));
assert.equal(passport.release,"0.78.0");
const synthetic={
  protocol_id:"nccp-00209",
  metadata:{short_title:"Modified FOLFOX-6",nccp_regimen_code:"00209",nccp_version:"10a",schedule:"Every 14 days",drugs:["Oxaliplatin","Folinic acid","5-fluorouracil"]}
};
const card=passport.html(synthetic);
assert(card.includes("Treatment Passport"),"passport title missing");
assert(card.includes("Name</b> __________________________"),"handwritten name field missing");
assert(card.includes("DOB</b> ______________"),"handwritten DOB field missing");
assert(card.includes("C1"),"cycle stamp C1 missing");
assert(card.includes("https://sactcheck.com/patient/00209/"),"public regimen route missing");
assert(card.includes("No patient information is stored in the QR"),"QR privacy statement missing");
assert(!card.includes("MRN"),"passport should not request MRN by default");
const maintenance={protocol_id:"m",metadata:{short_title:"Pembrolizumab maintenance",nccp_regimen_code:"00558",schedule:"Every 6 weeks until progression",drugs:["Pembrolizumab"]}};
const maint=passport.html(maintenance);
assert(maint.includes("M1"),"maintenance card should use M-stamps");
assert(maint.includes("Maintenance card"),"maintenance reissue cue missing");

const workflow=json("data/regimen-workflow-v0750.json");
assert.equal(workflow.release,"0.78.0");
const plans=workflow.antiemetic_plans;
const names=(items)=>items.map(x=>x.medicine);
for(const med of ["Aprepitant","Ondansetron","Dexamethasone","Olanzapine"]){
  assert(names(plans.high_standard.day1).includes(med),`HEC day-1 missing ${med}`);
}
assert(!names(plans.high_ac.subsequent).includes("Dexamethasone"),"AC branch should not carry routine post-day-1 dexamethasone");
assert(!names(plans.high_carboplatin.day1).includes("Olanzapine"),"current NCCP carboplatin special branch should not silently inherit olanzapine");
assert(names(plans.moderate.day1).includes("Ondansetron")&&names(plans.moderate.day1).includes("Dexamethasone"),"MEC current NCCP day-1 pair missing");
assert(plans.moderate.evidence_update.includes("MASCC/ESMO"),"MEC evidence reconciliation missing");
assert.equal(plans.minimal.day1.length,0,"minimal risk should not receive routine prophylaxis");

const allLocal=[...plans.high_standard.local_prescription_items,...plans.moderate.local_prescription_items,...plans.low.local_prescription_items];
const localNames=new Set(allLocal.map(x=>x.medicine));
for(const med of ["Aprepitant","Dexamethasone","Omeprazole","Nystatin","Chlorhexidine mouthwash","Cyclizine","Metoclopramide","Loperamide"]){
  assert(localNames.has(med),`CUH reference drug missing: ${med}`);
}
assert(plans.high_standard.warnings.join(" ").includes("maximum treatment duration 5 days"),"metoclopramide duration safety update missing");
assert(plans.high_standard.local_adjunct_note.includes("local mouth-care adjuncts"),"mouth-care separation missing");
for(const key of ["docetaxel","cabazitaxel","pemetrexed","temozolomide"]){assert(workflow.local_agent_proformas[key],`agent-specific local support missing: ${key}`);}
assert(names(workflow.local_agent_proformas.pemetrexed.local_prescription_items).includes("Folic acid"),"pemetrexed folic acid missing");
assert(names(workflow.local_agent_proformas.pemetrexed.local_prescription_items).includes("Vitamin B12 (hydroxocobalamin)"),"pemetrexed B12 missing");
assert(names(workflow.local_agent_proformas.temozolomide.local_prescription_items).includes("Co-trimoxazole"),"temozolomide STUPP phase-1 co-trimoxazole missing");
assert(names(workflow.local_agent_proformas.temozolomide.local_prescription_items).includes("Senna"),"temozolomide senna missing");
assert(names(workflow.local_agent_proformas.temozolomide.local_prescription_items).includes("Lactulose"),"temozolomide lactulose missing");

const risk=json("data/emetogenic-risk-map.json");
assert.equal(risk.release,"0.48.0","historical 376-regimen risk-map release must stay fixed");
assert.equal(risk.content_update_release,"0.78.0","new antiemetic content update marker missing");
assert.equal(Object.keys(risk.protocols||{}).length,376,"protocol risk classification map changed unexpectedly");

const renderer=read("js/antiemetic-card-v0780.js");
assert(renderer.includes("traffic-light")||renderer.includes("anti-dot"),"visible antiemetic traffic-light renderer missing");
assert(renderer.includes("Current NCCP antiemetic guidance"),"NCCP guidance link missing");
assert(renderer.includes("Local-reference adjuncts"),"local adjunct section missing");
const boot=read("js/study-release.js");
assert(boot.includes("treatment-passport-card-v0780.js"),"passport module not loaded by boot");
assert(boot.includes("antiemetic-card-v0780.js"),"antiemetic card module not loaded by boot");
console.log("v0.78.0 Treatment Passport + antiemetic traffic-light regression checks passed");
