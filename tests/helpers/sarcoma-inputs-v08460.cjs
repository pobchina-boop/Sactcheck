'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const R=path.resolve(__dirname,'../..'),codes=['00500','00391','00392','00501','00511'];
const read=f=>JSON.parse(fs.readFileSync(path.join(R,f))),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function applies(p){return codes.includes(p.metadata?.nccp_regimen_code)&&p.metadata?.sactcheck_encoding_version==='0.84.60';}
function validate(p){
 if(!applies(p))return null;const m=read('validation/sarcoma-v08460/clinical-compatibility.json'),c=p.metadata.nccp_regimen_code,r=m.records[c];
 assert.equal(m.release,'0.84.60');assert.equal(m.base_commit,'c01f1a2b236afced0c3ebfdb6b6ff864e58e7d4c');assert.deepEqual(p,read(r.path));assert.equal(sha(fs.readFileSync(path.join(R,r.path))),r.after_sha256);assert.equal(p.metadata.source_url,r.source_url);assert.equal(p.metadata.nccp_version,r.source_version);
 for(const f of ['clinical_use_authorised','consultant_reviewed','oncology_pharmacy_reviewed'])assert.equal(p.metadata.validation[f],false);
 const source=read('validation/sarcoma-v08460/clinical/source-manifest.json').sources.find(s=>s.code===c);assert.equal(source.source_url,r.source_url);assert.equal(source.version,r.source_version);assert.equal(sha(fs.readFileSync(path.join(R,source.text_path))),source.text_sha256);assert.equal(source.original_pdf_sha256,null);
 assert.equal(sha(fs.readFileSync(path.join(R,'validation/sarcoma-v08460/clinical/source-case-results.json'))),m.source_case_results_sha256);
 for(const rule of p.rule_engine.rules){assert.equal(rule.source.url,r.source_url);assert(rule.source.page>=1&&rule.source.page<=source.pages);}
 return r;
}
function numericRenal(p,field,d){
 if(!applies(p)||field!=='crcl_ml_min')return false;validate(p);assert.equal(d.type,'number');assert.equal(d.unit,'mL/min');assert.equal(d.renal_input.mode,'exact_continuous');assert.equal(d.renal_input.exact_value_required,true);assert.equal(d.input_role,'decision');
 assert(p.rule_engine.rules.some(r=>JSON.stringify(r.when).includes('crcl_ml_min')));return true;
}
module.exports={codes,applies,validate,numericRenal};
