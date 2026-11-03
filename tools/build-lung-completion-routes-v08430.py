"""Select a prescribed phase or indication before opening context-specific assets."""
from pathlib import Path
from html import escape as e
import json,qrcode
R=Path(__file__).resolve().parents[1]
A=json.loads((R/'data/lung-completion-v08430-authoring.json').read_text())['regimens']
assets={'portal':'','knowledge':'knowledge.html','guide':'guide.pdf','passport':'passport.pdf','sact-card':'sactcard.pdf','consent-draft':'consent-form.html','supportive-care-selector':'supportive-care.html','supportive-care':'supportive-care.pdf','longitudinal':'treatment-journey.html'}
for c,x in A.items():
 for slug,ctx in x.get('patient_contexts',{}).items():
  d=R/f'patient/{c}/{slug}';d.mkdir(parents=True,exist_ok=True);qrcode.make(f'https://sactcheck.com/patient/{c}/{slug}/').save(d/'qr.png')
 if c not in ['00214','00279','00372']:continue
 out=R/f'patient/{c}';out.mkdir(parents=True,exist_ok=True)
 choices=[(slug+'/',ctx['patient']['title'],ctx['patient']['schedule_summary']) for slug,ctx in x.get('patient_contexts',{}).items()] if c=='00372' else [('./','Lung cancer',x['patient']['schedule_summary'])]
 if c=='00279':choices=[('./','Cisplatin Day1 + IV etoposide Days1–3, every21days',x['patient']['schedule_summary'])]
 title='Choose your current prescribed phase' if c=='00372' else 'Check your treatment setting'
 note='Open the phase your oncology team has prescribed. Do not move to continuation treatment yourself: the schedule changes and requires a treatment decision.' if c=='00372' else 'This patient pack covers bevacizumab 7.5 mg/kg for lung cancer. It is used with a separately prescribed chemotherapy plan; confirm that partner plan with your team. Colorectal and other settings need their own treatment information.'
 if c=='00279':note='This pack describes the reference IV cisplatin/etoposide21-day schedule for limited-stage lung cancer. Oral etoposide, split cisplatin, carboplatin substitution or a28-day interval need personalised treatment information from your team. They are not interchangeable schedules.'
 choices_html=''.join(f'<article><h2>{e(label)}</h2><p>{e(detail)}</p><a data-choice="{e(route)}" href="{e(route)}">Open this treatment information</a></article>' for route,label,detail in choices)
 script='<script>(()=>{const assets='+json.dumps(assets)+';const key=new URLSearchParams(location.search).get("asset")||"portal";const file=assets[key]||"";document.querySelectorAll("[data-choice]").forEach(a=>{a.href=a.dataset.choice+file;if(file.endsWith(".pdf"))a.setAttribute("download",file);});})();</script>'
 html=f'<!doctype html><html lang="en-IE"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{e(title)} · SACTCheck</title><link rel="stylesheet" href="../../assets/patient/patient-pack-v08430.css"></head><body><main class="pt-shell"><p>NCCP {c} · source-specific patient information</p><h1>{e(title)}</h1><p>{e(note)}</p>{choices_html}<p>If your setting or phase is unclear, ask your oncology team.</p><p><a href="../../">SACTCheck home</a></p><footer>Feasibility build. Independent clinical and patient review pending.</footer></main>{script}</body></html>'
 (out/'scope.html').write_text(html)
 if c=='00372':
  (out/'index.html').write_text(html)
  compat=R/f'docs/patient/{c}';compat.mkdir(parents=True,exist_ok=True)
  (compat/'index.html').write_text(f'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=https://sactcheck.com/patient/{c}/"><title>Choose your prescribed phase</title></head><body><a href="https://sactcheck.com/patient/{c}/">Choose your prescribed phase</a></body></html>')
 qrcode.make(f'https://sactcheck.com/patient/{c}/scope.html').save(out/'qr.png')
print('Built explicit lung-indication and treatment-phase selectors.')
