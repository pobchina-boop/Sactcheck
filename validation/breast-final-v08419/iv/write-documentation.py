from pathlib import Path
import json,hashlib
H=Path(__file__).resolve().parent;P=Path('/workspace/scratch/bca730129437/research-v19/iv');DATE='2026-10-25'
def save(name,d):(H/name).write_text(json.dumps(d,indent=2,ensure_ascii=False)+'\n')
N688='https://healthservice.hse.ie/documents/6530/688_v2a_Atezolizumab_nab-PACLitaxel.pdf';N738='https://healthservice.hse.ie/documents/6671/738.pdf';T='https://www.ema.europa.eu/en/documents/product-information/tecentriq-epar-product-information_en.pdf';A='https://www.ema.europa.eu/en/documents/product-information/avastin-epar-product-information_en.pdf'
docs=[]
for id,file,url,title,pages,extra in [
('nccp00688','00688.pdf',N688,'NCCP Atezolizumab and nab-PACLitaxel Therapy',10,dict(version='2a',published_date='2022-01-20',version_date='2025-08-14',review_due='2027-12-16',read_pages=list(range(1,11)),table_map={'schedule_indication':1,'eligibility_baseline_tests':2,'regular_tests_counts':3,'renal_hepatic':4,'immune_toxicities':[4,5,6],'nab_neuropathy':6,'supportive_care':7,'safety':8,'interactions_references':9,'version_history':10})),
('nccp00738','00738.pdf',N738,'NCCP Bevacizumab 10mg/kg and PACLitaxel 80mg/m2 Therapy',10,dict(version=3,published_date='2022-07-11',version_date='2025-04-28',review_due='2029-01-31',read_pages=list(range(1,11)),table_map={'schedule':1,'eligibility_baseline_regular_tests':2,'paclitaxel_counts':3,'hepatic_neuropathy':4,'bevacizumab_modifications':5,'premedication':6,'hypertension_surgery':7,'vascular_safety':8,'version_history':[9,10]})),
('ema_tecentriq','tecentriq.pdf',T,'EMA Tecentriq product information',175,dict(version='Current PDF snapshot; no document revision date asserted',sections_reviewed=['4.1 breast indication','4.2 modifications','4.4 precautions','5.1 IMpassion130'],pages_reviewed=[3,7,8,9,10,11,12,13,14,15,56,57,58,59],scope='Current EU TNBC status, supplementary pericardial/HLH toxicity and trial data; do not substitute other tumour schedules for NCCP00688.')),
('ema_avastin','avastin.pdf',A,'EMA Avastin product information',72,dict(version='Current PDF snapshot; no document revision date asserted',sections_reviewed=['4.1 breast indication','4.2 posology','4.4 precautions','4.6 reproductive advice','5.1 E2100'],pages_reviewed=[2,3,4,5,6,7,8,9,10,11,28,29],scope='Current EU first-line breast indication and E2100 context; does not determine individual reimbursement.'))]:
 b=(P/file).read_bytes();docs.append(dict(id=id,url=url,title=title,pages=pages,sha256=hashlib.sha256(b).hexdigest(),bytes=len(b),retrieved=DATE,raw_distribution='Not distributed; research cache outside repository',**extra))
lit=[
 dict(id='imp130_primary',url='https://pubmed.ncbi.nlm.nih.gov/30345906/',doi='10.1056/NEJMoa1809615',year=2018,read='Primary publication abstract; numerical PFS crosschecked against EMA Table 20'),
 dict(id='imp130_final',url='https://pubmed.ncbi.nlm.nih.gov/34272041/',doi='10.1016/j.annonc.2021.05.355',year=2021,read='Primary publication abstract; final OS crosschecked against current EMA Table 20'),
 dict(id='imp130_corrigendum',url='https://pubmed.ncbi.nlm.nih.gov/34740469/',doi='10.1016/j.annonc.2021.10.002',year=2021,read='Bibliographic erratum record inspected; full correction inaccessible through DOI retrieval. No assumption about its content. Retained numerical results agree with current EMA product information.'),
 dict(id='imp131_primary',url='https://pubmed.ncbi.nlm.nih.gov/34219000/',doi='10.1016/j.annonc.2021.05.801',year=2021,read='Primary publication abstract, plus journal result text; used to prevent solvent-paclitaxel extrapolation'),
 dict(id='e2100_primary',url='https://pubmed.ncbi.nlm.nih.gov/18160686/',doi='10.1056/NEJMoa072113',year=2007,read='Primary publication abstract; original published analysis retained without mixing EMA reanalysis estimates')]
save('sources.json',dict(checked=DATE,scope=['00688','00738'],baseline_sha='6c1050b8a2ced301fe770fe67fd518b5a78566e5',documents=docs,literature=lit,catalogue=dict(url='https://healthservice.hse.ie/staff/information-healthcare-workers/nccp/breast-sact-regimens-locally-advanced-metastatic/',checked=DATE,both_listed=True),status_interpretation='Ireland/EU sources retain these regimens/indications. No cross-jurisdiction inference from US withdrawal and no guarantee of individual funding.',clinical_approval=False))
source=lambda url,**kw:dict(url=url,**kw)
e={
 'checked':DATE,'clinical_only':True,'patient_numeric_panel':False,
 '00688':{
  'regimen_rationale':'Atezolizumab blocks PD-L1 signalling; albumin-bound paclitaxel is a microtubule-directed cytotoxic drug. Intended to control eligible advanced TNBC, not a curative early-breast regimen.',
  'biomarker':'Ventana SP142 tumour-infiltrating immune-cell score, with stained immune-cell area at least 1% of tumour area. This is neither CPS nor tumour-cell percentage.',
  'status':'NCCP00688 v2a and current EMA TNBC indication remain available in Ireland/EU source documents checked on this date; prior metastatic chemotherapy is excluded by the indication. Confirm individual clinical eligibility and approval.',
  'studies':[
   {'study':'IMpassion130, primary PFS','year':2018,'population':'902 patients with untreated unresectable locally advanced/metastatic TNBC; 451 per arm; PD-L1 IC+ subgroup 185 versus 184.',
    'comparison':'Atezolizumab 840 mg Days 1/15 plus nab-paclitaxel 100 mg/m² Days 1/8/15 every 28 days versus placebo plus the same nab-paclitaxel.',
    'endpoints':[{'endpoint':'Investigator PFS in PD-L1 IC+ subgroup','combination_median_months':7.5,'control_median_months':5.0,'hazard_ratio':0.62,'ci95':[0.49,0.78],'p':'<0.001'},{'endpoint':'PFS, intention-to-treat','combination_median_months':7.2,'control_median_months':5.5,'hazard_ratio':0.80,'ci95':[0.69,0.92],'p':0.002}],
    'limitations':['PFS and OS are different endpoints. Group medians are not an individual prognosis or guaranteed months gained.','Evidence depends on the exact nab-paclitaxel combination and biomarker population; no early-breast extrapolation.'],
    'sources':[source('https://pubmed.ncbi.nlm.nih.gov/30345906/',doi='10.1056/NEJMoa1809615'),source(T,pages=[56,57,58])]},
   {'study':'IMpassion130, final OS','year':2021,'population':'Same randomised trial, final OS analysis; median follow-up 18.8 months overall.',
    'endpoints':[{'endpoint':'OS, intention-to-treat','combination_median_months':21.0,'control_median_months':18.7,'hazard_ratio':0.87,'ci95':[0.75,1.02],'p':0.077,'inference':'Not statistically significant'},{'endpoint':'OS, PD-L1 IC+ subgroup','combination_median_months':25.4,'control_median_months':17.9,'hazard_ratio':0.67,'ci95':[0.53,0.86],'inference':'Exploratory/descriptive; formal testing was prevented by the prespecified hierarchy after nonsignificant ITT OS.'}],
    'limitations':['Do not describe the subgroup OS estimate as a formally proven survival advantage.','Do not mix these final OS estimates with earlier interim values or use the median difference as an individual survival promise.'],
    'sources':[source('https://pubmed.ncbi.nlm.nih.gov/34272041/',doi='10.1016/j.annonc.2021.05.355'),source(T,pages=[57,58])]},
   {'study':'IMpassion131, formulation caution','year':2021,'population':'651 patients with advanced TNBC; 45% PD-L1 positive. A different chemotherapy formulation: solvent-based paclitaxel.',
    'endpoints':[{'endpoint':'PFS, PD-L1-positive','combination_median_months':6.0,'control_median_months':5.7,'hazard_ratio':0.82,'ci95':[0.60,1.12],'p':0.20},{'endpoint':'OS, PD-L1-positive','combination_median_months':22.1,'control_median_months':28.3,'hazard_ratio':1.11,'ci95':[0.76,1.64]}],
    'limitations':['Atezolizumab plus solvent-based paclitaxel did not improve PFS or OS. This trial does not support substituting solvent paclitaxel in NCCP00688.'],
    'sources':[source('https://pubmed.ncbi.nlm.nih.gov/34219000/',doi='10.1016/j.annonc.2021.05.801')]}],
  'consent_benefit_text':'In the biomarker-selected trial group, the combination delayed cancer progression compared with nab-paclitaxel alone. Survival results in that subgroup were exploratory. Discuss likely disease control, symptoms and adverse effects for the individual situation.',
  'safety_priorities':['Infection/low counts and taxane neuropathy','Immune inflammation involving bowel, lung, liver, kidney, hormones, skin, heart or nervous system, including delayed events','No routine solvent-paclitaxel steroid premedication is copied to nab-paclitaxel'],
  'sources':[source(N688,pages=[1,2,3,4,5,6,7,8]),source(T,section='5.1',pages=[56,57,58])]
 },
 '00738':{
  'regimen_rationale':'Bevacizumab targets VEGF-mediated angiogenesis; paclitaxel interferes with microtubules. Intended for metastatic disease control under the agreed treatment plan.',
  'status':'NCCP00738 v3 lists triple-negative or HER2-negative metastatic breast cancer. EMA licenses first-line metastatic breast cancer with paclitaxel; establish line of treatment and local approval.',
  'studies':[
   {'study':'E2100, original publication','year':2007,'population':'722 patients receiving initial chemotherapy for metastatic breast cancer; predominantly HER2-negative, not a TNBC-only trial.',
    'comparison':'Paclitaxel 90 mg/m² Days 1/8/15 every 28 days with or without bevacizumab 10 mg/kg Days 1/15.',
    'endpoints':[{'endpoint':'PFS, primary endpoint','combination_median_months':11.8,'control_median_months':5.9,'hazard_ratio':0.60,'p':'<0.001'},{'endpoint':'OS, secondary endpoint','combination_median_months':26.7,'control_median_months':25.2,'hazard_ratio':0.88,'p':0.16,'inference':'No statistically significant OS improvement'},{'endpoint':'Objective response','combination_percent':36.9,'control_percent':21.2,'p':'<0.001'}],
    'limitations':['NCCP00738 uses paclitaxel 80 mg/m²; E2100 tested 90 mg/m². Label this dose mismatch explicitly.','No demonstrated OS advantage; do not convert PFS improvement into a survival claim.','The original publication estimates are retained together; EMA presents different assessment/reanalysis values and they must not be blended.','Not TNBC-only evidence and not an individual prognosis.'],
    'sources':[source('https://pubmed.ncbi.nlm.nih.gov/18160686/',doi='10.1056/NEJMoa072113'),source(A,pages=[28,29]),source(N738,page=1)]}],
  'consent_benefit_text':'A related trial showed longer time before progression and more tumour responses with bevacizumab plus paclitaxel, but did not show a significant survival improvement. Its paclitaxel dose was 90 mg/m²; this NCCP schedule uses 80 mg/m².',
  'safety_priorities':['Paclitaxel low counts, infection, neuropathy and infusion reactions','Bevacizumab hypertension, urine protein loss, bleeding/clots, wound-healing problems and uncommon bowel perforation','Surgery timing and healed wounds must be reviewed; bevacizumab is held or stopped rather than dose-reduced'],
  'sources':[source(N738,pages=[1,2,3,4,5,6,7,8]),source(A,pages=[2,28,29])]
 }
}
save('evidence.json',e)
print('Wrote IV provenance and evidence.')
