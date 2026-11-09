"""Scoped patient / KB / support proposals for root integration; preserve detailed anatomy."""
import copy,json,pathlib,re
B=pathlib.Path(__file__).resolve().parent; R=B.parents[2]; O=B/'content-proposals';O.mkdir(exist_ok=True)
codes=['00207','00328','00733','00456']; originals={}; patients={}; changes=[]
obs_patient='Premedicines and monitoring add time to every cetuximab visit. Your team will confirm the observation period before you leave; do not assume that later visits can omit observation.'
obs_clinical='NCCP p1 permits cessation of observation after two tolerated cetuximab doses, whereas Erbitux SmPC section 4.2 requires monitoring during and for at least one hour after each infusion. Reconcile and document the local observation plan; do not promise early discharge.'
clinical={
 '00207':['This colorectal context requires EGFR-expressing, validated extended RAS-wild-type metastatic disease after failure of oxaliplatin- and irinotecan-based therapy AND intolerance to irinotecan.','Previous grade 3–4 cetuximab infusion reactions remain a contraindication after symptoms recover. Skin restart requires episode count, recovery interval and actual prior maintenance dose; do not re-escalate.',obs_clinical],
 '00328':['Folinic acid follows the bolus 5-FU hold/omission for complete or unconfirmed DPD status, 5-FU cardiotoxicity, hepatic contraindication and contraindicated DPD-inhibitor exposure. Folinic acid is not a standalone substitute.','5-FU bilirubin >85 µmol/L or absolute AST >180 is contraindicated; exact equality is a source gap requiring review. The AST table does not print units: verify analyte/unit rather than entering ALT or an ULN ratio.','Irinotecan bilirubin >3×ULN is contraindicated. Renal impairment and UGT1A1 poor-metaboliser status, including homozygous *6 or *28, require individual review; do not import a numerical reduction from another regimen.','Reconcile brivudin/sorivudin/analogue current or recent exposure before 5-FU; the tool does not infer a safe washout interval.',obs_clinical],
 '00733':['Prior grade 4 oxaliplatin neuropathy excludes the source rechallenge pathway even after recovery. Good recovery from grade 3 allows only specialist consideration, one level below the dose at onset, with previous dose history confirmed.','Folinic acid follows bolus 5-FU hold/omission. Bilirubin >85 µmol/L or absolute AST >180 contraindicates 5-FU; equality and uncertain AST unit/analyte require review.','CrCl <30 or haemodialysis permits consideration of 50% original oxaliplatin in this source; it is not an automatic prescription. Do not substitute a different FOLFOX regimen renal policy.','NCCP 00733 p9 retains an unlicensed-posology consent footnote. The current Erbitux SmPC section 4.2 now explicitly includes 500 mg/m² every two weeks for RAS-wild-type colorectal disease. Reconcile current local licensing/consent status; do not present the older footnote as an unquestioned current restriction or silently delete it.',obs_clinical],
 '00456':['Direct PDF rendering confirms full-dose etoposide count criteria ANC ≥1.5 AND platelets ≥100. Underlines are separate PDF drawing objects, so plain text incorrectly reads >. Decimal gaps (1.49,1.5) and (99,100) remain review; exact 1.5/100 are not gaps.','NCCP reduced count rows still require reconciliation with the etoposide SmPC. Count rows apply to etoposide and do not clear cisplatin independently.','After grade 3 non-haematological toxicity (excluding mucositis/alopecia), wait for recovery to grade 1 or less; the source 75% restart requires dose-history and denominator review. Grade 4 is outside that source row.','After grade ≥2 neuropathy recovers to ≤1, a consultant chooses carboplatin AUC5 substitution or 50% cisplatin. Do not restore full-dose cisplatin automatically or substitute the separate AUC3 regimen.']}

def walk(x,fn):
 if isinstance(x,dict):return {k:walk(v,fn) for k,v in x.items()}
 if isinstance(x,list):return [walk(v,fn) for v in x]
 return fn(x) if isinstance(x,str) else x

def clean_crc(s):
 replacements={
  'CO.17 KRAS subgroup; Bonner radiotherapy trial':'CO.17 KRAS subgroup',
  'Selected metastatic colorectal cancer; or locally advanced head/neck cancer with radiotherapy when platinum is unsuitable':'EGFR-expressing RAS wild-type metastatic colorectal cancer after the specified previous therapies',
  'Previously treated KRAS wild-type metastatic CRC; separate locally advanced squamous head/neck population.':'Previously treated KRAS wild-type metastatic colorectal cancer.',
  'Cetuximab plus supportive care versus supportive care; separate cetuximab plus RT versus RT.':'Cetuximab plus supportive care versus supportive care.',
  'Advanced colorectal disease or curative head/neck radiotherapy':'Advanced colorectal disease',
  'CRC monotherapy after the specified previous treatments; separate locally advanced head/neck indication':'Colorectal monotherapy after the specified previous treatments',
  'Rash, infusion reactions and electrolyte loss matter; radiation adds its own local adverse effects.':'Rash, infusion reactions and electrolyte loss matter.',
  'Cetuximab weekly; radiotherapy dates only if prescribed.':'Cetuximab once every 7 days; ongoing treatment review.',
 }
 if s in replacements:return replacements[s]
 # Remove only explicitly HN/RT sentences from the GI context, retaining all GI/skin material.
 if any(w in s.lower() for w in ['head-and-neck','head/neck','head and neck','bonner','radiation','radiotherapy']):
  parts=re.split(r'(?<=[.!?])\s+',s)
  kept=[a for a in parts if not any(w in a.lower() for w in ['head-and-neck','head/neck','head and neck','bonner','radiation','radiotherapy'])]
  return ' '.join(kept)
 return s

for c in codes:
 src=R/'data/patient-knowledge'/f'{c}.json';d=json.loads(src.read_text());originals[c]=copy.deepcopy(d)
 d['content_version']='0.84.45';d['document_revision']='0.84.45';d['source_checked']='2026-11-07'
 d['clinical_audit_release']='0.84.45';d['patient_summary']['template_version']='0.84.45'
 # Existing suite creation milestone retained; this is a retrospective content revision.
 if c=='00207':
  (O/'00207-relocated-hn-content.json').write_text(json.dumps({'note':'Original mixed content retained for comparison; HN content now belongs to the separately authored head_neck context.','original':d},indent=2,ensure_ascii=False)+'\n')
  d=walk(d,clean_crc)
  d['sources']=[s for s in d['sources'] if s['id'] not in ['hntrial','bonner','']]
  d['questions']=[q for q in d['questions'] if q.get('q')!='What about radiotherapy?']
  for ch in d['chapters']:
   ch['items']=[i for i in ch['items'] if i.get('title') and i.get('title') not in ['Separate head-and-neck evidence','Radiotherapy relationship','Head-and-neck radiation support'] and i.get('text')]
  d['chapters']=[ch for ch in d['chapters'] if ch.get('items')]
  d['purpose']='To control EGFR-expressing RAS wild-type bowel cancer that has spread after oxaliplatin- and irinotecan-based treatments have failed and irinotecan cannot be tolerated.'
  d['schedule_summary']='One larger first infusion, then cetuximab once every 7 days while treatment is helping and side effects remain acceptable. This is cetuximab alone, with no home chemotherapy pump.'
  d['patient_summary']['purpose']=d['purpose'];d['patient_summary']['schedule']=d['schedule_summary']
  d['patient_summary']['card_title']='Weekly cetuximab — bowel cancer'
  d['questions']=[q for q in d['questions'] if q.get('a')]
  d['monitoring_summary']='Before starting and regularly during treatment: blood count, kidney and liver tests; confirm RAS, EGFR and previous treatment suitability. Review skin, nails, eyes, breathing and mineral levels. '+obs_patient+' Monthly electrolytes, magnesium and calcium for two months after the last cetuximab. Scans and recovery checks follow the consultant plan.'
  d['logistics']['steps'][3]['text']='The first cetuximab infusion is usually about two hours and later weekly infusions about one hour. '+obs_patient
  for row in d['support']:
   row['text']=row['text'].replace('First two doses require post-infusion observation; delayed-reaction education.',obs_patient+' Report delayed reaction symptoms urgently.')
  d['anatomy']=copy.deepcopy(originals[c]['anatomy'])
 if c in ['00207','00328','00733']:
  # Patient text gives an actionable visit plan; the precise documentary discrepancy stays in clinician material.
  d['logistics'].setdefault('details',[]).append({'title':'Observation at every antibody visit','text':obs_patient})
  d['consent_support']+=' Discuss severe or delayed infusion reactions and the agreed observation plan; a previous severe cetuximab reaction must be reported even after recovery.'
  d['support'].append({'title':'Previous infusion reactions','text':'Tell the team about any previous severe antibody reaction, even if you feel well now. Premedication does not remove all reaction risk. Report breathing problems, swelling, faintness or rapidly worsening symptoms immediately.','source_ids':['nccp','smpc']})
 if c in ['00328','00733']:
  d['support'].append({'title':'Medicines that can change fluorouracil safety','text':'Show the team every prescribed medicine, over-the-counter treatment and supplement before treatment. Tell them specifically about recent antiviral treatment such as brivudine or sorivudine. The pharmacist must check combinations and timing before fluorouracil. Do not stop or restart treatment yourself.','source_ids':['nccp']})
  d['consent_support']+=' Explain that folinic acid supports fluorouracil and follows its bolus hold/omission plan; DPD testing, heart symptoms and current/recent interacting medicines can change whether fluorouracil is given.'
  d['questions'].append({'q':'If one medicine is held, do the other medicines continue?','a':'Only the treating team can decide. Folinic acid is linked to the fluorouracil bolus. A held medicine does not automatically cancel all clinic visits, blood tests, pump care or skin-care treatment. Ask for the revised written plan.','source_ids':['nccp']})
 if c=='00328':
  d['consent_support']+=' Discuss how previous severe diarrhoea, low blood counts, bilirubin and known UGT1A1 results may change irinotecan dosing and monitoring.'
 if c=='00733':
  d['support'].append({'title':'Nerve symptoms after a dose is held','text':'Tell the team about the worst numbness, tingling or functional difficulty you have had, even if it has improved. Recovery does not automatically make restarting oxaliplatin safe. The team reviews the previous severity and dose before deciding whether it can be used again.','source_ids':['nccp']})
  d['consent_support']+=' Discuss potentially persistent nerve damage, the effect of previous severe neuropathy on future oxaliplatin, and cold-triggered symptoms; improvement does not automatically permit rechallenge.'
  d['consent_support']+=' The clinical team should reconcile the NCCP unlicensed-posology footnote with the current product information and document any applicable local consent requirements.'
 if c=='00456':
  d['support'].append({'title':'Recovery before the next dose','text':'Tell the team how severe symptoms were at their worst and what remains now, especially tingling, hearing change or difficulties with daily activities. Feeling better or reaching a planned date does not approve the next dose. The oncology team may delay, reduce or change a medicine while coordinating radiotherapy.','source_ids':['nccp']})
  d['consent_support']+=' Discuss that recovery from severe side effects may require reduced doses or a change of platinum medicine; the actual previous dose and radiation plan must be reviewed together.'
 patients[c]=d
 (O/f'{c}-patient.json').write_text(json.dumps(d,indent=2,ensure_ascii=False)+'\n')
 assert d['anatomy']==originals[c]['anatomy'],c+' anatomy changed'

kb={'schema_version':1,'release':'0.84.45','source_checked_date':'2026-11-07','governance':'Source mapped; independent clinical, oncology-pharmacy and patient/PPI review pending','regimen_profiles':[],'drug_profiles':[],'evidence_records':[]}
for c,tag in [('00207','08434'),('00328','08434'),('00733','08435'),('00456','08430')]:
 old=json.loads((R/'data'/f'regimen-knowledge-base-v{tag}-addendum.json').read_text());p=copy.deepcopy(next(p for p in old['regimen_profiles'] if c in p['protocol_id']))
 if c=='00207':
  p=walk(p,clean_crc)
  p['regimen_role']=patients[c]['context_label'];p['clinical_summary']=patients[c]['purpose'];p['schedule_context']=patients[c]['schedule_summary']
  p['evidence_at_a_glance']['endpoints']=[e for e in p['evidence_at_a_glance']['endpoints'] if 'CO.17' in e.get('metric','')]
  p['reference_links']=[x for x in p['reference_links'] if x.get('label')]
  p['evidence_at_a_glance']['sources']=[x for x in p['evidence_at_a_glance']['sources'] if x.get('label')]
  def no_empty(x):
   if isinstance(x,list):return [no_empty(v) for v in x if v!='']
   if isinstance(x,dict):return {k:no_empty(v) for k,v in x.items()}
   return x
  p=no_empty(p)
 if c=='00456':
  p=walk(p,lambda s:s.replace('Both sources have gaps at exact blood-count boundaries; dose decisions require review.',clinical[c][0]))
 p['clinical_audit_release']='0.84.45';p['source_checked_date']='2026-11-07'
 p['key_points'].extend(clinical[c]);p['patient_selection']['important_cautions'].extend(clinical[c])
 p['administration'].setdefault('observation_and_access',[]).extend([obs_clinical] if c!='00456' else [])
 p['monitoring_and_toxicity'].setdefault('ongoing',[]).extend([x['text'] for x in patients[c]['support'][-2:]])
 p['source_audit_record']='validation/head-neck-v08445/cetux-chemo/source-retrieval.json'
 kb['regimen_profiles'].append(p)
(O/'knowledge-base-profiles.json').write_text(json.dumps(kb,indent=2,ensure_ascii=False)+'\n')

support=json.loads((R/'data/phase-support-v0838.json').read_text());out={'release':'0.84.45','source_checked':'2026-11-07','regimens':{}}
for c in codes:
 plans=copy.deepcopy(support['regimens'][c])
 for plan in plans:
  if c=='00207':plan=walk(plan,clean_crc);plan['additional_support']=[s for s in plan['additional_support'] if s]
  plan['source_checked']='2026-11-07'
  plan.setdefault('additional_support',[]).extend(clinical[c][-1:] if c!='00456' else clinical[c][1:])
  if c in ['00328','00733']:plan['additional_support'].append('Folinic acid follows the bolus 5-FU hold/omission. Reconcile DPD inhibitors, DPD status and suspected fluoropyrimidine cardiotoxicity before administration.')
  out['regimens'].setdefault(c,[]).append(plan)
(O/'phase-support-entries.json').write_text(json.dumps(out,indent=2,ensure_ascii=False)+'\n')
(O/'consent-additions.json').write_text(json.dumps({c:{'patient_consent_support':patients[c]['consent_support'],'clinician_review_points':clinical[c]} for c in codes},indent=2,ensure_ascii=False)+'\n')
report={'patient_anatomy_unchanged':{c:patients[c]['anatomy']==originals[c]['anatomy'] for c in codes},'patient_anatomy_counts':{c:len(patients[c]['anatomy']) for c in codes},'note':'Do not overwrite shared files wholesale: merge KB profiles by protocol_id and support entries by regimen code. Preserve all unrelated entries. Original mixed HN content retained separately and moves to new HN context.'}
(O/'retention-report.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
