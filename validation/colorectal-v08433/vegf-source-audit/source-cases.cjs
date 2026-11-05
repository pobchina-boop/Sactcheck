'use strict';
// Acceptance cases independently derived from the archived NCCP PDFs/pages in this folder.
// Default verifies current implementation and exits nonzero on any failure.
// --baseline compares the identical cases against the before snapshots; failure is expected.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..'),E=require(path.join(root,'js/assessment-engine')),D=require(path.join(root,'js/protocol-dose-schedule'));
const baseline=process.argv.includes('--baseline'),P={};
for(const c of ['00238','00791'])P[c]=JSON.parse(fs.readFileSync(baseline?path.join(__dirname,c+'-existing.json'):path.join(root,'protocols/gastrointestinal',fs.readdirSync(path.join(root,'protocols/gastrointestinal')).find(x=>x.startsWith(c+'-')))));
const results=[];
function test(name,fn){try{fn();results.push({name,passed:true});}catch(e){results.push({name,passed:false,error:e.message});}}
function assess(c,input,type,ids=[]){const r=E.assess(P[c],input);if(type)assert.equal(r.actionType,type,`${c} ${JSON.stringify(input)}: ${r.recommendation}`);for(const id of ids)assert(r.findings.some(x=>x.ruleId===id),`${c}: missing ${id}`);return r;}
function chk(c,name,input,type,ids=[]){test(c+' '+name,()=>assess(c,input,type,ids));}
function no(c,name,input,ids){test(c+' '+name,()=>{const r=assess(c,input);for(const id of ids)assert(!r.findings.some(x=>x.ruleId===id),`Unexpected ${id}`);});}
function only(c,name,input,id,components){test(c+' '+name,()=>{const r=assess(c,input);assert.deepEqual(r.findings.find(x=>x.ruleId===id).action.components,components);});}
function unquant(c,name,input){test(c+' '+name,()=>{const r=assess(c,input),m=D.buildModificationModel(P[c],r);assert(m.rows.length);assert(m.rows.every(x=>!x.quantified),JSON.stringify(m.rows));});}
for(const c of ['00238','00791']){
 test(c+' blank input is incomplete',()=>{const x=assess(c,{});assert.equal(x.complete,false);assert(!['proceed','proceed_with_caution'].includes(x.actionType));});
 chk(c,'complete DPD',{dpd_status:'complete'},'contraindicated',['DPD_COMPLETE']);
 chk(c,'partial DPD',{dpd_status:'partial'},'consultant_review',['DPD_PARTIAL']);
 chk(c,'unknown DPD',{dpd_status:'unknown'},'consultant_review',['DPD_UNKNOWN']);
 chk(c,'missing baseline DPD',{assessment_type:'baseline'},'consultant_review',['DPD_BASELINE_MISSING']);
 for(const f of ['hypersensitivity','pregnancy','breastfeeding'])chk(c,f+' exclusion',{[f]:true},'contraindicated',['EXCLUDE_'+f.toUpperCase()]);
 chk(c,'ECOG3',{ecog:3},'consultant_review',['ECOG_REVIEW']);
 test(c+' partial inputs remain optional',()=>{assert.deepEqual(P[c].required_inputs,[]);for(const d of Object.values(P[c].input_definitions))assert.equal(d.required,false);});
 test(c+' independent validation not claimed',()=>{for(const f of ['consultant_reviewed','oncology_pharmacy_reviewed','clinical_use_authorised'])assert.equal(P[c].metadata.validation[f],false);});
 test(c+' all sources local to correct regimen',()=>{for(const r of P[c].rule_engine.rules){assert.equal(r.source.url,P[c].metadata.source_url);assert(r.source.page>=1&&r.source.page<=P[c].metadata.source_document_pages);}});
}
for(const n of [0,.49,.5,.99,1,1.49])chk('00238','ANC independent hold '+n,{anc_x10e9_l:n},'withhold',['ANC_DAY1_HOLD']);
for(const n of [1.5,1.51,2])no('00238','ANC recovery boundary '+n,{anc_x10e9_l:n},['ANC_DAY1_HOLD']);
for(const n of [0,10,50,74.9])chk('00238','platelets independent hold '+n,{platelets_x10e9_l:n},'withhold',['PLT_DAY1_HOLD']);
for(const n of [75,75.1,100])no('00238','platelet recovery boundary '+n,{platelets_x10e9_l:n},['PLT_DAY1_HOLD']);
for(const weeks of [2,4,8])chk('00238','no borrowed time-stop '+weeks,{anc_x10e9_l:1,toxicity_delay_weeks:weeks},'withhold',['ANC_DAY1_HOLD']);
test('00238 no borrowed levels',()=>assert.equal(P['00238'].dose_levels,undefined));
for(const v of [84.9,85,85.1])chk('00238','bilirubin boundary '+v,{bilirubin_umol_l:v},v>85?'contraindicated':'consultant_review',[v>85?'FU_HEPATIC_ABSOLUTE':v===85?'FU_HEPATIC_BOUNDARY':'FU_HEPATIC_PARTIAL']);
for(const v of [179.9,180,180.1])chk('00238','AST boundary '+v,{ast_u_l:v},v>180?'contraindicated':'consultant_review',[v>180?'FU_HEPATIC_ABSOLUTE':v===180?'FU_HEPATIC_BOUNDARY':'FU_HEPATIC_PARTIAL']);
no('00238','paired liver values below thresholds',{bilirubin_umol_l:84.9,ast_u_l:179.9},['FU_HEPATIC_ABSOLUTE','FU_HEPATIC_BOUNDARY','FU_HEPATIC_PARTIAL']);
no('00238','irinotecan bilirubin equals3',{bilirubin_ratio_uln:3},['IRINOTECAN_BILIRUBIN']);
chk('00238','irinotecan bilirubin above3',{bilirubin_ratio_uln:3.01},'contraindicated',['IRINOTECAN_BILIRUBIN']);
for(const x of [{crcl_ml_min:'renal_0_9'},{haemodialysis:true},{crcl_ml_min:'dialysis'}]){chk('00238','renal source conflict '+JSON.stringify(x),x,'consultant_review',['IRINOTECAN_RENAL_RANGE']);unquant('00238','renal range not quantified '+JSON.stringify(x),x);}
chk('00238','renal exclusion conflict',{renal_impairment:true},'consultant_review',['RENAL_EXCLUSION_CONFLICT']);
for(const severity of ['moderate','severe']){chk('00238','hepatic severity '+severity,{hepatic_impairment_severity:severity},'consultant_review',['FU_HEPATIC_'+severity.toUpperCase()]);unquant('00238','hepatic history not assumed '+severity,{hepatic_impairment_severity:severity});}
for(const n of [1,2,3,4]){chk('00238','FN occurrence '+n,{febrile_neutropenia_occurrence:n},'consultant_review',[n===1?'FN_FIRST':n===2?'FN_SECOND':'FN_THIRD_OR_LATER','FN_RECOVERY_UNCONFIRMED','DOSE_HISTORY_MISSING']);unquant('00238','FN range/history not quantified '+n,{febrile_neutropenia_occurrence:n});}
chk('00238','legacy FN requires occurrence',{grade4_neutropenia_with_grade2_fever:true},'consultant_review',['FN_OCCURRENCE_MISSING']);
chk('00238','active FN hold dominates future change',{febrile_neutropenia_current:true,febrile_neutropenia_occurrence:2},'withhold',['FN_ACTIVE_HOLD','FN_SECOND']);
only('00238','first FN targets irinotecan',{febrile_neutropenia_occurrence:1},'FN_FIRST',['irinotecan']);
only('00238','second FN keeps irinotecan and adds both FU',{febrile_neutropenia_occurrence:2},'FN_SECOND',['irinotecan','fluorouracil_bolus','fluorouracil_infusion']);
for(const n of [1,2]){chk('00238','severe diarrhoea recurrence '+n,{diarrhoea_highest_grade:3,diarrhoea_occurrence:n},'consultant_review',[n===1?'DIARRHOEA_FIRST':'DIARRHOEA_SECOND']);unquant('00238','diarrhoea no midpoint '+n,{diarrhoea_highest_grade:3,diarrhoea_occurrence:n,current_dose_history_confirmed:true,toxicity_recovered:true});}
chk('00238','active severe diarrhoea',{diarrhoea_current_grade:3},'withhold',['DIARRHOEA_SEVERE_CURRENT']);
chk('00238','grade2 not borrowed timed stop',{diarrhoea_current_grade:2,toxicity_delay_weeks:2},'consultant_review',['DIARRHOEA_CURRENT_REVIEW']);
chk('00238','stomatitis20percent needs actual dose',{severe_stomatitis_or_ppe_confirmed:true},'consultant_review',['STOMATITIS_PPE_SEVERE']);
unquant('00238','stomatitis no automatic reference dose',{severe_stomatitis_or_ppe_confirmed:true,current_dose_history_confirmed:true,toxicity_recovered:true});
only('00238','persistent diarrhoea stops FOLFIRI only',{diarrhoea_persists_despite_both_reductions:true},'DIARRHOEA_PERSISTENT_BOTH',['irinotecan','fluorouracil_bolus','fluorouracil_infusion','folinic_acid']);
for(const v of [1.99,2,2.01]){if(v<2)no('00238','protein recovered '+v,{proteinuria_g_24h:v},['AF_PROTEIN_HOLD']);else chk('00238','protein hold '+v,{proteinuria_g_24h:v},'withhold',['AF_PROTEIN_HOLD']);}
chk('00238','second protein recovery',{proteinuria_g_24h:1.9,proteinuria_occurrence:2},'consultant_review',['AF_PROTEIN_REPEAT']);
chk('00238','second protein not recovered',{proteinuria_g_24h:2,proteinuria_occurrence:2},'withhold',['AF_PROTEIN_HOLD']);
chk('00238','protein recurrence missing quantitative recovery',{proteinuria_occurrence:2},'consultant_review',['AF_PROTEIN_RECOVERY_MISSING']);
chk('00238','UPCR must collect',{upcr:1.01},'consultant_review',['AF_UPCR_COLLECTION']);no('00238','UPCR exact1',{upcr:1},['AF_UPCR_COLLECTION']);
chk('00238','HTN initial hold',{hypertension_current:true},'withhold',['AF_HYPERTENSION_HOLD']);
chk('00238','HTN recurrence unknown control',{recurrent_significant_hypertension:true},'withhold',['AF_HYPERTENSION_RECOVERY_MISSING']);
chk('00238','HTN recurrence controlled',{recurrent_significant_hypertension:true,hypertension_controlled:true},'consultant_review',['AF_HYPERTENSION_REPEAT']);
for(const f of ['uncontrolled_hypertension','hypertensive_crisis_or_encephalopathy','active_severe_bleeding','gi_perforation_or_fistula','arterial_thromboembolic_event','grade4_venous_thromboembolism','nephrotic_syndrome_or_tma','wound_healing_requires_intervention','pres']){
 chk('00238','aflibercept stop '+f,{[f]:true},'discontinue',['AF_STOP_'+f.toUpperCase()]);only('00238','component scope '+f,{[f]:true},'AF_STOP_'+f.toUpperCase(),['aflibercept']);}
chk('00238','mild infusion reaction',{infusion_reaction_severity:'mild_moderate'},'withhold',['AF_INFUSION_MILD_MODERATE']);
only('00238','severe reaction stops whole combination',{infusion_reaction_severity:'severe'},'AF_INFUSION_SEVERE',['whole_regimen']);
chk('00238','preoperative hold',{elective_surgery_within_4_weeks:true},'withhold',['AF_SURGERY_PREOP']);
test('00238 moderate emetic risk',()=>assert.equal(P['00238'].supportive_care.emetogenic_risk,'moderate'));
// 00791: current regimen-specific source differs from 00238 at exactly2 g/day and in liver recommendations.
for(const x of [0,.49,.5,.99])chk('00791','ANC hold '+x,{anc_x10e9_l:x},'withhold',['ANC_DAY1_HOLD']);
for(const x of [1,1.49,1.5])no('00791','ANC boundary '+x,{anc_x10e9_l:x},['ANC_DAY1_HOLD']);
for(const x of [0,10,50,74.9])chk('00791','platelets hold '+x,{platelets_x10e9_l:x},'withhold',['PLT_DAY1_HOLD']);
for(const x of [75,75.1])no('00791','platelet boundary '+x,{platelets_x10e9_l:x},['PLT_DAY1_HOLD']);
chk('00791','ANC two-week stop',{anc_x10e9_l:.9,toxicity_delay_weeks:2},'discontinue',['ANC_PERSISTENT']);
chk('00791','platelet two-week hold',{platelets_x10e9_l:74,toxicity_delay_weeks:2},'withhold',['PLT_DAY1_HOLD']);
chk('00791','platelet three-week gap',{platelets_x10e9_l:74,toxicity_delay_weeks:3},'withhold',['PLT_DELAY_SOURCE_GAP']);
chk('00791','platelet four-week stop',{platelets_x10e9_l:74,toxicity_delay_weeks:4},'discontinue',['PLT_PERSISTENT']);
for(const x of [0,9.9,10,49.9,50,74.9])chk('00791','platelet nadir maintain '+x,{lowest_platelets_during_delay_x10e9_l:x},'consultant_review',['PLT_NADIR_MAINTAIN']);
const history={current_fluorouracil_bolus_level:0,current_fluorouracil_infusion_level:0};
for(const n of [.49,.5,.99]){
 const x={lowest_anc_during_delay_x10e9_l:n,anc_x10e9_l:1,platelets_x10e9_l:75,toxicity_delay_weeks:1,...history};
 chk('00791','nadir '+n+' one level',x,'dose_reduce',['LOW_NADIR_ANC']);
 test('00791 nadir '+n+' exact component doses',()=>{const m=D.buildModificationModel(P['00791'],assess('00791',x));assert.match(m.rows.find(x=>x.componentId==='5fu_bolus').protocolDose,/320/);assert.match(m.rows.find(x=>x.componentId==='5fu_infusion').protocolDose,/2000|2,000/);});
}
for(const missing of ['anc_x10e9_l','platelets_x10e9_l','toxicity_delay_weeks','current_fluorouracil_bolus_level','current_fluorouracil_infusion_level']){
 const x={lowest_anc_during_delay_x10e9_l:.5,anc_x10e9_l:1,platelets_x10e9_l:75,toxicity_delay_weeks:1,...history};delete x[missing];chk('00791','missing '+missing,x,'consultant_review');unquant('00791','missing '+missing+' prevents numeric restart',x);
}
for(const severity of ['mild','moderate']){
 chk('00791','hepatic '+severity+' renal none',{fluorouracil_hepatic_impairment:severity,fluorouracil_renal_impairment:'none'},'consultant_review',['FU_HEPATIC_MILD_MODERATE']);
 for(const renal of ['mild','moderate','severe','none_mild_moderate'])chk('00791','combined hepatic '+severity+' renal '+renal,{fluorouracil_hepatic_impairment:severity,fluorouracil_renal_impairment:renal},'consultant_review',['FU_HEPATIC_COMBINED_OR_UNKNOWN']);
 chk('00791','hepatic '+severity+' unknown renal',{fluorouracil_hepatic_impairment:severity},'consultant_review',['FU_HEPATIC_COMBINED_OR_UNKNOWN']);
}
chk('00791','severe hepatic not recommended',{fluorouracil_hepatic_impairment:'severe'},'withhold',['FU_HEPATIC_SEVERE']);
for(const renal of ['mild','moderate','severe']){chk('00791','renal no automatic dose '+renal,{fluorouracil_renal_impairment:renal},'consultant_review',['RENAL_NO_ADJUSTMENT']);unquant('00791','renal dose not reduced '+renal,{fluorouracil_renal_impairment:renal});}
chk('00791','dialysis no expected adjustment',{haemodialysis:true},'consultant_review',['RENAL_NO_ADJUSTMENT']);
for(const x of [{fluorouracil_bilirubin_umol_l:86},{fluorouracil_ast_u_l:181}])chk('00791','no borrowed liver contraindication '+JSON.stringify(x),x,'consultant_review',['HEPATIC_LABS_CONTEXT']);
for(const cur of ['diarrhoea_grade','mucositis_grade']){
 const stem=cur==='diarrhoea_grade'?'DIARRHOEA':'STOMATITIS';
 for(const g of [2,3,4])chk('00791',cur+' independent hold '+g,{[cur]:g},'withhold',[stem+'_HOLD']);
 chk('00791',cur+' two-week persistence',{[cur]:2,toxicity_delay_weeks:2},'discontinue',[stem+'_PERSISTENT']);
}
for(const [cur,high,grade,n,id]of [['diarrhoea_grade','diarrhoea_highest_grade',3,1,'DIARRHOEA_G3_4'],['diarrhoea_grade','diarrhoea_highest_grade',4,1,'DIARRHOEA_G3_4'],['mucositis_grade','stomatitis_highest_grade',3,1,'STOMATITIS_G3'],['mucositis_grade','stomatitis_highest_grade',4,2,'STOMATITIS_G4']]){
 const x={[cur]:1,[high]:grade,toxicity_delay_weeks:1,source_toxicity_grade_confirmed:true,...history};
 chk('00791',id+' with recovery '+grade,x,'dose_reduce',[id]);
 for(const missing of [cur,'toxicity_delay_weeks','source_toxicity_grade_confirmed','current_fluorouracil_bolus_level','current_fluorouracil_infusion_level']){const q={...x};delete q[missing];chk('00791',id+' missing '+missing,q,'consultant_review');unquant('00791',id+' no numeric when missing '+missing,q);}
 test('00791 '+id+' uses actual previous levels',()=>{const q={...x,current_fluorouracil_bolus_level:-1,current_fluorouracil_infusion_level:-1};const m=D.buildModificationModel(P['00791'],assess('00791',q));if(n===1){assert.match(m.rows.find(x=>x.componentId==='5fu_bolus').protocolDose,/240/);assert.match(m.rows.find(x=>x.componentId==='5fu_infusion').protocolDose,/1600|1,600/);}else for(const row of m.rows)assert.equal(row.protocolDose,'Not to be administered');});
 test('00791 '+id+' nonstandard history blocks calculation',()=>{const q={...x,nonstandard_fluorouracil_dose:true};const r=assess('00791',q,'consultant_review');assert(D.buildModificationModel(P['00791'],r).rows.every(x=>!x.quantified));});
}
for(const v of [0,1.99,2])chk('00791','protein ≤2 '+v,{proteinuria_g_24h:v},'consultant_review',['BEV_PROTEIN_LE2']);
for(const v of [2.01,3,4])chk('00791','protein hold '+v,{proteinuria_g_24h:v},'withhold',['BEV_PROTEIN_GT2_TO4']);
for(const v of [4.01,10])chk('00791','protein stop '+v,{proteinuria_g_24h:v},'discontinue',['BEV_PROTEIN_GT4']);
for(const v of ['2+','3+'])chk('00791','dipstick '+v+' collection without automatic hold',{urine_protein_dipstick:v},'consultant_review',['BEV_DIPSTICK2_3']);
chk('00791','dipstick4 hold',{urine_protein_dipstick:'4+'},'withhold',['BEV_DIPSTICK4']);
chk('00791','protein concentration1 collection',{urine_protein_g_l:1},'consultant_review',['BEV_DIPSTICK2_3']);
chk('00791','quantitative stop overrides dipstick collection',{urine_protein_dipstick:'2+',proteinuria_g_24h:4.1},'discontinue',['BEV_PROTEIN_GT4','BEV_DIPSTICK2_3']);
chk('00791','protein grade4 stop',{proteinuria_grade:4},'discontinue',['BEV_PROTEIN_G4']);
chk('00791','HTN explicit day1 hold',{uncontrolled_or_symptomatic_hypertension:true},'withhold',['BEV_HTN_DAY1']);
for(const grade of [2,3])chk('00791','HTN grade'+grade+' consider interruption',{hypertension_grade:grade},'consultant_review',['BEV_HTN_G2_3']);
for(const q of [{hypertension_grade:4},{persistent_grade3_hypertension:true}])chk('00791','HTN stop '+JSON.stringify(q),q,'discontinue',['BEV_HTN_STOP']);
for(const q of [{systolic_bp_mmhg:151},{diastolic_bp_mmhg:101},{systolic_bp_mmhg:160,diastolic_bp_mmhg:90,bp_sustained_on_antihypertensives:true}])chk('00791','numeric BP needs clinical context '+JSON.stringify(q),q,'consultant_review',['BEV_BP_CONTEXT']);
for(const f of ['gi_perforation','te_or_grade4_fistula','grade4_thromboembolism']){chk('00791','specific stop '+f,{[f]:true},'discontinue',['BEV_STOP_'+f.toUpperCase()]);only('00791','specific stop component '+f,{[f]:true},'BEV_STOP_'+f.toUpperCase(),['bevacizumab']);}
for(const v of [3,4])chk('00791','haemorrhage stop '+v,{haemorrhage_grade:v},'discontinue',['BEV_HAEMORRHAGE_G3_4']);
for(const f of ['gi_perforation_or_fistula','major_bleeding_or_recent_thrombosis','recent_or_planned_major_surgery'])chk('00791','broad legacy field requires specificity '+f,{[f]:true},'consultant_review',['BEV_CONTEXT_'+f.toUpperCase()]);
chk('00791','baseline unlicensed consent',{assessment_type:'baseline',dpd_status:'normal'},'consultant_review',['UNLICENSED_CONSENT_BASELINE']);
for(const c of ['00238','00791'])test(c+' 14-day/46-hour schedule',()=>{assert.equal(P[c].treatment_phases[0].cycle_length_days,14);assert(P[c].treatment_phases[0].administration.some(x=>x.drug==='fluorouracil_infusion'&&/46/.test(JSON.stringify(x))));});
for(const f of ['diarrhoea_grade','diarrhoea_highest_grade','mucositis_grade','stomatitis_highest_grade'])test('00791 exact source grading '+f,()=>{const d=P['00791'].input_definitions[f];assert.equal(d.ctcae_version,'NCCP source table 6');assert.equal(d.grading_source_url,P['00791'].metadata.source_url);assert(d.options.every(o=>o.description));});
const failed=results.filter(x=>!x.passed),out={release:'0.84.33',source_checked_date:'2026-11-04',baseline_comparison:baseline,total:results.length,passed:results.length-failed.length,failed:failed.length,cases:results};
fs.writeFileSync(path.join(__dirname,baseline?'source-case-results-baseline.json':'source-case-results.json'),JSON.stringify(out,null,2)+'\n');
for(const f of failed)console.error('FAIL '+f.name+': '+f.error);
console.log(`VEGF source audit: ${out.passed}/${out.total} passed; ${out.failed} failed${baseline?' (before-snapshot comparison)':''}.`);if(failed.length)process.exitCode=1;
