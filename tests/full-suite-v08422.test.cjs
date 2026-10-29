'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),crypto=require('crypto'),vm=require('vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p)),digest=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
const idx=json('data/lung-core-v08422-source-index.json'),codes=idx.codes,KB=json('data/regimen-knowledge-base-v08422-addendum.json'),support=json('data/phase-support-v0838.json').regimens,J=require('../js/treatment-journey-v0837'),V=require('../js/treatment-evidence-v08413'),D=require('../js/protocol-dose-schedule'),R=require('../js/patient-asset-registry-v0810'),E=require('../js/assessment-engine');
const protocols=json('protocols/index.json').protocols;
assert.equal(codes.length,10);assert.equal(idx.new_codes.length,5);assert.equal(idx.retrospective_codes.length,5);assert.equal(KB.regimen_profiles.length,10);
for(const c of codes){
 const d=json(`data/patient-knowledge/${c}.json`),p=json(protocols.find(p=>p.path.includes('/'+c+'-')).path),k=KB.regimen_profiles.find(x=>x.protocol_id===p.protocol_id),plans=support[c];
 assert.equal(d.suite_release,'0.84.22');assert.equal(String(d.protocol_version),String(p.metadata.nccp_version));
 for(const key of ['consultant_reviewed','oncology_pharmacy_reviewed','clinical_use_authorised'])assert.equal(p.metadata.validation[key],false,c+'/'+key);
 assert.equal(E.assess(p,{}).complete,false);assert.notEqual(E.assess(p,{}).actionType,'proceed');
 assert.equal(d.evidence.metrics.length,0);assert.equal(d.cycle_display,'reference-chronology');assert(k.treatment_rationale.line);assert.equal(k.full_suite_release,'0.84.22');assert.deepEqual(k.monitoring_and_toxicity.longitudinal_schedule,d.monitoring_schedule);
 assert(k.evidence_at_a_glance.sources.length);for(const e of k.evidence_at_a_glance.endpoints){assert(V.endpoints[e.endpoint],c+': unsupported endpoint '+e.endpoint);assert(e.metric&&e.interpretation&&e.sources.length)}assert(!/undefined|\[object Object\]/.test(V.render(k)));
 const j=J.definitions[c];assert.equal(j.has_patient_dates,false);for(const lane of j.lanes){assert.equal(lane.cells.length,j.stages.length);for(const id of lane.source_ids)assert(j.sources.some(x=>x.id===id))}
 assert(D.buildModel(p).phases.length,c+' lacks complete schedule');assert.equal(R.relativePath(c,'knowledge'),['00455','00558'].includes(c)?`patient/${c}/scope.html?asset=knowledge`:`patient/${c}/knowledge.html`);
 assert(plans.length);for(const plan of plans){assert(plan.source_url&&plan.source_checked);assert.equal(new Set(plan.additional_support).size,plan.additional_support.length)}
 for(const n of ['index','knowledge','consent','consent-form','guide','passport','sactcard','logistics','supportive-care','treatment-journey',...plans.map(x=>'support-'+x.id)]){const html=read(`patient/${c}/${n}.html`);assert(!/undefined|\[object Object\]/.test(html),c+'/'+n);if(['index','knowledge','treatment-journey'].includes(n))assert(!/<input|<select/.test(html),'Date-free '+c+'/'+n);for(const m of html.matchAll(/(?:src|href)="([^"#]+)"/g)){if(/^(https?:|data:|mailto:|tel:)/.test(m[1]))continue;assert(fs.existsSync(path.resolve(root,'patient',c,m[1].split(/[?#]/)[0])),c+'/'+n+': '+m[1])}}
 for(const n of ['guide','consent-form','passport','sactcard','logistics','supportive-care','treatment-journey',...plans.map(x=>'support-'+x.id)])assert.deepEqual(fs.readFileSync(`${root}/patient/${c}/${n}.pdf`),fs.readFileSync(`${root}/docs/patient/${c}/${n}.pdf`));
 assert(!json('data/breast-library-contexts-v0837.json').regimens[c],c+' must not enter breast indication selector');
}
for(const c of ['00455','00558']){
 const d=json(`data/patient-knowledge/${c}.json`);assert(/lung|NSCLC/i.test(d.title+' '+d.context_label));assert(/adjuvant/i.test(d.schedule_summary));
 const script=read('assets/patient/lung-indication-scope-v08422.js');for(const [query,expected] of [['?asset=knowledge','knowledge.html'],['?asset=guide','guide.pdf'],['?asset=https://example.com','./']]){const link={href:null};vm.runInNewContext(script,{window:{location:{search:query}},URLSearchParams,document:{getElementById:id=>id==='lung-material'?link:null}});assert.equal(link.href,expected)}
 assert(read(`patient/${c}/scope.html`).includes('non-small-cell lung cancer'));
}
for(const c of ['00713','00714']){const d=json(`data/patient-knowledge/${c}.json`),p=json(protocols.find(p=>p.path.includes('/'+c+'-')).path),m=D.buildModel(p);assert.equal(d.cycle_days,42);assert.equal(m.phases.length,2);assert(/22/.test(d.passport_visit_note));assert.equal(support[c].length,3);assert(!read(`patient/${c}/knowledge.html`).includes('Paclitaxel Day 22'));}
for(const [c,expected] of [['00569',['pembrolizumab','pemetrexed']],['00579',['pembrolizumab']]]){const p=json(protocols.find(p=>p.path.includes('/'+c+'-')).path);const phase=p.treatment_phases.find(x=>x.phase_id==='maintenance');assert.deepEqual(phase.active_drugs,expected);}
const inventory=json('validation/lung-core-v08422/retrospective-inventory.json');assert.equal(inventory.authored_suites,116);assert.equal(inventory.reviewed_cumulative,116);assert.equal(inventory.remaining_review_queue,0);assert.equal(protocols.length,377);assert(read('index.html').includes('Feasibility evaluation build — not for routine clinical use'));
assert.equal(fs.readdirSync(path.join(root,'data/patient-knowledge')).filter(x=>x.endsWith('.json')).length,129);
const hashes=json('validation/lung-core-v08422/retrospective-hashes.json');for(const [f,h] of Object.entries(hashes.files))assert.equal(digest(f),require('./helpers/retrospective-v08423.cjs').expectedHash(f,h.after),f);
const base=json('validation/lung-core-v08422/baseline-hashes.json');for(const [f,h] of Object.entries(base.files)){if(!f.startsWith('tools/')&&!hashes.files[f])assert.equal(digest(f),require('./helpers/retrospective-v08423.cjs').expectedHash(f,h),'Outside-scope bundle changed '+f)}
const pdf=json('validation/lung-core-v08422/pdf-validation.json');assert.equal(pdf.documents,71+codes.reduce((n,c)=>n+support[c].length,0));assert.equal(json('validation/lung-core-v08422/qr-validation.json').length,40);
console.log('v0.84.22: ten complete lung suites, date-free monitoring, separate maintenance support, guarded shared indications, PDF copies and unchanged outside-scope patient bundles.');

const Course=require('../js/regimen-course-metadata');
for(const [type,text] of [['phased_course','Up to 4 induction cycles, then maintenance'],['cycle_range','4–6 cycles; separate pemetrexed maintenance review'],['fixed_duration','Maximum 12 months (26 cycles)']]) {
 const protocol={metadata:{regimen_card:{contexts:[{id:'test',duration_type:type,duration_text:text,planned_cycles:type==='phased_course'?4:undefined}]}}};
 const roundTrip=Course.serialisableRegimenCard(protocol);
 assert.equal(Course.summarise({metadata:{regimen_card:roundTrip}}).duration,text);
}
