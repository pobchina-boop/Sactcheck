'use strict';
// Independently chosen from NCCP 00688 v2a pp1–9, 00738 v3 pp1–8 and cited EMA supplements.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..'),E=require(root+'/js/assessment-engine'),D=require(root+'/js/protocol-dose-schedule');
const mode=process.argv[2]||'proposed',dir=mode==='integrated'?root+'/protocols/breast':mode==='baseline'?path.join(__dirname,'../baseline'):path.join(__dirname,'proposed');
const ps=Object.fromEntries(['00688','00738'].map(c=>[c,JSON.parse(fs.readFileSync(path.join(dir,fs.readdirSync(dir).find(f=>f.startsWith(c+'-')))))]));const rows=[];
function test(code,name,input,fn){const row={code,name,input};try{const p=ps[code],r=E.assess(p,input),m=D.buildModificationModel(p,r),f=r.findings.filter(x=>!x.domainAssessment&&!/^PARTIAL_/.test(x.ruleId||''));row.actual={action:r.actionType,findings:f.map(x=>({id:x.ruleId,action:x.actionType,components:x.action?.components})),errors:r.errors,invalid:r.invalid};assert.deepEqual(r.errors,[]);assert.deepEqual(r.invalid,[]);fn({p,r,m,f});row.pass=true}catch(e){row.pass=false;row.error=e.message}rows.push(row)}
const has=(id,type,component)=>q=>{assert(q.f.some(x=>x.ruleId===id&&(!type||x.actionType===type)&&(!component||x.action.components.includes(component))),`Missing ${id} ${type||''}`);assert(!['proceed','proceed_with_caution'].includes(q.r.actionType))};
const lacks=id=>q=>assert(!q.f.some(x=>x.ruleId===id),`Unexpected ${id}`);
const review=id=>q=>{has(id,'consultant_review')(q);assert(!q.m.rows.some(x=>x.quantified&&/^\d+(\.\d+)?\s*mg/.test(x.protocolDose||'')),'Review must not calculate an absolute prescription')};
for(const c of ['00688','00738']){
 test(c,'Blank cannot clear',{},q=>assert.equal(q.r.actionType,'incomplete'));
 test(c,'Indication not established',{indication_eligible:false},review('INDICATION_REVIEW'));
 for(const ecog of [2,3,4,5])test(c,'ECOG outside source '+ecog,{ecog},review('ECOG_REVIEW'));
 test(c,'Pending tests',{pretreatment_tests_unresolved:true},review('TESTS_UNRESOLVED'));
 test(c,'Unresolved interaction',{interaction_review_unresolved:true},review('INTERACTIONS'));
 test(c,'Current FN urgent',{current_febrile_neutropenia:true},has('CURRENT_FN','withhold'));
 test(c,'Unknown ECOG not accepted',{ecog:'wrong'},review('INVALID_ECOG'));
}
const a='00688',b='00738';
test(a,'Both drugs exact source schedule',{},q=>{let p=q.p.treatment_phases.find(x=>x.phase_id==='combination');assert(p);assert.equal(p.cycle_length_days,28);assert.deepEqual(p.administration.map(x=>[x.drug,x.dose.value,x.days]),[['atezolizumab',840,[1,15]],['nab-paclitaxel',100,[1,8,15]]]);assert(/six cycles/.test(p.duration_text));assert.equal(q.p.metadata.regimen_reimbursement_code,'00688a');assert.equal(q.p.metadata.published_date,'2022-01-20');assert(!/single_agent_ici/.test(q.p.metadata.assessment_model));});
test(a,'PDL1 0.99 below IC threshold',{pdl1_ic_percent:.99},review('PDL1_THRESHOLD'));
test(a,'PDL1 1 exact accepted only as this domain',{pdl1_ic_percent:1,pdl1_test:'sp142_ic'},lacks('PDL1_THRESHOLD'));
for(const pdl1_test of ['other','unknown'])test(a,'No CPS substitution '+pdl1_test,{pdl1_ic_percent:10,pdl1_test},review('PDL1_ASSAY'));
test(a,'PDL1 method missing',{pdl1_ic_percent:10},review('PDL1_METHOD_MISSING'));
test(a,'Prior advanced chemotherapy',{prior_metastatic_systemic_therapy:true},review('PRIOR_ADVANCED_SYSTEMIC'));
test(a,'11.9 month early-chemo interval',{months_since_early_chemotherapy:11.9},review('EARLY_CHEMO_INTERVAL'));
test(a,'12 month early-chemo boundary',{months_since_early_chemotherapy:12},lacks('EARLY_CHEMO_INTERVAL'));
for(const field of ['symptomatic_cns_metastases','symptomatic_ild','severe_hepatic_impairment'])test(a,'Exclusion '+field,{[field]:true},has('EXCLUSION_'+field.toUpperCase(),'contraindicated'));
test(a,'Baseline neuropathy2 exclusion',{assessment_stage:'baseline',peripheral_neuropathy_grade:2},has('BASELINE_NEUROPATHY','contraindicated'));
test(a,'Ongoing neuropathy2 no baseline exclusion',{assessment_stage:'ongoing',peripheral_neuropathy_grade:2},lacks('BASELINE_NEUROPATHY'));
test(a,'Pregnancy source exclusion',{pregnancy:true},has('PREGNANCY_OR_BREASTFEEDING_REVIEW','contraindicated'));
test(a,'Breastfeeding source exclusion',{breastfeeding:true},has('PREGNANCY_OR_BREASTFEEDING_REVIEW','contraindicated'));
test(a,'Nab six-cycle review',{treatment_phase:'combination',nab_cycles_completed:6},review('NAB_SIX_CYCLES'));
test(a,'Nab five cycles no extension flag',{treatment_phase:'combination',nab_cycles_completed:5},lacks('NAB_SIX_CYCLES'));
for(const x of [0,1,1.49])test(a,'Day1 ANC hold '+x,{treatment_day:1,anc:x},has('D1_ANC_HOLD','withhold','nab-paclitaxel'));
for(const x of [0,50,99])test(a,'Day1 PLT hold '+x,{treatment_day:1,platelets:x},has('D1_PLT_HOLD','withhold','nab-paclitaxel'));
test(a,'Day1 exact inclusive threshold',{treatment_day:1,anc:1.5,platelets:100},q=>{lacks('D1_ANC_HOLD')(q);lacks('D1_PLT_HOLD')(q)});
for(const day of [8,15]){
 for(const x of [0,.49])test(a,'Day'+day+' ANC hold '+x,{treatment_day:day,anc:x},has('D8_D15_ANC_HOLD','withhold','nab-paclitaxel'));
 for(const x of [0,49])test(a,'Day'+day+' PLT hold '+x,{treatment_day:day,platelets:x},has('D8_D15_PLT_HOLD','withhold','nab-paclitaxel'));
 test(a,'Day'+day+' exact lower threshold',{treatment_day:day,anc:.5,platelets:50},q=>{lacks('D8_D15_ANC_HOLD')(q);lacks('D8_D15_PLT_HOLD')(q)});
}
test(a,'Counts without day',{anc:1.2},review('NAB_DAY_MISSING'));
test(a,'Antibody-only avoids chemotherapy count decision',{treatment_phase:'atezolizumab',treatment_day:1,anc:1,platelets:50},q=>{lacks('D1_ANC_HOLD')(q);lacks('D1_PLT_HOLD')(q)});
for(const input of [{anc:1.5,platelets:110},{anc:2,platelets:100}])test(a,'Strict restart discrepancy '+JSON.stringify(input),{...input,treatment_day:1,restarting_after_haematologic_hold:true},review('NAB_RESTART_EQUALITY'));
for(const e of ['fever','first_dose_delay','prolonged_nadir']){
 for(const n of [1,2,3])test(a,'Nab haem event '+e+' occurrence'+n,{prior_neutropenic_event:e,neutropenic_event_occurrence:n},n===3?has('NAB_HAEM_3','discontinue','nab-paclitaxel'):review('NAB_HAEM_'+n));
 test(a,'Nab haem missing occurrence '+e,{prior_neutropenic_event:e},review('NAB_HAEM_HISTORY_MISSING'));
}
test(a,'Nadir platelet first event',{nadir_platelets:49,thrombocytopenia_occurrence:1},review('NAB_NADIR_PLT_1'));
test(a,'Nadir platelet second event',{nadir_platelets:49,thrombocytopenia_occurrence:2},has('NAB_NADIR_PLT_2','discontinue','nab-paclitaxel'));
test(a,'Nadir platelet exact50 outside reduction trigger',{nadir_platelets:50,thrombocytopenia_occurrence:1},lacks('NAB_NADIR_PLT_1'));
test(a,'Day15 omission no unscheduled replacement',{day15_nab_omitted:true},review('NAB_DAY15_OMITTED'));
for(const n of [3,4])test(a,'Severe neuropathy '+n,{peripheral_neuropathy_grade:n},has('NEUROPATHY_G3_G4','withhold','nab-paclitaxel'));
test(a,'Third severe neuropathy stops',{peripheral_neuropathy_grade:3,neuropathy_occurrence:3},has('NAB_NEURO_THIRD','discontinue','nab-paclitaxel'));
for(const n of [0,29.9])test(a,'CrCl under30 '+n,{crcl_ml_min:n},review('NAB_RENAL_LT30'));
test(a,'CrCl30 inclusive',{crcl_ml_min:30},lacks('NAB_RENAL_LT30'));
test(a,'Indexed eGFR not CrCl',{renal_measure_type:'indexed_egfr'},review('RENAL_METHOD'));
for(const [input,id] of [[{ast_uln_multiple:10.01},'NAB_HEP_STOP'],[{bilirubin_uln_multiple:5.01},'NAB_HEP_STOP']])test(a,'Nab severe liver '+JSON.stringify(input),input,has(id,'discontinue','nab-paclitaxel'));
for(const bili of [1.51,3,5])test(a,'Nab bilirubin hold '+bili,{ast_uln_multiple:10,bilirubin_uln_multiple:bili},has('NAB_HEP_HOLD','withhold','nab-paclitaxel'));
test(a,'Nab liver needs AST',{bilirubin_uln_multiple:2},review('NAB_HEP_AST_MISSING'));
test(a,'AST10 not restart eligible',{restarting_after_hepatic_hold:true,ast_uln_multiple:10},has('NAB_AST_RESTART_EQUALITY','withhold','nab-paclitaxel'));
test(a,'Nab hepatic unresolved3 boundary',{hepatic_toxicity_unresolved_weeks:3},review('NAB_HEP_THREE_WEEK_BOUNDARY'));
test(a,'Nab hepatic unresolved3.1 stops',{hepatic_toxicity_unresolved_weeks:3.1},has('NAB_HEP_UNRESOLVED','discontinue','nab-paclitaxel'));
test(a,'ALT cannot substitute AST in nab table',{alt_uln_multiple:12,ast_uln_multiple:1,bilirubin_uln_multiple:1,hepatic_event_context:'other_or_baseline'},q=>{lacks('NAB_HEP_STOP')(q);lacks('HEPATITIS_PERMANENT')(q);has('LIVER_ATTRIBUTION','consultant_review')(q)});
for(const field of ['alt_uln_multiple','ast_uln_multiple']){
 for(const v of [3.01,5])test(a,field+' immune hold '+v,{[field]:v,hepatic_event_context:'suspected_immune'},has('HEPATITIS_WITHHOLD','withhold','atezolizumab'));
 test(a,field+' immune stop >5',{[field]:5.01,hepatic_event_context:'suspected_immune'},has('HEPATITIS_PERMANENT','permanently_discontinue','atezolizumab'));
 test(a,field+' unknown cause cannot permanent-stop',{[field]:6},q=>{has('LIVER_ATTRIBUTION','consultant_review')(q);lacks('HEPATITIS_PERMANENT')(q)});
}
for(const input of [{assessment_stage:'baseline',systemic_steroids_mg_pred:10.1},{assessment_stage:'baseline',other_immunosuppressive_medication:true}])test(a,'Baseline immunosuppression '+JSON.stringify(input),input,has('EXCLUSION_IMMUNOSUPPRESSION','contraindicated','atezolizumab'));
test(a,'Baseline steroid10 allowed by this threshold',{assessment_stage:'baseline',systemic_steroids_mg_pred:10},lacks('EXCLUSION_IMMUNOSUPPRESSION'));
test(a,'Ongoing irAE steroids not baseline exclusion',{assessment_stage:'ongoing',systemic_steroids_mg_pred:40},q=>{lacks('EXCLUSION_IMMUNOSUPPRESSION')(q);has('STEROID_ONGOING','consultant_review')(q)});
for(const [f,n,id,t] of [['pneumonitis_grade',2,'PNEUMONITIS_G2','withhold'],['pneumonitis_grade',3,'PNEUMONITIS_G3_G4','permanently_discontinue'],['diarrhoea_colitis_grade',3,'COLITIS_G2_G3','withhold'],['diarrhoea_colitis_grade',4,'COLITIS_G4','permanently_discontinue'],['hypophysitis_grade',4,'HYPOPHYSITIS_G4','permanently_discontinue'],['serious_neurological_irae_grade',1,'SERIOUS_NEUROLOGICAL_IRAE','permanently_discontinue'],['myocarditis_grade',2,'MYOCARDITIS_G2_PLUS','permanently_discontinue'],['infusion_reaction_grade',1,'INFUSION_REACTION_G1_G2','withhold']])test(a,f+' '+n,{[f]:n},has(id,t,'atezolizumab'));
test(a,'Recurrent pancreatitis any grade',{recurrent_pancreatitis:true},has('RECURRENT_PANCREATITIS','permanently_discontinue','atezolizumab'));
for(const n of [1.51,3])test(a,'Immune nephritis hold '+n,{creatinine_ratio_baseline_or_uln:n,renal_event_context:'suspected_immune'},has('NEPHRITIS_G2','withhold','atezolizumab'));
test(a,'Immune nephritis ratio1.5 not over threshold',{creatinine_ratio_baseline_or_uln:1.5,renal_event_context:'suspected_immune'},lacks('NEPHRITIS_G2'));
test(a,'Immune nephritis ratio3.01 stop',{creatinine_ratio_baseline_or_uln:3.01,renal_event_context:'suspected_immune'},has('NEPHRITIS_G3_G4','permanently_discontinue','atezolizumab'));
for(const renal_event_context of [undefined,'unknown','other_or_baseline'])test(a,'Raised creatinine not automatically immune '+renal_event_context,{creatinine_ratio_baseline_or_uln:4,...(renal_event_context?{renal_event_context}:{})},q=>{review('NEPHRITIS_ATTRIBUTION')(q);lacks('NEPHRITIS_G3_G4')(q)});
test(a,'Restart always reviewed',{immune_restart_requested:true},review('IMMUNE_RESTART_REVIEW'));
test(a,'Supplement rows accurately attributed',{},q=>{for(const id of ['PERICARDIAL_G1','PERICARDIAL_G2_PLUS','SUSPECTED_HLH'])assert(q.p.rule_engine.rules.find(r=>r.rule_id===id).source.url.includes('ema.europa.eu'));});
// Bevacizumab/paclitaxel: exact source schedule and deliberately distinct dose systems.
test(b,'Source schedule and ladder',{},q=>{let p=q.p.treatment_phases[0];assert.equal(p.cycle_length_days,28);assert.deepEqual(p.administration.map(x=>[x.drug,x.dose.value,x.days]),[['bevacizumab',10,[1,15]],['paclitaxel',80,[1,8,15]]]);assert.deepEqual(q.p.dose_levels.map(x=>x.dose_mg_m2),[80,65,50]);});
test(b,'Baseline ANC1.49 exclusion',{assessment_stage:'baseline',anc:1.49},has('EXCLUSION_ANC','contraindicated'));
test(b,'Ongoing ANC1.49 not baseline exclusion',{assessment_stage:'on_treatment',anc:1.49},lacks('EXCLUSION_ANC'));
for(const n of [.5,.75,.99])test(b,'Intermediate ANC'+n,{anc:n},has('ANC_05_099','delay','paclitaxel'));
test(b,'ANC decimal gap',{anc:.995},review('ANC_DECIMAL_GAP'));
for(const n of [70,89])test(b,'Intermediate platelets'+n,{platelets:n},has('PLT_70_90','delay','paclitaxel'));
test(b,'Platelets90 overlap',{platelets:90},review('PLT_90_OVERLAP'));
test(b,'Platelets90.1 no overlap',{platelets:90.1},lacks('PLT_90_OVERLAP'));
for(const n of [0,69])test(b,'Low platelets '+n,{platelets:n},has('PLT_LT70','delay_then_dose_reduce','paclitaxel'));
for(const n of [0,6])test(b,'Low ANC less7days '+n,{anc:.4,anc_below_05_days:n},has('ANC_LT05_DURATION','withhold','paclitaxel'));
test(b,'Low ANC7days one level',{anc:.4,anc_below_05_days:7},has('ANC_LT05_7D','delay_then_dose_reduce','paclitaxel'));
for(const n of [1.26,2])test(b,'Hep60 band '+n,{alt_uln_multiple:9.99,bilirubin_uln_multiple:n},review('HEP_BILI_125_2'));
for(const n of [2.01,5])test(b,'Hep40 band '+n,{alt_uln_multiple:9.99,bilirubin_uln_multiple:n},review('HEP_BILI_2_5'));
for(const n of [1.255,2.005])test(b,'Hep decimal gap '+n,{alt_uln_multiple:1,bilirubin_uln_multiple:n},review('HEP_DECIMAL_GAP'));
test(b,'Hep contraindication ALT10',{alt_uln_multiple:10,bilirubin_uln_multiple:1.5},q=>{has('HEP_CONTRA','contraindicated','paclitaxel')(q);lacks('HEP_BILI_125_2')(q)});
test(b,'Hep contraindication bilirubin>5',{alt_uln_multiple:1,bilirubin_uln_multiple:5.01},q=>{has('HEP_CONTRA','contraindicated','paclitaxel')(q);lacks('HEP_BILI_2_5')(q)});
test(b,'Neuropathy2 decrement review',{neuropathy_grade:2},review('NEURO_G2'));
for(const n of [3,4])test(b,'Neuropathy'+n+' stops',{neuropathy_grade:n},has('NEURO_G3_PLUS','discontinue','paclitaxel'));
test(b,'Delay14 no >14 stop',{paclitaxel_delay_days:14},lacks('PACLITAXEL_DELAY_GT14'));
test(b,'Delay15 stops',{paclitaxel_delay_days:15},has('PACLITAXEL_DELAY_GT14','discontinue','paclitaxel'));
test(b,'Intolerable after2 reductions',{intolerant_after_two_reductions:true},has('PACLITAXEL_REDUCTIONS_EXHAUSTED','discontinue','paclitaxel'));
test(b,'Dipstick2plus quantify no automatic hold',{urine_dipstick:'2_3'},review('PROTEIN_SCREEN_2_3'));
test(b,'Spot1gL needs 24h',{urine_protein_g_l:1},review('PROTEIN_SPOT_GE1'));
test(b,'Dipstick4plus holds',{urine_dipstick:'4'},has('PROTEIN_4PLUS','withhold','bevacizumab'));
test(b,'Protein2g exact no hold',{urine_protein_g_24h:2},lacks('PROTEIN_GT2'));
for(const n of [2.01,4])test(b,'Protein quantitative hold '+n,{urine_protein_g_24h:n},has('PROTEIN_GT2','withhold','bevacizumab'));
test(b,'Protein>4 stops only',{urine_protein_g_24h:4.01},q=>{has('PROTEIN_GT4','discontinue','bevacizumab')(q);lacks('PROTEIN_GT2')(q)});
for(const f of ['grade4_proteinuria','tracheoesophageal_fistula','arterial_thromboembolism','hypertensive_crisis','pres_suspected','necrotising_fasciitis'])test(b,f+' stops',{[f]:true},has('BEV_'+f.toUpperCase(),'discontinue','bevacizumab'));
test(b,'Grade2to3 BP review',{hypertension_status:'grade2_3'},review('HTN_G2_G3_REVIEW'));
test(b,'Uncontrolled BP hold',{hypertension_status:'uncontrolled_symptomatic'},has('HTN_UNCONTROLLED','withhold','bevacizumab'));
test(b,'Persistent3or4 BP stops',{hypertension_status:'grade4_persistent3'},has('HTN_GRADE4','discontinue','bevacizumab'));
for(const [field,edge,id] of [['days_since_major_surgery',28,'SURGERY_AFTER'],['days_until_major_surgery',28,'SURGERY_BEFORE_MAJOR'],['days_until_minor_surgery',7,'SURGERY_BEFORE_MINOR']]){test(b,field+' just inside',{[field]:edge-1},has(id,'withhold','bevacizumab'));test(b,field+' exact boundary no automatic time hold',{[field]:edge},lacks(id));}
test(b,'Unhealed wound beyond28days',{days_since_major_surgery:35,wound_not_healed:true},has('WOUND_HEALING','withhold','bevacizumab'));
test(b,'Antibody alone no neuropathy dose change',{treatment_phase:'bevacizumab_only',neuropathy_grade:2},lacks('NEURO_G2'));
test(b,'Paclitaxel alone no bev protein rule',{treatment_phase:'paclitaxel_only',urine_protein_g_24h:5},lacks('PROTEIN_GT4'));
const report={checked:'2026-10-25',mode,scope:'Independent source-derived software cases; not clinical sign-off',total:rows.length,passed:rows.filter(x=>x.pass).length,failed:rows.filter(x=>!x.pass).length,results:rows};fs.writeFileSync(path.join(__dirname,mode+'-results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({mode,total:report.total,passed:report.passed,failed:report.failed}));for(const x of rows.filter(x=>!x.pass))console.log(x.code+' '+x.name+': '+x.error);process.exitCode=report.failed?1:0;
