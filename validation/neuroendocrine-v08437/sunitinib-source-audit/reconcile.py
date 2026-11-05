#!/usr/bin/env python3
"""Source-specific NCCP00327v5/EMA reconciliation. Only writes owned protocol."""
from pathlib import Path
import json,copy,re
HERE=Path(__file__).resolve().parent; ROOT=HERE.parents[2]
NAME='00327-sunitinib-37-5-mg-therapy-28-day.json'; TARGET=ROOT/'protocols/neuroendocrine'/NAME
p=json.loads((HERE/'protocol-before'/NAME).read_text())
N='https://healthservice.hse.ie/documents/6919/327_V5_SUNitinib_37.5mg.pdf'
M='https://www.ema.europa.eu/en/documents/product-information/sutent-epar-product-information_en.pdf'
man=json.loads((HERE/'sources/manifest.json').read_text())
def src(page,table=None,ema=False,section=None):
 d={'document':'EMA Sutent SmPC (current linked product information)' if ema else 'NCCP00327 SUNitinib37.5mg v5, 15 September 2025','url':M if ema else N,'page':page,'retrieved':'2026-11-05','sha256':man[1 if ema else 0]['sha256']}
 if table:d['table']=table
 if section:d['section']=section
 return d
m=p['metadata'];m.update(sactcheck_encoding_version='0.84.37',source_checked_date='2026-11-05',clinical_audit_release='0.84.37',source_pdf_sha256=man[0]['sha256'],source_revision_date='2025-09-15',source_review_date='2030-09-15',review_date='2030-09-15',clinical_source_supplements=[src(3,ema=True,section='4.2–4.5')])
m['validation'].update(audit_release='0.84.37',rule_level_source_reconciliation_status='source_reconciled_pending_independent_clinical_and_oncology_pharmacy_validation')
m['encoding_maturity'].update(level='source_reconciled_pending_independent_validation',label='Source reconciled · independent clinical/pharmacy review pending',source_reconciled=True,audit_release='0.84.37',audit_date='2026-11-05',scope_note='NCCP00327v5 and current EMA SmPC reconciled. Source conflicts/unspecified decisions require specialist judgement. This software audit is not independent clinical approval.')
m['source_conflicts']=[{'topic':'Severe hepatic impairment','nccp':src(3,2),'supplement':src(4,ema=True,section='4.2'),'resolution':'NCCP suggests considering 75% original dose in Child-Pugh C; EMA cannot recommend use because it was not studied. Consultant/pharmacy reconciliation required; no automatic percentage or numeric dose.'}]
p['clinical_governance']['dose_modification_note']='Every dose change requires Consultant Medical Oncologist review. Preserve current prescribed dose and all prior reductions; no automatic restart or escalation. Resolve the Child-Pugh C NCCP/EMA source conflict before prescribing.'
p['treatment'].update(administration='Continuous once-daily oral dosing at the same time; consistently with or without food; swallow capsules whole with water. No routine treatment-free week.',missed_dose='Do not take an additional dose. Take the usual prescribed dose the following day.',dose_levels_mg={'minus_1':25,'standard':37.5,'plus_1':50},source=src(1))
p['treatment']['components']=[{'drug': 'sunitinib', 'dose': '37.5 mg once daily', 'route': 'PO', 'days': ['Continuous'], 'note': 'Continuous daily treatment without a scheduled off-week. Take at the same time each day, consistently with or without food; swallow whole with water. Missed dose: no additional dose; take the usual prescribed dose the following day.', 'source': {'document': 'NCCP00327 SUNitinib37.5mg v5, 15 September 2025', 'url': 'https://healthservice.hse.ie/documents/6919/327_V5_SUNitinib_37.5mg.pdf', 'page': 1, 'retrieved': '2026-11-05', 'sha256': 'ec62d63691c40cc8d72a32f0c6bccebea50e2d3affde7f91984764fd8fe05010'}}]
p['treatment']['schedule_summary']='Sunitinib 37.5 mg orally once daily continuously. The 28-day cycle is a review interval, with no scheduled off-week.'
d=p['input_definitions']
def boolean(field,label,guidance=''):
 d[field]={'label':label,'type':'boolean','required':False,'demo_value':False,'input_role':'decision'}
 if guidance:d[field]['assessment_guidance']=guidance

def select(field,label,values,demo=None,guidance=''):
 d[field]={'label':label,'type':'select','required':False,'options':[{'value':v,'label':lab} for v,lab in values],'input_role':'decision'}
 if demo is not None:d[field]['demo_value']=demo
 if guidance:d[field]['assessment_guidance']=guidance
boolean('indication_eligible','Adult with progressive, unresectable/metastatic well-differentiated pancreatic NET','NCCP00327a is a pancreatic NET indication, not all NET or NEC. Check pathology, disease progression and adult status.')
d['indication_eligible']['demo_value']=True
select('assessment_stage','Treatment assessment stage',[('starting','Before first dose'),('continuing','During treatment / restarting')],'starting')
boolean('severe_uncontrolled_hypertension','Severe hypertension uncontrolled despite medical management','During treatment: temporarily suspend until appropriately controlled. NCCP does not specify a numerical BP threshold for this decision.')
boolean('pretreatment_or_cycle_tests_missing','Required baseline or pre-cycle tests unavailable / not reviewed','Baseline FBC, renal/liver profile, TFT and BP; FBC/renal/liver before each28day cycle; TFT every12weeks; BP each attendance. Cardiac tests as clinically indicated.')
select('renal_status','Renal function / dialysis context',[('normal','No renal impairment'),('impaired','Renal impairment'),('haemodialysis','Haemodialysis')],'normal')
select('thyroid_status','Thyroid status',[('normal','No thyroid disorder identified'),('untreated_preexisting','Pre-existing hypo/hyperthyroidism not treated'),('new_dysfunction','New or worsening thyroid dysfunction on treatment')],'normal')
select('proteinuria_status','Urinalysis / proteinuria status',[('none','No proteinuria identified'),('new_or_worsening','New or worsening proteinuria'),('nephrotic','Nephrotic syndrome')],'none','EMA recommends baseline urinalysis and monitoring. Do not substitute an invented protein/creatinine or24hour threshold.')
select('current_dose_mg','Current prescribed daily dose (mg)',[(25,'25mg'),(37.5,'37.5mg'),(50,'50mg'),(62.5,'62.5mg (inducer-specific specialist plan)'),('other','Other specialist dose')],37.5,'Never reset a previously reduced dose to37.5mg merely because current counts/toxicity have recovered.')
boolean('episode_dose_change_completed','Dose change for this toxicity episode already implemented','Record the current episode only. Avoid repeatedly applying the same dose reduction at every review.')
# NCCP table3 gives grades, but no CTCAE edition. The explicit UI aid is not presented as the source table.
d['other_toxicity_grade']['label']='Current grade of other treatment-related toxicity (including diarrhoea/mucositis)'
d['other_toxicity_grade']['assessment_guidance']='CTCAE v5 UI aid only: NCCP00327 table3 gives grade-based actions without naming a CTCAE edition. Grade the named adverse event using its specific criteria; exclude HFS/cardiac and serious-event pathways which have separate actions.'
d['other_toxicity_highest_grade']=copy.deepcopy(d['other_toxicity_grade']);d['other_toxicity_highest_grade']['label']='Highest grade in the current other-toxicity episode (retain during recovery)'
for field,label in [('hand_foot_syndrome_grade','Current hand-foot syndrome grade'),('hand_foot_highest_grade','Highest hand-foot syndrome grade in this episode (retain during recovery)')]:
 d[field]=copy.deepcopy(d['hand_foot_syndrome_grade']);d[field]['label']=label
 d[field]['options']=[{'value':0,'label':'Grade0','ctcae_grade':0,'description':'No hand-foot syndrome.'},{'value':1,'label':'Grade1','ctcae_grade':1,'description':'Minimal skin changes or dermatitis without pain.'},{'value':2,'label':'Grade2','ctcae_grade':2,'description':'Skin changes with pain limiting instrumental activities of daily living.'},{'value':3,'label':'Grade3','ctcae_grade':3,'description':'Severe skin changes with pain limiting self-care activities of daily living.'}]
 d[field]['assessment_guidance']='CTCAE v5 hand-foot syndrome aid (grades0–3); NCCP00327 table3 does not name a CTCAE edition. Enter recurrence and retain the highest episode grade after recovery. First grade2 still requires interruption.'
d['hand_foot_occurrence']['label']='Occurrence count at the highest hand-foot episode grade'
d['hand_foot_occurrence']['assessment_guidance']='Count occurrences at the grade driving the decision: reduce from the2nd grade2 episode or1st grade3 episode. Do not count low-grade episodes as recurrent grade2.'
select('severe_skin_reaction','Severe cutaneous reaction status',[('none','None identified'),('suspected','Signs of SJS/TEN/erythema multiforme'),('confirmed_sjs_ten','Confirmed SJS/TEN, including previous confirmed episode'),('resolved_em','Resolved suspected erythema multiforme; considering rechallenge')],'none')
boolean('major_surgery_or_unhealed_wound','Major surgery planned / recent with wound healing not established','Temporarily interrupt for major surgery. NCCP/EMA specify no universal interval; restart only after clinical recovery assessment.')
boolean('active_significant_bleeding','Active significant bleeding / possible GI perforation','Urgent clinical assessment; NCCP/EMA give no universal numerical restart threshold.')
boolean('anticoagulant_use','Concomitant anticoagulant','Review bleeding risk; periodic FBC, coagulation/PT-INR and examination as appropriate to the anticoagulant.')
boolean('pancreatitis_symptoms','Signs or symptoms consistent with pancreatitis')
boolean('liver_failure_signs','Signs or symptoms of hepatic failure')
boolean('thrombotic_microangiopathy','Thrombotic microangiopathy diagnosed')
boolean('fistula_formation','New fistula formation')
boolean('angioedema','Angioedema')
boolean('seizures_or_pres','Seizures / suspected posterior reversible encephalopathy syndrome')
boolean('necrotising_fasciitis','Necrotising fasciitis diagnosed')
boolean('symptomatic_hypoglycaemia','Symptomatic hypoglycaemia')
boolean('unexplained_mental_status_change','Unexplained lethargy or altered mental status','Evaluate ammonia and metabolic causes; EMA hyperammonaemic encephalopathy warning.')
boolean('tls_risk_present','Clinical tumour lysis risk present','Assess tumour burden, renal function, hydration and other risk factors; consider prophylactic hydration and close monitoring.')
boolean('dental_onj_concern','ONJ symptoms / invasive dental procedure or IV bisphosphonate concern','Dental review and preventive assessment; no universal interruption interval is specified.')
boolean('aneurysm_or_dissection_risk','Aneurysm/dissection risk requiring review','Review hypertension and personal aneurysm history before treatment.')
d['lvef_percent']={'label':'Current measured LVEF','type':'number','required':False,'min':0,'max':100,'step':0.1,'unit':'%','demo_value':60,'input_role':'decision','assessment_guidance':'NCCP caution below55%. Also enter clinical decline/symptom status; a percentage alone cannot establish change from baseline.'}
boolean('escalation_requested','Considering dose escalation for lack of response')
d['treatment_weeks']={'label':'Completed weeks of treatment for escalation review','type':'number','required':False,'min':0,'step':0.1,'demo_value':8,'input_role':'decision'}
boolean('no_response','No response at response assessment')
select('haematological_toxicity_grade','Highest treatment-related haematological toxicity grade',[(i,f'Grade{i}') for i in range(5)],0,'Used only for the source escalation eligibility review; CBC delay thresholds remain independently applicable.')
# All rules carry precise source metadata. Restrictive independent findings remain actionable with partial input.
r=[]
def c(f,op,v=None): return {'field':f,'operator':op,**({'value':v} if v is not None else {})}
def allc(*cs):return {'all':list(cs)}
def anyc(*cs):return {'any':list(cs)}
def add(id,when,type,message,page=3,table=None,ema=False,section=None):
 r.append({'id':'SUN327_'+id,'priority':100 if type in ['permanently_discontinue','discontinue','contraindicated'] else 80 if type in ['withhold','delay','delay_then_dose_reduce'] else 50,'when':when,'action':{'type':type,'components':['sunitinib'],'message':message},'source':src(page,table,ema,section),'explanation':message})
add('INDICATION',c('indication_eligible','==',False),'consultant_review','Confirm adult progressive unresectable/metastatic well-differentiated pancreatic NET eligibility. This schedule does not cover other NET/NEC or the renal50mg4/2 regimen.',1)
add('ECOG_GT2',c('ecog','>',2),'consultant_review','ECOG above2 is outside NCCP eligibility; Consultant review required.',1)
add('HYPERSENSITIVITY',c('hypersensitivity','==',True),'contraindicated','Known hypersensitivity is an exclusion; do not administer.',1)
add('PREGNANCY_BF',anyc(c('pregnancy','==',True),c('breastfeeding','==',True)),'contraindicated','Pregnancy and breastfeeding are NCCP exclusions.',1)
add('UNCONTROLLED_HTN',c('uncontrolled_hypertension','==',True),'consultant_review','Uncontrolled hypertension requires stage and severity review: it excludes initiation; during treatment the source requires temporary suspension when severe and uncontrolled despite medical management. Establish control and a clinical plan.',4)
add('SEVERE_HTN_HOLD',c('severe_uncontrolled_hypertension','==',True),'withhold','Severe hypertension uncontrolled despite medical management: temporarily suspend sunitinib. Resume only when appropriately controlled after clinical review; this is not an irreversible discontinuation.',4)
add('HTN_START_EXCLUSION',allc(c('assessment_stage','==','starting'),c('uncontrolled_hypertension','==',True)),'contraindicated','Uncontrolled hypertension is an NCCP pre-treatment exclusion; establish control before initiation.',1)
for f,b,id in [('anc',1,'ANC_LT1'),('platelets',75,'PLT_LT75')]:add(id,c(f,'<',b),'delay',f'{f.upper() if f=="anc" else "Platelets"} below{b}×10⁹/L: delay sunitinib. Recovery of this value alone does not clear other domains.',2,1)
add('COUNTS_MEET',allc(c('anc','>=',1),c('platelets','>=',75)),'proceed_with_caution','Both NCCP blood-count thresholds are met. Table1 gives100% for this domain only; retain the current prescribed dose and prior reductions. No automatic restart or escalation.',2,1)
add('TESTS_MISSING',c('pretreatment_or_cycle_tests_missing','==',True),'consultant_review','Obtain/review required tests: baselineFBC, renal/liver, thyroid and BP; FBC/renal/liver each28day cycle, TFT every12weeks, BP each attendance; cardiac tests as indicated. No overall treatment clearance with missing reviews.',2)
add('RENAL',c('renal_status','==','impaired'),'proceed_with_caution','Renal impairment alone does not require a starting-dose adjustment. Monitor renal function/proteinuria and individual safety; this does not clear acute renal toxicity.',3,2)
add('DIALYSIS',c('renal_status','==','haemodialysis'),'consultant_review','No initial dose adjustment for haemodialysis. NCCP permits later increase guided by sunitinib plus active-metabolite trough concentrations; specialist interpretation required. Do not automatically escalate.',3,2)
add('CHILD_PUGH_AB',c('child_pugh_class','in',['A','B']),'proceed_with_caution','Child-PughA/B: no starting adjustment solely for hepatic class. Continue liver monitoring and retain any prior toxicity reduction.',3,2)
add('CHILD_PUGH_C',c('child_pugh_class','==','C'),'consultant_review','SOURCE CONFLICT: NCCPTable2 suggests considering75% original dose in Child-PughC; current EMA SmPC4.2 cannot recommend use in severe hepatic impairment because it was not studied. Resolve with Consultant/pharmacy before treatment. No calculated percentage or numeric dose is supplied.',3,2)
r[-1]['source']['conflicting_source']=src(4,ema=True,section='4.2')
add('CYP_INHIBITOR',c('cyp3a4_interaction','==','potent_inhibitor'),'consultant_review','Avoid strong CYP3A4 inhibitors, including grapefruit. If unavoidable, specialist adjustment may be needed to a minimum25mg daily for pNET with careful tolerability monitoring. No automatic dose change.',2)
add('CYP_INDUCER',c('cyp3a4_interaction','==','potent_inducer'),'consultant_review','Avoid strong CYP3A4 inducers, including StJohn’swort. If unavoidable, specialist adjustment in12.5mg steps may be considered up to62.5mg daily for pNET with close toxicity monitoring; no automatic escalation.',2)
add('CARDIAC_CAUTION',c('significant_cardiovascular_disease_or_lvef_lt55','==',True),'consultant_review','Significant cardiovascular disease and/or LVEF<55% needs specialist cardiac risk assessment and appropriate baseline/periodic imaging.',1)
add('LVEF_BELOW55',c('lvef_percent','<',55),'consultant_review','Current LVEF below55% meets the NCCP cardiac caution. Assess symptoms, prior measurements and need for specialist imaging/review; do not calculate a dose from LVEF alone.',1)
add('QT_CAUTION',c('qt_risk_present','==',True),'consultant_review','Review QT history, QT-prolonging medicines/antiarrhythmics, bradycardia and electrolytes; ECG/cardiac assessment as clinically indicated. NCCP gives no standalone numeric QTc dose threshold.',1)
add('LVEF_ASYMPTOMATIC',c('lvef_status','==','asymptomatic_decline'),'withhold','Delay for asymptomatic LVEF decline until recovery, then CONSIDER dose reduction with Consultant. Table3 is broader than the narrative EF<50% and>20%below-baseline trigger; the text does not establish a percentage-point calculation. No automatic reduced-dose restart.',3,3)
add('LVEF_SYMPTOMATIC',c('lvef_status','==','symptomatic_decline'),'discontinue','Symptomatic LVEF decline / clinical heart failure: discontinue sunitinib and manage urgently.',3,3)
add('THYROID_UNTREATED',c('thyroid_status','==','untreated_preexisting'),'consultant_review','Treat pre-existing hypo/hyperthyroidism before initiation. No fixedTSH or freeT4 treatment threshold is specified in NCCP.',4)
add('THYROID_NEW',c('thyroid_status','==','new_dysfunction'),'consultant_review','Assess and manage thyroid dysfunction per standard practice; continueTFT surveillance. No automatic dose hold or dose reduction is specified solely for an abnormalTFT.',4)
add('TOX_G3',c('other_toxicity_grade','>=',3),'delay_then_dose_reduce','Current grade3–4 other toxicity: delay until grade1 or less, then reduce by one12.5mg dose level after Consultant review of the actual prior dose. Separate serious-event, HFS and cardiac actions override this generic pathway.',3,3)
add('TOX_RECOVERING_G2',allc(c('other_toxicity_highest_grade','>=',3),c('other_toxicity_grade','==',2)),'delay','Prior grade3–4 episode remains above the grade1 recovery target; continue delay at current grade2.',3,3)
add('TOX_RECOVERY_REVIEW',allc(c('other_toxicity_highest_grade','>=',3),c('other_toxicity_grade','<=',1)),'consultant_review','Recovered grade3–4 episode: a one-level reduction is due unless already implemented for this episode. Confirm actual current dose and episode dose-change history; never restore the original dose automatically.',3,3)
add('HFS_G2_HOLD',c('hand_foot_syndrome_grade','==',2),'delay','All grade2 HFS, including FIRST occurrence, requires delay until grade1 or less. Reduction begins at the second grade2 occurrence; confirm recurrence history.',3,3)
add('HFS_G2_RECURRENT',allc(c('hand_foot_syndrome_grade','==',2),c('hand_foot_occurrence','>=',2)),'delay_then_dose_reduce','Recurrent grade2 HFS: delay until grade1 or less, then reduce dose for subsequent cycles. Confirm current dose and prior reductions.',3,3)
add('HFS_G3',c('hand_foot_syndrome_grade','==',3),'delay_then_dose_reduce','First or later grade3 HFS: delay until grade1 or less, then reduce dose for subsequent cycles. Confirm actual current dose and prior reductions.',3,3)
add('HFS_RECOVERY_REVIEW',allc(c('hand_foot_syndrome_grade','<=',1),c('hand_foot_highest_grade','>=',2)),'consultant_review','HFS recovery does not erase the episode. First grade2 may resume the existing prescribed level after clinical review; second/later grade2 or first grade3 requires reduction. Verify occurrence and previous episode adjustment; no automatic restart.',3,3)
reduction_due=anyc(allc(c('other_toxicity_highest_grade','>=',3),c('other_toxicity_grade','<=',1)),allc(c('hand_foot_syndrome_grade','<=',1),anyc(c('hand_foot_highest_grade','==',3),allc(c('hand_foot_highest_grade','==',2),c('hand_foot_occurrence','>=',2)))))
add('DOSE_AFTER_RECOVERY',allc(reduction_due,c('episode_dose_change_completed','==',False),c('current_dose_mg','in',[37.5,50])),'consultant_review','A dose reduction is due for this recovered episode. Consultant to select one12.5mg level below the actual prescribed dose(37.5→25mg;50→37.5mg); this is not automatic prescribing or clearance of other domains.',3,3)
add('DOSE_BELOW_TABLE',allc(reduction_due,c('episode_dose_change_completed','==',False),c('current_dose_mg','in',[25,62.5,'other'])),'consultant_review','Further reduction requires an individual Consultant/pharmacy plan:25mg is the lowest listed NCCP dose level;62.5mg belongs to the unavoidable-inducer context. Do not invent a next dose or reset to37.5mg.',2)
add('DOSE_ALREADY_CHANGED',allc(reduction_due,c('episode_dose_change_completed','==',True)),'consultant_review','The recorded episode reduction was already implemented. Do not apply a duplicate reduction; reconcile the current dose, response and recovery with Consultant.',3,3)
add('SKIN_SUSPECTED',c('severe_skin_reaction','==','suspected'),'discontinue','Signs of SJS/TEN/erythema multiforme: discontinue and urgently assess. ConfirmedSJS/TEN must never be restarted.',4)
add('SKIN_CONFIRMED',c('severe_skin_reaction','==','confirmed_sjs_ten'),'permanently_discontinue','ConfirmedSJS/TEN: permanently discontinue; sunitinib must not be restarted even after resolution.',4)
add('SKIN_EM_RESOLVED',c('severe_skin_reaction','==','resolved_em'),'consultant_review','Resolved suspectedEM: any lower-dose rechallenge is a specialist decision. This exception does not permit rechallenge after confirmedSJS/TEN.',4)
add('SURGERY',c('major_surgery_or_unhealed_wound','==',True),'withhold','Temporarily interrupt for major surgery. Resume only after clinical recovery/wound-healing assessment; neither NCCP nor EMA provides a universal restart interval.',5)
add('BLEEDING',c('active_significant_bleeding','==',True),'consultant_review','Urgent assessment of significant bleeding or possible GI perforation and treatment suitability. Apply the graded-toxicity/serious-event pathway as appropriate; no universal numerical dose/restart threshold is stated.',5)
add('ANTICOAGULANT',c('anticoagulant_use','==',True),'consultant_review','Review bleeding and interactions; monitorFBC/coagulation(PT/INR where relevant) and examine periodically. Do not useINR to monitor a medicine for which it is not applicable.',5)
add('ANEURYSM',c('aneurysm_or_dissection_risk','==',True),'consultant_review','Review aneurysm/dissection risk, including hypertension and previous aneurysm, before VEGF-pathway treatment.',4)
for id,field,typ,msg,page in [
 ('PROTEINURIA','proteinuria_status','consultant_review','New/worsening proteinuria needs urinalysis/renal and clinical assessment. Safety of continuing with moderate/severe proteinuria was not studied; no numeric protein cutoff is supplied.',7),
 ('PANCREATITIS','pancreatitis_symptoms','discontinue','Pancreatitis symptoms: discontinue sunitinib and provide appropriate supportive treatment.',7),
 ('HEPATIC_FAILURE','liver_failure_signs','discontinue','Signs/symptoms of hepatic failure: discontinue sunitinib and provide appropriate supportive care.',7),
 ('TMA','thrombotic_microangiopathy','discontinue','Diagnosed thrombotic microangiopathy: discontinue sunitinib and promptly treat.',6),
 ('FISTULA','fistula_formation','withhold','Fistula formation: interrupt sunitinib. Information on continued use is limited; specialist decision required.',7),
 ('ANGIOEDEMA','angioedema','withhold','Angioedema: interrupt sunitinib and seek urgent medical care.',8),
 ('PRES','seizures_or_pres','withhold','Seizures / suspectedPRES: temporarily suspend and obtain urgent assessment/control. Consider resumption only after resolution at physician discretion.',8),
 ('NECROTISING_FASCIITIS','necrotising_fasciitis','discontinue','Necrotising fasciitis: discontinue sunitinib and promptly initiate appropriate treatment.',8),
 ('HYPOGLYCAEMIA','symptomatic_hypoglycaemia','withhold','Symptomatic hypoglycaemia: temporarily interrupt sunitinib and treat. Monitor diabetic patients regularly and adjust antidiabetic therapy to reduce recurrence.',8),
 ('MENTAL_STATUS','unexplained_mental_status_change','consultant_review','Unexplained lethargy or mental-status change: urgent clinical evaluation including ammonia for hyperammonaemic encephalopathy; start appropriate management.',8),
 ('TLS','tls_risk_present','consultant_review','Closely monitor clinical tumour-lysis risk and consider prophylactic hydration; individualize prevention and laboratory monitoring.',8),
 ('DENTAL','dental_onj_concern','consultant_review','Assess suspectedONJ/dental needs. Consider baseline preventive dental care; avoid invasive procedures where possible with prior/concomitantIVbisphosphonates.',8)]:
 add(id,c(field,'==','new_or_worsening' if field=='proteinuria_status' else True),typ,msg,page,ema=True,section='4.4')
add('NEPHROTIC',c('proteinuria_status','==','nephrotic'),'discontinue','Nephrotic syndrome: discontinue sunitinib.',7,ema=True,section='4.4')
add('ESCALATION_REVIEW',c('escalation_requested','==',True),'consultant_review','Dose escalation is optional and Consultant-led, not automatic: NCCP considers+1level after8weeks with no response; the source lists non-haematological grade≤1 or haematological grade≤2. Review both domains. Reconcile prior reductions, interactions and all other findings.',2)
add('ESCALATION_DOSE_HISTORY',allc(c('escalation_requested','==',True),c('current_dose_mg','in',[25,50,62.5,'other'])),'consultant_review','The ordinary NCCP +1 dose level is50mg from the37.5mg starting level. Do not extrapolate another12.5mg increase from an already escalated dose or automatically undo a prior reduction.62.5mg is reserved for the unavoidable-inducer specialist context.',2)
add('ESCALATION_TIMING',allc(c('escalation_requested','==',True),c('treatment_weeks','<',8)),'consultant_review','Before8weeks the source no-response escalation criterion is not met. Do not automatically escalate.',2)
add('ESCALATION_CRITERIA',allc(c('escalation_requested','==',True),c('treatment_weeks','>=',8),c('no_response','==',True),c('other_toxicity_grade','<=',1),c('haematological_toxicity_grade','<=',2)),'consultant_review','Timing, no-response and both entered toxicity bands are compatible with considering escalation. The source uses “or” between the grade bands; this conservative review checks both and does not establish an automatic eligibility formula. NCCP says MAY increase+1level; confirm current dose, prior HFS/cardiac episodes and interaction context. No automatic dose or treatment approval.',2)
add('ESCALATION_NOT_MET',allc(c('escalation_requested','==',True),anyc(c('no_response','==',False),c('other_toxicity_grade','>',1),c('haematological_toxicity_grade','>',2))),'consultant_review','Entered response/toxicity does not meet NCCP optional no-response escalation criteria. Do not escalate on this pathway.',2)
for rule in r:
 rule['action']['dose_calculation']='specialist_review'
 rule['action']['block_numeric_dose']=True
 if rule['action']['type']=='consultant_review':
  rule['action']['show_in_dose_actions']=True
  rule['action']['recommendation']='Individualised Consultant/pharmacy decision required; no calculated dose or automatic restart.'
p['rule_engine']['rules']=r
p['monitoring']=['Baseline: FBC, renal/liver profile, thyroid function, blood pressure. Cardiac assessment/echo orMUGA when clinically indicated or cardiac history.','Before each28day review cycle: FBC, renal and liver profile. Thyroid tests every12weeks; blood pressure at every attendance/appointment. Repeat cardiac imaging as indicated.','EMA supplement: baseline urinalysis and monitor new/worsening proteinuria; regularly monitor bloodglucose in diabetes. Consider dental prevention/ONJ risks.','Response imaging and other tests follow the individualized Consultant treatment plan; NCCP does not set a universal scan or tumour-marker interval.']
p['dose_modifications']=['NCCP00327v5 Tables1–3; all dose changes require Consultant review. Continuous37.5mg pancreaticNET dosing, not the50mg4weeks-on/2weeks-off renal regimen.','ANC<1 or platelets<75×10⁹/L delays; both must recover. Keep prior dose reductions.','Grade3–4 generic toxicity delays until grade1 orless then one12.5mg dose level reduction; HFS grade2 first occurrence also delays, recurrence controls reduction.','AsymptomaticLVEFdecline delays with reduction considered; symptomaticdecline discontinues. ConfirmedSJS/TEN forbids rechallenge.','ChildPughC source conflict retained for Consultant/pharmacy resolution; no numeric dose calculated. Renal impairment does not require initial adjustment; dialysis escalation needs trough concentrations.']
p['supportive_care'].update(premedications='None required by NCCP00327.',other_support='Antidiarrhoeal treatment may be needed; choose antiemetics per minimal–low oral risk/local policy. No automatic antimicrobial or G-CSF prophylaxis is specified.',source=src(3))
# Present clinical wording in ordinary readable prose; URLs, IDs and source hashes stay byte-exact.
def prose(s):
 replacements={'is50mg':'is 50 mg','the37.5mg':'the 37.5 mg','another12.5mg':'another 12.5 mg','reduction.62.5mg':'reduction. 62.5 mg','renal50mg4/2':'renal 50 mg 4-weeks-on/2-weeks-off','NCCPTable':'NCCP Table','baselineFBC':'baseline FBC','Child-PughA/B':'Child-Pugh A/B','Child-PughC':'Child-Pugh C','StJohn’swort':"St John’s wort",'fixedTSH':'fixed TSH','freeT4':'free T4','continueTFT':'continue TFT','abnormalTFT':'abnormal TFT','ConfirmedSJS':'Confirmed SJS','confirmedSJS':'confirmed SJS','suspectedEM':'suspected EM','suspectedPRES':'suspected PRES','suspectedONJ':'suspected ONJ','monitorFBC':'monitor FBC','useINR':'use INR','concomitantIVbisphosphonates':'concomitant IV bisphosphonates','withFBC':'with FBC','monitoringFBC':'monitoring FBC','dose(':'dose (','coagulation(':'coagulation (','below-baseline':'below baseline','noresponse':'no response','cardiacassessment':'cardiac assessment','orMUGA':'or MUGA','bloodglucose':'blood glucose','Table1':'Table 1','Table2':'Table 2','Table3':'Table 3','hand-foot syndrome aid (grades0':'hand-foot syndrome aid (grades 0','NCCP00327':'NCCP 00327','28day':'28-day','4weeks':'4 weeks','4/2':'4/2','untilgrade':'until grade','priorHFS':'prior HFS','asymptomaticLVEFdecline':'asymptomatic LVEF decline','symptomaticdecline':'symptomatic decline','symptomaticLVEF':'symptomatic LVEF','ChildPughC':'Child-Pugh C','LVEFdecline':'LVEF decline','pancreaticNET':'pancreatic NET','generictoxicity':'generic toxicity'}
 for a,b in replacements.items():s=s.replace(a,b)
 s=re.sub(r'\b(above|below|after|After|before|Before|every|each|minimum|maximum|one|to|in|considering|gives|grade|Grade|Table|table|SmPC)(?=[0-9])',r'\1 ',s)
 s=re.sub(r'(?<=\d)(mg|weeks|week|day|level)',r' \1',s)
 s=re.sub(r'(?<=%)(?=[A-Za-z])',' ',s)
 s=s.replace('considers+1','considers +1').replace('increase+1','increase +1').replace('+1level','+1 level').replace('and>','and >').replace('LVEF<','LVEF <').replace('EF<','EF <').replace('grade≤','grade ≤').replace('doselevel','dose level').replace('plan:25','plan: 25').replace(';62.5','; 62.5').replace(';50','; 50').replace('mg4','mg 4').replace('25mg','25 mg').replace('50mg','50 mg').replace('37.5mg','37.5 mg').replace('×10',' ×10')
 return s
keys={'label','description','message','explanation','assessment_guidance','dose_modification_note','administration','missed_dose','premedications','other_support','scope_note','resolution'}
def polish(o):
 if isinstance(o,dict):
  for k,v in o.items():
   if isinstance(v,str) and k in keys:o[k]=prose(v)
   else:polish(v)
 elif isinstance(o,list):
  for v in o:polish(v)
polish(p)
p['monitoring']=[prose(s) for s in p['monitoring']]
p['dose_modifications']=[prose(s) for s in p['dose_modifications']]
TARGET.write_text(json.dumps(p,indent=2,ensure_ascii=False)+'\n')
print(f'Wrote {len(d)} inputs, {len(r)} source-cited rules')
