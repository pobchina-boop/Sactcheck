#!/usr/bin/env python3
"""Stage a reviewed 00464 proposal. Never modifies the checkout; optional root argument is read-only."""
from pathlib import Path
import copy, hashlib, json, shutil, sys
OUT=Path(__file__).resolve().parent
ROOT=Path(sys.argv[1]) if len(sys.argv)>1 else OUT.parent.parent/'Sactcheck'
rel='protocols/skin/00464-dacarbazine-therapy.json'
p=json.loads((ROOT/rel).read_text())
(OUT/'00464-before.json').write_text(json.dumps(p,indent=2)+'\n')
PDF='https://assets.hse.ie/media/documents/464_V3_Dacarbazine.pdf'
SMPC='https://assets.hpra.ie/products/Human/19327/Licence_PA0623-003-002_04032024123758.pdf'
NCCP_SHA='32af7a11e3ceff02a2c7878657e9f981aff310e0819ec8f785750536a6a05e44'
HPRA_SHA='945abca6f3dfcf77846570039075869bcdfe06039f57e2440aa6bd0b0c892f55'
assert hashlib.sha256((OUT/'00464.pdf').read_bytes()).hexdigest()==NCCP_SHA
hpra=OUT.parent/'owner-sources/dacarbazine-hpra-current.pdf'
assert hashlib.sha256(hpra.read_bytes()).hexdigest()==HPRA_SHA
shutil.copy2(hpra,OUT/'dacarbazine-hpra-current.pdf')
def source(page,section,secondary=False):
 return {'document':'HPRA Dacarbazine medac 200 mg SmPC, March 2024' if secondary else 'NCCP 00464 Dacarbazine v3, revised 15 April 2025','url':SMPC if secondary else PDF,'page':page,'section':section,'sha256':HPRA_SHA if secondary else NCCP_SHA,'hash_kind':'pdf_bytes','retrieved':'2026-11-06'}
def f(k,op,v):return {'field':k,'operator':op,'value':v}
def all_(*xs):return {'all':list(xs)}
def any_(*xs):return {'any':list(xs)}
d=p['input_definitions']
for k in ['dacarbazine_renal_band','non_haematological_toxicity_grade']:d.pop(k,None)
d['ecog']['input_role']='context';d['ecog']['assessment_guidance']='Performance status informs individual review. NCCP 00464 does not set a numeric ECOG eligibility threshold.'
def boolean(k,label,default=False):d[k]={'label':label,'type':'boolean','required':False,'demo_value':default,'input_role':'decision'}
def number(k,label,unit,minimum=0,step=0.01,demo=1):d[k]={'label':label,'type':'number','required':False,'min':minimum,'step':step,'demo_value':demo,'unit':unit,'input_role':'decision'}
number('crcl_ml_min','Creatinine clearance (CrCl)','mL/min',demo=90)
d['crcl_ml_min']['renal_input']={'mode':'absolute_crcl','method':'CrCl as specified by NCCP Table 2; do not substitute unindexed eGFR without clinical review'}
number('cycle_number','Planned cycle number','cycle',minimum=1,step=1,demo=1)
d['cycle_number']['integer']=True
for k,label,default in [
 ('indication_eligible','Metastatic malignant melanoma indication confirmed',True),
 ('hypersensitivity','Known hypersensitivity to dacarbazine or its excipients',False),
 ('severe_kidney_disease','Severe kidney disease (clinical diagnosis; separate from the CrCl table)',False),
 ('hepatic_impairment_present','Hepatic impairment requiring dose review',False),
 ('renal_impairment_present','Renal impairment clinically present',False),
 ('haemodialysis','Haemodialysis / renal replacement therapy',False),
 ('new_hepatic_or_renal_dysfunction_symptoms','New symptoms of hepatic or renal dysfunction during dacarbazine',False),
 ('hepatic_vod_confirmed_or_history','Dacarbazine-associated hepatic veno-occlusive disease confirmed or previous occurrence',False),
 ('suspected_extravasation','Suspected dacarbazine extravasation',False),
 ('clinically_unacceptable_toxicity','Clinically unacceptable toxicity',False),
 ('disease_progression','Disease progression',False),
 ('baseline_or_precycle_tests_missing','Required baseline / pre-cycle FBC, renal or liver tests missing',False),
 ('previous_dose_reduction','A previous individualized dose reduction is in effect',False),
 ('restart_requested','Restart following treatment interruption is being considered',False),
 ('source_recovery_complete','Recovery is adequate for the proposed restart',True),
 ('consultant_restart_approved','Consultant has approved the proposed restart and dose',True),
 ('concomitant_fotemustine','Concomitant fotemustine',False),
 ('concomitant_phenytoin','Concomitant phenytoin',False),
 ('live_vaccine_planned_or_recent','Live vaccine proposed or recently administered',False),
 ('other_marrow_suppression_or_radiotherapy','Other marrow-suppressive treatment or radiotherapy',False),
 ('hepatotoxic_drug_or_alcohol','Hepatotoxic medicines or alcohol requiring review',False),
 ('inr_monitored_anticoagulant','Anticoagulant requiring INR monitoring',False),
 ('contraception_plan_confirmed','Applicable contraception / fertility counselling confirmed',True),
 ('infection_bleeding_or_marrow_toxicity_concern','Infection, bleeding or marrow toxicity concern',False),
 ('persistent_vomiting_or_dehydration','Persistent vomiting, poor intake or dehydration',False),
 ('previous_febrile_neutropenia_or_prolonged_myelosuppression','Previous febrile neutropenia or prolonged myelosuppression',False),
 ('cyclosporine_or_tacrolimus','Concomitant cyclosporine or tacrolimus',False),
 ('methoxypsoralen','Concomitant methoxypsoralen',False),
]:boolean(k,label,default)
rules=[]
def rule(id,when,typ,msg,page=2,section='Dose modifications',secondary=False,priority=8):
 rules.append({'id':id,'priority':priority,'when':when,'action':{'type':typ,'components':['dacarbazine'],'message':msg,'dose_calculation':'specialist_review','block_numeric_dose':True},'source':source(page,section,secondary),'explanation':msg})
rule('DTIC_INDICATION',f('indication_eligible','==',False),'consultant_review','NCCP 00464 covers metastatic malignant melanoma. Confirm the indication and intended regimen before prescribing.',1,'Indication')
for key,id,msg in [('pregnancy','PREGNANCY','Pregnancy'),('breastfeeding','BREASTFEEDING','Breastfeeding'),('hypersensitivity','DTIC_HYPERSENSITIVITY','Known hypersensitivity to dacarbazine or excipients'),('severe_liver_disease','DTIC_LIVER','Severe liver disease'),('severe_kidney_disease','DTIC_KIDNEY','Severe kidney disease')]:
 rule(id,f(key,'==',True),'contraindicated',msg+' is an exclusion. Do not administer; obtain specialist reassessment. A numerical dose-modification row does not override this exclusion.',1,'Exclusions',priority=10)
for key,cut,id in [('anc',1.5,'DTIC_ANC'),('platelets',100,'DTIC_PLT')]:
 rule(id,f(key,'<',cut),'delay',('ANC <1.5 ×10⁹/L' if key=='anc' else 'Platelets <100 ×10⁹/L')+': delay one week and repeat FBC. Table 1 permits resumption at 100% only after recovery within normal parameters. Confirm any existing renal/hepatic or previous dose reduction; this is not automatic re-escalation.',2,'Table 1',priority=10)
rule('DTIC_CRCL_EXACT45',f('crcl_ml_min','==',45),'consultant_review','SOURCE AMBIGUITY: CrCl exactly 45 mL/min belongs to both printed NCCP Table 2 bands. Consultant/oncology pharmacy must select and document the intended dose; no automatic percentage is assigned.',2,'Table 2 overlapping 45 boundary')
for id,cond,label,pct in [
 ('DTIC_CRCL_45_60',all_(f('crcl_ml_min','>',45),f('crcl_ml_min','<=',60)), '>45–60',80),
 ('DTIC_CRCL_30_45',all_(f('crcl_ml_min','>=',30),f('crcl_ml_min','<',45)), '30–<45',75),
 ('DTIC_CRCL_LT30',f('crcl_ml_min','<',30), '<30',70)]:
 rule(id,cond,'consultant_review',f'CrCl {label} mL/min: NCCP Table 2 lists {pct}% dacarbazine. Confirm the intended dose with the consultant and oncology pharmacist, prior reductions, hepatic function and the severe-kidney exclusion. Current HPRA SmPC differs for isolated mild/moderate impairment; no calculated dose or automatic permission to treat.',2,'Table 2; reconcile SmPC 4.2/4.3')
rule('DTIC_HEPATIC_REVIEW',f('hepatic_impairment_present','==',True),'consultant_review','NCCP states dacarbazine can be hepatotoxic and to consider dose reduction. It supplies no bilirubin/AST/ALT percentage algorithm. Establish severity and symptoms; severe liver disease excludes treatment. Reconcile the current SmPC and individualized dose with the consultant/pharmacist.',2,'Table 2 hepatic impairment')
rule('DTIC_COMBINED_IMPAIRMENT',all_(f('hepatic_impairment_present','==',True),any_(f('renal_impairment_present','==',True),f('crcl_ml_min','<=',60),f('haemodialysis','==',True))),'consultant_review','Combined renal and hepatic impairment prolongs dacarbazine elimination; the SmPC provides no validated reduction recommendation. Specialist dosing review is required. Do not multiply reductions from separate tables.',2,'4.2 renal/hepatic impairment',True)
rule('DTIC_DIALYSIS',f('haemodialysis','==',True),'consultant_review','NCCP 00464 provides no dialysis dosing schedule and excludes severe kidney disease. Obtain specialist renal/oncology-pharmacy advice before treatment; no dialysis dose is inferred.',2,'Table 2 and p1 exclusions')
rule('DTIC_CYCLE_CAP',f('cycle_number','>',6),'withhold','NCCP 00464 specifies a maximum of 6 cycles, or earlier progression/unacceptable toxicity. Do not automatically issue an additional cycle; review the treatment plan with the consultant.',1,'Treatment',priority=9)
rule('DTIC_PROGRESSION',f('disease_progression','==',True),'withhold','The NCCP course ends at disease progression, unacceptable toxicity or 6 cycles, whichever occurs first. Stop routine continuation and review the next plan with the consultant.',1,'Treatment',priority=9)
rule('DTIC_UNACCEPTABLE_TOXICITY',f('clinically_unacceptable_toxicity','==',True),'withhold','Unacceptable toxicity is an NCCP stopping criterion. Withhold further administration and obtain a consultant plan; NCCP provides no generic CTCAE dose-percentage algorithm.',1,'Treatment',priority=9)
rule('DTIC_MONITORING_MISSING',f('baseline_or_precycle_tests_missing','==',True),'consultant_review','FBC, renal and liver profile are required at baseline and before each cycle. Arrange the missing results and clinical review; a previously normal result is not overall treatment clearance.',2,'Regular tests; p1 baseline')
rule('DTIC_PREVIOUS_REDUCTION',f('previous_dose_reduction','==',True),'consultant_review','Preserve the documented individualized dose history. Table 1 recovery to 100% must not silently reverse an existing renal/hepatic or toxicity reduction; the consultant/pharmacist must confirm the restart dose.',2,'All dose modifications discussed with consultant; Table 1')
rule('DTIC_RESTART_REVIEW',f('restart_requested','==',True),'consultant_review','Restart requires consultant review of blood-count recovery, renal/liver function, prior toxicity, dose history and cycle count. No automatic restart or re-escalation is generated.',2,'Consultant dose review; Table 1')
rule('DTIC_RESTART_UNCONFIRMED',all_(f('restart_requested','==',True),any_(f('source_recovery_complete','!=',True),f('source_recovery_complete','missing',True),f('consultant_restart_approved','!=',True),f('consultant_restart_approved','missing',True))),'withhold','Do not automatically restart while recovery or consultant approval is absent or unconfirmed. Confirm recovery and the individualized dose; existing exclusions and stopping criteria remain controlling.',2,'Consultant dose review; Table 1',priority=9)
rule('DTIC_HSR_CURRENT',f('hypersensitivity_grade','>=',1),'cease','Symptoms of a hypersensitivity reaction require immediate cessation of dacarbazine and urgent clinical assessment. This applies before a severe grade is reached; do not automatically rechallenge.',3,'4.4 immediate cessation for hypersensitivity',True,10)
rule('DTIC_ORGAN_DYSFUNCTION',f('new_hepatic_or_renal_dysfunction_symptoms','==',True),'cease','New symptoms of hepatic or renal functional disorder require immediate cessation of dacarbazine and urgent clinical assessment. Investigate the cause before any further treatment.',3,'4.4 immediate cessation',True,10)
rule('DTIC_VOD',f('hepatic_vod_confirmed_or_history','==',True),'contraindicated','Hepatic veno-occlusive disease during dacarbazine makes further therapy contraindicated. Do not rechallenge simply because current liver tests have recovered.',3,'4.4 hepatic VOD',True,10)
rule('DTIC_EXTRAVASATION',f('suspected_extravasation','==',True),'cease','Stop the dacarbazine infusion immediately and follow the local extravasation protocol. Extravasation can cause severe pain and tissue damage. Any remaining dose requires team assessment and a different vein; do not automatically resume.',2,'4.2 extravasation; 4.4/4.8 tissue injury',True,10)
rule('DTIC_FOTEMUSTINE',f('concomitant_fotemustine','==',True),'withhold','Concomitant fotemustine should not be used: potentially fatal acute respiratory distress syndrome has been reported. Hold the proposed combination and obtain specialist review.',4,'4.5 fotemustine',True,9)
rule('DTIC_PHENYTOIN',f('concomitant_phenytoin','==',True),'consultant_review','Avoid concomitant phenytoin because reduced gastrointestinal absorption may exacerbate convulsions. Reconcile the antiseizure plan with oncology/pharmacy before treatment.',3,'4.4 phenytoin',True)
rule('DTIC_LIVE_VACCINE',f('live_vaccine_planned_or_recent','==',True),'consultant_review','Avoid live vaccines during dacarbazine. SmPC permits consideration no sooner than 3 months after chemotherapy and only after immune-status review. Review any recent exposure or proposed vaccination; this is not a general vaccination schedule.',3,'4.4 live vaccines',True)
rule('DTIC_MARROW_INTERACTION',f('other_marrow_suppression_or_radiotherapy','==',True),'consultant_review','Other myelosuppressive treatment or irradiation can increase marrow toxicity. Review the combined plan and monitoring; do not infer a numeric reduction.',4,'4.5 myelosuppressive treatment/irradiation',True)
rule('DTIC_HEPATOTOXIC_INTERACTION',f('hepatotoxic_drug_or_alcohol','==',True),'consultant_review','Avoid hepatotoxic medicines and alcohol because of dacarbazine hepatotoxicity. Review all prescribed, over-the-counter and complementary medicines with pharmacy.',3,'4.4 hepatotoxic agents/alcohol',True)
rule('DTIC_ANTICOAGULATION',f('inr_monitored_anticoagulant','==',True),'consultant_review','For an anticoagulant monitored by INR, increase INR monitoring as clinically appropriate because cancer and treatment can cause variable interactions. This does not imply INR monitoring for direct oral anticoagulants.',4,'4.5 oral anticoagulants',True)
rule('DTIC_CONTRACEPTION',f('contraception_plan_confirmed','==',False),'consultant_review','Current HPRA SmPC: effective contraception during treatment and for 6 months afterwards for women and 3 months afterwards for men. Discuss fertility preservation before treatment and genetic counselling where relevant. The archived NCCP-linked 100 mg SmPC has outdated male timing.',3,'4.4; 4.6 p4 current March2024 contraception',True)
rule('DTIC_MARROW_SYMPTOMS',f('infection_bleeding_or_marrow_toxicity_concern','==',True),'withhold','Urgently assess infection, bleeding or suspected marrow toxicity before further dacarbazine. Delayed cumulative myelosuppression can occur, with white-cell/platelet nadirs often at 3–4 weeks; a simple day7–14 safe/unsafe calendar is not supported.',6,'4.8 delayed marrow suppression',True,9)
rule('DTIC_VOMITING_DEHYDRATION',f('persistent_vomiting_or_dehydration','==',True),'consultant_review','Assess persistent vomiting, poor intake or dehydration promptly and optimize prescribed antiemetics, hydration and electrolytes. Dacarbazine is high emetogenic risk; no routine premedication does not mean no antiemetics.',2,'High emetogenic potential; p3 premedications')
rule('DTIC_PRIOR_MARROW_TOXICITY',f('previous_febrile_neutropenia_or_prolonged_myelosuppression','==',True),'consultant_review','Review previous febrile neutropenia or prolonged marrow toxicity and the documented dose/support plan. Dacarbazine myelosuppression can be cumulative; NCCP supplies no automatic percentage reduction or universal G-CSF rule for this history.',3,'4.4 cumulative marrow toxicity; 4.8 p6',True)
rule('DTIC_IMMUNOSUPPRESSANTS',f('cyclosporine_or_tacrolimus','==',True),'consultant_review','Cyclosporine or tacrolimus may cause excessive immunosuppression and risk of lymphoproliferation with dacarbazine. Obtain specialist medication review.',4,'4.5 cyclosporine/tacrolimus',True)
rule('DTIC_METHOXYPSORALEN',f('methoxypsoralen','==',True),'consultant_review','Concomitant methoxypsoralen can enhance photosensitization. Review medicines and appropriate sun protection with the team.',4,'4.5 methoxypsoralen',True)
for key in ['alt_ast_uln_multiple','bilirubin_uln_multiple']:
 rule('DTIC_LAB_CONTEXT_'+key.upper(),f(key,'>=',0),'consultant_review','This liver result is contextual: NCCP 00464 supplies no numeric AST/ALT or bilirubin dose-percentage thresholds. Interpret symptoms, trends, severity and other tests with the consultant/pharmacist; do not infer a dose from this result alone.',2,'Table 2 hepatic impairment')
p['rule_engine']['rules']=rules
p['treatment'].update({'duration_type':'fixed_cycles','administration_instructions':['Dacarbazine 850 mg/m² IV on day 1 every 21 days, for up to 6 cycles or earlier progression/unacceptable toxicity.','Use 1000 mL sodium chloride 0.9% over 1 hour under NCCP 00464. Protect solution and infusion set from light.','Antiemetics follow the high-risk NCCP/local supportive-care plan. Do not interpret “no routine premedications” as omitting antiemetics.'],'components':[{'drug':'dacarbazine','dose':{'value':850,'unit':'mg/m²'},'route':'IV','days':[1],'infusion_duration_minutes':60,'note':'1000 mL sodium chloride 0.9%; protect solution and infusion set from light.','source':source(1,'Treatment')}],'source':source(1,'Treatment')})
p['eligibility']=['Metastatic malignant melanoma; treatment initiated and supervised by an oncology specialist.','FBC, renal and liver profile at baseline and before each cycle; assess current symptoms and previous doses.','The NCCP document specifies no numeric ECOG or molecular selection threshold for this regimen.']
p['exclusions']=['Hypersensitivity to dacarbazine or excipients','Pregnancy or breastfeeding','Leukopenia and/or thrombocytopenia; Table 1 provides ANC/platelet treatment-delay thresholds','Severe liver or kidney disease']
p['monitoring']={'baseline':['FBC, renal and liver profile','Assess pregnancy/breastfeeding, contraception/fertility, hypersensitivity, medicines and severe organ disease'],'during':['FBC, renal and liver profile before every cycle','Monitor for cumulative delayed marrow toxicity, infection/bleeding, nausea/vomiting, hydration, hepatic/renal symptoms and infusion-site injury','Confirm planned cycle number, progression, toxicity and prior reductions at each review'],'after':['Report delayed infection, bleeding, new liver/renal symptoms or other serious effects after the last dose. Follow the individualized post-treatment plan.'],'disease_monitoring':'Disease assessment, scans and any additional tests follow the consultant treatment plan; no universal imaging interval or routine tumour-marker panel is specified.','sources':[source(1,'Baseline tests'),source(2,'Regular tests and disease monitoring'),source(3,'4.4',True),source(6,'4.8 delayed marrow toxicity',True)]}
p['pregnancy_prevention']={'women_contraception_after_months':6,'men_contraception_after_months':3,'fertility_preservation_discussion_before_treatment':True,'source':source(3,'4.4 and 4.6 p4',True)}
p['supportive_care']['source_note']='NCCP p2 high emetogenic risk; p3 no routine additional premedication. Use the separate high-risk antiemetic plan; clinical/pharmacy review remains pending.'
p['supportive_care']['source']=source(2,'Emetogenic potential')
p['clinical_governance']['source_conflicts']=[
 {'id':'CRCL_EXACT45_OVERLAP','detail':'NCCP Table 2 prints 45–60 and 30–45. Exactly 45 requires clarification; do not resolve the overlap silently.','source':source(2,'Table 2')},
 {'id':'RENAL_EXCLUSION_VS_REDUCTION','detail':'NCCP and SmPC exclude severe kidney disease while NCCP Table 2 contains a CrCl <30 row. A numeric band alone cannot override the clinical exclusion.','source':source(1,'Exclusions; p2 Table2')},
 {'id':'NCCP_VS_CURRENT_SMPC_RENAL','detail':'NCCP gives renal percentages; the current SmPC says isolated mild/moderate renal or hepatic impairment usually needs no reduction and gives no validated dose recommendation for combined impairment. Specialist reconciliation is required.','source':source(2,'4.2',True)},
 {'id':'NCCP_SCHEDULE_CONTROLS','detail':'Use the NCCP six-cycle cap and one-hour infusion. The current SmPC offers individualized duration and a 15–30 minute infusion; do not silently substitute these for the regimen-specific schedule.','source':source(1,'Treatment')},
 {'id':'ARCHIVED_SMPC_LINK','detail':'NCCP page 3 links an archived 100 mg SmPC. The current marketed 200 mg HPRA SmPC (March 2024) gives contraception after treatment of six months for women and three months for men; the product and source date must remain explicit.','source':source(3,'4.4 current contraception',True)},
 {'id':'NO_GENERIC_GRADE_OR_ECOG_ALGORITHM','detail':'NCCP provides no generic non-haematological CTCAE dose algorithm or numeric ECOG eligibility threshold. Unsupported automatic generic rules are removed; source-specific symptoms and unacceptable toxicity remain assessed.','source':source(2,'Dose modifications')}
]
m=p['metadata'];m.update({'source_url':PDF,'source_document_pages':3,'source_version_date':'2025-04-15','source_review_date':'2030-04-15','review_date':'2030-04-15','source_checked_date':'2026-11-06','source_pdf_sha256':NCCP_SHA,'sactcheck_encoding_version':'0.84.42','clinical_audit_release':'0.84.42','source_documents':[source(1,'NCCP regimen'),source(1,'SmPC current marketed 200 mg product',True)]})
m['validation'].update({'source_document_checked':True,'rule_level_source_reconciliation_status':'source_reconciled_pending_independent_clinical_and_oncology_pharmacy_validation','software_tests_completed':False,'consultant_reviewed':False,'oncology_pharmacy_reviewed':False,'clinical_use_authorised':False,'audit_release':'0.84.42'})
m['encoding_maturity'].update({'level':'source_reconciled_pending_independent_validation','label':'Source reconciled; independent clinical/pharmacy validation pending','source_reconciled':True,'audit_release':'0.84.42','audit_date':'2026-11-06','scope_note':'Current NCCP v3 and HPRA March 2024 SmPC reviewed with explicit source differences. Independent approvals remain pending.'})
(OUT/'00464-proposed.json').write_text(json.dumps(p,indent=2,ensure_ascii=False)+'\n')
print(json.dumps({'output':str(OUT/'00464-proposed.json'),'rules':len(rules),'fields':len(d)}))
