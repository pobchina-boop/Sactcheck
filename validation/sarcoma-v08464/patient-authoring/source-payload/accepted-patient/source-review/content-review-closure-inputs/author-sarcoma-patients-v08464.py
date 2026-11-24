#!/usr/bin/env python3
"""Emit reviewed external patient/clinician candidates. Does not write application files."""
import argparse,copy,hashlib,importlib.util,json,math,pathlib,re
HERE=pathlib.Path(__file__).resolve().parent
def module(name,path):
 spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def save(root,file,obj):
 p=root/file;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
def explain(x):
 if isinstance(x,str):
  if x.startswith(('http://','https://')):return x
  for old,new in [('NCCP','National Cancer Control Programme'),('QR','quick response code'),('G-CSF','white-cell growth factor'),('PJP','Pneumocystis jirovecii pneumonia'),('FBC','full blood count'),('ECG','electrocardiogram (heart tracing)'),('MUGA','heart pumping scan'),('ECHO','heart ultrasound'),('LVEF','left ventricular ejection fraction (heart pumping measurement)')]:x=re.sub(r'\b'+re.escape(old)+r'\b',new,x)
  return x
 if isinstance(x,list):return [explain(v)for v in x]
 if isinstance(x,dict):return {k:explain(v)if k not in ['id','source_ids','protocol_id','code','patient_route']else v for k,v in x.items()}
 return x
def marker_check(rows):
 assert len(rows)==8 and len({r[0]for r in rows})==8
 distances=[math.hypot((a[4]-b[4])*66.442/100,(a[5]-b[5])*146/100)for i,a in enumerate(rows)for b in rows[i+1:]]
 assert min(distances)>=7,min(distances)
 return round(min(distances),3)
def endpoint(kind,metric,result,population,url,limitations):
 return dict(endpoint=kind,metric=metric,result_text=result,interpretation=population,limitations=limitations,analysis_status='Published result with the stated design and applicability limits',sources=[dict(label='Primary study report',url=url)])
def evidence(code,f):
 if code in ['00675','00747']:
  population='568 eligible participants younger than 50 with localised extradural Ewing sarcoma; median age 12, only 67 aged 18 or older.'
  rows=[endpoint('EFS','Five-year event-free survival','73% with two-weekly versus 65% with three-weekly treatment; hazard ratio 0.74 (95% confidence interval 0.54–0.99), P=0.048.',population,f['trial_url'],f['caveat']),endpoint('OS','Five-year overall survival','83% versus 77%; P=0.056, not conventionally statistically significant.',population,f['trial_url'],'A different endpoint from event-free survival; do not describe this initial overall-survival comparison as significant.'),endpoint('EFS','Ten-year event-free survival','70% versus 61%; P=0.03.','Long-term follow-up of the same randomised cohort; one participant with uncertain diagnosis excluded.','https://pubmed.ncbi.nlm.nih.gov/37651654/','This is follow-up, not an independent confirming trial or a population to pool with the first report.'),endpoint('OS','Ten-year overall survival','76% versus 69%; P=0.04.','The same long-term randomised cohort.','https://pubmed.ncbi.nlm.nih.gov/37651654/',f['caveat'])]
  return dict(population=population,comparison='Alternating vincristine/doxorubicin/cyclophosphamide and ifosfamide/etoposide every 14 versus 21 days, with growth-factor support and local control.',endpoints=rows)
 if code=='00504':
  rows=[endpoint('ORR','Interim rEECur objective response','20% in the irinotecan/temozolomide arm.','118 recipients in the interim randomised programme; eligible ages 4–50, median age 20.','https://doi.org/10.1200/JCO.2020.38.15_suppl.11502','Primary conference abstract; the arm was inferior to the other then-open arms and closed. Not a completed full-paper superiority finding.'),endpoint('PFS','Interim rEECur median progression-free survival','4.7 months (95% confidence interval 3.4–5.7).','Same irinotecan/temozolomide interim arm.','https://doi.org/10.1200/JCO.2020.38.15_suppl.11502','Median follow-up was 9.2 months; not a personal prognosis.'),endpoint('OS','Interim rEECur median overall survival','13.9 months (95% confidence interval 10.6–18.1).','Same interim arm.','https://doi.org/10.1200/JCO.2020.38.15_suppl.11502',f['caveat']),endpoint('ORR','Retrospective adult-containing series','5 complete and 12 partial responses among 51 patients (33% objective response). Disease control was 71%, a different measure.','Palmerini series: median age 21, 34 adults; irinotecan 40 mg/m² and temozolomide 100 mg/m² on days 1–5.','https://pubmed.ncbi.nlm.nih.gov/29533113/','Different irinotecan dose, retrospective selection and mixed treatment lines; do not compare the percentage causally with rEECur or substitute it for this exact schedule.')]
  return dict(population='Relapsed or refractory Ewing sarcoma; distinguish prospective interim evidence from retrospective series.',comparison='rEECur irinotecan/temozolomide compared adaptively with other salvage arms; retrospective series have no randomised comparator.',endpoints=rows)
 if code=='00754':
  population='484 participants older than six months and younger than 21 years with high-risk non-metastatic rhabdomyosarcoma.'
  return dict(population=population,comparison='Nine cycles of ifosfamide/vincristine/dactinomycin versus four cycles with added doxorubicin followed by five cycles without it.',endpoints=[endpoint('EFS','Three-year event-free survival','67.5% with doxorubicin versus 63.3% without; hazard ratio 0.87 (95% confidence interval 0.65–1.16), P=0.33.',population,f['trial_url'],'No statistically significant benefit; the trial stopped for futility. '+f['caveat']),endpoint('Safety','Grade 3–5 infections','79% with doxorubicin versus 56% without; two treatment-related deaths versus none.',population,f['trial_url'],'Higher treatment burden must accompany any discussion of the non-significant efficacy result; group figures do not predict individual toxicity.')])
 population='120 participants with relapsed or refractory rhabdomyosarcoma; actual ages 0.75–45, median 11, and 89% had relapsed disease.'
 return dict(population=population,comparison='Vincristine/irinotecan/temozolomide versus vincristine/irinotecan; randomised phase II study.',endpoints=[endpoint('ORR','Response after two cycles (primary endpoint)','44% (24/55) versus 31% (18/58); P=0.09.',population,f['trial_url'],'Not conventionally statistically significant. The evaluable response denominators differ from the total 120 randomised participants.'),endpoint('OS','Overall survival','Adjusted hazard ratio 0.55 (95% confidence interval 0.35–0.84), P=0.006.',population,f['trial_url'],'A separate endpoint from the non-significant primary response comparison. '+f['caveat']),endpoint('PFS','Progression-free survival','Adjusted hazard ratio 0.68 (95% confidence interval 0.46–1.01), P=0.059.',population,f['trial_url'],'Does not meet conventional significance; do not equate it with the overall-survival result.'),endpoint('Safety','Grade 3 or greater adverse events','98% versus 78%.',population,f['trial_url'],'The higher observed severe-toxicity burden is part of the consent discussion, not an individual forecast.')])

def support_items(code,f):
 items=[dict(title='Anti-sickness medicines',text='Follow one written prevention, home and rescue plan. The team reconciles all steroids and interacting medicines; no generic reference is an additional prescription.',source_ids=['nccp'])]
 if code in ['00675','00747','00754']:
  mesna='Ifosfamide cycles: mesna 360 mg/m² intravenously before each dose and at 4 and 8 hours from the START of that dose. It binds bladder-damaging metabolites; it does not prevent every kidney or neurological effect.'if code!='00754'else'On each of days 1 and 2, mesna 900 mg/m² intravenously over ten minutes immediately before ifosfamide, then 3000 mg/m² continuously over 24 hours starting with ifosfamide. It binds bladder-damaging metabolites; kidney and brain monitoring are still required.'
  items += [dict(title='Mesna and bladder protection',text=mesna,source_ids=['nccp']),dict(title='Hydration and fluid balance',text='Hospital-prescribed fluids support urine flow and clearance. The team adjusts them to urine output, blood tests, weight and heart/kidney status; continue the prescribed protection after chemotherapy finishes. Follow individual home fluid advice.',source_ids=['nccp'])]
  if code=='00675':growth='Required after every administration. After ifosfamide/etoposide: daily injections on days 8–13 (source 0.5 million units/kg, maximum 48 million units/day for primary prevention). After vincristine/cyclophosphamide-containing treatment: pegylated injection 24–48 hours later. These support recovery of infection-fighting cells; fever still needs urgent assessment.'
  elif code=='00747':growth='Required after every administration. The local prescription selects the standard or pegylated product and timing; do not copy the two-week regimen’s days 8–13 schedule. These support recovery of infection-fighting cells; fever still needs urgent assessment.'
  else:growth='Cycles 1–2: daily injections on days 4–7 and 9–11 at the prescribed 5 micrograms/kg. Cycles 3–9: pegylated growth factor may be considered from day 4. These support marrow recovery; the later plan is not automatically the same as the early plan.'
  items += [dict(title='White-cell growth factor',text=growth,source_ids=['nccp']),dict(title='Mouth and bowel care',text='Use the prescribed mouth-care and constipation-prevention plan. Vincristine slows bowel movement through nerve effects; report painful constipation, vomiting or abdominal swelling promptly. Mouth care helps detect and manage damaged lining before drinking becomes difficult.',source_ids=['nccp','vincristine-pi'])]
  if code!='00754':items.append(dict(title='Radiotherapy and protective care',text='If pelvic radiotherapy is planned, additional mesna is prescribed with cyclophosphamide: 240 mg/m² intravenously before it, then 240 mg/m² intravenously or 480 mg/m² orally 4 and 8 hours from its start. Doxorubicin interruption depends on the radiation field; it is not reintroduced until at least three weeks after radiation ends. Confirm actual dates with both teams.',source_ids=['nccp']))
  else:items.append(dict(title='Individual infection and tumour-lysis prevention',text='The team considers Pneumocystis jirovecii pneumonia and antifungal prevention, and any tumour-lysis precautions. These are individual decisions here. Azole antifungals can increase vincristine toxicity; pharmacy must reconcile the plan.',source_ids=['nccp','vincristine-pi']))
 else:
  items += [dict(title='Infection prevention',text='Pneumocystis jirovecii pneumonia prevention is required with this temozolomide regimen. The prescribed medicine helps prevent an opportunistic lung infection; follow its full course and report new cough or breathlessness. Hepatitis B results may require a separate expert prevention and follow-up plan.',source_ids=['nccp','temozolomide-pi']),dict(title='Acute irinotecan reactions',text='Sweating, cramps and early diarrhoea during or soon after infusion can be a cholinergic reaction. Tell the nurse immediately. The national regimen says atropine should not be used in patients with glaucoma. Tell the treatment team if you have glaucoma. '+('This source specifies 250 micrograms under the skin before irinotecan; the team confirms the appropriate prescription.'if code=='00757'else'This source does not give a fixed atropine dose.'),source_ids=['nccp','irinotecan-pi']),dict(title='Delayed diarrhoea plan',text=f['urgent'].split(' Report a new cough')[0],source_ids=['nccp','irinotecan-pi']),dict(title='Capsules and missed or vomited doses',text=f['missed']+' If vomiting occurs after temozolomide, do not take an extra dose. Capsules must be swallowed whole, fasting, at least one hour before irinotecan.',source_ids=['nccp'])]
  if code=='00757':items.append(dict(title='Constipation and antifungal review',text='Constipation prevention is recommended because vincristine slows the bowel. Antifungal prophylaxis may be considered, but interacting azoles can increase nerve and bowel toxicity and require pharmacy review.',source_ids=['nccp','vincristine-pi']))
 return items

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--repo',required=True);ap.add_argument('--output',default=str(HERE/'overlay'));args=ap.parse_args()
 repo=pathlib.Path(args.repo).resolve();out=pathlib.Path(args.output).resolve()
 assert out!=repo and repo not in out.parents,'External draft only'
 s=module('facts64',HERE/'sarcoma-v08464-facts.py');h=module('factory58',repo/'tools/author-gu-patients-v08458.py')
 packet=json.loads((HERE/'source-review/agent-consent-definitions.json').read_text());h.VERSION=s.VERSION;h.DATE=s.DATE;h.SOURCE=s.SOURCES
 clinical=repo.parent/'sarcoma-batch5-drafts-20261118/protocols';paths={c:next(clinical.glob(c+'-*.json'))for c in s.ROUTES}
 sourcebase=repo.parent/'sarcoma-batch5-sources-20261118'
 for x in s.MANIFEST['sources']:
  assert sha(sourcebase/x['web_snapshot'])==x['web_snapshot_sha256']
  p=json.loads(paths[x['code']].read_text());assert str(p['metadata']['nccp_version'])==x['version'] and p['protocol_id']=='nccp-'+x['code']+'-v'+x['version']
 appfiles=[repo/x['existing_protocol_path']for x in s.MANIFEST['sources']];before={str(p.relative_to(repo)):sha(p)for p in appfiles}
 oldread=h.read
 def read(file):
  for code,path in paths.items():
   if file.startswith('protocols/')and '/'+code+'-'in file:return json.loads(path.read_text())
  return oldread(file)
 h.read=read;h.save=lambda file,obj:None
 facts=s.facts();kb=[];journeys={};support={};workflow=[];checks=[]
 for code,f in facts.items():
  distance=marker_check(f['anatomy']);d,p=h.build_profile(code,f)
  d.update(patient_route=code,independent_clinical_approval=False,indication_text=f['context'],administration_route='intravenous and oral'if code in ['00504','00757']else'intravenous')
  d['sources']=[x for x in d['sources']if x['id']!='ncis']
  d['sources'] += packet.get('sources',[])
  d['sources'] += [dict(id='nci-ewing',title='National Cancer Institute: Ewing sarcoma treatment context',url=s.NCI_EWING),dict(id='nci-rms',title='National Cancer Institute: rhabdomyosarcoma treatment context',url=s.NCI_RMS)]
  d['sources']=list({x['id']:x for x in d['sources']}.values())
  if code in ['00675','00747','00754']:
   d['sources'].append(dict(id='ifosfamide-mitoxana',title='HPRA Mitoxana product information: supplied-product reconciliation required',url='https://assets.hpra.ie/products/Human/15731/Licence_PA2299-028-001_11092023124600.pdf'))
  for agent in d['agents']:agent['source_ids']=['nccp',agent['id']+'-pi']
  d['source_provenance']=dict(checked=s.DATE,basis='Current official extracted regimen text and specifically retained primary evidence. No original NCCP PDF binary or source-table pixel verification claimed.',current_source=next(x for x in s.MANIFEST['sources']if x['code']==code),original_pdf_hash_verified=False,visual_table_review=False,external_draft=True,independent_clinical_approval=False,clinical_draft_status='Candidate input; independent source challenge still in progress. Final clinical hashes must be pinned before integration.',product_source_limits=packet.get('source_limits',[]))
  d['support_source_ids']=d['urgent_source_ids']=['nccp']+[a['id']+'-pi'for a in d['agents']]
  d['monitoring_test_details']=copy.deepcopy(f['tests']);d['monitoring_summary']='Use the named test cards and your individual sampling dates. Safety checks and tumour-response assessments answer different questions.'
  d['monitoring_schedule']['rows']=[dict(label='Tests and symptoms',cells=['Complete the baseline test plan.','Use the test-specific timing in the named cards.','Report symptoms promptly; extra tests may be needed.','Follow abnormal results and lasting effects until a plan is agreed.']),dict(label='Medicines and practical care',cells=['Confirm the phase, medicines, protection and contacts.','Record actual doses, administration number and any hold.','Follow the current support and contact plan.','Agree continuing support and line-care or removal needs.']),dict(label='Tumour and local-treatment review',cells=['Agree the treatment aim and baseline assessment.','Review benefit and local treatment at specialist-set dates.','Report changing tumour-related symptoms.','Agree the next treatment or follow-up plan.'])]
  d['monitoring_schedule']['note']='Safety monitoring is separate from scans and tumour-response review. The exact sequence can change after toxicity or local treatment.'
  chapter=next(x for x in d['chapters']if x['id']=='checks');chapter['intro']='The named monitoring cards describe each test’s purpose and timing.';chapter['items']=[dict(title='Your next tests',text='Confirm which samples and reviews are due, where they happen and who authorises the next dose.',source_ids=['nccp']),dict(title='Checking benefit',text='Normal blood tests do not show that cancer is responding. The specialist sets separate scan, symptom and local-treatment reviews.',source_ids=['nccp'])]
  items=support_items(code,f);d['support']=items+[dict(title='Access and practical care',text=f['access'],source_ids=['nccp']),dict(title='Fertility, pregnancy and breastfeeding',text=s.FERTILITY,source_ids=[a['id']+'-pi'for a in d['agents']]),dict(title='Your wider treatment plan',text=f['wider'],source_ids=f['wider_sources'])]
  schapter=next(x for x in d['chapters']if x['id']=='support');schapter['intro']='Use the medicine-specific support instructions and actual prescription.';schapter['items']=[dict(title='The written support plan',text='The support section explains why each protective measure is used. Confirm the dose, start day and finish day on your own prescription; do not combine alternative reference prescriptions.',source_ids=['nccp']),dict(title='Fertility and pregnancy',text=s.FERTILITY,source_ids=[a['id']+'-pi'for a in d['agents']])]
  d['chapters'][0]['items'][2]['source_ids']=f['wider_sources']
  d['logistics']['sections'][2]['title']='Intravenous access and practical care'
  d['logistics']['sections'][3]['text']='Check the support section and your prescription for current protective medicines, timing and contact instructions.'
  d['urgent_extra']=h.URGENT+' '+f['urgent'];d['chapters'][3]['items'][0]['text']=d['urgent_extra']
  generic=packet['generic_chemotherapy_risks'];d['consent_generic_risks']=generic
  d['consent_support']='Discuss realistic benefit and uncertainty, alternatives including clinical trials or symptom-focused care where appropriate, common and serious risks, lasting effects, personal priorities and the option to decline or reconsider treatment. '+f['scope']
  d['chapters'].append(dict(id='consent',title='Your treatment decision',intro='Read the general chemotherapy risks together with each medicine-specific section.',items=[dict(title='General chemotherapy risks',text=generic,source_ids=d['support_source_ids']),dict(title='Your priorities and alternatives',text=d['consent_support'],source_ids=['nccp','trial']),dict(title='Fertility, pregnancy and breastfeeding',text=s.FERTILITY,source_ids=[a['id']+'-pi'for a in d['agents']])]))
  d['questions'] += [dict(q='Can I restart after symptoms improve?',a='Only after the treating team confirms the new prescription. A normal test or recovered symptom does not erase previous severe toxicity or a permanent-stop decision.'),dict(q='How do local treatments fit?',a=f['wider'])]
  d['timeline_note']='Educational treatment days, not dated appointments or guaranteed safe days. Support timing and any changed sequence follow the actual prescription.'
  for row in d['timeline']:
   if row['id']=='monitor':row['text']='Follow the named test schedule and report symptoms promptly.'
  for group in d['day_groups']:
   if group['title']=='Between scheduled chemotherapy doses':group['body']='Continue the prescribed support and monitoring plan. Side effects can occur between visits.'
  if f.get('phase_cycles'):
   d['phase_cycles']=copy.deepcopy(f['phase_cycles'])
   d['phases']=[dict(id=x['id'],label=x['label'],short='Use the current administration number',cycles=[str(c)for c in x['cycles']],agents=x['agents'],detail=x['schedule_summary'])for x in f['phase_cycles']]
   d['passport_groups']=[dict(title=x['label'],agents=x['agents'])for x in f['phase_cycles']]
   d['timeline']=copy.deepcopy(f['phase_cycles'][0]['timeline'])
   d['day_groups']=[dict(start=1,end=f['days'],title='Use the phase chart for your numbered administration',body=f['schedule'],action='Confirm the phase and actual prescribed treatment days before every administration.')]
  summary=d['patient_summary'];summary['monitoring']=f['summary_monitoring'];summary['cycle_expectations']=['Side effects can occur on any day. Use the verified oncology contact plan if unwell.','Before leaving, confirm the next phase, tests, treatment and protective medicines.'];summary['preparation']=['Bring the medicine list and verified treatment/contact record. Report new symptoms before treatment.'];summary['card_cycle_count']=None;summary['card_record_note']=f['course']+'. Recording spaces do not prescribe duration.';summary['phases']=[dict(title=x['label'],text='Administration numbers: '+', '.join(str(c)for c in x['cycles'])+'. '+('Dactinomycin is optional, only if selected.'if x['id']=='vc'else'Use the confirmed medicine calendar.'))for x in f.get('phase_cycles',[])]or[dict(title='Treatment',text=f['label'])]
  summary['card_alert']='Check the numbered phase: drugs and protective medicines change. Report confusion, blood in urine or sudden illness urgently.'if code in ['00675','00747','00754']else'Diarrhoea: contact oncology promptly and use your written plan. Temozolomide fasting, at least one hour before irinotecan.'
  summary['cycle_blocks']=[dict(label='Treatment days',text=f['label']),dict(label='Protection and checks',text='Use the current phase-specific prescription and named monitoring plan.'),dict(label='Next review',text=f['course']+'. Your team confirms continuation.')]
  d=explain(d);save(out,f'data/patient-knowledge/{code}.json',d)
  p['metadata'].setdefault('source_boundary_notes',[]);entry=h.knowledge(code,f,d,p)
  entry.update(patient_route=code,independent_clinical_approval=False,treatment_setting=f['context'])
  entry['treatment_rationale'].update(line=f['context'],factors=['Exact pathology, disease extent, age-specific specialist pathway, previous exposure, organ safety, prior toxicity, interactions, local treatment and patient priorities.'],alternatives=[f['wider']])
  entry['patient_selection']['disease_and_biomarker_context']=[f['context']];entry['patient_selection']['important_cautions']=f['boundaries']+[f['scope'],f['caveat']]
  entry['supportive_care']['counselling']=[f['access'],s.FERTILITY];entry['supportive_care']['mechanism_and_timing']=items
  if code in ['00504','00757']:entry['supportive_care']['clinician_diarrhoea_reference']=s.DIARRHOEA_CLINICIAN
  entry['monitoring_and_toxicity'].update(test_specific_details=d['monitoring_test_details'],longitudinal_schedule=d['monitoring_schedule'],disease_monitoring='Specialist-set tumour, symptom and local-treatment review, separate from safety testing.')
  ev=evidence(code,f)
  safety=[x for x in ev['endpoints']if x['endpoint']=='Safety'];ev['endpoints']=[x for x in ev['endpoints']if x['endpoint']!='Safety']
  if safety:ev['harms']=' '.join(x['metric']+': '+x['result_text']+' '+x['limitations']for x in safety)
  entry['evidence_at_a_glance'].update(ev,applicability=f['caveat'],checked=s.DATE)
  entry['administration']['phase_calendars']=d.get('phase_cycles',[])
  entry['patient_resources']=[dict(label=label,url=f'patient/{code}/{file}')for label,file in [('Patient knowledge','knowledge.html'),('Consent discussion','consent-form.html'),('Treatment and monitoring','treatment-journey.html'),('Support medicines','supportive-care.html'),('Three-page pack','guide.pdf'),('Wallet card','sactcard.pdf'),('Full treatment reference','knowledge.pdf'),('Complete handbook','handbook.pdf')]]
  kb.append(explain(entry));plans=[]
  for id,label,names,risk in f['phases']:
   phase_items=copy.deepcopy(items)
   if id=='vin8':
    phase_items=[x for x in phase_items if x['title']in ['Infection prevention','Delayed diarrhoea plan','Constipation and antifungal review']]
    for item in phase_items:
     if item['title']=='Delayed diarrhoea plan':item['text']='Delayed diarrhoea from the earlier irinotecan can continue or start between visits. '+item['text'].split('Delayed diarrhoea begins',1)[1].replace(' more than 24 hours later and can cause','It can cause',1)
   phase_prep='Day 8 contains vincristine only; no scheduled irinotecan or temozolomide dose. Delayed diarrhoea from the earlier irinotecan can still occur; continue prescribed infection prevention and other support.'if id=='vin8'else f['prep']
   warnings=list(dict.fromkeys([x['text']for x in phase_items]+[phase_prep,'Follow the current prescription; an improved test result does not authorise restarting after a hold.']))
   display_risk='Overall high-risk regimen policy; confirm the final selected-drug plan'if code in ['00675','00747']and id=='vc'else risk
   plans.append(explain(dict(id=id,label=label,active_medicines=names,active_drugs=names,emetogenic_risk=display_risk,medicines=[dict(name='Individual anti-sickness prescription',dose='As prescribed by the oncology team',timing='Prevention, delayed-sickness and rescue timing are individually specified',note='Reconcile multi-day dosing and interactions; do not add a generic steroid course.')],additional_support=warnings,source_page='Treatment, monitoring and supportive-care sections',source_checked=s.DATE,source_url=s.SOURCES[code]['catalogue_url'],guidance=dict(label='Current national regimen and reconciled local prescription',url=s.SOURCES[code]['catalogue_url']))))
  support[code]=plans;workflow.append(dict(code=code,patient_route=code,protocol_id=d['protocol_id'],source_checked=s.DATE,phases=plans,clinical_source_boundaries=f['boundaries']))
  journeys[code]=dict(code=code,title=d['title']+': treatment and checks',release=s.VERSION,checked=s.DATE,status=h.STATUS,schedule_type='relative-educational',has_patient_dates=False,setting=d['context_label'],summary=d['schedule_summary'],stages=d['monitoring_schedule']['columns'],lanes=[dict(**r,kind='monitoring',source_ids=['nccp'],note=d['monitoring_schedule']['note'])for r in d['monitoring_schedule']['rows']],milestones=[dict(title='Treatment review',when=d['schedule_label'],why=d['purpose'],clinical=d['schedule_summary'],action=d['urgent_extra'],source_ids=['nccp'])],sources=d['sources'])
  assert 'urology'not in json.dumps(d).lower();assert len(d['patient_summary']['monitoring'])==5
  assert len({x['label']for x in d['monitoring_test_details']})==len(d['monitoring_test_details'])
  assert all(x['timing']not in [f['baseline'],f['monitoring'],f['baseline']+' '+f['monitoring']]for x in d['monitoring_test_details'])
  assert all(len(a['risks'])>=5 for a in d['agents'])and d['consent_generic_risks']
  checks.append(dict(code=code,route=code,protocol_id=d['protocol_id'],source_version=d['protocol_version'],anatomy_rows=8,minimum_marker_distance_mm=distance,summary_monitoring_rows=5,test_specific_cards=len(d['monitoring_test_details']),phase_charts=len(d.get('phase_cycles',[])),endpoints=len(ev['endpoints']),generic_and_agent_consent=True,independent_clinical_approval=False))
 save(out,'data/regimen-knowledge-base-v08464-addendum.DRAFT.json',dict(schema_version='1.0',release=s.VERSION,regimen_profiles=kb))
 for file,obj in [('journey-fragments.json',journeys),('base-phase-support.json',support),('workflow-fragments.json',workflow),('presentation-routes.json',{c:f'data/patient-knowledge/{c}.json'for c in s.ROUTES}),('authored-facts.json',facts)]:save(out,'draft-integration/'+file,obj)
 assert before=={str(p.relative_to(repo)):sha(p)for p in appfiles}
 save(out,'draft-integration/input-manifest.json',dict(factory_sha256=sha(repo/'tools/author-gu-patients-v08458.py'),clinical_inputs={c:dict(path=str(p),sha256=sha(p),status='candidate pending final source challenge')for c,p in paths.items()},source_manifest_sha256=sha(HERE/'source-review/nccp-source-manifest.json'),primary_evidence_packet_sha256=sha(repo.parent/'sarcoma-batch5-primary-evidence-20261118/EVIDENCE-PACKET.md')))
 save(out,'draft-integration/draft-checks.json',dict(checks=checks,application_files_unchanged=True,clinical_freeze='pending final source challenge',actual_rendered_visual_review='not run',pdf_and_qr='not run',independent_clinical_approval=False))
 print('Wrote five external patient candidates and clinician/support/journey fragments; clinical final freeze and rendered document validation remain pending.')
if __name__=='__main__':main()
