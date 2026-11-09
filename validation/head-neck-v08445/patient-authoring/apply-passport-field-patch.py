"""Patch only agent symptom-key lists; preserve risks, descriptions and user/root edits."""
from pathlib import Path
import argparse,json
HERE=Path(__file__).resolve().parent
p=argparse.ArgumentParser();p.add_argument('--root',type=Path,default=HERE.parents[2]);p.add_argument('--apply',action='store_true');a=p.parse_args()
for route,fields in json.loads((HERE/'passport-symptom-field-patch.json').read_text()).items():
    target=a.root/('data/patient-knowledge-contexts/'+route+'.json' if '/' in route else 'data/patient-knowledge/'+route+'.json')
    data=json.loads(target.read_text())
    for agent in data['agents']:
        if agent['id'] in fields['agents']:agent['symptoms']=fields['agents'][agent['id']]
    if a.apply:target.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
    print(('Applied' if a.apply else 'Would apply')+' agent symptom-key lists only: '+route)
