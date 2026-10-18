"""Idempotent application wiring for the v0.84.0 authored batch."""
from pathlib import Path
import json,runpy,re
R=Path(__file__).resolve().parents[1]
C=runpy.run_path(str(R/'tools/breast-family-v0840-config.py'))['CONFIG']
def change(p,f):
 q=R/p;q.write_text(f(q.read_text()))
def jwrite(p,d):(R/p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
for file in ['package.json','data/app-release.json']:
 d=json.loads((R/file).read_text())
 for k in ['version','release','content_release','knowledge_content_release']:
  if k in d:d[k]='0.84.0'
 if file.endswith('app-release.json'):d.update(display_version='v0.84.0',release_date='2026-10-17',summary='Sixteen source-audited breast/taxane suites with phase-specific decision rules, supportive care and longitudinal monitoring; runtime cache fix retained')
 jwrite(file,d)
for file in ['index.html','js/sactcheck-release.js','js/patient-asset-registry-v0810.js']:
 change(file,lambda s:s.replace('0.83.9','0.84.0'))
registry=R/'js/patient-asset-registry-v0810.js';s=registry.read_text()
for code,c in C.items():
 if "'"+code+"':" not in s:
  d=dict(title=c['title'],guide=True,passport=True,sactCard=True,knowledge=True,consentDraft=True,supportiveCare=True,phaseSupport=True,longitudinal=True)
  s=s.replace('const DEFINITIONS=Object.freeze({','const DEFINITIONS=Object.freeze({\n    '+repr(code)+':'+json.dumps(d,ensure_ascii=False)+',')
registry.write_text(s)
change('js/regimen-knowledge-base.js',lambda s:s if 'regimen-knowledge-base-v0840-addendum.json' in s else s.replace('"data/regimen-knowledge-base-v0839-addendum.json"','"data/regimen-knowledge-base-v0839-addendum.json", "data/regimen-knowledge-base-v0840-addendum.json"').replace("'data/regimen-knowledge-base-v0839-addendum.json'","'data/regimen-knowledge-base-v0839-addendum.json', 'data/regimen-knowledge-base-v0840-addendum.json'"))
p=R/'tools/build-complete-pathways.cjs';s=p.read_text()
for c in C:
 if repr(c) not in s.split('const chronology=')[0]:s=s.replace("codes=[","codes=["+repr(c)+',',1)
if 'const authoredRelease=' not in s:
 s=s.replace('const write=(p,s)=>{','const write=(p,s)=>{const authoredCode=p.match(/^patient\\/(\\d{5})\\//)?.[1];const authoredRelease=authoredCode?JSON.parse(read(`data/patient-knowledge/${authoredCode}.json`)).suite_release:null;if(authoredRelease===\'0.84.0\'){s=s.replaceAll(\'v0.83.0\',\'v0.84.0\').replaceAll(\'v0.83.1\',\'v0.84.0\');if(p.endsWith(\'/treatment-journey.html\'))s=s.replace(\'</head>\',\'<link rel="stylesheet" href="../../assets/patient/journey-print-v0839.css"></head>\');}')
s=s.replace("d.suite_release==='0.83.9'?' journey-compact'","['0.83.9','0.84.0'].includes(d.suite_release)?' journey-compact'")
if 'function phaseAnatomy' not in s:
 s=s.replace('const sources=d=>','function phaseAnatomy(d){return d.anatomy_phases?`<p>${esc(d.anatomy_note)}</p>${d.anatomy_phases.map((p,i)=>`<details${i===0?\' open\':\'\'}><summary>${esc(p.label)}</summary>${anatomy({...d,anatomy:p.anatomy})}</details>`).join(\'\')}`:anatomy(d);}\nconst sources=d=>')
 s=s.replace('${anatomy(d)}${risks(d)}</div></section>','${phaseAnatomy(d)}${risks(d)}</div></section>')
 # The printed guide remains compact; phase maps are available via its QR.
 s=s.replace('${anatomy(d)}<div class="suite-red">','${anatomy(d)}${d.anatomy_note?`<p class="suite-review">${esc(d.anatomy_note)}</p>`:\'\'}<div class="suite-red">')
 s=s.replace('${chronology.render(d)}</div></section>','${chronology.render(d)}${d.chronology_alternatives?`<p>${esc(d.chronology_alternatives)}</p>`:\'\'}</div></section>')
p.write_text(s)
change('tools/build-phase-support-v0838.cjs',lambda s:s.replace("['00200','00201','00272','00285','00206'].includes(d.code)?d.suite_release:'0.83.8'","['0.83.9','0.84.0'].includes(d.suite_release)?d.suite_release:'0.83.8'"))
change('tools/breast-library-runtime.cjs.txt',lambda s:s.replace("receptor==='all'||d.receptors.includes(receptor)","receptor==='all'||d.receptors.includes('any')||d.receptors.includes(receptor)"))
# Keep compatibility redirects in the same existing route inventory.
change('404.html',lambda s:s.replace('(00200|','('+('|'.join(C))+'|00200|') if '(00252|' not in s else s)
change('tools/build-complete-pathways.cjs',lambda s:s.replace(" if(['00200','00201','00272','00285','00206','00485'"," if(d.suite_release==='0.84.0'||['00200','00201','00272','00285','00206','00485'"))
print('Wired sixteen routes, KB addendum, phase anatomy and v0.84.0 bootstrap.')
