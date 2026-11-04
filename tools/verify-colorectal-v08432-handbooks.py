from pathlib import Path
import json,re,unicodedata
from lxml import html
import fitz
R=Path(__file__).resolve().parents[1];cfg=json.loads((R/'data/patient-presentation-v08431.json').read_text());rows=[];missing=[];bounds=[]
def norm(s):return re.sub(r'[^\w]','',unicodedata.normalize('NFKC',s)).lower()
for route in cfg['routes']:
 p=R/'patient'/route;doc=fitz.open(p/'knowledge.pdf');text=norm(''.join(pg.get_text(clip=fitz.Rect(0,0,pg.rect.width,pg.rect.height-40)) for pg in doc));tree=html.fromstring((p/'knowledge.html').read_text());checked=0
 for el in tree.xpath('//main//p | //main//td | //main//h2 | //main//h3'):
  t=norm(el.text_content())
  if len(t)<25:continue
  checked+=1
  if t not in text:missing.append([route,el.text_content()[:180]])
 for name in ['knowledge','handbook']:
  d=fitz.open(p/(name+'.pdf'));assert (p/(name+'.pdf')).read_bytes()==(R/'docs/patient'/route/(name+'.pdf')).read_bytes()
  for i,page in enumerate(d):
   for b in page.get_text('blocks'):
    if b[0]<-1 or b[1]<-1 or b[2]>page.rect.width+1 or b[3]>page.rect.height+1:bounds.append([route,name,i+1,b[:4]])
  if name=='handbook':assert len(d.get_toc())==7
 rows.append({'route':route,'reference_text_blocks_checked':checked,'reference_pages':len(doc)})
report={'routes':len(rows),'checks':rows,'missing_reference_text':missing,'out_of_page_text':bounds};(R/'validation/colorectal-v08432/handbook-validation.json').write_text(json.dumps(report,indent=2)+'\n');print('Routes',len(rows),'text blocks',sum(r['reference_text_blocks_checked'] for r in rows),'missing',len(missing),'bounds',len(bounds));print(missing[:12]);print(bounds[:3]);assert not missing and not bounds
