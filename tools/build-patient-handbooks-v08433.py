from pathlib import Path
import json,logging,shutil,concurrent.futures,html
from lxml import html as LH
from weasyprint import HTML,CSS
import fitz
R=Path(__file__).resolve().parents[1];all_routes=json.loads((R/'data/patient-presentation-v08431.json').read_text())['routes'];routes={c:all_routes[c] for c in json.loads((R/'validation/colorectal-v08433/scope.json').read_text())['presentation_routes']};logging.getLogger('weasyprint').setLevel(logging.ERROR)
PRINT='''@page{size:A4;margin:16mm 14mm 18mm;@bottom-center{content:counter(page);font:9pt Arial;color:#345}}*{box-sizing:border-box}body{font:11pt/1.4 Arial;color:#173c42;background:white}header,main,section,article,aside{max-width:100%!important;width:auto!important}h1{font-size:22pt}h2{font-size:16pt;break-after:avoid}h3{font-size:12pt;break-after:avoid}p,li{font-size:11pt}nav,.pk-top,.pk-skip,.pk-help-link,.pk-controls,button,input,select,textarea{display:none!important}.pk-contents nav{display:block!important}.pk-hero{padding:8mm 0!important;background:white!important;color:#173c42!important}.pk-shell,.pk-section{padding:0!important;margin:4mm 0!important}.pk-grid,.pk-two,.pk-phases{display:block!important}.pk-card{break-inside:avoid;margin:3mm 0!important;padding:3mm!important}.pk-section{break-inside:auto!important}details,details>*,[hidden],.pk-day,.pk-day-panel{display:block!important;visibility:visible!important}summary{font-weight:bold}.pk-cycle [hidden]{display:block!important}svg{max-width:100%;max-height:65mm}img{max-width:100%}table{width:100%;table-layout:fixed;border-collapse:collapse;font-size:9pt}th,td{padding:1.5mm;border:1px solid #ccd;overflow-wrap:anywhere;vertical-align:top}tr{break-inside:avoid}.journey-scroll{overflow:visible!important}.pk-note.urgent{border-left:1mm solid #922f35;padding:3mm;background:#fff1ec}a{color:#075f69;overflow-wrap:anywhere}.print-sources{font-size:9pt;overflow-wrap:anywhere}.pk-contents,.pk-day-detail,.access-links,.journey-scroll-hint{display:block!important}'''
def build(route):
 p=R/'patient'/route;d=json.loads((R/routes[route]).read_text())
 for name in ['guide','sactcard']:
  HTML(filename=str(p/(name+'.html'))).write_pdf(str(p/(name+'.pdf')));shutil.copyfile(p/(name+'.pdf'),R/'docs/patient'/route/(name+'.pdf'))
 # Retain all authored reference nodes; scripts and interactive controls are not needed on paper.
 tree=LH.fromstring((p/'knowledge.html').read_text())
 for e in tree.xpath('//script'):e.getparent().remove(e)
 for e in tree.xpath('//details'):e.set('open','open')
 for e in tree.xpath('//*[@hidden]'):e.attrib.pop('hidden')
 links=[]
 for a in tree.xpath('//a[@href]'):
  u=a.get('href')
  if u.startswith('https://') and u not in links:links.append(u)
 body=tree.find('body');src=LH.Element('section',{'class':'print-sources'});title=LH.Element('h2');title.text='Written source addresses';src.append(title)
 for u in links:e=LH.Element('p');e.text=u;src.append(e)
 body.append(src)
 printed=LH.tostring(tree,encoding='unicode',method='html');(p/'knowledge-print.html').write_text(printed.replace('</head>','<link rel="stylesheet" href="'+('../'*(len(route.split('/'))+1))+'assets/patient/handbook-print-v08431.css"></head>'))
 HTML(string=printed,base_url=str(p)+'/').write_pdf(str(p/'knowledge.pdf'),stylesheets=[CSS(string=PRINT)])
 # Re-render only the two source-corrected monitoring documents.
 if route in ['00250','00485']:
  HTML(filename=str(p/'treatment-journey.html')).write_pdf(str(p/'treatment-journey.pdf'),stylesheets=[CSS(filename=str(R/'assets/patient/pdf-layout-v0838.css'))]);shutil.copyfile(p/'treatment-journey.pdf',R/'docs/patient'/route/'treatment-journey.pdf')
 sections=[('Your three-page treatment companion','guide.pdf'),('Full treatment reference: medicines, schedule, tests, symptoms and follow-up','knowledge.pdf'),('Detailed treatment and monitoring plan','treatment-journey.pdf'),('Supportive medicines and care','supportive-care.pdf'),('Visits, access and practical arrangements','logistics.pdf'),('Your treatment passport and symptom record','passport.pdf'),('Wallet card and phone instructions','sactcard.pdf')]
 docs=[]
 for label,name in sections:
  document=fitz.open(p/name)
  if name=='supportive-care.pdf':
   for phase in json.loads((R/'data/phase-support-v0838.json').read_text())['regimens'][d['code']]:
    with fitz.open(p/('support-'+phase['id']+'.pdf')) as phase_doc:document.insert_pdf(phase_doc)
  docs.append((label,document))
 page=2;entries=[]
 for label,doc in docs:entries.append((label,page));page+=len(doc)
 toc='<html><head><style>@page{size:A4;margin:20mm}body{font:12pt/1.5 Arial;color:#173c42}h1{font-size:24pt}li{margin:6mm 0}.notice{border-left:4px solid #922f35;padding:3mm;background:#fff1ec;font-size:10pt}</style></head><body><p>SACTCHECK · NCCP '+d['code']+'</p><h1>My complete treatment handbook</h1><h2>'+html.escape(d['title'])+'</h2><p>All information can be read on paper. Keep this with your treatment record.</p><div class="notice">Use the urgent instructions and contact numbers in the following companion pages. Example telephone numbers must be replaced by your team before patient use. Your individual treatment plan takes precedence.</div><h2>Contents</h2><ol>'+''.join('<li>'+html.escape(label)+' — page '+str(n)+'</li>' for label,n in entries)+'</ol><p>SACTCheck v0.84.33 · Clinical, pharmacy and patient review pending. Formal consent is supplied separately.</p></body></html>'
 out=fitz.open(stream=HTML(string=toc).write_pdf(),filetype='pdf');assert len(out)==1,(route,'contents overflow')
 for _,doc in docs:out.insert_pdf(doc)
 out.set_toc([[1,label,n] for label,n in entries]);out.set_metadata({'title':d['title']+' — complete patient handbook','author':'SACTCheck','subject':'Full patient reference and treatment records'})
 for i,page in enumerate(out):page.insert_text((page.rect.width-85,page.rect.height-10),f'Handbook {i+1} / {len(out)}',fontsize=7,color=(.2,.3,.3))
 out.save(p/'handbook.pdf',garbage=4,deflate=True)
 for name in ['knowledge.pdf','handbook.pdf']:shutil.copyfile(p/name,R/'docs/patient'/route/name)
 return {'route':route,'handbook_pages':len(out),'reference_pages':len(docs[1][1])}
if __name__=='__main__':
 # Shared print stylesheet is unchanged by this scoped release.
 rows=[]
 with concurrent.futures.ProcessPoolExecutor(max_workers=3) as pool:
  for row in pool.map(build,routes):rows.append(row);print(row,flush=True)
 (R/'validation/colorectal-v08433/handbooks.json').write_text(json.dumps(rows,indent=2)+'\n')
