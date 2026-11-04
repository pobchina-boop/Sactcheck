"""Render the audited companion documents; preserve the existing full anatomy renderer."""
from pathlib import Path
import logging,json,shutil,re,concurrent.futures
from weasyprint import HTML,CSS
R=Path(__file__).resolve().parents[1]
logging.getLogger('weasyprint').setLevel(logging.ERROR)
scope=json.loads((R/'validation/colorectal-v08432/scope.json').read_text());codes=scope['new_codes']+scope['retrospective_codes']
phase=json.loads((R/'data/phase-support-v0838.json').read_text())['regimens']
jobs=[]
for c in codes:
 for n in ['consent-form','passport','logistics','supportive-care','treatment-journey','treatment-timeline','port-pump']+['support-'+p['id'] for p in phase[c]]:
  source='supportive-care-overview' if n=='supportive-care' else n
  if (R/f'patient/{c}/{source}.html').exists():jobs.append((c,n,source))
def render(job):
 c,n,source=job;f=R/f'patient/{c}/{n}.pdf';p=R/f'patient/{c}/{source}.html'
 text=re.sub(r'<line class="(chemo|immune)"',lambda m:'<line stroke="'+('#a94022' if m[1]=='chemo' else '#682b9f')+'" stroke-width=".42"'+(' stroke-dasharray="1.4 .9"' if m[1]=='chemo' else '')+' class="'+m[1]+'"',p.read_text())
 HTML(string=text,base_url=str(p)).write_pdf(str(f),stylesheets=[] if 'class="ps-body' in text else [CSS(filename=str(R/'assets/patient/pdf-layout-v0838.css'))])
 target=R/f'docs/patient/{c}/{n}.pdf';target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(f,target)
 return {'code':c,'document':n,'bytes':f.stat().st_size}
if __name__=='__main__':
 with concurrent.futures.ProcessPoolExecutor(max_workers=3) as pool:
  rows=list(pool.map(render,jobs))
 (R/'validation/colorectal-v08432/companion-pdfs.json').write_text(json.dumps(rows,indent=2)+'\n')
 print('Rendered',len(rows),'companion PDFs',flush=True)
