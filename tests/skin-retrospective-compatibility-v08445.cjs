'use strict';
// Replays the pinned v40 clinical scenarios unchanged. The two documented
// endocrine restart inputs gain only explicit negative permanent-stop history.
// The independent v45 cases separately test missing and positive history.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),vm=require('node:vm'),{createRequire}=require('node:module');
const repo=process.env.SACTCHECK_REPO||path.resolve(__dirname,path.basename(__dirname)==='tests'?'..':'../../..');
const audit=path.join(repo,'validation/head-neck-v08445/retro-immune');
const source=path.join(repo,'validation/skin-melanoma-v08440/retrospective-source-audit/source-cases.cjs');
const historicReport=path.join(path.dirname(source),'source-case-results-candidate.json');
const output=path.join(audit,'retained-v40-integrated-results.json');
const pinnedSourceSHA='ca650898e2d287affe381ef36ba6462cc174f5919cfe7999b5105c01a17ff28a';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const code=fs.readFileSync(source,'utf8'),sourceBefore=hash(Buffer.from(code)),reportBefore=hash(fs.readFileSync(historicReport));
assert.equal(sourceBefore,pinnedSourceSHA,'The immutable source-case script must match its original v40 SHA');
const originalInput={pembro_restart_requested:true,pembro_source_recovery_complete:true,pembro_steroid_management_complete:true,pembro_consultant_restart_approved:true,endocrine_status:'controlled_after_severe'};
const requireSource=createRequire(source),enginePath=requireSource.resolve(path.join(repo,'js/assessment-engine'));
const originalEngine=requireSource(enginePath),adapted=[],writes=[];
function isExactInput(input){
 if(!input||Object.keys(input).length!==Object.keys(originalInput).length)return false;
 return Object.entries(originalInput).every(([key,value])=>Object.hasOwn(input,key)&&input[key]===value);
}
const engine={...originalEngine,assess(protocol,input,...rest){
 const regimen=protocol?.metadata?.nccp_regimen_code;
 if(['00455','00558'].includes(regimen)&&protocol?.metadata?.clinical_audit_release==='0.84.45'&&isExactInput(input)){
  assert(!adapted.includes(regimen),'Only one exact historical fixture per pembrolizumab protocol may be adapted');adapted.push(regimen);
  return originalEngine.assess(protocol,{...input,pembro_prior_permanent_stop:false},...rest);
 }
 return originalEngine.assess(protocol,input,...rest);
}};
const wrappedFs={...fs,writeFileSync(target,data,...args){
 assert.equal(path.resolve(String(target)),historicReport,'Historical replay may only write its one candidate report');
 writes.push(output);return fs.writeFileSync(output,data,...args);
}};
function scopedRequire(specifier){
 if(specifier==='node:fs'||specifier==='fs')return wrappedFs;
 if(requireSource.resolve(specifier)===enginePath)return engine;
 return requireSource(specifier);
}
const localModule={exports:{}},captured=[];
// compileFunction uses the current context so strict assertions see ordinary
// objects; runInNewContext would introduce unrelated cross-realm prototypes.
const run=vm.compileFunction(code,['require','module','exports','__filename','__dirname','process','console'],{filename:source});
run(scopedRequire,localModule,localModule.exports,source,path.dirname(source),process,{...console,log:(...args)=>captured.push(args.map(String).join(' '))});
assert.deepEqual(adapted.sort(),['00455','00558'],'Exactly the two known endocrine-restart fixtures are adapted');
assert.equal(writes.length,1);assert.equal(hash(fs.readFileSync(source)),sourceBefore,'Historical source bytes unchanged');assert.equal(hash(fs.readFileSync(historicReport)),reportBefore,'Historical report bytes unchanged');
const result=JSON.parse(fs.readFileSync(output));assert.equal(result.total,183);assert.equal(result.passed,183);assert.equal(result.failed,0);assert(result.cases.every(x=>x.pass));
const replay={release:'0.84.45',historical_release:'0.84.40',source_sha256:sourceBefore,historical_result_sha256:reportBefore,source_and_report_unchanged:true,adaptations:adapted.map(regimen=>({regimen,original_input:originalInput,added_context:{pembro_prior_permanent_stop:false},reason:'v45 requires explicitly assessed prior permanent-stop history; original endocrine expected actions stay unchanged'})),total:183,passed:183,failed:0,output:path.relative(repo,output),clinical_use_authorised:false};
fs.writeFileSync(path.join(audit,'retained-v40-compatibility-verification.json'),JSON.stringify(replay,null,2)+'\n');
console.log('v0.84.45 retained v40 replay:183/183 original cases pass; exactly2 explicit-history adaptations; immutable source/report preserved.');
