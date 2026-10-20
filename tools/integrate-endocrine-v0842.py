"""Wire endocrine-specific services without regenerating older patient content differently."""
import json,runpy
from pathlib import Path
R=Path(__file__).resolve().parents[1]
C=runpy.run_path(str(R/'tools/endocrine-v0842-config.py'))['CONFIG']
def change(path,fn):
 p=R/path;p.write_text(fn(p.read_text()))
def save(path,d):(R/path).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
for name in ['package.json','data/app-release.json']:
 d=json.loads((R/name).read_text())
 for key in ['version','release','content_release','knowledge_content_release']:
  if key in d:d[key]='0.84.2'
 if name=='data/app-release.json':d.update(display_version='v0.84.2',release_date='2026-10-18',summary='Five audited endocrine suites with continuous-treatment and injection timelines, indication-specific surveillance, bone health and complete clinician / patient services')
 else:
  d['scripts']['test:endocrine']='node validation/endocrine-v0842/ai-source-cases.cjs && node validation/endocrine-v0842/tam-fulv-source-cases.cjs && node tests/full-suite-v0842.test.cjs'
  if 'test:endocrine' not in d['scripts']['release:gate']:d['scripts']['release:gate']+=' && npm run test:endocrine'
 save(name,d)
for name in ['index.html','js/sactcheck-release.js','js/patient-asset-registry-v0810.js']:change(name,lambda s:s.replace('0.84.1','0.84.2'))
p=R/'js/patient-asset-registry-v0810.js';s=p.read_text()
for code,c in C.items():
 if repr(code)+':' not in s:s=s.replace('const DEFINITIONS=Object.freeze({','const DEFINITIONS=Object.freeze({\n    '+repr(code)+':'+json.dumps(dict(title=c['title'],guide=True,passport=True,sactCard=True,knowledge=True,consentDraft=True,supportiveCare=True,phaseSupport=True,longitudinal=True),ensure_ascii=False)+',')
p.write_text(s)
change('js/regimen-knowledge-base.js',lambda s:s if 'regimen-knowledge-base-v0842-addendum.json' in s else s.replace('"data/regimen-knowledge-base-v0841-addendum.json"','"data/regimen-knowledge-base-v0841-addendum.json", "data/regimen-knowledge-base-v0842-addendum.json"'))
p=R/'tools/build-complete-pathways.cjs';s=p.read_text()
for code in C:
 if repr(code) not in s.split('const chronology=')[0]:s=s.replace('codes=[','codes=['+repr(code)+',',1)
needle=' const d=JSON.parse(read(`data/patient-knowledge/${code}.json`));'
if 'endocrine-patient-suite-v0842' not in s:s=s.replace(needle,needle+"\n if(d.service_kind==='endocrine'){require('./endocrine-patient-suite-v0842.cjs').buildSuite(d,{anatomy,write});continue;}")
p.write_text(s)
p=R/'tools/build-patient-knowledge.cjs';s=p.read_text();needle="  const d=JSON.parse(fs.readFileSync(path.join(root,'data/patient-knowledge',file)));"
if 'endocrine-patient-suite-v0842' not in s:s=s.replace(needle,needle+"\n  if(d.service_kind==='endocrine'){fs.mkdirSync(path.join(root,'patient',d.code),{recursive:true});require('./endocrine-patient-suite-v0842.cjs').buildKnowledge(d,writeOutput);continue;}")
p.write_text(s)
p=R/'tools/build-phase-support-v0838.cjs';s=p.read_text();needle=" const d=require('../data/patient-knowledge/'+code+'.json');"
if 'endocrine-patient-suite-v0842' not in s:s=s.replace(needle,needle+"\n if(d.service_kind==='endocrine'){require('./endocrine-patient-suite-v0842.cjs').buildSupport(d,phases,write);continue;}")
p.write_text(s)
change('404.html',lambda s:s.replace('(00228|','('+('|'.join(C))+'|00228|') if '(00253|' not in s else s)
# Endocrine HR-positive pathways can include HER2-positive disease; keep both explicit contexts.
change('tools/breast-library-runtime.cjs.txt',lambda s:s.replace("||(receptor==='hrpos-her2pos'&&d.receptors.includes('her2pos'))", "||(receptor==='hrpos-her2pos'&&d.receptors.includes('her2pos'))||(receptor==='her2pos'&&d.receptors.includes('hrpos-her2pos'))"))
print('Wired v0.84.2 endocrine services and routes.')
