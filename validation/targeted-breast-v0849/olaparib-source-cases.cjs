'use strict';
/* Source-derived numerical and clinical boundaries: NCCP00588v5b pp1–6,
 * EMA Lynparza SmPC4.2–4.4; OlympiA eligibility. No whole-patient clearance. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=process.env.SACT_REPO||path.resolve(__dirname,'../..');
const E=require(path.join(root,'js/assessment-engine')),D=require(path.join(root,'js/protocol-dose-schedule')),V=require(path.join(root,'js/protocol-validator'));
require(path.join(root,'js/ctcae-descriptors'));
const G=globalThis.SACTCheckCTCAE;
const p=JSON.parse(fs.readFileSync(path.join(root,'protocols/shared/00588-olaparib-tablet-monotherapy.json')));
const cases=[];let failures=0;
const clinical=r=>r.findings.filter(f=>!f.domainAssessment&&!/^PARTIAL_/.test(f.ruleId||''));
const text=r=>clinical(r).map(f=>f.explanation).join(' ');
const noDose=m=>assert(!m.rows.some(x=>/^\s*\d/.test(x.protocolDose||'')),'unresolved/hold state generated numeric dose');
function run(name,input,expected,source,extra){let item={name,input,expected,source};try{let r=E.assess(p,input),m=D.buildModificationModel(p,r);assert.deepEqual(r.errors,[]);assert.deepEqual(r.invalid,[]);if(expected)assert.equal(r.actionType,expected);if(extra)extra(r,m);item.pass=true;item.actual=r.actionType;item.findings=clinical(r).map(f=>({id:f.ruleId,action:f.actionType,explanation:f.explanation}));item.dose=m.rows.map(x=>({action:x.actionType,dose:x.protocolDose,quantified:x.quantified}));}catch(e){failures++;item.pass=false;item.error=e.message;}cases.push(item);}
function structure(name,fn){try{fn();cases.push({name,pass:true});}catch(e){failures++;cases.push({name,pass:false,error:e.message});}}
run('Blank input is incomplete',{},'incomplete','No inferred normal values');
for(const value of [0,.5,.99])run('ANC below1: '+value,{anc_x10e9_l:value},'delay_then_dose_reduce','NCCPp5Table2',(r,m)=>{assert(/recovery/.test(text(r)));noDose(m)});
for(const value of [1,1.01,2,5])run('ANC at/above1: '+value,{anc_x10e9_l:value},'proceed_with_caution','NCCPp5Table2',r=>assert(r.partialAssessment));
for(const value of [0,49,75,99,99.9])run('Platelets below100: '+value,{platelets_x10e9_l:value},'delay_then_dose_reduce','NCCPp5Table2',(r,m)=>noDose(m));
for(const value of [100,100.1,200])run('Platelets at/above100: '+value,{platelets_x10e9_l:value},'proceed_with_caution','NCCPp5Table2',r=>assert(r.partialAssessment));
for(const value of [0,1,2,3])run('Occurrence '+value+' alone does not cease',{haematological_toxicity_occurrence_number:value},null,'NCCPp5Table2 fourth occurrence',r=>assert(!clinical(r).some(f=>['cease','permanently_discontinue'].includes(f.actionType))));
for(const value of [4,5])run('Fourth/later occurrence '+value,{haematological_toxicity_occurrence_number:value},'cease','NCCPp5Table2',(r,m)=>noDose(m));
run('FN alone actionable without grade/history',{febrile_neutropenia:true},'delay_then_dose_reduce','NCCPp5Table2',(r,m)=>noDose(m));
for(const grade of [3,4])run('FNgrade '+grade+' alone',{febrile_neutropenia_grade:grade},'delay_then_dose_reduce','NCCPp5Table2',(r,m)=>noDose(m));
run('Grade4 FN with low counts does not offer a one-level numeric restart',{anc_x10e9_l:.4,febrile_neutropenia:true,febrile_neutropenia_grade:4,current_dose_level:'starting'},'delay_then_dose_reduce','NCCPp5Table2',(r,m)=>{noDose(m);assert(/two-level|two dose levels/.test(text(r)))});
run('FN fourth occurrence overrides renal reduction',{febrile_neutropenia:true,haematological_toxicity_occurrence_number:4,crcl_ml_min:40},'cease','NCCPp5Table2',(r,m)=>noDose(m));
for(const value of [0,1,7.99])run('Severe anaemia '+value,{hb_g_dl:value},'withhold','EMA4.4+CTCAEv5 grade3',(r,m)=>noDose(m));
for(const value of [8,9,9.99])run('Moderate anaemia '+value,{hb_g_dl:value},'consultant_review','EMA4.4+CTCAEv5 grade2',(r,m)=>noDose(m));
for(const value of [10,10.1,12])run('Hb grade1 or better '+value,{hb_g_dl:value},'proceed_with_caution','EMA4.4+CTCAEv5',r=>assert(r.partialAssessment));
for(const value of [0,20,29,29.999])run('CrCl severe '+value,{crcl_ml_min:value},'consultant_review','NCCPp5Table3 vs EMA4.2',(r,m)=>{noDose(m);assert(/EMA/.test(text(r)))});
run('CrCl exact30 must reveal NCCP/EMA conflict',{crcl_ml_min:30},'consultant_review','NCCP30–50 vs EMA≤30',(r,m)=>{noDose(m);assert(/exactly 30/.test(text(r)))});
for(const value of [30.001,31,40,49.999,50])run('CrCl moderate '+value,{crcl_ml_min:value},'dose_reduce','NCCPp5Table3',(r,m)=>assert(m.rows.some(x=>x.protocolDose==='200 mg twice daily')));
for(const value of [50.001,51,80,100])run('CrCl above50 '+value,{crcl_ml_min:value,current_dose_level:'-2'},'proceed_with_caution','NCCPp5Table3',(r,m)=>{assert(!m.rows.some(x=>/300/.test(x.protocolDose)));assert(/existing|Maintain/.test(text(r)))});
for(const [value,action]of [['renal_0_29','consultant_review'],['renal_exact30','consultant_review'],['renal_30_50','dose_reduce'],['renal_51_plus','proceed_with_caution'],['dialysis','consultant_review']])run('Renal UI band '+value,{crcl_ml_min:value},action,'NCCPp5Table3 / exact30 reconciliation');
run('Dialysis standalone does not require numeric CrCl',{haemodialysis:true},'consultant_review','NCCPp5Table3',(r,m)=>noDose(m));
for(const cls of ['A','B'])run('ChildPugh '+cls+' no re-escalation',{child_pugh_class:cls,current_dose_level:'-2'},'proceed_with_caution','NCCPp5Table3',(r,m)=>assert(!m.rows.some(x=>/300/.test(x.protocolDose))));
run('ChildPughC source conflict',{child_pugh_class:'C'},'consultant_review','NCCPp5Table3 vs EMA4.2',(r,m)=>{noDose(m);assert(/EMA does not recommend/.test(text(r)))});
for(const cls of ['strong','moderate']){
 run(cls+' CYP3A only: seek alternative first',{cyp3a_inhibitor_class:cls},'consultant_review','NCCPpp5–6Table4',(r,m)=>noDose(m));
 run(cls+' CYP3A avoidable',{cyp3a_inhibitor_class:cls,cyp3a_inhibitor_unavoidable:false},'consultant_review','NCCPpp5–6Table4',(r,m)=>noDose(m));
 run(cls+' CYP3A unavoidable',{cyp3a_inhibitor_class:cls,cyp3a_inhibitor_unavoidable:true},'dose_reduce','NCCPp6Table4',(r,m)=>assert(m.rows.some(x=>x.protocolDose===(cls==='strong'?'100':'150')+' mg twice daily')));
 run(cls+' CYP3A plus renal reduction needs reconciliation',{cyp3a_inhibitor_class:cls,cyp3a_inhibitor_unavoidable:true,crcl_ml_min:40},'consultant_review','No validated combined-reduction algorithm',(r,m)=>noDose(m));
}
for(const f of ['olaparib_hypersensitivity','previous_parp_inhibitor','pregnancy','breastfeeding'])run(f+' independently excludes',{[f]:true},'contraindicated','NCCPp4',(r,m)=>noDose(m));
for(const f of ['severe_haematological_toxicity','blood_transfusion_dependence','persistent_cytopenia_after_4_week_hold','suspected_pneumonitis','suspected_drug_induced_liver_injury'])run(f+' requires interruption',{[f]:true},'withhold','EMA4.4',(r,m)=>noDose(m));
for(const f of ['confirmed_mds_aml','confirmed_pneumonitis'])run(f+' requires discontinuation',{[f]:true},'permanently_discontinue','EMA4.4',(r,m)=>noDose(m));
for(const f of ['suspected_mds_aml','suspected_vte','strong_or_moderate_cyp3a_inducer','intolerable_nonhaematological_toxicity'])run(f+' requires review',{[f]:true},'consultant_review','EMA4.4/NCCPp5',(r,m)=>noDose(m));
run('Initial prior blood recovery not met',{recovered_previous_haematological_toxicity:false,anc_x10e9_l:1.2,platelets_x10e9_l:110},'withhold','EMA4.4 initial grade≤1 is stricter than NCCP continuation counts',(r,m)=>noDose(m));
run('Severe liver injury overrides numeric renal dose',{suspected_drug_induced_liver_injury:true,crcl_ml_min:40},'withhold','EMA4.4',(r,m)=>noDose(m));
run('Source conflict overrides interaction numeric dose',{child_pugh_class:'C',cyp3a_inhibitor_class:'strong',cyp3a_inhibitor_unavoidable:true},'consultant_review','Conflict must not make automatic dose',(r,m)=>noDose(m));
run('Confirmed pneumonitis overrides counts/reduction',{confirmed_pneumonitis:true,anc_x10e9_l:.2,crcl_ml_min:40},'permanently_discontinue','EMA4.4',(r,m)=>noDose(m));
const breast={indication_id:'adjuvant_high_risk_early_breast'};
for(const [f,v]of [['germline_brca_status','negative'],['germline_brca_status','unknown'],['her2_status','positive'],['her2_status','unknown'],['ecog',3],['prior_neoadjuvant_or_adjuvant_chemotherapy',false]])run('Breast eligibility '+f+' '+v,{...breast,[f]:v},'consultant_review','NCCPp3',(r,m)=>noDose(m));
for(const v of [0,1,2])run('Breast ECOG '+v,{...breast,ecog:v},null,'NCCPp3',r=>assert(!clinical(r).some(f=>f.ruleId==='BREAST_ECOG')));
for(const v of [11.99,12])run('Breast start at '+v+' weeks',{...breast,weeks_since_completion_of_last_local_or_systemic_treatment:v},null,'NCCPp3 idealwindow',r=>assert(!clinical(r).some(f=>f.ruleId==='BREAST_START_WINDOW')));
run('Breast start beyond12 is review not contraindication',{...breast,weeks_since_completion_of_last_local_or_systemic_treatment:12.01},'consultant_review','NCCPp3 ideally',r=>assert(!clinical(r).some(f=>f.actionType==='contraindicated')));
run('Neoadjuvant pCR not eligible in listed highrisk pathway',{...breast,breast_chemotherapy_setting:'neoadjuvant',residual_invasive_disease:false},'consultant_review','NCCPp3');
for(const v of [0,2.99])run('HRpositive neo CPS+EG '+v,{...breast,breast_receptor_group:'hr_positive',breast_chemotherapy_setting:'neoadjuvant',residual_invasive_disease:true,cps_eg_score:v},'consultant_review','NCCPp3 ≥3');
run('CPS+EG3 meets this criterion only',{...breast,breast_receptor_group:'hr_positive',breast_chemotherapy_setting:'neoadjuvant',cps_eg_score:3},null,'NCCPp3',r=>assert(!clinical(r).some(f=>f.ruleId==='BREAST_HRPOS_NEO_CPS_EG')));
for(const v of [0,3])run('HRpositive adjuvant nodes '+v,{...breast,breast_receptor_group:'hr_positive',breast_chemotherapy_setting:'adjuvant',positive_axillary_nodes:v},'consultant_review','NCCPp3 ≥4nodes');
run('Four nodes meets listed threshold',{...breast,breast_receptor_group:'hr_positive',breast_chemotherapy_setting:'adjuvant',positive_axillary_nodes:4},null,'NCCPp3',r=>assert(!clinical(r).some(f=>f.ruleId==='BREAST_HRPOS_ADJ_NODES')));
run('TNBC node-negative1.99cm not listedhighrisk',{...breast,breast_receptor_group:'tnbc',breast_chemotherapy_setting:'adjuvant',positive_axillary_nodes:0,primary_tumour_cm:1.99},'consultant_review','NCCPp3 ≥2cm');
for(const x of [{positive_axillary_nodes:0,primary_tumour_cm:2},{positive_axillary_nodes:1,primary_tumour_cm:1}])run('TNBC nodes/size meets criterion '+JSON.stringify(x),{...breast,breast_receptor_group:'tnbc',breast_chemotherapy_setting:'adjuvant',...x},null,'NCCPp3',r=>assert(!clinical(r).some(f=>f.ruleId==='BREAST_TNBC_ADJ_SIZE')));
run('Breast one-year completion review',{...breast,months_on_olaparib:12},'consultant_review','NCCPp2');
for(const ind of ['first_line_advanced_ovarian_maintenance','platinum_sensitive_relapsed_ovarian_maintenance','mcrpc_brca_monotherapy','pancreatic_maintenance'])run('Other indication not subjected to breast duration/eligibility '+ind,{indication_id:ind,months_on_olaparib:24,her2_status:'positive',germline_brca_status:'negative',positive_axillary_nodes:0,breast_receptor_group:'hr_positive',breast_chemotherapy_setting:'adjuvant',anc_x10e9_l:2},'proceed_with_caution','Shared indication isolation',r=>assert(!clinical(r).some(f=>f.ruleId.startsWith('BREAST_'))));
run('Radiation gap shorter2weeks requires sequencing review',{...breast,weeks_since_radiotherapy:1.99},'consultant_review','OlympiA2021 methods');
run('Radiation gap2weeks does not trigger warning',{...breast,weeks_since_radiotherapy:2},null,'OlympiA2021 methods',r=>assert(!clinical(r).some(f=>f.ruleId==='BREAST_RADIATION_GAP')));
run('Age below18 requires review',{age_years:17},'consultant_review','NCCP adult indications / EMA4.2');
run('Adult age alone is not clearance',{age_years:18},null,'NCCP adult indications',r=>assert(!clinical(r).some(f=>f.ruleId==='AGE_UNDER18')));
structure('Protocol validates; source references and governance retained',()=>{assert(V.validate(p,{strict:true}).valid);assert.deepEqual(p.required_inputs,[]);assert.equal(p.metadata.sactcheck_encoding_version,'0.84.21');assert.equal(p.protocol_id,'nccp-00588-v5b');assert.equal(p.metadata.validation.clinical_use_authorised,false);for(const r of p.rule_engine.rules){assert(r.source.url);assert(r.source.page);assert.equal(r.source.checked_date,'2026-10-20');assert.deepEqual(r.action.components,['olaparib']);}});
structure('All shared tissue indications retained with correct durations',()=>{assert.equal(p.indications.find(i=>i.indication_id==='adjuvant_high_risk_early_breast').duration.maximum_years,1);assert.equal(p.indications.find(i=>i.indication_id==='first_line_advanced_ovarian_maintenance').duration.maximum_years_if_no_radiological_evidence_of_disease,2);for(const id of ['mcrpc_brca_monotherapy','pancreatic_maintenance'])assert(p.indications.find(i=>i.indication_id===id));assert(!/HRR-mutated/.test(p.indications.find(i=>i.indication_id==='00588-gu').description));});
structure('Continuous treatment has no invented rest week',()=>{const m=D.buildModel(p);assert.equal(m.phases[0].cycleLength,null);assert.equal(m.phases[0].components[0].dose,'300 mg twice daily');assert.deepEqual(m.phases[0].components[0].days,['Every day']);});
structure('Every encoded rule has a positive source-derived test',()=>{let ids=new Set(cases.flatMap(c=>(c.findings||[]).map(f=>f.id)));for(const r of p.rule_engine.rules)assert(ids.has(r.rule_id),r.rule_id+' unexercised');});
// Exercise the real UI grading helper, not just the presence of metadata.
for(const id of ['anc_x10e9_l','platelets_x10e9_l'])structure(id+' guide retains NCCP numeric actions without inferred v6 grades',()=>{const d={id,...p.input_definitions[id]},g=G.guide(d);assert(g.sourceSpecific);assert.match(g.version,/NCCP 00588 v5b/);assert.match(g.guidance,/ANC below 1 OR platelets below 100/);assert.equal(g.calculable,false);assert.deepEqual(g.grades,[]);assert.equal(g.comparison,null);assert.equal(G.gradeForValue(d,id==='anc_x10e9_l'?0.2:20),null);assert.equal(g.sourceUrl,p.metadata.source_url);});
structure('Initial blood recovery guide uses SmPC requirement rather than generic grades',()=>{const g=G.guide({id:'recovered_previous_haematological_toxicity',...p.input_definitions.recovered_previous_haematological_toxicity});assert(g.sourceSpecific);assert.deepEqual(g.grades,[]);assert.match(g.guidance,/before|Before/);assert.match(g.note,/does not name a CTCAE version/);});
structure('Hb helper matches the explicit v5 source used by the Hb rules',()=>{const d={id:'hb_g_dl',...p.input_definitions.hb_g_dl},g=G.guide(d);assert.equal(g.version,'CTCAE v5.0');assert.match(g.sourceUrl,/ctcae-v5/);assert.equal(G.gradeForValue(d,7.99).grade,3);assert.equal(G.gradeForValue(d,8).grade,2);assert.equal(G.gradeForValue(d,10).grade,null);assert.match(g.grades.find(x=>x.grade===3).description,/transfusion/);});
structure('FN boolean and severity selector share explicit v5 criteria',()=>{for(const id of ['febrile_neutropenia','febrile_neutropenia_grade']){const g=G.guide({id,...p.input_definitions[id]});assert.equal(g.version,'CTCAE v5.0');assert.match(g.sourceUrl,/ctcae-v5/);assert.match(g.grades.find(x=>x.grade===3).description,/38.3/);assert.match(g.grades.find(x=>x.grade===4).description,/Life-threatening/);}});
const out={checked_at:new Date().toISOString(),protocol:p.protocol_id,source:'NCCP00588v5b+EMA SmPC+OlympiA',total:cases.length,passed:cases.length-failures,failed:failures,cases};fs.writeFileSync(path.join(__dirname,'olaparib-source-cases-results.json'),JSON.stringify(out,null,2)+'\n');console.log(`Olaparib source scenarios: ${out.passed}/${out.total} passed`);for(const c of cases.filter(c=>!c.pass))console.error(c.name,c.error);process.exitCode=failures?1:0;
