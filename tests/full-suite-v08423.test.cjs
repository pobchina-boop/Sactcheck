'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),crypto=require('crypto'),vm=require('vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p)),digest=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
const idx=json('data/lung-next-v08423-source-index.json'),codes=idx.codes,KB=json('data/regimen-knowledge-base-v08423-addendum.json'),support=json('data/phase-support-v0838.json').regimens,J=require('../js/treatment-journey-v0837'),V=require('../js/treatment-evidence-v08413'),D=require('../js/protocol-dose-schedule'),R=require('../js/patient-asset-registry-v0810'),E=require('../js/assessment-engine');
const protocols=json('protocols/index.json').protocols;
const migrated26=new Set(json('validation/lung-next-v08426/scope.json').retrospective_codes),latestKB=json('data/regimen-knowledge-base-v08426-addendum.json');
assert.equal(codes.length,6);assert.equal(idx.new_codes.length,5);assert.equal(idx.retrospective_codes.length,1);assert.equal(KB.regimen_profiles.length,6);
for(const c of codes){
 const d=json(`data/patient-knowledge/${c}.json`),p=json(protocols.find(p=>p.path.includes('/'+c+'-')).path),k=(migrated26.has(c)?latestKB:KB).regimen_profiles.find(x=>x.protocol_id===p.protocol_id),plans=support[c];
 assert.equal(d.suite_release,migrated26.has(c)?'0.84.26':'0.84.23');assert.equal(String(d.protocol_version),String(p.metadata.nccp_version));
 for(const key of ['consultant_reviewed','oncology_pharmacy_reviewed','clinical_use_authorised'])assert.equal(p.metadata.validation[key],false,c+'/'+key);
 assert.equal(E.assess(p,{}).complete,false);assert.notEqual(E.assess(p,{}).actionType,'proceed');
 assert.equal(d.evidence.metrics.length,0);assert.equal(d.cycle_display,'reference-chronology');assert(k.treatment_rationale.line);assert.equal(k.full_suite_release,migrated26.has(c)?'0.84.26':'0.84.23');assert.deepEqual(k.monitoring_and_toxicity.longitudinal_schedule,d.monitoring_schedule);
 assert(k.evidence_at_a_glance.sources.length);for(const e of k.evidence_at_a_glance.endpoints){assert(V.endpoints[e.endpoint],c+': unsupported endpoint '+e.endpoint);assert(e.metric&&e.interpretation&&e.sources.length)}assert(!/undefined|\[object Object\]/.test(V.render(k)));
 const j=J.definitions[c];assert.equal(j.has_patient_dates,false);for(const lane of j.lanes){assert.equal(lane.cells.length,j.stages.length);for(const id of lane.source_ids)assert(j.sources.some(x=>x.id===id))}
 assert(D.buildModel(p).phases.length,c+' lacks complete schedule');assert.equal(R.relativePath(c,'knowledge'),`patient/${c}/knowledge.html`);
 assert(plans.length);for(const plan of plans){assert(plan.source_url&&plan.source_checked);assert.equal(new Set(plan.additional_support).size,plan.additional_support.length)}
 for(const n of ['index','knowledge','consent','consent-form','guide','passport','sactcard','logistics','supportive-care','treatment-journey',...plans.map(x=>'support-'+x.id)]){const html=read(`patient/${c}/${n}.html`);assert(!/undefined|\[object Object\]/.test(html),c+'/'+n);if(['index','knowledge','treatment-journey'].includes(n))assert(!/<input|<select/.test(html),'Date-free '+c+'/'+n);for(const m of html.matchAll(/(?:src|href)="([^"#]+)"/g)){if(/^(https?:|data:|mailto:|tel:)/.test(m[1]))continue;assert(fs.existsSync(path.resolve(root,'patient',c,m[1].split(/[?#]/)[0])),c+'/'+n+': '+m[1])}}
 for(const n of ['guide','consent-form','passport','sactcard','logistics','supportive-care','treatment-journey',...plans.map(x=>'support-'+x.id)])assert.deepEqual(fs.readFileSync(`${root}/patient/${c}/${n}.pdf`),fs.readFileSync(`${root}/docs/patient/${c}/${n}.pdf`));
 assert(!json('data/breast-library-contexts-v0837.json').regimens[c],c+' must not enter breast indication selector');
}
const inventory=json('validation/lung-next-v08423/retrospective-inventory.json');assert.equal(inventory.authored_suites,122);assert.equal(inventory.reviewed_cumulative,122);assert.equal(inventory.remaining_review_queue,0);assert.equal(protocols.length,377);assert(read('index.html').includes('Feasibility evaluation build — not for routine clinical use'));
assert.equal(fs.readdirSync(path.join(root,'data/patient-knowledge')).filter(x=>x.endsWith('.json')).length,139);
const hashes=json('validation/lung-next-v08423/retrospective-hashes.json');for(const [f,h] of Object.entries(hashes.files))assert.equal(digest(f),require('./helpers/retrospective-v08424.cjs').expectedHash(f,h.after),f);
const base=json('validation/lung-next-v08423/baseline-hashes.json');for(const [f,h] of Object.entries(base.files)){if(!f.startsWith('tools/')&&!hashes.files[f])assert.equal(digest(f),require('./helpers/retrospective-v08424.cjs').expectedHash(f,h),'Outside-scope bundle changed '+f)}
const pdf=json('validation/lung-next-v08423/pdf-validation.json');assert.equal(pdf.documents,42+codes.reduce((n,c)=>n+support[c].length,0));assert.equal(json('validation/lung-next-v08423/qr-validation.json').length,24);
console.log('v0.84.23: six complete lung suites, date-free monitoring, route-specific schedules and support, PDF copies and unchanged outside-scope patient bundles.');


// Induction and maintenance medicines stay separate in both clinical and patient tools.
for(const [c,drug] of [['00689','atezolizumab'],['00908','serplulimab']]){
 const p=json(protocols.find(p=>p.path.includes('/'+c+'-')).path),d=json(`data/patient-knowledge/${c}.json`);
 const phase=p.treatment_phases.find(x=>x.phase_id==='maintenance');
 assert(phase,c+' lacks maintenance phase');assert.deepEqual(phase.active_drugs,[drug]);
 assert(/maintenance/i.test(d.schedule_summary));assert(support[c].length>=2);
 assert(support[c].some(x=>x.active_medicines.length===1&&x.active_medicines[0].toLowerCase().includes(drug)));
}
const oral=json('data/patient-knowledge/00319.json');
assert(oral.agents.some(x=>x.id==='etoposide'));
assert(/oral/i.test(oral.schedule_summary+' '+oral.administration_text));
assert(/twice/i.test(oral.schedule_summary+' '+oral.administration_text));
assert(/maintenance/i.test(json('data/patient-knowledge/00222.json').context_label));
assert(/second.line/i.test(JSON.stringify(json('data/patient-knowledge/00222.json'))));
assert(read('patient/00908/knowledge.html').includes('#67449a'),'Serplulimab uses immune mechanism visual');
assert.equal(R.codes.length,139);

// One entered bilirubin result supplies the absolute etoposide threshold and
// the source-specific immune-toxicity ULN ratio, including zero and blank input.
const Lab=require('../js/local-lab-profile');
const ui=read('js/generic-assessment-ui.js');
const collector=ui.slice(ui.indexOf('  function collectRawInputs('),ui.indexOf('  function calculateLabTarget('));
for(const [c,absolute] of [['00689','bilirubin_micromol_l'],['00908','bilirubin_umol_l']]){
 const p=json(protocols.find(p=>p.path.includes('/'+c+'-')).path);
 assert.equal(p.input_definitions[absolute].ui_derived_from,'bilirubin_uln_multiple');
 for(const [value,uln] of [[0,20],[49.99,20],[50,20],[60,30],['',20]]){
  const ctx={document:{querySelectorAll:s=>s==='[data-lab-target]'?[{dataset:{labTarget:'bilirubin_uln_multiple'},disabled:false}]:[]},activeProtocol:p,inputControlSelector:x=>x,latestLabCalculations:{},calculateLabTarget:()=>Lab.calculate('bilirubin_uln_multiple',{bilirubin:value},{...Lab.defaults,bilirubinUln:uln})};
  vm.createContext(ctx);vm.runInContext(collector+'; result=collectRawInputs();',ctx);
  if(value===''){assert.equal(ctx.result[absolute],undefined);assert.equal(ctx.result.bilirubin_uln_multiple,undefined);}
  else{assert.equal(Number(ctx.result[absolute]),value);assert.equal(Number(ctx.result.bilirubin_uln_multiple),value/uln);}
 }
}
const serpluConsent=json('data/consent-content-v0710.json').agent_profiles.serplulimab;
assert.equal(serpluConsent.module,'immune_checkpoint_inhibitor');
assert(serpluConsent.aliases.includes('Hetronifly'));
assert(serpluConsent.risks.some(x=>/hormone/i.test(x.label)));
assert(!serpluConsent.immune_core_frequency_estimates,'No borrowed ICI frequencies');
