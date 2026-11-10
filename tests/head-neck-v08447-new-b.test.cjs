'use strict';
// Independent cases authored from NCCP00417/00418 v7 Tables1–3 and EMA Erbitux4.4.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),E=require('../js/assessment-engine'),V=require('../js/protocol-validator'),D=require('../js/protocol-dose-schedule');
const index=JSON.parse(fs.readFileSync(path.join(root,'protocols/index.json'))).protocols;
const ps=Object.fromEntries(['00417','00418'].map(c=>[c,JSON.parse(fs.readFileSync(path.join(root,index.find(x=>x.path.includes('/'+c+'-')).path)))]));
const results=[];
function check(c,name,input,yes=[],no=[],action=null,component=null,citation='NCCP '+c+' v7 pp2–5; source uncertainty explicitly reviewed'){
 const row={code:c,name,input,expected:{yes,no,action,component},citation};try{
 const r=E.assess(ps[c],input);assert.deepEqual(r.errors,[]);assert.deepEqual(r.invalid,[]);const ids=r.findings.map(x=>x.ruleId);
 yes.forEach(id=>assert(ids.includes(id),'Missing '+id));no.forEach(id=>assert(!ids.includes(id),'Unexpected '+id));if(action)assert.equal(r.actionType,action);
 if(component)for(const id of yes){const f=r.findings.find(x=>x.ruleId===id);assert(ps[c].rule_engine.rules.find(x=>x.id===id).action.components.includes(component));}
 row.actual={ids,action:r.actionType};row.pass=true;
 }catch(e){row.pass=false;row.error=e.message;}results.push(row);
}
const common=[
 ['Hypersensitivity',{hypersensitivity:true},'HYPERSENSITIVITY','contraindicated'],['ECOG3',{ecog:3},'ECOG_3','consultant_review'],
 ['Lactation',{breastfeeding:true},'HN47_LACTATION','contraindicated'],['Pregnancy review',{pregnancy:true},'HN47_PREGNANCY_REVIEW','consultant_review'],
 ['Severe nonhaematological review',{non_haematological_toxicity_grade:3},'NONHAEM_G3','consultant_review'],['Mucositis is not fabricated dose table',{mucositis_grade:2},'5FU_MUC_G2','consultant_review'],
 ['Febrile neutropenia cytotoxic delay',{febrile_neutropenia:true},'FN','delay'],['Historical severe counts persist',{prior_severe_haematological_toxicity:true,anc:2,platelets:150},'HN47_COUNTS_HISTORY','consultant_review'],
 ['DPD complete',{dpd_status:'complete'},'DPD_COMPLETE','contraindicated'],['DPD partial no fixed percentage',{dpd_status:'partial'},'DPD_PARTIAL','consultant_review'],['DPD explicitly unknown',{dpd_status:'unknown'},'HN47_DPD_UNKNOWN','withhold'],
 ['DPD baseline missing',{assessment_phase:'pre_treatment'},'HN47_DPD_BASELINE_MISSING','withhold'],['Uracil and renal caution',{dpd_phenotype_used:true,renal_impairment:'moderate'},'HN47_DPD_RENAL_PHENOTYPE','consultant_review'],
 ['Severe renal FU clinical decision',{renal_impairment:'severe'},'HN47_FU_SEVERE_RENAL','consultant_review'],
 ['Moderate hepatic clinical category',{hepatic_impairment:'moderate'},'HN47_FU_HEPATIC_MODERATE','consultant_review'],['Severe hepatic clinical category',{hepatic_impairment:'severe'},'HN47_FU_HEPATIC_SEVERE','consultant_review'],
 ['DPD antiviral interaction',{brivudine_sorivudine_or_analogue:true},'HN47_DPD_DRUG_INTERACTION','contraindicated'],['Warfarin monitoring',{warfarin:true},'HN47_WARFARIN','consultant_review'],['Phenytoin monitoring',{phenytoin:true},'HN47_PHENYTOIN','consultant_review'],
 ['Suspected FU cardiac event',{fluorouracil_cardiac_symptoms:true},'HN47_FU_CARDIAC','withhold'],['First15min mild reaction stops',{cetuximab_first_infusion_first15_reaction:true,cetuximab_infusion_reaction_grade:1},'HN47_CETUX_FIRST15','withhold'],
 ['New respiratory symptom hold',{new_worsening_respiratory_symptoms:true},'HN47_CETUX_RESPIRATORY_HOLD','withhold'],['Confirmed ILD stop',{interstitial_lung_disease:true},'CETUX_ILD','permanently_discontinue'],
 ['Prior stop persists despite recovery',{cetuximab_prior_permanent_stop:true,cetuximab_skin_toxicity_grade:0},'HN47_CETUX_PRIOR_STOP','permanently_discontinue'],
 ['Fourth skin episode persists despite recovery',{cetuximab_skin_occurrence:4,cetuximab_skin_toxicity_grade:0},'HN47_CETUX_SKIN_FOURTH','permanently_discontinue'],
 ['Intolerable grade2 rash',{intolerable_skin_toxicity:true,cetuximab_skin_toxicity_grade:2},'HN47_CETUX_INTOLERABLE','withhold'],['Failed skin recovery',{skin_failed_recovery:true},'HN47_CETUX_FAILED_RECOVERY','permanently_discontinue'],
 ['Indication/source conflict',{head_neck_combination_setting:'locally_advanced'},'HN47_INDICATION_SOURCE_CONTEXT','consultant_review'],
 ['Combination cycle7 needs new plan',{cycle_number:7},'HN47_COMBINATION_LIMIT','consultant_review'],['Maintenance separate pathway',{treatment_phase:'maintenance'},'HN47_MAINTENANCE_ROUTE','consultant_review']];
for(const c of ['00417','00418']){
 for(const [name,input,id,action] of common)check(c,name,input,[id],id==='HN47_CETUX_FIRST15'?['HN47_CETUX_IR_G1','HN47_CETUX_IR_G2']:[],action);
 for(const value of [0.499,0.5,0.501,1.499,1.4999,1.5,1.5001]){
 const id=value<.5?'ANC_LT05':value<1.5?'ANC_05_149':value===1.5?'HN47_ANC_15_BOUNDARY':null;
 check(c,'ANC continuous boundary '+value,{anc:value},id?[id]:[],['ANC_LT05','ANC_05_149','HN47_ANC_15_BOUNDARY'].filter(x=>x!==id),value<1.5?'delay':value===1.5?'consultant_review':null);
 }
 for(const value of [49.99,50,50.01,99,99.001,99.999,100,100.01]){
 const id=value<50?'PLT_LT50':value<=99?'PLT_50_99':value<100?'HN47_PLT_99_100_GAP':null;
 check(c,'Platelet any-cycle boundary '+value,{platelets:value},id?[id]:[],['PLT_LT50','PLT_50_99','HN47_PLT_99_100_GAP'].filter(x=>x!==id),value<=99?'delay':value<100?'consultant_review':null);
 }
 for(const [field,limit,id,gap] of [['bilirubin_umol_l',85,'5FU_HEPATIC','HN47_FU_BILIRUBIN_UMOL_L_EQUALITY'],['ast_u_l',180,'5FU_AST','HN47_FU_AST_U_L_EQUALITY']]){
 for(const value of [limit-.01,limit,limit+.01])check(c,field+' equality '+value,{[field]:value},value>limit?[id]:value===limit?[gap]:[],value<limit?[id,gap]:value>limit?[gap]:[id],value>limit?'contraindicated':value===limit?'consultant_review':null,'fluorouracil');
 }
 check(c,'Maintenance excludes cytotoxic dose decisions',{treatment_phase:'maintenance',dpd_status:'complete',crcl_ml_min:20,assessment_phase:'on_treatment',gfr_or_crcl_ml_min:20,anc:0.1,platelets:20,bilirubin_umol_l:100,ast_u_l:200},['HN47_MAINTENANCE_ROUTE'],['DPD_COMPLETE','HN47_CIS_RENAL_LT45','CARBO_GFR_LE20','ANC_LT05','PLT_LT50','5FU_HEPATIC','5FU_AST'],'consultant_review');
 const baseline={assessment_phase:'pre_treatment',dpd_status:'normal',cisplatin_contraindicated_or_not_tolerated:true};
 for(const [field,limit] of [['creatinine_uln_multiple',1.5],['alt_ast_uln_multiple',5],['bilirubin_uln_multiple',1.5]])for(const value of [limit-.01,limit,limit+.01]){
 const id='HN47_BASELINE_'+field.toUpperCase();check(c,'Baseline '+field+' '+value,{...baseline,[field]:value},value>limit?[id]:[],value<=limit?[id]:[],value>limit?'consultant_review':null);
 check(c,'On-treatment is not baseline '+field+' '+value,{assessment_phase:'on_treatment',[field]:value},[],[id]);
 }
 for(const anc of [1.49,1.5,1.51])check(c,'Baseline strict ANC '+anc,{...baseline,anc},anc<=1.5?['HN47_BASELINE_ANC']:[],anc>1.5?['HN47_BASELINE_ANC']:[]);
 for(const platelets of [99,100,101])check(c,'Baseline platelet comparator '+platelets,{...baseline,platelets},platelets<=100?['HN47_BASELINE_PLATELETS']:[],platelets>100?['HN47_BASELINE_PLATELETS']:[]);
 for(const grade of [0,1,2,3,4]){
 const id=grade>=3?'CETUX_IR_G3':grade?'HN47_CETUX_IR_G'+grade:null;
 check(c,'Infusion grade '+grade,{cetuximab_infusion_reaction_grade:grade},id?[id]:[],['HN47_CETUX_IR_G1','HN47_CETUX_IR_G2','CETUX_IR_G3'].filter(x=>x!==id),grade>=3?'permanently_discontinue':grade?'proceed_with_caution':null,'cetuximab');
 check(c,'Skin grade '+grade,{cetuximab_skin_toxicity_grade:grade},grade>=3?['CETUX_SKIN_G3']:[],grade<3?['CETUX_SKIN_G3']:[],grade>=3?'withhold':null,'cetuximab');
 }
 const ready={cetuximab_skin_restart_requested:true,cetuximab_skin_occurrence:2,cetuximab_skin_toxicity_grade:2,cetuximab_skin_hold_days:14,cetuximab_prior_permanent_stop:false,cetuximab_restart_consultant_approved:true,intolerable_skin_toxicity:false,skin_failed_recovery:false,cetuximab_prior_dose_mg_m2:250};
 for(const occurrence of [1,2,3])for(const grade of [0,1,2,3,4])for(const days of [13.99,14,14.01]){
 const id='HN47_CETUX_SKIN_RESTART_'+occurrence,yes=grade<=2&&days<=14;
 check(c,'Skin restart episode/grade/days '+occurrence+'/'+grade+'/'+days,{...ready,cetuximab_skin_occurrence:occurrence,cetuximab_skin_toxicity_grade:grade,cetuximab_skin_hold_days:days},[...(yes?[id]:[]),...(days>14?['HN47_CETUX_SKIN_OVER14']:[])],yes?[]:[id],grade>=3||days>14?'withhold':occurrence===1?'proceed_with_caution':'dose_reduce','cetuximab');
 }
 for(const field of ['cetuximab_skin_occurrence','cetuximab_skin_toxicity_grade','cetuximab_skin_hold_days','cetuximab_prior_permanent_stop','cetuximab_restart_consultant_approved','intolerable_skin_toxicity','skin_failed_recovery']){
 const input={...ready};delete input[field];check(c,'Missing restart '+field,input,['HN47_CETUX_RESTART_MISSING_'+field.toUpperCase()],['HN47_CETUX_SKIN_RESTART_1','HN47_CETUX_SKIN_RESTART_2','HN47_CETUX_SKIN_RESTART_3'],'withhold','cetuximab');
 }
 check(c,'Missing prior actual dose',(()=>{const x={...ready};delete x.cetuximab_prior_dose_mg_m2;return x;})(),['HN47_CETUX_RESTART_MISSING_PRIOR_DOSE'],['HN47_CETUX_SKIN_RESTART_2'],'withhold');
 for(const [occurrence,dose] of [[1,250],[2,200],[3,150]])check(c,'Prior dose must not rise for episode '+occurrence,{...ready,cetuximab_skin_occurrence:occurrence,cetuximab_prior_dose_mg_m2:dose-1},['HN47_CETUX_RESTART_PRIOR_LOWER_'+occurrence],['HN47_CETUX_SKIN_RESTART_'+occurrence],'consultant_review');
 for(const [field,value,stop] of [['cetuximab_infusion_reaction_grade',3,'CETUX_IR_G3'],['interstitial_lung_disease',true,'CETUX_ILD'],['new_worsening_respiratory_symptoms',true,'HN47_CETUX_RESPIRATORY_HOLD'],['cetuximab_first_infusion_first15_reaction',true,'HN47_CETUX_FIRST15']])check(c,'Other cetuximab stop blocks restart number '+field,{...ready,[field]:value},[stop],['HN47_CETUX_SKIN_RESTART_2']);
 check(c,'Restart not approved',{...ready,cetuximab_restart_consultant_approved:false},['HN47_CETUX_RESTART_APPROVAL'],['HN47_CETUX_SKIN_RESTART_2'],'withhold');
 check(c,'Restart no prior severe episode',{...ready,cetuximab_skin_occurrence:0},['HN47_CETUX_RESTART_NO_EPISODE'],['HN47_CETUX_SKIN_RESTART_2'],'consultant_review');
 check(c,'Restart intolerable blocks numerical dose',{...ready,intolerable_skin_toxicity:true},['HN47_CETUX_INTOLERABLE'],['HN47_CETUX_SKIN_RESTART_2'],'withhold');
 check(c,'Restart recovered but permanent-stop history',{...ready,cetuximab_prior_permanent_stop:true},['HN47_CETUX_PRIOR_STOP'],['HN47_CETUX_SKIN_RESTART_2'],'permanently_discontinue');
 check(c,'Restart failed recovery overrides current grade',{...ready,skin_failed_recovery:true},['HN47_CETUX_FAILED_RECOVERY'],['HN47_CETUX_SKIN_RESTART_2'],'permanently_discontinue');
 check(c,'Electrolyte review',{electrolytes_hydration_not_corrected:true},[c==='00417'?'CIS_HYDRATION':'HN47_CETUX_ELECTROLYTES'],[],'consultant_review');
 for(const input of [{},{dpd_status:'normal'},{non_haematological_toxicity_grade:0},{mucositis_grade:0},{hypersensitivity:false},{breastfeeding:false}])check(c,'Non-trigger '+JSON.stringify(input),input,[],['HYPERSENSITIVITY','HN47_LACTATION','DPD_COMPLETE','DPD_PARTIAL','NONHAEM_G3','5FU_MUC_G2']);
}
for(const value of [44.99,45,45.01,59,59.001,59.99,60,60.01]){
 const id=value<45?'HN47_CIS_RENAL_LT45':value<=59?'HN47_CIS_RENAL_45_59':value<60?'HN47_CIS_RENAL_59_60_GAP':null;
 check('00417','Cisplatin current renal '+value,{crcl_ml_min:value,assessment_phase:'on_treatment'},id?[id]:[],['HN47_CIS_RENAL_LT45','HN47_CIS_RENAL_45_59','HN47_CIS_RENAL_59_60_GAP'].filter(x=>x!==id),id?(id==='HN47_CIS_RENAL_45_59'?'dose_reduce':'consultant_review'):null,'cisplatin');
 check('00417','Cisplatin baseline renal '+value,{crcl_ml_min:value,assessment_phase:'pre_treatment',dpd_status:'normal'},value<60?['HN47_CIS_BASELINE_RENAL']:[],['HN47_CIS_RENAL_45_59',...(value>=60?['HN47_CIS_BASELINE_RENAL']:[])],value<60?'contraindicated':null,'cisplatin');
}
check('00417','CrCl needs context',{crcl_ml_min:50},['HN47_CIS_RENAL_PHASE_MISSING'],['HN47_CIS_RENAL_45_59'],'consultant_review');
for(const [band,id] of [['45_59','CIS_RENAL_50_59'],['50_59','CIS_RENAL_50_59'],['40_49','CIS_RENAL_40_49'],['lt45','CIS_RENAL_LOW'],['lt40','CIS_RENAL_LOW'],['dialysis','CIS_RENAL_LOW']])check('00417','Legacy renal '+band,{cisplatin_crcl_band:band},[id],[],'consultant_review');
for(const grade of [0,1,2,3,4]){
 check('00417','Peripheral neuropathy '+grade,{peripheral_neuropathy_grade:grade},grade>=2?['HN47_CIS_NEURO_G2']:[],grade<2?['HN47_CIS_NEURO_G2']:[],grade>=2?'omit':null,'cisplatin');
 check('00417','Combined historic symptom '+grade,{cisplatin_neuro_hearing_grade:grade},grade>=2?['CIS_NEURO_G2']:[],grade<2?['CIS_NEURO_G2']:[],grade>=2?'consultant_review':null);
}
check('00417','Significant hearing excluded',{significant_hearing_impairment_or_tinnitus:true},['HN47_CIS_HEARING'],[],'contraindicated');
for(const value of [19.99,20,20.01,29.99,30,30.01,59.99,60,60.01,125,125.01]){
 const id=value<=20?'CARBO_GFR_LE20':value<=30?'HN47_CARBO_20_30':value<60?'HN47_CARBO_MYELO':value>125?'HN47_CARBO_CAP':null;
 check('00418','Carboplatin GFR '+value,{gfr_or_crcl_ml_min:value},id?[id]:[],['CARBO_GFR_LE20','HN47_CARBO_20_30','HN47_CARBO_MYELO','HN47_CARBO_CAP'].filter(x=>x!==id),value<=20?'contraindicated':value<=30||value>125?'consultant_review':value<60?'proceed_with_caution':null,'carboplatin');
}
for(const value of [undefined,false,true]){const input={assessment_phase:'pre_treatment',dpd_status:'normal'};if(value!==undefined)input.cisplatin_contraindicated_or_not_tolerated=value;check('00418','Cisplatin suitability '+value,input,value!==true?['HN47_CARBO_INDICATION']:[],value===true?['HN47_CARBO_INDICATION']:[],value!==true?'consultant_review':null);}
for(const value of [4.99,5,5.01])check('00418','Target AUC '+value,{target_auc:value},value!==5?['HN47_CARBO_AUC']:[],value===5?['HN47_CARBO_AUC']:[],value!==5?'consultant_review':null);
for(const method of ['cockcroft_gault','wright'])for(const hours of [47.99,48,48.01])check('00418','Creatinine freshness '+method+'/'+hours,{renal_measure_type:method,creatinine_result_age_hours:hours},hours>48?['HN47_CARBO_ESTIMATE_OLD']:[],hours<=48?['HN47_CARBO_ESTIMATE_OLD']:[],hours>48?'withhold':null);
check('00418','Missing creatinine age',{renal_measure_type:'wright'},['HN47_CARBO_ESTIMATE_AGE_MISSING'],[],'consultant_review');
for(const method of ['indexed_egfr','unknown'])check('00418','Invalid Calvert method '+method,{renal_measure_type:method},['HN47_CARBO_METHOD'],[],'consultant_review');
for(const creatinine of [109.99,110,110.01])check('00418','Isotope change '+creatinine,{renal_measure_type:'measured',baseline_creatinine:100,current_creatinine:creatinine},creatinine>110?['HN47_CARBO_ISOTOPE_TREND']:[],creatinine<=110?['HN47_CARBO_ISOTOPE_TREND']:[],creatinine>110?'consultant_review':null);
for(const input of [{renal_measure_type:'measured'},{renal_measure_type:'measured',current_creatinine:100},{renal_measure_type:'measured',baseline_creatinine:100}])check('00418','Missing isotope pair '+JSON.stringify(input),input,['HN47_CARBO_ISOTOPE_TREND_MISSING'],['HN47_CARBO_ISOTOPE_TREND'],'consultant_review');
check('00418','Derived ratio cannot be supplied to bypass raw values',{renal_measure_type:'measured',current_creatinine:120,baseline_creatinine:100,creatinine_isotope_ratio:1},['HN47_CARBO_ISOTOPE_TREND'],[],'consultant_review');
// Production schedule-view contract: the source notes must be visible as actual dose/day rows.
for(const code of ['00417','00418']){
 const row={code,name:'Production dose-schedule phases, exact source doses/days and infusion alternatives',citation:'NCCP00417v7pp1–2; NCCP00418v7pp1–2'};
 try{
  const p=ps[code],m=D.buildModel(p),cis=code==='00417',platinum=cis?'cisplatin':'carboplatin',platDose=cis?'100 mg/m²':'AUC 5';
  assert.equal(D.hasData(p),true);assert.equal(m.phases.length,2);assert(m.allPhases.every(x=>x.complete));assert.deepEqual(m.doseLevels,[],'No generic dose ladder');
  assert.deepEqual(m.phases.map(x=>x.cycleLength),[21,21]);assert.deepEqual(m.phases.map(x=>x.cycles),[[1],[2,3,4,5,6]]);
  const rows=phase=>phase.components.map(x=>({id:x.id,dose:x.dose,days:x.days,route:x.route}));
  assert.deepEqual(rows(m.phases[0]),[
   {id:'cetuximab',dose:'400 mg/m²',days:['1'],route:'IV infusion'},
   {id:'cetuximab',dose:'250 mg/m²',days:['8','15'],route:'IV infusion'},
   {id:platinum,dose:platDose,days:['1'],route:'IV infusion'},
   {id:'5fu',dose:'1000 mg/m²/day',days:['1','2','3','4'],route:'IV infusion'}]);
  assert.deepEqual(rows(m.phases[1]),[
   {id:'cetuximab',dose:'250 mg/m²',days:['1','8','15'],route:'IV infusion'},
   {id:platinum,dose:platDose,days:['1'],route:'IV infusion'},
   {id:'5fu',dose:'1000 mg/m²/day',days:['1','2','3','4'],route:'IV infusion'}]);
  assert.match(m.phases[0].components[0].note,/120 minutes, maximum 5 mg\/min/);
  assert.match(m.phases[1].components[0].note,/60 minutes, maximum 10 mg\/min/);
  for(const phase of m.phases){
   const fu=phase.components.find(x=>x.id==='5fu'),plat=phase.components.find(x=>x.id===platinum);
   assert.match(fu.note,cis?/1000 mg\/m²\/day over 22 hours/:/1000 mg\/m²\/day over 16–22 hours/);
   assert.match(fu.note,cis?/2000 mg\/m² over 46–48 hours/:/2000 mg\/m² over 48 hours/);
   assert.match(fu.note,/days 1–2.*days 3–4/);assert.match(fu.note,/4000 mg\/m² over 96 hours/);assert.match(fu.note,/alternatives, not additional doses/);
   assert.equal(phase.components.filter(x=>x.id==='5fu').length,1,'Alternative infusion is not an extra prescribed dose');
   assert.match(plat.note,cis?/1000 mL sodium chloride 0.9% over 2 hours/:/500 mL glucose 5% over 30 minutes/);
   assert.match(plat.note,/one hour after cetuximab/);
  }
  assert(!m.phases.some(x=>/maintenance/.test(x.id)),'No automatic maintenance prescription');
  assert.match(m.phases[1].summary,/Maintenance requires a separate prescribed plan/);
  row.actual={phases:m.phases.map(x=>({id:x.id,cycles:x.cycles,cycleLength:x.cycleLength,components:rows(x)})),hasData:true};row.pass=true;
 }catch(e){row.pass=false;row.error=e.message;}results.push(row);
}

// In addition to named assertions, every encoded rule must have an explicit positive source case above.
for(const [code,p] of Object.entries(ps)){
 const row={code,name:'Schema, source hash, governance and independent positive coverage'};try{
 const v=V.validate(p,{strict:true});assert.equal(v.valid,true,JSON.stringify(v.errors));assert.equal(p.metadata.nccp_version,'7');assert.equal(p.metadata.source_checked_date,'2026-11-10');
 const source=path.join(root,'validation/head-neck-v08447/sources/'+code+'.pdf');assert.equal(crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex'),p.metadata.source_pdf_sha256);
 for(const key of ['clinical_use_authorised','consultant_reviewed','oncology_pharmacy_reviewed'])assert.equal(p.metadata.validation[key],false);
 for(const r of p.rule_engine.rules)assert(results.some(x=>x.code===code&&x.pass&&x.expected?.yes?.includes(r.id)),'No independent positive case for '+r.id);
 // Cytopenia must not silently apply a chemotherapy reduction to cetuximab.
 for(const id of ['FN','ANC_LT05','PLT_LT50']){const r=p.rule_engine.rules.find(x=>x.id===id);assert.deepEqual(r.action.components,[code==='00417'?'cisplatin':'carboplatin','fluorouracil']);assert.equal(r.action.type,'delay');assert.match(r.action.message,/consider/i);assert.equal(r.action.dose_percent,undefined);}
 const ready={cetuximab_skin_restart_requested:true,cetuximab_skin_occurrence:2,cetuximab_skin_toxicity_grade:2,cetuximab_skin_hold_days:14,cetuximab_prior_permanent_stop:false,cetuximab_restart_consultant_approved:true,intolerable_skin_toxicity:false,skin_failed_recovery:false,cetuximab_prior_dose_mg_m2:250};
 const r=E.assess(p,{...ready,cetuximab_infusion_reaction_grade:3});assert.equal(r.actionType,'permanently_discontinue');const model=D.buildModificationModel(p,r);assert(model.rows.some(x=>x.actionType==='permanently_discontinue'),'Dose model retains severe stop');
 row.pass=true;}catch(e){row.pass=false;row.error=e.message;}results.push(row);
}
const report={release:'0.84.47',test:'head-neck-v08447-new-b',source_basis:'Independently authored cases from NCCP00417/00418 v7 and EMA Erbitux product information retrieved10Nov2026',total:results.length,passed:results.filter(x=>x.pass).length,failed:results.filter(x=>!x.pass).length,cases:results};
fs.writeFileSync(path.join(root,'validation/head-neck-v08447/new-b-results.json'),JSON.stringify(report,null,2)+'\n');
console.log('v47 cetuximab/platinum/FU source cases:',report.passed+'/'+report.total);for(const row of results.filter(x=>!x.pass))console.error(row.code,row.name,row.error);if(report.failed)process.exitCode=1;
