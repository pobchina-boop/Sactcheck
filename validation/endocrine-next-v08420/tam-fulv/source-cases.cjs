'use strict';
// Source scenarios: NCCP00253v6/00361v4, HPRA Tamox30Jun2026 and EMA Faslodex.
// Expectations are tied to source claims, not generated from the encoded rules.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const H=__dirname,R=path.resolve(H,'../../..');
const arg=process.argv.indexOf('--mode'),mode=arg>=0?process.argv[arg+1]:(process.argv[2]||'proposed');
assert(['baseline','proposed','integrated'].includes(mode));
const dir=mode==='integrated'?path.join(R,'protocols/breast'):mode==='baseline'?path.join(H,'../baseline'):path.join(H,'proposed');
const E=require(path.join(R,'js/assessment-engine')),D=require(path.join(R,'js/protocol-dose-schedule')),V=require(path.join(R,'js/protocol-validator'));
const P=Object.fromEntries(['00253','00361'].map(c=>[c,JSON.parse(fs.readFileSync(path.join(dir,fs.readdirSync(dir).find(f=>f.startsWith(c+'-')))))])),cases=[];
const HPRA='https://assets.hpra.ie/products/Human/19894/Licence_PA0711-022-002_30062026111821.pdf',EMA='https://www.ema.europa.eu/en/documents/product-information/faslodex-epar-product-information_en.pdf';
function run(c,name,input,fn,source={url:P[c].metadata.source_url,page:'pp1–3'}){const row={code:c,name,input,source};try{const r=E.assess(P[c],input),f=r.findings.filter(x=>!x.domainAssessment&&!/^PARTIAL_/.test(x.ruleId||'')),m=D.buildModificationModel(P[c],r);row.actual={action:r.actionType,findings:f.map(x=>({id:x.ruleId,action:x.actionType,text:x.explanation})),invalid:r.invalid,errors:r.errors};assert.deepEqual(r.errors,[]);require("../../../tests/helpers/source-input-validation-v08421.cjs")(r);fn({r,f,m});row.pass=true}catch(e){row.pass=false;row.error=e.message}cases.push(row)}
const has=(kind,pattern)=>({r,f,m})=>{assert(f.some(x=>x.actionType===kind&&(!pattern||new RegExp(pattern,'i').test(x.explanation))),kind+': '+pattern);assert.notEqual(r.actionType,'proceed');if(['consultant_review','withhold','contraindicated','permanently_discontinue'].includes(kind))assert(!m.rows.some(x=>x.quantified&&/^\s*\d/.test(String(x.protocolDose))),'Unresolved/unsafe action must not emit numeric prescription');};
const no=(pattern)=>({r,f})=>{assert(!f.some(x=>new RegExp(pattern,'i').test(x.ruleId+' '+x.explanation)));assert.notEqual(r.actionType,'proceed')};
function content(c,name,fn){const row={code:c,name,source:{url:P[c].metadata.source_url}};try{fn(P[c]);row.pass=true}catch(e){row.pass=false;row.error=e.message}cases.push(row)}
for(const c of ['00253','00361']){
 run(c,'Blank is incomplete',{},q=>assert.equal(q.r.actionType,'incomplete'));
 for(const fld of ['anc_x10e9_l','platelets_x10e9_l','hb_g_dl'])for(const value of [0,.5,1,20,75,100,200])run(c,'No invented endocrine dose threshold '+fld+'='+value,{[fld]:value},q=>{assert.equal(q.r.actionType,'incomplete');assert(!q.f.some(x=>['withhold','delay','dose_reduce'].includes(x.actionType)))});
 for(const fld of ['pregnancy','breastfeeding',c==='00253'?'tamoxifen_hypersensitivity':'fulvestrant_hypersensitivity']){
  run(c,fld+' independently excludes',{[fld]:true},has('contraindicated',fld==='pregnancy'?'Pregnancy':fld==='breastfeeding'?'Breastfeeding':'Hypersensitivity'));
  run(c,fld+' false does not exclude',{[fld]:false},no('contraindicated|withhold'));
 }
 for(const s of ['negative','unknown'])run(c,'ER '+s,{er_status:s},has('consultant_review','ER'));
 run(c,'ER positive only remains partial',{er_status:'positive'},no('ER.*does not|ER status must'));
 content(c,'Explicit source version, stable route and no clinical approval',p=>{assert.equal(p.protocol_id,`nccp-${c}-vcurrent`);assert.equal(p.metadata.nccp_version,c==='00253'?'6':'4');for(const f of ['consultant_reviewed','oncology_pharmacy_reviewed','clinical_use_authorised'])assert.equal(p.metadata.validation[f],false);assert.deepEqual(p.required_inputs,[]);assert(V.validate(p,{strict:true}).valid)});
 content(c,'Every rule has source provenance',p=>{for(const q of p.rule_engine.rules){assert(q.source.url);assert(q.source.page);assert(q.source.checked_date)}});
}
const t='00253';
for(const s of ['pre','peri','post'])run(t,'Both menopause settings allowed '+s,{menopausal_status:s},q=>{assert.equal(q.r.actionType,'incomplete');assert(!q.f.some(x=>x.actionType==='contraindicated'))});
run(t,'Significant historical VTE remains NCCP exclusion',{history_significant_thromboembolism:true},has('contraindicated','significant'));
for(const fld of ['active_or_recent_vte','suspected_acute_vte'])run(t,fld+' urgent hold',{[fld]:true},has('withhold','clot|thrombo|embol|VTE'));
for(const fld of ['unexplained_vaginal_bleeding','visual_symptoms','strong_cyp2d6_inhibitor','coumarin_anticoagulant','cyp3a4_inducer','planned_surgery_or_immobility']){
 run(t,fld+' review',{[fld]:true},has('consultant_review'));
 run(t,fld+' absent',{[fld]:false},no('withhold|contraindicated|dose_reduce'));
}
run(t,'Coumarin treatment is not a cancer-treatment contraindication',{coumarin_anticoagulant:true},q=>{has('consultant_review','INR')(q);assert(!q.f.some(x=>x.actionType==='contraindicated'))});
run(t,'Surgery has individual interruption plan',{planned_surgery_or_immobility:true},q=>{has('consultant_review')(q);assert(!q.f.some(x=>x.actionType==='withhold'))});
run(t,'Concurrent anastrozole: Irish/UK product distinction',{concurrent_anastrozole:true},has('consultant_review','Irish.*UK'),{url:HPRA,page:'§4.5,p3'});
run(t,'Risk-triggered ECG does not create universal four-week test',{qt_risk_factors:true},q=>{has('consultant_review','ECG')(q);assert(!q.f.some(x=>/at least 4 weeks|repeat.*four weeks/.test(x.explanation)))},{url:HPRA,page:'§4.4–4.5,pp2–3'});
run(t,'Cardiac symptoms prompt assessment',{new_cardiac_symptoms:true},has('consultant_review','assessment'));
run(t,'Electrolyte risk: assess severity without invented blanket hold',{uncorrected_electrolyte_abnormality:true},has('consultant_review','severity'),{url:HPRA,page:'§4.4–4.5,pp2–3'});
for(const fld of ['suspected_sjs_ten','previous_tamoxifen_sjs_ten'])run(t,fld,{[fld]:true},has(fld.startsWith('previous')?'permanently_discontinue':'withhold','SJS|TEN|Stevens'));
for(const [fld,pattern]of [['serious_cytopenia','cytopenia|thrombocytopenia'],['hypercalcaemia','hypercalcaemia'],['hereditary_angioedema','angioedema'],['concurrent_oestrogen_preparation','oestrogen'],['antiplatelet_treatment','platelet'],['intolerable_toxicity','Intolerable'],['preexisting_hyperlipidaemia','lipid']]){
 run(t,fld+' present',{[fld]:true},has('consultant_review',pattern),{url:fld==='intolerable_toxicity'||fld==='preexisting_hyperlipidaemia'?P[t].metadata.source_url:HPRA,page:'NCCPpp2–3 / SmPC§4.4–4.5'});
 run(t,fld+' absent',{[fld]:false},no('withhold|contraindicated|dose_reduce'));
}
run(t,'Intolerable grade1 still warrants review',{other_toxicity_grade:1,intolerable_toxicity:true},has('consultant_review','Intolerable'));
for(const grade of [3,4])run(t,'Severe toxicity grade'+grade,{other_toxicity_grade:grade},has('consultant_review'));
for(const grade of [0,1,2])run(t,'No generic reduction grade'+grade,{other_toxicity_grade:grade},no('TAM_TOX'));
for(const value of ['mild','moderate'])run(t,'Hepatic '+value+' no adjustment',{hepatic_impairment:value},q=>{assert(q.f.some(x=>x.actionType==='proceed'));assert.notEqual(q.r.actionType,'proceed')});
run(t,'Severe hepatic category',{hepatic_impairment:'severe'},has('withhold','Severe'));
run(t,'Severe hepatic independent flag',{severe_hepatic_impairment:true},has('withhold','Severe'));
for(const fld of ['renal_impairment','haemodialysis'])run(t,fld+' no renal dose reduction',{[fld]:true},q=>{assert(q.f.some(x=>x.actionType==='proceed'));assert(!q.f.some(x=>x.actionType==='dose_reduce'));assert.notEqual(q.r.actionType,'proceed')});
for(const setting of ['prevention','neoadjuvant'])run(t,'Unmapped setting '+setting,{treatment_setting:setting},has('consultant_review'));
content(t,'Daily20mg; no planned off-week or repeat missed dose',p=>{const m=D.buildModel(p);assert.equal(m.phases.length,1);assert.equal(m.phases[0].cycleLength,null);assert.equal(m.phases[0].components[0].dose,'20 mg once daily');assert.deepEqual(m.phases[0].components[0].days,['Every day']);assert.match(m.phases[0].components[0].note,/missed or vomited dose/)});
content(t,'Monitoring reconciles current Irish product details',p=>{const s=JSON.stringify(p.monitoring);assert.match(s,/ophthalmological examination at initiation/);assert.match(s,/blood count including platelets, liver tests and calcium/);assert.match(s,/frequency is not specified/);assert.match(s,/annual gynaecological/i);assert.match(s,/not a universal ultrasound/);assert.match(s,/No routine|no routine/)});
const f='00361';
for(const value of ['B','C'])run(f,'Child-Pugh '+value,{child_pugh_class:value},has(value==='B'?'consultant_review':'withhold',value==='B'?'Source conflict':'Severe|severe'));
run(f,'Child-PughA caution no reduction',{child_pugh_class:'A'},has('consultant_review','no reduction'));
run(f,'Severe hepatic flag independent',{severe_hepatic_impairment:true},has('withhold','Severe|severe'));
for(const dose of [200,250,499,501,750])run(f,'Actual nonstandard dose preserved '+dose,{current_fulvestrant_dose_mg:dose},has('consultant_review','current.*prescription'));
run(f,'Standard current dose does not invent eligibility',{current_fulvestrant_dose_mg:500},no('CURRENT_DOSE_REVIEW'));
for(const dose of [200,250,500])run(f,'ChildPughB conflict persists at actual dose'+dose,{child_pugh_class:'B',current_fulvestrant_dose_mg:dose},has('consultant_review','Source conflict'));
run(f,'Renal no-adjustment must not restore a lower prescription',{renal_band:'ge30',current_fulvestrant_dose_mg:250},has('consultant_review','automatically increase'));
for(const value of ['lt30','dialysis'])run(f,'Renal source caution '+value,{renal_band:value},has('consultant_review','no.*adjustment|no.*reduc|none'));
run(f,'CrCl>=30 category no renal reduction',{renal_band:'ge30'},q=>{assert(q.f.some(x=>x.actionType==='proceed'));assert(!q.f.some(x=>x.actionType==='dose_reduce'));assert.notEqual(q.r.actionType,'proceed')});
for(const fld of ['bleeding_diathesis','thrombocytopenia','anticoagulant_treatment','injection_site_neuropathic_symptoms','vte_risk_factors','estradiol_assay_concern','critical_visceral_disease','companion_anticancer_medicine']){
 run(f,fld+' independent review',{[fld]:true},has('consultant_review'));
 run(f,fld+' absent',{[fld]:false},no('withhold|contraindicated|dose_reduce'));
}
run(f,'Estradiol immunoassay can be falsely high',{estradiol_assay_concern:true},has('consultant_review','falsely'),{url:EMA,page:'§4.4,p4'});
run(f,'Companion medicine needs its complete regimen',{companion_anticancer_medicine:true},has('consultant_review','capivasertib|CDK4'),{url:P[f].metadata.source_url,page:1});
for(const e of [0,1,2])run(f,'ECOG source-eligible but partial '+e,{ecog:e},no('FULV_ECOG'));
for(const e of [3,4])run(f,'ECOG outside source '+e,{ecog:e},has('consultant_review','ECOG'));
for(const fld of ['postmenopausal','prior_anti_oestrogen_relapse_or_progression']){
 run(f,fld+' not met',{[fld]:false},has('consultant_review'));
 run(f,fld+' met only one domain',{[fld]:true},no('FULV_MENOPAUSE|FULV_PRIOR_TREATMENT'));
}
for(const setting of ['adjuvant','neoadjuvant'])run(f,'Unmapped setting '+setting,{treatment_setting:setting},has('consultant_review'));
content(f,'Loading D1D15 then q28 with two IM injections',p=>{const m=D.buildModel(p);assert.equal(m.phases.length,2);assert.deepEqual(m.phases[0].components[0].days,['1','15']);assert.deepEqual(m.phases[1].components[0].days,['1']);for(const ph of m.phases){assert.equal(ph.cycleLength,28);assert.equal(ph.components[0].dose,'500 mg');assert.equal(ph.components[0].route,'IM');assert.match(ph.components[0].note,/Two 5 mL/)}});
content(f,'No cytotoxic blood-count ladder or inherited routine cardiac schedule',p=>{assert(!p.rule_engine.rules.some(q=>/"field":"(?:anc_x10e9_l|platelets_x10e9_l)"/.test(JSON.stringify(q.when))));const s=JSON.stringify(p.monitoring);assert.match(s,/Liver profile when clinically indicated/);assert.match(s,/No universal ECG/)});
const failed=cases.filter(c=>!c.pass),result={checked_at:new Date().toISOString(),mode,total:cases.length,passed:cases.length-failed.length,failed:failed.length,scope:'Source-derived software scenarios; not independent clinical or pharmacy authorisation',cases};
fs.writeFileSync(path.join(H,mode+'-results.json'),JSON.stringify(result,null,2)+'\n');console.log(`Tamoxifen/fulvestrant ${mode}: ${result.passed}/${result.total} passed`);for(const x of failed)console.error(x.code,x.name,x.error);process.exitCode=failed.length?1:0;
