'use strict';
// Independently specified expectations from the retrieved NCCP tables, not from rule enumeration.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),E=require('../js/assessment-engine'),D=require('../js/protocol-dose-schedule'),V=require('../js/protocol-validator');
const protocols=Object.fromEntries(['00314','00552','00696'].map(code=>[code,JSON.parse(fs.readFileSync(path.join(root,'protocols/head-neck',fs.readdirSync(path.join(root,'protocols/head-neck')).find(f=>f.startsWith(code+'-')))))]));
const results=[];
function check(code,name,input,yes=[],no=[],action=null,components=null,citation='NCCP '+code+' current PDF, validation/head-neck-v08447/sources/'){
 const row={code,name,input,expected:{yes,no,action,components},citation};
 try{const out=E.assess(protocols[code],input);assert.deepEqual(out.errors,[]);assert.deepEqual(out.invalid,[]);const ids=out.findings.map(f=>f.ruleId);for(const id of yes)assert(ids.includes(id),'Missing '+id);for(const id of no)assert(!ids.includes(id),'Unexpected '+id);if(action)assert.equal(out.actionType,action);if(components)for(const id of yes){const f=out.findings.find(f=>f.ruleId===id);const r=protocols[code].rule_engine.rules.find(r=>r.id===id);assert.deepEqual(r.action.components,components,id+' component scope');}const model=D.buildModificationModel(protocols[code],out);if(action&&['withhold','contraindicated','delay','omit','permanently_discontinue','discontinue'].includes(action))assert(model.rows.some(r=>r.actionType===action),'Display model lost action');row.pass=true;row.actual={ids,action:out.actionType};}catch(e){row.pass=false;row.error=e.message;}results.push(row);
}
const on={assessment_phase:'on_treatment'},pre={assessment_phase:'pre_treatment'};
for(const code of ['00314','00552','00696']){
 assert.deepEqual(V.validate(protocols[code]).errors,[]);assert.equal(protocols[code].metadata.source_checked_date,'2026-11-10');
 check(code,'Empty input does not trigger treatment permission',{},[],[],null);
 check(code,'Component hypersensitivity',{hypersensitivity:true},['HYPERSENSITIVITY'],[],'contraindicated');
 check(code,'Hypersensitivity explicitly absent',{hypersensitivity:false},[],['HYPERSENSITIVITY']);
}
for(const code of ['00314','00696']){
 for(const value of [0,2,3,4])check(code,'ECOG '+value,{ecog:value},value>2?['ECOG_3']:[],value<=2?['ECOG_3']:[],value>2?'consultant_review':null);
 for(const field of ['pregnancy','breastfeeding'])for(const value of [false,true])check(code,field+' '+value,{[field]:value},value?['HN47_'+field.toUpperCase()]:[],value?[]:['HN47_'+field.toUpperCase()],value?'contraindicated':null);
}
for(const code of ['00314','00552']){
 check(code,'Complete DPD deficiency',{dpd_status:'complete'},['DPD_COMPLETE'],[],'contraindicated',['fluorouracil']);
 check(code,'Partial DPD deficiency no invented percentage',{dpd_status:'partial'},['DPD_PARTIAL'],[],'consultant_review',['fluorouracil']);
 for(const status of [undefined,'unknown','normal']){const input={...pre,...(code==='00552'?{cisplatin_unsuitable:true,chemoradiation_recovery_confirmed:true}:{})};if(status!==undefined)input.dpd_status=status;check(code,'DPD first-treatment '+status,input,status==='normal'?[]:['DPD_UNRESOLVED'],status==='normal'?['DPD_UNRESOLVED']:[],status==='normal'?null:'withhold');}
 check(code,'DPD phenotype with renal impairment',{dpd_phenotype_renal_impairment:true},['DPD_RENAL_PHENOTYPE'],[],'consultant_review',['fluorouracil']);
}
const C='00314',ready={...pre,dpd_status:'normal'};
for(const [field,values,fail] of [['anc',[1.49,1.5,1.51],v=>v<=1.5],['platelets',[99,100,101],v=>v<100],['creatinine_ratio_uln',[1.49,1.5,1.51],v=>v>1.5],['alt_ast_uln_multiple',[4.99,5,5.01],v=>v>5],['bilirubin_uln_multiple',[1.49,1.5,1.51],v=>v>1.5]])for(const v of values){let id='HN47_BASELINE_'+field.toUpperCase();check(C,'Baseline '+field+' '+v,{...ready,[field]:v},fail(v)?[id]:[],fail(v)?[]:[id],fail(v)?'withhold':null);}
check(C,'Baseline platelets exact100 ambiguous',{...ready,platelets:100},['HN47_BASELINE_PLT_BOUNDARY'],['PLT_REDUCED'],'consultant_review');
for(const v of [59.99,60,60.01])check(C,'Baseline renal '+v,{...ready,gfr_or_crcl_ml_min:v},v<60?['HN47_BASELINE_RENAL']:[],v>=60?['HN47_BASELINE_RENAL']:[],v<60?'contraindicated':null);
for(const field of ['anc','platelets','gfr_or_crcl_ml_min'])check(C,'Phase missing '+field,{[field]:field==='anc'?1:field==='platelets'?80:55},['HN47_PHASE_MISSING'],['ANC_REDUCED','PLT_REDUCED','CIS_RENAL_45_59'],'consultant_review');
for(const [field,prefix,values,low,high]of[['anc','ANC',[.99,1,1.5,1.51],1,1.5],['platelets','PLT',[74.99,75,100,100.01],75,100],['platelet_nadir_x10e9_l','NADIR_PLT',[74.99,75,100,100.01],75,100]])for(const v of values){const want=v<low?prefix+'_LOW':v<=high?prefix+'_REDUCED':null;check(C,'On-treatment '+field+' '+v,{...on,[field]:v},want?[want]:[],[prefix+'_LOW',prefix+'_REDUCED'].filter(x=>x!==want),want?'dose_reduce':null,want?['fluorouracil']:null);}
check(C,'Recovered current platelets do not erase nadir',{...on,platelets:150,platelet_nadir_x10e9_l:70},['NADIR_PLT_LOW'],['PLT_REDUCED','PLT_LOW'],'dose_reduce',['fluorouracil']);
for(const v of [44.99,45,59,59.5,60]){const want=v<45?'CIS_RENAL_LOW':v<=59?'CIS_RENAL_45_59':v<60?'CIS_RENAL_BOUNDARY':null;check(C,'On-treatment GFR '+v,{...on,gfr_or_crcl_ml_min:v},want?[want]:[],['CIS_RENAL_LOW','CIS_RENAL_45_59','CIS_RENAL_BOUNDARY'].filter(x=>x!==want),want?(want==='CIS_RENAL_45_59'?'dose_reduce':'consultant_review'):null);}
for(const band of ['ge60','50_59','45_59','40_49','lt45','lt40','dialysis'])check(C,'Legacy renal band '+band,{cisplatin_crcl_band:band},band!=='ge60'?['CIS_RENAL_LEGACY_REVIEW']:[],band==='ge60'?['CIS_RENAL_LEGACY_REVIEW']:[],band!=='ge60'?'consultant_review':null);
for(const v of [0,1,2,3,4])check(C,'Peripheral neuropathy '+v,{cisplatin_peripheral_neuropathy_grade:v},v>=2?['CIS_NEURO_G2']:[],v<2?['CIS_NEURO_G2']:[],v>=2?'omit':null,v>=2?['cisplatin']:null);
check(C,'Legacy combined neuro/hearing cannot choose omission',{cisplatin_neuro_hearing_grade:2},['CIS_NEURO_HEARING_UNSEPARATED'],['CIS_NEURO_G2'],'consultant_review');
check(C,'Significant hearing/tinnitus',{significant_hearing_impairment_or_tinnitus:true},['CIS_HEARING'],[],'contraindicated',['cisplatin']);
check(C,'Hydration incomplete',{electrolytes_hydration_not_corrected:true},['CIS_HYDRATION'],[],'withhold',['cisplatin']);
for(const [field,t,id]of[['bilirubin_umol_l',85,'5FU_HEPATIC'],['ast_u_l',180,'5FU_AST']])for(const v of [t-.01,t,t+.01])check(C,field+' boundary '+v,{[field]:v},v>t?[id]:v===t?[id+'_EXACT_BOUNDARY']:[],v<t?[id,id+'_EXACT_BOUNDARY']:[],v>t?'contraindicated':v===t?'consultant_review':null,['fluorouracil']);
check(C,'Moderate hepatic clinical choice',{hepatic_impairment_severity:'moderate'},['HN47_MODERATE_HEPATIC'],[],'consultant_review');
check(C,'Severe hepatic source conflict',{hepatic_impairment_severity:'severe'},['HN47_SEVERE_HEPATIC'],[],'withhold');
check(C,'Severe renal FU no fixed percent',{severe_renal_impairment:true},['HN47_SEVERE_RENAL_FU'],[],'consultant_review');
check(C,'FN not automatic post-FN reduction',{febrile_neutropenia:true},['FN'],[],'withhold');
for(const v of [1,2,3,4])check(C,'Mucositis '+v,{mucositis_grade:v},v>=2?['5FU_MUC_G2']:[],v<2?['5FU_MUC_G2']:[],v>=2?'consultant_review':null);
check(C,'Other severe toxicity no invented schedule',{non_haematological_toxicity_grade:3},['NONHAEM_G3'],[],'consultant_review');

const B='00552',bready={...pre,dpd_status:'normal',cisplatin_unsuitable:true,chemoradiation_recovery_confirmed:true};
for(const val of [undefined,false,true])for(const [field,id,action]of[['cisplatin_unsuitable','HN47_CIS_UNSUITABLE','consultant_review'],['chemoradiation_recovery_confirmed','HN47_POST_RT_RECOVERY','withhold']]){const input={...bready};if(val===undefined)delete input[field];else input[field]=val;check(B,field+' '+val,input,val===true?[]:[id],val===true?[id]:[],val===true?null:action);}
for(const v of [3.99,4,4.01])check(B,'Post-RT start '+v,{...bready,weeks_since_chemoradiation:v},v<4?['HN47_POST_RT_TIMING']:[],v>=4?['HN47_POST_RT_TIMING']:[],v<4?'delay':null);
for(const v of [1,3,4])check(B,'Adjuvant cycle '+v,{cycle_number:v},v>3?['HN47_COURSE_LIMIT']:[],v<=3?['HN47_COURSE_LIMIT']:[],v>3?'consultant_review':null);
for(const [field,prefix,values,low,high]of[['anc','ANC',[.49,.5,.99,.995,1],.5,1],['platelets','PLT',[49.99,50,99,99.5,100],50,100]])for(const v of values){let id=v<low?prefix+'_LOW':v<high?prefix+'_INTERMEDIATE':null;check(B,field+' '+v,{[field]:v},id?[id]:[],[prefix+'_LOW',prefix+'_INTERMEDIATE'].filter(x=>x!==id),id?(v<low?'delay_then_dose_reduce':'delay'):null,id?['carboplatin','fluorouracil']:null);}
check(B,'FN subsequent reduction discretionary',{febrile_neutropenia:true},['FN'],[],'delay_then_dose_reduce',['carboplatin','fluorouracil']);
for(const v of [19.99,20,20.01,59.99,60,125,125.01]){const id=v<=20?'CARBO_GFR_LE20':v<60?'CARBO_GFR_LOW':v>125?'CARBO_GFR_CAP':null;check(B,'GFR '+v,{gfr_or_crcl_ml_min:v},id?[id]:[],['CARBO_GFR_LE20','CARBO_GFR_LOW','CARBO_GFR_CAP'].filter(x=>x!==id),v<=20?'contraindicated':v>125?'consultant_review':v<60?'proceed_with_caution':null);}
for(const age of [undefined,47.99,48,48.01]){let input={gfr_measurement_method:'estimated'};if(age!==undefined)input.creatinine_sample_age_hours=age;const want=age===undefined||age>48;check(B,'Estimated creatinine age '+age,input,want?['CARBO_ESTIMATED_CREATININE']:[],want?[]:['CARBO_ESTIMATED_CREATININE'],want?'withhold':null);}
for(const v of [109.99,110,110.01])check(B,'Isotope creatinine baseline '+v,{gfr_measurement_method:'measured',creatinine_percent_isotope_baseline:v},v>110?['CARBO_ISOTOPE_RECHECK']:[],v<=110?['CARBO_ISOTOPE_RECHECK']:[],v>110?'consultant_review':null);
check(B,'Unreliable formula estimate',{gfr_estimate_unreliable:true},['CARBO_ESTIMATE_UNRELIABLE'],[],'consultant_review');
check(B,'Old bilirubin/AST rules are absent',{bilirubin_umol_l:86,ast_u_l:181},[],['5FU_HEPATIC','5FU_AST']);
check(B,'Severe liver impairment',{hepatic_impairment_severity:'severe'},['FU_SEVERE_HEPATIC'],[],'omit',['fluorouracil']);
for(const severity of ['mild','moderate'])for(const renal of [undefined,false,true]){let input={hepatic_impairment_severity:severity};if(renal!==undefined)input.concurrent_renal_impairment=renal;check(B,severity+' hepatic with renal '+renal,input,renal===false?[]:['FU_COMBINED_ORGAN_REVIEW'],renal===false?['FU_COMBINED_ORGAN_REVIEW']:[],renal===false?null:'consultant_review');}
for(const [field,prefix]of[['mucositis_grade','STOMATITIS'],['dysphagia_grade','DYSPHAGIA']])for(const v of [0,1,2,3,4])check(B,field+' '+v,{[field]:v},v>=3?[prefix+'_G'+v]:[],v<3?[prefix+'_G3',prefix+'_G4']:[],v===3?'delay':v===4?'discontinue':null);
for(const improved of [undefined,false,true]){let input={prior_oral_toxicity_grade:3};if(improved!==undefined)input.oral_toxicity_improved=improved;check(B,'Oral recovery '+improved,input,improved===true?['ORAL_RESTART_REVIEW']:['ORAL_RESTART_UNRECOVERED'],improved===true?['ORAL_RESTART_UNRECOVERED']:['ORAL_RESTART_REVIEW'],improved===true?'consultant_review':'delay');}
for(const loss of [9.99,10,10.01])for(const nutrition of [undefined,false,true]){let input={weight_loss_percent:loss};if(nutrition!==undefined)input.hyperalimentation_instituted=nutrition;const id=loss>10?(nutrition===undefined?'WEIGHT_LOSS_MISSING_NUTRITION':nutrition?'WEIGHT_LOSS_NUTRITION':'WEIGHT_LOSS_NO_NUTRITION'):null;check(B,'Weight '+loss+' nutrition '+nutrition,input,id?[id]:[],['WEIGHT_LOSS_MISSING_NUTRITION','WEIGHT_LOSS_NUTRITION','WEIGHT_LOSS_NO_NUTRITION'].filter(x=>x!==id),id?(nutrition===undefined?'consultant_review':nutrition?'consultant_review':'discontinue'):null);}
for(const v of [0,1,2,3,4])check(B,'PPE '+v,{ppe_grade:v},v===3?['PPE_G3']:v===4?['PPE_G4_UNSPECIFIED']:[],v<3?['PPE_G3','PPE_G4_UNSPECIFIED']:[],v===3?'consultant_review':v===4?'consultant_review':null);
check(B,'Unspecified severe toxicity',{non_haematological_toxicity_grade:3},['NONHAEM_G3'],[],'consultant_review');

const P='00696';
for(const v of [1.49,1.5,1.51])check(P,'Baseline ANC '+v,{...pre,anc:v},v<1.5?['HN47_BASELINE_ANC']:[],v>=1.5?['HN47_BASELINE_ANC']:[],v<1.5?'contraindicated':null);
check(P,'Severe hepatic impairment',{severe_hepatic_impairment:true},['HN47_BASELINE_HEPATIC'],[],'contraindicated');
for(const v of [.49,.5,.99,.995,1])check(P,'ANC '+v,{...on,anc:v},v<.5?['PC696_ANC_DURATION_UNKNOWN']:v<1?['PC696_ANC_05_099']:[],v>=1?['PC696_ANC_DURATION_UNKNOWN','PC696_ANC_05_099']:[],v<.5?'withhold':v<1?'delay':null);
for(const days of [undefined,6.99,7,7.01]){let input={anc:.49};if(days!==undefined)input.anc_below_0_5_duration_days=days;const want=days!==undefined&&days>=7;check(P,'Profound ANC duration '+days,input,want?['PC696_ANC_LT05']:['PC696_ANC_DURATION_UNKNOWN'],want?['PC696_ANC_DURATION_UNKNOWN']:['PC696_ANC_LT05'],want?'delay_then_dose_reduce':'withhold',['paclitaxel']);}
for(const v of [69.99,70,89.99,90,90.01]){const id=v<70?'PC696_PLT_LT70':v<90?'PC696_PLT_70_89':v===90?'PC696_PLT_90_BOUNDARY':null;check(P,'Platelets '+v,{platelets:v},id?[id]:[],['PC696_PLT_LT70','PC696_PLT_70_89','PC696_PLT_90_BOUNDARY'].filter(x=>x!==id),v<70?'delay_then_dose_reduce':v<90?'delay':v===90?'consultant_review':null,id?['paclitaxel']:null);}
check(P,'FN merged dose cell: delay then one level after recovery',{febrile_neutropenia:true},['FN'],['PC696_ANC_LT05'],'delay_then_dose_reduce',['paclitaxel']);
for(const alt of [9.99,10,10.01])for(const bili of [1.25,1.255,1.26,2,2.005,2.01,5,5.01]){const stop=alt>=10||bili>5;const dose=!stop?(bili>=1.26&&bili<=2?'PAC_HEPATIC_60':bili>=2.01&&bili<=5?'PAC_HEPATIC_40':null):null;check(P,'Hepatic ALT/bili '+alt+'/'+bili,{alt_ratio_uln:alt,bilirubin_uln_multiple:bili,paclitaxel_current_dose_mg_m2:80},stop?['PAC_HEPATIC_CONTRA']:dose?[dose]:bili===1.255||bili===2.005?['PAC_HEPATIC_FRACTION_GAP']:[],stop?['PAC_HEPATIC_60','PAC_HEPATIC_40']:['PAC_HEPATIC_CONTRA'],stop?'contraindicated':dose?'dose_reduce':bili===1.255||bili===2.005?'consultant_review':null);}
check(P,'Bilirubin high independently',{bilirubin_uln_multiple:5.01},['PAC_HEPATIC_CONTRA'],[],'contraindicated');
check(P,'ALT high independently',{alt_ratio_uln:10},['PAC_HEPATIC_CONTRA'],[],'contraindicated');
check(P,'Reduced hepatic band missing ALT',{bilirubin_uln_multiple:2},['PAC_HEPATIC_ALT_MISSING'],['PAC_HEPATIC_60'],'consultant_review');
check(P,'Combined AST/ALT entry cannot silently become ALT',{alt_ast_uln_multiple:2,bilirubin_uln_multiple:2},['PAC_HEPATIC_ALT_MISSING'],['PAC_HEPATIC_60'],'consultant_review');
for(const grade of [0,1,2,3,4])check(P,'Paclitaxel neuropathy '+grade,{paclitaxel_neuropathy_grade:grade,paclitaxel_current_dose_mg_m2:80},grade===2?['PC696_NEURO_G2']:grade>=3?['PC696_NEURO_G3']:[],grade<2?['PC696_NEURO_G2','PC696_NEURO_G3']:[],grade===2?'dose_reduce':grade>=3?'withhold':null);
for(const grade of [0,1,2,3,4])check(P,'Other paclitaxel toxicity '+grade,{non_haematological_toxicity_grade:grade},grade===2?['PAC_OTHER_G2']:grade>=3?['NONHAEM_G3']:[],grade<2?['PAC_OTHER_G2','NONHAEM_G3']:[],grade===2?'withhold_then_reduce':grade>=3?'withhold':null);
for(const recovered of [undefined,false,true]){const input={paclitaxel_prior_grade2_toxicity:true};if(recovered!==undefined)input.paclitaxel_toxicity_recovered_grade1=recovered;check(P,'Prior pac grade2 recovery '+recovered,input,recovered===true?['PAC_RESTART_G2_RECOVERED']:['PAC_RESTART_G2_UNRECOVERED'],recovered===true?['PAC_RESTART_G2_UNRECOVERED']:['PAC_RESTART_G2_RECOVERED'],recovered===true?'consultant_review':'withhold');}
for(const grade of [0,1,2,3,4])check(P,'Cetuximab infusion '+grade,{cetuximab_infusion_reaction_grade:grade},grade>0?['CETUX_IR_G'+Math.min(grade,3)]:[],grade===0?['CETUX_IR_G1','CETUX_IR_G2','CETUX_IR_G3']:[],grade>=3?'permanently_discontinue':grade>0?'proceed_with_caution':null);
check(P,'Previous cetuximab permanent stop',{cetuximab_prior_permanent_stop:true,cetuximab_infusion_reaction_grade:0},['CETUX_PRIOR_STOP'],[],'permanently_discontinue');
check(P,'Diagnosed ILD',{interstitial_lung_disease:true},['CETUX_ILD'],[],'discontinue');
check(P,'Suspected ILD not assumed diagnosis',{suspected_interstitial_lung_disease:true},['CETUX_ILD_SUSPECTED'],['CETUX_ILD'],'withhold');
check(P,'Allergy risk history',{cetuximab_allergy_risk_history:true},['CETUX_ALLERGY_HISTORY'],[],'consultant_review');
for(const g of [0,1,2,3,4])check(P,'Cetuximab active skin grade '+g,{cetuximab_skin_toxicity_grade:g},g>=3?['CETUX_SKIN_G3']:[],g<3?['CETUX_SKIN_G3']:[],g>=3?'withhold':null);
const restart={cetuximab_skin_restart_requested:true,cetuximab_skin_occurrence:1,cetuximab_skin_toxicity_grade:2,cetuximab_skin_hold_days:14,cetuximab_prior_permanent_stop:false,cetuximab_restart_consultant_approved:true};
for(const episode of [1,2,3,4])check(P,'Cetuximab restart episode '+episode,{...restart,cetuximab_skin_occurrence:episode},episode<4?['CETUX_RESTART_EPISODE_'+episode]:['CETUX_SKIN_FOURTH'],episode===4?['CETUX_RESTART_EPISODE_1','CETUX_RESTART_EPISODE_2','CETUX_RESTART_EPISODE_3']:[],episode===4?'discontinue':'consultant_review');
for(const field of ['cetuximab_skin_occurrence','cetuximab_skin_hold_days','cetuximab_skin_toxicity_grade','cetuximab_prior_permanent_stop','cetuximab_restart_consultant_approved']){const input={...restart};delete input[field];check(P,'Cetuximab restart missing '+field,input,['CETUX_RESTART_'+field.toUpperCase()],['CETUX_RESTART_EPISODE_1'],'withhold');}
check(P,'Cetuximab restart refused',{...restart,cetuximab_restart_consultant_approved:false},['CETUX_RESTART_CETUXIMAB_RESTART_CONSULTANT_APPROVED'],['CETUX_RESTART_EPISODE_1'],'withhold');
check(P,'Cetuximab recovered after deadline',{...restart,cetuximab_skin_hold_days:14.01},['CETUX_SKIN_OVER_TWO_WEEKS'],['CETUX_RESTART_EPISODE_1'],'withhold');
check(P,'Cetuximab restart still grade3',{...restart,cetuximab_skin_toxicity_grade:3},['CETUX_SKIN_G3'],['CETUX_RESTART_EPISODE_1'],'withhold');
check(P,'Previous permanent stop overrides recovered skin',{...restart,cetuximab_prior_permanent_stop:true},['CETUX_PRIOR_STOP'],['CETUX_RESTART_EPISODE_1'],'permanently_discontinue');
assert.equal(protocols['00696'].supportive_care.emetogenic_risk,'low');assert.match(protocols['00314'].treatment.schedule_summary,/days 1–4/);assert.equal(protocols['00552'].treatment.planned_cycles,3);
check(C,'Baseline neuropathy is excluded',{...ready,cisplatin_peripheral_neuropathy_grade:2},['CIS_BASELINE_NEUROPATHY'],[],'contraindicated');
check(P,'Grade2 neuropathy current dose absent',{paclitaxel_neuropathy_grade:2},['PC696_NEURO_G2','PAC_G2_CURRENT_DOSE_UNRESOLVED'],[],'consultant_review');
for(const dose of [0,10])check(P,'Grade2 neuropathy invalid low current dose '+dose,{paclitaxel_neuropathy_grade:2,paclitaxel_current_dose_mg_m2:dose},['PAC_G2_CURRENT_DOSE_UNRESOLVED'],[],'consultant_review');
for(const [bili,target]of[[2,60],[3,40]])for(const dose of [undefined,target-1,target,80]){const input={alt_ratio_uln:1,bilirubin_uln_multiple:bili};if(dose!==undefined)input.paclitaxel_current_dose_mg_m2=dose;const blocked=dose===undefined||dose<target;check(P,'Hepatic current-dose guard '+target+'/'+dose,input,blocked?['PAC_HEPATIC_CURRENT_DOSE_'+target]:[],blocked?[]:['PAC_HEPATIC_CURRENT_DOSE_'+target],blocked?'consultant_review':'dose_reduce');const out=E.assess(protocols[P],input),model=D.buildModificationModel(protocols[P],out);const row=model.rows.find(r=>r.componentId==='paclitaxel');assert(row);assert.equal(row.quantified,!blocked);}
for(const [input,expected]of[[{...on,anc:1.2,platelet_nadir_x10e9_l:70},'375 mg/m²'],[{...on,gfr_or_crcl_ml_min:50},'18.75 mg/m²']]){const model=D.buildModificationModel(protocols[C],E.assess(protocols[C],input));assert(model.rows.some(r=>r.protocolDose===expected),JSON.stringify(model));}
for(const input of [{paclitaxel_neuropathy_grade:2},{anc:.4,anc_below_0_5_duration_days:7},{febrile_neutropenia:true}]){const model=D.buildModificationModel(protocols[P],E.assess(protocols[P],input));assert(model.rows.length);assert(model.rows.every(r=>!r.quantified),'Missing dose/recovery must not imply a numerical restart');}
const neuroModel=D.buildModificationModel(protocols[P],E.assess(protocols[P],{paclitaxel_neuropathy_grade:2,paclitaxel_current_dose_mg_m2:65}));assert(neuroModel.rows.some(r=>r.protocolDose==='55 mg/m²'));
for(const code of ['00314','00552','00696']){const model=D.buildModel(protocols[code]);assert.equal(model.phases.length,1);assert.equal(model.phases[0].components.length,2);assert(model.phases[0].components.every(r=>/mg|AUC/.test(r.dose)),'Dose units retained');}
const summary={release:'0.84.47',total:results.length,passed:results.filter(r=>r.pass).length,failed:results.filter(r=>!r.pass).length,cases:results};
const reportIndex=process.argv.indexOf('--report');const report=reportIndex>=0?process.argv[reportIndex+1]:path.join(root,'validation/head-neck-v08447/new-a-results.json');fs.writeFileSync(report,JSON.stringify(summary,null,2)+'\n');
console.log('v47 new A source cases: '+summary.passed+'/'+summary.total);for(const r of results.filter(r=>!r.pass))console.error(r.code,r.name,r.error);if(summary.failed)process.exitCode=1;
