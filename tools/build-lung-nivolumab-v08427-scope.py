from pathlib import Path
import json,html
R=Path(__file__).resolve().parents[1]
for c in ['00483','00484']:
 d=json.loads((R/f'data/patient-knowledge/{c}.json').read_text());esc=html.escape
 lung_scope='non-small-cell lung cancer' if c in ['00483','00484'] else 'lung cancer'
 body=f'''<!doctype html><html lang="en-IE"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><title>Choose treatment context · NCCP {c} · SACTCheck</title><link rel="stylesheet" href="../../assets/patient/patient-regimen-page-v0819.css"><link rel="stylesheet" href="../../assets/patient/patient-knowledge.css"></head><body><main class="pk-shell"><section class="pk-section"><div class="pk-eyebrow">NCCP {c}</div><h1>Match the information to your treatment.</h1><p>This medicine is used for several cancers. These patient materials cover {lung_scope} only. Your team confirms the exact indication, treatment aim and schedule.</p><article class="pk-card"><h2>{esc(d['title'])}</h2><p>{esc(d.get('scope_note',d.get('indication_text',d['context_label'])))}</p><p>{esc(d['schedule_summary'])}</p><a class="pk-button" id="lung-material" href="./">Open the lung treatment information</a></article><article class="pk-card"><h2>Another cancer or combination regimen</h2><p>Use the matching regimen and indication for other cancers or combination treatment. A schedule, treatment limit or evidence result from one setting may not apply to another.</p><a href="{esc(d['sources'][0]['url'])}">Open the shared NCCP regimen</a></article><p>Source reconciled; independent clinical, pharmacy and patient/PPI review pending · SACTCheck v0.84.27</p><p><a href="../../">Return to SACTCheck</a></p></section></main><script src="../../assets/patient/lung-indication-scope-v08427.js"></script></body></html>\n'''
 (R/f'patient/{c}/scope.html').write_text(body)
print('Two shared-protocol lung scope gates refreshed.')
c='00849';idx=json.loads((R/'data/lung-nivolumab-v08427-source-index.json').read_text())
import qrcode
cards=[]
for slug in idx['patient_contexts'][c]:
 d=json.loads((R/f'data/patient-knowledge-contexts/{c}/{slug}.json').read_text())
 out=R/f'patient/{c}/{slug}';out.mkdir(parents=True,exist_ok=True)
 qrcode.make(f'https://sactcheck.com/patient/{c}/{slug}/').save(out/'qr.png')
 cards.append(f'<article class="pk-card"><h2>{esc(d["title"])}</h2><p>{esc(d["schedule_summary"])}</p><a class="pk-button" data-backbone="{slug}" href="{slug}/">Open this treatment information</a></article>')
body='''<!doctype html><html lang="en-IE"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><title>Choose your neoadjuvant treatment · NCCP 00849</title><link rel="canonical" href="https://sactcheck.com/patient/00849/"><link rel="stylesheet" href="../../assets/patient/patient-knowledge.css"></head><body><main class="pk-shell"><section class="pk-section"><div class="pk-eyebrow">NCCP 00849 · Before surgery</div><h1>Choose the chemotherapy prescribed with nivolumab.</h1><p>These are five alternative treatment plans. You receive the plan selected by your team, not all five. Check the medicine names on your prescription or ask your team before choosing.</p><p>This pathway covers up to three neoadjuvant cycles followed by surgical review. It does not prescribe nivolumab after surgery.</p>'''+''.join(cards)+'''<p>Independent clinical, pharmacy and patient/PPI review pending · v0.84.27</p><a href="../../">Return to SACTCheck</a></section></main><script src="../../assets/patient/backbone-selector-v08427.js"></script></body></html>\n'''
for name in ['index.html','scope.html']:(R/f'patient/{c}/{name}').write_text(body)
compat=R/f'docs/patient/{c}';compat.mkdir(parents=True,exist_ok=True)
(compat/'index.html').write_text('<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=https://sactcheck.com/patient/00849/"></head><body><a href="https://sactcheck.com/patient/00849/">Choose your prescribed backbone</a></body></html>\n')
print('Five alternative neoadjuvant backbone routes and QR codes generated.')
