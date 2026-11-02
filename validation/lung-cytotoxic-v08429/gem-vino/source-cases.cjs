'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const B=__dirname,R=path.resolve(B,'../../..'),E=require(R+'/js/assessment-engine'),integrated=process.argv.includes('--integrated'),results=[];
const auth=JSON.parse(fs.readFileSync(B+'/authoring.json')).regimens;
function check(name,fn){try{fn();results.push({name,pass:true});}catch(e){results.push({name,pass:false,error:e.message});}}
function load(c){let dirs=integrated?fs.readdirSync(R+'/protocols').map(t=>R+'/protocols/'+t).filter(f=>fs.statSync(f).isDirectory()):[B+'/proposed'];for(let dir of dirs){let name=fs.readdirSync(dir).find(n=>n.startsWith(c+'-'));if(name)return JSON.parse(fs.readFileSync(dir+'/'+name));}throw Error(c);}
for(const code of ['00284','00614','00232','00259']){
 const p=load(code),dose=require(R+'/js/protocol-dose-schedule').buildModel(p);
 check(code+' complete dose schedule is available',()=>{assert(dose.phases.length>0);assert(dose.phases.every(x=>x.complete));});
 check(code+' strict schema and unique rule IDs',()=>{const V=require(R+'/js/protocol-validator');const v=V.validate(p,{strict:true});assert.equal(v.valid,true,V.formatIssues(v).join('\n'));const ids=p.rule_engine.rules.map(r=>r.rule_id||r.id);assert.equal(new Set(ids).size,ids.length);});
 function t(name,input,yes=[],no=[]){check(code+' '+name,()=>{let r=E.assess(p,input);assert.deepEqual(r.errors,[]);assert.deepEqual(r.invalid,[]);let ids=r.findings.map(f=>f.ruleId);for(let id of yes)assert(ids.includes(id),'missing '+id+' got '+ids);for(let id of no)assert(!ids.includes(id),'unexpected '+id);});}
 check(code+' incomplete cannot clear',()=>{const r=E.assess(p,{});assert.equal(r.complete,false);assert(!['proceed','proceed_with_caution'].includes(r.actionType));});
 check(code+' source metadata and governance',()=>{assert.equal(p.metadata.full_suite_release,'0.84.29');assert.match(p.metadata.source_pdf_sha256,/^[0-9a-f]{64}$/);assert.equal(p.metadata.validation.clinical_use_authorised,false);assert.equal(p.clinical_governance.clinical_use_authorised,false);});
 if(code==='00284'){
  check('gem source indication IDs and selector match',()=>{assert.equal(p.metadata.dose_schedule_context_input,'indication_id');assert.deepEqual(p.indications.map(x=>x.indication_id),['00284a','00284b']);assert.deepEqual(dose.phases.map(x=>x.id),['00284a','00284b']);for(const phase of dose.phases)assert(p.input_definitions.indication_id.options.some(o=>o.value===phase.id));});
  check('gem retired synthetic indication remains unresolved',()=>{const old=E.assess(p,{indication_id:'00284-lung',bilirubin_micromol_l:30});assert.equal(old.complete,false);assert(old.invalid.some(x=>x.id==='indication_id'));const model=require(R+'/js/protocol-dose-schedule').buildModificationModel(p,old);assert(model.rows.every(x=>!x.quantified&&x.startingDose===''));});
  check('gem separates finite pancreas from indefinite lung',()=>{const [pancreas,lung]=dose.phases;assert.equal(pancreas.cycles,6);assert.equal(lung.cycles,null);assert.match(lung.duration,/until disease progression or unacceptable toxicity/);});
  check('gem all three administrations every 28 days',()=>{for(const phase of dose.phases){assert.equal(phase.cycleLength,28);assert.equal(phase.components.length,1);const g=phase.components[0];assert.equal(g.dose,'1000 mg/m²');assert.equal(g.route,'IV');assert.deepEqual(g.days,['1','8','15']);}});

  for(const n of [.49,.5,1,1.01,1.49,1.5,1.51]){
   t('day1 ANC '+n,{treatment_day:'day1',anc_x10e9_l:n},n<=1?['DAY1_COUNTS']:n<1.5?['DAY1_SMPC_CONFLICT']:[],n>1?['DAY1_COUNTS']:['DAY1_SMPC_CONFLICT']);
   for(const day of ['day8','day15'])t(day+' ANC '+n,{treatment_day:day,anc_x10e9_l:n},n<.5?['WITHIN_CYCLE_OMIT']:n<=1?['WITHIN_CYCLE_75']:[],n<.5?['WITHIN_CYCLE_75']:n>1?['WITHIN_CYCLE_OMIT','WITHIN_CYCLE_75']:['WITHIN_CYCLE_OMIT']);
   t('baseline ANC '+n,{assessment_stage:'baseline',anc_x10e9_l:n},n<=1.5?['BASELINE_COUNTS']:[],n>1.5?['BASELINE_COUNTS']:[]);
  }
  for(const n of [49.99,50,75,100,100.01]){
   t('day1 PLT '+n,{treatment_day:'day1',platelets_x10e9_l:n},n<=100?['DAY1_COUNTS']:[],n>100?['DAY1_COUNTS']:[]);
   for(const day of ['day8','day15'])t(day+' PLT '+n,{treatment_day:day,platelets_x10e9_l:n},n<50?['WITHIN_CYCLE_OMIT']:n<=100?['WITHIN_CYCLE_75']:[],n<50?['WITHIN_CYCLE_75']:n>100?['WITHIN_CYCLE_OMIT','WITHIN_CYCLE_75']:['WITHIN_CYCLE_OMIT']);
  }
  t('unselected day',{anc_x10e9_l:.7},['DAY_REQUIRED'],['DAY1_COUNTS','WITHIN_CYCLE_75']);
  for(const n of [29.99,30,30.01])t('CrCl '+n,{crcl_ml_min:n},n<30?['RENAL_LT30']:n===30?['RENAL_EXACT30_GAP']:[],n>30?['RENAL_LT30','RENAL_EXACT30_GAP']:[]);
  for(const n of [26.99,27,27.01])t('bilirubin '+n,{bilirubin_micromol_l:n},n>=27?['BILIRUBIN_GE27']:[],n<27?['BILIRUBIN_GE27']:[]);
  for(const n of [1.49,1.5,1.51])t('baseline creatinine '+n,{assessment_stage:'baseline',creatinine_uln_multiple:n},n>1.5?['BASELINE_ORGAN_FUNCTION']:[],n<=1.5?['BASELINE_ORGAN_FUNCTION']:[]);
  for(const n of [2.99,3,3.01])t('baseline transaminase '+n,{assessment_stage:'baseline',alt_ast_uln_multiple:n},n>3?['BASELINE_ORGAN_FUNCTION']:[],n<=3?['BASELINE_ORGAN_FUNCTION']:[]);
  for(const n of [0,1,2,3,4])t('nonhaem '+n,{other_nonhaem_toxicity_grade:n},n>=3?['NONHAEM_AMBIGUOUS']:[],n<3?['NONHAEM_AMBIGUOUS']:[]);
  for(const n of [.5,.51])t('restart ANC '+n,{restart_after_omission:true,anc_x10e9_l:n},n<=.5?['RESTART_COUNTS']:[],n>.5?['RESTART_COUNTS']:[]);
  for(const n of [50,50.01])t('restart PLT '+n,{restart_after_omission:true,platelets_x10e9_l:n},n<=50?['RESTART_COUNTS']:[],n>50?['RESTART_COUNTS']:[]);
  for(const event of ['anc_lt05_gt5d','anc_lt01_gt3d','febrile_neutropenia','platelets_lt25','delay_gt1week'])t('prior '+event,{prior_haematologic_event:event},['PRIOR_EVENT_75']);
  t('pancreas6',{indication_id:'00284a',cycle_number:6},['PANCREAS_SEPARATE_CONTEXT'],['PANCREAS_CYCLE_LIMIT']);t('pancreas7',{indication_id:'00284a',cycle_number:7},['PANCREAS_CYCLE_LIMIT']);t('lung7',{indication_id:'00284b',cycle_number:7},[],['PANCREAS_CYCLE_LIMIT']);
  for(const [key,id]of [['drug_pneumonitis_suspected','PNEUMONITIS'],['scar_confirmed','SCAR_CONFIRMED'],['scar_suspected','SCAR_SUSPECTED'],['hus_suspected','HUS'],['pres_suspected','PRES'],['concurrent_radiotherapy','RADIOTHERAPY']])t(id,{[key]:true},[id]);
  check('gem no platinum actions',()=>{for(const r of p.rule_engine.rules)assert.deepEqual(r.action.components,['gemcitabine']);});
 }
 if(code==='00614'){
  check('combo mutually exclusive route selector matches phases',()=>{assert.equal(p.metadata.dose_schedule_context_input,'vinorelbine_route');assert.deepEqual(dose.phases.map(x=>x.id),['iv','oral']);for(const phase of dose.phases){assert(p.input_definitions.vinorelbine_route.options.some(o=>o.value===phase.id));assert.equal(phase.components.filter(c=>/Vinorelbine/i.test(c.drug)).length,1);assert.equal(phase.cycles,4);assert.equal(phase.cycleLength,21);}});
  check('combo day1 carboplatin and day1 day8 vinorelbine doses',()=>{for(const phase of dose.phases){const v=phase.components.find(c=>/Vinorelbine/i.test(c.drug)),c=phase.components.find(c=>/Carboplatin/i.test(c.drug));assert.deepEqual(v.days,['1','8']);assert.deepEqual(c.days,['1']);assert.equal(c.dose,'AUC 5');assert.equal(c.route,'IV');assert.equal(v.dose,phase.id==='iv'?'25 mg/m²':'60 mg/m²');assert.equal(v.route,phase.id==='iv'?'IV':'oral');}});
  check('combo percentage actions require documented dose or specialist review',()=>{for(const rule of p.rule_engine.rules){const a=rule.action;if(a.components.includes('vinorelbine')&&a.recommendation.includes('%')){assert.equal(a.dose_basis,'documented_starting_dose');if(rule.rule_id==='VIN_HEPATIC_SEVERE')assert.equal(a.dose_percent_of_original,66);else assert.equal(a.dose_calculation,'specialist_review');}}});
  for(const route of ['iv','oral'])check('combo '+route+' hepatic reduction is percentage of documented dose',()=>{const assessed=E.assess(p,{treatment_day:'day1',vinorelbine_route:route,oral_dose_mg_m2:80,hepatic_impairment:'severe'});const mod=require(R+'/js/protocol-dose-schedule').buildModificationModel(p,assessed),vin=mod.rows.find(x=>x.componentId==='vinorelbine');assert(vin);assert.match(vin.protocolDose,/66% of documented starting dose/);assert(!/16\.5|39\.6|52\.8|mg\/m²/.test(vin.protocolDose));assert(!mod.rows.some(x=>x.componentId==='carboplatin'));});
  check('combo unresolved route cannot acquire a numeric dose',()=>{const assessed=E.assess(p,{treatment_day:'day1',hepatic_impairment:'severe'});const mod=require(R+'/js/protocol-dose-schedule').buildModificationModel(p,assessed);assert(mod.rows.every(x=>x.startingDose===''&&!x.quantified));});
  check('combo ambiguous reduction denominator stays nonnumeric',()=>{const assessed=E.assess(p,{treatment_day:'day1',vinorelbine_route:'oral',oral_dose_mg_m2:80,neuropathy_grade:2,neuropathy_persistent:false});const mod=require(R+'/js/protocol-dose-schedule').buildModificationModel(p,assessed),vin=mod.rows.find(x=>x.componentId==='vinorelbine');assert(vin);assert.equal(vin.quantified,false);assert(!/45 mg|60 mg|20 mg/.test(vin.protocolDose));});
  check('combo source discretionary doses never become automatic escalation',()=>{const iv=dose.phases.find(x=>x.id==='iv').components[0],oral=dose.phases.find(x=>x.id==='oral').components[0];assert.match(iv.note,/physician may initiate or increase to 35/);assert.match(iv.note,/Neither escalation nor reduction is automatic/);assert.match(oral.note,/Only if well tolerated and prescribed, consider 80 mg\/m² from cycle 2 or 3/);assert.match(oral.note,/maximum 120 mg/);assert.match(oral.note,/maximum 160 mg/);assert.match(oral.note,/Confirm the currently prescribed dose/);});

  for(const n of [.49,.5,.99,1,1.49,1.5])t('ANC '+n,{anc_x10e9_l:n},n<.5?['ANC_LT05']:n<1?['LOW_ANC']:n<1.5?['VINORELBINE_SMPC_COUNT_CONFLICT']:[],n>=1?['LOW_ANC','ANC_LT05']:n<.5?['LOW_ANC']:['ANC_LT05']);
  for(const n of [49.99,50,99.99,100])t('PLT '+n,{platelets_x10e9_l:n},n<50?['PLATELETS_LT50']:n<100?['LOW_PLATELETS']:[],n>=100?['LOW_PLATELETS','PLATELETS_LT50']:n<50?['LOW_PLATELETS']:['PLATELETS_LT50']);
  for(const n of [19.99,20,20.01,30,59.99,60,125,125.01])t('GFR '+n,{gfr_crcl_ml_min:n},n<=20?['CARBO_GFR_20_OR_LESS']:n>125?['CARBO_GFR_CAP']:n<60?['CARBO_MARROW_RISK']:[],n>20?['CARBO_GFR_20_OR_LESS']:[]);
  for(const n of [110,110.01])t('isotope '+n,{isotope_creatinine_percent:n},n>110?['CARBO_ISOTOPE_RECHECK']:[],n<=110?['CARBO_ISOTOPE_RECHECK']:[]);
  for(const n of [2,2.01])t('delay weeks '+n,{myelosuppression_delay_weeks:n},n>2?['PROLONGED_MARROW_DELAY']:[],n<=2?['PROLONGED_MARROW_DELAY']:[]);
  for(const n of [2,3])t('delay count '+n,{myelosuppression_delay_count:n},n>=3?['PROLONGED_MARROW_DELAY']:[],n<3?['PROLONGED_MARROW_DELAY']:[]);
  for(const severity of ['none','mild','moderate','severe'])t('liver '+severity,{hepatic_impairment:severity},severity==='severe'?['VIN_HEPATIC_SEVERE']:[],severity!=='severe'?['VIN_HEPATIC_SEVERE']:[]);
  t('neuro2 new',{neuropathy_grade:2,neuropathy_persistent:false},['VIN_NEURO_G2'],['VIN_NEURO_G2_PERSISTENT','VIN_NEURO_G34']);t('neuro2 persistent',{neuropathy_grade:2,neuropathy_persistent:true},['VIN_NEURO_G2_PERSISTENT'],['VIN_NEURO_G2','VIN_NEURO_G34']);
  for(const g of [3,4])check('neuro'+g+' vinorelbine only',()=>{const f=E.assess(p,{neuropathy_grade:g}).findings.find(x=>x.ruleId==='VIN_NEURO_G34');assert.deepEqual(f.action.components,['vinorelbine']);});
  for(const g of [2,3,4])for(const n of [1,2,3,4])t('mucositis '+g+'/'+n,{mucositis_grade:g,mucositis_occurrence:n},['MUCOSITIS_WITHHOLD',`MUCOSITIS_G${g===2?2:3}_N${Math.min(n,g===2?4:2)}`]);
  t('mucositis missing recurrence',{mucositis_grade:2},['MUCOSITIS_OCCURRENCE_REQUIRED']);
  t('day route absent',{},['DAY_ROUTE_REQUIRED']);t('day route known',{treatment_day:'day8',vinorelbine_route:'oral'},[],['DAY_ROUTE_REQUIRED']);
  for(const n of [120,120.01])t('oral cap60 '+n,{vinorelbine_route:'oral',oral_dose_mg_m2:60,planned_oral_total_mg:n},n>120?['ORAL_DOSE_CAP_60']:[],n<=120?['ORAL_DOSE_CAP_60']:[]);
  for(const n of [160,160.01])t('oral cap80 '+n,{vinorelbine_route:'oral',oral_dose_mg_m2:80,planned_oral_total_mg:n},n>160?['ORAL_DOSE_CAP_80']:[],n<=160?['ORAL_DOSE_CAP_80']:[]);
  t('early oral escalation',{vinorelbine_route:'oral',oral_dose_mg_m2:80,cycle_number:1},['ORAL_EARLY_ESCALATION']);t('cycle2 oral escalation',{vinorelbine_route:'oral',oral_dose_mg_m2:80,cycle_number:2},[],['ORAL_EARLY_ESCALATION']);
  t('oxygen',{long_term_oxygen:true},['OXYGEN_EXCLUSION']);t('oral absorption',{vinorelbine_route:'oral',absorption_impairment:true},['ORAL_ABSORPTION']);t('iv absorption',{vinorelbine_route:'iv',absorption_impairment:true},[],['ORAL_ABSORPTION']);
  check('no imported oral hepatic cutoffs',()=>{assert(!p.rule_engine.rules.some(r=>['VIN_BILI_GT3','VIN_BILI_1_5_3'].includes(r.rule_id)));});
 }
 if(['00232','00259'].includes(code)){
  t('pre-dose FBC unavailable',{pre_dose_fbc_available:false},['PRE_DOSE_FBC_NOT_REVIEWED']);t('pre-dose FBC reviewed',{pre_dose_fbc_available:true},[],['PRE_DOSE_FBC_NOT_REVIEWED']);
  for(const n of [.49,.5,.99,.995,1,1.49,1.5])t('ANC boundary '+n,{anc:n},n<1.5?[code==='00232'?'ANC_EXCLUSION':'ANC_DELAY']:[],n>=1.5?[code==='00232'?'ANC_EXCLUSION':'ANC_DELAY']:[]);
  for(const n of [74.99,75,99,99.5,100])t('platelet boundary '+n,{platelets:n},code==='00259'&&n<100?['PLT_DELAY']:code==='00232'&&n>=75&&n<100?['PLT_SMPC_CONFLICT']:code==='00232'&&n<75?['PLT_EXCLUSION']:[],n>=100?[code==='00259'?'PLT_DELAY':'PLT_SMPC_CONFLICT']:[]);
  for(const g of [2,3,4])t('neuropathy '+g,{neuropathy_grade:g},['NEURO_G'+g]);
 }
 if(code==='00232'){
  check('IV mono source schedule retained',()=>{assert.equal(dose.phases.length,1);const phase=dose.phases[0];assert.equal(phase.cycleLength,21);assert.equal(phase.cycles,null);assert.deepEqual(phase.components.map(x=>[x.dose,x.route,x.days]),[['30 mg/m²','IV',['1','8']]]);});
 }
 if(code==='00259'){
  check('oral mono weekly induction and conditional subsequent dose retained',()=>{assert.equal(dose.phases.length,2);const [initial,later]=dose.phases;assert.equal(initial.cycles,3);assert.equal(later.cycles,null);for(const phase of dose.phases){assert.equal(phase.cycleLength,7);assert.equal(phase.components.length,1);assert.equal(phase.components[0].route,'oral');assert.deepEqual(phase.components[0].days,['1']);}assert.equal(initial.components[0].dose,'60 mg/m²');assert.equal(later.components[0].dose,'80 mg/m²');assert.match(later.components[0].note,/conditional, not a scheduled automatic increase/);});

  for(const n of [1.49,1.5,3,3.01])t('oral bilirubin '+n,{bilirubin_uln_multiple:n},n>3?['HEP_BILI_GT3']:n>=1.5?['HEP_BILI_15_3']:[],n<1.5?['HEP_BILI_GT3','HEP_BILI_15_3']:[]);
  t('oral high AST gap',{bilirubin_uln_multiple:1,ast_uln_multiple:2.51,alt_uln_multiple:1},['HEP_HIGH_TRANS_GAP']);t('oral borderline AST',{bilirubin_uln_multiple:1,ast_uln_multiple:2.5,alt_uln_multiple:1},['HEP_TRANS_15_25'],['HEP_HIGH_TRANS_GAP']);
  t('intro escalation history',{administration_number:4,current_dose_mg_m2:60,neutrophil_05_099_episodes_first3:2},['C4_NO_ESCALATION']);t('re-escalation too soon',{re_escalation_requested:true,administrations_at60_since_reduction:2},['REESCALATION_TOO_EARLY']);
  t('vomited capsule',{vomited_after_dose:true},['VOMIT_NO_REDOSE']);t('damaged capsule',{damaged_or_chewed_capsule:true},['DAMAGED_CAPSULE']);
 }
 check(code+' patient scope and cycle record',()=>{let x=auth[code],d=x.patient_contexts?.lung.patient||x.patient;assert.equal(d.patient_summary.card_cycle_count,code==='00614'?4:null);assert.deepEqual(d.evidence.metrics,[]);assert.equal(d.patient_summary.monitoring.length,4);if(['00284','00614'].includes(code)){const visits=d.timeline.filter(t=>t.style==='treatment');assert.deepEqual(visits.map(t=>t.start),code==='00284'?[1,8,15]:[1,8]);assert(visits.every(t=>t.start===t.end));assert(d.day_groups.length<=6);}assert(d.patient_summary.card_schedule.length<=100);if(['00232','00259'].includes(code))assert.equal(x.preserve_canonical_patient_content,true);for(let i=1;i<=d.cycle_days;i++)assert.equal(d.day_groups.filter(r=>r.start<=i&&r.end>=i).length,1);});
}
const out={mode:integrated?'integrated':'proposed',total:results.length,passed:results.filter(r=>r.pass).length,failed:results.filter(r=>!r.pass).length,results};fs.writeFileSync(B+'/'+out.mode+'-results.json',JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({...out,results:results.filter(r=>!r.pass)},null,2));if(out.failed)process.exitCode=1;
