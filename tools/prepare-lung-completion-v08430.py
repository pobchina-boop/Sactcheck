"""Apply reviewed v0.84.30 authoring and protocol proposals to their canonical paths."""
from pathlib import Path
import json,copy,sys
R=Path(__file__).resolve().parents[1];groups=['rt21','rt28','bev-nintedanib'];regimens={};proposals=[]
for group in groups:
 base=R/'validation/lung-completion-v08430'/group
 if '--available' in sys.argv and not (base/'authoring.json').exists():continue
 d=json.loads((base/'authoring.json').read_text())
 for code,x in list(d['regimens'].items())+[(code+'/'+slug,x) for code,base in d['regimens'].items() for slug,x in base.get('patient_contexts',{}).items()]:
  patient=x['patient'];assert patient['schema_version']==1,(code,'schema_version')
  assert isinstance(patient['cycle_days'],int) and 1<=patient['cycle_days']<=56,(code,'cycle_days')
  assert patient['agents'] and patient['sources'] and patient['anatomy'],(code,'missing patient content')
  source_ids=[s['id'] for s in patient['sources']]
  assert len(source_ids)==len(set(source_ids)),(code,'duplicate patient source IDs')
  def check_sources(v):
   if isinstance(v,dict):
    for k,a in v.items():
     if k.endswith('source_ids'):assert all(t in source_ids for t in a),(code,'undeclared patient source',a)
     else:check_sources(a)
   elif isinstance(v,list):
    for a in v:check_sources(a)
  check_sources(patient)
  assert patient['evidence'].get('intro') and patient['evidence'].get('interpretation'),(code,'patient evidence wording')
  assert patient['evidence']['metrics']==[],(code,'patient numeric evidence')
  assert all(isinstance(n,dict) and n.get('title') and n.get('text') for n in patient['chronology_notes']),(code,'chronology notes')
  for day in range(1,patient['cycle_days']+1):
   assert sum(g['start']<=day<=g['end'] for g in patient['day_groups'])==1,(code,'day coverage',day)
  for key in ['title','purpose','context_label','schedule_summary','urgent_extra']:
   assert isinstance(patient[key],str) and patient[key].strip(),(code,key)
  assert all(len(row)==6 and isinstance(row[4],(int,float)) and isinstance(row[5],(int,float)) for row in patient['anatomy']),(code,'anatomy anchors')
  for lane in x['journey']['lanes']:assert len(lane['cells'])==len(x['journey']['stages']),(code,'journey columns')
  for plan in x['support_plans']:assert plan['active_medicines'] and isinstance(plan['medicines'],list),(code,'support plan')
 regimens.update(d['regimens'])
 for code in d['regimens']:
  proposal=next((base/'proposed').glob(code+'-*.json'));target=next((R/'protocols').glob('*/'+code+'-*.json'));p=json.loads(proposal.read_text())
  for key,v in p['input_definitions'].items():
   values=[x['value'] if isinstance(x,dict) else x for x in v.get('options',[])];assert len(values)==len(set(map(str,values))),f'{code}/{key}: duplicate options'
  proposals.append((target,p))
assert len(regimens)==6 or ('--available' in sys.argv and 0<len(regimens)<6)
for target,p in proposals:target.write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n')
(R/'data/lung-completion-v08430-authoring.json').write_text(json.dumps(dict(release='0.84.30',source_checked='2026-11-02',regimens=regimens),ensure_ascii=False,indent=2)+'\n')
print(f'Prepared {len(regimens)} canonical protocol proposals and authored service records.')
