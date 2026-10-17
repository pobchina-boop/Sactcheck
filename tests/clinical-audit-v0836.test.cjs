'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),E=require('../js/assessment-engine'),D=require('../js/protocol-dose-schedule');
const root=path.resolve(__dirname,'..'),codes=require('../data/cetuximab-v0836-source-index.json').codes,out=[],ps=Object.fromEntries(codes.map(c=>[c,require('../protocols/gastrointestinal/'+fs.readdirSync(path.join(root,'protocols/gastrointestinal')).find(f=>f.startsWith(c)))]));
function test(c,name,inputs,expected,check=()=>{}){if(c==='00207'&&Object.keys(inputs).length)inputs={indication_id:'00207a',...inputs};const p=ps[c],r=E.assess(p,inputs),d=D.buildModificationModel(p,r);assert.equal(r.actionType,expected,`${c} ${name}: ${JSON.stringify(r.findings.map(f=>f.ruleId))}`);assert.deepEqual(r.errors,[]);assert.deepEqual(r.invalid,[]);check(r,d);out.push({code:c,case:name,inputs,expected,actual:r.actionType,pass:true,findings:r.findings.filter(f=>!f.domainAssessment).map(f=>({id:f.ruleId,source:f.sourceText,explanation:f.explanation})),components:d.rows.map(x=>({component:x.component,action:x.actionLabel,dose:x.protocolDose}))});return {r,d};}
for(const c of codes){
 test(c,'Blank remains incomplete',{},'incomplete');test(c,'Known hypersensitivity',{hypersensitivity:true},'contraindicated');test(c,'Outside source ECOG',{ecog:4},'consultant_review');
 assert.equal(ps[c].metadata.validation.clinical_use_authorised,false);assert(ps[c].rule_engine.rules.every(r=>r.source.url&&r.source.page));assert(ps[c].required_inputs.length===0);
 if(['00210','00213'].includes(c))continue;
 for(const ras of ['mutant','unknown'])test(c,'RAS '+ras,{ras_status:ras},'contraindicated');
 for(const grade of [3,4])test(c,'Current severe skin '+grade,{acneiform_rash_grade:grade},'withhold');
 for(const occ of [1,2,3])for(const grade of [0,1,2])for(const delay of [1,2])test(c,`Skin recovered ${occ}/${grade}/${delay}`,{acneiform_rash_grade:grade,skin_occurrence:occ,skin_delay_weeks:delay,skin_failed_recovery:false},occ===1?'consultant_review':'dose_reduce',(r,d)=>{const dose=(['00207','00328','00330','00692'].includes(c)?[250,200,150]:[500,400,300])[occ-1];assert(d.rows.some(x=>x.component==='Cetuximab'&&x.protocolDose.includes(dose+' mg/')));});
 test(c,'Fourth severe skin episode',{skin_occurrence:4},'discontinue');test(c,'Failed skin recovery',{skin_failed_recovery:true},'discontinue');
 for(const grade of [1,2,3,4])test(c,'Infusion reaction '+grade,{infusion_reaction_grade:grade},grade<3?'consultant_review':'permanently_discontinue');
 test(c,'Early infusion overrides mild grade',{infusion_reaction_grade:1,reaction_first_15_minutes:true},'withhold');test(c,'ILD',{interstitial_lung_disease:true},'permanently_discontinue');test(c,'Respiratory symptoms',{unexplained_respiratory_symptoms:true},'withhold');test(c,'Eye symptoms',{ocular_symptoms:true},'consultant_review');test(c,'Electrolyte correction',{electrolyte_abnormality:true},'consultant_review');
 const r=E.assess(ps[c],{acneiform_rash_grade:1,skin_occurrence:2});assert(!r.findings.some(f=>f.ruleId?.startsWith('SKIN_RESTART')));out.push({code:c,case:'No inferred skin recovery interval',pass:true});
}
for(const c of codes.filter(c=>!['00207','00732'].includes(c))){
 for(const v of [.49,.5,.99,1,1.49])test(c,'ANC '+v,{anc_x10e9_l:v},'withhold');
 for(const v of [9.99,10,49.99,50,74.99])test(c,'Platelets '+v,{platelets_x10e9_l:v},'withhold');
 test(c,'Current counts hold overrides recovery dose',{anc_x10e9_l:1,platelets_x10e9_l:74,lowest_anc:.3,delay_weeks:1},'withhold');
 if(c!=='00210'&&c!=='00213')test(c,'Different component actions',{infusion_reaction_grade:3,anc_x10e9_l:1.4},'permanently_discontinue',(r,d)=>{assert(d.rows.some(x=>x.component==='Cetuximab'&&x.protocolDose==='Not to be administered'));assert(d.rows.some(x=>x.component!=='Cetuximab'&&x.protocolDose==='No dose now'));});
}
for(const c of ['00328','00585','00692','00733','00210']){
 test(c,'Complete DPD',{dpd_status:'complete'},'contraindicated');test(c,'Unknown DPD',{dpd_status:'unknown'},'withhold');test(c,'Partial DPD',{dpd_status:'partial'},'consultant_review');
 for(const [f,v] of [['fluorouracil_bilirubin_umol_l',85],['fluorouracil_ast_u_l',180]]){test(c,f+' equality',{[f]:v},'consultant_review');test(c,f+' above',{[f]:v+.01},'contraindicated');}
 test(c,'Stomatitis hold',{mucositis_grade:2},'withhold');test(c,'Cardiac hold',{suspected_fluoropyrimidine_cardiotoxicity:true},'withhold');
 for(const nadir of [.49,.5,.99])test(c,'ANC nadir restart '+nadir,{anc_x10e9_l:1.5,platelets_x10e9_l:75,lowest_anc:nadir,delay_weeks:1,current_oxaliplatin_level:0,current_irinotecan_level:0,current_fluorouracil_bolus_level:0,current_fluorouracil_infusion_level:0},'dose_reduce',(r,d)=>{if(['00692','00733','00210'].includes(c)&&nadir<.5){assert(d.rows.some(x=>x.actionLabel==='Omit component'));assert(d.rows.some(x=>x.component==='Folinic acid'&&x.actionLabel==='Omit component'));}});
 for(const nadir of [9.99,10,49.99])test(c,'Platelet nadir restart '+nadir,{anc_x10e9_l:1.5,platelets_x10e9_l:75,lowest_platelets:nadir,delay_weeks:1},'dose_reduce');
 test(c,'Late recovered counts need review',{anc_x10e9_l:1.5,platelets_x10e9_l:75,delay_weeks:5},'consultant_review');
 test(c,'Persistent low ANC',{anc_x10e9_l:1.4,delay_weeks:4},'discontinue');
}
for(const c of ['00328','00585']){
 test(c,'ANC interval conflict',{anc_x10e9_l:1.4,delay_weeks:3},'withhold',r=>assert(r.findings.some(f=>f.ruleId==='ANC_INTERVAL_CONFLICT')));
 test(c,'Residual irinotecan diarrhoea',{diarrhoea_grade:1},'withhold');test(c,'Irinotecan hepatic CI',{bilirubin_uln_multiple:3.01},'contraindicated');
 for(const g of [3,4])test(c,'Recovered FOLFIRI diarrhoea '+g,{diarrhoea_grade:0,diarrhoea_highest_grade:g,toxicity_delay_weeks:1,current_irinotecan_level:0,current_fluorouracil_bolus_level:0,current_fluorouracil_infusion_level:0},'dose_reduce',(r,d)=>assert(d.rows.some(x=>x.component==='Irinotecan'&&x.protocolDose.includes(g===3?'150':'120'))));
 test(c,'Mucositis affects FU only',{mucositis_grade:1,mucositis_highest_grade:3,toxicity_delay_weeks:1,current_fluorouracil_bolus_level:-1,current_fluorouracil_infusion_level:-1},'dose_reduce',(r,d)=>{assert(!d.rows.some(x=>x.component==='Irinotecan'));assert(d.rows.some(x=>x.protocolDose.includes('260')));});
}
for(const c of ['00692','00733','00210']){
 test(c,'Current dose level required',{neuropathy_grade:2},'dose_reduce',(r,d)=>assert(d.rows.some(x=>/current component dose level/.test(x.protocolDose))));
 test(c,'Relative current level',{neuropathy_grade:2,current_oxaliplatin_level:-1},'dose_reduce',(r,d)=>assert(d.rows.some(x=>/50 mg/.test(x.protocolDose))));
 test(c,'Beyond final level stops',{neuropathy_grade:2,current_oxaliplatin_level:-2},'dose_reduce',(r,d)=>assert(d.rows.some(x=>/discontinue/i.test(x.protocolDose))));
 test(c,'Persistent grade3 neuro',{neuropathy_grade:3,neuropathy_pattern:'persistent'},'discontinue');test(c,'G3 needs history',{neuropathy_grade:3},'consultant_review');
 test(c,'Renal 29.99 differs by regimen',{crcl_ml_min:29.99},c==='00210'?'contraindicated':'consultant_review');
 if(c==='00210')test(c,'CrCl equality gap',{crcl_ml_min:30},'consultant_review');
 if(['00692','00210'].includes(c)){const ads=ps[c].treatment_phases[0].administration.filter(x=>x.drug==='fluorouracil_infusion');assert.equal(ads.length,2);assert(ads.every(x=>x.dose.value===600&&x.duration==='22 hours'));}
}
for(const c of ['00330','00331']){
 for(const n of [.49,.5,.99])test(c,'Irinotecan pair nadir '+n,{anc_x10e9_l:1.5,platelets_x10e9_l:75,lowest_anc:n},'dose_reduce',(r,d)=>assert(d.rows.some(x=>x.protocolDose.includes(n<.5?'120':'150'))));
 test(c,'Irinotecan renal range',{crcl_ml_min:9.99},'consultant_review',(r,d)=>assert(!d.rows.some(x=>/^\d.*mg/.test(x.protocolDose))));
 for(const g of [3,4])test(c,'Diarrhoea restart source '+g,{diarrhoea_grade:0,diarrhoea_highest_grade:g,toxicity_delay_weeks:1},'consultant_review',(r,d)=>{if(c==='00330')assert(!d.rows.some(x=>x.component==='Cetuximab'&&/^\d/.test(x.protocolDose)));else assert(d.rows.some(x=>x.component==='Cetuximab'&&x.protocolDose.includes(g===3?'400':'300')));});
}
test('00207','RAS does not exclude head/neck RT',{indication_id:'00207-head-neck',ras_status:'mutant'},'proceed_with_caution');
test('00207','RAS requires indication context',{indication_id:null,ras_status:'mutant'},'consultant_review');
test('00207','Toxicity actionable without indication',{indication_id:null,infusion_reaction_grade:3},'permanently_discontinue');
test('00328','Severe renal exclusion dominates adjustment note',{severe_renal_impairment:true},'contraindicated',r=>assert(r.findings.some(f=>/Table 3/.test(f.explanation))));
test('00585','Baseline ANC exclusion',{assessment_type:'baseline',anc_x10e9_l:1.99},'contraindicated');test('00585','Baseline platelets exclusion',{assessment_type:'baseline',platelets_x10e9_l:99.99},'contraindicated');test('00585','Renal exclusion',{crcl_ml_min:29.99},'contraindicated');
test('00213','Monotherapy high bilirubin starting dose',{assessment_type:'baseline',bilirubin_uln_multiple:1.51},'consultant_review',(r,d)=>assert(d.rows.some(x=>/200 mg/.test(x.protocolDose))));test('00213','Monotherapy bilirubin contraindication',{bilirubin_uln_multiple:3.01},'contraindicated');test('00213','Monotherapy reduction is range',{anc_x10e9_l:1.5,platelets_x10e9_l:75,lowest_anc:.49,lowest_platelets:24},'consultant_review',(r,d)=>assert(!d.rows.some(x=>/^\d/.test(x.protocolDose))));
if(process.env.SACT_WRITE_VALIDATION)fs.writeFileSync(path.join(root,'validation/colorectal-v0836/engine-cases.json'),JSON.stringify(out,null,2)+'\n');console.log(`${out.length} v0.83.6 source-derived decision cases passed.`);
