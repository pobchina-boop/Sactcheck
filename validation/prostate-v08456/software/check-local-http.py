"""Serve the built site and verify returned bytes against the selected checkout."""
from pathlib import Path
import urllib.request, hashlib, json, concurrent.futures, re, subprocess, time

root = Path(__file__).resolve().parents[3]
site = root / '_site'
routes = ['00101', '00257', '00313', '00546', '00203/prostate', '00203', '00203/lung', '00568']
files = {'index.html', 'js/sactcheck-release.js', 'protocols/index.json', 'protocols/catalogue-bundle.json.gz', 'data/app-release.json', 'js/patient-asset-registry-v0810.js', 'data/regimen-knowledge-base-v08456-addendum.json', 'data/phase-support-contexts-v08456.json', 'data/consent-content-v0710.json'}
for route in routes:
    files.update(str(p.relative_to(site)) for p in (site/'patient'/route).iterdir() if p.is_file() and p.suffix in ['.html', '.pdf', '.png'])
    files.update(str(p.relative_to(site)) for p in (site/'docs/patient'/route).glob('*.pdf'))
files.update(e['path'] for e in json.loads((root/'protocols/index.json').read_text())['protocols'])
for file in list(files):
    if not file.endswith('.html'):
        continue
    for url in re.findall(r'''(?:href|src)=["']([^"']+)''', (site/file).read_text()):
        if re.match(r'^(https?:|data:|mailto:|tel:|#)', url):
            continue
        p = (site/file).parent / url.split('?')[0].split('#')[0]
        try:
            rel = str(p.resolve().relative_to(site.resolve()))
        except ValueError:
            continue
        if (site/rel).is_file():
            files.add(rel)

def check(file):
    data = urllib.request.urlopen('http://127.0.0.1:8000/'+file, timeout=30).read()
    assert data == (site/file).read_bytes(), file+' HTTP differs from build'
    assert data == (root/file).read_bytes(), file+' build differs from checkout'
    return {'path': file, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest(), 'status': 'pass'}

with open(root.parent/'http56-local-server.log', 'w') as log:
    server = subprocess.Popen(['python3', '-m', 'http.server', '8000', '--bind', '127.0.0.1', '--directory', str(site)], stdout=log, stderr=log)
    try:
        for attempt in range(50):
            try:
                check('js/sactcheck-release.js')
                break
            except OSError:
                assert server.poll() is None, 'Local server exited'
                time.sleep(.1)
        else:
            raise RuntimeError('Local server did not respond')
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
            results = list(pool.map(check, sorted(files)))
        report = {'release': '0.84.56', 'scope': '377 protocols, release/index/catalogue, eight selected patient routes and linked assets', 'requests': len(results), 'status': 'pass', 'desktop_mobile_browser_validation': False, 'live_deployment_validation': False, 'results': results}
        (Path(__file__).parent/'local-http.json').write_text(json.dumps(report, indent=2)+'\n')
        print(json.dumps({k: report[k] for k in ['status', 'requests', 'scope']}))
    finally:
        server.terminate()
        server.wait(timeout=10)
