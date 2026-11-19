'use strict';
// Strict current-source compatibility for four reviewed GIST/shared protocols only.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'../..'),codes=['00335','00325','00719','00244'];
const ranges={
 '00335':{current_nonhaem_grade:[0,1,2,3,4],worst_nonhaem_grade:[0,1,2,3,4]},
 '00325':{current_general_nonhaem_grade:[0,1,2,3,4],worst_general_nonhaem_grade:[0,1,2,3,4],hfs_grade:[0,1,2,3],hfs_worst_grade:[0,1,2,3]},
 '00719':{current_toxicity_grade:[0,1,2,3,4],prior_worst_toxicity_grade:[0,1,2,3,4]},
 '00244':{hfsr_grade:[0,1,2,3],hfsr_worst_grade_this_episode:[0,1,2,3],hypertension_grade:[0,1,2,3,4],other_toxicity_grade:[0,1,2,3,4]}
};
const read=f=>JSON.parse(fs.readFileSync(path.join(ROOT,f))),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function applies(p){return codes.includes(p.metadata?.nccp_regimen_code)&&p.metadata?.sactcheck_encoding_version==='0.84.61';}
function validate(p){
 if(!applies(p))return null;const transition=require('../../tools/lib/sarcoma-v08461-transitions.cjs').verify(ROOT);const manifest=read('validation/sarcoma-v08461/clinical-compatibility.json'),code=p.metadata.nccp_regimen_code,record=manifest.records[code];
 assert.equal(manifest.release,'0.84.61');assert.equal(manifest.base_release,'0.84.60');assert.equal(manifest.git_anchor_commit,'c01f1a2b236afced0c3ebfdb6b6ff864e58e7d4c');assert.deepEqual(Object.keys(manifest.records).sort(),[...codes].sort());assert.deepEqual(manifest.excluded_current_source_blocked,['00445']);
 assert.equal(transition.records.get(code).after_sha256,record.after_sha256);assert.equal(transition.manifest_sha256,manifest.integration_transition_sha256);
 assert.deepEqual(p,read(record.path));assert.equal(sha(fs.readFileSync(path.join(ROOT,record.path))),record.after_sha256);assert.equal(p.metadata.source_url,record.source_url);assert.equal(String(p.metadata.nccp_version),record.source_version);assert.equal(p.metadata.source_checked_date,'2026-11-18');assert.notEqual(p.metadata.draft_only,true);
 for(const key of ['clinical_use_authorised','consultant_reviewed','oncology_pharmacy_reviewed'])assert.equal(p.metadata.validation[key],false,code+' '+key+' must remain false');
 const sources=read('validation/sarcoma-v08461/clinical/sources/source-manifest.json'),source=sources.sources.find(x=>x.code===code);
 assert.equal(source.url,record.source_url);assert.equal(source.version,record.source_version);assert.equal(source.source_status,'current_official_listing_link_and_complete_web_text_verified');assert.equal(source.original_pdf_sha256,null);assert.equal(sha(fs.readFileSync(path.join(ROOT,'validation/sarcoma-v08461/clinical/sources',source.web_text_file))),source.web_text_sha256);assert.equal(source.web_text_sha256,record.source_text_sha256);
 for(const item of manifest.evidence)assert.equal(sha(fs.readFileSync(path.join(ROOT,item.path))),item.sha256,'Compatibility evidence changed '+item.path);
 for(const rule of p.rule_engine.rules){assert(record.allowed_rule_source_urls.includes(rule.source.url),'Unverified source '+rule.source.url);assert(rule.source.page>=1||rule.source.section,'Missing rule source location');assert(rule.action.block_numeric_dose===true||rule.action.dose_calculation==='specialist_review','Numeric dosing must remain blocked');}
 for(const [field,expected]of Object.entries(ranges[code])){const d=p.input_definitions[field];assert(d,code+' missing '+field);assert.equal(d.type,'select');assert.deepEqual(d.options.map(x=>Number(x.value)),expected,code+'/'+field+' source grade range');assert(d.assessment_guidance,code+'/'+field+' missing assessment guidance');assert.equal(sha(Buffer.from(JSON.stringify(d))),record.grade_definitions_sha256[field],code+'/'+field+' grading contract changed');}
 if(code==='00325'){assert.equal(p.indications.find(i=>i.indication_id==='00325-sarcoma').code,'00325a');assert.equal(p.indications.find(i=>i.indication_id==='00325-gu').code,'00325b');}
 return record;
}
function validateGrade(p,field,d,CTCAE){
 const record=validate(p),code=p.metadata.nccp_regimen_code,expected=ranges[code]?.[field];assert(record&&expected,'Unreviewed v61 grade field '+code+'/'+field);
 const guide=CTCAE.guide({...d,id:field});assert(guide?.grades?.length>=expected.length,'Missing current grading guide');
 if(['00244','00719'].includes(code)){
  assert.equal(d.grading_source_url,record.source_url);assert(d.grading_source_label&&d.source_grading_note);assert.equal(guide.sourceSpecific,true);assert.equal(d.ctcae_version,field==='hypertension_grade'?'4.03':undefined);
  if(code==='00719'){assert.match(d.grading_source_label,/NCCP 00719 v2 Table 3; grading edition not specified/);assert.match(d.source_grading_note,/not a complete event-specific grading table/);assert.match(d.assessment_guidance,/Grade 0 means documented absence, not unknown/);}
 }else{
  assert.equal(d.ctcae_version,'5.0');assert.equal(d.ctcae_category,code==='00325'&&field.startsWith('hfs_')?'ppe':'other_nonhaematological');assert.notEqual(guide.sourceSpecific,true);
  if(code==='00325'&&field.startsWith('hfs_')){assert.match(d.assessment_guidance,/orientation aid/);assert.match(d.source_grading_note,/does not specify a CTCAE edition/);}
 }
 for(const grade of expected){const item=guide.grades.find(x=>Number(x.grade)===grade);assert(item?.description,code+'/'+field+' Grade'+grade+' missing descriptor');}
 return expected;
}
module.exports={codes,applies,validate,validateGrade,ranges};
