'use strict';
/* Source-derived test expectations: current NCCP00228 pp1–4/00743 pp1–5 and EMA Halaven SmPC§4.4.
 * Includes strict boundaries, isolated values, source gaps, recurrence history and displayed component doses.
 * Run: node validation/advanced-breast-v0841/eribulin-source-cases.cjs
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const repo=process.env.SACT_REPO||path.resolve(__dirname,'../..'), E=require(path.join(repo,'js/assessment-engine')),D=require(path.join(repo,'js/protocol-dose-schedule'));
const P=Object.fromEntries(['00228','00743'].map(c=>[c,JSON.parse(fs.readFileSync(path.join(repo,'protocols/breast',fs.readdirSync(path.join(repo,'protocols/breast')).find(x=>x.startsWith(c+'-'))),'utf8'))]));
const results=[];let failed=0;
const hold=new Set(['delay','withhold','contraindicated','withhold_then_reduce','delay_then_dose_reduce']),decision=new Set([...hold,'consultant_review','dose_reduce','dose_reduce_one_level','discontinue','permanently_discontinue']);
const clinical=r=>r.findings.filter(f=>!f.domainAssessment&&!/^PARTIAL_/.test(f.ruleId||''));
const body=r=>clinical(r).map(f=>f.explanation||'').join(' ');
function has(r,types){return clinical(r).some(f=>types.has(f.actionType));}
function noNumeric(m){assert(!(m.rows||[]).some(r=>r.quantified&&/^\s*\d/.test(String(r.protocolDose))),'Unresolved/withheld state displays a numeric restart');}
function dose(m,x){assert(m.rows.some(r=>r.quantified&&new RegExp('^'+String(x).replace('.','\\.')+' mg/m').test(r.protocolDose)),`Expected visible component dose ${x}mg/m²`);}
function run(code,name,input,check,source){const v={code,name,input,source};try{let r=E.assess(P[code],input),m=D.buildModificationModel(P[code],r);assert.deepEqual(r.errors,[]);assert.deepEqual(r.invalid,[]);for(const f of clinical(r))assert.deepEqual(f.action.components,['eribulin'],'Component scope must remain eribulin');check(r,m);v.actual=r.actionType;v.findings=clinical(r).map(f=>({id:f.ruleId,action:f.actionType,explanation:f.explanation}));v.visibleDose=m.rows.map(x=>({action:x.actionType,dose:x.protocolDose,quantified:x.quantified}));v.pass=true;}catch(e){v.pass=false;v.error=e.message;failed++;}results.push(v);}
function structural(name,check){try{check();results.push({name,pass:true});}catch(e){failed++;results.push({name,pass:false,error:e.message});}}
for(const c of ['00228','00743']){
 const renal=c==='00228'?'eribulin_renal_band':'crcl_ml_min',cp=c==='00228'?'child_pugh':'child_pugh_class',tox=c==='00228'?'other_nonhaem_toxicity_grade':'current_nonhaem_toxicity_grade';
 const events=c==='00228'?['prolonged_anc_below_0_5_over_7d','febrile_neutropenia','platelets_below_25_previous_cycle','platelets_below_50_with_bleeding_or_transfusion','previous_grade_3_4_nonhaem']:['anc_below_0_5_more_than_7_days','anc_below_1_with_fever_or_infection','platelets_below_25','platelet_bleeding_or_transfusion','previous_cycle_grade34_nonhaem'];
 run(c,'Blank input is incomplete',{},(r,m)=>{assert.equal(r.actionType,'incomplete');noNumeric(m);},'Missing data never normal');
 for(const [field,values]of [['anc_x10e9_l',[0.99,1,1.49,1.5]],['platelets_x10e9_l',[74.99,75,100,100.01]]])for(const stage of ['initial_eligibility','treatment_day',undefined])for(const v of values){
  const isAnc=field==='anc_x10e9_l',low=v<(isAnc?1:75),baselineFail=isAnc?v<1.5:v<=100;
  run(c,`${field}=${v} stage=${stage||'missing'}`,{[field]:v,...(stage?{assessment_phase:stage}:{})},(r,m)=>{
   if(low||(stage==='initial_eligibility'&&baselineFail)){assert(has(r,hold));noNumeric(m);}
   else if(!stage&&baselineFail){assert(has(r,new Set(['consultant_review'])));noNumeric(m);assert(/initial eligibility|starting counts/i.test(body(r)));}
   else assert(!has(r,decision),'Boundary meeting source criteria received a restriction');
  },'NCCPp1 baseline ANC≥1.5/platelets>100; p2 treatment ANC<1/platelets<75; absent stage cannot clear stricter eligibility');
 }
 for(const field of [tox,'neuropathy_grade','mucositis_grade'])for(const grade of [0,2,3,4])run(c,`${field} grade${grade} independently`,{[field]:grade},(r,m)=>{if(grade>=3){assert(has(r,hold));noNumeric(m);}else assert(!has(r,hold));},'NCCPp2 currentgrade3–4non-haematological delay includes named domains; no inventedgrade2hold');
 for(const event of events){
  run(c,`${event} with unknown prior dose`,{[event]:true},(r,m)=>{assert(has(r,new Set(['consultant_review'])));noNumeric(m);assert(/dose|recurrence/.test(body(r)));},'NCCPp3Table1/3 event is actionable even with missing dose');
  run(c,`${event} from1.23 after count recovery`,{[event]:true,current_eribulin_dose_level:'1.23',anc_x10e9_l:2,platelets_x10e9_l:150},(r,m)=>{assert(has(r,new Set(['dose_reduce'])));dose(m,0.97);assert(/recovery|recovered/.test(body(r)));},'NCCPp3 first qualifyingevent→0.97base; recovery retained in explanation');
  run(c,`${event} recurrence despite0.97`,{[event]:true,current_eribulin_dose_level:'0.97',toxicity_recurred_at_reduced_dose:true},(r,m)=>dose(m,0.62),'NCCPp3 recurrenceat0.97→0.62');
  run(c,`${event} recurrence despite0.62`,{[event]:true,current_eribulin_dose_level:'0.62',toxicity_recurred_at_reduced_dose:true},(r,m)=>{assert(has(r,new Set(['consultant_review'])));assert(/consider discontinuation/i.test(body(r)));assert(!has(r,new Set(['permanently_discontinue','discontinue'])));noNumeric(m);},'NCCPp3 considerdiscontinuation is notmandatorypermanentcessation');
  for(const recurrence of [undefined,false])run(c,`${event} reduced dose does not prove recurrence=${recurrence}`,{[event]:true,current_eribulin_dose_level:'0.97',...(recurrence===undefined?{}:{toxicity_recurred_at_reduced_dose:recurrence})},(r,m)=>{assert(has(r,new Set(['consultant_review'])));noNumeric(m);},'NCCPp3 recurrence despite reduced dose must be established');
  run(c,`${event} previous event but current ANCunsafe`,{[event]:true,current_eribulin_dose_level:'1.23',anc_x10e9_l:0.9},(r,m)=>{assert(has(r,hold));noNumeric(m);},'Currentdelay overrides future numericdose');
 }
 for(const field of ['hypersensitivity','breastfeeding','congenital_long_qt'])run(c,`${field} source exclusion`,{[field]:true},(r,m)=>{assert(has(r,new Set(['contraindicated'])));noNumeric(m);},'NCCPp2 explicitexclusion');
 run(c,'ECOG3 outside eligibility',{ecog:3},(r,m)=>{assert(has(r,new Set(['consultant_review'])));noNumeric(m);},'NCCPp1ECOG0–2');
 run(c,'ECOG2 meets performance criterion only',{ecog:2},r=>assert(!has(r,decision)),'NCCPp1 noautomaticwholepatientclearance');
 run(c,'Pregnancy is specialist risk–benefit not invented absolute NCCP exclusion',{pregnancy:true},(r,m)=>{assert(has(r,new Set(['withhold'])));assert(!has(r,new Set(['contraindicated'])));noNumeric(m);assert(/clearly necessary/.test(body(r)));},'EMA§4.6 conditionalpregnancyrestriction; NCCP doesnotlistexclusion');
 for(const value of [49.99,50,50.01])run(c,`Numeric CrCl${value}`,{creatinine_clearance_ml_min:value},(r,m)=>{if(value<50){assert(has(r,new Set(['consultant_review'])));assert(/80% of the original/.test(body(r)));noNumeric(m);}else if(c==='00228'&&value===50){assert(has(r,new Set(['consultant_review'])));assert(/does not assign exactly 50/.test(body(r)));noNumeric(m);}else assert(!has(r,decision));},'NCCPp3Table2:228strict>50/<50gap;743only<50doseadjustment');
 run(c,'CrCl<50 original dose percentage not current dose',{[renal]:'lt50',current_eribulin_dose_level:'0.62'},(r,m)=>{assert(/80% of the original/.test(body(r)));noNumeric(m);},'No re-escalation of previouslyreduceddose; noautomaticpercentcompounding');
 run(c,'Dialysis may consider not automatic dose',c==='00228'?{eribulin_renal_band:'dialysis'}:{haemodialysis:true},(r,m)=>{assert(has(r,new Set(['consultant_review'])));assert(/may be considered/.test(body(r)));noNumeric(m);},'NCCPp3Table2');
 for(const [value,pct]of [['A',80],['B',50]])run(c,`ChildPugh${value}`,{[cp]:value},(r,m)=>{assert(has(r,new Set(['consultant_review'])));assert(body(r).includes(`${pct}% of the original`));noNumeric(m);},'NCCPp3original-dosepercent; EMAabsolute hepaticdoses differ slightly; specialistreconciliation');
 run(c,'ChildPughC not recommended',{[cp]:'C'},(r,m)=>{assert(has(r,new Set(['contraindicated'])));noNumeric(m);},'NCCPp3Table2');
 run(c,'Hepatic+toxicity competing doses do not display numeric ladder target',{[cp]:'B',[events[0]]:true,current_eribulin_dose_level:'1.23'},(r,m)=>{assert(has(r,new Set(['consultant_review'])));noNumeric(m);},'No ambiguousdose when concurrent organ/toxicitypathways');
 for(const [field,threshold]of [['alt_uln_multiple',3],['ast_uln_multiple',3],['bilirubin_uln_multiple',1.5]])for(const v of [threshold,threshold+0.01])run(c,`${field}=${v}`,{[field]:v},(r,m)=>{if(v>threshold){assert(has(r,new Set(['consultant_review'])));assert(/neutropenia risk/.test(body(r)));noNumeric(m);}else assert(!has(r,decision));},'EMA§4.4 strictthresholdrisk, notnumericdosealgorithm');
 for(const field of ['qt_risk_factors','uncorrected_low_electrolytes','acute_febrile_neutropenia','active_infection'])run(c,`${field} independently actionable`,{[field]:true},(r,m)=>{assert(has(r,decision));noNumeric(m);if(field==='acute_febrile_neutropenia')assert(/urgent acute/.test(body(r)));},'NCCPp2/EMA§4.4cardiac/electrolyte/neutropeniarisk');
 run(c,'Significant cardiovascular impairment differs by exactsource',{significant_cardiovascular_impairment:true},(r,m)=>{assert(has(r,new Set([c==='00228'?'contraindicated':'consultant_review'])));noNumeric(m);},'228p2excludes significantCV;743p2doesnot');
}
run('00228','Legacy≥50 band must not assume strict>50',{eribulin_renal_band:'ge50'},(r,m)=>{assert(has(r,new Set(['consultant_review'])));noNumeric(m);},'228p3boundarygap');
run('00228','Explicit>50 band unchanged',{eribulin_renal_band:'gt50'},r=>assert(!has(r,decision)),'228p3Table2');
run('00228','Explicit equality band reviewed',{eribulin_renal_band:'eq50'},(r,m)=>{assert(has(r,new Set(['consultant_review'])));noNumeric(m);},'228p3Table2equalitygap');
run('00743','Legacyfebrileneutropenia remainsactionable',{febrile_neutropenia:true},(r,m)=>{assert(has(r,new Set(['consultant_review'])));noNumeric(m);},'Historicinputmustnotremainunassessed');
structural('Exact indication codes and disease mapping',()=>{assert.deepEqual(P['00228'].indications.map(x=>x.code),['00228a','00228b']);assert(/breast/i.test(P['00228'].indications[0].description));assert(/liposarcoma/i.test(P['00228'].indications[1].description));assert.deepEqual(P['00743'].indications.map(x=>x.code),['00743a']);assert(P['00743'].indications[0].unlicensed_posology);});
structural('Distinct day8/21 and day15/28 schedules usebase dose',()=>{for(const[c,days,cycle]of [['00228',[1,8],21],['00743',[1,15],28]]){const t=P[c].treatment_phases[0];assert.equal(t.cycle_length_days,cycle);assert.deepEqual(t.administration[0].day,days);assert.equal(t.administration[0].dose.value,1.23);assert.equal(t.administration[0].infusion_minutes,5);}});
structural('Source identity, pagecount and validation flags',()=>{for(const[c,v,pages]of [['00228','8',6],['00743','3',5]]){const p=P[c];assert.equal(p.protocol_id,`nccp-${c}-v${v}`);assert.equal(p.metadata.source_document_pages,pages);assert.equal(p.metadata.sactcheck_encoding_version,'0.84.1');assert.equal(p.metadata.source_checked_date,'2026-10-18');assert.equal(p.metadata.validation.clinical_use_authorised,false);assert.equal(p.metadata.validation.consultant_reviewed,false);assert.equal(p.metadata.validation.oncology_pharmacy_reviewed,false);}});
structural('Every rule linked to an exactsource and page',()=>{for(const p of Object.values(P))for(const r of p.rule_engine.rules){assert(r.source.url);assert(r.source.page);assert.equal(r.source.checked_date,'2026-10-18');}});
structural('Monitoring differentiates eachdose FBC from cycle organprofiles and conditional ECG',()=>{for(const p of Object.values(P)){let t=JSON.stringify(p.monitoring);assert(/FBC before every eribulin dose/.test(t));assert(/start of each cycle/.test(t));assert(/ECG when/.test(t));assert(/do not mandate a fixed CT/.test(t));}});
const output={checked_at:new Date().toISOString(),repo,total:results.length,passed:results.length-failed,failed,cases:results};fs.writeFileSync(path.join(__dirname,'eribulin-source-cases-results.json'),JSON.stringify(output,null,2)+'\n');
console.log(`Eribulin source audit: ${results.length-failed}/${results.length} passed.`);for(const x of results.filter(x=>!x.pass))console.error(`${x.code||'STRUCTURE'} ${x.name}: ${x.error}`);process.exitCode=failed?1:0;
