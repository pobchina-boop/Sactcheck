"""Integration metadata for the reviewed protocol candidates; clinical rules remain source-audited."""
from pathlib import Path
import json
R=Path(__file__).resolve().parents[1]
def read(p):return json.loads((R/p).read_text())
def save(p,d):(R/p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
idx=read('data/breast-expansion-v08416-source-index.json');risk=read('data/emetogenic-risk-map.json')
for c in idx['codes']:
 f=next((R/'protocols/breast').glob(c+'-*'));p=json.loads(f.read_text());s=p.setdefault('supportive_care',{});profiles={}
 if c in ['00526','00798']:
  profiles={'iv':dict(level='minimal',script_id='nccp-minimal-no-routine-prophylaxis'),'oral':dict(level='oral_moderate_high',script_id='nccp-oral-moderate-high'),'continuation':dict(level='minimal',script_id='nccp-minimal-no-routine-prophylaxis')};basis='Select vinorelbine route and active phase: IV minimal, oral moderate–high, HER2-only minimal. Use the dedicated route-specific selector.';p['metadata']['review_date']='2029-10-14'
 elif c=='00775':profiles={'day1':dict(level='high',script_id=None),'day8':dict(level='low',script_id='nccp-parenteral-low'),'continuation':dict(level='variable',script_id=None)};basis='Day1 carboplatin AUC6 high-risk script; Day8 paclitaxel low-risk script. Postoperative medicine must be selected separately.'
 elif c in ['00722','00731','00258']:profiles={'combination':dict(level='high',script_id=None),'continuation':dict(level='minimal' if c=='00258' else 'variable',script_id='nccp-minimal-no-routine-prophylaxis' if c=='00258' else None)};basis='TCH/TCHP carboplatin combination uses the specific AUC≥4 plan. Continuation follows the selected medicine; do not assume every postoperative HER2 medicine is minimal risk.'
 elif c in ['00204','00507']:profiles={'combination':dict(level='low',script_id='nccp-parenteral-low'),'continuation':dict(level='minimal',script_id='nccp-minimal-no-routine-prophylaxis')};basis='Taxane combination low risk; antibody-only continuation minimal. Taxane premedication and supportive drugs do not carry forward automatically.'
 if profiles:
  s.update(emetogenic_risk='phase_dependent',script_id=None,phase_profiles=profiles,mapping_basis=basis,mapping_confidence='source_reconciled_pending_pharmacy_review');risk['protocols'][c]=dict(level='phase_dependent',script_id=None,phase_profiles=profiles,mapping_basis=basis,mapping_confidence='source_reconciled_pending_pharmacy_review')
  s.pop('supportive_medications_pdf_url',None);s.pop('supportive_medications_label',None)
  s['phase_specific_plan']=f'patient/{c}/supportive-care.html'
  s['source_url']=risk['source']['url']
 # Explicit synthetic demonstration data; these do not prefill live assessments.
 demo_numbers={'ecog':0,'age_years':55,'alt_uln_multiple':1,'ast_uln_multiple':1,'bilirubin_uln_multiple':1,'crcl_ml_min':80,'toxicity_delay_days':0,'day_number':1,'baseline_lvef_percent':60}
 positive_demo={'indication_eligible','her2_positive','taxane_unsuitable','companion_regimen_confirmed'}
 if 'baseline_lvef_percent' in p['input_definitions']:p['input_definitions']['baseline_lvef_percent']['demo_value']=60
 if c=='00217':p['input_definitions']['crcl_ml_min']['renal_input']=dict(mode='source_threshold_numeric',exact_value_required=False,source_url=p['metadata']['source_url'],reason='NCCP capecitabine thresholds use creatinine clearance in mL/min. Confirm the method; indexed eGFR is not directly interchangeable, and conflicting band/numeric results require review.')
 source_grades={'00217':['cardiac_toxicity_grade','pulmonary_toxicity_grade'],'00350':['her2_hypersensitivity_grade']}
 for key in source_grades.get(c,[]):
  definition=p['input_definitions'][key]
  definition.update(grading_source_label=f'NCCP {c} / named adverse-event assessment',grading_source_url=p['metadata']['source_url'],source_grading_note='The regimen gives treatment-action thresholds, not a complete grading table. Confirm the exact adverse event and its clinician-assessed grade; do not infer severity from a single symptom or LVEF value.',assessment_guidance='Confirm the named adverse event and grading criteria with the treating team before applying the source treatment-action threshold.')
 for key,definition in p['input_definitions'].items():
  if 'demo_value' in definition:continue
  if definition['type']=='boolean':definition['demo_value']=key in positive_demo
  elif definition['type']=='select':definition['demo_value']=definition['options'][0]['value']
  elif key in demo_numbers:definition['demo_value']=demo_numbers[key]
  else:raise ValueError(f'Explicit demo value required: {c}/{key}')
 p['metadata']['sactcheck_encoding_version']='0.84.16';f.write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n')
risk['content_update_release']='0.84.16';save('data/emetogenic-risk-map.json',risk)
p=R/'404.html';s=p.read_text()
for c in idx['new_codes']:
 if c not in s:s=s.replace('(00858|','('+c+'|00858|')
p.write_text(s)
print('Integrated explicit risk profiles, source review date and compatibility routes.')
