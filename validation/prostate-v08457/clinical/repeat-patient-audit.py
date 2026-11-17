"""Repeat v56 patient/consent/QR audit against immutable committed bytes."""
from pathlib import Path
import json,hashlib,subprocess,re
import fitz,zxingcpp
from PIL import Image
R=Path(__file__).resolve().parents[3];BASE='90ae67a0a3f565cb57f73072137c52c4851fec5b';routes=['00101','00257','00313','00546','00203/prostate'];results=[]
def norm(s):return re.sub(r'\W','',s).lower()
for route in routes:
 row={'route':route,'errors':[],'files_checked':0,'pdfs':[]};folder=R/'patient'/route;profile=json.loads((R/('data/patient-knowledge-contexts/'+route+'.json' if '/' in route else 'data/patient-knowledge/'+route+'.json')).read_text())
 listing=subprocess.check_output(['git','ls-tree','-rz',BASE,'--','patient/'+route+'/','docs/patient/'+route+'/'],cwd=R).decode()
 for line in listing.split('\0'):
  if not line:continue
  meta,file=line.split('\t');blob=meta.split()[2];data=(R/file).read_bytes();actual=hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest();row['files_checked']+=1
  if actual!=blob:row['errors'].append('Changed committed patient asset: '+file)
 for name in ['guide','sactcard','consent-form','handbook']:
  data=(folder/(name+'.pdf')).read_bytes();doc=fitz.open(stream=data,filetype='pdf');text=norm('\n'.join(p.get_text() for p in doc));checks={'name':name,'pages':len(doc),'sha256':hashlib.sha256(data).hexdigest()}
  if data!=(R/'docs/patient'/route/(name+'.pdf')).read_bytes():row['errors'].append(name+' mirror')
  if name=='guide' and len(doc)!=3:row['errors'].append('Three-page guide contract')
  if name=='sactcard' and len(doc)!=1:row['errors'].append('Wallet sheet contract')
  if name=='consent-form':
   for a in profile['agents']:
    for risk in a['risks']:
     if norm(risk) not in text:row['errors'].append('Missing agent risk '+risk)
   core=json.loads((R/'data/consent-core-v08455.json').read_text());category=[] if route=='00257' else ['chemotherapy']
   for k in category:
    for risk in core['categories'][k]['risks']:
     if norm(risk['label']) not in text:row['errors'].append('Missing generic risk '+risk['label'])
   checks['agent_risks']=sum(len(a['risks']) for a in profile['agents']);checks['generic_categories']=category
  if name in ['guide','sactcard']:
   p=doc[-1];pix=p.get_pixmap(matrix=fitz.Matrix(2,2),colorspace=fitz.csRGB);values=[r.text for r in zxingcpp.read_barcodes(Image.frombytes('RGB',(pix.width,pix.height),pix.samples))];expected='https://sactcheck.com/patient/'+route+'/knowledge.html';checks['decoded']=values
   if expected not in values:row['errors'].append('Printed QR '+name)
  row['pdfs'].append(checks)
 results.append(row);print(route,row['files_checked'],row['errors'],flush=True)
out={'release':'0.84.57','base_commit':BASE,'status':'pass' if all(not r['errors'] for r in results) else 'failed','results':results,'independent_clinical_approval':False}
(R/'validation/prostate-v08457/clinical/repeat-patient-audit.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');raise SystemExit(out['status']!='pass')
