#!/usr/bin/env python3
from __future__ import annotations
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
VERSION='0.47.0';COUNT=361;CHECKED='2026-07-26'
NET_CAT='https://healthservice.hse.ie/staff/information-healthcare-workers/nccp/neuroendocrine-sact-regimens/'
TA_CAT='https://healthservice.hse.ie/staff/information-healthcare-workers/nccp/tumou-agnostic-therapy-sact-regimens/'
ANTI='https://healthservice.hse.ie/documents/7152/Classification_Document_for_Systemic_Anti-_Cancer_Therapy_SACT_Induced_Nausea__pWgDCrm.pdf'

def read(p):return json.loads((ROOT/p).read_text())
def write(p,o):(ROOT/p).write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')
def groups(d):
 m=d.get('metadata',{});out=[]
 if isinstance(m.get('tumour_group'),str):out.append(m['tumour_group'])
 for v in m.get('tumour_groups') or []:
  if v not in out:out.append(v)
 return out
idx=read('protocols/index.json')
# Risk mapping: preserve existing source mappings and add the two new oral agents.
risk=read('data/emetogenic-risk-map.json');risk['release']=VERSION
for code in ['00327','00758']:
 risk.setdefault('protocols',{})[code]={'level':'oral_minimal_low','script_id':'nccp-oral-minimal-low','mapping_basis':'Current NCCP source classifies the oral agent as minimal to low emetogenic risk.','mapping_confidence':'source_reconciled_pending_pharmacy_validation'}
write('data/emetogenic-risk-map.json',risk)
# Current UI/module/cache version.
for rel in ['js/tissue-ui.js','js/protocol-context.js']:
 p=ROOT/rel;t=p.read_text();t=re.sub(r'version: "[0-9.]+"',f'version: "{VERSION}"',t);p.write_text(t)
p=ROOT/'index.html';html=p.read_text();html=re.sub(r'<title>SACTCheck v[0-9.]+ — [^<]+</title>',f'<title>SACTCheck v{VERSION} — complete Neuroendocrine and adult tumour-agnostic libraries</title>',html);html=re.sub(r'Version [0-9.]+ · [^<]+</span>',f'Version {VERSION} · complete Neuroendocrine and adult tumour-agnostic libraries</span>',html);html=re.sub(r'\?v=[0-9.]+',f'?v={VERSION}',html);p.write_text(html)
# Package scripts.
p=ROOT/'package.json';pkg=json.loads(p.read_text());pkg['version']=VERSION;pkg['description']='NCCP protocol-driven SACT pre-assessment prototype with complete adult solid-tumour libraries including Neuroendocrine and adult tumour-agnostic therapy'
if 'net-tumour-agnostic-complete-v0470.test.js' not in pkg['scripts']['test']:pkg['scripts']['test']+=' && node tests/net-tumour-agnostic-complete-v0470.test.js'
pkg['scripts']['test:v0470']='node tests/net-tumour-agnostic-complete-v0470.test.js';p.write_text(json.dumps(pkg,ensure_ascii=False,indent=2)+'\n')
# Carry forward only current inventory/UI/supportive-care assertions. Do not alter historical clinical encoding markers.
for test in (ROOT/'tests').glob('*.test.js'):
 if test.name=='net-tumour-agnostic-complete-v0470.test.js':continue
 t=test.read_text().replace('359','361')
 lines=[]
 for line in t.splitlines():
  if ('Version 0.46.0' in line or '?v=0.46.0' in line or 'risk.release' in line or 'riskMap.release' in line or 'Aliases.version' in line) and 'sactcheck_encoding_version' not in line:
   line=line.replace('0.46.0',VERSION)
  lines.append(line)
 test.write_text('\n'.join(lines)+'\n')
# Source/audit registers.
items=[]
for e in idx['protocols']:
 d=read(e['path']);gs=groups(d)
 if 'Neuroendocrine' in gs or 'Tumour Agnostic Therapy' in gs:
  m=d['metadata'];items.append({'code':m['nccp_regimen_code'],'version':m['nccp_version'],'title':m['title'],'groups':[g for g in gs if g in ['Neuroendocrine','Tumour Agnostic Therapy']],'path':e['path'],'source_url':m['source_url'],'input_count':len(d.get('input_definitions',{})),'rule_count':len(d.get('rule_engine',{}).get('rules',[]))})
source=['# Neuroendocrine and Adult Tumour-Agnostic Library Sources — v0.47.0','',f'Neuroendocrine catalogue: {NET_CAT}',f'Tumour-agnostic catalogue: {TA_CAT}',f'Catalogues checked: {CHECKED}','']
for x in sorted(items,key=lambda x:(x['groups'][0],x['code'])):source.append(f"- {', '.join(x['groups'])}: NCCP {x['code']} v{x['version']} — {x['title']} — {x['source_url']}")
(ROOT/'NEUROENDOCRINE_TUMOUR_AGNOSTIC_SOURCES_v0.47.0.md').write_text('\n'.join(source)+'\n')
write('V0470_NET_TUMOUR_AGNOSTIC_AUDIT.json',{'release':VERSION,'catalogues_checked_date':CHECKED,'neuroendocrine_catalogue_url':NET_CAT,'tumour_agnostic_catalogue_url':TA_CAT,'library_protocol_count':COUNT,'protocols':items})
release=f'''# SACTCheck v{VERSION} — Complete Neuroendocrine and Adult Tumour-Agnostic Libraries

## Scope

This release completes the current NCCP Neuroendocrine catalogue and the adult portion of the Tumour Agnostic Therapy catalogue.

## Inventory

- 3 unique Neuroendocrine regimens: everolimus, lutetium-177 oxodotreotide and sunitinib 37.5 mg
- 2 adult tumour-agnostic NTRK regimens: entrectinib and larotrectinib
- 2 new canonical protocol files and 3 existing/shared protocol reconciliations
- {COUNT} distinct protocols across the complete SACTCheck library

## Clinical additions

- Sunitinib 37.5 mg continuous pancreatic-NET pathway with exact ANC/platelet thresholds, hepatic, cardiovascular, hand-foot and toxicity rules
- Larotrectinib adult NTRK pathway with eligibility/exclusion, CYP3A, toxicity and source-specific hepatic rules
- Tissue-specific Neuroendocrine and tumour-agnostic card descriptions and assessment indication preselection
- Dedicated Neuroendocrine and Tumour Agnostic catalogue tiles

Paediatric larotrectinib remains outside this adult solid-tumour release. All encodings remain pending independent Consultant and oncology-pharmacy validation.
'''
(ROOT/f'RELEASE_NOTES_v{VERSION}.md').write_text(release)
(ROOT/f'UPDATE_INSTRUCTIONS_v{VERSION}.txt').write_text(f'''SACTCheck v{VERSION}\n\n1. Extract the drop-in archive.\n2. Copy everything inside it into the main Sactcheck repository folder.\n3. Choose Replace the files in the destination.\n4. Commit and push all changed/new files, including protocols/neuroendocrine and protocols/tumour-agnostic.\n5. Restart Live Server and hard-refresh the deployed site.\n''')
commit=f'''Summary\n\nComplete Neuroendocrine and adult tumour-agnostic libraries and release v{VERSION}\n\nDescription\n\n- Completed the current NCCP Neuroendocrine catalogue with 3 unique regimens.\n- Completed the adult NCCP Tumour Agnostic Therapy catalogue with 2 NTRK-targeted regimens.\n- Added new sunitinib 37.5 mg and adult larotrectinib protocol files.\n- Reconciled everolimus, lutetium-177 oxodotreotide and entrectinib as shared protocols without duplicate cards.\n- Added tissue-specific indications, treatment context, cycle interval and duration metadata.\n- Added exact sunitinib ANC, platelet, hepatic, cardiac, hand-foot and toxicity pathways.\n- Added larotrectinib eligibility, CYP3A, toxicity and hepatic dose-modification pathways.\n- Added dedicated Neuroendocrine and Tumour Agnostic catalogue navigation.\n- Expanded the complete SACTCheck library from 359 to 361 indexed protocols.\n- Added release-specific validation and single-value regression tests.\n- Updated the application version to v{VERSION}.\n'''
(ROOT/'GITHUB_COMMIT_v0.47.0.txt').write_text(commit)
cl=ROOT/'CHANGELOG.MD';old=cl.read_text();entry=f'''## v{VERSION} — Complete Neuroendocrine and Adult Tumour-Agnostic Libraries\n- Completed 3 Neuroendocrine and 2 adult tumour-agnostic regimen families.\n- Added sunitinib 37.5 mg and adult larotrectinib; reconciled everolimus, lutetium-177 oxodotreotide and entrectinib.\n- Added dedicated navigation, contextual indications and source-specific rule pathways.\n- Expanded the indexed library to {COUNT} protocols.\n\n'''
if f'## v{VERSION}' not in old:cl.write_text(entry+old)
print(f'Finalised {VERSION}: {len(items)} NET/TA mappings; library={COUNT}.')
