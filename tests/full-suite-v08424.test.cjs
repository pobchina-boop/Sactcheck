'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),crypto=require('crypto'),vm=require('vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p)),digest=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
const idx=json('data/targeted-lung-v08424-source-index.json'),codes=idx.codes,KB=json('data/regimen-knowledge-base-v08424-addendum.json'),support=json('data/phase-support-v0838.json').regimens,J=require('../js/treatment-journey-v0837'),V=require('../js/treatment-evidence-v08413'),D=require('../js/protocol-dose-schedule'),R=require('../js/patient-asset-registry-v0810'),E=require('../js/assessment-engine');
const protocols=json('protocols/index.json').protocols;
assert.equal(codes.length,7);assert.equal(idx.new_codes.length,5);assert.equal(idx.retrospective_codes.length,2);assert.equal(KB.regimen_profiles.length,7);
for(const c of codes){
 const d=json(`data/patient-knowledge/${c}.json`),p=json(protocols.find(p=>p.path.includes('/'+c+'-')).path),k=KB.regimen_profiles.find(x=>x.protocol_id===p.protocol_id),plans=support[c];
 assert.equal(d.suite_release,'0.84.24');assert.equal(String(d.protocol_version),String(p.metadata.nccp_version));
 for(const key of ['consultant_reviewed','oncology_pharmacy_reviewed','clinical_use_authorised'])assert.equal(p.metadata.validation[key],false,c+'/'+key);
 assert.equal(E.assess(p,{}).complete,false);assert.notEqual(E.assess(p,{}).actionType,'proceed');
 assert.equal(d.evidence.metrics.length,0);if(idx.new_codes.includes(c)){assert.equal(d.cycle_days,null);assert.equal(d.schedule_kind,'continuous_oral');assert(d.endocrine_timeline);assert(!/null-day|28-day cycle|21-day cycle/.test(read(`patient/${c}/index.html`)));}else assert.equal(d.cycle_display,'reference-chronology');assert(k.treatment_rationale.line);assert.equal(k.full_suite_release,'0.84.24');assert.deepEqual(k.monitoring_and_toxicity.longitudinal_schedule,d.monitoring_schedule);
 assert(k.evidence_at_a_glance.sources.length);for(const e of k.evidence_at_a_glance.endpoints){assert(V.endpoints[e.endpoint],c+': unsupported endpoint '+e.endpoint);assert(e.metric&&e.interpretation&&e.sources.length)}assert(!/undefined|\[object Object\]/.test(V.render(k)));
 const j=J.definitions[c];assert.equal(j.has_patient_dates,false);for(const lane of j.lanes){assert.equal(lane.cells.length,j.stages.length);for(const id of lane.source_ids)assert(j.sources.some(x=>x.id===id))}
 assert(D.buildModel(p).phases.length,c+' lacks complete schedule');assert.equal(R.relativePath(c,'knowledge'),`patient/${c}/knowledge.html`);
 assert(plans.length);for(const plan of plans){assert(plan.source_url&&plan.source_checked);assert.equal(new Set(plan.additional_support).size,plan.additional_support.length)}
 for(const n of ['index','knowledge','consent','consent-form','guide','passport','sactcard','logistics','supportive-care','treatment-journey',...plans.map(x=>'support-'+x.id)]){const html=read(`patient/${c}/${n}.html`);assert(!/undefined|\[object Object\]/.test(html),c+'/'+n);if(['index','knowledge','treatment-journey'].includes(n))assert(!/<input|<select/.test(html),'Date-free '+c+'/'+n);for(const m of html.matchAll(/(?:src|href)="([^"#]+)"/g)){if(/^(https?:|data:|mailto:|tel:)/.test(m[1]))continue;assert(fs.existsSync(path.resolve(root,'patient',c,m[1].split(/[?#]/)[0])),c+'/'+n+': '+m[1])}}
 for(const n of ['guide','consent-form','passport','sactcard','logistics','supportive-care','treatment-journey',...plans.map(x=>'support-'+x.id)])assert.deepEqual(fs.readFileSync(`${root}/patient/${c}/${n}.pdf`),fs.readFileSync(`${root}/docs/patient/${c}/${n}.pdf`));
 assert(!json('data/breast-library-contexts-v0837.json').regimens[c],c+' must not enter breast indication selector');
}
const inventory=json('validation/targeted-lung-v08424/retrospective-inventory.json');assert.equal(inventory.authored_suites,129);assert.equal(inventory.reviewed_cumulative,129);assert.equal(inventory.remaining_review_queue,0);assert.equal(protocols.length,377);assert(read('index.html').includes('Feasibility evaluation build — not for routine clinical use'));
assert.equal(fs.readdirSync(path.join(root,'data/patient-knowledge')).filter(x=>x.endsWith('.json')).length,134);
const hashes=json('validation/targeted-lung-v08424/retrospective-hashes.json');for(const [f,h] of Object.entries(hashes.files))assert.equal(digest(f),h.after,f);
const base=json('validation/targeted-lung-v08424/baseline-hashes.json');for(const [f,h] of Object.entries(base.files)){if(!f.startsWith('tools/')&&!hashes.files[f])assert.equal(digest(f),h,'Outside-scope bundle changed '+f)}
const pdf=json('validation/targeted-lung-v08424/pdf-validation.json');assert.equal(pdf.documents,49+codes.reduce((n,c)=>n+support[c].length,0));assert.equal(json('validation/targeted-lung-v08424/qr-validation.json').length,28);
console.log('v0.84.24: seven complete suites, date-free monitoring, continuous oral and route-specific schedules and support, PDF copies and unchanged outside-scope patient bundles.');



// Coverage includes the main consent generator, not just patient discussion sheets.
const consent=json('data/consent-content-v0710.json').agent_profiles;
for(const id of ['osimertinib','alectinib','brigatinib','lorlatinib','crizotinib']){
 assert(consent[id]&&consent[id].risks.length>=3,id+' needs medicine-specific consent risks');
 assert(consent[id].source_basis);assert(/pending|draft/i.test(consent[id].review_status));
}
assert.equal(R.codes.length,134);
assert(R.definitionFor('00831').contactCard);
assert.deepEqual(fs.readFileSync(root+'/patient/00831/contact-card.pdf'),fs.readFileSync(root+'/patient/00831/sactcard.pdf'));
for(const c of idx.new_codes){
 const p=json(protocols.find(p=>p.path.includes('/'+c+'-')).path);
 for(const phase of D.buildModel(p).phases)assert(!phase.cycleLength,'Continuous oral therapy must not acquire a chemotherapy cycle');
 assert(!/Breast adjuvant treatment only|ovarian.suppression/i.test(read(`patient/${c}/consent-form.html`)));
}

// The compact catalogue sidecar must retain daily dosing without a synthetic cycle.
const Course=require('../js/regimen-course-metadata');
for(const c of idx.new_codes){
 const p=json(protocols.find(p=>p.path.includes('/'+c+'-')).path);
 const row=json('data/regimen-card-metadata.json').protocols.find(x=>x.id===p.protocol_id);
 const model=Course.summarise({protocol_id:p.protocol_id,metadata:{regimen_card:row.regimen_card}});
 assert.equal(model.interval,'Continuous daily');assert(model.contexts.every(x=>x.cycle_length_days===null));
}
