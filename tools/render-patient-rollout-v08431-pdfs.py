from pathlib import Path
import logging,json,shutil
from weasyprint import HTML
R=Path(__file__).resolve().parents[1]
logging.getLogger('weasyprint').setLevel(logging.ERROR)
if __name__=='__main__':
 for c in json.loads((R/'validation/patient-rollout-v08431/scope.json').read_text())['codes']:
  for name in ['guide','sactcard']:
   p=R/f'patient/{c}/{name}.pdf';HTML(filename=str(p.with_suffix('.html'))).write_pdf(str(p));shutil.copyfile(p,R/f'docs/patient/{c}/{name}.pdf')
  print(c,flush=True)
