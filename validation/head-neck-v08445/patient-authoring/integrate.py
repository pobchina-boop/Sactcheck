"""Apply the reviewed proposals. Dry run by default; --apply writes source JSON only.

Does not touch the registry, shared generators, portal layout or generated patient assets.
The release owner wires these, generates exact-route QR codes and validates all outputs.
"""
from pathlib import Path
import argparse
import copy
import json

HERE=Path(__file__).resolve().parent
parser=argparse.ArgumentParser()
parser.add_argument('--root',type=Path,default=HERE.parents[2])
parser.add_argument('--apply',action='store_true')
parser.add_argument('--kb-base',type=Path,help='Complete v0.84.45 addendum containing retrospective/GI profiles to retain')
parser.add_argument('--include-selector-stub',action='store_true')
args=parser.parse_args()
R=args.root.resolve()
def read(p):return json.loads(p.read_text())
def write(p,d):
    print(('WRITE ' if args.apply else 'WOULD WRITE ')+str(p.relative_to(R)))
    if args.apply:
        p.parent.mkdir(parents=True,exist_ok=True)
        p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')

manifest=read(HERE/'manifest.json')
presentation=read(R/'data/patient-presentation-v08431.json')
for route in manifest['authored_routes']:
    d=read(HERE/'profiles'/f'{route}.json')
    target=f'data/patient-knowledge-contexts/{route}.json' if '/' in route else f'data/patient-knowledge/{route}.json'
    write(R/target,d)
    presentation['routes'][route]=target
    presentation['legacy_layout_fields'].pop(route,None)
write(R/'data/patient-presentation-v08431.json',presentation)
if args.include_selector_stub:
    write(R/'data/patient-knowledge/00385.json',read(HERE/'selector-stubs/00385.json'))
    print('REQUIRED: publish00385rootasacontextselector; never ship a root HN guide as generic cervical/bladder information.')
journeys=read(R/'data/breast-treatment-journeys-v0837.json')
journeys.update(read(HERE/'journey-updates.json'))
write(R/'data/breast-treatment-journeys-v0837.json',journeys)
support=read(HERE/'phase-support-updates.json')
base=read(R/'data/phase-support-v0838.json')
base['regimens'].update(support['regimens'])
write(R/'data/phase-support-v0838.json',base)
context_file=R/'data/phase-support-contexts-v08445.json'
contexts=read(context_file) if context_file.exists() else {'release':'0.84.45','regimens':{}}
for code,rows in support['context_regimens'].items():contexts['regimens'].setdefault(code,{}).update(rows)
write(context_file,contexts)

# Knowledge profiles with a context_id are context-only patches. This avoids replacing
# the freshly audited00207GIroot or losing another indication's knowledge content.
addendum=read(args.kb_base) if args.kb_base else {'schema_version':1,'release':'0.84.45','regimen_profiles':[],'drug_profiles':[],'evidence_records':[]}
profiles={x['protocol_id']:x for x in addendum['regimen_profiles']}
for candidate in read(HERE/'clinician-profile-proposals.json')['regimen_profiles']:
    c=copy.deepcopy(candidate); id=c['protocol_id']
    if c.get('context_id'):
        if id not in profiles:
            if '00207' in id:raise SystemExit('Provide --kb-base containing the reviewed nccp-00207-v6 GI profile; refusing to replace it.')
            profiles[id]={'protocol_id':id,'regimen_role':'Shared weekly cisplatin with radiotherapy','clinical_summary':'Select the exact cancer context. Other indications require their own authored suite.','context_profiles':[],'context_selector_required':True,'source_checked_date':'2026-11-07'}
        parent=profiles[id]
        if not parent.get('context_profiles') and '00207' in id:
            gi=copy.deepcopy(parent)
            gi.update(context_id='colorectal',context_label='Previously treated metastatic colorectal cancer')
            parent['context_profiles']=[gi]
        parent['context_profiles']=[p for p in parent.get('context_profiles',[]) if p.get('context_id')!=c['context_id']]+[c]
        parent['context_selector_required']=True
    else:profiles[id]=c
addendum.update(release='0.84.45',regimen_profiles=list(profiles.values()))
write(R/'data/regimen-knowledge-base-v08445-addendum.json',addendum)
print('Review exact patient routes, context selectors, QR generation and documents before packaging. No generated files were produced here.')
