// v0.84.20 explicitly supersedes the 2026-10-18 source snapshot and product conflicts.
// Keep the historical oracle below for its original encoding; use the expanded source-derived oracle for migrated protocols.
{ const fs=require('fs'),path=require('path'),cp=require('child_process'),root=path.resolve(__dirname,'../..');
 const migrated=["00253", "00361"].every(c=>{const f=fs.readdirSync(path.join(root,'protocols/breast')).find(f=>f.startsWith(c+'-'));return JSON.parse(fs.readFileSync(path.join(root,'protocols/breast',f))).metadata.full_suite_release==='0.84.20'});
 if(migrated){const result=cp.spawnSync(process.execPath,[path.join(root,'validation/endocrine-next-v08420/tam-fulv/source-cases.cjs'),'--mode','integrated'],{stdio:'inherit'});process.exit(result.status??1);}
}
'use strict';
/* Source-derived endocrine audit, not generic chemotherapy thresholds.
 * NCCP00253v6 pp1–3; NCCP00361v4 pp1–3; linked manufacturer SmPC sections.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const repo=process.env.SACT_REPO||path.resolve(__dirname,'../..');
const E=require(path.join(repo,'js/assessment-engine')),D=require(path.join(repo,'js/protocol-dose-schedule')),V=require(path.join(repo,'js/protocol-validator'));
const P=Object.fromEntries(['00253','00361'].map(c=>[c,JSON.parse(fs.readFileSync(path.join(repo,'protocols/breast',fs.readdirSync(path.join(repo,'protocols/breast')).find(x=>x.startsWith(c+'-'))),'utf8'))]));
let failed=0;const cases=[];const clinical=r=>r.findings.filter(f=>!f.domainAssessment&&!/^PARTIAL_/.test(f.ruleId||''));
const holds=new Set(['contraindicated','withhold','delay','permanently_discontinue','dose_reduce']);
const text=r=>clinical(r).map(f=>f.explanation||'').join(' ');
function noNumeric(m){assert(!(m.rows||[]).some(r=>r.quantified&&/^\s*\d/.test(String(r.protocolDose))),'Unsafe/unresolved state displays numeric dose');}
function run(code,name,input,expect,source,extra){const item={code,name,input,source};try{const r=E.assess(P[code],input),m=D.buildModificationModel(P[code],r);assert.deepEqual(r.errors,[]);assert.deepEqual(r.invalid,[]);if(expect)assert.equal(r.actionType,expect);for(const f of clinical(r))assert.deepEqual(f.action.components,[code==='00253'?'tamoxifen':'fulvestrant']);if(['incomplete','withhold','contraindicated','permanently_discontinue'].includes(expect))noNumeric(m);if(extra)extra(r,m);item.actual=r.actionType;item.findings=clinical(r).map(f=>({id:f.ruleId,action:f.actionType,explanation:f.explanation}));item.visibleDose=m.rows.map(r=>({dose:r.protocolDose,quantified:r.quantified,action:r.actionType}));item.pass=true;}catch(e){failed++;item.pass=false;item.error=e.message;}cases.push(item);}
function structural(name,fn){try{fn();cases.push({name,pass:true});}catch(e){failed++;cases.push({name,pass:false,error:e.message});}}
for(const c of ['00253','00361']){
 run(c,'Blank input cannot clear treatment',{},'incomplete','Missing data are not normal');
 for(const field of ['anc_x10e9_l','platelets_x10e9_l','hb_g_dl'])for(const value of [0,0.5,1,20,75,100,200])run(c,`Isolated ${field}=${value} is monitoring-only`,{[field]:value},'incomplete','NCCPp2 baseline bloods; no drug-specific numerical cytopenia dose algorithm',r=>assert(!clinical(r).some(f=>holds.has(f.actionType))));
 for(const field of ['pregnancy','breastfeeding',c==='00253'?'tamoxifen_hypersensitivity':'fulvestrant_hypersensitivity']){
  run(c,field+' exclusion independently',{[field]:true},'contraindicated','NCCPp1 exclusions');
  run(c,field+' false does not create exclusion',{[field]:false},null,'No default risk assumptions',r=>assert(!clinical(r).some(f=>holds.has(f.actionType))));
 }
 for(const value of ['negative','unknown'])run(c,'ER '+value,{er_status:value},'consultant_review','NCCPp1 indications');
 run(c,'ER positive alone does not require other inputs',{er_status:'positive'},null,'Single-input assessment supported',r=>assert(!clinical(r).some(f=>holds.has(f.actionType))));
 for(const value of ['pre','post'])if(c==='00253')run(c,'Tamoxifen '+value+' menopause accepted as context',{menopausal_status:value},'incomplete','NCCPp1 both pre/post; contextual input is not clearance');
}
for(const field of ['history_significant_thromboembolism','concurrent_anastrozole'])run('00253',field,{[field]:true},'contraindicated',field.startsWith('history')?'NCCPp1':'Tamoxifen SmPC4.3');
for(const field of ['active_or_recent_vte','suspected_acute_vte','uncorrected_electrolyte_abnormality','suspected_sjs_ten','severe_hepatic_impairment'])run('00253',field,{[field]:true},'withhold',field==='severe_hepatic_impairment'?'NCCPp2Table1':'Tamoxifen SmPC4.4');
run('00253','Confirmed tamoxifen SJS/TEN prohibits rechallenge',{previous_tamoxifen_sjs_ten:true},'permanently_discontinue','Tamoxifen SmPC4.4');
for(const field of ['unexplained_vaginal_bleeding','visual_symptoms','strong_cyp2d6_inhibitor','coumarin_anticoagulant','cyp3a4_inducer','qt_risk_factors','new_cardiac_symptoms','planned_surgery_or_immobility']){
 run('00253',field+' requires specific review',{[field]:true},'consultant_review','NCCPp3 / manufacturer SmPC4.4–4.5',(r,m)=>{noNumeric(m);if(field==='coumarin_anticoagulant'){assert(/INR/.test(text(r)));assert(!clinical(r).some(f=>f.actionType==='contraindicated'));}if(field==='qt_risk_factors')assert(/at least 4 weeks/.test(text(r)));if(field==='planned_surgery_or_immobility')assert(/no universal six-week/.test(text(r)));});
 run('00253',field+' negative does not block',{[field]:false},null,'False is not a safety trigger',r=>assert(!clinical(r).some(f=>holds.has(f.actionType))));
}
for(const grade of [0,1,2,3,4])run('00253','Reported toxicity grade '+grade,{other_toxicity_grade:grade},grade>=3?'consultant_review':null,'NCCPp2 no generic grade-based dose ladder',r=>assert(!clinical(r).some(f=>holds.has(f.actionType))));
for(const value of ['none','mild','moderate','severe'])run('00253','Hepatic category '+value,{hepatic_impairment:value},value==='severe'?'withhold':null,'NCCPp2 Table1',r=>{if(value!=='severe')assert(!clinical(r).some(f=>holds.has(f.actionType)));});
for(const field of ['renal_impairment','haemodialysis'])run('00253',field+' no numerical reduction',{[field]:true},'proceed_with_caution','NCCPp2Table1',(r,m)=>assert(!clinical(r).some(f=>holds.has(f.actionType))));
for(const value of ['neoadjuvant','prevention'])run('00253','Unmapped setting '+value,{treatment_setting:value},'consultant_review','NCCPp1 mapping limited to adjuvant/advanced');
run('00253','Bleeding with pregnancy must retain exclusion',{unexplained_vaginal_bleeding:true,pregnancy:true},'contraindicated','Exclusion overrides symptom review');
run('00253','Renal no-adjustment cannot override liver exclusion',{renal_impairment:true,hepatic_impairment:'severe'},'withhold','NCCPp2 concurrent organ findings');
run('00361','Child-Pugh A no automatic reduction',{child_pugh_class:'A'},'consultant_review','NCCPp1caution,p2 no reduction',r=>assert(/no reduction/.test(text(r))));
run('00361','Child-Pugh B visible absolute dose',{child_pugh_class:'B'},'dose_reduce','NCCPp2Table1 50%=250mg, EMA discrepancy explicit',(r,m)=>{assert(m.rows.some(x=>x.quantified&&/^250 mg$/.test(x.protocolDose)));assert(/SmPC/.test(text(r)));assert(/reconcile/.test(text(r)));});
run('00361','Child-Pugh C is exclusion',{child_pugh_class:'C'},'withhold','NCCPp1exclusion/p2Table1');
run('00361','Independent severe liver flag',{severe_hepatic_impairment:true},'withhold','NCCPp1exclusion');
run('00361','Conflicting B and severe flag suppresses numeric dose',{child_pugh_class:'B',severe_hepatic_impairment:true},'withhold','Severe exclusion dominates reduction');
run('00361','B with pregnancy suppresses numeric dose',{child_pugh_class:'B',pregnancy:true},'contraindicated','Exclusion dominates reduction');
for(const [band,act]of [['ge30','proceed_with_caution'],['lt30','consultant_review'],['dialysis','consultant_review']])run('00361','Renal source category '+band,{renal_band:band},act,'NCCPp1caution/p2Table1 no adjustment expected',r=>assert(!clinical(r).some(f=>f.actionType==='dose_reduce'||f.actionType==='contraindicated')));
for(const field of ['bleeding_diathesis','thrombocytopenia','anticoagulant_treatment','injection_site_neuropathic_symptoms','vte_risk_factors','estradiol_assay_concern','critical_visceral_disease']){
 run('00361',field+' specific caution',{[field]:true},'consultant_review','NCCPp1/p3 or EMA4.4',(r,m)=>{noNumeric(m);if(field==='anticoagulant_treatment')assert(/does not require automatic interruption/.test(text(r)));if(field==='estradiol_assay_concern')assert(/falsely raise/.test(text(r)));});
 run('00361',field+' false no invented restriction',{[field]:false},null,'False does not trigger caution',r=>assert(!clinical(r).some(f=>holds.has(f.actionType))));
}
for(const e of [0,1,2,3,4])run('00361','ECOG '+e,{ecog:e},e>2?'consultant_review':null,'NCCPp1 ECOG0–2',r=>{if(e<=2)assert(!clinical(r).some(f=>holds.has(f.actionType)));});
for(const field of ['postmenopausal','prior_anti_oestrogen_relapse_or_progression']){
 run('00361',field+' false requires eligibility review',{[field]:false},'consultant_review','NCCPp1 exact indications');
 run('00361',field+' true does not invent other domains',{[field]:true},null,'Single criterion only',r=>assert(!clinical(r).some(f=>holds.has(f.actionType))));
}
for(const s of ['adjuvant','neoadjuvant'])run('00361','Unmapped setting '+s,{treatment_setting:s},'consultant_review','NCCPp1 locally advanced/metastatic only');
structural('Exact source metadata and stable IDs',()=>{for(const[c,v]of [['00253','6'],['00361','4']]){const p=P[c];assert.equal(p.protocol_id,`nccp-${c}-vcurrent`);assert.equal(p.metadata.canonical_protocol_id,`nccp-${c}-v${v}`);assert.equal(p.metadata.source_document_pages,4);assert.equal(p.metadata.sactcheck_encoding_version,'0.84.2');for(const f of ['clinical_use_authorised','consultant_reviewed','oncology_pharmacy_reviewed'])assert.equal(p.metadata.validation[f],false);assert(V.validate(p,{strict:true}).valid);assert.deepEqual(p.required_inputs,[]);for(const d of Object.values(p.input_definitions))assert.equal(d.required,false);}});
structural('All rules individually source-linked',()=>{for(const p of Object.values(P))for(const r of p.rule_engine.rules){assert(r.source.url);assert(r.source.page);assert.equal(r.source.checked_date,'2026-10-18');assert(!/legacy|pending/i.test(r.source.document));}});
structural('Tamoxifen 20mg daily without fictitious cycle',()=>{const m=D.buildModel(P['00253']);assert.equal(m.phases.length,1);assert.equal(m.phases[0].cycleLength,null);assert.equal(m.phases[0].components[0].dose,'20 mg once daily');assert.deepEqual(m.phases[0].components[0].days,['Every day']);assert(/missed or vomited dose/.test(m.phases[0].components[0].note));});
structural('Fulvestrant initial extra injection and q28 ongoing schedule',()=>{const m=D.buildModel(P['00361']);assert.equal(m.phases.length,2);assert.deepEqual(m.phases[0].components[0].days,['1','15']);assert.deepEqual(m.phases[1].components[0].days,['1']);for(const x of m.phases){assert.equal(x.cycleLength,28);assert.equal(x.components[0].dose,'500 mg');assert.equal(x.components[0].route,'IM');assert(/Two 5 mL/.test(x.components[0].note));}});
structural('No generic haematological toxicity field or reduction in fulvestrant',()=>{assert(!P['00361'].input_definitions.haematological_toxicity_grade);assert(!P['00361'].rule_engine.rules.some(r=>/"field":"(?:anc_x10e9_l|platelets_x10e9_l|haematological_toxicity_grade)"/.test(JSON.stringify(r.when))));});
structural('Monitoring respects indication and risk',()=>{const tam=JSON.stringify(P['00253'].monitoring),fulv=JSON.stringify(P['00361'].monitoring);assert(/at least 4 weeks/.test(tam));assert(/Annual gynaecological/.test(tam));assert(/not a routine endometrial ultrasound/.test(tam));assert(/Adjuvant/.test(tam));assert(/Liver profile when clinically indicated/.test(fulv));assert(/No universal ECG/.test(fulv));assert(/No fixed drug-specific DXA interval/.test(fulv));});
const out={checked_at:new Date().toISOString(),repo,total:cases.length,passed:cases.length-failed,failed,cases};fs.writeFileSync(path.join(__dirname,'tam-fulv-source-cases-results.json'),JSON.stringify(out,null,2)+'\n');console.log(`Tamoxifen/fulvestrant source scenarios: ${out.passed}/${out.total} passed.`);for(const c of cases.filter(x=>!x.pass))console.error(c.code||'STRUCTURE',c.name,c.error);process.exitCode=failed?1:0;
