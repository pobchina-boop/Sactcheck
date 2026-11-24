#!/usr/bin/env python3
"""Author five reviewed sarcoma profiles; preview externally or apply after release authorization.

Application mode is only accepted after installation in the target repository tools.
No protocol, registry, release, HTML or PDF mutations are performed here.
"""
import argparse,copy,hashlib,importlib.util,json,math,pathlib,re
HERE=pathlib.Path(__file__).resolve().parent
def module(name,path):
 spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def strings(x):
 if isinstance(x,str):yield x
 elif isinstance(x,list):
  for v in x:yield from strings(v)
 elif isinstance(x,dict):
  for v in x.values():yield from strings(v)
def explain(x):
 # Profile text is consumed directly by the handbook; HTML decoration alone
 # cannot repair unexplained acronyms in this source. Prefer full terms.
 if isinstance(x,str):
  if x.startswith(('https://','http://')):return x
  x=x.replace('human immunodeficiency virus (HIV)','human immunodeficiency virus')
  x=x.replace('AIDS means acquired immunodeficiency syndrome. ','')
  for old,new in [('NCCP','National Cancer Control Programme'),('HIV','human immunodeficiency virus'),('AIDS','acquired immunodeficiency syndrome'),('EORTC','European Organisation for Research and Treatment of Cancer'),('EMA','European Medicines Agency'),('QR','quick response code')]:x=re.sub(r'\b'+old+r'\b',new,x)
  return x
 if isinstance(x,list):return [explain(v)for v in x]
 if isinstance(x,dict):return {k:explain(v)if k not in ['id','source_ids','protocol_id','patient_route','context_protocol_indication','code']else v for k,v in x.items()}
 return x
def marker_check(rows):
 assert len(rows)==8 and len({x[0]for x in rows})==8
 pairs=[]
 for i,a in enumerate(rows):
  for b in rows[i+1:]:
   mm=math.hypot((a[4]-b[4])*66.442/100,(a[5]-b[5])*146/100)
   assert mm>=7,f'Overlapping anatomy markers: {a[0]} and {b[0]} ({mm:.2f} mm)'
   pairs.append(mm)
 return round(min(pairs),3)

def summary_monitoring(code):
 def row(stage,test,when,basis='Regimen / product'):
  return dict(stage=stage,test=test,when=when,basis=basis)
 response=row('Review','Tumour, symptoms and function','The specialist sets scan and clinical-review timing.','Individual plan')
 rows={
 '00374':[
  row('Bloods','Blood count, liver and muscle enzymes','Before treatment; weekly for the first 2 cycles, then at least once between doses. Blood count/liver also before each cycle.','Regimen / product'),
  row('Bloods','Kidney function','Before treatment and each cycle; extra tests if unwell or results change.'),
  row('Heart','Heart pumping assessment','Heart ultrasound or pumping scan before treatment and every 2–3 months until stopping.'),
  row('Infusion','Line and pump','Check at connection and disconnection; report pain, swelling, leakage or pump problems promptly.'),response],
 '00228':[
  row('Bloods','Full blood count','Before treatment and both day 1 and day 8 treatment decisions.'),
  row('Bloods','Kidney and liver tests','Before treatment and at cycle start; sooner if symptoms or results change.'),
  row('Checks','Nerve function','Before further doses; report changing numbness, weakness or difficulty walking.'),
  row('If needed','Heart rhythm and electrolytes','Heart tracing and electrolyte tests when heart history, medicines or other rhythm risks indicate them.'),response],
 '00205':[
  row('Bloods','Blood count, kidney and liver','Before treatment and each cycle; sooner if symptoms or results change.'),
  row('Heart','Heart tracing and pumping','Both before treatment; regular tracings. Check pumping before each further dose taking lifetime anthracycline exposure above 450 mg/m².'),
  row('Checks','Mouth, palms and soles','Before each cycle; report soreness between visits and describe the worst symptoms.'),response],
 '00462':[
  row('Bloods','Blood count, kidney and liver','Before treatment and each cycle; sooner if symptoms or results change.'),
  row('Heart','Heart tracing and pumping','Both before treatment; regular tracings. Check pumping before each further dose taking lifetime anthracycline exposure above 450 mg/m².'),
  row('Checks','Mouth, palms and soles','Before each cycle; report soreness between visits.'),
  row('Other','Immune review and lactate dehydrogenase','Immune review before treatment and at team-set intervals. Lactate dehydrogenase blood test before treatment, then when indicated.','Regimen'),response],
 '00554':[
  row('Bloods','Full blood count','Before treatment and each cycle; review current counts before every dose, including days 8 and 15. The team confirms sample dates.'),
  row('Bloods','Kidney and liver tests','Before treatment and each cycle; sooner if unwell or results change.'),
  row('Chest','Chest and breathing','Chest X-ray before treatment; investigate new dry cough or breathlessness promptly.'),
  row('Checks','Mouth, bowel and nerves','Review before further doses; report new ulcers, bowel symptoms, numbness, weakness, hearing or balance changes.'),response]
 }
 return rows[code]

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--repo',required=True);ap.add_argument('--output',default=str(HERE.parent/'preview-overlay'));ap.add_argument('--apply',action='store_true');args=ap.parse_args()
 repo=pathlib.Path(args.repo).resolve();out=repo if args.apply else pathlib.Path(args.output).resolve()
 if args.apply and HERE!=repo/'tools':raise SystemExit('Application mode requires the reviewed author installed in the repository tools directory.')
 if not args.apply and(out==repo or repo in out.parents):raise SystemExit('Preview output must stay outside the application repository.')
 s=module('sarcoma_facts62',HERE/'sarcoma-v08462-facts.py');h=module('patient_factory58',repo/'tools/author-gu-patients-v08458.py')
 h.VERSION=s.VERSION;h.DATE=s.DATE;h.SOURCE=s.SOURCES
 app_paths={code:repo/next(x['path']for x in h.INDEX if '/'+code+'-'in x['path'])for code in s.ROUTES}
 clinical=repo.parent/'sarcoma-batch3-drafts-20261118'
 paths=app_paths if args.apply else {'00374':clinical/'protocols/00374-trabectedin-monotherapy.json','00554':clinical/'protocols/00554-vinblastine-and-methotrexate-therapy.json','00205':clinical/'pld-protocols/00205-pegylated-liposomal-doxorubicin.json','00462':clinical/'pld-protocols/00462-pegylated-liposomal-doxorubicin-20-mg-m2-21-day.json','00228':clinical/'application-draft/protocols/breast/00228-eribulin-monotherapy.json'}
 manifest_path=repo/'validation/sarcoma-v08462/patient-authoring/current-source-manifest.json'if args.apply else HERE.parent/'source-evidence/current-source-manifest.json'
 # Validate the whole batch before the inherited factory can emit even one profile.
 manifest=json.loads(manifest_path.read_text());current={x['code']:x for x in manifest['sources']}
 for source in manifest['sources']:
  artifact=manifest_path.parent/source['artifact'];assert artifact.is_file()and sha(artifact)==source['artifact_sha256'],'Missing or changed retained source text: '+source['code']
 for code,path in paths.items():
  p=json.loads(path.read_text());expected='nccp-'+code+'-v'+s.SOURCES[code]['version']
  assert str(p['metadata']['nccp_version'])==s.SOURCES[code]['version'],f'Unexpected version before authoring: {code}'
  assert p['protocol_id']==expected,f'Unexpected protocol ID before authoring: {code}'
  assert current[code],f'Missing source provenance: {code}'
 oldread=h.read
 def read(file):
  for code,path in paths.items():
   if file.startswith('protocols/') and '/'+code+'-'in file:return json.loads(path.read_text())
  return oldread(file)
 h.read=read
 protected=[]
 for code in ['00228','00205']:
  protected.append(repo/f'data/patient-knowledge/{code}.json')
  for base in [repo/f'patient/{code}',repo/f'docs/patient/{code}']:
   context=s.ROUTES[code].split('/')[1]
   protected.extend(p for p in base.rglob('*')if p.is_file()and context not in p.relative_to(base).parts)
 protected.extend(app_paths.values())
 hashes={str(p.relative_to(repo)):sha(p)for p in protected if p.is_file()}
 guard=repo/'validation/sarcoma-v08462/patient-authoring/protected-application-manifest.json'
 if args.apply and guard.exists():
  original=json.loads(guard.read_text())
  assert hashes==original,'Protected breast profiles/routes/mirrors or clinical source files differ from the original authoring baseline.'
 def target(file):
  for code,route in s.ROUTES.items():
   if file==f'data/patient-knowledge/{code}.json' and '/'in route:return 'data/patient-knowledge-contexts/'+route+'.json'
  if args.apply:file=file.replace('.DRAFT.json','.json').replace('draft-integration/','validation/sarcoma-v08462/patient-authoring/')
  return file
 def save(file,obj):
  path=out/target(file);path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
 h.save=save
 facts=s.facts()
 workflow=oldread('data/regimen-workflow-v0750.json');kb=[];journeys={};phases_base={};phases_context={};workflow_fragments=[];presentation={};checks=[]
 for code,f in facts.items():
  patient_facts=copy.deepcopy(f)
  if code=='00462':patient_facts['administration']='The team confirms the exact infusion time and appointment length on your prescription. The first infusion is given cautiously with close observation; a previous reaction changes the supervised plan. Use only pegylated liposomal doxorubicin, prepared by the treatment service in the correct glucose solution. Your oncology and pharmacy teams must agree the infusion instructions before treatment.'
  distance=marker_check(f['anatomy']);d,p=h.build_profile(code,patient_facts);route=s.ROUTES[code];context=route.split('/')[1]if'/'in route else None
  assert str(p['metadata']['nccp_version'])==s.SOURCES[code]['version']
  d.update(indication_text=f['context'],administration_route='intravenous',independent_clinical_approval=False,patient_route=route)
  d['source_provenance']=dict(checked=s.DATE,basis='Current official web-extracted regimen text and cited product information; no original PDF bytes or visual source-table verification claimed.',current_source=current[code],source_version_note=s.SOURCES[code].get('version_note'),original_pdf_hash_verified=False,visual_table_review=False,clinical_and_pharmacy_approval=False,external_draft=not args.apply)
  d['sources']=[x for x in d['sources']if x['id']!='ncis']
  d['sources'][0]['title']=f"National Cancer Control Programme {code}, version {s.SOURCES[code]['version']}"
  for a in d['agents']:
   a['source_ids']=['nccp',a['id']+'-pi'];title,url=s.PRODUCTS[a['id']];d['sources'].append(dict(id=a['id']+'-pi',title=title,url=url))
  if code=='00374':
   d['sources'].append(dict(id='final-survival',title='Final overall-survival analysis of trabectedin versus dacarbazine',url='https://pubmed.ncbi.nlm.nih.gov/31173362/'));d['evidence']['source_ids'].append('final-survival')
  if code=='00228':
   d['sources'].append(dict(id='eribulin-manufacturer',title='Manufacturer Halaven product information, updated December 2024; readable supplement to rate-limited EMA retrieval',url='https://www.medicines.org.uk/EMC/medicine/24382/SPC/Halaven%2B0.44%2Bmg%2Bml%2Bsolution%2Bfor%2Binjection'))
   d['source_provenance']['product_retrieval_limit']='EMA complete-document follow-up was rate-limited; readable current manufacturer product text and official regulatory excerpts supplement the initial EMA read.'
  if code=='00554':
   d['sources'].append(dict(id='desmopaz',title='DESMOPAZ: non-comparative randomised phase II desmoid study',url='https://pubmed.ncbi.nlm.nih.gov/31331699/'));d['evidence']['source_ids'].append('desmopaz')
  wider_sources=['nccp']
  if code in ['00374','00228','00205','00554']:
   wider_sources=['nci-desmoid']if code=='00554'else['nci-sarcoma','nci-support']
   d['sources'].extend([dict(id='nci-sarcoma',title='National Cancer Institute: soft tissue sarcoma treatment context',url='https://www.cancer.gov/types/soft-tissue-sarcoma/hp/adult-soft-tissue-treatment-pdq'),dict(id='nci-desmoid',title='National Cancer Institute: desmoid tumour observation and treatment context',url='https://www.cancer.gov/pediatric-adult-rare-tumor/rare-tumors/rare-soft-tissue-tumors/desmoid-tumor'),dict(id='nci-support',title='National Cancer Institute: palliative and supportive care alongside cancer treatment',url='https://www.cancer.gov/about-cancer/advanced-cancer/care-choices/palliative-care-fact-sheet')])
   d['sources']=[x for x in d['sources']if not x['id'].startswith('nci-')or x['id']in wider_sources]
   d['support'][3]['source_ids']=wider_sources
   d['chapters'][0]['items'][2]['source_ids']=wider_sources
  d['urgent_source_ids']=['nccp']+[a['id']+'-pi'for a in d['agents']]
  d['support_source_ids']=list(dict.fromkeys(d['urgent_source_ids']+wider_sources))
  d['timeline_note']='Illustrative treatment days, not dated appointments or guaranteed safe days. Your team confirms the actual doses, delays, support and appointments.'
  for row in d['timeline']:
   if row['id']=='monitor':row['text']='Keep the individual test schedule and report symptoms promptly. Safety checks and tumour-response reviews have different purposes.'
  for group in d['day_groups']:
   if group['title']=='Between scheduled chemotherapy doses':group['body']='Continue the prescribed support and monitoring plan. Side effects can occur between visits; contact oncology promptly if unwell.'
  if code=='00374':
   d['port_pump']=True
   d['timeline'].append(dict(id='dexamethasone',label='Dexamethasone premedication',start=1,end=1,style='support',text='Dexamethasone 20 mg intravenously 30 minutes before trabectedin; reconcile the complete anti-sickness prescription.'))
   d['pump_steps']=[['Before treatment','Choose central venous access','Central access is strongly recommended. The team explains insertion, infection prevention, dressing and flushing.'],['Before connection','Confirm training and contacts','Obtain spill/leak instructions, pump guidance and verified daytime/out-of-hours contacts.'],['Day 1','Connect the prescribed infusion','Trained staff connect a 24-hour trabectedin infusion after the required premedication.'],['During the next 24 hours','Follow the pump and line plan','Do not alter settings or disconnect the pump. Report alarms, leakage, pain, swelling or fever promptly.'],['After 24 hours from connection','Professional disconnection','Attend at the actual prescribed finish time. An apparently empty pump does not authorise self-disconnection.'],['After treatment','Continue line care','Pump disconnection does not remove a port or catheter. Agree ongoing care and any separate removal appointment.']]
  if code=='00554':
   d['timeline'].append(dict(id='planned-break',label='Planned treatment break',start=22,end=28,style='break',text='No scheduled chemotherapy dose on day 22. Monitoring and symptom reporting continue during the break.'))
  d['monitoring_test_details']=copy.deepcopy(f['tests'])
  d['monitoring_summary']='Use the test-specific schedule below. Blood tests, organ checks and tumour-response assessments answer different questions.'
  d['monitoring_schedule']['rows']=[dict(label='Safety tests and symptoms',cells=['Complete the individual baseline test plan.','Repeat the tests at the timing specified in the test cards.','Report symptoms promptly; extra checks may be needed.','Follow abnormal results and lasting effects until a plan is agreed.']),dict(label='Medicines and practical care',cells=['Confirm treatment, support and access arrangements.','Record actual doses and any safety hold.','Follow the written support and contact plan.','Agree continuing support and line-care or removal needs.']),dict(label='Tumour review and next steps',cells=['Agree the treatment aim and baseline assessment.','Review benefit using the specialist plan.','Report new or changing tumour-related symptoms.','Agree the next treatment or follow-up plan.'])]
  d['monitoring_schedule']['note']='Safety testing and tumour-response assessment have different purposes. Your plan may change after illness or a dose adjustment.'
  chapter=next(c for c in d['chapters']if c['id']=='checks');chapter['intro']='Each test has a specific purpose. Use the individual test cards in the monitoring section.';chapter['items']=[dict(title='Your next tests',text='Before leaving, confirm which tests are due, where they will be done and who reviews the results before treatment.',source_ids=['nccp']),dict(title='Safety is different from benefit',text='Normal safety blood tests do not show whether the tumour is responding. Your specialist sets the separate scan, symptom and function review.',source_ids=['nccp'])]
  d['support'][2]['text']=s.FERTILITY;d['support'][2]['source_ids']=[a['id']+'-pi'for a in d['agents']]
  fertility=s.FERTILITY
  if code=='00228':
   fertility+=' The readable current manufacturer information specifies highly effective contraception for women during treatment and for 7 months afterwards, and effective contraception for men with partners who could become pregnant during treatment and for 4 months afterwards. Confirm the supplied product and personal plan.'
   d['support'][2]['source_ids'].append('eribulin-manufacturer')
  if code in ['00205','00462']:
   fertility+=' Current European product information specifies effective contraception for women during treatment and for 8 months afterwards, and for men with partners who could become pregnant during treatment and for 6 months afterwards. Stop breastfeeding before treatment. Pregnancy requires a specialist benefit–risk decision.'
  d['support'][2]['text']=fertility
  d['chapters'][2]['items'][2]['text']=fertility;d['chapters'][2]['items'][2]['source_ids']=d['support'][2]['source_ids']
  if code=='00462':
   d['support'][3]['source_ids']=['nccp','pld-pi'];d['chapters'][0]['items'][2]['source_ids']=['nccp','pld-pi']
  d['chapters'][2]['items'][1]['title']='Intravenous access and line care';d['logistics']['sections'][2]['title']='Intravenous access and line care'
  d['urgent_extra']=h.URGENT+' '+f['urgent'];d['chapters'][3]['items'][0]['text']=d['urgent_extra']
  d['consent_support']='Discuss realistic benefit, uncertainty, alternatives including observation or symptom-focused care when appropriate, serious and lasting risks, personal priorities and the option to decline or reconsider treatment. '+f['scope']
  d['consent_generic_risks']=s.GENERIC
  d['chapters'].append(dict(id='consent',title='Your treatment decision',intro='Read the general chemotherapy risks and the individual medicine risks together.',items=[dict(title='General chemotherapy risks',text=s.GENERIC,source_ids=d['support_source_ids']),dict(title='Your priorities and alternatives',text=d['consent_support'],source_ids=['nccp']),dict(title='Fertility, pregnancy and breastfeeding',text=fertility,source_ids=d['support'][2]['source_ids'])]))
  if code=='00554':d['chapters'][-1]['items'][1]['source_ids']=['nccp','vinblastine-pi','methotrexate-pi']
  d['questions'] += [dict(q='Can I restart after a delay or safety hold?',a='Only after the treating team gives an explicit plan. A normal result does not erase a previous severe reaction or permanent-stop decision.'),dict(q='Are safety tests the same as checking benefit?',a='No. Safety tests look for treatment effects on the body. Scans, symptoms and function help the specialist assess tumour control.'),dict(q='How do other treatments fit?',a=f['wider'])]
  if code=='00228':d['support'].append(dict(title='Driving and daily tasks',text='Do not drive or operate machinery when dizzy, unusually tired, weak or affected by nerve symptoms. Discuss adaptations and help with daily tasks.',source_ids=['eribulin-pi']))
  if code=='00554':d['support'].append(dict(title='Skin protection, vaccines and procedures',text='Use sun protection and report a blistering rash urgently. Ask oncology before vaccination, new medicines or procedures; do not take folate or rescue medicines without a specific prescription.',source_ids=['methotrexate-pi','vinblastine-pi']))
  summary=d['patient_summary'];summary['monitoring']=summary_monitoring(code)
  summary['cycle_expectations']=['Side effects can occur on any day. Use the verified oncology contact plan if unwell.','Confirm the next treatment, blood tests and prescribed support before leaving.'];summary['preparation']=['Bring your medicine list and verified treatment/contact record. Report new symptoms before treatment.'];summary['card_cycle_count']=None;summary['card_record_note']=f['course']+'. Recording spaces do not prescribe duration.';summary['cycle_blocks']=[dict(label='Treatment days',text=f['label']),dict(label='Support and checks',text='Follow the written medicines, tests and symptom-contact plan.'),dict(label='Next review',text=f['course']+'. Your team confirms continuation.')]
  if code=='00374':summary['card_alert']='24-hour infusion: confirm professional disconnection. Muscle pain, dark urine or line pain needs urgent advice.'
  if code=='00228':summary['card_alert']='Eribulin base dosing. Day 8 needs its own review; report new numbness or weakness.'
  if code in ['00205','00462']:summary['card_alert']='Pegylated liposomal product only. Report painful hands/feet, mouth ulcers and new breathlessness.'
  if code=='00462':
   d['title']=summary['card_title']='Pegylated liposomal doxorubicin for Kaposi sarcoma';summary['purpose']='Control Kaposi disease and symptoms alongside the specialist infection and immune-care plan.'
  if code=='00554':summary['card_alert']='Injected doses on days 1, 8 and 15; day 22 is a break. New dry cough or severe mouth ulcers needs urgent advice.'
  if context:d['patient_context']=d['context_id']=context;d['context_protocol_indication']='00228b'if code=='00228'else'00205c'
  d=explain(d)
  save(f'data/patient-knowledge/{code}.json',d)
  p['metadata'].setdefault('source_boundary_notes',[])
  original_eligibility=copy.deepcopy(p['eligibility'])
  if code=='00228':original_eligibility=[x for x in original_eligibility if'breast'not in x.lower()]
  if code=='00205':original_eligibility=[f['context'],'Sarcoma performance-status range 0–2; do not reuse the 0–3 range of other listed cancers.']
  p['eligibility']={'setting':f['context'],'applicable_source_eligibility':original_eligibility,'current_source_boundaries':f['boundaries'],'clinical_rules_ref':str(app_paths[code].relative_to(repo)),'note':'Clinical rules retain the complete source-specific eligibility, current and historical toxicity checks. This knowledge orientation does not authorise dosing.'}
  entry=h.knowledge(code,f,d,p);entry.update(patient_context=context,patient_route=route,independent_clinical_approval=False,treatment_setting=f['context'])
  entry['treatment_rationale'].update(line=f['context'],factors=['Exact pathology, disease extent, previous treatment and cumulative exposure, daily function, organ safety, interactions and patient priorities.'],alternatives=[f['wider']])
  entry['patient_selection']['disease_and_biomarker_context']=[f['context']];entry['patient_selection']['important_cautions']=f['boundaries']+[f['scope'],f['caveat']]
  entry['supportive_care']['counselling']=[f['access'],fertility];entry['monitoring_and_toxicity']['test_specific_details']=d['monitoring_test_details'];entry['monitoring_and_toxicity']['longitudinal_schedule']=d['monitoring_schedule'];entry['monitoring_and_toxicity']['disease_monitoring']='Specialist-set tumour, symptom and function review; separate from safety testing.';entry['evidence_at_a_glance']['applicability']=f['caveat']
  numbers={
   '00374':[dict(endpoint='Median progression-free survival',result='4.2 months with trabectedin versus 1.5 months with dacarbazine; hazard ratio 0.55',population='Previously treated liposarcoma or leiomyosarcoma after anthracycline and another systemic regimen',source=f['trial_url']),dict(endpoint='Final median overall survival',result='13.7 versus 13.1 months; no statistically significant improvement (P=0.49)',population='Final 577-patient survival population; do not confuse with the earlier 518-patient progression analysis',source='https://pubmed.ncbi.nlm.nih.gov/31173362/')],
   '00228':[dict(endpoint='Median overall survival in the prespecified liposarcoma subgroup',result='15.6 months with eribulin versus 8.4 months with dacarbazine; hazard ratio 0.51, 95% confidence interval 0.35–0.75',population='Advanced dedifferentiated, myxoid/round-cell or pleomorphic liposarcoma after at least two prior systemic regimens; subgroup result, not an individual prognosis',source=f['trial_url'])],
   '00205':[dict(endpoint='Observed response in a small randomised phase II trial',result='10% with pegylated liposomal doxorubicin versus 9% with conventional doxorubicin',population='94 eligible advanced-sarcoma patients; 50 versus 44 treated, historical mixed histologies including gastrointestinal stromal tumours. Not a non-inferiority or survival conclusion',source=f['trial_url'])],
   '00462':[dict(endpoint='Tumour response in the historical 21-day Kaposi trial',result='58.7% with pegylated liposomal doxorubicin versus 23.3% with bleomycin/vincristine',population='241 patients with HIV-related Kaposi sarcoma; 20 mg/m² every three weeks for six cycles. Not the separate 14-day trial or a contemporary individual forecast',source=f['trial_url'])],
   '00554':[dict(endpoint='Partial response in a historical single-arm phase II study',result='12 of 30 patients (40%); other patients had stability/minor shrinkage with symptom relief',population='Advanced inoperable aggressive fibromatosis treated continuously weekly with methotrexate 30/vinblastine 6 mg/m². Different from the NCCP day-22 break; not a validated response estimate for the exact current schedule',source=f['trial_url'])]}
  endpoint_types={'00374':['PFS','OS'],'00228':['OS'],'00205':['ORR'],'00462':['ORR'],'00554':['ORR']}
  trial_populations={
   '00374':'Adults with advanced liposarcoma or leiomyosarcoma after an anthracycline and at least one additional systemic regimen.',
   '00228':'Adults with advanced dedifferentiated, myxoid/round-cell or pleomorphic liposarcoma after at least two prior systemic regimens; the prespecified liposarcoma subgroup.',
   '00205':'94 eligible patients with advanced or metastatic soft tissue sarcoma in a historical mixed-histology phase II study, including a substantial gastrointestinal stromal tumour component.',
   '00462':'241 patients with HIV-related Kaposi sarcoma in a historical trial using 20 mg/m² every three weeks for six cycles.',
   '00554':'30 patients with primary or recurrent advanced inoperable aggressive fibromatosis, treated continuously weekly in a historical single-arm study.'}
  comparisons={
   '00374':'Trabectedin 1.5 mg/m² over 24 hours versus dacarbazine 1 g/m², both every three weeks.',
   '00228':'Eribulin 1.4 mg/m² mesilate salt (equivalent to 1.23 mg/m² base) on days 1 and 8 every 21 days versus investigator-selected dacarbazine 850, 1000 or 1200 mg/m² every 21 days.',
   '00205':'Pegylated liposomal doxorubicin 50 mg/m² every four weeks versus conventional doxorubicin 75 mg/m² every three weeks.',
   '00462':'Pegylated liposomal doxorubicin 20 mg/m² versus bleomycin/vincristine, every three weeks for six cycles.',
   '00554':'Single-arm methotrexate 30 mg/m² plus vinblastine 6 mg/m² continuously weekly; no concurrent comparator and no planned NCCP day-22 break.'}
  entry['evidence_at_a_glance']['population']=trial_populations[code]
  entry['evidence_at_a_glance']['comparison']=comparisons[code]
  entry['evidence_at_a_glance']['endpoints']=[dict(endpoint=endpoint_types[code][i],metric=n['endpoint'],result_text=n['result'],interpretation=n['population'],limitations=f['caveat'],analysis_status='Published study result; applicability limited to the stated population and schedule',sources=[dict(label='Primary trial publication',url=n['source'])])for i,n in enumerate(numbers[code])]
  entry['evidence_at_a_glance']['checked']=s.DATE
  entry['patient_resources']=[dict(label=label,url=f'patient/{route}/{file}')for label,file in [('Patient knowledge','knowledge.html'),('Consent discussion','consent-form.html'),('Treatment and monitoring','treatment-journey.html'),('Support medicines','supportive-care.html'),('Three-page pack','guide.pdf'),('Full treatment reference','knowledge.pdf'),('Complete handbook','handbook.pdf')]];kb.append(explain(entry))
  key=code+':'+context if context else code
  journeys[key]=dict(code=code,context=context,title=d['title']+': treatment and checks',release=s.VERSION,checked=s.DATE,status=h.STATUS,schedule_type='relative-educational',has_patient_dates=False,setting=d['context_label'],summary=d['schedule_summary'],stages=d['monitoring_schedule']['columns'],lanes=[dict(**r,kind='monitoring',source_ids=['nccp'],note=d['monitoring_schedule']['note'])for r in d['monitoring_schedule']['rows']],milestones=[dict(title='Treatment review',when=d['schedule_label'],why=d['purpose'],clinical=d['schedule_summary'],action=d['urgent_extra'],source_ids=['nccp'])],sources=d['sources'])
  plans=[]
  for phase_id,label,names,risk in f['phases']:
   base=copy.deepcopy(workflow['antiemetic_plans']['moderate'if risk=='moderate'else'low'])
   medicines=[dict(name='Individual anti-sickness prescription',dose='Prescribed by the oncology team',timing='The team specifies prevention, delayed-sickness and rescue timing',note='Reconcile interactions and the actual support prescription; this reference does not authorise self-treatment.')]
   if code=='00374':medicines.insert(0,dict(name='Dexamethasone',dose='20 mg intravenously',timing='30 minutes before every trabectedin infusion',note='Required anti-sickness premedication that appears to help reduce liver toxicity. Do not add the generic 8 mg steroid reference on top; reconcile all support steroids.'))
   sid=base.get('local_prescription_source_id');local=dict(label=workflow['sources'][sid]['label'],note=base['local_adjunct_note']+' This historical local proforma needs current pharmacy confirmation. It is an alternative reference, not a second course to add automatically.',items=base['local_prescription_items'])if sid else None
   if code=='00554' and local:local['note']+=' Methotrexate interactions, constipation and mouth ulcers need individual review; this list does not authorise an acid-suppressing, bowel or folate prescription.'
   warnings=[f['support'],f['prep'],f['access'],'An improved test result does not authorise restarting after a safety hold; confirm the new prescription.']
   warnings+=base.get('warnings',[])
   if code=='00374':
    warnings=['Only optional additional antiemetic steroid may be adjusted after prescription reconciliation. Retain the required dexamethasone 20 mg intravenously 30 minutes before every trabectedin infusion; the generic omission advice does not apply to this required premedication.'if 'Dexamethasone may be modified or omitted' in x else x for x in warnings]
   if code=='00228':warnings.append('Review heart-rhythm risk and electrolytes before choosing anti-sickness medicines that can affect the QT electrical interval.')
   row=dict(id=phase_id,label=label,active_medicines=names,active_drugs=names,emetogenic_risk=risk,medicines=medicines,additional_support=list(dict.fromkeys(warnings)),source_page='Treatment, monitoring, administration and supportive-care sections',source_checked=s.DATE,source_url=s.SOURCES[code]['catalogue_url'],guidance=dict(label='Current regimen and individually reconciled support prescription',url=s.SOURCES[code]['catalogue_url']))
   if local:row['local_reference']=local
   # Display reference frequencies in full words; retain exact source values in
   # the separate immutable source archive, not unexplained patient acronyms.
   row=explain(row)
   for item in row.get('local_reference',{}).get('items',[]):
    item['route']={'PO':'by mouth'}.get(item.get('route'),item.get('route'))
    for field in ['frequency','timing','dose']:
     if field in item:
      for old,new in [('TDS','three times daily'),('QDS','four times daily'),('OD','once daily'),('PRN','as required'),('STAT','once initially')]:item[field]=re.sub(r'\b'+old+r'\b',new,item[field])
   row['additional_support']=[re.sub(r'\bTDS\b','three times daily',x)for x in row['additional_support']]
   row['additional_support']=[x.replace('SACT','systemic anticancer therapy').replace('EMA/Irish','European/Irish')for x in row['additional_support']]
   assert len(row['additional_support'])==len(set(row['additional_support']))
   plans.append(row)
  if context:phases_context.setdefault(code,{})[context]=plans
  else:phases_base[code]=plans
  workflow_fragments.append(dict(code=code,patient_context=context,patient_route=route,protocol_id=d['protocol_id'],source_checked=s.DATE,phases=plans,clinical_source_boundaries=f['boundaries']))
  presentation[route]=target(f'data/patient-knowledge/{code}.json')
  assert 'urology'not in json.dumps(d).lower()
  assert len(d['agents'])==(2 if code=='00554'else 1) and all(len(a['risks'])>=5 for a in d['agents'])
  assert all(t['timing'] not in [f['baseline'],f['monitoring'],f['baseline']+' '+f['monitoring']]for t in d['monitoring_test_details'])
  assert 'General chemotherapy risks'in json.dumps(d) and d['consent_generic_risks']
  unexplained=[x for x in strings(d)if re.search(r'\b(?:FBC|CPK|ECG|ECHO|MUGA|LVEF|PPE|MTX|G-CSF|PPI|NSAIDs|CrCl|ULN|PICC)\b',x)and not x.startswith('http')]
  assert not unexplained,unexplained
  checks.append(dict(code=code,route=route,protocol_id=d['protocol_id'],version=d['protocol_version'],anatomy_rows=8,minimum_marker_distance_mm=distance,test_specific_cards=len(d['monitoring_test_details']),generic_and_agent_consent=True,profile_acronym_check=True,context_preserved=context is not None,independent_clinical_approval=False))
 bases=[];contexts=[]
 for entry in kb:
  context=entry['patient_context']
  if context:
   entry.update(context_id=context,context_label='Liposarcoma'if context=='liposarcoma'else'Soft-tissue sarcoma',journey_key=entry['patient_route'].replace('/',':'));contexts.append(entry)
  else:bases.append(entry)
 # Keep the separately accepted, complete prior-pair clinician corrections on
 # any later scoped patient regeneration; historical v60 inputs remain untouched.
 if args.apply:
  existing_kb=repo/'data/regimen-knowledge-base-v08462-addendum.json'
  if existing_kb.exists():
   for extra in json.loads(existing_kb.read_text()).get('regimen_profiles',[]):
    if extra.get('protocol_id')in ['nccp-00391-v5','nccp-00392-v5']:
     assert extra.get('clinical_knowledge_revision')=='0.84.62','Unrecognised prior-pair KB correction'
     bases.append(copy.deepcopy(extra))
 save('data/regimen-knowledge-base-v08462-addendum.DRAFT.json',dict(schema_version='1.0',release=s.VERSION,context_aware_integration_required=True,regimen_profiles=bases,context_regimen_profiles=contexts))
 save('draft-integration/journey-fragments.json',journeys);save('data/phase-support-contexts-v08462.DRAFT.json',dict(regimens=phases_context));save('draft-integration/base-phase-support.json',phases_base);save('draft-integration/workflow-fragments.json',workflow_fragments);save('draft-integration/presentation-routes.json',presentation);save('draft-integration/authored-facts.json',facts)
 if args.apply:
  w=copy.deepcopy(workflow);pd=oldread('data/phase-support-v0838.json');jd=oldread('data/breast-treatment-journeys-v0837.json');pr=oldread('data/patient-presentation-v08431.json')
  originals=copy.deepcopy([w,pd,jd,pr]);selected_plans=[]
  for item in workflow_fragments:
   code=item['code'];context=item['patient_context']
   selector=dict(protocol_id=item['protocol_id'],source_version=s.SOURCES[code]['version'],source_url=s.SOURCES[code]['catalogue_url'],source_checked=s.DATE,source_pages=list(range(1,s.SOURCES[code]['pages']+1)),phases=[])
   for phase in item['phases']:
    plan_id='sarcoma62_'+code+'_'+phase['id'];selected_plans.append(plan_id)
    # Required trabectedin premedication is shown exactly; generic steroid doses
    # from the reference moderate-risk plan must not become an added prescription.
    day1=[dict(medicine='Dexamethasone',dose='20 mg',route='IV',frequency='Once before each infusion',timing='30 minutes before trabectedin',note='Required premedication; reconcile all steroids and the individual anti-sickness plan.')]if code=='00374'else[]
    plan=dict(label=phase['label'],risk_level=phase['emetogenic_risk'],day1=day1,subsequent=[],warnings=phase['additional_support'],source_url=phase['source_url'],source_checked=s.DATE,prescription_note='The oncology team specifies the complete anti-sickness and other support prescription; historical local references do not authorise additional treatment.')
    if phase.get('local_reference'):plan['local_reference']=phase['local_reference']
    w['antiemetic_plans'][plan_id]=plan
    selector['phases'].append(dict(id=phase['id'],label=phase['label'],active_medicines=phase['active_medicines'],plan_id=plan_id,notes=[facts[code]['schedule'],facts[code]['support']]))
   if context:w.setdefault('context_supportive_phase_selectors',{}).setdefault(code,{})[context]=selector
   else:w['supportive_phase_selectors'][code]=selector
  pd['regimens'].update(phases_base);jd.update(journeys);pr['routes'].update(presentation)
  # Undo only the selected keys in copies; all unrelated shared data must match.
  edited=copy.deepcopy([w,pd,jd,pr]);ow,opd,ojd,opr=originals;ew,epd,ejd,epr=edited
  def restore(dst,src,key):
   if key in src:dst[key]=src[key]
   else:dst.pop(key,None)
  for key in selected_plans:restore(ew['antiemetic_plans'],ow['antiemetic_plans'],key)
  for code,route in s.ROUTES.items():
   if '/'not in route:restore(ew['supportive_phase_selectors'],ow['supportive_phase_selectors'],code);restore(epd['regimens'],opd['regimens'],code)
   else:
    context=route.split('/')[1];originals_for_code=ow.get('context_supportive_phase_selectors',{}).get(code,{})
    restore(ew['context_supportive_phase_selectors'][code],originals_for_code,context)
    if not ew['context_supportive_phase_selectors'][code]and code not in ow.get('context_supportive_phase_selectors',{}):ew['context_supportive_phase_selectors'].pop(code)
   restore(ejd,ojd,route.replace('/',':'));restore(epr['routes'],opr['routes'],route)
  if 'context_supportive_phase_selectors'not in ow and not ew.get('context_supportive_phase_selectors'):ew.pop('context_supportive_phase_selectors',None)
  assert edited==originals,'Unrelated shared data changed'
  for file,obj in [('data/regimen-workflow-v0750.json',w),('data/phase-support-v0838.json',pd),('data/breast-treatment-journeys-v0837.json',jd),('data/patient-presentation-v08431.json',pr)]:save(file,obj)
  save('draft-integration/shared-key-preservation.json',dict(unrelated_shared_data_unchanged=True,selected_routes=list(s.ROUTES.values()),selected_plan_ids=selected_plans))
 after={str(p.relative_to(repo)):sha(p)for p in protected if p.is_file()};assert hashes==after,'Protected application files changed'
 save('draft-integration/protected-application-manifest.json',hashes)
 save('draft-integration/input-manifest.json',{'factory':{'path':str(repo/'tools/author-gu-patients-v08458.py'),'sha256':sha(repo/'tools/author-gu-patients-v08458.py')},'clinical_inputs':{c:{'path':str(p),'sha256':sha(p)}for c,p in paths.items()},'source_manifest_sha256':sha(manifest_path)})
 save('draft-integration/draft-checks.json',dict(status='Five authored feasibility profiles; independent clinical and pharmacy approval pending',checks=checks,protected_application_file_count=len(hashes),protected_application_bytes_unchanged=True,no_application_files_written=not args.apply,rendered_visual_review='not run',standalone_pdf_and_qr_checks='not run'))
 print(f'Wrote five authored profiles and context-aware integration fragments to {out}; {len(hashes)} protected files unchanged; application_mode={args.apply}.')
if __name__=='__main__':main()
