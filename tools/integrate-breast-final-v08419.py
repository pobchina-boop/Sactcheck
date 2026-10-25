"""Wire reviewed v0.84.19 suites into the existing service architecture."""
from pathlib import Path
import json,re,copy,qrcode
R=Path(__file__).resolve().parents[1];V='0.84.19';DATE='2026-10-25'
def read(p):return json.loads((R/p).read_text())
def save(p,d):(R/p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
idx=read('data/breast-final-v08419-source-index.json');cfg=read('data/breast-final-v08419-authoring.json')['regimens'];codes=idx['codes']
p=R/'js/patient-asset-registry-v0810.js';s=p.read_text()
for c in codes:
 d=read(f'data/patient-knowledge/{c}.json');entry=json.dumps(dict(title=d['title'],guide=True,passport=True,sactCard=True,knowledge=True,consentDraft=True,supportiveCare=True,phaseSupport=True,longitudinal=True),ensure_ascii=False);pattern=r"    '"+c+r"':\{[^\n]*\},?"
 if re.search(pattern,s):s=re.sub(pattern,"    '"+c+"':"+entry+",",s)
 else:s=s.replace("    '00790':","    '"+c+"':"+entry+",\n    '00790':")
 if c in idx['new_codes']:
  out=R/'patient'/c;out.mkdir(parents=True,exist_ok=True);qrcode.make('https://sactcheck.com/patient/'+c+'/').save(out/'qr.png')
s=s.replace("const RELEASE='0.84.18'","const RELEASE='0.84.19'").replace("const CONTENT_RELEASE='0.84.18'","const CONTENT_RELEASE='0.84.19'");p.write_text(s)
p=R/'js/regimen-knowledge-base.js';s=p.read_text()
if 'data/regimen-knowledge-base-v08419-addendum.json' not in s:s=s.replace('"data/regimen-knowledge-base-v08418-addendum.json"]','"data/regimen-knowledge-base-v08418-addendum.json", "data/regimen-knowledge-base-v08419-addendum.json"]')
p.write_text(s)
# Every shared renderer change is opt-in to the reviewed release.
for name in ['tools/build-complete-pathways.cjs','tools/build-phase-support-v0838.cjs','tools/build-breast-supportive-care-v0837.cjs']:
 p=R/name;s=p.read_text().replace("'0.84.17','0.84.18'].includes","'0.84.17','0.84.18','0.84.19'].includes")
 if name.endswith('build-complete-pathways.cjs'):
  if "codes=['00545'" not in s:s=s.replace("codes=['00377'","codes=['00545','00605','00688','00720','00738','00377'")
  s=s.replace("d.suite_release==='0.84.18'&&!d.agents", "['0.84.18','0.84.19'].includes(d.suite_release)&&!d.agents")
 p.write_text(s)
risk=read('data/emetogenic-risk-map.json');sustain=read('data/sustainability-regimen-metadata-v0691.json')
script={'low':'nccp-v8-low-v08418','high':'nccp-v8-ac-v08417','minimal':'nccp-minimal-no-routine-prophylaxis','oral_minimal_low':'nccp-oral-minimal-low'}
for c in codes:
 f=next((R/'protocols/breast').glob(c+'-*'));p=json.loads(f.read_text());d=read(f'data/patient-knowledge/{c}.json');x=cfg[c];sup=p.setdefault('supportive_care',{})
 p['metadata'].update(full_suite_release=V,sactcheck_encoding_version=V,schedule_summary=d['schedule_summary']);p['metadata'].setdefault('encoding_maturity',{}).update(source_reconciled=True,reconciled_release=V)
 # Explicit reviewed course metadata prevents prior-treatment wording or a
 # response-assessment milestone from being mistaken for current intent/duration.
 if c=='00743':p['metadata']['intent']='advanced_disease'
 if c=='00230':p['metadata']['duration_type']='until_progression_or_toxicity'
 if c in ['00605','00720']:
  p['metadata']['source_schedule_interval_label']='Continuous daily oral treatment'
  for phase in p.get('treatment_phases',[]):phase['schedule_interval_label']='Continuous daily oral treatment'
 if c=='00720':
  p['metadata']['duration_text']='For 1 year'
  for phase in p.get('treatment_phases',[]):phase['duration_text']='For 1 year, unless progression or unacceptable toxicity'
 if c=='00485':
  p['metadata']['source_schedule_interval_label']='AC every 14 days → weekly paclitaxel'
  p['metadata']['regimen_card']={'contexts':[{'id':intent,'intent':intent,'duration_text':'For 20 weeks','provenance':'NCCP 00485 v6 planned sequence: four fortnightly AC treatments then twelve weekly paclitaxel doses; actual duration depends on interruptions.'} for intent in ['adjuvant','neoadjuvant']]}
 for rule in p['rule_engine']['rules']:
  if rule.get('source'):rule['source']['checked_date']=DATE
 sup.update(phase_specific_plan=f'patient/{c}/supportive-care.html',source_url=p['metadata']['source_url']);sup.pop('display_status',None)
 if x.get('clinical_phase_profiles'):
  phases={phase:dict(level=level,script_id=script[level]) for phase,level in x['clinical_phase_profiles'].items()};sup.update(emetogenic_risk='phase_dependent',script_id=None,phase_profiles=phases)
  if x.get('clinical_phase_aliases'):sup['phase_aliases']=x['clinical_phase_aliases']
  risk['protocols'][c]=dict(level='phase_dependent',script_id=None,phase_profiles=copy.deepcopy(phases),mapping_basis=x['risk_basis'])
 else:
  level=x['risk'];sup.update(emetogenic_risk=level,script_id=script[level],mapping_basis=x['risk_basis']);sup.pop('phase_profiles',None)
  risk['protocols'][c]=dict(level=level,script_id=script[level],mapping_basis=x['risk_basis'])
 save(str(f.relative_to(R)),p)
 source=f'NCCP {c} v{p["metadata"]["nccp_version"]}; checked {DATE}; '+p['metadata']['source_url']
 sustain['profiles'][p['protocol_id']]=dict(route_classification=dict(status='source_verified',value='oral_only' if c in ['00605','00720'] else 'parenteral_only',source=source),administration_frequency=dict(status='source_verified',value=d['schedule_summary'],source=source),ambulatory_pump=dict(status='source_verified',value=False,source=source),administration_time=dict(status='not_estimated',value='The unit confirms complete appointment duration; no environmental saving is measured here.',source=source),planned_treatment_encounters=dict(status='evidence_required',value=None,source=source),travel_model_inputs=dict(status='not_encoded',value=None,source=source))
risk['content_update_release']=V;save('data/emetogenic-risk-map.json',risk);save('data/sustainability-regimen-metadata-v0691.json',sustain)
for name in ['index.html','404.html','about.html','js/sactcheck-release.js']:
 p=R/name;s=p.read_text().replace('0.84.18',V)
 if name=='404.html':
  for c in idx['new_codes']:
   if c not in s:s=s.replace('00262|',c+'|00262|')
 p.write_text(s)
d=read('data/app-release.json')
for key in ['release','content_release','version','knowledge_content_release']:d[key]=V
d.update(display_version='v'+V,release_date=DATE,summary='Five final breast-catalogue suites and five cytotoxic retrospective upgrades, with source-specific assessments, patient tools, monitoring and support. Feasibility build; independent clinical review pending.');save('data/app-release.json',d)
for name in ['package.json','package-lock.json']:
 if not (R/name).exists():continue
 d=read(name);d['version']=V
 if 'packages' in d and '' in d['packages']:d['packages']['']['version']=V
 save(name,d)
print('Integrated ten reviewed suite routes, phase support, metadata and release version.')
