"use strict";
const assert=require("assert"),fs=require("fs"),path=require("path");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const pkg=JSON.parse(read("package.json")),app=JSON.parse(read("data/app-release.json"));
assert.ok(pkg.version.localeCompare("0.81.7",undefined,{numeric:true})>=0,"v0.81.7 behaviour must remain in cumulative releases");
assert.strictEqual(app.version,pkg.version);assert.strictEqual(app.release,pkg.version);
const ui=read("js/ui-stability-v0810.js");
assert.ok(ui.includes(".emetogenic-badge,.antiemetic-script-v0780"),"card readiness must accept the v0.81.5 single Rx-script badge");
assert.ok(ui.includes('data-sact-card-ready="degraded"] .card-actions{visibility:visible!important}'),"degraded fallback must never permanently hide card actions");
assert.ok(ui.includes("},900);"),"hydration fallback should no longer impose the old 2.6-second wait");
assert.ok(ui.includes("SACTCheckInterface?.decorateCards"),"hydration must actively restore the core workflow/patient actions");
assert.ok(ui.includes("SACTCheckAntiemeticPrintV0810?.decorate"),"hydration must reassert the single antiemetic Rx-script control");
assert.ok(ui.includes("function complete(s){return s.actions&&s.workflow&&s.patient&&s.assessment&&s.antiemetic;}"),"card readiness must no longer depend on duplicated Regimen info");
assert.ok(ui.includes(".regimen-info-link,[data-regimen-info-protocol]"),"duplicated card-level Regimen info action must be actively removed");
assert.ok(ui.includes("sustainability.html"),"sustainability must remain reachable after card-level removal");
assert.ok(ui.includes("workflow-module sustainability"),"Clinic workflow must include Sustainability");
assert.ok(ui.includes("sactSustainabilityAnchor"),"homepage must retain a visible Sustainability anchor");
const patientVisual=read("assets/patient/hcc-connectors-v0763.js");
for(const marker of ["Day 1 → Day 21: a general pattern","No reliable safe window","More useful to think cumulative across cycles","PD-1 safety source","wikiSafetyDock","PD-1 brake blocked","Platinum cross-links"]){
  assert.ok(patientVisual.includes(marker),`00568 patient visual refinement missing: ${marker}`);
}
const index=read("index.html");
for(const marker of ["sactcheck-interface-v0750.js?app=0.81.7","ui-stability-v0810.js?app=0.81.7","antiemetic-print-v0810.js?app=0.81.7","protocol-loader.js?v=0.59.0&app=0.81.7"]) assert.ok(index.includes(marker.replace(/app=0\.81\.7/g,`app=${pkg.version}`)),`bootstrap/cache marker missing ${marker}`);
const v816=read("tests/v0816-passport-cycle-agent-layout.test.js");
assert.ok(v816.includes('localeCompare("0.81.6"'),"v0.81.6 passport regression must tolerate later hotfix releases");
console.log("v0.81.9 streamlined card actions, sustainability anchor/workflow and 00568 patient visual checks passed.");
