'use strict';
// Clinical expectations transcribed from each fresh NCCP table before evaluating the application.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../../..'),E=require(path.join(root,'js/assessment-engine')),D=require(path.join(root,'js/protocol-dose-schedule')),V=require(path.join(root,'js/protocol-validator'));
const cases=[],matrices=[];const beforeMode=process.argv.includes('--before');
for(const [code,days]of [['00379',42],['00658',56]]){
 const long=days===56,name=fs.readdirSync(path.join(root,'protocols/neuro-oncology')).find(f=>f.startsWith(code)),cur=JSON.parse(fs.readFileSync(path.join(root,'protocols/neuro-oncology',name))),old=JSON.parse(fs.readFileSync(path.join(__dirname,code+'-before.json'))),p=beforeMode?old:cur;
 function test(name,input,want={},page='source-specific'){let a,model;try{a=E.assess(p,input);model=D.buildModificationModel(p,a);assert.deepEqual(a.errors,[]);assert.deepEqual(a.invalid,[]);if(want.action)assert.equal(a.actionType,want.action);for(const id of want.yes||[])assert(a.findings.some(f=>f.ruleId===id),'Missing '+id);for(const id of want.no||[])assert(!a.findings.some(f=>f.ruleId===id),'Unexpected '+id);assert(!model.hasQuantified,'No numeric modification may be inferred from review prose');assert(model.rows.every(r=>!r.quantified&&r.allActions.every(x=>!x.quantified)),'Nested numeric dose forbidden');if(want.text)assert.match(JSON.stringify(a.findings),want.text);if(want.component)assert(model.rows.some(r=>r.component.toLowerCase()===want.component.toLowerCase()),'Missing component row '+want.component);cases.push({code,name,input,page,pass:true,action:a.actionType,rules:a.findings.filter(f=>!f.domainAssessment).map(f=>f.ruleId),dose_rows:model.rows.map(r=>({component:r.component,dose:r.protocolDose}))});}catch(e){cases.push({code,name,input,page,pass:false,error:e.message,action:a?.actionType,rules:a?.findings.map(f=>f.ruleId),dose_rows:model?.rows})}}
 function inv(name,fn,page='source-specific'){try{fn();cases.push({code,name,page,pass:true,rules:[]})}catch(e){cases.push({code,name,page,pass:false,error:e.message,rules:[]})}}
 test('Empty assessment',{}, {action:'incomplete'});
 for(const f of Object.keys(cur.input_definitions))for(const v of [null,''])test('Missing '+f+' '+JSON.stringify(v),{[f]:v},{action:'incomplete'},'missing inputs are never normal');
 for(let ecog=0;ecog<=4;ecog++)for(const context of [undefined,'adjuvant',...(long?[]:['palliative'])]){
  const x={ecog};if(context)x.indication_context=context;
  const expected=long?ecog>2:ecog>3||ecog===3&&context!=='palliative';test('ECOG '+ecog+'/'+context,x,expected?{action:'consultant_review'}:{no:['ECOG_OUTSIDE_PATHWAY','ECOG_ADJUVANT','ECOG_CONTEXT']},1)
 }
 test('Wrong indication',{indication_eligible:false},{action:'consultant_review',yes:['INDICATION']},1);
 test('Indication alone does not clear all domains',{indication_eligible:true},{no:['INDICATION']},1);
 for(const n of [3.99,4,4.01])test('Adjuvant afterRT '+n,{indication_context:'adjuvant',weeks_since_radiotherapy:n},n>4?{action:'consultant_review',yes:['ADJUVANT_RT_TIMING']}:{no:['ADJUVANT_RT_TIMING']},1);
 if(long)for(const n of [1,6,7])test('Sixcycle plan '+n,{cycle_number:n},n>6?{yes:['CYCLES_BEYOND_SIX']}:{no:['CYCLES_BEYOND_SIX']},1);
 for(const [f,id]of [['hypersensitivity','HYPERSENSITIVITY'],['pregnancy','PREGNANCY'],['breastfeeding','BREASTFEEDING']])for(const v of [false,true])test(f+'/'+v,{[f]:v},v?{action:'contraindicated',yes:[id]}:{no:[id]},2);
 const ancs=[.49,.5,.999,.9999,1,1.0001,1.1],plts=[49.9,50,99,99.5,99.999,100,100.001,150];
 for(const day of ['day1','day8','day29'])for(const anc of ancs)for(const plt of plts){const x={assessment_day:day,anc_x10e9_l:anc,platelets_x10e9_l:plt,clinically_well:true};let expected;
  if(day==='day29')expected=anc<.5||plt<50?{action:'omit',yes:['D29_SEVERE_COUNTS'],no:['D29_COUNTS_MEET']}:{action:'proceed_with_caution',yes:['D29_COUNTS_MEET'],no:['D29_SEVERE_COUNTS']};
  else{const pre=day==='day1'?'D1':'D8';expected=anc<.5||plt<50?{action:'delay_then_dose_reduce',yes:[pre+'_SEVERE_COUNTS'],no:[pre+'_MODERATE_COUNTS',pre+'_COUNTS_ABOVE_BOUNDARY']}:anc<1||plt<100?{action:'withhold',yes:[pre+'_MODERATE_COUNTS'],no:[pre+'_SEVERE_COUNTS',pre+'_COUNT_BOUNDARY']}:anc===1||plt===100?{action:'consultant_review',yes:[pre+'_COUNT_BOUNDARY'],no:[pre+'_COUNTS_ABOVE_BOUNDARY']}:{action:'proceed_with_caution',yes:[pre+'_COUNTS_ABOVE_BOUNDARY']};}
  test('Source Table1 '+day+'/'+anc+'/'+plt,x,expected,3);
 }
 for(const f of ['anc_x10e9_l','platelets_x10e9_l'])for(const n of [f==='anc_x10e9_l'?.4:40,f==='anc_x10e9_l'?.7:70,f==='anc_x10e9_l'?1.1:110])for(const day of ['day1','day8','day29',undefined,'preceding_nadir']){
  const x={[f]:n};if(day)x.assessment_day=day;
  test('Partialcount '+day+'/'+f+'/'+n,x,{no:['D1_COUNTS_ABOVE_BOUNDARY','D8_COUNTS_ABOVE_BOUNDARY','D29_COUNTS_MEET'],...(day===undefined||day==='preceding_nadir'?{action:'consultant_review',yes:['COUNT_DAY_REQUIRED']}:{})},3);
 }
 for(const well of [undefined,false,true])test('Wellnessrequired '+well,{assessment_day:'day29',anc_x10e9_l:1.1,platelets_x10e9_l:110,...(well===undefined?{}:{clinically_well:well})},well===true?{yes:['D29_COUNTS_MEET']}:{no:['D29_COUNTS_MEET'],...(well===false?{action:'consultant_review',yes:['NOT_CLINICALLY_WELL']}:{})},3);
 for(const [f,values]of [['preceding_nadir_anc_x10e9_l',[.4999,.5,.5001]],['preceding_nadir_platelets_x10e9_l',[49.999,50,50.001]]])for(const n of values)for(const applied of [undefined,false,true]){
  const x={[f]:n};if(applied!==undefined)x.nadir_reduction_already_applied=applied;const low=f.includes('anc')?n<.5:n<50;test('Nadir '+f+'/'+n+'/'+applied,x,low?{action:'consultant_review',yes:[applied===true?'NADIR_ALREADY_APPLIED':'NADIR_REDUCTION']}:{no:['NADIR_REDUCTION','NADIR_ALREADY_APPLIED']},3);
 }
 for(const dose of [25,50,75,100])test('Prior-dose history not starting-dose reset '+dose,{preceding_nadir_anc_x10e9_l:.4,previous_lomustine_dose_percent:dose,previous_procarbazine_dose_percent:dose,nadir_reduction_already_applied:false},{action:'consultant_review',text:/PREVIOUS cycle/,yes:['NADIR_REDUCTION']},3);
 test('Day8 severe counts do not dose-reduce vincristine',{assessment_day:'day8',anc_x10e9_l:.4,platelets_x10e9_l:120},{action:'delay_then_dose_reduce',text:/maintain vincristine dose/},3);
 test('Nadir does not override current-day omission',{assessment_day:'day29',anc_x10e9_l:.4,preceding_nadir_anc_x10e9_l:.4},{action:'omit',yes:['D29_SEVERE_COUNTS','NADIR_REDUCTION']},3);
 for(const n of [0,29.999,30,30.001,44,44.999,45,45.001,59.999,60,60.001,100]){
  const id=n<30?'LOM_LT30':n<45?'LOM_30_44':n===45?'LOM_RENAL_45_OVERLAP':n<=60?'LOM_45_60':'LOM_RENAL_NORMAL';test('ExactCrCl '+n,{crcl_ml_min:n},{action:n>60?'proceed_with_caution':'consultant_review',yes:[id]},long?3:4)
 }
 for(const band of ['45_60','30_44','lt30'])test('Legacy renal band '+band,{lomustine_renal_band:band},{action:'consultant_review',yes:['LOM_LEGACY_'+band.toUpperCase()]},long?3:4);
 test('ExactCrCl overrides misleadinglegacyband',{crcl_ml_min:45,lomustine_renal_band:'45_60'},{yes:['LOM_RENAL_45_OVERLAP'],no:['LOM_LEGACY_45_60','LOM_45_60']},long?3:4);
 for(const n of [176.99,177,177.01])test('Creatinine177boundary '+n,{serum_creatinine_umol_l:n},n>177?{yes:['PROC_CR_GT177']}:{no:['PROC_CR_GT177']},long?3:4);
 test('Procarbazinelegacycreatinine',{procarbazine_renal_band:'creatinine_gt177'},{yes:['PROC_CR_GT177']},long?3:4);
 for(const x of [{severe_renal_impairment:true},{procarbazine_renal_band:'severe'}])test('Severerenal not numericcutoff '+JSON.stringify(x),x,{action:'consultant_review',yes:['PROC_RENAL_SEVERE']},long?3:4);
 for(const bili of [25.99,26,50,50.01,51,51.01,85,85.01])for(const ast of [29,59.99,60,180,180.01]){
  const x={bilirubin_umol_l:bili,ast_u_l:ast};const yes=[],no=[];
  if(bili>85||ast>180)yes.push('PROC_HEPATIC_CONTRA');else no.push('PROC_HEPATIC_CONTRA');
  if(bili>50&&bili<=85)yes.push('PROC_BILI_GT50');
  if(bili>=26&&bili<=51||ast>=60&&ast<=180)yes.push('VIN_HEPATIC_50_A');else no.push('VIN_HEPATIC_50_A');
  if(bili>51&&ast>180)yes.push('VIN_HEPATIC_OMIT');else no.push('VIN_HEPATIC_OMIT');
  if(bili<=51&&ast>180)yes.push('VIN_LIVER_UNCOVERED');
  test('Componenthepaticmatrix '+bili+'/'+ast,x,{yes,no,...(bili>85||ast>180?{action:'contraindicated'}:bili>51&&ast>180?{action:'omit'}:{})},long?3:4)
 }
 for(const alt of [59.99,60,180,180.01])test('ALT !=ASTprocarbazine '+alt,{alt_u_l:alt},alt>180?{yes:['PROC_ALT_AMBIGUITY'],no:['PROC_HEPATIC_CONTRA']}:{no:['PROC_ALT_AMBIGUITY','PROC_HEPATIC_CONTRA'],...(alt>=60?{yes:['VIN_HEPATIC_50_A']}:{})},long?3:4);
 for(const normal of [undefined,false,true])test('Normalnot<=180 '+normal,{bilirubin_umol_l:60,ast_u_l:50,...(normal===undefined?{}:{transaminases_normal_confirmed:normal})},normal===true?{yes:['VIN_HEPATIC_50_B'],no:['VIN_NORMAL_NOT_CONFIRMED']}:{yes:['VIN_NORMAL_NOT_CONFIRMED'],no:['VIN_HEPATIC_50_B']},long?3:4);
 test('LegacyASTALTretainedsafely',{ast_alt_u_l:200},{action:'consultant_review',yes:['LEGACY_TRANSAMINASE_REVIEW'],no:['PROC_HEPATIC_CONTRA']},long?3:4);
 test('Lomustinehepaticmissingpercentage',{hepatic_impairment_present:true},{action:'consultant_review',yes:['LOM_HEPATIC_REVIEW']},long?3:4);
 for(let g=0;g<=4;g++)test('Vincristineneuropathy '+g,{neuropathy_grade:g},g>=3?{action:long?'withhold':'consultant_review',yes:['VIN_NEURO_G34']}:g===2?{action:'consultant_review',yes:['VIN_NEURO_G2']}:{no:['VIN_NEURO_G2','VIN_NEURO_G34']},long?4:5);
 for(const f of ['baseline_fvc_percent_predicted','baseline_dlco_percent_predicted'])for(const n of [59.99,60,69.99,70,70.01])test('Baselinepulmonary70 '+f+'/'+n,{[f]:n},n<70?{action:'consultant_review',yes:['LOM_BASELINE_LUNG_CAUTION']}:{no:['LOM_BASELINE_LUNG_CAUTION']},long?5:4);
 for(const symptom of [undefined,false,true])for(const dlco of [undefined,59.99,60,60.01,69.99,70]){
  const x={};if(symptom!==undefined)x.pulmonary_symptoms_or_concern=symptom;if(dlco!==undefined)x.dlco_percent_predicted=dlco;
  const yes=[],no=['LOM_DLCO'];if(symptom===true)yes.push('LOM_PULM');
  if(long){if(symptom===true&&dlco<60)yes.push('LOM_PULM_SYMPTOMS_AND_DLCO');else no.push('LOM_PULM_SYMPTOMS_AND_DLCO');if(symptom!==true&&dlco<60)yes.push('LOM_DLCO_REVIEW');}
  else no.push('LOM_PULM_SYMPTOMS_AND_DLCO','LOM_DLCO_REVIEW');
  test('Pulmonarysourceconjunction '+symptom+'/'+dlco,x,{yes,no,...(long&&symptom===true&&dlco<60?{action:'withhold'}:{})},long?4:4);
 }
 test('Severeabdominaljawpain',{severe_abdominal_or_jaw_pain:true},long?{action:'withhold',yes:['VIN_PAIN']}:{action:'consultant_review',yes:['SEVERE_PAIN_REVIEW'],no:['VIN_PAIN']},long?4:5);
 test('Urticarialrash',{urticarial_rash_from_procarbazine:true},long?{action:'withhold',yes:['PROC_RASH']}:{action:'consultant_review',yes:['RASH_REVIEW'],no:['PROC_RASH']},long?4:2);
 if(long){
  for(const applied of [false,true])test('Previouspainneverreset '+applied,{previous_severe_abdominal_or_jaw_pain:true,prior_vincristine_reduction_confirmed:applied},{action:'consultant_review',yes:['VIN_PAIN_HISTORY'],text:/already incorporated/},4);
  for(let grade=0;grade<=4;grade++)for(const opt of [undefined,false,true])test('Nauseaantiemeticguard '+grade+'/'+opt,{nausea_or_vomiting_grade:grade,...(opt===undefined?{}:{antiemetics_optimised:opt})},grade>=3?{action:'consultant_review',yes:['NV_ACTIVE_REVIEW',...(opt===true?['NV_G'+grade]:[])],no:opt===true?[]:['NV_G3','NV_G4']}:{no:['NV_ACTIVE_REVIEW','NV_G3','NV_G4']},4);
  for(let grade=0;grade<=4;grade++)test('Otherseveregrade '+grade,{other_nonhaem_toxicity_grade:grade},grade>=3?{action:'consultant_review',yes:['OTHER_ACTIVE_REVIEW','OTHER_G'+grade]}:{no:['OTHER_ACTIVE_REVIEW','OTHER_G3','OTHER_G4']},4);
  test('Recoveredtoxicitynotautomaticrestart',{previous_nausea_vomiting_grade:3,toxicity_recovered_and_restart_considered:true},{yes:['TOXICITY_RESTART_REVIEW']},4);
  for(const f of ['previous_nausea_vomiting_grade','previous_other_toxicity_grade'])for(const n of [2,3,4])test('Severeeventhistory '+f+'/'+n,{[f]:n},n>=3?{yes:[f.includes('nausea')?'NV_HISTORY':'OTHER_HISTORY']}:{no:['NV_HISTORY','OTHER_HISTORY']},4)
 }else for(const f of ['nausea_or_vomiting_grade','other_nonhaem_toxicity_grade'])for(const n of [2,3,4])test('Noimported56daytoxicitytable '+f+'/'+n,{[f]:n},n>=3?{action:'consultant_review',yes:[f.toUpperCase()+'_REVIEW']}:{no:[f.toUpperCase()+'_REVIEW']},2);
 for(const [f,id,type]of [['active_infection','ACTIVE_INFECTION','withhold'],['tests_missing_or_overdue','TESTS_MISSING','consultant_review'],['constipation_or_ileus_concern','CONSTIPATION','consultant_review'],['constipation_prevention_missing','CONSTIPATION_PREVENTION','consultant_review'],['major_maoi_or_cyp3a_interaction','INTERACTION','consultant_review'],['alcohol_or_food_interaction_concern','ALCOHOL_FOOD','consultant_review'],['oral_supply_or_schedule_uncertain','ORAL_SUPPLY','consultant_review'],['extravasation_suspected','EXTRAVASATION','withhold'],['weekly_lomustine_bloods_plan_missing','LOM_WEEKLY_CBC_PLAN','consultant_review'],['lomustine_product_contraindication','LOM_PRODUCT_CONTRAINDICATION','consultant_review'],['contraception_plan_unconfirmed','CONTRACEPTION_SOURCE_DIFFERENCE','consultant_review']])for(const value of [false,true])test(f+'/'+value,{[f]:value},value?{action:type,yes:[id]}:{no:[id]},'NCCPpp1–5 or named supplementarySmPC');
 for(const n of [0,41.99,42,42.01,55,56])test('Minimumlomustineinterval '+n,{days_since_last_lomustine:n},n<42?{action:'withhold',yes:['LOM_MINIMUM_INTERVAL']}:{no:['LOM_MINIMUM_INTERVAL']},'SmPC4.2–4.4');
 for(const n of [999.99,1000,1000.01,1100])test('Cumulativeceiling '+n,{planned_cumulative_lomustine_mg_m2:n},n>1000?{action:'withhold',yes:['LOM_CUMULATIVE_LIMIT']}:{no:['LOM_CUMULATIVE_LIMIT']},'SmPC4.2–4.4');
 for(const n of [3.99,4,4.01])test('WBCnotANC '+n,{assessment_day:'day1',wbc_x10e9_l:n,anc_x10e9_l:2,platelets_x10e9_l:150,clinically_well:true},n<4?{action:'consultant_review',yes:['LOM_WBC_SOURCE_DIFFERENCE']}:{no:['LOM_WBC_SOURCE_DIFFERENCE']},'SmPC4.2 versusNCCPTable1');
 for(const extra of [{active_infection:true},{hypersensitivity:true},{extravasation_suspected:true},{days_since_last_lomustine:20},{planned_cumulative_lomustine_mg_m2:1001}])test('Otherdomainoverridesgoodcounts '+JSON.stringify(extra),{assessment_day:'day1',anc_x10e9_l:2,platelets_x10e9_l:150,clinically_well:true,...extra},{action:extra.hypersensitivity?'contraindicated':'withhold'},'combinedsourcechecks');
 for(const [f,values]of [['anc_x10e9_l',[-1,'Infinity',{},[]]],['platelets_x10e9_l',[-1,'NaN',{},[]]],['crcl_ml_min',[-1,'Infinity',{},[]]],['neuropathy_grade',[-1,5,{},[]]],['previous_lomustine_dose_percent',[0,101,{},[]]],['assessment_day',['wrong',{},[]]]])for(const value of values)inv('Invalid '+f+'/'+JSON.stringify(value),()=>{let a=E.assess(p,{[f]:value});assert(a.invalid.length);assert(!D.buildModificationModel(p,a).hasQuantified)},'validation');
 inv('Exactfreshsourcehash',()=>assert.equal(p.metadata.source_pdf_sha256,crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'sources',code+'.pdf'))).digest('hex')));
 inv('Protocolschema',()=>{const v=V.validate(p);assert.deepEqual(v.errors,[]);assert.deepEqual(v.warnings,[])});
 inv('Distinct42and56schedule',()=>{const model=D.buildModel(p);assert.equal(model.phases.length,1);assert.equal(model.phases[0].cycleLength,days);assert.equal(model.phases[0].components.length,3);assert.equal(model.phases[0].cycles,long?6:null);assert.deepEqual(p.treatment.components.map(c=>[c.drug,c.days]),[['lomustine',[1]],['procarbazine',Array.from({length:14},(_,i)=>i+8)],['vincristine',[8,29]]]);assert.match(p.treatment.components[2].dose,/maximum 2 mg/);assert.match(p.treatment.components[1].note,/do not add Day 22/);assert.deepEqual(model.doseLevels,[])},1);
 inv('Independentapprovalnotclaimed',()=>{assert.equal(p.metadata.validation.clinical_use_authorised,false);assert.equal(p.metadata.validation.consultant_reviewed,false);assert.equal(p.metadata.validation.oncology_pharmacy_reviewed,false)});
 inv('Supportphasesretained',()=>{assert.equal(p.supportive_care.phase_profiles.lomustine_day_1.level,'oral_moderate_high');assert.equal(p.supportive_care.phase_profiles.procarbazine_days_8_to_21.level,'oral_moderate_high');assert.equal(p.supportive_care.phase_profiles.vincristine_days_8_and_29.level,'minimal')});
 const matrix=cur.rule_engine.rules.map(r=>({code,rule_id:r.id,source:r.source,cases:cases.filter(c=>c.code===code&&c.pass&&c.rules.includes(r.id)).map(c=>c.name)}));matrices.push(...matrix);
 if(!beforeMode)for(const row of matrix)inv('Executedsourcecriterion '+row.rule_id,()=>{assert(row.cases.length,'No positive witness');assert(row.source.url&&row.source.sha256&&row.source.page);assert(cur.rule_engine.rules.find(r=>r.id===row.rule_id).action.block_numeric_dose)});
}
const report={release:'0.84.38',mode:beforeMode?'before':'current',protocols:['00379','00658'],passed:cases.filter(c=>c.pass).length,failed:cases.filter(c=>!c.pass).length,total:cases.length,clinical_use_authorised:false,cases};fs.writeFileSync(path.join(__dirname,beforeMode?'source-case-before-results.json':'source-case-results.json'),JSON.stringify(report,null,2)+'\n');if(!beforeMode)fs.writeFileSync(path.join(__dirname,'criterion-matrix.json'),JSON.stringify(matrices,null,2)+'\n');console.log(JSON.stringify({mode:report.mode,total:report.total,passed:report.passed,failed:report.failed,failures:cases.filter(c=>!c.pass).map(c=>({code:c.code,name:c.name,error:c.error}))},null,2));if(report.failed)process.exitCode=1;
