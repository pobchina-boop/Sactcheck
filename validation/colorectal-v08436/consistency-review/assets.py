"""Read-only anatomy, local destination and existing PDF consistency probes."""
from pathlib import Path
import hashlib,json,re,os
from collections import Counter
from lxml import html
import pymupdf as fitz
from PIL import Image
import zxingcpp

R=Path(__file__).resolve().parents[3]; O=Path(__file__).parent
baseline=json.loads((O/'baseline-inventory.json').read_text())['contexts']
norm=lambda s:re.sub(r'[^a-z0-9]+','',s.lower())
rows=[]
for b in baseline:
 c=b['code']; loc=R/'patient'/b['route']; profile=json.loads((R/b['profile_path']).read_text())
 row={'code':c,'route':b['route'],'html_anatomy':{},'qr_images':{},'pdfs':{},'issues':[]}
 targets=[a[0] for a in profile['anatomy']]
 for name in ['index.html','guide.html','knowledge.html']:
  tree=html.fromstring((loc/name).read_text()); cards=tree.xpath('//*[@data-hcc-target]');pins=tree.xpath('//*[@data-hcc-pin]')
  details={}
  for x in cards:details[x.get('data-hcc-target')]=details.get(x.get('data-hcc-target'),'')+norm(x.text_content())
  expected_text=all(norm(a[1]) in details.get(a[0],'') and norm(a[2]) in details.get(a[0],'') and norm(a[3]) in details.get(a[0],'') for a in profile['anatomy'])
  imagepaths=[(loc/x.get('src')).resolve() for x in tree.xpath('//img[contains(@alt,"Full-body anatomical")]')]
  check={'cards':len(cards),'pins':len(pins),'exact_targets':Counter(x.get('data-hcc-target') for x in cards)==Counter(targets),'exact_pin_targets':Counter(x.get('data-hcc-pin') for x in pins)==Counter(targets),'authored_text_retained':expected_text,'anatomy_asset_sha256':[hashlib.sha256(x.read_bytes()).hexdigest() for x in imagepaths]}
  row['html_anatomy'][name]=check
  if not all(check[k] for k in ['exact_targets','exact_pin_targets','authored_text_retained']):row['issues'].append(name+' anatomy does not fully match authored profile')
 for name,suffix in [('qr.png',''),('oncowiki-qr.png','knowledge.html')]:
  p=loc/name
  if not p.exists():continue
  actual=[x.text for x in zxingcpp.read_barcodes(Image.open(p))];expected='https://sactcheck.com/patient/'+b['route']+'/'+suffix
  row['qr_images'][name]={'actual':actual,'expected':expected,'matches':actual==[expected]}
  if actual!=[expected]:row['issues'].append(name+' QR destination mismatch')
 for name in ['guide.pdf','sactcard.pdf','knowledge.pdf','handbook.pdf']:
  p=loc/name
  if not p.exists():continue
  pdf=fitz.open(p); text='\n'.join(page.get_text() for page in pdf);bounds=[]
  for i,page in enumerate(pdf):
   for w in page.get_text('words'):
    if w[0]<-0.5 or w[1]<-0.5 or w[2]>page.rect.width+0.5 or w[3]>page.rect.height+0.5:bounds.append({'page':i+1,'word':w[4],'bbox':list(w[:4])})
  qr=[]
  if name in ['guide.pdf','sactcard.pdf']:
   page=pdf[-1] if name=='guide.pdf' else pdf[0];pix=page.get_pixmap(matrix=fitz.Matrix(3,3),alpha=False)
   qr=[x.text for x in zxingcpp.read_barcodes(Image.frombytes('RGB',[pix.width,pix.height],pix.samples))]
  expected='https://sactcheck.com/patient/'+b['route']+('/knowledge.html' if profile.get('patient_summary') else '/')
  row['pdfs'][name]={'pages':len(pdf),'page_sizes_pt':[list(p.rect)[2:] for p in pdf],'page_bounds_violations':bounds,'anatomy_explanations_present':all(norm(a[3]) in norm(text) for a in profile['anatomy']) if name!='sactcard.pdf' else None,'rasterized_qr':qr if name in ['guide.pdf','sactcard.pdf'] else None,'qr_expected':expected if name in ['guide.pdf','sactcard.pdf'] else None,'contact_placeholder_label':('EXAMPLE' in text) if '087' in text else None}
  if bounds:row['issues'].append(name+' has text outside page bounds')
  if name in ['guide.pdf','sactcard.pdf'] and qr != [expected]:row['issues'].append(name+' rasterized QR mismatch')
  if name!='sactcard.pdf' and not row['pdfs'][name]['anatomy_explanations_present']:row['issues'].append(name+' missing one or more authored anatomy explanations (normalized text search; review manually)')
 rows.append(row)
 print(c, '; '.join(row['issues']) or 'local content checks passed',flush=True)
(O/os.environ.get('CONSISTENCY_ASSET_OUTPUT','baseline-assets.json')).write_text(json.dumps({'scope':'Read-only assets present when run. QR decoding and local-file presence do not establish live destination availability. Geometry and text checks do not establish visual quality.','contexts':rows},indent=2,ensure_ascii=False)+'\n')
