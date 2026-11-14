'use strict';
// v44 replaces NCCN-based patient prose with original, source-audited SACTCheck
// explanations. Keep disease-specific evidence checks and clinical invariants.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8'),json=f=>JSON.parse(read(f)),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const scope=json('validation/neuroendocrine-v08437/scope.json'),presentation=json('data/patient-presentation-v08431.json'),index=json('protocols/index.json').protocols;
const registry=require('../js/patient-asset-registry-v0810.js'),kb=json('data/regimen-knowledge-base-v08437-addendum.json');
const groups={'00320':'everolimus','00327':'sunitinib','00505':'captem','00642':'prrt'};
assert.deepEqual(scope.codes,['00320','00327','00505','00642']);require('./helpers/neuro-suite-registration-v08438.cjs').registry(registry.codes);
assert(['0.84.41','0.84.42','0.84.43','0.84.44','0.84.45','0.84.46','0.84.47','0.84.48','0.84.49','0.84.50','0.84.51','0.84.52'].includes(json('package.json').version));assert.equal(json('data/app-release.json').release,json('package.json').version);
const proto=c=>json(index.find(x=>x.path.includes('/'+c+'-')).path);
for(const route of scope.presentation_routes){
 const code=route.slice(0,5),d=json(presentation.routes[route]),p=proto(code),audit='validation/neuroendocrine-v08437/'+groups[code]+'-source-audit/';
 assert.equal(d.protocol_id,p.protocol_id,route+' identity');assert.equal(String(d.protocol_version),String(p.metadata.nccp_version),route+' source version');
 assert.equal(d.suite_release,'0.84.37');assert.equal(d.patient_summary.template_version,'0.84.37');
 assert.equal(p.metadata.clinical_audit_release,'0.84.37');assert.equal(p.metadata.validation.audit_release,'0.84.37');assert.equal(p.metadata.validation.clinical_use_authorised,false);
 assert.equal(d.sources.find(s=>s.id==='nccp').url,p.metadata.source_url,route+' matching clinical/patient source');
 assert.equal(sha(fs.readFileSync(path.join(root,audit+'sources/'+code+'.pdf'))),p.metadata.source_pdf_sha256,route+' retained current primary source');
 const result=json(audit+'source-case-results.json');assert.equal(result.failed,0);assert(result.passed>100);assert.equal(result.passed,result.total||result.cases.length);
 assert(d.anatomy.length>=8,route+' full anatomical detail');if(code==='00642'){assert.deepEqual(d.chapters.map(c=>c.id),['prrt-monitoring','prrt-urgent','net-diagnosis','net-tests','net-symptoms','net-goals','net-support'],route+' consolidated chapters retain every required topic');}else assert(d.chapters.length>=8,route+' extensive education');assert(d.monitoring_schedule.rows.length>=3);
 assert.equal(d.patient_editorial_revision.version,'0.84.44');assert(!d.sources.some(s=>/nccn/i.test(s.id+' '+s.url)),route+' independent SACTCheck patient text');assert(d.sources.some(s=>s.id==='ed-net-patient'&&new URL(s.url).hostname==='www.cancer.gov'),route+' open disease-specific patient evidence');assert.deepEqual(d.evidence.metrics,[],route+' no unsupported numeric trial claim');
 for(const name of ['index','guide','knowledge','consent-form','passport','sactcard','supportive-care','treatment-journey','logistics'])assert(fs.existsSync(path.join(root,'patient',route,name+'.html')),route+'/'+name);
 for(const name of ['guide','sactcard','knowledge','handbook','passport','consent-form','supportive-care','treatment-journey','logistics']){
  const b=fs.readFileSync(path.join(root,'patient',route,name+'.pdf'));assert.equal(b.subarray(0,4).toString(),'%PDF');assert.deepEqual(b,fs.readFileSync(path.join(root,'docs/patient',route,name+'.pdf')),route+' mirror '+name);
 }
 for(const leaf of ['index.html','guide.html','knowledge.html']){
  const h=read('patient/'+route+'/'+leaf);assert.equal((h.match(/data-authored-map/g)||[]).length,1,route+' one full map in '+leaf);assert.match(h,/Full-body anatomical illustration/);
  for(const a of d.anatomy)require('./helpers/patient-visible-text-v08444.cjs').assertVisibleTextIncludes(h,a[3],route+' retained anatomy text '+a[0]);
 }
 const pass=read('patient/'+route+'/passport.html');for(const word of ['Ki-67','differentiation','SSTR','My tests, symptoms and support','My diagnosis, plan and priorities'])assert(pass.includes(word),route+' passport '+word);
 const card=read('patient/'+route+'/sactcard.html');assert.match(card,/85.6 × 54 mm/);assert.match(card,/EXAMPLE NUMBERS/);assert.match(card,/FOLD centre/);assert.match(card,/oncowiki-qr.png/);
 const kp=kb.regimen_profiles.find(x=>x.protocol_id===p.protocol_id);assert(kp,route+' clinician knowledge');
 const plans=code==='00320'?json('data/phase-support-contexts-v08437.json').regimens[code].neuroendocrine:json('data/phase-support-v0838.json').regimens[code];assert(plans.length>0);
 for(const plan of plans)for(const suffix of ['html','pdf'])assert(fs.existsSync(path.join(root,'patient',route,'support-'+plan.id+'.'+suffix)),route+' phase '+plan.id);
}
// Shared everolimus must retain all indications while its NET patient suite is explicit.
const ever=proto('00320');assert.deepEqual(ever.indications.map(x=>x.indication_id),['00320a','00320b','00320c']);
assert(ever.indications.find(x=>x.indication_id==='00320a').tumour_groups.includes('Genitourinary'));
assert.deepEqual(registry.bundleRoutes('00320'),['00320/neuroendocrine']);
for(const asset of ['portal','guide','passport','sact-card','knowledge','consent-draft','supportive-care','longitudinal']){
 assert.match(registry.relativePath('00320',asset,'neuroendocrine'),/^patient\/00320\/neuroendocrine\//);
 for(const wrong of ['','genitourinary','renal','gastrointestinal','lung'])assert.match(registry.relativePath('00320',asset,wrong),/^patient\/00320\/scope.html\?asset=/);
}
for(const n of ['index.html','scope.html'])assert.match(read('docs/patient/00320/'+n),/https:\/\/sactcheck.com\/patient\/00320\//,'Legacy route reaches context selector');
assert(!fs.existsSync(path.join(root,'patient/00320/guide.pdf')),'No ambiguous default everolimus NET PDF');
const ek=kb.regimen_profiles.find(x=>x.protocol_id===ever.protocol_id);assert(ek.context_profiles.some(x=>x.context_id==='neuroendocrine'));assert(!ek.patient_selection,'No NET-only selection at shared outer profile');
const sun=proto('00327'),cap=proto('00505'),prrt=proto('00642');assert.equal(sun.treatment.cycle_length_days,28);assert.equal(sun.treatment.duration_type,'until_progression_or_toxicity');assert.equal(prrt.treatment.planned_cycles,4);assert.equal(prrt.treatment.cycle_length_days,56);
assert.equal(cap.treatment.planned_cycles,6);assert(cap.metadata.tumour_groups.includes('Neuroendocrine'));
const map=json('data/emetogenic-risk-map.json');
for(const c of scope.codes){const s=proto(c).supportive_care;assert.equal(s.emetogenic_risk,map.protocols[c].level);assert.equal(s.script_id,map.protocols[c].script_id);assert.equal(s.supportive_medications_label,map.scripts[s.script_id].label);}
assert.equal(map.protocols['00642'].script_id,'nccp-prrt-v08437');assert.match(map.scripts['nccp-prrt-v08437'].summary,/not first-line/);assert.match(map.scripts['nccp-captem-v08437'].summary,/Days 10–14/);
const prrtCard=read('patient/00642/sactcard.html');assert.match(prrtCard,/Planned administrations: 4/);assert.doesNotMatch(prrtCard,/weekly doses/);
console.log('v0.84.37 four NET suites: source identities, clinical audit evidence, full anatomy, education, care records, indication routing, phase support and mirrored deliverables pass.');
