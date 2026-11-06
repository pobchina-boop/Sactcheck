from pathlib import Path
import json,hashlib
R=Path(__file__).resolve().parents[3]; O=Path(__file__).resolve().parent
CODES=['00334','00342','00379','00461','00658']
EXTRA=[{'id':'nci-cns','title':'NCI: adult central nervous system tumours · diagnosis and grade education','url':'https://www.cancer.gov/types/brain/patient/adult-brain-treatment-pdq'},{'id':'nhs-dexamethasone','title':'NHS: dexamethasone · use and stopping safely','url':'https://www.nhs.uk/medicines/dexamethasone-tablets-and-liquid/how-and-when-to-take-dexamethasone-tablets-and-liquid/'}]
def save(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
checks=[]
for c in CODES:
 f=R/'data/patient-knowledge'/f'{c}.json';p=json.loads(f.read_text())
 for e in EXTRA:
  if not any(s['id']==e['id'] for s in p['sources']):p['sources'].append(e)
 for ch in p['chapters']:
  for it in ch['items']:
   sid='nci-cns' if it['title']=='Grade is not the same as stage' else ('nhs-dexamethasone' if it['title']=='Steroids need a separate written plan' else None)
   if sid and sid not in it['source_ids']:it['source_ids'].append(sid)
 save(f,p)
 ids={s['id'] for s in p['sources']}; missing=[]
 def walk(x):
  if isinstance(x,dict):
   for k,v in x.items():
    if k.endswith('source_ids'):
     missing.extend(s for s in v if s not in ids)
    else:walk(v)
  elif isinstance(x,list):
   for q in x:walk(q)
 walk(p)
 assert not missing,(c,missing)
 assert len(p['anatomy'])==8 and len(p['chapters'])==8
 assert p['patient_summary']['card_cycle_count']==(None if c in ['00342','00379'] else 6)
 checks.append({'code':c,'sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'anatomical_anchors':8,'original_chapters':8,'unresolved_source_ids':missing,'card_cycle_count':p['patient_summary']['card_cycle_count']})
f=R/'data/regimen-knowledge-base-v08438-addendum.json';kb=json.loads(f.read_text())
for p in kb['regimen_profiles']:
 for target in [p['reference_links'],p['treatment_rationale']['sources']]:
  for e in EXTRA:
   if not any(s['url']==e['url'] for s in target):target.append({'label':e['title'],'url':e['url']})
save(f,kb)
save(O/'content-validation.json',{'date':'2026-11-05','scope':'First five neuro-oncology profiles only','status':'Authored source-reconciled content frozen; rendering and independent clinical/pharmacy/PPI review separate','checks':checks,'limitations':['This is content/schema validation, not visual or PDF verification.','Rendering, final suite regression and source-boundary tests are owned by release integration.']})
save(O/'evidence-review.json',{'date':'2026-11-05','source_policy':'Original patient wording; NCCP controls Irish treatment scope and schedules. Uploaded NCCN guide is education only. Current product supplements are labelled. No numeric survival forecast is supplied.','sources':[{'name':'Stupp 2005 EORTC/NCIC','url':'https://pubmed.ncbi.nlm.nih.gov/15758009/','applies_to':['00334'],'interpretation':'Concurrent/adjuvant temozolomide improved survival in the randomised trial; do not transfer to recurrent monotherapy.'},{'name':'Perry 2017','url':'https://pubmed.ncbi.nlm.nih.gov/28296618/','applies_to':['00461'],'interpretation':'Short-course RT plus temozolomide improved survival in older trial participants. Trial eligibility and treatment duration do not rewrite the current NCCP indication or six-cycle plan.'},{'name':'Buckner 2016 RTOG 9802','url':'https://pubmed.ncbi.nlm.nih.gov/27050206/','applies_to':['00658'],'interpretation':'Evidence for RT followed by six PCV cycles in selected higher-risk grade II glioma; historical classification limits generalisation.'},{'name':'Shaw 2012 original RTOG 9802 methods','url':'https://pmc.ncbi.nlm.nih.gov/articles/PMC3732006/','applies_to':['00658','00379'],'interpretation':'Original methods explicitly use eight-week cycles. No trial survival number is applied to 42-day PCV or its recurrent high-grade setting.'}]+EXTRA,'independent_review':'Pending clinical, oncology-pharmacy and patient/PPI review'})
print('Frozen v38 patient profiles:',', '.join(CODES))
