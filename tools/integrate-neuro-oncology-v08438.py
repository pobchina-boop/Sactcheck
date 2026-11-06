"""Integrate the five authored glioma profiles while preserving previous bundles."""
from pathlib import Path
import json,qrcode
R=Path(__file__).resolve().parents[1];V='0.84.38';DATE='2026-11-05'
def read(f):return json.loads((R/f).read_text())
def save(f,d):
 p=R/f;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
scope=read('validation/neuro-oncology-v08438/scope.json');codes=scope['codes']
presentation=read('data/patient-presentation-v08431.json');journeys=read('data/breast-treatment-journeys-v0837.json')
af=R/'js/patient-anatomy-data-v08431.js';anatomy=json.loads(af.read_text().split('=',1)[1].rstrip(';\n'))
reg=R/'js/patient-asset-registry-v0810.js';registry=reg.read_text();entries=[]
for code in codes:
 profile='data/patient-knowledge/'+code+'.json';d=read(profile)
 assert d['suite_release']==V and d['patient_summary']['template_version']==V,code
 presentation['routes'][code]=profile;presentation['legacy_layout_fields'].pop(code,None)
 ms=d['monitoring_schedule']
 journeys[code]=dict(code=code,title=d['title']+': treatment and checks',release=V,checked=DATE,status=d['review_status'],schedule_type='relative-educational',has_patient_dates=False,setting=d['context_label'],summary=d['schedule_summary'],stages=ms['columns'],lanes=[dict(label=row['label'],kind='monitoring',cells=row['cells'],source_ids=[code],note=ms.get('note','')) for row in ms['rows']],milestones=[dict(title=p['label'],when=p.get('short','According to the treatment plan'),why=d['purpose'],clinical=p['detail'],action='Confirm the current phase, prescription, blood tests and support medicines.',source_ids=[code]) for p in d['phases']],clinical_notes=[ms.get('note','')],sources=[dict(s,id=code if s['id']=='nccp' else s['id']) for s in d['sources']])
 anatomy[code]=dict(code=code,anatomy=d['anatomy'])
 for base in ['patient','docs/patient']:(R/base/code).mkdir(parents=True,exist_ok=True)
 for name,suffix in [('qr.png',''),('oncowiki-qr.png','knowledge.html')]:qrcode.make('https://sactcheck.com/patient/'+code+'/'+suffix).save(R/'patient'/code/name)
 if "'"+code+"':" not in registry:
  entries.append("    '"+code+"':"+json.dumps(dict(title=d['title'],guide=True,passport=True,sactCard=True,knowledge=True,consentDraft=True,supportiveCare=True,phaseSupport=True,longitudinal=True),ensure_ascii=False)+',')
save('data/patient-presentation-v08431.json',presentation);save('data/breast-treatment-journeys-v0837.json',journeys)
af.write_text('globalThis.SACTCheckAnatomyData='+json.dumps(anatomy,ensure_ascii=False,separators=(',',':'))+';\n')
registry=registry.replace("const RELEASE='0.84.37'","const RELEASE='0.84.38'").replace("const CONTENT_RELEASE='0.84.37'","const CONTENT_RELEASE='0.84.38'")
if entries:registry=registry.replace('const DEFINITIONS=Object.freeze({','const DEFINITIONS=Object.freeze({\n'+'\n'.join(entries))
reg.write_text(registry)
p=R/'js/regimen-knowledge-base.js';s=p.read_text();needle='"data/regimen-knowledge-base-v08437-addendum.json"'
if 'regimen-knowledge-base-v08438-addendum.json' not in s:
 assert needle in s;s=s.replace(needle,needle+', "data/regimen-knowledge-base-v08438-addendum.json"');p.write_text(s)
support=read('data/phase-support-v0838.json');support['regimens'].update(read('validation/neuro-oncology-v08438/patient-content/phase-support-updates.json')['regimens']);save('data/phase-support-v0838.json',support)
print('Integrated five glioma routes, knowledge, monitoring, phase support and QR images.')
