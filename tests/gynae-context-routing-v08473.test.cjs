'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const registry = require('../js/patient-asset-registry-v0810');
const workflow = require('../js/regimen-workflow-engine-v0750');
const data = require('../data/regimen-workflow-v0750.json');
const root = path.resolve(__dirname,'..');
const read = file => fs.readFileSync(path.join(root,file),'utf8');
const assets = {portal:'',knowledge:'knowledge.html',guide:'guide.pdf',passport:'passport.pdf',
  'sact-card':'sactcard.pdf',handbook:'handbook.pdf',longitudinal:'treatment-journey.html',
  'consent-draft':'consent-form.html','consent-pdf':'consent-form.pdf','supportive-care-selector':'supportive-care.html',
  'supportive-care':'supportive-care.pdf'};
const settings = {
  '00943':['concurrent_day1','cisplatin_weekly','optional_c2d15','pembro_q3w','pembro_q6w'],
  '00921':['first_infusion','subsequent_infusion'],
  '00279/cervical':['day1_platinum_etoposide','days23_iv_etoposide','days23_oral_etoposide','days23_fractionated_cisplatin'],
  '00251/ovarian':['day1'], '00261/ovarian':['day1']
};
const selector = read('assets/patient/context-selector-v08425.js');
const fallback = read('404.html').match(/<script>([\s\S]*?)<\/script>/)[1];
function compatibilityTarget(pathname) {
  let target;
  vm.runInNewContext(fallback,{URLSearchParams,location:{pathname,search:'?from=bookmark',hash:'#care',replace:value=>{target=value;}}});
  return target;
}
function scopeChoice(code,context,asset) {
  const page=read('patient/'+code+'/scope.html');
  const links=[...page.matchAll(/data-context="([^"]+)" data-route="([^"]+)"/g)].map(([,context,route])=>
    ({dataset:{context,route},setAttribute(k,v){this[k]=v;}}));
  vm.runInNewContext(selector,{URLSearchParams,window:{location:{pathname:'/patient/'+code+'/scope.html',search:'?asset='+asset}},
    document:{querySelectorAll:()=>links}});
  return links.find(item=>item.dataset.context===context)?.href;
}
const index=require('../protocols/index.json').protocols;
function protocol(code) {
  const row=index.find(item=>item.path.includes('/'+code+'-'));
  assert(row,'Missing catalogue entry '+code);
  return require(path.join(root,row.path));
}
global.SACTCheckProtocolContext={activeTumourGroup:()=> 'Gynaecology'};
for (const [route,visits] of Object.entries(settings)) {
  const [code,context]=route.split('/');
  const p=protocol(code);
  const dir='patient/'+route+'/';
  assert(registry.bundleRoutes(p).includes(route));
  assert.equal(registry.relativePath(p,'support-treatment'),null);
  assert.deepEqual(registry.gynaeVisitContext(p).visits,visits);
  const unresolved=visits.length===1?'antiemetic-day1.pdf':'antiemetic-prescriptions.html';
  assert.equal(registry.gynaeVisitPath(p,'','unexpected'),dir+'antiemetic-prescriptions.html');
  assert.equal(compatibilityTarget('/docs/'+dir+'guide.html'),'/'+dir+'guide.pdf?from=bookmark#care');
  assert.equal(compatibilityTarget('/'+dir.slice(0,-1)),'/'+dir+'?from=bookmark#care');
  const manifest=workflow.buildManifest(p,data);
  assert.deepEqual(manifest.supportPhaseChoices.map(i=>i.id),visits);
  assert.equal(manifest.supportPhase?.id,visits.length===1?'day1':undefined);
  for(const [asset,name] of Object.entries({...assets,'antiemetic-prescription':unresolved})){
    assert.equal(registry.relativePath(p,asset),dir+name);
    assert(fs.existsSync(path.join(root,dir,name||'index.html')),route+' '+asset);
    if(context) assert.equal(scopeChoice(code,context,asset),context+'/'+name);
  }
  for(const id of visits){
    const out=workflow.buildManifest(p,data,{},id);
    assert.equal(out.supportPhase.id,id);
    const file='antiemetic-'+id+'.pdf';
    assert.equal(registry.gynaeVisitPath(p,'',id),dir+file);
    assert(fs.readFileSync(path.join(root,dir,file)).subarray(0,5).equals(Buffer.from('%PDF-')));
    assert(fs.readFileSync(path.join(root,'docs',dir,file)).equals(fs.readFileSync(path.join(root,dir,file))));
  }
}
for(const code of ['00251','00261']){
  const p=protocol(code);
  assert.equal(registry.gynaeAssessmentIndication(p,'Gynaecology'),'');
  for(const letter of 'abcdefghi'){
    const raw=code+letter;
    const q={...p,selected_indication_id:raw};
    assert.equal(registry.contextFor(q,'all'),'ovarian');
    assert.equal(registry.contextFor(q,'Breast'),'');
    assert.equal(registry.gynaeAssessmentIndication(q,'Gynaecology'),letter==='a'?code+'-gyn':raw);
  }
  assert.equal(registry.contextFor({...p,selected_indication_id:code+'j'},'Breast'),'breast');
  assert.equal(registry.contextFor({...p,selected_indication_id:code+'j'},'Gynaecology'),'');
  assert.equal(registry.relativePath(code,'guide','all'),'patient/'+code+'/scope.html?asset=guide');
}
const cis=protocol('00279');
require('../js/emetogenic-risk');
const risk=global.SACTCheckEmetogenicRisk;
const cervicalPath='patient/00279/cervical/';
for(const interval of ['21','28']) {
  for(const variant of ['iv','mixed','split_iv','split_mixed','carbo_iv','carbo_mixed']) {
    for(const day of ['day1','day2','day3']) {
      const id=day==='day1'?'day1_platinum_etoposide':variant.startsWith('split_')?'days23_fractionated_cisplatin':
        variant.includes('mixed')?'days23_oral_etoposide':'days23_iv_etoposide';
      assert.equal(risk.get(cis,{tumourGroup:'Gynaecology',treatmentSchedule:variant+'_'+interval,treatmentDay:day}).proformaUrl,
        cervicalPath+'antiemetic-'+id+'.pdf');
    }
  }
}
for (const options of [{},{treatmentSchedule:'bespoke',treatmentDay:'day1'},{treatmentSchedule:'iv_21'},{treatmentDay:'day2'}]) {
  assert.equal(risk.get(cis,{tumourGroup:'Gynaecology',...options}).proformaUrl,cervicalPath+'antiemetic-prescriptions.html');
}
for(const denied of [false,'false']) {
  const other={...cis,indication_id:'00279b',cervical_primary_confirmed:denied};
  assert.equal(registry.contextFor(other,'Gynaecology'),'');
  assert.equal(registry.gynaeVisitPath(other,'Gynaecology','day1_platinum_etoposide'),'patient/00279/scope.html?asset=antiemetic-prescription');
  assert.equal(registry.relativePath(other,'knowledge','cervical'),'patient/00279/scope.html?asset=knowledge');
}
assert.equal(registry.contextFor({...cis,indication_id:'00279b'},'all'),'');
assert.equal(registry.contextFor({...cis,indication_id:'00279b'},'cervical'),'cervical');
assert.equal(registry.contextFor({...cis,indication_id:'00279b'},'lung'),'');
assert.equal(registry.contextFor({...cis,indication_id:'00279a'},'Gynaecology'),'');
assert.equal(registry.relativePath({...cis,indication_id:'00279a'},'guide','Lung'),'patient/00279/scope.html?asset=guide');
assert.equal(registry.relativePath({...protocol('00261'),indication_id:'00261k'},'guide','Head and Neck'),'patient/00261/head_neck/guide.pdf');
delete global.SACTCheckProtocolContext;
console.log('Five gynaecology contexts, thirteen visit prescriptions, shared-cancer selection and legacy bookmarks verified.');
