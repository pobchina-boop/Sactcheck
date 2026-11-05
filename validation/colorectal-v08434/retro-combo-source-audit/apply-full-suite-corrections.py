from pathlib import Path
import json,copy,hashlib
R=Path('/workspace/scratch/bca730129437/recovery-2026-11-05/restore-test')
def load(p):return json.loads((R/p).read_text())
def save(p,d):(R/p).write_text(json.dumps(d,indent=2,ensure_ascii=False)+'\n')
codes=['00328','00330','00331']; profiles={}
rescue='At the first liquid stool, start your individually supplied diarrhoea rescue plan and drink electrolyte-containing fluids as instructed. Contact your team early; do not wait for severe diarrhoea. If you do not have a rescue plan, contact the team immediately for instructions.'
interval='A planned waiting interval of at least one hour follows the end of cetuximab before irinotecan can start; this adds to your visit time.'
for code in codes:
 p=f'data/patient-knowledge/{code}.json';d=load(p);anatomy=copy.deepcopy(d['anatomy'])
 d['administration_text']+=' '+interval
 for x in d['support']:
  if x['title']=='Bowel symptoms and fluids': x['text']+=' '+rescue
 for ch in d['chapters']:
  for x in ch['items']:
   if x['title']=='Bowel symptoms':x['text']+=' '+rescue
 d['patient_summary']['cycle_expectations'][0]+=' '+rescue
 bowel=next(x for x in d['monitoring_schedule']['rows'] if x['label']=='Bowel symptoms and hydration');bowel['cells'][2]='Delayed diarrhoea can start after the first day: act at the first liquid stool using your supplied rescue plan and electrolyte fluids; contact the team early.'
 if code=='00328':
  next(x for x in d['monitoring_schedule']['rows'] if x['label']=='Blood counts, kidney and liver')['cells'][4]='If treatment is delayed for low blood counts, repeat the blood count weekly until the team confirms recovery.'
  next(x for x in d['patient_summary']['monitoring'] if x['test']=='Bloods, skin and symptoms')['when']+=' If treatment is delayed for low counts, blood counts are checked weekly during the delay.'
 assert anatomy==d['anatomy'];save(p,d);profiles[code]=d
p='data/phase-support-v0838.json';d=load(p)
for code in codes:
 for phase in d['regimens'][code]:
  for med in phase['medicines']:
   if med['name']=='Atropine sulphate':med['note']=med['note'].replace('Avoid in glaucoma.','Avoid in glaucoma. Use with caution in asthma; review suitability before prescribing.')
save(p,d)
p='data/regimen-knowledge-base-v08434-addendum.json';d=load(p)
for row in d['regimen_profiles']:
 code=row['protocol_id'].split('-')[1]
 if code not in codes:continue
 prof=profiles[code];row['administration']['route_and_duration']=[prof['administration_text']]
 row['administration']['practical_workflow'].append('Current CAMPTO SmPC section 4.2: irinotecan must not be administered earlier than one hour after the end of cetuximab infusion.')
 sc=row['supportive_care'];sc['premedication_and_prophylaxis']=[x['text'] for x in prof['support']];sc['patient_education'].append(rescue)
 sc['special_support'].append('Atropine for acute irinotecan cholinergic syndrome: avoid in glaucoma and use with caution in asthma; assess suitability before prescribing (NCCP complications/support guidance).')
 mon=row['monitoring_and_toxicity'];mon['longitudinal_schedule']=copy.deepcopy(prof['monitoring_schedule'])
 mon['ongoing']=[x['cells'][2] for x in prof['monitoring_schedule']['rows']]
 if code=='00328':mon['ongoing'].append('NCCP 00328 Table 2: check FBC weekly while treatment is delayed for cytopenia, with recovery reviewed before restart.')
save(p,d)
p='validation/colorectal-v08434/retro-combo-source-audit/full-suite-review.json';d=load(p)
d['review_type']='Source-based full-suite consistency review; C1–C4 applied to authored data, parent regenerates outputs'
for f in d['findings']:
 if f['id'] in ['C1','C2','C3','C4']:f['resolution']='Applied to scoped authored patient/KB/phase-support data; generated HTML/PDF verification pending parent regeneration.'
d['corrected_input_hashes']={p:hashlib.sha256((R/p).read_bytes()).hexdigest() for p in d['reviewed_input_hashes']};save(p,d)
p=R/'validation/colorectal-v08434/retro-combo-source-audit/full-suite-review.md';p.write_text(p.read_text()+'\n\nC1–C4 applied to the three authored patient profiles, scoped clinician KB rows and scoped phase-support prescriptions. Rich anatomy is unchanged. No numeric patient self-dosing instructions were added. Parent regeneration and final PDF/browser review remain pending.\n')
print('Applied C1–C4; anatomy preserved.')
