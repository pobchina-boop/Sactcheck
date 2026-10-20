#!/usr/bin/env node
'use strict';
/* Source-derived acceptance checks, NCCP00348v8a /00734v3, independently audited20Oct2026.
 * Run from a checkout: node validation/tnbc-platinum-acceptance.js
 * Or: node tnbc-platinum-acceptance.js --root /path/to/checkout --output /path/to/results.json
 * No network/dependencies and no application mutation. Exit1 if any acceptance assertion fails.
 * These check encoded behaviour, not clinical authorisation or validation of all source tables.
 */
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const args=process.argv.slice(2);function opt(k){const i=args.indexOf(k);return i<0?undefined:args[i+1];}
const candidates=[opt('--root'),process.env.SACTCHECK_ROOT,path.resolve(__dirname,'..'),process.cwd()].filter(Boolean);
const root=candidates.find(p=>fs.existsSync(path.join(p,'js/assessment-engine.js')));
if(!root){console.error('Supply --root /path/to/SACTCheck checkout.');process.exit(2);}
const E=require(path.join(root,'js/assessment-engine.js')),D=require(path.join(root,'js/protocol-dose-schedule.js'));
const P={},paths={},hashes={};
for(const c of ['00348','00734']){const f=fs.readdirSync(path.join(root,'protocols/breast')).find(f=>f.startsWith(c+'-')&&f.endsWith('.json'));assert(f,`Missing protocol${c}`);paths[c]=path.join(root,'protocols/breast',f);P[c]=JSON.parse(fs.readFileSync(paths[c]));}
const sources={
 '00348':{version:'8a',url:'https://healthservice.hse.ie/documents/6812/348_Carboplatin_AUC_6_and_weekly_Paclitaxel_80mgm2.pdf',page_basis:'Physical PDF pages, not erroneous repeated printed footer'},
 '00734':{version:'3',url:'https://healthservice.hse.ie/documents/6605/734_CARBOplatin_AUC2weekly__Paclitaxel_TNBC_v3.pdf',page_basis:'Physical PDF pages'}
};
const cases=[];const tax={treatment_phase:'taxane',assessment_stage:'ongoing',cycle_number:2,day_number:1};const ac={treatment_phase:'ac',assessment_stage:'ongoing',cycle_number:5,day_number:1};
const nonRestrictive=['proceed_with_caution','partial_context_required','incomplete'];
const review=['consultant_review','partial_context_required'];
function add(id,code,inputs,expect,pages,note){cases.push({id,code,inputs,expect,source:{...sources[code],pages,note}});}
// Original55 independent probes, now with explicit semantic acceptance criteria.
for(const code of ['00348','00734']){
 add(code+'-severe-hepatic-baseline',code,{treatment_phase:'taxane',assessment_stage:'baseline',severe_hepatic_impairment:true},{actions:['contraindicated','withhold','consultant_review'],components:['paclitaxel'],noNumeric:true},[3],'Severe hepatic impairment is an explicit paclitaxel exclusion.');
 add(code+'-crcl40-taxane',code,{...tax,crcl_ml_min:40},{actions:['consultant_review'],components:['carboplatin'],text:/myelosuppression/i,noNumeric:true},[5,6],'Source CrCl<60 risk must not be lost by only evaluating a separate GFR input.');
 add(code+'-gfr20-taxane',code,{...tax,gfr_ml_min:20},{actions:['contraindicated','withhold','omit'],components:['carboplatin'],noNumeric:true},[5,6],'GFR<=20: do not administer carboplatin.');
 add(code+'-gfr20-ac',code,{...ac,gfr_ml_min:20},{actions:nonRestrictive,noComponents:['carboplatin']},[1,2,5,6],'Carboplatin is not active in the AC phase; input alone must not create a carboplatin dose action.');
 add(code+'-ddac-anc-equality',code,{...ac,anc_x10e9_l:1,platelets_x10e9_l:150},{actions:review,components:['doxorubicin','cyclophosphamide'],noNumeric:true},[5],'Strict>1 /<1 rows leave ANC1 unassigned; conservative review.');
 add(code+'-ddac-plt-equality',code,{...ac,anc_x10e9_l:2,platelets_x10e9_l:100},{actions:review,components:['doxorubicin','cyclophosphamide'],noNumeric:true},[5],'Strict>100 /<100 rows leave platelets100 unassigned.');
 add(code+'-ddac-low',code,{...ac,anc_x10e9_l:.99,platelets_x10e9_l:99},{actions:['delay','withhold'],components:['doxorubicin','cyclophosphamide'],noNumeric:true},[5],'Both counts low: delay and recovery review; do not infer a restart dose.');
 add(code+'-hepatic-gap',code,{...tax,alt_uln_multiple:2,bilirubin_uln_multiple:1.255},{actions:review,components:['paclitaxel'],noNumeric:true},[5,6],'Fractional bilirubin is between printed1.25 and1.26 boundaries.');
 add(code+'-doxo-gap51',code,{...ac,bilirubin_umol_l:51},{actions:review,components:['doxorubicin'],noNumeric:true},[5,6],'Printed20–50 and>51–86 bands do not assign51.');
 add(code+'-cyclo-gap29_5',code,{...ac,crcl_ml_min:29.5},{actions:review,components:['cyclophosphamide'],noNumeric:true},[5,6],'Printed10–29 and>=30 bands leave a decimal gap; no silent rounding.');
 add(code+'-neuropathy2',code,{...tax,neuropathy_grade:2},{actions:['consultant_review','dose_reduce'],components:['paclitaxel'],noNumeric:true},[6],'Reduction requires current dose and history; no guessed dose.');
 add(code+'-neuropathy3',code,{...tax,neuropathy_grade:3},{actions:['withhold','discontinue'],components:['paclitaxel'],noNumeric:true},[6],'Overlapping neuropathy/reaction wording requires hold or discontinuation pending clarification.');
 add(code+'-two-reductions-only',code,{...tax,paclitaxel_reduction_count:2,intolerant_after_reductions:false},{actions:nonRestrictive,noActions:['discontinue','permanently_discontinue']},[6],'Two reductions alone is not continuing intolerance.');
 add(code+'-two-reductions-intolerant',code,{...tax,paclitaxel_reduction_count:2,intolerant_after_reductions:true},{actions:['discontinue','permanently_discontinue'],components:['paclitaxel'],noNumeric:true},[6],'Intolerable after exactly two reductions: discontinue.');
 add(code+'-unknownphase-anc',code,{anc_x10e9_l:.5},{actions:review,text:/phase/i,noNumeric:true},[4,5],'Unknown phase must not borrow a count table or invent an active regimen.');
 add(code+'-unknownphase-severehepatic',code,{severe_hepatic_impairment:true},{actions:review,text:/phase/i,noNumeric:true},[3,5,6],'Unknown phase must remain unassessed/review.');
 add(code+'-unknownphase-dialysis',code,{haemodialysis:true},{actions:review,text:/phase/i,noNumeric:true},[5,6],'Dialysis action depends on which agents are active.');
 add(code+'-taxane-lvef49',code,{...tax,lvef_percent:49},{actions:['consultant_review','withhold'],noDoseComponents:['doxorubicin'],text:/cardiac|anthracycline/i,noNumeric:true},[3],'During taxane, identify cardiac/future anthracycline review rather than a current doxorubicin dose.');
}
for(const anc of [.49,.5,.99,1])add('00734-weekly-anc-'+anc,'00734',{treatment_phase:'taxane',assessment_stage:'ongoing',anc_x10e9_l:anc},{actions:anc<.5?['delay_then_dose_reduce','delay','withhold']:anc<1?['delay','withhold']:nonRestrictive,...(anc<1?{components:['carboplatin','paclitaxel'],noNumeric:true}:{noRestrictive:true})},[4],'Weekly ANC boundaries; severe low counts delay then consider25% reduction of both agents.');
for(const plt of [49,50,74,75,99,100])add('00734-weekly-plt-'+plt,'00734',{treatment_phase:'taxane',assessment_stage:'ongoing',platelets_x10e9_l:plt},{actions:plt<50?['delay_then_dose_reduce','delay','withhold']:plt<75?['delay','withhold']:plt<100?['consultant_review']:nonRestrictive,...(plt<100?{components:['carboplatin','paclitaxel'],noNumeric:true}:{noRestrictive:true})},[4],'Weekly platelets50/75/100;75–<100 remains clinician discretion if well.');
for(const day of [1,8,15])add('00348-lowcounts-day'+day,'00348',{...tax,day_number:day,anc_x10e9_l:.4,platelets_x10e9_l:40},{actions:day===1?['delay','withhold']:review,components:['carboplatin','paclitaxel'],noNumeric:true,...(day!==1?{noActions:['omit'],text:/table|source|specif/i}:{})},[4],'Only cycles2–4 Day1 has an explicit source count table; do not import Day8/15 thresholds.');
for(const cyc of [1,5,0])add('00348-outside-source-cycle'+cyc,'00348',{...tax,cycle_number:cyc,anc_x10e9_l:.4,platelets_x10e9_l:40},{actions:review,components:['carboplatin','paclitaxel'],text:/table|source|cycle/i,noNumeric:true},[4],'Outside cycles2–4 Day1: explicit source scope review, not reassuring assessed counts.');
add('00734-baseline-ANC1_5','00734',{treatment_phase:'taxane',assessment_stage:'baseline',anc_x10e9_l:1.5},{actions:review,noNumeric:true},[3],'Baseline>1.5 /exclusion<1.5 leaves equality unassigned.');
add('00734-baseline-ANC1_49','00734',{treatment_phase:'taxane',assessment_stage:'baseline',anc_x10e9_l:1.49},{actions:['contraindicated','withhold'],components:['carboplatin','paclitaxel'],noNumeric:true},[3],'Baseline ANC<1.5 exclusion overrides ongoing ANC threshold.');
add('00734-baseline-platelet100','00734',{treatment_phase:'taxane',assessment_stage:'baseline',platelets_x10e9_l:100},{actions:review,noNumeric:true},[3],'Source baseline platelet75 has no comparator; review initiation eligibility.');
assert.equal(cases.length,55,'Original independent probe count changed');
// Additional source exclusion and prolonged/recurrent delay precedence checks.
add('00734-prior-platinum-progression','00734',{...tax,prior_platinum_progression:true},{actions:['contraindicated','withhold'],components:['carboplatin'],noNumeric:true},[3],'Disease progression while receiving platinum is a source exclusion.');
add('00734-prior-platinum-progression-false','00734',{...tax,prior_platinum_progression:false},{actions:nonRestrictive,noRestrictive:true},[3],'A negative history does not independently create an exclusion.');
add('00734-prior-platinum-phase-unknown','00734',{prior_platinum_progression:true},{actions:review,text:/phase/i,noNumeric:true},[3],'Missing phase cannot become normal or a guessed active carboplatin dose.');
add('00734-prior-platinum-during-ac','00734',{...ac,prior_platinum_progression:true},{actions:nonRestrictive,noDoseComponents:['carboplatin']},[1,2,3],'No active platinum during AC.');
for(const spec of [
 {id:'duration14',inputs:{haematological_delay_days:14,anc_x10e9_l:.4},percent:25},
 {id:'duration14_01',inputs:{haematological_delay_days:14.01,anc_x10e9_l:.4},percent:50},
 {id:'duration15-recovered',inputs:{haematological_delay_days:15,anc_x10e9_l:2,platelets_x10e9_l:150},percent:50},
 {id:'second-delay',inputs:{haematological_delay_occurrence:2,anc_x10e9_l:.4,previous_fn:true},percent:25},
 {id:'third-delay',inputs:{haematological_delay_occurrence:3,anc_x10e9_l:.4,platelets_x10e9_l:40,previous_fn:true},percent:50},
 {id:'third-delay-recovered',inputs:{haematological_delay_occurrence:3,anc_x10e9_l:2,platelets_x10e9_l:150,previous_fn:true},percent:50},
 {id:'duration15-and-third',inputs:{haematological_delay_days:15,haematological_delay_occurrence:3,anc_x10e9_l:.4,platelets_x10e9_l:40,previous_fn:true},percent:50}
])add('00734-priority-'+spec.id,'00734',{...tax,...spec.inputs},{actions:['delay_then_dose_reduce','delay','withhold','consultant_review'],components:['carboplatin','paclitaxel'],text:new RegExp(spec.percent+'%'),...(spec.percent===50?{noText:/25%/,text:/50%[\s\S]*(cessation|ceas)|cessation[\s\S]*50%/i}:{}),noNumeric:true},[4],'Recovery>2weeks or third delay uses50%/cessation review;25% severe/prior-delay wording must not override or contradict it. Exactly14days is not>2weeks.');
// Content acceptance for the two repaired longitudinal claims and no immune carryover.
const contentChecks=[];function content(id,test,source){contentChecks.push({id,test,source});}
for(const code of ['00348','00734']){
 content(code+'-nonimmune-protocol',()=>{
  const p=P[code];assert(!/pembrolizumab|immune_(?:pneumonitis|colitis|nephritis|hepatitis)|active_pembrolizumab/i.test(JSON.stringify(p)),'Active immune content in nonimmune protocol');
  assert.equal(p.calculators.carboplatin_calvert.target_auc,code==='00348'?6:2);
  const tx=p.treatment_phases.find(p=>p.phase_id==='taxane'),a=p.treatment_phases.find(p=>p.phase_id==='ac');assert(tx&&a);
  const cb=tx.administration.find(a=>a.drug==='carboplatin');assert.deepEqual(cb.day,code==='00348'?1:[1,8,15]);assert.equal(tx.cycle_length_days,21);assert.equal(a.cycle_length_days,14);
 },{...sources[code],pages:[1,2]});
 content(code+'-weekly-ac-grid',()=>{
  const d=JSON.parse(fs.readFileSync(path.join(root,'data/patient-knowledge',code+'.json')));const row=d.monitoring_schedule.rows.find(r=>r.label==='Blood tests');assert(row);assert(/weekly/i.test(row.cells[2]),'AC grid omits weekly testing');
  assert(!d.agents.some(a=>a.id==='pembrolizumab'),'Patient agent carryover');assert(!d.phase_cycles.some(p=>/pembrolizumab/i.test(JSON.stringify(p))),'Patient phase carryover');
 },{...sources[code],pages:[3,4]});
}
content('00734-echo-indication',()=>{const d=JSON.parse(fs.readFileSync(path.join(root,'data/patient-knowledge/00734.json')));const item=d.chapters.find(c=>c.id==='monitoring').items.find(i=>/ECG.*heart/i.test(i.title));assert(item);assert(/clinically indicated/i.test(item.text));assert(!/age over65|age over 65|age>65|age >65/i.test(item.text),'00734 falsely attributed age65 criterion');},{...sources['00734'],pages:[3]});
function clinicalFindings(r){return (r.findings||[]).filter(f=>!f.domainAssessment&&!/^PARTIAL_/.test(f.ruleId||''));}
function components(f){return f.action?.components||[];}
function check(c){const p=P[c.code],r=E.assess(p,c.inputs),m=D.buildModificationModel(p,r),cf=clinicalFindings(r),x=c.expect;
 const actual={actionType:r.actionType,errors:r.errors||[],invalid:r.invalid||[],findings:cf.map(f=>({id:f.ruleId,action:f.actionType,components:components(f),text:f.explanation})),doseRows:m.rows.map(f=>({component:f.componentId,action:f.actionType,dose:f.protocolDose,quantified:f.quantified,explanation:f.explanation})),domainFindings:(r.findings||[]).filter(f=>!cf.includes(f)).map(f=>({action:f.actionType,text:f.explanation}))};
 const errors=[];function verify(fn){try{fn();}catch(e){errors.push(e.message);}}
 verify(()=>assert.deepEqual(actual.errors,[],'Engine errors'));verify(()=>assert.deepEqual(actual.invalid,[],'Unexpected invalid inputs'));
 verify(()=>assert(x.actions.includes(r.actionType),`Expected one of${JSON.stringify(x.actions)}; got${r.actionType}`));
 const allText=(r.findings||[]).map(f=>f.explanation||f.action?.recommendation||'').join('\n');const restrictiveText=cf.map(f=>f.explanation||'').concat(m.rows.map(f=>f.explanation||'')).join('\n');
 for(const component of x.components||[])verify(()=>assert(cf.some(f=>components(f).includes(component)),`No source action for${component}`));
 for(const component of x.noComponents||[])verify(()=>assert(!cf.some(f=>components(f).includes(component)),`Inactive${component} finding`));
 for(const component of x.noDoseComponents||[])verify(()=>assert(!m.rows.some(f=>f.componentId===component),`Inactive${component} dose action`));
 for(const action of x.noActions||[])verify(()=>assert(!cf.some(f=>f.actionType===action),`Unexpected${action} action`));
 if(x.noRestrictive)verify(()=>assert.equal(cf.length,0,'Unexpected restrictive source action'));
 if(x.text)verify(()=>assert(x.text.test(allText),`Expected source explanation${x.text}`));
 if(x.noText)verify(()=>assert(!x.noText.test(restrictiveText),`Conflicting action explanation${x.noText}`));
 if(x.noNumeric)verify(()=>assert(!m.rows.some(f=>(f.quantified===true&&!['contraindicated','omit','discontinue','permanently_discontinue'].includes(f.actionType))||/^\s*\d+(?:\.\d+)?\s*(?:mg|AUC|%)/i.test(f.protocolDose||'')),'Unresolved/review case produced a calculated restart dose'));
 return {id:c.id,kind:'actual_engine',status:errors.length?'FAIL':'PASS',source:c.source,inputs:c.inputs,expected:Object.fromEntries(Object.entries(x).map(([k,v])=>[k,v instanceof RegExp?String(v):v])),actual,errors};}
const results=cases.map(check);
for(const c of contentChecks){let errors=[];try{c.test();}catch(e){errors=[e.message];}results.push({id:c.id,kind:'content',status:errors.length?'FAIL':'PASS',source:c.source,errors});}
for(const f of [...Object.values(paths),'js/assessment-engine.js','js/protocol-dose-schedule.js','tools/reconcile-tnbc-v08413.py','tools/build-tnbc-v08413-content.py']){const p=path.isAbsolute(f)?f:path.join(root,f);if(fs.existsSync(p))hashes[path.relative(root,p)]=crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');}
const failed=results.filter(r=>r.status==='FAIL');const report={executed_at:new Date().toISOString(),source_audit_date:'2026-10-20',root,scope:'Original55 independent probes plus11 progression/prolonged-delay cases and5 content assertions; not full clinical validation',summary:{engine_cases:cases.length,content_cases:contentChecks.length,total:results.length,passed:results.length-failed.length,failed:failed.length},hashes,results};
const output=opt('--output');if(output)fs.writeFileSync(path.resolve(output),JSON.stringify(report,null,2)+'\n');
for(const r of results)console.log(`${r.status} ${r.id}${r.errors.length?' — '+r.errors.join('; '):''}`);
console.log(JSON.stringify(report.summary));process.exitCode=failed.length?1:0;
