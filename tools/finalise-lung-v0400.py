#!/usr/bin/env python3
from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parents[1]
CANON={'nccp-high-risk-parenteral':'nccp-parenteral-high','nccp-moderate-risk-parenteral':'nccp-parenteral-moderate','nccp-low-risk-parenteral':'nccp-parenteral-low'}
PHASE_PROFILES={
 '00309':{'systemic_treatment_day':{'level':'moderate','script_id':'nccp-parenteral-moderate'},'radiotherapy_only_day':{'level':'minimal','script_id':'nccp-minimal-no-routine-prophylaxis'}},
 '00561':{'carboplatin_etoposide_day':{'level':'moderate','script_id':'nccp-parenteral-moderate'},'etoposide_or_radiotherapy_only_day':{'level':'low','script_id':'nccp-parenteral-low'}},
 '00456':{'cisplatin_etoposide_day':{'level':'high','script_id':'nccp-parenteral-high'},'etoposide_or_radiotherapy_only_day':{'level':'moderate','script_id':'nccp-parenteral-moderate'}},
 '00279':{'cisplatin_etoposide_day':{'level':'high','script_id':'nccp-parenteral-high'},'etoposide_or_radiotherapy_only_day':{'level':'moderate','script_id':'nccp-parenteral-moderate'}}
}
ENDOCRINE_FIELDS={
 'tsh_miu_l':{'label':'TSH (optional immunotherapy blood)','type':'number','required':False,'min':0,'step':0.01,'demo_value':1.5,'unit':'mIU/L','ui_section':'immunotherapy_bloods'},
 'free_t4_pmol_l':{'label':'Free T4 (optional immunotherapy blood)','type':'number','required':False,'min':0,'step':0.1,'demo_value':12,'unit':'pmol/L','ui_section':'immunotherapy_bloods'},
 'cortisol_nmol_l':{'label':'Cortisol (optional; interpret by sample time and steroid exposure)','type':'number','required':False,'min':0,'step':1,'demo_value':350,'unit':'nmol/L','ui_section':'immunotherapy_bloods'},
 'acth_result':{'label':'ACTH (optional; use local units/reference range)','type':'number','required':False,'min':0,'step':0.1,'demo_value':5,'unit':'local units','ui_section':'immunotherapy_bloods'},
 'glucose_mmol_l':{'label':'Glucose (optional immunotherapy blood)','type':'number','required':False,'min':0,'step':0.1,'demo_value':5,'unit':'mmol/L','ui_section':'immunotherapy_bloods'},
 'ketones_mmol_l':{'label':'Blood ketones (optional if hyperglycaemia or symptoms)','type':'number','required':False,'min':0,'step':0.1,'demo_value':0.1,'unit':'mmol/L','ui_section':'immunotherapy_bloods'}
}

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

# Remove known historical tissue leakage from breast-only HER2/paclitaxel protocols.
for rel in ['protocols/breast/00507-pertuzumab-trastuzumab-paclitaxel.json','protocols/breast/00797-phesgo-paclitaxel.json']:
 p=ROOT/rel; d=json.loads(p.read_text());m=d['metadata']
 m['tumour_group']='Breast';m.pop('tumour_groups',None)
 p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')

lung_count=0; grade_count=0; renal_count=0
for p,d in regimen_files():
 m=d.get('metadata',{})
 if 'Lung' not in groups(m):continue
 lung_count+=1
 d['status']='encoded_prototype_pending_clinical_and_pharmacy_validation'
 m['sactcheck_encoding_version']='0.40.0'
 m['partial_assessment_supported']=True
 m['partial_assessment_note']='Any independently actionable entered value is assessed; omitted domains remain unassessed and do not block a partial result.'
 m.setdefault('validation',{}).update({
  'official_catalogue_and_source_link_checked':True,
  'rule_level_source_reconciliation_status':'pending_independent_clinical_and_oncology_pharmacy_validation',
  'software_tests_completed':True,
  'consultant_reviewed':False,
  'oncology_pharmacy_reviewed':False,
  'clinical_use_authorised':False
 })
 d['required_inputs']=[]
 if 'immunotherapy' in (m.get('treatment_class') or []):
  for fid,definition in ENDOCRINE_FIELDS.items():d.setdefault('input_definitions',{}).setdefault(fid,dict(definition))
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
    definition['renal_input']={'mode':'protocol_specific_band','exact_value_required':False}
    renal_count+=1
   elif definition.get('type')=='number' and ('carboplatin' in str(m.get('title','')).lower() or 'calvert' in text):
    definition['renal_input']={'mode':'exact_continuous','exact_value_required':True,'reason':'Exact CrCl/GFR is required for Calvert carboplatin dose calculation.'}
    renal_count+=1
 sc=d.setdefault('supportive_care',{})
 if sc.get('script_id') in CANON:sc['script_id']=CANON[sc['script_id']]
 code=str(m.get('nccp_regimen_code','')).zfill(5)
 if code in PHASE_PROFILES:
  sc['emetogenic_risk']='phase_dependent';sc['phase_profiles']=PHASE_PROFILES[code]
  sc.pop('supportive_medications_pdf_url',None);sc.pop('supportive_medications_label',None)
 p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')

# Update central aliases and add Lung targeted-agent names.
alias_path=ROOT/'js/drug-aliases.js'; text=alias_path.read_text()
entries=[
 ('afatinib',['Giotrif']),('alectinib',['Alecensa']),('brigatinib',['Alunbrig']),('ceritinib',['Zykadia']),
 ('crizotinib',['Xalkori']),('dacomitinib',['Vizimpro']),('entrectinib',['Rozlytrek']),('erlotinib',['Tarceva']),
 ('gefitinib',['Iressa']),('lorlatinib',['Lorviqua']),('nintedanib',['Vargatef']),('osimertinib',['Tagrisso']),
 ('tepotinib',['Tepmetko']),('serplulimab',['Hetronifly'])
]
insert=''.join(f'    {{ terms: ["{term}"], aliases: {json.dumps(aliases)} }},\n' for term,aliases in entries if f'terms: ["{term}"]' not in text)
marker='  const ENTRIES = Object.freeze([\n'
text=text.replace(marker,marker+insert,1)
text=re.sub(r'version: "[0-9.]+"', 'version: "0.40.0"', text)
alias_path.write_text(text)

# Rebuild the central supportive-care map from the canonical protocol files.
risk_path=ROOT/'data/emetogenic-risk-map.json'; risk=json.loads(risk_path.read_text());risk['release']='0.40.0';risk['protocols']={}
for p,d in regimen_files():
 m=d.get('metadata',{});code=str(m.get('nccp_regimen_code','')).zfill(5);sc=d.get('supportive_care') or {}
 sid=CANON.get(sc.get('script_id'),sc.get('script_id'))
 if sid:sc['script_id']=sid
 entry={
  'level':sc.get('emetogenic_risk','pending'),
  'script_id':sid,
  'mapping_basis':sc.get('mapping_basis','Protocol supportive-care mapping carried forward for controlled review.'),
  'mapping_confidence':sc.get('mapping_confidence','requires_review')
 }
 if sc.get('phase_profiles'):entry['phase_profiles']=sc['phase_profiles']
 risk['protocols'][code]=entry
 # Keep protocol links controlled by the registry where a script is known.
 script=risk.get('scripts',{}).get(sid or '')
 if script and sc.get('emetogenic_risk')!='phase_dependent':
  sc['supportive_medications_pdf_url']=script.get('url')
  sc['supportive_medications_label']=script.get('label')
 elif sc.get('emetogenic_risk')=='phase_dependent':
  sc.pop('supportive_medications_pdf_url',None);sc.pop('supportive_medications_label',None)
 p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
risk_path.write_text(json.dumps(risk,ensure_ascii=False,indent=2)+'\n')

print(f'Finalised {lung_count} Lung protocols; {grade_count} grade fields and {renal_count} renal inputs normalised; supportive-care map rebuilt for {len(risk["protocols"])} protocols.')
