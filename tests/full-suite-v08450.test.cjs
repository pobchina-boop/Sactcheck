'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),crypto=require('crypto');
const R=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(R,f)),json=f=>JSON.parse(read(f)),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const s=json('validation/head-neck-v08450/scope.json'),index=json('protocols/index.json').protocols,A=require('../js/patient-asset-registry-v0810.js'),K=json('data/regimen-knowledge-base-v08450-addendum.json'),W=require('../js/regimen-workflow-engine-v0750.js'),workflow=json('data/regimen-workflow-v0750.json');
assert(['0.84.50','0.84.51'].includes(json('package.json').version));assert.equal(A.release,json('package.json').version);assert.equal(index.length,377);assert.equal(A.codes.length,json('package.json').version==='0.84.51'?228:223);assert.equal(A.codes.flatMap(c=>A.bundleRoutes(c)).length,json('package.json').version==='0.84.51'?255:250);assert.equal(require('../tools/apply-patient-visual-standard-v08443.cjs').discoverRoutes(R).length,json('package.json').version==='0.84.51'?264:259);assert.equal(s.new_routes.length,5);assert.equal(s.retrospective_codes.length,5);assert.equal(s.new_codes.length,0);
const norm=s=>s.replace(/&#(?:039|39);/g,"'").replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ').trim();let checks=0;
for(const route of s.clinical_routes){
 const [code,context]=route.split('/'),profile=json((context?'data/patient-knowledge-contexts/':'data/patient-knowledge/')+route+'.json'),p=json(index.find(x=>x.path.includes('/'+code+'-')).path);
 assert.equal(profile.protocol_id,p.protocol_id);assert.equal(String(profile.protocol_version),p.metadata.nccp_version);assert(profile.anatomy.length>=6);
 assert(A.bundleRoutes(code).includes(route));assert.equal(A.relativePath(code,'knowledge',context),'patient/'+route+'/knowledge.html');
 const guide=read('patient/'+route+'/guide.html').toString(),card=read('patient/'+route+'/sactcard.html').toString(),consent=norm(read('patient/'+route+'/consent-form.html').toString());
 assert.equal((guide.match(/class="pt-page /g)||[]).length,3);assert(guide.includes('Full-body anatomical illustration'));assert(guide.includes('oncowiki-qr.png'));
 require('./helpers/patient-overview-v08445.cjs').validate(read('patient/'+route+'/index.html').toString(),route);
 for(const text of ['85.6 × 54 mm','Do not cut the centre line','EXAMPLE','oncowiki-qr.png','Add to Home Screen'])assert(card.includes(text),route+' '+text);
 for(const a of profile.agents)for(const risk of a.risks)assert(consent.includes(norm(risk)),route+' complete consent risk '+risk);
 assert(consent.includes(norm(profile.consent_support)),route+' complete support discussion');
 for(const name of ['guide','sactcard','knowledge','handbook','passport','consent-form','supportive-care','treatment-journey','logistics']){const b=read('patient/'+route+'/'+name+'.pdf');assert.equal(b.subarray(0,4).toString(),'%PDF');assert(b.equals(read('docs/patient/'+route+'/'+name+'.pdf')),route+' '+name+' exact mirror');checks++;}
 if(s.new_routes.includes(route)){
  require('./helpers/head-neck-inputs-v08450.cjs').validate(p);assert.equal(profile.visual_release,'0.84.50');
  const base=K.regimen_profiles.find(x=>x.protocol_id===p.protocol_id),kb=context?base.context_profiles.find(x=>x.context_id===context):base;assert(kb);assert.deepEqual(kb.monitoring_and_toxicity.longitudinal_schedule,profile.monitoring_schedule);assert.deepEqual(profile.chapters.map(x=>x.id),['diagnosis','schedule','checks','choices']);assert(profile.chapters.every(x=>x.items.length>=2));
  const choices=context?workflow.context_supportive_phase_selectors[code][context]:workflow.supportive_phase_selectors[code];
  for(const phase of choices.phases){const m=W.buildManifest({...p,patient_context:context||'head_neck'},workflow,{},phase.id);assert.equal(m.supportPhase?.id,phase.id);assert.deepEqual(m.components,phase.active_medicines);const plan=workflow.antiemetic_plans[phase.plan_id];if(plan.preserve_local_adjunct_reference)assert.deepEqual(m.supportiveCare.local_prescription_items,plan.local_prescription_items);}
  if(['00294','00242','00295'].includes(code)){assert.equal(profile.patient_summary.card_cycle_count,null);assert(card.includes('My review record'));assert(!card.includes('Planned cycles:'));assert(!guide.includes('A typical 28-day cycle'));assert(read('patient/'+route+'/knowledge.html').toString().includes('No automatic rest week is scheduled.'));}
  if(code==='00893'){assert.equal(profile.patient_summary.card_cycle_count,null);assert(profile.schedule_summary.includes('no scheduled Day-22'));assert.deepEqual(profile.timeline.filter(x=>x.style==='treatment').map(x=>x.start),[1,8,15]);}
 }
}
for(const context of ['gastrointestinal','hcc','rcc','genitourinary','',undefined])assert.match(A.relativePath('00294','knowledge',context),/scope\.html/);
const shared=json(index.find(x=>x.path.includes('/00294-')).path);assert.equal(W.buildManifest({...shared,patient_context:'hcc'},workflow,{},'continuous').supportPhase,null);assert(!K.regimen_profiles.find(x=>x.protocol_id===shared.protocol_id).treatment_setting);
const page404=read('404.html').toString().match(/<script>([\s\S]*?)<\/script>/)[1];let legacyTarget;require('node:vm').runInNewContext(page404,{location:{pathname:'/docs/patient/00294/guide.html',replace:p=>legacyTarget=p}});assert.equal(legacyTarget,'/patient/00294/scope.html?asset=guide');
const cap=workflow.antiemetic_plans.hn50_00615_day1;assert(cap.local_prescription_items.some(x=>/omeprazole/i.test(x.medicine)));
const lenv=workflow.supportive_phase_selectors['00295'];assert.deepEqual(lenv.phases.map(x=>workflow.antiemetic_plans[x.plan_id].risk_level),['oral_moderate_high','oral_minimal_low']);
for(const c of s.new_service_codes){const src=json('validation/head-neck-v08450/clinical/sources/retrieval.json').find(x=>x.code===c);assert.equal(sha(read('validation/head-neck-v08450/clinical/sources/'+c+'.pdf')),src.sha256);}
const retrospective=json('validation/head-neck-v08450/clinical/retrospective-audit.json');for(const f of retrospective.unchanged_patient_files)assert.equal(sha(read(f.path)),f.sha256,f.path+' retained exact v49 bytes');
assert.equal(require('../js/library-scope-v08441.js').haematologyEnabled,false);
console.log(JSON.stringify({release:'0.84.50',status:'passed',routes:10,new_services:5,repeat_audits:5,protocols:index.length,checks,retained_patient_files:retrospective.unchanged_patient_files.length}));
