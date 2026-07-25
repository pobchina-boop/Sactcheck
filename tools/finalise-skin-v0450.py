#!/usr/bin/env python3
from __future__ import annotations
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
VERSION='0.45.0';COUNT=338
ANTI='https://healthservice.hse.ie/documents/7152/Classification_Document_for_Systemic_Anti-_Cancer_Therapy_SACT_Induced_Nausea__pWgDCrm.pdf'
CAT='https://healthservice.hse.ie/staff/information-healthcare-workers/nccp/skin-melanoma-sact-regimens/'

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

# Supportive-care registry, using dacarbazine high emetogenicity and minimal/oral-low profiles for the other skin regimens.
risk_path=ROOT/'data/emetogenic-risk-map.json';risk=json.loads(risk_path.read_text());risk['release']=VERSION
for p,d in canonical_files():
 if 'Skin/Melanoma' not in groups(d):continue
 m=d.get('metadata',{});code=str(m.get('nccp_regimen_code','')).zfill(5);sc=d.setdefault('supportive_care',{});drugs=' '.join(m.get('drugs') or d.get('treatment',{}).get('drugs') or []).lower()
 if code=='00464':level,script='high','nccp-parenteral-high'
 elif any(x in drugs for x in ['dabrafenib','trametinib','vemurafenib','cobimetinib','encorafenib','binimetinib','vismodegib']):level,script='oral_minimal_low','nccp-oral-minimal-low'
 else:level,script='minimal','nccp-minimal-no-routine-prophylaxis'
 sc.update({'emetogenic_risk':level,'script_id':script,'mapping_basis':'Highest emetogenic active component and current NCCP classification.','mapping_confidence':'source_reconciled_pending_pharmacy_validation','mapping_source_url':ANTI,'validation_status':'pending_oncology_pharmacy_validation'})
 script_data=risk.get('scripts',{}).get(script)
 if script_data:
  sc['supportive_medications_pdf_url']=script_data.get('url');sc['supportive_medications_label']=script_data.get('label')
 p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
 risk.setdefault('protocols',{})[code]={'level':level,'script_id':script,'mapping_basis':sc['mapping_basis'],'mapping_confidence':sc['mapping_confidence']}
risk_path.write_text(json.dumps(risk,ensure_ascii=False,indent=2)+'\n')

# Search aliases for the skin targeted and immune therapies.
alias_path=ROOT/'js/drug-aliases.js';text=alias_path.read_text();marker='  const ENTRIES = Object.freeze([\n'
entries=[('cobimetinib','Cotellic'),('vemurafenib','Zelboraf'),('dabrafenib','Tafinlar'),('encorafenib','Braftovi'),('binimetinib','Mektovi'),('ipilimumab','Yervoy'),('nivolumab','Opdivo'),('pembrolizumab','Keytruda'),('trametinib','Mekinist'),('vismodegib','Erivedge')]
insert=''
for term,alias in entries:
 if f'terms: ["{term}"]' not in text:insert+=f'    {{ terms: ["{term}"], aliases: ["{alias}"] }},\n'
text=text.replace(marker,marker+insert,1);text=re.sub(r'version: "[0-9.]+"',f'version: "{VERSION}"',text);alias_path.write_text(text)

# UI labels and cache keys.
index=ROOT/'index.html';html=index.read_text();html=re.sub(r'<title>SACTCheck v[0-9.]+ — [^<]+</title>',f'<title>SACTCheck v{VERSION} — complete Skin and Melanoma library</title>',html);html=re.sub(r'Version [0-9.]+ · [^<]+</span>',f'Version {VERSION} · complete Skin and Melanoma library</span>',html);html=re.sub(r'\?v=[0-9.]+',f'?v={VERSION}',html);index.write_text(html)

# Package metadata and focused test.
pp=ROOT/'package.json';package=json.loads(pp.read_text());package['version']=VERSION;package['description']='NCCP protocol-driven SACT pre-assessment prototype with complete active Skin/Melanoma, Genitourinary, Gynaecology, Neuro-oncology, Sarcoma, Lung, GI and Breast libraries, single-entry assessment, tissue navigation and automatic local ULN calculations'
if 'skin-complete-library-v0450.test.js' not in package['scripts']['test']:package['scripts']['test']+=' && node tests/skin-complete-library-v0450.test.js'
package['scripts']['test:v0450']='node tests/skin-complete-library-v0450.test.js';pp.write_text(json.dumps(package,ensure_ascii=False,indent=2)+'\n')

# Carry current-release assertions forward while retaining historic clinical assertions.
for test in (ROOT/'tests').glob('*.test.js'):
 if test.name=='skin-complete-library-v0450.test.js':continue
 t=test.read_text()
 t=t.replace('Version 0.44.0 · complete Genitourinary library',f'Version {VERSION} · complete Skin and Melanoma library')
 t=t.replace('SACTCheck v0.44.0 — complete Genitourinary library',f'SACTCheck v{VERSION} — complete Skin and Melanoma library')
 t=t.replace('SACTCheck v0.44.0',f'SACTCheck v{VERSION}')
 t=t.replace('?v=0.44.0',f'?v={VERSION}')
 t=t.replace("Aliases.version, '0.44.0'",f"Aliases.version, '{VERSION}'").replace('Aliases.version,"0.44.0"',f'Aliases.version,"{VERSION}"').replace("Aliases.version,'0.44.0'",f"Aliases.version,'{VERSION}'")
 t=t.replace("riskMap.release, '0.44.0'",f"riskMap.release, '{VERSION}'").replace("riskMap.release,'0.44.0'",f"riskMap.release,'{VERSION}'").replace("risk.release,'0.44.0'",f"risk.release,'{VERSION}'")
 # Current total inventory assertions.
 t=re.sub(r'index\.protocol_count,\s*329',f'index.protocol_count, {COUNT}',t);t=re.sub(r'index\.protocols\.length,\s*329',f'index.protocols.length, {COUNT}',t);t=re.sub(r'protocols\.length,\s*329',f'protocols.length, {COUNT}',t);t=re.sub(r'\.size,\s*329',f'.size, {COUNT}',t)
 t=t.replace('length,329','length,338').replace('length, 329','length, 338').replace('Expected 329 canonical regimen protocols','Expected 338 canonical regimen protocols')
 t=t.replace('cardSidecar.protocol_count,329','cardSidecar.protocol_count,338')
 if test.name=='gu-complete-library-v0440.test.js':t=t.replace("assert(m.sactcheck_encoding_version==='0.44.0',`${code} encoding version`);","assert(['0.44.0','0.45.0'].includes(m.sactcheck_encoding_version),`${code} encoding version`);")
 # Allow the new encoding version in historical canonical-source tests.
 patterns=[
  ("['0.39.0','0.40.0','0.41.0','0.43.0','0.44.0'].includes","['0.39.0','0.40.0','0.41.0','0.43.0','0.44.0','0.45.0'].includes"),
  ("['0.41.0','0.43.0','0.44.0'].includes","['0.41.0','0.43.0','0.44.0','0.45.0'].includes"),
  ("['0.40.0','0.43.0','0.44.0'].includes","['0.40.0','0.43.0','0.44.0','0.45.0'].includes"),
  ("'0.43.0', '0.44.0'].includes","'0.43.0', '0.44.0', '0.45.0'].includes"),
 ]
 for a,b in patterns:t=t.replace(a,b)
 if test.name=='platform-standardisation-v0370.test.js' and "'skin_melanoma'" not in t:
  t=t.replace("  'immunotherapy_combination'\n]);","  'immunotherapy_combination',\n  'skin_melanoma',\n  'oral_targeted_therapy'\n]);")
 test.write_text(t)

release=f'''# SACTCheck v{VERSION} — Complete Skin and Melanoma Library

## Scope

This release completes the current NCCP Skin/Melanoma SACT catalogue as active encoded assessment protocols.

## Inventory

- 16 unique current Skin/Melanoma regimen codes
- 9 new protocol files and 7 reconciled canonical/shared protocols
- Melanoma, Merkel-cell carcinoma, cutaneous squamous-cell carcinoma and basal-cell carcinoma pathways
- {COUNT} distinct protocols across the complete SACTCheck library

## Clinical additions

- BRAF and MEK targeted therapy pathways with molecular eligibility, pyrexia, QTc, LVEF, ocular, CK and respiratory monitoring
- Dacarbazine with exact NCCP haematology and renal dose bands
- Ipilimumab and nivolumab/ipilimumab phased immune-toxicity assessment
- Avelumab for Merkel-cell carcinoma and cemiplimab for cutaneous squamous-cell carcinoma
- Pembrolizumab and nivolumab advanced/adjuvant schedule and duration contexts
- Vismodegib pregnancy-prevention and oral-treatment safeguards

## Platform standards

- Single-entry partial assessment with omitted domains reported as unassessed
- Optional immunotherapy endocrine inputs restricted to immune-checkpoint pathways
- Actual ALT/AST/bilirubin entry with central local ULN calculation
- CTCAE descriptions beside toxicity controls
- Official NCCP PDF access, aliases, intent, cycle interval and duration card metadata

All clinical encodings remain pending independent Consultant and oncology-pharmacy validation before formal deployment.
'''
(ROOT/f'RELEASE_NOTES_v{VERSION}.md').write_text(release)
(ROOT/f'UPDATE_INSTRUCTIONS_v{VERSION}.txt').write_text(f'''SACTCheck v{VERSION}\n\n1. Extract the drop-in archive.\n2. Copy everything inside it into the main Sactcheck repository folder.\n3. Choose Replace the files in the destination when prompted.\n4. Commit and push all changed/new files, including protocols/skin.\n5. Hard-refresh the deployed site after GitHub Pages rebuilds.\n\nThis release updates protocol JSON, the index, regimen-card metadata, aliases, supportive-care mapping, tests and versioned cache keys.\n''')

source=['# Skin and Melanoma Library Sources — v0.45.0','',f'Official catalogue: {CAT}','', 'Catalogue checked: 25 July 2026','']
for p,d in canonical_files():
 if 'Skin/Melanoma' not in groups(d):continue
 m=d['metadata'];source.append(f"- NCCP {str(m['nccp_regimen_code']).zfill(5)} v{m['nccp_version']} — {m['title']} — {m['source_url']}")
(ROOT/'SKIN_MELANOMA_LIBRARY_SOURCES_v0.45.0.md').write_text('\n'.join(source)+'\n')

skin=[]
for p,d in canonical_files():
 if 'Skin/Melanoma' in groups(d):
  m=d['metadata'];skin.append({'code':str(m['nccp_regimen_code']).zfill(5),'version':m.get('nccp_version'),'title':m.get('title'),'path':p.relative_to(ROOT).as_posix(),'source_url':m.get('source_url'),'subgroups':m.get('skin_subgroups'),'status':d.get('status'),'input_count':len(d.get('input_definitions') or {}),'rule_count':len(d.get('rule_engine',{}).get('rules') or []),'card_contexts':len((m.get('regimen_card') or {}).get('contexts') or [])})
(ROOT/'V0450_SKIN_LIBRARY_AUDIT.json').write_text(json.dumps({'release':VERSION,'catalogue_url':CAT,'catalogue_checked_date':'2026-07-25','unique_protocol_count':len(skin),'library_protocol_count':COUNT,'protocols':sorted(skin,key=lambda x:x['code'])},ensure_ascii=False,indent=2)+'\n')

cl=ROOT/'CHANGELOG.MD';old=cl.read_text();entry=f'''## v{VERSION} — Complete Skin and Melanoma Library\n- Added/reconciled all 16 current unique NCCP Skin/Melanoma regimen codes.\n- Added 9 new protocols and reconciled 7 existing/shared canonical protocols without duplicate cards.\n- Added melanoma, Merkel-cell, cutaneous squamous-cell and basal-cell assessment pathways.\n- Expanded the complete indexed library to {COUNT} protocols.\n- Corrected q42-day pembrolizumab metadata and added advanced, adjuvant and phased-course card contexts.\n\n'''
if f'## v{VERSION}' not in old:cl.write_text(entry+old)
print(f'Finalised {VERSION}; Skin/Melanoma={len(skin)}, library={COUNT}, supportive-care={len(risk.get("protocols",{}))}.')
