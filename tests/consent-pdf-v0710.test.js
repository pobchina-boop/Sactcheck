"use strict";

const assert=require("assert");
const fs=require("fs");
const path=require("path");
const Pdf=require("../js/consent-pdf-v0710.js");

const payload={
  generatedAt:"2026-09-06T16:30:00Z",
  draft:{
    title:"FOLFOX-6 Modified Therapy - 14 day",
    nccpCode:"00209",
    nccpVersion:"10a",
    indication:"Metastatic colorectal cancer",
    intent:"Palliative",
    baseComponents:["Oxaliplatin","Folinic acid","Fluorouracil"],
    components:["Oxaliplatin","Folinic acid","Fluorouracil","Bevacizumab","Pembrolizumab"],
    addedAgents:["Bevacizumab","Pembrolizumab"],
    schedule:"14-day cycle",
    sourceUrl:"https://healthservice.hse.ie/example.pdf",
    coverage:{unmappedAgents:[]}
  },
  fields:{
    diagnosis:"Metastatic colorectal cancer",
    intent:"Palliative",
    benefit:"",
    alternatives:"",
    noTreatment:"",
    customRisks:"",
    fertility:"",
    questions:""
  },
  genericRisks:[
    {label:"Bone-marrow suppression and infection",detail:"Low blood counts may increase infection risk."},
    {label:"Nausea and vomiting",detail:"Anti-sickness treatment may be needed."},
    {label:"Diarrhoea or constipation",detail:"Bowel disturbance can occur."}
  ],
  agentGroups:[
    {displayName:"Oxaliplatin",clinicianAdded:false,risks:[
      {label:"Peripheral neuropathy",detail:"Numbness or tingling can occur."},
      {label:"Cold-triggered nerve symptoms",detail:"Cold can trigger acute symptoms."}
    ]},
    {displayName:"Fluorouracil",clinicianAdded:false,risks:[
      {label:"Severe toxicity with DPD deficiency",detail:"Reduced DPD activity can cause profound toxicity."},
      {label:"Cardiac toxicity",detail:"Chest pain or rhythm problems can occur."}
    ]},
    {displayName:"Bevacizumab",clinicianAdded:true,risks:[
      {label:"Hypertension",detail:"Blood pressure can rise."},
      {label:"Bleeding",detail:"Serious bleeding can occur."},
      {label:"Arterial or venous thromboembolism",detail:"Blood clots can occur."},
      {label:"Proteinuria / renal injury",detail:"Protein loss can occur."},
      {label:"Gastrointestinal perforation / fistula",detail:"Rare but serious."}
    ]},
    {displayName:"Pembrolizumab",clinicianAdded:true,risks:[]}
  ],
  immuneRisks:[
    {label:"Immune-related pneumonitis",detail:"Inflammation of the lungs."},
    {label:"Immune-related diarrhoea / colitis",detail:"Bowel inflammation can be severe."},
    {label:"Immune-related hepatitis",detail:"Liver inflammation can occur."},
    {label:"Immune-related endocrinopathies",detail:"Hormone glands can be affected."},
    {label:"Immune-related nephritis",detail:"Kidney inflammation can occur."},
    {label:"Immune-related skin toxicity",detail:"Rash and rare severe reactions can occur."},
    {label:"Less common serious immune toxicity",detail:"Other organs can be affected."},
    {label:"Delayed or persistent immune toxicity",detail:"Toxicity may begin after treatment stops."},
    {label:"Myocarditis / pericarditis",detail:"Rare serious cardiac immune toxicity."},
    {label:"Neurological immune toxicity",detail:"Encephalitis, neuropathy or myasthenic syndromes can occur."},
    {label:"Myositis / neuromuscular toxicity",detail:"Immune muscle inflammation can occur."},
    {label:"Ocular inflammation",detail:"Eye inflammation can threaten vision."},
    {label:"Pancreatitis / pancreatic inflammation",detail:"Pancreatic inflammation can occur."},
    {label:"Rare life-threatening or fatal immune toxicity",detail:"Severe immune toxicity can deteriorate rapidly."}
  ]
};

assert.strictEqual(Pdf.version,"0.71.0");
assert.strictEqual(Pdf.release,"0.71.2");
assert.strictEqual(Pdf.ascii("ALT 5×ULN ≥ threshold"),"ALT 5xULN >= threshold");
assert.strictEqual(Pdf.ascii("Day 1 · IV – q3w"),"Day 1 - IV - q3w");
assert.ok(!Pdf.ascii("µg β-test").includes("?"),"Unsupported PDF glyphs must never render as question marks.");
assert.strictEqual(Pdf.renderDocument(payload).length,2,"Consent PDF must always render exactly two pages.");

const pdf=Pdf.buildPdf(payload);
assert.ok(pdf instanceof Uint8Array);
assert.ok(pdf.length>2500,"Generated PDF is unexpectedly small.");
const text=Buffer.from(pdf).toString("latin1");
assert.ok(text.startsWith("%PDF-1.4"));
assert.ok(text.includes("%%EOF"));
assert.ok(text.includes("/Count 2"),"PDF page tree must contain exactly two pages.");
assert.ok(text.includes("GENERIC SACT / CHEMOTHERAPY CONSENT"));
assert.ok(text.includes("REGIMEN / AGENT-SPECIFIC MATERIAL RISKS"));
assert.ok(text.includes("IMMUNOTHERAPY / IMMUNE-RELATED RISKS"));
assert.ok(text.includes("Bevacizumab [CLINICIAN ADDED]"));
assert.ok(text.includes("Hypertension"));
assert.ok(text.includes("Arterial or venous thromboembolism"));
assert.ok(text.includes("Immune-related pneumonitis") || text.includes("Pneumonitis"));
assert.ok(text.includes("Myocarditis / pericarditis"));
assert.ok(text.includes("Neurological immune toxicity"));
assert.ok(text.includes("Myositis / neuromuscular toxicity"));
assert.ok(text.includes("Ocular inflammation"));
assert.ok(text.includes("Pancreatitis / pancreatic inflammation"));
assert.ok(text.includes("Rare life-threatening or fatal immune toxicity"));
assert.ok(text.includes("Expected benefit / aim of treatment"));
assert.ok(text.includes("Reasonable alternatives discussed"));
assert.ok(text.includes("If treatment does not proceed"));
assert.ok(text.includes("Patient / person giving consent"));
assert.ok(text.includes("Clinician obtaining consent"));
assert.ok(text.includes("does NOT represent NCCP endorsement"));
assert.strictEqual(Pdf.filename(payload),"SACTCheck_Consent_NCCP_00209_custom_2026-09-06.pdf");
assert.ok(text.includes("Myocarditis / pericarditis") || true);

const sample=path.join(__dirname,"..","SAMPLE_CONSENT_FOLFOX_BEVA_PEMBRO.pdf");
fs.writeFileSync(sample,Buffer.from(pdf));
console.log(`v0.71.1 two-page consent PDF tests passed and sample written to ${sample}`);

console.log("v0.71.2 immunotherapy and glyph-hardening tests passed.");
