"""Author context-specific patient content; preserve established anatomy and long-form text."""
from pathlib import Path
import json, copy, hashlib, subprocess
R=Path(__file__).resolve().parents[3]
V='0.84.34';DATE='2026-11-05'
def read(p): return json.loads((R/p).read_text())
def save(p,d):
 p=R/p;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def item(title,text,ids=('nccp',)):return dict(title=title,text=text,source_ids=list(ids))
def chapter(id,title,intro,items):return dict(id=id,title=title,intro=intro,items=items)
def check(stage,test,when,basis='Required by regimen'):return dict(stage=stage,test=test,when=when,basis=basis)
template=read('data/patient-knowledge/00214.json')
reports=[]
for c,dose,days,ver,ind,url in [
 ('00212','10',14,'7','a','https://healthservice.hse.ie/documents/6552/212_Bevacizumab_10.pdf'),
 ('00214','7.5',21,'8','a','https://healthservice.hse.ie/documents/6554/214_Bevacizumab_7.5.pdf'),
 ('00215','15',21,'7','d','https://healthservice.hse.ie/documents/6940/00215_Bevacizumab_15.pdf')]:
 d=copy.deepcopy(template)
 d.update(code=c,protocol_id=f'nccp-{c}-v{ver}',protocol_version=ver,content_version=V,suite_release=V,source_checked=DATE,document_revision=DATE,patient_layout_release=V,title=f'Bevacizumab {dose} · colorectal',cycle_days=days,patient_context='colorectal',context_label='Metastatic colorectal cancer · bevacizumab component with fluoropyrimidine-based chemotherapy',indication_text=f'NCCP {c}{ind}: bevacizumab with fluoropyrimidine-based chemotherapy for adults with metastatic carcinoma of the colon or rectum.',purpose='To help control bowel cancer that has spread, alongside the chemotherapy chosen by your oncology team.')
 protocol_path=next((R/'protocols').glob('*/'+c+'-*.json'))
 d['protocol_id']=json.loads(protocol_path.read_text())['protocol_id']
 d['schedule_summary']=f'Bevacizumab is given by drip on Day 1 every {days} days with the prescribed fluoropyrimidine-based chemotherapy. Treatment continues while helping and tolerable; there is no fixed total number of cycles. The partner chemotherapy has its own dose days, tests and support plan.'
 d['administration_text']=f'Bevacizumab {dose} mg/kg is given by intravenous infusion in 100 mL sodium chloride 0.9%. The first infusion lasts 90 minutes; the next may be 60 minutes if tolerated, then 30 minutes if tolerated. The full visit also includes checks, preparation, observation and the partner chemotherapy.'
 d['scope_notice']=f'This pack covers the bevacizumab component of NCCP {c}{ind} colorectal treatment. Bring the separately named chemotherapy pack and prescription. It does not describe bevacizumab for other cancers or authorise bevacizumab alone.'
 d['treatment_scope_notice']=d['scope_notice']
 d['phases']=[dict(id='combination',label='Bevacizumab with chemotherapy',short=f'{days}-day reference cycle',agents=['bevacizumab'],detail=d['schedule_summary'],cycles=['Review'])]
 d['timeline']=[dict(id='bev',label='Bevacizumab infusion',start=1,end=1,style='treatment',text=f'Day 1 every {days} days after review'),dict(id='partner',label='Separate chemotherapy schedule',start=1,end=days,style='monitoring',text='Use the named partner pack for tablet days, infusions or pump timing'),dict(id='symptoms',label='Symptoms and safety checks',start=1,end=days,style='monitoring',text='Symptoms can occur at any time; attend arranged tests')]
 d['day_groups']=[dict(start=1,end=1,title='Infusion and checks',body='Bevacizumab after review; the chemotherapy partner follows its own prescription.',action='Confirm blood pressure, urine testing and the full combination plan.'),dict(start=2,end=days,title='Between bevacizumab visits',body='Follow the separate chemotherapy calendar and report new symptoms promptly.',action='Keep arranged checks; contact oncology if unwell.')]
 d['passport_groups']=[dict(title=f'Cycle {i}',agents=['bevacizumab']) for i in range(1,7)]
 d['passport_visit_note']='This is a rolling record, not a six-cycle limit. Record actual doses and interruptions. A stamp records completed treatment and does not authorise the next dose.'
 d['chronology_notes']=[item('Partner treatment changes the schedule','This calendar shows bevacizumab only. Fluoropyrimidine-based chemotherapy may involve tablets, other infusion days or a home pump. Use its separate written calendar.'),item('Symptoms can occur at any time','Raised blood pressure or protein in urine may have no symptoms. Attend tests, and report bleeding, severe abdominal pain, chest pain, breathlessness or new neurological symptoms promptly.'),item('Treatment decisions','The team may hold or stop bevacizumab for side effects. Decisions for each chemotherapy medicine are separate; do not restart or alter treatment yourself.')]
 ms=d['monitoring_schedule']
 ms['rows'][0]['cells']=['Confirm colorectal indication / partner',f'Bevacizumab Day 1 every {days} days','Follow partner prescription','Review benefit and tolerability','Next plan agreed individually']
 d['sources']=[s for s in d['sources'] if s['id']!='trial']
 d['sources'][0]=dict(id='nccp',title=f'NCCP {c} v{ver} · official regimen',url=url)
 if c=='00212':
  d['sources'].append(dict(id='trial',title='E3200: bevacizumab with FOLFOX4 after previous treatment',url='https://pubmed.ncbi.nlm.nih.gov/17442997/'))
  ev='E3200 studied bevacizumab 10 mg/kg every two weeks with FOLFOX4 in metastatic colorectal cancer previously treated with a fluoropyrimidine and irinotecan. Adding bevacizumab improved survival in that trial. This does not establish the same result with every chemotherapy partner or predict an individual outcome.'
 elif c=='00214':
  d['sources'].append(dict(id='trial',title='NO16966: bevacizumab with oxaliplatin-based chemotherapy',url='https://pubmed.ncbi.nlm.nih.gov/18421054/'))
  ev='NO16966 studied first-line oxaliplatin-based chemotherapy with or without bevacizumab. The trial included 7.5 mg/kg every three weeks with XELOX and 5 mg/kg every two weeks with FOLFOX4. Its pooled result showed a delay in cancer progression; the overall-survival difference was not statistically significant. Pooled results are not an exact-dose estimate for this component alone.'
 else:
  ev='NCCP lists bevacizumab 15 mg/kg every three weeks with fluoropyrimidine-based chemotherapy for metastatic colorectal cancer. A survival estimate from a different bevacizumab dose, chemotherapy combination or cancer setting is not assigned to this schedule. Your team explains the evidence for the exact combination and line of treatment.'
 d['evidence']=dict(title='Evidence in this colorectal setting',intro='The chemotherapy partner, dose schedule and previous treatment determine how trial results apply.',metrics=[],interpretation=ev,source_ids=['trial'] if c!='00215' else ['nccp'])
 d['chapters']=[
  chapter('understanding','Why bevacizumab is included','This is one part of your combination treatment.',[item('Treatment aim',d['purpose']),item('How it works',d['agents'][0]['explanation']),item('Which evidence applies?',ev,tuple(d['evidence']['source_ids']))]),
  chapter('before-treatment','Before treatment starts','Some problems are found by tests before symptoms develop.',[item('Baseline checks','Blood count, kidney and liver tests, urine protein, blood pressure and a heart history/examination are checked. A heart ultrasound is considered after chest-wall radiotherapy or previous anthracycline treatment.'),item('Medicines, wounds and procedures','Bring all medicines and supplements. Report bleeding, clotting problems, poorly controlled blood pressure, unhealed wounds and planned operations or dental procedures. Oncology must coordinate any treatment pause.'),item('The complete combination','Confirm the chemotherapy partner, its tests, infusion or tablet calendar, any pump arrangements and prescribed anti-sickness plan. This bevacizumab pack cannot replace those instructions.')]),
  chapter('during-treatment','During and between cycles','Your next dose depends on review, not just the date.',[item('Blood pressure and urine','Blood pressure is checked before each cycle and after treatment. Regular blood-count, kidney/liver and urine-protein tests continue. Extra tests are arranged for abnormal results.'),item('Warfarin','If taking warfarin, INR is checked weekly until the warfarin dose is stable, then before each cycle. Tell the team about bleeding or any medicine changes.'),item('Symptoms that need urgent help',d['urgent_extra']),item('Support medicines','Bevacizumab alone has minimal sickness risk. The chemotherapy partner determines additional anti-sickness treatment and other supportive medicines; use the issued prescription.')]),
  chapter('living-with-treatment','Living with treatment','Keep information and contacts available on paper as well as online.',[item('Before any procedure','Tell every treating clinician that you receive bevacizumab. It can affect wound healing; your oncology team must agree timing around operations and check healing before restarting.'),item('Keeping a record',d['passport_visit_note']),item('Pregnancy and fertility','Discuss fertility and pregnancy prevention with your team before treatment. Check the duration of contraception and breastfeeding restrictions for every medicine in the combination; contact oncology promptly if pregnancy is possible.')]),
  chapter('after-treatment','Review and follow-up','There is no universal final cycle or scan timetable.',[item('Assessing benefit','Your consultant sets scans and any tumour-marker tests according to your cancer, symptoms and treatment plan. These are separate from routine blood-pressure and laboratory safety checks.'),item('After a pause or stopping','Continue arranged blood-pressure checks and follow-up of unresolved effects. Ask who reviews results, what treatment follows and whom to contact if symptoms develop.')])]
 d['patient_summary'].update(template_version=V,purpose=d['purpose'],schedule=f'Bevacizumab Day 1 every {days} days, with separately prescribed chemotherapy. Continue while helping and tolerable; no fixed final cycle.',phases=[dict(title='Combination treatment',text='Your partner chemotherapy has its own schedule, tests and support plan.')],card_schedule=f'Bevacizumab Day 1 every {days} days + separate chemotherapy plan.',card_title=d['title'],card_cycle_count=None,card_record_note='Rolling record: no fixed final cycle.',cycle_expectations=['Attend blood-pressure and urine checks even when feeling well.','Follow the partner chemotherapy calendar; report bleeding, severe pain or new symptoms promptly.'])
 path=f'data/patient-knowledge-contexts/{c}/colorectal.json';save(path,d)
 reports.append(dict(route=c+'/colorectal',profile=path,anatomy_preserved_from='00214',source_pages='00212 p1–3; 00214 p1–3; 00215 p1–4',notes='Dose/context-specific pack; no borrowed lung/ovarian cycle cap or partner schedule.'))

for c in ['00207','00225','00328','00330','00331']:
 path=f'data/patient-knowledge/{c}.json';d=read(path);original=copy.deepcopy(d)
 d.update(content_version=V,suite_release=V,patient_layout_release=V,source_checked=DATE,document_revision=DATE)
 mono=c in ['00207','00225'];antibody='panitumumab' if c=='00225' else 'cetuximab'
 checks=[check('Before','Bloods and suitability','Blood count, kidney/liver tests and tumour-marker suitability (RAS). Review medicines, allergies and symptoms.','Regimen / treatment suitability'),check('During','Bloods, skin and symptoms','Blood count, kidney/liver tests '+('before each treatment' if c=='00225' else 'regularly as arranged' if c=='00207' else 'before each cycle')+'; check skin, eyes, bowel symptoms and hydration.'),check('During / after','Magnesium and other minerals','Monitor during treatment; monthly electrolytes, magnesium and calcium for two months after the last antibody dose.'),check('Review','Response and recovery','Scans and other response tests follow the consultant plan; follow unresolved effects.','Individual plan')]
 checks[0]['when']=checks[0]['when'].replace('tumour-marker suitability (RAS)','tumour RAS suitability')
 if c=='00207':checks[0]['when']='Blood count, kidney/liver tests; confirm cancer setting and RAS result for bowel cancer. Review allergies and symptoms.'
 if c=='00328':
  checks[0]['when']='Blood count, kidney/liver tests; RAS and DPD results; ECG if heart function is impaired; safe pump access.'
  checks.insert(3,check('If applicable','Warfarin INR','Check INR as clinically indicated if taking warfarin.','Conditional on medicine'))
 if c in ['00330','00331']:
  checks[1]['when']='Regular blood count, kidney/liver tests as arranged; check skin, eyes, bowel symptoms and hydration before treatment.'
  for row in d['monitoring_schedule']['rows']:
   if row['label']=='Blood counts, kidney and liver':row['cells'][2]='Regular blood count, kidney and liver tests as arranged'
 prep=['Bring your medicine list and report new symptoms before dosing. Confirm test appointments, the skin-care plan and urgent contacts.']
 if not mono:prep.append('Have a written irinotecan diarrhoea rescue plan. Report symptoms before any restart; never adjust doses yourself.')
 expectations=['Report painful rash, sore nails, eye pain or worsening breathing promptly. Keep mineral checks after treatment ends.']
 if not mono:expectations=['Early cramps or sweating during infusion and delayed diarrhoea need different plans. Follow the prescribed rescue instructions.','Fever, severe diarrhoea, poor intake or reduced urine needs urgent advice; there are no guaranteed safe days.']
 schedule=d['schedule_summary']
 if c=='00207':card='Cetuximab weekly; radiotherapy dates only if prescribed.'
 elif c=='00225':card='Panitumumab Day 1 every 14 days.'
 elif c=='00328':card='Cetuximab D1/D8; FOLFIRI D1; 46-hour pump to D3. Every 14 days.'
 elif c=='00330':card='Cetuximab D1/D8; irinotecan D1. Every 14 days; no home pump.'
 else:card='Cetuximab + irinotecan D1 every 14 days; no D8 visit or home pump.'
 d['patient_summary']=dict(template_version=V,purpose=d['purpose'],schedule=schedule,phases=[dict(title=p['label'],text=p['detail']) for p in d['phases']],preparation=prep,monitoring=checks,cycle_expectations=expectations,card_title=d['title'],card_schedule=card,card_alert='Show this card when seeking care. A stamp records treatment; it does not approve the next dose.',card_cycle_count=None,card_record_note='Rolling record; the team confirms the total treatment plan.')
 d['evidence'].setdefault('metrics',[])
 corrections=[]
 for ch in d['chapters']:
  for it in ch['items']:
   if it['title']=='A plan that can change':
    it['text']=('For bowel cancer, discuss control of cancer and symptoms, and whether further local treatment may become possible. For head-and-neck treatment, discuss the aim of the combined radiation plan. Your preferences and priorities matter.' if c=='00207' else 'Discuss how treatment aims to control the cancer and symptoms, and whether a response could allow a further local treatment in your individual case. Review benefit, side effects and your priorities as the plan changes.')
    corrections.append('Replaced generic recurrence-prevention wording with indication-specific treatment aim.')
   if it['title']=='Skin or nerve changes':
    it['title']='Skin and nail changes';corrections.append('Heading now describes the EGFR skin/nail advice actually provided.')
 assert d['anatomy']==original['anatomy']
 save(path,d);reports.append(dict(route=c,profile=path,anatomy_unchanged=True,full_chapters_retained=True,targeted_text_corrections=corrections,summary_added=True))
for c in ['00244','00382']:
 path=f'data/patient-knowledge/{c}.json';d=read(path)
 d['treatment_scope_notice']=d['scope_note']
 d['evidence'].setdefault('metrics',[])
 save(path,d)
 reports.append(dict(route=c,profile=path,oral_audit_confirmation='NCCP/EMA monitoring and administration cross-checked with oral audit; no universal Day15 Lonsurf test inserted.',scope='CRC only; 00382 monotherapy only',anatomy_unchanged=True))
save('validation/colorectal-v08434/patient-content/content-report.json',dict(release=V,checked=DATE,routes=reports,limitations=['Patient/PPI and independent clinical review pending.','Rendering, print bounds and QR checks are parent release tasks.']))
