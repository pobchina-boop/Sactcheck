"""Carry source-specific lung treatment durations into catalogue cards."""
from pathlib import Path
import json
R=Path(__file__).resolve().parents[1];f=R/'data/regimen-card-overrides.json';d=json.loads(f.read_text());codes=json.loads((R/'data/lung-core-v08422-source-index.json').read_text())['codes']
for c in codes:
 p=json.loads(next((R/'protocols').glob('*/'+c+'-*.json')).read_text());m=p['metadata'];contexts=[]
 for ind in p['indications']:
  ident=ind.get('id') or ind.get('indication_id') or ind.get('code');desc=ind.get('description','').lower();canonical=ind.get('code');row=dict(id=ident,indication_id=ident,cycle_length_days=p.get('treatment',{}).get('cycle_length_days',21))
  if c in ['00455','00558']:
   if 'adjuvant' in desc and 'neoadjuvant' not in desc:row.update(intent='adjuvant',duration_text='Up to 12 months')
   elif canonical:row.update(intent='advanced_disease',duration_text='Until progression/toxicity; individual 24-month review')
   else:row.update(duration_text='Choose the specific NCCP indication',requires_review=['intent','duration'])
  elif c in ['00317','00318']:
   row['cycle_length_days']=21;row['duration_type']='cycle_range'
   if ident in ['mesothelioma','00318a']:row.update(intent='advanced_disease',duration_text='Maximum 4–6 cycles')
   elif ident=='advanced_nsclc':row.update(intent='advanced_disease',duration_text='4–6 cycles; separate pemetrexed maintenance review')
   elif ident=='neoadjuvant_nsclc_nivolumab':row.update(intent='neoadjuvant',duration_text='3 cycles with separate nivolumab plan')
   else:row.update(duration_text='Choose the specific NCCP indication',requires_review=['intent','duration'])
  elif c in ['00576','00655']:row.update(intent='consolidation',duration_type='fixed_duration',duration_text='Maximum 12 months ('+('26' if c=='00576' else '13')+' cycles)')
  elif c in ['00569','00579']:row.update(intent='advanced_disease',duration_type='phased_course',duration_text='Up to 4 induction cycles, then maintenance')
  elif c in ['00713','00714']:row.update(intent='advanced_disease',duration_type='phased_course',cycle_length_days=42,duration_text='Maximum 24 months; chemotherapy in first 42-day cycle')
  contexts.append(row)
 d['protocols'][p['protocol_id']]=dict(schema_version='1.0.0',contexts=contexts,provenance=dict(method='v08422_NCCP_source_mapping',reviewed=False,source=m['source_url'],note='Indication-specific course metadata; independent clinical/pharmacy review pending.'))
f.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
