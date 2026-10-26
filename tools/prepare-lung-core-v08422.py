"""Apply reviewed v0.84.22 authoring and protocol proposals to their canonical paths."""
from pathlib import Path
import json,copy
R=Path(__file__).resolve().parents[1];groups=['pembro-mono','pembro-combo','durvalumab','nivo-combo','pem-platinum'];regimens={};proposals=[]
for group in groups:
 base=R/'validation/lung-core-v08422'/group;d=json.loads((base/'authoring.json').read_text());regimens.update(d['regimens'])
 for code in d['regimens']:
  proposal=next((base/'proposed').glob(code+'-*.json'));target=next((R/'protocols').glob('*/'+code+'-*.json'));p=json.loads(proposal.read_text())
  for key,v in p['input_definitions'].items():
   values=[x['value'] if isinstance(x,dict) else x for x in v.get('options',[])];assert len(values)==len(set(map(str,values))),f'{code}/{key}: duplicate options'
  proposals.append((target,p))
assert len(regimens)==10
for target,p in proposals:target.write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n')
(R/'data/lung-core-v08422-authoring.json').write_text(json.dumps(dict(release='0.84.22',source_checked='2026-10-26',regimens=regimens),ensure_ascii=False,indent=2)+'\n')
print('Prepared ten canonical protocol proposals and authored service records.')
