#!/usr/bin/env python3
"""Append accepted metadata-only stage; keep both prior replay stages immutable."""
import pathlib,json,hashlib,shutil,subprocess,os
O=pathlib.Path(__file__).resolve().parent;H=O.parent
def read(p):return json.loads(p.read_text())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def save(p,d):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d,indent=2)+'\n')
proposal=H/'sarcoma-v64-grading-metadata-proposals-20261118/all-input-replacements.json'
acceptance=H/'sarcoma-v64-grading-metadata-independent-review-20261118/independent-results.json'
assert sha(proposal)=='11ab0be6d5d155215a06ede2087adc1081bee72e5ed3f7af6072063b1ddf4148'
assert sha(acceptance)=='4407d823b0cbcff7c8cc4921f8c3ff2946ea30412d55fcf16ff89c83c0cc0d27'
base=O/'final-pregrading';stage=O/'final-graded';assert not stage.exists()
tracked={str(p):sha(p) for p in O.rglob('*') if p.is_file()}
shutil.copytree(base/'Sactcheck',stage/'Sactcheck')
shutil.copytree(base/'drafts/protocols',stage/'drafts/protocols')
for n in ['test-ie-vac-draft.cjs','iri-tmz-ivado-vit-cases.cjs','ie-vac-draft-manifest.json','iri-tmz-ivado-vit-manifest.json']:shutil.copy2(base/'drafts'/n,stage/'drafts'/n)
(stage/'independent').mkdir()
for n in ['independent-cases.cjs','retained-input-cases.cjs','retained-input-probes.json']:shutil.copy2(base/'independent'/n,stage/'independent'/n)
pin=read(base/'independent/input-manifest.json');beforepin=json.loads(json.dumps(pin));pin['application_root']=str(stage/'Sactcheck');pin['draft_root']=str(stage/'drafts');save(stage/'independent/input-manifest.json',pin)
save(stage/'independent/manifest-path-relocation.json',{'source_sha256':sha(base/'independent/input-manifest.json'),'only_changes':{k:{'before':beforepin[k],'after':pin[k]} for k in ['application_root','draft_root']},'scripts_fixtures_expectations_unchanged':True})
changes=[];pps={}
for r in read(proposal)['replacements']:
 code=r['code'];f=next((stage/'drafts/protocols').glob(code+'-*.json'));p=pps.setdefault(code,read(f));assert p['input_definitions'][r['input_id']]==r['before'];p['input_definitions'][r['input_id']]=r['after'];changes.append({'code':code,'json_path':r['json_path'],'before':r['before'],'after':r['after']})
candidates=[]
for f in (stage/'drafts/protocols').glob('*.json'):
 code=f.name[:5];before=read(f);p=pps[code];b={k:v for k,v in before.items() if k!='input_definitions'};a={k:v for k,v in p.items() if k!='input_definitions'};assert a==b
 save(f,p);candidates.append({'code':code,'path':str(f),'before_sha256':sha(base/'drafts/protocols'/f.name),'sha256':sha(f)})
save(O/'grading-transition.json',{'proposal_sha256':sha(proposal),'independent_acceptance_sha256':sha(acceptance),'changed_definitions':40,'all_other_protocol_json_unchanged':True,'changes':changes,'candidates':candidates,'application_writes':False})
prior=read(O/'authenticated-replay-manifest.json')['stages'][1];runs=[]
for r in prior['runs']:
 name=r['name'];where='drafts' if name.startswith('author') else 'independent';script=stage/where/pathlib.Path(r['command'][3]).name;args=['--current'] if where=='independent' else [];trace=stage/(name+'-trace.json')
 env={**os.environ,'SACTCHECK_ROOT':str(stage/'Sactcheck'),'SACTCHECK_DRAFT_ROOT':str(stage/'drafts'),'REPLAY_RUNTIME':str(stage/'Sactcheck'),'REPLAY_TRACE':str(trace)}
 command=['node','--require',str(O/'trace-assess.cjs'),str(script),*args]
 proc=subprocess.run(command,cwd=stage,env=env,capture_output=True,text=True,timeout=60);log=stage/(name+'.log');log.write_text(proc.stdout+proc.stderr);report=stage/where/pathlib.Path(r['report']).name;d=read(report)
 parity=read(trace)==read(base/(name+'-trace.json'))
 runs.append({'name':name,'command':command,'script_sha256':sha(script),'exit_code':proc.returncode,'passed':d['passed'],'failed':d['failed'],'total':len(d['results']),'report':str(report),'report_sha256':sha(report),'trace':str(trace),'trace_sha256':sha(trace),'exact_clinical_and_dose_trace_parity_to_pregrading':parity});assert parity,name
 print(name,d['passed'],d['failed'],'exact_trace_parity',parity,flush=True)
for f,h in tracked.items():assert sha(pathlib.Path(f))==h,'Prior changed '+f
save(O/'graded-replay-manifest.json',{'status':'accepted_definition_transition_with_exact_clinical_dose_parity','clinical_approval':False,'all_prior_files_unchanged':True,'protocols':candidates,'runs':runs,'proposal_sha256':sha(proposal),'independent_acceptance_sha256':sha(acceptance),'grading_checks_not_recounted':True})
