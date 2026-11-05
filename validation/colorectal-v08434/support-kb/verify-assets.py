from pathlib import Path
import json,re,copy
R=Path(__file__).resolve().parents[3]
def read(f):return json.loads((R/f).read_text())
kb=read('data/regimen-knowledge-base-v08434-addendum.json');ctx=read('data/phase-support-contexts-v08434.json');up=read('validation/colorectal-v08434/support-kb/default-support-updates.json');checks=[]
def check(name,condition):
 assert condition,name
 checks.append(name)
check('Ten distinct protocol profiles',len(kb['regimen_profiles'])==len({x['protocol_id'] for x in kb['regimen_profiles']})==10)
base={}
for f in re.findall(r'data/regimen-knowledge-base[^"\s]+\.json',(R/'js/regimen-knowledge-base.js').read_text()):
 if 'v08434' in f or not (R/f).exists():continue
 for row in read(f).get('regimen_profiles',[]):base[row['protocol_id']]=row
for p in kb['regimen_profiles']:
 c=p['protocol_id'].split('-')[1];profiles=p.get('context_profiles',[p])
 if c in ['00212','00214','00215']:
  old=base[p['protocol_id']];prior=old.get('context_profiles')
  if not prior:
   q=copy.deepcopy(old);q.update(context_id='lung' if c=='00214' else 'breast',context_label='Lung cancer' if c=='00214' else 'Breast cancer');prior=[q]
  for q in prior:check(c+' preserves '+q['context_id'],q==next(x for x in profiles if x['context_id']==q['context_id']))
  new=next(x for x in profiles if x['context_id']=='gastrointestinal');check(c+' routes CRC links',all('/colorectal/' in x['url'] for x in new['reference_links'] if x['url'].startswith('patient/')))
  check(c+' no prophylactic bev medicines',ctx['regimens'][c]['colorectal'][0]['medicines']==[])
 for d in profiles:
  for key in ['patient_selection','monitoring_and_toxicity','administration','supportive_care','evidence_at_a_glance','reference_links']:
   check(c+' '+d.get('context_id','default')+' '+key,bool(d.get(key)))
check('Seven default support updates',set(up)=={'00244','00382','00207','00225','00328','00330','00331'})
check('Regorafenib oral minimal low',up['00244'][0]['emetogenic_risk']=='Minimal-to-low oral')
check('Lonsurf oral moderate high',up['00382'][0]['emetogenic_risk']=='moderate_to_high')
check('Weekly antibody-only day preserved',all(any(z['id']=='day8' for z in up[c]) for c in ['00328','00330']))
check('Fortnightly no day8',all(z['id']!='day8' for z in up['00331']))
for c in ['00328','00330','00331']:
 check(c+' delayed diarrhoea separate',any('48 hours' in z for z in up[c][0]['additional_support']))
result={'status':'passed','checks':len(checks),'assertions':checks,'limitations':'Content/schema assertions supplement source review; not clinical/pharmacy approval or browser/PDF verification.'}
(R/'validation/colorectal-v08434/support-kb/asset-check-results.json').write_text(json.dumps(result,indent=2)+'\n');print(len(checks),'KB/support assertions passed')
