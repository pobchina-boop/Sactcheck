'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),cp=require('node:child_process');
const root=path.resolve(__dirname,'../..'),codes=['00101','00257','00313','00546','00203'];
const read=f=>JSON.parse(fs.readFileSync(path.join(root,f))),sha=f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex');
function validate(p){
 const c=p.metadata?.nccp_regimen_code;if(!codes.includes(c))return null;
 const rec=read('validation/prostate-v08456/clinical/clinical-migration.json'),row=rec.records[c];
 assert.equal(rec.release,'0.84.56');assert.equal(rec.base_commit,'8fea74b7b5c8daf0a2c4101cdb96b50265c368d7');assert(row);
 assert.deepEqual(p,read(row.path));assert.equal(sha(row.path),row.sha256);
 assert.equal(crypto.createHash('sha256').update(cp.execFileSync('git',['show',rec.base_commit+':'+row.path],{cwd:root})).digest('hex'),row.before_sha256);
 assert.equal(sha(row.source_pdf),row.source_sha256);assert.equal(p.metadata.source_url,row.source_url);assert.equal(p.metadata.nccp_version,row.source_version);
 assert.equal(p.metadata.sactcheck_encoding_version,'0.84.56');
 for(const flag of ['clinical_use_authorised','consultant_reviewed','oncology_pharmacy_reviewed'])assert.equal(p.metadata.validation[flag],false);
 const results=read(row.results);assert.equal(results.total,results.passed);assert(results.cases.some(x=>x.code===c));assert(results.cases.every(x=>x.pass));return row;
}
function grade(p,field,d){
 if(!codes.includes(p.metadata?.nccp_regimen_code)||d.type!=='select'||!field.includes('grade'))return false;
 const row=validate(p),c=p.metadata.nccp_regimen_code;assert.deepEqual(d,row.grading_fields[field]);assert.equal(d.required,false);assert.equal(d.grading_source_url,row.source_url);assert(d.source_grading_note&&d.assessment_guidance);
 assert.equal(d.ctcae_version,c==='00101'?'4.0':undefined);assert.deepEqual(d.options.map(x=>Number(x.value)),[0,1,2,3,4]);
 const guide=require('../../js/ctcae-descriptors.js').guide({...d,id:field});assert.equal(guide.sourceSpecific,true);assert.equal(guide.calculable,false);assert.equal(guide.grades.length,5);assert(guide.grades.every(x=>x.description));return true;
}
module.exports={validate,grade,codes};
