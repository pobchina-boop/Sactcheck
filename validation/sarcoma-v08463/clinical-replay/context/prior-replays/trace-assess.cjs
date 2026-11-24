'use strict';
// Observation-only preload: delegates every call to the actual unchanged engine.
const fs=require('node:fs'),path=require('node:path');
const enginePath=path.join(process.env.REPLAY_RUNTIME,'js/assessment-engine.js');
const original=require(enginePath),calls=[];
require.cache[require.resolve(enginePath)].exports={...original,assess(...args){
  const result=original.assess(...args);
  calls.push({index:calls.length,protocol_id:args[0].protocol_id,input:args[1],
    observed:{actionType:result.actionType,complete:result.complete,coverageComplete:result.coverageComplete,
      invalid:result.invalid,errors:result.errors,
      findings:result.findings.map(f=>({ruleId:f.ruleId,domainAssessment:f.domainAssessment,
        actionType:f.actionType,action:f.action}))}});
  return result;
}};
process.on('exit',()=>fs.writeFileSync(process.env.REPLAY_TRACE,JSON.stringify(calls,null,2)+'\n'));
