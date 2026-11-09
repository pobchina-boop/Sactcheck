"""Narrowly apply corrected investigation fields; preserve all other profile edits."""
from pathlib import Path
import argparse,json
HERE=Path(__file__).resolve().parent
p=argparse.ArgumentParser();p.add_argument('--root',type=Path,default=HERE.parents[2]);p.add_argument('--apply',action='store_true');a=p.parse_args()
for route,fields in json.loads((HERE/'monitoring-test-details-field-patch.json').read_text()).items():
    target=a.root/('data/patient-knowledge-contexts/'+route+'.json' if '/' in route else 'data/patient-knowledge/'+route+'.json')
    data=json.loads(target.read_text())
    data.update(fields)
    if a.apply:target.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
    print(('Applied' if a.apply else 'Would apply')+' monitoring_test_details only: '+route)
