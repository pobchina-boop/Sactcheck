"""Replace only the anatomy page in each colorectal guide and bound handbook.

The original guide/body page streams remain unchanged everywhere else. The
print-only CSS releases pin markers from a stacking context below connectors.
"""
from pathlib import Path
import concurrent.futures, hashlib, importlib.util, json, logging, re, shutil, tempfile
import fitz
from lxml import html as LH
R=Path(__file__).resolve().parents[1]; O=R/'validation/colorectal-v08436/pdf-qa'
spec=importlib.util.spec_from_file_location('pdf36',R/'tools/build-colorectal-v08436-pdfs.py');s=importlib.util.module_from_spec(spec);spec.loader.exec_module(s)
H=lambda b:hashlib.sha256(b).hexdigest()
N=lambda t:re.sub(r'\s+','',t)
CSS=R/'assets/patient/colorectal-anatomy-print-v08436.css'
def page_hash(doc,page):return H(b'\0'.join(doc.xref_stream(x) for x in page.get_contents()))
def patch_one(args):
 route,stage=args;logging.getLogger('weasyprint').setLevel(logging.ERROR)
 p=R/'patient'/route;source=p/'guide.html';text=source.read_text()
 assert 'colorectal-anatomy-print-v08436.css' in text,(route,'CSS not linked')
 rendered=s.HTML(filename=str(source)).write_pdf();fresh=fitz.open(stream=rendered,filetype='pdf');old=fitz.open(p/'guide.pdf')
 assert len(old)==len(fresh)==3,(route,'guide page count')
 assert N(old[1].get_text(sort=True))==N(fresh[1].get_text(sort=True)),(route,'anatomy text changed')
 assert old[1].rect==fresh[1].rect,(route,'print size changed')
 result={'route':route,'source_hashes':{str(source.relative_to(R)):H(source.read_bytes()),str(CSS.relative_to(R)):H(CSS.read_bytes()),str(Path(__file__).relative_to(R)):H(Path(__file__).read_bytes())},'documents':[],'superseded_guide_inputs':[]}
 previous=json.loads((O/'handbooks.json').read_text())
 for row in previous:
  if row['route']!=route:continue
  for name,expected in row.get('source_hashes',{}).items():
   if name!=str(source.relative_to(R)):continue
   stripped=re.sub(r'<link\b[^>]*href=["\'][^"\']*colorectal-anatomy-print-v08436\.css["\'][^>]*>','',text)
   assert H(stripped.encode())==expected,(route,'unexpected guide source changes beyond added marker stylesheet')
   result['superseded_guide_inputs'].append({'path':name,'previous_sha256':expected,'current_sha256':H(source.read_bytes()),'removed_only_marker_stylesheet_matches_previous':True})
 for name,page_index in [('guide.pdf',1),('handbook.pdf',None)]:
  before=fitz.open(p/name);toc=before.get_toc();meta=before.metadata
  if page_index is None:
   assert toc[0][1]=='Your three-page treatment companion',(route,'unexpected handbook order')
   page_index=toc[0][2]
   assert page_index==2,(route,'unexpected guide position')
   assert N(before[page_index].get_text(sort=True)).replace(N(f'Handbook {page_index+1} / {len(before)}'),'')==N(old[1].get_text(sort=True)),(route,'book guide differs')
  after=fitz.open()
  if page_index:after.insert_pdf(before,from_page=0,to_page=page_index-1)
  after.insert_pdf(fresh,from_page=1,to_page=1)
  if page_index<len(before)-1:after.insert_pdf(before,from_page=page_index+1,to_page=len(before)-1)
  if name=='handbook.pdf':
   page=after[page_index];page.insert_text((page.rect.width-85,page.rect.height-10),f'Handbook {page_index+1} / {len(after)}',fontsize=7,color=(.2,.3,.3))
  after.set_metadata(meta)
  if toc:after.set_toc(toc)
  proof=[]
  for i in range(len(before)):
   assert N(before[i].get_text(sort=True))==N(after[i].get_text(sort=True)),(route,name,i+1,'text drift')
   assert before[i].rect==after[i].rect,(route,name,i+1,'dimension drift')
   if i!=page_index:
    h=page_hash(before,before[i]);assert h==page_hash(after,after[i]),(route,name,i+1,'unaffected body stream drift')
    proof.append({'page':i+1,'stream_sha256':h})
  data=after.tobytes(garbage=4,deflate=True);s.inspect(data,route+'/'+name)
  f=Path(stage)/route/name;f.parent.mkdir(parents=True,exist_ok=True);f.write_bytes(data)
  result['documents'].append({'document':name,'pages':len(after),'replaced_page':page_index+1,'before_sha256':H((p/name).read_bytes()),'sha256':H(data),'all_page_text_and_dimensions_preserved':True,'unchanged_page_streams':proof})
 print(route,'anatomy pages patched; other streams retained',flush=True)
 return result

def main():
 with tempfile.TemporaryDirectory(prefix='sact-v36-markers-') as stage:
  with concurrent.futures.ProcessPoolExecutor(max_workers=3) as pool:rows=list(pool.map(patch_one,[(r,stage) for r in s.ROUTES]))
  assert len(rows)==41
  # No published assets are touched until the entire scoped replacement passes.
  for row in rows:
   for entry in row['documents']:
    for base in [R/'patient'/row['route'],R/'docs/patient'/row['route']]:shutil.copyfile(Path(stage)/row['route']/entry['document'],base/entry['document'])
  (O/'marker-page-patches.json').write_text(json.dumps({'routes':len(rows),'reason':'Print connector layer overpainted marker digits inside a lower stacking context.','results':rows},indent=2)+'\n')
if __name__=='__main__':main()
