'use strict';
// Current service consistency; source-bound numeric decisions have separate tests.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const R=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(R,f)),json=f=>JSON.parse(read(f));
const scope=json('validation/head-neck-v08447/scope.json'),index=json('protocols/index.json').protocols,registry=require('../js/patient-asset-registry-v0810.js');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),normal=s=>s.replace(/&#(?:039|39);/g,"'").replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ').trim();
const KB=json('data/regimen-knowledge-base-v08447-addendum.json'),journeys=json('data/breast-treatment-journeys-v0837.json'),runtime=require('../js/treatment-journey-v0837.js');
assert(['0.84.47','0.84.48','0.84.49'].includes(json('package.json').version));assert.equal(registry.release,json('package.json').version);assert.equal(index.length,377);assert.equal(scope.new_routes.length,5);assert.equal(scope.retrospective_codes.length,5);assert.equal(scope.new_codes.length,0);assert.equal(scope.clinical_routes.length,12);
let checks=0;
for(const route of scope.clinical_routes){
 const [code,context]=route.split('/'),d=json((context?'data/patient-knowledge-contexts/':'data/patient-knowledge/')+route+'.json'),p=json(index.find(x=>x.path.includes('/'+code+'-')).path);
 assert.equal(d.protocol_id,p.protocol_id);assert.equal(String(d.protocol_version),p.metadata.nccp_version);assert.equal(d.visual_release,'0.84.47');assert(d.anatomy.length>=6);assert(d.monitoring_schedule.rows.length>=3);
 const audit=json('validation/head-neck-v08447/sources/index.json').find(x=>x.code===code);assert.equal(sha(read('validation/head-neck-v08447/sources/'+code+'.pdf')),audit.sha256);assert.equal(audit.status,200);
 assert(registry.bundleRoutes(code).includes(route));assert.equal(registry.relativePath(code,'knowledge',context),route==='00207'?'patient/00207/scope.html?asset=knowledge':'patient/'+route+'/knowledge.html');
 const portal=read('patient/'+route+'/index.html').toString(),guide=read('patient/'+route+'/guide.html').toString(),card=read('patient/'+route+'/sactcard.html').toString();
 assert.equal((guide.match(/class="pt-page /g)||[]).length,3);assert(guide.includes('Full-body anatomical illustration'));assert(guide.includes('oncowiki-qr.png'));
 require('./helpers/patient-overview-v08445.cjs').validate(portal,route);
 for(const text of ['85.6 × 54 mm','Do not cut the centre line','EXAMPLE','oncowiki-qr.png','Add to Home Screen'])assert(card.includes(text),route+' '+text);
 const consent=normal(read('patient/'+route+'/consent-form.html').toString());assert(consent.includes(normal(d.consent_support)),route+' complete consent discussion');
 for(const agent of d.agents)for(const risk of agent.risks)assert(consent.includes(normal(risk)),route+' retained consent risk '+risk);
 for(const name of ['guide','sactcard','knowledge','handbook','passport','consent-form','supportive-care','treatment-journey','logistics']){const b=read('patient/'+route+'/'+name+'.pdf');assert.equal(b.subarray(0,4).toString(),'%PDF');assert(b.equals(read('docs/patient/'+route+'/'+name+'.pdf')),route+' '+name+' exact download mirror');checks++;}
 if(scope.new_routes.includes(route)){
  assert.equal(d.suite_release,'0.84.47');assert(d.chapters.length>=9);
  const k=KB.regimen_profiles.find(x=>x.protocol_id===p.protocol_id);assert(k,route+' clinician knowledge');assert.deepEqual(k.monitoring_and_toxicity.longitudinal_schedule,d.monitoring_schedule,route+' clinician/patient monitoring consistency');
  assert.deepEqual(runtime.definitions[code],journeys[code],route+' live journey data');assert.equal(journeys[code].summary,d.schedule_summary,route+' journey schedule');
  assert.deepEqual(journeys[code].lanes.map(x=>({label:x.label,cells:x.cells})),d.monitoring_schedule.rows,route+' journey tests');
 }
 checks++;
}
const profile=c=>json('data/patient-knowledge/'+c+'.json');
assert(/1[–-]4/.test(profile('00314').schedule_summary),'00314 divided cisplatin schedule');
assert(/nasopharyn/i.test(profile('00552').indication_text),'00552 specific nasopharyngeal indication');assert.equal(profile('00552').patient_summary.card_cycle_count,3);
assert.equal(profile('00696').patient_summary.card_cycle_count,null,'No invented fixed paclitaxel/cetuximab duration');
for(const code of ['00417','00418'])assert(!/patient\/00207\/head_neck/.test(read('patient/'+code+'/index.html').toString()),'No RT-only maintenance misroute');
const visibility=require('../js/library-scope-v08441.js');assert.equal(visibility.haematologyEnabled,false);assert.equal(index.filter(e=>visibility.isHaematology(json(e.path))).length,15);
console.log(JSON.stringify({release:'0.84.47',status:'passed',routes:12,new_full_services:5,repeat_audits:5,protocol_catalogue:index.length,checks,limits:'Source boundary, PDF geometry, browser and independent clinical review reported separately.'}));
