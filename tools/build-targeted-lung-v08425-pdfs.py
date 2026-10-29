"""Render the v25 HTML bundles, including independent lung context routes."""
from pathlib import Path
import logging,json,shutil,re,sys
from weasyprint import HTML,CSS
R=Path(__file__).resolve().parents[1]
logging.getLogger('weasyprint').setLevel(logging.ERROR)
idx=json.loads((R/'data/targeted-lung-v08425-source-index.json').read_text())
standard=json.loads((R/'data/phase-support-v0838.json').read_text())['regimens']
contexts=json.loads((R/'data/phase-support-contexts-v08425.json').read_text())['regimens']
styles=[CSS(filename=str(R/'assets/patient/pdf-layout-v0838.css'))]
jobs=[]
for code in idx['codes']:
 retro=code in idx['retrospective_codes'];route=code+('/lung' if retro else '')
 plans=contexts[code]['lung'] if retro else standard[code]
 jobs.extend((route,n,'supportive-care-overview' if n=='supportive-care' else n) for n in ['guide','consent-form','passport','sactcard','logistics','supportive-care','treatment-journey'])
 jobs.extend((route,'support-'+p['id'],'support-'+p['id']) for p in plans)
 if (R/f'patient/{route}/treatment-timeline.html').exists():jobs.append((route,'treatment-timeline','treatment-timeline'))
if __name__=='__main__':
 for route,name,source in jobs:
  if len(sys.argv)>1 and route+'/'+name not in sys.argv[1:]:continue
  output=R/f'patient/{route}/{name}.pdf';source_path=R/f'patient/{route}/{source}.html'
  html=re.sub(r'<line class="(chemo|immune)"',lambda m:'<line stroke="'+('#a94022' if m[1]=='chemo' else '#682b9f')+'" stroke-width=".42"'+(' stroke-dasharray="1.4 .9"' if m[1]=='chemo' else '')+' class="'+m[1]+'"',source_path.read_text())
  HTML(string=html,base_url=str(source_path)).write_pdf(str(output),stylesheets=styles)
  target=R/f'docs/patient/{route}/{name}.pdf';target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(output,target)
  print(route,name,output.stat().st_size,flush=True)
