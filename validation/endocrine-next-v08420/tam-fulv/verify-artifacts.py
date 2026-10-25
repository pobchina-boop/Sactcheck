import json,pathlib,re
H=pathlib.Path(__file__).resolve().parent
s=json.loads((H/'service-facts.json').read_text());e=json.loads((H/'evidence.json').read_text())
checks=[]
def check(name,condition):
 checks.append({'name':name,'pass':bool(condition)})
 if not condition: raise AssertionError(name)
for code,u in s['patient_updates'].items():
 check(code+' evidence metrics empty',u['evidence']['metrics']==[])
 check(code+' patient trial numerics removed',not re.search(r'\b(?:HR|RR|CI)\s*[0-9]|\d\s*%|median\s+(?:OS|PFS)|\bp\s*[=<]\s*[.0-9]',json.dumps(u),re.I))
 ids={x['id'] for x in u['sources']}
 def visit(x):
  if isinstance(x,dict):
   if 'source_ids' in x: check(code+' source references '+','.join(x['source_ids']),set(x['source_ids'])<=ids)
   for v in x.values():visit(v)
  elif isinstance(x,list):
   for v in x:visit(v)
 visit(u)
 check(code+' evidence has clinician profiles',bool(e['profiles'][code]['evidence_at_a_glance']['sources']))
 check(code+' stable timetable preserved',bool(u['endocrine_timeline']['rows']))
check('Tamoxifen no universal four-week patient ECG',not re.search(r'at least four weeks|≥4 weeks',json.dumps(s['patient_updates']['00253'])))
check('Fulvestrant assay warning', 'misleadingly high' in s['patient_updates']['00361']['monitoring_summary'])
check('Fulvestrant combination boundary','capivasertib' in s['patient_updates']['00361']['indication_text'])
r={'scope':'Generated service/evidence artifacts only','total':len(checks),'passed':sum(c['pass'] for c in checks),'checks':checks}
(H/'artifact-checks.json').write_text(json.dumps(r,indent=2)+'\n');print(f"Artifact checks: {r['passed']}/{r['total']}")
