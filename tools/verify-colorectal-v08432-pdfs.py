from pathlib import Path
import json,hashlib,unicodedata,re
import fitz,zxingcpp
from PIL import Image
R=Path(__file__).resolve().parents[1];O=R/'validation/colorectal-v08432';rows=[];qr=[]
norm=lambda s:re.sub(r'\s+','',unicodedata.normalize('NFKC',s)).replace('\u00ad','')
for c,profile in json.loads((R/'data/patient-presentation-v08431.json').read_text())['routes'].items():
 d=json.loads((R/profile).read_text());url=f'https://sactcheck.com/patient/{c}/knowledge.html'
 assert url in [x.text for x in zxingcpp.read_barcodes(Image.open(R/f'patient/{c}/oncowiki-qr.png'))];qr.append({'code':c,'asset':'oncowiki-qr.png','destination':url})
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
(O/'pdf-validation.json').write_text(json.dumps({'documents':len(rows),'pages':sum(x['pages'] for x in rows),'checks':rows},indent=2)+'\n');(O/'qr-validation.json').write_text(json.dumps(qr,indent=2)+'\n');print(len(rows),'PDFs;',len(qr),'QR checks; all anatomical text retained.')
