from pathlib import Path
import json,copy
ROOT=Path(__file__).resolve().parents[3]
BASE=Path(__file__).resolve().parent
SMPC='https://backend-prod.medicines.ie/uploads/files/670e966b379ee.pdf'
def f(k,op,v=None):
 d={'field':k,'operator':op}
 if v is not None:d['value']=v
 return d
def A(*x):return {'all':list(x)}
def O(*x):return {'any':list(x)}
def NOT(x):return {'not':x}
def source(c,p,t=None):
 s={'document':f'NCCP {c} v{D["metadata"]["nccp_version"]}','page':p,'url':D['metadata']['source_url'],'checked_date':'2026-11-05'}
 if t:s['table']=t
 return s
def add(id,cond,kind,components,text,src):
 r={'rule_id':id,'when':cond,'action':{'type':kind,'components':components,'recommendation':text},'explanation':text,'source':src}
 if kind=='consultant_review':r['action'].update(show_in_dose_actions=True,dose_calculation='specialist_review')
 R.append(r);return r
def bool_input(key,label):D['input_definitions'][key]={'label':label,'type':'boolean','required':False,'input_role':'decision','demo_value':False}
def numeric(key,label):D['input_definitions'][key]={'label':label,'type':'number','required':False,'input_role':'decision','min':0,'step':0.01,'unit':'mg/m²','help':'Actual last administered component dose. Missing history must not be assumed to be the full protocol dose.'}
def guard_dose(r,targets):
 original=copy.deepcopy(r['when']);good=A(*(f(k,'>=',v) for k,v in targets.items()));r['when']=A(original,good)
 add(r['rule_id']+'_DOSE_HISTORY_REVIEW',A(original,NOT(good)),'consultant_review',r['action']['components'],'The source restart dose cannot be selected safely because the previous component dose is missing or already lower than the proposed table dose. Confirm the treatment record and obtain consultant/pharmacy advice; do not escalate an already reduced dose.',copy.deepcopy(r['source']))
for c in ['00328','00330','00331']:
 P=next((ROOT/'protocols/gastrointestinal').glob(c+'*.json'));D=json.loads(P.read_text());R=D['rule_engine']['rules'];old={r['rule_id']:r for r in R};isf=c=='00328';fol=['irinotecan','folinic_acid','fluorouracil_bolus','fluorouracil_infusion'];combo=fol if isf else ['cetuximab','irinotecan'];smpc={'document':'CAMPTO Irish SmPC (current medicines.ie listing checked 2026-11-05)','page':2,'section':'4.2','url':SMPC,'checked_date':'2026-11-05'}
 add('DIARRHOEA_COMBINATION_HOLD',f('diarrhoea_grade','>=',2 if isf else 3),'withhold',combo,'Hold all FOLFIRI components for current diarrhoea grade 2 or worse; assess cetuximab independently. Irinotecan additionally requires complete resolution, including grade 1.' if isf else 'Delay both cetuximab and irinotecan for current grade 3 or 4 diarrhoea. Table 3 and the irinotecan SmPC have different recovery criteria: irinotecan must not restart until diarrhoea is fully resolved; confirm the combination restart plan with the consultant.',source(c,5 if isf else 3,5 if isf else 3))
 if isf:
  old['DIARRHOEA_NOT_RESOLVED']['source']=source(c,3)
 else:
  for id in ['DIARRHOEA_NOT_RESOLVED','OTHER_TOXICITY_HOLD']:
   old[id]['source']=copy.deepcopy(smpc)
   old[id]['related_sources']=[source(c,3,3)] if id=='DIARRHOEA_NOT_RESOLVED' else [source(c,5)]
  text='The NCCP diarrhoea table permits recovery to grade 2 or less within two weeks, but CAMPTO SmPC section 4.2 requires complete resolution before irinotecan. Preserve the irinotecan hold at grades 1–2; obtain consultant/pharmacy advice on component timing rather than treating the table as permission to restart irinotecan.'
  add('DIARRHOEA_RECOVERY_SOURCE_REVIEW',A(f('diarrhoea_highest_grade','>=',3),f('diarrhoea_grade','>=',1),f('diarrhoea_grade','<=',2)),'consultant_review',['cetuximab','irinotecan'],text,source(c,3,3))['related_sources']=[copy.deepcopy(smpc)]
  for id in ['BOWEL_EXCLUSION','MARROW_EXCLUSION']:
   old[id]['source']={**smpc,'page':4,'section':'4.3'}
  # Both tables overlap on severe nadirs: the severe row takes precedence.
  moderate=old['COUNTS_RESTART_MODERATE'];moderate['when']=A(moderate['when'],f('lowest_anc','>=',0.5),f('lowest_platelets','>=',10))
  numeric('previous_irinotecan_dose_mg_m2','Last administered irinotecan dose before this interruption')
  for id,target in [('COUNTS_RESTART_MODERATE',150),('COUNTS_RESTART_SEVERE',120)]:guard_dose(old[id],{'previous_irinotecan_dose_mg_m2':target})
  bool_input('oxaliplatin_failure_or_contraindication','Previous oxaliplatin-based treatment failed or is contraindicated (this second-line indication)')
  add('INDICATION_PRIOR_OXALIPLATIN_REVIEW',f('oxaliplatin_failure_or_contraindication','==',False),'consultant_review',['cetuximab','irinotecan'],'This NCCP indication is second-line RAS-wild-type metastatic colorectal cancer after failure of, or contraindication to, oxaliplatin-based treatment. Confirm indication before prescribing; do not infer eligibility from RAS status alone.',source(c,1))
  if c=='00331':
   for grade,iri,ct in [(3,150,400),(4,120,300)]:guard_dose(old[f'DIARRHOEA_RESTART_{grade}'],{'previous_irinotecan_dose_mg_m2':iri,'previous_cetuximab_dose_mg_m2':ct})
 # Cetuximab restart must not raise a previously reduced dose from another event.
 numeric('previous_cetuximab_dose_mg_m2','Last administered cetuximab maintenance dose before this interruption')
 for n,target in enumerate([500,400,300] if c=='00331' else [250,200,150],1):guard_dose(old[f'SKIN_RESTART_{n}'],{'previous_cetuximab_dose_mg_m2':target})
 for tox in (['diarrhoea','mucositis'] if isf else ['diarrhoea']):
  field=tox+'_grade';worst=tox+'_highest_grade';threshold=2 if isf else 3
  cond=A(f(worst,'>=',3),O(f(field,'missing'),f('toxicity_delay_weeks','missing'),A(f(field,'<',threshold),f('toxicity_delay_weeks','>',2))))
  add(tox.upper()+'_REDUCTION_CONTEXT_REVIEW',cond,'consultant_review',combo,'Previous severe '+tox+' requires confirmed recovery and interruption duration before a restart dose can be selected. Missing context or recovery beyond the source two-week window requires consultant/pharmacy review; no numerical restart is inferred.',source(c,5 if isf else 3,5 if isf else 3))
 countbad=O(f('lowest_anc','<',1),f('lowest_platelets','<',50),f('febrile_neutropenia','==',True))
 missing=[f('anc_x10e9_l','missing'),f('platelets_x10e9_l','missing')]
 if isf:missing.append(f('delay_weeks','missing'))
 else:missing.extend([f('lowest_anc','missing'),f('lowest_platelets','missing')])
 add('COUNT_REDUCTION_CONTEXT_REVIEW',A(countbad,O(*missing)),'consultant_review',combo,'Prior severe haematological toxicity needs current recovery of both counts and complete nadir/delay context before selecting a restart dose. Missing values are not normal results.',source(c,4 if isf else (3 if c=='00330' else 2),2 if isf else 1))
 # Preserve the distinction between the precise table trigger and a broad febrile-neutropenia history.
 D['input_definitions']['febrile_neutropenia']['label']='Prior febrile neutropenia (confirm ANC/fever grades and recovery)'
 add('FEBRILE_NEUTROPENIA_REVIEW',f('febrile_neutropenia','==',True),'consultant_review',['irinotecan']+(['fluorouracil_bolus','fluorouracil_infusion'] if isf else []),'Confirm neutropenia and fever grades, recovery, previous doses and supportive care. The CAMPTO SmPC recommends a 15–20% reduction for specified severe or febrile haematological toxicity; use the applicable NCCP regimen table where defined and do not calculate one percentage from this range.',{**smpc,'page':3})
 if isf:
  bool_input('grade4_neutropenia_with_grade2_fever','Prior grade 4 neutropenia AND grade 2 or worse fever (NCCP Table 2 trigger)')
  old['FEBRILE_NEUTROPENIA_RESTART']['when']['all'][1]=f('grade4_neutropenia_with_grade2_fever','==',True)
  # A broad FN history without confirmed grade4 ANC cannot silently invoke two-level reduction.
  bool_input('previous_pelvic_radiotherapy','Previous pelvic radiotherapy')
  bool_input('significant_cardiac_history','Recent MI, uncontrolled angina/hypertension/arrhythmia, or congestive heart failure')
  bool_input('baseline_more_than_three_loose_stools_without_stoma','Baseline more than three loose bowel motions/day without a stoma')
  for key in ['previous_pelvic_radiotherapy','significant_cardiac_history','baseline_more_than_three_loose_stools_without_stoma']:
   add('BASELINE_'+key.upper(),f(key,'==',True),'consultant_review',fol,'NCCP lists this as a caution. Review baseline suitability and monitoring with the consultant; no numerical dose reduction is defined by this caution.',source(c,2))
  D['input_definitions']['grade4_neutropenia_with_grade2_fever']['help']='Use this exact table trigger for the two-level reduction. A general febrile-neutropenia history alone is insufficient.'
 # Non-table severe events still need a source-directed decision after recovery.
 D['input_definitions']['other_nonhaem_highest_grade']=copy.deepcopy(D['input_definitions']['other_nonhaem_toxicity_grade']);D['input_definitions']['other_nonhaem_highest_grade']['label']='Highest prior grade of other treatment-related non-haematological toxicity'
 add('OTHER_SEVERE_TOXICITY_REDUCTION_REVIEW',f('other_nonhaem_highest_grade','>=',3),'consultant_review',['irinotecan']+(['fluorouracil_bolus','fluorouracil_infusion'] if isf else []),'Previous grade 3–4 non-haematological toxicity not covered by a more specific NCCP table requires consultant/pharmacy review of recovery and the CAMPTO SmPC 15–20% reduction range. Do not substitute a single percentage or override a component hold/stop.',{**smpc,'page':3})
 D['monitoring']=['Baseline FBC, renal and liver profile; assess treatment-specific toxicity and repeat blood tests during treatment as specified in the NCCP source.','Before cetuximab: review previous antibody infusion reactions, red-meat allergy, tick bites and any cetuximab IgE testing.','After the final cetuximab dose: monthly electrolytes, magnesium and calcium for two months.','Disease monitoring and imaging follow the individual consultant treatment plan; no fixed tumour-marker or imaging interval is prescribed by this regimen.']
 if isf:D['monitoring']+=['FBC, renal and liver profile before every cycle; weekly FBC during a cytopenia-related delay.','DPD testing before first fluorouracil; ECG where cardiac function is compromised; INR as clinically indicated during warfarin therapy.']
 else:D['monitoring']+=['Fever or evidence of infection requires prompt assessment. Confirm current ANC and platelets before resuming a delayed combination.']
 D['metadata']['sactcheck_encoding_version']='0.84.34';D['metadata']['source_checked_date']='2026-11-05'
 D['metadata']['validation'].update(audit_release='0.84.34',software_validation_record='validation/colorectal-v08434/retro-combo-source-audit/AUDIT.md',rule_level_source_reconciliation_status='fresh_binary_source_audit_with_declared_conflicts_and_manual_domains_pending_independent_clinical_review')
 D['metadata']['encoding_maturity'].update(audit_release='0.84.34',audit_date='2026-11-05',reconciled_release='0.84.34',reconciled_date='2026-11-05',scope_note='Fresh official catalogue and binary PDFs inspected. Source-to-rule matrix and boundary tests retained; declared source conflicts and manual/noncomputable domains are not resolved by software testing. Independent clinical/pharmacy review remains pending.')
 D['metadata']['retrospective_service_audit'].update(release='0.84.34',checked='2026-11-05',scope='Fresh source-first threshold, component-hold, recovery, dose-history and missing-pathway audit; see retained matrix and before/after engine cases.')
 D['clinical_governance']['disclaimer']=f'NCCP {c} v{D["metadata"]["nccp_version"]} source mapping reviewed in SACTCheck v0.84.34. Independent consultant/pharmacy validation and clinical authorisation remain pending. Declared source conflicts and manual domains require review; missing values are not normal results.'
 P.write_text(json.dumps(D,indent=2,ensure_ascii=False)+'\n')
 print(c,len(old),'->',len(R))
