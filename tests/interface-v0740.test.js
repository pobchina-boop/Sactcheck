"use strict";
const assert=require("assert");
const fs=require("fs");
const path=require("path");
const root=path.resolve(__dirname,"..");
const shell=fs.readFileSync(path.join(root,"js","sactcheck-interface-v0740.js"),"utf8");
const boot=fs.readFileSync(path.join(root,"js","study-release.js"),"utf8");
const css=fs.readFileSync(path.join(root,"css","sactcheck-interface-v0740.css"),"utf8");

assert.ok(shell.includes('SACT support at point of care'));
assert.ok(shell.includes('One regimen. Two connected experiences.'));
assert.ok(shell.includes('MutationObserver'),"Card decoration must not depend on slow metadata completion.");
assert.ok(shell.includes('data-open-regimen-workflow'));
assert.ok(shell.includes('data-open-patient-support'));
assert.ok(shell.includes('.add-regimen-button'));
assert.ok(shell.includes('sactcheckModeSwitcher'));
assert.ok(shell.includes('Patient-facing support'));
assert.ok(css.includes('min-height:96px'),"Card actions need a stable layout while metadata continues loading.");
assert.ok(css.includes('body[data-sact-mode="patient"]'));
assert.ok(boot.includes('patient-support-v0740.js'));
assert.ok(boot.includes('sactcheck-interface-v0740.js'));
assert.ok(!boot.includes('regimen-consent-builder-v0710.js?v=0.71.3'),
  "Old patient/consent loader must not be reintroduced.");

console.log("v0.74.0 interface tests passed.");
