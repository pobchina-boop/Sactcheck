'use strict';
// Expected clinical decisions are derived from archived NCCP Tables 1–3 and source prose,
// not generated from rule predicates. --baseline runs the same cases on unchanged snapshots.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..'),E=require(path.join(root,'js/assessment-engine')),D=require(path.join(root,'js/protocol-dose-schedule'));
const baseline=process.argv.includes('--baseline'),manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'sources.json'))),P={};
for(const s of manifest)if(s.code)P[s.code]=JSON.parse(fs.readFileSync(baseline?path.join(__dirname,s.code+'-before.json'):path.join(root,s.protocol_path)));
const results=[],coverage={};
function test(c,name,fn){try{fn();results.push({protocol:c,name,passed:true});}catch(e){results.push({protocol:c,name,passed:false,error:e.message});}}
function run(c,input){const r=E.assess(P[c],input);coverage[c]??=new Set();for(const f of r.findings)coverage[c].add(f.ruleId);return r;}
function yes(c,name,input,id,type){test(c,name,()=>{const r=run(c,input),f=r.findings.find(f=>f.ruleId===id);assert(f,'Missing '+id);if(type)assert.equal(f.action.type,type);assert.deepEqual(f.action.components,['bevacizumab']);assert.equal(r.complete,false,'Partial test must not become overall clearance');});}
function no(c,name,input,ids){test(c,name,()=>{const r=run(c,input);for(const id of ids)assert(!r.findings.some(f=>f.ruleId===id),'Unexpected '+id);});}
const stops=[['hypertensive_crisis_or_encephalopathy','HYPERTENSIVE_CRISIS_PRES','permanently_discontinue'],['gi_perforation','GI_PERFORATION','permanently_discontinue'],['arterial_thromboembolic_event','ARTERIAL_THROMBOEMBOLIC_EVENT','permanently_discontinue'],['necrotising_fasciitis','NECROTISING_FASCIITIS','discontinue'],['pres_confirmed','PRES','discontinue'],['severe_bp_uncontrolled','SEVERE_UNCONTROLLED_BP','discontinue'],['tracheoesophageal_fistula','TE_FISTULA','discontinue']];
for(const c of Object.keys(P)){
 test(c,'Empty form remains incomplete',()=>{const r=run(c,{});assert.equal(r.complete,false);assert.equal(r.actionType,'incomplete');});
 test(c,'Optional domains are not defaulted normal',()=>{assert.deepEqual(P[c].required_inputs,[]);for(const d of Object.values(P[c].input_definitions))assert.equal(d.required,false);});
 for(const [field,id] of [['hypersensitivity','EXCLUSION_HYPERSENSITIVITY'],['pregnancy','PREGNANCY_REVIEW'],['breastfeeding','BREASTFEEDING']])yes(c,field+' exclusion',{[field]:true},id,'contraindicated');
 for(const n of [0,17.99])yes(c,'Adult eligibility below18 '+n,{age_years:n},'ADULT_INDICATION','consultant_review');
 for(const n of [18,64.99,65])no(c,'No age-based exclusion/caution at '+n,{age_years:n},['ADULT_INDICATION','AGE_OVER65_ATE_CAUTION']);
 for(const n of [65.01,80])yes(c,'ATE caution age strictly >65 '+n,{age_years:n},'AGE_OVER65_ATE_CAUTION','consultant_review');
 for(const n of [0,1,2])no(c,'ECOG within source '+n,{ecog:n},['ECOG_OVER_2']);
 for(const n of [3,4])yes(c,'ECOG outside source '+n,{ecog:n},'ECOG_OVER_2','consultant_review');
 yes(c,'Unconfirmed companion',{indication_partner_confirmed:false},'PARTNER_UNCONFIRMED','consultant_review');
 yes(c,'Partner must be assessed separately',{treatment_context:'combination',partner_sact_assessed_separately:false},'COMBINATION_SCOPE_GAP','consultant_review');
 no(c,'Missing partner assessment not false',{treatment_context:'combination'},['COMBINATION_SCOPE_GAP']);
 yes(c,'High-risk history caution',{high_risk_history:true},'HIGH_RISK_HISTORY','consultant_review');
 yes(c,'Sunitinib MAHA caution',{sunitinib_concurrent:true},'SUNITINIB_INTERACTION','consultant_review');
 yes(c,'EGFR antibody combination must not be administered',{egfr_antibody_with_chemo:true},'EGFR_ANTIBODY_INTERACTION','withhold');
 test(c,'EGFR antibody explicit prohibition survives output',()=>assert.match(run(c,{egfr_antibody_with_chemo:true}).recommendation,/do not administer/i));
 yes(c,'Concurrent radiotherapy evidence gap',{concurrent_radiotherapy:true},'RADIOTHERAPY_REVIEW','consultant_review');
 for(const n of [0,27.99])yes(c,'Major surgery <28 days '+n,{days_since_major_surgery:n},'MAJOR_SURGERY_LT28','withhold');
 for(const n of [28,28.01])no(c,'Major surgery time threshold '+n,{days_since_major_surgery:n},['MAJOR_SURGERY_LT28']);
 yes(c,'Day28 still hold if unhealed',{days_since_major_surgery:28,wound_fully_healed:false},'WOUND_NOT_HEALED','withhold');
 no(c,'Day28 healed no surgery hold',{days_since_major_surgery:28,wound_fully_healed:true},['MAJOR_SURGERY_LT28','WOUND_NOT_HEALED']);
 for(const [field,id]of [['recent_major_surgery_or_unhealed_wound','UNHEALED_WOUND_OR_RECENT_SURGERY'],['planned_major_surgery','PLANNED_MAJOR_SURGERY'],['planned_minor_surgery','PLANNED_MINOR_SURGERY'],['uncontrolled_or_symptomatic_hypertension','UNCONTROLLED_HYPERTENSION']])yes(c,field+' hold',{[field]:true},id,'withhold');
 for(const n of [0,1])no(c,'Hypertension low grade '+n,{hypertension_grade:n},['G2_G3_BP_REVIEW','G4_HYPERTENSION','PERSISTENT_G3_HYPERTENSION']);
 for(const n of [2,3])yes(c,'Hypertension grade'+n+' management review',{hypertension_grade:n},'G2_G3_BP_REVIEW','consultant_review');
 yes(c,'Persistent grade3 hypertension stops',{hypertension_grade:3,hypertension_persisting:true},'PERSISTENT_G3_HYPERTENSION','discontinue');
 no(c,'Persistence without grade not assumed grade3',{hypertension_persisting:true},['PERSISTENT_G3_HYPERTENSION']);
 yes(c,'Grade4 hypertension stops',{hypertension_grade:4},'G4_HYPERTENSION','discontinue');
 for(const x of [{systolic_bp_mmhg:151},{diastolic_bp_mmhg:101},{systolic_bp_mmhg:201,diastolic_bp_mmhg:111}]){
  yes(c,'Numeric BP requires context '+JSON.stringify(x),x,'BP_NUMERIC_REVIEW','consultant_review');
  no(c,'Numeric BP alone not automatic stop '+JSON.stringify(x),x,['SEVERE_UNCONTROLLED_BP','UNCONTROLLED_HYPERTENSION']);
 }
 no(c,'Exact150/100 not strictly greater',{systolic_bp_mmhg:150,diastolic_bp_mmhg:100},['BP_NUMERIC_REVIEW']);
 for(const x of ['2+','3+'])yes(c,'Dipstick '+x+' scheduled pending quantification',{proteinuria_dipstick:x},'PROTEIN_DIPSTICK_2_3','proceed_with_caution');
 for(const x of [0,.99])no(c,'Spot concentration below1 '+x,{urine_protein_g_l:x},['PROTEIN_LAB_GE1']);
 for(const x of [1,1.01])yes(c,'Spot concentration >=1 '+x,{urine_protein_g_l:x},'PROTEIN_LAB_GE1','proceed_with_caution');
 yes(c,'Dipstick4 hold pending quantification',{proteinuria_dipstick:'4+'},'PROTEIN_DIPSTICK_4','withhold');
 for(const x of [0,1.99,2])yes(c,'24h total <=2 '+x,{urine_protein_g_24h:x},'PROTEIN_LE2','proceed_with_caution');
 for(const x of [2.01,3.99,4])yes(c,'24h total >2 through4 '+x,{urine_protein_g_24h:x},'PROTEIN_2_TO_4','withhold');
 for(const x of [4.01,10])yes(c,'24h total >4 '+x,{urine_protein_g_24h:x},'PROTEIN_OVER_4','discontinue');
 for(const d of ['2+','3+','4+']){
  no(c,'Same-episode quantification supersedes screen '+d,{proteinuria_dipstick:d,urine_protein_g_24h:2},['PROTEIN_DIPSTICK_4','PROTEIN_DIPSTICK_2_3']);
  yes(c,'High quantitative total cannot be cleared by screen '+d,{proteinuria_dipstick:d,urine_protein_g_24h:4.01},'PROTEIN_OVER_4','discontinue');
 }
 for(const x of [-1,'',null,'not a number'])no(c,'Invalid/missing protein not normal '+JSON.stringify(x),{urine_protein_g_24h:x},['PROTEIN_LE2','PROTEIN_2_TO_4','PROTEIN_OVER_4']);
 yes(c,'Grade4 proteinuria stops independently of total',{proteinuria_grade:4,urine_protein_g_24h:1},'PROTEIN_GRADE4','discontinue');
 for(const n of [1,2,3]){
  yes(c,'NonTE fistula grade'+n+' specialist decision',{fistula_grade:n},'OTHER_FISTULA_REVIEW','consultant_review');
  yes(c,'VTE grade'+n+' close monitoring',{thromboembolic_event_grade:n},'THROMBOEMBOLIC_LE3','consultant_review');
 }
 yes(c,'Fistula grade4 stop',{fistula_grade:4},'GRADE4_FISTULA','discontinue');
 yes(c,'VTE grade4 stop',{thromboembolic_event_grade:4},'THROMBOEMBOLIC_G4','discontinue');
 for(const n of [1,2])yes(c,'Haemorrhage low-grade review '+n,{haemorrhage_grade:n},'BLEEDING_LE2','consultant_review');
 for(const n of [3,4])yes(c,'Haemorrhage >=3 stop '+n,{haemorrhage_grade:n},'HAEMORRHAGE_G3PLUS','discontinue');
 for(const [f,id,t]of stops)yes(c,f+' source stop',{[f]:true},id,t);
 for(const [f,id,t] of [['nephrotic_syndrome','NEPHROTIC_SYNDROME','permanently_discontinue'],['recent_haemoptysis_over_2_5_ml','RECENT_HAEMOPTYSIS','contraindicated'],['severe_infusion_reaction','SEVERE_INFUSION_REACTION','withhold']])yes(c,'Retained supplementary safeguard '+f,{[f]:true},id,t);
 yes(c,'FBC concern is review not invented hold',{fbc_clinical_concern:true},'FBC_REVIEW_ONLY','consultant_review');
 yes(c,'Organ concern not invented dose',{renal_or_hepatic_clinical_concern:true},'ORGAN_FUNCTION_REVIEW','consultant_review');
 test(c,'Protein hold is bevacizumab-only and not a dose percentage',()=>{const r=run(c,{urine_protein_g_24h:3});const m=D.buildModificationModel(P[c],r);assert(!m.rows.some(x=>x.quantified));assert.equal(r.actionType,'withhold');});
 test(c,'Permanent stop dominates reassuring protein result',()=>assert.equal(run(c,{urine_protein_g_24h:1,gi_perforation:true}).actionType,'permanently_discontinue'));
 test(c,'No anticancer partner component dose invented',()=>{for(const r of P[c].rule_engine.rules)assert.deepEqual(r.action.components,['bevacizumab']);});
 test(c,'Baseline tests and INR conditional, not mandatory serial scans',()=>{const m=JSON.stringify(P[c].monitoring_schedule||P[c].monitoring);assert.match(m,/weekly.*stable/i);assert.match(m,/ECHO/i);assert.match(m,/treatment plan|consultant plan/i);});
}
for(const c of ['00214','00215'])for(const [f,cut,op,id]of [['anc',1.2,'<','ANC_INITIAL'],['platelets',100,'<=','PLATELETS_INITIAL'],['creatinine_uln',1.5,'>','CREATININE_INITIAL'],['bilirubin',26,'>','BILIRUBIN_INITIAL'],['ast_uln',5,'>','AST_INITIAL'],['alp_uln',5,'>','ALP_INITIAL']]){
 for(const v of [cut-.01,cut,cut+.01])for(const phase of ['pre_treatment','ongoing']){
  const bad=op==='<'?v<cut:op==='<='?v<=cut:v>cut;
  if(bad)yes(c,f+' '+v+' '+phase+' eligibility review',{[f]:v,assessment_type:phase},id,'consultant_review');else no(c,f+' '+v+' '+phase+' equality preserved',{[f]:v,assessment_type:phase},[id]);
 }
}
yes('00212','Dialysis currentv7 no automatic adjustment',{haemodialysis:true},'HAEMODIALYSIS_REVIEW','consultant_review');
test('00212','No numeric eligibility imported from older q21 documents',()=>{for(const id of ['ANC_INITIAL','PLATELETS_INITIAL','CREATININE_INITIAL','BILIRUBIN_INITIAL','AST_INITIAL','ALP_INITIAL'])assert(!P['00212'].rule_engine.rules.some(r=>r.rule_id===id));});
for(const c of ['00212','00215']){
 yes(c,'Breast HER2 restriction retained',{indication_id:'metastatic_breast',breast_her2_negative:false},'BREAST_HER2_SCOPE','consultant_review');
 yes(c,'Breast first-line restriction retained',{indication_id:'metastatic_breast',first_line_metastatic:false},'FIRST_LINE_SCOPE','consultant_review');
 no(c,'CRC not restricted to breast first-line/HER2',{indication_id:'metastatic_colorectal',breast_her2_negative:false,first_line_metastatic:false},['BREAST_HER2_SCOPE','FIRST_LINE_SCOPE','OVARIAN_CYCLE1','OVARIAN_CYCLE_LIMIT','OVARIAN_DURATION_LIMIT','NSCLC_COMBINATION_LIMIT','OVARIAN_COMBINATION_LIMIT']);
 yes(c,'Monotherapy context explicit review',{treatment_context:'bevacizumab_only'},'MONOTHERAPY_SCOPE','consultant_review');
 for(const n of [1,2])no(c,'Platinum-resistant prior regimens <=2 '+n,{indication_id:'platinum_resistant_ovarian',prior_chemotherapy_regimens:n},['OVARIAN_PRIOR_LINES']);
 yes(c,'Platinum-resistant >2prior regimens',{indication_id:'platinum_resistant_ovarian',prior_chemotherapy_regimens:3},'OVARIAN_PRIOR_LINES','consultant_review');
 yes(c,'Platinum-resistant priorVEGF excluded',{indication_id:'platinum_resistant_ovarian',prior_vegf_therapy:true},'OVARIAN_PRIOR_VEGF','consultant_review');
}
yes('00214','NSCLC histology retained',{indication_id:'00214b',nsclc_nonsquamous:false},'NSCLC_HISTOLOGY','consultant_review');
yes('00214','NSCLC first-line retained',{indication_id:'00214b',first_line_metastatic:false},'NSCLC_FIRST_LINE','consultant_review');
yes('00214','Continuation scope retained',{treatment_context:'bevacizumab_only'},'CONTINUATION_SCOPE','consultant_review');
no('00214','CRC does not inherit lung six-cycle limit',{indication_id:'00214a',treatment_context:'combination',cycle_number:7,first_line_metastatic:false,nsclc_nonsquamous:false},['NSCLC_COMBINATION_LIMIT','NSCLC_FIRST_LINE','NSCLC_HISTOLOGY']);
for(const [c,ind,id]of [['00214','00214b','NSCLC_COMBINATION_LIMIT'],['00215','nonsquamous_nsclc_platinum','NSCLC_COMBINATION_LIMIT'],['00215','ovarian_frontline_or_continuation','OVARIAN_COMBINATION_LIMIT']]){
 no(c,ind+' cycle6 combination boundary',{indication_id:ind,treatment_context:'combination',cycle_number:6},[id]);
 yes(c,ind+' cycle7 combination review',{indication_id:ind,treatment_context:'combination',cycle_number:7},id,'consultant_review');
 no(c,ind+' cycle7 permitted continuation not combination',{indication_id:ind,treatment_context:'bevacizumab_only',cycle_number:7},[id]);
}
yes('00215','NSCLC histology retained',{indication_id:'nonsquamous_nsclc_platinum',nsclc_nonsquamous:false},'NSCLC_HISTOLOGY','consultant_review');
yes('00215','Erlotinib requires validated EGFR mutation',{indication_id:'egfr_mutant_nsclc_erlotinib',egfr_activating_mutation:false},'NSCLC_EGFR','consultant_review');
no('00215','Erlotinib not subject to platinum six-cycle limit',{indication_id:'egfr_mutant_nsclc_erlotinib',treatment_context:'combination',cycle_number:7},['NSCLC_COMBINATION_LIMIT']);
yes('00215','Frontline ovarian cycle1 bevacizumab omitted',{indication_id:'ovarian_frontline_or_continuation',cycle_number:1},'OVARIAN_CYCLE1','omit');
no('00215','Frontline ovarian cycle2 is start',{indication_id:'ovarian_frontline_or_continuation',cycle_number:2},['OVARIAN_CYCLE1']);
for(const n of [14.99,15,15.01]){const x={indication_id:'ovarian_frontline_or_continuation',ovarian_months_on_treatment:n};if(n>=15)yes('00215','Ovarian15-month maximum '+n,x,'OVARIAN_DURATION_LIMIT','withhold');else no('00215','Ovarian below15months',x,['OVARIAN_DURATION_LIMIT']);}
for(const n of [22,23]){const x={indication_id:'ovarian_frontline_or_continuation',cycle_number:n};if(n>22)yes('00215','Ovarian >22cycles',x,'OVARIAN_CYCLE_LIMIT','withhold');else no('00215','Ovarian cycle22 not23',x,['OVARIAN_CYCLE_LIMIT']);}
const failed=results.filter(x=>!x.passed),out={release:'0.84.34',source_checked_date:'2026-11-05',baseline_comparison:baseline,total:results.length,passed:results.length-failed.length,failed:failed.length,coverage:Object.fromEntries(Object.keys(P).map(c=>[c,{rules:P[c].rule_engine.rules.length,exercised:[...coverage[c]],unexercised:P[c].rule_engine.rules.map(r=>r.rule_id).filter(id=>!coverage[c].has(id))}])),cases:results};
fs.writeFileSync(path.join(__dirname,baseline?'source-case-results-baseline.json':'source-case-results.json'),JSON.stringify(out,null,2)+'\n');
for(const f of failed)console.error('FAIL '+f.protocol+' '+f.name+': '+f.error);
console.log(`Bevacizumab source audit: ${out.passed}/${out.total} passed; ${out.failed} failed${baseline?' (before snapshots)':''}.`);if(failed.length)process.exitCode=1;
