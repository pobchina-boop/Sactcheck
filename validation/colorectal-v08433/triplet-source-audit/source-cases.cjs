'use strict';
// Hand-specified cases transcribed from NCCP 00555 v7,00783 v2a,00691 v4.
// Failing any case exits non-zero; never treats baseline failures as acceptance.
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'../../..'), E=require(path.join(root,'js/assessment-engine.js')),D=require(path.join(root,'js/protocol-dose-schedule.js'));
const codes=['00555','00783','00691'],P={};for(const c of codes){const f=fs.readdirSync(path.join(root,'protocols/gastrointestinal')).find(f=>f.startsWith(c+'-'));P[c]=JSON.parse(fs.readFileSync(path.join(root,'protocols/gastrointestinal',f)));}
let count=0;const results=[],failures=[];
function test(name,fn){count++;try{fn();results.push({name,passed:true});}catch(e){failures.push({name,error:e.message});results.push({name,passed:false,error:e.message});}}
function assess(c,x){return E.assess(P[c],{...(c==='00691'?{treatment_phase:'induction'}:{}),...x});}
function has(r,id){return r.findings.some(f=>f.ruleId===id);}
function found(c,input,id,typ){test(c+' '+id+' '+JSON.stringify(input),()=>{const r=assess(c,input);assert(has(r,id),'Missing '+id+'; findings='+r.findings.map(x=>x.ruleId));if(typ)assert.equal(r.findings.find(f=>f.ruleId===id).actionType,typ);});}
function absent(c,input,id){test(c+' absent '+id+' '+JSON.stringify(input),()=>assert(!has(assess(c,input),id),'Unexpected '+id));}
function component(c,input,id,comps){test(c+' component '+id,()=>assert.deepEqual(assess(c,input).findings.find(f=>f.ruleId===id)?.action.components,comps));}
for(const c of codes){
 test(c+' protocol validates',()=>assert(E.validateProtocol(P[c]).valid));
 test(c+' stable protocol identifier',()=>assert.equal(P[c].protocol_id,JSON.parse(fs.readFileSync(path.join(__dirname,c+'-existing.json'))).protocol_id));
 test(c+' optional clinical values have no normal defaults',()=>Object.entries(P[c].input_definitions).forEach(([k,v])=>assert.equal(v.demo_value,'',k)));
 test(c+' independent review remains pending',()=>['consultant_reviewed','oncology_pharmacy_reviewed','clinical_use_authorised'].forEach(k=>assert.equal(P[c].metadata.validation[k],false)));
 test(c+' no numeric action from empty assessment',()=>assert(!D.buildModificationModel(P[c],E.assess(P[c],{})).rows.some(r=>r.quantified)));
 const anc=c==='00555'?1:1.5,plt=c==='00691'?100:75;
 for(const [value,hit] of [[anc-.01,true],[anc,false],[anc+.01,false]])(hit?found:absent)(c,{anc_x10e9_l:value},'ANC_BELOW_CYCLE_THRESHOLD');
 for(const [value,hit] of [[plt-.01,true],[plt,false],[plt+.01,false]])(hit?found:absent)(c,{platelets_x10e9_l:value},'PLATELETS_BELOW_CYCLE_THRESHOLD');
 for(const [value,hit] of [[99.99,true],[100,false]])(hit?found:absent)(c,{baseline_platelets_x10e9_l:value},'BASELINE_PLATELET_EXCLUSION');
 const ba=c==='00555'?2:1.5;found(c,{baseline_anc_x10e9_l:ba-.01},'BASELINE_ANC_EXCLUSION','contraindicated');absent(c,{baseline_anc_x10e9_l:ba},'BASELINE_ANC_EXCLUSION');
 found(c,{anc_x10e9_l:anc-.01,toxicity_delay_weeks:2},'COUNTS_NOT_RECOVERED_TWO_WEEKS','consultant_review');absent(c,{anc_x10e9_l:anc,toxicity_delay_weeks:2},'COUNTS_NOT_RECOVERED_TWO_WEEKS');
 found(c,{dpd_status:'complete'},'DPD_COMPLETE','contraindicated');found(c,{dpd_status:'partial'},'DPD_PARTIAL','consultant_review');found(c,{dpd_status:'unknown'},'DPD_UNKNOWN','consultant_review');
 found(c,{bilirubin_uln_multiple:3.01},'BILIRUBIN_EXCLUSION','contraindicated');absent(c,{bilirubin_uln_multiple:3},'BILIRUBIN_EXCLUSION');
 found(c,{crcl_ml_min:9.99},'IRINOTECAN_RENAL_LT10','consultant_review');absent(c,{crcl_ml_min:10},'IRINOTECAN_RENAL_LT10');found(c,{crcl_ml_min:29.99},'OXALIPLATIN_RENAL_LT30','consultant_review');absent(c,{crcl_ml_min:30},'OXALIPLATIN_RENAL_LT30');
 found(c,{haemodialysis:true},'IRINOTECAN_DIALYSIS');found(c,{haemodialysis:true},'OXALIPLATIN_DIALYSIS');
 found(c,{febrile_or_active_infection:true},'CURRENT_INFECTION','withhold');
 for(const field of ['anc_delay','platelet_delay','platelet_nadir']){
  found(c,{[field+'_episode']:true},field.toUpperCase()+'_OCCURRENCE_NEEDED');
  for(const occurrence of [1,2,3])found(c,{[field+'_episode']:true,[field+'_occurrence']:occurrence},field.toUpperCase()+'_O'+occurrence,occurrence===3?'discontinue':'consultant_review');
 }
 for(const occurrence of [1,2,3])found(c,{diarrhoea_worst_grade:3,diarrhoea_occurrence:occurrence},'DIARRHOEA_O'+occurrence,occurrence===3?'discontinue':'consultant_review');
 found(c,{diarrhoea_with_fever_or_severe_neutropenia:true,diarrhoea_occurrence:1},'DIARRHOEA_O1');
 absent(c,{diarrhoea_worst_grade:2,diarrhoea_occurrence:1},'DIARRHOEA_O1');
 found(c,{neuropathy_grade:4},'NEUROPATHY_G4','discontinue');found(c,{neuropathy_grade:3,neuropathy_persistent:true},'NEUROPATHY_PERSISTENT_G3','discontinue');found(c,{neuropathy_grade:3},'NEUROPATHY_CONTEXT_REQUIRED');
 component(c,{neuropathy_grade:4},'NEUROPATHY_G4',['oxaliplatin']);
 found(c,{mucositis_worst_grade:3},'MUCOSITIS_REDUCTION');found(c,{hand_foot_worst_grade:3},'HAND_FOOT_REDUCTION');
 // Current dose below source target must never be raised by a recurrent event.
 found(c,{anc_delay_episode:true,anc_delay_occurrence:1,current_irinotecan_dose_mg_m2:120,toxicity_recovered_and_dose_history_checked:true,anc_x10e9_l:2,platelets_x10e9_l:150},'ANC_DELAY_O1_IRINOTECAN_PRIOR_LOWER');
 absent(c,{anc_delay_episode:true,anc_delay_occurrence:1,current_irinotecan_dose_mg_m2:120,toxicity_recovered_and_dose_history_checked:true,anc_x10e9_l:2,platelets_x10e9_l:150},'ANC_DELAY_O1_IRINOTECAN_CONFIRMED');
 found(c,{anc_delay_episode:true,anc_delay_occurrence:1,current_irinotecan_dose_mg_m2:165,toxicity_recovered_and_dose_history_checked:true,anc_x10e9_l:2,platelets_x10e9_l:150},'ANC_DELAY_O1_IRINOTECAN_CONFIRMED','dose_reduce');
 absent(c,{anc_delay_episode:true,anc_delay_occurrence:1,current_irinotecan_dose_mg_m2:165,anc_x10e9_l:2,platelets_x10e9_l:150},'ANC_DELAY_O1_IRINOTECAN_CONFIRMED');
 absent(c,{anc_delay_episode:true,anc_delay_occurrence:1,current_irinotecan_dose_mg_m2:165,toxicity_recovered_and_dose_history_checked:true,anc_x10e9_l:.5,platelets_x10e9_l:150},'ANC_DELAY_O1_IRINOTECAN_CONFIRMED');
 test(c+' missing dose history yields review only',()=>{const r=assess(c,{anc_delay_episode:true,anc_delay_occurrence:1});assert(!D.buildModificationModel(P[c],r).rows.some(x=>x.quantified));});
 test(c+' invalid occurrence cannot hide urgent ANC hold',()=>assert(has(assess(c,{anc_x10e9_l:.5,anc_delay_occurrence:99}), 'ANC_BELOW_CYCLE_THRESHOLD')));
}
for(const c of ['00555','00783']){
 found(c,{age_years:70,ecog:0},'AGE_SOURCE_GAP');found(c,{age_years:71,ecog:1},'ECOG_OLDER');absent(c,{age_years:71,ecog:0},'ECOG_OLDER');found(c,{age_years:69,ecog:3},'ECOG_YOUNGER');found(c,{ecog:1},'ECOG_WITHOUT_AGE');
 found(c,{neuropathy_grade:2,neuropathy_persistent:false,neuropathy_duration_days:7.01},'TRANSIENT_NEUROPATHY_REDUCTION');absent(c,{neuropathy_grade:2,neuropathy_persistent:false,neuropathy_duration_days:7},'TRANSIENT_NEUROPATHY_REDUCTION');
 found(c,{neuropathy_grade:2,neuropathy_persistent:true},'PERSISTENT_G2_SOURCE_GAP');
 test(c+' Day1 platelet second occurrence retains75% original FU (merged source cell)',()=>assert.equal(P[c].rule_engine.rules.find(r=>r.id==='PLATELET_DELAY_O2').action.component_changes.fluorouracil_infusion.source_reference_dose_mg_m2,2400));
 test(c+' platelet nadir second occurrence FU50% original',()=>assert.equal(P[c].rule_engine.rules.find(r=>r.id==='PLATELET_NADIR_O2').action.component_changes.fluorouracil_infusion.source_reference_dose_mg_m2,1600));
}
found('00555',{crcl_ml_min:10},'RENAL_EXACT_10');found('00555',{crcl_ml_min:30},'RENAL_EXACT_30');found('00555',{fluorouracil_hepatic_impairment:'severe'},'FIVEFU_SEVERE_HEPATIC','contraindicated');
found('00555',{fluorouracil_hepatic_impairment:'moderate'},'FIVEFU_COMBINED_ORGAN_REVIEW');absent('00555',{fluorouracil_hepatic_impairment:'moderate',renal_impairment_present:false},'FIVEFU_COMBINED_ORGAN_REVIEW');
for(const c of ['00783','00691']){
 found(c,{fluorouracil_bilirubin_umol_l:85.01},'FIVEFU_ABSOLUTE_HEPATIC_CONTRA');found(c,{fluorouracil_ast_u_l:180.01},'FIVEFU_ABSOLUTE_HEPATIC_CONTRA');
 found(c,{fluorouracil_bilirubin_umol_l:85},'FIVEFU_EXACT_HEPATIC_BOUNDARY');found(c,{fluorouracil_ast_u_l:180},'FIVEFU_EXACT_HEPATIC_BOUNDARY');
 absent(c,{fluorouracil_bilirubin_umol_l:84.99,fluorouracil_ast_u_l:179.99},'FIVEFU_ABSOLUTE_HEPATIC_CONTRA');
}
// Rectal phase, component-specific stops and non-interchangeable neuro/FN targets.
found('00691',{treatment_phase:''},'PHASE_REQUIRED');found('00691',{treatment_phase:'bad',crcl_ml_min:20},'PHASE_REQUIRED');
found('00691',{ecog:2},'ECOG_OUTSIDE_ELIGIBILITY');absent('00691',{ecog:1},'ECOG_OUTSIDE_ELIGIBILITY');
component('00691',{anc_delay_episode:true,anc_delay_occurrence:3},'ANC_DELAY_O3',['irinotecan']);component('00691',{platelet_delay_episode:true,platelet_delay_occurrence:3},'PLATELET_DELAY_O3',['oxaliplatin']);component('00691',{diarrhoea_worst_grade:4,diarrhoea_occurrence:3},'DIARRHOEA_O3',['irinotecan']);
for(const occurrence of [1,2,3])found('00691',{prior_febrile_neutropenia:true,neutropenic_event_occurrence:occurrence},'SEVERE_NEUTROPENIC_O'+occurrence);
found('00691',{nadir_anc_x10e9_l:.49,nadir_anc_duration_days:7.01,neutropenic_event_occurrence:2},'SEVERE_NEUTROPENIC_O2');absent('00691',{nadir_anc_x10e9_l:.49,nadir_anc_duration_days:7,neutropenic_event_occurrence:2},'SEVERE_NEUTROPENIC_O2');absent('00691',{nadir_anc_x10e9_l:.5,nadir_anc_duration_days:8,neutropenic_event_occurrence:2},'SEVERE_NEUTROPENIC_O2');
found('00691',{infection_during_nadir:true,nadir_anc_x10e9_l:.99,neutropenic_event_occurrence:1},'SEVERE_NEUTROPENIC_O1');absent('00691',{infection_during_nadir:true,nadir_anc_x10e9_l:1,neutropenic_event_occurrence:1},'SEVERE_NEUTROPENIC_O1');
found('00691',{prior_febrile_neutropenia:true},'GCSF_REVIEW');found('00691',{second_anc_below1_episode:true},'GCSF_REVIEW');
for(const b of [27,50])found('00691',{fluorouracil_bilirubin_umol_l:b},'IRINOTECAN_BILI_27_50');absent('00691',{fluorouracil_bilirubin_umol_l:26.99},'IRINOTECAN_BILI_27_50');found('00691',{fluorouracil_bilirubin_umol_l:50.01},'IRINOTECAN_BILI_GT50');
found('00691',{neuropathy_grade:3,neuropathy_persistent:false},'NEUROPATHY_TRANSIENT_G3');found('00691',{neuropathy_grade:2,neuropathy_persistent:true},'NEUROPATHY_PERSISTENT_G2');absent('00691',{neuropathy_grade:2,neuropathy_persistent:false,neuropathy_duration_days:10},'NEUROPATHY_PERSISTENT_G2');
for(const val of [30,50])found('00691',{treatment_phase:'chemoradiation',crcl_ml_min:val},'CAPE_RENAL_30_50');found('00691',{treatment_phase:'chemoradiation',crcl_ml_min:50.5},'CAPE_RENAL_50_51_GAP');found('00691',{treatment_phase:'chemoradiation',crcl_ml_min:29.99},'CAPE_RENAL_LT30');absent('00691',{treatment_phase:'chemoradiation',crcl_ml_min:51},'CAPE_RENAL_50_51_GAP');
found('00691',{treatment_phase:'chemoradiation',haemodialysis:true},'CAPE_DIALYSIS');
for(const grade of [2,3])for(const occ of [1,2])found('00691',{treatment_phase:'chemoradiation',capecitabine_current_grade:1,capecitabine_worst_grade:grade,capecitabine_occurrence:occ},'CAPE_TOXICITY_O'+occ);
found('00691',{treatment_phase:'chemoradiation',capecitabine_current_grade:2},'CAPE_CURRENT_G2_PLUS','withhold');found('00691',{treatment_phase:'chemoradiation',capecitabine_worst_grade:2,capecitabine_occurrence:3},'CAPE_THIRD_OCCURRENCE_GAP');found('00691',{treatment_phase:'chemoradiation',capecitabine_worst_grade:4},'CAPE_G4_CHOICE');found('00691',{treatment_phase:'chemoradiation',capecitabine_angina_or_infarction:true},'CAPE_CARDIAC_STOP');
for(const [input,id] of [[{crcl_ml_min:20},'OXALIPLATIN_RENAL_LT30'],[{anc_x10e9_l:1},'ANC_BELOW_CYCLE_THRESHOLD'],[{neuropathy_grade:4},'NEUROPATHY_G4'],[{fluorouracil_bilirubin_umol_l:60},'IRINOTECAN_BILI_GT50'],[{diarrhoea_worst_grade:4,diarrhoea_occurrence:3},'DIARRHOEA_O3']])absent('00691',{treatment_phase:'chemoradiation',...input},id);
absent('00691',{treatment_phase:'induction',capecitabine_current_grade:3},'CAPE_CURRENT_G2_PLUS');
test('00691 source schedule retains46-hour pump then5-week radiation course',()=>{const [a,b]=P['00691'].treatment_phases;assert.equal(a.phase_id,'induction');assert.equal(a.cycles.length,6);assert.equal(a.cycle_length_days,14);assert.match(a.administration.find(x=>x.drug==='fluorouracil_infusion').dose.unit,/46/);assert.equal(b.phase_id,'chemoradiation');assert.equal(b.cycle_length_days,7);assert.equal(b.cycles.length,5);assert.equal(b.administration[0].dose.value,800);});
// Bevacizumab quantitative urine boundaries and independently actionable hazards.
for(const dip of [2,3])found('00783',{urine_dipstick:dip},'BEV_PROTEIN_DIP_2_3','consultant_review');found('00783',{urine_dipstick:4},'BEV_PROTEIN_DIP4','withhold');
found('00783',{urine_protein_g_l:1},'BEV_PROTEIN_DIP_2_3');absent('00783',{urine_protein_g_l:.99},'BEV_PROTEIN_DIP_2_3');
absent('00783',{urine_protein_24h_g:2},'BEV_PROTEIN_GT2_TO4');found('00783',{urine_protein_24h_g:2.01},'BEV_PROTEIN_GT2_TO4');found('00783',{urine_protein_24h_g:4},'BEV_PROTEIN_GT2_TO4');absent('00783',{urine_protein_24h_g:4},'BEV_PROTEIN_GT4');found('00783',{urine_protein_24h_g:4.01},'BEV_PROTEIN_GT4','discontinue');
for(const grade of [2,3])test('00783 proteinuria grade'+grade+' alone not blanket hold',()=>assert(!assess('00783',{proteinuria_grade:grade}).findings.some(f=>f.actionType==='withhold')));
found('00783',{proteinuria_grade:4},'BEV_PROTEIN_G4','discontinue');
found('00783',{systolic_bp_mmhg:151},'BEV_BP_SINGLE_VALUE');found('00783',{diastolic_bp_mmhg:101},'BEV_BP_SINGLE_VALUE');absent('00783',{systolic_bp_mmhg:150,diastolic_bp_mmhg:100},'BEV_BP_SINGLE_VALUE');found('00783',{systolic_bp_mmhg:151,bp_sustained_on_antihypertensives:true},'BEV_BP_WITHHOLD');
found('00783',{uncontrolled_or_symptomatic_hypertension:true},'BEV_BP_WITHHOLD');found('00783',{hypertension_grade:4},'BEV_BP_STOP');found('00783',{persistent_grade3_hypertension:true},'BEV_BP_STOP');
for(const [input,id] of [[{arterial_thromboembolism:true},'BEV_THROMBOEMBOLISM_STOP'],[{thromboembolism_grade:4},'BEV_THROMBOEMBOLISM_STOP'],[{haemorrhage_grade:3},'BEV_BLEEDING_STOP'],[{tracheoesophageal_fistula:true},'BEV_FISTULA_STOP'],[{fistula_grade:4},'BEV_FISTULA_STOP'],[{pres_confirmed:true},'BEV_PRES_STOP'],[{gi_perforation:true},'BEV_GI_PERFORATION_STOP']]){found('00783',input,id,'discontinue');component('00783',input,id,['bevacizumab']);}
for(const [input,hit] of [[{days_since_major_surgery:27.99},true],[{days_since_major_surgery:28,wound_fully_healed:true},false],[{days_until_major_surgery:28},true],[{days_until_major_surgery:29},false],[{days_until_minor_surgery:7},true],[{days_until_minor_surgery:8},false],[{wound_fully_healed:false},true]])(hit?found:absent)('00783',input,'BEV_SURGERY_HOLD');found('00783',{days_since_major_surgery:29},'BEV_SURGERY_HEALING_UNKNOWN');

for(const c of codes)test(c+' rendered schedule has all source components',()=>{const m=D.buildModel(P[c]);assert.equal(m.phases.length,c==='00691'?2:1);assert(m.phases.every(x=>x.complete));assert.equal(m.phases[0].components.length,c==='00783'?5:4);assert(m.phases[0].components.every(x=>x.days.length===1&&x.days[0]==='1'));const fu=m.phases[0].components.find(x=>x.id==='5fu_infusion');assert(fu);assert.match(fu.dose,new RegExp(c==='00691'?'2400':'3200'));assert.match(fu.dose,new RegExp(c==='00691'?'46':'48'));});
test('00691 rendered capecitabine phase includes all five dosing days',()=>{const m=D.buildModel(P['00691']);const ph=m.phases.find(x=>x.id==='chemoradiation');assert.equal(ph.components.length,1);assert.equal(ph.components[0].id,'capecitabine');assert.deepEqual(ph.components[0].days,['1','2','3','4','5']);assert.match(ph.components[0].dose,/800/);assert.match(ph.components[0].dose,/twice daily/);});
test('00691 resolved capecitabine history displays source600 target',()=>{const r=assess('00691',{treatment_phase:'chemoradiation',capecitabine_current_grade:1,capecitabine_worst_grade:2,capecitabine_occurrence:1,current_capecitabine_dose_mg_m2:800,toxicity_recovered_and_dose_history_checked:true});const row=D.buildModificationModel(P['00691'],r).rows.find(x=>x.componentId==='capecitabine');assert(row.quantified);assert.equal(row.protocolDose,'600 mg/m²');});
test('00691 prior capecitabine400 never escalates to600',()=>{const r=assess('00691',{treatment_phase:'chemoradiation',capecitabine_current_grade:1,capecitabine_worst_grade:2,capecitabine_occurrence:1,current_capecitabine_dose_mg_m2:400,toxicity_recovered_and_dose_history_checked:true});const row=D.buildModificationModel(P['00691'],r).rows.find(x=>x.componentId==='capecitabine');assert(!row.quantified);assert.match(row.protocolDose,/already below/);});

for(const c of ['00555','00783']){found(c,{haematocrit_percent:24.9,platelets_x10e9_l:99.9,creatinine_umol_l:135},'HUS_LAB_PATTERN','withhold');absent(c,{haematocrit_percent:25,platelets_x10e9_l:99.9,creatinine_umol_l:135},'HUS_LAB_PATTERN');absent(c,{haematocrit_percent:24.9,platelets_x10e9_l:100,creatinine_umol_l:135},'HUS_LAB_PATTERN');absent(c,{haematocrit_percent:24.9,platelets_x10e9_l:99.9,creatinine_umol_l:134.9},'HUS_LAB_PATTERN');component(c,{haematocrit_percent:24.9,platelets_x10e9_l:99.9,creatinine_umol_l:135},'HUS_LAB_PATTERN',['oxaliplatin']);}
found('00783',{systolic_bp_mmhg:201,bp_sustained_on_antihypertensives:true},'BEV_SEVERE_BP_UNCONTROLLED_STOP','discontinue');found('00783',{diastolic_bp_mmhg:111,bp_sustained_on_antihypertensives:true},'BEV_SEVERE_BP_UNCONTROLLED_STOP');absent('00783',{systolic_bp_mmhg:200,diastolic_bp_mmhg:110,bp_sustained_on_antihypertensives:true},'BEV_SEVERE_BP_UNCONTROLLED_STOP');absent('00783',{systolic_bp_mmhg:201},'BEV_SEVERE_BP_UNCONTROLLED_STOP');

const vm=require('vm'),ctctx={};vm.createContext(ctctx);vm.runInContext(fs.readFileSync(path.join(root,'js/ctcae-descriptors.js'),'utf8'),ctctx);const CT=ctctx.SACTCheckCTCAE;
for(const c of codes)for(const [k,def] of Object.entries(P[c].input_definitions).filter(([k,d])=>d.type==='select'&&k.endsWith('_grade'))){test(c+' rendered clinical grading guide '+k,()=>{const g=CT.guide({...def,id:k});assert(g&&g.grades.length===def.options.length);assert(g.grades.every(x=>x.description.length>15));assert(def.assessment_guidance&&g.sourceUrl);assert(def.ctcae_version||def.grading_source_label);});if(k.startsWith('hand_foot'))test(c+' HFS has no invented CTCAEv5 grade4 '+k,()=>{assert.equal(def.ctcae_version,'5.0');assert.deepEqual(def.options.map(x=>x.value),[0,1,2,3]);});}
test('00783 source proteinuria grade4 not mislabelled CTCAEv5',()=>{const d=P['00783'].input_definitions.proteinuria_grade;assert(!d.ctcae_version);assert.equal(d.grading_source_url,P['00783'].metadata.source_url);assert.match(d.source_grading_note,/no grade 4/);assert(d.options.some(x=>x.value===4));});
const output={date:'2026-11-04',cases:count,passed:count-failures.length,failed:failures.length,results,failures};fs.writeFileSync(path.join(__dirname,'source-case-results.json'),JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify({cases:count,passed:count-failures.length,failed:failures.length,failures},null,2));if(failures.length)process.exitCode=1;
