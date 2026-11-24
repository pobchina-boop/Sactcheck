'use strict';
// External review drafts only. Expectations come from the two separately read
// NCCP tables, current EMA SmPC, and the existing application/UI contracts.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const dir=__dirname,root=process.env.SACT_REPO||path.resolve(dir,'../Sactcheck');
const E=require(path.join(root,'js/assessment-engine')),D=require(path.join(root,'js/protocol-dose-schedule')),
  L=require(path.join(root,'js/local-lab-profile')),V=require(path.join(root,'js/protocol-validator'));
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'pld-draft-manifest.json')));
const codes=['00205','00462'],comp='pegylated_liposomal_doxorubicin';
const ps=Object.fromEntries(codes.map(c=>[c,JSON.parse(fs.readFileSync(manifest.codes[c].draft_path))]));
const results=[];
function check(code,name,fn){try{fn();results.push({code,name,passed:true});}catch(e){results.push({code,name,passed:false,error:e.stack});}}
function test(code,name,input,expected=[],absent=[],verify=()=>{}){
  let observed={};
  check(code,name,()=>{const p=ps[code],r=E.assess(p,input),m=D.buildModificationModel(p,r),ids=r.findings.filter(x=>!x.domainAssessment).map(x=>x.ruleId);
    observed={actual_rule_ids:ids,action:r.actionType,complete:r.complete,coverage_complete:r.coverageComplete,quantified_dose:m.hasQuantified};
    assert.deepEqual(r.errors,[]);assert.deepEqual(r.invalid,[]);
    for(const id of expected)assert(ids.includes(id),`${id} absent; actual ${ids.join(', ')}`);
    for(const id of absent)assert(!ids.includes(id),`${id} unexpectedly triggered; actual ${ids.join(', ')}`);
    const authoredIds=new Set(p.rule_engine.rules.map(x=>x.id));
    for(const f of r.findings.filter(x=>authoredIds.has(x.ruleId)))assert.deepEqual(f.action.components,[comp]);
    assert.equal(m.hasQuantified,false,'No automatic modified dose from incomplete/history-dependent data');
    for(const row of m.rows)assert.equal(row.componentId,comp);
    verify(r,m);
  });
  Object.assign(results.at(-1),{input,expected_rule_ids:expected,forbidden_rule_ids:absent,...observed});
}
const action=kind=>(r)=>assert.equal(r.actionType,kind);
const visibleReview=id=>(r,m)=>{assert.equal(r.findings.find(f=>f.ruleId===id).action.block_numeric_dose,true);assert(m.rows.some(row=>row.allActions.some(a=>a.ruleId===id)),id+' must appear in actual dose-actions model');};
const partial=(needed=[])=>(r)=>{assert.equal(r.complete,false);assert.equal(r.coverageComplete,false);assert.equal(r.partialAssessment,true);for(const f of needed)assert(r.unassessed.some(x=>x.id===f),f+' remains unassessed');assert.match(r.recommendation,/not.*overall|not.*clearance|unassessed|not assessed|context/i);};
const hepatic=(code,band)=>(code==='00205'?'OF590_00205_PLD_BILI_':'KS_PLD_BILI_')+band;
for(const c of codes){
  check(c,'Strict protocol schema and truthful source evidence',()=>{
    const p=ps[c],v=V.validate(p,{strict:true});assert.equal(v.valid,true,JSON.stringify(v));assert.deepEqual(v.warnings,[]);
    assert.equal(p.protocol_id,c==='00205'?'nccp-00205-v8':'nccp-00462-v4');
    assert.equal(p.metadata.source_evidence.binary_pdf_verified,false);assert.equal(p.metadata.source_evidence.visual_table_inspection_verified,false);
    assert.equal(p.metadata.validation.clinical_use_authorised,false);assert.equal(p.metadata.validation.consultant_reviewed,false);assert.equal(p.metadata.validation.oncology_pharmacy_reviewed,false);
    for(const r of p.rule_engine.rules){assert.equal(r.source.checked_date,'2026-11-18');assert.match(r.source.evidence_kind,/extracted_text/);assert.equal(r.action.block_numeric_dose,true);assert.deepEqual(r.action.components,[comp]);}
  });
  test(c,'Empty assessment never clears treatment',{},[],[],r=>assert(!['proceed','proceed_with_caution'].includes(r.actionType)));
  test(c,'Stage only remains partial',{assessment_stage:'ongoing'},[],[],partial(['anc_x10e9_l','platelets_x10e9_l']));
  test(c,'Normal ANC with missing platelets remains partial',{assessment_stage:'ongoing',anc_x10e9_l:1.8},[],[],partial(['platelets_x10e9_l','bilirubin_umol_l','hypersensitivity']));
  test(c,'Normal counts with missing organ/toxicity data remain partial',{assessment_stage:'ongoing',anc_x10e9_l:1.8,platelets_x10e9_l:100},[],[],partial(['bilirubin_umol_l','lvef_percent','ppe_grade','hypersensitivity']));
  test(c,'Hypersensitivity excludes PLD',{hypersensitivity:true},['PLD_HYPERSENSITIVITY'],[],action('contraindicated'));
  test(c,'Pregnancy uses current product benefit-risk review, not invented NCCP exclusion',{pregnancy:true},['PLD_PREGNANCY'],[],action('consultant_review'));
  test(c,'Breastfeeding must cease before PLD',{breastfeeding:true},['PLD_BREASTFEEDING'],[],action('withhold'));
  test(c,'Current febrile neutropenia holds despite recovered numeric counts',{febrile_neutropenia:true,anc_x10e9_l:1.8,platelets_x10e9_l:100},['PLD_ACUTE_FN'],[],action('withhold'));
  test(c,'Current infection review is not a fixed future FN reduction',{active_infection:true},['PLD_ACTIVE_INFECTION'],[],visibleReview('PLD_ACTIVE_INFECTION'));
  test(c,'Wrong formulation stops administration',{correct_pegylated_formulation:false},['PLD_WRONG_FORMULATION'],[],action('withhold'));
  for(const [v,id]of [[20,hepatic(c,'20_50')],[50,hepatic(c,'20_50')],[50.001,'PLD_HEP_GAP'],[50.999,'PLD_HEP_GAP'],[51,hepatic(c,'51_86')],[86,hepatic(c,'51_86')],[86.001,'PLD_HEP_GT86']])
    test(c,'Absolute bilirubin source boundary '+v,{bilirubin_umol_l:v},[id],[],visibleReview(id));
  test(c,'Below20 is not a hepatic dose-reduction row',{bilirubin_umol_l:19.999},[],[hepatic(c,'20_50'),hepatic(c,'51_86'),'PLD_HEP_GT86','PLD_HEP_GAP']);
  test(c,'ULN-only API input does not assume local ULN20',{bilirubin_uln_multiple:3},['PLD_HEP_ULN_ONLY'],[hepatic(c,'20_50'),hepatic(c,'51_86'),'PLD_HEP_GT86']);
  test(c,'Selected absolute band supports a qualitative partial assessment',{pld_bilirubin_band:'20_50'},[hepatic(c,'20_50')],[],visibleReview(hepatic(c,'20_50')));
  test(c,'Band disagreement cannot select a hepatic percentage',{bilirubin_umol_l:30,pld_bilirubin_band:'51_86'},['PLD_BILI_CONFLICT_20_50'],[hepatic(c,'20_50'),hepatic(c,'51_86')],visibleReview('PLD_BILI_CONFLICT_20_50'));
  test(c,'Normal absolute bilirubin conflicts with selected high band',{bilirubin_umol_l:12,pld_bilirubin_band:'20_50'},['PLD_BILI_CONFLICT_lt20'],[hepatic(c,'20_50'),hepatic(c,'51_86')]);
  test(c,'High absolute band conflicts with lower selected band',{bilirubin_umol_l:60,pld_bilirubin_band:'20_50'},['PLD_BILI_CONFLICT_51_86'],[hepatic(c,'20_50'),hepatic(c,'51_86')]);
  test(c,'Discordant high absolute bilirubin retains restriction',{bilirubin_umol_l:90,pld_bilirubin_band:'lt20'},['PLD_HEP_GT86','PLD_BILI_CONFLICT_gt86'],[],action('contraindicated'));
  test(c,'Original and current doses never silently replace the prescription',{bilirubin_umol_l:30,original_pld_mg_m2:40,current_pld_mg_m2:12},[hepatic(c,'20_50'),'PLD_HEP_CURRENT_LOWER_20_50'],[],visibleReview(hepatic(c,'20_50')));
  test(c,'Lower current dose stays reduced in51–86band',{bilirubin_umol_l:60,current_pld_mg_m2:5},[hepatic(c,'51_86'),'PLD_HEP_CURRENT_LOWER_51_86'],[],visibleReview('PLD_HEP_CURRENT_LOWER_51_86'));
  test(c,'Concurrent liver and two-week PPE paths are not multiplied',{bilirubin_umol_l:30,ppe_grade:2,toxicity_delay_weeks:2},[hepatic(c,'20_50'),'PPE_GRADE_TWO_WEEK_GRADE12'],[],visibleReview('PPE_GRADE_TWO_WEEK_GRADE12'));
  test(c,'Renal impairment is not an invented dose band',{crcl_ml_min:8},['PLD_RENAL'],[],partial(['bilirubin_umol_l','anc_x10e9_l']));
  test(c,'Haemodialysis no expected dose adjustment remains domain-specific',{haemodialysis:true},['PLD_DIALYSIS'],[],partial(['bilirubin_umol_l','anc_x10e9_l']));
  for(const field of ['ppe_grade','stomatitis_grade','mucositis_grade']){
    const prefix=field.toUpperCase();
    test(c,field+' grade1 missing delay cannot redose',{[field]:1},[prefix+'_DURATION_MISSING'],[prefix+'_GRADE1_NO_PRIOR']);
    for(const delay of [0,1]){
      test(c,field+' grade1 delay'+delay+' missing prior severity',{[field]:1,toxicity_delay_weeks:delay},[prefix+'_GRADE1_HISTORY_MISSING'],[prefix+'_GRADE1_NO_PRIOR']);
      test(c,field+' grade1 delay'+delay+' prior severe toxicity',{[field]:1,toxicity_delay_weeks:delay,prior_grade3_4_skin_or_stomatitis:true},[prefix+'_GRADE1_PRIOR_SEVERE'],[prefix+'_GRADE1_NO_PRIOR'],action('delay'));
      test(c,field+' grade1 delay'+delay+' confirmed no severe history',{[field]:1,toxicity_delay_weeks:delay,prior_grade3_4_skin_or_stomatitis:false},[prefix+'_GRADE1_NO_PRIOR'],[prefix+'_GRADE1_PRIOR_SEVERE'],partial(['anc_x10e9_l']));
      for(const grade of [2,3,4])test(c,field+' grade'+grade+' delay'+delay+' requires another week',{[field]:grade,toxicity_delay_weeks:delay},[prefix+'_GRADE2PLUS_DELAY'],[prefix+'_TWO_WEEK_GRADE34'],action('delay'));
    }
    for(const grade of [1,2])test(c,field+' two-week grade'+grade+' requires prescription decision',{[field]:grade,toxicity_delay_weeks:2},[prefix+'_TWO_WEEK_GRADE12'],[prefix+'_TWO_WEEK_GRADE34'],visibleReview(prefix+'_TWO_WEEK_GRADE12'));
    for(const grade of [3,4])test(c,field+' two-week grade'+grade+' discontinues',{[field]:grade,toxicity_delay_weeks:2},[prefix+'_TWO_WEEK_GRADE34'],[],action('discontinue'));
    test(c,field+' grade0 after severe two-week event retains stop',{[field]:0,toxicity_delay_weeks:3,grade3_4_toxicity_at_two_week_review:true,restart_after_toxicity:true},['PLD_PRIOR_DISCONTINUATION','PLD_RESTART_HISTORY_REVIEW'],[],action('discontinue'));
    test(c,field+' beyond two-week table is not an automatic numeric restart',{[field]:1,toxicity_delay_weeks:3},[prefix+'_OUTSIDE_DELAY'],[],visibleReview(prefix+'_OUTSIDE_DELAY'));
  }
  test(c,'Documented prior discontinuation dominates a current grade1 proceed row',{pld_discontinued_previously:true,ppe_grade:1,toxicity_delay_weeks:0,prior_grade3_4_skin_or_stomatitis:false},['PLD_PRIOR_DISCONTINUATION','PPE_GRADE_GRADE1_NO_PRIOR'],[],action('discontinue'));
  test(c,'Restart request with missing history is not clearance',{restart_after_toxicity:true,ppe_grade:0,stomatitis_grade:0},['PLD_RESTART_HISTORY_REVIEW'],[],visibleReview('PLD_RESTART_HISTORY_REVIEW'));
  test(c,'Exactly450 planned cumulative exposure does not cross >450',{planned_cumulative_anthracycline_mg_m2:450},[],['PLD_CUMULATIVE_ECHO_DUE']);
  test(c,'Planned exposure450.001 mandates LVEF before this dose',{planned_cumulative_anthracycline_mg_m2:450.001},['PLD_CUMULATIVE_ECHO_DUE'],[],action('withhold'));
  test(c,'Crossing450 from a lower prior total still mandates LVEF',{cumulative_anthracycline_mg_m2:449,planned_cumulative_anthracycline_mg_m2:469,lvef_checked_for_next_dose:false},['PLD_CUMULATIVE_ECHO_DUE'],[],action('withhold'));
  test(c,'Already at450 requires assessment before any further dose',{cumulative_anthracycline_mg_m2:450},['PLD_CUMULATIVE_ECHO_DUE','PLD_CUMULATIVE_RECONCILE'],[],action('withhold'));
  test(c,'Completed LVEF check above450 requires result review, not automatic cessation',{planned_cumulative_anthracycline_mg_m2:500,lvef_checked_for_next_dose:true},['PLD_CUMULATIVE_ECHO_DONE'],['PLD_CUMULATIVE_ECHO_DUE'],action('consultant_review'));
  test(c,'Cardiomyopathy is a caution, not an inherited exclusion',{preexisting_cardiomyopathy_or_chf:true},['PLD_CARDIAC_RISK_preexisting_cardiomyopathy_or_chf'],[],action('consultant_review'));
  for(const risk of ['prior_mediastinal_radiotherapy','concurrent_cyclophosphamide'])test(c,risk+' increases cardiac concern below450',{[risk]:true,planned_cumulative_anthracycline_mg_m2:200},['PLD_CARDIAC_RISK_'+risk],['PLD_CUMULATIVE_ECHO_DUE'],action('consultant_review'));
  test(c,'LVEF44.99 invokes SmPC cardiomyopathy review without invented fixed cessation',{lvef_percent:44.99},['PLD_LVEF_LOW'],[],action('consultant_review'));
  test(c,'LVEF45 does not cross SmPC example <45',{lvef_percent:45},[],['PLD_LVEF_LOW']);
  test(c,'LVEF decline prompts review without borrowing a20point stop',{lvef_reduction_from_baseline_percent:1},['PLD_LVEF_FALL'],[],action('consultant_review'));
  test(c,'No LVEF decline does not trigger decline rule',{lvef_reduction_from_baseline_percent:0},[],['PLD_LVEF_FALL']);
  test(c,'Other grade2 toxicity has no invented fixed reduction',{other_nonhaem_toxicity_grade:2},['PLD_OTHER_TOXICITY'],[],visibleReview('PLD_OTHER_TOXICITY'));
  test(c,'Symptomatic cardiac dysfunction withholds',{symptomatic_cardiac_dysfunction:true},['PLD_CARDIAC_SYMPTOMS'],[],action('withhold'));
  test(c,'Baseline missing completed ECG remains unresolved',{assessment_stage:'baseline',baseline_ecg_completed:false},['PLD_BASELINE_baseline_ecg_completed'],[],action('consultant_review'));
  test(c,'Active infusion reaction holds despite a prior-reaction plan',{current_infusion_reaction:true,prior_infusion_reaction:true},['PLD_INFUSION_REACTION_NOW','PLD_PRIOR_REACTION'],[],action('withhold'));
  test(c,'Historical infusion reaction prompts supervised plan',{prior_infusion_reaction:true},['PLD_PRIOR_REACTION'],['PLD_INFUSION_REACTION_NOW'],visibleReview('PLD_PRIOR_REACTION'));
  test(c,'Infusion grade without timing cannot imply immediate rechallenge',{infusion_reaction_grade:1},['PLD_INFUSION_GRADE_REVIEW'],[],visibleReview('PLD_INFUSION_GRADE_REVIEW'));
  test(c,'Suspected drug-induced ILD interrupts and investigates',{suspected_ild:true},['PLD_ILD_SUSPECTED'],[],action('withhold'));
  test(c,'Confirmed drug-induced ILD discontinues',{confirmed_ild:true},['PLD_ILD_CONFIRMED'],[],action('discontinue'));
  const settings={altUln:40,astUln:40,bilirubinUln:24,alpUln:100,lftProfile:'custom'};
  const raw=(value)=>{const def={id:'bilirubin_uln_multiple',...ps[c].input_definitions.bilirubin_uln_multiple};return {...L.derivedActualFields(def,{bilirubin:value}),bilirubin_uln_multiple:L.calculate(def,{bilirubin:value},settings).ratio};};
  check(c,'One raw bilirubin UI control retains absolute and actual localULN',()=>{const defs=ps[c].input_definitions;assert.equal(defs.bilirubin_umol_l.ui_derived_from,'bilirubin_uln_multiple');assert.equal(defs.bilirubin_umol_l.visible,false);assert.deepEqual(defs.bilirubin_uln_multiple.derived_actual_fields,{bilirubin:'bilirubin_umol_l'});const visible=Object.entries(defs).filter(([,v])=>!v.ui_derived_from).map(([k])=>k);assert(visible.includes('bilirubin_uln_multiple'));assert(!visible.includes('bilirubin_umol_l'));assert.equal(Number(raw(50.5).bilirubin_umol_l),50.5);assert.equal(raw(50.5).bilirubin_uln_multiple,50.5/24);});
  test(c,'Raw bilirubin50.5 with localULN24 stays source gap',raw(50.5),['PLD_HEP_GAP'],[hepatic(c,'20_50'),hepatic(c,'51_86')]);
  test(c,'Raw bilirubin20 does not shift to localULN24',raw(20),[hepatic(c,'20_50')],[],visibleReview(hepatic(c,'20_50')));
  const demo=Object.fromEntries(Object.entries(ps[c].input_definitions).map(([k,v])=>[k,v.demo_value]));
  test(c,'Demo defaults cannot clear an absolute hepatic gap',{...demo,bilirubin_umol_l:50.5},['PLD_HEP_GAP'],[hepatic(c,'20_50'),hepatic(c,'51_86')]);
  test(c,'Demo current recovery cannot erase known previous discontinuation',{...demo,pld_discontinued_previously:true},['PLD_PRIOR_DISCONTINUATION'],[],action('discontinue'));
}

// 00205: preserve its overlapping severe platelet row and paired recovery targets.
for(const [v,id]of [[.499,'PLD_ANC_SEVERE'],[.5,'PLD_ANC_LOW'],[.999,'PLD_ANC_LOW'],[1,'PLD_ANC_LOW'],[1.499,'PLD_ANC_LOW']])
  test('00205','50mg ANC boundary '+v,{anc_x10e9_l:v},[id],[],action('withhold'));
for(const v of [1.5,1.9])test('00205','50mg printed full-row ANC '+v,{anc_x10e9_l:v,platelets_x10e9_l:75},[],['PLD_ANC_LOW','PLD_ANC_SEVERE','PLD_ANC_ABOVE_PRINTED_ROW']);
test('00205','ANC1.901 is outside printed full row without being labelled pathological',{anc_x10e9_l:1.901},['PLD_ANC_ABOVE_PRINTED_ROW'],['PLD_ANC_LOW'],visibleReview('PLD_ANC_ABOVE_PRINTED_ROW'));
for(const [v,id]of [[24.999,'PLD_PLATELETS_SEVERE'],[25,'PLD_PLATELETS_LOW'],[49.999,'PLD_PLATELETS_LOW'],[50,'PLD_PLATELETS_LOW'],[74,'PLD_PLATELETS_LOW'],[74.5,'PLD_PLATELETS_FRACTION_GAP']])
  test('00205','50mg platelet boundary '+v,{platelets_x10e9_l:v},[id]);
test('00205','Severe platelet row suppresses ordinary low ANC row',{anc_x10e9_l:1,platelets_x10e9_l:20},['PLD_PLATELETS_SEVERE'],['PLD_ANC_LOW'],action('withhold'));
test('00205','Severe ANC row suppresses ordinary low platelet row',{anc_x10e9_l:.4,platelets_x10e9_l:40},['PLD_ANC_SEVERE'],['PLD_PLATELETS_LOW'],action('withhold'));
test('00205','Recovered ANC cannot clear platelets below75',{anc_x10e9_l:1.8,platelets_x10e9_l:60,previous_severe_cytopenia:true},['PLD_PLATELETS_LOW','PLD_PAST_SEVERE_COUNTS'],[],action('withhold'));
test('00205','Recovered counts retain severe-history reduction OR growth-factor choice',{anc_x10e9_l:1.8,platelets_x10e9_l:100,previous_severe_cytopenia:true},['PLD_PAST_SEVERE_COUNTS'],[],visibleReview('PLD_PAST_SEVERE_COUNTS'));
test('00205','Severe count history and51–86hepatic band cannot compound percentages',{previous_severe_cytopenia:true,bilirubin_umol_l:60},['PLD_PAST_SEVERE_COUNTS','PLD_HEP_CONCURRENT_51_86',hepatic('00205','51_86')],[],visibleReview('PLD_HEP_CONCURRENT_51_86'));
test('00205','ECOG4 exceeds every listed indication',{ecog:4},['PLD_ECOG4']);
for(const context of ['breast','ovarian','endometrial'])test('00205','ECOG3 allowed source context '+context,{ecog:3,indication_context:context},[],['PLD_ECOG3_SARCOMA','PLD_ECOG4']);
test('00205','Sarcoma ECOG3 exceeds distinct0–2range',{ecog:3,indication_context:'sarcoma'},['PLD_ECOG3_SARCOMA']);
test('00205','ECOG3 without context needs indication review',{ecog:3},['PLD_ECOG3_CONTEXT']);
check('00205','Shared breast/gynaecology/sarcoma content retained and 50mg calendar kept',()=>{const p=ps['00205'],b=JSON.parse(fs.readFileSync(path.join(root,manifest.codes['00205'].repository_relative_path)));for(const k of ['indications','eligibility','exclusions','monitoring','supportive_care','treatment'])assert.deepEqual(p[k],b[k],k+' changed unexpectedly');assert.deepEqual(p.metadata.tumour_groups,['Breast','Gynaecology','Sarcoma']);const m=D.buildModel(p);assert.equal(m.allPhases.length,1);assert.equal(m.allPhases[0].cycleLength,28);assert.equal(m.allPhases[0].components[0].dose,'50 mg/m²');assert.match(m.allPhases[0].duration,/Typically 6.*continue/i);assert.equal(p.input_definitions.completed_cycles,undefined);});

// 00462: separate low-dose Kaposi table, not 00205's recovery algorithm.
for(const [v,id]of [[.499,'KS_COUNTS_DELAY'],[.5,'KS_COUNTS_50_REVIEW'],[.99,'KS_COUNTS_50_REVIEW'],[.995,'KS_ANC_FRACTION_GAP']])
  test('00462','20mg ANC boundary '+v,{anc_x10e9_l:v},[id]);
for(const [v,id]of [[49.999,'KS_COUNTS_DELAY'],[50,'KS_COUNTS_50_REVIEW'],[74,'KS_COUNTS_50_REVIEW'],[74.5,'PLD_PLATELETS_FRACTION_GAP']])
  test('00462','20mg platelet boundary '+v,{platelets_x10e9_l:v},[id]);
test('00462','Counts exactly1 and75 reach this regimen full row',{anc_x10e9_l:1,platelets_x10e9_l:75},['KS_COUNTS_BOTH_RECOVERED'],['KS_COUNTS_DELAY','KS_COUNTS_50_REVIEW','KS_ANC_FRACTION_GAP']);
test('00462','Severe ANC delay wins over intermediate platelets',{anc_x10e9_l:.4,platelets_x10e9_l:60},['KS_COUNTS_DELAY','KS_COUNTS_50_REVIEW'],[],action('delay'));
test('00462','Severe platelets delay wins over intermediate ANC',{anc_x10e9_l:.7,platelets_x10e9_l:40},['KS_COUNTS_DELAY','KS_COUNTS_50_REVIEW'],[],action('delay'));
test('00462','ANC decimal gap is not silently 50percent',{anc_x10e9_l:.995,platelets_x10e9_l:100},['KS_ANC_FRACTION_GAP'],['KS_COUNTS_50_REVIEW','KS_COUNTS_BOTH_RECOVERED']);
test('00462','Platelet decimal gap is not silently 50percent',{anc_x10e9_l:1,platelets_x10e9_l:74.5},['PLD_PLATELETS_FRACTION_GAP'],['KS_COUNTS_50_REVIEW','KS_COUNTS_BOTH_RECOVERED']);
test('00462','Prior reduced dose is retained after counts recover',{anc_x10e9_l:1.8,platelets_x10e9_l:100,prior_count_related_dose_reduction:true},['KS_PRIOR_COUNT_REDUCTION','KS_COUNTS_BOTH_RECOVERED'],[],action('consultant_review'));
test('00462','ECOG3 is within the current source range',{ecog:3},[],['PLD_ECOG4']);
test('00462','ECOG4 outside range',{ecog:4},['PLD_ECOG4']);
test('00462','CD4 exact200 is outside source <200',{cd4_cells_mm3:200},['KS_CD4_OUTSIDE_INDICATION']);
test('00462','CD4199.99 is below200',{cd4_cells_mm3:199.99},[],['KS_CD4_OUTSIDE_INDICATION']);
test('00462','Disease extent outside indication needs review',{extensive_mucocutaneous_or_visceral_ks:false},['KS_DISEASE_EXTENT']);
test('00462','Product restriction on effective local therapy',{ks_effectively_treatable_local_or_interferon:true},['KS_LOCAL_THERAPY_RESTRICTION'],[],action('contraindicated'));
test('00462','Five completed cycles do not trigger the six-cycle maximum',{completed_cycles:5},[],['KS_COURSE_MAX6']);
test('00462','Six completed cycles cannot automatically schedule a seventh',{completed_cycles:6},['KS_COURSE_MAX6'],[],action('withhold'));
test('00462','Selected14day option requires separate confirmed calendar',{selected_cycle_interval_days:14},['KS_SELECTED14'],[],visibleReview('KS_SELECTED14'));
test('00462','Standard21day option does not add14day schedule',{selected_cycle_interval_days:21},[],['KS_SELECTED14']);
test('00462','NCCP versus EMA administration difference remains unresolved until reviewed',{assessment_stage:'ongoing'},['KS_INFUSION_SOURCE_CONFLICT'],[],visibleReview('KS_INFUSION_SOURCE_CONFLICT'));
test('00462','Reconciled administration does not erase active reaction',{assessment_stage:'ongoing',administration_source_reconciled:true,current_infusion_reaction:true},['PLD_INFUSION_REACTION_NOW'],['KS_INFUSION_SOURCE_CONFLICT'],action('withhold'));
check('00462','20mg21day reference, explicit alternative and max6 not borrowed from00205',()=>{const p=ps['00462'],m=D.buildModel(p);assert.equal(m.allPhases.length,1);assert.equal(m.allPhases[0].cycleLength,21);assert.equal(m.allPhases[0].components[0].dose,'20 mg/m²');assert.match(m.allPhases[0].duration,/Maximum 6/);assert.equal(p.treatment.alternative_cycle_intervals[0].cycle_length_days,14);assert.equal(p.treatment.alternative_cycle_intervals[0].selection_required,true);assert.equal(p.input_definitions.previous_severe_cytopenia,undefined);assert(!p.rule_engine.rules.some(r=>r.id==='PLD_PAST_SEVERE_COUNTS'));assert(!JSON.stringify(p.rule_engine.rules).includes('37.5'));assert.equal(p.indications[0].indication_id,'00462-sarcoma');assert.equal(p.indications[0].source_indication_id,'00462a');assert(p.monitoring.some(x=>/LDH/.test(x)));});
for(const c of codes)check(c,'Repository protocol bytes unchanged during external drafting',()=>{const file=path.join(root,manifest.codes[c].repository_relative_path);assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),manifest.codes[c].baseline_sha256);});
const ruleCoverage=Object.fromEntries(codes.map(c=>{const seen=new Set(results.filter(x=>x.code===c).flatMap(x=>x.actual_rule_ids||[]));const authored=ps[c].rule_engine.rules.map(r=>r.id);return[c,{authored:authored.length,triggered:authored.filter(id=>seen.has(id)).length,untriggered:authored.filter(id=>!seen.has(id))}];}));
const report={status:results.every(x=>x.passed)?'passed':'failed',source_checked_date:'2026-11-18',scope:'External drafts assessed by actual existing engine, dose-action renderer, strict validator and raw-lab adapter. Visual source tables, browser, publication and independent clinical approval are unverified.',passed:results.filter(x=>x.passed).length,failed:results.filter(x=>!x.passed).length,rule_coverage:ruleCoverage,cases:results};
fs.writeFileSync(path.join(dir,'pld-source-case-results.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,passed:report.passed,failed:report.failed,failures:results.filter(x=>!x.passed)},null,2));process.exitCode=report.failed?1:0;
