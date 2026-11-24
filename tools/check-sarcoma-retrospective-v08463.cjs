'use strict';
// Five previous-batch suites: 97/100 retained primary passes + three adjudicated
// severity mismatches, and 18/18 phase-cue assertions over 15 further inputs.
const fs=require('fs'),path=require('path'),os=require('os'),crypto=require('crypto'),assert=require('assert/strict'),cp=require('child_process');
const root=path.resolve(__dirname,'..'),home=path.join(root,'validation/sarcoma-v08463/retrospective-review'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const row of fs.readFileSync(path.join(home,'RELEASE-SHA256SUMS'),'utf8').trim().split('\n')){
 const m=/^([a-f0-9]{64})  (.+)$/.exec(row);assert.ok(m,'Malformed retrospective checksum');const file=path.resolve(home,m[2]);assert.ok(file.startsWith(home+path.sep),'Evidence path escapes its directory');assert.equal(hash(fs.readFileSync(file)),m[1],'Retrospective evidence changed: '+m[2]);
}
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'sactcheck-retrospective-v08463-'));
try{
 const primary=path.join(temporary,'primary.json'),supplement=path.join(temporary,'supplement.json');
 function run(script,args,status){const r=cp.spawnSync(process.execPath,[path.join(home,script),...args],{cwd:root,encoding:'utf8',timeout:20000,maxBuffer:8*1024*1024});assert.ifError(r.error);assert.equal(r.status,status,'Unexpected replay status: '+script+'\n'+r.stderr+'\n'+r.stdout);return r;}
 run('run-audits.cjs',['--current',root,'--output',primary],1);
 run('phase-cue-supplement.cjs',['--current',root,'--output',supplement],0);
 const gate=run('verify-current-result.cjs',[primary,supplement],0);const classification=JSON.parse(gate.stdout);
 console.log(JSON.stringify({check:'v08463_fresh_retrospective_classification',...classification,application_current_replay:true},null,2));
}finally{fs.rmSync(temporary,{recursive:true,force:true});}
