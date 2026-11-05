from pathlib import Path
import json,hashlib,unicodedata,re
import fitz,zxingcpp
from PIL import Image
R=Path(__file__).resolve().parents[1];O=R/'validation/colorectal-v08434';rows=[];qr=[]
(O/'pdf-qa').mkdir(parents=True,exist_ok=True)
norm=lambda s:re.sub(r'\s+','',unicodedata.normalize('NFKC',s)).replace('\u00ad','')
for c,profile in json.loads((R/'data/patient-presentation-v08431.json').read_text())['routes'].items():
 if c not in json.loads((O/'scope.json').read_text())['presentation_routes']:continue
 d=json.loads((R/profile).read_text());url=f'https://sactcheck.com/patient/{c}/knowledge.html'
 assert url in [x.text for x in zxingcpp.read_barcodes(Image.open(R/f'patient/{c}/oncowiki-qr.png'))];qr.append({'code':c,'asset':'oncowiki-qr.png','destination':url})
 portal_url=f'https://sactcheck.com/patient/{c}/';assert portal_url in [x.text for x in zxingcpp.read_barcodes(Image.open(R/f'patient/{c}/qr.png'))];qr.append({'code':c,'asset':'qr.png','destination':portal_url})
 for name,expected in [('guide',3),('sactcard',1)]:
  p=R/f'patient/{c}/{name}.pdf';doc=fitz.open(p);assert len(doc)==expected,(c,name,len(doc));assert p.read_bytes()==(R/f'docs/patient/{c}/{name}.pdf').read_bytes()
  for page in doc:
   for b in page.get_text('blocks'):assert b[0]>=-1 and b[1]>=-1 and b[2]<=page.rect.width+1 and b[3]<=page.rect.height+1,(c,name,'bounds',b[:4])
  if name=='guide':
   text=norm(doc[1].get_text())
   for anatomy in d['anatomy']:
    for value in anatomy[1:4]:assert norm(value) in text,(c,'missing anatomical detail',value)
   first=norm(doc[0].get_text());s=d['patient_summary']
   for value in [s['purpose'],s['schedule']]+[x['text'] for x in s['phases']]+[x['when'] for x in s['monitoring']]:assert norm(value) in first,(c,'missing summary',value)
  page=doc[2 if name=='guide' else 0];pix=page.get_pixmap(matrix=fitz.Matrix(3,3));assert url in [x.text for x in zxingcpp.read_barcodes(Image.frombytes('RGB',[pix.width,pix.height],pix.samples))],(c,name,'QR')
  qr.append({'code':c,'asset':name+'.pdf','destination':url});rows.append({'code':c,'document':name,'pages':len(doc),'compatibility_identical':True,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
(O/'pdf-qa/pdf-validation.json').write_text(json.dumps({'documents':len(rows),'pages':sum(x['pages'] for x in rows),'checks':rows},indent=2)+'\n');(O/'pdf-qa/qr-validation.json').write_text(json.dumps(qr,indent=2)+'\n');print(len(rows),'PDFs;',len(qr),'QR checks; all anatomical text retained.')

all_rows=[]
for c in json.loads((O/'scope.json').read_text())['presentation_routes']:
 for p in sorted((R/'patient'/c).glob('*.pdf')):
  doc=fitz.open(p);assert p.read_bytes()==(R/'docs/patient'/c/p.name).read_bytes(),(c,p.name,'mirror')
  for i,page in enumerate(doc):
   assert len(page.get_text().strip())>5,(c,p.name,i+1,'empty page')
   for b in page.get_text('blocks'):assert b[0]>=-1 and b[1]>=-1 and b[2]<=page.rect.width+1 and b[3]<=page.rect.height+1,(c,p.name,i+1,'bounds',b[:4])
  all_rows.append({'code':c,'file':p.name,'pages':len(doc),'bytes':p.stat().st_size})
(O/'pdf-qa/all-pdf-validation.json').write_text(json.dumps({'documents':len(all_rows),'pages':sum(x['pages'] for x in all_rows),'checks':all_rows},indent=2)+'\n');print(len(all_rows),'total PDFs: matching mirrors, nonempty pages and text within page boundaries.')

# Complete printed reference retains the authored clinical paragraphs and tables.
from lxml import html as LH
import importlib.util
_spec=importlib.util.spec_from_file_location('v34_pdf_support',R/'tools/build-colorectal-v08434-pdfs.py');support=importlib.util.module_from_spec(_spec);_spec.loader.exec_module(support)
normalized=lambda s:re.sub(r'[^\w]','',unicodedata.normalize('NFKC',s)).lower()
references=[];wallets=[]
for route in json.loads((O/'scope.json').read_text())['presentation_routes']:
 p=R/'patient'/route;doc=fitz.open(p/'knowledge.pdf');text=normalized(''.join(pg.get_text(clip=fitz.Rect(0,0,pg.rect.width,pg.rect.height-40)) for pg in doc));tree=LH.fromstring((p/'knowledge.html').read_text());checked=0
 for el in tree.xpath('//main//p | //main//td | //main//h2 | //main//h3'):
  t=normalized(el.text_content())
  if len(t)<25:continue
  checked+=1
  assert t in text,(route,'missing reference text',el.text_content()[:180])
 profile=json.loads((R/json.loads((R/'data/patient-presentation-v08431.json').read_text())['routes'][route]).read_text())
 for anchor in profile['anatomy']:
  for label in anchor[1:4]:assert normalized(label) in text,(route,'reference anatomical detail missing',label)
 book=fitz.open(p/'handbook.pdf');toc=book.get_toc();assert len(toc)==7,(route,'handbook sections',toc)
 assert all(toc[i][2]<toc[i+1][2] for i in range(6)),(route,'section sequence')
 assert len(support.phases(route))>0,(route,'missing phase support')
 for phase in support.phases(route):assert (p/('support-'+phase['id']+'.pdf')).exists()
 references.append({'route':route,'source_text_blocks':checked,'reference_pages':len(doc),'handbook_pages':len(book),'sections':toc,'support_phases':[z['id'] for z in support.phases(route)]})
 # Measure print-layout boxes in CSS px (96/in), not screenshot pixels.
 rendered=support.HTML(filename=str(p/'sactcard.html')).render(stylesheets=[support.CSS(string=support.font_css('DejaVu'))],font_config=support.FONT_CONFIG)
 panels=[]
 for page in rendered.pages:
  for box in page._page_box.descendants():
   if box.element is None or box.element_tag!='section':continue
   if box.element.get('class') in ['pt-wallet-front','pt-wallet-back'] and box.style['height'] != 'auto':
    width=box.border_width()*25.4/96;height=box.border_height()*25.4/96
    assert abs(width-85.6)<1 and abs(height-54)<1,(route,'wallet panel dimensions',width,height)
    panels.append({'panel':box.element.get('class'),'width_mm':width,'height_mm':height})
 assert len(panels)==2,(route,'wallet must contain front and back',panels)
 wallets.append({'route':route,'panels':panels})
(O/'pdf-qa/handbook-validation.json').write_text(json.dumps(references,indent=2)+'\n')
(O/'pdf-qa/wallet-dimensions.json').write_text(json.dumps(wallets,indent=2)+'\n')
print(len(references),'full reference retention checks; wallet panels measured in millimetres.')

# Reject stale renders after later profile/HTML changes.
for row in json.loads((O/'pdf-qa/companion-build.json').read_text())['documents']:
 name='supportive-care-overview' if row['document']=='supportive-care' else row['document']
 path=R/'patient'/row['route']/(name+'.html')
 assert hashlib.sha256(path.read_bytes()).hexdigest()==row['source_sha256'],(str(path),'changed after PDF rendering')
for row in json.loads((O/'pdf-qa/handbooks.json').read_text()):
 assert row.get('source_hashes'),(row['route'],'missing render input hashes')
 for name,expected in row['source_hashes'].items():assert hashlib.sha256((R/name).read_bytes()).hexdigest()==expected,(name,'changed after handbook rendering')
print('PDF render input hashes match current source.')
