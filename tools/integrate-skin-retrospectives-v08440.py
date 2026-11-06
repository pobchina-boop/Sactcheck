"""Carry five audited immunotherapy corrections into existing patient material.

Only additive text changes are made to existing HTML; detailed illustrations,
wallets, guides, consent and treatment schedules retain their existing markup.
"""
from pathlib import Path
import copy,html,json,hashlib,subprocess
R=Path(__file__).resolve().parents[1];A=R/'validation/skin-melanoma-v08440'
read=lambda p:json.loads((R/p).read_text())
def save(p,d):(R/p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
scope=read('validation/skin-melanoma-v08440/scope.json');handoff=read('validation/skin-melanoma-v08440/retrospective-source-audit/handoff.json')
baseline=read('validation/skin-melanoma-v08440/baseline-v08439-file-hashes.json')
def original_text(p):
 f=str(p.relative_to(R));b=subprocess.check_output(['git','show',scope['verified_remote_main']+':'+f]);assert hashlib.sha256(b).hexdigest()==baseline[f];return b.decode()
report=[];kb=read('data/regimen-knowledge-base-v08440-addendum.json')
support=read('data/phase-support-v0838.json');context=read('data/phase-support-contexts-v08435.json')
for route in scope['retrospective_patient_routes']:
 code=route.split('/')[0];recommendation=next(x for x in handoff['recommendations'] if code in x['codes']);text=recommendation['patient_amendment']
 if code=='00551':text+=' This does not change which formulations are permitted for your colorectal treatment.'
 filename=f'data/patient-knowledge-contexts/{route}.json' if '/' in route else f'data/patient-knowledge/{code}.json';d=json.loads(original_text(R/filename));original=copy.deepcopy(d)
 d['clinical_review_release']='0.84.40';d['clinical_review_checked']='2026-11-06'
 if code=='00551':
  ch=next(x for x in d['chapters'] if any(w in (x['id']+' '+x['title']).lower() for w in ['schedule','phase','treatment plan']))
  ch['items'].append(dict(title='Changing maintenance appointments',text=text,source_ids=['nccp']))
  old=d['support'][1]['text']
 else:
  i=1 if '/' in route else 2;old=d['support'][i]['text'];d['support'][i]['text']=old+' '+text
 assert d['anatomy']==original['anatomy'];assert d['patient_summary']==original['patient_summary'] if 'patient_summary' in d else True
 save(filename,d)
 for leaf in ['index.html','knowledge.html']:
  p=R/'patient'/route/leaf;s=original_text(p);needle=html.escape(old,quote=True).replace('&#x27;','&#39;')
  if needle not in s:needle=old
  if needle not in s:raise ValueError((route,leaf,'authored source paragraph missing'))
  after=s.replace(needle,needle+' '+html.escape(text,quote=True).replace('&#x27;','&#39;'),1)
  assert s.count('data-authored-map')==after.count('data-authored-map')
  p.write_text(after);(R/'docs/patient'/route/leaf).write_text(after)
  report.append(dict(file=str(p.relative_to(R)),operation='Append source-supported patient explanation to existing authored paragraph',before_sha256=hashlib.sha256(s.encode()).hexdigest(),after_sha256=hashlib.sha256(after.encode()).hexdigest(),added_text=text))
 p=R/'patient'/route/'passport.html';s=original_text(p);needle='<div class="suite-qr-row">';assert needle in s,route
 after=s.replace(needle,'<p class="v40-review-note">'+html.escape(text)+'</p>'+needle,1)
 p.write_text(after);(R/'docs/patient'/route/'passport.html').write_text(after)
 report.append(dict(file=str(p.relative_to(R)),operation='Add patient review reminder before the existing QR; symptom pages unchanged',before_sha256=hashlib.sha256(s.encode()).hexdigest(),after_sha256=hashlib.sha256(after.encode()).hexdigest(),added_text=text))
 plans=context['regimens'][code]['colorectal'] if '/' in route else support['regimens'][code]
 for plan in plans:
  plan['additional_support'].append(text);plan['clinical_review_release']='0.84.40'
for code in scope['retrospective_codes']:
 source='data/regimen-knowledge-base-v08427-addendum.json' if code in ['00483','00484'] else 'data/regimen-knowledge-base-v08435-addendum.json'
 p=json.loads(next((R/'protocols').glob('*/'+code+'-*.json')).read_text());old=next(x for x in read(source)['regimen_profiles'] if x['protocol_id']==p['protocol_id']);new=copy.deepcopy(old)
 rec=next(x for x in handoff['recommendations'] if code in x['codes']);new['key_points'].append(rec['clinician_amendment']);new['clinical_review_release']='0.84.40';new['review_status']='Current-source software reconciliation; independent clinical and pharmacy review pending.'
 kb['regimen_profiles'].append(new)
save('data/phase-support-v0838.json',support);save('data/phase-support-contexts-v08435.json',context);save('data/regimen-knowledge-base-v08440-addendum.json',kb)
save('validation/skin-melanoma-v08440/retrospective-patient-text-changes.json',report)
print('Added source-specific explanations to seven existing patient contexts, passports, support plans and clinician knowledge; core anatomy/guides/wallets retained.')
