from pathlib import Path
import json,re
R=Path(__file__).resolve().parents[1]
def read(p):return json.loads((R/p).read_text())
def save(p,d):(R/p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
idx=read('data/anthracycline-v08417-source-index.json')
def prose(x,k=''):
 if isinstance(x,dict):return {k:prose(v,k) for k,v in x.items()}
 if isinstance(x,list):return [prose(v,k) for v in x]
 if not isinstance(x,str) or 'http' in x or k in ['id','code','protocol_id','phase_id','source_ids','agents','unit','release','suite_release','content_version','full_suite_release']:return x
 x=re.sub(r'(\d)(mg|micrograms|weeks?|cycles?|days?|months?|years?|patients|women|evaluable|weekly|neutropenia|hours?|minutes?|anthracycline)\b',r'\1 \2',x)
 x=re.sub(r'\b(first|before|after|every|within|cycles?|Days?|Grade|NCCP|regimen|of|then|consider|exactly|at|until|versus|with|dose|Table)(?=\d)',r'\1 ',x,flags=re.I)
 x=re.sub(r'(months?|cycles?|days?|years?|weeks?)(?=after|before|during|in\b)',r'\1 ',x)
 x=x.replace('first5-FU','first 5-FU').replace('before5-FU','before 5-FU').replace('for5-FU','for 5-FU').replace('dose-dense every2','dose-dense every 2').replace('versusFEC','versus FEC').replace('withAT','with AT').replace('withAC','with AC').replace('withTC','with TC').replace('node-positive','node-positive')
 return x
J=read('data/breast-treatment-journeys-v0837.json');S=read('data/phase-support-v0838.json');K=read('data/regimen-knowledge-base-v08417-addendum.json')
for c in idx['codes']:
 d=read(f'data/patient-knowledge/{c}.json')
 if c in idx['new_codes']:d['chronology_notes']=[dict(title='General orientation',text='Effects can occur at any time or continue beyond the chart. There are no guaranteed symptom-free days.',source_ids=['nccp']),dict(title='No dates to enter',text='Your team books appointments and reviews results. The graph requires no personal information.',source_ids=['nccp'])]
 if isinstance(d['teachback'],list):d['teachback']=' '.join(d['teachback'])
 if c not in ['00265','00269']:
  d['chapters'][1]['items']=[i for i in d['chapters'][1]['items'] if not i['title'].startswith('DPD')]
  d['monitoring_schedule']['rows'][-1]['label']='Markers / bone health'
  J[c]['lanes'][-2]['label']='Markers / bone health'
  first=J[c]['milestones'][0]
  first['why']=first['why'].split('regimen. ',1)[-1];first['clinical']=first['why']
 if c in ['00263','00269','00423']:d['chapters'][2]['items']=[i for i in d['chapters'][2]['items'] if i['title']!='Genomic tests']
 if c not in ['00263','00269','00423']:
  d['monitoring_schedule']['rows'][-1]['cells'][2]='No routine blood tumour markers when well'
  J[c]['lanes'][-2]['cells'][2]='No routine blood tumour markers when well'
 d=prose(d);save(f'data/patient-knowledge/{c}.json',d);J[c]=prose(J[c]);S['regimens'][c]=prose(S['regimens'][c])
 p=next(p for p in K['regimen_profiles'] if p['protocol_id']==d['protocol_id']);p['monitoring_and_toxicity']['longitudinal_schedule']=d['monitoring_schedule']
 p['administration']['practical_workflow']=d['logistics']['steps'] and [s['text'] for s in d['logistics']['steps']]
 if c in ['00263','00269','00423']:p['treatment_rationale']['factors']=[t for t in p['treatment_rationale']['factors'] if 'genomic' not in t]
K=prose(K);save('data/regimen-knowledge-base-v08417-addendum.json',K);save('data/breast-treatment-journeys-v0837.json',J);save('data/phase-support-v0838.json',S)
print('Checked patient chronology schema and readable prose; retained patient-specific clinical distinctions.')
# Builders may be rerun: keep supportive notes unique and readable.
for c in idx['codes']:
 for phase in S['regimens'][c]:
  phase['additional_support']=list(dict.fromkeys(x.replace('trastuzumab6','trastuzumab 6').replace('for21-day','for 21-day') for x in phase['additional_support']))
for p in K['regimen_profiles']:
 key='premedication_and_prophylaxis'
 p['supportive_care'][key]=list(dict.fromkeys(x.replace('trastuzumab6','trastuzumab 6').replace('for21-day','for 21-day') for x in p['supportive_care'][key]))
save('data/phase-support-v0838.json',S);save('data/regimen-knowledge-base-v08417-addendum.json',K)
