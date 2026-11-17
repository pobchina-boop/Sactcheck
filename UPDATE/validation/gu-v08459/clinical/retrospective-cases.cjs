'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const R=path.resolve(__dirname,'../../..'),E=require(R+'/js/assessment-engine'),V=require(R+'/js/protocol-validator');
const I=require(R+'/protocols/index.json').protocols;
const P=Object.fromEntries(['00282','00622','00628','00450','00759','00333','00337','00338','00583','00846'].map(code=>[code,JSON.parse(fs.readFileSync(R+'/'+I.find(x=>x.path.includes('/'+code+'-')).path))]));
const rows=[];
function check(code,label,input,yes=[],no=[],action=null){
 const row={code,label,input,expected:{yes,no,action}};
 try{assert.deepEqual(V.validate(P[code]).errors,[]);const a=E.assess(P[code],input);assert.deepEqual(a.errors,[]);assert.deepEqual(a.invalid,[]);const ids=a.findings.map(f=>f.ruleId);for(const id of yes)assert(ids.includes(id),'Missing '+id);for(const id of no)assert(!ids.includes(id),'Unexpected '+id);if(action)assert.equal(a.actionType,action);if(!Object.keys(input).length)assert.notEqual(a.actionType,'proceed');row.pass=true;row.actual={ids,action:a.actionType};}catch(e){row.pass=false;row.error=e.message;}rows.push(row);
}
for(const code of Object.keys(P))check(code,'Missing inputs never authorise treatment',{});
for(const code of ['00282','00622','00628']){
 for(const [stage,field,threshold,id]of [['baseline','anc',1.5,'BASELINE_ANC'],['baseline','platelets',100,'BASELINE_PLATELETS'],['day1','anc',1,'DAY1_ANC'],['day1','platelets',100,'DAY1_PLATELETS']]){
  for(const n of [threshold-.01,threshold,threshold+.01])check(code,'Strict '+stage+' '+field+' '+n,{assessment_phase:stage,[field]:n},n<=threshold?[id]:[],n>threshold?[id]:[],n<=threshold?'withhold':null);
 }
 for(const n of [26.99,27,27.01]){const active=code==='00628'?n>27:n>=27;check(code,'Bilirubin source inequality '+n,{bilirubin_umol_l:n},active?['GEM_BILIRUBIN']:[],active?[]:['GEM_BILIRUBIN']);}
 for(const n of [29.99,30,30.01])check(code,'Gemcitabine renal exact boundary '+n,{crcl_ml_min:n},[n<30?'GEM_RENAL_LT30':n===30?'GEM_RENAL_EQ30':'CISPLATIN_RENAL_LT45'],n>30?['GEM_RENAL_LT30','GEM_RENAL_EQ30']:[]);
 for(const n of [44.99,45,59,59.5,60])check(code,'Cisplatin renal band '+n,{crcl_ml_min:n},n<45?['CISPLATIN_RENAL_LT45']:n<=59?['CISPLATIN_RENAL_45_59']:n<60?['CISPLATIN_RENAL_59_60_GAP']:[],n>=60?['CISPLATIN_RENAL_45_59','CISPLATIN_RENAL_59_60_GAP','CISPLATIN_RENAL_LT45']:[]);
 check(code,'Pneumonitis stop overrides renal review',{pneumonitis_grade:'2',crcl_ml_min:40},['GEM_PNEUMONITIS_STOP','CISPLATIN_RENAL_LT45'],[],'discontinue');
 check(code,'Skin stop is gemcitabine-specific',{severe_cutaneous_reaction:true},['GEM_SCAR_STOP'],[],'discontinue');
 check(code,'Stage is never inferred from satisfactory counts',{anc:3,platelets:200},['STAGE_REQUIRED']);
}
for(const [n,id]of [[.49,'INTRACYCLE_OMIT'],[.5,'INTRACYCLE_75_REVIEW'],[1,'INTRACYCLE_75_REVIEW']])check('00282','Day 8 ANC '+n,{assessment_phase:'intracycle',anc:n,platelets:150},[id]);
check('00282','Low platelet omission overrides intermediate ANC',{assessment_phase:'intracycle',anc:.75,platelets:49},['INTRACYCLE_OMIT','INTRACYCLE_75_REVIEW'],[],'omit');
for(const n of [.5,.51])check('00282','Strict restart ANC '+n,{restarting_omitted_gemcitabine:true,anc:n,platelets:51},n===.5?['RESTART_COUNTS']:[],n>.5?['RESTART_COUNTS']:[]);
for(const [f,n]of [['days_anc_below_05',5],['days_anc_below_01',3],['toxicity_delay_days',7]]){
 check('00282','History strictly greater '+f,{[f]:n},[],['HISTORY_75_ORIGINAL']);check('00282','History just above '+f,{[f]:n+.1},['HISTORY_75_ORIGINAL']);
}
for(const n of [74.99,75,75.01])check('00622','Split-cis Day 8 platelets '+n,{assessment_phase:'intracycle',anc:1,platelets:n},n<=75?['INTRACYCLE_75_REVIEW']:[],n>75?['INTRACYCLE_75_REVIEW']:[]);
check('00622','Split-cis ANC below 1 omits gemcitabine',{assessment_phase:'intracycle',anc:.99,platelets:200},['INTRACYCLE_OMIT'],[],'omit');
check('00622','Renal indication conflict persists at baseline',{assessment_phase:'baseline',crcl_ml_min:70},['RENAL_INDICATION_CONFLICT']);
check('00628','Adjuvant context must be confirmed',{assessment_phase:'baseline'},['ADJUVANT_CONTEXT']);
for(const [f,n]of [['anc',1],['platelets',75]])check('00628','Overlapping source boundary '+f,{assessment_phase:'intracycle',[f]:n},['INTRACYCLE_BOUNDARY']);
check('00628','Grade 4 component-specific actions',{nonhaem_except_nv_grade:'4'},['NONHAEM_G4_CIS','NONHAEM_G4_GEM'],[],'withhold');
for(const n of [1.49,1.5,1.51])check('00759','GemRT initiation ANC '+n,{assessment_phase:'baseline',anc:n},n<1.5?['START_COUNTS']:[],n>=1.5?['START_COUNTS']:[]);
for(const [f,n]of [['days_anc_below_05',5],['days_anc_below_01',3]])check('00759','GemRT inclusive history '+f,{[f]:n},['HISTORY_75']);
check('00759','GemRT restart equality allowed by count rule',{restarting_omitted_gemcitabine:true,anc:.5,platelets:50},[],['RESTART_COUNTS']);
check('00759','GemRT bilirubin at 27 needs 100 mg/m²-specific review',{bilirubin_umol_l:27},['BILIRUBIN_GE27']);
check('00759','Grade 4 is held while printed >4 remains unresolved',{nonhaem_except_nv_grade:'4'},['NONHAEM_HOLD'],[],'withhold');
for(const [f,n,id,boundary]of [['crcl_ml_min',10,'MITOMYCIN_CRCL_LT_10','MITOMYCIN_CRCL_EQ_10_BOUNDARY'],['bilirubin_umol_l',85,'5FU_BILIRUBIN_GT_85','5FU_BILIRUBIN_EQ_85_BOUNDARY'],['ast_u_l',180,'5FU_AST_GT_180','5FU_AST_EQ_180_BOUNDARY']]){
 check('00450','Retained exact boundary '+f,{[f]:n},[boundary],[id]);
 check('00450','Retained adjacent boundary '+f,{[f]:n+(f==='crcl_ml_min'?-.01:.01)},[id],[boundary]);
}
check('00450','No DPD result is not normal',{dpd_status:'unknown'},['DPD_UNKNOWN']);
check('00450','Complete DPD deficiency overrides platelet recovery',{dpd_status:'complete',platelets:200},['DPD_COMPLETE_DEFICIENCY'],[],'contraindicated');
check('00450','FN dose advice belongs to fluorouracil',{febrile_neutropenia:true},['FN'],[],'delay_then_dose_reduce');
for(const [code,id,drug]of [['00282','GEM_PNEUMONITIS_STOP','gemcitabine'],['00628','NONHAEM_G4_CIS','cisplatin'],['00450','FN','fluorouracil']]){const r=P[code].rule_engine.rules.find(r=>(r.rule_id||r.id)===id);assert.deepEqual(r.action.components,[drug],code+' component attribution');}
for(const code of ['00333','00337','00338']){
 for(const [field,n,id]of [['anc',1.5,'ANC_LOW'],['platelets',100,'PLATELETS_LOW']])for(const v of [n-.01,n,n+.01])check(code,'MVAC/CMV independent count '+field+' '+v,{[field]:v},v<n?[id]:[],v>=n?[id]:[],v<n?'withhold':null);
 for(const n of [19.99,20,49.99,50,50.01])check(code,'Methotrexate renal boundary '+n,{crcl_ml_min:n},n<20?['MTX_RENAL_LT20']:n<50?['MTX_RENAL_20_50']:n===50?['MTX_RENAL_EQ50']:[],n>50?['MTX_RENAL_20_50','MTX_RENAL_EQ50']:[]);
 for(const n of [50.99,51,51.01])check(code,'Vinblastine bilirubin strict >51 '+n,{bilirubin_umol_l:n},n>51?['VBL_BILIRUBIN_GT51']:[],n<=51?['VBL_BILIRUBIN_GT51']:[]);
 for(const n of [86,86.01])check(code,'Methotrexate bilirubin strict >86 '+n,{bilirubin_umol_l:n},n>86?['MTX_BILIRUBIN_GT86']:[],n<=86?['MTX_BILIRUBIN_GT86']:[]);
 for(const n of [39.99,40,49,49.5,50,59,59.5,60])check(code,'Cisplatin renal boundary '+n,{crcl_ml_min:n},n<40?['CIS_RENAL_LT40']:n<=49?['CIS_RENAL_40_49']:n<50?['CIS_RENAL_GAPS']:n<=59?['CIS_RENAL_50_59']:n<60?['CIS_RENAL_GAPS']:[],n>=60?['CIS_RENAL_40_49','CIS_RENAL_50_59','CIS_RENAL_GAPS']:[]);
 check(code,'Next-cycle grade 2 neuropathy',{assessment_phase:'day1',neuropathy_grade:'2'},['NEURO_G2_NEXT_CYCLE'],['NEURO_G2_REVIEW']);
 check(code,'No inferred next-cycle stage',{neuropathy_grade:'2'},['NEURO_G2_REVIEW'],['NEURO_G2_NEXT_CYCLE']);
 check(code,'Grade 3 stops cisplatin and vinblastine',{neuropathy_grade:'3'},['NEURO_G3_STOP'],[],'discontinue');
 check(code,'Grade 4 remains held with unresolved printed row',{neuropathy_grade:'4'},['NEURO_G4_HOLD'],[],'withhold');
 check(code,'Dialysis exceptions never auto-clear treatment',{haemodialysis:true},['MTX_DIALYSIS','CIS_DIALYSIS'],[],'consultant_review');
 const neuro=P[code].rule_engine.rules.find(x=>x.rule_id==='NEURO_G3_STOP');assert.deepEqual(neuro.action.components,['cisplatin','vinblastine']);
}
for(const code of ['00333','00338']){
 for(const n of [19.99,20,50,50.5,51,86,86.01])check(code,'Doxorubicin absolute bilirubin '+n,{bilirubin_umol_l:n},n<20?[]:n<=50?['DOXO_BILI_20_50']:n<51?['DOXO_BILI_GAP']:n<=86?['DOXO_BILI_51_86']:['DOXO_HEPATIC_STOP'],n<20?['DOXO_BILI_20_50','DOXO_HEPATIC_STOP']:[]);
 check(code,'Child-Pugh C excludes doxorubicin',{child_pugh_class:'C'},['DOXO_HEPATIC_STOP'],[],'contraindicated');
 for(const n of [49.99,50,50.01])check(code,'LVEF exclusion/test boundary '+n,{lvef_percent:n},n<50?['LVEF_BELOW50']:n===50?['LVEF_EQ50']:[],n>50?['LVEF_BELOW50','LVEF_EQ50']:[]);
 for(const n of [4.99,5,7,7.01])check(code,'Prior neutropenia duration '+n,{days_anc_below_05:n},n<5?[]:n<=7?['HAEM_HISTORY_75']:['NEUTROPENIA_DURATION_OUTSIDE_ROW'],n<5?['HAEM_HISTORY_75']:[]);
 for(const n of [24.99,25,25.01])check(code,'MVAC platelet history <25 '+n,{prior_platelet_nadir:n},n<25?['HAEM_HISTORY_75']:[],n>=25?['HAEM_HISTORY_75']:[]);
}
check('00333','G-CSF plan not silently omitted',{},['GCSF_REQUIRED']);
check('00333','Confirmed G-CSF clears only that plan flag',{gcsf_plan_confirmed:true},[],['GCSF_REQUIRED']);
check('00333','Perioperative intent is not copied into advanced source',{assessment_phase:'baseline',treatment_intent:'neoadjuvant'},['DDMVAC_SETTING']);
check('00337','CMV needs folinic rescue',{},['FOLINIC_RESCUE']);
check('00337','CMV schedule conflict visible at baseline',{assessment_phase:'baseline',folinic_rescue_confirmed:true},['CMV_SCHEDULE_CONFLICT'],['FOLINIC_RESCUE']);
for(const n of [49.99,50,50.01])check('00337','CMV platelet history <50 differs from MVAC '+n,{prior_platelet_nadir:n},n<50?['HAEM_HISTORY_75']:[],n>=50?['HAEM_HISTORY_75']:[]);
check('00338','MVAC intent required',{},['MVAC_INTENT_REQUIRED']);
for(const n of [2.99,3,3.01,9.99,10,10.01])for(const bili of [1.99,2,2.01]){
 const id=n>=10||(n>3&&bili>=2)?'COMBINATION_LIVER_STOP':n===3&&bili>=2?'COMBINATION_LIVER_GAP':n>=3&&bili<2?'COMBINATION_LIVER_HOLD':null;
 check('00583','Combination liver boundary '+n+'/'+bili,{alt_ast_uln_multiple:n,bilirubin_uln_multiple:bili},id?[id]:[],['COMBINATION_LIVER_STOP','COMBINATION_LIVER_HOLD','COMBINATION_LIVER_GAP'].filter(x=>x!==id));
}
check('00583','Enzyme result without bilirubin cannot clear',{alt_ast_uln_multiple:4},['COMBINATION_LIVER_BILI_MISSING'],[],'withhold');
for(const [f,n]of [['systolic_bp',160],['diastolic_bp',105]])for(const v of [n-.01,n,n+.01])check('00583','On-treatment BP '+f+' '+v,{[f]:v},[v<n?'AXI_BP_INTERMEDIATE':v===n?'AXI_BP_EXACT_GAP':'AXI_BP_HOLD']);
check('00583','BP baseline differs from on-treatment',{assessment_phase:'baseline',systolic_bp:150,diastolic_bp:90},['BASELINE_BP'],['AXI_BP_HOLD']);
for(const n of [2.99,3,3.01])check('00583','24-hour protein '+n,{protein_g_24h:n},n>=3?['AXI_PROTEIN_HOLD']:[],n<3?['AXI_PROTEIN_HOLD']:[]);
check('00583','Source UPC requires explicit unit-aware confirmation',{source_upc_ge3_confirmed:true},['AXI_PROTEIN_HOLD']);
assert(!P['00583'].input_definitions.urine_protein_creatinine_ratio,'Ambiguous numeric UPC cannot be compared with 3');
for(const g of ['1','2','3','4']){
 check('00583','Immune lung grade '+g,{immune_pneumonitis_grade:g},g==='2'?['ICI_LUNG_HOLD']:Number(g)>=3?['ICI_LUNG_STOP']:[],g==='1'?['ICI_LUNG_HOLD','ICI_LUNG_STOP']:[]);
 check('00583','Immune colitis select grade '+g,{immune_colitis_grade:g},['2','3'].includes(g)?['ICI_COLITIS_HOLD']:g==='4'?['ICI_COLITIS_STOP']:[],g==='1'?['ICI_COLITIS_HOLD','ICI_COLITIS_STOP']:[]);
}
check('00583','Recurrence upgrades grade 2 lung to stop',{immune_pneumonitis_grade:'2',recurrent_grade2_pneumonitis:true},['ICI_LUNG_HOLD','ICI_LUNG_STOP'],[],'permanently_discontinue');
check('00583','Controlled endocrine event is not generic permanent stop',{adrenal_insufficiency_grade:'4',controlled_endocrine_restart_considered:true},['ICI_ENDOCRINE_HOLD','ENDOCRINE_RESTART'],['ICI_OTHER_STOP']);
for(const n of [83.99,84,84.01])check('00583','Twelve-week recovery boundary '+n,{days_since_last_pembrolizumab:n,immune_toxicity_resolved_grade01:false,prednisolone_equivalent_mg_day:11},n===84?['ICI_12_WEEK_REVIEW']:n>84?['ICI_12_WEEK_STOP']:[],n<84?['ICI_12_WEEK_STOP','ICI_12_WEEK_REVIEW']:[]);
check('00583','Immune colitis hold takes precedence over axitinib reduction review',{immune_colitis_grade:'2',axitinib_diarrhoea_grade:'3',toxicity_attribution_uncertain:true},['ICI_COLITIS_HOLD','AXI_DIARRHOEA_G3','ATTRIBUTION_REVIEW'],[],'withhold');
check('00583','Pulmonary grade 2 bleed permanent stop',{axitinib_bleeding_grade:'2',pulmonary_or_gi_bleed_nonhaemorrhoidal:true},['AXI_BLEED_G2','AXI_BLEED_STOP'],[],'permanently_discontinue');
for(const n of [13.89,13.9,13.91])check('00846','Strict glucose boundary '+n,{blood_glucose_mmol_l:n},n>13.9?['GLUCOSE_GT13_9']:[],n<=13.9?['GLUCOSE_GT13_9']:[]);
for(const n of [24.99,25,49.99,50,74.99,75])check('00846','Platelet-specific EV exception '+n,{platelets:n},[n<25?'COUNTS_SEVERE':n<50?'COUNTS_INTERMEDIATE':n<75?'PLATELETS_50_75_HOLD':null].filter(Boolean),n>=75?['COUNTS_SEVERE','COUNTS_INTERMEDIATE','PLATELETS_50_75_HOLD']:[]);
for(const n of [.49,.5,.99,1,1.49,1.5])check('00846','ANC EV band '+n,{anc:n},n<.5?['COUNTS_SEVERE']:n<1?['COUNTS_INTERMEDIATE']:[],n>=1?['COUNTS_SEVERE','COUNTS_INTERMEDIATE']:[]);
for(const g of ['1','2','3','4'])check('00846','EV neuropathy '+g,{neuropathy_grade:g},g==='2'?['NEURO_G2']:Number(g)>=3?['NEURO_G3_PLUS']:[],g==='1'?['NEURO_G2','NEURO_G3_PLUS']:[]);
check('00846','Platelet exception applies despite acceptable ANC',{anc:1.2,platelets:60},['PLATELETS_50_75_HOLD'],[],'withhold');
for(const [code,id,components]of [['00583','COMBINATION_LIVER_STOP',['pembrolizumab','axitinib']],['00583','AXI_PROTEIN_HOLD',['axitinib']],['00583','ICI_COLITIS_HOLD',['pembrolizumab']],['00846','GLUCOSE_GT13_9',['enfortumab vedotin']]])assert.deepEqual(P[code].rule_engine.rules.find(x=>x.rule_id===id).action.components,components);
const selected=rows.filter(x=>['00622','00333','00337','00583','00846'].includes(x.code));
const report={release:'0.84.59',original_test_release:'0.84.58',full_suite_total:rows.length,full_suite_passed:rows.filter(x=>x.pass).length,stage:'ten_assessment_drafts',source_checked:'2026-11-17',independent_clinical_approval:false,total:selected.length,passed:selected.filter(x=>x.pass).length,cases:selected};
fs.writeFileSync(path.join(__dirname,'retrospective-case-results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({total:report.total,passed:report.passed,failed:rows.filter(x=>!x.pass)}));if(report.total!==report.passed)process.exitCode=1;
