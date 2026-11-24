'use strict';
// Preserve the source author's original 27-case matrix and run it against current bytes.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),base='validation/sarcoma-v08462/trabectedin-phase-correction/',source=base+'source-review/';
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'),read=f=>JSON.parse(fs.readFileSync(path.join(root,f)));
assert.equal(sha(path.join(root,base+'integration.json')),'7589dfa865f0d1339be5f4a0cc8e03c1c3508e939a8f4a1a52dbbe144ba7e13b');
const integration=read(base+'integration.json'),freeze=read(source+'freeze.json'),delta=read(source+'transition-manifest.json');
assert.equal(sha(path.join(root,source+'freeze.json')),'70aaf120da0c40b35ae1b0fc90f09d4e09797ca4dd15159e48ac9702bb6c7f1d');
assert.equal(sha(path.join(root,integration.source_delta_path)),integration.source_delta_sha256);
assert.equal(sha(path.join(root,integration.path)),integration.after_sha256);
assert.equal(sha(path.join(root,integration.before_snapshot_path)),integration.before_sha256);
assert.equal(sha(path.join(root,integration.source_text_path)),integration.source_text_sha256);
const item=delta.protocols.find(x=>x.kind==='application');assert.equal(item.candidate_sha256,integration.after_sha256);
for(const name of ['phase-cases.cjs','phase-case-results.json','transition-manifest.json',item.before_path,item.candidate_path]){
 const pin=freeze.artifacts.find(x=>x.path===name);assert(pin,'Missing source artifact pin '+name);assert.equal(sha(path.join(root,source,name)),pin.sha256,name);
}
const original=read(source+'phase-case-results.json');assert.equal(original.total,27);assert.equal(original.passed,27);assert.equal(original.failed,0);
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'sactcheck-trabectedin-phase-'));
try{
 const stage=path.join(temp,'review');fs.mkdirSync(stage);fs.mkdirSync(path.join(temp,'Sactcheck'));fs.symlinkSync(path.join(root,'js'),path.join(temp,'Sactcheck/js'),'dir');
 for(const name of ['phase-cases.cjs','transition-manifest.json',item.before_path]){const target=path.join(stage,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,source,name),target);}
 const candidate=path.join(stage,item.candidate_path);fs.mkdirSync(path.dirname(candidate),{recursive:true});fs.copyFileSync(path.join(root,integration.path),candidate);
 const run=cp.spawnSync(process.execPath,[path.join(stage,'phase-cases.cjs')],{cwd:stage,encoding:'utf8',timeout:30000});assert.equal(run.status,0,run.stdout+run.stderr);
 assert.deepEqual(JSON.parse(fs.readFileSync(path.join(stage,'phase-case-results.json'))),original,'All 27 original phase assertions and results must remain exact');
}finally{fs.rmSync(temp,{recursive:true,force:true});}
const independent=cp.spawnSync(process.execPath,[path.join(root,'tools/check-trabectedin-independent-v08462.cjs')],{cwd:root,encoding:'utf8',timeout:30000});assert.equal(independent.status,0,independent.stdout+independent.stderr);
console.log('Trabectedin phase correction: 27 original source-matrix and 18 independent phase-cue cases passed against the current protocol.');
