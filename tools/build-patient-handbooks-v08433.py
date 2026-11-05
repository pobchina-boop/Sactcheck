from pathlib import Path
import json,logging,shutil,concurrent.futures,html,re,copy,argparse,functools
from lxml import html as LH
from lxml.etree import SubElement
from weasyprint import HTML,CSS
import fitz
R=Path(__file__).resolve().parents[1];all_routes=json.loads((R/'data/patient-presentation-v08431.json').read_text())['routes'];routes={c:all_routes[c] for c in json.loads((R/'validation/colorectal-v08433/scope.json').read_text())['presentation_routes']};logging.getLogger('weasyprint').setLevel(logging.ERROR)
VERSION=json.loads((R/'package.json').read_text())['version']
PRINT=(R/'assets/patient/handbook-print-v08431.css').read_text()
BOUND_FOLIO=CSS(string='@page{@bottom-center{content:none}}')

def printable_chronology(tree):
 """Keep every authored chart label and band together on paper.

 CSS grid fragmentation can put a band's text on the preceding page and its
 label on the next one. A table expresses the same columns with real colspans,
 indivisible rows and a day axis repeated by the paged-media table header.
 """
 for chart in tree.xpath('//*[contains(concat(" ",normalize-space(@class)," ")," wiki-cycle-chart ")]'):
  axis=chart.xpath('./*[contains(concat(" ",normalize-space(@class)," ")," wiki-cycle-axis ")]')
  tracks=chart.xpath('./*[contains(concat(" ",normalize-space(@class)," ")," wiki-cycle-track ")]')
  if len(axis)!=1 or not tracks:raise ValueError('Chronology requires one day axis and at least one row')
  headings=list(axis[0]);days=len(headings)-1
  if days<1:raise ValueError('Chronology has no day columns')
  table=LH.Element('table',{'class':'wiki-cycle-print-table'})
  cols=SubElement(table,'colgroup');SubElement(cols,'col',{'class':'wiki-cycle-print-label-col'})
  for _ in range(days):SubElement(cols,'col')
  header=SubElement(SubElement(table,'thead'),'tr')
  for i,heading in enumerate(headings):
   cell=SubElement(header,'th',{'scope':'col','class':'wiki-cycle-print-label' if i==0 else 'wiki-cycle-print-day'})
   cell.text=heading.text
   for child in heading:cell.append(copy.deepcopy(child))
  body=SubElement(table,'tbody')
  for track in tracks:
   labels=track.xpath('./*[contains(concat(" ",normalize-space(@class)," ")," wiki-cycle-label ")]')
   bands=track.xpath('./*[contains(concat(" ",normalize-space(@class)," ")," wiki-cycle-band ")]')
   if len(labels)!=1 or len(bands)!=1:raise ValueError('Chronology row requires one label and one band')
   band=bands[0];span=re.search(r'grid-column\s*:\s*(\d+)\s*/\s*(\d+)',band.get('style',''))
   if not span:raise ValueError('Chronology band is missing its day span')
   start,end=map(int,span.groups());before=start-2;width=end-start;after=days-before-width
   if min(before,after)<0 or width<1:raise ValueError('Chronology band is outside its day axis')
   row=SubElement(body,'tr')
   if track.get('data-cycle-track'):row.set('data-cycle-track',track.get('data-cycle-track'))
   label=SubElement(row,'th',{'scope':'row','class':'wiki-cycle-print-label'})
   label_text=SubElement(label,'span',{'class':'wiki-cycle-print-label-text'});label_text.text=labels[0].text
   for child in labels[0]:label_text.append(copy.deepcopy(child))
   if before:SubElement(row,'td',{'colspan':str(before),'class':'wiki-cycle-print-empty','aria-hidden':'true'})
   cell=SubElement(row,'td',{'colspan':str(width),'class':'wiki-cycle-print-band'})
   printed_band=copy.deepcopy(band);printed_band.attrib.pop('style',None)
   if width==1 and len(band.text_content())>12:
    # A full sentence cannot be read in a single narrow day column. Keep the
    # exact instruction beside its row label and the true one-day marker below
    # the corresponding axis column; do not stretch the clinical timing band.
    instruction=SubElement(label,'span',{'class':'wiki-cycle-print-instruction'});instruction.text=band.text
    for child in band:instruction.append(copy.deepcopy(child))
    printed_band.clear(keep_tail=True);printed_band.set('class',band.get('class'));printed_band.text=f'Day {start-1}'
   cell.append(printed_band)
   if after:SubElement(row,'td',{'colspan':str(after),'class':'wiki-cycle-print-empty','aria-hidden':'true'})
  chart.getparent().replace(chart,table)
 return tree

def existing_handbook_sections(filename,sections):
 """Preserve every non-reference page and all existing support-sheet content.

 Only the previous known global page folio is removed, in its bottom-right
 margin. It occupies a dedicated content stream created by insert_text. Keep
 every body stream unchanged, including text, images and vector drawings.
 """
 old=fitz.open(filename);toc=old.get_toc();preserved={};proof=[]
 if len(toc)!=len(sections) or [row[1] for row in toc]!=[label for label,_ in sections]:
  raise ValueError(f'{filename}: existing handbook must have the seven expected sections')
 for index,(_,name) in enumerate(sections):
  if name=='knowledge.pdf':continue
  first=toc[index][2]-1;last=(toc[index+1][2]-2) if index+1<len(toc) else len(old)-1
  document=fitz.open();document.insert_pdf(old,from_page=first,to_page=last)
  for offset,page in enumerate(document):
   expected=f'Handbook {first+offset+1} / {len(old)}';before=page.get_text();matches=[]
   for block in page.get_text('dict')['blocks']:
    for line in block.get('lines',[]):
     for span in line['spans']:
      rect=fitz.Rect(span['bbox'])
      if span['text']==expected and rect.x0>=page.rect.width*.75 and rect.y0>=page.rect.height-25:
       matches.append(rect)
   if len(matches)!=1:raise ValueError(f'{filename}: cannot isolate previous folio on page {first+offset+1}')
   contents=page.get_contents();folio_streams=[]
   for xref in contents:
    stream=document.xref_stream(xref)
    match=re.fullmatch(rb'\s*q\s+BT\s+1 0 0 1 ([\d.]+) 10 Tm\s+/helv 7 Tf \.2 \.3 \.3 RG \.2 \.3 \.3 rg \[<([\da-fA-F]+)>\]TJ\s+ET\s+Q\s*',stream)
    if match and bytes.fromhex(match[2].decode()).decode('ascii')==expected and abs(float(match[1])-(page.rect.width-85))<.001:
     folio_streams.append(xref)
   if len(folio_streams)!=1:raise ValueError(f'{filename}: previous folio is not an isolated known stream on page {first+offset+1}')
   remaining=[xref for xref in contents if xref not in folio_streams]
   document.xref_set_key(page.xref,'Contents','['+' '.join(f'{xref} 0 R' for xref in remaining)+']')
   if re.sub(r'\s+','',before.replace(expected,'',1))!=re.sub(r'\s+','',page.get_text()):
    raise ValueError(f'{filename}: non-folio text changed on page {first+offset+1}')
  preserved[name]=document
  proof.append({'section':name,'pages':len(document),'non_folio_text_preserved':True})
 return preserved,proof

def build(route,reference_only=False):
 p=R/'patient'/route;d=json.loads((R/all_routes[route]).read_text())
 if not reference_only:
  for name in ['guide','sactcard']:
   HTML(filename=str(p/(name+'.html'))).write_pdf(str(p/(name+'.pdf')));shutil.copyfile(p/(name+'.pdf'),R/'docs/patient'/route/(name+'.pdf'))
 # Retain all authored reference nodes; scripts and interactive controls are not needed on paper.
 tree=LH.fromstring((p/'knowledge.html').read_text())
 for e in tree.xpath('//script'):e.getparent().remove(e)
 for e in tree.xpath('//details'):e.set('open','open')
 for e in tree.xpath('//*[@hidden]'):e.attrib.pop('hidden')
 printable_chronology(tree)
 links=[]
 for a in tree.xpath('//a[@href]'):
  u=a.get('href')
  if u.startswith('https://') and u not in links:links.append(u)
 body=tree.find('body');src=LH.Element('section',{'class':'print-sources'});title=LH.Element('h2');title.text='Written source addresses';src.append(title)
 for u in links:e=LH.Element('p');e.text=u;src.append(e)
 body.append(src)
 printed=LH.tostring(tree,encoding='unicode',method='html');(p/'knowledge-print.html').write_text(printed.replace('</head>','<link rel="stylesheet" href="'+('../'*(len(route.split('/'))+1))+'assets/patient/handbook-print-v08431.css"></head>'))
 reference=HTML(string=printed,base_url=str(p)+'/')
 reference.write_pdf(str(p/'knowledge.pdf'),stylesheets=[CSS(string=PRINT)])
 # Standalone reference numbers remain useful. Within the bound handbook the
 # global Handbook n / total folio replaces them; no clinical footer is removed.
 bound_reference=reference.write_pdf(stylesheets=[CSS(string=PRINT),BOUND_FOLIO])
 # Re-render only the two source-corrected monitoring documents.
 if not reference_only and route in ['00250','00485']:
  HTML(filename=str(p/'treatment-journey.html')).write_pdf(str(p/'treatment-journey.pdf'),stylesheets=[CSS(filename=str(R/'assets/patient/pdf-layout-v0838.css'))]);shutil.copyfile(p/'treatment-journey.pdf',R/'docs/patient'/route/'treatment-journey.pdf')
 sections=[('Your three-page treatment companion','guide.pdf'),('Full treatment reference: medicines, schedule, tests, symptoms and follow-up','knowledge.pdf'),('Detailed treatment and monitoring plan','treatment-journey.pdf'),('Supportive medicines and care','supportive-care.pdf'),('Visits, access and practical arrangements','logistics.pdf'),('Your treatment passport and symptom record','passport.pdf'),('Wallet card and phone instructions','sactcard.pdf')]
 preserved,proof=existing_handbook_sections(p/'handbook.pdf',sections) if reference_only else ({},[])
 docs=[]
 for label,name in sections:
  document=fitz.open(stream=bound_reference,filetype='pdf') if name=='knowledge.pdf' else preserved[name] if reference_only else fitz.open(p/name)
  # The scoped v0.84.33 release added these existing phase sheets. Keep the
  # established composition for other routes when refreshing their UI/PDFs.
  if not reference_only and name=='supportive-care.pdf' and route in routes:
   for phase in json.loads((R/'data/phase-support-v0838.json').read_text())['regimens'][d['code']]:
    with fitz.open(p/('support-'+phase['id']+'.pdf')) as phase_doc:document.insert_pdf(phase_doc)
  docs.append((label,document))
 page=2;entries=[]
 for label,doc in docs:entries.append((label,page));page+=len(doc)
 toc='<html><head><style>@page{size:A4;margin:20mm}body{font:12pt/1.5 Arial;color:#173c42}h1{font-size:24pt}li{margin:6mm 0}.notice{border-left:4px solid #922f35;padding:3mm;background:#fff1ec;font-size:10pt}</style></head><body><p>SACTCHECK · NCCP '+d['code']+'</p><h1>My complete treatment handbook</h1><h2>'+html.escape(d['title'])+'</h2><p>All information can be read on paper. Keep this with your treatment record.</p><div class="notice">Use the urgent instructions and contact numbers in the following companion pages. Example telephone numbers must be replaced by your team before patient use. Your individual treatment plan takes precedence.</div><h2>Contents</h2><ol>'+''.join('<li>'+html.escape(label)+' — page '+str(n)+'</li>' for label,n in entries)+'</ol><p>SACTCheck v'+html.escape(VERSION)+' · Clinical, pharmacy and patient review pending. Formal consent is supplied separately.</p></body></html>'
 out=fitz.open(stream=HTML(string=toc).write_pdf(),filetype='pdf');assert len(out)==1,(route,'contents overflow')
 for _,doc in docs:out.insert_pdf(doc)
 out.set_toc([[1,label,n] for label,n in entries]);out.set_metadata({'title':d['title']+' — complete patient handbook','author':'SACTCheck','subject':'Full patient reference and treatment records'})
 for i,page in enumerate(out):page.insert_text((page.rect.width-85,page.rect.height-10),f'Handbook {i+1} / {len(out)}',fontsize=7,color=(.2,.3,.3))
 out.save(p/'handbook.pdf',garbage=4,deflate=True)
 for name in ['knowledge.pdf','handbook.pdf']:shutil.copyfile(p/name,R/'docs/patient'/route/name)
 return {'route':route,'handbook_pages':len(out),'reference_pages':len(docs[1][1]),'preserved_sections':proof}
if __name__=='__main__':
 parser=argparse.ArgumentParser(description='Build complete patient references and handbooks for configured routes.')
 parser.add_argument('--routes',help='Comma-separated presentation routes; defaults to the release scope. Use all for all configured routes.')
 parser.add_argument('--reference-only',action='store_true',help='Refresh knowledge and handbook only; preserve guide, wallet card and monitoring PDFs.')
 parser.add_argument('--report',type=Path,help='Write build results here instead of the historical release report.')
 args=parser.parse_args()
 selected=list(routes) if not args.routes else list(all_routes) if args.routes=='all' else args.routes.split(',')
 unknown=set(selected)-all_routes.keys()
 if unknown:parser.error('Unknown presentation route(s): '+', '.join(sorted(unknown)))
 if not selected or len(selected)!=len(set(selected)):parser.error('Select at least one route, with no duplicates')
 if (args.routes or args.reference_only) and not args.report:parser.error('Scoped/reference-only refreshes require --report to preserve historical release reports')
 rows=[]
 with concurrent.futures.ProcessPoolExecutor(max_workers=3) as pool:
  for row in pool.map(functools.partial(build,reference_only=args.reference_only),selected):rows.append(row);print(row,flush=True)
 report=args.report or R/'validation/colorectal-v08433/handbooks.json'
 report.parent.mkdir(parents=True,exist_ok=True);report.write_text(json.dumps(rows,indent=2)+'\n')
