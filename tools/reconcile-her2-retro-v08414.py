"""Apply reviewed, source-attributed corrections. Does not confer clinical approval."""
from pathlib import Path
import json
R=Path(__file__).resolve().parents[1]
def replace_text(x,a,b):
 if isinstance(x,str):return x.replace(a,b)
 if isinstance(x,list):return [replace_text(v,a,b) for v in x]
 if isinstance(x,dict):return {k:replace_text(v,a,b) for k,v in x.items()}
 return x
for folder in ['tdm1','antibody']:
 source=R/f'validation/her2-retro-v08414/{folder}/proposed-corrections.json'
 changes=json.loads(source.read_text()) if source.exists() else json.loads((source.parent/'source-audit.json').read_text())['proposed_changes']
 for code,change in changes.items():
  p=next((R/'protocols/breast').glob(code+'-*.json'));d=json.loads(p.read_text())
  d['input_definitions'].update(change.get('input_definitions',change.get('new_input_definitions',{})))
  for rule in change.get('replace_rules',[])+change.get('add_rules',[])+change.get('new_rules',[]):
   existing=next((i for i,x in enumerate(d['rule_engine']['rules']) if x['rule_id']==rule['rule_id']),None)
   if existing is None:d['rule_engine']['rules'].append(rule)
   else:d['rule_engine']['rules'][existing]=rule
  d['metadata'].update(change.get('metadata_patch',{}))
  if 'indications' in change:d['indications']=change['indications']
  for rid,wrapper in change.get('existing_rule_condition_wrappers',{}).items():
   rule=next(x for x in d['rule_engine']['rules'] if x['rule_id']==rid)
   baseline=json.loads((R/f'validation/her2-retro-v08414/pre-change/{p.name}').read_text())
   original=next(x['when'] for x in baseline['rule_engine']['rules'] if x['rule_id']==rid)
   def inject(x):
    if x=='EXISTING_WHEN':return original
    if isinstance(x,list):return [inject(v) for v in x]
    if isinstance(x,dict):return {k:inject(v) for k,v in x.items()}
    return x
   rule['when']=inject(wrapper)
  for edit in change.get('text_replacements',[]):d=replace_text(d,edit['from'],edit['to'])
  d['metadata']['sactcheck_encoding_version']='0.84.14'
  d['metadata']['source_checked_date']='2026-10-21'
  d['metadata']['source_version_verified_date']='2026-10-21'
  d['metadata']['retrospective_review_v08414']={'checked':'2026-10-21','clinical_use_authorised':False,'status':'Source reconciliation; independent oncology/pharmacy approval pending','audit_folder':f'validation/her2-retro-v08414/{folder}'}
  p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
  print('Reconciled',code)
