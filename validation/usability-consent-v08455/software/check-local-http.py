"""Verify actual deployed-tree bytes through HTTP; browser interaction is separate."""
import concurrent.futures,datetime,hashlib,http.client,json,pathlib,re,subprocess,time
R=pathlib.Path(__file__).resolve().parents[3];site=R/'_site';report_root=R/'validation/usability-consent-v08455'
files={'index.html','js/sactcheck-release.js','js/protocol-loader.js','js/runtime-performance-v0810.js','protocols/index.json','protocols/catalogue-bundle.json.gz','data/app-release.json','data/consent-core-v08455.json','assets/patient/consent-core-v08455.css'}
for f in re.findall(r'<link[^>]+rel=["\']manifest["\'][^>]+href=["\']([^"\']+)',(R/'index.html').read_text()):files.add(f.split('?')[0].lstrip('/'))
index=json.loads((R/'protocols/index.json').read_text())
for row in index['protocols']:files.add(row['path'])
for row in json.loads((report_root/'consent-inventory.json').read_text())['routes']:
 route=row['route'];files.update([f'patient/{route}/consent-form.html',f'patient/{route}/consent-form.pdf',f'docs/patient/{route}/consent-form.pdf'])
server=subprocess.Popen(['python3','-m','http.server','8000','--bind','127.0.0.1','--directory',str(site)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
def get(file):
 conn=http.client.HTTPConnection('127.0.0.1',8000,timeout=20);query='?sact_release=0.84.55' if file.startswith('protocols/') else '';conn.request('GET','/'+file+query);response=conn.getresponse();data=response.read();status=response.status;typ=response.getheader('Content-Type');conn.close();assert status==200,(file,status);assert data==(R/file).read_bytes(),(file,'served bytes differ');return {'path':file,'status':status,'bytes':len(data),'mime_type':typ,'sha256':hashlib.sha256(data).hexdigest()}
try:
 for _ in range(30):
  try:get('index.html');break
  except OSError:time.sleep(.1)
 with concurrent.futures.ThreadPoolExecutor(6) as pool:results=list(pool.map(get,sorted(files)))
 report={'release':'0.84.55','status':'passed','checked_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'requests_verified':len(results),'all_bytes_match_checkout':True,'browser_interaction_verified':False,'results':results};(report_root/'software/local-http.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items() if k!='results'}))
finally:server.terminate();server.wait(timeout=5)
