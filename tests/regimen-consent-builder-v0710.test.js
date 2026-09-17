"use strict";

const assert=require("assert");
const Builder=require("../js/regimen-consent-builder-v0710.js");

const content={
  release:"0.71.0",
  governance:{no_autonomous_consent:true,clinician_review_required:true,pharmacy_review_required:true},
  sources:[
    {id:"hse_national_consent_policy"},
    {id:"nccp_sact_consent_resources"}
  ],
  supportive_components_not_counted_as_agent_coverage:["folinic acid"],
  generic_modules:{
    cytotoxic_chemotherapy:{risks:[
      {id:"marrow_infection",label:"Bone-marrow suppression and infection",detail:"Low counts may increase infection risk."},
      {id:"nausea",label:"Nausea and vomiting",detail:"Anti-sickness treatment may be needed."}
    ]},
    immune_checkpoint_inhibitor:{risks:[
      {id:"pneumonitis",label:"Immune-related pneumonitis",detail:"Inflammation of the lungs."},
      {id:"colitis",label:"Immune-related diarrhoea / colitis",detail:"Bowel inflammation may be severe."},
      {id:"hepatitis",label:"Immune-related hepatitis",detail:"Liver inflammation can occur."},
      {id:"endocrine",label:"Immune-related endocrinopathies",detail:"Hormone glands can be affected."},
      {id:"nephritis",label:"Immune-related nephritis",detail:"Kidney inflammation can occur."},
      {id:"skin",label:"Immune-related skin toxicity",detail:"Rash and rare severe reactions can occur."},
      {id:"delayed",label:"Delayed and persistent immune toxicity",detail:"Toxicity may begin after treatment stops."}
    ]}
  },
  agent_profiles:{
    oxaliplatin:{display_name:"Oxaliplatin",aliases:[],category:"cytotoxic",risks:[
      {id:"neuropathy",label:"Peripheral neuropathy",detail:"Numbness or tingling can occur."}
    ]},
    fluorouracil:{display_name:"Fluorouracil",aliases:["5-FU"],category:"cytotoxic",risks:[
      {id:"dpd",label:"Severe toxicity with DPD deficiency",detail:"Reduced DPD activity can cause profound toxicity."}
    ]},
    bevacizumab:{display_name:"Bevacizumab",aliases:["Avastin"],category:"targeted",risks:[
      {id:"htn",label:"Hypertension",detail:"Blood pressure can rise."},
      {id:"clot",label:"Arterial or venous thromboembolism",detail:"Blood clots can occur."},
      {id:"bleed",label:"Bleeding",detail:"Serious bleeding can occur."}
    ]},
    pembrolizumab:{display_name:"Pembrolizumab",aliases:["Keytruda"],category:"immunotherapy",module:"immune_checkpoint_inhibitor",risks:[]}
  }
};
for(let i=0;i<40;i++){
  content.agent_profiles[`dummy_${i}`]={display_name:`Dummy ${i}`,aliases:[],category:"targeted",risks:[]};
}

const validation=Builder.validateContent(content);
assert.ok(validation.valid,validation.errors.join("; "));
assert.strictEqual(Builder.version,"0.71.0");
assert.strictEqual(Builder.release,"0.71.3");

const folfox={
  protocol_id:"test-folfox",
  metadata:{
    nccp_regimen_code:"00209",nccp_version:"10a",
    title:"FOLFOX-6 Modified Therapy - 14 day",
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
assert.ok(!draft.coverage.unmappedAgents.some(name=>/folinic/i.test(name)));

const avastin=Builder.searchAgents(content,"avastin");
assert.strictEqual(avastin[0].key,"bevacizumab","Trade-name search should resolve Avastin to bevacizumab.");
const keytruda=Builder.searchAgents(content,"keytruda");
assert.strictEqual(keytruda[0].key,"pembrolizumab","Trade-name search should resolve Keytruda to pembrolizumab.");

Builder.addAgent(folfox,"bevacizumab");
draft=Builder.buildDraft(folfox,content,{addedAgentKeys:Builder.getAddedAgentKeys(folfox)});
const bev=draft.agentGroups.find(group=>group.key==="bevacizumab");
assert(bev&&bev.clinicianAdded,"Clinician-added bevacizumab must be explicitly marked.");
assert.ok(draft.addedAgents.includes("Bevacizumab"));
assert.ok(draft.components.includes("Bevacizumab"));
assert.strictEqual(Builder.getAddedAgentKeys(folfox).length,1);

Builder.addAgent(folfox,"bevacizumab");
assert.strictEqual(Builder.getAddedAgentKeys(folfox).length,1,"Duplicate agent additions must be prevented.");

Builder.addAgent(folfox,"pembrolizumab");
draft=Builder.buildDraft(folfox,content,{addedAgentKeys:Builder.getAddedAgentKeys(folfox)});
assert.strictEqual(draft.classification.immunotherapy,true,"Adding an ICI must automatically activate the immunotherapy consent module.");
const pembrolizumabGroup=draft.agentGroups.find(group=>group.key==="pembrolizumab");
assert.ok(pembrolizumabGroup.clinicianAdded);
assert.ok(pembrolizumabGroup.risks.some(item=>/pneumonitis/i.test(item.label)),
  "Core ICI pneumonitis risk should render under the checkpoint-inhibitor agent.");
assert.ok(draft.immunotherapy.some(item=>/Delayed/i.test(item.label)),
  "Additional immune-risk section should retain delayed immune toxicity.");

const payload=Builder.makePdfPayload(folfox,content,Builder.getAddedAgentKeys(folfox));
assert.deepStrictEqual(payload.draft.addedAgents.sort(),["Bevacizumab","Pembrolizumab"].sort());
assert.strictEqual(payload.riskGroups[0].kind,"generic");
assert.ok(payload.riskGroups.some(group=>group.kind==="immunotherapy"));

Builder.removeAgent(folfox,"bevacizumab");
assert.deepStrictEqual(Builder.getAddedAgentKeys(folfox),["pembrolizumab"]);
Builder.clearAddedAgents(folfox);
assert.deepStrictEqual(Builder.getAddedAgentKeys(folfox),[]);

assert.strictEqual(Builder.safeUrl("javascript:alert(1)"),"");
assert.ok(Builder.escapeHtml("<img src=x onerror=1>").includes("&lt;img"));

const fs=require("fs");
const path=require("path");
const source=fs.readFileSync(path.join(__dirname,"..","js","regimen-consent-builder-v0710.js"),"utf8");
assert.ok(!source.includes("localStorage"),"Consent builder must not persist patient/custom-agent consent data to localStorage.");
assert.ok(!source.includes("sessionStorage"),"Consent builder must not persist patient/custom-agent consent data to sessionStorage.");
assert.ok(source.includes("data-open-regimen-consent"),"Regimen-card consent PDF button hook missing.");
assert.ok(source.includes("data-consent-add-agent"),"Add-agent button hook missing.");
assert.ok(source.includes("Add agent to consent"),"Agent search popup missing.");
assert.ok(source.includes("Consent PDF"),"Direct consent PDF workflow missing.");
assert.ok(source.includes("does not imply NCCP endorsement"),"Clinician-added-agent NCCP safeguard missing.");
assert.ok(source.includes("Patient identifiers are intentionally not entered into or stored by SACTCheck"));
assert.ok(source.includes("Reasonable alternatives"));
assert.ok(source.includes("If treatment does not proceed"));

console.log("v0.71.1 streamlined consent builder tests passed: direct PDF workflow, trade-name agent search, modular added-agent composition and automatic immunotherapy activation verified.");


// v0.71.2: schedule must be generated from structured NCCP-regimen administration data.
const scheduleProtocol={
  protocol_id:"structured-schedule",
  metadata:{title:"Structured schedule",nccp_regimen_code:"99999"},
  treatment_phases:[{
    name:"Induction",
    cycle_length_days:21,
    administration:[
      {day:1,drug:"atezolizumab",route:"IV"},
      {day:1,drug:"bevacizumab",route:"intravenous"},
      {day:8,drug:"paclitaxel",route:"IV"}
    ]
  }]
};
const structured=Builder.scheduleSummary(scheduleProtocol);
assert.ok(structured.includes("21-day cycle"));
assert.ok(structured.includes("Day 1: Atezolizumab (IV) + Bevacizumab (IV)"));
assert.ok(structured.includes("Day 8: Paclitaxel (IV)"));
assert.ok(!structured.includes("?"),"Structured schedule must not contain replacement question marks.");

const noSchedule=Builder.scheduleSummary({protocol_id:"none",metadata:{}});
assert.strictEqual(noSchedule,"Structured schedule unavailable - verify against the current NCCP regimen.");

console.log("v0.71.2 schedule hardening tests passed.");


// v0.71.3: checkpoint inhibitors must render the core six directly under the agent.
const ROOT=path.resolve(__dirname,"..");
const fullContent=JSON.parse(fs.readFileSync(path.join(ROOT,"data","consent-content-v0710.json"),"utf8"));
const atezoProtocol={
  protocol_id:"atezo-test",
  metadata:{
    nccp_regimen_code:"00688",nccp_version:"2a",
    title:"Atezolizumab and nab-Paclitaxel",
    indication:"Test indication",
    treatment_class:["immunotherapy","cytotoxic_chemotherapy"],
    cytotoxic:true
  },
  treatment_phases:[{cycle_length_days:28,administration:[
    {day:1,drug:"atezolizumab",route:"IV"},
    {day:1,drug:"nab-paclitaxel",route:"IV"}
  ]}]
};
const atezoDraft=Builder.buildDraft(atezoProtocol,fullContent);
const atezoGroup=atezoDraft.agentGroups.find(group=>group.key==="atezolizumab");
assert(atezoGroup,"Atezolizumab agent group missing.");
for(const label of ["Pneumonitis","Diarrhoea / colitis","Hepatitis","Endocrine toxicity","Nephritis","Severe skin toxicity"]){
  assert.ok(atezoGroup.risks.some(r=>r.label===label),`Missing core ICI risk under atezolizumab: ${label}`);
}
assert.ok(!atezoGroup.risks.some(r=>/Review current medicine-specific material risks/i.test(r.label)),
  "Checkpoint inhibitor agent card must not fall back to generic manual-review wording.");
assert.ok(atezoDraft.immunotherapy.some(r=>r.label==="Myocarditis"));
assert.ok(atezoDraft.immunotherapy.some(r=>r.label==="Meningoencephalitis"));
assert.ok(atezoDraft.immunotherapy.some(r=>r.frequency==="<0.1%*"),
  "Atezolizumab rare immune-event frequency data should be carried into the PDF payload.");
assert.ok(atezoDraft.immuneFrequencySource?.population?.includes("5,039"));

console.log("v0.71.3 ICI agent rendering and evidence-frequency tests passed.");
