from pathlib import Path
import json,re,hashlib
R=Path(__file__).resolve().parents[3];O=Path(__file__).resolve().parent
files=[('00455','data/patient-knowledge-contexts/00455/colorectal.json'),('00558','data/patient-knowledge-contexts/00558/colorectal.json')]+[(c,'data/patient-knowledge/'+c+'.json') for c in ['00551','00890','00900']]
rows=[]
for code,file in files:
 d=json.loads((R/file).read_text());ids={x['id'] for x in d['sources']};assert len(ids)==len(d['sources']);assert d['code']==code;assert d['patient_summary']['template_version']=='0.84.35';assert len(d['chapters'])>=6;assert 6<=len(d['anatomy'])<=8;assert len({x[0] for x in d['anatomy']})==len(d['anatomy']);assert len(d['monitoring_schedule']['rows'])>=4
 def walk(x):
  if isinstance(x,dict):
   if 'source_ids'in x:assert set(x['source_ids'])<=ids,(code,x['source_ids'])
   for v in x.values():walk(v)
  elif isinstance(x,list):
   for v in x:walk(v)
 walk(d)
 if code in ['00551','00900']:assert 'pembrolizumab' not in json.dumps(d).lower();assert [p['id'] for p in d['phases']]==['combination','maintenance'];assert 'three weeks' in d['schedule_summary'];assert len(d['passport_groups'])==5
 if code=='00558':assert all('6-week' in x['title'] for x in d['passport_groups']);assert d['cycle_days']==42
 if code=='00455':assert d['cycle_days']==21
 if code in ['00455','00558']:assert 'first-line' in d['indication_text'];assert all(x in d['monitoring_summary'] for x in ['3–6','consultant']);assert 'After:' in d['patient_summary']['monitoring'][2]['when']
 if code=='00551':assert d['protocol_version']=='7a';assert '480' not in d['schedule_summary'];assert all(s in d['schedule_summary'] for s in ['240','600','1200'])
 if code=='00900':assert '480' in d['schedule_summary'];assert '600' not in d['schedule_summary'];assert '24 months' in d['phases'][1]['detail']
 if code=='00890':
  assert d['protocol_version']=='2a';assert 'with or without food' in d['schedule_summary'];assert 'weekly for the first month' in d['monitoring_summary'];assert 'At exactly 12 hours' in d['chapters'][2]['items'][2]['text'];assert 'low-fat' not in json.dumps(d)
 rows.append(dict(code=code,file=file,sha256=hashlib.sha256((R/file).read_bytes()).hexdigest(),chapters=len(d['chapters']),anatomy_cards=len(d['anatomy']),monitoring_rows=len(d['monitoring_schedule']['rows']),status='content_contract_passed'))
(O/'content-checks.json').write_text(json.dumps({'checked':'2026-11-05','profiles':rows,'limitation':'Authored content and source-reference contracts; not rendered PDF/browser or independent clinical approval.'},indent=2)+'\n');print('Five source-scoped patient profile contracts passed')
