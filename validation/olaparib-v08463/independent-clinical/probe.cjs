'use strict';
// Independent source-derived probes by az_evidence. Do not import the author's tests.
const fs = require('fs'), path = require('path'), crypto=require('crypto');
const repo=path.resolve(__dirname,'../../..');
const out=process.env.SACT_OLAPARIB_REVIEW_DIR ? path.resolve(process.env.SACT_OLAPARIB_REVIEW_DIR) : __dirname;
const E=require(path.join(repo,'js/assessment-engine'));
const D=require(path.join(repo,'js/protocol-dose-schedule'));
const files={
 '00588':path.join(repo,'protocols/shared/00588-olaparib-tablet-monotherapy.json'),
 '00746':path.join(repo,'protocols/gynaecology/00746-olaparib-tablet-and-bevacizumab-therapy.json')
};
const p=Object.fromEntries(Object.entries(files).map(([k,v])=>[k,JSON.parse(fs.readFileSync(v,'utf8'))]));
const results=[];
const holds=['withhold','delay','withhold_then_reduce','delay_then_dose_reduce'];
const stops=['permanently_discontinue','discontinue','cease','contraindicated'];
const neutral=['proceed','proceed_with_caution','partial_context_required'];
const f=(x,comp='olaparib')=>x.findings.filter(v=>(v.action.components||[]).includes(comp));
const has=(x,types,comp='olaparib')=>f(x,comp).some(v=>types.includes(v.actionType));
const txt=(x,comp='olaparib')=>f(x,comp).map(v=>v.explanation+' '+v.action.message+' '+v.action.recommendation).join('\n');
const row=(x,comp='olaparib')=>x.rows.find(v=>v.componentId===comp);
const noNum=(x,comp='olaparib')=>!row(x,comp)||(!row(x,comp).quantified&&!/^\s*\d+(?:\.\d+)?\s*mg\b/i.test(row(x,comp).protocolDose));
const noStop=(x,comp='olaparib')=>!has(x,stops,comp);
const quiet=(x,comp='olaparib')=>f(x,comp).every(v=>neutral.includes(v.actionType));
const ck=(name,fn)=>({name,fn});
const review=(comp='olaparib')=>ck(`${comp}: review without numeric prescription`,x=>has(x,['consultant_review'],comp)&&noNum(x,comp));
const hold=(comp='olaparib')=>ck(`${comp}: hold/delay`,x=>has(x,holds,comp)&&(!row(x,comp)||holds.includes(row(x,comp).actionType)));
const stop=(comp='olaparib')=>ck(`${comp}: stop`,x=>has(x,stops,comp)&&row(x,comp)&&stops.includes(row(x,comp).actionType));
const untouched=(comp)=>ck(`${comp}: no unrelated restrictive finding`,x=>quiet(x,comp));
const source=(s)=>ck('source-linked clinical findings',x=>x.findings.every(v=>v.source&&v.source.url)&&x.findings.length>0);
function run(code,id,sourceCase,title,inputs,checks){
 const r=E.assess(p[code],inputs),m=D.buildModificationModel(p[code],r);
 const clinical=r.findings.filter(v=>!v.domainAssessment&&!/^PARTIAL_/.test(v.ruleId||''));
 const x={...r,findings:clinical,rows:m.rows};
 const assertions=checks.map(c=>({name:c.name,pass:!!c.fn(x)}));
 const invalidOK=inputs.__expectInvalid===true;
 if(!invalidOK) assertions.push({name:'valid entered values',pass:r.invalid.length===0});
 assertions.push({name:'no engine errors',pass:(r.errors||[]).length===0});
 const item={id:`${code}-${id}`,sourceCase,title,inputs,pass:assertions.every(a=>a.pass),assertions,
 output:{actionType:r.actionType,complete:r.complete,partialAssessment:r.partialAssessment,invalid:r.invalid,unassessed:r.unassessed,
 findings:clinical.map(v=>({ruleId:v.ruleId,actionType:v.actionType,components:v.action.components,message:v.action.message,source:v.source})),
 rows:m.rows.map(v=>({componentId:v.componentId,actionType:v.actionType,protocolDose:v.protocolDose,quantified:v.quantified,ruleId:v.ruleId}))}};
 results.push(item);
}
const breast={indication_id:'adjuvant_high_risk_early_breast'};
const prostate={indication_id:'mcrpc_brca_monotherapy'};
const first={indication_id:'first_line_advanced_ovarian_maintenance'};
const relapse={indication_id:'platinum_sensitive_relapsed_ovarian_maintenance'};
const pancreas={indication_id:'pancreatic_maintenance'};
for(const code of ['00588','00746']){
 run(code,'D01','D01','Exact count boundaries preserve prior reduced dose',{anc_x10e9_l:1,platelets_x10e9_l:100,current_dose_level:'-1'},[
 ck('count rule allows previous dose',x=>has(x,['proceed'])&&/previous.*dose/i.test(txt(x))),
 ck('no new 300 mg instruction',x=>quiet(x)&&noNum(x)),source()]);
 for(const [id,inputs]of [['anc',{anc_x10e9_l:0.99,platelets_x10e9_l:160}],['plt',{anc_x10e9_l:2,platelets_x10e9_l:99}]])
  run(code,`D02-${id}`,'D02','Either abnormal count triggers delay',inputs,[hold(),source()]);
 run(code,'D03','D03','Fourth relevant count/FN occurrence overrides restart',{haematological_toxicity_occurrence_number:4,anc_x10e9_l:0.8,current_dose_level:'-1'},[stop(),ck('no quantified restart',x=>row(x)&&row(x).protocolDose==='Not to be administered')]);
 run(code,'D04','D04','Grade 4 FN leaves two-level restart as a decision after recovery',{febrile_neutropenia_grade:4,current_dose_level:'starting'},[
 hold(),ck('two levels is discretionary',x=>/consider.*two.level/i.test(txt(x))),ck('no numeric automatic restart',x=>noNum(x))]);
 run(code,'D05','D05','Another count toxicity at 200 mg does not create 150 mg toxicity level',{anc_x10e9_l:0.9,current_dose_level:'-2'},[
 ck('interruption remains',x=>has(x,holds)),ck('ladder exhaustion explicit',x=>/ladder ends at 200/i.test(txt(x))),ck('no new numeric dose',x=>noNum(x))]);
 for(const value of [51,50,31,30,29]){
 const checks=value>50?[ck('no renal reduction',x=>quiet(x)&&has(x,['proceed']))]:value>30?[ck('200 mg BID dose path',x=>row(x)&&row(x).protocolDose==='200 mg twice daily')]:[review(),ck('both NCCP and SmPC represented',x=>/NCCP/i.test(txt(x))&&/SmPC|EMA/i.test(txt(x)))];
 run(code,`D06-${value}`,'D06',`CrCl ${value} mL/min`,{crcl_ml_min:value,renal_measurement_context:'verified_crcl',current_dose_level:'starting'},checks);
 }
 run(code,'D07-childC','D07','Severe hepatic source difference remains a review',{child_pugh_class:'C'},[review(),ck('no automatic half dose',x=>noNum(x))]);
 run(code,'D07-dialysis','D07','Haemodialysis remains a review',{haemodialysis:true},[review()]);
 for(const [cls,dose] of [['strong',100],['moderate',150]]){
  run(code,`D08-${cls}`,'D08','Unavoidable interaction is a distinct dose path',{cyp3a_inhibitor_class:cls,cyp3a_inhibitor_unavoidable:true},[ck(`${dose} mg twice daily`,x=>row(x)&&row(x).protocolDose===`${dose} mg twice daily`)]);
  run(code,`D08-${cls}-avoid`,'D08','An avoidable inhibitor is reviewed, not automatically dosed',{cyp3a_inhibitor_class:cls,cyp3a_inhibitor_unavoidable:false},[review()]);
 }
 run(code,'D08-combined','D08','Interaction plus renal restriction has no invented combined dose',{cyp3a_inhibitor_class:'strong',cyp3a_inhibitor_unavoidable:true,crcl_ml_min:50},[review()]);
 run(code,'D09','D09','Strong or moderate inducer does not cause dose escalation',{strong_or_moderate_cyp3a_inducer:true},[review(),ck('avoidance/reconciliation stated',x=>/avoid/i.test(txt(x)))]);
 for(const [id,input]of [['severe',{severe_haematological_toxicity:true}],['transfusion',{blood_transfusion_dependence:true}],['Hb',{hb_g_dl:7.9}]])
  run(code,`D10-${id}`,'D10','Severe anaemia/cytopenia not hidden by normal ANC and platelets',{anc_x10e9_l:2,platelets_x10e9_l:150,...input},[hold()]);
 run(code,'D11-persistent','D11','Four-week persistent cytopenia requires investigation and continued interruption',{persistent_cytopenia_after_4_week_hold:true},[hold(),ck('investigation explicit',x=>/marrow|cytogenetic/i.test(txt(x))),ck('no automatic permanent stop',x=>noStop(x))]);
 run(code,'D11-confirmed','D11','Confirmed MDS/AML permanently stops olaparib',{confirmed_mds_aml:true},[stop(),...(code==='00746'?[untouched('bevacizumab')]:[])]);
 run(code,'D12-suspected','D12','Suspected pneumonitis interrupts while investigated',{suspected_pneumonitis:true},[hold(),ck('no automatic permanent stop',x=>noStop(x))]);
 run(code,'D12-confirmed','D12','Confirmed pneumonitis stops olaparib',{confirmed_pneumonitis:true},[stop(),...(code==='00746'?[untouched('bevacizumab')]:[])]);
 run(code,'D13','D13','Acute DILI is independent of chronic Child-Pugh class',{suspected_drug_induced_liver_injury:true,child_pugh_class:'A'},[hold()]);
 run(code,'U01-missing','U01','Missing related values do not hide a single actionable ANC',{anc_x10e9_l:0.7},[hold(),ck('CrCl and platelets stay unassessed',x=>['crcl_ml_min','platelets_x10e9_l'].every(k=>x.unassessed.some(u=>u.id===k))),ck('not overall clearance',x=>x.partialAssessment&&x.actionType!=='proceed')]);
 run(code,'U01-empty','U01','No clinical data does not imply a safe treatment decision',{},[ck('incomplete with named missing domains',x=>x.actionType==='incomplete'&&x.unassessed.length>0&&x.findings.length===0)]);
 run(code,'U01-invalid-plus-hold','U01','An invalid unrelated value cannot hide an independent urgent hold',{anc_x10e9_l:-1,suspected_pneumonitis:true,__expectInvalid:true},[hold(),ck('invalid ANC explicitly identified',x=>x.invalid.some(v=>v.id==='anc_x10e9_l'))]);
 run(code,'D07-measure','D07','Indexed eGFR cannot silently become verified CrCl',{crcl_ml_min:50,renal_measurement_context:'other_or_uncertain'},[review()]);
 run(code,'D10-initial','D10','Baseline prior blood toxicity unrecovered is a hold despite acceptable repeat counts',{treatment_stage:'initial',recovered_previous_haematological_toxicity:false,anc_x10e9_l:2,platelets_x10e9_l:160},[hold()]);
}
// Indication-specific paths; intentionally use only the relevant linked inputs.
run('00588','S01','S01','Prostate retains its castration plan',{...prostate,prostate_castration_maintained:false},[review(),ck('LHRH/castration named',x=>/LHRH|castration/i.test(txt(x)))]);
for(const[title,route]of [['prostate',prostate],['pancreas',pancreas],['relapse',relapse]])
 run('00588',`S02-${title}`,'S02','One-year breast cap does not leak into other indications',{...route,months_on_olaparib:25},[ck('no inappropriate fixed-duration finding',x=>quiet(x))]);
run('00588','S02-breast','S02','Breast completion reviewed at 12 months',{...breast,months_on_olaparib:12},[review(),ck('one-year purpose stated',x=>/one year/i.test(txt(x)))]);
for(const[title,route]of [['breast',breast],['pancreas',pancreas]])
 run('00588',`S03-${title}`,'S03','Somatic-only is not germline BRCA eligibility',{...route,germline_brca_status:'negative'},[review(),ck('germline requirement stated',x=>/germline/i.test(txt(x)))]);
run('00588','S03-prostate','S03','Somatic BRCA can satisfy prostate molecular type',{...prostate,prostate_brca_status:'somatic'},[ck('no molecular-type rejection',x=>quiet(x))]);
run('00588','S03-ovary','S03','Somatic BRCA can satisfy ovarian molecular type',{...first,ovarian_brca_status:'somatic'},[ck('no molecular-type rejection',x=>quiet(x))]);
for(const n of [1.9,2])run('00588',`S04-${n}`,'S04','Node-negative adjuvant TNBC exact 2 cm boundary',{...breast,breast_receptor_group:'tnbc',breast_chemotherapy_setting:'adjuvant',positive_axillary_nodes:0,primary_tumour_cm:n},n<2?[review()]:[ck('no high-risk rejection at 2 cm',x=>quiet(x))]);
for(const n of [2,3])run('00588',`S05-${n}`,'S05','HR-positive neoadjuvant CPS+EG exact 3 boundary',{...breast,breast_receptor_group:'hr_positive',breast_chemotherapy_setting:'neoadjuvant',residual_invasive_disease:true,cps_eg_score:n},n<3?[review()]:[ck('residual disease and score 3 satisfy this branch',x=>quiet(x))]);
run('00588','S05-pCR','S05','pCR cannot satisfy neoadjuvant residual-disease requirement',{...breast,breast_receptor_group:'hr_positive',breast_chemotherapy_setting:'neoadjuvant',residual_invasive_disease:false,cps_eg_score:3},[review()]);
for(const n of [3,4])run('00588',`S06-${n}`,'S06','HR-positive adjuvant exact 4-node boundary',{...breast,breast_receptor_group:'hr_positive',breast_chemotherapy_setting:'adjuvant',positive_axillary_nodes:n},n<4?[review()]:[ck('four nodes satisfies this branch',x=>quiet(x))]);
for(const n of [15,16])run('00588',`S07-${n}`,'S07','Pancreatic stable disease and exact 16-week first-line platinum boundary',{...pancreas,pancreatic_metastatic_adenocarcinoma:true,pancreatic_first_line_platinum:true,pancreatic_platinum_weeks:n,pancreatic_response:'stable',germline_brca_status:'positive'},n<16?[review()]:[ck('stable disease after 16 weeks is permitted',x=>quiet(x))]);
for(const state of [false,true])run('00588',`S08-${state?'residual':'NED'}`,'S08','First-line ovarian two-year disease-status decision',{...first,months_on_olaparib:24,radiological_disease_present_at_two_years:state},[review(),ck('both NED completion and residual benefit review explained',x=>/no radiological disease/i.test(txt(x))&&/residual disease/i.test(txt(x)))]);
for(const n of [6,6.1])run('00588',`S09-response-${n}`,'S09','Relapsed platinum sensitivity strict greater-than six months',{...relapse,penultimate_platinum_response_months:n},n===6?[review()]:[ck('strict boundary permits 6.1',x=>quiet(x))]);
for(const n of [14.9,15,-10])run('00588',`S09-ca125-${n}`,'S09','Relapsed elevated CA125 repeat: strict less-than 15% rise, decline valid',{...relapse,ca125_xuln:1.5,ca125_repeat_interval_days:7,ca125_repeat_percent_change:n},n>=15?[review()]:[ck('rise below 15 or fall is permitted',x=>quiet(x))]);
run('00588','S02-timing','S02','Breast ideal 12-week start is advisory, not an absolute contraindication',{...breast,weeks_since_completion_of_last_local_or_systemic_treatment:13},[review(),ck('no contraindication/cessation',x=>noStop(x))]);
// Independent combination-component cases.
const comboEligibility={indication_id:'00746-gyn',first_line_maintenance_confirmed:true,figo_stage:'III',hrd_status:'genomic_instability',ovarian_histology:'high_grade_serous',platinum_taxane_cycles:6,bevacizumab_last_platinum_cycles:3,platinum_bevacizumab_response:'partial',ecog:1};
run('00746','B01-genomic','B01','Genomic instability can qualify without a BRCA mutation',comboEligibility,[ck('no false molecular or eligibility restriction',x=>quiet(x)&&quiet(x,'bevacizumab'))]);
for(const [id,patch]of [['unknown',{hrd_status:'unknown'}],['negative',{hrd_status:'negative'}],['no-bev',{bevacizumab_last_platinum_cycles:0}],['PARP',{previous_parp_inhibitor:true}]])
run('00746',`B01-${id}`,'B01','Unknown/negative HRD or missing source pathway criterion cannot get clearance',{...comboEligibility,...patch},[ck('restriction surfaced',x=>has(x,['consultant_review',...stops]))]);
run('00746','B01-surgeryexception','B01','Two bevacizumab chemotherapy cycles qualify only with interval debulking',{...comboEligibility,bevacizumab_last_platinum_cycles:2,interval_debulking_surgery:true},[ck('exception applied',x=>quiet(x)&&quiet(x,'bevacizumab'))]);
run('00746','B01-nosurgeryexception','B01','Two chemotherapy bevacizumab cycles without interval surgery need review',{...comboEligibility,bevacizumab_last_platinum_cycles:2,interval_debulking_surgery:false},[review()]);
run('00746','B02','B02','Bevacizumab total duration includes chemotherapy and does not end olaparib',{bevacizumab_total_months_including_chemotherapy:15,months_on_olaparib:10},[stop('bevacizumab'),untouched('olaparib')]);
for(const n of [2,2.1,4,4.1])run('00746',`B04-${n}`,'B04',`24-hour protein ${n} g`,{protein_24h_g:n},n<=2?[ck('NCCP exact 2 permits by this rule',x=>has(x,['proceed'],'bevacizumab')&&quiet(x,'bevacizumab'))]:n<=4?[hold('bevacizumab'),untouched('olaparib')]:[stop('bevacizumab'),untouched('olaparib')]);
for(const dip of ['3+','4+'])run('00746',`B05-${dip}`,'B05',`Dipstick ${dip} is not a numeric daily protein dose rule`,{urine_protein_dipstick:dip},dip==='4+'?[hold('bevacizumab')]:[ck('quantify without automatic hold',x=>has(x,['proceed_with_caution'],'bevacizumab')&&!has(x,[...holds,...stops],'bevacizumab')&&/24.hour/i.test(txt(x,'bevacizumab')))]);
run('00746','B05-spot','B05','Spot 2 g/L is not 2 g per 24 hours',{urine_protein_g_l:2},[ck('collection plan without false daily-protein branch',x=>has(x,['proceed_with_caution'],'bevacizumab')&&!has(x,[...holds,...stops],'bevacizumab')&&/24.hour/i.test(txt(x,'bevacizumab')))]);
run('00746','B05-quantitative-overrides','B05','Reassuring dipstick does not erase known quantitative stop',{urine_protein_dipstick:'negative',protein_24h_g:4.1},[stop('bevacizumab')]);
run('00746','B05-nephrotic','B05','Nephrotic syndrome stops bevacizumab despite 24-hour protein 2',{protein_24h_g:2,nephrotic_syndrome:true},[stop('bevacizumab')]);
run('00746','B06','B06','Symptomatic hypertension remains actionable despite 130/80',{systolic_bp:130,diastolic_bp:80,hypertension_control:'controlled',symptomatic_hypertension:true},[hold('bevacizumab'),untouched('olaparib')]);
run('00746','B06-single-reading','B06','Single BP reading without control context gets review',{systolic_bp:155,diastolic_bp:85},[review('bevacizumab'),ck('not automatic permanent stop',x=>noStop(x,'bevacizumab'))]);
run('00746','B06-persistent3','B06','Persistent grade 3 BP stops bevacizumab',{hypertension_grade:3,persistent_grade3_hypertension:true},[stop('bevacizumab')]);
run('00746','B07','B07','Arterial event stops independently of venous thromboembolism grade',{arterial_thromboembolic_event:true,venous_thromboembolism_grade:0},[stop('bevacizumab'),untouched('olaparib')]);
run('00746','B08','B08','Day 35 unhealed wound still holds bevacizumab',{days_since_major_surgery:35,wound_fully_healed:false},[hold('bevacizumab')]);
run('00746','B08-day28','B08','Day 28 alone is insufficient without healing status',{days_since_major_surgery:28},[review('bevacizumab')]);
run('00746','B08-day28-healed','B08','Day 28 and healed removes this particular surgical hold',{days_since_major_surgery:28,wound_fully_healed:true},[ck('no surgery restriction by these facts',x=>quiet(x,'bevacizumab'))]);
run('00746','B09-suspected','B09','Suspected MDS/AML requires review rather than stopping both agents',{suspected_mds_aml:true,confirmed_mds_aml:false},[review(),ck('no premature permanent stop',x=>noStop(x)),untouched('bevacizumab')]);
run('00746','B09-suspected-cytopenia','B09','Suspected MDS plus severe cytopenia interrupts olaparib',{suspected_mds_aml:true,severe_haematological_toxicity:true},[hold(),untouched('bevacizumab')]);
run('00746','B11','B11','Separate olaparib 250 mg state and bevacizumab protein hold',{current_dose_level:'-1',anc_x10e9_l:1.4,platelets_x10e9_l:150,protein_24h_g:3},[hold('bevacizumab'),untouched('olaparib'),ck('current prescribed olaparib level preserved',x=>x.inputs.current_dose_level==='-1')]);
run('00746','B12-other','B12','Non-TE grade 2 internal fistula requires consideration/review',{fistula_type:'internal_non_gi',fistula_grade:2},[review('bevacizumab'),ck('not automatic permanent stop',x=>noStop(x,'bevacizumab'))]);
run('00746','B12-TE','B12','Tracheo-oesophageal fistula stops bevacizumab',{fistula_type:'tracheoesophageal',fistula_grade:2},[stop('bevacizumab')]);
run('00746','B12-intracranial','B12','Intracranial bleeding does not rely on generic grade 3',{intracranial_bleeding:true,haemorrhage_grade:1},[stop('bevacizumab')]);
run('00746','B12-active-reaction','B12','Active infusion reaction is an infusion hold/review',{active_infusion_reaction:true},[hold('bevacizumab'),ck('not all infusion reactions imply permanent stop',x=>noStop(x,'bevacizumab'))]);
run('00746','B12-suspected-PRES','B12','New possible PRES symptoms are urgently assessed, not software-confirmed',{suspected_pres_or_new_neurological_symptoms:true},[hold('bevacizumab'),ck('no premature diagnosis/stop',x=>noStop(x,'bevacizumab'))]);
run('00746','B12-confirmed-PRES','B12','Confirmed PRES stops bevacizumab',{confirmed_pres:true},[stop('bevacizumab')]);
const hash=filename=>crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex');
const report={createdAt:new Date().toISOString(),scope:'Independent read-only clinical decision and component-dose model probes; not UI/PDF validation or clinical approval.',sourceChecklist:path.join(repo,'validation/olaparib-v08463/clinical/source-review.md'),sourceChecklistSha256:hash(path.join(repo,'validation/olaparib-v08463/clinical/source-review.md')),protocols:Object.fromEntries(Object.entries(files).map(([k,v])=>[k,{file:v,sha256:hash(v),rules:p[k].rule_engine.rules.length}])),engineSha256:hash(path.join(repo,'js/assessment-engine.js')),doseModelSha256:hash(path.join(repo,'js/protocol-dose-schedule.js')),caseCount:results.length,passed:results.filter(x=>x.pass).length,failed:results.filter(x=>!x.pass).length,coveredSourceCaseGroups:[...new Set(results.map(x=>x.sourceCase))].sort(),deferred:['S01/S02: cross-tool indication text and duration consistency','U02: regimen-only patient UI and downloads','U03: printed flag/value/unit/source consistency','U04: fresh state across all tool generation','B03: q3-week monitoring and continuous tablet schedule in all outputs','B10: post-treatment breastfeeding dates in patient/consent outputs'],results};
const num=process.argv[2]||'01';fs.writeFileSync(path.join(out,`report-${num}.json`),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({report:path.join(out,`report-${num}.json`),caseCount:report.caseCount,passed:report.passed,failed:report.failed,coveredSourceCaseGroups:report.coveredSourceCaseGroups,failures:results.filter(x=>!x.pass).map(x=>({id:x.id,title:x.title,inputs:x.inputs,failed:x.assertions.filter(a=>!a.pass),output:{actionType:x.output.actionType,findings:x.output.findings,rows:x.output.rows}}))},null,2));
