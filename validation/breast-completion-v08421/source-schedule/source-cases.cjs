'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../../..'),assess=require(path.join(root,'js/assessment-engine')).assess,schedule=require(path.join(root,'js/protocol-dose-schedule'));
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'proposed/integration-manifest.json'))),author=JSON.parse(fs.readFileSync(path.join(__dirname,'authoring.json')));
const P=Object.fromEntries(Object.entries(manifest.protocols).map(([c,x])=>[c,JSON.parse(fs.readFileSync(path.join(root,process.argv.includes('--integrated')?x.source_path:x.proposed_path)))]));
const results=[];function check(name,fn){try{fn();results.push({name,pass:true})}catch(e){results.push({name,pass:false,error:e.message})}}
function test(code,name,inputs,yes=[],no=[]){check(code+': '+name,()=>{const r=assess(P[code],inputs);assert.deepEqual(r.errors,[]);assert.deepEqual(r.invalid,[]);const ids=r.findings.map(x=>x.ruleId);for(const id of yes)assert(ids.includes(id),`Missing ${id}; got ${ids}`);for(const id of no)assert(!ids.includes(id),`Unexpected ${id}`);});}
// NCCP00207 v6 pp1–3. Indication boundaries never suppress independent toxicity.
for(const v of [0,1,2,3])test('00207','ECOG '+v,{ecog:v},[],['ECOG_ELIGIBILITY']);test('00207','ECOG 4',{ecog:4},['ECOG_ELIGIBILITY']);
test('00207','CRC prior-treatment failure',{indication_id:'00207a',colorectal_prior_therapy_criteria_met:false},['CRC_PRIOR_TREATMENT_V6']);
test('00207','CRC criteria met',{indication_id:'00207a',colorectal_prior_therapy_criteria_met:true},[],['CRC_PRIOR_TREATMENT_V6']);
for(const context of ['00207b','00207-head-neck']){
 test('00207','head-neck platinum eligible '+context,{indication_id:context,head_neck_platinum_ineligible:false},['HN_PLATINUM_ELIGIBILITY_V6']);
 test('00207','head-neck RAS not gate '+context,{indication_id:context,ras_status:'mutant',head_neck_platinum_ineligible:true},[],['RAS_EXCLUSION','HN_PLATINUM_ELIGIBILITY_V6']);
 test('00207','head-neck no colorectal cross-trigger '+context,{indication_id:context,colorectal_prior_therapy_criteria_met:false},[],['CRC_PRIOR_TREATMENT_V6']);
}
for(const ras of ['mutant','unknown'])test('00207','CRC RAS '+ras,{indication_id:'00207a',ras_status:ras},['RAS_EXCLUSION']);
test('00207','omitted indication and criteria false',{head_neck_platinum_ineligible:false},['INDICATION_CONTEXT_V6']);
test('00207','partial toxicity still assessed',{acneiform_rash_grade:3},['SKIN_HOLD']);
test('00207','omitted criteria not invented',{indication_id:'00207a'},[],['CRC_PRIOR_TREATMENT_V6']);
// NCCP00568 v5 Table1: independently entered blood counts, exact lower/upper boundaries.
for(const [v,yes,no] of [[.49,['LOW_ANC','ANC_BELOW_0_5_REDUCTION'],['ANC_REVIEW_1_TO_1_5']],[.5,['LOW_ANC'],['ANC_BELOW_0_5_REDUCTION']],[.99,['LOW_ANC'],[]],[1,['ANC_REVIEW_1_TO_1_5'],['LOW_ANC']],[1.49,['ANC_REVIEW_1_TO_1_5'],[]],[1.5,[],['LOW_ANC','ANC_REVIEW_1_TO_1_5']]])test('00568','ANC '+v,{anc_x10e9_l:v},yes,no);
for(const [v,yes,no] of [[49,['LOW_PLATELETS','PLATELETS_BELOW_50_REDUCTION'],[]],[50,['LOW_PLATELETS'],['PLATELETS_BELOW_50_REDUCTION']],[74.9,['LOW_PLATELETS'],[]],[75,['PLATELETS_REVIEW_75_100'],['LOW_PLATELETS']],[99.9,['PLATELETS_REVIEW_75_100'],[]],[100,[],['LOW_PLATELETS','PLATELETS_REVIEW_75_100']]])test('00568','platelets '+v,{platelets_x10e9_l:v},yes,no);
test('00568','severe thrombocytopenia + bleeding',{platelets_x10e9_l:49,thrombocytopenia_with_bleeding:true},['PLATELETS_BELOW_50_BLEEDING']);test('00568','bleeding boundary 50',{platelets_x10e9_l:50,thrombocytopenia_with_bleeding:true},[],['PLATELETS_BELOW_50_BLEEDING']);
for(const v of [0,1,2,3,4])test('00568','ECOG '+v,{ecog:v},v>1?['ECOG_OUTSIDE_USUAL_RANGE']:[],v<=1?['ECOG_OUTSIDE_USUAL_RANGE']:[]);
for(const [v,yes,no] of [[20,['CARBO_GFR_20_OR_LESS','PEME_NUMERIC_CRCL_LT45'],['CARBO_GFR_20_30']],[20.01,['CARBO_GFR_20_30','PEME_NUMERIC_CRCL_LT45'],['CARBO_GFR_20_OR_LESS']],[30,['CARBO_GFR_20_30'],[]],[30.01,['PEME_NUMERIC_CRCL_LT45'],['CARBO_GFR_20_30']],[44.99,['PEME_NUMERIC_CRCL_LT45'],[]],[45,['CARBO_CRCL_LT60'],['PEME_NUMERIC_CRCL_LT45']],[59.99,['CARBO_CRCL_LT60'],[]],[60,[],['CARBO_CRCL_LT60']]])test('00568','renal '+v,{gfr_crcl_ml_min:v},yes,no);
test('00568','renal maintenance has no carboplatin finding',{treatment_phase:'maintenance',gfr_crcl_ml_min:20},['PEME_NUMERIC_CRCL_LT45'],['CARBO_GFR_20_OR_LESS','CARBO_GFR_20_30','CARBO_CRCL_LT60']);
for(const [v,yes,no] of [[1.5,[],['ICI_BILI_WITHHOLD','ICI_BILI_STOP']],[1.51,['ICI_BILI_WITHHOLD'],['ICI_BILI_STOP']],[3,['ICI_BILI_WITHHOLD'],['ICI_BILI_STOP']],[3.01,['ICI_BILI_STOP'],['ICI_BILI_WITHHOLD']]])test('00568','bilirubin '+v,{bilirubin_uln_multiple:v},yes,no);
for(const [v,yes,no] of [[3,[],['ICI_HEPATITIS_WITHHOLD','ICI_HEPATITIS_STOP']],[3.01,['ICI_HEPATITIS_WITHHOLD'],['ICI_HEPATITIS_STOP']],[5,['ICI_HEPATITIS_WITHHOLD'],['ICI_HEPATITIS_STOP']],[5.01,['ICI_HEPATITIS_STOP'],['ICI_HEPATITIS_WITHHOLD']]])test('00568','ASTALT '+v,{alt_ast_uln_multiple:v},yes,no);
for(const [v,yes,no] of [[1.5,[],['ICI_RENAL_G2','ICI_RENAL_G3']],[1.51,['ICI_RENAL_G2'],['ICI_RENAL_G3']],[3,['ICI_RENAL_G2'],['ICI_RENAL_G3']],[3.01,['ICI_RENAL_G3'],['ICI_RENAL_G2']]])test('00568','creatinine ULN '+v,{creatinine_ratio_baseline_or_uln:v},yes,no);
for(const [v,id] of [[2,'ICI_PNEUMONITIS_G2'],[3,'ICI_PNEUMONITIS_G3'],[4,'ICI_PNEUMONITIS_G3']])test('00568','pneumonitis grade '+v,{pneumonitis_grade:v},[id]);
for(const [v,id] of [[2,'ICI_COLITIS_G2'],[3,'ICI_COLITIS_G2'],[4,'ICI_COLITIS_G4']])test('00568','colitis grade '+v,{diarrhoea_colitis_grade:v},[id]);
for(const [field,id] of [['previous_febrile_neutropenia','FEBRILE_NEUTROPENIA_RESTART'],['recurrent_grade2_pneumonitis','ICI_RECURRENT_PNEUMONITIS'],['recurrent_grade3_colitis','ICI_RECURRENT_COLITIS'],['symptomatic_hypophysitis','SYMPTOMATIC_HYPOPHYSITIS'],['type1_diabetes_ketoacidosis','TYPE1_DIABETES_KETOACIDOSIS'],['hyperthyroidism_grade3_plus','HYPERTHYROIDISM_GRADE3_PLUS'],['suspected_sjs_ten','ICI_SKIN_HOLD'],['confirmed_sjs_ten','ICI_SKIN_STOP'],['other_immune_grade2_3','ICI_OTHER_HOLD'],['immune_permanent_stop_event','ICI_OTHER_STOP'],['ici_failed_recovery_12_weeks','ICI_12_WEEK_STOP'],['ici_steroid_gt10_at_12_weeks','ICI_12_WEEK_STOP'],['diarrhoea_hospitalisation','CHEMO_DIARRHOEA'],['recurrent_neurotoxicity','CHEMO_NEURO_STOP']]){
 test('00568',field+' true',{[field]:true},[id]);test('00568',field+' false',{[field]:false},[],[id]);
}
test('00568','immune diabetes exact boundary',{type1_diabetes:true,glucose_mmol_l:13.9},[],['ICI_TYPE1_HIGH_GLUCOSE']);test('00568','immune diabetes above boundary',{type1_diabetes:true,glucose_mmol_l:13.91},['ICI_TYPE1_HIGH_GLUCOSE']);
for(const [pct,days,expected] of [[49.99,7,false],[50,6,false],[50,7,true]])test('00568','baseline G2 liver metastasis '+pct+'/'+days,{immune_liver_metastasis_baseline_g2:true,ast_alt_increase_percent:pct,ast_alt_elevation_days:days},expected?['ICI_LIVER_METS_BASELINE_G2_STOP']:[],expected?[]:['ICI_LIVER_METS_BASELINE_G2_STOP']);
for(const [v,yes,no] of [[2,['CHEMO_NEURO_G2'],['CHEMO_NEURO_STOP']],[3,['CHEMO_NEURO_STOP'],[]]])test('00568','neuropathy '+v,{neuropathy_grade:v},yes,no);
for(const [v,expected] of [[10,false],[10.01,true]])test('00568','chemotherapy liver bilirubin '+v,{treatment_related_hepatotoxicity:true,bilirubin_uln_multiple:v},expected?['CHEMO_LIVER_STOP']:[],expected?[]:['CHEMO_LIVER_STOP']);
check('00568 maintenance chemotherapy actions exclude carboplatin',()=>{let r=assess(P['00568'],{treatment_phase:'maintenance',anc_x10e9_l:.4,mucositis_grade:3,neuropathy_grade:2});assert(r.findings.length);assert(r.findings.every(x=>!x.action.components?.includes('carboplatin')));});
// Course structure and source provenance are independent from runtime assessment.
for(const [c,version] of [['00207','6'],['00447','7'],['00448','5'],['00568','5'],['00586','3']]){
 check(c+' source metadata',()=>{assert.equal(P[c].metadata.nccp_version,version);assert.match(P[c].metadata.source_url,/healthservice\.hse\.ie/);assert.equal(P[c].metadata.source_pdf_sha256.length,64);assert.equal(P[c].metadata.validation.clinical_use_authorised,false);});
 check(c+' complete rendered dose schedule',()=>assert(schedule.buildModel(P[c]).phases.length>0));
 check(c+' qualitative patient and structured monitoring',()=>{let x=author.regimens[c];assert.deepEqual(x.patient.evidence.metrics,[]);assert(x.patient.monitoring_schedule.rows.length>=2);assert(x.journey.lanes.every(l=>l.cells.length===x.journey.stages.length));assert(x.clinical.baseline.length&&x.clinical.before_each_cycle.length&&x.clinical.ongoing.length);assert(x.evidence.endpoints.length);});
 test(c,'blank input never gives clearance',{},[],[]);
}
check('00207 distinct 400 loading / 250 weekly',()=>assert.deepEqual(P['00207'].treatment_phases.map(x=>x.administration[0].dose.value),[400,250]));
check('00568 four-cycle induction and no carboplatin maintenance',()=>{let [a,b]=P['00568'].treatment_phases;assert.equal(a.planned_cycles,4);assert.equal(a.cycle_length_days,21);assert.deepEqual(b.active_drugs,['pembrolizumab','pemetrexed']);assert(!b.administration.some(x=>x.drug==='carboplatin'));assert.equal(schedule.buildModel(P['00568']).phases.length,2);});
check('00586 five tablet days and no fabricated radiation dose',()=>{let p=P['00586'];assert.deepEqual(p.metadata.drugs,['capecitabine']);assert.deepEqual(p.treatment_phases[0].administration[0].day,[1,2,3,4,5]);assert.equal(p.treatment_phases[0].administration[0].dose.value,825);assert.equal(p.treatment_phases[0].cycle_length_days,7);});
check('00207 low emetic risk',()=>assert.equal(author.regimens['00207'].risk.level,'low'));
check('00568 phase-specific emetic risks',()=>assert.deepEqual(author.regimens['00568'].support_plans.map(p=>p.emetogenic_risk),['high','low']));
const summary={mode:process.argv.includes('--integrated')?'integrated':'proposed',total:results.length,passed:results.filter(x=>x.pass).length,failed:results.filter(x=>!x.pass).length,clinical_use_authorised:false,results};fs.writeFileSync(path.join(__dirname,summary.mode+'-results.json'),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify({total:summary.total,passed:summary.passed,failed:summary.failed,failures:results.filter(x=>!x.pass)},null,2));if(summary.failed)process.exitCode=1;
