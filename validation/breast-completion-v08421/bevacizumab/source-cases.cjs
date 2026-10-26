'use strict';
// Synthetic cases derived from current NCCP00212v7, NCCP00215v7 and EMA Avastin.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const H=__dirname,R=path.resolve(H,'../../..'),args=process.argv.slice(2),mode=args.includes('--mode')?args[args.indexOf('--mode')+1]:(args[0]||'proposed');
const E=require(path.join(R,'js/assessment-engine')),D=require(path.join(R,'js/protocol-dose-schedule')),RE=require(path.join(R,'js/rule-engine'));
const P={};for(const [c,f]of [['00212','breast/00212-bevacizumab-q14d.json'],['00215','shared/00215-bevacizumab-15mgkg.json']])P[c]=JSON.parse(fs.readFileSync(mode==='integrated'?path.join(R,'protocols',f):path.join(H,'proposed',path.basename(f))));
const rows=[];let c,p;
function run(name,input,check,page=4){const row={code:c,name,input,source:{url:p.metadata.source_url,page:page+(c==='00215'?1:0)}};try{const r=E.assess(p,input),f=r.findings.filter(x=>!x.domainAssessment&&!/^PARTIAL_/.test(x.ruleId||''));assert.deepEqual(r.errors,[]);assert.notEqual(r.actionType,'proceed','Partial examples cannot clear the whole regimen');check({r,f,m:D.buildModificationModel(p,r)});const related=p.rule_engine.rules.filter(rule=>RE.collectConditionFields(RE.conditionFromRule(rule)).some(field=>Object.hasOwn(input,field)));row.sources=[...new Map(related.map(rule=>[JSON.stringify(rule.source),rule.source])).values()];if(row.sources.length)row.source=row.sources[0];row.actual={action:r.actionType,findings:f.map(x=>({id:x.ruleId,action:x.actionType})),invalid:r.invalid};row.pass=true}catch(e){row.pass=false;row.error=e.message}rows.push(row)}
function content(name,check){const row={code:c,name,source:{url:p.metadata.source_url}};try{check();row.pass=true}catch(e){row.pass=false;row.error=e.message}rows.push(row)}
const has=(id,type)=>q=>{assert.deepEqual(q.r.invalid,[]);assert(q.f.some(x=>x.ruleId===id&&(!type||x.actionType===type)),id+' / '+type);};
const absent=(...ids)=>q=>{assert.deepEqual(q.r.invalid,[]);assert(!q.f.some(x=>ids.includes(x.ruleId)),ids.join(','));};
for(c of Object.keys(P)){
 p=P[c];
 run('Blank input remains incomplete',{},q=>{assert.equal(q.r.actionType,'incomplete');assert.equal(q.f.length,0)});
 for(const field of ['urine_protein_g_24h','urine_protein_g_l','days_since_major_surgery']){
  for(const value of ['',null])run('Absent '+field+' '+String(value),{[field]:value},q=>assert.equal(q.f.length,0));
  for(const value of [-1,'NaN','Infinity',999999])run('Invalid '+field+' '+value,{[field]:value},q=>{assert(q.r.invalid.length);assert.equal(q.r.actionType,'incomplete')});
 }
 for(const [field,id,type]of [['hypersensitivity','EXCLUSION_HYPERSENSITIVITY','contraindicated'],['pregnancy','PREGNANCY_REVIEW','contraindicated'],['breastfeeding','BREASTFEEDING','contraindicated'],['recent_haemoptysis_over_2_5_ml','RECENT_HAEMOPTYSIS','contraindicated'],['recent_major_surgery_or_unhealed_wound','UNHEALED_WOUND_OR_RECENT_SURGERY','withhold'],['planned_major_surgery','PLANNED_MAJOR_SURGERY','withhold'],['planned_minor_surgery','PLANNED_MINOR_SURGERY','withhold'],['uncontrolled_or_symptomatic_hypertension','UNCONTROLLED_HYPERTENSION','withhold'],['severe_bp_uncontrolled','SEVERE_UNCONTROLLED_BP','discontinue'],['hypertensive_crisis_or_encephalopathy','HYPERTENSIVE_CRISIS_PRES','permanently_discontinue'],['tracheoesophageal_fistula','TE_FISTULA','discontinue'],['nephrotic_syndrome','NEPHROTIC_SYNDROME','permanently_discontinue'],['arterial_thromboembolic_event','ARTERIAL_THROMBOEMBOLIC_EVENT','permanently_discontinue'],['gi_perforation','GI_PERFORATION','permanently_discontinue'],['necrotising_fasciitis','NECROTISING_FASCIITIS','discontinue'],['pres_confirmed','PRES','discontinue'],['high_risk_history','HIGH_RISK_HISTORY','consultant_review'],['severe_infusion_reaction','SEVERE_INFUSION_REACTION','withhold'],['sunitinib_concurrent','SUNITINIB_INTERACTION','consultant_review'],['egfr_antibody_with_chemo','EGFR_ANTIBODY_INTERACTION','consultant_review']]){
  run(field+' alone independently actionable',{[field]:true},has(id,type));run(field+' false not triggered',{[field]:false},absent(id));
 }
 for(const n of [0,27,27.99])run('Postoperative interval <28 '+n,{days_since_major_surgery:n,wound_fully_healed:true},has('MAJOR_SURGERY_LT28','withhold'),5);
 for(const n of [28,28.01,60])run('Postoperative interval >=28 '+n,{days_since_major_surgery:n,wound_fully_healed:true},absent('MAJOR_SURGERY_LT28','WOUND_NOT_HEALED'),5);
 run('Unhealed wound still holds beyond28d',{days_since_major_surgery:60,wound_fully_healed:false},has('WOUND_NOT_HEALED','withhold'),5);
 for(const g of [0,1,2,3])run('Nonpersistent hypertension grade '+g,{hypertension_grade:g,hypertension_persisting:false},absent('PERSISTENT_G3_HYPERTENSION','G4_HYPERTENSION'));
 run('Grade3 persistence absent does not force stop',{hypertension_grade:3},q=>{has('G2_G3_BP_REVIEW','consultant_review')(q);absent('PERSISTENT_G3_HYPERTENSION','G4_HYPERTENSION')(q)});
 run('Persistent grade3 hypertension stops',{hypertension_grade:3,hypertension_persisting:true},has('PERSISTENT_G3_HYPERTENSION','discontinue'));
 for(const flag of [undefined,false,true])run('Grade4 stops regardless persistence '+flag,{hypertension_grade:4,...(flag===undefined?{}:{hypertension_persisting:flag})},has('G4_HYPERTENSION','discontinue'));
 for(const n of [0,1,1.999,2])run('24h protein <=2 '+n,{urine_protein_g_24h:n},q=>{has('PROTEIN_LE2','proceed_with_caution')(q);absent('PROTEIN_2_TO_4','PROTEIN_OVER_4')(q)});
 for(const n of [2.001,3,3.999,4])run('24h protein >2 through4 '+n,{urine_protein_g_24h:n},has('PROTEIN_2_TO_4','withhold'));
 for(const n of [4.001,8,20])run('24h protein >4 '+n,{urine_protein_g_24h:n},has('PROTEIN_OVER_4','discontinue'));
 for(const n of [0,.999])run('Spot g/L below1 '+n,{urine_protein_g_l:n},absent('PROTEIN_LAB_GE1','PROTEIN_2_TO_4','PROTEIN_OVER_4'));
 for(const n of [1,1.001,4.1])run('Spot g/L >=1 requires quantification not24hhold '+n,{urine_protein_g_l:n},q=>{has('PROTEIN_LAB_GE1','proceed_with_caution')(q);absent('PROTEIN_2_TO_4','PROTEIN_OVER_4')(q)});
 for(const dip of ['negative','1+'])run('Low dipstick '+dip,{proteinuria_dipstick:dip},absent('PROTEIN_DIPSTICK_2_3','PROTEIN_DIPSTICK_4'));
 for(const dip of ['2+','3+'])run('Dipstick quantification '+dip,{proteinuria_dipstick:dip},has('PROTEIN_DIPSTICK_2_3','proceed_with_caution'));
 run('4+ dipstick pendingquant holds',{proteinuria_dipstick:'4+'},has('PROTEIN_DIPSTICK_4','withhold'));
 run('Quantified <=2 resolves 4+ screening gate',{proteinuria_dipstick:'4+',urine_protein_g_24h:2},q=>{has('PROTEIN_LE2','proceed_with_caution')(q);absent('PROTEIN_DIPSTICK_4')(q)});
 run('Quantified >4 overrides permissive dipstick',{proteinuria_dipstick:'2+',urine_protein_g_24h:4.01},q=>{has('PROTEIN_OVER_4','discontinue')(q);absent('PROTEIN_DIPSTICK_2_3')(q)});
 run('Nephrotic syndrome overrides lowerprotein',{nephrotic_syndrome:true,urine_protein_g_24h:1},has('NEPHROTIC_SYNDROME','permanently_discontinue'));
 run('Grade4 proteinuria overrides lowerprotein',{proteinuria_grade:4,urine_protein_g_24h:1},has('PROTEIN_GRADE4','discontinue'));
 for(const n of [0,1,2,3])run('Protein grade below4 '+n,{proteinuria_grade:n},absent('PROTEIN_GRADE4'));
 for(const n of [0,1,2,3])run('Fistula grade below4 '+n,{fistula_grade:n},absent('GRADE4_FISTULA'));
 run('Grade4 fistula stops',{fistula_grade:4},has('GRADE4_FISTULA','discontinue'));
 run('TE fistula stops atgrade1',{tracheoesophageal_fistula:true,fistula_grade:1},has('TE_FISTULA','discontinue'));
 for(const n of [0,1,2])run('Bleeding below3 '+n,{haemorrhage_grade:n},absent('HAEMORRHAGE_G3PLUS'));
 for(const n of [3,4])run('Bleeding >=3 '+n,{haemorrhage_grade:n},has('HAEMORRHAGE_G3PLUS','discontinue'));
 run('Grade3 VTE closemonitor',{thromboembolic_event_grade:3},q=>{has('THROMBOEMBOLIC_LE3','consultant_review')(q);absent('THROMBOEMBOLIC_G4')(q)});
 run('Grade4 VTE stops',{thromboembolic_event_grade:4},has('THROMBOEMBOLIC_G4','discontinue'));
 run('Arterial event overrides lowergrade',{arterial_thromboembolic_event:true,thromboembolic_event_grade:2},has('ARTERIAL_THROMBOEMBOLIC_EVENT','permanently_discontinue'));
 run('Normalprotein cannotclear unassessedBP',{urine_protein_g_24h:1},q=>assert.equal(q.r.actionType,'proceed_with_caution'));
 run('Normalprotein cannotclear uncontrolledBP',{urine_protein_g_24h:1,uncontrolled_or_symptomatic_hypertension:true},q=>assert.equal(q.r.actionType,'withhold'));
 run('Breast wrongHER2',{indication_id:'metastatic_breast',breast_her2_negative:false},has('BREAST_HER2_SCOPE','consultant_review'),1);
 run('Breast laterline',{indication_id:'metastatic_breast',first_line_metastatic:false},has('FIRST_LINE_SCOPE','consultant_review'),1);
 run('Monotherapy needs indicationreview',{treatment_context:'bevacizumab_only'},has('MONOTHERAPY_SCOPE','consultant_review'),1);
 run('Combination partner unassessed',{treatment_context:'combination',partner_sact_assessed_separately:false},has('COMBINATION_SCOPE_GAP','consultant_review'),1);
 run('Partner confirmed only clears itsownflag',{treatment_context:'combination',partner_sact_assessed_separately:true},absent('COMBINATION_SCOPE_GAP'),1);
 run('Partner notconfirmed',{indication_partner_confirmed:false},has('PARTNER_UNCONFIRMED','consultant_review'),1);
 run('Platresistant >2priorregimens',{indication_id:'platinum_resistant_ovarian',prior_chemotherapy_regimens:3},has('OVARIAN_PRIOR_LINES','consultant_review'),1);
 run('Platresistant exactly2regimens allowed domain',{indication_id:'platinum_resistant_ovarian',prior_chemotherapy_regimens:2},absent('OVARIAN_PRIOR_LINES'),1);
 run('Platresistant priorVEGF excludedscope',{indication_id:'platinum_resistant_ovarian',prior_vegf_therapy:true},has('OVARIAN_PRIOR_VEGF','consultant_review'),1);
 run('PriorVEGF notfalsebreastrejection',{indication_id:'metastatic_breast',prior_vegf_therapy:true},absent('OVARIAN_PRIOR_VEGF'),1);
 for(const n of [0,1,2])run('ECOGwithin '+n,{ecog:n},absent('ECOG_OVER_2'),2);for(const n of [3,4])run('ECOGoutside '+n,{ecog:n},has('ECOG_OVER_2','consultant_review'),2);
 run('Age17 outsideadultscope',{age_years:17},has('ADULT_INDICATION','consultant_review'),1);run('Age18 adultboundary',{age_years:18},absent('ADULT_INDICATION'),1);
 run('Organfunction clinicalreview withoutinventeddose',{renal_or_hepatic_clinical_concern:true},q=>{has('ORGAN_FUNCTION_REVIEW','consultant_review')(q);assert(!q.f.some(x=>/dose_reduce/.test(x.actionType)))},3);
 if(c==='00212')run('Haemodialysis reviewed under00212 source',{haemodialysis:true},has('HAEMODIALYSIS_REVIEW','consultant_review'),3);
 else{
  for(const [f,id,cut,strict]of [['anc','ANC_INITIAL',1.2,'minInclusive'],['platelets','PLATELETS_INITIAL',100,'minExclusive'],['creatinine_uln','CREATININE_INITIAL',1.5,'maxInclusive'],['bilirubin','BILIRUBIN_INITIAL',26,'maxInclusive'],['ast_uln','AST_INITIAL',5,'maxInclusive'],['alp_uln','ALP_INITIAL',5,'maxInclusive']])for(const value of [cut-.01,cut,cut+.01]){
   const fail=strict==='minInclusive'?value<cut:strict==='minExclusive'?value<=cut:value>cut;run('Initial '+f+' boundary '+value,{[f]:value},fail?has(id,'consultant_review'):absent(id),2);
  }
  run('Frontlineovary starts cycle2 not1',{indication_id:'ovarian_frontline_or_continuation',cycle_number:1},has('OVARIAN_CYCLE1','omit'),1);
  run('Frontlineovary cycle2',{indication_id:'ovarian_frontline_or_continuation',cycle_number:2},absent('OVARIAN_CYCLE1'),1);
  run('Breast cycle1 notomitted',{indication_id:'metastatic_breast',cycle_number:1},absent('OVARIAN_CYCLE1'),1);
  for(const n of [14.99,15,15.01])run('Ovarian duration '+n,{indication_id:'ovarian_frontline_or_continuation',ovarian_months_on_treatment:n},n>=15?has('OVARIAN_DURATION_LIMIT','withhold'):absent('OVARIAN_DURATION_LIMIT'),1);
  run('Ovarian cycle22 boundary',{indication_id:'ovarian_frontline_or_continuation',cycle_number:22},absent('OVARIAN_CYCLE_LIMIT'),1);
  run('Ovarian cycle23 beyondlimit',{indication_id:'ovarian_frontline_or_continuation',cycle_number:23},has('OVARIAN_CYCLE_LIMIT','withhold'),1);
  run('Breast notlimitedto ovarian22cycles',{indication_id:'metastatic_breast',cycle_number:23,ovarian_months_on_treatment:16},absent('OVARIAN_CYCLE_LIMIT','OVARIAN_DURATION_LIMIT'),1);
  run('Squamouslung outofscope',{indication_id:'nonsquamous_nsclc_platinum',nsclc_nonsquamous:false},has('NSCLC_HISTOLOGY','consultant_review'),1);
  run('Erlotinib requiresEGFR',{indication_id:'egfr_mutant_nsclc_erlotinib',egfr_activating_mutation:false},has('NSCLC_EGFR','consultant_review'),2);
 }
 content('Sourceidentity correct stableID separatefromversion',()=>{assert.equal(p.metadata.nccp_version,'7');assert.equal(p.metadata.canonical_protocol_id,'nccp-'+c+'-v7');assert.equal(p.metadata.source_pdf_sha256.length,64)});
 content('Correct reference dose and interval',()=>{const phase=p.treatment_phases[0];assert.equal(phase.cycle_length_days,c==='00212'?14:21);assert.equal(phase.administration[0].dose.value,c==='00212'?10:15);assert.equal(phase.administration[0].dose.unit,'mg/kg')});
 content('Everyrule source-linked to officialsourcepage',()=>{for(const r of p.rule_engine.rules){assert.match(r.source.url,/^https:\/\/(healthservice\.hse\.ie|www\.ema\.europa\.eu)\//);assert(r.source.page>0);assert.equal(r.source.checked,'2026-10-25')}});
 content('Optional independent inputs',()=>{assert.deepEqual(p.required_inputs,[]);for(const d of Object.values(p.input_definitions)){assert.equal(d.required,false);assert(!d.required_when)}});
 content('No governance approval claimed',()=>{for(const f of ['consultant_reviewed','oncology_pharmacy_reviewed','clinical_use_authorised'])assert.equal(p.metadata.validation[f],false)});
 content('Indicationsretain correctsourcecodes',()=>{assert.deepEqual(p.indications.map(x=>x.code),c==='00212'?['00212a','00212b','00212c','00212d']:['00215a','00215c','00215d','00215e','00215f','00215g']);assert(!p.indications.some(x=>x.code.startsWith(c==='00212'?'00215':'00212')))});
}
const A=JSON.parse(fs.readFileSync(path.join(H,'authoring.json'))).regimens;
for(c of Object.keys(A)){p=P[c];const a=A[c],d=a.patient;content('Complete authoring schema',()=>{for(const k of ['patient','clinical','evidence','journey','selector','support_plans','route','risk','protocol_metadata'])assert(k in a)});content('Patientqualitative evidence no numeric endpoint',()=>{assert.deepEqual(d.evidence.metrics,[]);assert(!JSON.stringify(d).includes('0.421'));assert(!JSON.stringify(d).includes('26.5'))});content('Date-free proportional timeline and checkmatrix',()=>{for(const t of d.timeline){assert(t.start>=1);assert(t.end<=d.cycle_days)}for(const r of d.monitoring_schedule.rows)assert.equal(r.cells.length,d.monitoring_schedule.columns.length);for(const r of a.journey.lanes)assert.equal(r.cells.length,a.journey.stages.length)});content('All authoring source references resolve',()=>{const ids=d.sources.map(x=>x.id),jids=ids.map(x=>x==='nccp'?c:x);function walk(x,allowed){if(Array.isArray(x))return x.forEach(z=>walk(z,allowed));if(!x||typeof x!=='object')return;for(const[k,v]of Object.entries(x)){if(k==='source_ids'||k.endsWith('_source_ids'))v.forEach(id=>assert(allowed.includes(id),id));else walk(v,allowed)}}walk(d,ids);walk(a.journey,jids)});content('Body map and support cover mainhazards',()=>{assert(d.anatomy.length>=5);assert.match(d.urgent_extra,/bleeding/);assert.match(d.urgent_extra,/abdominal/);assert.match(d.consent_support,/wound/);assert.equal(a.support_plans[0].medicines.length,0);assert.match(a.support_plans[0].additional_support.join(' '),/partner/i)});content('Breastselector HER2negative scope',()=>assert.deepEqual(a.selector.receptors,['hrpos-her2neg','tnbc']));content('No irrelevant copiedendocrine content',()=>assert(!/capivasertib|fulvestrant|LHRH|HbA1c|tablet-free/i.test(JSON.stringify(a))));content('Efficacy follows schedule',()=>{if(c==='00215'){assert.equal(a.evidence.endpoints.length,0);assert.match(a.evidence.applicability,/Indirect/)}else {assert.equal(a.evidence.endpoints.length,2);assert.match(a.evidence.endpoints[0].result_text,/11\.4/);assert.match(a.evidence.endpoints[1].interpretation,/No statistically significant/)}})}
const result={mode,checked:'2026-10-25',total:rows.length,passed:rows.filter(x=>x.pass).length,failed:rows.filter(x=>!x.pass).length,rows};fs.writeFileSync(path.join(H,mode+'-results.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({mode,total:result.total,passed:result.passed,failed:result.failed,failures:rows.filter(x=>!x.pass)},null,2));if(result.failed)process.exitCode=1;
