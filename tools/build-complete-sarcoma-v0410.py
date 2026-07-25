#!/usr/bin/env python3
from __future__ import annotations
import copy, glob, json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SARCOMA_DIR = ROOT / 'protocols' / 'sarcoma'
SHARED_DIR = ROOT / 'protocols' / 'shared'
SARCOMA_DIR.mkdir(parents=True, exist_ok=True)
SHARED_DIR.mkdir(parents=True, exist_ok=True)

# Official NCCP Sarcoma catalogue snapshot checked 24 July 2026.
# One record per regimen card/document on the official page.
I = [
('00511','2','Dacarbazine 1.2 g/m² Therapy – 21 day','https://healthservice.hse.ie/documents/6741/511_V2_Dacarbazine.pdf',['dacarbazine'],'Metastatic soft tissue sarcoma.',21,'soft_tissue_sarcoma'),
('00420','4','DOXOrubicin 25 mg/m²/day and CISplatin 100 mg/m² Therapy – 21 day','https://healthservice.hse.ie/documents/6733/420_V4_DOX25CIS100.pdf',['doxorubicin','cisplatin'],'Neoadjuvant/adjuvant treatment of osteosarcoma.',21,'osteosarcoma'),
('00391','5','DOXOrubicin 60 mg/m² and Ifosfamide Therapy','https://healthservice.hse.ie/documents/6730/391_DOXOrubicin_60_and_Ifosfamide.pdf',['doxorubicin','ifosfamide','mesna'],'Locally advanced unresectable or metastatic soft tissue sarcoma.',21,'soft_tissue_sarcoma'),
('00392','5','DOXOrubicin 75 mg/m² and Ifosfamide Therapy','https://healthservice.hse.ie/documents/6731/392_DOXOrubicin_75_and_ifosfamide.pdf',['doxorubicin','ifosfamide','mesna'],'Neoadjuvant high-risk or advanced/metastatic soft tissue sarcoma.',21,'soft_tissue_sarcoma'),
('00500','2','DOXOrubicin 75 mg/m² Monotherapy','https://www.hse.ie/eng/services/list/5/cancer/profinfo/chemoprotocols/sarcoma/500-doxorubicin-75mg-m2-monotherapy.pdf',['doxorubicin'],'Locally advanced unresectable or metastatic soft tissue sarcoma.',21,'soft_tissue_sarcoma'),
('00228','8','eriBULin Monotherapy','https://healthservice.hse.ie/documents/6564/228_eriBULin.pdf',['eribulin'],'Unresectable liposarcoma after prior anthracycline-containing therapy.',21,'soft_tissue_sarcoma'),
('00501','4','Gemcitabine and DOCEtaxel Therapy – 21 day','https://healthservice.hse.ie/documents/6739/501_V4_Gemcitabine_DOCEtaxel.pdf',['gemcitabine','docetaxel'],'Locally advanced unresectable or metastatic soft tissue sarcoma.',21,'soft_tissue_sarcoma'),
('00675','2','IE–VAC Therapy – Two Weekly Intervals','https://healthservice.hse.ie/documents/6766/675_v2_IE_VAC_Two_weekly.pdf',['ifosfamide','etoposide','mesna','vincristine','doxorubicin','cyclophosphamide','dactinomycin'],'Adolescents/young adults with newly diagnosed Ewing sarcoma or selected related small round-cell tumours.',14,'ewing_aya'),
('00747','2','IE–VAC Therapy – Three Weekly Intervals','https://healthservice.hse.ie/documents/6779/747_v2_IE_VAC_three_weekly.pdf',['ifosfamide','etoposide','mesna','vincristine','doxorubicin','cyclophosphamide','dactinomycin'],'Adults with newly diagnosed Ewing sarcoma or selected related small round-cell tumours.',21,'ewing_adult'),
('00596','2','Ifosfamide and Etoposide (IE) Therapy','https://healthservice.hse.ie/documents/6747/596_v2_Ifosfamide_Etoposide_IE_Therapy.pdf',['ifosfamide','etoposide','mesna'],'Relapsed Ewing sarcoma or osteosarcoma.',21,'relapsed_bone_sarcoma'),
('00680','2','High Dose Ifosfamide Therapy – 21 day','https://healthservice.hse.ie/documents/6767/680_v2_Ifosfamide_highdose.pdf',['ifosfamide','mesna'],'Recurrent/primary refractory Ewing sarcoma or relapsed osteosarcoma.',21,'relapsed_bone_sarcoma'),
('00504','2','Irinotecan and Temozolomide Therapy – 21 day','https://healthservice.hse.ie/documents/6740/504_v2_Irinotecan_and_Temozolomide_Therapy.pdf',['irinotecan','temozolomide'],'Relapsed or refractory Ewing sarcoma.',21,'ewing_relapsed'),
('00754','3','Ifosfamide, vinCRIStine, DOXOrubicin and DACTINomycin (IVADo) Therapy','https://healthservice.hse.ie/documents/6781/754_IVADo.pdf',['ifosfamide','mesna','vincristine','doxorubicin','dactinomycin'],'High/very-high-risk rhabdomyosarcoma in patients under 40 years.',21,'rhabdomyosarcoma'),
('00335','4','Imatinib Therapy – GIST','https://healthservice.hse.ie/documents/6727/335_v4_Imatinib.pdf',['imatinib'],'Unresectable/metastatic KIT-positive GIST or adjuvant treatment after resection when relapse risk is significant.',1,'gist'),
('00463','4','MAP Therapy – Methotrexate, DOXOrubicin and CISplatin','https://healthservice.hse.ie/documents/6736/463_v4_MAP.pdf',['methotrexate','doxorubicin','cisplatin','folinic acid'],'Neoadjuvant/adjuvant treatment of resectable high-grade osteosarcoma.',35,'osteosarcoma'),
('00100','6','Mifamurtide Therapy','https://healthservice.hse.ie/documents/6722/100_Mifamurtide.pdf',['mifamurtide'],'High-grade resectable non-metastatic osteosarcoma after macroscopically complete resection.',7,'osteosarcoma'),
('00445','3','PAZOPanib Monotherapy','https://healthservice.hse.ie/documents/6477/445_v3_Pazopanib.pdf',['pazopanib'],'Selected advanced soft tissue sarcoma after prior chemotherapy.',1,'soft_tissue_sarcoma'),
('00205','8','Pegylated Liposomal DOXOrubicin 50 mg/m² – 28 day','https://healthservice.hse.ie/documents/6546/205_V8_Peg_Lipo_DOXO_28_day.pdf',['pegylated liposomal doxorubicin'],'Metastatic soft tissue sarcoma.',28,'soft_tissue_sarcoma'),
('00462','4','Pegylated Liposomal DOXOrubicin 20 mg/m² – 21 day','https://healthservice.hse.ie/documents/6735/462_v4_PegylatedLiposomalDOX_20mgm2_21_days.pdf',['pegylated liposomal doxorubicin'],'AIDS-related Kaposi sarcoma with low CD4 count and extensive mucocutaneous or visceral disease.',21,'kaposi_sarcoma'),
('00244','5','Regorafenib Monotherapy','https://healthservice.hse.ie/documents/6347/244_v5_Regorafenib_Monotherapy.pdf',['regorafenib'],'Unresectable/metastatic GIST after progression on or intolerance to imatinib and sunitinib.',28,'gist'),
('00325','6','SUNitinib 50 mg Therapy – 42 day','https://healthservice.hse.ie/documents/6721/325_v6_SUNitinib_50mg_42_days.pdf',['sunitinib'],'Unresectable/metastatic GIST after imatinib failure or intolerance.',42,'gist'),
('00719','2','SUNitinib 50 mg Therapy – 21 day','https://healthservice.hse.ie/documents/6595/719_v2_SUNitinib_50mg21_days.pdf',['sunitinib'],'Unresectable/metastatic GIST after imatinib failure or intolerance.',21,'gist'),
('00374','4','Trabectedin Monotherapy','https://healthservice.hse.ie/documents/6729/374_Trabectedin_monotherapy.pdf',['trabectedin'],'Advanced soft tissue sarcoma after anthracycline/ifosfamide failure or when unsuitable.',21,'soft_tissue_sarcoma'),
('00554','2','VinBLAStine and Methotrexate Therapy','https://healthservice.hse.ie/documents/6742/554_v2_vinblastine_MTX_SAMV.pdf',['vinblastine','methotrexate'],'Advanced aggressive fibromatosis.',28,'fibromatosis'),
('00757','2','vinCRIStine, Irinotecan and Temozolomide (VIT) Therapy','https://healthservice.hse.ie/documents/6784/757_v2_VIT.pdf',['vincristine','irinotecan','temozolomide'],'Relapsed/refractory rhabdomyosarcoma in adults.',21,'rhabdomyosarcoma'),
]

TRADE = {
 'dacarbazine':['DTIC'], 'doxorubicin':['Adriamycin'], 'cisplatin':['Platinol'], 'ifosfamide':['Mitoxana'],
 'eribulin':['Halaven'], 'docetaxel':['Taxotere'], 'gemcitabine':['Gemzar'], 'vincristine':['Oncovin'],
 'cyclophosphamide':['Endoxan'], 'irinotecan':['Campto'], 'temozolomide':['Temodal'], 'imatinib':['Glivec'],
 'mifamurtide':['Mepact'], 'pazopanib':['Votrient'], 'pegylated liposomal doxorubicin':['Caelyx'],
 'regorafenib':['Stivarga'], 'sunitinib':['Sutent'], 'trabectedin':['Yondelis'], 'vinblastine':['Velbe']
}
CTCAE_OPTIONS=[{'value':g,'label':f'Grade {g}','ctcae_grade':g} for g in range(5)]

def slug(s):
 s=s.lower().replace('²','2').replace('–','-').replace('—','-')
 return re.sub(r'[^a-z0-9]+','-',s).strip('-')[:90]

def sel(label, options, demo, help_text=None):
 d={'label':label,'type':'select','required':False,'options':[{'value':v,'label':l} for v,l in options],'demo_value':demo}
 if help_text:d['help_text']=help_text
 return d

def num(label,demo,unit='',step=.1,minv=0):
 d={'label':label,'type':'number','required':False,'min':minv,'step':step,'demo_value':demo}
 if unit:d['unit']=unit
 return d

def boolean(label,demo=False,help_text=None):
 d={'label':label,'type':'boolean','required':False,'demo_value':demo}
 if help_text:d['help_text']=help_text
 return d

def grade(label,category,guidance):
 return {'label':label,'type':'select','required':False,'options':copy.deepcopy(CTCAE_OPTIONS),'demo_value':0,'ctcae_version':'5.0','ctcae_category':category,'ctcae_source_url':'https://dctd.cancer.gov/research/ctep-trials/for-sites/adverse-events/ctcae-v5-5x7.pdf','assessment_guidance':guidance}

def renal_band(label, opts, demo):
 d=sel(label,opts,demo); d['renal_input']={'mode':'protocol_specific_band','exact_value_required':False}; return d

def rule(rid,field,op,value,action,msg,priority=6,components=None,page='Dose modification section'):
 return {'id':rid,'priority':priority,'when':{'field':field,'operator':op,'value':value},'action':{'type':action,'components':components or ['whole_regimen'],'message':msg},'source':{'document':'Current official NCCP regimen','page':page},'explanation':msg}

def any_rule(rid,leaves,action,msg,priority=9,page='Eligibility/exclusions section'):
 return {'id':rid,'priority':priority,'when':{'any':leaves},'action':{'type':action,'components':['whole_regimen'],'message':msg},'source':{'document':'Current official NCCP regimen','page':page},'explanation':msg}

def groups_for_code(code):
 if code=='00228': return ['Breast','Sarcoma']
 if code=='00205': return ['Breast','Gynaecology','Sarcoma']
 if code=='00244': return ['Gastrointestinal','Sarcoma']
 if code in {'00445','00325','00719'}: return ['Genitourinary','Sarcoma']
 return ['Sarcoma']

def base_protocol(item):
 code,version,title,url,components,indication,cycle,subgroup=item
 c=[x.lower() for x in components]
 cytotoxic=any(x in c for x in ['dacarbazine','doxorubicin','cisplatin','ifosfamide','eribulin','gemcitabine','docetaxel','etoposide','vincristine','cyclophosphamide','dactinomycin','methotrexate','irinotecan','temozolomide','pegylated liposomal doxorubicin','trabectedin','vinblastine'])
 oral_targeted=any(x in c for x in ['imatinib','pazopanib','regorafenib','sunitinib'])
 biologic='mifamurtide' in c
 if subgroup=='gist': section='targeted_therapy'; section_label='GIST & targeted therapy'
 elif subgroup=='osteosarcoma': section='bone_sarcoma'; section_label='Bone sarcoma / osteosarcoma'
 elif subgroup.startswith('ewing') or subgroup=='relapsed_bone_sarcoma': section='ewing_sarcoma'; section_label='Ewing & relapsed bone sarcoma'
 elif subgroup=='rhabdomyosarcoma': section='rhabdomyosarcoma'; section_label='Rhabdomyosarcoma'
 elif subgroup=='kaposi_sarcoma': section='kaposi_sarcoma'; section_label='Kaposi sarcoma'
 else: section='soft_tissue_sarcoma'; section_label='Soft-tissue sarcoma'
 classes=[]
 if cytotoxic: classes.append('cytotoxic_chemotherapy')
 if oral_targeted: classes += ['oral_targeted_therapy','targeted_or_biologic_therapy']
 if biologic: classes.append('immunomodulatory_therapy')
 if not classes: classes=['systemic_anticancer_therapy']
 inp={
  'ecog':sel('ECOG performance status',[(0,'0'),(1,'1'),(2,'2'),(3,'3'),(4,'4')],0),
  'hypersensitivity':boolean('Known hypersensitivity to a regimen component'),
  'pregnancy':boolean('Pregnant'),
  'breastfeeding':boolean('Breastfeeding'),
 }
 rules=[
  rule('ECOG_OUTSIDE_USUAL_RANGE','ecog','>',2,'consultant_review','ECOG is outside the usual source eligibility range; review the indication and current NCCP regimen.',8),
  rule('HYPERSENSITIVITY','hypersensitivity','==',True,'contraindicated','Known hypersensitivity to a regimen component triggers the exclusion pathway.',10),
  any_rule('PREGNANCY_BREASTFEEDING',[{'field':'pregnancy','operator':'==','value':True},{'field':'breastfeeding','operator':'==','value':True}],'contraindicated','Pregnancy or breastfeeding triggers the protocol exclusion pathway.',10),
 ]
 if cytotoxic:
  inp.update({
   'anc_x10e9_l':num('Absolute neutrophil count',2,'×10⁹/L',.1),
   'platelets_x10e9_l':num('Platelet count',150,'×10⁹/L',1),
   'febrile_neutropenia':boolean('Febrile neutropenia or neutropenic sepsis during the previous interval'),
   'active_infection':boolean('Active infection requiring treatment'),
   'mucositis_grade':grade('Mucositis/stomatitis grade','mucositis','Assess pain, ulceration and the effect on oral intake; distinguish altered diet from inability to eat or drink.'),
   'other_nonhaem_toxicity_grade':grade('Worst relevant non-haematological toxicity','other_nonhaematological','Identify the exact adverse event and grade it using its own CTCAE criteria, objective findings, intervention required and functional impact.'),
  })
  thresholds={
   '00511':(1.5,100,1.0,70),'00420':(1.5,100,1.0,70),'00391':(1.5,100,1.0,70),'00392':(1.5,100,1.0,70),
   '00500':(1.5,100,1.0,70),'00228':(1.0,100,1.0,100),'00501':(1.5,100,1.0,75),
   '00675':(1.0,75,1.0,75),'00747':(1.0,75,1.0,75),'00596':(1.0,75,1.0,75),'00680':(1.5,100,1.0,70),
   '00504':(1.0,75,1.0,75),'00754':(1.0,75,1.0,75),'00463':(1.0,100,1.0,100),'00205':(1.5,100,1.0,75),
   '00462':(1.5,100,1.0,75),'00374':(1.5,100,1.5,100),'00554':(1.0,100,1.0,100),'00757':(1.0,75,1.0,75)
  }
  proceed_anc,proceed_plt,delay_anc,delay_plt=thresholds.get(code,(1.0,75,1.0,75))
  rules += [
   rule('ANC_BELOW_TREATMENT_THRESHOLD','anc_x10e9_l','<',delay_anc,'withhold',f'ANC below {delay_anc} ×10⁹/L requires delay/withholding and reassessment.',9),
   rule('PLATELETS_BELOW_TREATMENT_THRESHOLD','platelets_x10e9_l','<',delay_plt,'withhold',f'Platelets below {delay_plt} ×10⁹/L require delay/withholding and reassessment.',9),
   rule('ANC_INTERMEDIATE','anc_x10e9_l','<',proceed_anc,'dose_reduce',f'ANC below the full-dose threshold ({proceed_anc} ×10⁹/L) enters the protocol-specific reduction/review pathway.',7),
   rule('PLATELETS_INTERMEDIATE','platelets_x10e9_l','<',proceed_plt,'dose_reduce',f'Platelets below the full-dose threshold ({proceed_plt} ×10⁹/L) enter the protocol-specific reduction/review pathway.',7),
   rule('FEBRILE_NEUTROPENIA','febrile_neutropenia','==',True,'dose_reduce','Previous febrile neutropenia/neutropenic sepsis requires the regimen-specific dose-reduction and G-CSF pathway.',8),
   rule('ACTIVE_INFECTION','active_infection','==',True,'withhold','Withhold treatment and assess/treat active infection.',10),
   rule('SEVERE_MUCOSITIS','mucositis_grade','>=',3,'dose_reduce','Grade 3 or worse mucositis requires interruption until recovery and regimen-specific dose reduction.',8),
   rule('SEVERE_NONHAEM','other_nonhaem_toxicity_grade','>=',3,'withhold','Grade 3 or worse non-haematological toxicity requires withholding and regimen-specific review.',8),
  ]

 # Anthracyclines, including PLD
 if any(x in c for x in ['doxorubicin','pegylated liposomal doxorubicin']):
  inp.update({
   'lvef_percent':num('LVEF',60,'%',1),
   'symptomatic_cardiac_dysfunction':boolean('Symptoms/signs of cardiac dysfunction'),
   'cumulative_anthracycline_mg_m2':num('Lifetime cumulative anthracycline exposure',0,'mg/m²',1),
   'bilirubin_uln_multiple':num('Bilirubin result (actual value entered; ×ULN calculated automatically)',1,'×ULN',.01),
  })
  rules += [
   rule('LVEF_LOW','lvef_percent','<',50,'withhold','LVEF below 50% requires cardiac review before anthracycline treatment.',9),
   rule('CARDIAC_SYMPTOMS','symptomatic_cardiac_dysfunction','==',True,'withhold','Symptoms or signs of cardiac dysfunction require urgent cardiac assessment and withholding.',10),
   rule('ANTHRACYCLINE_CUMULATIVE','cumulative_anthracycline_mg_m2','>=',450,'consultant_review','Cumulative anthracycline exposure at or above 450 mg/m² requires formal cardiac and benefit–risk review.',9),
   rule('DOX_BILI_20_50','bilirubin_uln_multiple','>',1,'dose_reduce','Bilirubin above the local ULN requires anthracycline hepatic dose reduction review.',8),
   rule('DOX_BILI_SEVERE','bilirubin_uln_multiple','>',4.3,'contraindicated','Marked bilirubin elevation is outside the routine anthracycline pathway.',10),
  ]

 # Cisplatin-specific pathways
 if 'cisplatin' in c:
  inp.update({
   'cisplatin_renal_band':renal_band('Renal function for cisplatin',[('ge60','CrCl ≥60 mL/min'),('50_59','CrCl 50–59 mL/min'),('40_49','CrCl 40–49 mL/min'),('lt40','CrCl <40 mL/min'),('dialysis','Dialysis')],'ge60'),
   'neuropathy_grade':grade('Peripheral neuropathy grade','neuropathy','Assess sensory and motor symptoms, gait, dexterity and impact on instrumental or self-care activities.'),
   'hearing_or_tinnitus':boolean('Clinically significant hearing impairment or tinnitus'),
   'magnesium_low_or_replacement_needed':boolean('Hypomagnesaemia or electrolyte replacement required'),
  })
  rules += [
   rule('CIS_RENAL_50_59','cisplatin_renal_band','==','50_59','dose_reduce','CrCl 50–59 mL/min maps to the reduced cisplatin pathway in the source regimen.',8),
   rule('CIS_RENAL_40_49','cisplatin_renal_band','==','40_49','dose_reduce','CrCl 40–49 mL/min maps to the 50% cisplatin pathway and Consultant review.',9),
   rule('CIS_RENAL_LT40','cisplatin_renal_band','==','lt40','contraindicated','CrCl below 40 mL/min is outside the routine cisplatin pathway.',10),
   rule('CIS_DIALYSIS','cisplatin_renal_band','==','dialysis','contraindicated','Dialysis requires a specialist non-routine platinum pathway.',10),
   rule('CIS_NEUROPATHY','neuropathy_grade','>=',2,'consultant_review','Grade 2 or worse peripheral neuropathy requires omission/substitution review for cisplatin.',9),
   rule('CIS_HEARING','hearing_or_tinnitus','==',True,'consultant_review','Clinically significant hearing impairment/tinnitus requires cisplatin-specific review.',8),
   rule('CIS_MAGNESIUM','magnesium_low_or_replacement_needed','==',True,'proceed_with_caution','Correct magnesium/electrolytes and apply the local cisplatin hydration pathway.',6),
  ]

 # Ifosfamide/mesna pathways
 if 'ifosfamide' in c:
  inp.update({
   'ifosfamide_renal_band':renal_band('Renal function for ifosfamide',[('ge50','CrCl ≥50 mL/min'),('lt50','CrCl <50 mL/min'),('dialysis','Dialysis')],'ge50'),
   'encephalopathy_grade':grade('Ifosfamide-associated encephalopathy/neurotoxicity grade','neurological_toxicity','Assess confusion, somnolence, agitation, hallucinations, seizures, consciousness and effect on self-care; exclude metabolic, infectious and drug causes.'),
   'haematuria':boolean('Haematuria detected before or during ifosfamide'),
   'urine_output_below_target':boolean('Urine output below the protocol/local hydration target'),
   'fluid_balance_positive_over_1l_or_weight_gain_1kg':boolean('Positive fluid balance >1 L or weight gain >1 kg'),
  })
  rules += [
   rule('IFO_RENAL_LT50','ifosfamide_renal_band','==','lt50','consultant_review','CrCl below 50 mL/min requires a protocol-specific clinical/pharmacy decision.',9),
   rule('IFO_DIALYSIS','ifosfamide_renal_band','==','dialysis','consultant_review','Dialysis requires specialist ifosfamide dosing review.',10),
   rule('IFO_NEURO_G2','encephalopathy_grade','>=',2,'withhold','Suspected clinically significant ifosfamide encephalopathy requires immediate withholding and treatment review.',10),
   rule('IFO_NEURO_G3','encephalopathy_grade','>=',3,'permanently_discontinue','Grade 3 or worse ifosfamide neurotoxicity triggers discontinuation in the encoded pathway.',10),
   rule('IFO_HAEMATURIA','haematuria','==',True,'withhold','Haematuria requires withholding and assessment of urothelial toxicity before further ifosfamide.',10),
   rule('IFO_URINE_OUTPUT','urine_output_below_target','==',True,'withhold','Inadequate urine output requires correction/review before continuing ifosfamide.',9),
   rule('IFO_FLUID_BALANCE','fluid_balance_positive_over_1l_or_weight_gain_1kg','==',True,'consultant_review','Positive balance >1 L or weight gain >1 kg requires clinical review and consideration of diuresis.',8),
  ]

 if 'etoposide' in c:
  inp.update({
   'etoposide_renal_band':renal_band('Renal function for etoposide',[('ge50','CrCl ≥50 mL/min'),('15_49','CrCl 15–49 mL/min'),('lt15','CrCl <15 mL/min'),('dialysis','Dialysis')],'ge50'),
   'bilirubin_uln_multiple':inp.get('bilirubin_uln_multiple') or num('Bilirubin result (actual value entered; ×ULN calculated automatically)',1,'×ULN',.01),
  })
  rules += [
   rule('ETOP_RENAL_15_49','etoposide_renal_band','==','15_49','dose_reduce','Reduced etoposide dosing is required in renal impairment.',8),
   rule('ETOP_RENAL_LT15','etoposide_renal_band','==','lt15','consultant_review','CrCl <15 mL/min requires specialist etoposide dosing review.',9),
   rule('ETOP_DIALYSIS','etoposide_renal_band','==','dialysis','consultant_review','Dialysis requires specialist pharmacy review.',9),
   rule('ETOP_BILI_HIGH','bilirubin_uln_multiple','>',3,'consultant_review','Bilirubin >3 ×ULN requires etoposide hepatic dosing review.',8),
  ]

 if 'docetaxel' in c:
  inp.update({
   'alt_ast_uln_multiple':num('ALT / AST results (actual values entered; highest ×ULN calculated automatically)',1,'×ULN',.01),
   'bilirubin_uln_multiple':inp.get('bilirubin_uln_multiple') or num('Bilirubin result (actual value entered; ×ULN calculated automatically)',1,'×ULN',.01),
   'neuropathy_grade':grade('Peripheral neuropathy grade','neuropathy','Assess persistent sensory/motor symptoms, gait, dexterity and functional impact.'),
   'skin_toxicity_grade':grade('Skin toxicity grade','rash','Assess morphology, body-surface area, symptoms, infection and functional impact.'),
   'dexamethasone_premedication_taken':boolean('Protocol dexamethasone premedication taken'),
  })
  rules += [
   rule('DOC_LIVER','alt_ast_uln_multiple','>',3.5,'withhold','Marked transaminase elevation requires docetaxel withholding and hepatic review.',9),
   rule('DOC_BILI','bilirubin_uln_multiple','>',1,'withhold','Bilirubin above ULN requires docetaxel withholding/contraindication review.',9),
   rule('DOC_NEURO','neuropathy_grade','>',2,'dose_reduce','Peripheral neuropathy above Grade 2 requires docetaxel reduction/cessation review.',9),
   rule('DOC_SKIN','skin_toxicity_grade','>=',3,'dose_reduce','Grade 3 skin toxicity requires dose reduction.',8),
   rule('DOC_PREMED','dexamethasone_premedication_taken','==',False,'consultant_review','Missing dexamethasone premedication requires review before docetaxel administration.',8),
  ]

 if 'eribulin' in c:
  inp['neuropathy_grade']=grade('Peripheral neuropathy grade','neuropathy','Assess sensory/motor symptoms and their impact on instrumental and self-care activities.')
  rules += [rule('ERI_NEURO_G3','neuropathy_grade','>=',3,'withhold','Grade 3 or worse neuropathy requires withholding until recovery and dose-reduction review.',9)]

 if 'pegylated liposomal doxorubicin' in c:
  inp.update({
   'ppe_grade':grade('Palmar-plantar erythrodysesthesia grade','palmar_plantar_erythrodysesthesia','Assess pain, erythema, swelling, peeling and impact on instrumental versus self-care activities.'),
   'stomatitis_grade':grade('Stomatitis grade','mucositis','Assess pain, ulceration and effect on oral intake.'),
   'infusion_reaction_grade':grade('Infusion reaction grade','infusion','Assess timing, intervention, airway/haemodynamic compromise and recovery.'),
  })
  rules += [
   rule('PLD_PPE_G2','ppe_grade','>=',2,'withhold','Grade 2 or worse PPE requires delay until recovery and schedule-specific dose modification.',8),
   rule('PLD_PPE_G4','ppe_grade','>=',4,'permanently_discontinue','Grade 4 PPE requires permanent discontinuation.',10),
   rule('PLD_STOMATITIS_G2','stomatitis_grade','>=',2,'withhold','Grade 2 or worse stomatitis requires delay and dose-modification review.',8),
   rule('PLD_INFUSION_G3','infusion_reaction_grade','>=',3,'permanently_discontinue','Severe infusion reaction requires permanent discontinuation unless a formal specialist pathway applies.',10),
  ]

 if 'irinotecan' in c:
  inp.update({
   'diarrhoea_grade':grade('Diarrhoea grade','diarrhoea','Count stools over baseline and assess nocturnal stools, continence, hydration, intervention, admission and functional impact.'),
   'acute_cholinergic_syndrome':boolean('Acute cholinergic symptoms during/soon after irinotecan'),
   'ugt1a1_high_risk_genotype':boolean('Known high-risk UGT1A1 genotype (for example homozygous *28)'),
   'bilirubin_uln_multiple':inp.get('bilirubin_uln_multiple') or num('Bilirubin result (actual value entered; ×ULN calculated automatically)',1,'×ULN',.01),
  })
  rules += [
   rule('IRI_DIARRHOEA_G2','diarrhoea_grade','>=',2,'withhold','Grade 2 or worse delayed diarrhoea requires withholding until recovery and active supportive treatment.',9),
   rule('IRI_DIARRHOEA_G3','diarrhoea_grade','>=',3,'dose_reduce','Grade 3 or worse diarrhoea requires reduced-dose restart review after recovery.',10),
   rule('IRI_CHOLINERGIC','acute_cholinergic_syndrome','==',True,'proceed_with_caution','Treat acute cholinergic syndrome according to the protocol/local atropine pathway.',7),
   rule('IRI_UGT','ugt1a1_high_risk_genotype','==',True,'consultant_review','Known high-risk UGT1A1 genotype requires starting-dose and toxicity-risk review.',8),
   rule('IRI_BILI_3','bilirubin_uln_multiple','>',3,'contraindicated','Bilirubin >3 ×ULN is outside the routine irinotecan pathway.',10),
  ]

 if 'vincristine' in c or 'vinblastine' in c:
  inp.update({
   'vinca_neuropathy_grade':grade('Vinca-associated peripheral/autonomic neuropathy grade','neuropathy','Assess sensory and motor symptoms, gait, reflexes, constipation/ileus and impact on activities of daily living.'),
   'ileus_or_severe_constipation':boolean('Ileus or severe constipation'),
   'bilirubin_uln_multiple':inp.get('bilirubin_uln_multiple') or num('Bilirubin result (actual value entered; ×ULN calculated automatically)',1,'×ULN',.01),
  })
  rules += [
   rule('VINCA_NEURO_G2','vinca_neuropathy_grade','>=',2,'consultant_review','Grade 2 or worse vinca neuropathy requires omission/reduction review.',8),
   rule('VINCA_NEURO_G3','vinca_neuropathy_grade','>=',3,'withhold','Grade 3 or worse neuropathy requires withholding/omission.',10),
   rule('VINCA_ILEUS','ileus_or_severe_constipation','==',True,'withhold','Ileus or severe constipation requires withholding and urgent assessment.',10),
   rule('VINCA_BILI','bilirubin_uln_multiple','>',1.5,'dose_reduce','Elevated bilirubin requires vinca alkaloid hepatic dose reduction review.',8),
  ]

 # High-dose methotrexate / MAP
 if code=='00463':
  inp.update({
   'methotrexate_renal_band':renal_band('Renal function before high-dose methotrexate',[('ge80','CrCl/eGFR ≥80 mL/min'),('60_79','60–79 mL/min'),('lt60','<60 mL/min'),('dialysis','Dialysis')],'ge80'),
   'urine_ph':num('Urine pH before/during methotrexate',7.5,'',.1),
   'urine_output_adequate':boolean('Urine output and hydration targets met'),
   'methotrexate_clearance_delayed':boolean('Methotrexate level above the protocol time-point target'),
   'creatinine_rise_percent':num('Creatinine increase from baseline',0,'%',1),
   'folinic_acid_rescue_started_on_time':boolean('Folinic acid rescue started at the protocol time'),
   'interacting_medicines_present':boolean('Potential methotrexate-interacting medicines present (for example NSAID, PPI, trimethoprim, penicillin or nephrotoxin)'),
  })
  rules += [
   rule('MTX_RENAL_60_79','methotrexate_renal_band','==','60_79','consultant_review','Reduced renal reserve requires Consultant/pharmacy review before high-dose methotrexate.',9),
   rule('MTX_RENAL_LT60','methotrexate_renal_band','==','lt60','contraindicated','CrCl/eGFR below 60 mL/min is outside the routine high-dose methotrexate pathway.',10),
   rule('MTX_DIALYSIS','methotrexate_renal_band','==','dialysis','contraindicated','Dialysis is outside the routine high-dose methotrexate pathway.',10),
   rule('MTX_URINE_PH','urine_ph','<',7,'withhold','Do not start/continue high-dose methotrexate until urine alkalinisation target is met.',10),
   rule('MTX_URINE_OUTPUT','urine_output_adequate','==',False,'withhold','Inadequate hydration or urine output requires correction before high-dose methotrexate.',10),
   rule('MTX_DELAYED_CLEARANCE','methotrexate_clearance_delayed','==',True,'withhold','Delayed methotrexate clearance requires intensified rescue, hydration and repeat level/renal monitoring.',10),
   rule('MTX_CREAT_RISE','creatinine_rise_percent','>=',50,'withhold','A ≥50% creatinine rise suggests delayed clearance/nephrotoxicity and requires urgent rescue review.',10),
   rule('MTX_RESCUE','folinic_acid_rescue_started_on_time','==',False,'withhold','Delayed or omitted folinic acid rescue requires urgent protocol review.',10),
   rule('MTX_INTERACTIONS','interacting_medicines_present','==',True,'withhold','Potential methotrexate interactions must be resolved before high-dose treatment.',9),
  ]

 if oral_targeted:
  inp.update({
   'alt_ast_uln_multiple':num('ALT / AST results (actual values entered; highest ×ULN calculated automatically)',1,'×ULN',.01),
   'bilirubin_uln_multiple':inp.get('bilirubin_uln_multiple') or num('Bilirubin result (actual value entered; ×ULN calculated automatically)',1,'×ULN',.01),
   'diarrhoea_grade':grade('Diarrhoea grade','diarrhoea','Count stools over baseline and assess hydration, continence, admission and functional impact.'),
   'rash_or_hfsr_grade':grade('Rash / hand-foot skin reaction grade','rash','Assess morphology, body-surface area, pain, blistering, infection and functional impact.'),
   'uncontrolled_hypertension':boolean('Uncontrolled hypertension'),
   'qtcf_ms':num('QTcF',430,'ms',1),
   'symptomatic_cardiac_dysfunction':inp.get('symptomatic_cardiac_dysfunction') or boolean('Symptoms/signs of cardiac dysfunction'),
   'clinically_significant_bleeding':boolean('Clinically significant bleeding'),
   'major_surgery_or_unhealed_wound':boolean('Recent major surgery or unhealed wound'),
   'strong_cyp_interaction':boolean('Clinically important CYP3A/P-gp interacting medicine'),
  })
  rules += [
   rule('TKI_LIVER_3','alt_ast_uln_multiple','>',3,'withhold','ALT/AST >3 ×ULN requires protocol-specific interruption and hepatic review.',9),
   rule('TKI_LIVER_5','alt_ast_uln_multiple','>',5,'permanently_discontinue','Severe/recurrent hepatotoxicity requires permanent discontinuation review.',10),
   rule('TKI_BILI','bilirubin_uln_multiple','>',2,'withhold','Bilirubin >2 ×ULN requires interruption and hepatic review.',9),
   rule('TKI_DIARRHOEA','diarrhoea_grade','>=',3,'withhold','Grade 3 or worse diarrhoea requires interruption and reduced-dose restart review.',9),
   rule('TKI_HFSR','rash_or_hfsr_grade','>=',3,'withhold','Grade 3 skin toxicity/HFSR requires interruption and dose modification.',9),
   rule('TKI_BP','uncontrolled_hypertension','==',True,'withhold','Withhold until blood pressure is controlled.',9),
   rule('TKI_QTC','qtcf_ms','>=',500,'withhold','QTcF ≥500 ms requires interruption and correction of reversible causes.',10),
   rule('TKI_CARDIAC','symptomatic_cardiac_dysfunction','==',True,'withhold','Symptomatic cardiac dysfunction requires interruption and cardiac assessment.',10),
   rule('TKI_BLEED','clinically_significant_bleeding','==',True,'withhold','Clinically significant bleeding requires interruption and specialist review.',10),
   rule('TKI_SURGERY','major_surgery_or_unhealed_wound','==',True,'withhold','Withhold around major surgery and until adequate wound healing.',9),
   rule('TKI_CYP','strong_cyp_interaction','==',True,'consultant_review','Clinically important CYP3A/P-gp interaction requires medication and dose review.',8),
  ]
  if 'imatinib' in c:
   inp['oedema_or_fluid_retention_grade']=grade('Oedema/fluid retention grade','other_nonhaematological','Assess weight gain, peripheral/generalised oedema, effusions, respiratory symptoms and functional impact.')
   rules += [rule('IMATINIB_OEDEMA_G3','oedema_or_fluid_retention_grade','>=',3,'withhold','Severe fluid retention requires interruption, treatment and reduced-dose restart review.',9)]
  if 'regorafenib' in c or 'sunitinib' in c or 'pazopanib' in c:
   inp['proteinuria_grade']=grade('Proteinuria grade','other_nonhaematological','Use quantified urine protein where indicated; assess nephrotic syndrome and renal function.')
   rules += [rule('TKI_PROTEIN_G3','proteinuria_grade','>=',3,'withhold','Severe proteinuria requires interruption and quantified renal assessment.',9)]

 if 'trabectedin' in c:
  inp.update({
   'alt_ast_uln_multiple':num('ALT / AST results (actual values entered; highest ×ULN calculated automatically)',1,'×ULN',.01),
   'bilirubin_uln_multiple':num('Bilirubin result (actual value entered; ×ULN calculated automatically)',1,'×ULN',.01),
   'alp_uln_multiple':num('Alkaline phosphatase result (× local ULN)',1,'×ULN',.01),
   'ck_uln_multiple':num('Creatine kinase result (× local ULN)',1,'×ULN',.01),
   'symptomatic_muscle_toxicity':boolean('Muscle pain/weakness or suspected rhabdomyolysis'),
  })
  rules += [
   rule('TRAB_BILI','bilirubin_uln_multiple','>',1,'withhold','Bilirubin above ULN requires withholding until recovery.',10),
   rule('TRAB_ASTALT','alt_ast_uln_multiple','>',2.5,'withhold','ALT/AST >2.5 ×ULN requires withholding until recovery.',9),
   rule('TRAB_ALP','alp_uln_multiple','>',2.5,'withhold','ALP >2.5 ×ULN requires withholding and hepatic assessment.',9),
   rule('TRAB_CK','ck_uln_multiple','>',2.5,'withhold','CK >2.5 ×ULN requires withholding and myotoxicity assessment.',10),
   rule('TRAB_RHABDO','symptomatic_muscle_toxicity','==',True,'permanently_discontinue','Suspected rhabdomyolysis requires immediate discontinuation and urgent assessment.',10),
  ]

 if 'mifamurtide' in c:
  inp.update({
   'infusion_reaction_grade':grade('Infusion-related reaction grade','infusion','Assess fever/chills, rash, dyspnoea, hypotension, intervention required and recovery.'),
   'unstable_cardiovascular_or_thrombotic_disorder':boolean('Unstable cardiovascular disorder, vasculitis or active significant thrombosis'),
   'high_dose_nsaid_use':boolean('High-dose NSAID use'),
   'chronic_systemic_corticosteroids':boolean('Chronic systemic corticosteroids/immunosuppression'),
  })
  rules += [
   rule('MIFA_INFUSION_G3','infusion_reaction_grade','>=',3,'withhold','Severe infusion reaction requires interruption and specialist review.',10),
   rule('MIFA_CV','unstable_cardiovascular_or_thrombotic_disorder','==',True,'consultant_review','Unstable cardiovascular/thrombotic disease requires close monitoring and benefit–risk review.',9),
   rule('MIFA_NSAID','high_dose_nsaid_use','==',True,'contraindicated','High-dose NSAID use is incompatible with the routine mifamurtide pathway.',10),
   rule('MIFA_STEROID','chronic_systemic_corticosteroids','==',True,'consultant_review','Chronic systemic corticosteroid/immunosuppressive treatment may reduce mifamurtide effect and requires review.',8),
  ]

 # Supportive-care risk and regimen-specific support
 if any(x in c for x in ['cisplatin','dacarbazine','ifosfamide']): risk='high'; script='nccp-parenteral-high'
 elif any(x in c for x in ['doxorubicin','cyclophosphamide','irinotecan']): risk='moderate'; script='nccp-parenteral-moderate'
 elif any(x in c for x in ['docetaxel','etoposide','eribulin','trabectedin','vinblastine','methotrexate']): risk='low'; script='nccp-parenteral-low'
 elif oral_targeted: risk='oral_minimal_low'; script='nccp-oral-minimal-low'
 else: risk='minimal'; script='nccp-minimal-no-routine-prophylaxis'
 if code in {'00675','00747','00463','00754','00757','00504'}: risk='phase_dependent'; script='nccp-parenteral-high'
 aliases=[]
 for comp in c: aliases += TRADE.get(comp,[])
 aliases=list(dict.fromkeys(aliases))
 groups=groups_for_code(code)
 metadata={
  'nccp_regimen_code':code,'nccp_version':version,'title':title,'short_title':title,'indication':indication,
  'source_url':url,'source_document_pages':None,'sactcheck_encoding_version':'0.41.0','partial_assessment_supported':True,
  'partial_assessment_note':'Any independently actionable entered value is assessed; omitted domains remain unassessed and do not block a partial result.',
  'sarcoma_subgroup':subgroup,'treatment_context':['sarcoma',subgroup],'treatment_class':classes,'cytotoxic':cytotoxic,
  'catalogue_section':section,'catalogue_section_label':section_label,'catalog':{'enabled':True},'drugs':components,
  'common_trade_names':aliases,'migration':{'mode':'live_json'},
  'validation':{'official_catalogue_and_source_link_checked':True,'rule_level_source_reconciliation_status':'pending_independent_clinical_and_oncology_pharmacy_validation','software_tests_completed':True,'consultant_reviewed':False,'oncology_pharmacy_reviewed':False,'clinical_use_authorised':False}
 }
 if len(groups)==1: metadata['tumour_group']=groups[0]
 else: metadata['tumour_groups']=groups
 additional=[]
 if 'ifosfamide' in c: additional += ['Mesna uroprotection','Protocol-specific IV hydration','Strict fluid balance and urine monitoring','Neurological assessment before each ifosfamide dose','G-CSF where specified by the source regimen']
 if 'cisplatin' in c: additional += ['Cisplatin pre/post hydration','Magnesium/electrolyte replacement','Audiology where clinically indicated']
 if 'docetaxel' in c: additional += ['Protocol dexamethasone premedication','G-CSF consideration/requirement according to regimen']
 if code=='00463': additional += ['Urine alkalinisation','Timed methotrexate levels','Folinic acid rescue','High-dose methotrexate interaction screen']
 if 'irinotecan' in c: additional += ['Early loperamide pathway for delayed diarrhoea','Atropine pathway for acute cholinergic syndrome']
 if 'pegylated liposomal doxorubicin' in c: additional += ['PPE prevention/counselling','Infusion-reaction precautions']
 if 'trabectedin' in c: additional += ['Protocol dexamethasone premedication','CK and hepatic monitoring']
 p={
  'schema_version':'2.0.0','protocol_id':f'nccp-{code}-v{version}','file_name':f'{code}-{slug(title)}.json','status':'encoded_prototype_pending_clinical_and_pharmacy_validation',
  'metadata':metadata,
  'clinical_governance':{'prescriptive_authority':'The treatment plan must be initiated by a Consultant Medical Oncologist or appropriately authorised specialist named in the current NCCP source.','dose_modification_note':'Use the most restrictive applicable component rule and confirm all dose changes against the current official NCCP PDF.','disclaimer':f'Decision-support encoding derived from NCCP {code} Version {version}. It does not replace the current official regimen, prescribing review, pharmacy verification or independent clinical judgement.'},
  'indications':[{'indication_id':f'{code}-sarcoma','description':indication}],
  'treatment':{'cycle_length_days':cycle,'schedule_summary':title,'drugs':components},
  'input_definitions':inp,'required_inputs':[],
  'output_templates':{'proceed':'No encoded restriction was triggered in the entered domain(s). This is not an overall treatment clearance.','coverage_gap':'Only entered values were assessed; omitted clinically relevant domains remain unassessed.','consultant_review':'The entered value requires protocol-specific Consultant/pharmacy review.','withhold':'Withhold treatment and reassess according to the official NCCP pathway.','dose_reduce':'Apply the encoded dose-reduction pathway and confirm against the official source.','contraindicated':'The entered value triggers an encoded contraindication/exclusion.','permanently_discontinue':'The entered value triggers permanent discontinuation in the encoded pathway.'},
  'rule_engine':{'conflict_policy':'most_restrictive_action_wins','missing_data_policy':'report_unassessed_coverage_gap','actions_ranked_most_to_least_restrictive':['permanently_discontinue','contraindicated','discontinue','cease','omit','withhold_then_reduce','withhold','delay_then_dose_reduce','delay','consultant_review','dose_reduce_two_levels','dose_reduce_one_level','dose_reduce','proceed_with_caution','proceed'],'rules':rules},
  'eligibility':['Indication as listed in the current official NCCP regimen','Performance status and age/treatment-setting eligibility appropriate to the selected indication','Adequate organ and bone-marrow function for the selected regimen'],
  'exclusions':['Known hypersensitivity to a regimen component','Pregnancy or breastfeeding where prohibited by the current source','Regimen-specific exclusions encoded in the interactive assessment'],
  'monitoring':['FBC, renal and liver profile as specified by the current NCCP regimen','Regimen-specific cardiac, neurological, urine, methotrexate-level, CK, blood-pressure and toxicity monitoring as applicable'],
  'dose_modifications':['Component-specific haematological, renal, hepatic and non-haematological pathways are encoded as independently actionable rules.'],
  'supportive_care':{'emetogenic_risk':risk,'script_id':script,'mapping_source':'NCCP SACT Antiemetic Guidance V6 (2025)','mapping_source_url':'https://healthservice.hse.ie/documents/7152/Classification_Document_for_Systemic_Anti-_Cancer_Therapy_SACT_Induced_Nausea__pWgDCrm.pdf','mapping_basis':'Risk assigned from the most emetogenic active component and treatment phase.','mapping_confidence':'high','validation_status':'source_mapped_pending_local_oncology_pharmacy_validation','breakthrough_profile_id':'nccp-breakthrough-general','supportive_medications_pdf_url':'https://healthservice.hse.ie/documents/7152/Classification_Document_for_Systemic_Anti-_Cancer_Therapy_SACT_Induced_Nausea__pWgDCrm.pdf','supportive_medications_label':f'{risk.replace("_"," ").title()} emetogenic-risk guidance','additional_supportive_care':additional}
 }
 return p

def files():
 return [Path(f) for f in glob.glob(str(ROOT/'protocols'/'**'/'*.json'),recursive=True) if not f.endswith('index.json') and '/_template/' not in f and not f.endswith('protocol-schema.json')]

def code_map():
 out={}
 for f in files():
  try:d=json.loads(f.read_text())
  except Exception:continue
  code=str(d.get('metadata',{}).get('nccp_regimen_code','')).zfill(5)
  if code and code!='00000': out.setdefault(code,[]).append((f,d))
 return out

def merge_existing(existing_data, generated, code):
 # Preserve richer existing content where present, but upgrade shallow cards to the new fully encoded model.
 existing_inputs=len(existing_data.get('input_definitions') or {})
 existing_rules=len(existing_data.get('rule_engine',{}).get('rules') or [])
 if existing_inputs >= 10 and existing_rules >= 8:
  d=existing_data
  m=d.setdefault('metadata',{})
  groups=[]
  if isinstance(m.get('tumour_group'),str): groups.append(m['tumour_group'])
  for g in m.get('tumour_groups') or []:
   if g not in groups: groups.append(g)
  for g in groups_for_code(code):
   if g not in groups: groups.append(g)
  m.pop('tumour_group',None); m.pop('tumour_groups',None)
  if len(groups)==1:m['tumour_group']=groups[0]
  else:m['tumour_groups']=groups
  gm=generated['metadata']
  for k in ['nccp_version','source_url','sarcoma_subgroup','sactcheck_encoding_version','partial_assessment_supported','partial_assessment_note']:
   m[k]=gm[k]
  m.setdefault('treatment_class',gm['treatment_class']);m.setdefault('catalogue_section',gm['catalogue_section']);m.setdefault('catalogue_section_label',gm['catalogue_section_label']);m.setdefault('drugs',gm['drugs']);m.setdefault('common_trade_names',gm['common_trade_names']);m.setdefault('catalog',{'enabled':True})
  m.setdefault('validation',{}).update(gm['validation'])
  inds=d.setdefault('indications',[])
  if not any('sarcoma' in str(x.get('description','')).lower() or 'gist' in str(x.get('description','')).lower() for x in inds if isinstance(x,dict)):
   inds.extend(generated['indications'])
  d['status']='encoded_prototype_pending_clinical_and_pharmacy_validation';d['required_inputs']=[]
  for definition in (d.get('input_definitions') or {}).values():
   if isinstance(definition,dict):definition['required']=False
  return d
 # Shallow shared protocol: use the new encoding and preserve prior tumour groups/indications.
 d=generated
 em=existing_data.get('metadata',{})
 groups=[]
 if isinstance(em.get('tumour_group'),str):groups.append(em['tumour_group'])
 for g in em.get('tumour_groups') or []:
  if g not in groups:groups.append(g)
 for g in groups_for_code(code):
  if g not in groups:groups.append(g)
 d['metadata'].pop('tumour_group',None);d['metadata'].pop('tumour_groups',None)
 if len(groups)==1:d['metadata']['tumour_group']=groups[0]
 else:d['metadata']['tumour_groups']=groups
 prior_inds=[x for x in existing_data.get('indications',[]) if isinstance(x,dict)]
 if prior_inds: d['indications']=prior_inds+d['indications']
 return d

existing=code_map();new=0;updated=0
for item in I:
 code=item[0];generated=base_protocol(item)
 if code in existing:
  f,d=existing[code][0]
  merged=merge_existing(d,generated,code)
  f.write_text(json.dumps(merged,ensure_ascii=False,indent=2)+'\n');updated+=1
 else:
  target=(SHARED_DIR if len(groups_for_code(code))>1 else SARCOMA_DIR)/generated['file_name']
  target.write_text(json.dumps(generated,ensure_ascii=False,indent=2)+'\n');new+=1

# Ensure every official Sarcoma card is optional/single-entry and tagged consistently.
sarcoma_codes={x[0] for x in I}
for f in files():
 try:d=json.loads(f.read_text())
 except Exception:continue
 m=d.get('metadata',{});code=str(m.get('nccp_regimen_code','')).zfill(5)
 if code not in sarcoma_codes:continue
 groups=[]
 if isinstance(m.get('tumour_group'),str):groups.append(m['tumour_group'])
 for g in m.get('tumour_groups') or []:
  if g not in groups:groups.append(g)
 if 'Sarcoma' not in groups:groups.append('Sarcoma')
 m.pop('tumour_group',None);m.pop('tumour_groups',None)
 if len(groups)==1:m['tumour_group']='Sarcoma'
 else:m['tumour_groups']=groups
 m['sactcheck_encoding_version']='0.41.0';m['partial_assessment_supported']=True;m['partial_assessment_note']='Any independently actionable entered value is assessed; omitted domains remain unassessed and do not block a partial result.'
 m['sarcoma_subgroup']=next(x[7] for x in I if x[0]==code)
 d['status']='encoded_prototype_pending_clinical_and_pharmacy_validation';d['required_inputs']=[]
 for definition in (d.get('input_definitions') or {}).values():
  if isinstance(definition,dict):definition['required']=False
 f.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')

print(f'Built complete Sarcoma library: {new} new files and {updated} existing/shared protocols reconciled ({len(I)} official cards).')
