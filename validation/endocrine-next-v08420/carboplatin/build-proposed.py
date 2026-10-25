"""Reviewed carboplatin monotherapy proposals; does not modify production files."""
from pathlib import Path
import json,hashlib,copy,re
H=Path(__file__).resolve().parent;R=H.parents[2];DATE='2026-10-25';V='0.84.20'
RESEARCH=R.parent/'research-v20/carboplatin'
def save(p,x):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def C(f,o,v=None):return dict(field=f,operator=o,**({'value':v} if v is not None else {}))
def A(*x):return dict(all=list(x))
def Y(*x):return dict(any=list(x))
def N(label,unit='',minimum=0,maximum=2000,demo=80,**kw):return dict(label=label,type='number',required=False,min=minimum,max=maximum,step=.01,unit=unit,demo_value=demo,ui_section='labs',input_role='decision',always_show=True)|kw
def B(label,demo=False,**kw):return dict(label=label,type='boolean',required=False,demo_value=demo,ui_section='clinical',input_role='decision',always_show=True)|kw
def S(label,opts,**kw):return dict(label=label,type='select',required=False,options=[dict(value=a,label=b)for a,b in opts],demo_value=opts[0][0],ui_section='treatment_context',input_role='context',always_show=True)|kw
for code,days in [('00251',28),('00261',21)]:
 source_file=next((H.parent/'baseline').glob(code+'-*'));d=json.loads(source_file.read_text());m=d['metadata'];url=m['source_url'];ver=str(m['nccp_version'])
 d['status']='source_reconciled_rule_encoding_pending_independent_validation'
 m.update(review_date='2021-07-28',sactcheck_encoding_version=V,source_checked_date=DATE,source_version_verified_date=DATE,source_version_date='2026-06-12',source_publication_date='2015-09-10',source_last_reviewed_date='2021-07-28',source_review_schedule='As required from 20 May 2026; version-control update 12 June 2026',source_pdf_sha256=hashlib.sha256((RESEARCH/(code+'.pdf')).read_bytes()).hexdigest(),source_text_sha256=hashlib.sha256((RESEARCH/(code+'.txt')).read_bytes()).hexdigest(),full_suite_release=V,support_source_page=4)
 m['validation'].update(source_document_checked=True,software_tests_completed=False,consultant_reviewed=False,oncology_pharmacy_reviewed=False,clinical_use_authorised=False,rule_level_source_reconciliation_status='source_reconciled_pending_independent_clinical_and_oncology_pharmacy_validation')
 m['encoding_maturity'].update(level='source_reconciled_rule_encoding',label='Source reconciled; independent clinical and oncology pharmacy review pending',source_reconciled=True,reconciled_release=V,reconciled_date=DATE,consultant_reviewed=False,oncology_pharmacy_reviewed=False,clinical_use_authorised=False,scope_note='Current NCCP all-indication source reviewed, with separate q21/q28 count boundaries, renal method and creatinine trend. No automatically chosen AUC or final milligram prescription.')
 m['indication']='Adjuvant, advanced or platinum-sensitive recurrent ovarian/primary peritoneal/fallopian tube cancer under the source-specific criteria; metastatic breast cancer.'+(' Also concurrent chemoradiation for locally advanced head and neck SCC when cisplatin is unsuitable.' if days==21 else '')
 m['treatment_setting']=['adjuvant','advanced','metastatic']+(['chemoradiation']if days==21 else [])
 m['treatment_context']=['breast','advanced_breast','gynaecology','ovarian']+(['head_neck','head_neck_squamous_cell']if days==21 else [])
 m['audit_limitations']=['Supplementary HPRA PA2059/032/001 SmPC dated 2 July 2024 supplies safety precautions. Its general labelled dose/count schedule is not silently substituted for the distinct NCCP off-label protocols.','Independent clinical/pharmacy validation and local authorisation remain pending.','The selected AUC, verified renal method, prior dose history and current renal result require consultant/pharmacy verification; this encoding does not select AUC or emit a final milligram dose.','NCCP caps the GFR used in the Calvert calculation at125 mL/min; it does not authorise directly substituting indexed eGFR.','The breast indication is off-label in Ireland and requires local discussion/consent and DTC-equivalent acknowledgement.']
 if days==28:m['audit_limitations'].append('The physically rendered q28 count table uses ANC>1 and platelets>100, with <1/<100 delay; equality is not assigned and remains review.')
 else:m['audit_limitations'].append('The physically rendered q21 table uses ANC≥1 and platelets≥100. Text extraction drops the underline/equality; visual source inspection controls this boundary.')
 d['clinical_governance'].update(disclaimer=f'NCCP {code} v{ver} source reconciled {DATE}; independent clinical and oncology pharmacy review pending. Verify the actual AUC, renal method and local plan.',off_label_note='Metastatic breast use is off-label in Ireland; explain and consent under local policy and confirm DTC or equivalent acknowledgement. No reimbursement approval is inferred from an N/A table entry.')
 indications=[]
 organs=[('ovarian carcinoma of epithelial origin','C56'),('primary peritoneal carcinoma','C48'),('fallopian tube cancer','C57')]
 for j,(setting,desc,intent)in enumerate([('adjuvant','First-line adjuvant treatment where combination therapy is unsuitable','adjuvant'),('advanced','First-line advanced stage3/4 disease where surgery is not feasible and combination therapy is unsuitable','advanced_disease'),('recurrent','Platinum-sensitive recurrent disease','advanced_disease')]):
  for k,(organ,icd)in enumerate(organs):
   suffix=chr(ord('a')+j*3+k);ident=code+'-gyn' if suffix=='a' else code+suffix
   indications.append(dict(indication_id=ident,code=code+suffix,description=desc+': '+organ+'.',tumour_groups=['Gynaecology'],icd10=icd,intent=intent,cycle_length_days=days,duration_type='until_progression_or_toxicity'))
 indications.append(dict(indication_id=code+'j',code=code+'j',description='Metastatic breast carcinoma; off-label indication in Ireland.',tumour_groups=['Breast'],icd10='C50',intent='advanced_disease',cycle_length_days=days,duration_type='until_progression_or_toxicity',off_label=True))
 if days==21:indications.append(dict(indication_id='00261-head-neck',code='00261k',description='Concurrent chemoradiation for stage III–IV locally advanced head and neck squamous carcinoma when cisplatin is unsuitable; AUC5.',tumour_groups=['Head and Neck'],icd10='C76',intent='curative',cycle_length_days=21,planned_cycles=3))
 d['indications']=indications
 m['regimen_card']={'contexts':[dict(id=x['indication_id'],indication_id=x['indication_id'],intent=x['intent'],cycle_length_days=days,**({'planned_cycles':3}if x['code']=='00261k'else{'duration_type':'until_progression_or_toxicity'}),provenance='NCCP source p1; current source indication, not inferred from prior treatment')for x in indications]}
 schedule=f'Carboplatin AUC4–6, selected by the treating consultant, as a Day1 IV infusion every {days} days; breast/gynaecology treatment continues while beneficial and tolerated.'
 m['schedule_summary']=schedule
 admin=dict(drug='carboplatin',dose='AUC 4–6; confirm prescribed target and verified Calvert calculation',day=[1],route='IV infusion',infusion_minutes=30,diluent='500 mL glucose5%',notes='Dose in mg = selected AUC × (verified GFR +25); GFR used must not exceed125 mL/min. Do not treat the AUC range as a fixed dose or use indexed eGFR without appropriate verification.')
 d['treatment_phases']=[dict(phase_id='monotherapy',name=f'Breast/gynaecology carboplatin every {days} days',label=f'Carboplatin monotherapy · every {days} days',cycle_length_days=days,indication_ids=[x['indication_id']for x in indications if x['code']!='00261k'],duration_text='Until disease progression or unacceptable toxicity',administration=[admin])]
 if days==21:d['treatment_phases'].append(dict(phase_id='head_neck_chemoradiation',name='Head and neck chemoradiation',label='Head and neck only · concurrent radiotherapy',cycle_length_days=21,planned_cycles=3,indication_ids=['00261-head-neck'],administration=[dict(admin,dose='AUC 5; verify renal method and Calvert calculation')],schedule_summary='Three cycles every21days with concurrent radiotherapy; this is not the breast monotherapy duration.'))
 d['treatment']={'cycle_length_days':days,'days':[1],'drugs':['carboplatin'],'starting_dose':'AUC 4–6 (Consultant selected)','schedule_summary':schedule,'dose_formula':'Dose (mg) = selected AUC × (verified GFR [mL/min] +25); cap GFR used at125mL/min.'}
 i={
 'hypersensitivity':B('Relevant carboplatin/excipient hypersensitivity'),
 'platinum_progression':B('Disease progressed while receiving platinum chemotherapy'),
 'pregnancy':B('Pregnant'), 'breastfeeding':B('Breastfeeding'),
 'indication_eligible':B('Exact source indication confirmed',True),
 'disease_context':S('Current treatment context',[('breast_metastatic','Metastatic breast cancer'),('gyn_adjuvant','Adjuvant ovarian/peritoneal/fallopian tube'),('gyn_advanced','Advanced ovarian/peritoneal/fallopian tube'),('gyn_recurrent','Platinum-sensitive recurrent ovarian/peritoneal/fallopian tube')]+([('head_neck','Head and neck chemoradiation')]if days==21 else [])+[('other','Other / not established')]),
 'ecog':N('ECOG performance status','',maximum=4,demo=0,ui_section='clinical'),
 'ps3_due_to_advanced_gynaecologic_cancer':B('ECOG3 is caused by advanced ovarian/peritoneal/fallopian tube cancer'),
 'individual_count_thresholds_confirmed':B('Individual count thresholds agreed for ECOG2/3',True),
 'anc':N('ANC','×10⁹/L',maximum=50,demo=2),
 'platelets':N('Platelets','×10⁹/L',maximum=2000,demo=200),
 'gfr':N('Verified GFR / CrCl for carboplatin dosing','mL/min',maximum=250,demo=90,renal_input={'mode':'exact_continuous','exact_value_required':True,'reason':'Continuous renal value supports carboplatin safety review and verified Calvert calculation; do not use indexed eGFR directly.'},assessment_guidance='Use a verified measured GFR, Wright GFR or Cockcroft–Gault CrCl in mL/min. Record the method. NCCP caps the GFR used in the Calvert calculation at125mL/min.'),
 'renal_measure_type':S('Renal-function method',[('measured','Isotope / measured GFR (mL/min)'),('cockcroft_gault','Cockcroft–Gault CrCl (mL/min)'),('wright','Wright estimated GFR (mL/min)'),('indexed_egfr','Indexed eGFR (mL/min/1.73m²)'),('unknown','Method not confirmed')]),
 'creatinine_result_age_hours':N('Age of serum-creatinine result at planned administration','hours',maximum=1000,demo=24),
 'baseline_creatinine':N('Creatinine at isotope-GFR measurement','µmol/L',minimum=.01,demo=80,assessment_guidance='Only for checking whether the prior isotope-GFR dose can remain unchanged; use the result from the time of that measurement.'),
 'current_creatinine':N('Current serum creatinine','µmol/L',minimum=.01,demo=80),
 'creatinine_ratio_baseline':N('Calculated current/isotope-baseline creatinine','ratio',maximum=200000,demo=1,ui_derived_from='current_creatinine',derived_value={'operation':'ratio','fields':['current_creatinine','baseline_creatinine']}),
 'renal_estimation_unreliable':B('Obesity, low muscle mass/creatinine or clinical change makes estimated GFR unreliable'),
 'acute_renal_deterioration':B('Acute kidney injury or clinically important renal deterioration'),
 'target_auc':N('Consultant-prescribed target AUC','mg·min/mL',maximum=10,demo=5,ui_section='treatment_context',assessment_guidance='Enter the actual prescribed AUC; the usual range is4–6. This value does not itself authorise an mg dose or an increase from a previously reduced dose.'),
 'prior_dose_reduction':B('Previous carboplatin dose/AUC reduction requiring reconciliation'),
 'hepatic_impairment':B('Hepatic impairment'),
 'febrile_neutropenia_prior':B('Febrile neutropenia in previous treatment'),
 'prior_myelosuppression_delay':B('Previous delay for myelosuppression'),
 'acute_fever_or_infection':B('Current fever, suspected infection or febrile neutropenia'),
 'suspected_infusion_reaction':B('Suspected current infusion reaction'),
 'new_or_worsening_neuropathy':B('New or worsening numbness, tingling or other neurological symptoms'),
 'new_hearing_symptoms':B('New tinnitus or hearing change'),
 'concurrent_nephrotoxic_medicine':B('Concurrent potentially nephrotoxic medicine needing review'),
 'concurrent_ototoxic_medicine':B('Concurrent potentially ototoxic medicine needing review'),
 'required_tests_unresolved':B('Required blood tests, renal result or review unresolved'),
 'antiemetic_plan_confirmed':B('High-risk carboplatin antiemetic plan confirmed',True),
 'off_label_governance_confirmed':B('Breast off-label discussion, consent and local acknowledgement confirmed',True),
 'planned_interval_days':N('Planned interval between carboplatin treatments','days',minimum=1,maximum=100,demo=days,ui_section='treatment_context')}
 if days==21:i.update(head_neck_radiotherapy_confirmed=B('Concurrent radiotherapy confirmed for head/neck indication',True),cycle_number=N('Cycle number','',minimum=1,maximum=100,demo=1,ui_section='treatment_context'))
 i.update(other_platinum_hypersensitivity=B('Relevant hypersensitivity to another platinum medicine'),extensive_pretreatment=B('Extensive pretreatment meeting the SmPC Calvert warning',assessment_guidance='Prior mitomycin C, nitrosourea, doxorubicin/cyclophosphamide/cisplatin, a combination of at least 5 agents, or radiotherapy ≥4500 rad (45 Gy) to a 20×20 cm field or more than one field. Confirm treatment records and obtain specialist dose review.'),bleeding_tumour=B('Known bleeding tumour'),severe_myelosuppression=B('Clinically severe marrow suppression'),yellow_fever_vaccine=B('Concurrent yellow-fever vaccine'),other_live_vaccine=B('Concurrent or planned other live vaccine'),phenytoin_fosphenytoin=B('Concurrent phenytoin or fosphenytoin'),concurrent_radiotherapy=B('Concurrent radiotherapy requiring a coordinated marrow-risk plan'),warfarin=B('Concurrent warfarin / vitamin-K antagonist'),significant_new_hepatic_deterioration=B('Moderate/severe new deterioration in liver tests or liver injury'))
 d['input_definitions']=i;d['required_inputs']=[];d['assessment_profiles']=[{'id':'default','label':'Rapid partial assessment','required_inputs':[],'context':{}}]
 rules=[]
 def add(ident,when,action,text,page=4,interpretation=None):
  a=dict(type=action,components=['carboplatin'],message=text,show_in_dose_actions=True)
  if action not in ['proceed','proceed_with_caution']:a.update(block_numeric_dose=True,dose_calculation='specialist_review')
  rule=dict(id='CARBO'+code+'_'+ident,priority=100 if action in ['contraindicated','withhold','delay','discontinue']else 70,when=when,action=a,explanation=text,source=dict(document=f'NCCP {code} v{ver}',url=url,page=page,checked_date=DATE))
  if interpretation:rule['source']['interpretation_note']=interpretation
  rules.append(rule)
 add('HYPERSENSITIVITY',C('hypersensitivity','==',True),'contraindicated','Do not administer routinely with carboplatin/excipient hypersensitivity. The source permits exceptional rechallenge after a prior mild reaction only with immunology advice and an agreed supervised desensitisation/resuscitation pathway; this assessment cannot authorise that exception.',3)
 add('PLATINUM_PROGRESSION',C('platinum_progression','==',True),'contraindicated','Disease progression while receiving platinum chemotherapy is a source exclusion. Reassess the treatment strategy.',3)
 for f in ['pregnancy','breastfeeding']:add(f.upper(),C(f,'==',True),'contraindicated','Pregnancy or lactation is an NCCP exclusion; do not administer without specialist reassessment of the treatment plan.',3)
 add('INDICATION',C('indication_eligible','==',False),'consultant_review','The exact NCCP indication is not confirmed. Review disease context, prior therapy and alternatives before treatment.',1)
 add('SETTING',C('disease_context','==','other'),'consultant_review','Select and verify an indication covered by this exact NCCP regimen; do not infer suitability from the medicine alone.',1)
 add('ECOG_HIGH',C('ecog','>',3),'consultant_review','ECOG above3 is outside the source eligibility; obtain consultant review.',3)
 add('ECOG3',A(C('ecog','==',3),Y(C('ps3_due_to_advanced_gynaecologic_cancer','==',False),C('ps3_due_to_advanced_gynaecologic_cancer','missing'),C('disease_context','in',['breast_metastatic','gyn_adjuvant']+(['head_neck']if days==21 else [])+['other']),C('disease_context','missing'))),'consultant_review','ECOG3 is only included where poor performance is due to advanced ovarian, primary peritoneal or fallopian tube cancer. It is not automatically an eligibility extension for metastatic breast or head/neck cancer.',3)
 add('INDIVIDUAL_COUNTS',A(C('ecog','in',[2,3]),Y(C('individual_count_thresholds_confirmed','==',False),C('individual_count_thresholds_confirmed','missing'))),'consultant_review','NCCP notes that some patients, especially ECOG2/3, may need higher treatment blood-count thresholds. Confirm the individual consultant plan; generic cut-offs do not override it.',4)
 add('ANC_LOW',C('anc','<',1),'delay','Delay for one week or until recovery for ANC<1×10⁹/L. Repeat/review counts and the individual treatment thresholds before a dose.',4)
 add('PLATELETS_LOW',C('platelets','<',100),'delay','Delay for one week or until recovery for platelets<100×10⁹/L. Reassess before treatment.',4)
 if days==28:
  for f,n in [('anc',1),('platelets',100)]:add('EXACT_'+f.upper(),C(f,'==',n),'consultant_review',f'The q28 source table leaves exact {f}={n} between its strict greater-than full-dose and less-than delay rows. Resolve this boundary with the consultant; do not import the q21 ≥ threshold.',4,'Physical PDF table inspected; equality is unassigned.')
 add('GFR_STOP',C('gfr','<=',20),'contraindicated','NCCP states carboplatin must not be administered at GFR≤20mL/min. Do not generate a Calvert dose.',4)
 add('GFR_EXTREME_CAUTION',A(C('gfr','>',20),C('gfr','<=',30)),'consultant_review','GFR>20 to30mL/min: NCCP requires extreme caution. Consultant/pharmacy verification of suitability, AUC and monitoring is required; no automatic milligram dose.',4)
 add('GFR_MYELORISK',A(C('gfr','>',30),C('gfr','<',60)),'proceed_with_caution','Creatinine clearance below60mL/min increases myelosuppression risk. Use the verified renal method and individual monitoring; this is not a fixed percentage dose reduction.',4)
 add('GFR_CAP',C('gfr','>',125),'consultant_review','NCCP caps GFR used for the Calvert calculation at125mL/min. The uncapped entered value must not produce a larger dose; confirm the selected AUC and capped calculation.',2)
 add('RENAL_METHOD',C('renal_measure_type','in',['indexed_egfr','unknown']),'consultant_review','Verify measured GFR or an appropriate Wright/Cockcroft–Gault estimate in mL/min before Calvert dosing. Indexed eGFR cannot simply be inserted as if it were unindexed GFR.',2)
 add('ESTIMATE_OLD',A(C('renal_measure_type','in',['cockcroft_gault','wright']),C('creatinine_result_age_hours','>',48)),'consultant_review','Estimated renal dosing requires serum creatinine obtained within48hours of administration. Obtain/review a current result and recalculate as required for this cycle.',4)
 add('ESTIMATE_AGE_UNKNOWN',A(C('renal_measure_type','in',['cockcroft_gault','wright']),C('creatinine_result_age_hours','missing')),'consultant_review','Confirm that serum creatinine was obtained within48hours before using Cockcroft–Gault or Wright for this cycle; the time of the result is unassessed.',4)
 add('ISOTOPE_TREND',A(C('renal_measure_type','==','measured'),C('creatinine_ratio_baseline','>',1.1)),'consultant_review','Current creatinine is more than110% of its value at the isotope-GFR measurement. The previous fixed dose cannot be carried forward automatically: consider remeasuring GFR or a verified current estimate.',4)
 add('ISOTOPE_TREND_MISSING',A(C('renal_measure_type','==','measured'),C('creatinine_ratio_baseline','missing')),'consultant_review','To decide whether the prior isotope-GFR dose can remain unchanged, both current creatinine and creatinine at that measurement are needed. A missing trend does not establish stability.',4)
 add('TREND_METHOD_UNKNOWN',A(C('creatinine_ratio_baseline','exists'),C('renal_measure_type','missing')),'consultant_review','A creatinine ratio has been calculated, but confirm whether this is the isotope-GFR baseline rule or an estimated-GFR cycle. No dose carry-forward is authorised without the renal context.',4)
 add('UNRELIABLE_ESTIMATE',C('renal_estimation_unreliable','==',True),'consultant_review','Measured GFR is preferred where obesity, low muscle mass/creatinine or postoperative change may make formula estimates inaccurate. Source weight/creatinine substitutions are discretionary and must not be applied silently.',2)
 add('LOW_CREATININE',A(C('current_creatinine','<',63),C('renal_measure_type','in',['cockcroft_gault','wright'])),'consultant_review','At serum creatinine<63µmol/L, the source permits considering62µmol/L or a steady preoperative value, with measured GFR preferred when estimates are unreliable. Confirm the chosen method; do not automatically floor or replace the entered result.',2)
 add('AKI',C('acute_renal_deterioration','==',True),'withhold','Withhold pending clinical assessment of acute renal deterioration and verification of current renal dosing. A previous GFR or creatinine ratio cannot establish current suitability.',4,'Safety interpretation of the requirement for current renal assessment; not a fixed source dose band.')
 add('AUC_OUTSIDE',Y(C('target_auc','<',4),C('target_auc','>',6)),'consultant_review','The usual source AUC is4–6. An outside-range target requires an explicit consultant plan, including prior reductions; no automatic substitution or re-escalation is performed.',1)
 add('PRIOR_REDUCTION',C('prior_dose_reduction','==',True),'consultant_review','Reconcile the current prescribed AUC/dose with prior reduction and toxicity history. The standard AUC4–6 range is not an instruction to increase a previously reduced dose.',1)
 add('LIVER',C('hepatic_impairment','==',True),'proceed_with_caution','The NCCP hepatic table requires no carboplatin-specific dose adjustment. Assess the clinical cause and other findings; this does not override renal or blood-count holds.',4)
 add('PRIOR_FN',C('febrile_neutropenia_prior','==',True),'consultant_review','Prior febrile neutropenia requires review of recovery, actual AUC, recurrent toxicity and any growth-factor plan. This source supplies no universal percentage reduction or mandatory G-CSF schedule to apply automatically.',4)
 add('PRIOR_DELAY',C('prior_myelosuppression_delay','==',True),'consultant_review','Review recovery, nadir counts, renal function and the current AUC after a prior myelosuppression delay. No automatic reduction percentage is supplied by this source.',4)
 add('FEVER',C('acute_fever_or_infection','==',True),'withhold','Current fever or suspected infection needs urgent assessment and treatment, including possible neutropenic sepsis. Withhold the planned dose pending clinical review.',5,'Withholding pending acute assessment is a safety interpretation; the NCCP directs prompt assessment/treatment.')
 add('INFUSION_REACTION',C('suspected_infusion_reaction','==',True),'withhold','Stop/withhold the infusion and assess a suspected hypersensitivity reaction urgently using the unit emergency pathway; facilities for anaphylaxis must be available.',1,'Immediate infusion interruption is a safety interpretation of the source hypersensitivity/anaphylaxis requirement.')
 add('NEUROPATHY',C('new_or_worsening_neuropathy','==',True),'consultant_review','Review new or worsening neurological symptoms and perform neurological evaluation. NCCP supplies no numeric neuropathy reduction ladder here; review dose and further treatment individually.',5)
 add('HEARING',C('new_hearing_symptoms','==',True),'consultant_review','Review tinnitus or hearing change and hearing assessment, especially after prior platinum/ototoxic treatment. No automatic hearing-to-dose percentage is defined.',5)
 add('NEPHROTOXIN',C('concurrent_nephrotoxic_medicine','==',True),'consultant_review','Avoid concurrent nephrotoxic medicines where possible; if necessary, review the interaction and monitor renal function closely. This requires an individual medicine plan.',5)
 add('OTOTOXIN',C('concurrent_ototoxic_medicine','==',True),'consultant_review','Avoid concurrent ototoxic medicines where possible. If necessary, '+('perform regular audiometric testing.'if days==28 else 'consider audiometric testing.')+' Reconcile the individual monitoring plan.',5)
 add('TESTS',C('required_tests_unresolved','==',True),'consultant_review','Resolve baseline/pretreatment FBC, renal and liver testing and verified renal dosing.'+(' The q28 source also asks for FBC atDay13–15 andDay21 in the first cycles to establish nadir.'if days==28 else ' The q21 source requires FBC, renal and liver profile before each cycle.'),3)
 add('ANTIEMETICS',C('antiemetic_plan_confirmed','==',False),'consultant_review','Carboplatin AUC≥4 is HIGH emetogenic risk. Confirm the dedicated NCCP NCISV8 carboplatin antiemetic plan; absence of routine hypersensitivity premedication does not mean no antiemetics.',4)
 add('BREAST_OFF_LABEL',A(C('disease_context','==','breast_metastatic'),C('off_label_governance_confirmed','==',False)),'consultant_review','Complete the metastatic-breast off-label discussion, consent and hospital DTC/equivalent acknowledgement before proceeding.',7)
 add('WRONG_INTERVAL',C('planned_interval_days','!=',days),'consultant_review',f'This is the {days}-day regimen. Confirm the selected protocol and individual schedule; do not silently substitute the other carboplatin interval.',1)
 if days==21:
  add('HN_AUC',A(C('disease_context','==','head_neck'),C('target_auc','exists'),C('target_auc','!=',5)),'consultant_review','NCCP specifies AUC5 for its head-and-neck chemoradiation indication. Confirm any deviation and renal calculation; the general4–6 range does not override this indication.',2)
  add('HN_RT',A(C('disease_context','==','head_neck'),C('head_neck_radiotherapy_confirmed','==',False)),'consultant_review','The head-and-neck indication requires concurrent radiotherapy. Confirm the joint oncology/radiotherapy plan.',1)
  add('HN_COURSE',A(C('disease_context','==','head_neck'),C('cycle_number','>',3)),'consultant_review','This head-and-neck course is three cycles every21days with radiotherapy. Review any proposed additional cycle; do not borrow the breast/gynaecology continuation duration.',1)
 sm='https://assets.hpra.ie/products/Human/28088/Licence_PA2059-032-001_02072024153224.pdf'
 for tag,field,action,explanation,page,section in [
 ('EXTENSIVE_PRETREATMENT','extensive_pretreatment','consultant_review','The linked HPRA SmPC states that Calvert should not be used after specified extensive pretreatment, including qualifying large-field/high-dose radiotherapy. Review the exact prior treatment, marrow reserve and specialist dose plan; do not output an automatic Calvert dose.',2,'4.2'),
 ('OTHER_PLATINUM_ALLERGY','other_platinum_hypersensitivity','contraindicated','The current linked HPRA SmPC includes hypersensitivity to other platinum compounds as a contraindication. Confirm the allergy history and specialist plan; the app cannot authorise rechallenge.',3,'4.3'),
 ('BLEEDING_TUMOUR','bleeding_tumour','contraindicated','The linked HPRA SmPC lists a bleeding tumour as a contraindication. Obtain urgent specialist review before treatment.',3,'4.3'),
 ('SEVERE_MARROW','severe_myelosuppression','contraindicated','The linked HPRA SmPC lists severe myelosuppression as a contraindication; an isolated acceptable count does not establish marrow recovery.',3,'4.3'),
 ('YELLOW_FEVER','yellow_fever_vaccine','contraindicated','Concomitant yellow-fever vaccine is contraindicated with carboplatin. Resolve the vaccine and cancer-treatment plan with the treating team.',3,'4.3'),
 ('LIVE_VACCINE','other_live_vaccine','consultant_review','Live attenuated vaccines are not recommended during carboplatin because of potentially serious infection. Discuss vaccination and timing with the treatment team.',5,'4.5'),
 ('PHENYTOIN','phenytoin_fosphenytoin','consultant_review','Phenytoin or fosphenytoin coadministration is not recommended in the linked SmPC; assess seizure control and pharmacokinetic interactions with pharmacy. Do not abruptly stop anticonvulsants.',5,'4.5'),
 ('RADIOTHERAPY','concurrent_radiotherapy','consultant_review','Radiotherapy may increase marrow suppression. Confirm the coordinated radiotherapy/carboplatin schedule and monitoring; this is an expected planned combination only in the separate q21 head-and-neck indication, not a universal prohibition.',5,'4.5'),
 ('WARFARIN','warfarin','consultant_review','The linked SmPC recommends caution and more frequent INR monitoring with warfarin. Agree the anticoagulation monitoring plan.',6,'4.5'),
 ('ACUTE_LIVER','significant_new_hepatic_deterioration','consultant_review','The NCCP hepatic table has no routine adjustment, but the linked SmPC warns that moderate/severe new renal or hepatic test deterioration may require reduction or discontinuation. Review possible injury; do not infer routine unchanged treatment.',4,'4.4')]:
  add(tag,C(field,'==',True),action,explanation,page)
  rules[-1]['source']=dict(document='HPRA carboplatin PA2059/032/001 SmPC (2 July 2024)',url=sm,page=page,section=section,version='2024-07-02',checked_date=DATE,interpretation_note='Supplementary product safety precaution; distinct NCCP schedule/count rules remain the regimen-specific source.')
 for r in rules:
  if r['id'].endswith('_ANTIEMETICS'):r['source']['additional_sources']=[dict(document='NCCP SACT Antiemetic Guidance V6 2025',url='https://healthservice.hse.ie/documents/7152/Classification_Document_for_Systemic_Anti-_Cancer_Therapy_SACT_Induced_Nausea__pWgDCrm.pdf',page=12),dict(document='NCCP NCIS Medical Oncology V8 2025',url='https://healthservice.hse.ie/documents/7180/Supportive_Care_Antiemetics_for_inclusion_NCIS_Medical_Oncology.pdf',page=4)]
 d['rule_engine']={'evaluation_mode':'highest_priority_triggered','rules':rules}
 d['output_templates']={'proceed':'Entered values did not trigger an encoded hold in the assessed domains. Unentered domains remain unassessed; complete consultant and pharmacy review.','coverage_gap':'Only entered values were assessed; omitted fields are not assumed normal.'}
 d['supportive_care'].update(emetogenic_risk='high',script_id='nccp-v8-carboplatin-v08420',mapping_basis='NCCP V6 classifies carboplatin AUC≥4 as high; NCCP NCISV8 Table1 has a dedicated carboplatin row without routine olanzapine.',supportive_medications_label='NCCP NCISV8 high-risk carboplatin AUC≥4 guidance',mapping_confidence='source_reconciled_pending_pharmacy_validation')
 d['monitoring']={'baseline':['FBC, renal and liver profile','Measured isotopeGFR preferred, otherwise a verified WrightGFR or Cockcroft–Gault estimate'], 'regular':(['FBC atDay13–15 andDay21 in the first cycles to determine nadir; subsequently before each cycle']if days==28 else['FBC before each cycle'])+['Renal and liver profile before each cycle','Neurological evaluation and hearing assessment regularly; greater attention after prior cisplatin/platinum or ototoxic medicines','Estimated renal dosing uses a creatinine result obtained within48hours of treatment; isotope-based dose carry-forward needs a verified ≤110% creatinine trend'],'disease':'Response tests and scan interval follow the consultant treatment plan; no fixed CT/echo/DXA schedule is mandated by this regimen.'}
 d['metadata']['validation']['software_tests_completed']=True
 d['metadata']['validation']['software_test_scope']='302 independent source-derived cases for this protocol pair passed; source-cases-proposed.json. Full-suite integration review is recorded separately.'
 # Improve only user-facing strings; identifiers and source URLs remain byte-stable.
 def polish(x,key=''):
  if isinstance(x,dict):return {k:polish(v,k)for k,v in x.items()}
  if isinstance(x,list):return [polish(v,key)for v in x]
  if isinstance(x,str) and key in ['label','name','description','message','explanation','notes','assessment_guidance','scope_note','schedule_summary','duration_text','mapping_basis','dose_formula','disclaimer','off_label_note']:
   x=re.sub(r'(AUC|ECOG|Day|days|at|every|within|than|below|above|to|is|for)(?=\d)',r'\1 ',x)
   x=re.sub(r'(\d)(mL|min|mg|hours|days|cycles)',r'\1 \2',x)
   x=x.replace('isotopeGFR','isotope GFR').replace('NCISV8','NCIS V8')
  return x
 d=polish(d)
 save(H/'proposed'/source_file.name,d)
 print(code,len(i),'inputs',len(rules),'source-linked rules')
