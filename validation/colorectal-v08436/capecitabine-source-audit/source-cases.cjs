'use strict';
// Expected source thresholds/matrices below were transcribed from NCCP Tables 1–6
// and EMA SmPC 4.2–4.5; expected actions are not derived from the encoded rule list.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..'),E=require(path.join(root,'js/assessment-engine')),D=require(path.join(root,'js/protocol-dose-schedule'));
const before=process.argv.includes('--before');
const p=JSON.parse(fs.readFileSync(before?path.join(__dirname,'00216-before.json'):path.join(root,'protocols/gastrointestinal/00216-capecitabine-monotherapy.json')));
const current=JSON.parse(fs.readFileSync(path.join(root,'protocols/gastrointestinal/00216-capecitabine-monotherapy.json'))),cases=[];
function check(name,input,expect={}){let row={name,input,source:expect.source||'NCCP00216v8 pp2–6 / EMA Xeloda SmPC4.2–4.5',expected:expect};try{
 const r=E.assess(p,input),m=D.buildModificationModel(p,r),ids=r.findings.map(f=>f.ruleId);assert.deepEqual(r.errors,[]);assert.deepEqual(r.invalid,[]);
 require(path.join(root,'tests/helpers/source-input-validation-v08421.cjs'))(r);
 if(expect.action)assert.equal(r.actionType,expect.action);
 for(const id of expect.yes||[])assert(ids.includes(id),'Missing rule '+id);
 for(const id of expect.no||[])assert(!ids.includes(id),'Unexpected rule '+id);
 const numeric=m.rows.filter(x=>/^\d+(?:\.\d+)?% of documented starting dose/.test(x.protocolDose||''));
 if(expect.pct)assert(numeric.some(x=>x.protocolDose.startsWith(expect.pct+'% ')),'Missing numeric source target '+expect.pct);
 if(expect.noNumeric)assert.equal(numeric.length,0,'Unsafe numeric restart');
 if(expect.text)assert(JSON.stringify(r.findings).includes(expect.text),'Missing explanation '+expect.text);
 row.actual={action:r.actionType,rule_ids:ids.filter(x=>!/^PARTIAL_/.test(x)),component_doses:m.rows.map(x=>({component:x.component,action:x.actionType,dose:x.protocolDose}))};row.pass=true;
}catch(e){row.pass=false;row.error=e.message}cases.push(row)}
function invariant(name,fn,source){try{fn();cases.push({name,source,pass:true})}catch(e){cases.push({name,source,pass:false,error:e.message})}}
check('Entirely omitted assessment',{}, {action:'incomplete',noNumeric:true});
for(const f of Object.keys(current.input_definitions))for(const v of [null,''])check(f+' blank '+JSON.stringify(v),{[f]:v},{action:'incomplete',noNumeric:true,source:'Missing values remain unassessed; not normal'});
for(const [field,id] of [['capecitabine_hypersensitivity','CAPECITABINE_ALLERGY'],['history_severe_unexpected_fluoropyrimidine_reaction','PREVIOUS_SEVERE_REACTION'],['pregnancy','PREGNANCY_LACTATION'],['breastfeeding','PREGNANCY_LACTATION'],['recent_or_concomitant_brivudine','BRIVUDINE']]){
 check(field+' exclusion',{[field]:true},{action:'contraindicated',yes:[id],noNumeric:true});check(field+' assessed absent',{[field]:false},{no:[id]});
}
for(const v of [0,1,2,3,4])check('ECOG '+v,{ecog:v},v>2?{action:'consultant_review',yes:['ECOG_ELIGIBILITY']}:{no:['ECOG_ELIGIBILITY']});
for(const [v,action,id] of [['normal',null,null],['partial','consultant_review','DPD_PARTIAL'],['complete','contraindicated','DPD_COMPLETE'],['unknown','consultant_review','DPD_UNKNOWN']])check('DPD '+v,{dpd_status:v},{action,yes:id?[id]:[],noNumeric:true});
for(const [f,values,cut] of [['anc_x10e9_l',[.49,.5,.99,1,1.49,1.5,1.51],1.5],['platelets_x10e9_l',[24.9,25,49.9,50,74.9,75,99.9,100,100.1],100]])for(const v of values){
 check('Baseline '+f+' '+v,{assessment_type:'baseline',[f]:v},v<cut?{action:'consultant_review',yes:['BASELINE_COUNTS_CAUTION'],text:'EMA SmPC',noNumeric:true}:{no:['BASELINE_COUNTS_CAUTION','CURRENT_LOW_COUNTS'],noNumeric:true});
 const threshold=f==='anc_x10e9_l'?1:75;
 check('Within cycle '+f+' '+v,{assessment_type:'within_cycle',[f]:v},v<threshold?{action:'withhold',yes:['WITHIN_CYCLE_LOW_COUNT'],noNumeric:true}:{no:['WITHIN_CYCLE_LOW_COUNT','CURRENT_LOW_COUNTS'],noNumeric:true});
 const next=f==='anc_x10e9_l'?1.5:75;
 check('Subsequent dose '+f+' '+v,{assessment_type:'current',[f]:v},v<(f==='anc_x10e9_l'?.5:25)?{action:'discontinue',yes:['SEVERE_HAEM_STOP_OR_EXCEPTION'],noNumeric:true}:v<next?{action:'withhold',yes:['CURRENT_LOW_COUNTS'],noNumeric:true}:{no:['CURRENT_LOW_COUNTS'],noNumeric:true});
}
// Table1: both recovered counts and BOTH same-episode nadirs explicitly documented.
for(const [field,value,targets] of [['lowest_anc_episode',1.2,[100,75,50,0]],['lowest_anc_episode',.7,[75,50,0,0]],['lowest_platelets_episode',60,[100,75,50,0]],['lowest_platelets_episode',30,[75,50,0,0]]])for(let n=1;n<=4;n++){
 const target=targets[n-1],input={assessment_type:'current',anc_x10e9_l:1.5,platelets_x10e9_l:75,lowest_anc_episode:1.5,lowest_platelets_episode:75,[field]:value,haematology_occurrence:n,capecitabine_previous_dose_percent:100};
 check('Active count '+field+'/'+value+' event '+n,{assessment_type:'current',[field==='lowest_anc_episode'?'anc_x10e9_l':'platelets_x10e9_l']:value,haematology_occurrence:n},target===0?{action:'discontinue',noNumeric:true}:{action:'withhold',noNumeric:true});
 check('Recovered '+field+'/'+value+' event '+n,input,target===0?{action:'discontinue',noNumeric:true}:target===100?{action:'consultant_review',noNumeric:true}:{action:'dose_reduce',pct:target});
 if(target>0&&target<100){
  for(const hist of [undefined,null,target-1,target,target+1]){
   const x={...input};if(hist===undefined)delete x.capecitabine_previous_dose_percent;else x.capecitabine_previous_dose_percent=hist;
   check('Prior dose '+hist+' '+field+' event '+n,x,hist==null||hist<target?{action:'consultant_review',noNumeric:true}:{action:'dose_reduce',pct:target});
  }
  for(const omit of ['anc_x10e9_l','platelets_x10e9_l','lowest_anc_episode','lowest_platelets_episode']){
   const x={...input};delete x[omit];check('Missing '+omit+' '+field+' event '+n,x,{noNumeric:true});
  }
 }
}
for(const [field,band] of [['lowest_anc_episode',.49],['lowest_platelets_episode',24.9]])for(const n of [1,2,3,4])check('Severe prior count '+field+' event '+n,{assessment_type:'current',[field]:band,haematology_occurrence:n,anc_x10e9_l:1.5,platelets_x10e9_l:75},{action:'discontinue',yes:['SEVERE_HAEM_STOP_OR_EXCEPTION'],text:'first event only',noNumeric:true});
for(const [field,band,n] of [['lowest_anc_episode',1.2,4],['lowest_anc_episode',.7,3],['lowest_platelets_episode',60,4],['lowest_platelets_episode',30,3]])check('Haematology permanent stop despite partial recovery '+field+'/'+band,{assessment_type:'current',[field]:band,haematology_occurrence:n,anc_x10e9_l:1.2,platelets_x10e9_l:60},{action:'discontinue',noNumeric:true});
for(const prefix of ['diarrhoea','mucositis','other_nonhaem_toxicity']){
 for(const grade of [0,1,2,3,4])check(prefix+' current grade alone '+grade,{[prefix+'_grade']:grade},grade===4?{action:'discontinue',yes:[prefix.toUpperCase()+'_G4'],noNumeric:true}:grade>=2?{action:'withhold',yes:[prefix.toUpperCase()+'_CURRENT_HOLD'],noNumeric:true}:{no:[prefix.toUpperCase()+'_CURRENT_HOLD'],noNumeric:true});
 for(const [grade,targets] of [[2,[100,75,50,0]],[3,[75,50,0,0]]])for(let n=1;n<=4;n++){
  const target=targets[n-1];const x={[prefix+'_grade']:1,[prefix+'_highest_grade']:grade,[prefix+'_occurrence']:n,capecitabine_previous_dose_percent:100};
  check(prefix+' active grade '+grade+' event '+n,{[prefix+'_grade']:grade,[prefix+'_occurrence']:n},target===0?{action:'discontinue',noNumeric:true}:{action:'withhold',noNumeric:true});
  check(prefix+' recovered grade '+grade+' event '+n,x,target===0?{action:'discontinue',noNumeric:true}:target===100?{action:'consultant_review',noNumeric:true}:{action:'dose_reduce',pct:target});
  if(target>0&&target<100){for(const prior of [undefined,null,target-1,target,target+1]){let y={...x};if(prior===undefined)delete y.capecitabine_previous_dose_percent;else y.capecitabine_previous_dose_percent=prior;check(prefix+' prior '+prior+' G'+grade+' event '+n,y,prior==null||prior<target?{action:'consultant_review',noNumeric:true}:{action:'dose_reduce',pct:target});}}
  check(prefix+' still symptomatic G'+grade+' event '+n,{...x,[prefix+'_grade']:2},target===0?{action:'discontinue',noNumeric:true}:{action:'withhold',noNumeric:true});
 }
 for(const n of [1,2])check(prefix+' peakG3partialimprovementstillG2event'+n,{[prefix+'_grade']:2,[prefix+'_highest_grade']:3,[prefix+'_occurrence']:n},{action:'withhold',yes:[prefix.toUpperCase()+'_ACTIVE_PRIOR_G3_'+n],no:[prefix.toUpperCase()+'_2_'+n+'_0'],noNumeric:true});
 check(prefix+' missing current recovery',{[prefix+'_highest_grade']:3,[prefix+'_occurrence']:1,capecitabine_previous_dose_percent:100},{noNumeric:true});
 check(prefix+' missing occurrence',{[prefix+'_grade']:1,[prefix+'_highest_grade']:3,capecitabine_previous_dose_percent:100},{noNumeric:true});
 check(prefix+' G4 history despite improved G1',{[prefix+'_grade']:1,[prefix+'_highest_grade']:4,[prefix+'_occurrence']:1},{action:'discontinue',noNumeric:true});
}
for(const v of [0,1,2,3])check('HFS current '+v,{hand_foot_syndrome_grade:v},v>=2?{action:'withhold',yes:['HFS_CURRENT_HOLD'],noNumeric:true}:{no:['HFS_CURRENT_HOLD'],noNumeric:true});
check('HFS grade3 recovered, no numeric invented',{hand_foot_syndrome_grade:1,hand_foot_highest_grade:3},{action:'consultant_review',yes:['HFS_RECOVERED_G3'],noNumeric:true,text:'does not specify'});
for(const f of ['bilirubin_ratio_uln','alt_ast_ratio_uln']){
 const cut=f.startsWith('bilirubin')?3:2.5;
 for(const v of [cut-.01,cut,cut+.01])for(const ctx of [undefined,'baseline','current','within_cycle']){
  const x={[f]:v,...(ctx?{assessment_type:ctx}:{})};
  check(f+'/'+v+'/'+ctx,x,v>cut?(ctx==='baseline'?{action:'consultant_review',yes:['LIVER_TIMING_ATTRIBUTION_REVIEW'],no:['HEPATOTOXICITY'],noNumeric:true}:{action:'withhold',yes:['HEPATOTOXICITY'],noNumeric:true}):{no:['HEPATOTOXICITY','LIVER_TIMING_ATTRIBUTION_REVIEW'],noNumeric:true});
 }
 check(f+' high but attributed non-treatment-related',{assessment_type:'current',[f]:cut+.01,treatment_related_liver_abnormality:false},{action:'consultant_review',yes:['LIVER_TIMING_ATTRIBUTION_REVIEW'],no:['HEPATOTOXICITY'],noNumeric:true});
}
check('Severe hepatic impairment',{hepatic_impairment_severity:'severe'},{action:'contraindicated',yes:['SEVERE_HEPATIC_SMPC_EXCLUSION'],noNumeric:true});
check('Mild/moderate hepatic impairment',{hepatic_impairment_severity:'mild_moderate'},{action:'consultant_review',yes:['HEPATIC_IMPAIRMENT'],noNumeric:true});
for(const v of [0,29.99,30,30.01,49.99,50,50.01,50.99,51,51.01,80,80.01]){
 check('CrCl numeric boundary '+v,{assessment_type:'baseline',capecitabine_starting_dose:'1250',crcl_ml_min:v},v<30?{action:'contraindicated',yes:['RENAL_LT30'],noNumeric:true}:v<=50?{action:'dose_reduce',yes:['RENAL_30_50'],pct:75}:v<51?{action:'consultant_review',yes:['RENAL_GAP'],noNumeric:true}:{action:'proceed_with_caution',yes:['RENAL_NO_REDUCTION'],noNumeric:true});
}
for(const start of [undefined,'1250','1000','other'])for(const phase of [undefined,'baseline','current','within_cycle'])for(const prior of [undefined,50,74.99,75,100]){
 const x={crcl_ml_min:'30_50',...(start?{capecitabine_starting_dose:start}:{}),...(phase?{assessment_type:phase}:{}),...(prior?{capecitabine_previous_dose_percent:prior}:{})};
 const safe=start==='1250'&&((phase==='baseline'&&prior===undefined)||prior>=75);
 check('Renal context '+start+'/'+phase+'/'+prior,x,safe?{action:'dose_reduce',yes:['RENAL_30_50'],pct:75}:{action:'consultant_review',yes:['RENAL_30_50_CONTEXT_REVIEW'],noNumeric:true});
}
check('Dialysis source band',{crcl_ml_min:'dialysis'},{action:'contraindicated',yes:['RENAL_DIALYSIS'],noNumeric:true});
check('Genuine renal safe band still no overall clearance',{crcl_ml_min:'gt80'},{action:'proceed_with_caution',yes:['RENAL_NO_REDUCTION'],noNumeric:true});
for(const [f,id,action] of [['current_chest_pain','CURRENT_CHEST_PAIN_HOLD','withhold'],['significant_cardiac_history','CARDIAC_HISTORY_REVIEW','consultant_review'],['severe_skin_reaction','SEVERE_SKIN_STOP','discontinue'],['coumarin_anticoagulant','COUMARIN_MONITORING','consultant_review'],['phenytoin_use','PHENYTOIN_MONITORING','consultant_review']]){
 check(f+' present',{[f]:true},{action,yes:[id],noNumeric:true});check(f+' absent',{[f]:false},{no:[id],noNumeric:true});
}
for(const [v,a,id] of [['none',null,null],['grade1',null,null],['grade2_or_more','withhold','DEHYDRATION_HOLD'],['recovered_cause_uncontrolled','withhold','DEHYDRATION_HOLD'],['recovered_cause_controlled','consultant_review','DEHYDRATION_RECOVERY_REVIEW']])check('Dehydration '+v,{dehydration_status:v},{action:a,yes:id?[id]:[],noNumeric:true});
for(const [domain,extra,action] of [['dehydration',{dehydration_status:'grade2_or_more'},'withhold'],['cardiac',{current_chest_pain:true},'withhold'],['severe skin',{severe_skin_reaction:true},'discontinue'],['completeDPD',{dpd_status:'complete'},'contraindicated'],['currentdiarrhoea',{diarrhoea_grade:2},'withhold']])check(domain+' overrides recovered numerical mucositis target',{mucositis_grade:1,mucositis_highest_grade:3,mucositis_occurrence:1,capecitabine_previous_dose_percent:100,...extra},{action,noNumeric:true});
check('Competing recovered75and50 uses50 without stacking',{diarrhoea_grade:1,diarrhoea_highest_grade:3,diarrhoea_occurrence:1,mucositis_grade:1,mucositis_highest_grade:3,mucositis_occurrence:2,capecitabine_previous_dose_percent:100},{action:'dose_reduce',pct:50});
for(const [f,values] of [['capecitabine_previous_dose_percent',[0,-1,100.01,'NaN','Infinity',{},[]]],['anc_x10e9_l',[-1,'NaN',{},[]]],['platelets_x10e9_l',[-1,'Infinity',{},[]]],['diarrhoea_grade',[5,-1,{},[]]],['dehydration_status',['unknown_typo',3,{},[]]],['capecitabine_starting_dose',['999',{},[]]]])for(const value of values)invariant('Reject invalid '+f+' '+JSON.stringify(value),()=>{const r=E.assess(p,{[f]:value});assert(r.invalid.length>0,'Invalid supplied value was not identified');const m=D.buildModificationModel(p,r);assert(!m.rows.some(x=>/^\d+%/.test(x.protocolDose||'')));},'Input type/range safety; unsupported values are not normal');
for(const field of ['diarrhoea_grade','diarrhoea_highest_grade','hand_foot_syndrome_grade','hand_foot_highest_grade'])invariant('Rendered source provenance '+field,()=>{const vm=require('node:vm'),ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'js/ctcae-descriptors.js'),'utf8'),ctx);const d=p.input_definitions[field],g=ctx.window.SACTCheckCTCAE.guide({...d,id:field});assert.equal(g.sourceSpecific,true);assert.equal(g.version,'NCCP 00216 v8 · table '+(field.startsWith('diarrhoea')?'4':'5')+' (page 5)');assert.equal(g.sourceUrl,'https://healthservice.hse.ie/documents/6558/216_v8_Capecitabine.pdf');assert.equal(g.calculable,false);assert.deepEqual(JSON.parse(JSON.stringify(g.grades.map(x=>x.description))),d.options.map(x=>x.description));assert.doesNotMatch(g.version,/CTCAE vNCCP/);},'NCCP p5 Tables4–5: production grading guide source attribution and exact descriptors');
invariant('Stable indications preserved including00216fofflabelTNBC',()=>assert.deepEqual(p.indications,JSON.parse(fs.readFileSync(path.join(__dirname,'00216-before.json'))).indications),'NCCP p1 indications, p8 off-labelfootnote');
invariant('Original treatment phases and schedule preserved',()=>assert.deepEqual(p.treatment_phases,JSON.parse(fs.readFileSync(path.join(__dirname,'00216-before.json'))).treatment_phases),'NCCP p1');
invariant('HFS descriptors are source-table-specific',()=>{for(const f of ['hand_foot_syndrome_grade','hand_foot_highest_grade'])assert(p.input_definitions[f].options[2].description.includes('NCCP table 5'));},'NCCP p5 Table5');
invariant('DPD guidance retains renal uracil caveat',()=>assert(p.input_definitions.dpd_status.assessment_guidance.includes('uracil')),'NCCP p2; EMA p9');
invariant('Clinical and pharmacy independent review remain pending',()=>{assert.equal(p.metadata.validation.clinical_use_authorised,false);assert.equal(p.metadata.validation.consultant_reviewed,false);assert.equal(p.metadata.validation.oncology_pharmacy_reviewed,false);},'Governance status, not a clinical source criterion');
const result={release:'0.84.36',date:'2026-11-05',mode:before?'before':'current',total:cases.length,passed:cases.filter(x=>x.pass).length,failed:cases.filter(x=>!x.pass).length,clinical_use_authorised:false,cases};
fs.writeFileSync(path.join(__dirname,before?'source-case-results-before.json':'source-case-results.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({total:result.total,passed:result.passed,failed:result.failed,failures:cases.filter(x=>!x.pass).map(x=>({name:x.name,error:x.error}))},null,2));if(result.failed)process.exitCode=1;
