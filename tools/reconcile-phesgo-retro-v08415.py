"""Apply source-attributed audit proposals, retaining stable protocol identifiers."""
from pathlib import Path
import json
R=Path(__file__).resolve().parents[1]
def read(p):return json.loads((R/p).read_text())
advanced={x['code']:x for x in read('validation/phesgo-retro-v08415/advanced/proposed-changes.json')['proposals']}
early=read('validation/phesgo-retro-v08415/early/proposed-corrections.json')
for folder,changes in [('advanced',advanced),('early',early)]:
 for code,change in changes.items():
  p=next((R/'protocols/breast').glob(code+'-*.json'));d=json.loads(p.read_text())
  d['input_definitions'].update(change.get('input_definitions_upsert',change.get('input_definitions',{})))
  repl=change.get('rules_replace_by_id',change.get('replace_rules',{}))
  if isinstance(repl,dict):repl=list(repl.values())
  for rule in repl+change.get('rules_append',change.get('add_rules',[])):
   existing=next((i for i,x in enumerate(d['rule_engine']['rules']) if x['rule_id']==rule['rule_id']),None)
   if existing is None:d['rule_engine']['rules'].append(rule)
   else:d['rule_engine']['rules'][existing]=rule
  if 'treatment_phases_replace' in change:d['treatment_phases']=change['treatment_phases_replace']
  d['metadata'].update(sactcheck_encoding_version='0.84.15',source_checked_date='2026-10-21',source_version_verified_date='2026-10-21',retrospective_review_v08415=dict(checked='2026-10-21',clinical_use_authorised=False,status='Source reconciliation; independent oncology/pharmacy approval pending',audit_folder=f'validation/phesgo-retro-v08415/{folder}'))
  p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
  print('Reconciled',code)
