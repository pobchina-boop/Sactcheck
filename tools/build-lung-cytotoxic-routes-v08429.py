"""Generate explicit schedule and indication guards; do not guess a patient's plan."""
from pathlib import Path
from html import escape as e
import json,qrcode
R=Path(__file__).resolve().parents[1]
A=json.loads((R/'data/lung-cytotoxic-v08429-authoring.json').read_text())['regimens']
assets={'portal':'','knowledge':'knowledge.html','guide':'guide.pdf','passport':'passport.pdf','sact-card':'sactcard.pdf','consent-draft':'consent-form.html','supportive-care-selector':'supportive-care.html','supportive-care':'supportive-care.pdf','longitudinal':'treatment-journey.html'}
for c,x in A.items():
 for slug,ctx in x.get('patient_contexts',{}).items():
  d=R/f'patient/{c}/{slug}';d.mkdir(parents=True,exist_ok=True);qrcode.make(f'https://sactcheck.com/patient/{c}/{slug}/').save(d/'qr.png')
 if c not in ['00284','00311','00388']:continue
 out=R/f'patient/{c}';out.mkdir(parents=True,exist_ok=True)
 choices=[(slug+'/',ctx['patient']['title'],ctx['patient']['schedule_summary']) for slug,ctx in x.get('patient_contexts',{}).items()] if c=='00388' else [('./','Lung cancer',x['patient']['schedule_summary'])]
 title='Choose your prescribed oral etoposide schedule' if c=='00388' else 'Check your treatment setting'
 note='These are alternative schedules, not consecutive phases. Do not choose by convenience: confirm the exact prescribed schedule with your team.' if c=='00388' else 'This patient pack describes lung treatment only. The pancreatic adjuvant six-cycle plan is different and is not covered here.'
 if c=='00311':note='This pack describes relapsed small-cell lung cancer. Ovarian, fallopian tube and peritoneal cancer indications require their own treatment discussion.'
 choices_html=''.join(f'<article><h2>{e(label)}</h2><p>{e(detail)}</p><a data-choice="{e(route)}" href="{e(route)}">Open this treatment information</a></article>' for route,label,detail in choices)
 script='<script>(()=>{const assets='+json.dumps(assets)+';const key=new URLSearchParams(location.search).get("asset")||"portal";const file=assets[key]||"";document.querySelectorAll("[data-choice]").forEach(a=>{a.href=a.dataset.choice+file;if(file.endsWith(".pdf"))a.setAttribute("download",file);});})();</script>'
 html=f'<!doctype html><html lang="en-IE"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{e(title)} · SACTCheck</title><link rel="stylesheet" href="../../assets/patient/patient-pack-v08429.css"></head><body><main class="pt-shell"><p>NCCP {c} · source-specific patient information</p><h1>{e(title)}</h1><p>{e(note)}</p>{choices_html}<p>For an uncertain schedule or another treatment setting, ask your oncology team.</p><p><a href="../../">SACTCheck home</a></p><footer>Feasibility build. Independent clinical and patient review pending.</footer></main>{script}</body></html>'
 (out/'scope.html').write_text(html)
 if c=='00388':
  (out/'index.html').write_text(html)
  compat=R/f'docs/patient/{c}';compat.mkdir(parents=True,exist_ok=True)
  (compat/'index.html').write_text(f'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=https://sactcheck.com/patient/{c}/"><title>Choose your schedule</title></head><body><a href="https://sactcheck.com/patient/{c}/">Choose your prescribed schedule</a></body></html>')
 qrcode.make(f'https://sactcheck.com/patient/{c}/scope.html').save(out/'qr.png')
print('Updated schedule-specific QR destinations and guarded selectors.')
