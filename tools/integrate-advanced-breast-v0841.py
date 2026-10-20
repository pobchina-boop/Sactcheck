"""Idempotent wiring for five audited suites; preserve established patient outputs."""
import json,runpy
from pathlib import Path
R=Path(__file__).resolve().parents[1];C=runpy.run_path(str(R/'tools/advanced-breast-v0841-config.py'))['CONFIG']
def change(p,f):q=R/p;q.write_text(f(q.read_text()))
def write(p,d):(R/p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
for path in ['package.json','data/app-release.json']:
 d=json.loads((R/path).read_text())
 for k in ['version','release','content_release','knowledge_content_release']:
  if k in d:d[k]='0.84.1'
 if path.endswith('app-release.json'):d.update(display_version='v0.84.1',release_date='2026-10-18',summary='Five audited eribulin, nab-paclitaxel and pegylated liposomal doxorubicin full suites; regimen-specific dose rules, monitoring and patient journeys')
 if path=='package.json':
  d['scripts']['test:advanced-breast']='node validation/advanced-breast-v0841/eribulin-source-cases.cjs && node validation/advanced-breast-v0841/nab-source-cases.cjs && node validation/advanced-breast-v0841/pld-source-cases.cjs && node validation/advanced-breast-v0841/pld-grading-source.test.cjs && node tests/full-suite-v0841.test.cjs'
  if 'test:advanced-breast' not in d['scripts']['release:gate']:d['scripts']['release:gate']+=' && npm run test:advanced-breast'
 write(path,d)
for path in ['index.html','js/sactcheck-release.js','js/patient-asset-registry-v0810.js']:change(path,lambda s:s.replace('0.84.0','0.84.1'))
path=R/'js/patient-asset-registry-v0810.js';s=path.read_text()
for code,c in C.items():
 if repr(code)+':' not in s:
  d=dict(title=c['title'],guide=True,passport=True,sactCard=True,knowledge=True,consentDraft=True,supportiveCare=True,phaseSupport=True,longitudinal=True)
  s=s.replace('const DEFINITIONS=Object.freeze({','const DEFINITIONS=Object.freeze({\n    '+repr(code)+':'+json.dumps(d,ensure_ascii=False)+',')
path.write_text(s)
change('js/regimen-knowledge-base.js',lambda s:s if 'regimen-knowledge-base-v0841-addendum.json' in s else s.replace('"data/regimen-knowledge-base-v0840-addendum.json"','"data/regimen-knowledge-base-v0840-addendum.json", "data/regimen-knowledge-base-v0841-addendum.json"'))
path=R/'tools/build-complete-pathways.cjs';s=path.read_text()
for code in C:
 if repr(code) not in s.split('const chronology=')[0]:s=s.replace('codes=[','codes=['+repr(code)+',',1)
s=s.replace("if(authoredRelease==='0.84.0'){s=s.replaceAll('v0.83.0','v0.84.0').replaceAll('v0.83.1','v0.84.0');", "if(['0.84.0','0.84.1'].includes(authoredRelease)){s=s.replaceAll('v0.83.0','v'+authoredRelease).replaceAll('v0.83.1','v'+authoredRelease);")
s=s.replace("['0.83.9','0.84.0'].includes(d.suite_release)","['0.83.9','0.84.0','0.84.1'].includes(d.suite_release)")
s=s.replace("if(d.suite_release==='0.84.0'||", "if(['0.84.0','0.84.1'].includes(d.suite_release)||")
# One-agent consent aids should use available width, without changing prior outputs.
if "d.suite_release==='0.84.1')consent" not in s:s=s.replace(" if(!d.longitudinal_mapping)write", " if(d.suite_release==='0.84.1')consent=consent.replace(/<section class=\"generic-grid\">[\\s\\S]*?<\\/section>/,`<section class=\"generic-grid\">${ticks(['Purpose, expected benefit and alternatives explained','Exact medicine, formulation and schedule confirmed','Off-label indication / schedule discussed where applicable','Blood tests and required heart / imaging checks explained','Supportive medicines and urgent advice discussed','Pregnancy, contraception and fertility discussed where relevant','Common, serious and lasting medicine-specific risks discussed below','Patient priorities and questions recorded'])}</section>`);\n if(!d.longitudinal_mapping)write")
# The legacy inline grid applies three columns; override only new single-agent aids.
s=s.replace("write(`patient/${code}/consent-form.html`,consent);}\n const table", "if(d.suite_release==='0.84.1')consent=consent.replace('grid-template-columns:repeat(3,minmax(0,1fr))!important','grid-template-columns:repeat(1,minmax(0,1fr))!important');write(`patient/${code}/consent-form.html`,consent);}\n const table")
path.write_text(s)
change('tools/build-phase-support-v0838.cjs',lambda s:s.replace("['0.83.9','0.84.0'].includes(d.suite_release)","['0.83.9','0.84.0','0.84.1'].includes(d.suite_release)").replace('${D.source_checked}', '${p.source_checked||D.source_checked}'))
change('404.html',lambda s:s.replace('(00252|','('+('|'.join(C))+'|00252|') if '(00228|' not in s else s)
# Correct mechanism schematic for the two newly represented microtubule medicines.
change('tools/build-patient-knowledge.cjs',lambda s:s.replace("if(agent.id==='docetaxel'||agent.id==='paclitaxel')", "if(['docetaxel','paclitaxel','nab-paclitaxel'].includes(agent.id))"))
path=R/'tools/build-patient-knowledge.cjs';s=path.read_text()
if "agent.id==='eribulin'" not in s:s=s.replace("function diagram(agent){", "function diagram(agent){\n  if(agent.id==='eribulin')return '<svg class=\"pk-diagram\" viewBox=\"0 0 260 108\" aria-hidden=\"true\"><g fill=\"none\" stroke=\"#086f75\" stroke-width=\"5\"><path d=\"M30 30h125M30 50h125M30 70h125\"/><path d=\"M165 18v65\" stroke=\"#825100\"/><path d=\"M186 50h44\" stroke-dasharray=\"5 6\"/></g></svg>';\n")
path.write_text(s)
print('Wired v0.84.1 release, KB, routes, consent and mechanism visuals.')
