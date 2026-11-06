'use strict';
// Expectations are transcribed from NCCP 00813 v2 pp1–6 and the current EMA SmPC, not generated from candidate conditions.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const candidateRoot=path.resolve(__dirname,'../../..');
const engineRoot=process.env.SACT_TEST_ROOT||candidateRoot;
const E=require(path.join(engineRoot,'js/assessment-engine')),D=require(path.join(engineRoot,'js/protocol-dose-schedule')),V=require(path.join(engineRoot,'js/protocol-validator'));
const beforeMode=process.argv.includes('--before');
const name='00813-bevacizumab-5-mg-kg-monotherapy-14-day.json';
const cur=JSON.parse(fs.readFileSync(path.join(candidateRoot,'protocols/neuro-oncology',name)));
const p=beforeMode?JSON.parse(fs.readFileSync(path.join(__dirname,'00813-before.json'))):cur;
const cases=[];
function test(name,input,want={},citation='NCCP 00813 p4'){
 let a,model;
 try{
  a=E.assess(p,input);model=D.buildModificationModel(p,a);
  assert.deepEqual(a.errors,[]);assert.deepEqual(a.invalid,[]);
  if(want.action)assert.equal(a.actionType,want.action);
  for(const id of want.yes||[])assert(a.findings.some(f=>f.ruleId===id),'Missing '+id);
  for(const id of want.no||[])assert(!a.findings.some(f=>f.ruleId===id),'Unexpected '+id);
  if(want.text)assert.match(JSON.stringify(a.findings),want.text);
  assert(!model.hasQuantified,'Bevacizumab must not acquire a numeric modification');
  assert(model.rows.every(r=>!r.quantified&&r.allActions.every(x=>!x.quantified)),'Nested numeric adjustment forbidden');
  cases.push({name,input,citation,pass:true,action:a.actionType,rules:a.findings.filter(f=>!f.domainAssessment).map(f=>f.ruleId)});
 }catch(e){cases.push({name,input,citation,pass:false,error:e.message,action:a?.actionType,rules:a?.findings.map(f=>f.ruleId)||[]})}
}
function inv(name,fn,citation='Audit provenance'){try{fn();cases.push({name,citation,pass:true,rules:[]})}catch(e){cases.push({name,citation,pass:false,error:e.message,rules:[]})}}
test('Empty assessment is incomplete',{}, {action:'incomplete'});
for(const f of Object.keys(cur.input_definitions))for(const v of [null,''])test('Missing '+f+' '+JSON.stringify(v),{[f]:v},{action:'incomplete'},'Omitted values are not normal');
for(let n=0;n<=4;n++)test('ECOG '+n,{ecog:n},n>2?{action:'consultant_review',yes:['ECOG_GT2']}:{no:['ECOG_GT2']},'NCCP p1 eligibility');
for(const f of ['indication_eligible','organ_function_adequacy_confirmed'])for(const v of [false,true])test(f+' '+v,{[f]:v},v?{no:[f==='indication_eligible'?'INDICATION':'ORGAN_ADEQUACY']}:{action:'consultant_review',yes:[f==='indication_eligible'?'INDICATION':'ORGAN_ADEQUACY']},'NCCP p1');
const booleanCases=[
 ['hypersensitivity','EXCLUSION_HYPERSENSITIVITY','contraindicated','NCCP p2 exclusions'],
 ['pregnancy','PREGNANCY_REVIEW','contraindicated','NCCP p2 exclusions'],
 ['breastfeeding','BREASTFEEDING','contraindicated','NCCP p2; EMA p10'],
 ['recent_intracranial_haemorrhage','RECENT_ICH','contraindicated','NCCP p2'],
 ['minimal_contrast_enhancement_or_gliomatosis','MINIMAL_ENHANCEMENT','contraindicated','NCCP p2'],
 ['recent_stroke_or_mi_lt1y','RECENT_STROKE_MI','contraindicated','NCCP p2'],
 ['recent_major_surgery_or_unhealed_wound','UNHEALED_WOUND_OR_RECENT_SURGERY','withhold','NCCP p2; EMA p6'],
 ['surgical_wound_complication','UNHEALED_WOUND_OR_RECENT_SURGERY','withhold','EMA p6'],
 ['planned_major_surgery','PLANNED_MAJOR_SURGERY','withhold','EMA p6'],
 ['uncontrolled_or_symptomatic_hypertension','UNCONTROLLED_HYPERTENSION','withhold','NCCP p4 Table 3'],
 ['persistent_grade3_hypertension','PERSISTENT_G3_OR_G4_HYPERTENSION','discontinue','NCCP p4 Table 3'],
 ['severe_bp_uncontrolled','SEVERE_UNCONTROLLED_BP','withhold','NCCP p4 Table 3; legacy threshold reconciliation'],
 ['medically_significant_hypertension_uncontrolled_despite_treatment','HTN_UNCONTROLLABLE_DESPITE_TREATMENT','permanently_discontinue','EMA p6'],
 ['hypertensive_crisis_or_encephalopathy','HYPERTENSIVE_CRISIS_PRES','permanently_discontinue','EMA p6'],
 ['nephrotic_syndrome','NEPHROTIC_SYNDROME','permanently_discontinue','EMA p7'],
 ['grade4_proteinuria','PROTEINURIA_GRADE4','discontinue','NCCP p4 Table 3'],
 ['tracheoesophageal_fistula','TE_FISTULA','permanently_discontinue','EMA p6; NCCP p4'],
 ['other_internal_fistula','OTHER_FISTULA_REVIEW','consultant_review','EMA p6'],
 ['arterial_thromboembolic_event','ARTERIAL_THROMBOEMBOLIC_EVENT','permanently_discontinue','EMA p7'],
 ['gi_perforation','GI_PERFORATION','permanently_discontinue','EMA p5'],
 ['necrotising_fasciitis','NECROTISING_FASCIITIS','discontinue','EMA p6'],
 ['pres_confirmed','PRES','discontinue','EMA p6'],
 ['current_intracranial_bleeding','INTRACRANIAL_BLEEDING','discontinue','EMA p7'],
 ['suspected_pres_or_new_neurological_symptoms','PRES_SUSPECTED','withhold','EMA p6; urgent assessment'],
 ['infusion_reaction','INFUSION_REACTION','withhold','EMA p8'],
 ['cardiovascular_risk_or_prior_anthracycline_chestwall_rt','CARDIOVASCULAR_CAUTION','consultant_review','NCCP p2'],
 ['renal_disease_or_previous_proteinuria','RENAL_CAUTION','consultant_review','NCCP pp2–3'],
 ['hepatic_impairment','HEPATIC_CAUTION','consultant_review','NCCP p3 Table 1'],
 ['bleeding_clotting_or_vte_history','BLEED_CLOT_HISTORY','consultant_review','NCCP p2'],
 ['prior_pelvic_rt_or_fistula_perforation_risk','PERFORATION_RISK','consultant_review','NCCP p2'],
 ['arterial_thromboembolism_within_6_months','RECENT_ATE_CAUTION','consultant_review','NCCP p2'],
 ['warfarin_use','WARFARIN_MONITORING','consultant_review','NCCP pp2–3'],
 ['monitoring_missing','MONITORING_MISSING','consultant_review','NCCP pp2–3'],
 ['aneurysm_or_dissection_risk','ANEURYSM_RISK','consultant_review','EMA p7'],
 ['bisphosphonate_or_dental_risk','DENTAL_ONJ_RISK','consultant_review','EMA p8'],
 ['sunitinib_or_other_interaction_concern','INTERACTION_REVIEW','consultant_review','EMA p9'],
 ['fertility_contraception_plan_missing','FERTILITY_CONTRACEPTION','consultant_review','EMA p10']
];
for(const [f,id,action,citation]of booleanCases)for(const v of [false,true])test(f+' '+v,{[f]:v},v?{action,yes:[id]}:{no:[id]},citation);
for(const day of [0,27,27.999,28,28.001,35])for(const healed of [undefined,false,true]){
 const x={days_since_major_surgery:day,...(healed===undefined?{}:{wound_fully_healed:healed})};
 test('Surgery interval and healing '+day+'/'+healed,x,day<28||healed===false?{action:'withhold',yes:['UNHEALED_WOUND_OR_RECENT_SURGERY']}:healed===undefined?{action:'consultant_review',yes:['SURGERY_HEALING_CONFIRMATION']}:{no:['UNHEALED_WOUND_OR_RECENT_SURGERY','SURGERY_HEALING_CONFIRMATION']},'NCCP p2; EMA p6');
}
for(const g of [0,1,2,3,4])for(const persistent of [undefined,false,true]){
 const x={hypertension_grade:g,...(persistent===undefined?{}:{persistent_grade3_hypertension:persistent})};
 const stop=g===4||persistent===true;
 test('Hypertension grade and persistence '+g+'/'+persistent,x,stop?{action:'discontinue',yes:['PERSISTENT_G3_OR_G4_HYPERTENSION']}:g>=2?{action:'consultant_review',yes:['HYPERTENSION_G2_G3'],no:['PERSISTENT_G3_OR_G4_HYPERTENSION']}:{no:['PERSISTENT_G3_OR_G4_HYPERTENSION','HYPERTENSION_G2_G3']});
}
for(const systolic of [149.99,150,150.01,200,200.01])for(const diastolic of [99.99,100,100.01,110,110.01])for(const sustained of [false,true]){
 const high=systolic>150||diastolic>100,both=systolic>150&&diastolic>100;
 const x={systolic_bp:systolic,diastolic_bp:diastolic,bp_sustained_on_antihypertensives:sustained,assessment_stage:'starting'};
 test('Source BP initiation '+systolic+'/'+diastolic+'/'+sustained,x,both&&sustained?{action:'withhold',yes:['BP_CONFIRMED_INITIATION_THRESHOLD']}:{...(high?{action:'consultant_review',yes:[sustained?'BP_SOURCE_THRESHOLD':'BP_SINGLE_READING']}:{no:['BP_SOURCE_THRESHOLD','BP_SINGLE_READING']}),no:['BP_CONFIRMED_INITIATION_THRESHOLD','PERSISTENT_G3_OR_G4_HYPERTENSION']});
}
for(const stage of [undefined,'continuing'])test('Numerical BP requires initiation context '+stage,{systolic_bp:160,diastolic_bp:105,bp_sustained_on_antihypertensives:true,...(stage?{assessment_stage:stage}:{})},{action:'consultant_review',yes:['BP_SOURCE_THRESHOLD'],no:['BP_CONFIRMED_INITIATION_THRESHOLD']});
for(const [f,v]of [['systolic_bp',151],['diastolic_bp',101]])test('Single BP component cannot grade '+f,{[f]:v},{action:'consultant_review',yes:['BP_SINGLE_READING'],no:['PERSISTENT_G3_OR_G4_HYPERTENSION','BP_CONFIRMED_INITIATION_THRESHOLD']});
const permissive=['PROTEIN_LOW_SCREEN','PROTEIN_DIPSTICK_2_3','PROTEIN_SCREEN_LAB_ONLY','PROTEIN_QUANTIFIED_LOW'];
for(const dip of ['negative','1+','2+','3+','4+'])for(const ctx of [undefined,'first_screen','next_dose','after_hold']){
 const x={proteinuria_dipstick:dip,...(ctx?{proteinuria_assessment_context:ctx}:{})};
 const want=dip==='4+'?{action:'withhold',yes:['PROTEIN_DIPSTICK_4']} :ctx!=='first_screen'?{action:'consultant_review',yes:['PROTEIN_CONTEXT_REQUIRED'],no:permissive}:['negative','1+'].includes(dip)?{action:'proceed_with_caution',yes:['PROTEIN_LOW_SCREEN']}:{action:'proceed_with_caution',yes:['PROTEIN_DIPSTICK_2_3']};
 test('Dipstick and testing sequence '+dip+'/'+ctx,x,want,'NCCP p4 Table 2');
}
for(const n of [0,.9999,1,1.0001,2,4,4.01])for(const ctx of ['first_screen','next_dose'])test('g/L concentration is screening only '+n+'/'+ctx,{urine_protein_concentration_g_l:n,proteinuria_assessment_context:ctx},ctx==='next_dose'?{action:'consultant_review',yes:['PROTEIN_CONTEXT_REQUIRED'],no:permissive}:{action:'proceed_with_caution',yes:[n<1?'PROTEIN_LOW_SCREEN':'PROTEIN_SCREEN_LAB_ONLY'],no:['PROTEIN_2_TO_4','PROTEIN_OVER_4']},'NCCP p4 Table 2: distinct units');
for(const q of [0,1.9999,2,2.0001,3.99,4,4.0001,10])for(const validity of [undefined,false,true]){
 const x={urine_protein_g_24h:q,prior_bevacizumab_stop_reason:'none',...(validity===undefined?{}:{urine_collection_valid_and_current:validity})};
 const want=q>4?{action:'discontinue',yes:['PROTEIN_OVER_4'],no:['PROTEIN_QUANTIFIED_LOW','PROTEIN_2_TO_4']}:q>2?{action:'withhold',yes:['PROTEIN_2_TO_4'],no:['PROTEIN_QUANTIFIED_LOW','PROTEIN_OVER_4']}:validity===true?{action:'proceed_with_caution',yes:['PROTEIN_QUANTIFIED_LOW'],no:['PROTEIN_VALIDITY_REVIEW']}:{action:'consultant_review',yes:['PROTEIN_VALIDITY_REVIEW'],no:['PROTEIN_QUANTIFIED_LOW']};
 test('Quantified protein boundaries and validity '+q+'/'+validity,x,want,'NCCP p4 Table 2');
}
for(const n of [0,2.99,3,3.001,4])test('Required collection timing '+n,{proteinuria_assessment_context:'next_dose',urine_protein_g_24h:2,urine_collection_valid_and_current:true,prior_bevacizumab_stop_reason:'none',days_from_collection_to_next_dose:n},n>3?{action:'consultant_review',yes:['PROTEIN_COLLECTION_STALE'],no:['PROTEIN_QUANTIFIED_LOW']}:{action:'proceed_with_caution',yes:['PROTEIN_QUANTIFIED_LOW'],no:['PROTEIN_COLLECTION_STALE']},'NCCP p4 Table 2');
for(const q of [1,2,2.01,4,4.01])test('Known quantified result supersedes initial screen '+q,{proteinuria_dipstick:'2+',proteinuria_assessment_context:'first_screen',urine_protein_g_24h:q,urine_collection_valid_and_current:true,prior_bevacizumab_stop_reason:'none'},{action:q>4?'discontinue':q>2?'withhold':'proceed_with_caution',no:['PROTEIN_DIPSTICK_2_3']},'NCCP p4 Table 2');
for(const dip of ['negative','1+','2+','3+','4+'])test('Higher known protein cannot be cleared by dip '+dip,{proteinuria_dipstick:dip,urine_protein_g_24h:4.01,urine_collection_valid_and_current:true,prior_bevacizumab_stop_reason:'none',proteinuria_assessment_context:'first_screen'},{action:'discontinue',yes:['PROTEIN_OVER_4'],no:['PROTEIN_QUANTIFIED_LOW']});
test('Conflicting 4+ and lower quantitative value needs sequence confirmation',{proteinuria_dipstick:'4+',urine_protein_g_24h:1,urine_collection_valid_and_current:true,prior_bevacizumab_stop_reason:'none'},{action:'withhold',yes:['PROTEIN_DIPSTICK_4']});
test('No prior stop answer cannot imply none',{urine_protein_g_24h:1,urine_collection_valid_and_current:true},{no:['PROTEIN_QUANTIFIED_LOW']});
for(const g of [0,1,2,3,4]){
 test('Fistula severity '+g,{fistula_grade:g},g===4?{action:'permanently_discontinue',yes:['GRADE4_FISTULA']}:g>0?{action:'consultant_review',yes:['OTHER_FISTULA_REVIEW']}:{no:['GRADE4_FISTULA','OTHER_FISTULA_REVIEW']},'EMA p6');
 test('TE fistula independent of grade '+g,{fistula_grade:g,tracheoesophageal_fistula:true},{action:'permanently_discontinue',yes:['TE_FISTULA']},'EMA p6');
 test('VTE severity '+g,{thromboembolic_event_grade:g},g===4?{action:'discontinue',yes:['THROMBOEMBOLIC_G4']}:g>0?{action:'consultant_review',yes:['VTE_LOWER_GRADE']}:{no:['THROMBOEMBOLIC_G4','VTE_LOWER_GRADE']},'NCCP p4; EMA p7');
 test('Arterial event independent of VTE grade '+g,{thromboembolic_event_grade:g,arterial_thromboembolic_event:true},{action:'permanently_discontinue',yes:['ARTERIAL_THROMBOEMBOLIC_EVENT']},'EMA p7');
 test('Bleeding severity '+g,{haemorrhage_grade:g},g>=3?{action:'permanently_discontinue',yes:['HAEMORRHAGE_G3PLUS']}:g>0?{action:'consultant_review',yes:['HAEMORRHAGE_LOWER_GRADE']}:{no:['HAEMORRHAGE_G3PLUS','HAEMORRHAGE_LOWER_GRADE']},'EMA p7');
 test('Intracranial bleeding independent of generic grade '+g,{haemorrhage_grade:g,current_intracranial_bleeding:true},{action:g>=3?'permanently_discontinue':'discontinue',yes:['INTRACRANIAL_BLEEDING']},'EMA p7');
}
for(const n of [0,2.4999,2.5,2.5001,3])test('Haemoptysis exact threshold '+n,{recent_haemoptysis_red_blood_ml:n},n>2.5?{action:'withhold',yes:['HAEMOPTYSIS']}:{no:['HAEMOPTYSIS']},'EMA p7');
const permanent=['nephrotic','gi_perforation','arterial_event','te_or_g4_fistula','g3_4_bleed','uncontrollable_htn','hypertensive_crisis'];
const discontinuations=['protein_over4','persistent_g3_htn','g4_htn','g4_vte','pres','necrotising_fasciitis','g4_proteinuria','intracranial_bleeding'];
for(const reason of [...permanent,...discontinuations])for(const q of [0,2])test('Previous stop survives improvement '+reason+'/'+q,{prior_bevacizumab_stop_reason:reason,urine_protein_g_24h:q,urine_collection_valid_and_current:true,hypertension_grade:0,proteinuria_dipstick:'negative',proteinuria_assessment_context:'first_screen'}, {action:permanent.includes(reason)?'permanently_discontinue':'discontinue',yes:[permanent.includes(reason)?'PREVIOUS_PERMANENT_STOP':'PREVIOUS_DISCONTINUATION'],no:['PROTEIN_QUANTIFIED_LOW']},'NCCP p4 and EMA pp5–7: history');
for(const [f,id,action,citation]of booleanCases.filter(x=>['withhold','discontinue','permanently_discontinue','contraindicated'].includes(x[2])))test('Protein pass cannot override '+f,{urine_protein_g_24h:1,urine_collection_valid_and_current:true,prior_bevacizumab_stop_reason:'none',[f]:true},{action,yes:[id]},citation);
for(const [f,vals]of [['urine_protein_g_24h',[-1,'Infinity','NaN',{},[]]],['urine_protein_concentration_g_l',[-1,'Infinity',{},[]]],['systolic_bp',[-1,301,{},[]]],['diastolic_bp',[-1,201,{},[]]],['hypertension_grade',[-1,5,{},[]]],['proteinuria_dipstick',['wrong',{},[]]],['days_since_major_surgery',[-1,'Infinity',{},[]]],['prior_bevacizumab_stop_reason',['wrong',{},[]]]])for(const value of vals)inv('Invalid input '+f+'/'+JSON.stringify(value),()=>{const a=E.assess(p,{[f]:value});assert(a.invalid.length);assert(!D.buildModificationModel(p,a).hasQuantified)},'Input validation');
inv('Schema including all decision inputs',()=>{const v=V.validate(p);assert.deepEqual(v.errors,[]);assert.deepEqual(v.warnings,[])});
inv('Source SHA matches retained current PDF',()=>assert.equal(p.metadata.source_pdf_sha256,crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'sources/00813-nccp.pdf'))).digest('hex')));
inv('Structured q14 Day 1 schedule without fixed cycle count',()=>{const m=D.buildModel(p);assert.equal(m.phases.length,1);assert.equal(m.phases[0].cycleLength,14);assert.equal(m.phases[0].cycles,null);assert.equal(m.phases[0].components.length,1);assert.equal(p.treatment.components[0].dose,'5 mg/kg');assert.deepEqual(p.treatment.components[0].days,[1]);assert.deepEqual(m.doseLevels,[]);assert.match(p.treatment.components[0].note,/90 minutes/);assert.match(p.treatment.components[0].note,/60 minutes/);assert.match(p.treatment.components[0].note,/30 minutes/)});
inv('Independent approvals remain pending',()=>{assert.equal(p.metadata.validation.clinical_use_authorised,false);assert.equal(p.metadata.validation.consultant_reviewed,false);assert.equal(p.metadata.validation.oncology_pharmacy_reviewed,false)});
inv('Minimal emetogenic risk and no routine premedication retained',()=>{assert.equal(p.supportive_care.emetogenic_risk,'minimal');assert.match(p.supportive_care.mapping_basis,/no routine premedication/)});
inv('Grading version not silently converted',()=>{for(const f of ['hypertension_grade','fistula_grade','thromboembolic_event_grade','haemorrhage_grade']){assert(!p.input_definitions[f].ctcae_version);assert.match(p.input_definitions[f].grading_source_label,/NCI-CTCAE v3/);assert(p.input_definitions[f].source_grading_note)}});
inv('Monitoring and renal/hepatic advice remains specific',()=>{assert.match(p.rule_engine.rules.find(r=>r.id==='MONITORING_MISSING').action.message,/AND after treatment/);assert.match(p.rule_engine.rules.find(r=>r.id==='WARFARIN_MONITORING').action.message,/weekly until/);assert.match(p.rule_engine.rules.find(r=>r.id==='CARDIOVASCULAR_CAUTION').action.message,/does not make echocardiography mandatory/)});
for(const f of ['hypertension_grade','fistula_grade','thromboembolic_event_grade','haemorrhage_grade'])inv('Rendered source grade guide '+f,()=>{const G=require(path.join(engineRoot,'js/ctcae-descriptors'));const g=G.guide(p.input_definitions[f]);assert.equal(g.sourceSpecific,true);assert.equal(g.calculable,false);assert.match(g.sourceLabel,/NCI-CTCAE v3/);assert.equal(g.sourceUrl,p.metadata.source_url)},'Source-specific clinical grading UI');
const matrix=cur.rule_engine.rules.map(r=>({code:'00813',rule_id:r.id,source:r.source,cases:cases.filter(c=>c.pass&&c.rules.includes(r.id)).map(c=>c.name)}));
if(!beforeMode)for(const row of matrix)inv('Executed source criterion '+row.rule_id,()=>{assert(row.cases.length,'No positive witness');assert(row.source.url&&row.source.sha256&&row.source.page);assert(cur.rule_engine.rules.find(r=>r.id===row.rule_id).action.block_numeric_dose)});
const report={release:'0.84.39',mode:beforeMode?'before':'current',protocols:['00813'],passed:cases.filter(c=>c.pass).length,failed:cases.filter(c=>!c.pass).length,total:cases.length,clinical_use_authorised:false,cases};
fs.writeFileSync(path.join(__dirname,beforeMode?'source-case-before-results.json':'source-case-results.json'),JSON.stringify(report,null,2)+'\n');
if(!beforeMode)fs.writeFileSync(path.join(__dirname,'criterion-matrix.json'),JSON.stringify(matrix,null,2)+'\n');
console.log(JSON.stringify({mode:report.mode,total:report.total,passed:report.passed,failed:report.failed,failures:cases.filter(c=>!c.pass).map(c=>({name:c.name,error:c.error}))},null,2));if(report.failed)process.exitCode=1;
