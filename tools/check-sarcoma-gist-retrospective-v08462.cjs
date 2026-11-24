'use strict';
// Classification gate: 81 real clinical case passes and one preserved, adjudicated cue mismatch.
const fs=require('fs'),path=require('path'),os=require('os'),crypto=require('crypto'),assert=require('assert/strict'),cp=require('child_process');
const root=path.resolve(__dirname,'..'),home=path.join(root,'validation/sarcoma-v08462/retrospective-review');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const row of fs.readFileSync(path.join(home,'SHA256SUMS'),'utf8').trim().split('\n')){
 const match=/^([a-f0-9]{64})  (.+)$/.exec(row);assert.ok(match,'Malformed retrospective checksum');
 const file=path.resolve(home,match[2]);assert.ok(file.startsWith(home+path.sep),'Checksum path must remain in evidence directory');
 assert.equal(hash(fs.readFileSync(file)),match[1],'Preserved retrospective evidence changed: '+match[2]);
}
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'sactcheck-retrospective-v08462-'));
try{
 const output=path.join(temporary,'current-results.json');
 const replay=cp.spawnSync(process.execPath,[path.join(home,'run-audits.cjs'),'--current',root,'--output',output],{cwd:root,encoding:'utf8',timeout:30000});
 assert.ifError(replay.error);assert.equal(replay.status,1,'Expected preserved81/82 result; any changed status requires new adjudication. '+replay.stderr);
 const gate=cp.spawnSync(process.execPath,[path.join(home,'verify-adjudicated-result.cjs'),output],{cwd:root,encoding:'utf8',timeout:30000});
 assert.ifError(gate.error);assert.equal(gate.status,0,'Retrospective result/classification changed: '+gate.stderr);
 const report=JSON.parse(fs.readFileSync(output));
 console.log(JSON.stringify({check:'v08462_retrospective_classification',status:'passed',suites:5,clinical_cases:82,actual_passes:81,preserved_failed_expectations:1,deferred_conservative_cue:'00719-13',source_mandated_dose_action_defect_demonstrated:false,clinical_approval:false,pharmacy_approval:false,protocols:report.protocols},null,2));
}finally{fs.rmSync(temporary,{recursive:true,force:true});}
