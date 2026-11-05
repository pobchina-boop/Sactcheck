"""Authored patient profiles: source-specific oral colorectal pathways, v0.84.34."""
import copy,json
from pathlib import Path
R=Path(__file__).resolve().parents[3]
D=R/'data/patient-knowledge'
old=json.loads((D/'00382.json').read_text())

def item(title,text,ids=('nccp','smpc')):return {'title':title,'text':text,'source_ids':list(ids)}
def chapter(id,title,intro,items):return {'id':id,'title':title,'intro':intro,'items':items}
def row(label,*cells):return {'label':label,'cells':list(cells)}
def q(q,a):return {'q':q,'a':a}
common_q=copy.deepcopy(old['questions'][:6])
reg={
 'schema_version':1,'content_version':'0.84.34','suite_release':'0.84.34','patient_layout_release':'0.84.34',
 'review_status':'Source reconciled; independent clinical, pharmacy and patient/PPI review pending',
 'source_checked':'2026-11-05','document_revision':'2026-11-05',
 'protocol_id':'nccp-00244-v5','code':'00244','protocol_version':'5',
 'title':'Regorafenib (Stivarga) monotherapy','cycle_days':28,
 'context_label':'Previously treated metastatic colorectal cancer',
 'purpose':'Regorafenib is a targeted tablet treatment for colorectal cancer that has spread, after previous treatments or when those treatments are unsuitable. The aim is to control the cancer. Your team discusses the likely benefit, side effects, alternatives and your priorities.',
 'schedule_summary':'Take the prescribed dose once daily on Days 1–21, then take no regorafenib on Days 22–28. Each cycle lasts 28 days. Take tablets at the same time after a light, low-fat meal. Start another cycle only when the team authorises it.',
 'scope_heading':'Treatment scope · NCCP 00244a',
 'scope_note':'This guide covers regorafenib for previously treated metastatic colorectal cancer. Regorafenib is also used in other cancers, but their eligibility and evidence are different. Confirm the treatment setting on your prescription.',
 'service_kind':'targeted','therapy_label':'Oral targeted therapy','schedule_kind':'cyclic_oral_21_on_7_off','schedule_label':'Three tablet weeks, then one tablet-free week',
 'indication_text':'NCCP 00244a covers metastatic colorectal cancer previously treated with, or unsuitable for, available therapies including fluoropyrimidine chemotherapy, anti-VEGF treatment and anti-EGFR treatment. The GIST indication in NCCP 00244b and the separate liver-cancer licence are not this colorectal pathway.',
 'phases_title':'A 28-day tablet cycle',
 'phases_note':'There is no fixed total number of cycles. Treatment continues while benefit and tolerability justify it. Your team reviews symptoms, blood tests, scans and your preferences; it may pause, reduce or stop the medicine.',
 'medicines_title':'Your targeted medicine and what it does',
 'timeline_note':'The bars show the prescribed tablet and rest days. They do not predict when side effects will happen or establish safe days.',
 'safety_note':'Use your oncology unit’s urgent contact plan throughout the cycle, including tablet-free days. Symptoms can need attention before the next blood test or appointment.',
 'teachback':'Can you show the 21 tablet days and seven rest days, explain the meal and missed-dose instructions, identify the early liver and blood-pressure checks, and say whom you will call if unwell?',
 'consent_support':'Discuss the colorectal disease-control aim, likely benefit and uncertainty, alternatives including supportive care without regorafenib, early hand-foot skin reaction, blood-pressure and liver monitoring, fatigue, diarrhoea and appetite loss, serious bleeding/infection/heart/bowel risks, wound healing, interactions, pregnancy prevention and the option to reconsider. Agree who authorises changes and restarts.',
 'urgent_extra':'Call oncology immediately for fever, shivering, sudden illness, yellow eyes or skin, dark urine, severe or persistent abdominal pain, black or bloody stools, new bleeding, severe diarrhoea or inability to drink. Severe chest pain, major breathing difficulty, heavy bleeding, collapse, seizures, or a severe headache with confusion or visual change need emergency help: 112 / 999.',
 'timeline_source_ids':['nccp'],'support_source_ids':['nccp','smpc'],'urgent_source_ids':['smpc'],
 'sources':[
  {'id':'nccp','title':'NCCP 00244 v5 · Regorafenib Monotherapy · revised 25 March 2025','url':'https://healthservice.hse.ie/documents/6347/244_v5_Regorafenib_Monotherapy.pdf'},
  {'id':'smpc','title':'EMA Stivarga · current product information and patient leaflet · checked 5 November 2026','url':'https://www.ema.europa.eu/en/documents/product-information/stivarga-epar-product-information_en.pdf'},
  {'id':'correct','title':'Grothey et al. CORRECT · colorectal regorafenib monotherapy · Lancet 2013','url':'https://pubmed.ncbi.nlm.nih.gov/23177514/'}
 ],
 'agents':[{
  'id':'regorafenib','name':'Regorafenib','alias':'Stivarga','type':'Oral multikinase inhibitor',
  'mechanism':'Blocks several signals involved in tumour growth and blood-vessel formation',
  'explanation':'Regorafenib blocks several protein switches called kinases. These help cancer cells grow and help blood vessels support a tumour. The medicine also affects normal tissues, so skin, liver, blood pressure and other symptoms need close review.',
  'visual':['Growth and blood-vessel signals','Regorafenib blocks several kinases','Tumour-supporting signals are reduced'],
  'watch':'Report sore hands or feet early. Attend liver and blood-pressure checks even if you feel well, and get urgent help for serious new symptoms.',
  'risks':['Hand-foot skin reaction: painful, red, swollen or blistered hands and feet','Fatigue, reduced appetite, weight loss and mouth soreness','Diarrhoea, nausea, vomiting and dehydration','Raised blood pressure and changes in thyroid function','Liver injury, sometimes severe','Infection, anaemia, low platelets and bleeding','Uncommon but serious heart, bowel, neurological or blood-vessel problems','Impaired wound healing and harm to an unborn baby'],
  'symptoms':['Hand-foot skin reaction','Diarrhoea','Fatigue','Mouth soreness / ulcers','Bleeding / bruising','Nausea'],
  'source_ids':['nccp','smpc']
 }],
 'cycle_display':'reference-chronology','port_pump':False,'longitudinal_mapping':True,
 'passport_visit_note':'The passport provides reusable recording pages. It does not prescribe a fixed course length or authorise a dose or restart.',
 'anatomy':[
  ['brain','Head / energy','Regorafenib','Fatigue can affect daily life. Severe headache with confusion, visual change or a seizure needs emergency help.',50,6],
  ['mouth','Mouth / appetite','Regorafenib','Soreness, ulcers, taste changes or poor appetite can affect eating. Report difficulty drinking or weight loss.',50,12],
  ['heart','Heart / blood pressure','Regorafenib','Blood pressure can rise without symptoms. Attend checks; chest pain, fainting or severe breathlessness needs emergency help.',52.5,28.3],
  ['blood','Blood / infection','Regorafenib','Bleeding, bruising or infection can occur. Fever or sudden illness needs urgent advice; heavy bleeding needs emergency help.',38,24],
  ['liver','Liver','Regorafenib','Liver injury may first appear in blood tests. Yellow skin or eyes, dark urine or confusion needs immediate advice.',44,34],
  ['bowel','Bowel / abdomen','Regorafenib','Diarrhoea can cause dehydration. Severe or persistent pain, black stools or blood in stools needs urgent help.',50,44.5],
  ['skin','Hands / feet / skin','Regorafenib','Pain, redness, blisters or thickened skin can limit walking or hand use. Report early and follow your skin-care plan.',23,56],
  ['kidneys','Kidneys / fluids','Regorafenib','Vomiting or diarrhoea can reduce fluid intake and urine. Very little urine or inability to drink needs urgent advice.',39.5,38.6]
 ],
 'anatomy_note':'The numbered body map links selected treatment effects to their symptoms. It does not show every possible effect or predict severity; blood and skin markers are schematic.'
}
reg['administration_text']='Swallow the prescribed tablets whole with water at the same time each day after a light meal containing less than 30% fat. Ask the pharmacist for a practical meal example. Follow your own tablet label and calendar; do not change the dose yourself. Avoid grapefruit juice.'
reg['phases']=[{'id':'treatment','label':'21 tablet days, then seven rest days','short':'28-day cycle','cycles':['D1–21','D22–28'],'agents':['regorafenib'],'detail':reg['schedule_summary']}]
reg['timeline']=[
 {'id':'tablets','label':'Regorafenib tablets','start':1,'end':21,'style':'treatment','text':'Once daily after a light, low-fat meal'},
 {'id':'rest','label':'Tablet-free week','start':22,'end':28,'style':'monitor','text':'No regorafenib; review recovery and the next prescription'},
 {'id':'watch','label':'Symptoms and scheduled tests','start':1,'end':28,'style':'watch','text':'Report illness on treatment days and rest days'}]
reg['day_groups']=[
 {'start':1,'end':7,'title':'Start with a clear calendar','body':'Take the prescribed once-daily tablets after a light, low-fat meal. Early blood-pressure checks and a hand/foot care plan are important.','action':'Confirm the first blood-pressure and liver-test appointments before leaving.'},
 {'start':8,'end':21,'title':'Continue tablets and early monitoring','body':'Keep taking the prescribed dose unless the team changes it. Symptoms may build over time; hands, feet, appetite, bowel symptoms and energy need review.','action':'Report new problems early; do not wait for the end of the tablet block.'},
 {'start':22,'end':28,'title':'Tablet-free week','body':'Take no regorafenib. Side effects and abnormal tests can persist during the break. The next cycle may need a delay or a different dose.','action':'Complete arranged tests and confirm the next prescription and start date with the team.'}]
reg['support']=[
 item('Hands and feet','Inspect your hands and feet regularly and tell the team about pain, redness, swelling or blisters early. Ask for the unit’s skin-care plan; it may include moisturising creams and protection or cushioning for hands and feet. Do not wait until walking or everyday hand use becomes difficult.'),
 item('Sickness and bowel support','Regorafenib has minimal-to-low oral sickness risk; routine premedication is not usually required. Agree any anti-sickness and diarrhoea medicines with the team. Repeated vomiting, diarrhoea, poor intake or reduced urine needs prompt advice, even if you already have supportive medicines.'),
 item('Mouth care, food and energy','Report mouth soreness, poor appetite, weight loss or fatigue affecting your usual activities. Ask about mouth care, nutritional help and a manageable activity/rest plan. Take the tablets after a light, low-fat meal and drink as advised for your health.'),
 item('Blood pressure and liver checks','Attend tests even when you feel well. Liver tests are every two weeks for the first two months, then monthly or as clinically indicated. Blood pressure is checked weekly for six weeks, then before each cycle or as indicated. Confirm who reviews each result.',('nccp',)),
 item('Medicines and procedures','The pharmacist needs a complete medicines and supplements list. Avoid grapefruit juice. Report planned surgery, dental procedures and wounds because treatment can affect healing. Tell the team if you take warfarin; closer INR checks are needed.'),
 item('Pregnancy, fertility and feeding','Discuss fertility before treatment. Women who could become pregnant and men should use effective contraception during treatment and for at least eight weeks afterwards. Do not breastfeed during treatment. Contact the team promptly if pregnancy is possible.',('smpc',))]
reg['monitoring_schedule']={
 'title':'Checks before, during and after treatment',
 'columns':['Before starting','First six weeks','Up to two months','Later cycles','After / stopping'],
 'rows':[
 row('Liver blood tests','Baseline liver profile','Every two weeks','Every two weeks','Monthly or as clinically indicated','Follow any abnormal results until reviewed / resolved'),
 row('Blood pressure','Baseline; control existing hypertension','Weekly','Before each cycle after week six; extra if needed','Before each cycle or as indicated','Follow the team’s plan; do not stop BP tablets yourself'),
 row('Blood count and kidneys','Baseline FBC and renal profile','Regular tests as arranged','Continue scheduled monitoring','Regular tests as arranged','Review residual blood-count, fluid or kidney problems'),
 row('Thyroid and additional tests','Thyroid function; ECG/QT if at risk; pancreatic enzymes if indicated','Thyroid / pancreas tests if indicated; ECG / heart-rate review if needed','If on warfarin: close INR checks','Further tests according to symptoms and medicines','Follow abnormalities and symptoms individually'),
 row('Symptoms and cancer response','Agree aim, baseline symptoms and review plan','Review hands/feet, mouth, bowel, appetite, energy and wounds','Review tolerability and any interruptions','Scans / markers according to the individual cancer plan','Agree follow-up, next treatment or supportive care')
 ],
 'note':'Some tests are required for everyone; ECG/QT, pancreatic enzymes, INR and extra checks depend on risk, symptoms or other medicines. There is no single mandatory imaging or tumour-marker interval for all patients.',
 'source_ids':['nccp','smpc']}
reg['monitoring_summary']='Baseline blood count, kidney/liver profile, thyroid function and blood pressure. ECG/QT if at risk and pancreatic enzymes if indicated. During treatment: regular blood count and renal profile; liver profile every two weeks for two months, then monthly or as indicated; BP weekly for six weeks, then before each cycle or as indicated. Thyroid, pancreas and cardiac checks as indicated; close INR monitoring with warfarin. Scans and markers follow the Consultant’s individual plan.'
reg['chronology_notes']=[
 item('Before the first tablet','Confirm consent, baseline tests, pharmacy teaching, the light-meal routine, skin care and working urgent contact numbers.'),
 item('Early weeks have extra checks','The early liver and blood-pressure schedule continues across tablet-free days. A calendar stamp or a tablet supply does not establish that treatment is safe to restart.',('nccp',)),
 item('Longer-term review','There is no fixed final cycle. Review benefit and side effects with the team and agree what follows if treatment stops.',('nccp',))]
miss='If you miss a dose, take it as soon as you remember on the same day. Do not take two doses in one day or make up the dose the next day. If you vomit after taking regorafenib, do not take extra tablets; tell the team. If unsure, contact the pharmacist or oncology team.'
reg['logistics']={'sections':[
 item('Prescription and tablet calendar','Confirm the exact daily tablet number, Days 1–21 and Days 22–28, blood-test appointments and who authorises the next cycle. A clinician may prescribe a lower starting dose or change it after side effects; follow the issued prescription.'),
 item('Taking tablets with food',reg['administration_text']),
 item('Missed or vomited doses',miss),
 item('Storage and handling','Keep tablets in their original bottle, tightly closed, away from children and protected from moisture. Record when the bottle is first opened; the leaflet says to discard remaining tablets seven weeks after opening. Ask the pharmacist about safe disposal and help if you cannot swallow whole tablets.',('smpc',)),
 item('Accidental extra tablets','Seek medical advice straight away if you take more than prescribed. Take the pack and current calendar with you.',('smpc',)),
 item('Visits and practical support','This is tablet treatment without an infusion or take-home pump, but it still needs regular visits and tests. Ask who arranges appointments and results, and tell the team about travel, work or caring needs before changing the schedule.')
 ]}
reg['evidence']={
 'title':'Evidence for previously treated colorectal cancer',
 'intro':'CORRECT compared regorafenib plus best supportive care with placebo plus best supportive care in 760 people with metastatic colorectal cancer after standard treatments.',
 'population':'Previously treated metastatic colorectal cancer; trial participants had ECOG performance status 0–1.',
 'combination_label':'Regorafenib + best supportive care','comparison_label':'Placebo + best supportive care','metrics':[],
 'interpretation':'Median overall survival was 6.4 months with regorafenib and 5.0 months with placebo in the trial. These are group medians, not a prediction of your lifespan or a guaranteed extra 1.4 months. Side effects were more frequent with regorafenib. The team should relate the evidence to your health, previous treatment and priorities.',
 'limitations':'CORRECT does not establish the same benefit in a different treatment line or tumour type. GRID studied GIST and RESORCE studied liver cancer; their results are not colorectal monotherapy estimates.',
 'source_ids':['correct','smpc']}
reg['chapters']=[
 chapter('treatment-purpose','What this treatment is for','Confirm the diagnosis, treatment setting and individual goal.',[
  item('Colorectal disease control',reg['purpose'],('nccp',)),item('Evidence and uncertainty',reg['evidence']['interpretation'],('correct',)),item('How long it continues',reg['phases_note'],('nccp',))]),
 chapter('taking-tablets','Your tablet and rest-day plan','Use the written prescription and calendar.',[
  item('21 days on, seven days off',reg['schedule_summary'],('nccp',)),item('A light meal and the same daily time',reg['administration_text']),item('Missed or vomited doses',miss),item('Extra tablets or swallowing difficulty','If you accidentally take too much, get medical advice straight away. Ask the pharmacist for help before altering or crushing a tablet.',('smpc',))]),
 chapter('testing','Your tests and who follows them','Feeling well does not replace the early monitoring schedule.',[
  item('Before treatment','Blood count, kidney/liver tests, thyroid function and blood pressure are checked. ECG/QT is used for patients at risk; pancreatic enzymes are measured when clinically indicated.',('nccp',)),
  item('During treatment',reg['monitoring_summary'],('nccp',)),
  item('After a pause or after stopping','The team decides when to repeat abnormal tests and how to follow persistent side effects. Ask for the next review date and who remains your contact. Do not restart after a treatment hold without explicit instructions.'),
  item('Scans and tumour markers','Your Consultant sets disease-assessment tests and timing for your situation. This regimen does not impose one fixed scan or tumour-marker timetable.',('nccp',))]),
 chapter('skin-and-daily-life','Skin, eating and daily activities','Early reporting can help prevent symptoms from becoming harder to manage.',[
  reg['support'][0],reg['support'][1],reg['support'][2],
  item('Thyroid, voice and other changes','Tell the team about worsening tiredness, feeling unusually cold, a hoarse voice, numbness or tingling, cramps or other persistent changes. The medicine can affect thyroid function, nerves and blood salts; symptoms may need tests or supportive treatment.',('smpc',)),
  item('Driving and work','Do not drive or use machinery if symptoms affect concentration or reaction time. Discuss fatigue, painful hands/feet and your work or caring responsibilities with the team.',('smpc',))]),
 chapter('serious-symptoms','Symptoms needing urgent help','Frequency and urgency are different: a rare effect can still need immediate care.',[
  item('Liver warning signs','Yellow skin or eyes, dark urine, or new confusion needs urgent medical advice. Liver injury can also start without obvious symptoms, which is why scheduled blood tests matter.'),
  item('Bleeding, bowel problems and dehydration','Get urgent help for black or bloody stools, vomiting or coughing blood, severe or persistent abdominal pain, significant new bleeding, repeated vomiting or diarrhoea, or very little urine. Heavy bleeding or collapse needs 112 / 999.',('smpc',)),
  item('Heart and neurological symptoms','Call 112 / 999 for chest pain with breathlessness or fainting, severe breathing difficulty, seizures, or a severe headache with confusion or visual changes. Do not wait for a routine blood-pressure appointment.',('smpc',)),
  item('Infection','Fever, shivering or suddenly feeling unwell needs immediate oncology advice. New painful urination, a severe cough, shortness of breath, a sore throat or a red painful area can also signal infection.',('smpc',)),
  item('Wounds, vessels and severe skin reactions','Tell the team about an unhealed wound or planned procedure. Seek urgent help for a widespread painful or blistering rash. New severe pain, swelling, neurological symptoms or sudden deterioration may need emergency assessment; the medicine can rarely affect blood-vessel walls or small blood vessels.',('smpc',))]),
 chapter('medicines-and-procedures','Other medicines and procedures','A complete medicines list helps the pharmacist check interactions.',[
  reg['support'][4],
  item('Include non-prescription products','Tell the pharmacist about antibiotics, antifungals, epilepsy medicines, anticoagulants, pain medicines, supplements and herbal remedies, particularly St John’s wort. Ask before starting or stopping anything. Avoid grapefruit juice.',('smpc',)),
  item('Allergies and ingredients','Tell the team about medicine allergies, including reactions to similar medicines. Stivarga contains sodium and soya-derived lecithin; ask the pharmacist if these affect your care.',('smpc',))]),
 chapter('pregnancy-and-storage','Pregnancy prevention, storage and handling','Agree personal precautions before the first dose.',[
  reg['support'][5],reg['logistics']['sections'][3]]),
 chapter('decisions-and-support','Your choices and practical support','You can ask for clarification and reconsider treatment.',[
  item('Consent and alternatives',reg['consent_support']),
  item('Keep an urgent contact plan','Carry the treatment card and your current medicine list. Record the actual daytime and out-of-hours oncology numbers. Show the card when seeing another clinician and explain when you last took regorafenib.'),
  item('A printable record','Use the passport to record prescribed changes, symptoms, tests and questions. It supports the conversation; it does not authorise tablets or replace the prescription.')])]
reg['questions']=common_q+[
 q('What if I miss a dose or vomit?',miss),
 q('Does “targeted” mean there are no serious side effects?','No. The medicine blocks cancer-related signals but can also affect healthy tissues. Liver tests, blood-pressure checks and prompt symptom reporting are essential.'),
 q('Can I use a diary stamp to decide to restart?','No. A stamp records a visit or completed cycle. Your team must confirm the dose and start date, especially after an interruption or abnormal test.'),
 q('Why are checks so frequent at the beginning?','Blood pressure and liver tests can change before you notice symptoms. The early monitoring schedule helps the team identify problems and decide whether treatment needs to change.'),
 q('Do I need radiotherapy or an infusion with these tablets?','This pathway is regorafenib monotherapy. An additional cancer treatment would require its own agreed plan and safety discussion.'),
 q('Are the seven rest days safe days?','They allow a break from tablets, but problems can continue or develop then. Keep using the same urgent contact plan.')]
reg['patient_summary']={
 'template_version':'0.84.34',
 'purpose':'Targeted tablet treatment to help control previously treated colorectal cancer that has spread. Your team reviews benefit, side effects and your priorities.',
 'schedule':'Days 1–21: prescribed tablets once daily after a light, low-fat meal. Days 22–28: no regorafenib. Repeat only when authorised by your team.',
 'phases':[{'title':'28-day cycle','text':'Three tablet weeks, then one tablet-free week. No fixed total number of cycles.'}],
 'monitoring':[
  {'stage':'Before','test':'Baseline checks','when':'Blood count, kidney, liver, thyroid and blood pressure. ECG/QT if at risk.','basis':'Required / risk-based'},
  {'stage':'Early','test':'Liver / blood pressure','when':'Liver: every two weeks for two months. BP: weekly for six weeks.','basis':'Required by regimen'},
  {'stage':'Later','test':'Ongoing checks','when':'Liver monthly; BP before each cycle; blood count/kidneys regularly. Extra tests as indicated.','basis':'Required / individual'},
  {'stage':'After / review','test':'Recovery / scans / markers','when':'Team-agreed plan; follow unresolved effects. No fixed scan interval.','basis':'Individual plan'}
 ],
 'preparation':['Confirm the tablet calendar, meal and skin-care advice, first test dates and urgent contact numbers. If taking warfarin, arrange INR checks.'],
 'cycle_expectations':['Report painful hands/feet early; side effects can persist during the break.','Same-day missed dose only; never two doses in one day. Do not replace a vomited dose.'],
 'card_title':'Regorafenib (Stivarga)','card_schedule':'28 days · tablets Days 1–21 · no tablets Days 22–28 · team confirms each cycle.',
 'card_cycle_count':None,'card_alert':'Show this card when seeking care. Fever, sudden illness or severe new symptoms: get urgent help.',
 'cycle_blocks':[{'label':'Days 1–21','text':'Once-daily prescribed tablets after a light, low-fat meal.'},{'label':'Days 22–28','text':'No regorafenib. Tests, recovery and next-cycle review.'}]
}
(D/'00244.json').write_text(json.dumps(reg,indent=2,ensure_ascii=False)+'\n')

# Retain every existing Lonsurf paragraph and all six authored anatomy anchors.
l=copy.deepcopy(old)
for key in ['content_version','suite_release','patient_layout_release']:l[key]='0.84.34'
for key in ['source_checked','document_revision']:l[key]='2026-11-05'
l['sources'][1]['title']='EMA Lonsurf · current product information and patient leaflet · checked 5 November 2026'
l['logistics']['sections'].extend([
 item('Swallowing and handling','Swallow tablets whole with water and wash your hands after handling them. If you cannot swallow tablets whole, ask the pharmacist before changing them. Keep them out of children’s reach and ask the pharmacist about safe disposal.',('smpc',)),
 item('Accidental extra tablets','If you take more Lonsurf than prescribed, contact a doctor or go to hospital straight away. Take the packs and current calendar with you.',('smpc',))])
l['chapters'].append(chapter('handling-and-individual-needs','Safe handling and individual needs','Share any difficulties before the next prescription.',[
 l['logistics']['sections'][-2],l['logistics']['sections'][-1],
 item('Lactose and rare inherited conditions','Lonsurf contains lactose. Tell the prescriber about rare inherited galactose intolerance, total lactase deficiency or glucose-galactose malabsorption before treatment; these conditions affect suitability. If you have been told you cannot tolerate some sugars, ask the pharmacist.',('nccp','smpc')),
 item('Additional blood tests','Extra blood-count tests may be needed during a cycle, particularly with kidney impairment or symptoms. The NCCP regimen requires tests before every cycle or as indicated; it does not specify a mandatory Day 15 test for everyone. Follow your team’s individual appointment schedule.',('nccp','smpc')),
 item('After stopping treatment','Ask when unresolved symptoms or abnormal blood tests will be checked again, who remains your contact and what the next treatment or supportive-care plan is. Continue the prescribed contraception precautions after the last dose.',('nccp','smpc'))]))
l['patient_summary']={
 'template_version':'0.84.34',
 'purpose':'Oral chemotherapy to help control previously treated colorectal cancer that has spread. This plan is Lonsurf alone, without bevacizumab.',
 'schedule':'Take prescribed morning and evening doses on Days 1–5 and 8–12, within one hour after meals. No Lonsurf on Days 6–7 or 13–28. The team authorises each new 28-day cycle.',
 'phases':[{'title':'28-day cycle','text':'Two five-day tablet blocks, then recovery. No fixed total number of cycles.'}],
 'monitoring':[
  {'stage':'Before','test':'Baseline bloods / urine','when':'Blood count, kidney and liver tests; urine-protein dipstick.','basis':'Required by regimen'},
  {'stage':'Each cycle','test':'Bloods / urine / symptoms','when':'Repeat before every cycle or as indicated; review recovery and the prescription.','basis':'Required by regimen'},
  {'stage':'If needed','test':'Extra blood counts','when':'During a cycle as arranged, especially with kidney impairment or symptoms.','basis':'Individual risk'},
  {'stage':'After / review','test':'Recovery / scans / markers','when':'Team-agreed plan and follow-up of unresolved effects; no fixed scan interval.','basis':'Individual plan'}
 ],
 'preparation':['Confirm exact morning/evening tablet quantities and strengths, the calendar, anti-sickness medicines, tests and urgent contacts.'],
 'cycle_expectations':['Rest days are not guaranteed safe days: report fever, sudden illness, bleeding or poor intake promptly.','Do not replace missed, held or vomited doses, double doses or restart without the team’s instructions.'],
 'card_title':'Lonsurf (trifluridine/tipiracil)','card_schedule':'28 days · tablets twice daily Days 1–5 and 8–12 · remaining days tablet-free.',
 'card_cycle_count':None,'card_alert':'Show this card when seeking care. Fever or sudden illness: call oncology immediately.',
 'cycle_blocks':[{'label':'Days 1–5','text':'Prescribed morning/evening tablets after meals.'},{'label':'Days 6–7','text':'No Lonsurf.'},{'label':'Days 8–12','text':'Second morning/evening tablet block.'},{'label':'Days 13–28','text':'No Lonsurf; recovery, tests and review.'}]
}
assert l['anatomy']==old['anatomy']
(D/'00382.json').write_text(json.dumps(l,indent=2,ensure_ascii=False)+'\n')
print('Authored 00244; extended 00382 without changing its anatomy or existing rich content')
