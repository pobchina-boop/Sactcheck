"""Verify changed retrospective PDFs, retained guide/card bytes and paper text."""
from pathlib import Path
import json,re,hashlib,subprocess,unicodedata
import fitz,zxingcpp
from PIL import Image
R=Path(__file__).resolve().parents[1];O=R/'validation/skin-melanoma-v08440';BASE=json.loads((O/'scope.json').read_text())['verified_remote_main'];baseline=json.loads((O/'baseline-v08439-file-hashes.json').read_text());rows=[];issues=[]
sha=lambda b:hashlib.sha256(b).hexdigest()
norm=lambda t:re.sub(r'\W','',unicodedata.normalize('NFKC',t)).lower()
for route in ['00455','00558','00483','00484','00551','00455/colorectal','00558/colorectal']:
 p=R/'patient'/route;row={'route':route,'retained':[],'changed_pdfs':[],'qr_checks':[]}
 for name in ['guide.pdf','sactcard.pdf','consent-form.pdf','logistics.pdf','treatment-journey.pdf']:
  rel='patient/'+route+'/'+name;assert sha((R/rel).read_bytes())==baseline[rel],rel+' must remain byte-identical';row['retained'].append(rel)
 for f in sorted(p.glob('*.pdf')):
  rel=str(f.relative_to(R));b=f.read_bytes();assert (R/'docs'/rel).read_bytes()==b,rel+' mirror'
  if sha(b)==baseline.get(rel):continue
  d=fitz.open(f)
  for i,pg in enumerate(d):
   assert pg.get_text().strip(),(rel,i,'empty')
   assert not re.search(r'\bundefined\b|\[object Object\]|\bNaN\b',pg.get_text()),(rel,i,'missing template text')
   for block in pg.get_text('blocks'):assert block[0]>=-1 and block[1]>=-1 and block[2]<=pg.rect.width+1 and block[3]<=pg.rect.height+1,(rel,i,'bounds')
  row['changed_pdfs'].append({'file':rel,'pages':len(d),'sha256':sha(b)})
 for f in p.glob('*qr*.png'):
  decoded=[x.text for x in zxingcpp.read_barcodes(Image.open(f))];assert decoded,(route,f.name,'no QR')
  assert all(u in [f'https://sactcheck.com/patient/{route}/',f'https://sactcheck.com/patient/{route}/knowledge.html',f'https://sactcheck.com/patient/{route}/scope.html'] for u in decoded),(route,f.name,decoded)
  row['qr_checks'].append({'file':f.name,'decoded':decoded})
 for name in ['guide','sactcard','passport']:
  decoded=[]
  for pg in fitz.open(p/(name+'.pdf')):
   pix=pg.get_pixmap(matrix=fitz.Matrix(2,2));decoded += [x.text for x in zxingcpp.read_barcodes(Image.frombytes('RGB',[pix.width,pix.height],pix.samples))]
  assert decoded,(route,name,'PDF QR missing')
  assert all(u in [f'https://sactcheck.com/patient/{route}/',f'https://sactcheck.com/patient/{route}/knowledge.html',f'https://sactcheck.com/patient/{route}/scope.html'] for u in decoded),(route,name,decoded)
  row['qr_checks'].append({'file':name+'.pdf','decoded':sorted(set(decoded))})
 book=fitz.open(p/'handbook.pdf');toc=book.get_toc();assert len(toc)==7,(route,'complete handbook sections')
 text=norm(''.join(pg.get_text() for pg in book))
 for n in ['guide','sactcard','passport','supportive-care','logistics','treatment-journey']:
  for pg in fitz.open(p/(n+'.pdf')):assert norm(pg.get_text()) in text,(route,n,'missing handbook page')
 rows.append(row)
for change in json.loads((O/'retrospective-patient-text-changes.json').read_text()):
 f=R/change['file'];assert sha(f.read_bytes())==change['after_sha256'],str(f)+' authored change hash'
 before=subprocess.check_output(['git','show',BASE+':'+change['file']],cwd=R)
 assert sha(before)==change['before_sha256'],str(f)+' provenance'
 if f.name in ['knowledge.html','passport.html']:
  pdf=fitz.open(f.with_suffix('.pdf'));text=norm(''.join(pg.get_text() for pg in pdf));assert norm(change['added_text']) in text,(str(f),'new explanation missing in PDF')
report={'release':'0.84.40','routes':rows,'changed_pdf_count':sum(len(r['changed_pdfs']) for r in rows),'qr_checks':sum(len(r['qr_checks']) for r in rows),'unchanged_documents':sum(len(r['retained']) for r in rows),'findings':issues,'limitations':['Existing retrospective guides and wallet cards retain their historical templates; no new melanoma-context completion is claimed.','Canonical URL decoding is verified; newly unpublished routes are not claimed live.']}
(O/'pdf-qa/retrospective-audit.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items() if k!='routes'}))
