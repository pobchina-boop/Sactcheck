#!/usr/bin/env python3
"""Render complete consent content without a fixed page limit; stage and verify before publishing."""
from pathlib import Path
import argparse,concurrent.futures,hashlib,json,re,unicodedata,logging
from lxml import html as LH
import pymupdf as fitz
from weasyprint import HTML,CSS
from weasyprint.text.fonts import FontConfiguration
R=Path(__file__).resolve().parents[1]
def compact(s):return re.sub(r'\s+','',unicodedata.normalize('NFKC',s).replace('\u00ad','')).casefold()
def render(route,stage,verify_staged=False):
 source=R/'patient'/route/'consent-form.html';tree=LH.fromstring(source.read_bytes())
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
 sha=lambda b:hashlib.sha256(b).hexdigest();dest=Path(stage)/route/'consent-form.pdf';dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data)
 return {'route':route,'pages':len(doc),'sha256':sha(data),'bytes':len(data),'source_sha256':sha(source.read_bytes()),'source_units':len(units),'all_source_units_retained':True,'a4_and_bounds':'pass','fonts':sorted({f[3] for p in doc for f in p.get_fonts()})}
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--routes');ap.add_argument('--stage',required=True);ap.add_argument('--report',required=True);ap.add_argument('--publish',action='store_true');ap.add_argument('--workers',type=int,default=3);ap.add_argument('--verify-staged',action='store_true');a=ap.parse_args()
 inventory=json.loads((R/'validation/usability-consent-v08455/consent-inventory.json').read_text());routes=a.routes.split(',') if a.routes else [r['route'] for r in inventory['routes']]
 results=[];failures=[]
 with concurrent.futures.ProcessPoolExecutor(max_workers=a.workers) as pool:
  jobs={pool.submit(render,r,a.stage,a.verify_staged):r for r in routes}
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
 report={'release':'0.84.57','status':'passed','routes':sorted(results,key=lambda r:r['route']),'forms':len(results),'published':a.publish,'independent_clinical_review':False}
 target=Path(a.report);target.parent.mkdir(parents=True,exist_ok=True);target.write_text(json.dumps(report,indent=2)+'\n')
if __name__=='__main__':main()
