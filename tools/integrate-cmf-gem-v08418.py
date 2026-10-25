"""Integrate the ten reviewed suites without rebuilding unrelated patient bundles."""
from pathlib import Path
import json,re,qrcode,copy
R=Path(__file__).resolve().parents[1];V='0.84.18';DATE='2026-10-25'
def read(p):return json.loads((R/p).read_text())
def save(p,d):(R/p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
idx=read('data/cmf-gem-v08418-source-index.json');codes=idx['codes']
reg=R/'js/patient-asset-registry-v0810.js';s=reg.read_text()
for c in codes:
 d=read(f'data/patient-knowledge/{c}.json');entry=json.dumps(dict(title=d['title'],guide=True,passport=True,sactCard=True,knowledge=True,consentDraft=True,supportiveCare=True,phaseSupport=True,longitudinal=True),ensure_ascii=False)
 pattern=r"    '"+c+r"':\{[^\n]*\},?"
 if re.search(pattern,s):s=re.sub(pattern,"    '"+c+"':"+entry+",",s)
 else:s=s.replace("    '00790':","    '"+c+"':"+entry+",\n    '00790':")
 if c in idx['new_codes']:
  p=R/'patient'/c;p.mkdir(parents=True,exist_ok=True);qrcode.make('https://sactcheck.com/patient/'+c+'/').save(p/'qr.png')
s=s.replace("const RELEASE='0.84.17'","const RELEASE='0.84.18'").replace("const CONTENT_RELEASE='0.84.17'","const CONTENT_RELEASE='0.84.18'");reg.write_text(s)
p=R/'js/regimen-knowledge-base.js';s=p.read_text()
if 'data/regimen-knowledge-base-v08418-addendum.json' not in s:s=s.replace('"data/regimen-knowledge-base-v08417-addendum.json"]','"data/regimen-knowledge-base-v08417-addendum.json", "data/regimen-knowledge-base-v08418-addendum.json"]')
p.write_text(s)
p=R/'tools/build-complete-pathways.cjs';s=p.read_text()
if "codes=['00377'" not in s:s=s.replace("codes=['00262'","codes=['00377','00378','00381','00430','00749','00262'")
s=s.replace("'0.84.16','0.84.17'].includes","'0.84.16','0.84.17','0.84.18'].includes")
s=s.replace("if(d.suite_release==='0.84.17')consent=", "if(['0.84.17','0.84.18'].includes(d.suite_release))consent=")
p.write_text(s)
for name in ['tools/build-phase-support-v0838.cjs','tools/build-breast-supportive-care-v0837.cjs']:
 p=R/name;s=p.read_text().replace("'0.84.16','0.84.17'].includes","'0.84.16','0.84.17','0.84.18'].includes");p.write_text(s)
# Source schedule variants may depend on formulation rather than interval.
p=R/'js/protocol-dose-schedule.js';s=p.read_text();s=s.replace("[result.inputs?.trastuzumab_schedule]","[result.inputs?.[protocol.metadata?.dose_schedule_variant_input || 'trastuzumab_schedule']]");p.write_text(s)
risk=read('data/emetogenic-risk-map.json');sustain=read('data/sustainability-regimen-metadata-v0691.json')
for level in ['moderate','low']:
 risk['scripts']['nccp-v8-'+level+'-v08418']=dict(label='NCCP V8 antiemetic guidance — reviewed treatment day',risk_level=level,url=risk['scripts']['nccp-v8-ac-v08417']['url'],source_url=risk['scripts']['nccp-v8-ac-v08417']['source_url'],status='national_guidance_link',summary='NCCP V8 Table 1 '+level+' risk row. Use the exact treatment-day supportive-care draft; reconcile medicines, renal/hepatic function and individual risk.',subsequent_days='Moderate risk: dexamethasone on the two days after each administered chemotherapy dose, with rescue treatment as prescribed.' if level=='moderate' else 'No routine subsequent-day prophylaxis; rescue treatment as prescribed.')
for c in codes:
 f=next((R/'protocols/breast').glob(c+'-*'));p=json.loads(f.read_text());d=read(f'data/patient-knowledge/{c}.json');sup=p.setdefault('supportive_care',{})
 p['metadata'].update(full_suite_release=V,sactcheck_encoding_version=V,schedule_summary=d['schedule_summary'])
 p['metadata']['encoding_maturity'].update(source_reconciled=True,reconciled_release=V)
 sup.update(phase_specific_plan=f'patient/{c}/supportive-care.html',source_url=p['metadata']['source_url']);sup.pop('display_status',None)
 if c in idx['new_codes']:
  level='oral_moderate_high' if c=='00377' else 'low' if c=='00749' else 'moderate';script='nccp-oral-moderate-high' if c=='00377' else 'nccp-v8-'+level+'-v08418'
  basis='Oral cyclophosphamide Days 1–14: daily oral prophylaxis, reconciled with IV visit days.' if c=='00377' else 'IV cyclophosphamide is moderate risk; select the actual CMF treatment day.' if c in ['00378','00381'] else 'Carboplatin is AUC2 on Days 1 and 8; moderate risk on each administered treatment day.' if c=='00430' else 'Gemcitabine monotherapy is low risk on each administered treatment day.'
  sup.update(emetogenic_risk=level,script_id=script,mapping_basis=basis,phase_profiles={'combination':dict(level=level,script_id=script)})
  risk['protocols'][c]=dict(level=level,script_id=script,mapping_basis=sup['mapping_basis'])
 else:
  if c=='00815':sup.update(emetogenic_risk='phase_dependent',phase_profiles={'combination':{'level':'low'},'trastuzumab_maintenance':{'level':'minimal'}})
  for phase in sup['phase_profiles'].values():phase['script_id']={'high':'nccp-v8-ac-v08417','low':'nccp-v8-paclitaxel-v08417','minimal':'nccp-v8-trastuzumab-v08417'}[phase['level']]
  sup['script_id']=None
  risk['protocols'][c]=dict(level='phase_dependent',script_id=None,phase_profiles=copy.deepcopy(sup['phase_profiles']),mapping_basis='Select active AC, taxane or trastuzumab-only phase; use the reviewed separate support draft.')
 # Demonstration values are explicit and do not prefill a live assessment.
 numeric={'anc':3,'platelets':200,'gfr_ml_min':80,'bilirubin_micromol_l':10,'creatinine_uln_multiple':1,'transaminase_uln_multiple':1,'anc_x10e9_l':3,'platelets_x10e9_l':200,'hb_g_dl':12,'ecog':0,'bilirubin_umol_l':10,'ast_u_l':25,'ast_uln_multiple':1,'alt_uln_multiple':1,'alp_uln_multiple':1,'bilirubin_uln_multiple':1,'crcl_ml_min':80,'lvef_percent':60,'current_lvef_percent':60,'lvef_drop_points_from_baseline':0,'days_overdue_trastuzumab':0,'days_since_last_sc_trastuzumab':21,'creatinine_sample_age_hours':24,'creatinine_percent_of_isotope_baseline':100,'paclitaxel_current_dose_mg_m2':80,'current_paclitaxel_dose_mg_m2':80}
 for key,field in p['input_definitions'].items():
  if 'demo_value' not in field:
   if field['type']=='boolean':field['demo_value']=key in ['indication_eligible','her2_positive','sc_trastuzumab_locally_approved']
   elif field['type']=='select':field['demo_value']=field['options'][0]['value']
   elif key in numeric:field['demo_value']=numeric[key]
   elif key.endswith('_grade'):field['demo_value']=0
   elif key.endswith('_hours') or key.endswith('_days') or key.startswith('days_'):field['demo_value']=0
  if key.endswith('_grade') and c in idx['new_codes']:
   field.update(grading_source_label='NCCP named toxicity assessment',grading_source_url=p['metadata']['source_url'],assessment_guidance='Confirm the clinician-assessed grade using the approved grading reference; NCCP provides treatment actions, not a complete grading manual.')
   template=read('protocols/breast/00265-fec100.json')['input_definitions']['stomatitis_grade']
   field.update(type='select',unit='Clinician-assessed grade',source_grading_note=template['source_grading_note'],options=copy.deepcopy(template['options']),ctcae_category='pneumonitis' if key=='pneumonitis_grade' else 'other_nonhaematological')
   for oldkey in ['min','max','step','ctcae_version']:field.pop(oldkey,None)
 fixes=read('validation/cmf-gem-v08418/her2-retro/wording-fixes.json')
 def wording(v):
  if isinstance(v,str):return fixes.get(v,v)
  if isinstance(v,list):return [wording(x) for x in v]
  if isinstance(v,dict):return {k:wording(x) for k,x in v.items()}
  return v
 p=wording(p)
 save(str(f.relative_to(R)),p)
 source=f'NCCP {c} v{p["metadata"]["nccp_version"]}; checked {DATE}; '+p['metadata']['source_url']
 sustain['profiles'][p['protocol_id']]={
  'route_classification':dict(status='source_verified',value='oral_and_parenteral' if c=='00377' else 'parenteral_only',source=source),
  'administration_frequency':dict(status='source_verified',value=d['schedule_summary'],source=source),
  'ambulatory_pump':dict(status='source_verified',value=False,source=source),
  'administration_time':dict(status='not_estimated',value='The unit confirms full appointment duration; no environmental saving is measured here.',source=source),
  'planned_treatment_encounters':dict(status='evidence_required',value=None,source=source),
  'travel_model_inputs':dict(status='not_encoded',value=None,source=source)}
risk['content_update_release']=V;save('data/emetogenic-risk-map.json',risk);save('data/sustainability-regimen-metadata-v0691.json',sustain)
for name in ['index.html','404.html','about.html','js/sactcheck-release.js']:
 p=R/name;s=p.read_text().replace('0.84.17',V)
 if name=='404.html':
  for c in idx['new_codes']:
   if c not in s:s=s.replace('00262|',c+'|00262|')
 p.write_text(s)
d=read('data/app-release.json')
for key in ['release','content_release','version','knowledge_content_release']:d[key]=V
d.update(display_version='v'+V,release_date=DATE,summary='Five CMF/gemcitabine suites and five HER2 retrospective upgrades: source-specific dose/day rules, clinician evidence, patient resources and phase-specific support. Feasibility build; independent clinical review pending.')
save('data/app-release.json',d)
for name in ['package.json','package-lock.json']:
 if not (R/name).exists():continue
 d=read(name);d['version']=V
 if 'packages' in d and '' in d['packages']:d['packages']['']['version']=V
 save(name,d)
print('Integrated ten suite routes, source schedules, support and release metadata.')
