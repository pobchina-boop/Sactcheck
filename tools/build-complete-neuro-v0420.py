#!/usr/bin/env python3
from __future__ import annotations
import copy, json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'protocols' / 'neuro-oncology'
OUT.mkdir(parents=True, exist_ok=True)

SOURCE_CHECKED = '2026-07-25'
CTCAE_URL = 'https://dctd.cancer.gov/research/ctep-trials/for-sites/adverse-events/ctcae-v5-5x7.pdf'
ANTIEMETIC_URL = 'https://healthservice.hse.ie/documents/7152/Classification_Document_for_Systemic_Anti-_Cancer_Therapy_SACT_Induced_Nausea__pWgDCrm.pdf'

INVENTORY = {
 '00813': dict(version='2', title='Bevacizumab 5 mg/kg Monotherapy – 14 Day', url='https://healthservice.hse.ie/documents/6869/813_V2_Bevacizumab_5.pdf', published='2023-05-02', review='2029-07-24', indication='Treatment of recurrent malignant glioblastoma multiforme.', subgroup='recurrent_glioblastoma', cycle=14, drugs=['bevacizumab'], aliases=['Avastin']),
 '00806': dict(version='2', title='Cisplatin, Lomustine and Vincristine (CLV) Therapy', url='https://healthservice.hse.ie/documents/6870/806_V2_CLV_Therapy.pdf', published='2023-05-15', review='2029-07-18', indication='Adult high-risk medulloblastoma or other primitive neuro-ectodermal tumour (PNET).', subgroup='medulloblastoma_pnet', cycle=42, drugs=['cisplatin','lomustine','vincristine'], aliases=['CLV','CCNU','Oncovin','Platinol']),
 '00379': dict(version='4', title='Procarbazine, Lomustine and Vincristine (PCV) Therapy – 42 Day', url='https://healthservice.hse.ie/documents/6971/379_V4_PCV.pdf', published='2016-12-01', review='2027-06-28', indication='Adjuvant treatment of Grade II glioma after radiotherapy or palliative treatment of recurrent high-grade glioma.', subgroup='glioma_pcv', cycle=42, drugs=['procarbazine','lomustine','vincristine'], aliases=['PCV','CCNU','Matulane','Oncovin']),
 '00658': dict(version='2', title='Procarbazine, Lomustine and Vincristine (PCV) Therapy – 56 Day', url='https://healthservice.hse.ie/documents/6996/658_V2_PCV-8wk.pdf', published='2021-08-20', review='2027-06-28', indication='Adjuvant treatment of Grade II glioma administered after radiotherapy.', subgroup='glioma_pcv_adjuvant', cycle=56, drugs=['procarbazine','lomustine','vincristine'], aliases=['PCV','CCNU','Matulane','Oncovin']),
 '00805': dict(version='2', title='Lomustine 130 mg/m² Therapy', url='https://healthservice.hse.ie/documents/6871/805_V2_Lomustine_130mg_Therapy.pdf', published='2023-05-15', review='2029-07-18', indication='Recurrent malignant glioma.', subgroup='recurrent_malignant_glioma', cycle=42, drugs=['lomustine'], aliases=['CCNU']),
 '00804': dict(version='2', title='Lomustine and Bevacizumab 7.5 mg/kg Therapy', url='https://healthservice.hse.ie/documents/6872/804_V2_Lomustine_and_bevacizumab_7.5.pdf', published='2023-05-15', review='2029-07-18', indication='Treatment of recurrent malignant glioblastoma.', subgroup='recurrent_glioblastoma', cycle=42, drugs=['lomustine','bevacizumab'], aliases=['CCNU','Avastin']),
 '00742': dict(version='3', title='Lomustine and Bevacizumab 5 mg/kg Therapy', url='https://healthservice.hse.ie/documents/6874/742_V3_Lomustine_and_Bevacizumab_5.pdf', published='2022-12-19', review='2029-01-19', indication='Treatment of recurrent malignant glioblastoma.', subgroup='recurrent_glioblastoma', cycle=42, drugs=['lomustine','bevacizumab'], aliases=['CCNU','Avastin']),
 '00342': dict(version='4', title='Temozolomide Recurrent Therapy', url='https://healthservice.hse.ie/documents/6961/342_V4_Temozolomide_Recurrent_Therapy_.pdf', published='2016-06-20', review='2030-07-23', indication='Adult patients with recurrent or progressive Grade III or IV malignant glioma after standard therapy.', subgroup='recurrent_high_grade_glioma', cycle=28, drugs=['temozolomide'], aliases=['Temodal']),
 '00334': dict(version='4', title='Temozolomide with Radiotherapy and Adjuvant Therapy', url='https://healthservice.hse.ie/documents/6960/334_V4_Temozolomide_RT_and_Adjuvant_Therapy.pdf', published='2016-06-20', review='2030-07-23', indication='Adult patients with newly diagnosed glioblastoma multiforme treated with concomitant radiotherapy followed by adjuvant temozolomide.', subgroup='newly_diagnosed_glioblastoma', cycle=28, drugs=['temozolomide'], aliases=['Temodal','Stupp regimen']),
 '00461': dict(version='3', title='Temozolomide with Radiotherapy and Adjuvant Therapy – Patients Greater Than 65 Years', url='https://healthservice.hse.ie/documents/6977/461_V3_Temozolomide_RT_and_Adjuvant_Therapy_greater_than65_years_.pdf', published='2018-02-16', review='2030-06-13', indication='Adults greater than 65 years with newly diagnosed glioblastoma multiforme who are not suitable for the standard radiotherapy regimen with temozolomide.', subgroup='older_adult_glioblastoma', cycle=28, drugs=['temozolomide'], aliases=['Temodal','Short-course Stupp regimen']),
}

GRADE_DESC = {
 'generic': {
  0:'No adverse event.', 1:'Mild or asymptomatic; observation only and intervention generally not indicated.', 2:'Moderate; minimal, local or non-invasive intervention may be indicated; may limit instrumental activities of daily living.', 3:'Severe or medically significant but not immediately life-threatening; hospital care may be indicated; limits self-care activities of daily living.', 4:'Life-threatening consequences; urgent intervention required.'},
 'neuropathy': {
  0:'No peripheral sensory or motor neuropathy.',1:'Asymptomatic or mild symptoms without functional limitation.',2:'Moderate symptoms limiting instrumental activities of daily living.',3:'Severe symptoms limiting self-care activities of daily living.',4:'Life-threatening neurological consequences; urgent intervention required.'},
 'hypertension': {
  0:'No treatment-emergent hypertension.',1:'Transient or mild elevation; antihypertensive treatment not indicated.',2:'Persistent/recurrent elevation requiring initiation or adjustment of one antihypertensive agent.',3:'Severe elevation requiring more intensive or multi-drug treatment.',4:'Life-threatening consequences such as hypertensive crisis; urgent intervention required.'},
 'haemorrhage': {
  0:'No bleeding.',1:'Mild bleeding; intervention not indicated.',2:'Moderate bleeding requiring medical treatment or minor intervention.',3:'Severe bleeding requiring transfusion, invasive intervention or hospital care.',4:'Life-threatening bleeding; urgent intervention required.'},
 'fistula': {
  0:'No fistula.',1:'Asymptomatic; clinical or diagnostic observations only.',2:'Symptomatic; non-invasive intervention indicated.',3:'Severe symptoms; invasive intervention indicated.',4:'Life-threatening consequences; urgent intervention required.'},
 'thromboembolism': {
  0:'No thromboembolic event.',1:'Grade 1 is generally not used for clinically confirmed venous or arterial thromboembolism.',2:'Medical intervention such as anticoagulation is indicated without urgent instability.',3:'Urgent medical intervention or hospital care is indicated.',4:'Life-threatening haemodynamic or neurological consequences; urgent intervention required.'},
 'nausea': {
  0:'No nausea.',1:'Loss of appetite without alteration in eating habits.',2:'Oral intake decreased without significant weight loss, dehydration or malnutrition.',3:'Inadequate oral caloric or fluid intake; tube feeding, total parenteral nutrition or hospitalisation may be indicated.',4:'Life-threatening consequences; urgent intervention required.'},
 'vomiting': {
  0:'No vomiting.',1:'One to two episodes separated by at least five minutes in 24 hours.',2:'Three to five episodes separated by at least five minutes in 24 hours.',3:'Six or more episodes in 24 hours, tube feeding/TPN or hospitalisation indicated.',4:'Life-threatening consequences; urgent intervention required.'},
 'rash': {
  0:'No rash.',1:'Mild rash with limited extent and minimal symptoms.',2:'Moderate rash or symptoms limiting instrumental activities of daily living.',3:'Severe rash, extensive involvement or limitation of self-care activities of daily living.',4:'Life-threatening cutaneous reaction; urgent intervention required.'},
}

def grade(label, category='generic', guidance=None):
    desc = GRADE_DESC.get(category, GRADE_DESC['generic'])
    return {'label':label,'type':'select','required':False,'options':[{'value':g,'label':f'Grade {g}','ctcae_grade':g,'description':desc[g]} for g in range(5)],'demo_value':0,'ctcae_version':'5.0','ctcae_category':category,'ctcae_source_url':CTCAE_URL,'assessment_guidance':guidance or 'Identify the named adverse event and grade it using objective findings, intervention required and functional impact.'}

def num(label,demo,unit='',step=0.1,minv=0,maxv=None):
    d={'label':label,'type':'number','required':False,'min':minv,'step':step,'demo_value':demo}
    if unit:d['unit']=unit
    if maxv is not None:d['max']=maxv
    return d

def boolean(label,demo=False,help_text=None):
    d={'label':label,'type':'boolean','required':False,'demo_value':demo}
    if help_text:d['help_text']=help_text
    return d

def select(label, options, demo, help_text=None):
    d={'label':label,'type':'select','required':False,'options':[{'value':v,'label':l} for v,l in options],'demo_value':demo}
    if help_text:d['help_text']=help_text
    return d

def renal(label, options, demo):
    d=select(label,options,demo); d['renal_input']={'mode':'protocol_specific_band','exact_value_required':False}; return d

def rule(rid, field, op, value, action, message, priority=6, components=None, page='Dose modifications'):
    return {'id':rid,'priority':priority,'when':{'field':field,'operator':op,'value':value},'action':{'type':action,'components':components or ['whole_regimen'],'message':message},'source':{'document':'Current official NCCP regimen','page':page},'explanation':message}

def all_rule(rid, leaves, action, message, priority=7, components=None, page='Dose modifications'):
    return {'id':rid,'priority':priority,'when':{'all':leaves},'action':{'type':action,'components':components or ['whole_regimen'],'message':message},'source':{'document':'Current official NCCP regimen','page':page},'explanation':message}

def any_rule(rid, leaves, action, message, priority=8, components=None, page='Eligibility / exclusions'):
    return {'id':rid,'priority':priority,'when':{'any':leaves},'action':{'type':action,'components':components or ['whole_regimen'],'message':message},'source':{'document':'Current official NCCP regimen','page':page},'explanation':message}

def common_inputs():
    return {
      'ecog':select('ECOG performance status',[(0,'0'),(1,'1'),(2,'2'),(3,'3'),(4,'4')],0),
      'hypersensitivity':boolean('Known hypersensitivity to a regimen component'),
      'pregnancy':boolean('Pregnant'),
      'breastfeeding':boolean('Breastfeeding'),
      'active_infection':boolean('Active infection requiring treatment'),
    }

def common_rules(ecog_max=2):
    return [
      rule('ECOG_OUTSIDE_PATHWAY','ecog','>',ecog_max,'consultant_review',f'ECOG above {ecog_max} is outside the routine encoded eligibility pathway; confirm individual benefit–risk with the prescribing consultant.',8,page='Eligibility'),
      rule('HYPERSENSITIVITY','hypersensitivity','==',True,'contraindicated','Known hypersensitivity to a regimen component is an exclusion.',10,page='Exclusions'),
      rule('PREGNANCY','pregnancy','==',True,'contraindicated','Pregnancy is an exclusion or requires urgent specialist review under the current regimen.',10,page='Exclusions'),
      rule('BREASTFEEDING','breastfeeding','==',True,'contraindicated','Breastfeeding is an exclusion under the current regimen.',10,page='Exclusions'),
      rule('ACTIVE_INFECTION','active_infection','==',True,'withhold','Active clinically significant infection requires treatment and reassessment before SACT.',9,page='Clinical assessment'),
    ]

def metadata(code):
    x=INVENTORY[code]
    classification = ['antiangiogenic_therapy'] if x['drugs']==['bevacizumab'] else ['cytotoxic_chemotherapy']
    if 'bevacizumab' in x['drugs'] and len(x['drugs'])>1: classification=['cytotoxic_chemotherapy','antiangiogenic_therapy']
    return {
      'nccp_regimen_code':code,'nccp_version':x['version'],'title':x['title'],'short_title':x['title'],'indication':x['indication'],
      'published_date':x['published'],'review_date':x['review'],'source_url':x['url'],'source_document_pages':None,
      'source_checked_date':SOURCE_CHECKED,'sactcheck_encoding_version':'0.42.0','partial_assessment_supported':True,
      'partial_assessment_note':'Any independently actionable entered value is assessed; omitted domains remain unassessed and do not block a partial result.',
      'neuro_subgroup':x['subgroup'],'treatment_context':['neuro_oncology',x['subgroup']], 'treatment_class':classification,
      'cytotoxic': any(d!='bevacizumab' for d in x['drugs']), 'catalogue_section': section_for(code), 'catalogue_section_label': section_label(code),
      'catalog':{'enabled':True},'drugs':x['drugs'],'common_trade_names':x['aliases'],'migration':{'mode':'live_json'},
      'validation':{'official_catalogue_and_source_link_checked':True,'rule_level_source_reconciliation_status':'pending_independent_clinical_and_oncology_pharmacy_validation','software_tests_completed':True,'consultant_reviewed':False,'oncology_pharmacy_reviewed':False,'clinical_use_authorised':False},
      'tumour_group':'Neuro-oncology','tumour_groups':['Neuro-oncology']
    }

def section_for(code):
    if code=='00806':return 'medulloblastoma_pnet'
    if code in {'00379','00658'}:return 'lower_grade_and_recurrent_glioma'
    if code in {'00334','00461'}:return 'newly_diagnosed_glioblastoma'
    return 'recurrent_high_grade_glioma'

def section_label(code):
    return {'medulloblastoma_pnet':'Medulloblastoma / PNET','lower_grade_and_recurrent_glioma':'Glioma / PCV','newly_diagnosed_glioblastoma':'Newly diagnosed glioblastoma','recurrent_high_grade_glioma':'Recurrent high-grade glioma'}[section_for(code)]

def make_protocol(code, treatment, inputs, rules, supportive, indications=None):
    x=INVENTORY[code]
    fname=f"{code}-{re.sub(r'[^a-z0-9]+','-',x['title'].lower().replace('m²','m2')).strip('-')}.json"
    p={
      'schema_version':'2.0.0','protocol_id':f"nccp-{code}-v{x['version']}",'file_name':fname,'status':'encoded_prototype_pending_clinical_and_pharmacy_validation',
      'metadata':metadata(code),
      'clinical_governance':{'prescriptive_authority':'The treatment plan must be initiated by a Consultant Medical Oncologist.','dose_modification_note':'Use the most restrictive applicable component rule and confirm all dose changes against the current official NCCP PDF.','disclaimer':f"Decision-support encoding derived from NCCP {code} Version {x['version']}. It does not replace the current official regimen, prescribing review, pharmacy verification or independent clinical judgement."},
      'indications':indications or [{'indication_id':f'{code}-neuro','description':x['indication']}],
      'treatment':treatment,'input_definitions':inputs,'required_inputs':[],
      'output_templates':{'proceed':'No encoded restriction was triggered in the entered domain(s). This is not an overall treatment clearance.','coverage_gap':'Only entered values were assessed; omitted clinical domains remain unassessed.','withhold':'Withhold the affected treatment component and follow the current NCCP reassessment pathway.','consultant_review':'Consultant review is required before treatment.','dose_reduce':'Apply the encoded dose modification after recovery and consultant/pharmacy confirmation.'},
      'rule_engine':{'conflict_policy':'Use the most restrictive applicable action.','missing_data_policy':'Do not infer missing values.','actions_ranked_most_to_least_restrictive':['permanently_discontinue','contraindicated','discontinue','cease','omit','withhold_then_reduce','withhold','delay_then_dose_reduce','delay','consultant_review','dose_reduce_two_levels','dose_reduce_one_level','dose_reduce','proceed_with_caution','proceed'],'rules':rules},
      'supportive_care':supportive
    }
    path=OUT/fname
    path.write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n')
    return path

def supportive(risk, script=None, phase=None, extras=None):
    d={'emetogenic_risk':risk,'mapping_source_url':ANTIEMETIC_URL,'mapping_basis':'Current NCCP regimen emetogenic classification; regimen phase/component and local policy must be considered.','mapping_confidence':'source_specific_pending_local_pharmacy_reconciliation','validation_status':'pending_local_oncology_pharmacy_validation'}
    if script:d['script_id']=script
    if phase:d['phase_profiles']=phase
    if extras:d.update(extras)
    return d

# Bevacizumab reusable fields/rules copied from the existing canonical engine, with source references re-bound per protocol.
BEV_DEF_IDS=['hypersensitivity','pregnancy','recent_major_surgery_or_unhealed_wound','planned_major_surgery','uncontrolled_or_symptomatic_hypertension','hypertension_grade','severe_bp_uncontrolled','hypertensive_crisis_or_encephalopathy','proteinuria_dipstick','urine_protein_g_24h','fistula_grade','thromboembolic_event_grade','arterial_thromboembolic_event','haemorrhage_grade','gi_perforation','necrotising_fasciitis','pres_confirmed']
BEV_RULE_IDS=['EXCLUSION_HYPERSENSITIVITY','PREGNANCY_REVIEW','UNHEALED_WOUND_OR_RECENT_SURGERY','PLANNED_MAJOR_SURGERY','UNCONTROLLED_HYPERTENSION','PERSISTENT_G3_OR_G4_HYPERTENSION','SEVERE_UNCONTROLLED_BP','HYPERTENSIVE_CRISIS_PRES','PROTEIN_DIPSTICK_2_3','PROTEIN_DIPSTICK_4','PROTEIN_2_TO_4','PROTEIN_OVER_4','GRADE4_FISTULA','THROMBOEMBOLIC_G4','ARTERIAL_THROMBOEMBOLIC_EVENT','HAEMORRHAGE_G3PLUS','GI_PERFORATION','NECROTISING_FASCIITIS','PRES']
BEV_SOURCE=json.loads((ROOT/'protocols/shared/00215-bevacizumab-15mgkg.json').read_text())

def bev_module(source_url):
    defs={k:copy.deepcopy(BEV_SOURCE['input_definitions'][k]) for k in BEV_DEF_IDS}
    for d in defs.values():d['required']=False
    rules=[]
    for r in BEV_SOURCE['rule_engine']['rules']:
        if (r.get('id') or r.get('rule_id')) in BEV_RULE_IDS:
            q=copy.deepcopy(r);q['source']={'document':source_url,'page':'Dose modification / adverse-event tables'};rules.append(q)
    return defs,rules

def lomustine_module(include_counts=True):
    defs={
      'lomustine_renal_band':renal('Renal function for lomustine',[('gt50','CrCl >50 mL/min'),('30_50','CrCl 30–50 mL/min'),('lt30','CrCl <30 mL/min'),('dialysis','Haemodialysis')],'gt50'),
      'pulmonary_symptoms_or_concern':boolean('New pulmonary symptoms or concern for lomustine-associated pulmonary toxicity'),
      'dlco_percent_predicted':num('DLCO (% predicted), if measured',80,'%',1,0,150),
      'other_nonhaem_toxicity_grade':grade('Worst clinically relevant non-haematological toxicity grade','generic','Identify the exact adverse event and assess severity, intervention required and functional impact.'),
    }
    if include_counts:
      defs.update({'anc_x10e9_l':num('Absolute neutrophil count',2,'×10⁹/L',0.1),'platelets_x10e9_l':num('Platelet count',150,'×10⁹/L',1)})
    rules=[
      rule('LOM_RENAL_30_50','lomustine_renal_band','==','30_50','dose_reduce','Use 75% of the original lomustine dose.',8,['lomustine']),
      rule('LOM_RENAL_LT30','lomustine_renal_band','in',['lt30','dialysis'],'contraindicated','Lomustine is not recommended at CrCl <30 mL/min or during haemodialysis.',10,['lomustine']),
      rule('LOM_PULMONARY','pulmonary_symptoms_or_concern','==',True,'withhold','Withhold lomustine and investigate suspected pulmonary toxicity; discuss with the prescribing consultant.',10,['lomustine']),
      rule('LOM_DLCO_LT60','dlco_percent_predicted','<',60,'withhold','DLCO below 60% predicted requires withholding and specialist pulmonary/consultant review.',9,['lomustine']),
      rule('LOM_NONHAEM_G3','other_nonhaem_toxicity_grade','>=',3,'withhold_then_reduce','Delay until recovery to baseline; for clinically relevant toxicity reduce lomustine by 50%, with later full-dose resumption only if the event does not recur for 42 days.',9,['lomustine']),
    ]
    if include_counts:
      rules += [
       rule('LOM_ANC_LT1','anc_x10e9_l','<',1,'withhold','Delay lomustine until ANC is at least 1.0 ×10⁹/L and platelets are at least 100 ×10⁹/L; consider dose reduction.',9,['lomustine']),
       rule('LOM_PLT_LT80','platelets_x10e9_l','<',80,'withhold','Delay lomustine until ANC is at least 1.0 ×10⁹/L and platelets are at least 100 ×10⁹/L; consider dose reduction.',9,['lomustine']),
       rule('LOM_PLT_80_99','platelets_x10e9_l','between_inclusive',[80,99],'consultant_review','Platelets are below the stated full-dose threshold of 100 ×10⁹/L; confirm recovery and dosing with the prescribing consultant.',7,['lomustine']),
      ]
    return defs,rules

def tmz_base_inputs():
    d=common_inputs();d.update({
      'anc_x10e9_l':num('Absolute neutrophil count',2,'×10⁹/L',0.1),
      'platelets_x10e9_l':num('Platelet count',150,'×10⁹/L',1),
      'other_nonhaem_toxicity_grade':grade('Worst relevant non-haematological toxicity grade','generic','Exclude alopecia, nausea and vomiting where the NCCP table explicitly does so; identify and grade the exact adverse event.'),
      'nausea_grade':grade('Nausea grade','nausea','Assess appetite, oral intake, hydration, weight loss and need for enteral/parenteral support.'),
      'vomiting_grade':grade('Vomiting grade','vomiting','Count episodes separated by at least five minutes and assess hydration, oral intake and need for hospital care.'),
      'temozolomide_renal_band':renal('Renal function for temozolomide',[('ge36','CrCl ≥36 mL/min'),('lt36','CrCl <36 mL/min'),('dialysis','Haemodialysis')],'ge36'),
      'hepatic_impairment_band':select('Hepatic impairment',[('none','No hepatic impairment'),('child_pugh_ab','Child-Pugh A or B'),('child_pugh_c','Child-Pugh C')],'none'),
      'hbv_screen_completed':boolean('Hepatitis B screening completed (HBsAg and anti-HBc)'),
      'active_or_reactivated_hbv':boolean('Active or suspected hepatitis B reactivation'),
    });return d

def tmz_common_rules():
    r=common_rules(2)
    r += [
      rule('TMZ_HBV_SCREEN','hbv_screen_completed','==',False,'consultant_review','Hepatitis B screening is required before treatment under the regimen.',6,page='Tests / HBV reactivation'),
      rule('TMZ_HBV_ACTIVE','active_or_reactivated_hbv','==',True,'withhold','Withhold and urgently assess suspected hepatitis B reactivation.',10,page='Regimen-specific complications'),
      rule('TMZ_RENAL_LT36','temozolomide_renal_band','in',['lt36','dialysis'],'proceed_with_caution','No dose adjustment is expected from the NCCP renal table, but use clinical judgement and monitor closely.',5,['temozolomide']),
      rule('TMZ_CHILD_PUGH','hepatic_impairment_band','in',['child_pugh_ab','child_pugh_c'],'proceed_with_caution','No dose adjustment is expected in the NCCP table; monitor hepatic status and confirm suitability.',5,['temozolomide']),
    ]
    return r

# 00813 bevacizumab monotherapy
code='00813';defs,rules=bev_module(INVENTORY[code]['url']);defs.update({'ecog':select('ECOG performance status',[(0,'0'),(1,'1'),(2,'2'),(3,'3'),(4,'4')],0),'recent_intracranial_haemorrhage':boolean('Recent intracranial haemorrhage'),'minimal_contrast_enhancement_or_gliomatosis':boolean('Imaging shows no/minimal contrast enhancement or gliomatosis cerebri'),'recent_stroke_or_mi_lt1y':boolean('Stroke or myocardial infarction within the previous year')})
rules += [rule('ECOG_GT2','ecog','>',2,'consultant_review','ECOG above 2 is outside routine eligibility.',8),rule('RECENT_ICH','recent_intracranial_haemorrhage','==',True,'contraindicated','Recent intracranial haemorrhage is an exclusion.',10),rule('MINIMAL_ENHANCEMENT','minimal_contrast_enhancement_or_gliomatosis','==',True,'contraindicated','No/minimal contrast enhancement or gliomatosis cerebri is an exclusion.',10),rule('RECENT_STROKE_MI','recent_stroke_or_mi_lt1y','==',True,'contraindicated','Stroke or myocardial infarction within one year is an exclusion.',10)]
make_protocol(code,{'cycle_length_days':14,'schedule_summary':'Bevacizumab 5 mg/kg IV on Day 1 every 14 days until progression or unacceptable toxicity.','drugs':['bevacizumab']},defs,rules,supportive('minimal','nccp-minimal-no-routine-prophylaxis'))

# Lomustine monotherapy
code='00805';defs=common_inputs();lm_defs,lm_rules=lomustine_module(True);defs.update(lm_defs);rules=common_rules(2)+lm_rules
make_protocol(code,{'cycle_length_days':42,'schedule_summary':'Lomustine 130 mg/m² orally on Day 1 every 6 weeks (maximum 280 mg).','drugs':['lomustine']},defs,rules,supportive('oral_moderate_high','nccp-oral-moderate-high',extras={'other_supportive_care':['Contraception during treatment and for 6 months after lomustine.','Monitor for delayed myelosuppression and pulmonary toxicity.']}))

# Lomustine + bevacizumab combinations
for code,dose,days in [('00804','7.5','1 and 22'),('00742','5','1, 15 and 29')]:
    defs=common_inputs();lm_defs,lm_rules=lomustine_module(True);bev_defs,bev_rules=bev_module(INVENTORY[code]['url']);defs.update(lm_defs);defs.update(bev_defs);rules=common_rules(2)+lm_rules+bev_rules
    phase={'lomustine_day_1':{'level':'oral_moderate_high','script_id':'nccp-oral-moderate-high'},'bevacizumab_only_days':{'level':'minimal','script_id':'nccp-minimal-no-routine-prophylaxis'}}
    make_protocol(code,{'cycle_length_days':42,'schedule_summary':f'Bevacizumab {dose} mg/kg IV on Days {days} and lomustine 90 mg/m² orally on Day 1 every 42 days for up to 6 cycles.','drugs':['bevacizumab','lomustine']},defs,rules,supportive('phase_dependent',phase=phase,extras={'other_supportive_care':['Monitor blood pressure and urine protein before bevacizumab.','Monitor for delayed lomustine myelosuppression and pulmonary toxicity.']}))

# CLV
code='00806';defs=common_inputs();defs.update({
 'age_years':num('Age',30,'years',1,0,120),'significant_hearing_impairment_or_tinnitus':boolean('Significant hearing impairment or tinnitus'),
 'anc_x10e9_l':num('Absolute neutrophil count',2,'×10⁹/L',0.1),'platelets_x10e9_l':num('Platelet count',150,'×10⁹/L',1),
 'lomustine_renal_band':renal('Renal function for lomustine',[('gt50','CrCl >50 mL/min'),('30_50','CrCl 30–50 mL/min'),('lt30','CrCl <30 mL/min'),('dialysis','Haemodialysis')],'gt50'),
 'cisplatin_renal_band':renal('Renal function for cisplatin',[('ge60','CrCl ≥60 mL/min'),('50_59','CrCl 50–59 mL/min'),('40_49','CrCl 40–49 mL/min'),('lt40','CrCl <40 mL/min'),('dialysis','Haemodialysis')],'ge60'),
 'bilirubin_umol_l':num('Bilirubin',15,'µmol/L',1),'neuropathy_grade':grade('Vincristine-related peripheral neuropathy grade','neuropathy','Assess sensory and motor symptoms, reflexes, gait and effect on instrumental or self-care activities of daily living.'),
 'cisplatin_hydration_and_magnesium_ready':boolean('Cisplatin hydration and magnesium plan confirmed'),
 'more_than_two_count_delays':boolean('More than two count-related delays'),
 'pulmonary_symptoms_or_concern':boolean('New pulmonary symptoms or concern for lomustine pulmonary toxicity'),
})
rules=common_rules(2)+[
 rule('AGE_GT40','age_years','>',40,'contraindicated','Age over 40 years is an exclusion in this CLV regimen.',10),
 rule('HEARING','significant_hearing_impairment_or_tinnitus','==',True,'contraindicated','Significant hearing impairment or tinnitus is an exclusion.',10),
 rule('ANC_LT1','anc_x10e9_l','<',1,'withhold_then_reduce','Delay until ANC ≥1.0 and platelets ≥100; resume lomustine at 80% of the original dose, which becomes the new full dose.',10,['lomustine']),
 rule('PLT_LT80','platelets_x10e9_l','<',80,'withhold_then_reduce','Delay until ANC ≥1.0 and platelets ≥100; resume lomustine at 80% of the original dose, which becomes the new full dose.',10,['lomustine']),
 rule('PLT_80_99','platelets_x10e9_l','between_inclusive',[80,99],'withhold','Platelets remain below the required recovery threshold of 100 ×10⁹/L.',8,['lomustine']),
 rule('DELAYS_GT2','more_than_two_count_delays','==',True,'consultant_review','More than two delays requires review by the prescribing clinician.',8),
 rule('LOM_30_50','lomustine_renal_band','==','30_50','dose_reduce','Use 75% of the original lomustine dose.',8,['lomustine']),
 rule('LOM_LT30','lomustine_renal_band','in',['lt30','dialysis'],'contraindicated','Lomustine is not recommended at CrCl <30 mL/min or during haemodialysis.',10,['lomustine']),
 rule('CIS_50_59','cisplatin_renal_band','==','50_59','dose_reduce','Use 75% of the original cisplatin dose.',8,['cisplatin']),
 rule('CIS_40_49','cisplatin_renal_band','==','40_49','dose_reduce','Use 50% of the original cisplatin dose.',9,['cisplatin']),
 rule('CIS_LT40','cisplatin_renal_band','==','lt40','contraindicated','Cisplatin is not recommended when CrCl is below 40 mL/min.',10,['cisplatin']),
 rule('CIS_DIALYSIS','cisplatin_renal_band','==','dialysis','consultant_review','A 50% cisplatin dose may be considered in haemodialysis only with specialist consultant/pharmacy planning.',9,['cisplatin']),
 rule('VIN_BILI','bilirubin_umol_l','>',51,'dose_reduce','Use 50% of the original vincristine dose when bilirubin is above 51 µmol/L.',8,['vincristine']),
 rule('VIN_NEURO_G2','neuropathy_grade','==',2,'withhold_then_reduce','Hold vincristine until recovery, then reduce the dose by 50%.',9,['vincristine']),
 rule('VIN_NEURO_G34','neuropathy_grade','>=',3,'omit','Omit vincristine for Grade 3–4 neurotoxicity.',10,['vincristine']),
 rule('HYDRATION','cisplatin_hydration_and_magnesium_ready','==',False,'withhold','Do not administer cisplatin until the required hydration and magnesium plan is confirmed.',9,['cisplatin']),
 rule('PULM','pulmonary_symptoms_or_concern','==',True,'withhold','Withhold lomustine and investigate suspected pulmonary toxicity.',9,['lomustine']),
]
phase={'day_1_cisplatin_lomustine_vincristine':{'level':'high','script_id':'nccp-parenteral-high'},'vincristine_days_8_15':{'level':'minimal','script_id':'nccp-minimal-no-routine-prophylaxis'}}
make_protocol(code,{'cycle_length_days':42,'schedule_summary':'Lomustine 75 mg/m² PO, cisplatin 75 mg/m² IV and vincristine 1.5 mg/m² IV (max 2 mg) on Day 1; vincristine also on Days 8 and 15; every 42 days for 8 cycles after craniospinal radiotherapy.','drugs':['lomustine','cisplatin','vincristine']},defs,rules,supportive('phase_dependent',phase=phase,extras={'premedications':['Cisplatin pre- and post-hydration with magnesium according to local policy.'],'other_supportive_care':['Prophylaxis against vincristine-induced constipation.','Avoid azole antifungals with vincristine where possible; review CYP3A4 interactions.','Monitor audiology, renal function, electrolytes and pulmonary toxicity as clinically indicated.']}))

# PCV 42/56 day
for code in ['00379','00658']:
    defs=common_inputs();defs.update({
      'assessment_day':select('Treatment day / component being assessed',[('day1','Day 1 – lomustine'),('day8','Day 8 – vincristine and procarbazine'),('day29','Day 29 – vincristine'),('preceding_nadir','Preceding-cycle nadir review')],'day1'),
      'indication_context':select('Treatment context',[('adjuvant','Adjuvant after radiotherapy'),('palliative','Palliative recurrent high-grade glioma')],'adjuvant') if code=='00379' else select('Treatment context',[('adjuvant','Adjuvant after radiotherapy')],'adjuvant'),
      'anc_x10e9_l':num('Absolute neutrophil count',2,'×10⁹/L',0.1),'platelets_x10e9_l':num('Platelet count',150,'×10⁹/L',1),
      'preceding_nadir_anc_x10e9_l':num('Preceding-cycle ANC nadir',1.2,'×10⁹/L',0.1),'preceding_nadir_platelets_x10e9_l':num('Preceding-cycle platelet nadir',100,'×10⁹/L',1),
      'lomustine_renal_band':renal('Renal function for lomustine',[('gt60','CrCl >60 mL/min'),('45_60','CrCl 45–60 mL/min'),('30_44','CrCl 30–44 mL/min'),('lt30','CrCl <30 mL/min')],'gt60'),
      'procarbazine_renal_band':renal('Renal function for procarbazine',[('creatinine_le177','Serum creatinine ≤177 µmol/L / no severe impairment'),('creatinine_gt177','Serum creatinine >177 µmol/L'),('severe','Severe renal impairment')],'creatinine_le177'),
      'bilirubin_umol_l':num('Bilirubin',15,'µmol/L',1),'ast_alt_u_l':num('Highest AST or ALT result',30,'U/L',1),
      'neuropathy_grade':grade('Vincristine-related peripheral neuropathy grade','neuropathy','Assess sensory and motor symptoms, gait and functional impact before each vincristine dose.'),
      'severe_abdominal_or_jaw_pain':boolean('Severe vincristine-associated abdominal or jaw pain'),
      'urticarial_rash_from_procarbazine':boolean('Urticarial rash suspected to be caused by procarbazine'),
      'pulmonary_symptoms_or_concern':boolean('New pulmonary symptoms or concern for lomustine pulmonary toxicity'),
      'dlco_percent_predicted':num('DLCO (% predicted), if measured',80,'%',1,0,150),
      'nausea_or_vomiting_grade':grade('Nausea or vomiting grade','generic','Use the more severe of the nausea and vomiting CTCAE terms and assess hydration and oral intake.'),
      'other_nonhaem_toxicity_grade':grade('Other clinically relevant non-haematological toxicity grade','generic'),
      'major_maoi_or_cyp3a_interaction':boolean('Clinically significant procarbazine MAOI-type or vincristine CYP3A interaction'),
    })
    rules=common_rules(2 if code=='00658' else 3)+[
      all_rule('D1_MODERATE_COUNTS',[{'field':'assessment_day','operator':'==','value':'day1'},{'any':[{'field':'anc_x10e9_l','operator':'between_inclusive','value':[0.5,0.999]},{'field':'platelets_x10e9_l','operator':'between_inclusive','value':[50,99]}]}],'withhold','Delay Day 1 lomustine and maintain the dose once counts recover.',8,['lomustine']),
      all_rule('D1_SEVERE_COUNTS',[{'field':'assessment_day','operator':'==','value':'day1'},{'any':[{'field':'anc_x10e9_l','operator':'<','value':0.5},{'field':'platelets_x10e9_l','operator':'<','value':50}]}],'delay_then_dose_reduce','Delay and reduce lomustine by 25% once counts recover.',10,['lomustine']),
      all_rule('D8_MODERATE_COUNTS',[{'field':'assessment_day','operator':'==','value':'day8'},{'any':[{'field':'anc_x10e9_l','operator':'between_inclusive','value':[0.5,0.999]},{'field':'platelets_x10e9_l','operator':'between_inclusive','value':[50,99]}]}],'withhold','Delay Day 8 vincristine and procarbazine; maintain both doses once counts recover.',8,['vincristine','procarbazine']),
      all_rule('D8_SEVERE_COUNTS',[{'field':'assessment_day','operator':'==','value':'day8'},{'any':[{'field':'anc_x10e9_l','operator':'<','value':0.5},{'field':'platelets_x10e9_l','operator':'<','value':50}]}],'delay_then_dose_reduce','Delay Day 8; reduce procarbazine by 25% and maintain vincristine dose once counts recover.',10,['procarbazine','vincristine']),
      all_rule('D29_MODERATE_COUNTS',[{'field':'assessment_day','operator':'==','value':'day29'},{'any':[{'field':'anc_x10e9_l','operator':'between_inclusive','value':[0.5,0.999]},{'field':'platelets_x10e9_l','operator':'between_inclusive','value':[50,99]}]}],'proceed_with_caution','Day 29 vincristine may proceed if the patient is clinically well.',5,['vincristine']),
      all_rule('D29_SEVERE_COUNTS',[{'field':'assessment_day','operator':'==','value':'day29'},{'any':[{'field':'anc_x10e9_l','operator':'<','value':0.5},{'field':'platelets_x10e9_l','operator':'<','value':50}]}],'omit','Omit Day 29 vincristine.',10,['vincristine']),
      any_rule('GENERIC_SEVERE_COUNTS',[{'field':'anc_x10e9_l','operator':'<','value':0.5},{'field':'platelets_x10e9_l','operator':'<','value':50}],'withhold','Severe cytopenia triggers a protocol action; withhold and use the selected treatment day to determine omission versus 25% component reduction.',9),
      any_rule('NADIR_REDUCTION',[{'field':'preceding_nadir_anc_x10e9_l','operator':'<','value':0.5},{'field':'preceding_nadir_platelets_x10e9_l','operator':'<','value':50}],'dose_reduce','Reduce the preceding cycle’s lomustine and procarbazine doses by 25%.',8,['lomustine','procarbazine']),
      rule('LOM_45_60','lomustine_renal_band','==','45_60','dose_reduce','Use 75% of the lomustine dose.',8,['lomustine']),
      rule('LOM_30_44','lomustine_renal_band','==','30_44','dose_reduce','Use 50% of the lomustine dose.',9,['lomustine']),
      rule('LOM_LT30','lomustine_renal_band','==','lt30','contraindicated','Lomustine is not recommended below CrCl 30 mL/min.',10,['lomustine']),
      rule('PROC_CR_GT177','procarbazine_renal_band','==','creatinine_gt177','dose_reduce','Use 50% of the procarbazine dose when serum creatinine is above 177 µmol/L.',8,['procarbazine']),
      rule('PROC_RENAL_SEVERE','procarbazine_renal_band','==','severe','contraindicated','Procarbazine is not recommended in severe renal impairment.',10,['procarbazine']),
      rule('PROC_BILI_GT50','bilirubin_umol_l','>',50,'consultant_review','Bilirubin above 50 µmol/L requires consideration of procarbazine dose reduction.',7,['procarbazine']),
      any_rule('PROC_HEPATIC_CONTRA',[{'field':'bilirubin_umol_l','operator':'>','value':85},{'field':'ast_alt_u_l','operator':'>','value':180}],'contraindicated','Procarbazine is contraindicated when bilirubin exceeds 85 µmol/L or AST/ALT exceeds 180 U/L.',10,['procarbazine']),
      all_rule('VIN_HEPATIC_50_A',[{'field':'bilirubin_umol_l','operator':'between_inclusive','value':[26,51]}],'dose_reduce','Use 50% of the vincristine dose.',8,['vincristine']),
      all_rule('VIN_HEPATIC_50_B',[{'field':'bilirubin_umol_l','operator':'>','value':51},{'field':'ast_alt_u_l','operator':'<=','value':180}],'dose_reduce','Use 50% of the vincristine dose.',8,['vincristine']),
      all_rule('VIN_HEPATIC_OMIT',[{'field':'bilirubin_umol_l','operator':'>','value':51},{'field':'ast_alt_u_l','operator':'>','value':180}],'omit','Omit vincristine.',10,['vincristine']),
      rule('VIN_NEURO_G2','neuropathy_grade','==',2,'consultant_review','Increasing neuropathy that interferes with function requires vincristine dose reduction or interruption according to consultant assessment.',8,['vincristine']),
      rule('VIN_NEURO_G34','neuropathy_grade','>=',3,'omit','Severe vincristine neurotoxicity requires omission.',10,['vincristine']),
      rule('VIN_PAIN','severe_abdominal_or_jaw_pain','==',True,'dose_reduce','Reduce subsequent vincristine doses by 50% for severe abdominal or jaw pain.',8,['vincristine']),
      rule('PROC_RASH','urticarial_rash_from_procarbazine','==',True,'withhold','Interrupt procarbazine for urticarial rash and consider permanent discontinuation after specialist review.',9,['procarbazine']),
      rule('LOM_PULM','pulmonary_symptoms_or_concern','==',True,'withhold','Withhold lomustine and assess suspected pulmonary toxicity.',10,['lomustine']),
      rule('LOM_DLCO','dlco_percent_predicted','<',60,'withhold','Withhold lomustine when DLCO is below 60% predicted and discuss with the prescribing consultant.',9,['lomustine']),
      rule('NV_G3','nausea_or_vomiting_grade','==',3,'dose_reduce','For Grade 3 nausea/vomiting or other clinically relevant toxicity, reduce affected oral cytotoxic doses by 25% after recovery.',7),
      rule('NV_G4','nausea_or_vomiting_grade','>=',4,'dose_reduce','For Grade 4 toxicity, reduce affected oral cytotoxic doses by 50% after recovery and consultant review.',9),
      rule('OTHER_G3','other_nonhaem_toxicity_grade','==',3,'dose_reduce','Reduce affected doses by 25% after recovery for Grade 3 clinically relevant toxicity.',7),
      rule('OTHER_G4','other_nonhaem_toxicity_grade','>=',4,'dose_reduce','Reduce affected doses by 50% after recovery for Grade 4 clinically relevant toxicity.',9),
      rule('INTERACTION','major_maoi_or_cyp3a_interaction','==',True,'consultant_review','Resolve clinically significant procarbazine MAOI-type or vincristine CYP3A interactions before treatment.',8),
    ]
    phase={'lomustine_day_1':{'level':'oral_moderate_high','script_id':'nccp-oral-moderate-high'},'procarbazine_days_8_to_21':{'level':'oral_moderate_high','script_id':'nccp-oral-moderate-high'},'vincristine_days_8_and_29':{'level':'minimal','script_id':'nccp-minimal-no-routine-prophylaxis'}}
    indications=[{'indication_id':'00379a','description':'Adjuvant treatment of Grade II glioma after radiotherapy.'},{'indication_id':'00379b','description':'Palliative treatment of recurrent high-grade glioma.'}] if code=='00379' else None
    make_protocol(code,{'cycle_length_days':INVENTORY[code]['cycle'],'schedule_summary':f"Lomustine 110 mg/m² PO Day 1; procarbazine 60 mg/m² PO Days 8–21; vincristine 1.4 mg/m² IV (max 2 mg) Days 8 and 29; repeat every {INVENTORY[code]['cycle']} days" + (' for 6 cycles.' if code=='00658' else '.'),'drugs':['lomustine','procarbazine','vincristine']},defs,rules,supportive('phase_dependent',phase=phase,extras={'other_supportive_care':['Prophylaxis against vincristine-induced constipation.','Contraception during treatment and for 6 months after lomustine.','Counsel regarding procarbazine alcohol intolerance and clinically important MAOI-type interactions.','Monitor pulmonary function during prolonged lomustine therapy when clinically indicated.']}),indications)

# Temozolomide recurrent
code='00342';defs=tmz_base_inputs();defs.update({'previous_chemotherapy':boolean('Previously treated with chemotherapy'),'current_tmz_dose_level':select('Current temozolomide dose level',[('100','100 mg/m² (dose level −1)'),('150','150 mg/m² (dose level 0)'),('200','200 mg/m² (dose level 1)')],'150'),'unacceptable_toxicity_at_100':boolean('Unacceptable toxicity persists at 100 mg/m²'),'same_grade3_toxicity_recurred_after_reduction':boolean('Same Grade 3 non-haematological toxicity recurred after dose reduction')})
rules=tmz_common_rules()+[
 rule('ANC_LT1','anc_x10e9_l','<',1,'dose_reduce_one_level','Reduce temozolomide by one dose level.',9,['temozolomide']),
 rule('PLT_LT50','platelets_x10e9_l','<',50,'dose_reduce_one_level','Reduce temozolomide by one dose level.',9,['temozolomide']),
 rule('NONHAEM_G3','other_nonhaem_toxicity_grade','==',3,'dose_reduce_one_level','Reduce temozolomide by one dose level for Grade 3 non-haematological toxicity, excluding alopecia, nausea and vomiting.',9,['temozolomide']),
 rule('NONHAEM_G4','other_nonhaem_toxicity_grade','>=',4,'permanently_discontinue','Discontinue temozolomide for Grade 4 non-haematological toxicity.',10,['temozolomide']),
 rule('TOX_AT_100','unacceptable_toxicity_at_100','==',True,'permanently_discontinue','Discontinue if dose level −1 (100 mg/m²) still causes unacceptable toxicity.',10,['temozolomide']),
 rule('RECURRENT_G3','same_grade3_toxicity_recurred_after_reduction','==',True,'permanently_discontinue','Discontinue if the same Grade 3 non-haematological toxicity recurs after dose reduction.',10,['temozolomide']),
]
make_protocol(code,{'cycle_length_days':28,'schedule_summary':'Temozolomide orally once daily on Days 1–5 of each 28-day cycle; 200 mg/m² if chemotherapy-naïve, or 150 mg/m² initially after prior chemotherapy with escalation to 200 mg/m² if tolerated.','drugs':['temozolomide']},defs,rules,supportive('oral_moderate_high','nccp-oral-moderate-high',extras={'other_supportive_care':['Take capsules fasting; swallow whole.','Do not repeat a dose after vomiting.','Review hepatitis B screening and reactivation risk.']}))

# Temozolomide with RT and adjuvant standard
code='00334';defs=tmz_base_inputs();defs.update({'treatment_phase':select('Treatment phase',[('concomitant_rt','Concomitant radiotherapy phase'),('adjuvant','Adjuvant monotherapy phase')],'concomitant_rt'),'current_tmz_dose_level':select('Current adjuvant temozolomide dose level',[('100','100 mg/m²'),('150','150 mg/m²'),('200','200 mg/m²')],'150'),'same_grade3_toxicity_recurred_after_reduction':boolean('Same Grade 3 non-haematological toxicity recurred after dose reduction'),'unacceptable_toxicity_at_100':boolean('Unacceptable toxicity persists at 100 mg/m²'),'pjp_prophylaxis_confirmed':boolean('PJP prophylaxis confirmed for concomitant radiotherapy phase')})
rules=tmz_common_rules()+[
 all_rule('CONC_ANC_STOP',[{'field':'treatment_phase','operator':'==','value':'concomitant_rt'},{'field':'anc_x10e9_l','operator':'<','value':0.5}],'permanently_discontinue','Discontinue concomitant temozolomide when ANC is below 0.5 ×10⁹/L.',10,['temozolomide']),
 all_rule('CONC_ANC_HOLD',[{'field':'treatment_phase','operator':'==','value':'concomitant_rt'},{'field':'anc_x10e9_l','operator':'between_inclusive','value':[0.5,1.499]}],'withhold','Interrupt concomitant temozolomide until recovery.',9,['temozolomide']),
 all_rule('CONC_PLT_STOP',[{'field':'treatment_phase','operator':'==','value':'concomitant_rt'},{'field':'platelets_x10e9_l','operator':'<','value':10}],'permanently_discontinue','Discontinue concomitant temozolomide when platelets are below 10 ×10⁹/L.',10,['temozolomide']),
 all_rule('CONC_PLT_HOLD',[{'field':'treatment_phase','operator':'==','value':'concomitant_rt'},{'field':'platelets_x10e9_l','operator':'between_inclusive','value':[10,99]}],'withhold','Interrupt concomitant temozolomide until recovery.',9,['temozolomide']),
 all_rule('CONC_NONHAEM_G2',[{'field':'treatment_phase','operator':'==','value':'concomitant_rt'},{'field':'other_nonhaem_toxicity_grade','operator':'==','value':2}],'withhold','Interrupt concomitant temozolomide for Grade 2 non-haematological toxicity, excluding alopecia, nausea and vomiting.',8,['temozolomide']),
 all_rule('CONC_NONHAEM_G34',[{'field':'treatment_phase','operator':'==','value':'concomitant_rt'},{'field':'other_nonhaem_toxicity_grade','operator':'>=','value':3}],'permanently_discontinue','Discontinue concomitant temozolomide for Grade 3–4 non-haematological toxicity, excluding alopecia, nausea and vomiting.',10,['temozolomide']),
 all_rule('ADJ_ANC',[{'field':'treatment_phase','operator':'==','value':'adjuvant'},{'field':'anc_x10e9_l','operator':'<','value':1}],'dose_reduce_one_level','Reduce adjuvant temozolomide by one dose level.',9,['temozolomide']),
 all_rule('ADJ_PLT',[{'field':'treatment_phase','operator':'==','value':'adjuvant'},{'field':'platelets_x10e9_l','operator':'<','value':50}],'dose_reduce_one_level','Reduce adjuvant temozolomide by one dose level.',9,['temozolomide']),
 all_rule('ADJ_G3',[{'field':'treatment_phase','operator':'==','value':'adjuvant'},{'field':'other_nonhaem_toxicity_grade','operator':'==','value':3}],'dose_reduce_one_level','Reduce adjuvant temozolomide by one dose level.',9,['temozolomide']),
 all_rule('ADJ_G4',[{'field':'treatment_phase','operator':'==','value':'adjuvant'},{'field':'other_nonhaem_toxicity_grade','operator':'>=','value':4}],'permanently_discontinue','Discontinue adjuvant temozolomide for Grade 4 non-haematological toxicity.',10,['temozolomide']),
 all_rule('PJP',[{'field':'treatment_phase','operator':'==','value':'concomitant_rt'},{'field':'pjp_prophylaxis_confirmed','operator':'==','value':False}],'withhold','PJP prophylaxis is required during concomitant temozolomide and radiotherapy; confirm before treatment.',9),
 rule('TOX_100','unacceptable_toxicity_at_100','==',True,'permanently_discontinue','Discontinue if 100 mg/m² still causes unacceptable toxicity.',10,['temozolomide']),
 rule('RECUR_G3','same_grade3_toxicity_recurred_after_reduction','==',True,'permanently_discontinue','Discontinue if the same Grade 3 toxicity recurs after dose reduction.',10,['temozolomide']),
 any_rule('PHASE_REQUIRED_COUNTS',[{'field':'anc_x10e9_l','operator':'<','value':1.5},{'field':'platelets_x10e9_l','operator':'<','value':100}],'consultant_review','Counts are below a treatment threshold; select the treatment phase for the exact interruption, reduction or discontinuation pathway.',7),
]
make_protocol(code,{'cycle_length_days':28,'schedule_summary':'Temozolomide 75 mg/m² PO daily with radiotherapy for 6 weeks; 4-week break; then temozolomide Days 1–5 every 28 days for up to 6 adjuvant cycles (150 mg/m² Cycle 1, 200 mg/m² Cycles 2–6 if eligible).','drugs':['temozolomide']},defs,rules,supportive('oral_moderate_high','nccp-oral-moderate-high',extras={'other_supportive_care':['PJP prophylaxis is required during concomitant radiotherapy.','Weekly FBC during concomitant therapy.','Take temozolomide fasting and do not repeat a dose after vomiting.']}))

# Temozolomide >65 shortened RT
code='00461';defs=tmz_base_inputs();defs.update({'age_years':num('Age',70,'years',1,0,120),'treatment_phase':select('Treatment phase',[('concomitant_rt','Concomitant shortened-radiotherapy phase'),('adjuvant','Adjuvant monotherapy phase')],'concomitant_rt'),'counts_not_recovered_after_3_weeks':boolean('Counts or toxicity not recovered after the maximum 3-week delay'),'pjp_prophylaxis_confirmed':boolean('PJP prophylaxis confirmed for concomitant radiotherapy phase')})
rules=tmz_common_rules()+[
 rule('AGE_LE65','age_years','<=',65,'consultant_review','This regimen is intended for patients greater than 65 years who are not suitable for the standard radiotherapy regimen.',7),
 all_rule('CONC_ANC_STOP',[{'field':'treatment_phase','operator':'==','value':'concomitant_rt'},{'field':'anc_x10e9_l','operator':'<','value':0.5}],'permanently_discontinue','Stop concomitant temozolomide when ANC is below 0.5 ×10⁹/L.',10,['temozolomide']),
 all_rule('CONC_ANC_HOLD',[{'field':'treatment_phase','operator':'==','value':'concomitant_rt'},{'field':'anc_x10e9_l','operator':'between_inclusive','value':[0.5,1.499]}],'withhold','Hold concomitant temozolomide until recovery, then resume 75 mg/m² daily without replacing missed doses.',9,['temozolomide']),
 all_rule('CONC_PLT_STOP',[{'field':'treatment_phase','operator':'==','value':'concomitant_rt'},{'field':'platelets_x10e9_l','operator':'<','value':25}],'permanently_discontinue','Stop concomitant temozolomide when platelets are below 25 ×10⁹/L.',10,['temozolomide']),
 all_rule('CONC_PLT_HOLD',[{'field':'treatment_phase','operator':'==','value':'concomitant_rt'},{'field':'platelets_x10e9_l','operator':'between_inclusive','value':[25,99]}],'withhold','Hold concomitant temozolomide until recovery, then resume 75 mg/m² daily.',9,['temozolomide']),
 all_rule('CONC_NV_G3',[{'field':'treatment_phase','operator':'==','value':'concomitant_rt'},{'any':[{'field':'nausea_grade','operator':'==','value':3},{'field':'vomiting_grade','operator':'==','value':3}]}],'withhold','Hold until nausea/vomiting recovers to Grade 2 or less, then resume 75 mg/m² daily.',8,['temozolomide']),
 all_rule('CONC_NV_G4',[{'field':'treatment_phase','operator':'==','value':'concomitant_rt'},{'any':[{'field':'nausea_grade','operator':'>=','value':4},{'field':'vomiting_grade','operator':'>=','value':4}]}],'permanently_discontinue','Stop concomitant temozolomide for Grade 4 nausea or vomiting.',10,['temozolomide']),
 all_rule('CONC_OTHER_G23',[{'field':'treatment_phase','operator':'==','value':'concomitant_rt'},{'field':'other_nonhaem_toxicity_grade','operator':'between_inclusive','value':[2,3]}],'withhold','Hold until recovery to Grade 1 or less, then resume 75 mg/m² daily.',8,['temozolomide']),
 all_rule('CONC_OTHER_G4',[{'field':'treatment_phase','operator':'==','value':'concomitant_rt'},{'field':'other_nonhaem_toxicity_grade','operator':'>=','value':4}],'permanently_discontinue','Stop concomitant temozolomide for Grade 4 non-haematological toxicity.',10,['temozolomide']),
 all_rule('ADJ_COUNTS_DELAY',[{'field':'treatment_phase','operator':'==','value':'adjuvant'},{'any':[{'field':'anc_x10e9_l','operator':'<','value':1.5},{'field':'platelets_x10e9_l','operator':'<','value':100}]}],'delay','Delay the adjuvant cycle in one-week intervals, up to 3 weeks, until recovery; then use the same dose as the previous cycle.',8,['temozolomide']),
 all_rule('ADJ_COUNTS_STOP',[{'field':'treatment_phase','operator':'==','value':'adjuvant'},{'any':[{'field':'anc_x10e9_l','operator':'<','value':0.5},{'field':'platelets_x10e9_l','operator':'<','value':25}]}],'permanently_discontinue','Stop adjuvant temozolomide for ANC <0.5 ×10⁹/L or platelets <25 ×10⁹/L.',10,['temozolomide']),
 all_rule('ADJ_NV_DELAY',[{'field':'treatment_phase','operator':'==','value':'adjuvant'},{'any':[{'field':'nausea_grade','operator':'==','value':3},{'field':'vomiting_grade','operator':'==','value':3}]}],'delay','Delay up to 3 weeks until recovery to Grade 2 or less, then treat at the same dose.',8,['temozolomide']),
 all_rule('ADJ_OTHER_DELAY',[{'field':'treatment_phase','operator':'==','value':'adjuvant'},{'field':'other_nonhaem_toxicity_grade','operator':'between_inclusive','value':[2,3]}],'delay','Delay up to 3 weeks until recovery to Grade 1 or less, then treat at the same dose.',8,['temozolomide']),
 any_rule('ADJ_G4_STOP',[{'field':'nausea_grade','operator':'>=','value':4},{'field':'vomiting_grade','operator':'>=','value':4},{'field':'other_nonhaem_toxicity_grade','operator':'>=','value':4}],'permanently_discontinue','Stop temozolomide for Grade 4 non-haematological toxicity.',10,['temozolomide']),
 rule('NO_RECOVERY_3W','counts_not_recovered_after_3_weeks','==',True,'permanently_discontinue','Stop adjuvant temozolomide if counts or toxicity have not recovered after 3 weeks.',10,['temozolomide']),
 all_rule('PJP',[{'field':'treatment_phase','operator':'==','value':'concomitant_rt'},{'field':'pjp_prophylaxis_confirmed','operator':'==','value':False}],'withhold','PJP prophylaxis is required during concomitant temozolomide and radiotherapy.',9),
]
make_protocol(code,{'cycle_length_days':28,'schedule_summary':'Temozolomide 75 mg/m² PO daily with shortened radiotherapy for 21 days; 4-week break; then Days 1–5 every 28 days for up to 6 adjuvant cycles (150 mg/m² Cycle 1, 200 mg/m² Cycles 2–6 if tolerated).','drugs':['temozolomide']},defs,rules,supportive('oral_moderate_high','nccp-oral-moderate-high',extras={'other_supportive_care':['PJP prophylaxis is required during concomitant radiotherapy.','Continue radiotherapy if temozolomide is interrupted; missed temozolomide doses are not replaced.','Take temozolomide fasting and do not repeat a dose after vomiting.']}))

print(f'Generated {len(list(OUT.glob("*.json")))} fully encoded Neuro-oncology protocols in {OUT}.')
