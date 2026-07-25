#!/usr/bin/env python3
from __future__ import annotations
import json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'protocols' / 'skin'
OUT.mkdir(parents=True, exist_ok=True)
VERSION = '0.45.0'
CHECKED = '2026-07-25'
CATALOGUE = 'https://healthservice.hse.ie/staff/information-healthcare-workers/nccp/skin-melanoma-sact-regimens/'
ANTI = 'https://healthservice.hse.ie/documents/7152/Classification_Document_for_Systemic_Anti-_Cancer_Therapy_SACT_Induced_Nausea__pWgDCrm.pdf'
CTCAE = 'https://dctd.cancer.gov/research/ctep-trials/for-sites/adverse-events/ctcae-v5-5x7.pdf'

# Current NCCP Skin/Melanoma catalogue snapshot checked 25 July 2026.
# Nine codes are absent and created here; seven existing canonical files are reconciled in place.
D = {
 '00535': {'version':'6b','source':'https://healthservice.hse.ie/documents/6638/535_v6b_Avelumab.pdf','subgroups':['merkel_cell'],'title':'Avelumab Monotherapy','indications':[('00535a','Metastatic Merkel cell carcinoma after at least one line of chemotherapy for metastatic disease.')],'cycle':14,'schedule':'Avelumab every 14 days until disease progression or unacceptable toxicity.','drugs':['avelumab'],'aliases':['Bavencio'],'contexts':[{'id':'00535-skin-merkel','indication_id':'00535a','intent':'advanced_disease','cycle_length_days':14,'duration_type':'until_progression_or_toxicity'}]},
 '00812': {'version':'3a','source':'https://healthservice.hse.ie/documents/6426/812_V3a_Cemiplimab.pdf','subgroups':['cutaneous_squamous_cell'],'title':'Cemiplimab Therapy','indications':[('00812b','Metastatic or locally advanced cutaneous squamous-cell carcinoma in a patient who is not a candidate for curative surgery or curative radiation.')],'cycle':21,'schedule':'Cemiplimab 350 mg on day 1 every 21 days until disease progression or unacceptable toxicity.','drugs':['cemiplimab'],'aliases':['Libtayo'],'contexts':[{'id':'00812-skin-cscc','indication_id':'00812b','intent':'advanced_disease','cycle_length_days':21,'duration_type':'until_progression_or_toxicity'}]},
 '00373': {'new':True,'version':'3','source':'https://healthservice.hse.ie/documents/6728/373_V3_Cobimetinib_and_Vemurafenib.pdf','subgroups':['melanoma'],'title':'Cobimetinib and Vemurafenib Therapy','indications':[('00373a','Adult patients with unresectable or metastatic melanoma with a confirmed BRAF V600 mutation.')],'cycle':28,'schedule':'Cobimetinib once daily on days 1–21 followed by a 7-day break; vemurafenib twice daily continuously. Repeat every 28 days until progression or unacceptable toxicity.','drugs':['cobimetinib','vemurafenib'],'aliases':['Cotellic','Zelboraf'],'contexts':[{'id':'00373-skin','indication_id':'00373a','intent':'advanced_disease','cycle_length_days':28,'duration_type':'until_progression_or_toxicity'}],'profile':'braf_meK_cobi_vem'},
 '00237': {'new':True,'version':'6','source':'https://healthservice.hse.ie/documents/6726/237_Dabrafenib.pdf','subgroups':['melanoma'],'title':'Dabrafenib Monotherapy','indications':[('00237a','Adult patients with unresectable or metastatic melanoma with a confirmed BRAF V600 mutation.')],'cycle':28,'schedule':'Dabrafenib 150 mg twice daily continuously; use a 28-day assessment-cycle convention. Continue until progression or unacceptable toxicity.','drugs':['dabrafenib'],'aliases':['Tafinlar'],'contexts':[{'id':'00237-skin','indication_id':'00237a','intent':'advanced_disease','cycle_length_days':28,'duration_type':'until_progression_or_toxicity'}],'profile':'braf_dabrafenib'},
 '00464': {'new':True,'version':'3','source':'https://healthservice.hse.ie/documents/6737/464_V3_Dacarbazine.pdf','subgroups':['melanoma'],'title':'Dacarbazine Therapy','indications':[('00464a','Treatment of metastatic malignant melanoma.')],'cycle':21,'schedule':'Dacarbazine 850 mg/m² IV on day 1 every 21 days for 6 cycles or until progression or unacceptable toxicity, whichever occurs first.','drugs':['dacarbazine'],'aliases':['DTIC'],'contexts':[{'id':'00464-skin','indication_id':'00464a','intent':'advanced_disease','cycle_length_days':21,'planned_cycles':6,'duration_text':'6 cycles or until progression/toxicity, whichever occurs first'}],'profile':'dacarbazine'},
 '00563': {'new':True,'version':'3','source':'https://healthservice.hse.ie/documents/6744/563_V3_Encorafenib-and-Binimetinib_Therapy.pdf','subgroups':['melanoma'],'title':'Encorafenib and Binimetinib Therapy','indications':[('00563a','Adult patients with unresectable or metastatic melanoma with a confirmed BRAF V600 mutation.')],'cycle':28,'schedule':'Encorafenib 450 mg once daily plus binimetinib 45 mg twice daily continuously; use a 28-day assessment-cycle convention. Continue until progression or unacceptable toxicity.','drugs':['encorafenib','binimetinib'],'aliases':['Braftovi','Mektovi'],'contexts':[{'id':'00563-skin','indication_id':'00563a','intent':'advanced_disease','cycle_length_days':28,'duration_type':'until_progression_or_toxicity'}],'profile':'braf_mek_enc_bini'},
 '00105': {'new':True,'version':'7','source':'https://healthservice.hse.ie/documents/6724/105_V7_Ipilimumab_.pdf','subgroups':['melanoma'],'title':'Ipilimumab Monotherapy','indications':[('00105a','Treatment of advanced melanoma in adults.')],'cycle':21,'schedule':'Ipilimumab 3 mg/kg every 21 days for a total of 4 doses, or until progression or unacceptable toxicity occurs first.','drugs':['ipilimumab'],'aliases':['Yervoy'],'contexts':[{'id':'00105-skin','indication_id':'00105a','intent':'advanced_disease','cycle_length_days':21,'planned_cycles':4,'duration_text':'Maximum 4 doses'}],'profile':'ici'},
 '00483': {'version':'13a','source':'https://healthservice.hse.ie/documents/6498/483_Nivolumab_14-day_.pdf','subgroups':['melanoma'],'title':'Nivolumab Monotherapy – 14 day','indications':[('00483a-skin','Advanced (unresectable or metastatic) melanoma.'),('00483f-skin','Adjuvant treatment of melanoma following complete resection in an NCCP-listed high-risk indication.')],'cycle':14,'schedule':'Nivolumab every 14 days. Advanced disease continues until progression/toxicity; adjuvant treatment is given for up to 12 months.','drugs':['nivolumab'],'aliases':['Opdivo'],'contexts':[{'id':'00483-skin-advanced','indication_id':'00483a-skin','intent':'advanced_disease','cycle_length_days':14,'duration_type':'until_progression_or_toxicity'},{'id':'00483-skin-adjuvant','indication_id':'00483f-skin','intent':'adjuvant','cycle_length_days':14,'duration_type':'fixed_time','duration_text':'Up to 12 months'}]},
 '00484': {'version':'13a','source':'https://healthservice.hse.ie/documents/6499/484_Nivolumab_28-day_.pdf','subgroups':['melanoma'],'title':'Nivolumab Monotherapy – 28 day','indications':[('00484a-skin','Advanced (unresectable or metastatic) melanoma.'),('00484c-skin','Adjuvant treatment of melanoma following complete resection in an NCCP-listed high-risk indication.')],'cycle':28,'schedule':'Nivolumab every 28 days. Advanced disease continues until progression/toxicity; adjuvant treatment is given for up to 12 months.','drugs':['nivolumab'],'aliases':['Opdivo'],'contexts':[{'id':'00484-skin-advanced','indication_id':'00484a-skin','intent':'advanced_disease','cycle_length_days':28,'duration_type':'until_progression_or_toxicity'},{'id':'00484-skin-adjuvant','indication_id':'00484c-skin','intent':'adjuvant','cycle_length_days':28,'duration_type':'fixed_time','duration_text':'Up to 12 months'}]},
 '00431': {'new':True,'version':'10','source':'https://healthservice.hse.ie/documents/6734/431_Nivolumab_1mg_Ipilimumab_3mg.pdf','subgroups':['melanoma'],'title':'Nivolumab 1 mg/kg and Ipilimumab 3 mg/kg Therapy','indications':[('00431a','Treatment of advanced melanoma in adults.')],'cycle':21,'schedule':'Cycles 1–4: nivolumab 1 mg/kg plus ipilimumab 3 mg/kg every 21 days. From cycle 5: nivolumab monotherapy every 14 or 28 days until progression or unacceptable toxicity.','drugs':['nivolumab','ipilimumab'],'aliases':['Opdivo','Yervoy'],'contexts':[{'id':'00431-skin','indication_id':'00431a','intent':'advanced_disease','cycle_length_days':21,'duration_type':'phased_course','duration_text':'4 combination cycles, then nivolumab maintenance q14d or q28d until progression/toxicity'}],'profile':'ici_combo'},
 '00551': {'version':'7','source':'https://healthservice.hse.ie/documents/6385/551_Nivolumab_3mgkg_Ipilimumab_1mgk.pdf','subgroups':['melanoma'],'title':'Nivolumab 3 mg/kg with Ipilimumab 1 mg/kg Therapy','indications':[('00551b-skin','Treatment of advanced melanoma in adults in an NCCP-listed indication.')],'cycle':21,'schedule':'Four combination cycles every 21 days followed by nivolumab monotherapy every 14 or 28 days until progression or unacceptable toxicity.','drugs':['nivolumab','ipilimumab'],'aliases':['Opdivo','Yervoy'],'contexts':[{'id':'00551-skin','indication_id':'00551b-skin','intent':'advanced_disease','cycle_length_days':21,'duration_type':'phased_course','duration_text':'4 combination cycles, then nivolumab maintenance q14d or q28d until progression/toxicity'}]},
 '00455': {'version':'15b','source':'https://healthservice.hse.ie/documents/6903/455_V15b__Pembrolizumab_200mg_Monotherapy.pdf','subgroups':['melanoma'],'title':'Pembrolizumab 200 mg Monotherapy','indications':[('00455b-skin','Advanced melanoma in adults.'),('00455c-skin','Advanced melanoma following prior ipilimumab in an NCCP-listed indication.'),('00455g-skin','Adjuvant treatment of completely resected high-risk melanoma.'),('00455l-skin','Adjuvant treatment of completely resected stage IIB or IIC melanoma.')],'cycle':21,'schedule':'Pembrolizumab 200 mg every 21 days. Advanced disease continues until progression/toxicity; adjuvant treatment is given for a maximum of 12 months. Selected stage IIIB pathways may include 3 neoadjuvant and 15 postoperative cycles.','drugs':['pembrolizumab'],'aliases':['Keytruda'],'contexts':[{'id':'00455-skin-advanced','indication_id':'00455b-skin','intent':'advanced_disease','cycle_length_days':21,'duration_type':'until_progression_or_toxicity'},{'id':'00455-skin-adjuvant','indication_id':'00455g-skin','intent':'adjuvant','cycle_length_days':21,'duration_type':'fixed_time','duration_text':'Maximum 12 months'},{'id':'00455-skin-perioperative','indication_id':'00455l-skin','intent':'perioperative','cycle_length_days':21,'duration_type':'phased_course','duration_text':'Where selected: 3 neoadjuvant cycles then 15 postoperative cycles'}]},
 '00558': {'version':'12b','source':'https://healthservice.hse.ie/documents/6389/558_v12b_Pembrolizumab_400mg_monotherapy.pdf','subgroups':['melanoma'],'title':'Pembrolizumab 400 mg Monotherapy','indications':[('00558b-skin','Advanced melanoma in adults.'),('00558c-skin','Advanced melanoma following prior ipilimumab in an NCCP-listed indication.'),('00558g-skin','Adjuvant treatment of completely resected high-risk melanoma.'),('00558l-skin','Adjuvant treatment of completely resected stage IIB or IIC melanoma.')],'cycle':42,'schedule':'Pembrolizumab 400 mg every 42 days. Advanced disease continues until progression/toxicity; adjuvant treatment is given for a maximum of 12 months.','drugs':['pembrolizumab'],'aliases':['Keytruda'],'contexts':[{'id':'00558-skin-advanced','indication_id':'00558b-skin','intent':'advanced_disease','cycle_length_days':42,'duration_type':'until_progression_or_toxicity'},{'id':'00558-skin-adjuvant','indication_id':'00558g-skin','intent':'adjuvant','cycle_length_days':42,'duration_type':'fixed_time','duration_text':'Maximum 12 months'}]},
 '00415': {'new':True,'version':'4','source':'https://healthservice.hse.ie/documents/6732/415_v4_Trametinib_and_DabrafenibTherapy.pdf','subgroups':['melanoma'],'title':'Trametinib and Dabrafenib Therapy','indications':[('00415a','Adult patients with unresectable or metastatic melanoma with a confirmed BRAF V600 mutation.'),('00415b','Adjuvant treatment following complete resection of stage III BRAF V600-mutated melanoma.')],'cycle':28,'schedule':'Dabrafenib twice daily plus trametinib once daily continuously; use a 28-day assessment-cycle convention. Advanced disease continues until progression/toxicity; adjuvant treatment is planned for 12 months unless recurrence/toxicity occurs.','drugs':['trametinib','dabrafenib'],'aliases':['Mekinist','Tafinlar'],'contexts':[{'id':'00415-skin-advanced','indication_id':'00415a','intent':'advanced_disease','cycle_length_days':28,'duration_type':'until_progression_or_toxicity'},{'id':'00415-skin-adjuvant','indication_id':'00415b','intent':'adjuvant','cycle_length_days':28,'duration_type':'fixed_time','duration_text':'12 months'}],'profile':'braf_mek_dab_tram'},
 '00102': {'new':True,'version':'6','source':'https://healthservice.hse.ie/documents/6723/102_v6_Vemurafenib_Monotherapy.pdf','subgroups':['melanoma'],'title':'Vemurafenib Monotherapy','indications':[('00102a','Adult patients with unresectable or metastatic melanoma with a confirmed BRAF V600 mutation.')],'cycle':28,'schedule':'Vemurafenib 960 mg twice daily continuously; use a 28-day assessment-cycle convention. Continue until progression or unacceptable toxicity.','drugs':['vemurafenib'],'aliases':['Zelboraf'],'contexts':[{'id':'00102-skin','indication_id':'00102a','intent':'advanced_disease','cycle_length_days':28,'duration_type':'until_progression_or_toxicity'}],'profile':'braf_vemurafenib'},
 '00236': {'new':True,'version':'3','source':'https://healthservice.hse.ie/documents/6725/236_v3_Vismodegib.pdf','subgroups':['basal_cell'],'title':'Vismodegib Monotherapy','indications':[('00236a','Metastatic basal-cell carcinoma.'),('00236b','Locally advanced basal-cell carcinoma not suitable for surgery or radiotherapy.')],'cycle':28,'schedule':'Vismodegib 150 mg once daily continuously; use a 28-day assessment-cycle convention. Continue until progression or unacceptable toxicity.','drugs':['vismodegib'],'aliases':['Erivedge'],'contexts':[{'id':'00236-skin','indication_id':'00236a','intent':'advanced_disease','cycle_length_days':28,'duration_type':'until_progression_or_toxicity'}],'profile':'vismodegib'}
}
EXPECTED=set(D)
assert len(EXPECTED)==16


def slug(s): return re.sub(r'[^a-z0-9]+','-',s.lower()).strip('-')[:110]
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
def grade(label, category='other_nonhaematological'):
 descriptions={
  'other_nonhaematological':['No adverse event.','Mild; observation only.','Moderate; intervention indicated or instrumental activities limited.','Severe or medically significant; hospital care may be indicated.','Life-threatening consequences; urgent intervention required.'],
  'infusion':['No infusion reaction.','Mild transient reaction.','Interruption or symptomatic treatment indicated with prompt response.','Prolonged/recurrent reaction or hospitalisation indicated.','Life-threatening consequences.'],
  'diarrhoea_or_colitis':['No increase over baseline.','<4 stools/day over baseline.','4–6 stools/day over baseline.','≥7 stools/day, incontinence or hospitalisation.','Life-threatening consequences.'],
  'rash':['No rash.','Mild/localised eruption.','Moderate or extensive eruption limiting instrumental activities.','Severe/generalised eruption limiting self-care.','Life-threatening skin reaction.'],
 }.get(category,['No adverse event.','Grade 1.','Grade 2.','Grade 3.','Grade 4.'])
 return {'label':label,'type':'select','required':False,'options':[{'value':i,'label':f'Grade {i}','ctcae_grade':i,'description':x} for i,x in enumerate(descriptions)],'demo_value':0,'ctcae_version':'5.0','ctcae_category':category,'ctcae_source_url':CTCAE,'assessment_guidance':'Grade using objective findings, intervention required and functional impact; confirm against the current CTCAE and regimen source.'}
def rule(rid,field,op,value,action,message,priority=8,components=None,page='Dose modifications / assessment'):
 return {'id':rid,'priority':priority,'when':{'field':field,'operator':op,'value':value},'action':{'type':action,'components':components or ['whole_regimen'],'message':message},'source':{'document':'Current official NCCP regimen PDF','page':page},'explanation':message}

def common_inputs():
 return {
  'assessment_phase':select('Assessment phase',[('pre_treatment','Pre-treatment'),('on_treatment','On-treatment'),('toxicity_review','Toxicity review')],'pre_treatment'),
  'ecog':select('ECOG performance status',[('0','0'),('1','1'),('2','2'),('3','3'),('4','4')],'1'),
  'pregnancy':boolean('Pregnancy'),
  'breastfeeding':boolean('Breastfeeding'),
  'alt_ast_uln_multiple':num('ALT / AST actual result (highest ×ULN calculated automatically)',1,'×ULN',.01),
  'bilirubin_uln_multiple':num('Bilirubin actual result (×ULN calculated automatically)',1,'×ULN',.01),
  'non_haematological_toxicity_grade':grade('Other clinically relevant non-haematological toxicity grade'),
  'hypersensitivity_grade':grade('Infusion or hypersensitivity reaction grade','infusion'),
 }
def common_rules():
 return [
  rule('ECOG_3','ecog','>=','3','consultant_review','ECOG 3–4 requires Consultant review of indication, expected benefit and treatment tolerance.',8),
  rule('PREGNANCY','pregnancy','==',True,'contraindicated','Pregnancy triggers the regimen-specific contraindication or urgent specialist pregnancy-exposure pathway.',10),
  rule('BREASTFEEDING','breastfeeding','==',True,'contraindicated','Breastfeeding is not compatible with this regimen unless the current source explicitly directs otherwise.',10),
  rule('NONHAEM_G3','non_haematological_toxicity_grade','>=',3,'withhold','Grade 3 or worse non-haematological toxicity requires treatment interruption and source-specific review.',9),
  rule('HSR_G3','hypersensitivity_grade','>=',3,'permanently_discontinue','Grade 3–4 hypersensitivity requires the severe reaction pathway and usually permanent discontinuation.',10),
 ]
def add_ici(inp,rules):
 inp.update({
  'pneumonitis_grade':grade('Immune-mediated pneumonitis grade'),
  'diarrhoea_colitis_grade':grade('Immune-mediated diarrhoea/colitis grade','diarrhoea_or_colitis'),
  'rash_grade':grade('Immune-mediated rash/dermatitis grade','rash'),
  'creatinine_ratio_baseline_or_uln':num('Creatinine ratio versus baseline or ULN',1,'× baseline/ULN',.01),
  'myocarditis_or_neurological_red_flags':boolean('Possible myocarditis or severe neurological immune-toxicity red flags'),
  'new_endocrine_symptoms':boolean('New endocrine symptoms'),
  'tsh_miu_l':num('TSH (optional immunotherapy blood)',1.5,'mIU/L',.01),
  'free_t4_pmol_l':num('Free T4 (optional immunotherapy blood)',12,'pmol/L',.1),
  'cortisol_nmol_l':num('Cortisol (optional/symptom-triggered)',350,'nmol/L',1),
 })
 rules += [
  rule('ICI_PNEU_G2','pneumonitis_grade','>=',2,'withhold','Grade 2 or worse suspected immune pneumonitis requires withholding and urgent immune-toxicity assessment.',10),
  rule('ICI_COL_G2','diarrhoea_colitis_grade','>=',2,'withhold','Grade 2 or worse immune diarrhoea/colitis requires withholding and immune-toxicity assessment.',9),
  rule('ICI_RASH_G3','rash_grade','>=',3,'withhold','Grade 3 or worse immune rash requires withholding and specialist assessment.',9),
  rule('ICI_RENAL','creatinine_ratio_baseline_or_uln','>=',1.5,'withhold','Creatinine ≥1.5 × baseline/ULN requires assessment for immune nephritis and competing causes.',9),
  rule('ICI_CARDIONEURO','myocarditis_or_neurological_red_flags','==',True,'withhold','Possible myocarditis or severe neurological immune toxicity requires immediate withholding and urgent specialist assessment.',10),
  rule('ICI_ENDO','new_endocrine_symptoms','==',True,'consultant_review','New endocrine symptoms require urgent symptom-directed assessment; optional endocrine bloods must not block partial assessment.',9),
 ]
def add_braf_mek(inp,rules,profile):
 inp.update({
  'braf_v600_confirmed':boolean('BRAF V600 mutation confirmed by a validated test',True),
  'temperature_c':num('Temperature',36.8,'°C',.1,30,45),
  'qtc_ms':num('QTc interval',430,'ms',1,0,800),
  'lvef_percent':num('LVEF',60,'%',1,0,100),
  'uncontrolled_hypertension':boolean('Uncontrolled hypertension'),
  'electrolyte_abnormality_uncorrected':boolean('Clinically significant uncorrected electrolyte abnormality'),
  'new_visual_or_ocular_symptoms':boolean('New visual disturbance or ocular symptoms'),
  'ck_uln_multiple':num('Creatine kinase',1,'×ULN',.1,0),
  'new_respiratory_symptoms_or_ild':boolean('New respiratory symptoms or suspected ILD/pneumonitis'),
  'severe_haemorrhage':boolean('Severe or clinically significant haemorrhage'),
  'new_suspicious_skin_lesion':boolean('New suspicious skin lesion or possible secondary malignancy'),
 })
 rules += [
  rule('BRAF_REQUIRED','braf_v600_confirmed','==',False,'contraindicated','A confirmed BRAF V600 mutation is required for this BRAF-targeted regimen.',10),
  rule('QT_OVER500','qtc_ms','>',500,'withhold','QTc >500 ms requires treatment interruption and correction of reversible causes before source-specific rechallenge.',10),
  rule('LVEF_LOW','lvef_percent','<=',50,'withhold','LVEF ≤50% or a clinically meaningful decline requires interruption and cardiac/source-specific review.',9),
  rule('HTN_UNCONTROLLED','uncontrolled_hypertension','==',True,'withhold','Control hypertension before treatment or continuation.',9),
  rule('ELECTROLYTES','electrolyte_abnormality_uncorrected','==',True,'withhold','Correct clinically significant electrolyte abnormalities before QT-active therapy.',9),
  rule('OCULAR','new_visual_or_ocular_symptoms','==',True,'withhold','New ocular symptoms require treatment interruption and urgent ophthalmic assessment.',10),
  rule('CK_HIGH','ck_uln_multiple','>=',5,'withhold','CK ≥5 ×ULN requires interruption and assessment for myopathy/rhabdomyolysis.',9),
  rule('ILD','new_respiratory_symptoms_or_ild','==',True,'withhold','New respiratory symptoms or suspected ILD/pneumonitis require interruption and urgent assessment.',10),
  rule('HAEMORRHAGE','severe_haemorrhage','==',True,'withhold','Clinically significant haemorrhage requires interruption and specialist review.',10),
  rule('SKIN_LESION','new_suspicious_skin_lesion','==',True,'consultant_review','A new suspicious skin lesion requires prompt dermatological evaluation; treatment disposition follows the source-specific pathway.',8),
 ]
 if profile in ['braf_dabrafenib','braf_mek_dab_tram']:
  rules.append(rule('PYREXIA','temperature_c','>=',38,'withhold','Pyrexia ≥38°C requires interruption of dabrafenib-containing therapy and assessment for infection/dehydration before restart.',10))
 elif profile=='braf_meK_cobi_vem':
  rules.append(rule('FEVER_REVIEW','temperature_c','>=',38,'withhold','Fever requires interruption and clinical assessment before continuation of therapy.',9))

def build_new(code,spec):
 profile=spec['profile']; inp=common_inputs(); rules=common_rules()
 cytotoxic=profile=='dacarbazine'; ici=profile in ['ici','ici_combo']
 if ici:add_ici(inp,rules)
 if profile.startswith('braf'):add_braf_mek(inp,rules,profile)
 if profile=='dacarbazine':
  inp.update({
   'anc':num('ANC',2,'×10⁹/L',.01), 'platelets':num('Platelets',180,'×10⁹/L',1), 'haemoglobin':num('Haemoglobin',12,'g/dL',.1),
   'dacarbazine_renal_band':{'label':'Creatinine-clearance band','type':'select','required':False,'renal_input':{'mode':'protocol_specific_band','method':'CrCl as used in the current NCCP source'},'options':[{'value':'gt60','label':'CrCl >60 mL/min — full dose pathway','decision_value':100},{'value':'45_60','label':'CrCl 45–60 mL/min — 80% dose','decision_value':80},{'value':'30_lt45','label':'CrCl 30–<45 mL/min — 75% dose','decision_value':75},{'value':'lt30','label':'CrCl <30 mL/min — 70% dose','decision_value':70}],'demo_value':'gt60'}, 'severe_liver_disease':boolean('Severe liver disease')
  })
  rules += [
   rule('DTIC_ANC','anc','<',1.5,'delay','ANC <1.5 ×10⁹/L: delay one week, repeat FBC and resume at 100% only when recovered within acceptable parameters.',10,['dacarbazine'],'Table 1'),
   rule('DTIC_PLT','platelets','<',100,'delay','Platelets <100 ×10⁹/L: delay one week, repeat FBC and resume at 100% only when recovered within acceptable parameters.',10,['dacarbazine'],'Table 1'),
   rule('DTIC_CRCL_45_60','dacarbazine_renal_band','==','45_60','dose_reduce','CrCl 45–60 mL/min: use 80% dacarbazine dose, confirmed with the prescribing Consultant/pharmacy.',8,['dacarbazine'],'Table 2'),
   rule('DTIC_CRCL_30_45','dacarbazine_renal_band','==','30_lt45','dose_reduce','CrCl 30–<45 mL/min: use 75% dacarbazine dose, confirmed with the prescribing Consultant/pharmacy.',9,['dacarbazine'],'Table 2'),
   rule('DTIC_CRCL_LT30','dacarbazine_renal_band','==','lt30','dose_reduce','CrCl <30 mL/min: use the NCCP 70% dose pathway only after Consultant/pharmacy confirmation.',10,['dacarbazine'],'Table 2'),
   rule('DTIC_LIVER','severe_liver_disease','==',True,'contraindicated','Severe liver disease is an exclusion; do not administer without specialist reassessment.',10,['dacarbazine'],'Exclusions / Table 2'),
  ]
 if profile=='vismodegib':
  inp.update({
   'pregnancy_prevention_programme_confirmed':boolean('Pregnancy-prevention programme requirements confirmed',True),
   'able_to_swallow_and_absorb_oral_treatment':boolean('Able to swallow and absorb oral treatment',True),
  })
  rules += [
   rule('VIS_PPP','pregnancy_prevention_programme_confirmed','==',False,'contraindicated','Do not start or continue vismodegib unless all pregnancy-prevention programme requirements are satisfied.',10,['vismodegib']),
   rule('VIS_ABSORB','able_to_swallow_and_absorb_oral_treatment','==',False,'consultant_review','Inability to reliably swallow or absorb oral treatment requires specialist review.',8,['vismodegib']),
  ]
 if profile=='ici_combo':
  inp['treatment_phase']=select('Treatment phase',[('combination','Cycles 1–4 combination phase'),('nivolumab_maintenance','Nivolumab maintenance phase')],'combination')
  rules.append(rule('COMBO_SEVERE_IMMUNE','non_haematological_toxicity_grade','>=',3,'withhold','During combination immunotherapy, grade 3 or worse toxicity requires withholding both components and source-specific permanent-discontinuation review.',10,['nivolumab','ipilimumab']))
 risk,script=('high','nccp-parenteral-high') if cytotoxic else (('oral_minimal_low','nccp-oral-minimal-low') if not ici else ('minimal','nccp-minimal-no-routine-prophylaxis'))
 fname=f"{code}-{slug(spec['title'])}.json"
 treatment={'cycle_length_days':spec['cycle'],'schedule_summary':spec['schedule'],'drugs':spec['drugs']}
 first=spec['contexts'][0]
 for k in ['planned_cycles','duration_type','duration_text']:
  if k in first:treatment[k]=first[k]
 p={
  'schema_version':'2.0.0','protocol_id':f"nccp-{code}-v{spec['version']}",'file_name':fname,'status':'encoded_prototype_pending_clinical_and_pharmacy_validation',
  'metadata':{
   'nccp_regimen_code':code,'nccp_version':spec['version'],'tumour_group':'Skin/Melanoma','tumour_groups':['Skin/Melanoma'],'title':spec['title'],'short_title':spec['title'],'indication':' / '.join(x[1] for x in spec['indications']),'source_url':spec['source'],'source_document_pages':None,'sactcheck_encoding_version':VERSION,'source_checked_date':CHECKED,
   'partial_assessment_supported':True,'partial_assessment_note':'Any independently actionable entered value is assessed; omitted domains remain unassessed and do not block a partial result.','skin_subgroups':spec['subgroups'],'treatment_context':['skin_melanoma',*[f"skin_{x}" for x in spec['subgroups']]],'treatment_class':['immune_checkpoint_inhibitor'] if ici else (['cytotoxic_chemotherapy'] if cytotoxic else ['oral_targeted_therapy']),'cytotoxic':cytotoxic,'catalogue_section':'skin_melanoma','catalogue_section_label':'Skin / Melanoma','catalog':{'enabled':True},'drugs':spec['drugs'],'common_trade_names':spec['aliases'],
   'regimen_card':{'contexts':[dict(c,provenance='official_nccp_source_reconciled') for c in spec['contexts']],'provenance':{'source':'NCCP regimen PDF / Skin-Melanoma catalogue','reviewed':False}},
   'migration':{'mode':'live_json'},'validation':{'official_catalogue_and_source_link_checked':True,'rule_level_source_reconciliation_status':'pending_independent_clinical_and_oncology_pharmacy_validation','software_tests_completed':True,'consultant_reviewed':False,'oncology_pharmacy_reviewed':False,'clinical_use_authorised':False}
  },
  'clinical_governance':{'prescriptive_authority':'Treatment plan must be initiated by a Consultant Medical Oncologist or the specialist authority specified in the current NCCP source.','dose_modification_note':'Use the most restrictive applicable component rule and confirm all dose changes against the current official NCCP PDF.','disclaimer':f"Decision-support encoding derived from NCCP {code} Version {spec['version']}. It does not replace the current official regimen, prescribing review, pharmacy verification or independent clinical judgement."},
  'indications':[{'indication_id':i,'code':i.split('-')[0],'description':d} for i,d in spec['indications']],
  'treatment':treatment,'input_definitions':inp,'required_inputs':[],
  'output_templates':{'proceed':'No encoded restriction was triggered in the entered domain(s). This is not an overall treatment clearance.','coverage_gap':'Only entered values were assessed; omitted clinically relevant domains remain unassessed.','consultant_review':'The entered value requires protocol-specific Consultant/pharmacy review.','withhold':'Withhold treatment and reassess according to the official NCCP pathway.','delay':'Delay treatment and repeat assessment according to the official NCCP pathway.','dose_reduce':'Apply the encoded dose-reduction pathway and confirm against the official source.','contraindicated':'The entered value triggers an encoded contraindication/exclusion.','permanently_discontinue':'The entered value triggers permanent discontinuation in the encoded pathway.'},
  'rule_engine':{'conflict_policy':'most_restrictive_action_wins','missing_data_policy':'report_unassessed_coverage_gap','actions_ranked_most_to_least_restrictive':['permanently_discontinue','contraindicated','discontinue','cease','omit','withhold_then_reduce','withhold','delay_then_dose_reduce','delay','consultant_review','dose_reduce','proceed_with_caution','proceed'],'rules':rules},
  'eligibility':['Indication as listed in the current official NCCP regimen','Performance status and molecular eligibility appropriate to the selected indication','Organ function appropriate for the selected regimen'],
  'exclusions':['Known hypersensitivity to a regimen component','Pregnancy or breastfeeding where prohibited by the current source','Regimen-specific exclusions encoded in the assessment'],
  'supportive_care':{'emetogenic_risk':risk,'script_id':script,'mapping_basis':'Highest emetogenic active component and NCCP classification.','mapping_confidence':'source_reconciled_pending_pharmacy_validation','mapping_source_url':ANTI,'validation_status':'pending_oncology_pharmacy_validation'}
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
  except Exception:continue
  if str(d.get('metadata',{}).get('nccp_regimen_code','')).zfill(5)==code:found.append((f,d))
 if len(found)>1:raise RuntimeError(f'Duplicate canonical files for NCCP {code}: {[str(x[0]) for x in found]}')
 return found[0] if found else (None,None)

def reconcile(f,d,code,spec):
 m=d.setdefault('metadata',{}); primary=m.get('tumour_group'); groups=list(m.get('tumour_groups') or ([] if not primary else [primary]))
 if primary and primary not in groups:groups.insert(0,primary)
 if 'Skin/Melanoma' not in groups:groups.append('Skin/Melanoma')
 if not primary:m['tumour_group']=groups[0]
 m['tumour_groups']=groups;m['skin_subgroups']=spec['subgroups'];m['sactcheck_encoding_version']=VERSION;m['partial_assessment_supported']=True;m['source_checked_date']=CHECKED;m['source_url']=spec['source'];m['nccp_version']=spec['version'];m['common_trade_names']=list(dict.fromkeys((m.get('common_trade_names') or [])+spec['aliases']));d['protocol_id']=f"nccp-{code}-v{spec['version']}"
 tc=list(m.get('treatment_context') or [])
 for x in ['skin_melanoma',*[f"skin_{s}" for s in spec['subgroups']]]:
  if x not in tc:tc.append(x)
 m['treatment_context']=tc
 validation=m.setdefault('validation',{});validation.update({'official_catalogue_and_source_link_checked':True,'rule_level_source_reconciliation_status':'pending_independent_clinical_and_oncology_pharmacy_validation','clinical_use_authorised':False})
 inds=d.get('indications') if isinstance(d.get('indications'),list) else []
 ids={x.get('indication_id') for x in inds if isinstance(x,dict)}
 for iid,desc in spec['indications']:
  if iid not in ids:inds.append({'indication_id':iid,'code':iid.split('-')[0],'description':desc})
 d['indications']=inds;d['required_inputs']=[];d['status']='encoded_prototype_pending_clinical_and_pharmacy_validation'
 for x in (d.get('input_definitions') or {}).values():
  if isinstance(x,dict):x['required']=False
 existing=m.get('regimen_card') if isinstance(m.get('regimen_card'),dict) else {}; contexts=list(existing.get('contexts') or [])
 new_ids={c['id'] for c in spec['contexts']};contexts=[c for c in contexts if not (isinstance(c,dict) and c.get('id') in new_ids)]
 contexts += [dict(c,provenance='official_nccp_source_reconciled') for c in spec['contexts']]
 m['regimen_card']={**existing,'contexts':contexts,'provenance':{**(existing.get('provenance') or {}),'source':'NCCP regimen PDF / Skin-Melanoma catalogue','reviewed':False}}
 treatment=d.get('treatment') if isinstance(d.get('treatment'),dict) else {}
 treatment['cycle_length_days']=spec['cycle'];treatment['schedule_summary']=spec['schedule'];treatment.setdefault('drugs',spec['drugs'])
 # Correct 400 mg pembrolizumab q6w and retain explicit source-derived schedule on all reconciled protocols.
 d['treatment']=treatment
 d.setdefault('clinical_governance',{})['disclaimer']=f"Decision-support encoding includes NCCP {code} Version {spec['version']}. It does not replace the current official regimen, prescribing review, pharmacy verification or independent clinical judgement."
 d.setdefault('supportive_care',{}).setdefault('mapping_source_url',ANTI)
 f.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

new=[];reconciled=[]
for code,spec in sorted(D.items()):
 f,d=find_existing(code)
 if f and spec.get('new') and f.parent.resolve()==OUT.resolve():
  p=build_new(code,spec);f.write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');new.append(code)
 elif f:
  reconcile(f,d,code,spec);reconciled.append(code)
 else:
  if not spec.get('new'):raise RuntimeError(f'Expected existing canonical file for NCCP {code}')
  p=build_new(code,spec);(OUT/p['file_name']).write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');new.append(code)

print(f'Built complete Skin/Melanoma catalogue: {len(new)} new, {len(reconciled)} reconciled, {len(D)} unique codes.')
print('New:',','.join(new))
print('Reconciled:',','.join(reconciled))
