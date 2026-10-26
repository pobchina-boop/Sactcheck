from pathlib import Path
import os
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import json,hashlib,collections,re,zipfile,fitz
R=Path(__file__).resolve().parents[2];O=Path(__file__).parent
read=lambda p:json.loads((R/p).read_text())
issues=[];stats=collections.Counter()
def issue(kind,location,detail):issues.append(dict(kind=kind,location=location,detail=detail))
protocols={}
for row in read('protocols/index.json')['protocols']:
 p=read(row['path']);c=p['metadata']['nccp_regimen_code'];protocols[c]=p;stats['protocols']+=1
 rules=p.get('rule_engine',{}).get('rules',[]);stats['rules']+=len(rules)
 ids=[x.get('rule_id') or x.get('id') for x in rules]
 for x,n in collections.Counter(ids).items():
  if n>1:issue('duplicate_rule_id',c,x)
 if p['metadata'].get('validation',{}).get('clinical_use_authorised'):issue('authorisation_true',c,'Review flag unexpectedly true')
 for rule in rules:
  if not rule.get('source'):issue('missing_rule_source',c,rule.get('id'))
 for key,d in p.get('input_definitions',{}).items():
  stats['input_definitions']+=1
  if d.get('required'):issue('forced_input',c,key)
  opts=d.get('options',[])
  vals=[x.get('value') if isinstance(x,dict) else x for x in opts]
  if len(vals)!=len(set(map(str,vals))):issue('duplicate_option_value',c,key)
class Page(HTMLParser):
 def __init__(self,s):super().__init__();self.links=[];self.ids=set();self.feed(s)
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:self.ids.add(a['id'])
  for k in ['href','src']:
   if k in a:self.links.append((tag,k,a[k]))
cache={}
for p in (R/'patient').rglob('*.html'):
 stats['patient_html_files']+=1;s=p.read_text();h=Page(s);cache[p]=h
 if '[object Object]' in s:issue('rendered_object',str(p.relative_to(R)),'Object string in HTML')
for p,h in cache.items():
 for tag,key,u in h.links:
  if not u or u.startswith(('http:','https:','data:','mailto:','tel:','javascript:')):continue
  bits=urlsplit(u);target=(R/bits.path.lstrip('/') if bits.path.startswith('/') else p.parent/unquote(bits.path)).resolve() if bits.path else p
  if target.is_dir():target=target/'index.html'
  stats['local_link_checks']+=1
  if not target.exists():issue('missing_local_link',str(p.relative_to(R)),u)
  elif bits.fragment and target in cache and bits.fragment not in cache[target].ids and tag=='a':issue('missing_anchor',str(p.relative_to(R)),u)
for p in (R/'data/patient-knowledge').glob('*.json'):
 d=json.loads(p.read_text());c=d.get('code',p.stem);stats['authored_suites']+=1
 for name in ['index.html','knowledge.html','consent.html','consent-form.html','guide.html','passport.html','sactcard.html','logistics.html','supportive-care.html','treatment-journey.html','guide.pdf','consent-form.pdf','passport.pdf','sactcard.pdf','logistics.pdf','supportive-care.pdf','treatment-journey.pdf']:
  stats['suite_asset_checks']+=1
  if not (R/'patient'/c/name).is_file():issue('missing_full_suite_asset',c,name)
 if c not in protocols:issue('authored_not_executable',c,d.get('protocol_id'));continue
 protocol=protocols[c]
 if str(d.get('protocol_version'))!=str(protocol['metadata']['nccp_version']):issue('patient_protocol_version',c,{'patient':d.get('protocol_version'),'protocol':protocol['metadata']['nccp_version']})
 ids={x.get('id') for x in d.get('sources',[]) if isinstance(x,dict)}
 def walk(x,path=''):
  if isinstance(x,dict):
   for k,v in x.items():
    if k.endswith('source_ids') and isinstance(v,list):
     for sid in v:
      if sid not in ids:issue('undefined_patient_source_id',c,path+'.'+k+':'+str(sid))
    walk(v,path+'.'+k)
  elif isinstance(x,list):
   for i,v in enumerate(x):walk(v,path+f'[{i}]')
 walk(d)
 if d.get('evidence',{}).get('metrics'):stats['suites_retaining_numeric_patient_evidence']+=1
for p in (R/'patient').rglob('*.pdf'):
 stats['patient_pdfs']+=1
 try:
  doc=fitz.open(p);stats['pdf_pages']+=len(doc)
  for i,page in enumerate(doc):
   if not page.get_text().strip():issue('pdf_no_text',str(p.relative_to(R)),i+1)
   bad=[b[:4] for b in page.get_text('blocks') if b[0]<-1 or b[1]<-1 or b[2]>page.rect.width+1 or b[3]>page.rect.height+1]
   if bad:issue('pdf_bounds',str(p.relative_to(R)),{'page':i+1,'bounds':bad})
  twin=R/'docs'/p.relative_to(R)
  if not twin.exists():issue('pdf_compatibility_missing',str(p.relative_to(R)),'No docs copy')
  elif twin.read_bytes()!=p.read_bytes():issue('pdf_compatibility_differs',str(p.relative_to(R)),'Bytes differ')
 except Exception as e:issue('pdf_parse_failure',str(p.relative_to(R)),str(e))
protected=read('data/protected-patient-assets-v0810.json')['assets']
for c,files in protected.items():
 for name,x in files.items():
  stats['protected_asset_hashes']+=1;p=R/'patient'/c/name
  if not p.exists() or hashlib.sha256(p.read_bytes()).hexdigest()!=x['sha256']:issue('protected_asset_mismatch',c,name)
result={'stats':dict(stats),'issue_counts':dict(collections.Counter(x['kind'] for x in issues)),'issues':issues}
(O/'static-audit.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({k:v for k,v in result.items() if k!='issues'},indent=2))

assert not issues, str(issues[:20])
