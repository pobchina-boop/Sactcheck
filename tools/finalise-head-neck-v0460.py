#!/usr/bin/env python3
from __future__ import annotations
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
VERSION='0.46.0'; COUNT=359; CHECKED='2026-07-26'
ANTI='https://healthservice.hse.ie/documents/7152/Classification_Document_for_Systemic_Anti-_Cancer_Therapy_SACT_Induced_Nausea__pWgDCrm.pdf'
CAT='https://healthservice.hse.ie/staff/information-healthcare-workers/nccp/head-and-neck-sact-regimens/'

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

# Supportive-care mapping for all current Head and Neck regimens.
risk_path=ROOT/'data/emetogenic-risk-map.json';risk=json.loads(risk_path.read_text());risk['release']=VERSION
for p,d in canonical_files():
 if 'Head and Neck' not in groups(d):continue
 m=d['metadata'];code=str(m['nccp_regimen_code']).zfill(5);sc=d.setdefault('supportive_care',{});drugs=' '.join(m.get('drugs') or d.get('treatment',{}).get('drugs') or []).lower()
 if any(x in drugs for x in ['cisplatin','fluorouracil']) or code in ['00552','00591','00589','00418','00615','00324','00323','00517','00903','00315','00705','00706']:level,script='high','nccp-parenteral-high'
 elif any(x in drugs for x in ['carboplatin','gemcitabine','methotrexate','paclitaxel','doxorubicin']):level,script='moderate','nccp-parenteral-moderate'
 elif any(x in drugs for x in ['lenvatinib','sorafenib','vandetanib']):level,script='oral_minimal_low','nccp-oral-minimal-low'
 else:level,script='minimal','nccp-minimal-no-routine-prophylaxis'
 sc.update({'emetogenic_risk':level,'script_id':script,'mapping_basis':'Highest emetogenic active component and phase-specific NCCP classification.','mapping_confidence':'source_reconciled_pending_pharmacy_validation','mapping_source_url':ANTI,'validation_status':'pending_oncology_pharmacy_validation'})
 script_data=risk.get('scripts',{}).get(script)
 if script_data:
  sc['supportive_medications_pdf_url']=script_data.get('url');sc['supportive_medications_label']=script_data.get('label')
 p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
 risk.setdefault('protocols',{})[code]={'level':level,'script_id':script,'mapping_basis':sc['mapping_basis'],'mapping_confidence':sc['mapping_confidence']}
risk_path.write_text(json.dumps(risk,ensure_ascii=False,indent=2)+'\n')

# Search aliases.
alias_path=ROOT/'js/drug-aliases.js';text=alias_path.read_text();marker='  const ENTRIES = Object.freeze([\n'
entries=[('cetuximab','Erbitux'),('fluorouracil','5-FU'),('docetaxel','Taxotere'),('gemcitabine','Gemzar'),('lenvatinib','Lenvima'),('methotrexate','MTX'),('paclitaxel','Taxol'),('sorafenib','Nexavar'),('vandetanib','Caprelsa')]
insert=''
for term,alias in entries:
 if f'terms: ["{term}"]' not in text:insert+=f'    {{ terms: ["{term}"], aliases: ["{alias}"] }},\n'
text=text.replace(marker,marker+insert,1);text=re.sub(r'version: "[0-9.]+"',f'version: "{VERSION}"',text);alias_path.write_text(text)

# UI version and cache keys.
index=ROOT/'index.html';html=index.read_text();html=re.sub(r'<title>SACTCheck v[0-9.]+ — [^<]+</title>',f'<title>SACTCheck v{VERSION} — complete Head and Neck library</title>',html);html=re.sub(r'Version [0-9.]+ · [^<]+</span>',f'Version {VERSION} · complete Head and Neck library</span>',html);html=re.sub(r'\?v=[0-9.]+',f'?v={VERSION}',html);index.write_text(html)

# Package and tests.
pp=ROOT/'package.json';package=json.loads(pp.read_text());package['version']=VERSION;package['description']='NCCP protocol-driven SACT pre-assessment prototype with complete active Head and Neck, Skin/Melanoma, Genitourinary, Gynaecology, Neuro-oncology, Sarcoma, Lung, GI and Breast solid-tumour libraries'
if 'head-neck-complete-library-v0460.test.js' not in package['scripts']['test']:package['scripts']['test']+=' && node tests/head-neck-complete-library-v0460.test.js'
package['scripts']['test:v0460']='node tests/head-neck-complete-library-v0460.test.js';pp.write_text(json.dumps(package,ensure_ascii=False,indent=2)+'\n')

# Carry current-release assertions forward while retaining clinical assertions.
for test in (ROOT/'tests').glob('*.test.js'):
 if test.name=='head-neck-complete-library-v0460.test.js':continue
 t=test.read_text()
 t=re.sub(r'Version 0\.45\.3 · direct clinical PDF generation',f'Version {VERSION} · complete Head and Neck library',t)
 t=re.sub(r'SACTCheck v0\.45\.3 — direct clinical PDF output',f'SACTCheck v{VERSION} — complete Head and Neck library',t)
 t=t.replace('SACTCheck v0.45.3',f'SACTCheck v{VERSION}').replace('?v=0.45.3',f'?v={VERSION}').replace('?v=0.45.1',f'?v={VERSION}')
 t=t.replace("Aliases.version, '0.45.3'",f"Aliases.version, '{VERSION}'").replace("Aliases.version,'0.45.3'",f"Aliases.version,'{VERSION}'")
 t=t.replace("riskMap.release, '0.45.3'",f"riskMap.release, '{VERSION}'").replace("riskMap.release,'0.45.3'",f"riskMap.release,'{VERSION}'").replace("risk.release,'0.45.3'",f"risk.release,'{VERSION}'")
 # Current inventory assertions, avoiding clinical numeric thresholds.
 for old in [338]:
  t=re.sub(r'index\.protocol_count,\s*'+str(old),f'index.protocol_count, {COUNT}',t)
  t=re.sub(r'index\.protocols\.length,\s*'+str(old),f'index.protocols.length, {COUNT}',t)
  t=re.sub(r'protocols\.length,\s*'+str(old),f'protocols.length, {COUNT}',t)
  t=t.replace(f'cardSidecar.protocol_count,{old}',f'cardSidecar.protocol_count,{COUNT}').replace(f'cardSidecar.protocol_count, {old}',f'cardSidecar.protocol_count, {COUNT}')
  t=t.replace(f'Expected {old} canonical regimen protocols',f'Expected {COUNT} canonical regimen protocols')
 # Permit the new encoding version for reconciled protocols in historical tests.
 t=t.replace("'0.44.0','0.45.0'].includes","'0.44.0','0.45.0','0.46.0'].includes")
 t=t.replace("'0.44.0', '0.45.0'].includes","'0.44.0', '0.45.0', '0.46.0'].includes")
 test.write_text(t)

# Documentation and audit.
source=['# Head and Neck Library Sources — v0.46.0','',f'Official catalogue: {CAT}','',f'Catalogue checked: {CHECKED}','']
hn=[]
for p,d in canonical_files():
 if 'Head and Neck' not in groups(d):continue
 m=d['metadata'];code=str(m['nccp_regimen_code']).zfill(5);source.append(f"- NCCP {code} v{m.get('nccp_version')} — {m.get('title')} — {m.get('source_url')}")
 hn.append({'code':code,'version':m.get('nccp_version'),'title':m.get('title'),'path':p.relative_to(ROOT).as_posix(),'source_url':m.get('source_url'),'subgroups':m.get('head_neck_subgroups'),'input_count':len(d.get('input_definitions') or {}),'rule_count':len(d.get('rule_engine',{}).get('rules') or []),'card_contexts':len((m.get('regimen_card') or {}).get('contexts') or [])})
(ROOT/'HEAD_NECK_LIBRARY_SOURCES_v0.46.0.md').write_text('\n'.join(source)+'\n')
(ROOT/'V0460_HEAD_NECK_LIBRARY_AUDIT.json').write_text(json.dumps({'release':VERSION,'catalogue_url':CAT,'catalogue_checked_date':CHECKED,'unique_protocol_count':len(hn),'library_protocol_count':COUNT,'protocols':sorted(hn,key=lambda x:x['code'])},ensure_ascii=False,indent=2)+'\n')

release=f'''# SACTCheck v{VERSION} — Complete Head and Neck Library

## Scope

This release completes the current NCCP Head and Neck SACT catalogue as active encoded assessment protocols.

## Inventory

- 30 unique current Head and Neck regimen codes
- 21 new protocol files and 9 reconciled canonical/shared protocols
- Squamous-cell, nasopharyngeal, salivary-gland and thyroid pathways
- {COUNT} distinct protocols across the complete SACTCheck library

## Clinical additions

- Definitive and adjuvant platinum/fluorouracil chemoradiation pathways
- Cetuximab/platinum/fluorouracil and paclitaxel/cetuximab pathways
- TPF/TCF induction and phased chemoradiation schedules
- Nasopharyngeal gemcitabine/cisplatin and gemcitabine monotherapy pathways
- Methotrexate palliative pathway with renal, hepatic and mucositis rules
- Pembrolizumab/platinum/fluorouracil combination and maintenance contexts
- Lenvatinib, sorafenib and vandetanib thyroid-cancer pathways

All encodings remain pending independent Consultant and oncology-pharmacy validation before formal deployment.
'''
(ROOT/f'RELEASE_NOTES_v{VERSION}.md').write_text(release)
(ROOT/f'UPDATE_INSTRUCTIONS_v{VERSION}.txt').write_text(f'''SACTCheck v{VERSION}\n\n1. Extract the drop-in archive.\n2. Copy everything inside it into the main Sactcheck repository folder.\n3. Choose Replace the files in the destination.\n4. Commit and push all changed/new files, including protocols/head-neck.\n5. Restart Live Server and hard-refresh the deployed site.\n''')
commit='''Summary\n\nComplete Head and Neck protocol library and release v0.46.0\n\nDescription\n\n- Completed the Head and Neck SACT library across squamous-cell, nasopharyngeal, salivary-gland and thyroid cancers.\n- Added 21 new canonical protocol files.\n- Reconciled 9 existing shared protocols without duplicate regimen cards.\n- Expanded Head and Neck coverage to 30 unique protocols.\n- Added source-specific haematology, renal, hepatic, toxicity and phased-treatment pathways.\n- Added contextual indication, cycle interval, intent and treatment-duration metadata.\n- Updated aliases, official NCCP links and supportive-care mappings.\n- Expanded the complete SACTCheck library from 338 to 359 indexed protocols.\n- Added Head and Neck validation and single-value regression tests.\n- Updated the application version to v0.46.0.\n'''
(ROOT/'GITHUB_COMMIT_v0.46.0.txt').write_text(commit)
cl=ROOT/'CHANGELOG.MD';old=cl.read_text();entry=f'''## v{VERSION} — Complete Head and Neck Library\n- Added/reconciled all 30 current unique NCCP Head and Neck regimen codes.\n- Added 21 new protocols and reconciled 9 existing/shared canonical protocols without duplicate cards.\n- Added squamous-cell, nasopharyngeal, salivary-gland and thyroid assessment pathways.\n- Expanded the indexed library to {COUNT} protocols.\n\n'''
if f'## v{VERSION}' not in old:cl.write_text(entry+old)
print(f'Finalised {VERSION}; Head and Neck={len(hn)}, library={COUNT}.')
