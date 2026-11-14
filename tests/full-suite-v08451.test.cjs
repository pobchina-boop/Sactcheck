'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const R=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(R,f)),json=f=>JSON.parse(read(f)),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const scope=json('validation/prostate-v08451/scope.json'),index=json('protocols/index.json').protocols,A=require('../js/patient-asset-registry-v0810.js'),K=json('data/regimen-knowledge-base-v08451-addendum.json'),W=require('../js/regimen-workflow-engine-v0750.js'),workflow=json('data/regimen-workflow-v0750.json');
assert(['0.84.51','0.84.52'].includes(json('package.json').version));assert.equal(A.release,json('package.json').version);assert.equal(index.length,377);assert.equal(A.codes.length,json('package.json').version==='0.84.52'?233:228);assert.equal(A.codes.flatMap(c=>A.bundleRoutes(c)).length,json('package.json').version==='0.84.52'?260:255);assert.equal(require('../tools/apply-patient-visual-standard-v08443.cjs').discoverRoutes(R).length,json('package.json').version==='0.84.52'?269:264);assert.equal(scope.new_routes.length,5);assert.equal(scope.retrospective_codes.length,5);
const norm=s=>s.replace(/&#(?:039|39);/g,"'").replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ').trim();let documents=0;
const codes={ '00103':['00103a','00103b'],'00577':['00577a'],'00233':['00233a','00233b','00233c'],'00574':['00574a','00574b'],'00693':['00693a']};
for(const route of scope.new_routes){
 const profile=json('data/patient-knowledge/'+route+'.json'),p=json(index.find(x=>x.path.includes('/'+route+'-')).path);
 require('./helpers/prostate-inputs-v08451.cjs').validate(p);assert.equal(profile.protocol_id,p.protocol_id);assert.equal(String(profile.protocol_version),p.metadata.nccp_version);assert.equal(profile.visual_release,'0.84.51');assert(profile.anatomy.length>=8);assert(A.bundleRoutes(route).includes(route));assert.deepEqual(p.indications.map(x=>x.code),codes[route]);
 const guide=read('patient/'+route+'/guide.html').toString(),card=read('patient/'+route+'/sactcard.html').toString(),consent=norm(read('patient/'+route+'/consent-form.html').toString());
 assert.equal((guide.match(/class="pt-page /g)||[]).length,3);assert(guide.includes('Full-body anatomical illustration'));assert(guide.includes('oncowiki-qr.png'));
 require('./helpers/patient-overview-v08445.cjs').validate(read('patient/'+route+'/index.html').toString(),route);
 for(const text of ['85.6 × 54 mm','Do not cut the centre line','EXAMPLE','oncowiki-qr.png','Add to Home Screen'])assert(card.includes(text),route+' '+text);
 for(const a of profile.agents)for(const risk of a.risks)assert(consent.includes(norm(risk)),route+' consent risk '+risk);
 assert(consent.includes(norm(profile.consent_support)));assert.equal(profile.patient_summary.card_cycle_count,null);assert(card.includes('My review record'));assert(!card.includes('Planned cycles:'));assert(!guide.includes('A typical 28-day cycle'));
 for(const name of ['guide','sactcard','knowledge','handbook','passport','consent-form','supportive-care','treatment-journey','logistics','support-continuous']){const b=read('patient/'+route+'/'+name+'.pdf');assert.equal(b.subarray(0,4).toString(),'%PDF');assert(b.equals(read('docs/patient/'+route+'/'+name+'.pdf')),route+' '+name+' mirror');documents++;}
 const kb=K.regimen_profiles.find(x=>x.protocol_id===p.protocol_id);assert(kb);assert.deepEqual(kb.monitoring_and_toxicity.longitudinal_schedule,profile.monitoring_schedule);
 const phases=workflow.supportive_phase_selectors[route];assert.equal(phases.phases.length,1);
 for(const phase of phases.phases){const m=W.buildManifest(p,workflow,{},phase.id);assert.equal(m.supportPhase.id,phase.id);assert.deepEqual(m.components,phase.active_medicines);const plan=workflow.antiemetic_plans[phase.plan_id];assert.equal(plan.risk_level,'oral_minimal_low');}
 assert.equal(json('data/emetogenic-risk-map.json').protocols[route].script_id,p.supportive_care.script_id);
}
const retro=json('validation/prostate-v08451/clinical/retrospective-audit.json');for(const f of retro.unchanged_patient_files)assert.equal(sha(read(f.path)),f.sha256,f.path+' retained v50 bytes');
for(const name of ['pack-verification','handbook-verification','companion-published-verification']){const r=json('validation/prostate-v08451/pdf/'+name+'.json');assert(!r.failed_routes);assert(!r.failures?.length);assert(!/fail/.test(r.status));}
const daro=json('data/patient-knowledge/00693.json');assert(/nonmetastatic/i.test(daro.title));
for(const [c,dose] of [['00103','10 mg daily or 5 mg twice daily'],['00577','5 mg daily']]){const p=json(index.find(x=>x.path.includes('/'+c+'-')).path);assert.equal(p.treatment.administration.find(x=>/predni/i.test(x.drug)).dose,dose);}
const abi=json(index.find(x=>x.path.includes('/00577-')).path);for(const id of ['K_HOLD','K_URGENT']){const r=abi.rule_engine.rules.find(x=>x.id===id);assert.match(r.source.document,/Supplemental/);assert.match(r.source.url,/103_v9/);assert.match(r.source.scope_note,/not from NCCP 00577/);}
const redirectScript=read('404.html').toString().match(/<script>([\s\S]*?)<\/script>/)[1];for(const c of scope.new_routes)for(const [input,want] of [['/docs/patient/'+c+'/', '/patient/'+c+'/'],['/docs/patient/'+c+'/guide.html','/patient/'+c+'/guide.pdf'],['/patient/'+c,'/patient/'+c+'/']]){let actual;require('node:vm').runInNewContext(redirectScript,{location:{pathname:input,replace:s=>actual=s}});assert.equal(actual,want);}
assert.equal(require('../js/library-scope-v08441.js').haematologyEnabled,false);
console.log(JSON.stringify({release:'0.84.51',status:'passed',new_services:5,retrospective_services:5,documents,retained_patient_files:retro.unchanged_patient_files.length,independent_clinical_review:false}));
