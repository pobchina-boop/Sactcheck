"""Bounded retrospective source assets; does not modify canonical source."""
from pathlib import Path
import json,copy,hashlib
R=Path(__file__).resolve().parents[3];H=Path(__file__).resolve().parent
V='0.84.28';DATE='2026-11-02'
def read(p):return json.loads((R/p).read_text())
def save(p,d):p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
A={'release':V,'source_checked':DATE,'clinical_use_authorised':False,'regimens':{}}
retrieval=json.loads((H/'research/retrieval.json').read_text());sources={x['code']:x for x in retrieval}
for filename in ['data/lung-core-v08422-authoring.json','data/lung-next-v08423-authoring.json']:
 for c,x in read(filename)['regimens'].items():
  if c not in ['00317','00318','00271','00280']:continue
  x=copy.deepcopy(x);pfile=next((R/'protocols').glob('*/'+c+'-*'));p=json.loads(pfile.read_text());m=p['metadata']
  # Preserve the approved schema/thresholds; this audit finds no necessary rule change.
  assert m['source_pdf_sha256']==sources[c]['sha256'],(c,'changed source requires review')
  m['full_suite_release']=V;m['source_checked_date']=DATE;m['source_reconciled_date']=DATE
  m['source_retrieval_method']='Official HSE PDF freshly downloaded 2 November 2026; SHA-256 matches the previous source audit. Complete extracted text reviewed; renal/haematological dose tables visually rechecked.'
  m['source_text_snapshot']='validation/lung-backbones-v08428/platinum-retro/research/'+c+'.txt'
  m['source_text_snapshot_sha256']=hashlib.sha256((H/'research'/(c+'.txt')).read_bytes()).hexdigest()
  m['encoding_maturity'].update(audit_release=V,audit_date=DATE,reconciled_release=V,reconciled_date=DATE)
  m['validation']['software_test_release']=V
  x['patient']=read('data/patient-knowledge/'+c+'.json');q=x['patient'];q.update(content_version=V,suite_release=V,source_checked=DATE)
  pem=c in ['00317','00318'];cis=c in ['00317','00280'];metal='cisplatin' if cis else 'carboplatin'
  if pem:
   short='Pemetrexed and '+metal+' are given by drip on Day 1, then repeated every 21 days (3 weeks), if your team confirms it is safe.'
   course='Usually 4–6 cycles for the chemotherapy-only course. Your team confirms the number and the next step. Pemetrexed maintenance, if planned, is a separate phase.'
   scope='This summary covers the two chemotherapy medicines. If nivolumab is part of your treatment before surgery, use the full nivolumab combination plan.'
   links=[{'label':'Nivolumab + pemetrexed + '+metal+' before surgery','url':'/patient/00849/backbone_'+c+'/'},{'label':'Pemetrexed maintenance, if prescribed','url':'/patient/00222/'}]
   prep=['Start folic acid and arrange vitamin B12 before treatment; follow your prescription.','Ask for one clear steroid and anti-sickness schedule; do not add duplicate steroid courses.','Tell your team about hearing problems, numbness, other medicines and any infection.']
   checks=['Blood count, kidney and liver tests before each cycle.','Review symptoms, hearing and nerve changes before treatment.']
   if cis:checks.append('IV fluids and salts are prescribed to help protect your kidneys.')
   q['chapters'][0]['items'][1]['text']=scope+' The nivolumab combination has its own side effects, monitoring and urgent advice; it is not covered by a chemotherapy-only handout. Ask your team to confirm whether the plan is for mesothelioma, advanced non-squamous lung cancer or treatment before surgery.'
  else:
   short=metal.capitalize()+' is given on Day 1. Etoposide is given on Days 1–3. A cycle lasts 21 days (3 weeks); the team checks you before the next cycle.'
   course='Usually 4–6 cycles. Your team may delay, reduce or stop treatment after reviewing your health and response.'
   scope='This summary is for chemotherapy for extensive-stage small-cell lung cancer. Treatment that also includes immunotherapy or radiotherapy needs its own complete plan.'
   links=[]
   prep=['Confirm whether Days 2–3 etoposide will be drips or prescribed capsules.','Ask for a written anti-sickness plan covering every treatment day and the following days.','Bring your medicines list and report hearing problems, numbness or signs of infection.']
   checks=['Blood count, kidney and liver tests before treatment.','Review symptoms, hearing and nerves before each cycle.']
   if cis:checks.append('IV fluids and salts are prescribed to help protect your kidneys.')
   else:checks.append('Your team also arranges weekly blood counts as set out in this regimen.')
   q['chapters'][0]['items'][0]['text']=scope
  q['patient_summary']={
   'purpose':'These two chemotherapy medicines aim to control the cancer. Your team will explain the expected benefit for you.',
   'schedule':short,
   'phases':[
    {'title':'Before starting','text':'Blood tests and a review of your health. '+('Start folic acid and arrange your vitamin B12 injection.' if pem else 'Confirm your three treatment days and whether etoposide is by drip or capsules.')},
    {'title':'Treatment and time at home','text':('Both medicines on Day 1. ' if pem else 'Both medicines on Day 1; etoposide continues on Days 2–3. ')+('Extra IV fluids help protect your kidneys. ' if cis else '')+'Follow your medicines plan at home.'},
    {'title':'Review and next steps','text':course}
   ],
   'preparation':prep,
   'card_schedule':('Day 1 drips; repeat every 3 weeks.' if pem else 'Day 1 platinum; etoposide Days 1–3. Repeat every 3 weeks.'),
   'card_alert':'I am receiving chemotherapy. Infection can be serious even without a fever. Contact my oncology team promptly if I become unwell.'
  }
  q['treatment_scope_notice']=scope
  q['related_treatment_plans']=links
  q['questions'].append({'q':'What should I be able to explain before I leave?','a':'Ask your nurse or doctor to check that you can explain which medicines you are receiving, the treatment days, which medicines to take at home, and which number to ring urgently. Ask for the plan in writing if any part is unclear.'})
  # Keep detailed chronology and full evidence unchanged, so concise handouts do not remove context.
  x['clinical']['key_points'].append('First-visit summary separates the short chemotherapy schedule from conditional maintenance, immunotherapy or radiotherapy plans; confirm the selected treatment context before printing.')
  x['journey']['checked']=DATE;x['journey']['release']=V;x['journey']['has_patient_dates']=False
  x['protocol_metadata']=copy.deepcopy(m)
  save(H/'proposed'/pfile.name,p);A['regimens'][c]=x
save(H/'authoring.json',A)
# Separate inherited source tests retain their scope and exact expectations.
for name,src in [('pem-source-cases.cjs','validation/lung-core-v08422/pem-platinum/source-cases.cjs'),('etop-source-cases.cjs','validation/lung-next-v08423/iv-etop/source-cases.cjs')]:
 s=(R/src).read_text().replace("release:'0.84.22'","release:'0.84.28'").replace("release:'0.84.23'","release:'0.84.28'").replace("date:'2026-10-26'","date:'2026-11-02'")
 prefix='pem' if name.startswith('pem') else 'etop'
 s=s.replace("'integrated-results.json'","'"+prefix+"-integrated-results.json'").replace("'source-results.json'","'"+prefix+"-source-results.json'")
 (H/name).write_text(s)
print('Wrote four proposed protocols and retrospective authoring assets.')
