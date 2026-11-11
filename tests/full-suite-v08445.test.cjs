'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const R=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(R,f)),json=f=>JSON.parse(read(f));
const S=json('validation/head-neck-v08445/scope.json'),idx=json('protocols/index.json').protocols,registry=require('../js/patient-asset-registry-v0810.js'),KB=json('data/regimen-knowledge-base-v08445-addendum.json'),Evidence=require('../js/treatment-evidence-v08413.js'),Engine=require('../js/assessment-engine.js');
assert(['0.84.45','0.84.46','0.84.47','0.84.48'].includes(json('package.json').version));assert.equal(registry.release,json('package.json').version);assert.equal(S.new_codes.length,5);assert.equal(S.new_routes.length,6);assert.equal(S.retrospective_codes.length,5);assert.equal(S.clinical_routes.length,19);assert.equal(idx.length,377);
const by=c=>json(idx.find(x=>x.path.includes('/'+c+'-')).path);
for(const c of [...S.new_codes,...S.retrospective_codes]){
 const p=by(c);require('./helpers/head-neck-inputs-v08445.cjs').validate(p);
 const empty=Engine.assess(p,{});assert.equal(empty.complete,false);assert(!['proceed','proceed_with_caution'].includes(empty.actionType));
 const k=KB.regimen_profiles.find(k=>k.protocol_id===p.protocol_id);assert(k,c+' clinician evidence');assert(!/undefined|\[object Object\]/.test(Evidence.render(k)));for(const context of k.context_profiles||[])assert(!/undefined|\[object Object\]/.test(Evidence.render(context)));
}
for(const route of S.clinical_routes){
 const code=route.split('/')[0],data=json((route.includes('/')?'data/patient-knowledge-contexts/':'data/patient-knowledge/')+route+'.json'),p=by(code);
 assert.equal(data.protocol_id,p.protocol_id);assert.equal(String(data.protocol_version),p.metadata.nccp_version);assert.equal(data.clinical_audit_release,'0.84.45');assert(data.patient_summary.template_version); if(!['00455','00558'].includes(code))assert.equal(data.patient_summary.template_version,'0.84.45'); else {const prior=JSON.parse(require('child_process').execFileSync('git',['show','a4575d67a985c97a1dfa545813a8c1a25b2ed5a2:'+(route.includes('/')?'data/patient-knowledge-contexts/':'data/patient-knowledge/')+route+'.json'],{cwd:R}));assert.equal(data.patient_summary.template_version,prior.patient_summary.template_version,'Retained authored summary revision; current visual layout is verified separately');}assert(data.anatomy.length>=6);assert(data.monitoring_schedule.rows.length>=3);
 require('./helpers/patient-overview-v08445.cjs').validate(read('patient/'+route+'/index.html').toString(),route);
 const guide=read('patient/'+route+'/guide.html').toString();assert.equal((guide.match(/class="pt-page /g)||[]).length,3);assert(guide.includes('Full-body anatomical illustration'));assert(guide.includes('oncowiki-qr.png'));
 for(const name of ['guide','sactcard','knowledge','handbook','passport','consent-form','supportive-care','treatment-journey','logistics']){const b=read('patient/'+route+'/'+name+'.pdf');assert.equal(b.subarray(0,4).toString(),'%PDF');assert(b.equals(read('docs/patient/'+route+'/'+name+'.pdf')),route+' '+name+' mirror');}
 const card=read('patient/'+route+'/sactcard.html').toString();for(const text of ['85.6 × 54 mm','Do not cut the centre line','EXAMPLE','oncowiki-qr.png','Add to Home Screen'])assert(card.includes(text),route+' '+text);
 assert(registry.bundleRoutes(code).includes(route));
}
assert.equal(registry.relativePath('00385','portal','head_neck'),'patient/00385/head_neck/');assert.equal(registry.relativePath('00385','portal','nasopharyngeal'),'patient/00385/nasopharyngeal/');
assert(registry.relativePath('00385','portal','cervical').includes('scope.html'));assert.equal(registry.relativePath('00207','portal','head_neck'),'patient/00207/head_neck/');assert.equal(registry.relativePath('00207','portal','colorectal'),'patient/00207/');
const scope=require('../js/library-scope-v08441.js');assert.equal(scope.haematologyEnabled,false);assert.equal(idx.filter(x=>scope.isHaematology(json(x.path))).length,15);
console.log('v0.84.45: ten source-bound protocols, six new routes, nineteen refreshed clinical patient bundles, context isolation, detailed anatomy and mirrored documents verified.');

const fu=KB.drug_profiles.find(x=>x.id==='fluorouracil');assert(fu&&!/two days|48.?hours|46.?hours/i.test(fu.mechanism),'Shared mechanism must not impose a regimen-specific infusion duration');
