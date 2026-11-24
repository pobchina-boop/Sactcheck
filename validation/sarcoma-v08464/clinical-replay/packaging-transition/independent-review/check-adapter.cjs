'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),assert=require('node:assert/strict'),cp=require('node:child_process'),zlib=require('node:zlib');
const home=__dirname,root=path.resolve(process.argv[2]||path.join(home,'../../Sactcheck')),before=JSON.parse(fs.readFileSync(path.join(home,'before-pins.json'))),moduleRel='tools/lib/sarcoma-v08464-transitions.cjs',T=require(path.join(root,moduleRel)),base=T.base;
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),hash=p=>sha(fs.readFileSync(p));
const storage=JSON.parse(fs.readFileSync(path.join(root,base,'packaging-transition/compression-manifest.json'))),logical='compatibility/all-observation-deltas.json',gz=path.join(root,base,storage.stored_relative_path),rawFile=path.resolve(process.argv[3]||before.raw_external_preserved_path);
const results=[],run=(name,fn)=>{try{const detail=fn();results.push({name,passed:true,detail});}catch(e){results.push({name,passed:false,error:e.stack});throw e;}};
let temp;try{
 run('Exact decoded bytes equal preserved external raw and immutable logical manifest',()=>{
  const original=fs.readFileSync(rawFile),decoded=zlib.gunzipSync(fs.readFileSync(gz)),m=JSON.parse(fs.readFileSync(path.join(root,base,'archive-manifest.json'))),entry=m.files.find(x=>x.path===logical);
  assert.equal(original.length,39759020);assert.equal(sha(original),'5b00160f906930629ecdc5791fd648643bb0077ff0044cdca8ba3ab45a301653');assert(decoded.equals(original));assert.equal(entry.bytes,decoded.length);assert.equal(entry.sha256,sha(decoded));assert.equal(fs.statSync(gz).size,1071090);assert.equal(hash(gz),'b1ae5721902a9af9fe28313ad4300ba73853c29c64679443ad7069db14e8a419');assert.equal(JSON.parse(decoded).records.length,872);assert(!fs.existsSync(path.join(root,base,logical)));assert(T.evidenceBytes(root,logical).equals(original));return {raw_bytes:decoded.length,raw_sha256:sha(decoded),stored_bytes:fs.statSync(gz).size,stored_sha256:hash(gz),observation_records:872};
 });
 run('Original logical manifests,20MB guard,clinical protocols and PDFs remain exact',()=>{
  const unchanged=before.pins.filter(x=>x.path!=='tools/lib/sarcoma-v08464-transitions.cjs'&&x.path!=='.gitignore');for(const p of unchanged)assert.equal(hash(path.join(root,p.path)),p.sha256,p.path);
  for(const [name,key]of [['archive-manifest.json','immutable_archive_manifest_sha256'],['final-evidence-manifest.json','immutable_final_evidence_manifest_sha256'],['final-integrated-acceptance.json','immutable_final_acceptance_sha256']])assert.equal(hash(path.join(root,base,name)),storage[key]);
  assert(fs.readFileSync(path.join(root,'tools/security-check.js'),'utf8').includes('stat.size > 20 * 1024 * 1024'));return {unchanged_pinned_files:unchanged.length,original_failure_log_sha256:hash(path.join(home,'original-source-security-failure/stdout.log'))};
 });
 const reads=new Set(),originalRead=fs.readFileSync;let verified;
 try{fs.readFileSync=function(f,...args){if(typeof f==='string'&&path.resolve(f).startsWith(root+path.sep))reads.add(path.relative(root,path.resolve(f)));return originalRead.call(fs,f,...args);};verified=T.verify(root);}finally{fs.readFileSync=originalRead;}
 reads.add(moduleRel);
 run('Entire source/product/CNS/grading/integration chain and401 logical archive entries authenticate',()=>{assert.equal(verified.records.size,5);const m=T.authenticate(root);assert.equal(m.file_count,401);return {protocols:5,logical_archive_files:401,required_physical_paths:reads.size};});
 temp=fs.mkdtempSync(path.join(os.tmpdir(),'sactcheck-gzip-independent-'));const portable=path.join(temp,'portable-repository');
 for(const rel of reads){const dest=path.join(portable,rel);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(root,rel),dest);}
 const P=require(path.join(portable,moduleRel));
 run('Complete required reader paths work after repository relocation',()=>{assert.equal(P.verify(portable).records.size,5);assert.equal(P.authenticate(portable).file_count,401);assert.equal(sha(P.evidenceBytes(portable,logical)),before.raw_sha256);return {isolated_root:portable,required_files_copied:reads.size,no_original_repository_fallback:true};});
 run('Corrupt compressed data and unapproved manifest mapping reject',()=>{
  const p=path.join(portable,base,storage.stored_relative_path),bytes=fs.readFileSync(p),bad=Buffer.from(bytes);bad[bad.length-9]^=1;fs.writeFileSync(p,bad);assert.throws(()=>P.evidenceBytes(portable,logical));fs.writeFileSync(p,bytes);
  const m=path.join(portable,base,'packaging-transition/compression-manifest.json'),old=fs.readFileSync(m),changed=JSON.parse(old);changed.virtual_relative_path='compatibility/different.json';fs.writeFileSync(m,JSON.stringify(changed));assert.throws(()=>P.evidenceBytes(portable,logical));fs.writeFileSync(m,old);return {corrupted_gzip_rejected:true,changed_mapping_rejected:true};
 });
 run('Only one exact virtual path is decoded',()=>{const fake='compatibility/not-authorised.json',f=path.join(portable,base,fake+'.gz');fs.copyFileSync(path.join(portable,base,storage.stored_relative_path),f);assert.throws(()=>P.evidenceBytes(portable,fake));fs.unlinkSync(f);return {arbitrary_gzip_fallback:false};});
 run('External materialization restores every archived compatibility path and frozen script byte',()=>{
  const dest=path.join(temp,'materialized-compatibility');assert.throws(()=>P.materializeEvidence(portable,path.join(portable,'internal-restore')));const restored=P.materializeEvidence(portable,dest),m=P.authenticate(portable),files=m.files.filter(f=>f.path.startsWith('compatibility/'));
  for(const f of files){const p=path.join(dest,f.path.slice('compatibility/'.length));assert.equal(fs.statSync(p).size,f.bytes);assert.equal(hash(p),f.sha256,f.path);}assert(!fs.existsSync(path.join(dest,'all-observation-deltas.json.gz')));assert.throws(()=>P.materializeEvidence(portable,dest));return {restored_files:files.length,restored_raw_sha256:restored.raw_sha256,inside_repository_rejected:true,overwrite_rejected:true};
 });
 run('An external symlinked parent cannot alias a restoration into the repository',()=>{
  const alias=path.join(temp,'apparently-external-parent');fs.symlinkSync(portable,alias,'dir');const destination=path.join(alias,'nested','restored-audit');
  assert.throws(()=>P.materializeEvidence(portable,destination));assert(!fs.existsSync(path.join(portable,'nested')),'Rejected destination must not create repository content');return {symlink_to_repository_rejected:true,no_destination_created:true};
 });
 run('All runtime-required files and new packaging artifacts are Git-visible',()=>{
  const extra=['code-transition.json','before-transitions.cjs','adapter-checks.json'].map(n=>base+'/packaging-transition/'+n);for(const f of extra)reads.add(f);
  const check=cp.spawnSync('git',['check-ignore','--no-index','--stdin'],{cwd:root,input:[...reads].sort().join('\n')+'\n',encoding:'utf8'});assert.equal(check.status,1,check.stdout+check.stderr);assert.equal(check.stdout,'');return {paths_checked:reads.size,ignored:[]};
 });
}catch(e){process.exitCode=1;}
finally{if(temp)fs.rmSync(temp,{recursive:true,force:true});const report={date:'2026-11-18',scope:'Independent exact one-file evidence compression/reader review; no clinical re-audit',script_sha256:hash(__filename),reader_sha256:hash(path.join(root,moduleRel)),compression_manifest_sha256:hash(path.join(root,base,'packaging-transition/compression-manifest.json')),passed:results.filter(r=>r.passed).length,failed:results.filter(r=>!r.passed).length,checks:results,application_writes_by_reviewer:false,clinical_or_pharmacy_approval:false};fs.writeFileSync(path.join(home,'independent-check-results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,failed:report.failed,failures:results.filter(r=>!r.passed)},null,2));}
