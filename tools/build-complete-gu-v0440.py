#!/usr/bin/env python3
from __future__ import annotations
import json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'protocols' / 'genitourinary'
OUT.mkdir(parents=True, exist_ok=True)
VERSION = '0.44.0'
CHECKED = '2026-07-25'
CTCAE = 'https://dctd.cancer.gov/research/ctep-trials/for-sites/adverse-events/ctcae-v5-5x7.pdf'
ANTI = 'https://healthservice.hse.ie/documents/7152/Classification_Document_for_Systemic_Anti-_Cancer_Therapy_SACT_Induced_Nausea__pWgDCrm.pdf'
CATALOGUE = 'https://healthservice.hse.ie/staff/information-healthcare-workers/nccp/genitourinary-sact-regimens/'

# Current unique NCCP GU catalogue snapshot checked 25 July 2026.
# Existing shared protocols are reconciled in place; only genuinely absent codes are created.
# code: version, source, areas, indication, optional new-protocol fields.
D = {
# Bladder / urothelial
'00450':('4c','https://healthservice.hse.ie/documents/6482/450_v4c_Mitomycin_and_5-FU_5__RT.pdf',['bladder'],'Muscle-invasive bladder cancer treated with definitive chemoradiation.',{'title':'Mitomycin and 5-Fluorouracil with Radiotherapy','cycle':42,'drugs':['mitomycin','fluorouracil','radiotherapy'],'aliases':['5-FU','Mitomycin C'],'intent':'curative','duration':{'duration_type':'fixed_cycles','planned_cycles':1},'schedule':'Mitomycin day 1; fluorouracil days 1–5 and 22–26 with radiotherapy.'}),
'00544':('14','https://healthservice.hse.ie/documents/6644/544_v14_Atezolizumab_21_Day_Monotherapy.pdf',['bladder'],'Locally advanced or metastatic urothelial carcinoma in an NCCP-listed atezolizumab indication.',{}),
'00593':('10a','https://healthservice.hse.ie/documents/6399/593_v10a_Atezolizumab_1680mg_Monotherapy.pdf',['bladder'],'Locally advanced or metastatic urothelial carcinoma in an NCCP-listed atezolizumab indication.',{}),
'00535':('6','https://healthservice.hse.ie/documents/8038/535_Avelumab.pdf',['bladder'],'First-line maintenance treatment of locally advanced or metastatic urothelial carcinoma without progression after platinum chemotherapy.',{'title':'Avelumab Monotherapy','cycle':14,'drugs':['avelumab'],'aliases':['Bavencio'],'intent':'maintenance','duration':{'duration_type':'until_progression_or_toxicity'},'schedule':'Avelumab every 14 days until progression or unacceptable toxicity.'}),
'00807':('2','https://healthservice.hse.ie/documents/6424/807_v2_Intravesical_BCG.pdf',['bladder'],'Intravesical treatment of high-risk non-muscle-invasive bladder cancer.',{'title':'Intravesical BCG','cycle':7,'drugs':['bacillus Calmette-Guérin intravesical'],'aliases':['BCG','OncoTICE'],'intent':'adjuvant','duration':{'duration_type':'phased_course','duration_text':'Six weekly induction instillations followed by protocol-defined maintenance'},'schedule':'Weekly induction for 6 weeks followed by protocol-defined maintenance courses.'}),
'00385':('5','https://healthservice.hse.ie/documents/6341/385_V5_CISplatin_40mgm2_weekly_with_RT.pdf',['bladder'],'Bladder-preserving chemoradiation or another NCCP-listed indication for weekly cisplatin with radiotherapy.',{}),
'00337':('5','https://healthservice.hse.ie/documents/6798/337_v5_CISplatin_Methotrexate_vinBLAStine_therapy_CMV.pdf',['bladder'],'Neoadjuvant or systemic treatment of urothelial carcinoma where CMV is selected.',{'title':'Cisplatin, Methotrexate and Vinblastine (CMV) Therapy','cycle':21,'drugs':['cisplatin','methotrexate','vinblastine'],'aliases':['CMV','Platinol','Velban'],'intent':'neoadjuvant','duration':{'planned_cycles':3},'schedule':'CMV every 21 days; planned course according to indication and current NCCP regimen.'}),
'00885':('2','https://healthservice.hse.ie/documents/6646/885_v2_Erdafitinib.pdf',['bladder'],'Locally advanced or metastatic urothelial carcinoma with a susceptible FGFR alteration after prior systemic therapy.',{'title':'Erdafitinib Therapy','cycle':28,'drugs':['erdafitinib'],'aliases':['Balversa'],'intent':'advanced_disease','duration':{'duration_type':'until_progression_or_toxicity'},'schedule':'Continuous oral erdafitinib; 28-day assessment cycle convention.'}),
'00846':('3a','https://healthservice.hse.ie/documents/6446/846_v3a_Enfortumab_vedotin.pdf',['bladder'],'Locally advanced or metastatic urothelial carcinoma in an NCCP-listed enfortumab vedotin indication.',{'title':'Enfortumab Vedotin Monotherapy','cycle':28,'drugs':['enfortumab vedotin'],'aliases':['Padcev'],'intent':'advanced_disease','duration':{'duration_type':'until_progression_or_toxicity'},'schedule':'Enfortumab vedotin on days 1, 8 and 15 of each 28-day cycle.'}),
'00945':('1','https://healthservice.hse.ie/documents/10493/945_Enfortumab_vedotin_Pembro.pdf',['bladder'],'First-line treatment of unresectable or metastatic urothelial carcinoma.',{'title':'Enfortumab Vedotin and Pembrolizumab Therapy','cycle':21,'drugs':['enfortumab vedotin','pembrolizumab'],'aliases':['Padcev','Keytruda'],'intent':'advanced_disease','duration':{'duration_type':'until_progression_or_toxicity'},'schedule':'Enfortumab vedotin days 1 and 8 plus pembrolizumab day 1 every 21 days; an NCCP 42-day pembrolizumab option also exists.'}),
'00759':('1','https://healthservice.hse.ie/documents/6669/759_v1_Gemcitabine_100_and_RT.pdf',['bladder'],'Bladder-preserving chemoradiation for muscle-invasive bladder cancer.',{'title':'Gemcitabine 100 mg/m² with Radiotherapy','cycle':28,'drugs':['gemcitabine','radiotherapy'],'aliases':['Gemzar'],'intent':'curative','duration':{'planned_cycles':1},'schedule':'Gemcitabine on days 1, 8, 15 and 22 with radiotherapy.'}),
'00310':('7','https://healthservice.hse.ie/documents/6713/310_v7_GemCARBOAUC_5.pdf',['bladder'],'Advanced urothelial carcinoma where gemcitabine and carboplatin is selected.',{}),
'00622':('3','https://healthservice.hse.ie/documents/6687/622_v3_GemCis35_21day.pdf',['bladder'],'Locally advanced or metastatic urothelial carcinoma treated with split-dose cisplatin and gemcitabine.',{'title':'Gemcitabine and Cisplatin 35 mg/m² – 21 day','cycle':21,'drugs':['gemcitabine','cisplatin'],'aliases':['GemCis','Gemzar','Platinol'],'intent':'advanced_disease','duration':{'duration_text':'4 to 6 cycles or according to response and tolerability'},'schedule':'Gemcitabine and split-dose cisplatin on days 1 and 8 every 21 days.'}),
'00628':('3','https://healthservice.hse.ie/documents/6684/628_v3_GemCis70_21_day.pdf',['bladder'],'Locally advanced or metastatic urothelial carcinoma treated with gemcitabine and cisplatin.',{'title':'Gemcitabine and Cisplatin 70 mg/m² – 21 day','cycle':21,'drugs':['gemcitabine','cisplatin'],'aliases':['GemCis','Gemzar','Platinol'],'intent':'advanced_disease','duration':{'duration_text':'4 to 6 cycles or according to response and tolerability'},'schedule':'Gemcitabine days 1 and 8 with cisplatin day 1 every 21 days.'}),
'00282':('5','https://healthservice.hse.ie/documents/6454/282_v5_GemCis_70_28days.pdf',['bladder'],'Locally advanced or metastatic urothelial carcinoma treated with gemcitabine and cisplatin.',{'title':'Gemcitabine and Cisplatin 70 mg/m² – 28 day','cycle':28,'drugs':['gemcitabine','cisplatin'],'aliases':['GemCis','Gemzar','Platinol'],'intent':'advanced_disease','duration':{'duration_text':'4 to 6 cycles or according to response and tolerability'},'schedule':'Gemcitabine days 1, 8 and 15 with cisplatin day 1 of each 28-day cycle.'}),
'00894':('1','https://healthservice.hse.ie/documents/7616/894_Gemcitabine_Docetaxel_intravesical_.pdf',['bladder'],'Intravesical treatment of high-risk non-muscle-invasive bladder cancer after BCG failure or where BCG is unsuitable.',{'title':'Intravesical Gemcitabine and Docetaxel','cycle':7,'drugs':['gemcitabine intravesical','docetaxel intravesical'],'aliases':['Gem/Doce intravesical','Gemzar','Taxotere'],'intent':'adjuvant','duration':{'duration_type':'phased_course','duration_text':'Six weekly induction instillations followed by monthly maintenance for up to 18 months'},'schedule':'Weekly sequential intravesical gemcitabine/docetaxel for 6 weeks, then monthly maintenance up to 18 months.'}),
'00333':('5a','https://healthservice.hse.ie/documents/6787/333_v5a_MVAC_14_day.pdf',['bladder'],'Neoadjuvant or advanced urothelial carcinoma treated with dose-dense MVAC.',{'title':'Dose-dense Methotrexate, Vinblastine, Doxorubicin and Cisplatin (MVAC) – 14 day','cycle':14,'drugs':['methotrexate','vinblastine','doxorubicin','cisplatin'],'aliases':['ddMVAC','MVAC','Adriamycin','Platinol'],'intent':'neoadjuvant','duration':{'duration_text':'4 to 6 cycles according to indication'},'schedule':'Dose-dense MVAC every 14 days with G-CSF support.'}),
'00338':('5','https://healthservice.hse.ie/documents/6799/338_v5_MVAC_28_day.pdf',['bladder'],'Neoadjuvant or advanced urothelial carcinoma treated with MVAC.',{'title':'Methotrexate, Vinblastine, Doxorubicin and Cisplatin (MVAC) – 28 day','cycle':28,'drugs':['methotrexate','vinblastine','doxorubicin','cisplatin'],'aliases':['MVAC','Adriamycin','Platinol'],'intent':'neoadjuvant','duration':{'duration_text':'4 to 6 cycles according to indication'},'schedule':'MVAC repeated every 28 days.'}),
'00483':('13a','https://healthservice.hse.ie/documents/6498/483_Nivolumab_14-day_.pdf',['bladder','renal'],'Advanced urothelial carcinoma or renal-cell carcinoma in an NCCP-listed nivolumab indication.',{}),
'00484':('13a','https://healthservice.hse.ie/documents/6499/484_Nivolumab_28-day_.pdf',['bladder','renal'],'Advanced urothelial carcinoma or renal-cell carcinoma in an NCCP-listed nivolumab indication.',{}),
'00226':('9','https://healthservice.hse.ie/documents/6562/226_V9_Paclitaxel_80.pdf',['bladder'],'Advanced urothelial carcinoma treated with weekly paclitaxel where clinically appropriate.',{}),
'00621':('3','https://healthservice.hse.ie/documents/6688/621_V3_Paclitaxel_80.pdf',['bladder'],'Advanced urothelial carcinoma treated with weekly paclitaxel where clinically appropriate.',{}),
'00455':('15b','https://healthservice.hse.ie/documents/6487/455_v15b_Pembrolizumab_200mg_Monotherapy.pdf',['bladder','renal'],'Urothelial carcinoma or renal-cell carcinoma in an NCCP-listed pembrolizumab indication.',{}),
'00558':('12b','https://healthservice.hse.ie/documents/6389/558_v12b_Pembrolizumab_400mg_monotherapy.pdf',['bladder','renal'],'Urothelial carcinoma or renal-cell carcinoma in an NCCP-listed pembrolizumab indication.',{}),
# Germ-cell
'00300':('7b','https://healthservice.hse.ie/documents/6706/300_V7b_BEP.pdf',['germ_cell'],'Curative treatment of testicular or extragonadal germ-cell tumours where BEP is selected.',{}),
'00453':('3','https://healthservice.hse.ie/documents/6485/453_v3_CarboAUC7Etop750.pdf',['germ_cell'],'High-dose carboplatin and etoposide treatment for relapsed/refractory germ-cell malignancy in a specialist pathway.',{'title':'Carboplatin AUC 7 and Etoposide 750 mg/m² Therapy','cycle':28,'drugs':['carboplatin','etoposide'],'aliases':['Carbo/Etoposide','Vepesid'],'intent':'curative','duration':{'duration_text':'Protocol-defined high-dose cycles in a specialist transplant pathway'},'schedule':'Carboplatin and etoposide on days −5 to −3; repeat only according to the specialist protocol.'}),
'00301':('5','https://healthservice.hse.ie/documents/6707/301_V5_EP.pdf',['germ_cell'],'Curative treatment of good-risk germ-cell tumours where bleomycin is contraindicated or omitted.',{}),
'00602':('1','https://healthservice.hse.ie/documents/6411/602_v1_TIP.pdf',['germ_cell'],'Salvage treatment of relapsed or refractory germ-cell cancer.',{'title':'Paclitaxel, Ifosfamide and Cisplatin (TIP) Therapy','cycle':21,'drugs':['paclitaxel','ifosfamide','cisplatin'],'aliases':['TIP','Taxol','Holoxan','Platinol'],'intent':'curative','duration':{'planned_cycles':4},'schedule':'TIP every 21 days for 4 cycles in the salvage germ-cell pathway.'}),
# Prostate
'00101':('8','https://healthservice.hse.ie/documents/6536/108_cabazitaxel_and_prednisoLONE.pdf',['prostate'],'Metastatic castration-resistant prostate cancer in an NCCP-listed cabazitaxel indication.',{}),
'00103':('9','https://healthservice.hse.ie/documents/6537/103_v9_Abiraterone_and_prednisoLONE_Therapy.pdf',['prostate'],'Advanced prostate cancer in an NCCP-listed abiraterone indication.',{}),
'00203':('7','https://healthservice.hse.ie/documents/6543/203_DOCEtaxel_75-21day.pdf',['prostate'],'Advanced prostate cancer treated with docetaxel 75 mg/m² every 21 days.',{}),
'00233':('7','https://healthservice.hse.ie/documents/6332/233_v7_Enzalutamide_Monotherapy.pdf',['prostate'],'Advanced prostate cancer in an NCCP-listed enzalutamide indication.',{}),
'00257':('8','https://healthservice.hse.ie/documents/6361/257_v8_Radium_223.pdf',['prostate'],'Symptomatic bone-predominant metastatic castration-resistant prostate cancer without known visceral metastases in an NCCP-listed radium-223 indication.',{}),
'00313':('5','https://healthservice.hse.ie/documents/6716/313_v5_Docetaxel_50-14day.pdf',['prostate'],'Advanced prostate cancer treated with docetaxel 50 mg/m² every 14 days.',{}),
'00477':('3','https://healthservice.hse.ie/documents/6978/477_v3_Goserelin_10.8mg.pdf',['prostate'],'Androgen-deprivation therapy for prostate cancer.',{}),
'00478':('3','https://healthservice.hse.ie/documents/6493/478_v3_Goserelin_3.6mg.pdf',['prostate'],'Androgen-deprivation therapy for prostate cancer.',{}),
'00479':('3','https://healthservice.hse.ie/documents/6494/479_v3_Leuprorelin_22.5mg.pdf',['prostate'],'Androgen-deprivation therapy for prostate cancer.',{}),
'00480':('3','https://healthservice.hse.ie/documents/6495/480_v3_Triptorelin_11.25mg.pdf',['prostate'],'Androgen-deprivation therapy for prostate cancer.',{}),
'00481':('3','https://healthservice.hse.ie/documents/6496/481_v3_Degarelix_Therapy.pdf',['prostate'],'Androgen-deprivation therapy for prostate cancer.',{}),
'00482':('3','https://healthservice.hse.ie/documents/6497/482_v3_Bicalutamide.pdf',['prostate'],'Androgen-receptor blockade for prostate cancer.',{}),
'00488':('3','https://healthservice.hse.ie/documents/6502/488_v3_Triptorelin_22.5mg.pdf',['prostate'],'Androgen-deprivation therapy for prostate cancer.',{}),
'00489':('3','https://healthservice.hse.ie/documents/6503/489_v3_Triptorelin_3mg.pdf',['prostate'],'Androgen-deprivation therapy for prostate cancer.',{}),
'00490':('3','https://healthservice.hse.ie/documents/6979/490_v3_Leuprorelin_7.5mg.pdf',['prostate'],'Androgen-deprivation therapy for prostate cancer.',{}),
'00491':('3','https://healthservice.hse.ie/documents/6504/491_v3_Leuprorelin_45mg.pdf',['prostate'],'Androgen-deprivation therapy for prostate cancer.',{}),
'00492':('3','https://healthservice.hse.ie/documents/6505/492_v3_Leuprorelin_11.25mg.pdf',['prostate'],'Androgen-deprivation therapy for prostate cancer.',{}),
'00493':('3','https://healthservice.hse.ie/documents/6506/493_v3_Leuprorelin_30mg.pdf',['prostate'],'Androgen-deprivation therapy for prostate cancer.',{}),
'00494':('3','https://healthservice.hse.ie/documents/6980/494_v3_Leuprorelin_3.75mg.pdf',['prostate'],'Androgen-deprivation therapy for prostate cancer.',{}),
'00546':('3','https://healthservice.hse.ie/documents/6382/546_v3_Docetaxel_75-prednisolone_combination_therapy.pdf',['prostate'],'Metastatic castration-resistant prostate cancer treated with docetaxel and prednisolone.',{}),
'00574':('4','https://healthservice.hse.ie/documents/6392/574_v4_Apalutamide.pdf',['prostate'],'Advanced prostate cancer in an NCCP-listed apalutamide indication.',{}),
'00577':('3','https://healthservice.hse.ie/documents/6393/577_v3_Abiraterone_and_prednisoLONE_Therapy.pdf',['prostate'],'Advanced prostate cancer in an NCCP-listed abiraterone indication.',{}),
'00588':('5b','https://healthservice.hse.ie/documents/6397/588_Olaparib_tablet_monotherapy_FZxXOtF.pdf',['prostate'],'HRR-mutated metastatic castration-resistant prostate cancer in an NCCP-listed olaparib indication.',{}),
'00693':('2','https://healthservice.hse.ie/documents/6533/693_v2_Darolutamide_Therapy.pdf',['prostate'],'Advanced prostate cancer in an NCCP-listed darolutamide indication.',{}),
'00830':('3','https://healthservice.hse.ie/documents/6431/830_v3_Relugolix.pdf',['prostate'],'Androgen-deprivation therapy for advanced prostate cancer.',{}),
'00848':('2','https://healthservice.hse.ie/documents/6448/848_v2_Niraparib_abiraterone.pdf',['prostate'],'BRCA-mutated metastatic castration-resistant prostate cancer in an NCCP-listed niraparib/abiraterone indication.',{}),
# Renal
'00104':('6','https://healthservice.hse.ie/documents/6538/104_Axitinib_Monotherapy.pdf',['renal'],'Advanced renal-cell carcinoma in an NCCP-listed axitinib indication.',{'title':'Axitinib Monotherapy','cycle':28,'drugs':['axitinib'],'aliases':['Inlyta'],'intent':'advanced_disease','duration':{'duration_type':'until_progression_or_toxicity'},'schedule':'Continuous oral axitinib; 28-day assessment cycle convention.'}),
'00592':('3','https://healthservice.hse.ie/documents/6398/592_v3_Atezolizumab_840mg_Monotherapy_14_Day.pdf',['renal'],'Advanced renal-cell carcinoma in an NCCP-listed atezolizumab indication.',{}),
'00212':('6a','https://healthservice.hse.ie/documents/6942/212_V6a_Bevacizumab_10mgkg.pdf',['renal'],'Advanced renal-cell carcinoma treated with bevacizumab in an NCCP-listed indication.',{}),
'00518':('2','https://healthservice.hse.ie/documents/6517/518_v2a_Cabozantinib_.pdf',['renal'],'Advanced renal-cell carcinoma in an NCCP-listed cabozantinib indication.',{'title':'Cabozantinib Monotherapy','cycle':28,'drugs':['cabozantinib'],'aliases':['Cabometyx'],'intent':'advanced_disease','duration':{'duration_type':'until_progression_or_toxicity'},'schedule':'Continuous oral cabozantinib; 28-day assessment cycle convention.'}),
'00320':('6','https://healthservice.hse.ie/documents/6718/320_Everolimus.pdf',['renal'],'Advanced renal-cell carcinoma treated with everolimus in an NCCP-listed indication.',{}),
'00551':('7','https://healthservice.hse.ie/documents/6385/551_Nivolumab_3mgkg_Ipilimumab_1mgk.pdf',['renal'],'First-line advanced renal-cell carcinoma treated with nivolumab and ipilimumab.',{}),
'00445':('3','https://healthservice.hse.ie/documents/6477/445_v3_Pazopanib.pdf',['renal'],'Advanced renal-cell carcinoma in an NCCP-listed pazopanib indication.',{}),
'00583':('3b','https://healthservice.hse.ie/documents/6394/583_v3b_Pembrolizumab_200mg_Axitinib_therapy.pdf',['renal'],'First-line advanced renal-cell carcinoma treated with pembrolizumab and axitinib.',{'title':'Pembrolizumab 200 mg and Axitinib Therapy','cycle':21,'drugs':['pembrolizumab','axitinib'],'aliases':['Keytruda','Inlyta'],'intent':'advanced_disease','duration':{'duration_text':'Pembrolizumab up to the protocol maximum; axitinib until progression or unacceptable toxicity'},'schedule':'Pembrolizumab every 21 days with continuous oral axitinib.'}),
'00294':('4','https://healthservice.hse.ie/documents/6704/294_v4_SORAfenib.pdf',['renal'],'Advanced renal-cell carcinoma in an NCCP-listed sorafenib indication.',{}),
'00325':('6','https://healthservice.hse.ie/documents/6721/325_v6_SUNitinib_50mg_42_days.pdf',['renal'],'Advanced renal-cell carcinoma treated with sunitinib on a 4-weeks-on/2-weeks-off schedule.',{}),
'00719':('2','https://healthservice.hse.ie/documents/6595/719_v2_SUNitinib_50mg21_days.pdf',['renal'],'Advanced renal-cell carcinoma treated with sunitinib on a 2-weeks-on/1-week-off schedule.',{}),
'00326':('4','https://healthservice.hse.ie/documents/6772/326_v4_Temsirolimus.pdf',['renal'],'Advanced renal-cell carcinoma treated with weekly temsirolimus.',{'title':'Temsirolimus Therapy','cycle':28,'drugs':['temsirolimus'],'aliases':['Torisel'],'intent':'advanced_disease','duration':{'duration_type':'until_progression_or_toxicity'},'schedule':'Temsirolimus weekly; four administrations per 28-day assessment cycle.'}),
'00564':('3','https://healthservice.hse.ie/documents/6391/564_v3_Tivozanib.pdf',['renal'],'Advanced renal-cell carcinoma in an NCCP-listed tivozanib indication.',{'title':'Tivozanib Monotherapy','cycle':28,'drugs':['tivozanib'],'aliases':['Fotivda'],'intent':'advanced_disease','duration':{'duration_type':'until_progression_or_toxicity'},'schedule':'Tivozanib once daily on days 1–21 of each 28-day cycle.'}),
}

EXPECTED_CODES = set(D)
assert len(EXPECTED_CODES) == 67, len(EXPECTED_CODES)

AREA_LABEL = {'bladder':'Bladder / urothelial','germ_cell':'Germ-cell','prostate':'Prostate','renal':'Renal'}


def slug(s): return re.sub(r'[^a-z0-9]+','-',s.lower()).strip('-')[:100]
def select(label, options, demo, help_text=None):
    d={'label':label,'type':'select','required':False,'options':[{'value':v,'label':l} for v,l in options],'demo_value':demo}
    if help_text:d['help_text']=help_text
    return d
def num(label,demo,unit='',step=.1,minv=0,maxv=None):
    d={'label':label,'type':'number','required':False,'min':minv,'step':step,'demo_value':demo}
    if unit:d['unit']=unit
    if maxv is not None:d['max']=maxv
    return d
def boolean(label,demo=False,help_text=None):
    d={'label':label,'type':'boolean','required':False,'demo_value':demo}
    if help_text:d['help_text']=help_text
    return d
def grade(label,category='other_nonhaematological',guide='Grade using the applicable CTCAE term, objective findings, intervention required and functional impact.'):
    labels={
      'other_nonhaematological':['No adverse event.','Mild or asymptomatic; observation only.','Moderate; intervention may be indicated and instrumental activities may be limited.','Severe or medically significant; hospital care may be indicated and self-care may be limited.','Life-threatening consequences; urgent intervention required.'],
      'infusion':['No infusion reaction.','Mild transient reaction; interruption not indicated.','Therapy/interruption indicated with prompt response.','Prolonged or recurrent reaction; hospitalisation indicated.','Life-threatening consequences.'],
      'neuropathy':['No neuropathy.','Asymptomatic or mild symptoms.','Moderate symptoms limiting instrumental activities.','Severe symptoms limiting self-care activities.','Life-threatening consequences.'],
      'diarrhoea_or_colitis':['No increase over baseline.','<4 stools/day over baseline.','4–6 stools/day over baseline.','≥7 stools/day, incontinence or hospitalisation.','Life-threatening consequences.'],
      'rash':['No rash.','Mild/localised eruption.','Moderate or more extensive eruption limiting instrumental activities.','Severe/generalised eruption limiting self-care; urgent assessment.','Life-threatening skin reaction.'],
    }.get(category)
    if not labels: labels=['No adverse event.','Grade 1.','Grade 2.','Grade 3.','Grade 4.']
    return {'label':label,'type':'select','required':False,'options':[{'value':i,'label':f'Grade {i}','ctcae_grade':i,'description':x} for i,x in enumerate(labels)],'demo_value':0,'ctcae_version':'5.0','ctcae_category':category,'ctcae_source_url':CTCAE,'assessment_guidance':guide}
def rule(rid,field,op,value,action,message,priority=8,components=None):
    return {'id':rid,'priority':priority,'when':{'field':field,'operator':op,'value':value},'action':{'type':action,'components':components or ['whole_regimen'],'message':message},'source':{'document':'Current official NCCP regimen PDF','page':'Dose modifications / treatment assessment'},'explanation':message}

def base_inputs(cytotoxic=True):
    d={
      'assessment_phase':select('Assessment phase',[('pre_treatment','Pre-treatment'),('on_treatment','On-treatment'),('toxicity_review','Toxicity review')],'pre_treatment'),
      'ecog':select('ECOG performance status',[('0','0'),('1','1'),('2','2'),('3','3'),('4','4')],'1'),
      'alt_ast_uln_multiple':num('ALT / AST actual result (highest ×ULN calculated automatically)',1,'×ULN',.01),
      'bilirubin_uln_multiple':num('Bilirubin actual result (×ULN calculated automatically)',1,'×ULN',.01),
      'non_haematological_toxicity_grade':grade('Other clinically relevant non-haematological toxicity grade'),
      'hypersensitivity_grade':grade('Infusion or hypersensitivity reaction grade','infusion'),
    }
    if cytotoxic:
      d.update({'anc':num('ANC',2,'×10⁹/L',.01),'platelets':num('Platelets',180,'×10⁹/L',1),'haemoglobin':num('Haemoglobin',12,'g/dL',.1),'febrile_neutropenia':boolean('Febrile neutropenia or neutropenic sepsis')})
    return d

def base_rules(cytotoxic=True):
    r=[rule('ECOG_3','ecog','>=','3','consultant_review','ECOG 3–4 requires Consultant review of indication, benefit and treatment tolerance.'),rule('NONHAEM_G3','non_haematological_toxicity_grade','>=',3,'withhold','Grade 3 or worse non-haematological toxicity requires interruption and source-specific review.',9),rule('HSR_G3','hypersensitivity_grade','>=',3,'permanently_discontinue','Grade 3–4 hypersensitivity requires the severe reaction pathway and usually permanent discontinuation.',10)]
    if cytotoxic:r += [rule('ANC_LT1','anc','<',1,'withhold','ANC <1.0 ×10⁹/L: withhold and apply the regimen-specific haematology pathway.',9),rule('PLT_LT75','platelets','<',75,'withhold','Platelets <75 ×10⁹/L: withhold and apply the regimen-specific haematology pathway.',9),rule('FN','febrile_neutropenia','==',True,'withhold_then_reduce','Febrile neutropenia requires acute management, treatment interruption and subsequent dose/G-CSF review.',10)]
    return r

def add_ici(inp,rules):
    inp.update({
      'pneumonitis_grade':grade('Immune-mediated pneumonitis grade'),
      'diarrhoea_colitis_grade':grade('Immune-mediated diarrhoea/colitis grade','diarrhoea_or_colitis'),
      'rash_grade':grade('Immune-mediated rash/dermatitis grade','rash'),
      'creatinine_ratio_baseline_or_uln':num('Creatinine ratio versus baseline or ULN',1,'× baseline/ULN',.01),
      'tsh_miu_l':num('TSH (optional immunotherapy blood)',1.5,'mIU/L',.01),
      'free_t4_pmol_l':num('Free T4 (optional immunotherapy blood)',12,'pmol/L',.1),
      'cortisol_nmol_l':num('Cortisol (optional/symptom-triggered)',350,'nmol/L',1),
      'new_endocrine_or_neurological_symptoms':boolean('New endocrine or neurological symptoms'),
    })
    rules += [rule('ICI_PNEU_G2','pneumonitis_grade','>=',2,'withhold','Grade 2 or worse suspected immune pneumonitis requires withholding and urgent immune-toxicity assessment.',10),rule('ICI_COL_G2','diarrhoea_colitis_grade','>=',2,'withhold','Grade 2 or worse immune diarrhoea/colitis requires withholding and immune-toxicity assessment.',9),rule('ICI_RASH_G3','rash_grade','>=',3,'withhold','Grade 3 or worse immune rash requires withholding and specialist assessment.',9),rule('ICI_RENAL','creatinine_ratio_baseline_or_uln','>=',1.5,'withhold','Creatinine ≥1.5 × baseline/ULN requires assessment for immune nephritis and competing causes.',9),rule('ICI_ENDO','new_endocrine_or_neurological_symptoms','==',True,'consultant_review','New endocrine/neurological symptoms require urgent symptom-directed endocrine assessment; optional endocrine bloods must not block partial assessment.',9)]

def build_new(code, version, source, areas, indication, spec):
    title=spec['title']; drugs=spec['drugs']; low=' '.join(drugs).lower()
    intravesical='intravesical' in low or code=='00807'
    cytotoxic=any(x in low for x in ['cisplatin','carboplatin','gemcitabine','fluorouracil','methotrexate','vinblastine','doxorubicin','etoposide','paclitaxel','docetaxel','ifosfamide','mitomycin']) and not intravesical
    ici=any(x in low for x in ['pembrolizumab','avelumab','atezolizumab','nivolumab','ipilimumab'])
    inp=base_inputs(cytotoxic); rules=base_rules(cytotoxic)
    if intravesical:
      inp.update({'active_uti_or_unexplained_dysuria':boolean('Active UTI or unexplained significant urinary symptoms'),'visible_haematuria':boolean('Visible haematuria'),'traumatic_catheterisation':boolean('Traumatic catheterisation or suspected mucosal injury'),'systemically_unwell_or_fever':boolean('Systemically unwell or fever'),'significant_immunosuppression':boolean('Clinically significant immunosuppression')})
      rules += [rule('INTRA_UTI','active_uti_or_unexplained_dysuria','==',True,'withhold','Withhold intravesical therapy and assess/treat urinary infection or significant urinary symptoms.',10),rule('INTRA_HAEM','visible_haematuria','==',True,'withhold','Visible haematuria requires deferral and urological assessment before intravesical treatment.',9),rule('INTRA_TRAUMA','traumatic_catheterisation','==',True,'withhold','Defer after traumatic catheterisation or suspected mucosal injury to reduce systemic exposure risk.',10),rule('INTRA_FEVER','systemically_unwell_or_fever','==',True,'withhold','Systemic illness or fever requires urgent assessment and intravesical treatment deferral.',10)]
      if code=='00807': rules += [rule('BCG_IMMUNE','significant_immunosuppression','==',True,'contraindicated','Live intravesical BCG is contraindicated or requires specialist exclusion in significant immunosuppression.',10,['BCG'])]
    if 'cisplatin' in low:
      inp.update({'cisplatin_renal_band':select('Renal function for cisplatin',[('ge60','CrCl ≥60 mL/min'),('50_59','CrCl 50–59 mL/min'),('40_49','CrCl 40–49 mL/min'),('lt40','CrCl <40 mL/min'),('dialysis','Haemodialysis')],'ge60'),'magnesium_low_or_unreplaced':boolean('Hypomagnesaemia not corrected / hydration plan incomplete'),'hearing_or_neuropathy_grade':grade('Cisplatin-related hearing or neuropathy grade','neuropathy')})
      rules += [rule('CIS_RENAL_50','cisplatin_renal_band','==','50_59','consultant_review','CrCl 50–59 mL/min requires the regimen-specific cisplatin dose/substitution pathway.',9,['cisplatin']),rule('CIS_RENAL_40','cisplatin_renal_band','==','40_49','withhold','CrCl 40–49 mL/min requires withholding and Consultant review of reduction or alternative treatment.',10,['cisplatin']),rule('CIS_RENAL_LOW','cisplatin_renal_band','in',['lt40','dialysis'],'contraindicated','CrCl <40 mL/min or dialysis triggers the severe renal-impairment pathway; do not administer without specialist direction.',10,['cisplatin']),rule('CIS_MG','magnesium_low_or_unreplaced','==',True,'withhold','Correct electrolytes and confirm hydration before cisplatin.',9,['cisplatin']),rule('CIS_NEURO','hearing_or_neuropathy_grade','>=',2,'consultant_review','Grade 2 or worse hearing/neurological toxicity requires cisplatin dose or substitution review.',9,['cisplatin'])]
    if 'carboplatin' in low:
      inp['gfr_or_crcl_ml_min']=num('Measured GFR or protocol-approved CrCl for carboplatin calculation',80,'mL/min',1)
      inp['gfr_or_crcl_ml_min']['renal_input']={'mode':'exact_continuous','exact_value_required':True,'reason':'Exact GFR/CrCl is required for Calvert carboplatin dosing.'}
      rules += [rule('CARBO_RENAL','gfr_or_crcl_ml_min','<',30,'consultant_review','GFR/CrCl <30 mL/min requires source-specific carboplatin dosing review and an approved renal estimate.',9,['carboplatin'])]
    if any(x in low for x in ['paclitaxel','docetaxel','enfortumab']):
      inp['peripheral_neuropathy_grade']=grade('Peripheral neuropathy grade','neuropathy')
      rules += [rule('NEURO_G2','peripheral_neuropathy_grade','>=',2,'consultant_review','Grade 2 neuropathy requires component-specific dose review.',8),rule('NEURO_G3','peripheral_neuropathy_grade','>=',3,'withhold','Grade 3–4 neuropathy requires withholding and source-specific modification.',10)]
    if ici:add_ici(inp,rules)
    if code in ['00885']:
      inp.update({'serum_phosphate_mmol_l':num('Serum phosphate',1.0,'mmol/L',.01),'new_visual_or_ocular_symptoms':boolean('New visual or ocular symptoms'),'nail_skin_or_mucosal_toxicity_grade':grade('Nail, skin or mucosal toxicity grade','rash')})
      rules += [rule('ERDA_PHOS','serum_phosphate_mmol_l','>',2.9,'withhold','Marked hyperphosphataemia requires interruption and the current erdafitinib phosphate-management pathway.',9,['erdafitinib']),rule('ERDA_EYE','new_visual_or_ocular_symptoms','==',True,'withhold','New visual symptoms require immediate interruption and urgent ophthalmic assessment for central serous retinopathy/RPED.',10,['erdafitinib'])]
    if code in ['00846','00945']:
      inp.update({'blood_glucose_mmol_l':num('Blood glucose',6,'mmol/L',.1),'severe_skin_reaction_or_mucosal_involvement':boolean('Severe skin reaction, blistering or mucosal involvement')})
      rules += [rule('EV_GLU','blood_glucose_mmol_l','>=',13.9,'withhold','Marked hyperglycaemia requires withholding enfortumab vedotin and metabolic assessment.',9,['enfortumab vedotin']),rule('EV_SKIN','severe_skin_reaction_or_mucosal_involvement','==',True,'permanently_discontinue','Suspected severe cutaneous adverse reaction requires urgent assessment and permanent discontinuation according to the source pathway.',10,['enfortumab vedotin'])]
    if any(x in low for x in ['axitinib','cabozantinib','tivozanib']):
      inp.update({'systolic_bp':num('Systolic blood pressure',130,'mmHg',1),'diastolic_bp':num('Diastolic blood pressure',80,'mmHg',1),'diarrhoea_grade':grade('Diarrhoea grade','diarrhoea'),'hand_foot_skin_reaction_grade':grade('Hand-foot skin reaction grade','rash'),'clinically_significant_bleeding_or_thrombosis':boolean('Clinically significant bleeding or thromboembolism'),'major_surgery_or_unhealed_wound':boolean('Recent major surgery or unhealed wound')})
      rules += [rule('TKI_BP_SYS','systolic_bp','>=',160,'withhold','Uncontrolled hypertension requires treatment interruption and blood-pressure management.',9),rule('TKI_BP_DIA','diastolic_bp','>=',100,'withhold','Uncontrolled hypertension requires treatment interruption and blood-pressure management.',9),rule('TKI_DIARR','diarrhoea_grade','>=',3,'withhold','Grade 3–4 diarrhoea requires interruption, supportive care and source-specific dose modification.',9),rule('TKI_HFS','hand_foot_skin_reaction_grade','>=',3,'withhold','Grade 3 hand-foot skin reaction requires interruption and dose modification.',9),rule('TKI_BLEED','clinically_significant_bleeding_or_thrombosis','==',True,'withhold','Clinically significant bleeding or thrombosis requires interruption and urgent risk review.',10),rule('TKI_SURG','major_surgery_or_unhealed_wound','==',True,'withhold','Withhold around major surgery and until wound healing is adequate.',9)]
    if code=='00326':
      inp.update({'active_serious_infection':boolean('Active serious infection'),'pneumonitis_or_new_respiratory_symptoms':boolean('New respiratory symptoms or concern for non-infectious pneumonitis'),'fasting_glucose_mmol_l':num('Fasting glucose',5.5,'mmol/L',.1),'triglycerides_mmol_l':num('Triglycerides',1.5,'mmol/L',.1)})
      rules += [rule('TEM_INF','active_serious_infection','==',True,'withhold','Active serious infection requires withholding temsirolimus and treatment of infection.',10,['temsirolimus']),rule('TEM_LUNG','pneumonitis_or_new_respiratory_symptoms','==',True,'withhold','New respiratory symptoms require interruption and assessment for infection or non-infectious pneumonitis.',9,['temsirolimus'])]
    if 'ifosfamide' in low:
      inp.update({'neurotoxicity_grade':grade('Ifosfamide encephalopathy/neurotoxicity grade'),'haematuria_or_urothelial_toxicity':boolean('Haematuria or concern for urothelial toxicity'),'mesna_and_hydration_confirmed':boolean('Mesna and hydration confirmed',True)})
      rules += [rule('IFO_NEURO','neurotoxicity_grade','>=',2,'withhold','Suspected ifosfamide encephalopathy requires immediate interruption and urgent management.',10,['ifosfamide']),rule('IFO_HAEM','haematuria_or_urothelial_toxicity','==',True,'withhold','Haematuria requires interruption and assessment for urothelial toxicity.',9,['ifosfamide']),rule('IFO_MESNA','mesna_and_hydration_confirmed','==',False,'withhold','Do not administer ifosfamide until mesna and hydration are confirmed.',10,['ifosfamide'])]
    if 'bleomycin' in low:
      inp['new_respiratory_symptoms']=boolean('New cough, dyspnoea, hypoxia or concern for bleomycin pulmonary toxicity')
      rules += [rule('BLEO_LUNG','new_respiratory_symptoms','==',True,'withhold','Withhold bleomycin and urgently assess for pulmonary toxicity.',10,['bleomycin'])]
    risk='minimal';script='nccp-minimal-no-routine-prophylaxis'
    if cytotoxic:
      if 'cisplatin' in low or 'ifosfamide' in low:risk,script='high','nccp-parenteral-high'
      elif 'carboplatin' in low or 'doxorubicin' in low:risk,script='moderate','nccp-parenteral-moderate'
      else:risk,script='low','nccp-parenteral-low'
    if intravesical:risk,script='minimal','nccp-minimal-no-routine-prophylaxis'
    classes=[]
    if cytotoxic:classes.append('cytotoxic_chemotherapy')
    if ici:classes.append('immunotherapy')
    if intravesical:classes.append('intravesical_therapy')
    if any(x in low for x in ['erdafitinib','axitinib','cabozantinib','tivozanib','temsirolimus']):classes.append('oral_targeted_therapy' if code!='00326' else 'targeted_therapy')
    if 'radiotherapy' in low:classes.append('chemoradiation')
    if intravesical:section,label='intravesical_therapy','Intravesical therapy'
    elif 'radiotherapy' in low:section,label='chemoradiation','Chemoradiation'
    elif ici and cytotoxic:section,label='immunotherapy_combination','Immunotherapy combinations'
    elif ici:section,label='immunotherapy','Immunotherapy'
    elif cytotoxic:section,label='chemotherapy_combination_sact','Chemotherapy & combination SACT'
    else:section,label='targeted_her2_therapy','Targeted therapy'
    fname=f'{code}-{slug(title)}.json'
    area_context=[f'genitourinary_{a}' for a in areas]
    card={'contexts':[{'id':f'{code}-gu','intent':spec.get('intent','advanced_disease'),'cycle_length_days':spec['cycle'],**spec.get('duration',{}),'provenance':'official_nccp_source_reconciled'}], 'provenance':{'source':'NCCP regimen PDF','reviewed':False}}
    p={
      'schema_version':'2.0.0','protocol_id':f'nccp-{code}-v{version}','file_name':fname,'status':'encoded_prototype_pending_clinical_and_pharmacy_validation',
      'metadata':{'nccp_regimen_code':code,'nccp_version':version,'tumour_group':'Genitourinary','tumour_groups':['Genitourinary'],'title':title,'short_title':title,'indication':indication,'source_url':source,'source_document_pages':None,'sactcheck_encoding_version':VERSION,'source_checked_date':CHECKED,'partial_assessment_supported':True,'partial_assessment_note':'Any independently actionable entered value is assessed; omitted domains remain unassessed and do not block a partial result.','genitourinary_subgroups':areas,'treatment_context':['genitourinary',*area_context],'treatment_class':classes or ['systemic_anticancer_therapy'],'cytotoxic':cytotoxic,'catalogue_section':section,'catalogue_section_label':label,'catalog':{'enabled':True},'drugs':drugs,'common_trade_names':spec.get('aliases') or [title.split()[0]],'regimen_card':card,'migration':{'mode':'live_json'},'validation':{'official_catalogue_and_source_link_checked':True,'rule_level_source_reconciliation_status':'pending_independent_clinical_and_oncology_pharmacy_validation','software_tests_completed':True,'consultant_reviewed':False,'oncology_pharmacy_reviewed':False,'clinical_use_authorised':False}},
      'clinical_governance':{'prescriptive_authority':'Treatment plan must be initiated by a Consultant Medical Oncologist or the specialist authority specified in the current NCCP source.','dose_modification_note':'Use the most restrictive applicable component rule and confirm all dose changes against the current official NCCP PDF.','disclaimer':f'Decision-support encoding derived from NCCP {code} Version {version}. It does not replace the current official regimen, prescribing review, pharmacy verification or independent clinical judgement.'},
      'indications':[{'indication_id':f'{code}-gu','code':f'{code}a','description':indication}],
      'treatment':{'cycle_length_days':spec['cycle'],'schedule_summary':spec['schedule'],'drugs':drugs,**spec.get('duration',{})},
      'input_definitions':inp,'required_inputs':[],
      'output_templates':{'proceed':'No encoded restriction was triggered in the entered domain(s). This is not an overall treatment clearance.','coverage_gap':'Only entered values were assessed; omitted clinically relevant domains remain unassessed.','consultant_review':'The entered value requires protocol-specific Consultant/pharmacy review.','withhold':'Withhold treatment and reassess according to the official NCCP pathway.','withhold_then_reduce':'Withhold, manage the event and apply the source-specific subsequent dose pathway.','dose_reduce':'Apply the encoded dose-reduction pathway and confirm against the official source.','contraindicated':'The entered value triggers an encoded contraindication/exclusion.','permanently_discontinue':'The entered value triggers permanent discontinuation in the encoded pathway.'},
      'rule_engine':{'conflict_policy':'most_restrictive_action_wins','missing_data_policy':'report_unassessed_coverage_gap','actions_ranked_most_to_least_restrictive':['permanently_discontinue','contraindicated','discontinue','cease','omit','withhold_then_reduce','withhold','delay_then_dose_reduce','delay','consultant_review','dose_reduce','proceed_with_caution','proceed'],'rules':rules},
      'eligibility':['Indication as listed in the current official NCCP regimen','Performance status and disease-specific eligibility appropriate to the selected indication','Organ function appropriate for the selected regimen'],
      'exclusions':['Known hypersensitivity to a regimen component','Pregnancy or breastfeeding where prohibited by the current source','Regimen-specific exclusions encoded in the assessment'],
      'supportive_care':{'emetogenic_risk':risk,'script_id':script,'mapping_basis':'Highest emetogenic active component and phase-specific NCCP classification.','mapping_confidence':'source_reconciled_pending_pharmacy_validation','mapping_source_url':ANTI}
    }
    return p

def all_protocol_files():
    for f in ROOT.glob('protocols/**/*.json'):
      rel=f.relative_to(ROOT).as_posix()
      if f.name in ['index.json','protocol-schema.json','package.json'] or rel.startswith('protocols/protocols/') or '/_template/' in rel or '/_shared/' in rel: continue
      yield f

def find_existing(code):
    found=[]
    for f in all_protocol_files():
      try:d=json.loads(f.read_text(encoding='utf-8'))
      except:continue
      if str(d.get('metadata',{}).get('nccp_regimen_code','')).zfill(5)==code:found.append((f,d))
    if len(found)>1: raise RuntimeError(f'Duplicate canonical files for NCCP {code}: {[str(x[0]) for x in found]}')
    return found[0] if found else (None,None)

def intent_for_existing(d, areas):
    text=' '.join([str(d.get('metadata',{}).get('indication','')),str(d.get('metadata',{}).get('title','')),str(d.get('treatment',{}).get('schedule_summary',''))]).lower()
    if 'neoadjuvant' in text:return 'neoadjuvant'
    if 'adjuvant' in text:return 'adjuvant'
    if 'maintenance' in text:return 'maintenance'
    if 'curative' in text:return 'curative'
    if any(x in text for x in ['advanced','metastatic','recurrent']):return 'advanced_disease'
    if 'prostate' in areas and any(x in text for x in ['goserelin','leuprorelin','triptorelin','degarelix','bicalutamide','relugolix']):return 'advanced_disease'
    return 'advanced_disease'

def reconcile(f,d,code,version,source,areas,indication,spec):
    m=d.setdefault('metadata',{}); primary=m.get('tumour_group')
    groups=list(m.get('tumour_groups') or ([] if not primary else [primary]))
    if primary and primary not in groups:groups.insert(0,primary)
    if 'Genitourinary' not in groups:groups.append('Genitourinary')
    if not primary:m['tumour_group']=groups[0]
    m['tumour_groups']=groups;m['genitourinary_subgroups']=areas;m['sactcheck_encoding_version']=VERSION;m['partial_assessment_supported']=True;m['source_checked_date']=CHECKED;m['source_url']=source;m['nccp_version']=version
    tc=list(m.get('treatment_context') or [])
    for x in ['genitourinary',*[f'genitourinary_{a}' for a in areas]]:
      if x not in tc:tc.append(x)
    m['treatment_context']=tc
    validation=m.setdefault('validation',{});validation['official_catalogue_and_source_link_checked']=True;validation['rule_level_source_reconciliation_status']='pending_independent_clinical_and_oncology_pharmacy_validation';validation['clinical_use_authorised']=False
    inds=d.get('indications') if isinstance(d.get('indications'),list) else []
    if not any(isinstance(x,dict) and x.get('indication_id')==f'{code}-gu' for x in inds):inds.append({'indication_id':f'{code}-gu','code':f'{code}g','description':indication})
    d['indications']=inds;d['required_inputs']=[];d['status']='encoded_prototype_pending_clinical_and_pharmacy_validation'
    for x in (d.get('input_definitions') or {}).values():
      if isinstance(x,dict):x['required']=False
    # Canonical GU card context; do not overwrite any existing non-GU reviewed contexts.
    treatment=d.get('treatment') if isinstance(d.get('treatment'),dict) else {}
    cycle=treatment.get('cycle_length_days') or treatment.get('cycle_days')
    if not cycle:
      title=(m.get('title') or '').lower()
      mm=re.search(r'(14|21|28|42)[- ]?day',title); cycle=int(mm.group(1)) if mm else 28
    duration={}
    combined=' '.join([str(m.get('indication','')),str(treatment.get('schedule_summary','')),str(treatment.get('duration',''))]).lower()
    if 'until progression' in combined or any(x in ' '.join(m.get('drugs') or []).lower() for x in ['abiraterone','enzalutamide','apalutamide','darolutamide','olaparib','niraparib','everolimus','pazopanib','sorafenib','sunitinib']):duration={'duration_type':'until_progression_or_toxicity'}
    elif code=='00257':duration={'planned_cycles':6}
    else:duration={'unresolved':['duration']}
    existing_card=m.get('regimen_card') if isinstance(m.get('regimen_card'),dict) else {}
    contexts=list(existing_card.get('contexts') or [])
    contexts=[c for c in contexts if not (isinstance(c,dict) and c.get('id')==f'{code}-gu')]
    contexts.append({'id':f'{code}-gu','indication_id':f'{code}-gu','intent':intent_for_existing(d,areas),'cycle_length_days':cycle,**duration,'provenance':'official_nccp_catalogue_reconciled'})
    m['regimen_card']={**existing_card,'contexts':contexts,'provenance':{**(existing_card.get('provenance') or {}),'source':'NCCP regimen PDF / GU catalogue','reviewed':False}}
    d.setdefault('clinical_governance',{})['disclaimer']=f'Decision-support encoding includes NCCP {code} Version {version}. It does not replace the current official regimen, prescribing review, pharmacy verification or independent clinical judgement.'
    d.setdefault('supportive_care',{}).setdefault('mapping_source_url',ANTI)
    f.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

new=[];reconciled=[]
for code,(version,source,areas,indication,spec) in sorted(D.items()):
    f,d=find_existing(code)
    if f and spec and f.parent.resolve()==OUT.resolve():
      # Idempotent regeneration of protocols introduced by this release preserves
      # their source-reconciled schedule, duration and regimen-card metadata.
      p=build_new(code,version,source,areas,indication,spec)
      f.write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');new.append(code)
    elif f:
      reconcile(f,d,code,version,source,areas,indication,spec);reconciled.append(code)
    else:
      if not spec:raise RuntimeError(f'Missing new-protocol specification for {code}')
      p=build_new(code,version,source,areas,indication,spec)
      (OUT/p['file_name']).write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');new.append(code)

print(f'Built complete GU catalogue: {len(new)} new, {len(reconciled)} reconciled, {len(D)} unique codes.')
print('New:',','.join(new))
