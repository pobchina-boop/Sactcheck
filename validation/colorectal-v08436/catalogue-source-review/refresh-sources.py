#!/usr/bin/env python3
"""Fetch each selected current NCCP source once; reruns reuse successful manifest entries.
Use --refresh explicitly to request new network copies; does not edit application files.
"""
import concurrent.futures, datetime, hashlib, json, pathlib, re, subprocess, sys
import fitz
OUT=pathlib.Path(__file__).resolve().parent
ROOT=OUT.parents[2]
DATA=json.loads((OUT/'input-inventory.json').read_text())
MANIFEST=OUT/'sources.json'
OLD={x['code']:x for x in json.loads(MANIFEST.read_text())} if MANIFEST.exists() and '--refresh' not in sys.argv else {}
def utc(): return datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds')
def fetch(row):
 code=row['code']
 if code in OLD and OLD[code].get('valid_pdf'): return OLD[code]
 url=row['metadata']['source_url']; out=OUT/'sources'/f'{code}.pdf'; out.parent.mkdir(exist_ok=True)
 r={'code':code,'source_url':url,'request_started_utc':utc(),'retrieval_method':'curl --fail --location; inherited proxy and TLS verification; no bypass'}
 proc=subprocess.run(['curl','--fail','--silent','--show-error','--location','--max-time','75','--dump-header',str(out.with_suffix('.headers.txt')),'--output',str(out),'--write-out','%{http_code}\n%{url_effective}\n',url],capture_output=True,text=True)
 r.update(request_completed_utc=utc(),exit_code=proc.returncode,stderr=proc.stderr.strip())
 values=proc.stdout.splitlines(); r['http_status']=int(values[0]) if values and values[0].isdigit() else None; r['final_url']=values[1] if len(values)>1 else None
 if proc.returncode==0 and out.exists() and out.read_bytes().startswith(b'%PDF'):
  data=out.read_bytes(); doc=fitz.open(out); text='\n\n'.join(f'--- PAGE {i+1} ---\n'+p.get_text() for i,p in enumerate(doc))
  out.with_suffix('.txt').write_text(text)
  versions=sorted(set(re.findall(r'Version\s+(?:number|Number)\s*:\s*([0-9]+[a-z]?)',text)))
  published=sorted(set(re.findall(r'Published\s*:\s*([0-9]{1,2}/[0-9]{1,2}/[0-9]{4})',text)))
  review=sorted(set(re.findall(r'(?:Review|review)\s*:\s*([0-9]{1,2}/[0-9]{1,2}/[0-9]{4})',text)))
  r.update(valid_pdf=True,sha256=hashlib.sha256(data).hexdigest(),bytes=len(data),pages=len(doc),printed_versions=versions,printed_publication_dates=published,printed_review_dates=review,pdf=str(out.relative_to(ROOT)),text=str(out.with_suffix('.txt').relative_to(ROOT)),metadata_version=row['metadata'].get('nccp_version'),metadata_source_sha256=row['metadata'].get('source_pdf_sha256'))
  r['matches_metadata_sha256']=r['sha256']==r['metadata_source_sha256'] if r['metadata_source_sha256'] else None
  prior=[]
  for release in ['32','33','34','35']:
   for p in (ROOT/f'validation/colorectal-v084{release}').rglob(f'{code}.pdf'):
    h=hashlib.sha256(p.read_bytes()).hexdigest()
    prior.append({'path':str(p.relative_to(ROOT)),'sha256':h,'matches_current':h==r['sha256']})
  r['retained_prior_pdfs']=prior
 else:r['valid_pdf']=False
 print(code,r.get('http_status'),r.get('printed_versions'),r.get('matches_metadata_sha256'),flush=True)
 return r
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 rows=list(pool.map(fetch,[r for r in DATA if r['code'] not in {'00216','00692'}]))
MANIFEST.write_text(json.dumps(sorted(rows,key=lambda x:x['code']),indent=2)+'\n')
assert len(rows)==39
assert all(r.get('valid_pdf') for r in rows),'At least one source retrieval failed; inspect sources.json'
print('39 current PDFs retained; hash comparison is source freshness evidence, not a new clinical audit.')
