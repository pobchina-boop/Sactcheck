'use strict';
// Independent clinical oracle from physically inspected NCCP tables and current linked HPRA SmPC.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const repo=process.env.SACT_REPO||path.resolve(__dirname,'../../..');
const pos=process.argv.indexOf('--mode'),mode=pos>=0?process.argv[pos+1]:(process.argv[2]||'proposed');
assert(['baseline','proposed','integrated'].includes(mode));
const dir=mode==='baseline'?path.join(__dirname,'../baseline'):mode==='proposed'?path.join(__dirname,'proposed'):path.join(repo,'protocols/breast');
const E=require(path.join(repo,'js/assessment-engine')),D=require(path.join(repo,'js/protocol-dose-schedule')),V=require(path.join(repo,'js/protocol-validator'));
const codes=['00251','00261'],P=Object.fromEntries(codes.map(code=>[code,JSON.parse(fs.readFileSync(path.join(dir,fs.readdirSync(dir).find(f=>f.startsWith(code+'-')))))]));
const results=[],coverage=new Set();let failed=0;
const clinical=r=>r.findings.filter(f=>!f.domainAssessment&&!/^PARTIAL_/.test(f.ruleId||''));
const tags=r=>clinical(r).map(f=>f.ruleId);
const rule=(r,tag)=>assert(tags(r).some(x=>x.endsWith('_'+tag)),`Missing ${tag}; got ${tags(r)}`);
const absent=(r,tag)=>assert(!tags(r).some(x=>x.endsWith('_'+tag)),`Unexpected ${tag}`);
const has=(r,type)=>assert(clinical(r).some(f=>f.actionType===type),`Expected ${type}; got ${r.actionType}`);
const unrestricted=r=>assert(!clinical(r).some(f=>['withhold','delay','contraindicated','consultant_review','dose_reduce','discontinue'].includes(f.actionType)),`Unexpected restriction: ${tags(r)}`);
const noDose=m=>assert(!m.rows.some(r=>r.quantified),'No automatic numeric prescription is safe for a selected AUC range');
function run(code,name,input,check,source='NCCP p3–4; independently specified source boundary'){
 const out={code,name,input,source};try{const r=E.assess(P[code],input),m=D.buildModificationModel(P[code],r);assert.deepEqual(r.errors,[]);require("../../../tests/helpers/source-input-validation-v08421.cjs")(r);for(const f of clinical(r)){coverage.add(f.ruleId);assert.deepEqual(f.action.components,['carboplatin']);}out.actual=r.actionType;out.findings=clinical(r).map(f=>({id:f.ruleId,action:f.actionType,explanation:f.explanation}));out.doses=m.rows.map(x=>({dose:x.protocolDose,quantified:x.quantified}));noDose(m);check(r,m);out.pass=true;}catch(e){out.pass=false;out.error=e.message;failed++;}results.push(out);
}
function structural(name,check){try{check();results.push({name,pass:true});}catch(e){results.push({name,pass:false,error:e.message});failed++;}}
for(const code of codes){
 const days=code==='00251'?28:21;
 run(code,'Empty remains unassessed',{},r=>assert.equal(r.actionType,'incomplete'));
 for(const [field,tag]of [['hypersensitivity','HYPERSENSITIVITY'],['platinum_progression','PLATINUM_PROGRESSION'],['pregnancy','PREGNANCY'],['breastfeeding','BREASTFEEDING'],['other_platinum_hypersensitivity','OTHER_PLATINUM_ALLERGY'],['bleeding_tumour','BLEEDING_TUMOUR'],['severe_myelosuppression','SEVERE_MARROW'],['yellow_fever_vaccine','YELLOW_FEVER']])for(const value of [false,true])run(code,`${field} ${value}`,{[field]:value},r=>{if(value){has(r,'contraindicated');rule(r,tag);}else{unrestricted(r);assert.notEqual(r.actionType,'proceed');}},'NCCP exclusions p3 or HPRA §4.3');
 for(const [field,tag]of [['acute_renal_deterioration','AKI'],['acute_fever_or_infection','FEVER'],['suspected_infusion_reaction','INFUSION_REACTION']])run(code,`${field} urgent independent hold`,{[field]:true},r=>{has(r,'withhold');rule(r,tag);},'Source current-organ/infection/infusion requirement; explicit safety interpretation');
 for(const [field,tag]of [['indication_eligible','INDICATION'],['antiemetic_plan_confirmed','ANTIEMETICS']])run(code,`${field} false`,{[field]:false},r=>{has(r,'consultant_review');rule(r,tag);});
 for(const [field,tag]of [['prior_dose_reduction','PRIOR_REDUCTION'],['renal_estimation_unreliable','UNRELIABLE_ESTIMATE'],['febrile_neutropenia_prior','PRIOR_FN'],['prior_myelosuppression_delay','PRIOR_DELAY'],['new_or_worsening_neuropathy','NEUROPATHY'],['new_hearing_symptoms','HEARING'],['concurrent_nephrotoxic_medicine','NEPHROTOXIN'],['concurrent_ototoxic_medicine','OTOTOXIN'],['required_tests_unresolved','TESTS'],['extensive_pretreatment','EXTENSIVE_PRETREATMENT'],['other_live_vaccine','LIVE_VACCINE'],['phenytoin_fosphenytoin','PHENYTOIN'],['concurrent_radiotherapy','RADIOTHERAPY'],['warfarin','WARFARIN'],['significant_new_hepatic_deterioration','ACUTE_LIVER']])run(code,`${field} review`,{[field]:true},r=>{has(r,'consultant_review');rule(r,tag);});
 run(code,'Other indication is unconfirmed',{disease_context:'other'},r=>{has(r,'consultant_review');rule(r,'SETTING');});
 for(const anc of [0,.99,1,1.01,2])run(code,`ANC ${anc} alone`,{anc},r=>{if(anc<1){has(r,'delay');rule(r,'ANC_LOW');}else if(anc===1&&days===28){has(r,'consultant_review');rule(r,'EXACT_ANC');}else unrestricted(r);assert.notEqual(r.actionType,'proceed');},`NCCP${code} physical p4: ${days===28?'strict >1 and unresolved equality':'≥1'}`);
 for(const platelets of [0,99.99,100,100.01,200])run(code,`Platelets ${platelets} alone`,{platelets},r=>{if(platelets<100){has(r,'delay');rule(r,'PLATELETS_LOW');}else if(platelets===100&&days===28){has(r,'consultant_review');rule(r,'EXACT_PLATELETS');}else unrestricted(r);assert.notEqual(r.actionType,'proceed');},`NCCP${code} physical p4: ${days===28?'strict >100 and unresolved equality':'≥100'}`);
 for(const anc of [.99,1,1.01])for(const platelets of [99.99,100,100.01])run(code,`Count cross-product ${anc}/${platelets}`,{anc,platelets},r=>{if(anc<1||platelets<100)has(r,'delay');else if(days===28&&(anc===1||platelets===100))has(r,'consultant_review');else unrestricted(r);});
 for(const gfr of [0,19.99,20,20.01,29.99,30,30.01,59.99,60,125,125.01,200])run(code,`Exact GFR ${gfr}`,{gfr},r=>{if(gfr<=20){has(r,'contraindicated');rule(r,'GFR_STOP');}else if(gfr<=30){has(r,'consultant_review');rule(r,'GFR_EXTREME_CAUTION');}else if(gfr<60){has(r,'proceed_with_caution');rule(r,'GFR_MYELORISK');}else if(gfr>125){has(r,'consultant_review');rule(r,'GFR_CAP');}else unrestricted(r);},'NCCP physical p2 GFR cap125; p4 ≤20 excluded, >20≤30 extreme caution, <60 marrow risk');
 for(const gfr of [20,25,45,90,150])run(code,`Renal ${gfr} with count hold`,{gfr,anc:.5,hepatic_impairment:true,target_auc:5},r=>{has(r,'delay');rule(r,'ANC_LOW');if(gfr<=20)has(r,'contraindicated');});
 for(const renal_measure_type of ['indexed_egfr','unknown'])run(code,`${renal_measure_type} not usable directly`,{renal_measure_type,gfr:90},r=>{has(r,'consultant_review');rule(r,'RENAL_METHOD');},'NCCP p2 measured/Wright/Cockcroft–Gault in unindexed mL/min');
 for(const renal_measure_type of ['cockcroft_gault','wright'])for(const hours of [undefined,47.99,48,48.01])run(code,`${renal_measure_type} creatinine age ${hours}`,{renal_measure_type,...(hours===undefined?{}:{creatinine_result_age_hours:hours})},r=>{if(hours===undefined){has(r,'consultant_review');rule(r,'ESTIMATE_AGE_UNKNOWN');}else if(hours>48){has(r,'consultant_review');rule(r,'ESTIMATE_OLD');}else unrestricted(r);},'NCCP p4 result within48h; equality retained');
 for(const renal_measure_type of ['cockcroft_gault','wright'])for(const creatinine of [61,62,62.99,63,63.01])run(code,`${renal_measure_type} low creatinine ${creatinine}`,{renal_measure_type,creatinine_result_age_hours:24,current_creatinine:creatinine},r=>{if(creatinine<63){has(r,'consultant_review');rule(r,'LOW_CREATININE');}else unrestricted(r);},'NCCP p2 discretionary62 or steady preoperative creatinine if<63, not automatic floor');
 for(const current of [64,80,87.99,88,88.01,120])run(code,`Measured isotope baseline80 current${current}`,{renal_measure_type:'measured',baseline_creatinine:80,current_creatinine:current},r=>{if(current>88){has(r,'consultant_review');rule(r,'ISOTOPE_TREND');}else unrestricted(r);},'NCCP p4 fixed isotope dose may remain if≤110%; actual operands derive ratio');
 for(const input of [{renal_measure_type:'measured'},{renal_measure_type:'measured',baseline_creatinine:80},{renal_measure_type:'measured',current_creatinine:88},{renal_measure_type:'measured',creatinine_ratio_baseline:1}])run(code,'Missing ratio operands cannot establish renal stability '+JSON.stringify(input),input,r=>{has(r,'consultant_review');rule(r,'ISOTOPE_TREND_MISSING');});
 run(code,'Injected false normal ratio cannot suppress actual increase',{renal_measure_type:'measured',baseline_creatinine:80,current_creatinine:120,creatinine_ratio_baseline:1},r=>{has(r,'consultant_review');rule(r,'ISOTOPE_TREND');});
 run(code,'Derived ratio without method needs renal context',{baseline_creatinine:80,current_creatinine:80},r=>{has(r,'consultant_review');rule(r,'TREND_METHOD_UNKNOWN');});
 for(const target_auc of [3.99,4,5,6,6.01])run(code,`Selected AUC ${target_auc}`,{target_auc},r=>{if(target_auc<4||target_auc>6){has(r,'consultant_review');rule(r,'AUC_OUTSIDE');}else unrestricted(r);assert.notEqual(r.actionType,'proceed');},'NCCP p1–2 selected4–6 range, not a universal6 or automaticmg');
 for(const ecog of [0,1,2,3,4])run(code,`Breast ECOG ${ecog}`,{ecog,disease_context:'breast_metastatic',individual_count_thresholds_confirmed:true},r=>{if(ecog>=3){has(r,'consultant_review');rule(r,ecog===3?'ECOG3':'ECOG_HIGH');}else unrestricted(r);},'NCCP p3 ECOG3 exception limited to advanced gynaecology');
 for(const ecog of [2,3])for(const confirmed of [undefined,false,true])run(code,`ECOG ${ecog} individual count threshold ${confirmed}`,{ecog,disease_context:'gyn_advanced',ps3_due_to_advanced_gynaecologic_cancer:true,...(confirmed===undefined?{}:{individual_count_thresholds_confirmed:confirmed})},r=>{if(confirmed!==true){has(r,'consultant_review');rule(r,'INDIVIDUAL_COUNTS');}else unrestricted(r);},'NCCP p4 some ECOG2/3 patients need higher counts');
 for(const context of ['breast_metastatic','gyn_adjuvant','gyn_advanced','gyn_recurrent'])for(const reason of [undefined,false,true])run(code,`ECOG3 context${context} advanced-disease reason${reason}`,{ecog:3,disease_context:context,individual_count_thresholds_confirmed:true,...(reason===undefined?{}:{ps3_due_to_advanced_gynaecologic_cancer:reason})},r=>{if(['gyn_advanced','gyn_recurrent'].includes(context)&&reason===true)unrestricted(r);else{has(r,'consultant_review');rule(r,'ECOG3');}});
 run(code,'ECOG3 no disease context cannot use exception',{ecog:3,ps3_due_to_advanced_gynaecologic_cancer:true,individual_count_thresholds_confirmed:true},r=>{has(r,'consultant_review');rule(r,'ECOG3');});
 run(code,'Liver impairment has no routine source reduction',{hepatic_impairment:true},r=>{unrestricted(r);rule(r,'LIVER');});
 for(const context of ['breast_metastatic','gyn_advanced'])run(code,`Off-label confirmation scoped to ${context}`,{disease_context:context,off_label_governance_confirmed:false},r=>{if(context==='breast_metastatic'){has(r,'consultant_review');rule(r,'BREAST_OFF_LABEL');}else unrestricted(r);},'NCCP p7 breast footnote');
 for(const interval of [21,28])run(code,`Selected interval ${interval}`,{planned_interval_days:interval},r=>{if(interval!==days){has(r,'consultant_review');rule(r,'WRONG_INTERVAL');}else unrestricted(r);});
 run(code,'Adequate counts with missing renal/AUC never authorise mg dose',{anc:2,platelets:200},r=>assert.notEqual(r.actionType,'proceed'));
 run(code,'Selected AUC/GFR does not clear unassessed safety domains',{gfr:90,target_auc:5},r=>assert.notEqual(r.actionType,'proceed'));
}
for(const auc of [4,5,6])run('00261',`Head-neck AUC ${auc}`,{disease_context:'head_neck',target_auc:auc},r=>{if(auc!==5){has(r,'consultant_review');rule(r,'HN_AUC');}else unrestricted(r);},'NCCP00261 p2 AUC5 indication-specific');
run('00261','Head-neck RT required',{disease_context:'head_neck',head_neck_radiotherapy_confirmed:false},r=>{has(r,'consultant_review');rule(r,'HN_RT');});
for(const context of ['head_neck','breast_metastatic'])for(const cycle of [3,4,8])run('00261',`${context} cycle${cycle}`,{disease_context:context,cycle_number:cycle},r=>{if(context==='head_neck'&&cycle>3){has(r,'consultant_review');rule(r,'HN_COURSE');}else unrestricted(r);},'NCCP p1 three cycles only for HNSCC; breast until progression/toxicity');
structural('Stable identifiers, schema-valid optional independent inputs, no clinical approvals',()=>{for(const code of codes){const p=P[code];assert.equal(p.protocol_id,`nccp-${code}-v${code==='00251'?6:7}`);assert(V.validate(p,{strict:true}).valid);assert.deepEqual(p.required_inputs,[]);for(const input of Object.values(p.input_definitions)){assert.equal(input.required,false);assert.notEqual(input.demo_value,undefined);}for(const key of ['consultant_reviewed','oncology_pharmacy_reviewed','clinical_use_authorised'])assert.equal(p.metadata.validation[key],false);}});
structural('All source indications preserved including metastatic breast off-label',()=>{for(const code of codes){const p=P[code];assert.equal(p.indications.length,code==='00251'?10:11);for(const suffix of 'abcdefghij')assert(p.indications.some(i=>i.code===code+suffix));assert(p.indications.some(i=>i.code===code+'j'&&i.off_label));if(code==='00261')assert(p.indications.some(i=>i.code==='00261k'&&i.planned_cycles===3));}});
structural('Select comparisons use values reachable from this exact protocol form',()=>{
 for(const code of codes){
  const p=P[code];
  for(const r of p.rule_engine.rules){
   function inspect(node){
    if(!node||typeof node!=='object')return;
    if(Array.isArray(node)){for(const item of node)inspect(item);return;}
    const def=p.input_definitions[node.field];
    if(def&&def.type==='select'&&['==','!=','in','not_in','not in'].includes(node.operator)){
     const selectable=def.options.map(o=>typeof o==='object'?o.value:o);
     for(const value of Array.isArray(node.value)?node.value:[node.value])assert(selectable.includes(value),`${code}/${r.id}: ${node.field} compares unreachable option ${JSON.stringify(value)}`);
    }
    for(const value of Object.values(node))if(value&&typeof value==='object')inspect(value);
   }
   inspect(r.when);
  }
 }
});
structural('Correct physical intervals, variable AUC, no automatic fixed treatment course for breast',()=>{for(const code of codes){const p=P[code],ph=p.treatment_phases[0];assert.equal(ph.cycle_length_days,code==='00251'?28:21);assert(!ph.planned_cycles);assert.match(ph.administration[0].dose,/4–6/);assert.deepEqual(ph.administration[0].day,[1]);assert.equal(ph.administration[0].infusion_minutes,30);assert.equal(ph.indication_ids.length,10);assert.match(p.treatment.dose_formula,/125/);}});
structural('High risk dedicated current carboplatin antiemetics for both',()=>{for(const p of Object.values(P)){assert.equal(p.supportive_care.emetogenic_risk,'high');assert.equal(p.supportive_care.script_id,'nccp-v8-carboplatin-v08420');assert.match(p.supportive_care.mapping_basis,/without routine olanzapine/);}});
structural('Nadir monitoring retained only where the source prescribes it',()=>{assert.match(P['00251'].monitoring.regular.join(' '),/Day13–15.*Day21/);assert(!/Day13|Day21/.test(P['00261'].monitoring.regular.join(' ')));for(const p of Object.values(P)){assert.match(p.monitoring.regular.join(' '),/48hours/);assert.match(p.monitoring.regular.join(' '),/110%/);assert.match(p.monitoring.disease,/no fixed CT\/echo\/DXA/);}});
structural('Sources current and machine input bugs removed',()=>{for(const p of Object.values(P)){assert.equal(p.metadata.source_version_date,'2026-06-12');assert.equal(p.metadata.source_last_reviewed_date,'2021-07-28');assert.match(p.metadata.source_pdf_sha256,/^[a-f0-9]{64}$/);assert.match(p.metadata.source_text_sha256,/^[a-f0-9]{64}$/);assert(!p.input_definitions.serum_creatinine_change_percent);assert.equal(p.input_definitions.gfr.type,'number');assert.deepEqual(p.input_definitions.creatinine_ratio_baseline.derived_value,{operation:'ratio',fields:['current_creatinine','baseline_creatinine']});}});
structural('Every rule exercised and linked to exact source',()=>{for(const p of Object.values(P))for(const r of p.rule_engine.rules){assert(coverage.has(r.id),`Uncovered ${r.id}`);assert(r.source.url&&r.source.page);assert.equal(r.source.checked_date,'2026-10-25');assert(/NCCP .* v|HPRA/.test(r.source.document));}});
const out={checked_at:new Date().toISOString(),mode,total:results.length,passed:results.length-failed,failed,covered_rules:coverage.size,baseline_note:mode==='baseline'?'Frozen baseline evaluated against the identical independent oracle; failures expose existing gaps.':undefined,cases:results};
fs.writeFileSync(path.join(__dirname,`source-cases-${mode}.json`),JSON.stringify(out,null,2)+'\n');
console.log(`Carboplatin ${mode}: ${out.passed}/${out.total}; ${failed} failed; ${coverage.size} rules covered.`);
for(const r of results.filter(x=>!x.pass))console.error(`${r.code||'STRUCTURE'} ${r.name}: ${r.error}`);
process.exitCode=failed?1:0;
