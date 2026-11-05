import json,glob,copy,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]; OUT=Path(__file__).resolve().parent
load=lambda c: json.loads(next((ROOT/'protocols/gastrointestinal').glob(c+'-*.json')).read_text())
base=load('00660'); shared=load('00623')
FU=['fluorouracil_bolus','fluorouracil_infusion']; FUFA=FU+['folinic_acid']; FOLFIRI=['irinotecan']+FUFA
C=lambda f,op='==',v=True: dict(field=f,operator=op,**({} if op in ['missing','exists'] else {'value':v}))
A=lambda *a:{'all':list(a)}
O=lambda *a:{'any':list(a)}
B=lambda label,role='decision':dict(label=label,type='boolean',required=False,input_role=role,demo_value=False)
N=lambda label,mi=0,ma=999,step=1,role='decision':dict(label=label,type='number',required=False,input_role=role,min=mi,max=ma,step=step)
S=lambda label,opts,role='decision':dict(label=label,type='select',required=False,input_role=role,options=[dict(value=v,label=l) for v,l in opts])
REVIEW=dict(show_in_dose_actions=True,dose_calculation='specialist_review',block_numeric_dose=True)
def common(code):
 p=load(code); p['rule_engine']['rules']=[];p['required_inputs']=[]
 p['metadata'].update(sactcheck_encoding_version='0.84.33',full_suite_release='0.84.33',clinical_audit_release='0.84.33',source_checked_date='2026-11-04',document_revision='2026-11-04',source_pdf_sha256=hashlib.sha256((OUT/(code+'.pdf')).read_bytes()).hexdigest(),source_text_snapshot_sha256=hashlib.sha256((OUT/(code+'.txt')).read_bytes()).hexdigest())
 p['metadata'].setdefault('validation',{}).update(source_document_checked=True,software_tests_completed=False,automated_shadow_tests_completed=False,official_catalogue_and_source_link_checked=True,consultant_reviewed=False,oncology_pharmacy_reviewed=False,clinical_use_authorised=False,rule_level_source_reconciliation_status='source_reconciled_v08433_independent_review_pending')
 p['metadata'].setdefault('encoding_maturity',{}).update(source_reconciled=True,consultant_reviewed=False,oncology_pharmacy_reviewed=False,clinical_use_authorised=False,reconciled_release='0.84.33',reconciled_date='2026-11-04',scope_note='Current official NCCP source reconciled in v0.84.33; independent consultant and oncology-pharmacy validation remain pending.')
 p['clinical_governance']['disclaimer']=f"JSON assessment encoding derived from NCCP {code} version {p['metadata']['nccp_version']}. Confirm the current official NCCP PDF and use independent clinical judgement. Independent clinical and oncology-pharmacy validation remain pending."
 p['metadata']['partial_assessment_supported']=True;p['metadata']['partial_assessment_policy']='Each entered value is assessed independently. Omitted domains remain unassessed and are never assumed normal.'
 p['rule_engine']['missing_data_policy']='Do not infer missing clinical values, recovery, recurrence or current component doses. Independently actionable abnormal values trigger their pathway without requiring unrelated inputs.'
 def rule(id,when,typ,comps,msg,page,table=None,**kw):
  action=dict(type=typ,components=comps,recommendation=msg)
  if typ=='consultant_review':action.update(REVIEW)
  action.update(kw)
  src=dict(document=f"NCCP {code} v{p['metadata']['nccp_version']}",page=page,url=p['metadata']['source_url'])
  if table:src['table']=table
  p['rule_engine']['rules'].append(dict(rule_id=id,when=when,action=action,explanation=msg,source=src))
 p['input_definitions']['assessment_type']=copy.deepcopy(base['input_definitions']['assessment_type']);p['input_definitions']['assessment_type']['input_role']='decision'
 p['input_definitions']['ecog']=copy.deepcopy(base['input_definitions']['ecog'])
 for f in ['hypersensitivity','pregnancy','breastfeeding']:
  rule('EXCLUDE_'+f.upper(),C(f),'contraindicated',['whole_regimen'],'NCCP exclusion: '+f.replace('_',' ')+'. Do not administer; specialist assessment required.',2)
 rule('ECOG_REVIEW',C('ecog','>',2),'consultant_review',['whole_regimen'],'ECOG outside source eligibility 0–2; consultant review before treatment.',1)
 rule('DPD_COMPLETE',C('dpd_status','==','complete'),'contraindicated',FUFA,'Complete DPD deficiency: do not administer fluorouracil; folinic acid is not given without its associated fluorouracil.',2)
 rule('DPD_PARTIAL',C('dpd_status','==','partial'),'consultant_review',FU,'Partial DPD deficiency: individualise a reduced starting fluorouracil dose. No universal percentage is specified; careful monitoring and consultant-directed titration are required.',3)
 rule('DPD_UNKNOWN',C('dpd_status','==','unknown'),'consultant_review',FU,'Confirm DPD testing before first fluorouracil treatment. A missing result must not be assumed normal.',2)
 rule('DPD_BASELINE_MISSING',A(C('assessment_type','==','baseline'),C('dpd_status','missing')),'consultant_review',FU,'Before first fluorouracil treatment verify documented DPD testing; the omitted result has not been assessed.',2)
 return p,rule

p,r=common('00238');f=p['input_definitions']
p.pop('dose_levels',None)
# The source uses percentages and recurrence, not the dose-level table of standard FOLFIRI.
for k in ['toxicity_delay_weeks','lowest_anc_during_delay_x10e9_l','lowest_platelets_during_delay_x10e9_l']:
 f[k]['input_role']='context';f[k]['assessment_guidance']='Context only: NCCP00238 does not provide a timed discontinuation or nadir dose-level table. Do not import the standard FOLFIRI00227 rules.'
f['haemodialysis']=B('Haemodialysis (confirm independently of renal band)')
f['renal_impairment']=B('Clinically impaired renal function (source exclusion/table conflict)')
f['cardiac_risk']=B('Recent MI or uncontrolled angina, hypertension, arrhythmia or heart failure')
f['previous_pelvic_radiotherapy']=B('Previous pelvic radiotherapy')
f['severe_bone_marrow_failure']=B('Severe bone marrow failure')
f['febrile_neutropenia_current']=B('Current febrile neutropenia or neutropenic sepsis')
f['febrile_neutropenia_occurrence']=N('Febrile neutropenia / neutropenic sepsis occurrence number',1,20)
f['neutropenic_sepsis_recovered']=B('Febrile neutropenia / neutropenic sepsis clinically recovered')
f['diarrhoea_occurrence']=N('Severe diarrhoea occurrence number',1,20)
f['severe_diarrhoea_confirmed']=B('Severe diarrhoea confirmed by treating team (source term)')
f['severe_stomatitis_or_ppe_confirmed']=B('Severe stomatitis or palmar-plantar syndrome confirmed (source term)')
f['toxicity_recovered']=B('Toxicity clinically recovered sufficiently for consultant-directed restart')
f['diarrhoea_persists_despite_both_reductions']=B('Severe diarrhoea persists despite both irinotecan and 5-FU reductions')
f['current_dose_history_confirmed']=B('Last administered component doses and previous reductions reconciled')
for k,l in [('current_irinotecan_mg_m2','Current irinotecan dose (mg/m²)'),('current_fluorouracil_bolus_mg_m2','Current fluorouracil bolus dose (mg/m²)'),('current_fluorouracil_infusion_mg_m2','Current fluorouracil infusion dose (mg/m²)'),('current_aflibercept_mg_kg','Current aflibercept dose (mg/kg)')]:f[k]=N(l,0,5000,.1,'context')
f['proteinuria_occurrence']=N('Proteinuria ≥2 g/24 hours occurrence number',1,20)
f['upcr']=N('Urinary protein/creatinine ratio (UPCR)',0,100,.1)
f['hypertension_current']=B('Hypertension requiring control before aflibercept')
f['hypertension_controlled']=B('Hypertension is now controlled')
f['recurrent_significant_hypertension']=B('Recurrent medically significant or severe hypertension')
f['uncontrolled_hypertension']['label']='Persistent uncontrolled hypertension (source permanent-stop pathway)'
f['hypertensive_crisis_or_encephalopathy']=B('Hypertensive crisis or hypertensive encephalopathy')
f['infusion_reaction_severity']=S('Aflibercept infusion hypersensitivity reaction',[('none','None'),('mild_moderate','Mild / moderate'),('severe','Severe')])
for k,l in [('grade4_venous_thromboembolism','Grade4 venous thromboembolism including pulmonary embolism'),('nephrotic_syndrome_or_tma','Nephrotic syndrome or thrombotic microangiopathy'),('wound_healing_requires_intervention','Compromised wound healing requiring medical intervention'),('pres','Posterior reversible encephalopathy syndrome'),('elective_surgery_within_4_weeks','Elective surgery planned within4 weeks')]:f[k]=B(l.replace('Grade4','Grade 4').replace('within4','within 4'))
f['baseline_loose_bm_gt3']['label']='Baseline >3 loose bowel movements daily, without colostomy/ileostomy'
f['ugt1a1_homozygous_28']['assessment_guidance']='Supplementary safety context only: NCCP00238v6 does not give a UGT1A1-specific numeric dose. Review current irinotecan product information.'
for k in ['bowel_obstruction_or_chronic_bowel_disease','severe_bone_marrow_failure']:
 r('EXCLUDE_'+k.upper(),C(k),'contraindicated',['whole_regimen'],'Source exclusion: '+f[k]['label']+'. Do not administer pending consultant assessment.',2)
for k in ['cardiac_risk','previous_pelvic_radiotherapy','baseline_loose_bm_gt3']:
 r('CAUTION_'+k.upper(),C(k),'consultant_review',['whole_regimen'],'Source caution: '+f[k]['label']+'. Confirm suitability and monitoring before treatment.',2)
r('ANC_DAY1_HOLD',C('anc_x10e9_l','<',1.5),'withhold',['whole_regimen'],'Delay aflibercept/FOLFIRI until ANC ≥1.5 ×10⁹/L and platelets ≥75 ×10⁹/L. No duration input is needed to recognise this hold. The source uses “or” for recovery; confirm both counts before prescribing.',4,2)
r('PLT_DAY1_HOLD',C('platelets_x10e9_l','<',75),'withhold',['whole_regimen'],'Delay aflibercept/FOLFIRI until platelets ≥75 ×10⁹/L and ANC ≥1.5 ×10⁹/L. NCCP00238 gives no automatic two/four-week discontinuation or nadir dose-level algorithm.',4,2)
r('FN_ACTIVE_HOLD',C('febrile_neutropenia_current'),'withhold',['whole_regimen'],'Current febrile neutropenia/neutropenic sepsis needs urgent treatment and clinical recovery. Do not give a future reduced dose during an active episode.',4,2)
fntrigger=O(C('febrile_neutropenia_occurrence','>=',1),C('grade4_neutropenia_with_grade2_fever'))
r('FN_OCCURRENCE_MISSING',A(C('grade4_neutropenia_with_grade2_fever'),C('febrile_neutropenia_occurrence','missing')),'consultant_review',['irinotecan']+FU+['aflibercept'],'Establish occurrence number and recovery. NCCP00238 uses recurrence-specific percentages: not the standard FOLFIRI two-dose-level reduction.',4,2)
r('FN_FIRST',C('febrile_neutropenia_occurrence','==',1),'consultant_review',['irinotecan'],'First febrile neutropenia/neutropenic sepsis: after recovery reduce irinotecan by 15–20% in subsequent cycles. The consultant selects within the source range after reviewing the actual administered dose; no automatic midpoint or starting-dose calculation.',4,2)
r('FN_SECOND',C('febrile_neutropenia_occurrence','==',2),'consultant_review',['irinotecan']+FU,'Second occurrence: after recovery additionally reduce both 5-FU bolus and infusion by 20%; maintain the previously reduced irinotecan dose. Confirm actual component doses and whether each reduction has already been applied; do not compound or reverse earlier changes automatically.',4,2)
r('FN_THIRD_OR_LATER',C('febrile_neutropenia_occurrence','>=',3),'consultant_review',['aflibercept','irinotecan']+FU,'Third occurrence: aflibercept 2 mg/kg and G-CSF may be considered; this is a consultant choice, not an automatic dose. Reconcile previous irinotecan and fluorouracil reductions and current recovery. Later occurrences need individual review.',4,2)
r('FN_RECOVERY_UNCONFIRMED',A(fntrigger,O(C('neutropenic_sepsis_recovered','missing'),C('neutropenic_sepsis_recovered','==',False),C('anc_x10e9_l','missing'),C('platelets_x10e9_l','missing'))),'consultant_review',['whole_regimen'],'Confirm infection recovery and both current counts before any subsequent cycle; recurrence information alone does not establish readiness to restart.',4,2)
r('IRINOTECAN_RENAL_RANGE',O(C('crcl_ml_min','<',10),C('haemodialysis')),'consultant_review',['irinotecan'],'CrCl <10 mL/min or haemodialysis: Table1 gives a starting range of 50–66% of original irinotecan, with escalation if tolerated. Page2 also lists impaired renal function as an exclusion. Resolve this source conflict with consultant/pharmacy; no automatic dose or midpoint.',3,1)
r('RENAL_EXCLUSION_CONFLICT',C('renal_impairment'),'consultant_review',['whole_regimen'],'Page2 lists impaired renal function as an exclusion, while Table1 provides renal dosing including severe impairment. Resolve eligibility and dosing with consultant/pharmacy; do not infer treatment clearance from the dose table.',2)
r('IRINOTECAN_BILIRUBIN',C('bilirubin_ratio_uln','>',3),'contraindicated',['irinotecan'],'Irinotecan is contraindicated when bilirubin >3 ×ULN. Review the entire combination before prescribing.',3,1)
r('FU_HEPATIC_ABSOLUTE',O(C('bilirubin_umol_l','>',85),C('ast_u_l','>',180)),'contraindicated',FU,'5-FU is contraindicated in the source table when bilirubin >85 µmol/L or AST >180 U/L.',3,1)
r('FU_HEPATIC_BOUNDARY',O(C('bilirubin_umol_l','==',85),C('ast_u_l','==',180)),'consultant_review',FU,'Exact bilirubin85 µmol/L or AST180 U/L is not assigned by the strict < / > source bands. Consultant/pharmacy review; no automatic full dose.',3,1)
for severity,words in [('moderate','one third'),('severe','one half')]:
 r('FU_HEPATIC_'+severity.upper(),C('hepatic_impairment_severity','==',severity),'consultant_review',FU,f'Clinical decision: for {severity} hepatic impairment the source describes reducing the initial fluorouracil dose by {words}, then increasing if no toxicity. Reconcile absolute bilirubin/AST contraindications, whether this is initial treatment, and actual component dose history; no automatic recalculation.',4,1)
r('FU_HEPATIC_PARTIAL',O(A(C('bilirubin_umol_l','<',85),C('ast_u_l','missing')),A(C('ast_u_l','<',180),C('bilirubin_umol_l','missing'))),'consultant_review',FU,'The source full-dose hepatic band requires BOTH bilirubin <85 µmol/L AND AST <180 U/L. The omitted result remains unassessed; do not treat a single low value as full hepatic clearance.',3,1)
r('UGT_CONTEXT',C('ugt1a1_homozygous_28'),'consultant_review',['irinotecan'],'Documented UGT1A1 poor-metaboliser context requires consultant/pharmacy assessment against current irinotecan product information. NCCP00238v6 does not specify a genotype-based numeric dose; none is calculated here.',3,1)
r('AF_INFUSION_MILD_MODERATE',C('infusion_reaction_severity','==','mild_moderate'),'withhold',['aflibercept'],'Temporarily suspend aflibercept infusion until the reaction resolves. Corticosteroid/antihistamine treatment and subsequent pre-treatment may be considered clinically.',4,2)
r('AF_INFUSION_SEVERE',C('infusion_reaction_severity','==','severe'),'discontinue',['whole_regimen'],'Severe hypersensitivity reaction: discontinue aflibercept/FOLFIRI.',4,2)
r('AF_PROTEIN_HOLD',C('proteinuria_g_24h','>=',2),'withhold',['aflibercept'],'Suspend aflibercept for proteinuria ≥2 g/24 hours; resume only after <2 g/24 hours. On the second occurrence, permanently reduce to2 mg/kg after recovery; confirm occurrence and current dose.',5,2)
r('AF_PROTEIN_REPEAT',A(C('proteinuria_occurrence','>=',2),C('proteinuria_g_24h','<',2)),'consultant_review',['aflibercept'],'After the second proteinuria occurrence and documented recovery below2 g/24 hours, the source requires permanent aflibercept reduction to2 mg/kg. Confirm current dose and previous reductions; no re-escalation or automatic restart from an isolated result.',5,2)
r('AF_PROTEIN_RECOVERY_MISSING',A(C('proteinuria_occurrence','>=',1),C('proteinuria_g_24h','missing')),'consultant_review',['aflibercept'],'A prior proteinuria episode requires a current 24-hour result before restart; recurrence number does not establish recovery below2 g/24 hours.',5,2)
r('AF_UPCR_COLLECTION',C('upcr','>',1),'consultant_review',['aflibercept'],'UPCR >1 requires 24-hour urine collection. The UPCR is not interchangeable with grams of protein per24 hours; assess the quantitative result before dose decisions.',3)
r('AF_HYPERTENSION_HOLD',C('hypertension_current'),'withhold',['aflibercept'],'Withhold aflibercept until hypertension is controlled. Recurrence of medically significant/severe hypertension requires permanent reduction to2 mg/kg after control; persistent uncontrolled hypertension follows the stop pathway.',5,2)
r('AF_HYPERTENSION_REPEAT',C('recurrent_significant_hypertension'),'consultant_review',['aflibercept'],'Recurrent medically significant/severe hypertension: suspend until controlled, then permanently reduce aflibercept to2 mg/kg. Confirm control and current dose before prescribing; do not re-escalate.',5,2)
r('AF_HYPERTENSION_RECOVERY_MISSING',A(C('recurrent_significant_hypertension'),O(C('hypertension_controlled','missing'),C('hypertension_controlled','==',False))),'withhold',['aflibercept'],'Recurrent significant hypertension: do not restart aflibercept before control is documented.',5,2)
for k in ['uncontrolled_hypertension','hypertensive_crisis_or_encephalopathy','active_severe_bleeding','gi_perforation_or_fistula','arterial_thromboembolic_event','grade4_venous_thromboembolism','nephrotic_syndrome_or_tma','wound_healing_requires_intervention','pres']:
 r('AF_STOP_'+k.upper(),C(k),'discontinue',['aflibercept'],'Discontinue aflibercept: '+f[k]['label']+'. This component-specific rule does not itself discontinue the FOLFIRI components.',5,2)
r('AF_SURGERY_PREOP',C('elective_surgery_within_4_weeks'),'withhold',['aflibercept'],'Suspend aflibercept for at least4 weeks before elective surgery. Confirm surgical timing and healing with the treating team.',3)
r('AF_SURGERY_HEALING_REVIEW',C('recent_major_surgery_or_unhealed_wound'),'withhold',['aflibercept'],'Recent major surgery/unhealed wound: suspend aflibercept pending surgical and oncology review. Wound healing requiring medical intervention follows the permanent-stop pathway.',3)
severediarr=O(C('severe_diarrhoea_confirmed'),C('diarrhoea_highest_grade','>=',3))
r('DIARRHOEA_CURRENT_REVIEW',C('diarrhoea_current_grade','>=',2),'consultant_review',FOLFIRI,'Current clinically significant diarrhoea needs assessment, hydration and antidiarrhoeal treatment before further FOLFIRI. NCCP00238 does not supply the standard FOLFIRI grade2/two-week dose-level algorithm; assess severity and recovery explicitly.',5,2)
r('DIARRHOEA_SEVERE_CURRENT',C('diarrhoea_current_grade','>=',3),'withhold',FOLFIRI,'Active severe diarrhoea: withhold FOLFIRI pending urgent clinical assessment, hydration and recovery. Use this regimen’s occurrence-specific subsequent-cycle reduction pathway.',5,2)
r('DIARRHOEA_OCCURRENCE_MISSING',A(severediarr,C('diarrhoea_occurrence','missing')),'consultant_review',['irinotecan']+FU,'Severe diarrhoea: establish occurrence, recovery and actual component doses. First occurrence reduces irinotecan15–20%; second additionally reduces both fluorouracil doses20%. Do not import dose levels or assume a midpoint.',5,2)
r('DIARRHOEA_FIRST',A(severediarr,C('diarrhoea_occurrence','==',1)),'consultant_review',['irinotecan'],'First severe diarrhoea: after clinical recovery reduce irinotecan by15–20%. Select the reduction with the consultant against the documented administered dose; no numeric range midpoint is calculated.',5,2)
r('DIARRHOEA_SECOND',A(severediarr,C('diarrhoea_occurrence','>=',2)),'consultant_review',['irinotecan']+FU,'Second severe diarrhoea: additionally reduce both 5-FU bolus and infusion by20%, retaining the irinotecan reduction. Confirm recovery and whether each change has already been applied. Persistent severe diarrhoea despite BOTH reductions requires discontinuation of FOLFIRI.',5,2)
r('DIARRHOEA_PERSISTENT_BOTH',C('diarrhoea_persists_despite_both_reductions'),'discontinue',FOLFIRI,'Severe diarrhoea persisting despite BOTH irinotecan and fluorouracil reductions: discontinue FOLFIRI. This rule does not automatically discontinue aflibercept; the future overall plan requires consultant review.',5,2)
stom=O(C('severe_stomatitis_or_ppe_confirmed'),C('stomatitis_highest_grade','>=',3))
r('STOMATITIS_PPE_SEVERE',stom,'consultant_review',FU,'Severe stomatitis/PPE: reduce both fluorouracil bolus and infusion by20% after clinical recovery. Confirm the source term “severe”, current component doses and whether the reduction is already applied; no borrowed dose levels.',5,2)
r('STOMATITIS_CURRENT',C('stomatitis_current_grade','>=',2),'consultant_review',FU,'Current stomatitis requires clinical severity and recovery assessment. NCCP00238 uses severe stomatitis/PPE with20% 5-FU reductions, not a grade4 two-level or timed-stop rule.',5,2)
r('STOMATITIS_SEVERE_CURRENT',C('stomatitis_current_grade','>=',3),'withhold',FUFA,'Active severe stomatitis: defer fluorouracil and associated folinic acid pending assessment and recovery; subsequently reconcile the source20% reduction with current doses.',5,2)
r('DOSE_HISTORY_MISSING',A(O(fntrigger,severediarr,stom),O(C('current_dose_history_confirmed','missing'),C('current_dose_history_confirmed','==',False))),'consultant_review',['irinotecan']+FU,'Confirm the actual last administered component doses and previous reductions before any percentage-based modification. Do not reduce from an assumed protocol starting dose or apply the same reduction twice.',4,2)
r('TOXICITY_RECOVERY_MISSING',A(O(severediarr,stom),O(C('toxicity_recovered','missing'),C('toxicity_recovered','==',False))),'consultant_review',FOLFIRI,'Clinical recovery has not been confirmed. A historical maximum toxicity grade or occurrence number does not authorise a subsequent reduced dose.',5,2)
r('ACUTE_CHOLINERGIC',C('acute_cholinergic_syndrome'),'consultant_review',['irinotecan'],'Acute irinotecan cholinergic syndrome: assess clinically and use atropine as indicated. Atropine is contraindicated with glaucoma; use caution with asthma. Severe prior syndrome may warrant subsequent prophylaxis.',6)
p['supportive_care'].update(emetogenic_risk='moderate',script_id='nccp-parenteral-moderate',mapping_basis='NCCP00238v6 supportive care p6: irinotecan moderate, fluorouracil low and aflibercept minimal. Highest active risk is moderate.',supportive_medications_label='NCCP antiemetic guidance for moderate emetogenic risk',regimen_specific_notes=['Atropine250 micrograms SC before irinotecan except contraindicated glaucoma; caution in asthma.','Delayed diarrhoea (>24 hours after irinotecan): loperamide4mg then2mg every2 hours, continuing12 hours after last liquid stool, maximum48 hours at this schedule; use the treating team’s instructions.','Ice chips may be used during the 5-FU bolus to reduce stomatitis.'])
for a in p['treatment_phases'][0]['administration']:
 drug=a['drug'];a['order']={'aflibercept':1,'irinotecan':2,'folinic_acid':2,'fluorouracil_bolus':3,'fluorouracil_infusion':4}[drug]
 a['notes']={'aflibercept':'Infuse over60 minutes before FOLFIRI.','irinotecan':'Infuse over90 minutes; may share Y-connector with folinic acid, not the same bag.','folinic_acid':'Infuse over2 hours before 5-FU; 200mg/m² may be considered per source.','fluorouracil_bolus':'Day1 bolus after folinic acid.','fluorouracil_infusion':'Continuous46-hour pump after bolus; arranged disconnection.'}[drug]
p['monitoring']=['Baseline and each cycle: FBC, renal/liver profile and urine protein dipstick; BP monitoring.','DPD before first fluorouracil unless previously tested; renal impairment may affect uracil phenotyping.','UPCR >1: obtain24-hour urine protein. ECG at baseline if compromised cardiac function.','INR on warfarin as clinically indicated. Disease imaging/other monitoring follows the consultant’s treatment plan.']
p['metadata']['schedule_summary']='Day1 aflibercept then irinotecan/folinic acid and 5-FU bolus, followed by46-hour 5-FU pump. Repeat every14 days while effective and tolerated; no fixed maximum cycle count.'
(OUT/'00238-implemented-inputs.json').write_text(json.dumps(list(f),indent=2)+'\n')
next((ROOT/'protocols/gastrointestinal').glob('00238-*.json')).write_text(json.dumps(p,indent=2,ensure_ascii=False)+'\n')

p,r=common('00791');f=p['input_definitions']
for key in ['toxicity_delay_weeks','lowest_anc_during_delay_x10e9_l','lowest_platelets_during_delay_x10e9_l','grade4_neutropenia_with_grade2_fever','current_fluorouracil_bolus_level','current_fluorouracil_infusion_level']:
 f[key]=copy.deepcopy(base['input_definitions'][key])
f['haemodialysis']=B('Haemodialysis')
f['fluorouracil_renal_impairment']=S('Clinical renal impairment', [('none','None'),('mild','Mild'),('moderate','Moderate'),('severe','Severe'),('none_mild_moderate','Legacy combined band — distinguish none from impairment')])
f['fluorouracil_hepatic_impairment']=S('Clinical hepatic impairment', [('none','None'),('mild','Mild'),('moderate','Moderate'),('severe','Severe')])
f['febrile_neutropenia_recovered']=B('Previous febrile neutropenia/infection clinically recovered')
f['diarrhoea_highest_grade']=copy.deepcopy(base['input_definitions']['diarrhoea_highest_grade'])
f['stomatitis_highest_grade']=copy.deepcopy(base['input_definitions']['stomatitis_highest_grade'])
# Keep familiar current-grade input IDs; retain CTCAE descriptions and explicitly disclose the older source grading.
f['diarrhoea_grade']['label']='Current diarrhoea grade (confirm against NCCP Table6)'
f['mucositis_grade']['label']='Current stomatitis grade (confirm against NCCP Table6)'
for key in ['diarrhoea_grade','diarrhoea_highest_grade','mucositis_grade','stomatitis_highest_grade']:
 f[key]['assessment_guidance']+=' NCCP00791 Table6 prints older symptom-based grades that are not identical to CTCAE5.0. Confirm the source-table grade before selecting a dose-level change; a CTCAE grade alone must not silently substitute for the source criteria.'
f['source_toxicity_grade_confirmed']=B('Current and highest GI-toxicity grades reconciled to NCCP Table6')
f['source_toxicity_grade_confirmed']['help_text']='NCCP Table6 diarrhoea: grade3 7–9 extra stools/day/incontinence/malabsorption or severe watery colostomy output; grade4 ≥10, gross blood or parenteral support/dehydration. Stomatitis grade3 unable to eat; grade4 mucosal necrosis/enteral support/dehydration. Clinical assessment is required where modern CTCAE differs.'
f['nonstandard_fluorouracil_dose']=B('Current 5-FU dose is outside listed NCCP dose levels')
f['proteinuria_g_24h']=N('24-hour urine total protein (g/24 hours)',0,100,.1)
f['urine_protein_dipstick']=S('Urine protein dipstick',[('negative','Negative'),('1+','1+'),('2+','2+'),('3+','3+'),('4+','4+')])
f['urine_protein_g_l']=N('Laboratory urine protein concentration (g/L)',0,100,.1)
f['uncontrolled_or_symptomatic_hypertension']=B('Uncontrolled or symptomatic hypertension on day1')
f['bp_sustained_on_antihypertensives']=B('BP elevation is sustained while taking antihypertensive medication')
f['hypertension_grade']=copy.deepcopy(shared['input_definitions']['hypertension_grade']) if 'hypertension_grade' in shared['input_definitions'] else S('Hypertension grade',[(i,str(i)) for i in range(5)])
f['persistent_grade3_hypertension']=B('Persisting grade3 hypertension')
f['gi_perforation']=B('Gastrointestinal perforation')
f['te_or_grade4_fistula']=B('Tracheoesophageal fistula or any grade4 fistula')
f['grade4_thromboembolism']=B('Grade4 thromboembolic event')
f['haemorrhage_grade']=copy.deepcopy(shared['input_definitions']['haemorrhage_grade']) if 'haemorrhage_grade' in shared['input_definitions'] else S('Haemorrhage grade',[(i,str(i)) for i in range(5)])
f['cardiac_or_vascular_risk']=B('Source cardiovascular, thrombotic, bleeding or fistula/perforation risk factor')
f['prior_anthracycline_or_chest_radiotherapy']=B('Prior anthracycline treatment or chest-wall radiotherapy')
f['baseline_loose_bm_gt3']=B('Baseline >3 loose bowel movements daily without stoma')
f['previous_pelvic_radiotherapy']=B('Previous pelvic radiotherapy')
f['unlicensed_regimen_consent_confirmed']=B('Unlicensed bevacizumab regimen information and local consent/governance confirmed')
for key in ['fluorouracil_bilirubin_umol_l','fluorouracil_ast_u_l']:
 f[key]['input_role']='context';f[key]['assessment_guidance']='NCCP00791v2 uses hepatic impairment severity, not the absolute bilirubin85/AST180 thresholds of other fluorouracil protocols. Assess severity clinically; these values alone do not select a numeric dose.'
# Current source defines severe hepatic impairment as not recommended, with no numeric substitution.
r('FU_HEPATIC_SEVERE',C('fluorouracil_hepatic_impairment','==','severe'),'withhold',FUFA,'Severe hepatic impairment: fluorouracil is not recommended in Table3. Withhold and review the treatment plan with consultant/pharmacy; no automatic half-dose alternative.',4,3)
modhep=C('fluorouracil_hepatic_impairment','in',['mild','moderate'])
r('FU_HEPATIC_COMBINED_OR_UNKNOWN',A(modhep,O(C('fluorouracil_renal_impairment','missing'),C('fluorouracil_renal_impairment','in',['mild','moderate','severe','none_mild_moderate']),C('haemodialysis'))),'consultant_review',FU,'The no-adjustment hepatic band applies to mild/moderate impairment WITHOUT renal impairment. Confirm renal status; concurrent renal/hepatic dysfunction is not specified by this table and requires individual review.',4,3)
r('FU_HEPATIC_MILD_MODERATE',A(modhep,C('fluorouracil_renal_impairment','==','none'),O(C('haemodialysis','missing'),C('haemodialysis','==',False))),'consultant_review',FU,'Mild/moderate hepatic impairment without renal impairment: no need for fluorouracil dose adjustment is expected in Table3. Reconcile any prior toxicity reductions; this is domain information, not whole-regimen clearance.',4,3)
r('RENAL_NO_ADJUSTMENT',O(C('fluorouracil_renal_impairment','in',['mild','moderate','severe']),C('haemodialysis')),'consultant_review',['bevacizumab']+FU,'Table3 expects no renal/haemodialysis dose adjustment for bevacizumab or fluorouracil. This does not clear combined hepatic impairment or toxicity. With moderate/severe renal impairment, interpret uracil-based DPD phenotyping cautiously and consider genotype.',4,3)
r('HEPATIC_LABS_CONTEXT',O(C('fluorouracil_bilirubin_umol_l','>',85),C('fluorouracil_ast_u_l','>',180)),'consultant_review',FU,'Abnormal liver results require clinical assessment of hepatic severity. NCCP00791v2 does not use the bilirubin85/AST180 contraindication cutoffs from other fluorouracil regimens; no dose is calculated from these values alone.',4,3)
for key in ['cardiac_or_vascular_risk','prior_anthracycline_or_chest_radiotherapy','baseline_loose_bm_gt3','previous_pelvic_radiotherapy']:
 r('CAUTION_'+key.upper(),C(key),'consultant_review',['whole_regimen'],'Source caution: '+f[key]['label']+'. Confirm suitability and monitoring; consider ECHO with prior anthracycline/chest-wall radiation.',2)
r('UNLICENSED_CONSENT_BASELINE',A(C('assessment_type','==','baseline'),O(C('unlicensed_regimen_consent_confirmed','missing'),C('unlicensed_regimen_consent_confirmed','==',False))),'consultant_review',['bevacizumab'],'NCCP identifies this as an unlicensed bevacizumab regimen in Ireland. Inform and consent the patient and confirm local hospital/Drugs and Therapeutics governance before initiation.',8)
r('ANC_DAY1_HOLD',C('anc_x10e9_l','<',1),'withhold',FUFA,'Hold treatment for ANC <1.0; check FBC weekly up to2 times. Restart only after recovery ≥1 within2 weeks and review the lowest delayed-week ANC. Reassess the overall combination.',4,2)
r('ANC_PERSISTENT',A(C('anc_x10e9_l','<',1),C('toxicity_delay_weeks','>=',2)),'discontinue',FUFA,'ANC remains <1.0 after2 weeks: discontinue the fluorouracil-based treatment pathway. Review the overall regimen; this does not independently assert permanent bevacizumab discontinuation.',4,2)
r('PLT_DAY1_HOLD',C('platelets_x10e9_l','<',75),'withhold',FUFA,'Hold for platelets <75. Check weekly up to2 times; source restart requires recovery ≥75 within2 weeks. Review the overall combination.',4,2)
r('PLT_PERSISTENT',A(C('platelets_x10e9_l','<',75),C('toxicity_delay_weeks','>=',4)),'discontinue',FUFA,'Platelets remain <75 after4 weeks: discontinue the fluorouracil-based pathway and review the overall regimen.',4,2)
r('PLT_DELAY_SOURCE_GAP',A(C('toxicity_delay_weeks','>',2),C('toxicity_delay_weeks','<',4),O(C('platelets_x10e9_l','<',75),C('lowest_platelets_during_delay_x10e9_l','<',75))),'consultant_review',FUFA,'Table2 allows platelet recovery within2 weeks but specifies discontinuation after4 weeks. The intervening interval is not an automatic restart pathway; consultant review required.',4,2)
r('PLT_NADIR_MAINTAIN',C('lowest_platelets_during_delay_x10e9_l','<',75),'consultant_review',FU,'All platelet-nadir bands, including <10, maintain fluorouracil dose level in this source. Hold until current platelets recover; confirm timing and other toxicity. Do not impose a platelet-only automatic reduction.',4,2)
r('ACTIVE_INFECTION_HOLD',C('febrile_or_active_infection'),'withhold',['whole_regimen'],'Current fever/febrile neutropenia or clinically active infection requires assessment and recovery before treatment. A future reduced dose is not authorised during infection.',4,2)
recovered=A(C('anc_x10e9_l','>=',1),C('platelets_x10e9_l','>=',75))
levelok=A(C('current_fluorouracil_bolus_level','in',[0,-1,-2]),C('current_fluorouracil_infusion_level','in',[0,-1,-2]),O(C('nonstandard_fluorouracil_dose','missing'),C('nonstandard_fluorouracil_dose','==',False)))
def reduce(id,when,levels,msg,page,table):
 changes={d:dict(dose_level_change=-levels,relative_to_current_dose_level=True,current_dose_level_field='current_'+d+'_level') for d in FU}
 r(id,A(when,levelok),'dose_reduce',FU,msg+' Apply the greatest reduction per component, not the sum of overlapping triggers. Folinic acid remains400 mg/m² at levels0/−1/−2; delay/omit it with the 5-FU bolus. Below level−2 means discontinue.',page,table,component_changes=changes)
 r(id+'_HISTORY',A(when,O(C('current_fluorouracil_bolus_level','missing'),C('current_fluorouracil_infusion_level','missing'),C('nonstandard_fluorouracil_dose'))),'consultant_review',FU,msg+' Confirm each current component dose level; a nonstandard administered dose requires pharmacy reconciliation. No starting-level assumption or re-escalation.',page,table)
ancLow=C('lowest_anc_during_delay_x10e9_l','<',1)
ancReady=A(ancLow,recovered,C('toxicity_delay_weeks','<=',2))
reduce('LOW_NADIR_ANC',ancReady,1,'After both counts recover within2 weeks, reduce both fluorouracil components by1 dose level for delayed-week ANC <1 (including <0.5).',4,2)
r('LOW_NADIR_RECOVERY_CONTEXT',A(ancLow,O(C('anc_x10e9_l','missing'),C('platelets_x10e9_l','missing'),C('toxicity_delay_weeks','missing'),C('toxicity_delay_weeks','>',2))),'consultant_review',FU,'Low delayed-week ANC requires one-level 5-FU reduction only after documented recovery and timing review. Current counts or delay duration are absent/outside the source restart window; no automatic reduced dose.',4,2)
fn=C('grade4_neutropenia_with_grade2_fever')
reduce('PRIOR_FEBRILE_NEUTROPENIA',A(fn,recovered,C('febrile_neutropenia_recovered'),C('febrile_or_active_infection','==',False)),1,'After resolution of grade4 neutropenia with ≥grade2 fever and recovery of both counts, reduce both fluorouracil components by1 dose level.',4,2)
r('FN_RECOVERY_CONTEXT',A(fn,O(C('anc_x10e9_l','missing'),C('platelets_x10e9_l','missing'),C('febrile_neutropenia_recovered','missing'),C('febrile_neutropenia_recovered','==',False),C('febrile_or_active_infection','missing'))),'consultant_review',FU,'Prior grade4 neutropenia with ≥grade2 fever requires one-level 5-FU reduction after recovery. Confirm infection resolution, both counts and current component levels; no dose now based on history alone.',4,2)
for name,cur,high in [('DIARRHOEA','diarrhoea_grade','diarrhoea_highest_grade'),('STOMATITIS','mucositis_grade','stomatitis_highest_grade')]:
 r(name+'_HOLD',C(cur,'>=',2),'withhold',FUFA,'Current '+name.lower()+' ≥grade2: hold treatment, weekly review up to2 times, until below grade2. Confirm the NCCP source-table grading.',6,6)
 r(name+'_PERSISTENT',A(C(cur,'>=',2),C('toxicity_delay_weeks','>=',2)),'discontinue',FUFA,name.title()+' remains ≥grade2 after2 weeks: discontinue the fluorouracil pathway and review the overall regimen.',6,6)
 r(name+'_RECOVERY_CONTEXT',A(C(high,'>=',2),O(C(cur,'missing'),C('toxicity_delay_weeks','missing'),C('toxicity_delay_weeks','>',2))),'consultant_review',FU,'Historical '+name.lower()+' requires current severity and recovery timing. The source restart window is within2 weeks; do not infer recovery or a dose from the highest grade alone.',6,6)
 r(name+'_SOURCE_GRADE_CONTEXT',A(C(high,'>=',3),O(C('source_toxicity_grade_confirmed','missing'),C('source_toxicity_grade_confirmed','==',False))),'consultant_review',FU,'Confirm '+name.lower()+' grading against NCCP Table6 before a dose-level change: printed source definitions differ from modern CTCAE5.0. No automatic translation of grade labels.',6,6)
 r(name+'_LOW_GRADE_MAINTAIN',A(C(cur,'<',2),C(high,'>=',1),C(high,'<=',2)),'consultant_review',FU,'After recovery below grade2 within2 weeks, historical grade1/2 '+name.lower()+' maintains current 5-FU dose level. Confirm timing; do not restore a previously reduced dose.',6,6)
 ready=A(C(cur,'<',2),C('toxicity_delay_weeks','<=',2),C('source_toxicity_grade_confirmed'))
 if name=='DIARRHOEA':reduce(name+'_G3_4',A(ready,C(high,'>=',3)),1,'After recovery from grade3/4 diarrhoea, reduce both 5-FU components by1 dose level.',6,6)
 else:
  for g,n in [(3,1),(4,2)]:reduce(name+'_G'+str(g),A(ready,C(high,'==',g)),n,f'After recovery from grade{g} stomatitis, reduce both 5-FU components by{n} dose level(s).',6,6)
r('BEV_PROTEIN_GT4',C('proteinuria_g_24h','>',4),'discontinue',['bevacizumab'],'24-hour urine protein >4 g: discontinue bevacizumab. No bevacizumab dose reduction is recommended.',5,4)
r('BEV_PROTEIN_GT2_TO4',A(C('proteinuria_g_24h','>',2),C('proteinuria_g_24h','<=',4)),'withhold',['bevacizumab'],'Protein >2 to4 g/24 hours: hold bevacizumab; repeat24-hour urine every2 weeks and resume only when ≤2 g/24 hours.',5,4)
r('BEV_PROTEIN_LE2',C('proteinuria_g_24h','<=',2),'consultant_review',['bevacizumab'],'Urine protein ≤2 g/24 hours meets this source proteinuria criterion. Other entered restrictions govern; this result alone does not establish eligibility or override grade4 proteinuria.',5,4)
r('BEV_DIPSTICK4',C('urine_protein_dipstick','==','4+'),'withhold',['bevacizumab'],'Dipstick4+ at baseline or during treatment: withhold bevacizumab and collect24-hour urine protein.',5,4)
r('BEV_DIPSTICK2_3',O(C('urine_protein_dipstick','in',['2+','3+']),C('urine_protein_g_l','>=',1)),'consultant_review',['bevacizumab'],'Dipstick2+/3+ or laboratory urine protein ≥1 g/L: Table4 permits the scheduled bevacizumab dose from this domain, with24-hour collection within3 days before the next dose. A concurrent4+ or24-hour hold/stop result takes priority; concentration g/L is not g/24 hours.',5,4)
r('BEV_PROTEIN_G4',C('proteinuria_grade','>=',4),'discontinue',['bevacizumab'],'Grade4 proteinuria: discontinue bevacizumab.',5,5)
r('BEV_HTN_DAY1',C('uncontrolled_or_symptomatic_hypertension'),'withhold',['bevacizumab'],'Uncontrolled or symptomatic hypertension on day1: withhold bevacizumab, start/adjust antihypertensive therapy and reassess control.',5,5)
bpElev=O(C('systolic_bp_mmhg','>',150),C('diastolic_bp_mmhg','>',100))
r('BEV_BP_CONTEXT',bpElev,'consultant_review',['bevacizumab'],'Source initiating-treatment definition is sustained BP >150/100 mmHg while taking antihypertensives. A single reading or isolated threshold must not silently substitute for persistence/treatment context; assess symptoms and clinical control.',5,5)
r('BEV_BP_SUSTAINED_TREATED',A(bpElev,C('bp_sustained_on_antihypertensives')),'consultant_review',['bevacizumab'],'Sustained BP above a component of the source150/100 threshold while on antihypertensives requires assessment of clinical control. The source does not explicitly define AND/OR logic between systolic and diastolic values; confirm uncontrolled/symptomatic hypertension, which requires holding bevacizumab. No automatic numeric threshold substitution.',5,5)
r('BEV_HTN_G2_3',C('hypertension_grade','in',[2,3]),'consultant_review',['bevacizumab'],'Grade2–3 hypertension: initiate antihypertensive treatment and consider interruption of bevacizumab until controlled. Do not calculate a reduced bevacizumab dose.',5,5)
r('BEV_HTN_STOP',O(C('hypertension_grade','>=',4),C('persistent_grade3_hypertension')),'discontinue',['bevacizumab'],'Grade4 or persisting grade3 hypertension: discontinue bevacizumab.',5,5)
for key in ['gi_perforation','te_or_grade4_fistula','grade4_thromboembolism']:
 r('BEV_STOP_'+key.upper(),C(key),'discontinue',['bevacizumab'],'Discontinue bevacizumab for '+f[key]['label']+'. The source stop is component-specific.',5,5)
r('BEV_HAEMORRHAGE_G3_4',C('haemorrhage_grade','>=',3),'discontinue',['bevacizumab'],'Haemorrhage ≥grade3: discontinue bevacizumab.',5,5)
for key,msg in [('gi_perforation_or_fistula','Clarify perforation versus fistula site/grade. Perforation, TE fistula or any grade4 fistula requires stopping bevacizumab; the broad legacy field does not establish the specific event.'),('major_bleeding_or_recent_thrombosis','Urgently establish bleeding grade, thrombotic type/grade and timing. Haemorrhage ≥grade3 or grade4 thromboembolism stops bevacizumab; a combined history field is not a permanent-stop diagnosis.'),('recent_or_planned_major_surgery','Review surgery timing and wound healing before bevacizumab against current product information and the surgical plan. The NCCP source lists relevant procedural/perforation risk; it does not prescribe a universal interval here.')]:
 r('BEV_CONTEXT_'+key.upper(),C(key),'consultant_review',['bevacizumab'],msg,2)
r('OTHER_NONHAEM_REVIEW',C('other_nonhaem_toxicity_grade','>=',2),'consultant_review',['whole_regimen'],'Identify the specific adverse event and use its NCCP pathway. This source does not provide an automatic generic percentage reduction for every non-haematological toxicity.',5)
p['dose_levels']=copy.deepcopy(base['dose_levels']);p['dose_levels']['folinic_acid']={'0':400,'-1':400,'-2':400,'-3':'discontinue'}
p['treatment_phases']=[dict(phase_id='fourteen_day_cycle',cycle_length_days=14,administration=[dict(day=1,order=1,drug='bevacizumab',dose=dict(value=5,unit='mg/kg'),route='IV infusion',notes='First infusion90 minutes; second60 if tolerated; subsequent30 if tolerated. Never IV push.'),dict(day=1,order=1,drug='folinic_acid',dose=dict(value=400,unit='mg/m2 IV'),notes='Over2 hours; before 5-FU. Delay/omit with the 5-FU bolus.'),dict(day=1,order=2,drug='fluorouracil_bolus',dose=dict(value=400,unit='mg/m2 IV bolus')),dict(day=1,order=3,drug='fluorouracil_infusion',dose=dict(value=2400,unit='mg/m2 continuous IV over 46 hours'))])]
p['metadata']['schedule_summary']='Day1 bevacizumab, folinic acid and5-FU bolus, followed by a46-hour5-FU pump. Repeat every14 days until progression or unacceptable toxicity; no fixed maximum number of cycles.'
p['metadata']['licensing_note']='NCCP00791v2 pp8–9: unlicensed bevacizumab regimen in Ireland; patient information/consent and local Drugs and Therapeutics governance required. Rapid infusion is separately unlicensed.'
p['monitoring']=['Baseline FBC, renal/liver profile, urine protein dipstick, BP and cardiac history/examination; DPD before first fluorouracil unless previously tested.','ECG as clinically indicated; consider ECHO with prior anthracycline treatment or chest-wall radiation.','Each cycle: FBC, renal/liver profile, urine protein dipstick. BP before each cycle AND after treatment.','On warfarin: INR weekly until dose stable, then before each cycle. Disease imaging and additional testing follow the individual treatment plan.']
p['dose_modifications']=['See executable source-specific rules: fluorouracil dose levels and recovery windows are separate from bevacizumab hold/stop rules.','Bevacizumab dose reduction for adverse events is not recommended.','Mild/moderate hepatic impairment without renal impairment needs no expected fluorouracil adjustment; severe hepatic impairment is not recommended. No imported bilirubin85/AST180 rule.']
p['supportive_care']['regimen_specific_notes']=['Bevacizumab minimal and fluorouracil low emetogenic risk.','Premedication not usually required; antidiarrhoeal treatment per local policy.']
(OUT/'00791-implemented-inputs.json').write_text(json.dumps(list(f),indent=2)+'\n')
next((ROOT/'protocols/gastrointestinal').glob('00791-*.json')).write_text(json.dumps(p,indent=2,ensure_ascii=False)+'\n')
print('Implemented00238 and00791; source-based tests pending.')
# Present source grading faithfully; the runtime honours grading_source_url/label.
p=load('00791')
for key in ['diarrhoea_grade','diarrhoea_highest_grade','mucositis_grade','stomatitis_highest_grade']:
 d=p['input_definitions'][key];d['ctcae_version']='NCCP source table 6';d['grading_source_url']=p['metadata']['source_url'];d['grading_source_label']='NCCP 00791 v2 / Table 6';d['source_grading_note']='The source prints symptom-based grades that differ from modern CTCAE 5.0. Use the printed NCCP criteria for these dose decisions; do not silently translate grade numbers. Grade 0 is added only to represent no current toxicity.'
 desc=(['No diarrhoea above usual baseline.','Increase of 2–3 stools/day or mild increase in loose watery colostomy output.','Increase of 4–6 stools, nocturnal stools or mild increase in loose watery colostomy output.','Increase of 7–9 stools/day, incontinence, malabsorption or severe increase in loose watery colostomy output.','Increase of10 or more stools/day, grossly bloody colostomy output, or loose watery output requiring parenteral support; dehydration.'] if key.startswith('diarrhoea') else ['No stomatitis.','Painless ulcers, erythema or mild soreness.','Painful erythema, oedema or ulcers, but able to eat.','Painful erythema, oedema or ulcers and unable to eat.','As grade3 but mucosal necrosis and/or enteral support; dehydration.'])
 for opt in d['options']:
  g=int(opt['value']);opt.update(label='Grade '+str(g),description=desc[g]);opt.pop('ctcae_grade',None)
for key in ['hypertension_grade','haemorrhage_grade']:
 d=p['input_definitions'][key];d['assessment_guidance']=d['assessment_guidance'].replace('table 8','Table 5');d['ctcae_source_url']='https://dctd.cancer.gov/research/ctep-trials/for-sites/adverse-events/ctcae-v5-5x7.pdf'
 for opt in d['options']:
  g=int(opt['value']);opt['ctcae_grade']=g;opt['label']='Grade '+str(g)
  if key=='hypertension_grade':opt['description']=['No hypertension.','Systolic120–139 or diastolic80–89 mmHg; follow CTCAE adult criteria.','Systolic140–159 or diastolic90–99 mmHg; intervention/medication change indicated; assess persistence and symptoms.','Systolic≥160 or diastolic≥100 mmHg; medical intervention and more than one drug or more intensive therapy indicated.','Life-threatening consequences, e.g. malignant hypertension, neurological deficit or hypertensive crisis; urgent intervention indicated.'][g]
  else:opt['description']=['No bleeding.','Mild; intervention not indicated, using the site-specific CTCAE haemorrhage definition.','Moderate; medical intervention indicated; apply the site-specific haemorrhage definition.','Severe; transfusion, invasive intervention or hospital care indicated as defined for the bleeding site.','Life-threatening consequences; urgent intervention indicated.'][g]
for rr in p['rule_engine']['rules']:
 if rr['action']['type']=='dose_reduce':
  rr['action']['components']=FUFA
  rr['action']['component_changes']['folinic_acid']=dict(next(iter(rr['action']['component_changes'].values())),current_dose_level_field='current_fluorouracil_bolus_level')
next((ROOT/'protocols/gastrointestinal').glob('00791-*.json')).write_text(json.dumps(p,indent=2,ensure_ascii=False)+'\n')
# Human-readable copy: retain machine keys, IDs, paths and source URLs verbatim.
import re
textkeys={'label','help_text','assessment_guidance','description','recommendation','explanation','notes','schedule_summary','mapping_basis','licensing_note','source_grading_note'}
def clean(o,key=''):
 if isinstance(o,dict):return {k:clean(v,k) for k,v in o.items()}
 if isinstance(o,list):return [clean(v,key) for v in o]
 if isinstance(o,str) and (key in textkeys or key in ['regimen_specific_notes','monitoring','dose_modifications']):
  return re.sub(r'(?<=\d)(?=[A-Za-z])',' ',re.sub(r'(?<=[A-Za-z])(?=\d)',' ',o))
 return o
for code in ['00238','00791']:
 p=clean(load(code));next((ROOT/'protocols/gastrointestinal').glob(code+'-*.json')).write_text(json.dumps(p,indent=2,ensure_ascii=False)+'\n')
