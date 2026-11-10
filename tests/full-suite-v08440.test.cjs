'use strict';
// v44 replaces NCCN-based patient prose with original, source-audited SACTCheck
// explanations. Keep disease-specific evidence checks and clinical invariants.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8'),json=f=>JSON.parse(read(f)),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const scope=json('validation/skin-melanoma-v08440/scope.json'),presentation=json('data/patient-presentation-v08431.json'),index=json('protocols/index.json').protocols;
const registry=require('../js/patient-asset-registry-v0810.js'),kb=json('data/regimen-knowledge-base-v08440-addendum.json');
assert.deepEqual(scope.codes,['00236','00415','00563','00431','00812']);assert.equal(scope.clinical_audits.length,10);assert.equal(scope.presentation_routes.length,6);
require('./helpers/skin-suite-registration-v08440.cjs').registry(registry.codes);
assert(['0.84.41','0.84.42','0.84.43','0.84.44','0.84.45','0.84.46'].includes(json('package.json').version));assert.equal(json('data/app-release.json').release,json('package.json').version);
assert.equal(scope.base_release,'0.84.39');assert.equal(scope.independent_clinical_approval,false);
const proto=c=>json(index.find(x=>x.path.includes('/'+c+'-')).path);
const esc=t=>t.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
for(const route of scope.presentation_routes){
 const code=route.split('/')[0],d=json(presentation.routes[route]),p=proto(code);
 assert.equal(d.protocol_id,p.protocol_id,route+' identity');assert.equal(String(d.protocol_version),String(p.metadata.nccp_version),route+' source version');
 assert(d.chronology_notes.every(n=>typeof n.title==='string'&&typeof n.text==='string'&&n.text.length>10),route+' complete chronology labels and explanations');
 assert.equal(d.patient_summary.card_title,d.agents.map(a=>a.name).join(' + '),route+' wallet names actual medicines');
 assert.equal(d.suite_release,'0.84.40');assert.equal(d.patient_summary.template_version,'0.84.40');
 const emesis=json('data/emetogenic-risk-map.json').protocols[code];
 assert.equal(emesis.level,p.supportive_care.emetogenic_risk,code+' central and protocol antiemetic category');
 assert.equal(emesis.script_id,p.supportive_care.script_id,code+' central and protocol antiemetic script');
 assert.equal(p.metadata.clinical_audit_release,'0.84.40');assert.equal(p.metadata.validation.clinical_use_authorised,false);
 assert.equal(d.sources.find(s=>s.id==='nccp').url,p.metadata.source_url,route+' clinical/patient source identity');
 assert.match(p.metadata.source_pdf_sha256,/^[a-f0-9]{64}$/);
 assert(d.anatomy.length>=8,route+' detailed anatomical anchors');assert(d.chapters.length>=8,route+' extended education');assert(d.monitoring_schedule.rows.length>=3);
 assert.equal(d.patient_editorial_revision.version,'0.84.44');assert(!d.sources.some(s=>/nccn/i.test(s.id+' '+s.url)),route+' independent SACTCheck patient text');assert(d.sources.some(s=>['ed-melanoma','ed-skin'].includes(s.id)&&new URL(s.url).hostname==='www.cancer.gov'),route+' open disease-specific patient evidence');assert.deepEqual(d.evidence.metrics,[],route+' no unverified numeric benefit claim');
 for(const name of ['index','guide','knowledge','consent-form','passport','sactcard','supportive-care','treatment-journey','logistics'])assert(fs.existsSync(path.join(root,'patient',route,name+'.html')),route+'/'+name);
 for(const name of ['guide','sactcard','knowledge','handbook','passport','consent-form','supportive-care','treatment-journey','logistics']){
  const b=fs.readFileSync(path.join(root,'patient',route,name+'.pdf'));assert.equal(b.subarray(0,4).toString(),'%PDF');assert.deepEqual(b,fs.readFileSync(path.join(root,'docs/patient',route,name+'.pdf')),route+' mirror '+name);
 }
 for(const leaf of ['index.html','guide.html','knowledge.html']){
  const h=read('patient/'+route+'/'+leaf);assert(!/>\s*undefined(?:[:<])/.test(h),route+' no missing visible template value');assert.equal((h.match(/data-authored-map/g)||[]).length,1,route+' one anatomical map in '+leaf);assert.match(h,/Full-body anatomical illustration/);
  for(const a of d.anatomy)require('./helpers/patient-visible-text-v08444.cjs').assertVisibleTextIncludes(h,a[3],route+' retained anatomical explanation '+a[0]);
 }
 const pass=read('patient/'+route+'/passport.html');for(const word of ['My diagnosis, plan and medicines','My checks, symptoms and support','My urgent contact plan'])assert(pass.includes(word),route+' passport '+word);
 const card=read('patient/'+route+'/sactcard.html');assert.match(card,/85.6 × 54 mm/);assert.match(card,/EXAMPLE NUMBERS/);assert.match(card,/FOLD centre/);assert.match(card,/oncowiki-qr.png/);
 assert(kb.regimen_profiles.some(x=>x.protocol_id===p.protocol_id),route+' clinician knowledge');
 const plans=route.includes('/')?json('data/phase-support-contexts-v08440.json').regimens[code].adjuvant:json('data/phase-support-v0838.json').regimens[code];assert(plans.length>0);
 for(const plan of plans){assert(plan.additional_support.some(x=>x.includes('not an issued prescription')));for(const suffix of ['html','pdf'])assert(fs.existsSync(path.join(root,'patient',route,'support-'+plan.id+'.'+suffix)),route+' phase '+plan.id);}
}
for(const code of scope.clinical_audits)require('./helpers/skin-inputs-v08440.cjs').validate(proto(code));
assert.deepEqual(registry.bundleRoutes('00415'),['00415','00415/adjuvant']);
for(const asset of ['portal','guide','knowledge','passport','sact-card','consent-draft','longitudinal']){
 const a=registry.relativePath('00415',asset,'advanced'),b=registry.relativePath('00415',asset,'adjuvant');assert(a.startsWith('patient/00415/')&&!a.includes('adjuvant'));assert(b.startsWith('patient/00415/adjuvant/'));assert(registry.relativePath('00415',asset).includes('scope.html'));
 for(const code of ['00431','00812'])assert(registry.relativePath(code,asset).includes('scope.html'));
}
const adv=json(presentation.routes['00415']),adj=json(presentation.routes['00415/adjuvant']);assert(/advanced|unresectable|metastatic/i.test(adv.context_label));assert(/adjuvant/i.test(adj.context_label));assert(/12 months/i.test(JSON.stringify(adj)));assert.notDeepEqual(adv.phases,adj.phases);
const baseline=json('validation/skin-melanoma-v08440/baseline-v08439-file-hashes.json');let preserved=0;
for(const [f,h]of Object.entries(baseline)){
 if(!/^(?:patient|docs\/patient)\//.test(f))continue;
 assert.equal(sha(fs.readFileSync(path.join(root,f))),require('./helpers/retrospective-v08440.cjs').expectedHash(f,h),'Existing patient output preserved or explicitly migrated: '+f);preserved++;
}
assert(preserved>7000,'Meaningful existing-patient preservation coverage');
console.log('v0.84.40 five skin protocols / six patient contexts / five repeat audits: source identity, full anatomy, phase support, passport, mirrors, context routing and '+preserved+' preserved patient files pass.');
// Render the actual clinician evidence module: valid JSON alone did not catch an
// array/string schema mismatch or silently omitted outcome cards in the UI.
const evidenceRenderer=require('../js/treatment-evidence-v08413.js');
let evidenceProfiles=0;
for(const base of kb.regimen_profiles.filter(x=>scope.codes.some(c=>x.protocol_id.includes(c)))){
 for(const x of [base,...(base.context_profiles||[])]){
  const rendered=evidenceRenderer.render(x);assert(rendered.includes('Evidence at a glance'));
  for(const row of x.evidence_at_a_glance.endpoints){assert(evidenceRenderer.endpoints[row.endpoint]);assert(rendered.includes(esc(row.result_text)),x.protocol_id+' all source outcomes rendered');}
  for(const [key,fields]of Object.entries({patient_selection:['disease_and_biomarker_context','eligibility_orientation'],supportive_care:['premedication_and_prophylaxis','patient_education','special_support'],monitoring_and_toxicity:['baseline','before_each_cycle','ongoing','urgent_review_signals'],administration:['route_and_duration','practical_workflow','observation_and_access']}))for(const field of fields)assert(Array.isArray(x[key][field])&&x[key][field].length,x.protocol_id+' visible list '+key+'/'+field);
  assert(x.monitoring_and_toxicity.longitudinal_schedule.rows.length);
  if(x.context_id==='adjuvant'){assert.match(x.regimen_role,/after complete resection/);assert.match(x.administration.cycle_and_sequence,/12 months/);assert(!JSON.stringify(x.monitoring_and_toxicity.baseline).includes('advanced-disease treatment goal'));}
  evidenceProfiles++;
 }
}
for(const route of scope.presentation_routes)assert(read('patient/'+route+'/knowledge.html').includes('href="#anatomical-effects"'),route+' anatomy jump uses the local expanded map');
console.log('Actual clinician evidence rendering and complete module schema passed for '+evidenceProfiles+' profiles/context records.');
