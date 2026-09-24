"use strict";
const assert=require("assert");
const fs=require("fs");
const path=require("path");
const Pdf=require("../js/supportive-care-pdf-v0720.js");
const Engine=require("../js/regimen-workflow-engine-v0720.js");
const data=JSON.parse(fs.readFileSync(path.join(__dirname,"..","data","regimen-workflow-v0720.json"),"utf8"));

const protocol={
  protocol_id:"test",
  metadata:{nccp_regimen_code:"TEST",nccp_version:"1",title:"Example high-risk SACT"},
  treatment_phases:[{administration:[{day:1,drug:"cisplatin",route:"IV"}]}]
};
const manifest=Engine.buildManifest(protocol,data,{level:"high",label:"High emetogenic potential"});
const payload={manifest,sources:data.sources,generatedAt:"2026-09-24T20:00:00Z"};
const pdf=Pdf.buildPdf(payload);
assert.ok(pdf instanceof Uint8Array);
assert.ok(pdf.length>1800);
const text=Buffer.from(pdf).toString("latin1");
assert.ok(text.startsWith("%PDF-1.4"));
assert.ok(text.includes("/Count 1"));
assert.ok(text.includes("SUPPORTIVE MEDICINES - PRESCRIBING SUPPORT"));
assert.ok(text.includes("Aprepitant 125 mg PO OD - Day 1"));
assert.ok(text.includes("Ondansetron 16 mg PO OD - Day 1"));
assert.ok(text.includes("Olanzapine 5 mg PO OD - Day 1"));
assert.ok(text.includes("not an official NCCP/HSE prescription form"));
assert.strictEqual(Pdf.filename(payload),"SACTCheck_Supportive_Care_NCCP_TEST.pdf");

const sample=path.join(__dirname,"..","SAMPLE_SUPPORTIVE_CARE_HIGH.pdf");
fs.writeFileSync(sample,Buffer.from(pdf));
console.log(`v0.72.0 supportive-care PDF tests passed; sample written to ${sample}`);
