from pathlib import Path
from lxml import html as H
import json,hashlib,re
R=Path.cwd();out=R/'validation/gu-v08458/pdf';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda n:json.loads((out/n).read_text());checked=[]
pack=[]
for g in ['group1','group2']:
 d=read(g+'-pack-build.json');pack += [r for r in d['results'] if r['route'] not in ['00333','00338']]
pack +=read('final-pack-refresh-build.json')['results']
for row in pack:
 for f,h in row['source_hashes'].items():assert sha(R/f)==h,('Pack input',f)
 if row['name']=='sactcard':
  for prefix in ['patient','docs/patient']:assert sha(R/prefix/row['route']/'sactcard.pdf')==row['sha256']
 checked.append({'route':row['route'],'document':row['name'],'source_hashes_current':True,'output_contract':'Final handbook build for guide; pack build for standalone card'})
for g in ['group1','group2']:
 for row in read(g+'-consents.json')['routes']:
  route=row['route'];assert sha(R/'patient'/route/'consent-form.html')==row['source_sha256']
  for pre in ['patient','docs/patient']:assert sha(R/pre/route/'consent-form.pdf')==row['sha256']
  checked.append({'route':route,'document':'consent-form','source_and_output_hashes_current':True,'source_units':row['source_units']})
 for row in read(g+'-companion-build.json')['documents']:
  for f,h in row['source_hashes'].items():assert sha(R/f)==h,('Companion input',f)
  for pre in ['patient','docs/patient']:assert sha(R/pre/row['route']/(row['document']+'.pdf'))==row['sha256'],row
  checked.append({'route':row['route'],'document':row['document'],'source_and_output_hashes_current':True})
def text(b):
 t=H.fromstring(b)
 for e in t.xpath('//script|//style'):e.drop_tree()
 value=re.sub(r'\s+',' ',t.text_content()).strip()
 for expanded,short in [('granulocyte colony-stimulating factor (white-cell growth support) (G-CSF)','G-CSF'),('electrocardiogram (ECG)','ECG'),('multigated acquisition (heart pumping) scan (MUGA)','MUGA'),('glycated haemoglobin (longer-term blood glucose) (HbA1c)','HbA1c')]:value=value.replace(expanded,short)
 return value,t
book=read('final-book-build.json');mirror=[]
for row in book['results']:
 route=row['route']
 # PDF sources are independently checked by the final-book verifier. Output
 # HTML receives the canonical publication decoration only after rendering.
 for pdf in row['documents']:
  for pre in ['patient','docs/patient']:
   p=R/pre/route/pdf['document'];assert sha(p)==pdf['sha256'];mirror.append(str(p.relative_to(R)))
 before=Path('../batch58-staged/final-books-02')/route/'knowledge-print.html';old,ta=text(before.read_bytes())
 for pre in ['patient','docs/patient']:
  p=R/pre/route/'knowledge-print.html';new,tb=text(p.read_bytes());assert old==new,('Printed narrative changed',p)
  assert sorted(ta.xpath('//a[starts-with(@href,"http")]/@href'))==sorted(tb.xpath('//a[starts-with(@href,"http")]/@href'))
  for u in tb.xpath('//link[@rel="stylesheet"]/@href|//img/@src'):
   if not u.startswith(('http','data:','//')):assert(p.parent/u.split('?')[0]).resolve().is_file(),(p,u)
  checked.append({'route':route,'document':str(p.relative_to(R)),'sha256':sha(p),'printed_narrative_retained_with_exact_acronym_expansion_normalization':True,'external_sources_unchanged':True,'local_assets_resolve':True})
report={'status':'pass','normalization':['granulocyte colony-stimulating factor (white-cell growth support) (G-CSF) = G-CSF','electrocardiogram (ECG) = ECG','multigated acquisition (heart pumping) scan (MUGA) = MUGA','glycated haemoglobin (longer-term blood glucose) (HbA1c) = HbA1c'],'checked_artifacts':len(checked),'book_pdf_mirrors':len(mirror),'book_build_sha256':sha(out/'final-book-build.json'),'pack_provenance':'Final refresh supersedes original pack reports for00333 and00338. Final handbook builder supersedes initial guide first pages; anatomy/card preservation independently checked.','rows':checked,'book_mirrors':mirror}
(out/'final-document-freshness.json').write_text(json.dumps(report,indent=2)+'\n');print({k:v for k,v in report.items() if k not in ['rows','book_mirrors']})
