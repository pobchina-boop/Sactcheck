from pathlib import Path
import json,hashlib,http.server,threading,urllib.request,functools
R=Path.cwd();site=R/'_site';codes=['00282','00622','00628','00450','00759','00333','00337','00338','00583','00846'];paths=['index.html','data/app-release.json','protocols/index.json','protocols/catalogue-bundle.json.gz','js/sactcheck-release.js']
for c in codes:
 paths +=[f'patient/{c}/'+n for n in ['index.html','knowledge.html','knowledge-print.html','guide.pdf','handbook.pdf','consent-form.pdf','sactcard.pdf','qr.png','oncowiki-qr.png']]
 paths +=[f'docs/patient/{c}/guide.pdf']
class Handler(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',35799),functools.partial(Handler,directory=str(site)));thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start();opener=urllib.request.build_opener(urllib.request.ProxyHandler({}));rows=[]
try:
 for p in paths:
  with opener.open('http://127.0.0.1:35799/'+p,timeout=10) as response:
   b=response.read();assert response.status==200;assert b==(site/p).read_bytes();assert b==(R/p).read_bytes(),('stale deployable file',p)
   if p.endswith('.pdf'):assert b.startswith(b'%PDF-')
   rows.append({'path':p,'status':response.status,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()})
 assert json.loads((site/'data/app-release.json').read_text())['version']=='0.84.58'
finally:server.shutdown();server.server_close();thread.join()
report={'status':'passed','release':'0.84.58','scope':'Local HTTP delivery and source-output byte equality only; no browser rendering, deployment or live-site claim','requests':len(rows),'results':rows};(R/'validation/gu-v08458/software/http-local.json').write_text(json.dumps(report,indent=2)+'\n');print('HTTP local:',len(rows),'paths passed; no browser or deployment check')
