#!/usr/bin/env python3
from __future__ import annotations
import copy, json, re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
VERSION='0.47.0'; CHECKED='2026-07-26'
ANTI='https://healthservice.hse.ie/documents/7152/Classification_Document_for_Systemic_Anti-_Cancer_Therapy_SACT_Induced_Nausea__pWgDCrm.pdf'
CTCAE='https://dctd.cancer.gov/research/ctep-trials/for-sites/adverse-events/ctcae-v5-5x7.pdf'
NET_CAT='https://healthservice.hse.ie/staff/information-healthcare-workers/nccp/neuroendocrine-sact-regimens/'
TA_CAT='https://healthservice.hse.ie/staff/information-healthcare-workers/nccp/tumou-agnostic-therapy-sact-regimens/'

def read(rel): return json.loads((ROOT/rel).read_text())
def write(rel,obj):
 p=ROOT/rel;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
def uniq(seq):
 out=[]
 for x in seq:
  if x not in out: out.append(x)
 return out

def grade_input(label, category='generic', guidance=None):
 return {
  'label':label,'type':'select','required':False,'demo_value':0,'ctcae_version':'5.0','ctcae_category':category,'ctcae_source_url':CTCAE,
  'assessment_guidance':guidance or 'Identify the named adverse event and apply the toxicity-specific CTCAE definition; assess symptoms, intervention and functional impact.',
  'options':[
   {'value':0,'label':'Grade 0','ctcae_grade':0,'description':'No adverse event.'},
   {'value':1,'label':'Grade 1','ctcae_grade':1,'description':'Mild or asymptomatic; observation only and intervention generally not indicated.'},
   {'value':2,'label':'Grade 2','ctcae_grade':2,'description':'Moderate; local or non-invasive intervention may be indicated; may limit instrumental activities of daily living.'},
   {'value':3,'label':'Grade 3','ctcae_grade':3,'description':'Severe or medically significant; hospital care may be indicated; limits self-care activities of daily living.'},
   {'value':4,'label':'Grade 4','ctcae_grade':4,'description':'Life-threatening consequences; urgent intervention required.'}
  ]
 }

def bool_input(label, demo=False): return {'label':label,'type':'boolean','required':False,'demo_value':demo}
def num_input(label,unit=None,step=0.01,demo=1,minv=0):
 d={'label':label,'type':'number','required':False,'min':minv,'step':step,'demo_value':demo}
 if unit:d['unit']=unit
 return d

def select_input(label, options, demo):
 return {'label':label,'type':'select','required':False,'options':[{'value':v,'label':l} for v,l in options],'demo_value':demo}

def rule(id,priority,when,action,message,page='dose-modification section'):
 return {'id':id,'priority':priority,'when':when,'action':{'type':action,'components':['whole_regimen'],'message':message},'source':{'document':'Official NCCP regimen; source-specific decision pathway','page':page},'explanation':message}

def shared_output_templates():
 return {
  'proceed':'No encoded restriction was triggered in the entered domain(s). This is not an overall treatment clearance.',
  'coverage_gap':'Only entered values were assessed; omitted clinically relevant domains remain unassessed.',
  'consultant_review':'The entered value requires protocol-specific Consultant/pharmacy review.',
  'withhold':'Withhold treatment and reassess according to the official NCCP pathway.',
  'delay':'Delay treatment and reassess according to the official NCCP pathway.',
  'delay_then_dose_reduce':'Delay until recovery, then apply the encoded dose-reduction pathway and confirm against the current official source.',
  'withhold_then_reduce':'Withhold until recovery, then apply the encoded dose-reduction pathway and confirm against the current official source.',
  'dose_reduce':'Apply the encoded dose-reduction pathway and confirm against the official source.',
  'proceed_with_caution':'The entered value permits continuation only with the encoded monitoring/caution pathway.',
  'discontinue':'The entered value triggers discontinuation in the encoded pathway.',
  'contraindicated':'The entered value triggers an encoded contraindication/exclusion.',
  'permanently_discontinue':'The entered value triggers permanent discontinuation in the encoded pathway.'
 }

def base_governance(code,version):
 return {'prescriptive_authority':'The treatment plan must be initiated by a Consultant Medical Oncologist or appropriately authorised specialist named in the current NCCP source.','dose_modification_note':'Use the most restrictive applicable rule and confirm all dose changes against the current official NCCP PDF.','disclaimer':f'Decision-support encoding includes NCCP {code} Version {version}. It does not replace the current official regimen, prescribing review, pharmacy verification or independent clinical judgement.'}

def base_rule_engine(rules):
 return {'conflict_policy':'most_restrictive_action_wins','missing_data_policy':'report_unassessed_coverage_gap','actions_ranked_most_to_least_restrictive':['permanently_discontinue','contraindicated','discontinue','cease','omit','withhold_then_reduce','withhold','delay_then_dose_reduce','delay','consultant_review','dose_reduce_two_levels','dose_reduce_one_level','dose_reduce','proceed_with_caution','proceed'],'rules':rules}

def base_tail():
 return {'required_inputs':[],'output_templates':shared_output_templates(),'eligibility':['Indication as listed in the current official NCCP regimen','Performance status and treatment-setting eligibility appropriate to the selected indication','Organ function appropriate for the selected regimen'],'exclusions':['Known hypersensitivity to a regimen component','Pregnancy or breastfeeding where prohibited by the current source','Regimen-specific exclusions encoded in the interactive assessment'],'monitoring':['FBC, renal and liver profile as specified by the current NCCP regimen','Regimen-specific cardiovascular, neurological and toxicity monitoring as applicable'],'dose_modifications':['Source-specific haematological, hepatic and non-haematological pathways are encoded as independently actionable rules.']}

def supportive():
 return {'emetogenic_risk':'oral_minimal_low','script_id':'nccp-oral-minimal-low','mapping_source':'NCCP SACT Antiemetic Guidance V6 (2025)','mapping_source_url':ANTI,'mapping_basis':'Oral agent classified as minimal to low emetogenic risk in the current NCCP source.','mapping_confidence':'source_reconciled_pending_pharmacy_validation','validation_status':'pending_oncology_pharmacy_validation','breakthrough_profile_id':'nccp-breakthrough-general','supportive_medications_pdf_url':ANTI,'supportive_medications_label':'Oral SACT minimal-low guidance'}

# --- Reconcile existing shared NET protocols ---
ever=read('protocols/shared/00320-everolimus-monotherapy.json')
m=ever['metadata'];m.update({'nccp_version':'6','sactcheck_encoding_version':VERSION,'source_checked_date':CHECKED,'tumour_group':'Gastrointestinal','tumour_groups':['Gastrointestinal','Genitourinary','Neuroendocrine'],'indication':'Unresectable or metastatic progressive pancreatic or gastrointestinal neuroendocrine tumours; also advanced renal-cell carcinoma after VEGF-targeted therapy.'})
m['treatment_context']=uniq((m.get('treatment_context') or [])+['neuroendocrine','pancreatic_net','gastrointestinal_net'])
m['neuroendocrine_subgroups']=['pancreatic','gastrointestinal']
m['regimen_card']={'contexts':[
 {'id':'00320a','indication_id':'00320a','intent':'advanced_disease','cycle_length_days':28,'duration_type':'until_progression_or_toxicity','provenance':'official_nccp_pdf_reconciled'},
 {'id':'00320b','indication_id':'00320b','intent':'advanced_disease','cycle_length_days':28,'duration_type':'until_progression_or_toxicity','provenance':'official_nccp_pdf_reconciled'},
 {'id':'00320c','indication_id':'00320c','intent':'advanced_disease','cycle_length_days':28,'duration_type':'until_progression_or_toxicity','provenance':'official_nccp_pdf_reconciled'}],
 'provenance':{'source':'NCCP 00320 v6 / NET and GU catalogues','reviewed':False}}
ever['indications']=[
 {'indication_id':'00320a','description':'Advanced renal-cell carcinoma that has progressed on or after VEGF-targeted therapy.','tumour_groups':['Genitourinary']},
 {'indication_id':'00320b','description':'Unresectable or metastatic, well- or moderately-differentiated pancreatic neuroendocrine tumour in an adult with progressive disease.','tumour_groups':['Neuroendocrine','Gastrointestinal']},
 {'indication_id':'00320c','description':'Unresectable or metastatic, well-differentiated Grade 1 or 2 non-functional gastrointestinal neuroendocrine tumour in an adult with progressive disease.','tumour_groups':['Neuroendocrine','Gastrointestinal']}
]
write('protocols/shared/00320-everolimus-monotherapy.json',ever)

lut=read('protocols/gastrointestinal/00642-lutetium-177-oxodotreotide-lutathera-therapy.json')
m=lut['metadata'];m.update({'sactcheck_encoding_version':VERSION,'source_checked_date':CHECKED,'tumour_group':'Gastrointestinal','tumour_groups':['Gastrointestinal','Neuroendocrine'],'indication':'Unresectable or metastatic progressive, well-differentiated, somatostatin-receptor-positive gastroenteropancreatic neuroendocrine tumours in adults.'})
m['treatment_context']=uniq((m.get('treatment_context') or [])+['neuroendocrine','gastroenteropancreatic_net','radiopharmaceutical'])
m['neuroendocrine_subgroups']=['gastroenteropancreatic']
m['regimen_card']={'contexts':[
 {'id':'00642a-gi','indication_id':'00642a','intent':'advanced_disease','cycle_length_days':56,'planned_cycles':4,'duration_type':'fixed_cycles','duration_text':'4 infusions; interval may extend to 16 weeks for dose-modifying toxicity','provenance':'official_nccp_pdf_reconciled','tumour_groups':['Gastrointestinal']},
 {'id':'00642a-net','indication_id':'00642a','intent':'advanced_disease','cycle_length_days':56,'planned_cycles':4,'duration_type':'fixed_cycles','duration_text':'4 infusions; interval may extend to 16 weeks for dose-modifying toxicity','provenance':'official_nccp_pdf_reconciled','tumour_groups':['Neuroendocrine']}],
 'provenance':{'source':'NCCP 00642 v2 / NET catalogue','reviewed':False}}
lut['indications']=[{'indication_id':'00642a','description':'Unresectable or metastatic, progressive, well-differentiated Grade 1 or 2, somatostatin-receptor-positive gastroenteropancreatic neuroendocrine tumour in an adult.','tumour_groups':['Neuroendocrine','Gastrointestinal']}]
lut['treatment'].update({'cycle_length_days':56,'planned_cycles':4,'duration_type':'fixed_cycles','duration_text':'4 infusions every 8 weeks; interval may extend up to 16 weeks for dose-modifying toxicity','schedule_summary':'Lutetium-177 oxodotreotide 7,400 MBq IV every 8 weeks for 4 infusions'})
write('protocols/gastrointestinal/00642-lutetium-177-oxodotreotide-lutathera-therapy.json',lut)

ent=read('protocols/lung/00702-entrectinib-monotherapy-adult.json')
m=ent['metadata'];m.update({'sactcheck_encoding_version':VERSION,'source_checked_date':CHECKED,'tumour_group':'Lung','tumour_groups':['Lung','Tumour Agnostic Therapy'],'indication':'ROS1-positive advanced NSCLC or an eligible adult NTRK gene-fusion-positive solid tumour.'})
m['treatment_context']=uniq((m.get('treatment_context') or [])+['tumour_agnostic','ntrk_gene_fusion'])
m['tumour_agnostic_subgroups']=['ntrk_gene_fusion']
m['regimen_card']={'contexts':[
 {'id':'00702a','indication_id':'00702a','intent':'advanced_disease','cycle_length_days':1,'duration_type':'until_progression_or_toxicity','provenance':'official_nccp_pdf_reconciled','tumour_groups':['Lung']},
 {'id':'00702b','indication_id':'00702b','intent':'advanced_disease','cycle_length_days':1,'duration_type':'until_progression_or_toxicity','provenance':'official_nccp_pdf_reconciled','tumour_groups':['Tumour Agnostic Therapy']}],
 'provenance':{'source':'NCCP 00702 v2 / Lung and tumour-agnostic catalogues','reviewed':False}}
ent['indications']=[
 {'indication_id':'00702a','description':'ROS1-positive advanced non-small-cell lung cancer not previously treated with a ROS1 inhibitor.','tumour_groups':['Lung']},
 {'indication_id':'00702b','description':'Adult NTRK gene-fusion-positive locally advanced or metastatic solid tumour, or tumour where resection is likely to cause severe morbidity, after no prior NTRK inhibitor and with no satisfactory treatment option.','tumour_groups':['Tumour Agnostic Therapy']}
]
ent['treatment'].update({'duration_type':'until_progression_or_toxicity','duration_text':'Continuous until progression or unacceptable toxicity'})
write('protocols/lung/00702-entrectinib-monotherapy-adult.json',ent)

# --- New NCCP 00327 sunitinib 37.5 mg ---
tmpl=read('protocols/shared/00325-sunitinib-50-mg-therapy-42-day.json')
base_defs=tmpl['input_definitions']
inputs={
 'ecog':copy.deepcopy(base_defs['ecog']),
 'hypersensitivity':copy.deepcopy(base_defs['hypersensitivity']),
 'pregnancy':copy.deepcopy(base_defs['pregnancy']),
 'breastfeeding':copy.deepcopy(base_defs['breastfeeding']),
 'uncontrolled_hypertension':copy.deepcopy(base_defs['uncontrolled_hypertension']),
 'anc':num_input('ANC','×10⁹/L',0.01,2),
 'platelets':num_input('Platelets','×10⁹/L',1,180),
 'child_pugh_class':select_input('Child-Pugh class',[('none','No cirrhosis / not classified'),('A','Child-Pugh A'),('B','Child-Pugh B'),('C','Child-Pugh C')],'none'),
 'other_toxicity_grade':grade_input('Other treatment-related toxicity grade'),
 'hand_foot_syndrome_grade':grade_input('Hand-foot syndrome grade','palmar_plantar_erythrodysaesthesia','Assess painful erythema, swelling, blistering and limitation of instrumental or self-care activities.'),
 'hand_foot_occurrence':select_input('Current hand-foot syndrome occurrence',[(1,'First occurrence'),(2,'Second occurrence'),(3,'Third or later occurrence')],1),
 'lvef_status':select_input('Cardiac/LVEF status',[('normal','No clinically important decline'),('asymptomatic_decline','Asymptomatic LVEF decline'),('symptomatic_decline','Symptomatic LVEF decline / heart failure')],'normal'),
 'significant_cardiovascular_disease_or_lvef_lt55':bool_input('Significant cardiovascular disease and/or LVEF <55%'),
 'qt_risk_present':bool_input('Known QT-prolongation risk, relevant cardiac disease, bradycardia or electrolyte disturbance'),
 'cyp3a4_interaction':select_input('CYP3A4 interaction',[('none','No potent interaction'),('potent_inhibitor','Potent CYP3A4 inhibitor'),('potent_inducer','Potent CYP3A4 inducer')],'none')
}
rules=[
 rule('SUN327_ECOG_GT2',20,{'field':'ecog','operator':'>','value':2},'consultant_review','ECOG is outside the usual NCCP eligibility range of 0–2.','eligibility'),
 rule('SUN327_HYPERSENSITIVITY',100,{'field':'hypersensitivity','operator':'==','value':True},'contraindicated','Known hypersensitivity to sunitinib or an excipient is an exclusion.','exclusions'),
 rule('SUN327_UNCONTROLLED_HTN',100,{'field':'uncontrolled_hypertension','operator':'==','value':True},'contraindicated','Uncontrolled hypertension is an encoded exclusion.','exclusions'),
 rule('SUN327_PREGNANCY_BF',100,{'any':[{'field':'pregnancy','operator':'==','value':True},{'field':'breastfeeding','operator':'==','value':True}]},'contraindicated','Pregnancy or breastfeeding is an encoded exclusion.','exclusions'),
 rule('SUN327_ANC_LT1',90,{'field':'anc','operator':'<','value':1},'delay','ANC below 1.0 ×10⁹/L requires treatment delay.','Table 1'),
 rule('SUN327_PLT_LT75',90,{'field':'platelets','operator':'<','value':75},'delay','Platelets below 75 ×10⁹/L require treatment delay.','Table 1'),
 rule('SUN327_CYP_INHIBITOR',55,{'field':'cyp3a4_interaction','operator':'==','value':'potent_inhibitor'},'consultant_review','Avoid potent CYP3A4 inhibitors where possible; if unavoidable, the NCCP source permits reduction to a minimum of 25 mg daily with close tolerability monitoring.','dose modifications'),
 rule('SUN327_CYP_INDUCER',55,{'field':'cyp3a4_interaction','operator':'==','value':'potent_inducer'},'consultant_review','A potent CYP3A4 inducer requires medication review; the NCCP source describes carefully monitored dose escalation where co-administration cannot be avoided.','dose modifications'),
 rule('SUN327_CHILD_PUGH_C',60,{'field':'child_pugh_class','operator':'==','value':'C'},'dose_reduce','For Child-Pugh C, consider 75% of the original dose and increase only if tolerated.','Table 2'),
 rule('SUN327_TOX_G3',80,{'field':'other_toxicity_grade','operator':'>=','value':3},'delay_then_dose_reduce','Grade 3–4 adverse reactions require delay until Grade 1, then reduction by one dose level.','Table 3'),
 rule('SUN327_HFS_G2_RECURRENT',82,{'all':[{'field':'hand_foot_syndrome_grade','operator':'==','value':2},{'field':'hand_foot_occurrence','operator':'>=','value':2}]},'delay_then_dose_reduce','Recurrent Grade 2 hand-foot syndrome requires delay until Grade 1 or less and dose reduction.','Table 3'),
 rule('SUN327_HFS_G3',84,{'field':'hand_foot_syndrome_grade','operator':'>=','value':3},'delay_then_dose_reduce','Grade 3 hand-foot syndrome requires delay until Grade 1 or less and dose reduction.','Table 3'),
 rule('SUN327_LVEF_ASYMPTOMATIC',84,{'field':'lvef_status','operator':'==','value':'asymptomatic_decline'},'withhold_then_reduce','Asymptomatic LVEF decline requires delay until recovery and consideration of dose reduction.','Table 3'),
 rule('SUN327_LVEF_SYMPTOMATIC',95,{'field':'lvef_status','operator':'==','value':'symptomatic_decline'},'discontinue','Symptomatic LVEF decline requires discontinuation of sunitinib.','Table 3'),
 rule('SUN327_CARDIAC_CAUTION',45,{'field':'significant_cardiovascular_disease_or_lvef_lt55','operator':'==','value':True},'consultant_review','Significant cardiovascular disease and/or LVEF below 55% requires specialist risk review.','cautions'),
 rule('SUN327_QT_CAUTION',45,{'field':'qt_risk_present','operator':'==','value':True},'consultant_review','Known QT-prolongation risk, relevant cardiac disease, bradycardia or electrolyte disturbance requires ECG/electrolyte and medication review.','cautions')
]
sun={
 'schema_version':'2.0.0','protocol_id':'nccp-00327-v5','file_name':'00327-sunitinib-37-5-mg-therapy-28-day.json','status':'encoded_prototype_pending_clinical_and_pharmacy_validation',
 'metadata':{
  'nccp_regimen_code':'00327','nccp_version':'5','tumour_group':'Neuroendocrine','tumour_groups':['Neuroendocrine'],'title':'Sunitinib 37.5 mg Therapy – 28 day','short_title':'Sunitinib 37.5 mg Therapy – 28 day','indication':'Unresectable or metastatic, well-differentiated pancreatic neuroendocrine tumour with disease progression in an adult.','source_url':'https://healthservice.hse.ie/documents/6919/327_V5_SUNitinib_37.5mg.pdf','source_document_pages':5,'sactcheck_encoding_version':VERSION,'source_checked_date':CHECKED,'partial_assessment_supported':True,'partial_assessment_note':'Any independently actionable entered value is assessed; omitted domains remain unassessed and do not block a partial result.','neuroendocrine_subgroups':['pancreatic'],'treatment_context':['neuroendocrine','pancreatic_net','advanced_disease'],'treatment_class':['oral_targeted_therapy','targeted_or_biologic_therapy'],'cytotoxic':False,'catalogue_section':'targeted_therapy','catalogue_section_label':'Oral targeted therapy','catalog':{'enabled':True},'drugs':['sunitinib'],'common_trade_names':['Sutent'],'migration':{'mode':'live_json'},'validation':{'official_catalogue_and_source_link_checked':True,'source_document_checked':True,'software_tests_completed':True,'consultant_reviewed':False,'oncology_pharmacy_reviewed':False,'clinical_use_authorised':False,'rule_level_source_reconciliation_status':'pending_independent_clinical_and_oncology_pharmacy_validation'},'regimen_card':{'contexts':[{'id':'00327a','indication_id':'00327a','intent':'advanced_disease','cycle_length_days':28,'duration_type':'until_progression_or_toxicity','duration_text':'Continuous daily treatment until progression or unacceptable toxicity','provenance':'official_nccp_pdf_reconciled'}],'provenance':{'source':'NCCP 00327 v5 / Neuroendocrine catalogue','reviewed':False}}
 },
 'clinical_governance':base_governance('00327','5'),
 'indications':[{'indication_id':'00327a','description':'Unresectable or metastatic, well-differentiated pancreatic neuroendocrine tumour with disease progression in an adult.','tumour_groups':['Neuroendocrine']}],
 'treatment':{'cycle_length_days':28,'schedule_summary':'Sunitinib 37.5 mg orally once daily continuously','duration_type':'until_progression_or_toxicity','duration_text':'Continue until disease progression or unacceptable toxicity','drugs':['sunitinib']},
 'input_definitions':inputs,'rule_engine':base_rule_engine(rules),'supportive_care':supportive(),**base_tail()
}
write('protocols/neuroendocrine/00327-sunitinib-37-5-mg-therapy-28-day.json',sun)

# --- New NCCP 00758 larotrectinib adult ---
ent_defs=ent['input_definitions']
inputs={
 'ecog':copy.deepcopy(ent_defs['ecog']),
 'ntrk_fusion_confirmed':bool_input('NTRK gene fusion confirmed by a validated test method',True),
 'hypersensitivity':copy.deepcopy(ent_defs['hypersensitivity']),
 'active_cardiovascular_disease':bool_input('Clinically significant active cardiovascular disease'),
 'symptomatic_brain_metastases':bool_input('Symptomatic brain metastases'),
 'active_uncontrolled_infection':bool_input('Active uncontrolled systemic bacterial, viral or fungal infection'),
 'pregnancy':copy.deepcopy(ent_defs['pregnancy']),
 'breastfeeding':copy.deepcopy(ent_defs['breastfeeding']),
 'strong_moderate_cyp3a4_pgp_inducer':bool_input('Strong or moderate CYP3A4/P-gp inducer co-administered'),
 'prior_ntrk_inhibitor':bool_input('Prior NTRK-inhibitor treatment'),
 'major_surgery_within_2_weeks':bool_input('Major surgery within 2 weeks before cycle 1 day 1'),
 'strong_cyp3a4_inhibitor':bool_input('Strong CYP3A4 inhibitor co-administered'),
 'other_toxicity_grade':grade_input('Other larotrectinib-related adverse-reaction grade'),
 'toxicity_not_resolved_within_4_weeks':bool_input('Grade 3–4 adverse reaction has not resolved within 4 weeks'),
 'three_dose_modifications_not_tolerated':bool_input('Unable to tolerate larotrectinib after three dose modifications'),
 'child_pugh_class':select_input('Child-Pugh class',[('none','No cirrhosis / not classified'),('A','Child-Pugh A'),('B','Child-Pugh B'),('C','Child-Pugh C')],'none'),
 'alt_ast_uln_multiple':num_input('Highest ALT or AST multiple of ULN','×ULN',0.01,1),
 'bilirubin_uln_multiple':num_input('Bilirubin multiple of ULN','×ULN',0.01,1),
 'grade4_lft_after_resumption':bool_input('Grade 4 ALT/AST elevation occurred after resuming treatment'),
 'hepatic_recurrence_after_resumption':bool_input('Severe hepatic adverse reaction recurred after resuming treatment')
}
rules=[
 rule('LARO_ECOG_GT2',20,{'field':'ecog','operator':'>','value':2},'consultant_review','ECOG is outside the usual NCCP eligibility range of 0–2.','eligibility'),
 rule('LARO_NTRK_NOT_CONFIRMED',70,{'field':'ntrk_fusion_confirmed','operator':'==','value':False},'consultant_review','A validated NTRK gene-fusion result is required for the encoded indication.','eligibility'),
 rule('LARO_HYPERSENSITIVITY',100,{'field':'hypersensitivity','operator':'==','value':True},'contraindicated','Known hypersensitivity to larotrectinib or an excipient is an exclusion.','exclusions'),
 rule('LARO_CARDIOVASCULAR',100,{'field':'active_cardiovascular_disease','operator':'==','value':True},'contraindicated','Clinically significant active cardiovascular disease is an encoded exclusion.','exclusions'),
 rule('LARO_SYMPTOMATIC_BRAIN_METS',100,{'field':'symptomatic_brain_metastases','operator':'==','value':True},'contraindicated','Symptomatic brain metastases are an encoded exclusion.','exclusions'),
 rule('LARO_INFECTION',100,{'field':'active_uncontrolled_infection','operator':'==','value':True},'contraindicated','Active uncontrolled systemic infection is an encoded exclusion.','exclusions'),
 rule('LARO_PREGNANCY_BF',100,{'any':[{'field':'pregnancy','operator':'==','value':True},{'field':'breastfeeding','operator':'==','value':True}]},'contraindicated','Pregnancy or lactation is an encoded exclusion.','exclusions'),
 rule('LARO_CYP_INDUCER',100,{'field':'strong_moderate_cyp3a4_pgp_inducer','operator':'==','value':True},'contraindicated','Co-administration with a strong or moderate CYP3A4/P-gp inducer is an encoded exclusion.','exclusions'),
 rule('LARO_PRIOR_NTRK',100,{'field':'prior_ntrk_inhibitor','operator':'==','value':True},'contraindicated','Prior NTRK-inhibitor treatment is an encoded exclusion.','exclusions'),
 rule('LARO_RECENT_SURGERY',100,{'field':'major_surgery_within_2_weeks','operator':'==','value':True},'contraindicated','Major surgery within 2 weeks before cycle 1 day 1 is an encoded exclusion.','exclusions'),
 rule('LARO_CYP_INHIBITOR',65,{'field':'strong_cyp3a4_inhibitor','operator':'==','value':True},'dose_reduce','If a strong CYP3A4 inhibitor is necessary, reduce larotrectinib by 50% and resume the prior dose after 3–5 inhibitor half-lives.','caution'),
 rule('LARO_TOX_G2',30,{'field':'other_toxicity_grade','operator':'==','value':2},'proceed_with_caution','Grade 2 adverse reactions may permit continued dosing with close monitoring for worsening.','dose modifications'),
 rule('LARO_TOX_G3_4',80,{'field':'other_toxicity_grade','operator':'>=','value':3},'withhold_then_reduce','Grade 3–4 non-hepatic adverse reactions require withholding until baseline or Grade 1, then resumption at the next dose modification if recovery occurs within 4 weeks.','dose modifications'),
 rule('LARO_TOX_UNRESOLVED_4W',96,{'field':'toxicity_not_resolved_within_4_weeks','operator':'==','value':True},'permanently_discontinue','Permanently discontinue if a Grade 3–4 adverse reaction does not resolve within 4 weeks.','dose modifications'),
 rule('LARO_THREE_REDUCTIONS',96,{'field':'three_dose_modifications_not_tolerated','operator':'==','value':True},'permanently_discontinue','Permanently discontinue if larotrectinib cannot be tolerated after three dose modifications.','Table 1'),
 rule('LARO_CHILD_PUGH_BC',65,{'field':'child_pugh_class','operator':'in','value':['B','C']},'dose_reduce','Reduce the starting larotrectinib dose by 50% for Child-Pugh B or C hepatic impairment.','Table 2'),
 rule('LARO_LFT_G2',45,{'all':[{'field':'alt_ast_uln_multiple','operator':'>','value':3},{'field':'alt_ast_uln_multiple','operator':'<=','value':5}]},'consultant_review','ALT/AST above 3 and up to 5 ×ULN requires frequent serial laboratory evaluation and review for interruption or reduction.','Table 3'),
 rule('LARO_LFT_GT5_BILI_LT2',85,{'all':[{'field':'alt_ast_uln_multiple','operator':'>','value':5},{'field':'bilirubin_uln_multiple','operator':'<','value':2}]},'withhold_then_reduce','ALT/AST above 5 ×ULN with bilirubin below 2 ×ULN requires withholding and frequent monitoring; resume at the next dose modification only after recovery and benefit–risk review.','Table 3'),
 rule('LARO_HY_LAW_PATTERN',92,{'all':[{'field':'alt_ast_uln_multiple','operator':'>=','value':3},{'field':'bilirubin_uln_multiple','operator':'>=','value':2}]},'withhold','ALT/AST at least 3 ×ULN with bilirubin at least 2 ×ULN requires withholding, frequent monitoring and consideration of permanent discontinuation.','Table 3'),
 rule('LARO_G4_AFTER_RESUME',98,{'field':'grade4_lft_after_resumption','operator':'==','value':True},'permanently_discontinue','Permanently discontinue for Grade 4 ALT/AST elevation after treatment resumption.','Table 3'),
 rule('LARO_HEPATIC_RECURRENCE',98,{'field':'hepatic_recurrence_after_resumption','operator':'==','value':True},'permanently_discontinue','Permanently discontinue if the severe hepatic adverse reaction recurs after resuming treatment.','Table 3')
]
laro={
 'schema_version':'2.0.0','protocol_id':'nccp-00758-v3','file_name':'00758-larotrectinib-monotherapy-adult.json','status':'encoded_prototype_pending_clinical_and_pharmacy_validation',
 'metadata':{
  'nccp_regimen_code':'00758','nccp_version':'3','tumour_group':'Tumour Agnostic Therapy','tumour_groups':['Tumour Agnostic Therapy'],'title':'Larotrectinib Monotherapy – Adult','short_title':'Larotrectinib Monotherapy – Adult','indication':'Adult NTRK gene-fusion-positive locally advanced or metastatic solid tumour, or tumour where resection is likely to cause severe morbidity, with no satisfactory treatment option.','source_url':'https://healthservice.hse.ie/documents/6788/758_V3_Larotrectinib_Therapy_Adult.pdf','source_document_pages':6,'sactcheck_encoding_version':VERSION,'source_checked_date':CHECKED,'partial_assessment_supported':True,'partial_assessment_note':'Any independently actionable entered value is assessed; omitted domains remain unassessed and do not block a partial result.','tumour_agnostic_subgroups':['ntrk_gene_fusion'],'treatment_context':['tumour_agnostic','ntrk_gene_fusion','advanced_disease'],'treatment_class':['oral_targeted_therapy','targeted_or_biologic_therapy'],'cytotoxic':False,'catalogue_section':'targeted_therapy','catalogue_section_label':'Molecularly targeted therapy','catalog':{'enabled':True},'drugs':['larotrectinib'],'common_trade_names':['Vitrakvi'],'migration':{'mode':'live_json'},'validation':{'official_catalogue_and_source_link_checked':True,'source_document_checked':True,'software_tests_completed':True,'consultant_reviewed':False,'oncology_pharmacy_reviewed':False,'clinical_use_authorised':False,'rule_level_source_reconciliation_status':'pending_independent_clinical_and_oncology_pharmacy_validation'},'regimen_card':{'contexts':[{'id':'00758a','indication_id':'00758a','intent':'advanced_disease','cycle_length_days':1,'duration_type':'until_progression_or_toxicity','duration_text':'Continuous until disease progression or unacceptable toxicity','provenance':'official_nccp_pdf_reconciled'}],'provenance':{'source':'NCCP 00758 v3 / tumour-agnostic catalogue','reviewed':False}}
 },
 'clinical_governance':base_governance('00758','3'),
 'indications':[{'indication_id':'00758a','description':'Adult NTRK gene-fusion-positive locally advanced or metastatic solid tumour, or tumour where surgery is likely to cause severe morbidity, with no satisfactory treatment option.','tumour_groups':['Tumour Agnostic Therapy']}],
 'treatment':{'cycle_length_days':1,'schedule_summary':'Larotrectinib 100 mg orally twice daily continuously','duration_type':'until_progression_or_toxicity','duration_text':'Continue until disease progression or unacceptable toxicity','drugs':['larotrectinib']},
 'input_definitions':inputs,'rule_engine':base_rule_engine(rules),'supportive_care':supportive(),**base_tail()
}
write('protocols/tumour-agnostic/00758-larotrectinib-monotherapy-adult.json',laro)

# UI: add dedicated NET and tumour-agnostic tiles and context resolution.
p=ROOT/'js/tissue-ui.js';text=p.read_text()
if 'net:' not in text:
 text=text.replace("    headneck: '<svg", "    net: '<svg viewBox=\"0 0 64 64\" aria-hidden=\"true\"><circle cx=\"20\" cy=\"22\" r=\"8\"/><circle cx=\"44\" cy=\"18\" r=\"6\"/><circle cx=\"40\" cy=\"44\" r=\"9\"/><circle cx=\"17\" cy=\"46\" r=\"5\"/><path d=\"M27 23l11-3M24 29l11 10M22 40l-1-10M39 35l3-11\"/></svg>',\n    agnostic: '<svg viewBox=\"0 0 64 64\" aria-hidden=\"true\"><circle cx=\"32\" cy=\"32\" r=\"23\"/><circle cx=\"32\" cy=\"32\" r=\"14\"/><circle cx=\"32\" cy=\"32\" r=\"5\"/><path d=\"M32 4v9M32 51v9M4 32h9M51 32h9\"/></svg>',\n    headneck: '<svg",1)
needle='    { id: "headneck", label: "Head & Neck", short: "H&N", color: "#C49A3A", values: ["Head and Neck", "Head & Neck"], icon: "headneck", description: "Head-and-neck systemic therapy and chemoradiation protocols." }'
replacement=needle+',\n    { id: "net", label: "Neuroendocrine", short: "NET", color: "#3C8D7A", values: ["Neuroendocrine"], icon: "net", description: "Pancreatic and gastroenteropancreatic neuroendocrine tumour protocols." },\n    { id: "agnostic", label: "Tumour Agnostic", short: "Agnostic", color: "#68758A", values: ["Tumour Agnostic Therapy"], icon: "agnostic", description: "Biomarker-defined treatment independent of the anatomical primary site." }'
if 'id: "net"' not in text: text=text.replace(needle,replacement)
p.write_text(text)

p=ROOT/'js/protocol-context.js';text=p.read_text()
text=text.replace('    "Head and Neck"\n  ];','    "Head and Neck",\n    "Neuroendocrine",\n    "Tumour Agnostic Therapy"\n  ];')
text=text.replace('    ["headneck", "Head and Neck"]\n  ]);','    ["headneck", "Head and Neck"],\n    ["neuroendocrine", "Neuroendocrine"],\n    ["net", "Neuroendocrine"],\n    ["tumour agnostic therapy", "Tumour Agnostic Therapy"],\n    ["tumor agnostic therapy", "Tumour Agnostic Therapy"],\n    ["tumour agnostic", "Tumour Agnostic Therapy"],\n    ["tumor agnostic", "Tumour Agnostic Therapy"]\n  ]);')
text=text.replace('    if (/(^|[-_])(hn|headneck)([-_]|$)/.test(id)) found.push("Head and Neck");','    if (/(^|[-_])(hn|headneck)([-_]|$)/.test(id)) found.push("Head and Neck");\n    if (/(^|[-_])(net|neuroendocrine)([-_]|$)/.test(id)) found.push("Neuroendocrine");\n    if (/(^|[-_])(ta|agnostic|ntrk)([-_]|$)/.test(id)) found.push("Tumour Agnostic Therapy");')
text=text.replace('    if (/head and neck|head-and-neck|\\bhnscc\\b/.test(text)) found.push("Head and Neck");','    if (/head and neck|head-and-neck|\\bhnscc\\b/.test(text)) found.push("Head and Neck");\n    if (/neuroendocrine|\\bpnet\\b|gastroenteropancreatic/.test(text)) found.push("Neuroendocrine");\n    if (/ntrk gene[ -]?fusion|tumou?r agnostic/.test(text)) found.push("Tumour Agnostic Therapy");')
p.write_text(text)

# Search aliases.
p=ROOT/'js/drug-aliases.js';text=p.read_text();marker='  const ENTRIES = Object.freeze([\n';ins=''
for term,aliases in [('sunitinib',['Sutent']),('larotrectinib',['Vitrakvi']),('entrectinib',['Rozlytrek']),('lutetium-177 oxodotreotide',['Lutathera'])]:
 if f'terms: ["{term}"]' not in text: ins+=f'    {{ terms: ["{term}"], aliases: {json.dumps(aliases)} }},\n'
text=text.replace(marker,marker+ins,1);text=re.sub(r'version: "[0-9.]+"',f'version: "{VERSION}"',text);p.write_text(text)

# Build index before updating risk/sidecar.
print('Created/reconciled NET and tumour-agnostic protocol files.')
