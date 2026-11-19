'use strict';
// Preserve original author scripts/results. Adapt filesystem and baseline manifest paths only in temporary staging.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),source=path.join(root,'validation/sarcoma-v08461/clinical');
const checkpoint=JSON.parse(fs.readFileSync(path.join(source,'clinical-draft-checkpoint.json'))),sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const transition=require('./lib/sarcoma-v08461-transitions.cjs').verify(root);
const suites=[
 {script:'test-imatinib-sunitinib42.cjs',manifest:'imatinib-sunitinib42-draft-manifest.json',report:'imatinib-sunitinib42-draft-test-results.json',count:158,pathKey:'original_path',hashKey:'original_sha256'},
 {script:'test-sunitinib21-regorafenib-draft.cjs',manifest:'sunitinib21-regorafenib-draft-manifest.json',report:'sunitinib21-regorafenib-draft-tests.json',count:152,pathKey:'base_path',hashKey:'base_sha256'}
];
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'sactcheck-clinical-v08461-')),stage=path.join(temporary,'drafts');
try{
 fs.mkdirSync(stage);fs.symlinkSync(root,path.join(temporary,'Sactcheck'),'junction');
 const independent=path.join(root,'validation/sarcoma-v08461/independent-review'),evidence=JSON.parse(fs.readFileSync(path.join(independent,'evidence-manifest.json')));
 const replayDir=path.join(temporary,'sarcoma-batch2-independent-draft-review-20261118');fs.mkdirSync(replayDir);
 for(const name of ['initial-probes.json','00244-original-draft.json']){const record=evidence.files.find(x=>x.path===name);assert.ok(record);assert.equal(sha(path.join(independent,name)),record.sha256,'Retained independent input changed');}
 fs.copyFileSync(path.join(independent,'initial-probes.json'),path.join(replayDir,'initial-probes.json'));
 // Once integrated, the archived author's CRC comparison sees the current app.
 // Keep its original preservation claim meaningful by also comparing with the
 // immutable pre-correction draft whose original CRC metadata was audited.
 const priorCrc=JSON.parse(fs.readFileSync(path.join(independent,'00244-original-draft.json'))),currentCrc=JSON.parse(fs.readFileSync(path.join(root,'protocols/gastrointestinal/00244-regorafenib.json')));
 for(const key of ['indications','treatment_phases','dose_levels'])assert.deepEqual(currentCrc[key],priorCrc[key],'Original CRC '+key+' not preserved');
 for(const name of ['sunitinib-dose-range-replay.json']){const record=checkpoint.files.find(x=>x.path===name);assert.ok(record);assert.equal(sha(path.join(source,name)),record.sha256,'Archived auxiliary cases changed');fs.copyFileSync(path.join(source,name),path.join(stage,name));}
 for(const p of checkpoint.protocols){const current=path.join(root,p.repository_path),target=path.join(stage,p.draft_path);assert.equal(sha(current),transition.records.get(p.code).after_sha256,'App differs from verified integration '+p.code);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(current,target);}
 for(const suite of suites){
  const script=path.join(source,suite.script),record=checkpoint.files.find(x=>x.path===suite.script);assert.ok(record);assert.equal(sha(script),record.sha256,'Archived author script changed');
  fs.copyFileSync(script,path.join(stage,suite.script));
  const manifest=JSON.parse(fs.readFileSync(path.join(source,suite.manifest)));
  // The original baseline was pre-integration. In this disposable copy, the unchanged
  // no-app-mutation assertion checks the explicitly reviewed integrated baseline instead.
  for(const p of manifest.protocols){const entry=checkpoint.protocols.find(x=>x.repository_path===p[suite.pathKey]);assert.ok(entry,'Unmapped baseline path');p[suite.hashKey]=transition.records.get(entry.code).after_sha256;}
  fs.writeFileSync(path.join(stage,suite.manifest),JSON.stringify(manifest,null,2)+'\n');
  const expected=JSON.parse(fs.readFileSync(path.join(source,suite.report)));assert.equal(expected.passed,suite.count);assert.equal(expected.failed,0);
  const run=cp.spawnSync(process.execPath,[path.join(stage,suite.script)],{cwd:root,encoding:'utf8',timeout:30000,maxBuffer:4*1024*1024});
  if(run.stdout)process.stdout.write(run.stdout);if(run.stderr)process.stderr.write(run.stderr);if(run.error)throw run.error;assert.equal(run.status,0,'Author current-protocol replay failed');
  const actual=JSON.parse(fs.readFileSync(path.join(stage,suite.report)));assert.deepEqual(actual,expected,'Author cases, findings, structure checks or exact results changed');
 }
 for(const p of checkpoint.protocols)assert.equal(sha(path.join(root,p.repository_path)),transition.records.get(p.code).after_sha256,'App protocol changed during replay');
 console.log('Clinical v61 replay passed:310/310; unchanged author scripts and exact results, current app protocol hashes and every explicit integration transition verified. Retained reports were not rewritten.');
}finally{fs.rmSync(temporary,{recursive:true,force:true});}
