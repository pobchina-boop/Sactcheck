"""Apply reviewed v0.84.25 authoring and protocol proposals to their canonical paths."""
from pathlib import Path
import json,copy,sys
R=Path(__file__).resolve().parents[1];groups=['tepotinib','entrectinib','egfr','ceritinib','taxanes','vino-bev'];regimens={};proposals=[]
for group in groups:
 base=R/'validation/targeted-lung-v08425'/group
 if '--available' in sys.argv and not (base/'authoring.json').exists():continue
 d=json.loads((base/'authoring.json').read_text());regimens.update(d['regimens'])
 for code in d['regimens']:
  proposal=next((base/'proposed').glob(code+'-*.json'));target=next((R/'protocols').glob('*/'+code+'-*.json'));p=json.loads(proposal.read_text())
  for key,v in p['input_definitions'].items():
   values=[x['value'] if isinstance(x,dict) else x for x in v.get('options',[])];assert len(values)==len(set(map(str,values))),f'{code}/{key}: duplicate options'
  proposals.append((target,p))
assert len(regimens)==10 or ('--available' in sys.argv and 0<len(regimens)<10)
for target,p in proposals:target.write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n')
(R/'data/targeted-lung-v08425-authoring.json').write_text(json.dumps(dict(release='0.84.25',source_checked='2026-10-29',regimens=regimens),ensure_ascii=False,indent=2)+'\n')
print(f'Prepared {len(regimens)} canonical protocol proposals and authored service records.')
