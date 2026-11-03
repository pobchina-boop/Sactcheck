"""Integrate six independently source-authored service proposals for lung closeout."""
from pathlib import Path
import json,re,copy,qrcode
R=Path(__file__).resolve().parents[1];V='0.84.30';DATE='2026-11-02'
def read(p):return json.loads((R/p).read_text())
def save(p,d):(R/p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
idx=read('data/lung-completion-v08430-source-index.json');C=read('data/lung-completion-v08430-authoring.json')['regimens']
p=R/'js/patient-asset-registry-v0810.js';s=p.read_text()
for c,x in C.items():
 d=read(f'data/patient-knowledge/{c}.json')
 entry=dict(title=d['title'],guide=True,passport=True,sactCard=True,knowledge=True,consentDraft=True,supportiveCare=True,phaseSupport=True,longitudinal=True)
 if c=='00279':entry.update(scopeGuard=True,scope='Reference IV cisplatin/etoposide every21days; confirm any alternative prescription')
 if c=='00214':entry.update(scopeGuard=True,scope='Lung indication only; confirm the prescribed chemotherapy partner')
 if d.get('patient_context_selector'):entry.update(contextOnly=True,patientContexts=list(x['patient_contexts']),scopeGuard=True,scope='Confirm the current prescribed treatment phase')
 encoded=json.dumps(entry,ensure_ascii=False);pattern=r"    '"+c+r"':\{[^\n]*\},?"
 if re.search(pattern,s):s=re.sub(pattern,"    '"+c+"':"+encoded+",",s)
 else:s=s.replace("    '00790':","    '"+c+"':"+encoded+",\n    '00790':")
 out=R/'patient'/c;out.mkdir(parents=True,exist_ok=True)
 qrcode.make(f'https://sactcheck.com/patient/{c}/'+('scope.html' if entry.get('scopeGuard') else '')).save(out/'qr.png')
s=s.replace("const RELEASE='0.84.29'","const RELEASE='0.84.30'").replace("const CONTENT_RELEASE='0.84.29'","const CONTENT_RELEASE='0.84.30'")
s=s.replace("d.code==='00388'?/^schedule_(7d|3d|21d)$/:/^backbone_[0-9]{5}$/","d.code==='00372'?/^(combination|continuation)$/:d.code==='00388'?/^schedule_(7d|3d|21d)$/:/^backbone_[0-9]{5}$/")
p.write_text(s)
p=R/'js/regimen-knowledge-base.js';s=p.read_text()
if 'data/regimen-knowledge-base-v08430-addendum.json' not in s:s=s.replace('"data/regimen-knowledge-base-v08429-addendum.json"]','"data/regimen-knowledge-base-v08429-addendum.json", "data/regimen-knowledge-base-v08430-addendum.json"]')
p.write_text(s)
risk=read('data/emetogenic-risk-map.json');sustain=read('data/sustainability-regimen-metadata-v0691.json')
for c,x in C.items():
 f=next((R/'protocols').glob('*/'+c+'-*'));p=json.loads(f.read_text());m=p['metadata'];d=read(f'data/patient-knowledge/{c}.json')
 m.update(x.get('protocol_metadata',{}));m.update(full_suite_release=V,sactcheck_encoding_version=V,source_checked_date=DATE,schedule_summary=d['schedule_summary'])
 m['source_supplements']=[dict(label=z.get('title',z.get('label')),url=z['url'],basis='Audited companion regimen or product information; NCCP differences remain explicit') for z in {z['url']:z for q in [x]+list(x.get('patient_contexts',{}).values()) for z in q['patient']['sources']}.values() if z['id'].startswith('companion') or 'smpc' in z['id'].lower() or 'product information' in z.get('title',z.get('label','')).lower()]
 validation=m.setdefault('validation',{});validation.update(source_document_checked=bool(m.get('source_pdf_sha256')),rule_level_source_reconciliation_status='source_reconciled_v08430_independent_review_pending',consultant_reviewed=False,oncology_pharmacy_reviewed=False,clinical_use_authorised=False)
 m.setdefault('encoding_maturity',{}).update(level='source_reconciled_pending_independent_review',source_reconciled=True,reconciled_release=V,reconciled_date=DATE,consultant_reviewed=False,oncology_pharmacy_reviewed=False,clinical_use_authorised=False)
 if c=='00309':p['input_definitions']['isotope_creatinine_percent']['renal_input']=dict(mode='source_threshold_numeric',exact_value_required=False,source_url=m['source_url'],reason='Compare current serum creatinine with its value at isotope GFR measurement; the exact source110% boundary is preserved. This is not a Calvert dose input.')
 for definition in p['input_definitions'].values():
  definition.setdefault('input_role','decision')
  if definition.get('demo_value') is None:definition['demo_value']=''
  if definition.get('grading_source_label'):definition.setdefault('grading_source_url',m['source_url'])
  if definition.get('source_grading_note'):definition.setdefault('assessment_guidance',definition['source_grading_note'])
  renal=definition.get('renal_input',{})
  if renal.get('mode')=='source_threshold_numeric':
   renal.update(exact_value_required=False);renal.setdefault('source_url',m['source_url']);renal.setdefault('reason','Use the verified numeric result to preserve the source boundaries. This field does not calculate a carboplatin dose.')
 if c=='00372':
  p['input_definitions']['treatment_day']=dict(label='Combination treatment day (continuation has no planned Day1 omission)',type='select',required=False,demo_value='',input_role='context',ui_section='treatment_context',always_show=True,options=[dict(value='day1',label='Docetaxel day'),dict(value='days2_21',label='Nintedanib-only days in combination')])
  x['risk']['phase_profiles']['combination_oral']=dict(level='oral_minimal_low',script_id='nccp-oral-minimal-low')
  p.setdefault('supportive_care',{})['phase_day_profiles']={'combination':{'day1':'combination','days2_21':'combination_oral'}}
 if c=='00279':
  x['risk']['phase_profiles'].update(iv_only=dict(level='low',script_id='nccp-parenteral-low'),oral_only=dict(level='oral_minimal_low',script_id='nccp-oral-minimal-low'),split_platinum=dict(level='high',script_id='nccp-v8-high-v08420'))
  support=p.setdefault('supportive_care',{});support['schedule_context_input']='schedule_variant';support['schedule_day_profiles']={}
  for interval in [21,28]:
   for variant in ['iv','mixed','split_iv','split_mixed','carbo_iv','carbo_mixed']:
    later='split_platinum' if variant.startswith('split_') else 'oral_only' if 'mixed' in variant else 'iv_only'
    support['schedule_day_profiles'][variant+'_'+str(interval)]={'day1':'carboplatin_substitution' if variant.startswith('carbo_') else 'cis_day1','day2':later,'day3':later}
 risk['protocols'][c]=copy.deepcopy(x['risk'])
 if x.get('risk_scripts'):risk['scripts'].update(x['risk_scripts'])
 sup=p.setdefault('supportive_care',{});sup.update(emetogenic_risk=x['risk']['level'],script_id=x['risk']['script_id'],phase_specific_plan=f'patient/{c}/scope.html?asset=supportive-care-selector' if d.get('patient_context_selector') else f'patient/{c}/supportive-care.html',source_url=m['source_url'],mapping_source_url=m['source_url'],mapping_basis=x['risk']['mapping_basis'],validation_status='source_reconciled_pending_independent_clinical_and_pharmacy_review',supportive_medications_pdf_url=risk['scripts'].get(x['risk']['script_id'],{}).get('url','https://healthservice.hse.ie/documents/7180/Supportive_Care_Antiemetics_for_inclusion_NCIS_Medical_Oncology.pdf'));sup.pop('display_status',None)
 if x['risk'].get('phase_profiles'):sup['phase_profiles']=copy.deepcopy(x['risk']['phase_profiles'])
 save(str(f.relative_to(R)),p)
 def val(v,status='source_verified'):return dict(status=status,value=v,source=f'NCCP {c} v{m["nccp_version"]}; checked {DATE}; '+m['source_url'])
 sustain['profiles'][p['protocol_id']]=dict(route_classification=val('oral_only' if x['route'] in ['oral','oral_only'] else 'mixed_oral_parenteral' if 'oral' in x['route'] else 'parenteral_only'),administration_frequency=val(d['schedule_summary']),ambulatory_pump=val(bool(d.get('port_pump'))),administration_time=val('The unit confirms complete appointment duration. No environmental saving is measured.','not_estimated'),planned_treatment_encounters=val(None,'evidence_required'),travel_model_inputs=val(None,'not_encoded'))
# Resolve historical aliases to reviewed national guidance records without changing classification.
for alias,level in [('nccp-minimal-no-routine','minimal'),('nccp-parenteral-minimal','minimal'),('nccp-v8-high-v08420','high')]:
 risk['scripts'][alias]=dict(label='NCCP NCIS v8 '+level+' risk guidance',risk_level=level,url='https://healthservice.hse.ie/documents/7180/Supportive_Care_Antiemetics_for_inclusion_NCIS_Medical_Oncology.pdf',source_url='https://healthservice.hse.ie/documents/7180/Supportive_Care_Antiemetics_for_inclusion_NCIS_Medical_Oncology.pdf',status='national_guidance_link',summary='No routine chemotherapy antiemetic prophylaxis for the minimal-risk component; reconcile any continuing delayed-emesis plan.' if level=='minimal' else 'NCCP NCIS v8 high-risk non-AC row. Use the source-reviewed treatment-day supportive-care plan; reconcile multiday treatment, steroid exposure and interactions.',subsequent_days='Follow any separately prescribed delayed-emesis course; do not repeat an entire earlier-day plan.' if level=='minimal' else 'Use the reviewed regimen-specific multiday and subsequent-day prescription. The prescriber confirms rescue medicine duration.')
risk['content_update_release']=V;save('data/emetogenic-risk-map.json',risk);save('data/sustainability-regimen-metadata-v0691.json',sustain)
consent=read('data/consent-content-v0710.json')
for group in ['rt21','rt28','bev-nintedanib']:
 for profile in (R/'validation/lung-completion-v08430'/group/'proposed').glob('*-consent-profile.json'):
  consent['agent_profiles'][profile.name.removesuffix('-consent-profile.json')]=json.loads(profile.read_text())
 update=R/'validation/lung-completion-v08430'/group/'consent-profile-updates.json'
 if update.exists():consent['agent_profiles'].update(json.loads(update.read_text())['agent_profiles'])
consent['content_update_release']=V;save('data/consent-content-v0710.json',consent)
for name in ['index.html','404.html','about.html','js/sactcheck-release.js']:
 p=R/name;s=p.read_text().replace('0.84.29',V)
 if name=='404.html':
  for c in idx['new_codes']:
   if c not in s:s=s.replace('00262|',c+'|00262|')
 p.write_text(s)
d=read('data/app-release.json')
for k in ['release','content_release','version','knowledge_content_release']:d[k]=V
d.update(display_version='v'+V,release_date=DATE,summary='Complete the final six lung service suites, with source-specific chemoradiotherapy schedules and nintedanib phases, three-page patient packs and lung-wide closeout audit. Feasibility build; independent review pending.')
save('data/app-release.json',d)
for name in ['package.json','package-lock.json']:
 if not (R/name).exists():continue
 d=read(name);d['version']=V
 if 'packages' in d and '' in d['packages']:d['packages']['']['version']=V
 save(name,d)
print('Integrated six lung completion suites with explicit phase/scope routes.')
