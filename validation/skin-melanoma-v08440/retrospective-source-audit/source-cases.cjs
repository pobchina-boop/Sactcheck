'use strict';
// Independently authored expected actions from fresh NCCP source pages; no predicate-derived oracle.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const R=__dirname,repo=process.env.SACTCHECK_REPO||path.resolve(R,'../../..'),stage=process.env.SACTCHECK_PROTOCOL_ROOT||repo,E=require(path.join(repo,'js/assessment-engine')),D=require(path.join(repo,'js/protocol-dose-schedule')),V=require(path.join(repo,'js/protocol-validator'));
const before=process.argv.includes('--before'),sources=JSON.parse(fs.readFileSync(path.join(R,'sources.json'))).filter(s=>s.code),P={},out=[],witness={};
for(const s of sources)P[s.code]=JSON.parse(fs.readFileSync(before?path.join(R,'protocol-before',path.basename(s.protocol_path)):path.join(stage,s.protocol_path)));
function c(code,name,input,yes=[],no=[],action=null,page=''){const row={code,name,input,source:`NCCP ${code}, ${page}`};try{const r=E.assess(P[code],input),m=D.buildModificationModel(P[code],r);assert.deepEqual(r.errors,[]);assert.deepEqual(r.invalid,[]);assert.equal(r.complete,false);require(path.join(repo,'tests/helpers/source-input-validation-v08421.cjs'))(r);const ids=r.findings.map(x=>x.ruleId);witness[code]??=new Set();for(const i of ids)witness[code].add(i);row.actual={action:r.actionType,ids,componentActions:m.rows.map(x=>[x.componentId,x.actionType])};for(const id of yes)assert(ids.includes(id),'Missing '+id);for(const id of no)assert(!ids.includes(id),'Unexpected '+id);if(action)assert.equal(r.actionType,action);row.pass=true;}catch(e){row.pass=false;row.error=e.message;}out.push(row);}
for(const code of ['00455','00558']){
 const keys=['pembro_source_recovery_complete','pembro_steroid_management_complete','pembro_consultant_restart_approved'],ready=Object.fromEntries(keys.map(k=>[k,true])),id='PEMBRO_RESTART_UNCONFIRMED';
 c(code,'No requested restart: no inferred new hold',{},[],[id],'incomplete','pp5–6');
 c(code,'Requested restart with all context omitted',{pembro_restart_requested:true},[id],[],'withhold','pp5–6 Table1');
 for(const key of keys)for(const state of ['omitted','false','blank']){const x={pembro_restart_requested:true,...ready};if(state==='omitted')delete x[key];else x[key]=state==='false'?false:'';c(code,`${key} ${state}`,x,[id],[],'withhold','pp5–6');}
 c(code,'Complete restart confirmations are no automatic clearance',{pembro_restart_requested:true,...ready},[],[id],null,'pp5–6');
 c(code,'Explicit no restart does not trigger guard',{pembro_restart_requested:false,pembro_source_recovery_complete:false},[],[id],null,'pp5–6');
 c(code,'Controlled severe endocrine exception preserved',{pembro_restart_requested:true,...ready,endocrine_status:'controlled_after_severe'},['ENDOCRINE_CONTROLLED_REVIEW'],[id],'consultant_review','Table1 endocrine exception');
 for(const key of ['ici_failed_recovery_12_weeks','ici_steroid_gt10_at_12_weeks'])c(code,'Twelve-week stop outranks ready restart '+key,{pembro_restart_requested:true,...ready,[key]:true},['ICI_12_WEEK_STOP'],[],'permanently_discontinue','Table1 footnote');
 c(code,'Recurrent pneumonitis stop outranks restart',{pembro_restart_requested:true,...ready,recurrent_grade2_pneumonitis:true},['PNEUMONITIS_SEVERE_OR_RECURRENT'],[],'permanently_discontinue','Table1');
 for(const [field,gate,lo,hi,hold,stop] of [['alt_ast_uln_multiple','pembro_immune_hepatitis_assessed',3,5,'HEPATITIS_WITHHOLD','HEPATITIS_PERMANENT'],['bilirubin_uln_multiple','pembro_immune_hepatitis_assessed',1.5,3,'HEPATITIS_WITHHOLD','HEPATITIS_PERMANENT'],['creatinine_ratio_baseline_or_uln','pembro_immune_nephritis_assessed',1.5,3,'NEPHRITIS_G2','NEPHRITIS_G3_PLUS']])for(const n of [lo,lo+.01,hi,hi+.01])c(code,`Retained ULN boundary ${field} ${n}`,{[field]:n,[gate]:true},n>hi?[stop]:n>lo?[hold]:[],n>hi?[hold]:n>lo?[stop]:[hold,stop],n>hi?'permanently_discontinue':n>lo?'withhold':null,'Table1: ratios are ULN, not baseline');
}
for(const code of ['00483','00484']){
 for(const f of ['hypothyroidism_grade','hyperthyroidism_grade','hypophysitis_grade'])for(const g of [2,3]){
  const h=f.toUpperCase()+'_HOLD',stop=f.toUpperCase()+'_STOP',ctx=f.toUpperCase()+'_CONTEXT';
  c(code,`${f} ${g} symptomatic`,{[f]:g,endocrine_symptoms:true},[h],[ctx,stop],'withhold','p7 Table3');
  c(code,`${f} ${g} explicitly asymptomatic`,{[f]:g,endocrine_symptoms:false},[],[h,ctx,stop],null,'p7 Table3');
  c(code,`${f} ${g} omitted symptom status`,{[f]:g},[ctx],[h,stop],'consultant_review','p7 Table3');
  c(code,`${f} ${g} known controlled asymptomatic replacement`,{[f]:g,endocrine_controlled_asymptomatic:true},['ENDOCRINE_CONTROLLED'],[h,ctx,stop],'consultant_review','p7 Table3');
  c(code,`${f} ${g} symptoms contradict controlled flag`,{[f]:g,endocrine_symptoms:true,endocrine_controlled_asymptomatic:true},[h],[],'withhold','p7 Table3');
 }
 for(const f of ['hypothyroidism_grade','hyperthyroidism_grade','hypophysitis_grade'])c(code,`${f} 4 stop preserved despite asymptomatic flag`,{[f]:4,endocrine_symptoms:false,endocrine_controlled_asymptomatic:true},[f.toUpperCase()+'_STOP'],[],'permanently_discontinue','p7 Table3');
 for(const other of [true,false])c(code,'Restart another immunosuppressant '+other,{restart_assessment_requested:true,restart_source_recovery_complete:true,other_immunosuppressive_treatment:other},other?['RESTART_OTHER_IMMUNOSUPPRESSION']:[],other?[]:['RESTART_OTHER_IMMUNOSUPPRESSION'],other?'withhold':null,'p6 dose modifications');
 c(code,'Other immunosuppressant outside restart domain',{other_immunosuppressive_treatment:true},[],['RESTART_OTHER_IMMUNOSUPPRESSION'],null,'p6');
 c(code,'Recovery missing remains hold',{restart_assessment_requested:true},['RESTART_INCOMPLETE'],[],'withhold','pp6–8');
 for(const value of [10,10.01])c(code,'Retained prednisolone restart boundary '+value,{restart_assessment_requested:true,restart_source_recovery_complete:true,systemic_steroids_mg_pred:value},value>10?['RESTART_IMMUNOSUPPRESSION']:[],value<=10?['RESTART_IMMUNOSUPPRESSION']:[],value>10?'withhold':null,'p6');
 for(const [f,lo,stop] of [['pneumonitis_grade',2,3],['diarrhoea_colitis_grade',2,4],['immune_hepatitis_grade',2,3],['immune_nephritis_grade',2,4],['myocarditis_grade',2,3],['rash_grade',3,4]])for(const g of [lo,stop])c(code,`Retained ${f} boundary ${g}`,{[f]:g},[f.toUpperCase()+(g===stop?'_STOP':'_HOLD')],[],g===stop?'permanently_discontinue':'withhold','pp7–8 Table3');
}
{
 const code='00551';
 c(code,'Suspected SJS/TEN acts before confirmed grade',{sjs_ten_suspected:true},['SJS_TEN_SUSPECTED'],['SJS_TEN_CONFIRMED'],'discontinue','p9 Table3');
 c(code,'No suspicion does not trigger stop',{sjs_ten_suspected:false},[],['SJS_TEN_SUSPECTED'],null,'p9 Table3');
 c(code,'Confirmed SJS/TEN outranks suspected stop',{sjs_ten_suspected:true,sjs_ten_confirmed:true},['SJS_TEN_SUSPECTED','SJS_TEN_CONFIRMED'],[],'permanently_discontinue','p9 Table3');
 for(const [choice,n] of [['q14_to_q28',14],['q28_to_q14',28]]){
  const id='MAINTENANCE_SWITCH_'+choice.toUpperCase();for(const v of [n-1,n,n+1])c(code,`${choice} ${v} days`,{treatment_phase:'nivolumab_maintenance',maintenance_schedule_switch:choice,days_since_last_maintenance_dose:v},v<n?[id]:[],v>=n?[id]:[],v<n?'withhold':null,'p2 switching monotherapy');
  c(code,`${choice} timing omitted`,{maintenance_schedule_switch:choice},['MAINTENANCE_SWITCH_CONTEXT'],[id],'consultant_review','p2 switching monotherapy');
 }
 c(code,'No switch leaves interval inactive',{maintenance_schedule_switch:'none',days_since_last_maintenance_dose:0},[],['MAINTENANCE_SWITCH_Q14_TO_Q28','MAINTENANCE_SWITCH_Q28_TO_Q14'],null,'p2');
 c(code,'CRC IV480 remains source conflict on on-time switch',{indication_id:'00551a',maintenance_schedule:'iv480_q28',maintenance_schedule_switch:'q14_to_q28',days_since_last_maintenance_dose:14},['CRC_IV480_NOT_SOURCE'],['MAINTENANCE_SWITCH_Q14_TO_Q28'],'consultant_review','pp2–3 indication restrictions');
 for(const [ctx,schedule,n,id] of [['00551a','iv240_q14',21,'CRC_MAINTENANCE_EARLY'],['00551-gu','iv240_q14',21,'OTHER_MAINTENANCE_EARLY'],['00551b-skin','iv480_q28',42,'OTHER_MAINTENANCE_EARLY']])for(const v of [n-1,n])c(code,`First maintenance ${ctx}/${schedule}/${v}`,{indication_id:ctx,first_maintenance_dose:true,maintenance_schedule:schedule,days_since_last_combination:v},v<n?[id]:[],v>=n?[id]:[],v<n?'withhold':null,'pp1–2');
 for(const phase of ['combination','nivolumab_maintenance'])c(code,'Grade3 colitis permanent stop during both post-combination and combination phases '+phase,{treatment_phase:phase,diarrhoea_colitis_grade:3},['DIARRHOEA_COLITIS_GRADE_STOP'],[],'permanently_discontinue','pp7,10 footnote a');
 c(code,'Combination cycle five never extended',{treatment_phase:'combination',cycle_number:5},['COMBINATION_LIMIT'],[],'withhold','pp1–2');
 c(code,'Non-steroid immunosuppressive restart remains blocked',{restart_requested:true,source_recovery_complete:true,consultant_restart_approved:true,other_immunosuppression:true},['RESTART_IMMUNOSUPPRESSION'],[],'withhold','p6');
}
const report={release:'0.84.40',date:'2026-11-06',mode:before?'baseline':'candidate',oracle:'Independent fresh-source scenarios, not protocol-predicate derived',total:out.length,passed:out.filter(x=>x.pass).length,failed:out.filter(x=>!x.pass).length,positive_rule_witnesses:Object.fromEntries(Object.entries(witness).map(([k,v])=>[k,[...v].sort()])),cases:out,clinical_use_authorised:false};fs.writeFileSync(path.join(R,`source-case-results-${report.mode}.json`),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({mode:report.mode,total:report.total,passed:report.passed,failed:report.failed,failures:out.filter(x=>!x.pass).map(x=>({code:x.code,name:x.name,error:x.error}))},null,2));if(!before&&report.failed)process.exitCode=1;
