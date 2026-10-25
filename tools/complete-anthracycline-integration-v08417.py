"""Reproduce dose/schedule and workflow metadata for the reviewed ten-suite release."""
from pathlib import Path
import json,re
R=Path(__file__).resolve().parents[1]
def read(p):return json.loads((R/p).read_text())
def write(p,d):(R/p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
idx=read('data/anthracycline-v08417-source-index.json');sustain=read('data/sustainability-regimen-metadata-v0691.json')
doses={'00262':[('epirubicin',90),('cyclophosphamide',600)],'00263':[('epirubicin',75),('cyclophosphamide',600)],'00265':[('fluorouracil',500),('epirubicin',100),('cyclophosphamide',500)],'00269':[('fluorouracil',500),('epirubicin',50),('cyclophosphamide',500)],'00423':[('doxorubicin',50),('docetaxel',75)]}
def readable(x,key=''):
 if isinstance(x,dict):return {k:readable(v,k) for k,v in x.items()}
 if isinstance(x,list):return [readable(v,key) for v in x]
 if not isinstance(x,str) or key not in ['recommendation','explanation','notes']:return x
 x=re.sub(r'\b(administer|before|after|every|within|until|dose|Grade|Day|Days|for|at)(?=\d)',r'\1 ',x,flags=re.I)
 return re.sub(r'(\d)(mg|weeks?|days?|months?|years?|cycles?)\b',r'\1 \2',x)
for c in idx['codes']:
 p=next((R/'protocols/breast').glob(c+'-*.json'));q=json.loads(p.read_text());d=read(f'data/patient-knowledge/{c}.json')
 if c in idx['new_codes']:
  phase=dict(phase_id='combination',name=d['title'],label=d['title'],cycle_length_days=21,administration=[dict(drug=drug,dose=dict(value=value,unit='mg/m2'),day=1,route='IV injection' if drug in ['epirubicin','doxorubicin','fluorouracil'] else 'IV infusion',notes='Use the exact source administration instructions and local policy.') for drug,value in doses[c]])
  if c in ['00262','00265','00423']:phase['cycles']=list(range(1,(4 if c=='00262' else 6)+1))
  q['treatment_phases']=[phase];q['metadata'].update(full_suite_release='0.84.17',schedule_summary=d['schedule_summary'])
 for key,field in q['input_definitions'].items():
  if c in idx['new_codes'] and key.endswith('_grade'):
   field.update(type='select',unit='Clinician-assessed grade',source_grading_note='The NCCP regimen specifies action thresholds, not a complete grading table. Confirm the named adverse event and grade using the approved clinical grading reference before applying the source action.',options=[dict(value=g,label=f'Grade {g}',description=f'Clinician-assessed grade {g}. Confirm the named adverse event and functional impact using the approved clinical grading reference; the NCCP source specifies treatment actions, not a complete grading definition.') for g in range(5)])
   for k in ['min','max','step']:field.pop(k,None)
 q=readable(q);p.write_text(json.dumps(q,ensure_ascii=False,indent=2)+'\n')
 source=f'NCCP {c} v{q["metadata"]["nccp_version"]}; checked2026-10-23; {q["metadata"]["source_url"]}'
 sustain['profiles'][q['protocol_id']]={
  'route_classification':dict(status='source_verified',value='parenteral_only',source=source),
  'administration_frequency':dict(status='source_verified',value=d['schedule_summary'],source=source),
  'ambulatory_pump':dict(status='source_verified',value=False,source=source),
  'administration_time':dict(status='not_estimated',value='Regimen-specific infusion and observation periods; full appointment time and environmental savings are not measured here.',source=source),
  'planned_treatment_encounters':dict(status='evidence_required',value=None,source=source),
  'travel_model_inputs':dict(status='not_encoded',value=None,source=source)}
write('data/sustainability-regimen-metadata-v0691.json',sustain)
p=R/'js/generic-assessment-ui.js';s=p.read_text();old='return definitions.filter(definition => !(immunotherapyBloods';# The checked-in presentation filter is the canonical implementation; fail if missing.
assert '!definition.ui_derived_from' in s,'Apply the visible-source field filter before regenerating these protocols.'
