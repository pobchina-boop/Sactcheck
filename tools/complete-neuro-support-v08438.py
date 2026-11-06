"""Source-specific supportive draft rows; keep local prescribing decisions explicit."""
from pathlib import Path
import json,copy
R=Path(__file__).resolve().parents[1]
f=R/'validation/neuro-oncology-v08438/patient-content/phase-support-updates.json';d=json.loads(f.read_text())
if d.get('source_completion_release')=='0.84.38':
 print('Source-specific support completion already applied.');raise SystemExit(0)
URL='https://healthservice.hse.ie/documents/7152/Classification_Document_for_Systemic_Anti-_Cancer_Therapy_SACT_Induced_Nausea__pWgDCrm.pdf'
def antiemetic(days):return dict(name='Oral 5-HT3 antagonist - select ONE',dose='Ondansetron 8-16 mg total daily OR granisetron 1-2 mg total daily; prescriber selects and records agent/dose',timing=days,note='NCCP V6 Table 5, p8. Start at least 30 minutes before oral SACT (p4). Confirm stop date, delayed-emesis cover and rescue plan; review QT risk, liver function, constipation and interactions.')
bowel=dict(name='Constipation prevention',dose='Complete the locally prescribed laxative and dose',timing='With vincristine exposure; review bowel function before each infusion',note='NCCP PCV supportive care recommends prophylaxis. Severe pain, vomiting or inability to pass stool/wind requires urgent assessment, not automatic extra laxatives.')
pjp=dict(name='PJP prevention',dose='Complete the local prophylactic agent, dose and schedule',timing='Required throughout concurrent temozolomide/radiotherapy; review continuation after RT',note='Continue when clinically indicated for lymphopenia/steroid exposure. Do not stop automatically at the end of RT; confirm allergy, renal function, interactions and pharmacy plan.')
for code,plans in d['regimens'].items():
 if code in ['00379','00658']:
  original=copy.deepcopy(plans[0]);new=[]
  for id,label,active,risk,meds in [
   ('lomustine_day1','Day 1: lomustine',['Lomustine'],'oral_moderate_high',[antiemetic('Before Day 1 lomustine, then the prescribed delayed-emesis cover')]),
   ('procarbazine_days8_21','Days 8-21: procarbazine; vincristine on Day 8',['Procarbazine','Vincristine on Day 8'],'oral_moderate_high',[antiemetic('Daily during procarbazine Days 8-21; confirm the prescribed stop date after this multiday phase'),bowel]),
   ('vincristine_day29','Day 29: vincristine only',['Vincristine'],'minimal',[bowel])]:
   plan=copy.deepcopy(original);plan.update(id=id,label=label,active_medicines=active,emetogenic_risk=risk,medicines=copy.deepcopy(meds))
   if id=='vincristine_day29':plan['additional_support'].insert(0,'No routine antiemetic prophylaxis is required for vincristine alone; prior symptoms or other medicines may require an individual rescue plan.')
   if id=='procarbazine_days8_21':plan['additional_support'].insert(0,'NCCP treatment table specifies procarbazine Days 8-21; the supportive-care paragraph says Days 8-22. Do not add chemotherapy on Day 22. Pharmacy confirms the antiemetic stop date.')
   new.append(plan)
  d['regimens'][code]=new;plans=new
 else:
  for plan in plans:
   plan['emetogenic_risk']='oral_moderate_high'
   plan['medicines']=[antiemetic('Daily during the concurrent temozolomide course, including non-radiotherapy days; confirm the written stop date' if plan['id']=='concurrent' else 'Before temozolomide on Days 1-5; confirm the prescribed stop date and delayed-emesis cover')]
   if plan['id']=='concurrent':plan['medicines'].append(copy.deepcopy(pjp))
 for plan in plans:
  plan['guidance']=dict(label='NCCP oral-SACT antiemetics V6: Table 5 p8; timing p4; interactions p11',url=URL)
  plan['additional_support'].append('These are prescription choices for clinician/pharmacist completion, not an issued prescription. General NCCP multiday guidance includes cover after the last SACT day; record the individual duration. Review pre-existing steroid and seizure treatment rather than duplicating it.')
  plan['source_links']=[dict(label='NCCP regimen-specific support',url=plan['source_url'])]
d['source_completion_release']='0.84.38'
f.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
print('Completed source-labelled oral antiemetic choices and separate PCV day-specific support drafts.')
