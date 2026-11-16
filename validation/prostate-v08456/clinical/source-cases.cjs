'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const R=path.resolve(__dirname,'../../..'),E=require(R+'/js/assessment-engine'),V=require(R+'/js/protocol-validator');
const index=require(R+'/protocols/index.json').protocols,codes=['00101','00257','00313','00546','00203'];
const P=Object.fromEntries(codes.map(c=>[c,JSON.parse(fs.readFileSync(R+'/'+index.find(x=>x.path.includes('/'+c+'-')).path))]));
const rows=[];
function check(c,label,input,yes=[],no=[],action=null,dose=null){
 const row={code:c,label,input,expected:{yes,no,action,dose}};
 try{assert.deepEqual(V.validate(P[c]).errors,[]);const a=E.assess(P[c],input);assert.deepEqual(a.errors,[]);assert.deepEqual(a.invalid,[]);const ids=a.findings.map(f=>f.ruleId);for(const id of yes)assert(ids.includes(id),'Missing '+id);for(const id of no)assert(!ids.includes(id),'Unexpected '+id);if(action)assert.equal(a.actionType,action);if(dose!==null)assert(a.findings.some(f=>f.action?.dose?.value===dose),'Expected source dose '+dose);row.pass=true;row.actual={ids,action:a.actionType};}catch(e){row.pass=false;row.error=e.message;}rows.push(row);
}
for(const c of codes)check(c,'No omitted input assumed normal',{});
for(const c of ['00313','00546','00203']){
 const high=c==='00313'?50:75,low=c==='00313'?40:60;
 for(const n of [1.49,1.5,1.51])check(c,'ANC '+n,{anc_x10e9_l:n},n<1.5?['DOC_ANC_LOW']:[],n>=1.5?['DOC_ANC_LOW']:[]);
 for(const n of [6.99,7,7.01])check(c,'Neutropenia duration after recovery '+n,{anc_x10e9_l:2,anc_below_0_5_days:n},n>7?['DOC_PROLONGED_HISTORY']:[],n<=7?['DOC_PROLONGED_HISTORY']:[]);
 for(const [f,lim]of [['bilirubin_uln_multiple',1.5],['ast_uln_multiple',10],['alt_uln_multiple',10],['alp_uln_multiple',6]])for(const n of [lim-.01,lim,lim+.01])check(c,f+' '+n,{[f]:n},n>lim?['DOC_HEP_STOP']:[],n<=lim?['DOC_HEP_STOP']:[]);
 for(const n of [1.49,1.5,1.51])check(c,'Single AST ambiguity '+n,{ast_uln_multiple:n},n>1.5?['DOC_HEP_AMBIGUITY']:[],n<=1.5?['DOC_HEP_AMBIGUITY']:[]);
 for(const n of [2,3,4])check(c,'Neuropathy '+n,{neuropathy_grade:n,current_docetaxel_mg_m2:high},n>2?['DOC_NEURO_75']:[],n<=2?['DOC_NEURO_75']:[],null,n>2?low:null);
 check(c,'Neuropathy persists at lower dose',{neuropathy_grade:3,current_docetaxel_mg_m2:low,toxicity_persists_at_reduced_dose:true},['DOC_NEURO_PERSISTENT'],[],'discontinue');
 check(c,'Grade 4 skin not ordinary grade 3 reduction',{skin_grade:4,current_docetaxel_mg_m2:high},['DOC_SKIN'],['DOC_SKIN_75']);
 check(c,'No dose re-escalation below ladder',{stomatitis_grade:3,current_docetaxel_mg_m2:low-5},['DOC_CURRENT_DOSE_RECONCILE'],['DOC_MOUTH_75']);
 check(c,'Combined liver ambiguity and toxicity',{bilirubin_uln_multiple:1.2,neuropathy_grade:3,current_docetaxel_mg_m2:high},['CONCURRENT_SOURCE_AMBIGUITY_HOLD'],[],'withhold');
 check(c,'Premedication omitted',{premedication_completed:false},['DOC_PREMED_REVIEW'],[],'withhold');
 check(c,'Severe acute infusion reaction',{acute_severe_hypersensitivity:true},['DOC_ACUTE_HSR'],[],'permanently_discontinue');
 check(c,'Low platelets: no invented source 100 cutoff',{platelets_x10e9_l:99},[],['PLATELET_REVIEW']);
}
check('00203','NSCLC cap retained',{indication_id:'00203a',planned_cycle_number:7},['DOC_NSCLC_COURSE_REVIEW']);
for(const id of ['00203b','00203c','00203h'])check('00203','No imported NSCLC cap '+id,{indication_id:id,planned_cycle_number:7},[],['DOC_NSCLC_COURSE_REVIEW']);
for(const n of [1.49,1.5,1.51])check('00101','Cabazitaxel ANC boundary '+n,{anc_x10e9_l:n},n<1.5?['ANC_LOW']:n===1.5?['ANC_BOUNDARY']:[],n>1.5?['ANC_LOW','ANC_BOUNDARY']:[]);
for(const n of [1,1.01,1.5,1.51,3,3.01])check('00101','Cabazitaxel bilirubin '+n,{bilirubin_uln_multiple:n},[...(n>1&&n<=1.5?['HEP_MILD']:[]),...(n>1.5&&n<=3?['HEP_MOD']:[]),...(n>3?['HEP_SEVERE']:[])],n<=3?['HEP_SEVERE']:[]);
check('00101','Severe bilirubin overrides AST mild message',{bilirubin_uln_multiple:3.1,ast_uln_multiple:2},['HEP_SEVERE'],[],'contraindicated');
check('00101','Persistent low-grade diarrhoea',{diarrhoea_grade:1,persistent_diarrhoea_despite_support:true},['DIARRHOEA'],[],'withhold');
for(const n of [1,2,3])check('00101','NCCP neuropathy boundary '+n,{neuropathy_grade:n},n>=2?['NEUROPATHY']:[],n<2?['NEUROPATHY']:[]);
check('00101','Grade 4 stomatitis stop',{stomatitis_grade:4},['STOMATITIS4'],[],'discontinue');
check('00101','Reduced-dose recurrence',{current_cabazitaxel_mg_m2:15,toxicity_recurrent_at_reduced_dose:true},['RECURRENCE']);
for(const [f,first,later]of [['anc_x10e9_l',1.5,1],['platelets_x10e9_l',100,50],['hb_g_dl',10,8]])for(const stage of [1,2,6])for(const n of [(stage===1?first:later)-.01,stage===1?first:later,(stage===1?first:later)+.01]){
 const prefix=f.startsWith('anc')?'ANC':f.startsWith('platelets')?'PLT':'HB',ids=[...(n<later?[prefix+'_ABSOLUTE']:[]),...(stage===1&&n<first?[prefix+'_FIRST']:[])];check('00257',f+' injection '+stage+' value '+n,{injection_number:stage,[f]:n},ids,stage!==1?[prefix+'_FIRST']:[],ids.length?'delay':null);
}
for(const n of [4.99,5,5.01])check('00257','Abiraterone washout '+n,{days_since_abiraterone_pred_stopped:n},n<5?['ABI_WASHOUT']:[],n>=5?['ABI_WASHOUT']:[]);
for(const n of [29.99,30,30.01])check('00257','Next systemic treatment window '+n,{planned_days_after_last_radium_to_systemic:n},n<30?['NEXT_SYSTEMIC']:[],n>=30?['NEXT_SYSTEMIC']:[]);
check('00257','Seventh injection blocked',{injection_number:7},['COURSE_MAX'],[],'withhold');
check('00257','Abiraterone contraindication',{concurrent_abiraterone_pred:true},['ABIRATERONE'],[],'contraindicated');
check('00257','Other treatment not silently labelled licensed combination',{other_systemic_anticancer_therapy:true},['OTHER_SYSTEMIC'],[],'withhold');
check('00257','No recovery by six weeks',{days_since_last_radium:42,haematology_not_recovered_despite_support:true},['RECOVERY_SIX_WEEKS']);
check('00257','Eligibility OR clause respected',{prior_mcrpc_systemic_lines:1,ineligible_other_available_treatments:true},[],['LINES']);
check('00257','Too few lines and other treatment feasible',{prior_mcrpc_systemic_lines:1,ineligible_other_available_treatments:false},['LINES']);
for(const [f,n] of [['anc_x10e9_l',1.25],['platelets_x10e9_l',75],['hb_g_dl',9]])check('00257','Missing injection stage with intermediate '+f,{[f]:n},['INJECTION_STAGE_UNKNOWN']);
check('00257','Known later injection with intermediate counts',{injection_number:2,anc_x10e9_l:1.25,platelets_x10e9_l:75,hb_g_dl:9},[],['INJECTION_STAGE_UNKNOWN']);
for(const n of [2,3,4])check('00101','Renal failure source stop '+n,{renal_failure_grade:n},n>=3?['CAB_RENAL_FAILURE_G3']:[],n<3?['CAB_RENAL_FAILURE_G3']:[],n>=3?'discontinue':null);
check('00101','Baseline ANC exclusion',{assessment_phase:'baseline',anc_x10e9_l:1.2},['CAB_BASELINE_ANC'],[],'contraindicated');
check('00101','Combined count criterion',{anc_x10e9_l:1.2,platelets_x10e9_l:90},['CAB_COUNTS_COMBINED'],[],'delay');
check('00101','Isolated platelets require review not invented delay',{platelets_x10e9_l:90},['PLATELETS_REVIEW'],['CAB_COUNTS_COMBINED'],'consultant_review');
check('00101','Strong inhibitor requires review',{strong_cyp3a_inhibitor_required:true},['CAB_CYP3A_INHIBITOR'],[],'consultant_review');
check('00101','Strong inducer requires review',{strong_cyp3a_inducer_present:true},['CAB_CYP3A_INDUCER'],[],'consultant_review');
const report={release:'0.84.56',source_checked:'2026-11-15',independent_clinical_review:false,total:rows.length,passed:rows.filter(x=>x.pass).length,cases:rows};fs.writeFileSync(path.join(__dirname,'source-case-results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({total:report.total,passed:report.passed,failed:rows.filter(x=>!x.pass)}));if(report.total!==report.passed)process.exitCode=1;
