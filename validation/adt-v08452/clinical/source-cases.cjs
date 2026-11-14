'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const R=path.resolve(__dirname,'../../..'),E=require(R+'/js/assessment-engine'),V=require(R+'/js/protocol-validator');
const codes=['00830','00481','00477','00479','00480'],P=Object.fromEntries(codes.map(c=>[c,JSON.parse(fs.readFileSync(path.join(R,'protocols/genitourinary',fs.readdirSync(R+'/protocols/genitourinary').find(f=>f.startsWith(c+'-')))))]));
const cases=[];
function check(code,label,input,yes=[],no=[],action=null){const row={code,label,input,expected:{yes,no,action},citations:yes.map(id=>P[code].rule_engine.rules.find(r=>r.id===id)?.source)};try{assert.deepEqual(V.validate(P[code]).errors,[]);const a=E.assess(P[code],input);assert.deepEqual(a.errors,[]);assert.deepEqual(a.invalid,[]);const ids=a.findings.map(x=>x.ruleId);for(const id of yes)assert(ids.includes(id),'Missing '+id);for(const id of no)assert(!ids.includes(id),'Unexpected '+id);if(action)assert.equal(a.actionType,action);row.pass=true;row.actual={action:a.actionType,ids};}catch(e){row.pass=false;row.error=e.message;}cases.push(row);}
for(const c of codes){
 check(c,'Omitted domains remain unassessed',{},[],['HYPERSENSITIVITY','QT_RISK','PRIOR_STOP']);
 check(c,'Hypersensitivity',{hypersensitivity:true},['HYPERSENSITIVITY'],[],'contraindicated');
 check(c,'Previous permanent stop persists',{prior_permanent_stop:true,qt_risk:false},['PRIOR_STOP'],[],'discontinue');
 for(const f of ['qt_risk','uncontrolled_glucose_or_diabetes','bone_health_not_addressed','cardiovascular_risk_not_addressed','suboptimal_response']){const id={qt_risk:'QT_RISK',uncontrolled_glucose_or_diabetes:'GLUCOSE',bone_health_not_addressed:'BONE_HEALTH',cardiovascular_risk_not_addressed:'CV_RISK',suboptimal_response:'RESPONSE'}[f];check(c,f+' present',{[f]:true},[id]);check(c,f+' absent',{[f]:false},[],[id]);}
}
for(const c of ['00830','00481']){for(const band of ['normal','mild_moderate','severe','dialysis'])check(c,'Renal '+band,{renal_band:band},['severe','dialysis'].includes(band)?['RENAL_SEVERE']:[],['normal','mild_moderate'].includes(band)?['RENAL_SEVERE']:[]);for(const band of ['normal','mild_moderate','severe'])check(c,'Hepatic '+band,{hepatic_band:band},band==='severe'?['HEPATIC_SEVERE']:[],band!=='severe'?['HEPATIC_SEVERE']:[]);}
for(const v of [0,11.99,12,12.01,24])check('00830','Missed-dose boundary '+v,{missed_dose_hours:v},[v<=12?'MISSED_WITHIN12':'MISSED_OVER12'],[v<=12?'MISSED_OVER12':'MISSED_WITHIN12'],v>12?'omit':null);
for(const v of [0,6.99,7,7.01,8,14])check('00830','Interruption boundary '+v,{interruption_days:v},v>7?['RELOAD']:[],v<=7?['RELOAD']:[]);
check('00830','Boolean interruption remains supported',{interruption_over_7_days:true},['RELOAD']);
check('00830','Reload plus inducer requires reconciliation',{interruption_days:8,pgp_strong_cyp3a_inducer_unavoidable:true},['RELOAD','PGP_CYP3A_INDUCER'],[],'consultant_review');
check('00830','Reload cannot override permanent stop',{interruption_days:8,prior_permanent_stop:true},['RELOAD','PRIOR_STOP'],[],'discontinue');
for(const [f,id]of [['oral_pgp_inhibitor_unavoidable','PGP_INHIBITOR'],['pgp_strong_cyp3a_inducer_unavoidable','PGP_CYP3A_INDUCER'],['interacting_medicine_stopped','INTERACTION_STOPPED'],['ongoing_gnrh_depot','ADT_OVERLAP']])check('00830',f,{[f]:true},[id],[],'consultant_review');
for(const v of [0,1,2,3,4])check('00830','ECOG '+v,{ecog:v},v>2?['ECOG']:[],v<=2?['ECOG']:[]);
for(const v of [449.99,450,450.01,500])check('00481','QT source boundary '+v,{qtc_ms:v},v>450?['QT_OVER450']:[],v<=450?['QT_OVER450']:[],v>450?'consultant_review':null);
check('00481','Maintenance timing',{maintenance_before_day28:true},['MAINTENANCE_TIMING']);
for(const c of ['00477','00479','00480']){
 check(c,'Flare plan',{flare_protection_not_reviewed:true},['FLARE_PLAN']);
 check(c,'Source-specific spinal classification',{spinal_cord_compression_or_spinal_mets:true},['SPINAL_SOLE'],[],c==='00479'?'contraindicated':'consultant_review');
 check(c,'Acute compressive symptoms require urgent care',{acute_neurological_or_obstructive_symptoms:true},['URGENT_COMPRESSIVE'],[],'withhold');
 check(c,'Mood review',{depression_or_severe_mood_change:true},['MOOD']);
}
check('00477','Implant bleeding-risk review',{low_bmi_or_full_anticoagulation:true},['INJECTION_BLEED_RISK']);check('00479','Preparation error affects efficacy',{suspected_handling_error:true},['HANDLING_ERROR']);
for(const c of codes){assert.equal(P[c].metadata.validation.clinical_use_authorised,false);assert(!Object.keys(P[c].input_definitions).some(f=>/anc_|platelet|alt_ast|bilirubin_uln/.test(f)));}
const result={release:'0.84.52',date:'2026-11-14',total:cases.length,passed:cases.filter(x=>x.pass).length,cases};fs.writeFileSync(path.join(__dirname,'source-case-results.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({total:result.total,passed:result.passed,failed:cases.filter(x=>!x.pass)}));if(result.passed!==result.total)process.exitCode=1;
