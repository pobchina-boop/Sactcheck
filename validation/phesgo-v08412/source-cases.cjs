'use strict';
// Acceptance cases transcribed from NCCP pages recorded below; run the real engine and dose renderer.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),E=require('../../js/assessment-engine'),D=require('../../js/protocol-dose-schedule');
const codes=['00785','00789','00790','00796','00797'];const ps=Object.fromEntries(codes.map(c=>[c,JSON.parse(fs.readFileSync(path.join(root,'protocols/breast',fs.readdirSync(path.join(root,'protocols/breast')).find(f=>f.startsWith(c+'-')))))]));
const results=[];const named=r=>r.findings.filter(f=>!f.domainAssessment&&!/^PARTIAL_/.test(f.ruleId||''));const ids=r=>named(r).map(f=>f.ruleId);const words=r=>named(r).map(f=>f.explanation||f.recommendation||'').join(' ');
const has=(r,id)=>assert(ids(r).includes(id),'Missing '+id+': '+ids(r).join(','));const no=(r,id)=>assert(!ids(r).includes(id),'Unexpected '+id);
const noDose=m=>assert(!m.rows.some(r=>/^\d+(?:\.\d+)?\s*mg/.test(r.protocolDose||'')),'Unresolved / held case offered a numeric restart dose');
function test(code,name,inputs,action,check=()=>{}){let x={code,name,inputs,expected:action};try{const r=E.assess(ps[code],inputs),m=D.buildModificationModel(ps[code],r);assert.deepEqual(r.errors,[]);assert.deepEqual(r.invalid,[]);if(action)assert.equal(r.actionType,action);check(r,m);x.actual=r.actionType;x.findings=named(r).map(f=>({id:f.ruleId,action:f.actionType,source:f.source}));x.pass=true;}catch(e){x.pass=false;x.error=e.message;}results.push(x);}
for(const c of codes){
 test(c,'Blank is unassessed',{},'incomplete',(r,m)=>noDose(m));
 for(const [f,a] of [['hypersensitivity','contraindicated'],['pregnancy','contraindicated'],['breastfeeding','contraindicated'],['symptomatic_heart_failure','discontinue'],['suspected_heart_failure','withhold'],['bronchospasm_or_ards','permanently_discontinue'],['cardiac_monitoring_overdue','consultant_review']])test(c,'Single safety field: '+f,{[f]:true},a,(r,m)=>noDose(m));
 test(c,'HER2 eligibility not confirmed',{her2_positive:false},'consultant_review');
 test(c,'ECOG2 outside source population',{ecog:2},'consultant_review');
 test(c,'ECOG1 does not trigger exclusion',{ecog:1},null,r=>no(r,'ECOG'));
 test(c,'Grade4 hypersensitivity',{phesgo_hypersensitivity_grade:4},'permanently_discontinue');
 for(const [n,reload] of [[0,false],[21,false],[41.99,false],[42,true],[63,true]])test(c,'Dual-HER2 interval '+n,{days_since_last_antibody:n},'consultant_review',(r,m)=>{has(r,reload?'PHESGO_RELOAD':'PHESGO_MAINTENANCE');assert(words(r).includes(reload?'1200 mg/600 mg':'600 mg/600 mg'));noDose(m);});
 assert.equal(ps[c].indications.length,1);assert.equal(ps[c].indications[0].code,c+'a');assert.equal(ps[c].metadata.validation.clinical_use_authorised,false);assert.deepEqual(ps[c].required_inputs,[]);
 for(const def of Object.values(ps[c].input_definitions))assert.notEqual(def.required,true);
 assert(ps[c].rule_engine.rules.every(r=>r.source.url&&r.source.page&&ps[c].rule_engine.actions_ranked_most_to_least_restrictive.includes(r.action.type)));
 assert.equal(ps[c].treatment_phases[0].administration.filter(a=>/Phesgo/.test(a.drug)).length,1,'One combined product administration');
}
for(const c of ['00785','00796','00797']){
 for(const [l,drop,hold] of [[39.99,0,true],[40,10,true],[45,10,true],[45,9.99,false],[45.01,20,false],[49,12,false]])test(c,'Metastatic LVEF '+l+'/'+drop,{lvef_percent:l,lvef_drop_points:drop},hold?'withhold':null,(r,m)=>{hold?has(r,'LVEF_HOLD'):no(r,'LVEF_HOLD');noDose(m);});
 test(c,'Missing decline in40-45 band',{lvef_percent:42},'consultant_review');
 test(c,'LVEF39 requires hold without decline',{lvef_percent:39},'withhold');
 test(c,'Baseline49.99',{baseline_lvef_percent:49.99},'withhold');test(c,'Baseline50',{baseline_lvef_percent:50},null,r=>no(r,'BASELINE_LVEF_LOW'));
}
for(const c of ['00789','00790']){
 for(const [l,drop,hold] of [[49.99,10,true],[50,10,false],[49.99,9.99,false]])test(c,'Early LVEF '+l+'/'+drop,{lvef_percent:l,lvef_drop_points:drop},hold?'withhold':null,r=>hold?has(r,'LVEF_HOLD'):no(r,'LVEF_HOLD'));
 test(c,'Early LVEF missing decline',{lvef_percent:49},'consultant_review');
 test(c,'Baseline55 meets source',{baseline_lvef_percent:55},null,r=>{no(r,'BASELINE_LVEF_LOW');no(r,'BASELINE_HISTORY_MISSING');});
 test(c,'Baseline54 no anthracycline',{baseline_lvef_percent:54,anthracycline_completed:false},'withhold');test(c,'Baseline54 unknown history',{baseline_lvef_percent:54},'consultant_review');test(c,'Baseline50 after anthracycline',{baseline_lvef_percent:50,anthracycline_completed:true},null,r=>no(r,'BASELINE_LVEF_50_55'));
 for(const [n,a] of [[20,'contraindicated'],[20.01,'consultant_review'],[30,'consultant_review'],[59.9,'consultant_review']])test(c,'Carboplatin GFR '+n,{gfr_ml_min:n},a,(r,m)=>{noDose(m);assert(m.rows.every(x=>x.componentId==='carboplatin'));});
 test(c,'GFR60 no renal review',{gfr_ml_min:60},null,r=>no(r,'CARBO_MYEO_RISK'));test(c,'GFR125 cap boundary',{gfr_ml_min:125},null,r=>no(r,'CARBO_CAP'));test(c,'GFR125.01 cap',{gfr_ml_min:125.01},'consultant_review');
 test(c,'Creatinine48h accepted',{gfr_method:'estimated',creatinine_result_age_hours:48},null,r=>no(r,'CARBO_OLD_CREATININE'));test(c,'Creatinine48.01h reviewed',{gfr_method:'estimated',creatinine_result_age_hours:48.01},'consultant_review');
 test(c,'Isotope reference110 accepted',{gfr_method:'isotope',creatinine_percent_reference:110},null,r=>no(r,'CARBO_CREATININE_RISE'));test(c,'Isotope reference110.01 reviewed',{gfr_method:'isotope',creatinine_percent_reference:110.01},'consultant_review');
 assert.equal(ps[c].treatment_phases[0].cycles.length,6);assert.deepEqual(ps[c].treatment_phases[1].administration,[],'Do not invent postoperative Phesgo dose');
}
for(const c of ['00789','00790','00796','00797']){
 test(c,'Initiation ANC1.49 exclusion',{assessment_stage:'baseline',anc_x10e9_l:1.49},'contraindicated');test(c,'Single ANC1.2 needs stage',{anc_x10e9_l:1.2},'consultant_review');
 test(c,'FN holds chemotherapy',{febrile_neutropenia:true},'withhold',(r,m)=>assert(m.rows.every(x=>!['pertuzumab','trastuzumab'].includes(x.componentId))));
 for(const inputs of [{anc_x10e9_l:0.4,assessment_stage:'baseline'},{alt_uln_multiple:12},{severe_hepatic_impairment:true},{neuropathy_grade:3}])test(c,'Continuation excludes old chemotherapy actions '+JSON.stringify(inputs),{treatment_phase:'continuation',...inputs},null,(r,m)=>{assert(!m.rows.some(x=>['docetaxel','paclitaxel','carboplatin'].includes(x.componentId)));assert(!['withhold','delay','contraindicated','discontinue'].includes(r.actionType));});
 test(c,'Continuation retains cardiac hold',{treatment_phase:'continuation',lvef_percent:39,lvef_drop_points:20},'withhold');
}
for(const c of ['00789','00796']){
 for(const [f,v] of [['ast_uln_multiple',10.01],['alt_uln_multiple',10.01],['alp_uln_multiple',6.01],['bilirubin_uln_multiple',1.51]])test(c,'Independent docetaxel severe threshold '+f,{[f]:v},'contraindicated',(r,m)=>noDose(m));
 test(c,'Normal liver not literal50% branch',{ast_uln_multiple:1,alt_uln_multiple:1,alp_uln_multiple:1,bilirubin_uln_multiple:1},null,r=>no(r,'DOC_HEP_REVIEW'));
 test(c,'Intermediate hepatic ambiguity',{alt_uln_multiple:2,ast_uln_multiple:1,alp_uln_multiple:3,bilirubin_uln_multiple:1},'consultant_review',(r,m)=>{assert(/AMBIGUITY/.test(words(r)));noDose(m);});test(c,'ALP exactly6 unresolved',{alp_uln_multiple:6},'consultant_review');
 test(c,'Neuropathy persists on60',{neuropathy_grade:3,current_docetaxel_mg_m2:60,toxicity_persists_at_reduced_dose:true},'discontinue');
}
for(const c of ['00790','00797']){
 for(const [b,pct] of [[1.26,75],[2,75],[2.01,50],[5,50]])test(c,'Paclitaxel hepatic band '+b,{alt_uln_multiple:2,ast_uln_multiple:2,bilirubin_uln_multiple:b},'consultant_review',(r,m)=>{assert(words(r).includes(pct+'% of ORIGINAL'));noDose(m);});
 for(const b of [1.255,2.005])test(c,'Bilirubin printed gap '+b,{bilirubin_uln_multiple:b},'consultant_review');
 test(c,'ALT10 contraindication',{alt_uln_multiple:10},'contraindicated');test(c,'Bilirubin5.01 contraindication',{bilirubin_uln_multiple:5.01},'contraindicated');test(c,'Missing transaminase context',{bilirubin_uln_multiple:1.5},'consultant_review');
 test(c,'Grade2 neuropathy10mg decrement',{neuropathy_grade:2},'consultant_review',(r,m)=>{assert(/10 mg/.test(words(r)));noDose(m);});test(c,'Grade3 neuropathy source-specific action',{neuropathy_grade:3},c==='00790'?'withhold':'discontinue');test(c,'Other grade2 hold',{other_nonhaem_toxicity_grade:2},'withhold');test(c,'Other grade3 discontinue',{other_nonhaem_toxicity_grade:3},'discontinue');
}
for(const [input,a,id] of [[{cycle_day:1,anc_x10e9_l:0.99},'delay','TRAIN_D1_anc_x10e9_l'],[{cycle_day:1,platelets_x10e9_l:74.99},'delay','TRAIN_D1_platelets_x10e9_l'],[{cycle_day:8,anc_x10e9_l:0.49},'omit','TRAIN_D8_OMIT'],[{cycle_day:8,platelets_x10e9_l:49.99},'omit','TRAIN_D8_OMIT'],[{anc_x10e9_l:0.8},'consultant_review','TRAIN_DAY_MISSING_anc_x10e9_l'],[{haematology_delay_days:7.01},'consultant_review','TRAIN_DELAY_REDUCTION'],[{haematology_delay_days:14.01},'withhold','TRAIN_DELAY_MAX']])test('00790','TRAIN2 day-specific '+id,input,a,r=>has(r,id));
for(const [day,a,p] of [[1,1,75],[8,0.5,50]])test('00790','Exact allowed count boundary day'+day,{assessment_stage:'ongoing',cycle_day:day,anc_x10e9_l:a,platelets_x10e9_l:p},null,r=>{no(r,'TRAIN_D8_OMIT');no(r,'TRAIN_D1_anc_x10e9_l');no(r,'TRAIN_D1_platelets_x10e9_l');});
test('00790','Isolated AST10 applies transaminase row',{ast_uln_multiple:10},'contraindicated');test('00797','Isolated AST does not import ALT-only hard stop',{ast_uln_multiple:10},null,r=>no(r,'PAC_HEP_STOP'));
for(const [n,a] of [[69,'delay_then_dose_reduce'],[70,'delay'],[89.99,'delay'],[90,'consultant_review']])test('00797','Weekly platelet boundary '+n,{platelets_x10e9_l:n},a);
test('00797','ANC0.4 missing duration still holds',{anc_x10e9_l:0.4},'delay');test('00797','Prolonged severe ANC adds reduction',{anc_x10e9_l:0.4,anc_below_0_5_days:7},'delay_then_dose_reduce');
for(const n of [1.495,1.5])test('00789','Printed ANC boundary '+n,{assessment_stage:'ongoing',anc_x10e9_l:n},'consultant_review');test('00789','Platelets100 source strict boundary',{platelets_x10e9_l:100},'consultant_review');test('00789','Platelets99 source hold',{platelets_x10e9_l:99},'delay');test('00789','Uncontrolled hypertension',{uncontrolled_hypertension:true},'contraindicated');
assert.deepEqual(ps['00790'].treatment_phases[0].administration.find(a=>a.drug==='paclitaxel').day,[1,8]);assert.deepEqual(ps['00797'].treatment_phases[0].administration.find(a=>a.drug==='paclitaxel').day,[1,8,15]);assert(!/docetaxel/i.test(JSON.stringify(ps['00790'].rule_engine)));assert(!/ovarian|bladder|small.cell|00226/.test(JSON.stringify(ps['00797'].indications)));assert(!ps['00797'].treatment);
const report={checked:'2026-10-20',cases:results.length,passed:results.filter(x=>x.pass).length,failed:results.filter(x=>!x.pass).length,results};fs.writeFileSync(path.join(__dirname,'source-case-results.json'),JSON.stringify(report,null,2)+'\n');console.log(`${report.passed}/${report.cases} Phesgo source cases passed`);for(const x of results.filter(x=>!x.pass))console.log('FAIL',x.code,x.name,x.error);process.exitCode=report.failed?1:0;
