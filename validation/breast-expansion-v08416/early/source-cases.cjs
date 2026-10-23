'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..'),E=require(path.join(root,'js/assessment-engine.js'));
const mode=process.argv.includes('--baseline')?'baseline':process.argv.includes('--proposed')?'candidates':'actual';
const codes=['00350','00775','00258','00722','00731'];
const ps=Object.fromEntries(codes.map(c=>[c,JSON.parse(fs.readFileSync(mode==='actual'?path.join(root,'protocols/breast',fs.readdirSync(path.join(root,'protocols/breast')).find(n=>n.startsWith(c+'-'))):path.join(__dirname,mode,c+'.json')))]));
let cases=[];
function test(code,name,input,{action,include=[],exclude=[],page=1,check=()=>{}}={}){let row={code,name,input,expectedAction:action,expectedRules:include,excludedRules:exclude,sourcePage:page};try{const r=E.assess(ps[code],input);const f=r.findings.filter(x=>!x.domainAssessment&&!/^PARTIAL_/.test(x.ruleId||''));let ids=f.map(x=>x.ruleId);Object.assign(row,{actualAction:r.actionType,actualRules:ids});assert.deepEqual(r.errors,[]);if(action)assert.equal(r.actionType,action);include.forEach(id=>assert(ids.includes(id),'Missing '+id));exclude.forEach(id=>assert(!ids.includes(id),'Unexpected '+id));check(r,f);row.pass=true;}catch(e){row.pass=false;row.error=e.message;}cases.push(row);}
for(const c of codes){
 test(c,'Empty assessment never clears',{}, {check:r=>assert.notEqual(r.actionType,'proceed')});
 test(c,'Invalid stage produces clarification',{assessment_stage:'nonsense'}, {include:['INVALID_ASSESSMENT_STAGE']});
 if(c!=='00350'){
  test(c,'Invalid phase produces clarification',{treatment_phase:'nonsense'}, {include:['INVALID_TREATMENT_PHASE']});
  test(c,'Postoperative phase requires selected regimen',{treatment_phase:'continuation'}, {include:['CONTINUATION_REGIMEN_REQUIRED']});
 }
 const hf=c==='00722'?'SYMPTOMATIC_HEART_FAILURE':['00258','00731'].includes(c)?'HER2_HF':'HEART_FAILURE';
 test(c,'Heart failure remains independently actionable',{symptomatic_heart_failure:true},{action:c==='00258'?'withhold':'discontinue',include:[hf],page:c==='00350'?4:7});
 test(c,'Invalid stage does not mask symptomatic heart failure',{assessment_stage:'nonsense',symptomatic_heart_failure:true},{action:c==='00258'?'withhold':'discontinue',include:[hf,'INVALID_ASSESSMENT_STAGE']});
 const hold=c==='00722'?'LVEF_WITHHOLD':['00258','00731'].includes(c)?'HER2_LVEF_HOLD':'LVEF_HOLD';
 for(const [lv,fall,yes] of [[49.99,10,true],[50,10,false],[49,9.99,false]])test(c,`Cardiac hold boundary ${lv}/${fall}`,{assessment_stage:'ongoing',lvef_percent:lv,lvef_drop_points:fall},{action:yes?'withhold':undefined,include:yes?[hold]:[],exclude:yes?[]:[hold],page:c==='00350'?4:7});
 test(c,'Drop alone does not stand in for current LVEF',{lvef_drop_points:10},{include:['LVEF_CURRENT_MISSING'],exclude:[hold],page:c==='00350'?4:7});
 test(c,'Current LVEF alone needs stage',{lvef_percent:54},{include:['LVEF_STAGE_MISSING'],page:c==='00258'?4:c==='00350'?2:3});
 const pregnancy=c==='00722'?'EXCLUSION_PREGNANCY_BREASTFEEDING':['00258','00731'].includes(c)?'PREGNANCY_REVIEW':'PREGNANCY';
 test(c,'Pregnancy independently excluded',{pregnancy:true},{action:'contraindicated',include:[pregnancy]});
}
for(const c of ['00350','00775']){
 const extra=c==='00350'?{treatment_setting:'neoadjuvant',companion_regimen_confirmed:true}:{};
 test(c,'Pretreatment LVEF49 current value',{...extra,assessment_stage:'baseline',lvef_percent:49},{action:'withhold',include:['BASELINE_CURRENT_LVEF_LOW']});
 test(c,'Pretreatment LVEF54 no anthracycline',{...extra,assessment_stage:'baseline',lvef_percent:54,anthracycline_completed:false},{action:'withhold',include:['BASELINE_CURRENT_LVEF_50_55']});
 test(c,'Pretreatment LVEF50 after anthracycline',{...extra,assessment_stage:'baseline',lvef_percent:50,anthracycline_completed:true},{exclude:['BASELINE_CURRENT_LVEF_50_55','BASELINE_CURRENT_LVEF_LOW']});
 test(c,'Pretreatment LVEF54 unknown anthracycline',{...extra,assessment_stage:'baseline',lvef_percent:54},{include:['BASELINE_CURRENT_HISTORY_MISSING']});
 test(c,'Ongoing historical low baseline is not current hold',{...extra,assessment_stage:'ongoing',baseline_lvef_percent:49,lvef_percent:60,lvef_drop_points:0},{include:['ONGOING_BASELINE_HISTORY_REVIEW'],exclude:['BASELINE_LVEF_LOW'],check:r=>assert.notEqual(r.actionType,'withhold')});
 for(const [d,id] of [[41.99,'HER2_MAINTENANCE'],[42,'HER2_RELOAD']])test(c,'Six-week IV gap '+d,{...extra,days_since_last_antibody:d},{include:[id],page:c==='00350'?3:5,check:(r,f)=>assert(!JSON.stringify(f).includes('Phesgo'))});
 test(c,'Trastuzumab permanent stop requires pertuzumab stop',{...extra,trastuzumab_discontinued:true},{action:'discontinue',include:['STOP_PERTUZUMAB_WITH_H']});
}
test('00350','No companion regimen not assumed TCHP',{lvef_percent:60},{include:['COMPANION_REGIMEN_REQUIRED'],check:(r,f)=>assert(!JSON.stringify(f).includes('75%'))});
test('00350','Adjuvant Irish access distinguished',{treatment_setting:'adjuvant',companion_regimen_confirmed:true},{include:['ADJUVANT_ACCESS'],page:1});
test('00350','Concurrent anthracycline is held',{concurrent_anthracycline:true},{action:'withhold',include:['ANTHRACYCLINE_CONCURRENT']});
test('00350','Not a metastatic regimen',{treatment_setting:'metastatic'},{include:['SETTING_INVALID']});
test('00350','No invented chemotherapy rule in framework',{},{check:()=>{const ids=ps['00350'].rule_engine.rules.map(r=>r.rule_id);assert(!ids.some(x=>/DOCETAXEL|COUNTS_LOW|GFR_20/.test(x)));}});
test('00350','No chemotherapy fields in framework',{},{check:()=>{assert(!Object.keys(ps['00350'].input_definitions).includes('current_docetaxel_dose'));}});
test('00350','Grade4 antibody reaction',{her2_hypersensitivity_grade:4},{action:'discontinue',include:['HER2_REACTION_G4'],page:4});
test('00350','Current reaction requires intervention',{her2_hypersensitivity_grade:2},{action:'withhold',include:['INFUSION_REACTION'],page:5});
test('00350','Bronchospasm permanent pertuzumab stop',{bronchospasm_or_ards:true},{action:'permanently_discontinue',include:['PERTUZUMAB_SEVERE_REACTION'],page:5});
test('00350','Persistent severe diarrhoea',{severe_persistent_diarrhoea:true},{action:'withhold',include:['DIARRHOEA'],page:5});
test('00350','Severe renal data limitation no carboplatin cutoff',{severe_renal_impairment:true},{include:['RENAL_SEVERE'],page:4});
for(const [day,a,p,action,id] of [[1,.99,150,'delay','TRAIN_D1_anc_x10e9_l'],[1,2,74.99,'delay','TRAIN_D1_platelets_x10e9_l'],[8,.49,150,'omit','TRAIN_D8_OMIT'],[8,2,49.99,'omit','TRAIN_D8_OMIT']])test('00775',`TRAIN2 D${day} ${a}/${p}`,{assessment_stage:'ongoing',cycle_day:day,anc_x10e9_l:a,platelets_x10e9_l:p},{action,include:[id],page:5});
for(const [day,a,p] of [[1,1,75],[8,.5,50]])test('00775',`TRAIN2 equality D${day}`,{assessment_stage:'ongoing',cycle_day:day,anc_x10e9_l:a,platelets_x10e9_l:p},{exclude:['TRAIN_D1_anc_x10e9_l','TRAIN_D1_platelets_x10e9_l','TRAIN_D8_OMIT'],page:5});
test('00775','Day15 is not scheduled',{cycle_day:15},{include:['INVALID_CYCLE_DAY']});
test('00775','Missing day needs correct threshold',{anc_x10e9_l:.8},{include:['TRAIN_DAY_MISSING_anc_x10e9_l'],page:5});
test('00775','Baseline ANC exclusion differs from later Day1',{assessment_stage:'baseline',anc_x10e9_l:1.49},{action:'contraindicated',include:['BASELINE_ANC'],page:3});
for(const [b,id] of [[1.26,'PAC_HEP_75'],[2,'PAC_HEP_75'],[2.01,'PAC_HEP_50'],[5,'PAC_HEP_50']])test('00775','Paclitaxel bilirubin '+b,{ast_uln_multiple:2,alt_uln_multiple:2,bilirubin_uln_multiple:b},{include:[id],page:6});
for(const b of [1.255,2.005])test('00775','Printed bilirubin gap '+b,{bilirubin_uln_multiple:b},{action:'consultant_review',page:6});
for(const input of [{ast_uln_multiple:10},{bilirubin_uln_multiple:5.01}])test('00775','Independent hepatic contraindication '+JSON.stringify(input),input,{action:'contraindicated',include:['PAC_HEP_STOP'],page:6});
test('00775','Neuropathy grade2 is paclitaxel decrement',{neuropathy_grade:2},{include:['PAC_NEURO_G2'],page:7});
test('00775','Grade3 neuropathy source overlap requires hold',{neuropathy_grade:3},{action:'withhold',include:['PAC_NEURO_CONFLICT'],page:7});
test('00775','No docetaxel residue',{},{check:()=>assert(!JSON.stringify(ps['00775'].rule_engine).toLowerCase().includes('docetaxel'))});
for(const c of ['00258','00722','00731']){
 const a=c==='00722'?'anc':'anc_x10e9_l',p=c==='00722'?'platelets':'platelets_x10e9_l',g=c==='00722'?'gcsf_strategy':'count_strategy';
 test(c,'Exact ANC1.5 source boundary',{assessment_stage:'ongoing',[a]:1.5,[p]:150},{include:['COUNT_EXACT_BOUNDARY'],page:5});
 test(c,'Exact platelet100 source boundary',{assessment_stage:'ongoing',[a]:2,[p]:100},{include:['COUNT_EXACT_BOUNDARY'],page:5});
 test(c,'Intermediate ANC plus platelet100 not numeric dose',{assessment_stage:'ongoing',[a]:1.2,[p]:100,[g]:'dose_reduction'},{include:['COUNT_EXACT_BOUNDARY'],exclude:[c==='00722'?'COUNTS_INTERMEDIATE_REDUCE':'TCH_INTERMEDIATE_75'],page:5});
 test(c,'ANC1.2 without stage needs clarification',{[a]:1.2},{include:['BASELINE_COUNT_CONTEXT'],page:4});
 test(c,'Neuropathy grade2 without stage needs clarification',{neuropathy_grade:2},{include:['BASELINE_NEURO_CONTEXT'],page:4});
 test(c,'Postchemotherapy low counts not TCHP delay',{treatment_phase:'continuation',[a]:.2},{include:['CONTINUATION_REGIMEN_REQUIRED'],exclude:['COUNTS_LOW_IMMEDIATE_DELAY','TCH_COUNTS_LOW']});
 test(c,'Current baseline LVEF49',{assessment_stage:'baseline',lvef_percent:49},{action:c==='00722'?'contraindicated':'withhold',include:[c==='00722'?'BASELINE_LVEF_BELOW55':'CURRENT_BASELINE_LVEF_LOW'],page:c==='00258'?4:3});
 test(c,'Historic low LVEF during ongoing not new hold',{assessment_stage:'ongoing',baseline_lvef_percent:49,lvef_percent:60,lvef_drop_points:0},{include:['ONGOING_BASELINE_HISTORY_REVIEW'],exclude:['HER2_BASELINE_LOW','HISTORIC_BASELINE_LVEF_LOW'],check:r=>assert.notEqual(r.actionType,'withhold')});
 if(c==='00258')test(c,'55 exact remains clinical judgement',{assessment_stage:'baseline',lvef_percent:55},{include:['CURRENT_BASELINE_LVEF_BORDERLINE'],page:4});
 else test(c,'No invented postanthracycline50 exception',{assessment_stage:'baseline',lvef_percent:54,anthracycline_completed:true},{action:c==='00722'?'contraindicated':'withhold',page:3});
}
for(const c of ['00775','00258','00722','00731']){
 for(const [v,id,action] of [[20,c==='00722'?'GFR_20_OR_LESS':'CARBO_GFR_STOP','contraindicated'],[20.01,c==='00722'?'GFR_20_TO30':'CARBO_GFR_CAUTION',undefined],[30,c==='00722'?'GFR_20_TO30':'CARBO_GFR_CAUTION',undefined]])test(c,'GFR boundary '+v,{gfr_ml_min:v},{action,include:[id],page:c==='00258'?5:6});
 test(c,'Estimated creatinine older48h',{gfr_method:'estimated',creatinine_result_age_hours:48.01},{include:['CARBO_OLD_CREATININE']});
 test(c,'Estimated GFR missing creatinine age',{gfr_method:'estimated',gfr_ml_min:70},{include:['CARBO_CREATININE_AGE_MISSING']});
 test(c,'Creatinine48h boundary accepted',{gfr_method:'estimated',creatinine_result_age_hours:48},{exclude:['CARBO_OLD_CREATININE']});
 test(c,'Isotope reference110 accepted',{gfr_method:'isotope',creatinine_percent_reference:110},{exclude:['CARBO_CREATININE_RISE']});
 test(c,'Isotope reference110.01 reviewed',{gfr_method:'isotope',creatinine_percent_reference:110.01},{include:['CARBO_CREATININE_RISE']});
 test(c,'Renal method missing not inferred',{creatinine_result_age_hours:72},{include:['CARBO_METHOD_MISSING']});
}
const report={mode,checked:'2026-10-21',scope:'Independent source expectations; software tests do not constitute clinical authorisation.',count:cases.length,passed:cases.filter(c=>c.pass).length,failed:cases.filter(c=>!c.pass).length,cases};fs.writeFileSync(path.join(__dirname,mode==='actual'?'final-results.json':mode+'-results.json'),JSON.stringify(report,null,2)+'\n');console.log(`${mode}: ${report.passed}/${report.count}`);cases.filter(c=>!c.pass).forEach(c=>console.log('FAIL',c.code,c.name,c.error));process.exitCode=report.failed?1:0;
