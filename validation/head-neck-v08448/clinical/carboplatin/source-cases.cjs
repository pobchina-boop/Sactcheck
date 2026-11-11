'use strict';
// Expectations are independently specified from the retrieved source tables, not enumerated from implementation rules.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../../../..')),mode=process.argv[3]||'integrated',report=path.resolve(process.argv[4]||path.join(__dirname,'source-case-results-'+mode+'.json'));
const E=require(path.join(root,'js/assessment-engine')),V=require(path.join(root,'js/protocol-validator')),D=require(path.join(root,'js/protocol-dose-schedule'));
function findProtocol(code){for(const folder of ['head-neck','gynaecology']){const dir=path.join(root,'protocols',folder),file=fs.readdirSync(dir).find(f=>f.startsWith(code+'-'));if(file)return path.join(dir,file);}throw Error('No protocol '+code);}
const P=Object.fromEntries(['00332','00419','00314','00552','00417','00418','00696'].map(c=>[c,JSON.parse(fs.readFileSync(mode==='candidate'&&['00332','00419'].includes(c)?path.join(__dirname,'proposed',c+'.json'):findProtocol(c)))]));
const rows=[];
function check(code,label,input,yes=[],no=[],action=null,component=null,citation=''){
 const row={code,label,input,expected:{yes,no,action,component},citation:citation||('NCCP '+code+' current source (see audit.md)')};
 try{const out=E.assess(P[code],input);assert.deepEqual(out.errors,[]);assert.deepEqual(out.invalid,[]);let ids=out.findings.map(f=>f.ruleId);yes.forEach(id=>assert(ids.includes(id),'missing '+id));no.forEach(id=>assert(!ids.includes(id),'unexpected '+id));if(action)assert.equal(out.actionType,action);if(component)for(const id of yes){const rule=P[code].rule_engine.rules.find(r=>r.id===id);assert.deepEqual(rule.action.components,component);}const model=D.buildModificationModel(P[code],out);if(action&&['withhold','delay','discontinue','contraindicated','omit','permanently_discontinue'].includes(action))assert(model.rows.some(r=>r.actionType===action),'display model lost blocking action');row.pass=true;row.actual={action:out.actionType,ids};}catch(e){row.pass=false;row.error=e.message;}rows.push(row);
}
for(const code of ['00332','00419']){
 const val=V.validate(P[code]);rows.push({code,label:'Schema validity',pass:val.errors.length===0,actual:val});
 check(code,'Empty assessment never establishes clearance',{},[],[],null,null);
 for(const value of [false,true])for(const field of ['pregnancy','breastfeeding'])check(code,field+' '+value,{[field]:value},value?['HN48_'+field.toUpperCase()]:[],value?[]:['HN48_'+field.toUpperCase()],value?'contraindicated':null,['carboplatin']);
 check(code,'Radiotherapy not concurrent',{concurrent_radiotherapy_confirmed:false},['HN48_RT_NOT_CONCURRENT'],[],'withhold',['carboplatin'],'p1 treatment');
 check(code,'Truncated radiation remains a stop even with current normal counts',{radiotherapy_truncated:true,anc:2,platelets:150},['HN48_RT_TRUNCATED'],[],'discontinue',['carboplatin'],'p1 treatment');
 check(code,'Full treatment assessment cannot assume radiation is concurrent',{assessment_phase:'on_treatment'},['HN48_RT_STATUS_MISSING'],[],'consultant_review',['carboplatin'],'p1 treatment');
 const n=code==='00332'?7:6,a=code==='00332'?1.5:2;
 for(const v of [n,n+1])check(code,'Course limit '+v,{cycle_number:v},v>n?['HN48_COURSE_LIMIT']:[],v<=n?['HN48_COURSE_LIMIT']:[],v>n?'consultant_review':null,['carboplatin'],'p1 treatment');
 for(const v of [a,a*.75])check(code,'Starting AUC versus individual reduction '+v,{target_auc:v},v===a?[]:['HN48_TARGET_AUC'],v===a?['HN48_TARGET_AUC']:[],v===a?null:'consultant_review',['carboplatin'],'p1 dosing');
 for(const v of [19.99,20,20.01,29.99,30,30.01,59.99,60,125,125.01]){
  let id=v<=20?'CARBO_GFR_LE20':code==='00419'&&v<=30?'HN48_CARBO_20_30':v<60?'CARBO_GFR_LOW':v>125?'CARBO_GFR_CAP':null;
  check(code,'Absolute GFR boundary '+v,{gfr_or_crcl_ml_min:v},id?[id]:[],['CARBO_GFR_LE20','HN48_CARBO_20_30','CARBO_GFR_LOW','CARBO_GFR_CAP'].filter(x=>x!==id),v<=20?'contraindicated':code==='00419'&&v<=30?'consultant_review':v<60?'proceed_with_caution':v>125?'consultant_review':null,id?['carboplatin']:null,'p4 renal; Calvert cap p1–2');
 }
 for(const age of [undefined,47.99,48,48.01]){const input={gfr_measurement_method:'estimated'};if(age!==undefined)input.creatinine_sample_age_hours=age;let hold=age===undefined||age>48;check(code,'Estimated creatinine freshness '+age,input,hold?['CARBO_ESTIMATED_CREATININE']:[],hold?[]:['CARBO_ESTIMATED_CREATININE'],hold?'withhold':null,['carboplatin'],'p4 renal');}
 for(const value of [undefined,109.99,110,110.01]){const input={gfr_measurement_method:'measured'};if(value!==undefined)input.creatinine_percent_isotope_baseline=value;let id=value===undefined?'CARBO_ISOTOPE_TREND_MISSING':value>110?'CARBO_ISOTOPE_RECHECK':null;check(code,'Isotope creatinine trend '+value,input,id?[id]:[],['CARBO_ISOTOPE_TREND_MISSING','CARBO_ISOTOPE_RECHECK'].filter(x=>x!==id),id?'consultant_review':null,['carboplatin'],'p4 renal');}
 for(const value of ['indexed','unknown'])check(code,'Unapproved absolute renal input '+value,{gfr_measurement_method:value},['CARBO_METHOD'],[],'consultant_review',['carboplatin'],'p1–2 Calvert');
 check(code,'Unreliable estimate not silently corrected',{gfr_estimate_unreliable:true},['CARBO_ESTIMATE_UNRELIABLE'],[],'consultant_review',['carboplatin'],'p2 dosing notes');
 check(code,'Severe unrelated toxicity has no invented reduction',{non_haematological_toxicity_grade:3},['NONHAEM_G3'],[],'consultant_review',['carboplatin']);
 check(code,'Haemoglobin-only entry remains a partial monitoring assessment',{haemoglobin:8},[],['NONHAEM_G3','FN','HN48_RT_STATUS_MISSING']);
}
for(const [field,prefix,t]of[['anc','ANC',1],['platelets','PLT',100]])for(const v of [t-.01,t,t+.01])check('00332',field+' exact source boundary '+v,{[field]:v},v<t?[prefix+'_LT'+t]:v===t?['HN48_'+prefix+'_EXACT_BOUNDARY']:[],v>t?[prefix+'_LT'+t,'HN48_'+prefix+'_EXACT_BOUNDARY']:v===t?[prefix+'_LT'+t]:['HN48_'+prefix+'_EXACT_BOUNDARY'],v<t?'delay':v===t?'consultant_review':null,['carboplatin'],'00332p3 Table1 strict inequalities');
check('00332','Prior platinum progression exclusion',{platinum_progression:true},['HN48_PLATINUM_PROGRESSION'],[],'contraindicated',['carboplatin'],'p2 exclusions');
check('00332','Febrile neutropenia is not an automatic reduction',{febrile_neutropenia:true},['FN'],[],'withhold',['carboplatin'],'p4 complications; no numeric post-FN table');
for(const [f,p,values,l,h,printed]of[['anc','ANC',[.49,.5,.99,.995,1,1.01],.5,1,.99],['platelets','PLT',[49.99,50,99,99.5,100,100.01],50,100,99],['platelet_nadir','PLT_NADIR',[49.99,50,99,99.5,100],50,100,99]])for(const v of values){let id=v<l?p+'_LOW':v<=printed?p+'_INTERMEDIATE':v<h?p+'_FRACTION_GAP':null;check('00419',f+' source boundary '+v,{[f]:v,...(f==='platelet_nadir'?{platelets:v<99.5?80:150}:{})},id?[id]:[],[p+'_LOW',p+'_INTERMEDIATE',p+'_FRACTION_GAP'].filter(x=>x!==id),v<=printed?'delay':v<h?'consultant_review':null,id?['carboplatin']:null,'00419p3 Table1; ANC day-of, PLT any-stage');}
check('00419','Recovered platelets after severe nadir require dose review, not indefinite delay',{platelets:150,platelet_nadir:49.99},['PLT_NADIR_LOW_RECOVERED'],['PLT_NADIR_LOW'],'consultant_review',['carboplatin'],'p3 Table1');
check('00419','Historical low nadir missing current count requires recovery assessment',{platelet_nadir:49},['HN48_NADIR_CURRENT_COUNT_MISSING'],['PLT_NADIR_LOW'],'consultant_review',['carboplatin'],'p3 Table1 until recovery');
check('00419','Recovered intermediate nadir has no automatic reduction',{platelets:100,platelet_nadir:75},['PLT_NADIR_INTERMEDIATE_RECOVERED'],['PLT_NADIR_INTERMEDIATE'],'consultant_review',['carboplatin'],'p3 Table1 until recovery');
check('00419','Normal current platelets cannot establish absent nadir',{assessment_phase:'on_treatment',concurrent_radiotherapy_confirmed:true,platelets:150},['HN48_PLATELET_HISTORY_MISSING'],[],'consultant_review',['carboplatin'],'p3 Table1');
check('00419','Recovered counts retain prior severe toxicity review',{anc:2,platelets:150,prior_severe_haematological_toxicity:true},['HN48_PRIOR_SEVERE_COUNTS'],[],'consultant_review',['carboplatin'],'p3 Table1 subsequent-cycle reduction consideration');
check('00419','FN delays with discretionary subsequent reduction',{febrile_neutropenia:true},['FN'],[],'delay',['carboplatin'],'p3 Table1');
check('00419','Baseline cisplatin-unsuitable prerequisite',{assessment_phase:'pre_treatment',concurrent_radiotherapy_confirmed:true,cisplatin_contraindicated_or_not_tolerated:false},['HN48_CISPLATIN_UNSUITABLE'],[],'consultant_review',['carboplatin'],'p1 indication');
check('00419','Prior hypersensitivity cannot auto-rechallenge',{carboplatin_hypersensitivity_history:true},['CARBO_HSR'],[],'contraindicated',['carboplatin'],'p3 exclusions, exceptional mild desensitisation only');
// Retrospective exact-source checks across all five previous suites. No new rules are assumed for unchanged sources.
for(const code of ['00314','00417']){
 const id=code==='00314'?'CIS_RENAL_45_59':'HN47_CIS_RENAL_45_59';
 check(code,'On-treatment CrCl45 reduced cisplatin',{assessment_phase:'on_treatment',[code==='00314'?'gfr_or_crcl_ml_min':'crcl_ml_min']:45},[id],[],'dose_reduce',['cisplatin'],'00314p3/00417p4 renal table');
 check(code,'Bilirubin above85 is FU-only contraindication',{bilirubin_umol_l:85.01},['5FU_HEPATIC'],[],'contraindicated',['fluorouracil'],'00314p3/00417p4 Table2');
}
for(const code of ['00417','00418']){
 check(code,'ANC1.5 source overlap not automatic full dose',{anc:1.5},['HN47_ANC_15_BOUNDARY'],[],'consultant_review',code==='00417'?['cisplatin','fluorouracil']:['carboplatin','fluorouracil'],'p4 Table1');
 check(code,'Fractional platelets gap not rounded',{platelets:99.5},['HN47_PLT_99_100_GAP'],[],'consultant_review',code==='00417'?['cisplatin','fluorouracil']:['carboplatin','fluorouracil'],'p4 Table1');
 check(code,'Severe cetuximab IR remains permanent',{cetuximab_infusion_reaction_grade:3},['CETUX_IR_G3'],[],'permanently_discontinue',['cetuximab'],'p5 Table3');
 check(code,'Prior permanent cetuximab stop survives normal rash',{cetuximab_prior_permanent_stop:true,cetuximab_skin_toxicity_grade:0},['HN47_CETUX_PRIOR_STOP'],[],'permanently_discontinue',['cetuximab'],'p5 Table3, history preservation');
 check(code,'First15-minute reaction stops even if grade1',{cetuximab_first_infusion_first15_reaction:true,cetuximab_infusion_reaction_grade:1},['HN47_CETUX_FIRST15'],['HN47_CETUX_IR_G1'],'withhold',['cetuximab'],'p6 complication instructions');
}
check('00418','GFR20 absolute contraindication',{gfr_or_crcl_ml_min:20},['CARBO_GFR_LE20'],[],'contraindicated',['carboplatin'],'p4 Table2 footnote');
check('00552','GFR20 contraindicates only carboplatin',{gfr_or_crcl_ml_min:20},['CARBO_GFR_LE20'],[],'contraindicated',['carboplatin'],'p4 renal');
check('00552','Oral grade4 stops source pathway',{mucositis_grade:4},['STOMATITIS_G4'],[],'discontinue',null,'p4 Table3');
check('00552','Weight loss exactly10 does not exceed threshold',{weight_loss_percent:10,hyperalimentation_instituted:false},[],['WEIGHT_LOSS_NO_NUTRITION'],null,null,'p4 Table3 strict >10%');
check('00552','Weight loss above10 without nutritional support',{weight_loss_percent:10.01,hyperalimentation_instituted:false},['WEIGHT_LOSS_NO_NUTRITION'],[],'discontinue',null,'p4 Table3');
check('00696','Paclitaxel platelets90 source overlap',{platelets:90},['PC696_PLT_90_BOUNDARY'],[],'consultant_review',['paclitaxel'],'p3 Table2');
check('00696','ANC profound but duration unknown not assumed7days',{anc:.49},['PC696_ANC_DURATION_UNKNOWN'],['PC696_ANC_LT05'],'withhold',['paclitaxel'],'p3 Table2');
check('00696','Profound ANC for7days one-level recovery pathway',{anc:.49,anc_below_0_5_duration_days:7},['PC696_ANC_LT05'],[],'delay_then_dose_reduce',['paclitaxel'],'p3 Tables1–2');
check('00696','ALT10 contraindicates paclitaxel independently',{alt_ratio_uln:10},['PAC_HEPATIC_CONTRA'],[],'contraindicated',['paclitaxel'],'p3 Table3');
check('00696','Bilirubin2.005 source gap not rounded',{alt_ratio_uln:1,bilirubin_uln_multiple:2.005,paclitaxel_current_dose_mg_m2:80},['PAC_HEPATIC_FRACTION_GAP'],['PAC_HEPATIC_60','PAC_HEPATIC_40'],'consultant_review',['paclitaxel'],'p3 Table3');
check('00696','Recovered skin after14days does not auto-restart',{cetuximab_skin_restart_requested:true,cetuximab_skin_occurrence:1,cetuximab_skin_toxicity_grade:2,cetuximab_skin_hold_days:14.01,cetuximab_prior_permanent_stop:false,cetuximab_restart_consultant_approved:true},['CETUX_SKIN_OVER_TWO_WEEKS'],['CETUX_RESTART_EPISODE_1'],'withhold',['cetuximab'],'p4 Table5');
fs.writeFileSync(report,JSON.stringify({mode,date:'2026-11-10',scope:'00332/00419 candidate and five retrospective source-boundary scenarios; independent clinical signoff not claimed',total:rows.length,passed:rows.filter(r=>r.pass).length,failed:rows.filter(r=>!r.pass),rows},null,2)+'\n');
console.log(JSON.stringify({mode,total:rows.length,passed:rows.filter(r=>r.pass).length,failed:rows.filter(r=>!r.pass).map(r=>({code:r.code,label:r.label,error:r.error})),report}));process.exitCode=rows.some(r=>!r.pass)?1:0;
