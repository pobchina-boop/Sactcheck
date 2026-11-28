'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const assets = require('../js/patient-asset-registry-v0810');
const index = require('../protocols/index.json');
const workflow = require('../data/regimen-workflow-v0750.json');
const routes = require('../tools/lib/ovarian-patient-routes-v08474.json');
const root = path.join(__dirname, '..');
const expected = {
  '00203': ['00203e','00203f','00203g'], '00212': ['00212b'],
  '00215': ['00215a','00215c'], '00226': ['00226b'], '00621': ['00621c']
};
const retrospective = {'00203':'prostate','00212':'colorectal','00215':'lung','00226':'lung','00621':'lung'};
for (const route of routes) {
  const [code] = route.split('/');
  const p = require(path.join(root,index.protocols.find(row => row.path.includes('/'+code+'-')).path));
  const profile = require('../data/patient-knowledge-contexts/'+route+'.json');
  const phases = workflow.context_supportive_phase_selectors[code].ovarian.phases;
  const folder = 'patient/'+route+'/';
  assert.equal(assets.relativePath(p,'guide','Gynaecology'),folder+'guide.pdf');
  assert.equal(assets.relativePath(p,'guide',retrospective[code]),'patient/'+code+'/'+retrospective[code]+'/guide.pdf');
  for (const indication of p.indications) {
    const selected = {...p,selected_indication_id:indication.indication_id};
    const ovarian = expected[code].includes(indication.code);
    assert.equal(assets.contextFor(selected,'Gynaecology'),ovarian ? 'ovarian' : '');
    if (ovarian) assert.equal(assets.gynaeAssessmentIndication(selected,'Gynaecology'),indication.indication_id);
  }
  assert.deepEqual(phases.map(row=>row.id),profile.prescription_phases.map(row=>row.id));
  for (const phase of phases) {
    const file = folder+'antiemetic-'+phase.id+'.pdf';
    assert.equal(assets.gynaeVisitPath(p,'Gynaecology',phase.id),file);
    assert(fs.readFileSync(path.join(root,file)).equals(fs.readFileSync(path.join(root,'docs',file))));
    assert(workflow.antiemetic_plans[phase.plan_id]);
  }
  if (['00226','00621'].includes(code)) {
    assert.deepEqual(phases.map(row=>row.id),code==='00226'?['day1','day8','day15','day22']:['day1','day8','day15']);
    assert.match(profile.schedule_summary,code==='00226'?/Day 22 is a treatment day/:/Day 22 is a planned week off/);
  }
  if (code==='00215') {
    assert.deepEqual(assets.gynaeVisitContext({...p,selected_indication_id:'00215a'},'Gynaecology').visits,['firstline','continuation']);
    assert.deepEqual(assets.gynaeVisitContext({...p,selected_indication_id:'00215c'},'Gynaecology').visits,['topotecan']);
    assert.equal(assets.relativePath(p,'consent-draft','Gynaecology'), folder+'consent.html');
  }
  if (code==='00226') {
    assert.deepEqual(p.indications.map(row=>row.code),['00226a','00226b','00226d','00226e']);
    assert.deepEqual(p.indications[0].tumour_groups,['Breast']);
    assert.deepEqual(p.indications[1].tumour_groups,['Gynaecology']);
  }
}
console.log('Five ovarian pathways, selected indications, five existing shared-code routes and every visit prescription verified.');
