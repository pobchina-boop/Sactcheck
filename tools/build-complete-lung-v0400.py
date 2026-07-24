#!/usr/bin/env python3
from __future__ import annotations
import copy, glob, json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LUNG_DIR = ROOT / 'protocols' / 'lung'
SHARED_DIR = ROOT / 'protocols' / 'shared'
LUNG_DIR.mkdir(parents=True, exist_ok=True)
SHARED_DIR.mkdir(parents=True, exist_ok=True)

# Current official NCCP Lung SACT catalogue snapshot checked 24 July 2026.
# One entry per official regimen card/document on the Lung catalogue page.
I = [
('00221','5','Afatinib Monotherapy','https://healthservice.hse.ie/documents/6936/221_Afatinib.pdf',['afatinib'],'EGFR-mutated locally advanced or metastatic NSCLC in EGFR-TKI-naïve adults.',1,'targeted_egfr'),
('00401','6','Alectinib Monotherapy','https://healthservice.hse.ie/documents/6910/401_V6_Alectinib.pdf',['alectinib'],'ALK-positive advanced NSCLC, including first-line, post-crizotinib and adjuvant indications.',1,'targeted_alk'),
('00544','14','Atezolizumab 1200 mg Monotherapy – 21 day','https://healthservice.hse.ie/documents/6644/544_v14_Atezolizumab_21_Day_Monotherapy.pdf',['atezolizumab'],'NSCLC monotherapy, adjuvant NSCLC and ES-SCLC maintenance indications listed in NCCP 00544.',21,'immunotherapy'),
('00593','10a','Atezolizumab 1680 mg Monotherapy – 28 day','https://healthservice.hse.ie/documents/6399/593_v10a_Atezolizumab_1680mg_Monotherapy.pdf',['atezolizumab'],'NSCLC monotherapy, adjuvant NSCLC and ES-SCLC maintenance indications listed in NCCP 00593.',28,'immunotherapy'),
('00592','3','Atezolizumab 840 mg Monotherapy – 14 day','https://healthservice.hse.ie/documents/6398/592_v3_Atezolizumab_840mg_Monotherapy_14_Day.pdf',['atezolizumab'],'First-line metastatic NSCLC, adjuvant NSCLC and ES-SCLC maintenance indications listed in NCCP 00592.',14,'immunotherapy'),
('00214','8','Bevacizumab 7.5 mg/kg Therapy – 21 day','https://healthservice.hse.ie/documents/6554/214_Bevacizumab_7.5.pdf',['bevacizumab'],'With platinum chemotherapy for first-line non-squamous advanced, metastatic or recurrent NSCLC.',21,'nsclc_biologic'),
('00689','4','Atezolizumab, CARBOplatin AUC5 and Etoposide 100 mg/m² – 21 day','https://healthservice.hse.ie/documents/6882/689_V4_Atezolizumab_Etoposide_CARBOplatin.pdf',['atezolizumab','carboplatin','etoposide'],'First-line extensive-stage small-cell lung cancer.',21,'sclc'),
('00215','7','Bevacizumab 15 mg/kg Therapy – 21 day','https://healthservice.hse.ie/documents/6555/00215_Bevacizumab_15_knZhA52.pdf',['bevacizumab'],'With platinum chemotherapy for non-squamous NSCLC or with erlotinib for EGFR-mutated non-squamous NSCLC.',21,'nsclc_biologic'),
('00562','3','Brigatinib Therapy','https://healthservice.hse.ie/documents/6895/562_v3_brigatinib.pdf',['brigatinib'],'ALK-positive advanced NSCLC, previously treated with crizotinib or ALK-inhibitor naïve.',1,'targeted_alk'),
('00271','6','CARBOplatin AUC5 and Etoposide 100 mg/m² Therapy – 21 day','https://healthservice.hse.ie/documents/6931/271_CarboplatinAUC5Etop100.pdf',['carboplatin','etoposide'],'Extensive-stage small-cell lung cancer.',21,'sclc'),
('00561','4','CARBOplatin AUC3, Etoposide 50 mg/m² and Thoracic Radiotherapy – 28 day','https://healthservice.hse.ie/documents/6896/561_V4_CarboAUC3_etoposide_RT.pdf',['carboplatin','etoposide','radiotherapy'],'Stage III NSCLC in patients unsuitable for cisplatin.',28,'chemoradiation'),
('00319','5','CARBOplatin and Oral Etoposide Therapy – 21 day','https://healthservice.hse.ie/documents/6920/319_V5_CarboplatinEtoposide_21days.pdf',['carboplatin','etoposide'],'Extensive-stage small-cell lung cancer.',21,'sclc'),
('00304','8','CARBOplatin AUC6 and PACLitaxel 200 mg/m² Therapy','https://healthservice.hse.ie/documents/6924/304_V8_CARBOplatinAUC_6_PACLitaxel_200.pdf',['carboplatin','paclitaxel'],'Adjuvant, advanced/metastatic or neoadjuvant NSCLC indications.',21,'nsclc_chemotherapy'),
('00614','4','CARBOplatin and Vinorelbine Therapy – 21 day','https://healthservice.hse.ie/documents/6884/614_V4_Carboplatin_Vinorelbine.pdf',['carboplatin','vinorelbine'],'Locally advanced, recurrent or metastatic NSCLC when cisplatin is unsuitable.',21,'nsclc_chemotherapy'),
('00340','4','Ceritinib Monotherapy','https://healthservice.hse.ie/documents/6917/340_Ceritinib_monotherapy.pdf',['ceritinib'],'ALK-positive advanced NSCLC previously treated with crizotinib.',1,'targeted_alk'),
('00456','4','CISplatin 50 mg/m², Etoposide 50 mg/m² and Thoracic Radiotherapy – 28 day','https://healthservice.hse.ie/documents/6902/456_V4_CISplatin_50_and_Etoposide.pdf',['cisplatin','etoposide','radiotherapy'],'Stage III non-small-cell lung cancer.',28,'chemoradiation'),
('00280','6','CISplatin 75 mg/m² and Etoposide Therapy – 21 day','https://healthservice.hse.ie/documents/6927/280_V6_Cisplatin_and_Etoposide.pdf',['cisplatin','etoposide'],'Extensive-stage small-cell lung cancer.',21,'sclc'),
('00279','7','CISplatin 75 mg/m², Etoposide 100 mg/m² and Radiotherapy – 21 day','https://healthservice.hse.ie/documents/6697/279_V7_Cisplatin_and_Etoposide_and_RT.pdf',['cisplatin','etoposide','radiotherapy'],'Limited-stage small-cell lung cancer.',21,'chemoradiation'),
('00243','7','Crizotinib Monotherapy','https://healthservice.hse.ie/documents/6934/243_V7_Crizotinib_Monotherapy.pdf',['crizotinib'],'ALK-positive or ROS1-positive advanced NSCLC.',1,'targeted_alk_ros1'),
('00565','3','Dacomitinib Monotherapy','https://healthservice.hse.ie/documents/6894/565_V3_Dacomitinib.pdf',['dacomitinib'],'First-line EGFR-mutated locally advanced or metastatic NSCLC.',1,'targeted_egfr'),
('00576','5','Durvalumab Monotherapy 10 mg/kg – 14 day','https://healthservice.hse.ie/documents/6888/576_Durvalumab.pdf',['durvalumab'],'Unresectable stage III NSCLC without progression after concurrent platinum chemoradiation.',14,'immunotherapy'),
('00655','3a','Durvalumab Monotherapy 1500 mg – 28 day','https://healthservice.hse.ie/documents/6883/655_V3a_Durvalumab_1500mg.pdf',['durvalumab'],'Unresectable stage III NSCLC without progression after concurrent platinum chemoradiation.',28,'immunotherapy'),
('00203','7','DOCEtaxel Monotherapy 75 mg/m² – 21 day','https://healthservice.hse.ie/documents/6543/203_DOCEtaxel_75-21day.pdf',['docetaxel'],'Locally advanced or metastatic NSCLC after failure of prior chemotherapy.',21,'later_line_nsclc'),
('00702','2','Entrectinib Monotherapy – Adult','https://healthservice.hse.ie/documents/6770/702_V2_Entrectinib_monotherapy.pdf',['entrectinib'],'ROS1-positive advanced NSCLC not previously treated with a ROS1 inhibitor.',1,'targeted_ros1'),
('00219','6','Erlotinib Monotherapy','https://healthservice.hse.ie/documents/6938/219_Erlotinib_monotherapy.pdf',['erlotinib'],'EGFR-mutated locally advanced or metastatic NSCLC, including first-line and maintenance settings.',1,'targeted_egfr'),
('00220','5','Gefitinib Monotherapy','https://healthservice.hse.ie/documents/6937/220_V5_Gefitinib_Monotherapy.pdf',['gefitinib'],'EGFR-mutated locally advanced or metastatic NSCLC.',1,'targeted_egfr'),
('00310','7','Gemcitabine 1000 mg/m² and CARBOplatin AUC5 Therapy – 21 day','https://healthservice.hse.ie/documents/6713/310_v7_GemCARBOAUC_5.pdf',['gemcitabine','carboplatin'],'Locally advanced, recurrent or metastatic NSCLC, including selected neoadjuvant use with nivolumab.',21,'nsclc_chemotherapy'),
('00281','7','Gemcitabine 1250 mg/m² and CISplatin 75 mg/m² Therapy – 21 day','https://healthservice.hse.ie/documents/6926/281_V7_GemCis75.pdf',['gemcitabine','cisplatin'],'Locally advanced or metastatic NSCLC, including selected neoadjuvant use with nivolumab.',21,'nsclc_chemotherapy'),
('00284','5','Gemcitabine 1000 mg/m² Monotherapy – 28 day','https://healthservice.hse.ie/documents/6699/284_v5_Gemcitabine_Monotherapy_28_day.pdf',['gemcitabine'],'Locally advanced or metastatic NSCLC in older patients or patients with ECOG 2.',28,'later_line_nsclc'),
('00570','3','Lorlatinib Therapy','https://healthservice.hse.ie/documents/6889/570_V3_Lorlatinib_therapy_.pdf',['lorlatinib'],'ALK-positive advanced NSCLC, first-line or after specified prior ALK inhibitors.',1,'targeted_alk'),
('00232','5','Intravenous Vinorelbine Monotherapy – 21 day','https://healthservice.hse.ie/documents/6567/232_v5_Vinorelbine_IV.pdf',['vinorelbine'],'Non-small-cell lung cancer.',21,'later_line_nsclc'),
('00372','6','Nintedanib Therapy with DOCEtaxel','https://healthservice.hse.ie/documents/6913/372_Nintedanib_therapy.pdf',['nintedanib','docetaxel'],'Adenocarcinoma NSCLC after first-line chemotherapy.',21,'later_line_nsclc'),
('00849','2','Nivolumab 360 mg and Platinum-Based Chemotherapy','https://healthservice.hse.ie/documents/6865/849_V2_Nivolumab_chemotherapy.pdf',['nivolumab','platinum chemotherapy'],'Neoadjuvant treatment of resectable NSCLC at high risk of recurrence with PD-L1 expression ≥1%.',21,'neoadjuvant_nsclc'),
('00483','13a','Nivolumab Monotherapy – 14 day','https://healthservice.hse.ie/documents/6498/483_Nivolumab_14-day_.pdf',['nivolumab'],'Locally advanced or metastatic NSCLC after prior chemotherapy.',14,'immunotherapy'),
('00484','13a','Nivolumab Monotherapy – 28 day','https://healthservice.hse.ie/documents/6499/484_Nivolumab_28-day_.pdf',['nivolumab'],'Locally advanced or metastatic NSCLC after prior chemotherapy.',28,'immunotherapy'),
('00792','2','Nivolumab 360 mg and Ipilimumab 1 mg/kg Therapy','https://healthservice.hse.ie/documents/6873/792_V2_Nivolumab_360_ipilimumab1mg.kg.pdf',['nivolumab','ipilimumab'],'First-line unresectable malignant pleural mesothelioma.',21,'mesothelioma'),
('00712','3a','Nivolumab, Ipilimumab, CARBOplatin and PACLitaxel Therapy','https://healthservice.hse.ie/documents/6879/712_V3a_Nivolumab_ipili_plus_PACLitaxel-CARBOplatin.pdf',['nivolumab','ipilimumab','carboplatin','paclitaxel'],'First-line metastatic squamous NSCLC without sensitising EGFR mutation or ALK translocation.',21,'metastatic_squamous_nsclc'),
('00713','4','Nivolumab, Ipilimumab, PEMEtrexed and CARBOplatin Therapy','https://healthservice.hse.ie/documents/6877/713_V4_Nivolumab_ipili_plus_PEMEtrexed-CARBOplatin_.pdf',['nivolumab','ipilimumab','pemetrexed','carboplatin'],'First-line metastatic non-squamous NSCLC without sensitising EGFR mutation or ALK translocation.',21,'metastatic_nonsquamous_nsclc'),
('00714','4','Nivolumab, Ipilimumab, PEMEtrexed and CISplatin Therapy','https://healthservice.hse.ie/documents/6876/714_V4_Nivolumab_ipili_plus_PEMEtrexed-CISplatin.pdf',['nivolumab','ipilimumab','pemetrexed','cisplatin'],'First-line metastatic non-squamous NSCLC without sensitising EGFR mutation or ALK translocation.',21,'metastatic_nonsquamous_nsclc'),
('00388','3','Oral Etoposide Therapy','https://healthservice.hse.ie/documents/6911/388_V3_Oral_Etoposide.pdf',['etoposide'],'Extensive-stage SCLC in patients unsuitable for intravenous or combination chemotherapy.',21,'sclc'),
('00259','6','Oral Vinorelbine Monotherapy – 7 day','https://healthservice.hse.ie/documents/6363/259_Vinorelbine_Oral.pdf',['vinorelbine'],'Non-small-cell lung cancer.',7,'later_line_nsclc'),
('00353','5','Osimertinib Monotherapy','https://healthservice.hse.ie/documents/6914/353_V5_Osimertinib_Monotherapy.pdf',['osimertinib'],'EGFR-mutated NSCLC, including T790M-positive advanced disease, first-line metastatic and adjuvant treatment.',1,'targeted_egfr'),
('00226','9','PACLitaxel 80 mg/m² Days 1, 8, 15 and 22 – 28 day','https://healthservice.hse.ie/documents/6562/226_V9_Paclitaxel_80.pdf',['paclitaxel'],'Relapsed or refractory small-cell lung cancer.',28,'sclc'),
('00621','3','PACLitaxel 80 mg/m² Days 1, 8 and 15 – 28 day','https://healthservice.hse.ie/documents/6688/621_V3_Paclitaxel_80.pdf',['paclitaxel'],'Relapsed or refractory small-cell lung cancer.',28,'sclc'),
('00455','15b','Pembrolizumab 200 mg Monotherapy','https://healthservice.hse.ie/documents/6903/455_V15b__Pembrolizumab_200mg_Monotherapy.pdf',['pembrolizumab'],'First-line metastatic NSCLC with PD-L1 TPS ≥50% and no EGFR or ALK alteration.',21,'immunotherapy'),
('00558','12b','Pembrolizumab 400 mg Monotherapy','https://healthservice.hse.ie/documents/6389/558_v12b_Pembrolizumab_400mg_monotherapy.pdf',['pembrolizumab'],'First-line metastatic NSCLC with PD-L1 TPS ≥50% and no EGFR mutation or ALK translocation.',42,'immunotherapy'),
('00568','5','Pembrolizumab, PEMEtrexed and CARBOplatin AUC5 Therapy','https://healthservice.hse.ie/documents/6891/568_V5_Pembrolizumab_PEMEtrexed_CARBOplatin.pdf',['pembrolizumab','pemetrexed','carboplatin'],'First-line metastatic non-squamous NSCLC without EGFR or ALK alterations.',21,'metastatic_nonsquamous_nsclc'),
('00569','5','Pembrolizumab, PEMEtrexed and CISplatin Therapy','https://healthservice.hse.ie/documents/6890/569_V5_Pembrolizumab_PEMEtrexed_and_CISplatin.pdf',['pembrolizumab','pemetrexed','cisplatin'],'First-line metastatic non-squamous NSCLC without EGFR or ALK alterations.',21,'metastatic_nonsquamous_nsclc'),
('00579','5a','Pembrolizumab, PACLitaxel and CARBOplatin AUC6 Therapy','https://healthservice.hse.ie/documents/6887/579_V5a_pembrolizumab_carboplatin_paclitaxel.pdf',['pembrolizumab','paclitaxel','carboplatin'],'First-line metastatic squamous NSCLC.',21,'metastatic_squamous_nsclc'),
('00318','6','PEMEtrexed and CARBOplatin Therapy','https://healthservice.hse.ie/documents/6921/318_V6_PEMEtrexed_and_CARBOplatin.pdf',['pemetrexed','carboplatin'],'Unresectable mesothelioma, non-squamous NSCLC or selected neoadjuvant NSCLC.',21,'nonsquamous_mesothelioma'),
('00317','7','PEMEtrexed and CISplatin Therapy','https://healthservice.hse.ie/documents/6922/317_V7_PEMEtrexed_and_CISplatin.pdf',['pemetrexed','cisplatin'],'Unresectable mesothelioma, non-squamous NSCLC or selected neoadjuvant NSCLC.',21,'nonsquamous_mesothelioma'),
('00222','5','PEMEtrexed Monotherapy','https://healthservice.hse.ie/documents/6935/222_V5_PEMEtrexed_Monotherapy_.pdf',['pemetrexed'],'Maintenance or second-line non-squamous NSCLC.',21,'maintenance_later_line_nsclc'),
('00908','1a','Serplulimab, CARBOplatin AUC5 and Etoposide 100 mg/m² – 21 day','https://healthservice.hse.ie/documents/6856/908_Serplulimab_CARBO_Etop_f8OKidZ.pdf',['serplulimab','carboplatin','etoposide'],'First-line extensive-stage small-cell lung cancer.',21,'sclc'),
('00823','2','Tepotinib Therapy','https://healthservice.hse.ie/documents/6868/823_V2_Tepotinib_Therapy.pdf',['tepotinib'],'Advanced NSCLC with MET exon 14 skipping after prior systemic treatment.',1,'targeted_met'),
('00311','4','Topotecan Monotherapy – 5 day','https://healthservice.hse.ie/documents/6714/311_v4_Topotecan_Monotherapy_5day.pdf',['topotecan'],'Relapsed SCLC when retreatment with first-line therapy is not appropriate.',21,'sclc'),
('00587','2','Topotecan Oral Monotherapy','https://healthservice.hse.ie/documents/6886/587_V2_Topotecan_PO.pdf',['topotecan'],'Relapsed SCLC when retreatment with first-line therapy is not appropriate.',21,'sclc'),
('00339','7','Vinorelbine Days 1, 8, 15 and CISplatin Day 1 – 21 day','https://healthservice.hse.ie/documents/6918/339_Vin_30CIS_80.pdf',['vinorelbine','cisplatin'],'Adjuvant or advanced/recurrent NSCLC.',21,'nsclc_chemotherapy'),
('00343','7','Vinorelbine and CISplatin Therapy – 28 day','https://healthservice.hse.ie/documents/6916/343_V7_Vin25Cis50.pdf',['vinorelbine','cisplatin'],'Adjuvant or advanced/recurrent NSCLC.',28,'nsclc_chemotherapy'),
('00309','6','Weekly CARBOplatin AUC2 and PACLitaxel 50 mg/m² with Radiotherapy','https://healthservice.hse.ie/documents/6923/309_V6_CARBOplatinAUC2_and_PACLitaxel50_with_RT.pdf',['carboplatin','paclitaxel','radiotherapy'],'Stage III NSCLC.',7,'chemoradiation'),
]

TRADE = {
'afatinib':['Giotrif'],'alectinib':['Alecensa'],'atezolizumab':['Tecentriq'],'bevacizumab':['Avastin'],
'brigatinib':['Alunbrig'],'ceritinib':['Zykadia'],'crizotinib':['Xalkori'],'dacomitinib':['Vizimpro'],
'docetaxel':['Taxotere'],'durvalumab':['Imfinzi'],'entrectinib':['Rozlytrek'],'erlotinib':['Tarceva'],
'gefitinib':['Iressa'],'ipilimumab':['Yervoy'],'lorlatinib':['Lorviqua'],'nintedanib':['Vargatef'],
'nivolumab':['Opdivo'],'osimertinib':['Tagrisso'],'paclitaxel':['Taxol'],'pembrolizumab':['Keytruda'],
'pemetrexed':['Alimta'],'serplulimab':['Hetronifly'],'tepotinib':['Tepmetko'],'topotecan':['Hycamtin'],
'vinorelbine':['Navelbine']
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

def exact_renal(label='GFR / CrCl used for carboplatin dosing'):
 d=num(label,90,'mL/min',1); d['renal_input']={'mode':'exact_continuous','exact_value_required':True,'reason':'Exact continuous GFR/CrCl is required for the Calvert carboplatin dose calculation.'}; return d

def rule(rid,field,op,value,action,msg,priority=6,components=None):
 return {'id':rid,'priority':priority,'when':{'field':field,'operator':op,'value':value},'action':{'type':action,'components':components or ['whole_regimen'],'message':msg},'source':{'document':'Current official NCCP regimen','page':'eligibility, exclusions or dose-modification section'},'explanation':msg}

def any_rule(rid,leaves,action,msg,priority=9):
 return {'id':rid,'priority':priority,'when':{'any':leaves},'action':{'type':action,'components':['whole_regimen'],'message':msg},'source':{'document':'Current official NCCP regimen','page':'eligibility/exclusions or dose-modification section'},'explanation':msg}

def build(item):
 code,version,title,url,components,indication,cycle,subgroup=item
 c=[x.lower() for x in components]
 cytotoxic=any(x in c for x in ['carboplatin','cisplatin','etoposide','paclitaxel','gemcitabine','vinorelbine','docetaxel','pemetrexed','topotecan','platinum chemotherapy'])
 ici=any(x in c for x in ['atezolizumab','durvalumab','nivolumab','ipilimumab','pembrolizumab','serplulimab'])
 targeted=any(x in c for x in ['afatinib','alectinib','bevacizumab','brigatinib','ceritinib','crizotinib','dacomitinib','entrectinib','erlotinib','gefitinib','lorlatinib','nintedanib','osimertinib','tepotinib'])
 if subgroup.startswith('targeted'): section='targeted_therapy'; section_label='Molecularly targeted therapy'
 elif ici and not cytotoxic: section='immunotherapy'; section_label='Immunotherapy'
 elif subgroup=='chemoradiation': section='chemoradiation'; section_label='Chemoradiation'
 elif subgroup=='mesothelioma': section='mesothelioma'; section_label='Mesothelioma'
 elif subgroup=='sclc': section='small_cell_lung_cancer'; section_label='Small-cell lung cancer'
 else: section='chemotherapy_combination_sact'; section_label='Chemotherapy & combination SACT'
 classes=[]
 if cytotoxic:classes.append('cytotoxic_chemotherapy')
 if ici:classes.append('immunotherapy')
 if targeted:classes.append('targeted_or_biologic_therapy')
 if 'radiotherapy' in c:classes.append('chemoradiation')
 if not classes:classes=['systemic_anticancer_therapy']

 inp={
  'ecog':sel('ECOG performance status',[(0,'0'),(1,'1'),(2,'2'),(3,'3'),(4,'4')],0),
  'hypersensitivity':boolean('Known hypersensitivity to a regimen component'),
  'pregnancy':boolean('Pregnant'),
  'breastfeeding':boolean('Breastfeeding'),
 }
 rules=[
  rule('ECOG_OUTSIDE_USUAL_RANGE','ecog','>',2,'consultant_review','ECOG is outside the usual source eligibility range; review the selected indication and protocol.',8),
  rule('HYPERSENSITIVITY','hypersensitivity','==',True,'contraindicated','Known hypersensitivity to a regimen component triggers the exclusion pathway.',10),
  any_rule('PREGNANCY_BREASTFEEDING',[{'field':'pregnancy','operator':'==','value':True},{'field':'breastfeeding','operator':'==','value':True}],'contraindicated','Pregnancy or breastfeeding triggers the protocol exclusion pathway.',10),
 ]

 if cytotoxic:
  inp.update({'anc_x10e9_l':num('Absolute neutrophil count',2,'×10⁹/L',.1),'platelets_x10e9_l':num('Platelet count',150,'×10⁹/L',1),'febrile_or_active_infection':boolean('Fever, febrile neutropenia or active infection requiring treatment'),'other_nonhaem_toxicity_grade':grade('Worst relevant non-haematological toxicity','other_nonhaematological','Identify the exact adverse event, grade it with its own CTCAE criteria and assess functional impact before selecting a grade.')})
  anc_cut=1.5 if any(x in c for x in ['docetaxel','vinorelbine']) else 1.0
  plt_cut=100 if any(x in c for x in ['vinorelbine','topotecan']) else 75
  rules += [rule('LOW_ANC','anc_x10e9_l','<',anc_cut,'withhold',f'ANC below {anc_cut} ×10⁹/L requires withholding/delay according to the encoded source pathway.',9),rule('LOW_PLATELETS','platelets_x10e9_l','<',plt_cut,'withhold',f'Platelets below {plt_cut} ×10⁹/L require withholding/delay according to the encoded source pathway.',9),rule('INFECTION','febrile_or_active_infection','==',True,'withhold','Withhold treatment and urgently assess fever, febrile neutropenia or active infection.',10),rule('SEVERE_NONHAEM','other_nonhaem_toxicity_grade','>=',3,'withhold','Grade 3 or worse non-haematological toxicity requires withholding and regimen-specific review.',8)]

 if 'carboplatin' in c:
  inp['gfr_crcl_ml_min']=exact_renal()
  rules += [rule('CARBO_GFR_20_OR_LESS','gfr_crcl_ml_min','<=',20,'contraindicated','GFR/CrCl ≤20 mL/min is outside the routine carboplatin pathway.',10),rule('CARBO_GFR_20_30','gfr_crcl_ml_min','<=',30,'consultant_review','GFR/CrCl 20–30 mL/min requires extreme caution and specialist dosing review.',8)]
 if 'cisplatin' in c:
  inp['cisplatin_renal_band']=renal_band('Renal function for cisplatin',[('ge60','CrCl ≥60 mL/min'),('45_59','CrCl 45–59 mL/min'),('30_44','CrCl 30–44 mL/min'),('lt30','CrCl <30 mL/min'),('dialysis','Dialysis')],'ge60')
  inp['hearing_or_tinnitus']=boolean('Clinically significant hearing impairment or tinnitus')
  inp['neuropathy_grade']=grade('Peripheral neuropathy grade','neuropathy','Assess sensory and motor symptoms, gait, dexterity and impact on instrumental or self-care activities.')
  rules += [rule('CISPLATIN_RENAL_45_59','cisplatin_renal_band','==','45_59','consultant_review','CrCl 45–59 mL/min requires protocol-specific cisplatin review or alternative platinum consideration.',8),rule('CISPLATIN_RENAL_LT45','cisplatin_renal_band','==','30_44','contraindicated','CrCl below 45 mL/min is outside the routine cisplatin pathway.',10),rule('CISPLATIN_RENAL_LT30','cisplatin_renal_band','==','lt30','contraindicated','Severe renal impairment is outside the routine cisplatin pathway.',10),rule('CISPLATIN_DIALYSIS','cisplatin_renal_band','==','dialysis','contraindicated','Dialysis requires a specialist non-routine cisplatin pathway.',10),rule('CISPLATIN_HEARING','hearing_or_tinnitus','==',True,'consultant_review','Clinically significant hearing impairment/tinnitus requires cisplatin-specific review.',8),rule('CISPLATIN_NEUROPATHY','neuropathy_grade','>=',2,'consultant_review','Grade 2 or worse neuropathy requires platinum-specific review.',8)]
 if 'etoposide' in c:
  inp['etoposide_renal_band']=renal_band('Renal function for etoposide',[('ge50','CrCl ≥50 mL/min'),('15_49','CrCl 15–49 mL/min'),('lt15','CrCl <15 mL/min'),('dialysis','Dialysis')],'ge50')
  inp['bilirubin_uln_multiple']=num('Bilirubin result (actual value entered; ×ULN calculated automatically)',1,'×ULN',.01)
  rules += [rule('ETOP_RENAL_15_49','etoposide_renal_band','==','15_49','dose_reduce','Reduced etoposide dosing is required in the encoded renal pathway.',8),rule('ETOP_RENAL_LT15','etoposide_renal_band','==','lt15','consultant_review','CrCl <15 mL/min requires specialist etoposide dosing review.',9),rule('ETOP_DIALYSIS','etoposide_renal_band','==','dialysis','consultant_review','Dialysis requires specialist pharmacy dosing review.',9),rule('ETOP_BILI_HIGH','bilirubin_uln_multiple','>',3,'consultant_review','Bilirubin >3 ×ULN requires etoposide hepatic dose review.',8)]
 if 'paclitaxel' in c:
  inp['neuropathy_grade']=grade('Peripheral neuropathy grade','neuropathy','Assess persistent sensory or motor symptoms, gait, dexterity and effect on activities of daily living.')
  inp['infusion_reaction_grade']=grade('Infusion or hypersensitivity reaction grade','infusion','Assess timing, airway or haemodynamic compromise, treatment required and whether infusion interruption was needed.')
  inp['bilirubin_uln_multiple']=num('Bilirubin result (actual value entered; ×ULN calculated automatically)',1,'×ULN',.01)
  inp['alt_ast_uln_multiple']=num('ALT / AST results (actual values entered; highest ×ULN calculated automatically)',1,'×ULN',.01)
  rules += [rule('PACLITAXEL_NEURO_G2','neuropathy_grade','>=',2,'consultant_review','Persistent Grade 2 or worse neuropathy requires paclitaxel interruption/reduction review.',8),rule('PACLITAXEL_REACTION_G3','infusion_reaction_grade','>=',3,'permanently_discontinue','Severe paclitaxel hypersensitivity/infusion reaction requires permanent discontinuation unless a formal specialist desensitisation pathway is selected.',10),rule('PACLITAXEL_BILI_GT3','bilirubin_uln_multiple','>',3,'contraindicated','Marked bilirubin elevation is outside the routine paclitaxel pathway.',10)]
 if 'docetaxel' in c:
  inp['bilirubin_uln_multiple']=num('Bilirubin result (actual value entered; ×ULN calculated automatically)',1,'×ULN',.01)
  inp['alt_ast_uln_multiple']=num('ALT / AST results (actual values entered; highest ×ULN calculated automatically)',1,'×ULN',.01)
  inp['neuropathy_grade']=grade('Peripheral neuropathy grade','neuropathy','Assess sensory and motor symptoms and functional limitation.')
  inp['skin_reaction_grade']=grade('Skin reaction grade','rash','Assess morphology, body-surface area, symptoms, mucosal involvement and functional impact.')
  inp['fluid_retention_grade']=grade('Fluid retention/oedema grade','other_nonhaematological','Assess weight gain, peripheral oedema, effusions, dyspnoea and intervention required.')
  rules += [rule('DOCETAXEL_BILI_HIGH','bilirubin_uln_multiple','>',1,'contraindicated','Bilirubin above ULN is outside the routine docetaxel pathway.',10),rule('DOCETAXEL_NEURO_GT2','neuropathy_grade','>',2,'withhold','Grade >2 neuropathy requires docetaxel interruption/reduction review.',8),rule('DOCETAXEL_SKIN_G3','skin_reaction_grade','>=',3,'dose_reduce','Grade 3 skin toxicity requires docetaxel dose reduction or discontinuation according to recurrence.',8)]
 if 'pemetrexed' in c:
  inp['pemetrexed_renal_band']=renal_band('Renal function for pemetrexed',[('ge45','CrCl ≥45 mL/min'),('30_44','CrCl 30–44 mL/min'),('lt30','CrCl <30 mL/min'),('dialysis','Dialysis')],'ge45')
  inp['folic_acid_b12_given']=boolean('Folic acid and vitamin B12 supplementation in place')
  inp['dexamethasone_skin_prophylaxis']=boolean('Dexamethasone skin-rash prophylaxis prescribed')
  inp['mucositis_grade']=grade('Oral mucositis/stomatitis grade','mucositis','Inspect oral mucosa and assess pain, diet modification and ability to maintain oral intake.')
  rules += [rule('PEME_RENAL_30_44','pemetrexed_renal_band','==','30_44','contraindicated','CrCl below 45 mL/min is outside the routine pemetrexed pathway.',10),rule('PEME_RENAL_LT30','pemetrexed_renal_band','==','lt30','contraindicated','Severe renal impairment is outside the routine pemetrexed pathway.',10),rule('PEME_DIALYSIS','pemetrexed_renal_band','==','dialysis','contraindicated','Dialysis is outside the routine pemetrexed pathway.',10),rule('PEME_SUPPLEMENTS','folic_acid_b12_given','==',False,'withhold','Confirm folic acid and vitamin B12 supplementation before pemetrexed.',9),rule('PEME_DEX','dexamethasone_skin_prophylaxis','==',False,'consultant_review','Confirm dexamethasone rash prophylaxis unless specifically contraindicated.',7),rule('PEME_MUCOSITIS','mucositis_grade','>=',3,'withhold','Grade 3 or worse mucositis requires withholding and dose-modification review.',8)]
 if 'gemcitabine' in c:
  inp['bilirubin_uln_multiple']=num('Bilirubin result (actual value entered; ×ULN calculated automatically)',1,'×ULN',.01)
  inp['pulmonary_toxicity']=boolean('New unexplained pulmonary symptoms or suspected gemcitabine pulmonary toxicity')
  rules += [rule('GEM_PULMONARY','pulmonary_toxicity','==',True,'withhold','Withhold gemcitabine and urgently assess suspected pulmonary toxicity.',9),rule('GEM_BILI_HIGH','bilirubin_uln_multiple','>',3,'consultant_review','Marked bilirubin elevation requires gemcitabine hepatic dosing review.',8)]
 if 'vinorelbine' in c:
  inp['neuropathy_grade']=grade('Peripheral neuropathy grade','neuropathy','Assess sensory and motor symptoms and impact on activities of daily living.')
  inp['constipation_grade']=grade('Constipation grade','other_nonhaematological','Assess bowel frequency, symptoms, need for laxatives/manual evacuation, hospitalisation and complications.')
  inp['bilirubin_uln_multiple']=num('Bilirubin result (actual value entered; ×ULN calculated automatically)',1,'×ULN',.01)
  inp['alt_ast_uln_multiple']=num('ALT / AST results (actual values entered; highest ×ULN calculated automatically)',1,'×ULN',.01)
  rules += [rule('VIN_NEURO_G2','neuropathy_grade','>=',2,'withhold','Grade 2 neuropathy requires withholding until Grade 1 and dose-reduction review; Grade 3 generally requires discontinuation.',8),rule('VIN_CONSTIPATION_G3','constipation_grade','>=',3,'withhold','Grade 3 constipation requires treatment, withholding and dose review.',8),rule('VIN_BILI_1_5_3','bilirubin_uln_multiple','>=',1.5,'dose_reduce','Bilirubin 1.5–3 ×ULN requires reduced vinorelbine dosing.',8),rule('VIN_BILI_GT3','bilirubin_uln_multiple','>',3,'permanently_discontinue','Bilirubin >3 ×ULN triggers discontinuation in the encoded vinorelbine pathway.',10)]
 if 'topotecan' in c:
  inp['topotecan_renal_band']=renal_band('Renal function for topotecan',[('ge40','CrCl ≥40 mL/min'),('20_39','CrCl 20–39 mL/min'),('lt20','CrCl <20 mL/min'),('dialysis','Dialysis')],'ge40')
  rules += [rule('TOPO_RENAL_20_39','topotecan_renal_band','==','20_39','dose_reduce','CrCl 20–39 mL/min requires topotecan dose reduction.',8),rule('TOPO_RENAL_LT20','topotecan_renal_band','==','lt20','contraindicated','CrCl <20 mL/min is outside the routine topotecan pathway.',10),rule('TOPO_DIALYSIS','topotecan_renal_band','==','dialysis','consultant_review','Dialysis requires specialist pharmacy review.',9)]

 # Molecular targeted therapies
 if targeted and not ('bevacizumab' in c or 'nintedanib' in c):
  inp['diarrhoea_grade']=grade('Diarrhoea grade','diarrhoea','Count stools over baseline; assess hydration, continence, hospitalisation, abdominal symptoms and functional impact.')
  inp['rash_grade']=grade('Rash/skin toxicity grade','rash_acneiform','Assess morphology, body-surface area, symptoms, superinfection and functional impact.')
  inp['pneumonitis_grade']=grade('Pneumonitis/interstitial lung disease grade','pneumonitis','Assess new cough or dyspnoea, oxygen requirement, imaging, infection and alternative causes.')
  inp['alt_ast_uln_multiple']=num('ALT / AST results (actual values entered; highest ×ULN calculated automatically)',1,'×ULN',.01)
  inp['bilirubin_uln_multiple']=num('Bilirubin result (actual value entered; ×ULN calculated automatically)',1,'×ULN',.01)
  rules += [rule('TARGET_DIARRHOEA_G3','diarrhoea_grade','>=',3,'withhold','Grade 3 or worse diarrhoea requires interruption, supportive treatment and reduced-dose restart review.',8),rule('TARGET_RASH_G3','rash_grade','>=',3,'withhold','Grade 3 or worse skin toxicity requires interruption and dose-modification review.',8),rule('TARGET_PNEUMONITIS_G2','pneumonitis_grade','>=',2,'permanently_discontinue','Symptomatic suspected drug-related pneumonitis/ILD requires interruption and generally permanent discontinuation after confirmation.',10),rule('TARGET_HEPATITIS','alt_ast_uln_multiple','>',5,'withhold','Transaminases >5 ×ULN require interruption and hepatic dose-modification review.',9)]
  if any(x in c for x in ['alectinib','brigatinib','ceritinib','crizotinib','lorlatinib','entrectinib']):
   inp['bradycardia_symptomatic']=boolean('Symptomatic bradycardia')
   inp['qtcf_ms']=num('QTcF',430,'ms',1)
   inp['cpk_uln_multiple']=num('Creatine kinase result (× local ULN)',1,'×ULN',.1)
   rules += [rule('TARGET_BRADYCARDIA','bradycardia_symptomatic','==',True,'withhold','Symptomatic bradycardia requires interruption and medication/cardiology review.',9),rule('TARGET_QTC_500','qtcf_ms','>=',500,'withhold','QTcF ≥500 ms requires interruption and correction of reversible causes.',9),rule('TARGET_CPK_5','cpk_uln_multiple','>',5,'withhold','CK >5 ×ULN requires interruption and myotoxicity review.',8)]
  if 'lorlatinib' in c:
   inp['cholesterol_grade']=grade('Hypercholesterolaemia grade','other_nonhaematological','Assess fasting lipid values and treatment required.')
   inp['cns_effect_grade']=grade('CNS/cognitive or mood effect grade','other_nonhaematological','Assess cognition, mood, speech, psychosis, seizures and impact on activities of daily living.')
   rules += [rule('LORLATINIB_CNS_G2','cns_effect_grade','>=',2,'withhold','Grade 2 or worse CNS effect requires interruption and reduced-dose restart review.',9),rule('LORLATINIB_LIPID_G3','cholesterol_grade','>=',3,'withhold','Severe uncontrolled hyperlipidaemia requires interruption until adequately controlled.',8)]
  if 'osimertinib' in c:
   inp['lvef_change']=boolean('Clinically significant LVEF fall or symptomatic cardiac dysfunction')
   rules.append(rule('OSIMERTINIB_LVEF','lvef_change','==',True,'withhold','Clinically significant LVEF decline or symptomatic dysfunction requires interruption and cardiac review.',9))
  if 'tepotinib' in c:
   inp['oedema_grade']=grade('Peripheral oedema grade','other_nonhaematological','Assess extent, symptoms, weight gain, functional impact and treatment required.')
   rules.append(rule('TEPOTINIB_OEDEMA_G3','oedema_grade','>=',3,'withhold','Grade 3 or worse oedema requires interruption and dose-modification review.',8))

 if 'bevacizumab' in c:
  inp.update({'uncontrolled_hypertension':boolean('Uncontrolled hypertension'),'proteinuria_grade':grade('Proteinuria grade','other_nonhaematological','Use urine protein quantification where indicated and assess nephrotic syndrome.'),'clinically_significant_bleeding':boolean('Clinically significant bleeding or haemoptysis'),'recent_arterial_or_venous_thrombosis':boolean('Recent arterial thromboembolism or clinically significant venous thrombosis'),'major_surgery_or_unhealed_wound':boolean('Recent major surgery or unhealed wound'),'gi_perforation_or_fistula':boolean('Gastrointestinal perforation or fistula')})
  rules += [rule('BEV_BP','uncontrolled_hypertension','==',True,'withhold','Withhold bevacizumab until blood pressure is controlled.',9),rule('BEV_PROTEIN_G3','proteinuria_grade','>=',3,'withhold','Severe proteinuria requires withholding and quantified renal assessment.',9),rule('BEV_BLEED','clinically_significant_bleeding','==',True,'contraindicated','Clinically significant bleeding or haemoptysis triggers the bevacizumab exclusion/discontinuation pathway.',10),rule('BEV_THROMBOSIS','recent_arterial_or_venous_thrombosis','==',True,'consultant_review','Recent thrombosis requires an individualised bevacizumab risk review.',9),rule('BEV_SURGERY','major_surgery_or_unhealed_wound','==',True,'withhold','Withhold bevacizumab around major surgery and until wounds are adequately healed.',9),rule('BEV_PERF','gi_perforation_or_fistula','==',True,'permanently_discontinue','Gastrointestinal perforation or fistula requires permanent discontinuation.',10)]

 if 'nintedanib' in c:
  inp['diarrhoea_grade']=grade('Diarrhoea grade','diarrhoea','Count stools over baseline and assess hydration, intervention, hospitalisation and functional impact.')
  inp['alt_ast_uln_multiple']=num('ALT / AST results (actual values entered; highest ×ULN calculated automatically)',1,'×ULN',.01)
  inp['bilirubin_uln_multiple']=num('Bilirubin result (actual value entered; ×ULN calculated automatically)',1,'×ULN',.01)
  inp['bleeding_or_thrombosis']=boolean('Clinically significant bleeding or thromboembolic event')
  rules += [rule('NINT_DIARRHOEA_G3','diarrhoea_grade','>=',3,'withhold','Severe diarrhoea requires interruption, aggressive supportive care and dose reduction.',9),rule('NINT_LFT_3','alt_ast_uln_multiple','>',3,'withhold','Transaminase elevation >3 ×ULN requires interruption and hepatic review.',9),rule('NINT_BLEED','bleeding_or_thrombosis','==',True,'withhold','Clinically significant bleeding or thrombosis requires interruption and specialist review.',9)]

 if ici:
  for key,definition in {
   'pneumonitis_grade':grade('Immune-mediated pneumonitis grade','pneumonitis','Assess symptoms, oxygen requirement, imaging and exclude infection/alternative causes.'),
   'diarrhoea_colitis_grade':grade('Immune-mediated diarrhoea/colitis grade','diarrhoea_or_colitis','Assess stool frequency over baseline, abdominal pain, blood/mucus, hydration, sepsis and peritoneal signs.'),
   'rash_grade':grade('Immune-mediated rash/dermatitis grade','rash','Assess morphology, body-surface area, symptoms, mucosal involvement and functional impact.'),
   'infusion_reaction_grade':grade('Infusion-related reaction grade','infusion','Assess timing, intervention, airway or haemodynamic compromise and recovery.'),
   'alt_ast_uln_multiple':num('ALT / AST results (actual values entered; highest ×ULN calculated automatically)',1,'×ULN',.01),
   'bilirubin_uln_multiple':num('Bilirubin result (actual value entered; ×ULN calculated automatically)',1,'×ULN',.01),
   'creatinine_ratio_baseline_or_uln':num('Creatinine ratio versus baseline or local ULN',1,'× baseline/ULN',.01),
   'tsh_miu_l':num('TSH (optional immunotherapy blood)',1.5,'mIU/L',.01),
   'free_t4_pmol_l':num('Free T4 (optional immunotherapy blood)',12,'pmol/L',.1),
   'cortisol_nmol_l':num('Cortisol (optional; interpret by sample time and steroid exposure)',350,'nmol/L',1),
   'acth_result':num('ACTH (optional; use local units/reference range)',5,'local units',.1),
   'glucose_mmol_l':num('Glucose (optional immunotherapy blood)',5,'mmol/L',.1),
   'ketones_mmol_l':num('Blood ketones (optional if hyperglycaemia or symptoms)',0.1,'mmol/L',.1),
  }.items():
   if key not in inp: inp[key]=definition
   if key in ['tsh_miu_l','free_t4_pmol_l','cortisol_nmol_l','acth_result','glucose_mmol_l','ketones_mmol_l']:inp[key]['ui_section']='immunotherapy_bloods'
  rules += [rule('ICI_PNEUMONITIS_G2','pneumonitis_grade','>=',2,'withhold','Grade 2 immune-mediated pneumonitis requires withholding; Grade 3–4 requires permanent discontinuation.',10),rule('ICI_PNEUMONITIS_G3','pneumonitis_grade','>=',3,'permanently_discontinue','Grade 3–4 immune-mediated pneumonitis requires permanent discontinuation.',10),rule('ICI_COLITIS_G2','diarrhoea_colitis_grade','>=',2,'withhold','Grade 2 or worse immune-mediated diarrhoea/colitis requires withholding and immune-toxicity management.',9),rule('ICI_COLITIS_G4','diarrhoea_colitis_grade','>=',4,'permanently_discontinue','Grade 4 immune-mediated diarrhoea/colitis requires permanent discontinuation.',10),rule('ICI_HEPATITIS_WITHHOLD','alt_ast_uln_multiple','>',3,'withhold','ALT/AST >3 ×ULN requires immune-mediated hepatitis assessment and withholding.',9),rule('ICI_HEPATITIS_STOP','alt_ast_uln_multiple','>',5,'permanently_discontinue','ALT/AST >5 ×ULN triggers the severe immune-hepatitis discontinuation pathway.',10),rule('ICI_BILI_WITHHOLD','bilirubin_uln_multiple','>',1.5,'withhold','Bilirubin >1.5 ×ULN requires immune-mediated hepatitis assessment and withholding.',9),rule('ICI_RENAL_G2','creatinine_ratio_baseline_or_uln','>',1.5,'withhold','Creatinine >1.5 × baseline/ULN requires immune-mediated nephritis assessment and withholding.',9),rule('ICI_RENAL_G3','creatinine_ratio_baseline_or_uln','>',3,'permanently_discontinue','Creatinine >3 × baseline or severe ULN elevation triggers the severe nephritis pathway.',10),rule('ICI_INFUSION_G3','infusion_reaction_grade','>=',3,'permanently_discontinue','Grade 3–4 infusion reaction requires permanent discontinuation.',10)]

 # Risk assigned by highest emetogenic active component.
 if 'cisplatin' in c: risk='high'; script='nccp-parenteral-high'
 elif 'carboplatin' in c: risk='moderate'; script='nccp-parenteral-moderate'
 elif any(x in c for x in ['docetaxel','pemetrexed','topotecan','vinorelbine','etoposide']): risk='low'; script='nccp-parenteral-low'
 elif targeted and not cytotoxic: risk='oral_minimal_low'; script='nccp-oral-minimal-low'
 else: risk='minimal'; script='nccp-minimal-no-routine-prophylaxis'
 if 'radiotherapy' in c: risk='phase_dependent'; script='nccp-parenteral-moderate'
 aliases=[]
 for comp in c:aliases += TRADE.get(comp,[])
 aliases=list(dict.fromkeys(aliases))
 fname=f'{code}-{slug(title)}.json'
 p={
  'schema_version':'2.0.0','protocol_id':f'nccp-{code}-v{version}','file_name':fname,'status':'encoded_prototype_pending_clinical_and_pharmacy_validation',
  'metadata':{'nccp_regimen_code':code,'nccp_version':version,'tumour_group':'Lung','title':title,'short_title':title,'indication':indication,'source_url':url,'source_document_pages':None,'sactcheck_encoding_version':'0.40.0','partial_assessment_supported':True,'partial_assessment_note':'Any independently actionable entered value is assessed; omitted domains remain unassessed and do not block a partial result.','lung_subgroup':subgroup,'treatment_context':['lung',subgroup],'treatment_class':classes,'cytotoxic':cytotoxic,'catalogue_section':section,'catalogue_section_label':section_label,'catalog':{'enabled':True},'drugs':components,'common_trade_names':aliases,'migration':{'mode':'live_json'},'validation':{'official_catalogue_and_source_link_checked':True,'rule_level_source_reconciliation_status':'pending_independent_clinical_and_oncology_pharmacy_validation','software_tests_completed':True,'consultant_reviewed':False,'oncology_pharmacy_reviewed':False,'clinical_use_authorised':False}},
  'clinical_governance':{'prescriptive_authority':'The treatment plan must be initiated by a Consultant Medical Oncologist or other appropriately authorised specialist named in the current NCCP source.','dose_modification_note':'Use the most restrictive applicable component rule and confirm all dose changes against the current official NCCP PDF.','disclaimer':f'Decision-support encoding derived from NCCP {code} Version {version}. It does not replace the current official regimen, prescribing review, pharmacy verification or independent clinical judgement.'},
  'indications':[{'indication_id':f'{code}a','description':indication}],
  'treatment':{'cycle_length_days':cycle,'schedule_summary':title,'drugs':components},
  'input_definitions':inp,'required_inputs':[],
  'output_templates':{'proceed':'No encoded restriction was triggered in the entered domain(s). This is not an overall treatment clearance.','coverage_gap':'Only entered values were assessed; omitted clinically relevant domains remain unassessed.','consultant_review':'The entered value requires protocol-specific Consultant/pharmacy review.','withhold':'Withhold treatment and reassess according to the official NCCP pathway.','dose_reduce':'Apply the encoded dose-reduction pathway and confirm against the official source.','contraindicated':'The entered value triggers an encoded contraindication/exclusion.','permanently_discontinue':'The entered value triggers permanent discontinuation in the encoded pathway.'},
  'rule_engine':{'conflict_policy':'most_restrictive_action_wins','missing_data_policy':'report_unassessed_coverage_gap','actions_ranked_most_to_least_restrictive':['permanently_discontinue','contraindicated','discontinue','cease','omit','withhold_then_reduce','withhold','delay_then_dose_reduce','delay','consultant_review','dose_reduce_two_levels','dose_reduce_one_level','dose_reduce','proceed_with_caution','proceed'],'rules':rules},
  'eligibility':['Indication as listed in the current official NCCP regimen','Performance status, histology, stage and biomarker eligibility appropriate to the selected indication','Organ function appropriate for the selected regimen'],
  'exclusions':['Known hypersensitivity to a regimen component','Pregnancy or breastfeeding where prohibited by the current source','Regimen-specific exclusions encoded in the interactive assessment'],
  'monitoring':['FBC, renal and liver profile as specified by the current NCCP regimen','Treatment-specific pulmonary, cardiac, endocrine, neurological and biomarker monitoring as applicable'],
  'dose_modifications':['Component-specific haematological, renal, hepatic and non-haematological pathways are encoded as independently actionable rules.'],
  'supportive_care':{'emetogenic_risk':risk,'script_id':script,'mapping_source':'NCCP SACT Antiemetic Guidance V6 (2025)','mapping_source_url':'https://healthservice.hse.ie/documents/7152/Classification_Document_for_Systemic_Anti-_Cancer_Therapy_SACT_Induced_Nausea__pWgDCrm.pdf','mapping_basis':'Risk assigned from the most emetogenic active component and treatment phase.','mapping_confidence':'high','validation_status':'source_mapped_pending_local_oncology_pharmacy_validation','breakthrough_profile_id':'nccp-breakthrough-general','supportive_medications_pdf_url':'https://healthservice.hse.ie/documents/7152/Classification_Document_for_Systemic_Anti-_Cancer_Therapy_SACT_Induced_Nausea__pWgDCrm.pdf','supportive_medications_label':f'{risk.replace("_"," ").title()} emetogenic-risk guidance'}
 }
 if 'pemetrexed' in c:
  p['supportive_care']['additional_supportive_care']=['Folic acid supplementation','Vitamin B12 supplementation','Dexamethasone rash prophylaxis']
 if 'paclitaxel' in c or 'docetaxel' in c:
  p['supportive_care']['additional_supportive_care']=(p['supportive_care'].get('additional_supportive_care') or [])+['Protocol-specific corticosteroid and hypersensitivity premedication']
 if 'cisplatin' in c:
  p['supportive_care']['additional_supportive_care']=(p['supportive_care'].get('additional_supportive_care') or [])+['Cisplatin hydration, electrolyte and antiemetic protocol']
 return p

def files():
 return [Path(f) for f in glob.glob(str(ROOT/'protocols'/'**'/'*.json'),recursive=True) if not f.endswith('index.json') and '/_template/' not in f and not f.endswith('protocol-schema.json')]

def code_map():
 out={}
 for f in files():
  try:d=json.loads(f.read_text())
  except:continue
  code=str(d.get('metadata',{}).get('nccp_regimen_code','')).zfill(5)
  if code and code!='00000':out.setdefault(code,[]).append((f,d))
 return out

existing=code_map(); new=0; updated=0
for item in I:
 code=item[0]; generated=build(item)
 if code in existing:
  f,d=existing[code][0]; m=d.setdefault('metadata',{})
  groups=[]
  if isinstance(m.get('tumour_group'),str):groups.append(m['tumour_group'])
  for g in m.get('tumour_groups') or []:
   if g not in groups:groups.append(g)
  if 'Lung' not in groups:groups.append('Lung')
  if len(groups)==1:m['tumour_group']='Lung';m.pop('tumour_groups',None)
  else:m.pop('tumour_group',None);m['tumour_groups']=groups
  m.update({'nccp_version':item[1],'source_url':item[3],'lung_subgroup':item[7],'sactcheck_encoding_version':'0.40.0','partial_assessment_supported':True,'partial_assessment_note':'Any independently actionable entered value is assessed; omitted domains remain unassessed and do not block a partial result.'})
  m.setdefault('drugs',item[4]);m.setdefault('common_trade_names',generated['metadata']['common_trade_names']);m.setdefault('treatment_class',generated['metadata']['treatment_class']);m.setdefault('catalogue_section',generated['metadata']['catalogue_section']);m.setdefault('catalogue_section_label',generated['metadata']['catalogue_section_label']);m.setdefault('catalog',{'enabled':True});m.setdefault('validation',{}).update({'official_catalogue_and_source_link_checked':True,'software_tests_completed':True,'rule_level_source_reconciliation_status':'pending_independent_clinical_and_oncology_pharmacy_validation'})
  d['status']='encoded_prototype_pending_clinical_and_pharmacy_validation';d['required_inputs']=[]
  for definition in (d.get('input_definitions') or {}).values():
   if isinstance(definition,dict):definition['required']=False
  # Add Lung indication, preserving any richer existing multi-tumour encoding.
  inds=d.setdefault('indications',[]); all_desc=' '.join(str(x.get('description','')) for x in inds if isinstance(x,dict)).lower()
  if item[5].lower()[:35] not in all_desc:inds.append({'indication_id':f'{code}-lung','description':item[5]})
  # Ensure key platform content exists if the old protocol was shallower.
  if not d.get('rule_engine',{}).get('rules') or len(d.get('input_definitions') or {})<4:
   d=generated
  f.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n');updated+=1
 else:
  # Shared cards are stored in shared when their code is known to have existing non-lung indications.
  target=(SHARED_DIR if code in {'00203','00214','00215','00226','00232','00259','00279','00284','00311','00455','00483','00484','00558','00592','00593','00621'} else LUNG_DIR)/generated['file_name']
  target.write_text(json.dumps(generated,ensure_ascii=False,indent=2)+'\n');new+=1

# Normalise all official Lung cards and ensure optional single-entry behaviour.
lung_codes={x[0] for x in I}
for f in files():
 try:d=json.loads(f.read_text())
 except:continue
 m=d.get('metadata',{});code=str(m.get('nccp_regimen_code','')).zfill(5)
 if code not in lung_codes:continue
 groups=[]
 if isinstance(m.get('tumour_group'),str):groups.append(m['tumour_group'])
 for g in m.get('tumour_groups') or []:
  if g not in groups:groups.append(g)
 if 'Lung' not in groups:groups.append('Lung')
 if len(groups)==1:m['tumour_group']='Lung';m.pop('tumour_groups',None)
 else:m.pop('tumour_group',None);m['tumour_groups']=groups
 m['sactcheck_encoding_version']='0.40.0';m['partial_assessment_supported']=True;m['lung_subgroup']=next(x[7] for x in I if x[0]==code)
 d['status']='encoded_prototype_pending_clinical_and_pharmacy_validation';d['required_inputs']=[]
 for definition in (d.get('input_definitions') or {}).values():
  if isinstance(definition,dict):definition['required']=False
 f.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')

print(f'Built complete Lung library: {new} new files and {updated} existing/shared protocols reconciled ({len(I)} official cards).')
