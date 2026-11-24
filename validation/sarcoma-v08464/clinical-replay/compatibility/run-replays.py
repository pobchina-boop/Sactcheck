#!/usr/bin/env python3
"""Replay immutable author/independent assertions in explicit isolated stages."""
import hashlib,json,os,pathlib,shutil,subprocess
OUT=pathlib.Path(__file__).resolve().parent
HOME=OUT.parent
APP=HOME/'Sactcheck'
AUTHOR=HOME/'sarcoma-batch5-drafts-20261118'
IND=HOME/'sarcoma-batch5-independent-draft-review-20261118'
HANDOFF=HOME/'sarcoma-v63-v64-integration-handoff-20261118'
def read(p): return json.loads(p.read_text())
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def save(p,d): p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d,indent=2)+'\n')
def copy(a,b): b.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(a,b)
tracked={}
def pin(p): tracked[str(p)]=sha(p)
checkpoint=AUTHOR/'clinical-draft-checkpoint-after-independent.json'
release=next(r for r in read(HANDOFF/'integration-handoff.json')['releases'] if r['version']=='0.84.64')
cp=read(checkpoint)
assert cp['author_cases']['total']==1283,cp['author_cases']
assert cp['independent_cases']['passed']==225,cp['independent_cases']
for p in [checkpoint,HANDOFF/'integration-handoff.json',IND/'input-manifest.json',IND/'final-review-summary.json']:
 pin(p);copy(p,OUT/'immutable-inputs'/p.name)
summary=read(IND/'final-review-summary.json')
scripts=[('author-712',AUTHOR/'test-ie-vac-draft.cjs','ie-vac-source-case-results.json',712,'drafts',[]),('author-571',AUTHOR/'iri-tmz-ivado-vit-cases.cjs','iri-tmz-ivado-vit-case-results.json',571,'drafts',[]),('independent-213',IND/'corrected-225-snapshot/independent-cases.cjs','current-results.json',213,'independent',['--current']),('independent-12',IND/'corrected-225-snapshot/retained-input-cases.cjs','retained-input-current-results.json',12,'independent',['--current'])]
for _,p,_,_,_,_ in scripts:
 pin(p);copy(p,OUT/'immutable-inputs'/p.name)
 if 'independent' in str(p): assert sha(p)==next(s['sha256'] for s in summary['scripts'] if s['path']==p.name)
for name in ['ie-vac-draft-manifest.json','iri-tmz-ivado-vit-manifest.json','ie-vac-source-case-results.json','iri-tmz-ivado-vit-case-results.json']:
 p=AUTHOR/name;pin(p);copy(p,OUT/'immutable-inputs'/name)
for name in ['current-results.json','retained-input-current-results.json']:
 p=IND/'corrected-225-snapshot'/name;pin(p);copy(p,OUT/'immutable-inputs'/('accepted-'+name))
for p in (APP/'js').glob('*.js'):pin(p)
for row in release['protocols']:
 pin(APP/row['target_application_path'])
 for key in ['original_application','base_clinical_draft','product_overlay','cns_semantic_overlay','final_candidate']:
  obj=row.get(key)
  if obj:
   p=HANDOFF/obj['handoff_path'];assert sha(p)==obj['sha256'];pin(p)
save(OUT/'initial-state.json',{'status':'inputs_authenticated_before_replay','author_accepted_cases':1283,'independent_accepted_cases':225,'grading':'not_applied_pending_independent_acceptance','application_writes':False,'clinical_approval':False,'source_handoff_sha256':sha(HANDOFF/'integration-handoff.json'),'input_hashes':tracked})
stages=[]
for label,key in [('original-accepted','base_clinical_draft'),('final-pregrading','final_candidate')]:
 stage=OUT/label
 assert not stage.exists(),'Refusing to overwrite '+str(stage)
 runtime=stage/'Sactcheck';draft=stage/'drafts';ind=stage/'independent'
 shutil.copytree(APP/'js',runtime/'js');draft.mkdir();ind.mkdir()
 candidates=[]
 for row in release['protocols']:
  original=HANDOFF/row['original_application']['handoff_path']
  copy(original,runtime/row['target_application_path'])
  source=HANDOFF/row[key]['handoff_path'];dest=draft/'protocols'/source.name
  copy(source,dest)
  candidates.append({'code':row['code'],'path':str(dest),'sha256':sha(source),'handoff_stage':key})
 for name in ['ie-vac-draft-manifest.json','iri-tmz-ivado-vit-manifest.json']:copy(AUTHOR/name,draft/name)
 input_manifest=read(IND/'input-manifest.json')
 original_manifest=json.loads(json.dumps(input_manifest))
 input_manifest['application_root']=str(runtime);input_manifest['draft_root']=str(draft)
 save(ind/'input-manifest.json',input_manifest)
 save(ind/'manifest-path-relocation.json',{'source':str(IND/'input-manifest.json'),'source_sha256':sha(IND/'input-manifest.json'),'only_changes':{k:{'before':original_manifest[k],'after':input_manifest[k]} for k in ['application_root','draft_root']},'protocol_pin_sha_fields_unchanged':True,'scripts_fixtures_expectations_unchanged':True})
 pin(IND/'retained-input-probes.json');copy(IND/'retained-input-probes.json',ind/'retained-input-probes.json')
 runs=[]
 for name,source,result_name,count,where,args in scripts:
  script=stage/where/source.name;copy(source,script);assert sha(source)==sha(script)
  trace=stage/(name+'-trace.json')
  env={**os.environ,'SACTCHECK_ROOT':str(runtime),'SACTCHECK_DRAFT_ROOT':str(draft),'REPLAY_RUNTIME':str(runtime),'REPLAY_TRACE':str(trace)}
  command=['node','--require',str(OUT/'trace-assess.cjs'),str(script),*args]
  proc=subprocess.run(command,cwd=stage,env=env,capture_output=True,text=True,timeout=60)
  log=stage/(name+'.log');log.write_text(proc.stdout+proc.stderr)
  result=stage/where/result_name;report=read(result) if result.exists() else {}
  runs.append({'name':name,'original_accepted_cases':count,'command':command,'script_sha256':sha(source),'expectations_changed':False,'exit_code':proc.returncode,'passed':report.get('passed'),'failed':report.get('failed'),'total':len(report.get('results',[])),'report':str(result),'report_sha256':sha(result) if result.exists() else None,'log':str(log),'trace':str(trace),'trace_sha256':sha(trace) if trace.exists() else None})
  print(label,name,runs[-1]['passed'],runs[-1]['failed'],flush=True)
 stages.append({'name':label,'protocols':candidates,'runs':runs})
 save(OUT/'replay-progress.json',stages)
for path,h in tracked.items():assert sha(pathlib.Path(path))==h,'Original changed: '+path
save(OUT/'authenticated-replay-manifest.json',{'scope':'Unchanged original1283 author +225 independent assertions; no grading applied','notes':['Original repository-byte assertions run against separately authenticated original application protocol bytes in a shadow application, not the live app.','Current runtime JavaScript is pinned unchanged.','Independent manifests relocate only runtime/draft roots; case inputs and expectations and script bytes unchanged.','Additional exhaustive-coverage failure rows can increase raw report row count; never count as new clinical cases.'],'application_and_originals_unchanged':True,'clinical_approval':False,'pharmacy_approval':False,'tracked_input_hashes':tracked,'stages':stages})
