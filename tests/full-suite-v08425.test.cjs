'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p)),digest=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
const idx=json('data/targeted-lung-v08425-source-index.json'),codes=idx.codes,KB=json('data/regimen-knowledge-base-v08425-addendum.json'),support=json('data/phase-support-v0838.json').regimens,sc=json('data/phase-support-contexts-v08425.json').regimens,J=require('../js/treatment-journey-v0837'),V=require('../js/treatment-evidence-v08413'),D=require('../js/protocol-dose-schedule'),R=require('../js/patient-asset-registry-v0810'),E=require('../js/assessment-engine');
const protocols=json('protocols/index.json').protocols;
assert.equal(codes.length,10);assert.equal(idx.new_codes.length,5);assert.equal(idx.retrospective_codes.length,5);assert.equal(KB.regimen_profiles.length,10);
for(const c of codes){
 const retro=idx.retrospective_codes.includes(c),route=`patient/${c}/${retro?'lung/':''}`;
 const d=json(retro?`data/patient-knowledge-contexts/${c}/lung.json`:`data/patient-knowledge/${c}.json`),p=json(protocols.find(p=>p.path.includes('/'+c+'-')).path),wrapper=KB.regimen_profiles.find(x=>x.protocol_id===p.protocol_id),k=retro?wrapper.context_profiles.find(x=>x.context_id==='lung'):wrapper,plans=retro?sc[c].lung:support[c];
 assert.equal(d.suite_release,'0.84.25');assert.equal(String(d.protocol_version),String(p.metadata.nccp_version));
 for(const key of ['consultant_reviewed','oncology_pharmacy_reviewed','clinical_use_authorised'])assert.equal(p.metadata.validation[key],false,c+'/'+key);
 assert.equal(E.assess(p,{}).complete,false);assert(!['proceed','proceed_with_caution'].includes(E.assess(p,{}).actionType));
 assert.deepEqual(d.evidence.metrics,[]);
 if(!retro){assert.equal(d.cycle_days,null);assert.equal(d.schedule_kind,'continuous_oral');assert(d.endocrine_timeline);assert(!/null-day|28-day cycle|21-day cycle/.test(read(route+'index.html')));for(const phase of D.buildModel(p).phases)assert(!phase.cycleLength);}
 else{assert.equal(wrapper.context_selector_required,true);const breast=wrapper.context_profiles.find(x=>x.context_id==='breast');assert(breast);assert.deepEqual(breast.evidence_at_a_glance,wrapper.evidence_at_a_glance);assert.notEqual(k.reference_links.find(x=>x.label==='Guide').url,breast.reference_links.find(x=>x.label==='Guide')?.url);assert.equal(R.relativePath(c,'knowledge','lung'),route+'knowledge.html');assert.match(R.relativePath(c,'knowledge'),/scope.html/);}
 assert(k.treatment_rationale.line);assert.equal(k.full_suite_release,'0.84.25');assert.deepEqual(k.monitoring_and_toxicity.longitudinal_schedule,d.monitoring_schedule);
 assert(k.evidence_at_a_glance.sources.length);for(const e of k.evidence_at_a_glance.endpoints){assert(V.endpoints[e.endpoint],c+': unsupported endpoint '+e.endpoint);assert(e.metric&&e.interpretation&&e.sources.length)}assert(!/undefined|\[object Object\]/.test(V.render(k)));
 const j=J.definitions[c+(retro?':lung':'')];assert.equal(j.has_patient_dates,false);for(const lane of j.lanes){assert.equal(lane.cells.length,j.stages.length);for(const id of lane.source_ids)assert(j.sources.some(x=>x.id===id))}
 assert(D.buildModel(p).phases.length,c+' lacks complete schedule');
 assert(plans.length);for(const plan of plans){assert(plan.source_url&&plan.source_checked);assert.equal(new Set(plan.additional_support).size,plan.additional_support.length)}
 for(const n of ['index','knowledge','consent','consent-form','guide','passport','sactcard','logistics','supportive-care','treatment-journey',...plans.map(x=>'support-'+x.id)]){
  const html=read(route+n+'.html');assert(!/undefined|\[object Object\]|Breast adjuvant treatment only/.test(html),c+'/'+n);
  if(['index','knowledge','treatment-journey'].includes(n))assert(!/<input|<select/.test(html),'Date-free '+c+'/'+n);
  for(const m of html.matchAll(/(?:src|href)="([^"#]+)"/g)){if(/^(https?:|data:|mailto:|tel:)/.test(m[1]))continue;assert(fs.existsSync(path.resolve(root,route,m[1].split(/[?#]/)[0])),c+'/'+n+': '+m[1])}
 }
 for(const n of ['guide','consent-form','passport','sactcard','logistics','supportive-care','treatment-journey',...plans.map(x=>'support-'+x.id)])assert.deepEqual(fs.readFileSync(root+'/'+route+n+'.pdf'),fs.readFileSync(root+'/docs/'+route+n+'.pdf'));
 if(!retro)assert(!json('data/breast-library-contexts-v0837.json').regimens[c],c+' must not enter breast selector');
}
const inventory=json('validation/targeted-lung-v08425/retrospective-inventory.json');assert.equal(inventory.authored_suites,134);assert.equal(inventory.authored_context_suites,139);assert.equal(protocols.length,377);
assert.equal(fs.readdirSync(path.join(root,'data/patient-knowledge')).filter(x=>x.endsWith('.json')).length,134);assert.equal(R.codes.length,134);
const base=json('validation/targeted-lung-v08425/baseline-patient-hashes.json');for(const [f,h]of Object.entries(base.sha256))assert.equal(digest(f),h,'Existing patient bundle changed: '+f);
const pdf=json('validation/targeted-lung-v08425/pdf-validation.json');assert.equal(pdf.documents,70+codes.reduce((n,c)=>n+(idx.retrospective_codes.includes(c)?sc[c].lung:support[c]).length,0));assert.equal(json('validation/targeted-lung-v08425/qr-validation.json').length,40);
const consent=json('data/consent-content-v0710.json').agent_profiles;
for(const id of ['tepotinib','entrectinib','afatinib','dacomitinib','ceritinib']){assert(consent[id]?.risks.length>=3);assert(consent[id].source_basis);assert(/pending|draft/i.test(consent[id].review_status));}
const Course=require('../js/regimen-course-metadata');
for(const c of idx.new_codes){const p=json(protocols.find(p=>p.path.includes('/'+c+'-')).path),row=json('data/regimen-card-metadata.json').protocols.find(x=>x.id===p.protocol_id),model=Course.summarise({protocol_id:p.protocol_id,metadata:{regimen_card:row.regimen_card}});assert.equal(model.interval,'Continuous daily');assert(model.contexts.every(x=>x.cycle_length_days===null));}
assert(/small.cell/i.test(json('data/patient-knowledge-contexts/00226/lung.json').indication_text));
console.log('v0.84.25: five new targeted suites, five independent lung contexts, preserved breast bundles, matched evidence, date-free monitoring, consent, support, links and PDF mirrors verified.');
