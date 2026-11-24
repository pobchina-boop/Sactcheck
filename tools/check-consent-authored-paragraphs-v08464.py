from pathlib import Path
import argparse,hashlib,json,re,unicodedata
import fitz
from lxml import html as LH
R=Path(__file__).resolve().parents[1]
def norm(s):return re.sub(r'\W','',unicodedata.normalize('NFKC',s).replace('\u00ad','')).lower()
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def paragraph_blocks(doc,phrase):
 remaining=norm(phrase);chunks=[]
 for number,page in enumerate(doc,1):
  for block in page.get_text('blocks'):
   value=norm(block[4]);needle=remaining[:min(80,len(remaining))];start=value.find(needle)
   if start<0:continue
   segment=value[start:]
   # Whole PDF text blocks can continue across pages with an unrelated column
   # extracted between them. Accept only exact complete prefix blocks, never
   # fuzzy similarity, omitted words, or scattered individual character hits.
   if remaining.startswith(segment):used=segment
   elif segment.startswith(remaining):used=remaining
   else:continue
   chunks.append({'page':number,'bbox':list(block[:4]),'normalized_exact_text':used,'characters':len(used)})
   remaining=remaining[len(used):]
   if not remaining:return chunks
 raise AssertionError(('Complete authored paragraph not reconstructed from exact PDF blocks',remaining[:120]))
def main():
 p=argparse.ArgumentParser();p.add_argument('--routes',required=True);p.add_argument('--stage',type=Path,required=True);p.add_argument('--report',type=Path,required=True);a=p.parse_args();S=a.stage;routes=a.routes.split(',')
 scope=json.loads((R/'validation/sarcoma-v08464/scope.json').read_text());assert len(set(routes))==len(routes) and set(routes)<=set(scope['document_routes'])
 rows=[]
 for route in routes:
  profile=R/('data/patient-knowledge-contexts/'+route+'.json' if '/' in route else 'data/patient-knowledge/'+route+'.json');d=json.loads(profile.read_text());pdf=S/route/'consent-form.pdf';doc=fitz.open(pdf);text='\n'.join(p.get_text() for p in doc);body=norm(text);generic=d['consent_generic_risks'];generic_chunks=paragraph_blocks(doc,generic)
  context_chunks=paragraph_blocks(doc,d['consent_support'])
  for agent in d['agents']:assert norm(agent['name']) in body,(route,agent['name'])
  source=R/'patient'/route/'consent-form.html';tree=LH.fromstring(source.read_bytes());modules=tree.xpath('//*[@data-consent-module]/@data-consent-module')
  assert 'chemotherapy' in modules,(route,'Missing complete generic chemotherapy module',modules)
  rows.append({'route':route,'pdf_sha256':sha(pdf),'profile_sha256':sha(profile),'source_html_sha256':sha(source),'complete_authored_generic_paragraph':True,'generic_paragraph_sha256':hashlib.sha256(generic.encode()).hexdigest(),'generic_pdf_blocks':generic_chunks,'complete_context_paragraph':True,'context_pdf_blocks':context_chunks,'agent_names_present':[a['name'] for a in d['agents']],'pages':len(doc),'generic_chemotherapy_module_present':'chemotherapy' in modules})
 out={'status':'pass','forms':len(rows),'results':rows,'verifier_sha256':sha(Path(__file__))};a.report.parent.mkdir(parents=True,exist_ok=True);a.report.write_text(json.dumps(out,indent=2)+'\n');print('Complete authored generic/context paragraphs verified in all requested actual PDFs:',len(rows))

if __name__=='__main__':main()
