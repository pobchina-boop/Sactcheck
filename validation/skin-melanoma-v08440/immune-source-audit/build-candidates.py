"""Source-specific proposed encodings; never edits the read-only baseline checkout."""
from pathlib import Path
import json,copy,hashlib,os
ROOT=Path(os.environ.get('SACT_TEST_ROOT','/workspace/scratch/bca730129437/recovery-2026-11-05/restore-test'))
OUT=Path(__file__).resolve().parent; STAGE=OUT.parent
PATHS={'00431':'protocols/skin/00431-nivolumab-1-mg-kg-and-ipilimumab-3-mg-kg-therapy.json','00812':'protocols/gynaecology/00812-cemiplimab-therapy.json'}
BASE={c:json.loads((ROOT/p).read_text()) for c,p in PATHS.items()}
T=json.loads((ROOT/'protocols/shared/00551-nivolumab-3-mg-kg-with-ipilimumab-1-mg-kg-therapy.json').read_text())
MANIFEST=json.loads((STAGE/'current-source-access/retrieval.json').read_text())
P={c:copy.deepcopy(p) for c,p in BASE.items()}
C=lambda f,o,v=None:{'field':f,'operator':o,**({'value':v} if v is not None else {})}
ALL=lambda *a:{'all':list(a)}
ANY=lambda *a:{'any':list(a)}
YES=lambda f:C(f,'==',True)
NOTTRUE=lambda f:ANY(C(f,'missing'),C(f,'==',False))

def num(label,minimum=0,maximum=None,unit=None):
 d={'label':label,'type':'number','required':False,'input_role':'decision','min':minimum}
 if maximum is not None:d['max']=maximum
 if unit:d['unit']=unit
 return d

def boolean(label):return {'label':label,'type':'boolean','required':False,'input_role':'decision','demo_value':False}
def select(label,opts):return {'label':label,'type':'select','required':False,'input_role':'decision','options':[{'value':v,'label':l} for v,l in opts]}
def addinput(c,f,d):P[c]['input_definitions'][f]=copy.deepcopy(d)
def grade(c,f,label):
 d=select(label+' (clinician-confirmed source grade)',[(g,'Grade '+str(g)) for g in range(5)])
 d.update({'ctcae_version':'4.0' if c=='00431' else 'current NCCP-required edition','grading_system':'NCI CTCAE','grading_source_label':'NCCP 00431 v11: CTCAE v4.0' if c=='00431' else 'NCCP 00812 v3a: current NCI CTCAE version (edition not specified)', 'grading_source_url':P[c]['metadata']['source_url'],'assessment_guidance':'Clinician assigns the organ-specific grade using symptoms, baseline results and the required CTCAE edition. Do not infer a grade from a generic descriptor or an isolated creatinine ratio.'})
 addinput(c,f,d)
def rule(c,id,w,action,msg,page):
 P[c]['rule_engine']['rules'].append({'rule_id':id,'priority':30 if action=='permanently_discontinue' else 20 if action in ['contraindicated','withhold','discontinue'] else 10,'when':w,'action':{'type':action,'components':P[c]['treatment']['drugs'],'message':msg,'recommendation':msg},'explanation':msg,'source':{'document':'NCCP '+c+' version '+P[c]['metadata']['nccp_version'],'url':P[c]['metadata']['source_url'],'page':page,'checked_date':'2026-11-06'}})
def b_rule(c,f,label,action,msg,page):addinput(c,f,boolean(label));rule(c,f.upper(),YES(f),action,msg,page)

for c,p in P.items():
 (OUT/(c+'-before.json')).write_text(json.dumps(BASE[c],indent=2)+'\n')
 m=p['metadata'];m.update({'nccp_version':'11' if c=='00431' else '3a','source_document_pages':11 if c=='00431' else 8,'source_checked_date':'2026-11-06','sactcheck_encoding_version':'0.84.40'})
 src=next(x for x in MANIFEST if ('431_' if c=='00431' else '812_') in x['url'])
 m['source_pdf_sha256']=src['sha256'];m['source_final_url']=src['final_url']
 m['source_document_date']='2026-08-20' if c=='00431' else '2024-10-01'
 m['encoding_maturity']={'level':'source_reconciled_pending_independent_review','label':'Current NCCP source reconciled; independent clinical and pharmacy approval pending','source_reconciled':True,'consultant_reviewed':False,'oncology_pharmacy_reviewed':False,'clinical_use_authorised':False,'audit_release':'0.84.40','audit_date':'2026-11-06','scope_note':'Fresh full PDF retained and rule boundaries exercised. Software/source reconciliation is not independent clinical approval.'}
 m['validation'].update({'rule_level_source_reconciliation_status':'source_reconciled_pending_independent_clinical_and_oncology_pharmacy_validation','consultant_reviewed':False,'oncology_pharmacy_reviewed':False,'clinical_use_authorised':False})
 m['clinical_audit_release']='0.84.40';m['validation']['audit_release']='0.84.40'
 m['clinical_source_audit']={'release':'0.84.40','date':'2026-11-06','source_pdf_sha256':src['sha256'],'source_version':m['nccp_version'],'source_reconciled':True,'independent_clinical_review':False,'oncology_pharmacy_review':False,'patient_ppi_review':False}
 p['required_inputs']=[];p['rule_engine']=copy.deepcopy(T['rule_engine']);p['rule_engine']['rules']=[]
 p['clinical_governance']['disclaimer']=f'Decision-support encoding derived from NCCP {c} version {m["nccp_version"]}. Independent clinical and oncology-pharmacy validation remains pending. The current official regimen and prescribing consultant remain authoritative.'
 p['clinical_governance']['dose_modification_note']='No dose reductions are recommended. Hold/stop decisions do not calculate a reduced immune-checkpoint dose. Restart requires organ-specific recovery and consultant review; no recovery flag overrides permanent-stop criteria.'
 p['output_templates']['dose_reduce']='Dose reductions are not recommended for this regimen; discuss any proposed modification with the prescribing consultant.'
 # Preserve existing laboratory fields as explicit context; replace unsafe generic grade decisions.
 for f in ['non_haematological_toxicity_grade','hypersensitivity_grade']:p['input_definitions'].pop(f,None)
 for f in ['ecog','hypersensitivity','pregnancy','breastfeeding','age_years','adequate_baseline_organ_function','prednisolone_equivalent_mg_day','other_immunosuppression','prior_pd1_pdl1','restart_requested','source_recovery_complete','consultant_restart_approved','renal_impairment_band','hepatic_impairment_band']:
  addinput(c,f,T['input_definitions'][f])
 rule(c,'HYPERSENSITIVITY_EXCLUSION',YES('hypersensitivity'),'contraindicated','Known hypersensitivity to a component or excipient is an NCCP exclusion.',3 if c=='00431' else 2)
 rule(c,'ECOG_OUTSIDE_RANGE',C('ecog','>',2),'consultant_review','ECOG exceeds the NCCP eligibility range 0–2; eligibility requires consultant review.',3 if c=='00431' else 1)
 rule(c,'ADULT_INDICATION',C('age_years','<',18),'consultant_review','This NCCP regimen describes adult indications. Do not extrapolate eligibility to children.',1)
 rule(c,'BASELINE_FUNCTION_UNCONFIRMED',C('adequate_baseline_organ_function','==',False),'consultant_review','Adequate baseline haematological, hepatic and renal function is unconfirmed. NCCP gives no universal numerical blood-count eligibility cut-off here.',3 if c=='00431' else 1)
 rule(c,'PRIOR_PD1_PDL1',YES('prior_pd1_pdl1'),'consultant_review','Check the current NCCP prior PD-1/PD-L1 treatment guidance. Prior exposure is not automatically treated as an unconditional prohibition by this tool.',3 if c=='00431' else 2)
 for f in ['pneumonitis_grade','diarrhoea_colitis_grade','nephritis_grade','rash_grade','myocarditis_grade','diabetes_grade','thyroid_grade','hypophysitis_grade','adrenal_grade','other_immune_grade','infusion_reaction_grade']:
  grade(c,f,f.replace('_grade','').replace('_',' ').capitalize())
 rule(c,'RESTART_UNCONFIRMED',ALL(YES('restart_requested'),ANY(NOTTRUE('source_recovery_complete'),NOTTRUE('consultant_restart_approved'))),'withhold','Restart is not authorised until the source organ-specific recovery criteria and consultant decision are confirmed. Missing information is not normal and permanent-stop criteria still prevail.', '4–9' if c=='00431' else '3–6')
 for f in ['tsh_miu_l','free_t4_pmol_l','cortisol_nmol_l','glucose_mmol_l','ketones_mmol_l','creatinine_ratio_baseline_or_uln']:
  addinput(c,f,T['input_definitions'][f]);p['input_definitions'][f]['input_role']='context'
  rule(c,'LAB_CONTEXT_'+f.upper(),C(f,'exists'),'consultant_review','Interpret this laboratory value with symptoms, baseline, assay reference range and the named organ-specific toxicity grade. This isolated result does not authorise dosing or establish nephritis grade.',4 if c=='00431' else 2)
 for f in ['renal_impairment_band','hepatic_impairment_band']:
  rule(c,'BASELINE_'+f.upper(),C(f,'in',['mild','moderate','severe','haemodialysis'] if f.startswith('renal') else ['mild','moderate','severe']),'consultant_review','NCCP baseline organ-impairment table does not call for a routine dose reduction (severe impairment/haemodialysis uses expected pharmacokinetics). Assess suitability and distinguish baseline impairment from new immune toxicity.',9 if c=='00431' else 3)
 p['exclusions']=['Known hypersensitivity to the drug(s) or excipients; follow the current NCCP source for all exclusions and cautions.']

c='00431';p=P[c];m=p['metadata']
m['source_version_transition']={'from':'10','to':'11','canonical_id_retained_for_compatibility':True,'new_source_context':'00431b first-line unresectable/advanced HCC; this release does not claim a completed HCC service suite'}
m['tumour_groups']=['Skin/Melanoma','Gastrointestinal'];m['indication']='Adults with advanced unresectable/metastatic melanoma; current NCCP v11 also includes first-line unresectable or advanced HCC (separate context).'
p['indications'][0]['description']='Treatment of advanced (unresectable or metastatic) melanoma in adults.'
p['indications'].append({'indication_id':'00431b','code':'00431b','description':'First-line treatment of adult patients with unresectable or advanced hepatocellular carcinoma.','tumour_groups':['Gastrointestinal'],'reimbursement_status':'N/A in NCCP v11','full_service_suite_complete':False})
addinput(c,'indication_id',select('NCCP indication',[('00431a','Advanced melanoma'),('00431b','First-line unresectable/advanced HCC (separate source context)')]))
p['eligibility']=['Adults with an NCCP-listed indication; ECOG 0–2; adequate haematological, hepatic and renal function.','Advanced melanoma: determine baseline BRAF status.','HCC only: first-line unresectable/advanced disease; Child-Pugh score 5 or 6.','Pregnancy or lack of effective contraception requires consultant assessment of benefit versus risk; effective contraception for at least 5 months after the last nivolumab dose.']
rule(c,'PREGNANCY_REVIEW',YES('pregnancy'),'consultant_review','NCCP does not recommend treatment in pregnancy unless the prescribing consultant considers benefit to outweigh risk. This is a consultant decision, not an absolute exclusion encoded from an older template.',3)
rule(c,'BREASTFEEDING_SOURCE_SCOPE',YES('breastfeeding'),'consultant_review','This NCCP version does not define a breastfeeding decision in its eligibility/exclusion list. Consult current product information and specialist advice before treatment; no automatic clearance.',3)
for f,label in [('symptomatic_ild','Symptomatic interstitial lung disease'),('autoimmune_disease','Clinically significant autoimmune disease'),('active_significant_infection','Active clinically significant infection requiring therapy'),('symptomatic_cns_metastases','Symptomatic CNS metastases'),('other_immunosuppression','Other systemic immunosuppressive therapy')]:
 b_rule(c,f,label,'consultant_review',label+' is an NCCP caution requiring individual consultant assessment.',3)
rule(c,'IMMUNOSUPPRESSIVE_STEROIDS',C('prednisolone_equivalent_mg_day','>',10),'consultant_review','Systemic prednisolone-equivalent >10 mg/day is an NCCP caution; inhaled/topical steroids are excluded from this definition.',3)
addinput(c,'child_pugh_score',num('Child-Pugh score for HCC',5,15));rule(c,'HCC_CHILD_PUGH',ALL(C('indication_id','==','00431b'),C('child_pugh_score','>',6)),'consultant_review','HCC source eligibility is Child-Pugh 5 or 6. Do not transfer this restriction to melanoma.',3)
addinput(c,'hcc_first_line_unresectable_advanced_not_met',boolean('HCC first-line unresectable/advanced indication requirement not met'));rule(c,'HCC_FIRST_LINE_UNRESECTABLE_ADVANCED_NOT_MET',ALL(C('indication_id','==','00431b'),YES('hcc_first_line_unresectable_advanced_not_met')),'consultant_review','The HCC source indication is first-line unresectable or advanced disease; resolve eligibility before treatment.',1)
# Grade table from 00431 Table4, not a class-wide ICI template.
for f,holds,stops,pg,recovery in [('pneumonitis_grade',[2],[3,4],5,'Symptoms resolved, radiographic abnormalities improved and corticosteroid management complete.'),('diarrhoea_colitis_grade',[2],[3,4],5,'Symptoms resolved and corticosteroid management complete. Grade3 also permanently stops follow-on nivolumab monotherapy.'),('nephritis_grade',[2,3],[4],6,'Creatinine back to baseline and corticosteroid management complete.'),('rash_grade',[3],[4],7,'Symptoms resolved and corticosteroid management complete.'),('myocarditis_grade',[2],[3,4],8,'Symptoms resolved and corticosteroid management complete; safety of restarting after myocarditis is unknown (p9).'),('diabetes_grade',[3],[4],7,'Treat and stabilise diabetes with insulin as needed; grade4 permanently stops.')]:
 rule(c,f.upper()+'_HOLD',C(f,'in',holds),'withhold',recovery,pg);rule(c,f.upper()+'_STOP',C(f,'in',stops),'permanently_discontinue','Permanent discontinuation for this organ-specific source grade. Recovery does not automatically authorise rechallenge.',pg)
grade(c,'hepatitis_grade','Immune hepatitis without HCC');nonhcc=C('indication_id','==','00431a')
for suffix,gs,act in [('HOLD',[2],'withhold'),('STOP',[3,4],'permanently_discontinue')]:rule(c,'HEPATITIS_GRADE_'+suffix,ALL(nonhcc,C('hepatitis_grade','in',gs)),act,'Non-HCC immune hepatitis uses clinician-assigned CTCAE v4 AST/ALT/bilirubin grade. For grade2, recover to baseline and complete corticosteroids; grades3–4 permanently stop.',6)
rule(c,'HEPATITIS_CONTEXT_MISSING',ALL(C('hepatitis_grade','>=',2),C('indication_id','missing')),'consultant_review','Select the indication: NCCP v11 has different hepatitis rules with and without HCC. Do not infer HCC status.',6)
addinput(c,'endocrine_symptoms',boolean('Symptoms attributable to thyroid/pituitary toxicity present'))
for f,hold,stop in [('thyroid_grade',[2,3],[4]),('hypophysitis_grade',[2,3],[4])]:
 rule(c,f.upper()+'_HOLD',ALL(C(f,'in',hold),YES('endocrine_symptoms')),'withhold','Withhold symptomatic grade2–3 until symptoms resolve and any corticosteroid treatment for acute inflammation is complete. Asymptomatic hormone replacement/antithyroid treatment alone does not require a hold.',7)
 rule(c,f.upper()+'_CONTEXT',ALL(C(f,'in',hold),C('endocrine_symptoms','missing')),'consultant_review','Confirm symptoms and stability; missing symptoms are not assumed absent.',7)
 rule(c,f.upper()+'_STOP',C(f,'in',stop),'permanently_discontinue','NCCP 00431 grade4 thyroid/pituitary toxicity permanently stops; do not borrow the cemiplimab endocrine exception.',7)
rule(c,'ADRENAL_GRADE_HOLD',C('adrenal_grade','==',2),'withhold','Grade2 adrenal insufficiency: withhold until symptoms resolve and corticosteroid management for acute inflammation is complete; replacement as needed.',7)
rule(c,'ADRENAL_GRADE_STOP',C('adrenal_grade','in',[3,4]),'permanently_discontinue','Grade3–4 adrenal insufficiency permanently discontinues this regimen.',7)
for f,label,pg in [('sjs_ten_confirmed','Confirmed Stevens–Johnson syndrome or toxic epidermal necrolysis',7),('immune_severe_recurrence','Recurrence of severe immune toxicity',4),('immune_life_threatening','Life-threatening immune toxicity',4),('persistent_grade23_despite_management','Persistent grade2/3 toxicity despite management',4),('unable_taper_steroid_to10','Unable to reduce systemic steroid to prednisolone-equivalent 10 mg/day',8)]:b_rule(c,f,label,'permanently_discontinue',label+': permanent discontinuation according to the NCCP pathway.',pg)
b_rule(c,'sjs_ten_suspected','Suspected SJS/TEN','discontinue','Discontinue treatment and urgently refer for specialist assessment of suspected SJS/TEN. Confirmed SJS/TEN permanently discontinues.',7)
addinput(c,'other_grade3_recurrent',boolean('Other grade3 immune reaction is recurrent'))
rule(c,'OTHER_GRADE3_HOLD',C('other_immune_grade','==',3),'withhold','First grade3 other immune reaction: withhold and obtain organ-specific specialist management; recurrence permanently stops.',8)
rule(c,'OTHER_STOP',ANY(C('other_immune_grade','==',4),ALL(C('other_immune_grade','==',3),YES('other_grade3_recurrent'))),'permanently_discontinue','Grade4 or recurrent grade3 other immune reaction: permanently discontinue.',8)
for organ,pg in [('pneumonitis',5),('colitis',5),('hepatitis',6),('nephritis',6),('overlap',8)]:b_rule(c,organ+'_worse_despite_steroids',organ.capitalize()+' worsening or not improving despite corticosteroids','permanently_discontinue','Worsening or no improvement of '+organ+' despite corticosteroids requires permanent discontinuation.',pg)
grade(c,'overlap_syndrome_grade','Myocarditis–myositis–myasthenia overlap (highest individual event grade)')
rule(c,'OVERLAP_HOLD',C('overlap_syndrome_grade','==',2),'withhold','Grade2 overlap: withhold, urgently assess and treat; use the highest grade of the individual events.',8)
rule(c,'OVERLAP_STOP',C('overlap_syndrome_grade','in',[3,4]),'permanently_discontinue','Grade3–4 overlap: permanently discontinue; use the highest individual event grade.',8)
b_rule(c,'myocarditis_or_neurological_red_flags','New cardiac, respiratory, muscle or neurological red flags','withhold','Withhold pending urgent specialist evaluation for potentially serious myotoxicity/overlap; confirm the organ-specific grade.',8)
rule(c,'INFUSION_SEVERE',C('infusion_reaction_grade','in',[3,4]),'discontinue','Stop the infusion and provide appropriate medical treatment for severe/life-threatening infusion reaction. NCCP says discontinue infusion; do not infer a generic reduced dose or automatic rechallenge.',8)
rule(c,'INFUSION_MILD_MODERATE',C('infusion_reaction_grade','in',[1,2]),'consultant_review','Mild/moderate infusion reaction: close monitoring and local reaction/premedication guidance; clinician decides whether treatment can continue.',8)
b_rule(c,'other_component_withheld','Either component withheld during the combination phase','withhold','If either nivolumab or ipilimumab is withheld during combination treatment, withhold the other. Restart regimen/monotherapy is an individual consultant decision.',4)
addinput(c,'immunosuppressive_steroid_dose',boolean('Current corticosteroid dose is immunosuppressive'))
rule(c,'RESTART_IMMUNOSUPPRESSION',ALL(YES('restart_requested'),ANY(C('prednisolone_equivalent_mg_day','>',10),YES('other_immunosuppression'),YES('immunosuppressive_steroid_dose'))),'withhold','Do not restart during immunosuppressive corticosteroid dosing or other immunosuppressive treatment. The taper after improvement should last at least one month; replacement treatment is a separate assessment.',4)
b_rule(c,'prior_immune_myocarditis','Previous immune myocarditis','consultant_review','Safety of restarting after immune myocarditis is unknown; obtain specialist risk assessment even if symptoms have resolved.',9)
for f in ['alt_ast_uln_multiple','bilirubin_uln_multiple']:
 p['input_definitions'][f]['assessment_guidance']='An actual laboratory value must be divided by that assay ULN, not baseline. Without HCC use clinician-assigned CTCAE v4 grade; with HCC match each transaminase to its own baseline.'
 rule(c,'LIVER_SOURCE_CONTEXT_'+f.upper(),C(f,'exists'),'consultant_review','A liver ratio alone does not establish the appropriate NCCP hepatitis pathway. Confirm indication, baseline, cause and source-specific grade; HCC uses separate numeric boundaries.',6)
# HCC: match each current AST/ALT value to its own baseline, never the highest of different enzymes.
hcc=C('indication_id','==','00431b')
for analyte in ['ast','alt']:
 bf='baseline_'+analyte+'_uln_multiple';cf='current_'+analyte+'_uln_multiple'
 addinput(c,bf,num('HCC baseline '+analyte.upper()+' / assay ULN',0,None,'×ULN'));addinput(c,cf,num('Current '+analyte.upper()+' / assay ULN',0,None,'×ULN'))
 windows=ANY(ALL(C(bf,'<=',1),C(cf,'>',3),C(cf,'<=',10)),ALL(C(bf,'>',1),C(bf,'<=',3),C(cf,'>',5),C(cf,'<=',10)),ALL(C(bf,'>',3),C(bf,'<=',5),C(cf,'>',8),C(cf,'<=',10)))
 rule(c,'HCC_'+analyte.upper()+'_HOLD',ALL(hcc,windows),'withhold','HCC Table4 matched '+analyte.upper()+' baseline/current hold boundary reached. Withhold until baseline and steroid course complete; worsening despite steroids permanently stops.',6)
 rule(c,'HCC_'+analyte.upper()+'_CONTEXT',ALL(hcc,ANY(ALL(C(cf,'>',1),C(bf,'missing')),C(bf,'>',5))),'consultant_review','HCC '+analyte.upper()+': missing matched baseline or baseline >5×ULN is outside the encoded table bands. Obtain consultant assessment; do not assume baseline normal.',6)
rule(c,'HCC_LIVER_STOP',ALL(hcc,ANY(C('current_ast_uln_multiple','>',10),C('current_alt_uln_multiple','>',10),C('alt_ast_uln_multiple','>',10),C('bilirubin_uln_multiple','>',3))),'permanently_discontinue','HCC: AST or ALT >10×ULN or total bilirubin >3×ULN permanently discontinues, regardless of baseline availability.',6)
# Explicit prescribed phase, alternative maintenance route and source interval.
for f in ['treatment_phase','cycle_number','maintenance_schedule','days_since_last_combination','first_maintenance_dose']:addinput(c,f,T['input_definitions'][f])
addinput(c,'monotherapy_months',num('HCC nivolumab monotherapy duration in months',0,None,'months'))
rule(c,'COMBINATION_LIMIT',ALL(ANY(C('treatment_phase','==','combination'),C('prescribed_schedule','==','combination')),C('cycle_number','>',4)),'withhold','Combination is limited to four 21-day cycles; cycle5 onward is nivolumab alone following the prescribed gap.',1)
rule(c,'MELANOMA_MAINTENANCE_EARLY',ALL(nonhcc,YES('first_maintenance_dose'),ANY(ALL(ANY(C('maintenance_schedule','in',['iv240_q14','sc600_q14']),C('prescribed_schedule','in',['iv240_q14','sc600_q14'])),C('days_since_last_combination','<',21)),ALL(ANY(C('maintenance_schedule','in',['iv480_q28','sc1200_q28']),C('prescribed_schedule','in',['iv480_q28','sc1200_q28'])),C('days_since_last_combination','<',42)))),'withhold','For melanoma, first maintenance is 3 weeks after combination with a 14-day schedule or 6 weeks with a 28-day schedule.',1)
rule(c,'HCC_MAINTENANCE_EARLY',ALL(hcc,YES('first_maintenance_dose'),C('days_since_last_combination','<',21)),'withhold','HCC first nivolumab monotherapy starts 3 weeks after the last combination dose, including 28-day options.',1)
rule(c,'MAINTENANCE_CONTEXT_MISSING',ALL(YES('first_maintenance_dose'),ANY(C('indication_id','missing'),ALL(C('maintenance_schedule','missing'),C('prescribed_schedule','missing')),C('days_since_last_combination','missing'))),'consultant_review','Confirm indication, selected maintenance schedule and elapsed interval before the first monotherapy dose; do not default the gap.',1)
rule(c,'HCC_MONOTHERAPY_24_MONTHS',ALL(hcc,C('monotherapy_months','>=',24)),'withhold','HCC source limits the nivolumab monotherapy phase to up to 24 months. Confirm completion rather than authorising further routine treatment. This limit is not the melanoma duration.',1)
addinput(c,'maintenance_schedule_switch',select('Change of maintenance interval',[('none','No interval change'),('q14_to_q28','14-day to 28-day'),('q28_to_q14','28-day to 14-day')]))
addinput(c,'days_since_last_maintenance',num('Days since last maintenance dose',0,None,'days'))
rule(c,'MAINTENANCE_SWITCH_EARLY',ANY(ALL(C('maintenance_schedule_switch','==','q14_to_q28'),C('days_since_last_maintenance','<',14)),ALL(C('maintenance_schedule_switch','==','q28_to_q14'),C('days_since_last_maintenance','<',28))),'withhold','When switching q14 to q28, wait 14 days after the last q14 dose; switching q28 to q14, wait 28 days after the last q28 dose.',2)
rule(c,'MAINTENANCE_SWITCH_CONTEXT',ALL(C('maintenance_schedule_switch','in',['q14_to_q28','q28_to_q14']),C('days_since_last_maintenance','missing')),'consultant_review','Confirm elapsed time since the last maintenance dose before changing the interval.',2)
p['treatment']['schedule_summary']='Cycles1–4: nivolumab 1 mg/kg IV and ipilimumab 3 mg/kg IV day1 every21days. From cycle5, choose nivolumab240mg IV or600mg SC every14days, or480mg IV or1200mg SC every28days. Melanoma first maintenance: wait3weeks for q14 or6weeks for q28; HCC: wait3weeks for either. Melanoma continues until progression/unacceptable toxicity; HCC monotherapy up to24months.'
p['treatment']['duration_text']='Four combination cycles, then indication-specific nivolumab monotherapy; no fixed total cycle count for advanced melanoma.'
p['treatment_phases']=[{'phase_id':'combination','label':'Cycles1–4: nivolumab + ipilimumab','active_drugs':['nivolumab','ipilimumab'],'cycle_length_days':21,'planned_cycles':4,'administration':[{'drug':'nivolumab','dose':'1 mg/kg','route':'IV','days':[1],'note':'Infuse over30minutes.'},{'drug':'ipilimumab','dose':'3 mg/kg','route':'IV','days':[1],'note':'Infuse over30minutes. Vital signs every30minutes during and for1hour after infusion.'}]}]
for phase,dose,route,days,infusion in [('iv240_q14',240,'IV',14,'30minutes'),('iv480_q28',480,'IV',28,'60minutes'),('sc600_q14',600,'SC',14,'3–5minutes'),('sc1200_q28',1200,'SC',28,'3–5minutes')]:
 p['treatment_phases'].append({'phase_id':phase,'label':f'Maintenance alternative: nivolumab {dose} mg {route} every {days} days','active_drugs':['nivolumab'],'cycle_length_days':days,'duration_text':'Melanoma: until progression/unacceptable toxicity. HCC: up to24months of monotherapy.','schedule_summary':f'From cycle5. Melanoma first dose waits {21 if days==14 else 42} days after combination; HCC waits21days. These maintenance choices are alternatives.','administration':[{'drug':'nivolumab','dose':f'{dose} mg','route':route,'days':[1],'note':'Administer over '+infusion+'.'}]})
m['dose_schedule_context_input']='prescribed_schedule';m['dose_schedule_context_kind']='phase';addinput(c,'prescribed_schedule',select('Prescribed phase/schedule',[('combination','Combination cycles1–4')]+[(x['phase_id'],x['label']) for x in p['treatment_phases'][1:]]))
m['regimen_card']['contexts'][0].update({'duration_text':p['treatment']['duration_text'],'source_version':'11'})
p['supportive_care']['phase_plans']=[{'phase':'combination','emetogenic_risk':'low','source':'NCCP00431p9: ipilimumab low; nivolumab minimal; local antiemetic policy.'},{'phase':'nivolumab_maintenance','emetogenic_risk':'minimal','source':'NCCP00431p9: no routine premedication; local policy.','script_id':'nccp-minimal-no-routine-prophylaxis'}]
p['supportive_care']['immune_toxicity_note']='High-dose steroids and other immunosuppression are specialist toxicity treatment, not routine prophylaxis. Taper after improvement over at least1month; opportunistic-infection prophylactic antibiotics during immunosuppression per consultant/local guidance.'

c='00812';p=P[c];m=p['metadata']
m['indication']='Adults with recurrent/metastatic cervical cancer after platinum progression, or metastatic/locally advanced cutaneous SCC not suitable for curative surgery or radiation (separate eligibility contexts).'
addinput(c,'indication_id',select('NCCP indication',[('00812-gyn','Cervical cancer after platinum progression'),('00812b','Advanced cutaneous SCC not suitable for curative surgery/radiation')]))
p['eligibility']=['Adults with an NCCP-listed indication; ECOG0–2; adequate haematological, hepatic and renal function.','Cervical: recurrent/metastatic disease progressing on or after platinum-based chemotherapy.','CSCC: metastatic/locally advanced disease not suitable for curative surgery or curative radiation; at least one measurable lesion. NCCP00812v3a does not include adjuvant CSCC.']
rule(c,'PREGNANCY_OR_BREASTFEEDING',ANY(YES('pregnancy'),YES('breastfeeding')),'contraindicated','Pregnancy and breastfeeding are NCCP00812 exclusions.',2)
for f,label in [('active_significant_infection','Active clinically significant infection requiring therapy'),('active_cns_metastases','Active CNS metastases')]:b_rule(c,f,label,'contraindicated',label+' is an NCCP exclusion.',2)
# At baseline systemic immunosuppression is excluded; during irAE treatment distinguish dosing hold/restart from treating the toxicity.
addinput(c,'assessment_phase',select('Assessment phase',[('baseline','Before starting'),('pre_cycle','Before a subsequent cycle'),('toxicity_review','Toxicity/restart review')]))
for f in ['other_immunosuppression']:addinput(c,f,T['input_definitions'][f])
rule(c,'BASELINE_IMMUNOSUPPRESSION',ALL(C('assessment_phase','==','baseline'),ANY(C('prednisolone_equivalent_mg_day','>',10),YES('other_immunosuppression'))),'contraindicated','At baseline, systemic prednisolone-equivalent >10mg/day or other immunosuppressants are NCCP exclusions; inhaled/topical steroids are excluded from that definition.',2)
rule(c,'IMMUNOSUPPRESSION_CONTEXT',ALL(ANY(C('prednisolone_equivalent_mg_day','>',10),YES('other_immunosuppression')),C('assessment_phase','missing')),'consultant_review','Confirm baseline versus toxicity treatment. Systemic immunosuppression is a baseline exclusion; organ-specific recovery and taper rules govern restart after immune toxicity.',2)
for f,label in [('cscc_measurable_lesion','At least one measurable CSCC lesion'),('cscc_not_curative_surgery_radiation','CSCC not suitable for curative surgery or radiation')]:
 addinput(c,f,boolean(label));rule(c,f.upper(),ALL(C('indication_id','==','00812b'),C(f,'==',False)),'consultant_review','CSCC-specific source eligibility is not met: '+label+'. Do not apply this criterion to cervical cancer.',1)
addinput(c,'cervical_progressed_after_platinum',boolean('Cervical cancer progressed on/after platinum chemotherapy'));rule(c,'CERVICAL_PRIOR_PLATINUM',ALL(C('indication_id','==','00812-gyn'),C('cervical_progressed_after_platinum','==',False)),'consultant_review','Cervical source indication requires progression on or after platinum-based chemotherapy. This requirement does not apply to CSCC.',1)
addinput(c,'solid_organ_transplant',boolean('Previous solid organ transplant'));rule(c,'CSCC_TRANSPLANT_CAUTION',ALL(C('indication_id','==','00812b'),YES('solid_organ_transplant')),'consultant_review','Solid organ transplant is a source CSCC caution requiring individual consultant/transplant-team discussion.',1)
for f,holds,stops,pg in [('pneumonitis_grade',[2],[3,4],3),('diarrhoea_colitis_grade',[2,3],[4],3),('nephritis_grade',[2],[3,4], '4–5')]:
 rule(c,f.upper()+'_HOLD',C(f,'in',holds),'withhold','Withhold; resume only after sustained improvement to grade0–1 and corticosteroid taper to ≤10mg/day prednisolone-equivalent, with consultant review.',pg)
 rule(c,f.upper()+'_STOP',C(f,'in',stops),'permanently_discontinue','This organ-specific cemiplimab toxicity grade permanently discontinues treatment.',pg)
b_rule(c,'pneumonitis_recurrent_grade2','Recurrent grade2 pneumonitis','permanently_discontinue','Recurrent grade2 pneumonitis permanently discontinues cemiplimab even though a first grade2 episode is held.',3)
b_rule(c,'colitis_recurrent_grade3','Recurrent grade3 colitis','permanently_discontinue','Recurrent grade3 colitis permanently discontinues; first grade3 colitis is held.',3)
rule(c,'HEPATITIS_HOLD',ANY(ALL(C('alt_ast_uln_multiple','>',3),C('alt_ast_uln_multiple','<=',5)),ALL(C('bilirubin_uln_multiple','>',1.5),C('bilirubin_uln_multiple','<=',3))),'withhold','AST/ALT >3–5×ULN or bilirubin >1.5–3×ULN: withhold. Resume only with sustained grade0–1 after taper to ≤10mg/day, or baseline AST/ALT after completed taper, under consultant review.',3)
rule(c,'HEPATITIS_STOP',ANY(C('alt_ast_uln_multiple','>',5),C('bilirubin_uln_multiple','>',3)),'permanently_discontinue','AST/ALT >5×ULN or total bilirubin >3×ULN permanently discontinues cemiplimab. Do not borrow HCC thresholds from a different regimen.',3)
for f in ['alt_ast_uln_multiple','bilirubin_uln_multiple']:p['input_definitions'][f]['assessment_guidance']='Use the actual result divided by the same assay upper limit of normal. AST/ALT is the higher transaminase ratio; verify etiology and baseline. Never substitute a creatinine or baseline ratio.'
# Grade4 endocrine exceptions must survive generic permanent-stop rules.
addinput(c,'endocrine_clinically_stable',boolean('Endocrine toxicity is otherwise clinically stable after specialist assessment'))
for f,gs,pg in [('thyroid_grade',[3,4],3),('thyroiditis_grade',[3,4],4),('hypophysitis_grade',[2,3,4],4),('adrenal_grade',[2,3,4],4),('diabetes_grade',[3,4],4)]:
 grade(c,f,f.replace('_grade','').replace('_',' ').capitalize())
 rule(c,f.upper()+'_HOLD',ALL(C(f,'in',gs),NOTTRUE('endocrine_clinically_stable')),'withhold','Hold this endocrine toxicity; resume when grade0–1 or otherwise clinically stable. Hypophysitis/adrenal recovery also allows sustained grade0–1 after steroid taper to ≤10mg/day. Hormone replacement may continue; no automatic permanent stop solely for grade4 endocrinopathy.',pg)
 rule(c,f.upper()+'_STABLE_REVIEW',ALL(C(f,'in',gs),YES('endocrine_clinically_stable')),'consultant_review','Source permits consideration of resumption when this endocrine toxicity is otherwise clinically stable. Confirm specialist assessment and prescribing decision; this flag does not override any separate permanent-stop criterion.',pg)
addinput(c,'rash_duration_days',num('Duration of grade2 skin reaction',0,None,'days'))
rule(c,'RASH_HOLD',ANY(C('rash_grade','==',3),ALL(C('rash_grade','==',2),C('rash_duration_days','>',7))),'withhold','Grade3 skin reaction or grade2 lasting longer than one week: withhold until sustained grade0–1 after steroid taper to ≤10mg/day.',4)
rule(c,'RASH_DURATION_MISSING',ALL(C('rash_grade','==',2),C('rash_duration_days','missing')),'consultant_review','Grade2 skin reaction requires its duration: the NCCP hold threshold is longer than one week.',4)
rule(c,'RASH_STOP',C('rash_grade','==',4),'permanently_discontinue','Grade4 skin reaction permanently discontinues cemiplimab.',4)
b_rule(c,'sjs_ten_suspected','Suspected SJS/TEN','withhold','Withhold for suspected SJS/TEN and arrange urgent specialist assessment. Confirmation permanently discontinues.',4)
b_rule(c,'sjs_ten_confirmed','Confirmed SJS/TEN','permanently_discontinue','Confirmed SJS/TEN permanently discontinues cemiplimab.',4)
addinput(c,'prior_idelalisib',boolean('Prior treatment with idelalisib'));grade(c,'idelalisib_immune_grade','Immune toxicity after prior idelalisib');addinput(c,'idelalisib_event_endocrine',boolean('The toxicity after idelalisib is an endocrinopathy'));addinput(c,'idelalisib_grade2_recurrent',boolean('Grade2 immune toxicity after idelalisib is recurrent'))
rule(c,'IDELALISIB_HOLD',ALL(YES('prior_idelalisib'),C('idelalisib_immune_grade','==',2)),'withhold','After prior idelalisib, grade2 immune toxicity is held; use prompt specialist management and sustained grade0–1 with steroid taper ≤10mg/day for recovery.',4)
rule(c,'IDELALISIB_STOP',ALL(YES('prior_idelalisib'),ANY(ALL(C('idelalisib_immune_grade','in',[3,4]),C('idelalisib_event_endocrine','==',False)),YES('idelalisib_grade2_recurrent'))),'permanently_discontinue','After prior idelalisib, grade3–4 non-endocrine immune toxicity or recurrent grade2 permanently discontinues.',4)
rule(c,'IDELALISIB_CONTEXT',ALL(YES('prior_idelalisib'),C('idelalisib_immune_grade','in',[3,4]),C('idelalisib_event_endocrine','missing')),'consultant_review','Clarify endocrine versus non-endocrine toxicity; this NCCP permanent-stop row explicitly excludes endocrinopathies.',4)
addinput(c,'other_immune_endocrine',boolean('Other immune event is an endocrinopathy'));addinput(c,'other_grade3_stop_type',boolean('Specialist confirms this grade3 other immune reaction is a source permanent-stop type'))
rule(c,'OTHER_HOLD',C('other_immune_grade','in',[2,3]),'withhold','Other grade2/3 immune toxicity: withhold and obtain organ-specific evaluation. Some grade3 types require permanent discontinuation; no automatic restart from grade alone.',5)
rule(c,'OTHER_STOP',ANY(ALL(C('other_immune_grade','==',4),C('other_immune_endocrine','==',False)),ALL(C('other_immune_grade','==',3),YES('other_grade3_stop_type'))),'permanently_discontinue','Grade4 non-endocrine or a confirmed grade3 permanent-stop type requires permanent discontinuation.',5)
rule(c,'OTHER_TYPE_MISSING',ANY(ALL(C('other_immune_grade','==',4),C('other_immune_endocrine','missing')),ALL(C('other_immune_grade','==',3),C('other_grade3_stop_type','missing'))),'consultant_review','Confirm the type of immune toxicity. Source actions depend on grade3 reaction type and exclude endocrinopathies from the generic grade4 row.',5)
grade(c,'neurological_grade','Immune neurological toxicity');grade(c,'pericarditis_grade','Immune pericarditis')
for f in ['neurological_grade','myocarditis_grade','pericarditis_grade']:rule(c,f.upper()+'_STOP',C(f,'in',[3,4]),'permanently_discontinue','Grade3–4 neurological, myocarditis or pericarditis toxicity permanently discontinues cemiplimab.',5)
for f,label in [('hlh_confirmed','Confirmed haemophagocytic lymphohistiocytosis'),('immune_recurrent_grade3','Recurrent grade3 immune-mediated adverse reaction')]:b_rule(c,f,label,'permanently_discontinue',label+': permanently discontinue per NCCP.',5)
grade(c,'persistent_immune_grade','Persistent immune-mediated toxicity');addinput(c,'persistent_immune_weeks',num('Duration of persistent immune toxicity',0,None,'weeks'));addinput(c,'persistent_event_endocrine',boolean('Persistent event is an endocrinopathy'))
rule(c,'PERSISTENT_12_WEEK_STOP',ALL(C('persistent_immune_grade','in',[2,3]),C('persistent_immune_weeks','>=',12),C('persistent_event_endocrine','==',False)),'permanently_discontinue','Persistent grade2/3 non-endocrine immune toxicity lasting12weeks or longer permanently discontinues.',5)
rule(c,'PERSISTENT_TYPE_MISSING',ALL(C('persistent_immune_grade','in',[2,3]),C('persistent_immune_weeks','>=',12),C('persistent_event_endocrine','missing')),'consultant_review','Identify endocrine versus non-endocrine persistent toxicity: endocrinopathies are excluded from the generic12-week toxicity row.',5)
addinput(c,'steroid_taper_weeks',num('Weeks available for corticosteroid taper',0,None,'weeks'));rule(c,'STEROID_TAPER_12_WEEK_STOP',ALL(C('steroid_taper_weeks','>=',12),C('prednisolone_equivalent_mg_day','>',10)),'permanently_discontinue','Inability to reduce corticosteroid to ≤10mg/day prednisolone-equivalent within12weeks permanently discontinues cemiplimab.',5)
rule(c,'INFUSION_MILD_MODERATE',C('infusion_reaction_grade','in',[1,2]),'withhold','Interrupt the infusion or slow its rate and manage symptoms under local policy; this action concerns the current infusion, not automatic permanent discontinuation.',5)
rule(c,'INFUSION_SEVERE',C('infusion_reaction_grade','in',[3,4]),'permanently_discontinue','Grade3/4 infusion reaction permanently discontinues cemiplimab.',6)
addinput(c,'restart_endocrine_exception',boolean('Restart concerns a clinically stable endocrine exception confirmed by specialist'))
rule(c,'RESTART_STEROID_HOLD',ALL(YES('restart_requested'),C('prednisolone_equivalent_mg_day','>',10),NOTTRUE('restart_endocrine_exception')),'withhold','For non-endocrine immune toxicity, restart requires the specified recovery and steroid taper to ≤10mg/day (or completed taper for the hepatitis baseline alternative). Endocrine clinical-stability alternatives require separate confirmation.', '3–5')
rule(c,'RESTART_ENDOCRINE_CONTEXT',ALL(YES('restart_requested'),YES('restart_endocrine_exception'),NOTTRUE('endocrine_clinically_stable')),'withhold','An endocrine exception requires confirmed clinical stability; do not assume stability from a requested exemption.', '3–4')
p['input_definitions']['source_recovery_complete']['label']='Applicable organ-specific recovery criteria met (including clinical-stability endocrine alternatives)'
p['input_definitions']['source_recovery_complete']['assessment_guidance']='Non-endocrine: sustained grade0–1 after steroid taper ≤10mg/day; hepatitis also permits baseline AST/ALT after completed taper. Endocrine: grade0–1 or otherwise clinically stable as specified. Permanent-stop rules remain binding.'
# Retained legacy labs get explicit contextual results rather than unsupported cytotoxic thresholds.
for f in ['anc','platelets','haemoglobin','acth_result','febrile_neutropenia']:
 if f in p['input_definitions']:
  p['input_definitions'][f]['input_role']='context'
  rule(c,'LAB_CONTEXT_'+f.upper(),C(f,'exists'),'consultant_review','Review the entered blood-count/infection/endocrine context clinically. NCCP00812 supplies no numeric chemotherapy-style dose threshold for this field; do not invent a dose reduction.',2)
p['treatment'].update({'duration_type':'until_progression_or_unacceptable_toxicity','duration_text':'Until disease progression or unacceptable toxicity; no preset total number of cycles.','schedule_summary':'Cemiplimab350mg IV over30minutes on day1 every21days until disease progression or unacceptable toxicity.','administration':[{'drug':'cemiplimab','dose':'350 mg','route':'IV','days':[1],'note':'Infuse over30minutes every21days.'}]})
p['supportive_care'].update({'mapping_basis':'NCCP00812v3a p6: cemiplimab minimal emetogenic potential; no routine premedication, local policy.','immune_toxicity_note':'Immune-toxicity steroids, endocrine replacement and other management are organ-specific specialist treatment, not routine premedication.'})
# Preserve cervical context while adding only the source-supported CSCC suite.
if not any(x.get('indication_id')=='00812-gyn' for x in m['regimen_card']['contexts']):m['regimen_card']['contexts'].append({'id':'00812-gyn','indication_id':'00812-gyn','intent':'advanced_disease','cycle_length_days':21,'duration_type':'until_progression_or_unacceptable_toxicity','duration_text':p['treatment']['duration_text'],'provenance':'official_nccp_source_reconciled'})

c='00431'
b_rule(c,'new_endocrine_symptoms','New endocrine symptoms','consultant_review','Assess new endocrine symptoms promptly with thyroid, pituitary, adrenal and glucose evaluation as appropriate. Select the named toxicity grade; symptoms may mimic underlying disease.',7)
c='00812'
rule(c,'OTHER_ENDOCRINE_CONTEXT',ALL(C('other_immune_grade','==',4),YES('other_immune_endocrine')),'consultant_review','Select the named endocrine toxicity and assess clinical stability; the generic grade4 permanent-stop row excludes endocrinopathies.',5)
for f in ['neurological_grade','myocarditis_grade','pericarditis_grade']:rule(c,f.upper()+'_GRADE2_HOLD',C(f,'==',2),'withhold','Grade2 neurological/cardiac immune reaction: withhold and obtain urgent organ-specific specialist evaluation under the other immune-reaction pathway.',5)

for c,p in P.items():
 for d in p['input_definitions'].values():d['required']=False
 import re
 def readable(x,key=''):
  if isinstance(x,dict):return {k:readable(v,k) for k,v in x.items()}
  if isinstance(x,list):return [readable(v,key) for v in x]
  if isinstance(x,str) and key in ['label','message','recommendation','explanation','assessment_guidance','duration_text','schedule_summary','note','immune_toxicity_note','mapping_basis','source','source_grading_note']:
   x=re.sub(r'(?<=[A-Za-z])(?=\d)', ' ', x)
   x=re.sub(r'(?<=\d)(?=(?:mg|minutes|weeks|months|days|hour|minute|week|month|day|cycles|cycle)\b)', ' ', x)
   x=re.sub(r'(?<=\d)(?=every|after|before)', ' ', x)
  return x
 p=readable(p);P[c]=p
 dest=STAGE/PATHS[c];dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n')
 print(c,len(p['input_definitions']),len(p['rule_engine']['rules']),str(dest))
manifest=[]
for c in P:
 s=next(x for x in MANIFEST if ('431_' if c=='00431' else '812_') in x['url']);manifest.append({'code':c,'protocol_path':PATHS[c],'version':P[c]['metadata']['nccp_version'],'checked_date':'2026-11-06','pdf_path':'sources/'+c+'.pdf','text_path':'sources/'+c+'.txt','url':s['url'],'final_url':s['final_url'],'pdf_sha256':s['sha256'],'pages':s['pages'],'bytes':s['bytes'],'retrieval_method':'Ordinary HTTPS request with conventional browser User-Agent; default TLS verification and official redirect; HTTP200','before_sha256':hashlib.sha256((ROOT/PATHS[c]).read_bytes()).hexdigest(),'after_sha256':hashlib.sha256((STAGE/PATHS[c]).read_bytes()).hexdigest(),'independent_approval':False})
(OUT/'sources.json').write_text(json.dumps(manifest,indent=2)+'\n')
