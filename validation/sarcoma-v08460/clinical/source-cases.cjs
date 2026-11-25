'use strict';
// Expectations transcribed from current NCCP source tables; use the actual
// assessment engine, dose model and raw-laboratory adapter, not a test evaluator.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const dir=__dirname,root=process.env.SACT_REPO||path.resolve(dir,'../../..');
const E=require(path.join(root,'js/assessment-engine')),D=require(path.join(root,'js/protocol-dose-schedule')),L=require(path.join(root,'js/local-lab-profile'));
const codes=['00500','00391','00392','00501','00511'];
const ps=Object.fromEntries(codes.map(code=>[code,JSON.parse(fs.readFileSync(path.join(root,'protocols/sarcoma',fs.readdirSync(path.join(root,'protocols/sarcoma')).find(f=>f.startsWith(code+'-')&&f.endsWith('.json')))))]));
const results=[];let failed=0;
function test(code,name,input,expected=[],absent=[],verify=()=>{}){
  const p=ps[code],r=E.assess(p,input),ids=r.findings.filter(f=>!f.domainAssessment).map(f=>f.ruleId);let error;
  try{assert.deepEqual(r.errors,[]);assert.deepEqual(r.invalid,[]);for(const id of expected)assert(ids.includes(id),`${id} absent (${ids.join(', ')})`);for(const id of absent)assert(!ids.includes(id),`${id} unexpectedly triggered`);verify(r,D.buildModificationModel(p,r));}catch(e){failed++;error=e.message;}
  results.push({code,name,input,expected_rule_ids:expected,forbidden_rule_ids:absent,actual_rule_ids:ids,action:r.actionType,passed:!error,...(error?{error}:{})});
}
const comp=(id,components)=>(r)=>assert.deepEqual(r.findings.find(f=>f.ruleId===id).action.components,components);
const specialist=(id)=>(r)=>{const a=r.findings.find(f=>f.ruleId===id).action;assert.equal(a.dose_calculation,'specialist_review');assert.equal(a.block_numeric_dose,true);assert.equal(a.dose,undefined);assert.equal(a.dose_mg_m2,undefined);assert.equal(a.dose_percent_of_original,undefined);};
for(const code of codes){
  test(code,'Empty assessment cannot authorise treatment',{},['STAGE_REQUIRED'],[],r=>assert(!['proceed','proceed_with_caution'].includes(r.actionType)));
  test(code,'Pregnancy source exclusion',{pregnancy:true},['PREGNANCY_EXCLUSION']);
  test(code,'Breastfeeding source exclusion',{breastfeeding:true},['BREASTFEEDING_EXCLUSION']);
  test(code,'Known allergy source exclusion',{hypersensitivity:true},['HYPERSENSITIVITY_EXCLUSION']);
  test(code,'Current infection is distinct from past-cycle history',{active_infection:true},['CURRENT_INFECTION_REVIEW']);
  const limit=['00391','00392'].includes(code)?1:2;
  test(code,'ECOG upper source boundary',{ecog:limit},[],['ECOG_REVIEW']);
  test(code,'ECOG beyond source range',{ecog:limit+1},['ECOG_REVIEW']);
  for(const [name,input,needed]of [
    ['Stage only',{assessment_phase:'day1'},['anc','platelets']],
    ['Stage and normal ANC with no platelets',{assessment_phase:'day1',anc:3},['platelets','crcl_ml_min']],
    ['Normal counts omit organ function and toxicity',{assessment_phase:'day1',anc:3,platelets:200},['crcl_ml_min','hypersensitivity']]
  ])test(code,name+' remains a partial assessment',input,[],[],r=>{assert.equal(r.complete,false);assert.equal(r.coverageComplete,false);assert.equal(r.partialAssessment,true);const unassessed=r.unassessed.map(x=>x.id);for(const f of needed)assert(unassessed.includes(f),f+' must remain unassessed');assert.match(r.recommendation,/not.*overall|not.*clearance|context|unassessed|not assessed/i);});
  for(const rule of ps[code].rule_engine.rules){
    if(['00391','00392'].includes(code) && rule.source.url!==ps[code].metadata.source_url){
      assert(require(path.join(root,'tests/helpers/ifosfamide-pair-v08462.cjs')).validate(ps[code]));
      assert.equal(new URL(rule.source.url).hostname,'assets.hpra.ie');
      assert(rule.source.page || rule.source.section);
    } else assert.equal(rule.source.url,ps[code].metadata.source_url);
    assert.equal(rule.source.checked_date,'2026-11-18');
    assert.equal(rule.action.block_numeric_dose,true);
  }
}
for(const code of ['00500','00391','00392']){
  for(const [v,id] of [[20,'DOX_BILI_20_50'],[50,'DOX_BILI_20_50'],[50.001,'DOX_BILI_DECIMAL_GAP'],[50.999,'DOX_BILI_DECIMAL_GAP'],[51,'DOX_BILI_51_86'],[86,'DOX_BILI_51_86'],[86.001,'DOX_HEPATIC_NOT_RECOMMENDED']])test(code,'Absolute bilirubin '+v,{bilirubin_umol_l:v},[id],[],specialist(id));
  test(code,'Bilirubin below20 has no hepatic reduction',{bilirubin_umol_l:19.999},[],['DOX_BILI_20_50','DOX_BILI_51_86','DOX_HEPATIC_NOT_RECOMMENDED']);
  test(code,'Child-PughC independently withholds doxorubicin',{child_pugh_c:true},['DOX_HEPATIC_NOT_RECOMMENDED'],[],comp('DOX_HEPATIC_NOT_RECOMMENDED',['doxorubicin']));
  test(code,'CrCl exact10 source gap',{crcl_ml_min:10},['DOX_CRCL_EXACT10']);
  test(code,'Doxorubicin dialysis is separate component',{haemodialysis:true},['DOX_HAEMODIALYSIS'],[],comp('DOX_HAEMODIALYSIS',['doxorubicin']));
  test(code,'Cumulative450 is review boundary',{planned_lifetime_doxorubicin_mg_m2:450},['DOX_CUMULATIVE_RISK_REVIEW'],['DOX_CUMULATIVE_LIMIT']);
  test(code,'Planned cumulative exposure beyond450 withholds',{planned_lifetime_doxorubicin_mg_m2:450.01},['DOX_CUMULATIVE_LIMIT']);
}
test('00500','Baseline LVEF49.99 below required50',{assessment_phase:'baseline',lvef_percent:49.99},['BASELINE_LVEF'],['ON_TREATMENT_LVEF_LT45']);
test('00500','Baseline LVEF50 accepted by this source',{assessment_phase:'baseline',lvef_percent:50},[],['BASELINE_LVEF']);
test('00500','On-treatment LVEF44.99 stops',{assessment_phase:'on_treatment',lvef_percent:44.99},['ON_TREATMENT_LVEF_LT45'],[],comp('ON_TREATMENT_LVEF_LT45',['doxorubicin']));
test('00500','On-treatment exact45 does not cross <45',{assessment_phase:'on_treatment',lvef_percent:45},[],['ON_TREATMENT_LVEF_LT45']);
test('00500','Ambiguous >20percent source criterion requires confirmation',{lvef_reduction_gt20_source_confirmed:true},['LVEF_DROP_CONFIRMED']);
test('00500','Age70 is not over70',{age_years:70},[],['AGE_GT70']);test('00500','Age70.01 considers60',{age_years:70.01},['AGE_GT70']);
test('00500','ANC0.999 delays independently',{anc:.999},['COUNTS_DELAY']);test('00500','ANC1 and platelets100 meet table bounds',{anc:1,platelets:100},[],['COUNTS_DELAY']);test('00500','Platelets99.99 delay',{platelets:99.99},['COUNTS_DELAY']);
test('00500','Exactly14 days does not exceed two weeks',{treatment_delay_days:14},[],['DELAY_GT14']);test('00500','More than14 days requires choice',{treatment_delay_days:14.1},['DELAY_GT14']);
test('00500','First FN considers GCSF',{febrile_neutropenia_occurrences:1},['FN_FIRST'],['FN_SECOND']);test('00500','Second FN reduces level',{febrile_neutropenia_occurrences:2},['FN_SECOND'],['FN_FIRST']);
test('00500','Prior grade3 current2 not yet recovered',{prior_nonhaem_grade3_or4:true,other_nonhaem_toxicity_grade:2},['NONHAEM_NOT_RECOVERED'],['NONHAEM_RECOVERED']);
test('00500','Prior grade3 current1 restart needs choice',{prior_nonhaem_grade3_or4:true,other_nonhaem_toxicity_grade:1},['NONHAEM_RECOVERED'],['NONHAEM_NOT_RECOVERED']);
for(const code of ['00391','00392']){
  test(code,'Baseline LVEF50 fails strict >50',{assessment_phase:'baseline',lvef_percent:50},['BASELINE_LVEF']);
  test(code,'Baseline LVEF50.01 passes cardiac bound',{assessment_phase:'baseline',lvef_percent:50.01},[],['BASELINE_LVEF']);
  test(code,'ANC0.999 delay overrides intermediate platelets',{anc:.999,platelets:80},['COUNTS_DELAY','COUNTS_80_REVIEW'],[],r=>assert.equal(r.actionType,'delay'));
  test(code,'Platelets69.99 delays',{platelets:69.99},['COUNTS_DELAY']);
  test(code,'Intermediate lower limits1 and70',{anc:1,platelets:70},['COUNTS_80_REVIEW'],['COUNTS_DELAY']);
  test(code,'Exact upper limits differ by source',{anc:1.5,platelets:100},code==='00391'?['COUNTS_80_REVIEW']:[],code==='00391'?[]:['COUNTS_80_REVIEW']);
  test(code,'Strictly above upper limits',{anc:1.5001,platelets:100.001},[],['COUNTS_80_REVIEW','COUNTS_DELAY']);
  test(code,'Previous low nadir alone is not FN row',{prior_anc_nadir:.49,prior_neutropenic_fever:false},[],['PRIOR_FN_80_REVIEW']);
  test(code,'Previous fever with nadir0.5 does not cross <0.5',{prior_anc_nadir:.5,prior_neutropenic_fever:true},[],['PRIOR_FN_80_REVIEW']);
  test(code,'Prior nadir<0.5 AND fever80percent',{prior_anc_nadir:.499,prior_neutropenic_fever:true},['PRIOR_FN_80_REVIEW'],[],comp('PRIOR_FN_80_REVIEW',['doxorubicin','ifosfamide']));
  test(code,'Current ANC<0.5 remains a delay despite FN history',{anc:.4,prior_anc_nadir:.4,prior_neutropenic_fever:true},['COUNTS_DELAY','PRIOR_FN_80_REVIEW'],[],r=>assert.equal(r.actionType,'delay'));
  for(const [v,id]of [[49.999,'IFO_RENAL_LT50'],[50,'IFO_RENAL_EXACT50']])test(code,'Ifosfamide CrCl'+v,{crcl_ml_min:v},[id],[],comp(id,['ifosfamide']));
  test(code,'Ifosfamide CrCl50.001 no renal restriction',{crcl_ml_min:50.001},[],['IFO_RENAL_LT50','IFO_RENAL_EXACT50']);
  test(code,'Ifosfamide haemodialysis not recommended',{haemodialysis:true},['IFO_HAEMODIALYSIS']);
  test(code,'Ifosfamide severe hepatic not recommended',{hepatic_impairment_severity:'severe'},['IFO_SEVERE_HEPATIC']);
  test(code,'AST300 and bilirubin51.3 do not exceed thresholds',{ast_u_l:300,bilirubin_umol_l:51.3},[],['IFO_AST_BILI_CLINICAL_CHOICE']);
  test(code,'AST300.01 clinical reduction choice',{ast_u_l:300.01},['IFO_AST_BILI_CLINICAL_CHOICE']);
  test(code,'Bilirubin51.31 clinical reduction choice',{bilirubin_umol_l:51.31},['IFO_AST_BILI_CLINICAL_CHOICE']);
  test(code,'Mucositis3 affects both cytotoxics',{mucositis_grade:3},['MUCOSITIS_80_REVIEW'],[],comp('MUCOSITIS_80_REVIEW',['doxorubicin','ifosfamide']));
  test(code,'Neurotoxicity3 stops ifosfamide only',{neurotoxicity_grade:3},['IFO_NEUROTOXICITY_STOP'],[],comp('IFO_NEUROTOXICITY_STOP',['ifosfamide']));
  test(code,'Suspected encephalopathy needs prompt hold',{suspected_ifosfamide_encephalopathy:true},['IFO_ENCEPHALOPATHY_REVIEW']);
  test(code,'GCSF required',{gcsf_prophylaxis_planned:false},['GCSF_PROPHYLAXIS_PLANNED_REVIEW']);
  test(code,'PPI source support retained',{ppi_prophylaxis_planned:false},['PPI_PROPHYLAXIS_PLANNED_REVIEW']);
  test(code,'Urine output100 target inclusive',{urine_output_ml_hour:100},[],['IFO_URINE_OUTPUT']);
  test(code,'Urine output99.99 review',{urine_output_ml_hour:99.99},['IFO_URINE_OUTPUT']);
  test(code,'Aprepitant encephalopathy interaction',{aprepitant_planned:true},['APREPITANT_INTERACTION']);
}
for(const [phase,plt,yes,no]of [['day1',99.99,'DAY1_COUNTS_DELAY','DAY8_COUNTS_DELAY'],['day8',74.99,'DAY8_COUNTS_DELAY','DAY1_COUNTS_DELAY'],['day1',80,'DAY1_COUNTS_DELAY','DAY8_COUNTS_DELAY']])test('00501',phase+' platelets'+plt,{assessment_phase:phase,anc:1,platelets:plt},[yes],[no]);
test('00501','Day1 exact ANC1 platelets100',{assessment_phase:'day1',anc:1,platelets:100},[],['DAY1_COUNTS_DELAY']);
test('00501','Day8 exact ANC1 platelets75',{assessment_phase:'day8',anc:1,platelets:75},[],['DAY8_COUNTS_DELAY']);
test('00501','Day8 platelets80 do not use Day1 threshold',{assessment_phase:'day8',anc:1,platelets:80},[],['DAY1_COUNTS_DELAY','DAY8_COUNTS_DELAY']);
test('00501','No day cannot infer safe count threshold',{anc:1,platelets:80},['STAGE_REQUIRED'],['DAY1_COUNTS_DELAY','DAY8_COUNTS_DELAY']);
test('00501','Recovered delayed Day8 on Day15 is review',{assessment_phase:'delayed_day8',cycle_day:15,anc:1,platelets:75},['DELAYED_DAY8_REVIEW'],['DAY8_COUNTS_DELAY','DELAYED_DAY8_AFTER15']);
test('00501','Late delayed dose after15 needs new plan',{assessment_phase:'delayed_day8',cycle_day:16,anc:1,platelets:75},['DELAYED_DAY8_AFTER15']);
test('00501','Current-cycle FN holds remainder',{febrile_neutropenia_this_cycle:true},['FN_CURRENT_CYCLE']);
test('00501','Past FN does not cause indefinite current-cycle hold',{prior_fn_occurrences:1,febrile_neutropenia_this_cycle:false},['FN_PRIOR_FIRST'],['FN_CURRENT_CYCLE']);
test('00501','Past second FN reviews one level',{prior_fn_occurrences:2},['FN_PRIOR_SECOND']);
test('00501','Gem bilirubin26.999 below threshold',{bilirubin_umol_l:26.999},[],['GEM_BILIRUBIN_GE27']);
test('00501','Gem bilirubin27 source alternatives not fixed800',{bilirubin_umol_l:27},['GEM_BILIRUBIN_GE27'],[],specialist('GEM_BILIRUBIN_GE27'));
test('00501','Gem exactCrCl30 source gap',{crcl_ml_min:30},['GEM_CRCL_EXACT30']);
test('00501','Gem HD timing separate review',{haemodialysis:true},['GEM_HAEMODIALYSIS']);
for(const input of [{bilirubin_uln_multiple:1,ast_uln_multiple:2,alt_uln_multiple:1,alp_uln_multiple:3},{bilirubin_uln_multiple:1.2,ast_uln_multiple:6,alt_uln_multiple:1,alp_uln_multiple:4},{alp_uln_multiple:6}])test('00501','Docetaxel hepatic patterns never emit numeric dose '+JSON.stringify(input),input,['DOC_HEPATIC_PATTERN_REVIEW'],[],specialist('DOC_HEPATIC_PATTERN_REVIEW'));
test('00501','Doc ALP exact6 is unallocated',{alp_uln_multiple:6},['DOC_ALP_EXACT6'],['DOC_HEPATIC_HIGH_REVIEW']);
test('00501','Complete first doc pattern retains source75percent consideration',{bilirubin_uln_multiple:1,ast_uln_multiple:2,alt_uln_multiple:1,alp_uln_multiple:3},['DOC_HEPATIC_FIRST_ROW_REVIEW'],[],specialist('DOC_HEPATIC_FIRST_ROW_REVIEW'));
test('00501','Missing ALT does not infer complete first pattern',{bilirubin_uln_multiple:1,ast_uln_multiple:2,alp_uln_multiple:3},['DOC_HEPATIC_PATTERN_REVIEW'],['DOC_HEPATIC_FIRST_ROW_REVIEW']);
test('00501','High second transaminase prevents first-pattern allocation',{bilirubin_uln_multiple:1,ast_uln_multiple:2,alt_uln_multiple:6,alp_uln_multiple:3},['DOC_HEPATIC_PATTERN_REVIEW'],['DOC_HEPATIC_FIRST_ROW_REVIEW']);
test('00501','Doc high bilirubin requires hold pending pattern review',{bilirubin_uln_multiple:1.50001},['DOC_HEPATIC_HIGH_REVIEW'],[],comp('DOC_HEPATIC_HIGH_REVIEW',['docetaxel']));
for(const n of [1,2])test('00501','Neuropathy2 occurrence'+n+' modifies both',{neuropathy_grade:2,grade2_neuropathy_occurrence:n},['NEUROPATHY_G2_LEVEL'],[],comp('NEUROPATHY_G2_LEVEL',['gemcitabine','docetaxel']));
test('00501','Neuropathy2 unknown recurrence cannot assume first',{neuropathy_grade:2},['NEUROPATHY_G2_HISTORY']);
test('00501','Neuropathy3 holds',{neuropathy_grade:3},['NONHAEM_ACTIVE']);
test('00501','Prior severe toxicity current2 not recovered',{prior_nonhaem_grade3_or4:true,other_nonhaem_toxicity_grade:2},['NONHAEM_NOT_RECOVERED'],['NONHAEM_RECOVERED']);
test('00501','Prior severe toxicity both current domains1 reduction review',{prior_nonhaem_grade3_or4:true,other_nonhaem_toxicity_grade:1,neuropathy_grade:1},['NONHAEM_RECOVERED']);
for(const phase of ['recovery',undefined])for(const [field,value]of [['anc',.1],['platelets',10]])test('00501','Independently low '+field+' remains actionable in '+String(phase),{...(phase?{assessment_phase:phase}:{}),[field]:value},['MINIMUM_COUNTS_DELAY'],[],r=>assert.equal(r.actionType,'delay'));
test('00501','Original independent probe: recoveryANC0.1platelets10',{assessment_phase:'recovery',anc:.1,platelets:10},['MINIMUM_COUNTS_DELAY','RECOVERY_DAY_CONTEXT_REQUIRED'],[],r=>assert.equal(r.actionType,'delay'));
for(const phase of ['recovery',undefined])for(const platelets of [75,99.999])test('00501','Intermediate platelet count needs intended day '+String(phase)+' '+platelets,{...(phase?{assessment_phase:phase}:{}),anc:1,platelets},['COUNT_DAY_CONTEXT_REQUIRED'],['MINIMUM_COUNTS_DELAY']);
test('00501','Recovery normalcounts still requires intended dose day',{assessment_phase:'recovery',anc:1,platelets:100},['RECOVERY_DAY_CONTEXT_REQUIRED'],['MINIMUM_COUNTS_DELAY','COUNT_DAY_CONTEXT_REQUIRED']);
for(const field of ['anc','platelets']){const cut=field==='anc'?1:75;for(const value of [cut-.001,cut,cut+.001])test('00501','Minimum '+field+' source boundary in recovery '+value,{assessment_phase:'recovery',[field]:value},value<cut?['MINIMUM_COUNTS_DELAY']:[],value<cut?[]:['MINIMUM_COUNTS_DELAY']);}
test('00501','Original independent probe: neuropathy2 prevents false recovery',{assessment_phase:'day8',neuropathy_grade:2,prior_nonhaem_grade3_or4:true,other_nonhaem_toxicity_grade:0},['NONHAEM_NOT_RECOVERED'],['NONHAEM_RECOVERED'],r=>assert.equal(r.actionType,'withhold'));
for(const [other,neuro]of [[0,2],[1,2],[2,0],[2,1],[0,3],[3,0]])test('00501','Priorsevere recovery excludes currentgrade>1 '+other+'/'+neuro,{prior_nonhaem_grade3_or4:true,other_nonhaem_toxicity_grade:other,neuropathy_grade:neuro},['NONHAEM_NOT_RECOVERED'],['NONHAEM_RECOVERED']);
for(const input of [{other_nonhaem_toxicity_grade:0},{neuropathy_grade:0},{}])test('00501','Priorsevere missinggrade cannot establish recovery '+JSON.stringify(input),{prior_nonhaem_grade3_or4:true,...input},['NONHAEM_RECOVERY_UNKNOWN'],['NONHAEM_RECOVERED']);
for(const [other,neuro]of [[0,0],[0,1],[1,0],[1,1]])test('00501','Both documented recoverygrades≤1 '+other+'/'+neuro,{prior_nonhaem_grade3_or4:true,other_nonhaem_toxicity_grade:other,neuropathy_grade:neuro},['NONHAEM_RECOVERED'],['NONHAEM_NOT_RECOVERED','NONHAEM_RECOVERY_UNKNOWN']);
test('00501','Original independent probe: plannedDay8atday20 holds',{assessment_phase:'day8',cycle_day:20,anc:2,platelets:200},['PLANNED_DAY_MISMATCH_REVIEW','DELAYED_DAY8_AFTER15'],[],r=>assert.equal(r.actionType,'withhold'));
for(const phase of ['day8','delayed_day8'])for(const day of [15,15.001,20])test('00501','Day8latebound applies to '+phase+' actualday'+day,{assessment_phase:phase,cycle_day:day,anc:2,platelets:200},day>15?['DELAYED_DAY8_AFTER15']:[],day>15?[]:['DELAYED_DAY8_AFTER15']);
test('00501','Plannedday8 exactcalendar8 has no mismatch',{assessment_phase:'day8',cycle_day:8},[],['PLANNED_DAY_MISMATCH_REVIEW','DELAYED_DAY8_AFTER15']);
test('00501','Plannedday1 actual8 needs reconciliation',{assessment_phase:'day1',cycle_day:8},['PLANNED_DAY_MISMATCH_REVIEW']);
test('00501','DelayedDay8actual8 has not yet been delayed',{assessment_phase:'delayed_day8',cycle_day:8},['PLANNED_DAY_MISMATCH_REVIEW']);
test('00501','SCAR stops gem only',{severe_cutaneous_reaction:true},['GEM_SCAR_STOP'],[],comp('GEM_SCAR_STOP',['gemcitabine']));
test('00501','Pneumonitis stops gem only',{suspected_drug_induced_pneumonitis:true},['GEM_PNEUMONITIS_STOP'],[],comp('GEM_PNEUMONITIS_STOP',['gemcitabine']));
test('00501','Severe allergy stops doc only',{severe_docetaxel_hypersensitivity:true},['DOC_SEVERE_HYPERSENSITIVITY_STOP'],[],comp('DOC_SEVERE_HYPERSENSITIVITY_STOP',['docetaxel']));
test('00501','Two premedication doses require review',{docetaxel_premed_doses_taken:2},['DOC_PREMED_REVIEW']);test('00501','Three premedication doses satisfy minimum',{docetaxel_premed_doses_taken:3},[],['DOC_PREMED_REVIEW']);
test('00501','Off-label consent missing at baseline',{assessment_phase:'baseline'},['OFF_LABEL_CONSENT']);test('00501','Off-label consent confirmed',{assessment_phase:'baseline',off_label_consent_confirmed:true},[],['OFF_LABEL_CONSENT']);
test('00511','Baseline cytopenia excluded',{assessment_phase:'baseline',baseline_leukopenia_or_thrombocytopenia:true},['BASELINE_CYTOPENIA_EXCLUSION']);
test('00511','Baseline counts do not borrow80percent clearance',{assessment_phase:'baseline',anc:1.2},['BASELINE_COUNTS_REVIEW'],['COUNTS_80_REVIEW']);
test('00511','On-treatment ANC1.2 uses intermediate row',{assessment_phase:'day1',anc:1.2},['COUNTS_80_REVIEW']);
test('00511','ANC1.5 platelet100 full-count boundary',{assessment_phase:'day1',anc:1.5,platelets:100},[],['COUNTS_DELAY','COUNTS_80_REVIEW']);
test('00511','ANC0.999 delays',{anc:.999},['COUNTS_DELAY']);test('00511','Platelets69.99 delays',{platelets:69.99},['COUNTS_DELAY']);
for(const [v,id]of [[29.99,'DTIC_RENAL_LT30'],[30,'DTIC_RENAL_30_45'],[44.99,'DTIC_RENAL_30_45'],[45,'DTIC_RENAL_EXACT45'],[45.01,'DTIC_RENAL_45_60'],[60,'DTIC_RENAL_45_60']])test('00511','Non-dialysis renal boundary'+v,{crcl_ml_min:v,haemodialysis:false},[id],[],specialist(id));
test('00511','Exactly45 no arbitrary75or80',{crcl_ml_min:45,haemodialysis:false},['DTIC_RENAL_EXACT45'],['DTIC_RENAL_45_60','DTIC_RENAL_30_45']);
test('00511','CrCl60.01 no table reduction',{crcl_ml_min:60.01,haemodialysis:false},[],['DTIC_RENAL_45_60']);
test('00511','Dialysis does not inherit70percent renal row',{haemodialysis:true,crcl_ml_min:10},['DTIC_HAEMODIALYSIS'],['DTIC_RENAL_LT30']);
test('00511','Unspecified dialysis status remains review',{crcl_ml_min:40},['DTIC_DIALYSIS_STATUS_MISSING'],['DTIC_RENAL_30_45']);
test('00511','Severe renal disease exclusion outranks row',{severe_renal_disease:true,haemodialysis:false,crcl_ml_min:20},['SEVERE_ORGAN_EXCLUSION','DTIC_RENAL_LT30'],[],r=>assert.equal(r.actionType,'contraindicated'));
test('00511','Severe hepatic disease excluded',{hepatic_impairment_severity:'severe'},['SEVERE_ORGAN_EXCLUSION']);
test('00511','Moderate hepatic no invented percentage',{hepatic_impairment_severity:'moderate'},['DTIC_HEPATIC_REVIEW'],[],specialist('DTIC_HEPATIC_REVIEW'));
test('00511','Sepsis admission uses80percent previous dose',{prior_neutropenic_sepsis_admission:true},['PRIOR_SEPSIS_80_PREVIOUS'],[],r=>assert.match(r.findings.find(f=>f.ruleId==='PRIOR_SEPSIS_80_PREVIOUS').action.message,/PREVIOUS dose/));
for(const code of codes){const demo=Object.fromEntries(Object.entries(ps[code].input_definitions).map(([k,v])=>[k,v.demo_value]));const change=code==='00511'?{crcl_ml_min:45,haemodialysis:false}:code==='00501'?{bilirubin_uln_multiple:1.2,ast_uln_multiple:6,alt_uln_multiple:1,alp_uln_multiple:4}:{bilirubin_umol_l:50.5};const id=code==='00511'?'DTIC_RENAL_EXACT45':code==='00501'?'DOC_HEPATIC_PATTERN_REVIEW':'DOX_BILI_DECIMAL_GAP';test(code,'Demo defaults do not clear a source ambiguity',{...demo,...change},[id],[],specialist(id));}
// The browser lab adapter preserves actual bilirubin while separately deriving
// docetaxel ULN multiples; a different local ULN must not move absolute cutoffs.
const settings={altUln:40,astUln:40,bilirubinUln:24,alpUln:100,lftProfile:'custom'};
function rawDoc(actual){const input={};for(const [field,analyte]of [['bilirubin_uln_multiple','bilirubin'],['ast_uln_multiple','ast'],['alt_uln_multiple','alt'],['alp_uln_multiple','alp']]){if(actual[analyte]===undefined)continue;const def={id:field,...ps['00501'].input_definitions[field]};Object.assign(input,L.derivedActualFields(def,actual));const v=L.calculate(def,actual,settings);if(v&&!v.invalid)input[field]=v.ratio;}return input;}
test('00501','Raw bilirubin27 with localULN24 keeps gem threshold',rawDoc({bilirubin:27}),['GEM_BILIRUBIN_GE27','DOC_HEPATIC_PATTERN_REVIEW'],['DOC_HEPATIC_HIGH_REVIEW']);
test('00501','Raw bilirubin36.001 crosses doc1.5 without rounding',rawDoc({bilirubin:36.001}),['DOC_HEPATIC_HIGH_REVIEW']);
try{const defs=ps['00501'].input_definitions;assert.equal(defs.bilirubin_umol_l.ui_derived_from,'bilirubin_uln_multiple');assert.equal(defs.bilirubin_umol_l.visible,false);assert.deepEqual(defs.bilirubin_uln_multiple.derived_actual_fields,{bilirubin:'bilirubin_umol_l'});const visible=Object.entries(defs).filter(([,v])=>!v.ui_derived_from).map(([k])=>k);assert(visible.includes('bilirubin_uln_multiple'));assert(!visible.includes('bilirubin_umol_l'));const raw=rawDoc({bilirubin:27});assert.equal(Number(raw.bilirubin_umol_l),27);assert.equal(raw.bilirubin_uln_multiple,27/24);results.push({code:'00501',name:'UI exposes one raw bilirubin control and derives hidden absolute concentration',passed:true});}catch(e){failed++;results.push({code:'00501',name:'UI exposes one raw bilirubin control and derives hidden absolute concentration',passed:false,error:e.message});}
try{const d={id:'alp_uln_multiple',...ps['00501'].input_definitions.alp_uln_multiple};const r=L.calculate(d,{alp:300},{...settings,alpUln:null});assert(r===null||r.invalid===true);results.push({code:'00501',name:'Missing localALP ULN cannot create ratio',passed:true});}catch(e){failed++;results.push({code:'00501',name:'Missing localALP ULN cannot create ratio',passed:false,error:e.message});}
const report={status:failed?'failed':'passed',source_checked_date:'2026-11-18',scope:'Actual assessment engine, component actions, source boundaries, toxicity recovery/history and local-laboratory adapter. No independent clinical approval, browser or publication claim.',passed:results.length-failed,failed,cases:results};
fs.writeFileSync(path.join(dir,'source-case-results.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({cases:results.length,passed:results.length-failed,failed,failures:results.filter(x=>!x.passed)},null,2));process.exitCode=failed?1:0;
