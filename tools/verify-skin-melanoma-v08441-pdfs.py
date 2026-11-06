from pathlib import Path
import json,hashlib,re,unicodedata,importlib.util,concurrent.futures,logging
import fitz,zxingcpp
from PIL import Image
from lxml import html as LH
R=Path(__file__).resolve().parents[1];O=R/'validation/skin-melanoma-v08441/pdf-qa';O.mkdir(parents=True,exist_ok=True)
spec=importlib.util.spec_from_file_location('support',R/'tools/build-skin-melanoma-v08441-pdfs.py');s=importlib.util.module_from_spec(spec);spec.loader.exec_module(s)
P=json.loads((R/'data/patient-presentation-v08431.json').read_text())['routes'];ROUTES=json.loads((R/'validation/skin-melanoma-v08441/scope.json').read_text())['presentation_routes']+s.RETRO_ROUTES
norm=lambda x:re.sub(r'\W','',unicodedata.normalize('NFKC',x)).lower()
def phase_list(route):return s.phases(route)
def reference_body_text(doc):
 # Exclude only the verified numeric folio in the physical footer. A paragraph
 # can legitimately span pages; the folio is not part of its authored sentence.
 parts=[]
 for i,page in enumerate(doc):
  for b in page.get_text('blocks'):
   if b[4].strip()==str(i+1) and b[1]>=page.rect.height-35 and b[3]<=page.rect.height:continue
   parts.append(b[4])
 return ''.join(parts)
def print_ui_only(el):
 return any(set(x.get('class','').split()) & {'no-print','pk-no-print','access-links','journey-scroll-hint','pk-controls','pk-nav'} for x in [el]+list(el.iterancestors()))
def audit(route):
 logging.getLogger('weasyprint').setLevel(logging.ERROR)
 p=R/'patient'/route;profile=P.get(route,'data/patient-knowledge/'+route.split('/')[0]+'.json');d=json.loads((R/profile).read_text());findings=[];docs=[];qrs=[];card=[];wallet=[];marker_layers=[]
 def issue(kind,detail):findings.append({'kind':kind,'detail':detail})
 for name in ['guide','sactcard','knowledge','handbook','consent-form','passport','logistics','supportive-care','treatment-journey']:
  if not(p/(name+'.pdf')).exists():issue('missing_pdf',name)
 for f in sorted(p.glob('*.pdf')):
  doc=fitz.open(f);mirror=R/'docs/patient'/route/f.name
  if not mirror.exists() or f.read_bytes()!=mirror.read_bytes():issue('mirror',f.name)
  if f.stem in ['guide','sactcard','consent-form'] and len(doc)!={'guide':3,'sactcard':1,'consent-form':1}[f.stem]:issue('page_count',{'file':f.name,'pages':len(doc)})
  for i,page in enumerate(doc):
   if re.search(r'\bundefined\b|\[object Object\]|\bNaN\b',page.get_text()):issue('unresolved_template_value',{'file':f.name,'page':i+1})
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
   pix=doc[1 if len(doc)>1 else 0].get_pixmap(matrix=fitz.Matrix(1.7,1.7));pix.save(O/(route.replace('/','-')+'-anatomy-final.png'))
  try:
   rendered=s.HTML(filename=str(p/(name+'.html'))).render(stylesheets=[s.CSS(string=s.font_css('DejaVu'))],font_config=s.FONT_CONFIG)
   for pg in rendered.pages:
    for b in pg._page_box.descendants():
     if b.element is None:continue
     cl=b.element.get('class','')
     if name=='guide' and b.element_tag=='div' and cl=='hcc-anatomy' and type(b).__name__=='TableCellBox':
      marker_layers.append({'container_z_index':b.style['z_index']})
      if b.style['z_index']!='auto':issue('marker_connector_overpaint',marker_layers[-1])
     if name=='guide' and b.element_tag=='article' and 'hcc-organ-card' in cl:
      ts=[t for t in b.descendants() if type(t).__name__=='TextBox'];bottom=b.position_y+b.margin_top+b.border_height()-b.padding_bottom;right=b.position_x+b.margin_left+b.border_width()
      if not ts:issue('empty_anatomy_card',b.element.get('data-hcc-target'));continue
      gap=bottom-max(t.position_y+t.height for t in ts);card.append({'target':b.element.get('data-hcc-target'),'clearance_px':round(gap,2)})
      if gap < -1:issue('anatomy_card_clip',card[-1])
      if max(t.position_x+t.width for t in ts)>right+1:issue('anatomy_card_horizontal_clip',card[-1])
     if name=='sactcard' and b.element_tag=='p' and b.element.get('class')=='pt-card-schedule' and type(b).__name__=='BlockBox':
      ts=[t for t in b.descendants() if type(t).__name__=='TextBox']
      if ts and max(t.position_y+t.height for t in ts)>b.position_y+b.margin_top+b.border_height()+1:issue('wallet_schedule_internal_overlap',{'text':b.element.text,'height_px':b.border_height()})
     if name=='sactcard' and b.element_tag=='section' and cl in ['pt-wallet-front','pt-wallet-back'] and b.style['height']!='auto':
      width=b.border_width()*25.4/96;height=b.border_height()*25.4/96;ts=[t for t in b.descendants() if type(t).__name__=='TextBox'];bottom=b.position_y+b.margin_top+b.border_height()-b.padding_bottom;gap=bottom-max(t.position_y+t.height for t in ts);wallet.append({'panel':cl,'width_mm':width,'height_mm':height,'clearance_px':round(gap,2)})
      if abs(width-85.6)>.2 or abs(height-54)>.2:issue('wallet_dimensions',wallet[-1])
      if gap < -1:issue('wallet_clip',wallet[-1])
  except Exception as e:issue('geometry_error',repr(e))
 if len(marker_layers)!=1:issue('marker_layer_count',len(marker_layers))
 if len(card)!=len(d.get('anatomy',[])):issue('anatomy_card_count',{'rendered':len(card),'profile':len(d.get('anatomy',[]))})
 if len(wallet)!=2:issue('wallet_panel_count',len(wallet))
 if (p/'guide.pdf').exists():
  guide=fitz.open(p/'guide.pdf');first=norm(guide[0].get_text());summary=d.get('patient_summary',{})
  for value in [summary.get('purpose',''),summary.get('schedule','')]+[z.get('text','') for z in summary.get('phases',[])]+[z.get('when','') for z in summary.get('monitoring',[])]:
   if value and norm(value) not in first:issue('guide_summary_text_missing',value)
 if (p/'knowledge.pdf').exists():
  doc=fitz.open(p/'knowledge.pdf');text=norm(reference_body_text(doc));tree=LH.fromstring((p/'knowledge.html').read_text());missing=[];checked=0
  book_spec=importlib.util.spec_from_file_location('net_book_support',R/'tools/build-patient-handbooks-v08441.py');book=importlib.util.module_from_spec(book_spec);book_spec.loader.exec_module(book);book.offline_reference(tree)
  for e in tree.xpath('//main//p | //main//td | //main//h2 | //main//h3 | //main//summary | //main//li'):
   if print_ui_only(e):continue
   t=norm(e.text_content())
   if len(t)>25:
    checked+=1
    if t not in text:missing.append(e.text_content()[:180])
  if missing:issue('reference_text_missing',missing)
  for a in d.get('anatomy',[]):
   for t in a[1:4]:
    if norm(t) not in text:issue('reference_anatomy_text',t)
 for name in ['passport','logistics','treatment-journey','supportive-care']:
  filename=p/(name+'.pdf');source=p/(('supportive-care-overview' if name=='supportive-care' else name)+'.html')
  if not filename.exists() or not source.exists():continue
  text=norm(''.join(pg.get_text() for pg in fitz.open(filename)));tree=LH.fromstring(source.read_text())
  for el in tree.xpath('//main//p | //main//li | //main//td | //main//th | //main//h2 | //main//h3'):
   if print_ui_only(el):continue
   content=norm(el.text_content())
   if len(content)>25 and content not in text:issue('companion_text_missing',{'file':filename.name,'text':el.text_content()[:180]})
 if (p/'handbook.pdf').exists():
  doc=fitz.open(p/'handbook.pdf');toc=doc.get_toc()
  if len(toc)!=7 or any(toc[i][2]>=toc[i+1][2] for i in range(len(toc)-1)):issue('handbook_sections',toc)
  # A bound reference has one global folio; standalone page numbers must not survive.
  reference=fitz.open(p/'knowledge.pdf');start=toc[1][2]-1;end=toc[2][2]-1
  if end-start!=len(reference):issue('reference_page_count_in_handbook',{'bound':end-start,'standalone':len(reference)})
  for i,standalone in enumerate(reference):
   boundpage=doc[start+i];clip=fitz.Rect(0,0,standalone.rect.width,standalone.rect.height-35)
   if norm(standalone.get_text(clip=clip))!=norm(boundpage.get_text(clip=clip)):issue('bound_reference_body_changed',i+1)
   if any(w[4].isdigit() and w[1]>boundpage.rect.height-40 and abs((w[0]+w[2])/2-boundpage.rect.width/2)<25 for w in boundpage.get_text('words')):issue('duplicate_reference_folio',i+1)
  booktext=norm(''.join(pg.get_text() for pg in doc))
  for name in ['guide','sactcard','passport','logistics','treatment-journey','supportive-care']:
   filename=p/(name+'.pdf')
   if not filename.exists():continue
   for page in fitz.open(filename):
    if norm(page.get_text()) not in booktext:issue('handbook_companion_page_missing',filename.name)
  for ph in phase_list(route):
   f=p/('support-'+ph['id']+'.pdf')
   if not f.exists():issue('missing_phase_pdf',f.name);continue
   text=norm(''.join(pg.get_text() for pg in fitz.open(f)));tt=LH.fromstring((p/('support-'+ph['id']+'.html')).read_text());notes=[norm(e.text_content()) for e in tt.xpath('//li') if len(norm(e.text_content()))>25]
   for page in fitz.open(f):
    if norm(page.get_text()) not in booktext:issue('handbook_phase_page_missing',f.name)
   for n in notes:
    if n not in text:issue('phase_text_missing',f.name)
    if n not in booktext:issue('handbook_phase_text_missing',f.name)
 if (p/'consent-form.pdf').exists():
  tree=LH.fromstring((p/'consent-form.html').read_text());sheets=tree.xpath('//*[contains(concat(" ",normalize-space(@class)," ")," consent-sheet ")]')
  text=''.join(pg.get_text() for pg in fitz.open(p/'consent-form.pdf'))
  if len(sheets)!=1 or s.norm(sheets[0].text_content())!=s.norm(text):issue('consent_text_not_complete',route)
 # Keep inspectable final renders for every companion page, all reference pages and handbook contents.
 renders=[]
 for name in ['guide','sactcard','knowledge','consent-form','passport','logistics','supportive-care','treatment-journey','handbook']:
  filename=p/(name+'.pdf')
  if not filename.exists():continue
  doc=fitz.open(filename)
  render_dir=O/'renders'/route.replace('/','-');render_dir.mkdir(parents=True,exist_ok=True)
  for previous in render_dir.glob(name+'-*.png'):previous.unlink()
  for i,page in enumerate(doc):
   if name=='handbook' and i>0:continue
   target=O/'renders'/route.replace('/','-')/(name+'-'+str(i+1).zfill(2)+'.png');target.parent.mkdir(parents=True,exist_ok=True)
   page.get_pixmap(matrix=fitz.Matrix(1.5,1.5)).save(target);renders.append(str(target.relative_to(R)))
 return {'route':route,'renders':renders,'profile':profile,'anatomy':d.get('anatomy',[]),'template_version':d.get('patient_summary',{}).get('template_version'),'documents':docs,'qr_checks':qrs,'cards':card,'wallet':wallet,'marker_layers':marker_layers,'findings':findings}
if __name__=='__main__':
 rows=[]
 with concurrent.futures.ProcessPoolExecutor(max_workers=3) as pool:
  for row in pool.map(audit,ROUTES):rows.append(row);print(row['route'],len(row['findings']),'findings',flush=True)
 extra=[]
 def failure(kind,detail):extra.append({'kind':kind,'detail':detail})
 for report in ['companion-build.json','handbooks.json']:
  f=O/report
  if not f.exists():failure('missing_render_provenance',report);continue
  data=json.loads(f.read_text());entries=data.get('documents',[]) if isinstance(data,dict) else data
  covered={row['route'] for row in entries}
  if covered!=set(ROUTES):failure('provenance_scope',{'report':report,'expected':ROUTES+s.RETRO_ROUTES,'actual':sorted(covered)})
  for row in entries:
   if report=='companion-build.json':
    source='supportive-care-overview' if row['document']=='supportive-care' else row['document'];path=R/'patient'/row['route']/(source+'.html')
    if hashlib.sha256(path.read_bytes()).hexdigest()!=row['source_sha256']:failure('stale_companion_render',str(path))
    output=R/'patient'/row['route']/(row['document']+'.pdf')
    if hashlib.sha256(output.read_bytes()).hexdigest()!=row['sha256']:failure('stale_companion_output',str(output))
   else:
    for document in row['documents']:
     output=R/'patient'/row['route']/document['document']
     if hashlib.sha256(output.read_bytes()).hexdigest()!=document['sha256']:failure('stale_handbook_output',str(output))
   if not row.get('source_hashes'):failure('missing_source_hashes',row['route'])
   for name,expected in row.get('source_hashes',{}).items():
    if hashlib.sha256((R/name).read_bytes()).hexdigest()!=expected:failure('stale_render_input',name)
 output={'release':'0.84.41','routes':len(rows),'documents':sum(len(x['documents']) for x in rows),'pages':sum(d['pages'] for x in rows for d in x['documents']),'qr_checks':sum(len(x['qr_checks']) for x in rows),'findings':sum(len(x['findings']) for x in rows)+len(extra),'results':rows,'additional_findings':extra,'limitations':['QR destination decoding checks exact intended canonical URLs; unpublished routes may return404 until manual publication.','Visual review is recorded separately and is not inferred from geometry assertions.','Real phone installation, camera scanning and physical printing require separate device evidence.']}
 (O/'final-audit.json').write_text(json.dumps(output,indent=2)+'\n')
 print('TOTAL',len(rows),'routes;',output['documents'],'PDFs;',output['pages'],'pages;',output['qr_checks'],'QR checks;',output['findings'],'findings')
 raise SystemExit(1 if output['findings'] else 0)
