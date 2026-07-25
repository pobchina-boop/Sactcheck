const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const expectedCodes = [
 '00511','00420','00391','00392','00500','00228','00501','00675','00747','00596','00680','00504','00754',
 '00335','00463','00100','00445','00205','00462','00244','00325','00719','00374','00554','00757'
].sort();

function walk(dir) {
 return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
  const current=path.join(dir,entry.name);return entry.isDirectory()?walk(current):[current];
 });
}
function protocols(){
 return walk(path.join(root,'protocols')).filter(file=>file.endsWith('.json'))
  .filter(file=>!['index.json','protocol-schema.json','package.json'].includes(path.basename(file)))
  .map(file=>{try{return {file,data:JSON.parse(fs.readFileSync(file,'utf8'))};}catch{return null;}}).filter(Boolean)
  .filter(({data})=>data?.protocol_id && data?.metadata?.nccp_regimen_code && data.metadata.nccp_regimen_code!=='00000');
}
function tumourGroups(protocol){
 const m=protocol.metadata||{},values=[];
 if(typeof m.tumour_group==='string')values.push(m.tumour_group);
 for(const value of m.tumour_groups||[])if(!values.includes(value))values.push(value);
 return values;
}
function trueGradeField(field,definition){
 if(definition?.ctcae_version)return true;
 const text=`${field} ${definition?.label||''}`.toLowerCase();
 if(definition?.type!=='select')return false;
 const exclusions=['occurrence','duration','days','weeks','recurrent','prior grade','prior_grade','not recovered','persists','resolution','requiring interruption','unresolved'];
 if(exclusions.some(token=>text.includes(token)))return false;
 return field.endsWith('_grade')||field.includes('current_grade')||field.includes('highest_grade');
}
function demoValue(definition){
 if(definition.demo_value!==undefined&&definition.demo_value!==null)return String(definition.demo_value);
 if(definition.type==='select')return String(definition.options?.[0]?.value??'');
 if(definition.type==='boolean')return 'false';
 if(definition.type==='number')return String(Number.isFinite(Number(definition.min))?definition.min:0);
 return 'test';
}

const all=protocols();
const sarcoma=all.filter(({data})=>tumourGroups(data).includes('Sarcoma'));
const codes=sarcoma.map(({data})=>String(data.metadata.nccp_regimen_code).padStart(5,'0')).sort();
assert.deepStrictEqual(codes,expectedCodes,'Sarcoma deck does not match the official NCCP catalogue inventory.');
assert.strictEqual(sarcoma.length,25,'Expected 25 distinct active Sarcoma protocols.');
assert.strictEqual(new Set(codes).size,25,'Sarcoma deck contains duplicate NCCP codes.');
assert.strictEqual(new Set(sarcoma.map(({data})=>data.protocol_id)).size,25,'Sarcoma deck contains duplicate protocol IDs.');

const index=JSON.parse(fs.readFileSync(path.join(root,'protocols','index.json'),'utf8'));
assert.strictEqual(index.protocol_count, 308,'Complete protocol index must contain 270 protocols.');
assert.strictEqual(index.protocols.length, 308,'Complete protocol index array must contain 270 entries.');
assert.strictEqual(new Set(index.protocols.map(item=>item.id)).size, 308,'Protocol index contains duplicate IDs.');

const riskMap=JSON.parse(fs.readFileSync(path.join(root,'data','emetogenic-risk-map.json'),'utf8'));
assert.strictEqual(riskMap.release,'0.43.0');
assert.strictEqual(Object.keys(riskMap.protocols||{}).length,308,'Supportive-care map must cover all protocols.');

const ctcaeContext={window:{}};vm.createContext(ctcaeContext);
vm.runInContext(fs.readFileSync(path.join(root,'js','ctcae-descriptors.js'),'utf8'),ctcaeContext);
const CTCAE=ctcaeContext.window.SACTCheckCTCAE;assert(CTCAE?.guide,'CTCAE library failed to initialise.');
const Lab=require('../js/local-lab-profile.js');

let inputCount=0,ruleCount=0,ctcaeFields=0,renalBands=0,ifosfamideProtocols=0,mapProtocols=0;
for(const {data} of sarcoma){
 const code=String(data.metadata.nccp_regimen_code).padStart(5,'0');const m=data.metadata||{};
 assert.strictEqual(data.status,'encoded_prototype_pending_clinical_and_pharmacy_validation',`${code} is not an active encoded prototype.`);
 assert(!/placeholder|draft/i.test(String(data.status||'')),`${code} remains a placeholder/draft.`);
 assert(['0.41.0','0.43.0'].includes(m.sactcheck_encoding_version),`${code} lacks a supported Sarcoma/Gynaecology reconciliation encoding marker.`);
 assert.strictEqual(m.partial_assessment_supported,true,`${code} lacks single-entry support.`);
 assert(/^https:\/\/(healthservice\.hse\.ie\/documents\/|www\.hse\.ie\/eng\/services\/list\/5\/cancer\/profinfo\/chemoprotocols\/)/.test(m.source_url||''),`${code} lacks an official HSE/NCCP PDF link.`);
 assert(m.sarcoma_subgroup,`${code} lacks Sarcoma subgroup.`);
 assert(Array.isArray(m.treatment_class)&&m.treatment_class.length,`${code} lacks treatment-class metadata.`);
 assert(m.catalogue_section,`${code} lacks catalogue section.`);
 assert(Array.isArray(data.required_inputs)&&data.required_inputs.length===0,`${code} has blocking required inputs.`);
 const defs=data.input_definitions||{},rules=data.rule_engine?.rules||[];
 assert(Object.keys(defs).length>0,`${code} has no active inputs.`);assert(rules.length>0,`${code} has no decision rules.`);
 inputCount+=Object.keys(defs).length;ruleCount+=rules.length;
 const sc=data.supportive_care||{};
 assert(sc.emetogenic_risk,`${code} lacks emetogenic classification.`);
 assert(sc.mapping_source_url,`${code} lacks supportive-care source.`);
 assert(sc.validation_status,`${code} lacks supportive-care validation status.`);
 assert(riskMap.protocols[code],`${code} is missing from central supportive-care map.`);
 if(!['phase_dependent','variable'].includes(sc.emetogenic_risk)){
  assert(sc.script_id,`${code} lacks supportive-care script.`);
  assert(riskMap.scripts[sc.script_id],`${code} references unknown script ${sc.script_id}.`);
  assert.strictEqual(sc.supportive_medications_pdf_url,riskMap.scripts[sc.script_id].url,`${code} supportive link is not registry controlled.`);
 }
 if((m.drugs||[]).map(x=>String(x).toLowerCase()).includes('ifosfamide')){
  ifosfamideProtocols++;
  for(const field of ['ifosfamide_renal_band','encephalopathy_grade','haematuria','urine_output_below_target'])assert(defs[field],`${code} lacks ifosfamide safety field ${field}.`);
  assert((sc.additional_supportive_care||[]).some(x=>/mesna/i.test(x)),`${code} lacks Mesna supportive-care mapping.`);
  assert((sc.additional_supportive_care||[]).some(x=>/hydration/i.test(x)),`${code} lacks hydration mapping.`);
 }
 if(code==='00463'){
  mapProtocols++;
  for(const field of ['methotrexate_renal_band','urine_ph','methotrexate_clearance_delayed','folinic_acid_rescue_started_on_time','interacting_medicines_present'])assert(defs[field],`MAP lacks ${field}.`);
  assert((sc.additional_supportive_care||[]).some(x=>/folinic acid rescue/i.test(x)),'MAP lacks folinic-acid rescue mapping.');
 }
 for(const [field,definition] of Object.entries(defs)){
  assert.notStrictEqual(definition.required,true,`${code}/${field} is blocking.`);
  const text=`${field} ${definition.label||''}`.toLowerCase();
  if(trueGradeField(field,definition)){
   ctcaeFields++;
   assert.strictEqual(definition.type,'select',`${code}/${field} CTCAE input must be select.`);
   assert.strictEqual(definition.ctcae_version,'5.0',`${code}/${field} lacks CTCAE v5.0.`);
   assert(definition.assessment_guidance,`${code}/${field} lacks assessment guidance.`);
   const grades=new Set((definition.options||[]).map(item=>Number(item.value)));
   [0,1,2,3,4].forEach(g=>assert(grades.has(g),`${code}/${field} lacks Grade ${g}.`));
   const guide=CTCAE.guide({...definition,id:field});assert(guide?.grades?.length>=5,`${code}/${field} lacks beside-control grading guide.`);
   guide.grades.slice(0,5).forEach(item=>assert(item.description,`${code}/${field}/Grade ${item.grade} lacks explanation.`));
  }
  if(/crcl|creatinine clearance|\begfr\b|renal function/.test(text)&&definition.type==='select'){
   renalBands++;
   assert.strictEqual(definition.renal_input?.mode,'protocol_specific_band',`${code}/${field} lacks renal-band metadata.`);
   assert.strictEqual(definition.renal_input?.exact_value_required,false,`${code}/${field} incorrectly requires exact value.`);
   assert((definition.options||[]).length>=2,`${code}/${field} lacks tiered renal choices.`);
  }
  if(/^(bilirubin_ratio_uln|bilirubin_uln_multiple|bilirubin_uln|alt_uln_multiple|ast_uln_multiple|ast_uln|alt_ast_uln_multiple|alt_ast_ratio_uln|ast_alt_uln|transaminases_uln_multiple|alt_ratio_uln)$/.test(field)){
   assert(Lab.adapterFor(field),`${code}/${field} lacks automatic actual-result ULN conversion.`);
  }
 }
}
assert(inputCount>=390,`Expected broad Sarcoma input coverage; found ${inputCount}.`);
assert(ruleCount>=380,`Expected broad source-specific Sarcoma rule coverage; found ${ruleCount}.`);
assert(ctcaeFields>=70,`Expected broad Sarcoma CTCAE coverage; found ${ctcaeFields}.`);
assert(renalBands>=10,`Expected broad Sarcoma renal-band coverage; found ${renalBands}.`);
assert(ifosfamideProtocols>=7,`Expected multiple ifosfamide pathways; found ${ifosfamideProtocols}.`);
assert.strictEqual(mapProtocols,1,'Expected one MAP protocol.');

// Single-entry regression across every visible rule-linked Sarcoma field.
const engineContext={console};engineContext.globalThis=engineContext;vm.createContext(engineContext);
vm.runInContext(fs.readFileSync(path.join(root,'js','rule-engine.js'),'utf8'),engineContext);
vm.runInContext(fs.readFileSync(path.join(root,'js','assessment-engine.js'),'utf8'),engineContext);
const Engine=engineContext.SACTCheckAssessmentEngine,RuleEngine=engineContext.SACTCheckRuleEngine;
let auditedFields=0;
for(const {data} of sarcoma){
 const code=String(data.metadata.nccp_regimen_code).padStart(5,'0');
 const profileId=Engine.getProfiles(data)[0]?.id||'default';
 const definitions=Engine.getInputDefinitions(data,profileId,{});
 const ruleFields=new Set((data.rule_engine?.rules||[]).flatMap(rule=>RuleEngine.collectConditionFields(RuleEngine.conditionFromRule(rule))));
 const candidates=definitions.filter(definition=>definition.visible!==false&&ruleFields.has(definition.id)&&demoValue(definition)!=='');
 assert(candidates.length>0,`${code} has no independently testable field.`);
 for(const definition of candidates){
  const result=Engine.assess(data,{[definition.id]:demoValue(definition)},{profileId});
  assert(result.findings.length>0,`${code}/${definition.id} produced no partial finding.`);
  assert(!/insufficient data/i.test(String(result.status||'')),`${code}/${definition.id} returned insufficient-data state.`);
  auditedFields++;
 }
}
assert(auditedFields>=320,`Expected at least 320 independently assessed Sarcoma inputs; found ${auditedFields}.`);

const aliasContext={globalThis:null};aliasContext.globalThis=aliasContext;vm.createContext(aliasContext);
vm.runInContext(fs.readFileSync(path.join(root,'js','drug-aliases.js'),'utf8'),aliasContext);
const Aliases=aliasContext.SACTCheckDrugAliases;assert.strictEqual(Aliases.version,'0.43.0');
const byCode=code=>sarcoma.find(({data})=>String(data.metadata.nccp_regimen_code).padStart(5,'0')===code).data;
const ruleById=(protocol,id)=>(protocol.rule_engine?.rules||[]).find(rule=>rule.id===id);
const dox500=byCode('00500');
assert.strictEqual(dox500.metadata.nccp_version,'3','NCCP 00500 must use current Version 3.');
assert.strictEqual(dox500.protocol_id,'nccp-00500-v3','NCCP 00500 protocol ID must track Version 3.');
assert(/^https:\/\/healthservice\.hse\.ie\/documents\//.test(dox500.metadata.source_url),'NCCP 00500 must use the current official source URL.');
assert.strictEqual(dox500.supportive_care.emetogenic_risk,'high','NCCP 00500 must use the current high-emetogenic classification.');
assert.strictEqual(ruleById(dox500,'ANC_LT1')?.when?.value,1,'NCCP 00500 ANC threshold must be 1.0.');
assert.strictEqual(ruleById(dox500,'PLT_LT100')?.when?.value,100,'NCCP 00500 platelet threshold must be 100.');
const dac=byCode('00511');
assert(dac.input_definitions.dacarbazine_renal_band,'Dacarbazine must expose source renal tiers.');
assert(/80%/.test(ruleById(dac,'DAC_CRCL_45_60')?.action?.message||''),'Dacarbazine CrCl 45–60 must map to 80%.');
assert(/75%/.test(ruleById(dac,'DAC_CRCL_30_44')?.action?.message||''),'Dacarbazine CrCl 30–44 must map to 75%.');
assert(/70%/.test(ruleById(dac,'DAC_CRCL_LT30')?.action?.message||''),'Dacarbazine CrCl <30 must map to 70%.');
const doxCis=byCode('00420');
assert(/75%/.test(ruleById(doxCis,'CIS_50_59')?.action?.message||''),'Cisplatin CrCl 50–59 must map to 75%.');
assert(/50%/.test(ruleById(doxCis,'CIS_40_49')?.action?.message||''),'Cisplatin CrCl 40–49 must map to 50%.');
const map=byCode('00463');
assert(map.input_definitions.urine_ph && map.input_definitions.methotrexate_clearance_delayed && map.input_definitions.folinic_acid_rescue_started_on_time,'MAP must include urine pH, clearance and rescue safety inputs.');
for(const code of ['00463','00504','00675','00747','00754','00757']){
 const protocol=byCode(code);assert.strictEqual(protocol.supportive_care.emetogenic_risk,'phase_dependent',`${code} must use phase-dependent supportive care.`);assert(Object.keys(protocol.supportive_care.phase_profiles||{}).length>=2,`${code} lacks phase-specific supportive-care profiles.`);assert(!protocol.supportive_care.supportive_medications_pdf_url,`${code} must not expose a misleading static antiemetic sheet.`);
}
const aliases={'00511':'DTIC','00500':'Adriamycin','00228':'Halaven','00335':'Glivec','00100':'Mepact','00445':'Votrient','00205':'Caelyx','00244':'Stivarga','00325':'Sutent','00374':'Yondelis'};
for(const [code,alias] of Object.entries(aliases))assert(Aliases.forProtocol(byCode(code)).includes(alias),`${code} is not searchable by ${alias}.`);

const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert(html.includes('Version 0.43.0 · complete Gynaecology library'),'v0.41.1 release badge missing.');
assert(html.includes('js/protocol-loader.js?v=0.43.0'),'v0.41.1 loader cache key missing.');
assert(html.includes('js/drug-aliases.js?v=0.43.0'),'v0.41.1 alias cache key missing.');
const tissueUi=fs.readFileSync(path.join(root,'js','tissue-ui.js'),'utf8');
assert(tissueUi.includes('label: "Sarcoma"'),'Sarcoma tissue UI label missing.');

console.log(`v0.41.0 Sarcoma library tests passed: 25 active protocols, ${inputCount} inputs, ${ruleCount} rules and ${auditedFields} independently assessed rule-linked fields.`);
