from pathlib import Path
import json,hashlib,re,unicodedata,importlib.util,concurrent.futures,logging
import fitz,zxingcpp
from PIL import Image
from lxml import html as LH
R=Path(__file__).resolve().parents[1];O=R/'validation/colorectal-v08436/pdf-qa';O.mkdir(parents=True,exist_ok=True)
spec=importlib.util.spec_from_file_location('support',R/'tools/build-colorectal-v08436-pdfs.py');s=importlib.util.module_from_spec(spec);spec.loader.exec_module(s)
P=json.loads((R/'data/patient-presentation-v08431.json').read_text())['routes'];C=[x['code'] for x in json.loads((R/'data/colorectal-suite-progress-v0832.json').read_text())['regimens']];ROUTES=[c+'/colorectal' if c+'/colorectal' in P else c for c in C]
norm=lambda x:re.sub(r'\W','',unicodedata.normalize('NFKC',x)).lower()
def phase_list(route):
 c,*ctx=route.split('/')
 if not ctx:return json.loads((R/'data/phase-support-v0838.json').read_text())['regimens'].get(c,[])
 for f in ['data/phase-support-contexts-v08436.json','data/phase-support-contexts-v08435.json','data/phase-support-contexts-v08434.json','data/phase-support-contexts-v08425.json']:
  q=R/f
  if q.exists():
   z=json.loads(q.read_text()).get('regimens',{}).get(c,{}).get(ctx[0]);
   if z:return z
 return []
def audit(route):
 logging.getLogger('weasyprint').setLevel(logging.ERROR)
 p=R/'patient'/route;profile=P.get(route,'data/patient-knowledge/'+route.split('/')[0]+'.json');d=json.loads((R/profile).read_text());findings=[];docs=[];qrs=[];card=[];wallet=[];marker_layers=[]
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
      if abs(width-85.6)>1 or abs(height-54)>1:issue('wallet_dimensions',wallet[-1])
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
   for page in fitz.open(f):
    if norm(page.get_text()) not in booktext:issue('handbook_phase_page_missing',f.name)
   for n in notes:
    if n not in text:issue('phase_text_missing',f.name)
    if n not in booktext:issue('handbook_phase_text_missing',f.name)
 return {'route':route,'profile':profile,'anatomy':d.get('anatomy',[]),'template_version':d.get('patient_summary',{}).get('template_version'),'documents':docs,'qr_checks':qrs,'cards':card,'wallet':wallet,'marker_layers':marker_layers,'findings':findings}
if __name__=='__main__':
 rows=[]
 with concurrent.futures.ProcessPoolExecutor(max_workers=3) as pool:
  for row in pool.map(audit,ROUTES):rows.append(row);print(row['route'],len(row['findings']),'findings',flush=True)
 extra=[]
 def failure(kind,detail):extra.append({'kind':kind,'detail':detail})
 baseline=json.loads((O/'existing-audit.json').read_text())
 for old in baseline['results']:
  current=json.loads((R/P[old['route']]).read_text()).get('anatomy',[])
  before=[(a[0],a[4],a[5]) for a in old['anatomy']]
  after=[(a[0],a[4],a[5]) for a in current]
  if old['route']=='00227':before[4]=('hands-feet',23,56)
  if before!=after:failure('anatomical_pin_change',{'route':old['route'],'before':before,'after':after})
  if len(current)<len(old['anatomy']):failure('anatomy_card_loss',old['route'])
 patchfile=O/'marker-page-patches.json'
 patches=json.loads(patchfile.read_text())['results'] if patchfile.exists() else []
 superseded={}
 book_builds={row['route']:row for row in json.loads((O/'handbooks.json').read_text())}
 subsequent=[]
 if len(patches)!=41:failure('marker_patch_scope',len(patches))
 for patch in patches:
  for name,expected in patch['source_hashes'].items():
   if hashlib.sha256((R/name).read_bytes()).hexdigest()!=expected:failure('stale_marker_input',name)
  for doc in patch['documents']:
   path=R/'patient'/patch['route']/doc['document']
   actual_hash=hashlib.sha256(path.read_bytes()).hexdigest()
   current=fitz.open(path)
   if actual_hash!=doc['sha256']:
    row=book_builds.get(patch['route'],{});updates=[x for x in row.get('documents',[]) if x['document']==doc['document']]
    allowed=doc['document']=='handbook.pdf' and patch['route'] in ['00216','00692'] and row.get('refresh')==['knowledge.pdf','treatment-journey.pdf'] and len(updates)==1 and updates[0].get('before_sha256')==doc['sha256'] and updates[0].get('sha256')==actual_hash and any(x['section']=='guide.pdf' and x['body_streams_preserved'] for x in row.get('preserved_sections',[]))
    if not allowed:failure('stale_marker_output',str(path))
    else:subsequent.append({'route':patch['route'],'reason':'Regenerated source-authored runtime journey and reference after exact marker-page patch.','marker_patched_handbook_sha256':doc['sha256'],'final_handbook_sha256':actual_hash,'refresh':row['refresh'],'preserved_sections':row['preserved_sections']})
   else:
    for proof in doc['unchanged_page_streams']:
     page=current[proof['page']-1];actual=hashlib.sha256(b'\0'.join(current.xref_stream(x) for x in page.get_contents())).hexdigest()
     if actual!=proof['stream_sha256']:failure('preserved_page_stream_changed',{'path':str(path),'page':proof['page']})
   if doc['document']=='handbook.pdf':
    guide=fitz.open(R/'patient'/patch['route']/'guide.pdf');book_page=current[current.get_toc()[0][2]]
    guide_streams={hashlib.sha256(guide.xref_stream(x)).hexdigest() for x in guide[1].get_contents()};book_streams={hashlib.sha256(current.xref_stream(x)).hexdigest() for x in book_page.get_contents()}
    if not guide_streams<=book_streams:failure('marker_page_not_preserved_in_handbook',patch['route'])
  for item in patch['superseded_guide_inputs']:superseded[(item['path'],item['previous_sha256'])]=item['current_sha256']
 (O/'post-marker-journey-rebuilds.json').write_text(json.dumps(subsequent,indent=2)+'\n')
 for report in ['companion-build.json','handbooks.json']:
  f=O/report
  if not f.exists():failure('missing_render_provenance',report);continue
  data=json.loads(f.read_text());entries=data.get('documents',[]) if isinstance(data,dict) else data
  for row in entries:
   if report=='companion-build.json':
    source='supportive-care-overview' if row['document']=='supportive-care' else row['document'];path=R/'patient'/row['route']/(source+'.html')
    if hashlib.sha256(path.read_bytes()).hexdigest()!=row['source_sha256']:failure('stale_companion_render',str(path))
   else:
    if not row.get('source_hashes'):failure('missing_source_hashes',row['route'])
    for name,expected in row.get('source_hashes',{}).items():
     if hashlib.sha256((R/name).read_bytes()).hexdigest()!=superseded.get((name,expected),expected):failure('stale_handbook_input',name)
 # Known bad baseline must remain detectable: no empty fixture masquerades as a pass.
 baseline_kinds={finding['kind'] for row in baseline['results'] for finding in row['findings']}
 if not {'wallet_clip','missing_pdf','reference_anatomy_text','handbook_phase_text_missing'}<=baseline_kinds:failure('negative_baseline_incomplete',sorted(baseline_kinds))
 output={'routes':len(rows),'documents':sum(len(x['documents']) for x in rows),'pages':sum(d['pages'] for x in rows for d in x['documents']),'qr_checks':sum(len(x['qr_checks']) for x in rows),'findings':sum(len(x['findings']) for x in rows)+len(extra),'results':rows,'additional_findings':extra,'baseline':{'routes':baseline['routes'],'documents':baseline['documents'],'pages':baseline['pages'],'qr_checks':baseline['qr_checks'],'raw_findings':sum(len(x['findings']) for x in baseline['results'])},'limitations':['QR destination decoding is local asset validation, not canonical live response verification.','Real phone installation, camera scanning and physical printing require separate device evidence.']}
 (O/'final-audit.json').write_text(json.dumps(output,indent=2)+'\n')
 print('TOTAL',len(rows),'routes;',output['documents'],'PDFs;',output['pages'],'pages;',output['qr_checks'],'QR checks;',output['findings'],'findings')
 raise SystemExit(1 if output['findings'] else 0)
