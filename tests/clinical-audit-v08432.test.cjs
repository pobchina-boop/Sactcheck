'use strict';
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),E=require('../js/assessment-engine'),Rule=require('../js/rule-engine');
const root=path.resolve(__dirname,'..'),index=require('../protocols/index.json').protocols;
const p=c=>JSON.parse(fs.readFileSync(path.join(root,index.find(x=>x.path.includes('/'+c+'-')).path)));
let count=0;const results=[];
function check(c,input,type,match){const r=E.assess(p(c),input);assert.equal(r.actionType,type,`${c} ${JSON.stringify(input)}: ${r.recommendation}`);if(match)assert.match(JSON.stringify(r.findings||r),match);results.push({code:c,input,action:r.actionType});count++;return r;}
for(const c of ['00660','00421','00427','00428','00486','00209','00321','00227','00586','00623']){
 const empty=E.assess(p(c),{});assert.equal(empty.complete,false);assert(!['proceed','proceed_with_caution'].includes(empty.actionType));count++;
 check(c,{dpd_status:'complete'},'contraindicated');check(c,{dpd_status:'partial'},'consultant_review');
}
for(const c of ['00421','00427','00428']){
 for(const x of [49.9,50,74.9,75,99,99.9])check(c,{platelets_x10e9_l:x},'withhold');
 for(const x of [100,100.1]){const r=E.assess(p(c),{platelets_x10e9_l:x});assert(!r.findings.some(f=>/PLATELETS_BELOW|SEVERE_COUNTS/.test(f.ruleId)));count++;}
 for(const x of [.49,.5,.99])check(c,{anc_x10e9_l:x},'withhold');
}
for(const c of ['00660','00421','00427','00428','00486']){
 const bili=c==='00660'?'bilirubin_umol_l':'fluorouracil_bilirubin_umol_l',ast=c==='00660'?'ast_u_l':'fluorouracil_ast_u_l';
 check(c,{[bili]:85},'consultant_review',/Exact|exact/);check(c,{[bili]:85.1},'contraindicated');check(c,{[ast]:180},'consultant_review');check(c,{[ast]:180.1},'contraindicated');
 check(c,{recent_or_concomitant_brivudine:true},'contraindicated');
}
for(const c of ['00427','00428','00486'])for(const [field,label] of [['diarrhoea','DIARRHOEA'],['mucositis','MUCOSITIS'],['hand_foot','HFS']]){
 for(const current of [2,3])check(c,{[field+'_grade']:current,[field+'_worst_grade']:3,[field+'_occurrence']:1},'withhold');
 for(const [grade,occ,pct] of [[2,1,100],[2,2,75],[2,3,50],[2,4,0],[3,1,50],[3,2,0],...(field==='hand_foot'?[]:[[4,1,50],[4,2,0]])]){
  const r=check(c,{[field+'_grade']:1,[field+'_worst_grade']:grade,[field+'_occurrence']:occ},pct===0?'omit':pct===100?'consultant_review':'dose_reduce');
  const f=r.findings.find(x=>x.ruleId===`${label}_G${grade}_O${occ}`);assert(f,'Recurrence rule must fire');
  const components=f.action.components;assert.deepEqual(components,c==='00486'&&field!=='hand_foot'?['fluorouracil','oxaliplatin']:['fluorouracil']);
 }
}
for(const c of ['00427','00428'])check(c,{fluorouracil_hepatic_impairment:'severe'},'contraindicated',/conflict/);
check('00486',{platelets_x10e9_l:74.9},'withhold');for(const x of [75,99.9])check('00486',{platelets_x10e9_l:x},'consultant_review',/footnote/);
for(const band of ['eq30','lt30','dialysis'])check('00486',{oxaliplatin_renal_band:band},'consultant_review');
for(const grade of [3,4]){const r=check('00486',{neuropathy_grade:grade},'discontinue');assert.deepEqual(r.findings.find(x=>x.ruleId==='NEUROPATHY_G3_4').action.components,['oxaliplatin']);}
check('00660',{platelets_x10e9_l:74,toxicity_delay_weeks:2},'withhold');check('00660',{platelets_x10e9_l:74,toxicity_delay_weeks:4},'discontinue');
for(const x of [49,9])check('00660',{lowest_platelets_during_delay_x10e9_l:x},'consultant_review',/maintain/);
check('00660',{stomatitis_current_grade:1,stomatitis_highest_grade:4},'dose_reduce',/2 dose level/);
check('00660',{stomatitis_current_grade:1,stomatitis_highest_grade:3},'dose_reduce',/1 dose level/);
for(const tox of ['diarrhoea','stomatitis']){check('00660',{[tox+'_current_grade']:2},'withhold');check('00660',{[tox+'_current_grade']:2,toxicity_delay_weeks:2},'discontinue');}
for(const c of ['00209','00321'])for(const [field,value]of [['anc_x10e9_l',.9],['platelets_x10e9_l',60],['diarrhoea_current_grade',2],['stomatitis_current_grade',2]])check(c,{[field]:value},'withhold');
check('00321',{hand_foot_current_grade:2},'withhold');check('00321',{crcl_ml_min:50.5},'consultant_review');check('00321',{crcl_ml_min:50},'dose_reduce');
check('00227',{diarrhoea_current_grade:1},'consultant_review',/Narrative/);
// Retained distinct capecitabine-source conflicts and source-specified RT schedule.
assert.match(p('00586').metadata.schedule_summary,/Days 1[–-]5/);assert.equal(p('00586').treatment_phases[0].cycle_length_days,7);
check('00586',{capecitabine_renal_band:50.5},'consultant_review');
fs.writeFileSync(path.join(root,'validation/colorectal-v08432/source-case-results.json'),JSON.stringify({release:'0.84.32',passed:count,failed:0,cases:results},null,2)+'\n');console.log(`v0.84.32: ${count} source-based boundary, recurrence, component and partial-input checks passed.`);
