'use strict';
// Independent threshold and clinical-history cases from current NCCP sources and labelled EMA supplements.
// Usage: node .../source-cases.cjs baseline|proposed|integrated
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const mode=process.argv[2]||'proposed',repo=path.resolve(__dirname,'../../..');
assert(['baseline','proposed','integrated'].includes(mode));
const base=mode==='baseline'?path.join(__dirname,'../baseline'):mode==='proposed'?path.join(__dirname,'proposed'):path.join(repo,'protocols/breast');
const E=require(path.join(repo,'js/assessment-engine')),D=require(path.join(repo,'js/protocol-dose-schedule'));
const codes=['00202','00230','00736','00743','00485'];
const P=Object.fromEntries(codes.map(c=>[c,JSON.parse(fs.readFileSync(path.join(base,fs.readdirSync(base).find(x=>x.startsWith(c+'-')&&x.endsWith('.json')))))]));
const results=[];
const holds=new Set(['delay','withhold','delay_then_dose_reduce','withhold_then_reduce','contraindicated','omit','discontinue','permanently_discontinue']);
const reviews=new Set([...holds,'consultant_review','dose_reduce','dose_reduce_one_level']);
const ff=r=>r.findings.filter(x=>!x.domainAssessment&&!/^PARTIAL_/.test(x.ruleId||''));
const has=(r,s)=>ff(r).some(x=>s.has(x.actionType));
const txt=r=>ff(r).map(x=>x.explanation||x.action?.recommendation||x.action?.message||'').join(' ');
const noNum=m=>assert(!m.rows.some(x=>x.quantified&&/^\s*\d/.test(x.protocolDose||'')),'Unexpected numeric restart: '+JSON.stringify(m.rows.map(x=>x.protocolDose)));
const h=(r,m)=>{assert(has(r,holds),'Expected treatment hold/exclusion');noNum(m);};
const rev=(r,m)=>{assert(has(r,reviews),'Expected source review');noNum(m);};
const calm=r=>assert(!has(r,reviews),'Unexpected hold/reduction/review: '+JSON.stringify(ff(r).map(x=>x.ruleId)));
const specific=(a)=>(r,m)=>{assert(has(r,new Set([a])),'Expected '+a);if(holds.has(a))noNum(m);};
function dose(m,comp,n){assert(m.rows.some(x=>x.componentId.replace(/_/g,'-')===comp&&x.quantified&&x.protocolDose===n+' mg/m²'),'Missing '+comp+' '+n+'mg/m²; '+JSON.stringify(m.rows));}
function run(code,name,input,check,source){const rec={code,name,input,source};try{const actual={...input};for(const [short,long]of [['anc','anc_x10e9_l'],['platelets','platelets_x10e9_l']])if(P[code].input_definitions[long]&&Object.prototype.hasOwnProperty.call(actual,short)){actual[long]=actual[short];delete actual[short];}const r=E.assess(P[code],actual),m=D.buildModificationModel(P[code],r);assert.deepEqual(r.errors,[]);require("../../../tests/helpers/source-input-validation-v08421.cjs")(r);check(r,m);rec.pass=true;rec.action=r.actionType;rec.findings=ff(r).map(x=>x.ruleId);rec.display=m.rows.map(x=>({component:x.componentId,action:x.actionType,dose:x.protocolDose,quantified:x.quantified}));}catch(e){rec.pass=false;rec.error=e.message;}results.push(rec);}
function structural(name,check){try{check();results.push({name,pass:true});}catch(e){results.push({name,pass:false,error:e.message});}}
for(const c of codes){
 run(c,'Blank input never clears treatment',{},(r,m)=>{assert.equal(r.actionType,'incomplete');noNum(m);},'Missing data policy');
 run(c,'Source hypersensitivity exclusion',{hypersensitivity:true},h,'NCCP exclusions');
 run(c,'ECOG outside 0–2',{ecog:3},rev,'NCCP eligibility');
 run(c,'Indication needs confirmation',{indication_eligible:false},rev,'NCCP p1 indication');
}
// Docetaxel: ANC threshold, hepatic source ambiguity, history, steroid and safety supplements.
for(const anc of [0,.49,.5,1.49,1.5,2])for(const assessment_stage of ['baseline','ongoing'])run('00202',`Doc ANC${anc} ${assessment_stage}`,{anc,assessment_stage},anc<1.5?h:calm,'00202p2: ANC≥1.5');
for(const [field,n]of [['bilirubin_uln_multiple',1.5],['ast_uln_multiple',10],['alt_uln_multiple',10],['alp_uln_multiple',6]])for(const value of [n-.01,n,n+.01])run('00202',`${field} ${value}`,{[field]:value},value>n?h:rev,'00202p3 independent severe limits; overlapping lesser rows reviewed');
run('00202','Recovered prior FN remains dose-relevant',{prior_febrile_neutropenia:true,anc:2,current_docetaxel_mg_m2:100},(r,m)=>{rev(r,m);assert(/100.*75.*60/.test(txt(r)));assert(!has(r,new Set(['withhold'])));},'00202p2 Table1');
run('00202','Acute FN needs hold',{febrile_neutropenia:true},h,'00202p2');
for(const days of [7,7.01,8])run('00202','Recovered prolonged neutropenia '+days,{anc:2,anc_below_0_5_days:days},days>7?rev:calm,'00202p2 >one week');
for(const grade of [2,3,4])run('00202','Neuropathy grade'+grade,{neuropathy_grade:grade,current_docetaxel_mg_m2:100},grade>2?(r,m)=>dose(m,'docetaxel',75):calm,'00202p3 >grade2 ladder');
run('00202','Persistent severe neuropathy at60 has labelled EMA stop',{neuropathy_grade:3,current_docetaxel_mg_m2:60,toxicity_persists_at_reduced_dose:true},(r,m)=>{specific('discontinue')(r,m);assert(ff(r).some(x=>/EMA|SmPC/.test(x.explanation||'')));},'EMA Taxotere §4.2 p5 supplement, not borrowed00203');
run('00202','Mouth toxicity cannot re-escalate lower current dose',{stomatitis_grade:3,current_docetaxel_mg_m2:50},rev,'00202p3 original reference and prior-dose reconciliation');
run('00202','Missed steroid course needs a consultant plan',{premedication_complete:false},(r,m)=>{rev(r,m);assert(/20 mg IV/.test(txt(r)));},'00202p4 premedication');
run('00202','Severe infusion reaction stops docetaxel',{severe_infusion_reaction:true},specific('discontinue'),'00202p4');
run('00202','Enterocolitis is acute',{suspected_neutropenic_enterocolitis:true},h,'00202p4');
run('00202','Breastfeeding source is labelled EMA',{breastfeeding:true},(r,m)=>{h(r,m);assert(/EMA.*4.6/.test(txt(r)));assert(!/explicit NCCP exclusion/.test(txt(r)));},'EMA Taxotere §4.6 p12');
// Both nab regimens retain source-specific original/current dosing and cardiac history.
for(const c of ['00230','00736']){
 for(const crcl_ml_min of [0,29.99,30,80])run(c,'Renal no automatic adjustment '+crcl_ml_min,{crcl_ml_min},calm,'p3 renal table');
 run(c,'Dialysis does not invent renal reduction',{haemodialysis:true},calm,'p3 renal table');
 for(const hepatic_impairment of ['moderate','severe'])run(c,'Hepatic needs source reconciliation '+hepatic_impairment,{hepatic_impairment},rev,'p3 approximately80% original, weeklyp1 severe exclusion');
 for(const neuropathy_grade of [3,4])run(c,'Current neuropathy hold '+neuropathy_grade,{neuropathy_grade},h,'p3 Table4');
 for(const f of ['previous_anthracycline','significant_cardiac_history'])run(c,'Conditional cardiac '+f,{assessment_stage:'baseline',[f]:true},rev,'p2 baseline');
 run(c,'Grade4 second event retains consultant alternatives',{neuropathy_grade:4,neuropathy_occurrence:2},(r,m)=>{h(r,m);assert(/discontinue OR hold/i.test(txt(r)));},'p3 Table4 alternatives');
}
for(const anc of [.99,1,1.49,1.5,2])for(const platelets of [99,100,101])run('00230',`q21 counts${anc}/${platelets}`,{assessment_stage:'on_treatment',anc,platelets},anc<1.5||platelets<100?h:calm,'00230p2 Table1');
run('00230','Stop if no response after2cycles',{no_response_after_two_cycles:true},specific('discontinue'),'00230p1 duration');
for(const [occ,target]of [[1,220],[2,180]])for(const current of [100,180,220,260])run('00230',`PriorFN${occ} actual${current}`,{febrile_neutropenia_occurrences:occ,anc:2,platelets:200,current_nab_paclitaxel_mg_m2:current},current>=target?(r,m)=>dose(m,'nab-paclitaxel',target):rev,'00230p2 Table2, never re-escalate');
for(const cycle_day of [1,8,15])for(const [anc,platelets]of [[.49,200],[2,49],[.8,100],[2,60],[1,75],[1.2,80],[1.5,100],[1.51,101]])run('00736',`weekly day${cycle_day} counts${anc}/${platelets}`,{assessment_stage:'on_treatment',cycle_day,anc,platelets},anc<1||platelets<75||anc===1||platelets===75||cycle_day===1&&(anc<=1.5||platelets<=100)?h:calm,'00736p2 Table2 and p4 subsequent-cycle strict recovery');
run('00736','Unspecified cycle-day does not clear lower day-table threshold',{anc:1.2,platelets:80},h,'00736p2/p4 cycle context');
run('00736','Day22 is not a planned dose',{cycle_day:22},specific('omit'),'00736p1 schedule');
for(const [f,n]of [['bilirubin_uln_multiple',5],['ast_uln_multiple',10]])for(const x of [n,n+.01])run('00736',`Weekly hepatic limit${f}/${x}`,{[f]:x},x>n?h:r=>assert(!has(r,new Set(['contraindicated']))),'00736p3 strict numeric severe threshold');
for(const current of [100,80,60])run('00736','Recovered FN ladder actual'+current,{febrile_neutropenia_prior:true,anc:2,platelets:200,current_nab_paclitaxel_mg_m2:current},current>60?(r,m)=>dose(m,'nab-paclitaxel',current-20):rev,'00736p2 one level100→80→60');
for(const f of ['off_label_consent_confirmed','standard_paclitaxel_unsuitable'])run('00736','Weekly governance '+f,{[f]:false},rev,'00736p1/p6');
// Eribulin initial eligibility, both dose days and the base-dose ladder remain distinct.
for(const assessment_phase of ['initial_eligibility','treatment_day'])for(const anc of [.99,1,1.49,1.5])for(const platelets of [74,75,100,101])run('00743',`Eri ${assessment_phase} ANC${anc}/plt${platelets}`,{assessment_phase,anc,platelets},(assessment_phase==='initial_eligibility'?(anc<1.5||platelets<=100):(anc<1||platelets<75))?h:calm,'00743p1 initial ANC≥1.5/plt>100; p2 dose-day ANC≥1/plt≥75');
for(const assessment_day of [1,15])run('00743','Current severe toxicity day'+assessment_day,{assessment_day,current_nonhaem_toxicity_grade:3},h,'00743p2 D1 or15');
for(const f of ['congenital_long_qt','acute_febrile_neutropenia'])run('00743','Eri urgent '+f,{[f]:true},h,'00743p2/p4');
run('00743','Uncorrected electrolytes need correction',{uncorrected_low_electrolytes:true},rev,'00743p4');
run('00743','QT risk requests ECG review',{qt_risk_factors:true},rev,'00743p2/p4');
for(const x of [49.99,50,50.01])run('00743','Eri renal boundary '+x,{creatinine_clearance_ml_min:x},x<50?rev:calm,'00743p3 <50:80%original, reconcile current dose');
for(const child_pugh_class of ['A','B','C'])run('00743','Eri Child Pugh'+child_pugh_class,{child_pugh_class},rev,'00743p3 A80%B50%Cnotrecommended');
for(const f of ['indication_eligible','off_label_consent_confirmed'])run('00743','Eri governance '+f,{[f]:false},rev,'00743p1/p5');
// DDAC/weekly paclitaxel: phase, prior event and exact restart boundaries.
for(const anc of [.99,1,1.01,1.5])for(const platelets of [99,100,100.01,200])run('00485',`AC untreated counts${anc}/${platelets}`,{treatment_phase:'anthracycline',assessment_stage:'ongoing',anc,platelets},anc<1||platelets<100?h:calm,'00485p3 full-dose ≥1/≥100 row');
for(const anc of [1,1.01,2])for(const platelets of [100,100.01,200])for(const context of ['restart_after_count_delay','ac_delay_count'])run('00485',`AC delayed restart${anc}/${platelets} ${context}`,{treatment_phase:'anthracycline',assessment_stage:'ongoing',anc,platelets,[context]:context==='ac_delay_count'?1:true},anc<=1?h:platelets===100?rev:calm,'00485p3 restart ANC>1; platelet100 depends on previous delay reason');
for(const prior_ac_delay_reason of ['neutropenia','thrombocytopenia','both','unknown'])run('00485','AC platelet100 after '+prior_ac_delay_reason,{treatment_phase:'anthracycline',assessment_stage:'ongoing',anc:2,platelets:100,restart_after_count_delay:true,prior_ac_delay_reason},prior_ac_delay_reason==='neutropenia'?h:prior_ac_delay_reason==='thrombocytopenia'?calm:rev,'00485p3 VISUAL row >100 vs ≥100');
for(const f of ['anc','platelets'])run('00485','AC restart missing '+f,{treatment_phase:'anthracycline',assessment_stage:'ongoing',restart_after_count_delay:true,...(f==='anc'?{platelets:200}:{anc:2})},rev,'00485p3 both recovery counts needed');
for(const f of ['anc','platelets'])run('00485','PriorACdelay missing '+f,{treatment_phase:'anthracycline',assessment_stage:'ongoing',ac_delay_count:1,...(f==='anc'?{platelets:200}:{anc:2})},rev,'00485p3 history implies recovery verification');
for(const treatment_phase of ['anthracycline','paclitaxel']){
 run('00485','Acute FN phase '+treatment_phase,{treatment_phase,febrile_neutropenia:true},h,'00485p3 acute event before restart');
 run('00485','Prior FN phase '+treatment_phase,{treatment_phase,prior_febrile_neutropenia:true,anc:2,platelets:200},(r,m)=>{rev(r,m);if(treatment_phase==='anthracycline')assert(/75%/.test(txt(r)));else assert(!/75%/.test(txt(r)));},'00485p3 AC75% is not weekly taxane rule');
}
run('00485','Unspecified baseline status cannot clear ANC1.2',{treatment_phase:'anthracycline',anc:1.2,platelets:200},rev,'00485p2 baseline <1.5 versus ongoing');
for(const lvef_percent of [49.9,50,50.1])run('00485','AC LVEF '+lvef_percent,{treatment_phase:'anthracycline',lvef_percent},lvef_percent<50?h:lvef_percent===50?rev:calm,'00485p2 LVEF>50 administration; <50 exclusion');
run('00485','LVEF missing phase does not disappear',{lvef_percent:40},rev,'00485p2 phase context');
run('00485','Projected anthracycline ceiling blocks proposed dose',{projected_doxorubicin_exceeds_limit:true,lifetime_doxorubicin_mg_m2:400,treatment_phase:'anthracycline'},h,'00485p1 450 ceiling including planned dose and individual risk');
for(const phase of ['anthracycline','paclitaxel'])run('00485','G-CSF requirement phase '+phase,{treatment_phase:phase,ac_gcsf_plan_confirmed:false},phase==='anthracycline'?rev:calm,'00485p1 mandatory all AC cycles, not all paclitaxel');
for(const [x,expect]of [[9.99,'hold'],[10,75],[29,75],[29.5,'review'],[30,'none']])run('00485','Cyclo renal boundary '+x,{treatment_phase:'anthracycline',crcl_ml_min:x},expect==='hold'?h:expect==='review'?rev:expect==='none'?calm:(r,m)=>dose(m,'cyclophosphamide',450),'00485p3 original600 renal band75%');
for(const [x,expect]of [[19.99,'none'],[20,30],[50,30],[50.5,'review'],[51,15],[86,15],[86.01,'hold']])run('00485','Doxo bili boundary '+x,{treatment_phase:'anthracycline',bilirubin_umol_l:x},expect==='hold'?h:expect==='review'?rev:expect==='none'?calm:(r,m)=>dose(m,'doxorubicin',expect),'00485p3 bilirubinµmol/L');
for(const [x,expect]of [[1.25,'none'],[1.255,'review'],[1.26,60],[2,60],[2.005,'review'],[2.01,40],[5,40],[5.01,'hold']])run('00485','Pac fixed hepatic dose '+x,{treatment_phase:'paclitaxel',alt_uln_multiple:1,bilirubin_uln_multiple:x,current_paclitaxel_mg_m2:80},expect==='hold'?h:expect==='review'?rev:expect==='none'?calm:(r,m)=>dose(m,'paclitaxel',expect),'00485p4 FIXED60/40mg/m², not00815percent');
for(const [bili,current]of [[1.5,59.99],[1.5,50],[1.5,40],[1.5,1],[1.5,0],[3,39.99],[3,30],[3,1],[3,0]])run('00485',`Pac liver target must not increase actual${current}`,{treatment_phase:'paclitaxel',alt_uln_multiple:1,bilirubin_uln_multiple:bili,current_paclitaxel_mg_m2:current},rev,'00485p4 source target does not authorise re-escalation');
for(const [anc,platelets]of [[.99,200],[1,90],[1,90.01],[2,69.9],[2,70],[2,89.9]])run('00485',`Pac counts${anc}/${platelets}`,{treatment_phase:'paclitaxel',assessment_stage:'ongoing',anc,platelets},anc<1||platelets<90?h:platelets===90?rev:calm,'00485p3 pac threshold and platelet90 overlap');
for(const g of [2,3,4])run('00485','Pac neuropathy'+g,{treatment_phase:'paclitaxel',neuropathy_grade:g,current_paclitaxel_mg_m2:65},g>=3?specific('discontinue'):(r,m)=>{assert(has(r,new Set(['dose_reduce'])));assert(/10 mg/.test(txt(r)));noNum(m);},'00485p4 adverse events: G2 subtract10 actual; G≥3stop');
structural('Clinical approvals remain false and identities stable',()=>{for(const c of codes){let b=JSON.parse(fs.readFileSync(path.join(__dirname,'../baseline',fs.readdirSync(path.join(__dirname,'../baseline')).find(x=>x.startsWith(c+'-')&&x.endsWith('.json')))));assert.equal(P[c].protocol_id,b.protocol_id);for(const k of ['consultant_reviewed','oncology_pharmacy_reviewed','clinical_use_authorised'])assert.equal(P[c].metadata.validation[k],false);}});
structural('Source schedules and no automatic trastuzumab component',()=>{for(const [c,cycle,days]of [['00230',21,1],['00736',28,[1,8,15]],['00743',28,[1,15]]]){const p=P[c],ph=p.treatment_phases[0];assert.equal(ph.cycle_length_days,cycle);assert.deepEqual(ph.administration[0].day,days);assert(!JSON.stringify(ph).includes('trastuzumab'));}});
structural('Normal demonstration values are physiologically sensible',()=>{for(const c of ['00202','00485']){assert(P[c].input_definitions.platelets_x10e9_l.demo_value>=100);assert(P[c].input_definitions.crcl_ml_min.demo_value>=50);}assert(P['00485'].input_definitions.lvef_percent.demo_value>50);});
const failed=results.filter(x=>!x.pass);const report={mode,checked_at:new Date().toISOString(),base,baseline_commit:'6c1050b8a2ced301fe770fe67fd518b5a78566e5',total:results.length,passed:results.length-failed.length,failed:failed.length,cases:results};fs.writeFileSync(path.join(__dirname,mode+'-results.json'),JSON.stringify(report,null,2)+'\n');console.log(`${mode}: ${report.passed}/${report.total} passed`);for(const f of failed)console.error(f.code||'STRUCTURE',f.name,f.error);process.exitCode=mode==='baseline'?0:failed.length?1:0;
