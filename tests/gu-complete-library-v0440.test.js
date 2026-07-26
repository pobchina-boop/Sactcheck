#!/usr/bin/env node
"use strict";
const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');
const expected=[
'00450','00544','00593','00535','00807','00385','00337','00885','00846','00945','00759','00310','00622','00628','00282','00894','00333','00338','00483','00484','00226','00621','00455','00558',
'00300','00453','00301','00602',
'00101','00103','00203','00233','00257','00313','00477','00478','00479','00480','00481','00482','00488','00489','00490','00491','00492','00493','00494','00546','00574','00577','00588','00693','00830','00848',
'00104','00592','00212','00518','00320','00551','00445','00583','00294','00325','00719','00326','00564'
].sort();
const newlyAdded=new Set(['00104','00282','00326','00333','00337','00338','00450','00453','00518','00535','00564','00583','00602','00622','00628','00759','00807','00846','00885','00894','00945']);
function read(f){return JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));}
function groups(d){const m=d.metadata||{},o=[];if(typeof m.tumour_group==='string')o.push(m.tumour_group);for(const v of m.tumour_groups||[])if(!o.includes(v))o.push(v);return o;}
function demo(d){if(d.demo_value!==undefined&&d.demo_value!==null)return String(d.demo_value);if(d.type==='select')return String(d.options?.[0]?.value??'');if(d.type==='boolean')return 'false';if(d.type==='number')return String(Number.isFinite(Number(d.min))?d.min:0);return 'test';}
const index=read('protocols/index.json');assert.strictEqual(index.protocol_count, 359);assert.strictEqual(index.protocols.length, 359);assert.strictEqual(new Set(index.protocols.map(x=>x.id)).size, 359);
const protocols=index.protocols.map(entry=>({entry,data:read(entry.path)}));
const gu=protocols.filter(x=>groups(x.data).includes('Genitourinary'));
const codes=gu.map(x=>String(x.data.metadata.nccp_regimen_code).padStart(5,'0')).sort();
assert.deepStrictEqual(codes,expected);assert.strictEqual(gu.length,67);assert.strictEqual(new Set(codes).size,67);
const risk=read('data/emetogenic-risk-map.json');assert.strictEqual(risk.release,'0.46.0');assert.strictEqual(Object.keys(risk.protocols||{}).length,359);
const cardSidecar=read('data/regimen-card-metadata.json');assert.strictEqual(cardSidecar.protocol_count,359);
let inputs=0,rules=0,newCount=0,cardContexts=0;
for(const {entry,data} of gu){
 const m=data.metadata||{},code=String(m.nccp_regimen_code).padStart(5,'0');
 assert.strictEqual(data.status,'encoded_prototype_pending_clinical_and_pharmacy_validation',`${code} status`);
 assert.strictEqual(m.partial_assessment_supported,true,`${code} partial assessment`);
 assert(/^https:\/\/(healthservice\.hse\.ie\/documents\/|www\.hse\.ie\/)/.test(m.source_url||''),`${code} official PDF`);
 assert(Array.isArray(data.required_inputs)&&data.required_inputs.length===0,`${code} required_inputs`);
 assert(Array.isArray(m.genitourinary_subgroups)&&m.genitourinary_subgroups.length,`${code} subgroup`);
 assert(risk.protocols[code],`${code} supportive care`);
 const defs=data.input_definitions||{},rs=data.rule_engine?.rules||[];inputs+=Object.keys(defs).length;rules+=rs.length;
 assert(Object.keys(defs).length>0,`${code} inputs`);assert(rs.length>0,`${code} rules`);
 for(const [id,d] of Object.entries(defs)){assert.strictEqual(d.required,false,`${code}/${id} required`);assert.notStrictEqual(d.demo_value,undefined,`${code}/${id} demo`);}
 const card=m.regimen_card;assert(card&&Array.isArray(card.contexts)&&card.contexts.length,`${code} card context`);cardContexts+=card.contexts.length;
 assert(card.contexts.some(c=>c.cycle_length_days>0),`${code} cycle interval`);
 const side=cardSidecar.protocols.find(x=>x.id===data.protocol_id);assert(side,`${code} sidecar`);
 if(newlyAdded.has(code)){newCount++;assert(entry.path.startsWith('protocols/genitourinary/'),`${code} new file path`);assert(['0.44.0','0.45.0','0.45.1','0.46.0'].includes(m.sactcheck_encoding_version),`${code} encoding version`);}
}
assert.strictEqual(newCount,21);assert(inputs>=650);assert(rules>=600);assert(cardContexts>=67);
const by=c=>gu.find(x=>String(x.data.metadata.nccp_regimen_code).padStart(5,'0')===c).data;
assert.strictEqual(by('00807').treatment.cycle_length_days,7);assert(/6 weeks/i.test(by('00807').treatment.schedule_summary));
assert.strictEqual(by('00894').treatment.cycle_length_days,7);assert(/18 months/i.test(by('00894').treatment.schedule_summary));
assert.strictEqual(by('00945').treatment.cycle_length_days,21);assert(by('00945').input_definitions.tsh_miu_l?.required===false);assert(by('00945').input_definitions.free_t4_pmol_l?.required===false);
assert.strictEqual(by('00602').treatment.planned_cycles,4);assert(by('00602').input_definitions.mesna_and_hydration_confirmed);
assert.strictEqual(by('00450').treatment.planned_cycles,1);assert(/days 1–5 and 22–26/i.test(by('00450').treatment.schedule_summary));
assert.strictEqual(by('00104').treatment.cycle_length_days,28);assert(by('00104').input_definitions.systolic_bp);
assert.strictEqual(by('00326').treatment.cycle_length_days,28);assert(by('00326').input_definitions.pneumonitis_or_new_respiratory_symptoms);
assert.strictEqual(by('00564').treatment.cycle_length_days,28);assert(/days 1–21/i.test(by('00564').treatment.schedule_summary));
const ctx={console};ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(root,'js/rule-engine.js'),'utf8'),ctx);vm.runInContext(fs.readFileSync(path.join(root,'js/assessment-engine.js'),'utf8'),ctx);const Engine=ctx.SACTCheckAssessmentEngine,RuleEngine=ctx.SACTCheckRuleEngine;let audited=0;
for(const {data} of gu){const profileId=Engine.getProfiles(data)[0]?.id||'default',defs=Engine.getInputDefinitions(data,profileId,{}),fields=new Set((data.rule_engine?.rules||[]).flatMap(r=>RuleEngine.collectConditionFields(RuleEngine.conditionFromRule(r)))),candidates=defs.filter(d=>d.visible!==false&&fields.has(d.id)&&demo(d)!=='');assert(candidates.length>0,`${data.protocol_id} no auditable inputs`);for(const d of candidates){const result=Engine.assess(data,{[d.id]:demo(d)},{profileId});assert(result.findings.length>0,`${data.protocol_id}/${d.id} no finding`);assert(!/insufficient data/i.test(String(result.status||'')));audited++;}}
assert(audited>=500,`single-entry checks ${audited}`);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');assert(html.includes('Version 0.46.0 · complete Head and Neck library'));assert(html.includes('js/protocol-loader.js?v=0.46.0'));
console.log(`v0.44.0 GU tests passed: ${gu.length} protocols, 21 new, ${inputs} inputs, ${rules} rules, ${audited} single-entry checks.`);
