'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),cp=require('node:child_process'),test=require('node:test');
const root=path.resolve(__dirname,'..'),record=JSON.parse(fs.readFileSync(path.join(root,'validation/ui-usability-fixes-20261105/ui-asset-hashes.json'),'utf8'));
const {createMigration,expectedHash}=require('./helpers/ui-accessibility-migration.cjs');
const v34=require('./helpers/retrospective-v08434.cjs');
const historicalUIHash=createMigration(record);
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

test('historical UI assets match the exact published diff through the v34 baseline; current assets follow the reviewed chain',async()=>{
 await requireBaselineHistory();
 assert.ok(record.evidence.length);for(const evidence of record.evidence)assert.ok(fs.existsSync(path.join(root,evidence)),evidence);
 const git=cp.spawn('git',['diff','--name-only','-z',record.baseline_commit,v34.BASE_COMMIT,'--','patient','docs/patient',...sharedAssets],{cwd:root,stdio:['ignore','pipe','pipe']});
 const finished=new Promise(resolve=>git.once('close',resolve));let output='',stderr='';git.stdout.setEncoding('utf8');git.stderr.setEncoding('utf8');git.stdout.on('data',chunk=>{output+=chunk});git.stderr.on('data',chunk=>{stderr+=chunk});
 assert.equal(await finished,0,stderr);const changed=output.split('\0').filter(Boolean).sort();
 assert.deepEqual(record.files.map(entry=>entry.file).sort(),changed,'The migration cannot silently add or omit a changed patient asset');
 for(const entry of record.files){
  assert.equal(sha(fs.readFileSync(path.join(root,entry.file))),expectedHash(entry.file,entry.before),entry.file);
  assert.equal(historicalUIHash(entry.file,entry.after),entry.after,'Historical UI idempotence '+entry.file);
  assert.equal(expectedHash(entry.file,entry.after),v34.expectedHash(entry.file,entry.after),'Chained current expectation '+entry.file);
  assert.equal(sha(cp.execFileSync('git',['show',v34.BASE_COMMIT+':'+entry.file],{cwd:root,maxBuffer:64*1024*1024})),entry.after,'Published UI bytes at v34 baseline '+entry.file);
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

test('final retrospective helper retains historical approvals and applies UI then the explicit v34 migration',()=>{
 const historical=JSON.parse(fs.readFileSync(path.join(root,'validation/colorectal-v08433/retrospective-hashes.json'),'utf8'));
 const final=require('./helpers/retrospective-v08433.cjs');
 for(const entry of record.files){const earlier=historical.files[entry.file];assert.equal(final.expectedHash(entry.file,earlier?earlier.before:entry.before),v34.expectedHash(entry.file,entry.after),entry.file);}
 const historicalFile=Object.keys(historical.files)[0];assert.throws(()=>final.expectedHash(historicalFile,'0'.repeat(64)),/Unexpected v33 original hash/);
});

const v34Fixture=files=>({schema_version:1,base_commit:v34.BASE_COMMIT,codes:v34.CODES,files:files||{'patient/00328/guide.pdf':{before,after}}});
test('v34 migration is restricted to the exact clinical and context paths, and validates original hashes',()=>{
 const migrate=v34.createMigration(v34Fixture());
 assert.equal(migrate('patient/00328/guide.pdf',before),after);
 assert.equal(migrate('patient/00328/guide.pdf',after),after);
 assert.throws(()=>migrate('patient/00328/guide.pdf',sha('Unreviewed input')),/Unexpected v34 original hash/);
 assert.equal(migrate('patient/00555/guide.pdf',before),before);
 for(const bad of ['../patient/00328/guide.pdf','/patient/00328/guide.pdf','patient/00328/../guide.pdf','patient//00328/guide.pdf','patient\\00328\\guide.pdf','patient/00328/guide.pdf\0','patient/00212/guide.pdf','patient/00215/lung/guide.pdf','docs/patient/00214/scope.html','patient/00244/lung/guide.pdf','patient/00328/evil.js','patient/00555/guide.pdf','data/patient-knowledge/00214.json','protocols/gastrointestinal/00328-unapproved.json','assets/patient/complete-pathways-v0830.css'])assert.throws(()=>v34.createMigration(v34Fixture({[bad]:{before,after}})),/Unapproved v34 migration path/,bad);
 for(const approved of ['patient/00212/scope.html','patient/00214/colorectal/guide.pdf','docs/patient/00215/colorectal/handbook.pdf','data/patient-knowledge-contexts/00212/colorectal.json','data/patient-knowledge/00244.json','protocols/index.json'])assert.equal(v34.createMigration(v34Fixture({[approved]:{before,after}}))(approved,before),after);
 assert.throws(()=>v34.createMigration({...v34Fixture(),base_commit:'a'.repeat(40)}),/Invalid reviewed v34/);
 assert.throws(()=>v34.createMigration({...v34Fixture(),codes:[...v34.CODES,'00555']}),/Invalid reviewed v34/);
 assert.throws(()=>v34.createMigration(v34Fixture({})),/Invalid reviewed v34/);
 assert.throws(()=>v34.createMigration(v34Fixture({'patient/00328/guide.pdf':{before,after:before}})),/Invalid v34 migration hashes/);
 assert.throws(()=>v34.createMigration(v34Fixture({'patient/00328/guide.pdf':{before:'invalid',after}})),/Invalid v34 migration hashes/);
 assert.throws(()=>migrate('../patient/00328/guide.pdf',before),/Unsafe v34 migration lookup/);
 const added=v34.createMigration(v34Fixture({'patient/00244/guide.pdf':{before:null,after}}));assert.equal(added('patient/00244/guide.pdf',null),after);assert.throws(()=>added('patient/00244/guide.pdf',before),/Unexpected v34 original hash/);
});

test('v34 expected hashes detect mutations of reviewed and unrelated files',t=>{
 const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'sactcheck-v34-migration-'));t.after(()=>fs.rmSync(temporary,{recursive:true,force:true}));
 const migrate=v34.createMigration(v34Fixture());const registered=path.join(temporary,'reviewed.pdf'),untouched=path.join(temporary,'untouched.pdf');
 fs.writeFileSync(registered,'Reviewed accessible document');fs.writeFileSync(untouched,'Original reviewed document');
 const verify=(actual,file)=>assert.equal(sha(fs.readFileSync(actual)),migrate(file,before));
 verify(registered,'patient/00328/guide.pdf');verify(untouched,'patient/00555/guide.pdf');
 fs.appendFileSync(registered,'mutation');fs.appendFileSync(untouched,'mutation');
 assert.throws(()=>verify(registered,'patient/00328/guide.pdf'),assert.AssertionError);assert.throws(()=>verify(untouched,'patient/00555/guide.pdf'),assert.AssertionError);
});

test('v34 manifest proves before/after bytes and covers the complete affected asset diff without unrelated changes',()=>{
 const migrationRecord=JSON.parse(fs.readFileSync(v34.RECORD,'utf8'));v34.createMigration(migrationRecord);
 const domains=['patient','docs/patient','data/patient-knowledge','data/patient-knowledge-contexts','protocols'];
 const changed=cp.execFileSync('git',['diff','--name-only','-z',v34.BASE_COMMIT,'--',...domains],{cwd:root}).toString().split('\0').filter(Boolean);
 const added=cp.execFileSync('git',['ls-files','--others','--exclude-standard','-z','--',...domains],{cwd:root}).toString().split('\0').filter(Boolean);
 const v35=require('./helpers/retrospective-v08435.cjs'),nextRecord=JSON.parse(fs.readFileSync(v35.RECORD,'utf8'));v35.createMigration(nextRecord);
 const v36=require('./helpers/retrospective-v08436.cjs'),latestRecord=JSON.parse(fs.readFileSync(v36.RECORD,'utf8'));v36.createMigration(latestRecord);
 const v37=require('./helpers/retrospective-v08437.cjs'),netRecord=JSON.parse(fs.readFileSync(v37.RECORD,'utf8'));v37.createMigration(netRecord);
 const v38=require('./helpers/retrospective-v08438.cjs'),neuroRecord=JSON.parse(fs.readFileSync(v38.RECORD,'utf8'));v38.createMigration(neuroRecord);
 const v39=require('./helpers/retrospective-v08439.cjs'),neuro39Record=JSON.parse(fs.readFileSync(v39.RECORD,'utf8'));v39.createMigration(neuro39Record);
 const v40=require('./helpers/retrospective-v08440.cjs'),skin40Record=JSON.parse(fs.readFileSync(v40.RECORD,'utf8'));v40.createMigration(skin40Record);
 const v41=require('./helpers/retrospective-v08441.cjs'),skin41Record=JSON.parse(fs.readFileSync(path.join(root,'validation/skin-melanoma-v08441/retrospective-hashes.json'),'utf8'));
 const combined=[...new Set([...changed,...added])].sort();
 const v42=require('./helpers/retrospective-v08442.cjs'),skin42Record=JSON.parse(fs.readFileSync(path.join(root,'validation/skin-melanoma-v08442/retrospective-hashes.json'),'utf8'));
 const v43=require('./helpers/retrospective-v08443.cjs'),design43Record=JSON.parse(fs.readFileSync(v43.RECORD,'utf8'));v43.createMigration(design43Record);
 const v44=require('./helpers/retrospective-v08444.cjs'),design44Record=JSON.parse(fs.readFileSync(v44.RECORD,'utf8'));v44.createMigration(design44Record);
 const v45=require('./helpers/retrospective-v08445.cjs'),design45Record=JSON.parse(fs.readFileSync(v45.RECORD,'utf8'));v45.createMigration(design45Record);
 const v46=require('./helpers/retrospective-v08446.cjs'),design46Record=JSON.parse(fs.readFileSync(v46.RECORD,'utf8'));v46.createMigration(design46Record);
 const v47=require('./helpers/retrospective-v08447.cjs'),design47Record=JSON.parse(fs.readFileSync(v47.RECORD,'utf8'));v47.createMigration(design47Record);v47.verifyCurrent(design47Record);
 const batchPatientFiles=Object.keys(design47Record.files).filter(file=>domains.some(domain=>file===domain||file.startsWith(domain+'/')));
 const currentPatientFiles=Object.keys(design46Record.files).filter(file=>domains.some(domain=>file===domain||file.startsWith(domain+'/')));
 const sourcePatientFiles=Object.keys(design45Record.files).filter(file=>domains.some(domain=>file===domain||file.startsWith(domain+'/')));
 const designPatientFiles=Object.keys(design43Record.files).filter(file=>domains.some(domain=>file===domain||file.startsWith(domain+'/')));
 const contentPatientFiles=Object.keys(design44Record.files).filter(file=>domains.some(domain=>file===domain||file.startsWith(domain+'/')));
 for(const file of combined)assert.ok(v34.approvedPath(file)||v35.approvedPath(file)||v36.approvedPath(file)||v37.approvedPath(file)||v38.approvedPath(file)||v39.approvedPath(file)||v40.approvedPath(file)||v41.approvedPath(file)||v42.approvedPath(file)||v43.approvedPath(file)||v44.approvedPath(file)||v45.approvedPath(file)||v46.approvedPath(file)||(Object.hasOwn(design47Record.files,file)&&v47.approvedPath(file)),'Unrelated patient/clinical asset changed: '+file);
 assert.deepEqual([...new Set([...Object.keys(migrationRecord.files),...Object.keys(nextRecord.files),...Object.keys(latestRecord.files),...Object.keys(netRecord.files),...Object.keys(neuroRecord.files),...Object.keys(neuro39Record.files),...Object.keys(skin40Record.files),...Object.keys(skin41Record.files),...Object.keys(skin42Record.files),...designPatientFiles,...contentPatientFiles,...sourcePatientFiles,...currentPatientFiles,...batchPatientFiles])].sort(),combined,'All explicit migrations must cover every changed patient/clinical asset');
 const actual=combined.filter(f=>Object.hasOwn(migrationRecord.files,f));
 assert.deepEqual(Object.keys(migrationRecord.files).sort(),actual,'Every changed or new clinical/patient asset must be explicitly reviewed');
 for(const [file,entry] of Object.entries(migrationRecord.files)){
  if(entry.before===null){const existed=cp.spawnSync('git',['cat-file','-e',v34.BASE_COMMIT+':'+file],{cwd:root,stdio:'ignore'});assert.equal(existed.error,undefined);assert.notEqual(existed.status,0,'New asset already existed at baseline: '+file);}
  else assert.equal(sha(cp.execFileSync('git',['show',v34.BASE_COMMIT+':'+file],{cwd:root,maxBuffer:64*1024*1024})),entry.before,file+' original bytes');
  assert.equal(sha(fs.readFileSync(path.join(root,file))),v35.expectedHash(file,entry.after),file+' reviewed current bytes');
 }
});


test('v35 additions have exact baseline provenance, current bytes and bounded paths',()=>{
 const m=require('./helpers/retrospective-v08435.cjs'),record=JSON.parse(fs.readFileSync(m.RECORD,'utf8'));m.createMigration(record);
 for(const[file,entry]of Object.entries(record.files)){
  assert(m.approvedPath(file));
  const old=cp.spawnSync('git',['show',m.BASE_COMMIT+':'+file],{cwd:root,maxBuffer:64*1024*1024});
  if(entry.before===null)assert.notEqual(old.status,0,file+' must be new');else {assert.equal(old.status,0);assert.equal(sha(old.stdout),entry.before,file+' baseline');}
  assert.equal(sha(fs.readFileSync(path.join(root,file))),require('./helpers/retrospective-v08436.cjs').expectedHash(file,entry.after),file+' reviewed bytes');
 }
 assert.throws(()=>m.createMigration({...record,files:{'patient/00555/guide.pdf':{before,after}}}),/Unapproved/);
});


test('v36 corrections prove exact v35 Git provenance, bounded scope and final bytes',()=>{
 const m=require('./helpers/retrospective-v08436.cjs'),record=JSON.parse(fs.readFileSync(m.RECORD,'utf8'));m.createMigration(record);
 for(const[file,entry]of Object.entries(record.files)){
  assert(m.approvedPath(file));
  const old=cp.spawnSync('git',['show',m.BASE_COMMIT+':'+file],{cwd:root,maxBuffer:64*1024*1024});
  if(entry.before===null)assert.notEqual(old.status,0,file+' must be new');else {assert.equal(old.status,0);assert.equal(sha(old.stdout),entry.before,file+' v35 baseline');}
  assert.equal(sha(fs.readFileSync(path.join(root,file))),require('./helpers/retrospective-v08437.cjs').expectedHash(file,entry.after),file+' reviewed v36 bytes');
 }
 for(const bad of ['patient/00558/guide.pdf','patient/00555/unreviewed.js','protocols/gastrointestinal/00209-folfox6.json','data/patient-knowledge/00558.json','patient/../../guide.pdf'])assert.throws(()=>m.createMigration({...record,files:{[bad]:{before,after}}}),/Unapproved/);
 const file='patient/00216/guide.pdf',migrate=m.createMigration({...record,files:{[file]:{before,after}}});
 assert.equal(migrate(file,before),after);assert.equal(migrate(file,after),after);assert.throws(()=>migrate(file,sha('Unreviewed source')),/Unexpected/);
});


test('v37 additions prove the prepared v36 baseline and bounded NET scope',()=>{
 const m=require('./helpers/retrospective-v08437.cjs'),record=JSON.parse(fs.readFileSync(m.RECORD,'utf8'));m.createMigration(record);
 const v36=JSON.parse(fs.readFileSync(path.join(root,'validation/colorectal-v08436/retrospective-hashes.json'),'utf8'));
 for(const[file,entry]of Object.entries(record.files)){
  assert(m.approvedPath(file));
  const earlier=v36.files[file];
  if(earlier)assert.equal(entry.before,earlier.after,file+' prepared v36 bytes');
  else {
   const old=cp.spawnSync('git',['show',m.BASE_COMMIT+':'+file],{cwd:root,maxBuffer:64*1024*1024});
   if(entry.before===null)assert.notEqual(old.status,0,file+' must be new');
   else {assert.equal(old.status,0);assert.equal(sha(old.stdout),entry.before,file+' unchanged since verified main');}
  }
  assert.equal(sha(fs.readFileSync(path.join(root,file))),require('./helpers/retrospective-v08438.cjs').expectedHash(file,entry.after),file+' reviewed v37 bytes');
 }
 for(const bad of ['patient/00320/guide.pdf','patient/00320/renal/guide.pdf','patient/00642/unreviewed.js','protocols/gastrointestinal/00209-folfox6.json','data/patient-knowledge/00216.json','patient/../../guide.pdf'])assert.throws(()=>m.createMigration({...record,files:{[bad]:{before,after}}}),/Unapproved/);
 const file='patient/00642/guide.pdf',migrate=m.createMigration({...record,files:{[file]:{before,after}}});
 assert.equal(migrate(file,before),after);assert.equal(migrate(file,after),after);assert.throws(()=>migrate(file,sha('Unreviewed source')),/Unexpected/);
});


test('v38 additions prove exact remote v37 baseline, bounded neuro scope and current bytes',()=>{
 const m=require('./helpers/retrospective-v08438.cjs'),record=JSON.parse(fs.readFileSync(m.RECORD,'utf8'));m.createMigration(record);
 for(const[file,entry]of Object.entries(record.files)){
  assert(m.approvedPath(file));const old=cp.spawnSync('git',['show',m.BASE_COMMIT+':'+file],{cwd:root,maxBuffer:64*1024*1024});
  if(entry.before===null)assert.notEqual(old.status,0,file+' must be new');else{assert.equal(old.status,0);assert.equal(sha(old.stdout),entry.before,file+' verified v37 baseline');}
  assert.equal(sha(fs.readFileSync(path.join(root,file))),require('./helpers/retrospective-v08439.cjs').expectedHash(file,entry.after),file+' reviewed v38 bytes');
 }
 for(const bad of ['patient/00555/guide.pdf','patient/00805/guide.pdf','patient/00334/unreviewed.js','data/patient-knowledge/00642.json','patient/../../guide.pdf'])assert.throws(()=>m.createMigration({...record,files:{[bad]:{before,after}}}),/Unapproved/);
 const file='patient/00334/guide.pdf',migrate=m.createMigration({...record,files:{[file]:{before,after}}});assert.equal(migrate(file,before),after);assert.equal(migrate(file,after),after);assert.throws(()=>migrate(file,sha('Unreviewed source')),/Unexpected/);
});

 test('v39 additions prove prepared v38 baseline, exact source scope and reviewed current bytes',()=>{
 const m=require('./helpers/retrospective-v08439.cjs'),record=JSON.parse(fs.readFileSync(m.RECORD,'utf8'));m.createMigration(record);
 const earlier=JSON.parse(fs.readFileSync(path.join(root,'validation/neuro-oncology-v08438/retrospective-hashes.json'),'utf8'));
 for(const[file,e]of Object.entries(record.files)){
  assert(m.approvedPath(file));
  if(earlier.files[file])assert.equal(e.before,earlier.files[file].after,file+' prepared v38 bytes');
  else{const old=cp.spawnSync('git',['show',m.BASE_COMMIT+':'+file],{cwd:root,maxBuffer:64*1024*1024});if(e.before===null)assert.notEqual(old.status,0);else{assert.equal(old.status,0);assert.equal(sha(old.stdout),e.before);}}
  assert.equal(sha(fs.readFileSync(path.join(root,file))),require('./helpers/retrospective-v08440.cjs').expectedHash(file,e.after),file+' reviewed current bytes');
 }
 for(const bad of ['patient/00334/guide.pdf','patient/00555/guide.pdf','patient/00806/unreviewed.js','patient/../../guide.pdf'])assert.throws(()=>m.createMigration({...record,files:{[bad]:{before,after}}}),/Unapproved/);
 });

 test('v40 additions prove exact remote v39 baseline, bounded skin scope and reviewed current bytes',()=>{
 const m=require('./helpers/retrospective-v08440.cjs'),record=JSON.parse(fs.readFileSync(m.RECORD,'utf8'));m.createMigration(record);
 for(const[file,e]of Object.entries(record.files)){
  assert(m.approvedPath(file));const old=cp.spawnSync('git',['show',m.BASE_COMMIT+':'+file],{cwd:root,maxBuffer:64*1024*1024});
  if(e.before===null)assert.notEqual(old.status,0,file+' must be new');else{assert.equal(old.status,0);assert.equal(sha(old.stdout),e.before,file+' verified remote v39 baseline');}
  assert.equal(sha(fs.readFileSync(path.join(root,file))),require('./helpers/retrospective-v08441.cjs').expectedHash(file,e.after),file+' reviewed current bytes');
 }
 for(const bad of ['patient/00334/guide.pdf','patient/00555/guide.pdf','patient/00415/renal/guide.pdf','patient/00236/unreviewed.js','patient/../../guide.pdf','protocols/skin/00415-unapproved.json'])assert.throws(()=>m.createMigration({...record,files:{[bad]:{before,after}}}),/Unapproved/);
 const file='patient/00415/adjuvant/guide.pdf',migrate=m.createMigration({...record,files:{[file]:{before,after}}});assert.equal(migrate(file,before),after);assert.equal(migrate(file,after),after);assert.throws(()=>migrate(file,sha('Unreviewed source')),/Unexpected/);
 });

 test('v41 additions prove the delivered v40 baseline, bounded melanoma scope and current bytes',()=>{
 const m=require('./helpers/retrospective-v08441.cjs'),record=JSON.parse(fs.readFileSync(path.join(root,'validation/skin-melanoma-v08441/retrospective-hashes.json'),'utf8'));
 const prior=JSON.parse(fs.readFileSync(path.join(root,'validation/skin-melanoma-v08440/retrospective-hashes.json'),'utf8'));
 for(const[file,e]of Object.entries(record.files)){
  assert(m.approvedPath(file),file);
  if(prior.files[file])assert.equal(e.before,prior.files[file].after,file+' delivered v40 bytes');
  else{const old=cp.spawnSync('git',['show',prior.base_commit+':'+file],{cwd:root,maxBuffer:64*1024*1024});if(e.before===null)assert.notEqual(old.status,0,file+' new');else{assert.equal(old.status,0);assert.equal(sha(old.stdout),e.before,file+' unchanged v39 bytes');}}
  assert.equal(sha(fs.readFileSync(path.join(root,file))),m.expectedHash(file,e.before),file+' reviewed current bytes');
 }
 for(const bad of ['patient/00334/guide.pdf','patient/00558/melanoma_perioperative/guide.pdf','patient/00455/colorectal/guide.pdf','patient/00455/unreviewed.js','patient/../../guide.pdf','protocols/skin/00415-unapproved.json'])assert.equal(m.approvedPath(bad),false,bad);
 assert.throws(()=>m.expectedHash('patient/00455/guide.pdf',sha('Unreviewed source')),/Unexpected/);
 });


test('v42 preserves exact baseline provenance and confines seven new skin routes',()=>{
 const m=require('./helpers/retrospective-v08442.cjs'),record=JSON.parse(fs.readFileSync(path.join(root,'validation/skin-melanoma-v08442/retrospective-hashes.json')));
 assert.equal(record.base_commit,m.BASE_COMMIT);
 for(const [file,e]of Object.entries(record.files)){
  assert(m.approvedPath(file),file);const old=cp.spawnSync('git',['show',m.BASE_COMMIT+':'+file],{cwd:root,maxBuffer:64*1024*1024});
  if(e.before===null)assert.notEqual(old.status,0,file+' must be new');else{assert.equal(old.status,0);assert.equal(sha(old.stdout),e.before,file+' baseline');}
  assert.equal(sha(fs.readFileSync(path.join(root,file))),m.expectedHash(file,e.before),file+' current');
 }
 for(const bad of ['patient/00551/guide.pdf','patient/00535/renal/guide.pdf','patient/00431/guide.pdf','patient/../../index.html','data/patient-knowledge/00551.json','protocols/skin/00236-vismodegib-monotherapy.json'])assert.equal(m.approvedPath(bad),false,bad);
 assert.throws(()=>m.expectedHash('patient/00102/guide.pdf',sha('unreviewed')),/Unexpected/);
});

// Included in the existing test:patient-ui gate without changing historical
// manifest records or bypassing their provenance and current-byte checks.
require('./patient-design-migration-v08443.test.cjs');
require('./patient-design-migration-v08444.test.cjs');
