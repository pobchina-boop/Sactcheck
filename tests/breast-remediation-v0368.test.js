"use strict";
const fs=require("fs"), path=require("path"), assert=require("assert");
const root=path.resolve(__dirname,"..");
const files=["00785-phesgo-maintenance.json","00796-phesgo-docetaxel.json","00797-phesgo-paclitaxel.json","00798-phesgo-vinorelbine.json","00605-talazoparib.json"];
for(const f of files){
 const p=JSON.parse(fs.readFileSync(path.join(root,"protocols","breast",f),"utf8"));
 assert.equal(p.status,"encoded_prototype_pending_clinical_and_pharmacy_validation",f+" status");
 assert.ok(p.rule_engine.rules.length>=4,f+" rules");
 assert.ok(p.supportive_care && !String(p.supportive_care.emetogenic_risk).includes("awaiting"),f+" supportive mapping");
 assert.ok(p.metadata.source_url.startsWith("https://healthservice.hse.ie/documents/"),f+" official source");
}
console.log("v0.36.8 breast remediation batch passed (5 protocols).")
