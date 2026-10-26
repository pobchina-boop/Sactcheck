'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const H=__dirname,R=path.resolve(H,'../../..'),integrated=process.argv.includes('--integrated');
const E=require(path.join(R,'js/assessment-engine')),D=require(path.join(R,'js/protocol-dose-schedule')),V=require(path.join(R,'js/protocol-validator'));
const rows=[];let p,c;
function clinical(r){return r.findings.filter(f=>!f.domainAssessment&&!/^PARTIAL_/.test(f.ruleId||''));}
function has(id,type){return r=>assert(clinical(r).some(f=>f.ruleId===id&&(!type||f.actionType===type)),id+' '+type+'; actual '+clinical(r).map(f=>f.ruleId));}
function absent(...ids){return r=>assert(!clinical(r).some(f=>ids.includes(f.ruleId)),'Unexpected '+ids);}
function run(name,input,check){let row={code:c,name,input,source:p.metadata.source_url};try{const r=E.assess(p,input),m=D.buildModificationModel(p,r);assert.deepEqual(r.errors,[]);assert.deepEqual(r.invalid,[]);assert.notEqual(r.actionType,'proceed','Partial input must not clear all domains');check(r,m);row.pass=true;row.actual={action:r.actionType,findings:clinical(r).map(f=>({id:f.ruleId,action:f.actionType}))};}catch(e){row.pass=false;row.error=e.message;}rows.push(row);}
function structural(name,check){try{check();rows.push({code:c,name,pass:true});}catch(e){rows.push({code:c,name,pass:false,error:e.message});}}
for(const [code,fn]of [['00317','00317-pemetrexed-cisplatin.json'],['00318','00318-pemetrexed-and-carboplatin-therapy.json']]){
 c=code;p=JSON.parse(fs.readFileSync(path.join(integrated?path.join(R,'protocols/lung'):path.join(H,'proposed'),fn)));
 const cis=c==='00317',a=cis?'anc':'anc_x10e9_l',t=cis?'platelets':'platelets_x10e9_l',renal=cis?'crcl_ml_min':'pemetrexed_crcl_ml_min',other=cis?'other_toxicity_grade':'other_nonhaem_toxicity_grade',hep=cis?'severe_hepatic_impairment':'pemetrexed_severe_hepatic';
 run('Blank remains incomplete',{},r=>assert.equal(r.actionType,'incomplete'));
 for(const val of ['',null])run('Unknown count not normal '+val,{[a]:val},r=>assert.equal(clinical(r).length,0));
 for(const [n,id,type]of [[0,'ANC_LT0_5','delay_then_dose_reduce'],[.499,'ANC_LT0_5','delay_then_dose_reduce'],[.5,'ANC_0_5_TO_LT1','delay'],[.999,'ANC_0_5_TO_LT1','delay'],[1,'ANC_1_TO_LT1_5','consultant_review'],[1.499,'ANC_1_TO_LT1_5','consultant_review']])run('Current ANC '+n,{[a]:n},has(id,type));
 for(const n of [1.5,1.501,10])run('ANC adequate entered domain '+n,{[a]:n},absent('ANC_LT0_5','ANC_0_5_TO_LT1','ANC_1_TO_LT1_5'));
 for(const [n,id]of [[0,'PLATELETS_LT50_HOLD'],[49.99,'PLATELETS_LT50_HOLD'],[50,'PLATELETS_50_TO_LT75'],[74.99,'PLATELETS_50_TO_LT75'],[75,'PLATELETS_75_TO_LT100'],[99.99,'PLATELETS_75_TO_LT100']])run('Platelets '+n+' alone actionable',{[t]:n},has(id));
 for(const n of [100,100.1,300])run('Platelets adequate '+n,{[t]:n},absent('PLATELETS_LT50_HOLD','PLATELETS_50_TO_LT75','PLATELETS_75_TO_LT100'));
 run('Low platelets missing bleeding no invented25%',{[t]:49},(r,m)=>{has('PLATELETS_LT50_HOLD','withhold')(r);absent('PLATELETS_LT50_NO_BLEED','PLATELETS_LT50_WITH_BLEED')(r);assert(m.rows.every(x=>!x.quantified));});
 run('Low platelets explicit no bleeding',{[t]:49,platelet_bleeding:false},has('PLATELETS_LT50_NO_BLEED','delay_then_dose_reduce'));
 run('Confirmed low-count bleeding event independent',{platelet_bleeding:true},has('PLATELETS_LT50_WITH_BLEED','delay_then_dose_reduce'));
 run('FN independent',{febrile_neutropenia:true},has('FEBRILE_NEUTROPENIA','delay_then_dose_reduce'));
 for(const n of [0,39.99,44,44.99])run('Pemetrexed renal below45 '+n,{[renal]:n},has('PEMETREXED_CRCL_LT45','contraindicated'));
 for(const n of [45,45.01,60,100])run('Pemetrexed renal ≥45 '+n,{[renal]:n},absent('PEMETREXED_CRCL_LT45'));
 for(const [f,id]of [['hypersensitivity','EXCLUSION_HYPERSENSITIVITY'],['significant_hearing_impairment_tinnitus','HEARING_EXCLUSION'],['haemodialysis','HAEMODIALYSIS'],[hep,'SEVERE_HEPATIC_IMPAIRMENT']])for(const b of [true,false])run(f+' '+b,{[f]:b},b?has(id,'contraindicated'):absent(id));
 for(const n of [0,1,2,3,4])run('Baseline neuropathy '+n,{preexisting_neuropathy_grade:n},n>=2?has('BASELINE_NEUROPATHY_EXCLUSION','contraindicated'):absent('BASELINE_NEUROPATHY_EXCLUSION'));
 for(const f of ['diarrhoea_grade','mucositis_grade',other])for(const n of [0,1,2,3,4])run(f+' grade '+n,{[f]:n},n>=3?has(f==='diarrhoea_grade'?'DIARRHOEA_G3_OR_HOSPITAL':f==='mucositis_grade'?'MUCOSITIS_G3PLUS':'OTHER_G3_HOLD'):absent('DIARRHOEA_G3_OR_HOSPITAL','MUCOSITIS_G3PLUS','OTHER_G3_HOLD'));
 run('Hospital diarrhoea independent of grade',{diarrhoea_hospitalisation:true},has('DIARRHOEA_G3_OR_HOSPITAL','withhold_then_reduce'));
 run('Grade2 neurotoxicity missing recurrence holds',{neuropathy_grade:2},r=>{has('NEURO_G2_HOLD','withhold')(r);absent('NEURO_G2','NEURO_G3_OR_RECURRENT')(r);});
 run('First grade2 neurotoxicity separate component plan',{neuropathy_grade:2,recurrent_neurotoxicity:false},(r,m)=>{has('NEURO_G2','withhold_then_reduce')(r);assert(m.rows.every(x=>!x.quantified));});
 for(const n of [3,4])run('Severe neurotoxicity '+n,{neuropathy_grade:n},has('NEURO_G3_OR_RECURRENT','discontinue'));
 run('Any neurotoxicity recurrence independent',{recurrent_neurotoxicity:true},has('NEURO_G3_OR_RECURRENT','discontinue'));
 run('Grade1 recurrent still discontinues',{neuropathy_grade:1,recurrent_neurotoxicity:true},has('NEURO_G3_OR_RECURRENT','discontinue'));
 run('Other severe history omitted immediate hold',{[other]:3},(r,m)=>{has('OTHER_G3_HOLD','withhold')(r);absent('OTHER_G3PLUS','OTHER_G3_AFTER_TWO_REDUCTIONS')(r);assert(m.rows.every(x=>!x.quantified));});
 for(const n of [0,1,2,3])run('Severe other toxicity after '+n+' reductions',{[other]:3,dose_reduction_count:n},r=>{has('OTHER_G3_HOLD')(r);has(n<2?'OTHER_G3PLUS':'OTHER_G3_AFTER_TWO_REDUCTIONS')(r);assert(!clinical(r).some(x=>x.actionType==='permanently_discontinue'));});
 for(const n of [0,2,3,4])run('Allergy grade '+n,{allergic_reaction_grade:n},n>=3?has('ALLERGY_G3PLUS','consultant_review'):absent('ALLERGY_G3PLUS'));
 run('Supplements absent',{folic_acid_b12_given:false},has('PEMETREXED_SUPPLEMENTS','withhold'));
 run('Rash prophylaxis absent',{dexamethasone_skin_prophylaxis:false},has('PEMETREXED_RASH_PROPHYLAXIS','consultant_review'));
 run('Neoadjuvant fourth cycle',{indication_id:'neoadjuvant_nsclc_nivolumab',cycle_number:4},has('NEOADJUVANT_THREE_CYCLES','consultant_review'));
 run('Neoadjuvant third cycle is in source course',{indication_id:'neoadjuvant_nsclc_nivolumab',cycle_number:3},absent('NEOADJUVANT_THREE_CYCLES'));
 run('Advanced sixth cycle not same as neoadjuvant cap',{indication_id:'advanced_nsclc',cycle_number:6},absent('NEOADJUVANT_THREE_CYCLES'));
 for(const indication of [cis?'mesothelioma':'00318a','advanced_nsclc'])run('Combination course beyond six needs review '+indication,{indication_id:indication,cycle_number:7},has('PLATINUM_COURSE_REVIEW','consultant_review'));
 run('Neoadjuvant course uses specific three-cycle rule',{indication_id:'neoadjuvant_nsclc_nivolumab',cycle_number:4},absent('PLATINUM_COURSE_REVIEW'));
 run('Nivolumab additional plan required',{indication_id:'neoadjuvant_nsclc_nivolumab',nivolumab_plan_assessed_separately:false},has('NIVOLUMAB_SEPARATE_PLAN'));
 run('Squamous NSCLC scope',{indication_id:'advanced_nsclc',nonsquamous_histology:false},has('NSCLC_HISTOLOGY_SCOPE'));
 run('Mesothelioma not NSCLC histology gate',{indication_id:cis?'mesothelioma':'00318a',nonsquamous_histology:false},absent('NSCLC_HISTOLOGY_SCOPE'));
 if(cis){
  for(const n of [40,44,45,49])run('Cisplatin50 original '+n,{crcl_ml_min:n},has('CISPLATIN_CRCL_40_TO49','dose_reduce'));
  for(const n of [50,55,59])run('Cisplatin75 original '+n,{crcl_ml_min:n},has('CISPLATIN_CRCL_50_TO59','dose_reduce'));
  for(const n of [49.01,49.99,59.01,59.99])run('Unassigned fractional CrCl '+n,{crcl_ml_min:n},(r,m)=>{has('CISPLATIN_FRACTIONAL_BOUNDARY','consultant_review')(r);absent('CISPLATIN_CRCL_40_TO49','CISPLATIN_CRCL_50_TO59')(r);assert(m.rows.every(x=>!x.quantified));});
  run('Dialysis cis specialist possibility cannot clear pem',{haemodialysis:true},r=>{has('HAEMODIALYSIS','contraindicated')(r);has('CISPLATIN_DIALYSIS_REVIEW','consultant_review')(r);});
  for(const band of ['renal_0_39','renal_40_44','renal_45_49','renal_50_59','renal_60_plus'])run('Legacy renal band preserved '+band,{crcl_ml_min:band},r=>assert.equal(r.invalid.length,0));
  run('Preexisting renal exclusion',{preexisting_renal_impairment:true},has('BASELINE_RENAL_EXCLUSION'));
 }else{
  for(const n of [0,19.99,20])run('Carboplatin no administration '+n,{gfr_crcl_ml_min:n},has('CARBO_GFR_20_OR_LESS','contraindicated'));
  for(const n of [20.01,21,29.99,30])run('Carboplatin extreme caution '+n,{gfr_crcl_ml_min:n},r=>{has('CARBO_GFR_20_30','consultant_review')(r);absent('CARBO_GFR_20_OR_LESS')(r);});
  for(const n of [30.01,59.99,60])run('Carboplatin upper renal threshold '+n,{gfr_crcl_ml_min:n,pemetrexed_crcl_ml_min:n},absent('CARBO_GFR_20_OR_LESS','CARBO_GFR_20_30'));
  for(const band of ['30_44','lt30','dialysis'])run('Legacy pemetrexed renal band '+band,{pemetrexed_renal_band:band},has('PEMETREXED_CRCL_LT45','contraindicated'));
  run('Carboplatin GFR does not silently confirm pemetrexed CrCl',{gfr_crcl_ml_min:90},has('PEMETREXED_CRCL_NOT_CONFIRMED','consultant_review'));
  for(const n of [48,48.01])run('Estimated creatinine recency '+n,{renal_estimate_method:'estimated',creatinine_age_hours:n},n>48?has('CARBO_ESTIMATE_STALE'):absent('CARBO_ESTIMATE_STALE'));
  for(const n of [110,110.01])run('Isotope creatinine change '+n,{renal_estimate_method:'measured',creatinine_percent_of_isotope_baseline:n},n>110?has('CARBO_ISOTOPE_REASSESS'):absent('CARBO_ISOTOPE_REASSESS'));
 }
 structural('Stable protocol identifier and optional valid schema',()=>{assert.equal(p.protocol_id,`nccp-${c}-v${cis?'7':'6'}`);assert(V.validate(p,{strict:true}).valid);assert.deepEqual(p.required_inputs,[]);for(const i of Object.values(p.input_definitions))assert.equal(i.required,false);for(const k of ['consultant_reviewed','oncology_pharmacy_reviewed','clinical_use_authorised'])assert.equal(p.metadata.validation[k],false);});
 structural('Source-specific schedule and high-risk support',()=>{assert.equal(p.treatment_phases[0].cycle_length_days,21);assert.equal(p.treatment_phases[0].administration[1].dose.value,cis?75:5);assert.equal(p.supportive_care.emetogenic_risk,'high');});
}
const failed=rows.filter(x=>!x.pass),report={release:'0.84.22',mode:integrated?'integrated':'proposed',date:'2026-10-26',total:rows.length,passed:rows.length-failed.length,failed:failed.length,clinical_use_authorised:false,cases:rows};
fs.writeFileSync(path.join(H,integrated?'integrated-results.json':'source-results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({total:report.total,passed:report.passed,failed:report.failed,failures:failed},null,2));if(failed.length)process.exitCode=1;
