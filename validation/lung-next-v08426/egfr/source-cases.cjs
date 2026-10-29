'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),H=__dirname,R=path.resolve(H,'../../..'),integrated=process.argv.includes('--integrated'),E=require(path.join(R,'js/assessment-engine')),D=require(path.join(R,'js/protocol-dose-schedule')),V=require(path.join(R,'js/protocol-validator')),A=require('./authoring.json').regimens,rows=[];
const clinical=r=>r.findings.filter(f=>!f.domainAssessment&&!/^PARTIAL_/.test(f.ruleId||''));
const has=(id,type)=>(r,m)=>assert(clinical(r).some(f=>f.ruleId===id&&(!type||f.actionType===type)),`Missing ${id}/${type}: ${clinical(r).map(f=>f.ruleId)}`);
const absent=(...ids)=>r=>assert(!clinical(r).some(f=>ids.includes(f.ruleId)),'Unexpected '+ids);
const noDose=(r,m)=>assert(m.rows.every(x=>!x.quantified),'Unresolved decision must not calculate a dose');
function structure(code,name,fn){try{fn();rows.push({code,name,pass:true});}catch(e){rows.push({code,name,pass:false,error:e.message});}}
for(const [code,drug] of [['00219','erlotinib'],['00220','gefitinib']]){
 const erlo=code==='00219',p=JSON.parse(fs.readFileSync(path.join(integrated?path.join(R,'protocols/lung'):path.join(H,'proposed'),`${code}-${drug}-monotherapy.json`))),a=A[code];
 function run(name,input,check){const row={code,name,input,source:p.metadata.source_url};try{const r=E.assess(p,input),m=D.buildModificationModel(p,r);assert.deepEqual(r.errors,[]);assert.deepEqual(r.invalid,[]);assert.notEqual(r.actionType,'proceed');check(r,m);row.pass=true;row.actual={action:r.actionType,findings:clinical(r).map(f=>({id:f.ruleId,type:f.actionType})),doses:m.rows.map(x=>({component:x.componentId,action:x.actionType,display:x.protocolDose,quantified:x.quantified}))};}catch(e){row.pass=false;row.error=e.message;}rows.push(row);}
 run('Blank is incomplete',{},r=>assert.equal(r.actionType,'incomplete'));
 for(const f of Object.keys(p.input_definitions))for(const v of [null,''])run(`${f}: missing ${v}`,{[f]:v},r=>assert.equal(clinical(r).length,0));
 const booleans=[['hypersensitivity','HYPERSENSITIVITY','contraindicated'],['pregnancy','PREGNANCY_BREASTFEEDING',erlo?'consultant_review':'contraindicated'],['breastfeeding','PREGNANCY_BREASTFEEDING',erlo?'consultant_review':'contraindicated'],['ild_suspected','ILD_SUSPECTED','withhold'],['ild_confirmed','ILD_CONFIRMED','permanently_discontinue'],['severe_liver_changes','SEVERE_LIVER_CHANGES',erlo?'withhold':'consultant_review'],['keratitis_symptoms','KERATITIS_REVIEW','consultant_review'],['ulcerative_keratitis_confirmed','ULCERATIVE_KERATITIS','withhold'],['gi_perforation_confirmed','GI_PERFORATION',erlo?'permanently_discontinue':'withhold'],['severe_blistering_skin','SEVERE_SKIN','withhold'],['cyp_interaction','CYP_INTERACTION','consultant_review'],['acid_suppressing_medicine','ACID_SUPPRESSION','consultant_review'],['warfarin','WARFARIN_MONITORING','consultant_review']];
 for(const[f,id,type]of booleans)for(const v of[true,false])run(f+' '+v,{[f]:v},v?has(id,type):absent(id));
 for(const n of[0,1,2,3,4]){
  run('ECOG '+n,{ecog:n},n>(erlo?3:2)?has('ECOG_OUTSIDE_USUAL_RANGE'):absent('ECOG_OUTSIDE_USUAL_RANGE'));
  for(const f of['diarrhoea_grade','rash_grade'])run(f+' '+n,{[f]:n},n>=3?has(f==='diarrhoea_grade'?'TARGET_DIARRHOEA_G3':'TARGET_RASH_G3','consultant_review'):absent('TARGET_DIARRHOEA_G3','TARGET_RASH_G3'));
  run('Pneumonitis grade is suspicion not diagnosis '+n,{pneumonitis_grade:n},r=>{(n>0?has('ILD_SUSPECTED','withhold'):absent('ILD_SUSPECTED'))(r);absent('ILD_CONFIRMED')(r);});
  run('Confirmed ILD at any recorded grade '+n,{pneumonitis_grade:n,ild_confirmed:true},(r,m)=>{has('ILD_CONFIRMED','permanently_discontinue')(r);assert.equal(r.actionType,'permanently_discontinue');assert(m.rows.some(x=>x.componentId===drug&&x.protocolDose==='Not to be administered'));});
 }
 for(const f of['alt_ast_uln_multiple','bilirubin_uln_multiple'])for(const n of[0,1,1.001,5,5.001,10])run(`${f} ${n}`,{[f]:n},(r,m)=>{(n>1?has('LIVER_RESULTS_CONTEXT'):absent('LIVER_RESULTS_CONTEXT'))(r);absent('TARGET_HEPATITIS','OF590_00219_ERLO_HEP')(r);noDose(r,m);});
 run('Severe clinical liver changes survive normal lab alias',{severe_liver_changes:true,alt_ast_uln_multiple:1},has('SEVERE_LIVER_CHANGES'));
 run('False suspicion does not erase confirmed ILD',{ild_suspected:false,ild_confirmed:true},has('ILD_CONFIRMED'));
 run('Negative confirmation does not erase symptoms',{ild_suspected:true,ild_confirmed:false},has('ILD_SUSPECTED'));
 for(const n of[0,14.999,15,15.001,19.999,20,20.001,30,90])run('CrCl '+n,{crcl_ml_min:n},erlo?(n<15?has('OF590_00219_ERLO_RENAL','contraindicated'):absent('OF590_00219_ERLO_RENAL')):(n<=20?has('GEFI_RENAL_CAUTION'):absent('GEFI_RENAL_CAUTION')));
 for(const v of[true,false])run('EGFR confirmed '+v,{egfr_validated_positive:v},v?absent('EGFR_NOT_CONFIRMED'):has('EGFR_NOT_CONFIRMED'));
 for(const ind of p.indications)run('In-scope indication '+ind.indication_id,{indication_id:ind.indication_id},absent('INDICATION_SCOPE'));
 run('Outside indication',{indication_id:'outside_scope'},has('INDICATION_SCOPE'));
 if(erlo){
  for(const g of[2,3,4])for(const h of[0,23.999,24,24.001,48])for(const response of[true,false])run(`Diarrhoea grade ${g}, hours ${h}, unresponsive ${response}`,{diarrhoea_grade:g,diarrhoea_unresponsive:response,diarrhoea_unresponsive_hours:h},r=>{(g===3&&h>=24&&response?has('ERLO_DIARRHOEA_G3_24H','withhold'):absent('ERLO_DIARRHOEA_G3_24H'))(r);(g===4&&h>24&&response?has('ERLO_DIARRHOEA_G4_GT24H','discontinue'):absent('ERLO_DIARRHOEA_G4_GT24H'))(r);});
  for(const input of[{diarrhoea_grade:3,diarrhoea_unresponsive_hours:24},{diarrhoea_grade:4,diarrhoea_unresponsive:true}])run('Incomplete duration/response context '+JSON.stringify(input),input,absent('ERLO_DIARRHOEA_G3_24H','ERLO_DIARRHOEA_G4_GT24H'));
  for(const v of[true,false])run('Grade zero recovery '+v,{toxicity_episode_held:true,diarrhoea_recovered_grade0:v},has(v?'ERLO_RESTART':'ERLO_NOT_RECOVERED',v?'consultant_review':'withhold'));
  for(const dose of[150,100,50])run('Restart no automatic lower dose '+dose,{current_daily_dose_mg:dose,toxicity_episode_held:true,diarrhoea_recovered_grade0:true},noDose);
  run('Dehydration independently holds',{diarrhoea_grade:1,diarrhoea_dehydration:true},has('DIARRHOEA_DEHYDRATION','withhold'));
  run('Legacy renal low alias',{targeted_renal_band:'lt15'},has('OF590_00219_ERLO_RENAL'));
  run('Normal renal alias cannot erase low number',{targeted_renal_band:'ge15',crcl_ml_min:14},has('OF590_00219_ERLO_RENAL'));
  run('Normal numeric cannot erase low alias',{targeted_renal_band:'lt15',crcl_ml_min:90},has('OF590_00219_ERLO_RENAL'));
  run('Legacy severe liver alias',{targeted_hepatic_band:'severe',alt_ast_uln_multiple:1},has('OF590_00219_ERLO_HEP'));
  run('Current smoker no dose escalation',{current_smoker:true},(r,m)=>{has('SMOKING_REVIEW')(r);noDose(r,m);});
  run('Uncontrolled toxicity review',{grade3_4_uncontrolled:true},has('UNCONTROLLED_G3_4'));
  run('Dialysis context',{dialysis:true},has('DIALYSIS_CONTEXT'));
 }else{
  for(const v of[true,false])run('Poor tolerance '+v,{poorly_tolerated_diarrhoea_skin:v},v?has('GEFI_TOXICITY_HOLD','withhold'):absent('GEFI_TOXICITY_HOLD'));
  for(const h of[0,13.999,14,14.001,21])run('Hold length '+h,{toxicity_episode_held:true,interruption_days:h},h>14?has('GEFI_HOLD_GT14'):absent('GEFI_HOLD_GT14'));
  run('Intolerant after hold',{toxicity_episode_held:true,tolerates_after_interruption:false},has('GEFI_INTOLERANT_AFTER_HOLD','discontinue'));
  run('Intolerance without prior hold does not infer failed restart',{tolerates_after_interruption:false},absent('GEFI_INTOLERANT_AFTER_HOLD'));
  run('Recovered review no numeric restart',{toxicity_episode_held:true,recovered_for_restart:true},(r,m)=>{has('GEFI_RESTART_REVIEW')(r);noDose(r,m);});
  run('Hepatic B/C source conflict no automatic 125mg',{targeted_hepatic_band:'B_C'},(r,m)=>{has('OF590_00220_GEF_HEP_BC','consultant_review')(r);noDose(r,m);});
  run('Hepatic metastases/A no imposed reduction',{targeted_hepatic_band:'none_metastases_A'},absent('OF590_00220_GEF_HEP_BC'));
  run('Legacy dialysis alias',{targeted_renal_band:'dialysis'},has('GEFI_RENAL_CAUTION'));
  run('Dialysis boolean',{dialysis:true,crcl_ml_min:90},has('GEFI_RENAL_CAUTION'));
  run('Low CrCl survives normal renal alias',{targeted_renal_band:'non_dialysis',crcl_ml_min:20},has('GEFI_RENAL_CAUTION'));
  run('Conflicts cannot erase hold',{targeted_hepatic_band:'B_C',poorly_tolerated_diarrhoea_skin:true},(r,m)=>{has('GEFI_TOXICITY_HOLD')(r);has('OF590_00220_GEF_HEP_BC')(r);assert.equal(r.actionType,'withhold');noDose(r,m);});
 }
 structure(code,'Schema valid',()=>assert.equal(V.validate(p).valid,true));
 structure(code,'Continuous targeted oral route',()=>{assert.equal(a.route,'oral');assert.equal(a.patient.service_kind,'targeted');assert.equal(a.patient.cycle_days,null);assert.equal(p.treatment.cycle_length_days,null);assert.equal(p.treatment_phases[0].administration[0].route,'PO');assert.deepEqual(a.patient.evidence.metrics,[]);});
 structure(code,'Every indication has separate card context',()=>assert.deepEqual(a.card_contexts.map(x=>x.indication_id),p.indications.map(x=>x.indication_id)));
 structure(code,'All source_ids resolve',()=>{const ids=new Set(a.patient.sources.map(x=>x.id));function walk(o){if(!o||typeof o!=='object')return;for(const[k,v]of Object.entries(o)){if(k==='source_ids')for(const id of v)assert(ids.has(id),id);else walk(v);}}walk(a);});
 structure(code,'No borrowed afatinib content',()=>assert(!/afatinib|lux-lung|40 mg|10 mg steps|P-gp inhibitors|heart-pumping test/i.test(JSON.stringify(a))));
 structure(code,'Independent approvals remain false',()=>{for(const k of['consultant_reviewed','oncology_pharmacy_reviewed','clinical_use_authorised'])assert.equal(p.metadata.validation[k],false);});
 structure(code,'No required inputs',()=>assert.deepEqual(p.required_inputs,[]));
 structure(code,'Support plan only selected oral medicine',()=>{assert.deepEqual(a.support_plans[0].active_drugs,[drug]);assert.deepEqual(a.support_plans[0].medicines,[]);assert.equal(a.risk.level,'oral_minimal_low');});
}
const report={release:'0.84.26',mode:integrated?'integrated':'proposed',date:'2026-10-29',total:rows.length,passed:rows.filter(x=>x.pass).length,failed:rows.filter(x=>!x.pass).length,cases:rows};fs.writeFileSync(path.join(H,integrated?'source-case-results-integrated.json':'source-case-results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({mode:report.mode,total:report.total,passed:report.passed,failed:report.failed,failures:rows.filter(x=>!x.pass)},null,2));process.exitCode=report.failed?1:0;
