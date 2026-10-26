'use strict';
// Expectations were selected from NCCP 00430 v6 pp1–6 and 00749 v3 pp1–4.
// Deliberate source ambiguities require review; no expectation implies clinical approval.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..'),E=require(root+'/js/assessment-engine'),D=require(root+'/js/protocol-dose-schedule');
const mode=process.argv[2]||'proposed',dir=mode==='integrated'?root+'/protocols/breast':path.join(__dirname,mode==='baseline'?'baseline':'proposed');
const p=Object.fromEntries(['00430','00749'].map(c=>[c,JSON.parse(fs.readFileSync(path.join(dir,fs.readdirSync(dir).find(x=>x.startsWith(c+'-')))))]));
const rows=[];
function run(code,name,input,type,pattern,component){let row={code,name,input,expected:type,pattern:pattern?.source,component};try{let r=E.assess(p[code],input);row.actual={action:r.actionType,findings:r.findings.map(f=>({id:f.ruleId,type:f.actionType,text:[f.explanation,(p[code].rule_engine.rules.find(x=>(x.rule_id||x.id)===f.ruleId)||{}).explanation].filter(Boolean).join(' '),components:f.action?.components})),errors:r.errors,invalid:r.invalid};assert.deepEqual(r.errors,[]);require("../../../tests/helpers/source-input-validation-v08421.cjs")(r);if(type==='incomplete')assert.equal(r.actionType,'incomplete');else if(type==='absent'){assert(!row.actual.findings.some(f=>pattern.test(f.text||'')),'Unexpected source dose action');}else{assert(row.actual.findings.some(f=>(f.type===type||((type==='consultant_review'&&/75%|80%.*Day 1|ORIGINAL/.test(pattern?.source||''))&&f.type==='dose_reduce')||(type==='withhold'&&f.type==='withhold_then_reduce'))&&(!pattern||pattern.test(f.text||''))&&(!component||f.components?.includes(component))),`Missing ${type} ${pattern}`);assert(!['proceed','proceed_with_caution'].includes(r.actionType));}let m=D.buildModificationModel(p[code],r);assert(!m.rows.some(x=>/^\d+(\.\d+)?\s*mg/.test(x.protocolDose||'')),'Unresolved decision yielded an absolute patient dose');row.pass=true;}catch(e){row.pass=false;row.error=e.message;}rows.push(row);}
function check(code,name,fn){let row={code,name};try{fn();row.pass=true}catch(e){row.pass=false;row.error=e.message}rows.push(row);}
for(const c of ['00430','00749']){
 run(c,'Blank form never clears treatment',{},'incomplete');
 run(c,'Pregnancy exclusion',{pregnancy_or_breastfeeding:true},'contraindicated',/pregnancy|breastfeeding/i);
 run(c,'Drug hypersensitivity exclusion',{hypersensitivity:true},'contraindicated',/hypersensitivity/i);
 run(c,'Indication is not applicable',{indication_eligible:false},'consultant_review',/indication/i);
 run(c,'ECOG outside source',{ecog:c==='00430'?2:3},'consultant_review',/ECOG/i);
 run(c,'Unresolved required tests',{pretreatment_tests_unresolved:true},'consultant_review',/test|result/i);
 run(c,'Indexed eGFR not interchangeable',{renal_measure_type:'indexed_egfr'},'consultant_review',/indexed/i);
 run(c,'Dialysis timing',{haemodialysis:true},'consultant_review',/6.*12.*hours/i,'gemcitabine');
 run(c,'Nausea excluded from fixed nonhaem reductions',{nonhaem_toxicity_grade:4,toxicity_excludes_nausea_vomiting:false},'consultant_review',/excludes nausea|excludes.*vomiting/i);
 run(c,'Nonhaem category missing',{nonhaem_toxicity_grade:4},'consultant_review',/exact adverse|category/i);
 run(c,'Unknown renal method',{renal_measure_type:'nonsense'},'consultant_review',/unrecognised/i);
}
for(const anc of [0,.5,.99])run('00430','Day1 low ANC '+anc,{treatment_day:'day1',anc},'delay',/ANC.*≥1|Day 1/i);
for(const platelets of [0,75,99])run('00430','Day1 low platelets '+platelets,{treatment_day:'day1',platelets},'delay',/platelets.*≥100|Day 1/i);
run('00430','Day1 inclusive exact boundaries',{treatment_day:'day1',anc:1,platelets:100},'absent',/delay Day 1/i);
run('00430','Counts without treatment day',{anc:.8},'consultant_review',/choose Day 1 or Day 8/i);
run('00430','Invalid treatment day',{treatment_day:'day15'},'consultant_review',/unrecognised/i);
for(const anc of [0,.5,.749])run('00430','Day8 omit ANC '+anc,{treatment_day:'day8',anc},'omit',/both.*Day.?8|both.*drugs/i);
for(const platelets of [0,50,74])run('00430','Day8 omit platelets '+platelets,{treatment_day:'day8',platelets},'omit',/both.*Day.?8|both.*drugs/i);
for(const anc of [.75,.8,.99])run('00430','Day8 80% ANC '+anc,{treatment_day:'day8',anc},'consultant_review',/80%.*Day 1/i);
for(const platelets of [75,80,99])run('00430','Day8 80% platelets '+platelets,{treatment_day:'day8',platelets},'consultant_review',/80%.*Day 1/i);
run('00430','Day8 rounded ANC gap',{treatment_day:'day8',anc:.995},'consultant_review',/unassigned|round/i);
run('00430','Day8 rounded platelet gap',{treatment_day:'day8',platelets:99.5},'consultant_review',/unassigned|round/i);
run('00430','Day8 exact normal boundaries',{treatment_day:'day8',anc:1,platelets:100},'absent',/omit BOTH|source specifies BOTH/i);
run('00430','Severe competing platelet count wins',{treatment_day:'day8',anc:.8,platelets:20},'omit',/not reinstated/i);
run('00430','Current FN urgent not restart percentage',{current_febrile_neutropenia:true},'withhold',/urgent/i);
for(const e of ['day1_delay','febrile_neutropenia','platelets_lt25','bleeding_thrombocytopenia']){
 run('00430','Previous event needs episode/recovery '+e,{haematologic_event:e},'consultant_review',/episode number|recovery/i);
 run('00430','First recovered previous event '+e,{treatment_day:'day1',haematologic_event:e,prior_haematologic_episode:1,anc:1,platelets:100},'consultant_review',/80%.*ORIGINAL/i);
 run('00430','Second recovered previous event '+e,{treatment_day:'day1',haematologic_event:e,prior_haematologic_episode:2,anc:1,platelets:100},'consultant_review',/60%.*ORIGINAL/i);
}
run('00430','Unrecovered restart still delayed',{treatment_day:'day1',haematologic_event:'febrile_neutropenia',prior_haematologic_episode:1,anc:.9,platelets:100},'delay',/delay/i);
run('00430','Third haem event not extrapolated',{haematologic_event:'day1_delay',prior_haematologic_episode:'3plus'},'consultant_review',/no extrapolated|third/i);
for(const n of [0,19.9,20])run('00430','Carboplatin prohibited GFR '+n,{gfr_ml_min:n,renal_measure_type:'measured'},'contraindicated',/do not administer carboplatin/i,'carboplatin');
for(const n of [20.01,25,30])run('00430','Carboplatin caution GFR '+n,{gfr_ml_min:n,renal_measure_type:'measured'},'consultant_review',/extreme caution/i,'carboplatin');
run('00430','Myelosuppression risk below60',{gfr_ml_min:59.9,renal_measure_type:'measured'},'consultant_review',/myelosuppression/i,'carboplatin');
run('00430','Calvert upper cap',{gfr_ml_min:126,renal_measure_type:'measured'},'consultant_review',/125.*AUC 2/i,'carboplatin');
run('00430','CrCl source method missing',{gfr_ml_min:90},'consultant_review',/confirm whether|method/i,'carboplatin');
run('00430','Estimated GFR stale creatinine',{renal_measure_type:'cg',creatinine_sample_age_hours:49},'consultant_review',/48 hours/i,'carboplatin');
run('00430','Measured GFR creatinine rise',{renal_measure_type:'measured',creatinine_percent_of_isotope_baseline:110.1},'consultant_review',/110%/i,'carboplatin');
run('00430','Unreliable estimate',{renal_estimate_unreliable:true},'consultant_review',/measured GFR/i,'carboplatin');
for(const n of [27,50])run('00430','Hepatic alternative '+n,{bilirubin_micromol_l:n},'consultant_review',/80%.*OR full dose/i,'gemcitabine');
for(const n of [1,2])run('00430','Nonhaem episode '+n,{nonhaem_toxicity_grade:3,toxicity_excludes_nausea_vomiting:true,nonhaem_episode:n},'withhold',/grade ≤1/i);
run('00430','Nonhaem third discontinues',{nonhaem_toxicity_grade:3,toxicity_excludes_nausea_vomiting:true,nonhaem_episode:'3plus'},'discontinue',/third|discontinue/i);
for(const n of [2,3,4])run('00430','Pneumonitis grade '+n,{pneumonitis_grade:n},'discontinue',/pneumonitis/i,'gemcitabine');
run('00430','Suspected drug pneumonitis',{suspected_drug_induced_pneumonitis:true},'discontinue',/suspected.*pneumonitis/i,'gemcitabine');
run('00430','Confirmed SCAR',{scar_status:'confirmed'},'permanently_discontinue',/cutaneous/i,'gemcitabine');
run('00430','Suspected SCAR',{scar_status:'suspected'},'withhold',/suspected/i,'gemcitabine');
for(const n of [1,1.5])run('00749','Initial ANC strict '+n,{assessment_phase:'initial_eligibility',anc_x10e9_l:n},'withhold',/>1.5|above 1.5/i);
run('00749','Initial platelets strict100',{assessment_phase:'initial_eligibility',platelets_x10e9_l:100},'withhold',/>100|above 100/i);
run('00749','Initial creatinine criterion',{assessment_phase:'initial_eligibility',creatinine_uln_multiple:1.51},'consultant_review',/1.5.*ULN/i);
run('00749','Initial transaminase criterion',{assessment_phase:'initial_eligibility',transaminase_uln_multiple:3.01},'consultant_review',/3.*ULN/i);
run('00749','Phase missing for ANC',{anc_x10e9_l:1},'consultant_review',/choose initial|no phase/i);
run('00749','Invalid phase',{assessment_phase:'day99'},'consultant_review',/unrecognised/i);
for(const n of [.5,.99,1])run('00749','Cycle day1 strict ANC '+n,{assessment_phase:'cycle_day_1',anc_x10e9_l:n},'delay',/ANC.*>1|ANC.*above 1/i);
for(const n of [50,99,100])run('00749','Cycle day1 strict platelets '+n,{assessment_phase:'cycle_day_1',platelets_x10e9_l:n},'delay',/platelets.*>100|platelets.*above 100/i);
for(const n of [.49,0])run('00749','Day8/15 omit ANC '+n,{assessment_phase:'cycle_day_8_15',anc_x10e9_l:n},'omit',/omit/i);
for(const n of [49,0])run('00749','Day8/15 omit platelet '+n,{assessment_phase:'cycle_day_8_15',platelets_x10e9_l:n},'omit',/omit/i);
for(const n of [.5,.75,1])run('00749','Day8/15 75% ANC '+n,{assessment_phase:'cycle_day_8_15',anc_x10e9_l:n},'consultant_review',/75%.*gemcitabine|gemcitabine.*75%/i);
for(const n of [50,75,100])run('00749','Day8/15 75% platelet '+n,{assessment_phase:'cycle_day_8_15',platelets_x10e9_l:n},'consultant_review',/75%.*gemcitabine|gemcitabine.*75%/i);
run('00749','Restart ANC exact0.5 not recovered',{assessment_phase:'cycle_day_8_15',restarting_after_omission:true,anc_x10e9_l:.5,platelets_x10e9_l:100},'withhold',/strictly >0.5/i);
run('00749','Restart platelet exact50 not recovered',{assessment_phase:'cycle_day_8_15',restarting_after_omission:true,anc_x10e9_l:1,platelets_x10e9_l:50},'withhold',/strictly >50/i);
run('00749','Current FN urgent',{febrile_neutropenia:true},'withhold',/urgent/i);
for(const k of ['previous_febrile_neutropenia','anc_below_0_5_more_than_5_days','anc_below_0_1_more_than_3_days','platelet_nadir_below_25','cycle_delay_more_than_1_week_due_toxicity'])run('00749','Historical severe event '+k,{[k]:true},'consultant_review',/75%.*ORIGINAL/i);
run('00749','Renal<30 no mandatory reduction',{crcl_ml_min:'lt30'},'consultant_review',/no gemcitabine dose adjustment/i);
run('00749','Bilirubin27 two alternatives',{bilirubin_umol_l:27},'consultant_review',/80%.*OR full dose/i);
run('00749','Grade3 source gap',{nonhaem_toxicity_grade:3,toxicity_excludes_nausea_vomiting:true},'consultant_review',/printed.*>3.*>4/i);
run('00749','Grade4 source choice',{nonhaem_toxicity_grade:4,toxicity_excludes_nausea_vomiting:true},'withhold',/50%.*OR discontinuation/i);
run('00749','SCAR permanent stop',{severe_cutaneous_adverse_reaction:true},'permanently_discontinue',/cutaneous/i);
run('00749','Suspected SCAR urgent',{suspected_severe_cutaneous_adverse_reaction:true},'withhold',/suspected/i);
check('00430','Source schedule both drugs D1 and8 carboplatin AUC2 first',()=>{const phase=p['00430'].treatment_phases[0];assert.equal(phase.cycle_length_days,21);assert.deepEqual(phase.administration.map(x=>[x.day,x.order,x.drug,x.dose.value]),[[1,1,'carboplatin',2],[1,2,'gemcitabine',1000],[8,1,'carboplatin',2],[8,2,'gemcitabine',1000]]);});
check('00430','Exact TNBC indication with no ovarian choices',()=>{assert.deepEqual(p['00430'].indications.map(x=>x.code),['00430a']);assert(!p['00430'].input_definitions.indication_id.options.some(x=>/ovarian|00306/i.test(x.label)));});
check('00749','Source schedule 800 D1,8,15 q28 and6to8 cycles',()=>{const phase=p['00749'].treatment_phases[0];assert.equal(phase.cycle_length_days,28);assert.deepEqual(phase.administration.map(x=>[x.day,x.drug,x.dose.value]),[[1,'gemcitabine',800],[8,'gemcitabine',800],[15,'gemcitabine',800]]);assert(/6.*8/.test(phase.duration));});
const report={mode,total:rows.length,passed:rows.filter(x=>x.pass).length,failed:rows.filter(x=>!x.pass).length,results:rows};fs.writeFileSync(path.join(__dirname,mode+'-results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({mode,total:report.total,passed:report.passed,failed:report.failed}));for(const x of rows.filter(x=>!x.pass))console.log(x.name+': '+x.error);process.exitCode=report.failed?1:0;
