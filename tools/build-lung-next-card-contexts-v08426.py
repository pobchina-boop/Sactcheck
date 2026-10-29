"""Keep source-specific indications and continuous oral schedules on catalogue cards."""
from pathlib import Path
import json
R=Path(__file__).resolve().parents[1]
f=R/'data/regimen-card-overrides.json';d=json.loads(f.read_text())
a=json.loads((R/'data/lung-next-v08426-authoring.json').read_text())['regimens']
for code,x in a.items():
 p=json.loads(next((R/'protocols').glob('*/'+code+'-*.json')).read_text())
 contexts=x.get('card_contexts')
 if code in ['00455','00558','00576','00655','00689']:
  # Preserve all established cross-tissue card contexts; explicit changes only.
  if not contexts:continue
  old=d['protocols'].get(p['protocol_id'],{}).get('contexts',[])
  by_id={q['id']:q for q in old};by_id.update({q['id']:q for q in contexts});contexts=list(by_id.values())
 if not contexts:
  contexts=[]
  for i in p['indications']:
   identifier=i.get('indication_id') or i.get('id') or i.get('code')
   contexts.append(dict(id=identifier,indication_id=identifier,cycle_length_days=x['patient']['cycle_days'],intent='advanced_disease',duration_type='until_progression',duration_text='Until progression or unacceptable toxicity'))
 if x['patient'].get('schedule_kind')=='continuous_oral':
  for context in contexts:context['source_schedule_interval_label']='Continuous daily'
 d['protocols'][p['protocol_id']]=dict(schema_version='1.0.0',contexts=contexts,provenance=dict(method='v08426_NCCP_source_mapping',reviewed=False,source=p['metadata']['source_url'],note='Indication-specific source context; continuous oral therapy has no invented chemotherapy cycle. Independent clinical/pharmacy review pending.'))
f.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
print('Updated ten indication-aware catalogue contexts.')
