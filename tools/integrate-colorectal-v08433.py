"""Integrate the ten source-audited colorectal records without rebuilding other routes."""
from pathlib import Path
import json,copy,re,qrcode
R=Path(__file__).resolve().parents[1];V='0.84.33';DATE='2026-11-04'
STATUS='Source reconciled; independent clinical, pharmacy and patient/PPI review pending'
NCIS='https://healthservice.hse.ie/documents/7180/Supportive_Care_Antiemetics_for_inclusion_NCIS_Medical_Oncology.pdf'
def read(f):return json.loads((R/f).read_text())
def save(f,d):
 p=R/f;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
scope=read('validation/colorectal-v08433/scope.json');NEW=scope['new_codes'];ALL=NEW+scope['retrospective_codes']
support=read('data/phase-support-v0838.json');journeys=read('data/breast-treatment-journeys-v0837.json');presentation=read('data/patient-presentation-v08431.json');risk=read('data/emetogenic-risk-map.json');sustain=read('data/sustainability-regimen-metadata-v0691.json')
kb=dict(schema_version=1,release=V,source_checked_date=DATE,governance=STATUS,regimen_profiles=[],drug_profiles=[dict(id='aflibercept',name='Aflibercept',aliases=['aflibercept','ziv-aflibercept','Zaltrap'],drug_type='Targeted biological therapy',drug_class='VEGF ligand-trapping fusion protein',mechanism='Aflibercept binds VEGF-A, VEGF-B and placental growth factor as a soluble decoy receptor. This reduces signalling that supports formation of tumour blood vessels; it can also affect normal vascular function, blood pressure, renal protein handling and wound healing.',source_url='https://www.ema.europa.eu/en/documents/product-information/zaltrap-epar-product-information_en.pdf',source_label='EMA Zaltrap product information, section 5.1',review_status=STATUS,source_checked_date=DATE)],evidence_records=[])
basekb={}
for file in re.findall(r'data/regimen-knowledge-base[^"\s]+\.json',(R/'js/regimen-knowledge-base.js').read_text()):
 if file.endswith('v08433-addendum.json') or not (R/file).exists():continue
 for row in read(file).get('regimen_profiles',[]):basekb[row['protocol_id']]=copy.deepcopy(row)
def med(name,dose,timing,note):return dict(name=name,dose=dose,timing=timing,note=note)
for c in ALL:
 f=next((R/'protocols').glob('*/'+c+'-*'));p=read(str(f.relative_to(R)));m=p['metadata'];d=read('data/patient-knowledge/'+c+'.json')
 assert d['patient_summary']['template_version']==V,(c,'patient content must be completed first')
 if c in NEW:
  risk_level='high' if c in ['00555','00783','00691'] else 'moderate' if c=='00238' else 'low'
  script='nccp-v8-high-v08420' if risk_level=='high' else 'nccp-parenteral-'+risk_level
  risk['protocols'][c]=dict(level=risk_level,script_id=script,mapping_basis='NCCP '+c+' source-specific emetic risk; checked '+DATE,source_url=m['source_url'])
  p.setdefault('supportive_care',{}).update(emetogenic_risk=risk_level,script_id=script,phase_specific_plan='patient/'+c+'/supportive-care.html',mapping_source_url=m['source_url'],source_url=m['source_url'],mapping_basis=risk['protocols'][c]['mapping_basis'],validation_status='source_reconciled_pending_independent_clinical_and_pharmacy_review')
  if c=='00691':
   profiles={'induction':dict(level='high',script_id='nccp-v8-high-v08420'),'chemoradiation':dict(level='oral_minimal_low',script_id='nccp-oral-minimal-low')}
   risk['protocols'][c].update(level='phase_dependent',phase_profiles=profiles);p['supportive_care'].update(emetogenic_risk='phase_dependent',phase_profiles=profiles)
  if risk_level=='high':
   medicines=[med('Aprepitant','125 mg orally','Day 1 before chemotherapy','Check interactions; national dexamethasone doses below already account for this combination.'),med('Aprepitant','80 mg orally once daily','Days 2 and 3','Do not duplicate another NK1 antagonist.'),med('Ondansetron','16 mg orally once','Day 1 before chemotherapy','Review QT risk, interactions, constipation and hepatic function.'),med('Dexamethasone','12 mg orally once','Day 1 before chemotherapy','Reconcile all steroids; do not duplicate.'),med('Dexamethasone','8 mg orally once daily','Days 2, 3 and 4','Re-anchor to the actual treatment day if delayed.'),med('Olanzapine','5 mg orally once daily','Days 1, 2, 3 and 4','Review sedation, falls, glucose and interactions.'),med('Metoclopramide','10 mg orally up to three times daily as required','Subsequent-day rescue; prescriber confirms duration','Review renal function and neurological contraindications. Concomitant olanzapine increases extrapyramidal adverse-effect risk; reconcile rescue medicines.')]
   medicines.append(med('Atropine sulphate','250 micrograms subcutaneously','Before irinotecan if prescribed','Avoid in glaucoma; use caution with asthma. This treats acute cholinergic effects, not delayed diarrhoea.'))
   plan=dict(id='induction' if c=='00691' else 'treatment',label='FOLFIRINOX induction: six 14-day cycles' if c=='00691' else d['title']+' — chemotherapy cycle',active_medicines=[a['name'] for a in d['agents'] if a['id'] not in ['capecitabine','radiotherapy']],emetogenic_risk='High',medicines=medicines,additional_support=[s['text'] for s in d['support']],source_url=m['source_url'],source_checked=DATE,guidance=dict(label='NCCP NCIS antiemetics V8: high-risk non-AC row; multiday support reviewed by prescriber',url=NCIS))
   plan['additional_support'].append('Irinotecan delayed-diarrhoea rescue must be supplied as a written prescription: loperamide 4 mg initially, then 2 mg every 2 hours until 12 hours after the last liquid stool, for no longer than 48 hours at this high-dose schedule. Fever, dehydration, severe pain or persistent diarrhoea needs urgent oncology assessment. Do not carry this schedule into capecitabine treatment without a new prescription.')
   plans=[plan]
   if c=='00691':plans.append(dict(id='chemoradiation',label='Capecitabine with radiotherapy: separate five-week phase',active_medicines=['Capecitabine','Radiotherapy'],emetogenic_risk='Oral minimal-to-low; radiation risk assessed separately',medicines=[],prescription_note='Use oral-SACT antiemetics as required under local policy. The radiation team assesses radiation-related emesis separately. The induction aprepitant, dexamethasone, olanzapine and atropine schedule does not continue automatically into this phase.',additional_support=['Confirm the capecitabine prescription and radiation-day calendar: planned Days 1–5 each week for five weeks; no catch-up doses without instructions.','Capecitabine is taken within 30 minutes after food. Use the written missed-dose, vomiting and diarrhoea plan.','Confirm weekly blood tests and bowel, skin, hydration and radiation review. Stop capecitabine and contact the team for significant toxicity as instructed.'],source_url=m['source_url'],source_checked=DATE,guidance=dict(label='NCCP NCIS V8 oral SACT and radiation-specific guidance',url=NCIS)))
  elif c=='00238':
   plan=copy.deepcopy(support['regimens']['00227'][0]);plan.update(id='treatment',label='Aflibercept + FOLFIRI: active treatment cycle',active_medicines=[a['name'] for a in d['agents']],source_url=m['source_url'],source_checked=DATE);plan['additional_support']=[s['text'] for s in d['support']]+[t for t in plan['additional_support'] if 'loperamide 4 mg' in t];plans=[plan]
  else:
   plans=[dict(id='treatment',label='Bevacizumab + fluorouracil/folinic acid cycle',active_medicines=[a['name'] for a in d['agents']],emetogenic_risk='Low (fluorouracil); bevacizumab minimal',medicines=[med('Ondansetron','8 mg orally once','Before chemotherapy if prescribed','NCIS V8 low-risk default; review QT risk, interactions and constipation. Regimen premedication is not otherwise routinely required.'),med('Metoclopramide','10 mg orally up to three times daily as required','Rescue only; prescriber confirms duration','Review renal function, neurological contraindications and interactions.')],additional_support=[s['text'] for s in d['support']],source_url=m['source_url'],source_checked=DATE,guidance=dict(label='NCCP NCIS antiemetics V8 low-risk row',url=NCIS))]
  support['regimens'][c]=plans
  m['schedule_summary']=d['schedule_summary'];m['document_revision']=DATE
  p.setdefault('treatment',{}).update(schedule_summary=d['schedule_summary'])
  save(str(f.relative_to(R)),p)
  def val(v,status='source_verified'):return dict(status=status,value=v,source='NCCP '+c+' v'+str(m['nccp_version'])+'; '+DATE+'; '+m['source_url'])
  sustain['profiles'][p['protocol_id']]=dict(route_classification=val('oral_and_parenteral' if c=='00691' else 'parenteral_only'),administration_frequency=val(d['schedule_summary']),ambulatory_pump=val(d.get('port_pump',False)),administration_time=val('Full visit duration confirmed locally; no measured environmental saving.','not_estimated'),planned_treatment_encounters=val(None,'evidence_required'),travel_model_inputs=val(None,'not_encoded'))
 else:
  for plan in support['regimens'][c]:
   plan.update(source_url=m['source_url'],source_checked=DATE)
   plan['additional_support']=list(dict.fromkeys(plan.get('additional_support',[])+[s['text'] for s in d['support']]))
 if c not in NEW and p['protocol_id'] in sustain['profiles']:
  sustain['profiles'][p['protocol_id']]['administration_frequency'].update(value=d['schedule_summary'],status='source_verified',source='NCCP '+c+' v'+str(m['nccp_version'])+'; checked '+DATE+'; '+m['source_url'])
 presentation['routes'][c]='data/patient-knowledge/'+c+'.json'
 ms=d['monitoring_schedule'];journeys[c]=dict(code=c,title=d['title']+': treatment and checks',release=V,checked=DATE,status=STATUS,schedule_type='relative-educational',has_patient_dates=False,setting=d['context_label'],summary=d['schedule_summary'],stages=ms['columns'],lanes=[dict(label=r['label'],kind='monitoring',cells=r['cells'],source_ids=[c],note=ms.get('note','')) for r in ms['rows']],milestones=[dict(title=z.get('label','Treatment phase'),when=z.get('short','According to your plan'),why=d['purpose'],clinical=z.get('detail',d['schedule_summary']),action='Confirm the phase, prescription, tests and supportive medicines before starting.',source_ids=[c]) for z in d['phases']],clinical_notes=[ms.get('note','')],sources=[dict(s,id=c if s['id']=='nccp' else s['id']) for s in d['sources']])
 k=basekb.get(p['protocol_id'],{})
 if c in NEW:
  k=dict(protocol_id=p['protocol_id'],regimen_role=d['context_label'],clinical_summary=d['purpose'],treatment_setting=d['context_label'],component_rationale=' '.join(a['name']+': '+a['explanation'] for a in d['agents']),schedule_context=d['schedule_summary'],key_points=[d['administration_text'],d.get('monitoring_summary',' '.join(r['cells'][1] for r in d['monitoring_schedule']['rows'])),d['consent_support']],schedule_kind='multiphase_chemoradiation' if c=='00691' else 'cytotoxic_reference')
  k['treatment_rationale']=dict(summary=d['purpose'],setting=d['context_label'],line='Confirm the exact NCCP indication, previous treatment and individual treatment aim.',factors=['Disease stage, prior treatment and patient priorities','DPD status where applicable, organ function and toxicity','Triplet fitness and neuropathy risk' if c in ['00555','00783','00691'] else 'Vascular, bleeding, blood-pressure and proteinuria risk','Treatment phase, visit and home-infusion burden'],alternatives=['Discuss indication-specific alternatives, treatment modification, supportive care and the option of no anticancer treatment.'],limitations=[d['evidence']['interpretation']],sources=[dict(label=d['sources'][0]['title'],url=m['source_url'])])
  k['patient_selection']=dict(treatment_intent=d['context_label'],disease_and_biomarker_context=[m['indication'],'Confirm DPD status before fluorouracil/capecitabine; a normal test does not exclude severe toxicity.'],eligibility_orientation=['Verify the source-specific inclusion/exclusion criteria, performance status and blood-count thresholds.','Review organ function, current toxicity, previous reductions and all medicines before prescribing.'],important_cautions=[d['consent_support']])
  k['evidence_at_a_glance']=dict(trial='NCCP source rationale',population=d['context_label'],comparison='See regimen-specific trial context; no cross-regimen survival estimate is assigned.',checked=DATE,qualitative_result=d['evidence']['interpretation'],applicability=d['evidence']['interpretation'],endpoints=[],limitations=[d['evidence']['interpretation']],sources=[dict(label=d['sources'][0]['title'],url=m['source_url'])])
  k['evidence_audit']=dict(status=STATUS,indications_reviewed=[m['indication']],remaining_uncertainties=[d['evidence']['interpretation']])
  k['administration']=dict(cycle_and_sequence=d['schedule_summary'],route_and_duration=[d['administration_text']],practical_workflow=[z['text'] for z in d['logistics']['sections']],observation_and_access=['Confirm infusion access, allergy precautions, pump finish/disconnection time and the phase-specific supportive plan.'])
 k.update(source_checked_date=DATE,review_status=STATUS,full_suite_release=V,clinical_audit_release=V)
 k['monitoring_and_toxicity']=dict(baseline=[r['cells'][0] for r in ms['rows']],before_each_cycle=[r['cells'][1] for r in ms['rows']],ongoing=[r['cells'][2] for r in ms['rows']],priority_toxicities=list(dict.fromkeys(t for a in d['agents'] for t in a['risks'])),urgent_review_signals=[d['urgent_extra']],longitudinal_schedule=ms)
 k['supportive_care']=dict(emetogenic_risk='; '.join(q['label']+': '+q['emetogenic_risk'] for q in support['regimens'][c]),premedication_and_prophylaxis=[z['text'] for z in d['support']],patient_education=[d['urgent_extra']],special_support=[s for q in support['regimens'][c] for s in q['additional_support']])
 k['reference_links']=[dict(label=s['title'],url=s['url']) for s in d['sources']]+[dict(label=label,url='patient/'+c+'/'+file) for label,file in [('Full patient reference','knowledge.html'),('Treatment map','treatment-journey.html'),('Consent aid','consent-form.html'),('Support plan','supportive-care.html'),('Three-page companion','guide.pdf'),('Full handbook','handbook.pdf'),('Passport','passport.pdf')]]
 kb['regimen_profiles'].append(k)
 out=R/'patient'/c;out.mkdir(exist_ok=True,parents=True);qrcode.make('https://sactcheck.com/patient/'+c+'/').save(out/'qr.png');qrcode.make('https://sactcheck.com/patient/'+c+'/knowledge.html').save(out/'oncowiki-qr.png')
for f,v in [('data/regimen-knowledge-base-v08433-addendum.json',kb),('data/phase-support-v0838.json',support),('data/breast-treatment-journeys-v0837.json',journeys),('data/patient-presentation-v08431.json',presentation),('data/emetogenic-risk-map.json',risk),('data/sustainability-regimen-metadata-v0691.json',sustain)]:save(f,v)
file=R/'js/patient-anatomy-data-v08431.js';anatomy=json.loads(file.read_text().split('=',1)[1].rstrip(';\n'))
for c in ALL:anatomy[c]=dict(code=c,anatomy=read('data/patient-knowledge/'+c+'.json')['anatomy'])
file.write_text('globalThis.SACTCheckAnatomyData='+json.dumps(anatomy,ensure_ascii=False,separators=(',',':'))+';\n')
file=R/'js/patient-asset-registry-v0810.js';s=file.read_text()
for c in NEW:
 d=read('data/patient-knowledge/'+c+'.json');entry=dict(title=d['title'],guide=True,passport=True,sactCard=True,knowledge=True,consentDraft=True,supportiveCare=True,phaseSupport=True,longitudinal=True)
 if not re.search(r"'"+c+r"':",s):s=s.replace("    '00790':","    '"+c+"':"+json.dumps(entry,ensure_ascii=False)+",\n    '00790':")
s=s.replace("const RELEASE='0.84.32'","const RELEASE='0.84.33'").replace("const CONTENT_RELEASE='0.84.32'","const CONTENT_RELEASE='0.84.33'");file.write_text(s)
file=R/'js/regimen-knowledge-base.js';s=file.read_text();needle='"data/regimen-knowledge-base-v08432-addendum.json"';s=s.replace(needle+']',needle+', "data/regimen-knowledge-base-v08433-addendum.json"]');file.write_text(s)
file=R/'404.html';s=file.read_text();s=s.replace('(00660|','('+'|'.join(NEW)+'|00660|');file.write_text(s)
for name in ['package-lock.json']:
 if (R/name).exists():
  x=read(name);x['version']=V
  if '' in x.get('packages',{}):x['packages']['']['version']=V
  save(name,x)
x=read('data/colorectal-suite-progress-v0832.json');x['release']=V
for row in x['regimens']:
 if row['code'] in NEW:row.update(full_suite=True,full_suite_release=V)
 if row['code'] in ALL:
  row['clinical_map_audit_release']=V;p=read(row['path']);row['source_version']=p['metadata']['nccp_version'];row['source_checked']=DATE
x['completed_software_packages']=sorted(set(x['completed_software_packages']+NEW));save('data/colorectal-suite-progress-v0832.json',x)
save('validation/colorectal-v08433/coverage.json',dict(candidate_contexts=len(x['regimens']),completed_colorectal_context_suites=sum(r['full_suite'] for r in x['regimens']),remaining=[r for r in x['regimens'] if not r['full_suite']],scope_note=x['scope']))
print('Integrated ten colorectal suites, phase-specific supportive care, anatomy and scoped printable routes.')
