"""Source-specific correction: 00484 v13a p6 requires TFTs before each cycle.
Changes only the 00484/head_neck context and its proposed service rows.
"""
from pathlib import Path
import json
HERE=Path(__file__).resolve().parent;R=HERE.parents[2]
REPLACEMENTS={
 'Thyroid tests once a month and when indicated; cortisol when clinically indicated.':'Thyroid tests before each cycle and when clinically indicated; cortisol when clinically indicated.',
 'Thyroid function once a month and when clinically indicated.':'Thyroid function before each cycle and when clinically indicated.',
 'Baseline; monthly and when indicated':'Baseline; before each cycle and when clinically indicated'
}
def fix(v):
 if isinstance(v,dict):return {k:fix(x) for k,x in v.items()}
 if isinstance(v,list):return [fix(x) for x in v]
 if isinstance(v,str):
  for a,b in REPLACEMENTS.items():v=v.replace(a,b)
 return v
def read(p):return json.loads(p.read_text())
def write(p,d):p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
# Apply only scoped records; preserve unrelated contexts and root visual markers.
for p in [HERE/'profiles/00484/head_neck.json',R/'data/patient-knowledge-contexts/00484/head_neck.json']:
 d=read(p);before=d.get('visual_release');d=fix(d)
 if before:assert d['visual_release']==before
 write(p,d)
for p in [HERE/'journey-updates.json',R/'data/breast-treatment-journeys-v0837.json']:
 d=read(p);d['00484:head_neck']=fix(d['00484:head_neck']);write(p,d)
p=HERE/'clinician-profile-proposals.json';d=read(p)
for i,row in enumerate(d['regimen_profiles']):
 if row['protocol_id']=='nccp-00484-v13a' and row.get('context_id')=='head_neck':d['regimen_profiles'][i]=fix(row)
write(p,d)
for name in ['consent-proposals.json','phase-support-updates.json']:
 p=HERE/name;d=read(p)
 if name.startswith('consent'):d['00484/head_neck']=fix(d['00484/head_neck'])
 else:d['context_regimens']['00484']['head_neck']=fix(d['context_regimens']['00484']['head_neck'])
 write(p,d)
print('Corrected 00484/head_neck thyroid timing; 00483 and active KB parents untouched.')
