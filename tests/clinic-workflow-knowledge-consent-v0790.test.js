"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const repo=path.join(__dirname,"..");
const read=p=>fs.readFileSync(path.join(repo,p),"utf8");

global.SACTCHECK_RELEASE="0.79.0";
const workflow=require(path.join(repo,"js/regimen-workflow-engine-v0750.js"));
const profile={id:"mfolfox6",title:"Modified FOLFOX-6 evidence profile"};
const protocol={protocol_id:"nccp-00209",metadata:{nccp_regimen_code:"00209"}};
let opened=null,consented=null;
global.SACTCheckRegimenKnowledgeBase={
  profileForProtocol:p=>p.metadata.nccp_regimen_code==="00209"?profile:null,
  openProfile:p=>{opened=p;return true;}
};
global.SACTCheckRegimenConsentBuilder={generateConsentPdf:p=>{consented=p;return "opened";}};

assert.equal(workflow.hasKnowledgeProfile(protocol),true,"expanded regimen profile should be identified as available");
assert.equal(workflow.hasKnowledgeProfile({metadata:{nccp_regimen_code:"99999"}}),false,"unexpanded regimen must not be marked as having a profile");
assert.equal(workflow.openKnowledgeProfile(protocol),true,"workflow should open the regimen profile");
assert.equal(opened,protocol,"knowledge profile must receive the selected regimen record");
assert.equal(workflow.openConsentSupport(protocol),"opened","workflow should invoke the consent-support generator");
assert.equal(consented,protocol,"consent generator must receive the selected regimen record");

const source=read("js/regimen-workflow-engine-v0750.js");
assert(source.includes("Knowledge &amp; evidence"),"clinic workflow knowledge card missing");
assert(source.includes("Generate draft consent support"),"clinic workflow consent generator action missing");
assert(source.includes("does not replace formal consent"),"formal-consent boundary missing");
const patientSupport=require(path.join(repo,"js/patient-support-v0750.js"));
let printableHtml="";
const viewer={document:{open(){},write(html){printableHtml=html;},close(){}}};
global.open=()=>viewer;
patientSupport.openPrintablePassport(protocol,{agent_profiles:{},generic_modules:{}},{consentSupport:true});
assert(printableHtml.includes("CONSENT DISCUSSION SUPPORT"),"draft consent support output heading missing");
assert(printableHtml.includes("Alternatives, including no SACT, discussed"),"consent discussion alternatives prompt missing");
assert(printableHtml.includes("Draft content requires clinician and oncology-pharmacy review"),"draft governance caveat missing");
const release=JSON.parse(read("data/app-release.json"));
assert.equal(release.release,"0.79.0");
assert(read("index.html").includes("app=0.79.0"),"updated cache key missing from index");
console.log("v0.79.0 clinic workflow knowledge + consent integration checks passed");
