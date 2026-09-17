"use strict";
const assert=require("assert");
const fs=require("fs");
const path=require("path");
const Pdf=require("../js/consent-pdf-v0710.js");

assert.strictEqual(typeof Pdf.openInViewer,"function","PDF viewer API missing.");

const payload={
  generatedAt:"2026-09-16T22:56:00Z",
  draft:{
    title:"Atezolizumab and nab-Paclitaxel",
    nccpCode:"00688",nccpVersion:"2a",
    indication:"Test indication",intent:"Test intent",
    components:["Atezolizumab","Nab-paclitaxel"],
    baseComponents:["Atezolizumab","Nab-paclitaxel"],
    addedAgents:[],schedule:"28-day cycle: Day 1",
    coverage:{unmappedAgents:[]}
  },
  fields:{},
  genericRisks:[],
  agentGroups:[],
  immuneRisks:[{label:"Nephritis",detail:"Immune-related kidney inflammation."}]
};

const result=Pdf.openInViewer(payload);
assert.ok(result.bytes instanceof Uint8Array);
assert.strictEqual(result.opened,false,"Node/non-browser mode should return bytes without attempting a download.");
assert.strictEqual(result.pages,2);

const builder=fs.readFileSync(path.join(__dirname,"..","js","regimen-consent-builder-v0710.js"),"utf8");
assert.ok(builder.includes("openPdfPlaceholder()"),"Synchronous PDF viewer placeholder missing.");
assert.ok(builder.includes("pdf.openInViewer(payload,viewerWindow)"),"Consent generation must open the PDF viewer rather than auto-download.");
assert.ok(!builder.includes("const result=pdf.download(payload)"),"Consent workflow must not automatically download the PDF.");
assert.ok(builder.includes('root.open("about:blank","_blank")'),"Viewer tab must be opened synchronously to avoid popup blocking.");

console.log("v0.71.3 PDF viewer tests passed: consent opens in browser viewer without automatic download.");
