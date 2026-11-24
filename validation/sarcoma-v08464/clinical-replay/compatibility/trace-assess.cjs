'use strict';
// Observation-only; delegates unchanged inputs to the unchanged actual engine.
const fs=require('node:fs'),path=require('node:path');
const ep=path.join(process.env.REPLAY_RUNTIME,'js/assessment-engine.js');
const original=require(ep),D=require(path.join(process.env.REPLAY_RUNTIME,'js/protocol-dose-schedule.js')),calls=[];
require.cache[require.resolve(ep)].exports={...original,assess(...args){
 const result=original.assess(...args);
 const m=D.buildModificationModel(args[0],result);
 calls.push(JSON.parse(JSON.stringify({index:calls.length,protocol_id:args[0].protocol_id,input:args[1],observed:{actionType:result.actionType,complete:result.complete,coverageComplete:result.coverageComplete,invalid:result.invalid,errors:result.errors,findings:result.findings.map(f=>({ruleId:f.ruleId,domainAssessment:f.domainAssessment,actionType:f.actionType,action:f.action})),doseRows:m.rows}})));
 return result;
}};
process.on('exit',()=>fs.writeFileSync(process.env.REPLAY_TRACE,JSON.stringify(calls,null,2)+'\n'));
