'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),E=require(root+'/js/assessment-engine'),D=require(root+'/js/protocol-dose-schedule');
const mode=process.argv[2]||'integrated',dir=mode==='baseline'?__dirname+'/baseline':root+'/protocols/breast';
const codes=['00262','00263','00265','00269','00423','00250','00252','00260','00278','00432'];
const p=Object.fromEntries(codes.map(c=>[c,JSON.parse(fs.readFileSync(path.join(dir,fs.readdirSync(dir).find(x=>x.startsWith(c+'-')))))]));let results=[];
function test(c,name,input,expected,pattern,component){let row={code:c,name,input,expected,source:p[c].metadata.source_url};try{let r=E.assess(p[c],input),m=D.buildModificationModel(p[c],r);row.actual={action:r.actionType,findings:r.findings.filter(x=>!x.domainAssessment&&!/^PARTIAL_/.test(x.ruleId||'')).map(x=>({id:x.ruleId,type:x.actionType,text:x.explanation,components:x.action?.components})),errors:r.errors,invalid:r.invalid,dose:m.rows.map(x=>({component:x.componentId,type:x.actionType,dose:x.protocolDose,quantified:x.quantified}))};assert.deepEqual(r.errors,[]);require("../../tests/helpers/source-input-validation-v08421.cjs")(r);if(expected==='incomplete')assert.equal(r.actionType,'incomplete');else if(expected==='absent'){assert(!row.actual.findings.some(x=>new RegExp(pattern,'i').test(x.text||'')))}else{assert(row.actual.findings.some(x=>(!expected||x.type===expected)&&(!pattern||new RegExp(pattern,'i').test(x.text||''))&&(!component||x.components?.includes(component)||x.components?.includes('whole_regimen'))),'Missing source finding '+expected+' '+pattern);assert(!['proceed','proceed_with_caution'].includes(r.actionType));assert(!m.rows.some(x=>/^\d+(\.\d+)?\s*mg/.test(x.protocolDose||'')),'Unresolved clinical decision offered numeric dose')}row.pass=true}catch(e){row.pass=false;row.error=e.message}results.push(row)}
for(const c of codes)test(c,'Blank assessment',{},'incomplete');
for(const c of codes.slice(0,5)){
 test(c,'Unrecognised assessment stage',{assessment_stage:'invalid'},'consultant_review','unrecognised');
 test(c,'Current suspected FN is urgent not a percentage',{febrile_neutropenia:true},'withhold','urgent');
 test(c,'Lifetime anthracycline exposure not reset',{anthracycline_lifetime_limit_reached:true},'contraindicated','lifetime');
 test(c,'Unknown renal method',{crcl_ml_min:15,renal_measure_type:'egfr'},'consultant_review','indexed eGFR');
 test(c,'Pregnancy source exclusion',{pregnancy_or_lactation:true},'contraindicated','pregnancy');
 test(c,'Cardiac symptoms',{clinically_significant_cardiac_symptoms:true},'withhold','cardiac|breathlessness');
 test(c,'Single normal blood result is not full clearance',{anc_x10e9_l:3},'absent','full.dose|safe to|proceed');
}
for(const c of ['00262','00263']){
 for(const n of [0,.5,.99])test(c,'ANC low '+n,{anc_x10e9_l:n},'delay','one week');
 test(c,'EC ANC1 is not FEC threshold',{anc_x10e9_l:1},'absent','delay');
 test(c,'Platelets99.9',{platelets_x10e9_l:99.9},'delay','platelets');
 test(c,'Platelets100 gap',{platelets_x10e9_l:100},'consultant_review','unassigned');
 test(c,'CrCl20 overlap',{crcl_ml_min:20},'consultant_review','overlap');
 for(const [v,pct] of [[9.9,50],[10,75],[19.9,75]])test(c,'CrCl '+v,{crcl_ml_min:v},'consultant_review',pct+'%', 'cyclophosphamide');
 test(c,'CrCl20.1 no reduction',{crcl_ml_min:20.1},'absent','renal row specifies');
 for(const [v,pct] of [[24,50],[50.99,50],[51.01,25],[85,25]])test(c,'Epi bilirubin '+v,{bilirubin_umol_l:v},'consultant_review',pct+'%', 'epirubicin');
 test(c,'Epi bilirubin51 overlap',{bilirubin_umol_l:51},'consultant_review','overlap');
 test(c,'Epi bilirubin85.01 omit',{bilirubin_umol_l:85.01},'omit','omit');
 test(c,'EC AST5 belongs50%',{ast_uln_multiple:5},'consultant_review','50%');
 test(c,'EC AST5.01 belongs25%',{ast_uln_multiple:5.01},'consultant_review','25%');
 test(c,'Prior FN is conditional75%',{prior_febrile_neutropenia:true},'consultant_review','consider75%');
}
for(const c of ['00265','00269']){
 for(const n of [.9,1,1.49,1.499])test(c,'Day1 ANC '+n,{anc_x10e9_l:n},'delay','one.week');
 test(c,'Day1 ANC1.5 not delayed',{anc_x10e9_l:1.5},'absent','requires one.week delay');
 test(c,'Day1 platelets99',{platelets_x10e9_l:99},'delay','platelets');
 test(c,'Nadir count is not dose reduction',{count_context:'nadir',anc_x10e9_l:.2},'consultant_review','nadir counts alone');
 test(c,'Nadir does not trigger Day1 delay',{count_context:'nadir',anc_x10e9_l:.2},'absent','requires one.week delay');
 test(c,'After-delay missing context',{count_context:'after_one_week_delay',anc_x10e9_l:1.2},'consultant_review','confirm both counts');
 test(c,'First after-delay intermediate',{count_context:'after_one_week_delay',anc_x10e9_l:1.2,platelets_x10e9_l:110,low_count_occurrence:1,prior_febrile_neutropenia:false},'consultant_review','75%.*100%');
 test(c,'Second after-delay intermediate',{count_context:'after_one_week_delay',anc_x10e9_l:1.2,platelets_x10e9_l:110,low_count_occurrence:2,prior_febrile_neutropenia:false},'delay','until ANC');
 test(c,'After-delay decimal gap',{count_context:'after_one_week_delay',anc_x10e9_l:1.495},'consultant_review','between');
 for(const n of [1,2,3,4])test(c,'Prior FN episode '+n,{prior_febrile_neutropenia:true,fn_occurrence:n},'consultant_review',n===1?'75% previous':n===2?'50% previous':n===3?'no dose.reduction.only':'not specified');
 test(c,'CompleteDPD',{dpd_status:'complete'},'contraindicated','DPD','fluorouracil');
 test(c,'PartialDPD no fabricated percentage',{dpd_status:'partial'},'consultant_review','no universal percentage');
 test(c,'UnknownDPD',{dpd_status:'unknown'},'withhold','before first');
 test(c,'Missing baselineDPD',{assessment_stage:'baseline'},'consultant_review','DPD');
 test(c,'ConcurrentRT prohibited',{concurrent_radiotherapy:true},'contraindicated','concurrent radiotherapy');
 test(c,'Bilirubin85 5FU gap',{bilirubin_umol_l:85},'consultant_review','unassigned','fluorouracil');
 test(c,'AST180 5FU gap',{ast_u_l:180},'consultant_review','unassigned','fluorouracil');
 test(c,'AST180.1 5FU contraindicated',{ast_u_l:180.1},'contraindicated','absolute','fluorouracil');
 test(c,'Bilirubin85.1 5FU contraindicated',{bilirubin_umol_l:85.1},'contraindicated','5.FU','fluorouracil');
 test(c,'FEC AST4 belongs50%',{ast_uln_multiple:4},'consultant_review','50%','epirubicin');
 test(c,'FEC AST4.01 belongs25%',{ast_uln_multiple:4.01},'consultant_review','25%','epirubicin');
 test(c,'FEC CrCl20 belongs75% unlike EC',{crcl_ml_min:20},'consultant_review','75%','cyclophosphamide');
 test(c,'Stomatitis3 persistent reduction',{stomatitis_grade:3},'delay_then_dose_reduce','75%');
 test(c,'5FU cardiac event stops5FU',{fluorouracil_cardiac_symptoms:true},'discontinue','rechallenge','fluorouracil');
 test(c,'Third low occurrence not extrapolated',{low_count_occurrence:3},'consultant_review','not specified');
 test(c,'Invalid count context',{count_context:'wrong'},'consultant_review','unrecognised');
}
const c='00423';
for(const [name,input,a,pattern] of [
 ['ECOG2',{ecog:2},'consultant_review','eligibility'],['LowANC',{anc_x10e9_l:1.49},'delay','one week'],['BaselineANC1.5',{assessment_stage:'baseline',anc_x10e9_l:1.5},'consultant_review','boundar'],['Baselineplatelets100',{assessment_stage:'baseline',platelets_x10e9_l:100},'consultant_review','boundar'],['BaselineG2neuro',{assessment_stage:'baseline',neuropathy_grade:2},'contraindicated','exclusion'],['OngoingG2not60',{assessment_stage:'ongoing',neuropathy_grade:2},'absent','reduces docetaxel'],['LVEF49',{lvef_percent:49},'contraindicated','LVEF'],['LVEF50',{lvef_percent:50},'consultant_review','exactly50'],['Bili50.5',{bilirubin_umol_l:50.5},'consultant_review','gap'],['Bili51',{bilirubin_umol_l:51},'consultant_review','25%'],['Bili85.1',{bilirubin_umol_l:85.1},'omit','omit'],['Dochepatic75isstartingdose',{alp_uln_multiple:3,alt_uln_multiple:2},'consultant_review','already the AT starting'],['Docseverehepatic',{alp_uln_multiple:7,bilirubin_uln_multiple:1.1},'withhold','stop'],['OneASTnotboth',{ast_uln_multiple:4,alt_uln_multiple:1,bilirubin_uln_multiple:1.1},'absent','meets the printed stop'],['G3neuro',{neuropathy_grade:3},'consultant_review','60\\s*mg'],['Persistent60',{toxicity_persists_at_60:true},'discontinue','discontinue'],['Skin4not3',{skin_reaction_grade:4},'withhold','grade\\s*4'],['SevereHS',{severe_docetaxel_hypersensitivity:true},'permanently_discontinue','do not rechallenge'],['Premedmissing',{docetaxel_premedication_incomplete:true},'consultant_review','minimum3'],['PriorFNno75',{prior_febrile_neutropenia:true},'consultant_review','does not specify']])test(c,name,input,a,pattern);
for(const c of codes.slice(5)){test(c,'Unresolved planned tests',{pretreatment_tests_unresolved:true},'consultant_review','missing results');if(c!=='00250')test(c,'Lifetime exposure limit',{anthracycline_lifetime_limit_reached:true},'contraindicated','lifetime');}
test('00432','HER2 cardiac clock through continuation',{treatment_phase:'continuation',trastuzumab_cardiac_monitoring_overdue:true},'consultant_review','every\\s*12\\s*weeks','trastuzumab');
let report={release:'0.84.17',date:'2026-10-23',mode,total:results.length,passed:results.filter(x=>x.pass).length,failed:results.filter(x=>!x.pass).length,clinical_signoff:false,results};fs.writeFileSync(__dirname+'/'+mode+'-results.json',JSON.stringify(report,null,2)+'\n');console.log(`${mode}: ${report.passed}/${report.total}`);for(const x of results.filter(x=>!x.pass))console.log('FAIL',x.code,x.name,x.error.split('\n')[0]);process.exitCode=report.failed?1:0;
