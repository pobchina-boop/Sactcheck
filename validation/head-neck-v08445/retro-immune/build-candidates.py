"""Add source-specific omissions while retaining the v44 rule predicates/actions.
No protocol source files are changed: candidates and immutable evidence remain here.
"""
import copy, hashlib, json, subprocess
from pathlib import Path
R=Path(__file__).resolve().parent; REPO=R.parents[2]
FILES={'00455':'protocols/shared/00455-pembrolizumab-200-mg-monotherapy.json','00558':'protocols/shared/00558-pembrolizumab-400mg-monotherapy.json'}
DATE='2026-11-07'; EMA='https://www.ema.europa.eu/en/documents/product-information/keytruda-epar-product-information_en.pdf'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def canon(d):return hashlib.sha256(json.dumps(d,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()).hexdigest()
def C(f,op,v=None):return dict(field=f,operator=op,**({'value':v} if op not in ['missing','exists'] else {}))
def ALL(*a):return {'all':list(a)}
def ANY(*a):return {'any':list(a)}
def missing_false(f):return ANY(C(f,'missing'),C(f,'==',False))
records={}
for code,filename in FILES.items():
 path=REPO/filename; baseline_path=R/(code+'-baseline.json')
 if not baseline_path.exists():baseline_path.write_bytes(path.read_bytes())
 base=json.loads(baseline_path.read_text()); d=copy.deepcopy(base);version='16' if code=='00455' else '13';u=d['metadata']['source_url']
 inputs=d['input_definitions']; rules=d['rule_engine']['rules']; new=[]
 def source(page,table='Eligibility / exclusions',ema=False):
  return {'document': 'EMA Keytruda IV SmPC' if ema else f'NCCP {code} v{version}','url':EMA if ema else u,'page':page,'table':table,'checked_date':DATE,**({'section':'4.2 Table 1; 4.4'} if ema else {})}
 def rule(id,cond,text,page=4,action='consultant_review',table='Eligibility / exclusions',ema=False):
  r=dict(rule_id='HN45_'+id,priority=940 if action=='withhold' else 950 if action=='permanently_discontinue' else 200,when=cond,action={'type':action,'components':['pembrolizumab'],'recommendation':text},explanation=text,source=source(page,table,ema));rules.append(r);new.append(r['rule_id'])
 hn=C('indication_id','in',[code+'-head-neck',code+'h']);rcc=C('indication_id','==',code+'m');uro=C('indication_id','in',[code+'e',code+'f']);uf=C('indication_id','==',code+'f');ue=C('indication_id','==',code+'e');cx=C('indication_id','in',[code+'-gyn',code+'j']);hp=4 if code=='00455' else 3
 def inp(f,label,cond=None,typ='boolean',help='',**kw):
  inputs[f]=dict(label=label,type=typ,required=False,demo_value='',input_role='decision',ui_section='treatment_context',help=help,source_url=u,**kw)
  if cond:inputs[f].update(visible_when=cond,required_when=cond)
 def confirm(f,label,cond,text,page=4):
  inp(f,label,cond);rule(f.upper(),ALL(cond,missing_false(f)),text,page)
 for f,label,text in [
 ('hn_adult','Adult patient with HNSCC','Confirm adulthood for the selected HNSCC indication; a blank or negative answer does not establish eligibility.'),
 ('hn_first_line','First-line treatment for recurrent/metastatic HNSCC','Confirm this is first-line treatment for metastatic or unresectable recurrent HNSCC.'),
 ('hn_histology_confirmed','Histologically or cytologically confirmed HNSCC','Confirm histological or cytological HNSCC diagnosis.'),
 ('hn_recurrent_metastatic_incurable_by_local_therapy','Recurrent/metastatic HNSCC considered incurable by local therapies','Confirm recurrent/metastatic HNSCC considered incurable by local therapies; the selected monotherapy indication is not a curative local-treatment pathway.')]:confirm(f,label,hn,text,1 if f in ['hn_adult','hn_first_line'] else hp)
 inp('hn_nasopharyngeal_primary','Nasopharyngeal primary tumour',hn)
 rule('HN_NASOPHARYNGEAL',ALL(hn,ANY(C('hn_nasopharyngeal_primary','missing'),C('hn_nasopharyngeal_primary','==',True))),'Confirm the primary site: NCCP eligibility for this HNSCC indication excludes nasopharyngeal cancer.',hp)
 rule('HN_PDL1_ASSAY',ALL(hn,missing_false('pd_l1_validated')),'Confirm PD-L1 CPS by a validated assay before establishing HNSCC eligibility.',hp)
 rule('HN_CPS_MISSING',ALL(hn,C('pd_l1_cps','missing')),'Record the HNSCC PD-L1 CPS; the NCCP threshold is at least 1.',hp)
 rule('HN_CPS_LOW',ALL(hn,C('pd_l1_cps','<',1)),'PD-L1 CPS below 1 is outside the selected HNSCC indication.',hp)
 inp('hn_prior_curative_systemic_therapy','Previous curatively intended systemic treatment for locoregionally advanced HNSCC',hn)
 inp('hn_months_completion_to_progression','Months from completion of curatively intended systemic therapy to progression',ALL(hn,C('hn_prior_curative_systemic_therapy','==',True)),typ='number',min=0,max=1200,step=0.01,unit='months',help='Use treatment completion to documented progression, not time since the last clinic visit. Exactly six months requires source boundary review.')
 rule('HN_PRIOR_CURATIVE_UNASSESSED',ALL(hn,C('hn_prior_curative_systemic_therapy','missing')),'Establish prior curatively intended systemic treatment and, if given, the completion-to-progression interval before applying the six-month exclusion.',4)
 rule('HN_RELAPSE_INTERVAL_UNASSESSED',ALL(hn,C('hn_prior_curative_systemic_therapy','==',True),C('hn_months_completion_to_progression','missing')),'Record the interval from completing curatively intended systemic therapy to progressive HNSCC; progression within six months is excluded.',4)
 rule('HN_RELAPSE_WITHIN_SIX_MONTHS',ALL(hn,C('hn_prior_curative_systemic_therapy','==',True),C('hn_months_completion_to_progression','<',6)),'Progression within six months of completing curatively intended systemic treatment is an NCCP exclusion for this HNSCC indication. Consultant/pharmacy review is required; do not infer eligibility.',4)
 rule('HN_RELAPSE_EXACT_SIX_MONTHS',ALL(hn,C('hn_prior_curative_systemic_therapy','==',True),C('hn_months_completion_to_progression','==',6)),'The source uses “within six months” without explicitly resolving the exact six-month boundary. Confirm dates and obtain consultant/pharmacy interpretation; do not treat the boundary as automatic eligibility.',4)
 for f,label,text in [('rcc_adult','Adult patient with RCC','Confirm adulthood for the adjuvant RCC indication.'),('rcc_clear_cell_confirmed','Histologically confirmed clear cell RCC','Confirm clear cell RCC histology; the source eligibility does not cover every RCC subtype.'),('rcc_increased_recurrence_risk','RCC at increased recurrence risk after surgery','Confirm increased recurrence risk for the adjuvant RCC indication.'),('rcc_nephrectomy_required_resection_complete','Nephrectomy and any indicated metastatic-lesion resection completed','Confirm nephrectomy, with metastatic-lesion resection where applicable, for the selected adjuvant RCC indication.')]:confirm(f,label,rcc,text,4 if f=='rcc_clear_cell_confirmed' else 1)
 inp('rcc_starting_adjuvant','Starting the postoperative adjuvant RCC course now',rcc)
 inp('rcc_weeks_since_surgery','Weeks since RCC surgery when starting adjuvant pembrolizumab',ALL(rcc,C('rcc_starting_adjuvant','==',True)),typ='number',min=0,max=1000,step=0.01,unit='weeks')
 rule('RCC_START_UNASSESSED',ALL(rcc,C('rcc_starting_adjuvant','missing')),'Establish whether the adjuvant RCC course is starting now before applying the postoperative initiation window.',4)
 rule('RCC_SURGERY_WINDOW_UNASSESSED',ALL(rcc,C('rcc_starting_adjuvant','==',True),C('rcc_weeks_since_surgery','missing')),'Record weeks since surgery: adjuvant RCC pembrolizumab should start within 12 weeks.',4)
 rule('RCC_SURGERY_WINDOW_LATE',ALL(rcc,C('rcc_starting_adjuvant','==',True),C('rcc_weeks_since_surgery','>',12)),'Starting adjuvant RCC pembrolizumab beyond 12 weeks after surgery is outside the source initiation window; seek consultant/pharmacy review.',4)
 for f,label,text in [('uro_adult','Adult patient with urothelial cancer','Confirm adulthood for the selected urothelial indication.'),('uro_histology_confirmed','Source-appropriate urothelial histology/cytology confirmed','Confirm urothelial histology/cytology and site. After platinum the source requires predominantly transitional-cell features; first-line allows transitional-cell or mixed histology.'),('uro_advanced_unresectable_metastatic','Locally advanced/unresectable or metastatic urothelial cancer','Confirm the advanced disease setting for the selected urothelial indication.')]:confirm(f,label,uro,text,3 if f=='uro_histology_confirmed' else 1)
 confirm('uro_first_line','First-line advanced urothelial treatment',uf,'Confirm the first-line urothelial setting for this cisplatin-ineligible pathway.',3)
 confirm('uro_cisplatin_ineligible','Ineligible for cisplatin-containing chemotherapy',uf,'Confirm cisplatin ineligibility; it is required for this first-line urothelial pathway.',3)
 confirm('uro_progression_after_platinum','Urothelial progression/recurrence after first-line platinum',ue,'Confirm urothelial progression/recurrence after first-line platinum-containing chemotherapy (cisplatin or carboplatin).',3)
 rule('URO_PDL1_ASSAY',ALL(uf,missing_false('pd_l1_validated')),'Confirm a validated PD-L1 CPS assay for the first-line cisplatin-ineligible urothelial indication.',3)
 rule('URO_CPS_MISSING',ALL(uf,C('pd_l1_cps','missing')),'Record urothelial PD-L1 CPS. The indication table says ≥10 and eligibility text says >10; exact 10 requires source reconciliation.',3)
 for f,label,text in [('cervical_adult','Adult patient with cervical cancer','Confirm adulthood for this cervical maintenance indication.'),('cervical_induction_completed','Induction chemotherapy component completed','Confirm completion of the induction chemotherapy component before selecting pembrolizumab cervical maintenance monotherapy.'),('cervical_persistent_recurrent_metastatic','Persistent, recurrent or metastatic cervical cancer','Confirm the persistent, recurrent or metastatic cervical cancer setting.')]:confirm(f,label,cx,text,1)
 rule('CERVICAL_PDL1_ASSAY',ALL(cx,missing_false('pd_l1_validated')),'Confirm cervical PD-L1 CPS by a validated test.',hp)
 rule('CERVICAL_CPS_MISSING',ALL(cx,C('pd_l1_cps','missing')),'Record cervical PD-L1 CPS; maintenance indication requires CPS at least 1.',1)
 rule('CERVICAL_CPS_LOW',ALL(cx,C('pd_l1_cps','<',1)),'Cervical PD-L1 CPS below 1 is outside this maintenance indication.',1)
 rule('CARDIAC_NEURO_G2_HOLD',ANY(*[C(f,'==',2) for f in ['myocarditis_grade','encephalitis_grade','guillain_barre_grade']]),'Withhold for grade 2 immune-mediated myocarditis, encephalitis or Guillain–Barré syndrome and arrange urgent specialist assessment. Grade 3–4 named events require permanent discontinuation. Safety of restarting after immune myocarditis is not established.',6,'withhold','Table 1 other immune-related events; EMA SmPC 4.2/4.4')
 inputs['pembro_overlap_syndrome_grade']=copy.deepcopy(inputs['myocarditis_grade']);inputs['pembro_overlap_syndrome_grade'].update(label='Myocarditis–myositis–myasthenia gravis overlap syndrome: highest individual CTCAE grade',demo_value='',help='Clinician-confirmed overlap of two or all three named conditions. Enter the most severe individual event grade; suspected symptoms require urgent assessment.',source_url=EMA,grading_source_url=EMA,grading_source_label='EMA Keytruda IV SmPC Table 1, CTCAE v4.0',ctcae_category='myocarditis_myositis_myasthenia_gravis_overlap')
 rule('OVERLAP_G2_HOLD',C('pembro_overlap_syndrome_grade','==',2),'Withhold for grade 2 myocarditis–myositis–myasthenia gravis overlap syndrome until grade 0–1 recovery and specialist review. Grade is the highest of the individual overlapping events.',8,'withhold','4.2 Table 1 overlap syndrome',True)
 rule('OVERLAP_G3_G4_STOP',C('pembro_overlap_syndrome_grade','>=',3),'Permanently discontinue for grade 3–4 myocarditis–myositis–myasthenia gravis overlap syndrome. Grade is the highest of the individual overlapping events.',8,'permanently_discontinue','4.2 Table 1 overlap syndrome',True)
 inputs['endocrine_status']['options'].append({'value':'adrenal_g2_controlled','label':'Grade 2 adrenal insufficiency/hypophysitis, now controlled by hormone replacement'})
 rule('ENDOCRINE_G2_CONTROLLED_REVIEW',C('endocrine_status','==','adrenal_g2_controlled'),'The source grade 2 adrenal/hypophysitis hold lasts until controlled by hormone replacement. Confirm clinical stability and specialist plan; this is not automatic global treatment clearance.',6 if code=='00455' else 5,'consultant_review','Table 1 endocrine exception')
 inp('pembro_prior_permanent_stop','Any previous event meeting pembrolizumab permanent-discontinuation criteria',C('pembro_restart_requested','==',True),help='Review the documented immune-event history even when current symptoms and laboratory values have recovered. A prior permanent-stop event is not cleared by recovery or steroid taper.')
 inputs['pembro_prior_permanent_stop']['ui_section']='clinical'
 rule('PEMBRO_RESTART_HISTORY_UNASSESSED',ALL(C('pembro_restart_requested','==',True),C('pembro_prior_permanent_stop','missing')),'Before considering restart, establish whether any prior event required permanent discontinuation. Recovery and steroid-taper confirmations alone do not establish that rechallenge is permitted.',6,'withhold','Table 1 permanent-discontinuation rules')
 rule('PEMBRO_PRIOR_PERMANENT_STOP',C('pembro_prior_permanent_stop','==',True),'A documented prior event requiring permanent discontinuation prevents routine pembrolizumab restart, including after current symptom recovery or completion of steroid taper.',6,'permanently_discontinue','Table 1 permanent-discontinuation rules')
 changed=[]
 if code=='00558':
  r=next(r for r in rules if r['rule_id']=='MEL41_PLAN_UNASSESSED');text='Confirm postoperative adjuvant melanoma treatment before interpreting surgery and cycle counts. The discretionary stage IIIB preoperative/postoperative option is specified in the separate 200 mg NCCP regimen; it is not a 400 mg schedule.';r['action']['recommendation']=text;r['explanation']=text;changed=['MEL41_PLAN_UNASSESSED: recommendation/explanation only; predicates and action type preserved']
 d['protocol_id']=f'nccp-{code}-v{version}';d['metadata']['canonical_protocol_id']=d['protocol_id'];d['metadata']['source_document_pages']=10 if code=='00455' else 9
 d['metadata']['source_checked_date']=DATE;d['metadata']['clinical_audit_release']='0.84.45';d['metadata']['source_pdf_sha256']=sha(R/(code+'-current.pdf'))
 d['metadata']['retrospective_audit_v08445']=dict(source_retrieved=DATE,source_version=version,source_bytes_unchanged=True,scope='Source-reconciled missing HNSCC/RCC/urothelial/cervical indication checks and named immune-toxicity/restart paths; all prior clinical rule predicates/actions preserved.',new_rule_ids=new,prior_rule_text_corrections=changed,clinical_use_authorised=False,independent_clinical_approval=False)
 d['metadata']['validation'].update(audit_release='0.84.45',rule_level_source_reconciliation_status='source_reconciled_v08445_independent_review_pending',consultant_reviewed=False,oncology_pharmacy_reviewed=False,clinical_use_authorised=False)
 dest=R/(code+'-candidate.json');dest.write_text(json.dumps(d,indent=2,ensure_ascii=False)+'\n')
 records[code]=dict(protocol_path=filename,baseline_path=str((R/(code+'-baseline.json')).relative_to(REPO)),baseline_sha256=sha(R/(code+'-baseline.json')),baseline_rule_count=len(base['rule_engine']['rules']),baseline_rule_ids=[x['rule_id'] for x in base['rule_engine']['rules']],baseline_rules_canonical_sha256=canon(base['rule_engine']['rules']),candidate_sha256=sha(dest),new_rule_ids=new,old_rule_text_only_correction=changed,old_protocol_id=base['protocol_id'],new_protocol_id=d['protocol_id'])
 print(code,len(base['rule_engine']['rules']),'old',len(new),'new',len(rules),'total')
chain=dict(release='0.84.45',baseline_git_sha='a4575d67a985c97a1dfa545813a8c1a25b2ed5a2',records=records,immutable_files={})
for rel in ['validation/skin-melanoma-v08440/clinical-migration.json','validation/skin-melanoma-v08440/retrospective-source-audit/source-cases.cjs','validation/skin-melanoma-v08440/retrospective-source-audit/source-case-results-candidate.json','validation/skin-melanoma-v08441/clinical-migration.json','validation/skin-melanoma-v08441/source-cases.cjs','validation/skin-melanoma-v08441/source-case-results-candidate.json']:
 chain['immutable_files'][rel]=sha(REPO/rel)
for release in ['0.84.40','0.84.41']:
 m=json.loads((REPO/f'validation/skin-melanoma-v{release.replace(".","")}/clinical-migration.json').read_text())
 for code in FILES:
  rec=m['records'][code]
  if 'hashes' in rec:
   for f in rec['hashes']:
    if f.startswith('validation/'):chain['immutable_files'][f]=sha(REPO/f)
  else:
   for k in ['baseline_path','source_path','case_path','result_path']:
    f=rec.get(k)
    if f:chain['immutable_files'][f]=sha(REPO/f)
(R/'clinical-chain.json').write_text(json.dumps(chain,indent=2)+'\n')
