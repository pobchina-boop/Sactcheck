'use strict';
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),Module=require('module');
const R=path.resolve(__dirname,'../../..'),mode=process.argv[2]||'proposed';let E=require(R+'/js/assessment-engine');
if(mode==='proposed'){const m=new Module(R+'/js/assessment-engine.js',module);m.filename=R+'/js/assessment-engine.js';m.paths=module.paths;m._compile(fs.readFileSync(__dirname+'/assessment-engine.proposed.js','utf8'),m.filename);E=m.exports;}
const base={schema_version:'2.0.0',protocol_id:'derived-test',metadata:{title:'Opt-in arithmetic test'},input_definitions:{baseline:{label:'Baseline',type:'number',min:0,max:2000},current:{label:'Current',type:'number',min:0,max:2000},delta:{label:'Calculated difference',type:'number',derived_value:{operation:'difference',fields:['current','baseline']},ui_derived_from:'current'},ratio:{label:'Calculated ratio',type:'number',derived_value:{operation:'ratio',fields:['current','baseline']},ui_derived_from:'current'}},rule_engine:{evaluation_mode:'highest_priority_triggered',rules:[{rule_id:'rise',field:'delta',operator:'>=',value:44,action:{type:'withhold',recommendation:'Review rise'}},{rule_id:'recovery',field:'ratio',operator:'>',value:1.1,action:{type:'withhold',recommendation:'Review recovery'}}]}};
function result(input,p=base){return E.assess(p,input)}
let n=0;function check(fn){fn();n++}
check(()=>{const defs=E.getInputDefinitions(base);assert(defs.some(x=>x.id==='baseline'));assert(defs.some(x=>x.id==='current'))});
check(()=>{const r=result({baseline:50.1,current:94.1});assert.equal(r.inputs.delta,44);assert(r.findings.some(x=>x.ruleId==='rise'))});
check(()=>{assert.equal(result({baseline:50.1,current:55.11}).inputs.ratio,1.1)});
check(()=>{assert.equal(result({baseline:100,current:80}).inputs.delta,-20)});
check(()=>{const r=result({baseline:100,current:144,delta:0,ratio:1});assert.equal(r.inputs.delta,44);assert.equal(r.inputs.ratio,1.44)});
check(()=>{const r=result({baseline:100,delta:100,ratio:2});assert.equal(r.inputs.delta,null);assert.equal(r.inputs.ratio,null)});
check(()=>{assert.equal(result({baseline:0,current:80}).inputs.ratio,null)});
check(()=>{const r=result({baseline:100,current:'NaN'});assert.equal(r.inputs.delta,null);assert.equal(r.inputs.ratio,null);assert(r.invalid.length)});
check(()=>{const r=result({baseline:100,current:2001});assert.equal(r.inputs.delta,null);assert.equal(r.inputs.ratio,null)});
check(()=>{const p=structuredClone(base);p.input_definitions.ratio.derived_value.operation='execute';assert.equal(result({baseline:100,current:144},p).inputs.ratio,null)});
check(()=>{const p=structuredClone(base);p.input_definitions.ratio.derived_value.fields=['delta','baseline'];assert.equal(result({baseline:100,current:144},p).inputs.ratio,null)});
check(()=>{const p=structuredClone(base);p.input_definitions.ratio.derived_value.fields=['missing','baseline'];assert.equal(result({baseline:100,current:144},p).inputs.ratio,null)});
check(()=>{const p=structuredClone(base);delete p.input_definitions.delta.derived_value;assert.equal(result({baseline:100,current:144,delta:12},p).inputs.delta,12,'Existing explicitly entered fields without opt-in metadata must retain their value')});
console.log(`Derived arithmetic ${mode}: ${n}/${n} guards passed; numeric inputs only, opt-in metadata, no chains or manual overrides.`);
