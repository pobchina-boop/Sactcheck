"""Keep the assessment summary aligned with the ten reviewed phase-specific drafts."""
from pathlib import Path
import json
R=Path(__file__).resolve().parents[1]
def read(p):return json.loads((R/p).read_text())
def write(p,d):(R/p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
d=read('data/emetogenic-risk-map.json');url=d['source']['medical_oncology_antiemetic_guidance_url']
profiles={
'high':('ac','NCCP V8 Medical Oncology Table 1, anthracycline/cyclophosphamide row: NK1 antagonist, 5-HT3 antagonist, dexamethasone on Day 1 and olanzapine. Use the regimen-specific supportive-care draft for doses and pharmacy review.','The dedicated AC row continues aprepitant on Days 2–3 and olanzapine on Days 2–4, with no routine dexamethasone on Days 2–4. Reconcile breakthrough treatment and avoid unintended duplicate steroids.'),
'moderate':('docetaxel-moderate','NCCP V8 moderate emetogenic-risk guidance applies. Reconcile the antiemetic steroid with the docetaxel premedication course; do not add two separate dexamethasone prescriptions.','Follow the prescribed docetaxel steroid schedule and the reviewed regimen-specific draft. Confirm subsequent antiemetics and patient-specific risks with oncology pharmacy.'),
'low':('paclitaxel','Low emetogenic risk during the paclitaxel phase. Use the separate taxane supportive-care draft, including the protocol hypersensitivity premedication; do not carry the AC antiemetic course into this phase.','No routine multi-day AC antiemetic course. Adjust for symptoms and the current NCCP guidance/local policy.'),
'minimal':('trastuzumab','Trastuzumab-only continuation has minimal emetogenic risk. No routine chemotherapy antiemetic course; manage previous infusion reactions or symptoms individually.','No routine AC or taxane antiemetic course during trastuzumab-only continuation.')}
ids={}
for level,(slug,summary,days) in profiles.items():
 sid='nccp-v8-'+slug+'-v08417';ids[level]=sid
 d['scripts'][sid]=dict(label='NCCP V8 antiemetic guidance — reviewed regimen/phase',risk_level=level,url=url,source_url=url,status='national_guidance_link',summary=summary,subsequent_days=days)
for code in read('data/anthracycline-v08417-source-index.json')['codes']:
 p=next((R/'protocols/breast').glob(code+'-*.json'));q=json.loads(p.read_text());s=q['supportive_care'];s['source_url']=q['metadata']['source_url'];level=s['emetogenic_risk'];s['mapping_source']='NCCP regimen, emetogenic classification and V8 Medical Oncology antiemetic medicines; reviewed 2026-10-23'
 if level!='phase_dependent':
  s['script_id']=ids[level];s.pop('phase_profiles',None);d['protocols'][code].pop('phase_profiles',None)
 for x in s.get('phase_profiles',{}).values():x['script_id']=ids[x['level']]
 if code=='00250':s['mapping_basis']='TC: moderate emetogenic risk; reconcile docetaxel steroid premedication.'
 elif code=='00252':s['mapping_basis']='AC: high emetogenic risk; use the dedicated anthracycline/cyclophosphamide row.'
 elif code in ['00260','00278']:s['mapping_basis']='AC: high; subsequent paclitaxel: low. Select the active phase and use its separate supportive-care plan.'
 elif code=='00432':s['mapping_basis']='AC: high; paclitaxel/trastuzumab: low; trastuzumab-only continuation: minimal. Select the active phase.'
 p.write_text(json.dumps(q,ensure_ascii=False,indent=2)+'\n')
 d['protocols'][code].update(script_id=s.get('script_id'),mapping_basis=s['mapping_basis'])
 if s.get('phase_profiles'):d['protocols'][code]['phase_profiles']=s['phase_profiles']
write('data/emetogenic-risk-map.json',d)
