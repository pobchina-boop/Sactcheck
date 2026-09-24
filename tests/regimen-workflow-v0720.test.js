"use strict";
const assert=require("assert");
const fs=require("fs");
const path=require("path");
const Engine=require("../js/regimen-workflow-engine-v0720.js");
const data=JSON.parse(fs.readFileSync(path.join(__dirname,"..","data","regimen-workflow-v0720.json"),"utf8"));

assert.strictEqual(Engine.release,"0.72.0");
assert.strictEqual(data.release,"0.72.0");

const folfox={
  protocol_id:"folfox",
  metadata:{nccp_regimen_code:"00209",title:"Modified FOLFOX-6"},
  treatment_phases:[{cycle_length_days:14,administration:[
    {day:1,drug:"oxaliplatin",route:"IV"},
    {day:1,drug:"fluorouracil",route:"IV"}
  ]}]
};
let manifest=Engine.buildManifest(folfox,data,{level:"moderate",label:"Moderate emetogenic potential"});
assert.strictEqual(manifest.supportiveCare.planId,"moderate");
assert.ok(manifest.supportiveCare.day1.some(x=>x.medicine==="Ondansetron"));
assert.ok(manifest.extravasation.agents.some(x=>x.key==="oxaliplatin"&&x.compress==="Warm"));
assert.ok(manifest.extravasation.agents.some(x=>x.key==="fluorouracil"&&x.compress==="Cold"));

const ac={
  protocol_id:"ac",
  metadata:{title:"AC"},
  treatment_phases:[{administration:[
    {day:1,drug:"doxorubicin",route:"IV"},
    {day:1,drug:"cyclophosphamide",route:"IV"}
  ]}]
};
manifest=Engine.buildManifest(ac,data,{level:"high",label:"High emetogenic potential"});
assert.strictEqual(manifest.supportiveCare.planId,"high_ac");
assert.ok(!manifest.supportiveCare.subsequent.some(x=>x.medicine==="Dexamethasone"),
  "AC pathway should use the NCCP high-risk AC subsequent-day table.");

const erlotinib={
  protocol_id:"erlotinib",
  metadata:{title:"Erlotinib"},
  treatment_phases:[{administration:[{day:1,drug:"erlotinib",route:"oral"}]}]
};
manifest=Engine.buildManifest(erlotinib,data,{level:"oral_minimal_low",label:"Oral SACT"});
assert.ok(manifest.interactionOverrides.some(x=>x.id==="erlotinib_acid_suppression"));
assert.strictEqual(manifest.extravasation.agents.length,0,"Oral-only medicines must not generate extravasation actions.");

const paclitaxel={
  protocol_id:"taxane",
  metadata:{title:"Paclitaxel"},
  treatment_phases:[{administration:[{day:1,drug:"paclitaxel",route:"IV"}]}]
};
manifest=Engine.buildManifest(paclitaxel,data,{level:"low",label:"Low emetogenic potential"});
const pac=manifest.extravasation.agents.find(x=>x.key==="paclitaxel");
assert(pac);
assert.strictEqual(pac.classId,"vesicant_non_dna");
assert.strictEqual(pac.compress,"Warm");
assert.ok(/Hyaluronidase/i.test(pac.antidote));

const phase=Engine.chooseAntiemeticPlan(folfox,data,{level:"phase_dependent",phaseResolved:false});
assert.strictEqual(phase.status,"phase_review_required");

console.log("v0.72.0 regimen workflow engine tests passed: antiemetic, interaction and extravasation manifests verified.");
