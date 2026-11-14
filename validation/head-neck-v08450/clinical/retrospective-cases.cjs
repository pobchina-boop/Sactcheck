'use strict';
// Source expectations are constants read from the retained NCCP tables, independent of rule enumeration.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const R=path.resolve(__dirname,'../../..'),E=require(R+'/js/assessment-engine'),V=require(R+'/js/protocol-validator'),D=require(R+'/js/protocol-dose-schedule');
const codes=['00514','00517','00903','00589','00591'],P=Object.fromEntries(codes.map(c=>[c,JSON.parse(fs.readFileSync(R+'/protocols/head-neck/'+fs.readdirSync(R+'/protocols/head-neck').find(x=>x.startsWith(c+'-'))))]));
const cases=[];
function check(code,label,input,yes=[],no=[],component=null,action=null){const row={code,label,input,expected:{yes,no,component,action},citation:'NCCP '+code+' v'+P[code].metadata.nccp_version+'; retained source tables (audit.md)'};try{let out=E.assess(P[code],input);assert.deepEqual(out.errors,[]);assert.deepEqual(out.invalid,[]);const ids=out.findings.map(x=>x.ruleId);for(const id of yes)assert(ids.includes(id),'Missing '+id);for(const id of no)assert(!ids.includes(id),'Unexpected '+id);if(action)assert.equal(out.actionType,action);if(component)for(const id of yes)assert.deepEqual(P[code].rule_engine.rules.find(x=>x.id===id).action.components,component);const model=D.buildModificationModel(P[code],out);assert(Array.isArray(model.rows));row.pass=true;row.actual={action:out.actionType,ids};}catch(e){row.pass=false;row.error=e.message;}cases.push(row);}
for(const code of codes){assert.deepEqual(V.validate(P[code]).errors,[]);check(code,'Empty form remains partial',{});check(code,'Prior permanent stop survives normal counts',{prior_permanent_stop:true,anc:3,platelets:180},['PRIOR_STOP']);for(const f of ['pregnancy','breastfeeding','hypersensitivity'])check(code,f,{[f]:true},[f.toUpperCase()]);}
for(const code of ['00514','00517']){
 for(const [f,lo,hi]of[['anc',.5,1],['platelets',50,100]])for(const v of [lo-.01,lo,hi-.01,hi,hi+.01]){
  const prefix=f.toUpperCase();let id=v<lo?'DAY8_'+prefix+'_LOW':v<hi?'DAY8_'+prefix+'_REDUCE':v===hi?'DAY8_'+prefix+'_EQUALITY':null;
  check(code,'Day8 '+f+' '+v,{gemcitabine_day:'day8',[f]:v},id?[id]:[],['DAY1_'+prefix,...['LOW','REDUCE','EQUALITY'].map(t=>'DAY8_'+prefix+'_'+t).filter(t=>t!==id)],id?['gemcitabine']:null,v<lo?'omit':null);
  check(code,'Day1 '+f+' '+v,{gemcitabine_day:'day1',[f]:v},v<hi?['DAY1_'+prefix]:[],v<hi?['DAY8_'+prefix+'_LOW','DAY8_'+prefix+'_REDUCE']:['DAY1_'+prefix]);
 }
 check(code,'Missing day with low count',{anc:.4},['DAY_MISSING'],['DAY1_ANC','DAY8_ANC_LOW']);
 for(const v of [24.99,25])check(code,'Prior nadir '+v,{prior_platelet_nadir:v},v<25?['GEM_SUBSEQUENT_REDUCTION']:[],v>=25?['GEM_SUBSEQUENT_REDUCTION']:[],v<25?['gemcitabine']:null);
 for(const v of [7,7.01])check(code,'Previous delay '+v,{delay_days:v},v>7?['GEM_SUBSEQUENT_REDUCTION']:[],v<=7?['GEM_SUBSEQUENT_REDUCTION']:[]);
}
for(const code of ['00514','00517','00903']){
 const th=code==='00514'?4:code==='00517'?3:2;
 for(const grade of [0,1,2,3,4])check(code,'Other toxicity grade '+grade,{non_haematological_toxicity_grade:grade},grade>=th?['NONHAEM_ACTIVE']:[],grade<th?['NONHAEM_ACTIVE']:[]);
 for(const b of [26.99,27,27.01]){let trigger=code==='00514'?b>27:b>=27;check(code,'Bilirubin '+b,{bilirubin_umol_l:b},trigger?['GEM_BILIRUBIN']:[],trigger?[]:['GEM_BILIRUBIN'],trigger?['gemcitabine']:null);}
 for(const g of [1,2,3])check(code,'Pneumonitis '+g,{gemcitabine_pneumonitis_grade:g},g>=2?['GEM_PNEUM_G2']:[],g<2?['GEM_PNEUM_G2']:[],g>=2?['gemcitabine']:null,g>=2?'discontinue':null);
 check(code,'Mixed low day8 count and lung toxicity',{gemcitabine_day:'day8',anc:.4,gemcitabine_pneumonitis_grade:2},['GEM_PNEUM_G2'],[],['gemcitabine'],'discontinue');
 check(code,'Recovered toxicity retains history',{prior_severe_nonhaem_toxicity:true,non_haematological_toxicity_grade:0},['NONHAEM_HISTORY'],['NONHAEM_ACTIVE']);
}
for(const code of ['00517','00903']){
 for(const [field,t]of[['anc',1.5],['platelets',100]])for(const v of [t-.01,t,t+.01])check(code,'Baseline '+field+' '+v,{assessment_phase:'pre_treatment',[field]:v},v<=t?['BASELINE_'+field.toUpperCase()]:[],v>t?['BASELINE_'+field.toUpperCase()]:[]);
 for(const v of [39.99,40,44.99,45,49,49.5,50,59,59.5,60,60.01]){
  let id=code==='00517'?(v<45?'CIS_RENAL_BELOW':v<=59?'CIS_RENAL_45':v<60?'CIS_RENAL_GAP_59':v===60?'CIS_EXACT60':null):(v<40?'CIS_RENAL_BELOW':v<=49?'CIS_RENAL_40':v<50?'CIS_RENAL_GAP_49':v<=59?'CIS_RENAL_50':v<60?'CIS_RENAL_GAP_59':null);
  check(code,'On-treatment renal '+v,{assessment_phase:'on_treatment',crcl_ml_min:v,haemodialysis:false},id?[id]:[],['BASELINE_RENAL'],id?['cisplatin']:null);
  check(code,'Baseline renal '+v,{assessment_phase:'pre_treatment',crcl_ml_min:v},v<60?['BASELINE_RENAL']:[],v>=60?['BASELINE_RENAL']:[],v<60?['cisplatin']:null);
 }
 check(code,'Renal phase missing',{crcl_ml_min:50},['RENAL_PHASE_UNKNOWN']);
 check(code,'Dialysis no fixed dose',{haemodialysis:true},['CIS_DIALYSIS'],[],['cisplatin']);
 for(const g of [1,2,3])check(code,'Neuropathy '+g,{neuropathy_grade:g},g>=2?['NEUROPATHY_ACTIVE']:[],g<2?['NEUROPATHY_ACTIVE']:[],g>=2?['cisplatin']:null);
}
for(const [f,lo,hi]of[['anc',.5,1],['platelets',50,75]])for(const day of ['day1','day8'])for(const v of [lo-.01,lo,hi-.01,hi]){let id=v<lo?day.toUpperCase()+'_'+f.toUpperCase()+'_SEVERE':v<hi?day.toUpperCase()+'_'+f.toUpperCase()+'_DELAY':null;check('00903',day+' '+f+' '+v,{gemcitabine_day:day,[f]:v},id?[id]:[],[],id?(day==='day8'?['gemcitabine']:['gemcitabine','cisplatin']):null,day==='day8'&&id?'omit':null);}
check('00903','Previous myelosuppression delay',{prior_myelosuppression_delay:true},['PREVIOUS_MYEL_DELAY']);
for(const n of [2,3])check('00903','Repeated delay '+n,{myelosuppression_delay_count:n},n===3?['PROLONGED_DELAY']:[],n===2?['PROLONGED_DELAY']:[]);
for(const code of ['00589','00591']){
 check(code,'Radiotherapy not concurrent',{concurrent_radiotherapy_confirmed:false},['RT_NOT_CONFIRMED'],[],null,'withhold');
 for(const v of [19.99,20,20.01,59.99,60])check(code,'Renal '+v,{gfr_or_crcl_ml_min:v},v<=20?['CARBO_LE20']:v<60?['CARBO_LT60']:[],v>20?['CARBO_LE20']:[],v<60?['carboplatin']:null);
 for(const g of ['none','mild','moderate','severe'])check(code,'Liver '+g,{hepatic_impairment_severity:g,renal_impairment_present:false},g==='severe'?['FU_HEPATIC_SEVERE']:[],g==='severe'?[]:['FU_HEPATIC_SEVERE'],g==='severe'?['fluorouracil']:null);
 check(code,'Moderate liver missing renal status',{hepatic_impairment_severity:'moderate'},['FU_HEPATIC_RENAL'],[],['fluorouracil']);
 for(const d of ['normal','partial','complete'])check(code,'DPD '+d,{dpd_status:d},d==='complete'?['DPD_COMPLETE']:d==='partial'?['DPD_PARTIAL']:[],d==='normal'?['DPD_COMPLETE','DPD_PARTIAL']:[],d==='normal'?null:['fluorouracil']);
 check(code,'Unknown DPD first dose',{assessment_phase:'pre_treatment'},['DPD_UNKNOWN'],[],['fluorouracil']);
 check(code,'Renal phenotype interpretation',{dpd_test_method:'phenotype',renal_impairment_severity:'moderate'},['DPD_RENAL_PHENOTYPE'],[],['fluorouracil']);
 for(const field of ['mucositis_grade','dysphagia_grade'])for(const g of [2,3,4])check(code,field+' '+g,{[field]:g},g>=3?[field.toUpperCase()+'_G'+g]:[],g<3?[field.toUpperCase()+'_G3',field.toUpperCase()+'_G4']:[],g>=3?['fluorouracil']:null,g===4?'discontinue':null);
 for(const v of [10,10.01])for(const support of [false,true])check(code,'Weight '+v+' support '+support,{weight_loss_percent:v,hyperalimentation_instituted:support},v>10?['WEIGHT_'+String(support).toUpperCase()]:[],v<=10?['WEIGHT_TRUE','WEIGHT_FALSE']:[],v>10?['fluorouracil']:null);
 check(code,'Weight loss without support status',{weight_loss_percent:11},['WEIGHT_SUPPORT_UNKNOWN']);
 for(const age of [48,48.01])check(code,'Creatinine freshness '+age,{gfr_measurement_method:'estimated',creatinine_sample_age_hours:age},age>48?['CARBO_ESTIMATED_CREATININE']:[],age<=48?['CARBO_ESTIMATED_CREATININE']:[]);
 for(const ratio of [110,110.01])check(code,'Isotope trend '+ratio,{gfr_measurement_method:'measured',creatinine_percent_isotope_baseline:ratio},ratio>110?['CARBO_ISOTOPE_RECHECK']:[],ratio<=110?['CARBO_ISOTOPE_RECHECK']:[]);
}
for(const c of ['00589','00591'])for(const v of [.49,.5,.99,.995,1,1.49,1.5,1.51]){let id=c==='00589'?(v<1?'COUNT_ANC_LOW':v<1.5?'COUNT_ANC_REDUCE':v===1.5?'ANC_EXACT15':null):(v<.5?'COUNT_ANC_LOW':v<=.99?'COUNT_ANC_DELAY':v<1?'COUNT_FRACTIONAL_ANC':null);check(c,'ANC count table '+v,{anc:v},id?[id]:[]);}
for(const c of ['00589','00591'])for(const v of [49.99,50,74.99,75,99,99.5,100]){let id=c==='00589'?(v<75?'COUNT_PLATELETS_LOW':v<=99?'COUNT_PLATELETS_REDUCE':v<100?'PLT_FRACTIONAL_GAP':null):(v<50?'COUNT_PLATELETS_LOW':v<=99?'COUNT_PLATELETS_DELAY':v<100?'COUNT_FRACTIONAL_PLATELETS':null);check(c,'Platelet count table '+v,{platelets:v},id?[id]:[]);}
check('00589','Unique baseline creatinine exclusion',{assessment_phase:'pre_treatment',creatinine_umol_l:120.01},['BASELINE_RENAL'],[],['carboplatin']);
check('00591','No imported 00589 baseline creatinine exclusion',{assessment_phase:'pre_treatment',creatinine_umol_l:120.01},[],['BASELINE_RENAL']);
for(const gfr of [125,125.01])check('00591','Calvert GFR cap '+gfr,{gfr_or_crcl_ml_min:gfr},gfr>125?['CARBO_GFR_CAP']:[],gfr<=125?['CARBO_GFR_CAP']:[],gfr>125?['carboplatin']:null);
const result={release:'0.84.50',date:'2026-11-14',total:cases.length,passed:cases.filter(x=>x.pass).length,cases};fs.writeFileSync(path.join(__dirname,'retrospective-case-results.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({total:result.total,passed:result.passed,failed:cases.filter(x=>!x.pass)}));if(result.passed!==result.total)process.exitCode=1;
