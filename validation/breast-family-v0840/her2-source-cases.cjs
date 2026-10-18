'use strict';
// Independent source-derived acceptance harness. Writes only the adjacent audit report.
// Run: node /workspace/scratch/aa44ad62d693/v0840-audits/her2-source-cases.cjs
const fs = require('fs'), path = require('path'), assert = require('node:assert/strict');
const root = process.env.SACT_REVIEW_ROOT || path.resolve(__dirname,'../..');
const E = require(path.join(root, 'js/assessment-engine'));
const D = require(path.join(root, 'js/protocol-dose-schedule'));
const codes = ['00258', '00731', '00204', '00507'];
const protocols = Object.fromEntries(codes.map(code => {
  const file = fs.readdirSync(path.join(root,'protocols/breast')).find(f => f.startsWith(code+'-'));
  return [code, JSON.parse(fs.readFileSync(path.join(root,'protocols/breast',file),'utf8'))];
}));
const output = [];
const named = result => result.findings.filter(f => !f.domainAssessment && !/^PARTIAL_/.test(f.ruleId || ''));
const words = result => named(result).map(f => f.explanation || f.recommendation || '').join(' ');
const has = (result, expression) => named(result).some(f => expression.test(f.ruleId || ''));
const numericRows = model => model.rows.filter(row => /^\d+(?:[.,]\d+)?\s*mg/.test(row.protocolDose || ''));
const noNumeric = model => assert.equal(numericRows(model).length,0,'No unresolved/held assessment may offer a numeric restart dose');
const noRule = (result, pattern) => assert(!has(result, pattern),'Unexpected source rule '+pattern);
const hasRule = (result, pattern) => assert(has(result, pattern),'Missing source rule '+pattern+'; got '+named(result).map(f=>f.ruleId).join(', '));
const requiresReview = (result, model) => { assert(['consultant_review','partial_context_required','withhold','delay','contraindicated'].includes(result.actionType),'Expected review/hold, got '+result.actionType); noNumeric(model); };
function test(code, name, inputs, expectedAction, check=()=>{}) {
  const item = {code,name,inputs,expectedAction:expectedAction || 'finding/dose assertions'};
  try {
    const result = E.assess(protocols[code],inputs), model = D.buildModificationModel(protocols[code],result);
    assert.deepEqual(result.errors,[],'Rule-engine errors');
    assert.deepEqual(result.invalid,[],'Unexpected invalid input');
    item.actualAction=result.actionType;
    item.findings=named(result).map(f=>({id:f.ruleId,action:f.actionType,explanation:f.explanation}));
    item.doseRows=model.rows.map(r=>({component:r.componentId,action:r.actionType,dose:r.protocolDose,rule:r.ruleId}));
    if(expectedAction) assert.equal(result.actionType,expectedAction);
    check(result,model,protocols[code]);
    item.pass=true;
  } catch(err) {item.pass=false;item.error=err.message;}
  output.push(item);
}
function structure(code,name,check) {
  const item={code,name,inputs:null,expectedAction:'source structure'};
  try {check(protocols[code]);item.pass=true;}catch(err){item.pass=false;item.error=err.message;}
  output.push(item);
}

for (const code of codes) {
  test(code,'Blank remains unassessed',{},'incomplete',(r,m)=>noNumeric(m));
  test(code,'Relevant drug allergy',{hypersensitivity:true},'contraindicated',(r,m)=>noNumeric(m));
  test(code,'Explicit pregnancy exclusion',{pregnancy:true},'contraindicated',(r,m)=>noNumeric(m));
  test(code,'Explicit breastfeeding exclusion',{breastfeeding:true},'contraindicated',(r,m)=>noNumeric(m));
  test(code,'Required cardiac assessment unavailable',{cardiac_monitoring_overdue:true},'consultant_review',(r,m)=>noNumeric(m));
  test(code,'HER2 not confirmed',{her2_positive:false},'consultant_review',(r,m)=>noNumeric(m));
  test(code,'Grade4 HER2 hypersensitivity',{trastuzumab_hypersensitivity_grade:4},'discontinue',(r,m)=>noNumeric(m));
  test(code,'Severe hepatic impairment is not an inert field',{severe_hepatic_impairment:true},'contraindicated',(r,m)=>{noNumeric(m);assert(m.rows.every(x=>!['trastuzumab','pertuzumab'].includes(x.componentId)),'Chemotherapy hepatic exclusion must not automatically stop antibodies');});
  test(code,'Symptomatic heart failure source distinction',{symptomatic_heart_failure:true},code==='00258'?'withhold':'discontinue',(r,m)=>{noNumeric(m);assert(m.rows.some(x=>x.componentId==='trastuzumab'));});
  structure(code,'Independent validation remains pending',p=>{assert.equal(p.metadata.validation.clinical_use_authorised,false);assert.equal(p.metadata.validation.consultant_reviewed,false);assert.equal(p.metadata.validation.oncology_pharmacy_reviewed,false);});
  structure(code,'Every decision input remains optional',p=>{assert.deepEqual(p.required_inputs,[]);for(const [id,def] of Object.entries(p.input_definitions)){assert.notEqual(def.required,true,id);assert(!def.required_when,id+' has conditional mandatory entry');}});
  structure(code,'Every emitted rule action has an explicit conflict ranking',p=>{const ranks=p.rule_engine.actions_ranked_most_to_least_restrictive;for(const rule of p.rule_engine.rules)assert(ranks.includes(rule.action.type),'Unranked action '+rule.action.type+' in '+rule.rule_id);});
}

for (const code of ['00258','00731']) {
  const ongoing={assessment_stage:'ongoing',treatment_phase:'combination'};
  test(code,'Counts exact1.5/100 do not trigger a low-count hold',{...ongoing,anc_x10e9_l:1.5,platelets_x10e9_l:100},null,(r,m)=>{noRule(r,/TCH_COUNTS_LOW|TCH_INTERMEDIATE|TCH_ANC_GAP/);assert(!['delay','withhold','contraindicated'].includes(r.actionType));});
  test(code,'Single ANC0.99 delays chemotherapy',{anc_x10e9_l:0.99},'delay',(r,m)=>{hasRule(r,/TCH_COUNTS_LOW/);noNumeric(m);assert(m.rows.every(x=>['docetaxel','carboplatin'].includes(x.componentId)));});
  test(code,'Single platelets99 delays chemotherapy',{platelets_x10e9_l:99},'delay',(r,m)=>noNumeric(m));
  test(code,'ANC1.2 with missing strategy remains partial/review',{anc_x10e9_l:1.2},null,requiresReview);
  test(code,'Intermediate ANC selected dose-reduction strategy',{...ongoing,anc_x10e9_l:1.2,platelets_x10e9_l:100,count_strategy:'dose_reduction'},null,(r,m)=>{hasRule(r,/TCH_INTERMEDIATE_75/);assert(/75%/.test(words(r)));});
  test(code,'Intermediate ANC selected G-CSF strategy',{...ongoing,anc_x10e9_l:1.2,platelets_x10e9_l:100,count_strategy:'gcsf'},null,(r,m)=>{hasRule(r,/TCH_INTERMEDIATE_GCSF/);assert(/100%/.test(words(r)));});
  test(code,'Printed ANC decimal gap1.495',{...ongoing,anc_x10e9_l:1.495,platelets_x10e9_l:100},'consultant_review',(r,m)=>{hasRule(r,/TCH_ANC_GAP/);noNumeric(m);});
  test(code,'Baseline ANC1.2 is an initiation exclusion',{assessment_stage:'baseline',treatment_phase:'combination',anc_x10e9_l:1.2},'contraindicated',(r,m)=>noNumeric(m));
  for(const [value,action] of [[20,'contraindicated'],[20.01,'consultant_review'],[30,'consultant_review']])test(code,'Carboplatin GFR boundary '+value,{gfr_ml_min:value},action,(r,m)=>noNumeric(m));
  test(code,'Carboplatin GFR30.01 outside extreme-caution band',{gfr_ml_min:30.01},null,(r)=>noRule(r,/CARBO_GFR_STOP|CARBO_GFR_CAUTION/));
  test(code,'Creatinine exactly48h accepted by recency rule',{gfr_method:'estimated',creatinine_result_age_hours:48},null,r=>noRule(r,/CARBO_OLD_CREATININE/));
  test(code,'Creatinine older than48h reviewed',{gfr_method:'estimated',creatinine_result_age_hours:48.01},'consultant_review',(r,m)=>{hasRule(r,/CARBO_OLD_CREATININE/);noNumeric(m);});
  test(code,'Isotope reference rise exactly110%',{gfr_method:'isotope',creatinine_percent_reference:110},null,r=>noRule(r,/CARBO_CREATININE_RISE/));
  test(code,'Isotope reference rise above110%',{gfr_method:'isotope',creatinine_percent_reference:110.01},'consultant_review',(r,m)=>{hasRule(r,/CARBO_CREATININE_RISE/);noNumeric(m);});
  test(code,'Normal bilirubin and AST/ALT2.5 ALP2.5 no reduction',{alt_uln_multiple:2.5,ast_uln_multiple:2.5,alp_uln_multiple:2.5,bilirubin_uln_multiple:1},null,r=>noRule(r,/TCH_DOC_LIVER_60|TCH_LIVER_DELAY|TCH_BILIRUBIN/));
  test(code,'AST2.51 ALP2.5 identifies75-to60 pathway',{alt_uln_multiple:2,ast_uln_multiple:2.51,alp_uln_multiple:2.5,bilirubin_uln_multiple:1},null,(r,m)=>{hasRule(r,/TCH_DOC_LIVER_60/);assert(/75.*60/.test(words(r)));});
  test(code,'AST/ALT1.5 ALP5 no liver reduction',{alt_uln_multiple:1.5,ast_uln_multiple:1.5,alp_uln_multiple:5,bilirubin_uln_multiple:1},null,r=>noRule(r,/TCH_DOC_LIVER_60|TCH_LIVER_DELAY/));
  test(code,'Raised transaminase and ALP both>5 delay',{alt_uln_multiple:5.1,ast_uln_multiple:1,alp_uln_multiple:5.1},'delay',(r,m)=>noNumeric(m));
  test(code,'Only one high liver axis remains unresolved',{alt_uln_multiple:5.1,ast_uln_multiple:1,alp_uln_multiple:1},'consultant_review',(r,m)=>{noRule(r,/TCH_LIVER_DELAY/);noNumeric(m);});
  test(code,'Single moderate ALT returns contextual assessment',{alt_uln_multiple:3},null,requiresReview);
  test(code,'Abnormal bilirubin holds chemotherapy',{bilirubin_uln_multiple:1.01},'delay',(r,m)=>noNumeric(m));
  test(code,'Liver unrecovered at maximum14day delay',{hepatic_delay_days:14,hepatic_not_recovered:true},'discontinue',(r,m)=>noNumeric(m));
  test(code,'High-grade neuropathy without current dose remains useful',{neuropathy_grade:3},null,requiresReview);
  test(code,'Neuropathy persists on60: stop docetaxel',{neuropathy_grade:3,current_docetaxel_mg_m2:60,toxicity_persists_at_reduced_dose:true},'discontinue',(r,m)=>noNumeric(m));
  test(code,'Stomatitis at60 maps to50',{stomatitis_grade:3,current_docetaxel_mg_m2:60},null,(r,m)=>{hasRule(r,/DOC_MOUTH_60/);assert(m.rows.some(x=>x.componentId==='docetaxel'&&/50\s*mg/.test(x.protocolDose)),'Expected50mg/m² source option visible');});
  test(code,'Acute FN interrupts chemotherapy',{febrile_neutropenia:true},'withhold',(r,m)=>noNumeric(m));
  for(const [episode,strategy,percent,basis] of [[1,'dose_reduction',75,/previous/i],[2,'dose_reduction',50,/original/i],[1,'gcsf',100,/G.CSF/i],[2,'gcsf',75,/G.CSF/i],[3,'gcsf',50,/G.CSF/i]]) {
    test(code,`Recovered FN${episode} strategy${strategy}`,{...ongoing,fn_episode_count:episode,anc_x10e9_l:1.5,platelets_x10e9_l:100,count_strategy:strategy,febrile_neutropenia:false},null,(r,m)=>{
      const detail=words(r);assert(new RegExp(percent+'\\s*%').test(detail),'Applicable source percentage must be visible: '+percent+'%');assert(basis.test(detail),'Correct original/previous/G-CSF basis must be visible');
      assert(!['withhold','delay'].includes(r.actionType),'Recovered historical episode should not itself become acute FN hold');
    });
  }
  test(code,'Recovered historical FN with missing strategy is review only',{fn_episode_count:2,anc_x10e9_l:1.5,platelets_x10e9_l:100},null,(r,m)=>{requiresReview(r,m);});
}

test('00258','Baseline LVEF55 is clinical-judgment band',{baseline_lvef_percent:55},'consultant_review',(r,m)=>noNumeric(m));
test('00258','Baseline LVEF55.01 satisfies strict>55 domain',{baseline_lvef_percent:55.01},null,r=>noRule(r,/HER2_BASELINE/));
test('00258','Baseline neuropathy2 is caution, not exclusion',{assessment_stage:'baseline',neuropathy_grade:2},'consultant_review',(r,m)=>noNumeric(m));
test('00731','Baseline LVEF55 meets>=55 domain',{baseline_lvef_percent:55},null,r=>noRule(r,/HER2_BASELINE_LOW/));
test('00731','Baseline LVEF54.99 below threshold',{baseline_lvef_percent:54.99},'withhold',(r,m)=>noNumeric(m));
test('00731','Baseline neuropathy2 is an exclusion',{assessment_stage:'baseline',neuropathy_grade:2},'contraindicated',(r,m)=>noNumeric(m));
test('00731','Uncontrolled hypertension exclusion',{uncontrolled_hypertension:true},'contraindicated',(r,m)=>noNumeric(m));

for(const code of ['00258','00731','00204'])for(const [value,drop,hold] of [[49.99,10,true],[50,10,false],[49.99,9.99,false]]) {
  test(code,`Combined cardiac boundary${value}/${drop}`,{lvef_percent:value,lvef_drop_points:drop},hold?'withhold':null,(r,m)=>{if(hold){hasRule(r,/HER2_LVEF_HOLD/);noNumeric(m);}else noRule(r,/HER2_LVEF_HOLD/);});
}
for(const [value,drop,hold] of [[39.99,0,true],[40,10,true],[45,10,true],[45,9.99,false],[45.01,10,false]]) {
  test('00507',`Metastatic weekly cardiac boundary${value}/${drop}`,{lvef_percent:value,lvef_drop_points:drop},hold?'withhold':null,(r,m)=>{if(hold){hasRule(r,/HER2_LVEF_HOLD/);noNumeric(m);}else noRule(r,/HER2_LVEF_HOLD/);});
}

for(const code of ['00204','00507','00731']) {
  test(code,'Antibody interval41.99days does not reload',{days_since_last_antibody:41.99},'consultant_review',(r,m)=>{noRule(r,/ANTIBODY_RELOAD/);noNumeric(m);});
  test(code,'Antibody interval42days reloads per actual route',{days_since_last_antibody:42},'consultant_review',(r,m)=>{hasRule(r,/ANTIBODY_RELOAD/);assert(/840/.test(words(r)));if(code==='00731'){assert(/600.*SC|SC.*600/.test(words(r)));assert(!/trastuzumab reload 8/.test(words(r)));}else assert(/8\s*mg\/kg/.test(words(r)));noNumeric(m);});
}
test('00731','SC interval20.99days withheld',{days_since_last_sc_trastuzumab:20.99},'withhold',(r,m)=>noNumeric(m));
test('00731','SC interval21days allowed by interval rule',{days_since_last_sc_trastuzumab:21},null,r=>noRule(r,/SC_MIN_INTERVAL/));
test('00731','SC missed dose remains600mg without reload',{days_overdue_trastuzumab:8},'consultant_review',(r,m)=>{assert(/600/.test(words(r)));assert(/No IV reloading/.test(words(r)));noNumeric(m);});
structure('00731','SC identity and neoadjuvant indication',p=>{assert.deepEqual(p.indications.map(i=>i.code||i.indication_id),['00731a']);const a=p.treatment_phases[0].administration;const h=a.find(x=>x.drug==='trastuzumab'),per=a.find(x=>x.drug==='pertuzumab');assert.equal(h.dose.value,600);assert.equal(h.dose.unit,'mg');assert(/SC/.test(h.route));assert(/IV/.test(per.route));});
test('00731','Pertuzumab uncontrolled severe diarrhoea interruption',{severe_persistent_diarrhoea:true},'withhold',(r,m)=>{hasRule(r,/PERTUZUMAB_DIARRHOEA/);assert(m.rows.some(x=>x.componentId==='pertuzumab'));noNumeric(m);});
for(const [phase,schedule,dose] of [['combination','weekly','2 mg/kg'],['combination','sc','600 mg'],['continuation','sc','600 mg'],['combination','q21','6 mg/kg']]) {
  test('00258',`Dose renderer uses actual${phase}/${schedule} variant`,{treatment_phase:phase,trastuzumab_schedule:schedule,symptomatic_heart_failure:true},'withhold',(r,m)=>{const row=m.rows.find(x=>x.componentId==='trastuzumab');assert(row,'Trastuzumab row must be present');assert.equal(row.startingDose,dose);noNumeric(m);});
}

test('00204','Baseline ANC0.99 exclusion',{assessment_stage:'baseline',anc_x10e9_l:0.99},'contraindicated',(r,m)=>noNumeric(m));
test('00204','Baseline ANC1 is not below source exclusion',{assessment_stage:'baseline',anc_x10e9_l:1},null,r=>noRule(r,/BASELINE_ANC/));
test('00204','ECOG2 within source population',{ecog:2},null,r=>noRule(r,/^ECOG$/));
test('00204','Acute FN has safety response despite no dose table',{febrile_neutropenia:true},'withhold',(r,m)=>noNumeric(m));
test('00204','Normal liver values never trigger literal50percent row',{alt_uln_multiple:1,ast_uln_multiple:1,alp_uln_multiple:1,bilirubin_uln_multiple:1},null,(r,m)=>{noRule(r,/DOC_HEP/);assert.equal(numericRows(m).length,0);});
test('00204','Overlapping intermediate hepatic table remains review',{alt_uln_multiple:2,ast_uln_multiple:1,alp_uln_multiple:3,bilirubin_uln_multiple:1},'consultant_review',(r,m)=>{hasRule(r,/DOC_HEP_AMBIGUITY/);noNumeric(m);});
test('00204','ALP exactly6 is unresolved source boundary',{alp_uln_multiple:6},'consultant_review',(r,m)=>{noRule(r,/DOC_HEP_STOP/);noNumeric(m);});
for(const [field,value] of [['alp_uln_multiple',6.01],['alt_uln_multiple',10.01],['ast_uln_multiple',10.01],['bilirubin_uln_multiple',1.51]])test('00204','Independent severe liver threshold '+field,{[field]:value},'contraindicated',(r,m)=>{hasRule(r,/DOC_HEP_STOP/);noNumeric(m);});
test('00204','Neuropathy persists on60: stop docetaxel',{neuropathy_grade:3,current_docetaxel_mg_m2:60,toxicity_persists_at_reduced_dose:true},'discontinue',(r,m)=>noNumeric(m));
test('00204','Stomatitis on60 does not borrow TCH50mg row',{stomatitis_grade:3,current_docetaxel_mg_m2:60},'consultant_review',(r,m)=>noNumeric(m));

test('00507','Baseline ANC1.2 excluded',{assessment_stage:'baseline',anc_x10e9_l:1.2},'contraindicated',(r,m)=>noNumeric(m));
test('00507','Ongoing ANC1/platelets91 no blood hold',{assessment_stage:'ongoing',anc_x10e9_l:1,platelets_x10e9_l:91},null,r=>noRule(r,/PAC_ANC_LOW|PAC_PLT_LOW|PAC_PLT_90|PAC_SEVERE_COUNTS/));
test('00507','Platelets90 overlap reviewed',{platelets_x10e9_l:90},'consultant_review',(r,m)=>noNumeric(m));
test('00507','Platelets89 delay',{platelets_x10e9_l:89},'delay',(r,m)=>noNumeric(m));
test('00507','Platelets69 require post-recovery reduction',{platelets_x10e9_l:69,current_paclitaxel_mg_m2:80},null,(r,m)=>{hasRule(r,/PAC_SEVERE_COUNTS/);assert(/65/.test(words(r)));noNumeric(m);});
test('00507','Single ANC0.4 immediately holds without duration',{anc_x10e9_l:0.4},'delay',(r,m)=>{hasRule(r,/PAC_ANC_LOW/);noNumeric(m);});
test('00507','ANC0.4 for7days requires reduction after recovery',{anc_x10e9_l:0.4,anc_below_0_5_days:7,current_paclitaxel_mg_m2:65},null,(r,m)=>{hasRule(r,/PAC_SEVERE_COUNTS/);assert(/50/.test(words(r)));noNumeric(m);});
test('00507','FN alone does not invent65mg dose',{febrile_neutropenia:true,current_paclitaxel_mg_m2:80},'withhold',(r,m)=>{assert(/G.CSF/.test(words(r)));noNumeric(m);});
test('00507','Bilirubin1.25 exact upper normal dose band',{alt_uln_multiple:9,bilirubin_uln_multiple:1.25},null,r=>noRule(r,/PAC_HEP_60|PAC_HEP_40|PAC_HEP_GAP|PAC_HEP_STOP/));
for(const value of [1.255,2.005])test('00507','Printed bilirubin decimal gap '+value,{alt_uln_multiple:9,bilirubin_uln_multiple:value},'consultant_review',(r,m)=>{hasRule(r,/PAC_HEP_GAP/);noNumeric(m);});
for(const [value,percent] of [[1.26,75],[2,75],[2.01,50],[5,50]])test('00507','Hepatic original percentage '+value,{alt_uln_multiple:9,bilirubin_uln_multiple:value},null,(r,m)=>{assert(new RegExp(percent+'%.*ORIGINAL','i').test(words(r)),'Source original-dose percentage must be visible');noNumeric(m);});
for(const [f,v] of [['alt_uln_multiple',10],['bilirubin_uln_multiple',5.01]])test('00507','Independent hepatic hard stop '+f,{[f]:v},'contraindicated',(r,m)=>noNumeric(m));
test('00507','Current50 cannot be re-escalated to hepatic60',{alt_uln_multiple:2,bilirubin_uln_multiple:1.5,current_paclitaxel_mg_m2:50},null,(r,m)=>{requiresReview(r,m);assert(/75%.*ORIGINAL/i.test(words(r)));});
test('00507','Neuropathy2 does not import10mg decrement',{neuropathy_grade:2},'consultant_review',(r,m)=>noNumeric(m));
test('00507','Neuropathy3 source conflict is held',{neuropathy_grade:3},'withhold',(r,m)=>{assert(/SOURCE CONFLICT/.test(words(r)));noNumeric(m);});
test('00507','Other grade2 toxicity held pending recovery',{other_nonhaem_toxicity_grade:2},'withhold',(r,m)=>noNumeric(m));
test('00507','Delay14days does not meet>14 stop',{paclitaxel_delay_days:14},null,r=>noRule(r,/PAC_INTOLERANCE/));
test('00507','Delay15days stops paclitaxel',{paclitaxel_delay_days:15},'discontinue',(r,m)=>noNumeric(m));
test('00507','Unable to tolerate after two reductions',{prior_paclitaxel_reductions:2,intolerant_after_reductions:true},'discontinue',(r,m)=>noNumeric(m));
structure('00507','Sole correct HER2/docetaxel-restricted indication',p=>{assert.deepEqual(p.indications.map(i=>i.code||i.indication_id),['00507a']);const text=JSON.stringify(p.indications);assert(/HER2/i.test(text));assert(/docetaxel/i.test(text));assert(!/ovarian|bladder|small.cell|00226/.test(text));});
structure('00507','Weekly days within21day cycle',p=>{const ph=p.treatment_phases.find(p=>p.phase_id==='combination');assert.equal(ph.cycle_length_days,21);assert.deepEqual(ph.administration.find(a=>a.drug==='paclitaxel').day,[1,8,15]);});
structure('00507','Paclitaxel maximum eight cycles is explicit',p=>{const ph=p.treatment_phases.find(p=>p.phase_id==='combination');assert.deepEqual(ph.cycles,[1,2,3,4,5,6,7,8]);assert(/up to eight|maximum.*8/i.test(ph.duration_text||''));});
structure('00507','Summary templates identify affected components, not always paclitaxel',p=>{assert(!/^Discontinue paclitaxel/.test(p.output_templates.discontinue||''));assert(!/^Do not administer paclitaxel/.test(p.output_templates.contraindicated||''));});

for(const code of ['00258','00204','00507']) {
  for(const [name,inputs] of [
    ['low ANC even with baseline selector',{assessment_stage:'baseline',anc_x10e9_l:0.8}],
    ['low platelets',{platelets_x10e9_l:60}],
    ['cytotoxic severe liver value',{alt_uln_multiple:12,bilirubin_uln_multiple:6}],
    ['severe hepatic impairment flag',{severe_hepatic_impairment:true}],
    ['neuropathy3',{neuropathy_grade:3}],
  ])test(code,'HER2-only continuation suppresses cytotoxic actions: '+name,{treatment_phase:'continuation',...inputs},null,(r,m)=>{assert.equal(m.rows.filter(x=>['docetaxel','carboplatin','paclitaxel'].includes(x.componentId)).length,0);assert(!['contraindicated','withhold','delay','discontinue'].includes(r.actionType),'No chemotherapy-derived hold/stop should be applied to maintenance antibodies');});
  test(code,'HER2-only continuation retains cardiac hold',{treatment_phase:'continuation',lvef_percent:39,lvef_drop_points:15},'withhold',(r,m)=>{hasRule(r,/HER2_LVEF_HOLD/);assert(m.rows.some(x=>x.componentId==='trastuzumab'));noNumeric(m);});
}

const report={created_at:new Date().toISOString(),root,source_audit:'her2-audit.json',case_count:output.length,passed:output.filter(x=>x.pass).length,failed:output.filter(x=>!x.pass).length,cases:output};
const reportPath=path.join(__dirname,'her2-source-case-results.json');
fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
console.log(`${report.passed}/${report.case_count} source-derived HER2 cases passed; ${report.failed} failed. Report: ${reportPath}`);
for(const item of output.filter(x=>!x.pass)) console.log(`FAIL ${item.code}: ${item.name}: ${item.error}`);
process.exitCode=report.failed?1:0;
