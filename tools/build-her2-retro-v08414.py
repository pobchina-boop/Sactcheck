"""Scoped retrospective content refresh; clinical rules are reconciled separately."""
from pathlib import Path
import json, copy
R=Path(__file__).resolve().parents[1]
CODES=['00200','00201','00206','00659','00726']
def read(p):return json.loads((R/p).read_text())
def write(p,d):(R/p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
why={
 '00200':('Why trastuzumab is in your plan','Your cancer has a feature called HER2 that this medicine targets. In early breast cancer, treatment aims to lower the chance of the cancer returning. In metastatic disease, it aims to help control the cancer. These are different pathways, with different treatment durations.','Why this schedule?','This is the three-weekly intravenous schedule. Your team considers your treatment setting, earlier doses, other medicines, heart health and visit arrangements. It is not a claim that three-weekly treatment works better than weekly treatment.'),
 '00201':('Why weekly trastuzumab is in your plan','This weekly intravenous treatment targets HER2-positive breast cancer that has spread. Your team considers previous treatment, current cancer control, side effects and heart health when deciding whether to continue or change it.','Why this schedule?','The weekly and three-weekly schedules have different doses and visit patterns. Ask why the weekly schedule fits your plan and whether this card covers one part of a wider treatment combination. There is no automatic one-year stopping point for this metastatic pathway.'),
 '00206':('Why T-DM1 may be selected','This treatment is for HER2-positive breast cancer that cannot be removed by surgery or has spread, after specified earlier treatment with trastuzumab and a taxane. T-DM1 carries a chemotherapy medicine attached to an antibody that targets HER2.','Why this medicine rather than another HER2 treatment?','The decision depends on the treatments already received, when the cancer returned or changed, organ function, side effects and other suitable options. T-DM1 is different from trastuzumab alone and from trastuzumab deruxtecan (T-DXd). Ask your team to explain why it fits your current plan.'),
 '00659':('Why treatment changes after surgery','If invasive HER2-positive cancer remains in the breast or lymph nodes after the specified preoperative treatment, T-DM1 may be used after surgery to lower the chance of the cancer returning. The surgical pathology result is central to this decision.','Why not simply continue the earlier treatment?','Residual invasive disease changes the treatment discussion. Your team reviews the pathology, earlier medicines, recovery and other suitable options. This card describes a planned course of 14 postoperative T-DM1 cycles; it is not the same as the metastatic T-DM1 pathway.'),
 '00726':('Why the antibodies continue after chemotherapy','The chemotherapy part of your earlier combination has finished. Pertuzumab and trastuzumab continue to target HER2 while the team reviews cancer control and treatment tolerance. Maintenance remains active treatment.','Why does this phase feel different?','This card contains the two HER2 antibodies and no routine cytotoxic chemotherapy. Heart checks, infusion-reaction precautions and attention to diarrhoea remain important. This metastatic maintenance pathway has no fixed one-year stopping point; it is different from treatment after surgery for early breast cancer.')}
journeys=read('data/breast-treatment-journeys-v0837.json')
phase=read('data/phase-support-v0838.json')
phase['regimens']['00726']=[dict(id='maintenance',label='Pertuzumab + trastuzumab maintenance',active_medicines=['Pertuzumab','Trastuzumab'],emetogenic_risk='Minimal',medicines=[],source_checked='2026-10-21',source_page=4,additional_support=['No routine prophylactic antiemetic, corticosteroid or G-CSF order is added for these antibodies alone. Review individual symptoms and previous infusion reactions.','Confirm the last administration date. A gap of 6 weeks or longer requires review of both antibody loading doses under the NCCP schedule.','Keep the existing cardiac-monitoring clock when moving to maintenance; review new breathlessness, swelling, fatigue or rapid weight gain.','Report diarrhoea early; agree hydration, symptom treatment and when to contact the unit.'])]
profiles={}
for v in ['0837','0838','0839','0840','0841','0842','0849','08412','08413']:
 for p in read(f'data/regimen-knowledge-base-v{v}-addendum.json')['regimen_profiles']:profiles[p['protocol_id']]=p
new=[]
for c in CODES:
 d=read(f'data/patient-knowledge/{c}.json');j=journeys[c]
 d.update(suite_release='0.84.14',source_checked='2026-10-21',content_version='0.84.14',hide_evidence_navigation=True)
 d.pop('evidence',None)
 d['sources']=[s for s in d['sources'] if s['id']!='trial']
 title,intro,sub,detail=why[c]
 rationale=dict(id='treatment-rationale',title='Why this treatment?',intro=intro,items=[dict(title=title,text=intro,source_ids=['nccp']),dict(title=sub,text=detail,source_ids=['nccp']),dict(title='Your own decision',text='Ask which cancer features, earlier treatments and health factors led to this recommendation, what alternatives were considered, and when the plan will be reviewed.',source_ids=['nccp'])])
 d['chapters']=[rationale]+[ch for ch in d['chapters'] if ch['id']!='treatment-rationale']
 d['questions']=[q for q in d['questions'] if q['q']!='Why was this treatment chosen for me?']+[dict(q='Why was this treatment chosen for me?',a=intro+' '+detail)]
 j.update(release='0.84.14',checked='2026-10-21',status='Source reconciled; independent clinical, pharmacy and patient/PPI review pending')
 if c in ['00201','00206']:
  for lane in j['lanes']:
   if lane['kind']=='treatment':lane['cells'][-1]='Review cancer control and tolerance; agree continuation or a change.'
   if lane['label']=='Scans / markers':
    lane['cells'][2]='Response imaging when due; exact timing agreed for the known disease sites.'
    lane['cells'][3]='Continue the individual metastatic response-assessment plan.'
   if lane['label']=='Endocrine / bone health':
    lane['cells']=['Check hormone receptors, previous treatments and bone-health needs','Any endocrine treatment requires a separate oncology plan','DEXA only if indicated by endocrine treatment or fracture risk','Do not add another anticancer medicine from this component card','Continue the individual bone and supportive-care plan']
  if c=='00206':
   for lane in j['lanes']:
    if lane['kind']=='blood':lane['cells']=['Baseline FBC, renal and liver tests','Before every cycle','Before every cycle, including around C5','Before every cycle','Review abnormalities and the next treatment plan']
   d['support'][2]=dict(title='Other treatments and bone health',text='Radiotherapy or local procedures are used only if indicated. Any endocrine or other systemic treatment needs a separate oncology plan. Bone-health checks depend on the individual risk and treatment context.',source_ids=['nccp'])
  else:
   d['support'][2]=dict(title='Other treatments',text='Any companion medicine, local procedure or radiotherapy needs its own oncology plan. This weekly metastatic component card does not prescribe an early-breast surgical sequence.',source_ids=['nccp'])
  # Rebuild old narrative chapters from the corrected shared map rather than carrying copied labels forward.
  for ch in d['chapters']:
   if ch['id'] in ['after-treatment','before-treatment']:
    for it in ch['items']:
     text=it['text'].replace('Early: completed year if applicable. Metastatic: review whether to continue or change.','Review cancer control and tolerance; agree continuation or a change.').replace('SC: week 12 is another six-week blood point; T-DM1: every cycle','Before every T-DM1 cycle').replace('Metastatic response imaging if due; not an automatic early-breast CT','Response imaging when due for the known disease sites').replace('Individualised response or breast surveillance plan','Individual metastatic response-assessment plan').replace('May overlap trastuzumab when clinically appropriate','Any additional systemic treatment requires a separate oncology plan')
     it['text']=text
 if c=='00659':
  for lane in j['lanes']:
   if lane['kind']=='heart':lane['cells'][2]='Every 12 weeks: around cycles 5, 9 and 13 if uninterrupted; earlier if needed'
   if lane['kind']=='blood':lane['cells'][2]='FBC including platelets, renal and liver tests before every cycle'
  d['timeline']=[dict(id='dose',label='T-DM1 infusion',start=1,end=1,text='Planned dose after review',style='treatment'),dict(id='reaction',label='Infusion reaction',start=1,end=1,text='During / after infusion; report promptly',style='variable'),dict(id='platelets',label='Bruising / bleeding',start=1,end=21,text='Report changes; keep platelet checks',style='variable'),dict(id='heart-lung',label='Heart / breathing symptoms',start=1,end=21,text='Seek advice on any day',style='variable'),dict(id='nerves',label='Numbness / tingling',start=1,end=21,text='Report before the next dose',style='cumulative')]
  d['support'][1]['text']='Baseline FBC, renal and liver tests and cardiac assessment before T-DM1. Repeat blood tests before every cycle. Echo/MUGA every 12 weeks, around cycles 5, 9 and 13 if uninterrupted; earlier if symptoms or abnormal results require it.'
  d['logistics']['steps'][0]['text']='Blood tests, cardiac assessment, medicines review and the consent conversation come before T-DM1. Confirm recovery from surgery and the pathology-based treatment plan.'
  d['logistics']['details'][-1]['text']='The first T-DM1 infusion takes 90 minutes, followed by at least 90 minutes of observation. Later tolerated infusions can take 30 minutes, followed by at least 30 minutes of observation. These are infusion and observation times, not the whole visit.'
 if c in ['00659','00726']:
  maintenance=c=='00726'
  d['monitoring_schedule']=dict(title='When your checks happen',columns=['Before this phase','Before every 21-day cycle','Week 12 · around C5','Weeks 24 / 36 · around C9 / C13','Later / treatment change'],note='Cycle numbers are examples for uninterrupted three-weekly treatment. Schedule checks by elapsed time and clinical need. Moving to maintenance does not restart the cardiac-monitoring clock. The clinical team books and reviews results; this map does not track completed tests.',source_ids=['nccp','esc'],rows=[dict(label='Heart pumping test · echo / MUGA',cells=['Review baseline / latest cardiac assessment and the next due date','Review symptoms; echo is not automatically needed before every infusion','Repeat at 12 weeks; earlier if symptoms or impairment','Continue every 12 weeks; preserve the existing due date','NCCP 12-weekly default while treatment continues; a different interval needs an explicit specialist plan.'] if maintenance else ['Baseline cardiac assessment and LVEF before T-DM1','Review symptoms; earlier echo if clinically indicated','Echo / MUGA at 12 weeks, around C5','Repeat around C9 and C13 if uninterrupted','Review at completion; agree follow-up based on cardiac risk and findings.']),dict(label='Blood tests',cells=['Baseline FBC, renal and liver profile','FBC, renal and liver tests before every cycle','Continue pre-cycle blood tests','Continue pre-cycle blood tests','Follow abnormalities and the next treatment plan']),dict(label='Cancer imaging / markers',cells=['Record disease sites and the comparison scan' if maintenance else 'Surgery and pathology establish the indication','Review new symptoms at every visit','Metastatic: response scans when due under the individual plan' if maintenance else 'No routine CT series if well in early breast follow-up','Individual scan interval; markers only if informative' if maintenance else 'Agree breast surveillance and any symptom-led tests','Metastatic scans commonly every 2–4 months; not an NCCP fixed-cycle rule' if maintenance else 'Annual mammography of remaining breast tissue; additional imaging if indicated']),dict(label='ECG / bone health',cells=['ECG when indicated by cardiac assessment; DEXA only if endocrine / fracture risk indicates','No automatic every-cycle ECG or DEXA','Risk-based clinical plan','Risk-based clinical plan','Keep any separately prescribed endocrine and bone-health follow-up'])])
  if maintenance:d['monitoring_schedule']['source_ids']+=['metastatic','markers']
  else:d['monitoring_schedule']['source_ids']+=['early','bone']
 if c=='00206':
  for row in d['monitoring_schedule']['rows']:
   if row['label']=='Cancer scans / markers':row['cells']=['Record the disease sites and comparison imaging','Assess symptoms at every visit','Scan if due or indicated','Response review on the individual plan','Metastatic response scans commonly every 2–4 months; markers supplement the full assessment.']
   if row['label'].startswith('DEXA'):row['cells']=['Assess bone-health need from the individual treatment and fracture risk','Not an automatic T-DM1 test','Timing depends on risk and results','Separate from echo monitoring','Any endocrine treatment or bone protection requires its own oncology plan.']
  note=' Metastatic T-DM1 continues according to benefit and tolerance; the early-breast 14-cycle course does not apply.'
  if note not in d['monitoring_schedule']['note']:d['monitoring_schedule']['note']+=note
 if c=='00201':
  for row in d['monitoring_schedule']['rows']:
   if row['label']=='Cancer scans / markers':row['cells']=['Record disease sites and scan purpose','Assess symptoms at every visit','Scan if due or clinically indicated','Response imaging under the individual plan','Metastatic response scans commonly every 2–4 months; markers are supplementary.']
   if row['label'].startswith('Heart'):row['cells'][-1]='Every 12 weeks during treatment; earlier for concerns. Agree cardiac follow-up when treatment stops or changes.'
 if c=='00726':
  d['logistics']['steps'][0]['text']='Before maintenance, review blood tests, the latest heart assessment, prior treatment response, last antibody doses and the next echo due date.'
  d['logistics']['steps'][2]['text']='Check treatment tolerance and symptoms, then receive the prescribed pertuzumab and trastuzumab infusions with observation. Premedicines depend on previous reactions and the individual plan; they are not automatic chemotherapy premedication.'
  d['logistics']['details'][-1]['text']='The visit includes review, infusions and observation. Maintenance does not automatically require new loading doses; an interval of 6 weeks or longer needs review of both antibody loading schedules. Ask your team for the expected visit time.'
 if c=='00201':
  for row in d['monitoring_schedule']['rows']:
   if row['label'].startswith('Heart'):row['cells'][-1]='Every 12 weeks during treatment; earlier for concerns. Agree cardiac follow-up when treatment stops or changes.'
 for p in phase['regimens'][c]:p['source_checked']='2026-10-21'
 k=copy.deepcopy(profiles[d['protocol_id']]);k['full_suite_release']='0.84.14';k['source_checked_date']='2026-10-21'
 k['monitoring_and_toxicity']['longitudinal_schedule']=copy.deepcopy(d['monitoring_schedule'])
 k['supportive_care']['patient_education']=[s['text'] for s in d['support']]
 k['monitoring_and_toxicity']['baseline']=['Confirm the exact indication, prior treatment and current formulation.','FBC, renal and liver profile; baseline cardiac assessment and LVEF.']
 k['monitoring_and_toxicity']['before_each_cycle']=['Check symptoms, treatment tolerance, due investigations and the current dose / last administration date.','FBC, renal and liver profile before every cycle.' if c in ['00206','00659','00726'] else 'Repeat bloods according to the NCCP / companion-drug and individual clinical plan; no universal interval is specified in this component protocol.','Echo / MUGA every 12 weeks by elapsed time; review earlier for cardiac symptoms or impairment.']
 k['key_points']=[x for x in k['key_points'] if 'SC:' not in x]
 if c=='00201':k['key_points']=[x.split('; after anthracyclines')[0]+'.' if '; after anthracyclines' in x else x for x in k['key_points']]
 if c=='00659':k['patient_selection']['eligibility_orientation']=['Residual invasive HER2-positive early breast cancer after neoadjuvant taxane-based chemotherapy and HER2-directed therapy; T1–4/N0–3/M0, ECOG 0–1 and baseline LVEF ≥50%.','Confirm at least 6 cycles and at least 16 weeks of preoperative systemic therapy, including at least 9 weeks of trastuzumab and at least 9 weeks of taxane chemotherapy.','Initiate within 12 weeks of surgery; confirm the NCCP requirement for completion of preoperative chemotherapy and HER2-directed treatment within 12 weeks of initiation. Check the full eligibility and exclusion list.']
 if c=='00726':k['patient_selection']['eligibility_orientation']=['Adult HER2-positive metastatic or locally recurrent unresectable disease, responding after pertuzumab/trastuzumab with docetaxel, paclitaxel or vinorelbine; ECOG 0–1 and baseline LVEF ≥50%.','Confirm chemotherapy completion, response and last antibody doses. Continue until progression or unacceptable toxicity; the early-breast one-year limit does not apply.']
 ev=read('validation/her2-retro-v08414/evidence/evidence-audit.json')['profiles'][c]
 k.update(copy.deepcopy(ev))
 k['administration']['practical_workflow']=[x['text'] for x in d['logistics']['steps']]
 k['administration']['observation_and_access']=[x['text'] for x in d['logistics']['details']]
 k['evidence_audit']={'status':'Primary sources reconciled; independent clinical/pharmacy review pending','checked':'2026-10-21','indications_reviewed':[ev['treatment_rationale']['setting']],'coverage_summary':ev['evidence_at_a_glance']['applicability'],'later_or_add_on_search':ev['treatment_rationale']['limitations'],'remaining_uncertainties':[ev['treatment_rationale']['limitations'],'Irish access and local treatment sequencing require separate verification.']}
 k['reference_links']=[x for x in k['reference_links'] if 'monarch' not in json.dumps(x).lower()]

 new.append(k);write(f'data/patient-knowledge/{c}.json',d)
write('data/breast-treatment-journeys-v0837.json',journeys);write('data/phase-support-v0838.json',phase)
write('data/regimen-knowledge-base-v08414-addendum.json',dict(schema_version='1.0',release='0.84.14',source_checked_date='2026-10-21',governance='Indication-specific retrospective update; independent oncology/pharmacy approval pending. Numerical efficacy is clinician-only.',regimen_profiles=new,evidence_records=[],drug_profiles=[]))
print('Five retrospective HER2 patient, monitoring and clinician profiles prepared.')
