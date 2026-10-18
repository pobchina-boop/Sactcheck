"""Render existing HTML to PDF with WeasyPrint. No browser or preview server required."""
from pathlib import Path
import logging,json,shutil,re,sys
from weasyprint import HTML,CSS
R=Path(__file__).resolve().parents[1]
logging.getLogger('weasyprint').setLevel(logging.ERROR)
codes=json.loads((R/'data/breast-family-v0840-source-index.json').read_text())['codes']
phase=json.loads((R/'data/phase-support-v0838.json').read_text())['regimens']
styles=[CSS(filename=str(R/'assets/patient/pdf-layout-v0838.css'))]
jobs=[(c,n,'supportive-care-overview' if n=='supportive-care' else n) for c in codes for n in ['guide','consent-form','passport','sactcard','logistics','supportive-care','treatment-journey']]
jobs += [(c,'support-'+p['id'],'support-'+p['id']) for c in codes for p in phase[c]]
if __name__ == '__main__':
 for c,n,source in jobs:
  if len(sys.argv)>1 and c+'/'+n not in sys.argv[1:]:continue
  f=R/f'patient/{c}/{n}.pdf'
  source_path=R/f'patient/{c}/{source}.html'
  # WeasyPrint renders SVG separately; keep connector presentation explicit inside SVG.
  html=re.sub(r'<line class="(chemo|immune)"',lambda m:'<line stroke="'+('#a94022' if m[1]=='chemo' else '#682b9f')+'" stroke-width=".42"'+(' stroke-dasharray="1.4 .9"' if m[1]=='chemo' else '')+' class="'+m[1]+'"',source_path.read_text())
  HTML(string=html,base_url=str(source_path)).write_pdf(str(f),stylesheets=styles)
  target=R/f'docs/patient/{c}/{n}.pdf';target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(f,target)
  print(c,n,f.stat().st_size,flush=True)
