'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),codes=['00514','00517','00903','00589','00591'];
const read=f=>JSON.parse(fs.readFileSync(path.join(root,f))),sha=f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex');
function validate(p){
 const code=p.metadata?.nccp_regimen_code;if(!codes.includes(code))return null;
 const record=read('validation/head-neck-v08449/clinical-migration.json');assert.equal(record.base_commit,'a54aa0e5306c06c0e02f203b30b6f094ad13382c');assert.equal(record.release,'0.84.49');const row=record.records[code];assert(row);
 assert.deepEqual(p,read(row.path));assert.equal(sha(row.path),row.sha256,'Exact source-reviewed encoding '+code);
 const baseline=require('./retrospective-v08449.cjs').readFrozen(row.path);assert.equal(crypto.createHash('sha256').update(baseline).digest('hex'),row.before_sha256);
 for(const [file,h]of Object.entries(row.evidence))assert.equal(sha(file),h,'Retained independent source evidence '+file);
 assert.equal(p.metadata.source_url,row.source_url);assert.equal(p.metadata.nccp_version,row.source_version);
 const r=read(row.results),cases=r.cases||r.rows;assert.equal(r.passed,r.total||r.cases.length);assert(cases.every(x=>(x.pass??x.passed)===true));assert(cases.some(x=>x.code===code));
 for(const f of ['clinical_use_authorised','consultant_reviewed','oncology_pharmacy_reviewed'])assert.equal(p.metadata.validation[f],false);
 return row;
}
function grade(p,field,d){
 if(!codes.includes(p.metadata?.nccp_regimen_code)||!field.includes('grade')||d.type!=='select')return false;
 const row=validate(p);assert.deepEqual(d,row.grading_fields[field]);assert.equal(d.required,false);assert.equal(d.ctcae_version,undefined);assert.equal(d.grading_source_url,row.source_url);assert.match(d.source_grading_note,/does not specify a CTCAE edition/);assert.deepEqual(d.options.map(x=>Number(x.value)),[0,1,2,3,4]);
 const guide=require('../../js/ctcae-descriptors.js').guide({...d,id:field});assert.equal(guide.sourceSpecific,true);assert.equal(guide.calculable,false);assert.equal(guide.grades.length,5);assert(guide.grades.every(x=>x.description));return true;
}
function numericRenal(p,field,d){
 const expected=Object.fromEntries(codes.map(c=>[c,{crcl_ml_min:'mL/min',creatinine_umol_l:'µmol/L',creatinine_sample_age_hours:'hours',creatinine_percent_isotope_baseline:'%'}]));
 const unit=expected[p.metadata?.nccp_regimen_code]?.[field];if(!unit)return false;const row=validate(p);assert.deepEqual(d,row.numeric_renal_fields[field]);assert.equal(d.type,'number');assert.equal(d.required,false);assert.equal(d.unit,unit);assert(d.min>=0);if(unit==='mL/min')assert.equal(d.min,0);return true;
}
module.exports={validate,grade,numericRenal,codes};
