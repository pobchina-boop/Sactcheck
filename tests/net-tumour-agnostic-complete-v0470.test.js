#!/usr/bin/env node
"use strict";
const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');
function read(f){return JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));}
function groups(d){const m=d.metadata||{},o=[];if(typeof m.tumour_group==='string')o.push(m.tumour_group);for(const v of m.tumour_groups||[])if(!o.includes(v))o.push(v);return o;}
function demo(d){if(d.demo_value!==undefined&&d.demo_value!==null)return d.demo_value;if(d.type==='select')return d.options?.[0]?.value??'';if(d.type==='boolean')return false;if(d.type==='number')return Number.isFinite(Number(d.min))?Number(d.min):0;return 'test';}
const index=read('protocols/index.json');assert.strictEqual(index.protocol_count,376);assert.strictEqual(index.protocols.length,376);assert.strictEqual(new Set(index.protocols.map(x=>x.id)).size,376);
const all=index.protocols.map(entry=>({entry,data:read(entry.path)}));
const net=all.filter(x=>groups(x.data).includes('Neuroendocrine'));const ta=all.filter(x=>groups(x.data).includes('Tumour Agnostic Therapy'));
assert.deepStrictEqual(net.map(x=>x.data.metadata.nccp_regimen_code).sort(),['00320','00327','00642']);
assert.deepStrictEqual(ta.map(x=>x.data.metadata.nccp_regimen_code).sort(),['00702','00758']);
assert.strictEqual(net.length,3);assert.strictEqual(ta.length,2);
const by=c=>all.find(x=>x.data.metadata.nccp_regimen_code===c).data;
for(const d of [...net,...ta].map(x=>x.data)){
 assert.strictEqual(d.status,'encoded_prototype_pending_clinical_and_pharmacy_validation');
 assert.strictEqual(d.metadata.partial_assessment_supported,true);
 assert(/^https:\/\/healthservice\.hse\.ie\/documents\//.test(d.metadata.source_url));
 assert(Array.isArray(d.required_inputs)&&d.required_inputs.length===0);
 assert(Object.keys(d.input_definitions||{}).length>0);assert((d.rule_engine?.rules||[]).length>0);
 for(const def of Object.values(d.input_definitions||{})){assert.strictEqual(def.required,false);assert.notStrictEqual(def.demo_value,undefined);}
}
const ever=by('00320');assert.deepStrictEqual(groups(ever).sort(),['Gastrointestinal','Genitourinary','Neuroendocrine'].sort());assert(ever.indications.some(i=>i.indication_id==='00320b'&&i.tumour_groups.includes('Neuroendocrine')));assert(ever.indications.some(i=>i.indication_id==='00320c'&&i.tumour_groups.includes('Neuroendocrine')));assert(ever.indications.some(i=>i.indication_id==='00320a'&&i.tumour_groups.includes('Genitourinary')));
const lut=by('00642');assert.strictEqual(lut.treatment.planned_cycles,4);assert.strictEqual(lut.treatment.cycle_length_days,56);assert(lut.indications[0].tumour_groups.includes('Neuroendocrine'));
const sun=by('00327');assert.strictEqual(sun.metadata.nccp_version,'5');assert.strictEqual(sun.treatment.cycle_length_days,28);assert.strictEqual(sun.treatment.duration_type,'until_progression_or_toxicity');assert(sun.rule_engine.rules.some(r=>r.id==='SUN327_ANC_LT1'&&r.when.value===1&&r.action.type==='delay'));assert(sun.rule_engine.rules.some(r=>r.id==='SUN327_PLT_LT75'&&r.when.value===75&&r.action.type==='delay'));assert(sun.rule_engine.rules.some(r=>r.id==='SUN327_LVEF_SYMPTOMATIC'&&r.action.type==='discontinue'));assert(sun.rule_engine.rules.some(r=>r.id==='SUN327_CHILD_PUGH_C'&&r.action.type==='dose_reduce'));
const ent=by('00702');assert.deepStrictEqual(groups(ent).sort(),['Lung','Tumour Agnostic Therapy'].sort());assert(ent.indications.some(i=>i.indication_id==='00702b'&&i.tumour_groups.includes('Tumour Agnostic Therapy')));
const laro=by('00758');assert.strictEqual(laro.metadata.nccp_version,'3');assert.strictEqual(laro.treatment.duration_type,'until_progression_or_toxicity');assert(laro.rule_engine.rules.some(r=>r.id==='LARO_CYP_INDUCER'&&r.action.type==='contraindicated'));assert(laro.rule_engine.rules.some(r=>r.id==='LARO_CYP_INHIBITOR'&&r.action.type==='dose_reduce'));assert(laro.rule_engine.rules.some(r=>r.id==='LARO_CHILD_PUGH_BC'&&r.action.type==='dose_reduce'));assert(laro.rule_engine.rules.some(r=>r.id==='LARO_HY_LAW_PATTERN'&&r.action.type==='withhold'));assert(laro.rule_engine.rules.some(r=>r.id==='LARO_G4_AFTER_RESUME'&&r.action.type==='permanently_discontinue'));
const risk=read('data/emetogenic-risk-map.json');assert.strictEqual(risk.release,'0.48.0');assert.strictEqual(Object.keys(risk.protocols||{}).length,376);for(const c of ['00320','00327','00642','00702','00758'])assert(risk.protocols[c]);
const sidecar=read('data/regimen-card-metadata.json');assert.strictEqual(sidecar.protocol_count,376);for(const d of [...net,...ta].map(x=>x.data))assert(sidecar.protocols.some(x=>x.id===d.protocol_id));
const ctx={console};ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(root,'js/protocol-context.js'),'utf8'),ctx);const Context=ctx.SACTCheckProtocolContext;assert(/pancreatic neuroendocrine/i.test(Context.descriptionForTissue(ever,'Neuroendocrine')));assert(/NTRK/i.test(Context.descriptionForTissue(ent,'Tumour Agnostic Therapy')));assert.strictEqual(Context.preferredIndicationId(ent,'Tumour Agnostic Therapy'),'00702b');
vm.runInContext(fs.readFileSync(path.join(root,'js/rule-engine.js'),'utf8'),ctx);vm.runInContext(fs.readFileSync(path.join(root,'js/assessment-engine.js'),'utf8'),ctx);const Engine=ctx.SACTCheckAssessmentEngine,RuleEngine=ctx.SACTCheckRuleEngine;let audited=0;
for(const d of [...net,...ta].map(x=>x.data)){
 const profileId=Engine.getProfiles(d)[0]?.id||'default',defs=Engine.getInputDefinitions(d,profileId,{}),fields=new Set((d.rule_engine?.rules||[]).flatMap(r=>RuleEngine.collectConditionFields(RuleEngine.conditionFromRule(r))));
 const candidates=defs.filter(x=>x.visible!==false&&fields.has(x.id));assert(candidates.length>0);
 for(const def of candidates){const result=Engine.assess(d,{[def.id]:demo(def)},{profileId});assert(result.findings.length>0,`${d.protocol_id}/${def.id}`);audited++;}
}
assert(audited>=50,`single-entry checks ${audited}`);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');assert(html.includes('v0.50.2 · What changed?'));assert(html.includes('js/tissue-ui.js?v=0.50.2'));assert(html.includes('js/protocol-context.js?v=0.48.4'));
const tissue=fs.readFileSync(path.join(root,'js/tissue-ui.js'),'utf8');assert(tissue.includes('label: "Neuroendocrine"'));assert(tissue.includes('label: "Tumour Agnostic"'));
console.log(`v0.47.0 NET/TA tests passed: ${net.length} NET, ${ta.length} tumour-agnostic, ${audited} single-entry checks.`);
