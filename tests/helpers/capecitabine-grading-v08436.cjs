'use strict';
// Exact 00216 provenance migration. This preserves source-table descriptors,
// table/page identity and the explicit distinction from retained generic UI aids.
const assert=require('node:assert/strict');
const NCCP='https://healthservice.hse.ie/documents/6558/216_v8_Capecitabine.pdf';
const NCI5='https://dctd.cancer.gov/research/ctep-trials/for-sites/adverse-events/ctcae-v5-5x7.pdf';
const sourceFields=new Set(['diarrhoea_grade','diarrhoea_highest_grade','hand_foot_syndrome_grade','hand_foot_highest_grade']);
const aidFields=new Set(['mucositis_grade','mucositis_highest_grade','other_nonhaem_toxicity_grade','other_nonhaem_toxicity_highest_grade']);
function metadata(protocol){
 const m=protocol.metadata;assert.equal(m.nccp_regimen_code,'00216');
 assert.equal(m.nccp_version,'8');assert.equal(m.sactcheck_encoding_version,'0.84.36');
 assert.equal(m.clinical_audit_release,'0.84.36');assert.equal(m.validation.audit_release,'0.84.36');
 assert.equal(m.source_url,NCCP);assert.equal(m.source_pdf_sha256,'5f4a3599d27c49ff7f866e768c3e936066731975698194fbdfc3e73dcdd94388');
 assert.equal(m.source_checked_date,'2026-11-05');assert.equal(m.validation.clinical_use_authorised,false);
}
function check(protocol,field,def){
 metadata(protocol);assert(sourceFields.has(field)||aidFields.has(field),'Unmapped 00216 grading field '+field);
 assert.equal(def.type,'select');assert.equal(def.required,false);
 if(sourceFields.has(field)){
  const diarrhoea=field.startsWith('diarrhoea');
  assert.equal(def.ctcae_version,diarrhoea?'NCCP table 4 (legacy source-specific bands)':'NCCP table 5 (regimen-specific)');
  assert.equal(def.grading_source_label,'NCCP 00216 v8 · table '+(diarrhoea?'4':'5')+' (page 5)');
  assert.equal(def.grading_source_url,NCCP);assert.match(def.source_grading_note,diarrhoea?/not a CTCAE edition/:/not a generic CTCAE v5 substitution/);
  assert.equal(def.ctcae_source_url,NCCP);assert.equal(def.ctcae_category,diarrhoea?'diarrhoea':'ppe');
  assert.deepEqual(def.options.map(o=>Number(o.value)),diarrhoea?[0,1,2,3,4]:[0,1,2,3]);
  const expected=diarrhoea?[
   'Usual bowel pattern.',
   'NCCP low-grade band: 2–3 extra stools/day; source nocturnal-stool wording overlaps grade 2.',
   '4–6 extra stools/day or nocturnal stools (NCCP table 4).',
   '7–9 extra stools/day or incontinence (NCCP table 4).',
   '10 or more extra stools/day or grossly bloody diarrhoea; parenteral support may be needed (NCCP table 4).'
  ]:[
   'No hand-foot syndrome.',
   'NCCP table 5: skin changes/tingling/erythema with discomfort not disrupting normal activities.',
   'NCCP table 5: painful erythema/swelling affecting daily activities.',
   'NCCP table 5: severe skin changes (e.g. desquamation, ulceration, blistering) with pain and inability to work or perform daily activities.'
  ];
  assert.deepEqual(def.options.map(o=>o.description),expected,field+' must retain the audited source descriptions');
  const r=protocol.rule_engine.rules.find(r=>r.rule_id===(diarrhoea?'DIARRHOEA_CURRENT_HOLD':'HFS_CURRENT_HOLD'));
  assert(r);assert.equal(r.source.url,NCCP);assert.equal(r.source.page,5);assert.equal(r.source.table,diarrhoea?4:5);
  if(diarrhoea){assert.match(def.assessment_guidance,/legacy/i);assert.match(def.assessment_guidance,/Nocturnal stools appear in both/);assert.match(def.assessment_guidance,/do not grade by stool count alone/);}
  else {assert.match(def.assessment_guidance,/Use NCCP table 5/);assert.match(def.assessment_guidance,/does not specify a percentage/);}
 }else{
  assert.equal(def.ctcae_version,'5.0');assert.equal(def.ctcae_source_url,NCI5);
  assert.match(def.assessment_guidance,/CTCAE v5 UI aid/);assert.match(def.assessment_guidance,/NCCP table 3 explicitly cites CTCAE v4/);
  assert.match(def.assessment_guidance,/versions are not represented as identical sources/);
  assert.deepEqual(def.options.map(o=>Number(o.value)),[0,1,2,3,4]);assert(def.options.every(o=>o.description));
  const r=protocol.rule_engine.rules.find(r=>r.rule_id===(field.startsWith('mucositis')?'MUCOSITIS_CURRENT_HOLD':'OTHER_NONHAEM_TOXICITY_CURRENT_HOLD'));
  assert(r);assert.equal(r.source.url,NCCP);assert.equal(r.source.page,4);assert.equal(r.source.table,3);
 }
}
module.exports={metadata,check,sourceFields,aidFields};
