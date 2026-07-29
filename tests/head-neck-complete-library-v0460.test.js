#!/usr/bin/env node
"use strict";
const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');
const expected=['00552','00591','00589','00261','00419','00332','00418','00417','00207','00387','00385','00314','00615','00324','00323','00517','00903','00514','00295','00315','00893','00483','00484','00696','00455','00558','00705','00706','00294','00242'].sort();
const newlyAdded=new Set(['00552','00591','00589','00332','00418','00417','00387','00314','00615','00324','00323','00517','00903','00514','00295','00315','00893','00696','00705','00706','00242']);
function read(f){return JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));}
function groups(d){const m=d.metadata||{},o=[];if(typeof m.tumour_group==='string')o.push(m.tumour_group);for(const v of m.tumour_groups||[])if(!o.includes(v))o.push(v);return o;}
function demo(d){if(d.demo_value!==undefined&&d.demo_value!==null)return String(d.demo_value);if(d.type==='select')return String(d.options?.[0]?.value??'');if(d.type==='boolean')return 'false';if(d.type==='number')return String(Number.isFinite(Number(d.min))?d.min:0);return 'test';}
const index=read('protocols/index.json');assert.strictEqual(index.protocol_count,376);assert.strictEqual(index.protocols.length,376);assert.strictEqual(new Set(index.protocols.map(x=>x.id)).size,376);
const protocols=index.protocols.map(entry=>({entry,data:read(entry.path)}));
const hn=protocols.filter(x=>groups(x.data).includes('Head and Neck'));
const codes=hn.map(x=>String(x.data.metadata.nccp_regimen_code).padStart(5,'0')).sort();
assert.deepStrictEqual(codes,expected);assert.strictEqual(hn.length,30);assert.strictEqual(new Set(codes).size,30);
const risk=read('data/emetogenic-risk-map.json');assert.strictEqual(risk.release,'0.48.0');assert.strictEqual(Object.keys(risk.protocols||{}).length,376);
const sidecar=read('data/regimen-card-metadata.json');assert.strictEqual(sidecar.protocol_count,376);
let inputs=0,rules=0,newCount=0,contexts=0;
for(const {entry,data} of hn){
 const m=data.metadata||{},code=String(m.nccp_regimen_code).padStart(5,'0');
 assert.strictEqual(data.status,'encoded_prototype_pending_clinical_and_pharmacy_validation',`${code} status`);
 assert.strictEqual(m.partial_assessment_supported,true,`${code} partial assessment`);
 assert(/^https:\/\/healthservice\.hse\.ie\/documents\//.test(m.source_url||''),`${code} official PDF`);
 assert(Array.isArray(data.required_inputs)&&data.required_inputs.length===0,`${code} required inputs`);
 assert(Array.isArray(m.head_neck_subgroups)&&m.head_neck_subgroups.length,`${code} subgroup`);
 assert(risk.protocols[code],`${code} supportive mapping`);
 assert(data.indications.some(i=>Array.isArray(i.tumour_groups)&&i.tumour_groups.includes('Head and Neck')),`${code} contextual indication`);
 const defs=data.input_definitions||{},rs=data.rule_engine?.rules||[];inputs+=Object.keys(defs).length;rules+=rs.length;
 assert(Object.keys(defs).length>0,`${code} inputs`);assert(rs.length>0,`${code} rules`);
 for(const [id,d] of Object.entries(defs)){assert.strictEqual(d.required,false,`${code}/${id} required`);assert.notStrictEqual(d.demo_value,undefined,`${code}/${id} demo`);}
 const card=m.regimen_card;assert(card&&Array.isArray(card.contexts)&&card.contexts.length,`${code} card contexts`);contexts+=card.contexts.length;
 assert(card.contexts.some(c=>c.id===`${code}-head-neck`&&Number(c.cycle_length_days)>0),`${code} Head and Neck card context`);
 assert(sidecar.protocols.find(x=>x.id===data.protocol_id),`${code} sidecar`);
 if(newlyAdded.has(code)){newCount++;assert(entry.path.startsWith('protocols/head-neck/'),`${code} new file path`);assert.strictEqual(m.sactcheck_encoding_version,'0.46.0',`${code} encoding version`);}
}
assert.strictEqual(newCount,21);assert(inputs>=450,`inputs ${inputs}`);assert(rules>=350,`rules ${rules}`);assert(contexts>=45,`contexts ${contexts}`);
const by=c=>hn.find(x=>String(x.data.metadata.nccp_regimen_code).padStart(5,'0')===c).data;
assert.strictEqual(by('00552').treatment.planned_cycles,3);assert.strictEqual(by('00591').treatment.cycle_length_days,21);assert.strictEqual(by('00589').rule_engine.rules.find(r=>r.id==='ANC_LT1').action.type,'delay');
assert(by('00387').rule_engine.rules.some(r=>r.id==='ANC_1_149'&&r.when.value[0]===1));assert(by('00387').rule_engine.rules.some(r=>r.id==='CIS_RENAL_40_49'));
assert.strictEqual(by('00323').treatment.planned_cycles,3);assert(/weekly carboplatin chemoradiation/i.test(by('00323').treatment.duration_text));
assert(by('00903').rule_engine.rules.some(r=>r.id==='GC903_PLT_75_99'&&r.action.type==='consultant_review'));
assert(by('00893').rule_engine.rules.some(r=>r.id==='MTX_RENAL_20_49'&&r.action.type==='dose_reduce'));assert(by('00893').rule_engine.rules.some(r=>r.id==='MTX_RENAL_LT20'&&r.action.type==='contraindicated'));
assert(by('00696').rule_engine.rules.some(r=>r.id==='PC696_PLT_LT70'));assert(by('00696').input_definitions.paclitaxel_neuropathy_grade);
for(const c of ['00705','00706']){assert.strictEqual(by(c).treatment.planned_cycles,6);assert(by(c).input_definitions.tsh?.required===false);assert(by(c).rule_engine.rules.some(r=>r.id==='ICI_PNEUM_G2'));}
assert.strictEqual(by('00242').treatment.cycle_length_days,28);assert(by('00242').rule_engine.rules.some(r=>r.id==='VAN_QTC'));assert(by('00242').rule_engine.rules.some(r=>r.id==='VAN_RENAL'));
assert.strictEqual(by('00295').metadata.nccp_version,'6');assert(by('00295').input_definitions.systolic_bp);assert(by('00295').rule_engine.rules.some(r=>r.id==='TKI_BP_SYS'));
for(const c of ['00261','00419','00207','00385','00483','00484','00455','00558','00294']){assert(!by(c).metadata.tumour_group.includes('Head and Neck')||groups(by(c)).includes('Head and Neck'));assert(by(c).indications.some(i=>i.tumour_groups?.includes('Head and Neck')));}
const ctx={console};ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(root,'js/rule-engine.js'),'utf8'),ctx);vm.runInContext(fs.readFileSync(path.join(root,'js/assessment-engine.js'),'utf8'),ctx);const Engine=ctx.SACTCheckAssessmentEngine,RuleEngine=ctx.SACTCheckRuleEngine;let audited=0;
for(const {data} of hn){const profileId=Engine.getProfiles(data)[0]?.id||'default',defs=Engine.getInputDefinitions(data,profileId,{}),fields=new Set((data.rule_engine?.rules||[]).flatMap(r=>RuleEngine.collectConditionFields(RuleEngine.conditionFromRule(r)))),candidates=defs.filter(d=>d.visible!==false&&fields.has(d.id)&&demo(d)!=='');assert(candidates.length>0,`${data.protocol_id} no auditable input`);for(const d of candidates){const result=Engine.assess(data,{[d.id]:demo(d)},{profileId});assert(result.findings.length>0,`${data.protocol_id}/${d.id} no finding`);assert(!/insufficient data/i.test(String(result.status||'')));audited++;}}
assert(audited>=300,`single-entry checks ${audited}`);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');assert(html.includes('v0.50.3 · What changed?'));assert(html.includes('js/protocol-loader.js?v=0.50.3'));assert(html.includes('js/assessment-pdf.js?v=0.48.4'));
console.log(`v0.46.0 Head and Neck tests passed: ${hn.length} protocols, 21 new, ${inputs} inputs, ${rules} rules, ${audited} single-entry checks.`);
