'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const R=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(R,f)),json=f=>JSON.parse(read(f));
const S=json('validation/sarcoma-v08462/scope.json'),A=require('../js/patient-asset-registry-v0810.js'),C=require('../tools/consent-core-v08455.cjs'),V=require('../js/protocol-validator.js'),E=require('../js/assessment-engine.js'),I=json('protocols/index.json').protocols;
const routes=['00374','00228/liposarcoma','00205/sarcoma','00462','00554'],codes=['00374','00228','00205','00462','00554'],retro=['00335','00325','00719','00244','00511'];
const release=json('package.json').version,counts={'0.84.62':[278,311,319],'0.84.63':[283,316,324],'0.84.64':[292,328,336]};assert(counts[release]);assert.equal(A.release,release);assert.equal(json('data/app-release.json').release,release);
assert.equal(I.length,378);assert.equal(A.codes.length,counts[release][0]);assert.equal(A.codes.flatMap(c=>A.bundleRoutes(c)).length,counts[release][1]);assert.equal(require('../tools/apply-patient-visual-standard-v08443.cjs').discoverRoutes(R).length,counts[release][2]);
assert.deepEqual(S.new_routes,routes);assert.deepEqual(S.document_routes,routes);assert.deepEqual(S.retrospective_codes,retro);assert.deepEqual(S.changed_retrospective_routes,[]);assert.equal(S.independent_clinical_approval,false);assert.equal(S.base_state_kind,'verified_working_state');assert.equal(S.base_release,'0.84.61');assert.deepEqual(S.additional_corrective_codes,['00391','00392']);
const KB=json('data/regimen-knowledge-base-v08462-addendum.json'),phase=json('data/phase-support-v0838.json').regimens,contextPhase=json('data/phase-support-contexts-v08462.json').regimens,workflow=json('data/regimen-workflow-v0750.json'),presentation=json('data/patient-presentation-v08431.json').routes,journey=json('data/breast-treatment-journeys-v0837.json'),register=json('data/clinical-validation-register-v0630.json').protocols;
assert.equal(KB.regimen_profiles.length,5);assert.equal(KB.context_regimen_profiles.length,2);
assert(read('js/regimen-knowledge-base.js').toString().includes('data/regimen-knowledge-base-v08462-addendum.json'));
const norm=s=>s.replace(/<[^>]*>/g,'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#(?:039|39);/g,"'").replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
for(const route of routes){
 const [c,context]=route.split('/'),entry=I.find(x=>x.path.includes('/'+c+'-'));assert(entry);const p=json(entry.path),profile='data/'+(context?'patient-knowledge-contexts/':'patient-knowledge/')+route+'.json',d=json(profile),base='patient/'+route+'/';
 assert.deepEqual(V.validate(p,{strict:true}).errors,[]);assert.notEqual(E.assess(p,{}).actionType,'proceed');
 assert.equal(d.suite_release,'0.84.62');assert.equal(d.protocol_id,p.protocol_id);assert.equal(String(d.protocol_version),String(p.metadata.nccp_version));assert.equal(d.anatomy.length,8);assert.equal(d.independent_clinical_approval,false);assert.equal(d.patient_route,route);
 assert.equal(p.metadata.integration_review.status,'locally_integrated_review_pending_human_approval');assert.equal(p.metadata.integration_review.visual_table_layout,'unverified_no_image_pixels');
 for(const field of ['clinical_use_authorised','consultant_reviewed','oncology_pharmacy_reviewed'])assert.equal(p.metadata.validation[field],false);
 const row=register.find(x=>x.nccp_code===c);assert.equal(row.rule_count,p.rule_engine.rules.length);assert.equal(row.input_count,Object.keys(p.input_definitions).length);assert.equal(row.knowledge_base_profile,true);assert.equal(row.formal_consultant_reviewed,false);assert.equal(row.formal_pharmacy_reviewed,false);assert.equal(row.original_source_pdf_sha256,null);assert.equal(row.scoped_independent_software_validation.failed,0);
 assert.equal(presentation[route],profile);assert(journey[context?c+':'+context:c]);
 if(context){assert.equal(d.patient_context,context);assert(contextPhase[c][context].length);assert.equal(workflow.context_supportive_phase_selectors[c][context].protocol_id,p.protocol_id);assert(KB.context_regimen_profiles.some(k=>k.protocol_id===p.protocol_id&&k.context_id===context&&k.patient_route===route));}
 else{assert(phase[c].length);assert.equal(workflow.supportive_phase_selectors[c].protocol_id,p.protocol_id);assert(KB.regimen_profiles.some(k=>k.protocol_id===p.protocol_id));}
 const guide=read(base+'guide.html').toString(),consent=read(base+'consent-form.html').toString(),knowledge=read(base+'knowledge.html').toString();
 assert.equal((guide.match(/class="pt-page /g)||[]).length,3,route+' three-page pack');assert.equal((guide.match(/data-hcc-target=/g)||[]).length,8,route+' anatomy targets');assert(!knowledge.includes('undefined'));
 assert.deepEqual(C.classify(d),['chemotherapy']);
 for(const agent of d.agents)for(const risk of agent.risks)assert(norm(consent).includes(norm(risk)),route+' agent-specific consent omission: '+risk);
 for(const category of C.classify(d))for(const risk of C.model.categories[category].risks)assert(consent.includes(`data-nccp-risk="${category}-${risk.id}"`),route+' generic consent omission: '+risk.id);
 assert.equal(C.transform(consent,d,base+'consent-form.html'),consent,route+' stable consent transform');
 for(const name of ['guide','sactcard','handbook','knowledge','passport','logistics','consent-form','treatment-journey','supportive-care']){const b=read(base+name+'.pdf');assert.equal(b.subarray(0,4).toString(),'%PDF');assert(b.equals(read('docs/'+base+name+'.pdf')),route+' '+name+' mirror');}
 for(const file of ['source-reconciliation-v0700.js','source-reconciliation-v0701.js']){const copy=structuredClone(p),before=JSON.stringify(copy);require('../js/'+file).apply(copy);assert.equal(JSON.stringify(copy),before,route+' runtime reconciliation must preserve audited rules');}
}
const checkpoint=json('validation/sarcoma-v08462/clinical/clinical-draft-checkpoint.json');assert.equal(checkpoint.suites.reduce((n,s)=>n+s.passed,0),675);for(const suite of checkpoint.suites){const report=json('validation/sarcoma-v08462/clinical/'+suite.results);assert.equal(report.passed,suite.passed);assert.equal(report.failed,0);}
const independent=json('validation/sarcoma-v08462/independent-review/current-results.json');assert.equal(independent.total,154);assert.equal(independent.passed,154);assert.equal(independent.failed,0);assert.equal(independent.independent_from_author_cases,true);
const retrospective=json('validation/sarcoma-v08462/retrospective-review/final-results.json'),adjudication=json('validation/sarcoma-v08462/retrospective-review/adjudication.json');assert.equal(retrospective.total,82);assert.equal(retrospective.passed,81);assert.equal(retrospective.failed_expectations_retained,1);assert.equal(retrospective.deferred_conservative_workflow_cues,1);assert.equal(retrospective.confirmed_source_mandated_dose_action_defects,0);assert.deepEqual(retrospective.scope,retro);assert.equal(adjudication.case_id,'00719-13');assert.equal(adjudication.demonstrated_source_mandated_dose_action_defect,false);assert.equal(adjudication.original_expectation_unchanged,true);
const pair=require('./helpers/ifosfamide-pair-v08462.cjs').verify();for(const r of pair.records){const p=json(r.path);assert.equal(register.find(x=>x.nccp_code===r.code).rule_count,p.rule_engine.rules.length);assert(KB.regimen_profiles.some(x=>x.protocol_id===p.protocol_id));}
require('../tools/check-trabectedin-phase-v08462.cjs');
require('../tools/check-sarcoma-row-clarifications.cjs');
const hash=b=>require('node:crypto').createHash('sha256').update(b).digest('hex'),pdfManifest='validation/sarcoma-v08462/pdf/final-pdf-manifest.json';assert.equal(hash(read(pdfManifest)),'aa776119fe1178aea5b2a92252b7861205b16a6ead4a93cf9fb3d45e25a9825a');const pdf=json(pdfManifest);assert.equal(pdf.status,'pass');assert.equal(pdf.canonical_pdfs,54);assert.equal(pdf.identical_pdf_mirrors,54);assert.equal(pdf.pdf_pages,294);assert.equal(pdf.handbook_pages,112);assert.equal(pdf.monitoring_cells_checked,87);assert.equal(pdf.source_records_checked,88);assert.equal(pdf.pdfs.length,54);
const nextMigration='validation/sarcoma-v08463/asset-migrations.json';
assert.equal(hash(read(nextMigration)),'2d7a5df0e1d2f1163f98dc90ff6d7e1a1ff7bbbcb40de02689546e79560b2713');
const successorFiles=json(nextMigration).files;
const laterConsents=[];
for(const item of pdf.pdfs){
 const bytes=read(item.file);
 let expectedHash=item.sha256,expectedBytes=item.bytes;
 if(release!=='0.84.62' && item.file.endsWith('/consent-form.pdf')){
  const successor=successorFiles[item.file];
  assert.equal(successor.before,item.sha256,item.file);
  assert.equal(successor.before_bytes,item.bytes,item.file);
  expectedHash=successor.after;expectedBytes=successor.after_bytes;
  laterConsents.push(item.route);
 }
 assert.equal(hash(bytes),expectedHash,item.file);
 assert.equal(bytes.length,expectedBytes,item.file);
 assert(bytes.equals(read(item.mirror)),item.mirror);
}
assert.deepEqual(laterConsents.sort(),release==='0.84.62'?[]:routes.slice().sort());


console.log('Sarcoma v0.84.62: five new suites, protected breast contexts, explicit ID migrations, consent/workflow/documents and accepted prior ifosfamide pair checked. Retrospective81passes+1deferredcue remains explicit; clinical/pharmacy acceptance pending.');
