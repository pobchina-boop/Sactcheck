#!/usr/bin/env python3
"""Build authored GU profiles and consistent clinician/patient data, scoped to v58.

No template may supply an indication, dose, test interval or evidence claim.
Those fields are explicitly authored below from the retained source records.
"""
import copy
import json
import pathlib
import importlib.util

ROOT=pathlib.Path(__file__).resolve().parents[1]
DATE='2026-11-17'; VERSION='0.84.58'
def read(p): return json.loads((ROOT/p).read_text())
def save(p,d):
    f=ROOT/p;f.parent.mkdir(parents=True,exist_ok=True);f.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
SOURCE={x['code']:x for x in read('validation/gu-v08458/clinical/new-and-repeat-sources.json')}
INDEX=read('protocols/index.json')['protocols']
STATUS='Source-reconciled feasibility draft; independent clinician, pharmacy and patient review pending.'
NCIS='https://healthservice.hse.ie/documents/7180/Supportive_Care_Antiemetics_for_inclusion_NCIS_Medical_Oncology.pdf'
URGENT='Call oncology immediately for fever, shaking chills, suddenly feeling unwell, unusual bleeding, new breathlessness, very little urine, severe rash or vomiting that prevents drinking. Follow your hospital’s temperature and contact instructions. Severe breathing difficulty, chest pain, collapse or seizures: call 112/999.'
RESPONSE='Your consultant sets scan and response-review timing for your cancer and treatment intent. Safety blood tests do not by themselves show whether treatment is working.'
FERTILITY='Discuss fertility preservation before treatment, effective contraception, pregnancy prevention and breastfeeding. Your team must specify the precautions and duration for every medicine in your plan.'
HYDRATION='Cisplatin needs prescribed intravenous fluids and electrolyte monitoring/replacement. Follow your own fluid advice; tell the team about heart failure or fluid restriction. Review kidney function, hearing, nerves and other medicines before treatment.'
SICKNESS='Use one written anti-sickness plan, including medicines before treatment, tablets for home and rescue treatment. Your team reconciles steroids, interactions and any stomach-protection medicine from your local prescription.'

def agent_from(code,agent):
    return copy.deepcopy(next(a for a in read('data/patient-knowledge/'+code+'.json')['agents'] if a['id']==agent))

GEM=agent_from('00281','gemcitabine'); CIS=agent_from('00281','cisplatin'); FU=agent_from('00591','fluorouracil')
GEM['risks']=['Low blood counts, serious infection, anaemia and bleeding','Nausea, vomiting, fatigue, flu-like symptoms and swelling','Rash, sore mouth and liver-test changes','Uncommon or rare serious lung inflammation, kidney injury including haemolytic uraemic syndrome, severe skin reactions and capillary leak']
CIS['risks']=['Nausea and vomiting, sometimes severe','Kidney injury and low magnesium or other electrolyte changes','Hearing loss or ringing in the ears, which may be lasting','Numbness or tingling from nerve damage, sometimes lasting','Low blood counts, serious infection and bleeding','Allergic reactions; possible fertility harm']
MITO=dict(id='mitomycin',name='Mitomycin',alias='Mitomycin C',type='Chemotherapy',mechanism='Links DNA strands so cells cannot copy them normally',explanation='Mitomycin damages the DNA that dividing cells need. With fluorouracil it helps radiotherapy act against bladder cancer. Healthy marrow and other tissues can also be affected.',visual=['DNA damage','Cell division interrupted','Radiotherapy support'],watch='Report fever, unusual bruising, reduced urine, breathlessness or pain around the drip promptly.',risks=['Low blood counts, serious infection and bleeding, which may be delayed','Nausea, mouth soreness and skin reactions','Tissue damage if the medicine leaks outside the vein','Rare serious kidney/blood-vessel injury including haemolytic uraemic syndrome','Rare serious lung inflammation; possible fertility harm'],symptoms=['Fever / chills','Bleeding / bruising','Fatigue','Nausea','Mouth soreness / ulcers','Breathing / cough','Urinary symptoms'],source_ids=['nccp'])

GEM_ANATOMY=copy.deepcopy(read('data/patient-knowledge/00281.json')['anatomy'])
RT_ANATOMY=[
 ['lungs','Breathing','Gemcitabine','New cough or breathlessness needs urgent assessment.',61.5,24.7],
 ['mouth','Mouth','Gemcitabine','Report soreness or ulcers that interfere with drinking.',50,13],
 ['liver','Liver','Gemcitabine','Blood tests check the liver; report yellow eyes or dark urine.',43,33],
 ['bowel','Bowel','Radiotherapy / gemcitabine','Report frequent diarrhoea, abdominal pain or inability to drink.',50,44.5],
 ['kidneys','Bladder / urine','Radiotherapy / gemcitabine','Report burning, blood in urine, reduced urine or inability to pass urine.',39.5,38.6],
 ['blood','Blood / infection','Gemcitabine','Fever, sudden illness or unusual bleeding needs urgent advice.',39,39],
 ['skin','Skin','Gemcitabine / radiotherapy','Follow the skin-care plan; report blistering or widespread rash urgently.',65,70],
 ['nerves','Whole-body symptoms','Gemcitabine / radiotherapy','Fatigue can build during treatment. Call if suddenly weak or unwell.',35,77],
]
MITO_ANATOMY=[
 ['lungs','Breathing','Mitomycin','New breathlessness or cough needs urgent assessment.',61.5,24.7],
 ['mouth','Mouth','Fluorouracil','Report painful mouth ulcers, especially if you cannot drink.',50,13],
 ['heart','Heart / chest','Fluorouracil','Chest pain, breathlessness or faintness needs emergency assessment.',48,25],
 ['bowel','Bowel','Fluorouracil / radiotherapy','Report diarrhoea early; severe pain or dehydration needs urgent help.',50,44.5],
 ['kidneys','Kidneys / bladder','Mitomycin / radiotherapy','Report reduced urine, blood in urine or painful urination.',39.5,38.6],
 ['blood','Blood / infection','Chemotherapy','Fever, sudden illness or unusual bleeding needs urgent advice.',39,39],
 ['skin','Skin / hands / feet','Fluorouracil / mitomycin','Report painful palms/soles, rash or pain/swelling around the intravenous line.',65,70],
 ['nerves','Brain / nerves','Fluorouracil','Sudden confusion, unsteadiness or severe unexpected symptoms need urgent help.',50,8],
]

FACTS={
 '00282':dict(title='Gemcitabine + cisplatin · 28-day schedule',context='Advanced urothelial cancer',purpose='Help control advanced urothelial cancer and its symptoms.',days=28,kind='cyclical',label='Days 1, 8 and 15 · every 28 days',agents=[GEM,CIS],anatomy=GEM_ANATOMY,
  schedule='Gemcitabine is given on days 1, 8 and 15. Cisplatin is usually given after gemcitabine on day 1; the source also permits day 2. The cycle repeats every 28 days, usually for four to six cycles. Your unit confirms your actual cisplatin day and appointments.',
  administration='Gemcitabine runs into a vein over 30 minutes. Cisplatin runs over 60 minutes with prescribed fluids before and after. Tests, pharmacy preparation, review and support medicines add to the visit time.',
  baseline='Full blood count, kidney and liver tests; review hearing, nerves, general health, medicines and ability to receive cisplatin fluids. Hearing testing is arranged if clinically indicated.',
  monitoring='Full blood count, kidney and liver tests on day 1; blood count and creatinine before day 8. Day-15 treatment also needs review against the intracycle count and toxicity criteria; your unit confirms the required tests. Check symptoms before every dose.',
  support=SICKNESS+' '+HYDRATION+' Gemcitabine-only days have a separate lower-risk anti-sickness plan.',prep='Confirm your cisplatin day, blood-test appointments and written support prescriptions.',
  access='Suitable intravenous access is needed. This schedule does not routinely use a take-home infusion pump.',
  wider='This schedule is systemic treatment for advanced disease. Surgery or radiotherapy may help selected local problems; they are not automatically part of this chemotherapy calendar. Discuss the subsequent treatment or observation plan after chemotherapy.',
  scope='This is NCCP 00282: cisplatin 70 mg/m² with gemcitabine days 1, 8 and 15 over 28 days. It is distinct from split-dose cisplatin and four-cycle upper-tract adjuvant treatment.',
  trial='GemCis versus MVAC (2000)',trial_url='https://pubmed.ncbi.nlm.nih.gov/11001674/',
  evidence='A randomised trial in previously untreated advanced urothelial cancer compared 28-day gemcitabine/cisplatin with MVAC. Response rates were 49% and 46%; overall survival did not differ significantly (hazard ratio 1.04, 95% confidence interval 0.82–1.32).',
  caveat='The study did not prove every GemCis schedule equivalent. It used cisplatin on day 2 and predates newer systemic options. Group averages cannot predict an individual outcome.',
  doses=[('gem1','Gemcitabine + cisplatin',1,1,'Confirm whether cisplatin is scheduled on day 1 or day 2.'),('gem8','Gemcitabine',8,8,'Blood counts and symptoms may change this dose.'),('gem15','Gemcitabine',15,15,'The day-15 dose has its own safety review.')],
  phases=[('day1','Cisplatin-containing visit',['gemcitabine','cisplatin'],'high'),('gemcitabine','Gemcitabine-only days 8 and 15',['gemcitabine'],'low')]),
 '00622':dict(title='Gemcitabine + split-dose cisplatin',context='Advanced urothelial cancer · split-dose schedule',purpose='Help control advanced urothelial cancer and its symptoms.',days=21,kind='cyclical',label='Both medicines on days 1 and 8 · every 21 days',agents=[GEM,CIS],anatomy=GEM_ANATOMY,
  schedule='Gemcitabine and cisplatin are both given on days 1 and 8 of a 21-day cycle, usually for four to six cycles. Cisplatin is split into two 35 mg/m² doses; do not use another GemCis calendar.',
  administration='At each treatment visit gemcitabine runs into a vein over 30 minutes and cisplatin over 60 minutes, with prescribed fluids and support medicines. Your unit confirms visit length.',
  baseline='Full blood count, kidney and liver tests; review hearing, nerves, other medicines and ability to receive fluids. The team must confirm whether this split-dose cisplatin plan is suitable for your kidney function.',
  monitoring='Full blood count, kidney and liver tests on day 1; blood count and creatinine before day 8. Review symptoms, hearing, nerves, hydration and electrolytes before cisplatin.',
  support=SICKNESS+' '+HYDRATION+' Both day 1 and day 8 contain cisplatin and need their own prescribed support course.',prep='Confirm two cisplatin visits per cycle and how the home anti-sickness courses fit each visit.',
  access='Suitable intravenous access is needed. This is not a routine take-home infusion-pump schedule.',
  wider='Treatment choice depends on kidney function, hearing, nerves, fitness and previous treatment. The source contains inconsistent renal eligibility wording, so the treating team must resolve suitability before prescribing.',
  scope='NCCP 00622 uses cisplatin 35 mg/m² on both days 1 and 8. Its impaired-renal-function indication and CrCl <60 exclusion need clinical reconciliation; a split dose does not itself prove cisplatin is safe.',
  trial='Evidence context for GemCis',trial_url='https://pubmed.ncbi.nlm.nih.gov/11001674/',
  evidence='Gemcitabine and cisplatin have randomised evidence in advanced urothelial cancer. The pivotal 2000 trial used a 28-day schedule with cisplatin 70 mg/m² on one day; its results provide background but do not directly establish the benefit or safety of this split-dose 21-day schedule.',
  caveat='No response or survival percentage from the different pivotal schedule is presented as an estimate for this split-dose regimen. Treatment suitability remains an individual clinical decision.',
  doses=[('both1','Gemcitabine + cisplatin',1,1,'Both medicines and the cisplatin support plan.'),('both8','Gemcitabine + cisplatin',8,8,'Both medicines again after safety review.')],
  phases=[('day1','Day 1 · gemcitabine and cisplatin',['gemcitabine','cisplatin'],'high'),('day8','Day 8 · gemcitabine and cisplatin',['gemcitabine','cisplatin'],'high')]),
 '00628':dict(title='Adjuvant gemcitabine + cisplatin',context='Upper-tract urothelial cancer · after surgery',purpose='Reduce the risk of upper-tract urothelial cancer returning after surgery.',days=21,kind='cyclical',label='Days 1 and 8 · every 21 days · four cycles',agents=[GEM,CIS],anatomy=GEM_ANATOMY,
  schedule='Gemcitabine is given on days 1 and 8 and cisplatin on day 1. The 21-day cycle is planned four times after surgery for eligible upper-tract urothelial cancer. Treatment may be delayed or adjusted for safety.',
  administration='Gemcitabine runs into a vein over 30 minutes; cisplatin over 60 minutes with prescribed fluids. Review, preparation, blood tests and anti-sickness medicines add to the visit time.',
  baseline='Review the operation and pathology, recovery and fitness within 90 days of surgery, performance status and kidney function. Full blood count, kidney and liver tests are required; review hearing, nerves, medicines and fluid tolerance.',
  monitoring='Full blood count, kidney and liver tests on day 1; blood count and creatinine before day 8. Symptoms, hearing, nerves and hydration are reviewed before treatment.',
  support=SICKNESS+' '+HYDRATION+' Day 8 gemcitabine has a separate lower-risk anti-sickness plan.',prep='Confirm the four-cycle adjuvant plan and how kidney function after surgery affects treatment selection.',
  access='Suitable intravenous access is needed. This schedule does not routinely require a take-home infusion pump.',
  wider='This treatment follows surgery of the upper urinary tract. It aims to treat microscopic disease that scans cannot show. Ongoing urology and oncology surveillance remains necessary; your team sets the imaging and bladder-surveillance schedule.',
  scope='NCCP 00628 is an adjuvant upper-tract regimen for muscle-invasive and/or node-positive, non-metastatic predominantly transitional-cell disease. It is not the advanced-disease 28-day or split-dose GemCis regimen.',
  trial='POUT · final report 2024',trial_url='https://pubmed.ncbi.nlm.nih.gov/38350047/',
  evidence='POUT randomised 261 people after surgery for high-risk upper-tract urothelial cancer to four cycles of gemcitabine/platinum or surveillance. At five years, disease-free survival was 62% versus 45% (hazard ratio 0.55, 95% confidence interval 0.38–0.80).',
  caveat='Disease-free survival means being alive without a recorded recurrence; it is not the same as overall survival. The trial included cisplatin or carboplatin according to kidney function, so the whole-trial result is not a cisplatin-only estimate or permission for automatic substitution.',
  doses=[('both1','Gemcitabine + cisplatin',1,1,'Both medicines after safety review.'),('gem8','Gemcitabine',8,8,'Gemcitabine only; review counts before administration.')],
  phases=[('day1','Day 1 · gemcitabine and cisplatin',['gemcitabine','cisplatin'],'high'),('day8','Day 8 · gemcitabine',['gemcitabine'],'low')]),
 '00450':dict(title='Mitomycin + fluorouracil with radiotherapy',context='Bladder cancer · concurrent chemoradiation',purpose='Support radiotherapy in treating bladder cancer while aiming to preserve the bladder in selected patients.',days=28,kind='reference-course',label='Mitomycin day 1 · five-day pumps on days 1–5 and 22–26',agents=[MITO,FU],anatomy=MITO_ANATOMY,
  schedule='Mitomycin is given once on day 1. Fluorouracil runs continuously through a pump over 120 hours on days 1–5 and again on days 22–26, alongside the prescribed radiotherapy course. This is one chemoradiation course, not a repeating 28-day chemotherapy cycle.',
  administration='Mitomycin is given through a carefully checked intravenous line. Each fluorouracil pump provides 500 mg/m² per day for five days, a total of 2500 mg/m² over 120 hours. The unit arranges pump connection, disconnection and line care.',
  baseline='Full blood count, kidney and liver tests. Confirm dihydropyrimidine dehydrogenase (DPD) testing before first fluorouracil unless previously tested. Review the heart history, medicines, intravenous access and radiotherapy plan.',
  monitoring='Full blood count, kidney and liver tests weekly. Review mouth, bowel, skin, urinary and cardiac symptoms and the pump/line. Additional tests depend on symptoms or abnormal results.',
  support=SICKNESS+' Ask for a written mouth-care and diarrhoea plan, pump contacts and line-care instructions. Stomach protection and other local adjuncts should be reconciled with the actual prescription.',prep='Confirm the DPD result, pump training, connection/disconnection appointments and the radiotherapy department’s bladder-preparation instructions.',
  access='A suitable central line and ambulatory pump are usually used for the continuous fluorouracil infusions. Call the unit immediately about leaking, disconnection, alarms, redness, pain or swelling; never change the infusion rate yourself.',
  wider='Radiotherapy treats the bladder locally while chemotherapy makes cancer cells more sensitive to it. The radiation oncology team specifies dose, fractions and preparation. Follow-up bladder examinations are essential, and surgery may still be required if treatment does not control the cancer.',
  scope='NCCP 00450 is the bladder chemoradiation schedule with five-day fluorouracil infusions. Radiotherapy fractions and appointments are prescribed separately; the timeline is an educational reference.',
  trial='BC2001 · 2012 and ten-year follow-up',trial_url='https://pubmed.ncbi.nlm.nih.gov/22512481/',
  evidence='In BC2001, 360 people were randomised to bladder radiotherapy with or without fluorouracil and mitomycin. Two-year freedom from locoregional disease was 67% with chemoradiation versus 54% with radiotherapy alone (hazard ratio 0.68, 95% confidence interval 0.48–0.96).',
  caveat='This demonstrates improved local control compared with radiotherapy alone; it does not prove superiority to bladder-removal surgery. Overall survival was not significantly different in the primary report. Suitability for bladder preservation requires multidisciplinary assessment.',
  doses=[('mito','Mitomycin',1,1,'One dose only.'),('pump1','Fluorouracil pump 1',1,5,'Continuous 120-hour infusion.'),('pump2','Fluorouracil pump 2',22,26,'Second continuous 120-hour infusion.')],
  phases=[('day1','Day 1 · mitomycin plus fluorouracil',['mitomycin','fluorouracil'],'low'),('fluorouracil','Fluorouracil pump periods',['fluorouracil'],'low')]),
 '00759':dict(title='Weekly gemcitabine with radiotherapy',context='Bladder cancer · radiosensitising gemcitabine',purpose='Help radiotherapy treat bladder cancer as part of a selected bladder-preservation plan.',days=28,kind='reference-course',label='Gemcitabine days 1, 8, 15 and 22 · one course',agents=[GEM],anatomy=RT_ANATOMY,
  schedule='Gemcitabine 100 mg/m² is given weekly on days 1, 8, 15 and 22, two to four hours before radiotherapy. There are four planned gemcitabine doses in one course. This low-dose schedule is different from gemcitabine 1000 mg/m² chemotherapy.',
  administration='Gemcitabine is given through a vein over 30 minutes. The chemotherapy and radiotherapy teams coordinate the same-day appointments so radiotherapy follows two to four hours later.',
  baseline='Full blood count, kidney and liver tests; review fitness, current medicines and the radiotherapy plan.',
  monitoring='Full blood count weekly; kidney and liver tests at the end of the course as specified in the regimen, with extra testing if clinically required. Review bowel, urinary, skin, breathing and general symptoms during treatment.',
  support='Follow the prescribed low-risk anti-sickness plan and radiotherapy skin, bowel and bladder advice. Report diarrhoea, urinary symptoms or difficulty drinking early. Do not assume a lower chemotherapy dose removes the risk of serious effects.',
  prep='Confirm coordinated chemotherapy/radiotherapy appointments and the department’s bladder preparation. Ask for the written symptom and contact plan.',
  access='Suitable intravenous access is needed for the weekly infusion. This schedule does not routinely use a take-home pump.',
  wider='Radiotherapy is the local cancer treatment; gemcitabine helps sensitise cancer cells to it. Radiation dose, fractions and any interruptions are agreed by radiation oncology. Regular bladder surveillance is still needed; surgery may be considered for persistent or returning cancer.',
  scope='NCCP 00759 is four weekly 100 mg/m² gemcitabine doses with radiotherapy. Do not import a 1000 mg/m² gemcitabine dose, repeated chemotherapy cycles or another radiotherapy prescription.',
  trial='GemX · phase II study',trial_url='https://pubmed.ncbi.nlm.nih.gov/21205754/',
  evidence='GemX was a single-arm phase II study of 50 people with muscle-invasive bladder cancer. Forty-four patients, 88% of the study group, had a complete response at the bladder examination after treatment.',
  caveat='A complete endoscopic response is not proof of cure. This small study had no randomised comparison with surgery or other chemoradiation, so its result cannot establish which option is best for an individual.',
  doses=[('gem'+str(i),'Gemcitabine before radiotherapy',i,i,'Give gemcitabine two to four hours before radiotherapy.') for i in [1,8,15,22]],
  phases=[('weekly','Weekly gemcitabine with radiotherapy',['gemcitabine'],'low')]),
}
_spec=importlib.util.spec_from_file_location('gu58_group2',ROOT/'tools/gu-v08458-group2.py')
_group2=importlib.util.module_from_spec(_spec);_spec.loader.exec_module(_group2)
FACTS.update(_group2.facts(agent_from,CIS,HYDRATION,SICKNESS))

def build_profile(code,f):
    p=read(next(x['path'] for x in INDEX if '/'+code+'-' in x['path']))
    version=p['metadata']['nccp_version']; sources=[dict(id='nccp',title=f'NCCP {code} v{version} · official regimen',url=SOURCE[code]['catalogue_url']),dict(id='trial',title=f['trial'],url=f['trial_url']),dict(id='ncis',title='NCCP NCIS antiemetic guidance',url=NCIS)]
    d=dict(schema_version=1,review_status=STATUS,code=code,protocol_id=p['protocol_id'],protocol_version=version,source_checked=DATE,document_revision=DATE,title=f['title'],context_label=f['context'],indication_text=p['metadata']['indication'],purpose=f['purpose'],cycle_days=f['days'],cycle_display='reference-chronology',schedule_kind=f['kind'],schedule_label=f['label'],schedule_summary=f['schedule'],administration_text=f['administration'],monitoring_summary=f['monitoring'],service_kind='chemotherapy',sources=sources,longitudinal_mapping=True,timeline_source_ids=['nccp'],support_source_ids=['nccp','ncis'],urgent_source_ids=['nccp'],safety_note='Follow your own prescription and hospital instructions. This information supports a discussion; it does not authorise treatment.',urgent_extra=URGENT,anatomy_note='Selected medicine-specific effects, not a complete list. Effects can overlap and may occur on any day, including during a break.',phases_title='Your treatment schedule',phases_note=f['scope'],medicines_title='How the medicines work',timeline_note='Illustrative treatment days, not dated appointments or guaranteed safe days. Your team confirms any delay, dose change or radiotherapy interruption.',treatment_scope_notice=f['scope'],teachback=['Which medicines are given on each treatment day?','Which symptoms mean you should call immediately?','When are your next tests and review?'],consent_support='Discuss the intended benefit, alternatives, common and serious risks, lasting effects, fertility and individual priorities. Record the patient’s questions and the agreed plan. '+f['scope'],agents=copy.deepcopy(f['agents']),anatomy=copy.deepcopy(f['anatomy']))
    d['service_kind']=f.get('service_kind','chemotherapy')
    for a in d['agents']:a['source_ids']=['nccp']
    if code in ['00583','00846']:
        for product in (['keytruda','inlyta'] if code=='00583' else ['padcev']):
            d['sources'].append(dict(id=product,title=product.title()+' · EMA product information',url='https://www.ema.europa.eu/en/documents/product-information/'+product+'-epar-product-information_en.pdf'))
    for k in ['content_version','suite_release','patient_layout_release','clinical_review_release','clinical_audit_release','visual_release']:d[k]=VERSION
    d['phases']=[dict(id='treatment',label=f['label'],short=f['context'],cycles=['Individual prescribed course'],agents=[a['id'] for a in d['agents']],detail=f['schedule'])]
    d['timeline']=[dict(id=i,label=label,start=start,end=end,style='treatment',text=text) for i,label,start,end,text in f['doses']]+[dict(id='monitor',label='Checks and symptom reporting',start=1,end=f['days'],style='monitoring',text=f['monitoring'])]
    d['day_groups']=[]
    for day in range(1,f['days']+1):
        active=[(label,text) for i,label,start,end,text in f['doses'] if start<=day<=end]
        title=' + '.join(label for label,text in active) if active else 'Between scheduled chemotherapy doses'
        body=' '.join(text for label,text in active) if active else 'Continue your prescribed support and monitoring plan. Radiotherapy, if part of your treatment, follows its separately confirmed appointments. Side effects can occur on any day.'
        if d['day_groups'] and d['day_groups'][-1]['title']==title and d['day_groups'][-1]['body']==body:d['day_groups'][-1]['end']=day
        else:d['day_groups'].append(dict(start=day,end=day,title=title,body=body,action='Follow your confirmed appointment and support plan.'))
    d['chronology_notes']=[dict(title='Schedule scope',text=f['scope']),dict(title='Symptoms',text='Symptoms can occur on any day. An unshaded day is not a guarantee that treatment effects have passed.')]
    d['passport_visit_note']='Bring this record to every treatment and review; your team confirms the dose and next appointment.'
    d['passport_groups']=[dict(title=f['label'],agents=[a['id'] for a in d['agents']])]
    d['monitoring_schedule']=dict(title='Tests and care through treatment',columns=['Before starting','During treatment','Between visits','After treatment'],rows=[dict(label='Safety tests and symptoms',cells=[f['baseline'],f['monitoring'],'Extra tests may be needed for symptoms, infection or abnormal results.','Follow abnormal results and ongoing symptoms until a plan is agreed.']),dict(label='Medicines and practical care',cells=[f['prep'],f['administration'],f['support'],'Review lasting effects, support needs and any line/pump removal.']),dict(label='Cancer treatment and follow-up',cells=[f['context'],f['wider'],RESPONSE,'Agree oncology/urology follow-up and the next treatment or surveillance plan.'])],note='Safety testing and cancer-response assessment have different purposes. Your plan may change after illness or a dose adjustment.',source_ids=['nccp'])
    d['monitoring_test_details']=[dict(label='Full blood count',purpose='Check infection-fighting cells, haemoglobin and platelets.',timing=f['monitoring'],kind='blood',scope='routine',source_ids=['nccp']),dict(label='Kidney and liver tests',purpose='Check safe drug handling and detect organ effects.',timing=f['baseline']+' '+f['monitoring'],kind='blood',scope='routine',source_ids=['nccp']),dict(label='Cancer response and follow-up',purpose='Assess cancer control separately from safety blood tests.',timing=RESPONSE,kind='scan',scope='conditional',source_ids=['nccp'])]
    if code=='00450':d['monitoring_test_details'].append(dict(label='DPD testing',purpose='Identify increased risk of severe fluorouracil toxicity; a normal result does not exclude all serious toxicity.',timing='Before first fluorouracil unless already tested; the team interprets the result and any renal impairment.',kind='blood',scope='routine',source_ids=['nccp']))
    if any(a['id']=='cisplatin' for a in d['agents']):d['monitoring_test_details'].append(dict(label='Magnesium, hearing and nerves',purpose='Detect cisplatin electrolyte, hearing and nerve effects.',timing='Review before cisplatin; additional blood tests and audiology follow the prescribed plan and symptoms.',kind='blood',scope='conditional',source_ids=['nccp']))
    d['support']=[dict(title=title,text=text,source_ids=['nccp']) for title,text in [('Preparation and support medicines',f['prep']+' '+f['support']),('Access and practical care',f['access']),('Fertility and pregnancy precautions',FERTILITY),('Your wider treatment plan',f['wider'])]]
    d['logistics']=dict(sections=[dict(title=title,text=text,source_ids=['nccp']) for title,text in [('Before the visit',f['prep']),('Time in the unit',f['administration']),('Access and pump care',f['access']),('Home support',f['support']),('Next appointment','Confirm the next treatment, tests and any scan before leaving.')]])
    d['chapters']=[dict(id=id,title=title,intro=intro,items=[dict(title=t,text=text,source_ids=['nccp'])for t,text in items]) for id,title,intro,items in [
        ('treatment','Your treatment',f['purpose'],[('The schedule',f['schedule']),('How it is given',f['administration']),('Other treatment and follow-up',f['wider'])]),
        ('checks','Tests and reviews','Checks help the team decide whether treatment is safe.',[('Before starting',f['baseline']),('During treatment',f['monitoring']),('Cancer response',RESPONSE)]),
        ('support','Support and daily life','Follow the written plan agreed with your team.',[('Support medicines',f['support']),('Line or pump care',f['access']),('Fertility and pregnancy',FERTILITY)]),
        ('urgent','Symptoms and help','Report new or worsening symptoms promptly.',[('Call now',URGENT),('During a drip','Tell the nurse immediately about flushing, rash, chills, breathlessness, faintness or pain/swelling at the infusion site.'),('Your contacts','Keep verified daytime and out-of-hours oncology numbers with your treatment card. The QR website is information, not an emergency service.')])]]
    d['evidence']=dict(title=f['trial'],summary=f['evidence'],intro=f['evidence'],metrics=[],caveat=f['caveat'],interpretation=f['caveat'],source_ids=['trial','nccp'])
    d['questions']=[dict(q=q,a=a)for q,a in [('What is the treatment trying to do?',f['purpose']+' '+f['wider']),('When do I attend?',f['schedule']),('Does a delay mean treatment has failed?','No. Blood counts, organ function and symptoms can make a delay or dose change safer. Your team decides whether and when to give the next dose.'),('Who do I contact if unwell?','Use your verified oncology daytime or out-of-hours number. If you cannot reach the team, seek urgent medical assessment. Severe symptoms require 112/999.')]]
    if code=='00450':
        d['port_pump']=True
        d['pump_steps']=[['Before treatment','Choose and prepare intravenous access','The team explains whether a port or PICC suits the continuous infusion and arranges insertion if needed.'],['Before connection','Training and contact plan','Confirm line care, spill instructions and daytime/out-of-hours numbers.'],['Days 1 and 22','Two separate pump connections','Trained staff connect a prescribed 120-hour fluorouracil infusion on each scheduled start day.'],['Days 1–5 and 22–26','Continuous infusion at home','Each pump runs for 120 hours. Carry it as shown; never change the settings yourself.'],['After each 120-hour infusion','Professional disconnection','The team confirms the exact disconnection time from the actual connection time. Keep the appointment even if the pump appears empty.'],['After the course','Line-care and removal plan','Pump disconnection does not remove a port or PICC. Agree ongoing line care and any separate removal appointment.']]
    d['patient_summary']=dict(template_version=VERSION,summary_checked=DATE,purpose=f['purpose'],schedule=f['label'],phases=[dict(title='Treatment',text=f['schedule'])],monitoring=[dict(stage='Before',test='Baseline checks',when=f['baseline'],basis='NCCP source'),dict(stage='During',test='Safety monitoring',when=f['monitoring'],basis='NCCP source'),dict(stage='Response',test='Cancer review',when='Individual oncology/urology plan.',basis='Individual plan')],cycle_expectations=['Side effects may occur on any day, including during a break. Report problems promptly.',f['support']],preparation=[f['prep']],card_title=f['title'],card_schedule=f['label'],card_cycle_count=None,card_record_unit='review' if f['kind']=='reference-course' else 'cycle',card_record_note='Recording spaces do not define the planned course.',card_alert='Call promptly if suddenly unwell. Carry your verified treatment/contact plan.',cycle_heading='Your treatment reference view',cycle_blocks=[dict(label='Treatment days',text=f['label']),dict(label='Between visits',text='Follow your symptom, support and monitoring plan.'),dict(label='Next review',text='Your team confirms tests, doses and continuation.')])
    save('data/patient-knowledge/'+code+'.json',d)
    return d,p


def support(code,f,d,p,w,phases):
    selector=dict(protocol_id=p['protocol_id'],source_version=d['protocol_version'],source_url=d['sources'][0]['url'],source_checked=DATE,source_pages=list(range(1,SOURCE[code]['pages']+1)),phases=[])
    rows=[]
    for id,label,agents,risk in f['phases']:
        plan=copy.deepcopy(w['antiemetic_plans']['high_standard' if risk=='high' else risk])
        plan.update(label=label,source_checked=DATE,source_url=d['sources'][0]['url'])
        plan['warnings']=list(dict.fromkeys(plan.get('warnings',[])+[f['support'],'Retain and reconcile local prescribed adjuncts, including stomach protection where prescribed. This template does not issue a patient prescription.']))
        pid='gu58_'+code+'_'+id;w['antiemetic_plans'][pid]=plan
        selector['phases'].append(dict(id=id,label=label,active_medicines=agents,plan_id=pid,notes=[f['schedule'],f['monitoring']]))
        base=copy.deepcopy(phases['regimens']['00281'][0 if risk=='high' else 1])
        base.update(id=id,label=label,active_medicines=agents,active_drugs=agents,emetogenic_risk=risk,source_checked=DATE,source_url=d['sources'][0]['url'],source_page='Supportive care; NCCP NCIS antiemetic guidance',additional_support=[f['support'],f['access'],'Reconcile all prescribed adjuncts including any local stomach-protection medicine. Follow one prescription; do not duplicate steroid or antiemetic courses.'])
        # The workflow and printable support sheet use the same NCCP/NCIS
        # records. A previous gemcitabine sheet used dexamethasone as its low-
        # risk default while the current NCIS/workflow row uses ondansetron.
        base['medicines']=[dict(name=m['medicine'],dose=' '.join([m['dose'],m['route'],m['frequency']]),timing=m['timing'],note='Support-course day 1 means the selected treatment visit. Reconcile repeated courses and all other medicines before prescribing.') for section in ['day1','subsequent'] for m in plan[section]]
        base['additional_support']+=plan['warnings']
        if plan.get('local_prescription_source_id'):
            base['local_reference']=dict(label=w['sources'][plan['local_prescription_source_id']]['label'],note=plan['local_adjunct_note']+' This historical supplied proforma requires current local pharmacy confirmation. It is an alternative/local reference, not an additional set of medicines to combine automatically with the national plan.',items=copy.deepcopy(plan['local_prescription_items']))
        else:base.pop('local_reference',None)
        if code in ['00333','00337','00338']:
            warning='Pharmacy must reconcile aprepitant with vinblastine and any proton-pump inhibitor with methotrexate. Historical local adjuncts are not automatic orders; avoid duplicate or interacting support prescriptions.'
            plan['warnings'].append(warning);base['additional_support'].append(warning)
        if code=='00450':
            base['additional_support'].append('Continuous five-day fluorouracil: NCIS multi-day guidance requires an individually agreed schedule appropriate to each treatment day and two days afterwards. The single-visit reference row does not by itself prescribe the complete pump-period course.')
            plan['warnings'].append(base['additional_support'][-1])
        rows.append(base)
    w['supportive_phase_selectors'][code]=selector;phases['regimens'][code]=rows
    p['supportive_care'].update(premedication=[f['prep']],other_support=[f['support']],source_url=d['sources'][0]['url'],phase_specific_plan='patient/'+code+'/supportive-care.html')
    save(next(x['path'] for x in INDEX if '/'+code+'-' in x['path']),p)

def knowledge(code,f,d,p):
    refs=[dict(label=s['title'],url=s['url'])for s in d['sources']]
    risks=[r for a in d['agents']for r in a['risks']]
    mechanism=' '.join(a['explanation']for a in d['agents'])
    return dict(protocol_id=p['protocol_id'],regimen_role=f['context'],clinical_summary=f['purpose'],treatment_setting=p['metadata']['indication'],component_rationale=mechanism,schedule_context=f['schedule'],key_points=[f['scope'],f['schedule'],f['monitoring'],f['support']],review_status=STATUS,source_checked_date=DATE,full_suite_release=VERSION,reference_links=refs,
        treatment_rationale=dict(summary=mechanism+' '+f['wider'],setting=f['context'],line=p['metadata']['indication'],factors=['Treatment intent, pathology/stage, prior treatment, performance status, organ function, hearing/neuropathy where relevant and patient preferences'],alternatives=['Discuss current setting-specific systemic options, surgery or chemoradiation where applicable, surveillance and supportive care.'],limitations=[f['caveat']],sources=refs),
        patient_selection=dict(treatment_intent=f['purpose'],disease_and_biomarker_context=[p['metadata']['indication']],eligibility_orientation=p['eligibility'],exclusion_orientation=['Review current NCCP exclusions, pregnancy, hypersensitivity, organ function and source-specific baseline criteria.'],important_cautions=p['metadata']['source_boundary_notes']+[f['scope']]),
        supportive_care=dict(emetogenic_risk='high' if any(z[3]=='high'for z in f['phases'])else f['phases'][0][3],premedication_and_prophylaxis=[f['prep'],f['support']],counselling=[f['access'],FERTILITY],sources=refs),
        monitoring_and_toxicity=dict(baseline=[f['baseline']],before_each_cycle=[f['monitoring']],longitudinal_schedule=d['monitoring_schedule'],priority_toxicities=risks,disease_monitoring=RESPONSE),
        administration=dict(cycle_and_sequence=f['schedule'],route_and_duration=[f['administration']],practical_workflow=[f['access'],f['prep']]),
        evidence_at_a_glance=dict(trial=f['trial'],population=f['context'],comparison=f['trial'],applicability=f['context'],endpoints=[],qualitative_result=f['evidence'],limitations=[f['caveat']],sources=[r for r in refs if r['url']==f['trial_url']]),
        patient_resources=[dict(label=label,url='patient/'+code+'/'+file)for label,file in [('Patient treatment reference','knowledge.html'),('Consent discussion','consent-form.html'),('Monitoring and treatment','treatment-journey.html'),('Support medicines','supportive-care.html'),('Three-page guide','guide.pdf')]])

def main():
    w=read('data/regimen-workflow-v0750.json');phases=read('data/phase-support-v0838.json');journey=read('data/breast-treatment-journeys-v0837.json');presentation=read('data/patient-presentation-v08431.json');kb=[]
    for code,f in FACTS.items():
        d,p=build_profile(code,f);support(code,f,d,p,w,phases);kb.append(knowledge(code,f,d,p));presentation['routes'][code]='data/patient-knowledge/'+code+'.json'
        j=dict(code=code,title=f['title']+': treatment and checks',release=VERSION,checked=DATE,status=STATUS,schedule_type='relative-educational',has_patient_dates=False,setting=f['context'],summary=f['schedule'],stages=d['monitoring_schedule']['columns'],lanes=[dict(**row,kind='monitoring',source_ids=['nccp'],note=d['monitoring_schedule']['note'])for row in d['monitoring_schedule']['rows']],milestones=[dict(title='Treatment review',when=f['label'],why=f['purpose'],clinical=f['schedule'],action=URGENT,source_ids=['nccp'])],sources=d['sources'])
        journey[code]=j
        if code not in journey.get('codes',[]):journey.setdefault('codes',[]).append(code)
    for file,obj in [('data/regimen-workflow-v0750.json',w),('data/phase-support-v0838.json',phases),('data/breast-treatment-journeys-v0837.json',journey),('data/patient-presentation-v08431.json',presentation)]:save(file,obj)
    save('data/regimen-knowledge-base-v08458-addendum.json',dict(schema_version='1.0',release=VERSION,regimen_profiles=kb))
    save('validation/gu-v08458/clinical/authored-patient-facts.json',FACTS)

if __name__=='__main__':main()
