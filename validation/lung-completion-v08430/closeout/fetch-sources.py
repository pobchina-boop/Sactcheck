"""Fresh catalogue/source availability inventory; no clinical approval inferred."""
from pathlib import Path
from urllib.request import Request, urlopen
from concurrent.futures import ThreadPoolExecutor, as_completed
import json,re,hashlib,subprocess
R=Path(__file__).resolve().parents[3];B=Path(__file__).resolve().parent
(B/'sources').mkdir(exist_ok=True)
coverage=json.loads((R/'validation/lung-cytotoxic-v08429/lung-coverage.json').read_text())
links=json.loads((B/'catalogue-links.json').read_text())
links=list({x['url']:x for x in links}.values())
def code_for(x):
 f=x['url'].rsplit('/',1)[-1]
 m=re.match(r'(\d{3,5})_',f) or re.search(r'_(\d{3})(?:_|\.pdf)',f)
 return m.group(1).zfill(5) if m else None
bycode={code_for(x):x for x in links}
def fetch(row):
 c=row['code'];p=next((R/'protocols').glob('*/'+c+'-*.json'));d=json.loads(p.read_text());m=d['metadata']
 out=dict(code=c,title=row['title'],protocol_path=str(p.relative_to(R)),existing_authored_suite=row['authored_suite'],lung_context=row['lung_context'],recorded_version=str(m.get('nccp_version')),recorded_source_url=m.get('source_url'),recorded_source_pdf_sha256=m.get('source_pdf_sha256'),recorded_source_checked_date=m.get('source_checked_date'),recorded_reconciliation_status=m.get('validation',{}).get('rule_level_source_reconciliation_status'),recorded_independent_review=m.get('encoding_maturity',{}),catalogue_source_url=bycode.get(c,{}).get('url'),checked_date='2026-11-02',fresh_rule_reconciliation=False)
 if c not in bycode:out['fetch_error']='No source link mapped from fresh catalogue';return out
 u=bycode[c]['url'];attempts=[]
 for url in [u,u+'?download=1']:
  try:
   response=urlopen(Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=35);data=response.read();final=response.geturl()
   assert data.startswith(b'%PDF'), 'Response is not PDF'
   dest=B/'sources'/f'{c}.pdf';dest.write_bytes(data)
   subprocess.run(['pdftotext','-layout',str(dest),str(dest.with_suffix('.txt'))],check=True)
   text=dest.with_suffix('.txt').read_text()
   versions=re.findall(r'Version\s+number\s*:?\s*(\d+[a-z]?)',text,re.I)
   out.update(final_source_url=final,source_pdf_sha256=hashlib.sha256(data).hexdigest(),source_text_sha256=hashlib.sha256(text.encode()).hexdigest(),pdf_bytes=len(data),fetched_version=versions[0] if versions else None,version_candidates=sorted(set(versions)),fetch_status='pdf_retrieved',source_version_matches=(str(m.get('nccp_version'))==(versions[0] if versions else None)),same_pdf_as_recorded=(hashlib.sha256(data).hexdigest()==m.get('source_pdf_sha256')) if m.get('source_pdf_sha256') else None)
   break
  except Exception as e:attempts.append({'url':url,'error':str(e)})
 else:out['fetch_status']='failed';out['fetch_error']=attempts
 if attempts:out['fetch_attempts']=attempts
 return out
rows=[]
with ThreadPoolExecutor(max_workers=6) as ex:
 for future in as_completed([ex.submit(fetch,row) for row in coverage['rows']]):
  row=future.result();rows.append(row);print(row['code'],row.get('fetch_status'),row['recorded_version'],row.get('fetched_version'),row.get('same_pdf_as_recorded'),flush=True)
  (B/'source-status.json').write_text(json.dumps(dict(release='0.84.30',checked_date='2026-11-02',catalogue_url='https://healthservice.hse.ie/staff/information-healthcare-workers/nccp/lung-sact-regimens/',fresh_catalogue_codes=sorted(c for c in bycode if c),baseline_catalogue_count=59,rows=sorted(rows,key=lambda x:x['code'])),indent=2)+'\n')
