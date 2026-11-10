"""Scoped patient-source corrections; does not render or alter clinical decisions."""
import json, pathlib, copy, hashlib
R=pathlib.Path(__file__).resolve().parents[3]
O=pathlib.Path(__file__).resolve().parent
DATE='2026-11-09'
CODES=['00261','00483','00484','00455','00558']
paths=[R/f'data/patient-knowledge/{c}.json' for c in CODES]+[R/f'data/patient-knowledge-contexts/{c}/{s}.json' for c in ['00483','00484'] for s in ['melanoma_advanced','melanoma_adjuvant']]
replacements={
 'thyroid once a month':'thyroid function before each cycle and when clinically indicated',
 'Thyroid once a month':'Thyroid function before each cycle and when clinically indicated',
 'Thyroid function is checked once a month and when clinically indicated.':'Thyroid function is checked before each cycle and when clinically indicated.',
 'Confirm monthly thyroid tests and who arranges them; report new symptoms without waiting for the next treatment.':'Confirm thyroid tests before each cycle and any additional tests your team requests; report new symptoms without waiting for the next treatment.',
 'Thyroid checks follow their own interval.':'Thyroid tests are checked before each cycle and when clinically indicated.',
 'Monthly thyroid monitoring is independent of the dosing interval.':'The four-weekly nivolumab source requires thyroid tests before each cycle and when clinically indicated; do not borrow the separate monthly wording from the two-weekly regimen.'}
restart='If your team has permanently stopped nivolumab because of a serious immune reaction, improvement does not automatically make restarting safe. Keep that decision in your treatment record; only your specialist team can review further treatment.'
def swap(x,m):
 if isinstance(x,str):
  for a,b in m.items():x=x.replace(a,b)
  return x
 if isinstance(x,list):return [swap(v,m) for v in x]
 if isinstance(x,dict):return {k:swap(v,m) for k,v in x.items()}
 return x
changes=[]
for p in paths:
 before=p.read_bytes();d=json.loads(before);c=d['code'];anatomy=copy.deepcopy(d['anatomy'])
 if c=='00484':d=swap(d,replacements)
 if c=='00558':d=swap(d,{'TSH every 3–6 weeks':'Thyroid function tests every 3–6 weeks'})
 if c in ['00455','00558']:
  for agent in d['agents']:agent['risks']=list(dict.fromkeys(agent['risks']))
  repeated='Discuss the possibility that heart, muscle and nerve inflammation can occur together and may need urgent hospital treatment. A severe immune reaction may mean treatment must remain stopped even after recovery.'
  d['consent_support']=d['consent_support'].replace(repeated+' '+repeated,repeated)
 if d.get('patient_summary'):
  d['patient_summary']['cycle_expectations']=list(dict.fromkeys(d['patient_summary']['cycle_expectations']))
  d['patient_summary']['summary_checked']=DATE
 if c in ['00483','00484']:
  if restart not in d['patient_summary']['cycle_expectations']:d['patient_summary']['cycle_expectations'].append(restart)
  ch=next((x for x in d['chapters'] if x['id'] in ['schedule','your-treatment']),None)
  if ch and not any(i['title']=='Previous permanent-stop decisions' for i in ch['items']):ch['items'].append({'title':'Previous permanent-stop decisions','text':restart,'source_ids':['nccp']})
 if c=='00261':
  d=swap(d,{'These two carboplatin monotherapy protocols do not mandate routine heart scans.':'This carboplatin monotherapy regimen does not mandate routine heart scans.'})
  renal='If the team calculates kidney function from a blood creatinine result, the NCCP plan requires that result within 48 hours before carboplatin. If a measured kidney scan is used, a rise in creatinine can require a new dose calculation or kidney measurement. The team checks the method, trend and prescribed dose; do not calculate or change the dose yourself.'
  ch=next(x for x in d['chapters'] if x['id']=='checks')
  if not any(i['title']=='Timing the kidney check' for i in ch['items']):ch['items'].append({'title':'Timing the kidney check','text':renal,'source_ids':['nccp']})
  d['patient_summary']={
   'template_version':'0.84.46','purpose':d['purpose'],
   'schedule':'Carboplatin on Day 1 every 21 days. Your team reviews benefit and safety; there is no preset breast-treatment cycle total.',
   'phases':[{'title':'Carboplatin for metastatic breast cancer','text':d['administration_text']}],
   'monitoring':[
    {'stage':'Before','test':'Baseline tests and prescription','when':'Blood count, kidney and liver tests; confirm the kidney-function method, prescribed AUC, previous platinum effects and medicine list.','basis':'NCCP'},
    {'stage':'Each cycle','test':'Blood results and symptoms','when':'Blood count, kidney and liver tests before every cycle. For a calculated kidney estimate, creatinine must be from within 48 hours before treatment.','basis':'NCCP'},
    {'stage':'Between / after','test':'Recovery and response','when':'Report infection, bleeding, hearing or nerve changes. Scans and further tests follow your individual plan; no routine heart-scan interval is specified.','basis':'NCCP / individual plan'}],
   'preparation':['Bring the actual urgent contacts, medicine list and prescribed anti-sickness plan.','Discuss the off-label breast indication, expected benefit, alternatives and fertility before treatment.'],
   'cycle_expectations':['Take anti-sickness medicines as prescribed, including any days after the infusion.','Low blood counts and other effects can occur between visits; the timeline does not identify safe days.','Report fever, chills, bleeding or sudden illness immediately. Do not wait for your next appointment.'],
   'card_title':'Carboplatin · breast','card_schedule':'Day 1 every 21 days; duration individually reviewed.',
   'card_cycle_count':None,'card_record_note':'Rolling record; this card does not set the number of cycles.',
   'card_alert':d['urgent_extra'],'summary_checked':DATE}
 d['clinical_review_release']='0.84.46';d['clinical_review_checked']=DATE;d['nccp_source_checked']=DATE
 d['retrospective_audit_v08446']={'scope':'Current NCCP schedule, monitoring, supportive-care and patient-service consistency; clinical threshold audit recorded separately.','source_pages':{'00261':[1,2,3,4,5],'00483':[2,3,4,5,6,7,8,9],'00484':[2,3,4,5,6,7,8,9],'00455':[3,4,5,6,7],'00558':[3,4,5,6,7]}[c],'independent_clinical_approval':False}
 assert d['anatomy']==anatomy
 p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
 changes.append({'path':str(p.relative_to(R)),'before_sha256':hashlib.sha256((O/'baseline'/p.relative_to(R)).read_bytes()).hexdigest(),'after_sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'anatomy_retained':True})
(O/'patient-source-changes.json').write_text(json.dumps(changes,indent=2)+'\n')
# Propose changes to shared data for the release owner to merge without overwriting concurrent edits.
j=json.loads((R/'data/breast-treatment-journeys-v0837.json').read_text())
journey={k:swap(v,replacements) for k,v in j.items() if k=='00484' or k.startswith('00484:')}
(O/'journey-proposals.json').write_text(json.dumps(journey,ensure_ascii=False,indent=2)+'\n')
print('Corrected',len(paths),'patient profiles; anatomy retained; rendering still required.')
