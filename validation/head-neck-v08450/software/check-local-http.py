"""Serve the built site and compare its scoped HTTP responses with source bytes."""
from pathlib import Path
import urllib.request, hashlib, json, subprocess, time
ROOT=Path(__file__).resolve().parents[3]
routes=['00294/head_neck','00242','00295','00615','00893']
paths=['index.html','about.html','js/sactcheck-release.js','data/app-release.json','protocols/index.json','js/patient-asset-registry-v0810.js','patient/00294/scope.html','manifest.webmanifest']
for route in routes:
    paths += ['patient/'+route+'/'+name for name in ['index.html','knowledge.html','guide.pdf','sactcard.pdf','handbook.pdf','consent-form.pdf','qr.png','oncowiki-qr.png']]
server=subprocess.Popen(['python3','-m','http.server','8000','--bind','127.0.0.1','--directory','_site'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
rows=[]
try:
    for _ in range(30):
        try:
            urllib.request.urlopen('http://127.0.0.1:8000/js/sactcheck-release.js',timeout=1).read()
            break
        except Exception:
            if server.poll() is not None:
                raise RuntimeError(server.stderr.read().decode())
            time.sleep(.1)
    for path in paths:
        with urllib.request.urlopen('http://127.0.0.1:8000/'+path,timeout=15) as response:
            data=response.read()
            assert response.status==200
            assert data==(ROOT/'_site'/path).read_bytes()
            assert data==(ROOT/path).read_bytes(),path+' source mismatch'
            rows.append({'path':path,'status':response.status,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'content_type':response.headers.get('Content-Type')})
    assert b'0.84.50' in urllib.request.urlopen('http://127.0.0.1:8000/js/sactcheck-release.js').read()
    Path(__file__).with_name('local-http.json').write_text(json.dumps({'status':'pass','origin':'http://127.0.0.1:8000','release':'0.84.50','checked':len(rows),'rows':rows,'live_deployment_verified':False},indent=2)+'\n')
    print('Verified',len(rows),'local HTTP resources against built/source bytes')
finally:
    server.terminate()
    server.wait(timeout=10)
