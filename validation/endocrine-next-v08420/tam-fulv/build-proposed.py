"""Reconcile two endocrine monotherapies to current NCCP and Irish/EU product sources.

This writes audit proposals only. The release owner reviews and integrates them.
"""
from pathlib import Path
import json,copy,hashlib
H=Path(__file__).resolve().parent;R=H.parents[2];DATE='2026-10-25';V='0.84.20'
HPRA='https://assets.hpra.ie/products/Human/19894/Licence_PA0711-022-002_30062026111821.pdf'
VIATRIS='https://assets.hpra.ie/products/Human/17076/Licence_PA23266-052-001_19052026131657.pdf'
EMA='https://www.ema.europa.eu/en/documents/product-information/faslodex-epar-product-information_en.pdf'
UK='https://www.medicines.org.uk/emc/product/12211/smpc'
def source(url,page,document):return dict(document=document,url=url,page=page,checked_date=DATE)
def review(message):return dict(type='consultant_review',message=message,dose_calculation='specialist_review',show_in_dose_actions=True,block_numeric_dose=True)
def boolean(p,key,label,guidance=''):
 p['input_definitions'][key]=dict(label=label,type='boolean',required=False,input_role='decision',demo_value=False)
 if guidance:p['input_definitions'][key]['assessment_guidance']=guidance
def rule(p,id,key,message,src,action='consultant_review'):
 a=review(message) if action=='consultant_review' else dict(type=action,message=message)
 a['components']=['tamoxifen' if p['metadata']['nccp_regimen_code']=='00253' else 'fulvestrant']
 p['rule_engine']['rules'].append(dict(id=id,priority=80 if action=='consultant_review' else 100,when=dict(field=key,operator='==',value=True),action=a,explanation=message,source=src))
def change(p,id,message,src=None,kind=None):
 q=next(x for x in p['rule_engine']['rules'] if x['id']==id);q['explanation']=message
 if kind=='consultant_review':q['action']={**review(message),'components':q['action']['components']}
 else:q['action']['message']=message
 if src:q['source']=src
def write(p):
 out=H/'proposed'/p['file_name'];out.parent.mkdir(exist_ok=True);out.write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n')
for code in ['00253','00361']:
 f=next((H.parent/'baseline').glob(code+'-*'));p=json.loads(f.read_text());m=p['metadata']
 m.update(sactcheck_encoding_version=V,source_checked_date=DATE,source_version_verified_date=DATE,full_suite_release=V)
 m['encoding_maturity'].update(reconciled_release=V,reconciled_date=DATE,scope_note='Current NCCP and Irish/EU product sources reviewed, including monitoring provenance, unresolved dose-source differences and treatment-specific safety. Independent clinical/pharmacy validation remains pending.')
 m['validation'].update(software_tests_completed=False,software_validation_record='validation/endocrine-next-v08420/tam-fulv/AUDIT.md')
 m['source_pdf_sha256']='2644049a0e9387df658f14530add5ebe2790b25b5fc19b9d9db63bf7f2694caa' if code=='00253' else '1900a0e6e710a2fee14faeceec56fa2db2e03137905bfb4862b331efd01478c3'
 m['source_version_verification_method']='Current official PDF downloaded; header/version reviewed; rendered page 2 organ-function table visually inspected.'
 for q in p['rule_engine']['rules']:q['source']['checked_date']=DATE
 if code=='00253':
  p['monitoring']['bone']='Assess menopausal state and individual fracture risk. Current Irish Tamox information describes possible bone-density loss before menopause and maintenance after menopause; NCCP00253 sets no universal DXA interval.'
  for entry in p.get('source_discrepancies',[]):
   if entry.get('topic')=='Thromboembolic history': entry['source_url']=VIATRIS
  nccp=m['source_url'];rowex=lambda page:source(HPRA,page,'HPRA Tamox 20 mg SmPC, 30 June 2026');viatris=lambda page:source(VIATRIS,page,'HPRA Tamoxifen 20 mg SmPC, 19 May 2026')
  # Use the Irish product cited by NCCP where current wording is available.
  for id,page in [('TAM_BLEEDING','§4.4, p2'),('TAM_VISUAL','§4.4, p2'),('TAM_CYP2D6','§4.4–4.5, pp2–3'),('TAM_COUMARIN','§4.5, p3'),('TAM_CYP3A4','§4.5, p3'),('TAM_SCAR','§4.4, p2'),('TAM_SCAR_HISTORY','§4.4, p2')]:
   next(q for q in p['rule_engine']['rules'] if q['id']==id)['source']=rowex(page)
  for id in ['TAM_VTE','TAM_ACUTE_VTE','TAM_SURGERY']:next(q for q in p['rule_engine']['rules'] if q['id']==id)['source']=viatris('§4.4, pp2–3')
  change(p,'TAM_ANASTROZOLE','Concurrent tamoxifen and anastrozole requires prescriber/pharmacy reconciliation: the Irish Tamox SmPC reports no added efficacy from an adjuvant aromatase-inhibitor combination, while some UK product labels contraindicate concurrent anastrozole. Confirm the prescribed sequence and dispensed product; do not treat sequential switching as concurrent use. No automatic dose is assigned.',rowex('§4.5, p3'),'consultant_review')
  change(p,'TAM_QT_RISK','Review cardiac/QT risk and interacting medicines. NCCP and the Irish Tamox SmPC support ECG and electrolyte monitoring when risk makes it indicated; agree follow-up from the actual product information and clinical findings. Do not apply a universal fixed-cycle ECG or echocardiogram schedule.',rowex('§4.4–4.5, pp2–3'),'consultant_review')
  change(p,'TAM_QT_SYMPTOMS','New palpitations, dizziness or syncope need prompt clinical assessment, ECG and electrolyte review; syncope or severe symptoms may require urgent assessment. Reconcile tamoxifen and other QT-prolonging medicines. No source-defined QTc dose ladder is provided.',rowex('§4.4–4.5, pp2–3'),'consultant_review')
  change(p,'TAM_ELECTROLYTES','Correct electrolyte abnormalities relevant to QT risk and obtain clinical/ECG review. Decide whether initiation or continuation should be deferred according to severity, symptoms and the prescribed product. The NCCP and Irish SmPC do not provide a universal numeric electrolyte hold threshold or automatic tamoxifen dose reduction.',rowex('§4.4–4.5, pp2–3'),'consultant_review')
  additions=[
   ('serious_cytopenia','Severe cytopenia judged clinically significant','TAM_SERIOUS_CYTOPENIA','Severe thrombocytopenia or leucocytopenia requires individual risk–benefit review and close supervision under the Irish Tamox SmPC. Assess the cause and clinical severity. No universal ANC/platelet number or automatic chemotherapy-style reduction is supplied.','§4.4, p2'),
   ('hypercalcaemia','Hypercalcaemia present','TAM_HYPERCALCAEMIA','Assess and manage hypercalcaemia, including symptoms, severity and bone disease. The Irish Tamox SmPC requires individual risk–benefit review and supervision; it gives no numerical tamoxifen dose ladder for calcium.','§4.4 and §4.8, pp2,4–5'),
   ('hereditary_angioedema','Hereditary angioedema','TAM_ANGIOEDEMA','Tamoxifen may induce or exacerbate hereditary angioedema. Review suitability and the emergency plan; acute tongue/throat swelling or breathing difficulty needs emergency assessment. A history alone is not a universal source contraindication.','§4.4, p2'),
   ('concurrent_oestrogen_preparation','Concurrent systemic oestrogen or oestrogen-containing contraception','TAM_OESTROGEN','The Irish Tamox SmPC advises against combining hormone preparations, particularly oestrogens, because effects may oppose each other. Review the exact preparation and non-hormonal alternatives with the prescriber; do not automatically apply this statement to every locally administered menopausal treatment.','§4.5, p3'),
   ('antiplatelet_treatment','Antiplatelet treatment, for example aspirin or clopidogrel','TAM_ANTIPLATELET','The Irish Tamox SmPC advises avoiding platelet-aggregation inhibitors because bleeding may occur during thrombocytopenia. Reconcile the antiplatelet indication, blood count and bleeding risk with oncology/pharmacy and the prescribing team. Do not stop essential antiplatelet therapy without an agreed plan.','§4.5, p3')]
  for key,label,id,msg,page in additions:boolean(p,key,label);rule(p,id,key,msg,rowex(page))
  boolean(p,'intolerable_toxicity','Treatment adverse effects are intolerable or impair adherence');rule(p,'TAM_INTOLERABLE','intolerable_toxicity','Intolerable symptoms merit Consultant review even without a high toxicity grade. Discuss symptom support, adherence and a suitable alternative endocrine plan; NCCP does not provide a universal percentage dose reduction.',source(nccp,2,'NCCP 00253 v6'))
  boolean(p,'preexisting_hyperlipidaemia','Pre-existing hyperlipidaemia');rule(p,'TAM_LIPIDS','preexisting_hyperlipidaemia','Review lipid history and arrange lipid monitoring when clinically indicated: NCCP notes possible cholesterol/triglyceride increases in patients with pre-existing hyperlipidaemia. No automatic dose change is specified.',source(nccp,3,'NCCP 00253 v6'))
  p['monitoring']['baseline']=['NCCP: FBC, renal and liver profile; ECG when clinically indicated.','Confirm ER-positive indication, pregnancy exclusion, significant clot history, medicines and endocrine treatment plan.','Current Irish Tamox product SmPC additionally recommends an ophthalmological examination at initiation and review of calcium; reconcile the dispensed product and booking plan.']
  p['monitoring']['regular']=['NCCP: ophthalmology, INR, LFTs and ECG as clinically indicated.','NCCP: annual gynaecological examination; unusual vaginal bleeding or pelvic complaints require prompt assessment. This is not a universal ultrasound or biopsy order.','Irish Tamox SmPC: regular blood count including platelets, liver tests and calcium; frequency is not specified and must be agreed locally.','QT-risk ECG/electrolytes according to risk and product; no routine echocardiogram schedule.','Review symptoms, adherence, medicines, premenopausal bone risk and pre-existing hyperlipidaemia.']
  p['monitoring']['source_specific_note']='NCCP v6 and current Rowex Tamox SmPC have different monitoring detail. Preserve both with attribution; do not silently replace clinically indicated testing with an invented monthly interval. The four-week ECG wording in some UK products is not stated in the Irish Rowex SmPC.'
  p.setdefault('source_discrepancies',[]).extend([
   {'topic':'Current Irish Tamox product monitoring','nccp':'Baseline FBC/renal/liver; later eye/INR/LFT/ECG as clinically indicated.','supplemental_source':'Rowex SmPC 30 June 2026 additionally recommends baseline ophthalmology and regular FBC/LFT/calcium without a defined interval. Confirm the exact product and local plan.', 'source_url':HPRA},
   {'topic':'Concurrent anastrozole','nccp':'No specific anastrozole exclusion in the regimen; consult current product information.','supplemental_source':'Irish Rowex§4.5 reports no efficacy gain for adjuvant aromatase-inhibitor combination; some UK products list anastrozole as contraindicated. Use specialist medication reconciliation, not an unqualified NCCP contraindication.', 'source_url':HPRA,'comparison_url':UK},
   {'topic':'ECG timing','nccp':'ECG as clinically indicated.','supplemental_source':'Irish Rowex SmPC specifies risk-triggered ECG/electrolytes; some UK product information adds repeat ECG at steady state. The exact product controls supplemental instructions.','source_url':HPRA,'comparison_url':UK}])
  m['source_supplements']=[rowex('§§4.2–4.6,5.1–5.2'),viatris('§4.4 VTE/surgery guidance')]
  p['clinical_governance']['monitoring_reconciliation']='Reconcile current Irish product-specific ophthalmology, FBC/LFT/calcium and interaction wording with the NCCP plan. No fixed-frequency tests or dose algorithms are invented.'
 else:
  nccp=m['source_url'];ema=lambda page:source(EMA,page,'EMA Faslodex product information')
  change(p,'FULV_HEPATIC_B','Source conflict: NCCP Table 1 recommends 50% of the original 500 mg dose (250 mg) for Child-Pugh B, while current EMA Faslodex §4.2 recommends no reduction for mild/moderate hepatic impairment with caution. Consultant and oncology pharmacy must reconcile the product, liver status and actual prior dose before prescribing. No definitive numeric dose is calculated.',source(nccp,2,'NCCP 00361 v4; current EMA Faslodex §4.2 differs'),'consultant_review')
  for q in p['rule_engine']['rules']:
   if q['source']['url']==EMA:q['source']['document']='EMA Faslodex product information'
  p['input_definitions']['current_fulvestrant_dose_mg']=dict(label='Current prescribed fulvestrant dose per visit',type='number',unit='mg',required=False,min=1,max=1000,step=1,input_role='decision',demo_value=500,assessment_guidance='Enter an actual existing prescription only. A lower dose may reflect previous clinical decisions; a renal no-adjustment statement must not restore 500 mg automatically.')
  p['rule_engine']['rules'].append(dict(id='FULV_CURRENT_DOSE_REVIEW',priority=81,when={'any':[{'field':'current_fulvestrant_dose_mg','operator':'<','value':500},{'field':'current_fulvestrant_dose_mg','operator':'>','value':500}]},action={**review('The current fulvestrant prescription differs from the standard 500 mg schedule. Reconcile its indication, liver function, prior toxicity and source recommendations with the prescriber. Do not automatically increase a previously reduced dose or assume that a renal no-adjustment statement resets the prescription.'),'components':['fulvestrant']},explanation='The current fulvestrant prescription differs from the standard 500 mg schedule. Reconcile its indication, liver function, prior toxicity and source recommendations with the prescriber. Do not automatically increase a previously reduced dose or assume that a renal no-adjustment statement resets the prescription.',source=source(nccp,'pp1–2','NCCP 00361 v4; individual dose judgement and Table1')))
  boolean(p,'companion_anticancer_medicine','Another anticancer medicine accompanies fulvestrant','This monotherapy assessment does not cover the additional medicine. Select its full combination regimen.');rule(p,'FULV_COMBINATION_SCOPE','companion_anticancer_medicine','This card assesses fulvestrant monotherapy only. Select the full named combination regimen and add its eligibility, dose, monitoring and supportive-care rules. Do not use a normal monotherapy assessment to clear capivasertib or a CDK4/6 inhibitor.',source(nccp,1,'NCCP 00361 v4 monotherapy scope'))
  p['dose_modifications'][0]='Child-Pugh B: NCCP proposes250mg/50% original dose, whereas EMA gives no mild/moderate reduction with caution. This unresolved source conflict produces specialist review without a definitive calculated dose.'
  p['source_discrepancies'][0]['supplemental_source']='EMA Faslodex §4.2 recommends no dose reduction for mild/moderate impairment with caution. The conflicting NCCP 250 mg recommendation remains visible as source text; automatic numeric output is blocked pending Consultant/pharmacy reconciliation.'
  m['source_supplements']=[ema('§§4.2–4.6')]
  m['intent']='advanced_disease'
 write(p)
print('Wrote proposed tamoxifen and fulvestrant source reconciliations only.')
