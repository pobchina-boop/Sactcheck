from pathlib import Path
import json,hashlib,copy
B=Path(__file__).resolve().parent;W=B.parent;APP=W/'Sactcheck';NAME='00374-trabectedin-monotherapy.json';DATE='2026-11-18'
def h(p):return hashlib.sha256(p.read_bytes()).hexdigest()
rows=[]
for label,source in [('application',APP/'protocols/sarcoma'/NAME),('source_author',W/'sarcoma-batch3-drafts-20261118/protocols'/NAME)]:
 before=B/'before'/label/NAME;before.parent.mkdir(parents=True,exist_ok=True)
 if before.exists() and before.read_bytes()!=source.read_bytes():raise RuntimeError('Before source changed '+str(source))
 if not before.exists():before.write_bytes(source.read_bytes())
 old=json.loads(before.read_text());new=copy.deepcopy(old);trans=[]
 for index,rule in enumerate(new['rule_engine']['rules']):
  if rule['rule_id'] not in ['STS_CONTEXT','DEX_PREMED_REVIEW']:continue
  phase=rule['when']['all'][0];assert phase['field']=='assessment_phase'
  replacement={'field':'assessment_phase','operator':'in','value':['baseline','on_treatment','restart']}
  trans.append({'rule_id':rule['rule_id'],'path':f'/rule_engine/rules/{index}/when/all/0','before':copy.deepcopy(phase),'after':replacement})
  rule['when']['all'][0]=replacement
 assert len(trans)==2
 dest=B/'candidate'/label/NAME;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(json.dumps(new,indent=2,ensure_ascii=False)+'\n')
 # Reconstruct old JSON by reversing only the two declared conditions.
 reversed_doc=copy.deepcopy(new)
 for change in trans:
  parts=change['path'].strip('/').split('/');node=reversed_doc
  for part in parts[:-1]:node=node[int(part)] if isinstance(node,list) else node[part]
  node[int(parts[-1])]=change['before']
 assert reversed_doc==old,'Unexpected non-phase change'
 rows.append({'kind':label,'source_path':str(source),'before_path':str(before.relative_to(B)),'before_sha256':h(before),'candidate_path':str(dest.relative_to(B)),'candidate_sha256':h(dest),'old_protocol_id':old['protocol_id'],'new_protocol_id':new['protocol_id'],'transitions':trans})
manifest={'checked_date':DATE,'status':'external_two_condition_correction_not_applied','application_writes':False,'scope':'Only phase predicates for00374 STS_CONTEXT and DEX_PREMED_REVIEW; action/message/source and all other predicates unchanged','source':{'url':'https://healthservice.hse.ie/documents/6729/374_Trabectedin_monotherapy.pdf','version':'4a','indication_lines':'19–22, printed page1','premedication_lines':'178–181, printed page4','pdf_binary_verified':False,'visual_source_inspection_verified':False},'protocols':rows,'clinical_approval':False,'patient_documents_changed':False}
(B/'transition-manifest.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n');print(json.dumps(rows,indent=2))
