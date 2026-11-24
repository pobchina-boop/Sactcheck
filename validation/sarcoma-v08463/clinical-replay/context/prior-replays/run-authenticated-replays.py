#!/usr/bin/env python3
"""Replay exact historical scripts in isolated stages; never change assertions/fixtures."""
import hashlib,json,os,pathlib,shutil,subprocess,datetime
OUT=pathlib.Path(__file__).resolve().parent
HOME=OUT.parent.parent
APP=HOME/'Sactcheck'
AUTHOR=HOME/'sarcoma-batch4-drafts-20261118'
INDEPENDENT=HOME/'sarcoma-batch4-independent-draft-review-20261118'
HANDOFF=HOME/'sarcoma-v63-v64-integration-handoff-20261118/0.84.63'
CHECKPOINT=HANDOFF/'evidence/original-clinical-checkpoint.json'
def read(p):return json.loads(p.read_text())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def save(p,obj):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(obj,indent=2)+'\n')
def copy(src,dest):dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dest)
checkpoint=read(CHECKPOINT)
tracked={}
def track(p):tracked[str(p)]=sha(p)
track(CHECKPOINT)
for p in APP.joinpath('js').glob('*.js'):track(p)
for row in checkpoint['protocols']:track(APP/row['repository_relative_path'])
for suite in checkpoint['suites']:
 for key,hkey in [('script','script_sha256'),('result','result_sha256')]:
  p=AUTHOR/suite[key];assert sha(p)==suite[hkey],str(p);track(p)
for name in ['independent-cases.cjs','input-manifest.json','original-results.json','current-results.json','evidence-manifest.json']:
 track(INDEPENDENT/name)
prior_independent=read(INDEPENDENT/'current-results.json')
assert prior_independent['total']==197 and prior_independent['passed']==197
for p in [AUTHOR/'mifamurtide-ifos-draft-manifest.json',AUTHOR/'map-doxocis-draft-manifest.json']:track(p)
records=[]
for label in ['original-clinical','accepted-before','corrected-after']:
 stage=OUT/label
 assert not stage.exists(),f'Refusing to overwrite prior replay: {stage}'
 runtime=stage/'Sactcheck';draft=stage/'drafts';ind=stage/'independent'
 shutil.copytree(APP/'js',runtime/'js')
 draft.mkdir();ind.mkdir()
 candidates=[]
 for row in checkpoint['protocols']:
  code=row['code'];filename=pathlib.Path(row['draft_path']).name
  archived=(AUTHOR/'original-protocols'/filename) if code in ['00100','00596','00680'] else AUTHOR/'map-doxocis-freeze-20261118/original-application'/row['repository_relative_path']
  assert sha(archived)==row['baseline_sha256'];track(archived)
  copy(archived,runtime/row['repository_relative_path'])
  if label=='original-clinical':src=AUTHOR/row['draft_path'];assert sha(src)==row['draft_sha256']
  elif label=='corrected-after' and code in ['00100','00596','00680']:src=OUT.parent/'candidate'/filename
  else:src=HANDOFF/'40-final-candidate'/filename
  track(src);copy(src,draft/row['draft_path'])
  candidates.append({'code':code,'source':str(src),'source_sha256':sha(src),'stage_path':str(draft/row['draft_path'])})
 for name in ['mifamurtide-ifos-draft-manifest.json','map-doxocis-draft-manifest.json']:copy(AUTHOR/name,draft/name)
 for name in ['independent-cases.cjs','input-manifest.json']:copy(INDEPENDENT/name,ind/name)
 runs=[]
 suites=[{'name':'author-'+str(s['passed']), 'script':s['script'],'result':s['result'],'expected_count':s['passed'],'dir':draft,'source':AUTHOR/s['script'],'args':[]} for s in checkpoint['suites']]
 suites.append({'name':'independent-197','script':'independent-cases.cjs','result':'current-results.json','expected_count':197,'dir':ind,'source':INDEPENDENT/'independent-cases.cjs','args':['--current']})
 for s in suites:
  copy(s['source'],s['dir']/s['script'])
  assert sha(s['source'])==sha(s['dir']/s['script'])
  trace=stage/(s['name']+'-trace.json')
  env={**os.environ,'SACTCHECK_ROOT':str(runtime),'SACTCHECK_DRAFT_ROOT':str(draft),'REPLAY_RUNTIME':str(runtime),'REPLAY_TRACE':str(trace)}
  proc=subprocess.run(['node','--require',str(OUT/'trace-assess.cjs'),str(s['dir']/s['script']),*s['args']],cwd=stage,env=env,capture_output=True,text=True,timeout=40)
  log=stage/(s['name']+'.log');log.write_text(proc.stdout+proc.stderr)
  result=s['dir']/s['result'];report=read(result) if result.exists() else None
  runs.append({'name':s['name'],'expected_original_case_count':s['expected_count'],'script':str(s['dir']/s['script']),'script_sha256':sha(s['source']),'unchanged_script_bytes':True,'fixtures_changed':False,'expectations_changed':False,'exit_code':proc.returncode,'log':str(log),'log_sha256':sha(log),'report':str(result) if result.exists() else None,'report_sha256':sha(result) if result.exists() else None,'passed':report.get('passed') if report else None,'failed':report.get('failed') if report else None,'trace':str(trace),'trace_sha256':sha(trace) if trace.exists() else None})
  print(label,s['name'],runs[-1]['passed'],runs[-1]['failed'],flush=True)
 records.append({'stage':label,'protocols':candidates,'runs':runs})
for p,h in tracked.items():assert sha(pathlib.Path(p))==h,'Source changed during run: '+p
save(OUT/'authenticated-replay-manifest.json',{'date':'2026-11-18','scope':'Exact original 347 + 303 author and 197 independent assertions, no fixture/expectation transformations','note':'Historical repository-byte assertions execute against explicitly staged authenticated original application protocols; actual current app bytes separately pinned and checked unchanged. Current unchanged runtime JS copied for each stage. Trace wrapper records actual engine outputs without modifying inputs or results.','originals_and_application_unchanged':True,'original_case_count_correction':'Accepted checkpoint states 347 + 303 = 650. Superseded 292 MAP snapshot is retained, not counted as accepted650.','clinical_approval':False,'pharmacy_approval':False,'runtime_and_original_hashes':tracked,'stages':records})
