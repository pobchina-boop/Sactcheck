from pathlib import Path
import json
B=Path(__file__).resolve().parent
pfile=next((B/'proposed').glob('00568-*.json'));p=json.loads(pfile.read_text());p['metadata']['source_version_change_date']='2025-10-06';rules=p['rule_engine']['rules'];defs=p['input_definitions'];url=p['metadata']['source_url']
def f(k,op,v=None):return dict(field=k,operator=op,**({'value':v} if v is not None else {}))
def all_(*x):return {'all':list(x)}
def any_(*x):return {'any':list(x)}
def rule(id,when,action,msg,components,page):
 return {'id':id,'priority':10 if action in ['contraindicated','permanently_discontinue','withhold'] else 8,'when':when,'action':{'type':action,'components':components,'message':msg,'recommendation':msg},'explanation':msg,'source':{'document':'NCCP 00568 v5','page':page,'url':url}}
def add(id,when,action,msg,components=['pembrolizumab'],page=5):rules.append(rule(id,when,action,msg,components,page))
def boolean(k,label):defs[k]={'label':label,'type':'boolean','required':False,'input_role':'decision','demo_value':False}
def num(k,label,unit='',step=.01):defs[k]={'label':label,'type':'number','required':False,'min':0,'step':step,'unit':unit,'input_role':'decision'}
def select(k,label,values):defs[k]={'label':label,'type':'select','required':False,'input_role':'decision','options':[{'value':v,'label':s} for v,s in values]}
select('treatment_phase','Current treatment phase',[('induction','Induction: pembrolizumab + pemetrexed + carboplatin'),('maintenance','Maintenance: pembrolizumab + pemetrexed')])
chemo=['pemetrexed','carboplatin'];carbo_active=any_(f('treatment_phase','missing'),f('treatment_phase','==','induction'))
for r in rules:
 id=r.get('id',r.get('rule_id'));r['source']={'document':'NCCP 00568 v5','page':3 if id in ['LOW_ANC','LOW_PLATELETS'] else '2–6','url':url}
 if id=='ECOG_OUTSIDE_USUAL_RANGE':r['when']['value']=1;r['action']['message']=r['explanation']='ECOG above 1 is outside the NCCP 00568 eligibility range (0–1); consultant review is required.'
 if id.startswith('CARBO_'):
  r['action']['components']=['carboplatin'];r['when']=all_(carbo_active,r['when'])
  if id=='CARBO_GFR_20_30':r['when']=all_(carbo_active,f('gfr_crcl_ml_min','>',20),f('gfr_crcl_ml_min','<=',30))
 if id.startswith('PEME_'):r['action']['components']=['pemetrexed']
 if id.startswith('ICI_'):r['action']['components']=['pembrolizumab']
 if id in ['LOW_ANC','LOW_PLATELETS']:r['action']['components']=chemo;r['action']['message']=r['explanation']=r['action']['message']+' This applies to the chemotherapy components; pembrolizumab suitability is assessed separately.'
 if id=='SEVERE_NONHAEM':r['action']['components']=chemo;r['action']['message']=r['explanation']='Hold pemetrexed/carboplatin for grade ≥3 other non-haematological toxicity until recovery to baseline; source advises resuming at 75% of previous doses. Consultant confirms attribution, recovery and active components; assess immune toxicity separately.'
 if id=='PEME_MUCOSITIS':r['action']['components']=chemo;r['action']['message']=r['explanation']='Hold chemotherapy for grade ≥3 mucositis until recovery to baseline. Source restart: pemetrexed 50% of previous dose, carboplatin 100% if still in induction; consultant confirms restart.'
 if id in ['ICI_PNEUMONITIS_G2','ICI_COLITIS_G2','ICI_HEPATITIS_WITHHOLD','ICI_BILI_WITHHOLD','ICI_RENAL_G2']:
  field=r['when']['field'];lo=r['when'].get('value');hi={'ICI_PNEUMONITIS_G2':2,'ICI_COLITIS_G2':3,'ICI_HEPATITIS_WITHHOLD':5,'ICI_BILI_WITHHOLD':3,'ICI_RENAL_G2':3}[id];r['when']=all_(r['when'],f(field,'<=',hi))
 if id in ['ICI_RENAL_G2','ICI_RENAL_G3']:r['action']['message']=r['explanation']='Possible immune nephritis: '+('withhold pembrolizumab for grade 2 with creatinine >1.5 to ≤3 times ULN.' if id=='ICI_RENAL_G2' else 'permanently discontinue pembrolizumab for grade ≥3 with creatinine >3 times ULN.')+' Confirm grade, cause and consultant management; this input is a multiple of ULN, not baseline.'
 # Keep stable existing IDs but correct component scope and explicit provenance.
 r['action']['recommendation']=r['action'].get('message',r['action'].get('recommendation',''))
defs['creatinine_ratio_baseline_or_uln']['label']='Creatinine / laboratory ULN (immune nephritis; do not use baseline ratio)';defs['creatinine_ratio_baseline_or_uln']['assessment_guidance']='Source Table 3 uses ULN. The stored input key is retained for portability but the entered ratio must be creatinine divided by the laboratory ULN.'
add('ANC_REVIEW_1_TO_1_5',all_(f('anc_x10e9_l','>=',1),f('anc_x10e9_l','<',1.5)),'consultant_review','ANC 1.0 to <1.5: consult treating team; continuation may be considered only if clinically well. Do not issue automatic clearance.',chemo,3)
add('ANC_BELOW_0_5_REDUCTION',f('anc_x10e9_l','<',.5),'withhold','ANC <0.5: delay chemotherapy until recovery and source advises a 25% reduction of previous pemetrexed/carboplatin doses; consultant confirms active phase and restart.',chemo,3)
add('PLATELETS_REVIEW_75_100',all_(f('platelets_x10e9_l','>=',75),f('platelets_x10e9_l','<',100)),'consultant_review','Platelets 75 to <100: consult treating team and consider continuation only if clinically well; no automatic clearance.',chemo,3)
add('PLATELETS_BELOW_50_REDUCTION',f('platelets_x10e9_l','<',50),'withhold','Platelets <50: delay chemotherapy until recovery; source advises 25% reduction, or 50% if bleeding. Confirm bleeding status and consultant restart plan.',chemo,3)
boolean('thrombocytopenia_with_bleeding','Bleeding associated with thrombocytopenia')
add('PLATELETS_BELOW_50_BLEEDING',all_(f('platelets_x10e9_l','<',50),f('thrombocytopenia_with_bleeding','==',True)),'withhold','Platelets <50 with bleeding: delay chemotherapy until recovery and reduce previous pemetrexed/carboplatin doses by 50% on consultant-directed restart.',chemo,3)
boolean('previous_febrile_neutropenia','Febrile neutropenia since the previous chemotherapy dose')
add('FEBRILE_NEUTROPENIA_RESTART',f('previous_febrile_neutropenia','==',True),'withhold','Delay chemotherapy until recovery after febrile neutropenia; source advises 25% reduction of previous pemetrexed/carboplatin doses. Active fever/infection needs urgent assessment.',chemo,3)
add('PEME_NUMERIC_CRCL_LT45',f('gfr_crcl_ml_min','<',45),'contraindicated','CrCl <45 mL/min is an NCCP exclusion and pemetrexed is not recommended. Verify that the renal estimate is appropriate; do not allow a numeric entry to bypass the categorical renal pathway.',['pemetrexed'],4)
add('CARBO_CRCL_LT60',all_(carbo_active,f('gfr_crcl_ml_min','<',60)),'consultant_review','CrCl <60 increases carboplatin myelosuppression risk. Verify renal method, source renal precautions and current induction phase; this does not prescribe a final dose.',['carboplatin'],4)
for k,label in [('active_unstable_cns_metastases','Active or unstable CNS metastases'),('immunosuppressive_systemic_therapy','Systemic immunosuppression >10 mg/day prednisolone equivalent or another immunosuppressant (excluding topical/inhaled therapy)'),('history_ild_pneumonitis','History of interstitial lung disease or pneumonitis'),('serious_autoimmune_history','History of serious autoimmune disease')]:
 boolean(k,label);add(k.upper(),f(k,'==',True),'consultant_review',('NCCP caution' if k=='serious_autoimmune_history' else 'NCCP exclusion')+': '+label+'. Confirm specialist suitability before treatment.',['pembrolizumab'],2)
boolean('hepatic_metastases','Hepatic metastases present')
add('PEME_HEPATIC_BILIRUBIN',f('bilirubin_uln_multiple','>',1.5),'consultant_review','Pemetrexed is not recommended with bilirubin >1.5×ULN; NCCP requires a clinical decision. Distinguish baseline impairment from treatment-related hepatotoxicity.',['pemetrexed'],4)
add('PEME_HEPATIC_AST_NO_METS',all_(f('hepatic_metastases','==',False),f('alt_ast_uln_multiple','>',3)),'consultant_review','Without hepatic metastases, aminotransferases >3×ULN: pemetrexed not recommended; clinical decision required.',['pemetrexed'],4)
add('PEME_HEPATIC_AST_METS',all_(f('hepatic_metastases','==',True),f('alt_ast_uln_multiple','>',5)),'consultant_review','With hepatic metastases, aminotransferases >5×ULN: pemetrexed not recommended; clinical decision required.',['pemetrexed'],4)
add('PEME_HEPATIC_CONTEXT',all_(f('hepatic_metastases','missing'),f('alt_ast_uln_multiple','>',3)),'consultant_review','Confirm hepatic metastasis status to apply pemetrexed baseline liver thresholds (>3×ULN without, >5×ULN with metastases). Assess possible immune hepatitis separately.',['pemetrexed'],4)
add('ICI_BILI_STOP',f('bilirubin_uln_multiple','>',3),'permanently_discontinue','For treatment-related immune hepatitis with bilirubin >3×ULN, permanently discontinue pembrolizumab. Urgently assess cause and consultant management.',['pembrolizumab'],5)
for k,label,id in [('recurrent_grade2_pneumonitis','Recurrent grade 2 immune pneumonitis','ICI_RECURRENT_PNEUMONITIS'),('recurrent_grade3_colitis','Recurrent grade 3 immune colitis','ICI_RECURRENT_COLITIS')]:boolean(k,label);add(id,f(k,'==',True),'permanently_discontinue',label+': permanently discontinue pembrolizumab according to Table 3.',['pembrolizumab'],4)
for k,label in [('symptomatic_hypophysitis','Symptomatic hypophysitis'),('type1_diabetes_ketoacidosis','Type 1 diabetes with ketoacidosis'),('hyperthyroidism_grade3_plus','Grade ≥3 hyperthyroidism')]:boolean(k,label);add(k.upper(),f(k,'==',True),'withhold',label+': withhold pembrolizumab and arrange prompt specialist assessment. Controlled endocrinopathy may permit continuation after recovery and steroid taper, per consultant plan.')
boolean('type1_diabetes','Type 1 diabetes / suspected immune diabetes')
add('ICI_TYPE1_HIGH_GLUCOSE',all_(f('type1_diabetes','==',True),f('glucose_mmol_l','>',13.9)),'withhold','Type 1 diabetes with glucose >13.9 mmol/L is the NCCP grade ≥3 hyperglycaemia trigger: withhold pembrolizumab and urgently assess, including ketones.')
for k,label in [('suspected_sjs_ten','Suspected Stevens–Johnson syndrome / toxic epidermal necrolysis'),('confirmed_sjs_ten','Confirmed Stevens–Johnson syndrome / toxic epidermal necrolysis')]:boolean(k,label)
add('ICI_SKIN_HOLD',any_(f('rash_grade','==',3),f('suspected_sjs_ten','==',True)),'withhold','Grade 3 skin reaction or suspected SJS/TEN: withhold pembrolizumab and arrange urgent specialist assessment.')
add('ICI_SKIN_STOP',any_(f('rash_grade','>=',4),f('confirmed_sjs_ten','==',True)),'permanently_discontinue','Grade 4 skin reaction or confirmed SJS/TEN: permanently discontinue pembrolizumab.')
boolean('other_immune_grade2_3','Other immune-related toxicity requiring withholding (grade 2 or 3, depending on type)');boolean('immune_permanent_stop_event','Grade 4 or recurrent grade 3 immune toxicity; or grade 3–4 myocarditis, encephalitis or Guillain–Barré syndrome')
add('ICI_OTHER_HOLD',f('other_immune_grade2_3','==',True),'withhold','Withhold pembrolizumab for other immune toxicity according to grade and organ-specific management; seek consultant review.')
add('ICI_OTHER_STOP',f('immune_permanent_stop_event','==',True),'permanently_discontinue','Permanently discontinue pembrolizumab for the specified severe/recurrent immune event, except source-defined controlled endocrine exceptions requiring consultant agreement.')
boolean('ici_failed_recovery_12_weeks','Treatment-related toxicity has not recovered to grade 0–1 within 12 weeks after last pembrolizumab');boolean('ici_steroid_gt10_at_12_weeks','Unable to reduce systemic prednisone equivalent to ≤10 mg/day within 12 weeks')
add('ICI_12_WEEK_STOP',any_(f('ici_failed_recovery_12_weeks','==',True),f('ici_steroid_gt10_at_12_weeks','==',True)),'permanently_discontinue','The NCCP 12-week recovery/steroid condition is not met: permanently discontinue pembrolizumab under consultant management; never stop or taper steroids abruptly.')
boolean('immune_liver_metastasis_baseline_g2','Liver metastases with baseline grade 2 AST/ALT elevation');num('ast_alt_increase_percent','AST/ALT increase from baseline','%');num('ast_alt_elevation_days','Duration of this AST/ALT increase','days',1)
add('ICI_LIVER_METS_BASELINE_G2_STOP',all_(f('immune_liver_metastasis_baseline_g2','==',True),f('ast_alt_increase_percent','>=',50),f('ast_alt_elevation_days','>=',7)),'permanently_discontinue','With liver metastases and baseline grade 2 AST/ALT, an increase ≥50% lasting ≥1 week meets the NCCP pembrolizumab discontinuation pathway; confirm immune attribution and consultant management.')
boolean('diarrhoea_hospitalisation','Diarrhoea of any grade requiring hospitalisation');num('neuropathy_grade','Neurotoxicity grade','grade',1);boolean('recurrent_neurotoxicity','Any recurrence of neurotoxicity');num('prior_chemotherapy_dose_reductions','Number of previous pemetrexed/carboplatin dose reductions','reductions',1)
add('CHEMO_DIARRHOEA',any_(f('diarrhoea_colitis_grade','>=',3),f('diarrhoea_hospitalisation','==',True)),'withhold','Hold pemetrexed/carboplatin until diarrhoea resolves to baseline; source restart at 75% of previous doses. Assess the separate pembrolizumab colitis pathway.',chemo,5)
add('CHEMO_NEURO_G2',f('neuropathy_grade','==',2),'withhold','Hold chemotherapy until neurotoxicity returns to baseline. Source restart: pemetrexed 100%, carboplatin 50% of previous dose if still in induction.',chemo,6)
add('CHEMO_NEURO_STOP',any_(f('neuropathy_grade','>=',3),f('recurrent_neurotoxicity','==',True)),'permanently_discontinue','Grade ≥3 neurotoxicity or any recurrence: discontinue pemetrexed/carboplatin per NCCP; assess active phase and attribution.',chemo,6)
add('CHEMO_TWO_REDUCTIONS',all_(f('prior_chemotherapy_dose_reductions','>=',2),f('other_nonhaem_toxicity_grade','>=',3)),'consultant_review','Grade ≥3 toxicity after two chemotherapy dose reductions: Table 4 says consider discontinuation of both drugs and discuss with consultant. Introductory wording differs (>grade 3); do not automate a restart.',chemo,6)
boolean('treatment_related_hepatotoxicity','Liver abnormality considered treatment-related')
add('CHEMO_LIVER_HOLD',all_(f('treatment_related_hepatotoxicity','==',True),any_(f('bilirubin_uln_multiple','>',3),f('alt_ast_uln_multiple','>',5))),'withhold','Hold pemetrexed/carboplatin until treatment-related liver toxicity returns to baseline; restart at 75% of previous doses only after consultant review. More severe values meet a separate stop rule.',chemo,6)
add('CHEMO_LIVER_STOP',all_(f('treatment_related_hepatotoxicity','==',True),any_(f('bilirubin_uln_multiple','>',10),f('alt_ast_uln_multiple','>',20))),'permanently_discontinue','Treatment-related bilirubin >10×ULN or AST/ALT >20×ULN: discontinue pemetrexed/carboplatin.',chemo,6)
p['clinical_governance']['clinical_use_authorised']=False
p['metadata']['validation']['scope_note']='Source-specific boundary and omission repairs added for 00568 v5; unresolved attribution and conflicting text require consultant judgment. This is not independent clinical validation.'
pfile.write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n')
print('00568 rules',len(rules),'inputs',len(defs))
# A maintenance assessment must never return a carboplatin dose action.
for r in list(rules):
 if set(r['action']['components'])=={'pemetrexed','carboplatin'}:
  import copy
  maintenance=copy.deepcopy(r);maintenance['id'] += '_MAINTENANCE';maintenance['when']=all_(f('treatment_phase','==','maintenance'),maintenance['when']);maintenance['action']['components']=['pemetrexed'];maintenance['action']['message']='Maintenance phase: carboplatin is no longer active. '+maintenance['action']['message'];maintenance['action']['recommendation']=maintenance['action']['message'];maintenance['explanation']=maintenance['action']['message'];rules.append(maintenance)
  r['when']=all_(carbo_active,r['when'])
pfile.write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n')
print('00568 with phase-scoped chemotherapy rules',len(rules))

for r in rules:
 if r.get('id')=='PREGNANCY_BREASTFEEDING':
  r['action']['type']='consultant_review';r['action']['message']=r['action']['recommendation']=r['explanation']='Pregnancy or breastfeeding requires urgent specialist review of this combination and each product’s precautions; do not issue routine treatment clearance. NCCP00568 does not specify an independent pregnancy dose rule.';r['source']={'document':'NCCP00568 v5: product-specific adverse effects and clinical judgment','page':'2,7–10','url':url}
pfile.write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n')
