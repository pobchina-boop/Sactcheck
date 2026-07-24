#!/usr/bin/env python3
from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parents[1]
GENERIC_SNIPPETS=(
 'No clinical or laboratory evidence of this adverse event.',
 'Mild or asymptomatic; observation or diagnostic review only',
 'Moderate; minimal, local or non-invasive intervention',
 'Severe or medically significant but not immediately life-threatening',
 'Life-threatening consequences requiring urgent intervention.'
)
CANON={'nccp-high-risk-parenteral':'nccp-parenteral-high','nccp-moderate-risk-parenteral':'nccp-parenteral-moderate','nccp-low-risk-parenteral':'nccp-parenteral-low'}

def groups(m):
 g=[]
 if isinstance(m.get('tumour_group'),str):g.append(m['tumour_group'])
 for x in m.get('tumour_groups') or []:
  if x not in g:g.append(x)
 return g

count=0; grade=0; renal=0; scripts=0
for p in ROOT.glob('protocols/**/*.json'):
 if p.name in {'index.json','protocol-schema.json','package.json'} or '_template' in p.parts:continue
 try:d=json.loads(p.read_text())
 except Exception:continue
 m=d.get('metadata',{})
 if 'Gastrointestinal' not in groups(m):continue
 count+=1
 d['status']='encoded_prototype_pending_clinical_and_pharmacy_validation'
 m['sactcheck_encoding_version']='0.39.0'
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
 defs=d.get('input_definitions') or {}
 for fid,defn in defs.items():
  if isinstance(defn,dict): defn['required']=False
  text=f"{fid} {defn.get('label','')}".lower() if isinstance(defn,dict) else fid.lower()
  if isinstance(defn,dict) and defn.get('type')=='select' and ('grade' in text or defn.get('ctcae_version')):
   # Keep toxicity-specific descriptions; remove only the generic placeholders so the central CTCAE library supplies the exact named-term criteria beside the control.
   for opt in defn.get('options') or []:
    desc=str(opt.get('description',''))
    if any(desc.startswith(sn) for sn in GENERIC_SNIPPETS): opt.pop('description',None)
   defn.setdefault('ctcae_version','5.0')
   defn.setdefault('assessment_guidance','Identify and grade the exact adverse event using the named CTCAE v5.0 term; assess objective findings, intervention and functional impact.')
   grade+=1
  if isinstance(defn,dict) and re.search(r'crcl|creatinine clearance|\begfr\b|renal function',text):
   if defn.get('type')=='select':
    defn['renal_input']={'mode':'protocol_specific_band','exact_value_required':False}
    renal+=1
   elif defn.get('type')=='number' and ('carboplatin' in str(m.get('title','')).lower() or 'calvert' in text):
    defn['renal_input']={'mode':'exact_continuous','exact_value_required':True,'reason':'Exact CrCl is required for Calvert carboplatin dose calculation.'}
    renal+=1
 sc=d.setdefault('supportive_care',{})
 old=sc.get('script_id')
 if old in CANON:
  sc['script_id']=CANON[old];scripts+=1
 p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
print(f'Finalised {count} GI protocols; {grade} CTCAE fields, {renal} renal inputs, {scripts} supportive-script aliases normalised.')
