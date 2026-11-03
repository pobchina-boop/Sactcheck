"""Source-specific course summaries; phase transitions remain clinical decisions."""
from pathlib import Path
import json
R=Path(__file__).resolve().parents[1];f=R/'data/regimen-card-overrides.json';d=json.loads(f.read_text())
spec={
 '00214':(21,None,'advanced_disease','Continue only while helpful and tolerated; the lung chemotherapy partner is a separate prescribed plan'),
 '00279':(21,4,'curative','Four planned cycles with radiotherapy; consultant may prescribe a 28-day interval'),
 '00309':(7,7,'curative','Seven planned weekly administrations with radiotherapy, subject to review'),
 '00372':(21,None,'advanced_disease','Up to six 21-day combination cycles; after at least four, continuation may be prescribed as continuous nintedanib in 28-day cycles'),
 '00456':(28,None,'curative','Two induction cycles; two further cycles may be prescribed after review'),
 '00561':(28,2,'curative','Two planned 28-day cycles with thoracic radiotherapy, subject to review')}
for c,(interval,n,intent,note) in spec.items():
 p=json.loads(next((R/'protocols').glob('*/'+c+'-*.json')).read_text());contexts=[]
 for indication in p['indications']:
  identifier=indication.get('indication_id') or indication.get('id')
  ctx=dict(id=identifier,indication_id=identifier,cycle_length_days=interval,intent=intent,duration_type='fixed_duration' if c=='00309' else 'phased_course' if c in ['00372','00456'] else 'fixed_cycles' if n else 'until_progression',duration_text=note)
  if n:ctx['cycles']=n
  if c=='00214' and identifier!='00214b':ctx['duration_text']='Use the source indication and prescribed partner schedule; the dedicated patient suite covers lung cancer only'
  contexts.append(ctx)
 d['protocols'][p['protocol_id']]=dict(schema_version='1.0.0',contexts=contexts,provenance=dict(method='v08430_NCCP_source_mapping',reviewed=False,source=p['metadata']['source_url'],note='Source-specific course. Optional cycles and continuation are not automatic. Independent clinical/pharmacy review pending.'))
f.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
