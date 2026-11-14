'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),crypto=require('crypto');
const R=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(R,f)),json=f=>JSON.parse(read(f)),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const s=json('validation/head-neck-v08449/scope.json'),index=json('protocols/index.json').protocols,A=require('../js/patient-asset-registry-v0810.js'),K=json('data/regimen-knowledge-base-v08449-addendum.json'),W=require('../js/regimen-workflow-engine-v0750.js'),workflow=json('data/regimen-workflow-v0750.json');
assert(['0.84.49','0.84.50'].includes(json('package.json').version));assert.equal(A.release,json('package.json').version);assert.equal(index.length,377);assert.equal(s.new_routes.length,5);assert.equal(s.retrospective_codes.length,5);assert.equal(s.new_codes.length,0);assert.equal(A.codes.flatMap(c=>A.bundleRoutes(c)).length,json('package.json').version==='0.84.50'?250:245);assert.equal(require('../tools/apply-patient-visual-standard-v08443.cjs').discoverRoutes(R).length,json('package.json').version==='0.84.50'?259:254);
const norm=s=>s.replace(/&#(?:039|39);/g,"'").replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ').trim();
let checks=0;
for(const route of s.clinical_routes){
 const [code,context]=route.split('/'),profile=json((context?'data/patient-knowledge-contexts/':'data/patient-knowledge/')+route+'.json'),p=json(index.find(x=>x.path.includes('/'+code+'-')).path);
 assert.equal(profile.protocol_id,p.protocol_id);assert.equal(String(profile.protocol_version),p.metadata.nccp_version);assert.equal(profile.visual_release,s.new_routes.includes(route)?'0.84.49':'0.84.48');assert(profile.anatomy.length>=6);
 const source=json('validation/head-neck-v08449/sources/index.json').find(x=>x.code===code);assert.equal(sha(read('validation/head-neck-v08449/sources/'+code+'.pdf')),source.sha256);assert.equal(source.status,200);
 assert(A.bundleRoutes(code).includes(route));assert.equal(A.relativePath(code,'knowledge',context),'patient/'+route+'/knowledge.html');
 const guide=read('patient/'+route+'/guide.html').toString(),card=read('patient/'+route+'/sactcard.html').toString(),consent=norm(read('patient/'+route+'/consent-form.html').toString());
 assert.equal((guide.match(/class="pt-page /g)||[]).length,3);assert(guide.includes('Full-body anatomical illustration'));assert(guide.includes('oncowiki-qr.png'));
 require('./helpers/patient-overview-v08445.cjs').validate(read('patient/'+route+'/index.html').toString(),route);
 for(const text of ['85.6 × 54 mm','Do not cut the centre line','EXAMPLE','oncowiki-qr.png','Add to Home Screen'])assert(card.includes(text),route+' '+text);
 for(const a of profile.agents)for(const risk of a.risks)assert(consent.includes(norm(risk)),route+' complete consent risk '+risk);
 assert(consent.includes(norm(profile.consent_support)),route+' complete support discussion');
 for(const name of ['guide','sactcard','knowledge','handbook','passport','consent-form','supportive-care','treatment-journey','logistics']){const b=read('patient/'+route+'/'+name+'.pdf');assert.equal(b.subarray(0,4).toString(),'%PDF');assert(b.equals(read('docs/patient/'+route+'/'+name+'.pdf')),route+' '+name+' exact mirror');checks++;}
 if(s.new_routes.includes(route)){
  const kb=K.regimen_profiles.find(x=>x.protocol_id===p.protocol_id);assert(kb);assert.deepEqual(kb.monitoring_and_toxicity.longitudinal_schedule,profile.monitoring_schedule);assert(profile.chapters.length>=9);
  const actual={...p,selectedContext:context||'head_neck',patient_context:context||'head_neck'};
  const choices=workflow.supportive_phase_selectors[code]||workflow.context_supportive_phase_selectors[code][context];
  for(const phase of choices.phases){
   const m=W.buildManifest(actual,workflow,{},phase.id);assert.equal(m.supportPhase?.id,phase.id,route+' selected phase');assert.deepEqual(m.components,phase.active_medicines);assert(m.supportiveCare);
   const plan=workflow.antiemetic_plans[phase.plan_id];if(plan.preserve_local_adjunct_reference){assert.deepEqual(m.supportiveCare.local_prescription_items,plan.local_prescription_items);if(plan.local_prescription_items.some(x=>/omeprazole/i.test(x.medicine)))assert(m.supportiveCare.local_prescription_items.some(x=>/omeprazole/i.test(x.medicine)));}
   if(!phase.active_medicines.includes('docetaxel'))assert(!m.supportiveCare.agentSupport?.some(x=>/docetaxel/i.test(x.agent||x.medicine||'')));
  }
 }
}
for(const name of ['index.html','scope.html']){const guard=read('patient/00419/'+name).toString();assert(guard.includes('cisplatin cannot be given or is not tolerated'));assert(guard.includes('weekly for six doses'));assert(!guard.includes('three-weekly carboplatin'));}
const shared=json(index.find(x=>x.path.includes('/00419-')).path);
assert.equal(shared.protocol_id,'nccp-00419-v6');assert.equal(require('../js/protocol-id-migrations.js').resolve('nccp-00419-v4',[shared]),shared);assert.equal(shared.indications.find(x=>x.indication_id==='00419-head-neck').code,'00419a');
for(const context of ['gynaecology','cervical','',undefined])assert.match(A.relativePath('00419','knowledge',context),/scope\.html/);
assert.equal(W.buildManifest({...shared,patient_context:'cervical'},workflow,{},'chemoradiation').supportPhase,null,'HNSCC phase not assigned to cervical context');
const visibility=require('../js/library-scope-v08441.js');assert.equal(visibility.haematologyEnabled,false);
console.log(JSON.stringify({release:'0.84.49',status:'passed',routes:10,new_services:5,repeat_audits:5,protocols:index.length,checks}));
