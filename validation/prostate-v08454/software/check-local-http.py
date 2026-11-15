"""Check actual built bytes through HTTP; no browser interaction is claimed."""
import concurrent.futures,hashlib,http.client,json,pathlib,subprocess,time,datetime
R=pathlib.Path(__file__).resolve().parents[3];site=R/'_site';codes=['00482','00492','00493','00494','00848'];files={'index.html','js/sactcheck-release.js','protocols/index.json','data/app-release.json','manifest.webmanifest'}
# Include only the actual manifest filename declared in the app.
files.discard('manifest.webmanifest')
import re
for f in re.findall(r'<link[^>]+rel=["\']manifest["\'][^>]+href=["\']([^"\']+)',(R/'index.html').read_text()):files.add(f.split('?')[0].lstrip('/'))
index=json.loads((R/'protocols/index.json').read_text())['protocols']
for c in codes:
 files.add(next(x['path'] for x in index if '/'+c+'-' in x['path']))
 for prefix in ['patient','docs/patient']:
  for p in (R/prefix/c).iterdir():
   if p.suffix in ['.pdf','.png','.html']:files.add(str(p.relative_to(R)))
server=subprocess.Popen(['python3','-m','http.server','8000','--bind','127.0.0.1','--directory',str(site)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
def get(f):
 conn=http.client.HTTPConnection('127.0.0.1',8000,timeout=20);conn.request('GET','/'+f);resp=conn.getresponse();b=resp.read();status=resp.status;typ=resp.getheader('Content-Type');conn.close();want=(R/f).read_bytes();assert status==200,(f,status);assert b==want,(f,'served byte mismatch');return {'path':f,'status':status,'mime_type':typ,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
try:
 for i in range(30):
  try:get('index.html');break
  except OSError:time.sleep(.1)
 rows=list(concurrent.futures.ThreadPoolExecutor(6).map(get,sorted(files)))
 report={'status':'pass','checked_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'release':'0.84.54','protocol_count':len(index),'requests_verified':len(rows),'each_response_equals_selected_checkout':True,'browser_interaction_verified':False,'results':rows};(R/'validation/prostate-v08454/software/local-http.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items() if k!='results'}))
finally:
 server.terminate();server.wait(timeout=5)
