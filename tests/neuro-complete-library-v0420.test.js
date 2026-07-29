#!/usr/bin/env node
"use strict";
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const root=path.resolve(__dirname,'..');
const expected=['00334','00342','00379','00461','00658','00742','00804','00805','00806','00813'].sort();
function read(file){return JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));}
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{const p=path.join(dir,e.name);return e.isDirectory()?walk(p):[p];});}
function allProtocols(){return walk(path.join(root,'protocols')).filter(f=>f.endsWith('.json')&&!f.includes(`${path.sep}protocols${path.sep}protocols${path.sep}`)&&!['index.json','protocol-schema.json','package.json'].includes(path.basename(f))).map(file=>{try{return {file,data:JSON.parse(fs.readFileSync(file,'utf8'))};}catch{return null;}}).filter(Boolean).filter(x=>x.data?.protocol_id&&x.data?.metadata?.nccp_regimen_code&&x.data.metadata.nccp_regimen_code!=='00000');}
function groups(d){const m=d.metadata||{},out=[];if(typeof m.tumour_group==='string')out.push(m.tumour_group);for(const v of m.tumour_groups||[])if(!out.includes(v))out.push(v);return out;}
function demo(def){if(def.demo_value!==undefined&&def.demo_value!==null)return String(def.demo_value);if(def.type==='select')return String(def.options?.[0]?.value??'');if(def.type==='boolean')return 'false';if(def.type==='number')return String(Number.isFinite(Number(def.min))?def.min:0);return 'test';}
const all=allProtocols();const neuro=all.filter(x=>groups(x.data).includes('Neuro-oncology'));
const codes=neuro.map(x=>String(x.data.metadata.nccp_regimen_code).padStart(5,'0')).sort();
assert.deepStrictEqual(codes,expected,'Neuro-oncology deck must match the current NCCP catalogue inventory.');
assert.strictEqual(neuro.length,10);assert.strictEqual(new Set(codes).size,10);assert.strictEqual(new Set(neuro.map(x=>x.data.protocol_id)).size,10);
const index=read('protocols/index.json');assert.strictEqual(index.protocol_count, 376);assert.strictEqual(index.protocols.length, 376);assert.strictEqual(new Set(index.protocols.map(x=>x.id)).size, 376);
const risk=read('data/emetogenic-risk-map.json');assert.strictEqual(risk.release,'0.48.0');assert.strictEqual(Object.keys(risk.protocols||{}).length,376);
let inputs=0,rules=0,ctcae=0,renalBands=0;
for(const {data,file} of neuro){
 const m=data.metadata,code=String(m.nccp_regimen_code).padStart(5,'0');
 assert.strictEqual(data.status,'encoded_prototype_pending_clinical_and_pharmacy_validation',`${code} not active encoded prototype`);
 assert.strictEqual(m.sactcheck_encoding_version,'0.42.0');assert.strictEqual(m.partial_assessment_supported,true);assert.strictEqual(m.tumour_group,'Neuro-oncology');
 assert(/^https:\/\/healthservice\.hse\.ie\/documents\//.test(m.source_url||''),`${code} missing official source`);
 assert(!/placeholder|draft/i.test(String(data.status)));assert(Array.isArray(data.required_inputs)&&data.required_inputs.length===0,`${code} has blocking required inputs`);
 assert(Array.isArray(m.common_trade_names)&&m.common_trade_names.length,`${code} lacks aliases`);
 const defs=data.input_definitions||{},rs=data.rule_engine?.rules||[];inputs+=Object.keys(defs).length;rules+=rs.length;
 assert(Object.keys(defs).length>=10,`${code} insufficient input coverage`);assert(rs.length>=10,`${code} insufficient rule coverage`);
 assert(risk.protocols[code],`${code} missing supportive map`);assert(data.supportive_care?.emetogenic_risk);assert(data.supportive_care?.mapping_source_url);
 for(const [id,d] of Object.entries(defs)){
  assert.strictEqual(d.required,false,`${code}/${id} must be optional`);assert.notStrictEqual(d.demo_value,undefined,`${code}/${id} lacks demo`);
  if(d.ctcae_version){ctcae++;assert(d.assessment_guidance,`${code}/${id} lacks assessment guide`);const options=d.options||[];for(let g=0;g<=4;g++){const o=options.find(x=>Number(x.value)===g);assert(o&&o.description,`${code}/${id} Grade ${g} lacks explanation`);}}
  const text=`${id} ${d.label||''}`.toLowerCase();if(d.type==='select'&&/crcl|renal function|creatinine clearance/.test(text)){renalBands++;assert.strictEqual(d.renal_input?.mode,'protocol_specific_band',`${code}/${id} missing renal band mode`);assert.strictEqual(d.renal_input?.exact_value_required,false);}
 }
}
assert(inputs>=200);assert(rules>=240);assert(ctcae>=20);assert(renalBands>=12);

const byCode=code=>neuro.find(x=>String(x.data.metadata.nccp_regimen_code).padStart(5,'0')===code).data;
const ruleBy=(p,id)=>(p.rule_engine?.rules||[]).find(r=>(r.id||r.rule_id)===id);
assert.strictEqual(ruleBy(byCode('00806'),'ANC_LT1').when.value,1);assert(/80%/.test(ruleBy(byCode('00806'),'ANC_LT1').action.message));
assert(/75%/.test(ruleBy(byCode('00806'),'CIS_50_59').action.message));assert(/50%/.test(ruleBy(byCode('00806'),'CIS_40_49').action.message));
assert.strictEqual(ruleBy(byCode('00342'),'ANC_LT1').when.value,1);assert.strictEqual(ruleBy(byCode('00342'),'PLT_LT50').when.value,50);
assert.strictEqual(ruleBy(byCode('00334'),'CONC_ANC_STOP').action.type,'permanently_discontinue');assert.strictEqual(ruleBy(byCode('00334'),'CONC_PLT_HOLD').action.type,'withhold');
assert.strictEqual(ruleBy(byCode('00461'),'CONC_PLT_STOP').when.all[1].value,25);assert.strictEqual(ruleBy(byCode('00461'),'NO_RECOVERY_3W').action.type,'permanently_discontinue');
assert(['discontinue','permanently_discontinue'].includes(ruleBy(byCode('00813'),'PROTEIN_OVER_4').action.type));
for(const c of ['00742','00804']){assert(byCode(c).input_definitions.proteinuria_dipstick);assert(byCode(c).input_definitions.lomustine_renal_band);assert.strictEqual(byCode(c).supportive_care.emetogenic_risk,'phase_dependent');}
for(const c of ['00379','00658']){assert(byCode(c).input_definitions.assessment_day);assert(ruleBy(byCode(c),'D29_SEVERE_COUNTS'));assert.strictEqual(byCode(c).supportive_care.emetogenic_risk,'phase_dependent');}

// Single-entry audit for every rule-linked visible field.
const ctx={console};ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(root,'js/rule-engine.js'),'utf8'),ctx);vm.runInContext(fs.readFileSync(path.join(root,'js/assessment-engine.js'),'utf8'),ctx);const Engine=ctx.SACTCheckAssessmentEngine,RuleEngine=ctx.SACTCheckRuleEngine;
let audited=0;
for(const {data} of neuro){
 const profileId=Engine.getProfiles(data)[0]?.id||'default';const defs=Engine.getInputDefinitions(data,profileId,{});const fields=new Set((data.rule_engine?.rules||[]).flatMap(r=>RuleEngine.collectConditionFields(RuleEngine.conditionFromRule(r))));const candidates=defs.filter(d=>d.visible!==false&&fields.has(d.id)&&demo(d)!=='');assert(candidates.length>0);
 for(const d of candidates){const result=Engine.assess(data,{[d.id]:demo(d)},{profileId});assert(result.findings.length>0,`${data.protocol_id}/${d.id} returned no finding`);assert(!/insufficient data/i.test(String(result.status||'')));audited++;}
}
assert(audited>=170,`Expected >=170 single-entry checks, found ${audited}`);

const aliasCtx={globalThis:null};aliasCtx.globalThis=aliasCtx;vm.createContext(aliasCtx);vm.runInContext(fs.readFileSync(path.join(root,'js/drug-aliases.js'),'utf8'),aliasCtx);const Aliases=aliasCtx.SACTCheckDrugAliases;assert.strictEqual(Aliases.version,'0.48.0');
assert(Aliases.forProtocol(byCode('00342')).includes('Temodal'));assert(Aliases.forProtocol(byCode('00813')).includes('Avastin'));assert(Aliases.forProtocol(byCode('00805')).includes('CCNU'));assert(Aliases.forProtocol(byCode('00379')).includes('Matulane'));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');assert(html.includes('v0.50.3 · What changed?'));assert(html.includes('js/protocol-loader.js?v=0.50.3'));assert(html.includes('js/drug-aliases.js?v=0.48.4'));
const tissue=fs.readFileSync(path.join(root,'js/tissue-ui.js'),'utf8');assert(tissue.includes('label: "Neuro-oncology"'));assert(tissue.includes('#4B5FA8'));
console.log(`v0.42.0 Neuro-oncology tests passed: 10 protocols, ${inputs} inputs, ${rules} rules and ${audited} individually assessed rule-linked fields.`);
