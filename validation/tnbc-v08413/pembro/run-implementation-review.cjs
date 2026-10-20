'use strict';
// Independent source expectations for NCCP 00858/00860/00861; no app mutations.
// Usage: node run-implementation-review.cjs /absolute/path/to/checkout
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(process.argv[2]||'/workspace/scratch/aa44ad62d693/sactcheck-v08413');
const out=__dirname,Engine=require(path.join(root,'js/assessment-engine.js'));
require(path.join(root,'js/ctcae-descriptors.js'));
const Grading=globalThis.SACTCheckCTCAE;
const codes=['00858','00860','00861'],protocols={},files={},results=[];
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
for(const code of codes){const file=fs.readdirSync(path.join(root,'protocols/breast')).find(n=>n.startsWith(code+'-'));files[code]=path.join(root,'protocols/breast',file);protocols[code]=JSON.parse(fs.readFileSync(files[code]));}
const names={alt_ratio_uln:'alt_uln_multiple',bilirubin_ratio_uln:'bilirubin_uln_multiple',myelosuppression_delay_days:'haematological_delay_days',myelosuppression_delay_occurrence:'haematological_delay_occurrence',confirmed_immune_pneumonitis_grade:'immune_pneumonitis_grade',recurrent_pneumonitis:'immune_recurrent_grade2_pneumonitis',confirmed_immune_hepatitis_grade:'immune_hepatitis_grade',unacceptable_neoadjuvant_pembrolizumab_toxicity:'unacceptable_pembro_toxicity'};
const isRestrictive=f=>!['proceed','proceed_with_caution','partial_context_required'].includes(f.actionType);
const sourceFindings=r=>r.findings.filter(f=>!/^PARTIAL_/.test(f.ruleId));
const hasComponent=(f,cs)=>cs.some(c=>(f.action?.components||[]).includes(c));
const words=f=>[f.explanation,f.action?.recommendation].filter(Boolean).join(' ');
const restricted=(r,cs)=>sourceFindings(r).filter(f=>isRestrictive(f)&&hasComponent(f,cs));
const actionIn=(fs,as)=>fs.some(f=>as.includes(f.actionType));
const describes=(fs,re)=>fs.some(f=>re.test(words(f)));
function record(id,code,inputs,expected,check,source){
 try{const r=Engine.assess(protocols[code],inputs);const ok=check(r);results.push({id,code,status:ok?'pass':'fail',inputs,expected,source,actual:{action:r.actionType,errors:r.errors,findings:r.findings.map(f=>({id:f.ruleId,action:f.actionType,components:f.action?.components||[],text:f.explanation}))}});}
 catch(e){results.push({id,code,status:'fail',inputs,expected,source,error:String(e.stack||e)});}
}
const sourceCases=JSON.parse(fs.readFileSync(path.join(out,'source-cases.json'))).cases;
for(const t of sourceCases){
 const x={};for(const[k,v]of Object.entries(t.values))x[names[k]||k]=v;
 if(t.phase)x.treatment_phase=t.phase==='taxane_platinum'||t.phase==='baseline'?'taxane':t.phase==='adjuvant_pembrolizumab'?'adjuvant':'ac';
 if(t.day)x.day_number=t.day;
 x.assessment_stage=t.phase==='baseline'?'baseline':'ongoing';
 if('ac_delay_occurrence'in x){results.push({id:t.id,code:t.code,status:'inapplicable',reason:'Original expectation did not specify platelet delay; source 75% instruction is within platelet-delay row. Do not generalise to every delay.',source_page:t.source_page});continue;}
 const expected=t.expected_action,cs=t.expected_components;
 const source={url:t.source_url,page:t.source_page,basis:t.basis};
 const check=r=>{
  if(r.errors?.length)return false;
  const f=restricted(r,cs);
  switch(expected){
   case'no_restriction_in_entered_ANC_domain':case'no_restriction_in_entered_platelet_domain':case'no_restriction_in_entered_count_domains':case'no_listed_omission_trigger_in_entered_domains':case'no_cyclophosphamide_renal_adjustment':return f.length===0;
   case'consultant_discretion':return actionIn(f,['consultant_review'])&&describes(f,/discretion|clinically well/i);
   case'delay':case'delay_or_review_no_clearance':return actionIn(f,['delay','delay_then_dose_reduce','withhold','consultant_review']);
   case'delay_consider_25_percent_reduction':return (actionIn(f,['delay','delay_then_dose_reduce','withhold','consultant_review'])&&describes(f,/25\s*%/))||(x.febrile_neutropenia===true&&actionIn(f,['withhold']));
   case'delay_consider_50_percent_reduction_or_cease':return actionIn(f,['delay','delay_then_dose_reduce','withhold','consultant_review'])&&describes(f,/50\s*%|cessation|cease/i);
   case'source_boundary_review':case'doxorubicin_source_boundary_review':case'unlisted_count_combination_review':return actionIn(f,['consultant_review'])&&describes(f,/gap|between|unassigned|exactly|mixed|printed|clarif/i);
   case'baseline_exclusion_review':return actionIn(f,['contraindicated','withhold','consultant_review'])&&describes(f,/baseline|initiation|severe hepatic/i);
   case'dose_reduce_75_percent_consider_gcsf':return actionIn(f,['consultant_review','dose_reduce'])&&describes(f,/75\s*%/) &&describes(f,/G.CSF/i);
   case'omit_scheduled_paclitaxel':return actionIn(f,['omit']);
   case'contraindicated':return actionIn(f,['contraindicated']);
   case'extreme_caution_review':return actionIn(f,['consultant_review'])&&describes(f,/extreme caution/i);
   case'paclitaxel_60_mg_m2':return actionIn(f,['consultant_review','dose_reduce'])&&describes(f,/60\s*mg/);
   case'consider_75_percent':return actionIn(f,['consultant_review','dose_reduce'])&&describes(f,/75\s*%/);
   case'dose_reduce_50_percent':return actionIn(f,['consultant_review','dose_reduce'])&&describes(f,/50\s*%/);
   case'dose_reduce_25_percent':return actionIn(f,['consultant_review','dose_reduce'])&&describes(f,/25\s*%/);
   case'not_recommended':return actionIn(f,['consultant_review','contraindicated','omit'])&&describes(f,/not recommended|omit/i);
   case'withhold':return actionIn(f,['withhold']);
   case'permanently_discontinue':return actionIn(f,['permanently_discontinue']);
   case'do_not_administer_adjuvant_pembrolizumab':return actionIn(f,['contraindicated','withhold','permanently_discontinue']);
   case'no_inactive_cytotoxic_dose_actions':return restricted(r,['carboplatin','paclitaxel','doxorubicin','cyclophosphamide']).length===0;
   case'no_inactive_carboplatin_action':return restricted(r,['carboplatin']).length===0;
   case'no_inactive_doxorubicin_action':return restricted(r,['doxorubicin']).length===0;
   case'partial_result_phase_needed':return ['consultant_review','partial_context_required'].includes(r.actionType)&&r.findings.some(f=>/phase/i.test(words(f)));
   default:throw new Error('Unhandled source expectation '+expected);
  }
 };
 record(t.id,t.code,x,expected,check,source);
}
// Additional independent source scenarios that expose gaps not captured by text-only reference rows.
for(const code of codes){
 const source={url:protocols[code].metadata.source_url,page:8};
 for(const phase of ['taxane','ac','adjuvant'])for(const[f,v]of[['ast_uln_multiple',6],['alt_uln_multiple',6],['bilirubin_uln_multiple',4]]){
  record(`${code}-raw-${phase}-${f}`,code,{treatment_phase:phase,[f]:v},'Abnormal single laboratory value prompts clinical/immune safety review or hold, without diagnosing immune aetiology or clearing the domain.',r=>{
   const relevant=restricted(r,['pembrolizumab']);
   return actionIn(relevant,['withhold','consultant_review'])&&!r.findings.some(z=>/NO_RESTRICTION$/.test(z.ruleId)&&z.ruleId.includes(f.toUpperCase()));
  },source);
 }
 record(`${code}-adjuvant-low-lvef`,code,{treatment_phase:'adjuvant',lvef_percent:45},'No inactive doxorubicin contraindication during pembrolizumab monotherapy; clinical cardiac review may remain.',r=>restricted(r,['doxorubicin']).length===0,{...source,page:5});
 record(`${code}-adjuvant-low-anc`,code,{treatment_phase:'adjuvant',anc_x10e9_l:.1},'Do not synthesize ANC no-restriction from inactive chemotherapy rules; clinical review or explicitly unassessed is acceptable.',r=>!r.findings.some(f=>f.ruleId==='PARTIAL_ANC_X10E9_L_NO_RESTRICTION')&&restricted(r,['carboplatin','paclitaxel','doxorubicin','cyclophosphamide']).length===0,{...source,page:6,basis:'phase-safety guard, not an invented pembrolizumab count cutoff'});
 for(const [tox,hold,stop]of[['pneumonitis',[2],[3,4]],['colitis',[2,3],[4]],['nephritis',[2],[3,4]],['hepatitis',[2],[3,4]],['skin',[3],[4]],['other',[2,3],[4]]])for(let grade=0;grade<=4;grade++){
  const field='immune_'+tox+'_grade',expect=stop.includes(grade)?'permanently_discontinue':hold.includes(grade)?'withhold':'no table-specific hold or stop from this grade alone';
  record(`${code}-${tox}-g${grade}`,code,{treatment_phase:'adjuvant',[field]:grade},expect,r=>{
   const f=restricted(r,['pembrolizumab']);return stop.includes(grade)?actionIn(f,['permanently_discontinue']):hold.includes(grade)?actionIn(f,['withhold']):f.length===0;
  },source);
 }
 for(const flag of['immune_recurrent_grade2_pneumonitis','confirmed_sjs_ten'])record(`${code}-${flag}`,code,{treatment_phase:'adjuvant',[flag]:true},'Toxicity-specific source permanent-discontinuation criterion.',r=>actionIn(restricted(r,['pembrolizumab']),['permanently_discontinue']),{...source,page:9});
 // The endocrine-specific exception can require subtype review for a broad recovery/recurrence flag.
 // A blocking review is accepted here as an implementation guard, never as source permission to resume.
 for(const flag of ['immune_recurrent_grade3','immune_not_recovered_12weeks'])for(const context of [false,true,undefined]){
  const input={treatment_phase:'adjuvant',[flag]:true};if(context!==undefined)input.immune_endocrinopathy_controlled=context;
  record(`${code}-${flag}-endocrine-${context===undefined?'missing':context}`,code,input,
   context===false?'Source permanent-discontinuation criterion with endocrine exception explicitly excluded.':'Withhold for specialist resolution of source permanent-discontinuation criterion and possible endocrine exception; never clear treatment.',r=>{
    const f=restricted(r,['pembrolizumab']);return context===false?actionIn(f,['permanently_discontinue']):actionIn(f,['withhold'])&&r.actionType!=='permanently_discontinue'&&describes(f,/permanent.discontinuation|permanently discontinue/i)&&describes(f,/specialist|review/i);
   },{...source,page:9,basis:'Blocking software guard where endocrine subtype/recovery is unresolved; not an NCCP restart recommendation.'});
 }
 // Inability to taper is different: the endocrine exception itself requires taper when needed.
 // Table 4 p9 explicitly specifies permanent discontinuation for <=10mg failure by 12 weeks.
 for(const context of [false,true,undefined]){
  const input={treatment_phase:'adjuvant',steroid_not_tapered_12weeks:true};if(context!==undefined)input.immune_endocrinopathy_controlled=context;
  record(`${code}-steroid-not-tapered-endocrine-${context===undefined?'missing':context}`,code,input,'Confirmed inability to reduce prednisone equivalent to <=10mg/day within12weeks requires source permanent discontinuation; controlled endocrine status does not waive taper criterion.',r=>actionIn(restricted(r,['pembrolizumab']),['permanently_discontinue']),{...source,page:9});
 }
 for(const[field,grade]of[['immune_pneumonitis_grade',3],['immune_colitis_grade',4],['immune_hepatitis_grade',3],['immune_myocarditis_neurological_grade',3]])record(`${code}-endocrine-cannot-override-${field}`,code,{treatment_phase:'adjuvant',[field]:grade,immune_endocrinopathy_controlled:true},'A separate definite toxicity-specific stop remains permanent despite coexisting controlled endocrinopathy.',r=>r.actionType==='permanently_discontinue'&&actionIn(restricted(r,['pembrolizumab']),['permanently_discontinue']),source);
 for(const flag of['suspected_sjs_ten','severe_immune_endocrinopathy','severe_immune_diabetes'])record(`${code}-${flag}`,code,{treatment_phase:'adjuvant',[flag]:true},'Withhold pembrolizumab',r=>actionIn(restricted(r,['pembrolizumab']),['withhold']),source);
 for(const grade of[3,4])for(const field of['immune_myocarditis_neurological_grade','infusion_reaction_grade'])record(`${code}-${field}-${grade}`,code,{treatment_phase:'adjuvant',[field]:grade},'Permanent discontinuation',r=>actionIn(restricted(r,['pembrolizumab']),['permanently_discontinue']),{...source,page:field.startsWith('infusion')?9:8});
 record(`${code}-endocrine-recurrence-exception`,code,{treatment_phase:'adjuvant',immune_recurrent_grade3:true,immune_endocrinopathy_controlled:true},'Clarify subtype and endocrine exception before automatic permanent discontinuation; controlled endocrine flag does not grant clearance.',r=>r.actionType!=='permanently_discontinue'&&['consultant_review','withhold','partial_context_required'].includes(r.actionType),source);
}
for(const code of['00858','00861'])record(`${code}-prolonged-priority`,code,{treatment_phase:'taxane',assessment_stage:'ongoing',anc_x10e9_l:.3,haematological_delay_days:15},'Prolonged recovery >2 weeks supersedes uncomplicated 25% reduction: leading applicable chemotherapy finding must show 50% / cessation review.',r=>{
 const f=restricted(r,['carboplatin','paclitaxel']);return f.length>0&&/50\s*%|cessation|cease/.test(words(f[0]));
},{url:protocols[code].metadata.source_url,page:6});
record('00860-prior-prolonged-neutropenia-after-recovery','00860',{treatment_phase:'taxane',assessment_stage:'ongoing',day_number:1,anc_x10e9_l:2,platelets_x10e9_l:150,anc_below_0_5_duration_days:8},'Previous ANC <0.5 for >=7 days still requires carboplatin next-dose reduction review after count recovery; do not require current ANC to remain below0.5.',r=>{
 const f=restricted(r,['carboplatin']);return actionIn(f,['consultant_review','dose_reduce'])&&describes(f,/dose.level|dose level|reduc/i);
},{url:protocols['00860'].metadata.source_url,page:6});
// Schedule/data assertions. These use source cycle lists, not generated rule IDs.
function structural(code,id,expected,check){try{const ok=check(protocols[code]);results.push({id:code+'-'+id,code,status:ok?'pass':'fail',expected});}catch(e){results.push({id:code+'-'+id,code,status:'fail',expected,error:String(e)});}}
for(const code of codes){
 for(const field of ['immune_pneumonitis_grade','immune_colitis_grade','immune_nephritis_grade','immune_hepatitis_grade','immune_skin_grade','immune_other_grade','immune_myocarditis_neurological_grade','infusion_reaction_grade']){
  structural(code,'source-grading-'+field,'NCCP Table4 uses CTCAE4. Source-linked grade input/guide must not supply unrelated CTCAE5 or neuropathy descriptors.',p=>{
   const d=p.input_definitions[field],g=Grading.guide({...d,id:field});
   return d&&/^4(?:\.0)?$/.test(d.ctcae_version)&&d.grading_source_url===p.metadata.source_url&&/NCCP/i.test(d.grading_source_label||'')&&d.ctcae_category!=='neuropathy'&&g.sourceSpecific===true&&g.sourceUrl===p.metadata.source_url&&/CTCAE\s*v?4/i.test(g.version)&&g.calculable===false&&g.grades.every(row=>!/(instrumental|self.care)\s+ADL|moderate symptoms.*medical intervention|asymptomatic.*clinical|urgent intervention indicated/i.test(row.description));
  });
 }
 structural(code,'calvert-auc','Target AUC matches exact NCCP schedule',p=>p.calculators.carboplatin_calvert.target_auc===(code==='00860'?5:1.5));
 structural(code,'carbo-days','Carboplatin weekly except00860 Day1 only',p=>p.treatment_phases.filter(ph=>ph.administration.some(a=>a.drug==='carboplatin')).every(ph=>ph.administration.filter(a=>a.drug==='carboplatin').every(a=>JSON.stringify(a.day)===JSON.stringify(code==='00860'?1:[1,8,15]))));
 if(code!=='00858'){
  structural(code,'pembro-neoadjuvant-cycles','Pembrolizumab400 only cycles1,3,5,8 before surgery',p=>{
   const cycles=p.treatment_phases.filter(ph=>!String(ph.phase_id).includes('adjuvant')).flatMap(ph=>ph.administration.some(a=>a.drug==='pembrolizumab'&&a.dose.value===400)?ph.cycles:[]).sort((a,b)=>a-b);return JSON.stringify(cycles)==='[1,3,5,8]';
  });
  structural(code,'ddac-interval','Every doxorubicin/cyclophosphamide phase uses14days',p=>p.treatment_phases.filter(ph=>ph.administration.some(a=>a.drug==='doxorubicin')).every(ph=>ph.cycle_length_days===14));
  structural(code,'adjuvant-sixweekly','Single adjuvant400q42x5 branch with six-week postC8D1 start',p=>{const a=p.treatment_phases.filter(ph=>String(ph.phase_id).includes('adjuvant'));return a.length===1&&a[0].cycle_length_days===42&&a[0].cycles.length===5&&a[0].administration.length===1&&a[0].administration[0].dose.value===400&&/six weeks after cycle 8 Day 1/i.test(a[0].duration_text||'');});
  structural(code,'gcsf','Mandatory GCSF everyddAC cycle present',p=>/required.*every.*dose.dense/i.test(p.supportive_care.gcsf||''));
 }
}
const summary={reviewed_at:new Date().toISOString(),checkout:root,independent_source_expectations:true,software_review_not_clinical_validation:true,protocol_sha256:Object.fromEntries(Object.entries(files).map(([c,f])=>[c,sha(fs.readFileSync(f))])),engine_sha256:sha(fs.readFileSync(path.join(root,'js/assessment-engine.js'))),grading_helper_sha256:sha(fs.readFileSync(path.join(root,'js/ctcae-descriptors.js'))),total:results.length,passed:results.filter(x=>x.status==='pass').length,failed:results.filter(x=>x.status==='fail').length,inapplicable:results.filter(x=>x.status==='inapplicable').length};
fs.writeFileSync(path.join(out,'implementation-review-results.json'),JSON.stringify({summary,results},null,2)+'\n');
console.log(JSON.stringify(summary,null,2));
for(const r of results.filter(r=>r.status==='fail'))console.log('FAIL',r.id,r.actual?.action||'',r.expected);
process.exitCode=summary.failed?1:0;
