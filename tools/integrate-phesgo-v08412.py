"""Wire only new suite outputs; preserve previously authored patient assets."""
import json
from pathlib import Path
R=Path(__file__).resolve().parents[1];V='0.84.12';codes=['00785','00789','00790','00796','00797']
def read(p):return json.loads((R/p).read_text())
def save(p,d):(R/p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def change(p,fn):f=R/p;f.write_text(fn(f.read_text()))
for name in ['package.json','data/app-release.json']:
 d=read(name)
 for k in ['version','release','content_release','knowledge_content_release']:
  if k in d:d[k]=V
 if name=='package.json':
  d['scripts']['test:phesgo']='node validation/phesgo-v08412/source-cases.cjs && node tests/full-suite-v08412.test.cjs'
  if 'test:phesgo' not in d['scripts']['release:gate']:d['scripts']['release:gate']+=' && npm run test:phesgo'
 else:d.update(display_version='v'+V,release_date='2026-10-20',summary='Five source-reconciled Phesgo suites: indication-specific assessment, full patient and clinician services, phase support and longitudinal monitoring')
 save(name,d)
for f in ['index.html','about.html','js/sactcheck-release.js','js/patient-asset-registry-v0810.js']:change(f,lambda s:s.replace('0.84.11',V))
p=R/'js/patient-asset-registry-v0810.js';s=p.read_text().replace("CONTENT_RELEASE='0.84.9'","CONTENT_RELEASE='0.84.12'")
for c in codes:
 if repr(c)+':' not in s:s=s.replace('const DEFINITIONS=Object.freeze({','const DEFINITIONS=Object.freeze({\n    '+repr(c)+':'+json.dumps(dict(title=read(f'data/patient-knowledge/{c}.json')['title'],guide=True,passport=True,sactCard=True,knowledge=True,consentDraft=True,supportiveCare=True,phaseSupport=True,longitudinal=True))+',')
p.write_text(s)
change('js/regimen-knowledge-base.js',lambda s:s if 'regimen-knowledge-base-v08412-addendum.json' in s else s.replace('"data/regimen-knowledge-base-v0849-addendum.json"','"data/regimen-knowledge-base-v0849-addendum.json", "data/regimen-knowledge-base-v08412-addendum.json"'))
# Optional code filter permits a batch build without regenerating prior approved outputs.
for f,needle,insert in [('tools/build-complete-pathways.cjs','for(const code of codes){',"for(const code of codes){\n if(process.env.SACT_SUITE_CODES&&!process.env.SACT_SUITE_CODES.split(',').includes(code))continue;"),('tools/build-patient-knowledge.cjs',"  const d=JSON.parse(fs.readFileSync(path.join(root,'data/patient-knowledge',file)));","  const d=JSON.parse(fs.readFileSync(path.join(root,'data/patient-knowledge',file)));\n  if(process.env.SACT_SUITE_CODES&&!process.env.SACT_SUITE_CODES.split(',').includes(d.code))continue;"),('tools/build-phase-support-v0838.cjs','for(const [code,phases] of Object.entries(D.regimens)){',"for(const [code,phases] of Object.entries(D.regimens)){\n if(process.env.SACT_SUITE_CODES&&!process.env.SACT_SUITE_CODES.split(',').includes(code))continue;")]:
 change(f,lambda s:s if 'SACT_SUITE_CODES' in s else s.replace(needle,insert))
p=R/'tools/build-complete-pathways.cjs';s=p.read_text()
for code in codes:
 if repr(code) not in s.split('const chronology=')[0]:s=s.replace('codes=[','codes=['+repr(code)+',',1)
s=s.replace("['0.84.0','0.84.1']","['0.84.0','0.84.1','0.84.12']").replace("['0.83.9','0.84.0','0.84.1']","['0.83.9','0.84.0','0.84.1','0.84.12']");p.write_text(s)
change('tools/build-phase-support-v0838.cjs',lambda s:s.replace("['0.83.9','0.84.0','0.84.1','0.84.9']","['0.83.9','0.84.0','0.84.1','0.84.9','0.84.12']").replace("d.suite_release==='0.84.9'","['0.84.9','0.84.12'].includes(d.suite_release)"))
change('404.html',lambda s:s if '(00785|' in s else s.replace('(00414|','(00785|00789|00790|00796|00797|00414|'))
print('Integrated release, service registry, knowledge loader and filtered build commands.')
