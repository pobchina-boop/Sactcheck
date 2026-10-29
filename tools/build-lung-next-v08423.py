"""Build the reviewed v0.84.23 service content from its explicit authoring record."""
from pathlib import Path
import copy,json
R=Path(__file__).resolve().parents[1]
V='0.84.23';DATE='2026-10-26'
STATUS='Source reconciled; independent clinical, pharmacy and patient/PPI review pending'
def read(p):return json.loads((R/p).read_text())
def save(p,d):
 f=R/p;f.parent.mkdir(parents=True,exist_ok=True);f.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
C=read('data/lung-next-v08423-authoring.json')['regimens']
scope=read('validation/lung-next-v08423/scope.json')
S=read('data/phase-support-v0838.json');J=read('data/breast-treatment-journeys-v0837.json');B=read('data/breast-library-contexts-v0837.json')
KB=dict(schema_version=1,release=V,source_checked_date=DATE,governance=STATUS,regimen_profiles=[],evidence_records=[],drug_profiles=[])
IDX=dict(release=V,checked=DATE,codes=list(C),new_codes=scope['new_codes'],retrospective_codes=scope['retrospective_codes'],regimens={},clinical_use_authorised=False)
for c,x in C.items():
 f=next((R/'protocols').glob('*/'+c+'-*'));p=json.loads(f.read_text());m=p['metadata'];d=copy.deepcopy(x['patient'])
 d.update(code=c,protocol_id=p['protocol_id'],protocol_version=str(m['nccp_version']),content_version=V,suite_release=V,source_checked=DATE,review_status=STATUS,longitudinal_mapping=True)
 d['sources'][0]=dict(id='nccp',title=f'NCCP {c} v{m["nccp_version"]} · official regimen',url=m['source_url'])
 assert d['evidence']['metrics']==[],c+' patient trial metrics must remain empty'
 for a in d['agents']:
  a['risks']=list(dict.fromkeys(a['risks']))
  # Passport columns use the established patient-language prompts. Hair loss
  # stays in the risk information and free-text record, not an emergency scale.
  prompts={'Nausea / vomiting':['Nausea'],'Mouth / bowels':['Mouth soreness / ulcers','Diarrhoea'],'Kidney / urine changes':['Urinary symptoms'],'Hair loss':[]}
  if 'Hair loss' in a['symptoms']:
   note='Record hair loss and other changes in the free-text notes.'
   if note not in d.get('passport_visit_note',''):d['passport_visit_note']=(d.get('passport_visit_note','')+' '+note).strip()
  a['symptoms']=list(dict.fromkeys(v for old in a['symptoms'] for v in prompts.get(old,[old])))
 save(f'data/patient-knowledge/{c}.json',d)
 journey=copy.deepcopy(x['journey']);journey.update(code=c,release=V,checked=DATE,status=STATUS,schedule_type='relative-educational',has_patient_dates=False,title=d['title']+': treatment and checks',setting=d['context_label'],summary=d['schedule_summary'])
 journey['sources']=[dict(s,id=c if s['id']=='nccp' else s['id']) for s in d['sources']]
 J[c]=journey
 selector=copy.deepcopy(x.get('selector',{}))
 if selector.get('include_in_breast_selector',True):
  selector.update(code=c,protocol_id=p['protocol_id'],longitudinal=True,source_url=m['source_url']);B['regimens'][c]=selector
 plans=copy.deepcopy(x['support_plans'])
 for plan in plans:
  plan.update(source_checked=DATE,source_url=m['source_url']);plan['additional_support']=list(dict.fromkeys(plan['additional_support']))
 S['regimens'][c]=plans
 clinical=x['clinical'];rationale=copy.deepcopy(clinical['rationale']);rationale['sources']=[dict(label=d['sources'][0]['title'],url=m['source_url'])]+rationale.get('sources',[])
 k=dict(protocol_id=p['protocol_id'],regimen_role=d['context_label'],clinical_summary=rationale['summary'],treatment_setting=d['context_label'],component_rationale=clinical.get('component_rationale',' '.join(a['name']+': '+a['explanation'] for a in d['agents'])),schedule_context=d['schedule_summary'],key_points=clinical['key_points'],treatment_rationale=rationale,patient_selection=clinical['patient_selection'],supportive_care=dict(emetogenic_risk='; '.join(q['label']+': '+q['emetogenic_risk'] for q in plans),premedication_and_prophylaxis=clinical['support_summary'],patient_education=[q['text'] for q in d['support']],special_support=[n for q in plans for n in q['additional_support']]),monitoring_and_toxicity=dict(baseline=clinical['baseline'],before_each_cycle=clinical['before_each_cycle'],ongoing=clinical['ongoing'],priority_toxicities=list(dict.fromkeys(risk for a in d['agents'] for risk in a['risks'])),urgent_review_signals=[d['urgent_extra']],longitudinal_schedule=d['monitoring_schedule']),administration=dict(cycle_and_sequence=d['schedule_summary'],route_and_duration=[d['administration_text']] if 'administration_text' in d else clinical['administration'],practical_workflow=[q['text'] for q in d['logistics'].get('sections',d['logistics'].get('steps',[]))],observation_and_access=clinical['access']),review_status=STATUS,source_checked_date=DATE,full_suite_release=V,schedule_kind=d.get('schedule_kind','cytotoxic_reference'),evidence_at_a_glance=x['evidence'],evidence_audit=dict(status=STATUS,indications_reviewed=clinical['patient_selection']['disease_and_biomarker_context'],remaining_uncertainties=rationale['limitations']),reference_links=[dict(label=s['title'],url=s['url']) for s in d['sources']]+[dict(label=label,url=f'patient/{c}/{file}') for label,file in [('Patient reference','knowledge.html'),('Whole treatment map','treatment-journey.html'),('Consent aid','consent-form.html'),('Support plan','supportive-care.html'),('Guide','guide.pdf'),('Passport','passport.pdf'),('Practical plan','logistics.html')]])
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
for name,d in [('data/phase-support-v0838.json',S),('data/breast-treatment-journeys-v0837.json',J),('data/regimen-knowledge-base-v08423-addendum.json',KB),('data/lung-next-v08423-source-index.json',IDX)]:save(name,d)
print(f'Authored {len(C)} reviewed v0.84.23 service suites.')
