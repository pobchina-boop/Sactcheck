"""Verify v50 staged packs against authored anatomy, rendered boxes and exact QR destinations."""
from pathlib import Path
import argparse,concurrent.futures,copy,hashlib,importlib.util,json,logging,re,subprocess
import fitz,zxingcpp
from PIL import Image
from lxml import html as LH
from weasyprint import HTML,CSS
R=Path(__file__).resolve().parents[1]
SCOPE=json.loads((R/'validation/adt-v08452/scope.json').read_text())
s=importlib.util.spec_from_file_location('pdf43',R/'tools/build-patient-documents-v08443.py');h=importlib.util.module_from_spec(s);s.loader.exec_module(h)
def audit(job):
 route,stage,build_rows=job;errors=[];checks=[];qrs=[];geometry=[];anatomy_proof=[];root=R/'patient'/route
 profile=R/('data/patient-knowledge-contexts/'+route+'.json' if '/' in route else 'data/patient-knowledge/'+route+'.json');data=json.loads(profile.read_text());logging.getLogger('weasyprint').setLevel(logging.ERROR)
 for name,count in [('guide',3),('sactcard',1)]:
  p=Path(stage)/route/(name+'.pdf');doc=fitz.open(p)
  build=next((row for row in build_rows if row['route']==route and row['name']==name),None)
  if build is None:raise ValueError((route,name,'Missing pack build provenance'))
  if h.SHA(p.read_bytes())!=build['sha256']:errors.append([name,'Pack bytes changed after rendering'])
  for file,digest in build['source_hashes'].items():
   if h.SHA((R/file).read_bytes())!=digest:errors.append([name,'Pack source changed after rendering',file])
  if len(doc)!=count:errors.append([name,'page count',len(doc)])
  h.inspect_pdf(p.read_bytes(),route+'/'+name)
  if name=='guide':
   artwork=R/'assets/patient/anatomy-hcc-v0762.png'
   intended=Image.open(artwork).convert('RGB');pixel_md5=hashlib.md5(intended.tobytes()).hexdigest()
   embedded=[item for item in doc[1].get_image_info(hashes=True) if (item['width'],item['height'])==intended.size]
   if len(embedded)!=1 or embedded[0]['digest'].hex()!=pixel_md5:errors.append(['approved detailed anatomical pixels missing or changed'])
   else:
    box=fitz.Rect(embedded[0]['bbox']);anatomy_proof.append({'asset':str(artwork.relative_to(R)),'asset_sha256':h.SHA(artwork.read_bytes()),'pixels':list(intended.size),'decoded_pixel_md5':pixel_md5,'physical_size_mm':[box.width*25.4/72,box.height*25.4/72]})
    if abs(box.width/box.height-intended.width/intended.height)>.001:errors.append(['anatomical aspect ratio distorted'])
    if route not in SCOPE['new_routes']:
     frozen=subprocess.check_output(['git','show',SCOPE['base_commit']+':patient/'+route+'/guide.pdf'],cwd=R)
     prior=fitz.open(stream=frozen,filetype='pdf')
     figures=[item for page in prior for item in page.get_image_info(hashes=True) if (item['width'],item['height'])==intended.size]
     if len(figures)!=1 or figures[0]['digest'].hex()!=pixel_md5:errors.append(['Historical approved anatomy missing or different'])
     else:
      before=fitz.Rect(figures[0]['bbox']);size=[before.width,before.height];current=[box.width,box.height]
      anatomy_proof[-1].update(baseline_commit=SCOPE['base_commit'],baseline_pdf_sha256=h.SHA(frozen),baseline_physical_size_mm=[v*25.4/72 for v in size])
      if any(abs(a-b)>.1 for a,b in zip(size,current)):errors.append(['Anatomical physical scale differs from published baseline',size,current])
   text=h.norm(doc[1].get_text())
   for entry in data['anatomy']:
    for phrase in entry[1:4]:
     if h.norm(phrase) not in text:errors.append(['anatomy text missing',phrase])
  for i,page in enumerate(doc):
   if name=='sactcard' or i==2:
    pix=page.get_pixmap(matrix=fitz.Matrix(2,2),colorspace=fitz.csRGB);decoded=[x.text for x in zxingcpp.read_barcodes(Image.frombytes('RGB',[pix.width,pix.height],pix.samples))];expected='https://sactcheck.com/patient/'+route+'/knowledge.html';qrs.append({'document':name,'page':i+1,'expected':expected,'decoded':decoded})
    if expected not in decoded:errors.append([name,'printed QR mismatch',decoded])
  tree=LH.fromstring((root/(name+'.html')).read_text())
  if name=='guide':
   section=tree.xpath('//*[contains(concat(" ",normalize-space(@class)," ")," pt-effects ")]')[0];body=tree.find('body')
   for child in list(body):body.remove(child)
   body.append(copy.deepcopy(section))
  rendered=HTML(string=LH.tostring(tree,encoding='unicode'),base_url=str(root)).render(stylesheets=[CSS(string=h.font_css('DejaVu'),font_config=h.FONT_CONFIG)],font_config=h.FONT_CONFIG)
  for page in rendered.pages:
   for b in page._page_box.descendants():
    if b.element is None or type(b).__name__ not in ['BlockBox','TableCellBox']:continue
    cl=b.element.get('class','');ts=[x for x in b.descendants() if type(x).__name__=='TextBox'];iscard='hcc-organ-card' in cl;iswallet=cl in ['pt-wallet-front','pt-wallet-back'] and b.style['height']!='auto'
    if not(iscard or iswallet) or not ts:continue
    bottom=b.position_y+b.margin_top+b.border_height()-b.padding_bottom;right=b.position_x+b.margin_left+b.border_width()-b.padding_right
    gap=bottom-max(t.position_y+t.height for t in ts);horizontal=right-max(t.position_x+t.width for t in ts)
    row={'document':name,'class':cl,'target':b.element.get('data-hcc-target'),'bottom_clearance_px':round(gap,2),'right_clearance_px':round(horizontal,2)};geometry.append(row)
    if gap<-.7 or horizontal<-.7:errors.append(['internal text clipping',row])
    if iswallet:
     sizes=[b.border_width()*25.4/96,b.border_height()*25.4/96];row['mm']=sizes
     if abs(sizes[0]-85.6)>.2 or abs(sizes[1]-54)>.2:errors.append(['wallet dimensions',row])
  checks.append({'document':name,'sha256':h.SHA(p.read_bytes()),'pages':len(doc)})
 for n,expected in [('qr.png','https://sactcheck.com/patient/'+route+'/'),('oncowiki-qr.png','https://sactcheck.com/patient/'+route+'/knowledge.html')]:
  values=[x.text for x in zxingcpp.read_barcodes(Image.open(root/n))];qrs.append({'file':n,'decoded':values,'expected':expected})
  if expected not in values:errors.append(['QR PNG mismatch',n,values])
 return {'route':route,'checks':checks,'qr_checks':qrs,'geometry':geometry,'anatomical_artwork':anatomy_proof,'errors':errors}
def main():
 a=argparse.ArgumentParser();a.add_argument('--stage',type=Path,required=True);a.add_argument('--report',type=Path,required=True);a.add_argument('--build-report',type=Path,default=R/'validation/adt-v08452/pdf/pack-build.json');args=a.parse_args();build=json.loads(args.build_report.read_text());assert not build['errors'];
 for file,digest in build['font_files'].items():
  if h.SHA(Path(file).read_bytes())!=digest:raise ValueError(('Font changed after pack rendering',file))
 scope=sorted(set(row['route'] for row in build['results']));rows=[]
 with concurrent.futures.ProcessPoolExecutor(max_workers=3) as pool:
  tasks=[pool.submit(audit,(r,str(args.stage),build['results'])) for r in scope]
  for future in concurrent.futures.as_completed(tasks):
   r=future.result();rows.append(r);print(r['route'],len(r['errors']),r['errors'][:2],flush=True)
 args.report.write_text(json.dumps({'status':'failed' if any(r['errors'] for r in rows) else 'pass','results':rows,'visual_review_required':True},indent=2)+'\n')
 if any(r['errors'] for r in rows):raise SystemExit(1)
if __name__=='__main__':main()
