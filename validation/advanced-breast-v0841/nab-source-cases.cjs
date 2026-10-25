'use strict';
// Source-first boundary cases: NCCP 00230 v7 and 00736 v2, downloaded 2026-10-18.
// This harness executes the real assessment engine AND displayed component-dose model.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const repo=process.env.SACT_REPO||path.resolve(__dirname,'../..');
const E=require(path.join(repo,'js/assessment-engine')),D=require(path.join(repo,'js/protocol-dose-schedule'));
const P=Object.fromEntries([['00230','00230-nab-paclitaxel-q21d.json'],['00736','00736-nab-paclitaxel-weekly.json']].map(([c,f])=>[c,JSON.parse(fs.readFileSync(path.join(repo,'protocols/breast',f),'utf8'))]));
const results=[];let failed=0;
const holds=new Set(['delay','withhold','delay_then_dose_reduce','withhold_then_reduce','contraindicated','omit','discontinue','permanently_discontinue']);
const reviews=new Set([...holds,'consultant_review','dose_reduce','dose_reduce_one_level']);
function findings(r){return r.findings.filter(f=>!f.domainAssessment&&!/^PARTIAL_/.test(f.ruleId||''));}
function has(r,types){return findings(r).some(f=>types.has(f.actionType));}
function body(r){return findings(r).map(f=>f.explanation||f.action?.recommendation||'').join(' ');}
function rows(m){return m.rows||[];}
function noNumeric(m){for(const row of rows(m))assert(!row.quantified||!/^\s*\d/.test(row.protocolDose||''),'Unresolved source / hold produces numeric dose '+row.protocolDose);}
function noHigher(m,current){for(const row of rows(m).flatMap(x=>[x,...(x.allActions||[])])){let n=String(row.protocolDose||'').match(/^\s*(\d+(?:\.\d+)?)\s*mg\s*\/\s*m/);if(row.quantified&&n)assert(+n[1]<=current,'Dose tile increased '+current+' to '+n[1]);}}
function dose(m,n){assert(rows(m).some(x=>x.quantified&&x.protocolDose===n+' mg/m²'),'Visible dose should be '+n+' mg/m²; actual '+JSON.stringify(rows(m).map(x=>x.protocolDose)));}
function run(code,name,input,check,source){let rec={code,name,input,source};try{let r=E.assess(P[code],input),m=D.buildModificationModel(P[code],r);assert.deepEqual(r.errors,[]);assert.deepEqual(r.invalid,[]);for(const f of findings(r))for(const c of f.action?.components||[])assert.equal(c,'nab-paclitaxel');check(r,m);if(code==='00736')noHigher(m,100);if(input.current_nab_paclitaxel_mg_m2)noHigher(m,input.current_nab_paclitaxel_mg_m2);rec.pass=true;rec.actual=r.actionType;rec.findings=findings(r).map(f=>f.ruleId);rec.display=rows(m).map(x=>({action:x.actionType,dose:x.protocolDose,quantified:x.quantified}));}catch(e){rec.pass=false;rec.error=e.message;failed++;}results.push(rec);}
const h=(r,m)=>{assert(has(r,holds),'Expected hold / exclusion');noNumeric(m);};
const rev=(r,m)=>{assert(has(r,reviews),'Expected actionable source review');noNumeric(m);};
for(const c of Object.keys(P)){
 run(c,'Blank input is not normal',{},(r,m)=>{assert.equal(r.actionType,'incomplete');assert.equal(m.hasQuantified,false);},'Missing-data policy');
 for(const f of ['hypersensitivity','breastfeeding'])run(c,'Explicit exclusion '+f,{[f]:true},h,'p1 exclusions');
 for(const anc of [0,.49,1,1.49])run(c,'Baseline ANC exclusion '+anc,{assessment_stage:'baseline',anc},h,'p1 baseline ANC <1.5');
 for(const ecog of [3,4])run(c,'Outside source ECOG '+ecog,{ecog},rev,'p1 ECOG 0–2');
 for(const f of ['indication_eligible'])run(c,'Eligibility unresolved',{[f]:false},rev,'p1 indication');
 for(const f of ['pregnancy','active_or_recent_severe_infection'])run(c,'Clinical safety review '+f,{[f]:true},rev,'Explicitly labelled safety prompt; no invented source dose rule');
 for(const f of ['disease_progression','unacceptable_toxicity'])run(c,'Source termination '+f,{[f]:true},(r,m)=>{assert(has(r,new Set(['discontinue'])));noNumeric(m);},'p1 duration');
 for(const f of ['febrile_neutropenia','suspected_pneumonitis','extravasation','cardiac_symptoms'])run(c,'Current safety concern '+f,{[f]:true},h,'p2/p4 urgent toxicity review; no restart dose');
 for(const f of ['significant_cardiac_history','previous_anthracycline'])run(c,'Conditional baseline cardiac check '+f,{assessment_stage:'baseline',[f]:true},rev,'p2 conditional cardiac assessment');
 for(const crcl of [0,15,29.9,30,60,120])run(c,'Renal source no-adjustment '+crcl,{crcl_ml_min:crcl},r=>{assert(!has(r,reviews));assert(/no.*adjustment/i.test(body(r)));},'p3 Table3');
 run(c,'Dialysis no automatic renal reduction',{haemodialysis:true},r=>{assert(!has(r,reviews));assert(/no.*adjustment/i.test(body(r)));},'p3 Table3');
 for(const hepatic_impairment of ['moderate','severe','moderate_severe'])run(c,'Hepatic category '+hepatic_impairment,{hepatic_impairment},rev,'p3 approximate80%; weekly severe conflict p1');
 for(const current of [50,60,80,100,180,220])run(c,'Hepatic reference never re-escalates '+current,{hepatic_impairment:'moderate',current_nab_paclitaxel_mg_m2:current},rev,'p3 original-dose basis needs specialist dose-history review');
 for(const neuropathy_grade of [3,4])for(const neuropathy_occurrence of [undefined,1,2,3]){
  const input={neuropathy_grade};if(neuropathy_occurrence!==undefined)input.neuropathy_occurrence=neuropathy_occurrence;
  run(c,'Current neuropathy '+neuropathy_grade+' occurrence '+neuropathy_occurrence,input,h,'p3 Table4; missing occurrence cannot clear the hold');
 }
 for(const current of [50,60,80,100,180,220])run(c,'Grade4 second source alternatives retained at '+current,{neuropathy_grade:4,neuropathy_occurrence:2,current_nab_paclitaxel_mg_m2:current},(r,m)=>{h(r,m);assert(/discontinue OR hold/i.test(body(r)));assert(!has(r,new Set(['discontinue','permanently_discontinue'])));},'p3 Table4 gives a consultant choice, not mandatory cessation');
 run(c,'Recovered neuropathy missing history does not infer dose',{prior_neuropathy_grade:3,neuropathy_grade:1},rev,'p3 Table4');
}
// 00230 Table1: boundary matrix independent of current rule identities.
for(const anc of [.49,.99,1,1.49,1.5,2])for(const platelets of [49,99,100,200])run('00230',`q21d counts ANC${anc} platelets${platelets}`,{assessment_stage:'on_treatment',anc,platelets},(r,m)=>{if(anc<1.5||platelets<100)h(r,m);else assert(!has(r,reviews),'Recovered counts alone must not trigger a reduction');},'00230p2 Table1');
run('00230','Intermediate ANC source unit discrepancy visible',{anc:1.2,platelets:200},(r,m)=>{h(r,m);assert(/without \/m²|unit discrepancy/i.test(body(r)));},'00230p2 Table1 prints220mg in intermediate row');
run('00230','Two-cycle nonresponse stops treatment',{no_response_after_two_cycles:true},(r,m)=>{assert(has(r,new Set(['discontinue'])));noNumeric(m);},'00230p1');
run('00230','Grade2 is caution rather than categorical exclusion',{neuropathy_grade:2},(r,m)=>{assert(has(r,new Set(['consultant_review'])));assert(!has(r,holds));noNumeric(m);},'00230p1 cautions');
for(const occ of [1,2,3])for(const current of [undefined,100,180,220,260]){
 const input={febrile_neutropenia_occurrences:occ,anc:2,platelets:200};if(current!==undefined)input.current_nab_paclitaxel_mg_m2=current;
 run('00230',`q21d FN${occ} recovered current${current}`,input,(r,m)=>{if(occ<=2&&current>=(occ===1?220:180))dose(m,occ===1?220:180);else rev(r,m);},'00230p2 Table2 occurrence targets; never re-escalate');
}
for(const omitted of ['anc','platelets','current_nab_paclitaxel_mg_m2']){let input={febrile_neutropenia_occurrences:1,anc:2,platelets:200,current_nab_paclitaxel_mg_m2:260};delete input[omitted];run('00230','FN missing '+omitted,input,rev,'00230p2 recovery/current-dose context required');}
run('00230','FN boolean without occurrence acts',{febrile_neutropenia_prior:true},rev,'00230p2 first/second occurrence decision');
for(const [occ,target]of [[1,220],[2,180]])run('00230','Recovered grade3 neuropathy occurrence'+occ,{prior_neuropathy_grade:3,neuropathy_grade:1,neuropathy_occurrence:occ,current_nab_paclitaxel_mg_m2:260},(r,m)=>dose(m,target),'00230p3 Table4');
// Weekly counts: lower table thresholds only apply when cycle/day is known; conflicting p4 text never silently cleared.
for(const day of [1,8,15,undefined])for(const [anc,platelets,expected]of [[.49,100,'hold'],[2,49,'hold'],[.5,50,'hold'],[.99,74,'hold'],[.8,100,'hold'],[2,60,'hold'],[1,75,'hold'],[1,100,'hold'],[1.2,75,'hold'],[1.2,80,'day'],[1.5,100,'day'],[1.51,101,'none'],[2,200,'none']]){
 const input={assessment_stage:'on_treatment',anc,platelets};if(day!==undefined)input.cycle_day=day;
 run('00736',`weekly counts day${day} ANC${anc} platelets${platelets}`,input,(r,m)=>{if(expected==='hold'||expected==='day'&&(day===1||day===undefined))h(r,m);else assert(!has(r,reviews),'No actionable count criterion applies to this complete in-cycle value');},'00736p2 Table2 and p4 subsequent-cycle conflict; exact1/75 overlap held for review');
}
for(const f of ['anc','platelets'])for(const value of (f==='anc'?[.49,.8,1,1.5]:[49,60,75,100]))run('00736','Partial count no false clearance '+f+value,{[f]:value},h,'00736p2/p4; missing other count or cycle day cannot clear a source hold');
for(const f of ['febrile_neutropenia_prior','prior_myelosuppression_delay'])for(const current of [undefined,60,80,100]){
 const input={[f]:true,anc:2,platelets:200};if(current!==undefined)input.current_nab_paclitaxel_mg_m2=current;
 run('00736',`Weekly ${f} recovered current${current}`,input,(r,m)=>{if(current===100||current===80)dose(m,current-20);else rev(r,m);},'00736p2 Table1/2 one level from current100→80→60; no invented level below60');
}
for(const current of [100,80])run('00736','Weekly recovered neuropathy current'+current,{prior_neuropathy_grade:3,neuropathy_grade:1,neuropathy_occurrence:1,current_nab_paclitaxel_mg_m2:current},(r,m)=>dose(m,current-20),'00736p3 one level from current dose');
for(const omitted of ['anc','platelets','current_nab_paclitaxel_mg_m2']){let input={febrile_neutropenia_prior:true,anc:2,platelets:200,current_nab_paclitaxel_mg_m2:100};delete input[omitted];run('00736','Weekly FN missing '+omitted,input,rev,'00736p2/p4 required recovery/dose-history context');}
for(const f of ['off_label_consent_confirmed','standard_paclitaxel_unsuitable'])run('00736','Weekly indication governance '+f,{[f]:false},rev,'00736p1,p6');
for(const stage of [undefined,'baseline','on_treatment']){const input={neuropathy_grade:2};if(stage)input.assessment_stage=stage;run('00736','Grade2 source conflict stage'+stage,input,h,'00736p1 exclusion versus p3 recovery≤2');}
for(const [f,boundary]of [['bilirubin_uln_multiple',5],['ast_uln_multiple',10]])for(const n of [boundary-.01,boundary,boundary+.01])run('00736',f+' boundary'+n,{[f]:n},(r,m)=>{if(n>boundary){h(r,m);assert(has(r,new Set(['contraindicated'])));}else assert(!has(r,new Set(['contraindicated'])));},'00736p3 Table3 strict >5bilirubin or >10AST');
run('00736','Severe hepatic standalone input',{severe_hepatic_impairment:true},h,'00736p1 exclusion vs p3 conflict');
run('00736','Day22 break has no administration',{cycle_day:22},(r,m)=>{assert(has(r,new Set(['omit'])));noNumeric(m);},'00736p1 days1,8,15 q28d');
for(const [c,current,target]of [['00230',260,220],['00736',100,80],['00736',80,60]])run(c,'Recovered first grade4 event current'+current,{prior_neuropathy_grade:4,neuropathy_grade:1,neuropathy_occurrence:1,current_nab_paclitaxel_mg_m2:current},(r,m)=>dose(m,target),'p3 Table4 first grade4 event has first reduction after recovery');
for(const c of Object.keys(P))run(c,'Hepatic review blocks competing numeric FN tile',{hepatic_impairment:'moderate',febrile_neutropenia_occurrences:1,anc:2,platelets:200,current_nab_paclitaxel_mg_m2:c==='00230'?260:100},rev,'p3 original-dose hepatic recommendation cannot be silently combined with a toxicity ladder');
function structural(name,fn){try{fn();results.push({name,pass:true});}catch(e){failed++;results.push({name,pass:false,error:e.message});}}
structural('Schedule/source identity and independent indication mapping',()=>{for(const [c,start,cycle,days,pages]of [['00230',260,21,1,5],['00736',100,28,[1,8,15],6]]){const p=P[c],ph=p.treatment_phases[0],a=ph.administration[0];assert.equal(p.metadata.source_document_pages,pages);assert.equal(p.metadata.source_checked_date,'2026-10-25');assert.equal(p.metadata.sactcheck_encoding_version,'0.84.19');assert.equal(ph.cycle_length_days,cycle);assert.equal(a.drug,'nab-paclitaxel');assert.equal(a.dose.value,start);assert.deepEqual(a.day,days);assert.deepEqual(p.indications.map(x=>x.code),[c+'a']);assert(/metastatic/i.test(p.metadata.indication));}});
structural('Weekly dose ladder never contains q21d220/180',()=>{const s=JSON.stringify({rules:P['00736'].rule_engine.rules,phases:P['00736'].treatment_phases,levels:P['00736'].dose_levels});assert(!/\b(?:220|180)\s*mg/.test(s),'Copied q21d dose remains');assert.deepEqual(P['00736'].dose_levels.map(x=>x.dose_mg_m2),[100,80,60]);assert.equal(P['00736'].indications[0].off_label,true);});
structural('Source-specific monitoring and premedication retained',()=>{for(const c of Object.keys(P)){assert(/None usually required/i.test(P[c].supportive_care.premedication));assert.equal(P[c].supportive_care.emetogenic_risk,'low');assert(P[c].metadata.source_monitoring.ongoing.some(x=>/before (each|every) cycle|start of each cycle/.test(x)));}assert(P['00736'].metadata.source_monitoring.ongoing.some(x=>x.startsWith('Day 8 FBC')));assert(!P['00230'].metadata.source_monitoring.ongoing.some(x=>x.startsWith('Day 8 FBC')));});
const out={checked_at:new Date().toISOString(),repo,total:results.length,passed:results.length-failed,failed,cases:results};fs.writeFileSync(path.join(__dirname,'nab-source-cases-results.json'),JSON.stringify(out,null,2)+'\n');console.log(`Nab-paclitaxel source audit: ${out.passed}/${out.total} passed.`);for(const r of results.filter(x=>!x.pass))console.error(r.code||'STRUCTURE',r.name,r.error);process.exitCode=failed?1:0;
