'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const E=require('../js/assessment-engine.js');
const patient=require('../js/patient-support-v0750.js');
const p=require('../protocols/gastrointestinal/00897-durvalumab-gemcitabine-cisplatin.json');
const stride=require('../protocols/gastrointestinal/00926-tremelimumab-durvalumab.json');
const assess=(input)=>E.assess(p,input);
function check(label,input,expected,excluded=[]){
 test(label,()=>{
   const a=assess(input);assert.deepEqual(a.invalid,[]);assert.deepEqual(a.errors,[]);
   const hits=a.findings.filter(f=>!f.domainAssessment).map(f=>f.ruleId);
   for(const rule of expected)assert.ok(hits.includes(rule),JSON.stringify({rule, hits,input}));
   for(const rule of excluded)assert.ok(!hits.includes(rule),JSON.stringify({rule, hits,input}));
 });
}
test('Current HSE source, unique ID, sources and an empty form',()=>{
 assert.equal(p.protocol_id,'nccp-00897-v4');assert.equal(String(p.metadata.nccp_version),'4');
 assert.equal(assess({}).actionType,'incomplete');
 for(const r of p.rule_engine.rules){assert.equal(r.source.url,p.metadata.source_url);assert.ok(r.source.page>=1&&r.source.page<=9)}
});
test('Generic patient and handout retain phase limits and drug-specific cycle qualifiers',()=>{
 assert.match(patient.scheduleSummary(p),/Cycles 1–8/);assert.match(patient.scheduleSummary(p),/from cycle 9/i);
 assert.match(patient.scheduleSummary(stride),/tremelimumab[^+]*[Cc]ycle 1 only/);
});
const C=(i=1,phase='induction_day1')=>({cycle_number:i,treatment_phase:phase});
check('Hepatic 5x ULN is an interruption', {alt_ast_uln_multiple:5},['HEPATITIS_WITHHOLD'],['HEPATITIS_PERMANENT']);
check('Hepatic 5.01x ULN remains interruption', {alt_ast_uln_multiple:5.01},['HEPATITIS_WITHHOLD'],['HEPATITIS_PERMANENT']);
check('Hepatic 10x ULN remains interruption', {alt_ast_uln_multiple:10},['HEPATITIS_WITHHOLD'],['HEPATITIS_PERMANENT']);
check('Hepatic >10x ULN is discontinuation', {alt_ast_uln_multiple:10.01},['HEPATITIS_PERMANENT'],['HEPATITIS_WITHHOLD']);
check('Concurrent bilirubin without alternative cause', {alt_ast_uln_multiple:3.1,bilirubin_uln_multiple:2.1,alternative_cause_of_bilirubin_elevation:false},['HEPATITIS_PERMANENT'],['HEPATITIS_WITHHOLD']);
check('Concurrent bilirubin with established alternative cause follows AST/ALT', {alt_ast_uln_multiple:4,bilirubin_uln_multiple:3.2,alternative_cause_of_bilirubin_elevation:true},['HEPATITIS_WITHHOLD'],['HEPATITIS_PERMANENT']);
check('Concurrent bilirubin with unknown cause requires clarification', {alt_ast_uln_multiple:4,bilirubin_uln_multiple:2.2},['HEPATITIS_CONCURRENT_CAUSE_UNKNOWN'],['HEPATITIS_PERMANENT']);
check('Bilirubin >3 independently meets severe band', {bilirubin_uln_multiple:3.01},['HEPATITIS_PERMANENT']);
check('Grade 2 meningitis is interrupted', {immune_neurological_syndrome:'meningitis',serious_neurological_irae_grade:2},['MENINGITIS_G2'],['NEURO_PERMANENT','SERIOUS_NEUROLOGICAL_IRAE']);
check('Grade 3 meningitis is discontinued', {immune_neurological_syndrome:'meningitis',serious_neurological_irae_grade:3},['NEURO_PERMANENT']);
check('Transverse myelitis at grade 1', {immune_neurological_syndrome:'myelitis',serious_neurological_irae_grade:1},['NEURO_PERMANENT']);
check('Unspecified neurological event is not automatically stopped permanently', {serious_neurological_irae_grade:2},['SERIOUS_NEUROLOGICAL_IRAE'],['NEURO_PERMANENT']);
check('Body weight 36 kg on infusion day', {...C(8),weight_kg:36},['LOW_WEIGHT_DURVALUMAB']);
check('Body weight >36 kg', {...C(9,'maintenance'),weight_kg:36.1},[],['LOW_WEIGHT_DURVALUMAB']);
check('Induction day 8 has no durvalumab dose due', {...C(1,'induction_day8'),weight_kg:30},[],['LOW_WEIGHT_DURVALUMAB']);
check('ANC 0.50 and platelets 50 are both in the reduction band', {...C(),anc:0.5,platelets:50},['CHEMO_COUNTS_75_GEM'],['CHEMO_COUNTS_OMIT']);
check('Platelets 49 override ANC in reduction band', {...C(),anc:0.8,platelets:49},['CHEMO_COUNTS_OMIT'],['CHEMO_COUNTS_75_GEM']);
check('One intermediate count requires the other count', {...C(),anc:0.8},['COUNTS_INCOMPLETE_ANC'],['CHEMO_COUNTS_75_GEM']);
check('Platelets 100 remain reduced when ANC normal', {...C(),anc:1,platelets:100},['CHEMO_COUNTS_75_GEM']);
check('Platelets above 100 with ANC 1 cross the full-dose thresholds', {...C(),anc:1,platelets:100.1},[],['CHEMO_COUNTS_75_GEM','CHEMO_COUNTS_OMIT']);
check('No chemo count decision during maintenance',{...C(9,'maintenance'),anc:0.4},[],['CHEMO_COUNTS_OMIT','CHEMO_COUNTS_75_GEM']);
check('Discordant cycle 9 induction label blocks interpretation',{...C(9),anc:0.4},['CYCLE_PHASE_CONFLICT'],['CHEMO_COUNTS_OMIT']);
check('Grade 2 immune pneumonitis affects different induction agents differently',{...C(1),pneumonitis_grade:2},['PNEUMONITIS_G2','GEMCITABINE_PNEUMONITIS_G2_PLUS']);
check('Gemcitabine stop does not apply in maintenance',{...C(9,'maintenance'),pneumonitis_grade:2},['PNEUMONITIS_G2'],['GEMCITABINE_PNEUMONITIS_G2_PLUS']);
check('Grade 2 neuropathy omits cisplatin',{...C(5,'induction_day8'),peripheral_neuropathy_grade:2},['CISPLATIN_NEUROPATHY_G2_PLUS']);
check('Other grade 2 immune toxicity requires interruption',{other_immune_toxicity_grade:2},['OTHER_IMMUNE_G3']);
check('Isolated grade 4 lab requires judgement',{other_nonimmune_toxicity_grade:4,grade4_lab_only:true},['GRADE4_LAB_CONTEXT'],['NONIMMUNE_G4']);
check('Prior severe immune toxicity is a caution',{prior_grade3_or_higher_irae:true},['PRIOR_SEVERE_IRAE_EXCLUSION']);
check('Cisplatin clearance 50–59 selects 75%',{...C(),crcl_ml_min:'renal_50_59'},['CISPLATIN_CRCL_50_59'],['CISPLATIN_CRCL_40_49','CISPLATIN_CRCL_LT40']);
check('Cisplatin clearance 40–49 selects 50%',{...C(),crcl_ml_min:'renal_40_49'},['CISPLATIN_CRCL_40_49'],['CISPLATIN_CRCL_50_59','CISPLATIN_CRCL_LT40']);
check('Cisplatin clearance below 40 is not recommended',{...C(),crcl_ml_min:'renal_0_39'},['CISPLATIN_CRCL_LT40']);
check('Cisplatin clearance 60 or more avoids a renal reduction',{...C(),crcl_ml_min:'renal_60_plus'},[],['CISPLATIN_CRCL_LT40','CISPLATIN_CRCL_40_49','CISPLATIN_CRCL_50_59']);
check('Gemcitabine absolute bilirubin at 27 requires consideration',{...C(),bilirubin_umol_l:27},['GEMCITABINE_BILI_GE27']);
check('Gemcitabine absolute bilirubin below 27',{...C(),bilirubin_umol_l:26.9},[],['GEMCITABINE_BILI_GE27']);
check('Grade 3 colitis withholds durvalumab on biliary regimen',{diarrhoea_colitis_grade:3},['COLITIS_G2_G3'],['COLITIS_G4']);
check('Grade 4 colitis stops durvalumab',{diarrhoea_colitis_grade:4},['COLITIS_G4']);
check('Persistent myositis after 30 days or respiratory insufficiency stops durvalumab',{myositis_not_resolved_by_day30_or_respiratory_insufficiency:true},['PERSISTENT_MUSCLE_TOXICITY']);
check('Baseline renal impairment is a listed exclusion',{preexisting_renal_impairment_at_initiation:true},['BASELINE_RENAL_EXCLUSION']);
check('Suspected skin emergency calls for urgent assessment',{...C(),scar_status:'suspected'},['SUSPECTED_SCAR_REVIEW'],['GEMCITABINE_CONFIRMED_SCAR']);
check('Established severe skin reaction stops gemcitabine in induction',{...C(),scar_status:'confirmed'},['GEMCITABINE_CONFIRMED_SCAR']);
const clinicalWorkflow=require('../js/regimen-workflow-engine-v0750.js');
const workflowData=require('../data/regimen-workflow-v0750.json');
const emetogenicData=require('../data/emetogenic-risk-map.json');
const endometrial=require('node:fs').readdirSync(require('node:path').join(__dirname,'../protocols/gynaecology')).find(n=>n.startsWith('00953'));
test('Antiemetic export requires an explicit visit, then uses only the active drugs',()=>{
 const gyn=require('../protocols/gynaecology/'+endometrial);
 for(const [reg,phases] of [
  [p,[['induction_day1','high_standard',['durvalumab','gemcitabine','cisplatin']],['induction_day8','high_standard',['gemcitabine','cisplatin']],['maintenance','minimal',['durvalumab']]]],
  [gyn,[['induction','high_carboplatin',['durvalumab','paclitaxel','carboplatin']],['maintenance','minimal',['durvalumab']]]]
 ]){
  const record=emetogenicData.protocols[reg.metadata.nccp_regimen_code];
  assert.equal(record.level,'phase_dependent');
  assert.equal(clinicalWorkflow.buildManifest(reg,workflowData,record).supportiveCare.status,'phase_review_required');
  for(const [id,plan,meds] of phases){
   const manifest=clinicalWorkflow.buildManifest(reg,workflowData,record,id);
   assert.equal(manifest.supportiveCare.planId,plan);assert.deepEqual(manifest.components,meds);
   if(plan==='minimal')assert.equal(manifest.supportiveCare.day1.length,0);
  }
 }
});
