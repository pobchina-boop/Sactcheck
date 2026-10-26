from pathlib import Path
import copy,json,re,hashlib
B=Path(__file__).resolve().parent;R=B.parents[2];DATE='2026-10-26';V='0.84.22'
def readcode(c):return json.loads((B/'research'/f'{c}-baseline-v08421.json').read_text())
def f(k,o,v=None):return dict(field=k,operator=o,**({'value':v} if v is not None else {}))
def all_(*x):return {'all':list(x)}
def any_(*x):return {'any':list(x)}
def replace(x,a,b):
 if isinstance(x,str):return x.replace(a,b)
 if isinstance(x,list):return [replace(v,a,b) for v in x]
 if isinstance(x,dict):return {k:replace(v,a,b) for k,v in x.items()}
 return x
base=readcode('00568');records={}
for code in ['00569','00579']:
 old=readcode(code);p=copy.deepcopy(old);defs=p['input_definitions'];rules=[];url=p['metadata']['source_url'];cis=code=='00569';chem=['pemetrexed','cisplatin'] if cis else ['paclitaxel','carboplatin'];active=any_(f('treatment_phase','missing'),f('treatment_phase','==','induction'))
 def boolean(k,label):defs[k]={'label':label,'type':'boolean','required':False,'input_role':'decision'}
 def num(k,label,unit='',step=.01):defs[k]={'label':label,'type':'number','required':False,'min':0,'step':step,'unit':unit,'input_role':'decision'}
 def select(k,label,options):defs[k]={'label':label,'type':'select','required':False,'input_role':'decision','options':[{'value':v,'label':l} for v,l in options]}
 def add(id,when,action,msg,components=None,page='4–7',phase=False):
  comps=components or ['pembrolizumab'];r={'id':id,'priority':10 if action in ['withhold','contraindicated','permanently_discontinue','omit'] else 8,'when':when,'action':{'type':action,'components':comps,'message':msg,'recommendation':msg},'explanation':msg,'source':{'document':f'NCCP {code} v{p["metadata"]["nccp_version"]}','page':page,'url':url,'checked_date':DATE}}
  if phase:
   r['when']=all_(active,when)
   if cis and 'pemetrexed' in comps:
    m=copy.deepcopy(r);m['id']+='_MAINTENANCE';m['when']=all_(f('treatment_phase','==','maintenance'),when);m['action']['components']=['pemetrexed'];txt=msg.replace('pemetrexed/cisplatin','pemetrexed').replace('both chemotherapy components','pemetrexed');txt='Maintenance: cisplatin has stopped. '+txt;m['action']['message']=m['action']['recommendation']=m['explanation']=txt;rules.append(m)
  rules.append(r)
 # Reuse verified Table 3 architecture; each threshold rechecked against the two fresh sources.
 immune_prefix=('ICI_','SYMPTOMATIC_HYPOPHYSITIS','TYPE1_DIABETES_KETOACIDOSIS','HYPERTHYROIDISM_GRADE3_PLUS')
 for k,v in base['input_definitions'].items():
  if k not in defs:defs[k]=copy.deepcopy(v)
 for r0 in base['rule_engine']['rules']:
  rid=r0['id']
  if rid.startswith(immune_prefix) and '_MAINTENANCE' not in rid:
   r=copy.deepcopy(r0);r['source']={'document':f'NCCP {code} v{p["metadata"]["nccp_version"]}','page':'4–5' if cis else '6','url':url,'checked_date':DATE};rules.append(r)
 # Numeric organ abnormalities do not establish immune causation.
 select('immune_hepatitis_attribution','Cause of liver abnormality for pembrolizumab',[('confirmed_immune','Confirmed treatment-related immune hepatitis'),('suspected_immune','Possible immune hepatitis; cause under review'),('other_or_baseline','Baseline impairment or another established cause')])
 select('immune_nephritis_attribution','Cause of creatinine elevation for pembrolizumab',[('confirmed_immune','Confirmed immune nephritis with source grade'),('suspected_immune','Possible immune nephritis; cause under review'),('other_or_baseline','Baseline impairment or another established cause')])
 for r in rules:
  if r['id'] in ['ICI_HEPATITIS_WITHHOLD','ICI_HEPATITIS_STOP','ICI_BILI_WITHHOLD','ICI_BILI_STOP','ICI_LIVER_METS_BASELINE_G2_STOP']:
   r['when']=all_(f('immune_hepatitis_attribution','==','confirmed_immune'),r['when'])
  if r['id'] in ['ICI_RENAL_G2','ICI_RENAL_G3']:r['when']=all_(f('immune_nephritis_attribution','==','confirmed_immune'),r['when'])
 defs['creatinine_ratio_baseline_or_uln']=copy.deepcopy(base['input_definitions']['creatinine_ratio_baseline_or_uln'])
 unresolved_liver=any_(f('immune_hepatitis_attribution','missing'),f('immune_hepatitis_attribution','==','suspected_immune'))
 select('infusion_reaction_culprit','Medicine implicated in infusion reaction',[('pembrolizumab','Pembrolizumab'),('chemotherapy','Chemotherapy component'),('unknown','Not yet established')])
 for r in rules:
  if r['id']=='ICI_INFUSION_G3':r['when']=all_(f('infusion_reaction_culprit','==','pembrolizumab'),r['when'])
 add('INFUSION_REACTION_UNRESOLVED',all_(f('infusion_reaction_grade','>=',3),any_(f('infusion_reaction_culprit','missing'),f('infusion_reaction_culprit','==','unknown'))),'withhold','Severe infusion reaction: stop the infusion and obtain immediate clinical assessment. Identify the causative medicine before deciding permanent discontinuation of a particular component.',['whole_regimen'])
 add('LIVER_ATTRIBUTION_UNRESOLVED',all_(unresolved_liver,any_(f('alt_ast_uln_multiple','>',3),f('bilirubin_uln_multiple','>',1.5))),'withhold','Abnormal liver results may meet an immune-hepatitis threshold, but baseline impairment and other causes must be distinguished. Withhold pending prompt clinical assessment; do not infer permanent immunotherapy discontinuation from the number alone.')
 add('NEPHRITIS_ATTRIBUTION_UNRESOLVED',all_(any_(f('immune_nephritis_attribution','missing'),f('immune_nephritis_attribution','==','suspected_immune')),f('creatinine_ratio_baseline_or_uln','>',1.5)),'withhold','Creatinine >1.5×laboratory ULN requires prompt renal and immune-toxicity assessment. Hold while cause and grade are clarified; a baseline ratio or renal impairment alone cannot establish immune nephritis.')
 if cis:
  select('adrenal_insufficiency_grade','Immune adrenal insufficiency grade',[(n,str(n)) for n in range(5)])
  select('hypophysitis_grade','Immune hypophysitis grade',[(n,str(n)) for n in range(5)])
  add('ICI_ADRENAL_HYPOPHYSITIS_HOLD',any_(f('adrenal_insufficiency_grade','>=',2),f('hypophysitis_grade','==',2)),'withhold','Withhold for grade 2 adrenal insufficiency/hypophysitis until hormone replacement controls the event, and for grade 3–4 adrenal insufficiency or symptomatic hypophysitis. Consultant decides restart after recovery and steroid taper; controlled endocrine exceptions are not automatic permanent stops.',page=4)
  add('ICI_HYPOPHYSITIS_CONTEXT',all_(f('hypophysitis_grade','>=',3),f('symptomatic_hypophysitis','missing')),'withhold','Severe hypophysitis requires prompt endocrine assessment. Confirm symptoms and the hormone-replacement/recovery plan before further pembrolizumab; the source specifically lists symptomatic hypophysitis.',page=4)
  boolean('pembrolizumab_severe_renal_impairment','Severe baseline renal impairment for pembrolizumab')
  boolean('pembrolizumab_moderate_severe_hepatic_impairment','Moderate/severe baseline hepatic impairment for pembrolizumab')
  for k,organ in [('pembrolizumab_severe_renal_impairment','severe renal impairment'),('pembrolizumab_moderate_severe_hepatic_impairment','moderate/severe hepatic impairment')]:
   add(k.upper(),f(k,'==',True),'consultant_review','NCCP 00569 Table 2: pembrolizumab in '+organ+' has not been studied. Obtain specialist suitability review; do not invent a dose reduction or equate baseline impairment with immune toxicity.',page=4)
 select('treatment_phase','Current treatment phase',[('induction','Induction: '+', '.join(['pembrolizumab']+chem)),('maintenance','Maintenance: pembrolizumab'+(' + pemetrexed' if cis else ' alone'))])
 add('ECOG_OUTSIDE_USUAL_RANGE',f('ecog','>',1),'consultant_review','ECOG above 1 is outside source eligibility (0–1); consultant review is required.',['whole_regimen'],2 if cis else 3)
 add('HYPERSENSITIVITY',f('hypersensitivity','==',True),'contraindicated','Known hypersensitivity to a component requires the source exclusion pathway; identify the culprit and seek specialist advice.',['whole_regimen'],2 if cis else 3)
 add('PREGNANCY_BREASTFEEDING',any_(f('pregnancy','==',True),f('breastfeeding','==',True)),'consultant_review' if cis else 'contraindicated','Pregnancy or breastfeeding requires urgent specialist review and no routine treatment clearance.'+(' Source 00579 lists pregnancy/lactation as exclusions.' if not cis else ' Apply product-specific precautions; this source does not encode a separate pregnancy dose rule.'),['whole_regimen'],2 if cis else 3)
 add('INFECTION',f('febrile_or_active_infection','==',True),'withhold','Fever, febrile neutropenia or clinically significant infection requires urgent clinical assessment; hold pending review.',['whole_regimen'],2 if cis else 3)
 for k,label in [('active_unstable_cns_metastases','Active/unstable CNS metastases'),('immunosuppressive_systemic_therapy','Systemic immunosuppression above 10 mg/day prednisolone equivalent (excluding topical/inhaled)'),('history_ild_pneumonitis','History of interstitial lung disease/pneumonitis'),('serious_autoimmune_history','Serious autoimmune history')]:
  boolean(k,label);add(k.upper(),f(k,'==',True),'consultant_review',('Source caution: ' if k=='serious_autoimmune_history' else 'Source exclusion: ')+label+'. Confirm specialist suitability before treatment.',page=2 if cis else 3)
 # Counts are active chemotherapy actions, never pembrolizumab dose reductions.
 add('LOW_ANC',f('anc_x10e9_l','<',1),'withhold','Delay '+('/'.join(chem))+' until recovery. ANC <0.5 has an additional dose-history pathway.',chem,3 if cis else 4,True)
 add('LOW_PLATELETS',f('platelets_x10e9_l','<',75),'withhold','Delay '+('/'.join(chem))+' until recovery. Platelets <50 have an additional dose-history pathway.',chem,3 if cis else 4,True)
 add('ANC_REVIEW_1_TO_1_5',all_(f('anc_x10e9_l','>=',1),f('anc_x10e9_l','<',1.5)),'consultant_review','ANC 1 to <1.5: consultant may consider continuation only if clinically well. No automatic clearance.',chem,3 if cis else 4,True)
 add('PLATELETS_REVIEW_75_100',all_(f('platelets_x10e9_l','>=',75),f('platelets_x10e9_l','<',100)),'consultant_review','Platelets 75 to <100: consultant may consider continuation only if clinically well.',chem,3 if cis else 4,True)
 for rid,when,label in [('ANC_BELOW_0_5_REDUCTION',f('anc_x10e9_l','<',.5),'ANC <0.5'),('PLATELETS_BELOW_50_REDUCTION',f('platelets_x10e9_l','<',50),'Platelets <50'),('FEBRILE_NEUTROPENIA_RESTART',f('previous_febrile_neutropenia','==',True),'Previous febrile neutropenia')]:
  add(rid,when,'withhold',label+': delay chemotherapy until recovery; '+('reduce' if cis else 'consider reducing')+' previous '+('/'.join(chem))+' doses by 25%. Confirm dose history, current phase and consultant restart plan; this is not a dose calculation.',chem,3 if cis else 4,True)
 if not cis:
  for field,val,label in [('anc_x10e9_l',1,'ANC exactly 1.0'),('platelets_x10e9_l',75,'Platelets exactly 75')]:add('OVERLAP_'+field.upper(),f(field,'==',val),'withhold',label+' appears in both continue/review and delay rows in Table 1. Hold pending consultant clarification; do not round or silently select a permissive row.',chem,4,True)
  add('MAINTENANCE_LOW_COUNTS',all_(f('treatment_phase','==','maintenance'),any_(f('anc_x10e9_l','<',1.5),f('platelets_x10e9_l','<',100))),'consultant_review','Maintenance contains pembrolizumab alone. Assess cytopenia cause and clinical fitness; do not issue paclitaxel/carboplatin dose instructions.',['pembrolizumab'],4)
  add('MAINTENANCE_RESIDUAL_TOXICITY',all_(f('treatment_phase','==','maintenance'),any_(f('neuropathy_grade','>=',1),f('mucositis_grade','>=',2),f('other_nonhaem_toxicity_grade','>=',3))),'consultant_review','Persistent or new toxicity still needs assessment during pembrolizumab maintenance. Establish cause, including immune toxicity; chemotherapy is no longer active, so no taxane/platinum dose is issued.',['pembrolizumab'],'3,6–8')
 else:
  add('PLATELETS_BELOW_50_BLEEDING',all_(f('platelets_x10e9_l','<',50),f('thrombocytopenia_with_bleeding','==',True)),'withhold','Platelets <50 with bleeding: delay chemotherapy until recovery; source restart reduces previous pemetrexed/cisplatin by 50%, with consultant review.',chem,3,True)
 # Component-specific renal and hepatic dosing.
 num('gfr_crcl_ml_min','GFR / CrCl used for dosing','mL/min')
 if cis:
  for rid,when,typ,msg in [('CISPLATIN_NUMERIC_45_59',all_(f('gfr_crcl_ml_min','>=',45),f('gfr_crcl_ml_min','<=',59)),'consultant_review','Cisplatin source renal band 45–59 mL/min: 75% dose. Reconcile current/previous dose and other toxicities before prescribing.'),('CISPLATIN_RENAL_GAP',all_(f('gfr_crcl_ml_min','>',59),f('gfr_crcl_ml_min','<',60)),'consultant_review','CrCl >59 to <60 falls between the printed 45–59 and ≥60 rows. Consultant/pharmacy clarification required; no rounding or automatic dose.'),('CISPLATIN_NUMERIC_LT45',f('gfr_crcl_ml_min','<',45),'contraindicated','CrCl <45 is an exclusion. Source advises considering carboplatin; do not automatically substitute another regimen.')]:add(rid,when,typ,msg,['cisplatin'],4,True)
  for r in old['rule_engine']['rules']:
   if r['id'].startswith('CISPLATIN_RENAL') or r['id']=='CISPLATIN_DIALYSIS':add(r['id'],r['when'],r['action']['type'],'Legacy renal-band entry: '+('source 45–59 band specifies cisplatin 75%; reconcile dose history before prescribing.' if r['id'].endswith('45_59') else 'CrCl <45 excludes this cisplatin combination; consider a different regimen only after consultant review.'),['cisplatin'],4,True)
  for r in base['rule_engine']['rules']:
   if r['id'].startswith('PEME_') and 'MUCOSITIS' not in r['id']:
    add(r['id'],r['when'],r['action']['type'],r['action']['message'],['pemetrexed'],4)
  boolean('baseline_neuropathy_grade2_plus','Pre-existing neuropathy grade ≥2 before starting cisplatin')
  add('CISPLATIN_BASELINE_NEUROPATHY',f('baseline_neuropathy_grade2_plus','==',True),'consultant_review','Pre-existing neuropathy grade ≥2 is a source exclusion. Confirm baseline suitability separately from new treatment-emergent neurotoxicity.',['cisplatin'],2,True)
  add('CISPLATIN_HEARING',f('hearing_or_tinnitus','==',True),'consultant_review','Significant hearing impairment or tinnitus is a source exclusion/cisplatin safety concern; assess before further cisplatin.',['cisplatin'],2,True)
  add('SEVERE_NONHAEM',f('other_nonhaem_toxicity_grade','>=',3),'withhold','Hold pemetrexed/cisplatin for other grade ≥3 treatment-related toxicity until baseline recovery; source restart at 75% of previous dose. Confirm attribution and history.',chem,6,True)
  add('PEME_MUCOSITIS',f('mucositis_grade','>=',3),'withhold','Hold chemotherapy until mucositis returns to baseline. Source restart: pemetrexed 50% of previous dose; cisplatin 100% if active. Confirm recovery and previous reductions before restart.',chem,5,True)
  add('CHEMO_DIARRHOEA',any_(f('diarrhoea_colitis_grade','>=',3),f('diarrhoea_hospitalisation','==',True)),'withhold','Hold pemetrexed/cisplatin for grade ≥3 diarrhoea or any diarrhoea requiring hospitalisation; on recovery to baseline source restart at 75% of previous doses. Assess immune colitis separately.',chem,5,True)
  add('CHEMO_NEURO_G2',f('neuropathy_grade','==',2),'withhold','Hold chemotherapy for treatment-emergent grade 2 neurotoxicity until baseline recovery. Source restart: pemetrexed 100%; cisplatin 50% of previous dose if still active.',chem,6,True)
  add('CHEMO_NEURO_STOP',any_(f('neuropathy_grade','>=',3),f('recurrent_neurotoxicity','==',True)),'permanently_discontinue','Grade ≥3 or recurrent treatment-emergent neurotoxicity: discontinue active pemetrexed/cisplatin and obtain consultant review.',chem,6,True)
  add('CHEMO_TWO_REDUCTIONS',all_(f('prior_chemotherapy_dose_reductions','>=',2),f('other_nonhaem_toxicity_grade','>=',3)),'consultant_review','Grade ≥3 toxicity after two chemotherapy reductions: Table 4 says consider discontinuation; introductory text is firmer. Consultant must reconcile the source wording and prior doses. No automatic restart.',chem,6,True)
  for rid,b,a,action in [('CHEMO_LIVER_HOLD',3,5,'withhold'),('CHEMO_LIVER_STOP',10,20,'permanently_discontinue')]:add(rid,all_(f('treatment_related_hepatotoxicity','==',True),any_(f('bilirubin_uln_multiple','>',b),f('alt_ast_uln_multiple','>',a))),action,('Discontinue active pemetrexed/cisplatin for treatment-related bilirubin >10×ULN or AST/ALT >20×ULN.' if action=='permanently_discontinue' else 'Hold pemetrexed/cisplatin for treatment-related bilirubin >3×ULN or AST/ALT >5×ULN; on recovery to baseline source restart at 75% of previous doses, unless the separate stop threshold applies.'),chem,6,True)
 else:
  add('CARBO_GFR_20_OR_LESS',f('gfr_crcl_ml_min','<=',20),'contraindicated','GFR ≤20: do not administer carboplatin. The do-not-administer row takes precedence at the overlapping boundary 20.',['carboplatin'],5,True)
  add('CARBO_GFR_20_30',all_(f('gfr_crcl_ml_min','>',20),f('gfr_crcl_ml_min','<=',30)),'consultant_review','GFR >20 to ≤30: extreme caution and specialist renal/dose review.',['carboplatin'],5,True)
  add('CARBO_CRCL_LT60',f('gfr_crcl_ml_min','<',60),'consultant_review','CrCl <60 increases carboplatin myelosuppression risk; review dose method and counts.',['carboplatin'],5,True)
  num('creatinine_sample_age_hours','Age of creatinine sample for formula dosing','hours',1);num('creatinine_percent_reference','Current creatinine as percent of measured-GFR reference','%');num('current_paclitaxel_percent_original','Current paclitaxel dose as percent of original','%')
  add('CARBO_CREATININE_OLDER48',f('creatinine_sample_age_hours','>',48),'consultant_review','Formula-derived carboplatin dosing requires creatinine within 48 hours. Obtain a current assessment before prescribing.',['carboplatin'],2,True)
  add('CARBO_CREATININE_RISE',f('creatinine_percent_reference','>',110),'consultant_review','Creatinine >110% of the value at measured GFR: reassess measured/estimated renal function before carboplatin.',['carboplatin'],5,True)
  add('PACLITAXEL_HEPATIC_CONTRA',any_(f('alt_ast_uln_multiple','>=',10),f('bilirubin_uln_multiple','>',5)),'contraindicated','Paclitaxel is contraindicated if AST/ALT ≥10×ULN or bilirubin >5×ULN. Apply regardless of whether the other liver field is omitted.',['paclitaxel'],5,True)
  for rid,lo,hi,pct in [('PACLITAXEL_HEPATIC_75',1.26,2,75),('PACLITAXEL_HEPATIC_50',2.01,5,50)]:
   add(rid,all_(f('alt_ast_uln_multiple','<',10),f('bilirubin_uln_multiple','>=',lo),f('bilirubin_uln_multiple','<=',hi)),'consultant_review',f'Table 2 hepatic band: paclitaxel {pct}% of ORIGINAL dose. This is a ceiling for specialist reconciliation, not permission to re-escalate a previously lower dose. Review current dose, prior reductions, recovery and interacting toxicity rules.',['paclitaxel'],5,True)
   add(rid+'_PRIOR_LOWER',all_(f('alt_ast_uln_multiple','<',10),f('bilirubin_uln_multiple','>=',lo),f('bilirubin_uln_multiple','<=',hi),f('current_paclitaxel_percent_original','<',pct)),'consultant_review',f'The recorded current paclitaxel dose is already below the source {pct}%-of-original hepatic band. Do not re-escalate from this table. Reconcile the existing reduction with all toxicity pathways and consultant instructions.',['paclitaxel'],5,True)
  add('PACLITAXEL_HEPATIC_GAP',any_(all_(f('bilirubin_uln_multiple','>',1.25),f('bilirubin_uln_multiple','<',1.26)),all_(f('bilirubin_uln_multiple','>',2),f('bilirubin_uln_multiple','<',2.01))),'consultant_review','Bilirubin is in a fractional gap between source bands (1.25–1.26 or 2.00–2.01×ULN). Seek consultant/pharmacy clarification; do not round into a numeric dose.',['paclitaxel'],5,True)
  add('PACLITAXEL_HEPATIC_MISSING_AST',all_(f('alt_ast_uln_multiple','missing'),f('bilirubin_uln_multiple','>',1.25),f('bilirubin_uln_multiple','<=',5)),'consultant_review','Abnormal bilirubin without AST/ALT cannot establish the paclitaxel hepatic dose band; check missing transaminases and dose history.',['paclitaxel'],5,True)
  boolean('neuropathy_present_at_next_cycle','Grade 1–2 neuropathy persists at start of next cycle');boolean('neuropathy_persistent_after_reduction','Neuropathy persists after the first paclitaxel reduction')
  add('PACLITAXEL_NEURO_G3',f('neuropathy_grade','>=',3),'omit','Grade ≥3 neuropathy: omit paclitaxel; assess reversibility, other causes and ongoing plan.',['paclitaxel'],7,True)
  add('PACLITAXEL_NEURO_G1_2',all_(f('neuropathy_grade','>=',1),f('neuropathy_grade','<=',2),f('neuropathy_present_at_next_cycle','==',True)),'consultant_review','Neuropathy grade 1–2 present at next cycle: source reduces paclitaxel by 25%, or by 50% if persistent. Confirm prior reductions and whether percentages refer to the appropriate current prescription; do not calculate an automatic dose. Table prints ≤2; grade 0 alone must not trigger a reduction.',['paclitaxel'],7,True)
  add('PACLITAXEL_NEURO_PERSISTENT',all_(f('neuropathy_grade','>=',1),f('neuropathy_grade','<=',2),f('neuropathy_present_at_next_cycle','==',True),f('neuropathy_persistent_after_reduction','==',True)),'consultant_review','Persistent grade 1–2 neuropathy after the first reduction: source lists 50% paclitaxel reduction. Reconcile the prior/current dose and consultant plan; do not calculate an additional automatic reduction.',['paclitaxel'],7,True)
  add('PACLITAXEL_NEURO_CONTEXT',all_(f('neuropathy_grade','>=',1),f('neuropathy_grade','<=',2),f('neuropathy_present_at_next_cycle','missing')),'consultant_review','Confirm whether grade 1–2 neuropathy persists at the next-cycle assessment and review previous paclitaxel reductions before applying Table 4.',['paclitaxel'],7,True)
  select('mucositis_grade','Treatment-related mucositis grade',[(n,str(n)) for n in range(5)]);num('mucositis_occurrence','Number of this mucositis occurrence','occurrence',1)
  add('CHEMO_MUCOSITIS_HOLD',f('mucositis_grade','>=',2),'withhold','Delay paclitaxel/carboplatin until mucositis recovers to grade ≤1. Restart depends on the grade of the event and occurrence history; do not prescribe while toxicity remains active.',chem,7,True)
  for grade,occ,pct in [(2,1,100),(2,2,75),(2,3,50),(3,1,50),(4,1,50)]:
   add(f'MUCOSITIS_G{grade}_N{occ}',all_(f('mucositis_grade','==',grade),f('mucositis_occurrence','==',occ)),'consultant_review',f'After recovery to grade ≤1, source restart for grade {grade}, occurrence {occ}: '+('no reduction.' if pct==100 else f'{100-pct}% reduction of paclitaxel/carboplatin.')+' Reconcile earlier reductions and consultant prescription; do not calculate a definitive current dose.',chem,7,True)
  add('MUCOSITIS_OMIT',any_(all_(f('mucositis_grade','==',2),f('mucositis_occurrence','>=',4)),all_(f('mucositis_grade','>=',3),f('mucositis_occurrence','>=',2))),'omit','Fourth occurrence of grade 2 mucositis or second occurrence of grade 3–4: omit paclitaxel/carboplatin according to Table 4.',chem,7,True)
  add('MUCOSITIS_MISSING_HISTORY',all_(f('mucositis_grade','>=',2),f('mucositis_occurrence','missing')),'consultant_review','Mucositis occurrence history is missing. Continue hold until recovery and obtain history before selecting a restart/omission pathway.',chem,7,True)
  add('SEVERE_NONHAEM',f('other_nonhaem_toxicity_grade','>=',3),'withhold','Hold pending urgent assessment of severe non-haematological toxicity and attribution. This source does not give a universal numerical chemotherapy reduction for every non-haematological event.',chem,7,True)
  add('PACLITAXEL_REACTION_G3',f('infusion_reaction_grade','>=',3),'consultant_review','Severe infusion reaction requires immediate management and identification of the causative infusion. Do not assume paclitaxel rechallenge; pembrolizumab has a separate grade 3–4 permanent-stop rule.',['paclitaxel'],8,True)
 # Drop inherited fields not referenced by any rule (except original portability and useful investigations).
 def fields(w):
  if 'field' in w:return {w['field']}
  return set().union(*(fields(v) for k in ['all','any'] for v in w.get(k,[])))
 used=set().union(*(fields(r['when']) for r in rules));keep=set(old['input_definitions'])|used|{'treatment_phase','current_paclitaxel_percent_original','neuropathy_persistent_after_reduction'}
 p['input_definitions']={k:v for k,v in defs.items() if k in keep};p['required_inputs']=[]
 if cis:
  p['input_definitions']=replace(p['input_definitions'],'pemetrexed/carboplatin','pemetrexed/cisplatin')
  p['input_definitions']['neuropathy_grade']['label']='Treatment-emergent neurotoxicity grade (baseline neuropathy is assessed separately)'
  for r in rules:
   if r['id']=='PEME_MUCOSITIS_MAINTENANCE':r['action']['message']='Maintenance: hold pemetrexed for grade ≥3 mucositis until baseline recovery; source restart at 50% of previous pemetrexed dose after consultant review.'
   if r['id']=='CHEMO_NEURO_G2_MAINTENANCE':r['action']['message']='Maintenance: hold pemetrexed for grade 2 neurotoxicity until baseline recovery; source pemetrexed restart at 100% of previous dose under consultant review. Cisplatin has stopped.'
   r['action']['recommendation']=r['explanation']=r['action']['message']
 for v in p['input_definitions'].values():v['required']=False
 p['rule_engine']['rules']=rules
 for phase in ['induction','maintenance']:
  pass
 p['treatment'].update(schedule_summary='Every 21 days: up to four triplet induction cycles, then '+('pembrolizumab plus pemetrexed' if cis else 'pembrolizumab alone')+' maintenance until progression/unacceptable toxicity.',phases=[{'id':'induction','active_drugs':['pembrolizumab']+chem,'maximum_cycles':4,'cycle_days':21},{'id':'maintenance','active_drugs':['pembrolizumab']+(['pemetrexed'] if cis else []),'cycle_days':21,'duration':'Until progression or unacceptable toxicity; consultant plan'}])
 p['metadata'].update(review_date='2027-12-19' if cis else '2029-05-24',source_document_pages=11 if cis else 10,source_checked_date=DATE,sactcheck_encoding_version=V,source_reconciled=True,source_reconciliation_date=DATE)
 p['metadata']['encoding_maturity'].update(level='source_reconciled_pending_independent_review',label='Source reconciled · independent clinical review pending',source_reconciled=True,audit_release=V,audit_date=DATE,scope_note='Fresh source-specific rules, attribution and phase audit; not independent consultant/pharmacy validation.')
 p['metadata']['validation'].update(rule_level_source_reconciliation_status='source_reconciled_pending_independent_clinical_and_oncology_pharmacy_validation',software_tests_completed=True,consultant_reviewed=False,oncology_pharmacy_reviewed=False,clinical_use_authorised=False)
 p['clinical_governance']['clinical_use_authorised']=False
 # Explicit regimen schedule consumed by the real dose-schedule renderer.
 p['treatment_phases']=copy.deepcopy(base['treatment_phases'])
 if cis:
  p['treatment_phases']=replace(p['treatment_phases'],'carboplatin','cisplatin')
  p['treatment_phases'][0]['administration'][2].update(dose={'value':75,'unit':'mg/m2'},notes='Over 2 hours; start 30 minutes after pemetrexed. Cycles 1–4 only. Pre/post hydration and electrolyte plan are required; local prescription governs fluids.')
 else:
  p['treatment_phases'][0]['active_drugs']=['pembrolizumab','paclitaxel','carboplatin']
  p['treatment_phases'][0]['administration'][1].update(drug='paclitaxel',dose={'value':200,'unit':'mg/m2'},notes='Over 3 hours using non-PVC container/tubing and 0.22 micrometre in-line filter; premedication required.')
  p['treatment_phases'][0]['administration'][2].update(dose={'value':6,'unit':'AUC'},notes='Over 30 minutes; cycles 1–4 only. Calvert AUC6 with GFR capped at 125 mL/min; source maximum 900 mg. Renal method and final prescription require pharmacy review.')
  p['treatment_phases'][1]['active_drugs']=['pembrolizumab'];p['treatment_phases'][1]['administration']=p['treatment_phases'][1]['administration'][:1];p['treatment_phases'][1]['duration_text']='Pembrolizumab alone until progression/unacceptable toxicity under consultant plan; no chemotherapy remains. Trial 35-cycle cap is not a universal NCCP stop rule.'
 p['supportive_care'].update(emetogenic_risk='phase_dependent',script_id=None,phase_profiles={'induction':{'level':'high','script_id':'nccp-parenteral-high' if cis else 'nccp-v8-carboplatin-v08420'},'maintenance':{'level':'low' if cis else 'minimal','script_id':'nccp-parenteral-low' if cis else 'nccp-parenteral-minimal'}},phase_specific_plan=f'patient/{code}/supportive-care.html',mapping_basis='Use the active phase: '+('cisplatin HEC induction; pemetrexed/pembrolizumab low-risk maintenance.' if cis else 'dedicated carboplatin AUC≥4 high-risk induction; pembrolizumab-alone minimal-risk maintenance.'),supportive_medications_label='NCCP NCIS V8 phase-specific antiemetics; reconcile all steroid prescriptions',validation_status='source_reconciled_pending_independent_clinical_and_pharmacy_review')
 snap=B/'research'/f'{code}-web-source-snapshot.txt';p['metadata']['source_text_snapshot_sha256']=hashlib.sha256(snap.read_bytes()).hexdigest();p['metadata']['source_retrieval_method']='Official HSE PDF via web text extraction; binary retrieval HTTP403; text snapshot hash only, not PDF hash'
 fn=next((R/'protocols/lung').glob(code+'*.json')).name;(B/'proposed'/fn).write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n');records[code]={'file':fn,'rules':len(rules),'inputs':len(p['input_definitions']),'version':p['metadata']['nccp_version'],'url':url,'source_text_snapshot_sha256':p['metadata']['source_text_snapshot_sha256']}
(B/'sources.json').write_text(json.dumps({'checked':DATE,'regimens':records,'binary_hash_available':False,'method':'Fresh official PDF web extraction; source_text_snapshot_sha256 hashes saved extraction snapshots. No PDF binary hash asserted.'},indent=2)+'\n')
print(records)
