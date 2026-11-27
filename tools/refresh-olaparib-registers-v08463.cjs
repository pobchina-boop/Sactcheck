'use strict';
// Update only current 00588/00746 records. Historical source indexes are immutable.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const tracker=require('./nccp-change-tracker');
const root=path.resolve(__dirname,'..'),date='2026-11-24';
const olaparibRelease='0.84.63';
const paths={'00588':'protocols/shared/00588-olaparib-tablet-monotherapy.json','00746':'protocols/gynaecology/00746-olaparib-tablet-and-bevacizumab-therapy.json'};
const read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const protocols=Object.fromEntries(Object.entries(paths).map(([code,file])=>[code,read(file)]));
const sourceFile='data/nccp-change-tracker/source-register-v0620.json',reviewFile='data/clinical-validation-register-v0630.json';
const source=read(sourceFile),review=read(reviewFile);
const current=new Map(tracker.buildSourceRegister(root,date).records.map(row=>[row.nccp_regimen_code,row]));
const note='HSE original PDF retrieved and checked on 24 November 2026.';
const hashes={
  '00588':'552b8bc3ac1aa3ce7814391076a4fecb1c2f1790bb577c2d92bad587cee4671f',
  '00746':'3276276c10d76300acdaa289e6617528e3a11ff880a2a6b65af1365cffcc98c9'
};
const digest=bytes=>require('node:crypto').createHash('sha256').update(bytes).digest('hex');
for (const [code, expected] of Object.entries(hashes)) {
  assert.equal(digest(fs.readFileSync(path.join(root,'validation/olaparib-source-20261124',code+'.pdf'))),expected);
  assert.equal(protocols[code].metadata.source_pdf_sha256,expected);
  assert.equal(source.records.filter(row=>row.nccp_regimen_code===code).length,1,code+' must have one source record');
  assert.equal(review.protocols.filter(row=>row.nccp_code===code).length,1,code+' must have one clinical record');
}
source.records=source.records.map(old=>{
  const code=old.nccp_regimen_code;if(!paths[code])return old;
  const row=current.get(code);assert(row&&row.protocol_path===paths[code]);
  return {...old,...row,baseline_registered_date:old.baseline_registered_date,
    source_status:'baseline_registered',source_status_label:'Official PDF retrieved',
    remote_capture_status:'baseline_captured',pdf_sha256:hashes[code],extracted_text_sha256:null,text_snapshot_path:null,last_remote_check:date,
    review_status:'source_checked_independent_review_pending',source_text_checked_date:date,source_reconciliation_note:note,
    supporting_ema_pdf_sha256:'04cb6a8e4fff66099a345e60858378068000de050b0e7fedaddb3d5347849598'};
});
review.protocols=review.protocols.map(old=>{
  const p=protocols[old.nccp_code];if(!p)return old;
  const m=p.metadata;
  return {...old,protocol_id:p.protocol_id,path:paths[old.nccp_code],nccp_version:String(m.nccp_version),
    title:m.title,short_title:m.short_title,indication:m.indication||(p.indications||[]).map(x=>x.description).filter(Boolean).join(' | '),
    source_url:m.source_url,source_review_date:m.review_date||'',encoding_version:m.sactcheck_encoding_version,
    rule_count:p.rule_engine.rules.length,input_count:Object.keys(p.input_definitions).length,knowledge_base_profile:true,
    source_document_checked:true,software_tests_completed:false,formal_consultant_reviewed:false,formal_pharmacy_reviewed:false,
    rule_source_review_date:date,verification_scope:'Scoped source-boundary and integration checks are recorded in validation/olaparib-v08463/clinical. Full release gates are separate; no clinical-use authorisation is implied.',
    source_verification_note:note};
});
for(const [file,data]of [[sourceFile,source],[reviewFile,review]]){
  // This marker belongs to the complete register, including subsequent reviewed additions.
  if (!data.content_update_release || data.content_update_release.localeCompare(olaparibRelease,'en',{numeric:true}) < 0) {
    data.content_update_release=olaparibRelease;
  }
  const bytes=Buffer.from(JSON.stringify(data,null,2)+'\n');
  if(process.argv.includes('--write'))fs.writeFileSync(path.join(root,file),bytes);
  else assert(fs.readFileSync(path.join(root,file)).equals(bytes),file+' differs from reviewed current 00588/00746 records');
}
console.log('Olaparib current source/validation registers: two records aligned; retrieved PDF hashes verified and formal review pending.');
