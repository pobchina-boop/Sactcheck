"""Integrate the five targeted suites, preserving all previous generated patient files."""
from pathlib import Path
import json
R=Path(__file__).resolve().parents[1];V='0.84.9'
def read(p):return json.loads((R/p).read_text())
def save(p,d):(R/p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def change(p,fn):
 f=R/p;f.write_text(fn(f.read_text()))
codes=read('data/targeted-breast-v0849-source-index.json')['codes']
for name in ['package.json','data/app-release.json']:
 d=read(name)
 for k in ['version','release','content_release','knowledge_content_release']:
  if k in d:d[k]=V
 if name=='data/app-release.json':d.update(display_version='v'+V,release_date='2026-10-20',summary='Five source-audited targeted breast suites with treatment assessment corrections, regimen-specific monitoring, evidence, consent and patient tools')
 else:
  d['scripts']['test:targeted-breast']='node validation/targeted-breast-v0849/palbociclib-source-cases.cjs && node validation/targeted-breast-v0849/everolimus-source-cases.cjs && node validation/targeted-breast-v0849/enhertu-source-cases.cjs && node validation/targeted-breast-v0849/sacituzumab-source-cases.cjs && node validation/targeted-breast-v0849/olaparib-source-cases.cjs && node tests/full-suite-v0849.test.cjs'
  if 'test:targeted-breast' not in d['scripts']['release:gate']:d['scripts']['release:gate']+=' && npm run test:targeted-breast'
 save(name,d)
for name in ['index.html','about.html','js/sactcheck-release.js','js/patient-asset-registry-v0810.js']:change(name,lambda s:s.replace('0.84.8',V))
change('js/patient-asset-registry-v0810.js',lambda s:s.replace("CONTENT_RELEASE='0.84.2'","CONTENT_RELEASE='0.84.9'"))
p=R/'js/patient-asset-registry-v0810.js';s=p.read_text()
for code in codes:
 d=read(f'data/patient-knowledge/{code}.json')
 if repr(code)+':' not in s:
  flags=dict(title=d['title'],guide=True,passport=True,sactCard=True,knowledge=True,consentDraft=True,supportiveCare=True,phaseSupport=True,longitudinal=True)
  if code=='00588':flags.update(scopeGuard=True,scope='Breast adjuvant00588h only')
  s=s.replace('const DEFINITIONS=Object.freeze({','const DEFINITIONS=Object.freeze({\n    '+repr(code)+':'+json.dumps(flags,ensure_ascii=False)+',')
needle='const def=definitionFor(value); if(!def) return null;'
# Public service links to shared00588 require a deliberate indication choice, even from other tissue cards.
if "def.scopeGuard" not in s:s=s.replace(needle,needle+"\n    if(def.scopeGuard) return `patient/${def.code}/scope.html?asset=${encodeURIComponent(asset)}`;",1)
# Compatibility URLs must not bypass indication routing.
needle2='const def=definitionFor(value); if(!def) return null;\n    const suffix='
if "if(def.scopeGuard) return publicUrl" not in s:s=s.replace(needle2,'const def=definitionFor(value); if(!def) return null;\n    if(def.scopeGuard) return publicUrl(value,asset);\n    const suffix=')
p.write_text(s)
change('js/regimen-knowledge-base.js',lambda s:s if 'regimen-knowledge-base-v0849-addendum.json' in s else s.replace('"data/regimen-knowledge-base-v0842-addendum.json"','"data/regimen-knowledge-base-v0842-addendum.json", "data/regimen-knowledge-base-v0849-addendum.json"'))
p=R/'tools/build-complete-pathways.cjs';s=p.read_text()
for code in codes:
 if repr(code) not in s.split('const chronology=')[0]:s=s.replace('codes=[','codes=['+repr(code)+',',1)
needle=' const d=JSON.parse(read(`data/patient-knowledge/${code}.json`));'
if "d.service_kind==='targeted'" not in s:s=s.replace(needle,needle+"\n if(d.service_kind==='targeted'){require('./targeted-patient-suite-v0849.cjs').buildSuite(d,{anatomy,write});continue;}")
p.write_text(s)
p=R/'tools/build-patient-knowledge.cjs';s=p.read_text();needle="  const d=JSON.parse(fs.readFileSync(path.join(root,'data/patient-knowledge',file)));"
if "d.service_kind==='targeted'" not in s:s=s.replace(needle,needle+"\n  if(d.service_kind==='targeted'){fs.mkdirSync(path.join(root,'patient',d.code),{recursive:true});require('./targeted-patient-suite-v0849.cjs').buildKnowledge(d,writeOutput);continue;}")
p.write_text(s)
p=R/'tools/build-phase-support-v0838.cjs';s=p.read_text().replace("['0.83.9','0.84.0','0.84.1']","['0.83.9','0.84.0','0.84.1','0.84.9']")
# Display explicit scope in all shared-protocol support pages, including PDFs.
s=s.replace('<h1>${esc(d.title)}</h1><div class="notice">','<h1>${esc(d.title)}</h1>${d.scope_note?`<div class="notice"><strong>Breast adjuvant treatment only · NCCP00588h.</strong> ${esc(d.scope_note)}</div>`:\'\'}<div class="notice">')
p.write_text(s)
change('404.html',lambda s:s.replace('(00253|','('+('|'.join(codes))+'|00253|') if '(00414|' not in s else s)
print('Wired v0.84.9 services; shared olaparib routes require an indication choice.')
