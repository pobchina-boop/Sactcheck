'use strict';
// Refresh the ten edited records. Preserve remote-review state for unchanged source identities.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),cp=require('child_process');
const root=path.resolve(__dirname,'..');const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));const write=(p,d)=>fs.writeFileSync(path.join(root,p),JSON.stringify(d,null,2)+'\n');
const idx=read('data/lung-core-v08422-source-index.json'),file='data/nccp-change-tracker/source-register-v0620.json',old=read(file),fresh=require('./nccp-change-tracker').buildSourceRegister(root,'2026-10-26');
const previous=new Map(old.records.map(r=>[r.tracking_key,r]));
fresh.records=fresh.records.map(r=>{
 const before=previous.get(r.tracking_key);if(!idx.codes.includes(r.nccp_regimen_code))return before||r;
 const unchanged=before&&before.source_identity_sha256===r.source_identity_sha256;
 const result=unchanged?{...before,...Object.fromEntries(Object.entries(r).filter(([k])=>!['source_status','source_status_label','remote_capture_status','pdf_sha256','extracted_text_sha256','text_snapshot_path','last_remote_check','baseline_registered_date','review_status','clinical_rule_update_status'].includes(k)))}:r;
 const p=read(r.protocol_path);result.source_checked_date='2026-10-26';result.development_reconciliation_release='0.84.22';result.independent_review_status='pending';
 if(p.metadata.source_pdf_sha256)result.development_source_pdf_sha256=p.metadata.source_pdf_sha256;
 return result;
});
fresh.content_update_release='0.84.22';write(file,fresh);
cp.execFileSync(process.execPath,['tools/build-clinical-validation-register.js'],{cwd:root,stdio:'inherit'});
const cv='data/clinical-validation-register-v0630.json',register=read(cv);register.content_update_release='0.84.22';register.generated_date='2026-10-26';write(cv,register);
console.log('Updated ten source records, preserving unchanged remote-review states; clinical register refreshed.');
