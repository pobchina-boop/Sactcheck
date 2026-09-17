"use strict";
const assert=require("assert");
const fs=require("fs");
const path=require("path");
const root=path.resolve(__dirname,"..");
const study=fs.readFileSync(path.join(root,"js","study-release.js"),"utf8");
const builder=fs.readFileSync(path.join(root,"js","regimen-consent-builder-v0710.js"),"utf8");
assert.ok(study.includes('const CONSENT_RELEASE="0.71.3"'));
assert.ok(study.includes('loader=0713'));
assert.ok(study.includes('script.src=`js/regimen-consent-builder-v0710.js?v=${CONSENT_RELEASE}&loader=0713`'),
  "Active consent loader must be bound to the current release cache key.");
assert.ok(builder.includes('root.SACTCheckConsentPdf?.release===RELEASE'));
assert.ok(builder.includes("stale?.remove?.()"));
console.log("v0.71.3 loader/cache tests passed.");
