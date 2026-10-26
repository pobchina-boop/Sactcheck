"""Source-backed regression assertions for the bounded GI service proposals."""
from pathlib import Path
import hashlib,json,re
import fitz

HERE=Path(__file__).resolve().parent
data=json.loads((HERE/'authoring.json').read_text())
regimens=data['regimens'];checks=[]
def check(label,value):
 assert value,label
 checks.append(label)
check('Nine assigned GI regimens',set(regimens)=={'00328','00330','00331','00585','00692','00732','00733','00225','00213'})
check('Top-level clinical authorization remains false',data['clinical_use_authorised'] is False)
for s in json.loads((HERE/'sources.json').read_text())['source_documents']:
 c=s['code'];x=regimens[c];p=x['patient'];pdf=HERE/'research'/f'{c}.pdf'
 check(c+' source PDF hash',hashlib.sha256(pdf.read_bytes()).hexdigest()==s['sha256'])
 check(c+' actual PDF page count',len(fitz.open(pdf))==s['pages']==x['protocol_metadata']['source_document_pages'])
 check(c+' patient efficacy metrics removed',p['evidence']['metrics']==[])
 check(c+' patient benefit qualitative',not re.search(r'\d',re.sub(r'FOLFOX[46]','FOLFOX',p['evidence']['interpretation'])))
 check(c+' source-defined monitoring rows',all(len(r['cells'])==5 for r in p['monitoring_schedule']['rows']))
 check(c+' longitudinal rows',all(len(r['cells'])==5 for r in x['journey']['lanes']))
 check(c+' baseline and repeated checks distinguished',bool(x['clinical']['baseline']) and bool(x['clinical']['before_each_cycle']) and bool(x['clinical']['ongoing']))
 check(c+' clinical evidence endpoints attributed',all(e.get('sources') and e.get('result_text') and e.get('interpretation') for e in x['evidence']['endpoints']))
 check(c+' excluded from breast selector',x['selector']['include_in_breast_selector'] is False)
 check(c+' clinical governance remains false',x['protocol_metadata']['retrospective_service_audit']['clinical_use_authorised'] is False)
 ids={s['id'] for s in p['sources']};missing=[]
 def walk(value):
  if isinstance(value,dict):
   for key,v in value.items():
    if key.endswith('source_ids') and isinstance(v,list):missing.extend(i for i in v if i not in ids)
    walk(v)
  elif isinstance(value,list):
   for v in value:walk(v)
 walk(p)
 check(c+' patient source ids resolve',not missing)
 text=(HERE/'research'/f'{c}.txt').read_text()
 check(c+' reported source version present',bool(re.search(r'Version number:\s*'+re.escape(s['version']),text)))
 support_pages=[i+1 for i,pdfpage in enumerate(fitz.open(pdf)) if 'EMETOGENIC' in pdfpage.get_text()]
 check(c+' supportive-care page attribution',x['support_plans'][0]['source_page'] in support_pages)
 if c!='00213':
  check(c+' post-EGFR follow-up not lost','monthly' in ' '.join(x['clinical']['ongoing']).lower() and 'two months' in ' '.join(x['clinical']['ongoing']))
 for plan in x['support_plans']:
  check(c+' '+plan['id']+' complete active-day plan',bool(plan['active_medicines']) and bool(plan['emetogenic_risk']) and bool(plan['guidance']['url']))
for c in ['00328','00330','00692']:
 x=regimens[c];plan=next(p for p in x['support_plans'] if p['id']=='day8')
 check(c+' Day 8 cetuximab only',plan['active_medicines']==['Cetuximab'])
 check(c+' Day 8 low risk',plan['emetogenic_risk']=='Low')
 check(c+' Day 8 no chemotherapy premedication carryover',not any(m['name'].lower().startswith('atropine') for m in plan['medicines']) and not any('Days 2 and 3' in m['timing'] for m in plan['medicines']))
for c in ['00331','00585','00732','00733','00225','00213']:
 check(c+' no invented weekly antibody plan',not any(p['id']=='day8' for p in regimens[c]['support_plans']))
check('00732 low classification is explicit in NCCP source',bool(re.search(r'EMETOGENIC POTENTIAL:\s*Low',(HERE/'research/00732.txt').read_text())))
check('00732 mapping corrected to low',regimens['00732']['risk']['level']=='low')
check('00213 weekly FBC retained','weekly' in ' '.join(regimens['00213']['clinical']['before_each_cycle']).lower())
check('00692 Day 2 treatment preserved',any(p['id']=='day2' for p in regimens['00692']['support_plans']))
check('00692 two 22-hour infusions preserved',regimens['00692']['patient']['schedule_summary'].count('22-hour')==2)
check('00733 single 46-hour schedule preserved','one 46-hour' in regimens['00733']['patient']['schedule_summary'])
for c in ['00330','00331','00732','00225','00213']:
 check(c+' no pump correctly stated','no' in regimens[c]['patient']['schedule_summary'].lower() and 'pump' in regimens[c]['patient']['schedule_summary'].lower())
check('00585 CRYSTAL schedule indirect','Indirect schedule' in regimens['00585']['evidence']['applicability'])
check('00733 OPUS backbone/schedule indirect','Indirect for both' in regimens['00733']['evidence']['applicability'])
check('00732 historical weekly evidence indirect','Indirect schedule' in regimens['00732']['evidence']['applicability'])
check('00225 extended-RAS secondary control median correct','6.9' in regimens['00225']['evidence']['endpoints'][0]['result_text'] and 'secondary' in regimens['00225']['evidence']['endpoints'][0]['metric'])
for c in ['00330','00331']:
 check(c+' EPIC does not assert OS benefit','No statistically significant' in regimens[c]['evidence']['endpoints'][0]['interpretation'])
for c in ['00692','00733']:
 check(c+' OPUS does not assert OS benefit','No demonstrated' in regimens[c]['evidence']['endpoints'][2]['interpretation'])
result=dict(release='0.84.21',checked='2026-10-25',passed=len(checks),failed=0,scope='Bounded authoring/source invariants; not generated-browser/PDF QA or independent clinical authorization.',checks=checks)
(HERE/'validation.json').write_text(json.dumps(result,indent=2)+'\n')
print(f'{len(checks)} bounded GI source/service assertions passed.')
