"""Independent current-HTML, geometry, mirror and QR checks for v48 companions."""
from pathlib import Path
import argparse,concurrent.futures,hashlib,json,re,unicodedata
from lxml import html as LH
import pymupdf as fitz,zxingcpp
from PIL import Image
R=Path(__file__).resolve().parents[1]
SHA=lambda b:hashlib.sha256(b).hexdigest()
def norm(s):return re.sub(r'[^\w]','',unicodedata.normalize('NFKC',s).replace('\u00ad','')).casefold()
EXCLUDE={'no-print','screen-only','scv-screen-downloads','suite-toolbar','pt-toolbar','ps-toolbar','scv-document-downloads','access-links','journey-scroll-hint'}
def check(args):
 row,stage,staged=args;route,name=row['route'],row['document'];errors=[]
 for f,h in row['source_hashes'].items():
  if SHA((R/f).read_bytes())!=h:errors.append('Changed input: '+f)
 file=Path(stage)/route/(name+'.pdf');data=file.read_bytes()
 if SHA(data)!=row['sha256']:errors.append('Changed staged PDF')
 for prefix in ([] if staged else ['patient','docs/patient']):
  if (R/prefix/route/(name+'.pdf')).read_bytes()!=data:errors.append('Mirror differs: '+prefix)
 source='supportive-care-overview' if name=='supportive-care' else name
 tree=LH.fromstring((R/'patient'/route/(source+'.html')).read_text());units=[]
 for e in tree.xpath('//main//p|//main//li|//main//td|//main//th|//main//h1|//main//h2|//main//h3|//main//label'):
  chain=[e,*e.iterancestors()]
  if any(n.tag in ['nav','button','script','style'] or n.get('hidden') is not None or set(n.get('class','').split())&EXCLUDE for n in chain):continue
  if e.xpath('.//p|.//li|.//td|.//th'):continue
  value=' '.join(e.text_content().split())
  if len(norm(value))>=5:units.append(value)
 doc=fitz.open(stream=data,filetype='pdf');text='\n'.join(p.get_text() for p in doc);body=norm(text)
 missing=[s for s in dict.fromkeys(units) if norm(s) not in body]
 if missing:errors.append({'missing_current_html_units':missing})
 sparse=[]
 for n,p in enumerate(doc,1):
  words=p.get_text('words')
  if not words:errors.append(['empty page',n])
  for w in words:
   if w[0]<-1 or w[1]<-1 or w[2]>p.rect.width+1 or w[3]>p.rect.height+1:errors.append(['text outside page',n,w])
  if words and len(doc)>1 and len(words)<100 and max(w[3] for w in words)<p.rect.height*.65:sparse.append({'page':n,'words':len(words),'text':p.get_text()})
 expected=set()
 for src in tree.xpath('//img/@src'):
  if not src.endswith(('qr.png','oncowiki-qr.png')):continue
  image=(R/'patient'/route/src).resolve()
  expected.update(x.text for x in zxingcpp.read_barcodes(Image.open(image)))
 found=[]
 if expected:
  for n,p in enumerate(doc,1):
   pix=p.get_pixmap(matrix=fitz.Matrix(2,2),colorspace=fitz.csRGB)
   found.extend({'page':n,'url':x.text} for x in zxingcpp.read_barcodes(Image.frombytes('RGB',(pix.width,pix.height),pix.samples)))
  if expected-set(x['url'] for x in found):errors.append(['missing/wrong PDF QR',sorted(expected),found])
 for url in expected:
  if url not in ['https://sactcheck.com/patient/'+route+'/','https://sactcheck.com/patient/'+route+'/knowledge.html']:errors.append(['wrong regimen QR',url])
 return {'route':route,'document':name,'sha256':SHA(data),'pages':len(doc),'source_units_checked':len(set(units)),'qr_expected':sorted(expected),'qr_decoded':found,'sparse_pages_for_visual_review':sparse,'errors':errors}
def main():
 p=argparse.ArgumentParser();p.add_argument('--build-report',type=Path,required=True);p.add_argument('--stage',type=Path,required=True);p.add_argument('--report',type=Path,required=True);p.add_argument('--staged',action='store_true');a=p.parse_args();build=json.loads(a.build_report.read_text());rows=[]
 with concurrent.futures.ProcessPoolExecutor(max_workers=4) as pool:
  for row in pool.map(check,[(r,str(a.stage),a.staged) for r in build['documents']]):
   rows.append(row);print(row['route'],row['document'],len(row['errors']),flush=True)
 errors=[r for r in rows if r['errors']];report={'release':'0.84.49','status':'failed' if errors else 'staged_pass' if a.staged else 'pass','published_mirrors_verified':not a.staged and not errors,'documents':len(rows),'pages':sum(r['pages'] for r in rows),'units_checked':sum(r['source_units_checked'] for r in rows),'qr_checks':sum(len(r['qr_decoded']) for r in rows),'failed_documents':len(errors),'build_report_sha256':SHA(a.build_report.read_bytes()),'verifier_sha256':SHA(Path(__file__).read_bytes()),'results':rows,'visual_review_required':True,'excluded_print_controls':sorted(EXCLUDE)};a.report.write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n');print(json.dumps({k:v for k,v in report.items() if k!='results'}));raise SystemExit(bool(errors))
if __name__=='__main__':main()
