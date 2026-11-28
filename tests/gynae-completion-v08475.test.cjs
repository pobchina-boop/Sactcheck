'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const registry=require('../js/patient-asset-registry-v0810');
const index=require('../protocols/index.json').protocols;
const workflow=require('../data/regimen-workflow-v0750.json');
const cases=[
 ['00205','ovarian',['00205b'],[1],'low'],
 ['00205','endometrial',['00205d'],[1],'low'],
 ['00232','ovarian',['00232c'],[1,8],'minimal'],
 ['00311','ovarian',['00311a','00311c','00311d'],[1,2,3,4,5],'low']
];
for (const [code,context,codes,days,risk] of cases) {
 const protocol=require(path.join(root,index.find(entry=>entry.path.includes('/'+code+'-')).path));
 const profile=require('../data/patient-knowledge-contexts/'+code+'/'+context+'.json');
 const route='patient/'+code+'/'+context+'/';
 for (const official of codes) {
  const selected=protocol.indications.find(i=>i.code===official || i.indication_id===official);
  assert(selected,official);
  const request={...protocol,selected_indication_id:selected.indication_id};
  assert.equal(registry.contextFor(request,'Gynaecology'),context);
  assert.equal(registry.gynaeAssessmentIndication(request,'Gynaecology'),selected.indication_id);
  assert.equal(registry.relativePath(request,'guide','Gynaecology'),route+'guide.pdf');
 }
 if(code==='00232') assert(profile.administration_text.includes('over 15 minutes'));
 if(code==='00311') assert(profile.schedule_summary.includes('30-minute'));
 const visits=profile.prescription_phases;
 assert.deepEqual(visits.map(v=>v.id),days.map(d=>'day'+d));
 assert.deepEqual(workflow.context_supportive_phase_selectors[code][context].phases.map(v=>v.id),visits.map(v=>v.id));
 for (const v of visits) {
  assert.equal(v.emetogenic_risk,risk);
  assert.equal(registry.gynaeVisitPath(protocol,context,v.id),route+'antiemetic-'+v.id+'.pdf');
  assert(fs.readFileSync(path.join(root,route,'antiemetic-'+v.id+'.pdf')).equals(fs.readFileSync(path.join(root,'docs',route,'antiemetic-'+v.id+'.pdf'))));
 }
 if(code==='00311') assert.equal(registry.gynaeAssessmentIndication(protocol,'Gynaecology'),'');
 if(code==='00205') assert.equal(registry.contextFor(protocol,'Gynaecology'),'');
 const wrong=protocol.indications.find(i=>i.tumour_groups.includes(code==='00311'?'Lung':'Breast'));
 assert.equal(registry.contextFor({...protocol,selected_indication_id:wrong.indication_id},'Gynaecology'),'');
}
console.log('Four gynae routes passed source-indication, conflicting-context and visit-prescription checks.');
