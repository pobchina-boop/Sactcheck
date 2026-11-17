'use strict';
// Fail before historical regression attempts thousands of lazy blob downloads.
// This checks availability only; all existing provenance assertions still run.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const ROOT=path.resolve(__dirname,'..');
function parseTree(buffer){
 let entries=0,missing=0;
 for(const line of buffer.toString().split('\0').filter(Boolean)){
  const m=line.match(/^[0-9]{6} (?:blob|tree|commit) [a-f0-9]{40} +([0-9]+|-|BAD)\t[\s\S]+$/);
  if(!m)throw Error('Unrecognised historical Git tree output');
  entries++;if(m[1]==='BAD')missing++;
 }
 if(!entries)throw Error('Empty historical Git tree');
 return{entries,missing};
}
function run(root=ROOT){
 const helpers=path.join(root,'tests/helpers'),commits=new Set();
 for(const f of fs.readdirSync(helpers).filter(f=>/^retrospective-v\d+\.cjs$/.test(f))){
  const s=fs.readFileSync(path.join(helpers,f),'utf8');
  for(const m of s.matchAll(/BASE_COMMIT\s*=\s*['"]([a-f0-9]{40})['"]/g))commits.add(m[1]);
 }
 if(!commits.size)throw Error('No pinned historical commits found');
 const results=[];
 for(const commit of commits){
  const r=cp.spawnSync('git',['ls-tree','-rlz',commit],{cwd:root,env:{...process.env,GIT_NO_LAZY_FETCH:'1',GIT_TERMINAL_PROMPT:'0'},timeout:30000,maxBuffer:64*1024*1024});
  if(r.error||r.status!==0)throw Error('Historical Git availability check failed for '+commit+': '+(r.error?.code||'exit '+r.status));
  const counts=parseTree(r.stdout);results.push({commit,...counts});
  if(counts.missing){
   console.error('BLOCKED: '+counts.missing+' historical Git entries are unavailable at '+commit+'. Use a full checkout with historical blobs, then rerun the unchanged regression gates. No lazy downloads were attempted.');
   console.error(JSON.stringify(results));return 2;
  }
 }
 console.log('Historical Git availability passed for '+results.length+' pinned commits; provenance assertions still required.');return 0;
}
if(require.main===module){try{process.exitCode=run();}catch(e){console.error('BLOCKED: '+e.message);process.exitCode=2;}}
module.exports={parseTree,run};
