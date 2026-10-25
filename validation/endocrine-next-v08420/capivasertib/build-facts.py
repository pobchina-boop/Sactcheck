"""Audited non-prescribing service content for NCCP00947v1; no production writes."""
from pathlib import Path
import hashlib,json
H=Path(__file__).resolve().parent
DATE='2026-10-25'
N='https://healthservice.hse.ie/documents/10966/00947_Capivasertib_Fulvestrant.pdf'
T='https://www.ema.europa.eu/en/documents/product-information/truqap-epar-product-information_en.pdf'
F='https://www.ema.europa.eu/en/documents/product-information/faslodex-epar-product-information_en.pdf'
P='https://www.nejm.org/doi/full/10.1056/NEJMoa2214131'
O='https://www.esmoopen.com/article/S2059-7029%2826%2901382-7/fulltext'
def src(url=N,page=None,section=None):
 d={'url':url,'checked':DATE}
 if page is not None:d['page']=page
 if section:d['section']=section
 return d
def fact(text,*sources):return {'text':text,'sources':list(sources) or [src()]}
facts={
 'code':'00947','checked':DATE,'title':'Capivasertib + fulvestrant','release':'0.84.20',
 'regimen_class':'Oral AKT inhibitor plus injected endocrine therapy; not cytotoxic chemotherapy',
 'scope':fact('Adults with ER-positive, HER2-negative locally advanced or metastatic breast cancer with a validated PIK3CA, AKT1 or PTEN alteration, after recurrence/progression on or after an endocrine regimen. NCCP eligibility includes ECOG 0–2. This is not an unrestricted HR-positive breast regimen.',src(page=1),src(page=2)),
 'patient_purpose':fact('This combination aims to control advanced breast cancer. Capivasertib blocks a growth signal inside cancer cells and fulvestrant reduces signalling through the oestrogen receptor. Tumour testing helps identify people whose cancer has a relevant pathway alteration.',src(page=1),src(T,15,'5.1'),src(F,8,'5.1')),
 'patient_why':fact('The medicines work on different signals involved in hormone-sensitive cancer. Your team chooses the combination using the cancer tests, earlier treatment and your health, and checks both benefit and side effects as treatment continues.',src(page=1),src(T,15,'5.1')),
 'patient_agents':[
  {'id':'capivasertib','name':'Capivasertib','brand':'Truqap','type':'Targeted AKT inhibitor','alias':'Tablets twice daily for four days, followed by three days without these tablets, every week','explanation':'Blocks AKT1, AKT2 and AKT3, proteins that help carry growth and survival signals inside cells. PIK3CA/AKT1/PTEN alterations can activate this pathway.','risks':['Diarrhoea, dehydration and salt imbalance','Raised blood sugar or diabetes; rarely a dangerous ketone/acidity problem called diabetic ketoacidosis','Rash, itch or severe skin reactions','Nausea, vomiting, sore mouth, reduced appetite and tiredness','Changes in blood counts or kidney/liver tests, assessed by the team'],'sources':[src(T,7,'4.4'),src(T,12,'4.8'),src(T,15,'5.1'),src(page=9)]},
  {'id':'fulvestrant','name':'Fulvestrant','brand':'Product supplied may vary','type':'Oestrogen-receptor antagonist and degrader','alias':'Two injections into the buttock muscles at each treatment visit','explanation':'Attaches to oestrogen receptors and reduces their number, making it harder for oestrogen to stimulate hormone-sensitive breast cancer.','risks':['Pain, bruising or bleeding at the injection sites; rarely nerve injury symptoms','Hot flushes and joint or muscle discomfort','Nausea, tiredness and changes in liver tests','Allergic reactions; discuss pregnancy prevention and fertility'],'sources':[src(F,4,'4.4'),src(F,6,'4.8'),src(F,8,'5.1'),src(page=10)]}
 ],
 'schedule':{
  'cycle_length_days':28,'duration':'Continue while it is helping and side effects remain acceptable; no fixed number of cycles is specified.',
  'capivasertib':'Usual initial dose 400 mg twice daily, approximately 12 hours apart, on cycle days 1–4, 8–11, 15–18 and 22–25. Each week has four dosing days and three days off. Prescriber reductions are 320 mg then 200 mg twice daily on the same pattern.',
  'fulvestrant':'500 mg intramuscularly as two 5 mL injections, one in each buttock, slowly over 1–2 minutes per injection. Cycle 1: days 1 and 15. Cycle 2 onward: day 1 of each 28-day cycle.',
  'phases':[{'id':'cycle1','label':'First cycle: loading injection','capivasertib_days':[1,2,3,4,8,9,10,11,15,16,17,18,22,23,24,25],'fulvestrant_days':[1,15]},{'id':'continuation','label':'Continuing cycles','capivasertib_days':[1,2,3,4,8,9,10,11,15,16,17,18,22,23,24,25],'fulvestrant_days':[1]}],
  'sources':[src(page=1),src(page=5),src(T,3,'4.2')],
  'display_warning':'The three capivasertib-free days recur every week; do not display seven-day continuous tablets or a 21-days-on/7-days-off cycle. Fulvestrant is IM, not IV. A capivasertib interruption does not automatically cancel or restart the fulvestrant loading schedule.'
 },
 'oral_medicine_instructions':[
  fact('Take capivasertib with or without food and swallow the tablets whole with water. Do not chew, crush, split or dissolve them. Avoid grapefruit and grapefruit juice.',src(page=1)),
  fact('If a capivasertib dose is late, it may be taken within 4 hours of its usual time, leaving at least 8 hours before the next dose. If more than 4 hours late, skip it and take the next dose at the usual time. Do not double a dose.',src(page=1),src(T,3,'4.2')),
  fact('If you vomit after a dose, do not take an extra dose; take the next scheduled dose at its usual time. Contact the team if vomiting continues or prevents fluids or medicines.',src(T,3,'4.2')),
  fact('Your actual prescription may be lower than the usual starting dose. A new interacting medicine, a treatment pause or stopping an interacting medicine must be reviewed before the capivasertib dose changes.',src(page=5),src(page=8))
 ],
 'monitoring':[
  {'phase':'before_start','items':['Confirm ER/HER2 and the qualifying gene alteration with a validated test; review earlier endocrine progression and performance status.','Check full blood count, renal profile and liver profile.','Check fasting glucose and HbA1c, optimise blood sugar and agree the monitoring/diabetes plan.','Review all prescription, over-the-counter and herbal medicines for interactions.','Dental assessment when clinically indicated; review current or previous bone-modifying medicines.','Confirm reproductive status, LHRH plan where applicable and pregnancy prevention.'],'sources':[src(page=1),src(page=2),src(page=3)]},
  {'phase':'weeks_1_2_4_6_8','items':['Fasting glucose at weeks 1, 2, 4, 6 and 8, preferably before the capivasertib dose on day 3 or 4 of a dosing week.','Regular monitoring or self-monitoring is more frequent in the first four weeks, particularly the first two, according to the treating team.','Patients with diabetes: daily fasting-glucose monitoring for the first two weeks, then as often as needed.','An additional HbA1c at week 4 is recommended for diabetes, prediabetes or baseline hyperglycaemia.'],'sources':[src(page=4)]},
  {'phase':'continuing','items':['Fasting glucose monthly after week 8; use the agreed day 3 or 4 pre-dose sampling plan.','HbA1c every three months, and additional testing when clinically indicated.','Full blood count, renal and liver profiles before every cycle.','Review skin, diarrhoea, hydration, glucose symptoms, medicines and injection tolerance.','Dental assessment for possible jaw symptoms when clinically indicated.','Cancer response scans and other tests follow the individual consultant treatment plan; NCCP does not supply a fixed scan or echocardiogram interval.'],'sources':[src(page=3),src(page=4)]},
  {'phase':'if_hyperglycaemia','items':['Fasting glucose at least twice weekly, including capivasertib dosing and non-dosing days, until back to baseline.','Consider diabetes specialist review; ketones and other metabolic tests are indicated when clinically appropriate.','While receiving anti-diabetic medication, fasting glucose at least weekly for two months, then every two weeks or as clinically indicated.','When metformin is initiated with capivasertib, monitor creatinine weekly for up to three weeks, then on day 1 of each cycle.'],'sources':[src(page=3),src(page=4),src(page=6)]}
 ],
 'support':{
  'emetogenic_risk':'Oral minimal-to-low risk; follow local policy.',
  'routine_premedication':'None usually required. Do not import cytotoxic antiemetic dexamethasone/aprepitant routines into this regimen.',
  'diarrhoea':fact('Have the agreed anti-diarrhoea plan available before starting. NCCP gives loperamide 4 mg at first onset, then 2 mg after each loose stool, up to 16 mg in a day. Increase oral fluids and contact the team promptly for severe or persistent diarrhoea, inability to drink, dizziness, reduced urine or palpitations. Secondary prevention can be considered for recurrent diarrhoea.',src(page=8),src(page=9)),
  'rash':fact('Report new rash promptly. Emollients, antihistamines and topical steroids depend on grade and dermatology advice. Early dermatology advice is recommended. Ongoing antihistamines and/or topical steroids may be considered as secondary prevention after persistent or previous grade 3 rash; this is not mandatory routine prophylaxis for everyone.',src(page=7),src(page=8),src(page=10)),
  'diabetes':fact('Use the individual written glucose and diabetes-medicine plan. The source suggests metformin on capivasertib dosing days and withdrawal when capivasertib is withdrawn unless otherwise clinically indicated. This must be reconciled with pre-existing diabetes treatment: do not tell all patients to stop their usual diabetes medicines on the three capivasertib-free days. Watch for low glucose as well as high glucose on non-dosing days.',src(page=6)),
  'interaction_review':fact('Strong CYP3A4 inhibitors should be avoided where possible; strong/moderate inhibitors require capivasertib dose review. Strong/moderate CYP3A4 inducers should be avoided. Reconcile medicines affecting narrow-therapeutic-index CYP or UGT substrates and sensitive transport substrates. Dose decisions must preserve earlier toxicity reductions.',src(page=8),src(T,10,'4.5'),src(T,11,'4.5'))
 },
 'body_map':[
  {'area':'Blood sugar / whole body','symptoms':'Unusual thirst, more or larger amounts of urine, increased hunger with weight loss; urgent advice for new symptoms.','agents':['capivasertib'],'sources':[src(page=9)]},
  {'area':'Emergency metabolic symptoms','symptoms':'Vomiting or abdominal pain with breathing difficulty, fruity breath, confusion or marked sleepiness can be diabetic ketoacidosis. Seek emergency medical assessment; suspected DKA requires immediate capivasertib interruption by the clinical pathway. Do not wait for a very high glucose reading.','agents':['capivasertib'],'sources':[src(page=9)]},
  {'area':'Bowels / hydration','symptoms':'Diarrhoea, thirst, dizziness, low urine, weakness or palpitations may need urgent review and fluid/electrolyte treatment.','agents':['capivasertib'],'sources':[src(page=9)]},
  {'area':'Skin / mouth','symptoms':'New rash, itch, mouth soreness; urgent assessment for blistering, peeling or mucosal involvement.','agents':['capivasertib'],'sources':[src(page=7),src(page=10),src(T,12,'4.8')]},
  {'area':'Injection sites / leg','symptoms':'Bruising or pain at the buttock injection sites; tell the team about unusual bleeding, persistent radiating leg pain, numbness or weakness.','agents':['fulvestrant'],'sources':[src(page=2),src(page=10),src(F,4,'4.4')]},
  {'area':'Jaw / teeth','symptoms':'Report new or worsening mouth or jaw pain, swelling, loose teeth or a wound that is not healing, particularly with bisphosphonate or RANK-ligand inhibitor treatment.','agents':['capivasertib_with_bone_modifying_agent'],'sources':[src(page=10)]}
 ],
 'consent':{
  'purpose':'Control of biomarker-selected advanced breast cancer; treatment is reviewed for benefit and tolerability, without a fixed curative course.',
  'key_risks':['High glucose, new or worsening diabetes and potentially fatal diabetic ketoacidosis','Diarrhoea causing dehydration, electrolyte imbalance, kidney injury or arrhythmia','Rash and potentially serious skin reactions','Nausea, vomiting, mouth soreness, tiredness and appetite change','Fulvestrant injection pain/bleeding and possible nerve symptoms; extra caution with anticoagulants or low platelets','Effects on pregnancy, breastfeeding and fertility; medicine interactions and monitoring burden'],
  'reproduction':fact('Effective contraception is required during treatment. NCCP specifies at least 4 weeks after capivasertib for females and 16 weeks for males, and 2 years after the last fulvestrant dose. The combination plan for women must therefore reflect the longer fulvestrant period. Pregnancy and breastfeeding are excluded. Discuss individual fertility and contraception needs with the team.',src(page=2),src(page=9),src(F,4,'4.6')),
  'ovarian_suppression':fact('In pre- or perimenopausal women combine treatment with an LHRH agonist. For men, consider an LHRH agonist according to practice standards. Do not infer suppression from age alone. Fulvestrant can cause falsely high results with antibody-based estradiol assays; confirm the assay before changing the suppression plan.',src(page=1),src(F,4,'4.4')),
  'evidence_language':'Clinical trial results support a delay in progression in the selected altered population. Final 2026 survival analysis did not establish an overall-survival benefit. Explain uncertainty and alternatives individually; keep numerical trial results on the clinician evidence surface.',
  'sources':[src(page=1),src(page=9),src(page=10),src(P),src(O)]
 },
 'logistics':{
  'visits':'Two fulvestrant injection visits in the first cycle, then one every 28 days. Glucose and other monitoring can create extra checks between injection visits.',
  'access':'No IV port, infusion or take-home pump is required by this two-medicine regimen. Additional treatments may have separate arrangements.',
  'supply':'Capivasertib tablet strengths are 160 mg and 200 mg. The team confirms the correct number and strength for the prescribed dose; retain the recurring four-day/three-day calendar.',
  'timeline':'Show planned weeks and cycle days without requiring patients to enter dates. Show glucose checks separately from injection visits and distinguish baseline HbA1c from repeated fasting glucose.',
  'dental':'Use clinical indication and symptoms; avoid suggesting a dental procedure is required before every cycle.',
  'sources':[src(page=1),src(page=3),src(page=4),src(page=5)]
 },
 'clinical_boundaries':[
  fact('ANC 1.0 x10^9/L and platelets 100 x10^9/L are day-1 thresholds for the safety of fulvestrant IM injection. Lower values need consultant review. They are not a capivasertib myelosuppression algorithm.',src(page=5)),
  fact('NCCP fulvestrant Child-Pugh B guidance gives 250 mg, while current EMA Faslodex specifies no adjustment in mild/moderate impairment with caution. Preserve both recommendations in review text and block a definitive automatic dose.',src(page=5),src(F,3,'4.2')),
  fact('Severe renal/hepatic impairment is excluded for the combination. A permissive renal statement for fulvestrant alone does not override capivasertib restrictions. The renal cutoff uses creatinine clearance; do not silently substitute indexed eGFR.',src(page=2),src(page=5),src(T,19,'5.2')),
  fact('Use fasting glucose numerical thresholds from the NCCP CTCAE v4.03 table. Diarrhoea, skin and general toxicity tables use CTCAE v5.0. Retain event peak grade, current grade, time to recovery and actual current dose before discussing restart.',src(page=6),src(page=7),src(page=8)),
  fact('Suspected DKA requires immediate capivasertib interruption; confirmed DKA requires permanent discontinuation regardless of the current glucose value. Grade 4 fasting hyperglycaemia has a separate 24-hour reassessment/persistence rule.',src(page=6),src(page=9))
 ],
 'clinical_use_authorised':False,'consultant_reviewed':False,'oncology_pharmacy_reviewed':False
}

evidence={
 'code':'00947','checked':DATE,'audience':'clinician_only','numerical_outcomes_patient_surfaces':False,
 'trial':'CAPItello-291','design':'Phase III randomised double-blind placebo-controlled comparison of capivasertib plus fulvestrant versus placebo plus fulvestrant.',
 'population':'HR-positive/HER2-negative advanced breast cancer after progression during or after aromatase-inhibitor treatment, with or without a CDK4/6 inhibitor. The trial enrolled 708 patients; the PIK3CA/AKT1/PTEN-altered population comprised 289 (155 versus 134). NCCP00947 is restricted to the qualifying altered population.',
 'clinical_takeaway':'The combination improved progression-free survival in the biomarker-altered group. Final overall survival in 2026 was not significantly improved; do not claim a demonstrated survival advantage or retain an outdated OS-immature label.',
 'outcomes':[
  {'endpoint':'Investigator-assessed progression-free survival','population':'PIK3CA/AKT1/PTEN-altered','analysis':'Primary analysis, published 2023','capivasertib_fulvestrant_median_months':7.3,'placebo_fulvestrant_median_months':3.1,'hazard_ratio':0.50,'confidence_interval_95':[0.38,0.65],'p_value':'<0.001','interpretation':'Dual primary endpoint met. The median is a group summary, not a prediction for an individual.','sources':[src(P),src(T,17,'5.1')]},
  {'endpoint':'Overall survival','population':'PIK3CA/AKT1/PTEN-altered','analysis':'Final analysis; ESMO Breast 2026 abstract 417O, ESMO Open 11(suppl 4):107440','capivasertib_fulvestrant_median_months':28.5,'placebo_fulvestrant_median_months':30.4,'hazard_ratio':0.83,'confidence_interval_95':[0.63,1.10],'p_value':'0.201','interpretation':'Not statistically significant. Do not claim a survival gain, and do not interpret the numerically different medians as proof of harm or a precise expected lifespan.','sources':[src(O)]}
 ],
 'context_only':{'all_comer_pfs':'The original overall population also met the PFS endpoint, but this does not expand the NCCP indication beyond qualifying alterations.','overall_os':'The final abstract reports overall-population OS HR 1.00 (95% CI 0.83–1.19); this provides no established survival advantage. The clinician card should lead with the indicated altered population.','sources':[src(P),src(O)]},
 'limitations':['Placebo plus fulvestrant is the trial comparator; there is no head-to-head basis here to rank capivasertib against other modern targeted/endocrine regimens.','Final OS is a secondary endpoint and was not significantly improved. The final source is a congress abstract, distinct from the 2023 full primary PFS report.','The trial enrolled ECOG 0–1, while NCCP eligibility extends to 0–2; evidence is less direct for performance status 2.','Type 1 diabetes, Type 2 diabetes requiring insulin and HbA1c >8% were not studied; do not treat this evidence gap as an invented absolute NCCP exclusion.','Do not blend the unselected trial population with the indicated altered subgroup, or give these numerical outcome estimates on patient-facing guides.'],
 'primary_sources':[
  {'title':'Turner NC et al. Capivasertib in Hormone Receptor-Positive Advanced Breast Cancer. NEJM 2023;388:2058–2070.','url':P,'doi':'10.1056/NEJMoa2214131','status':'Primary randomised trial report; data also verified in current EMA Truqap section 5.1.'},
  {'title':'Rugo HS et al. Final overall survival results from phase III CAPItello-291. ESMO Breast 2026, abstract 417O. ESMO Open 11(suppl 4):107440.','url':O,'doi':'10.1016/j.esmoop.2026.107440','status':'Primary congress abstract: official indexed abstract title, medians, HR/CI/P and conclusion retrieved. Direct full-text/PDF access returned HTTP403; this limitation is not hidden.'},
  {'title':'EMA Truqap product information, section 5.1','url':T,'status':'Current regulator-hosted primary product information; PFS and trial eligibility verified.'}
 ],
 'retrieval_note':'The official ESMO Open search index exposes altered-population medians 28.5/30.4, HR 0.83 (0.63–1.10), P=.201 and the conclusion that OS was not significantly improved. A visual reproduction of the original trial result table in public ResearchToPractice slides page 89 corroborates these numbers but is not used as the primary evidence citation.',
 'clinical_use_authorised':False
}
research=Path('/workspace/scratch/bca730129437/research-v20')
sources={
 'regimen':'00947','checked':DATE,'release':'0.84.20',
 'source_documents':[
  {'id':'nccp00947v1','title':'NCCP Capivasertib and Fulvestrant Therapy','url':N,'version':1,'published':'2026-08-04','review_due':'2027-08-04','pages':11,'sha256':hashlib.sha256((research/'00947-capivasertib-fulvestrant.pdf').read_bytes()).hexdigest(),'retrieval':'Official public PDF; downloaded successfully with ordinary browser User-Agent after default urllib returned403. Full text and all11 rendered pages reviewed; table pages4–7 inspected individually.','scope':'Indication, administration, monitoring, dose modifications, support and complications.'},
  {'id':'ema_truqap_current','title':'EMA Truqap product information','url':T,'sha256':hashlib.sha256((research/'truqap-ema.pdf').read_bytes()).hexdigest(),'pages':41,'version':'Current public product information retrieved2026-10-25','scope':'Sections4.2–4.8 and5.1–5.2; glucose-monitoring safety, special populations, missed/vomited doses, interactions, contraceptive advice, mechanism and primary efficacy.'},
  {'id':'ema_faslodex_current','title':'EMA Faslodex product information','url':F,'version':'Current public product information retrieved2026-10-25','sha256':hashlib.sha256((research/'faslodex-ema.pdf').read_bytes()).hexdigest(),'pages':36,'scope':'Sections4.2,4.4,4.6,4.8,5.1: hepatic conflict, injection safety, estradiol assay interference, contraception and mechanism.'},
  {'id':'capitello291_primary','title':'Turner et al., NEJM2023','url':P,'doi':'10.1056/NEJMoa2214131','scope':'Primary PFS report; numerical facts corroborated in EMA5.1.'},
  {'id':'capitello291_final_os','title':'Rugo et al., ESMO Breast2026 abstract417O','url':O,'doi':'10.1016/j.esmoop.2026.107440','scope':'Final OS in the altered population','access_limitation':'Official search-index abstract text retrieved; direct article/PDF403. Numerical medians/HR/CI/P and conclusion independently visible in indexed primary abstract.'}
 ],
 'source_issues':[
  {'topic':'Fulvestrant hepatic impairment','nccp':'Table3, page5, Child-PughB:50%/250mg.','ema':'Section4.2: mild/moderate hepatic impairment needs no adjustment, with caution.','resolution':'Explicit source-conflict review; no definitive automatic fulvestrant dose.'},
  {'topic':'Severe renal impairment','nccp':'Whole-regimen exclusion page2, despite fulvestrant-alone Table3 statement expected no reduction at CrCl<30/haemodialysis.','resolution':'Retain whole-combination exclusion; distinguish creatinine clearance from indexed eGFR. SevereCrCl<30 definition supplemented from EMA5.2.'},
  {'topic':'Toxicity grading','nccp':'Hyperglycaemia CTCAEv4.03, versus other toxicity tables CTCAEv5.0.','resolution':'Use source numerical glucose cutoffs8.9/13.9/27.8 with fasting qualifier; distinct grade fields for other events.'},
  {'topic':'Monitoring table cross-reference','nccp':'Page4 hyperglycaemia paragraph refers to Table5, but glucose modifications are Table4; Table5 is diarrhoea.','resolution':'Cite Table4/page6 and preserve content, not the typographic cross-reference error.'},
  {'topic':'Conditional decisions','nccp':'Grade2 diarrhoea interruption and recurrent intolerable grade3 rash stopping depend on clinical judgement; rashG3 after28days says discontinue, whereas diarrhoeaG3 explicitly says permanently discontinue.','resolution':'Keep conditional review and source action distinctions; never invent a generic28-day stop for all toxicities.'},
  {'topic':'Metformin on/off days','nccp':'Page6 footnote includes an unless-otherwise-clinically-indicated exception.','resolution':'Individual diabetes plan; no blanket withdrawal of established anti-diabetic treatment.'},
  {'topic':'Final overall survival','resolution':'2026finalOSnotstatisticallysignificant; remove staleOSimmaturewording and do not claim established survival benefit.'}
 ],
 'clinical_use_authorised':False
}
for name,obj in [('service-facts.json',facts),('evidence.json',evidence),('sources.json',sources)]:
 (H/name).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
print('Wrote service facts, evidence and source register.')
