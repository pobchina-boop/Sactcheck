"""Integrate the reviewed five skin protocols and six patient contexts."""
from pathlib import Path
import html,json,qrcode
R=Path(__file__).resolve().parents[1];V='0.84.40';DATE='2026-11-06'
def read(f):return json.loads((R/f).read_text())
def save(f,d):
 p=R/f;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
scope=read('validation/skin-melanoma-v08440/scope.json')
presentation=read('data/patient-presentation-v08431.json');journeys=read('data/breast-treatment-journeys-v0837.json')
af=R/'js/patient-anatomy-data-v08431.js';anatomy=json.loads(af.read_text().split('=',1)[1].rstrip(';\n'))
reg=R/'js/patient-asset-registry-v0810.js';registry=reg.read_text();entries=[]
for route in scope['presentation_routes']:
 code=route.split('/')[0];context=route.split('/')[1] if '/' in route else ''
 profile=f'data/patient-knowledge-contexts/{route}.json' if context else f'data/patient-knowledge/{code}.json';d=read(profile)
 assert d['suite_release']==V and d['patient_summary']['template_version']==V,route
 presentation['routes'][route]=profile;presentation['legacy_layout_fields'].pop(route,None)
 ms=d['monitoring_schedule'];key=route.replace('/',':')
 journeys[key]=dict(code=code,title=d['title']+': treatment and checks',release=V,checked=DATE,status=d['review_status'],schedule_type='relative-educational',has_patient_dates=False,setting=d['context_label'],summary=d['schedule_summary'],stages=ms['columns'],lanes=[dict(label=row['label'],kind='monitoring',cells=row['cells'],source_ids=[code],note=ms.get('note','')) for row in ms['rows']],milestones=[dict(title=p['label'],when=p.get('short','According to the treatment plan'),why=d['purpose'],clinical=p['detail'],action='Confirm the current treatment phase, prescription, tests and support medicines.',source_ids=[code]) for p in d['phases']],clinical_notes=[ms.get('note','')],sources=[dict(s,id=code if s['id']=='nccp' else s['id']) for s in d['sources']])
 if not context:anatomy[code]=dict(code=code,anatomy=d['anatomy'])
 for base in ['patient','docs/patient']:(R/base/route).mkdir(parents=True,exist_ok=True)
 for name,suffix in [('qr.png',''),('oncowiki-qr.png','knowledge.html')]:qrcode.make('https://sactcheck.com/patient/'+route+'/'+suffix).save(R/'patient'/route/name)
 if not context and "'"+code+"':" not in registry:
  definition=dict(title=d['title'],guide=True,passport=True,sactCard=True,knowledge=True,consentDraft=True,supportiveCare=True,phaseSupport=True,longitudinal=True)
  if code in ['00431','00812']:definition.update(scopeGuard=True,scope='Melanoma patient information only' if code=='00431' else 'Cutaneous squamous cell carcinoma patient information only')
  entries.append("    '"+code+"':"+json.dumps(definition,ensure_ascii=False)+',')
save('data/patient-presentation-v08431.json',presentation);save('data/breast-treatment-journeys-v0837.json',journeys)
af.write_text('globalThis.SACTCheckAnatomyData='+json.dumps(anatomy,ensure_ascii=False,separators=(',',':'))+';\n')
registry=registry.replace("const RELEASE='0.84.39'","const RELEASE='0.84.40'").replace("const CONTENT_RELEASE='0.84.39'","const CONTENT_RELEASE='0.84.40'")
if entries:registry=registry.replace('const DEFINITIONS=Object.freeze({','const DEFINITIONS=Object.freeze({\n'+'\n'.join(entries))
registry=registry.replace("const CONTEXT_CODES=Object.freeze(['00320'","const CONTEXT_CODES=Object.freeze(['00415','00320'")
needle="    if(code==='00320')return selected==='neuroendocrine'?'neuroendocrine':'';"
if "code==='00415'" not in registry:
 registry=registry.replace(needle,"    if(code==='00415')return ['advanced','adjuvant'].includes(selected)?selected:'';\n"+needle)
registry=registry.replace("    if(!d.contextOnly)return [d.code];","    if(d.code==='00415')return [d.code,d.code+'/adjuvant'];\n    if(!d.contextOnly)return [d.code];") if "return [d.code,d.code+'/adjuvant']" not in registry else registry
registry=registry.replace("${def.code==='00320'?'neuroendocrine/':","${def.code==='00415'?(selected==='adjuvant'?'adjuvant/':''):def.code==='00320'?'neuroendocrine/':")
reg.write_text(registry)
p=R/'js/regimen-knowledge-base.js';s=p.read_text();needle='"data/regimen-knowledge-base-v08439-addendum.json"'
if 'regimen-knowledge-base-v08440-addendum.json' not in s:
 assert needle in s;s=s.replace(needle,needle+', "data/regimen-knowledge-base-v08440-addendum.json"');p.write_text(s)
support=read('data/phase-support-v0838.json');updates=read('validation/skin-melanoma-v08440/patient-content/phase-support-updates.json')
support['regimens'].update(updates['regimens']);save('data/phase-support-v0838.json',support)
if 'context_regimens' in updates:save('data/phase-support-contexts-v08440.json',dict(release=V,regimens=updates['context_regimens']))
selector=R/'assets/patient/context-selector-v08425.js';s=selector.read_text();s=s.replace("'./','lung/','colorectal/','neuroendocrine/'","'./','lung/','colorectal/','neuroendocrine/','adjuvant/'");selector.write_text(s)
for code,heading,description,choices,other in [
 ('00415','dabrafenib and trametinib','The same medicines have different aims and treatment durations.', [('advanced','./','Advanced melanoma','Treatment for unresectable or metastatic melanoma. Duration is guided by benefit and tolerability.'),('adjuvant','adjuvant/','After surgery: adjuvant melanoma','Treatment after complete resection of qualifying BRAF V600-positive stage III melanoma. The source plan is 12 months unless stopped earlier.')],''),
 ('00431','nivolumab and ipilimumab','This patient pack describes the melanoma 1 mg/kg nivolumab plus 3 mg/kg ipilimumab induction and selected maintenance plan.', [('melanoma','./','Melanoma','Open the melanoma treatment information.')],'This protocol also contains liver-cancer treatment. That context has different clinical criteria and is not covered by this patient pack. Ask your team for the matching liver-cancer information.'),
 ('00812','cemiplimab','This patient pack describes advanced cutaneous squamous cell carcinoma.', [('cutaneous-scc','./','Cutaneous squamous cell carcinoma','Open the skin SCC treatment information.')],'Cervical cancer and other cancer settings require their own matching information. This pack does not establish an adjuvant skin SCC indication.')]:
  esc=html.escape
  articles=''.join('<article><h2>'+esc(title)+'</h2><p>'+esc(text)+'</p><a data-context="'+context+'" data-route="'+route+'" href="'+route+'">Open this patient information</a></article>' for context,route,title,text in choices)
  content='<!doctype html><html lang="en-IE"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Confirm treatment context · '+esc(heading)+'</title><style>body{font:18px/1.6 system-ui;color:#173b48;background:#f0f6f7;margin:0}main{max-width:760px;margin:auto;padding:24px}article{background:white;padding:24px;margin:18px 0;border-radius:12px}a{color:#07666c}</style></head><body><main><a href="../../">SACTCheck home</a><h1>Confirm your '+esc(heading)+' treatment</h1><p>'+esc(description)+'</p>'+articles+('<article><h2>Another treatment setting</h2><p>'+esc(other)+'</p></article>' if other else '')+'<p>Public reference; independent clinical review pending. Your treating team confirms your plan.</p></main><script src="../../assets/patient/context-selector-v08425.js"></script></body></html>'
  for base in ['patient','docs/patient']:(R/base/code/'scope.html').write_text(content)
print('Integrated five skin protocols, six patient routes, context guards, monitoring, phase support and QR images.')
