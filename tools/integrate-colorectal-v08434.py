"""Integrate authored context assets; completion flags are finalized only after QA."""
from pathlib import Path
import json, re, copy, qrcode
R=Path(__file__).resolve().parents[1];V='0.84.34';DATE='2026-11-05'
def read(f):return json.loads((R/f).read_text())
def save(f,d):
 p=R/f;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
scope=read('validation/colorectal-v08434/scope.json');presentation=read('data/patient-presentation-v08431.json');journeys=read('data/breast-treatment-journeys-v0837.json')
anatomy_file=R/'js/patient-anatomy-data-v08431.js';anatomy=json.loads(anatomy_file.read_text().split('=',1)[1].rstrip(';\n'))
for route in scope['presentation_routes']:
 code=route.split('/')[0];context=route.split('/')[1] if '/' in route else ''
 profile=f'data/patient-knowledge-contexts/{route}.json' if context else f'data/patient-knowledge/{code}.json';d=read(profile)
 assert d['patient_summary']['template_version']==V,route
 presentation['routes'][route]=profile
 if not context:presentation['legacy_layout_fields'].pop(code,None)
 ms=d['monitoring_schedule'];journey_key=code+(':'+context if context else '')
 journeys[journey_key]=dict(code=code,title=d['title']+': treatment and checks',release=V,checked=DATE,status=d['review_status'],schedule_type='relative-educational',has_patient_dates=False,setting=d['context_label'],summary=d['schedule_summary'],stages=ms['columns'],lanes=[dict(label=row['label'],kind='monitoring',cells=row['cells'],source_ids=[code],note=ms.get('note','')) for row in ms['rows']],milestones=[dict(title=p['label'],when=p.get('short','According to the treatment plan'),why=d['purpose'],clinical=p['detail'],action='Confirm the current phase, prescription, tests and support medicines.',source_ids=[code]) for p in d['phases']],clinical_notes=[ms.get('note','')],sources=[dict(s,id=code if s['id']=='nccp' else s['id']) for s in d['sources']])
 if not context:anatomy[code]=dict(code=code,anatomy=d['anatomy'])
 for base in ['patient','docs/patient']:(R/base/route).mkdir(parents=True,exist_ok=True)
 for name,suffix in [('qr.png',''),('oncowiki-qr.png','knowledge.html')]:qrcode.make('https://sactcheck.com/patient/'+route+'/'+suffix).save(R/'patient'/route/name)
save('data/patient-presentation-v08431.json',presentation);save('data/breast-treatment-journeys-v0837.json',journeys)
anatomy_file.write_text('globalThis.SACTCheckAnatomyData='+json.dumps(anatomy,ensure_ascii=False,separators=(',',':'))+';\n')
p=R/'js/regimen-knowledge-base.js';s=p.read_text();needle='"data/regimen-knowledge-base-v08433-addendum.json"'
if 'regimen-knowledge-base-v08434-addendum.json' not in s:
 assert needle in s;s=s.replace(needle,needle+', "data/regimen-knowledge-base-v08434-addendum.json"');p.write_text(s)
p=R/'js/patient-asset-registry-v0810.js';s=p.read_text()
if "'00244':" not in s:
 entry=dict(title=read('data/patient-knowledge/00244.json')['title'],guide=True,passport=True,sactCard=True,knowledge=True,consentDraft=True,supportiveCare=True,phaseSupport=True,longitudinal=True)
 s=s.replace("    '00790':","    '00244':"+json.dumps(entry,ensure_ascii=False)+",\n    '00790':")
s=s.replace("const RELEASE='0.84.33'","const RELEASE='0.84.34'").replace("const CONTENT_RELEASE='0.84.33'","const CONTENT_RELEASE='0.84.34'");p.write_text(s)
p=R/'404.html';s=p.read_text()
if '(00244|' not in s:s=s.replace('(00555|','(00244|00555|')
p.write_text(s)
print('Integrated authored profiles, journeys, QR assets and registry. Coverage remains pending QA.')
