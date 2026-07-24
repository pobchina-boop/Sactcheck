#!/usr/bin/env python3
from __future__ import annotations
import copy, glob, json, os, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GI_DIR = ROOT / 'protocols' / 'gastrointestinal'
SHARED_DIR = ROOT / 'protocols' / 'shared'
GI_DIR.mkdir(parents=True, exist_ok=True)
SHARED_DIR.mkdir(parents=True, exist_ok=True)

# Current NCCP Gastro-intestinal SACT catalogue snapshot, checked 24 July 2026.
# Each entry is a distinct official regimen document/card, not an indication-only duplicate.
I = [
('00238','6','Aflibercept and FOLFIRI Therapy – 14 day','https://healthservice.hse.ie/documents/6336/238_v6_Aflibercept_and_FOLFIRI.pdf',['Aflibercept','irinotecan','folinic acid','5-fluorouracil'],'Metastatic colorectal cancer after progression on an oxaliplatin-containing regimen.',14,'colorectal'),
('00831','2a','Atezolizumab and Bevacizumab Therapy','https://healthservice.hse.ie/documents/6432/831_v2a_Atezolizumab_Bevacizumab_Therapy.pdf',['atezolizumab','bevacizumab'],'First-line advanced or unresectable hepatocellular carcinoma.',21,'hepatobiliary'),
('00212','6a','Bevacizumab 10 mg/kg – 14 days','https://healthservice.hse.ie/documents/6942/212_V6a_Bevacizumab_10mgkg.pdf',['bevacizumab'],'With fluoropyrimidine-based chemotherapy for metastatic colorectal cancer.',14,'colorectal'),
('00214','8','Bevacizumab 7.5 mg/kg – 21 days','https://healthservice.hse.ie/documents/6554/214_Bevacizumab_7.5.pdf',['bevacizumab'],'With fluoropyrimidine-based chemotherapy for metastatic colorectal cancer.',21,'colorectal'),
('00215','7','Bevacizumab 15 mg/kg – 21 days','https://healthservice.hse.ie/documents/6940/00215_Bevacizumab_15.pdf',['bevacizumab'],'With fluoropyrimidine-based chemotherapy for metastatic colorectal cancer.',21,'colorectal'),
('00623','3a','Bevacizumab 7.5 mg/kg and Capecitabine 1250 mg/m² Therapy','https://healthservice.hse.ie/documents/6686/623_v3a_Bevacizumab_Capecitabine.pdf',['bevacizumab','capecitabine'],'Metastatic or unresectable colorectal cancer when irinotecan- or oxaliplatin-combination chemotherapy is unsuitable.',21,'colorectal'),
('00791','2','Bevacizumab 5 mg/kg, 5-Fluorouracil and Folinic Acid Therapy – 14 day','https://healthservice.hse.ie/documents/6416/791_v2_Bevacizumab_5mgkg_5FU.pdf',['bevacizumab','folinic acid','5-fluorouracil'],'Metastatic colorectal cancer.',14,'colorectal'),
('00449','6a','Bevacizumab 5 mg/kg and FOLFIRI Therapy – 14 day','https://healthservice.hse.ie/documents/6481/449_v6a_Bevacizumab5_FOLFIRI.pdf',['bevacizumab','irinotecan','folinic acid','5-fluorouracil'],'Metastatic colorectal cancer.',14,'colorectal'),
('00446','7b','Bevacizumab 5 mg/kg and modified FOLFOX-6 Therapy – 14 day','https://healthservice.hse.ie/documents/6478/446_v7b_Bevacizumab_5_plus_mFOLFOX-6.pdf',['bevacizumab','oxaliplatin','folinic acid','5-fluorouracil'],'Metastatic colorectal cancer.',14,'colorectal'),
('00783','2a','Bevacizumab 5 mg/kg and FOLFOXIRI Therapy – 14 day','https://healthservice.hse.ie/documents/6660/783_v2a_Bev_5_FOLFOXIRI_therapy.pdf',['bevacizumab','irinotecan','oxaliplatin','folinic acid','5-fluorouracil'],'Metastatic colorectal cancer.',14,'colorectal'),
('00216','8','Capecitabine Monotherapy','https://healthservice.hse.ie/documents/6558/216_v8_Capecitabine.pdf',['capecitabine'],'Metastatic colorectal cancer and adjuvant treatment after resection of stage II/III colon cancer.',21,'colorectal'),
('00586','3','Capecitabine 825 mg/m² and Radiotherapy – 7 day','https://healthservice.hse.ie/documents/6396/586_v3_Capecitabine_825_and_RT.pdf',['capecitabine','radiotherapy'],'Locally advanced rectal cancer.',7,'rectal_anal'),
('00523','5','Capecitabine and Radiotherapy – 7 day','https://healthservice.hse.ie/documents/6520/523_v5_Capecitabine_and_RT.pdf',['capecitabine','radiotherapy'],'Locally advanced pancreatic cancer after induction chemotherapy.',7,'pancreatic'),
('00505','5','Capecitabine and Temozolomide Therapy','https://healthservice.hse.ie/documents/6509/505_v5_Capecitabine_and_temozolomide_.pdf',['capecitabine','temozolomide'],'Locally advanced or metastatic pancreatic neuroendocrine tumours.',28,'neuroendocrine'),
('00321','9','Capecitabine and Oxaliplatin Therapy (XELOX/CAPOX)','https://healthservice.hse.ie/documents/6719/321_v9_XELOX_.pdf',['capecitabine','oxaliplatin'],'Adjuvant or metastatic colorectal cancer and adjuvant gastric adenocarcinoma after D2 gastrectomy.',21,'colorectal_upper_gi'),
('00422','5','Carboplatin AUC2 and Paclitaxel 50 mg/m² Weekly with Radiotherapy','https://healthservice.hse.ie/documents/6461/422_CarboAUC2_Pacli50_plus_RT.pdf',['carboplatin','paclitaxel','radiotherapy'],'Preoperative chemoradiation for oesophageal or gastro-oesophageal junction carcinoma.',7,'upper_gi'),
('00207','5','Cetuximab Therapy – 7 days','https://healthservice.hse.ie/documents/6548/207_v5_Cetuximab_7day.pdf',['cetuximab'],'EGFR-expressing RAS wild-type metastatic colorectal cancer.',7,'colorectal'),
('00732','2','Cetuximab Therapy – 14 days','https://healthservice.hse.ie/documents/6602/732_v2_Cetuximab_14day.pdf',['cetuximab'],'RAS wild-type metastatic colorectal cancer after oxaliplatin- and irinotecan-based treatment.',14,'colorectal'),
('00330','6','Cetuximab (7 day) and Irinotecan (14 day) Therapy','https://healthservice.hse.ie/documents/6785/330_v6_Cetuximab_7days_irinotecan_14_day.pdf',['cetuximab','irinotecan'],'Second-line RAS wild-type metastatic colorectal cancer.',14,'colorectal'),
('00331','7','Cetuximab (14 day) and Irinotecan (14 day) Therapy','https://healthservice.hse.ie/documents/6786/331_v7_Cetuximab_14days_irinotecan_14_day.pdf',['cetuximab','irinotecan'],'Second-line RAS wild-type metastatic colorectal cancer.',14,'colorectal'),
('00692','2','Cetuximab and FOLFOX-4 Therapy','https://healthservice.hse.ie/documents/6532/692_v2_Cetuximab_FOLFOX4.pdf',['cetuximab','oxaliplatin','folinic acid','5-fluorouracil'],'RAS wild-type metastatic colorectal cancer.',14,'colorectal'),
('00733','2a','Cetuximab and modified FOLFOX-6 Therapy','https://healthservice.hse.ie/documents/6603/733_v2a_Cetuximab_FOLFOX_6.pdf',['cetuximab','oxaliplatin','folinic acid','5-fluorouracil'],'RAS wild-type metastatic colorectal cancer.',14,'colorectal'),
('00328','7','Cetuximab (7 day) and FOLFIRI (14 day) Therapy','https://healthservice.hse.ie/documents/6773/328_Cetuximab_7_days_plus_FOLFIRI_14_Days.pdf',['cetuximab','irinotecan','folinic acid','5-fluorouracil'],'RAS wild-type metastatic colorectal cancer.',14,'colorectal'),
('00585','5b','Cetuximab (14 day) and FOLFIRI (14 day) Therapy','https://healthservice.hse.ie/documents/6395/585_v5b_Cetuximab_14_days_FOLFIRI.pdf',['cetuximab','irinotecan','folinic acid','5-fluorouracil'],'RAS wild-type metastatic colorectal cancer.',14,'colorectal'),
('00473','6','Cisplatin and Capecitabine Adjuvant Chemoradiation Therapy','https://healthservice.hse.ie/documents/6492/473_v6_Cisplatin_Capecitabine_Chemoradiation_Therapy.pdf',['cisplatin','capecitabine','radiotherapy'],'Adjuvant treatment of resected stage IIA or higher gastric cancer.',21,'upper_gi'),
('00594','3b','Cisplatin, 5-Fluorouracil and Radiation Therapy','https://healthservice.hse.ie/documents/6400/594_v3b_CISplatin_5-Fluorouracil_Chemoradiation_Therapy.pdf',['cisplatin','5-fluorouracil','radiotherapy'],'Anal canal carcinoma.',28,'rectal_anal'),
('00460','4','Cisplatin 75 mg/m² and 5-Fluorouracil Chemoradiation (Herskovic)','https://healthservice.hse.ie/documents/6488/460_v4_Herskovic_Regimen.pdf',['cisplatin','5-fluorouracil','radiotherapy'],'Locally advanced oesophageal squamous carcinoma or adenocarcinoma not suitable for surgery.',28,'upper_gi'),
('00235','5','Teysuno (S-1) and Cisplatin – 28 day','https://healthservice.hse.ie/documents/6334/235_Teysuno_CISplatin.pdf',['tegafur/gimeracil/oteracil','cisplatin'],'Advanced gastric cancer.',28,'upper_gi'),
('00203','7','Docetaxel Monotherapy 75 mg/m² – 21 day','https://healthservice.hse.ie/documents/6543/203_DOCEtaxel_75-21day.pdf',['docetaxel'],'Advanced or metastatic gastric or gastro-oesophageal junction adenocarcinoma after platinum-fluoropyrimidine treatment.',21,'upper_gi'),
('00386','4','Doxorubicin 60 mg/m² Therapy','https://healthservice.hse.ie/documents/6342/386_v4_DOXO_60mgm2.pdf',['doxorubicin'],'Unresectable or metastatic hepatocellular carcinoma not suitable for regional therapy.',21,'hepatobiliary'),
('00897','3','Durvalumab, Gemcitabine and Cisplatin Therapy','https://healthservice.hse.ie/documents/6652/897_v3_Durvalumab_Gem_Cis.pdf',['durvalumab','gemcitabine','cisplatin'],'First-line unresectable or metastatic biliary tract cancer.',21,'hepatobiliary'),
('00240','8','ECF: Epirubicin, Cisplatin and 5-Fluorouracil Therapy','https://healthservice.hse.ie/documents/6343/240_epiRUBicin_CISplatin_5FU_ECF.pdf',['epirubicin','cisplatin','5-fluorouracil'],'Perioperative or palliative gastric, gastro-oesophageal junction or lower oesophageal adenocarcinoma.',21,'upper_gi'),
('00380','6','ECX: Epirubicin, Cisplatin and Capecitabine Therapy','https://healthservice.hse.ie/documents/6345/380_v6_ECX_.pdf',['epirubicin','cisplatin','capecitabine'],'Perioperative or palliative gastric, gastro-oesophageal junction or lower oesophageal adenocarcinoma.',21,'upper_gi'),
('00429','7a','EOF: Epirubicin, Oxaliplatin and 5-Fluorouracil Therapy','https://healthservice.hse.ie/documents/6468/429_v7a_epiRUBicin_Oxaliplatin_and_5-Fluorouracil_EOF_-21_day.pdf',['epirubicin','oxaliplatin','5-fluorouracil'],'Locally advanced or metastatic gastric, oesophageal or gastro-oesophageal carcinoma.',21,'upper_gi'),
('00239','8','EOX: Epirubicin, Oxaliplatin and Capecitabine Therapy','https://healthservice.hse.ie/documents/6338/239_EOX.pdf',['epirubicin','oxaliplatin','capecitabine'],'Locally advanced or metastatic gastric, oesophageal or gastro-oesophageal carcinoma.',21,'upper_gi'),
('00320','6','Everolimus Monotherapy','https://healthservice.hse.ie/documents/6718/320_Everolimus.pdf',['everolimus'],'Progressive unresectable or metastatic pancreatic or non-functional gastrointestinal neuroendocrine tumours.',28,'neuroendocrine'),
('00344','9','FLOT Therapy – 14 day','https://healthservice.hse.ie/documents/6800/344_FLOT_OGsG2fX.pdf',['docetaxel','oxaliplatin','folinic acid','5-fluorouracil'],'Perioperative treatment of resectable locally advanced gastric or oesophagogastric junction adenocarcinoma.',14,'upper_gi'),
('00486','8','FLOX Therapy','https://healthservice.hse.ie/documents/6501/486_v8_FLOX.pdf',['oxaliplatin','folinic acid','5-fluorouracil'],'Adjuvant stage II or III colon cancer after complete resection.',56,'colorectal'),
('00227','9','FOLFIRI Therapy – 14 day','https://healthservice.hse.ie/documents/6563/227_v9_FOLFIRI.pdf',['irinotecan','folinic acid','5-fluorouracil'],'Advanced colorectal cancer, metastatic oesophageal cancer, or second-line locally advanced/metastatic pancreatic cancer.',14,'colorectal_upper_gi_pancreatic'),
('00210','9b','FOLFOX-4 Therapy – 14 day','https://healthservice.hse.ie/documents/6550/210_v9b_FOLFOX4.pdf',['oxaliplatin','folinic acid','5-fluorouracil'],'Adjuvant stage II/III colon cancer or metastatic colorectal carcinoma.',14,'colorectal'),
('00209','10a','Modified FOLFOX-6 Therapy – 14 day','https://healthservice.hse.ie/documents/6549/209_v10a_FOLFOX_6_Modified.pdf',['oxaliplatin','folinic acid','5-fluorouracil'],'Adjuvant stage II/III colon cancer, metastatic colorectal cancer, or advanced gastric/GEJ adenocarcinoma.',14,'colorectal_upper_gi'),
('00509','6','Modified FOLFOX-6 Chemoradiation Therapy – 14 day','https://healthservice.hse.ie/documents/6513/509_v6_FOLFOX_6_Modified_Chemoradiation_Therapy.pdf',['oxaliplatin','folinic acid','5-fluorouracil','radiotherapy'],'Definitive oesophageal chemoradiation when cisplatin is contraindicated.',14,'upper_gi'),
('00555','6b','FOLFOXIRI Therapy','https://healthservice.hse.ie/documents/6386/555_v6b_FOLFOXIRI_therapy.pdf',['irinotecan','oxaliplatin','folinic acid','5-fluorouracil'],'Metastatic colorectal cancer.',14,'colorectal'),
('00329','9','FOLFIRINOX Therapy','https://healthservice.hse.ie/documents/6774/329_v9_FOLFIRINOX.pdf',['irinotecan','oxaliplatin','folinic acid','5-fluorouracil'],'Metastatic pancreatic cancer.',14,'pancreatic'),
('00515','7','Modified FOLFIRINOX Therapy','https://healthservice.hse.ie/documents/6516/515_v7_FOLFIRINOX_modified.pdf',['irinotecan','oxaliplatin','folinic acid','5-fluorouracil'],'Adjuvant pancreatic ductal adenocarcinoma or metastatic pancreatic cancer.',14,'pancreatic'),
('00691','4','FOLFIRINOX Therapy – Rectal Carcinoma','https://healthservice.hse.ie/documents/6531/691_v4_Folfirinox_Rectal_carcinoma.pdf',['irinotecan','oxaliplatin','folinic acid','5-fluorouracil'],'Neoadjuvant chemotherapy for locally advanced rectal cancer.',14,'rectal_anal'),
('00660','2b','5-Fluorouracil and Folinic Acid Therapy – 14 day','https://healthservice.hse.ie/documents/6679/660_v2b_5FU_Folinic_acid.pdf',['folinic acid','5-fluorouracil'],'Adjuvant or advanced colorectal carcinoma.',14,'colorectal'),
('00451','4c','5-Fluorouracil (4 day), Mitomycin and Radiotherapy','https://healthservice.hse.ie/documents/6483/451_v4c_Mitomycin_and_5-FU_4day__RT.pdf',['mitomycin','5-fluorouracil','radiotherapy'],'Anal canal carcinoma.',28,'rectal_anal'),
('00421','4','5-Fluorouracil Continuous Infusion and Radiotherapy','https://healthservice.hse.ie/documents/6460/421_5-Fluorouracil_and_RT.pdf',['5-fluorouracil','radiotherapy'],'Locally advanced rectal cancer.',7,'rectal_anal'),
('00890','2','Fruquintinib Monotherapy','https://healthservice.hse.ie/documents/6648/890_v2_Fruquintinib.pdf',['fruquintinib'],'Previously treated metastatic colorectal cancer after standard therapies.',28,'colorectal'),
('00284','5','Gemcitabine 1000 mg/m² Monotherapy – 28 day','https://healthservice.hse.ie/documents/6699/284_v5_Gemcitabine_Monotherapy_28_day.pdf',['gemcitabine'],'Adjuvant pancreatic adenocarcinoma.',28,'pancreatic'),
('00283','6','Gemcitabine 1000 mg/m² Monotherapy – 56 day','https://healthservice.hse.ie/documents/8389/283_Gem_Monotherapy_56day.pdf',['gemcitabine'],'Locally advanced or metastatic pancreatic adenocarcinoma.',56,'pancreatic'),
('00522','4','Gemcitabine 400 mg/m² and Radiotherapy','https://healthservice.hse.ie/documents/6519/522_v4_Gemcitabine_400_and_RT.pdf',['gemcitabine','radiotherapy'],'Resectable adenocarcinoma of the head of pancreas.',7,'pancreatic'),
('00559','3','Gemcitabine 600 mg/m² and Radiotherapy','https://healthservice.hse.ie/documents/6390/559_v3_Gemcitabine_600_and_RT.pdf',['gemcitabine','radiotherapy'],'Localised unresectable pancreatic adenocarcinoma.',7,'pancreatic'),
('00521','3','Gemcitabine 1000 mg/m² and Radiotherapy','https://healthservice.hse.ie/documents/6518/521_Gemcitabine_1000_and_RT_lz7Y1pW.pdf',['gemcitabine','radiotherapy'],'Non-metastatic locally advanced pancreatic cancer.',7,'pancreatic'),
('00384','7','Gemcitabine 1000 mg/m² and Capecitabine 650 mg/m² – 21 day','https://healthservice.hse.ie/documents/6340/384_v7_Gemcitabine_1000_capecitabine_650_-21day_therapy.pdf',['gemcitabine','capecitabine'],'Locally advanced/metastatic pancreatic or biliary tree carcinoma.',21,'pancreatic_hepatobiliary'),
('00524','5','Gemcitabine 1000 mg/m² and Capecitabine 830 mg/m² – 28 day','https://healthservice.hse.ie/documents/6521/524_v5_Gemcitabine_and_capecitabine-28_day.pdf',['gemcitabine','capecitabine'],'Adjuvant pancreatic adenocarcinoma after complete resection.',28,'pancreatic'),
('00383','8','Gemcitabine 1000 mg/m² and Cisplatin 25 mg/m² – 21 day','https://healthservice.hse.ie/documents/6339/383_v8_GemCis25.pdf',['gemcitabine','cisplatin'],'Locally advanced or metastatic pancreatic or biliary tree carcinoma.',21,'pancreatic_hepatobiliary'),
('00213','7','Irinotecan Monotherapy – 21 day','https://healthservice.hse.ie/documents/6553/00213_Irinotecan_Monotherapy.pdf',['irinotecan'],'Advanced colorectal cancer after failure of 5-fluorouracil-containing therapy.',21,'colorectal'),
('00654','2','Irinotecan 150 mg/m² Monotherapy – 28 day','https://healthservice.hse.ie/documents/6681/654_v2_Irinotecan_150mg.m2_monotherapy-28day.pdf',['irinotecan'],'Second-line advanced gastric cancer refractory to fluoropyrimidine plus platinum.',28,'upper_gi'),
('00901','1a','Ivosidenib Therapy','https://healthservice.hse.ie/documents/6654/901_v1a_Ivosidenib.pdf',['ivosidenib'],'Previously treated locally advanced or metastatic IDH1 R132-mutated cholangiocarcinoma.',28,'hepatobiliary'),
('00644','2','Lenvatinib Therapy – HCC','https://healthservice.hse.ie/documents/6682/644_v2_Lenvatinib-HCC_Therapy.pdf',['lenvatinib'],'First-line advanced or unresectable hepatocellular carcinoma.',28,'hepatobiliary'),
('00642','2','Lutetium-177 Oxodotreotide (Lutathera) Therapy','https://healthservice.hse.ie/documents/6683/642_v2_Lutetium_Lu177_oxodotretide.pdf',['lutetium-177 oxodotreotide'],'Progressive somatostatin-receptor-positive gastroenteropancreatic neuroendocrine tumours.',56,'neuroendocrine'),
('00727','2b','Mitomycin and Capecitabine Chemoradiation Therapy','https://healthservice.hse.ie/documents/6600/727_v2b_Mitomycin_Capecitabine.pdf',['mitomycin','capecitabine','radiotherapy'],'Anal canal carcinoma.',28,'rectal_anal'),
('00256','7','Nab-paclitaxel and Gemcitabine Therapy – 28 day','https://healthservice.hse.ie/documents/6360/256_v7_nab-PACLitaxel_and_Gemcitabine.pdf',['nab-paclitaxel','gemcitabine'],'First-line metastatic pancreatic adenocarcinoma.',28,'pancreatic'),
('00844','4a','Nivolumab and Modified FOLFOX-6 Therapy','https://healthservice.hse.ie/documents/6445/844_Nivolumab_FOLFOX6_.pdf',['nivolumab','oxaliplatin','folinic acid','5-fluorouracil'],'First-line advanced oesophageal squamous cancer or HER2-negative advanced gastric/GEJ/oesophageal adenocarcinoma with required PD-L1 expression.',14,'upper_gi'),
('00832','3','Nivolumab 28 day, Cisplatin and 5-Fluorouracil Therapy','https://healthservice.hse.ie/documents/6433/832_Nivolumab_28-day_Cisplatin_5FU_.pdf',['nivolumab','cisplatin','5-fluorouracil'],'First-line advanced oesophageal squamous cell carcinoma with PD-L1 expression.',28,'upper_gi'),
('00816','3','Nivolumab 14 day, Cisplatin and 5-Fluorouracil Therapy','https://healthservice.hse.ie/documents/6428/816_Nivolumab_14-Day_Cisplatin_5FU.pdf',['nivolumab','cisplatin','5-fluorouracil'],'First-line advanced oesophageal squamous cell carcinoma with PD-L1 expression.',14,'upper_gi'),
('00551','7','Nivolumab 3 mg/kg with Ipilimumab 1 mg/kg Therapy','https://healthservice.hse.ie/documents/6385/551_Nivolumab_3mgkg_Ipilimumab_1mgk.pdf',['nivolumab','ipilimumab'],'Previously treated dMMR/MSI-H metastatic colorectal cancer.',21,'colorectal'),
('00900','1a','Nivolumab 240 mg and Ipilimumab 1 mg/kg Therapy','https://healthservice.hse.ie/documents/6653/900_v1a_Nivolumab_240mg_ipilimumab_1mgkg_.pdf',['nivolumab','ipilimumab'],'First-line unresectable or metastatic dMMR/MSI-H colorectal cancer.',21,'colorectal'),
('00483','13a','Nivolumab Monotherapy – 14 day','https://healthservice.hse.ie/documents/6498/483_Nivolumab_14-day_.pdf',['nivolumab'],'Adjuvant oesophageal or gastro-oesophageal junction cancer with residual disease after neoadjuvant chemoradiotherapy.',14,'upper_gi'),
('00484','13a','Nivolumab Monotherapy – 28 day','https://healthservice.hse.ie/documents/6499/484_Nivolumab_28-day_.pdf',['nivolumab'],'Adjuvant oesophageal or gastro-oesophageal junction cancer with residual disease after neoadjuvant chemoradiotherapy.',28,'upper_gi'),
('00843','2a','Nivolumab and XELOX Therapy','https://healthservice.hse.ie/documents/6444/843_Nivolumab_and_XELOX.pdf',['nivolumab','capecitabine','oxaliplatin'],'First-line HER2-negative advanced gastric, GEJ or oesophageal adenocarcinoma with PD-L1 CPS ≥5.',21,'upper_gi'),
('00588','5b','Olaparib Tablet Monotherapy','https://healthservice.hse.ie/documents/6397/588_Olaparib_tablet_monotherapy_FZxXOtF.pdf',['olaparib'],'Maintenance treatment of germline BRCA1/2-mutated metastatic pancreatic adenocarcinoma without progression after first-line platinum.',28,'pancreatic'),
('00621','3','Paclitaxel 80 mg/m² Days 1, 8 and 15 – 28 day','https://healthservice.hse.ie/documents/6688/621_V3_Paclitaxel_80.pdf',['paclitaxel'],'Second-line chemotherapy for advanced or recurrent gastric cancer.',28,'upper_gi'),
('00225','6','Panitumumab 6 mg/kg Therapy','https://healthservice.hse.ie/documents/6560/225_Panitumumab_6mgkg.pdf',['panitumumab'],'RAS wild-type metastatic colorectal cancer after fluoropyrimidine, oxaliplatin and irinotecan.',14,'colorectal'),
('00448','4b','Panitumumab and FOLFIRI Therapy – 14 day','https://healthservice.hse.ie/documents/6480/448_v4b_Panitumumab_plus_FOLFIRI.pdf',['panitumumab','irinotecan','folinic acid','5-fluorouracil'],'First- or second-line RAS wild-type metastatic colorectal cancer.',14,'colorectal'),
('00447','6b','Panitumumab and modified FOLFOX-6 Therapy – 14 day','https://healthservice.hse.ie/documents/6479/447_v6b_Panitumumab_plus_mFOLFOX-6.pdf',['panitumumab','oxaliplatin','folinic acid','5-fluorouracil'],'First-line RAS wild-type metastatic colorectal cancer.',14,'colorectal'),
('00889','1a','Pemigatinib Therapy','https://healthservice.hse.ie/documents/6647/889_v1a_Pemigatinib.pdf',['pemigatinib'],'Previously treated FGFR2-fusion/rearranged locally advanced or metastatic cholangiocarcinoma.',21,'hepatobiliary'),
('00455','15b','Pembrolizumab 200 mg Monotherapy','https://healthservice.hse.ie/documents/6903/455_V15b__Pembrolizumab_200mg_Monotherapy.pdf',['pembrolizumab'],'First-line metastatic MSI-H or dMMR colorectal cancer.',21,'colorectal'),
('00558','12b','Pembrolizumab 400 mg Monotherapy','https://healthservice.hse.ie/documents/6389/558_v12b_Pembrolizumab_400mg_monotherapy.pdf',['pembrolizumab'],'First-line metastatic MSI-H or dMMR colorectal cancer.',42,'colorectal'),
('00739','2a','Pembrolizumab, Cisplatin and 5-Fluorouracil Infusional Therapy','https://healthservice.hse.ie/documents/6622/739_v2a_Pembrolizumab200_CISplatin_5-FU.pdf',['pembrolizumab','cisplatin','5-fluorouracil'],'First-line locally advanced unresectable or metastatic oesophageal/GEJ carcinoma with PD-L1 CPS ≥10.',21,'upper_gi'),
('00839','2a','Pembrolizumab and Modified FOLFOX-6 Therapy','https://healthservice.hse.ie/documents/6440/839_v2a_Pembrolizumab_FOLFOX.pdf',['pembrolizumab','oxaliplatin','folinic acid','5-fluorouracil'],'First-line locally advanced unresectable or metastatic oesophageal/GEJ carcinoma with PD-L1 CPS ≥10.',14,'upper_gi'),
('00428','6','QUASAR Modified 5-Fluorouracil and Folinic Acid Weekly','https://healthservice.hse.ie/documents/6467/428_QUASAR_Modified_5FU_and_Folinic_Acid.pdf',['folinic acid','5-fluorouracil'],'Adjuvant or metastatic colorectal cancer.',7,'colorectal'),
('00244','5','Regorafenib Monotherapy','https://healthservice.hse.ie/documents/6347/244_v5_Regorafenib_Monotherapy.pdf',['regorafenib'],'Previously treated metastatic colorectal cancer.',28,'colorectal'),
('00427','6','Roswell Park Modified 5-Fluorouracil and Folinic Acid','https://healthservice.hse.ie/documents/6466/427_Roswell_Park_Modified.pdf',['folinic acid','5-fluorouracil'],'Adjuvant or metastatic colorectal cancer.',56,'colorectal'),
('00294','4','Sorafenib Therapy','https://healthservice.hse.ie/documents/6704/294_v4_SORAfenib.pdf',['sorafenib'],'Hepatocellular carcinoma.',28,'hepatobiliary'),
('00924','1','Tislelizumab and CAPOX Therapy','https://healthservice.hse.ie/documents/7463/00924_Tislelizumab_and_CAPOX.pdf',['tislelizumab','capecitabine','oxaliplatin'],'First-line unresectable locally advanced or metastatic oesophageal squamous cell carcinoma with PD-L1 TAP ≥5%.',21,'upper_gi'),
('00925','1','Tislelizumab and Modified FOLFOX-6 Therapy','https://healthservice.hse.ie/documents/7462/Tislelizumab_and_FOLFOX-6_Modified_Therapy.pdf',['tislelizumab','oxaliplatin','folinic acid','5-fluorouracil'],'First-line unresectable locally advanced or metastatic oesophageal squamous cell carcinoma with PD-L1 TAP ≥5%.',14,'upper_gi'),
('00502','4','Trastuzumab, 5-Fluorouracil and Cisplatin Therapy – 21 day','https://healthservice.hse.ie/documents/6508/502_v4_Trastuzumab_CISplatin_and_5-Fluorouracil.pdf',['trastuzumab','cisplatin','5-fluorouracil'],'First-line HER2-positive metastatic gastric or gastro-oesophageal junction adenocarcinoma.',21,'upper_gi'),
('00704','3a','Trastuzumab and Modified FOLFOX-6 Therapy – 14 day','https://healthservice.hse.ie/documents/6534/704_v3a_Trastuzumab_FOLFOX6_Modified.pdf',['trastuzumab','oxaliplatin','folinic acid','5-fluorouracil'],'HER2-positive metastatic gastric or gastro-oesophageal junction cancer.',14,'upper_gi'),
('00926','1','Tremelimumab and Durvalumab Therapy','https://healthservice.hse.ie/documents/7979/926_NCCP_Regimen_Tremelimumab_and_Durvalumab.pdf',['tremelimumab','durvalumab'],'First-line advanced or unresectable hepatocellular carcinoma.',28,'hepatobiliary'),
('00382','3','Trifluridine and Tipiracil (Lonsurf) Therapy','https://healthservice.hse.ie/documents/6348/382_v3_trifluridine_and_tipiracil_Lonsurf_therapy.pdf',['trifluridine','tipiracil'],'Previously treated metastatic colorectal cancer.',28,'colorectal'),
]

assert len(I)==93, len(I)

# Cross-tissue documents must remain canonical single files.
SHARED_CODES = {'00212','00214','00215','00203','00284','00320','00455','00483','00484','00551','00558','00588','00621'}

TRADE = {
 'aflibercept':['Zaltrap'],'atezolizumab':['Tecentriq'],'bevacizumab':['Avastin'],'capecitabine':['Xeloda'],
 'carboplatin':['Paraplatin'],'cetuximab':['Erbitux'],'cisplatin':['Platinol'],'docetaxel':['Taxotere'],
 'doxorubicin':['Adriamycin'],'durvalumab':['Imfinzi'],'epirubicin':['Pharmorubicin'],'everolimus':['Afinitor'],
 'fruquintinib':['Fruzaqla'],'gemcitabine':['Gemzar'],'irinotecan':['Campto'],'ivosidenib':['Tibsovo'],
 'lenvatinib':['Lenvima'],'lutetium-177 oxodotreotide':['Lutathera'],'nab-paclitaxel':['Abraxane'],
 'nivolumab':['Opdivo'],'ipilimumab':['Yervoy'],'olaparib':['Lynparza'],'oxaliplatin':['Eloxatin'],
 'paclitaxel':['Taxol'],'panitumumab':['Vectibix'],'pemigatinib':['Pemazyre'],'pembrolizumab':['Keytruda'],
 'regorafenib':['Stivarga'],'sorafenib':['Nexavar'],'tegafur/gimeracil/oteracil':['Teysuno'],
 'tislelizumab':['Tevimbra'],'trastuzumab':['Herceptin'],'tremelimumab':['Imjudo'],
 'trifluridine':['Lonsurf'],'tipiracil':['Lonsurf']
}

CTCAE_GENERIC_OPTIONS = [
 {'value':0,'label':'Grade 0','ctcae_grade':0},
 {'value':1,'label':'Grade 1','ctcae_grade':1},
 {'value':2,'label':'Grade 2','ctcae_grade':2},
 {'value':3,'label':'Grade 3','ctcae_grade':3},
 {'value':4,'label':'Grade 4','ctcae_grade':4},
]

def renal_band_def(label, options, demo, help_text=None):
 d=sel(label, options, demo, help_text)
 d['renal_input']={'mode':'protocol_specific_band','exact_value_required':False}
 return d

def exact_renal_def(label, demo, unit='mL/min', step=1, reason='Continuous renal value required by the regimen calculation'):
 d=num(label,demo,unit,step)
 d['renal_input']={'mode':'exact_continuous','exact_value_required':True,'reason':reason}
 return d

def slug(s):
 s=s.lower().replace('²','2').replace('–','-').replace('—','-')
 s=re.sub(r'[^a-z0-9]+','-',s).strip('-')
 return s[:80]

def sel(label, options, demo, help_text=None, ctcae=None):
 d={'label':label,'type':'select','required':False,'options':[{'value':v,'label':l} if not isinstance(v,dict) else v for v,l in options] if options and not isinstance(options[0],dict) else options,'demo_value':demo}
 if help_text: d['help_text']=help_text
 if ctcae:
  d['assessment_guidance']=ctcae
  d['ctcae_version']='5.0'
 return d

def grade_def(label, category, guidance):
 return {'label':label,'type':'select','required':False,'options':copy.deepcopy(CTCAE_GENERIC_OPTIONS),'demo_value':0,'assessment_guidance':guidance,'ctcae_version':'5.0','ctcae_category':category,'ctcae_source_url':'https://dctd.cancer.gov/research/ctep-trials/for-sites/adverse-events/ctcae-v5-5x7.pdf'}

def num(label, demo, unit='', step=0.1, minv=0):
 d={'label':label,'type':'number','required':False,'min':minv,'step':step,'demo_value':demo}
 if unit:d['unit']=unit
 return d

def boolean(label, demo=False, help_text=None):
 d={'label':label,'type':'boolean','required':False,'demo_value':demo}
 if help_text:d['help_text']=help_text
 return d

def rule(rid, field, op, value, action, message, priority=5):
 return {'id':rid,'priority':priority,'when':{'field':field,'operator':op,'value':value},'action':{'type':action,'components':['whole_regimen'],'message':message},'source':{'document':'Official NCCP regimen; component-specific decision pathway','page':'dose-modification section'},'explanation':message}

def any_rule(rid, leaves, action, message, priority=8):
 return {'id':rid,'priority':priority,'when':{'any':leaves},'action':{'type':action,'components':['whole_regimen'],'message':message},'source':{'document':'Official NCCP regimen','page':'eligibility/exclusions or dose-modification section'},'explanation':message}

def add(inp, rules, key, definition, new_rules):
 if key not in inp: inp[key]=definition
 rules.extend(new_rules)

def components_lower(components): return [x.lower() for x in components]

def build_protocol(code,version,title,url,components,indication,cycle,subgroup):
 c=components_lower(components)
 cytotoxic_agents=['5-fluorouracil','capecitabine','tegafur/gimeracil/oteracil','irinotecan','oxaliplatin','cisplatin','carboplatin','gemcitabine','paclitaxel','nab-paclitaxel','docetaxel','doxorubicin','epirubicin','mitomycin','temozolomide','trifluridine','tipiracil']
 is_cyt=any(x in c for x in cytotoxic_agents)
 is_ici=any(x in c for x in ['nivolumab','pembrolizumab','atezolizumab','durvalumab','tremelimumab','ipilimumab','tislelizumab'])
 targeted=any(x in c for x in ['aflibercept','bevacizumab','cetuximab','panitumumab','trastuzumab','everolimus','fruquintinib','ivosidenib','lenvatinib','olaparib','pemigatinib','regorafenib','sorafenib','lutetium-177 oxodotreotide'])
 if is_ici: section='immunotherapy'; section_label='Immunotherapy'
 elif targeted and not is_cyt: section='targeted_her2_therapy'; section_label='Targeted & HER2 therapies'
 elif targeted and is_cyt: section='chemotherapy_combination_sact'; section_label='Chemotherapy & combination SACT'
 else: section='chemotherapy_combination_sact'; section_label='Chemotherapy & combination SACT'
 classes=[]
 if is_cyt: classes.append('cytotoxic_chemotherapy')
 if is_ici: classes.append('immunotherapy')
 if targeted: classes.append('targeted_or_biologic_therapy')
 if 'radiotherapy' in c: classes.append('chemoradiation')
 if 'lutetium-177 oxodotreotide' in c: classes.append('radiopharmaceutical_therapy')
 if not classes: classes=['systemic_anticancer_therapy']

 inp={
  'ecog':sel('ECOG performance status',[(0,'0'),(1,'1'),(2,'2'),(3,'3'),(4,'4')],0),
  'hypersensitivity':boolean('Known hypersensitivity to a regimen component'),
  'pregnancy':boolean('Pregnant'),
  'breastfeeding':boolean('Breastfeeding'),
 }
 rules=[
  rule('ECOG_OUTSIDE_USUAL_SOURCE_RANGE','ecog','>',2,'consultant_review','ECOG is outside the usual NCCP eligibility range encoded for this regimen.',8),
  rule('HYPERSENSITIVITY_EXCLUSION','hypersensitivity','==',True,'contraindicated','Known hypersensitivity to a regimen component is an exclusion.',10),
  any_rule('PREGNANCY_OR_BREASTFEEDING',[{'field':'pregnancy','operator':'==','value':True},{'field':'breastfeeding','operator':'==','value':True}],'contraindicated','Pregnancy or breastfeeding requires the protocol exclusion pathway.',10)
 ]

 if is_cyt:
  inp.update({
   'anc_x10e9_l':num('Absolute neutrophil count',2.0,'×10⁹/L',0.1),
   'platelets_x10e9_l':num('Platelet count',150,'×10⁹/L',1),
   'febrile_or_active_infection':boolean('Fever, febrile neutropenia or active infection requiring treatment'),
   'other_nonhaem_toxicity_grade':grade_def('Worst relevant non-haematological toxicity','other_nonhaematological','Identify the exact adverse event and use its toxicity-specific CTCAE definition; assess symptoms, intervention and functional impact before selecting the grade.'),
  })
  rules += [
   rule('ANC_BELOW_SAFE_TREATMENT_RANGE','anc_x10e9_l','<',1.0,'withhold','ANC is below the encoded minimum treatment range; withhold and reassess against the official regimen.',9),
   rule('PLATELETS_BELOW_SAFE_TREATMENT_RANGE','platelets_x10e9_l','<',75,'withhold','Platelets are below the encoded minimum treatment range; withhold and reassess against the official regimen.',9),
   rule('FEVER_OR_ACTIVE_INFECTION','febrile_or_active_infection','==',True,'withhold','Withhold systemic treatment pending urgent clinical assessment of fever or active infection.',10),
   rule('SEVERE_OTHER_TOXICITY','other_nonhaem_toxicity_grade','>=',3,'withhold','Grade 3 or worse non-haematological toxicity requires withholding and regimen-specific review.',8),
  ]

 if any(x in c for x in ['5-fluorouracil','capecitabine','tegafur/gimeracil/oteracil']):
  inp['dpd_status']=sel('DPD status',[('normal','Normal/adequate'),('partial','Partial DPD deficiency'),('complete','Complete DPD deficiency'),('unknown','Not known')],'normal')
  inp['diarrhoea_grade']=grade_def('Diarrhoea grade','diarrhoea','Grade using increase in stools over baseline, ostomy output, need for hospitalisation and impact on self-care; do not grade from the word “diarrhoea” alone.')
  inp['mucositis_grade']=grade_def('Oral mucositis/stomatitis grade','mucositis','Assess pain, ulceration and whether oral intake is preserved, modified or impossible.')
  rules += [
   rule('DPD_COMPLETE_DEFICIENCY','dpd_status','==','complete','contraindicated','Complete DPD deficiency is a contraindication to fluoropyrimidine therapy.',10),
   rule('DPD_PARTIAL_DEFICIENCY','dpd_status','==','partial','consultant_review','Partial DPD deficiency requires an individualised reduced starting dose and careful titration.',8),
   rule('DPD_UNKNOWN','dpd_status','==','unknown','consultant_review','Confirm DPD status before starting or restarting fluoropyrimidine therapy.',7),
   rule('DIARRHOEA_GRADE_2_PLUS','diarrhoea_grade','>=',2,'withhold','Withhold fluoropyrimidine treatment for grade 2 or worse diarrhoea until resolved and apply the source dose-modification pathway.',8),
   rule('MUCOSITIS_GRADE_2_PLUS','mucositis_grade','>=',2,'withhold','Withhold fluoropyrimidine treatment for grade 2 or worse mucositis until resolved and apply the source dose-modification pathway.',8),
  ]
  if 'capecitabine' in c or 'tegafur/gimeracil/oteracil' in c:
   inp['hand_foot_syndrome_grade']=grade_def('Palmar-plantar erythrodysaesthesia (hand-foot syndrome) grade','ppe','Assess skin changes, pain and impact on instrumental or self-care activities of daily living.')
   rules.append(rule('HAND_FOOT_GRADE_2_PLUS','hand_foot_syndrome_grade','>=',2,'withhold','Withhold oral fluoropyrimidine for grade 2 or worse hand-foot syndrome until improved and use the source dose-reduction pathway.',8))

 if 'oxaliplatin' in c:
  inp['neuropathy_grade']=grade_def('Peripheral sensory neuropathy grade','neuropathy','Grade by symptoms and functional impact: instrumental ADL limitation is grade 2; self-care ADL limitation is grade 3.')
  inp['oxaliplatin_renal_band']=renal_band_def('Renal function for oxaliplatin',[('ge30','CrCl ≥30 mL/min'),('lt30','CrCl <30 mL/min'),('dialysis','Haemodialysis')],'ge30','Select the protocol-relevant renal band; no exact value is required unless another drug needs it.')
  rules += [
   rule('OXALIPLATIN_NEUROPATHY_G2','neuropathy_grade','>=',2,'consultant_review','Persistent grade 2 or worse neuropathy requires oxaliplatin-specific interruption/reduction review.',8),
   rule('OXALIPLATIN_SEVERE_RENAL','oxaliplatin_renal_band','==','lt30','consultant_review','CrCl <30 mL/min requires protocol-specific oxaliplatin dose review.',8),
   rule('OXALIPLATIN_DIALYSIS','oxaliplatin_renal_band','==','dialysis','consultant_review','Haemodialysis requires specialist pharmacy and Consultant dosing review.',9),
  ]

 if 'irinotecan' in c:
  inp['bilirubin_uln_multiple']=num('Bilirubin result (actual value entered; ×ULN calculated automatically)',1,'×ULN',0.01)
  inp['bowel_obstruction_or_chronic_inflammatory_bowel_disease']=boolean('Bowel obstruction or clinically significant chronic inflammatory bowel disease')
  inp['acute_cholinergic_syndrome']=boolean('Acute cholinergic symptoms during/after irinotecan')
  rules += [
   rule('IRINOTECAN_BILIRUBIN_OVER_3ULN','bilirubin_uln_multiple','>',3,'contraindicated','Bilirubin >3 ×ULN is an irinotecan exclusion in the NCCP pathway.',10),
   rule('IRINOTECAN_BOWEL_EXCLUSION','bowel_obstruction_or_chronic_inflammatory_bowel_disease','==',True,'contraindicated','Bowel obstruction or significant chronic bowel disease is an irinotecan exclusion.',10),
   rule('IRINOTECAN_CHOLINERGIC','acute_cholinergic_syndrome','==',True,'consultant_review','Treat acute cholinergic syndrome promptly and review atropine/supportive measures before further irinotecan.',7),
  ]

 if 'cisplatin' in c:
  inp['cisplatin_crcl_band']=renal_band_def('Creatinine clearance for cisplatin',[('ge60','≥60 mL/min'),('45_59','45–59 mL/min'),('lt45','<45 mL/min'),('dialysis','Haemodialysis')],'ge60')
  inp['hearing_toxicity_grade']=grade_def('Hearing impairment/tinnitus grade','hearing_impaired','Assess audiometric change, symptoms and whether hearing aids or intervention are indicated.')
  inp['neuropathy_grade']=inp.get('neuropathy_grade') or grade_def('Peripheral sensory neuropathy grade','neuropathy','Grade by symptoms and functional impact.')
  rules += [
   rule('CISPLATIN_CRCL_45_59','cisplatin_crcl_band','==','45_59','consultant_review','CrCl 45–59 mL/min requires the regimen-specific cisplatin reduction or substitution pathway.',8),
   rule('CISPLATIN_CRCL_LT45','cisplatin_crcl_band','==','lt45','withhold','CrCl <45 mL/min generally requires withholding cisplatin and considering an alternative regimen.',9),
   rule('CISPLATIN_DIALYSIS','cisplatin_crcl_band','==','dialysis','consultant_review','Dialysis requires specialist Consultant/pharmacy dosing and scheduling.',10),
   rule('CISPLATIN_OTOTOXICITY','hearing_toxicity_grade','>=',2,'consultant_review','Grade 2 or worse hearing toxicity requires cisplatin-specific review.',8),
  ]

 if 'carboplatin' in c:
  inp['crcl_ml_min']=exact_renal_def('Calculated creatinine clearance for Calvert dosing',75,'mL/min',1,'Exact CrCl is required for Calvert carboplatin dose calculation')
  inp['carboplatin_auc_verified']=boolean('Carboplatin AUC dose independently verified',True)
  rules += [
   rule('CARBOPLATIN_LOW_CRCL','crcl_ml_min','<',20,'consultant_review','Very low CrCl requires specialist review of Calvert dosing and regimen suitability.',9),
   rule('CARBOPLATIN_AUC_NOT_VERIFIED','carboplatin_auc_verified','==',False,'consultant_review','Carboplatin AUC calculation requires independent verification before prescribing.',7),
  ]

 if 'gemcitabine' in c:
  inp['treatment_day']=sel('Treatment day',[('day1','Day 1 / start of cycle'),('day8','Day 8'),('day15','Day 15')],'day1')
  rules += [
   rule('GEMCITABINE_ANC_LT05','anc_x10e9_l','<',0.5,'omit','ANC <0.5 ×10⁹/L triggers omission/withholding of the within-cycle gemcitabine dose.',9),
   rule('GEMCITABINE_PLATELETS_LT50','platelets_x10e9_l','<',50,'omit','Platelets <50 ×10⁹/L trigger omission/withholding of the within-cycle gemcitabine dose.',9),
  ]

 if any(x in c for x in ['paclitaxel','nab-paclitaxel','docetaxel']):
  inp['neuropathy_grade']=inp.get('neuropathy_grade') or grade_def('Peripheral neuropathy grade','neuropathy','Grade by symptoms and impact on instrumental and self-care activities of daily living.')
  inp['alt_ast_uln_multiple']=num('ALT / AST result (actual values entered; highest ×ULN calculated automatically)',1,'×ULN',0.01)
  inp['bilirubin_uln_multiple']=inp.get('bilirubin_uln_multiple') or num('Bilirubin result (actual value entered; ×ULN calculated automatically)',1,'×ULN',0.01)
  rules += [
   rule('TAXANE_NEUROPATHY_G2_PLUS','neuropathy_grade','>=',2,'consultant_review','Grade 2 or worse neuropathy requires taxane interruption or dose-modification review.',8),
   rule('TAXANE_LIVER_REVIEW','alt_ast_uln_multiple','>',3,'consultant_review','Transaminases >3 ×ULN require taxane-specific hepatic dosing review.',7),
  ]

 if any(x in c for x in ['doxorubicin','epirubicin','trastuzumab']):
  inp['lvef_percent']=num('Left ventricular ejection fraction',60,'%',1)
  inp['symptomatic_cardiac_dysfunction']=boolean('Symptoms/signs of cardiac dysfunction')
  rules += [
   rule('LOW_LVEF','lvef_percent','<',50,'withhold','LVEF <50% requires withholding and cardiac/Consultant review according to the source pathway.',9),
   rule('SYMPTOMATIC_CARDIAC_DYSFUNCTION','symptomatic_cardiac_dysfunction','==',True,'withhold','Symptomatic cardiac dysfunction requires treatment interruption and urgent assessment.',10),
  ]

 if any(x in c for x in ['bevacizumab','aflibercept','fruquintinib','lenvatinib','regorafenib','sorafenib']):
  inp['systolic_bp_mmhg']=num('Systolic blood pressure',125,'mmHg',1)
  inp['diastolic_bp_mmhg']=num('Diastolic blood pressure',75,'mmHg',1)
  inp['proteinuria_grade']=grade_def('Proteinuria grade','proteinuria','Use urine protein quantification and clinical consequences; dipstick alone may require confirmatory UPCR or 24-hour urine assessment.')
  inp['major_bleeding_or_recent_thrombosis']=boolean('Major bleeding, recent arterial thrombosis or clinically unstable venous thrombosis')
  inp['recent_or_planned_major_surgery']=boolean('Recent or planned major surgery / unhealed wound')
  inp['gi_perforation_or_fistula']=boolean('Gastrointestinal perforation or fistula')
  rules += [
   any_rule('UNCONTROLLED_HYPERTENSION',[{'field':'systolic_bp_mmhg','operator':'>=', 'value':160},{'field':'diastolic_bp_mmhg','operator':'>=', 'value':100}],'withhold','Withhold anti-angiogenic therapy for uncontrolled hypertension and optimise blood pressure.',9),
   rule('PROTEINURIA_GRADE_2_PLUS','proteinuria_grade','>=',2,'withhold','Clinically significant proteinuria requires withholding and quantified reassessment.',8),
   rule('MAJOR_BLEEDING_OR_THROMBOSIS','major_bleeding_or_recent_thrombosis','==',True,'withhold','Major bleeding or unstable recent thrombosis requires withholding and Consultant review.',10),
   rule('SURGERY_OR_UNHEALED_WOUND','recent_or_planned_major_surgery','==',True,'withhold','Anti-angiogenic therapy must be managed around major surgery and wound healing.',9),
   rule('GI_PERFORATION_OR_FISTULA','gi_perforation_or_fistula','==',True,'permanently_discontinue','Gastrointestinal perforation or fistula triggers permanent discontinuation of anti-VEGF therapy.',10),
  ]

 if any(x in c for x in ['cetuximab','panitumumab']):
  inp['acneiform_rash_grade']=grade_def('Acneiform rash grade','rash_acneiform','Grade by body-surface area, symptoms, psychosocial impact and impact on activities of daily living.')
  inp['infusion_reaction_grade']=grade_def('Infusion-related reaction grade','infusion','Grade by required interruption, response to symptomatic treatment, recurrence, hospitalisation and life-threatening features.')
  inp['magnesium_mmol_l']=num('Serum magnesium',0.8,'mmol/L',0.01)
  rules += [
   rule('EGFR_RASH_G3_PLUS','acneiform_rash_grade','>=',3,'withhold','Grade 3 or worse acneiform rash requires withholding and occurrence-specific dose modification.',8),
   rule('EGFR_INFUSION_REACTION_G3_PLUS','infusion_reaction_grade','>=',3,'permanently_discontinue','Grade 3 or 4 infusion reaction requires permanent discontinuation.',10),
   rule('HYPOMAGNESAEMIA','magnesium_mmol_l','<',0.5,'withhold','Severe hypomagnesaemia requires correction and treatment review before further anti-EGFR therapy.',8),
  ]

 if is_ici:
  # Optional immune-toxicity and endocrine laboratory pathways. No chemo-style counts are inherited unless chemotherapy is present.
  inp.update({
   'pneumonitis_grade':grade_def('Pneumonitis grade','pneumonitis','Assess symptoms, oxygen requirement, imaging extent and impact on activities of daily living.'),
   'diarrhoea_colitis_grade':grade_def('Immune-mediated diarrhoea/colitis grade','diarrhoea_or_colitis','Assess stool increase over baseline, abdominal symptoms, bleeding, hospitalisation and peritoneal signs.'),
   'creatinine_ratio_baseline_or_uln':num('Creatinine ratio versus baseline or local ULN',1,'× baseline/ULN',0.01),
   'alt_ast_uln_multiple':inp.get('alt_ast_uln_multiple') or num('ALT / AST result (actual values entered; highest ×ULN calculated automatically)',1,'×ULN',0.01),
   'bilirubin_uln_multiple':inp.get('bilirubin_uln_multiple') or num('Bilirubin result (actual value entered; ×ULN calculated automatically)',1,'×ULN',0.01),
   'tsh_miu_l':num('TSH (optional immunotherapy blood)',1.5,'mIU/L',0.01),
   'free_t4_pmol_l':num('Free T4 (optional immunotherapy blood)',14,'pmol/L',0.1),
   'cortisol_nmol_l':num('Cortisol (optional; interpret by sample time and steroid exposure)',400,'nmol/L',1),
   'glucose_mmol_l':num('Glucose (optional immunotherapy blood)',5.5,'mmol/L',0.1),
   'ketones_mmol_l':num('Blood ketones (optional if hyperglycaemia/symptoms)',0.1,'mmol/L',0.1),
   'myocarditis_or_neurological_red_flags':boolean('Possible myocarditis, myositis, encephalitis or acute neurological red flags'),
   'infusion_reaction_grade':inp.get('infusion_reaction_grade') or grade_def('Infusion-related reaction grade','infusion','Grade by required interruption, treatment, recurrence, hospitalisation and life-threatening features.'),
  })
  rules += [
   rule('ICI_PNEUMONITIS_G2_PLUS','pneumonitis_grade','>=',2,'withhold','Grade 2 or worse suspected immune-mediated pneumonitis requires withholding and urgent investigation.',10),
   rule('ICI_COLITIS_G2_PLUS','diarrhoea_colitis_grade','>=',2,'withhold','Grade 2 or worse immune-mediated diarrhoea/colitis requires withholding and prompt assessment.',9),
   rule('ICI_NEPHRITIS_RATIO','creatinine_ratio_baseline_or_uln','>=',1.5,'withhold','Creatinine ≥1.5 times baseline/ULN requires immune-mediated nephritis assessment and treatment interruption.',9),
   rule('ICI_HEPATITIS_TRANSAMINASE','alt_ast_uln_multiple','>',3,'withhold','ALT/AST >3 ×ULN requires immune-mediated hepatitis assessment and treatment interruption.',9),
   rule('ICI_HEPATITIS_BILIRUBIN','bilirubin_uln_multiple','>',1.5,'withhold','Bilirubin >1.5 ×ULN requires immune-mediated hepatic toxicity assessment.',9),
   any_rule('ICI_THYROID_ABNORMAL',[{'field':'tsh_miu_l','operator':'outside','value':[0.38,5.33]},{'field':'free_t4_pmol_l','operator':'outside','value':[8,18]}],'consultant_review','Thyroid results are outside the configured CUH reference range; assess symptoms and classify the immune endocrine pattern.',6),
   rule('ICI_LOW_CORTISOL','cortisol_nmol_l','<',100,'withhold','A very low cortisol may indicate adrenal insufficiency; assess urgently, account for sample time/steroids and treat clinically if suspected.',10),
   rule('ICI_HYPERGLYCAEMIA','glucose_mmol_l','>=',11.1,'consultant_review','Marked hyperglycaemia requires assessment for immune-mediated diabetes, including ketones when indicated.',8),
   rule('ICI_KETONAEMIA','ketones_mmol_l','>=',1.5,'withhold','Ketonaemia requires urgent assessment for diabetic ketoacidosis.',10),
   rule('ICI_CARDIAC_NEURO_RED_FLAGS','myocarditis_or_neurological_red_flags','==',True,'withhold','Possible immune-mediated cardiac, muscular or neurological toxicity requires urgent assessment and treatment interruption.',10),
   rule('ICI_INFUSION_REACTION_G3_PLUS','infusion_reaction_grade','>=',3,'permanently_discontinue','Grade 3 or 4 infusion reaction requires permanent discontinuation of the implicated immune therapy.',10),
  ]

 if any(x in c for x in ['everolimus','fruquintinib','ivosidenib','lenvatinib','olaparib','pemigatinib','regorafenib','sorafenib']):
  inp['alt_ast_uln_multiple']=inp.get('alt_ast_uln_multiple') or num('ALT / AST result (actual values entered; highest ×ULN calculated automatically)',1,'×ULN',0.01)
  inp['bilirubin_uln_multiple']=inp.get('bilirubin_uln_multiple') or num('Bilirubin result (actual value entered; ×ULN calculated automatically)',1,'×ULN',0.01)
  inp['oral_toxicity_grade']=grade_def('Worst treatment-related oral targeted-therapy toxicity','other_nonhaematological','Identify and grade the specific toxicity using its CTCAE definition; assess symptoms, intervention and functional impact.')
  rules += [
   rule('ORAL_TARGETED_G3_TOXICITY','oral_toxicity_grade','>=',3,'withhold','Grade 3 or worse treatment-related toxicity requires interruption and drug-specific dose modification.',8),
   rule('ORAL_TARGETED_LFT_REVIEW','alt_ast_uln_multiple','>',5,'withhold','ALT/AST >5 ×ULN requires interruption and drug-specific hepatic toxicity review.',9),
   rule('ORAL_TARGETED_BILIRUBIN_REVIEW','bilirubin_uln_multiple','>',3,'withhold','Bilirubin >3 ×ULN requires interruption and hepatic toxicity review.',9),
  ]
  if 'ivosidenib' in c:
   inp['qtc_ms']=num('QTc interval',430,'ms',1)
   rules.append(rule('IVOSIDENIB_QTC','qtc_ms','>=',500,'withhold','QTc ≥500 ms requires interruption and correction of reversible causes.',10))
  if 'pemigatinib' in c:
   inp['phosphate_mmol_l']=num('Serum phosphate',1.1,'mmol/L',0.01)
   rules += [rule('PEMIGATINIB_HYPERPHOSPHATAEMIA','phosphate_mmol_l','>',2.26,'withhold','Severe hyperphosphataemia requires interruption and phosphate-lowering management.',8)]
  if 'everolimus' in c:
   inp['stomatitis_grade']=grade_def('Stomatitis grade','mucositis','Assess pain, ulceration and ability to maintain oral intake.')
   inp['noninfectious_pneumonitis_grade']=grade_def('Non-infectious pneumonitis grade','pneumonitis','Assess symptoms, oxygen requirement, imaging and functional impact.')
   rules += [rule('EVEROLIMUS_STOMATITIS_G2','stomatitis_grade','>=',2,'withhold','Grade 2 or worse stomatitis requires interruption/supportive care and dose review.',8),rule('EVEROLIMUS_PNEUMONITIS_G2','noninfectious_pneumonitis_grade','>=',2,'withhold','Grade 2 or worse non-infectious pneumonitis requires interruption and assessment.',9)]

 if 'lutetium-177 oxodotreotide' in c:
  inp['renal_band']=renal_band_def('Renal function',[('ge50','eGFR/CrCl ≥50 mL/min'),('30_49','30–49 mL/min'),('lt30','<30 mL/min'),('dialysis','Dialysis')],'ge50')
  inp['haemoglobin_g_dl']=num('Haemoglobin',12,'g/dL',0.1)
  rules += [
   rule('LUTATHERA_RENAL_30_49','renal_band','==','30_49','consultant_review','Moderate renal impairment requires specialist review and enhanced monitoring.'),
   rule('LUTATHERA_RENAL_LT30','renal_band','==','lt30','contraindicated','Severe renal impairment is outside the encoded treatment range.'),
   rule('LUTATHERA_DIALYSIS','renal_band','==','dialysis','contraindicated','Dialysis requires specialist radionuclide-therapy review and is outside the routine pathway.'),
   rule('LUTATHERA_LOW_HB','haemoglobin_g_dl','<',8,'withhold','Severe anaemia requires withholding and haematological review before radionuclide therapy.'),
  ]

 # Emetogenic classification by most emetogenic active component.
 if 'cisplatin' in c or any(x in c for x in ['doxorubicin','epirubicin']): risk='high'; script='nccp-parenteral-high'
 elif 'carboplatin' in c or 'oxaliplatin' in c or 'irinotecan' in c or ('gemcitabine' in c and len(c)>1): risk='moderate'; script='nccp-parenteral-moderate'
 elif is_cyt: risk='low'; script='nccp-parenteral-low'
 elif any(x in c for x in ['everolimus','fruquintinib','ivosidenib','lenvatinib','olaparib','pemigatinib','regorafenib','sorafenib']): risk='oral_minimal_low'; script='nccp-oral-minimal-low'
 else: risk='minimal'; script='nccp-minimal-no-routine-prophylaxis'

 aliases=[]
 for comp in c: aliases.extend(TRADE.get(comp,[]))
 aliases=list(dict.fromkeys(aliases))
 file_name=f'{code}-{slug(title)}.json'
 metadata={
  'nccp_regimen_code':code,'nccp_version':version,'tumour_group':'Gastrointestinal','title':title,'short_title':title,
  'indication':indication,'source_url':url,'source_document_pages':None,'sactcheck_encoding_version':'0.39.0',
  'partial_assessment_supported':True,'partial_assessment_note':'Any independently actionable entered value is assessed; omitted domains remain unassessed and do not block a partial result.',
  'gi_subgroup':subgroup,'treatment_context':['gastrointestinal',subgroup],'treatment_class':classes,'cytotoxic':is_cyt,
  'catalogue_section':section,'catalogue_section_label':section_label,'catalog':{'enabled':True},
  'drugs':components,'common_trade_names':aliases,'migration':{'mode':'live_json'},
  'validation':{'official_catalogue_and_source_link_checked':True,'rule_level_source_reconciliation_status':'pending_independent_clinical_and_oncology_pharmacy_validation','software_tests_completed':True,'consultant_reviewed':False,'oncology_pharmacy_reviewed':False,'clinical_use_authorised':False}
 }
 p={
  'schema_version':'2.0.0','protocol_id':f'nccp-{code}-v{version}','file_name':file_name,
  'status':'encoded_prototype_pending_clinical_and_pharmacy_validation','metadata':metadata,
  'clinical_governance':{
   'prescriptive_authority':'The treatment plan must be initiated by a Consultant Medical Oncologist or other appropriately authorised specialist named in the current NCCP source.',
   'dose_modification_note':'Use the most restrictive applicable component rule and confirm dose changes against the current official NCCP PDF.',
   'disclaimer':f'Decision-support encoding derived from NCCP {code} Version {version}. It does not replace the current official regimen, prescribing review, pharmacy verification or independent clinical judgement.'
  },
  'indications':[{'indication_id':f'{code}a','description':indication}],
  'treatment':{'cycle_length_days':cycle,'schedule_summary':title,'drugs':components},
  'input_definitions':inp,'required_inputs':[],
  'output_templates':{
   'proceed':'No encoded restriction was triggered in the entered domain(s). This is not an overall treatment clearance.',
   'coverage_gap':'Only entered values were assessed; omitted clinically relevant domains remain unassessed.',
   'consultant_review':'The entered value requires protocol-specific Consultant/pharmacy review.',
   'withhold':'Withhold treatment and reassess according to the official NCCP pathway.',
   'omit':'Omit the relevant scheduled dose and reassess according to the official NCCP pathway.',
   'contraindicated':'The entered value triggers an encoded contraindication/exclusion.',
   'permanently_discontinue':'The entered value triggers permanent discontinuation in the encoded pathway.'
  },
  'rule_engine':{
   'conflict_policy':'most_restrictive_action_wins','missing_data_policy':'report_unassessed_coverage_gap',
   'actions_ranked_most_to_least_restrictive':['permanently_discontinue','contraindicated','discontinue','cease','omit','withhold_then_reduce','withhold','delay_then_dose_reduce','delay','consultant_review','dose_reduce_two_levels','dose_reduce_one_level','dose_reduce','proceed_with_caution','proceed'],
   'rules':rules
  },
  'eligibility':['Indication as listed in the current official NCCP regimen','Performance status and organ function appropriate for the selected treatment'],
  'exclusions':['Known hypersensitivity to a regimen component','Pregnancy or breastfeeding where prohibited by the current source'],
  'monitoring':['FBC, renal and liver profile as specified by the current NCCP regimen','Treatment-specific toxicity monitoring before each administration/cycle'],
  'dose_modifications':['Component-specific haematological, renal, hepatic and non-haematological dose-modification pathways are encoded as independently actionable rules.'],
  'supportive_care':{
   'emetogenic_risk':risk,'script_id':script,'mapping_source':'NCCP SACT Antiemetic Guidance V6 (2025)',
   'mapping_source_url':'https://healthservice.hse.ie/documents/7152/Classification_Document_for_Systemic_Anti-_Cancer_Therapy_SACT_Induced_Nausea__pWgDCrm.pdf',
   'mapping_basis':'Risk assigned from the most emetogenic active component and treatment phase.','mapping_confidence':'high',
   'validation_status':'source_mapped_pending_local_oncology_pharmacy_validation','breakthrough_profile_id':'nccp-breakthrough-general',
   'supportive_medications_pdf_url':'https://healthservice.hse.ie/documents/7152/Classification_Document_for_Systemic_Anti-_Cancer_Therapy_SACT_Induced_Nausea__pWgDCrm.pdf',
   'supportive_medications_label':f'{risk.replace("_"," ").title()} emetogenic-risk guidance'
  }
 }
 return p

def all_protocol_files():
 return [Path(f) for f in glob.glob(str(ROOT/'protocols'/'**'/'*.json'),recursive=True) if not f.endswith('index.json') and '/_template/' not in f and not f.endswith('protocol-schema.json')]

def by_code():
 out={}
 for f in all_protocol_files():
  try:d=json.loads(f.read_text())
  except Exception:continue
  code=str(d.get('metadata',{}).get('nccp_regimen_code','')).zfill(5)
  if code and code!='00000':out.setdefault(code,[]).append((f,d))
 return out

existing=by_code()
new_count=0; updated=0
for item in I:
 code=item[0]
 generated=build_protocol(*item)
 if code in existing:
  # Preserve deeper pre-existing clinical encodings; reconcile GI metadata, official source/version and common platform fields.
  f,d=existing[code][0]
  m=d.setdefault('metadata',{})
  old_primary=m.get('tumour_group') if isinstance(m.get('tumour_group'),str) else None
  old_groups=m.get('tumour_groups') if isinstance(m.get('tumour_groups'),list) else []
  groups=[]
  for g in ([old_primary] if old_primary else [])+old_groups+['Gastrointestinal']:
   if g and g not in groups: groups.append(g)
  if len(groups)==1:
   m['tumour_group']='Gastrointestinal'; m.pop('tumour_groups',None)
  else:
   m.pop('tumour_group',None); m['tumour_groups']=groups
  m['nccp_version']=item[1]
  m['source_url']=item[3]
  m['gi_subgroup']=item[7]
  m['partial_assessment_supported']=True
  m['partial_assessment_note']='Any independently actionable entered value is assessed; omitted domains remain unassessed and do not block a partial result.'
  m['sactcheck_encoding_version']='0.39.0'
  m.setdefault('drugs',item[4])
  m.setdefault('common_trade_names',generated['metadata']['common_trade_names'])
  m.setdefault('validation',{}).update({'software_tests_completed':True})
  d['required_inputs']=[]
  # Add missing GI indication without discarding existing multi-tumour indications.
  inds=d.setdefault('indications',[])
  descriptions=' '.join(str(x.get('description','')) for x in inds if isinstance(x,dict)).lower()
  if item[5].lower()[:40] not in descriptions:
   inds.append({'indication_id':f'{code}-gi','description':item[5]})
  # Correct known source/card issues.
  if code=='00621':
   m['title']=item[2]; m['short_title']=item[2]; m['source_url']=item[3]; m['nccp_version']='3'
  if code=='00203':
   m['tumour_groups']=list(dict.fromkeys((m.get('tumour_groups') or [])+['Gastrointestinal']))
  f.write_text(json.dumps(d,indent=2,ensure_ascii=False)+'\n')
  updated+=1
 else:
  target=(SHARED_DIR if code in SHARED_CODES else GI_DIR)/generated['file_name']
  target.write_text(json.dumps(generated,indent=2,ensure_ascii=False)+'\n')
  new_count+=1

# Ensure canonical shared tumour-site metadata for all shared GI documents.
for f in all_protocol_files():
 try:d=json.loads(f.read_text())
 except:continue
 code=str(d.get('metadata',{}).get('nccp_regimen_code','')).zfill(5)
 if code not in {x[0] for x in I}:continue
 m=d.get('metadata',{})
 if isinstance(m.get('tumour_group'),list):
  m['tumour_groups']=m.pop('tumour_group')
 if isinstance(m.get('tumour_group'),str) and isinstance(m.get('tumour_groups'),list) and m['tumour_group'] not in m['tumour_groups']:
  m['tumour_groups']=[m['tumour_group']]+m['tumour_groups']
 if isinstance(m.get('tumour_groups'),list):
  m['tumour_groups']=list(dict.fromkeys([str(x).strip() for x in m['tumour_groups'] if str(x).strip()]))
  if 'Gastrointestinal' not in m['tumour_groups']:m['tumour_groups'].append('Gastrointestinal')
  m.pop('tumour_group',None)
 else:
  m['tumour_group']='Gastrointestinal'
 d['required_inputs']=[]
 f.write_text(json.dumps(d,indent=2,ensure_ascii=False)+'\n')

print(f'GI build complete: {new_count} new protocols; {updated} canonical existing protocols updated; official inventory {len(I)}.')
