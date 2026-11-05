"""Incremental fixes; preserve concurrent root support/metadata changes."""
from pathlib import Path
import json
R=Path(__file__).resolve().parents[3]
for c in ['00555','00783','00691']:
 f=next((R/'protocols/gastrointestinal').glob(c+'-*.json'));p=json.loads(f.read_text())
 for ph in p['treatment_phases']:
  ph['active_drugs']=[x['drug'] for x in ph['administration']]
  ph['label']=ph['name']
  if isinstance(ph.get('cycles'),list):ph['maximum_cycles']=len(ph['cycles'])
  for ad in ph['administration']:
   day=ad.pop('day',None)
   if day is not None:ad['days']=[1,2,3,4,5] if day=='1-5' else [day]
 def a(f,o,v=None):return dict(field=f,operator=o,value=v)
 def all_(*x):return dict(all=list(x))
 def any_(*x):return dict(any=list(x))
 for rule in p['rule_engine']['rules']:
  if rule['id']=='SEVERE_NEUTROPENIC_CONTEXT':rule['when']=all_(rule['when'],a('neutropenic_event_occurrence','missing'))
  if rule['id']=='CAPE_G2_3_CONTEXT':rule['when']=all_(rule['when'],any_(a('capecitabine_occurrence','missing'),a('capecitabine_current_grade','missing')))
  if c=='00555' and rule['id']=='UGT1A1_HOMOZYGOUS_OR_GILBERT':
   rule['action']['message']=rule['action']['recommendation']=rule['explanation']='Gilbert syndrome increases irinotecan toxicity risk; consider a reduced initial irinotecan dose with the consultant. The current source gives no fixed percentage.'
   p['input_definitions']['ugt1a1_homozygous_or_gilbert']['label']='Gilbert syndrome / reduced UGT1A1 activity requiring irinotecan review'
 def clean(o):
  if isinstance(o,dict):
   for k,v in o.items():
    if isinstance(v,str) and k in ['label','message','recommendation','explanation']:o[k]=v.replace('UGT 1 A 1','UGT1A1').replace('5 FU','5-FU')
    else:clean(v)
  elif isinstance(o,list):
   for x in o:clean(x)
 clean(p)
 f.write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n')
