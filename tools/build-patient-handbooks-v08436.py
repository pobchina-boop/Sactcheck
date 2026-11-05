"""Scoped v36 PDF changes; retain untouched handbook section body streams.

Call with explicit --routes and --refresh. This builder never assumes every
colorectal asset needs re-rendering merely because a new release exists.
"""
from pathlib import Path
import argparse,hashlib,html,importlib.util,json,logging,re,shutil,tempfile
import fitz
from lxml import html as LH
R=Path(__file__).resolve().parents[1]
def module(name,path):
 spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
s=module('v36_pdf_support',R/'tools/build-colorectal-v08436-pdfs.py')
legacy=module('v35_book_support',R/'tools/build-patient-handbooks-v08435.py')
HTML,CSS=s.HTML,s.CSS
SECTIONS=[('Your three-page treatment companion','guide.pdf'),('Full treatment reference: medicines, schedule, tests, symptoms and follow-up','knowledge.pdf'),('Detailed treatment and monitoring plan','treatment-journey.pdf'),('Supportive medicines and care','supportive-care.pdf'),('Visits, access and practical arrangements','logistics.pdf'),('Your treatment passport and symptom record','passport.pdf'),('Wallet card and phone instructions','sactcard.pdf')]
HASH=lambda b:hashlib.sha256(b).hexdigest()

def printable_legacy_chronology(tree):
 """Represent exact authored day spans without an unreadable 28/42-column axis."""
 for chart in tree.xpath('//*[contains(concat(" ",normalize-space(@class)," ")," pk-chart ")]'):
  rows=chart.xpath('./*[contains(concat(" ",normalize-space(@class)," ")," pk-row ")]')
  if not rows:raise ValueError('Legacy chart has no rows')
  days=rows[0].xpath('./button[contains(concat(" ",normalize-space(@class)," ")," pk-day ")]/@data-day')
  if days!=[str(i) for i in range(1,len(days)+1)]:raise ValueError('Legacy chart day axis not contiguous')
  table=LH.Element('table',{'class':'v36-cycle-print-table'})
  caption=LH.Element('caption');caption.text=f'Days 1–{len(days)} of this cycle';table.append(caption)
  head=LH.Element('thead');tr=LH.Element('tr')
  for title in ['Treatment or check','Days in this cycle','What happens']:
   th=LH.Element('th',{'scope':'col'});th.text=title;tr.append(th)
  head.append(tr);table.append(head);body=LH.Element('tbody')
  for row in rows[1:]:
   labels=row.xpath('./*[contains(concat(" ",normalize-space(@class)," ")," pk-row-label ")]');bands=row.xpath('./*[contains(concat(" ",normalize-space(@class)," ")," pk-band ")]')
   if len(labels)!=1 or len(bands)!=1:raise ValueError('Legacy chart requires one label and timing band')
   span=re.search(r'grid-column\s*:\s*(\d+)\s*/\s*(\d+)',bands[0].get('style',''))
   if not span:raise ValueError('Legacy chart missing explicit day span')
   start,end=map(int,span.groups());first,last=start-1,end-2
   if not 1<=first<=last<=len(days):raise ValueError('Legacy chart band outside day axis')
   tr=LH.Element('tr',{'data-day-start':str(first),'data-day-end':str(last)})
   for j,value in enumerate([labels[0].text_content(),f'Day {first}' if first==last else f'Days {first}–{last}',bands[0].text_content()]):
    cell=LH.Element('th' if j==0 else 'td',{'scope':'row'} if j==0 else {});cell.text=value;tr.append(cell)
   body.append(tr)
  table.append(body);chart.getparent().replace(chart,table)
 return tree

PRINT=legacy.PRINT+"\n.v36-cycle-print-table{width:100%!important;table-layout:fixed;border-collapse:collapse;font-size:10pt}.v36-cycle-print-table th,.v36-cycle-print-table td{border:1px solid #bfd2cd;padding:2mm;vertical-align:top;overflow-wrap:anywhere}.v36-cycle-print-table th:first-child{width:25%}.v36-cycle-print-table th:nth-child(2){width:18%}.v36-cycle-print-table tr{break-inside:avoid}.v36-cycle-print-table thead{display:table-header-group}.v36-cycle-print-table caption{text-align:left;font-weight:bold;padding:2mm 0}"

def preserved_sections(path,replace):
 """Copy untouched pages; remove only isolated, known global folio streams."""
 old=fitz.open(path);toc=old.get_toc();out={};proof=[]
 if [r[1] for r in toc]!=[label for label,_ in SECTIONS]:raise ValueError((str(path),'expected seven sections'))
 for i,(_,name) in enumerate(SECTIONS):
  if name in replace:continue
  start=toc[i][2]-1;end=toc[i+1][2]-2 if i+1<len(toc) else len(old)-1
  doc=fitz.open();doc.insert_pdf(old,from_page=start,to_page=end)
  for j,page in enumerate(doc):
   expected=f'Handbook {start+j+1} / {len(old)}';before=page.get_text();streams=page.get_contents();remove=[]
   for x in streams:
    m=re.fullmatch(rb'\s*q\s+BT\s+1 0 0 1 ([\d.]+) 10 Tm\s+/helv 7 Tf \.2 \.3 \.3 RG \.2 \.3 \.3 rg \[<([\da-fA-F]+)>\]TJ\s+ET\s+Q\s*',doc.xref_stream(x))
    if m and bytes.fromhex(m[2].decode()).decode('ascii')==expected and abs(float(m[1])-(page.rect.width-85))<.001:remove.append(x)
   if len(remove)!=1:raise ValueError((str(path),start+j+1,'cannot isolate known folio'))
   doc.xref_set_key(page.xref,'Contents','['+' '.join(f'{x} 0 R' for x in streams if x not in remove)+']')
   if re.sub(r'\s+','',before.replace(expected,'',1))!=re.sub(r'\s+','',page.get_text()):raise ValueError((str(path),'body text changed'))
  out[name]=doc;proof.append({'section':name,'pages':len(doc),'non_folio_text_preserved':True,'body_streams_preserved':True})
 return out,proof

def build(route,refresh):
 logging.getLogger('weasyprint').setLevel(logging.ERROR)
 p=R/'patient'/route;profile=s.PRESENTATION[route];d=json.loads((R/profile).read_text());version=json.loads((R/'package.json').read_text())['version'];made={};inputs={R/profile}
 replace=set(refresh)
 if not (p/'handbook.pdf').exists():replace={name for _,name in SECTIONS}
 for name in ['guide.pdf','sactcard.pdf']:
  if name in refresh:
   source=p/name.replace('.pdf','.html');inputs.add(source);made[name]=HTML(filename=str(source)).write_pdf()
   expected={'guide.pdf':3,'sactcard.pdf':1}[name]
   if s.inspect(made[name],route+'/'+name)['pages']!=expected:raise ValueError((route,name,'page count'))
 if 'knowledge.pdf' in refresh:
  source=p/'knowledge.html';inputs.add(source);tree=LH.fromstring(source.read_text())
  for el in tree.xpath('//script'):el.getparent().remove(el)
  for el in tree.xpath('//details'):el.set('open','open')
  for el in tree.xpath('//*[@hidden]'):el.attrib.pop('hidden')
  legacy.printable_chronology(tree);printable_legacy_chronology(tree)
  links=[]
  for a in tree.xpath('//a[@href]'):
   url=a.get('href')
   if url.startswith('https://') and url not in links:links.append(url)
  body=tree.find('body');section=LH.Element('section',{'class':'print-sources'});heading=LH.Element('h2');heading.text='Written source addresses';section.append(heading)
  for url in links:el=LH.Element('p');el.text=url;section.append(el)
  body.append(section);printed=LH.tostring(tree,encoding='unicode',method='html')
  made['knowledge-print.html']=printed.replace('</head>','<style data-v08436-print>'+PRINT+'</style></head>').encode()
  reference=HTML(string=printed,base_url=str(p)+'/');made['knowledge.pdf']=reference.write_pdf(stylesheets=[CSS(string=PRINT)])
  bound=reference.write_pdf(stylesheets=[CSS(string=PRINT),CSS(string='@page{@bottom-center{content:none}}')])
 else:bound=None
 preserved,proof=preserved_sections(p/'handbook.pdf',replace) if (p/'handbook.pdf').exists() else ({},[])
 docs=[]
 for label,name in SECTIONS:
  if name in preserved:doc=preserved[name]
  elif name=='knowledge.pdf' and bound:doc=fitz.open(stream=bound,filetype='pdf')
  else:
   if name not in made:inputs.add(p/name)
   doc=fitz.open(stream=made[name],filetype='pdf') if name in made else fitz.open(p/name)
   if name=='supportive-care.pdf':
    for phase in s.phases(route):
     f=p/('support-'+phase['id']+'.pdf');inputs.add(f)
     with fitz.open(f) as part:doc.insert_pdf(part)
  if name=='logistics.pdf' and name in replace and (p/'port-pump.pdf').exists():
   inputs.add(p/'port-pump.pdf')
   with fitz.open(p/'port-pump.pdf') as pump:doc.insert_pdf(pump)
  docs.append((label,doc))
 entries=[];page=2
 for label,doc in docs:entries.append((label,page));page+=len(doc)
 toc='<html><head><style>@page{size:A4;margin:20mm}body{font:12pt/1.5 Arial;color:#173c42}h1{font-size:24pt}li{margin:6mm 0}.notice{border-left:4px solid #922f35;padding:3mm;background:#fff1ec;font-size:10pt}</style></head><body><p>SACTCHECK · NCCP '+d['code']+'</p><h1>My complete treatment handbook</h1><h2>'+html.escape(d['title'])+'</h2><p>All information can be read on paper. Keep this with your treatment record.</p><div class="notice">Use the urgent instructions and contact numbers in the following companion pages. Example telephone numbers must be replaced by your team before patient use. Your individual treatment plan takes precedence.</div><h2>Contents</h2><ol>'+''.join('<li>'+html.escape(label)+' — page '+str(n)+'</li>' for label,n in entries)+'</ol><p>SACTCheck v'+html.escape(version)+' · Clinical, pharmacy and patient review pending. Formal consent is supplied separately.</p></body></html>'
 out=fitz.open(stream=HTML(string=toc).write_pdf(),filetype='pdf')
 if len(out)!=1:raise ValueError((route,'contents overflow'))
 for _,doc in docs:out.insert_pdf(doc)
 out.set_toc([[1,label,n] for label,n in entries]);out.set_metadata({'title':d['title']+' — complete patient handbook','author':'SACTCheck','subject':'Full patient reference and treatment records'})
 for i,page in enumerate(out):page.insert_text((page.rect.width-85,page.rect.height-10),f'Handbook {i+1} / {len(out)}',fontsize=7,color=(.2,.3,.3))
 made['handbook.pdf']=out.tobytes(garbage=4,deflate=True)
 results=[]
 for name,data in made.items():
  if name.endswith('.pdf'):
   info=s.inspect(data,route+'/'+name);results.append({'document':name,'pages':info['pages'],'sha256':HASH(data),'before_sha256':HASH((p/name).read_bytes()) if (p/name).exists() else None})
 # Validate everything above before replacing published/compatibility copies.
 with tempfile.TemporaryDirectory(prefix='sact-v36-book-') as tmp:
  for name,data in made.items():(Path(tmp)/name).write_bytes(data)
  for name in made:
   for base in [R/'patient'/route,R/'docs/patient'/route]:base.mkdir(parents=True,exist_ok=True);shutil.copyfile(Path(tmp)/name,base/name)
 for f in [R/'assets/patient/handbook-print-v08431.css',R/'assets/patient/pdf-layout-v0838.css',Path(__file__),R/'tools/build-colorectal-v08436-pdfs.py']:
  inputs.add(f)
 # Retain every linked local stylesheet as rendering input provenance.
 for name in ['guide.html','sactcard.html','knowledge.html']:
  if (p/name).exists():
   for href in LH.fromstring((p/name).read_text()).xpath('//link[@rel="stylesheet"]/@href'):
    if not href.startswith(('https:','http:')):
     q=(p/href.split('?')[0]).resolve()
     if q.exists():inputs.add(q)
 return {'route':route,'refresh':sorted(refresh),'documents':results,'handbook_pages':len(out),'reference_pages':len(docs[1][1]),'preserved_sections':proof,'source_hashes':{str(f.relative_to(R)):HASH(f.read_bytes()) for f in sorted(inputs)}}

def main():
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--routes',required=True);parser.add_argument('--refresh',required=True,help='full, reference, rebind, or comma-separated section PDF names');parser.add_argument('--report',type=Path,default=R/'validation/colorectal-v08436/pdf-qa/handbooks.json');a=parser.parse_args()
 selected=a.routes.split(',')
 if len(selected)!=len(set(selected)) or set(selected)-set(s.ROUTES):parser.error('Explicit distinct colorectal routes required')
 aliases={'full':{n for _,n in SECTIONS},'reference':{'knowledge.pdf'},'rebind':{'supportive-care.pdf'}}
 refresh=aliases.get(a.refresh,set(a.refresh.split(',')))
 if refresh-{n for _,n in SECTIONS}:parser.error('Unknown handbook section')
 rows=[]
 for route in selected:row=build(route,refresh);rows.append(row);print(route,row['handbook_pages'],'handbook pages;',len(row['documents']),'changed PDFs',flush=True)
 previous=json.loads(a.report.read_text()) if a.report.exists() else [];rows=[r for r in previous if r['route'] not in selected]+rows;a.report.parent.mkdir(parents=True,exist_ok=True);a.report.write_text(json.dumps(rows,indent=2)+'\n')
if __name__=='__main__':main()
