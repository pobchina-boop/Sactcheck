#!/usr/bin/env python3
"""Render complete consent content without a fixed page limit; stage and verify before publishing."""
from pathlib import Path
import argparse,concurrent.futures,hashlib,json,re,unicodedata,logging,importlib.util,importlib.metadata
from lxml import html as LH
import pymupdf as fitz
from weasyprint import HTML,CSS
from weasyprint.text.fonts import FontConfiguration
R=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('sarcoma61packs',R/'tools/render-sarcoma-packs-v08461.py');pack=importlib.util.module_from_spec(spec);spec.loader.exec_module(pack)
SHA=lambda b:hashlib.sha256(b).hexdigest()
def inputs(source):
 records=pack.source_hashes(source);records[str(Path(__file__).relative_to(R))]=SHA(Path(__file__).read_bytes());records['assets/patient/consent-core-v08455.css']=SHA((R/'assets/patient/consent-core-v08455.css').read_bytes());return records
def compact(s):return re.sub(r'\s+','',unicodedata.normalize('NFKC',s).replace('\u00ad','')).casefold()
def render(route,stage,verify_staged=False,prior=None):
 source=R/'patient'/route/'consent-form.html';initial=inputs(source);tree=LH.fromstring(source.read_bytes())
 if verify_staged:
  assert prior is not None,(route,'Prior build report required')
  assert prior['source_hashes']==initial,(route,'Consent inputs changed since render')
  assert SHA((Path(stage)/route/'consent-form.pdf').read_bytes())==prior['sha256'],(route,'Staged consent bytes changed')
 sheet=tree.xpath('//*[contains(concat(" ",normalize-space(@class)," ")," consent-sheet ")]');assert len(sheet)==1,route
 fonts=FontConfiguration();data=(Path(stage)/route/'consent-form.pdf').read_bytes() if verify_staged else HTML(filename=str(source)).write_pdf(stylesheets=[CSS(filename=str(R/'assets/patient/consent-core-v08455.css'),font_config=fonts)],font_config=fonts)
 doc=fitz.open(stream=data,filetype='pdf');expected=compact(sheet[0].text_content());text=''.join(p.get_text(clip=fitz.Rect(0,34,p.rect.width,p.rect.height-44)) for p in doc)
 # Columns can change extraction order; retain every complete source clause instead of assuming DOM order.
 units=[compact(' '.join(n.itertext())) for n in sheet[0].xpath('.//*[self::p or self::h1 or self::h2 or self::h3 or self::li or (not(*) and normalize-space()) or contains(concat(" ",normalize-space(@class)," ")," tick ")]')]
 combined=compact(text);ordered=compact(''.join(p.get_text(clip=fitz.Rect(0,34,p.rect.width,p.rect.height-44),sort=True) for p in doc));missing=[u for u in units if u and u not in combined and u not in ordered]
 assert not missing,(route,'source content missing',missing[:5])
 for p in doc:
  assert abs(p.rect.width-595.276)<1 and abs(p.rect.height-841.89)<1,(route,'A4')
  assert p.get_text().strip(),(route,'blank page')
  for w in p.get_text('words'):assert w[0]>=-1 and w[1]>=-1 and w[2]<=p.rect.width+1 and w[3]<=p.rect.height+1,(route,'clipping',w[:5])
 assert inputs(source)==initial,(route,'Consent input mutated during rendering')
 sha=lambda b:hashlib.sha256(b).hexdigest();dest=Path(stage)/route/'consent-form.pdf';dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data)
 return {'route':route,'pages':len(doc),'sha256':sha(data),'bytes':len(data),'source_sha256':sha(source.read_bytes()),'source_hashes':initial,'source_units':len(units),'all_source_units_retained':True,'a4_and_bounds':'pass','fonts':sorted({f[3] for p in doc for f in p.get_fonts()})}
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--routes',required=True);ap.add_argument('--stage',required=True);ap.add_argument('--report',required=True);ap.add_argument('--publish',action='store_true');ap.add_argument('--workers',type=int,default=3);ap.add_argument('--verify-staged',action='store_true');ap.add_argument('--build-report',type=Path);a=ap.parse_args()
 scope=json.loads((R/'validation/sarcoma-v08461/scope.json').read_text());routes=a.routes.split(',')
 if len(set(routes))!=len(routes) or not set(routes)<=set(scope['document_routes']):ap.error('Choose distinct routes within the v61 document scope')
 results=[];failures=[];prior={}
 if a.verify_staged:
  if not a.build_report:ap.error('--verify-staged requires --build-report with original source/font hashes')
  original=json.loads(a.build_report.read_text());prior={row['route']:row for row in original['routes']}
  assert set(routes)<=set(prior),('Missing prior consent routes',routes)
  for file,digest in original['font_files'].items():assert SHA(Path(file).read_bytes())==digest,('Changed consent font',file)
 font_files={p:SHA(Path(p).read_bytes()) for paths in pack.h.FONTS.values() for p in paths}
 with concurrent.futures.ProcessPoolExecutor(max_workers=a.workers) as pool:
  jobs={pool.submit(render,r,a.stage,a.verify_staged,prior.get(r)):r for r in routes}
  for future in concurrent.futures.as_completed(jobs):
   try:
    result=future.result();results.append(result);print(result['route'],result['pages'],'pages',flush=True)
   except Exception as e:
    failures.append({'route':jobs[future],'error':str(e)});print('FAILED',jobs[future],str(e),flush=True)
 if failures:
  Path(a.report).write_text(json.dumps({'status':'failed','failures':failures,'passed_forms':len(results),'routes':sorted(results,key=lambda r:r['route'])},indent=2)+'\n');raise ValueError(failures)
 # No file publication until every requested form has passed.
 if a.publish:
  for item in results:
   data=(Path(a.stage)/item['route']/'consent-form.pdf').read_bytes()
   for base in ['patient','docs/patient']:
    target=R/base/item['route']/'consent-form.pdf';target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
 report={'release':'0.84.61','status':'passed','routes':sorted(results,key=lambda r:r['route']),'forms':len(results),'font_files':font_files,'renderer':{n:importlib.metadata.version(n) for n in ['weasyprint','pymupdf','pydyf']},'published':a.publish,'independent_clinical_review':False}
 target=Path(a.report);target.parent.mkdir(parents=True,exist_ok=True);target.write_text(json.dumps(report,indent=2)+'\n')
if __name__=='__main__':main()
