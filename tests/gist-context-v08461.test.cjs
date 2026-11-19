'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f)),json=f=>JSON.parse(read(f)),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
let active='genitourinary';globalThis.SACTCheckProtocolContext={activeTumourGroup:()=>active};
const A=require('../js/patient-asset-registry-v0810.js'),K=require('../js/regimen-knowledge-base.js'),index=json('protocols/index.json').protocols;
const protocol=c=>json(index.find(p=>p.path.includes('/'+c+'-')).path);
assert.deepEqual(protocol('00325').indications.map(i=>[i.indication_id,i.code]),[['00325-sarcoma','00325a'],['00325-gu','00325b']],'NCCP national codes must remain distinct from stable internal indication IDs');
for(const code of ['00325','00719','00244']){
 const p=protocol(code),object={...p,patient_context:'gist'};
 for(const context of ['gist','sarcoma'])assert.equal(A.relativePath(p,'guide',context),`patient/${code}/gist/guide.pdf`);
 for(const context of ['rcc','genitourinary','hcc','unknown'])assert.equal(A.relativePath(p,'guide',context),`patient/${code}/scope.html?asset=guide`);
 assert.equal(A.relativePath(p,'guide'),`patient/${code}/scope.html?asset=guide`);
 assert.equal(A.relativePath(object,'guide'),`patient/${code}/gist/guide.pdf`);
 assert.equal(A.relativePath(object,'guide','genitourinary'),`patient/${code}/scope.html?asset=guide`);
 assert.equal(K.contextIdForProtocol(object),'gist');assert.equal(K.contextIdForProtocol(object,''),'');assert.equal(K.contextIdForProtocol(object,'rcc'),'rcc');
 assert.equal(A.relativePath(p,'unregistered-asset','gist'),null);
}
for(const context of ['colorectal','gastrointestinal'])assert.equal(A.relativePath({...protocol('00244'),patient_context:'gist'},'guide',context),'patient/00244/guide.pdf');
active='sarcoma';assert.equal(K.contextIdForProtocol(protocol('00325')),'gist');active='genitourinary';
assert.deepEqual(A.bundleRoutes('00244'),['00244','00244/gist']);assert.deepEqual(A.bundleRoutes('00325'),['00325/gist']);assert.deepEqual(A.bundleRoutes('00719'),['00719/gist']);
const baseline=json('validation/sarcoma-v08461/baseline-v60-working-files.json');let protectedFiles=0;
for(const [f,b]of Object.entries(baseline))if(f==='data/patient-knowledge/00244.json'||f==='data/regimen-knowledge-base-v08434-addendum.json'||f.startsWith('patient/00244/')||f.startsWith('docs/patient/00244/')){assert.equal(sha(read(f)),b.sha256,'Protected colorectal bytes changed: '+f);protectedFiles++;}
assert(protectedFiles>26,'Preservation includes colorectal canonical files, mirrors and original knowledge source');
const redirect=read('404.html').toString().match(/<script>([\s\S]*?)<\/script>/)[1];
for(const code of ['00325','00719','00244']){let result;vm.runInNewContext(redirect,{location:{pathname:`/docs/patient/${code}/gist/guide.html`,replace:v=>result=v}});assert.equal(result,`/patient/${code}/gist/guide.pdf`);}
for(const code of ['00325','00719']){let result;vm.runInNewContext(redirect,{location:{pathname:`/docs/patient/${code}/guide.html`,replace:v=>result=v}});assert.equal(result,`/patient/${code}/scope.html?asset=guide`);}
async function main(){
 const previousFetch=globalThis.fetch;globalThis.fetch=async url=>({ok:true,json:async()=>json(url)});
 try{
  const payload=await K.load(),crc=json('data/regimen-knowledge-base-v08434-addendum.json').regimen_profiles.find(p=>p.protocol_id===protocol('00244').protocol_id);
  assert.deepEqual(payload.regimen_profiles.find(p=>p.protocol_id===crc.protocol_id),crc,'Context loading must not replace the CRC data entry');
  const merged=K.regimenProfileForProtocol(protocol('00244'),payload);assert.deepEqual(merged.context_profiles.map(p=>p.context_id),['colorectal','gist']);
  const {context_id,context_label,...preserved}=merged.context_profiles[0];assert.deepEqual(preserved,crc);
  for(const code of ['00325','00719'])assert.deepEqual(K.regimenProfileForProtocol(protocol(code),payload).context_profiles.map(p=>p.context_id),['gist']);
  let change;const target={innerHTML:'',querySelector:selector=>selector==='[data-regimen-info-context]'?{addEventListener:(_,fn)=>{change=fn;}}:null};
  const overlay={querySelector:selector=>selector==='[data-regimen-info-content]'?target:null,classList:{add(){},remove(){}}};
  globalThis.document={getElementById:id=>id==='regimenInformationOverlay'?overlay:null,body:{classList:{add(){},remove(){}}}};
  const norm=s=>String(s).replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&#039;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();
  const gist=merged.context_profiles.find(p=>p.context_id==='gist');
  K.open({...protocol('00244'),patient_context:'gist'});await Promise.resolve();assert(norm(target.innerHTML).includes(norm(gist.clinical_summary)));assert(!norm(target.innerHTML).includes(norm(crc.clinical_summary)));
  change({target:{value:'colorectal'}});assert(norm(target.innerHTML).includes(norm(crc.clinical_summary)));assert(!norm(target.innerHTML).includes(norm(gist.clinical_summary)));
  change({target:{value:''}});assert(!norm(target.innerHTML).includes(norm(crc.clinical_summary)));assert(!norm(target.innerHTML).includes(norm(gist.clinical_summary)));
  K.open({...protocol('00244'),patient_context:'rcc'});await Promise.resolve();assert(!norm(target.innerHTML).includes(norm(gist.clinical_summary)));assert(!norm(target.innerHTML).includes(norm(crc.clinical_summary)));
  for(const code of ['00325','00719']){const gistProfile=K.regimenProfileForProtocol(protocol(code),payload).context_profiles[0];K.open(protocol(code));await Promise.resolve();assert(!norm(target.innerHTML).includes(norm(gistProfile.clinical_summary)));K.open({...protocol(code),patient_context:'gist'});await Promise.resolve();assert(norm(target.innerHTML).includes(norm(gistProfile.clinical_summary)));}
  delete globalThis.document;
  console.log(`GIST context selection passed: explicit picker > object context > active group; unsupported contexts guarded; ${protectedFiles} CRC files preserved; rendered CRC/GIST knowledge stays separate.`);
 }finally{globalThis.fetch=previousFetch;delete globalThis.document;}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
