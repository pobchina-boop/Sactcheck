'use strict';
// Independent scenario expectations were transcribed after reviewing current primary sources.
// baseline uses frozen .12 implementations; proposed uses audit-folder candidates; integrated reads actual app.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..'),E=require(path.join(root,'js/assessment-engine')),D=require(path.join(root,'js/protocol-dose-schedule'));
const mode=process.argv[2]||'integrated';assert(['baseline','proposed','integrated'].includes(mode));
const dir=mode==='integrated'?path.join(root,'protocols/breast'):path.join(__dirname,mode);
const codes=['00785','00796','00797'];const ps=Object.fromEntries(codes.map(c=>[c,JSON.parse(fs.readFileSync(path.join(dir,fs.readdirSync(dir).find(f=>f.startsWith(c+'-')))))]));
const src={
 '00785':'https://healthservice.hse.ie/documents/6659/785_v3_Pertuzumab_trastuzumab_Phesgo.pdf',
 '00796':'https://healthservice.hse.ie/documents/6419/796_v4_PertuzumabTrasDoc_Phesgo.pdf',
 '00797':'https://healthservice.hse.ie/documents/6420/797_v4_PertuzumabTrasPhesgo_PACLitaxel.pdf',
 ema:'https://www.ema.europa.eu/en/documents/product-information/phesgo-epar-product-information_en.pdf'};
const cases=[];
function test(code,name,input,source,check){let row={code,name,input,source};try{const p=ps[code],r=E.assess(p,input),m=D.buildModificationModel(p,r),findings=r.findings.filter(f=>!f.domainAssessment&&!/^PARTIAL_/.test(f.ruleId||'')),text=findings.map(f=>(f.explanation||'')+' '+(f.recommendation||'')).join(' ');row.actual={action:r.actionType,findings:findings.map(f=>({ruleId:f.ruleId,action:f.actionType})),errors:r.errors,invalid:r.invalid};assert.deepEqual(r.errors,[]);require("../../../tests/helpers/source-input-validation-v08421.cjs")(r);check({p,r,m,findings,text});row.pass=true;}catch(e){row.pass=false;row.error=e.message;}cases.push(row);}
const action=x=>q=>assert.equal(q.r.actionType,x);
const noNumeric=q=>assert(!q.m.rows.some(x=>/^\d+(?:\.\d+)?\s*mg/.test(x.protocolDose||'')),'Unresolved case offered a numeric dose');
const cardiac=c=>`${src[c]} eligibility page 2; adverse-event table; EMA SmPC 4.2 page 4`;
for(const c of codes){
 for(const stage of ['later',7])test(c,'Invalid assessment stage requires explicit review: '+stage,{assessment_stage:stage,lvef_percent:49},cardiac(c),q=>{action('consultant_review')(q);assert(/valid assessment stage|unrecognised/i.test(q.text));noNumeric(q)});
 test(c,'Invalid stage cannot suppress independent cardiac hold',{assessment_stage:'later',lvef_percent:39},cardiac(c),action('withhold'));
 test(c,'Blank input remains unassessed',{},src[c],q=>{action('incomplete')(q);noNumeric(q)});
 test(c,'Initiation current-only LVEF49 requires review before starting',{assessment_stage:'baseline',lvef_percent:49},cardiac(c),q=>{action('withhold')(q);assert(/50/.test(q.text));noNumeric(q)});
 test(c,'Initiation explicit baseline49 requires hold',{assessment_stage:'baseline',baseline_lvef_percent:49},cardiac(c),action('withhold'));
 test(c,'Historical low baseline must not automatically withhold ongoing current55',{assessment_stage:'ongoing',baseline_lvef_percent:49,lvef_percent:55,lvef_drop_points:0},cardiac(c),q=>assert(!q.findings.some(f=>f.ruleId==='BASELINE_LVEF_LOW')));
 test(c,'Missing stage with current49 needs clarification',{lvef_percent:49},cardiac(c),q=>{action('consultant_review')(q);assert(/pretreatment|initiation/.test(q.text));noNumeric(q)});
 for(const [l,d,hold] of [[39.99,0,true],[40,10,true],[45,10,true],[45,9.99,false],[45.01,15,false]])test(c,`Ongoing cardiac boundary ${l}/${d}`,{assessment_stage:'ongoing',lvef_percent:l,lvef_drop_points:d},cardiac(c),q=>{assert.equal(q.findings.some(f=>f.ruleId==='LVEF_HOLD'),hold);if(hold)action('withhold')(q)});
 test(c,'Ongoing42 without decline remains unresolved',{assessment_stage:'ongoing',lvef_percent:42},cardiac(c),q=>{action('consultant_review')(q);noNumeric(q)});
 test(c,'Ongoing39 holds even without decline',{assessment_stage:'ongoing',lvef_percent:39},cardiac(c),action('withhold'));
 for(const grade of [1,2,3])test(c,`Current reaction grade${grade} receives active management`,{phesgo_hypersensitivity_grade:grade},src.ema+' sections 4.2/4.4 pp6–7',q=>{action('withhold')(q);assert(/reaction|injection/.test(q.text));assert(!q.findings.some(f=>f.actionType==='permanently_discontinue'));noNumeric(q)});
 test(c,'Reaction grade0 does not create a reaction finding',{phesgo_hypersensitivity_grade:0},src.ema+' sections 4.2/4.4 pp6–7',q=>assert(!q.findings.some(f=>/PHESGO_REACTION/.test(f.ruleId))));
 test(c,'Grade4 is permanently discontinued',{phesgo_hypersensitivity_grade:4},src.ema+' section4.2 p6',action('permanently_discontinue'));
 test(c,'Bronchospasm remains permanent even with lower reaction grade',{phesgo_hypersensitivity_grade:2,bronchospasm_or_ards:true},src.ema+' section4.2 p6',action('permanently_discontinue'));
 test(c,'Significant injection reaction without hypersensitivity grade requires management',{significant_injection_reaction:true},src.ema+' section4.4 p7',q=>{action('withhold')(q);noNumeric(q)});
 test(c,'Progression cannot silently continue maintenance',{disease_progression:true},src[c]+' page1 duration',q=>{action('consultant_review')(q);assert(/progression/i.test(q.text));noNumeric(q)});
 test(c,'Allergy message does not mention absent carboplatin',{hypersensitivity:true},src[c]+' exclusion list',q=>{action('contraindicated')(q);assert(!/carboplatin/i.test(q.text))});
 test(c,'Persistent diarrhoea includes interruption and recovery requirement',{severe_persistent_diarrhoea:true},src.ema+' section4.4 p8',q=>{action('consultant_review')(q);assert(/interrupt/i.test(q.text));assert(/control|resolv/i.test(q.text));noNumeric(q)});
 test(c,'Overdue cardiac result requires review',{cardiac_monitoring_overdue:true},src[c]+' TESTS section',q=>{action('consultant_review')(q);noNumeric(q)});
 for(const [days,reload] of [[41.99,false],[42,true]])test(c,`Exact six-week dose interval boundary ${days}`,{days_since_last_antibody:days},src[c]+' delayed/switch tables',q=>{action('consultant_review')(q);assert(q.text.includes(reload?'1200 mg/600 mg':'600 mg/600 mg'));noNumeric(q)});
}
test('00785','Chemotherapy still planned does not qualify as antibody-only maintenance',{chemotherapy_component_completed:false},src['00785']+' page1 indication',q=>{action('consultant_review')(q);assert(/chemotherapy/i.test(q.text));noNumeric(q)});
for(const c of ['00796','00797']){
 test(c,'Ongoing combination with ANC1.49 distinguishes initiation',{assessment_stage:'ongoing',anc_x10e9_l:1.49},src[c]+' baseline exclusions and on-treatment rules',q=>assert(!q.findings.some(f=>f.ruleId==='BASELINE_ANC')));
 test(c,'Initiation ANC1.49 remains excluded',{assessment_stage:'baseline',anc_x10e9_l:1.49},src[c]+' baseline exclusions',action('contraindicated'));
 test(c,'Continuation ignores prior chemotherapy-specific toxicity',{treatment_phase:'continuation',assessment_stage:'ongoing',alt_uln_multiple:12,neuropathy_grade:3},src[c]+' treatment continuation',q=>{assert(!q.m.rows.some(r=>/docetaxel|paclitaxel/.test(r.componentId||'')));assert(!['withhold','contraindicated','discontinue'].includes(q.r.actionType))});
 test(c,'Continuation retains the antibody cardiac hold',{treatment_phase:'continuation',lvef_percent:39},src[c]+' cardiac rules',action('withhold'));
 test(c,'Continuation administration note no longer implies chemotherapy pending',{treatment_phase:'continuation'},src[c]+' antibody-only continuation',q=>assert(!/before chemotherapy/.test(JSON.stringify(q.p.treatment_phases.find(p=>p.phase_id==='continuation')))));
}
test('00796','LVEF hold preserves within-three-week repeat requirement',{lvef_percent:39},src['00796']+' p5 table5, plus SmPC4.2',q=>{action('withhold')(q);assert(/within 3 weeks/i.test(q.text));noNumeric(q)});
test('00796','Severe docetaxel ALT threshold remains independently restricted',{alt_uln_multiple:10.01},src['00796']+' p4 table4',action('contraindicated'));
test('00796','Intermediate liver row remains pharmacy review',{alt_uln_multiple:2,ast_uln_multiple:1,alp_uln_multiple:3,bilirubin_uln_multiple:1},src['00796']+' p4 table4',q=>{action('consultant_review')(q);assert(/AMBIGUITY/.test(q.text));noNumeric(q)});
test('00797','Grade2 neuropathy has own decrement without TRAIN2 instructions',{neuropathy_grade:2},src['00797']+' p4 table6',q=>{action('consultant_review')(q);assert(/10 mg/.test(q.text));assert(!/TRAIN/.test(q.text));noNumeric(q)});
test('00797','Grade3 neuropathy stops paclitaxel',{neuropathy_grade:3},src['00797']+' pp4–5 table6',action('discontinue'));
test('00797','Moderate ANC branch mentions possible later reduction',{assessment_stage:'ongoing',anc_x10e9_l:0.75},src['00797']+' p4 table4',q=>{action('delay')(q);assert(/consider reduction/i.test(q.text))});
test('00797','Moderate platelet branch mentions possible later reduction',{platelets_x10e9_l:75},src['00797']+' p4 table4',q=>{action('delay')(q);assert(/consider reduction/i.test(q.text))});
test('00797','Exactly90 platelet source overlap stays unresolved',{platelets_x10e9_l:90},src['00797']+' p4 table4',action('consultant_review'));
test('00797','FN includes G-CSF consideration',{febrile_neutropenia:true},src['00797']+' p4 table4',q=>{action('withhold')(q);assert(/G-CSF/i.test(q.text))});
test('00797','Missing ALT never selects numeric hepatic restart',{bilirubin_uln_multiple:1.5},src['00797']+' p4 table5',q=>{action('consultant_review')(q);noNumeric(q)});
test('00797','ANC0.4 unknown duration still delayed without numeric restart',{anc_x10e9_l:0.4},src['00797']+' p4 table4',q=>{action('delay')(q);noNumeric(q)});
test('00797','ANC0.4 seven days requires one-level reduction after recovery',{anc_x10e9_l:0.4,anc_below_0_5_days:7},src['00797']+' p4 table4',action('delay_then_dose_reduce'));
const report={checked:'2026-10-21',mode,scope:'Targeted independently sourced regression cases; not clinical sign-off',cases:cases.length,passed:cases.filter(x=>x.pass).length,failed:cases.filter(x=>!x.pass).length,results:cases};
fs.writeFileSync(path.join(__dirname,mode+'-results.json'),JSON.stringify(report,null,2)+'\n');
console.log(mode+': '+report.passed+'/'+report.cases+' passed');for(const c of cases.filter(x=>!x.pass))console.log('FAIL',c.code,c.name, c.error.split('\n')[0]);process.exitCode=report.failed?1:0;
