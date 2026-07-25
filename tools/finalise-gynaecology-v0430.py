#!/usr/bin/env python3
from __future__ import annotations
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
VERSION='0.43.0';COUNT=308

def groups(d):
 m=d.get('metadata',{});out=[]
 if isinstance(m.get('tumour_group'),str):out.append(m['tumour_group'])
 for v in m.get('tumour_groups') or []:
  if v not in out:out.append(v)
 return out
# Supportive-care registry references.
risk_path=ROOT/'data/emetogenic-risk-map.json';risk=json.loads(risk_path.read_text());risk['release']=VERSION
for p in ROOT.glob('protocols/**/*.json'):
 if p.name in ['index.json','protocol-schema.json','package.json']:continue
 try:d=json.loads(p.read_text())
 except:continue
 if 'Gynaecology' not in groups(d):continue
 m=d.get('metadata',{});code=str(m.get('nccp_regimen_code','')).zfill(5);sc=d.get('supportive_care') or {}
 if not sc:
  drugs=' '.join(m.get('drugs') or []).lower()
  if 'cisplatin' in drugs:risk_level,script='high','nccp-parenteral-high'
  elif 'carboplatin' in drugs or 'doxorubicin' in drugs:risk_level,script='moderate','nccp-parenteral-moderate'
  elif any(x in drugs for x in ['paclitaxel','topotecan','docetaxel','gemcitabine','vinorelbine']):risk_level,script='low','nccp-parenteral-low'
  elif any(x in drugs for x in ['olaparib','niraparib','rucaparib']):risk_level,script='oral_minimal_low','nccp-oral-minimal-low'
  else:risk_level,script='minimal','nccp-minimal-no-routine-prophylaxis'
  sc={'emetogenic_risk':risk_level,'script_id':script,'mapping_basis':'Highest emetogenic active component and phase-specific NCCP classification.','mapping_confidence':'source_reconciled_pending_pharmacy_validation','mapping_source_url':'https://healthservice.hse.ie/documents/7152/Classification_Document_for_Systemic_Anti-_Cancer_Therapy_SACT_Induced_Nausea__pWgDCrm.pdf'};d['supportive_care']=sc;p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
 sc['validation_status']='pending_oncology_pharmacy_validation'
 if sc.get('emetogenic_risk')=='phase_dependent':
  drugs=' '.join(m.get('drugs') or []).lower();high=any(x in drugs for x in ['cisplatin','cyclophosphamide'])
  sc.setdefault('phase_profiles',{'combination_or_intensive_phase':{'emetogenic_risk':'high' if high else 'moderate','script_id':'nccp-parenteral-high' if high else 'nccp-parenteral-moderate'},'single_agent_or_maintenance_phase':{'emetogenic_risk':'low','script_id':'nccp-parenteral-low'}})
  sc.pop('supportive_medications_pdf_url',None);sc.pop('supportive_medications_label',None)
 else:
  script=risk.get('scripts',{}).get(sc.get('script_id') or '')
  if script:sc['supportive_medications_pdf_url']=script.get('url');sc['supportive_medications_label']=script.get('label')
 p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
 risk.setdefault('protocols',{})[code]={'level':sc.get('emetogenic_risk','pending'),'script_id':sc.get('script_id'),'mapping_basis':sc.get('mapping_basis'),'mapping_confidence':sc.get('mapping_confidence'),'phase_profiles':sc.get('phase_profiles')}
risk_path.write_text(json.dumps(risk,ensure_ascii=False,indent=2)+'\n')
# Alias registry version and missing common brands.
alias_path=ROOT/'js'/'drug-aliases.js';text=alias_path.read_text();marker='  const ENTRIES = Object.freeze([\n'
entries=[('cemiplimab','Libtayo'),('dostarlimab','Jemperli'),('dactinomycin','Cosmegen'),('rucaparib','Rubraca'),('niraparib','Zejula'),('trabectedin','Yondelis')]
insert=''
for term,alias in entries:
 if f'terms: ["{term}"]' not in text:insert+=f'    {{ terms: ["{term}"], aliases: ["{alias}"] }},\n'
text=text.replace(marker,marker+insert,1);text=re.sub(r'version: "[0-9.]+"',f'version: "{VERSION}"',text);alias_path.write_text(text)
# UI release labels/cache keys.
index=ROOT/'index.html';html=index.read_text();html=re.sub(r'<title>SACTCheck v[0-9.]+ — [^<]+</title>',f'<title>SACTCheck v{VERSION} — complete Gynaecology library</title>',html);html=re.sub(r'Version [0-9.]+ · [^<]+</span>',f'Version {VERSION} · complete Gynaecology library</span>',html);html=re.sub(r'\?v=[0-9.]+',f'?v={VERSION}',html);index.write_text(html)
# Package metadata/tests.
pp=ROOT/'package.json';package=json.loads(pp.read_text());package['version']=VERSION;package['description']='NCCP protocol-driven SACT pre-assessment prototype with complete active Gynaecology, Neuro-oncology, Sarcoma, Lung, GI and Prostate libraries, single-entry assessment, tissue navigation and automatic local ULN calculations'
if 'gynaecology-complete-library-v0430.test.js' not in package['scripts']['test']:package['scripts']['test']+=' && node tests/gynaecology-complete-library-v0430.test.js'
package['scripts']['test:v0430']='node tests/gynaecology-complete-library-v0430.test.js';pp.write_text(json.dumps(package,ensure_ascii=False,indent=2)+'\n')
# Carry historical version/count assertions forward.
for test in (ROOT/'tests').glob('*.test.js'):
 if test.name in ['title-normalisation-v0411.test.js','gynaecology-complete-library-v0430.test.js']:continue
 t=test.read_text();t=t.replace('Version 0.42.0 · complete Neuro-oncology library',f'Version {VERSION} · complete Gynaecology library');t=t.replace('SACTCheck v0.42.0 — complete Neuro-oncology library',f'SACTCheck v{VERSION} — complete Gynaecology library');t=t.replace('SACTCheck v0.42.0',f'SACTCheck v{VERSION}');t=t.replace('?v=0.42.0',f'?v={VERSION}');t=t.replace("Aliases.version, '0.42.0'",f"Aliases.version, '{VERSION}'");t=t.replace('Aliases.version,"0.42.0"',f'Aliases.version,"{VERSION}"');t=t.replace("riskMap.release, '0.42.0'",f"riskMap.release, '{VERSION}'");t=t.replace("riskMap.release,'0.42.0'",f"riskMap.release,'{VERSION}'")
 t=re.sub(r'index\.protocol_count,\s*280',f'index.protocol_count, {COUNT}',t);t=re.sub(r'index\.protocols\.length,\s*280',f'index.protocols.length, {COUNT}',t);t=re.sub(r'\.size,\s*280',f'.size, {COUNT}',t);t=re.sub(r'protocols\.length,\s*280',f'protocols.length, {COUNT}',t);t=re.sub(r'Object\.keys\(riskMap\.protocols \|\| \{\}\)\.length,\s*280',f'Object.keys(riskMap.protocols || {{}}).length, {COUNT}',t);t=re.sub(r'Object\.keys\(riskMap\.protocols\|\|\{\}\)\.length,280',f'Object.keys(riskMap.protocols||{{}}).length,{COUNT}',t)
 if test.name=='platform-standardisation-v0370.test.js' and "'0.43.0'" not in t:t=t.replace("'0.42.0']", "'0.42.0', '0.43.0']")
 test.write_text(t)
# Docs.
release=f'''# SACTCheck v{VERSION} — Complete Gynaecology Library\n\n## Scope\n\nThis release completes the current NCCP Gynaecology SACT catalogue as active encoded assessment protocols.\n\n## Inventory\n\n- 48 active Gynaecology protocols\n- 28 new protocol files and 20 reconciled canonical/shared protocols\n- No Gynaecology placeholders or draft cards\n- 308 distinct protocols across the complete SACTCheck library\n\n## Clinical areas\n\n- Cervical cancer and chemoradiation\n- Endometrial cancer\n- Ovarian, fallopian tube and primary peritoneal cancer\n- Gestational trophoblastic neoplasia\n- Ovarian germ-cell tumours\n- Immunotherapy, PARP inhibitors, anti-VEGF therapy and later-line chemotherapy\n\n## Platform standards\n\n- Single-entry partial assessment\n- Missing values remain unassessed and non-blocking\n- Actual ALT, AST and bilirubin input with automatic local ULN calculation\n- Protocol-specific renal bands, with exact GFR retained for carboplatin/Calvert dosing\n- Optional immunotherapy-only endocrine bloods\n- CTCAE grade explanations beside toxicity controls\n- Searchable common/trade names and official NCCP PDF links\n\nAll clinical encodings remain pending independent Consultant and oncology-pharmacy validation before formal deployment.\n'''
(ROOT/f'RELEASE_NOTES_v{VERSION}.md').write_text(release)
(ROOT/f'UPDATE_INSTRUCTIONS_v{VERSION}.txt').write_text(f'''SACTCheck v{VERSION}\n\n1. Extract this archive.\n2. Replace the previous Sactcheck project contents with this complete folder.\n3. Commit and push all changed and new files, including protocols/gynaecology.\n4. Hard-refresh the deployed site after GitHub Pages finishes rebuilding.\n\nDo not copy only the JSON files: the release also updates the protocol index, aliases, supportive-care registry, tests and cache keys.\n''')
source=['# Gynaecology Library Sources — v0.43.0','','Official catalogue: https://healthservice.hse.ie/staff/information-healthcare-workers/nccp/gynaecology-sact-regimens/','']
for p in sorted(ROOT.glob('protocols/**/*.json')):
 if p.name in ['index.json','protocol-schema.json','package.json']:continue
 try:d=json.loads(p.read_text())
 except:continue
 if 'Gynaecology' not in groups(d):continue
 m=d['metadata'];source.append(f"- NCCP {m['nccp_regimen_code']} v{m['nccp_version']} — {m['title']} — {m['source_url']}")
(ROOT/'GYNAECOLOGY_LIBRARY_SOURCES_v0.43.0.md').write_text('\n'.join(source)+'\n')
cl=ROOT/'CHANGELOG.MD';old=cl.read_text();entry=f'''## v{VERSION} — Complete Gynaecology Library\n- Added/reconciled all 48 current NCCP Gynaecology regimen documents as active encoded protocols.\n- Added cervical, endometrial, ovarian, GTN and ovarian germ-cell pathways.\n- Added immunotherapy, PARP inhibitor, bevacizumab, chemoradiation and specialist GTN assessment logic.\n- Expanded the complete indexed library to 308 protocols.\n\n'''
if f'## v{VERSION}' not in old:cl.write_text(entry+old)
print(f'Finalised {VERSION}; supportive-care registry covers {len(risk.get("protocols",{}))} protocols.')
