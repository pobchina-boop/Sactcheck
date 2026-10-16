'use strict';
// Expectations transcribed from NCCP 00227 v9, 00449 v6a and 00446 v7b,
// checked 2026-10-16. These are software checks, not clinical authorisation.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const E=require('../js/assessment-engine'),D=require('../js/protocol-dose-schedule'),O=require('../js/assessment-output');
const root=path.resolve(__dirname,'..'),results=[];
const protocols=Object.fromEntries(['00227','00449','00446'].map(c=>[c,require('../protocols/gastrointestinal/'+fs.readdirSync(path.join(root,'protocols/gastrointestinal')).find(f=>f.startsWith(c)))]));
function check(code,name,inputs,expected,verify=()=>{}){
 const p=protocols[code],r=E.assess(p,inputs),d=D.buildModificationModel(p,r);
 assert.equal(r.actionType,expected,`${code}: ${name}`);assert.deepEqual(r.errors,[]);assert.deepEqual(r.invalid,[]);verify(r,d);
 results.push({code,case:name,inputs,expected,actual:r.actionType,partial:r.partialAssessment,findings:r.findings.filter(f=>!f.domainAssessment).map(f=>({id:f.ruleId,action:f.actionType,source:f.sourceText,explanation:f.explanation})),componentActions:d.rows.map(x=>({component:x.component,action:x.actionLabel,dose:x.protocolDose})),pass:true});return {r,d};
}
const row=(d,name)=>{const r=d.rows.find(x=>x.component===name);assert(r,`Missing component ${name}`);return r;};
for(const code of ['00449','00446']){
 for(const [value,action] of [[1.9,'proceed_with_caution'],[2,'proceed_with_caution'],[2.1,'withhold'],[4,'withhold'],[4.1,'discontinue']])
  check(code,`24-hour protein ${value}`,{proteinuria_g_24h:value},action,(r,d)=>{assert(r.partialAssessment);assert(r.unassessed.length);if(value>2)assert.deepEqual(d.rows.map(x=>x.component),['Bevacizumab']);});
 check(code,'4+ dipstick',{urine_protein_dipstick:'4'},'withhold');
 for(const value of ['2','3'])check(code,`${value}+ dipstick`,{urine_protein_dipstick:value},'proceed_with_caution',r=>assert(r.findings.some(f=>/within three days/.test(f.explanation))));
 check(code,'Grade 4 proteinuria',{grade4_proteinuria:true},'discontinue');
 check(code,'Quantified stop overrides dipstick permission',{proteinuria_g_24h:4.1,urine_protein_dipstick:'2'},'discontinue');
 check(code,'Severe renal impairment',{renal_impairment_severity:'severe'},'consultant_review',(r,d)=>{assert(!JSON.stringify(r.findings).includes('50–66'));assert(row(d,'Infusional 5-FU').protocolDose.includes('does not quantify'));});
 const severity=code==='00446'?'hepatic_impairment_category':'hepatic_impairment_severity';
 for(const [value,bolus,infusion] of [['moderate','266.67 mg/m²','1600 mg/m²'],['severe','200 mg/m²','1200 mg/m²']])
  check(code,`${value} hepatic impairment`,{[severity]:value},'consultant_review',(r,d)=>{assert.equal(row(d,'Bolus 5-FU').protocolDose,bolus);assert.equal(row(d,'Infusional 5-FU').protocolDose,infusion);});
 for(const [field,value,action] of [['bilirubin_umol_l',84,'proceed_with_caution'],['bilirubin_umol_l',85,'consultant_review'],['bilirubin_umol_l',86,'contraindicated'],['ast_u_l',179,'proceed_with_caution'],['ast_u_l',180,'consultant_review'],['ast_u_l',181,'contraindicated']])
  check(code,`${field} ${value}`,{[field]:value},action,(r,d)=>{if(action==='contraindicated'){assert.equal(row(d,'Bolus 5-FU').protocolDose,'Not to be administered');assert.equal(row(d,'Infusional 5-FU').protocolDose,'Not to be administered');assert(!d.rows.some(x=>x.component==='Bevacizumab'));}});
 check(code,'Hepatic contraindication outranks reduction',{[severity]:'moderate',ast_u_l:181},'contraindicated',(r,d)=>assert.equal(row(d,'Infusional 5-FU').protocolDose,'Not to be administered'));
 const delay=code==='00446'?'delay_weeks':'toxicity_delay_weeks';
 for(const [field,value] of [['anc_x10e9_l',1.49],['platelets_x10e9_l',74.99]])
  check(code,`${field} low alone`,{[field]:value},'withhold',(r,d)=>{assert(!d.rows.some(x=>x.component==='Bevacizumab'));assert.equal(d.rows.length,4);assert(d.rows.every(x=>x.protocolDose==='No dose now'));});
 check(code,'Normal count alone remains partial',{anc_x10e9_l:1.5},'partial_context_required',r=>{assert.equal(r.complete,false);assert(r.unassessed.length>0);});
 check(code,'Platelets at threshold remain partial',{platelets_x10e9_l:75},'partial_context_required');
 check(code,'Low counts with delay 0',{platelets_x10e9_l:74,[delay]:0},'withhold');
 check(code,'Persistent low platelets',{platelets_x10e9_l:74,[delay]:code==='00446'?4:2},'discontinue',(r,d)=>{assert(!d.rows.some(x=>x.component==='Bevacizumab'));assert(d.rows.every(x=>x.protocolDose==='Not to be administered'));});
 check(code,'ANC and bevacizumab protein stop are independent',{anc_x10e9_l:1.49,proteinuria_g_24h:4.1},'discontinue',(r,d)=>{assert.equal(row(d,'Bevacizumab').actionLabel,'Discontinue');assert.equal(row(d,'Infusional 5-FU').actionLabel,'Withhold now');});
 check(code,'Uncontrolled/symptomatic hypertension',{uncontrolled_hypertension:true},'withhold',(r,d)=>assert.deepEqual(d.rows.map(x=>x.component),['Bevacizumab']));
 check(code,'Diarrhoea grade 2 alone',{diarrhoea_current_grade:2},'withhold');
 check(code,'Stomatitis grade 2 alone',{stomatitis_current_grade:2},'withhold');
 check(code,'Blank inputs',{},'incomplete',(r,d)=>assert.equal(d.rows.length,0));
 const p=protocols[code];assert.equal(p.supportive_care.emetogenic_risk,'moderate');assert.equal(p.supportive_care.script_id,'nccp-parenteral-moderate');
 const map=require('../data/emetogenic-risk-map.json').protocols[code];assert.equal(map.level,'moderate');assert.equal(map.script_id,p.supportive_care.script_id);
 assert(p.rule_engine.rules.every(r=>r.source.document.includes(code)||r.source.document.startsWith('Supplementary')));
 for(const rule of p.rule_engine.rules){
  if(/^(ANC_|PLATELETS_|HAEM_)/.test(rule.rule_id)&&!rule.rule_id.includes('BEYOND'))assert.equal(rule.source.page,4,`${code}/${rule.rule_id}: blood-count source page`);
  if(/^(DIARRHOEA_|STOMATITIS_)/.test(rule.rule_id))assert.equal(rule.source.page,6,`${code}/${rule.rule_id}: toxicity source page`);
 }
}
for(const [value,action] of [['renal_0_29','contraindicated'],['renal_exact_30','consultant_review'],['renal_gt30','proceed_with_caution'],['dialysis','consultant_review'],[29.9,'contraindicated'],[30,'consultant_review'],[30.1,'proceed_with_caution']])
 check('00446',`CrCl ${value}`,{crcl_ml_min:value},action,(r,d)=>{if(value==='renal_0_29'){assert.equal(r.displayInputs.crcl_ml_min,'<30 mL/min');assert(row(d,'Oxaliplatin').trigger.includes('<30 mL/min'));assert(E.documentationSummary(r).includes('<30 mL/min'));const output=O.buildModel({protocol:protocols['00446'],result:r});assert(JSON.stringify(output).includes('<30 mL/min'));assert(!JSON.stringify(output).includes('mL/min mL/min'));}});
check('00446','Recovered grade 4 ANC nadir, mixed omit/reduce',{anc_x10e9_l:1.5,platelets_x10e9_l:75,lowest_anc_delayed_weeks_x10e9_l:.49},'dose_reduce',(r,d)=>{
 assert.equal(row(d,'Oxaliplatin').protocolDose,'65 mg/m²');assert.equal(row(d,'Bolus 5-FU').actionLabel,'Omit component');assert.equal(row(d,'Folinic acid').actionLabel,'Omit component');assert.equal(row(d,'Infusional 5-FU').protocolDose,'1900 mg/m²');assert.equal(d.rows.length,4);
});
check('00446','Stomatitis has no inherited two-week stop',{stomatitis_current_grade:2,stomatitis_duration_weeks:2},'withhold',r=>assert(r.findings.every(f=>f.actionType!=='discontinue')));
check('00446','Recovered grade 3 diarrhoea',{diarrhoea_current_grade:0,diarrhoea_highest_grade:3},'dose_reduce',(r,d)=>{assert.equal(row(d,'Bolus 5-FU').protocolDose,'320 mg/m²');assert.equal(row(d,'Infusional 5-FU').protocolDose,'1900 mg/m²');assert.equal(d.rows.length,2);});
check('00446','Persistent neuropathy',{neuropathy_grade:3,neuropathy_pattern:'persistent'},'dose_reduce',(r,d)=>{assert.equal(row(d,'Oxaliplatin').actionLabel,'Discontinue');assert.equal(row(d,'Oxaliplatin').protocolDose,'Not to be administered');});
for(const code of ['00227','00449']){
 check(code,'Recovered grade 4 ANC nadir',{anc_x10e9_l:1.5,lowest_anc_during_delay_x10e9_l:.49},'dose_reduce',(r,d)=>{assert.equal(row(d,'Irinotecan').protocolDose,'120 mg/m²');assert.equal(row(d,'Bolus 5-FU').protocolDose,'260 mg/m²');assert.equal(row(d,'Infusional 5-FU').protocolDose,'1500 mg/m²');assert.equal(d.rows.length,3);});
 check(code,'Recovered grade 3 diarrhoea',{diarrhoea_current_grade:0,diarrhoea_highest_grade:3,toxicity_delay_weeks:0},'dose_reduce',(r,d)=>{assert.equal(row(d,'Irinotecan').protocolDose,'150 mg/m²');assert.equal(row(d,'Bolus 5-FU').protocolDose,'320 mg/m²');assert.equal(row(d,'Infusional 5-FU').protocolDose,'1900 mg/m²');});
 check(code,'Competing reductions take lowest, not first or sum',{diarrhoea_highest_grade:3,anc_x10e9_l:1.5,lowest_anc_during_delay_x10e9_l:.49},'dose_reduce',(r,d)=>assert.equal(row(d,'Infusional 5-FU').protocolDose,'1500 mg/m²'));
 check(code,'Bilirubin over three ULN',{bilirubin_ratio_uln:3.05},'contraindicated');
 check(code,'Complete DPD deficiency',{dpd_status:'complete'},'contraindicated');
}
check('00227','ANC 1.49 alone',{anc_x10e9_l:1.49},'withhold');
check('00227','AST 181',{ast_u_l:181},'contraindicated');
check('00227','Active grade 2 diarrhoea',{diarrhoea_current_grade:2,diarrhoea_highest_grade:3,toxicity_delay_weeks:0},'withhold',(r,d)=>assert(d.rows.every(x=>x.protocolDose==='No dose now')));
check('00227','Retain source-specific CrCl below 10 dose',{crcl_ml_min:'renal_0_9',haemodialysis:false},'dose_reduce',r=>assert(r.findings.some(f=>/50–66/.test(f.explanation))));
check('00449','Dialysis does not borrow 00227 dose',{renal_impairment_severity:'dialysis'},'consultant_review',(r,d)=>{assert(d.rows.some(x=>x.component==='Irinotecan'));assert(!JSON.stringify(r).includes('50–66'));});
// Exercise generic 5-FU aliases against both routes, plus a neighbouring FOLFOX
// regimen using the shared dose renderer (without altering its clinical rules).
const p209=require('../protocols/gastrointestinal/00209-modified-folfox6.json');
const generic={findings:[{actionType:'withhold',action:{type:'withhold',components:['fluorouracil']}}]};
assert.deepEqual(D.buildModificationModel(p209,generic).rows.map(x=>x.component).sort(),['Bolus 5-FU','Infusional 5-FU']);
const routeSpecific={findings:[{actionType:'withhold',action:{type:'withhold',components:['fluorouracil_infusion']}}]};
assert.deepEqual(D.buildModificationModel(p209,routeSpecific).rows.map(x=>x.component),['Infusional 5-FU']);
const genericReduction={findings:[{actionType:'dose_reduce',action:{type:'dose_reduce',components:['fluorouracil'],component_changes:{fluorouracil:{dose_percent_of_original:50},bolus_5fu:{omit:true}}}}]};
const genericDoses=D.buildModificationModel(p209,genericReduction);
assert.equal(row(genericDoses,'Bolus 5-FU').actionLabel,'Omit component');
assert.equal(row(genericDoses,'Infusional 5-FU').protocolDose,'1200 mg/m²');
const scenario=require('../js/scenario-interpreter');
scenario.prepare(protocols['00446'],E.getInputDefinitions(protocols['00446']),{});
for(const [value,band] of [[29.9,'renal_0_29'],[30,'renal_exact_30'],[30.1,'renal_gt30'],[80,'renal_gt30']]){
 const extracted=scenario.parse(`CrCl ${value} mL/min`).extractions.find(x=>x.fieldId==='crcl_ml_min');
 assert.equal(extracted?.value,band,`Scenario CrCl ${value} must respect exclusive source boundaries`);
}
if(process.env.SACT_WRITE_VALIDATION){fs.mkdirSync(path.join(root,'validation/clinical-fixes-v0833'),{recursive:true});fs.writeFileSync(path.join(root,'validation/clinical-fixes-v0833/engine-cases.json'),JSON.stringify({release:'0.83.3',checked_date:'2026-10-16',case_count:results.length,cases:results},null,2)+'\n');}
console.log(`v0.83.3: ${results.length} source-based clinical cases plus route identity, antiemetic and output checks passed.`);
