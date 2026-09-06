"use strict";

const assert=require("assert");
const fs=require("fs");
const path=require("path");
const Builder=require("../js/regimen-consent-builder-v0710.js");

const ROOT=path.resolve(__dirname,"..");
const content=JSON.parse(fs.readFileSync(path.join(ROOT,"data","consent-content-v0710.json"),"utf8"));
const validation=Builder.validateContent(content);
assert.ok(validation.valid,validation.errors.join("; "));
assert.strictEqual(content.release,"0.71.0");
assert.ok(Object.keys(content.agent_profiles).length>=50,"Expected broad seed coverage for common oncology medicines.");
assert.strictEqual(content.governance.no_autonomous_consent,true);
assert.strictEqual(content.governance.clinician_review_required,true);
assert.strictEqual(content.governance.pharmacy_review_required,true);

const folfox={
  protocol_id:"test-folfox",
  metadata:{
    nccp_regimen_code:"00209",nccp_version:"10a",
    title:"FOLFOX-6 Modified Therapy — 14 day",
    indication:"Adjuvant or metastatic colorectal cancer.",
    cytotoxic:true,treatment_class:["cytotoxic_chemotherapy"]
  },
  treatment_phases:[{cycle_length_days:14,administration:[
    {day:1,drug:"oxaliplatin"},{day:1,drug:"folinic_acid"},{day:1,drug:"fluorouracil"}
  ]}]
};
let draft=Builder.buildDraft(folfox,content);
assert.strictEqual(draft.classification.cytotoxic,true);
assert.strictEqual(draft.classification.immunotherapy,false);
assert.ok(draft.genericChemo.some(item=>item.id==="chemo:marrow_infection"));
assert.ok(draft.agentGroups.some(group=>group.key==="oxaliplatin"));
assert.ok(draft.agentGroups.some(group=>group.key==="fluorouracil"));
assert.ok(!draft.coverage.unmappedAgents.some(name=>/folinic/i.test(name)),"Folinic acid should not create an unmapped-agent warning.");

const chemoIci={
  protocol_id:"test-keynote-combo",
  metadata:{
    nccp_regimen_code:"TEST1",nccp_version:"1",
    title:"Pembrolizumab, carboplatin and paclitaxel",
    indication:"Advanced cancer.",
    cytotoxic:true,treatment_class:["cytotoxic_chemotherapy","immunotherapy"]
  },
  treatment_phases:[{cycle_length_days:21,administration:[
    {day:1,drug:"pembrolizumab"},{day:1,drug:"carboplatin"},{day:1,drug:"paclitaxel"}
  ]}]
};
draft=Builder.buildDraft(chemoIci,content);
assert.strictEqual(draft.classification.cytotoxic,true);
assert.strictEqual(draft.classification.immunotherapy,true);
for(const id of ["immune:pneumonitis","immune:colitis","immune:hepatitis","immune:endocrine","immune:nephritis","immune:skin","immune:delayed"]){
  assert.ok(draft.immunotherapy.some(item=>item.id===id),`Missing immunotherapy consent risk ${id}`);
}
assert.ok(draft.agentGroups.some(group=>group.key==="pembrolizumab"));
assert.ok(draft.agentGroups.some(group=>group.key==="carboplatin"));
assert.ok(draft.agentGroups.some(group=>group.key==="paclitaxel"));

const ribo={
  protocol_id:"test-ribo",
  metadata:{
    nccp_regimen_code:"00525",nccp_version:"6",
    title:"Ribociclib metastatic",
    indication:"HR-positive HER2-negative advanced breast cancer.",
    treatment_class:["targeted_therapy"],cytotoxic:false,drugs:["ribociclib"]
  }
};
draft=Builder.buildDraft(ribo,content);
const riboGroup=draft.agentGroups.find(group=>group.key==="ribociclib");
assert(riboGroup,"Ribociclib agent profile missing.");
assert(riboGroup.risks.some(item=>/hepatotoxicity/i.test(item.label)));
assert(riboGroup.risks.some(item=>/QT/i.test(item.label)));

const unknown={
  protocol_id:"unknown",
  metadata:{nccp_regimen_code:"X",title:"Novel medicine",drugs:["futuremab"],treatment_class:["targeted_therapy"]}
};
draft=Builder.buildDraft(unknown,content);
assert.deepStrictEqual(draft.coverage.unmappedAgents,["futuremab"],"Unknown agents must be visible rather than silently guessed.");

assert.strictEqual(Builder.safeUrl("javascript:alert(1)"),"","Unsafe source URLs must be rejected.");
assert.ok(Builder.escapeHtml("<img src=x onerror=1>").includes("&lt;img"),"Preview content must escape markup.");

const source=fs.readFileSync(path.join(ROOT,"js","regimen-consent-builder-v0710.js"),"utf8");
assert.ok(!source.includes("localStorage"),"Consent builder must not persist consent or patient data to localStorage.");
assert.ok(!source.includes("sessionStorage"),"Consent builder must not persist consent or patient data to sessionStorage.");
assert.ok(source.includes("data-open-regimen-consent"),"Regimen-card consent button integration missing.");
assert.ok(source.includes("Patient identifiers are intentionally not entered into or stored by SACTCheck"),"Patient-identifier governance copy missing.");
assert.ok(source.includes("Reasonable alternatives"),"Alternatives consent domain missing.");
assert.ok(source.includes("If treatment does not proceed"),"Consequences-of-no-treatment consent domain missing.");

console.log("v0.71.0 regimen-specific consent builder tests passed: generic chemotherapy, immunotherapy and agent-specific layering verified with explicit unmapped-agent and privacy safeguards.");
