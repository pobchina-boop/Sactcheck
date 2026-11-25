'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const R=path.resolve(__dirname,'../..'),base='validation/sarcoma-v08462/ifosfamide-product/',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),read=f=>JSON.parse(fs.readFileSync(path.join(R,f)));
const accepted={'00391':'200b42d236909fedb0d40694d9e83a0bcd67d4d88d2d1ca9457b91b283768cb8','00392':'2fe430cd6d93e7310a1798a682fe0c1087e390b14ffca0c1f9392a9d95e23fde'};
function applies(p){return Object.hasOwn(accepted,p.metadata?.nccp_regimen_code)&&p.metadata?.ifosfamide_product_reconciliation?.integration_release==='0.84.62';}
function verify(){
 const m=read(base+'integration.json');assert.deepEqual(m.affected_codes,['00391','00392']);assert.equal(m.clinical_approval,false);assert.equal(m.source_freeze_sha256,'9b5812aa06c8fe82e71f3a00a4c8a79bb75ff137008f38feadff9a39b85a1aa7');assert.equal(sha(fs.readFileSync(path.join(R,base+'review/final-author-product-overlay-freeze.json'))),m.source_freeze_sha256);assert.equal(sha(fs.readFileSync(path.join(R,base+'review/evidence-manifest.json'))),m.independent_evidence_manifest_sha256);
 const baseline=read('validation/sarcoma-v08462/baseline-v61-working-files.json');assert.equal(m.baseline_manifest_sha256,'cfb11d986f28b5b130d0fcd08f9a14fa027fbda38099979a290dc245cf53563b');assert.equal(sha(fs.readFileSync(path.join(R,'validation/sarcoma-v08462/baseline-v61-working-files.json'))),m.baseline_manifest_sha256);
 const report=read(base+'review/final-review-summary.json');assert.equal(report.main_cases.passed,347);assert.equal(report.separate_CNS_semantic_UI_cases.passed,26);
 for(const r of m.records){assert.equal(r.accepted_sha256,accepted[r.code]);assert.equal(baseline[r.path].sha256,r.released_v61_sha256);assert.equal(sha(fs.readFileSync(path.join(R,r.accepted_snapshot_path))),r.accepted_sha256);const p=read(r.accepted_snapshot_path),current=read(r.path);const updates={status:'locally_integrated_independent_software_checked_human_approval_pending',integration_release:'0.84.62',independent_software_review:base+'review/final-review-summary.json'};assert.equal(r.metadata_edits.length,3);
 for(const e of r.metadata_edits){assert.deepEqual(e.path.slice(0,2),['metadata','ifosfamide_product_reconciliation']);assert.equal(e.path.length,3);const key=e.path[2],target=p.metadata.ifosfamide_product_reconciliation;assert(Object.hasOwn(updates,key));assert.equal(e.after,updates[key]);assert.equal(Object.hasOwn(target,key),e.before_exists);if(e.before_exists)assert.deepEqual(target[key],e.before);target[key]=e.after;}
 assert.deepEqual(current,p,'Only exact metadata status transitions follow accepted pair source rules');assert.equal(sha(fs.readFileSync(path.join(R,r.path))),r.after_sha256);for(const key of ['consultant_reviewed','oncology_pharmacy_reviewed','clinical_use_authorised'])assert.equal(current.metadata.validation[key],false);
 }
 return m;
}
function validate(p){if(!applies(p))return null;const m=verify(),r=m.records.find(r=>r.code===p.metadata.nccp_regimen_code);assert.deepEqual(p,read(r.path));return r;}
function numericRenal(p,field,d){if(!applies(p)||field!=='crcl_ml_min')return false;validate(p);assert.equal(d.type,'number');assert.equal(d.unit,'mL/min');assert.equal(d.renal_input.mode,'exact_continuous');assert.equal(d.renal_input.exact_value_required,true);return true;}
function grade(p,field,definition,CTCAE){
 if(!applies(p)||field!=='neurotoxicity_grade')return false;validate(p);assert.deepEqual(definition,p.input_definitions[field]);assert.equal(definition.ctcae_version,undefined);assert.equal(definition.grading_source_url,p.metadata.source_url);assert.equal(definition.grading_source_label,'NCCP neurotoxicity action table; grading edition not specified');assert(definition.assessment_guidance);assert.deepEqual(definition.options.map(x=>Number(x.value)),[0,1,2,3,4]);const guide=CTCAE.guide({...definition,id:field});assert.equal(guide.sourceSpecific,true);assert.equal(guide.grades.length,5);assert(guide.grades.every(x=>x.description));return true;
}
module.exports={applies,validate,numericRenal,verify,accepted,grade};
