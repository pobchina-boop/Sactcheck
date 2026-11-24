#!/usr/bin/env python3
"""Build five external educational overlays. Application writes are refused."""
import argparse,copy,hashlib,importlib.util,json,math,pathlib,re,subprocess
HERE=pathlib.Path(__file__).resolve().parent
def module(name,path):
 spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def walk(x):
 if isinstance(x,str):yield x
 elif isinstance(x,list):
  for v in x:yield from walk(v)
 elif isinstance(x,dict):
  for v in x.values():yield from walk(v)
def explain(x):
 if isinstance(x,str):
  if x.startswith(('https://','http://')):return x
  for old,new in [('NCCP','National Cancer Control Programme'),('EMA','European Medicines Agency'),('QR','quick response code'),('MAPIE','methotrexate, doxorubicin and cisplatin plus ifosfamide and etoposide'),('MAP','methotrexate, doxorubicin and cisplatin')]:x=re.sub(r'\b'+old+r'\b',new,x)
  return x
 if isinstance(x,list):return [explain(v)for v in x]
 if isinstance(x,dict):return {k:explain(v)if k not in ['id','source_ids','protocol_id','patient_route','code']else v for k,v in x.items()}
 return x
def markers(rows):
 assert len(rows)==8 and len({x[0]for x in rows})==8
 values=[math.hypot((a[4]-b[4])*66.442/100,(a[5]-b[5])*146/100)for i,a in enumerate(rows)for b in rows[i+1:]]
 assert min(values)>=7,min(values)
 return round(min(values),3)
def endpoint(kind,metric,result,pop,url,limit,**extra):
 return dict(endpoint=kind,metric=metric,result_text=result,interpretation=pop,limitations=limit,analysis_status='Published study; interpretation restricted to the stated population and design',sources=[dict(label='Primary publication',url=url)],**extra)
def evidence(code,f):
 url=f['trial_url'];limit=f['caveat']
 if code=='00420':
  pop='407 randomised, 391 eligible; operable nonmetastatic osteosarcoma. Historical multidrug comparator, not modern MAP.'
  return dict(population=pop,comparison='Six courses of doxorubicin/cisplatin versus a 44-week T10-like multidrug regimen.',endpoints=[endpoint('OS','Five-year overall survival','55% in both groups.',pop,url,limit,intervention_value=55,comparator_value=55,intervention_label='Doxorubicin/cisplatin',comparator_label='Historical multidrug course',unit='%',timepoint='5 years'),endpoint('PFS','Five-year progression-free survival','44% in both groups.',pop,url,limit,intervention_value=44,comparator_value=44,intervention_label='Doxorubicin/cisplatin',comparator_label='Historical multidrug course',unit='%',timepoint='5 years')],harms='Treatment completion: 94% completed six doxorubicin/cisplatin courses; 51% completed at least 18 of 20 historical multidrug courses. Completion differences do not establish modern equivalence.')
 if code=='00463':
  pop='618 poor histological responders, age ≤40: 310 MAP and 308 MAPIE in the postoperative randomisation. Non-proportional hazards were reported (P=0.0003); the summary hazard ratio does not describe a constant relative treatment effect throughout follow-up.'
  limit+=' The proportional-hazards assumption was not met; interpret the summary hazard ratio together with the reported time-to-event curves rather than as a uniform effect over time.'
  return dict(population=pop,comparison='Postoperative MAPIE versus MAP after poor histological response; not relapse therapy.',endpoints=[endpoint('EFS','Event-free survival hazard ratio','0.98, 95% confidence interval 0.78–1.23; no demonstrated improvement from adding ifosfamide/etoposide.',pop,url,limit,hr='0.98',ci='0.78–1.23')],harms='Grade 4 nonhaematological toxicity: 12% MAP versus 24% MAPIE. Febrile neutropenia without documented infection: 50% versus 73%. Do not automatically intensify based on poor histology alone.')
 if code=='00100':
  pop='662 patients with resectable nonmetastatic osteosarcoma in a 2×2 factorial randomised trial, alongside surgery and chemotherapy.'
  return dict(population=pop,comparison='Mifamurtide added versus not added across the factorial chemotherapy allocation.',endpoints=[endpoint('OS','Six-year overall survival','78% with mifamurtide versus 70% without; hazard ratio 0.71, 95% confidence interval 0.52–0.96; P=0.03.',pop,url,limit,intervention_value=78,comparator_value=70,intervention_label='Mifamurtide added',comparator_label='No mifamurtide',unit='%',timepoint='6 years',hr='0.71',ci='0.52–0.96'),endpoint('EFS','Event-free survival statistical uncertainty','Difference did not reach conventional statistical significance (P=0.08).',pop,url,limit)],harms='Consider 48 additional infusion visits and inflammatory, respiratory and cardiovascular reactions. Earlier and later analyses differed on treatment interaction; the eight-percentage-point observed survival difference is not an individual guarantee.')
 if code=='00596':
  pop='Historical single-arm study: 124 children and young adults enrolled; 77 evaluable with mixed recurrent tumour types.'
  return dict(population=pop,comparison='No concurrent comparator; small histology subgroups.',endpoints=[endpoint('ORR','Pooled evaluable-patient response','43/77 responded: 39 partial and 4 complete responses.',pop,url,limit),endpoint('ORR','Small disease-specific subgroups','Ewing sarcoma 16/17; osteosarcoma 3/8. These are small historical counts, not individual response probabilities.',pop,url,limit)],harms='Substantial marrow and organ toxicity requires the current mesna, hydration and white-cell growth-factor support. The historical trial calendar must not replace the current NCCP maximum of seven cycles.')
 pop='Separate uncontrolled cohorts: 37 previously treated Ewing patients (35 evaluable) and 51 retrospective relapsed/unresectable osteosarcoma patients.'
 osteo='https://www.mdpi.com/2073-4409/9/11/2389'
 return dict(population=pop,comparison='Separate single-arm studies with no common comparator; do not pool or rank the cohorts.',endpoints=[endpoint('ORR','Ewing sarcoma response','12/35 evaluable patients (34%) had complete or partial response; 11 stable disease and 12 progression. Median age 17 in the 37-patient cohort.',pop,url,limit),endpoint('ORR','Osteosarcoma response','10/51 patients (20%): one complete and nine partial responses. Retrospective series.',pop,osteo,limit),endpoint('PFS','Osteosarcoma progression-free survival','Abstract reports median 6 months and six-month progression-free survival 51%; full-text median 6.1 months is a different precision presentation.',pop,osteo,limit),endpoint('OS','Osteosarcoma overall survival','Abstract reports median 15 months and two-year overall survival 30%; full text reports median 14.5 months. Subsequent surgery and selection confound interpretation.',pop,osteo,limit)],harms='In the Ewing cohort grade 4 neutropenia affected 97% and thrombocytopenia 54% of courses, not patients; one severe central nervous system toxicity case was reported. No comparative survival claim follows.')

def long_course(d,code):
 if code=='00463':
  phase_rows=[('induction','Before surgery: weeks 1–10','Doxorubicin and cisplatin on days 1–2 of weeks 1 and 6; methotrexate in weeks 4, 5, 9 and 10.',1,70),('surgery','Surgery: reference week 11','Actual timing depends on the operation and recovery. Additional preoperative methotrexate is only a separate consultant decision.',71,77),('postoperative','After surgery: weeks 12–29','Doxorubicin in weeks 12, 17, 22 and 26; cisplatin in weeks 12 and 17; methotrexate in weeks 15, 16, 20, 21, 24, 25, 28 and 29.',78,203)]
  d['calendar_unit']='relative course day';d['course_weeks']=29
  d['long_course_schedule']=dict(unit='reference week',surgery_week=11,preoperative_doxorubicin_cisplatin_weeks=[1,6],preoperative_methotrexate_weeks=[4,5,9,10],postoperative_doxorubicin_weeks=[12,17,22,26],postoperative_cisplatin_weeks=[12,17],postoperative_methotrexate_weeks=[15,16,20,21,24,25,28,29],drug_day_note='Doxorubicin/cisplatin days 1 and 2 of listed weeks; methotrexate day 1, with clearance-dependent rescue.',actual_dates_required=True,rescue_dose_calculator=False,fixed_discharge_date=False)
  warning='This 29-week reference is a whole surgery-linked course, not a repeating 203-day cycle. Drug levels and recovery may extend the timetable.'
 else:
  phase_rows=[('twiceweekly','Weeks 1–12: two infusions each week','At least three days between the two weekly infusions: 24 infusions in this phase.',1,84),('weekly','Weeks 13–36: one infusion each week','Another 24 infusions, for 48 total over 36 weeks. The clock is independent of chemotherapy.',85,252)]
  d['calendar_unit']='relative course day';d['course_weeks']=36
  d['long_course_schedule']=dict(unit='week from actual mifamurtide start',first_phase_weeks=12,first_phase_frequency='twice weekly',minimum_gap_days=3,first_phase_doses=24,second_phase_weeks=24,second_phase_frequency='weekly',second_phase_doses=24,total_doses=48,total_weeks=36,independent_chemotherapy_clock=True,actual_dates_required=True)
  warning='This 36-week reference describes 48 infusions, not 48 chemotherapy cycles or a repeating 252-day cycle.'
 d['phases']=[dict(id=i,label=label,short=label,cycles=['Individually confirmed dates'],agents=[a['id']for a in d['agents']],detail=text)for i,label,text,start,end in phase_rows]
 if code=='00463':d['phases'][1]['agents']=[]
 d['timeline']=[dict(id=i,label=label,start=start,end=end,style='treatment'if i!='surgery'else'review',text=text)for i,label,text,start,end in phase_rows]
 d['day_groups']=[dict(start=start,end=end,title=label,body=text,action='Follow actual appointment dates, recovery checks and the written support plan.')for i,label,text,start,end in phase_rows]
 d['timeline_note']=warning+' Relative days group the phases; they are not daily dosing instructions.'
 d['chronology_notes']=[dict(title='Whole-course reference',text=warning),dict(title='Unplanned delays',text='A delay requires a new prescription and confirmed appointment calendar. Never use this illustration to calculate catch-up doses.')]
 d['patient_summary']['phases']=[dict(title=label,text=text)for i,label,text,start,end in phase_rows]
 d['patient_summary']['card_record_unit']='infusion'if code=='00100'else'treatment visit'
 d['patient_summary']['card_cycle_count']=None
 d['patient_summary']['cycle_heading']='Whole-course reference stages'
 d['patient_summary']['cycle_blocks']=[dict(label=label,text=text)for i,label,text,start,end in phase_rows]

def document_sources(d):
 """Readable source companions, not rendered or paginated PDF substitutes."""
 header=f'# {d["title"]}\n\nExternal educational source draft · {d["code"]} · checked {d["source_checked"]}. Independent clinical, pharmacy and patient review pending.\n'
 handbook=[header,'## Treatment purpose\n\n'+d['purpose'],'## Setting and schedule\n\n'+d['context_label']+'\n\n'+d['schedule_summary']+'\n\n'+d['administration_text']]
 for a in d['agents']:handbook += ['## '+a['name']+'\n\n'+a['mechanism']+'\n\n'+a['explanation']+'\n\n'+a['watch']+'\n\n'+'\n'.join('- '+x for x in a['risks'])]
 handbook += ['## Individual tests and timings\n\n'+'\n\n'.join('### '+t['label']+'\n\nPurpose: '+t['purpose']+'\n\nTiming: '+t['timing']for t in d['monitoring_test_details'])]
 for c in d['chapters']:handbook += ['## '+c['title']+'\n\n'+c['intro']+'\n\n'+'\n\n'.join('### '+i['title']+'\n\n'+i['text']for i in c['items'])]
 handbook += ['## Understanding the evidence\n\n'+d['evidence']['summary']+'\n\n'+d['evidence']['caveat'],'## Questions\n\n'+'\n\n'.join('### '+q['q']+'\n\n'+q['a']for q in d['questions']),'## Sources\n\n'+'\n'.join('- ['+s['title']+']('+s['url']+')'for s in d['sources'])]
 summary=d['patient_summary']
 guide=[header,'This is the source for a planned three-page guide. Actual PDF pagination, typography, anatomy placement and QR checks have not been performed.','## Page 1 source: purpose and treatment\n\n'+d['purpose']+'\n\n'+d['schedule_label']+'\n\n'+'\n\n'.join('**'+p['title']+'** '+p['text']for p in summary['phases'])+'\n\n'+d['treatment_scope_notice'],'## Page 2 source: body map and risks\n\n'+'\n\n'.join('**'+r[1]+'** '+r[3]for r in d['anatomy'])+'\n\n'+d['consent_generic_risks']+'\n\nRead the complete medicine-specific risk sections in the handbook and approved local consent discussion.','## Page 3 source: checks, support and urgent help\n\n'+'\n\n'.join('**'+x['test']+'** '+x['when']for x in summary['monitoring'])+'\n\n'+summary['card_alert']+'\n\n'+d['urgent_extra']+'\n\n'+summary['card_record_note']+'\n\nKeep verified daytime and out-of-hours oncology contact numbers. The information website is not an emergency contact service.']
 if d.get('consent_licensing_note'):guide.append(d['consent_licensing_note'])
 return '\n\n'.join(handbook)+'\n','\n\n'.join(guide)+'\n'

def summary_monitoring(code):
 """Condensed named checks for a standalone guide, not generic deferral rows."""
 rows={
  '00420':[
   ('Blood tests','Full blood count, kidney, liver and electrolytes','Before starting and before each 21-day cycle; repeat sooner for illness or abnormal results.'),
   ('Heart','Heart tracing and pumping-function imaging','Heart tracing before starting. Doxorubicin product information recommends baseline imaging and repeats after approximately each accumulated 100 mg/m²; the team confirms the reconciled schedule.'),
   ('Hearing and nerves','Hearing and nerve review','Review symptoms before more cisplatin; formal hearing tests at baseline or later when clinically indicated. Report changes immediately.'),
   ('Cancer review','Surgery and pathology review','Usually after three preoperative cycles, with postoperative review before the remaining treatment; scans follow the specialist plan.')],
  '00463':[
   ('Blood tests','Full blood count, kidney and liver tests','Before each treatment. Check creatinine daily during methotrexate treatment and clearance monitoring.'),
   ('Drug levels','Methotrexate concentrations','At 24, 48, 72, 96 and 120 hours as appropriate from infusion START; continue later checks when required for delayed clearance.'),
   ('Urine and fluids','Urine pH and fluid balance','Confirm urine pH at least 7 before methotrexate and check every 6 hours during treatment/rescue; record fluid balance every 4 hours.'),
   ('Rescue','Folinic acid rescue','Starts 24 hours after methotrexate START and continues under the specialist clearance plan. Low counts or a delay to later chemotherapy must not automatically stop rescue.'),
   ('Heart, hearing and nerves','Organ and symptom review','Hearing/nerve review before each course. Heart tracing and baseline/serial imaging follow the reconciled anthracycline plan; symptoms may need extra checks.'),
   ('Cancer review','Surgery and postoperative review','Surgery at reference week 11; confirm actual dates, recovery and pathology before the postoperative plan.')],
  '00100':[
   ('Blood counts','Full blood count','Before starting and at the source-defined treatment-cycle reviews; the team writes the actual twice-weekly/weekly-phase test dates.'),
   ('Organ tests','Kidney and liver tests','Before starting and at scheduled reviews; continue after chemotherapy ends until all mifamurtide therapy is complete.'),
   ('Clotting','Clotting tests','After the first dose and again after several doses under product information; confirm exact appointments.'),
   ('Heart','Heart ultrasound','Annually or according to local practice in the national source; concurrent anthracyclines may require extra checks.'),
   ('Infusion and symptoms','Fever, breathing, allergy and cardiovascular review','Observe during administration; fever or sudden illness needs immediate advice between visits. Do not wait eight hours when unwell.')],
  '00596':[
   ('Blood and organ tests','Full blood count, kidney and liver tests','Before starting and each 21-day cycle; ifosfamide product information additionally specifies counts before each administration and afterwards as appropriate.'),
   ('Electrolytes','Sodium, potassium and phosphate','At baseline and regular treatment reviews; repeat during treatment or recovery when results, fluid balance or symptoms require.'),
   ('Brain function','Neurological assessment','Before each ifosfamide dose; report confusion, unusual sleepiness, hallucinations, unsteadiness or seizures immediately.'),
   ('Urine','Urine checks for blood','Before each ifosfamide dose and every 8 hours on treatment days. Report blood or urinary pain immediately.'),
   ('Infusion','Blood pressure and etoposide reactions','Observe during infusion, especially its first 15 minutes; report dizziness, rash, breathlessness or faintness immediately.'),
   ('Fluids','Fluid balance and daily weight','During treatment; prescribed hydration continues for 24 hours after the final ifosfamide infusion ends.')],
  '00680':[
   ('Blood and organ tests','Full blood count, kidney and liver tests','Before starting and each 21-day cycle; ifosfamide product information additionally specifies counts before each administration and afterwards as appropriate. Kidney monitoring continues during and after treatment.'),
   ('Brain function','Neurological assessment','Before each ifosfamide dose; any new confusion, sleepiness, hallucinations, unsteadiness or seizures needs immediate assessment.'),
   ('Urine','Urine checks for blood','Before each ifosfamide dose and every 8 hours on treatment days; promptly report blood or urinary pain.'),
   ('Fluids','Fluid balance and daily weight','During treatment; prescribed hydration continues for 24 hours after the last ifosfamide infusion ends.'),
   ('Cancer review','Tumour, symptoms and function','At specialist-set review points before continuation; scans follow the individual Ewing sarcoma or osteosarcoma plan.')]
 }
 return [dict(stage=stage,test=test,when=when,basis='National regimen, relevant product information and individual specialist plan')for stage,test,when in rows[code]]

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--repo',required=True);ap.add_argument('--output',default=str(HERE/'overlay'));args=ap.parse_args()
 repo=pathlib.Path(args.repo).resolve();out=pathlib.Path(args.output).resolve()
 if out==repo or repo in out.parents:raise SystemExit('REFUSED: draft output must stay outside the application repository.')
 def save(file,obj):
  target=(out/file).resolve()
  if target==repo or repo in target.parents or out not in target.parents:raise RuntimeError('Unsafe output path refused')
  target.parent.mkdir(parents=True,exist_ok=True);target.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
 def save_text(file,value):
  target=(out/file).resolve()
  if target==repo or repo in target.parents or out not in target.parents:raise RuntimeError('Unsafe text-output path refused')
  target.parent.mkdir(parents=True,exist_ok=True);target.write_text(value)
 s=module('sarcoma_facts63',HERE/'sarcoma-v08463-facts.py');h=module('patient_factory58',repo/'tools/author-gu-patients-v08458.py')
 h.VERSION=s.VERSION;h.DATE=s.DATE;h.SOURCE=s.SOURCES;h.save=save
 original_read=h.read;clinical=HERE.parent/'sarcoma-batch4-drafts-20261118/protocols';paths={c:next(clinical.glob(c+'-*.json'))for c in s.SOURCES}
 def read(file):
  for c,path in paths.items():
   if file.startswith('protocols/')and'/'+c+'-'in file:return json.loads(path.read_text())
  return original_read(file)
 h.read=read
 protected=[repo/'tools/author-gu-patients-v08458.py',repo/'tools/consent-core-v08455.cjs',repo/'js/treatment-evidence-v08413.js']
 for c in s.SOURCES:
  protected += [repo/x['path']for x in h.INDEX if'/'+c+'-'in x['path']]
  protected += [p for p in (repo/f'patient/{c}').rglob('*')if p.is_file()]
  if (repo/f'data/patient-knowledge/{c}.json').exists():protected.append(repo/f'data/patient-knowledge/{c}.json')
 protected=list(dict.fromkeys(protected));before={str(p.relative_to(repo)):sha(p)for p in protected}
 facts=s.facts();kb=[];journeys={};support={};checks=[];presentations={}
 primary=json.loads((HERE.parent/'sarcoma-batch4-sources-20261118/primary-evidence-for-knowledge.json').read_text())
 for code,f in facts.items():
  distance=markers(f['anatomy']);d,p=h.build_profile(code,f);assert str(p['metadata']['nccp_version'])==s.SOURCES[code]['version']
  d.update(indication_text=f['context'],administration_route='intravenous',independent_clinical_approval=False,patient_route=code)
  d['source_provenance']=dict(checked=s.DATE,basis='Current official web-extracted regimen text, retained targeted product excerpts and primary publications. Original PDF binary hashes and source-table pixels were not verified.',current_source=next(x for x in s.MANIFEST['sources']if x['code']==code),original_pdf_hash_verified=False,visual_table_review=False,clinical_and_pharmacy_approval=False,external_draft=True)
  if code in ['00420','00463']:d['source_provenance']['product_retrieval_limit']='The national-source-linked cisplatin product document returned 404 on direct open; its indexed text remains available. A current complete cisplatin product-document read is not claimed and must be rechecked before release. The linked doxorubicin document was readable; its explicit cardiac-monitoring supplement is retained.'
  d['sources']=[x for x in d['sources']if x['id']!='ncis'];d['sources'][0]['title']=f'National Cancer Control Programme {code}, version {s.SOURCES[code]["version"]}'
  for a in d['agents']:
   a['source_ids']=['nccp',a['id']+'-pi'];title,url=s.PRODUCTS[a['id']];d['sources'].append(dict(id=a['id']+'-pi',title=title,url=url))
  for trial in primary['trials']:
   if code in trial['routes']and trial['url']!=f['trial_url']:d['sources'].append(dict(id=trial['id'],title=trial['title'],url=trial['url']));d['evidence']['source_ids'].append(trial['id'])
  if code in ['00420','00463','00100']:d['sources'].append(dict(id='nci-bone',title='National Cancer Institute: surgery, chemotherapy and selected radiotherapy in osteosarcoma',url='https://www.cancer.gov/types/bone/hp/osteosarcoma-treatment-pdq'))
  d['support_source_ids']=d['urgent_source_ids']=['nccp']+[a['id']+'-pi'for a in d['agents']]
  d['monitoring_test_details']=copy.deepcopy(f['tests']);d['monitoring_summary']='Use the individual test cards below: each test has its own purpose and timing. Safety tests and tumour-response assessment answer different questions.'
  d['monitoring_schedule']['rows']=[dict(label='Safety tests and symptoms',cells=['Complete the regimen-specific starting tests.','Follow the timings in the individual test cards.','Report new symptoms immediately; additional tests may be needed.','Continue follow-up of abnormal tests or lasting effects.']),dict(label='Medicines and practical care',cells=['Confirm treatment, protective medicines and access.','Record actual doses, support and any holds.','Keep the written support and urgent-contact plan.','Agree remaining medicines and line-care needs.']),dict(label='Tumour review and next steps',cells=['Agree treatment intent and disease assessment.','Use the specialist surgery and response-review plan.','Report changes in symptoms or function.','Agree the next phase, rehabilitation and follow-up.'])]
  d['monitoring_schedule']['note']='The national regimen, product information and individual clinical plan may require different tests. Your treating team writes the actual dates and reviews results before treatment.'
  for chapter in d['chapters']:
   if chapter['id']=='checks':chapter['intro']='Use the individual test cards for purposes and timings.';chapter['items']=[dict(title='Confirm the next tests',text='Before leaving, confirm which tests are due, where they will be done and who reviews each result.',source_ids=['nccp']),dict(title='Safety and treatment benefit',text='Normal blood tests do not show that the tumour is responding. The specialist plans separate imaging, symptom and function reviews.',source_ids=['nccp'])]
  for row in d['timeline']:
   if row['id']=='monitor':row['text']='Use the separate test-specific cards. Contact oncology promptly for new symptoms on any day.'
  for row in d['day_groups']:
   if row['title']=='Between scheduled chemotherapy doses':row['body']='Follow the prescribed support and monitoring plan. Effects can occur between visits. Contact oncology promptly if unwell.'
  d['support'][2]['text']=s.FERTILITY;d['support'][2]['source_ids']=[a['id']+'-pi'for a in d['agents']]
  d['chapters'][2]['items'][2]['text']=s.FERTILITY;d['chapters'][2]['items'][2]['source_ids']=d['support'][2]['source_ids']
  d['chapters'][2]['items'][1]['title']='Intravenous access and care';d['logistics']['sections'][2]['title']='Intravenous access and care'
  d['urgent_extra']=h.URGENT+' '+f['urgent'];d['chapters'][3]['items'][0]['text']=d['urgent_extra']
  d['consent_support']='Discuss the individual aim, realistic benefit and uncertainty, treatment burden, alternatives, serious and lasting risks, fertility, personal priorities and the option to decline or reconsider. '+f['scope']
  generic=s.GENERIC if code!='00100'else'Mifamurtide has its own innate immune-activation risks. Discuss fever/chills, infusion/allergic reactions, breathing problems, inflammatory and cardiovascular symptoms, gastrointestinal effects, dizziness and limited reproductive-safety data. The general chemotherapy section applies to the separately prescribed concurrent chemotherapy: '+s.GENERIC
  d['consent_generic_risks']=generic
  d['chapters'].append(dict(id='consent',title='Your treatment decision',intro='Read the general treatment discussion alongside the individual medicine risks.',items=[dict(title='General chemotherapy risks'if code!='00100'else'Mifamurtide and concurrent chemotherapy risks',text=generic,source_ids=d['support_source_ids']),dict(title='Priorities, alternatives and uncertainty',text=d['consent_support'],source_ids=['nccp']),dict(title='Fertility, pregnancy and breastfeeding',text=s.FERTILITY,source_ids=d['support'][2]['source_ids'])]))
  d['consent_category_policy']=dict(category='innate-immune-activator'if code=='00100'else'chemotherapy',checkpoint_inhibitor=False,concurrent_chemotherapy_requires_own_regimen_consent=code=='00100')
  if code=='00596':
   note='The national source states that this use of etoposide is an unlicensed indication in Ireland. Your clinician must explain the reason, evidence, uncertainties and alternatives, obtain consent under hospital policy, and confirm acknowledgement by the local Drugs and Therapeutics Committee or equivalent.'
   d['consent_licensing_note']=note;d['chapters'][-1]['items'].append(dict(title='Unlicensed indication: etoposide',text=note,source_ids=['nccp']));d['consent_support']+=' '+note
  if code=='00100':
   d['support'][2]['text']='Mifamurtide is not recommended in pregnancy or without effective contraception when pregnancy is possible. Breastfeeding requires an individual benefit–risk decision with the team; the accompanying chemotherapy has its own restrictions. Dedicated mifamurtide fertility studies are lacking. '+s.FERTILITY
   d['chapters'][2]['items'][2]['text']=d['support'][2]['text'];d['chapters'][-1]['items'][2]['text']=d['support'][2]['text']
  d['questions'] += [dict(q='Can treatment restart when a blood test improves?',a='Only when the treating team confirms a new plan. A previous serious reaction, stopped medicine or required protective treatment still matters.'),dict(q='How do the operation and other treatments fit?',a=f['wider']),dict(q='How do I prepare for each visit?',a=f['prep'])]
  summary=d['patient_summary'];summary['monitoring']=summary_monitoring(code)
  summary['cycle_expectations']=['Side effects can occur on any day. Use the verified oncology contact plan promptly if unwell.',f['support']];summary['preparation']=['Bring the medicine list and treatment/contact record. Report new symptoms before treatment.'];summary['card_cycle_count']=None;summary['card_record_note']=f['course']+'. Recording spaces do not define duration.';summary['cycle_blocks']=[dict(label='Treatment',text=f['label']),dict(label='Protection and checks',text='Follow the individual support and test-card timings.'),dict(label='Course length',text=f['course'])]
  if code in ['00463','00100']:long_course(d,code)
  else:d['timeline_note']='Relative treatment days illustrate a prescribed course. They are not dated appointments or guaranteed safe days; actual completion times control continued hydration.'
  summary['card_alert']={'00420':'Report hearing changes, reduced urine, chest symptoms or infusion-site pain promptly.','00463':'Rescue and blood levels follow methotrexate START time. No fixed clearance or discharge date.','00100':'48 infusions on a separate 36-week clock. Fever or sudden illness needs immediate advice.','00596':'Mesna timings start from ifosfamide START. Report confusion or blood in urine immediately.','00680':'Five 24-hour infusions, then final mesna and continued hydration. Report confusion immediately.'}[code]
  d=explain(d);save(f'data/patient-knowledge/{code}.json',d)
  handbook,guide=document_sources(d);save_text(f'handbook-source/{code}.md',handbook);save_text(f'three-page-guide-source/{code}.md',guide)
  p['metadata'].setdefault('source_boundary_notes',[])
  p['eligibility']=dict(setting=f['context'],source_eligibility=p['eligibility'],boundaries=f['boundaries'],note='Orientation only; use the separately reviewed current clinical rules and treating specialist decision.')
  entry=h.knowledge(code,f,d,p);entry.update(patient_route=code,patient_context=None,independent_clinical_approval=False,treatment_setting=f['context'])
  entry['treatment_rationale'].update(line=f['context'],factors=['Exact pathology, resectability, prior treatment, treatment intent, organ function, cumulative exposure, symptom burden and patient priorities.'],alternatives=[f['wider']]);entry['patient_selection']['disease_and_biomarker_context']=[f['context']];entry['patient_selection']['important_cautions']=f['boundaries']+[f['scope'],f['caveat']]
  entry['monitoring_and_toxicity']['test_specific_details']=d['monitoring_test_details'];entry['monitoring_and_toxicity']['disease_monitoring']='Consultant-set tumour, symptom and function assessment; separate from safety tests.';entry['supportive_care']['counselling']=[f['access'],d['support'][2]['text']]
  entry['evidence_at_a_glance'].update(evidence(code,f),checked=s.DATE,applicability=f['caveat']);entry['evidence_at_a_glance']['sources']=[dict(label=t['title'],url=t['url'])for t in primary['trials']if code in t['routes']]
  if code=='00100':entry['evidence_at_a_glance']['endpoints'][0]['analysis_status']+='; reported overall-survival P=0.03'
  entry['patient_resources']=[dict(label=label,url=f'patient/{code}/{file}')for label,file in [('Patient knowledge','knowledge.html'),('Consent discussion','consent-form.html'),('Treatment and monitoring','treatment-journey.html'),('Support medicines','supportive-care.html'),('Three-page guide','guide.pdf'),('Complete handbook','handbook.pdf')]]
  if code=='00596':entry['supportive_care']['licensing_and_consent']=d['consent_licensing_note']
  if code in ['00463','00100']:entry['administration']['long_course_schedule']=d['long_course_schedule']
  kb.append(entry)
  journeys[code]=dict(code=code,title=d['title']+': treatment and checks',release=s.VERSION,checked=s.DATE,status=h.STATUS,schedule_type='relative-educational',has_patient_dates=False,setting=d['context_label'],summary=d['schedule_summary'],stages=d['monitoring_schedule']['columns'],lanes=[dict(**r,kind='monitoring',source_ids=['nccp'],note=d['monitoring_schedule']['note'])for r in d['monitoring_schedule']['rows']],milestones=[dict(title=p['label'],when=p['label'],why=d['purpose'],clinical=p['detail'],action=d['urgent_extra'],source_ids=['nccp'])for p in d['phases']],sources=d['sources'])
  support[code]=[dict(id=i,label=label,active_medicines=names,active_drugs=names,emetogenic_risk=risk,medicines=[dict(name='Individual anti-sickness and protective prescription',dose='Prescribed and reconciled by the specialist team',timing='The prescription specifies treatment-day, delayed and rescue support',note=f['support'])],additional_support=[f['support'],f['prep'],f['access']],source_checked=s.DATE,source_url=s.SOURCES[code]['catalogue_url'],source_page='Treatment, monitoring and supportive-care sections',guidance=dict(label='Current national regimen',url=s.SOURCES[code]['catalogue_url']))for i,label,names,risk in f['phases']]
  presentations[code]=f'data/patient-knowledge/{code}.json'
  sourceids={x['id']for x in d['sources']}
  def refs(x):
   if isinstance(x,dict):
    if 'source_ids'in x:assert set(x['source_ids'])<=sourceids,(code,x['source_ids'])
    for v in x.values():refs(v)
   elif isinstance(x,list):
    for v in x:refs(v)
  refs(d)
  assert 'urology'not in json.dumps(d).lower()
  assert all(len(a['risks'])>=5 for a in d['agents'])
  assert all(t['timing']not in [f['baseline'],f['monitoring'],f['baseline']+' '+f['monitoring']]for t in d['monitoring_test_details'])
  unexplained=[x for x in walk(d)if not x.startswith(('http','NCCP_'))and re.search(r'\b(?:FBC|CPK|ECG|ECHO|MUGA|LVEF|MTX|G-CSF|PPI|NSAIDs|CrCl|ULN|PICC|MAP|MAPIE)\b',x)]
  assert not unexplained,unexplained
  checks.append(dict(code=code,protocol_id=d['protocol_id'],source_version=d['protocol_version'],anatomy_rows=8,minimum_marker_distance_mm=distance,test_specific_cards=len(d['monitoring_test_details']),generic_and_agent_consent=True,acronyms_expanded=True,source_references_resolve=True,clinical_approval=False))
 save('data/regimen-knowledge-base-v08463-addendum.DRAFT.json',dict(schema_version='1.0',release=s.VERSION,regimen_profiles=kb))
 save('draft-integration/journey-fragments.json',journeys);save('draft-integration/base-phase-support.json',support);save('draft-integration/presentation-routes.json',presentations);save('draft-integration/authored-facts.json',facts)
 save('draft-integration/workflow-fragments.json',[dict(code=c,protocol_id=json.loads(paths[c].read_text())['protocol_id'],patient_route=c,source_checked=s.DATE,phases=support[c],clinical_source_boundaries=facts[c]['boundaries'])for c in facts])
 after={str(p.relative_to(repo)):sha(p)for p in protected};assert before==after,'Protected application files changed during this build'
 save('draft-integration/protected-application-manifest.json',before)
 checkpoint=clinical.parent/'clinical-draft-checkpoint.json'
 save('draft-integration/input-manifest.json',dict(factory=dict(path=str(repo/'tools/author-gu-patients-v08458.py'),sha256=sha(repo/'tools/author-gu-patients-v08458.py')),clinical_drafts={c:dict(path=str(p),sha256=sha(p))for c,p in paths.items()},clinical_checkpoint=dict(path=str(checkpoint),sha256=sha(checkpoint)),source_manifest_sha256=sha(HERE.parent/'sarcoma-batch4-sources-20261118/source-manifest.json'),primary_evidence_manifest_sha256=sha(HERE.parent/'sarcoma-batch4-sources-20261118/primary-evidence-for-knowledge.json')))
 save('draft-integration/draft-checks.json',dict(status='Five external complete source drafts; application integration and document rendering remain separate',checks=checks,protected_application_file_count=len(before),protected_application_bytes_unchanged=True,no_application_files_written=True,browser_visual_review='not run',standalone_pdf_and_qr_checks='not run',clinical_approval=False))
 save('draft-integration/integration-requirements.json',dict(required=['Extend existing builder release allowlists or use schedule_label independently of a hardcoded release list.','MAP and mifamurtide are whole-course references: never label them repeating 203-day or 252-day cycles.','Carry long_course_schedule and authored phase rows into journey, portal and summary; preserve independent mifamurtide clock.','Mifamurtide must not select checkpoint immunotherapy consent or routine steroid antiemetics. Add its authored generic innate-immune discussion and separate concurrent-chemotherapy explanation.','Carry IE unlicensed etoposide indication note into the printable consent form and clinician workflow.','Render the three-page guide, full handbook and complete consent PDF; check readable text, margins, page count, source URLs and QR destinations before release.','No automatic MAP rescue dose, drug-clearance stop, discharge date or copied day-29 calendar mapping.','Review all product-source differences with the clinical/pharmacy reviewers.']))
 print(f'Created five external profiles and integration fragments at {out}; {len(before)} protected application files unchanged.')
if __name__=='__main__':main()
