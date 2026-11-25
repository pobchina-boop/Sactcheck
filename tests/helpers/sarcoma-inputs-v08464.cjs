'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const T=require('./archived-sarcoma-candidates.cjs'),CTCAE=require('../../js/ctcae-descriptors.js'),root=path.resolve(__dirname,'../..');
const codes=['00675','00747','00504','00754','00757'];
const fields={
 '00675':['current_ifos_neuro_grade','prior_ifos_neuro_grade','current_vcr_neuropathy_grade','current_mucositis_grade','prior_mucositis_grade'],
 '00747':['current_ifos_neuro_grade','prior_ifos_neuro_grade','current_vcr_neuropathy_grade','current_mucositis_grade','prior_mucositis_grade'],
 '00504':['mucositis_grade','other_nonhaem_toxicity_grade','diarrhoea_grade','prior_nonhaem_grade','prior_diarrhoea_grade'],
 '00754':['mucositis_grade','other_nonhaem_toxicity_grade','encephalopathy_grade','vinca_neuropathy_grade','prior_nonhaem_grade','prior_vinca_neuropathy_grade','prior_ifos_neuro_grade','prior_mucositis_grade'],
 '00757':['mucositis_grade','other_nonhaem_toxicity_grade','diarrhoea_grade','vinca_neuropathy_grade','prior_nonhaem_grade','prior_diarrhoea_grade','prior_vinca_neuropathy_grade','worst_any_toxicity_cycle1']
};
const ranges=Object.fromEntries(Object.entries(fields).map(([code,names])=>[code,Object.fromEntries(names.map(f=>[f,[0,1,2,3,4]]))]));
const educational={
 '00675':{current_vcr_neuropathy_grade:'neuropathy',current_mucositis_grade:'mucositis',prior_mucositis_grade:'mucositis'},
 '00747':{current_vcr_neuropathy_grade:'neuropathy',current_mucositis_grade:'mucositis',prior_mucositis_grade:'mucositis'},
 '00504':{mucositis_grade:'mucositis'},'00754':{other_nonhaem_toxicity_grade:'other_nonhaematological'},'00757':{mucositis_grade:'mucositis'}
};
const v4={
 '00754':new Set(['mucositis_grade','encephalopathy_grade','vinca_neuropathy_grade','prior_vinca_neuropathy_grade','prior_ifos_neuro_grade','prior_mucositis_grade']),
 '00757':new Set(['vinca_neuropathy_grade','prior_vinca_neuropathy_grade'])
};
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
let chain,proposal;
function authenticated(){
 if(!chain){
  chain=T.candidates(codes);
  assert(chain.records instanceof Map);assert.deepEqual([...chain.records.keys()].sort(),[...codes].sort());
  const bytes=T.archived('validation/sarcoma-v08464/clinical/grading-source-review/all-input-replacements.json');
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),'11ab0be6d5d155215a06ede2087adc1081bee72e5ed3f7af6072063b1ddf4148');proposal=JSON.parse(bytes);
  assert.equal(proposal.replacements.length,40);assert.equal(proposal.field_count,40);
  assert.equal(proposal.all_option_values_labels_Boolean_truth_defaults_unchanged,true);
 }
 return chain;
}
function applies(p){return codes.includes(p.metadata?.nccp_regimen_code)&&p.metadata?.sactcheck_encoding_version==='0.84.64';}
function validate(p){
 if(!applies(p))return null;
 const code=p.metadata.nccp_regimen_code,r=authenticated().records.get(code),file=path.join(root,r.path);
 assert.equal(sha(file),r.after_sha256);assert.deepEqual(p,read(file));
 assert.equal(p.status,'encoded_prototype_pending_clinical_and_pharmacy_validation');assert.equal(p.metadata.partial_assessment_supported,true);
 for(const k of ['clinical_use_authorised','consultant_reviewed','oncology_pharmacy_reviewed','software_tests_completed'])assert.equal(p.metadata.validation[k],false);
 assert.equal(p.metadata.source_pdf_sha256,null);assert.equal(p.metadata.encoding_maturity.source_reconciled,false);
 for(const [field,range]of Object.entries(ranges[code])){const d=p.input_definitions[field];assert.equal(d.type,'select');assert.deepEqual(d.options.map(o=>Number(o.value)),range);assert(d.assessment_guidance);}
 for(const replacement of proposal.replacements.filter(x=>x.code===code)){
  const d=p.input_definitions[replacement.input_id];assert.deepEqual(d,replacement.after,'Exact source-reviewed definition '+code+'/'+replacement.input_id);
  if(d.type==='boolean'){
   const guide=CTCAE.guide({...d,id:replacement.input_id});assert.equal(guide.sourceSpecific,true);assert.equal(guide.grades.length,0);
   assert.equal(d.ctcae_version,undefined);assert.equal(d.grading_source_url,p.metadata.source_url);assert(d.source_grading_note&&d.assessment_guidance);
   assert.equal(d.demo_value,replacement.before.demo_value);assert.deepEqual(d.options,replacement.before.options);
  }
 }
 for(const rule of p.rule_engine.rules){assert(rule.source.url);assert(rule.source.page||rule.source.section);assert.equal(rule.action.block_numeric_dose,true);assert(rule.action.components?.length);assert(!rule.action.components.includes('whole_regimen'));}
 return r;
}
function validateGrade(p,field,d,renderer=CTCAE){
 const r=validate(p),code=p.metadata.nccp_regimen_code,range=ranges[code]?.[field];assert(r&&range,'Unreviewed v64 grade '+code+'/'+field);assert.deepEqual(d,p.input_definitions[field]);
 const guide=renderer.guide({...d,id:field});assert(guide&&guide.grades.length>=range.length);
 const category=educational[code][field];
 if(category){
  assert.equal(d.ctcae_version,'5.0');assert.equal(d.ctcae_category,category);assert.equal(guide.sourceSpecific,false);
  assert.equal(d.ctcae_source_url,'https://dctd.cancer.gov/research/ctep-trials/for-sites/adverse-events/ctcae-v5-5x7.pdf');
  if(code==='00754'&&field==='other_nonhaem_toxicity_grade'){
   assert.equal(d.input_role,'context');assert.match(d.assessment_guidance,/Educational CTCAE v5\.0 context only/);assert.match(d.assessment_guidance,/Do not use its v5\.0 labels to redefine source actions that specify CTCAE v4\.0/);
  }else assert.match(d.assessment_guidance,/does not (?:name|specify|state)|not (?:named|specified|stated)|unspecified/i);
 }else{
  assert.equal(guide.sourceSpecific,true);assert.equal(d.ctcae_version,undefined);assert.equal(d.grading_source_url,p.metadata.source_url);assert(d.grading_source_label&&d.source_grading_note);
  if(v4[code]?.has(field)){assert.match(d.grading_source_label,/CTCAE v4\.0/);assert.match(d.source_grading_note,/v4\.0/);}
  else assert.match(d.grading_source_label,/edition not specified/);
  for(const o of d.options)assert(o.description,'Source named-event prompt missing '+code+'/'+field+'/'+o.value);
 }
 for(const g of range)assert(guide.grades.find(x=>Number(x.grade)===g)?.description);
 return range;
}
function numericRenal(p,field,d){
 if(!applies(p)||!['crcl_ml_min','serum_creatinine_umol_l'].includes(field))return false;
 validate(p);assert.deepEqual(d,p.input_definitions[field]);assert.equal(d.type,'number');assert.equal(d.required,false);
 if(field==='crcl_ml_min')assert.equal(d.unit,'mL/min');
 else{assert(['00675','00747','00754'].includes(p.metadata.nccp_regimen_code));assert.equal(d.unit,'µmol/L');assert.equal(d.demo_value,'');assert.match(d.label,/not CrCl or eGFR/);}
 return true;
}
function validateSupport(p,registry){
 assert(validate(p),'Only authenticated v64 support schema may use this branch');
 const code=p.metadata.nccp_regimen_code,s=p.supportive_care,entry=registry.protocols[code];
 const classification='https://healthservice.hse.ie/documents/7152/Classification_Document_for_Systemic_Anti-_Cancer_Therapy_SACT_Induced_Nausea__pWgDCrm.pdf';
 const guidance='https://healthservice.hse.ie/documents/7180/Supportive_Care_Antiemetics_for_inclusion_NCIS_Medical_Oncology.pdf';
 assert.equal(s.mapping_source,'NCCP SACT Antiemetic Guidance V6 (2025)');assert.equal(s.mapping_source_url,classification);
 assert.equal(s.validation_status,'source_mapped_pending_local_oncology_pharmacy_validation');assert.equal(entry.validation_status,s.validation_status);
 assert.equal(entry.protocol_id,p.protocol_id);assert.equal(entry.script_id,s.script_id);assert.equal(entry.level,s.emetogenic_risk);
 const expectedPhases={
  '00675':{ie_days_1_to_5:'high',vac_vdc_day_1:'high'},'00747':{ie_days_1_to_5:'high',vac_vdc_day_1:'high'},
  '00504':{irinotecan_temozolomide_days_1_to_5:'moderate',rest_days:'minimal'},
  '00754':{ivado_cycles1_2:'high',ivado_cycles3_4:'high',iva_cycles5_9:'high'},
  '00757':{irinotecan_temozolomide_phase:'moderate',vincristine_only_phase:'minimal'}
 };
 assert.deepEqual(Object.fromEntries(Object.entries(s.phase_profiles).map(([id,profile])=>[id,profile.level])),expectedPhases[code]);
 for(const profile of [{script_id:s.script_id,level:'high'},...Object.values(s.phase_profiles)]){
  const script=registry.scripts[profile.script_id];assert(script);assert.equal(script.risk_level,profile.level);assert.equal(script.url,guidance);assert.equal(script.source_url,classification);assert.equal(script.status,'national_guidance_link');assert(script.summary&&script.subsequent_days);
 }
 const text=s.additional_supportive_care.join('\n');
 if(['00675','00747','00754'].includes(code)){assert.match(text,/mesna/i);assert.match(text,/hydration/i);assert.match(text,/G-CSF/i);assert.match(text,/aprepitant/i);}
 else{assert.match(text,/PJP/);assert.match(text,/glaucoma/);assert.match(text,/delayed-diarrhoea/);assert.match(text,/loperamide/);assert.match(text,/Cefixime.*not mandatory/);}
 // These accepted records resolve the national PDF through script_id and phase_profiles.
 // An absent duplicated leaf URL is not permission to omit registry attribution.
 assert.equal(s.supportive_medications_pdf_url,undefined);
 return true;
}
module.exports={applies,validate,validateGrade,numericRenal,validateSupport,ranges,fields};
