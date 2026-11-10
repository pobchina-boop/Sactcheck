'use strict';
// Expectations below come from NCCP Tables and eligibility text, not rule enumeration.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../../..');
const E = require(path.join(root, 'js/assessment-engine'));
const D = require(path.join(root, 'js/protocol-dose-schedule'));
const V = require(path.join(root, 'js/protocol-validator'));
const sources = JSON.parse(fs.readFileSync(path.join(__dirname, 'sources/index.json')));
const protocols = Object.fromEntries(sources.map(s => [s.code, JSON.parse(fs.readFileSync(path.join(root, s.path)))]));
const results = [];
function check(code, name, input, yes = [], no = [], action = null, citation = 'NCCP source in sources/index.json') {
  const row = {code, name, input, expected: {yes, no, action}, citation};
  try {
    const result = E.assess(protocols[code], input);
    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.invalid, []);
    const ids = result.findings.map(f => f.ruleId);
    for (const id of yes) assert(ids.includes(id), 'Missing ' + id);
    for (const id of no) assert(!ids.includes(id), 'Unexpected ' + id);
    if (action) {
      assert.equal(result.actionType, action);
      if (['withhold', 'permanently_discontinue', 'contraindicated', 'delay'].includes(action)) {
        const model = D.buildModificationModel(protocols[code], result);
        assert(model.rows.some(r => r.actionType === action), 'Component output lost action');
      }
    }
    row.actual = {action: result.actionType, ids}; row.pass = true;
  } catch (error) { row.pass = false; row.error = error.message; }
  results.push(row);
}
for (const code of ['00483', '00484']) {
  const cite = 'NCCP ' + code + ' v13a pp7–8 Table3, CTCAE4';
  const table = [
    ['pneumonitis_grade', [2], [3,4]], ['diarrhoea_colitis_grade',[2,3],[4]],
    ['immune_hepatitis_grade',[2],[3,4]], ['immune_nephritis_grade',[2,3],[4]],
    ['rash_grade',[3],[4]], ['myocarditis_grade',[2],[3,4]],
    ['adrenal_insufficiency_grade',[2],[3,4]], ['diabetes_grade',[3],[4]]];
  for (const [field, hold, stop] of table) for (const grade of [0,1,2,3,4]) {
    const prefix = field.toUpperCase();
    const want = hold.includes(grade) ? prefix + '_HOLD' : stop.includes(grade) ? prefix + '_STOP' : null;
    check(code, field + ' grade ' + grade, {[field]: grade}, want ? [want] : [],
      [prefix + '_HOLD', prefix + '_STOP'].filter(id => id !== want), stop.includes(grade) ? 'permanently_discontinue' : hold.includes(grade) ? 'withhold' : null, cite);
  }
  for (const field of ['hypothyroidism_grade','hyperthyroidism_grade','hypophysitis_grade']) for (const grade of [0,1,2,3,4]) for (const symptoms of [false,true]) {
    const prefix = field.toUpperCase(); const hold = [2,3].includes(grade) && symptoms;
    check(code, field + ' grade/symptoms ' + grade + '/' + symptoms, {[field]:grade,endocrine_symptoms:symptoms},
      grade === 4 ? [prefix + '_STOP'] : hold ? [prefix + '_HOLD'] : [],
      grade === 4 ? [prefix + '_HOLD'] : hold ? [prefix + '_STOP'] : [prefix + '_HOLD',prefix + '_STOP'],
      grade === 4 ? 'permanently_discontinue' : hold ? 'withhold' : null, cite);
  }
  const ready = {restart_assessment_requested:true,restart_source_recovery_complete:true,
    nivo_prior_permanent_stop:false,nivo_consultant_restart_approved:true,
    systemic_steroids_mg_pred:0,other_immunosuppressive_treatment:false};
  const gates = ['HN46_NIVO_RESTART_HISTORY_UNASSESSED','HN46_NIVO_PRIOR_PERMANENT_STOP','HN46_NIVO_RESTART_APPROVAL','HN46_NIVO_RESTART_MEDICINES_UNASSESSED'];
  check(code,'All restart confirmations explicit',ready,[],gates,null,'NCCP pp6–8; implementation of permanent stop memory and consultant review');
  for (const field of ['nivo_prior_permanent_stop','nivo_consultant_restart_approved','systemic_steroids_mg_pred','other_immunosuppressive_treatment']) {
    const input = {...ready}; delete input[field];
    check(code,'Restart missing '+field,input,[field==='nivo_prior_permanent_stop'?gates[0]:field==='nivo_consultant_restart_approved'?gates[2]:gates[3]],[],'withhold','NCCP pp6–8');
  }
  check(code,'Prior permanent stop survives current recovery',{...ready,nivo_prior_permanent_stop:true,pneumonitis_grade:0},[gates[1]],[],'permanently_discontinue',cite);
  check(code,'Prior permanent stop applies outside restart form',{nivo_prior_permanent_stop:true},[gates[1]],[],'permanently_discontinue',cite);
  for (const dose of [9.99,10,10.01]) check(code,'Restart steroid boundary '+dose,{...ready,systemic_steroids_mg_pred:dose},dose>10?['RESTART_IMMUNOSUPPRESSION']:[],dose<=10?['RESTART_IMMUNOSUPPRESSION']:[],dose>10?'withhold':null,'NCCP p6');
  check(code,'Other systemic immunosuppression',{...ready,other_immunosuppressive_treatment:true},['RESTART_OTHER_IMMUNOSUPPRESSION'],[],'withhold','NCCP p6');
  const hn = {indication_id:code+(code==='00483'?'-source-d':'-source-e'),hnscc_source_criteria_met:true,adult_patient:true,
    hnscc_histology_sites_confirmed:true,hnscc_no_curative_local_option:true,hnscc_progressed_after_platinum:true,
    hnscc_months_platinum_to_progression:5.99};
  for (const field of ['adult_patient','hnscc_histology_sites_confirmed','hnscc_no_curative_local_option','hnscc_progressed_after_platinum']) for (const value of [undefined,false,true]) {
    const input={...hn}; if(value===undefined)delete input[field];else input[field]=value;
    check(code,'HN '+field+' '+value,input,value===true?[]:['HN46_'+field.toUpperCase()],value===true?['HN46_'+field.toUpperCase()]:[],null,'NCCP p4 HNSCC eligibility');
  }
  for (const months of [undefined,0,5.99,6,6.01]) {
    const input={...hn}; if(months===undefined)delete input.hnscc_months_platinum_to_progression;else input.hnscc_months_platinum_to_progression=months;
    const want=months===undefined?'HN46_HNSCC_INTERVAL_MISSING':months===6?'HN46_HNSCC_INTERVAL_BOUNDARY':months>6?'HN46_HNSCC_INTERVAL_LATE':null;
    check(code,'HN progression interval '+months,input,want?[want]:[],['HN46_HNSCC_INTERVAL_MISSING','HN46_HNSCC_INTERVAL_BOUNDARY','HN46_HNSCC_INTERVAL_LATE'].filter(id=>id!==want),null,'NCCP p4 within six months; exact rounded boundary requires source interpretation');
  }
  check(code,'Lung ignores HN-specific interval',{...hn,indication_id:code+(code==='00483'?'-source-e':'-source-f'),nsclc_source_criteria_met:true,hnscc_months_platinum_to_progression:8},[],['HN46_HNSCC_INTERVAL_LATE'],null,'NCCP pp4,6 indication separation');
  const reviewCycle=code==='00483'?8:4;
  check(code,'HN does not inherit NSCLC response cycle',{...hn,cycle_number:reviewCycle},[],['NSCLC_RESPONSE_REVIEW'],null,'NCCP p6 NSCLC only');
  check(code,'NSCLC response review',{indication_id:code+(code==='00483'?'-source-e':'-source-f'),cycle_number:reviewCycle},['NSCLC_RESPONSE_REVIEW'],[],null,'NCCP p6');
  const switchDays=code==='00483'?28:14;
  for (const days of [switchDays-1,switchDays,switchDays+1])check(code,'Schedule switch '+days,{switching_schedule:true,days_since_last_nivolumab:days},days<switchDays?['SWITCH_TOO_EARLY']:[],days>=switchDays?['SWITCH_TOO_EARLY']:[],null,'NCCP pp2–3 schedule switch');
}
for (const code of ['00455','00558']) {
  const citation = 'NCCP ' + code + ' Table1 pp5–6';
  for (const grade of [0,1,2,3,4]) {
    check(code,'Pneumonitis '+grade,{pneumonitis_grade:grade},grade===2?['PNEUMONITIS_G2']:grade>=3?['PNEUMONITIS_SEVERE_OR_RECURRENT']:[],grade<2?['PNEUMONITIS_G2','PNEUMONITIS_SEVERE_OR_RECURRENT']:[],grade===2?'withhold':grade>=3?'permanently_discontinue':null,citation);
    check(code,'Colitis '+grade,{diarrhoea_colitis_grade:grade},[2,3].includes(grade)?['COLITIS_G2_G3']:grade===4?['COLITIS_G4_OR_RECURRENT_G3']:[],grade<2?['COLITIS_G2_G3','COLITIS_G4_OR_RECURRENT_G3']:[],[2,3].includes(grade)?'withhold':grade===4?'permanently_discontinue':null,citation);
  }
  for (const [field,low,high,attribution,hold,stop] of [
    ['alt_ast_uln_multiple',3,5,'pembro_immune_hepatitis_assessed','HEPATITIS_WITHHOLD','HEPATITIS_PERMANENT'],
    ['bilirubin_uln_multiple',1.5,3,'pembro_immune_hepatitis_assessed','HEPATITIS_WITHHOLD','HEPATITIS_PERMANENT'],
    ['creatinine_ratio_baseline_or_uln',1.5,3,'pembro_immune_nephritis_assessed','NEPHRITIS_G2','NEPHRITIS_G3_PLUS']]) {
    for (const value of [low-0.01,low,low+0.01,high-0.01,high,high+0.01]) for(const assessed of [false,true]) {
      const want=assessed?(value>high?stop:value>low?hold:null):null;
      check(code,field+' '+value+' attribution '+assessed,{[field]:value,[attribution]:assessed},want?[want]:[],[hold,stop].filter(id=>id!==want),want?(want===stop?'permanently_discontinue':'withhold'):null,citation+'; no automatic immune attribution from isolated lab');
    }
  }
  for (const percent of [49.99,50,50.01]) for (const days of [6.99,7,7.01])check(code,'Liver baseline special '+percent+'/'+days,{pembro_immune_hepatitis_assessed:true,liver_metastases_baseline_grade2:true,ast_alt_increase_percent:percent,ast_alt_elevation_days:days},percent>=50&&days>=7?['LIVER_METS_BASELINE_G2_STOP']:[],percent<50||days<7?['LIVER_METS_BASELINE_G2_STOP']:[],percent>=50&&days>=7?'permanently_discontinue':null,citation);
  const hnIds=code==='00558'?['00558-head-neck','00558h']:['00455-head-neck'];
  for (const id of hnIds)for(const cps of [undefined,0.99,1,1.01]) {
    const input={indication_id:id,pd_l1_validated:true};if(cps!==undefined)input.pd_l1_cps=cps;
    check(code,'HN CPS '+id+' '+cps,input,cps===undefined?['HN45_HN_CPS_MISSING']:cps<1?['HN45_HN_CPS_LOW']:[],cps>=1?['HN45_HN_CPS_MISSING','HN45_HN_CPS_LOW']:[],null,'NCCP indication and eligibility HNSCC CPS>=1');
  }
  check(code,'Recovered symptoms retain prior stop',{pembro_restart_requested:true,pembro_source_recovery_complete:true,pembro_steroid_management_complete:true,pembro_consultant_restart_approved:true,pembro_prior_permanent_stop:true},['HN45_PEMBRO_PRIOR_PERMANENT_STOP'],[],'permanently_discontinue',citation);
  for (const field of ['recurrent_grade2_pneumonitis','recurrent_grade3_colitis','ici_failed_recovery_12_weeks','ici_steroid_gt10_at_12_weeks'])check(code,'History '+field,{[field]:true},[],[],'permanently_discontinue',citation);
}
{
 const code='00261',cite='NCCP00261 v7 p4 Tables1–2; visually verified underlined >= symbols';
 for(const anc of [0.99,1,1.01])for(const platelets of [99.99,100,100.01])check(code,'Count pair '+anc+'/'+platelets,{anc,platelets},[...(anc<1?['CARBO00261_ANC_LOW']:[]),...(platelets<100?['CARBO00261_PLATELETS_LOW']:[])],[...(anc>=1?['CARBO00261_ANC_LOW']:[]),...(platelets>=100?['CARBO00261_PLATELETS_LOW']:[])],anc<1||platelets<100?'delay':null,cite);
 for(const gfr of [19.99,20,20.01,29.99,30,30.01,59.99,60,60.01,125,125.01]) {
  const want=gfr<=20?'CARBO00261_GFR_STOP':gfr<=30?'CARBO00261_GFR_EXTREME_CAUTION':gfr<60?'CARBO00261_GFR_MYELORISK':gfr>125?'CARBO00261_GFR_CAP':null;
  check(code,'GFR '+gfr,{gfr},want?[want]:[],['CARBO00261_GFR_STOP','CARBO00261_GFR_EXTREME_CAUTION','CARBO00261_GFR_MYELORISK','CARBO00261_GFR_CAP'].filter(id=>id!==want),gfr<=20?'contraindicated':null,cite);
 }
 const hn={indication_id:'00261-head-neck',disease_context:'head_neck',head_neck_cisplatin_unsuitable:true,target_auc:5,cycle_number:3,head_neck_radiotherapy_confirmed:true};
 for (const value of [undefined, false, true]) {
   const input = {...hn};
   if (value === undefined) delete input.head_neck_cisplatin_unsuitable;
   else input.head_neck_cisplatin_unsuitable = value;
   check(code, 'HN cisplatin suitability ' + value, input,
     value === true ? [] : ['HN46_CARBO_HN_CISPLATIN_SUITABILITY'],
     value === true ? ['HN46_CARBO_HN_CISPLATIN_SUITABILITY'] : [], null,
     'NCCP p1 cisplatin is not appropriate');
 }
 for(const field of ['target_auc','cycle_number','head_neck_radiotherapy_confirmed']){const input={...hn};delete input[field];check(code,'HN missing '+field,input,['HN46_CARBO_HN_'+field.toUpperCase()+'_MISSING'],[],null,'NCCP pp1–2 HN schedule');}
 for(const auc of [4.99,5,5.01])check(code,'HN AUC '+auc,{...hn,target_auc:auc},auc!==5?['CARBO00261_HN_AUC']:[],auc===5?['CARBO00261_HN_AUC']:[],null,'NCCP p2 AUC5');
 for(const n of [2,3,4])check(code,'HN cycle '+n,{...hn,cycle_number:n},n>3?['CARBO00261_HN_COURSE']:[],n<=3?['CARBO00261_HN_COURSE']:[],null,'NCCP p1 three cycles');
 check(code,'HN indication cannot bypass via breast context',{...hn,disease_context:'breast_metastatic',target_auc:6},['HN46_CARBO_HN_CONTEXT_CONFLICT','CARBO00261_HN_AUC'],[],null,'NCCP pp1–2 context separation');
 check(code,'Breast cycle4 AUC6 not HN',{indication_id:'00261j',disease_context:'breast_metastatic',cycle_number:4,target_auc:6},[],['CARBO00261_HN_COURSE','CARBO00261_HN_AUC','HN46_CARBO_HN_CISPLATIN_SUITABILITY'],null,'NCCP pp1–2');
 for(const age of [47.99,48,48.01])check(code,'Creatinine freshness '+age,{renal_measure_type:'cockcroft_gault',creatinine_result_age_hours:age},age>48?['CARBO00261_ESTIMATE_OLD']:[],age<=48?['CARBO00261_ESTIMATE_OLD']:[],null,cite);
 for(const ratio of [1.099,1.1,1.101])check(code,'Isotope renal trend '+ratio,{renal_measure_type:'measured',baseline_creatinine:100,current_creatinine:ratio*100},ratio>1.1?['CARBO00261_ISOTOPE_TREND']:[],ratio<=1.1?['CARBO00261_ISOTOPE_TREND']:[],null,cite);
}
// Structural checks keep source metadata and monitoring distinct from clinical cases.
for (const [code, protocol] of Object.entries(protocols)) {
  const row = {code, name: 'Strict protocol schema and retained governance'};
  try {
    const validation = V.validate(protocol, {strict: true});
    assert.equal(validation.valid, true, JSON.stringify(validation.errors));
    assert.equal(protocol.metadata.validation.clinical_use_authorised, false);
    assert.equal(protocol.metadata.validation.consultant_reviewed, false);
    assert.equal(protocol.metadata.validation.oncology_pharmacy_reviewed, false);
    row.pass = true;
  } catch (error) {
    row.pass = false;
    row.error = error.message;
  }
  results.push(row);
}
const monitoring = {name: 'Nivolumab source-specific thyroid monitoring remains distinct'};
try {
  assert.match(JSON.stringify(protocols['00484'].monitoring.each_cycle), /thyroid function tests before each cycle/);
  assert.match(JSON.stringify(protocols['00483'].monitoring), /once a month|monthly/);
  assert.doesNotMatch(JSON.stringify(protocols['00484'].monitoring), /once a month|monthly/);
  monitoring.pass = true;
} catch (error) {
  monitoring.pass = false;
  monitoring.error = error.message;
}
results.push(monitoring);
const report={release:'0.84.46',checked:'2026-11-09',total:results.length,passed:results.filter(r=>r.pass).length,failed:results.filter(r=>!r.pass),cases:results};
fs.writeFileSync(path.join(__dirname,'source-case-results.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({total:report.total,passed:report.passed,failed:report.failed},null,2));
if(report.failed.length)process.exitCode=1;
