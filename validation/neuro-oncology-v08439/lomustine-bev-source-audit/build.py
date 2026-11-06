from pathlib import Path
import json,hashlib,shutil,re,os
A=Path(__file__).resolve().parent; S=A.parents[2]; R=Path(os.environ.get('SACT_RESEARCH_ROOT',str(S.parent/'neuro-v39-research')))
assert R.is_dir(), 'Set SACT_RESEARCH_ROOT to the retained v39 source research directory; this is an authoring script, not a site runtime command.'
sources=json.loads((R/'source-index.json').read_text()); supplements=json.loads((R/'supplemental-source-index.json').read_text())
for code in ['00742','00804']:
 for ext in ['pdf','txt']:shutil.copyfile(R/'sources'/f'{code}-nccp.{ext}',A/'sources'/f'{code}-nccp.{ext}')
for name in ['lomustine-medac-smPC','avastin-ema-smPC']:
 for ext in ['pdf','txt']:shutil.copyfile(R/'sources'/f'{name}.{ext}',A/'sources'/f'{name}.{ext}')
shutil.copyfile(R/'sources/catalogue.html',A/'sources/catalogue.html')
def c(f,op,v=None):return dict(field=f,operator=op,**({} if v is None else {'value':v}))
def allof(*v):return {'all':list(v)}
def anyof(*v):return {'any':list(v)}
def missing(f):return c(f,'missing')
def yes(f):return c(f,'==',True)
def no(f):return c(f,'==',False)
def booldef(label,**kw):return dict(label=label,type='boolean',required=False,input_role='decision',**kw)
def numdef(label,unit,maxi,step=.01):return dict(label=label,type='number',required=False,min=0,max=maxi,step=step,unit=unit,input_role='decision')
def seldef(label,options):return dict(label=label,type='select',required=False,input_role='decision',options=[{'value':v,'label':t} for v,t in options])
for code in ['00742','00804']:
 before=next(R.glob(code+'*.before.json')); p=json.loads(before.read_text()); dest=S/'protocols/neuro-oncology'/p['file_name'];shutil.copyfile(before,A/'protocol-before'/p['file_name'])
 si=next(x for x in sources if x['code']==code)
 def source(page,table=None,section=None,product=None):
  if product:
   x=next(x for x in supplements if x['id']==product);v=dict(document=('EMA Avastin SmPC' if product=='avastin-ema-smPC' else 'Lomustine medac common SmPC, revision2026-01-16'),url=x['url'],sha256=x['sha256'],page=page,retrieved='2026-11-05')
  else:v=dict(document=f'NCCP {code} v{si["version"]}',url=si['url'],sha256=si['sha256'],page=page,retrieved='2026-11-05')
  if table:v['table']=table
  if section:v['section']=section
  return v
 rules=[]
 def rule(id,when,typ,components,message,page,table=None,section=None,product=None):
  components=components if isinstance(components,list) else [components]
  a=dict(type=typ,components=components,message=message,recommendation=message,dose_calculation='specialist_review',block_numeric_dose=True,show_in_dose_actions=True)
  rules.append(dict(id=id,priority=90 if typ in ['discontinue','permanently_discontinue','contraindicated'] else 70 if typ=='withhold' else 50,when=when,action=a,source=source(page,table,section,product),explanation=message))
 both=['lomustine','bevacizumab'];l='lomustine';b='bevacizumab';i=p['input_definitions']
 i['hypersensitivity']['label']='Hypersensitivity to lomustine, bevacizumab, an excipient or a relevant CHO/recombinant antibody product'
 for field in ['hypertension_grade','urine_protein_g_24h']:i[field].pop('visible_when',None)
 i['other_nonhaem_toxicity_grade']['input_role']='decision'
 i['lomustine_renal_band']['label']='Legacy lomustine renal band (use the exact CrCl field when available)'
 i['severe_bp_uncontrolled']['label']='Severe hypertension remains uncontrolled despite medication (legacy >200/110 flag)'
 i['assessment_type']=seldef('Assessment timing',[('baseline','Before first treatment'),('on_treatment','During treatment / before a dose'),('restart','Considering restart after a delay or toxicity')])
 i['visit_type']=seldef('Administration being considered',[('combination_day1','Day1: lomustine and bevacizumab'),('bevacizumab_only','Bevacizumab-only visit'),('other','Different visit: confirm prescription')])
 i['cycle_number']=numdef('Planned 42-day cycle number','cycle',99,1);i['cycle_number']['min']=1
 i['crcl_ml_min']=numdef('Creatinine clearance for lomustine','mL/min',300)
 i['haemodialysis']=booldef('Receiving haemodialysis')
 i['lomustine_hepatic_severity']=seldef('Clinically assessed hepatic impairment for lomustine',[('none','None'),('mild','Mild'),('moderate','Moderate'),('severe','Severe'),('uncertain','Severity not established')])
 i['fvc_percent_predicted']=numdef('FVC, if measured','% predicted',200)
 i['wbc_x10e9_l']=numdef('Total white blood cell count (distinct from ANC)','x10^9/L',500)
 i['days_since_last_lomustine']=numdef('Days since the previous lomustine dose (repeat courses only)','days',10000,1)
 i['lomustine_cumulative_mg_m2']=numdef('Cumulative lomustine exposure before the proposed dose','mg/m2',10000)
 i['lomustine_cumulative_with_next_mg_m2']=numdef('Cumulative lomustine exposure INCLUDING the proposed next dose','mg/m2',10000)
 i['lomustine_marrow_delay_history']=booldef('Previous lomustine count-related delay or clinically important marrow nadir')
 i['restart_plan_uncertain']=booldef('Previous dose, nadir or recovery information is incomplete')
 i['hypertension_grade3_persisting']=booldef('Grade3 hypertension persists despite treatment / reassessment')
 i['clinically_significant_htn_not_controlled']=booldef('Medically significant hypertension cannot be adequately controlled by treatment')
 i['urine_protein_g_l']=numdef('Spot laboratory urine protein CONCENTRATION (not a 24-hour total)','g/L',100)
 i['nephrotic_syndrome']=booldef('Nephrotic syndrome / source grade4 proteinuria')
 i['tracheoesophageal_fistula']=booldef('Tracheoesophageal fistula (any grade)')
 i['other_internal_fistula']=booldef('Other internal fistula needing specialist review')
 i['recent_intracranial_haemorrhage']=booldef('Recent intracranial haemorrhage')
 i['recent_stroke_or_mi_lt1y']=booldef('Stroke or myocardial infarction within one year')
 i['minimal_contrast_enhancement_or_gliomatosis']=booldef('No/minimal contrast enhancement or gliomatosis cerebri')
 i['days_since_major_surgery']=numdef('Days since major surgery','days',10000,1)
 i['wound_fully_healed']=booldef('Surgical wound fully healed')
 i['planned_minor_surgery']=booldef('Minor surgery planned')
 i['suspected_pres_or_acute_neuro_symptoms']=booldef('Suspected PRES or new severe headache, seizures, visual change or altered mental status')
 i['infusion_reaction']=booldef('Current infusion reaction or anaphylaxis concern')
 i['new_major_bleeding']=booldef('New concerning bleeding requiring urgent assessment')
 i['high_bleeding_thrombotic_cardiovascular_or_fistula_risk']=booldef('Significant bleeding, thrombotic, cardiovascular, aneurysm or fistula/perforation risk')
 i['concurrent_radiotherapy']=booldef('Concurrent radiotherapy proposed')
 i['wheat_allergy_or_nitrosourea_nonresponse']=booldef('Lomustine product safety: wheat allergy or previous failure to respond to another nitrosourea')
 i['live_vaccine_planned_or_given']=booldef('Live vaccine planned or recently given during immunosuppression')
 i['interaction_review_needed']=booldef('Interaction concern, including antiepileptics, cimetidine, theophylline or anticoagulation')
 i['monitoring_or_support_not_ready']=booldef('Required tests, oral antiemetics, prescription or support plan not ready')
 i['eligible_recurrent_glioblastoma_confirmed']=booldef('Source-defined recurrent malignant glioblastoma indication confirmed')
 i['lomustine_formulation_or_supply_uncertain']=booldef('Lomustine formulation, capsule strength, single-dose instruction or supply is uncertain')
 # Source-specific exclusion decisions remain independent of missing unrelated fields.
 rule('ECOG_OUTSIDE_PATHWAY',c('ecog','>',2),'consultant_review',both,'ECOG above2 lies outside the routine NCCP eligibility range. Confirm individual benefit and risk; this is not a treatment clearance.',1)
 rule('INDICATION_NOT_CONFIRMED',no('eligible_recurrent_glioblastoma_confirmed'),'consultant_review',both,'Confirm the recurrent malignant glioblastoma indication and the intended treatment plan before applying this regimen.',1)
 for field,id,msg in [('hypersensitivity','HYPERSENSITIVITY','Relevant drug or product hypersensitivity is an exclusion.'),('pregnancy','PREGNANCY','Pregnancy is an exclusion.'),('breastfeeding','BREASTFEEDING','Breastfeeding is an exclusion.'),('recent_intracranial_haemorrhage','RECENT_ICH','Recent intracranial haemorrhage is an NCCP exclusion.'),('recent_stroke_or_mi_lt1y','RECENT_STROKE_MI','Stroke or MI within one year is an NCCP exclusion.'),('minimal_contrast_enhancement_or_gliomatosis','MINIMAL_ENHANCEMENT','No/minimal contrast enhancement or gliomatosis cerebri is an NCCP exclusion.')]:rule(id,yes(field),'contraindicated',both,msg,2)
 rule('ACTIVE_INFECTION',yes('active_infection'),'withhold',both,'Do not administer pending urgent infection assessment and a consultant plan. Infections may occur with delayed lomustine marrow suppression.',2,section='4.4',product='lomustine-medac-smPC')
 rule('CYCLE_LIMIT',c('cycle_number','>',6),'consultant_review',both,'NCCP specifies up to six 42-day cycles. Further treatment requires an explicit consultant plan, not automatic continuation.',1)
 rule('VISIT_OTHER',c('visit_type','==','other'),'consultant_review',both,'This schedule has Day1 combination treatment and separate bevacizumab-only visits. Confirm the intended drugs and administration day.',1)
 rule('LOM_ANC_LT1',c('anc_x10e9_l','<',1),'withhold',l,'Delay lomustine until ANC is at least1.0 AND platelets at least100 x10^9/L. Review the prior nadir and dose; NCCP only says consider reduction and gives no percentage.',3,1)
 rule('LOM_PLT_LT80',c('platelets_x10e9_l','<',80),'withhold',l,'Delay lomustine until ANC is at least1.0 AND platelets at least100 x10^9/L. Any subsequent reduction needs the consultant/pharmacy plan.',3,1)
 rule('LOM_PLT_80_99',allof(c('platelets_x10e9_l','>=',80),c('platelets_x10e9_l','<',100)),'consultant_review',l,'Platelets80 to below100 are not allocated a dose by NCCP Table1. Do not infer a full dose. If already held for low counts, the recovery target remains at least100.',3,1)
 rule('LOM_PRIOR_DELAY_NOT_RECOVERED',allof(yes('lomustine_marrow_delay_history'),anyof(c('anc_x10e9_l','<',1),c('platelets_x10e9_l','<',100))),'withhold',l,'The previous count-related delay has not met BOTH NCCP recovery targets. No lomustine dose now.',3,1)
 rule('LOM_PRIOR_DELAY_RECOVERY_REVIEW',allof(yes('lomustine_marrow_delay_history'),c('anc_x10e9_l','>=',1),c('platelets_x10e9_l','>=',100)),'consultant_review',l,'Counts meet the NCCP recovery thresholds after a previous delay. Confirm the original dose, nadir, prior reductions and consultant decision; no percentage is specified by this NCCP table.',3,1)
 rule('LOM_RESTART_MISSING_COUNTS',allof(c('assessment_type','==','restart'),anyof(missing('anc_x10e9_l'),missing('platelets_x10e9_l'))),'consultant_review',l,'Restart cannot be assessed without both current ANC and platelets plus the prior nadir and dose history. Missing counts are not normal counts.',3,1)
 rule('RESTART_PLAN_UNCERTAIN',yes('restart_plan_uncertain'),'consultant_review',l,'Confirm previous actual lomustine dose, prior nadir, recovery and reason for interruption. Do not calculate a restart from the standard schedule alone.',2,section='4.2',product='lomustine-medac-smPC')
 rule('LOM_WBC_SOURCE_CONFLICT',allof(c('assessment_type','==','restart'),c('wbc_x10e9_l','<',4)),'consultant_review',l,'The current product SmPC requests total WBC recovery to4.0, while NCCP uses ANC1.0. These are different measures; reconcile the actual product and protocol with oncology pharmacy before restart.',2,section='4.2',product='lomustine-medac-smPC')
 rule('LOM_RENAL_30_50',anyof(allof(c('crcl_ml_min','>=',30),c('crcl_ml_min','<=',50)),c('lomustine_renal_band','==','30_50')),'consultant_review',l,'NCCP recommends75% of the ORIGINAL lomustine dose at CrCl30-50 mL/min. Confirm the actual original capped dose, prior reductions, recovery and product advice; do not calculate from a nominal90 mg/m2 schedule or re-escalate a reduced dose.',3,2)
 rule('LOM_RENAL_LT30',anyof(c('crcl_ml_min','<',30),c('lomustine_renal_band','in',['lt30','dialysis']),yes('haemodialysis')),'withhold',l,'Lomustine is not recommended at CrCl below30 mL/min or during haemodialysis. Do not administer pending specialist review; the severe-renal product contraindication must be reconciled.',3,2)
 rule('LOM_RENAL_INPUT_CONFLICT',anyof(allof(c('lomustine_renal_band','==','gt50'),c('crcl_ml_min','<=',50)),allof(c('lomustine_renal_band','==','30_50'),anyof(c('crcl_ml_min','<',30),c('crcl_ml_min','>',50))),allof(c('lomustine_renal_band','==','lt30'),c('crcl_ml_min','>=',30)),allof(c('lomustine_renal_band','==','dialysis'),no('haemodialysis'))),'consultant_review',l,'Exact CrCl/dialysis status and the legacy band conflict. Resolve the discrepancy before any renal dose decision; no automatic dose.',3,2)
 rule('LOM_HEPATIC_SEVERE',c('lomustine_hepatic_severity','==','severe'),'withhold',l,'Lomustine is not recommended in severe hepatic impairment. Obtain consultant/pharmacy review; NCCP does not define this by an isolated numeric liver result.',3,2)
 rule('LOM_HEPATIC_UNCERTAIN',c('lomustine_hepatic_severity','==','uncertain'),'consultant_review',l,'Establish hepatic impairment severity before the lomustine decision. Mild/moderate impairment does not usually require adjustment; severe impairment is not recommended.',3,2)
 rule('LOM_REPEAT_TOO_EARLY',allof(c('days_since_last_lomustine','<',42),anyof(c('visit_type','==','combination_day1'),missing('visit_type'))),'withhold',l,'Do not repeat lomustine before six weeks after the preceding dose. This is a single Day1 oral dose, not daily treatment. A separate bevacizumab-only visit must be assessed independently.',2,section='4.2',product='lomustine-medac-smPC')
 rule('LOM_CUMULATIVE_LIMIT',anyof(c('lomustine_cumulative_mg_m2','>=',1000),c('lomustine_cumulative_with_next_mg_m2','>',1000)),'withhold',l,'Current lomustine product SmPC limits cumulative exposure to1000 mg/m2. No further dose that exceeds this limit; reconcile previous exposure and the intended product with oncology pharmacy.',2,section='4.2',product='lomustine-medac-smPC')
 rule('LOM_CUMULATIVE_REVIEW',allof(c('lomustine_cumulative_mg_m2','>',0),missing('lomustine_cumulative_with_next_mg_m2')),'consultant_review',l,'Prior lomustine exposure is recorded. Confirm the proposed next dose and cumulative total before administration; do not assume this is the first course.',2,section='4.2',product='lomustine-medac-smPC')
 rule('LOM_PULMONARY',yes('pulmonary_symptoms_or_concern'),'withhold',l,'Withhold pending assessment of possible lomustine pulmonary toxicity and the prescribing consultant plan. New respiratory symptoms must not be dismissed as ordinary fatigue.',3,section='4.4',product='lomustine-medac-smPC')
 rule('LOM_LOW_PFT_CAUTION',anyof(c('fvc_percent_predicted','<',70),c('dlco_percent_predicted','<',70)),'consultant_review',l,'FVC or DLCO below70% predicted identifies increased pulmonary toxicity risk. This is a caution requiring specialist assessment, not an automatic DLCO<60% stopping threshold.',6 if code=='00742' else 3,product=None if code=='00742' else 'lomustine-medac-smPC',section=None if code=='00742' else '4.4')
 rule('LOM_OTHER_SEVERE_TOXICITY',c('other_nonhaem_toxicity_grade','>=',3),'withhold',l,'Clinically significant severe toxicity requires assessment before another lomustine dose. This combination protocol does not specify the single-agent50%/42-day re-escalation table; do not import it.',6 if code=='00742' else 5,section='Adverse effects / current SmPC review')
 rule('UNHEALED_WOUND_OR_RECENT_SURGERY',anyof(yes('recent_major_surgery_or_unhealed_wound'),c('days_since_major_surgery','<',28),no('wound_fully_healed')),'withhold',b,'Withhold bevacizumab until at least28 days have elapsed after major surgery AND the wound is fully healed. Meeting only one condition is insufficient.',6,section='4.4',product='avastin-ema-smPC')
 rule('SURGERY_HEALING_UNCONFIRMED',allof(c('days_since_major_surgery','>=',28),missing('wound_fully_healed')),'consultant_review',b,'The postoperative interval alone does not establish wound healing. Confirm complete healing before bevacizumab.',6,section='4.4',product='avastin-ema-smPC')
 rule('PLANNED_MAJOR_SURGERY',yes('planned_major_surgery'),'withhold',b,'Withhold bevacizumab for major elective surgery and agree timing with the consultant/surgeon. NCCP00742 describes28 days before major surgery; individual plans may differ.',5 if code=='00742' else 6,product=None if code=='00742' else 'avastin-ema-smPC',section=None if code=='00742' else '4.4')
 rule('PLANNED_MINOR_SURGERY',yes('planned_minor_surgery'),'consultant_review',b,'Agree the bevacizumab interruption for the planned minor procedure. NCCP00742 describes7 days or consultant direction; this is not a universal interval for every procedure.',5 if code=='00742' else 6,product=None if code=='00742' else 'avastin-ema-smPC',section=None if code=='00742' else '4.4')
 rule('UNCONTROLLED_HYPERTENSION',yes('uncontrolled_or_symptomatic_hypertension'),'withhold',b,'Withhold bevacizumab for uncontrolled or symptomatic hypertension on the treatment day; start or adjust antihypertensive therapy.',4,4)
 rule('GRADE2_HTN_REVIEW',c('hypertension_grade','==',2),'consultant_review',b,'Treat grade2 hypertension and consider interruption until controlled, following the prescriber plan.',4,4)
 rule('GRADE3_HTN_REVIEW',allof(c('hypertension_grade','==',3),anyof(no('hypertension_grade3_persisting'),missing('hypertension_grade3_persisting'))),'consultant_review',b,'Treat grade3 hypertension and consider interruption. Establish whether it persists despite treatment; grade3 alone does not establish the NCCP discontinuation criterion.',4,4)
 rule('PERSISTENT_G3_OR_G4_HYPERTENSION',anyof(c('hypertension_grade','==',4),allof(c('hypertension_grade','==',3),yes('hypertension_grade3_persisting'))),'discontinue',b,'Discontinue bevacizumab for grade4 hypertension or confirmed persisting grade3 hypertension.',4,4)
 rule('PERSISTENT_G3_HISTORY',allof(yes('hypertension_grade3_persisting'),anyof(missing('hypertension_grade'),c('hypertension_grade','<',3))),'consultant_review',b,'A history of persisting grade3 hypertension is reported. Clarify whether a stop decision already applies; improved/current or missing grade does not authorise automatic restart.',4,4)
 rule('SEVERE_UNCONTROLLED_BP',anyof(yes('severe_bp_uncontrolled'),yes('clinically_significant_htn_not_controlled')),'permanently_discontinue',b,'Discontinue bevacizumab when medically significant hypertension cannot be adequately controlled despite treatment. NCCP00742 additionally describes severe uncontrolled BP>200/110; confirm the clinical context.',6,section='4.4',product='avastin-ema-smPC')
 rule('HYPERTENSIVE_CRISIS_PRES',yes('hypertensive_crisis_or_encephalopathy'),'permanently_discontinue',b,'Permanently discontinue bevacizumab for hypertensive crisis or encephalopathy and manage urgently.',6,section='4.4',product='avastin-ema-smPC')
 rule('PROTEIN_DIPSTICK_2_3',allof(anyof(c('proteinuria_dipstick','in',['2+','3+']),c('urine_protein_g_l','>=',1)),anyof(missing('urine_protein_g_24h'),c('urine_protein_g_24h','<=',2)),anyof(missing('nephrotic_syndrome'),no('nephrotic_syndrome')),anyof(missing('proteinuria_dipstick'),c('proteinuria_dipstick','!=','4+'))),'proceed_with_caution',b,'NCCP permits the current scheduled dose after a2+/3+ or>=1 g/L screen only if no other hold/stop applies. Arrange24-hour protein within three days before the NEXT dose. A known24-hour result or nephrotic syndrome takes priority.',4,3)
 rule('PROTEIN_DIPSTICK_4',c('proteinuria_dipstick','==','4+'),'withhold',b,'Withhold bevacizumab for4+ dipstick and obtain a24-hour urine collection. Confirm the relevant specimen timing and consultant decision if a concurrent quantified result is available.',4,3)
 rule('PROTEIN_2_TO_4',allof(c('urine_protein_g_24h','>',2),c('urine_protein_g_24h','<=',4)),'withhold',b,'Hold bevacizumab, recheck24-hour urine protein every two weeks and consider resumption only when<=2 g/24h and no other restriction remains.',4,3)
 rule('PROTEIN_OVER_4',c('urine_protein_g_24h','>',4),'discontinue',b,'Discontinue bevacizumab for24-hour urine protein above4 g/24h.',4,3)
 rule('NEPHROTIC_SYNDROME',yes('nephrotic_syndrome'),'permanently_discontinue',b,'Permanently discontinue bevacizumab for nephrotic syndrome/source grade4 proteinuria. This is distinct from dipstick4+ and does not require a particular recorded24-hour result.',7,section='4.4',product='avastin-ema-smPC')
 rule('TE_FISTULA',yes('tracheoesophageal_fistula'),'permanently_discontinue',b,'Discontinue bevacizumab for any tracheoesophageal fistula, even when the entered fistula grade is below4.',4,4)
 rule('GRADE4_FISTULA',c('fistula_grade','>=',4),'discontinue',b,'Discontinue bevacizumab for any grade4 fistula.',4,4)
 rule('OTHER_INTERNAL_FISTULA',yes('other_internal_fistula'),'consultant_review',b,'Consider discontinuation for another internal fistula; obtain consultant review. Do not infer safety from a grade below4.',6,section='4.4',product='avastin-ema-smPC')
 rule('THROMBOEMBOLIC_G4',c('thromboembolic_event_grade','>=',4),'discontinue',b,'Discontinue bevacizumab for grade4 thromboembolic events.',4,4)
 rule('THROMBOEMBOLIC_G2_G3',allof(c('thromboembolic_event_grade','>=',2),c('thromboembolic_event_grade','<=',3)),'consultant_review',b,'Lower-grade thromboembolism requires close monitoring and a treatment/anticoagulation plan. An arterial event has a separate permanent-stop pathway.',7,section='4.4',product='avastin-ema-smPC')
 rule('ARTERIAL_THROMBOEMBOLIC_EVENT',yes('arterial_thromboembolic_event'),'permanently_discontinue',b,'Permanently discontinue bevacizumab after an arterial thromboembolic event, independently of the entered event grade.',7,section='4.4',product='avastin-ema-smPC')
 rule('HAEMORRHAGE_G3PLUS',c('haemorrhage_grade','>=',3),'discontinue',b,'Discontinue bevacizumab for grade3 or higher haemorrhage.',4,4)
 rule('NEW_BLEEDING_REVIEW',yes('new_major_bleeding'),'withhold',b,'Withhold pending urgent assessment of new significant bleeding, its site and grade. Intracranial haemorrhage is also a regimen exclusion.',7,section='4.4',product='avastin-ema-smPC')
 for field,id,typ,msg in [('gi_perforation','GI_PERFORATION','permanently_discontinue','Permanently discontinue bevacizumab for GI perforation; manage urgently.'),('necrotising_fasciitis','NECROTISING_FASCIITIS','discontinue','Discontinue bevacizumab and institute urgent treatment for necrotising fasciitis.'),('pres_confirmed','PRES','discontinue','Discontinue bevacizumab and manage confirmed PRES. Safety of restarting after PRES is not established.')]:rule(id,yes(field),typ,b,msg,5 if field=='gi_perforation' else 6,section='4.4',product='avastin-ema-smPC')
 rule('SUSPECTED_PRES',yes('suspected_pres_or_acute_neuro_symptoms'),'withhold',b,'Withhold pending urgent clinical and imaging assessment for suspected PRES or acute neurological deterioration. Do not assume these symptoms are expected tumour effects.',6,section='4.4',product='avastin-ema-smPC')
 rule('INFUSION_REACTION',yes('infusion_reaction'),'withhold',b,'Stop the infusion and assess/manage the reaction promptly. Resumption, if any, requires a product-specific consultant plan.',8,section='4.4',product='avastin-ema-smPC')
 rule('RISK_REVIEW',yes('high_bleeding_thrombotic_cardiovascular_or_fistula_risk'),'consultant_review',b,'Review bleeding/clotting, cardiovascular, aneurysm/dissection, prior radiation and fistula/perforation risks before bevacizumab. Cautions are not automatic clearance or a fixed dose reduction.',2)
 rule('CONCURRENT_RT_REVIEW',yes('concurrent_radiotherapy'),'consultant_review',both,'Review concurrent RT with the specialist team: bevacizumab/RT safety is not established in NCCP00742, and RT can increase lomustine marrow toxicity.',6 if code=='00742' else 3,product=None if code=='00742' else 'lomustine-medac-smPC',section=None if code=='00742' else '4.5')
 rule('PRODUCT_CONTRAINDICATION_REVIEW',yes('wheat_allergy_or_nitrosourea_nonresponse'),'contraindicated',l,'The current lomustine medac product lists wheat allergy and prior nitrosourea nonresponse as contraindications. Confirm the supplied product with oncology pharmacy before treatment.',2,section='4.3',product='lomustine-medac-smPC')
 rule('LIVE_VACCINE_REVIEW',yes('live_vaccine_planned_or_given'),'withhold',l,'Do not proceed until the live-vaccine and immunosuppression risk is urgently reviewed. Current lomustine product information contraindicates live vaccines during immunosuppression.',2,section='4.3-4.5',product='lomustine-medac-smPC')
 rule('INTERACTION_REVIEW',yes('interaction_review_needed'),'consultant_review',both,'Reconcile all medicines, especially antiepileptics, cimetidine/theophylline and anticoagulants. Confirm INR monitoring if warfarin is used; do not silently stop antiseizure treatment.',3,section='4.5',product='lomustine-medac-smPC')
 rule('MONITORING_SUPPORT_REVIEW',yes('monitoring_or_support_not_ready'),'consultant_review',both,'Review baseline/regular FBC, renal/liver results, urine protein and BP, plus a weekly CBC plan for at least six weeks after lomustine. Add conditional PFT/echo and warfarin INR. Confirm separate oral antiemetics on lomustine day; no routine antiemetics on bevacizumab-only visits.',2)
 rule('LOM_SUPPLY_SAFETY',yes('lomustine_formulation_or_supply_uncertain'),'withhold',l,'Confirm prescribed single-course dose, capsule strength, supply and instructions with pharmacy. Lomustine is not a daily medicine and should not be repeated before six weeks.',1)
 for r in rules:
  if r['id']=='RISK_REVIEW':r['additional_sources']=[source(7,section='4.4',product='avastin-ema-smPC'),source(8,section='4.4',product='avastin-ema-smPC')]
  if r['id']=='CONCURRENT_RT_REVIEW':
   r['additional_sources']=[source(3,section='4.5',product='lomustine-medac-smPC')]
   if code=='00804':
    msg='Review concurrent RT with the specialist team: radiation can increase lomustine marrow toxicity. Confirm the separate radiotherapy plan and do not infer that this systemic regimen defines it.'
    r['action']['message']=r['action']['recommendation']=r['explanation']=msg
  if r['id']=='SEVERE_UNCONTROLLED_BP':
   if code=='00742':r['additional_sources']=[source(6,section='Regimen-specific complications')]
   else:
    msg='Discontinue bevacizumab when medically significant hypertension cannot be adequately controlled despite treatment. The inherited severe-BP flag requires a clinically confirmed uncontrolled state; this NCCP document gives no separate numeric permanent-stop threshold.'
    r['action']['message']=r['action']['recommendation']=r['explanation']=msg
  if r['id']=='MONITORING_SUPPORT_REVIEW':r['additional_sources']=[source(2,section='4.4',product='lomustine-medac-smPC'),source(5,section='Emetogenic potential')]
  if r['id'] in ['ACTIVE_INFECTION','LOM_PULMONARY','LOM_OTHER_SEVERE_TOXICITY','NEW_BLEEDING_REVIEW','SUSPECTED_PRES','MONITORING_SUPPORT_REVIEW']:
   r['evidence_interpretation']='Conservative assessment/review pathway derived from the cited warning; not a newly invented numeric NCCP dose-reduction table.'
  if r['action']['components']==[l]:
   r['when']=allof(anyof(missing('visit_type'),c('visit_type','!=','bevacizumab_only')),r['when'])
 rule('BEV_ONLY_VISIT_CONTEXT',c('visit_type','==','bevacizumab_only'),'proceed_with_caution',b,'This is a bevacizumab-only administration. Do not repeat lomustine. Continue delayed-toxicity monitoring and assess bevacizumab using its own safety criteria.',1)
 rule('BEV_ONLY_DELAYED_TOXICITY_REVIEW',allof(c('visit_type','==','bevacizumab_only'),anyof(c('anc_x10e9_l','<',1),c('platelets_x10e9_l','<',100),yes('pulmonary_symptoms_or_concern'),c('other_nonhaem_toxicity_grade','>=',3))),'consultant_review',b,'Lomustine is not due at this visit, but possible delayed toxicity needs assessment. Do not apply a lomustine numeric dose threshold as an automatic bevacizumab hold; the consultant must assess fitness for the bevacizumab-only administration.',3,1)
 for key,definition in i.items():
  if 'demo_value' not in definition:
   if definition['type']=='boolean':definition['demo_value']=key in ['wound_fully_healed','eligible_recurrent_glioblastoma_confirmed']
   elif definition['type']=='select':definition['demo_value']=definition['options'][0]['value']
   else:definition['demo_value']={'cycle_number':1,'crcl_ml_min':80,'fvc_percent_predicted':90,'wbc_x10e9_l':5,'days_since_last_lomustine':42,'days_since_major_surgery':90,'lomustine_cumulative_with_next_mg_m2':90}.get(key,0)
 if code=='00804':
  for r in rules:
   if r['id']=='PLANNED_MAJOR_SURGERY':r['action']['message']=r['action']['recommendation']=r['explanation']='Withhold bevacizumab for major elective surgery and agree timing with the consultant and surgeon; the EMA source does not specify a universal preoperative interval.'
   if r['id']=='PLANNED_MINOR_SURGERY':r['action']['message']=r['action']['recommendation']=r['explanation']='Agree any bevacizumab interruption for the planned minor procedure with the consultant and surgeon. This NCCP regimen does not specify a universal minor-procedure interval.'
 p['rule_engine']['rules']=rules;p['required_inputs']=[]
 m=p['metadata'];m.update(sactcheck_encoding_version='0.84.39',clinical_audit_release='0.84.39',source_checked_date='2026-11-05',source_document_pages=si['pages'],source_pdf_sha256=si['sha256'],source_revision_date=si['last_reviewed_date'],source_review_date=si['next_review_date'],source_document_version=si['version'])
 m['validation']={**m.get('validation',{}),'source_document_checked':True,'software_tests_completed':False,'consultant_reviewed':False,'oncology_pharmacy_reviewed':False,'clinical_use_authorised':False,'audit_release':'0.84.39','rule_level_source_reconciliation_status':'source_reconciled_pending_independent_clinical_and_oncology_pharmacy_validation'}
 m['encoding_maturity']={'level':'source_reconciled_pending_independent_validation','source_reconciled':True,'consultant_reviewed':False,'oncology_pharmacy_reviewed':False,'clinical_use_authorised':False,'audit_release':'0.84.39','audit_date':'2026-11-05','scope_note':'NCCP and current product sources reconciled with explicit gaps/conflicts. Software evidence does not establish independent clinical approval.'}
 m['clinical_source_supplements']=[source(2,section='4.2-4.6',product='lomustine-medac-smPC'),source(5,section='4.2-4.6',product='avastin-ema-smPC')]
 m['source_conflicts']=[{'topic':'Platelets80 to<100','resolution':'Source table does not allocate a dose. Specialist review unless an existing hold still requires recovery to100.'},{'topic':'Lomustine blood-count recovery','resolution':'NCCP ANC>=1 differs from common SmPC WBC>=4. These measures are not interchangeable; reconcile the product and clinical context before restart.'},{'topic':'Lomustine nadir table overlap','resolution':'Current common SmPC70% row includes platelets24,000-74,999 but50% row includes<25,000. No automated dose from that overlapping source table.'},{'topic':'Lomustine contraception','resolution':'NCCP6months after treatment differs from current common SmPC7months for women/4months for men. Confirm the actual products and combined regimen with pharmacy.'},{'topic':'Pulmonary monitoring','resolution':'NCCP PFTs are conditional; current common SmPC recommends baseline and ongoing tests. Source-specific planning must remain explicit.'},{'topic':'Renal dose basis and cap','resolution':'75% of original lomustine dose requires the actual original capped dose and prior reduction history. No automatic multiplication of a nominal90mg/m2 reference.'}]
 days=[1,15,29] if code=='00742' else [1,22];bev=5 if code=='00742' else 7.5
 p['treatment'].update(planned_cycles=6,duration_type='fixed_cycles',duration_text='Up to six42-day cycles; delays and dose changes depend on the individual plan.',schedule_summary=f'Bevacizumab{bev} mg/kg IV on Days '+','.join(map(str,days))+' and lomustine90 mg/m² orally on Day1 (maximum160 mg), every42 days for up to six cycles.',source=source(1))
 p['treatment']['components']=[{'drug':b,'dose':f'{bev} mg/kg','route':'IV','days':days,'note':'Initial infusion90minutes, then60 and30minutes only if tolerated; rapid infusion requires the separate approved local plan. No bolus.','source':source(1)},{'drug':l,'dose':'90 mg/m² (maximum 160 mg)','route':'PO','days':[1],'note':'Single Day1 oral dose only, not daily. Confirm the actual capped dose, capsule strength and pharmacy supply. Never repeat before six weeks.','source':source(1)}]
 p['supportive_care']['consent_notes']=['Bevacizumab treatment of glioblastoma is outside the current EMA licensed indications; confirm local consent and governance.', 'NCCP identifies lomustine as an unlicensed product; coordinate pharmacy supply and consent.', 'Rapid bevacizumab infusion is a separate off-label administration method requiring local approval and consent.']
 p['supportive_care'].update(emetogenic_risk='oral_moderate_high',script_id='nccp-lomustine-bev-v08439',mapping_basis='NCCP: lomustine oral moderate-to-high risk on Day1; bevacizumab minimal on each infusion day. Distinct phase/day plans require local pharmacy validation.',monitoring='NCCP baseline/regular FBC, renal/liver, urine protein and BP; baseline glucose and conditional PFT/echo/INR. Current lomustine SmPC prefers weekly CBC for at least six weeks after each dose. No fixed MRI interval specified.',contraception='Ask oncology pharmacy to confirm the actual products and all regimen components: NCCP six-month wording differs from the current lomustine common SmPC (women seven months; men four months).',administration_safety='Single Day1 lomustine dose with at least six weeks between courses. Bevacizumab-only visits do not require another lomustine dose.',source=source(5))
 prose_keys={'label','message','recommendation','explanation','note','schedule_summary','duration_text','mapping_basis','monitoring','contraception','administration_safety','resolution'}
 def tidy(obj):
  if isinstance(obj,dict):
   for key,value in obj.items():
    if key in prose_keys and isinstance(value,str):
     value=re.sub(r'(?<=[A-Za-z])(?=\d)', ' ',value)
     value=re.sub(r'(?<=\d)(?=[A-Za-z])', ' ',value)
     value=re.sub(r'(?<=[a-zA-Z])(?=[<>]=?|[=]\d)', ' ',value)
     value=re.sub(r'(?<=[,;])(?=[A-Za-z])',' ',value)
     obj[key]=value
    else:tidy(value)
  elif isinstance(obj,list):
   for value in obj:tidy(value)
 tidy(p)
 dest.write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n');print(code,len(i),'inputs',len(rules),'rules')
(A/'source-index.json').write_text(json.dumps({'nccp':[x for x in sources if x['code'] in ['00742','00804']],'supplements':supplements},indent=2)+'\n')
