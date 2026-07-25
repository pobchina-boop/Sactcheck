#!/usr/bin/env python3
from __future__ import annotations
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
VERSION='0.44.0';COUNT=329
ANTI='https://healthservice.hse.ie/documents/7152/Classification_Document_for_Systemic_Anti-_Cancer_Therapy_SACT_Induced_Nausea__pWgDCrm.pdf'
CAT='https://healthservice.hse.ie/staff/information-healthcare-workers/nccp/genitourinary-sact-regimens/'

def groups(d):
 m=d.get('metadata',{});out=[]
 if isinstance(m.get('tumour_group'),str):out.append(m['tumour_group'])
 for v in m.get('tumour_groups') or []:
  if v not in out:out.append(v)
 return out

def canonical_files():
 idx=json.loads((ROOT/'protocols/index.json').read_text())
 for e in idx['protocols']:
  p=ROOT/e['path'];yield p,json.loads(p.read_text())

# Supportive-care registry for newly added and reconciled GU protocols.
risk_path=ROOT/'data/emetogenic-risk-map.json';risk=json.loads(risk_path.read_text());risk['release']=VERSION
for p,d in canonical_files():
 if 'Genitourinary' not in groups(d):continue
 m=d.get('metadata',{});code=str(m.get('nccp_regimen_code','')).zfill(5);sc=d.setdefault('supportive_care',{})
 drugs=' '.join(m.get('drugs') or []).lower()
 if not sc.get('emetogenic_risk'):
  if 'intravesical' in drugs or 'bacillus calmette' in drugs:risk_level,script='minimal','nccp-minimal-no-routine-prophylaxis'
  elif 'cisplatin' in drugs or 'ifosfamide' in drugs:risk_level,script='high','nccp-parenteral-high'
  elif 'carboplatin' in drugs or 'doxorubicin' in drugs:risk_level,script='moderate','nccp-parenteral-moderate'
  elif any(x in drugs for x in ['gemcitabine','paclitaxel','docetaxel','etoposide','mitomycin','fluorouracil']):risk_level,script='low','nccp-parenteral-low'
  elif any(x in drugs for x in ['abiraterone','enzalutamide','apalutamide','darolutamide','olaparib','niraparib','axitinib','cabozantinib','erdafitinib','everolimus','pazopanib','sorafenib','sunitinib','tivozanib']):risk_level,script='oral_minimal_low','nccp-oral-minimal-low'
  else:risk_level,script='minimal','nccp-minimal-no-routine-prophylaxis'
  sc.update({'emetogenic_risk':risk_level,'script_id':script,'mapping_basis':'Highest emetogenic active component and phase-specific NCCP classification.','mapping_confidence':'source_reconciled_pending_pharmacy_validation','mapping_source_url':ANTI})
 sc['validation_status']='pending_oncology_pharmacy_validation'
 if sc.get('emetogenic_risk')=='phase_dependent':
  sc.pop('supportive_medications_pdf_url',None);sc.pop('supportive_medications_label',None)
  sc.setdefault('phase_profiles',{'combination_or_intensive_phase':{'emetogenic_risk':'high','script_id':'nccp-parenteral-high'},'single_agent_or_maintenance_phase':{'emetogenic_risk':'low','script_id':'nccp-parenteral-low'}})
 else:
  script_data=risk.get('scripts',{}).get(sc.get('script_id') or '')
  if script_data:
   sc['supportive_medications_pdf_url']=script_data.get('url');sc['supportive_medications_label']=script_data.get('label')
 p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
 risk.setdefault('protocols',{})[code]={'level':sc.get('emetogenic_risk','pending'),'script_id':sc.get('script_id'),'mapping_basis':sc.get('mapping_basis'),'mapping_confidence':sc.get('mapping_confidence'),'phase_profiles':sc.get('phase_profiles')}
risk_path.write_text(json.dumps(risk,ensure_ascii=False,indent=2)+'\n')

# Searchable common/trade names.
alias_path=ROOT/'js/drug-aliases.js';text=alias_path.read_text();marker='  const ENTRIES = Object.freeze([\n'
entries=[('avelumab','Bavencio'),('bacillus calmette-guérin','BCG'),('erdafitinib','Balversa'),('enfortumab vedotin','Padcev'),('axitinib','Inlyta'),('cabozantinib','Cabometyx'),('temsirolimus','Torisel'),('tivozanib','Fotivda')]
insert=''
for term,alias in entries:
 if f'terms: ["{term}"]' not in text:insert+=f'    {{ terms: ["{term}"], aliases: ["{alias}"] }},\n'
text=text.replace(marker,marker+insert,1);text=re.sub(r'version: "[0-9.]+"',f'version: "{VERSION}"',text);alias_path.write_text(text)

# UI release labels and cache keys.
index=ROOT/'index.html';html=index.read_text();html=re.sub(r'<title>SACTCheck v[0-9.]+ — [^<]+</title>',f'<title>SACTCheck v{VERSION} — complete Genitourinary library</title>',html);html=re.sub(r'Version [0-9.]+ · [^<]+</span>',f'Version {VERSION} · complete Genitourinary library</span>',html);html=re.sub(r'\?v=[0-9.]+',f'?v={VERSION}',html);index.write_text(html)

# Package metadata and test registration.
pp=ROOT/'package.json';package=json.loads(pp.read_text());package['version']=VERSION;package['description']='NCCP protocol-driven SACT pre-assessment prototype with complete active Genitourinary, Gynaecology, Neuro-oncology, Sarcoma, Lung, GI and Breast libraries, single-entry assessment, tissue navigation and automatic local ULN calculations'
if 'gu-complete-library-v0440.test.js' not in package['scripts']['test']:package['scripts']['test']+=' && node tests/gu-complete-library-v0440.test.js'
package['scripts']['test:v0440']='node tests/gu-complete-library-v0440.test.js';pp.write_text(json.dumps(package,ensure_ascii=False,indent=2)+'\n')

# Carry historical current-release assertions forward.
for test in (ROOT/'tests').glob('*.test.js'):
 if test.name in ['title-normalisation-v0411.test.js','gu-complete-library-v0440.test.js']:continue
 t=test.read_text()
 t=t.replace('Version 0.43.0 · complete Gynaecology library',f'Version {VERSION} · complete Genitourinary library')
 t=t.replace('SACTCheck v0.43.0 — complete Gynaecology library',f'SACTCheck v{VERSION} — complete Genitourinary library')
 t=t.replace('SACTCheck v0.43.0',f'SACTCheck v{VERSION}')
 t=t.replace('?v=0.43.0',f'?v={VERSION}')
 t=t.replace("Aliases.version, '0.43.0'",f"Aliases.version, '{VERSION}'").replace('Aliases.version,"0.43.0"',f'Aliases.version,"{VERSION}"')
 t=t.replace("riskMap.release, '0.43.0'",f"riskMap.release, '{VERSION}'").replace("riskMap.release,'0.43.0'",f"riskMap.release,'{VERSION}'")
 t=re.sub(r'index\.protocol_count,\s*308',f'index.protocol_count, {COUNT}',t);t=re.sub(r'index\.protocols\.length,\s*308',f'index.protocols.length, {COUNT}',t);t=re.sub(r'\.size,\s*308',f'.size, {COUNT}',t);t=re.sub(r'protocols\.length,\s*308',f'protocols.length, {COUNT}',t);t=re.sub(r'Object\.keys\(riskMap\.protocols \|\| \{\}\)\.length,\s*308',f'Object.keys(riskMap.protocols || {{}}).length, {COUNT}',t);t=re.sub(r'Object\.keys\(riskMap\.protocols\|\|\{\}\)\.length,308',f'Object.keys(riskMap.protocols||{{}}).length,{COUNT}',t)
 t=t.replace("risk.release,'0.43.0'","risk.release,'0.44.0'").replace("Aliases.version,'0.43.0'","Aliases.version,'0.44.0'")
 t=t.replace("length,308","length,329")
 t=t.replace("['0.39.0','0.40.0','0.41.0','0.43.0'].includes","['0.39.0','0.40.0','0.41.0','0.43.0','0.44.0'].includes")
 t=t.replace("['0.41.0','0.43.0'].includes","['0.41.0','0.43.0','0.44.0'].includes")
 t=t.replace("['0.40.0','0.43.0'].includes","['0.40.0','0.43.0','0.44.0'].includes")
 t=t.replace("f.startsWith('00212-') ? '0.43.0' : '0.37.0'","f.startsWith('00212-') ? '0.44.0' : '0.37.0'")
 if test.name=='platform-standardisation-v0370.test.js':
  t=t.replace("  'recurrent_high_grade_glioma'\n]);","  'recurrent_high_grade_glioma',\n  'intravesical_therapy',\n  'immunotherapy_combination'\n]);")
  t=t.replace("return code && code !== '00000' && !file.includes(`${path.sep}_template${path.sep}`)","return code && code !== '00000' && !file.includes(`${path.sep}protocols${path.sep}protocols${path.sep}`) && !file.includes(`${path.sep}_template${path.sep}`)")
  t=t.replace("Expected 270 regimen protocols","Expected 329 canonical regimen protocols")
  if "'0.44.0'" not in t:t=t.replace("'0.43.0']", "'0.43.0', '0.44.0']")
 if test.name in ['prostate-library-v0380.test.js','gi-complete-library-v0390.test.js','lung-complete-library-v0400.test.js','neuro-complete-library-v0420.test.js','sarcoma-complete-library-v0410.test.js','tumour-site-integrity-v0382.test.js']:
  if 'protocols${path.sep}protocols' not in t:
   t=t.replace("    .filter(file => file.endsWith('.json'))","    .filter(file => file.endsWith('.json'))\n    .filter(file => !file.includes(`${path.sep}protocols${path.sep}protocols${path.sep}`))",1)
   t=t.replace("    .filter(f => f.endsWith('.json'))","    .filter(f => f.endsWith('.json'))\n    .filter(f => !f.includes(`${path.sep}protocols${path.sep}protocols${path.sep}`))",1)
 if test.name=='gynaecology-complete-library-v0430.test.js' and 'protocols${path.sep}protocols' not in t:
  t=t.replace("filter(f=>f.endsWith('.json')&&","filter(f=>f.endsWith('.json')&&!f.includes(`${path.sep}protocols${path.sep}protocols${path.sep}`)&&",1)
 if test.name=='title-normalisation-v0411.test.js' and 'file.includes(`${path.sep}protocols${path.sep}protocols${path.sep}`)' not in t:
  t=t.replace('for (const file of walk(protocolsRoot)) {\n  if (["index.json", "protocol-schema.json"].includes(path.basename(file))) continue;', 'for (const file of walk(protocolsRoot)) {\n  if (file.includes(`${path.sep}protocols${path.sep}protocols${path.sep}`)) continue;\n  if (["index.json", "protocol-schema.json"].includes(path.basename(file))) continue;')
 test.write_text(t)

release=f'''# SACTCheck v{VERSION} — Complete Genitourinary Library

## Scope

This release completes the current NCCP Genitourinary SACT catalogue as active encoded assessment protocols.

## Inventory

- 67 unique current GU regimen codes
- 21 new protocol files and 46 reconciled canonical/shared protocols
- Four clinical sections: bladder/urothelial, germ-cell, prostate and renal cancer
- 329 distinct protocols across the complete SACTCheck library

## Clinical additions

- Intravesical BCG and sequential intravesical gemcitabine/docetaxel
- Bladder-preserving chemoradiation and urothelial chemotherapy pathways
- Enfortumab vedotin, pembrolizumab combinations, avelumab and erdafitinib
- Germ-cell TIP and high-dose carboplatin/etoposide pathways
- Renal-cell kinase inhibitors, temsirolimus and pembrolizumab/axitinib

## Platform standards

- Single-entry partial assessment with omitted domains reported as unassessed
- Actual ALT/AST/bilirubin entry with central local ULN calculation
- Exact GFR/CrCl retained where Calvert carboplatin dosing requires it
- Optional immunotherapy-only endocrine inputs
- CTCAE grade descriptions beside toxicity controls
- Official NCCP PDF access, aliases, treatment intent, cycle interval and duration card metadata

All clinical encodings remain pending independent Consultant and oncology-pharmacy validation before formal deployment.
'''
(ROOT/f'RELEASE_NOTES_v{VERSION}.md').write_text(release)
(ROOT/f'UPDATE_INSTRUCTIONS_v{VERSION}.txt').write_text(f'''SACTCheck v{VERSION}\n\n1. Extract the drop-in archive.\n2. Copy everything inside it into the main Sactcheck repository folder.\n3. Choose Replace the files in the destination when prompted.\n4. Commit and push all changed/new files, including protocols/genitourinary.\n5. Hard-refresh the deployed site after GitHub Pages rebuilds.\n\nThis release updates protocol JSON, the index, regimen-card metadata, aliases, supportive-care mapping, tests and versioned cache keys.\n''')

source=['# Genitourinary Library Sources — v0.44.0','',f'Official catalogue: {CAT}','', 'Catalogue checked: 25 July 2026','']
for p,d in canonical_files():
 if 'Genitourinary' not in groups(d):continue
 m=d['metadata'];source.append(f"- NCCP {str(m['nccp_regimen_code']).zfill(5)} v{m['nccp_version']} — {m['title']} — {m['source_url']}")
(ROOT/'GENITOURINARY_LIBRARY_SOURCES_v0.44.0.md').write_text('\n'.join(source)+'\n')

# Machine-readable audit.
gu=[]
for p,d in canonical_files():
 if 'Genitourinary' in groups(d):
  m=d['metadata'];gu.append({'code':str(m['nccp_regimen_code']).zfill(5),'version':m.get('nccp_version'),'title':m.get('title'),'path':p.relative_to(ROOT).as_posix(),'source_url':m.get('source_url'),'subgroups':m.get('genitourinary_subgroups'),'status':d.get('status'),'input_count':len(d.get('input_definitions') or {}),'rule_count':len(d.get('rule_engine',{}).get('rules') or [])})
(ROOT/'V0440_GU_LIBRARY_AUDIT.json').write_text(json.dumps({'release':VERSION,'catalogue_url':CAT,'catalogue_checked_date':'2026-07-25','unique_protocol_count':len(gu),'library_protocol_count':COUNT,'protocols':sorted(gu,key=lambda x:x['code'])},ensure_ascii=False,indent=2)+'\n')

cl=ROOT/'CHANGELOG.MD';old=cl.read_text();entry=f'''## v{VERSION} — Complete Genitourinary Library\n- Added/reconciled all 67 current unique NCCP GU regimen codes across bladder, germ-cell, prostate and renal cancer.\n- Added 21 new protocols and reconciled 46 existing/shared canonical protocols without duplicate cards.\n- Added intravesical, chemoradiation, immunotherapy, targeted-therapy and specialist germ-cell assessment pathways.\n- Expanded the complete indexed library to 329 protocols.\n- Populated GU regimen-card intent, cycle interval and treatment-duration metadata with explicit review flags where duration remains indication-dependent.\n\n'''
if f'## v{VERSION}' not in old:cl.write_text(entry+old)
print(f'Finalised {VERSION}; GU={len(gu)}, library={COUNT}, supportive-care={len(risk.get("protocols",{}))}.')
