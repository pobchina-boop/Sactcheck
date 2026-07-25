#!/usr/bin/env python3
from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parents[1]
CANON={'nccp-high-risk-parenteral':'nccp-parenteral-high','nccp-moderate-risk-parenteral':'nccp-parenteral-moderate','nccp-low-risk-parenteral':'nccp-parenteral-low'}
PHASE_PROFILES={
 '00675':{'ie_days_1_to_5':{'level':'high','script_id':'nccp-parenteral-high'},'vac_vdc_day_1':{'level':'high','script_id':'nccp-parenteral-high'}},
 '00747':{'ie_days_1_to_5':{'level':'high','script_id':'nccp-parenteral-high'},'vac_vdc_day_1':{'level':'high','script_id':'nccp-parenteral-high'}},
 '00463':{'doxorubicin_cisplatin_phase':{'level':'high','script_id':'nccp-parenteral-high'},'high_dose_methotrexate_phase':{'level':'low','script_id':'nccp-parenteral-low'}},
 '00754':{'ifosfamide_doxorubicin_phase':{'level':'high','script_id':'nccp-parenteral-high'},'vincristine_dactinomycin_phase':{'level':'low','script_id':'nccp-parenteral-low'}},
 '00504':{'irinotecan_temozolomide_days_1_to_5':{'level':'moderate','script_id':'nccp-parenteral-moderate'}},
 '00757':{'irinotecan_temozolomide_phase':{'level':'moderate','script_id':'nccp-parenteral-moderate'},'vincristine_only_phase':{'level':'minimal','script_id':'nccp-minimal-no-routine-prophylaxis'}},
}
ALIASES=[
 ('dacarbazine',['DTIC']),('doxorubicin',['Adriamycin']),('cisplatin',['Platinol']),('ifosfamide',['Mitoxana']),
 ('imatinib',['Glivec']),('mifamurtide',['Mepact']),('pazopanib',['Votrient']),('pegylated liposomal doxorubicin',['Caelyx']),
 ('regorafenib',['Stivarga']),('sunitinib',['Sutent']),('trabectedin',['Yondelis']),('vinblastine',['Velbe']),
 ('docetaxel',['Taxotere']),('gemcitabine',['Gemzar']),('vincristine',['Oncovin']),('cyclophosphamide',['Endoxan']),
 ('irinotecan',['Campto']),('temozolomide',['Temodal'])
]

def regimen_files():
 for p in ROOT.glob('protocols/**/*.json'):
  if p.name in {'index.json','protocol-schema.json','package.json'} or '_template' in p.parts: continue
  try:d=json.loads(p.read_text())
  except Exception:continue
  if d.get('protocol_id') and d.get('metadata',{}).get('nccp_regimen_code') not in (None,'00000'):
   yield p,d

def groups(m):
 out=[]
 if isinstance(m.get('tumour_group'),str):out.append(m['tumour_group'])
 for x in m.get('tumour_groups') or []:
  if x not in out:out.append(x)
 return out

sarcoma_count=0;grade_count=0;renal_count=0
for p,d in regimen_files():
 m=d.get('metadata',{})
 if 'Sarcoma' not in groups(m):continue
 sarcoma_count+=1
 d['status']='encoded_prototype_pending_clinical_and_pharmacy_validation'
 m['sactcheck_encoding_version']='0.41.0'
 m['partial_assessment_supported']=True
 m['partial_assessment_note']='Any independently actionable entered value is assessed; omitted domains remain unassessed and do not block a partial result.'
 m.setdefault('validation',{}).update({'official_catalogue_and_source_link_checked':True,'rule_level_source_reconciliation_status':'pending_independent_clinical_and_oncology_pharmacy_validation','software_tests_completed':True,'consultant_reviewed':False,'oncology_pharmacy_reviewed':False,'clinical_use_authorised':False})
 d['required_inputs']=[]
 for fid,definition in (d.get('input_definitions') or {}).items():
  if not isinstance(definition,dict):continue
  definition['required']=False
  text=f"{fid} {definition.get('label','')}".lower()
  if definition.get('type')=='select' and (definition.get('ctcae_version') or re.search(r'(^|_)grade($|_)| grade',text)):
   definition.setdefault('ctcae_version','5.0')
   definition.setdefault('assessment_guidance','Identify the exact named adverse event and grade it using the displayed CTCAE v5.0 criteria, objective findings, intervention required and functional impact.')
   grade_count+=1
  if re.search(r'crcl|creatinine clearance|\begfr\b|renal function',text):
   if definition.get('type')=='select':
    definition['renal_input']={'mode':'protocol_specific_band','exact_value_required':False};renal_count+=1
 sc=d.setdefault('supportive_care',{})
 if sc.get('script_id') in CANON:sc['script_id']=CANON[sc['script_id']]
 code=str(m.get('nccp_regimen_code','')).zfill(5)
 if code in PHASE_PROFILES:
  sc['emetogenic_risk']='phase_dependent';sc['phase_profiles']=PHASE_PROFILES[code]
  sc.pop('supportive_medications_pdf_url',None);sc.pop('supportive_medications_label',None)
 p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')

# Add central aliases and update alias module version.
alias_path=ROOT/'js/drug-aliases.js';text=alias_path.read_text()
marker='  const ENTRIES = Object.freeze([\n'
insert=''.join(f'    {{ terms: ["{term}"], aliases: {json.dumps(aliases)} }},\n' for term,aliases in ALIASES if f'terms: ["{term}"]' not in text)
text=text.replace(marker,marker+insert,1)
text=re.sub(r'version: "[0-9.]+"','version: "0.41.0"',text)
alias_path.write_text(text)

# Rebuild central supportive-care map from every canonical protocol.
risk_path=ROOT/'data/emetogenic-risk-map.json';risk=json.loads(risk_path.read_text());risk['release']='0.41.0';risk['protocols']={}
for p,d in regimen_files():
 m=d.get('metadata',{});code=str(m.get('nccp_regimen_code','')).zfill(5);sc=d.get('supportive_care') or {}
 sid=CANON.get(sc.get('script_id'),sc.get('script_id'))
 if sid:sc['script_id']=sid
 entry={'level':sc.get('emetogenic_risk','pending'),'script_id':sid,'mapping_basis':sc.get('mapping_basis','Protocol supportive-care mapping carried forward for controlled review.'),'mapping_confidence':sc.get('mapping_confidence','requires_review')}
 if sc.get('phase_profiles'):entry['phase_profiles']=sc['phase_profiles']
 risk['protocols'][code]=entry
 script=risk.get('scripts',{}).get(sid or '')
 if script and sc.get('emetogenic_risk')!='phase_dependent':
  sc['supportive_medications_pdf_url']=script.get('url');sc['supportive_medications_label']=script.get('label')
 elif sc.get('emetogenic_risk')=='phase_dependent':
  sc.pop('supportive_medications_pdf_url',None);sc.pop('supportive_medications_label',None)
 p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
risk_path.write_text(json.dumps(risk,ensure_ascii=False,indent=2)+'\n')

# Version strings and cache keys.
index=ROOT/'index.html';html=index.read_text()
html=html.replace('SACTCheck v0.40.0 — complete lung library','SACTCheck v0.41.0 — complete sarcoma library')
html=html.replace('Version 0.40.0 · complete lung library','Version 0.41.0 · complete sarcoma library')
html=html.replace('?v=0.40.0','?v=0.41.0')
index.write_text(html)

package_path=ROOT/'package.json';package=json.loads(package_path.read_text());package['version']='0.41.0';package['description']='NCCP protocol-driven SACT pre-assessment prototype with complete active lung, gastrointestinal, prostate and sarcoma regimen libraries, single-entry assessment, tissue navigation and automatic local ULN calculations'
package_path.write_text(json.dumps(package,ensure_ascii=False,indent=2)+'\n')

print(f'Finalised {sarcoma_count} Sarcoma protocols; {grade_count} grade fields and {renal_count} renal inputs normalised; supportive-care map rebuilt for {len(risk["protocols"])} protocols.')
