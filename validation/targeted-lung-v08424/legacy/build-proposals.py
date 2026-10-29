from pathlib import Path
import json,hashlib,copy,subprocess
R=Path(__file__).resolve().parents[3];H=Path(__file__).parent;DATE='2026-10-29';V='0.84.24'
U={'00382':'https://healthservice.hse.ie/documents/6348/trifluridine_and_tipiracil_Lonsurf_therapy_382.pdf','00831':'https://healthservice.hse.ie/documents/6432/831_v2a_Atezolizumab_Bevacizumab_Therapy.pdf','lonsurf':'https://www.ema.europa.eu/en/documents/product-information/lonsurf-epar-product-information_en.pdf','atezo':'https://www.ema.europa.eu/en/documents/product-information/tecentriq-epar-product-information_en.pdf','bev':'https://www.ema.europa.eu/en/documents/product-information/avastin-epar-product-information_en.pdf'}
def leaf(f,op,v):return dict(field=f,operator=op,value=v)
def allof(*v):return dict(all=list(v))
def anyof(*v):return dict(any=list(v))
def eq(f,v=True):return leaf(f,'==',v)
def number(label,maximum=1000,demo=None,**kw):return dict(label=label,type='number',required=False,min=0,max=maximum,step=.01,demo_value=demo,**({'input_role':'decision'}|kw))
def boolean(label,**kw):return dict(label=label,type='boolean',required=False,demo_value=None,**({'input_role':'decision'}|kw))
def select(label,values,**kw):return dict(label=label,type='select',required=False,options=[dict(value=a,label=b) for a,b in values],demo_value=None,**({'input_role':'decision'}|kw))
def grade(label,source,version=None):
 x=select(label,[(i,'Not present' if i==0 else f'Grade {i} — apply the named source criterion') for i in range(5)])
 x.update(grading_source_label=('NCCP 00831 Table 3: NCI-CTCAE v4.0' if version else 'NCCP source severity grade; edition not specified'),grading_source_url=source,source_grading_note='Use the named toxicity and source grading; do not substitute CTCAE v5.0 descriptions.',assessment_guidance='Document the named adverse event and apply the cited source severity criterion; grade 0 means explicitly absent, not unknown.')
 if version:x['ctcae_version']=version
 return x
def rule(id,cond,typ,text,page,components,url=None):return dict(rule_id=id,**cond,action=dict(type=typ,components=components,recommendation=text),source=dict(page=page,url=url or SRC,document='NCCP '+CODE+' v'+VER if not url else 'Supplemental current product information'),explanation=text)
def load(code,name,ver):
 global CODE,SRC,VER
 CODE=code;SRC=U[code];VER=ver
 p=json.loads(subprocess.check_output(['git','show','d17f8c486ca4cb3dce5b74833ffac7945d28b3af:protocols/gastrointestinal/'+name],cwd=R,text=True));m=p['metadata'];m.update(nccp_version=ver,source_url=SRC,source_checked_date=DATE,sactcheck_encoding_version=V,source_retrieval_method='Official current NCCP PDF retrieved via the HSE index and critical tables visually checked')
 for key in ['validation','encoding_maturity']:
  m.setdefault(key,{}).update(source_reconciled=True,consultant_reviewed=False,oncology_pharmacy_reviewed=False,clinical_use_authorised=False,review_status='Source reconciled; independent clinical and pharmacy review pending')
 m['source_pdf_sha256']=hashlib.sha256((H/'research'/f'{code}.pdf').read_bytes()).hexdigest();m['source_text_snapshot_sha256']=hashlib.sha256((H/'research'/f'{code}.txt').read_bytes()).hexdigest()
 p['required_inputs']=[];p['clinical_governance']['disclaimer']='Source reconciliation for v0.84.24 is not clinical authorisation. Confirm the current NCCP document, product information, clinical context and independent oncology/pharmacy review.'
 for d in p['input_definitions'].values():d['required']=False;d['demo_value']=None
 return p
p=load('00382','00382-trifluridine-tipiracil.json','4');d=p['input_definitions'];c=['trifluridine_tipiracil'];rr=[]
p['metadata'].update(source_pages=6,source_document_pages=6,source_page_count=6,date_last_reviewed='2026-07-01',review_schedule='As required from 01/07/2026',source_title_exact='Trifluridine and Tipiracil (Lonsurf®) Therapy',treatment_class=['cytotoxic_chemotherapy','oral_anticancer_therapy'],drug_components=['trifluridine_tipiracil'],source_version_change='NCCP v3 to v4, reviewed 01/07/2026; stable legacy protocol_id retained for compatibility.',source_version_identity='nccp-00382-v4')
p['metadata'].pop('review_date',None)
p['metadata']['regimen_short_name']='Trifluridine/tipiracil (Lonsurf) monotherapy'
p['metadata']['indication_summary']='00382a: previously treated metastatic colorectal cancer monotherapy. The separate EMA gastric monotherapy and colorectal plus bevacizumab indications are not encoded by this NCCP regimen.'
p['indications']=[dict(indication_id='00382a',description='Adults with metastatic colorectal cancer previously treated with, or unsuitable for, available fluoropyrimidine-, oxaliplatin-, irinotecan-, anti-VEGF- and anti-EGFR-based therapies.',icd10='C17–20',reimbursement='CDS 01/02/2017',source_url=SRC,source_page=1)]
p['treatment_phases']=[dict(phase_id='main_cycle',active_drugs=['trifluridine_tipiracil'],label='Cyclic oral colorectal monotherapy',cycle_length_days=28,duration='Until progression or unacceptable toxicity',administration=[dict(days=[1,2,3,4,5,8,9,10,11,12],drug='trifluridine_tipiracil',route='PO',dose=dict(value=35,unit='mg/m² per dose twice daily; trifluridine component; maximum 80 mg per dose'),note='Within 1 hour after morning and evening meals. Days 6–7 and 13–28 are tablet-free. Use the BSA tablet table, including unequal AM/PM doses at 50 mg total daily. Do not make up missed or held doses.')])]
d['assessment_type']=select('Assessment timing',[('pre_treatment','Before a new cycle / initiation'),('on_treatment','During dosing days'),('restart','Restart after interruption')],input_role='context')
d['indication_id']=select('Treatment context',[('00382a','00382a: colorectal monotherapy'),('gastric','Gastric / gastro-oesophageal junction: separate pathway'),('crc_bevacizumab','Colorectal plus bevacizumab: separate pathway')],input_role='context')
d['assessment_context']=select('Legacy assessment timing',[('start_next_cycle','Before a new cycle'),('during_cycle','During dosing days')],input_role='context')
d['additional_bevacizumab']=boolean('Bevacizumab also planned (different regimen)')
d['ecog']=number('ECOG performance status',4)
d['lonsurf_crcl_ml_min']=number('Verified creatinine clearance',300,unit='mL/min',renal_input=dict(mode='source_threshold_numeric',exact_value_required=False,source_url=SRC,reason='The product label distinguishes <15, 15 to <30 and ≥30 mL/min; retain decimals at the boundaries.'))
d['dialysis'].pop('visible',None);d['dialysis'].pop('derived_from',None)
d['crcl_ml_min']['label']='Legacy creatinine clearance band (optional compatibility input)';d['crcl_ml_min']['assessment_guidance']='Preserved legacy categories; numeric input is preferred. Do not treat CrCl, eGFR and measured GFR as interchangeable. If exact and band inputs conflict, restrictive findings remain and require reconciliation.'
d['next_cycle_delay_days']=number('Next-cycle delay caused by grade-4 count toxicity',100,unit='days')
d['nadir_anc_x10e9_l']=number('Lowest ANC from the preceding cycle',50,unit='×10⁹/L')
d['nadir_platelets_x10e9_l']=number('Lowest platelets from the preceding cycle',2000,unit='×10⁹/L')
d['grade4_neutropenia']['label']='Prior-cycle ANC below 0.5 ×10⁹/L (legacy grade-4 flag)';d['grade4_thrombocytopenia']['label']='Prior-cycle platelets below 25 ×10⁹/L (legacy grade-4 flag)'
d['nonhaem_toxicity_grade']=grade('Current clinically relevant non-haematological toxicity grade',SRC)
d['nonhaem_toxicity_kind']=select('Non-haematological toxicity',[('nausea_vomiting','Nausea / vomiting'),('diarrhoea','Diarrhoea'),('other','Other non-haematological toxicity')])
d['gi_toxicity_controlled']=boolean('Grade-3 nausea/vomiting controlled by antiemetics or diarrhoea responding to antidiarrhoeals')
d['toxicity_requiring_interruption']['assessment_guidance']='Legacy clinician-confirmed grade 3–4 non-haematological event requiring interruption, after considering source GI exceptions. This positive flag cannot be cancelled by a discordant new grade.'
d['active_infection']=boolean('Active infection or fever requiring urgent clinical assessment')
d['unresolved_prior_grade3_4_toxicity']=boolean('Unresolved grade 3–4 clinically relevant non-haematological toxicity before starting')
d['oral_schedule_uncertain']=boolean('Missed doses, vomiting, adherence or tablet schedule needs reconciliation')
def add(id,cond,typ,text,page,url=None):rr.append(rule(id,cond,typ,text,page,c,url))
add('EXCLUSION_HYPERSENSITIVITY',eq('hypersensitivity'),'contraindicated','Do not administer trifluridine/tipiracil for relevant hypersensitivity.',2)
add('PREG_LACT',anyof(eq('pregnancy'),eq('breastfeeding')),'contraindicated','Do not use the routine NCCP pathway in pregnancy or breastfeeding; urgent specialist discussion and cessation of breastfeeding are required.',2)
add('SCOPE_SEPARATE_REGIMEN',anyof(leaf('indication_id','in',['gastric','crc_bevacizumab']),eq('additional_bevacizumab')),'consultant_review','00382a is colorectal monotherapy. Gastric monotherapy and colorectal treatment with bevacizumab have separate licensed/evidence contexts; confirm the correct protocol, reimbursement and additional safety plan.',1)
add('ECOG_SCOPE',leaf('ecog','>',1),'consultant_review','NCCP eligibility is ECOG 0–1; reassess suitability outside this range.',2)
add('ANC_INTERRUPT',leaf('anc_x10e9_l','<',.5),'withhold','Interrupt oral dosing for ANC <0.5 ×10⁹/L; check infection and recovery. A new cycle requires ANC ≥1.5 ×10⁹/L.',2)
add('PLT_INTERRUPT',leaf('platelets_x10e9_l','<',50),'withhold','Interrupt oral dosing for platelets <50 ×10⁹/L; a new cycle requires platelets ≥75 ×10⁹/L.',2)
for f,lo,hi,id,txt in [('anc_x10e9_l',.5,1.5,'ANC','ANC 0.5 to <1.5 ×10⁹/L'),('platelets_x10e9_l',50,75,'PLT','platelets 50 to <75 ×10⁹/L')]:
 band=allof(leaf(f,'>=',lo),leaf(f,'<',hi))
 add(id+'_CONTEXT_REVIEW',band,'consultant_review',txt+': the new-cycle threshold differs from the on-treatment interruption threshold. Confirm timing; this isolated value does not authorise treatment or restart.',2)
 add(id+'_NEXT_CYCLE',allof(band,anyof(leaf('assessment_type','in',['pre_treatment','restart']),eq('assessment_context','start_next_cycle'))),'withhold','Do not start a new cycle or restart without recovery review: '+txt+'. New-cycle minima are ANC 1.5 and platelets 75 ×10⁹/L.',2)
add('FEBRILE_NEUTROPENIA',eq('febrile_neutropenia'),'withhold_then_reduce','Interrupt, urgently manage febrile neutropenia, and wait for recovery to grade 1/baseline plus next-cycle counts. On authorised resumption reduce the previous dose by 5 mg/m² per dose; respect the renal-specific minimum and never re-escalate.',3)
add('ACTIVE_INFECTION',eq('active_infection'),'withhold','Urgently assess/treat infection and review blood counts. Infection alone does not prove the prior febrile-neutropenia dose-reduction criterion.',7,U['lonsurf'])
prior=anyof(eq('grade4_neutropenia'),eq('grade4_thrombocytopenia'),leaf('nadir_anc_x10e9_l','<',.5),leaf('nadir_platelets_x10e9_l','<',25))
add('SEVERE_NADIR_REVIEW',prior,'consultant_review','Prior ANC <0.5 or platelets <25 ×10⁹/L: establish the resulting next-cycle delay. The source dose reduction requires more than 7 days of delay, not the low nadir alone.',3)
add('SEVERE_NADIR_DELAY_REDUCE',allof(prior,leaf('next_cycle_delay_days','>',7)),'withhold_then_reduce','After count recovery and Consultant review reduce by 5 mg/m² per dose because the severe nadir caused >7 days of next-cycle delay; do not add separate reductions for coexisting toxicities.',3)
add('SEVERE_TOX_REDUCE',eq('toxicity_requiring_interruption'),'withhold_then_reduce','For the clinician-confirmed qualifying grade 3–4 non-haematological event, interrupt to grade 1/baseline then reduce by 5 mg/m² per dose. Respect exceptions, prior dose and renal-specific minimum; no re-escalation.',4)
add('NONHAEM_GRADE_REVIEW',leaf('nonhaem_toxicity_grade','>=',3),'consultant_review','Assess severe non-haematological toxicity urgently and identify the event and treatment response. Source exceptions for controlled grade-3 GI toxicity do not establish general fitness to treat.',4)
qual=anyof(leaf('nonhaem_toxicity_grade','==',4),allof(eq('nonhaem_toxicity_grade',3),anyof(eq('nonhaem_toxicity_kind','other'),allof(leaf('nonhaem_toxicity_kind','in',['nausea_vomiting','diarrhoea']),eq('gi_toxicity_controlled',False)))))
add('NONHAEM_QUALIFYING_REDUCE',qual,'withhold_then_reduce','Interrupt qualifying non-haematological toxicity until grade 1/baseline; then Consultant-directed 5 mg/m² per-dose reduction. Grade-3 nausea/vomiting controlled by antiemetics or responsive diarrhoea is excepted; grade-4 symptoms require urgent review.',4)
add('UNRESOLVED_PRIOR_TOXICITY',eq('unresolved_prior_grade3_4_toxicity'),'withhold','Do not initiate with unresolved grade 3–4 clinically relevant non-haematological toxicity from previous therapy.',7,U['lonsurf'])
renal=anyof(allof(leaf('lonsurf_crcl_ml_min','>=',15),leaf('lonsurf_crcl_ml_min','<',30)),allof(leaf('crcl_ml_min','>=',15),leaf('crcl_ml_min','<',30)))
add('RENAL_15_29',renal,'dose_reduce','Severe renal impairment (CrCl 15 to <30): source starting level 20 mg/m² twice daily, with one permitted reduction to 15 mg/m² twice daily if needed. Confirm previous dose and use the BSA tablet table; this is not an automatic restart or escalation.',4)
add('RENAL_LT15',anyof(leaf('lonsurf_crcl_ml_min','<',15),leaf('crcl_ml_min','<',15),eq('dialysis')),'withhold','Administration is not recommended for CrCl <15 mL/min or dialysis; do not extrapolate the NCCP <30 row below the product-label studied range. Obtain specialist review.',6,U['lonsurf'])
add('RENAL_ENHANCED_MONITORING',anyof(allof(leaf('lonsurf_crcl_ml_min','>=',30),leaf('lonsurf_crcl_ml_min','<',60)),renal),'consultant_review','Moderate/severe renal impairment increases toxicity risk: arrange more frequent haematological monitoring; CrCl ≥30 alone does not require a reduced starting dose.',8,U['lonsurf'])
add('HEPATIC_MOD_SEV',anyof(leaf('hepatic_impairment','in',['moderate','severe']),leaf('bilirubin_ratio_uln','>',1.5)),'withhold','Not recommended in baseline moderate/severe hepatic impairment (SmPC NCI total bilirubin >1.5 ×ULN). Confirm baseline classification and specialist plan rather than calculate a dose.',6,U['lonsurf'])
need=anyof(eq('febrile_neutropenia'),eq('toxicity_requiring_interruption'),allof(prior,leaf('next_cycle_delay_days','>',7)),qual)
add('MINIMUM_DOSE_REVIEW',allof(need,leaf('current_dose_mg_m2_bd','in',['20','15'])),'consultant_review','A further reduction at 20 or 15 mg/m² requires reconciliation of renal category and prior reductions. Standard minimum is 20; severe-renal minimum 15. Do not calculate a lower dose, restart automatically or multiply reductions.',4)
add('ORAL_PLAN_REVIEW',eq('oral_schedule_uncertain'),'consultant_review','Reconcile the exact AM/PM tablet quantities and dosing/rest days. Do not replace missed, held or vomited doses; use the next scheduled prescribed dose after advice.',1)
p['rule_engine']['rules']=rr;p['rule_engine']['missing_data_policy']='All inputs optional. Missing assessment timing, nadir/delay, dose history or renal context remains unknown. Never issue general treatment clearance from isolated values.'
p['supportive_care']={'emetogenic_risk':'moderate_to_high','notes':['Oral moderate-to-high emetogenic risk per NCCP v4 p5; use an individual oral antiemetic plan, not automatic parenteral multi-drug chemotherapy prophylaxis.','No routine premedication specified. More frequent blood-count monitoring in moderate/severe renal impairment.','Women: highly effective contraception during and 6 months after; add barrier protection to hormonal methods. Men with partners of childbearing potential: effective contraception during and 6 months after.','Do not make up missed, held or vomited doses; take within 1 hour after morning/evening meals on prescribed dosing days only.']}
for r in rr:
 if r['action']['type'] in ['dose_reduce','withhold_then_reduce']:r['action']['dose_calculation']='specialist_review'
(H/'proposed'/p['file_name']).write_text(json.dumps(p,indent=2,ensure_ascii=False)+'\n')

p=load('00831','00831-atezolizumab-bevacizumab-hcc.json','2a');d=p['input_definitions'];rr=p['rule_engine']['rules'];both=['atezolizumab','bevacizumab'];ate=['atezolizumab'];bev=['bevacizumab']
p['metadata'].update(source_pages=13,source_document_pages=13,source_page_count=13,source_title_exact='Atezolizumab and Bevacizumab Therapy',treatment_class=['immunotherapy','antiangiogenic_therapy'],cytotoxic=False)
for f,x in list(d.items()):
 if f.endswith('_grade'):
  # NCCP Table 3 explicitly uses CTCAE 4; bevacizumab Table 6 does not specify edition.
  immune=f not in ['hypertension_grade','infection_grade','other_nonimmune_toxicity_grade']
  label=x['label'];d[f]=grade(label,SRC,'4.0' if immune else None)
for f,label in [('immune_hepatitis_suspected','Clinical assessment suspects immune-mediated hepatitis'),('immune_nephritis_suspected','Clinical assessment suspects immune-mediated nephritis'),('prior_systemic_hcc_therapy','Prior systemic therapy for advanced/unresectable HCC'),('varices_treated_or_low_risk','Screening reviewed and varices treated / no high-risk untreated varices'),('recent_variceal_bleeding','Variceal bleeding within the previous 6 months'),('persistent_grade3_hypertension','Persistent grade-3 hypertension despite management'),('nephrotic_syndrome','Nephrotic syndrome / source grade-4 proteinuria'),('gi_perforation','Confirmed gastrointestinal perforation'),('te_or_grade4_fistula','Tracheoesophageal fistula or any grade-4 fistula'),('elective_surgery_planned','Elective surgery planned'),('wound_fully_healed','Major surgical wound fully healed'),('pres_suspected','Suspected posterior reversible encephalopathy syndrome'),('recurrent_pancreatitis','Recurrent immune-mediated pancreatitis of any grade'),('facial_paresis_unresolved','Immune facial paresis has not fully resolved while atezolizumab was withheld'),('myasthenia_gbs_meningoencephalitis','Immune myasthenia / Guillain–Barré / meningoencephalitis'),('immune_toxicity_not_recovered_12weeks','Relevant immune toxicity has not recovered to grade 0–1 within 12 weeks'),('steroid_not_tapered_12weeks','Cannot reduce corticosteroids to ≤10 mg prednisolone-equivalent/day within 12 weeks'),('controlled_endocrine_exception','The grade-4/recurrent-grade-3 event is solely an endocrinopathy controlled with replacement'),('liver_decompensation','New/worsening ascites, encephalopathy or other liver decompensation')]:d[f]=boolean(label)
d['ecog']=number('ECOG performance status',4)
d['days_since_major_surgery']=number('Days since major surgery',10000,unit='days')
d['urine_protein_g_l']=number('Laboratory urinalysis protein concentration (not 24-hour amount)',100,unit='g/L')
d['crcl_ml_min']=number('Verified creatinine clearance',300,unit='mL/min',renal_input=dict(mode='source_threshold_numeric',exact_value_required=False,source_url=SRC,reason='NCCP organ-impairment row distinguishes CrCl ≥30 and <30; no numeric dose reduction is specified.'))
d['haemodialysis']=boolean('Receiving haemodialysis')
for f,label in [('haemorrhage_grade','Bevacizumab-related haemorrhage grade'),('venous_thromboembolism_grade','Venous thromboembolism grade')]:d[f]=grade(label,U['bev']);d[f]['grading_source_label']='Avastin SmPC: NCI-CTCAE v3.0';d[f]['ctcae_version']='3.0'
for f,label in [('hypophysitis_grade','Immune hypophysitis grade'),('facial_paresis_grade','Immune facial paresis grade'),('myelitis_grade','Immune myelitis grade')]:d[f]=grade(label,SRC,'4.0')
d['baseline_alt_ast_category']['options'].append(dict(value='gt5',label='>5 ×ULN: not covered by HCC baseline table'))
d['baseline_alt_ast_category']['assessment_guidance']='Use the appropriate pretreatment baseline for the affected transaminase. If AST and ALT had different baseline categories, review separately; the combined highest-value entry cannot pair different enzymes safely.'
d['liver_enzyme_pairing_uncertain']=boolean('Current highest ALT/AST cannot be paired confidently with its own baseline category')
d['rash_grade_2_over_one_week']['input_role']='monitoring';d['rash_grade_2_over_one_week']['help']='Preserved legacy monitoring input. NCCP 00831 does not specify a separate automatic hold solely for grade-2 rash lasting one week.'
d['gi_perforation_or_fistula']['help']='Legacy broad flag. Specify confirmed GI perforation or tracheoesophageal/grade-4 fistula separately; do not automatically permanently stop for every fistula.'
d['serious_neurological_irae_grade']['assessment_guidance']='Legacy broad syndrome flag. Specify the syndrome: any-grade myasthenia, Guillain–Barré or meningoencephalitis, grade≥2 myelitis and facial paresis have distinct rules. This unspecified field cannot select a permanent-stop syndrome.'
d['infusion_reaction_grade']['label']='Atezolizumab infusion- or subcutaneous-related reaction grade'
d['alt_ast_uln_multiple']['assessment_guidance']='Abnormal liver enzymes in HCC may reflect cirrhosis, progression, obstruction, infection or immune toxicity. A lab result alone does not diagnose immune hepatitis; establish cause and the matching baseline.'
d['creatinine_ratio_baseline_or_uln']['assessment_guidance']='A creatinine rise requires cause assessment (including dehydration, obstruction, HCC-related kidney disease, bevacizumab injury and immune nephritis). This ratio alone does not establish immune causation.'
page_map={'EXCLUSION':3,'PREGNANCY':3,'ACTIVE_INFECTION':3,'FBC':4,'PNEUMONITIS':5,'COLITIS':6,'THYROID':6,'ADRENAL':6,'ENDOCRINE':6,'IMMUNE_DIABETES':6,'SCAR':7,'RASH':7,'PANCREATITIS':7,'MYOCARDITIS':8,'NEPHRITIS':8,'MYOSITIS':8,'SERIOUS_NEURO':7,'PERICARDIAL':8,'SUSPECTED_HLH':8,'OTHER_IMMUNE':8,'RECURRENT_G3':8,'INFUSION':9,'CHILD':2,'VARICES':4,'HCC_HEPATITIS':5,'BEV_HTN':11,'BEV_UNCONTROLLED':11,'PROTEIN':10,'BEV_SURGERY':6,'BEV_ACTIVE':11,'BEV_PERFORATION':11,'BEV_ARTERIAL':7}
for r in rr:
 id=r['rule_id'];page=next((v for k,v in page_map.items() if id.startswith(k)),1);r['source']={'url':SRC,'page':page,'document':'NCCP 00831 v2a'}
 if id in ['EXCLUSION_HYPERSENSITIVITY','PREGNANCY_OR_BREASTFEEDING_REVIEW','FBC_ABNORMALITY_REVIEW']:r['action']['components']=both
 if id=='EXCLUSION_HYPERSENSITIVITY':r['action']['recommendation']='Do not administer the combination for relevant medicine/excipient or CHO-product hypersensitivity; identify the culprit and review alternatives.'
 if id=='PREGNANCY_OR_BREASTFEEDING_REVIEW':r['action'].update(type='contraindicated',recommendation='Pregnancy/lactation are NCCP exclusions; do not administer the routine combination and seek urgent specialist review.')
 if id=='FBC_ABNORMALITY_REVIEW':r['action']['recommendation']='Review blood-count abnormality in the HCC clinical context; NCCP 00831 has no universal ANC/platelet numeric hold table. Assess bleeding, infection and liver disease.'
 if id=='VARICES_SCREEN_NOT_COMPLETED':r['action'].update(type='withhold',recommendation='Do not start bevacizumab until oesophageal-varices screening and any required management are completed/reviewed. Screening alone is not confirmation of acceptable bleeding risk.')
 if id.startswith('HCC_HEPATITIS') or id.startswith('NEPHRITIS'):
  cond={k:r.pop(k) for k in list(r) if k in ['all','any','field','operator','value']}
  r.update(all=[cond,eq('immune_hepatitis_suspected' if id.startswith('HCC') else 'immune_nephritis_suspected')])
  if id.startswith('HCC_HEPATITIS_WITHHOLD'):r['all'].append(eq('liver_enzyme_pairing_uncertain',False))
 if id=='BEV_HTN_G2_G3':r['action']['type']='consultant_review'
 if id=='BEV_ACTIVE_BLEEDING':r['action'].update(type='withhold',recommendation='Withhold bevacizumab and urgently assess active significant bleeding. Establish severity; permanent discontinuation is specified for grade 3–4 bleeding, not an unspecified positive flag alone.')
 if id=='BEV_PERFORATION_FISTULA':r['action'].update(type='withhold',recommendation='Withhold bevacizumab and urgently identify the event. Confirmed GI perforation, TE fistula or any grade-4 fistula requires discontinuation; other fistulae need individual review.')
 if id=='SERIOUS_NEUROLOGICAL_IRAE':
  r['value']=1;r['action'].update(type='withhold',recommendation='Urgently assess the exact neurological immune syndrome. Hold atezolizumab pending clarification; separate syndrome-specific permanent-stop rules apply.')
 if id=='PANCREATITIS_G4':
  r.pop('field');r.pop('operator');r.pop('value');r['any']=[leaf('pancreatitis_grade','>=',4),eq('recurrent_pancreatitis')]
 if id=='PANCREATITIS_WITHHOLD':r['action']['recommendation']='Withhold atezolizumab for source grade 2–3 pancreatitis or amylase/lipase >2 ×ULN; investigate the cause. An isolated enzyme value does not itself diagnose pancreatitis.'
 if id=='SCAR_CONFIRMED':r['action']['recommendation']='Permanently discontinue atezolizumab for confirmed SJS/TEN. Urgently assess other severe skin reactions under their named diagnosis.'
 if id in ['OTHER_IMMUNE_G4','RECURRENT_G3_IMMUNE']:
  cond={k:r.pop(k) for k in list(r) if k in ['all','any','field','operator','value']};r['all']=[cond,eq('controlled_endocrine_exception',False)]
 if id=='ENDOCRINE_CONTROLLED_REPLACEMENT':r['action']['type']='consultant_review'
 if id=='INFUSION_REACTION_G1_G2':r['action'].update(type='withhold',recommendation='Interrupt or reduce the IV infusion rate and manage the reaction; resume only after resolution and review. For SC treatment interrupt and assess rather than invent an IV rate adjustment.')
 if id=='BEV_SURGERY_WOUND':r['source']={'url':U['bev'],'page':6,'document':'Avastin SmPC section 4.4'}
 if id=='BEV_ARTERIAL_EVENT':r['source']={'url':U['bev'],'page':7,'document':'Avastin SmPC section 4.4'}
 r['explanation']=r['action']['recommendation']
 # Complete source restart conditions as advice, never an automatic restart.
 if r['action']['type']=='withhold' and id.startswith(('PNEUMONITIS','COLITIS','HCC_HEPATITIS','NEPHRITIS','RASH','SCAR_SUSPECTED','MYOSITIS','OTHER_IMMUNE')):
  r['action']['recommendation']+=' Consider restart only after the source-specific recovery criteria (usually grade 0–1 within 12 weeks and prednisolone-equivalent ≤10 mg/day) and Consultant review; some events require permanent cessation.'
def add(id,cond,typ,text,page,components=both,url=None):rr.append(rule(id,cond,typ,text,page,components,url))
add('PRIOR_SYSTEMIC_HCC',eq('prior_systemic_hcc_therapy'),'contraindicated','Prior systemic therapy for advanced/unresectable HCC is excluded from this NCCP first-line regimen.',3)
add('ECOG_SCOPE',leaf('ecog','>',1),'consultant_review','NCCP eligibility is ECOG 0–1; review suitability outside this range.',2)
add('VARICES_RISK_NOT_CONTROLLED',eq('varices_treated_or_low_risk',False),'withhold','Do not start bevacizumab with untreated or incompletely managed high-risk varices. Arrange specialist evaluation and treatment of bleeding risk.',17,bev,U['atezo'])
add('RECENT_VARICEAL_BLEED',eq('recent_variceal_bleeding'),'withhold','Recent variceal bleeding requires specialist review before bevacizumab; IMbrave150 excluded variceal bleeding within 6 months. Do not treat this study criterion as automatic lifelong ineligibility.',60,bev,U['atezo'])
add('LIVER_DECOMPENSATION',eq('liver_decompensation'),'withhold','Withhold pending urgent HCC/hepatology review of worsening liver disease. Distinguish decompensation, infection, progression and immune hepatitis; do not infer the cause from enzymes alone.',2)
add('LIVER_RESULTS_CAUSE_REVIEW',anyof(leaf('alt_ast_uln_multiple','>',3),leaf('bilirubin_uln_multiple','>',1.5)),'consultant_review','Abnormal liver results need comparison with pretreatment values and cause assessment. Underlying HCC/cirrhosis is not automatically immune hepatitis; no permanent immune-stop decision is made from these values alone.',5)
add('SEVERE_LIVER_RESULTS_HOLD',anyof(leaf('alt_ast_uln_multiple','>',10),leaf('bilirubin_uln_multiple','>',3)),'withhold','Marked liver abnormalities require urgent assessment and withholding pending cause review. If immune hepatitis is clinically suspected, apply the HCC permanent-stop rule; otherwise manage the established cause.',5,ate)
add('BASELINE_LIVER_OUTSIDE_TABLE',anyof(eq('baseline_alt_ast_category','gt5'),eq('liver_enzyme_pairing_uncertain')),'consultant_review','Baseline >5 ×ULN or uncertain pairing of current AST/ALT with its own baseline is outside safe automated HCC table interpretation; assess individual enzymes and the clinical cause.',5,ate)
add('RENAL_RISE_CAUSE_REVIEW',leaf('creatinine_ratio_baseline_or_uln','>',1.5),'withhold','Withhold atezolizumab pending timely kidney assessment. A creatinine rise alone does not establish immune nephritis; evaluate hydration, obstruction, liver disease and bevacizumab-associated renal injury.',8,ate)
add('SEVERE_RENAL_IMPAIRMENT_REVIEW',anyof(leaf('crcl_ml_min','<',30),eq('haemodialysis')),'consultant_review','NCCP Table 4 expects no renal dose adjustment, including dialysis, but product data in severe impairment are limited. Obtain an individual specialist plan; do not apply cytotoxic percentage reductions or diagnose immune nephritis.',9)
add('BEV_HTN_PERSISTENT_G3',eq('persistent_grade3_hypertension'),'discontinue','Discontinue bevacizumab for persistent grade-3 hypertension despite management; treat the hypertension and assess urgently if symptomatic.',11,bev)
add('PROTEIN_DIPSTICK_FOLLOWUP',anyof(leaf('proteinuria_dipstick','in',['2+','3+']),leaf('urine_protein_g_l','>=',1)),'consultant_review','NCCP allows the scheduled bevacizumab dose on isolated 2+/3+ dipstick or protein ≥1 g/L, with 24-hour protein collection within 3 days before the next dose. Review quantified results and other risks; this is not whole-regimen clearance.',10,bev)
add('NEPHROTIC_SYNDROME',eq('nephrotic_syndrome'),'permanently_discontinue','Permanently discontinue bevacizumab for nephrotic syndrome/source grade-4 proteinuria and obtain renal assessment.',7,bev,U['bev'])
add('BEV_BLEED_G3_G4',leaf('haemorrhage_grade','>=',3),'permanently_discontinue','Permanently discontinue bevacizumab for grade 3–4 haemorrhage; provide urgent bleeding management. Assess atezolizumab separately.',7,bev,U['bev'])
add('BEV_GI_PERFORATION_CONFIRMED',eq('gi_perforation'),'discontinue','Discontinue bevacizumab for gastrointestinal perforation and obtain urgent surgical assessment.',11,bev)
add('BEV_TE_OR_G4_FISTULA',eq('te_or_grade4_fistula'),'discontinue','Discontinue bevacizumab for tracheoesophageal fistula or any grade-4 fistula.',11,bev)
add('BEV_VTE_G4',leaf('venous_thromboembolism_grade','>=',4),'discontinue','Discontinue bevacizumab for life-threatening grade-4 venous thromboembolism, including pulmonary embolism; urgently manage the event.',7,bev,U['bev'])
add('BEV_VTE_G1_G3',allof(leaf('venous_thromboembolism_grade','>',0),leaf('venous_thromboembolism_grade','<',4)),'consultant_review','Review and closely monitor grade 1–3 venous thromboembolism, anticoagulation and bleeding risk; do not automatically equate all VTE with the grade-4 discontinuation rule.',7,bev,U['bev'])
add('BEV_SURGERY_LT28',leaf('days_since_major_surgery','<',28),'withhold','Do not initiate bevacizumab before at least 28 days after major surgery and complete wound healing. Timing alone is not proof of healing.',6,bev,U['bev'])
add('BEV_UNHEALED_OR_PLANNED_SURGERY',anyof(eq('wound_fully_healed',False),eq('elective_surgery_planned')),'withhold','Withhold bevacizumab for an unhealed wound or elective surgery; agree the surgical interruption and restart plan. Do not invent a universal preoperative washout interval.',6,bev,U['bev'])
add('BEV_PRES',eq('pres_suspected'),'withhold','Urgently assess suspected PRES, including blood pressure and brain imaging. Confirmed PRES requires bevacizumab discontinuation; safety of restarting is not established.',6,bev,U['bev'])
add('HYPOPHYSITIS_G4',leaf('hypophysitis_grade','>=',4),'permanently_discontinue','Permanently discontinue atezolizumab for source grade-4 hypophysitis.',6,ate)
add('HYPOPHYSITIS_G2_G3',leaf('hypophysitis_grade','between',[2,3]),'withhold','Withhold atezolizumab for grade 2–3 hypophysitis; restart only after source recovery, replacement stability and steroid-taper criteria are met.',6,ate)
add('FACIAL_PARESIS_G1_G2',leaf('facial_paresis_grade','between',[1,2]),'withhold','Withhold atezolizumab for grade 1–2 facial paresis; restart only if fully resolved. Failure to resolve while withheld requires permanent discontinuation.',7,ate)
add('FACIAL_PARESIS_STOP',anyof(leaf('facial_paresis_grade','>=',3),eq('facial_paresis_unresolved')),'permanently_discontinue','Permanently discontinue atezolizumab for grade 3–4 facial paresis or failure of the event to resolve while withheld.',7,ate)
add('MYELITIS_G2PLUS',leaf('myelitis_grade','>=',2),'permanently_discontinue','Permanently discontinue atezolizumab for grade 2–4 myelitis.',7,ate)
add('SPECIFIC_NEUROLOGICAL_ALL_GRADES',eq('myasthenia_gbs_meningoencephalitis'),'permanently_discontinue','Permanently discontinue atezolizumab for immune myasthenic syndrome/myasthenia gravis, Guillain–Barré syndrome or meningoencephalitis of any grade.',7,ate)
add('ENDOCRINE_EXCEPTION_REVIEW',anyof(leaf('other_immune_toxicity_grade','>=',4),eq('recurrent_grade_3_immune_toxicity')),'withhold','Urgently review the named grade-4/recurrent-grade-3 immune event and whether the sole event is an endocrinopathy controlled by replacement. Unknown exception status must not silently authorise treatment or imply irreversible cessation.',8,ate)
add('IMMUNE_RESTART_12WEEK_FAILURE',anyof(eq('immune_toxicity_not_recovered_12weeks'),eq('steroid_not_tapered_12weeks')),'withhold','The source restart conditions have not been met: do not restart atezolizumab. Obtain Consultant review of the exact event, time course, steroid need and endocrine exceptions; the EU source does not supply a universal automatic permanent-stop rule for this combined flag.',9,ate,U['atezo'])
add('SYSTEMIC_STEROID_CAUTION',leaf('systemic_steroids_mg_pred','>',10),'consultant_review','Review systemic corticosteroids >10 mg prednisolone-equivalent/day and their indication before treatment; replacement, topical/inhaled use and immune-toxicity management need separate interpretation.',3,ate)
p['rule_engine']['rules']=rr;p['rule_engine']['missing_data_policy']='No missing baseline, attribution, grade or variceal-management input is inferred normal. Isolated abnormal laboratories prompt assessment, not a diagnosis of immune toxicity.'
p['supportive_care']={'emetogenic_risk':'minimal','notes':['Both agents have minimal emetogenic potential; no routine premedication or routine preventive antiemetic is specified. Use symptom-directed/local policy.','Retain immunotherapy alert card and 24-hour contact plan during and after treatment.','Screen and manage oesophageal varices before bevacizumab; review BP and urine protein before each cycle.','Atezolizumab and bevacizumab require separate interruption/discontinuation decisions; no source dose reductions.','Atezolizumab contraception for 5 months and bevacizumab for 6 months after treatment; combined counselling uses the longer relevant interval. Bevacizumab breastfeeding restriction continues for at least 6 months after the last dose.']}
for f,x in d.items():
 if f.endswith('_grade') and x.get('options'):
  for o in x['options']:
   g=o['value'];o['description']='Explicitly absent.' if g==0 else 'Clinician-assessed grade '+str(g)+' for the named adverse event under '+x.get('grading_source_label','the source')+'. Confirm the symptom, organ involvement and intervention needed; do not infer grade from an unrelated laboratory value.'
(H/'proposed'/p['file_name']).write_text(json.dumps(p,indent=2,ensure_ascii=False)+'\n')
print('Proposals written')
