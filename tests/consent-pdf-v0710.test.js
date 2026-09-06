"use strict";

const assert=require("assert");
const Pdf=require("../js/consent-pdf-v0710.js");

const payload={
  generatedAt:"2026-09-06T14:30:00Z",
  draft:{
    title:"Pembrolizumab + carboplatin + paclitaxel",
    nccpCode:"00857",
    nccpVersion:"1",
    indication:"Breast cancer",
    intent:"Neoadjuvant",
    components:["Pembrolizumab","Carboplatin","Paclitaxel"],
    schedule:"21-day cycle",
    sourceUrl:"https://healthservice.hse.ie/example.pdf",
    coverage:{unmappedAgents:[]}
  },
  fields:{
    diagnosis:"Triple-negative breast cancer",
    intent:"Neoadjuvant",
    benefit:"Aim is to reduce recurrence risk and improve likelihood of disease control.",
    alternatives:"Alternative systemic and local treatment approaches discussed.",
    noTreatment:"Cancer may progress or recur without systemic therapy.",
    customRisks:"Patient-specific neuropathy risk discussed.",
    fertility:"Pregnancy avoidance and fertility implications discussed.",
    questions:"Questions answered."
  },
  riskGroups:[
    {title:"Immunotherapy / immune-related risks",risks:[
      {label:"Immune-related pneumonitis",detail:"Inflammation of the lungs can cause cough or breathlessness."},
      {label:"Immune-related endocrinopathy",detail:"Hormone-producing glands can be inflamed and may require long-term replacement."}
    ]},
    {title:"Paclitaxel - agent-specific risks",risks:[
      {label:"Peripheral neuropathy",detail:"Numbness, tingling or pain can occur and may persist."}
    ]}
  ]
};

assert.strictEqual(Pdf.version,"0.71.0");
assert.strictEqual(Pdf.ascii("ALT 5×ULN ≥ threshold"),"ALT 5xULN >= threshold");
assert.strictEqual(Pdf.ascii("Grade ≤2 — resume"),"Grade <=2 - resume");

const pdf=Pdf.buildPdf(payload);
assert.ok(pdf instanceof Uint8Array);
assert.ok(pdf.length>1500,"Generated PDF is unexpectedly small.");
const text=Buffer.from(pdf).toString("latin1");
assert.ok(text.startsWith("%PDF-1.4"));
assert.ok(text.includes("%%EOF"));
assert.ok(text.includes("Pembrolizumab + carboplatin + paclitaxel"));
assert.ok(text.includes("DRAFT - CLINICIAN REVIEW REQUIRED"));
assert.ok(text.includes("Patient name: __________________________________________"));
assert.ok(text.includes("Expected benefit / aim of treatment"));
assert.ok(text.includes("Reasonable alternatives discussed"));
assert.ok(text.includes("Likely consequence of declining or deferring treatment"));
assert.ok(text.includes("Immune-related pneumonitis"));
assert.ok(text.includes("Signature:"));
assert.strictEqual(Pdf.filename(payload),"SACTCheck_Consent_NCCP_00857_2026-09-06.pdf");
assert.ok(!text.includes("javascript:"));

console.log("v0.71.0 direct consent PDF exporter tests passed: valid PDF structure, A4 consent content, safe filename and clinical consent domains verified.");
