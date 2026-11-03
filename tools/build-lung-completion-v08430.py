"""Build the reviewed v0.84.30 service content from its explicit authoring record."""
from pathlib import Path
import copy,json,re
R=Path(__file__).resolve().parents[1]
V='0.84.30';DATE='2026-11-02'
STATUS='Source reconciled; independent clinical, pharmacy and patient/PPI review pending'
def read(p):return json.loads((R/p).read_text())
def save(p,d):
 f=R/p;f.parent.mkdir(parents=True,exist_ok=True);f.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
C=read('data/lung-completion-v08430-authoring.json')['regimens']
scope=read('validation/lung-completion-v08430/scope.json')
S=read('data/phase-support-v0838.json');J=read('data/breast-treatment-journeys-v0837.json');B=read('data/breast-library-contexts-v0837.json')
KB=dict(schema_version=1,release=V,source_checked_date=DATE,governance=STATUS,regimen_profiles=[],evidence_records=[],drug_profiles=[])
IDX=dict(release=V,checked=DATE,codes=list(C),new_codes=scope['new_codes'],retrospective_codes=scope['retrospective_codes'],regimens={},clinical_use_authorised=False)
context_support={'release':V,'regimens':{}}
work=[(c,x,None) for c,x in C.items()]+[(c,x,slug) for c,base in C.items() for slug,x in base.get('patient_contexts',{}).items()]
for c,x,context in work:
 f=next((R/'protocols').glob('*/'+c+'-*'));p=json.loads(f.read_text());m=p['metadata'];d=copy.deepcopy(x['patient'])
 def readable(v):
  if isinstance(v,str):return re.sub(r'\bNCCP(?=\d{5}\b)','NCCP ',v)
  if isinstance(v,list):return [readable(t) for t in v]
  if isinstance(v,dict):return {k:readable(t) for k,t in v.items()}
  return v
 d=readable(d)
 if c in ['00279','00309']:
  answers=['Confirm the exact drug names, routes and interval against your written prescription. The team must explain any change from this reference plan.','Radiation has its own calendar. Ask for the combined plan and whom to contact if a chemotherapy or radiation visit changes.','Use the checks table as a prompt. Your team confirms which tests are needed, where they are done and who reviews the results before treatment.','Ask the team to replace the example numbers on your card with the correct daytime, overnight and backup contact routes before you leave.','Agree the follow-up appointments and any scans with your team. This regimen does not set a universal scan or tumour-marker timetable.']
  d['questions']=[dict(q=q,a=a) if isinstance(q,str) else q for q,a in zip(d['questions'],answers)]
 if c in ['00279','00309']:
  for phase,label in zip(d['patient_summary']['phases'],['Chemotherapy','Radiotherapy','After treatment']):phase['title']=label
  for row in d['patient_summary']['monitoring']:
   if row['stage'].startswith('After'):row['test']='Recovery and response'
   if c=='00279' and row['stage']=='During':row['test']='Bloods, hearing and nerves'
  d['patient_summary']['phases'][-1]['text']='Your team reviews recovery, persistent symptoms and response. Scan or marker timing is individual.'
 if c=='00279':d['treatment_scope_notice']='For limited-stage lung cancer: IV cisplatin/etoposide every 21 days. Oral, split-dose, carboplatin or 28-day plans need personalised information.'
 d['evidence'].setdefault('title','Understanding the evidence')
 if d.get('patient_summary'):d['patient_summary']['template_version']=V
 for source in d['sources']:
  if 'title' not in source:source['title']=source['label']
 positions={'brain':[50,6],'eye':[55,10],'eyes':[57,9],'heart':[52.5,28.3],'liver':[43,33],'gut':[50,44.5],'bowel':[50,44.5],'lung':[61.5,24.7],'lungs':[61.5,24.7],'mouth':[50,13],'kidney':[39.5,38.6],'kidneys':[39.5,38.6]}
 for row in d['anatomy']:
  if row[0] in positions:row[4:6]=positions[row[0]]
 d.update(code=c,protocol_id=p['protocol_id'],protocol_version=str(m['nccp_version']),content_version=V,suite_release=V,source_checked=DATE,review_status=STATUS,longitudinal_mapping=True)
 d['sources'][0]=dict(id='nccp',title=f'NCCP {c} v{m["nccp_version"]} · official regimen',url=m['source_url'])
 assert d['evidence']['metrics']==[],c+' patient trial metrics must remain empty'
 for a in d['agents']:
  a['risks']=list(dict.fromkeys(a['risks']))
  # Passport columns use the established patient-language prompts. Hair loss
  # stays in the risk information and free-text record, not an emergency scale.
  prompts={'Kidney injury':['Urinary symptoms'],'Hearing changes that may persist':['Hearing changes'],'Numbness or tingling':['Numbness / tingling'],'Numbness / tingling that may persist':['Numbness / tingling'],'Low blood counts / serious infection':[],'Low blood counts / infection':[],'Infusion allergy':[],'Mouth soreness':['Mouth soreness / ulcers'],'Nausea and vomiting':['Nausea'],'Breathlessness / cough':['Breathing / cough'],'Skin rash':['Skin / nail changes'],'Nausea / vomiting':['Nausea'],'Mouth / bowels':['Mouth soreness / ulcers','Diarrhoea'],'Kidney / urine changes':['Urinary symptoms'],'Hair loss':[]}
  if 'Hair loss' in a['symptoms']:
   note='Record hair loss and other changes in the free-text notes.'
   if note not in d.get('passport_visit_note',''):d['passport_visit_note']=(d.get('passport_visit_note','')+' '+note).strip()
  a['symptoms']=list(dict.fromkeys(v for old in a['symptoms'] for v in prompts.get(old,[old])))
 if context or not x.get('preserve_canonical_patient_content'):save(f'data/patient-knowledge-contexts/{c}/{context}.json' if context else f'data/patient-knowledge/{c}.json',d)
 journey=copy.deepcopy(x['journey']);journey.update(code=c,release=V,checked=DATE,status=STATUS,schedule_type='relative-educational',has_patient_dates=False,title=d['title']+': treatment and checks',setting=d['context_label'],summary=d['schedule_summary'])
 journey['sources']=[dict(s,id=c if s['id']=='nccp' else s['id']) for s in d['sources']]
 def journey_refs(v):
  if isinstance(v,list):return [journey_refs(t) for t in v]
  if isinstance(v,dict):return {k:[c if t=='nccp' else t for t in a] if k=='source_ids' else journey_refs(a) for k,a in v.items()}
  return v
 journey=journey_refs(journey)
 if context or not x.get('preserve_canonical_patient_content'):J[c+':'+context if context else c]=journey
 selector=copy.deepcopy(x.get('selector',{}))
 if not context and selector.get('include_in_breast_selector',False):
  selector.update(code=c,protocol_id=p['protocol_id'],longitudinal=True,source_url=m['source_url']);B['regimens'][c]=selector
 if not context and not x.get('preserve_canonical_patient_content') and not selector.get('include_in_breast_selector',False):B['regimens'].pop(c,None)
 plans=copy.deepcopy(x['support_plans'])
 for plan in plans:
  plan.update(source_checked=DATE,source_url=m['source_url']);plan['additional_support']=list(dict.fromkeys(plan['additional_support']))
 if context:
  context_support['regimens'].setdefault(c,{})[context]=plans
  IDX.setdefault('patient_contexts',{}).setdefault(c,[]).append(context)
  continue
 if not x.get('preserve_canonical_patient_content'):S['regimens'][c]=plans
 clinical=x['clinical'];rationale=copy.deepcopy(clinical['rationale']);rationale['sources']=[dict(label=d['sources'][0]['title'],url=m['source_url'])]+rationale.get('sources',[])
 k=dict(protocol_id=p['protocol_id'],regimen_role=d['context_label'],clinical_summary=rationale['summary'],treatment_setting=d['context_label'],component_rationale=clinical.get('component_rationale',' '.join(a['name']+': '+a['explanation'] for a in d['agents'])),schedule_context=d['schedule_summary'],key_points=clinical['key_points'],treatment_rationale=rationale,patient_selection=clinical['patient_selection'],supportive_care=dict(emetogenic_risk='; '.join(q['label']+': '+q['emetogenic_risk'] for q in plans),premedication_and_prophylaxis=clinical['support_summary'],patient_education=[q['text'] for q in d['support']],special_support=[n for q in plans for n in q['additional_support']]),monitoring_and_toxicity=dict(baseline=clinical['baseline'],before_each_cycle=clinical['before_each_cycle'],ongoing=clinical['ongoing'],priority_toxicities=list(dict.fromkeys(risk for a in d['agents'] for risk in a['risks'])),urgent_review_signals=[d['urgent_extra']],longitudinal_schedule=d['monitoring_schedule']),administration=dict(cycle_and_sequence=d['schedule_summary'],route_and_duration=[d['administration_text']] if 'administration_text' in d else clinical['administration'],practical_workflow=[q['text'] for q in d['logistics'].get('sections',d['logistics'].get('steps',[]))],observation_and_access=clinical['access']),review_status=STATUS,source_checked_date=DATE,full_suite_release=V,schedule_kind=d.get('schedule_kind','cytotoxic_reference'),evidence_at_a_glance=x['evidence'],evidence_audit=dict(status=STATUS,indications_reviewed=clinical['patient_selection']['disease_and_biomarker_context'],remaining_uncertainties=rationale['limitations']),reference_links=[dict(label=s['title'],url=s['url']) for s in d['sources']]+[dict(label=label,url=f'patient/{c}/scope.html?asset='+{'knowledge.html':'knowledge','treatment-journey.html':'longitudinal','consent-form.html':'consent-draft','supportive-care.html':'supportive-care-selector','guide.pdf':'guide','passport.pdf':'passport','logistics.html':'logistics'}[file] if d.get('patient_context_selector') else f'patient/{c}/{file}') for label,file in [('Patient reference','knowledge.html'),('Whole treatment map','treatment-journey.html'),('Consent aid','consent-form.html'),('Support plan','supportive-care.html'),('Guide','guide.pdf'),('Passport','passport.pdf'),('Practical plan','logistics.html')]])
 if x.get('preserve_canonical_patient_content'):
  wrapper=copy.deepcopy(next(z for z in read('data/regimen-knowledge-base-v08425-addendum.json')['regimen_profiles'] if z['protocol_id']==p['protocol_id']))
  old_lung=next(z for z in wrapper['context_profiles'] if z['context_id']=='lung')
  k.update({key:old_lung[key] for key in ['context_id','context_label','journey_key']})
  for link in k['reference_links']:link['url']=link['url'].replace(f'patient/{c}/',f'patient/{c}/lung/')
  wrapper['context_profiles']=[k if z['context_id']=='lung' else z for z in wrapper['context_profiles']]
  wrapper['context_release']=V
  k=wrapper
 KB['regimen_profiles'].append(k)
 for a in d['agents']:
  declared=[s for s in d['sources'] if s['id'] in a.get('source_ids',[]) and s['id']!='nccp']
  product=next((s for s in declared if 'smpc' in s['id'].lower() or 'product information' in s['title'].lower()),None)
  source=product or d['sources'][0]
  profile=dict(id=a['id'],name=a['name'],aliases=[a['name']],drug_type=a['type'],drug_class=a['type'],mechanism=clinical.get('drug_mechanisms',{}).get(a['id'],a['explanation']),source_url=source['url'],source_label=source['title'],review_status=STATUS,last_reviewed=DATE)
  existing=next((z for z in KB['drug_profiles'] if z['id']==a['id']),None)
  if existing is None:KB['drug_profiles'].append(profile)
  elif product and 'healthservice.hse.ie/documents/' in existing['source_url']:existing.update(profile)
 IDX['regimens'][c]=dict(protocol_id=p['protocol_id'],version=m['nccp_version'],source_url=m['source_url'],source_pdf_sha256=m.get('source_pdf_sha256'),source_text_snapshot_sha256=m.get('source_text_snapshot_sha256'),source_retrieval_method=m.get('source_retrieval_method','Official source PDF retrieved and visually inspected'),rule_count=len(p['rule_engine']['rules']),independent_review='pending')
S['release']=V
save('data/phase-support-contexts-v08430.json',context_support)
for name,d in [('data/breast-library-contexts-v0837.json',B),('data/phase-support-v0838.json',S),('data/breast-treatment-journeys-v0837.json',J),('data/regimen-knowledge-base-v08430-addendum.json',KB),('data/lung-completion-v08430-source-index.json',IDX)]:save(name,d)
print(f'Authored {len(C)} reviewed v0.84.30 service suites.')
