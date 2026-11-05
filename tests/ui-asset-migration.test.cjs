'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),cp=require('node:child_process'),test=require('node:test');
const root=path.resolve(__dirname,'..'),record=JSON.parse(fs.readFileSync(path.join(root,'validation/ui-usability-fixes-20261105/ui-asset-hashes.json'),'utf8'));
const {createMigration,expectedHash}=require('./helpers/ui-accessibility-migration.cjs');
const sha=content=>crypto.createHash('sha256').update(content).digest('hex');
const before=sha('Original reviewed document'),after=sha('Reviewed accessible document'),file='patient/00555/supportive-care.html';
const sharedAssets=['assets/patient/phase-support-v0838.js','assets/patient/consent-discussion.js','assets/patient/consent-form-v0819.css','assets/patient/complete-pathways-v0830.css'];
const fixture=entries=>({schema_version:1,baseline_commit:'a'.repeat(40),files:entries||[{file,before,after}]});
let baselineReady;
function requireBaselineHistory(){
 if(!baselineReady)baselineReady=new Promise((resolve,reject)=>{
  const git=cp.spawn('git',['cat-file','-e',record.baseline_commit+'^{commit}'],{cwd:root,stdio:['ignore','ignore','pipe']});let stderr='';git.stderr.on('data',chunk=>{stderr+=chunk});git.once('error',reject);
  git.once('close',code=>code===0?resolve():reject(Error(`UI migration provenance requires Git history containing baseline ${record.baseline_commit}. Fetch that commit or use actions/checkout with fetch-depth: 0 before running this test; a source archive cannot prove the recorded before hashes. ${stderr.trim()}`)));
 });
 return baselineReady;
}

test('only explicit original or already migrated hashes advance; untouched expectations remain exact',()=>{
 const migrate=createMigration(fixture());
 assert.equal(migrate(file,before),after);assert.equal(migrate(file,after),after);
 assert.throws(()=>migrate(file,sha('Unreviewed old document')),/Unexpected UI asset migration original hash/);
 const untouched='patient/00555/guide.pdf';assert.equal(migrate(untouched,before),before);
 assert.equal(migrate('protocols/index.json',before),before);
});

test('rejects unsafe, out-of-scope, duplicate and invalid migration records',()=>{
 for(const bad of ['../patient/00555/knowledge.html','/patient/00555/knowledge.html','patient/00555/../knowledge.html','patient\\00555\\knowledge.html','patient//00555/knowledge.html','patient/00555/guide.pdf','patient/00555/sactcard.pdf','patient/00555/qr.png','data/patient-knowledge/00555.json','protocols/index.json','assets/patient/patient-knowledge.js','assets/patient/phase-support-v0838.js.map','assets/patient/../patient/consent-discussion.js'])assert.throws(()=>createMigration(fixture([{file:bad,before,after}])),/Unapproved UI asset migration path/,bad);
 assert.throws(()=>createMigration(fixture([{file,before,after},{file,before,after}])),/Duplicate UI asset migration/);
 assert.throws(()=>createMigration(fixture([{file,before:'not-a-sha',after}])) ,/Invalid UI asset migration hashes/);
 assert.throws(()=>createMigration(fixture([{file,before,after:before}])) ,/Invalid UI asset migration hashes/);
 assert.throws(()=>createMigration({...fixture(),baseline_commit:'main'}),/Invalid reviewed UI asset migration record/);
 assert.throws(()=>createMigration(fixture([])),/Invalid reviewed UI asset migration record/);
 const migrate=createMigration(fixture());assert.throws(()=>migrate('../'+file,before),/Unsafe UI asset migration lookup/);
});

test('shared source exceptions are explicit and require their exact reviewed hash transition',()=>{
 for(const shared of sharedAssets){const migrate=createMigration(fixture([{file:shared,before,after}]));assert.equal(migrate(shared,before),after);assert.equal(migrate(shared,after),after);assert.throws(()=>migrate(shared,sha('Unreviewed control')),/Unexpected UI asset migration original hash/);}
});

test('strict file assertions detect subsequent mutations of registered and unregistered assets',t=>{
 const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'sactcheck-ui-migration-'));t.after(()=>fs.rmSync(temporary,{recursive:true,force:true}));
 const migrate=createMigration(fixture()),registered=path.join(temporary,'reviewed.html'),unregistered=path.join(temporary,'untouched.pdf');
 fs.writeFileSync(registered,'Reviewed accessible document');fs.writeFileSync(unregistered,'Original reviewed document');
 const verify=(actual,asset,original)=>assert.equal(sha(fs.readFileSync(actual)),migrate(asset,original));
 verify(registered,file,before);verify(unregistered,'patient/00555/guide.pdf',before);
 fs.appendFileSync(registered,' Unreviewed mutation');fs.appendFileSync(unregistered,' Unreviewed mutation');
 assert.throws(()=>verify(registered,file,before),assert.AssertionError);
 assert.throws(()=>verify(unregistered,'patient/00555/guide.pdf',before),assert.AssertionError);
 assert.equal(migrate(file,before),after,'Current bytes never replace the registered expected hash');
});

test('all reviewed current assets match explicit after hashes and the exact published diff scope',async()=>{
 await requireBaselineHistory();
 assert.ok(record.evidence.length);for(const evidence of record.evidence)assert.ok(fs.existsSync(path.join(root,evidence)),evidence);
 const git=cp.spawn('git',['diff','--name-only','-z',record.baseline_commit,'--','patient','docs/patient',...sharedAssets],{cwd:root,stdio:['ignore','pipe','pipe']});
 const finished=new Promise(resolve=>git.once('close',resolve));let output='',stderr='';git.stdout.setEncoding('utf8');git.stderr.setEncoding('utf8');git.stdout.on('data',chunk=>{output+=chunk});git.stderr.on('data',chunk=>{stderr+=chunk});
 assert.equal(await finished,0,stderr);const changed=output.split('\0').filter(Boolean).sort();
 assert.deepEqual(record.files.map(entry=>entry.file).sort(),changed,'The migration cannot silently add or omit a changed patient asset');
 for(const entry of record.files){
  assert.equal(sha(fs.readFileSync(path.join(root,entry.file))),expectedHash(entry.file,entry.before),entry.file);
  assert.equal(expectedHash(entry.file,entry.after),entry.after,'Idempotent '+entry.file);
 }
});

test('every before hash is proven against the recorded Git baseline bytes',async()=>{
 await requireBaselineHistory();
 const git=cp.spawn('git',['cat-file','--batch'],{cwd:root,stdio:['pipe','pipe','pipe']});
 const finished=new Promise(resolve=>git.once('close',resolve));let stderr='';git.stderr.on('data',chunk=>{stderr+=chunk});
 git.stdin.end(record.files.map(entry=>`${record.baseline_commit}:${entry.file}`).join('\n')+'\n');
 let header=Buffer.alloc(0),remaining=0,digest=null,index=0,state='header';
 try{
  for await(const chunk of git.stdout){
   let offset=0;
   while(offset<chunk.length){
    if(state==='header'){
     const newline=chunk.indexOf(10,offset);
     if(newline<0){header=Buffer.concat([header,chunk.subarray(offset)]);break;}
     header=Buffer.concat([header,chunk.subarray(offset,newline)]);offset=newline+1;
     const match=header.toString('utf8').match(/^[a-f0-9]{40} blob (\d+)$/);assert.ok(match,'Missing baseline blob '+record.files[index]?.file);
     remaining=Number(match[1]);digest=crypto.createHash('sha256');header=Buffer.alloc(0);state=remaining?'body':'newline';
    }else if(state==='body'){
     const length=Math.min(remaining,chunk.length-offset);digest.update(chunk.subarray(offset,offset+length));remaining-=length;offset+=length;
     if(!remaining)state='newline';
    }else{
     assert.equal(chunk[offset++],10,'Git blob delimiter');
     assert.equal(digest.digest('hex'),record.files[index].before,record.files[index].file+' baseline');index++;state='header';
    }
   }
  }
  assert.equal(await finished,0,stderr);assert.equal(index,record.files.length);assert.equal(state,'header');assert.equal(header.length,0);
 }finally{if(git.exitCode===null)git.kill();}
});

test('final retrospective helper retains its historical approvals and applies the UI migration last',()=>{
 const historical=JSON.parse(fs.readFileSync(path.join(root,'validation/colorectal-v08433/retrospective-hashes.json'),'utf8'));
 const final=require('./helpers/retrospective-v08433.cjs');
 for(const entry of record.files){const earlier=historical.files[entry.file];assert.equal(final.expectedHash(entry.file,earlier?earlier.before:entry.before),entry.after,entry.file);}
 const historicalFile=Object.keys(historical.files)[0];assert.throws(()=>final.expectedHash(historicalFile,'0'.repeat(64)),/Unexpected v33 original hash/);
});
