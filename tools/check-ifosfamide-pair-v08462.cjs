'use strict';
// Replay unchanged seven-candidate expectations with the two current app protocols.
// Five future candidates stay immutable review fixtures and are not claimed integrated.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const R=path.resolve(__dirname,'..'),source=path.join(R,'validation/sarcoma-v08462/ifosfamide-product/review'),M=require('../tests/helpers/ifosfamide-pair-v08462.cjs').verify(),sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const evidence=JSON.parse(fs.readFileSync(path.join(source,'evidence-manifest.json'))),stage=fs.mkdtempSync(path.join(os.tmpdir(),'sactcheck-ifos-pair-v62-')),work=path.join(stage,'review'),candidates=path.join(stage,'sarcoma-ifosfamide-product-conflict-20261118/corrected-protocols');
const auth=relative=>{const row=evidence.files.find(x=>x.path===relative);assert(row,'Missing archived evidence '+relative);assert.equal(sha(path.join(source,relative)),row.sha256,'Archived evidence changed '+relative);};
try{
 fs.mkdirSync(work);fs.mkdirSync(candidates,{recursive:true});fs.symlinkSync(R,path.join(stage,'Sactcheck'),'junction');
 for(const f of fs.readdirSync(path.join(source,'final-corrected-snapshot'))){auth('final-corrected-snapshot/'+f);const r=M.records.find(r=>r.code===f.slice(0,5));fs.copyFileSync(r?path.join(R,r.path):path.join(source,'final-corrected-snapshot',f),path.join(candidates,f));}
 const simplify=r=>{const x=structuredClone(r);for(const k of ['started_utc','finished_utc','checked_utc'])delete x[k];return x;};
 const outputs=[];
 for(const [script,report,count]of [['independent-product-cases.cjs','current-results.json',347],['semantic-cns-cases.cjs','semantic-cns-current-results.json',26]]){
  auth(script);auth(report);fs.copyFileSync(path.join(source,script),path.join(work,script));const expected=JSON.parse(fs.readFileSync(path.join(source,report)));assert.equal(expected.passed,count);assert.equal(expected.failed,0);
  for(const p of expected.protocols){const r=M.records.find(x=>x.code===p.code);if(r){assert.equal(p.sha256,r.accepted_sha256);p.sha256=r.after_sha256;}}
  const run=cp.spawnSync(process.execPath,[path.join(work,script),'--current'],{cwd:R,env:{...process.env,SACTCHECK_ROOT:R,SACTCHECK_IFOS_DRAFT_ROOT:candidates},encoding:'utf8',timeout:30000,maxBuffer:4*1024*1024});if(run.error)throw run.error;if(run.status!==0){process.stdout.write(run.stdout||'');process.stderr.write(run.stderr||'');}assert.equal(run.status,0,'Named-product replay failed');const actual=JSON.parse(fs.readFileSync(path.join(work,report)));assert.deepEqual(simplify(actual),require('./lib/sarcoma-inherited-runtime.cjs').currentReport(report==='semantic-cns-current-results.json'?require('./lib/sarcoma-inherited-runtime.cjs').projectFieldMarkup(simplify(expected),2):simplify(expected)),'Unchanged product/CNS expected results differ');outputs.push({report,total:actual.total,passed:actual.passed,current_pair_cases:actual.results.filter(r=>['00391','00392'].includes(r.code)).length});
 }
 require('../tests/helpers/ifosfamide-pair-v08462.cjs').verify();console.log(JSON.stringify({status:'passed',scope:'Two current app protocols replayed within frozen seven-candidate contract; five external fixtures are not new app integrations',results:outputs,clinical_approval:false},null,2));
}finally{fs.rmSync(stage,{recursive:true,force:true});}
