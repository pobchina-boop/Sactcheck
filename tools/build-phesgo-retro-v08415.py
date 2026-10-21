"""Five indication-specific retrospective suites; clinical rules reconciled separately."""
from pathlib import Path
import copy,json
R=Path(__file__).resolve().parents[1]
CODES=['00785','00796','00797','00789','00790']
def read(p):return json.loads((R/p).read_text())
def write(p,d):(R/p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def replace_text(v,old,new):
 if isinstance(v,str):return v.replace(old,new)
 if isinstance(v,list):return [replace_text(x,old,new) for x in v]
 if isinstance(v,dict):return {k:replace_text(x,old,new) for k,x in v.items()}
 return v
why={
 '00785':('Why the HER2 medicines continue','Your chemotherapy phase has finished. The two medicines in Phesgo continue to target HER2-positive cancer while your team reviews cancer control and side effects. Maintenance is still active treatment.','Why does this phase feel different?','Phesgo contains pertuzumab and trastuzumab in one injection under the skin. It contains no conventional chemotherapy. The plan depends on earlier treatment, response, heart health and your priorities. This advanced-cancer pathway has no fixed one-year stopping point.'),
 '00796':('Why combine docetaxel with Phesgo?','This combination treats HER2-positive breast cancer that has spread or cannot be removed by surgery. The chemotherapy and the two HER2-targeted medicines act in different ways. Your team considers previous treatment, disease symptoms, general health and heart function.','Why this combination now?','This NCCP pathway is for people who have not had chemotherapy or HER2-directed treatment for their metastatic disease. Docetaxel is one phase of the plan; the HER2 medicines may continue after it finishes. Ask which other options were considered and why this treatment fits your circumstances.'),
 '00797':('Why weekly paclitaxel with Phesgo?','This targets HER2-positive cancer that has spread or cannot be removed by surgery. In this NCCP pathway, weekly paclitaxel is an alternative when docetaxel is unsuitable, has caused significant side effects or cannot be tolerated.','What affects the choice?','Your team considers earlier treatment, nerve symptoms, general health, heart function and the extra weekly visits. This combination needs a specific discussion and the local consent process for use outside the licensed indication. Ask why it is suitable for you and what alternatives are available.'),
 '00789':('Why give TCHP before surgery?','The aim is to treat higher-risk HER2-positive breast cancer before surgery and reduce the chance of it returning. Docetaxel and carboplatin are chemotherapy medicines; Phesgo contains two medicines that target HER2.','Why this plan rather than another?','The choice depends on the cancer stage, lymph nodes, HER2 result, general health and the likely side effects. This plan does not contain an anthracycline. Six cycles come before surgery; the surgical findings help decide the next HER2 treatment. Hormone treatment and radiotherapy depend on your individual results and plan.'),
 '00790':('Why this paclitaxel and carboplatin plan?','The aim is to treat higher-risk HER2-positive breast cancer before surgery and reduce the chance of it returning. Paclitaxel and carboplatin are chemotherapy medicines; Phesgo contains two medicines that target HER2.','How is the treatment organised?','The NCCP plan uses six cycles without an anthracycline: Phesgo and carboplatin on Day 1, with paclitaxel on Days 1 and 8. There is no planned Day 15 paclitaxel. Your team considers the cancer features, general health, nerve symptoms and visit pattern. Surgery and pathology then guide the next treatment.')}
journeys=read('data/breast-treatment-journeys-v0837.json')
phase=read('data/phase-support-v0838.json')
profiles={p['protocol_id']:p for p in read('data/regimen-knowledge-base-v08412-addendum.json')['regimen_profiles']}
evidence=read('validation/phesgo-retro-v08415/evidence/evidence-audit.json')['profiles']
new=[]
for c in CODES:
 d=read(f'data/patient-knowledge/{c}.json');j=journeys[c]
 d.update(suite_release='0.84.15',content_version='0.84.15',source_checked='2026-10-21',hide_evidence_navigation=True)
 d.pop('evidence',None)
 d['sources']=[s for s in d['sources'] if s['id'] not in ['trial','federica']]
 title,intro,sub,detail=why[c]
 d['chapters']=[dict(id='treatment-rationale',title='Why this treatment?',intro=intro,items=[dict(title=title,text=intro,source_ids=['nccp']),dict(title=sub,text=detail,source_ids=['nccp']),dict(title='Your own decision',text='Ask which cancer features, earlier treatments and health factors led to this recommendation, what alternatives were considered, and when the plan will be reviewed.',source_ids=['nccp'])])]+[ch for ch in d['chapters'] if ch['id']!='treatment-rationale']
 d['questions']=[q for q in d['questions'] if q['q']!='Why was this treatment chosen for me?']+[dict(q='Why was this treatment chosen for me?',a=intro+' '+detail)]
 j['sources']=[s for s in j['sources'] if s['id'] not in ['trial','federica']]
 j.update(release='0.84.15',checked='2026-10-21',status='Source reconciled; independent clinical, pharmacy and patient/PPI review pending')
 if c in ['00789','00790']:
  # Patient orientation explains the next decision without internal routing instructions.
  after=('After surgery, your team reviews the pathology and chooses the next HER2 medicine. The usual plan aims to complete about one year of HER2 treatment from the first dose. Remaining invasive cancer can change the medicine offered. The selected treatment has its own blood tests and supportive medicines.')
  for ch in d['chapters']:
   if ch['id']=='treatment-aim':
    for it in ch['items']:
     if it['title']=='After this phase':d=replace_text(d,it['text'],after)
  j['clinical_notes']=[after if '00785' in x else x for x in j['clinical_notes']]
  for lane in j['lanes']:
   if lane['kind']=='heart':lane['cells']=['Baseline echo / MUGA; ECG and cardiovascular risk review','Echo every 12 weeks: first around cycle 5; earlier for symptoms','Review any due cardiac test; surgery does not restart the clock','Continue cardiac checks for the selected HER2 medicine','Agree cardiac follow-up when treatment ends']
   if lane['kind']=='blood':lane['cells'][3]='Use the blood-test schedule for the separately selected postoperative medicine'
   if lane['kind']=='imaging':lane['cells']=['Baseline breast / nodal assessment; staging as indicated','Clinical response and MDT-selected imaging during treatment','Reassess before surgery; pathology informs the next plan','Mammography of remaining breast tissue under the surveillance plan','Other imaging for symptoms / clinical concern; no routine tumour-marker screening']
  d['monitoring_schedule']['columns']=['Before starting','Cycles 1–4','Around cycle 5 / week 12','Cycle 6 / surgery','Postoperative plan']
  for row in d['monitoring_schedule']['rows']:
   if row['label']=='Blood tests':row['cells'][3]='Before cycle 6; preoperative tests as directed';row['cells'][4]='Follow the selected postoperative medicine; do not carry forward taxane-day checks'
   if row['label']=='Echo / MUGA':row['cells'][3]='Review any due echo; earlier if symptoms';row['cells'][4]='Continue on the selected HER2 plan; surgery does not restart the clock'
   if row['label']=='Scans / cancer markers':row['cells'][2]='MDT-selected response imaging; not automatically tied to the week-12 echo';row['cells'][3]='Reassess before surgery';row['cells'][4]='Breast surveillance; symptom-directed other imaging'
  d['monitoring_schedule']['note']='Columns show order, not equal durations. The first routine 12-week echo falls during the six-cycle preoperative course, around cycle 5 if uninterrupted. Count from first HER2 treatment; a delay, surgery or a change of medicine does not restart the clock. The selected postoperative regimen determines later tests.'
  for ch in d['chapters']:
   if ch['id']=='checks':ch['items'].append(dict(title='When the treatment phase changes',text='The first 12-week echo is during preoperative treatment, around cycle 5 if on time. After surgery, use the monitoring and supportive medicines for the selected postoperative regimen; the earlier chemotherapy-day blood checks do not automatically continue.',source_ids=['nccp'])) if not any(x['title']=='When the treatment phase changes' for x in ch['items']) else None
  continuation=next(p for p in phase['regimens'][c] if p['id']=='continuation')
  continuation.update(emetogenic_risk='Confirm the selected postoperative regimen',source_page=1,additional_support=['Open the separately selected postoperative regimen before issuing supportive medicines. Its emetic risk, premedication and tests apply.','Phesgo or trastuzumab alone generally needs no routine antiemetic prophylaxis. Do not apply this statement automatically to an antibody-drug conjugate.','Pathology, including residual invasive disease, informs the next HER2 medicine and remaining treatment course.','Continue cardiac monitoring on the selected treatment plan; surgery does not restart the clock.'])
 else:
  # Maintenance has a separate active-medicine schedule; preserve the original HER2 clock.
  for lane in j['lanes']:
   if lane['kind']=='blood' and c=='00797':lane['cells'][3]='Phesgo-only maintenance: FBC, renal and liver profile before each 21-day cycle'
 for p in phase['regimens'][c]:p['source_checked']='2026-10-21'
 k=copy.deepcopy(profiles[d['protocol_id']]);k.update(full_suite_release='0.84.15',source_checked_date='2026-10-21')
 k['monitoring_and_toxicity']['longitudinal_schedule']=copy.deepcopy(d['monitoring_schedule'])
 k['supportive_care']['patient_education']=[s['text'] for s in d['support']]
 if c in ['00789','00790']:k['key_points'].append('First routine 12-week echo occurs during neoadjuvant treatment, around cycle 5 if uninterrupted. After surgery, monitoring and supportive medicines follow the selected adjuvant regimen.')
 k.update(copy.deepcopy(evidence[c]))
 k['evidence_audit']=dict(status='Primary sources reconciled; independent clinical/pharmacy review pending',checked='2026-10-21',indications_reviewed=[k['treatment_rationale']['setting']],coverage_summary=k['evidence_at_a_glance']['applicability'],remaining_uncertainties=[k['treatment_rationale']['limitations'],'Irish access and local sequencing require separate verification.'])
 new.append(k);write(f'data/patient-knowledge/{c}.json',d)
write('data/breast-treatment-journeys-v0837.json',journeys)
write('data/phase-support-v0838.json',phase)
write('data/regimen-knowledge-base-v08415-addendum.json',dict(schema_version='1.0',release='0.84.15',source_checked_date='2026-10-21',governance='Five retrospective Phesgo suites; independent oncology/pharmacy approval pending. Numerical efficacy is clinician-only.',regimen_profiles=new,evidence_records=[],drug_profiles=[]))
print('Five Phesgo retrospective patient, monitoring and clinician profiles prepared.')
