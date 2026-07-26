#!/usr/bin/env node
"use strict";
const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');
const expected=['00102','00105','00236','00237','00373','00415','00431','00455','00464','00483','00484','00535','00551','00558','00563','00812'].sort();
const newlyAdded=new Set(['00102','00105','00236','00237','00373','00415','00431','00464','00563']);
function read(f){return JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));}
function groups(d){const m=d.metadata||{},o=[];if(typeof m.tumour_group==='string')o.push(m.tumour_group);for(const v of m.tumour_groups||[])if(!o.includes(v))o.push(v);return o;}
function demo(d){if(d.demo_value!==undefined&&d.demo_value!==null)return String(d.demo_value);if(d.type==='select')return String(d.options?.[0]?.value??'');if(d.type==='boolean')return 'false';if(d.type==='number')return String(Number.isFinite(Number(d.min))?d.min:0);return 'test';}
const index=read('protocols/index.json');assert.strictEqual(index.protocol_count, 361);assert.strictEqual(index.protocols.length, 361);assert.strictEqual(new Set(index.protocols.map(x=>x.id)).size,361);
const protocols=index.protocols.map(entry=>({entry,data:read(entry.path)}));
const skin=protocols.filter(x=>groups(x.data).includes('Skin/Melanoma'));
const codes=skin.map(x=>String(x.data.metadata.nccp_regimen_code).padStart(5,'0')).sort();
assert.deepStrictEqual(codes,expected);assert.strictEqual(skin.length,16);assert.strictEqual(new Set(codes).size,16);
const risk=read('data/emetogenic-risk-map.json');assert.strictEqual(risk.release,'0.47.0');assert.strictEqual(Object.keys(risk.protocols||{}).length,361);
const cardSidecar=read('data/regimen-card-metadata.json');assert.strictEqual(cardSidecar.protocol_count,361);
let inputs=0,rules=0,newCount=0,cardContexts=0;
for(const {entry,data} of skin){
 const m=data.metadata||{},code=String(m.nccp_regimen_code).padStart(5,'0');
 assert.strictEqual(data.status,'encoded_prototype_pending_clinical_and_pharmacy_validation',`${code} status`);
 assert.strictEqual(m.partial_assessment_supported,true,`${code} partial assessment`);
 assert(/^https:\/\/healthservice\.hse\.ie\/documents\//.test(m.source_url||''),`${code} official PDF`);
 assert(Array.isArray(data.required_inputs)&&data.required_inputs.length===0,`${code} required_inputs`);
 assert(Array.isArray(m.skin_subgroups)&&m.skin_subgroups.length,`${code} subgroup`);
 assert(risk.protocols[code],`${code} supportive care`);
 const defs=data.input_definitions||{},rs=data.rule_engine?.rules||[];inputs+=Object.keys(defs).length;rules+=rs.length;
 assert(Object.keys(defs).length>0,`${code} inputs`);assert(rs.length>0,`${code} rules`);
 for(const [id,d] of Object.entries(defs)){assert.strictEqual(d.required,false,`${code}/${id} required`);assert.notStrictEqual(d.demo_value,undefined,`${code}/${id} demo`);}
 const card=m.regimen_card;assert(card&&Array.isArray(card.contexts)&&card.contexts.length,`${code} card context`);cardContexts+=card.contexts.length;
 assert(card.contexts.some(c=>Number(c.cycle_length_days)>0),`${code} cycle interval`);
 const side=cardSidecar.protocols.find(x=>x.id===data.protocol_id);assert(side,`${code} sidecar`);
 if(newlyAdded.has(code)){newCount++;assert(entry.path.startsWith('protocols/skin/'),`${code} new file path`);assert.strictEqual(m.sactcheck_encoding_version,'0.45.0',`${code} encoding version`);}
}
assert.strictEqual(newCount,9);assert(inputs>=280);assert(rules>=210);assert(cardContexts>=25);
const by=c=>skin.find(x=>String(x.data.metadata.nccp_regimen_code).padStart(5,'0')===c).data;
assert.strictEqual(by('00464').treatment.cycle_length_days,21);assert.strictEqual(by('00464').treatment.planned_cycles,6);assert.strictEqual(by('00464').supportive_care.emetogenic_risk,'high');assert(by('00464').rule_engine.rules.some(r=>r.id==='DTIC_ANC'&&r.when.value===1.5));assert(by('00464').rule_engine.rules.some(r=>r.id==='DTIC_CRCL_LT30'));assert.strictEqual(by('00464').input_definitions.dacarbazine_renal_band.renal_input.mode,'protocol_specific_band');
assert.strictEqual(by('00373').treatment.cycle_length_days,28);assert(/days 1–21/i.test(by('00373').treatment.schedule_summary));assert(by('00373').input_definitions.braf_v600_confirmed);assert(by('00373').input_definitions.qtc_ms);assert(by('00373').input_definitions.lvef_percent);
assert.strictEqual(by('00237').treatment.cycle_length_days,28);assert(by('00237').rule_engine.rules.some(r=>r.id==='PYREXIA'));
assert.strictEqual(by('00415').metadata.regimen_card.contexts.length,2);assert(by('00415').metadata.regimen_card.contexts.some(c=>c.intent==='adjuvant'&&/12 months/i.test(c.duration_text)));
assert.strictEqual(by('00431').treatment.cycle_length_days,21);assert(/4 combination cycles/i.test(by('00431').metadata.regimen_card.contexts[0].duration_text));
assert.strictEqual(by('00558').treatment.cycle_length_days,42);assert(by('00558').metadata.regimen_card.contexts.some(c=>c.cycle_length_days===42&&c.intent==='adjuvant'));
assert.strictEqual(by('00535').metadata.nccp_version,'6b');assert(by('00535').indications.some(i=>/Merkel cell/i.test(i.description)));
assert(by('00812').indications.some(i=>/cutaneous squamous/i.test(i.description)));
assert(by('00236').input_definitions.pregnancy_prevention_programme_confirmed);
for(const code of ['00105','00431']){const d=by(code);assert(d.input_definitions.tsh_miu_l?.required===false);assert(d.input_definitions.free_t4_pmol_l?.required===false);assert(d.input_definitions.cortisol_nmol_l?.required===false);}
for(const code of ['00102','00236','00237','00373','00415','00464','00563']){const d=by(code);assert(!d.input_definitions.tsh_miu_l,`${code} should not expose routine ICI endocrine fields`);}
const ctx={console};ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(root,'js/rule-engine.js'),'utf8'),ctx);vm.runInContext(fs.readFileSync(path.join(root,'js/assessment-engine.js'),'utf8'),ctx);const Engine=ctx.SACTCheckAssessmentEngine,RuleEngine=ctx.SACTCheckRuleEngine;let audited=0;
for(const {data} of skin){const profileId=Engine.getProfiles(data)[0]?.id||'default',defs=Engine.getInputDefinitions(data,profileId,{}),fields=new Set((data.rule_engine?.rules||[]).flatMap(r=>RuleEngine.collectConditionFields(RuleEngine.conditionFromRule(r)))),candidates=defs.filter(d=>d.visible!==false&&fields.has(d.id)&&demo(d)!=='');assert(candidates.length>0,`${data.protocol_id} no auditable inputs`);for(const d of candidates){const result=Engine.assess(data,{[d.id]:demo(d)},{profileId});assert(result.findings.length>0,`${data.protocol_id}/${d.id} no finding`);assert(!/insufficient data/i.test(String(result.status||'')));audited++;}}
assert(audited>=180,`single-entry checks ${audited}`);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');assert(html.includes('Version 0.47.0 · complete Neuroendocrine and adult tumour-agnostic libraries'));assert(html.includes('js/protocol-loader.js?v=0.47.0'));
console.log(`v0.45.0 Skin/Melanoma tests passed: ${skin.length} protocols, 9 new, ${inputs} inputs, ${rules} rules, ${audited} single-entry checks.`);
