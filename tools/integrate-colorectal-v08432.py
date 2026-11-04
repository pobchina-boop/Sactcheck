from pathlib import Path
import json,re,copy
R=Path(__file__).resolve().parents[1];V='0.84.32';DATE='2026-11-04'
def read(f):return json.loads((R/f).read_text())
def save(f,d):(R/f).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
scope=read('validation/colorectal-v08432/scope.json');codes=scope['new_codes']+scope['retrospective_codes']
risk=read('data/emetogenic-risk-map.json');sustain=read('data/sustainability-regimen-metadata-v0691.json')
for c in scope['new_codes']:
 f=next((R/'protocols').glob('*/'+c+'-*'));p=read(str(f.relative_to(R)));d=read('data/patient-knowledge/'+c+'.json');m=p['metadata'];m['schedule_summary']=d['schedule_summary']
 m['source_document_pages']={'00660':7,'00421':5,'00427':7,'00428':7,'00486':7}[c]
 m['document_revision']=DATE
 def admin(drug,dose,days,unit='mg/m²',note=''):return dict(drug=drug,days=days,dose=dict(value=dose,unit=unit),route='IV',notes=note)
 if c=='00421':administration=[admin('fluorouracil',225,list(range(1,8)),'mg/m²/day','Continuous IV infusion seven days/week; pump changed weekly. Concurrent RT has separate plan.')]
 elif c in ['00427','00428']:
  days=[1,8,15,22,29,36] if c=='00427' else [1];administration=[admin('folinic_acid',50,days,'mg','Flat dose IV bolus before fluorouracil'),admin('fluorouracil',500 if c=='00427' else 370,days,'mg/m²','IV bolus; do not make up missed doses')]
 elif c=='00486':administration=[admin('oxaliplatin',85,[1,15,29],'mg/m²','Over 2 hours in glucose 5%; never saline'),admin('folinic_acid',500,[1,8,15,22,29,36],'mg/m²','Over 2 hours'),admin('fluorouracil',500,[1,8,15,22,29,36],'mg/m²','IV bolus one hour after folinic acid starts')]
 if c!='00660':p['treatment_phases']=[dict(phase_id='main_cycle',label='Source reference schedule',cycle_length_days=d['cycle_days'],administration=administration,notes=d['schedule_summary'])]
 p.setdefault('treatment',{}).update(cycle_length_days=d['cycle_days'],schedule_summary=d['schedule_summary'],drugs=[a['name'] for a in d['agents']])
 if c=='00486':p['treatment_phases'][0]['maximum_cycles']=3
 if c=='00421':p['treatment_phases'][0]['maximum_cycles']=6
 if c=='00427':p['treatment_phases'][0]['notes']+=' Consultant-selected alternative: four weekly doses followed by two weeks off; confirm the prescribed variant before use.'
 risk['protocols'][c]=dict(level='moderate' if c=='00486' else 'low',script_id='nccp-parenteral-moderate' if c=='00486' else 'nccp-parenteral-low',mapping_basis='NCCP '+c+' source-specific emetogenic risk; reviewed '+DATE,source_url=m['source_url'])
 if c=='00486':risk['protocols'][c]['phase_profiles']={'oxaliplatin_days':dict(level='moderate',script_id='nccp-parenteral-moderate'),'fluorouracil':dict(level='low',script_id='nccp-parenteral-low')}
 p.setdefault('supportive_care',{}).update(emetogenic_risk=risk['protocols'][c]['level'],script_id=risk['protocols'][c]['script_id'],phase_specific_plan='patient/'+c+'/supportive-care.html',mapping_source_url=m['source_url'],source_url=m['source_url'],mapping_basis=risk['protocols'][c]['mapping_basis'],validation_status='source_reconciled_pending_independent_clinical_and_pharmacy_review')
 if c=='00486':
  p['supportive_care']['phase_profiles']=risk['protocols'][c]['phase_profiles'];p['supportive_care']['treatment_day_profiles']={**{str(n):'oxaliplatin_days' for n in [1,15,29]},**{str(n):'fluorouracil' for n in [8,22,36]}}
  p['input_definitions']['treatment_day']=dict(label='Treatment day within 56-day FLOX cycle',type='select',required=False,input_role='context',always_show=True,ui_section='treatment_context',demo_value='',options=[dict(value=str(n),label='Day '+str(n)) for n in [1,8,15,22,29,36]])
 for field,df in p['input_definitions'].items():
  if df.get('demo_value') is None:df['demo_value']=''
 save(str(f.relative_to(R)),p)
 def val(v,status='source_verified'):return dict(status=status,value=v,source='NCCP '+c+' v'+str(m['nccp_version'])+'; checked '+DATE+'; '+m['source_url'])
 sustain['profiles'][p['protocol_id']]=dict(route_classification=val('parenteral_only'),administration_frequency=val(d['schedule_summary']),ambulatory_pump=val(d.get('port_pump',False)),administration_time=val('Full visit duration confirmed locally; no measured environmental saving.','not_estimated'),planned_treatment_encounters=val(None,'evidence_required'),travel_model_inputs=val(None,'not_encoded'))
save('data/emetogenic-risk-map.json',risk);save('data/sustainability-regimen-metadata-v0691.json',sustain)
file=R/'js/patient-asset-registry-v0810.js';s=file.read_text()
for c in scope['new_codes']:
 d=read('data/patient-knowledge/'+c+'.json');entry=dict(title=d['title'],guide=True,passport=True,sactCard=True,knowledge=True,consentDraft=True,supportiveCare=True,phaseSupport=True,longitudinal=True)
 if not re.search(r"'"+c+r"':",s):s=s.replace("    '00790':","    '"+c+"':"+json.dumps(entry,ensure_ascii=False)+",\n    '00790':")
s=s.replace("const RELEASE='0.84.31'","const RELEASE='0.84.32'").replace("const CONTENT_RELEASE='0.84.30'","const CONTENT_RELEASE='0.84.32'");file.write_text(s)
file=R/'js/regimen-knowledge-base.js';s=file.read_text().replace('"data/regimen-knowledge-base-v08430-addendum.json"]','"data/regimen-knowledge-base-v08430-addendum.json", "data/regimen-knowledge-base-v08432-addendum.json"]');file.write_text(s)
file=R/'tools/build-complete-pathways.cjs';s=file.read_text();s=s.replace("codes=['00214'","codes=['00660','00421','00427','00428','00486','00214'") if "codes=['00660'" not in s else s;file.write_text(s)
for name in ['tools/build-complete-pathways.cjs','tools/build-phase-support-v0838.cjs','tools/patient-suite-context-v08425.cjs']:
 file=R/name;s=file.read_text().replace("'0.84.29','0.84.30']","'0.84.29','0.84.30','0.84.32']");file.write_text(s)
for name in ['index.html','404.html','about.html','js/sactcheck-release.js']:
 file=R/name;file.write_text(file.read_text().replace('0.84.31',V))
for name in ['package.json','package-lock.json']:
 if not (R/name).exists():continue
 d=read(name);d['version']=V
 if '' in d.get('packages',{}):d['packages']['']['version']=V
 if name=='package.json':d['scripts']['test:colorectal-v08432']='node tests/clinical-audit-v08432.test.cjs && node tests/full-suite-v08432.test.cjs'
 save(name,d)
d=read('data/app-release.json')
for k in ['release','content_release','version','knowledge_content_release']:d[k]=V
d.update(display_version='v'+V,release_date=DATE,summary='Five colorectal service suites, five clinical retrospectives and clearer patient document identity, personal-plan guidance and contact placeholders. Feasibility build; independent review pending.');save('data/app-release.json',d)
d=read('data/colorectal-suite-progress-v0832.json');d['release']=V
for row in d['regimens']:
 if row['code'] in scope['new_codes']:row.update(full_suite=True,full_suite_release=V)
 if row['code'] in codes:row['clinical_map_audit_release']=V
d['completed_software_packages']=sorted(set(d['completed_software_packages']+scope['new_codes']));save('data/colorectal-suite-progress-v0832.json',d)
save('validation/colorectal-v08432/coverage.json',dict(candidate_contexts=len(d['regimens']),completed_colorectal_context_suites=sum(r['full_suite'] for r in d['regimens']),remaining=[r for r in d['regimens'] if not r['full_suite']],scope_note=d['scope']))
print('Integrated colorectal services, explicit FLOX treatment-day support and shared presentation.')
