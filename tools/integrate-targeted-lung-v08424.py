"""Connect reviewed v0.84.24 content without changing other patient bundles."""
from pathlib import Path
import json,re,copy,qrcode
R=Path(__file__).resolve().parents[1];V='0.84.24';DATE='2026-10-29'
def read(p):return json.loads((R/p).read_text())
def save(p,d):(R/p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
idx=read('data/targeted-lung-v08424-source-index.json');C=read('data/targeted-lung-v08424-authoring.json')['regimens']
p=R/'js/patient-asset-registry-v0810.js';s=p.read_text()
for c in idx['codes']:
 d=read(f'data/patient-knowledge/{c}.json');entry=json.dumps(dict(title=d['title'],guide=True,passport=True,sactCard=True,knowledge=True,consentDraft=True,supportiveCare=True,phaseSupport=True,longitudinal=True),ensure_ascii=False)
 if c in []:
  entry=json.dumps(dict(json.loads(entry),scopeGuard=True,scope='Lung NSCLC only; distinguish advanced and adjuvant treatment'),ensure_ascii=False)
 if c=='00831':entry=json.dumps(dict(json.loads(entry),contactCard=True),ensure_ascii=False)
 pattern=r"    '"+c+r"':\{[^\n]*\},?"
 if re.search(pattern,s):s=re.sub(pattern,"    '"+c+"':"+entry+",",s)
 else:s=s.replace("    '00790':","    '"+c+"':"+entry+",\n    '00790':")
 if c in idx['new_codes'] or not (R/'patient'/c/'qr.png').exists():
  out=R/'patient'/c;out.mkdir(parents=True,exist_ok=True);qrcode.make(f'https://sactcheck.com/patient/{c}/'+('scope.html' if c in [] else '')).save(out/'qr.png')
s=s.replace("const RELEASE='0.84.23'","const RELEASE='0.84.24'").replace("const CONTENT_RELEASE='0.84.23'","const CONTENT_RELEASE='0.84.24'");p.write_text(s)
p=R/'js/regimen-knowledge-base.js';s=p.read_text()
if 'data/regimen-knowledge-base-v08424-addendum.json' not in s:s=s.replace('"data/regimen-knowledge-base-v08423-addendum.json"]','"data/regimen-knowledge-base-v08423-addendum.json", "data/regimen-knowledge-base-v08424-addendum.json"]')
p.write_text(s)
risk=read('data/emetogenic-risk-map.json');sustain=read('data/sustainability-regimen-metadata-v0691.json')
for c,x in C.items():
 f=next((R/'protocols').glob('*/'+c+'-*'));p=json.loads(f.read_text());m=p['metadata'];d=read(f'data/patient-knowledge/{c}.json')
 m.update(full_suite_release=V,sactcheck_encoding_version=V,source_checked_date=DATE,schedule_summary=d['schedule_summary'])
 m.update(x.get('protocol_metadata',{}))
 if c in idx['new_codes']:m['source_schedule_interval_label']='Continuous daily'
 m['source_supplements']=[dict(label=z['title'],url=z['url'],basis='Audited product information supplement; NCCP differences remain explicit') for z in d['sources'] if 'smpc' in z['id'].lower() or 'product information' in z['title'].lower()]
 if m.get('source_pdf_sha256'):m.setdefault('validation',{})['source_document_checked']=True
 m.setdefault('validation',{})['rule_level_source_reconciliation_status']='source_reconciled_v08424_independent_review_pending'
 m.setdefault('encoding_maturity',{})['level']='source_reconciled_pending_independent_review'
 # Normalise display casing while retaining source_title_exact and source citations.
 for key in ['title','short_title']:
  if isinstance(m.get(key),str):
   for source,display in [('CARBOplatin','Carboplatin'),('CISplatin','Cisplatin'),('PEMEtrexed','Pemetrexed'),('Atezolizumab','Atezolizumab'),('bevacizumab','bevacizumab')]:m[key]=m[key].replace(source,display)
 if isinstance(p.get('treatment',{}).get('schedule_summary'),str):
  for source,display in [('CARBOplatin','Carboplatin'),('CISplatin','Cisplatin'),('PEMEtrexed','Pemetrexed'),('Atezolizumab','Atezolizumab'),('bevacizumab','bevacizumab')]:p['treatment']['schedule_summary']=p['treatment']['schedule_summary'].replace(source,display)
 if c in ['00689','00908']:
  absolute='bilirubin_micromol_l' if c=='00689' else 'bilirubin_umol_l'
  p['input_definitions']['bilirubin_uln_multiple']['derived_actual_field']=absolute
  p['input_definitions'][absolute]['ui_derived_from']='bilirubin_uln_multiple'
 for definition in p['input_definitions'].values():
  definition.setdefault('input_role','decision')
  if definition.get('demo_value') is None:definition['demo_value']=''
  if definition.get('source_grading_note'):
   definition.setdefault('assessment_guidance',definition['source_grading_note'])
  renal=definition.get('renal_input',{})
  if renal.get('mode')=='source_threshold_numeric':
   renal['exact_value_required']=False
   renal.setdefault('source_url',m['source_url'])
   renal.setdefault('reason','The NCCP medicine-specific renal table uses numeric thresholds. Preserve its exact boundary; this field does not perform carboplatin Calvert dosing.')
 m.setdefault('encoding_maturity',{}).update(source_reconciled=True,reconciled_release=V,reconciled_date=DATE,consultant_reviewed=False,oncology_pharmacy_reviewed=False,clinical_use_authorised=False)
 risk['protocols'][c]=copy.deepcopy(x['risk'])
 if x.get('risk_scripts'):risk['scripts'].update(x['risk_scripts'])
 sup=p.setdefault('supportive_care',{});sup.update(emetogenic_risk=x['risk']['level'],script_id=x['risk']['script_id'],phase_specific_plan=f'patient/{c}/supportive-care.html',source_url=m['source_url'],mapping_basis=x['risk']['mapping_basis']);sup.pop('display_status',None)
 if x['risk'].get('phase_profiles'):sup['phase_profiles']=copy.deepcopy(x['risk']['phase_profiles'])
 sup.update(mapping_source_url=m['source_url'],validation_status='source_reconciled_pending_independent_clinical_and_pharmacy_review',supportive_medications_pdf_url=risk['scripts'].get(x['risk']['script_id'],{}).get('url','https://healthservice.hse.ie/documents/7180/Supportive_Care_Antiemetics_for_inclusion_NCIS_Medical_Oncology.pdf'))
 save(str(f.relative_to(R)),p)
 def val(v,status='source_verified'):return dict(status=status,value=v,source=f'NCCP {c} v{m["nccp_version"]}; checked {DATE}; '+m['source_url'])
 sustain['profiles'][p['protocol_id']]=dict(route_classification=val('oral_only' if x['route'] in ['oral','oral_only'] else 'mixed_oral_parenteral' if x['route'] in ['oral_plus_injection','mixed_oral_iv','oral + IV or locally approved SC','intravenous_with_explicit_oral_alternative','intravenous_with_explicit_subcutaneous_or_oral_alternatives'] else 'parenteral_only'),administration_frequency=val(d['schedule_summary']),ambulatory_pump=val(bool(d.get('port_pump'))),administration_time=val('The unit confirms complete appointment duration. No environmental saving is measured.','not_estimated'),planned_treatment_encounters=val(None,'evidence_required'),travel_model_inputs=val(None,'not_encoded'))
risk['content_update_release']=V;save('data/emetogenic-risk-map.json',risk);save('data/sustainability-regimen-metadata-v0691.json',sustain)
# Medicine-specific consent profiles are source-audited with each proposal.
consent=read('data/consent-content-v0710.json')
for group in ['osimertinib','alectinib','brigatinib','lorlatinib','crizotinib','legacy']:
 for profile in (R/'validation/targeted-lung-v08424'/group/'proposed').glob('*-consent-profile.json'):
  key=profile.name.removesuffix('-consent-profile.json')
  consent['agent_profiles'][key]=json.loads(profile.read_text())
consent['agent_profiles'].update(read('validation/targeted-lung-v08424/legacy/consent-profile-updates.json')['agent_profiles'])
consent['content_update_release']=V
save('data/consent-content-v0710.json',consent)
for name in ['index.html','404.html','about.html','js/sactcheck-release.js']:
 p=R/name;s=p.read_text().replace('0.84.23',V)
 if name=='404.html':
  for c in idx['new_codes']:
   if c not in s:s=s.replace('00262|',c+'|00262|')
 p.write_text(s)
d=read('data/app-release.json')
for k in ['release','content_release','version','knowledge_content_release']:d[k]=V
d.update(display_version='v'+V,release_date=DATE,summary='Seven full service suites: five targeted lung therapies, trifluridine/tipiracil and atezolizumab/bevacizumab HCC. Source-specific safety rules, indication-aware evidence, continuous oral timelines, supportive plans and monitoring. Feasibility build; independent clinical review pending.')
save('data/app-release.json',d)
for name in ['package.json','package-lock.json']:
 if not (R/name).exists():continue
 d=read(name);d['version']=V
 if 'packages' in d and '' in d['packages']:d['packages']['']['version']=V
 save(name,d)
print('Connected seven v0.84.24 suites, active support mappings, registry routes and release metadata.')
