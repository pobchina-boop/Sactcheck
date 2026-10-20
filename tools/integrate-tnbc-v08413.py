"""Wire the new TNBC suites and the explicitly scoped 00857 retrospective revision."""
import json,qrcode,copy
from pathlib import Path
R=Path(__file__).resolve().parents[1];V='0.84.13';codes=['00858','00860','00861','00348','00734'];allcodes=codes+['00857']
def read(p):return json.loads((R/p).read_text())
def save(p,d):(R/p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def change(p,fn):f=R/p;f.write_text(fn(f.read_text()))
for name in ['package.json','data/app-release.json']:
 d=read(name)
 for k in ['version','release','content_release','knowledge_content_release']:
  if k in d:d[k]=V
 if name=='package.json':
  d['scripts']['test:tnbc']='node validation/tnbc-v08413/pembro/run-implementation-review.cjs . && node tests/full-suite-v08413.test.cjs'
  if 'test:tnbc' not in d['scripts']['release:gate']:d['scripts']['release:gate']+=' && npm run test:tnbc'
 else:d.update(display_version='v'+V,release_date='2026-10-20',summary='Five source-reconciled TNBC suites, phase-specific assessment and support, clinician evidence display and retrospective 00857 update')
 save(name,d)
for f in ['index.html','about.html','js/sactcheck-release.js','js/patient-asset-registry-v0810.js']:change(f,lambda s:s.replace('0.84.12',V))
p=R/'js/patient-asset-registry-v0810.js';s=p.read_text()
for c in codes:
 if repr(c)+':' not in s:s=s.replace('const DEFINITIONS=Object.freeze({','const DEFINITIONS=Object.freeze({\n    '+repr(c)+':'+json.dumps(dict(title=read(f'data/patient-knowledge/{c}.json')['title'],guide=True,passport=True,sactCard=True,knowledge=True,consentDraft=True,supportiveCare=True,phaseSupport=True,longitudinal=True))+',')
p.write_text(s)
change('js/regimen-knowledge-base.js',lambda s:s if 'regimen-knowledge-base-v08413-addendum.json' in s else s.replace('"data/regimen-knowledge-base-v08412-addendum.json"','"data/regimen-knowledge-base-v08412-addendum.json", "data/regimen-knowledge-base-v08413-addendum.json"'))
p=R/'tools/build-complete-pathways.cjs';s=p.read_text()
for code in codes:
 if repr(code) not in s.split('const chronology=')[0]:s=s.replace('codes=[','codes=['+repr(code)+',',1)
s=s.replace("'0.84.1','0.84.12']","'0.84.1','0.84.12','0.84.13']")
needle=" if(d.suite_release==='0.84.1')consent="
if "if(d.suite_release==='0.84.13')consent=" not in s:
 i=s.index(needle);s=s[:i]+" if(d.suite_release==='0.84.13')consent=consent.replace(/<section class=\"generic-grid\">[\\s\\S]*?<\\/section>/,`<section class=\"generic-grid\">${ticks(['Purpose, expected benefit and alternatives explained','Platinum/taxane and AC phases explained','Surgery and postoperative plan discussed','Separate supportive prescriptions and growth-factor plan agreed','Blood tests, ECG / cardiac and imaging checks explained','Fertility, contraception and pregnancy precautions discussed','Common, serious and lasting medicine-specific risks discussed below','Questions and the individual consent discussion recorded'])}</section>`).replace('1. Generic SACT risks / discussion points','1. Treatment discussion');\n"+s[i:]
p.write_text(s)
change('tools/build-phase-support-v0838.cjs',lambda s:s.replace("'0.84.9','0.84.12']","'0.84.9','0.84.12','0.84.13']"))
change('404.html',lambda s:s if '(00858|' in s else s.replace('(00785|','(00858|00860|00861|00348|00734|00785|'))
for code in codes:
 qr=R/f'patient/{code}/qr.png';qr.parent.mkdir(parents=True,exist_ok=True)
 qrcode.make(f'https://sactcheck.com/patient/{code}/').save(qr)
# Sustainability is clinical-context information, not a quantified environmental claim.
p=R/'data/regimen-sustainability-profiles.json'
if p.exists():
 print('Sustainability file found; review schema before adding profiles:',p)
print('Integrated v0.84.13 release and service routes.')
