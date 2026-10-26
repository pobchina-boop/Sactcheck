'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const R=path.resolve(__dirname,'../..'),read=p=>JSON.parse(fs.readFileSync(path.join(R,p),'utf8')),E=require(R+'/js/assessment-engine'),D=require(R+'/js/protocol-dose-schedule');
let stats={},issues=[];const count=k=>stats[k]=(stats[k]||0)+1;
for(const entry of read('protocols/index.json').protocols){
 const p=read(entry.path),code=p.metadata.nccp_regimen_code,b=E.assess(p,{});count('protocols');assert.notEqual(b.actionType,'proceed');assert(!b.complete);assert(!b.evaluation?.errors?.length);
 for(const def of b.definitions){if(def.visible===false||def.derived_value)continue;
  let bad=def.type==='number'?['not-a-number','Infinity',true,[],{},...(def.min!==undefined?[Number(def.min)-1]:[]),...(def.max!==undefined?[Number(def.max)+1]:[])]:def.type==='boolean'?['invalid-boolean',1,[],{}]:def.type==='select'?['invalid-option',[],{}]:[];
  for(const value of bad){count('invalid_'+def.type);const a=E.assess(p,{[def.id]:value});if(!a.invalid?.some(x=>x.id===def.id))issues.push({code,field:def.id,value,action:a.actionType});}
  if(def.type==='number'){count('blank_numeric');const a=E.assess(p,{[def.id]:'   '});assert.equal(a.inputs[def.id],null,code+'/'+def.id);}
 }
}
const index=read('protocols/index.json'),p=read(index.protocols.find(x=>x.path.includes('/00568-')).path);
let model=D.buildModel(p);assert.equal(model.phases.length,2);assert.equal(model.phases[0].components.length,3);assert.equal(model.phases[1].components.length,2);
const broken=structuredClone(p);broken.treatment_phases[0].administration.pop();assert.equal(D.buildModel(broken).phases.length,1,'Incomplete induction excluded, complete maintenance retained');
const empty=structuredClone(p);empty.treatment_phases[1].active_drugs=[];assert.equal(D.buildModel(empty).phases.length,1,'Empty declared phase does not validate');
for(const code of ['00526','00798']){
 const q=read(index.protocols.find(x=>x.path.includes('/'+code+'-')).path),a=E.assess(q,{treatment_phase:'invalid-option',anc:0.4});
 assert.equal(a.actionType,'withhold',code+': invalid phase cannot erase known severe neutropenia');assert(a.invalid.some(x=>x.id==='treatment_phase'));assert(!a.complete);assert(a.findings.some(x=>x.ruleId==='ANC_LT05'));
}
fs.writeFileSync(path.join(__dirname,'engine-audit.json'),JSON.stringify({stats,issues,phase_checks:3,invalid_phase_urgent_hold_checks:2},null,2)+'\n');assert.deepEqual(issues,[]);console.log(stats,'; malformed values rejected, urgent holds preserved and phase completeness checks passed');
