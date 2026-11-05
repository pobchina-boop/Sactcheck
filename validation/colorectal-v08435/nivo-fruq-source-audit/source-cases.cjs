'use strict';
// Expected results are independently authored from retained NCCP tables / explicitly named EMA supplement.
// No clinical expected action is generated from protocol rule predicates.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..'),E=require(path.join(root,'js/assessment-engine')),D=require(path.join(root,'js/protocol-dose-schedule')),S=require(path.join(root,'js/source-reconciliation-v0700'));
const baseline=process.argv.includes('--baseline'),manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'sources.json'))),P={};
for(const s of manifest.filter(s=>s.code))P[s.code]=JSON.parse(fs.readFileSync(baseline?path.join(__dirname,s.code+'-before.json'):path.join(root,s.protocol_path)));
const results=[],coverage={};
function test(c,name,fn){try{fn();results.push({protocol:c,name,passed:true});}catch(e){results.push({protocol:c,name,passed:false,error:e.message});}}
function run(c,x){const r=E.assess(P[c],x);coverage[c]??=new Set();for(const f of r.findings)coverage[c].add(f.ruleId);return r;}
function yes(c,name,x,id,type){test(c,name,()=>{const r=run(c,x),f=r.findings.find(f=>f.ruleId===id);assert(f,'Missing '+id);if(type)assert.equal(f.action.type,type);assert.deepEqual(f.action.components,c==='00890'?['fruquintinib']:['nivolumab','ipilimumab']);assert.equal(r.complete,false);});}
function no(c,name,x,ids){test(c,name,()=>{const r=run(c,x);for(const id of ids)assert(!r.findings.some(f=>f.ruleId===id),'Unexpected '+id);});}
const perm='permanently_discontinue';
for(const c of Object.keys(P)){
 test(c,'Empty form is incomplete, not clearance',()=>{const r=run(c,{});assert.equal(r.actionType,'incomplete');assert.equal(r.complete,false);});
 test(c,'Source-specific rules survive legacy reconciliation unchanged',()=>{const p=JSON.parse(JSON.stringify(P[c])),before=JSON.stringify(p.rule_engine.rules);S.apply(p);assert.equal(JSON.stringify(p.rule_engine.rules),before);});
 test(c,'Each rule has a source URL and page',()=>{for(const r of P[c].rule_engine.rules){assert.match(r.source.url,/^https:\/\//);assert(r.source.page);}});
 test(c,'Independent review and authority remain pending',()=>{const v=P[c].metadata.validation;assert.equal(v.consultant_reviewed,false);assert.equal(v.oncology_pharmacy_reviewed,false);assert.equal(v.clinical_use_authorised,false);});
 test(c,'No omitted values defaulted as required/normal',()=>{assert.deepEqual(P[c].required_inputs,[]);for(const x of Object.values(P[c].input_definitions))assert.equal(x.required,false);});
 for(const f of ['hypersensitivity','pregnancy','breastfeeding'])yes(c,f+' source exclusion',{[f]:true},f==='hypersensitivity'?'HYPERSENSITIVITY_EXCLUSION':'PREGNANCY_OR_BREASTFEEDING','contraindicated');
 for(const n of [0,1])no(c,'ECOG '+n+' within range',{ecog:n},['ECOG_OUTSIDE_USUAL_SOURCE_RANGE']);
 yes(c,'ECOG3 outside range',{ecog:3},'ECOG_OUTSIDE_USUAL_SOURCE_RANGE','consultant_review');
 const samples=c==='00890'?['proteinuria_g_24h','haemorrhage_grade','liver_toxicity_grade','ppes_grade']:['pneumonitis_grade','hepatitis_grade','nephritis_grade','adrenal_grade'];
 for(const field of samples)for(const v of ['',null,'invalid',-1])test(c,field+' invalid/missing not clearance '+JSON.stringify(v),()=>{const r=run(c,{[field]:v});assert.notEqual(r.actionType,'proceed');assert(!r.findings.some(f=>!f.domainAssessment&&!/^PARTIAL_/.test(f.ruleId)&&['withhold',perm,'contraindicated'].includes(f.actionType)));});
}
for(const c of ['00551','00900']){
 const ind=c==='00551'?'00551a':'00900a';
 if(c==='00900')yes(c,'ECOG2 exceeds first-line range',{ecog:2},'ECOG_OUTSIDE_USUAL_SOURCE_RANGE','consultant_review');else no(c,'ECOG2 allowed in CRC',{ecog:2,indication_id:ind},['ECOG_OUTSIDE_USUAL_SOURCE_RANGE','MELANOMA_ECOG']);
 for(const f of ['dmmr_msih_confirmed','crc_histology_confirmed',c==='00551'?'crc_prior_fluoropyrimidine_combination':'crc_first_line']){
  yes(c,'CRC requirement false '+f,{indication_id:ind,[f]:false},'ELIGIBILITY_'+f.toUpperCase(),'consultant_review');
  no(c,'CRC requirement confirmed '+f,{indication_id:ind,[f]:true},['ELIGIBILITY_'+f.toUpperCase()]);
  no(c,'Missing CRC requirement not assumed false '+f,{indication_id:ind},['ELIGIBILITY_'+f.toUpperCase()]);
 }
 for(const [f,t]of [['symptomatic_ild','contraindicated'],['autoimmune_disease','consultant_review'],['active_significant_infection','consultant_review'],['symptomatic_cns_metastases','consultant_review'],['other_immunosuppression','consultant_review'],['prior_pd1_pdl1','consultant_review']])yes(c,f+' source action',{[f]:true},f.toUpperCase(),t);
 for(const n of [0,9.999,10])no(c,'Steroid dose not >10 '+n,{prednisolone_equivalent_mg_day:n},['IMMUNOSUPPRESSIVE_STEROIDS']);
 yes(c,'Steroid dose >10',{prednisolone_equivalent_mg_day:10.001},'IMMUNOSUPPRESSIVE_STEROIDS','consultant_review');
 // Manual source action table: grade rows from NCCP00551 pp6-10 /00900 pp4-5.
 for(const [field,hold,stop]of [['pneumonitis_grade',[2],[3,4]],['diarrhoea_colitis_grade',[2],[3,4]],['hepatitis_grade',[2],[3,4]],['nephritis_grade',[2,3],[4]],['rash_grade',[3],[4]],['myocarditis_grade',[2],[3,4]],['diabetes_grade',[3],[4]]]){
  for(const grade of [0,1,2,3,4]){
   const x={[field]:grade};if(hold.includes(grade))yes(c,field+' G'+grade+' hold',x,field.toUpperCase()+'_HOLD','withhold');
   else no(c,field+' G'+grade+' no hold row',x,[field.toUpperCase()+'_HOLD']);
   if(stop.includes(grade))yes(c,field+' G'+grade+' permanent stop',x,field.toUpperCase()+'_STOP',perm);
   else no(c,field+' G'+grade+' no stop row',x,[field.toUpperCase()+'_STOP']);
  }
 }
 yes(c,'Maintenance grade3 colitis also permanently stops',{treatment_phase:'nivolumab_maintenance',diarrhoea_colitis_grade:3},'DIARRHOEA_COLITIS_GRADE_STOP',perm);
 for(const [f,hold,stop]of [['thyroid_grade',[2,3],[4]],['hypophysitis_grade',[2,3],[4]],['adrenal_grade',[2],[3,4]]]){
  for(const g of hold){
   yes(c,f+' symptomatic G'+g,{[f]:g,endocrine_symptoms:true},f.toUpperCase()+'_HOLD','withhold');
   no(c,f+' replacement only asymptomatic G'+g,{[f]:g,endocrine_symptoms:false},[f.toUpperCase()+'_HOLD',f.toUpperCase()+'_CONTEXT']);
   yes(c,f+' omitted symptoms not assumed absent G'+g,{[f]:g},f.toUpperCase()+'_CONTEXT','consultant_review');
  }
  for(const g of stop)yes(c,f+' permanent stop G'+g,{[f]:g},f.toUpperCase()+'_STOP',perm);
 }
 for(const f of ['sjs_ten_confirmed','immune_severe_recurrence','immune_life_threatening','persistent_grade23_despite_management','unable_taper_steroid_to10'])yes(c,f+' permanent stop',{[f]:true},f.toUpperCase(),perm);
 yes(c,'Other first grade3 holds',{other_immune_grade:3,other_grade3_recurrent:false},'OTHER_GRADE3_HOLD','withhold');
 yes(c,'Other recurrent grade3 stops',{other_immune_grade:3,other_grade3_recurrent:true},'OTHER_STOP',perm);
 yes(c,'Other grade4 stops',{other_immune_grade:4},'OTHER_STOP',perm);
 for(const organ of ['pneumonitis','colitis','hepatitis','nephritis'])yes(c,organ+' refractory to steroids',{[organ+'_worse_despite_steroids']:true},organ.toUpperCase()+'_WORSE_DESPITE_STEROIDS',perm);
 yes(c,'Cardiac neurological red flag holds before grading',{myocarditis_or_neurological_red_flags:true},'ICI_CARDIAC_NEURO_RED_FLAGS','withhold');
 for(const n of [1,2])yes(c,'Infusion mild/moderate '+n,{infusion_reaction_grade:n},'INFUSION_MILD_MODERATE','consultant_review');
 for(const n of [3,4])yes(c,'Infusion severe stops infusion '+n,{infusion_reaction_grade:n},'INFUSION_SEVERE','discontinue');
 yes(c,'Hold both combination components',{other_component_withheld:true},'BOTH_COMPONENTS_HOLD','withhold');
 for(const x of [{restart_requested:true},{restart_requested:true,source_recovery_complete:false,consultant_restart_approved:true},{restart_requested:true,source_recovery_complete:true,consultant_restart_approved:false}])yes(c,'Restart unconfirmed '+JSON.stringify(x),x,'RESTART_UNCONFIRMED','withhold');
 no(c,'Confirmed recovery does not add pending guard',{restart_requested:true,source_recovery_complete:true,consultant_restart_approved:true},['RESTART_UNCONFIRMED']);
 for(const n of [10.001,25])yes(c,'Restart during steroid immunosuppression '+n,{restart_requested:true,prednisolone_equivalent_mg_day:n},'RESTART_IMMUNOSUPPRESSION','withhold');
 yes(c,'Restart during other immunosuppression',{restart_requested:true,other_immunosuppression:true},'RESTART_IMMUNOSUPPRESSION','withhold');
 yes(c,'Immunosuppressive clinical steroid context',{restart_requested:true,immunosuppressive_steroid_dose:true},'RESTART_STEROID_CONTEXT','withhold');
 test(c,'Recovery does not override permanent stop',()=>assert.equal(run(c,{restart_requested:true,source_recovery_complete:true,consultant_restart_approved:true,diarrhoea_colitis_grade:3}).actionType,perm));
 for(const [f,v]of [['tsh_miu_l',1],['free_t4_pmol_l',14],['cortisol_nmol_l',300],['glucose_mmol_l',6],['ketones_mmol_l',.2],['creatinine_ratio_baseline_or_uln',1]])yes(c,'Retained lab context '+f,{[f]:v},'LAB_CONTEXT_'+f.toUpperCase(),'consultant_review');
 for(const f of ['alt_ast_uln_multiple','bilirubin_uln_multiple'])for(const n of [1,3,5.001]){
  yes(c,'Single liver ratio requests grade '+f+' '+n,{[f]:n},'LAB_GRADE_REVIEW_'+f.toUpperCase(),'consultant_review');
  no(c,'Single ratio does not invent immune grade '+f+' '+n,{[f]:n},['HEPATITIS_GRADE_HOLD','HEPATITIS_GRADE_STOP']);
 }
 for(const n of [0,20.999])yes(c,'CRC first maintenance before21d '+n,{indication_id:ind,first_maintenance_dose:true,days_since_last_combination:n},'CRC_MAINTENANCE_EARLY','withhold');
 for(const n of [21,21.001])no(c,'CRC first maintenance21d boundary '+n,{indication_id:ind,first_maintenance_dose:true,days_since_last_combination:n},['CRC_MAINTENANCE_EARLY']);
 yes(c,'Do not continue combination into cycle5',{treatment_phase:'combination',cycle_number:5},'COMBINATION_LIMIT','withhold');
 for(const x of [{treatment_phase:'combination',cycle_number:4},{treatment_phase:'nivolumab_maintenance',cycle_number:5}])no(c,'Phase limit does not stop valid phase '+JSON.stringify(x),x,['COMBINATION_LIMIT']);
 test(c,'ICI holds never generate percentage dose reduction',()=>assert(!D.buildModificationModel(P[c],run(c,{nephritis_grade:3})).rows.some(x=>x.quantified)));
 test(c,'Grade UI uses source-specific v4 rather than generic v5 descriptors',()=>{for(const [f,d]of Object.entries(P[c].input_definitions))if(/grade/.test(f)&&d.type==='select'){assert.equal(d.ctcae_version,'4.0');assert.match(d.grading_source_label,/CTCAE v4.0/);assert.match(d.grading_source_url,/healthservice.hse.ie/);}});
}
for(const b of ['severe','haemodialysis'])yes('00551','551 renal '+b,{renal_impairment_band:b},'SEVERE_RENAL_REVIEW','consultant_review');
for(const b of ['normal','mild','moderate'])no('00551','551 renal no severe flag '+b,{renal_impairment_band:b},['SEVERE_RENAL_REVIEW']);
for(const n of [4.999,5,5.001]){const x={baseline_alt_ast_uln:n};if(n>=5)yes('00551','551 ipi liver >=5 '+n,x,'HEPATIC_CAUTION','consultant_review');else no('00551','551 ipi liver below5',x,['HEPATIC_CAUTION']);}
for(const n of [1.5,1.5001,3,3.001]){const x={baseline_bilirubin_uln:n};if(n>1.5)yes('00551','551 nivo liver >1.5 '+n,x,'HEPATIC_CAUTION','consultant_review');else no('00551','551 bili equality',x,['HEPATIC_CAUTION']);}
for(const b of ['moderate','severe'])yes('00551','551 baseline hepatic '+b,{hepatic_impairment_band:b},'HEPATIC_CAUTION','consultant_review');
for(const b of ['mild','moderate','severe','haemodialysis'])yes('00900','900 no automatic renal reduction '+b,{renal_impairment_band:b},'BASELINE_ORGAN_REVIEW','consultant_review');
for(const b of ['mild','moderate','severe'])yes('00900','900 hepatic table '+b,{hepatic_impairment_band:b},'BASELINE_ORGAN_REVIEW','consultant_review');
yes('00551','Melanoma ECOG2 needs review',{indication_id:'00551b-skin',ecog:2},'MELANOMA_ECOG','consultant_review');
for(const f of ['rcc_clear_cell_confirmed','rcc_intermediate_poor_imdc']){yes('00551','RCC requirement '+f,{indication_id:'00551-gu',[f]:false},f.toUpperCase(),'consultant_review');no('00551','CRC does not inherit RCC criterion '+f,{indication_id:'00551a',[f]:false},[f.toUpperCase()]);}
for(const [f,t]of [['rcc_prior_systemic_advanced','contraindicated'],['rcc_cardiac_dysrhythmia_qtc','consultant_review'],['rcc_bp_poorly_controlled','consultant_review']]){yes('00551','RCC-specific '+f,{indication_id:'00551-gu',[f]:true},f.toUpperCase(),t);no('00551','CRC free from RCC-specific '+f,{indication_id:'00551a',[f]:true},[f.toUpperCase()]);}
yes('00551','Overlap G2 hold',{overlap_syndrome_grade:2},'OVERLAP_HOLD','withhold');for(const n of [3,4])yes('00551','Overlap G'+n+' stop',{overlap_syndrome_grade:n},'OVERLAP_STOP',perm);
yes('00551','Overlap refractory stops',{overlap_worse_despite_steroids:true},'OVERLAP_REFRACTORY',perm);
yes('00551','CRC cannot borrow IV480',{indication_id:'00551a',maintenance_schedule:'iv480_q28'},'CRC_IV480_NOT_SOURCE','consultant_review');
for(const sch of ['iv240_q14','sc600_q14','sc1200_q28'])no('00551','CRC permitted '+sch,{indication_id:'00551a',maintenance_schedule:sch},['CRC_IV480_NOT_SOURCE']);
no('00551','RCC IV480 separate indication',{indication_id:'00551-gu',maintenance_schedule:'iv480_q28'},['CRC_IV480_NOT_SOURCE']);
for(const sch of ['iv240_q14','sc600_q14','iv480_q28','sc1200_q28']){const cut=sch.endsWith('q14')?21:42;for(const n of [cut-.001,cut,cut+.001]){const x={indication_id:'00551-gu',first_maintenance_dose:true,maintenance_schedule:sch,days_since_last_combination:n};if(n<cut)yes('00551','RCC first '+sch+' '+n,x,'OTHER_MAINTENANCE_EARLY','withhold');else no('00551','RCC boundary '+sch+' '+n,x,['OTHER_MAINTENANCE_EARLY']);}}
for(const sch of ['sc600_q14','sc1200_q28'])yes('00900','900 does not borrow SC '+sch,{maintenance_schedule:sch},'SC_OUTSIDE_00900','consultant_review');
for(const n of [23.999,24,24.001]){if(n>=24)yes('00900','24month maximum '+n,{treatment_months:n},'MAX_24_MONTHS','withhold');else no('00900','Below24months',{treatment_months:n},['MAX_24_MONTHS']);}
const c='00890';
for(const f of ['prior_standard_therapies','progressed_or_intolerant_lonsurf_or_regorafenib'])yes(c,'Prior therapy requirement '+f,{[f]:false},f.toUpperCase(),'consultant_review');
for(const f of ['uncontrolled_hypertension','thromboembolism_within6months','stroke_tia_within12months'])yes(c,'Source exclusion '+f,{[f]:true},f.toUpperCase(),'contraindicated');
for(const n of [5,4,3]){const x={current_fruquintinib_dose_mg:n,reduction_required_now:true};if(n===3)yes(c,'3mg floor',x,'DOSE_FLOOR',perm);else no(c,'Not below dose floor '+n,x,['DOSE_FLOOR']);}
yes(c,'Persistent G3HTN',{hypertension_grade:3,hypertension_persistent_despite_treatment:true},'HYPERTENSION_G3','withhold');
yes(c,'G3HTN context missing',{hypertension_grade:3},'HYPERTENSION_G3_CONTEXT','withhold');
no(c,'G3HTN persistence explicitly absent',{hypertension_grade:3,hypertension_persistent_despite_treatment:false},['HYPERTENSION_G3','HYPERTENSION_G3_CONTEXT']);
yes(c,'G4HTN stops',{hypertension_grade:4},'HYPERTENSION_G4',perm);
for(const f of ['systolic_bp_mmhg','diastolic_bp_mmhg'])yes(c,'BP needs grade '+f,{[f]:100},'BP_REVIEW_'+f.toUpperCase(),'consultant_review');
for(const n of [0,1,2,3,4]){const x={haemorrhage_grade:n};if(n===2)yes(c,'BleedG2',x,'BLEED_G2','withhold');else no(c,'Bleed notG2 '+n,x,['BLEED_G2']);if(n>=3)yes(c,'BleedG'+n+' stops',x,'BLEED_G3_4',perm);else no(c,'Bleed belowG3 '+n,x,['BLEED_G3_4']);}
for(const n of [0,.999,1,1.999,2,2.001]){const x={proteinuria_g_24h:n};if(n>=2)yes(c,'Protein hold inclusive2 '+n,x,'PROTEINURIA_HOLD','withhold');else no(c,'Protein below2 '+n,x,['PROTEINURIA_HOLD']);}
yes(c,'Nephrotic syndrome independently stops',{nephrotic_syndrome:true,proteinuria_g_24h:1},'NEPHROTIC_STOP',perm);
for(const n of [0,1,2,3,4]){const x={liver_toxicity_grade:n};if([2,3].includes(n))yes(c,'LFTgrade'+n+' holds',x,'LIVER_G2_3','withhold');else no(c,'LFT notG2/3 '+n,x,['LIVER_G2_3']);if(n===4)yes(c,'LFTG4stops',x,'LIVER_G4',perm);else no(c,'LFTbelowG4 '+n,x,['LIVER_G4']);}
for(const a of [2.999,3,3.001])for(const b of [1.999,2,2.001]){const x={alt_ast_uln_multiple:a,bilirubin_uln_multiple:b,cholestasis_absent:true};if(a>3&&b>2)yes(c,'Combined stop strict boundaries '+a+'/'+b,x,'LIVER_COMBINED_STOP',perm);else no(c,'Combined threshold not met '+a+'/'+b,x,['LIVER_COMBINED_STOP']);}
for(const ch of [false,undefined]){const x={alt_ast_uln_multiple:4,bilirubin_uln_multiple:3};if(ch!==undefined)x.cholestasis_absent=ch;yes(c,'Cholestasis not excluded '+ch,x,'LIVER_COMBINED_CONTEXT','consultant_review');no(c,'No no-cholestasis permanent assumption '+ch,x,['LIVER_COMBINED_STOP']);}
for(const f of ['alt_ast_uln_multiple','bilirubin_uln_multiple'])yes(c,'LFT grade context '+f,{[f]:4},'LIVER_GRADE_REVIEW_'+f.toUpperCase(),'consultant_review');
for(const n of [0,1,2,3]){if(n>=2)yes(c,'PPES G'+n,{ppes_grade:n},'PPES_G'+n,'withhold');else no(c,'PPES belowG2 '+n,{ppes_grade:n},['PPES_G2','PPES_G3']);}
test(c,'PPES2 same dose, PPES3 reduction',()=>{assert.match(run(c,{ppes_grade:2}).recommendation,/SAME dose/i);assert.match(run(c,{ppes_grade:3}).recommendation,/REDUCED dose/i);});
yes(c,'OtherG3hold',{other_toxicity_grade:3},'OTHER_G3','withhold');yes(c,'OtherG4discontinue exception',{other_toxicity_grade:4},'OTHER_G4','discontinue');
test(c,'OtherG4 restart remains conditional',()=>{const r=run(c,{other_toxicity_grade:4});assert.match(r.recommendation,/consultant.*reduced dose.*grade 1.*benefit outweighs risk/i);assert.equal(r.actionType,'discontinue');});
for(const [f,v,id]of [['hypertension_grade',3,'HYPERTENSION'],['haemorrhage_grade',2,'BLEED'],['proteinuria_g_24h',2,'PROTEIN'],['liver_toxicity_grade',2,'LIVER'],['liver_toxicity_grade',3,'LIVER'],['ppes_grade',3,'PPES'],['other_toxicity_grade',3,'OTHER']])for(const dose of [5,4,3]){const x={[f]:v,current_fruquintinib_dose_mg:dose};if(dose===3)yes(c,'Persistent at3 '+f+v,x,id+'_AT3_STOP',perm);else no(c,'Still dose reduction available '+f+v+'/'+dose,x,[id+'_AT3_STOP']);}
no(c,'PPES2 at3 resumes same dose after recovery',{ppes_grade:2,current_fruquintinib_dose_mg:3},['PPES_AT3_STOP','DOSE_FLOOR']);
yes(c,'Restart lacks approval',{restart_requested:true},'RESTART_APPROVAL','withhold');yes(c,'Restart lacks recovery',{restart_requested:true,consultant_restart_approved:true},'RESTART_RECOVERY','withhold');
for(const n of [.999,1,1.001]){const x={restart_requested:true,restart_after_proteinuria:true,proteinuria_g_24h:n};if(n>=1)yes(c,'Protein restart strict<1 '+n,x,'PROTEIN_RESTART','withhold');else no(c,'Protein restart below1',x,['PROTEIN_RESTART']);}
yes(c,'Protein restart missing quantification',{restart_requested:true,restart_after_proteinuria:true},'PROTEIN_RESTART','withhold');
yes(c,'Bleeding restart not recovered',{restart_requested:true,restart_after_bleeding:true},'BLEEDING_RESTART','withhold');
no(c,'Bleeding restart resolved explicit',{restart_requested:true,restart_after_bleeding:true,bleeding_resolved_or_grade1:true},['BLEEDING_RESTART']);
yes(c,'Severe baseline hepatic excluded',{targeted_hepatic_band:'severe'},'HEPATIC_SEVERE','contraindicated');
for(const b of ['mild','moderate','severe'])yes(c,'Renal no adjustment '+b,{targeted_renal_band:b},'ORGAN_REVIEW','consultant_review');
yes(c,'Mild/mod hepatic no adjustment',{targeted_hepatic_band:'mild_mod'},'ORGAN_REVIEW','consultant_review');
yes(c,'Dialysis missing source dosing',{targeted_renal_band:'haemodialysis'},'DIALYSIS_UNSPECIFIED','consultant_review');
for(const n of [11.999,12,12.001]){if(n===12)yes(c,'Exact12h unresolved',{missed_dose_hours:n},'MISSED12','consultant_review');else no(c,'No equality uncertainty '+n,{missed_dose_hours:n},['MISSED12']);}
yes(c,'Do not repeat vomited dose',{vomited_after_dose:true},'VOMITED','consultant_review');
for(const [f,id,t]of [['recent_or_planned_major_surgery','SURGERY_REVIEW','withhold'],['gi_perforation','GI_PERFORATION',perm],['pres_confirmed','PRES','discontinue'],['arterial_thrombosis_suspected','ARTERIAL_THROMBOSIS','discontinue'],['bp_uncontrollable_or_crisis','BP_UNCONTROLLABLE',perm],['strong_moderate_cyp3a_inducer','CYP3A_INDUCER','consultant_review']])yes(c,'Explicit EMA supplement '+f,{[f]:true},id,t);
test(c,'Permanent stop dominates recoverable toxicity',()=>assert.equal(run(c,{ppes_grade:2,gi_perforation:true}).actionType,perm));
test(c,'BP first-month weekly retained',()=>assert.match(P[c].monitoring.join(' '),/weekly during the first month.*monthly/i));
for(const c of Object.keys(P)){
 for(const n of [0,17.999])yes(c,'Adult threshold below18 '+n,{age_years:n},'ADULT_INDICATION','consultant_review');
 for(const n of [18,18.001])no(c,'Adult18 boundary '+n,{age_years:n},['ADULT_INDICATION']);
 yes(c,'Baseline adequacy not confirmed',{adequate_baseline_organ_function:false},'BASELINE_FUNCTION_UNCONFIRMED','consultant_review');
}
for(const f of ['preexisting_hypertension','bleeding_clotting_disorder'])yes('00890','Source caution '+f,{[f]:true},f.toUpperCase(),'consultant_review');
yes('00890','Missed dose below12',{missed_dose_hours:11.999},'MISSED_LT12','consultant_review');
yes('00890','Missed dose above12',{missed_dose_hours:12.001},'MISSED_GT12','consultant_review');
test('00890','PPES grade4 is not an available CTCAE5 PPES grade',()=>{assert(!P['00890'].input_definitions.ppes_grade.options.some(o=>o.value===4));assert.notEqual(run('00890',{ppes_grade:4}).actionType,'proceed');});
const out={release:'0.84.35',source_checked_date:'2026-11-05',baseline_comparison:baseline,total:results.length,passed:results.filter(x=>x.passed).length,failed:results.filter(x=>!x.passed).length,coverage:Object.fromEntries(Object.keys(P).map(c=>[c,{rules:P[c].rule_engine.rules.length,exercised:[...coverage[c]].filter(x=>!/^PARTIAL_/.test(x)),unexercised:P[c].rule_engine.rules.map(r=>r.rule_id||r.id).filter(id=>!coverage[c].has(id))}])),cases:results};
fs.writeFileSync(path.join(__dirname,baseline?'source-case-results-baseline.json':'source-case-results.json'),JSON.stringify(out,null,2)+'\n');
for(const f of results.filter(x=>!x.passed))console.error('FAIL '+f.protocol+' '+f.name+': '+f.error);
console.log(`Nivolumab/fruquintinib source audit: ${out.passed}/${out.total} passed; ${out.failed} failed${baseline?' (before snapshots)':''}.`);
if(out.failed)process.exitCode=1;
