"""Catalogue course metadata for five new suites; preserve existing tissue contexts."""
from pathlib import Path
import json
R=Path(__file__).resolve().parents[1];f=R/'data/regimen-card-overrides.json';d=json.loads(f.read_text())
for c in ['00284','00311','00587','00388','00614']:
 p=json.loads(next((R/'protocols').glob('*/'+c+'-*.json')).read_text());contexts=[]
 for indication in p['indications']:
  identifier=indication.get('indication_id') or indication.get('id');finite=6 if c in ['00311','00587'] or (c=='00284' and identifier=='00284a') else 4 if c=='00614' else None
  ctx=dict(id=identifier,indication_id=identifier,cycle_length_days=28 if c=='00284' else 21,intent='adjuvant' if c=='00284' and identifier=='00284a' else 'advanced_disease',duration_type='fixed_cycles' if finite else 'until_progression',duration_text=f'Up to {finite} cycles, subject to review' if finite else 'Until progression or unacceptable toxicity; prescribed schedule must be confirmed')
  if finite:ctx['cycles']=finite
  if c=='00388':ctx['duration_text']='Three alternative oral schedules; repeat only as prescribed, with ongoing benefit and safety review'
  contexts.append(ctx)
 d['protocols'][p['protocol_id']]=dict(schema_version='1.0.0',contexts=contexts,provenance=dict(method='v08429_NCCP_source_mapping',reviewed=False,source=p['metadata']['source_url'],note='Source-specific duration and indication. Independent clinical/pharmacy review pending.'))
f.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
