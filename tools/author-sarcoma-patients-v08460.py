#!/usr/bin/env python3
"""Author five sarcoma education routes; never modify the clinical protocols."""
import copy
import math
import importlib.util
import pathlib

ROOT=pathlib.Path(__file__).resolve().parents[1]
def module(name,path):
    spec=importlib.util.spec_from_file_location(name,ROOT/path)
    result=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result

h=module('patient_base58','tools/author-gu-patients-v08458.py')
source=module('sarcoma_facts60','tools/sarcoma-v08460-facts.py')
h.VERSION='0.84.60'
h.DATE=source.DATE
h.SOURCE=source.SOURCES
h.NCIS='https://assets.hse.ie/media/documents/Supportive_Care_Antiemetics_for_inclusion_NCIS_Medical_Oncology.pdf'
FACTS=source.facts(h.agent_from)

def assert_anatomy_separation(rows):
    # Approved print artwork is 66.442 x 146 mm. Seven mm separates the
    # marker centres and catches coincident numbered blood/kidney markers.
    assert len(rows)==8, 'Expected eight authored anatomy callouts'
    for index,a in enumerate(rows):
        for b in rows[index+1:]:
            distance=math.hypot((a[4]-b[4])*66.442/100,(a[5]-b[5])*146/100)
            assert distance>=7, f'Anatomy marker overlap: {a[0]} / {b[0]} ({distance:.2f} mm)'

for authored in FACTS.values():
    assert_anatomy_separation(authored['anatomy'])

def support(code,d,f,workflow,phase_data):
    selector=dict(protocol_id=d['protocol_id'],source_version=d['protocol_version'],source_url=d['sources'][0]['url'],source_checked=h.DATE,source_pages=list(range(1,h.SOURCE[code]['pages']+1)),phases=[])
    rows=[]
    for phase_id,label,agents,risk in f['phases']:
        plan_id='sarcoma60_'+code+'_'+phase_id
        if code in ['00391','00392']:
            plan=dict(label=label,risk_level='high',day1=[],subsequent=[],warnings=[f['support'],'This multi-day ifosfamide regimen requires an individually checked prevention and delayed-sickness prescription. An automatic single-day aprepitant course is not supplied because the source flags a possible encephalopathy interaction.'])
            medicines=[
                dict(name='Mesna: initial dose',dose='900 mg/m² IV over 10 minutes',timing='Day 1, before the first ifosfamide infusion',note='Source reference; the trained team confirms the complete prescription.'),
                dict(name='Mesna: continuous infusion',dose='3000 mg/m² IV over 24 hours',timing='Each of days 1–3',note='The source also requires uroprotection to continue until 24 hours after ifosfamide. Pharmacy reconciles actual start/finish times; do not stop or alter the pump yourself.'),
                dict(name='Intravenous hydration',dose='Source reference: 1000 mL sodium chloride 0.9% every 6 hours',timing='From before the first ifosfamide dose until 24 hours after completion',note='The team must prescribe and monitor individual fluid balance, kidney/heart suitability and electrolytes. This is not a home drinking target.'),
                dict(name='G-CSF',dose='Product and dose prescribed individually',timing='The team specifies the post-chemotherapy start and duration',note='Required supportive treatment in NCCP 00391/00392; confirm injection teaching and supply before discharge.'),
                dict(name='Proton-pump inhibitor',dose='Product and dose prescribed individually',timing='Follow the written prophylaxis course',note='PPI prophylaxis is explicitly required in this NCCP regimen.'),
                dict(name='Multi-day anti-sickness medicines',dose='Individual oncology/pharmacy prescription',timing='During chemotherapy and for the prescribed delayed-risk period',note='Check interactions, sedation, rescue medicines and steroid duplication; aprepitant may increase ifosfamide-related encephalopathy.')]
        else:
            plan=copy.deepcopy(workflow['antiemetic_plans']['high_standard' if risk=='high' else 'low'])
            plan['warnings']=list(dict.fromkeys(plan.get('warnings',[])+[f['support'],'Use one agreed support prescription. Reconcile local adjuncts and avoid duplicate steroid or anti-sickness courses.']))
            medicines=[dict(name=m['medicine'],dose=' '.join([m['dose'],m['route'],m['frequency']]),timing=m['timing'],note='Support-course day 1 means the selected treatment visit. This reference requires the treating team’s prescription.') for part in ['day1','subsequent'] for m in plan[part]]
            if code=='00501' and phase_id=='day8':
                medicines.append(dict(name='Dexamethasone: docetaxel premedication',dose='8 mg by mouth twice daily',timing='Days 7, 8 and 9; start the day before docetaxel',note='NCCP requires at least 3 doses before docetaxel. Reconcile with all anti-sickness steroids; report missed or vomited doses to the team.'))
                medicines.append(dict(name='G-CSF, if prescribed',dose='Individual prescription',timing='The team specifies the start and duration',note='May be used in this regimen; it is not a universal mandatory course in NCCP 00501.'))
        plan.update(label=label,source_url=d['sources'][0]['url'],source_checked=h.DATE)
        workflow['antiemetic_plans'][plan_id]=plan
        selector['phases'].append(dict(id=phase_id,label=label,active_medicines=agents,plan_id=plan_id,notes=[f['schedule'],f['support']]))
        row=dict(id=phase_id,label=label,active_medicines=agents,active_drugs=agents,emetogenic_risk=risk,medicines=medicines,additional_support=list(dict.fromkeys([f['prep'],f['support'],f['access']]+plan.get('warnings',[]))),source_page='Treatment schedule and supportive-care sections',source_checked=h.DATE,source_url=d['sources'][0]['url'],guidance=dict(label='NCCP regimen and NCIS antiemetic guidance; confirm the local prescription',url=d['sources'][0]['url']))
        if plan.get('local_prescription_source_id'):
            row['local_reference']=dict(label=workflow['sources'][plan['local_prescription_source_id']]['label'],note=plan['local_adjunct_note']+' The historical local proforma needs current pharmacy confirmation. It is an alternative reference, not a second course to add automatically.',items=copy.deepcopy(plan['local_prescription_items']))
        rows.append(row)
    workflow['supportive_phase_selectors'][code]=selector
    phase_data['regimens'][code]=rows

def monitoring(code,d):
    def test(label,purpose,timing,kind='blood',scope='routine',sources=None):
        return dict(label=label,purpose=purpose,timing=timing,kind=kind,scope=scope,source_ids=sources or ['nccp'])
    fbc='Before first treatment and before each cycle. Extra counts may be needed for symptoms or abnormal results.'
    if code=='00501':fbc='At baseline and before the day 1 and day 8 treatment decisions. Day 1 and day 8 count thresholds differ.'
    if code=='00511':fbc='Before first treatment and before every treatment. Counts may fall several weeks after a dose; infection, bleeding or previous low counts may require extra tests.'
    tests=[test('Full blood count','Check white cells for infection risk, haemoglobin for anaemia and platelets for bleeding risk.',fbc),test('Kidney and liver tests','Check safe medicine handling and identify kidney or liver effects.','At baseline and before each cycle; repeat sooner for symptoms, abnormal results or clinical concerns.')]
    if code in ['00500','00391','00392']:
        threshold='at least 50%'if code=='00500'else'above 50%'
        tests.append(test('Heart assessment and lifetime exposure','Assess anthracycline-related heart risk and account for previous doxorubicin or related treatment.',f'electrocardiogram (ECG) before treatment. echocardiogram (heart ultrasound) (ECHO) or multigated acquisition (heart pumping) scan (MUGA) if over 65 or clinically indicated; the source baseline left ventricular ejection fraction (heart pumping measurement) (LVEF) criterion is {threshold}. Review cardiac symptoms and cumulative anthracycline exposure during treatment; further heart tests follow clinical risk or symptoms.','procedure','conditional',['nccp','doxorubicin-pi']))
    if code=='00500':tests.append(test('Mouth and throat examination','Identify soreness, infection or problems affecting nutrition.','Before starting; review mouth symptoms during treatment and examine as indicated.','review'))
    if code in ['00391','00392']:
        tests.extend([test('Neurological checks','Detect ifosfamide-related brain effects early.','Before each ifosfamide dose; assess immediately for new confusion, unusual sleepiness, hallucinations or seizures.','review','routine',['nccp','ifosfamide-pi']),test('Urine, fluid balance and electrolytes','Detect bladder bleeding, kidney injury or fluid/electrolyte problems despite mesna.','Check for blood in urine before each ifosfamide dose and every 8 hours on treatment days. Urine output, fluid balance and electrolytes follow the individual ifosfamide and hydration prescription.','procedure','routine',['nccp','ifosfamide-pi'])])
    if code=='00501':tests.append(test('Bone profile','Check baseline bone-related blood chemistry.','Before treatment; repeat later only if clinically indicated.'))
    tests.extend([test('Medicines and symptoms','Check interactions, treatment toxicity and whether support prescriptions are complete.','Before treatment and at each treatment review; report new symptoms or medicine changes between visits.','review'),test('Cancer response and follow-up','Assess cancer control separately from safety blood tests.','Your consultant sets the scan and clinical-review schedule according to the sarcoma and treatment aim.','scan','conditional')])
    d['monitoring_test_details']=tests
    d['monitoring_summary']='Use the test-specific schedule below. Safety tests, symptom checks and scans serve different purposes.'
    d['monitoring_schedule']['rows']=[dict(label='Safety tests and symptoms',cells=['Complete baseline checks in the full treatment reference.','Repeat cycle tests and the regimen-specific checks in your written test plan.','Report symptoms promptly; extra tests may be needed.','Follow abnormal results and lasting effects until a plan is agreed.']),dict(label='Medicines and practical care',cells=['Confirm the written treatment and support prescriptions.','Record actual treatment, support and any safety hold.','Follow the support and contact plan.','Review ongoing support and line-care or removal needs.']),dict(label='Cancer treatment and follow-up',cells=['Agree the treatment goal and baseline cancer assessment.','Review benefit using the specialist plan.','Report new or changing cancer-related symptoms.','Agree the next sarcoma treatment or follow-up plan.'])]
    for row in d['timeline']:
        if row['id']=='monitor':row['text']='Keep the agreed blood tests, symptom checks and review appointments. See the individual test schedule for timing.'
    chapter=next(c for c in d['chapters']if c['id']=='checks')
    chapter['intro']='Each test has a specific purpose. Use the individual test cards in the monitoring section.'
    chapter['items']=[dict(title='Your testing appointments',text='Before leaving, confirm which tests are needed, where they will be done and when the results will be reviewed. Keep the regimen-specific schedule above.',source_ids=['nccp']),dict(title='Safety and benefit are different questions',text='Normal safety blood tests do not by themselves show that treatment is working. Your specialist sets the separate cancer-review plan.',source_ids=['nccp'])]

def profile(code,f):
    d,p=h.build_profile(code,f)
    d['indication_text']=f['context']
    d['independent_clinical_approval']=False
    d['source_provenance']=dict(checked=h.DATE,basis='Current official NCCP web-extracted text verified; visual source-table inspection remains pending because screenshot retrieval returned no image pixels. Medicine risks checked against HPRA/EMA product information.',original_pdf_hash_verified=False,release_scope='Authored feasibility content; independent clinician and pharmacy review pending.')
    d['sources'].append(dict(id='sarcoma-context',title='NCI adult soft tissue sarcoma treatment overview',url=source.NCI))
    for a in d['agents']:
        title,url=source.PRODUCTS[a['id']]
        a['source_ids']=['nccp',a['id']+'-pi']
        d['sources'].append(dict(id=a['id']+'-pi',title=title+'; confirm the supplied formulation',url=url))
    d['administration_route']='intravenous'
    d['timeline_note']='Illustrative treatment days, not dated appointments or guaranteed safe days. Your team confirms doses, delays, tests and support-medicine timing.'
    for group in d['day_groups']:
        if group['title']=='Between scheduled chemotherapy doses':
            group['body']='Continue the prescribed support and monitoring plan. Side effects can occur between visits and late in the cycle. Contact oncology promptly if unwell.'
    d['monitoring_schedule']['rows'][2]['cells'][-1]='Agree sarcoma-team follow-up, response assessment and the next systemic or local-treatment plan.'
    d['monitoring_schedule']['rows'][1]['cells'][-1]='Review lasting effects, support needs and any line removal or ongoing line-care plan.'
    d['support'][2]['text']=source.FERTILITY
    d['support'][2]['source_ids']=[a['id']+'-pi' for a in d['agents']]
    d['support'][3]['source_ids']=['nccp','sarcoma-context']
    d['logistics']['sections'][2]['title']='Intravenous access and line care'
    d['chapters'][2]['items'][1]['title']='Intravenous access and line care'
    d['chapters'][2]['items'][2]['text']=source.FERTILITY
    d['chapters'][2]['items'][2]['source_ids']=[a['id']+'-pi' for a in d['agents']]
    d['chapters'][0]['items'][2]['source_ids']=['nccp','sarcoma-context']
    d['urgent_extra']=h.URGENT+' '+f['urgent']
    d['chapters'][3]['items'][0]['text']=d['urgent_extra']
    d['consent_support']='Discuss the treatment goal, alternatives including supportive care, uncertainty of benefit, common and serious risks, lasting effects and individual priorities. Record questions and the agreed plan. '+f['scope']
    d['consent_generic_risks']=source.GENERIC
    d['chapters'].append(dict(id='consent',title='Your consent discussion',intro='Use the general treatment risks and the separate medicine-specific risks together.',items=[dict(title='General chemotherapy risks',text=source.GENERIC,source_ids=['nccp']+[a['id']+'-pi' for a in d['agents']]),dict(title='This regimen and your priorities',text=d['consent_support'],source_ids=['nccp']),dict(title='Fertility, pregnancy and breastfeeding',text=source.FERTILITY,source_ids=[a['id']+'-pi' for a in d['agents']])]))
    if code in ['00391','00392']:
        d['timeline'].append(dict(id='mesna-fluids',label='Mesna and prescribed fluids',start=1,end=4,style='support',text='Support extends beyond the last chemotherapy dose. The team confirms actual mesna and hydration start/finish times from the prescription; the source requires continuation to 24 hours after ifosfamide.'))
        d['patient_summary']['card_alert']='Ifosfamide: confusion, unusual sleepiness or blood in urine needs immediate oncology assessment.'
    if code=='00501':
        d['timeline'].append(dict(id='dexamethasone',label='Docetaxel steroid premedication',start=7,end=9,style='support',text='Dexamethasone 8 mg by mouth twice daily for 3 days starting day 7; confirm at least 3 doses before day 8 docetaxel.'))
        d['patient_summary']['card_alert']='Gemcitabine runs over 90 minutes. Confirm day 7–9 dexamethasone before day 8 docetaxel.'
    if code=='00511':
        d['support'].append(dict(title='Delayed blood-count and liver effects',text='Counts can fall several weeks after dacarbazine. Report fever, bleeding or sudden illness throughout the cycle. Severe upper abdominal pain, yellow eyes or increasing abdominal swelling needs urgent assessment.',source_ids=['dacarbazine-pi']))
    monitoring(code,d)
    # Keep the approved three-page summary concise; fuller detail is retained above.
    summary=d['patient_summary']
    summary['monitoring']=[dict(stage='Before',test='Baseline safety review',when='Blood count, kidney/liver tests and regimen-specific checks. Review medicines, fertility and pregnancy precautions.',basis='NCCP and product information'),dict(stage='During',test='Safety review before treatment',when='Blood tests and symptom review before each cycle; additional day-specific checks as shown in the full treatment reference.',basis='NCCP'),dict(stage='Response',test='Cancer review',when='Your sarcoma team sets scan timing and treatment review.',basis='Individual plan')]
    summary['cycle_expectations']=['Side effects can occur on any day. Use the verified oncology contact number if unwell.', 'Confirm treatment dates, support medicines and the next blood-test appointment.']
    summary['preparation']=['Bring your medicine list and treatment/contact card. Confirm the written support plan and report new symptoms before treatment.']
    summary['card_record_note']=f['course']+'. Recording spaces do not prescribe duration.'
    summary['card_cycle_count']=None
    summary['cycle_blocks']=[dict(label='Treatment days',text=f['label']),dict(label='Support and checks',text='Follow your written medicines, tests and symptom-contact plan.'),dict(label='Next review',text=f['course']+'. Your team confirms continuation.')]
    d['questions'] += [dict(q='Are blood tests the same as checking whether treatment works?',a='No. Blood counts and organ tests mainly check safety. Your sarcoma team uses the clinical review and planned imaging to assess cancer control.'),dict(q='Where do surgery and radiotherapy fit?',a=f['wider'])]
    h.save('data/patient-knowledge/'+code+'.json',d)
    return d,p

def main():
    workflow=h.read('data/regimen-workflow-v0750.json')
    phase_data=h.read('data/phase-support-v0838.json')
    journeys=h.read('data/breast-treatment-journeys-v0837.json')
    presentation=h.read('data/patient-presentation-v08431.json')
    kb=[]
    for code,f in FACTS.items():
        d,p=profile(code,f)
        # A local copy only: this author never writes a clinical protocol.
        p['metadata'].setdefault('source_boundary_notes',[])
        support(code,d,f,workflow,phase_data)
        entry=h.knowledge(code,f,d,p)
        entry['independent_clinical_approval']=False
        entry['treatment_setting']=f['context']
        entry['treatment_rationale']['line']=f['context']
        entry['treatment_rationale']['factors']=['Expert sarcoma pathology and subtype; resectability and disease extent; previous systemic treatment and anthracycline exposure; performance status, organ function, treatment goals and patient preference.']
        entry['treatment_rationale']['alternatives']=['Specialist sarcoma MDT review of histology- and setting-specific systemic options or trials, local surgery/radiotherapy when appropriate, and symptom-focused supportive care.']
        entry['patient_selection']['disease_and_biomarker_context']=[f['context'],'These cytotoxic regimens have no general tumour-biomarker selection rule; histological diagnosis and specialist review remain essential.']
        entry['patient_selection']['important_cautions'] += [f['caveat']]
        entry['supportive_care']['counselling']=[f['access'],source.FERTILITY]
        entry['administration']['route_and_duration']=[f['administration']]
        entry['evidence_at_a_glance']['applicability']=f['caveat']
        entry['patient_resources'] += [dict(label='Complete patient handbook',url='patient/'+code+'/handbook.pdf')]
        kb.append(entry)
        presentation['routes'][code]='data/patient-knowledge/'+code+'.json'
        journeys[code]=dict(code=code,title=f['title']+': treatment and checks',release=h.VERSION,checked=h.DATE,status=h.STATUS,schedule_type='relative-educational',has_patient_dates=False,setting=f['context'],summary=f['schedule'],stages=d['monitoring_schedule']['columns'],lanes=[dict(**row,kind='monitoring',source_ids=['nccp'],note=d['monitoring_schedule']['note'])for row in d['monitoring_schedule']['rows']],milestones=[dict(title='Treatment review',when=f['label'],why=f['purpose'],clinical=f['schedule'],action=d['urgent_extra'],source_ids=['nccp'])],sources=d['sources'])
        if code not in journeys.get('codes',[]):journeys.setdefault('codes',[]).append(code)
    for path,obj in [('data/regimen-workflow-v0750.json',workflow),('data/phase-support-v0838.json',phase_data),('data/breast-treatment-journeys-v0837.json',journeys),('data/patient-presentation-v08431.json',presentation)]:h.save(path,obj)
    h.save('data/regimen-knowledge-base-v08460-addendum.json',dict(schema_version='1.0',release=h.VERSION,regimen_profiles=kb))
    h.save('validation/sarcoma-v08460/clinical/authored-patient-facts.json',FACTS)
    print('Five source-specific sarcoma patient profiles, knowledge entries and support plans authored; independent approval remains pending.')

if __name__=='__main__':main()
