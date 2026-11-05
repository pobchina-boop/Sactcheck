'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..');
const {ESSENTIAL,isCandidate,profileContext,assessPresentation,collect,markdown,writeReports}=require('../tools/colorectal-batch-readiness.cjs');
const crc={title:'Regimen',context_label:'Metastatic colorectal cancer'};

test('candidate discovery follows current encoded indications, not folder or previous completion flags',()=>{
 assert(isCandidate({metadata:{indication:'Shared component'},indications:[{description:'Metastatic carcinoma of the colon or rectum.'}]}));
 assert(isCandidate({metadata:{indication:'Previously treated metastatic colorectal cancer'}}));
 assert(!isCandidate({metadata:{title:'Colorectal library',indication:'Breast cancer'},indications:[{description:'Metastatic breast cancer'}]}));
 assert(!isCandidate({metadata:{indication:'Non-small-cell lung cancer'}}));
});

test('a completed flag and global suite release cannot conceal missing essential patient outputs',()=>{
 const row=assessPresentation({declaredComplete:true,profile:{...crc,suite_release:'1.2.3'},presentFiles:ESSENTIAL.filter(n=>n!=='handbook.pdf'),qrPresent:true});
 assert.equal(row.declared_complete,true);assert.equal(row.declared_complete_with_file_gaps,true);
 assert.equal(row.file_presence_complete,false);assert.deepEqual(row.missing_essential_files,['handbook.pdf']);
 assert.equal(row.context_specific_clinical_completion_verified,false);
});

test('shared breast/lung services are not misattributed to a colorectal indication',()=>{
 const breast=profileContext({title:'Bevacizumab',context_label:'HER2-negative metastatic breast cancer',scope_note:'The shared source also lists colorectal cancer.',sources:[{title:'Metastatic colorectal cancer source'}]});
 assert.equal(breast.classification,'other_tumour_context');
 const lung=assessPresentation({declaredComplete:false,profile:{title:'Bevacizumab · lung',context_label:'First-line non-squamous NSCLC'},presentFiles:ESSENTIAL,qrPresent:true});
 assert.equal(lung.file_presence_complete,true);assert.equal(lung.context_mismatch,true);assert.equal(lung.context_specific_clinical_completion_verified,false);
 assert.equal(profileContext({context_label:'Selected metastatic colorectal cancer; or head/neck cancer with radiotherapy'}).classification,'mixed_colorectal_and_other');
});

test('file/QR presence never becomes a clinical, source or decode pass',()=>{
 const complete=assessPresentation({declaredComplete:false,profile:crc,presentFiles:ESSENTIAL,qrPresent:true});
 assert.equal(complete.file_presence_complete,true);assert.equal(complete.declared_complete,false);assert.equal(complete.context_specific_clinical_completion_verified,false);
 const noQr=assessPresentation({declaredComplete:true,profile:crc,presentFiles:ESSENTIAL,qrPresent:false});
 assert.equal(noQr.file_presence_complete,false);assert.equal(noQr.declared_complete_with_file_gaps,true);
 assert.equal(profileContext(null).classification,'missing');
});

test('current inventory joins the indexed candidate set, declarations and actual stored audiences independently',()=>{
 const {inventory:i,matrix:m}=collect(root,{sourceStatus:'blocked',now:'test'});
 const register=JSON.parse(fs.readFileSync(path.join(root,'data/colorectal-suite-progress-v0832.json'),'utf8'));
 assert.deepEqual(i.records.map(r=>r.code),register.regimens.map(r=>r.code).sort());
 assert.equal(i.candidate_count,i.records.length);
 assert.equal(i.declared_completed_count,register.regimens.filter(r=>r.full_suite).length);
 assert.equal(i.register_comparison.completed_list_matches_flags,true);
 assert.deepEqual(i.register_comparison.indexed_candidates_missing_from_register,[]);
 assert.deepEqual(i.register_comparison.register_candidates_missing_from_index,[]);
 for(const code of ['00212','00214','00215'])assert.equal(i.records.find(r=>r.code===code).presentation.context_mismatch,true,code);
 const lonsurf=m.rows.find(r=>r.code==='00382');
 assert.equal(lonsurf.root_patient_profile.context_label,'Previously treated metastatic colorectal cancer');
 assert(lonsurf.selection_note.includes('Existing colorectal-specific'));
 assert(lonsurf.presentation.missing_essential_files.includes('handbook.pdf'));
 assert(lonsurf.prior_work_evidence.some(e=>e.path==='tests/full-suite-v08424.test.cjs'&&e.present));
 assert.equal(m.rows.length,10);assert.equal(i.newly_completed_contexts,0);assert.equal(i.current_official_sources_verified,false);
 assert(m.rows.every(r=>r.stored_source.current_official_verified===false));
 assert(m.rows.every(r=>Object.values(r.clinical_decision_categories).every(s=>s==='blocked_pending_current_official_sources')));
 assert.throws(()=>collect(root,{sourceStatus:'verified'}),/cannot verify current official sources/);
});

test('default command reads only and does not rewrite application files or reports',()=>{
 const status=()=>cp.execFileSync('git',['status','--porcelain=v1','--untracked-files=all'],{cwd:root,encoding:'utf8'});
 const before=status();
 const output=cp.execFileSync(process.execPath,['tools/colorectal-batch-readiness.cjs'],{cwd:root,encoding:'utf8'});
 const summary=JSON.parse(output);assert.equal(summary.report_directory,null);assert.equal(summary.current_official_sources_verified,false);
 assert.equal(status(),before);
});

test('report writes are opt-in, planned, scoped and refuse to overwrite earlier evidence',t=>{
 const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'sactcheck-readiness-'));t.after(()=>fs.rmSync(temporary,{recursive:true,force:true}));
 const reports={'inventory.json':'{}\n','consistency-matrix.json':'{}\n','consistency-matrix.md':'Matrix\n','backlog-review.md':'Backlog\n'};
 const destination=path.join(temporary,'new');writeReports(root,destination,reports);
 for(const [name,text]of Object.entries(reports))assert.equal(fs.readFileSync(path.join(destination,name),'utf8'),text);
 assert.throws(()=>writeReports(root,destination,reports),/Refusing to overwrite/);
 assert.throws(()=>writeReports(root,path.join(root,'patient','unsafe-report'),reports),/under validation/);
 assert.throws(()=>writeReports(root,path.join(temporary,'unsafe'),{'../outside.md':'wrong'}),/Unexpected report filename/);
 assert.equal(fs.existsSync(path.join(temporary,'outside.md')),false);
 const existing=path.join(temporary,'partial');fs.mkdirSync(existing);fs.writeFileSync(path.join(existing,'backlog-review.md'),'Old evidence');
 assert.throws(()=>writeReports(root,existing,reports),/Refusing to overwrite/);
 assert.equal(fs.readdirSync(existing).length,1,'Collision planning writes no earlier files');
});

test('human-readable reports distinguish stored provenance and missing packaging from completed new audits',()=>{
 const result=collect(root,{sourceStatus:'blocked',now:'test'}),reports=markdown(result);
 assert.match(reports['backlog-review.md'],/File presence is not clinical\/visual validation/);
 assert.match(reports['backlog-review.md'],/00382 already has colorectal-specific/);
 assert.match(reports['consistency-matrix.md'],/not completed clinical, PDF, QR or visual validation/);
 assert.match(reports['consistency-matrix.md'],/every tumour-group context/);
 assert.match(reports['backlog-review.md'],/SOURCE|source/i);
});
