"""Independent read-only follow-up; does not rewrite baseline evidence."""
from pathlib import Path
import json,re,collections,hashlib,os
import pymupdf as fitz
from lxml import html
R=Path(__file__).resolve().parents[3];O=Path(__file__).parent
rows=json.loads((O/'baseline-inventory.json').read_text())['contexts']
norm=lambda s:re.sub('[^a-z0-9]+','',s.lower())
out=[]
for b in rows:
 c=b['code'];d=json.loads((R/b['profile_path']).read_text());p=R/'patient'/b['route'];findings=[]
 ids=collections.Counter(x[0] for x in d['anatomy']);coords=collections.Counter(tuple(x[4:]) for x in d['anatomy'])
 if any(v>1 for v in ids.values()) or any(v>1 for v in coords.values()):findings.append('Duplicate anatomy target or coincident pins')
 for name in ['index.html','guide.html','knowledge.html']:
  t=html.fromstring((p/name).read_text());cards=t.xpath('//*[@data-hcc-target]');pins=t.xpath('//*[@data-hcc-pin]')
  if collections.Counter(x.get('data-hcc-target') for x in cards)!=ids:findings.append(name+' anatomy card mismatch')
  if collections.Counter(x.get('data-hcc-pin') for x in pins)!=ids:findings.append(name+' anatomy pin mismatch')
 if c in ['00421','00555','00783']:
  for name in ['knowledge.html','knowledge-print.html','port-pump.html']:
   if 'Treatment continues for about 46 hours' in (p/name).read_text():findings.append(name+' wrong generic pump duration')
 support=html.fromstring((p/'supportive-care.html').read_text());links=sorted(set(a.get('href') for a in support.xpath('//a') if (a.get('href')or'').startswith('support-') and a.get('href').endswith('.pdf')))
 for link in links:
  if not (p/link).exists():findings.append('Missing support '+link)
 if not (p/'handbook.pdf').exists():findings.append('Missing handbook')
 else:
  hb=fitz.open(p/'handbook.pdf');toc=hb.get_toc()
  if len(toc)!=7:findings.append('Handbook sections not seven')
  else:
   first=toc[3][2]-1;last=toc[4][2]-1;nt=norm(''.join(hb[i].get_text() for i in range(first,last)))
   for link in links:
    for page in fitz.open(p/link):
     for block in page.get_text('blocks'):
      text=block[4]
      if len(norm(text))>=25 and 'SACTCheck v' not in text and norm(text) not in nt:findings.append('Handbook support block missing: '+link+' '+text[:100])
 if (p/'knowledge.pdf').exists():
  text=norm(''.join(page.get_text() for page in fitz.open(p/'knowledge.pdf')))
  for i,g in enumerate(d['day_groups']):
   for k in ['title','body','action']:
    if norm(g[k]) not in text:findings.append('Knowledge PDF missing day-group '+str(i)+' '+k)
 else:findings.append('Missing knowledge PDF')
 pdfs=[]
 for path in sorted(p.glob('*.pdf')):
  pdf=fitz.open(path);bad=[]
  for i,page in enumerate(pdf):
   for w in page.get_text('words'):
    if w[0]<-.5 or w[1]<-.5 or w[2]>page.rect.width+.5 or w[3]>page.rect.height+.5:bad.append({'page':i+1,'word':w[4],'bbox':list(w[:4])})
  mirror=R/'docs'/path.relative_to(R);same=mirror.exists() and mirror.read_bytes()==path.read_bytes()
  pdfs.append({'path':str(path.relative_to(R)),'pages':len(pdf),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'mirror_equal':same,'bounds_violations':bad})
  if not same:findings.append('PDF mirror mismatch '+path.name)
  if bad:findings.append('PDF bounds '+path.name)
 out.append({'code':c,'route':b['route'],'findings':findings,'phase_pdfs':links,'pdfs':pdfs})
 print(c,findings or 'content/bounds/support checks passed',flush=True)
(O/os.environ.get('CONSISTENCY_FOLLOWUP_OUTPUT','final-followup.json')).write_text(json.dumps({'scope':'Independent read-only consistency probes after regeneration. No source recertification or live verification. Geometry is not visual certification.','contexts':out},indent=2)+'\n')
