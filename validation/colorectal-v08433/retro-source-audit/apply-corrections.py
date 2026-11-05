"""Reproducible v0.84.33 corrections from preserved pre-audit protocols; no shared edits."""
import json, pathlib, copy, hashlib
root=pathlib.Path(__file__).resolve().parents[3]
out=pathlib.Path(__file__).resolve().parent
before=out/'protocol-before';before.mkdir(exist_ok=True)
codes=['00210','00213','00446','00449','00448']; paths={c:next((root/'protocols/gastrointestinal').glob(c+'-*.json')) for c in codes}
for c,path in paths.items():
 if not (before/path.name).exists(): (before/path.name).write_bytes(path.read_bytes())
p={c:json.loads((before/path.name).read_text()) for c,path in paths.items()}
def cond(f,op,v=None):
 d={'field':f,'operator':op}
 if v is not None:d['value']=v
 return d
def allof(*cs):return {'all':list(cs)}
def anyof(*cs):return {'any':list(cs)}
def rules(c):return p[c]['rule_engine']['rules']
def rule(c,id):return next(r for r in rules(c) if r['rule_id']==id)
def condition(r):return r.get('when',{k:v for k,v in r.items() if k in ['all','any','field','operator','value','not']})
def setwhen(r,c):
 for k in ['all','any','field','operator','value','not']:r.pop(k,None)
 r['when']=c
def add(c,id,when,typ,components,text,page,table=None,**action):
 s={'document':f"NCCP {c} v{p[c]['metadata']['nccp_version']}",'page':page,'url':p[c]['metadata']['source_url'],'checked_date':'2026-11-04'}
 if table:s['table']=table
 a={'type':typ,'components':components,'recommendation':text,**action}
 if typ=='consultant_review':a.update(show_in_dose_actions=True,dose_calculation='specialist_review')
 r={'rule_id':id,'when':when,'action':a,'explanation':text,'source':s};rules(c).append(r);return r
def boolean(c,k,label):p[c]['input_definitions'][k]={'label':label,'type':'boolean','required':False,'input_role':'decision','demo_value':False}
chemo={'00210':['oxaliplatin','folinic_acid','fluorouracil_bolus','fluorouracil_infusion'],'00446':['oxaliplatin','folinic_acid','bolus_5fu','infusional_5fu'],'00449':['irinotecan','folinic_acid','fluorouracil_bolus','fluorouracil_infusion'],'00448':['irinotecan','folinic_acid','fluorouracil_bolus','fluorouracil_infusion']}
# FOLFOX4: explicit pulmonary investigation hold and source breastfeeding exclusion.
boolean('00210','unexplained_respiratory_symptoms','Unexplained non-productive cough, dyspnoea, crackles or pulmonary infiltrates')
add('00210','OXALIPLATIN_UNEXPLAINED_RESPIRATORY',cond('unexplained_respiratory_symptoms','==',True),'withhold',['oxaliplatin'],'Stop oxaliplatin pending investigation; do not resume until interstitial lung disease or pulmonary fibrosis has been excluded. This is the source temporary discontinuation pending investigation, not an automatic permanent stop.',5,4)
r=rule('00210','PREGNANCY_LACTATION');setwhen(r,cond('pregnancy','==',True));r['action']['recommendation']=r['explanation']='Pregnancy requires specialist review; do not give routine treatment clearance. Follow medicine-specific pregnancy and contraception precautions.'
add('00210','BREASTFEEDING_EXCLUSION',cond('breastfeeding','==',True),'contraindicated',chemo['00210'],'Breastfeeding is an explicit NCCP regimen exclusion; do not administer this regimen while breastfeeding.',2)
# Monotherapy: preserve renal-source conflict and overlapping bilirubin boundary; no invented numeric reduction.
r=rule('00213','RENAL_IRI');r['when']['any'].append(cond('severe_renal_impairment','==',True));r['action']['recommendation']=r['explanation']='Source conflict: page 1 lists impaired renal function as an exclusion, while page 2 table 2 states no routine dose reduction but cautions that evidence is absent. Obtain a consultant/pharmacy suitability decision; do not give routine clearance or borrow a numeric renal dose from another regimen.';r['source']['pages']=[1,2]
r=rule('00213','BILI_START_200');r['action']['recommendation']=r['explanation']='The source monotherapy starting dose is 200 mg/m² for bilirubin above 1.5 and up to 3 × ULN. Confirm performance status, coagulation and weekly FBC monitoring. Exactly 1.5 × ULN is handled separately because the printed bands overlap.'
add('00213','BILI_EXACT_1_5_SOURCE_OVERLAP',cond('bilirubin_uln_multiple','==',1.5),'consultant_review',['irinotecan'],'The source starting-dose table prints both ≤1.5 × ULN (350 mg/m²) and 1.5–3 × ULN (200 mg/m²). At exactly 1.5 × ULN, confirm the intended band with the consultant/pharmacist; no dose is selected automatically.',2,2)
r=rule('00213','NONHAEM_REDUCTION');setwhen(r,anyof(condition(r),cond('diarrhoea_highest_grade','>=',3)));r['action']['recommendation']=r['explanation']='Previous grade 3 or worse non-haematological toxicity, including diarrhoea: after recovery of all adverse events to grade ≤1 and fully resolved diarrhoea, consider a 15–20% irinotecan reduction based on the worst prior event. No single percentage or current-dose calculation is selected automatically.'
# Bevacizumab pathways: stop criteria distinct from symptomatic/uncontrolled hypertension hold.
for c in ['00446','00449']:
 boolean(c,'grade4_or_persistent_grade3_hypertension','Grade 4 hypertension or persisting grade 3 hypertension (clinically assessed)')
 boolean(c,'grade4_thromboembolic_event','Grade 4 thromboembolic event, including life-threatening venous events')
 add(c,'ANTI_VEGF_SEVERE_HYPERTENSION_STOP',cond('grade4_or_persistent_grade3_hypertension','==',True),'discontinue',['bevacizumab'],'Discontinue bevacizumab for grade 4 hypertension or persisting grade 3 hypertension. The routine uncontrolled/symptomatic blood-pressure hold does not replace this stopping criterion.',5,5)
 add(c,'ANTI_VEGF_GRADE4_THROMBOEMBOLISM_STOP',cond('grade4_thromboembolic_event','==',True),'discontinue',['bevacizumab'],'Discontinue bevacizumab for a grade 4 thromboembolic event, including life-threatening venous thromboembolism. The separate arterial-event pathway is not exhaustive.',5,5)
 maps={'00446':{'oxaliplatin':'current_oxaliplatin_level','bolus_5fu':'current_bolus_5fu_level','infusional_5fu':'current_infusional_5fu_level'},'00449':{'irinotecan':'current_irinotecan_level','fluorouracil_bolus':'current_fluorouracil_bolus_level','fluorouracil_infusion':'current_fluorouracil_infusion_level'}}
 for component,field in maps[c].items():
  if field not in p[c]['input_definitions']:p[c]['input_definitions'][field]=copy.deepcopy(p['00448']['input_definitions'][field])
  p[c]['input_definitions'][field]['input_role']='decision'
 for r in rules(c):
  for component,change in r['action'].get('component_changes',{}).items():
   if 'dose_level_change' in change:change.update(relative_to_current_dose_level=True,current_dose_level_field=maps[c][component])
# Hepatic percentages in these source tables are INITIAL dosing, not permission to reset later doses.
for c,field,components in [('00446','hepatic_impairment_category',['bolus_5fu','infusional_5fu']),('00449','hepatic_impairment_severity',['fluorouracil_bolus','fluorouracil_infusion'])]:
 for id in ['FIVEFU_MODERATE_HEPATIC','FIVEFU_SEVERE_HEPATIC']:
  r=rule(c,id);setwhen(r,allof(condition(r),cond('assessment_type','==','baseline')))
 add(c,'FIVEFU_HEPATIC_INITIAL_DOSE_CONTEXT',allof(cond(field,'in',['moderate','severe']),anyof(cond('assessment_type','missing'),cond('assessment_type','!=','baseline'))),'consultant_review',components,'The source hepatic fractions describe the initial fluorouracil dose. For subsequent treatment or unspecified assessment timing, reconcile the actual previous dose, toxicity and current hepatic results with the consultant/pharmacist; do not reset an already reduced dose to a percentage of the original dose.',4,3)

# 00446 dose/restart only after documented recovery within source four weeks.
for r in rules('00446'):
 if r['rule_id'].startswith('HAEM_RECOVERED_'):setwhen(r,allof(condition(r),cond('delay_weeks','<=',4)))
 if r['rule_id'].startswith('DIARRHOEA_RECOVERED_'):setwhen(r,allof(condition(r),cond('diarrhoea_duration_weeks','<=',4)))
add('00446','LATE_COUNT_RECOVERY_REVIEW',allof(cond('anc_x10e9_l','>=',1.5),cond('platelets_x10e9_l','>=',75),cond('delay_weeks','>',4)),'consultant_review',chemo['00446'],'Counts recovered outside the source four-week restart window. Review the stopping clauses, delay and nadir before considering chemotherapy restart; assess bevacizumab independently.',4,2)
add('00446','COUNT_REDUCTION_CONTEXT_REVIEW',allof(anyof(cond('lowest_anc_delayed_weeks_x10e9_l','<',1),cond('lowest_platelets_delayed_weeks_x10e9_l','<',50)),anyof(cond('anc_x10e9_l','missing'),cond('platelets_x10e9_l','missing'),cond('delay_weeks','missing'))),'consultant_review',chemo['00446'],'A low previous count may require a dose reduction, but current ANC/platelet recovery and the delay duration must be confirmed before a restart dose is selected. Do not assume omitted values are normal.',4,2)
add('00446','DIARRHOEA_REDUCTION_CONTEXT_REVIEW',allof(cond('diarrhoea_highest_grade','>=',3),anyof(cond('diarrhoea_current_grade','missing'),cond('diarrhoea_duration_weeks','missing'),allof(cond('diarrhoea_current_grade','<',2),cond('diarrhoea_duration_weeks','>',4)))),'consultant_review',chemo['00446'],'Previous grade 3–4 diarrhoea requires confirmation of current recovery below grade 2 within the source four-week window before a restart reduction is selected. Unknown or later recovery needs consultant review; assess bevacizumab independently.',6,6)
# 00449 blood nadir and GI grades must not supply an administration dose without documented recovery.
for r in rules('00449'):
 if r['rule_id'].startswith(('ANC_DELAY_NADIR_','PLATELETS_DELAY_NADIR_')) or r['rule_id']=='FEBRILE_G4_NEUTROPENIA':
  setwhen(r,allof(condition(r),cond('anc_x10e9_l','>=',1.5),cond('platelets_x10e9_l','>=',75),cond('toxicity_delay_weeks','<=',2)))
 if r['rule_id'].startswith(('DIARRHOEA_HIGHEST_','STOMATITIS_HIGHEST_')):
  field='diarrhoea_current_grade' if r['rule_id'].startswith('DIARRHOEA') else 'stomatitis_current_grade'
  setwhen(r,allof(condition(r),cond(field,'<',2),cond('toxicity_delay_weeks','<=',2)))
add('00449','COUNT_REDUCTION_CONTEXT_REVIEW',allof(anyof(cond('lowest_anc_during_delay_x10e9_l','<',1),cond('lowest_platelets_during_delay_x10e9_l','<',50),cond('grade4_neutropenia_with_grade2_fever','==',True)),anyof(cond('anc_x10e9_l','missing'),cond('platelets_x10e9_l','missing'),cond('toxicity_delay_weeks','missing'))),'consultant_review',chemo['00449'],'Previous severe haematological toxicity may require a reduction, but confirm current recovery of both counts and the source two-week restart window before selecting a dose. Assess bevacizumab independently.',4,2)
for toxicity in ['diarrhoea','stomatitis']:
 add('00449',toxicity.upper()+'_REDUCTION_CONTEXT_REVIEW',allof(cond(toxicity+'_highest_grade','>=',3),anyof(cond(toxicity+'_current_grade','missing'),cond('toxicity_delay_weeks','missing'),allof(cond(toxicity+'_current_grade','<',2),cond('toxicity_delay_weeks','>',2)))),'consultant_review',chemo['00449'],'Previous severe '+toxicity+' requires confirmed current recovery below grade 2 within two weeks before selecting a restart dose. Unknown or later recovery needs consultant review; assess bevacizumab independently.',6,6)
# 00448: source window remains two weeks despite separate ANC stop at four weeks.
add('00448','LATE_COUNT_RECOVERY_REVIEW',allof(cond('anc_x10e9_l','>=',1.5),cond('platelets_x10e9_l','>=',75),cond('toxicity_delay_weeks','>',2)),'consultant_review',chemo['00448'],'Counts recovered after the source two-week restart window. Table 2 separately states an ANC stopping threshold after four weeks; this does not authorize automatic restart between weeks two and four. Reconcile prior nadir, current doses and the individual consultant plan.',4,2)
r=rule('00448','FEBRILE_G4_NEUTROPENIA');setwhen(r,allof(condition(r),cond('toxicity_delay_weeks','<=',2)))
add('00448','FEBRILE_NEUTROPENIA_RECOVERY_CONTEXT',allof(cond('grade4_neutropenia_with_grade2_fever','==',True),anyof(cond('anc_x10e9_l','missing'),cond('platelets_x10e9_l','missing'),cond('toxicity_delay_weeks','missing'))),'consultant_review',chemo['00448'],'Prior grade 4 neutropenia with grade 2 or worse fever requires a subsequent-cycle reduction, but current recovery of both blood counts and the two-week restart interval must be confirmed before selecting a dose.',4,2)
for toxicity in ['diarrhoea','stomatitis']:
 add('00448',toxicity.upper()+'_RECOVERY_CONTEXT',allof(cond(toxicity+'_highest_grade','>=',3),anyof(cond(toxicity+'_current_grade','missing'),cond('toxicity_delay_weeks','missing'),allof(cond(toxicity+'_current_grade','<',2),cond('toxicity_delay_weeks','>',2)))),'consultant_review',chemo['00448'],'Previous severe '+toxicity+' requires documented recovery below grade 2 within two weeks before a restart dose is selected. Unknown or later recovery requires consultant review. Irinotecan additionally requires treatment-related diarrhoea to be fully resolved.',5,4)

for r in rules('00448'):
 if r['rule_id'] in ['DIARRHOEA_RECOVERY_CONTEXT','STOMATITIS_RECOVERY_CONTEXT']:r['source']['pages']=[3,5]
# All five current binary hashes, software evidence and independent-review status.
for c in codes:
 m=p[c]['metadata'];m.update(sactcheck_encoding_version='0.84.33',source_checked_date='2026-11-04',source_binary_retrieved=True,source_pdf_sha256=hashlib.sha256((out/(c+'.pdf')).read_bytes()).hexdigest(),catalogue_source_checked_date='2026-11-04')
 m['validation'].update(source_document_checked=True,software_tests_completed=False,consultant_reviewed=False,oncology_pharmacy_reviewed=False,clinical_use_authorised=False,audit_release='0.84.33',audit_date='2026-11-04',software_validation_record='validation/colorectal-v08433/retro-source-audit/AUDIT.md',rule_level_source_reconciliation_status='source_mapped_with_declared_conflicts_pending_independent_clinical_review')
 m['encoding_maturity'].update(level='source_reconciled_rule_encoding',label='Source-mapped rules · independent clinical/pharmacy review pending',source_reconciled=True,consultant_reviewed=False,oncology_pharmacy_reviewed=False,clinical_use_authorised=False,audit_release='0.84.33',audit_date='2026-11-04',reconciled_release='0.84.33',reconciled_date='2026-11-04',scope_note='Official current NCCP binary PDF and dose/hold/recovery/monitoring rules re-audited. Source ambiguities remain explicit; independent consultant, oncology-pharmacy and patient/PPI review remain pending.')
 m['retrospective_service_audit']={'release':'0.84.33','checked':'2026-11-04','scope':'Current binary source, clinical thresholds, recovery windows, component dose history and patient monitoring; see audit record.','consultant_reviewed':False,'oncology_pharmacy_reviewed':False,'clinical_use_authorised':False}
 paths[c].write_text(json.dumps(p[c],ensure_ascii=False,indent=2)+'\n')
print('Updated five owned protocols; original snapshots preserved.')
