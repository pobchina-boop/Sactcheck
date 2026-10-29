"""Build explicit indication selectors without overwriting existing breast assets."""
from pathlib import Path
import json,qrcode
R=Path(__file__).resolve().parents[1]
S=json.loads((R/'validation/targeted-lung-v08425/scope.json').read_text())
ASSETS={'portal':'','knowledge':'knowledge.html','guide':'guide.pdf','passport':'passport.pdf','sact-card':'sactcard.pdf','consent-draft':'consent-form.html','supportive-care-selector':'supportive-care.html','supportive-care':'supportive-care.pdf','longitudinal':'treatment-journey.html'}
from html import escape as e
for c in S['retrospective_codes']:
 d=json.loads((R/f'data/patient-knowledge-contexts/{c}/lung.json').read_text())
 breast=json.loads((R/f'data/patient-knowledge/{c}.json').read_text())
 out=R/f'patient/{c}/lung';out.mkdir(parents=True,exist_ok=True)
 qrcode.make(f'https://sactcheck.com/patient/{c}/lung/').save(out/'qr.png')
 page=f'''<!doctype html><html lang="en-IE"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Choose treatment context · NCCP {c}</title><style>body{{font:18px/1.55 system-ui,sans-serif;color:#173b48;background:#f0f6f7;margin:0}}main{{max-width:760px;margin:48px auto;padding:32px;background:white;border-radius:16px}}h1{{line-height:1.2}}a{{color:#07666c}}.choices{{display:grid;gap:18px;margin:28px 0}}.choice{{padding:22px;border:1px solid #b8d1d4;border-radius:12px}}.choice a{{font-weight:700;font-size:21px}}.note{{padding:18px;background:#f3f7f7}}@media(max-width:600px){{main{{margin:0;padding:22px}}}}</style></head><body><main><a href="../../">SACTCheck home</a><p>NCCP {c}</p><h1>Choose the treatment context</h1><p>The same medicine can be used for different cancers. Open the information that matches the treatment agreed with your team.</p><div class="choices"><article class="choice"><h2>Breast cancer</h2><a data-context="breast" href="./">{e(breast['title'])}</a><p>{e(breast.get('indication_text') or 'Breast treatment: confirm the exact indication with your team.')}</p></article><article class="choice"><h2>Lung cancer</h2><a data-context="lung" href="lung/">{e(d['title'])}</a><p>{e(d['context_label'])}</p></article></div><div class="note"><strong>Another treatment context?</strong><p>Ask your team for the matching information. These two suites do not cover every use of this medicine.</p><a href="{e(d['sources'][0]['url'])}" target="_blank" rel="noopener noreferrer">Official NCCP regimen</a></div><p>Public reference only. No patient details are requested or stored.</p><p>SACTCheck v0.84.25 · Independent clinical, pharmacy and patient review pending.</p></main><script src="../../assets/patient/context-selector-v08425.js"></script></body></html>'''
 (R/f'patient/{c}/scope.html').write_text(page+'\n')
print('Built five explicit lung/breast context selectors and lung portal QR codes.')
