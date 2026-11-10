"""Verify v46 staged packs against authored anatomy, rendered boxes and exact QR destinations."""
from pathlib import Path
import argparse,concurrent.futures,copy,hashlib,importlib.util,json,logging,re
import fitz,zxingcpp
from PIL import Image
from lxml import html as LH
from weasyprint import HTML,CSS
R=Path(__file__).resolve().parents[1]
s=importlib.util.spec_from_file_location('pdf43',R/'tools/build-patient-documents-v08443.py');h=importlib.util.module_from_spec(s);s.loader.exec_module(h)
def audit(job):
 route,stage=job;errors=[];checks=[];qrs=[];geometry=[];root=R/'patient'/route
 profile=R/('data/patient-knowledge-contexts/'+route+'.json' if '/' in route else 'data/patient-knowledge/'+route+'.json');data=json.loads(profile.read_text());logging.getLogger('weasyprint').setLevel(logging.ERROR)
 for name,count in [('guide',3),('sactcard',1)]:
  p=Path(stage)/route/(name+'.pdf');doc=fitz.open(p)
  if len(doc)!=count:errors.append([name,'page count',len(doc)])
  h.inspect_pdf(p.read_bytes(),route+'/'+name)
  if name=='guide':
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
 return {'route':route,'checks':checks,'qr_checks':qrs,'geometry':geometry,'errors':errors}
def main():
 a=argparse.ArgumentParser();a.add_argument('--stage',type=Path,required=True);a.add_argument('--report',type=Path,required=True);args=a.parse_args();scope=json.loads((R/'validation/head-neck-v08446/scope.json').read_text())['clinical_routes'];rows=[]
 with concurrent.futures.ProcessPoolExecutor(max_workers=3) as pool:
  tasks=[pool.submit(audit,(r,str(args.stage))) for r in scope]
  for future in concurrent.futures.as_completed(tasks):
   r=future.result();rows.append(r);print(r['route'],len(r['errors']),r['errors'][:2],flush=True)
 args.report.write_text(json.dumps({'status':'failed' if any(r['errors'] for r in rows) else 'pass','results':rows,'visual_review_required':True},indent=2)+'\n')
 if any(r['errors'] for r in rows):raise SystemExit(1)
if __name__=='__main__':main()
