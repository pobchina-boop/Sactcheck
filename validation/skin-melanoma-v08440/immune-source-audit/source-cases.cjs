'use strict';
// Expectations below are authored from retained NCCP00431v11 pp1–9 and00812v3a pp1–6,
// separately from candidate predicates. All cases run the application engine and dose renderer.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=process.env.SACT_TEST_ROOT||path.resolve(__dirname,'../../..'),candidate=process.env.SACT_CANDIDATE_ROOT||root;
const E=require(path.join(root,'js/assessment-engine')),D=require(path.join(root,'js/protocol-dose-schedule')),V=require(path.join(root,'js/protocol-validator')),S=require(path.join(root,'js/source-reconciliation-v0700'));
const baseline=process.argv.includes('--baseline'),manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'sources.json'))),P={},results=[],coverage={},outputs=[];
for(const s of manifest)P[s.code]=JSON.parse(fs.readFileSync(baseline?path.join(__dirname,s.code+'-before.json'):path.join(candidate,s.protocol_path)));
function test(c,name,fn){try{fn();results.push({code:c,name,passed:true});}catch(e){results.push({code:c,name,passed:false,error:e.message});}}
function run(c,x){const r=E.assess(P[c],x);coverage[c]??=new Set();for(const f of r.findings)coverage[c].add(f.ruleId);outputs.push({code:c,input:x,action:r.actionType,complete:r.complete,findings:r.findings.filter(f=>!/^PARTIAL_/.test(f.ruleId)).map(f=>({id:f.ruleId,action:f.action?.type||f.actionType,message:f.action?.message||f.message})),quantified:D.buildModificationModel(P[c],r).rows.filter(x=>x.quantified)});return r;}
function yes(c,name,x,id,type){test(c,name,()=>{const r=run(c,x),f=r.findings.find(f=>f.ruleId===id);assert(f,'Missing '+id);assert.equal(f.action.type,type);assert.deepEqual(f.action.components,c==='00431'?['nivolumab','ipilimumab']:['cemiplimab']);assert.equal(D.buildModificationModel(P[c],r).rows.filter(x=>x.quantified&&!['Not to be administered','Withhold'].includes(x.protocolDose)).length,0,'No percentage/dose reduction for ICI hold');});}
function no(c,name,x,ids){test(c,name,()=>{const r=run(c,x);for(const id of ids)assert(!r.findings.some(f=>f.ruleId===id),'Unexpected '+id);});}
const stop='permanently_discontinue',review='consultant_review',hold='withhold';
for(const c of Object.keys(P)){
 test(c,'Empty assessment never clears treatment',()=>{const r=run(c,{});assert.equal(r.actionType,'incomplete');assert.equal(r.complete,false);});
 test(c,'Protocol validation',()=>{const r=V.validate(P[c]);assert.deepEqual(r.errors,[]);});
 test(c,'Source bytes match SHA',()=>{const s=manifest.find(x=>x.code===c);assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,s.pdf_path))).digest('hex'),s.pdf_sha256);});
 test(c,'Source reconciliation does not replace audited rules',()=>{const p=structuredClone(P[c]),before=JSON.stringify(p.rule_engine.rules);S.apply(p);assert.equal(JSON.stringify(p.rule_engine.rules),before);});
 test(c,'Independent approvals remain false',()=>{for(const f of ['consultant_reviewed','oncology_pharmacy_reviewed','clinical_use_authorised'])assert.equal(P[c].metadata.validation[f],false);});
 test(c,'No omitted input silently normal',()=>{assert.deepEqual(P[c].required_inputs,[]);for(const d of Object.values(P[c].input_definitions))assert.equal(d.required,false);});
 test(c,'All rules carry source page URL',()=>{for(const r of P[c].rule_engine.rules){assert(r.source.page);assert.match(r.source.url,/^https:\/\/healthservice.hse.ie\//);}});
 yes(c,'Known hypersensitivity exclusion',{hypersensitivity:true},'HYPERSENSITIVITY_EXCLUSION','contraindicated');
 yes(c,'ECOG3 outside source range',{ecog:3},'ECOG_OUTSIDE_RANGE',review);no(c,'ECOG2 accepted domain',{ecog:2},['ECOG_OUTSIDE_RANGE']);
 yes(c,'Under18 outside adult indication',{age_years:17},'ADULT_INDICATION',review);no(c,'Age18 boundary',{age_years:18},['ADULT_INDICATION']);
 yes(c,'Baseline suitability unconfirmed',{adequate_baseline_organ_function:false},'BASELINE_FUNCTION_UNCONFIRMED',review);
 yes(c,'PriorPD1 uses guidance review',{prior_pd1_pdl1:true},'PRIOR_PD1_PDL1',review);
 for(const f of ['tsh_miu_l','free_t4_pmol_l','cortisol_nmol_l','glucose_mmol_l','ketones_mmol_l','creatinine_ratio_baseline_or_uln'])yes(c,'Context laboratory '+f,{[f]:1},'LAB_CONTEXT_'+f.toUpperCase(),review);
 for(const band of ['mild','moderate','severe','haemodialysis'])yes(c,'Renal baseline '+band,{renal_impairment_band:band},'BASELINE_RENAL_IMPAIRMENT_BAND',review);
 for(const band of ['mild','moderate','severe'])yes(c,'Hepatic baseline '+band,{hepatic_impairment_band:band},'BASELINE_HEPATIC_IMPAIRMENT_BAND',review);
 for(const x of [{restart_requested:true},{restart_requested:true,source_recovery_complete:false,consultant_restart_approved:true},{restart_requested:true,source_recovery_complete:true,consultant_restart_approved:false}])yes(c,'Restart needs complete recovery and consultant '+JSON.stringify(x),x,'RESTART_UNCONFIRMED',hold);
 no(c,'Confirmed recovery is not a new automatic stop',{restart_requested:true,source_recovery_complete:true,consultant_restart_approved:true},['RESTART_UNCONFIRMED']);
 for(const f of ['pneumonitis_grade','nephritis_grade','rash_grade'])for(const v of ['',null,'bad',-1,5])test(c,'Missing/invalid '+f+' '+JSON.stringify(v),()=>{const r=run(c,{[f]:v});assert.notEqual(r.actionType,'proceed');assert(!r.findings.some(f=>!f.domainAssessment&&!/^PARTIAL_/.test(f.ruleId)&&[stop,hold,'contraindicated'].includes(f.action?.type)));});
}
let c='00431';
yes(c,'Pregnancy is benefit/risk review',{pregnancy:true},'PREGNANCY_REVIEW',review);
yes(c,'Breastfeeding current source scope not false absolute rule',{breastfeeding:true},'BREASTFEEDING_SOURCE_SCOPE',review);
for(const f of ['symptomatic_ild','autoimmune_disease','active_significant_infection','symptomatic_cns_metastases','other_immunosuppression'])yes(c,'Caution '+f,{[f]:true},f.toUpperCase(),review);
for(const n of [9.999,10,10.001]){if(n>10)yes(c,'Steroid caution '+n,{prednisolone_equivalent_mg_day:n},'IMMUNOSUPPRESSIVE_STEROIDS',review);else no(c,'Steroid boundary '+n,{prednisolone_equivalent_mg_day:n},['IMMUNOSUPPRESSIVE_STEROIDS']);}
yes(c,'HCC ChildPugh7 not eligible',{indication_id:'00431b',child_pugh_score:7},'HCC_CHILD_PUGH',review);
for(const ind of ['00431a','00431b'])no(c,'ChildPugh6/no melanoma restriction '+ind,{indication_id:ind,child_pugh_score:6},['HCC_CHILD_PUGH']);
no(c,'Melanoma does not inherit HCC ChildPugh rule',{indication_id:'00431a',child_pugh_score:8},['HCC_CHILD_PUGH']);
yes(c,'HCC indication requirement not met',{indication_id:'00431b',hcc_first_line_unresectable_advanced_not_met:true},'HCC_FIRST_LINE_UNRESECTABLE_ADVANCED_NOT_MET',review);
// Independently transcribed grade table, including combination-followed-by-monotherapy colitis footnote.
for(const [f,hs,ss]of [['pneumonitis_grade',[2],[3,4]],['diarrhoea_colitis_grade',[2],[3,4]],['nephritis_grade',[2,3],[4]],['rash_grade',[3],[4]],['myocarditis_grade',[2],[3,4]],['diabetes_grade',[3],[4]],['adrenal_grade',[2],[3,4]]])for(let g=0;g<=4;g++){
 const x={[f]:g};if(hs.includes(g))yes(c,f+' grade'+g+' hold',x,f.toUpperCase()+'_HOLD',hold);else no(c,f+' grade'+g+' nohold',x,[f.toUpperCase()+'_HOLD']);
 if(ss.includes(g))yes(c,f+' grade'+g+' stop',x,f.toUpperCase()+'_STOP',stop);else no(c,f+' grade'+g+' nostop',x,[f.toUpperCase()+'_STOP']);
}
yes(c,'Follow-on monotherapy grade3 colitis permanently stops',{treatment_phase:'nivolumab_maintenance',diarrhoea_colitis_grade:3},'DIARRHOEA_COLITIS_GRADE_STOP',stop);
for(let g=0;g<=4;g++){
 const x={indication_id:'00431a',hepatitis_grade:g};if(g===2)yes(c,'NonHCC liver G2',x,'HEPATITIS_GRADE_HOLD',hold);else no(c,'NonHCC nohold G'+g,x,['HEPATITIS_GRADE_HOLD']);
 if(g>=3)yes(c,'NonHCC liver stopG'+g,x,'HEPATITIS_GRADE_STOP',stop);else no(c,'NonHCC nostopG'+g,x,['HEPATITIS_GRADE_STOP']);
 no(c,'HCC does not borrow nonHCC grade'+g,{indication_id:'00431b',hepatitis_grade:g},['HEPATITIS_GRADE_HOLD','HEPATITIS_GRADE_STOP']);
}
yes(c,'Liver grade alone requires indication',{hepatitis_grade:3},'HEPATITIS_CONTEXT_MISSING',review);
for(const f of ['thyroid_grade','hypophysitis_grade']){
 for(const g of [2,3]){yes(c,f+' symptomatic G'+g,{[f]:g,endocrine_symptoms:true},f.toUpperCase()+'_HOLD',hold);yes(c,f+' symptoms missing G'+g,{[f]:g},f.toUpperCase()+'_CONTEXT',review);no(c,f+' asymptomatic replacement G'+g,{[f]:g,endocrine_symptoms:false},[f.toUpperCase()+'_HOLD',f.toUpperCase()+'_CONTEXT']);}
 yes(c,f+' G4 stop',{[f]:4},f.toUpperCase()+'_STOP',stop);
}
for(const f of ['sjs_ten_confirmed','immune_severe_recurrence','immune_life_threatening','persistent_grade23_despite_management','unable_taper_steroid_to10'])yes(c,f,{[f]:true},f.toUpperCase(),stop);
yes(c,'SuspectedSJS stops pending confirmation',{sjs_ten_suspected:true},'SJS_TEN_SUSPECTED','discontinue');
yes(c,'OtherG3 first hold',{other_immune_grade:3,other_grade3_recurrent:false},'OTHER_GRADE3_HOLD',hold);
yes(c,'OtherG3 recurrent stop',{other_immune_grade:3,other_grade3_recurrent:true},'OTHER_STOP',stop);
yes(c,'OtherG4 stop',{other_immune_grade:4},'OTHER_STOP',stop);
for(const organ of ['pneumonitis','colitis','hepatitis','nephritis','overlap'])yes(c,organ+' refractory',{[organ+'_worse_despite_steroids']:true},organ.toUpperCase()+'_WORSE_DESPITE_STEROIDS',stop);
yes(c,'Overlap G2 hold',{overlap_syndrome_grade:2},'OVERLAP_HOLD',hold);for(const g of [3,4])yes(c,'Overlap G'+g,{overlap_syndrome_grade:g},'OVERLAP_STOP',stop);
yes(c,'Ungraded cardioneuro red flags urgent hold',{myocarditis_or_neurological_red_flags:true},'MYOCARDITIS_OR_NEUROLOGICAL_RED_FLAGS',hold);
for(const g of [1,2])yes(c,'Infusion G'+g,{infusion_reaction_grade:g},'INFUSION_MILD_MODERATE',review);for(const g of [3,4])yes(c,'Infusion G'+g,{infusion_reaction_grade:g},'INFUSION_SEVERE','discontinue');
yes(c,'Both components held',{other_component_withheld:true},'OTHER_COMPONENT_WITHHELD',hold);
for(const x of [{restart_requested:true,prednisolone_equivalent_mg_day:10.001},{restart_requested:true,other_immunosuppression:true},{restart_requested:true,immunosuppressive_steroid_dose:true}])yes(c,'Restart immune suppression '+JSON.stringify(x),x,'RESTART_IMMUNOSUPPRESSION',hold);
yes(c,'Prior myocarditis review even recovered',{prior_immune_myocarditis:true},'PRIOR_IMMUNE_MYOCARDITIS',review);
for(const f of ['alt_ast_uln_multiple','bilirubin_uln_multiple'])yes(c,'Liver ratio not grade '+f,{[f]:3},'LIVER_SOURCE_CONTEXT_'+f.toUpperCase(),review);
for(const a of ['ast','alt']){
 const bf='baseline_'+a+'_uln_multiple',cf='current_'+a+'_uln_multiple';
 // Each baseline bin and exact lower/current upper boundary; expected hold not computed from candidate.
 for(const [b,v,h]of [[1,3,false],[1,3.001,true],[1,10,true],[1,10.001,false],[1.001,5,false],[1.001,5.001,true],[3,5,false],[3,5.001,true],[3,10,true],[3.001,8,false],[3.001,8.001,true],[5,8,false],[5,8.001,true],[5,10,true],[5,10.001,false]]){
  const x={indication_id:'00431b',[bf]:b,[cf]:v};if(h)yes(c,a+' HCC boundary '+b+'/'+v,x,'HCC_'+a.toUpperCase()+'_HOLD',hold);else no(c,a+' HCC nohold '+b+'/'+v,x,['HCC_'+a.toUpperCase()+'_HOLD']);
 }
 yes(c,a+' HCC missing baseline',{indication_id:'00431b',[cf]:4},'HCC_'+a.toUpperCase()+'_CONTEXT',review);
 yes(c,a+' HCC baseline>5 outside bins',{indication_id:'00431b',[bf]:5.001,[cf]:9},'HCC_'+a.toUpperCase()+'_CONTEXT',review);
 no(c,a+' HCC boundaries not melanoma',{indication_id:'00431a',[bf]:1,[cf]:9},['HCC_'+a.toUpperCase()+'_HOLD']);
 yes(c,a+' >10 stops despite missingbaseline',{indication_id:'00431b',[cf]:10.001},'HCC_LIVER_STOP',stop);
 no(c,a+' exactly10 no permanentstop',{indication_id:'00431b',[cf]:10},['HCC_LIVER_STOP']);
}
yes(c,'HCC combinedASTALT >10 stop',{indication_id:'00431b',alt_ast_uln_multiple:10.001},'HCC_LIVER_STOP',stop);
no(c,'HCC bili3 equality',{indication_id:'00431b',bilirubin_uln_multiple:3},['HCC_LIVER_STOP']);yes(c,'HCC bili>3',{indication_id:'00431b',bilirubin_uln_multiple:3.001},'HCC_LIVER_STOP',stop);
no(c,'Different enzymes not mixed',{indication_id:'00431b',baseline_ast_uln_multiple:5,current_alt_uln_multiple:7},['HCC_ALT_HOLD','HCC_AST_HOLD']);
yes(c,'Combination cycle5 forbidden',{treatment_phase:'combination',cycle_number:5},'COMBINATION_LIMIT',hold);no(c,'Cycle4 combination permitted',{treatment_phase:'combination',cycle_number:4},['COMBINATION_LIMIT']);
for(const sch of ['iv240_q14','sc600_q14','iv480_q28','sc1200_q28']){
 const cut=sch.endsWith('q14')?21:42;for(const days of [cut-.001,cut,cut+.001]){const x={indication_id:'00431a',first_maintenance_dose:true,maintenance_schedule:sch,days_since_last_combination:days};if(days<cut)yes(c,'Melanoma '+sch+' day'+days,x,'MELANOMA_MAINTENANCE_EARLY',hold);else no(c,'Melanoma wait boundary '+sch+' '+days,x,['MELANOMA_MAINTENANCE_EARLY']);}
 for(const days of [20.999,21,21.001]){const x={indication_id:'00431b',first_maintenance_dose:true,maintenance_schedule:sch,days_since_last_combination:days};if(days<21)yes(c,'HCC '+sch+' '+days,x,'HCC_MAINTENANCE_EARLY',hold);else no(c,'HCC no6weekwait '+sch+' '+days,x,['HCC_MAINTENANCE_EARLY','MELANOMA_MAINTENANCE_EARLY']);}
}
yes(c,'First maintenance missing context',{first_maintenance_dose:true},'MAINTENANCE_CONTEXT_MISSING',review);
for(const n of [23.999,24,24.001]){const x={indication_id:'00431b',monotherapy_months:n};if(n>=24)yes(c,'HCC24month limit '+n,x,'HCC_MONOTHERAPY_24_MONTHS',hold);else no(c,'HCC below24months',x,['HCC_MONOTHERAPY_24_MONTHS']);}
no(c,'Melanoma no24month source limit',{indication_id:'00431a',monotherapy_months:25},['HCC_MONOTHERAPY_24_MONTHS']);
for(const [sw,cut]of [['q14_to_q28',14],['q28_to_q14',28]]){for(const n of [cut-.001,cut]){const x={maintenance_schedule_switch:sw,days_since_last_maintenance:n};if(n<cut)yes(c,'Switch '+sw+' '+n,x,'MAINTENANCE_SWITCH_EARLY',hold);else no(c,'Switch exactboundary '+sw,x,['MAINTENANCE_SWITCH_EARLY']);}yes(c,'Switch missing elapsed '+sw,{maintenance_schedule_switch:sw},'MAINTENANCE_SWITCH_CONTEXT',review);}
test(c,'Dose renderer carries five distinct complete prescribed schedules',()=>{const m=D.buildModel(P[c]);assert.equal(m.phases.length,5);assert.deepEqual(m.phases.map(p=>p.components.length),[2,1,1,1,1]);assert.deepEqual(m.phases.map(p=>p.cycleLength),[21,14,28,14,28]);assert(m.phases[0].components.some(x=>/1 mg\/kg/.test(x.dose)));assert(m.phases[0].components.some(x=>/3 mg\/kg/.test(x.dose)));});
test(c,'00431 all grade inputs preserve CTCAEv4 source',()=>{for(const [f,d]of Object.entries(P[c].input_definitions))if(f.endsWith('_grade'))assert.equal(d.ctcae_version,'4.0');});
test(c,'Recovery never overrides permanent stop',()=>assert.equal(run(c,{indication_id:'00431a',hepatitis_grade:3,restart_requested:true,source_recovery_complete:true,consultant_restart_approved:true}).actionType,stop));

c='00812';
for(const f of ['pregnancy','breastfeeding'])yes(c,f+' excluded',{[f]:true},'PREGNANCY_OR_BREASTFEEDING','contraindicated');
for(const f of ['active_significant_infection','active_cns_metastases'])yes(c,f+' excluded',{[f]:true},f.toUpperCase(),'contraindicated');
for(const n of [9.999,10,10.001]){const x={assessment_phase:'baseline',prednisolone_equivalent_mg_day:n};if(n>10)yes(c,'Baseline steroid '+n,x,'BASELINE_IMMUNOSUPPRESSION','contraindicated');else no(c,'Baseline steroid equality '+n,x,['BASELINE_IMMUNOSUPPRESSION']);}
yes(c,'Baseline otherimmunosuppression',{assessment_phase:'baseline',other_immunosuppression:true},'BASELINE_IMMUNOSUPPRESSION','contraindicated');
yes(c,'Steroid setting missing',{prednisolone_equivalent_mg_day:15},'IMMUNOSUPPRESSION_CONTEXT',review);
for(const f of ['cscc_measurable_lesion','cscc_not_curative_surgery_radiation']){yes(c,f+' unmet',{indication_id:'00812b',[f]:false},f.toUpperCase(),review);no(c,f+' not cervical',{indication_id:'00812-gyn',[f]:false},[f.toUpperCase()]);}
yes(c,'Cervical priorplatinum unmet',{indication_id:'00812-gyn',cervical_progressed_after_platinum:false},'CERVICAL_PRIOR_PLATINUM',review);no(c,'CSCC no platinum prerequisite',{indication_id:'00812b',cervical_progressed_after_platinum:false},['CERVICAL_PRIOR_PLATINUM']);
yes(c,'CSCC transplant caution',{indication_id:'00812b',solid_organ_transplant:true},'CSCC_TRANSPLANT_CAUTION',review);no(c,'Cervical no borrowed source context',{indication_id:'00812-gyn',solid_organ_transplant:true},['CSCC_TRANSPLANT_CAUTION']);
for(const [f,hs,ss]of [['pneumonitis_grade',[2],[3,4]],['diarrhoea_colitis_grade',[2,3],[4]],['nephritis_grade',[2],[3,4]]])for(let g=0;g<=4;g++){
 const x={[f]:g};if(hs.includes(g))yes(c,f+' G'+g,x,f.toUpperCase()+'_HOLD',hold);else no(c,f+' noholdG'+g,x,[f.toUpperCase()+'_HOLD']);
 if(ss.includes(g))yes(c,f+' stopG'+g,x,f.toUpperCase()+'_STOP',stop);else no(c,f+' nostopG'+g,x,[f.toUpperCase()+'_STOP']);
}
for(const f of ['pneumonitis_recurrent_grade2','colitis_recurrent_grade3'])yes(c,f,{[f]:true},f.toUpperCase(),stop);
for(const [f,rows]of [['alt_ast_uln_multiple',[[3,false,false],[3.001,true,false],[5,true,false],[5.001,false,true]]],['bilirubin_uln_multiple',[[1.5,false,false],[1.501,true,false],[3,true,false],[3.001,false,true]]]])for(const [v,h,s]of rows){const x={[f]:v};if(h)yes(c,f+' hold '+v,x,'HEPATITIS_HOLD',hold);else no(c,f+' nohold '+v,x,['HEPATITIS_HOLD']);if(s)yes(c,f+' stop '+v,x,'HEPATITIS_STOP',stop);else no(c,f+' nostop '+v,x,['HEPATITIS_STOP']);}
test(c,'Most restrictive liver action wins',()=>assert.equal(run(c,{alt_ast_uln_multiple:4,bilirubin_uln_multiple:3.01}).actionType,stop));
for(const [f,gs]of [['thyroid_grade',[3,4]],['thyroiditis_grade',[3,4]],['hypophysitis_grade',[2,3,4]],['adrenal_grade',[2,3,4]],['diabetes_grade',[3,4]]])for(let g=0;g<=4;g++){
 if(gs.includes(g)){yes(c,f+' unstableG'+g,{[f]:g},f.toUpperCase()+'_HOLD',hold);yes(c,f+' clinicallystableG'+g,{[f]:g,endocrine_clinically_stable:true},f.toUpperCase()+'_STABLE_REVIEW',review);no(c,f+' stable nohold',{[f]:g,endocrine_clinically_stable:true},[f.toUpperCase()+'_HOLD']);}else no(c,f+' lowergrade'+g,{[f]:g},[f.toUpperCase()+'_HOLD']);
 test(c,f+' no genericG4permanentstop '+g,()=>assert.notEqual(run(c,{[f]:g}).actionType,stop));
}
for(const n of [6.999,7,7.001]){const x={rash_grade:2,rash_duration_days:n};if(n>7)yes(c,'Rash>7days '+n,x,'RASH_HOLD',hold);else no(c,'Rash not>7days '+n,x,['RASH_HOLD']);}
yes(c,'Grade3rash holds',{rash_grade:3},'RASH_HOLD',hold);yes(c,'Grade2rash durationmissing',{rash_grade:2},'RASH_DURATION_MISSING',review);yes(c,'Grade4rash stops',{rash_grade:4},'RASH_STOP',stop);
yes(c,'SuspectedSJS holds',{sjs_ten_suspected:true},'SJS_TEN_SUSPECTED',hold);yes(c,'ConfirmedSJS stops',{sjs_ten_confirmed:true},'SJS_TEN_CONFIRMED',stop);
yes(c,'Prioridelalisib grade2 holds',{prior_idelalisib:true,idelalisib_immune_grade:2},'IDELALISIB_HOLD',hold);
for(const g of [3,4]){yes(c,'Idelalisib nonendocrineG'+g,{prior_idelalisib:true,idelalisib_immune_grade:g,idelalisib_event_endocrine:false},'IDELALISIB_STOP',stop);yes(c,'Idelalisib unknown organG'+g,{prior_idelalisib:true,idelalisib_immune_grade:g},'IDELALISIB_CONTEXT',review);no(c,'Idelalisib endocrineexceptionG'+g,{prior_idelalisib:true,idelalisib_immune_grade:g,idelalisib_event_endocrine:true},['IDELALISIB_STOP']);}
yes(c,'Idelalisib recurrentgrade2 stops',{prior_idelalisib:true,idelalisib_grade2_recurrent:true},'IDELALISIB_STOP',stop);
no(c,'No prioridelalisib noextra stop',{prior_idelalisib:false,idelalisib_immune_grade:4,idelalisib_event_endocrine:false},['IDELALISIB_STOP']);
for(const g of [2,3])yes(c,'Other immune hold G'+g,{other_immune_grade:g},'OTHER_HOLD',hold);
yes(c,'OtherG4 nonendocrine stops',{other_immune_grade:4,other_immune_endocrine:false},'OTHER_STOP',stop);no(c,'OtherG4 endocrine exception',{other_immune_grade:4,other_immune_endocrine:true},['OTHER_STOP']);
yes(c,'OtherG3 confirmedstoptype',{other_immune_grade:3,other_grade3_stop_type:true},'OTHER_STOP',stop);
for(const g of [3,4])yes(c,'Other type missingG'+g,{other_immune_grade:g},'OTHER_TYPE_MISSING',review);
for(const f of ['neurological_grade','myocarditis_grade','pericarditis_grade'])for(const g of [3,4])yes(c,f+' grade'+g,{[f]:g},f.toUpperCase()+'_STOP',stop);
for(const f of ['hlh_confirmed','immune_recurrent_grade3'])yes(c,f,{[f]:true},f.toUpperCase(),stop);
for(const g of [2,3])for(const n of [11.999,12,12.001]){const x={persistent_immune_grade:g,persistent_immune_weeks:n,persistent_event_endocrine:false};if(n>=12)yes(c,'PersistentG'+g+' weeks'+n,x,'PERSISTENT_12_WEEK_STOP',stop);else no(c,'Persistent below12weeks '+g,x,['PERSISTENT_12_WEEK_STOP']);}
no(c,'Persistent endocrine exception',{persistent_immune_grade:3,persistent_immune_weeks:13,persistent_event_endocrine:true},['PERSISTENT_12_WEEK_STOP']);yes(c,'Persistent unknown organ',{persistent_immune_grade:3,persistent_immune_weeks:12},'PERSISTENT_TYPE_MISSING',review);
for(const [w,d,s]of [[11.999,20,false],[12,10,false],[12,10.001,true],[12.001,10.001,true]]){const x={steroid_taper_weeks:w,prednisolone_equivalent_mg_day:d};if(s)yes(c,'Taper failure '+w+'/'+d,x,'STEROID_TAPER_12_WEEK_STOP',stop);else no(c,'Taper boundary '+w+'/'+d,x,['STEROID_TAPER_12_WEEK_STOP']);}
for(const g of [1,2])yes(c,'InfusionG'+g+' interrupt',{infusion_reaction_grade:g},'INFUSION_MILD_MODERATE',hold);for(const g of [3,4])yes(c,'InfusionG'+g+' stop',{infusion_reaction_grade:g},'INFUSION_SEVERE',stop);
yes(c,'Restart>10steroid holds',{restart_requested:true,prednisolone_equivalent_mg_day:10.001},'RESTART_STEROID_HOLD',hold);no(c,'Restart at10 no steroidhold',{restart_requested:true,prednisolone_equivalent_mg_day:10},['RESTART_STEROID_HOLD']);
yes(c,'Endocrineexception stabilitymissing',{restart_requested:true,restart_endocrine_exception:true},'RESTART_ENDOCRINE_CONTEXT',hold);no(c,'Endocrinestable steroidexception',{restart_requested:true,restart_endocrine_exception:true,endocrine_clinically_stable:true,prednisolone_equivalent_mg_day:15},['RESTART_STEROID_HOLD','RESTART_ENDOCRINE_CONTEXT']);
for(const f of ['anc','platelets','haemoglobin','acth_result','febrile_neutropenia'])yes(c,'Legacy context '+f,{[f]:f==='febrile_neutropenia'?true:f==='acth_result'?5:2},'LAB_CONTEXT_'+f.toUpperCase(),review);
test(c,'Dose renderer full cemiplimab350mg q21 schedule',()=>{const m=D.buildModel(P[c]);assert.equal(m.phases.length,1);assert.equal(m.phases[0].cycleLength,21);assert.equal(m.phases[0].components[0].dose,'350 mg');});
test(c,'Cervical indication identity preserved and no adjuvantCSCC',()=>{assert(P[c].indications.some(x=>x.indication_id==='00812-gyn'));assert(P[c].indications.some(x=>x.indication_id==='00812b'));assert(!P[c].indications.some(x=>/adjuvant/i.test(x.description)));});

// Explicit restart precedence: a permanent stop wins even if all recovery flags are entered.
test(c,'Recovery cannot override permanent stopping event',()=>assert.equal(run(c,{pneumonitis_recurrent_grade2:true,restart_requested:true,source_recovery_complete:true,consultant_restart_approved:true}).actionType,stop));
yes('00431','New endocrine symptoms reviewed',{new_endocrine_symptoms:true},'NEW_ENDOCRINE_SYMPTOMS',review);
no('00431','HCC eligibility never inherited by melanoma',{indication_id:'00431a',hcc_first_line_unresectable_advanced_not_met:true},['HCC_FIRST_LINE_UNRESECTABLE_ADVANCED_NOT_MET']);
yes('00431','Selected dose phase combination respects four cycle limit',{prescribed_schedule:'combination',cycle_number:5},'COMBINATION_LIMIT',hold);
yes('00431','Dose selection q28 respects melanoma first gap',{prescribed_schedule:'iv480_q28',indication_id:'00431a',first_maintenance_dose:true,days_since_last_combination:21},'MELANOMA_MAINTENANCE_EARLY',hold);
for(const f of ['neurological_grade','myocarditis_grade','pericarditis_grade'])yes('00812',f+' grade2hold',{[f]:2},f.toUpperCase()+'_GRADE2_HOLD',hold);
yes('00812','Other endocrine grade4 needs named pathway',{other_immune_grade:4,other_immune_endocrine:true},'OTHER_ENDOCRINE_CONTEXT',review);
test('00431','Combination hold dose renderer never calculates dose reduction',()=>{const p=P['00431'],r=run('00431',{prescribed_schedule:'combination',nephritis_grade:2}),m=D.buildModificationModel(p,r);assert.equal(m.rows.length,2);assert(m.rows.every(x=>!x.quantified||['Not to be administered','Withhold'].includes(x.protocolDose)));});

const Lab=require(path.join(root,'js/local-lab-profile'));
for(const [target,analyte,uln,rows] of [
 ['alt_ast_uln_multiple','alt',34,[[102,null],[102.034,'HEPATITIS_HOLD'],[170,'HEPATITIS_HOLD'],[170.034,'HEPATITIS_STOP']]],
 ['alt_ast_uln_multiple','ast',42,[[126,null],[126.042,'HEPATITIS_HOLD'],[210,'HEPATITIS_HOLD'],[210.042,'HEPATITIS_STOP']]],
 ['bilirubin_uln_multiple','bilirubin',20,[[30,null],[30.02,'HEPATITIS_HOLD'],[60,'HEPATITIS_HOLD'],[60.02,'HEPATITIS_STOP']]]])for(const [actual,id] of rows)test('00812','Actual '+analyte+' '+actual+' / ULN '+uln,()=>{
 const converted=Lab.calculate(target,{[analyte]:actual},{...Lab.defaults,altUln:34,astUln:42,bilirubinUln:20});assert(Math.abs(converted.ratio-actual/uln)<1e-12);
 const r=run('00812',{[target]:converted.ratio});if(id)assert(r.findings.some(f=>f.ruleId===id));else assert(!r.findings.some(f=>['HEPATITIS_HOLD','HEPATITIS_STOP'].includes(f.ruleId)));
});
for(const a of ['alt','ast'])for(const [base,current,expected] of [[1,3,false],[1,3.001,true],[3,5,false],[3,5.001,true],[4,8,false],[4,8.001,true]])test('00431','Actual matched '+a+' HCC '+base+'/'+current,()=>{
 const ul=a==='alt'?34:42,bf='baseline_'+a+'_uln_multiple',cf='current_'+a+'_uln_multiple';
 assert(Lab.adapterFor({...P['00431'].input_definitions[bf],id:bf}));assert(Lab.adapterFor({...P['00431'].input_definitions[cf],id:cf}));
 const b=Lab.calculate(bf,{[a]:base*ul}),v=Lab.calculate(cf,{[a]:current*ul});const r=run('00431',{indication_id:'00431b',[bf]:b.ratio,[cf]:v.ratio});assert.equal(r.findings.some(f=>f.ruleId==='HCC_'+a.toUpperCase()+'_HOLD'),expected);
});
for(const target of ['alt_ast_uln_multiple','bilirubin_uln_multiple','baseline_ast_uln_multiple','current_ast_uln_multiple','baseline_alt_uln_multiple','current_alt_uln_multiple'])test('both','Missing actual lab value stays missing '+target,()=>assert.equal(Lab.calculate(target,{}),null));
for(const [analyte,setting] of [['alt','altUln'],['ast','astUln'],['bilirubin','bilirubinUln']])for(const invalid of [0,-1,NaN])test('both','Invalid ULN '+setting+' '+invalid,()=>{const target=analyte==='bilirubin'?'bilirubin_uln_multiple':'alt_ast_uln_multiple';const v=Lab.calculate(target,{[analyte]:100},{...Lab.defaults,[setting]:invalid});assert.equal(v.invalid,true);assert(Number.isNaN(v.ratio));});
for(const c of Object.keys(P))if(!baseline)test(c,'Every current rule has a positive executable witness',()=>{const missing=P[c].rule_engine.rules.map(x=>x.rule_id||x.id).filter(x=>!coverage[c]?.has(x));assert.deepEqual(missing,[]);});
const summary={baseline,total:results.length,passed:results.filter(x=>x.passed).length,failed:results.filter(x=>!x.passed).length,coverage:Object.fromEntries(Object.entries(coverage).map(([c,s])=>[c,{witnessed:[...s].filter(x=>P[c].rule_engine.rules.some(r=>(r.rule_id||r.id)===x)),rule_count:P[c].rule_engine.rules.length}])),results};
fs.writeFileSync(path.join(__dirname,baseline?'baseline-results.json':'current-results.json'),JSON.stringify(summary,null,2)+'\n');fs.writeFileSync(path.join(__dirname,baseline?'baseline-outputs.json':'current-outputs.json'),JSON.stringify(outputs,null,2)+'\n');
console.log(JSON.stringify({baseline,total:summary.total,passed:summary.passed,failed:summary.failed,failures:results.filter(x=>!x.passed)},null,2));if(summary.failed&&!baseline)process.exitCode=1;
