from pathlib import Path
import json,hashlib,copy
R=Path(__file__).resolve().parents[3];O=Path(__file__).resolve().parent
P=R/'protocols/neuro-oncology/00342-temozolomide-recurrent-therapy.json';p=json.loads((O/'protocol-before/00342.json').read_text())
URL='https://healthservice.hse.ie/documents/6961/342_V4_Temozolomide_Recurrent_Therapy_.pdf';EURL='https://www.ema.europa.eu/en/documents/product-information/temodal-epar-product-information_en.pdf';DATE='2026-11-05'
SHA=hashlib.sha256((O/'sources/nccp00342.pdf').read_bytes()).hexdigest();ESHA=hashlib.sha256((O/'sources/temodal-ema.pdf').read_bytes()).hexdigest()
def src(page,table=None,ema=False):
 d=dict(document='EMA Temodal SmPC, current retrieved '+DATE if ema else 'NCCP 00342 Temozolomide Recurrent Therapy v4 (23 July 2025)',url=EURL if ema else URL,page=page,retrieved=DATE,sha256=ESHA if ema else SHA)
 if table:d['section']=table
 return d
m=p['metadata'];m.update(source_document_pages=4,source_checked_date=DATE,source_pdf_sha256=SHA,source_version_date='2025-07-23',sactcheck_encoding_version='0.84.38',clinical_audit_release='0.84.38')
m['validation'].update(source_document_checked=True,software_tests_completed=True,source_audit_release='0.84.38',audit_release='0.84.38',rule_level_source_reconciliation_status='source_reconciled_pending_independent_clinical_and_oncology_pharmacy_validation',consultant_reviewed=False,oncology_pharmacy_reviewed=False,clinical_use_authorised=False)
m['encoding_maturity'].update(level='source_reconciled_pending_independent_review',label='Source reconciled; independent clinical and pharmacy review pending',source_reconciled=True,audit_release='0.84.38',audit_date=DATE,scope_note='Fresh NCCP v4 audit plus explicitly labelled EMA SmPC safety supplements. Internal source conflicts remain visible; not authorised for clinical use.')
m['source_documents']=[src(1,'pp1–4'),src(5,'SmPC4.2–4.6',True)]
p['clinical_governance']['dose_modification_note']='Dose changes require consultant discussion. Separate current pre-dose counts from the previous cycle nadir; do not repeat a reduction already made for the same episode. No automatically calculated dose is offered where source wording or patient context is unresolved.'
p['clinical_governance']['source_conflicts']=[
 {'id':'RECURRENT_DURATION','sources':[src(1,'Treatment'),src(2,'Table1')],'resolution':'The recurrent regimen text continues until progression or unacceptable toxicity; Table1 lists cycles2–6. Do not impose a six-cycle cap or present this as the newly diagnosed adjuvant regimen. The consultant confirms intended duration.'},
 {'id':'HEPATIC_EXCLUSION','sources':[src(1,'Exclusions'),src(3,'Table3'),src(5,'SmPC4.2',True)],'resolution':'Significant hepatic dysfunction is an NCCP exclusion; Table3 says no adjustment is expected for Child-Pugh C. Flag the conflict for consultant/pharmacy decision; Child-Pugh C must not yield automatic standard-dose clearance.'},
 {'id':'COUNT_RECOVERY_EQUALITY','sources':[src(7,'SmPC4.4 laboratory parameters',True)],'resolution':'Predose criteria use ANC≥1.5/platelets≥100, but weekly recovery monitoring continues until ANC>1.5/platelets>100. Exact equality after a cytopenic episode requires review; do not infer complete recovery from the predose threshold alone.'},
 {'id':'MALE_CONTRACEPTION','sources':[src(3,'Other supportive care'),src(7,'SmPC4.4',True)],'resolution':'NCCP states avoid fathering a child for six months after the last dose; current EMA states at least three months. Retain the Irish six-month advice and flag the source discrepancy for team confirmation.'}]
p['treatment'].update(schedule_summary='Recurrent-disease temozolomide orally once daily on Days1–5 of each 28-day cycle, then 23 days without temozolomide. Initial dose 200mg/m² if chemotherapy-naive or150mg/m² after prior chemotherapy; any cycle2 increase needs haematological and prescribing review.',planned_cycles=None,duration_type='until_progression_or_toxicity',duration_text='Continue until disease progression or unacceptable toxicity; no fixed six-cycle cap is established by the recurrent-treatment paragraph.',source=src(1,'Treatment'),components=[dict(drug='temozolomide',dose='150 or 200 mg/m² once daily according to prior chemotherapy and toxicity history',route='PO',days=['1–5'],note='23 days without temozolomide follow each five-day course. The recurrent regimen does not use a six-cycle cap. Take fasting; swallow whole. Do not repeat a dose after vomiting. Confirm missed-dose advice with the treatment team.',source=src(1,'Treatment'))])
p['treatment']['administration']='Fasting; swallow whole with water. Do not open or chew capsules. Do not repeat a dose after vomiting. NCCP missed-dose instruction: take the missed dose unless the next dose is due within 12 hours; confirm instructions with the treating pharmacist.'
p['treatment']['dose_levels_mg_m2']=[100,150,200]
d=p['input_definitions']
def num(k,label,min=0,max=None,step='any',unit=None):
 x=dict(label=label,type='number',required=False,min=min,step=step,input_role='decision',demo_value=min if min else 2)
 if max is not None:x['max']=max
 if unit:x['unit']=unit
 d[k]=x

def boolean(k,label,role='decision'):d[k]=dict(label=label,type='boolean',required=False,input_role=role,demo_value=False)
def select(k,label,values,role='decision'):d[k]=dict(label=label,type='select',required=False,input_role=role,options=[dict(value=v,label=l) for v,l in values])
boolean('indication_eligible','Adult recurrent/progressive Grade III or IV malignant glioma after standard therapy confirmed')
boolean('dacarbazine_hypersensitivity','Known hypersensitivity to dacarbazine')
boolean('severe_myelosuppression','Severe myelosuppression confirmed clinically')
boolean('significant_hepatic_dysfunction','Significant hepatic dysfunction confirmed clinically (NCCP exclusion)')
boolean('hbv_positive_serology','HBsAg or anti-HBc positive')
boolean('significant_liver_test_abnormality','Significant liver test abnormality requiring benefit-risk review')
boolean('required_tests_missing','Required baseline, cycle or recovery tests are missing')
boolean('pjp_or_opportunistic_infection_concern','Possible PJP or other opportunistic infection')
boolean('current_steroid_or_lymphopenia_risk','Corticosteroid use or lymphopenia requiring PJP risk review')
boolean('interaction_review_needed','Valproate, other myelosuppressive medicine or another interaction requires review')
boolean('age_over_70','Age over 70 years (additional myelosuppression vigilance)')
boolean('dose_escalation_requested','A dose increase is being considered')
boolean('prior_cycle_haematological_toxicity','Haematological toxicity occurred in the preceding cycle')
boolean('episode_dose_reduction_already_applied','A dose reduction was already applied for this toxicity episode')
boolean('toxicity_recovery_confirmed','The prescribing team has confirmed clinical recovery from the toxicity episode')
boolean('prior_cycle_toxicity_review_complete','Previous-cycle nadirs and non-haematological toxicity reviewed')
num('cycle_number','Planned cycle number',min=1,step=1)
num('lowest_anc_previous_cycle','Lowest ANC during previous cycle',unit='×10⁹/L')
num('lowest_platelets_previous_cycle','Lowest platelet count during previous cycle',unit='×10⁹/L')
num('crcl_ml_min','Creatinine clearance',unit='mL/min')
boolean('haemodialysis','Receiving haemodialysis')
d['anc_x10e9_l']['label']='Current pre-dose ANC (not the previous-cycle nadir)';d['platelets_x10e9_l']['label']='Current pre-dose platelet count (not the previous-cycle nadir)'
d['anc_x10e9_l']['step']='any';d['platelets_x10e9_l']['step']='any'
d['previous_chemotherapy']['input_role']='decision';d['current_tmz_dose_level']['input_role']='decision'
d['current_tmz_dose_level']['label']='Dose received in the preceding course (not the proposed new dose)'
d['other_nonhaem_toxicity_grade']['label']='Current non-haematological toxicity grade (exclude alopecia, nausea and vomiting)'
d['highest_nonhaem_previous_cycle']=copy.deepcopy(d['other_nonhaem_toxicity_grade']);d['highest_nonhaem_previous_cycle']['label']='Highest previous-cycle non-haematological toxicity grade (exclude alopecia, nausea and vomiting)'
# CTCAE v5 nausea/vomiting do not have a grade4 definition.
for key in ['nausea_grade','vomiting_grade']:
 d[key]['options']=[v for v in d[key]['options'] if v['value']<=3]
 d[key]['input_role']='decision'
 d[key]['ctcae_max_grade']=3
p['required_inputs']=[];rules=[]
def f(k,op,v):return dict(field=k,operator=op,value=v)
def all_(*x):return {'all':list(x)}
def any_(*x):return {'any':list(x)}
def r(id,condition,action,message,page=2,section='Dose modifications',ema=False,priority=8):
 rules.append(dict(id=id,priority=priority,when=condition,action=dict(type=action,components=['temozolomide'],message=message,dose_calculation='specialist_review',block_numeric_dose=True),source=src(page,section,ema),explanation=message))
r('INDICATION_REVIEW',f('indication_eligible','==',False),'consultant_review','The recurrent adult Grade III/IV glioma indication has not been confirmed; select the correct disease and treatment pathway.',1,'Indication')
r('ECOG_OUTSIDE_PATHWAY',f('ecog','>',2),'consultant_review','ECOG above2 is outside the NCCP routine eligibility range; consultant benefit-risk review is required.',1,'Eligibility')
for key,id in [('hypersensitivity','HYPERSENSITIVITY'),('dacarbazine_hypersensitivity','DACARBAZINE_ALLERGY'),('pregnancy','PREGNANCY'),('breastfeeding','BREASTFEEDING'),('severe_myelosuppression','SEVERE_MYElOSUPPRESSION'),('significant_hepatic_dysfunction','HEPATIC_EXCLUSION')]:
 r(id,f(key,'==',True),'contraindicated',{'HYPERSENSITIVITY':'Known temozolomide/excipient hypersensitivity is an NCCP exclusion.','DACARBAZINE_ALLERGY':'Dacarbazine hypersensitivity is a separate NCCP exclusion.','PREGNANCY':'Pregnancy is an NCCP exclusion; urgent specialist discussion is required.','BREASTFEEDING':'Breastfeeding is an NCCP exclusion.','SEVERE_MYElOSUPPRESSION':'Severe myelosuppression is an NCCP exclusion.','HEPATIC_EXCLUSION':'Significant hepatic dysfunction is an NCCP exclusion. SOURCE CONFLICT: the organ-function table says no adjustment is expected in Child-Pugh C; do not override the exclusion with a default dose.'}[id],1,'Exclusions',priority=10)
r('ACTIVE_INFECTION',f('active_infection','==',True),'withhold','Hold pending urgent clinical assessment of significant active infection. This is a safety review gate informed by SmPC infection/myelosuppression warnings, not a new numeric NCCP dose threshold.',6,'SmPC4.4 infection',True,9)
r('ANC_PRE_DOSE_HOLD',f('anc_x10e9_l','<',1.5),'withhold','Current pre-dose ANC is below1.5×10⁹/L: do not administer the next course. Recheck and review recovery. A previous-cycle nadir below1.0 is a separate next-cycle reduction criterion.',7,'SmPC4.4 laboratory parameters',True,9)
r('PLATELET_PRE_DOSE_HOLD',f('platelets_x10e9_l','<',100),'withhold','Current pre-dose platelets are below100×10⁹/L: do not administer the next course. Recheck and review recovery. A previous-cycle nadir below50 is a separate next-cycle reduction criterion.',7,'SmPC4.4 laboratory parameters',True,9)
r('COUNTS_MEET_MINIMUM',all_(f('anc_x10e9_l','>=',1.5),f('platelets_x10e9_l','>=',100)),'proceed_with_caution','Entered pre-dose counts meet the SmPC minimum only. This does not establish recovery after cytopenia, approve a dose, erase prior reductions or clear omitted domains.',7,'SmPC4.4 laboratory parameters',True,4)
trigger=any_(f('lowest_anc_previous_cycle','<',1),f('lowest_platelets_previous_cycle','<',50),f('highest_nonhaem_previous_cycle','==',3))
r('ANC_NADIR_REDUCTION_REVIEW',f('lowest_anc_previous_cycle','<',1),'consultant_review','Previous-cycle ANC below1.0×10⁹/L meets the one-dose-level reduction criterion for the next cycle. Confirm current count recovery, prior dose and whether this episode has already caused a reduction.',2,'Table2',priority=7)
r('PLATELET_NADIR_REDUCTION_REVIEW',f('lowest_platelets_previous_cycle','<',50),'consultant_review','Previous-cycle platelets below50×10⁹/L meet the one-dose-level reduction criterion for the next cycle. Confirm current count recovery, prior dose and whether this episode has already caused a reduction.',2,'Table2',priority=7)
r('NONHAEM_CURRENT_G3',f('other_nonhaem_toxicity_grade','==',3),'withhold_then_reduce','Grade3 non-haematological toxicity (excluding alopecia, nausea and vomiting) requires one dose-level reduction. Review the acute toxicity and clinical recovery before further treatment; no immediate dose is calculated.',2,'Table2',priority=9)
r('NONHAEM_HISTORY_G3',f('highest_nonhaem_previous_cycle','==',3),'consultant_review','Previous-cycle Grade3 non-haematological toxicity requires one dose-level reduction, unless the same event recurred after a reduction, when treatment is discontinued. Confirm recovery and dose history.',2,'Table2',priority=7)
r('NONHAEM_G4',any_(f('other_nonhaem_toxicity_grade','==',4),f('highest_nonhaem_previous_cycle','==',4)),'permanently_discontinue','Discontinue temozolomide for Grade4 non-haematological toxicity, excluding alopecia, nausea and vomiting. A later lower grade must not erase the prior Grade4 event.',2,'Table2',priority=10)
r('TOX_AT_100',f('unacceptable_toxicity_at_100','==',True),'permanently_discontinue','Discontinue if100mg/m² still causes unacceptable toxicity; do not invent a lower dose level.',2,'Table2footnoteb',priority=10)
r('RECURRENT_G3',f('same_grade3_toxicity_recurred_after_reduction','==',True),'permanently_discontinue','Discontinue if the same Grade3 non-haematological toxicity recurs after dose reduction, excluding alopecia, nausea and vomiting.',2,'Table2footnoteb',priority=10)
r('REDUCTION_ALREADY_APPLIED',all_(trigger,f('episode_dose_reduction_already_applied','==',True)),'consultant_review','Do not apply a second reduction for the same recorded toxicity episode. Verify dose history and the current prescription; genuine recurrent unacceptable toxicity at100mg/m² or recurrent same Grade3 toxicity retains its stop rule.',2,'Tables1–2',priority=8)
r('REDUCTION_BELOW_MINIMUM',all_(trigger,f('current_tmz_dose_level','==','100'),f('episode_dose_reduction_already_applied','==',False)),'permanently_discontinue','The prior course was100mg/m² and a new episode meets a further dose-reduction criterion. There is no lower NCCP dose level; discontinue and discuss with the consultant.',2,'Tables1–2',priority=10)
r('RECOVERY_NOT_CONFIRMED',all_(trigger,f('toxicity_recovery_confirmed','==',False)),'withhold','Clinical recovery from the toxicity episode is not confirmed; do not restart from a reduction table alone.',2,'Tables1–2; consultant dose-modification requirement',priority=9)
r('RECOVERY_EQUALITY_REVIEW',all_(trigger,any_(f('anc_x10e9_l','==',1.5),f('platelets_x10e9_l','==',100))),'consultant_review','SOURCE BOUNDARY: pre-dose counts use ≥1.5/≥100, but recovery monitoring continues until >1.5/>100. At exact equality after cytopenia, obtain consultant/pharmacy confirmation rather than automatically authorising restart.',7,'SmPC4.4 laboratory parameters',True,8)
for prev,nextdose in [('200','150'),('150','100')]:
 r('REDUCE_'+prev+'_TO_'+nextdose,all_(trigger,f('current_tmz_dose_level','==',prev),f('episode_dose_reduction_already_applied','==',False),f('toxicity_recovery_confirmed','==',True),f('anc_x10e9_l','>',1.5),f('platelets_x10e9_l','>',100),f('other_nonhaem_toxicity_grade','<',3)),'dose_reduce_one_level','After the documented episode and recovery, the source one-level reduction is '+prev+' to '+nextdose+'mg/m² for the next five-day course. Consultant/pharmacy confirmation is required; this is not a patient-specific calculated prescription.',2,'Tables1–2',priority=8)
r('INITIAL_DOSE_NAIVE',all_(f('cycle_number','==',1),f('previous_chemotherapy','==',False)),'proceed_with_caution','For chemotherapy-naive recurrent disease the source initial reference is200mg/m² once daily onDays1–5, not an automatic150mg/m² default. Check eligibility and individual prescribing decisions.',1,'Treatment',priority=4)
r('INITIAL_DOSE_PRETREATED',all_(f('cycle_number','==',1),f('previous_chemotherapy','==',True)),'proceed_with_caution','After previous chemotherapy the source initial reference is150mg/m² once daily onDays1–5. Consultant adjustments and prior toxicity may change the prescription.',1,'Treatment',priority=4)
r('ESCALATION_REVIEW',f('dose_escalation_requested','==',True),'consultant_review','Any dose increase requires review of chemotherapy history, cycle number, nadirs, toxicity and prior reductions. Do not derive a dose increase from normal current counts alone.',1,'Treatment',priority=7)
r('CYCLE2_INCREASE_CRITERIA',all_(f('dose_escalation_requested','==',True),f('cycle_number','==',2),f('previous_chemotherapy','==',True),f('current_tmz_dose_level','==','150'),f('prior_cycle_haematological_toxicity','==',False),f('prior_cycle_toxicity_review_complete','==',True),f('highest_nonhaem_previous_cycle','<=',2),f('other_nonhaem_toxicity_grade','<=',2),f('anc_x10e9_l','>=',1.5),f('platelets_x10e9_l','>=',100)),'consultant_review','The recurrent-disease text permits consideration of a cycle2 increase from150 to200mg/m² after prior chemotherapy when there was no haematological toxicity. This remains a consultant/pharmacy decision; verify there is no competing toxicity or earlier reduction.',1,'Treatment',priority=8)
r('ESCALATION_HAEM_TOXICITY',all_(f('dose_escalation_requested','==',True),f('prior_cycle_haematological_toxicity','==',True)),'consultant_review','Do not apply the no-haematological-toxicity cycle2 increase pathway when haematological toxicity occurred. Review the current dose and nadir-specific reduction criteria.',1,'Treatment',priority=8)
r('LATE_ESCALATION_UNSPECIFIED',all_(f('dose_escalation_requested','==',True),f('cycle_number','>',2)),'consultant_review','The recurrent-disease source describes escalation at cycle2; it does not establish a later-cycle escalation rule. Do not borrow the newly diagnosed adjuvant pathway or automatically increase a later course.',1,'Treatment',priority=8)
r('CYCLE_BEYOND_SIX',f('cycle_number','>',6),'consultant_review','SOURCE CONFLICT: recurrent-treatment prose continues until progression or unacceptable toxicity, while Table1 labels cycles2–6. Confirm intended duration; do not impose an automatic six-cycle stop.',1,'Treatment vs p2Table1',priority=7)
r('PRIOR_CYCLE_REVIEW_MISSING',all_(f('cycle_number','>',1),f('prior_cycle_toxicity_review_complete','==',False)),'consultant_review','Review the previous-cycle nadir and toxicity before a subsequent course. Current recovery counts alone cannot exclude a required reduction.',2,'Table2',priority=7)
r('RENAL_GE36',any_(f('crcl_ml_min','>=',36),f('temozolomide_renal_band','==','ge36')),'proceed_with_caution','The NCCP renal table requires no renal dose adjustment atCrCl≥36mL/min; this does not establish overall eligibility or override other restrictions.',3,'Table3',priority=4)
r('TMZ_RENAL_LT36',any_(f('crcl_ml_min','<',36),f('temozolomide_renal_band','==','lt36')),'proceed_with_caution','AtCrCl<36mL/min no dose adjustment is expected by the NCCP table, but EMA advises caution because relevant data are limited. Confirm suitability and monitoring; no calculated dose is issued.',3,'Table3',priority=5)
r('DIALYSIS_REVIEW',any_(f('haemodialysis','==',True),f('temozolomide_renal_band','==','dialysis')),'consultant_review','NCCP expects no dose adjustment with haemodialysis. Confirm the plan with oncology pharmacy/renal specialists; the source does not give a dialysis timing schedule.',3,'Table3',priority=7)
r('TMZ_CHILD_PUGH_AB',f('hepatic_impairment_band','==','child_pugh_ab'),'proceed_with_caution','NCCP Table3 requires no dose adjustment for Child-Pugh A/B, but significant hepatic dysfunction remains an exclusion and abnormal liver tests need benefit-risk review.',3,'Table3',priority=5)
r('TMZ_CHILD_PUGH_C',f('hepatic_impairment_band','==','child_pugh_c'),'consultant_review','SOURCE CONFLICT: NCCP Table3 expects no dose adjustment in Child-Pugh C, while significant hepatic dysfunction is an exclusion onpage1. EMA reports no severe-hepatic-impairment data and advises caution. Resolve suitability before prescribing.',3,'Table3 vs p1Exclusions',priority=8)
r('LIVER_BENEFIT_RISK',f('significant_liver_test_abnormality','==',True),'consultant_review','Assess benefit-risk before initiating or continuing temozolomide with significant liver-test abnormalities. Check LFTs after each cycle; injury may present weeks or more after the last dose. No unsupported ALT/bilirubin numeric threshold is introduced.',6,'SmPC4.4 hepatotoxicity',True,8)
r('TMZ_HBV_SCREEN',f('hbv_screen_completed','==',False),'consultant_review','Obtain the required pretreatment HBsAg and anti-HBc screening before planning treatment.',2,'Baseline tests',priority=7)
r('HBV_POSITIVE',f('hbv_positive_serology','==',True),'consultant_review','Positive hepatitisB serology requires liver-specialist advice before starting and appropriate monitoring/management during treatment.',3,'HBV complication',priority=8)
r('TMZ_HBV_ACTIVE',f('active_or_reactivated_hbv','==',True),'withhold','Urgent liver/oncology assessment is required for active or suspected HBV reactivation; hold pending review. The hold is an explicit clinical safety review gate, not an NCCP numerical dose rule.',3,'HBV complication',priority=9)
r('TESTS_MISSING',f('required_tests_missing','==',True),'consultant_review','Confirm baseline FBC/renal/liver/glucose/HBV tests; FBC/renal/liver onDay1 each cycle. The EMA supplement adds CBCDay22±48h with weekly recovery checks and LFTs after every cycle.',2,'Tests; EMA pp6–7',priority=7)
r('PJP_CONCERN',f('pjp_or_opportunistic_infection_concern','==',True),'withhold','Urgent assessment is needed for possible PJP/opportunistic infection; hold pending clinical review. The mandatory42-day chemoradiation prophylaxis rule must not be applied automatically to this five-day monotherapy schedule.',6,'SmPC4.4 PJP/opportunistic infections',True,9)
r('PJP_RISK_REVIEW',f('current_steroid_or_lymphopenia_risk','==',True),'consultant_review','All temozolomide patients, especially those receiving corticosteroids, need vigilance for PJP. Confirm individual risk and local prophylaxis policy; five-day recurrent monotherapy does not itself carry the SmPC universal42-day concurrent-RT prophylaxis instruction.',6,'SmPC4.4 PJP',True,7)
r('INTERACTIONS',f('interaction_review_needed','==',True),'consultant_review','Review concomitant myelosuppressive medicines and valproate using the current SmPC/interaction database. Valproate modestly reduces temozolomide clearance; do not infer a numeric dose adjustment from this alone.',8,'SmPC4.5',True,7)
r('OLDER_AGE_MONITORING',f('age_over_70','==',True),'proceed_with_caution','Patients over70 have increased neutropenia/thrombocytopenia risk. Use additional vigilance; age alone does not establish a new dose-reduction threshold.',7,'SmPC4.4 elderly patients',True,5)
r('SEVERE_NAUSEA_VOMITING_REVIEW',any_(f('nausea_grade','>=',3),f('vomiting_grade','>=',3)),'consultant_review','Severe nausea/vomiting needs prompt assessment of hydration, intake and antiemetics. These symptoms are excluded from the generic non-haematological reduction/stop table; do not treat them as an automatic Grade4 discontinuation.',7,'SmPC4.4 antiemetics; NCCPTable2',True,8)
r('CONTRADICTORY_RENAL_CONTEXT',any_(all_(f('crcl_ml_min','<',36),f('temozolomide_renal_band','==','ge36')),all_(f('crcl_ml_min','>=',36),f('temozolomide_renal_band','==','lt36'))),'consultant_review','The entered numerical creatinine clearance and renal band disagree. Correct the source data before interpreting the renal table.',3,'Table3 input consistency',priority=8)
r('CONTRADICTORY_HAEM_HISTORY',all_(f('prior_cycle_haematological_toxicity','==',False),any_(f('lowest_anc_previous_cycle','<',1),f('lowest_platelets_previous_cycle','<',50))),'consultant_review','The previous-cycle nadir meets a haematological reduction threshold but the history states no haematological toxicity. Resolve the contradiction; do not use the no-toxicity increase pathway.',2,'Table2 vs p1Treatment',priority=8)
for rule in rules:
 if rule['id']=='CYCLE2_INCREASE_CRITERIA':rule['when']['all'].extend([any_(f('lowest_anc_previous_cycle','missing',True),f('lowest_anc_previous_cycle','>=',1)),any_(f('lowest_platelets_previous_cycle','missing',True),f('lowest_platelets_previous_cycle','>=',50))])
p['rule_engine']['rules']=rules
p['supportive_care'].update(emetogenic_risk='oral_moderate_high',script_id='nccp-oral-moderate-high',mapping_basis='NCCP00342v4 p3 classifies temozolomide as oral moderate to high emetogenic potential; antiemetics on the five oral-treatment days according to local policy, not a routine28-day antiemetic course.',pjp_prophylaxis='Risk-based review for this five-day recurrent monotherapy schedule. All TMZ patients, particularly with corticosteroids or lymphopenia, need PJP vigilance. Universal prophylaxis for42-day concomitantRT belongs to a different regimen.',other_supportive_care=['Take temozolomide fasting and swallow capsules whole with water; do not open or chew.','Do not repeat a dose after vomiting. Confirm the NCCP missed-dose instruction with oncology pharmacy.','Review antiemetic control on treatment days and after prior severe vomiting.','NCCP advises men not to father a child for six months after the last dose; EMA currently states at least three months. Confirm the Irish plan with the treating team. Discuss sperm preservation before treatment.','EMA advises effective contraception for women during treatment and for at least six months after completion.','Review HBV results and the liver-specialist plan when serology is positive.','Review seizure medicines, corticosteroids and other marrow-suppressive medicines; do not stop them without the treating team.'])
p['monitoring']={'baseline':['FBC, renal and liver profile','Blood glucose','HBsAg and anti-HBc'], 'each_cycle':['FBC, renal and liver profile onDay1 before each course'], 'smPC_supplement':['CBC onDay22 (±48hours), then weekly until ANC>1.5×10⁹/L and platelets>100×10⁹/L','LFTs after each cycle; toxicity may occur weeks or more after the last dose'], 'disease_monitoring':'Imaging and other disease tests according to the individual consultant plan; no fixed MRI interval is imposed by this NCCP regimen.', 'sources':[src(2,'Tests'),src(6,'SmPC4.4 liver',True),src(7,'SmPC4.4 blood counts',True)]}
# Apply typographic spacing only to displayed prose, never IDs, expressions or URLs.
import re
keys={'label','message','explanation','schedule_summary','duration_text','note','administration','mapping_basis','pjp_prophylaxis','resolution','scope_note','document','section'}
def tidy(s):
 s=re.sub(r'(?<=[A-Za-z])(?=\d)', ' ', s)
 s=re.sub(r'(?<=\d)(?=[A-Za-z])', ' ', s)
 s=s.replace('ANC≥','ANC ≥').replace('ANC>','ANC >').replace('CrCl≥','CrCl ≥').replace('CrCl<','CrCl <').replace('platelets>','platelets >').replace('≥36','≥36').replace('SmPC 4.','SmPC 4.')
 s=s.replace('Table 2 footnoteb','Table 2 footnote b').replace('p 1 Exclusions','p1 Exclusions').replace('cycle 2','cycle 2')
 return s
for key in keys:
 def walk(x):
  if isinstance(x,dict):
   for k,v in x.items():
    if k==key and isinstance(v,str):x[k]=tidy(v)
    else:walk(v)
  elif isinstance(x,list):
   for v in x:walk(v)
 walk(p)
for key in ['other_supportive_care']:
 p['supportive_care'][key]=[tidy(s) for s in p['supportive_care'][key]]
for k in ['baseline','each_cycle','smPC_supplement']:p['monitoring'][k]=[tidy(s) for s in p['monitoring'][k]]
P.write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n')
print('rules',len(rules),'inputs',len(d),'sha',hashlib.sha256(P.read_bytes()).hexdigest())
