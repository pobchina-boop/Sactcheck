'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const B=__dirname,R=path.resolve(B,'../../..'),E=require(R+'/js/assessment-engine'),D=require(R+'/js/protocol-dose-schedule'),V=require(R+'/js/protocol-validator'),integrated=process.argv.includes('--integrated'),results=[];
const auth=JSON.parse(fs.readFileSync(B+'/authoring.json')).regimens;
function check(name,fn){try{fn();results.push({name,pass:true});}catch(e){results.push({name,pass:false,error:e.message});}}
function load(code){let dirs=integrated?fs.readdirSync(R+'/protocols').map(d=>R+'/protocols/'+d).filter(d=>fs.statSync(d).isDirectory()):[B+'/proposed'];for(const dir of dirs){const f=fs.readdirSync(dir).find(f=>f.startsWith(code+'-'));if(f)return JSON.parse(fs.readFileSync(dir+'/'+f));}throw Error(code);}
for(const code of ['00214','00372']){
 const p=load(code),model=D.buildModel(p);
 function t(name,input,yes=[],no=[]){check(code+' '+name,()=>{const r=E.assess(p,input);assert.deepEqual(r.errors,[]);assert.deepEqual(r.invalid,[]);const ids=r.findings.map(f=>f.ruleId);for(const id of yes)assert(ids.includes(id),'missing '+id+' got '+ids);for(const id of no)assert(!ids.includes(id),'unexpected '+id);});}
 check(code+' strict validator',()=>{const v=V.validate(p,{strict:true});assert(v.valid,V.formatIssues(v).join('\n'));});
 check(code+' source governance',()=>{assert.equal(p.metadata.full_suite_release,'0.84.30');assert.match(p.metadata.source_pdf_sha256,/^[a-f0-9]{64}$/);assert.equal(p.metadata.validation.clinical_use_authorised,false);assert.equal(p.clinical_governance.clinical_use_authorised,false);assert.equal(p.metadata.organ_function_reconciliation.release,'0.59.0');assert.equal(p.metadata.organ_function_reconciliation.reconciled_release,'0.84.30');});
 check(code+' empty cannot clear',()=>{let r=E.assess(p,{});assert.equal(r.complete,false);assert(!['proceed','proceed_with_caution'].includes(r.actionType));});
 check(code+' complete source dose phases',()=>{assert(model.phases.length);assert(model.phases.every(ph=>ph.complete));});
 check(code+' unique rules and supported source',()=>{const ids=p.rule_engine.rules.map(r=>r.rule_id);assert.equal(ids.length,new Set(ids).size);for(const r of p.rule_engine.rules){assert(r.source.url);assert(r.source.page);assert.equal(r.source.checked,p.metadata.source_checked_date || '2026-11-02');}});
 check(code+' no fabricated CTCAE edition',()=>{for(const [k,v]of Object.entries(p.input_definitions)){if(k.endsWith('_grade')){assert(v.source_grading_note);assert(!v.ctcae_version);assert(v.grading_source_url);}}});
 if(code==='00214'){
  check('00214 correct official indication IDs',()=>assert.deepEqual(p.indications.map(i=>i.indication_id),['00214a','00214b']));
  check('00214 dose is7.5 not15',()=>{assert.equal(p.metadata.dose_schedule_context_input,'indication_id');assert.deepEqual(model.phases.map(ph=>ph.id),['00214a','00214b']);for(const ph of model.phases){assert.equal(ph.cycleLength,21);assert.equal(ph.components[0].dose,'7.5 mg/kg');assert.deepEqual(ph.components[0].days,['1']);assert.equal(ph.cycles,null);}});
  t('lung histology',{indication_id:'00214b',nsclc_nonsquamous:false},['NSCLC_HISTOLOGY']);
  t('colorectal avoids lung histology',{indication_id:'00214a',nsclc_nonsquamous:false},[],['NSCLC_HISTOLOGY']);
  t('lung first line',{indication_id:'00214b',first_line_metastatic:false},['NSCLC_FIRST_LINE']);
  t('combination7',{indication_id:'00214b',treatment_context:'combination',cycle_number:7},['NSCLC_COMBINATION_LIMIT']);
  t('continuation7',{indication_id:'00214b',treatment_context:'bevacizumab_only',cycle_number:7},['CONTINUATION_SCOPE'],['NSCLC_COMBINATION_LIMIT']);
  for(const v of [1.19,1.2,1.21])t('ANC '+v,{anc:v},v<1.2?['ANC_INITIAL']:[],v>=1.2?['ANC_INITIAL']:[]);
  for(const v of [99.99,100,100.01])t('PLT '+v,{platelets:v},v<=100?['PLATELETS_INITIAL']:[],v>100?['PLATELETS_INITIAL']:[]);
  for(const [field,id,cut]of [['creatinine_uln','CREATININE_INITIAL',1.5],['bilirubin','BILIRUBIN_INITIAL',26],['ast_uln','AST_INITIAL',5],['alp_uln','ALP_INITIAL',5]])for(const v of [cut-.01,cut,cut+.01])t(field+' '+v,{[field]:v},v>cut?[id]:[],v<=cut?[id]:[]);
  for(const v of ['negative','1+','2+','3+','4+'])t('dipstick '+v,{proteinuria_dipstick:v},['2+','3+'].includes(v)?['PROTEIN_DIPSTICK_2_3']:v==='4+'?['PROTEIN_DIPSTICK_4']:[],['negative','1+'].includes(v)?['PROTEIN_DIPSTICK_2_3','PROTEIN_DIPSTICK_4']:[]);
  for(const v of [.99,1,1.01])t('spot grams/L '+v,{urine_protein_g_l:v},v>=1?['PROTEIN_LAB_GE1']:[],v<1?['PROTEIN_LAB_GE1']:[]);
  for(const v of [0,1.99,2,2.01,3.99,4,4.01])t('24h protein '+v,{urine_protein_g_24h:v},v<=2?['PROTEIN_LE2']:v<=4?['PROTEIN_2_TO_4']:['PROTEIN_OVER_4'],v<=2?['PROTEIN_2_TO_4','PROTEIN_OVER_4']:v<=4?['PROTEIN_LE2','PROTEIN_OVER_4']:['PROTEIN_LE2','PROTEIN_2_TO_4']);
  t('quantified supersedes dipstick collection',{proteinuria_dipstick:'4+',urine_protein_g_24h:2},['PROTEIN_LE2'],['PROTEIN_DIPSTICK_4']);
  t('grade4 overrides low total',{proteinuria_grade:4,urine_protein_g_24h:1},['PROTEIN_GRADE4','PROTEIN_LE2']);
  t('grade2 not blanket hold',{proteinuria_grade:2},[],['PROTEIN_GRADE4']);
  t('uncontrolled hypertension',{uncontrolled_or_symptomatic_hypertension:true},['UNCONTROLLED_HYPERTENSION']);
  t('G3 persistence unknown',{hypertension_grade:3},['G2_G3_BP_REVIEW'],['PERSISTENT_G3_HYPERTENSION']);
  t('persistentG3',{hypertension_grade:3,hypertension_persisting:true},['PERSISTENT_G3_HYPERTENSION']);
  t('G4 hypertension',{hypertension_grade:4},['G4_HYPERTENSION']);
  for(const v of [150,150.01,160])t('numeric BP '+v,{systolic_bp_mmhg:v},v>150?['BP_NUMERIC_REVIEW']:[],['UNCONTROLLED_HYPERTENSION']);
  for(const v of [27,28,29])t('surgery days '+v,{days_since_major_surgery:v},v<28?['MAJOR_SURGERY_LT28']:[],v>=28?['MAJOR_SURGERY_LT28']:[]);
  t('unhealed despite28days',{days_since_major_surgery:28,wound_fully_healed:false},['WOUND_NOT_HEALED']);
  for(const [field,id]of [['gi_perforation','GI_PERFORATION'],['arterial_thromboembolic_event','ARTERIAL_THROMBOEMBOLIC_EVENT'],['tracheoesophageal_fistula','TE_FISTULA'],['nephrotic_syndrome','NEPHROTIC_SYNDROME'],['pres_confirmed','PRES'],['concurrent_radiotherapy','RADIOTHERAPY_REVIEW']])t(id,{[field]:true},[id]);
  for(const v of [2,3,4])t('bleeding grade '+v,{haemorrhage_grade:v},v>=3?['HAEMORRHAGE_G3PLUS']:['BLEEDING_LE2'],v<3?['HAEMORRHAGE_G3PLUS']:[]);
  check('00214 all component actions retain bevacizumab scope',()=>{for(const r of p.rule_engine.rules)assert.deepEqual(r.action.components,['bevacizumab']);});
  check('00214 no automatic anticancer dose reduction',()=>{assert(!p.rule_engine.rules.some(r=>r.action.type==='dose_reduce'));});
  check('00214 lung-only patient scope and indefinite count',()=>{const x=auth[code];assert.match(x.patient.scope_notice,/lung/);assert.equal(x.patient.patient_summary.card_cycle_count,null);assert.match(x.evidence.endpoints[1].interpretation,/No statistically significant/);assert.deepEqual(x.patient.evidence.metrics,[]);assert.match(x.risk.mapping_basis,/component only/);});
 }
 if(code==='00372'){
  check('00372 dose phases are exact',()=>{assert.equal(p.metadata.dose_schedule_context_input,'treatment_phase');assert.equal(p.metadata.dose_schedule_context_kind,'phase');assert.deepEqual(model.phases.map(ph=>ph.id),['combination','continuation']);let [co,ct]=model.phases;assert.equal(co.cycleLength,21);assert.equal(co.cycles,6);assert.equal(ct.cycleLength,28);assert.equal(ct.cycles,null);assert.equal(co.components[0].dose,'75 mg/m²');assert.deepEqual(co.components[0].days,['1']);assert.equal(co.components[1].days[0],'2');assert.equal(co.components[1].days.at(-1),'21');assert.match(co.components[1].dose,/200 mg twice daily/);assert.deepEqual(ct.components.map(a=>a.id),['nintedanib']);assert.equal(ct.components[0].days.length,28);assert.equal(ct.components[0].days[0],'1');});
  for(const v of [0,1,2])t('ECOG '+v,{ecog:v},v>1?['ECOG']:[],v<=1?['ECOG']:[]);
  for(const v of [0,1,2])t('prior lines '+v,{prior_advanced_chemotherapy_regimens:v},v>1?['PRIOR_LINES']:v===0?['NO_PRIOR_CHEMO']:[],v===1?['PRIOR_LINES','NO_PRIOR_CHEMO']:[]);
  for(const v of [3,4,6])t('continuation after '+v,{treatment_phase:'continuation',combination_cycles_completed:v},v<4?['CONTINUATION_MIN4']:[],v>=4?['CONTINUATION_MIN4']:[]);
  t('continuation unknown cycles',{treatment_phase:'continuation'},['CONTINUATION_CYCLES_UNKNOWN']);
  for(const v of [6,7])t('combination cap '+v,{treatment_phase:'combination',cycle_number:v},v>6?['COMBINATION_MAX6']:[],v<=6?['COMBINATION_MAX6']:[]);
  t('nintedanib Day1 combo',{treatment_phase:'combination',nintedanib_on_docetaxel_day:true},['NINT_DAY1']);
  t('continuation no docetaxel-day omission',{treatment_phase:'continuation',combination_cycles_completed:4,nintedanib_on_docetaxel_day:true},[],['NINT_DAY1']);
  for(const v of [.49,.5,1.49,1.5,1.51])t('combinationANC '+v,{treatment_phase:'combination',anc_x10e9_l:v},v<1.5?['DOC_ANC_DELAY']:v===1.5?['DOC_ANC_EXACT15']:[],v>1.5?['DOC_ANC_DELAY','DOC_ANC_EXACT15']:[]);
  t('continuation no docetaxel ANC action',{treatment_phase:'continuation',combination_cycles_completed:4,anc_x10e9_l:1.4},[],['DOC_ANC_DELAY','DOC_ANC_EXACT15']);
  t('unknown phase lowANC',{anc_x10e9_l:1},['ANC_PHASE_UNKNOWN'],['DOC_ANC_DELAY']);
  for(const v of [29.99,30,30.01])t('CrCl '+v,{crcl_ml_min:v},v<30?['NINT_RENAL_LT30']:v===30?['NINT_RENAL_EXACT30']:[],v>30?['NINT_RENAL_LT30','NINT_RENAL_EXACT30']:[]);
  for(const v of ['none','A','B','C'])t('ChildPugh '+v,{nintedanib_child_pugh:v},['B','C'].includes(v)?['NINT_CHILD_BC']:[],['none','A'].includes(v)?['NINT_CHILD_BC']:[]);
  for(const f of ['ast_uln_multiple','alt_uln_multiple']){
   for(const n of [2.5,2.51,3,3.01,5,5.01])for(const b of [1.49,1.5])t(f+' '+n+' bilirubin '+b,{[f]:n,bilirubin_uln_multiple:b},(n>2.5&&b>=1.5)||n>5?['NINT_LFT_HOLD']:[],n<=5&&!(n>2.5&&b>=1.5)?['NINT_LFT_HOLD']:[]);
   for(const n of [3,3.01])for(const b of [1.99,2])for(const a of [1.99,2])t('DILI '+f+' '+n+'/'+b+'/'+a,{[f]:n,bilirubin_uln_multiple:b,alp_uln_multiple:a,alternative_liver_cause_established:false},n>3&&b>=2&&a<2?['NINT_LFT_PERMANENT']:[],!(n>3&&b>=2&&a<2)?['NINT_LFT_PERMANENT']:[]);
  }
  for(const cause of [true,undefined])t('DILI cause '+cause,{alt_uln_multiple:4,bilirubin_uln_multiple:2,alp_uln_multiple:1,...(cause===undefined?{}:{alternative_liver_cause_established:cause})},['NINT_LFT_CAUSE_REVIEW'],['NINT_LFT_PERMANENT']);
  t('old genericALT>3 removed',{alt_uln_multiple:3.1,bilirubin_uln_multiple:1,alp_uln_multiple:1},[],['NINT_LFT_HOLD','NINT_LFT_PERMANENT']);
  t('docetaxel bilirubin ambiguous',{treatment_phase:'combination',bilirubin_uln_multiple:1.01},['DOC_HEPATIC_SEVERE_REVIEW']);
  t('continuation ignores docetaxel liver rule',{treatment_phase:'continuation',combination_cycles_completed:4,bilirubin_uln_multiple:1.01,alp_uln_multiple:7,alt_uln_multiple:4},[],['DOC_HEPATIC_SEVERE_REVIEW','DOC_HEPATIC_75']);
  for(const g of [1,2,3])for(const days of [7,8])for(const despite of [false,true])t('diarrhoea '+g+'/'+days+'/'+despite,{diarrhoea_grade:g,diarrhoea_days:days,despite_antidiarrhoeal:despite},despite&&((g>=2&&days>7)||g>=3)?['NINT_TOXICITY_INTERRUPT']:[],!(despite&&((g>=2&&days>7)||g>=3))?['NINT_TOXICITY_INTERRUPT']:[]);
  t('vomiting2despite',{vomiting_grade:2,despite_antiemetic:true},['NINT_TOXICITY_INTERRUPT']);
  t('vomiting2support unknown',{vomiting_grade:2},['NINT_NAUSEA_REVIEW'],['NINT_TOXICITY_INTERRUPT']);
  t('nausea3despite',{nausea_grade:3,despite_antiemetic:true},['NINT_TOXICITY_INTERRUPT']);
  for(const [field,value]of [['previous_febrile_neutropenia',true],['anc_below_05_over_week',true],['skin_reaction_grade',3],['neuropathy_grade',3],['stomatitis_grade',4]])for(const dose of [75,60,undefined])t(field+' currentdose '+dose,{treatment_phase:'combination',[field]:value,...(dose===undefined?{}:{docetaxel_dose_mg_m2:dose})},[dose===75?'DOC_EVENT_REDUCE':dose===60?'DOC_EVENT_STOP':'DOC_EVENT_DOSE_UNKNOWN']);
  t('skin4not invented60',{treatment_phase:'combination',skin_reaction_grade:4,docetaxel_dose_mg_m2:75},['DOC_SKIN_G4_REVIEW'],['DOC_EVENT_REDUCE']);
  for(const field of ['previous_febrile_neutropenia','anc_below_05_over_week','severe_docetaxel_hypersensitivity'])t('continuation ignores '+field,{treatment_phase:'continuation',combination_cycles_completed:4,[field]:true,docetaxel_dose_mg_m2:60},[],['DOC_EVENT_REDUCE','DOC_EVENT_STOP','DOC_SEVERE_ALLERGY']);
  for(const n of [2,3])t('premed doses '+n,{treatment_phase:'combination',dexamethasone_pre_doses:n},n<3?['DOC_PREMED_MISSING']:[],n>=3?['DOC_PREMED_MISSING']:[]);
  for(const [field,id]of [['gi_perforation','GI_PERFORATION'],['life_threatening_vte','VTE_LIFE_THREATENING'],['pres_suspected','SMPC_PRES'],['ischaemic_colitis','SMPC_ISCHAEMIC_COLITIS'],['nintedanib_100_intolerable','NINT_100_INTOLERABLE'],['missed_nintedanib_dose','MISSED_NINT']])t(id,{[field]:true},[id]);
  check('sourceambiguities cannot produce numericdose',()=>{for(const id of ['DOC_HEPATIC_75','DOC_HEPATIC_SEVERE_REVIEW','DOC_EVENT_DOSE_UNKNOWN']){let a=p.rule_engine.rules.find(r=>r.rule_id===id).action;assert.equal(a.dose_calculation,'specialist_review');assert(!a.dose_percent_of_original);}});
  check('00372 context packs separate phases',()=>{const x=auth[code];assert.equal(x.patient.patient_context_selector,true);assert.deepEqual(Object.keys(x.patient_contexts),['combination','continuation']);let co=x.patient_contexts.combination.patient,ct=x.patient_contexts.continuation.patient;assert.equal(co.cycle_days,21);assert.equal(ct.cycle_days,28);assert.equal(co.patient_summary.card_cycle_count,6);assert.equal(ct.patient_summary.card_cycle_count,null);assert.equal(ct.agents.length,1);assert.match(ct.patient_summary.schedule,/no planned tablet-free week/i);assert.deepEqual(ct.evidence.metrics,[]);assert(x.patient_contexts.continuation.support_plans.every(p=>p.active_drugs.every(d=>d==='nintedanib')));});
 }
 for(const [ctx,x]of [['canonical',auth[code]],...Object.entries(auth[code].patient_contexts||{})])check(code+' '+ctx+' completepatient days/anchors/sources',()=>{const d=x.patient;for(let n=1;n<=d.cycle_days;n++)assert.equal(d.day_groups.filter(g=>g.start<=n&&g.end>=n).length,1);assert(d.anatomy.every(a=>a.length===6&&typeof a[4]==='number'));assert(d.sources.every(s=>s.url&&s.title));assert.equal(d.patient_summary.monitoring.length,4);assert.deepEqual(d.evidence.metrics,[]);assert(d.patient_summary.card_schedule.length<=110);});
}
const out={mode:integrated?'integrated':'proposed',total:results.length,passed:results.filter(r=>r.pass).length,failed:results.filter(r=>!r.pass).length,results};fs.writeFileSync(B+'/'+out.mode+'-results.json',JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({...out,results:results.filter(r=>!r.pass)},null,2));if(out.failed)process.exitCode=1;
