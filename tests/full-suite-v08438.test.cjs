'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8'),json=f=>JSON.parse(read(f)),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const scope=json('validation/neuro-oncology-v08438/scope.json'),presentation=json('data/patient-presentation-v08431.json'),index=json('protocols/index.json').protocols;
const registry=require('../js/patient-asset-registry-v0810.js'),kb=json('data/regimen-knowledge-base-v08438-addendum.json');
assert.deepEqual(scope.codes,['00334','00342','00379','00461','00658']);
require('./helpers/neuro-suite-registration-v08438.cjs').registry(registry.codes);
assert.equal(json('package.json').version,'0.84.38');assert.equal(json('data/app-release.json').release,'0.84.38');
assert.equal(scope.base_release,'0.84.37');assert.equal(scope.independent_clinical_approval,false);
const proto=c=>json(index.find(x=>x.path.includes('/'+c+'-')).path);
for(const code of scope.codes){
 const route=code,d=json(presentation.routes[route]),p=proto(code);
 assert.equal(d.protocol_id,p.protocol_id,code+' identity');assert.equal(String(d.protocol_version),String(p.metadata.nccp_version),code+' source version');
 assert.equal(d.suite_release,'0.84.38');assert.equal(d.patient_summary.template_version,'0.84.38');
 assert.equal(p.metadata.clinical_audit_release,'0.84.38');assert.equal(p.metadata.validation.clinical_use_authorised,false);
 assert.equal(d.sources.find(s=>s.id==='nccp').url,p.metadata.source_url,code+' clinical/patient source identity');
 assert.match(p.metadata.source_pdf_sha256,/^[a-f0-9]{64}$/);
 assert(d.anatomy.length>=8,code+' detailed anatomical anchors');assert(d.chapters.length>=8,code+' extended education');assert(d.monitoring_schedule.rows.length>=3);
 assert(d.sources.some(s=>s.id==='nccn-patient'),code+' educational reference credited');assert.deepEqual(d.evidence.metrics,[],code+' no unverified numeric benefit claim');
 for(const name of ['index','guide','knowledge','consent-form','passport','sactcard','supportive-care','treatment-journey','logistics'])assert(fs.existsSync(path.join(root,'patient',route,name+'.html')),route+'/'+name);
 for(const name of ['guide','sactcard','knowledge','handbook','passport','consent-form','supportive-care','treatment-journey','logistics']){
  const b=fs.readFileSync(path.join(root,'patient',route,name+'.pdf'));assert.equal(b.subarray(0,4).toString(),'%PDF');assert.deepEqual(b,fs.readFileSync(path.join(root,'docs/patient',route,name+'.pdf')),route+' mirror '+name);
 }
 for(const leaf of ['index.html','guide.html','knowledge.html']){
  const h=read('patient/'+route+'/'+leaf);assert.equal((h.match(/data-authored-map/g)||[]).length,1,route+' one anatomical map in '+leaf);assert.match(h,/Full-body anatomical illustration/);
  for(const a of d.anatomy)assert(h.includes(a[3].replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;')),route+' retained explanatory text '+a[0]);
 }
 const pass=read('patient/'+route+'/passport.html');for(const word of ['My diagnosis, plan and medicines','My scans, symptoms and support','IDH','1p/19q','MGMT'])assert(pass.includes(word),route+' passport '+word);
 const card=read('patient/'+route+'/sactcard.html');assert.match(card,/85.6 × 54 mm/);assert.match(card,/EXAMPLE NUMBERS/);assert.match(card,/FOLD centre/);assert.match(card,/oncowiki-qr.png/);
 const kp=kb.regimen_profiles.find(x=>x.protocol_id===p.protocol_id);assert(kp,route+' clinician knowledge');
 const plans=json('data/phase-support-v0838.json').regimens[code];assert(plans.length>0);
 for(const plan of plans){assert(plan.medicines.length>0,code+' populated supportive draft');assert(plan.guidance.url.includes('/7152/'),code+' oral SACT national guidance');assert(plan.additional_support.some(x=>x.includes('not an issued prescription')));}
 if(['00379','00658'].includes(code)){assert.deepEqual(plans.map(x=>x.id),['lomustine_day1','procarbazine_days8_21','vincristine_day29']);assert.equal(plans[2].emetogenic_risk,'minimal');assert(!fs.existsSync(path.join(root,'patient',route,'support-treatment.pdf')));}

 for(const plan of plans)for(const suffix of ['html','pdf'])assert(fs.existsSync(path.join(root,'patient',route,'support-'+plan.id+'.'+suffix)),route+' phase '+plan.id);
 assert.deepEqual(registry.bundleRoutes(code),[code]);
}
const profiles=Object.fromEntries(scope.codes.map(c=>[c,json(presentation.routes[c])]));
assert.equal(profiles['00379'].cycle_days,42);assert.equal(profiles['00658'].cycle_days,56);
for(const c of ['00334','00461'])assert(profiles[c].phases.length>=2,c+' concurrent and adjuvant phases');
const baseline=json('validation/neuro-oncology-v08438/baseline-v08437-file-hashes.json');let preserved=0;
for(const [f,h]of Object.entries(baseline)){
 if(!/^(?:patient|docs\/patient)\//.test(f))continue;
 assert.equal(sha(fs.readFileSync(path.join(root,f))),h,'Existing patient output preserved: '+f);preserved++;
}
assert(preserved>6800,'Meaningful existing-patient preservation coverage');
console.log('v0.84.38 five glioma suites: source identity, complete anatomy, phase support, passport, mirrors, routing and '+preserved+' preserved patient files pass.');
