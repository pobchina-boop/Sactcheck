"""Source-led, idempotent 00216 reconciliation from the preserved pre-v36 protocol."""
import copy, json
from pathlib import Path
here=Path(__file__).resolve().parent
root=here.parents[2]
p=json.loads((here/'00216-before.json').read_text())
rules=p['rule_engine']['rules']; defs=p['input_definitions']
N='https://healthservice.hse.ie/documents/6558/216_v8_Capecitabine.pdf'
EMA='https://www.ema.europa.eu/en/documents/product-information/xeloda-epar-product-information_en.pdf'
def atom(f,op,v=None):return dict(field=f,operator=op,**({} if v is None else {'value':v}))
def allof(*args):return {'all':list(args)}
def anyof(*args):return {'any':list(args)}
def source(page,table=None):return dict(document='NCCP 00216 v8',page=page,url=N,checked_date='2026-11-05',**({'table':table} if table else {}))
def emsrc(page,section='4.4'):return dict(document='EMA Xeloda product information (supplementary)',page=page,section=section,url=EMA,checked_date='2026-11-05')
def add(id,when,typ,text,src):
 rules.append(dict(rule_id=id,when=when,action=dict(type=typ,components=['capecitabine'],recommendation=text,**({'show_in_dose_actions':True} if typ=='consultant_review' else {})),explanation=text,source=src))
def settext(r,text):r['action']['recommendation']=text;r['explanation']=text

def select(name,label,choices,help):defs[name]=dict(label=label,type='select',required=False,options=[dict(value=v,label=t) for v,t in choices],assessment_guidance=help,input_role='decision')
def boolean(name,label,help):defs[name]=dict(label=label,type='boolean',required=False,assessment_guidance=help,input_role='decision')
select('capecitabine_starting_dose','Documented original capecitabine starting prescription (mg/m² twice daily)', [('1250','1250 mg/m² twice daily'),('1000','1000 mg/m² twice daily'),('other','Other individualised starting dose')], 'Use the original prescription before subsequent toxicity reductions. NCCP table 2 gives 75% of original dose for CrCl 30–50; the supplementary SmPC distinguishes 1250 from 1000 mg/m² starts. Other/reduced starts require reconciliation, not an automatic extra reduction.')
defs['capecitabine_previous_dose_percent']=dict(label='Most recent prescribed capecitabine dose (% of documented starting dose)',type='number',required=False,min=1,max=100,unit='%',assessment_guidance='Enter the most recent prescribed dose before the current interruption, as a percentage of the original documented starting prescription. Include prior toxicity reductions; do not enter 0 for a temporary hold. Unknown history prevents an automatic numeric restart. The general no-re-escalation rule differs from consultant-monitored initial partial-DPD titration.',input_role='decision')
boolean('significant_cardiac_history','History of significant cardiac disease, arrhythmia or angina','Supplementary EMA SmPC caution; this is not an automatic dose reduction or routine echocardiography schedule.')
boolean('current_chest_pain','Current chest pain / suspected cardiac ischaemia','Stop tablets and obtain urgent clinical assessment. A treatment restart must be decided by the consultant; no automatic rechallenge.')
select('dehydration_status','Current dehydration / recovery status',[('none','No dehydration after assessment'),('grade1','Grade 1 dehydration'),('grade2_or_more','Grade 2 or higher dehydration'),('recovered_cause_uncontrolled','Rehydrated but precipitating cause not corrected/controlled'),('recovered_cause_controlled','Rehydrated and precipitating cause corrected/controlled')],'Supplementary EMA SmPC: interrupt immediately for grade 2 or higher dehydration; restart only after rehydration and correction/control of its cause. This field alone does not authorise restart or determine a dose.')
boolean('severe_skin_reaction','Severe skin reaction during treatment (e.g. SJS/TEN)','Separate serious skin-toxicity stop pathway; not routine hand-foot syndrome.')
boolean('coumarin_anticoagulant','Concomitant coumarin anticoagulant (e.g. warfarin)','Supplementary SmPC interaction: close INR/prothrombin-time monitoring and anticoagulant adjustment are needed.')
boolean('phenytoin_use','Concomitant phenytoin','Supplementary SmPC interaction: monitor phenytoin plasma concentrations and toxicity.')
boolean('treatment_related_liver_abnormality','Elevated liver tests assessed as treatment related','Distinguish a baseline liver abnormality from treatment-related toxicity. If timing or attribution is uncertain, confirm with the consultant; never assume a missing liver test is normal.')

# Dose-history guard: numeric source targets must not re-escalate a lower prior dose.
# Haematology additionally needs BOTH episode nadirs to determine the worst source band.
for r in list(rules):
 a=r['action']; pct=a.get('component_changes',{}).get('capecitabine',{}).get('dose_percent_of_original')
 if pct is None or r['rule_id']=='RENAL_30_50':continue
 original=copy.deepcopy(r['when'])
 guards=[atom('capecitabine_previous_dose_percent','>=',pct)]
 missing=[atom('capecitabine_previous_dose_percent','missing'),atom('capecitabine_previous_dose_percent','<',pct)]
 if r['rule_id'].startswith('HAEM_'):
  guards += [atom('lowest_anc_episode','exists'),atom('lowest_platelets_episode','exists')]
  missing += [atom('lowest_anc_episode','missing'),atom('lowest_platelets_episode','missing')]
 r['when']=allof(original,*guards)
 text=a['recommendation']+' This numeric target applies only to the documented prior dose supplied and must not increase it; do not multiply successive percentage reductions.'
 settext(r,text)
 add(r['rule_id']+'_HISTORY_REVIEW',allof(original,anyof(*missing)),'consultant_review',f'The source table gives a {pct}% starting-dose target after recovery, but dose history or the worst episode count band is incomplete, or the previous prescribed dose is already lower. Confirm BOTH episode nadirs for haematological toxicity and all previous reductions with the consultant. No automatic numeric restart and no re-escalation.',dict(r['source'],additional_page=2,additional_section='General dose modifications: no re-escalation'))

byid={r['rule_id']:r for r in rules}
# Renal source conflict made explicit, with a quantified target only for a 1250 start and a safe prior-dose context.
r=byid['RENAL_30_50']; renal=copy.deepcopy(r['when'])
renal_history=anyof(allof(atom('assessment_type','==','baseline'),atom('capecitabine_previous_dose_percent','missing')),atom('capecitabine_previous_dose_percent','>=',75))
r['when']=allof(renal,atom('capecitabine_starting_dose','==','1250'),renal_history)
settext(r,'NCCP table 2 gives 75% of original capecitabine dose for CrCl 30–50 mL/min. The documented original start is 1250 mg/m² twice daily. Apply this percentage once, reconcile prior toxicity reductions and pharmacy tablet banding; never re-escalate a lower prior prescribed dose. This renal-domain result alone does not authorise treatment.')
add('RENAL_30_50_CONTEXT_REVIEW',allof(renal,anyof(atom('capecitabine_starting_dose','missing'),atom('capecitabine_starting_dose','in',['1000','other']),atom('capecitabine_previous_dose_percent','<',75),allof(atom('assessment_type','!=','baseline'),anyof(atom('capecitabine_previous_dose_percent','missing'),atom('capecitabine_previous_dose_percent','<',75))),allof(atom('assessment_type','missing'),anyof(atom('capecitabine_previous_dose_percent','missing'),atom('capecitabine_previous_dose_percent','<',75))))),'consultant_review','Source discrepancy / dose-history clarification: NCCP table 2 gives 75% of original dose for CrCl 30–50, whereas EMA SmPC 4.2 specifies this for a 1250 mg/m² start and no starting reduction at 1000 mg/m². Confirm the original prescription, assessment timing and prior reductions with consultant/pharmacy. Do not automatically apply an additional 25% reduction or increase a previously reduced dose.',dict(source(3,2),additional_url=EMA,supplementary_section='SmPC 4.2, p6'))
# Distinguish the clinical source warning from an implied permissive baseline result.
settext(byid['BASELINE_COUNTS_CAUTION'],'Baseline ANC <1.5 or platelets <100: NCCP advises caution, while EMA SmPC 4.2 says these patients should not be treated. Do not automatically initiate capecitabine; resolve the source difference with consultant/pharmacy. The subsequent-dose recovery threshold of platelets ≥75 is not baseline clearance.')
byid['BASELINE_COUNTS_CAUTION']['source'].update(additional_url=EMA,supplementary_section='SmPC 4.2, p5')
# Keep the existing action for the NCCP baseline review; it never emits numeric clearance.
for id in ['BRIVUDINE','SEVERE_HEPATIC_SMPC_EXCLUSION']:
 byid[id]['source']=emsrc(7,'4.3–4.5')
byid['RENAL_LT30']['source'].update(additional_url=EMA,supplementary_section='SmPC 4.2–4.3, pp6–7')
settext(byid['RENAL_LT30'],'Do not administer capecitabine at CrCl <30 mL/min. NCCP table 2 says not recommended; EMA SmPC lists severe renal impairment as a contraindication and says to discontinue if CrCl falls below 30 during treatment. Obtain consultant review; no automatic reduced-dose alternative.')
# Elevated baseline/non-drug-related liver tests must not be mislabelled treatment-related toxicity.
liver=copy.deepcopy(byid['HEPATOTOXICITY']['when'])
byid['HEPATOTOXICITY']['when']=allof(liver,anyof(atom('assessment_type','missing'),atom('assessment_type','in',['current','within_cycle'])),anyof(atom('treatment_related_liver_abnormality','missing'),atom('treatment_related_liver_abnormality','==',True)))
add('LIVER_TIMING_ATTRIBUTION_REVIEW',allof(liver,anyof(atom('assessment_type','==','baseline'),atom('treatment_related_liver_abnormality','==',False))),'consultant_review','Elevated liver tests require consultant assessment of timing, cause and severity. NCCP table 2 gives no routine hepatic adjustment; table 6 concerns treatment-related elevations. These baseline or assessed non-treatment-related results do not establish that diagnosis or give automatic treatment clearance. Severe hepatic impairment remains a separate contraindication.',dict(source(3,2),additional_page=6,additional_table=6,additional_url=EMA,supplementary_section='4.3–4.4, pp7–8'))
# Permanent discontinuation depends on the worst episode and recurrence even before complete recovery.
for prefix in ['diarrhoea','mucositis','other_nonhaem_toxicity']:
 for r in rules:
  if r['rule_id'].startswith(prefix.upper()+'_2_') and r['rule_id'].endswith('_0'):
   r['when']=allof(r['when'],anyof(atom(prefix+'_highest_grade','missing'),atom(prefix+'_highest_grade','<=',2)))
 for n,pct in [(1,75),(2,50)]:
  add(prefix.upper()+'_ACTIVE_PRIOR_G3_'+str(n),allof(atom(prefix+'_grade','>=',2),atom(prefix+'_highest_grade','==',3),atom(prefix+'_occurrence','==',n)),'withhold',f'This episode reached grade 3 and remains at least grade 2: continue interruption until grade 0–1. The source grade-3 recurrence row gives {pct}% of starting dose after recovery, subject to previous reductions and consultant confirmation; do not substitute the lower current-grade row or automatically restart.',source(5 if prefix=='diarrhoea' else 4,4 if prefix=='diarrhoea' else 3))
 add(prefix.upper()+'_PRIOR_EPISODE_STOP',anyof(allof(atom(prefix+'_highest_grade','==',2),atom(prefix+'_occurrence','>=',4)),allof(atom(prefix+'_highest_grade','==',3),atom(prefix+'_occurrence','>=',3))),'discontinue','The documented episode has reached the source permanent-discontinuation recurrence (fourth grade 2 or third grade 3). Partial symptom improvement does not reverse that stop decision; do not wait for full recovery to recognise it.',source(5 if prefix=='diarrhoea' else 4,4 if prefix=='diarrhoea' else 3))
haemctx=anyof(atom('assessment_type','missing'),atom('assessment_type','==','current'))
add('HAEM_RECOVERY_CONTEXT_REQUIRED',allof(haemctx,anyof(atom('lowest_anc_episode','<',1.5),atom('lowest_platelets_episode','<',75)),anyof(atom('anc_x10e9_l','missing'),atom('platelets_x10e9_l','missing'))),'consultant_review','Current recovery is incompletely assessed after a documented cytopenic episode. Confirm BOTH ANC ≥1.5 and platelets ≥75 before any restart; establish both nadirs, recurrence and prior prescription. No automatic numeric restart.',source(3,1))
for field,low,high in [('lowest_anc_episode',1,1.5),('lowest_platelets_episode',50,75),('lowest_anc_episode',.5,1),('lowest_platelets_episode',25,50)]:
 n=4 if low in (1,50) else 3
 add(('HAEM_HISTORY_'+field+'_'+str(low)).upper().replace('.','_'),allof(haemctx,atom(field,'>=',low),atom(field,'<',high),atom('haematology_occurrence','>=',n)),'discontinue','Table 1 permanent-discontinuation threshold was reached by the worst documented episode and recurrence. Current partial blood-count recovery does not convert that decision into a further dose delay/restart.',source(3,1))
add('CARDIAC_HISTORY_REVIEW',atom('significant_cardiac_history','==',True),'consultant_review','Use capecitabine with caution in significant cardiac disease, arrhythmia or angina; obtain consultant assessment. This history does not define a percentage reduction or an automatic serial cardiac-imaging schedule.',emsrc(8))
add('CURRENT_CHEST_PAIN_HOLD',atom('current_chest_pain','==',True),'withhold','Stop capecitabine and arrange urgent assessment for current chest pain / suspected cardiac ischaemia. Do not continue tablets while waiting for a routine visit; no automatic rechallenge or restart dose.',dict(emsrc(8),additional_page=44,additional_section='Package leaflet section 4: stop immediately for chest pain'))
add('DEHYDRATION_HOLD',atom('dehydration_status','in',['grade2_or_more','recovered_cause_uncontrolled']),'withhold','Interrupt capecitabine for grade 2 or greater dehydration. Do not restart until rehydrated AND the precipitating cause is corrected/controlled. Review renal function/electrolytes and apply the source modifications for the causative toxicity separately; missed tablets are not replaced.',emsrc(7))
add('DEHYDRATION_RECOVERY_REVIEW',atom('dehydration_status','==','recovered_cause_controlled'),'consultant_review','Rehydration and cause control are documented, but this does not by itself authorise capecitabine restart. Reassess kidney function, causative toxicity and its grade/recurrence, previous dose and the consultant restart plan.',emsrc(7))
add('SEVERE_SKIN_STOP',atom('severe_skin_reaction','==',True),'discontinue','Permanently discontinue capecitabine for a severe skin reaction such as Stevens–Johnson syndrome or toxic epidermal necrolysis; arrange urgent specialist assessment. This is separate from ordinary hand-foot syndrome.',emsrc(10))
add('COUMARIN_MONITORING',atom('coumarin_anticoagulant','==',True),'consultant_review','Concomitant coumarin anticoagulation requires close INR/prothrombin-time monitoring and anticoagulant dose adjustment. Check bleeding risk with oncology/pharmacy; do not calculate an anticoagulant change from this tool.',emsrc(8,'4.4–4.5'))
add('PHENYTOIN_MONITORING',atom('phenytoin_use','==',True),'consultant_review','Monitor phenytoin plasma concentrations and toxicity during concomitant capecitabine; oncology/pharmacy should review any required adjustment.',emsrc(10,'4.5'))
# Input descriptors must accurately identify NCCP source wording versus generic UI grading aids.
for key in ['hand_foot_syndrome_grade','hand_foot_highest_grade']:
 d=defs[key]
 words=['No hand-foot syndrome.','NCCP table 5: skin changes/tingling/erythema with discomfort not disrupting normal activities.','NCCP table 5: painful erythema/swelling affecting daily activities.','NCCP table 5: severe skin changes (e.g. desquamation, ulceration, blistering) with pain and inability to work or perform daily activities.']
 for opt in d['options']:opt['description']=words[int(opt['value'])]
 d['ctcae_version']='NCCP table 5 (regimen-specific)';d['ctcae_source_url']=N
 d['assessment_guidance']='Use NCCP table 5 clinical descriptions, not a generic CTCAE v5 substitution. Grade 2/3 requires interruption until ≤1; after grade 3 the next dose must be decreased but the table does not specify a percentage.'
for key in ['diarrhoea_grade','diarrhoea_highest_grade']:
 defs[key]['ctcae_version']='NCCP table 4 (legacy source-specific bands)'
for key in ['mucositis_grade','mucositis_highest_grade','other_nonhaem_toxicity_grade','other_nonhaem_toxicity_highest_grade']:
 defs[key]['assessment_guidance'] += ' The descriptors displayed are a CTCAE v5 UI aid; NCCP table 3 explicitly cites CTCAE v4. Confirm the source grade clinically before applying its dose table. These versions are not represented as identical sources.'
defs['dpd_status']['assessment_guidance']='Verify phenotype and/or genotype before first capecitabine unless previously tested. In moderate/severe renal impairment, uracil phenotyping can be falsely elevated; NCCP advises caution and considering genotype testing. Complete DPD deficiency excludes treatment; partial deficiency has no universal dose percentage in this regimen and consultant-monitored initial titration is distinct from re-escalation after toxicity.'
for key in ['lowest_anc_episode','lowest_platelets_episode']:
 defs[key]['assessment_guidance']='Document BOTH ANC and platelet nadirs for the same episode; use the worst count band with its recurrence. Missing other nadir prevents an automatic numerical restart. Current recovery still requires ANC ≥1.5 AND platelets ≥75.'
for field in ['diarrhoea_grade','diarrhoea_highest_grade','hand_foot_syndrome_grade','hand_foot_highest_grade']:
 diarrhoea=field.startswith('diarrhoea');d=defs[field]
 d['grading_source_label']='NCCP 00216 v8 · table '+('4' if diarrhoea else '5')+' (page 5)'
 d['grading_source_url']=N
 d['source_grading_note']=('NCCP table 4 uses legacy diarrhoea bands and places nocturnal stools in overlapping low-grade and grade-2 descriptions. Confirm the clinician-assessed source grade; this is not a CTCAE edition or an automatic stool-count conversion.' if diarrhoea else 'NCCP table 5 gives regimen-specific hand-foot syndrome descriptions. Grade 2/3 requires interruption until grade ≤1; the subsequent grade-3 reduction is not quantified. These descriptions are not a generic CTCAE v5 substitution.')
for r in rules:r['source'].setdefault('checked_date','2026-11-05')
for key,d in defs.items():
 if 'demo_value' not in d:d['demo_value']=100 if d['type']=='number' else False if d['type']=='boolean' else d['options'][0]['value']
m=p['metadata'];m.update(clinical_audit_release='0.84.36',source_checked_date='2026-11-05',source_pdf_sha256='5f4a3599d27c49ff7f866e768c3e936066731975698194fbdfc3e73dcdd94388',sactcheck_encoding_version='0.84.36')
m['validation'].update(audit_release='0.84.36',audit_date='2026-11-05',rule_level_source_reconciliation_status='source_mapped_with_declared_conflicts_pending_independent_clinical_review',consultant_reviewed=False,oncology_pharmacy_reviewed=False,clinical_use_authorised=False,source_document_checked=True)
m['encoding_maturity'].update(level='source_reconciled_pending_independent_clinical_review',label='Source reconciled · independent clinical and pharmacy review pending',scope_note='NCCP 00216 v8 and supplementary EMA Xeloda product information were freshly reconciled on 5 November 2026. Source discrepancies remain explicit; software checks do not establish clinical authorisation.',audit_release='0.84.36',audit_date='2026-11-05',source_reconciled=True,reconciled_release='0.84.36',reconciled_date='2026-11-05')
(root/'protocols/gastrointestinal/00216-capecitabine-monotherapy.json').write_text(json.dumps(p,indent=2,ensure_ascii=False)+'\n')
print(len(defs),'inputs;',len(rules),'rules')
