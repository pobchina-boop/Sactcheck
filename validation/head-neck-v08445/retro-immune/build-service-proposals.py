"""Propose nine context-preserving data updates and shared clinical/consent additions.
Writes only inside this audit folder. Root merges proposals and regenerates assets.
"""
import copy,json,hashlib
from pathlib import Path
R=Path(__file__).resolve().parent;repo=R.parents[2];out=R/'proposed';out.mkdir(exist_ok=True)
def read(f):return json.loads((repo/f).read_text())
def sha(b):return hashlib.sha256(b).hexdigest()
def save(name,d):
 p=out/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n');return str(p.relative_to(repo))
manifest={'release':'0.84.45','scope':'Nine existing pembrolizumab patient routes; no new head-neck monotherapy patient suite','patient_proposals':[],'clinical_use_authorised':False}
refs=read('data/patient-presentation-v08431.json')['routes']
warning='Heart, muscle and nerve problems can occur together. New muscle pain or weakness with changed vision, unusual tiredness, breathlessness, chest pain or an irregular heartbeat needs immediate medical advice. Do not wait for several symptoms to appear together. Severe breathing difficulty, collapse or rapidly worsening weakness needs emergency care.'
restart='Feeling better or having normal tests does not by itself mean that pembrolizumab can restart. Your team reviews what happened, recovery and the steroid or hormone plan. Some reactions mean that treatment must remain stopped, even if the symptoms have settled. Follow the prescribed plan and never restart treatment or change steroids yourself.'
for route,f in refs.items():
 if not route.startswith(('00455','00558')):continue
 base=read(f);d=copy.deepcopy(base);code=route[:5];version='16' if code=='00455' else '13';d['protocol_id']=f'nccp-{code}-v{version}';d['protocol_version']=version
 d['clinical_review_release']='0.84.45';d['clinical_review_checked']='2026-11-07'
 smpc_id=next((s['id'] for s in d['sources'] if 'keytruda-epar-product-information' in s['url']),None)
 if not smpc_id:
  smpc_id='smpc';d['sources'].append({'id':'smpc','title':'EMA Keytruda IV product information and patient leaflet','url':'https://www.ema.europa.eu/en/documents/product-information/keytruda-epar-product-information_en.pdf','checked':'2026-11-07'})
 # Keep original anatomical anchor tuples, positions, descriptions, chapters, evidence and schedules.
 assert d['anatomy']==base['anatomy']
 ch=next((c for c in d['chapters'] if c['id']=='immune-warning-signs'),None) or next(c for c in d['chapters'] if c['id']=='between-visits')
 if not any(i['title']=='When heart, muscle and nerve symptoms overlap' for i in ch['items']):ch['items'].append({'title':'When heart, muscle and nerve symptoms overlap','text':warning,'source_ids':[smpc_id]})
 # Update the existing pause section in its logical location rather than adding another section.
 paused=next((i for c in d['chapters'] for i in c['items'] if i['title'] in ['A pause is a safety decision','A held dose or changed plan']),None)
 if paused:
  addition=('Before any restart, your team also reviews the original event, recovery and any steroid or hormone plan. Follow the prescribed plan; do not alter steroids or restart treatment yourself.' if paused['title']=='A held dose or changed plan' else 'Restart depends on the original reaction, recovery and any steroid or hormone plan. Some reactions mean treatment must remain stopped even after symptoms settle.')
  paused['text']+=' '+addition;paused['source_ids']=list(dict.fromkeys(paused.get('source_ids',[])+['nccp',smpc_id]))
 else:
  checks=next(c for c in d['chapters'] if c['id'] in ['checks','tests-and-results']);checks['items'].append({'title':'Deciding whether treatment can restart','text':restart,'source_ids':['nccp',smpc_id]})
 d['consent_support']+=' Discuss the possibility that heart, muscle and nerve inflammation can occur together and may need urgent hospital treatment. A severe immune reaction may mean treatment must remain stopped even after recovery.'
 risks=d['agents'][0]['risks'];risks.append('Heart, muscle and nerve immune effects can occur together and require urgent assessment')
 # Keep the short three-page summary concise; detailed explanation remains in the chapter.
 d['patient_summary']['cycle_expectations'].append('A permanent-stop decision still applies after symptoms improve; your team decides whether restarting is safe.')
 d['patient_summary']['summary_checked']='2026-11-07'
 # Alert text already covers weakness, chest/breathing and vision per route. Preserve it; no bloated wallet warning.
 d['retrospective_audit_v08445']={'source_checked':'2026-11-07','scope':'Cardiac/neuromuscular overlap and explicit permanent-stop/restart history; current source identity','anatomical_anchors_preserved':True,'previous_evidence_and_schedules_preserved':True,'clinical_use_authorised':False}
 proposed=save(Path('patient')/(route.replace('/','__')+'.json'),d)
 manifest['patient_proposals'].append({'route':route,'target':f,'proposal':proposed,'before_sha256':sha((repo/f).read_bytes()),'after_sha256':sha((repo/proposed).read_bytes()),'anatomy_count':len(d['anatomy']),'anatomy_unchanged':d['anatomy']==base['anatomy'],'prior_chapter_count':len(base['chapters']),'new_chapter_count':len(d['chapters']),'evidence_unchanged':d['evidence']==base['evidence'],'schedule_unchanged':d['schedule_summary']==base['schedule_summary']})
# Preserve every established endpoint, reference and treatment-context profile. These are not re-estimated efficacy claims.
kb=read('data/regimen-knowledge-base-v08441-addendum.json');profiles=[]
cardioneuro='For pembrolizumab, grade 2 immune myocarditis, encephalitis or Guillain–Barré syndrome requires withholding and urgent specialist assessment; grades 3–4 require permanent discontinuation. EMA Table 1 separately addresses myocarditis–myositis–myasthenia gravis overlap: use the highest individual CTCAE v4.0 grade; hold grade 2 and permanently stop grades 3–4.'
restartclin='Before requested restart, document whether any previous event met permanent-discontinuation criteria; absent history is not a negative history. Current recovery, steroid taper and consultant confirmation cannot override a prior permanent-stop event. The safety of reinitiating pembrolizumab after immune myocarditis is not established. Preserve the specific controlled-endocrine continuation exceptions.'
eligibility=[
 'HNSCC: adult first-line metastatic/unresectable recurrent squamous disease considered incurable by local therapies; excludes nasopharyngeal primaries; validated PD-L1 CPS ≥1; ECOG 0–2. NCCP excludes progression within six months of completing curatively intended systemic treatment. Record prior treatment and interval; exact six months requires source interpretation.',
 'Adjuvant RCC: adult clear-cell disease at increased recurrence risk after nephrectomy, with metastatic-lesion resection where applicable; ECOG 0–2; start within12weeks of surgery. The initiation window is not a recurring-cycle limit.',
 'Urothelial: separate post-platinum progression and first-line cisplatin-ineligible pathways. Confirm source-appropriate histology/site and advanced setting. First-line requires validated CPS; NCCP indication table ≥10 conflicts with eligibility >10, so exact10 needs reconciliation. Do not impose this CPS threshold on the post-platinum pathway.',
 'Cervical maintenance: adult persistent/recurrent/metastatic disease, induction chemotherapy completed, validated PD-L1 CPS ≥1 and ECOG 0–2. Do not confuse maintenance monotherapy with its induction combination.'
]
def updateprofile(d,code):
 d['protocol_id']=f'nccp-{code}-v'+('16' if code=='00455' else '13')
 d['clinical_audit_release']='0.84.45';d['clinical_review_release']='0.84.45';d['source_checked_date']='2026-11-07'
 d.setdefault('key_points',[]).extend([cardioneuro,restartclin])
 mt=d.setdefault('monitoring_and_toxicity',{});mt.setdefault('urgent_review_signals',[]).append('Investigate combined muscle weakness/pain, visual symptoms, breathlessness, chest pain or dysrhythmia urgently; consider myocarditis–myositis–myasthenia overlap. Do not wait for all features or for the next infusion.')
 mt.setdefault('ongoing',[]).append('During a treatment hold, record the original event and grade, recurrence, any permanent-stop criterion, current recovery and steroid/hormone plan before considering rechallenge. Controlled grade 2 adrenal/hypophysitis has a hormone-control review path; it is not automatic treatment clearance.')
 for child in d.get('context_profiles',[]):updateprofile(child,code)
for d in kb['regimen_profiles']:
 if not any(c in d['protocol_id']for c in ['00455','00558']):continue
 d=copy.deepcopy(d);code='00455' if '00455' in d['protocol_id']else'00558';updateprofile(d,code)
 d['shared_indication_audit_v08445']={'label':'Shared protocol indication audit; not a new patient-service claim','source_pages':'NCCP pp1,3–4','notes':eligibility,'patient_service_scope_unchanged':True}
 d['key_points'].append('Shared-protocol eligibility audit now includes head-and-neck, adjuvant RCC, urothelial and cervical maintenance selection. These are distinct from the existing lung, colorectal and melanoma patient-service contexts.')
 profiles.append(d)
manifest['clinician_profiles_proposal']=save('clinician-profiles.json',{'schema_version':kb['schema_version'],'release':'0.84.45','source_checked_date':'2026-11-07','regimen_profiles':profiles,'evidence_policy':'Preserve all existing context-specific evidence/endpoints; no new efficacy estimates. Shared-indication audit notes describe clinical engine coverage, not additional patient suites.','clinical_use_authorised':False})
# The shared consent profile is used by monotherapy and combination services; preserve general immune-module risks.
consent=read('data/consent-content-v0710.json');cp=copy.deepcopy(consent['agent_profiles']['pembrolizumab']);cp['review_status']='source_reconciled_pending_clinical_and_oncology_pharmacy_review';cp['source_checked_date']='2026-11-07';cp['source_basis']='Current NCCP00455v16/00558v13 and EMA Keytruda IV SmPC §§4.2,4.4 and patient leaflet. Regimen setting, partner-drug risks and individual discussion remain required.';cp['source_urls']=['https://healthservice.hse.ie/documents/6903/Pembrolizumab_200mg_Monotherapy_455.pdf','https://healthservice.hse.ie/documents/6389/Pembrolizumab_400mg_monotherapy_558_.pdf','https://www.ema.europa.eu/en/documents/product-information/keytruda-epar-product-information_en.pdf']
cp['risks']=copy.deepcopy(consent['generic_modules']['immune_checkpoint_inhibitor']['risks'])
for risk in cp['risks']:
 if risk['id']=='muscle':risk['detail']+=' Pembrolizumab can cause a named overlap of heart, muscle and nerve-to-muscle inflammation; new weakness with vision, breathing, chest or heartbeat symptoms needs immediate assessment.'
 if risk['id']=='management':risk['detail']+=' Feeling better does not erase a previous permanent-stop decision. Restart requires review of the original event, recovery and steroid/hormone management; some endocrine conditions remain treatable with hormone replacement.'
cp['rare_immune_events']=[{'id':'myocarditis_myositis_myasthenia_overlap','label':'Heart, muscle and nerve-to-muscle inflammation together','detail':warning,'tier':'serious','source_url':cp['source_urls'][-1]}]
cp['clinical_use_authorised']=False
manifest['consent_profile_proposal']=save('pembrolizumab-consent-profile.json',cp)
manifest['consent_integration']='Replace only agent_profiles.pembrolizumab in data/consent-content-v0710.json; preserve other drug profiles and all generic modules. Use existing renderer to check complete risks and source annotations.'
save('service-patch-plan.json',manifest)
print(json.dumps({'patient_routes':len(manifest['patient_proposals']),'anatomical_anchors_preserved':sum(x['anatomy_count']for x in manifest['patient_proposals']),'clinician_profiles':len(profiles),'consent_risks':len(cp['risks'])},indent=2))
