#!/usr/bin/env python3
from __future__ import annotations
import json, re, glob
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'protocols'/'gynaecology'; OUT.mkdir(parents=True,exist_ok=True)
VERSION='0.43.0'; CHECKED='2026-07-25'
CTCAE='https://dctd.cancer.gov/research/ctep-trials/for-sites/adverse-events/ctcae-v5-5x7.pdf'
ANTI='https://healthservice.hse.ie/documents/7152/Classification_Document_for_Systemic_Anti-_Cancer_Therapy_SACT_Induced_Nausea__pWgDCrm.pdf'

# Current official NCCP Gynaecology catalogue snapshot checked 25 July 2026.
# code, version, title, source url, subgroup, cycle, drugs, indication, aliases
I=[
('00716','2','Bevacizumab 15 mg/kg, Carboplatin AUC 5 and Paclitaxel 175 mg/m² Therapy','https://healthservice.hse.ie/documents/6594/716_V2_Bev15mg_PACLi_and_CARBO.pdf','cervical',21,['bevacizumab','carboplatin','paclitaxel'],'Persistent, recurrent or metastatic cervical cancer not amenable to curative surgery or radiotherapy.',['Avastin','Taxol']),
('00799','2','Bevacizumab 15 mg/kg, Paclitaxel 175 mg/m² and Cisplatin 50 mg/m² Therapy','https://healthservice.hse.ie/documents/6422/799_V2_Bev_Pacli_CIS.pdf','cervical',21,['bevacizumab','paclitaxel','cisplatin'],'Locally advanced, recurrent or metastatic cervical cancer not amenable to curative surgery or radiotherapy.',['Avastin','Taxol','Platinol']),
('00419','4','Carboplatin AUC 2 Weekly with Radiotherapy','https://healthservice.hse.ie/documents/6459/419_v4_CarboAUC2and_RT.pdf','cervical_chemoradiation',7,['carboplatin','radiotherapy'],'Locally advanced cervical cancer when cisplatin is contraindicated or not tolerated.',['Carboplatin RT']),
('00303','6','Carboplatin AUC 5–7.5 and Paclitaxel 175 mg/m² Therapy','https://healthservice.hse.ie/documents/6709/303_V6_CARBOplatin_AUC5-7.5_PACLitaxel_175.pdf','ovarian_endometrial_cervical',21,['carboplatin','paclitaxel'],'Ovarian, fallopian tube, primary peritoneal, endometrial and selected cervical cancer indications.',['Taxol']),
('00812','3a','Cemiplimab Therapy','https://healthservice.hse.ie/documents/6426/812_V3a_Cemiplimab.pdf','cervical_immunotherapy',21,['cemiplimab'],'Recurrent or metastatic cervical cancer progressing on or after platinum-based chemotherapy.',['Libtayo']),
('00385','5','Cisplatin 40 mg/m² Weekly with Radiotherapy','https://healthservice.hse.ie/documents/6341/385_V5_CISplatin_40mgm2_weekly_with_RT.pdf','cervical_chemoradiation',7,['cisplatin','radiotherapy'],'Definitive or postoperative chemoradiation for locally advanced cervical cancer.',['Platinol']),
('00279','7','Cisplatin 75 mg/m², Etoposide 100 mg/m² and Radiotherapy – 21 day','https://healthservice.hse.ie/documents/6697/279_V7_Cisplatin_and_Etoposide_and_RT.pdf','cervical_neuroendocrine',21,['cisplatin','etoposide','radiotherapy'],'Small-cell cancer of the cervix and other sites.',['EP','Platinol','Vepesid']),
('00455','15b','Pembrolizumab 200 mg Monotherapy','https://healthservice.hse.ie/documents/6487/455_v15b_Pembrolizumab_200mg_Monotherapy.pdf','cervical_immunotherapy',21,['pembrolizumab'],'Recurrent or metastatic cervical cancer progressing on or after chemotherapy with PD-L1 CPS ≥1.',['Keytruda']),
('00558','12b','Pembrolizumab 400 mg Monotherapy','https://healthservice.hse.ie/documents/6389/558_v12b_Pembrolizumab_400mg_monotherapy.pdf','cervical_immunotherapy',42,['pembrolizumab'],'Recurrent or metastatic cervical cancer progressing on or after chemotherapy with PD-L1 CPS ≥1.',['Keytruda']),
('00811','2','Pembrolizumab, Paclitaxel 175 mg/m², Carboplatin AUC 5 and Bevacizumab Therapy','https://healthservice.hse.ie/documents/6425/811_V2_Pembrolizumab_Pac_Carbo_Bev.pdf','cervical_immunochemotherapy',21,['pembrolizumab','paclitaxel','carboplatin','bevacizumab'],'Persistent, recurrent or metastatic cervical cancer with PD-L1 CPS ≥1.',['Keytruda','Taxol','Avastin']),
('00817','2','Pembrolizumab, Paclitaxel 175 mg/m² and Carboplatin AUC 5 Therapy','https://healthservice.hse.ie/documents/6429/817_V2_Pembro_Pac_175_Carbo_AUC_5.pdf','cervical_immunochemotherapy',21,['pembrolizumab','paclitaxel','carboplatin'],'Persistent, recurrent or metastatic cervical cancer with PD-L1 CPS ≥1.',['Keytruda','Taxol']),
('00676','3','Cisplatin 50 mg/m² Chemoradiation followed by Carboplatin AUC 5 and Paclitaxel 175 mg/m²','https://healthservice.hse.ie/documents/6673/676_v3_Cisplatin_50mgm2_with_RT_Pacli_Carbo.pdf','endometrial_adjuvant',21,['cisplatin','radiotherapy','carboplatin','paclitaxel'],'Adjuvant treatment of high-risk stage I–III endometrial carcinoma after surgery.',['Taxol','Platinol']),
('00819','2','Dostarlimab Therapy','https://healthservice.hse.ie/documents/6430/819_V2_Dostarlimab_Therapy.pdf','endometrial_immunotherapy',21,['dostarlimab'],'dMMR/MSI-H recurrent or advanced endometrial cancer progressing on or after platinum-containing therapy.',['Jemperli']),
('00929','1','Dostarlimab, Paclitaxel and Carboplatin Therapy','https://healthservice.hse.ie/documents/8284/929_Dostarlimab_-_PACLi_CARBO_Regimen.pdf','endometrial_immunochemotherapy',21,['dostarlimab','paclitaxel','carboplatin'],'dMMR/MSI-H primary advanced or recurrent endometrial cancer requiring systemic therapy.',['Jemperli','Taxol']),
('00205','8','Pegylated Liposomal Doxorubicin 50 mg/m² – 28 day','https://healthservice.hse.ie/documents/6546/205_V8_Peg_Lipo_DOXO_28_day.pdf','ovarian_endometrial',28,['pegylated liposomal doxorubicin'],'Recurrent or advanced endometrial cancer and advanced ovarian cancer after prior platinum therapy.',['Caelyx']),
('00247','4','Dactinomycin Therapy','https://healthservice.hse.ie/documents/6350/247_V4_DACTINomycin.pdf','gtn',14,['dactinomycin'],'Alternative single-agent treatment of low-risk gestational trophoblastic neoplasia.',['Actinomycin D','Cosmegen']),
('00248','4','EMA/CO Therapy','https://healthservice.hse.ie/documents/6351/248_V4_EMA_CO.pdf','gtn',14,['etoposide','methotrexate','dactinomycin','cyclophosphamide','vincristine'],'High-risk GTN or low-risk GTN resistant/relapsed after single-agent chemotherapy.',['EMA-CO','Actinomycin D','Oncovin']),
('00264','3b','EMA/EP Therapy','https://healthservice.hse.ie/documents/6689/264_V3b_EMA_EP.pdf','gtn',14,['etoposide','methotrexate','dactinomycin','cisplatin'],'High-risk GTN resistant or relapsed after EMA/CO, including hepatic metastases.',['EMA-EP','Actinomycin D','Platinol']),
('00249','3','Intrathecal Methotrexate for CNS Prophylaxis in GTN','https://healthservice.hse.ie/documents/6352/249_V3_Intrathecal_Methotrexate.pdf','gtn_cns',7,['methotrexate'],'CNS prophylaxis in high-risk GTN or low-risk GTN with lung metastases.',['Intrathecal MTX']),
('00246','5','Methotrexate 8-day Charing Cross Regimen','https://healthservice.hse.ie/documents/6349/246_Methotrexate_Charing_Cross.pdf','gtn',14,['methotrexate','folinic acid'],'Low-risk GTN with treatment continued for three maintenance cycles after hCG normalisation.',['Charing Cross regimen','MTX']),
('00266','4','Paclitaxel/Etoposide alternating with Paclitaxel/Cisplatin (TE/TP) Therapy','https://healthservice.hse.ie/documents/6691/266_V4_TP_TE.pdf','gtn',14,['paclitaxel','etoposide','cisplatin'],'High-risk GTN resistant or relapsed after EMA/CO.',['TE/TP','Taxol','Platinol']),
('00267','4','Two-day Etoposide and Cisplatin (EP) Therapy','https://healthservice.hse.ie/documents/6692/267_V4_EP.pdf','gtn_emergency',7,['etoposide','cisplatin'],'Emergency treatment of acutely unwell GTN with liver or CNS disease.',['EP','Platinol','Vepesid']),
('00300','7b','Bleomycin, Etoposide and Cisplatin (BEP) Therapy','https://healthservice.hse.ie/documents/6706/300_V7b_BEP.pdf','ovarian_germ_cell',21,['bleomycin','etoposide','cisplatin'],'Advanced or metastatic ovarian dysgerminoma and other germ-cell tumours.',['BEP','Blenoxane','Vepesid','Platinol']),
('00212','6a','Bevacizumab 10 mg/kg Therapy – 14 day','https://healthservice.hse.ie/documents/6942/212_V6a_Bevacizumab_10mgkg.pdf','ovarian_bevacizumab',14,['bevacizumab'],'Bevacizumab component with paclitaxel, weekly topotecan or PLD in platinum-resistant recurrent ovarian, fallopian tube or primary peritoneal cancer.',['Avastin']),
('00766','2','Bevacizumab 15 mg/kg, Carboplatin AUC 6 and Paclitaxel 175 mg/m² Therapy','https://healthservice.hse.ie/documents/6667/766_V2_Bevacizumab_15_Paclitaxel_CarboplatinAUC6.pdf','ovarian_frontline',21,['bevacizumab','carboplatin','paclitaxel'],'Front-line advanced ovarian, fallopian tube or primary peritoneal cancer.',['Avastin','Taxol']),
('00215','7','Bevacizumab 15 mg/kg Therapy – 21 day','https://healthservice.hse.ie/documents/6555/00215_Bevacizumab_15_knZhA52.pdf','ovarian_bevacizumab',21,['bevacizumab'],'Bevacizumab component/continuation in front-line or platinum-resistant ovarian, fallopian tube or primary peritoneal cancer.',['Avastin']),
('00772','3','Bevacizumab 10 mg/kg and Pegylated Liposomal Doxorubicin 40 mg/m² Therapy','https://healthservice.hse.ie/documents/6664/772_V3_Bevacizumab10_PegylatedDOXOrubicin40.docx.pdf','ovarian_platinum_resistant',28,['bevacizumab','pegylated liposomal doxorubicin'],'Platinum-resistant recurrent ovarian, fallopian tube or primary peritoneal cancer.',['Avastin','Caelyx']),
('00620','2','Bevacizumab 7.5 mg/kg, Carboplatin AUC 5 and Paclitaxel 175 mg/m² Therapy','https://healthservice.hse.ie/documents/6852/620_V2_BevPacliCarbo.pdf','ovarian_frontline',21,['bevacizumab','carboplatin','paclitaxel'],'Post-surgical first-line treatment of FIGO stage III residual disease ≥1 cm or stage IV ovarian, fallopian tube or primary peritoneal cancer.',['Avastin','Taxol']),
('00769','2','Bevacizumab 10 mg/kg and Paclitaxel 80 mg/m² Days 1, 8, 15 and 22','https://healthservice.hse.ie/documents/6666/769_V2_Bevacizumab10_PACLitaxelDay181522.pdf','ovarian_platinum_resistant',28,['bevacizumab','paclitaxel'],'Platinum-resistant recurrent ovarian, fallopian tube or primary peritoneal cancer.',['Avastin','Taxol']),
('00771','2','Bevacizumab 10 mg/kg and Topotecan 4 mg/m² Therapy','https://healthservice.hse.ie/documents/6665/771_V2_Bevacizumab10_Topotecan.pdf','ovarian_platinum_resistant',21,['bevacizumab','topotecan'],'Platinum-resistant recurrent ovarian, fallopian tube or primary peritoneal cancer.',['Avastin','Hycamtin']),
('00261','7','Carboplatin AUC 4–6 Monotherapy – 21 day','https://healthservice.hse.ie/documents/6366/261_CARBOplatinAUC4-6_21days.pdf','ovarian',21,['carboplatin'],'Ovarian, primary peritoneal or fallopian tube cancer where combination therapy is unsuitable.',['Paraplatin']),
('00251','6','Carboplatin AUC 4–6 Monotherapy – 28 day','https://healthservice.hse.ie/documents/6355/251_CARBOplatin_AUC4-6_28days.pdf','ovarian',28,['carboplatin'],'Ovarian, primary peritoneal or fallopian tube cancer where combination therapy is unsuitable.',['Paraplatin']),
('00624','3','Carboplatin AUC 5 and Pegylated Liposomal Doxorubicin 30 mg/m² – 28 day','https://healthservice.hse.ie/documents/6685/624_V3_Carbo_AUC5_pegylated_dox_30.pdf','ovarian_platinum_sensitive',28,['carboplatin','pegylated liposomal doxorubicin'],'Platinum-sensitive relapsed ovarian, fallopian tube or primary peritoneal cancer.',['Caelyx']),
('00308','7','Carboplatin AUC 6 and Weekly Paclitaxel 80 mg/m² Therapy','https://healthservice.hse.ie/documents/6712/308_V7_CARBOplatin_AUC6_PACLitaxel80.pdf','ovarian',21,['carboplatin','paclitaxel'],'Adjuvant or advanced ovarian, fallopian tube or primary peritoneal cancer.',['Taxol']),
('00203','7','Docetaxel Monotherapy 75 mg/m² – 21 day','https://healthservice.hse.ie/documents/6543/203_DOCEtaxel_75-21day.pdf','ovarian_later_line',21,['docetaxel'],'Relapsed or progressing ovarian, fallopian tube or primary peritoneal carcinoma.',['Taxotere']),
('00301','5','Etoposide and Cisplatin 20 mg/m² (EP) 5-day Therapy','https://healthservice.hse.ie/documents/6707/301_V5_EP.pdf','ovarian_germ_cell',21,['etoposide','cisplatin'],'Good-prognosis metastatic germ-cell tumours.',['EP','Vepesid','Platinol']),
('00306','7','Gemcitabine 1000 mg/m² and Carboplatin AUC 4 Therapy – 21 day','https://healthservice.hse.ie/documents/6710/306_Gem_CARBOAUC_4_.pdf','ovarian_platinum_sensitive',21,['gemcitabine','carboplatin'],'Platinum-sensitive relapsed ovarian, fallopian tube or primary peritoneal cancer.',['Gemzar']),
('00499','8','Gemcitabine 1000 mg/m², Carboplatin AUC 4 and Bevacizumab 15 mg/kg Therapy – 21 day','https://healthservice.hse.ie/documents/6507/499_V8_GemCARBOAUC_4BEV.pdf','ovarian_platinum_sensitive',21,['gemcitabine','carboplatin','bevacizumab'],'First recurrence of platinum-sensitive ovarian, fallopian tube or primary peritoneal cancer without prior VEGF-directed therapy.',['Gemzar','Avastin']),
('00232','5','Intravenous Vinorelbine Monotherapy – 21 day','https://healthservice.hse.ie/documents/6567/232_v5_Vinorelbine_IV.pdf','ovarian_later_line',21,['vinorelbine'],'Platinum-refractory advanced ovarian carcinoma.',['Navelbine']),
('00862','2','Niraparib (Tablets) Monotherapy','https://healthservice.hse.ie/documents/6437/862_V2_Niraparib_Tablets_Monotherapy.pdf','ovarian_parp',28,['niraparib'],'First-line or platinum-sensitive relapsed maintenance treatment after response to platinum-based chemotherapy.',['Zejula']),
('00746','2','Olaparib (Tablet) and Bevacizumab Therapy','https://healthservice.hse.ie/documents/6626/746_V2_Olaparib_bevacizumab_therapy.pdf','ovarian_parp',21,['olaparib','bevacizumab'],'First-line maintenance of HRD-positive advanced ovarian, fallopian tube or primary peritoneal cancer after response to platinum therapy.',['Lynparza','Avastin']),
('00588','5b','Olaparib (Tablet) Monotherapy','https://healthservice.hse.ie/documents/6397/588_Olaparib_tablet_monotherapy_FZxXOtF.pdf','ovarian_parp',28,['olaparib'],'BRCA-mutated first-line or platinum-sensitive relapsed maintenance treatment.',['Lynparza']),
('00226','9','Paclitaxel Monotherapy 80 mg/m² Days 1, 8, 15 and 22 – 28 day','https://healthservice.hse.ie/documents/6562/226_V9_Paclitaxel_80.pdf','ovarian_later_line',28,['paclitaxel'],'Second-line treatment of metastatic ovarian cancer after platinum-containing therapy.',['Taxol']),
('00621','3','Paclitaxel 80 mg/m² Days 1, 8 and 15 Monotherapy – 28 day','https://healthservice.hse.ie/documents/6688/621_V3_Paclitaxel_80.pdf','ovarian_later_line',28,['paclitaxel'],'Second-line treatment of metastatic ovarian cancer after platinum-containing therapy.',['Taxol']),
('00904','1','Rucaparib (Tablets) Monotherapy','https://healthservice.hse.ie/documents/6655/904_V1_Rucaparib_monotherapy.pdf','ovarian_parp',28,['rucaparib'],'First-line maintenance of advanced high-grade ovarian, fallopian tube or primary peritoneal cancer after response to platinum therapy.',['Rubraca']),
('00311','4','Topotecan Monotherapy – 5 day','https://healthservice.hse.ie/documents/6714/311_v4_Topotecan_Monotherapy_5day.pdf','ovarian_later_line',21,['topotecan'],'Metastatic ovarian, fallopian tube or primary peritoneal cancer after failure of prior therapy.',['Hycamtin']),
('00312','5','Topotecan Monotherapy – Weekly','https://healthservice.hse.ie/documents/6715/312__V5_Topotecan_Monotherapy_weekly.pdf','ovarian_later_line',28,['topotecan'],'Metastatic ovarian, fallopian tube or primary peritoneal cancer after failure of prior therapy.',['Hycamtin']),
('00375','6','Trabectedin and Pegylated Liposomal Doxorubicin Therapy','https://healthservice.hse.ie/documents/6818/375_Trabectedin_and_PLD_therapy.pdf','ovarian_platinum_sensitive',21,['trabectedin','pegylated liposomal doxorubicin'],'Relapsed platinum-sensitive ovarian cancer.',['Yondelis','Caelyx']),
]

GRADE={
'generic':['No adverse event.','Mild or asymptomatic; observation only.','Moderate; intervention may be indicated and instrumental activities may be limited.','Severe or medically significant; hospital care may be indicated and self-care may be limited.','Life-threatening consequences; urgent intervention required.'],
'neuropathy':['No neuropathy.','Mild symptoms without functional limitation.','Moderate symptoms limiting instrumental activities of daily living.','Severe symptoms limiting self-care activities of daily living.','Life-threatening neurological consequences.'],
'diarrhoea':['No increase over baseline.','Increase of <4 stools/day over baseline.','Increase of 4–6 stools/day; limits instrumental activities.','Increase of ≥7 stools/day, incontinence or hospitalisation; limits self-care.','Life-threatening consequences.'],
'infusion':['No infusion reaction.','Mild transient reaction; interruption not indicated.','Therapy/interruption indicated with prompt response.','Prolonged or recurrent reaction; hospitalisation indicated.','Life-threatening consequences.'],
'rash':['No rash.','Limited/mild rash with minimal symptoms.','Moderate rash or symptoms limiting instrumental activities.','Severe/extensive rash or limiting self-care.','Life-threatening cutaneous reaction.'],
'ppe':['No palmar-plantar erythrodysesthesia.','Minimal skin changes or dermatitis without pain.','Skin changes with pain; limits instrumental activities.','Severe skin changes with pain; limits self-care activities.','Life-threatening consequences.'],
'stomatitis':['No oral mucositis.','Asymptomatic or mild symptoms; intervention not indicated.','Moderate pain or ulceration not interfering with oral intake; modified diet indicated.','Severe pain interfering with oral intake.','Life-threatening consequences.'],
}

def grade(label,cat='generic',guide='Assess symptoms, objective findings, intervention required and functional impact.'):
 vals=GRADE.get(cat,GRADE['generic'])
 return {'label':label,'type':'select','required':False,'options':[{'value':i,'label':f'Grade {i}','ctcae_grade':i,'description':vals[i]} for i in range(5)],'demo_value':0,'ctcae_version':'5.0','ctcae_category':cat,'ctcae_source_url':CTCAE,'assessment_guidance':guide}
def num(label,demo,unit='',step=.1,minv=0,maxv=None):
 d={'label':label,'type':'number','required':False,'min':minv,'step':step,'demo_value':demo}
 if unit:d['unit']=unit
 if maxv is not None:d['max']=maxv
 return d
def boolean(label,demo=False,help_text=None):
 d={'label':label,'type':'boolean','required':False,'demo_value':demo}
 if help_text:d['help_text']=help_text
 return d
def select(label,opts,demo,help_text=None):
 d={'label':label,'type':'select','required':False,'options':[{'value':v,'label':l} for v,l in opts],'demo_value':demo}
 if help_text:d['help_text']=help_text
 return d
def renal(label,opts,demo):
 d=select(label,opts,demo); d['renal_input']={'mode':'protocol_specific_band','exact_value_required':False}; return d
def rule(rid,field,op,value,atype,msg,priority=7,components=None,page='Dose modifications'):
 return {'id':rid,'priority':priority,'when':{'field':field,'operator':op,'value':value},'action':{'type':atype,'components':components or ['whole_regimen'],'message':msg},'source':{'document':'Current official NCCP regimen','page':page},'explanation':msg}
def slug(s):return re.sub(r'[^a-z0-9]+','-',s.lower()).strip('-')[:100]

def base_inputs():
 return {
 'assessment_phase':select('Assessment phase',[('pre_treatment','Pre-treatment'),('on_treatment','On-treatment'),('toxicity_review','Toxicity review')],'pre_treatment'),
 'ecog':select('ECOG performance status',[('0','0'),('1','1'),('2','2'),('3','3'),('4','4')],'1'),
 'anc':num('ANC',2,'×10⁹/L',.01),'platelets':num('Platelets',180,'×10⁹/L',1),'haemoglobin':num('Haemoglobin',12,'g/dL',.1),
 'alt_ast_uln_multiple':num('ALT / AST actual result (highest ×ULN calculated automatically)',1,'×ULN',.01),
 'bilirubin_uln_multiple':num('Bilirubin actual result (×ULN calculated automatically)',1,'×ULN',.01),
 'non_haematological_toxicity_grade':grade('Other clinically relevant non-haematological toxicity grade','generic','Identify the named toxicity and grade it using the applicable CTCAE term rather than a generic impression.'),
 'febrile_neutropenia':boolean('Febrile neutropenia or neutropenic sepsis'),
 'hypersensitivity_grade':grade('Infusion or hypersensitivity reaction grade','infusion','Assess timing, treatment required, recurrence and airway or haemodynamic compromise.'),
 }
def base_rules(cytotoxic=True):
 r=[rule('ECOG_3','ecog','>=','3','consultant_review','ECOG 3–4 requires Consultant review of indication, benefit and treatment tolerance.',8),rule('NONHAEM_G3','non_haematological_toxicity_grade','>=',3,'withhold','Grade 3 or worse non-haematological toxicity requires treatment interruption and protocol-specific review.',9),rule('HSR_G3','hypersensitivity_grade','>=',3,'permanently_discontinue','Grade 3–4 hypersensitivity/infusion reaction requires the severe reaction pathway and usually permanent discontinuation.',10)]
 if cytotoxic:r += [rule('ANC_LT1','anc','<',1,'withhold','ANC below 1.0 ×10⁹/L: withhold and follow the regimen-specific haematology pathway.',9),rule('PLT_LT75','platelets','<',75,'withhold','Platelets below 75 ×10⁹/L: withhold and follow the regimen-specific haematology pathway.',9),rule('FN','febrile_neutropenia','==',True,'withhold_then_reduce','Febrile neutropenia requires withholding, acute management and subsequent dose/G-CSF review.',10)]
 return r

def build_new(code,version,title,url,subgroup,cycle,drugs,indication,aliases):
 low=[x.lower() for x in drugs]; ici=any(x in low for x in ['pembrolizumab','cemiplimab','dostarlimab']); cyt=any(x in low for x in ['carboplatin','cisplatin','paclitaxel','etoposide','gemcitabine','doxorubicin','pegylated liposomal doxorubicin','topotecan','docetaxel','vinorelbine','trabectedin','dactinomycin','cyclophosphamide','vincristine','bleomycin','methotrexate'])
 inp=base_inputs(); rules=base_rules(cyt)
 # Exact GFR input retained for Calvert carboplatin dosing.
 if 'carboplatin' in low:
  inp['gfr_or_crcl_ml_min']=num('Measured GFR or protocol-approved CrCl for carboplatin calculation',80,'mL/min',1)
  inp['gfr_or_crcl_ml_min']['renal_input']={'mode':'exact_continuous','exact_value_required':True,'reason':'Exact GFR/CrCl is required for Calvert carboplatin dosing.'}
  inp['carboplatin_hypersensitivity_history']=boolean('Previous carboplatin hypersensitivity')
  rules += [rule('CARBO_GFR_LOW','gfr_or_crcl_ml_min','<',30,'consultant_review','GFR/CrCl <30 mL/min requires protocol-specific carboplatin dosing review; use the official regimen and measured GFR where appropriate.',9,['carboplatin']),rule('CARBO_HSR','carboplatin_hypersensitivity_history','==',True,'consultant_review','Prior carboplatin hypersensitivity requires Consultant, pharmacy and allergy/desensitisation review.',10,['carboplatin'])]
 if 'cisplatin' in low:
  inp['cisplatin_renal_band']=renal('Renal function for cisplatin',[('ge60','CrCl ≥60 mL/min'),('50_59','CrCl 50–59 mL/min'),('40_49','CrCl 40–49 mL/min'),('lt40','CrCl <40 mL/min'),('dialysis','Haemodialysis')],'ge60')
  inp['magnesium_low_or_unreplaced']=boolean('Hypomagnesaemia not corrected / hydration plan incomplete')
  inp['hearing_or_neuropathy_grade']=grade('Cisplatin-related hearing or neuropathy grade','neuropathy','Assess hearing/tinnitus, sensory and motor symptoms and functional impact.')
  rules += [rule('CIS_50_59','cisplatin_renal_band','==','50_59','consultant_review','CrCl 50–59 mL/min requires the regimen-specific cisplatin dose/substitution pathway.',9,['cisplatin']),rule('CIS_40_49','cisplatin_renal_band','==','40_49','withhold','CrCl 40–49 mL/min requires withholding cisplatin and Consultant review of reduction or alternative treatment.',10,['cisplatin']),rule('CIS_LT40','cisplatin_renal_band','in',['lt40','dialysis'],'contraindicated','CrCl <40 mL/min or dialysis triggers the severe renal-impairment pathway; do not give cisplatin without specialist direction.',10,['cisplatin']),rule('CIS_MG','magnesium_low_or_unreplaced','==',True,'withhold','Correct electrolytes and confirm hydration before cisplatin.',9,['cisplatin']),rule('CIS_NEURO','hearing_or_neuropathy_grade','>=',2,'consultant_review','Grade 2 or worse hearing/neurological toxicity requires cisplatin dose or substitution review.',9,['cisplatin'])]
 if 'paclitaxel' in low:
  inp['paclitaxel_neuropathy_grade']=grade('Paclitaxel peripheral neuropathy grade','neuropathy','Assess sensory/motor symptoms, gait, fine motor function and effect on daily activities.')
  rules += [rule('TAXANE_NEURO_G2','paclitaxel_neuropathy_grade','>=',2,'consultant_review','Grade 2 neuropathy requires paclitaxel dose review; Grade 3–4 generally requires withholding/omission.',8,['paclitaxel']),rule('TAXANE_NEURO_G3','paclitaxel_neuropathy_grade','>=',3,'withhold','Grade 3–4 paclitaxel neuropathy requires withholding and dose modification.',10,['paclitaxel']),rule('TAXANE_LFT','bilirubin_uln_multiple','>',1.25,'consultant_review','Elevated bilirubin requires the paclitaxel hepatic dose-modification table.',8,['paclitaxel'])]
 if 'bevacizumab' in low:
  inp.update({'systolic_bp':num('Systolic blood pressure',130,'mmHg',1),'diastolic_bp':num('Diastolic blood pressure',80,'mmHg',1),'proteinuria_grade':grade('Proteinuria grade','generic','Use dipstick and quantified protein assessment; consider renal function and nephrotic features.'),'clinically_significant_bleeding':boolean('Clinically significant bleeding or haemoptysis'),'recent_thrombosis':boolean('Recent arterial thromboembolism or clinically significant VTE'),'major_surgery_or_unhealed_wound':boolean('Recent major surgery or unhealed wound'),'gi_perforation_or_fistula':boolean('GI perforation or fistula')})
  rules += [rule('BEV_BP_SYS','systolic_bp','>=',160,'withhold','Withhold bevacizumab until blood pressure is controlled.',9,['bevacizumab']),rule('BEV_BP_DIA','diastolic_bp','>=',100,'withhold','Withhold bevacizumab until blood pressure is controlled.',9,['bevacizumab']),rule('BEV_PROTEIN','proteinuria_grade','>=',3,'withhold','Severe proteinuria requires withholding and quantified renal assessment.',9,['bevacizumab']),rule('BEV_BLEED','clinically_significant_bleeding','==',True,'permanently_discontinue','Clinically significant bleeding triggers the severe bevacizumab pathway.',10,['bevacizumab']),rule('BEV_THROMBOSIS','recent_thrombosis','==',True,'consultant_review','Recent thromboembolism requires individualised bevacizumab risk review.',9,['bevacizumab']),rule('BEV_SURGERY','major_surgery_or_unhealed_wound','==',True,'withhold','Withhold bevacizumab around major surgery and until wounds are adequately healed.',9,['bevacizumab']),rule('BEV_PERF','gi_perforation_or_fistula','==',True,'permanently_discontinue','GI perforation or fistula requires permanent discontinuation.',10,['bevacizumab'])]
 if 'pegylated liposomal doxorubicin' in low:
  inp['ppe_grade']=grade('Palmar-plantar erythrodysesthesia grade','ppe','Assess skin changes, pain and effect on instrumental/self-care activities.')
  inp['stomatitis_grade']=grade('Stomatitis/oral mucositis grade','stomatitis','Assess pain, ulceration and effect on oral intake.')
  inp['lvef_percent']=num('LVEF',60,'%',1,0,100); inp['cumulative_anthracycline_concern']=boolean('Cumulative anthracycline exposure or new cardiac concern')
  rules += [rule('PLD_PPE_G2','ppe_grade','>=',2,'withhold','Grade 2 or worse PPE requires PLD interruption until recovery and dose modification.',9,['pegylated liposomal doxorubicin']),rule('PLD_STOM_G2','stomatitis_grade','>=',2,'withhold','Grade 2 or worse stomatitis requires PLD interruption until recovery and dose modification.',9,['pegylated liposomal doxorubicin']),rule('PLD_LVEF','lvef_percent','<',50,'consultant_review','LVEF below 50% requires cardiac review before further anthracycline exposure.',9,['pegylated liposomal doxorubicin']),rule('PLD_CUM','cumulative_anthracycline_concern','==',True,'consultant_review','Review cumulative anthracycline exposure and cardiac risk.',9,['pegylated liposomal doxorubicin'])]
 if ici:
  for k,v in {'pneumonitis_grade':grade('Immune-mediated pneumonitis grade','generic','Assess respiratory symptoms, oxygen requirement, imaging and exclude infection.'),'diarrhoea_colitis_grade':grade('Immune-mediated diarrhoea/colitis grade','diarrhoea','Assess stool frequency above baseline, blood, pain, hydration and systemic features.'),'rash_grade':grade('Immune-mediated rash/dermatitis grade','rash','Assess morphology, body-surface area, mucosal involvement and function.'),'creatinine_ratio_baseline_or_uln':num('Creatinine ratio versus baseline or ULN',1,'× baseline/ULN',.01),'tsh_miu_l':num('TSH (optional immunotherapy blood)',1.5,'mIU/L',.01),'free_t4_pmol_l':num('Free T4 (optional immunotherapy blood)',12,'pmol/L',.1),'cortisol_nmol_l':num('Cortisol (optional; interpret by sample time/steroid exposure)',350,'nmol/L',1),'acth_result':num('ACTH (optional; local units)',5,'local units',.1),'glucose_mmol_l':num('Glucose (optional immunotherapy blood)',5,'mmol/L',.1),'ketones_mmol_l':num('Blood ketones (optional if indicated)',0.1,'mmol/L',.1)}.items():
   inp[k]=v
   if k in ['tsh_miu_l','free_t4_pmol_l','cortisol_nmol_l','acth_result','glucose_mmol_l','ketones_mmol_l']:inp[k]['ui_section']='immunotherapy_bloods'
  rules += [rule('ICI_PNEUM_G2','pneumonitis_grade','>=',2,'withhold','Grade 2 immune pneumonitis requires withholding; Grade 3–4 requires permanent discontinuation.',10),rule('ICI_PNEUM_G3','pneumonitis_grade','>=',3,'permanently_discontinue','Grade 3–4 immune pneumonitis requires permanent discontinuation.',10),rule('ICI_COLITIS_G2','diarrhoea_colitis_grade','>=',2,'withhold','Grade 2 or worse immune diarrhoea/colitis requires withholding and immune-toxicity management.',9),rule('ICI_HEP_G2','alt_ast_uln_multiple','>',3,'withhold','ALT/AST >3 ×ULN requires immune-hepatitis assessment and withholding.',9),rule('ICI_HEP_G3','alt_ast_uln_multiple','>',5,'permanently_discontinue','ALT/AST >5 ×ULN triggers the severe immune-hepatitis pathway.',10),rule('ICI_BILI','bilirubin_uln_multiple','>',1.5,'withhold','Bilirubin >1.5 ×ULN requires immune-hepatitis assessment.',9),rule('ICI_RENAL','creatinine_ratio_baseline_or_uln','>',1.5,'withhold','Creatinine >1.5 × baseline/ULN requires immune-nephritis assessment.',9)]
 if any(x in low for x in ['methotrexate','dactinomycin']) or subgroup.startswith('gtn'):
  inp['serum_hcg_trend']=select('Serum hCG response',[('falling','Falling appropriately'),('plateau','Plateau'),('rising','Rising'),('normalised','Normalised')],'falling')
  inp['mucositis_grade']=grade('Mucositis grade','stomatitis','Assess oral ulceration, pain and effect on intake.')
  inp['folinic_acid_rescue_confirmed']=boolean('Folinic-acid rescue/timing confirmed where required')
  rules += [rule('GTN_HCG_PLATEAU','serum_hcg_trend','in',['plateau','rising'],'consultant_review','Plateauing or rising hCG requires GTN specialist review of resistance/relapse and regimen escalation.',10),rule('GTN_MUC_G2','mucositis_grade','>=',2,'withhold','Grade 2 or worse mucositis requires interruption and recovery before further methotrexate/dactinomycin.',9),rule('GTN_RESCUE','folinic_acid_rescue_confirmed','==',False,'withhold','Do not proceed with methotrexate-containing treatment until the prescribed folinic-acid rescue plan is confirmed.',10)]
 if 'bleomycin' in low:
  inp['new_respiratory_symptoms']=boolean('New cough, dyspnoea, hypoxia or concern for bleomycin pulmonary toxicity')
  rules += [rule('BLEO_LUNG','new_respiratory_symptoms','==',True,'withhold','Withhold bleomycin and urgently assess for pulmonary toxicity.',10,['bleomycin'])]
 if any(x in low for x in ['olaparib','niraparib','rucaparib']):
  inp['parp_renal_band']=renal('Renal function for PARP inhibitor',[('ge60','CrCl/eGFR ≥60 mL/min'),('30_59','30–59 mL/min'),('lt30','<30 mL/min'),('dialysis','Dialysis')],'ge60')
  inp['persistent_cytopenia_or_mds_concern']=boolean('Persistent cytopenia or MDS/AML concern')
  rules += [rule('PARP_ANC','anc','<',1,'withhold','Withhold PARP inhibitor for ANC <1.0 ×10⁹/L until recovery; apply the source dose-reduction pathway.',10),rule('PARP_PLT','platelets','<',100,'withhold','Withhold PARP inhibitor for platelets <100 ×10⁹/L until recovery; apply the source pathway.',9),rule('PARP_HB','haemoglobin','<',8,'withhold','Haemoglobin <8 g/dL requires withholding, clinical assessment and supportive management.',9),rule('PARP_RENAL','parp_renal_band','in',['lt30','dialysis'],'consultant_review','Severe renal impairment/dialysis requires regimen-specific specialist review.',9),rule('PARP_MDS','persistent_cytopenia_or_mds_concern','==',True,'permanently_discontinue','Persistent cytopenia or suspected MDS/AML requires interruption and urgent haematology/oncology assessment.',10)]
 if 'topotecan' in low:
  inp['topotecan_renal_band']=renal('Renal function for topotecan',[('ge40','CrCl ≥40 mL/min'),('20_39','CrCl 20–39 mL/min'),('lt20','CrCl <20 mL/min'),('dialysis','Dialysis')],'ge40')
  rules += [rule('TOPO_RENAL','topotecan_renal_band','==','20_39','dose_reduce','CrCl 20–39 mL/min requires the source-specific topotecan dose reduction.',9,['topotecan']),rule('TOPO_RENAL_LOW','topotecan_renal_band','in',['lt20','dialysis'],'contraindicated','CrCl <20 mL/min/dialysis: do not administer without specialist source-directed advice.',10,['topotecan'])]
 if 'trabectedin' in low:
  inp['ck_uln_multiple']=num('Creatine kinase (×ULN)',1,'×ULN',.01); inp['dexamethasone_premed_confirmed']=boolean('Dexamethasone premedication confirmed')
  rules += [rule('TRAB_CK','ck_uln_multiple','>',2.5,'withhold','CK >2.5 ×ULN requires withholding trabectedin and assessment for muscle injury/rhabdomyolysis.',10,['trabectedin']),rule('TRAB_LFT','alt_ast_uln_multiple','>',2.5,'withhold','Significant transaminase elevation requires the trabectedin hepatic withholding pathway.',9,['trabectedin']),rule('TRAB_DEX','dexamethasone_premed_confirmed','==',False,'withhold','Do not administer trabectedin until dexamethasone premedication is confirmed.',9,['trabectedin'])]
 # supportive risk
 if 'cisplatin' in low or 'cyclophosphamide' in low and 'dactinomycin' in low:risk='high'; script='nccp-parenteral-high'
 elif 'carboplatin' in low or 'doxorubicin' in ' '.join(low) or 'trabectedin' in low:risk='moderate';script='nccp-parenteral-moderate'
 elif cyt:risk='low';script='nccp-parenteral-low'
 else:risk='minimal';script='nccp-minimal-no-routine-prophylaxis'
 if 'radiotherapy' in low or subgroup.startswith('gtn'):risk='phase_dependent'
 classes=[]
 if cyt:classes.append('cytotoxic_chemotherapy')
 if ici:classes.append('immunotherapy')
 if 'bevacizumab' in low:classes.append('antiangiogenic_therapy')
 if any(x in low for x in ['olaparib','niraparib','rucaparib']):classes += ['parp_inhibitor','oral_targeted_therapy']
 section='chemotherapy_combination_sact' if cyt else ('immunotherapy' if ici else 'targeted_her2_therapy')
 label={'chemotherapy_combination_sact':'Chemotherapy & combination SACT','immunotherapy':'Immunotherapy','targeted_her2_therapy':'Targeted therapy'}[section]
 fname=f'{code}-{slug(title)}.json'
 groups=['Gynaecology']
 if code=='00419':groups.append('Head and Neck')
 if code=='00812':groups.append('Skin/Melanoma')
 if code in ['00300','00301']:groups.append('Genitourinary')
 p={'schema_version':'2.0.0','protocol_id':f'nccp-{code}-v{version}','file_name':fname,'status':'encoded_prototype_pending_clinical_and_pharmacy_validation','metadata':{'nccp_regimen_code':code,'nccp_version':version,'tumour_group':'Gynaecology','tumour_groups':groups,'title':title,'short_title':title,'indication':indication,'source_url':url,'source_document_pages':None,'sactcheck_encoding_version':VERSION,'source_checked_date':CHECKED,'partial_assessment_supported':True,'partial_assessment_note':'Any independently actionable entered value is assessed; omitted domains remain unassessed and do not block a partial result.','gynaecology_subgroup':subgroup,'treatment_context':['gynaecology',subgroup],'treatment_class':classes or ['systemic_anticancer_therapy'],'cytotoxic':cyt,'catalogue_section':section,'catalogue_section_label':label,'catalog':{'enabled':True},'drugs':drugs,'common_trade_names':aliases or [title.split()[0]],'migration':{'mode':'live_json'},'validation':{'official_catalogue_and_source_link_checked':True,'rule_level_source_reconciliation_status':'pending_independent_clinical_and_oncology_pharmacy_validation','software_tests_completed':True,'consultant_reviewed':False,'oncology_pharmacy_reviewed':False,'clinical_use_authorised':False}},'clinical_governance':{'prescriptive_authority':'Treatment plan must be initiated by a Consultant Medical Oncologist or the specialist authority specified in the current NCCP source.','dose_modification_note':'Use the most restrictive applicable component rule and confirm all dose changes against the current official NCCP PDF.','disclaimer':f'Decision-support encoding derived from NCCP {code} Version {version}. It does not replace the current official regimen, prescribing review, pharmacy verification or independent clinical judgement.'},'indications':[{'indication_id':f'{code}-gyn','code':f'{code}a','description':indication}],'treatment':{'cycle_length_days':cycle,'schedule_summary':title,'drugs':drugs},'input_definitions':inp,'required_inputs':[],'output_templates':{'proceed':'No encoded restriction was triggered in the entered domain(s). This is not an overall treatment clearance.','coverage_gap':'Only entered values were assessed; omitted clinically relevant domains remain unassessed.','consultant_review':'The entered value requires protocol-specific Consultant/pharmacy review.','withhold':'Withhold treatment and reassess according to the official NCCP pathway.','dose_reduce':'Apply the encoded dose-reduction pathway and confirm against the official source.','contraindicated':'The entered value triggers an encoded contraindication/exclusion.','permanently_discontinue':'The entered value triggers permanent discontinuation in the encoded pathway.'},'rule_engine':{'conflict_policy':'most_restrictive_action_wins','missing_data_policy':'report_unassessed_coverage_gap','actions_ranked_most_to_least_restrictive':['permanently_discontinue','contraindicated','discontinue','cease','omit','withhold_then_reduce','withhold','delay_then_dose_reduce','delay','consultant_review','dose_reduce','proceed_with_caution','proceed'],'rules':rules},'eligibility':['Indication as listed in the current official NCCP regimen','Performance status and disease-specific eligibility appropriate to the selected indication','Organ function appropriate for the selected regimen'],'exclusions':['Known hypersensitivity to a regimen component','Pregnancy or breastfeeding where prohibited by the current source','Regimen-specific exclusions encoded in the assessment'],'supportive_care':{'emetogenic_risk':risk,'script_id':script,'mapping_basis':'Highest emetogenic active component and phase-specific NCCP classification.','mapping_confidence':'source_reconciled_pending_pharmacy_validation','mapping_source_url':ANTI}}
 return p

def find_existing(code):
 for f in ROOT.glob('protocols/**/*.json'):
  if f.name in ['index.json','protocol-schema.json','package.json']:continue
  try:d=json.loads(f.read_text())
  except:continue
  if str(d.get('metadata',{}).get('nccp_regimen_code','')).zfill(5)==code:return f,d
 return None,None

def reconcile(f,d,item):
 code,version,title,url,subgroup,cycle,drugs,indication,aliases=item; m=d.setdefault('metadata',{})
 primary=m.get('tumour_group'); groups=list(m.get('tumour_groups') or ([] if not primary else [primary]))
 if primary and primary not in groups:groups.insert(0,primary)
 if 'Gynaecology' not in groups:groups.append('Gynaecology')
 if not primary:m['tumour_group']=groups[0]
 m['tumour_groups']=groups;m['gynaecology_subgroup']=subgroup;m['sactcheck_encoding_version']=VERSION;m['partial_assessment_supported']=True;m['source_checked_date']=CHECKED;m['source_url']=url;m['nccp_version']=version
 tc=list(m.get('treatment_context') or []);
 for x in ['gynaecology',subgroup]:
  if x not in tc:tc.append(x)
 m['treatment_context']=tc
 al=list(m.get('common_trade_names') or [])
 for x in aliases:
  if x not in al:al.append(x)
 m['common_trade_names']=al or [title.split()[0]]
 inds=d.get('indications');
 if not isinstance(inds,list):inds=[]
 if not any((x.get('indication_id')==f'{code}-gyn' or x.get('code')==f'{code}a') for x in inds if isinstance(x,dict)):
  inds.append({'indication_id':f'{code}-gyn','code':f'{code}a','description':indication})
 d['indications']=inds;d['required_inputs']=[]
 for x in (d.get('input_definitions') or {}).values():
  if isinstance(x,dict):x['required']=False
 d['status']='encoded_prototype_pending_clinical_and_pharmacy_validation'
 d.setdefault('supportive_care',{}).setdefault('mapping_source_url',ANTI)
 f.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')

new=[];reconciled=[]
for item in I:
 code=item[0];f,d=find_existing(code)
 if f:reconcile(f,d,item);reconciled.append(code)
 else:
  p=build_new(*item); path=OUT/p['file_name'];path.write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n');new.append(code)
print(f'Built complete Gynaecology catalogue: {len(new)} new, {len(reconciled)} reconciled, {len(I)} total.')
print('New:',','.join(new))
