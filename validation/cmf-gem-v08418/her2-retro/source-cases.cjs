'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..'),E=require(path.join(root,'js/assessment-engine')),D=require(path.join(root,'js/protocol-dose-schedule'));
const mode=process.argv[2]||'integrated';assert(['baseline','proposed','integrated'].includes(mode));
const dir=mode==='integrated'?path.join(root,'protocols/breast'):path.join(__dirname,mode),codes=['00316','00433','00745','00512','00815'];
const ps=Object.fromEntries(codes.map(c=>[c,JSON.parse(fs.readFileSync(path.join(dir,fs.readdirSync(dir).find(f=>f.startsWith(c+'-')))))])),cases=[];
function test(code,name,input,page,check){const x={code,name,input,source:{url:ps[code].metadata.source_url,page}};try{const p=ps[code],r=E.assess(p,input),m=D.buildModificationModel(p,r),f=r.findings.filter(x=>!x.domainAssessment&&!/^PARTIAL_/.test(x.ruleId||'')),text=f.map(x=>(x.explanation||'')+' '+(x.recommendation||'')).join(' ');x.actual={action:r.actionType,findings:f.map(x=>({id:x.ruleId,action:x.actionType})),errors:r.errors,invalid:r.invalid};assert.deepEqual(r.errors,[]);assert.deepEqual(r.invalid,[]);check({p,r,m,f,text});x.pass=true;}catch(e){x.pass=false;x.error=e.message;}cases.push(x);}
const action=a=>q=>assert.equal(q.r.actionType,a),has=id=>q=>assert(q.f.some(x=>x.ruleId===id),'Expected '+id),lacks=id=>q=>assert(!q.f.some(x=>x.ruleId===id),'Unexpected '+id),noNumeric=q=>assert(!q.m.rows.some(x=>/^\d+(?:\.\d+)?\s*mg/.test(x.protocolDose||'')),'Unresolved case offered a numeric dose');
for(const c of codes){
 const phase=c==='00815'||c==='00512'?'combination':'paclitaxel',continuation=c==='00815'?'trastuzumab_maintenance':'continuation';
 test(c,'Blank remains incomplete',{},1,action('incomplete'));
 test(c,'Initiation ANC1.49 below source exclusion',{treatment_phase:phase,assessment_stage:'baseline',anc_x10e9_l:1.49},c==='00815'?3:2,action('contraindicated'));
 test(c,'Ongoing ANC1.49 not baseline exclusion',{treatment_phase:phase,assessment_stage:'ongoing',anc_x10e9_l:1.49},c==='00815'?5:3,lacks('BASELINE_ANC'));
 test(c,'ANC1.49 missing stage requires initiation context',{treatment_phase:phase,anc_x10e9_l:1.49},c==='00815'?3:2,q=>{has('BASELINE_STAGE_CONTEXT')(q);noNumeric(q);});
 test(c,'Initiation ANC1.5 boundary not exclusion',{treatment_phase:phase,assessment_stage:'baseline',anc_x10e9_l:1.5},c==='00815'?3:2,lacks('BASELINE_ANC'));
 test(c,'Continuation excludes paclitaxel low counts and neuropathy',{treatment_phase:continuation,assessment_stage:'ongoing',anc_x10e9_l:.4,platelets_x10e9_l:50,neuropathy_grade:3},c==='00815'?6:4,q=>assert(!q.f.some(x=>/^(PAC_|TAX_|AC_|BASELINE_ANC)/.test(x.ruleId))));
 test(c,'Ongoing combined cardiac decline is held',c==='00815'?{treatment_phase:continuation,current_lvef_percent:49,lvef_drop_points_from_baseline:10}:{treatment_phase:continuation,lvef_percent:49,lvef_drop_points:10},c==='00815'?6:5,action('withhold'));
}
for(const c of ['00316','00433','00745','00512'])test(c,'Source cardiac distinction fall10 with current55',{treatment_phase:'continuation',lvef_percent:55,lvef_drop_points:10},c==='00512'?4:5,q=>assert.equal(q.f.some(x=>x.ruleId==='HER2_LVEF_HOLD'),c==='00316'));
for(const c of ['00316','00745'])test(c,'Paclitaxel platelet100 printed gap requires review',{treatment_phase:'paclitaxel',platelets_x10e9_l:100},3,q=>{action('consultant_review')(q);noNumeric(q);});
for(const c of ['00433','00512','00815'])test(c,'Weekly paclitaxel platelet90 overlap preserved',{treatment_phase:c==='00433'?'paclitaxel':'combination',platelets_x10e9_l:90},c==='00815'?5:3,q=>{action('consultant_review')(q);noNumeric(q);});
for(const c of ['00512','00815'])for(const [bili,pct]of[[1.5,75],[3,50]])test(c,'Hepatic'+bili+' uses original dose and avoids re-escalation',{treatment_phase:'combination',alt_uln_multiple:2,bilirubin_uln_multiple:bili,current_paclitaxel_mg_m2:50},c==='00815'?5:3,q=>{action('consultant_review')(q);assert(q.text.includes(pct+'%'));assert(/ORIGINAL/.test(q.text));noNumeric(q);});
const c='00815';
for(const [ecog,review]of[[2,false],[3,true]])test(c,'ECOG source eligibility '+ecog,{ecog},3,q=>assert.equal(q.f.some(x=>x.ruleId==='ECOG_REVIEW'),review));
for(const [name,input,a]of[
 ['HER2 status absent',{her2_positive:false},'consultant_review'],['Indication unmet',{indication_eligible:false},'consultant_review'],
 ['Severe hepatic impairment',{treatment_phase:'combination',severe_hepatic_impairment:true},'contraindicated'],
 ['Clinically significant cardiac disease',{significant_cardiac_disease:true},'withhold'],['Cardiac check overdue',{cardiac_monitoring_overdue:true},'consultant_review'],
 ['Active administration reaction',{current_infusion_reaction:true},'withhold'],['Febrile neutropenia during chemotherapy',{treatment_phase:'combination',febrile_neutropenia:true},'withhold'],
 ['Febrile neutropenia during continuation',{treatment_phase:'trastuzumab_maintenance',febrile_neutropenia:true},'consultant_review'],
 ['Bilirubin-only missing phase',{bilirubin_uln_multiple:1.5},'consultant_review'],['Severe bilirubin missing phase',{bilirubin_uln_multiple:5.01},'contraindicated'],
 ['Severe ALT missing phase',{alt_uln_multiple:10},'contraindicated'],['Missing current LVEF after10pointfall',{lvef_drop_points_from_baseline:10},'consultant_review'],
 ['Low current LVEF smallerfall',{current_lvef_percent:49,lvef_drop_points_from_baseline:9},'consultant_review']])test(c,name,input,['HER2 status absent','Indication unmet','Severe hepatic impairment','Clinically significant cardiac disease'].includes(name)?3:6,q=>{action(a)(q);noNumeric(q);});
for(const [v,hold]of[[54.99,true],[55,false]])test(c,'Baseline LVEF55 boundary '+v,{assessment_stage:'baseline',baseline_lvef_percent:v},3,q=>assert.equal(q.f.some(x=>x.ruleId==='BASELINE_LVEF_50_54'),hold));
for(const [v,drop,hold]of[[49,10,true],[50,10,false],[49,9.99,false],[55,10,false]])test(c,'Combined cardiac criterion '+v+'/'+drop,{current_lvef_percent:v,lvef_drop_points_from_baseline:drop},6,q=>assert.equal(q.f.some(x=>x.ruleId==='LVEF_WITHHOLD'),hold));
for(const [days,reload]of[[7,false],[7.01,true]])test(c,'IV late dose boundary '+days,{trastuzumab_route:'iv',days_overdue_trastuzumab:days},4,q=>{action('consultant_review')(q);assert.equal(q.f.some(x=>x.ruleId==='H_LATE_IV_RELOAD'),reload);assert(/21\s*days/.test(q.text));noNumeric(q);});
test(c,'SC late dose uses fixed dose no IV loading',{trastuzumab_route:'sc',sc_trastuzumab_locally_approved:true,days_overdue_trastuzumab:9},4,q=>{action('consultant_review')(q);assert(/600\s*mg/.test(q.text));assert(/21\s*days/.test(q.text));assert(!q.f.some(x=>/H_LATE_IV/.test(x.ruleId)));noNumeric(q);});
for(const [days,hold]of[[20.99,true],[21,false]])test(c,'SC minimum interval '+days,{trastuzumab_route:'sc',sc_trastuzumab_locally_approved:true,days_since_last_sc_trastuzumab:days},4,q=>assert.equal(q.f.some(x=>x.ruleId==='SC_INTERVAL_SHORT'),hold));
test(c,'Late dose missing formulation cannot infer IV',{days_overdue_trastuzumab:8},4,q=>{action('consultant_review')(q);assert(/IV versus SC/.test(q.text));noNumeric(q);});
test(c,'SC local approval required',{trastuzumab_route:'sc'},1,q=>{has('SC_LOCAL_APPROVAL')(q);noNumeric(q);});
test(c,'Explicit fixed-dose SC phases exist',{},3,q=>{for(const id of ['combination_sc','trastuzumab_maintenance_sc']){const p=q.p.treatment_phases.find(x=>x.phase_id===id);assert(p,'Missing SC alternative');assert.equal(p.cycle_length_days,21);const h=p.administration.find(x=>x.drug==='trastuzumab');assert.deepEqual(h.dose,{value:600,unit:'mg'});assert(/No loading/.test(h.notes));}assert.equal(q.p.metadata.dose_schedule_variant_input,'trastuzumab_route');});
test('00512','Weekly combination cannot silently become q21',{treatment_phase:'combination',trastuzumab_schedule:'q21',days_overdue_trastuzumab:8},1,q=>{has('HER2_SCHEDULE_MISMATCH')(q);lacks('H_LATE_q21True')(q);noNumeric(q);});
test('00512','Continuation retains q21 reload',{treatment_phase:'continuation',trastuzumab_schedule:'q21',days_overdue_trastuzumab:8},3,q=>{has('H_LATE_q21True')(q);lacks('HER2_SCHEDULE_MISMATCH')(q);noNumeric(q);});
test('00512','FN alone considers GCSF and does not mandate level reduction',{treatment_phase:'combination',febrile_neutropenia:true},3,q=>{action('withhold')(q);assert(/Consider G-CSF/i.test(q.text));noNumeric(q);});
test('00433','Prior FN during AC retains75percent',{treatment_phase:'ac',prior_febrile_neutropenia:true},3,q=>{has('PREVIOUS_FN')(q);assert(/75%/.test(q.text));});
test('00433','Prior FN during weekly taxane no borrowed AC75percent',{treatment_phase:'paclitaxel',prior_febrile_neutropenia:true},4,q=>{has('PREVIOUS_FN_TAXANE')(q);lacks('PREVIOUS_FN')(q);noNumeric(q);});
test('00433','Prior FN missing phase requires phase context',{prior_febrile_neutropenia:true},3,q=>{has('PREVIOUS_FN_PHASE_UNKNOWN')(q);noNumeric(q);});
for(const c of codes){
 const current=c==='00815'?'current_lvef_percent':'lvef_percent',drop=c==='00815'?'lvef_drop_points_from_baseline':'lvef_drop_points',cont=c==='00815'?'trastuzumab_maintenance':'continuation';
 test(c,'Historical baseline49 with ongoing current60 is not a present exclusion',{treatment_phase:cont,assessment_stage:'ongoing',baseline_lvef_percent:49,[current]:60,[drop]:0},c==='00815'?3:2,q=>{assert(!['contraindicated','withhold','discontinue'].includes(q.r.actionType));assert(!q.f.some(x=>/^(HER2_BASELINE|BASELINE_LVEF_LT50|BASELINE_LVEF_50_54)/.test(x.ruleId)));});
 test(c,'Baseline49 with missing assessment stage requires review',{baseline_lvef_percent:49},c==='00815'?3:2,q=>{action('consultant_review')(q);has('BASELINE_LVEF_STAGE_CONTEXT')(q);noNumeric(q);});
 test(c,'Historical baseline49 missing ongoing current result requires review',{assessment_stage:'ongoing',baseline_lvef_percent:49},c==='00815'?4:2,q=>{action('consultant_review')(q);has('HISTORICAL_LVEF_CURRENT_MISSING')(q);noNumeric(q);});
 test(c,'Explicit initiation baseline49 remains restricted',{assessment_stage:'baseline',baseline_lvef_percent:49},c==='00815'?3:2,q=>assert(['withhold','contraindicated'].includes(q.r.actionType)));
 test(c,'Current-only LVEF49 at initiation is restricted',{assessment_stage:'baseline',[current]:49},c==='00815'?3:2,q=>{action('withhold')(q);has('BASELINE_CURRENT_LVEF_LOW')(q);});
 test(c,'Ongoing current49 fall10 still holds despite normal historical value',{treatment_phase:cont,assessment_stage:'ongoing',baseline_lvef_percent:60,[current]:49,[drop]:10},c==='00815'?6:5,action('withhold'));
}
for(const c of ['00433','00512'])test(c,'Source >55 initiation boundary retains review at55',{assessment_stage:'baseline',baseline_lvef_percent:55},2,has('HER2_BASELINE_BORDERLINE'));
test('00745','Exact initiation LVEF50 source gap reviewed',{assessment_stage:'baseline',baseline_lvef_percent:50},2,q=>{has('BASELINE_LVEF_50_REVIEW')(q);noNumeric(q);});
const report={checked:'2026-10-25',mode,scope:'Independent source scenarios; software checks, not clinical sign-off',cases:cases.length,passed:cases.filter(x=>x.pass).length,failed:cases.filter(x=>!x.pass).length,results:cases};fs.writeFileSync(path.join(__dirname,mode+'-results.json'),JSON.stringify(report,null,2)+'\n');console.log(mode+': '+report.passed+'/'+report.cases+' passed');for(const x of cases.filter(x=>!x.pass))console.log('FAIL',x.code,x.name,x.error.split('\n')[0]);process.exitCode=report.failed?1:0;
