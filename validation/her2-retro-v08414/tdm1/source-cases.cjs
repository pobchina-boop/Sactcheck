'use strict';
// Expectations transcribed from the official source, independently of proposed rule expressions.
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../../..');
const E=require(path.join(root,'js/assessment-engine'));
const D=require(path.join(root,'js/protocol-dose-schedule'));
const proposal=process.argv.includes('--proposal');
const protocols={};
for(const [code,file] of [['00206','00206-t-dm1-metastatic.json'],['00659','00659-t-dm1-early-breast.json']]) protocols[code]=JSON.parse(fs.readFileSync(path.join(root,'protocols/breast',file)));
if(proposal){
 const p=JSON.parse(fs.readFileSync(path.join(__dirname,'proposed-corrections.json')));
 for(const code of Object.keys(protocols)){
  const d=protocols[code],x=p[code];Object.assign(d.input_definitions,x.input_definitions);
  for(const r of x.replace_rules){const i=d.rule_engine.rules.findIndex(z=>z.rule_id===r.rule_id);if(i<0)throw Error('Missing replacement '+r.rule_id);d.rule_engine.rules[i]=r;}
  d.rule_engine.rules.push(...x.add_rules);
 }
}
const cases=[];
function add(code,name,inputs,expected,rule){cases.push({code,name,inputs,expected:expected==='proceed'?'no_fixed_hold':expected,required_rule:rule});}
for(const c of ['00206','00659']){
 add(c,'Blank remains unassessed',{},'incomplete');
 add(c,'Starting LVEF 49',{assessment_stage:'baseline',lvef_percent:49},c==='00206'?'withhold':'contraindicated');
 add(c,'Starting LVEF 50',{assessment_stage:'baseline',lvef_percent:50},'proceed');
 add(c,'Unspecified-stage low LVEF needs context',{lvef_percent:49,lvef_drop_points:5},'consultant_review','STAGE_CONTEXT_LVEF');
 add(c,'Starting platelet evidence boundary 100',{assessment_stage:'baseline',platelets:100},'consultant_review','BASELINE_ORGAN_EVIDENCE');
 add(c,'Starting platelets above study boundary',{assessment_stage:'baseline',platelets:100.01},'proceed');
 add(c,'Ongoing platelet100 is not a starting restriction',{assessment_stage:'ongoing',platelets:100},'proceed');
 add(c,'Starting AST study boundary 2.5',{assessment_stage:'baseline',ast_uln_multiple:2.5},'proceed');
 add(c,'Starting AST outside studied range',{assessment_stage:'baseline',ast_uln_multiple:2.51},'consultant_review');
 add(c,'Severe unresolved infusion reaction',{severe_infusion_reaction:true},'withhold','IRR_SEVERE');
 add(c,'Life-threatening infusion reaction',{life_threatening_infusion_reaction:true},'permanently_discontinue');
 add(c,'True hypersensitivity during treatment',{confirmed_true_hypersensitivity:true},'permanently_discontinue');
 add(c,'Prior permanent trastuzumab reaction stop',{prior_permanent_trastuzumab_discontinuation_for_reaction:true},'withhold');
 add(c,'No reaction stated is not a positive reaction',{severe_infusion_reaction:false,life_threatening_infusion_reaction:false},'proceed');
 add(c,'Significant cardiac disease',{significant_cardiac_disease:true},'contraindicated');
 add(c,'Unconfirmed full indication',{indication_eligible:false},'consultant_review');
 add(c,'Required echo unavailable',{cardiac_monitoring_overdue:true},'consultant_review');
 add(c,'Confirmed ILD',{pulmonary_toxicity:true},'permanently_discontinue');
 add(c,'Confirmed NRH',{nodular_regenerative_hyperplasia:true},'permanently_discontinue');
 add(c,'DILI with no alternative cause',{ast_uln_multiple:3.01,bilirubin_uln_multiple:2.01,dili_no_alternative_cause:true},'permanently_discontinue','DILI_CONFIRMED');
 add(c,'DILI attribution cannot be presumed',{ast_uln_multiple:3.01,bilirubin_uln_multiple:2.01},c==='00206'?'withhold':'discontinue','DILI_CAUSE_UNRESOLVED');
 add(c,'Alternative cause does not cancel independent bilirubin action',{alt_uln_multiple:3.01,bilirubin_uln_multiple:2.01,dili_no_alternative_cause:false},c==='00206'?'withhold':'discontinue');
 add(c,'DILI strict transaminase boundary',{ast_uln_multiple:3,bilirubin_uln_multiple:2.01,dili_no_alternative_cause:true},c==='00206'?'withhold':'discontinue');
 add(c,'Dose floor',{dose_reduction_level:2,further_reduction_required:true},'discontinue');
 add(c,'Ongoing neuropathy grade3',{assessment_stage:'ongoing',peripheral_neuropathy_grade:3},'withhold');
 add(c,'Ongoing neuropathy grade2',{assessment_stage:'ongoing',peripheral_neuropathy_grade:2},'proceed');
}
for(const [v,expected] of [[24.99,'withhold'],[25,'withhold'],[49.99,'withhold'],[50,'proceed'],[74.99,'proceed'],[75,'proceed']])add('00206','Metastatic platelets '+v,{assessment_stage:'ongoing',platelets:v,prior_platelet_hold:false},expected);
for(const [v,expected] of [[24.99,'withhold'],[25,'withhold'],[74.99,'withhold'],[75,'proceed']])add('00659','Adjuvant platelets '+v,{assessment_stage:'ongoing',platelets:v},expected);
add('00206','Platelets60 with unknown prior hold',{platelets:60},'consultant_review','PLT_PRIOR_HOLD_CONTEXT');
add('00206','Held platelets60 not yet recovered',{platelets:60,prior_platelet_hold:true},'withhold');
add('00206','Held platelets75 recovered',{platelets:75,prior_platelet_hold:true},'proceed');
for(const [v,drop,expected] of [[39.99,5,'withhold'],[40,5,'proceed_with_caution'],[45,5,'proceed_with_caution'],[45,10,'withhold'],[45.01,10,'proceed'],[49,10,'proceed']])add('00206','Metastatic ongoing cardiac '+v+'/'+drop,{assessment_stage:'ongoing',lvef_percent:v,lvef_drop_points:drop},expected);
add('00206','Ongoing cardiac branch unaffected by historic baseline alone',{assessment_stage:'ongoing',baseline_lvef_percent:49,lvef_percent:49},'proceed');
add('00206','Explicit baseline input49',{baseline_lvef_percent:49},'withhold');
add('00206','Ongoing 45 without decline data',{assessment_stage:'ongoing',lvef_percent:45},'consultant_review');
for(const [v,drop,expected] of [[44.99,5,'withhold'],[45,5,'proceed_with_caution'],[49.99,5,'proceed_with_caution'],[45,10,'withhold'],[50,10,'proceed']])add('00659','Adjuvant ongoing cardiac '+v+'/'+drop,{assessment_stage:'ongoing',lvef_percent:v,lvef_drop_points:drop},expected);
add('00659','Ongoing49 without decline data',{assessment_stage:'ongoing',lvef_percent:49},'consultant_review');
add('00659','Baseline grade2 neuropathy excluded',{assessment_stage:'baseline',peripheral_neuropathy_grade:2},'contraindicated');
add('00659','Grade2 neuropathy with stage missing',{peripheral_neuropathy_grade:2},'consultant_review');
add('00659','Gross residual or recurrent disease',{gross_residual_or_recurrent_disease:true},'contraindicated');
add('00659','Grade2 HF with LVEF missing',{heart_failure_grade:2},'consultant_review');
add('00659','Grade2 HF with LVEF44',{heart_failure_grade:2,lvef_percent:44,assessment_stage:'ongoing'},'discontinue');
add('00659','Grade3 RT pneumonitis',{rt_pneumonitis_grade:3},'discontinue');
add('00659','Grade2 RT pneumonitis refractory',{rt_pneumonitis_grade:2,rt_pneumonitis_not_resolving:true},'discontinue');
add('00659','Grade2 RT pneumonitis responds',{rt_pneumonitis_grade:2,rt_pneumonitis_not_resolving:false},'consultant_review');
for(const c of ['00206','00659'])for(const f of ['ast_uln_multiple','alt_uln_multiple'])for(const [v,expected] of [[3,'proceed'],[3.01,c==='00206'?'proceed':'withhold'],[5,c==='00206'?'proceed':'withhold'],[5.01,'withhold'],[20,'withhold'],[20.01,'discontinue']])add(c,'Ongoing '+f+'/'+v,{assessment_stage:'ongoing',[f]:v},expected);
for(const [c,v,expected] of [['00206',1.5,'proceed'],['00206',1.51,'withhold'],['00206',10,'withhold'],['00206',10.01,'withhold'],['00206',20,'withhold'],['00206',20.01,'discontinue'],['00659',1,'proceed'],['00659',1.01,'withhold'],['00659',2,'withhold'],['00659',2.01,'discontinue']])add(c,'Bilirubin source band '+v,{assessment_stage:'ongoing',bilirubin_uln_multiple:v},expected);
const results=cases.map(c=>{
 const r=E.assess(protocols[c.code],c.inputs),rules=r.findings.map(x=>x.ruleId).filter(Boolean);let fail=[];
 if(r.errors.length)fail.push('errors: '+JSON.stringify(r.errors));if(r.invalid.length)fail.push('invalid: '+JSON.stringify(r.invalid));
 if(c.expected==='no_fixed_hold'){if(!['proceed','proceed_with_caution','partial_context_required'].includes(r.actionType))fail.push('unexpected restricting action');}else if(r.actionType!==c.expected)fail.push('action mismatch');if(c.required_rule&&!rules.includes(c.required_rule))fail.push('missing expected finding');
 if(['withhold','contraindicated','discontinue','permanently_discontinue'].includes(r.actionType)){
  const model=D.buildModificationModel(protocols[c.code],r);if(model.rows.some(x=>/^\d+(?:[.,]\d+)?\s*mg/.test(x.protocolDose)))fail.push('unsafe numerical restart dose');
 }
 return {...c,actual:r.actionType,findings:rules,pass:fail.length===0,fail};
});
const summary={mode:proposal?'in-memory proposal; application files unchanged':'application',total:results.length,passed:results.filter(x=>x.pass).length,failed:results.filter(x=>!x.pass).length,clinical_validation:false};
const output={executed_at:new Date().toISOString(),summary,results};
fs.writeFileSync(path.join(__dirname,proposal?'proposal-acceptance-results.json':'acceptance-results.json'),JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify(summary));for(const r of results.filter(x=>!x.pass))console.log(r.code,r.name,'expected',r.expected,'actual',r.actual,r.fail.join('; '));
if(summary.failed)process.exitCode=1;
