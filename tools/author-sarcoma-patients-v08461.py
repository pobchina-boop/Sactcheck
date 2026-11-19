#!/usr/bin/env python3
"""Produce a reviewable overlay OUTSIDE the repo. Never write application files."""
import argparse,copy,hashlib,importlib.util,json,pathlib,math,re
HERE=pathlib.Path(__file__).resolve().parent

def module(name,path):
 spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m

def patient_words(obj):
 if isinstance(obj,str):
  if obj.startswith(('https://','http://')):return obj
  terms={'NCCP':'National Cancer Control Programme','ECG':'electrocardiogram (heart tracing)','ECHO':'echocardiogram (heart ultrasound)','MUGA':'multigated acquisition scan (heart pumping scan)','LVEF':'left ventricular ejection fraction (heart pumping measurement)','INR':'international normalised ratio (warfarin clotting test)','CYP3A4':'the liver enzyme cytochrome P450 3A4','PDGFRA':'platelet-derived growth factor receptor alpha','EMA':'European Medicines Agency'}
  for short,full in terms.items():obj=re.sub(r'\b'+short+r'\b',full,obj)
  if 'gastrointestinal stromal tumour'not in obj.lower():obj=re.sub(r'\bGIST\b','gastrointestinal stromal tumour (GIST)',obj,count=1)
  return obj
 if isinstance(obj,list):return [patient_words(v)for v in obj]
 if isinstance(obj,dict):return {k:patient_words(v)if k not in ['id','code','protocol_id','source_ids','patient_route','patient_context','context_id','context_protocol_indication']else v for k,v in obj.items()}
 return obj

def monitoring(code,d):
 def test(label,purpose,timing,kind='blood',scope='routine',product=None):return dict(label=label,purpose=purpose,timing=timing,kind=kind,scope=scope,source_ids=['nccp']+([product]if product else[]))
 if code=='00335':
  rows=[test('Full blood count','Check infection-fighting cells, oxygen-carrying red cells and platelets.','At baseline, every 2 weeks for the first 12 weeks, then monthly; extra testing may be needed for symptoms or abnormal results.'),test('Kidney and liver tests','Detect organ effects and review safe treatment.','At baseline, then monthly; repeat sooner for abnormal results, dehydration, swelling or other clinical concerns.'),test('Hepatitis B screening and follow-up','Detect infection that can reactivate during treatment.','Screen before treatment. Positive results require specialist advice and individual monitoring during treatment and for months afterwards.',product='imatinib-pi'),test('Heart, weight and fluid review','Detect fluid retention or cardiac problems.','Baseline ECG and review of heart/kidney history; monitor weight, swelling and breathlessness during treatment. Additional heart tests are clinically directed.','procedure',product='imatinib-pi'),test('Thyroid testing in a specific setting','Check whether thyroid replacement remains appropriate.','Check thyroid-stimulating hormone when indicated, particularly after thyroid removal in someone taking levothyroxine. This is not a universal monthly thyroid test.','blood','conditional','imatinib-pi')]
 elif code in ['00325','00719']:
  cycle='At baseline and before each cycle.'if code=='00325'else'At baseline and regularly during treatment; the team writes the actual blood-test schedule before the next cycle.'
  thyroid='At baseline and every 12 weeks under this NCCP source; sooner if symptoms suggest a thyroid problem.'if code=='00325'else'At baseline and regularly according to the written specialist plan; sooner for symptoms. This NCCP source does not specify a fixed 12-week interval.'
  bp='At baseline and each attendance; additional home or clinic checks as prescribed.'if code=='00325'else'At baseline and regularly under the written monitoring plan; extra checks for symptoms or abnormal readings.'
  heart='Review cardiac history and whether ECG, ECHO or MUGA are indicated; further assessment follows risk, symptoms or abnormal findings.'if code=='00325'else'Review cardiovascular history and baseline heart function. This source excludes significant cardiovascular disease and/or baseline LVEF below 55%; cardiac imaging is arranged when indicated or when there is relevant cardiac history.'
  rows=[test('Full blood count','Detect infection, anaemia and bleeding risk.',cycle),test('Kidney and liver tests','Detect organ effects and guide treatment review.',cycle+' Repeat sooner for symptoms or abnormal results.'),test('Thyroid function','Identify underactive or overactive thyroid function, which may need treatment.',thyroid),test('Blood pressure','Detect high blood pressure even before symptoms occur.',bp,'procedure'),test('Heart function and rhythm','Identify heart weakness or electrical-rhythm risk.',heart+' Electrolytes and medicines that affect the QT electrical recovery interval are reviewed when relevant.','procedure','conditional','sunitinib-uk-pi'),test('Urine protein','Detect protein leakage and kidney complications.','Product information supports baseline urine testing and monitoring for protein loss during treatment; the team specifies repeat timing.','procedure','routine','sunitinib-uk-pi'),test('Blood glucose in people with diabetes','Detect low glucose and review diabetes medicines.','Check regularly if diabetes is present and promptly with symptoms suggesting low glucose.','blood','conditional','sunitinib-uk-pi'),test('Mouth, dental health, skin and wound review','Identify hand–foot effects, mouth problems or healing concerns early.','Review symptoms throughout treatment; consider dental assessment before treatment and coordinate surgery or invasive dental care with oncology.','review','routine','sunitinib-uk-pi')]
 else:
  rows=[test('Liver tests','Detect potentially serious liver injury before symptoms develop.','Before treatment, at least every 2 weeks for the first 2 months, then at least monthly or more often when indicated.',product='regorafenib-pi'),test('Blood pressure','Detect and manage high blood pressure.','At baseline, weekly for the first 6 weeks, then before each cycle and as indicated.','procedure'),test('Full blood count and kidney tests','Check bleeding/infection risk, hydration and kidney function.','At baseline and regularly during treatment; the team specifies the sampling dates and extra tests for symptoms or previous abnormalities.'),test('Thyroid function','Identify thyroid abnormalities that may need treatment.','At baseline and subsequently when clinically indicated.'),test('Pancreatic enzymes','Investigate possible pancreatic effects.','Lipase or amylase when clinically indicated; these are not universal fixed-interval tumour-marker tests.','blood','conditional'),test('Heart rhythm and electrolytes','Assess electrical-rhythm and cardiac risk.','ECG and relevant electrolyte review when risk factors, interacting medicines or symptoms indicate them.','procedure','conditional'),test('Warfarin clotting test','Check anticoagulation when regorafenib is combined with warfarin.','Monitor INR closely if taking warfarin; the team specifies the testing and dose plan.','blood','conditional'),test('Hands, feet, mouth and healing','Detect painful skin effects, mouth injury or wound problems.','Check before treatment and review symptoms during each cycle; report soreness early and coordinate any planned operation.','review')]
 rows.append(test('Tumour or recurrence review'if code=='00335'else'Tumour response review','Assess benefit separately from treatment-safety tests.','Your GIST specialist sets imaging and clinical-review timing. '+('Adjuvant recurrence monitoring and advanced-disease response assessment are different plans.'if code=='00335'else'This advanced-disease plan assesses tumour control, symptoms and whether treatment remains useful.'),'scan','conditional'))
 d['monitoring_test_details']=rows;d['monitoring_summary']='Use the test-specific schedule below. Safety blood tests and '+('tumour/recurrence scans'if code=='00335'else'tumour-response scans')+' have different purposes.'
 d['monitoring_schedule']['rows']=[dict(label='Safety tests and symptoms',cells=['Complete the individual baseline test plan.','Keep each test at its specified interval.','Report symptoms promptly; extra tests may be needed.','Follow abnormal results and lasting effects until a plan is agreed.']),dict(label='Tablet plan and support',cells=['Confirm dose, food instructions, interactions and supply.','Record doses, planned breaks and any safety hold.','Follow the support and urgent-contact plan.','Agree how to continue, pause or stop tablets.']),dict(label='Tumour review and next steps',cells=['Agree the treatment goal and baseline assessment.','Review benefit under the specialist plan.','Report new or changing tumour-related symptoms.','Agree follow-up and any next treatment.'])]
 d['monitoring_schedule']['note']='Safety testing and '+('tumour/recurrence assessment'if code=='00335'else'tumour-response assessment')+' answer different questions.'
 for row in d['timeline']:
  if row['id']=='monitor':row['text']='Keep the individual test appointments and report symptoms; see the test cards for timing.'
 chapter=next(c for c in d['chapters']if c['id']=='checks');chapter['intro']='Use the test-specific cards in the monitoring section.';chapter['items']=[dict(title='Your testing appointments',text='Confirm where and when tests are done and who reviews the results before treatment continues.',source_ids=['nccp']),dict(title='Safety and benefit',text='Normal safety tests do not establish that treatment is working. Your specialist sets the separate scan and symptom-review plan.',source_ids=['nccp'])]

def summary_monitoring(code):
 def row(stage,test,when,basis='Regimen'):
  return dict(stage=stage,test=test,when=when,basis=basis)
 rows={
 '00335':[
  row('Bloods','Full blood count','Before treatment; every 2 weeks for 12 weeks, then monthly.'),
  row('Bloods','Kidney and liver tests','Before treatment, then monthly; sooner if unwell or results change.'),
  row('Before','Hepatitis B and heart tracing','Screen for hepatitis B and obtain a baseline heart tracing; positive screening needs specialist follow-up.','Regimen / product'),
  row('During','Fluid and thyroid review','Monitor weight, swelling and breathing; thyroid tests when indicated, especially after thyroid removal while taking levothyroxine.','Regimen / product'),
  row('Review','Tumour / recurrence review','Specialist-set scans: recurrence after surgery or response in advanced disease.','Individual plan')],
 '00325':[
  row('Bloods','Blood count, kidney and liver','Before treatment and each cycle; extra tests for symptoms or abnormal results.'),
  row('Bloods','Thyroid function','Before treatment and every 12 weeks; sooner for symptoms.'),
  row('Checks','Blood pressure','Before treatment and at each attendance; extra checks as prescribed.'),
  row('Checks','Urine and heart checks','Urine protein before treatment and during treatment; heart tests when indicated. Check glucose regularly if diabetes is present.','Regimen / product'),
  row('Review','Tumour response','Specialist-set scans and clinical review for advanced-disease control.','Individual plan')],
 '00719':[
  row('Bloods','Blood count, kidney and liver','Before treatment and regularly; obtain the written test dates before the next cycle.'),
  row('Checks','Thyroid function and blood pressure','Before treatment and regularly under the written specialist plan; extra checks for symptoms or abnormal results.'),
  row('Checks','Heart review','Review heart history and baseline function; imaging when indicated or with relevant heart history.','Regimen / product'),
  row('Checks','Urine protein and glucose','Urine before treatment and during treatment; glucose regularly if diabetes is present.','Regimen / product'),
  row('Review','Tumour response','Specialist-set scans and clinical review for advanced-disease control.','Individual plan')],
 '00244':[
  row('Bloods','Liver tests','Before treatment; at least every 2 weeks for 2 months, then at least monthly.','Regimen / product'),
  row('Checks','Blood pressure','Before treatment; weekly for 6 weeks, then before each cycle and as needed.'),
  row('Bloods','Blood count, kidney and thyroid','All before treatment; blood count/kidney regularly, thyroid again when indicated.'),
  row('If needed','Additional safety tests','Heart tracing/electrolytes and pancreatic tests when indicated; close blood clotting monitoring if taking warfarin.'),
  row('Review','Tumour response','Specialist-set scans and clinical review for advanced-disease control.','Individual plan')]
 }
 return rows[code]

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--repo',required=True);ap.add_argument('--output',default=str(HERE/'overlay'));ap.add_argument('--apply',action='store_true');args=ap.parse_args()
 repo=pathlib.Path(args.repo).resolve();out=repo if args.apply else pathlib.Path(args.output).resolve()
 if args.apply and HERE!=repo/'tools':raise SystemExit('Application mode requires the reviewed author installed in the repository tools directory.')
 if not args.apply and(out==repo or repo in out.parents):raise SystemExit('Draft output must remain outside the application repository.')
 source=module('gist_facts61',HERE/'sarcoma-v08461-facts.py');h=module('gist_factory58',repo/'tools/author-gu-patients-v08458.py');h.VERSION=source.VERSION;h.DATE=source.DATE;h.SOURCE=source.SOURCES
 facts=source.facts()
 protected=[repo/'data/patient-knowledge/00244.json']+list((repo/'patient/00244').rglob('*'))+list((repo/'docs/patient/00244').rglob('*'))
 protected=[p for p in protected if 'gist'not in p.parts]
 protected=[p for p in protected if p.is_file()]
 hashes={str(p.relative_to(repo)):hashlib.sha256(p.read_bytes()).hexdigest()for p in protected}
 def target(file):
  for code,route in source.ROUTES.items():
   if file==f'data/patient-knowledge/{code}.json' and '/'in route:file=f'data/patient-knowledge-contexts/{code}/gist.json'
  if args.apply:file=file.replace('.DRAFT.json','.json').replace('draft-integration/','validation/sarcoma-v08461/patient-authoring/')
  return file
 def save(file,obj):
  p=out/target(file);p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
 h.save=save
 kb=[];journeys={};phase_contexts={};phase_base={};workflow=[];presentation={};checks=[]
 for code,f in facts.items():
  d,p=h.build_profile(code,f);route=source.ROUTES[code];context='gist'if'/'in route else None;agent=d['agents'][0];drug=agent['id'];title,url=source.PRODUCTS[drug]
  d['source_checked']=d['document_revision']=source.DATE;d['indication_text']=f['context'];d['administration_route']='oral';d['service_kind']='targeted';d['independent_clinical_approval']=False
  d['source_provenance']=dict(basis='Current official NCCP web-extracted text verified. No original PDF bytes or visual table review claimed.',checked=source.DATE,visual_table_review=False,original_pdf_hash_verified=False,clinical_and_pharmacy_approval=False)
  d['sources']=[x for x in d['sources']if x['id']!='ncis']+[dict(id=drug+'-pi',title=title,url=url)]
  d['sources'].append(dict(id='nci-gist',title='National Cancer Institute: gastrointestinal stromal tumours treatment overview',url='https://www.cancer.gov/types/soft-tissue-sarcoma/hp/gist-treatment-pdq'))
  if drug=='sunitinib':
   d['sources'].append(dict(id='sunitinib-uk-pi',title='Pfizer UK Sutent product information, April 2024; readable primary fallback',url='https://www.medicines.org.uk/emc/product/227/smpc'))
   d['source_provenance']['product_retrieval_limit']='Current detailed EMA Sutent retrieval was rate-limited. Readable Pfizer UK product text is explicitly identified; current Irish/EU reconciliation remains required before clinical approval.'
   agent['source_ids']=['nccp',drug+'-pi','sunitinib-uk-pi']
  agent['source_ids']=['nccp',drug+'-pi']+(['sunitinib-uk-pi']if drug=='sunitinib'else[]);d['support_source_ids']=agent['source_ids'];d['urgent_source_ids']=agent['source_ids']
  d['timeline_note']='Illustrative oral-treatment calendar. Use your prescribed start date, dose, planned breaks and review appointments. Additional safety holds may be necessary.'
  d['passport_visit_note']='Bring the medicine record and verified contact plan to review. Record actual doses and holds; the chart does not authorise a restart.'
  d['monitoring_schedule']['rows'][1]['label']='Tablets and practical support';d['monitoring_schedule']['rows'][1]['cells'][-1]='Agree how to continue, pause or stop tablets and return unused treatment to the pharmacy.'
  d['monitoring_schedule']['rows'][2]['cells'][-1]='Agree specialist GIST follow-up, scan timing and the next systemic or local-treatment plan.'
  d['monitoring_test_details']=[dict(label='Baseline safety and suitability',purpose='Check the treatment setting, organ function and medicine-specific risks before treatment.',timing=f['baseline'],kind='review',scope='routine',source_ids=['nccp']),dict(label='Scheduled tests and symptom review',purpose='Detect toxicity even when symptoms are absent, and decide whether treatment can continue safely.',timing=f['monitoring'],kind='review',scope='routine',source_ids=['nccp']),dict(label='Cancer or recurrence review',purpose='Assess benefit separately from safety blood tests.',timing='Scans and review intervals follow the specialist GIST plan. The adjuvant and advanced-disease questions differ.',kind='scan',scope='conditional',source_ids=['nccp'])]
  d['support'][1]=dict(title='Oral medicine handling',text=source.HANDLING,source_ids=[drug+'-pi']);d['support'][2]=dict(title='Fertility and pregnancy precautions',text=source.FERTILITY,source_ids=[drug+'-pi'])
  d['support'].append(dict(title='Missed or vomited doses',text=f['missed'],source_ids=[drug+'-pi']))
  d['logistics']['sections']=[dict(title=t,text=x,source_ids=['nccp',drug+'-pi'])for t,x in [('Before starting',f['prep']),('Taking the medicine',f['administration']),('Missed or vomited doses',f['missed']),('Supply and handling',source.HANDLING),('Monitoring and next review',f['monitoring'])]]
  d['chapters'][0]['items'][1]['title']='Taking the medicine';d['chapters'][2]['items'][1]=dict(title='Safe oral medicine handling',text=source.HANDLING,source_ids=[drug+'-pi']);d['chapters'][2]['items'][2]=dict(title='Fertility and pregnancy',text=source.FERTILITY,source_ids=[drug+'-pi'])
  d['support'][3]['source_ids']=['nci-gist'];d['chapters'][0]['items'][2]['source_ids']=['nci-gist']
  d['urgent_extra']=h.URGENT+' '+f['urgent'];d['chapters'][3]['items'][0]['text']=d['urgent_extra'];d['chapters'][3]['items'][1]=dict(title='A hold is not an automatic restart',text='If oncology asks you to stop tablets because of toxicity, wait for an explicit restart plan. A normal test or improvement in symptoms does not remove every previous permanent-stop decision.',source_ids=['nccp'])
  d['chapters'].append(dict(id='oral-plan',title='Make your tablet plan practical',intro='A written calendar and early symptom reporting help the team use treatment safely.',items=[dict(title='Food and timing',text=f['administration'],source_ids=['nccp',drug+'-pi']),dict(title='Missed or vomited doses',text=f['missed'],source_ids=[drug+'-pi']),dict(title='Interactions and procedures',text=f['prep']+' Tell the team before any operation or new medicine.',source_ids=['nccp',drug+'-pi'])]))
  d['consent_support']='Discuss the intended benefit, uncertainty, alternatives including supportive care, generic targeted-therapy risks and the separate agent risks, lasting effects, fertility and the patient’s priorities. '+f['scope']
  d['consent_generic_risks']=source.GENERIC;d['chapters'].append(dict(id='consent',title='Your treatment decision',intro='Use the generic targeted-therapy checklist and the medicine-specific risks together.',items=[dict(title='General targeted-therapy risks',text=source.GENERIC,source_ids=['nccp',drug+'-pi']),dict(title='Individual decision and alternatives',text=d['consent_support'],source_ids=['nccp']),dict(title='What matters to you',text='Record questions, daily-life priorities, expected benefit and what would make a change or a break preferable. Consent can be reconsidered.',source_ids=['nccp'])]))
  for row in d['timeline']:
   if row['id']=='planned-break':row['style']='break'
  for group in d['day_groups']:
   if group['title']=='Between scheduled chemotherapy doses':group['title']='Prescribed tablet break';group['body']='Follow the written calendar. Monitoring and symptom reporting continue during the break.'
  summary=d['patient_summary'];summary['purpose']=f['purpose'];summary['card_title']=f['title'];summary['card_schedule']=f['label'];summary['card_alert']='Carry your verified oncology contact plan. Do not restart after a safety hold without instructions.';summary['card_record_unit']='review'if code=='00335'else'cycle';summary['card_cycle_count']=None;summary['card_record_note']='Recording spaces do not define treatment duration.'
  summary['monitoring']=summary_monitoring(code)
  summary['cycle_expectations']=['Oral treatment can cause serious effects between visits. Report problems promptly.','Use the agreed calendar and never double or restart doses without instructions.'];summary['preparation']=['Confirm the prescribed dose, food instructions, supply, contact numbers and next tests.'];summary['cycle_blocks']=[dict(label='Tablet days',text=f['label']),dict(label='Checks and support',text='Keep the written blood-test, symptom and blood-pressure plan.'),dict(label='Next review',text=f['course'])]
  d['questions'] += [dict(q='What should I do about a missed or vomited dose?',a=f['missed']),dict(q='Can I take other medicines or supplements?',a=f['prep']),dict(q='Why do I need checks if I feel well?',a='High blood pressure, thyroid changes, liver injury or low blood counts may be detected before you notice symptoms. The required checks differ by medicine; keep your individual schedule.')]
  d['patient_route']=route
  if context:d['patient_context']=d['context_id']=context;d['context_protocol_indication']='00244b'if code=='00244'else'00325a'if code=='00325'else'00719a'
  if code=='00719':
   d['sources'].append(dict(id='schedule-model',title='Sunitinib 2/1 versus 4/2 pharmacokinetic/pharmacodynamic modelling',url='https://pubmed.ncbi.nlm.nih.gov/27154065/'));d['evidence']['source_ids'].append('schedule-model')
  if code=='00335':
   d['sources'].append(dict(id='advanced-imatinib',title='Early imatinib activity study in advanced GIST',url='https://pubmed.ncbi.nlm.nih.gov/12181401/'));d['evidence']['source_ids'].append('advanced-imatinib')
   d['sources'].append(dict(id='imadgist',title='IMADGIST: six versus three years of adjuvant imatinib',url='https://pubmed.ncbi.nlm.nih.gov/39241959/'))
   d['evidence']['source_ids'].append('imadgist');d['patient_summary']['schedule']='Daily tablets; duration depends on treatment intent';d['patient_summary']['phases']=[dict(title='Advanced GIST',text='Daily treatment continues while benefit and tolerability justify it; specialist escalation may be considered.'),dict(title='After surgery',text='Duration depends on recurrence risk and current evidence. The NCCP source describes up to three years.')]
  monitoring(code,d)
  d=patient_words(d)
  save(f'data/patient-knowledge/{code}.json',d)
  p['metadata'].setdefault('source_boundary_notes',[]);p['eligibility']={'setting':f['context'],'review':[f['baseline'],f['scope']]};entry=h.knowledge(code,f,d,p);entry['patient_context']=context;entry['patient_route']=route;entry['independent_clinical_approval']=False;entry['treatment_setting']=f['context'];entry['treatment_rationale']['line']=f['context'];entry['treatment_rationale']['factors']=['Specialist GIST pathology and molecular profile, resectability/recurrence risk, previous kinase inhibitors, performance status, organ function, interactions and patient preference.'];entry['treatment_rationale']['alternatives']=['Discuss current GIST-specific systemic options or trials, surgery in appropriate settings, surveillance where appropriate and symptom-focused supportive care.'];entry['supportive_care']['counselling']=[source.HANDLING,source.FERTILITY,f['missed']];entry['administration']['route_and_duration']=[f['administration']];entry['patient_resources']=[dict(label=label,url=f'patient/{route}/{file}')for label,file in [('Patient knowledge','knowledge.html'),('Consent discussion','consent-form.html'),('Treatment and monitoring','treatment-journey.html'),('Support medicines','supportive-care.html'),('Three-page pack','guide.pdf'),('Complete handbook','handbook.pdf')]]
  entry['monitoring_and_toxicity']['test_specific_details']=d['monitoring_test_details']
  entry['patient_selection']['disease_and_biomarker_context']=[f['context']]
  removed=[x for x in entry['patient_selection']['important_cautions']if'parent integration'in x or'internal route/code metadata'in x]
  entry['patient_selection']['important_cautions']=[x for x in entry['patient_selection']['important_cautions']if x not in removed]
  if removed:save('draft-integration/'+code+'-metadata-notes.json',dict(code=code,notes_moved_out_of_product=removed))
  ev=entry['evidence_at_a_glance'];ev['checked']=source.DATE
  if code=='00335':
   ev['trial']='Imatinib evidence in advanced disease and after surgery';ev['population']='Separate populations: advanced unresectable/metastatic GIST in an early activity study; high-risk resected GIST in postoperative duration trials.';ev['comparison']='Advanced study: 400 or 600 mg daily; postoperative SSGXVIII/AIO: 400 mg daily for 36 versus 12 months; IMADGIST: stop after 3 years versus continue another 3 years in selected patients.';ev['sources']=[dict(label=x['title'],url=x['url'])for x in d['sources']if x['id']in ['trial','advanced-imatinib','imadgist']]
  elif code in ['00325','00719']:
   ev['population']='Advanced GIST after imatinib resistance or intolerance in the pivotal 312-patient trial.';ev['comparison']='Sunitinib 50 mg daily for 4 weeks followed by 2 weeks off versus placebo; this directly matches 00325, not 00719.'
   if code=='00719':ev['sources'].append(dict(label='Schedule modelling; not a randomised GIST 2/1 trial',url='https://pubmed.ncbi.nlm.nih.gov/27154065/'))
  else:ev['population']='199 patients with unresectable/metastatic GIST after imatinib and sunitinib.';ev['comparison']='Regorafenib 160 mg daily for 3 weeks then 1 week off versus placebo, both with best supportive care.'
  def endpoint(kind,metric,result,interpretation,url,limits=None):return dict(endpoint=kind,metric=metric,result_text=result,interpretation=interpretation,analysis_status='Published primary study; reviewed 18 November 2026',limitations=limits or f['caveat'],sources=[dict(label='Primary study',url=url)])
  if code=='00335':ev['endpoints']=[
   endpoint('RFS','Ten-year recurrence-free survival after surgery','52.5% with three years versus 41.8% with one year of adjuvant imatinib; hazard ratio 0.66.','SSGXVIII/AIO: 397 patients in the intention-to-treat analysis, high-risk GIST after macroscopically complete surgery; 400 mg daily. This result concerns postoperative recurrence, not advanced-disease response.','https://pubmed.ncbi.nlm.nih.gov/32469385/'),
   endpoint('OS','Ten-year overall survival after surgery','79.0% with three years versus 65.3% with one year; hazard ratio 0.55.','The same high-risk postoperative duration trial; group survival estimates are not an individual prognosis.','https://pubmed.ncbi.nlm.nih.gov/32469385/'),
   endpoint('ORR','Early activity in advanced GIST','Partial responses in 53.7%; stable disease in 27.9%; no complete responses in the early report.','147 adults with advanced unresectable/metastatic GIST, pooled 400 mg and 600 mg daily dose arms. This is early activity evidence, not an adjuvant result or a comparison with current later-line agents.','https://pubmed.ncbi.nlm.nih.gov/12181401/'),
   endpoint('DFS','Selected extension from three to six adjuvant years','Disease-free survival favoured continuing treatment: hazard ratio 0.40. Overall survival was not different at the reported follow-up.','IMADGIST: 136 selected high-risk patients without progression after three postoperative years; continuing another three years versus stopping. The previous 300/400 mg dose was retained.','https://pubmed.ncbi.nlm.nih.gov/39241959/','Selected extension evidence informs individual duration discussions; it does not automatically replace the current NCCP plan or justify treatment in low-risk disease. Conflicting abstract/full-text confidence intervals are not reproduced.')]
  elif code in ['00325','00719']:ev['endpoints']=[endpoint('TTP','Pivotal 42-day schedule: time to tumour progression','Median 27.3 weeks with sunitinib versus 6.4 weeks with placebo; hazard ratio 0.33.','312 patients after imatinib resistance/intolerance; 50 mg daily for four weeks followed by two weeks off. '+('This is direct schedule evidence for 00325.'if code=='00325'else'These figures belong to the 42-day trial and are not validated outcome estimates for the 21-day 00719 schedule. The 2/1 rationale includes modelling, not a randomised GIST schedule-comparison trial.'),'https://pubmed.ncbi.nlm.nih.gov/17046465/')]
  else:ev['endpoints']=[endpoint('PFS','Progression-free survival in GRID','Median 4.8 months with regorafenib versus 0.9 months with placebo; hazard ratio 0.27.','199 patients with advanced GIST after imatinib and sunitinib; 160 mg days 1–21 every 28 days, both groups receiving best supportive care. Approximately 85% of placebo patients crossed over.','https://pubmed.ncbi.nlm.nih.gov/23177515/')]
  kb.append(entry)
  key=code+':gist'if context else code;journeys[key]=dict(code=code,context=context,title=f['title']+': treatment and checks',release=source.VERSION,checked=source.DATE,status=h.STATUS,schedule_type='relative-educational',has_patient_dates=False,setting=f['context'],summary=f['schedule'],stages=d['monitoring_schedule']['columns'],lanes=[dict(**row,kind='monitoring',source_ids=['nccp'],note=d['monitoring_schedule']['note'])for row in d['monitoring_schedule']['rows']],milestones=[dict(title='GIST treatment review',when=f['label'],why=f['purpose'],clinical=f['schedule'],action=d['urgent_extra'],source_ids=['nccp'])],sources=d['sources'])
  plans=[]
  for phase_id,label,names,risk in f['phases']:
   row=dict(id=phase_id,label=label,active_medicines=names,active_drugs=names,emetogenic_risk=risk,medicines=[],prescription_note='No automatic prophylactic prescription is populated for this oral schedule. Agree individual nausea, bowel, skin and other symptom support.',additional_support=list(dict.fromkeys([f['administration'],f['missed'],f['support'],f['prep'],source.HANDLING])),source_page='Treatment, monitoring and supportive-care sections',source_checked=source.DATE,source_url=source.SOURCES[code]['catalogue_url'],guidance=dict(label='Current NCCP regimen; reconcile the actual local prescription',url=source.SOURCES[code]['catalogue_url']));row=patient_words(row);plans.append(row)
  if context:phase_contexts.setdefault(code,{})['gist']=plans
  else:phase_base[code]=plans
  workflow.append(dict(code=code,patient_context=context,patient_route=route,protocol_id=d['protocol_id'],source_checked=source.DATE,phases=plans))
  presentation[route]=target(f'data/patient-knowledge/{code}.json')
  assert len(d['anatomy'])==8 and all(a['risks']for a in d['agents']);assert 'urology' not in json.dumps(d).lower()
  for i,a in enumerate(d['anatomy']):
   for b in d['anatomy'][i+1:]:assert math.hypot((a[4]-b[4])*66.442/100,(a[5]-b[5])*146/100)>=7, 'Overlapping anatomy marker centres'
  checks.append(dict(code=code,route=route,anatomy_rows=len(d['anatomy']),agent=drug,draft=True,independent_clinical_approval=False))
 contexts=[];base=[]
 for entry in kb:
  if entry['patient_context']:
   entry.update(context_id='gist',context_label='Gastrointestinal stromal tumour (GIST)',journey_key=entry['patient_route'].replace('/',':'));contexts.append(entry)
  else:base.append(entry)
 save('data/regimen-knowledge-base-v08461-addendum.DRAFT.json',dict(schema_version='1.0',release=source.VERSION,context_aware_integration_required=True,regimen_profiles=base,context_regimen_profiles=contexts))
 save('draft-integration/journey-fragments.json',patient_words(journeys));save('data/phase-support-contexts-v08461.DRAFT.json',dict(regimens=phase_contexts));save('draft-integration/base-phase-support.json',phase_base);save('draft-integration/workflow-fragments.json',workflow);save('draft-integration/presentation-routes.json',presentation);save('draft-integration/authored-facts.json',facts)
 after={str(p.relative_to(repo)):hashlib.sha256(p.read_bytes()).hexdigest()for p in protected};assert hashes==after,'Protected CRC content changed'
 save('draft-integration/protected-crc-manifest.json',hashes)
 if args.apply:
  w=old_workflow=h.read('data/regimen-workflow-v0750.json');pd=h.read('data/phase-support-v0838.json');jd=h.read('data/breast-treatment-journeys-v0837.json');pr=h.read('data/patient-presentation-v08431.json')
  for item in workflow:
   code=item['code'];context=item['patient_context'];selector=dict(protocol_id=item['protocol_id'],source_version=str(h.read(next(x['path']for x in h.INDEX if'/'+code+'-'in x['path']))['metadata']['nccp_version']),source_url=source.SOURCES[code]['catalogue_url'],source_checked=source.DATE,source_pages=list(range(1,source.SOURCES[code]['pages']+1)),phases=[])
   for phase in item['phases']:
    plan_id='sarcoma61_'+code+'_'+phase['id'];w['antiemetic_plans'][plan_id]=dict(label=phase['label'],risk_level=phase['emetogenic_risk'],day1=[],subsequent=[],warnings=phase['additional_support'],source_url=phase['source_url'],source_checked=source.DATE,prescription_note=phase['prescription_note'])
    selector['phases'].append(dict(id=phase['id'],label=phase['label'],active_medicines=phase['active_medicines'],plan_id=plan_id,notes=[facts[code]['schedule'],facts[code]['support']]))
   if context:w.setdefault('context_supportive_phase_selectors',{}).setdefault(code,{})[context]=selector
   else:w['supportive_phase_selectors'][code]=selector
  pd['regimens'].update(phase_base);jd.update(patient_words(journeys));pr['routes'].update(presentation)
  for file,obj in [('data/regimen-workflow-v0750.json',w),('data/phase-support-v0838.json',pd),('data/breast-treatment-journeys-v0837.json',jd),('data/patient-presentation-v08431.json',pr)]:save(file,obj)
  assert hashes=={str(p.relative_to(repo)):hashlib.sha256(p.read_bytes()).hexdigest()for p in protected},'CRC profile or existing route/mirror changed'
 save('draft-integration/draft-checks.json',dict(status='four feasibility profiles authored; independent clinical approval remains pending',checks=checks,crc_byte_preservation=True,protected_crc_file_count=len(hashes),excluded_unverified=['00445'],no_application_files_written=not args.apply))
 print(f'Wrote four profiles and integration fragments to {out}; {len(hashes)}CRCprofile,route andmirror files unchanged; application_mode={args.apply}.')
if __name__=='__main__':main()
