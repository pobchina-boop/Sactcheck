from pathlib import Path
import json,re
R=Path(__file__).resolve().parents[3];O=Path(__file__).parent
read=lambda p:json.loads((R/p).read_text())
k=read('data/regimen-knowledge-base-v08435-addendum.json');codes=['00455','00558','00551','00900','00890','00732','00585','00733','00447','00448'];checks=[]
def check(cond,msg):
 assert cond,msg
 checks.append(msg)
check(len(k['regimen_profiles'])==10,'Ten distinct regimen KB rows')
updates=read('validation/colorectal-v08435/support-kb/default-support-updates.json');contexts=read('data/phase-support-contexts-v08435.json')['regimens']
base={}
for f in re.findall(r'data/regimen-knowledge-base[^"\s]+\.json',(R/'js/regimen-knowledge-base.js').read_text()):
 if 'v08435' in f or not (R/f).exists():continue
 for x in read(f).get('regimen_profiles',[]):base[x['protocol_id']]=x
for c in codes:
 d=read(f'data/patient-knowledge-contexts/{c}/colorectal.json' if c in contexts else f'data/patient-knowledge/{c}.json');row=next(x for x in k['regimen_profiles'] if x['protocol_id']==d['protocol_id']);route=c+('/colorectal' if c in contexts else '')
 check(d['patient_summary']['template_version']=='0.84.35',c+' summary version')
 ids={x['id'] for x in d['sources']}
 def walk(x):
  if isinstance(x,dict):
   for sid in x.get('source_ids',[]):check(sid in ids,c+' source '+sid)
   for v in x.values():walk(v)
  elif isinstance(x,list):
   for v in x:walk(v)
 walk(d)
 if c in contexts:
  prior=base[d['protocol_id']];lung=next(x for x in row['context_profiles'] if x['context_id']=='lung');check(all(lung[key]==value for key,value in prior.items()),c+' existing lung KB preserved')
  row=next(x for x in row['context_profiles'] if x['context_id']=='gastrointestinal');plans=contexts[c]['colorectal'];check(all(not z['medicines'] for z in plans),c+' minimal-risk no routine antiemetic')
  check('PD-L1 is not' in str(plans),c+' CRC selection distinct from lung')
 else:plans=updates[c]
 for field in ['patient_selection','monitoring_and_toxicity','administration','supportive_care','evidence_at_a_glance','reference_links']:check(bool(row.get(field)),c+' KB '+field)
 check(any(x['url']==f'patient/{route}/guide.pdf' for x in row['reference_links']),c+' context-correct patient links')
 check(bool(row['monitoring_and_toxicity']['before_each_cycle']) or c=='00890',c+' serial test plan')
 if c in codes[5:]:
  old=read(f'validation/colorectal-v08435/support-kb/{c}-patient-before.json');check(old['anatomy']==d['anatomy'],c+' detailed anatomy preserved');expected=json.loads(json.dumps(old['chapters']));
  for ch in expected:
   for item in ch['items']:
    if c in ['00732','00585','00733'] and item['title']=='A plan that can change':item['text']='This regimen is used to control advanced bowel cancer and symptoms. Ask how benefit will be assessed and whether any local treatment is part of your individual plan. Your preferences and priorities matter.'
  check(all(x in d['chapters'] for x in expected),c+' original chapters retained except explicit metastatic-purpose correction');check([x['id'] for x in plans]==[x['id'] for x in read('data/phase-support-v0838.json')['regimens'][c]],c+' support identities preserved')
 if c in ['00585','00448']:check('48 hours' in str(plans) and 'asthma' in str(plans),c+' irinotecan rescue and atropine caution')
 if c in ['00585','00733']:check('one hour after' in str(plans),c+' chemotherapy sequence interval')
 if c in ['00733','00447']:check('ice chips' in str(plans),c+' oxaliplatin cold warning')
 if c in ['00551','00900']:check(len(plans)==2 and len(plans[1]['medicines'])==0,c+' separate combination and continuation support')
 if c=='00890':check('weekly for the first month' in str(plans) and '3 mg daily' in str(plans),c+' fruquintinib-specific BP and dose floor')
(O/'asset-check-results.json').write_text(json.dumps({'status':'passed','checks':len(checks),'assertions':checks,'clinical_engine_tested':False,'pdf_browser_tested':False},indent=2)+'\n')
print(len(checks),'content and KB/support assertions passed')
