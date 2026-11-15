'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const R=path.resolve(__dirname,'../../..'),E=require(R+'/js/assessment-engine'),V=require(R+'/js/protocol-validator');
const specs={'00478':{dose:'3.6 mg',days:28,route:'SC',spinal:'consultant_review'},'00488':{dose:'22.5 mg',days:168,route:'IM',spinal:'consultant_review'},'00489':{dose:'3 mg',days:28,route:'IM',spinal:'consultant_review'},'00490':{dose:'7.5 mg',days:28,route:'SC',spinal:'contraindicated'},'00491':{dose:'45 mg',days:168,route:'SC',spinal:'contraindicated'},'00479':{dose:'22.5 mg',days:84,route:'SC',spinal:'contraindicated'}};
const P=Object.fromEntries(Object.keys(specs).map(c=>[c,JSON.parse(fs.readFileSync(path.join(R,'protocols/genitourinary',fs.readdirSync(R+'/protocols/genitourinary').find(f=>f.startsWith(c+'-')))))]));
const cases=[];
function check(code,label,input,yes=[],no=[],action=null){const row={code,label,input,expected:{yes,no,action},citations:yes.map(id=>P[code].rule_engine.rules.find(r=>r.id===id)?.source)};try{assert.deepEqual(V.validate(P[code]).errors,[]);const a=E.assess(P[code],input);assert.deepEqual(a.errors,[]);assert.deepEqual(a.invalid,[]);const ids=a.findings.map(x=>x.ruleId);for(const id of yes)assert(ids.includes(id),'Missing '+id);for(const id of no)assert(!ids.includes(id),'Unexpected '+id);if(action)assert.equal(a.actionType,action);row.pass=true;row.actual={action:a.actionType,ids};}catch(e){row.pass=false;row.error=e.message;}cases.push(row);}
for(const [c,s]of Object.entries(specs)){
 check(c,'Missing values do not imply hypersensitivity, spinal disease or a previous stop',{},[],['HYPERSENSITIVITY','SPINAL_SOLE','PRIOR_STOP']);
 check(c,'Hypersensitivity excludes treatment',{hypersensitivity:true},['HYPERSENSITIVITY'],[],'contraindicated');
 check(c,'Previous permanent stop remains effective despite recovered domains',{prior_permanent_stop:true,qt_risk:false},['PRIOR_STOP'],[],'discontinue');
 for(const [f,id]of Object.entries({qt_risk:'QT_RISK',uncontrolled_glucose_or_diabetes:'GLUCOSE',bone_health_not_addressed:'BONE_HEALTH',cardiovascular_risk_not_addressed:'CV_RISK',suboptimal_response:'RESPONSE',flare_protection_not_reviewed:'FLARE_PLAN',depression_or_severe_mood_change:'MOOD'})){
  check(c,f+' present',{[f]:true},[id]);check(c,f+' explicitly absent',{[f]:false},[],[id]);
 }
 check(c,'Source distinction between a spinal caution and an exclusion',{spinal_cord_compression_or_spinal_mets:true},['SPINAL_SOLE'],[],s.spinal);
 check(c,'Acute compressive symptoms require urgent assessment',{acute_neurological_or_obstructive_symptoms:true},['URGENT_COMPRESSIVE'],[],'withhold');
 if(c!=='00479'){
  for(const n of [s.days-1,s.days,s.days+1,30,31,182])check(c,'Prescribed interval comparison '+n,{planned_interval_days:n},n===s.days?[]:['INTERVAL_REVIEW'],n===s.days?['INTERVAL_REVIEW']:[],n===s.days?null:'consultant_review');
  check(c,'Wrong formulation or route is held',{formulation_or_route_mismatch:true},['FORMULATION_ROUTE'],[],'withhold');
  check(c,'Confirmed correct route does not raise mismatch',{formulation_or_route_mismatch:false},[],['FORMULATION_ROUTE']);
 }
 assert.equal(P[c].treatment.cycle_length_days,s.days);assert.equal(P[c].treatment.administration[0].dose,s.dose);assert.equal(P[c].treatment.administration[0].route,s.route);
 assert.equal(P[c].metadata.validation.clinical_use_authorised,false);
 assert(!Object.keys(P[c].input_definitions).some(f=>/anc_|platelet|alt_ast|bilirubin_uln/.test(f)),'No transplanted chemotherapy thresholds');
 assert(P[c].metadata.regimen_card.contexts.every(x=>x.cycle_length_days===s.days));
}
for(const c of ['00479','00490','00491']){
 check(c,'Previous orchiectomy is a product exclusion',{previous_orchiectomy:true},['ORCHIECTOMY'],[],'contraindicated');
 check(c,'No orchiectomy does not produce exclusion',{previous_orchiectomy:false},[],['ORCHIECTOMY']);
 check(c,'Incorrectly prepared product must not be administered',{incorrectly_prepared_dose:true},['INCORRECT_PREPARATION'],[],'withhold');
 check(c,'Error after dosing requires response review',{suspected_handling_error:true},['HANDLING_ERROR'],[],'consultant_review');
 check(c,'Serious skin reaction stops further leuprorelin',{severe_blistering_or_mucosal_rash:true,bone_health_not_addressed:true},['SEVERE_SKIN','BONE_HEALTH'],[],'discontinue');
 check(c,'Absent skin reaction does not produce stop',{severe_blistering_or_mucosal_rash:false},[],['SEVERE_SKIN']);
 check(c,'Headache with visual symptoms requires urgent assessment',{severe_headache_or_visual_change:true},['NEURO_URGENT'],[],'withhold');
}
check('00478','Implant bleeding risk',{low_bmi_or_full_anticoagulation:true},['INJECTION_BLEED_RISK']);
check('00488','Product-specific IM haematoma caution',{anticoagulation_or_bleeding_risk:true},['IM_BLEED_REVIEW']);
check('00490','Supply requires pharmacy confirmation',{prescribed_product_supply_uncertain:true},['SUPPLY_REVIEW'],[],'consultant_review');
assert(P['00478'].monitoring.regular[0].includes('regularly'));assert(P['00478'].monitoring.regular[1].includes('clinically indicated'));
const g77=JSON.parse(fs.readFileSync(path.join(R,'protocols/genitourinary/00477-goserelin-10-8mg-q12weeks.json')));assert(g77.monitoring.regular.slice(0,2).every(x=>x.includes('regularly')));
const result={release:'0.84.53',date:'2026-11-14',total:cases.length,passed:cases.filter(x=>x.pass).length,cases};fs.writeFileSync(path.join(__dirname,'source-case-results.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({total:result.total,passed:result.passed,failed:cases.filter(x=>!x.pass)}));if(result.passed!==result.total)process.exitCode=1;
