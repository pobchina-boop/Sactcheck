'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p)),digest=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
const idx=json('data/lung-next-v08426-source-index.json'),scope=json('validation/lung-next-v08426/scope.json'),KB=json('data/regimen-knowledge-base-v08426-addendum.json'),support=json('data/phase-support-v0838.json').regimens,protocols=json('protocols/index.json').protocols;
const E=require('../js/assessment-engine'),D=require('../js/protocol-dose-schedule'),J=require('../js/treatment-journey-v0837'),V=require('../js/treatment-evidence-v08413'),R=require('../js/patient-asset-registry-v0810');
assert.equal(idx.codes.length,10);assert.equal(idx.new_codes.length,5);assert.equal(idx.retrospective_codes.length,5);assert.equal(KB.regimen_profiles.length,10);
for(const c of idx.codes){
 const d=json(`data/patient-knowledge/${c}.json`),p=json(protocols.find(x=>x.path.includes('/'+c+'-')).path),k=KB.regimen_profiles.find(x=>x.protocol_id===p.protocol_id),plans=support[c];
 assert.equal(d.suite_release,'0.84.26');assert.equal(String(d.protocol_version),String(p.metadata.nccp_version));assert.equal(k.full_suite_release,'0.84.26');
 for(const flag of ['consultant_reviewed','oncology_pharmacy_reviewed','clinical_use_authorised'])assert.equal(p.metadata.validation[flag],false,c+'/'+flag);
 const empty=E.assess(p,{});assert.equal(empty.complete,false);assert(!['proceed','proceed_with_caution'].includes(empty.actionType));assert.deepEqual(d.evidence.metrics,[]);
 assert(k.treatment_rationale.line&&k.evidence_at_a_glance.sources.length);assert.deepEqual(k.monitoring_and_toxicity.longitudinal_schedule,d.monitoring_schedule);
 for(const e of k.evidence_at_a_glance.endpoints){assert(V.endpoints[e.endpoint],c+'/'+e.endpoint);assert(e.metric&&e.interpretation&&e.sources.length)}assert(!/undefined|\[object Object\]/.test(V.render(k)));
 assert(D.buildModel(p).phases.length);const j=J.definitions[c];assert.equal(j.has_patient_dates,false);for(const lane of j.lanes){assert.equal(lane.cells.length,j.stages.length);for(const id of lane.source_ids)assert(j.sources.some(x=>x.id===id));}
 if(['00219','00220'].includes(c)){assert.equal(d.cycle_days,null);assert.equal(d.schedule_kind,'continuous_oral');assert(!/null-day/.test(read(`patient/${c}/index.html`)));for(const phase of D.buildModel(p).phases)assert(!phase.cycleLength);}
 const guarded=['00455','00558','00544','00592','00593'].includes(c);assert.equal(R.relativePath(c,'knowledge'),guarded?`patient/${c}/scope.html?asset=knowledge`:`patient/${c}/knowledge.html`);if(guarded)assert(read(`patient/${c}/scope.html`).includes('lung cancer'));
 for(const plan of plans){assert(plan.source_url&&plan.source_checked);assert.equal(new Set(plan.additional_support).size,plan.additional_support.length);}
 for(const n of ['index','knowledge','consent','consent-form','guide','passport','sactcard','logistics','supportive-care','treatment-journey',...plans.map(x=>'support-'+x.id)]){
  const html=read(`patient/${c}/${n}.html`);assert(!/undefined|\[object Object\]|Breast adjuvant treatment only/.test(html),c+'/'+n);
  if(['index','knowledge','treatment-journey'].includes(n))assert(!/<input|<select/.test(html),c+' dates must not be required');
  for(const m of html.matchAll(/(?:src|href)="([^"#]+)"/g)){if(/^(https?:|data:|mailto:|tel:)/.test(m[1]))continue;assert(fs.existsSync(path.resolve(root,'patient',c,m[1].split(/[?#]/)[0])),c+'/'+n+': '+m[1]);}
 }
 for(const n of ['guide','consent-form','passport','sactcard','logistics','supportive-care','treatment-journey',...plans.map(x=>'support-'+x.id)])assert.deepEqual(fs.readFileSync(`${root}/patient/${c}/${n}.pdf`),fs.readFileSync(`${root}/docs/patient/${c}/${n}.pdf`));
 assert(!json('data/breast-library-contexts-v0837.json').regimens[c]);
}
assert.equal(protocols.length,377);assert.equal(R.codes.length,139);assert.equal(fs.readdirSync(root+'/data/patient-knowledge').filter(x=>x.endsWith('.json')).length,139);
const base=json('validation/lung-next-v08426/baseline-hashes.json'),changes=json('validation/lung-next-v08426/retrospective-hashes.json');
for(const [f,h]of Object.entries(base.files)){if(!/^(patient|docs\/patient|data\/patient-knowledge|data\/patient-knowledge-contexts)\//.test(f))continue;assert.equal(digest(f),require('./helpers/retrospective-v08426.cjs').expectedHash(f,h),f);}
assert.equal(json('validation/lung-next-v08426/retrospective-inventory.json').authored_context_suites,144);
assert.equal(json('validation/lung-next-v08426/qr-validation.json').length,40);
const consent=json('data/consent-content-v0710.json').agent_profiles;for(const id of ['erlotinib','gefitinib']){assert(consent[id]?.risks.length>=3);assert(consent[id].source_basis);}
assert(read('index.html').includes('Feasibility evaluation build — not for routine clinical use'));
console.log('v0.84.26 ten complete service suites: source metadata, assessment boundaries, evidence, consent, monitored schedules, support, preserved prior bundles and matched PDF copies pass.');
