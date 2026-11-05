"""Integrate the four authored NET suites without rewriting earlier patient bundles."""
from pathlib import Path
import json, html, qrcode
R=Path(__file__).resolve().parents[1]; V='0.84.37'; DATE='2026-11-05'
def read(f):return json.loads((R/f).read_text())
def save(f,d):
 p=R/f;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
scope=read('validation/neuroendocrine-v08437/scope.json')
presentation=read('data/patient-presentation-v08431.json');journeys=read('data/breast-treatment-journeys-v0837.json')
af=R/'js/patient-anatomy-data-v08431.js';anatomy=json.loads(af.read_text().split('=',1)[1].rstrip(';\n'))
for route in scope['presentation_routes']:
 code,*contexts=route.split('/');context=contexts[0] if contexts else ''
 profile='data/patient-knowledge-contexts/'+route+'.json' if context else 'data/patient-knowledge/'+code+'.json'
 d=read(profile);assert d['suite_release']==V and d['patient_summary']['template_version']==V,route
 presentation['routes'][route]=profile
 if not context:presentation['legacy_layout_fields'].pop(code,None)
 ms=d['monitoring_schedule'];key=code+(':'+context if context else '')
 journeys[key]=dict(code=code,title=d['title']+': treatment and checks',release=V,checked=DATE,status=d['review_status'],schedule_type='relative-educational',has_patient_dates=False,setting=d['context_label'],summary=d['schedule_summary'],stages=ms['columns'],lanes=[dict(label=row['label'],kind='monitoring',cells=row['cells'],source_ids=[code],note=ms.get('note','')) for row in ms['rows']],milestones=[dict(title=p['label'],when=p.get('short','According to the treatment plan'),why=d['purpose'],clinical=p['detail'],action='Confirm the current prescription, tests and support medicines.',source_ids=[code]) for p in d['phases']],clinical_notes=[ms.get('note','')],sources=[dict(s,id=code if s['id']=='nccp' else s['id']) for s in d['sources']])
 if not context:anatomy[code]=dict(code=code,anatomy=d['anatomy'])
 for base in ['patient','docs/patient']:(R/base/route).mkdir(parents=True,exist_ok=True)
 for name,suffix in [('qr.png',''),('oncowiki-qr.png','knowledge.html')]:qrcode.make('https://sactcheck.com/patient/'+route+'/'+suffix).save(R/'patient'/route/name)
 if context:
  selector=dict(d,patient_context_selector=True,context_label='Choose the treatment context; NET information must not be used for kidney cancer')
  save('data/patient-knowledge/'+code+'.json',selector)
save('data/patient-presentation-v08431.json',presentation);save('data/breast-treatment-journeys-v0837.json',journeys)
af.write_text('globalThis.SACTCheckAnatomyData='+json.dumps(anatomy,ensure_ascii=False,separators=(',',':'))+';\n')
p=R/'js/regimen-knowledge-base.js';s=p.read_text();needle='"data/regimen-knowledge-base-v08436-addendum.json"'
if 'regimen-knowledge-base-v08437-addendum.json' not in s:
 assert needle in s;s=s.replace(needle,needle+', "data/regimen-knowledge-base-v08437-addendum.json"');p.write_text(s)
support=read('data/phase-support-v0838.json');support['regimens'].update(read('validation/neuroendocrine-v08437/patient-content/phase-support-updates.json')['regimens']);save('data/phase-support-v0838.json',support)
contexts=read('validation/neuroendocrine-v08437/patient-content/phase-support-contexts-v08437.json');save('data/phase-support-contexts-v08437.json',contexts)
page='''<!doctype html><html lang="en-IE"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Confirm treatment context · Everolimus</title><style>body{font:18px/1.6 system-ui;color:#173b48;background:#f0f6f7;margin:0}main{max-width:760px;margin:auto;padding:24px}article{background:white;padding:24px;margin:18px 0;border-radius:12px}a{color:#07666c}</style></head><body><main><a href="../../">SACTCheck home</a><h1>Confirm your everolimus treatment context</h1><p>NCCP 00320 includes different cancers. Use information that matches the diagnosis and plan agreed with your team.</p><article><h2>Neuroendocrine tumours</h2><p>This pack covers the pancreatic NET and non-functional gastrointestinal NET indications in the NCCP protocol.</p><a data-context="neuroendocrine" data-route="neuroendocrine/" href="neuroendocrine/">Open NET patient information</a></article><article><h2>Kidney cancer or another treatment setting</h2><p>This NET pack does not describe your cancer setting. Ask your treating team for matching patient information and the current consent discussion. The shared clinical protocol retains its kidney-cancer indication.</p></article><p>Public reference; independent clinical review pending.</p></main><script src="../../assets/patient/context-selector-v08425.js"></script></body></html>'''
for name in ['scope.html','index.html']:(R/'patient/00320'/name).write_text(page)
print('Integrated four NET patient routes, support, knowledge, journeys and exact QR assets.')

# The legacy docs root must retain the explicit indication selector too.
for name,target in [('index.html',''),('scope.html','scope.html')]:
 url='../../../patient/00320/'+target
 canonical='https://sactcheck.com/patient/00320/'+target
 (R/'docs/patient/00320'/name).write_text(f'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url={url}"><link rel="canonical" href="{canonical}"><title>Confirm everolimus treatment context</title></head><body><a href="{url}">Confirm your treatment context</a></body></html>')
