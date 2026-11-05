'use strict';
const assert=require('node:assert/strict');
const NCCP='https://healthservice.hse.ie/documents/6609/505_v5_Capecitabine_and_temozolomide__zFX2DSB.pdf';
const sourceFields=new Set(['diarrhoea_grade','diarrhoea_highest_grade','hand_foot_syndrome_grade','hand_foot_highest_grade']);
function metadata(p){assert.equal(p.metadata.nccp_regimen_code,'00505');assert.equal(p.metadata.nccp_version,'5');assert.equal(p.metadata.clinical_audit_release,'0.84.37');assert.equal(p.metadata.source_url,NCCP);assert.equal(p.metadata.source_pdf_sha256,'b990c71f88fc2762210f47aeaf0709deca48e8559d263eaf110048d5cb3ce827');}
function check(p,field,d){
 metadata(p);assert.equal(d.type,'select');assert.equal(d.required,false);assert(d.assessment_guidance);assert(d.options.every(o=>o.description));
 if(sourceFields.has(field)){
  const diarrhoea=field.startsWith('diarrhoea');assert.equal(d.ctcae_version,diarrhoea?'NCCP table 4 (legacy source-specific bands)':'NCCP table 5 (regimen-specific)');
  assert.equal(d.ctcae_source_url,NCCP);assert.equal(d.grading_source_url,NCCP);assert.equal(d.grading_source_label,diarrhoea?'NCCP 00505 v5 · table 4 (page 4)':'NCCP 00505 v5 · table 5 (page 5)');
  assert.deepEqual(d.options.map(o=>Number(o.value)),diarrhoea?[0,1,2,3,4]:[0,1,2,3]);
  if(diarrhoea){assert.match(d.source_grading_note,/nocturnal stools overlap/);for(const [i,pattern]of [[1,/2–3/],[2,/4–6/],[3,/7–9/],[4,/10 or more/]])assert.match(d.options[i].description,pattern);}
  else {assert.match(d.source_grading_note,/does not quantify/);assert.match(d.options[2].description,/daily activities/);assert.match(d.options[3].description,/inability to work/);}
 }else{assert.equal(d.ctcae_version,'5.0');assert.equal(d.ctcae_source_url,'https://dctd.cancer.gov/research/ctep-trials/for-sites/adverse-events/ctcae-v5-5x7.pdf');assert.match(d.assessment_guidance,/UI aid/);assert.match(d.assessment_guidance,/not an assertion that editions are interchangeable/);}
}
module.exports={metadata,check,sourceFields};
