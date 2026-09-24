"use strict";
const assert=require("assert");
const fs=require("fs");
const path=require("path");
const root=path.resolve(__dirname,"..");
const study=fs.readFileSync(path.join(root,"js","study-release.js"),"utf8");
const engine=fs.readFileSync(path.join(root,"js","regimen-workflow-engine-v0720.js"),"utf8");
const css=fs.readFileSync(path.join(root,"css","regimen-workflow-v0720.css"),"utf8");

assert.ok(study.includes('WORKFLOW_RELEASE="0.72.0"'));
assert.ok(study.includes("regimen-workflow-engine-v0720.js"));
assert.ok(study.includes("regimen-consent-builder-v0710.js?v=0.71.0"),
  "Historical consent-loader sentinel must remain for existing regression tests.");
assert.ok(engine.includes("One regimen. One clinical workflow."));
assert.ok(engine.includes("SACT support at the point of care"));
assert.ok(engine.includes("Assess. Consent. Support. Inform."));
assert.ok(engine.includes("Clinic workflow"));
assert.ok(engine.includes("#openProtocolImporter"));
assert.ok(engine.includes('text==="add regimen"'));
assert.ok(engine.includes("Patient regimen hub"));
assert.ok(css.includes(".workflow-brand-lockup"));
assert.ok(css.includes(".workflow-panel"));
assert.ok(css.includes("#openProtocolImporter"));
console.log("v0.72.0 workflow UI tests passed: mission refresh, workflow panel and unused regimen-import controls verified.");
