#!/usr/bin/env python3
"""Reconcile retained official catalogue HTML, including expander and legacy heading blocks."""
import datetime,hashlib,json,pathlib,re,subprocess,urllib.parse
from lxml import html
OUT=pathlib.Path(__file__).resolve().parent
ROOT=OUT.parents[2]
urls={
 'gi':'https://healthservice.hse.ie/staff/information-healthcare-workers/nccp/gastro-intestinal-sact-regimens/',
 'oral':'https://healthservice.hse.ie/staff/information-healthcare-workers/nccp/oral-anti-cancer-medicines-sact-regimens/',
 'tumour-agnostic':'https://healthservice.hse.ie/staff/information-healthcare-workers/nccp/tumou-agnostic-therapy-sact-regimens/',
 'national':'https://healthservice.hse.ie/staff/information-healthcare-workers/nccp/national-sact-regimens/'
}
CRC=re.compile(r'colorectal|\bcolon\b|rectal|\brectum\b',re.I)
manifest=[]
allrows={}
for name,url in urls.items():
 p=OUT/(name+'-listing.html')
 if not p.exists():
  proc=subprocess.run(['curl','--fail','--silent','--show-error','--location','--max-time','60','--output',str(p),'--write-out','%{http_code}\n%{url_effective}',url],capture_output=True,text=True)
  assert proc.returncode==0,proc.stderr
 now=datetime.datetime.fromtimestamp(p.stat().st_mtime,datetime.timezone.utc).isoformat(timespec='seconds')
 manifest.append({'name':name,'source_url':url,'retrieved_utc_file_mtime':now,'retrieval_timestamp_note':'Saved file modification time from successful curl HTTP 200 retrieval; precise request timing was not recorded for initial catalogue downloads.','sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'html':str(p.relative_to(ROOT))})
 doc=html.fromstring(p.read_bytes()); rows=[]
 def add(title,nodes,structure):
  text=' '.join(' '.join(n.itertext()) for n in nodes);text=' '.join(text.split())
  codes=sorted(set(re.findall(r'\b(0\d{4})[a-z]*\b',text)))
  links=sorted(set(urllib.parse.urljoin(url,a.get('href')) for n in nodes for a in ([n] if n.tag=='a' else n.xpath('.//a[@href]')) if '.pdf' in a.get('href','').lower()))
  if codes:rows.append({'title':title,'codes':codes,'pdf_urls':links,'source_link_available':bool(links),'text':text,'colorectal_explicit':bool(CRC.search(text)),'structure':structure})
 for detail in doc.xpath('//details'):
  title=' '.join(detail.xpath('./summary')[0].itertext()) if detail.xpath('./summary') else ''
  add(' '.join(title.split()),[detail],'expander')
 for heading in doc.xpath('//section/h2 | //section/h3'):
  if heading.xpath('ancestor::details'):continue
  nodes=[heading]
  for sibling in heading.itersiblings():
   if sibling.tag in ['h2','h3']:break
   nodes.append(sibling)
  add(' '.join(' '.join(heading.itertext()).split()),nodes,'heading block')
 (OUT/(name+'-listing-extracted.json')).write_text(json.dumps(rows,indent=2)+'\n');allrows[name]=rows
catalogue=json.loads((ROOT/'protocols/index.json').read_text())
# Reconcile using only indication text (rather than unrelated drug toxicity/footnotes).
encoded=[]
for entry in catalogue['protocols']:
 path=ROOT/entry['path']; p=json.loads(path.read_text());m=p.get('metadata',{})
 t=json.dumps({'indication':m.get('indication'),'indications':p.get('indications')})
 if CRC.search(t):encoded.append({'code':m.get('nccp_regimen_code'),'path':entry['path'],'indication':m.get('indication'),'indications':p.get('indications')})
expected={r['code'] for r in json.loads((OUT/'input-inventory.json').read_text())}
gi={c for r in allrows['gi'] if r['colorectal_explicit'] for c in r['codes']}
oral={c for r in allrows['oral'] if r['colorectal_explicit'] for c in r['codes']}
parser_coverage={}
for name in ['gi','oral','tumour-agnostic']:
 doc=html.fromstring((OUT/(name+'-listing.html')).read_bytes());page_codes=set(re.findall(r'\b(0\d{4})[a-z]*\b',' '.join(doc.itertext())));parsed_codes={c for r in allrows[name] for c in r['codes']}
 parser_coverage[name]={'all_page_codes':len(page_codes),'parsed_codes':len(parsed_codes),'unparsed_codes':sorted(page_codes-parsed_codes),'parsed_entries_without_pdf_link':[r for r in allrows[name] if not r['source_link_available']]}
result={'candidate_context_count':len(expected),'encoded_protocol_count':len(catalogue['protocols']),'parser_coverage':parser_coverage,'official_gi_rows':len(allrows['gi']),'gi_explicit_colorectal_codes':sorted(gi),'oral_explicit_colorectal_codes':sorted(oral),'candidate_absent_from_gi':sorted(expected-gi),'official_gi_crc_not_in_candidates':sorted(gi-expected),'official_oral_crc_not_in_candidates':sorted(oral-expected),'encoded_crc_not_in_candidates':[r for r in encoded if r['code'] not in expected],'encoded_crc_candidate_count':len([r for r in encoded if r['code'] in expected]),'tumour_agnostic_rows':allrows['tumour-agnostic'],'all_candidate_codes':sorted(expected)}
(OUT/'catalogue-sources.json').write_text(json.dumps(manifest,indent=2)+'\n')
(OUT/'catalogue-reconciliation.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({k:v for k,v in result.items() if k not in ['tumour_agnostic_rows','all_candidate_codes']},indent=2))
