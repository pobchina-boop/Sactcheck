'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const R=path.resolve(__dirname,'../..'),codes=['00453','00602','00807','00885','00894','00945'];
const read=f=>JSON.parse(fs.readFileSync(path.join(R,f))),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function validate(p){
 const code=p.metadata?.nccp_regimen_code;if(!codes.includes(code))return null;
 const m=read('validation/gu-v08459/clinical/clinical-migration.json'),r=m.records[code];
 assert.equal(m.base_commit,'862c18e3fa9a4235d14cdc3579565935727f5220');assert.equal(m.release,'0.84.59');
 assert.deepEqual(p,read(r.path));assert.equal(sha(fs.readFileSync(R+'/'+r.path)),r.sha256);
 assert.equal(sha(fs.readFileSync(R+'/'+r.source_pdf)),r.source_sha256);assert.equal(p.metadata.nccp_version,r.source_version);
 const source=read('validation/gu-v08459/clinical/new-and-repeat-sources.json').find(x=>x.code===code);assert.equal(p.metadata.source_url,source.catalogue_url);
 assert.equal(p.metadata.sactcheck_encoding_version,'0.84.59');
 for(const flag of ['clinical_use_authorised','consultant_reviewed','oncology_pharmacy_reviewed'])assert.equal(p.metadata.validation[flag],false);
 return r;
}
function grade(p,field,d){
 if(!codes.includes(p.metadata?.nccp_regimen_code)||d.type!=='select'||!field.includes('grade'))return false;
 validate(p);assert.equal(d.grading_source_url,p.metadata.source_url);assert(d.source_grading_note&&d.assessment_guidance);assert(d.options.every(x=>x.description));
 const g=require('../../js/ctcae-descriptors.js').guide({...d,id:field});assert.equal(g.sourceSpecific,true);assert.equal(g.calculable,false);return true;
}
function numericRenal(p,field,d){if(!codes.includes(p.metadata?.nccp_regimen_code)||!['crcl_ml_min','gfr_ml_min'].includes(field))return false;validate(p);assert.equal(d.type,'number');assert.equal(d.renal_input.mode,'source_threshold_numeric');assert.equal(d.renal_input.source_url,p.metadata.source_url);return true;}
module.exports={codes,validate,grade,numericRenal};
