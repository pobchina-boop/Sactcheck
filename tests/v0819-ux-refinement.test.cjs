'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const workflow=read('css/regimen-workflow-v0720.css');
const knowledge=read('assets/patient/patient-knowledge.js');
const patientCss=read('assets/patient/patient-knowledge.css');
const portalCss=read('patient/assets/pipeline-v0800.css');
for(const label of ['Pre-treatment assessment engine','Consent generator','Knowledge base & evidence','Patient portal','Original NCCP regimen']){
  assert.ok(workflow.includes(label),`compact workflow label missing: ${label}`);
}
assert.ok(workflow.includes('.workflow-module-grid{display:flex;flex-direction:column'),'workflow is not rendered as a compact list');
assert.ok(workflow.includes('.workflow-support-script,.workflow-module-expanded{display:none!important}'),'expanded workflow detail is not collapsed from at-a-glance view');
assert.ok(knowledge.includes('Evidence-linked patient information'),'evidence banner missing');
assert.ok(knowledge.includes('What a 21-day cycle means'),'static cycle explanation missing');
assert.ok(!knowledge.includes('selectedDay'),'interactive selected-day state should be retired');
assert.ok(!knowledge.includes("getElementById('pk-start')"),'date-entry logic should be retired');
assert.ok(patientCss.includes('.pk-evidence-banner'),'evidence-link styling missing');
assert.ok(patientCss.includes('.pk-reference-grid'),'static treatment-plan layout missing');
assert.ok(portalCss.includes('knowledge.html#cycle'),'legacy timeline entry point is not being hidden on the portal landing page');
assert.doesNotMatch(knowledge,/localStorage|sessionStorage|fetch\(|XMLHttpRequest|sendBeacon/,'patient page must not persist or transmit patient-entered state');
console.log('v0.81.9 UX refinement checks passed: compact workflow + static evidence-linked patient knowledge.');
