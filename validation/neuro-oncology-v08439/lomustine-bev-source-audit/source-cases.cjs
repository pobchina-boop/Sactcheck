'use strict';
// Expectations below are explicit readings of the fresh source tables, not generated from rule conditions.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const packageRoot=path.resolve(__dirname,'../../..'),engineRoot=process.env.SACT_TEST_ROOT||packageRoot;
const E=require(path.join(engineRoot,'js/assessment-engine')),D=require(path.join(engineRoot,'js/protocol-dose-schedule')),V=require(path.join(engineRoot,'js/protocol-validator'));
const before=process.argv.includes('--before'),cases=[],coverage={};
for(const code of ['00742','00804']){
 const filename=fs.readdirSync(path.join(packageRoot,'protocols/neuro-oncology')).find(n=>n.startsWith(code));
 const p=JSON.parse(fs.readFileSync(path.join(before?__dirname:packageRoot,before?'protocol-before':'protocols/neuro-oncology',filename))),idsSeen=new Set();
 const src=section=>`NCCP${code} ${section}`;
 function check(name,input,expect={},source=src('pp3-4 Tables1-4')){
  const row={code,name,input,source,expected:expect};
  try {const r=E.assess(p,input),m=D.buildModificationModel(p,r),ids=r.findings.map(f=>f.ruleId);ids.forEach(id=>idsSeen.add(id));
   assert.deepEqual(r.errors,[]);assert.deepEqual(r.invalid,[]);
   if(expect.action)assert.equal(r.actionType,expect.action);
   for(const id of expect.yes||[])assert(ids.includes(id),`Missing ${id}`);
   for(const id of expect.no||[])assert(!ids.includes(id),`Unexpected ${id}`);
   assert(!m.rows.some(x=>x.quantified||/^\d+(?:\.\d+)?\s*(?:mg|%)/.test(x.protocolDose||'')),'No unverified numerical restart / dose multiplication');
   if(expect.component)assert(m.rows.some(x=>x.componentId===expect.component||x.component.toLowerCase()===expect.component),'Missing component-specific action');
   row.pass=true;row.actual={action:r.actionType,rule_ids:ids.filter(x=>!/^PARTIAL_/.test(x)),rows:m.rows.map(x=>({component:x.component,action:x.actionType,dose:x.protocolDose}))};
  }catch(e){row.pass=false;row.error=e.message;}cases.push(row);
 }
 function inv(name,fn,source='source structure/provenance'){const row={code,name,source};try{fn();row.pass=true}catch(e){row.pass=false;row.error=e.message}cases.push(row)}
 check('No supplied values',{}, {action:'incomplete'});
 for(const field of Object.keys(p.input_definitions))for(const value of [null,''])check(`${field} missing ${JSON.stringify(value)}`,{[field]:value},{action:'incomplete'},'Missing data never becomes a normal result');
 const witnesses=[
 ['Bevacizumab-only context',{visit_type:'bevacizumab_only'},'proceed_with_caution','BEV_ONLY_VISIT_CONTEXT','p1'],
 ['Bevacizumab-only delayed marrow toxicity',{visit_type:'bevacizumab_only',platelets_x10e9_l:70},'consultant_review','BEV_ONLY_DELAYED_TOXICITY_REVIEW','p3 Table1'],
 ['ECOG outside routine pathway',{ecog:3},'consultant_review','ECOG_OUTSIDE_PATHWAY','pp1-2'],
 ['Indication not confirmed',{eligible_recurrent_glioblastoma_confirmed:false},'consultant_review','INDICATION_NOT_CONFIRMED','p1'],
 ['Relevant allergy',{hypersensitivity:true},'contraindicated','HYPERSENSITIVITY','pp1-2'],
 ['Pregnancy',{pregnancy:true},'contraindicated','PREGNANCY','p2'],
 ['Breastfeeding',{breastfeeding:true},'contraindicated','BREASTFEEDING','p2'],
 ['Recent intracranial bleed',{recent_intracranial_haemorrhage:true},'contraindicated','RECENT_ICH','p2'],
 ['Recent stroke or MI',{recent_stroke_or_mi_lt1y:true},'contraindicated','RECENT_STROKE_MI','p2'],
 ['Minimal enhancement/gliomatosis',{minimal_contrast_enhancement_or_gliomatosis:true},'contraindicated','MINIMAL_ENHANCEMENT','p2'],
 ['Infection',{active_infection:true},'withhold','ACTIVE_INFECTION','Lomustine SmPC4.4'],
 ['Beyond sixth cycle',{cycle_number:7},'consultant_review','CYCLE_LIMIT','p1'],
 ['Wrong visit schedule',{visit_type:'other'},'consultant_review','VISIT_OTHER','p1'],
 ['Low neutrophils',{anc_x10e9_l:.99},'withhold','LOM_ANC_LT1','p3 Table1'],
 ['Low platelets',{platelets_x10e9_l:79.99},'withhold','LOM_PLT_LT80','p3 Table1'],
 ['Unallocated platelet range',{platelets_x10e9_l:99.5},'consultant_review','LOM_PLT_80_99','p3 Table1'],
 ['Prior count delay not recovered',{lomustine_marrow_delay_history:true,anc_x10e9_l:1,platelets_x10e9_l:99.9},'withhold','LOM_PRIOR_DELAY_NOT_RECOVERED','p3 Table1'],
 ['Prior count delay recovered dose still needs review',{lomustine_marrow_delay_history:true,anc_x10e9_l:1,platelets_x10e9_l:100},'consultant_review','LOM_PRIOR_DELAY_RECOVERY_REVIEW','p3 Table1'],
 ['Restart lacks both counts',{assessment_type:'restart'},'consultant_review','LOM_RESTART_MISSING_COUNTS','p3 Table1'],
 ['Prior dose/nadir unknown',{restart_plan_uncertain:true},'consultant_review','RESTART_PLAN_UNCERTAIN','Lomustine SmPC4.2'],
 ['ANC is not total WBC',{assessment_type:'restart',anc_x10e9_l:1.5,platelets_x10e9_l:100,wbc_x10e9_l:3.99},'consultant_review','LOM_WBC_SOURCE_CONFLICT','Lomustine SmPC4.2 vs NCCP Table1'],
 ['Renal75% requires actual capped original dose',{crcl_ml_min:50},'consultant_review','LOM_RENAL_30_50','p3 Table2'],
 ['Renal below30',{crcl_ml_min:29.99},'withhold','LOM_RENAL_LT30','p3 Table2'],
 ['Conflicting band and measured renal result',{crcl_ml_min:50,lomustine_renal_band:'gt50'},'consultant_review','LOM_RENAL_INPUT_CONFLICT','p3 Table2'],
 ['Severe hepatic impairment',{lomustine_hepatic_severity:'severe'},'withhold','LOM_HEPATIC_SEVERE','p3 Table2'],
 ['Hepatic severity uncertain',{lomustine_hepatic_severity:'uncertain'},'consultant_review','LOM_HEPATIC_UNCERTAIN','p3 Table2'],
 ['Proposed repeat before42days',{days_since_last_lomustine:41,visit_type:'combination_day1'},'withhold','LOM_REPEAT_TOO_EARLY','Lomustine SmPC4.2'],
 ['Cumulative limit would be exceeded',{lomustine_cumulative_with_next_mg_m2:1000.01},'withhold','LOM_CUMULATIVE_LIMIT','Lomustine SmPC4.2'],
 ['Prior cumulative exposure without proposed total',{lomustine_cumulative_mg_m2:900},'consultant_review','LOM_CUMULATIVE_REVIEW','Lomustine SmPC4.2'],
 ['New respiratory symptoms',{pulmonary_symptoms_or_concern:true},'withhold','LOM_PULMONARY','Lomustine SmPC4.4'],
 ['PFT risk is below70, not a60hardhold',{dlco_percent_predicted:69.9},'consultant_review','LOM_LOW_PFT_CAUTION','00742p6 / Lomustine SmPC4.4'],
 ['Severe other toxicity is not a borrowed dose ladder',{other_nonhaem_toxicity_grade:3},'withhold','LOM_OTHER_SEVERE_TOXICITY','NCCP adverse-effect review / Lomustine SmPC'],
 ['Wound unhealed',{wound_fully_healed:false},'withhold','UNHEALED_WOUND_OR_RECENT_SURGERY','EMA4.4'],
 ['Elapsed28days does not prove healing',{days_since_major_surgery:28},'consultant_review','SURGERY_HEALING_UNCONFIRMED','EMA4.4'],
 ['Major surgery planned',{planned_major_surgery:true},'withhold','PLANNED_MAJOR_SURGERY','00742p5 / EMA4.4'],
 ['Minor surgery planned',{planned_minor_surgery:true},'consultant_review','PLANNED_MINOR_SURGERY','00742p5 / EMA4.4'],
 ['Uncontrolled symptomatic BP',{uncontrolled_or_symptomatic_hypertension:true},'withhold','UNCONTROLLED_HYPERTENSION','p4 Table4'],
 ['Grade2 BP',{hypertension_grade:2},'consultant_review','GRADE2_HTN_REVIEW','p4 Table4'],
 ['Grade3 persistence unknown',{hypertension_grade:3},'consultant_review','GRADE3_HTN_REVIEW','p4 Table4'],
 ['Persisting grade3 BP',{hypertension_grade:3,hypertension_grade3_persisting:true},'discontinue','PERSISTENT_G3_OR_G4_HYPERTENSION','p4 Table4'],
 ['Prior persistent grade3 cannot be silently restarted',{hypertension_grade:1,hypertension_grade3_persisting:true},'consultant_review','PERSISTENT_G3_HISTORY','p4 Table4'],
 ['Medically significant refractory BP',{clinically_significant_htn_not_controlled:true},'permanently_discontinue','SEVERE_UNCONTROLLED_BP','EMA4.4'],
 ['Hypertensive crisis',{hypertensive_crisis_or_encephalopathy:true},'permanently_discontinue','HYPERTENSIVE_CRISIS_PRES','EMA4.4'],
 ['2+ screen allows conditional current dose',{proteinuria_dipstick:'2+'},'proceed_with_caution','PROTEIN_DIPSTICK_2_3','p4 Table3'],
 ['4+ screen requires quantification hold',{proteinuria_dipstick:'4+'},'withhold','PROTEIN_DIPSTICK_4','p4 Table3'],
 ['Quantified protein above2',{urine_protein_g_24h:2.01},'withhold','PROTEIN_2_TO_4','p4 Table3'],
 ['Quantified protein above4',{urine_protein_g_24h:4.01},'discontinue','PROTEIN_OVER_4','p4 Table3'],
 ['Nephrotic syndrome independently stops',{nephrotic_syndrome:true,urine_protein_g_24h:1},'permanently_discontinue','NEPHROTIC_SYNDROME','EMA4.4'],
 ['TE fistula below grade4 still stops',{tracheoesophageal_fistula:true,fistula_grade:2},'permanently_discontinue','TE_FISTULA','p4 Table4'],
 ['Other grade4 fistula',{fistula_grade:4},'discontinue','GRADE4_FISTULA','p4 Table4'],
 ['Other internal fistula needs review',{other_internal_fistula:true},'consultant_review','OTHER_INTERNAL_FISTULA','EMA4.4'],
 ['Grade4 thromboembolism',{thromboembolic_event_grade:4},'discontinue','THROMBOEMBOLIC_G4','p4 Table4'],
 ['Grade2 venous event',{thromboembolic_event_grade:2},'consultant_review','THROMBOEMBOLIC_G2_G3','EMA4.4'],
 ['Any arterial event',{arterial_thromboembolic_event:true,thromboembolic_event_grade:2},'permanently_discontinue','ARTERIAL_THROMBOEMBOLIC_EVENT','EMA4.4'],
 ['Grade3 bleed',{haemorrhage_grade:3},'discontinue','HAEMORRHAGE_G3PLUS','p4 Table4'],
 ['Urgent bleed without known grade',{new_major_bleeding:true},'withhold','NEW_BLEEDING_REVIEW','EMA4.4'],
 ['GI perforation',{gi_perforation:true},'permanently_discontinue','GI_PERFORATION','p4 Table4 / EMA4.4'],
 ['Necrotising fasciitis',{necrotising_fasciitis:true},'discontinue','NECROTISING_FASCIITIS','EMA4.4'],
 ['Confirmed PRES',{pres_confirmed:true},'discontinue','PRES','EMA4.4'],
 ['Suspected PRES',{suspected_pres_or_acute_neuro_symptoms:true},'withhold','SUSPECTED_PRES','EMA4.4'],
 ['Infusion reaction',{infusion_reaction:true},'withhold','INFUSION_REACTION','EMA4.4'],
 ['Relevant high-risk comorbidity',{high_bleeding_thrombotic_cardiovascular_or_fistula_risk:true},'consultant_review','RISK_REVIEW','p2'],
 ['Concurrent RT',{concurrent_radiotherapy:true},'consultant_review','CONCURRENT_RT_REVIEW','00742p6 / Lomustine SmPC4.5'],
 ['Product wheat allergy/prior nitrosourea nonresponse',{wheat_allergy_or_nitrosourea_nonresponse:true},'contraindicated','PRODUCT_CONTRAINDICATION_REVIEW','Lomustine SmPC4.3'],
 ['Live vaccine concern',{live_vaccine_planned_or_given:true},'withhold','LIVE_VACCINE_REVIEW','Lomustine SmPC4.3-4.5'],
 ['Interaction review',{interaction_review_needed:true},'consultant_review','INTERACTION_REVIEW','Lomustine SmPC4.5'],
 ['Monitoring support incomplete',{monitoring_or_support_not_ready:true},'consultant_review','MONITORING_SUPPORT_REVIEW','p2 and Lomustine SmPC4.4'],
 ['Lomustine single-dose supply uncertain',{lomustine_formulation_or_supply_uncertain:true},'withhold','LOM_SUPPLY_SAFETY','p1']
 ];
 for(const [name,input,action,id,source]of witnesses)check(name,input,{action,yes:[id]},source);
 for(const [field,values,cut,id,action]of [['anc_x10e9_l',[0,.99,.999,1,1.001,1.5],1,'LOM_ANC_LT1','withhold'],['platelets_x10e9_l',[0,79.99,80,99,99.5,99.99,100,100.01],80,'LOM_PLT_LT80','withhold']])for(const n of values){let exp=n<cut?{action,yes:[id]}:{no:[id]};if(field==='platelets_x10e9_l'&&n>=80&&n<100)exp={action:'consultant_review',yes:['LOM_PLT_80_99'],no:[id]};check(`${field} boundary ${n}`,{[field]:n},exp);}
 for(const n of [0,29.99,30,30.01,49.99,50,50.01,60,100])check('Numeric CrCl boundary '+n,{crcl_ml_min:n},n<30?{action:'withhold',yes:['LOM_RENAL_LT30']}:n<=50?{action:'consultant_review',yes:['LOM_RENAL_30_50']}:{no:['LOM_RENAL_LT30','LOM_RENAL_30_50']});
 for(const n of ['gt50','30_50','lt30','dialysis'])check('Legacy renal '+n,{lomustine_renal_band:n},n==='30_50'?{action:'consultant_review',yes:['LOM_RENAL_30_50']}:n==='gt50'?{no:['LOM_RENAL_LT30','LOM_RENAL_30_50']}:{action:'withhold',yes:['LOM_RENAL_LT30']});
 check('Dialysis overrides apparently normal CrCl',{crcl_ml_min:90,haemodialysis:true},{action:'withhold',yes:['LOM_RENAL_LT30']});
 for(const v of ['none','mild','moderate','severe','uncertain'])check('Hepatic '+v,{lomustine_hepatic_severity:v},v==='severe'?{action:'withhold',yes:['LOM_HEPATIC_SEVERE']}:v==='uncertain'?{action:'consultant_review',yes:['LOM_HEPATIC_UNCERTAIN']}:{no:['LOM_HEPATIC_SEVERE','LOM_HEPATIC_UNCERTAIN']});
 for(const f of ['fvc_percent_predicted','dlco_percent_predicted'])for(const n of [0,59.9,60,69.9,70,70.1,100])check(f+' boundary'+n,{[f]:n},n<70?{action:'consultant_review',yes:['LOM_LOW_PFT_CAUTION'],no:['LOM_DLCO_LT60']}:{no:['LOM_LOW_PFT_CAUTION','LOM_DLCO_LT60']},'00742p6 / Lomustine SmPC4.4');
 for(const n of [0,41,41.99,42,42.01,56])for(const visit of ['combination_day1','bevacizumab_only',undefined])check('Repeat interval '+n+' '+visit,{days_since_last_lomustine:n,...(visit?{visit_type:visit}:{})},n<42&&visit!=='bevacizumab_only'?{action:'withhold',yes:['LOM_REPEAT_TOO_EARLY']}:{no:['LOM_REPEAT_TOO_EARLY']},'Lomustine SmPC4.2');
 for(const n of [999.99,1000,1000.01])check('Proposed cumulative total '+n,{lomustine_cumulative_with_next_mg_m2:n},n>1000?{action:'withhold',yes:['LOM_CUMULATIVE_LIMIT']}:{no:['LOM_CUMULATIVE_LIMIT']},'Lomustine SmPC4.2');
 for(const n of [0,27.99,28,28.01,50])for(const healed of [true,false,undefined])check('Surgery '+n+' healed '+healed,{days_since_major_surgery:n,...(healed===undefined?{}:{wound_fully_healed:healed})},n<28||healed===false?{action:'withhold',yes:['UNHEALED_WOUND_OR_RECENT_SURGERY']}:healed===undefined?{action:'consultant_review',yes:['SURGERY_HEALING_UNCONFIRMED']}:{no:['UNHEALED_WOUND_OR_RECENT_SURGERY','SURGERY_HEALING_UNCONFIRMED']},'EMA4.4');
 for(const grade of [0,1,2,3,4])for(const persist of [true,false,undefined]){const x={hypertension_grade:grade,...(persist===undefined?{}:{hypertension_grade3_persisting:persist})};let exp=grade===4||grade===3&&persist===true?{action:'discontinue',yes:['PERSISTENT_G3_OR_G4_HYPERTENSION']}:grade===3?{action:'consultant_review',yes:['GRADE3_HTN_REVIEW'],no:['PERSISTENT_G3_OR_G4_HYPERTENSION']}:persist===true?{action:'consultant_review',yes:['PERSISTENT_G3_HISTORY']}:grade===2?{action:'consultant_review',yes:['GRADE2_HTN_REVIEW']}:{no:['PERSISTENT_G3_OR_G4_HYPERTENSION']};check('BPgrade '+grade+' persistence '+persist,x,exp);}
 for(const n of [0,1.99,2,2.0001,3.99,4,4.0001,8])for(const dip of [undefined,'negative','2+','3+','4+']){const x={urine_protein_g_24h:n,...(dip?{proteinuria_dipstick:dip}:{})};let exp=n>4?{action:'discontinue',yes:['PROTEIN_OVER_4'],no:['PROTEIN_DIPSTICK_2_3']}:n>2?{action:'withhold',yes:['PROTEIN_2_TO_4'],no:['PROTEIN_DIPSTICK_2_3']}:dip==='4+'?{action:'withhold',yes:['PROTEIN_DIPSTICK_4'],no:['PROTEIN_DIPSTICK_2_3']}:['2+','3+'].includes(dip)?{action:'proceed_with_caution',yes:['PROTEIN_DIPSTICK_2_3']}:{no:['PROTEIN_OVER_4','PROTEIN_2_TO_4']};check('Protein '+n+' dip '+dip,x,exp);}
 for(const n of [.99,1,1.01])check('Spot concentration '+n,{urine_protein_g_l:n},n>=1?{action:'proceed_with_caution',yes:['PROTEIN_DIPSTICK_2_3']}:{no:['PROTEIN_DIPSTICK_2_3']});
 check('2+ cannot imply proceed in nephrotic syndrome',{proteinuria_dipstick:'2+',nephrotic_syndrome:true},{action:'permanently_discontinue',yes:['NEPHROTIC_SYNDROME'],no:['PROTEIN_DIPSTICK_2_3']});
 for(const grade of [0,1,2,3,4]){check('Haemorrhage grade '+grade,{haemorrhage_grade:grade},grade>=3?{action:'discontinue',yes:['HAEMORRHAGE_G3PLUS']}:{no:['HAEMORRHAGE_G3PLUS']});check('Fistula grade '+grade,{fistula_grade:grade},grade===4?{action:'discontinue',yes:['GRADE4_FISTULA']}:{no:['GRADE4_FISTULA']});check('TE fistula any grade '+grade,{tracheoesophageal_fistula:true,fistula_grade:grade},{action:'permanently_discontinue',yes:['TE_FISTULA']});}
 for(const [name,input,action,id]of witnesses){for(const field of Object.keys(input)){if(input[field]===true&&Object.keys(input).length===1)check(name+' false control',{[field]:false},{no:[id]},'Negative control for source-defined risk');}}
 check('Lomustine renal reduction cannot override bevacizumab stop',{crcl_ml_min:40,gi_perforation:true},{action:'permanently_discontinue',yes:['LOM_RENAL_30_50','GI_PERFORATION']});
 check('Lomustine marrow hold and bevacizumab protein stop remain separate',{anc_x10e9_l:.5,urine_protein_g_24h:5},{action:'discontinue',yes:['LOM_ANC_LT1','PROTEIN_OVER_4']});
 check('Bevacizumab-only visit does not repeat lomustine',{visit_type:'bevacizumab_only',days_since_last_lomustine:14},{no:['LOM_REPEAT_TOO_EARLY']},'NCCPp1');
 for(const x of [{crcl_ml_min:29.9},{lomustine_hepatic_severity:'severe'},{days_since_last_lomustine:20},{lomustine_cumulative_with_next_mg_m2:1100}])check('Bev-only does not apply lomustine dose hold '+JSON.stringify(x),{visit_type:'bevacizumab_only',...x},{action:'proceed_with_caution',no:['LOM_RENAL_LT30','LOM_HEPATIC_SEVERE','LOM_REPEAT_TOO_EARLY','LOM_CUMULATIVE_LIMIT']},'NCCPp1 and component-specific Tables1-2');
 for(const [field,values]of [['crcl_ml_min',[-1,'NaN','Infinity',{},[]]],['urine_protein_g_24h',[-1,'NaN',{},[]]],['assessment_type',['other',99,{},[]]],['hypertension_grade',[-1,5,'wrong',{},[]]],['lomustine_hepatic_severity',['ChildC',99,{},[]]]])for(const value of values)inv('Reject invalid '+field+' '+JSON.stringify(value),()=>{const r=E.assess(p,{[field]:value});assert(r.invalid.length);assert(!['proceed','proceed_with_caution'].includes(r.actionType));assert(!D.buildModificationModel(p,r).rows.some(x=>x.quantified));},'Input validity');
 inv('Current source hash',()=>assert.equal(p.metadata.source_pdf_sha256,crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'sources',code+'-nccp.pdf'))).digest('hex')));
 inv('Protocol validates',()=>{const r=V.validate(p);assert.deepEqual(r.errors,[]);assert.deepEqual(r.warnings,[])});
 inv('Source schedule and cap retained',()=>{assert.equal(p.treatment.cycle_length_days,42);assert.equal(p.treatment.planned_cycles,6);assert.deepEqual(p.treatment.components[0].days,code==='00742'?[1,15,29]:[1,22]);assert.deepEqual(p.treatment.components[1].days,[1]);assert.match(p.treatment.components[1].dose,/90.*160/);const m=D.buildModel(p);assert(m.allPhases.length);assert(m.allPhases.flatMap(x=>x.components).some(x=>/lomustine/i.test(x.drug)&&/160/.test(x.dose)));},'NCCPp1');
 inv('No bevacizumab percentage or dose ladder',()=>{assert(!p.rule_engine.rules.some(r=>(r.action.components||[]).includes('bevacizumab')&&r.action.type==='dose_reduce'));assert(!p.treatment.dose_levels)},'NCCPp3');
 inv('No false clinical approval',()=>{assert.equal(p.metadata.validation.clinical_use_authorised,false);assert.equal(p.metadata.validation.consultant_reviewed,false);assert.equal(p.metadata.validation.oncology_pharmacy_reviewed,false)});
 inv('All decision rules exercised',()=>{for(const r of p.rule_engine.rules)assert(idsSeen.has(r.id||r.rule_id),'Unexercised '+(r.id||r.rule_id))});
 coverage[code]={rules:p.rule_engine.rules.length,matched:p.rule_engine.rules.filter(r=>idsSeen.has(r.id||r.rule_id)).length};
}
const report={release:'0.84.39',mode:before?'before':'staged-or-integrated',total:cases.length,passed:cases.filter(x=>x.pass).length,failed:cases.filter(x=>!x.pass).length,coverage,clinical_use_authorised:false,cases};
fs.writeFileSync(path.join(__dirname,before?'source-case-before-results.json':'source-case-results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({total:report.total,passed:report.passed,failed:report.failed,coverage}));for(const c of cases.filter(x=>!x.pass))console.error(c.code,c.name,c.error);if(report.failed)process.exitCode=1;
