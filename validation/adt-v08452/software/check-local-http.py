from pathlib import Path
import json,hashlib,subprocess,sys,time,http.client
R=Path(__file__).resolve().parents[3];V=R/'validation/adt-v08452';scope=json.loads((V/'scope.json').read_text());sha=lambda b:hashlib.sha256(b).hexdigest()
assert json.loads((R/'_site/data/app-release.json').read_text())['version']=='0.84.52'
files=['data/app-release.json','protocols/index.json','js/sactcheck-release.js','js/regimen-knowledge-base.js','css/regimen-knowledge-base.css','data/prostate-treatment-explainer-v08451.json','data/regimen-knowledge-base-v08452-addendum.json']
for protocol in sorted((R/'protocols').rglob('*.json')):
 if protocol.name[:5] in scope['clinical_routes']:files.append(protocol.relative_to(R).as_posix())
for route in scope['new_routes']:
 files += ['patient/'+route+'/'+n for n in ['index.html','knowledge.html','guide.pdf','sactcard.pdf','knowledge.pdf','handbook.pdf','passport.pdf','consent-form.pdf','supportive-care.pdf','treatment-journey.pdf','logistics.pdf','oncowiki-qr.png']]
for route in scope['new_routes']:files.append('patient/'+route+'/support-'+('continuous' if route=='00830' else 'depot')+'.pdf')
for route in scope['retrospective_patient_routes']:files+=['patient/'+route+'/'+n for n in ['guide.pdf','handbook.pdf']]
server=subprocess.Popen([sys.executable,'-m','http.server','8000','--bind','127.0.0.1','--directory',str(R/'_site')],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
rows=[]
try:
 for attempt in range(50):
  try:
   c=http.client.HTTPConnection('127.0.0.1',8000,timeout=10);c.request('GET','/data/app-release.json');x=c.getresponse();b=x.read();c.close()
   if x.status==200:break
  except OSError:time.sleep(.1)
 else:raise RuntimeError('Local HTTP server did not become ready')
 for file in files:
  c=http.client.HTTPConnection('127.0.0.1',8000,timeout=10);c.request('GET','/'+file);response=c.getresponse();body=response.read();c.close();assert response.status==200,(file,response.status);assert body==(R/file).read_bytes()==(R/'_site'/file).read_bytes(),file
  rows.append({'path':file,'status':response.status,'bytes':len(body),'sha256':sha(body)})
 report={'release':'0.84.52','status':'passed','resources':len(rows),'source':'checkout and built _site served over local HTTP','live_deployment_verified':False,'rows':rows};(V/'software').mkdir(exist_ok=True);(V/'software/local-http.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items() if k!='rows'}))
finally:
 server.terminate();server.wait(timeout=10)
