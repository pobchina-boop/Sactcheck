"""Bounded authoring for 00271/00280; writes only this validation directory."""
from pathlib import Path
import copy, json, hashlib
H=Path(__file__).resolve().parent
R=H.parents[2]
V='0.84.23'; DATE='2026-10-26'
URLS={'00271':'https://healthservice.hse.ie/documents/6931/271_CarboplatinAUC5Etop100.pdf','00280':'https://healthservice.hse.ie/documents/6927/280_CISplatin_and_Etoposide.pdf'}
FILES={'00271':'00271-carboplatin-etoposide.json','00280':'00280-cisplatin-etoposide.json'}
ANTI='https://healthservice.hse.ie/documents/7180/Supportive_Care_Antiemetics_for_inclusion_NCIS_Medical_Oncology.pdf'
STATUS='Source reconciled; independent clinical, pharmacy and patient/PPI review pending'
def save(name,d): (H/name).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def cond(f,op,v=None):
 d={'field':f,'operator':op}
 if v is not None:d['value']=v
 return d
def AND(*x):return {'all':list(x)}
def OR(*x):return {'any':list(x)}
def num(label,unit='',**kw):return dict(label=label,type='number',required=False,min=0,step=.01,unit=unit,demo_value='',input_role='decision',**kw)
def boolean(label):return dict(label=label,type='boolean',required=False,demo_value='',input_role='decision')
def select(label,options):return dict(label=label,type='select',required=False,demo_value='',options=[dict(value=v,label=l) for v,l in options],input_role='decision')
def grade(label,url):
 d=select(label,[(i,'Grade '+str(i)) for i in range(5)])
 d.update(grading_source_label='NCCP source: grading edition unspecified',grading_source_url=url,source_grading_note='The regimen does not name a CTCAE edition. Confirm the adverse-event term and locally agreed grading criteria; no CTCAE v5 descriptor is substituted.',assessment_guidance='Clinician-entered grade. See the source-specific action; grades do not establish an unlisted percentage reduction.')
 for o in d['options']:o['description']='No event reported.' if o['value']==0 else 'Clinician-confirmed grade '+str(o['value'])+'; consult the exact adverse-event criteria adopted by the treating service. NCCP edition unspecified.'
 return d
def rule(d,id,condition,action,text,page,components=None,explanation=None):
 d['rule_engine']['rules'].append(dict(rule_id=id,**condition,action=dict(type=action,components=components or d['metadata']['drugs'],recommendation=text),source=dict(document='NCCP '+d['metadata']['nccp_regimen_code']+' v'+d['metadata']['nccp_version'],page=page,url=d['metadata']['source_url']),explanation=explanation or text))
def common(code):
 cis=code=='00280';p=json.loads((R/'protocols/lung'/FILES[code]).read_text());m=p['metadata'];u=URLS[code];pl='cisplatin' if cis else 'carboplatin'
 m.update(nccp_version='7' if cis else '6',source_url=u,source_document_pages=6,sactcheck_encoding_version=V,source_checked_date=DATE,source_reconciled_date=DATE,full_suite_release=V,indication='Treatment of extensive-stage small-cell lung cancer.',published_date='2015-09-10' if cis else '2015-11-15')
 m['source_title_exact']='CISplatin (75mg/m²) + Etoposide Therapy - 21 day' if cis else 'CARBOplatin (AUC5) and Etoposide 100mg/m² Therapy-21 day'
 m['title']=m['source_title_exact'];m['short_title']=('Cisplatin' if cis else 'Carboplatin')+' + Etoposide';m['drugs']=[pl,'etoposide']
 m['canonical_protocol_id']=p['protocol_id'];m['validation'].update(official_catalogue_and_source_link_checked=True,software_tests_completed=False,rule_level_source_reconciliation_status='source_reconciled_pending_independent_clinical_and_oncology_pharmacy_validation',consultant_reviewed=False,oncology_pharmacy_reviewed=False,clinical_use_authorised=False)
 m['encoding_maturity']=dict(level='source_reconciled_pending_independent_review',label=STATUS,source_reconciled=True,consultant_reviewed=False,oncology_pharmacy_reviewed=False,clinical_use_authorised=False,audit_release=V,audit_date=DATE,reconciled_release=V,reconciled_date=DATE,scope_note='Full source audit of eligibility, multi-day treatment, counts, renal and hepatic tables, monitoring, adverse-event precautions and supportive care; source seams require consultant/pharmacy decisions.')
 for ext,key in [('pdf','source_pdf_sha256'),('txt','source_text_snapshot_sha256')]:
  f=H/'research'/(code+'.'+ext)
  if f.exists():m[key]=hashlib.sha256(f.read_bytes()).hexdigest()
 p['indications']=[dict(code=code+'a',description='Small-cell lung cancer (SCLC), extensive disease.')]
 p['required_inputs']=[];p['rule_engine']['rules']=[];i=p['input_definitions']
 i['anc'].update(label='Current pre-treatment ANC (×10⁹/L)',help='Use the current pre-treatment count. The source does not provide a separate previous-nadir algorithm.')
 i['platelets'].update(label='Current pre-treatment platelets (×10⁹/L)',help='Use the current pre-treatment count. Do not substitute a previous nadir without consultant review.')
 i['indication_id']['options']=[dict(value=code+'a',label='Extensive-stage small-cell lung cancer')]
 for k in ['neuropathy_grade','diarrhoea_grade','stomatitis_grade']: i[k]=grade(i[k]['label'],u)
 i.update(age_years=num('Age','years'),ecog=select('ECOG performance status',[(n,str(n)) for n in range(5)]),extensive_sclc_confirmed=boolean('Extensive-stage SCLC indication confirmed'),febrile_neutropenia=boolean('Neutropenic fever / febrile neutropenia'),etoposide_crcl_ml_min=num('Verified creatinine clearance for etoposide','mL/min'),bilirubin_micromol_l=num('Bilirubin (absolute value)','µmol/L'),ast_u_l=num('AST (absolute value)','U/L'),nephrotoxic_or_ototoxic_medicines=boolean('Concurrent nephrotoxic or ototoxic medicines'),etoposide_interacting_medicines=boolean('Potential etoposide interaction identified'),hearing_impairment=boolean('Hearing impairment or tinnitus requiring review'),multi_day_antiemetic_plan_confirmed=boolean('Antiemetic plan covers Days 1–3 treatment and two days after'))
 i['etoposide_crcl_ml_min']['renal_input']=dict(mode='source_threshold_numeric',exact_value_required=False,reason='NCCP etoposide renal table uses numeric CrCl thresholds; this input does not calculate a dose.',source_url=u)
 for k in ['bilirubin_uln_multiple','alt_uln_multiple']:
  i[k].update(input_role='context',help='Legacy contextual input retained. NCCP etoposide table uses absolute bilirubin in µmol/L and AST in U/L; a ULN multiple alone cannot select a dose.')
 p['output_templates']['proceed']='No encoded action was triggered in the supplied domains. This does not authorise treatment; confirm the full source, complete assessment, consultant and pharmacy review.'
 for k in ['hypersensitivity','pregnancy','breastfeeding']:
  rule(p,'EXCLUSION_'+k.upper(),cond(k,'==',True),'contraindicated','Do not administer this regimen; obtain consultant review of the source exclusion.',2 if cis else 3)
 rule(p,'INDICATION_SCOPE',cond('extensive_sclc_confirmed','==',False),'consultant_review','Confirm the indication and correct NCCP regimen. This source is for extensive-stage SCLC; limited-stage chemoradiation is a separate regimen.',1)
 rule(p,'COURSE_REVIEW',cond('cycle_number','>',6),'consultant_review','Source course is 4–6 cycles every 21 days'+(' or until disease progression or unacceptable toxicity develops.' if not cis else '.')+' Review continuation beyond six; do not assume automatic maintenance.',1)
 rule(p,'ACTIVE_INFECTION',cond('active_infection','==',True),'withhold','Assess and treat clinically significant infection promptly before further chemotherapy; urgent consultant review. No percentage dose is inferred from infection alone.',4 if cis else 5)
 rule(p,'ETOP_RENAL_15_50',AND(cond('etoposide_crcl_ml_min','>=',15),cond('etoposide_crcl_ml_min','<=',50)),'dose_reduce','Etoposide: source renal table specifies 75% dose for CrCl 15–50 mL/min. Discuss with consultant; subsequent dosing depends on tolerance and clinical effect.',4,['etoposide'])
 rule(p,'ETOP_RENAL_LT15',cond('etoposide_crcl_ml_min','<',15),'dose_reduce','Etoposide: source renal table specifies 50% dose for CrCl <15 mL/min. Discuss with consultant; subsequent dosing depends on tolerance and clinical effect. Assess platinum separately.',4,['etoposide'])
 rule(p,'ETOP_HEPATIC_SEVERE',OR(cond('bilirubin_micromol_l','>',51),cond('ast_u_l','>',180)),'consultant_review','Etoposide: bilirubin >51 µmol/L or AST >180 U/L requires a clinical decision. The source does not specify a definitive dose; do not extrapolate the 50% band.',4,['etoposide'])
 for f,lo,hi,other,otherhi in [('bilirubin_micromol_l',26,51,'ast_u_l',180),('ast_u_l',60,180,'bilirubin_micromol_l',51)]:
  rule(p,'ETOP_HEPATIC_'+('BILIRUBIN' if f.startswith('bilirubin') else 'AST'),AND(cond(f,'>=',lo),cond(f,'<=',hi),OR(cond(other,'missing'),cond(other,'<=',otherhi))),'dose_reduce','Etoposide: source hepatic table specifies 50% for bilirubin 26–51 µmol/L or AST 60–180 U/L. Review the other hepatic measure, renal function and tolerance; do not compound reductions automatically.',4,['etoposide'])
 rule(p,'HEPATIC_ABSOLUTE_REQUIRED',AND(OR(cond('bilirubin_uln_multiple','exists'),cond('alt_uln_multiple','exists')),cond('bilirubin_micromol_l','missing'),cond('ast_u_l','missing')),'consultant_review','ULN multiples/ALT do not map to this source etoposide table. Obtain absolute bilirubin (µmol/L) and AST (U/L); no conversion or dose is inferred.',4,['etoposide'])
 rule(p,'HEARING_REVIEW',cond('hearing_impairment','==',True),'consultant_review','Assess hearing/tinnitus and cumulative platinum exposure before further treatment; arrange hearing assessment and consultant review.',4 if cis else 5,[pl])
 rule(p,'INTERACTION_PLATINUM',cond('nephrotoxic_or_ototoxic_medicines','==',True),'consultant_review','Avoid concurrent nephrotoxic/ototoxic medicines where possible; specialist medicines reconciliation and renal/hearing monitoring are required if unavoidable.',5 if cis else 5,[pl])
 rule(p,'INTERACTION_ETOPOSIDE',cond('etoposide_interacting_medicines','==',True),'consultant_review','Review current interaction resources: CYP3A4 inducers may increase etoposide clearance and CYP3A4/P-gp inhibitors may decrease it. No fixed percentage change is specified.',5,['etoposide'])
 rule(p,'MULTIDAY_SUPPORT',cond('multi_day_antiemetic_plan_confirmed','==',False),'consultant_review','Confirm a written plan appropriate to the SACT risk on each of Days 1–3 and for two days after (through Day 5). NCIS V8 single-day tables are reference components, not a complete three-day prescription.',4 if cis else 5)
 p['rule_engine']['rules'][-1]['source']=dict(document='NCCP NCIS Medical Oncology antiemetics V8',page=5,url=ANTI)
 for k in ['diarrhoea_grade','stomatitis_grade']:
  rule(p,'REVIEW_'+k.upper(),cond(k,'>',0),'consultant_review','Assess the reported symptom, hydration, oral intake and infection before further treatment. The NCCP regimen supplies no graded '+('diarrhoea' if k.startswith('diarrhoea') else 'stomatitis')+' percentage-reduction table; a grade must not trigger the former unsupported automatic hold-and-reduce rule.',4 if cis else 5)
  p['rule_engine']['rules'][-1]['source']=dict(document='HSE chemotherapy side-effects advice plus NCCP source gap',url='https://www2.hse.ie/conditions/chemotherapy/side-effects/',page=1)
 for x in i.values():x['required']=False;x['demo_value']=''
 return p

def carbo():
 p=common('00271');i=p['input_definitions'];u=URLS['00271']
 p['metadata']['review_date']='2027-08-30'
 i.update(cisplatin_unsuitable=boolean('Unsuitable for cisplatin-based treatment'),renal_estimate_method=select('Carboplatin renal assessment method',[('measured','Isotope/measured GFR'),('estimated','Wright / Cockcroft–Gault estimate')]),creatinine_age_hours=num('Age of creatinine sample when dosing','hours'),creatinine_percent_of_isotope_baseline=num('Creatinine as percent of isotope-baseline value','%'),gfr_estimate_unreliable=boolean('Obesity, low creatinine or other concern makes estimated GFR unreliable'))
 i['egfr'].update(label='Verified GFR for carboplatin Calvert dose',renal_input=dict(mode='exact_continuous',exact_value_required=True,reason='Calvert dose = target AUC × (verified GFR +25); source caps the GFR used at125 mL/min.',source_url=u))
 rule(p,'CISPLATIN_SUITABILITY',cond('cisplatin_unsuitable','==',False),'consultant_review','This carboplatin source eligibility specifies patients unsuitable for cisplatin-based regimens. Confirm the platinum choice and correct treatment plan.',3)
 rule(p,'ECOG_GT3',cond('ecog','>',3),'consultant_review','Source eligibility: ECOG0–2, or ECOG0–3 in patients younger than70. ECOG above3 is outside this source eligibility.',3)
 rule(p,'ECOG3_AGE70PLUS',AND(cond('ecog','==',3),cond('age_years','>=',70)),'consultant_review','ECOG3 is included only for patients younger than70 in this source; obtain consultant review.',3)
 rule(p,'ECOG3_AGE_UNKNOWN',AND(cond('ecog','==',3),cond('age_years','missing')),'consultant_review','Age is needed to assess the source ECOG3 exception; eligibility is unconfirmed.',3)
 rule(p,'ANC_LT0_5',cond('anc','<',.5),'delay_then_dose_reduce','Delay treatment; consider reducing both carboplatin and etoposide by25% after consultant review. This is a consideration, not an automatic prescribed dose.',4)
 rule(p,'ANC_0_5_LT1',AND(cond('anc','>=',.5),cond('anc','<',1)),'delay','Delay one week until recovery and reassess before administration.',4)
 rule(p,'PLATELETS_LT50',cond('platelets','<',50),'delay_then_dose_reduce','Delay treatment; consider reducing both carboplatin and etoposide by25% after consultant review. This is not an automatic dose calculation.',4)
 rule(p,'PLATELETS_75_LT100',AND(cond('platelets','>=',75),cond('platelets','<',100)),'delay','Delay one week until recovery and reassess before administration.',4)
 rule(p,'PLATELETS_50_LT75_GAP',AND(cond('platelets','>=',50),cond('platelets','<',75)),'consultant_review','The source Day1 table does not assign platelets50–<75 ×10⁹/L to a dose row. Withhold authorisation pending consultant/pharmacy clarification; do not treat the gap as normal or invent a percentage.',4)
 rule(p,'FEBRILE_NEUTROPENIA',cond('febrile_neutropenia','==',True),'delay_then_dose_reduce','Neutropenic fever: delay and consider reducing carboplatin and etoposide by25%; urgent clinical assessment and consultant review. Current ANC is not needed to trigger this action.',4)
 rule(p,'CARBO_GFR_LE20',cond('egfr','<=',20),'contraindicated','Carboplatin must not be administered at GFR≤20 mL/min. Assess etoposide and the overall plan separately.',4,['carboplatin'])
 rule(p,'CARBO_CRCL_LT60',cond('etoposide_crcl_ml_min','<',60),'proceed_with_caution','CrCl<60 mL/min increases carboplatin myelosuppression risk. This warning does not override the GFR≤20 non-administration threshold; verify carboplatin GFR separately.',4,['carboplatin'])
 rule(p,'CARBO_GFR_CAP',cond('egfr','>',125),'consultant_review','The GFR used in the source Calvert formula must not exceed125 mL/min. Verify method and cap; do not use an uncapped estimated value.',2,['carboplatin'])
 rule(p,'CARBO_ESTIMATE_STALE',AND(cond('renal_estimate_method','==','estimated'),cond('creatinine_age_hours','>',48)),'consultant_review','Estimated GFR dosing requires serum creatinine obtained within48hours of administration; refresh/review before calculating this cycle.',4,['carboplatin'])
 rule(p,'CARBO_ESTIMATE_RECENCY_UNKNOWN',AND(cond('renal_estimate_method','==','estimated'),cond('creatinine_age_hours','missing')),'consultant_review','Confirm that the creatinine used for estimated GFR is within48hours of administration.',4,['carboplatin'])
 rule(p,'CARBO_ISOTOPE_REASSESS',AND(cond('renal_estimate_method','==','measured'),cond('creatinine_percent_of_isotope_baseline','>',110)),'consultant_review','Creatinine is above110% of the isotope-baseline value: consider repeat measured GFR or a new verified estimate; do not automatically reuse the old dose.',4,['carboplatin'])
 rule(p,'CARBO_ESTIMATE_UNRELIABLE',cond('gfr_estimate_unreliable','==',True),'consultant_review','Measured GFR is recommended when obesity or low serum creatinine makes estimates unreliable; specialist review of adjusted weight/creatinine options is required.',2,['carboplatin'])
 rule(p,'NEUROPATHY_REVIEW',cond('neuropathy_grade','>',0),'consultant_review','Review neurological symptoms and function regularly. This source gives no graded neuropathy dose table; assess cumulative platinum exposure and previous cisplatin treatment.',5,['carboplatin'])
 p['eligibility']=['Extensive-stage SCLC','Unsuitable for cisplatin-based regimens','ECOG0–2; ECOG0–3 only if age<70']
 p['monitoring']={'baseline':['FBC, renal and liver profile','Isotope GFR preferred or validated GFR/CrCl estimate'],'regular':['FBC weekly prior to treatment','Renal and liver profile before each cycle','Regular neurological and hearing assessment; especially prior platinum/ototoxic exposure'],'disease':['According to consultant treatment plan']}
 p['supportive_care'].update(emetogenic_risk='high',script_id='nccp-v8-carboplatin-v08420',mapping_source='NCCP NCIS Medical Oncology antiemetics V8 (2025)',mapping_source_url=ANTI,mapping_basis='CarboplatinAUC5 dedicated high-risk row; etoposideDays1–3 low risk. Reconcile each-day prevention and2days after last SACT; generic single-day script is insufficient.',mapping_confidence='source_reconciled_pending_pharmacy_validation',additional_support=['Confirm risk-appropriate antiemetics throughoutDays1–5.','No routine hypersensitivity premedication unless prior reaction; anaphylaxis facilities required.','NCCP gives no other specific supportive-care recommendations; use patient-specific unit plans.'])
 return p

def cisplatin():
 p=common('00280');i=p['input_definitions'];u=URLS['00280']
 p['metadata']['review_date']='As required from 2026-06-29'
 p['metadata'].update(date_last_reviewed='2021-06-24',source_version_date='2026-06-29',source_review_schedule='As required from29June2026; v7 updated infusion time, review schedule and emetogenic guidance links.')
 i.update(treatment_stage=select('Cisplatin treatment stage',[('initial','Before starting cisplatin'),('continuation','Toxicity/dose review during established treatment')]),cisplatin_crcl_ml_min=num('Verified creatinine clearance for cisplatin','mL/min'),preexisting_neuropathy_grade=grade('Pre-existing peripheral neuropathy grade',u),significant_baseline_hearing_impairment=boolean('Significant pre-existing hearing impairment/tinnitus'),severe_liver_impairment=boolean('Severe liver impairment'),other_toxicity_grade=grade('Other toxicity grade (exclude neuropathy, mucositis and alopecia)',u),hydration_plan_confirmed=boolean('Pre/post cisplatin hydration and electrolyte plan confirmed'),oral_hydration_impossible=boolean('Unable to maintain oral hydration'),cisplatin_schedule=select('Cisplatin schedule',[('day1_75','75mg/m² Day1'),('fractionated','Consultant-directed fractionation over three days')]))
 i['cisplatin_crcl_ml_min']['renal_input']=dict(mode='source_threshold_numeric',exact_value_required=False,reason='NCCP cisplatin table uses CrCl thresholds and a separate baseline eligibility exclusion; no Calvert calculation.',source_url=u)
 i['egfr'].update(label='Legacy renal band (does not select a cisplatin dose)',help='Retained for compatible assessments. The <60 band spans distinct source actions; provide verified CrCl and treatment stage for source-specific assessment.',input_role='context')
 p['rule_engine']['rules']=[r for r in p['rule_engine']['rules'] if r['rule_id']!='REVIEW_DIARRHOEA_GRADE']
 rule(p,'ECOG_GT3',cond('ecog','>',3),'consultant_review','ECOG above3 is outside this source eligibility (ECOG0–3); consultant review required.',2)
 rule(p,'PREEXISTING_NEUROPATHY',cond('preexisting_neuropathy_grade','>=',2),'contraindicated','Pre-existing peripheral neuropathy grade≥2 is a cisplatin exclusion. Do not initiate cisplatin; discuss an alternative.',2,['cisplatin'])
 rule(p,'BASELINE_HEARING_EXCLUSION',cond('significant_baseline_hearing_impairment','==',True),'contraindicated','Significant pre-existing hearing impairment/tinnitus is a cisplatin exclusion; do not initiate cisplatin.',2,['cisplatin'])
 rule(p,'SEVERE_LIVER_EXCLUSION',cond('severe_liver_impairment','==',True),'contraindicated','Severe liver impairment is an etoposide exclusion in this source. Consultant review required; do not infer a dose from the biochemical table alone.',2,['etoposide'])
 rule(p,'CIS_BASELINE_CRCL_LT60',AND(cond('cisplatin_crcl_ml_min','<',60),cond('treatment_stage','==','initial')),'contraindicated','Baseline CrCl<60mL/min is a cisplatin exclusion. Do not initiate cisplatin by applying the later renal-modification table; consultant review of an alternative is required.',2,['cisplatin'])
 rule(p,'CIS_RENAL_STAGE_UNKNOWN',AND(cond('cisplatin_crcl_ml_min','<',60),cond('treatment_stage','missing')),'consultant_review','Clarify initial versus established treatment. Source excludes baseline CrCl<60, but the later renal table allows a consultant-reviewed75% dose at45–59 and a clinical decision below45; do not choose a dose until context is known.',4,['cisplatin'])
 rule(p,'CIS_CRCL_45_59',AND(cond('cisplatin_crcl_ml_min','>=',45),cond('cisplatin_crcl_ml_min','<=',59),cond('treatment_stage','==','continuation')),'dose_reduce','During established treatment the source renal table specifies cisplatin75% for CrCl45–59mL/min. This does not override the separate CrCl<60 baseline exclusion.',4,['cisplatin'])
 rule(p,'CIS_CRCL_LT45',AND(cond('cisplatin_crcl_ml_min','<',45),cond('treatment_stage','==','continuation')),'consultant_review','Source: consider carboplatin / clinical decision at CrCl<45mL/min. No definitive cisplatin percentage or automatic substitution is specified.',4,['cisplatin'])
 rule(p,'CIS_CRCL_FRACTIONAL_GAP',AND(cond('cisplatin_crcl_ml_min','>',59),cond('cisplatin_crcl_ml_min','<',60),cond('treatment_stage','==','continuation')),'consultant_review','The source renal rows45–59 and≥60 do not assign values between59 and60. Clarify the boundary with consultant/pharmacy; do not round silently.',4,['cisplatin'])
 rule(p,'LEGACY_RENAL_NEEDS_EXACT',AND(cond('egfr','exists'),cond('cisplatin_crcl_ml_min','missing')),'consultant_review','Legacy <60/≥60 band does not establish the source-specific cisplatin CrCl interval or etoposide renal category. Confirm verified component clearances; no dose is inferred.',4)
 rule(p,'ANC_LT1',cond('anc','<',1),'delay','Source count table: delay at ANC<1×10⁹/L; reassess recovery before treatment.',3)
 rule(p,'PLATELETS_LT75',cond('platelets','<',75),'delay','Source count table: delay at platelets<75×10⁹/L; reassess recovery before treatment.',3)
 rule(p,'ANC_1_1_49',AND(cond('anc','>=',1),cond('anc','<=',1.49)),'dose_reduce','Etoposide75% for ANC1–1.49×10⁹/L. The dose column names etoposide; do not automatically reduce cisplatin. A separately low platelet count can require delay.',3,['etoposide'])
 rule(p,'PLATELETS_75_99',AND(cond('platelets','>=',75),cond('platelets','<=',99)),'dose_reduce','Etoposide75% for platelets75–99×10⁹/L. The dose column names etoposide; do not automatically reduce cisplatin. A separately low ANC can require delay.',3,['etoposide'])
 rule(p,'COUNT_FRACTIONAL_GAP',OR(AND(cond('anc','>',1.49),cond('anc','<',1.5)),AND(cond('platelets','>',99),cond('platelets','<',100))),'consultant_review','The source count rows leave fractional values between ANC1.49 and1.5 or platelets99 and100 unassigned. Seek consultant/pharmacy clarification; no silent rounding or full-dose assumption.',3)
 rule(p,'FEBRILE_NEUTROPENIA',cond('febrile_neutropenia','==',True),'withhold','Fever with neutropenia requires prompt assessment and treatment. This source has no dedicated previous-FN percentage-reduction row; consultant review before further chemotherapy.',5)
 rule(p,'NEUROPATHY_GE2',cond('neuropathy_grade','>=',2),'withhold_then_reduce','After recovery to grade≤1, choose with consultant: substitute carboplatinAUC5 OR reduce cisplatin dose by50%; etoposide100%. Do not calculate one definitive cisplatin dose from this choice. Pre-existing grade≥2 is separately excluded.',4,['cisplatin'])
 for f in ['other_toxicity_grade','diarrhoea_grade']:
  rule(p,('OTHER' if f.startswith('other') else 'DIARRHOEA')+'_GRADE3',cond(f,'==',3),'withhold_then_reduce','Grade3 toxicity other than mucositis/alopecia: delay until recovery to grade1, then cisplatin and etoposide75%. Assess the named event; neuropathy has its own separate pathway.',4)
  rule(p,('OTHER' if f.startswith('other') else 'DIARRHOEA')+'_GRADE4',cond(f,'==',4),'withhold','Urgent assessment and consultant review for grade4 toxicity. Source Table5 states grade3; it does not authorise extrapolating its75% restart to grade4.',4)
 rule(p,'HYDRATION_NOT_CONFIRMED',cond('hydration_plan_confirmed','==',False),'withhold','Confirm suitable pre/post-cisplatin hydration and electrolyte prescription before administration, using source suggestions and local policy.',1,['cisplatin'])
 rule(p,'ORAL_HYDRATION_IMPOSSIBLE',cond('oral_hydration_impossible','==',True),'consultant_review','If oral hydration is not possible, IV hydration is indicated. Assess kidney function, fluid balance and the cause (including uncontrolled nausea).',5,['cisplatin'])
 rule(p,'CIS_FRACTIONATION',cond('cisplatin_schedule','==','fractionated'),'consultant_review','Source allows the total75mg/m² cisplatin dose to be fractionated over three days, but its footnote only explicitly writes25mg/m² onDay1. Require the signed full day-by-day schedule, hydration and multi-day high-risk antiemetic plan; do not infer an executable split schedule.',1,['cisplatin'])
 rule(p,'AGE_OVER75_PLATINUM_REVIEW',cond('age_years','>',75),'consultant_review','Source permits considering carboplatinAUC5 substitution with cisplatin toxicity, poor function or age>75. This is a consultant option, not an automatic age-based switch.',1,['cisplatin'])
 p['eligibility']=['Extensive-stage SCLC','ECOG0–3'];p['exclusions']=['Hypersensitivity','Pre-existing neuropathy≥grade2 (cisplatin)','Baseline CrCl<60mL/min (cisplatin)','Significant hearing impairment/tinnitus (cisplatin)','Severe hepatic impairment (etoposide)','Pregnancy or breastfeeding']
 p['monitoring']={'baseline':['Blood, renal and liver profile','Audiology and creatinine clearance if clinically indicated','Record pre-existing nerve/hearing problems and confirm renal eligibility'],'regular':['Blood, renal and liver profile before each cycle','Hearing and sensory neurological history before each cycle','Fluid balance, renal function and electrolyte replacement with cisplatin hydration; local policy'],'disease':['According to consultant treatment plan']}
 p['supportive_care'].update(emetogenic_risk='high',script_id='nccp-parenteral-high',mapping_source='NCCP NCIS Medical Oncology antiemetics V8 (2025)',mapping_source_url=ANTI,mapping_basis='CisplatinD1 high risk; etoposideDays1–3 low risk. Reconcile support on every treatment day andtwo days after; three-day split cisplatin needs a different reviewed schedule.',mapping_confidence='source_reconciled_pending_pharmacy_validation',additional_support=['Pre/post-cisplatin hydration and electrolyte replacement per source/local policy.','Monitor etoposide infusion especially first15minutes for hypotension.','Multi-day antiemetic prescription required throughDay5 for the standardDays1–3 course.'])
 return p

def schedules(p):
 c=p['metadata']['nccp_regimen_code'];cis=c=='00280';pl='cisplatin' if cis else 'carboplatin'
 duration='4–6 cycles.' if cis else '4–6 cycles or until disease progression or unacceptable toxicity develops.'
 p['treatment_phases']=[]
 for oral in [False,True]:
  admin=[dict(day=1,order=2 if cis else 1,drug=pl,dose=dict(value=75 if cis else 5,unit='mg/m2' if cis else 'AUC'),route='IV infusion',note='In1000mL0.9%NaCl over1hour with pre/post hydration.' if cis else 'In500mLglucose5% over30minutes; Calvert dosing with verified GFR.')] 
  admin.append(dict(day=1 if oral else [1,2,3],order=1 if cis else 2,drug='etoposide',dose=dict(value=100,unit='mg/m2'),route='IV infusion',note='In1000mL0.9%NaCl over60minutes.'))
  if oral:admin.append(dict(day=[2,3],order=1,drug='etoposide',dose=dict(value=100,unit='mg/m2',frequency='twice daily'),route='oral',note='100mg/m² per dose twice daily; prescribed50mg/100mgcapsule strengths, empty stomach. Pharmacy must specify capsule plan.'))
  admin.sort(key=lambda a:(min(a['day']) if isinstance(a['day'],list) else a['day'],a['order']))
  p['treatment_phases'].append(dict(phase_id='iv_day1_oral_days2_3' if oral else 'iv_days1_3',label='Alternative: IVDay1 / oralDays2–3 (choose one schedule)' if oral else 'Standard: IV etoposideDays1–3 (choose one schedule)',cycle_length_days=21,duration_text=duration,schedule_summary='These are alternative etoposide schedules, not sequential treatment phases. Confirm the selected route before prescribing.',administration=admin))
 p['metadata']['dose_schedule_variant_input']='etoposide_schedule'
 p['metadata']['dose_schedule_variants']={'standard':{'iv_days_1_to_3':'iv_days1_3','iv_day_1_oral_days_2_3':'iv_day1_oral_days2_3'}}
 p['input_definitions']['treatment_phase']=select('Treatment schedule family',[('standard','Platinum and etoposide (select etoposide route below)')])
 p['treatment']=dict(cycle_length_days=21,duration_text=duration,schedule_summary='PlatinumDay1 and etoposideDays1–3; either all-IV orDay1IV followed by oral100mg/m² twice dailyDays2–3. No automatic immunotherapy maintenance or radiotherapy in this regimen.')

if __name__=='__main__':
 for c,fn in [('00271',carbo),('00280',cisplatin)]:
  p=fn();schedules(p);save('proposed/'+FILES[c],p)
