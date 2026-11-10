"""Render audited v47 patient packs with exact fonts; stage before publishing."""
from pathlib import Path
import argparse, concurrent.futures, hashlib, importlib.util, json, logging, re
import fitz
from lxml import html as LH
import copy
from urllib.parse import urlsplit
R=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('pdf43',R/'tools/build-patient-documents-v08443.py');h=importlib.util.module_from_spec(spec);spec.loader.exec_module(h)
S=json.loads((R/'validation/head-neck-v08447/scope.json').read_text())
def source_hashes(source):
 tree=LH.fromstring(source.read_text());inputs={source,Path(__file__)}
 pending=[]
 for href in tree.xpath('//link[@rel="stylesheet"]/@href | //img/@src'):
  if href.startswith(('data:','https:','http:','//')):continue
  file=(source.parent/urlsplit(href).path).resolve()
  if file.is_file():inputs.add(file);pending.append(file)
 while pending:
  file=pending.pop()
  if file.suffix!='.css':continue
  for target in re.findall(r"@import\s+(?:url\()?['\"]([^'\"]+)['\"]",file.read_text()):
   if target.startswith(('https:','http:','data:','//')):continue
   linked=(file.parent/urlsplit(target).path).resolve()
   if linked.is_file() and linked not in inputs:inputs.add(linked);pending.append(linked)
 return {str(file.relative_to(R)):h.SHA(file.read_bytes()) for file in sorted(inputs)}
def render(job):
 route,name,stage=job;source=R/'patient'/route/(name+'.html')
 text=source.read_text()
 text=re.sub(r'<line class="(chemo|immune)"',lambda m:'<line stroke="'+('#a94022' if m[1]=='chemo' else '#682b9f')+'" stroke-width=".42"'+(' stroke-dasharray="1.4 .9"' if m[1]=='chemo' else '')+' class="'+m[1]+'"',text)
 logging.getLogger('weasyprint').setLevel(logging.ERROR)
 if name=='guide':
  tree=LH.fromstring(text);sections=tree.xpath('//*[contains(concat(" ",normalize-space(@class)," ")," pt-page ")]');assert len(sections)==3,(route,'three authored pages required')
  combined=fitz.open();profiles=[]
  for number,section in enumerate(sections):
   isolated=copy.deepcopy(tree);body=isolated.find('body')
   for child in list(body):body.remove(child)
   main=LH.Element('main',{'class':'pt-sheet'});main.append(copy.deepcopy(section));body.append(main)
   profile='Nimbus' if number==0 else 'DejaVu';profiles.append(profile)
   page=h.render(LH.tostring(isolated,encoding='unicode'),source.parent,profile=profile)
   document=fitz.open(stream=page,filetype='pdf')
   if len(document)!=1:raise ValueError((route,'Authored page overflow',number+1,len(document)))
   combined.insert_pdf(document)
  data=combined.tobytes(garbage=4,deflate=True)
 else:
  profiles=['DejaVu'];data=h.render(text,source.parent,profile='DejaVu')
 info=h.inspect_pdf(data,route+'/'+name)
 target=Path(stage)/route/(name+'.pdf');target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
 return {'route':route,'name':name,'source_sha256':h.SHA(source.read_bytes()),'source_hashes':source_hashes(source),'font_profile_by_page':profiles,**info}
def main():
 a=argparse.ArgumentParser();a.add_argument('--routes',required=True);a.add_argument('--stage',type=Path,required=True);a.add_argument('--report',type=Path,required=True);a.add_argument('--workers',type=int,default=3);args=a.parse_args()
 routes=args.routes.split(',');assert set(routes)<=set(S['clinical_routes'])
 rows=[];errors=[]
 with concurrent.futures.ProcessPoolExecutor(max_workers=args.workers) as pool:
  jobs={pool.submit(render,(r,n,str(args.stage))):(r,n) for r in routes for n in ['guide','sactcard']}
  for future in concurrent.futures.as_completed(jobs):
   try:
    row=future.result();rows.append(row);print(row['route'],row['name'],row['pages'],flush=True)
   except Exception as error:errors.append({'route':jobs[future][0],'document':jobs[future][1],'error':str(error)});print(errors[-1],flush=True)
 args.report.parent.mkdir(parents=True,exist_ok=True);args.report.write_text(json.dumps({'status':'rendered_requires_visual_and_content_verification' if not errors else 'failed','results':rows,'errors':errors,'font_files':{p:h.SHA(Path(p).read_bytes()) for values in h.FONTS.values() for p in values}},indent=2)+'\n')
 if errors:raise SystemExit(1)
if __name__=='__main__':main()
