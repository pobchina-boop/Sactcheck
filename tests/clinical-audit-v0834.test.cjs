'use strict';
// Expected actions are transcribed from NCCP tables, not derived from encoded rules.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const E=require('../js/assessment-engine'),D=require('../js/protocol-dose-schedule'),O=require('../js/assessment-output');
const root=path.resolve(__dirname,'..'),out=[];
const ps=Object.fromEntries(['00216','00586','00623'].map(c=>[c,require('../protocols/gastrointestinal/'+fs.readdirSync(path.join(root,'protocols/gastrointestinal')).find(f=>f.startsWith(c)))]));
function test(c,name,input,expected,verify=()=>{}){const p=ps[c],r=E.assess(p,input),d=D.buildModificationModel(p,r);assert.equal(r.actionType,expected,`${c}: ${name}`);assert.deepEqual(r.errors,[]);assert.deepEqual(r.invalid,[]);verify(r,d);out.push({code:c,case:name,inputs:input,expected,actual:r.actionType,pass:true,partial:r.partialAssessment,findings:r.findings.filter(f=>!f.domainAssessment).map(f=>({id:f.ruleId,action:f.actionType,source:f.sourceText,explanation:f.explanation})),components:d.rows.map(r=>({component:r.component,action:r.actionLabel,dose:r.protocolDose}))});return {r,d};}
// Presence operators must be decidable, ordinary absent clinical values remain unknown.
const Rule=require('../js/rule-engine');
assert.equal(Rule.evaluateCondition({field:'x',operator:'missing'},{}).state,true);
assert.equal(Rule.evaluateCondition({field:'x',operator:'exists'},{}).state,false);
assert.equal(Rule.evaluateCondition({field:'x',operator:'missing'},{x:0}).state,false);
assert.equal(Rule.evaluateCondition({field:'x',operator:'<' ,value:1},{}).state,'unknown');
const tmz=require('../protocols/neuro-oncology/00334-temozolomide-with-radiotherapy-and-adjuvant-therapy.json');
assert(E.assess(tmz,{anc_x10e9_l:1.4}).findings.some(f=>f.ruleId==='PHASE_REQUIRED_COUNTS'));
const capeOnly=(r,d)=>assert(d.rows.every(x=>x.component==='Capecitabine'));
const percent=pct=>(r,d)=>{capeOnly(r,d);assert(d.rows.some(x=>x.protocolDose.startsWith(`${pct}% of documented starting dose`)));assert(!d.rows.some(x=>/937.5|618.75/.test(x.protocolDose)));};
for(const c of Object.keys(ps)){
 const p=ps[c],renal=c==='00216'?'crcl_ml_min':'capecitabine_renal_band',bil=c==='00216'?'bilirubin_ratio_uln':'capecitabine_bilirubin_uln',trans=c==='00216'?'alt_ast_ratio_uln':'capecitabine_alt_ast_uln';
 test(c,'Blank inputs',{},'incomplete');
 test(c,'ANC-only hold',{anc_x10e9_l:1.49},'withhold',(r,d)=>{capeOnly(r,d);assert(r.unassessed.length);assert.equal(r.complete,false);});
 if(c!=='00586'){test(c,'Baseline ANC 1.4 requires initiation review',{assessment_type:'baseline',anc_x10e9_l:1.4},'consultant_review');test(c,'Within-cycle ANC 1.4 uses separate source threshold',{assessment_type:'within_cycle',anc_x10e9_l:1.4},'consultant_review');test(c,'Within-cycle ANC 0.9 interrupts',{assessment_type:'within_cycle',anc_x10e9_l:.9},'withhold');}
 test(c,'Platelets-only hold',{platelets_x10e9_l:74.9},'withhold',capeOnly);
 for(const [f,vals] of [['anc_x10e9_l',[.49,.5,.99,1,1.49]],['platelets_x10e9_l',[24.9,25,49.9,50,74.9]]])for(const v of vals)test(c,`${f} boundary ${v}`,{[f]:v},v<(f==='anc_x10e9_l'?.5:25)?'discontinue':'withhold',capeOnly);
 // Table 1 recurrence matrix, with both recovery counts independently confirmed.
 const matrix=[{field:'lowest_anc_episode',v:1.2,doses:[100,75,50,0]},{field:'lowest_anc_episode',v:.7,doses:[75,50,0,0]},{field:'lowest_platelets_episode',v:60,doses:[100,75,50,0]},{field:'lowest_platelets_episode',v:30,doses:[75,50,0,0]}];
 for(const m of matrix)for(let n=1;n<=4;n++){const pct=m.doses[n-1];test(c,`Recovered ${m.field} ${m.v}, occurrence ${n}`,{anc_x10e9_l:1.5,platelets_x10e9_l:75,[m.field]:m.v,haematology_occurrence:n},pct===0?'discontinue':pct===100?'consultant_review':'dose_reduce',pct>0&&pct<100?percent(pct):capeOnly);}
 test(c,'Missing platelet recovery prevents automatic restart dose',{anc_x10e9_l:1.5,lowest_anc_episode:.7,haematology_occurrence:1},'partial_context_required',(r,d)=>assert(!d.rows.some(x=>x.actionType==='dose_reduce')));
 for(const prefix of ['diarrhoea','mucositis','other_nonhaem_toxicity']){
  const field=prefix+'_grade';test(c,`${prefix} grade 2 alone`,{[field]:2},'withhold',capeOnly);
  for(const [grade,doses] of [[2,[100,75,50,0]],[3,[75,50,0,0]]])for(let n=1;n<=4;n++){const pct=doses[n-1];test(c,`Recovered ${prefix} grade ${grade}, occurrence ${n}`,{[field]:1,[prefix+'_highest_grade']:grade,[prefix+'_occurrence']:n},pct===0?'discontinue':pct===100?'consultant_review':'dose_reduce',pct>0&&pct<100?percent(pct):capeOnly);}
  test(c,`${prefix} grade 4`,{[field]:4},'discontinue',(r,d)=>{capeOnly(r,d);assert(JSON.stringify(r.findings).includes('exceptionally'));});
  test(c,`${prefix} remains active despite reduction history`,{[field]:2,[prefix+'_highest_grade']:3,[prefix+'_occurrence']:2},'withhold',(r,d)=>assert.equal(d.rows[0].protocolDose,'No dose now'));
 }
 test(c,'Hand-foot grade 2 hold',{hand_foot_syndrome_grade:2},'withhold',capeOnly);
 test(c,'Recovered grade 3 hand-foot requires unquantified reduction',{hand_foot_syndrome_grade:1,hand_foot_highest_grade:3},'consultant_review',(r,d)=>{assert(d.rows[0].protocolDose.includes('does not specify'));assert(!d.rows[0].protocolDose.includes('75%'));});
 for(const [f,limit] of [[bil,3],[trans,2.5]]){
  test(c,`${f} above`,{[f]:limit+.01},'withhold',capeOnly);
  for(const v of [limit-.01,limit]){const r=E.assess(p,{[f]:v});assert(!r.findings.some(f=>f.ruleId==='HEPATOTOXICITY'));out.push({code:c,case:`${f} ${v} does not exceed threshold`,inputs:{[f]:v},expected:'No hepatotoxicity hold',actual:r.actionType,pass:true});}
 }
 test(c,'Renal band 30–50',{[renal]:'30_50'},c==='00623'?'consultant_review':'dose_reduce',c==='00623'?(r,d)=>{assert(d.rows[0].protocolDose.includes('Source discrepancy'));assert(!/Use 75%/.test(d.rows[0].actionLabel));}:percent(75));
 for(const v of [29.9,30,50,51])test(c,`Numeric CrCl ${v}`,{[renal]:v},v<30?(c==='00623'?'discontinue':'contraindicated'):v<=50?(c==='00623'?'consultant_review':'dose_reduce'):'proceed_with_caution');
 test(c,'Unrounded renal boundary review',{[renal]:50.5},'consultant_review');
 test(c,'Severe hepatic SmPC exclusion',{hepatic_impairment_severity:'severe'},'contraindicated');
 test(c,'Dialysis',{[renal]:'dialysis'},c==='00623'?'consultant_review':'contraindicated',r=>{assert.equal(r.inputs.haemodialysis,true);assert(!JSON.stringify(r.displayInputs).includes('0 mL/min'));});
 for(const [v,a] of [['complete','contraindicated'],['partial','consultant_review'],['unknown','consultant_review']])test(c,`DPD ${v}`,{dpd_status:v},a,capeOnly);
 test(c,'Brivudine exclusion',{recent_or_concomitant_brivudine:true},'contraindicated',capeOnly);
 test(c,'Previous severe unexpected reaction',{history_severe_unexpected_fluoropyrimidine_reaction:true},'contraindicated',capeOnly);
 test(c,'Outside ECOG source eligibility',{ecog:c==='00586'?2:3},'consultant_review');
 test(c,'Competing 75 and 50 percent choose 50',{diarrhoea_grade:1,diarrhoea_highest_grade:3,diarrhoea_occurrence:1,mucositis_grade:1,mucositis_highest_grade:3,mucositis_occurrence:2},'dose_reduce',percent(50));
 assert(p.rule_engine.rules.every(r=>r.source.url&&r.source.page));assert.equal(p.metadata.validation.clinical_use_authorised,false);
 assert.equal(p.supportive_care.emetogenic_risk,'oral_minimal_low');
 const result=E.assess(p,{diarrhoea_grade:1,diarrhoea_highest_grade:3,diarrhoea_occurrence:2});assert(JSON.stringify(O.buildModel({protocol:p,result})).includes('50% of documented starting dose'));
}
for(const [v,a] of [[1.9,'proceed_with_caution'],[2,'proceed_with_caution'],[2.1,'withhold'],[4,'withhold'],[4.1,'discontinue']])test('00623',`Urine protein ${v}`,{proteinuria_g_24h:v},a,(r,d)=>assert(d.rows.every(x=>x.component==='Bevacizumab')));
for(const [v,a] of [['0','proceed_with_caution'],['1','proceed_with_caution'],['2','proceed_with_caution'],['3','proceed_with_caution'],['4','withhold']])test('00623',`Dipstick ${v}`,{urine_protein_dipstick:v},a);
for(const [field,action] of [['gi_perforation','discontinue'],['te_or_grade4_fistula','discontinue'],['grade4_thromboembolic_event','discontinue'],['arterial_thromboembolic_event','discontinue'],['grade4_proteinuria','discontinue'],['persistent_grade3_hypertension','discontinue'],['uncontrolled_hypertension','withhold'],['unhealed_wound','withhold'],['elective_major_surgery_due','withhold'],['minor_surgery_due','withhold'],['pres','discontinue'],['necrotising_fasciitis','discontinue']])test('00623',field,{[field]:true},action,(r,d)=>assert.deepEqual(d.rows.map(x=>x.component),['Bevacizumab']));
test('00623','Bevacizumab stop plus capecitabine hold',{proteinuria_g_24h:4.1,anc_x10e9_l:1.4},'discontinue',(r,d)=>{assert.equal(d.rows.find(x=>x.component==='Capecitabine').actionLabel,'Withhold now');assert.equal(d.rows.find(x=>x.component==='Bevacizumab').actionLabel,'Discontinue');});
test('00623','Baseline platelets exactly 100 fails strict eligibility',{assessment_type:'baseline',platelets_x10e9_l:100},'consultant_review');
for(const field of ['baseline_ast_ratio_uln','alp_uln_multiple']){test('00623',`${field} above eligibility`,{assessment_type:'baseline',[field]:5.01},'consultant_review');const r=E.assess(ps['00623'],{assessment_type:'baseline',[field]:5});assert(!r.findings.some(f=>f.ruleId==='BASELINE_COMBINATION_ELIGIBILITY'));}
test('00623','Before 28 days after surgery',{days_since_major_surgery:27},'withhold');
test('00623','Severe hepatic exclusion',{hepatic_impairment_severity:'severe'},'contraindicated');
if(process.env.SACT_WRITE_VALIDATION){fs.mkdirSync(path.join(root,'validation/colorectal-v0834'),{recursive:true});fs.writeFileSync(path.join(root,'validation/colorectal-v0834/engine-cases.json'),JSON.stringify(out,null,2)+'\n');}
console.log(`${out.length} source-based capecitabine boundary and recurrence cases passed.`);
