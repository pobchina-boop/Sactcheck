'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),read=f=>JSON.parse(fs.readFileSync(path.join(root,f))),sha=f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex');
const CODES=['00236','00415','00563','00431','00812','00455','00558','00483','00484','00551'];let record;const checked=new WeakMap();
function validate(p){
 const code=p.metadata.nccp_regimen_code;if(!CODES.includes(code))return null;
 if(checked.has(p))return checked.get(p);
 record??=read('validation/skin-melanoma-v08440/clinical-migration.json');assert.deepEqual(record.codes,CODES);
 const r=record.records[code];assert(r);assert.equal(p.metadata.clinical_audit_release,'0.84.40');assert.equal(p.metadata.validation.audit_release,'0.84.40');
 assert.equal(p.metadata.source_url,r.source_url);assert.equal(p.metadata.nccp_version,r.source_version);assert.equal(p.metadata.source_pdf_sha256,r.source_sha256);
 for(const flag of ['clinical_use_authorised','consultant_reviewed','oncology_pharmacy_reviewed'])assert.equal(p.metadata.validation[flag],false);
 for(const [f,h]of [[r.protocol_path,r.protocol_sha256],[r.baseline_path,r.baseline_sha256],[r.source_path,r.source_sha256],[r.case_path,r.case_sha256]])assert.equal(sha(f),h,code+' immutable reviewed evidence '+f);
 const actual=read(r.protocol_path);assert.deepEqual(p,actual,code+' test object must match the audited protocol');
 assert.deepEqual(p.rule_engine.rules.map(x=>x.id||x.rule_id),r.rule_ids);
 const result=read(r.result_path);if(result.release)assert.equal(result.release,'0.84.40');else assert.equal(result.baseline,false);const cases=result.cases||result.results;assert.equal(result.failed,0);assert.equal(result.passed,cases.length);assert(cases.every(c=>(c.pass??c.passed)===true));
 checked.set(p,r);return r;
}
function evidence(p,field){const r=validate(p);const result=read(r.result_path),cases=r.input_result_path?read(r.input_result_path):(result.cases||result.results);assert(cases.some(c=>(!c.code||c.code===p.metadata.nccp_regimen_code)&&Object.hasOwn(c.input||{},field)),field+' requires executed source-case evidence');}
function grade(p,field,d){
 if(!['00236','00415','00563','00431','00812'].includes(p.metadata.nccp_regimen_code)||d.type!=='select'||!('grade'===field||field.includes('grade')||d.grading_source_label))return false;
 const r=validate(p);assert.deepEqual(d,r.grading_fields[field],field+' exact reviewed grading definition');assert.equal(d.required,false);assert(d.assessment_guidance||d.source_grading_note);evidence(p,field);
 const guide=require('../../js/ctcae-descriptors.js').guide({...d,id:field});assert(guide,field+' rendered guide');assert.equal(guide.grades.length,d.options.length);assert(guide.grades.every(x=>x.description));
 if(d.grading_source_label){assert.equal(guide.sourceSpecific,true);assert.equal(guide.calculable,false);assert(d.grading_source_url&&(d.source_grading_note||d.assessment_guidance));const sourceEdition={'00415':'4.0','00431':'4.0','00551':'4.0','00812':'current NCCP-required edition'}[p.metadata.nccp_regimen_code];assert.equal(d.ctcae_version,sourceEdition);}
 else {assert.equal(d.ctcae_version,'5.0');assert(d.ctcae_category);assert(d.options.every(o=>o.description));if(['nausea','vomiting'].includes(d.ctcae_category))assert.deepEqual(d.options.map(o=>o.value),[0,1,2,3]);}
 return true;
}
function numericRenal(p,field,d){
 if(!['00236','00415','00563','00431','00812'].includes(p.metadata.nccp_regimen_code)||d.type!=='number'||!('crcl'===field||field.includes('crcl')||/creatinine clearance/i.test(d.label||'')))return false;
 const r=validate(p);assert.deepEqual(d,r.numeric_renal_fields[field]);assert.equal(d.required,false);assert.equal(d.unit,'mL/min');assert.equal(d.min,0);evidence(p,field);return true;
}
module.exports={validate,grade,numericRenal,CODES};
