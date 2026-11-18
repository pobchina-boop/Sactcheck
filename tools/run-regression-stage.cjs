'use strict';
// Archive fresh test output separately; preserve the committed historical evidence.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process'),crypto=require('node:crypto');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function runStage({root,command,reportPaths,artifactRoot}){
 if(!command.length)throw Error('A command is required');
 const originals=new Map();
 for(const rel of reportPaths){
  if(path.isAbsolute(rel)||rel.includes('\\')||rel.split('/').some(x=>!x||x==='.'||x==='..'))throw Error('Unsafe report path');
  const file=path.join(root,rel);
  if(fs.existsSync(file)&&!fs.lstatSync(file).isFile())throw Error('Report must be a regular file: '+rel);
  originals.set(rel,fs.existsSync(file)?fs.readFileSync(file):null);
 }
 fs.mkdirSync(artifactRoot,{recursive:true});
 const directory=fs.mkdtempSync(path.join(artifactRoot,'stage-'));
 const started=new Date().toISOString();let result;
 try{result=cp.spawnSync(command[0],command.slice(1),{cwd:root,stdio:'inherit',env:process.env});}
 finally{
  const changed=[];
  for(const[rel,before]of originals){
   const file=path.join(root,rel),after=fs.existsSync(file)?fs.readFileSync(file):null;
   if(before===null&&after===null||before&&after&&before.equals(after))continue;
   if(after){const destination=path.join(directory,rel);fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,after);}
   changed.push({path:rel,before_sha256:before&&sha(before),after_sha256:after&&sha(after),deleted_by_stage:after===null});
   if(before===null)fs.rmSync(file,{force:true});else{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,before);}
  }
  fs.writeFileSync(path.join(directory,'stage.json'),JSON.stringify({command,started,finished:new Date().toISOString(),exit_code:result?.status??null,signal:result?.signal??null,error:result?.error?.message??null,restored_reports:changed},null,2)+'\n');
  console.log('Regression evidence: '+directory+'; '+changed.length+' generated reports archived and original bytes restored.');
 }
 if(result.error)throw result.error;
 return result.status===null?1:result.status;
}
if(require.main===module){
 const root=path.resolve(__dirname,'..'),command=process.argv.slice(2);if(command[0]==='--')command.shift();
 process.exitCode=runStage({root,command,reportPaths:require('./regression-report-paths.json'),artifactRoot:process.env.SACT_REGRESSION_REPORT_DIR||path.join(process.env.RUNNER_TEMP||os.tmpdir(),'sactcheck-regression-reports')});
}
module.exports={runStage};
