"""Explicit national antiemetic row selection; oral regimens do not inherit IV prophylaxis."""
from pathlib import Path
import json
R=Path(__file__).resolve().parents[1]
def read(p):return json.loads((R/p).read_text())
def save(p,d):(R/p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
S=read('data/phase-support-v0838.json');S['release']='0.84.9'
def med(name,dose,timing,note=''):return dict(name=name,dose=dose,timing=timing,note=note)
for code in ['00414','00322','00776','00794','00588']:
 d=read(f'data/patient-knowledge/{code}.json');support=[x['text'] for x in d['support']];base=dict(source_checked='2026-10-20',source_url=d['sources'][0]['url'],additional_support=support)
 if code in ['00414','00322','00588']:
  risk='Oral moderate–high' if code=='00588' else 'Oral minimal–low'
  specific='Agree an oral antiemetic prevention / rescue plan before treatment. Continuous oral treatment does not use the Day1–4 IV chemotherapy template. Confirm agent, dose, frequency, duration and interactions; no default daily steroid order.' if code=='00588' else 'Routine IV-chemotherapy antiemetic, steroid or G-CSF orders are not populated. Review persistent nausea and prescribe individual symptom treatment if needed.'
  S['regimens'][code]=[dict(base,id='treatment',label=d['title']+' · supportive-care review',active_medicines=['Palbociclib + the prescribed endocrine partner (AI OR fulvestrant)'] if code=='00414' else [a['name'] for a in d['agents']],emetogenic_risk=risk,medicines=[],additional_support=support+[specific])]
 else:
  phases=[]
  for day in ([1,8] if code=='00794' else [1]):
   meds=[med('Aprepitant','125 mg orally',f'Day {day} before treatment'),med('Ondansetron','16 mg orally',f'Day {day} before treatment','Review QT risk, hepatic impairment, constipation and interacting medicines.'),med('Dexamethasone','12 mg orally',f'Day {day} before treatment','Reconcile all steroid premedication; do not duplicate.'),med('Aprepitant','80 mg orally once daily',f'Days {day+1}–{day+2}'),med('Dexamethasone','8 mg orally once daily',f'Days {day+1}–{day+3}','Confirm suitability and total steroid exposure.'),med('Metoclopramide','10 mg orally up to three times daily','Rescue use / duration to be completed by prescriber','Review renal function and neurological contraindications; avoid automatic prolonged use.')]
   if code=='00794':meds.insert(3,med('Olanzapine','5 mg orally once daily',f'Days {day}–{day+3}','Review sedation, falls, glucose and QT risk. Avoid routine combination with metoclopramide because of additive extrapyramidal effects; select rescue individually.'))
   extra=support+(['NCCP NCIS v8 Table1 has a dedicated trastuzumab-deruxtecan row: NK1 + 5-HT3 + dexamethasone. Olanzapine can be considered by the prescriber, but is not silently added to that national default row.'] if code=='00776' else ['This is the high-risk national antiemetic template anchored to this infusion day. Day8 repeats prophylaxis only if treatment proceeds; do not print both scripts as simultaneous orders. Antihistamine/antipyretic infusion premedication and G-CSF are separate regimen-specific decisions.'])
   phases.append(dict(base,id='treatment' if code=='00776' else f'day{day}',label=f'Day {day} · '+d['title'],active_medicines=[a['name'] for a in d['agents']],emetogenic_risk='High · dedicated trastuzumab deruxtecan row' if code=='00776' else 'High · sacituzumab govitecan',medicines=meds,additional_support=extra))
  S['regimens'][code]=phases
save('data/phase-support-v0838.json',S)
print('Five targeted supportive-care sets; separate sacituzumab day1/day8 scripts.')
