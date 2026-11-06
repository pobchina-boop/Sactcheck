"""Current NCCP-source candidate encodings. Default writes a review copy, not checkout.
Root reviewer may pass --apply after reviewing. Only three protocol paths are touched.
"""
from pathlib import Path
import argparse,json,copy,hashlib,re
HERE=Path(__file__).resolve().parent
ap=argparse.ArgumentParser();ap.add_argument('--repo',default='/workspace/scratch/bca730129437/Sactcheck');ap.add_argument('--out');ap.add_argument('--apply',action='store_true');args=ap.parse_args()
R=Path(args.repo);OUT=Path(args.out) if args.out else HERE/'candidate';DEST=R if args.apply else OUT
PATHS={c:str(next(p for p in (R/'protocols').rglob('*.json') if p.name.startswith(c+'-')).relative_to(R)) for c in ['00105','00535','00551']}
BASE_PATHS={c:(HERE/'protocol-before'/Path(f).name if (HERE/'protocol-before'/Path(f).name).exists() else R/f) for c,f in PATHS.items()}
BASE={c:json.loads(f.read_text()) for c,f in BASE_PATHS.items()};P=copy.deepcopy(BASE)
if args.apply:
 for c,f in PATHS.items():
  if (R/f).read_bytes()!=BASE_PATHS[c].read_bytes():raise SystemExit('Refusing to overwrite changed checkout '+f+'; review candidate and merge intentionally.')
SRC=json.loads((HERE/'source-matrix.json').read_text())
C=lambda f,o,v=None:{'field':f,'operator':o,**({'value':v} if v is not None else {})}
ALL=lambda *x:{'all':list(x)}
ANY=lambda *x:{'any':list(x)}
YES=lambda f:C(f,'==',True)
NO=lambda f:C(f,'==',False)
NT=lambda f:ANY(C(f,'missing'),NO(f))
def boolean(label):return {'label':label,'type':'boolean','required':False,'input_role':'decision','demo_value':False}
def num(label,unit=None,step=.01):return {'label':label,'type':'number','required':False,'input_role':'decision','min':0,'step':step,'demo_value':0,**({'unit':unit} if unit else {})}
def sel(label,options):return {'label':label,'type':'select','required':False,'input_role':'decision','options':[{'value':v,'label':t} for v,t in options],'demo_value':options[0][0]}
def inp(c,f,d):P[c]['input_definitions'][f]=copy.deepcopy(d)
def b(c,f,label):inp(c,f,boolean(label))
def grade(c,f,label):
 d=sel(label+' (clinician-confirmed NCCP source grade)',[(g,'Grade '+str(g)) for g in range(5)])
 d.update({'ctcae_version':'4.03' if c=='00535' else '4.0','grading_system':'NCI CTCAE','grading_source_url':P[c]['metadata']['source_url'],'assessment_guidance':'Assign the named organ-specific grade using the source-required CTCAE edition, symptoms, intervention and baseline findings; generic descriptors and an isolated laboratory ratio do not replace grading.'})
 inp(c,f,d)
def rule(c,id,w,action,msg,page):
 P[c]['rule_engine']['rules'].append({'rule_id':id,'priority':30 if action=='permanently_discontinue' else 20 if action in ['contraindicated','discontinue','withhold'] else 10,'when':w,'action':{'type':action,'components':P[c]['treatment']['drugs'],'message':msg,'recommendation':msg},'explanation':msg,'source':{'document':'NCCP '+c+' version '+SRC[c]['version'],'url':P[c]['metadata']['source_url'],'page':page,'checked_date':'2026-11-06'}})
def br(c,f,label,action,msg,page):b(c,f,label);rule(c,f.upper(),YES(f),action,msg,page)
for c in P:
 p=P[c];m=p['metadata'];s=SRC[c]
 if c=='00535':m['source_version_transition']={'from':'6b','to':'7','canonical_id_retained_for_compatibility':True,'source_date':'2026-06-29'}
 m.update({'nccp_version':s['version'],'source_document_pages':s['pages'],'source_checked_date':'2026-11-06','source_pdf_sha256':s['sha256'],'source_sha256':s['sha256'],'sactcheck_encoding_version':'0.84.42','clinical_audit_release':'0.84.42'})
 if s.get('last_reviewed'):m['source_document_date']=s['last_reviewed']
 m['validation'].update({'source_document_checked':True,'rule_level_source_reconciliation_status':'source_reconciled_pending_independent_clinical_and_oncology_pharmacy_validation','consultant_reviewed':False,'oncology_pharmacy_reviewed':False,'clinical_use_authorised':False,'audit_release':'0.84.42'})
 m['encoding_maturity']={'level':'source_reconciled_pending_independent_review','label':'Current NCCP source reconciled; independent clinical/pharmacy approval pending','source_reconciled':True,'consultant_reviewed':False,'oncology_pharmacy_reviewed':False,'clinical_use_authorised':False,'audit_release':'0.84.42','audit_date':'2026-11-06'}
 m['clinical_source_audit']={'release':'0.84.42','date':'2026-11-06','source_pdf_sha256':s['sha256'],'source_version':s['version'],'source_reconciled':True,'independent_clinical_review':False,'patient_ppi_review':False}
 p['required_inputs']=[]
 if c=='00551':continue
 p['rule_engine']=copy.deepcopy(BASE['00551']['rule_engine']);p['rule_engine']['rules']=[]
 p['clinical_governance']['dose_modification_note']='NCCP does not recommend dose reduction. Treatment interruption, discontinuation and an infusion-rate change are distinct actions. Restart requires documented source recovery and consultant confirmation.'
 p['output_templates']['dose_reduce']='No reduced immune-checkpoint dose is recommended by this NCCP source. Discuss treatment delay/discontinuation or the specified infusion-rate change with the consultant.'
 for f in ['non_haematological_toxicity_grade','hypersensitivity_grade']:p['input_definitions'].pop(f,None)
 for f in ['ecog','hypersensitivity','pregnancy','breastfeeding','age_years','adequate_baseline_organ_function','restart_requested','source_recovery_complete','consultant_restart_approved','renal_impairment_band','hepatic_impairment_band']:
  inp(c,f,BASE['00551']['input_definitions'][f])
 rule(c,'ECOG_OUTSIDE_RANGE',C('ecog','>',1),'consultant_review','NCCP eligibility is ECOG 0–1; resolve ECOG 2 or higher with the consultant rather than assuming eligibility.',1 if c=='00105' else 2)
 rule(c,'ADULT_INDICATION',C('age_years','<',18),'consultant_review','This NCCP indication is for adults. Do not extrapolate to a child without specialist review.',1)
 rule(c,'BASELINE_FUNCTION_UNCONFIRMED',NO('adequate_baseline_organ_function'),'consultant_review','Adequate baseline organ function is required; this source does not give universal numerical blood-count eligibility cutoffs.',1 if c=='00105' else 2)
 rule(c,'HYPERSENSITIVITY_EXCLUSION',YES('hypersensitivity'),'contraindicated','Known hypersensitivity to this medicine or an excipient is an NCCP exclusion.',1 if c=='00105' else 2)
 for f in ['tsh_miu_l','free_t4_pmol_l','cortisol_nmol_l','glucose_mmol_l']:
  inp(c,f,BASE['00551']['input_definitions'][f]);p['input_definitions'][f]['input_role']='context'
  rule(c,'LAB_CONTEXT_'+f.upper(),C(f,'exists'),'consultant_review','Interpret this laboratory result with baseline, symptoms and organ-specific grade; it alone does not establish a dose modification.',2 if c=='00105' else '2–5')
 rule(c,'RESTART_UNCONFIRMED',ALL(YES('restart_requested'),ANY(NT('source_recovery_complete'),NT('consultant_restart_approved'))),'withhold','Do not restart until the source-specific recovery criteria and consultant decision are confirmed. A recovery flag does not override permanent-stop criteria.', '3–4' if c=='00105' else '3–6')
 for f in ['renal_impairment_band','hepatic_impairment_band']:
  rule(c,'BASELINE_'+f.upper(),C(f,'in',['mild','moderate','severe','haemodialysis'] if f.startswith('renal') else ['mild','moderate','severe']),'consultant_review','Baseline organ impairment does not require a routine dose reduction under this NCCP table; distinguish new immune toxicity and assess suitability. Severe impairment/dialysis recommendations may be based on expected pharmacokinetics.',4 if c=='00105' else 3)

# Ipilimumab monotherapy: source tables 1–3, not a generic PD-1 algorithm.
c='00105';p=P[c]
for f,label in [('hiv_hepatitis_b_c','HIV, hepatitis B or hepatitis C'),('uncontrolled_brain_metastases','Uncontrolled brain metastases'),('autoimmune_disease','History of autoimmune disease including IBD, SLE or Guillain–Barré'),('high_dose_steroids_or_other_immunosuppression','Concomitant high-dose systemic steroids or other immunosuppression')]:br(c,f,label,'consultant_review',label+' is an NCCP caution requiring individual review.',2)
for f in ['pregnancy','breastfeeding']:rule(c,f.upper()+'_SOURCE_REVIEW',YES(f),'consultant_review','This NCCP PDF does not list '+f+' as an absolute exclusion. Consult the current SmPC and specialist risk/benefit guidance; this result does not authorise treatment.', '1,5')
for f,label in [('diarrhoea_colitis_grade','Immune diarrhoea/colitis'),('hepatitis_grade','Immune AST/ALT/bilirubin elevation'),('rash_grade','Immune rash'),('pruritus_grade','Pruritus'),('neuropathy_grade','Unexplained motor/sensory neuropathy'),('endocrine_grade','Thyroid/pituitary or other gland toxicity'),('diabetes_grade','Immune diabetes'),('eye_immune_grade','Immune-related eye disorder'),('pneumonitis_grade','Immune pneumonitis'),('nephritis_grade','Immune nephritis'),('pancreatitis_grade','Immune pancreatitis'),('myocarditis_grade','Immune myocarditis'),('other_immune_grade','Other immune event, excluding separately entered endocrine/eye/diabetes')]:grade(c,f,label)
for f,label in [('colitis_uncontrolled','Grade2 diarrhoea/colitis not controlled by medical management'),('colitis_persistent_5_7_days','Grade2 diarrhoea/colitis meets source persistent 5–7 day criterion'),('colitis_recurrent','Grade2 diarrhoea/colitis recurs'),('widespread_intense_pruritus','Widespread or intense pruritus'),('endocrine_controlled_hormone_replacement','Severe endocrinopathy adequately controlled with hormone replacement'),('eye_not_responding_topical','Eye disorder not responding to topical immunosuppressive therapy')]:b(c,f,label)
qual=ANY(YES('colitis_uncontrolled'),YES('colitis_persistent_5_7_days'),YES('colitis_recurrent'))
rule(c,'IPI_COLITIS_G2_HOLD',ALL(C('diarrhoea_colitis_grade','==',2),qual),'withhold','Grade2 diarrhoea/colitis uncontrolled, persistent in the source 5–7 day window, or recurrent: omit until grade0–1/baseline. Do not substitute an arbitrary universal duration cutoff.',3)
rule(c,'IPI_COLITIS_G2_REVIEW',ALL(C('diarrhoea_colitis_grade','==',2),NT('colitis_uncontrolled'),NT('colitis_persistent_5_7_days'),NT('colitis_recurrent')),'consultant_review','Grade2 diarrhoea/colitis needs assessment of control, persistence (source 5–7 days) and recurrence; missing contextual answers do not establish safe continuation.',3)
for f in ['diarrhoea_colitis_grade','hepatitis_grade','neuropathy_grade','pneumonitis_grade','nephritis_grade','pancreatitis_grade','myocarditis_grade','other_immune_grade']:
 rule(c,'IPI_'+f.upper()+'_STOP',C(f,'>=',3),'permanently_discontinue','This organ-specific grade3–4 immune reaction permanently discontinues ipilimumab under NCCP Table2. Controlled severe endocrinopathy is handled separately.', '3–4')
for f in ['hepatitis_grade','pneumonitis_grade','nephritis_grade','pancreatitis_grade','myocarditis_grade','other_immune_grade']:
 rule(c,'IPI_'+f.upper()+'_HOLD',C(f,'==',2),'withhold','Moderate immune reaction: omit until grade0–1/baseline and follow the source recovery/restart sequence.', '3–4')
rule(c,'IPI_RASH_HOLD',C('rash_grade','==',3),'withhold','Grade3 rash: omit until grade0–1 or baseline.',3)
rule(c,'IPI_RASH_STOP',C('rash_grade','==',4),'permanently_discontinue','Grade4 rash: permanently discontinue ipilimumab.',3)
rule(c,'IPI_PRURITUS_HOLD',YES('widespread_intense_pruritus'),'withhold','Widespread/intense pruritus: omit and assess severity; grade3 pruritus requires permanent discontinuation.',3)
rule(c,'IPI_PRURITUS_STOP',C('pruritus_grade','>=',3),'permanently_discontinue','Grade3 severe widespread pruritus requires permanent discontinuation; do not handle it as grade3 rash.',3)
br(c,'sjs_ten_confirmed','Confirmed SJS/TEN or life-threatening skin eruption','permanently_discontinue','Life-threatening skin eruption including SJS/TEN: permanently discontinue and obtain urgent specialist assessment.',3)
br(c,'sjs_ten_suspected','Suspected severe blistering skin reaction/SJS/TEN','withhold','Withhold and urgently establish skin severity and diagnosis; confirmed life-threatening rash/SJS/TEN requires permanent discontinuation.', '3 Table2 and4 footnote c')
inp(c,'neuropathy_days',num('Duration of grade2 unexplained neurological symptoms','days'))
rule(c,'IPI_NEUROPATHY_HOLD',ALL(C('neuropathy_grade','==',2),C('neuropathy_days','>',4)),'withhold','Grade2 unexplained neurological toxicity persisting more than4days: omit and obtain specialist review.',3)
rule(c,'IPI_NEUROPATHY_CONTEXT',ALL(C('neuropathy_grade','==',2),ANY(C('neuropathy_days','missing'),C('neuropathy_days','<=',4))),'consultant_review','Clarify motor versus sensory neuropathy, weakness and persistence. Source Table1 includes a >4day duration qualifier; the text does not safely establish continuation from a short duration alone.',3)
rule(c,'IPI_ENDOCRINE_HOLD',ALL(C('endocrine_grade','>=',3),NT('endocrine_controlled_hormone_replacement')),'withhold','Severe uncontrolled endocrine toxicity: omit until controlled. Missing control status is not evidence of adequate hormone replacement.',3)
rule(c,'IPI_ENDOCRINE_CONTROLLED',ALL(C('endocrine_grade','>=',3),YES('endocrine_controlled_hormone_replacement')),'consultant_review','Severe grade3–4 endocrinopathy controlled by hormone replacement may remain on therapy under the NCCP exception; consultant confirmation is required.', '4 Table2 footnote d')
rule(c,'IPI_DIABETES_STOP',C('diabetes_grade','==',4),'permanently_discontinue','Grade4 diabetes permanently discontinues ipilimumab; do not apply the controlled-gland exception to this explicit stop criterion.',4)
rule(c,'IPI_DIABETES_REVIEW',C('diabetes_grade','in',[1,2,3]),'consultant_review','Assess diabetes urgently with the appropriate endocrine pathway; Table2 explicitly mandates permanent discontinuation at grade4 and does not prescribe an automatic grade1–3 dose decision.',4)
rule(c,'IPI_EYE_STOP',ALL(C('eye_immune_grade','>=',2),YES('eye_not_responding_topical')),'permanently_discontinue','Grade≥2 immune eye disorder not responding to topical immunosuppressive therapy: permanently discontinue.',4)
rule(c,'IPI_EYE_HOLD',ALL(C('eye_immune_grade','==',2),NO('eye_not_responding_topical')),'withhold','Moderate immune eye disorder: omit and obtain specialist management; a nonresponding ≥grade2 disorder requires permanent discontinuation.', '3–4')
rule(c,'IPI_EYE_SEVERE_RESPONDING',ALL(C('eye_immune_grade','>=',3),NO('eye_not_responding_topical')),'consultant_review','Severe eye inflammation needs urgent ophthalmology/consultant review. Resolve the general severe immune-event stop instruction against the eye-specific response qualifier; topical response alone must not authorise treatment.',4)
rule(c,'IPI_EYE_CONTEXT',ALL(C('eye_immune_grade','>=',2),C('eye_not_responding_topical','missing')),'consultant_review','Confirm response to topical immunosuppressive therapy; NCCP requires permanent discontinuation for ≥grade2 nonresponding immune eye disorders.',4)
b(c,'myocarditis_or_neurological_red_flags','New cardiac or neurological red-flag symptoms');b(c,'new_endocrine_symptoms','New endocrine symptoms')
rule(c,'IPI_CARDIONEURO_RED_FLAGS',YES('myocarditis_or_neurological_red_flags'),'withhold','Withhold pending urgent assessment of potentially serious immune myocarditis/neurological toxicity. Establish the organ-specific grade without waiting to act on red flags.', '3–4')
rule(c,'IPI_ENDOCRINE_SYMPTOMS',YES('new_endocrine_symptoms'),'consultant_review','New endocrine symptoms require urgent symptom-directed assessment; endocrine bloods must not be assumed normal if omitted.',2)
for f in ['alt_ast_uln_multiple','bilirubin_uln_multiple','creatinine_ratio_baseline_or_uln']:
 p['input_definitions'][f]['input_role']='context'
 rule(c,'IPI_LAB_CONTEXT_'+f.upper(),C(f,'exists'),'consultant_review','NCCP ipilimumab uses clinician-assigned source grades rather than a generic isolated laboratory-ratio stop/hold rule. Confirm baseline, cause and grade.', '3–4')
inp(c,'cycle_number',num('Planned ipilimumab dose number',step=1));inp(c,'weeks_since_first_dose',num('Weeks since first ipilimumab dose','weeks'))
rule(c,'IPI_FOUR_DOSE_LIMIT',C('cycle_number','>',4),'withhold','Do not administer more than four induction doses; no automatic fifth dose or ongoing maintenance is specified.', '1,4')
rule(c,'IPI_SIXTEEN_WEEK_LIMIT',C('weeks_since_first_dose','>',16),'discontinue','The source permits completing four doses only within16weeks from the first dose, whichever occurs earlier; do not extend the course beyond this window.', '4 Table1 footnote b')
rule(c,'IPI_SIXTEEN_WEEK_BOUNDARY',C('weeks_since_first_dose','==',16),'consultant_review','At the16week course limit, confirm the exact first-dose date and authorised final treatment timing; this boundary does not automatically authorise another dose.',4)
br(c,'source_recovery_failed','Source grade0–1/baseline recovery does not occur after withholding','discontinue','NCCP Table1 directs discontinuation when grade0–1/baseline recovery does not occur; do not repeatedly restart without recovery.',3)
p['treatment'].update({'schedule_summary':'Ipilimumab3mg/kg IV over90minutes every21days for up to4doses. Complete the four-dose induction as tolerated; source footnote limits completion to16weeks fromfirstdose. New lesions/growth alone are not an automatic discontinuation instruction; consultant response assessment follows induction.','duration_text':'Up to4doses, completed within16weeks fromfirstdose, whichever occurs earlier.','administration':[{'drug':'ipilimumab','dose':'3 mg/kg','route':'IV','days':[1],'note':'Infuse over90minutes; vital signs every30minutes during infusion and for1hour afterwards.'}]})
p['monitoring']={'baseline':['FBC','renal profile','liver profile','blood glucose','TFTs'],'before_each_cycle':['FBC','renal profile','liver profile','blood glucose','TFTs'],'disease_monitoring':'Consultant treatment plan; source response assessment after induction. No universal scan interval specified.'}
p['supportive_care'].update({'emetogenic_risk':'low','script_id':'nccp-parenteral-low','mapping_basis':'NCCP00105 v7 p4 and NCCP antiemetic classification v6 Table7 p12 both classify ipilimumab as low.','premedication':'Not usually required; paracetamol and antihistamine may be considered after mild/moderate infusion reactions.','supportive_medications_label':'NCCP antiemetic guidance for low emetogenic risk'})

# Avelumab: complete v7, including exact open/closed laboratory and temporal boundaries.
c='00535';p=P[c]
for f,label in [('organ_transplant','History of organ transplant'),('pregnancy','Pregnancy'),('breastfeeding','Breastfeeding')]:br(c,f,label,'contraindicated',label+' is an NCCP exclusion.',2)
for f,label in [('other_immunosuppression','Other systemic immunosuppression'),('symptomatic_cns_metastases','Symptomatic CNS metastases'),('active_significant_infection','Active clinically significant infection requiring treatment'),('prior_pd1_pdl1','Prior anti-PD-1/PD-L1 therapy')]:br(c,f,label,'consultant_review','Review '+label.lower()+' under source cautions/current NCCP prior-treatment guidance; do not assume treatment is authorised.',2)
inp(c,'prednisolone_equivalent_mg_day',num('Systemic prednisolone-equivalent dose, excluding inhaled/topical','mg/day'))
rule(c,'AVELUMAB_STEROID_CAUTION',C('prednisolone_equivalent_mg_day','>',10),'consultant_review','Systemic immunosuppressive corticosteroid dose >10mg/day prednisolone-equivalent is an NCCP caution.',2)
inp(c,'indication_id',sel('Selected NCCP indication',[('00535-gu','Urothelial maintenance (NCCP00535b)'),('00535a','Previously chemotherapy-treated metastatic Merkel cell cancer (NCCP00535a)')]))
inp(c,'mcc_previous_metastatic_chemo_lines',num('Previous chemotherapy lines for metastatic Merkel cell cancer',step=1));b(c,'mcc_histology_metastatic_confirmed','Histologically proven metastatic Merkel cell carcinoma confirmed')
inp(c,'weeks_since_platinum_completion',num('Weeks since completing platinum chemotherapy, at avelumab initiation','weeks'))
b(c,'uc_histology_advanced_confirmed','Histologically confirmed unresectable locallyadvanced/metastatic transitional-cell urothelial cancer');b(c,'uc_progression_free_after_platinum','Progression-free after platinum chemotherapy');b(c,'starting_avelumab','First avelumab treatment/initiation being assessed')
mcc=C('indication_id','==','00535a');uc=C('indication_id','==','00535-gu')
rule(c,'MCC_PRIOR_CHEMOTHERAPY',ALL(mcc,C('mcc_previous_metastatic_chemo_lines','<',1)),'consultant_review','The NCCP Merkel-cell indication requires at least one previous chemotherapy line for metastatic disease.',1)
rule(c,'MCC_HISTOLOGY',ALL(mcc,NO('mcc_histology_metastatic_confirmed')),'consultant_review','NCCP requires histologically proven metastatic Merkel cell carcinoma.',2)
rule(c,'MCC_START_CONTEXT',ALL(mcc,YES('starting_avelumab'),ANY(C('mcc_previous_metastatic_chemo_lines','missing'),NT('mcc_histology_metastatic_confirmed'))),'consultant_review','Confirm prior chemotherapy for metastatic disease and histologically confirmed metastatic Merkel cell cancer before initiation.', '1–2')
for f in ['uc_histology_advanced_confirmed','uc_progression_free_after_platinum']:rule(c,'UC_'+f.upper(),ALL(uc,NO(f)),'consultant_review','The selected urothelial maintenance requirement is not met; confirm histology/disease setting and absence of progression after platinum.', '1–2')
rule(c,'UC_PLATINUM_WINDOW',ALL(uc,YES('starting_avelumab'),ANY(C('weeks_since_platinum_completion','<',4),C('weeks_since_platinum_completion','>',10))),'consultant_review','Urothelial first-line maintenance eligibility specifies completed platinum chemotherapy within4–10weeks. This is an initiation window, not an every-cycle restriction.',2)
rule(c,'UC_START_CONTEXT',ALL(uc,YES('starting_avelumab'),ANY(C('weeks_since_platinum_completion','missing'),NT('uc_histology_advanced_confirmed'),NT('uc_progression_free_after_platinum'))),'consultant_review','Confirm urothelial histology/advanced setting, no progression after platinum and initiation within4–10weeks.', '1–2')
for f,label in [('pneumonitis_grade','Immune pneumonitis'),('diarrhoea_colitis_grade','Immune diarrhoea/colitis'),('rash_grade','Immune rash'),('hepatitis_grade','Immune hepatitis'),('nephritis_grade','Immune nephritis/renal dysfunction'),('thyroid_grade','Immune hypo/hyperthyroidism'),('adrenal_grade','Adrenal insufficiency'),('hyperglycaemia_grade','Hyperglycaemia'),('other_immune_grade','Other immune reaction, excluding separately entered endocrine toxicities'),('infusion_reaction_grade','Infusion-related reaction')]:grade(c,f,label)
for f,label in [('recurrent_grade2_pneumonitis','Recurrent grade2 pneumonitis'),('recurrent_grade3_colitis','Recurrent grade3 colitis'),('recurrent_grade3_rash','Recurrent grade3 rash'),('sjs_ten_confirmed','Confirmed SJS/TEN'),('pancreatitis_suspected','Suspected immune pancreatitis'),('pancreatitis_confirmed','Confirmed immune pancreatitis'),('myocarditis_suspected','Suspected immune myocarditis'),('myocarditis_confirmed','Confirmed immune myocarditis'),('adrenal_symptoms','Symptoms attributable to adrenal insufficiency'),('other_grade3_recurrent','Recurrent grade3 other immune reaction'),('immune_life_threatening','Life-threatening immune reaction, excluding controlled endocrine replacement'),('avelumab_immune_hepatitis_assessed','Liver result assessed as immune hepatitis after excluding other causes'),('avelumab_immune_nephritis_assessed','Creatinine elevation assessed as immune nephritis/renal dysfunction'),('metabolic_control_on_insulin','Metabolic control achieved on insulin replacement')]:b(c,f,label)
for f,hold,stop,page in [('pneumonitis_grade',[2],[3,4],'3–4'),('diarrhoea_colitis_grade',[2,3],[4],4),('rash_grade',[3],[4],5),('hepatitis_grade',[2],[3,4],4),('nephritis_grade',[2,3],[4],5),('other_immune_grade',[2,3],[4],5)]:
 rule(c,'AVE_'+f.upper()+'_HOLD',C(f,'in',hold),'withhold','Withhold avelumab until this immune reaction recovers tograde0–1; institute source-directed specialist management.',page)
 rule(c,'AVE_'+f.upper()+'_STOP',C(f,'in',stop),'permanently_discontinue','Permanently discontinue avelumab for this source-specific grade; recovery does not remove the stop criterion.',page)
for f in ['recurrent_grade2_pneumonitis','recurrent_grade3_colitis','recurrent_grade3_rash','sjs_ten_confirmed','other_grade3_recurrent','immune_life_threatening']:rule(c,'AVE_'+f.upper(),YES(f),'permanently_discontinue','NCCP recurrent/severe immune-toxicity criterion: permanently discontinue avelumab.', '4–6')
for organ in ['pancreatitis','myocarditis']:
 rule(c,'AVE_'+organ.upper()+'_SUSPECTED',YES(organ+'_suspected'),'withhold','Suspected immune '+organ+': withhold until resolution and obtain prompt specialist assessment; confirmed disease requires permanent discontinuation.',4)
 rule(c,'AVE_'+organ.upper()+'_CONFIRMED',YES(organ+'_confirmed'),'permanently_discontinue','Confirmed immune '+organ+': permanently discontinue avelumab regardless of an unspecified grade.',4)
for f,lo,hi,gate,page in [('alt_ast_uln_multiple',3,5,'avelumab_immune_hepatitis_assessed',4),('bilirubin_uln_multiple',1.5,3,'avelumab_immune_hepatitis_assessed',4),('creatinine_ratio_baseline_or_uln',1.5,6,'avelumab_immune_nephritis_assessed',5)]:
 p['input_definitions'][f]['unit']='×ULN';p['input_definitions'][f]['input_role']='decision'
 if f=='creatinine_ratio_baseline_or_uln':p['input_definitions'][f]['label']='Serum creatinine divided by laboratory ULN (not baseline)'
 p['input_definitions'][f]['assessment_guidance']='Use the actual result divided by the matching local assay ULN, never by baseline. Confirm immune causation and grade; baseline organ impairment is a separate pathway.'
 rule(c,'AVE_LAB_CONTEXT_'+f.upper(),ALL(C(f,'>',lo),NT(gate)),'consultant_review','Confirm immune causation and source grade. An isolated ratio without context does not establish permanent discontinuation; use the local ULN, not baseline.',page)
 rule(c,'AVE_'+f.upper()+'_HOLD',ALL(YES(gate),C(f,'>',lo),C(f,'<=',hi)),'withhold',f'Immune-toxicity result >{lo} and ≤{hi}×ULN: withhold until grade0–1 recovery.',page)
 rule(c,'AVE_'+f.upper()+'_STOP',ALL(YES(gate),C(f,'>',hi)),'permanently_discontinue',f'Immune-toxicity result >{hi}×ULN: permanently discontinue avelumab.',page)
rule(c,'AVE_THYROID_HOLD',C('thyroid_grade','in',[3,4]),'withhold','Grade3–4 hypo/hyperthyroidism: withhold until grade0–1; treat with replacement or antithyroid medicine as appropriate. Do not apply a generic grade4 permanent-stop rule.', '4–5')
rule(c,'AVE_ADRENAL_HOLD',ALL(C('adrenal_grade','in',[3,4]),YES('adrenal_symptoms')),'withhold','Symptomatic grade3–4 adrenal insufficiency: withhold and treat, tapering corticosteroids toward≤10mg/day as directed.',5)
rule(c,'AVE_ADRENAL_CONTEXT',ALL(C('adrenal_grade','in',[3,4]),C('adrenal_symptoms','missing')),'consultant_review','Confirm whether severe adrenal insufficiency is symptomatic. Missing symptoms are not assumed absent.',5)
rule(c,'AVE_HYPERGLYCAEMIA_HOLD',C('hyperglycaemia_grade','>=',3),'withhold','Grade≥3 hyperglycaemia: withhold and treat; avelumab may resume when metabolic control is achieved on insulin replacement, subject to consultant review.',5)
b(c,'hyperglycaemia_restart_requested','Restart after immune hyperglycaemia requested')
rule(c,'AVE_GLUCOSE_RESTART',ALL(YES('hyperglycaemia_restart_requested'),NT('metabolic_control_on_insulin')),'withhold','Metabolic control on insulin replacement must be established before restart after immune hyperglycaemia.',5)
inp(c,'immune_toxicity_persistent_weeks',num('Duration of persistent grade2–3 immune adverse reaction','weeks'));inp(c,'steroid_requirement_weeks',num('Duration for which current systemic steroid dose is required for immune toxicity','weeks'));b(c,'steroids_for_immune_toxicity','Current systemic steroid requirement is for immune toxicity')
rule(c,'AVE_PERSISTENT_TWELVE_WEEKS',C('immune_toxicity_persistent_weeks','>=',12),'permanently_discontinue','Persistent grade2–3 immune toxicity for12weeks or longer requires permanent discontinuation.',6)
rule(c,'AVE_STEROID_TWELVE_WEEKS',ALL(YES('steroids_for_immune_toxicity'),C('prednisolone_equivalent_mg_day','>=',10),C('steroid_requirement_weeks','>',12)),'permanently_discontinue','Requirement for≥10mg/day prednisone-equivalent for more than12weeks requires permanent discontinuation. Note≥10mg and>12weeks; these differ from the baseline steroid caution.',6)
rule(c,'AVE_INFUSION_G1',C('infusion_reaction_grade','==',1),'proceed_with_caution','Grade1 infusion reaction: reduce infusion RATE by50% under supervision; do not reduce the total drug dose.',3)
rule(c,'AVE_INFUSION_G2',C('infusion_reaction_grade','==',2),'withhold','Grade2 infusion reaction: withhold until grade0–1 recovery, then restart infusion at50% slower rate under supervision.',3)
rule(c,'AVE_INFUSION_G3_4',C('infusion_reaction_grade','in',[3,4]),'permanently_discontinue','Grade3–4 infusion reaction: permanently discontinue avelumab.',3)
inp(c,'cycle_number',num('Avelumab infusion number',step=1));b(c,'antihistamine_premedication_confirmed','Antihistamine premedication confirmed');b(c,'paracetamol_premedication_confirmed','Paracetamol premedication confirmed')
rule(c,'AVE_FIRST_FOUR_PREMEDICATION',ALL(C('cycle_number','>=',1),C('cycle_number','<=',4),ANY(NT('antihistamine_premedication_confirmed'),NT('paracetamol_premedication_confirmed'))),'consultant_review','Antihistamine and paracetamol premedication are required for the first four infusions. Confirm both before treatment; after an uneventful fourth infusion subsequent use is clinician-directed.', '6–7')
b(c,'new_endocrine_or_neurological_symptoms','New endocrine or neurological symptoms')
rule(c,'AVE_NEW_ENDOCRINE_NEURO_SYMPTOMS',YES('new_endocrine_or_neurological_symptoms'),'consultant_review','New endocrine/neurological symptoms require prompt symptom-directed investigation and source-specific grading; omitted optional blood tests are not assumed normal.', '4–5')
p['treatment'].update({'schedule_summary':'Avelumab800mg IV over60minutes onday1 every14days until progression or unacceptable toxicity.','administration':[{'drug':'avelumab','dose':'800 mg','route':'IV','days':[1],'note':'Infuse in250mLNaCl0.9% over60minutes using0.2micrometre low-protein-binding filter.'}]})
p['monitoring']={'baseline':['FBC','renal profile','liver profile','blood glucose','TFTs'],'before_each_cycle':['FBC','renal profile','liver profile','blood glucose','TFTs'],'disease_monitoring':'According to the supervising consultant treatment plan; no universal imaging cadence specified.'}
p['supportive_care'].update({'emetogenic_risk':'minimal','premedication':'Antihistamine plus paracetamol before the first four infusions; subsequent premedication clinician discretion if fourth infusion was completed without a reaction.','premedication_source':'NCCP00535v7 pp6–7: suggested paracetamol1gPO and chlorphenamine10mgIV, at least30minutes before infusion; individual prescription/local policy required.','contraception':'Effective contraception during treatment and for at least1month after the last dose.'})
p['eligibility']=['Adults; ECOG0–1; adequate organ function.','MCC: histologically proven metastatic Merkel cell carcinoma after≥1chemotherapy line for metastatic disease.','Urothelial maintenance: histologically confirmed unresectable locallyadvanced/metastatic transitional-cell carcinoma, progression-free after platinum completed4–10weeks before initiation.']
p['exclusions']=['Hypersensitivity to avelumab/excipients; organ transplant history; pregnancy; breastfeeding.','PriorPD-1/PD-L1 therapy: consult current NCCP guidance, not a blanket automatic exclusion.']

# Shared00551: preserve context aliases and existing rules except source-confirmed adrenal recovery correction.
c='00551';p=P[c];mel=C('indication_id','==','00551b-skin')
b(c,'adrenal_stable_on_replacement','Grade2 adrenal insufficiency controlled on established hormone replacement')
for rr in p['rule_engine']['rules']:
 if rr['rule_id']=='ADRENAL_GRADE_HOLD':
  rr['when']=ALL(C('adrenal_grade','==',2),ANY(NT('adrenal_stable_on_replacement'),YES('endocrine_symptoms'),C('endocrine_symptoms','missing')))
  msg='Grade 2 adrenal insufficiency: withhold pending management and resolution. The source permits continuation on established hormone replacement when no symptoms remain; both stable replacement and symptom-free status must be confirmed for that exception.'
  rr['action'].update({'message':msg,'recommendation':msg});rr['explanation']=msg;rr['source']['checked_date']='2026-11-06'
rule(c,'SK42_ADRENAL_STABLE_REPLACEMENT',ALL(C('adrenal_grade','==',2),YES('adrenal_stable_on_replacement'),NO('endocrine_symptoms')),'consultant_review','Controlled adrenal insufficiency on established replacement without symptoms may continue under consultant direction; do not use this exception for grade3–4 disease.',8)
for f,label in [('melanoma_starting_treatment','Initiating melanoma nivolumab3/ipilimumab1 treatment'),('melanoma_advanced_confirmed','Unresectable or metastatic melanoma confirmed'),('melanoma_unlicensed_posology_consent_confirmed','Patient informed and consented for unlicensed melanoma nivo3/ipi1 posology'),('melanoma_dt_acknowledgement_confirmed','D&T committee/equivalent acknowledgement confirmed under local off-label policy'),('melanoma_braf_status_available','Melanoma baseline BRAF status available (mutation not required)')]:b(c,f,label)
rule(c,'SK42_MELANOMA_ADVANCED_INDICATION',ALL(mel,NO('melanoma_advanced_confirmed')),'consultant_review','00551 melanoma is for adult unresectable/metastatic disease. Do not transfer this dose combination to an adjuvant indication.',1)
rule(c,'SK42_MELANOMA_OFF_LABEL_GOVERNANCE',ALL(mel,ANY(NO('melanoma_unlicensed_posology_consent_confirmed'),NO('melanoma_dt_acknowledgement_confirmed'))),'consultant_review','Nivolumab3mg/kg/ipilimumab1mg/kg is an unlicensed melanoma dosing posology in Ireland. Confirm informed consent and D&T/equivalent acknowledgement under hospital policy; reimbursement does not remove this source requirement.', '13 footnote i')
rule(c,'SK42_MELANOMA_START_CONTEXT',ALL(mel,YES('melanoma_starting_treatment'),ANY(NT('melanoma_advanced_confirmed'),NT('melanoma_unlicensed_posology_consent_confirmed'),NT('melanoma_dt_acknowledgement_confirmed'),NT('melanoma_braf_status_available'))),'consultant_review','Before initiating this melanoma schedule, confirm advanced disease, off-label informed consent, local D&T/equivalent acknowledgement and baseline BRAF status. A BRAF mutation is not required for this immunotherapy regimen.', '1,5,13')
rule(c,'SK42_MELANOMA_BASELINE_BRAF',ALL(mel,NO('melanoma_braf_status_available')),'consultant_review','Baseline BRAF status is a melanoma investigation in NCCP00551. Arrange/confirm testing; do not confuse status availability with a requirement for a BRAF mutation.',5)
rule(c,'SK42_FIRST_MAINTENANCE_CONTEXT',ALL(YES('first_maintenance_dose'),ANY(C('indication_id','missing'),C('maintenance_schedule','missing'),C('days_since_last_combination','missing'))),'consultant_review','Confirm indication, formulation/schedule and time since last combination before firstmaintenance. Melanoma/RCC wait21days forq14 or42days forq28; CRC waits21days. Missing information cannot establish that a dose is due.', '1–3')
p['clinical_governance']['melanoma_unlicensed_posology']='NCCP00551p13footnotei: nivolumab3mg/kg withipilimumab1mg/kg is unlicensed melanoma dosing posology inIreland. Inform/consent patient and ensure D&T/equivalent acknowledgement under hospital policy; preserve distinction from nivolumab1/ipilimumab3 regimen00431.'

def polish(v,key=''):
 if isinstance(v,dict): return {k:polish(x,k) for k,x in v.items()}
 if isinstance(v,list): return [polish(x,key) for x in v]
 if isinstance(v,str) and key in {'message','recommendation','explanation','label','note','schedule_summary','duration_text','mapping_basis','premedication_source','contraception','melanoma_unlicensed_posology'}:
  for a,z in {'fromfirstdose':'from first dose','firstmaintenance':'first maintenance','locallyadvanced':'locally advanced','withipilimumab':'with ipilimumab','inIreland':'in Ireland','onday':'on day','in250':'in 250','using0.2':'using 0.2','NaCl0.9':'NaCl 0.9'}.items():v=v.replace(a,z)
  v=re.sub(r'(?<=[A-Za-z])(?=\d)', ' ',v);v=re.sub(r'(?<=\d)(?=[A-Za-z])', ' ',v)
  v=re.sub(r'(weeks|days|minutes|hours|doses)(?=from|after|before)',r'\1 ',v)
 return v
for code in ['00105','00535']:P[code]=polish(P[code])
for rr in P['00551']['rule_engine']['rules']:
 if rr['rule_id'] not in {r['rule_id'] for r in BASE['00551']['rule_engine']['rules']}:rr.update(polish(rr))
P['00551']['clinical_governance']=polish(P['00551']['clinical_governance'])
manifest={}
for c,p in P.items():
 f=DEST/PATHS[c];f.parent.mkdir(parents=True,exist_ok=True);f.write_text(json.dumps(p,indent=2,ensure_ascii=False)+'\n')
 manifest[c]={'path':PATHS[c],'before_sha256':hashlib.sha256(BASE_PATHS[c].read_bytes()).hexdigest(),'after_sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'before_rules':len(BASE[c]['rule_engine']['rules']),'after_rules':len(p['rule_engine']['rules']),'candidate_path':str(f)}
(HERE/'candidate-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps(manifest,indent=2))
