'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const H=__dirname,R=path.resolve(H,'../../..'),integrated=process.argv.includes('--integrated');
const E=require(path.join(R,'js/assessment-engine')),V=require(path.join(R,'js/protocol-validator')),D=require(path.join(R,'js/protocol-dose-schedule'));
const A=JSON.parse(fs.readFileSync(path.join(H,'authoring.json'))).regimens, rows=[];let p,code;
const clinical=r=>r.findings.filter(f=>!f.domainAssessment&&!/^PARTIAL_/.test(f.ruleId||''));
const has=(id,type)=>r=>assert(clinical(r).some(f=>f.ruleId===id&&(!type||f.actionType===type)),id+' '+type+'; actual: '+clinical(r).map(f=>f.ruleId));
const absent=(...ids)=>r=>assert(!clinical(r).some(f=>ids.includes(f.ruleId)),'Unexpected '+ids);
function run(name,input,check){const row={code,name,input,source:p.metadata.source_url};try{const r=E.assess(p,input),m=D.buildModificationModel(p,r);assert.deepEqual(r.errors,[]);assert.deepEqual(r.invalid,[]);assert.notEqual(r.actionType,'proceed','Partial inputs cannot clear all unassessed domains');check(r,m);row.pass=true;row.actual={action:r.actionType,findings:clinical(r).map(f=>({id:f.ruleId,action:f.actionType}))};}catch(e){row.pass=false;row.error=e.message;}rows.push(row);}
function structural(name,check){try{check();rows.push({code,name,pass:true});}catch(e){rows.push({code,name,pass:false,error:e.message});}}
for(const [c,file] of [['00271','00271-carboplatin-etoposide.json'],['00280','00280-cisplatin-etoposide.json']]){
 code=c;p=JSON.parse(fs.readFileSync(path.join(integrated?path.join(R,'protocols/lung'):path.join(H,'proposed'),file)));const cis=code==='00280';
 run('Blank remains incomplete',{},r=>assert.equal(r.actionType,'incomplete'));
 for(const val of ['',null])run('Unknown ANC not normal '+String(val),{anc:val},r=>assert.equal(clinical(r).length,0));
 for(const f of ['hypersensitivity','pregnancy','breastfeeding'])for(const b of [true,false])run(f+' independently '+b,{[f]:b},b?has('EXCLUSION_'+f.toUpperCase(),'contraindicated'):absent('EXCLUSION_'+f.toUpperCase()));
 for(const b of [true,false])run('Active infection '+b,{active_infection:b},b?has('ACTIVE_INFECTION','withhold'):absent('ACTIVE_INFECTION'));
 for(const n of [4,6,7])run('Course cycle '+n,{cycle_number:n},n>6?has('COURSE_REVIEW'):absent('COURSE_REVIEW'));
 for(const n of [0,14.99,15,49.99,50,50.001,90])run('Etoposide renal '+n,{etoposide_crcl_ml_min:n},n<15?has('ETOP_RENAL_LT15','dose_reduce'):n<=50?has('ETOP_RENAL_15_50','dose_reduce'):absent('ETOP_RENAL_LT15','ETOP_RENAL_15_50'));
 for(const [f,lo,hi,id] of [['bilirubin_micromol_l',26,51,'BILIRUBIN'],['ast_u_l',60,180,'AST']])for(const n of [0,lo-.001,lo,hi,hi+.001])run('Independent hepatic '+f+' '+n,{[f]:n},n>hi?has('ETOP_HEPATIC_SEVERE','consultant_review'):n>=lo?has('ETOP_HEPATIC_'+id,'dose_reduce'):absent('ETOP_HEPATIC_'+id,'ETOP_HEPATIC_SEVERE'));
 for(const input of [{bilirubin_micromol_l:30,ast_u_l:181},{bilirubin_micromol_l:52,ast_u_l:100}])run('Severe hepatic overrides other moderate value',input,(r,m)=>{has('ETOP_HEPATIC_SEVERE')(r);absent('ETOP_HEPATIC_BILIRUBIN','ETOP_HEPATIC_AST')(r);assert(m.rows.every(x=>!x.quantified));});
 run('Both moderate liver measures',{bilirubin_micromol_l:26,ast_u_l:60},r=>{has('ETOP_HEPATIC_BILIRUBIN')(r);has('ETOP_HEPATIC_AST')(r);});
 run('ULN bilirubin cannot infer absolute dose',{bilirubin_uln_multiple:2},has('HEPATIC_ABSOLUTE_REQUIRED','consultant_review'));
 run('ALT cannot replace AST',{alt_uln_multiple:3},has('HEPATIC_ABSOLUTE_REQUIRED','consultant_review'));
 for(const [f,id] of [['hearing_impairment','HEARING_REVIEW'],['nephrotoxic_or_ototoxic_medicines','INTERACTION_PLATINUM'],['etoposide_interacting_medicines','INTERACTION_ETOPOSIDE']])for(const b of [true,false])run(f+' '+b,{[f]:b},b?has(id):absent(id));
 run('Missing multi-day support needs review',{multi_day_antiemetic_plan_confirmed:false},has('MULTIDAY_SUPPORT'));
 run('Confirmed multi-day support not held',{multi_day_antiemetic_plan_confirmed:true},absent('MULTIDAY_SUPPORT'));
 run('Mucositis does not invent75%/generic reduction',{stomatitis_grade:3},(r,m)=>{has('REVIEW_STOMATITIS_GRADE','consultant_review')(r);assert(m.rows.every(x=>!x.quantified));});
 run('Independent FN',{febrile_neutropenia:true},has('FEBRILE_NEUTROPENIA',cis?'withhold':'delay_then_dose_reduce'));
 if(cis){
  for(const n of [0,.99,1,1.49,1.495,1.5,2])run('Cisplatin regimen ANC '+n,{anc:n},n<1?has('ANC_LT1','delay'):n<=1.49?has('ANC_1_1_49','dose_reduce'):n<1.5?has('COUNT_FRACTIONAL_GAP'):absent('ANC_LT1','ANC_1_1_49','COUNT_FRACTIONAL_GAP'));
  for(const n of [0,74.99,75,99,99.5,100,150])run('Cisplatin regimen platelet '+n,{platelets:n},n<75?has('PLATELETS_LT75','delay'):n<=99?has('PLATELETS_75_99','dose_reduce'):n<100?has('COUNT_FRACTIONAL_GAP'):absent('PLATELETS_LT75','PLATELETS_75_99','COUNT_FRACTIONAL_GAP'));
  run('75% count action names etoposide only',{anc:1.2},r=>{const f=clinical(r).find(f=>f.ruleId==='ANC_1_1_49');assert.deepEqual(f.action.components,['etoposide']);});
  run('Low ANC with moderate platelets still delays',{anc:.5,platelets:90},r=>assert.equal(r.actionType,'delay'));
  for(const n of [44.99,45,59,59.5,59.99,60]){
   run('Initial cisplatin CrCl '+n,{cisplatin_crcl_ml_min:n,treatment_stage:'initial'},n<60?has('CIS_BASELINE_CRCL_LT60','contraindicated'):absent('CIS_BASELINE_CRCL_LT60'));
   run('Unknown stage cisplatin CrCl '+n,{cisplatin_crcl_ml_min:n},n<60?has('CIS_RENAL_STAGE_UNKNOWN'):absent('CIS_RENAL_STAGE_UNKNOWN'));
   run('Continuation cisplatin CrCl '+n,{cisplatin_crcl_ml_min:n,treatment_stage:'continuation'},n<45?has('CIS_CRCL_LT45'):n<=59?has('CIS_CRCL_45_59','dose_reduce'):n<60?has('CIS_CRCL_FRACTIONAL_GAP'):absent('CIS_CRCL_LT45','CIS_CRCL_45_59','CIS_CRCL_FRACTIONAL_GAP'));
  }
  for(const b of ['renal_0_59','renal_60_plus'])run('Compatible old renal band '+b,{egfr:b},has('LEGACY_RENAL_NEEDS_EXACT'));
  run('Cisplatin renal does not assume etoposide clearance',{cisplatin_crcl_ml_min:50,treatment_stage:'continuation'},absent('ETOP_RENAL_15_50','ETOP_RENAL_LT15'));
  for(const n of [0,1,2,3,4])run('Pre-existing neuropathy grade '+n,{preexisting_neuropathy_grade:n},n>=2?has('PREEXISTING_NEUROPATHY','contraindicated'):absent('PREEXISTING_NEUROPATHY'));
  for(const n of [0,1,2,3,4])run('Treatment neuropathy grade '+n,{neuropathy_grade:n},n>=2?(r,m)=>{has('NEUROPATHY_GE2','withhold_then_reduce')(r);assert(m.rows.every(x=>!x.quantified),'Choice must not produce definite dose');}:absent('NEUROPATHY_GE2'));
  for(const f of ['other_toxicity_grade','diarrhoea_grade'])for(const n of [0,1,2,3,4]){const prefix=f.startsWith('other')?'OTHER':'DIARRHOEA';run(f+' '+n,{[f]:n},n===3?has(prefix+'_GRADE3','withhold_then_reduce'):n===4?has(prefix+'_GRADE4','withhold'):absent(prefix+'_GRADE3',prefix+'_GRADE4'));}
  for(const [f,id] of [['significant_baseline_hearing_impairment','BASELINE_HEARING_EXCLUSION'],['severe_liver_impairment','SEVERE_LIVER_EXCLUSION']])for(const b of [true,false])run(f+' '+b,{[f]:b},b?has(id,'contraindicated'):absent(id));
  run('No hydration stops cisplatin',{hydration_plan_confirmed:false},has('HYDRATION_NOT_CONFIRMED','withhold'));
  run('Cannot drink independently actionable',{oral_hydration_impossible:true},has('ORAL_HYDRATION_IMPOSSIBLE'));
  run('Fractionation requires signed plan',{cisplatin_schedule:'fractionated'},has('CIS_FRACTIONATION'));
  run('Standard Day1 schedule no fractionated assumption',{cisplatin_schedule:'day1_75'},absent('CIS_FRACTIONATION'));
  for(const n of [75,75.1,80])run('Age substitution option '+n,{age_years:n},n>75?has('AGE_OVER75_PLATINUM_REVIEW'):absent('AGE_OVER75_PLATINUM_REVIEW'));
 }else{
  for(const n of [0,.499,.5,.999,1,1.001,2])run('Carboplatin regimen ANC '+n,{anc:n},n<.5?has('ANC_LT0_5','delay_then_dose_reduce'):n<1?has('ANC_0_5_LT1','delay'):absent('ANC_LT0_5','ANC_0_5_LT1'));
  for(const n of [0,49.99,50,74.99,75,99.99,100,101])run('Carboplatin regimen platelet '+n,{platelets:n},n<50?has('PLATELETS_LT50','delay_then_dose_reduce'):n<75?has('PLATELETS_50_LT75_GAP'):n<100?has('PLATELETS_75_LT100','delay'):absent('PLATELETS_LT50','PLATELETS_50_LT75_GAP','PLATELETS_75_LT100'));
  run('Consider25% not automatic dose',{anc:.4},(r,m)=>assert(m.rows.every(x=>!x.quantified)));
  for(const n of [0,19.99,20,20.001,30,60,125,125.01])run('Calvert GFR '+n,{egfr:n},n<=20?has('CARBO_GFR_LE20','contraindicated'):n>125?has('CARBO_GFR_CAP'):absent('CARBO_GFR_LE20','CARBO_GFR_CAP'));
  for(const n of [59.99,60])run('CrCl marrow warning '+n,{etoposide_crcl_ml_min:n},n<60?has('CARBO_CRCL_LT60'):absent('CARBO_CRCL_LT60'));
  run('GFR does not silently assume etoposide CrCl',{egfr:30},absent('ETOP_RENAL_LT15','ETOP_RENAL_15_50'));
  for(const n of [48,48.01])run('Creatinine recency '+n,{renal_estimate_method:'estimated',creatinine_age_hours:n},n>48?has('CARBO_ESTIMATE_STALE'):absent('CARBO_ESTIMATE_STALE'));
  run('Estimate missing sample age',{renal_estimate_method:'estimated'},has('CARBO_ESTIMATE_RECENCY_UNKNOWN'));
  for(const n of [110,110.01])run('Isotope creatinine change '+n,{renal_estimate_method:'measured',creatinine_percent_of_isotope_baseline:n},n>110?has('CARBO_ISOTOPE_REASSESS'):absent('CARBO_ISOTOPE_REASSESS'));
  run('GFR estimate unreliable',{gfr_estimate_unreliable:true},has('CARBO_ESTIMATE_UNRELIABLE'));
  run('ECOG3 missing age',{ecog:3},has('ECOG3_AGE_UNKNOWN'));
  for(const n of [69.99,70,71])run('ECOG3 age '+n,{ecog:3,age_years:n},n>=70?has('ECOG3_AGE70PLUS'):absent('ECOG3_AGE70PLUS','ECOG3_AGE_UNKNOWN'));
  run('Cisplatin unsuitable source requirement',{cisplatin_unsuitable:false},has('CISPLATIN_SUITABILITY'));
  for(const n of [0,1,2,3,4])run('Neuropathy review only '+n,{neuropathy_grade:n},n?has('NEUROPATHY_REVIEW'):absent('NEUROPATHY_REVIEW'));
 }
 structural('Strict schema; stable canonical ID; optional partial inputs; no approval',()=>{const result=V.validate(p,{strict:true});assert(result.valid,JSON.stringify(result));assert.equal(result.warnings.length,0);assert.equal(p.protocol_id,cis?'nccp-00280-v6':'nccp-00271-v7');assert.deepEqual(p.required_inputs,[]);for(const v of Object.values(p.input_definitions)){assert.equal(v.required,false);assert(Object.hasOwn(v,'demo_value'));}for(const k of ['consultant_reviewed','oncology_pharmacy_reviewed','clinical_use_authorised'])assert.equal(p.metadata.validation[k],false);});
 structural('Both alternative schedules complete; source order and oralBID explicit',()=>{const model=D.buildModel(p);assert.equal(model.allPhases.length,2);assert(model.allPhases.every(x=>x.complete&&x.cycleLength===21));const standard=p.treatment_phases[0].administration;assert.equal(standard[0].drug,cis?'etoposide':'carboplatin');const oral=p.treatment_phases[1].administration.find(x=>x.route==='oral');assert.deepEqual(oral.day,[2,3]);assert.equal(oral.dose.value,100);assert.equal(oral.dose.frequency,'twice daily');assert(!p.treatment_phases.some(x=>x.cycles));});
 structural('No generic CTCAE5 fallback or renal modality confusion',()=>{for(const [k,v] of Object.entries(p.input_definitions)){if(k.endsWith('_grade')){assert(v.grading_source_label.includes('unspecified'));assert(!v.ctcae_version);}if(k==='egfr'&&!cis)assert.equal(v.renal_input.mode,'exact_continuous');if(['etoposide_crcl_ml_min','cisplatin_crcl_ml_min'].includes(k)){assert.equal(v.renal_input.mode,'source_threshold_numeric');assert.equal(v.renal_input.exact_value_required,false);assert(v.renal_input.source_url);}}});
 structural('Full authoring contract and sources',()=>{const a=A[c],q=a.patient;for(const k of ['clinical','evidence','journey','selector','support_plans','route','risk'])assert(a[k]);assert.equal(a.selector.include_in_breast_selector,false);assert.equal(a.route,'intravenous_with_explicit_oral_alternative');assert.deepEqual(q.evidence.metrics,[]);assert(q.anatomy.every(x=>Array.isArray(x)&&x.length===6));assert(q.questions.every(x=>x.q&&x.a));assert(q.chronology_notes.every(x=>x.title&&x.text));assert(!q.chapters.some(x=>['urgent','support'].includes(x.id)));const ids=new Set(q.sources.map(x=>x.id));function walk(x){if(Array.isArray(x))return x.forEach(walk);if(x&&typeof x==='object')for(const [k,v] of Object.entries(x)){if(k.endsWith('source_ids'))for(const id of v)assert(ids.has(id),'Unknown patient source '+id);else;walk(v);}}walk(q);const jid=new Set([...ids].map(x=>x==='nccp'?c:x));for(const x of [...a.journey.lanes,...a.journey.milestones])for(const id of x.source_ids)assert(jid.has(id));assert(a.support_plans[0].additional_support.some(x=>/Day ?5/.test(x)));});
}
const failed=rows.filter(x=>!x.pass),report={release:'0.84.23',mode:integrated?'integrated':'proposed',date:'2026-10-26',total:rows.length,passed:rows.length-failed.length,failed:failed.length,clinical_use_authorised:false,cases:rows};fs.writeFileSync(path.join(H,integrated?'integrated-results.json':'source-results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({total:report.total,passed:report.passed,failed:report.failed,failures:failed},null,2));if(failed.length)process.exitCode=1;
