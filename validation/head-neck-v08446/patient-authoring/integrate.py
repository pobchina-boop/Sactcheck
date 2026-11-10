"""Integrate source proposals only. Dry run by default; no generated assets or remote writes.
--kb-base must contain the reviewed complete parent profiles (including retrospective changes).
Without --kb-base, KB integration is deliberately left to the release owner.
"""
from pathlib import Path
import argparse,copy,json
HERE=Path(__file__).resolve().parent
p=argparse.ArgumentParser();p.add_argument('--root',type=Path,default=HERE.parents[2]);p.add_argument('--apply',action='store_true');p.add_argument('--kb-base',type=Path);a=p.parse_args();R=a.root.resolve()
def read(p):return json.loads(p.read_text())
def write(p,d):
 print(('WRITE ' if a.apply else 'WOULD WRITE ')+str(p.relative_to(R)))
 if a.apply:p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
m=read(HERE/'manifest.json');presentation=read(R/'data/patient-presentation-v08431.json')
for route in m['authored_routes']:
 dest='data/patient-knowledge-contexts/'+route+'.json'
 write(R/dest,read(HERE/'profiles'/f'{route}.json'))
 presentation['routes'][route]=dest;presentation['legacy_layout_fields'].pop(route,None)
write(R/'data/patient-presentation-v08431.json',presentation)
j=read(R/'data/breast-treatment-journeys-v0837.json');j.update(read(HERE/'journey-updates.json'));write(R/'data/breast-treatment-journeys-v0837.json',j)
f=R/'data/phase-support-contexts-v08446.json';s=read(f) if f.exists() else dict(release='0.84.46',regimens={})
for code,contexts in read(HERE/'phase-support-updates.json')['context_regimens'].items():s['regimens'].setdefault(code,{}).update(contexts)
write(f,s)
if a.kb_base:
 kb=read(a.kb_base);parents={x['protocol_id']:x for x in kb['regimen_profiles']}
 for row in read(HERE/'clinician-profile-proposals.json')['regimen_profiles']:
  pid=row['protocol_id']
  if pid not in parents:raise ValueError('Missing complete parent profile in --kb-base: '+pid)
  parent=parents[pid]
  if not parent.get('context_profiles'):
   baseline=copy.deepcopy(parent);baseline.update(context_id='breast' if '00261' in pid else 'lung',context_label='Existing breast service' if '00261' in pid else 'Existing lung service')
   parent['context_profiles']=[baseline]
  parent['context_profiles']=[x for x in parent['context_profiles'] if x.get('context_id')!='head_neck']+[row]
  parent['context_selector_required']=True
 kb.update(release='0.84.46',regimen_profiles=list(parents.values()));write(R/'data/regimen-knowledge-base-v08446-addendum.json',kb)
else:print('KB NOT WRITTEN: merge clinician-profile-proposals.json context rows into reviewed complete parents, preserving all existing context_profiles.')
print('Source integration only. Generate route QR images, journey runtime, HTML, PDFs and validation separately.')
