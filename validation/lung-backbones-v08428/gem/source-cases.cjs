'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),B=__dirname,R=path.resolve(B,'../../..'),integrated=process.argv.includes('--integrated'),E=require(R+'/js/assessment-engine');let results=[];
function check(name,fn){try{fn();results.push({name,pass:true})}catch(e){results.push({name,pass:false,error:e.message})}}
for(const code of ['00281','00310']){
 const dir=integrated?R+'/protocols/lung':B+'/proposed',name=fs.readdirSync(dir).find(f=>f.startsWith(code+'-')),p=JSON.parse(fs.readFileSync(dir+'/'+name));
 function t(n,input,yes=[],no=[]){check(code+' '+n,()=>{let r=E.assess(p,input);assert.deepEqual(r.errors,[]);assert.deepEqual(r.invalid,[]);let ids=r.findings.map(f=>f.ruleId);for(let id of yes)assert(ids.includes(id),'missing '+id+' got '+ids);for(let id of no)assert(!ids.includes(id),'unexpected '+id);});}
 check(code+' empty incomplete',()=>{let r=E.assess(p,{});assert.equal(r.complete,false);assert(!['proceed','proceed_with_caution'].includes(r.actionType));});
 for(const v of [.49,.5,1,1.01,1.5,1.51]){
 t('Day1ANC'+v,{treatment_day:'day1',anc:v},v<=1?['DAY1_COUNTS_LOW']:[],v>1?['DAY1_COUNTS_LOW']:[]);
 t('Day8ANC'+v,{treatment_day:'day8',anc:v},v<.5?['DAY8_OMIT']:v<=1?['DAY8_75_PERCENT']:[],v>1?['DAY8_OMIT','DAY8_75_PERCENT']:v<.5?['DAY8_75_PERCENT']:['DAY8_OMIT']);
 t('baselineANC'+v,{assessment_stage:'baseline',anc:v},v<=1.5?['BASELINE_MARROW']:[],v>1.5?['BASELINE_MARROW']:[]);
 }
 for(const v of [49.99,50,100,100.01]){
 t('Day1platelet'+v,{treatment_day:'day1',platelets:v},v<=100?['DAY1_COUNTS_LOW']:[],v>100?['DAY1_COUNTS_LOW']:[]);
 t('Day8platelet'+v,{treatment_day:'day8',platelets:v},v<50?['DAY8_OMIT']:v<=100?['DAY8_75_PERCENT']:[],v>100?['DAY8_OMIT','DAY8_75_PERCENT']:v<50?['DAY8_75_PERCENT']:['DAY8_OMIT']);
 }
 t('missingday',{anc:.7},['TREATMENT_DAY_REQUIRED'],['DAY1_COUNTS_LOW','DAY8_75_PERCENT']);
 for(const v of [26.99,27,27.01])t('bilirubin'+v,{bilirubin_micromol_l:v},v>=27?['GEMCITABINE_BILIRUBIN_27_PLUS']:[],v<27?['GEMCITABINE_BILIRUBIN_27_PLUS']:[]);
 for(const g of [0,1,2,3,4]){t('pneumonitis'+g,{pneumonitis_grade:g},g>=2?['PNEUMONITIS_G2PLUS']:[],g<2?['PNEUMONITIS_G2PLUS']:[]);t('nonhaem'+g,{nonhaem_toxicity_grade:g},g>=3?['NONHAEM_G3PLUS']:[],g<3?['NONHAEM_G3PLUS']:[]);}
 t('suspectedpneumonitis',{gemcitabine_pneumonitis_suspected:true},['GEM_PNEUMONITIS_SUSPECTED']);
 for(const v of [.5,.51])t('restartANC'+v,{day8_restart_after_omission:true,anc:v},v<=.5?['DAY8_RESTART_NOT_RECOVERED']:[],v>.5?['DAY8_RESTART_NOT_RECOVERED']:[]);
 for(const v of [50,50.01])t('restartplatelets'+v,{day8_restart_after_omission:true,platelets:v},v<=50?['DAY8_RESTART_NOT_RECOVERED']:[],v>50?['DAY8_RESTART_NOT_RECOVERED']:[]);
 t('neo3',{indication_id:'neoadjuvant_nsclc_nivolumab',cycle_number:3},['NIVOLUMAB_SEPARATE_PLAN'],['NEOADJUVANT_CYCLE_LIMIT']);t('neo4',{indication_id:'neoadjuvant_nsclc_nivolumab',cycle_number:4},['NEOADJUVANT_CYCLE_LIMIT']);t('advanced7',{indication_id:'advanced_nsclc',cycle_number:7},['STANDALONE_COURSE_REVIEW'],['NEOADJUVANT_CYCLE_LIMIT']);
 for(const event of ['anc_lt_0_5_gt5d','anc_lt_0_1_gt3d','febrile_neutropenia','platelets_lt25','cycle_delay_gt1week'])check(code+' prior event component '+event,()=>{let r=E.assess(p,{haematologic_event:event});assert.deepEqual(r.findings.find(x=>x.ruleId==='PRIOR_HAEM_EVENT_REDUCE').action.components,['gemcitabine']);});
 if(code==='00281'){
  for(const v of[29.99,30,30.01,44.99,45,59,59.5,60,60.01]){t('cisrenal'+v,{crcl_ml_min:v},v<45?['CISPLATIN_CRCL_LT45']:v<=59?['CISPLATIN_CRCL_45_TO_59']:v<=60?['CISPLATIN_RENAL_BOUNDARY_GAP']:[],v>60?['CISPLATIN_CRCL_LT45','CISPLATIN_CRCL_45_TO_59','CISPLATIN_RENAL_BOUNDARY_GAP']:[]);t('baseline renal'+v,{assessment_stage:'baseline',crcl_ml_min:v},v<60?['BASELINE_CISPLATIN_RENAL_EXCLUSION']:[],v>=60?['BASELINE_CISPLATIN_RENAL_EXCLUSION']:[]);}
  t('gemexact30',{crcl_ml_min:30},['GEMCITABINE_RENAL_BOUNDARY_GAP'],['GEMCITABINE_CRCL_LT30']);
  t('neuropathy missing stage',{neuropathy_grade:2},['NEUROPATHY_STAGE_REQUIRED']);t('neuropathy baseline',{neuropathy_grade:2,assessment_stage:'baseline'},['BASELINE_CISPLATIN_NEUROPATHY_EXCLUSION'],['NEUROPATHY_G2PLUS']);t('neuropathy treatment',{neuropathy_grade:2,assessment_stage:'on_treatment'},['NEUROPATHY_G2PLUS']);
 }else{
  for(const v of[19.99,20,20.01,30,30.01,59.99,60,125,125.01])t('carborenal'+v,{gfr_ml_min:v},v<=20?['CARBOPLATIN_GFR_20_OR_LESS']:v<=30?['CARBOPLATIN_GFR_20_TO_30']:v>125?['CARBOPLATIN_GFR_CAP']:[],v>30&&v<=125?['CARBOPLATIN_GFR_20_OR_LESS','CARBOPLATIN_GFR_20_TO_30','CARBOPLATIN_GFR_CAP']:[]);
  for(const v of[110,110.01])t('isotope'+v,{isotope_creatinine_percent_baseline:v},v>110?['ISOTOPE_GFR_REASSESS']:[],v<=110?['ISOTOPE_GFR_REASSESS']:[]);
  t('stale',{creatinine_within48h:false},['CALCULATED_GFR_STALE']);t('dialysis',{haemodialysis:true},['HAEMODIALYSIS_TIMING']);
 }
 const a=JSON.parse(fs.readFileSync(B+'/authoring.json')).regimens[code];check(code+' content isolation',()=>{assert.equal(a.patient.agents.length,2);assert(!a.patient.agents.some(a=>a.id==='nivolumab'));assert.deepEqual(a.patient.evidence.metrics,[]);assert.equal(a.support_plans.length,2);assert(a.journey.lanes.every(l=>l.cells.length===a.journey.stages.length));assert.equal(a.patient.patient_summary.preparation.length,3);for(let day=1;day<=21;day++)assert.equal(a.patient.day_groups.filter(g=>g.start<=day&&g.end>=day).length,1);assert.equal(a.patient.phases[0].agents.length,2);});
 check(code+' governance',()=>{assert.equal(p.metadata.validation.clinical_use_authorised,false);assert.equal(p.clinical_governance.clinical_use_authorised,false);assert.deepEqual(p.required_inputs,[]);assert(Object.values(p.input_definitions).every(x=>x.required===false));});
}
const report={mode:integrated?'integrated':'proposed',total:results.length,passed:results.filter(x=>x.pass).length,failed:results.filter(x=>!x.pass).length,results};fs.writeFileSync(B+'/'+report.mode+'-results.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,results:results.filter(x=>!x.pass)},null,2));if(report.failed)process.exitCode=1;
