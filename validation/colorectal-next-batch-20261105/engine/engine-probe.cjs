'use strict';
/**
 * Observe the committed engine while authoritative source retrieval is blocked.
 * This is an implementation trace, not a clinical test or source audit.
 * Default output is stdout; --write stores results.json beside this script.
 * No application, protocol, clinical data, PDF or existing test is modified.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const root = path.resolve(__dirname, '../../..');
const Engine = require(path.join(root, 'js/assessment-engine.js'));
const Rules = require(path.join(root, 'js/rule-engine.js'));
const Dose = require(path.join(root, 'js/protocol-dose-schedule.js'));
const Lab = require(path.join(root, 'js/local-lab-profile.js'));
const codes = ['00212', '00214', '00215', '00244', '00382', '00207', '00225', '00328', '00330', '00331'];
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
const relative = value => path.relative(root, value).split(path.sep).join('/');
const sourceFiles = fs.readdirSync(path.join(root, 'protocols'), {recursive:true}).filter(f => f.endsWith('.json'));
const profiles = codes.map(code => {
  const matches = sourceFiles.filter(file => path.basename(file).startsWith(code + '-'));
  if (matches.length !== 1) throw new Error(`Expected exactly one encoded protocol for ${code}; got ${matches.length}`);
  const file = 'protocols/' + matches[0];
  const protocol = JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
  const definitions = Engine.getInputDefinitions(protocol);
  const colorectal = (protocol.indications || []).find(i => /colorectal|colon or rectum|rectal/i.test(i.description || ''));
  return {code,file,protocol,definitions,colorectal,context:colorectal ? {indication_id:colorectal.indication_id} : {}};
});

function leaves(node, output = []) {
  if (!node || typeof node !== 'object') return output;
  if (Array.isArray(node)) { node.forEach(n => leaves(n, output)); return output; }
  if (node.field) output.push({field:node.field, operator:node.operator, value:node.value});
  for (const key of ['all','any','not']) if (node[key]) leaves(node[key], output);
  return output;
}
function observe(p, id, category, supplied, details = {}) {
  const rawInputs = {...p.context, ...supplied};
  try {
    const result = Engine.assess(p.protocol, rawInputs);
    const doses = Dose.buildModificationModel(p.protocol, result);
    return {
      id:p.code + '-' + id, code:p.code, category, rawInputs, ...details,
      current_source_verified:false, clinical_validation:false,
      result:{
        action:result.actionType, complete:result.complete,
        enteredOrDerivedInputs:Object.fromEntries(Object.entries(result.inputs || {}).filter(([,v]) => v !== null && v !== undefined)),
        invalid:result.invalid, errors:result.errors,
        unassessedCount:result.unassessed?.length || 0,
        unassessedFields:id === 'blank' ? (result.unassessed || []).map(x => x.id) : undefined,
        skippedRuleCount:result.skippedRules?.length || 0,
        findings:(result.findings || []).filter(f => !f.domainAssessment && !/^PARTIAL_/.test(f.ruleId || '')).map(f => ({
          rule:f.ruleId, action:f.actionType, components:f.action?.components || [],
          componentChanges:f.action?.component_changes, doseCalculation:f.action?.dose_calculation,
          source:f.source, sourceText:f.sourceText, explanation:f.explanation
        })),
        componentRows:(doses.rows || []).map(r => ({id:r.componentId, component:r.component, action:r.actionLabel, dose:r.protocolDose}))
      }
    };
  } catch (error) {
    return {id:p.code+'-'+id, code:p.code, category, rawInputs, ...details, current_source_verified:false, clinical_validation:false, crash:String(error.stack || error)};
  }
}

const observations = [];
const inventory = [];
for (const p of profiles) {
  const rules = p.protocol.rule_engine?.rules || [];
  const numeric = new Map();
  const referencedFields=new Map();
  for (const rule of rules) for (const leaf of leaves(Rules.conditionFromRule(rule))) {
    if(!referencedFields.has(leaf.field))referencedFields.set(leaf.field,[]);
    referencedFields.get(leaf.field).push({id:rule.rule_id,operator:leaf.operator,value:leaf.value,source:rule.source});
    if (typeof leaf.value !== 'number') continue;
    const key=leaf.field + ':' + leaf.value;
    if (!numeric.has(key)) numeric.set(key,{field:leaf.field, threshold:leaf.value, rules:[]});
    numeric.get(key).rules.push({id:rule.rule_id, operator:leaf.operator, action:rule.action?.type, components:rule.action?.components, source:rule.source});
  }
  const defs = p.definitions.map(d => ({id:d.id,label:d.label,type:d.type,unit:d.unit || null,min:d.min,max:d.max,step:d.step,options:d.options,required:d.required,derivedValue:d.derived_value,actualResultAdapter:Lab.adapterFor(d)}));
  inventory.push({
    code:p.code, protocol:p.file, sha256:sha(p.file), encodedVersion:p.protocol.metadata?.nccp_version,
    encodedSourceUrl:p.protocol.metadata?.source_url, sourceCurrentness:'UNVERIFIED: fresh official retrieval blocked; metadata is retained evidence only',
    selectedColorectalIndication:p.colorectal, assessmentProfiles:Engine.getProfiles(p.protocol),
    clinicalUseAuthorised:p.protocol.metadata?.validation?.clinical_use_authorised,
    unitsAndInputs:defs, numericRuleBoundaries:[...numeric.values()],
    baselineTreatmentSelectors:defs.filter(d => /assessment_type|baseline|treatment_phase|cycle|day_number/.test(d.id)),
    sourceAttribution:{rules:rules.length,withoutSource:rules.filter(r=>!r.source?.url || !r.source?.page).map(r=>r.rule_id)},
    priorReductionFields:defs.filter(d=>/current_.*level|reduction|occurrence|nadir|lowest_|delay|recovery/.test(d.id)).map(d=>d.id)
  });
  observations.push(observe(p,'blank','missing-inputs',{}, {note:'The selected CRC indication is context only; no clinical measurement is supplied.'}));
  const firstNumber=p.definitions.find(d=>d.type==='number');
  if(firstNumber) {
    observations.push(observe(p,'malformed-number','invalid-input',{[firstNumber.id]:'not-a-number'}));
    observations.push(observe(p,'negative-number','invalid-input',{[firstNumber.id]:-1}));
    if(p.definitions.some(d=>d.id==='hypersensitivity')) observations.push(observe(p,'invalid-plus-urgent','invalid-input-with-independent-finding',{[firstNumber.id]:'not-a-number',hypersensitivity:true}));
  }
  // Independent single-field probes show engine behaviour; compound rule
  // prerequisites are deliberately not invented, so this is not rule coverage.
  for(const boundary of numeric.values()) {
    if(!/anc|platelet|crcl|gfr|bilirubin|alt|ast|diarrhoea|mucositis|rash|hfsr|skin_occurrence|current_.*level|systolic|diastolic|proteinuria/.test(boundary.field)) continue;
    const def=p.definitions.find(d=>d.id===boundary.field);
    if(!def || def.type!=='number') continue;
    const epsilon=String(def.step||'').includes('.') ? Number(def.step) : (Number.isInteger(boundary.threshold) && /grade|occurrence|current_.*level/.test(boundary.field) ? 1 : 0.01);
    for(const [position,delta] of [['below',-epsilon],['exact',0],['above',epsilon]]) {
      const value=Number((boundary.threshold+delta).toPrecision(15));
      observations.push(observe(p,`isolated-${boundary.field}-${boundary.threshold}-${position}`,'isolated-encoded-boundary',{[boundary.field]:value},{boundary,position,epsilon,note:'Single entered field plus CRC indication; missing prerequisites remain unassessed. These values are taken from current encoding, not confirmed current sources.'}));
    }
  }
  for(const [field,referencedBy] of referencedFields) {
    const def=p.definitions.find(d=>d.id===field);if(!def)continue;
    const values=def.type==='boolean'?[false,true]:def.type==='select'?(def.options||[]).map(o=>o.value):[];
    for(const value of values) observations.push(observe(p,`enum-${field}-${String(value)}`,'isolated-encoded-enum',{[field]:value},{referencedBy,note:'Actual encoded option/boolean only, with no invented compound prerequisites; this is not a clinical pass/fail case.'}));
  }
  const typeDef=p.definitions.find(d=>d.id==='assessment_type');
  if(typeDef) for(const option of typeDef.options || []) {
    const values={assessment_type:option.value};
    if(p.definitions.some(d=>d.id==='anc_x10e9_l')) values.anc_x10e9_l=1.49;
    observations.push(observe(p,'assessment-type-'+option.value,'baseline-versus-treatment-context',values));
  }
  for(const def of p.definitions) {
    const adapter=Lab.adapterFor(def);if(!adapter)continue;
    const settings={...Lab.defaults};
    const upper=Object.fromEntries(adapter.analytes.map(a=>[a.id,settings[a.setting]]));
    // ALP deliberately has no default ULN; supply an explicitly labelled
    // synthetic laboratory limit solely to exercise arithmetic.
    for(const a of adapter.analytes) if(!(settings[a.setting]>0)){settings[a.setting]=100;upper[a.id]=100;}
    const labCases=[['missing',{}],['zero',Object.fromEntries(adapter.analytes.map(a=>[a.id,0]))],['exact-uln',upper],['above-uln',Object.fromEntries(adapter.analytes.map(a=>[a.id,upper[a.id]*3.0001]))],['negative', {[adapter.analytes[0].id]:-1}]];
    if(adapter.analytes.length>1)labCases.push(['only-first-analyte',{[adapter.analytes[0].id]:upper[adapter.analytes[0].id]}],['higher-second-analyte',Object.fromEntries(adapter.analytes.map((a,i)=>[a.id,upper[a.id]*(i?4:1)]))]);
    for(const [label,actual]of labCases){
      const calculation=Lab.calculate(def,actual,settings);
      const values=calculation && Number.isFinite(calculation.ratio) && !calculation.invalid ? {[def.id]:calculation.ratio}:{};
      observations.push(observe(p,`uln-${def.id}-${label}`,'automatic-uln-arithmetic',values,{absoluteLabInputs:actual,syntheticLabSettings:settings,calculation,calculatorMapping:adapter,note:'Arithmetic probe only. Default/reference settings are not current source approval; decisions retain full precision.'}));
    }
    const badSettings={...settings,[adapter.analytes[0].setting]:0};
    observations.push(observe(p,`uln-${def.id}-invalid-upper-limit`,'automatic-uln-arithmetic',{}, {absoluteLabInputs:upper,syntheticLabSettings:badSettings,calculation:Lab.calculate(def,upper,badSettings),note:'Invalid conversion is not fed to the assessment engine.'}));
  }
}

const byCode=Object.fromEntries(profiles.map(p=>[p.code,p]));
for(const code of ['00328','00330','00331']) {
  const p=byCode[code];
  for(const grade of [0,1,2,3,4]) for(const delay of [0,1,1.99,2,2.01,3]) observations.push(observe(p,`current-diarrhoea-${grade}-delay-${delay}`,'targeted-current-diarrhoea-components',{diarrhoea_grade:grade,toxicity_delay_weeks:delay}));
  for(const highest of [3,4]) for(const current of [0,1,2]) for(const delay of [1,2,2.01]) {
    observations.push(observe(p,`diarrhoea-recovery-${current}-worst-${highest}-delay-${delay}`,'targeted-diarrhoea-recovery-attribution',{diarrhoea_grade:current,diarrhoea_highest_grade:highest,toxicity_delay_weeks:delay,current_irinotecan_level:0,current_fluorouracil_bolus_level:0,current_fluorouracil_infusion_level:0}));
  }
  for(const occurrence of [1,2,3,4]) for(const grade of [0,2,3]) observations.push(observe(p,`skin-occurrence-${occurrence}-current-${grade}`,'targeted-severe-skin-recurrence',{acneiform_rash_grade:grade,skin_occurrence:occurrence,skin_delay_weeks:1,skin_failed_recovery:false}));
}
for(const level of [0,-1,-2])observations.push(observe(byCode['00328'],`recovered-worst3-current-level-${level}`,'targeted-previous-reductions',{diarrhoea_grade:0,diarrhoea_highest_grade:3,toxicity_delay_weeks:1,current_irinotecan_level:level,current_fluorouracil_bolus_level:level,current_fluorouracil_infusion_level:level}));

const report={
  schemaVersion:1,reportType:'Current encoded-engine observations; current official sources unavailable',
  generatedAtUtc:new Date().toISOString(),executionCommit:cp.execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),
  branchAtExecution:cp.execFileSync('git',['branch','--show-current'],{cwd:root,encoding:'utf8'}).trim(),
  release:JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version,
  currentOfficialSourcesVerified:false,clinicalAuditsCompleted:0,clinicalValidation:false,
  clinicalRulesChanged:false,completedContextsIncrement:0,
  scope:codes,engineSources:['js/assessment-engine.js','js/rule-engine.js','js/protocol-dose-schedule.js','js/local-lab-profile.js'].map(file=>({file,sha256:sha(file)})),
  interpretation:['Observed outcomes describe the committed implementation, not medical correctness.','Numeric probes are derived from existing encoded constants and are not new source-boundary tests.','Missing compound prerequisites stay unassessed; isolated probes do not demonstrate complete rule coverage.','All source URLs/pages/versions below are retained protocol attribution and are unverified against current official NCCP documents.','Source conflicts must be resolved against newly retrieved official PDFs before changing hold/reduce/stop decisions.'],
  inventory,summary:{observations:observations.length,crashes:observations.filter(x=>x.crash).length,byCode:Object.fromEntries(codes.map(c=>[c,observations.filter(x=>x.code===c).length]))},observations
};
const json=JSON.stringify(report,(_key,value)=>typeof value==='number'&&!Number.isFinite(value)?'NON_FINITE':value,2)+'\n';
if(process.argv.includes('--write')){
  fs.writeFileSync(path.join(__dirname,'results.json'),json);
  console.log(JSON.stringify({file:relative(path.join(__dirname,'results.json')),executionCommit:report.executionCommit,observations:report.summary.observations,crashes:report.summary.crashes,currentOfficialSourcesVerified:false,clinicalAuditsCompleted:0},null,2));
}else process.stdout.write(json);
if(report.summary.crashes)process.exitCode=1;
