"""Connect reviewed v0.84.21 content without changing other patient bundles."""
from pathlib import Path
import json,re,copy,qrcode
R=Path(__file__).resolve().parents[1];V='0.84.21';DATE='2026-10-25'
def read(p):return json.loads((R/p).read_text())
def save(p,d):(R/p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
idx=read('data/breast-completion-v08421-source-index.json');C=read('data/breast-completion-v08421-authoring.json')['regimens']
p=R/'js/patient-asset-registry-v0810.js';s=p.read_text()
for c in idx['codes']:
 d=read(f'data/patient-knowledge/{c}.json');entry=json.dumps(dict(title=d['title'],guide=True,passport=True,sactCard=True,knowledge=True,consentDraft=True,supportiveCare=True,phaseSupport=True,longitudinal=True),ensure_ascii=False)
 if c=='00588':
  entry=json.dumps(dict(json.loads(entry),scopeGuard=True,scope='Breast adjuvant 00588h only'),ensure_ascii=False)
 pattern=r"    '"+c+r"':\{[^\n]*\},?"
 if re.search(pattern,s):s=re.sub(pattern,"    '"+c+"':"+entry+",",s)
 else:s=s.replace("    '00790':","    '"+c+"':"+entry+",\n    '00790':")
 if c in idx['new_codes'] or not (R/'patient'/c/'qr.png').exists():
  out=R/'patient'/c;out.mkdir(parents=True,exist_ok=True);qrcode.make(f'https://sactcheck.com/patient/{c}/').save(out/'qr.png')
s=s.replace("const RELEASE='0.84.20'","const RELEASE='0.84.21'").replace("const CONTENT_RELEASE='0.84.20'","const CONTENT_RELEASE='0.84.21'");p.write_text(s)
p=R/'js/regimen-knowledge-base.js';s=p.read_text()
if 'data/regimen-knowledge-base-v08421-addendum.json' not in s:s=s.replace('"data/regimen-knowledge-base-v08420-addendum.json"]','"data/regimen-knowledge-base-v08420-addendum.json", "data/regimen-knowledge-base-v08421-addendum.json"]')
p.write_text(s)
risk=read('data/emetogenic-risk-map.json');sustain=read('data/sustainability-regimen-metadata-v0691.json')
for c,x in C.items():
 f=next((R/'protocols').glob('*/'+c+'-*'));p=json.loads(f.read_text());m=p['metadata'];d=read(f'data/patient-knowledge/{c}.json')
 m.update(full_suite_release=V,sactcheck_encoding_version=V,source_checked_date=DATE,schedule_summary=d['schedule_summary'])
 m.update(x.get('protocol_metadata',{}))
 m.setdefault('encoding_maturity',{}).update(source_reconciled=True,reconciled_release=V,reconciled_date=DATE,consultant_reviewed=False,oncology_pharmacy_reviewed=False,clinical_use_authorised=False)
 risk['protocols'][c]=copy.deepcopy(x['risk'])
 if x.get('risk_scripts'):risk['scripts'].update(x['risk_scripts'])
 sup=p.setdefault('supportive_care',{});sup.update(emetogenic_risk=x['risk']['level'],script_id=x['risk']['script_id'],phase_specific_plan=f'patient/{c}/supportive-care.html',source_url=m['source_url'],mapping_basis=x['risk']['mapping_basis']);sup.pop('display_status',None)
 if x['risk'].get('phase_profiles'):sup['phase_profiles']=copy.deepcopy(x['risk']['phase_profiles'])
 sup.update(mapping_source_url=m['source_url'],validation_status='source_reconciled_pending_independent_clinical_and_pharmacy_review',supportive_medications_pdf_url=risk['scripts'].get(x['risk']['script_id'],{}).get('url','https://healthservice.hse.ie/documents/7180/Supportive_Care_Antiemetics_for_inclusion_NCIS_Medical_Oncology.pdf'))
 if c=='00947':
  for phase in p.get('treatment_phases',[]):
   for field in ['label','name','schedule_summary']:
    if field in phase:
     for a,b in [('Cycle1','Cycle 1'),('Cycle2','Cycle 2'),('every28days','every 28 days')]:phase[field]=phase[field].replace(a,b)
   for adm in phase.get('administration',[]):
    for field in ['note','notes']:
     if isinstance(adm.get(field),str):
      for a,b in [('Approximately12hours','Approximately 12 hours'),('reductions320 then200mg','reductions 320 then 200 mg'),('Two5mL','Two 5 mL'),('1–2minutes','1–2 minutes'),('Cycle1','Cycle 1'),('extraDay15','extra Day 15'),('cycle2Day1','cycle 2 Day 1')]:adm[field]=adm[field].replace(a,b)
  p['input_definitions']['crcl']['renal_input'].update(source_url='https://www.ema.europa.eu/en/documents/product-information/truqap-epar-product-information_en.pdf',reason='The audited EMA product defines the severe CrCl threshold; it is a classification input, not a continuous dose calculation.')
 # Named source grading must not silently fall back to unrelated current CTCAE defaults.
 for field,definition in p['input_definitions'].items():
  if c in ['00232','00259'] and field.endswith('_grade'):
   definition.update(grading_source_label='NCCP named toxicity assessment',grading_source_url=m['source_url'],source_grading_note='The NCCP dose table is not a complete grading table and does not name a grading edition. Grade the actual named event under verified local policy; no unverified conversion is made.',assessment_guidance='Use the documented grade of the named toxicity; confirm the grading definition with the treating team before a dose decision.')
  if c=='00947' and field.endswith('_event_peak_grade'):
   definition.update(grading_source_label='NCCP00947 previous-event grade history',grading_source_url=m['source_url'],source_grading_note='This history selector is not a complete grading table. It records a reviewed grade 2–4 event; glucose uses CTCAE v4.03 and other toxicities use v5.0 in this source.',assessment_guidance='Record the peak grade of the event being reviewed, separately from current recovery. Do not infer it from an isolated current result.')
   for option in definition['options']:option['description']='Documented peak grade '+str(option['value'])+' of this event, assigned using the NCCP source-specific toxicity definition; assess current recovery separately.'
 save(str(f.relative_to(R)),p)
 def val(v,status='source_verified'):return dict(status=status,value=v,source=f'NCCP {c} v{m["nccp_version"]}; checked {DATE}; '+m['source_url'])
 sustain['profiles'][p['protocol_id']]=dict(route_classification=val('oral_only' if x['route'] in ['oral','oral_only'] else 'mixed_oral_parenteral' if x['route'] in ['oral_plus_injection','mixed_oral_iv','oral + IV or locally approved SC'] else 'parenteral_only'),administration_frequency=val(d['schedule_summary']),ambulatory_pump=val(bool(d.get('port_pump'))),administration_time=val('The unit confirms complete appointment duration. No environmental saving is measured.','not_estimated'),planned_treatment_encounters=val(None,'evidence_required'),travel_model_inputs=val(None,'not_encoded'))
risk['content_update_release']=V;save('data/emetogenic-risk-map.json',risk);save('data/sustainability-regimen-metadata-v0691.json',sustain)
for name in ['index.html','404.html','about.html','js/sactcheck-release.js']:
 p=R/name;s=p.read_text().replace('0.84.20',V)
 if name=='404.html':
  for c in idx['new_codes']:
   if c not in s:s=s.replace('00262|',c+'|00262|')
 p.write_text(s)
d=read('data/app-release.json')
for k in ['release','content_release','version','knowledge_content_release']:d[k]=V
d.update(display_version='v'+V,release_date=DATE,summary='Complete current breast suite coverage, two new bevacizumab component suites and all 38 remaining authored-suite retrospectives. Audit remediation, phase-specific schedules, monitoring and patient services. Feasibility build; independent clinical review pending.')
save('data/app-release.json',d)
for name in ['package.json','package-lock.json']:
 if not (R/name).exists():continue
 d=read(name);d['version']=V
 if 'packages' in d and '' in d['packages']:d['packages']['']['version']=V
 save(name,d)
print('Connected forty v0.84.21 suites, active support mappings, registry routes and release metadata.')
