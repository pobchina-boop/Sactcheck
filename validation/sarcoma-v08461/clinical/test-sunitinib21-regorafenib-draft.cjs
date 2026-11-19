'use strict';
// Current-source boundaries, evaluated by the unchanged application engine.
// These tests load EXTERNAL draft JSON and never write application files.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const base=__dirname,repo=path.join(base,'../Sactcheck'),E=require(path.join(repo,'js/assessment-engine')),D=require(path.join(repo,'js/protocol-dose-schedule')),V=require(path.join(repo,'js/protocol-validator'));
const paths={'00719':'protocols/shared/00719-sunitinib-50-mg-therapy-21-day.json','00244':'protocols/gastrointestinal/00244-regorafenib.json'};
const ps=Object.fromEntries(Object.entries(paths).map(([c,p])=>[c,JSON.parse(fs.readFileSync(path.join(base,'application-draft',p)))]));
let failed=0;const cases=[];
function test(code,name,input,yes=[],no=[],check=()=>{}){let error,r;try{r=E.assess(ps[code],input);assert.deepEqual(r.errors,[]);assert.deepEqual(r.invalid,[]);const ids=r.findings.filter(x=>!x.domainAssessment).map(x=>x.ruleId);for(const id of yes)assert(ids.includes(id),id+' absent');for(const id of no)assert(!ids.includes(id),id+' unexpectedly present');check(r,D.buildModificationModel(ps[code],r));}catch(e){failed++;error=e.message;}cases.push({code,name,input,expected:yes,absent:no,passed:!error,...(error?{error}:{}),actual:r?.findings.filter(x=>!x.domainAssessment).map(x=>x.ruleId)});}
function structure(code,name,fn){try{fn();cases.push({code,name,passed:true});}catch(e){failed++;cases.push({code,name,passed:false,error:e.message});}}
const component=(id,drug)=>(r)=>{let f=r.findings.find(x=>x.ruleId===id);assert.deepEqual(f.action.components,[drug]);};
const SUN=(n,i,y=[],a=[],f)=>test('00719',n,i,y,a,f),REG=(n,i,y=[],a=[],f)=>test('00244',n,i,y,a,f);
for(const code of Object.keys(ps)){
  structure(code,'Strict draft protocol schema',()=>assert.equal(V.validate(ps[code],{strict:true}).valid,true));
  for(const input of [{},{[code==='00719'?'assessment_phase':'assessment_type']:'on_treatment'},{[code==='00719'?'assessment_phase':'assessment_type']:'on_treatment',ecog:0}])test(code,'Partial input remains incomplete '+JSON.stringify(input),input,[],[],r=>{assert.equal(r.complete,false);assert.equal(r.coverageComplete,false);assert.equal(r.partialAssessment,true);assert.notEqual(r.actionType,'proceed');});
  structure(code,'Every rule explicitly identifies the active drug',()=>{for(const r of ps[code].rule_engine.rules)assert.deepEqual(r.action.components,[code==='00719'?'sunitinib':'regorafenib']);});
}
SUN('Indication missing is not invented',{},['INDICATION_REQUIRED']);
SUN('GIST requires imatinib resistance/intolerance',{indication_code:'00719a',gist_prior_imatinib_criteria_met:false},['GIST_IMATINIB_CONTEXT']);
SUN('RCC context does not inherit GIST prerequisite',{indication_code:'00719b'},[],['GIST_IMATINIB_CONTEXT']);
SUN('ECOG2 source bound',{ecog:2},[],['ECOG_OUTSIDE_SOURCE']);SUN('ECOG3 outside source',{ecog:3},['ECOG_OUTSIDE_SOURCE']);
for(const [field,cut,id]of [['anc',1,'ANC_DELAY'],['platelets',75,'PLATELETS_DELAY']])for(const n of [cut-.001,cut,cut+.001])SUN(field+' boundary '+n,{[field]:n},n<cut?[id]:[],n<cut?[]:[id],n<cut?component(id,'sunitinib'):undefined);
SUN('Normal ANC missing platelets remains partial',{assessment_phase:'on_treatment',anc:2},[],[],r=>assert(r.unassessed.some(x=>x.id==='platelets')));
SUN('Counts do not imply organ/cardiac clearance',{assessment_phase:'on_treatment',anc:2,platelets:150},[],[],r=>{assert.equal(r.coverageComplete,false);assert(r.unassessed.some(x=>x.id==='child_pugh_class'));});
for(const n of [54.999,55,55.001])SUN('Baseline LVEF '+n,{assessment_phase:'baseline',lvef_percent:n},n<55?['BASELINE_CARDIAC_EXCLUSION']:[],n<55?[]:['BASELINE_CARDIAC_EXCLUSION']);
SUN('Significant baseline cardiac disease independent of LVEF',{assessment_phase:'baseline',lvef_percent:60,significant_cardiovascular_disease:true},['BASELINE_CARDIAC_EXCLUSION']);
SUN('On-treatment55 bound is not baseline exclusion',{assessment_phase:'on_treatment',lvef_percent:54},[],['BASELINE_CARDIAC_EXCLUSION']);
SUN('ClinicalCHF discontinues',{clinical_congestive_heart_failure:true},['CHF_DISCONTINUE'],[],r=>assert.equal(r.findings.find(x=>x.ruleId==='CHF_DISCONTINUE').actionType,'discontinue'));
for(const n of [49.999,50])for(const drop of [false,true])SUN('Combined asymptomatic LVEF '+n+' / confirmedDrop '+drop,{clinical_congestive_heart_failure:false,lvef_percent:n,asymptomatic_lvef_decline_gt20_source_confirmed:drop},n<50&&drop?['ASYMPTOMATIC_LVEF']:[],n<50&&drop?[]:['ASYMPTOMATIC_LVEF']);
SUN('Low LVEF missing decline interpretation remains review',{assessment_phase:'on_treatment',lvef_percent:49,clinical_congestive_heart_failure:false},['LOW_LVEF_CONTEXT'],['ASYMPTOMATIC_LVEF']);
SUN('ChildC not recommended on21day',{child_pugh_class:'C'},['CHILD_PUGH_C']);SUN('ChildB has no imported ChildC restriction',{child_pugh_class:'B'},[],['CHILD_PUGH_C']);
SUN('Dialysis requires plan but no fabricated reduction',{haemodialysis:true},['DIALYSIS_REVIEW'],[],r=>assert(!r.findings.some(x=>x.actionType==='dose_reduce')));
for(const n of [2,3,4])SUN('Current toxicity grade'+n,{current_toxicity_grade:n},n>=3?['TOXICITY_G3_4_HOLD']:[],n>=3?[]:['TOXICITY_G3_4_HOLD']);
SUN('Previousgrade3 current2 not recovered',{prior_worst_toxicity_grade:3,current_toxicity_grade:2},['PRIOR_TOXICITY_NOT_RECOVERED'],['PRIOR_TOXICITY_RECOVERED']);
SUN('Previousgrade3 current1 needs reduction review',{prior_worst_toxicity_grade:3,current_toxicity_grade:1,current_sunitinib_daily_mg:50},['PRIOR_TOXICITY_RECOVERED']);
SUN('Restart missing recovery cannot proceed',{restart_after_toxicity:true,prior_worst_toxicity_grade:3,current_sunitinib_daily_mg:50,consultant_restart_confirmed:true},['RESTART_CONTEXT_REQUIRED']);
SUN('Restart at25 cannot reduce below floor',{prior_worst_toxicity_grade:3,current_toxicity_grade:1,current_sunitinib_daily_mg:25},['DOSE_FLOOR']);
SUN('Restart from37.5 can consider one level',{prior_worst_toxicity_grade:3,current_toxicity_grade:1,current_sunitinib_daily_mg:37.5},['PRIOR_TOXICITY_RECOVERED'],['DOSE_FLOOR']);
SUN('Below25 out of source range',{current_sunitinib_daily_mg:24.99},['DOSE_BELOW_MINIMUM']);
SUN('CYPinducer exception is review not automatic dose',{cyp3a4_interaction:'inducer',current_sunitinib_daily_mg:75},['CYP_INTERACTION','DOSE_ABOVE_ROUTINE'],[],(r,m)=>assert(m.rows.every(x=>!x.quantified)));
SUN('CYPinhibitor reviewed',{cyp3a4_interaction:'inhibitor'},['CYP_INTERACTION']);
SUN('UncontrolledBP holds',{uncontrolled_hypertension:true},['BP_UNCONTROLLED']);
SUN('SuspectedSCAR stops for assessment',{suspected_sjs_ten_or_em:true},['SCAR_SUSPECTED']);
SUN('ConfirmedSJS remains no-rechallenge aftergrade0',{confirmed_sjs_or_ten:true,current_toxicity_grade:0,consultant_restart_confirmed:true},['SJS_TEN_NO_RECHALLENGE'],[],r=>assert.equal(r.actionType,'permanently_discontinue'));
SUN('Any prior irreversible stop survives recovery',{prior_permanent_discontinuation:true,current_toxicity_grade:0},['PRIOR_PERMANENT_STOP']);
SUN('Hepatic failure source stop',{hepatic_failure_signs:true},['HEPATIC_FAILURE_STOP']);
structure('00719','Unsupported generic transaminase3/5 stop ladder removed',()=>{assert(!ps['00719'].rule_engine.rules.some(x=>['TKI_LIVER_3','TKI_LIVER_5','TKI_BILI'].includes(x.rule_id||x.id)));});
structure('00719','Exact21day schedule and official RCC code',()=>{const p=ps['00719'];assert.deepEqual(p.treatment_phases[0].administration[0].days,Array.from({length:14},(_,i)=>i+1));assert.equal(p.treatment_phases[0].cycle_length_days,21);assert.equal(p.indications.find(x=>x.indication_id==='00719-gu').code,'00719b');assert.equal(D.buildModel(p).phases[0].complete,true);});
for(const [field,id]of [['qt_risk_or_prolongation','QT_REVIEW'],['clinically_significant_bleeding','BLEEDING_REVIEW'],['major_surgery_or_unhealed_wound','WOUND_REVIEW'],['thyroid_dysfunction_unmanaged','THYROID_REVIEW'],['oral_plan_uncertain','ORAL_PLAN_REVIEW']])SUN(field,{[field]:true},[id]);
// Regorafenib's existing boundaries stay intact while worst-event history is
// added. Source permanent stops must not disappear when current values recover.
REG('Currentgrade3thirdHFSR still stops',{hfsr_grade:3,hfsr_occurrence:3},['HFSR_G3_THIRD']);
REG('Recoveredthirdgrade3HFSR remains stopped',{hfsr_grade:0,hfsr_worst_grade_this_episode:3,hfsr_occurrence:3,restart_requested:true,consultant_restart_approved:true},['HFSR_HISTORICAL_PERMANENT_STOP']);
REG('Recoveredfourthgrade2HFSR remains stopped',{hfsr_grade:1,hfsr_worst_grade_this_episode:2,hfsr_occurrence:4},['HFSR_HISTORICAL_PERMANENT_STOP']);
REG('Secondgrade3HFSR does not invent permanent stop',{hfsr_grade:0,hfsr_worst_grade_this_episode:3,hfsr_occurrence:2},[],['HFSR_HISTORICAL_PERMANENT_STOP']);
for(const peak of [20,20.001])REG('Previous liver peak'+peak+' after normalisation',{alt_ast_ratio_uln:1,liver_prior_peak_transaminase_uln:peak},peak>20?['LIVER_HISTORICAL_PERMANENT_STOP']:[],peak>20?[]:['LIVER_HISTORICAL_PERMANENT_STOP']);
REG('Previous recurrentgrade3 liver event remains stopped',{alt_ast_ratio_uln:1,liver_prior_recurrent_grade3:true},['LIVER_HISTORICAL_PERMANENT_STOP']);
REG('Previous combinedhepaticcriterion remains stopped',{alt_ast_ratio_uln:1,bilirubin_ratio_uln:1,liver_prior_combined_stop_without_gilbert:true},['LIVER_HISTORICAL_PERMANENT_STOP']);
REG('No recoveryby4weeks remains stopped afterlaterrecovery',{other_toxicity_failed_recovery_by4weeks:true,other_toxicity_grade:1,treatment_delay_days:35},['TABLE5_HISTORICAL_PERMANENT_STOP']);
REG('No permanentstop inferred merely fromlatevisit',{other_toxicity_failed_recovery_by4weeks:false,other_toxicity_grade:1,treatment_delay_days:35},[],['TABLE5_HISTORICAL_PERMANENT_STOP']);
REG('Restart withoutreason needs history',{restart_requested:true,consultant_restart_approved:true},['RESTART_REASON_REQUIRED']);
for(const [reason,id]of [['hfsr','HFSR'],['liver','LIVER'],['hypertension','HYPERTENSION'],['other_table5','OTHER_TABLE5']])REG('Restart '+reason+' missing history holds',{restart_requested:true,restart_reason:reason,consultant_restart_approved:true},['RESTART_'+id+'_HISTORY_REQUIRED']);
REG('Currentgrade2cannotrestart despite recoverycheckbox',{restart_requested:true,restart_reason:'hfsr',hfsr_grade:2,hfsr_recovered_grade01:true,consultant_restart_approved:true},['HFSR_RESTART_CURRENT_GRADE']);
REG('Liverrestartdoesnotinherit unrelatedHFSRfalse',{restart_requested:true,restart_reason:'liver',hfsr_recovered_grade01:false,consultant_restart_approved:true},[],['HFSR_RESTART_NOT_RECOVERED']);
REG('Legacyrestartwithoutreason retains oldHFSRguard',{restart_requested:true,hfsr_recovered_grade01:false,consultant_restart_approved:true},['HFSR_RESTART_NOT_RECOVERED']);
for(const n of [100,100.001])REG('Hypertensionrestart DBP'+n,{restart_requested:true,restart_reason:'hypertension',diastolic_bp_mmhg:n,hypertension_symptoms_resolved:true},n>100?['HYPERTENSION_RESTART_CURRENT_BP']:[],n>100?[]:['HYPERTENSION_RESTART_CURRENT_BP']);
for(const n of [5,5.001,20,20.001])REG('Current transaminase boundary'+n,{alt_ast_ratio_uln:n,liver_event_recurrence:false},n>20?['LIVER_G4']:n>5?['LIVER_G3_HOLD']:['LIVER_LOW_GRADE']);
REG('Gilbert exception doesnotcancel>20stop',{alt_ast_ratio_uln:21,bilirubin_ratio_uln:3,gilberts_syndrome_confirmed:true},['LIVER_G4']);
REG('Combined liver threshold stop withoutGilbert',{alt_ast_ratio_uln:3.001,bilirubin_ratio_uln:2.001,gilberts_syndrome_confirmed:false},['LIVER_HY']);
REG('Minimum seven-dayHFSRbreak retained',{restart_requested:true,restart_reason:'hfsr',consultant_restart_approved:true,hfsr_minimum_interruption_required:true,treatment_delay_days:6.999},['HFSR_MINIMUM_BREAK']);
REG('Exactseven-daybreak doesnotremainminimumhold',{restart_requested:true,restart_reason:'hfsr',consultant_restart_approved:true,hfsr_minimum_interruption_required:true,treatment_delay_days:7},[],['HFSR_MINIMUM_BREAK']);
REG('Hypertensiondelay28not>4weeks',{interruption_due_to_hypertension:true,treatment_delay_days:28},[],['HTN_PROLONGED_DELAY']);REG('Hypertensiondelay28.001>4weeks',{interruption_due_to_hypertension:true,treatment_delay_days:28.001},['HTN_PROLONGED_DELAY']);
REG('Priorpermanentstop overrides genericrestartapproval',{restart_requested:true,consultant_restart_approved:true,regorafenib_permanent_stop_history:true},['PRIOR_PERMANENT_STOP'],[],r=>assert.equal(r.actionType,'permanently_discontinue'));
structure('00244','CRC indication and complete28day source schedule preserved',()=>{const original=JSON.parse(fs.readFileSync(path.join(repo,paths['00244']))),p=ps['00244'];assert.deepEqual(p.indications,original.indications);assert.deepEqual(p.treatment_phases,original.treatment_phases);assert.deepEqual(p.dose_levels,original.dose_levels);assert.equal(p.indications[0].indication_id,'00244a');});
// Regression cases derived from independent frozen-draft failures. Stage and
// reason selectors are workflow context, never permission to erase known harm.
for(const phase of [undefined,'on_treatment','restart'])for(const restart of [undefined,false,true]){
  const input={indication_code:'00719b',prior_worst_toxicity_grade:3,current_sunitinib_daily_mg:37.5,consultant_restart_confirmed:true,...(phase===undefined?{}:{assessment_phase:phase}),...(restart===undefined?{}:{restart_after_toxicity:restart})};
  SUN('Known severe history with missing recovery '+phase+'/'+restart,input,['PRIOR_TOXICITY_RECOVERY_UNKNOWN'],[],(r,m)=>{assert.equal(r.actionType,'withhold');assert(m.rows.some(row=>row.allActions.some(a=>a.ruleId==='PRIOR_TOXICITY_RECOVERY_UNKNOWN')));assert.equal(m.hasQuantified,false);});
}
SUN('Restart phase activates complete-history guard despite false checkbox',{assessment_phase:'restart',restart_after_toxicity:false,current_sunitinib_daily_mg:37.5,consultant_restart_confirmed:true},['RESTART_CONTEXT_REQUIRED']);
SUN('Prior grade2 does not acquire grade3 recovery rule',{assessment_phase:'on_treatment',prior_worst_toxicity_grade:2},[],['PRIOR_TOXICITY_RECOVERY_UNKNOWN']);
for(const dose of [50,50.001,87.5,87.501,1000])SUN('Source upper dose boundary '+dose,{current_sunitinib_daily_mg:dose,cyp3a4_interaction:'inducer'},dose>87.5?['DOSE_ABOVE_ROUTINE','DOSE_ABOVE_SOURCE_EXCEPTION']:dose>50?['DOSE_ABOVE_ROUTINE']:[],dose<=87.5?['DOSE_ABOVE_SOURCE_EXCEPTION']:[],(r,m)=>{assert.equal(m.hasQuantified,false);if(dose>87.5)assert.equal(r.actionType,'withhold');});
const replay=JSON.parse(fs.readFileSync(path.join(base,'../sarcoma-batch2-independent-draft-review-20261118/initial-probes.json')));
for(const probe of replay)test(probe.code,'Independent original probe: '+probe.name,probe.input,probe.code==='00719'?['PRIOR_TOXICITY_RECOVERY_UNKNOWN']:probe.input.restart_reason==='liver'?['HFSR_MINIMUM_BREAK','KNOWN_HFSR_MINIMUM_BREAK']:['LIVER_RESTART_RECOVERY','KNOWN_LIVER_RECOVERY_REQUIRED'],[],(r,m)=>{assert.equal(r.actionType,'withhold');assert(m.rows.some(x=>x.actionType==='withhold'));});
for(const indication of ['00244a','00244b'])for(const reason of ['liver','hypertension','other'])for(const days of [undefined,2,6.999,7]){
  REG('Concurrent HFSR minimum persists '+indication+'/'+reason+'/'+days,{indication_id:indication,restart_requested:true,restart_reason:reason,consultant_restart_approved:true,hfsr_grade:1,hfsr_worst_grade_this_episode:3,hfsr_occurrence:1,hfsr_recovered_grade01:true,hfsr_minimum_interruption_required:true,...(days===undefined?{}:{treatment_delay_days:days})},days===undefined||days<7?['KNOWN_HFSR_MINIMUM_BREAK','HFSR_MINIMUM_BREAK']:[],days>=7?['KNOWN_HFSR_MINIMUM_BREAK','HFSR_MINIMUM_BREAK']:[],r=>{if(days===undefined||days<7)assert.equal(r.actionType,'withhold');});
}
for(const indication of ['00244a','00244b'])for(const reason of ['hfsr','hypertension','other'])for(const recovered of [undefined,false])REG('Concurrent liver history persists '+indication+'/'+reason+'/'+recovered,{indication_id:indication,restart_requested:true,restart_reason:reason,consultant_restart_approved:true,liver_prior_peak_transaminase_uln:8,alt_ast_ratio_uln:4,bilirubin_ratio_uln:1,...(recovered===undefined?{}:{liver_recovered_lt3_or_baseline:recovered})},['KNOWN_LIVER_RECOVERY_REQUIRED'],[],r=>assert.equal(r.actionType,'withhold'));
REG('Known HFSR interruption cannot be erased by false restart flag',{restart_requested:false,restart_reason:'liver',hfsr_worst_grade_this_episode:3,hfsr_grade:1,hfsr_recovered_grade01:true,treatment_delay_days:2},['KNOWN_HFSR_MINIMUM_BREAK']);
REG('Known prior liver event needs recovery even with false restart flag',{restart_requested:false,restart_reason:'hfsr',liver_prior_peak_transaminase_uln:8},['KNOWN_LIVER_RECOVERY_REQUIRED']);
REG('First grade2 HFSR without interruption requirement does not invent minimum break',{restart_requested:true,restart_reason:'liver',hfsr_grade:1,hfsr_worst_grade_this_episode:2,hfsr_occurrence:1,hfsr_minimum_interruption_required:false,hfsr_recovered_grade01:false,treatment_delay_days:2},[],['KNOWN_HFSR_MINIMUM_BREAK','KNOWN_HFSR_RECOVERY_REQUIRED','HFSR_RESTART_NOT_RECOVERED']);
REG('Verified liver recovery is not automatically another hold',{restart_requested:true,restart_reason:'hfsr',liver_prior_peak_transaminase_uln:8,alt_ast_ratio_uln:2,liver_recovered_lt3_or_baseline:true,liver_benefit_risk_approved:true},[],['KNOWN_LIVER_RECOVERY_REQUIRED','LIVER_RESTART_RECOVERY','LIVER_RESTART_RISK']);
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
structure('shared','Application protocol bytes unchanged by external draft work',()=>{const manifest=JSON.parse(fs.readFileSync(path.join(base,'sunitinib21-regorafenib-draft-manifest.json')));for(const p of manifest.protocols)assert.equal(sha(path.join(repo,p.base_path)),p.base_sha256);});
const result={status:failed?'failed':'passed',source_checked_date:'2026-11-18',mode:'external_draft_tests_only_no_application_changes_or_clinical_approval',passed:cases.length-failed,failed,cases};fs.writeFileSync(path.join(base,'sunitinib21-regorafenib-draft-tests.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({cases:cases.length,passed:cases.length-failed,failed,failures:cases.filter(x=>!x.passed)},null,2));process.exitCode=failed?1:0;
