#!/usr/bin/env python3
from __future__ import annotations
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
VERSION='0.42.0'
COUNT=280

# Materialise supportive-care registry references for the new Neuro-oncology protocols.
risk_path=ROOT/'data/emetogenic-risk-map.json'
risk=json.loads(risk_path.read_text())
risk['release']=VERSION
for p in (ROOT/'protocols'/'neuro-oncology').glob('*.json'):
    d=json.loads(p.read_text());m=d['metadata'];code=str(m['nccp_regimen_code']).zfill(5);sc=d.get('supportive_care') or {}
    entry={'level':sc.get('emetogenic_risk','pending'),'script_id':sc.get('script_id'),'mapping_basis':sc.get('mapping_basis'),'mapping_confidence':sc.get('mapping_confidence')}
    if sc.get('phase_profiles'):entry['phase_profiles']=sc['phase_profiles']
    risk.setdefault('protocols',{})[code]=entry
    sid=sc.get('script_id');script=risk.get('scripts',{}).get(sid or '')
    if script and sc.get('emetogenic_risk')!='phase_dependent':
        sc['supportive_medications_pdf_url']=script.get('url');sc['supportive_medications_label']=script.get('label')
    else:
        sc.pop('supportive_medications_pdf_url',None);sc.pop('supportive_medications_label',None)
    p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
risk_path.write_text(json.dumps(risk,ensure_ascii=False,indent=2)+'\n')

# Alias registry: retain existing entries and add the two missing Neuro-oncology aliases.
alias_path=ROOT/'js'/'drug-aliases.js';text=alias_path.read_text()
marker='  const ENTRIES = Object.freeze([\n'
insert=''
if 'terms: ["lomustine"]' not in text:insert+='    { terms: ["lomustine"], aliases: ["CCNU"] },\n'
if 'terms: ["procarbazine"]' not in text:insert+='    { terms: ["procarbazine"], aliases: ["Matulane"] },\n'
text=text.replace(marker,marker+insert,1)
text=re.sub(r'version: "[0-9.]+"',f'version: "{VERSION}"',text)
alias_path.write_text(text)

# Main UI release label and cache busting.
index=ROOT/'index.html';html=index.read_text()
html=re.sub(r'<title>SACTCheck v[0-9.]+ — [^<]+</title>',f'<title>SACTCheck v{VERSION} — complete Neuro-oncology library</title>',html)
html=re.sub(r'Version [0-9.]+ · [^<]+</span>',f'Version {VERSION} · complete Neuro-oncology library</span>',html)
html=re.sub(r'\?v=[0-9.]+',f'?v={VERSION}',html)
index.write_text(html)

# Package metadata and test command.
package_path=ROOT/'package.json';package=json.loads(package_path.read_text());package['version']=VERSION
package['description']='NCCP protocol-driven SACT pre-assessment prototype with complete active Neuro-oncology, Sarcoma, Lung, GI and Prostate libraries, single-entry assessment, tissue navigation and automatic local ULN calculations'
if 'neuro-complete-library-v0420.test.js' not in package['scripts']['test']:
    package['scripts']['test'] += ' && node tests/neuro-complete-library-v0420.test.js'
package['scripts']['test:v0420']='node tests/neuro-complete-library-v0420.test.js'
package_path.write_text(json.dumps(package,ensure_ascii=False,indent=2)+'\n')

# Keep historical tests current for the expanded canonical library. The v0.41.1
# title-normalisation audit deliberately retains its own release-specific marker.
for test in (ROOT/'tests').glob('*.test.js'):
    if test.name=='title-normalisation-v0411.test.js':continue
    t=test.read_text()
    t=t.replace('Version 0.41.1 · title normalisation hotfix',f'Version {VERSION} · complete Neuro-oncology library')
    t=t.replace('SACTCheck v0.41.1 — title normalisation hotfix',f'SACTCheck v{VERSION} — complete Neuro-oncology library')
    t=t.replace('SACTCheck v0.41.1',f'SACTCheck v{VERSION}')
    t=t.replace('?v=0.41.1',f'?v={VERSION}')
    t=t.replace("Aliases.version, '0.41.1'",f"Aliases.version, '{VERSION}'")
    t=t.replace('Aliases.version,"0.41.1"',f'Aliases.version,"{VERSION}"')
    t=t.replace("riskMap.release, '0.41.1'",f"riskMap.release, '{VERSION}'")
    t=t.replace("riskMap.release,'0.41.1'",f"riskMap.release,'{VERSION}'")
    # exact whole-library count assertions carried forward from prior releases
    t=re.sub(r'index\.protocol_count,\s*270',f'index.protocol_count, {COUNT}',t)
    t=re.sub(r'index\.protocols\.length,\s*270',f'index.protocols.length, {COUNT}',t)
    t=re.sub(r'\.size,\s*270',f'.size, {COUNT}',t)
    t=re.sub(r'protocols\.length,\s*270',f'protocols.length, {COUNT}',t)
    t=re.sub(r'Object\.keys\(riskMap\.protocols \|\| \{\}\)\.length,\s*270',f'Object.keys(riskMap.protocols || {{}}).length, {COUNT}',t)
    t=re.sub(r'Object\.keys\(riskMap\.protocols\|\|\{\}\)\.length,270',f'Object.keys(riskMap.protocols||{{}}).length,{COUNT}',t)
    # platform standardisation allow-list
    if test.name=='platform-standardisation-v0370.test.js' and "'0.42.0'" not in t:
        t=t.replace("'0.41.1']", "'0.41.1', '0.42.0']")
    test.write_text(t)

# Release documentation.
release=f'''# SACTCheck v{VERSION} — Complete Neuro-oncology Library\n\n## Scope\n\nThis release adds the complete current NCCP Neuro-oncology SACT catalogue as active encoded assessment protocols.\n\n## Inventory\n\n- 10 active Neuro-oncology protocols\n- No Neuro-oncology placeholders or draft cards\n- 280 distinct protocols across the complete SACTCheck library\n\n## Clinical pathways added\n\n- Bevacizumab monotherapy for recurrent glioblastoma\n- CLV for high-risk medulloblastoma / PNET\n- PCV 42-day and 56-day schedules\n- Lomustine monotherapy\n- Lomustine plus bevacizumab 5 mg/kg and 7.5 mg/kg schedules\n- Recurrent temozolomide therapy\n- Standard concomitant radiotherapy plus adjuvant temozolomide\n- Short-course radiotherapy plus adjuvant temozolomide for patients over 65 years\n\n## Platform standards\n\n- Single-entry partial assessment\n- Missing values remain unassessed and non-blocking\n- Toxicity-specific CTCAE descriptions beside grade controls\n- Protocol-specific renal-band selectors\n- Phase-specific supportive-care mappings\n- Searchable common and trade-name aliases\n- Direct links to official NCCP PDFs\n\nAll clinical encodings remain pending independent consultant and oncology-pharmacy validation before formal deployment.\n'''
(ROOT/f'RELEASE_NOTES_v{VERSION}.md').write_text(release)
(ROOT/f'UPDATE_INSTRUCTIONS_v{VERSION}.txt').write_text(f'''SACTCheck v{VERSION}\n\n1. Extract this archive.\n2. Replace the previous Sactcheck project contents with this complete folder.\n3. Commit and push all changed and new files, including protocols/neuro-oncology.\n4. Hard-refresh the deployed site after GitHub Pages finishes rebuilding.\n\nDo not copy only the protocol JSON files: the release also updates the protocol index, aliases, supportive-care registry, tests and cache keys.\n''')
source_lines=['# Neuro-oncology Library Sources — v0.42.0','','Official catalogue: https://healthservice.hse.ie/staff/information-healthcare-workers/nccp/neuro-oncology-sact-regimens/','']
for p in sorted((ROOT/'protocols'/'neuro-oncology').glob('*.json')):
    d=json.loads(p.read_text());m=d['metadata'];source_lines.append(f"- NCCP {m['nccp_regimen_code']} v{m['nccp_version']} — {m['title']} — {m['source_url']}")
(ROOT/'NEURO_ONCOLOGY_LIBRARY_SOURCES_v0.42.0.md').write_text('\n'.join(source_lines)+'\n')

# Changelog entry.
changelog=ROOT/'CHANGELOG.MD';old=changelog.read_text();entry=f'''## v{VERSION} — Complete Neuro-oncology Library\n- Added 10 fully encoded current NCCP Neuro-oncology protocols.\n- Added glioblastoma, glioma, medulloblastoma/PNET, PCV, CLV, lomustine, bevacizumab and temozolomide pathways.\n- Added source-specific count, renal, hepatic, toxicity, proteinuria, radiotherapy-phase and PJP-prophylaxis logic.\n- Expanded the complete indexed library to 280 protocols.\n\n'''
if f'## v{VERSION}' not in old:changelog.write_text(entry+old)
print(f'Finalised v{VERSION}; supportive-care registry now covers {len(risk.get("protocols",{}))} protocols.')
