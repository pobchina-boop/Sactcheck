'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const H=require('./head-neck-grading-v08445.cjs');
const root=path.resolve(__dirname,'../../../..');
function walk(p){return fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(p,e.name)):[path.join(p,e.name)]);}
const patches=JSON.parse(fs.readFileSync(path.join(__dirname,'grading-metadata-proposal.json'),'utf8'));
const context={window:{}};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(root,'js/ctcae-descriptors.js'),'utf8'),context);const ctcae=context.window.SACTCheckCTCAE;
const protocols=walk(path.join(root,'protocols')).filter(p=>p.endsWith('.json')).map(file=>{try{return {file,data:JSON.parse(fs.readFileSync(file,'utf8'))};}catch{return null;}}).filter(x=>x&&H.applies(x.data));
let fieldCount=0;
for(const {data} of protocols){
 const code=String(data.metadata.nccp_regimen_code);const before=JSON.stringify(data.rule_engine);const patch=patches[code];
 for(const [field,change]of Object.entries(patch?.input_definitions||{})){
  const d=data.input_definitions[field],values=d.options.map(o=>o.value);
  for(const key of change.remove)delete d[key];Object.assign(d,change.set);
  assert.deepEqual(d.options.map(o=>o.value),values,`${code}/${field}: grading metadata must not change selected values`);
 }
 H.validateProtocol(data,ctcae);fieldCount+=H.fields(H.scope[code]).length;
 assert.equal(JSON.stringify(data.rule_engine),before,`${code}: grading metadata must not alter decision rules`);
}
const result={protocols:protocols.length,grading_fields:fieldCount,negative_checks:H.negativeChecks(protocols,ctcae),metadata_proposals:Object.keys(patches),clinical_rules_unchanged:true};
assert.equal(result.protocols,10);console.log(JSON.stringify(result,null,2));
fs.writeFileSync(path.join(__dirname,'grading-proposal-results.json'),JSON.stringify(result,null,2)+'\n');
