from pathlib import Path
import json,hashlib,re,unicodedata,importlib.util,concurrent.futures,logging
import fitz,zxingcpp
from PIL import Image
from lxml import html as LH
R=Path(__file__).resolve().parents[3];O=Path(__file__).parent
spec=importlib.util.spec_from_file_location('support',R/'tools/build-colorectal-v08435-pdfs.py');s=importlib.util.module_from_spec(spec);spec.loader.exec_module(s)
P=json.loads((R/'data/patient-presentation-v08431.json').read_text())['routes'];C=[x['code'] for x in json.loads((R/'data/colorectal-suite-progress-v0832.json').read_text())['regimens']];ROUTES=[c+'/colorectal' if c+'/colorectal' in P else c for c in C]
norm=lambda x:re.sub(r'\W','',unicodedata.normalize('NFKC',x)).lower()
def phase_list(route):
 c,*ctx=route.split('/')
 if not ctx:return json.loads((R/'data/phase-support-v0838.json').read_text())['regimens'].get(c,[])
 for f in ['data/phase-support-contexts-v08435.json','data/phase-support-contexts-v08434.json','data/phase-support-contexts-v08425.json']:
  q=R/f
  if q.exists():
   z=json.loads(q.read_text()).get('regimens',{}).get(c,{}).get(ctx[0]);
   if z:return z
 return []
def audit(route):
 logging.getLogger('weasyprint').setLevel(logging.ERROR)
 p=R/'patient'/route;profile=P.get(route,'data/patient-knowledge/'+route.split('/')[0]+'.json');d=json.loads((R/profile).read_text());findings=[];docs=[];qrs=[];card=[];wallet=[]
 def issue(kind,detail):findings.append({'kind':kind,'detail':detail})
 for name in ['guide','sactcard','knowledge','handbook','consent-form','passport','logistics','supportive-care','treatment-journey']:
  if not(p/(name+'.pdf')).exists():issue('missing_pdf',name)
 for f in sorted(p.glob('*.pdf')):
  doc=fitz.open(f);mirror=R/'docs/patient'/route/f.name
  if not mirror.exists() or f.read_bytes()!=mirror.read_bytes():issue('mirror',f.name)
  if f.stem in ['guide','sactcard'] and len(doc)!={'guide':3,'sactcard':1}[f.stem]:issue('page_count',{'file':f.name,'pages':len(doc)})
  for i,page in enumerate(doc):
   if len(page.get_text().strip())<5:issue('empty_page',{'file':f.name,'page':i+1})
   for b in page.get_text('blocks'):
    if b[0]<-1 or b[1]<-1 or b[2]>page.rect.width+1 or b[3]>page.rect.height+1:issue('bounds',{'file':f.name,'page':i+1,'bounds':b[:4]})
  docs.append({'file':f.name,'pages':len(doc),'sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'bytes':f.stat().st_size})
 for image_name,expected in [('oncowiki-qr.png',f'https://sactcheck.com/patient/{route}/knowledge.html'),('qr.png',f'https://sactcheck.com/patient/{route}/')]:
  f=p/image_name
  if not f.exists():issue('missing_qr',image_name);continue
  decoded=[x.text for x in zxingcpp.read_barcodes(Image.open(f))];qrs.append({'file':image_name,'decoded':decoded,'expected':expected})
  if expected not in decoded:issue('qr_destination',qrs[-1])
 for name in ['guide','sactcard']:
  f=p/(name+'.pdf')
  if not f.exists():continue
  doc=fitz.open(f);page=doc[-1];pix=page.get_pixmap(matrix=fitz.Matrix(3,3));decoded=[x.text for x in zxingcpp.read_barcodes(Image.frombytes('RGB',[pix.width,pix.height],pix.samples))];expected=f'https://sactcheck.com/patient/{route}/knowledge.html';qrs.append({'file':f.name,'decoded':decoded,'expected':expected})
  if expected not in decoded:issue('pdf_qr_destination',qrs[-1])
  if name=='guide':
   full=norm(''.join(x.get_text() for x in doc));anatomy=norm(doc[1].get_text()) if len(doc)>1 else full
   for a in d.get('anatomy',[]):
    for t in a[1:4]:
     if norm(t) not in anatomy:issue('guide_anatomy_text',t)
   pix=doc[1 if len(doc)>1 else 0].get_pixmap(matrix=fitz.Matrix(1.7,1.7));pix.save(O/(route.replace('/','-')+'-anatomy-baseline.png'))
  try:
   rendered=s.HTML(filename=str(p/(name+'.html'))).render(stylesheets=[s.CSS(string=s.font_css('DejaVu'))],font_config=s.FONT_CONFIG)
   for pg in rendered.pages:
    for b in pg._page_box.descendants():
     if b.element is None:continue
     cl=b.element.get('class','')
     if name=='guide' and b.element_tag=='article' and 'hcc-organ-card' in cl:
      ts=[t for t in b.descendants() if type(t).__name__=='TextBox'];bottom=b.position_y+b.margin_top+b.border_height()-b.padding_bottom;right=b.position_x+b.margin_left+b.border_width()
      if not ts:issue('empty_anatomy_card',b.element.get('data-hcc-target'));continue
      gap=bottom-max(t.position_y+t.height for t in ts);card.append({'target':b.element.get('data-hcc-target'),'clearance_px':round(gap,2)})
      if gap < -1:issue('anatomy_card_clip',card[-1])
      if max(t.position_x+t.width for t in ts)>right+1:issue('anatomy_card_horizontal_clip',card[-1])
     if name=='sactcard' and b.element_tag=='section' and cl in ['pt-wallet-front','pt-wallet-back'] and b.style['height']!='auto':
      width=b.border_width()*25.4/96;height=b.border_height()*25.4/96;ts=[t for t in b.descendants() if type(t).__name__=='TextBox'];bottom=b.position_y+b.margin_top+b.border_height()-b.padding_bottom;gap=bottom-max(t.position_y+t.height for t in ts);wallet.append({'panel':cl,'width_mm':width,'height_mm':height,'clearance_px':round(gap,2)})
      if abs(width-85.6)>1 or abs(height-54)>1:issue('wallet_dimensions',wallet[-1])
      if gap < -1:issue('wallet_clip',wallet[-1])
  except Exception as e:issue('geometry_error',repr(e))
 if len(card)!=len(d.get('anatomy',[])):issue('anatomy_card_count',{'rendered':len(card),'profile':len(d.get('anatomy',[]))})
 if len(wallet)!=2:issue('wallet_panel_count',len(wallet))
 if (p/'knowledge.pdf').exists():
  doc=fitz.open(p/'knowledge.pdf');text=norm(''.join(pg.get_text() for pg in doc));tree=LH.fromstring((p/'knowledge.html').read_text());missing=[];checked=0
  for e in tree.xpath('//main//p | //main//td | //main//h2 | //main//h3'):
   t=norm(e.text_content())
   if len(t)>25:
    checked+=1
    if t not in text:missing.append(e.text_content()[:180])
  if missing:issue('reference_text_missing',missing)
  for a in d.get('anatomy',[]):
   for t in a[1:4]:
    if norm(t) not in text:issue('reference_anatomy_text',t)
 if (p/'handbook.pdf').exists():
  doc=fitz.open(p/'handbook.pdf');toc=doc.get_toc()
  if len(toc)!=7 or any(toc[i][2]>=toc[i+1][2] for i in range(len(toc)-1)):issue('handbook_sections',toc)
  booktext=norm(''.join(pg.get_text() for pg in doc))
  for ph in phase_list(route):
   f=p/('support-'+ph['id']+'.pdf')
   if not f.exists():issue('missing_phase_pdf',f.name);continue
   text=norm(''.join(pg.get_text() for pg in fitz.open(f)));tt=LH.fromstring((p/('support-'+ph['id']+'.html')).read_text());notes=[norm(e.text_content()) for e in tt.xpath('//li') if len(norm(e.text_content()))>25]
   for n in notes:
    if n not in text:issue('phase_text_missing',f.name)
    if n not in booktext:issue('handbook_phase_text_missing',f.name)
 return {'route':route,'profile':profile,'anatomy':d.get('anatomy',[]),'template_version':d.get('patient_summary',{}).get('template_version'),'documents':docs,'qr_checks':qrs,'cards':card,'wallet':wallet,'findings':findings}
if __name__=='__main__':
 rows=[]
 with concurrent.futures.ProcessPoolExecutor(max_workers=3) as pool:
  for row in pool.map(audit,ROUTES):
   rows.append(row);(O/(row['route'].replace('/','-')+'-baseline.json')).write_text(json.dumps(row,indent=2)+'\n');print(row['route'],len(row['findings']),'findings',flush=True)
 (O/'existing-audit.json').write_text(json.dumps({'routes':len(rows),'documents':sum(len(x['documents']) for x in rows),'pages':sum(d['pages'] for x in rows for d in x['documents']),'qr_checks':sum(len(x['qr_checks']) for x in rows),'results':rows},indent=2)+'\n')
 print('TOTAL',len(rows),'routes',sum(len(x['findings']) for x in rows),'findings',flush=True)
