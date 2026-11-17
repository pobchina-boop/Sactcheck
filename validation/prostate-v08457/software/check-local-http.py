"""Serve and compare the built release and five patient routes over local HTTP."""
import functools
import hashlib
import http.server
import json
from pathlib import Path
import threading
import urllib.request

ROOT = Path(__file__).resolve().parents[3]
SITE = ROOT / "_site"
ROUTES = ["00104", "00326", "00518", "00564", "00588/prostate"]
FILES = ["js/sactcheck-release.js", "protocols/index.json"]
for route in ROUTES:
    FILES.extend(f"patient/{route}/{name}" for name in ["index.html", "knowledge.html", "guide.pdf", "handbook.pdf", "consent-form.pdf", "sactcard.pdf", "qr.png", "oncowiki-qr.png"])
report = {"release": "0.84.57", "port": 8000, "status": "failed", "results": []}
server = None
try:
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(SITE))
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 8000), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    client = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    for name in FILES:
        with client.open("http://127.0.0.1:8000/" + name, timeout=10) as response:
            data = response.read()
            assert response.status == 200, name
        assert data == (SITE / name).read_bytes(), name + " served bytes"
        assert data == (ROOT / name).read_bytes(), name + " checkout bytes"
        report["results"].append({"path": name, "status": 200, "sha256": hashlib.sha256(data).hexdigest()})
    assert "0.84.57" in (SITE / "js/sactcheck-release.js").read_text()
    report["status"] = "pass"
except Exception as error:
    report["error"] = str(error)
finally:
    if server:
        server.shutdown()
        server.server_close()
    Path(__file__).with_name("local-http-check.json").write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps({"status": report["status"], "checked": len(report["results"]), "error": report.get("error")}))
raise SystemExit(0 if report["status"] == "pass" else 1)
