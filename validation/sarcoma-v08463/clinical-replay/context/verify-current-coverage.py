import json,hashlib,pathlib
h=pathlib.Path(__file__).resolve().parent
manifest=json.loads((h/'transition-manifest.json').read_text())
ids={r['code']:{x['rule_id']for x in json.loads((h/r['candidate']).read_text())['rule_engine']['rules']}for r in manifest['protocols']}
seen={c:{}for c in ids}
paths=['prior-replays/corrected-after/author-347-trace.json','prior-replays/corrected-after/independent-197-trace.json','prior-product-cns-replay/product/current-results.json','prior-product-cns-replay/semantic/semantic-candidate-results.json','focused-case-results.corrected-fixtures.json','adjudicated-prior-contract-results.final.json','other-product-identity-results.json']
def gather(value,code,path,name):
 if isinstance(value,dict):
  for key,v in value.items():
   if key in ['id','ruleId','rule_id']and isinstance(v,str)and v in ids[code]:seen[code].setdefault(v,[]).append({'report':path,'case':name})
   else:gather(v,code,path,name)
 elif isinstance(value,list):
  for v in value:gather(v,code,path,name)
for path in paths:
 data=json.loads((h/path).read_text());rows=data if isinstance(data,list)else data.get('results',data.get('cases',[]))
 for row in rows:
  code=row.get('code')or row.get('protocol_id','')[5:10]
  if code in ids:gather(row.get('observed',{}),code,path,row.get('name',row.get('index')))
report={'scope':'Observed finding IDs across exact current frozen replays; expectations are not counted as coverage','source_reports':[{'path':p,'sha256':hashlib.sha256((h/p).read_bytes()).hexdigest()}for p in paths],'protocols':{c:{'rules':len(ids[c]),'observed_rules':len(seen[c]),'missing':sorted(ids[c]-set(seen[c])),'evidence':seen[c]}for c in ids},'clinical_approval':False}
for c in ids:assert not report['protocols'][c]['missing'],(c,report['protocols'][c]['missing'])
out=h/'combined-rule-coverage.accepted.json';b=(json.dumps(report,indent=2)+'\n').encode()
if out.exists():assert out.read_bytes()==b
else:out.write_bytes(b)
print(json.dumps({c:{'rules':len(ids[c]),'observed':len(seen[c])}for c in ids}))
