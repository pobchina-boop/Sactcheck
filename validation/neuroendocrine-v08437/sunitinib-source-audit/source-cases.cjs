'use strict';
// Execute clinical expectations against the application assessment engine, never a toy evaluator.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../../..'),E=require(path.join(root,'js/assessment-engine')),D=require(path.join(root,'js/protocol-dose-schedule'));
const file='00327-sunitinib-37-5-mg-therapy-28-day.json';
const before=JSON.parse(fs.readFileSync(path.join(__dirname,'protocol-before',file)));
const p=JSON.parse(fs.readFileSync(path.join(root,'protocols/neuroendocrine',file)));
const cases=[];
const nonAction=['proceed_with_caution','partial_context_required','incomplete'];
function take(r){return{action:r.actionType,complete:r.complete,coverageComplete:r.coverageComplete,findings:r.findings.filter(f=>!/^assessed_|partial_/.test(f.ruleId||'')).map(f=>({id:f.ruleId,type:f.actionType,message:f.action.message})),unassessed:r.unassessed.map(f=>f.id||f.field||f.label),invalid:r.invalid,errors:r.errors};}
function test(id,input,want,requireRule,extra){
 const b=E.assess(before,input),a=E.assess(p,input);const doseBefore=D.buildModificationModel(before,b),doseAfter=D.buildModificationModel(p,a);const expected=Array.isArray(want)?want:[want];let pass=true,error=null;
 try{assert(expected.includes(a.actionType),id+': expected '+expected+' received '+a.actionType);assert.equal(a.errors.length,0,id+' engine errors');if(requireRule)assert(a.findings.some(f=>f.ruleId==='SUN327_'+requireRule),id+' missing rule '+requireRule);assert.equal(doseAfter.hasQuantified||false,false,id+' must not calculate a dose from review prose');assert(doseAfter.rows.every(row=>!row.quantified&&row.allActions.every(x=>!x.quantified)),id+' nested dose action must not be quantified');if(extra)extra(a);}
 catch(e){pass=false;error=e.message;}
 cases.push({id,input,expected:{action:expected,required_rule:requireRule?'SUN327_'+requireRule:null},pass,error,before:take(b),after:take(a),dose_before:{hasQuantified:doseBefore.hasQuantified||false,rows:doseBefore.rows},dose_after:{hasQuantified:doseAfter.hasQuantified||false,rows:doseAfter.rows}});
}
function t(id,input,action,rule){test(id,input,action,rule);}
test('continuous_schedule_panel',{},'incomplete',null,()=>{
 const m=D.buildModel(p);assert.equal(D.hasData(p),true);assert.equal(m.phases.length,1);
 const phase=m.phases[0];assert.equal(phase.complete,true);assert.equal(phase.cycleLength,28);assert.equal(phase.cycles,null);
 assert.equal(phase.components.length,1);const c=phase.components[0];assert.equal(c.id,'sunitinib');assert.equal(c.dose,'37.5 mg once daily');assert.equal(c.route,'PO');assert.deepEqual(c.days,['Continuous']);
 assert.match(phase.summary,/28-day.*review interval/);assert.match(phase.summary,/no scheduled off-week/);assert.match(c.note,/Missed dose: no additional dose/);
 assert.deepEqual(m.doseLevels,[],'Do not offer a generic escalation ladder');assert.equal(p.treatment.components[0].source.page,1);assert.equal(m.sourceUrl,p.metadata.source_url);
});
test('empty_is_unassessed',{},'incomplete',null,a=>{assert.equal(a.complete,false);assert(a.unassessed.length>=40)});
for(const e of [0,1,2])t('ecog_in_range_'+e,{ecog:e},nonAction);
for(const e of [3,4])t('ecog_outside_'+e,{ecog:e},'consultant_review','ECOG_GT2');
for(const [field,rule] of [['hypersensitivity','HYPERSENSITIVITY'],['pregnancy','PREGNANCY_BF'],['breastfeeding','PREGNANCY_BF']]){t(field+'_true',{[field]:true},'contraindicated',rule);t(field+'_false',{[field]:false},nonAction);}
t('indication_wrong',{indication_eligible:false},'consultant_review','INDICATION');t('indication_confirmed_only',{indication_eligible:true},nonAction);
for(const stage of ['starting','continuing'])t('bp_uncontrolled_'+stage,{assessment_stage:stage,uncontrolled_hypertension:true},stage==='starting'?'contraindicated':'consultant_review',stage==='starting'?'HTN_START_EXCLUSION':'UNCONTROLLED_HTN');
t('bp_stage_missing',{uncontrolled_hypertension:true},'consultant_review','UNCONTROLLED_HTN');
t('bp_severe_on_treatment',{assessment_stage:'continuing',severe_uncontrolled_hypertension:true},'withhold','SEVERE_HTN_HOLD');
t('bp_controlled_severe_false',{uncontrolled_hypertension:false,severe_uncontrolled_hypertension:false},nonAction);
for(const anc of [0,.5,.99,.999,1,1.001,1.01,2]){
 t('anc_only_'+anc,{anc},anc<1?'delay':nonAction,anc<1?'ANC_LT1':null);
 for(const platelets of [0,50,74,74.9,75,75.1,100])t(`counts_${anc}_${platelets}`,{anc,platelets},anc<1||platelets<75?'delay':'proceed_with_caution',anc<1?'ANC_LT1':platelets<75?'PLT_LT75':'COUNTS_MEET');
}
for(const platelets of [74.99,75,75.01])t('platelet_only_'+platelets,{platelets},platelets<75?'delay':nonAction,platelets<75?'PLT_LT75':null);
for(const dose of [25,37.5,50,62.5,'other'])test('counts_preserve_prior_dose_'+dose,{anc:1,platelets:75,current_dose_mg:dose},'proceed_with_caution','COUNTS_MEET',a=>{const f=a.findings.find(f=>f.ruleId==='SUN327_COUNTS_MEET');assert.match(f.action.message,/prior reductions/);assert.equal(f.action.dose_mg,undefined);assert.equal(f.action.dose_percent,undefined)});
for(const f of ['anc','platelets'])test(f+'_negative',{[f]:-1},'incomplete',null,a=>assert(a.invalid.some(x=>x.id===f)));
for(const c of ['none','A','B','C'])test('child_pugh_'+c,{child_pugh_class:c},c==='C'?'consultant_review':nonAction,c==='C'?'CHILD_PUGH_C':c==='A'||c==='B'?'CHILD_PUGH_AB':null,a=>{if(c==='C'){assert.match(JSON.stringify(a.findings),/SOURCE CONFLICT/);assert(a.findings.every(f=>f.action.dose_percent===undefined))}});
for(const renal of ['normal','impaired','haemodialysis'])t('renal_'+renal,{renal_status:renal},renal==='haemodialysis'?'consultant_review':nonAction,renal==='impaired'?'RENAL':renal==='haemodialysis'?'DIALYSIS':null);
for(const cyp of ['none','potent_inhibitor','potent_inducer'])t('cyp_'+cyp,{cyp3a4_interaction:cyp},cyp==='none'?nonAction:'consultant_review',cyp==='potent_inhibitor'?'CYP_INHIBITOR':cyp==='potent_inducer'?'CYP_INDUCER':null);
for(const lvef of [0,49.99,50,54.99,55,55.01,60,100])t('lvef_numeric_'+lvef,{lvef_percent:lvef},lvef<55?'consultant_review':nonAction,lvef<55?'LVEF_BELOW55':null);
for(const status of ['normal','asymptomatic_decline','symptomatic_decline'])t('cardiac_'+status,{lvef_status:status},status==='normal'?nonAction:status==='asymptomatic_decline'?'withhold':'discontinue',status==='asymptomatic_decline'?'LVEF_ASYMPTOMATIC':status==='symptomatic_decline'?'LVEF_SYMPTOMATIC':null);
for(const [field,rule]of [['qt_risk_present','QT_CAUTION'],['significant_cardiovascular_disease_or_lvef_lt55','CARDIAC_CAUTION'],['pretreatment_or_cycle_tests_missing','TESTS_MISSING'],['aneurysm_or_dissection_risk','ANEURYSM'],['anticoagulant_use','ANTICOAGULANT'],['active_significant_bleeding','BLEEDING']]){t(field+'_present',{[field]:true},'consultant_review',rule);t(field+'_absent',{[field]:false},nonAction);}
for(const state of ['normal','untreated_preexisting','new_dysfunction'])t('thyroid_'+state,{thyroid_status:state},state==='normal'?nonAction:'consultant_review',state==='untreated_preexisting'?'THYROID_UNTREATED':state==='new_dysfunction'?'THYROID_NEW':null);
for(const g of [0,1,2,3,4])t('generic_current_'+g,{other_toxicity_grade:g},g>=3?'delay_then_dose_reduce':nonAction,g>=3?'TOX_G3':null);
for(const high of [3,4])for(const current of [0,1,2,3,4])t(`generic_recovery_${high}_${current}`,{other_toxicity_highest_grade:high,other_toxicity_grade:current},current>=3?'delay_then_dose_reduce':current===2?'delay':'consultant_review',current>=3?'TOX_G3':current===2?'TOX_RECOVERING_G2':'TOX_RECOVERY_REVIEW');
for(const g of [0,1,2,3])for(const occ of [undefined,1,2,3]){const x={hand_foot_syndrome_grade:g};if(occ!==undefined)x.hand_foot_occurrence=occ;t(`hfs_current_${g}_${occ}`,x,g===3||g===2&&occ>=2?'delay_then_dose_reduce':g===2?'delay':nonAction,g===3?'HFS_G3':g===2&&occ>=2?'HFS_G2_RECURRENT':g===2?'HFS_G2_HOLD':null);}
for(const high of [2,3])for(const current of [0,1])for(const occ of [undefined,1,2,3]){const x={hand_foot_highest_grade:high,hand_foot_syndrome_grade:current};if(occ!==undefined)x.hand_foot_occurrence=occ;t(`hfs_recovered_${high}_${current}_${occ}`,x,'consultant_review','HFS_RECOVERY_REVIEW');}
test('hfs_grade4_rejected',{hand_foot_syndrome_grade:4},'incomplete',null,a=>assert(a.invalid.some(x=>x.id==='hand_foot_syndrome_grade')));
test('hfs_highest_grade4_rejected',{hand_foot_highest_grade:4},'incomplete',null,a=>assert(a.invalid.some(x=>x.id==='hand_foot_highest_grade')));
const episodes=[['generic',{other_toxicity_highest_grade:3,other_toxicity_grade:1}],['hfs_first_g3',{hand_foot_highest_grade:3,hand_foot_syndrome_grade:1,hand_foot_occurrence:1}],['hfs_second_g2',{hand_foot_highest_grade:2,hand_foot_syndrome_grade:1,hand_foot_occurrence:2}]];
for(const [ep,fields]of episodes)for(const dose of [undefined,25,37.5,50,62.5,'other'])for(const changed of [undefined,false,true]){const x={...fields};if(dose!==undefined)x.current_dose_mg=dose;if(changed!==undefined)x.episode_dose_change_completed=changed;const rule=changed===true?'DOSE_ALREADY_CHANGED':changed===false&&dose!==undefined?[37.5,50].includes(dose)?'DOSE_AFTER_RECOVERY':'DOSE_BELOW_TABLE':ep==='generic'?'TOX_RECOVERY_REVIEW':'HFS_RECOVERY_REVIEW';t(`episode_${ep}_dose_${dose}_already_${changed}`,x,'consultant_review',rule);}
test('hfs_first_g2_no_reduction_inferred',{hand_foot_highest_grade:2,hand_foot_syndrome_grade:1,hand_foot_occurrence:1,current_dose_mg:37.5,episode_dose_change_completed:false},'consultant_review','HFS_RECOVERY_REVIEW',a=>assert(!a.findings.some(f=>/DOSE_AFTER|DOSE_BELOW/.test(f.ruleId))));
for(const [status,action,rule] of [['none',nonAction,null],['suspected','discontinue','SKIN_SUSPECTED'],['confirmed_sjs_ten','permanently_discontinue','SKIN_CONFIRMED'],['resolved_em','consultant_review','SKIN_EM_RESOLVED']])t('skin_'+status,{severe_skin_reaction:status},action,rule);
for(const [status,action,rule]of [['none',nonAction,null],['new_or_worsening','consultant_review','PROTEINURIA'],['nephrotic','discontinue','NEPHROTIC']])t('urine_'+status,{proteinuria_status:status},action,rule);
for(const [field,action,rule]of [['major_surgery_or_unhealed_wound','withhold','SURGERY'],['pancreatitis_symptoms','discontinue','PANCREATITIS'],['liver_failure_signs','discontinue','HEPATIC_FAILURE'],['thrombotic_microangiopathy','discontinue','TMA'],['fistula_formation','withhold','FISTULA'],['angioedema','withhold','ANGIOEDEMA'],['seizures_or_pres','withhold','PRES'],['necrotising_fasciitis','discontinue','NECROTISING_FASCIITIS'],['symptomatic_hypoglycaemia','withhold','HYPOGLYCAEMIA'],['unexplained_mental_status_change','consultant_review','MENTAL_STATUS'],['tls_risk_present','consultant_review','TLS'],['dental_onj_concern','consultant_review','DENTAL']]){t(field+'_true',{[field]:true},action,rule);t(field+'_false',{[field]:false},nonAction);t(field+'_overrides_recovered_counts',{[field]:true,anc:2,platelets:180},action,rule);}
t('escalation_requested_only',{escalation_requested:true},'consultant_review','ESCALATION_REVIEW');
for(const weeks of [0,7.99,8,8.01,12])for(const ng of [0,1,2])for(const hg of [1,2,3])t(`escalation_${weeks}_${ng}_${hg}`,{escalation_requested:true,treatment_weeks:weeks,no_response:true,other_toxicity_grade:ng,haematological_toxicity_grade:hg},'consultant_review',weeks<8?'ESCALATION_TIMING':ng>1||hg>2?'ESCALATION_NOT_MET':'ESCALATION_CRITERIA');
for(const dose of [25,37.5,50,62.5,'other'])t('escalation_prior_dose_'+dose,{escalation_requested:true,current_dose_mg:dose},'consultant_review',dose===37.5?'ESCALATION_REVIEW':'ESCALATION_DOSE_HISTORY');
t('escalation_response_exists',{escalation_requested:true,treatment_weeks:8,no_response:false,other_toxicity_grade:1,haematological_toxicity_grade:2},'consultant_review','ESCALATION_NOT_MET');
t('escalation_hfs_overrides',{escalation_requested:true,treatment_weeks:8,no_response:true,other_toxicity_grade:1,haematological_toxicity_grade:2,hand_foot_syndrome_grade:3},'delay_then_dose_reduce','HFS_G3');
t('escalation_anc_overrides',{escalation_requested:true,treatment_weeks:8,no_response:true,other_toxicity_grade:1,haematological_toxicity_grade:2,anc:.99},'delay','ANC_LT1');
t('stop_beats_counts_and_hfs',{anc:2,platelets:180,hand_foot_syndrome_grade:3,lvef_status:'symptomatic_decline'},'discontinue','LVEF_SYMPTOMATIC');
t('permanent_skin_beats_all',{severe_skin_reaction:'confirmed_sjs_ten',lvef_status:'symptomatic_decline',hypersensitivity:true,anc:.1},'permanently_discontinue','SKIN_CONFIRMED');
t('new_urine_nephrotic_overrides_renal_initial',{renal_status:'impaired',proteinuria_status:'nephrotic'},'discontinue','NEPHROTIC');
for(const [label,input,field] of [['cbc',{anc:1},'platelets'],['hfs',{hand_foot_syndrome_grade:2},'hand_foot_occurrence'],['dose',{other_toxicity_grade:1,other_toxicity_highest_grade:3},'current_dose_mg'],['renal',{renal_status:'impaired'},'proteinuria_status'],['cardiac',{lvef_status:'normal'},'qt_risk_present']])test('missing_domain_'+label,input,label==='hfs'?'delay':label==='dose'?'consultant_review':nonAction,null,a=>{assert.equal(a.complete,false);assert(a.unassessed.some(x=>(x.id||x.field)===field),field+' must remain unassessed');});
// Every declared rule needs a positive executed witness; sources must be auditable.
const matrix=p.rule_engine.rules.map(rule=>({rule_id:rule.id,source:rule.source,criterion:rule.when,action:rule.action.type,cases:cases.filter(c=>c.after.findings.some(f=>f.id===rule.id)).map(c=>c.id)}));
for(const rule of p.rule_engine.rules){assert.equal(rule.action.dose_calculation,'specialist_review');assert.equal(rule.action.block_numeric_dose,true);}
for(const row of matrix){assert(row.cases.length,'Unexercised rule '+row.rule_id);assert(row.source.url&&Number.isInteger(row.source.page)&&row.source.sha256,'Missing source evidence '+row.rule_id);}
assert(p.input_definitions.hand_foot_syndrome_grade.options.every(x=>x.value<=3));assert.equal(p.metadata.validation.clinical_use_authorised,false);assert.equal(p.required_inputs.length,0);
const result={release:'0.84.37',protocol:'00327',engine:'js/assessment-engine.js',before_sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'protocol-before',file))).digest('hex'),schedule_before:D.buildModel(before),schedule_after:D.buildModel(p),after_sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'protocols/neuroendocrine',file))).digest('hex'),passed:cases.filter(c=>c.pass).length,failed:cases.filter(c=>!c.pass).length,cases};
fs.writeFileSync(path.join(__dirname,'source-case-results.json'),JSON.stringify(result,null,2)+'\n');fs.writeFileSync(path.join(__dirname,'criterion-matrix.json'),JSON.stringify(matrix,null,2)+'\n');
console.log(JSON.stringify({passed:result.passed,failed:result.failed,rules:matrix.length,failures:cases.filter(c=>!c.pass).map(c=>({id:c.id,error:c.error}))},null,2));
process.exitCode=result.failed?1:0;
