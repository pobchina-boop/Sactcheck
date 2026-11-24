from pathlib import Path
import json,hashlib,copy,shutil
r=Path.cwd();a=r/'validation/sarcoma-v08464/patient-authoring';payload=a/'source-payload';v=r/'validation/sarcoma-v08464'
h=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda p:json.loads(p.read_text())
expected={'integrated-protocol-transitions.json':'1177aa51e8316c585d5af335264b8027b689551df1480d9b80bc52c95a4fe1d2','grading-definition-transitions.json':'63fc56920d4814b5eb6687595c82a6599b5ab3bf073f5f91bee49fd87af5245b','clinical/final-installed-protocols.json':'aecb54291d66099cd7b7c8183045b007ad0f0045d9a27df7e8fb60bfeeb492d4'}
for n,s in expected.items():assert h(v/n)==s,n
metadata=read(v/'integrated-protocol-transitions.json');grading=read(v/'grading-definition-transitions.json');final=read(v/'clinical/final-installed-protocols.json');manifest=read(payload/'manifest.json')
assert not manifest['application_clinical_freeze_ready'];assert final['metadata_transition_sha256']==h(v/'integrated-protocol-transitions.json');assert final['grading_transition_sha256']==h(v/'grading-definition-transitions.json')
evidence=set(v/n for n in expected)
for obj,pairs in [(metadata,[('source_handoff_path','source_handoff_sha256'),('source_acceptance_path','source_acceptance_sha256')]),(grading,[('source_replacements_path','source_replacements_sha256'),('source_freeze_path','source_freeze_sha256'),('independent_acceptance_path','independent_acceptance_sha256')])]:
 for f,s in pairs:assert h(r/obj[f])==obj[s];evidence.add(r/obj[f])
assert metadata['source_acceptance_sha256']=='9a6f1b13b34f3f92c8d25b09c8c89745b3c0b50e79a706eb416017d773d40824'
assert grading['independent_acceptance_sha256']=='4407d823b0cbcff7c8cc4921f8c3ff2946ea30412d55fcf16ff89c83c0cc0d27'
replacements=read(r/grading['source_replacements_path'])['replacements'];approved={(x['code'],x['input_id']):x for x in replacements};assert len(approved)==40
md={x['code']:x for x in metadata['records']};gd={x['code']:x for x in grading['records']};fd={x['code']:x for x in final['protocols']};proof=[];fields=0
for c,item in manifest['clinical_inputs'].items():
 g,m,f=gd[c],md[c],fd[c];raw=payload/item['path'];assert h(raw)==item['sha256']==g['before_sha256'];before=read(raw)
 assert h(r/g['before_snapshot_path'])==g['before_sha256'];assert read(r/g['before_snapshot_path'])==before
 current=copy.deepcopy(before)
 for e in g['edits']:
  p=e['path'];assert len(p)==2 and p[0]=='input_definitions';contract=approved[(c,p[1])];assert contract['accepted_protocol_sha256']==g['before_sha256'];assert e['before']==contract['before'] and e['after']==contract['after'];assert current[p[0]][p[1]]==e['before']
  for k in ['type','label','required','demo_value','input_role']:assert e['before'].get(k)==e['after'].get(k),(c,p,k)
  # Reviewed option descriptions are part of the exact educational metadata replacement.
  option_contract=lambda opts:[{k:v for k,v in opt.items() if k!='description'} for opt in opts] if opts is not None else None
  assert option_contract(e['before'].get('options'))==option_contract(e['after'].get('options')),(c,p,'option values/labels')
  current[p[0]][p[1]]=copy.deepcopy(e['after']);fields+=1
 assert h(r/g['after_snapshot_path'])==g['after_sha256']==m['before_sha256'];assert current==read(r/g['after_snapshot_path']);assert current.get('rules')==before.get('rules')
 for e in m['edits']:
  p=e['path'];assert p[0]=='metadata' or p==['clinical_governance','disclaimer'];target=current
  for key in p[:-1]:target=target[key]
  assert (p[-1] in target)==e['before_exists'] and target.get(p[-1])==e['before'],(c,p)
  target[p[-1]]=copy.deepcopy(e['after'])
 assert current==read(r/f['path']);assert h(r/f['path'])==f['sha256']==m['after_sha256'];assert current['protocol_id']==item['protocol_id'];assert str(current['metadata']['nccp_version'])==item['version'];assert current.get('rules')==before.get('rules')
 for field in ['schedule','regimen','drug_components','administration','dose_modifications']:
  assert current.get(field)==before.get(field),(c,field)
 for key in ['source_proposal_path','source_text_path']:
  assert h(r/m[key])==m[key.replace('_path','_sha256')];evidence.add(r/m[key])
 evidence.add(r/g['before_snapshot_path']);evidence.add(r/g['after_snapshot_path'])
 proof.append({'code':c,'raw_accepted_sha256':h(raw),'accepted_graded_sha256':g['after_sha256'],'final_installed_sha256':f['sha256'],'grading_definitions':len(g['edits']),'enumerated_metadata_edits':len(m['edits']),'exact_whole_file_replay_match':True,'rules_doses_values_defaults_and_identity_unchanged':True})
assert fields==40
integration=payload/'integration-final';assert not integration.exists();integration.mkdir()
# Preserve the complete original manifest and every original source file before promotion.
shutil.copy2(payload/'manifest.json',integration/'source-payload-manifest-before.json')
evidence_records=[]
for src in sorted(evidence):
 relative=src.relative_to(v);dst=integration/'evidence'/relative;dst.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dst);evidence_records.append({'path':dst.relative_to(payload).as_posix(),'sha256':h(dst)})
(integration/'chain-verification.json').write_text(json.dumps({'status':'passed','protocols':proof,'exact_reviewed_grading_definitions':fields,'unchanged_original_inputs_preserved':True,'software_source_acceptance_only':True,'independent_clinical_approval':False},indent=2)+'\n');evidence_records.append({'path':'integration-final/chain-verification.json','sha256':h(integration/'chain-verification.json')})
for c,item in manifest['clinical_inputs'].items():
 f=fd[c];src=r/f['path'];dst=integration/'final-protocols'/src.name;dst.parent.mkdir(exist_ok=True);shutil.copy2(src,dst)
 item['path']=dst.relative_to(payload).as_posix();item['sha256']=h(dst);item['exact_integrated_pin']=True;item['accepted_transition_evidence']=evidence_records
manifest['application_clinical_freeze_ready']=True;manifest['clinical_freeze_status']='Five exact installed whole-file pins authenticated through accepted40grading definitions and enumerated metadata transitions. Originalsource candidates and priorpayloadmanifest remain immutable.'
manifest['files']={p.relative_to(payload).as_posix():h(p) for p in sorted(payload.rglob('*')) if p.is_file() and p!=payload/'manifest.json'}
(payload/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'verified_protocols':len(proof),'grading_definitions':fields,'payload_manifest_sha256':h(payload/'manifest.json'),'chain_verification_sha256':h(integration/'chain-verification.json'),'clinical_apply_ready':True},indent=2))
