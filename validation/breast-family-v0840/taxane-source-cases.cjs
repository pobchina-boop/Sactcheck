'use strict';
/* Independent NCCP source audit. This file lives outside the application tree.
 * Run: node /workspace/scratch/aa44ad62d693/v0840-audits/taxane-source-cases.cjs
 * Override SACT_REPO for integration into another checked-out source tree.
 * Expected facts come from taxane-cases.json/current PDFs, not implementation rules.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const repo=process.env.SACT_REPO||path.resolve(__dirname,'../..');
const E=require(path.join(repo,'js/assessment-engine'));
const D=require(path.join(repo,'js/protocol-dose-schedule'));
const files=fs.readdirSync(path.join(repo,'protocols/breast'));
const codes=['00202','00203','00250','00512','00621'];
const protocols=Object.fromEntries(codes.map(c=>[c,JSON.parse(fs.readFileSync(path.join(repo,'protocols/breast',files.find(f=>f.startsWith(c+'-'))),'utf8'))]));
const original=JSON.parse(fs.readFileSync(path.join(__dirname,'taxane-cases.json'),'utf8')).cases;
const results=[];let failed=0;
const holdActions=new Set(['delay','withhold','delay_then_dose_reduce','withhold_then_reduce','omit','contraindicated','discontinue','permanently_discontinue']);
const reviewActions=new Set(['consultant_review',...holdActions,'dose_reduce','dose_reduce_one_level','dose_reduce_two_levels']);
const stopActions=new Set(['discontinue','permanently_discontinue','cease']);
function clinical(r){return r.findings.filter(f=>!f.domainAssessment&&!/^PARTIAL_/.test(f.ruleId||''));}
function text(r){return clinical(r).map(f=>f.explanation||f.action?.recommendation||'').join(' ');}
function assess(c,i){const r=E.assess(protocols[c],i);assert.deepEqual(r.errors,[],'Input errors');assert.deepEqual(r.invalid,[],'Invalid inputs');return {r,m:D.buildModificationModel(protocols[c],r)};}
function run(name,code,input,check,source_note){let record={name,code,input,source_note};try{const {r,m}=assess(code,input);record.actual=r.actionType;record.findings=clinical(r).map(f=>({id:f.ruleId,action:f.actionType,components:f.action?.components,explanation:f.explanation}));check(r,m);record.pass=true;}catch(e){record.pass=false;record.error=e.message;failed++;}results.push(record);}
function hasAction(r,set){return clinical(r).some(f=>set.has(f.actionType));}
function scope(r,expected,{baselineCombination=false}={}){let allowed=new Set(expected);if(baselineCombination)allowed.add('trastuzumab');for(const f of clinical(r)){if(!reviewActions.has(f.actionType)&&!stopActions.has(f.actionType))continue;for(const c of f.action?.components||[])assert(allowed.has(c),`Unexpected affected component ${c} in ${f.ruleId}`);}}
function noQuantifiedIncrease(m,current){for(const row of m.rows||[]){if(!row.quantified)continue;const n=String(row.protocolDose||'').match(/^\s*(\d+(?:\.\d+)?)\s*mg\s*\/\s*m/);assert(!n||Number(n[1])<=current,`Quantified dose increase ${row.protocolDose} above current ${current}`);}}
function noRestart(m){assert(!(m.rows||[]).some(x=>x.quantified&&/^\s*\d/.test(String(x.protocolDose))),'Held / excluded result offers an explicit numeric restart dose');}
const negative=['no_anc_delay','no_count_delay','no_renal_reduction','monitoring_only'];
for(const [index,f]of original.entries()){
 run(`source fixture ${index+1}: ${f.expected_action}`,f.code,f.input,(r,m)=>{
  const findings=clinical(r),body=text(r);scope(r,f.expected_components,{baselineCombination:f.code==='00512'&&f.input.assessment_stage==='baseline'});
  if(negative.includes(f.expected_action)){
   const forbidden=new Set(f.forbidden_actions||[]);
   for(const z of findings)assert(!forbidden.has(z.actionType),`Unexpected ${z.actionType} in ${z.ruleId}`);
   assert(!hasAction(r,stopActions),'No source cessation criterion supplied');return;
  }
  assert(findings.length>0,'Entered actionable value produced no source-specific finding');
  assert(!['proceed','proceed_with_caution','incomplete','partial_context_required'].includes(r.actionType),'Actionable source condition was effectively unassessed or cleared');
  if(f.expected_action==='delay')assert(hasAction(r,holdActions),'Low counts require a hold/delay, not only generic review');
  else if(['contraindicated','not_recommended'].includes(f.expected_action)){
   assert(hasAction(r,holdActions)||hasAction(r,new Set(['consultant_review'])),'Exclusion requires withholding/review');
   if(!hasAction(r,holdActions))assert(/not recommended|contraindicat|do not administer|no treatment/i.test(body),'Review must explicitly state the exclusion');
  }else if(f.expected_action==='discontinue'){
   // A current reduced dose does not by itself prove the event recurred there.
   const recurrenceContextIncomplete=f.code==='00203'&&f.input.current_docetaxel_mg_m2===60&&!('toxicity_persists_at_reduced_dose'in f.input);
   assert(hasAction(r,stopActions)||(recurrenceContextIncomplete&&hasAction(r,reviewActions)&&/discontinue|lower dose/i.test(body)),'Source stop instruction missing');
  }else if(f.expected_action==='withhold')assert(hasAction(r,holdActions),'Definite source hold criterion must trigger a hold');
  else if(f.expected_action==='consultant_review')assert(hasAction(r,reviewActions),'Uncertain source pattern needs actionable review');
  else if(['dose_reduce','delay_then_dose_reduce','withhold_then_reduce'].includes(f.expected_action))assert(hasAction(r,reviewActions),'Dose-modification pathway missing');
  else assert.fail('Unhandled source expectation '+f.expected_action);
  const missingTransaminaseReview=f.code==='00621'&&f.expected_dose_percent!=null&&!('ast_uln_multiple'in f.input)&&/required transaminase context|missing.*transaminase/i.test(body)&&hasAction(r,new Set(['consultant_review']));
  if(f.expected_dose_percent!=null&&!missingTransaminaseReview)assert(new RegExp(`\\b${f.expected_dose_percent}\\s*%`).test(body+JSON.stringify(findings.map(z=>z.action))),'Source percentage not explained');
  if(f.expected_dose_basis)assert(new RegExp(f.expected_dose_basis,'i').test(body),'Original-versus-previous dose basis missing');
  if(f.expected_dose_change_mg_m2===-10)assert(/10\s*mg\s*\/\s*m/i.test(body),'10 mg/m² toxicity decrement not explained');
  if(f.expected_dose_mg_m2!=null)assert(new RegExp(`\\b${f.expected_dose_mg_m2}\\s*mg\\s*\\/\\s*m`).test(body+JSON.stringify(m.rows)),'Source dose target not retained in output');
  if(f.input.febrile_neutropenia===true)assert(hasAction(r,holdActions)||/urgent|acute|delay|withhold|recovery/i.test(body),'Acute FN must not appear as an immediate reduced-dose permission');
  if(f.input.current_docetaxel_mg_m2!=null)noQuantifiedIncrease(m,f.input.current_docetaxel_mg_m2);
 },f.source_note);
}
for(const c of codes)run('Blank input remains incomplete',c,{},(r,m)=>{assert.equal(r.actionType,'incomplete');assert.equal(m.hasQuantified,false);},'Missing values are not normal and do not constitute assessment.');
run('TC baseline ANC1.2 is not an invented1.5 exclusion','00250',{assessment_stage:'baseline',anc_x10e9_l:1.2},r=>{assert(!hasAction(r,new Set(['contraindicated','delay','withhold'])));},'NCCP00250v9 has no separate baseline ANC1.5 exclusion.');
for(const c of ['00202','00203','00512','00621'])run('Severe hepatic impairment acts without numeric liver values',c,{severe_hepatic_impairment:true},(r,m)=>{assert(hasAction(r,holdActions));scope(r,[c.startsWith('002')?'docetaxel':'paclitaxel']);noRestart(m);},'Explicit source hepatic exclusion; standalone clinical input is sufficient.');
for(const c of ['00512','00621'])for(const field of ['stomatitis_grade','skin_grade'])for(const grade of [2,3])run(`Named ${field} grade${grade} acts independently`,c,{[field]:grade},(r,m)=>{assert(hasAction(r,grade===3?stopActions:holdActions));scope(r,['paclitaxel']);if(grade===3)noRestart(m);},'Paclitaxel Table4 non-haematological toxicity must include exposed named inputs.');
run('Paclitaxel hepatic band cannot numerically increase an already reduced dose','00512',{alt_uln_multiple:9,bilirubin_uln_multiple:2,current_paclitaxel_mg_m2:50},(r,m)=>{assert(hasAction(r,reviewActions));noQuantifiedIncrease(m,50);assert(/75\s*%|original/i.test(text(r)));scope(r,['paclitaxel']);},'Source75%original-dose basis; existing50mg/m² requires reconciliation.');
run('Paclitaxel second hepatic band cannot increase an already lower dose','00621',{alt_uln_multiple:9,ast_uln_multiple:1,bilirubin_uln_multiple:3,current_paclitaxel_mg_m2:30},(r,m)=>{assert(hasAction(r,reviewActions));noQuantifiedIncrease(m,30);assert(/50\s*%|original/i.test(text(r)));},'Source50%original-dose basis; no upward dose tile.');
run('Docetaxel stomatitis target cannot increase current dose','00202',{stomatitis_grade:3,current_docetaxel_mg_m2:50},(r,m)=>{assert(hasAction(r,reviewActions));noQuantifiedIncrease(m,50);},'Source60mg/m² reference does not authorise re-escalating an existing lower dose.');
run('Docetaxel100 source does not inherit docetaxel75 cessation rule','00202',{neuropathy_grade:3,current_docetaxel_mg_m2:60,toxicity_persists_at_reduced_dose:true},r=>{assert(!hasAction(r,stopActions));assert(hasAction(r,new Set(['consultant_review','withhold'])));},'00202Table3 stops its ladder at60 without a persistent-at60 cessation instruction.');
for(const c of ['00203','00250'])run('Persistent grade3 docetaxel skin toxicity at60 stops affected drug',c,{skin_grade:3,current_docetaxel_mg_m2:60,toxicity_persists_at_reduced_dose:true},r=>{assert(hasAction(r,stopActions));scope(r,['docetaxel']);},'00203Table3/00250Table4 expressly discontinue if these reactions persist at60.');
for(const c of ['00203','00250'])run('Persistent neuropathy at60 stops affected docetaxel',c,{neuropathy_grade:3,current_docetaxel_mg_m2:60,toxicity_persists_at_reduced_dose:true,assessment_stage:'ongoing'},r=>{assert(hasAction(r,stopActions));scope(r,['docetaxel']);},'Source cessation with the required recurrence context supplied.');
for(const input of [{treatment_phase:'continuation',assessment_stage:'baseline',anc_x10e9_l:0.9},{treatment_phase:'continuation',stomatitis_grade:3},{treatment_phase:'continuation',severe_hepatic_impairment:true}])run('Antibody continuation does not inherit completed paclitaxel rules','00512',input,r=>{const f=clinical(r);assert(!f.some(z=>z.action?.components?.includes('paclitaxel')),'Completed paclitaxel phase still targeted');assert(!f.some(z=>z.action?.components?.includes('trastuzumab')&&holdActions.has(z.actionType)),'Taxane concern automatically withheld antibody');},'The source permits continued trastuzumab during reversible chemotherapy myelosuppression; other toxicity needs separate context.');
for(const [c,field]of [['00250','pregnancy'],['00250','breastfeeding'],['00621','breastfeeding']])run('Explicit reproductive exclusion is encoded',c,{[field]:true},(r,m)=>{assert(hasAction(r,new Set(['contraindicated','withhold'])));noRestart(m);},'These exact NCCP sources list the supplied condition as an exclusion.');
for(const c of ['00203','00621'])run('Historic prolonged neutropenia is recognised after ANC recovery',c,{anc_x10e9_l:2,anc_below_0_5_days:8},r=>{assert(hasAction(r,reviewActions),'Past qualifying event loses its restart-dose consequence after count recovery');assert(!['proceed','proceed_with_caution'].includes(r.actionType));},'The source reduction applies after recovery, not only while the present ANC remains<0.5.');
run('Both LVEFs supplied cannot silently clear the11-point fall','00512',{lvef_percent:49,baseline_lvef_percent:60},r=>{assert(hasAction(r,new Set(['withhold','consultant_review'])));assert(!['proceed','proceed_with_caution'].includes(r.actionType));},'Source conjugate criterion is knowable from both LVEFs; review is safe if arithmetic awaits explicit comparison.');
for(const [bilirubin,pct]of [[2,75],[3,50]])run('Complete transaminase context retains original-dose hepatic percentage','00621',{alt_uln_multiple:9,ast_uln_multiple:1,bilirubin_uln_multiple:bilirubin},r=>{assert(hasAction(r,reviewActions));assert(new RegExp('\\b'+pct+'\\s*%').test(text(r)));assert(/original/i.test(text(r)));scope(r,['paclitaxel']);},'00621Table3 percentage is conditional on the completed transaminase domain; a missing other transaminase is separately reviewed.');
// Static source identity and scheduling assertions are independent of rule implementation.
function structural(name,check){try{check();results.push({name,pass:true});}catch(e){failed++;results.push({name,pass:false,error:e.message});}}
structural('Current NCCP source versions agree; existing stable identities remain code-correct',()=>{for(const[c,v]of Object.entries({'00202':'8','00203':'7','00250':'9','00512':'5','00621':'3'})){const p=protocols[c];assert.equal(p.metadata.nccp_version,v);assert(p.protocol_id.startsWith(`nccp-${c}-`));if(p.metadata.canonical_protocol_id)assert(p.metadata.canonical_protocol_id.startsWith(`nccp-${c}-`));}});
structural('00203 exact indication suffixes and disease mapping',()=>{const a=protocols['00203'].indications;assert.deepEqual(a.map(x=>x.code).sort(),Array.from('abcdefgh',s=>'00203'+s));assert(/breast/i.test(a.find(x=>x.code==='00203h').description));assert(/lung|NSCLC/i.test(a.find(x=>x.code==='00203a').description));assert(/fallopian/i.test(a.find(x=>x.code==='00203g').description));});
structural('00621 exact indication suffixes, without copied00226 entries',()=>{const a=protocols['00621'].indications;assert.deepEqual(a.map(x=>x.code).sort(),Array.from('abcde',s=>'00621'+s));assert(!JSON.stringify(a).includes('00226'));assert(/gastric/i.test(a.find(x=>x.code==='00621a').description));assert(/ovarian/i.test(a.find(x=>x.code==='00621c').description));assert(/bladder/i.test(a.find(x=>x.code==='00621e').description));});
structural('00621 days1,8,15 and week4 break',()=>{const ph=protocols['00621'].treatment_phases.find(x=>x.administration.some(m=>m.drug==='paclitaxel'));assert.equal(ph.cycle_length_days,28);assert.deepEqual(ph.administration.find(m=>m.drug==='paclitaxel').day,[1,8,15]);assert(!protocols['00621'].treatment?.days?.includes(22));});
structural('00512 has combination and antibody-only completion',()=>{const a=protocols['00512'].treatment_phases;assert(a.some(x=>x.cycle_length_days===7&&x.administration.some(m=>m.drug==='paclitaxel')));const h=a.find(x=>x.phase_id==='continuation');assert(h);assert(h.administration.every(m=>m.drug==='trastuzumab'));assert(/one year total/i.test(JSON.stringify(h)+protocols['00512'].metadata.schedule_summary));});
const output={checked_at:new Date().toISOString(),repo,total:results.length,passed:results.length-failed,failed,cases:results};
fs.writeFileSync(path.join(__dirname,'taxane-source-cases-results.json'),JSON.stringify(output,null,2)+'\n');
console.log(`Taxane source audit: ${results.length-failed}/${results.length} passed.`);
for(const x of results.filter(x=>!x.pass))console.error(`${x.code||'STRUCTURE'} ${x.name}: ${x.error}`);
process.exitCode=failed?1:0;
