"""Authored, source-checked clinician content for the five v0.84.47 additions.

Writes only new release content and explicit integration proposals. Does not
alter shared data, generators, protocol decisions or patient source profiles.
"""
from pathlib import Path
import json, hashlib

ROOT = Path(__file__).resolve().parents[3]
OUT = Path(__file__).resolve().parent
DATE = '2026-11-10'
STATUS = 'Source reconciled draft; independent clinical, oncology-pharmacy and patient/PPI review pending'
NCIS = 'https://healthservice.hse.ie/documents/7180/Supportive_Care_Antiemetics_for_inclusion_NCIS_Medical_Oncology.pdf'
EMA = 'https://www.ema.europa.eu/en/documents/product-information/erbitux-epar-product-information_en.pdf'
codes = ['00314', '00552', '00417', '00418', '00696']
protocols = {c:json.loads(next((ROOT/'protocols/head-neck').glob(c+'-*.json')).read_text()) for c in codes}
urls = {c:p['metadata']['source_url'] for c,p in protocols.items()}

def source(c):
    return {'label':f'NCCP {c} v{protocols[c]["metadata"]["nccp_version"]} · current official regimen','url':urls[c]}

general_support = [
    'Arrange nutrition, weight and swallowing review early. Dietitian and speech and language therapy input should follow the person’s needs; swallowing safety cannot be inferred from a general leaflet.',
    'Use the agreed mouth-care and dental plan. Report painful swallowing, mouth ulceration, weight loss or inability to drink before the next appointment.',
    'Reconcile prescription, over-the-counter and complementary medicines. Discuss fertility, contraception and breastfeeding using the actual products and individual circumstances.',
    'Confirm the hospital’s urgent contact and fever instructions. Infection, bleeding, severe diarrhoea, dehydration, chest pain or new breathlessness need prompt assessment, not the next routine review.'
]
fu_support = [
    'Record the DPD result before the first fluorouracil exposure unless previously tested. Complete deficiency precludes fluorouracil; partial deficiency needs an individual starting dose and careful subsequent review.',
    'Normal DPD testing cannot exclude all severe fluorouracil toxicity. Explain unexpectedly early or severe diarrhoea, mucositis, neurological symptoms and chest pain.',
    'Write the actual infusion option, access arrangement, bag or pump changes and disconnect time. Do not equate four treatment days with a single universal pump duration.',
    'Provide an individually prescribed diarrhoea plan and hand/foot care advice; severe or persistent symptoms require assessment rather than repeated self-treatment.'
]
cetu_support = [
    'Give an antihistamine and a corticosteroid at least one hour before cetuximab; continue this premedication at subsequent doses. Reconcile steroids with any antiemetic prescription to avoid duplication.',
    'Ask specifically about earlier antibody reactions, red-meat allergy, tick bites and any cetuximab IgE result. Premedication does not eliminate severe or delayed reactions.',
    'Use a local EGFR-inhibitor skin plan, moisturiser and sun protection; assess painful, infected or intolerable rash and nail changes promptly.',
    'NCCP allows observation to cease after two reaction-free cetuximab doses, whereas current Erbitux SmPC section 4.2 requires monitoring during and for at least one hour after each infusion. Agree and document the governed observation plan; do not automatically remove observation.'
]
cis_support = [
    'Prescribe regimen-specific hydration and electrolyte replacement with fluid-balance review. The appropriate volume depends on kidney and cardiac status; a generic printed plan is not an intravenous-fluid prescription.',
    'Review hearing, tinnitus and peripheral nerve symptoms before each cycle; damage can persist. Review nephrotoxic, ototoxic and other interacting medicines.'
]
carbo_support = [
    'Carboplatin dosing uses the selected AUC and a verified absolute kidney-function estimate in mL/min. Indexed laboratory eGFR must not be substituted directly into Calvert dosing.',
    'Check the kidney-function method, creatinine timing, prior platinum exposure and any previous hypersensitivity. Severe low counts and renal impairment may change the next treatment plan.'
]

config = {
'00314': {
 'title':'Cisplatin + fluorouracil · 28-day cycle',
 'setting':'Locally advanced or metastatic head and neck cancer under NCCP 00314; confirm the individual treatment aim and relationship to any separately planned local treatment.',
 'purpose':'Cisplatin and fluorouracil are used together to treat head and neck cancer. The team explains whether the individual aim is disease control or part of a wider locally advanced treatment plan; this source does not define a fixed radiotherapy sequence.',
 'mechanism':'Cisplatin creates DNA cross-links; fluorouracil interferes with nucleotide metabolism and DNA/RNA synthesis. Their different mechanisms can reduce tumour growth but also damage rapidly renewing marrow and mucosal cells. Renal clearance, DPD metabolism and previous toxicity influence safe exposure.',
 'schedule':'Cisplatin 25 mg/m² and fluorouracil 1,000 mg/m²/day are both given on Days 1–4 of each 28-day cycle. Cisplatin is infused over 2 hours with prescribed pre-hydration; fluorouracil runs over 22 hours each day. Continue only while beneficial and tolerated; no fixed total cycle count is specified.',
 'brief':'Both medicines on Days 1–4 · cycle repeated every 28 days · ongoing benefit and safety review.',
 'baseline':['Full blood count, kidney and liver profile; DPD assessment before first fluorouracil unless already tested.','ECG if cardiac function is compromised; audiology and measured creatinine clearance when clinically indicated.','Confirm ECOG 0–2, the source initiation criteria, hearing and neuropathy status, allergies, medicines and pregnancy/breastfeeding precautions.'],
 'cycle':['Full blood count, kidney and liver profile before each cycle.','Review hearing/tinnitus and nerve symptoms, hydration, mouth/bowel toxicity and previous dose changes. Use treatment-day ANC and the platelet history required by the source table.'],
 'ongoing':['Assess for fluorouracil cardiac symptoms and early excessive toxicity during treatment; investigate symptoms without waiting for routine tests.','Scans, examination and follow-up follow the consultant’s treatment plan. This protocol does not mandate a universal imaging or tumour-marker interval.'],
 'after':'Follow persistent renal, hearing, nerve, mouth/bowel and nutritional problems. The team sets disease assessment and any next local or systemic treatment; no automatic radiotherapy or maintenance phase is encoded.',
 'selection':['Source indication; ECOG 0–2; adequate marrow, renal and hepatic function.','Distinguish initiation exclusions from later-cycle modification tables. Baseline creatinine clearance below 60 mL/min, neuropathy grade ≥2 and significant hearing impairment/tinnitus are exclusions.'],
 'cautions':['The source does not give a comparator beside its baseline platelet value of 100 ×10⁹/L; reconcile the eligibility decision rather than inventing one.','Known complete DPD deficiency excludes fluorouracil. Renal impairment can increase uracil and confound DPD phenotyping; consider genotype testing and specialist interpretation.'],
 'boundaries':['Source Table 1 changes fluorouracil, not an automatic whole-regimen percentage: ANC 1–1.5 or platelet nadir 75–100 gives 750 mg/m²/day for four days; lower values give 375 mg/m²/day, subject to consultant review.','Later cisplatin renal table: ≥60 mL/min full dose, 45–59 75%, <45 consultant decision/consider carboplatin. Decimal values between 59 and 60 are not explicitly assigned.','The fluorouracil table leaves bilirubin 85 micromol/L and AST 180 unassigned at equality. Numerical limits and the separate moderate/severe impairment paragraphs require reconciliation; do not infer severity from one lab result.','Grade ≥2 peripheral neuropathy: omit cisplatin and consider carboplatin; the source does not prescribe a generic fluorouracil reduction for this finding.'],
 'support':cis_support+fu_support+general_support,
 'risks':['Serious infection or bleeding from low blood counts','Kidney injury, electrolyte disturbance, hearing loss and nerve damage','Nausea/vomiting, mouth/bowel inflammation and dehydration','Fluorouracil cardiac or early excessive toxicity; hand-foot syndrome','Infusion allergy and reproductive/fertility effects'],
 'phase':'treatment', 'phase_label':'Four-day cisplatin / fluorouracil treatment', 'drugs':['Cisplatin','Fluorouracil'], 'risk':'high'
},
'00552': {
 'title':'Carboplatin + fluorouracil after chemoradiotherapy · nasopharyngeal cancer',
 'setting':'Adjuvant chemotherapy after chemoradiotherapy for locally advanced stage III or IV nasopharyngeal carcinoma when cisplatin is contraindicated or not tolerated.',
 'purpose':'This is the adjuvant systemic-treatment part of a wider nasopharyngeal cancer plan after chemoradiotherapy. It is intended to reduce the risk of cancer returning; the individual benefit and alternatives must be discussed.',
 'mechanism':'Carboplatin damages DNA through cross-linking and fluorouracil interferes with DNA/RNA production. The adjuvant phase addresses cancer cells that may remain after chemoradiotherapy. Kidney function determines carboplatin exposure; DPD activity affects fluorouracil clearance.',
 'schedule':'Begin the adjuvant phase four weeks after NCCP 00419 weekly carboplatin AUC2 with radiotherapy, following recovery. Give carboplatin AUC5 on Day 1 over 30 minutes and fluorouracil 1,000 mg/m²/day over Days 1–4, every 28 days for up to three cycles. Fluorouracil may run continuously over 96 hours or as the source’s daily 22-hour infusions; confirm the selected pump plan.',
 'brief':'After recovery from chemoradiotherapy · start at four weeks · carboplatin Day 1 / fluorouracil Days 1–4 · up to three 28-day cycles.',
 'baseline':['Full blood count, renal and liver profile; isotope GFR preferred or verified kidney-function estimation.','Audiology when indicated; DPD assessment before first fluorouracil unless previously tested.','Confirm recovery, nutrition, swallowing and weight after the preceding chemoradiotherapy.'],
 'cycle':['Full blood count, renal and liver profile before each cycle.','Review oral intake, dysphagia/stomatitis, weight loss from baseline and hand-foot symptoms. Review previous count nadir, fever and platinum reactions.','If formula-based dosing is used, the creatinine should be obtained within 48 hours of administration. If carrying forward an isotope-GFR dose, compare current creatinine with the measurement-time value.'],
 'ongoing':['Dose calculations use GFR capped at 125 mL/min; consider measured GFR when formula estimates are unreliable.','The source specifies clinical assessment of hands and feet when indicated. Disease-monitoring investigations follow the individual treatment plan.'],
 'after':'Review after the planned adjuvant phase, including recovery, swallowing, weight and any persistent hearing or nerve effects. Radiation-related follow-up and imaging have their own agreed schedule; no routine universal blood tumour-marker panel is specified.',
 'selection':['Stage III/IV nasopharyngeal indication, cisplatin unsuitable and recovered from the preceding chemoradiotherapy.','The carboplatin indication is off-label in Ireland under this NCCP document; explain and document this using local governance and consent.'],
 'cautions':['NCCP page 1 correctly names preceding regimen 00419. Page 2 incorrectly labels the same weekly carboplatin/RT treatment as 00417. Retain the discrepancy and confirm the actual preceding treatment; do not link this to cetuximab/cisplatin/fluorouracil.','Known complete DPD deficiency excludes fluorouracil. Interpret uracil phenotyping cautiously with renal impairment; consider genotype testing.','Prior carboplatin hypersensitivity is not a routine rechallenge pathway; any exceptional desensitisation requires specialist governance and resuscitation support.'],
 'boundaries':['Full dose in Table 1 requires ANC ≥1 and platelets ≥100 ×10⁹/L. Intermediate cytopenia delays treatment; severe cytopenia or febrile neutropenia warrants delay and consideration of 25% reductions after recovery.','Do not administer carboplatin at GFR ≤20 mL/min. CrCl <60 increases marrow toxicity risk; verify renal method and current dose rather than applying a generic percentage.','Current v6 fluorouracil hepatic advice differs from older 85/180 tables: no adjustment is expected for mild/moderate impairment without renal impairment; severe impairment is not recommended. Combined renal/hepatic impairment needs review.','Grade 3 dysphagia/stomatitis: delay until improvement then 75–100% by clinical decision; grade 4 discontinue. Weight loss >10% requires nutritional-support assessment, with 75% only if hyperalimentation is instituted, otherwise discontinue. Grade 3 hand-foot syndrome: 75%.'],
 'support':carbo_support+fu_support+general_support,
 'risks':['Low blood counts, serious infection and bleeding','Nausea/vomiting, mouth/throat inflammation, diarrhoea and dehydration','Fluorouracil cardiac/early excessive toxicity and hand-foot syndrome','Platinum allergy, hearing and nerve effects','Nutritional deterioration after chemoradiotherapy; reproductive/fertility effects'],
 'phase':'adjuvant','phase_label':'Post-chemoradiotherapy adjuvant treatment','drugs':['Carboplatin','Fluorouracil'],'risk':'high'
},
'00696': {
 'title':'Paclitaxel Days 1, 8, 15 + cetuximab Days 1, 15 · 28-day cycle',
 'setting':'Recurrent and/or metastatic head and neck squamous cell carcinoma under NCCP 00696.',
 'purpose':'Paclitaxel and cetuximab aim to shrink or slow recurrent or metastatic cancer and help symptoms. The expected benefit, prior therapies and alternatives need an individual discussion.',
 'mechanism':'Paclitaxel stabilises microtubules and disrupts cell division. Cetuximab blocks the epidermal growth factor receptor and can recruit immune-cell effects against tumour cells. Normal nerves, marrow, skin and mucosal tissues may also be affected; the two drugs have different toxicity and dose-modification rules.',
 'schedule':'Repeat every 28 days: cetuximab 500 mg/m² on Days 1 and 15, followed by paclitaxel 80 mg/m² on Days 1, 8 and 15. Paclitaxel is infused over one hour using the specified filter and non-PVC equipment. NCCP permits an initial 100 mg/m² paclitaxel dose only at prescriber discretion. Continue while beneficial and tolerated; there is no fixed total cycle count.',
 'brief':'Day 1: both medicines · Day 8: paclitaxel only · Day 15: both medicines · then planned treatment-free days within a 28-day cycle.',
 'baseline':['Full blood count, renal and liver profile; peripheral neuropathy assessment when indicated.','Review previous antibody reactions, red-meat allergy, tick bites and any cetuximab IgE test.','Confirm ECOG 0–2, organ function, baseline ANC at least 1.5 ×10⁹/L, liver status and pregnancy/breastfeeding precautions.','Current Erbitux product information recommends electrolyte measurement before and periodically during cetuximab; agree magnesium, potassium and calcium monitoring with the local team.'],
 'cycle':['NCCP requires regular full blood count, renal/liver profiles and neuropathy assessment; arrange these for the actual weekly treatment reviews according to the prescribed plan.','Review fever, infections, mouth/bowel effects, rash and nail problems, numbness/weakness and prior paclitaxel dose reductions.','Cetuximab infusion observations and the Day 8 premedication differ from Days 1/15; confirm the visit type before prescribing.'],
 'ongoing':['Record the duration of profound neutropenia, any febrile neutropenia and skin-reaction recurrence/recovery before the next dose decision.','Response assessment is clinician directed. This NCCP regimen does not specify a fixed scanning interval, tumour-marker schedule or numbered end cycle.'],
 'after':'Review persistent neuropathy, skin/nail toxicity, fatigue and blood abnormalities. Continue electrolyte testing as clinically indicated by cetuximab effects and the local plan. NCCP 00696 does not state the separate fixed two-month post-treatment laboratory schedule found in 00417/00418.',
 'selection':['Confirm recurrent/metastatic squamous head and neck cancer and patient-specific suitability. The NCCP indication is wider than the population in the cited post-platinum/post-PD-1 phase II study.','NCCP describes this combination and its posology as off-label in Ireland; explain the actual prescription and current licensing position, and document local approval/consent. Current cetuximab licensing for a fortnightly schedule with platinum does not license the paclitaxel combination.'],
 'cautions':['Severe hepatic impairment, baseline neutrophils <1.5 ×10⁹/L, pregnancy, breastfeeding and relevant hypersensitivity are source exclusions.','ECOG 2 is allowed by NCCP, but the Koyama trial recruited ECOG 0–1; its outcomes must not be presented as established estimates for every eligible NCCP patient.'],
 'boundaries':['Paclitaxel dose history matters: usual 80→65→50 mg/m² reduction levels; a 100 mg/m² starting dose first reduces to 80. Do not reduce cetuximab automatically for paclitaxel cytopenia.','The source has an overlapping platelet boundary at 90 ×10⁹/L and a duration-dependent ANC <0.5 for ≥7 days rule. Missing duration or ambiguous printed boundaries need clinician review.','Paclitaxel hepatic table uses ALT and bilirubin multiples of ULN, with 80/60/40 mg/m² bands; ALT ≥10×ULN or bilirubin >5×ULN is contraindicated. Decimal gaps and the discretionary 100 mg/m² dose need reconciliation.','Grade 2 neuropathy calls for a 10 mg/m² paclitaxel decrease. Other grade 2 non-haematological toxicity requires hold to ≤grade 1, then a 10 mg/m² decrease; grade ≥3 prompts consideration of one-level reduction after recovery.','Cetuximab severe skin reactions require recovery and recurrence tracking: restart at 500/400/300 mg/m² after first/second/third events only if suitable after the allowed hold; fourth occurrence or failed recovery requires discontinuation. Severe infusion reaction and confirmed ILD require permanent cessation.'],
 'support':cetu_support+general_support+['Consider prescribed analgesia for paclitaxel-related muscle/joint pain. Assess neuropathy before it becomes disabling; do not wait for a routine cycle boundary.','Both medicines are low emetic risk in NCCP v2; do not carry forward an unsupported moderate-risk antiemetic schedule. Day 1/15 cetuximab steroid/antihistamine premedication also covers paclitaxel; Day 8 needs its distinct plan.'],
 'risks':['Low blood counts, serious infection, fatigue and hair loss','Peripheral neuropathy which may persist; muscle/joint pain','Cetuximab skin/nail toxicity and electrolyte loss','Immediate or delayed infusion allergy despite premedication','Mouth/bowel inflammation and potentially serious lung toxicity; reproductive effects'],
 'phase':'combination','phase_label':'Days 1 and 15 · both medicines','drugs':['Cetuximab','Paclitaxel'],'risk':'low'
}
}

for c, platinum, duration in [('00417','Cisplatin','22 hours each day'),('00418','Carboplatin','16–22 hours each day')]:
    cis = c=='00417'
    setting = 'Locally advanced or metastatic head and neck squamous cell carcinoma' + ('.' if cis else ' when cisplatin is contraindicated or not tolerated.')
    schedule = ('Cetuximab is given weekly on Days 1, 8 and 15: first dose 400 mg/m² over two hours, then 250 mg/m² over one hour. '+('Cisplatin 100 mg/m² over two hours' if cis else 'Carboplatin AUC5 over 30 minutes')+' is given on Day 1; fluorouracil 1,000 mg/m²/day on Days 1–4. Repeat the combination every 21 days for up to six cycles, stopping earlier for progression or unacceptable toxicity. Fluorouracil uses '+duration+' or the separately prescribed two-infusion alternative described by NCCP. Chemotherapy must start at least one hour after cetuximab ends.')
    config[c] = {
      'title':f'Cetuximab + {platinum.lower()} + fluorouracil · 21-day cycle', 'setting':setting,
      'purpose':'These medicines aim to treat head and neck cancer using a combination of EGFR blockade and chemotherapy. Confirm the individual aim and local-treatment options; the recurrent/metastatic evidence must not be presented as a cure estimate for locally advanced disease.',
      'mechanism':f'Cetuximab blocks EGFR signalling; {platinum.lower()} damages DNA and fluorouracil disrupts nucleotide metabolism. This combines growth-signal inhibition with cytotoxic treatment. Skin, marrow, bowel and electrolyte effects require component-specific monitoring rather than one generic dose reduction.',
      'schedule':schedule,'brief':'Weekly cetuximab · platinum Day 1 / fluorouracil Days 1–4 · up to six 21-day combination cycles.',
      'baseline':['Full blood count, renal and hepatic profile including magnesium; DPD assessment before first fluorouracil unless already tested.','ECG if cardiac function is compromised; audiology when clinically indicated. '+('Creatinine clearance when indicated; assess cisplatin renal fitness, hearing and neuropathy.' if cis else 'Isotope GFR preferred or a verified renal estimate for carboplatin AUC dosing.'),'Review previous antibody/platinum reactions, red-meat allergy, tick bites and any cetuximab IgE result.'],
      'cycle':['Full blood count, renal and liver profile including magnesium before each cycle; review prior platelet nadir and current ANC.','Assess rash/nail problems, bowel/mouth symptoms, hydration, infections and infusion reactions. '+('Ask about hearing and nerve symptoms before each cycle.' if cis else 'Verify current renal method, creatinine timing and carboplatin dose.'),'Allow cetuximab observations and the required one-hour interval before chemotherapy; organise weekly visits separately from the 21-day chemotherapy cycle.'],
      'ongoing':['New or worsening breathing symptoms require assessment and treatment hold for suspected lung toxicity; confirmed ILD requires cetuximab discontinuation.','Replace electrolytes when indicated. Disease-monitoring tests and imaging follow the individual consultant plan.'],
      'after':'Measure electrolytes, magnesium and calcium monthly for two months after the final cetuximab dose, as this NCCP regimen specifies. Follow persistent nutritional, nerve, hearing or organ problems. '+('NCCP 00417 permits consideration of weekly cetuximab maintenance under regimen 00207; this needs a separate agreed prescription and support plan.' if cis else 'NCCP 00418 does not itself specify a maintenance schedule. The current Erbitux SmPC and EXTREME strategy describe cetuximab continuation after platinum in recurrent/metastatic disease; confirm any separately prescribed maintenance plan instead of carrying chemotherapy forward.'),
      'selection':[setting+' Source ECOG 0–2 and adequate marrow/organ function.','The current Erbitux licensed platinum-combination indication is recurrent/metastatic disease. NCCP also names locally advanced disease: confirm exact setting, licensing and local governance. Do not transfer colorectal RAS testing requirements to this head and neck indication.'],
      'cautions':['Baseline ANC >1.5 ×10⁹/L differs from the subsequent-cycle table. The eligibility platelet value 100 is printed without a comparator; confirm with the prescriber.','Known complete DPD deficiency excludes fluorouracil. Partial deficiency needs an individual starting dose; renal impairment may confound uracil phenotyping.','Prior severe cetuximab reaction, confirmed ILD or unresolved intolerable skin toxicity must not be treated as a routine dose-reduction-only problem.'] + (['Baseline CrCl <60 mL/min, pre-existing neuropathy grade ≥2 and significant hearing impairment/tinnitus are cisplatin exclusions.'] if cis else ['Exceptional carboplatin desensitisation after a previous mild reaction needs specialist assessment, controlled conditions and local approval.']),
      'boundaries':['Table 1 overlaps at ANC exactly 1.5 ×10⁹/L; platelet values between 99 and 100 are not explicitly assigned. Record uncertainty rather than returning an automatic full-dose decision.','Severe cytopenia or febrile neutropenia requires delay to recovery and consideration of a 25% chemotherapy reduction; it is not an unconditional simultaneous cetuximab reduction.','Fluorouracil bilirubin exactly 85 micromol/L and AST exactly 180 are not assigned by the printed < and > table. Moderate/severe hepatic impairment has separate clinician-selected starting-dose advice.','Cetuximab severe skin-reaction recurrence changes the weekly restart dose: 250, then 200, then 150 mg/m² after suitable recovery; fourth occurrence or failed recovery means stop. A new first-infusion reaction within 15 minutes requires stopping and risk assessment even if initially mild.'] + (['Later-cycle cisplatin renal table gives ≥60 full dose, 45–59 75% and <45 clinical decision/consider carboplatin. Do not use this table to override an initiation exclusion or silently resolve the decimal gap.','Grade ≥2 neuropathy requires cisplatin omission and consideration of carboplatin.'] if cis else ['Carboplatin GFR ≤20 mL/min: do not administer; <60 increases marrow toxicity risk. Use verified absolute GFR capped at 125 and source-specific creatinine recency/reassessment rules.']),
      'support':cetu_support+(cis_support if cis else carbo_support)+fu_support+general_support,
      'risks':['Low blood counts, serious infection/sepsis and bleeding','Cetuximab skin/nail toxicity, electrolyte loss and severe infusion reactions','Fluorouracil mucositis/diarrhoea, hand-foot syndrome and cardiac/early excessive toxicity',('Cisplatin kidney injury, hearing loss and persistent neuropathy' if cis else 'Carboplatin allergy, marrow suppression, hearing and nerve effects'),'Potentially serious lung toxicity; fertility and reproductive effects'],
      'phase':'combination','phase_label':'Day 1 · combination treatment','drugs':['Cetuximab',platinum,'Fluorouracil'],'risk':'high'
    }

refs = {
 'swog':{'label':'Forastiere et al. JCO 1992 · randomised SWOG trial','url':'https://ascopubs.org/doi/10.1200/JCO.1992.10.8.1245'},
 'npc':{'label':'Chitapanarux et al. EJC 2007 · nasopharyngeal chemoradiation trial','url':'https://pubmed.ncbi.nlm.nih.gov/17467265/'},
 'extreme':{'label':'Vermorken et al. NEJM 2008 · EXTREME','url':'https://www.nejm.org/doi/full/10.1056/NEJMoa0802656'},
 'koyama':{'label':'Koyama et al. ESMO Open 2024 · phase II trial','url':'https://www.sciencedirect.com/science/article/pii/S2059702924012456'},
 'correction':{'label':'Koyama et al. 2024 corrigendum · paronychia counts','url':'https://www.sciencedirect.com/science/article/pii/S2059702924014212'},
 'erbitux':{'label':'EMA Erbitux · current product information','url':EMA},
 'ncis':{'label':'NCCP NCIS antiemetics v8 · Table 1 and multi-day guidance','url':NCIS}
}

evidence = {
 '00314':{'trial':'SWOG / Forastiere 1992 · indirect schedule evidence','population':'277 people with recurrent/metastatic head and neck squamous carcinoma.','comparison':'Cisplatin/FU or carboplatin/FU versus weekly methotrexate.','applicability':'The cisplatin arm used 100 mg/m² Day 1 every 21 days, not NCCP 00314’s 25 mg/m² Days 1–4 every 28 days.','endpoints':[],'qualitative_result':'Combination therapy produced more responses but greater toxicity without a demonstrated overall-survival improvement. No numerical benefit is assigned to the different 00314 schedule.','limitations':['Historical advanced-disease comparison; not evidence of curative benefit or the exact current schedule.','Response, survival and treatment-related harm are different outcomes; cross-trial comparisons do not rank current alternatives.'],'sources':[refs['swog']]},
 '00552':{'trial':'Chitapanarux 2007 · whole chemoradiation/adjuvant strategy','population':'206 people with locally advanced nasopharyngeal cancer; single-centre open randomised study.','comparison':'Cisplatin-based versus carboplatin-based concurrent chemoradiotherapy followed by adjuvant treatment.','applicability':'The trial compared complete treatment strategies. It cannot isolate the additional benefit of the 00552 adjuvant component.','endpoints':[],'qualitative_result':'Carboplatin had better treatment completion, with different toxicity patterns. Published survival estimates concern the whole strategy, not this adjuvant phase alone.','limitations':['As-treated analysis, single-centre design and a combined concurrent/adjuvant intervention limit causal attribution to one phase.','No separate absolute survival benefit is assigned to three adjuvant carboplatin/FU cycles.'],'sources':[refs['npc']]},
 '00696':{'trial':'Koyama 2024 · single-arm phase II','population':'35 previously platinum- and PD-1-treated patients; ECOG 0–1; 33 assessable for response.','comparison':'No randomised comparator; paclitaxel 100 mg/m² Days 1/8/15 plus cetuximab 500 mg/m² Days 1/15 every 28 days.','applicability':'NCCP defaults to paclitaxel 80 mg/m² and a broader indication; trial outcomes are not established at that dose or in every treatment line.','endpoints':[{'endpoint':'ORR','metric':'Objective response','result_text':'23/33 (69.6%; 95% CI 51.2–84.4%).','interpretation':'Tumour response in the study population; not survival gain or cure.','analysis_status':'Single-arm phase II','sources':[refs['koyama']]}],'qualitative_result':'Median progression-free and overall survival were 5.5 and 13.3 months; 23/35 had grade 3–4 adverse events. No comparative survival advantage can be calculated.','limitations':['Small non-randomised selected cohort; different default paclitaxel dose and prior-therapy requirements.','The corrigendum corrects grade 1/2 paronychia to 12/35 (34%); it does not change efficacy.'],'sources':[refs['koyama'],refs['correction']]}
}
for c in ['00417','00418']:
    evidence[c] = {'trial':'EXTREME','population':'442 untreated recurrent/metastatic head and neck squamous carcinoma patients.','comparison':'Platinum/FU with or without cetuximab; cetuximab continuation formed part of the experimental strategy.','applicability':'Cisplatin and carboplatin were alternatives within pooled study groups, not independently randomised platinum comparisons.','endpoints':[{'endpoint':'OS','metric':'Median overall survival','result_text':'10.1 versus 7.4 months; HR 0.80 (95% CI 0.64–0.99).','interpretation':'Whole strategy in the trial population, not a platinum-specific estimate or cure rate.','analysis_status':'Randomised phase III','sources':[refs['extreme']]}],'qualitative_result':'Adding cetuximab improved overall survival in this recurrent/metastatic trial.','limitations':['Not a comparison with modern immunotherapy or proof of benefit for all locally advanced settings.','Do not assign the pooled result separately to cisplatin-only or carboplatin-only patients.'],'sources':[refs['extreme']]}

def med(name,dose,timing,note=''):
    return dict(name=name,dose=dose,timing=timing,note=note)

def antiemetics(carbo=False, cetu=False):
    return [
      med('Aprepitant','125 mg orally Day 1; 80 mg orally Days 2 and 3','Once daily on the stated days','NCIS reference; review interactions and the actual multi-day infusion plan.'),
      med('Ondansetron','16 mg orally Day 1','Before chemotherapy','Clinician may split to 8 mg twice daily or reduce to 8 mg once daily. Review QT risk and electrolytes.'),
      med('Dexamethasone · reconcile total steroid prescription','NCIS reference: 12 mg orally Day 1; 8 mg orally Days 2–4','As prescribed',('Cetuximab also requires a corticosteroid before infusion. One agreed total dose/route must replace duplicate prescriptions.' if cetu else 'Individualise for diabetes, interactions, infection risk and sleep effects.')),
      *([] if carbo else [med('Olanzapine','5 mg orally once daily Days 1–4','As prescribed','General high-risk NCIS row. Review sedation and metabolic/falls risk; metoclopramide combination increases extrapyramidal risk.')]),
      med('Metoclopramide · duration to be specified','10 mg orally three times daily in the NCIS subsequent-days row','Exact duration and indication must be prescribed','The high-risk row does not state an end day or PRN qualifier. Check renal/neurological suitability; avoid unreviewed stacking with other dopamine antagonists.')
    ]

def plan(c,id,label,drugs,risk,medicines,extra):
    return {'id':id,'label':label,'active_medicines':drugs,'emetogenic_risk':risk,'medicines':medicines,
      'additional_support':extra,'prescription_note':'Source-linked clinician/pharmacy draft. Confirm doses, routes, start/stop dates, interactions and the selected visit before authorising; no administration authority.',
      'source_url':urls[c],'source_checked':DATE,'source_page':f'NCCP {c}: treatment and supportive-care sections; NCIS v8 pp4–5 where used',
      'guidance':{'label':f'NCCP {c} and current NCIS/local supportive-care guidance','url':NCIS},'prescription_status':'Incomplete clinician/pharmacy review draft; no administration authority'}

plans = {}
plans['00314'] = [plan('00314','treatment','Days 1–4 · multiday cisplatin / fluorouracil',['Cisplatin','Fluorouracil'],'high',[
    med('Multiday high-risk antiemetics','Prescriber/pharmacist to complete the four-day schedule and delayed cover','Before each treatment day and for two days after the final SACT day under NCIS multiday guidance','Do not apply the single-day Day 1–3 aprepitant course as a complete four-day cisplatin prescription. The separate NCIS five-day cisplatin note does not directly specify this four-day regimen.'),
    med('Cisplatin pre-hydration and electrolytes','Individual prescription required','Before cisplatin on Days 1–4','NCCP offers a suggested saline/magnesium regimen; volume and potassium need individual renal/cardiac and laboratory review.')
],config['00314']['support']+['The regimen is high emetic risk on its four cisplatin days. Review rescue treatment and persistence of sickness between visits; the unfilled schedule is intentional until the prescriber confirms a complete multiday course.'])]
plans['00552'] = [plan('00552','adjuvant','Adjuvant carboplatin / fluorouracil',['Carboplatin','Fluorouracil'],'high',antiemetics(True),config['00552']['support']+['NCIS uses the dedicated carboplatin AUC≥4 antiemetic row. Routine olanzapine is not included in that row. Cover the remaining fluorouracil infusion days according to daily emetic risk and individual response.'])]
for c in ['00417','00418']:
    cis = c=='00417'
    drugs = config[c]['drugs']
    extra = [med('Cetuximab antihistamine','Prescriber/pharmacy to specify agent, dose and route','At least one hour before every cetuximab dose','The 00417/00418 source specifies the class and timing, not a dose. Confirm the total steroid alongside the antiemetic dexamethasone.')]
    if cis: extra.append(med('Cisplatin hydration and electrolytes','Individual pre- and post-hydration prescription required','Before and after Day 1 cisplatin','Source includes suggested saline/magnesium guidance; individualise fluids and potassium.'))
    plans[c]=[plan(c,'combination','Day 1 · cetuximab / platinum / fluorouracil',drugs,'high',antiemetics(not cis,True)+extra,config[c]['support']+['Use this high-risk plan for the platinum treatment day. Do not repeat its full antiemetic course automatically at weekly cetuximab-only visits.'])]
    plans[c].append(plan(c,'cetuximab_only','Days 8 and 15 · cetuximab-only visit within the combination cycle',['Cetuximab'],'low',[
      med('Antihistamine plus corticosteroid','Individual prescribed agent, dose and route','At least one hour before cetuximab','Mandatory infusion premedication. Reconcile any low-risk antiemetic need with this steroid; no automatic platinum prophylaxis.'),
      med('Rescue antiemetic','As individually prescribed','If required','Review persistent nausea; do not reuse the Day 1 platinum course.')
    ],cetu_support+general_support))
plans['00417'].append(plan('00417','maintenance','Separately confirmed cetuximab maintenance · regimen 00207',['Cetuximab'],'low',[
    med('Antihistamine plus corticosteroid','Use the separately authorised 00207 prescription','Before cetuximab as prescribed','Continuation is optional and requires a new agreed plan; do not carry cisplatin hydration or fluorouracil pump prescriptions forward.')
],cetu_support+general_support+['NCCP 00417 allows consideration of maintenance under 00207. Confirm the current monotherapy prescription, dose history and observation requirements.']))
plans['00696'] = [plan('00696','combination','Days 1 and 15 · cetuximab followed by paclitaxel',['Cetuximab','Paclitaxel'],'low',[
    med('Chlorphenamine','10 mg IV','60 minutes before cetuximab','NCCP Table 6; this antihistamine also covers paclitaxel on combined-treatment days. Do not duplicate it.'),
    med('Dexamethasone','8 mg IV','60 minutes before cetuximab','NCCP Table 6; this steroid also covers paclitaxel on Days 1/15. Reconcile total steroid dose and diabetes/sleep advice.'),
    med('Famotidine','20 mg IV','30 minutes before paclitaxel','NCCP Table 7. Consultant may omit after review; the source notes uncertainty about hypersensitivity risk when omitted.'),
    med('Low-risk / rescue antiemetic','Individual prescription','If required after accounting for infusion steroid','No routine moderate-risk course. Persistent symptoms warrant review.')
],config['00696']['support']),
plan('00696','paclitaxel_only','Day 8 · paclitaxel only',['Paclitaxel'],'low',[
    med('Chlorphenamine','10 mg IV','30 minutes before paclitaxel','NCCP Table 7.'),
    med('Famotidine','20 mg IV','30 minutes before paclitaxel','May be omitted only according to consultant guidance and reaction history.'),
    med('Dexamethasone · conditional','No routine Day 8 dose in NCCP Table 7','Add only if increased risk or previous hypersensitivity, under consultant guidance','This differs from the steroid required before cetuximab on Days 1/15. A rechallenge steroid schedule is a separate specialist decision.'),
    med('Low-risk antiemetic reference','Ondansetron 8 mg orally once on the treatment day if selected','Before treatment under the agreed plan','NCIS low-risk reference; individualise QT risk and other medicines. Any rescue medicine and its duration must be prescribed.')
],general_support+['Review neuropathy and previous paclitaxel reactions. Day 8 is a paclitaxel-only visit within the same 28-day cycle, not maintenance or a different course.'])]

profiles=[]
journeys={}
consents={}
for c in codes:
    d=config[c];ev=evidence[c];ev['checked']=DATE
    src=[source(c),refs['ncis']]+([refs['erbitux']] if c in ['00417','00418','00696'] else [])+ev['sources']
    longitudinal={'title':'Treatment and monitoring milestones','columns':['Before starting','Treatment visit','Between visits','Hold / phase review','After treatment'], 'rows':[
        {'label':'Blood and organ tests','cells':[' '.join(d['baseline']),' '.join(d['cycle']),'Additional tests follow new symptoms; report concerns immediately.','Recheck recovery, source-specific dose criteria and previous reductions. Do not restart treatment independently.',d['after']]},
        {'label':'Appointments and treatment','cells':['Confirm diagnosis, intention, prescription and planned start.',d['schedule'],'Use the written medicine, access and urgent-contact plan.','Confirm the active visit or phase; remove medicines that no longer apply.','Record final dose, outstanding symptoms and follow-up.']},
        {'label':'Disease assessment','cells':['Confirm staging and any tumour tests required for the diagnosis.','Clinical response and symptom review.','Imaging follows the consultant plan.','Agree continuation, local treatment or another option.','Keep the individual clinic and imaging schedule.']}
      ],'note':'Milestones are not equally spaced dates. The schedule uses NCCP-required safety tests and separates symptom-led or individually planned investigations.','source_ids':['nccp']}
    profiles.append({'protocol_id':protocols[c]['protocol_id'],'regimen_role':d['title'],'clinical_summary':d['purpose'],'treatment_setting':d['setting'],
      'component_rationale':d['mechanism'],'schedule_context':d['schedule'],'key_points':[d['brief']]+d['boundaries'],
      'treatment_rationale':{'summary':d['purpose'],'setting':d['setting'],'line':'Confirm prior treatment, diagnosis and the individual multidisciplinary plan.','factors':d['selection'],'alternatives':['Discuss other appropriate systemic treatments, local treatment where feasible and symptom-focused care in light of disease setting, biomarkers, previous therapy, organ function and personal priorities.'],'limitations':ev['limitations'],'sources':[source(c)]},
      'patient_selection':{'treatment_intent':d['setting'],'disease_and_biomarker_context':d['selection'],'eligibility_orientation':d['baseline'],'important_cautions':d['cautions']},
      'supportive_care':{'emetogenic_risk':d['risk'],'premedication_and_prophylaxis':[f'{p["label"]}: '+ '; '.join(m['name']+' — '+m['dose']+'; '+m['timing'] for m in p['medicines']) for p in plans[c]],'patient_education':general_support,'special_support':d['support']},
      'monitoring_and_toxicity':{'baseline':d['baseline'],'before_each_cycle':d['cycle'],'ongoing':d['ongoing']+[d['after']],'priority_toxicities':d['risks'],'urgent_review_signals':['Urgent oncology assessment for fever/shaking chills, sudden illness, bleeding, uncontrolled diarrhoea/vomiting, inability to drink, chest pain, new breathing difficulty or severe infusion symptoms. Follow the local urgent-care instructions.'],'longitudinal_schedule':longitudinal},
      'administration':{'cycle_and_sequence':d['schedule'],'route_and_duration':[d['schedule']],'practical_workflow':['Confirm the prescription and today’s medicines against the treatment phase and laboratory review.','Record venous access, any pump/bag change and disconnection arrangements; a four-day infusion may need more than one attendance.','Keep urgent contact details, symptom advice and written take-home prescriptions available.'],'observation_and_access':([cetu_support[-1]] if c in ['00417','00418','00696'] else ['Infusions require suitable access, staff observation and facilities to manage anaphylaxis.'])},
      'review_status':STATUS,'source_checked_date':DATE,'full_suite_release':'0.84.47','schedule_kind':'cytotoxic_targeted_reference' if c in ['00417','00418','00696'] else 'cytotoxic_reference',
      'evidence_at_a_glance':ev,'evidence_audit':{'status':STATUS,'indications_reviewed':[d['setting']],'remaining_uncertainties':d['cautions']+ev['limitations'],'sources':src},'reference_links':src})
    milestones=[{'title':p['label'],'when':('Up to 3 cycles · every 4 weeks' if c=='00552' else 'See the authored visit schedule'),'why':d['purpose'],'clinical':d['schedule'] if i==0 else ('This is a visit-specific support plan within the same cycle.' if p['id']!='maintenance' else 'Cetuximab continuation only after a separately agreed maintenance prescription; no platinum or fluorouracil.'),'action':'Confirm active medicines, written support plan and review criteria.','source_ids':['nccp']} for i,p in enumerate(plans[c])]
    if c=='00552': milestones.insert(0,{'title':'Preceding chemoradiotherapy and recovery','when':'Before this adjuvant regimen · approximately four weeks between phases','why':'The adjuvant phase follows the source-defined weekly carboplatin and radiotherapy pathway.','clinical':'Verify NCCP 00419 and recovery; NCCP 00552 page 2 contains an inconsistent cross-reference which must not redirect to regimen 00417.','action':'Confirm the actual previous treatment and planned adjuvant start.','source_ids':['nccp']})
    journeys[c]={'code':c,'title':d['title']+': treatment and checks','release':'0.84.47','checked':DATE,'status':STATUS,'schedule_type':'relative-educational','has_patient_dates':False,'setting':d['setting'],'summary':d['brief'],'stages':longitudinal['columns'],
      'lanes':[{'label':r['label'],'kind':'monitoring','cells':r['cells'],'source_ids':['nccp'],'note':'Safety tests and disease-response investigations serve different purposes; dates remain individual.'} for r in longitudinal['rows']],
      'milestones':milestones,'clinical_notes':[d['schedule']]+d['boundaries']+[d['after']], 'sources':[{'id':'nccp','title':source(c)['label'],'url':urls[c],'checked':DATE}]+([{'id':'erbitux','title':refs['erbitux']['label'],'url':EMA,'checked':DATE}] if c in ['00417','00418','00696'] else [])}
    consents[c]={'route':c,'protocol_id':protocols[c]['protocol_id'],'title':d['title'],'setting':d['setting'],'purpose':d['purpose'],'schedule':d['schedule'],'source_ids':['nccp'],
      'material_risks':d['risks'],'discussion':'Discuss intended benefit and uncertainty, alternatives, treatment burden, potentially serious or lasting harms, fertility and reproductive precautions, personal priorities and urgent contacts. Use teach-back and the approved local consent process. '+('Explain and document the off-label indication/combination and current licensing position under local policy.' if c in ['00552','00696'] else 'Confirm the exact indication and current licensed/off-label position.'),
      'limitations':ev['limitations'],'support':d['support'],'review_status':STATUS,'approved_clinical':False,'approved_pharmacy':False,'approved_patient_ppi':False}

def write(path,data):
    path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
write(ROOT/'data/regimen-knowledge-base-v08447-addendum.json',{'schema_version':'1.0','release':'0.84.47','regimen_profiles':profiles,'drug_profiles':[],'evidence_records':[]})
context_file=ROOT/'data/phase-support-contexts-v08447.json'
if not context_file.exists(): write(context_file,{'release':'0.84.47','regimens':{}})
write(OUT/'phase-support-updates.json',{'release':'0.84.47','regimens':plans,'context_regimens':{}})
write(OUT/'journey-updates.json',journeys)
write(OUT/'consent-proposals.json',consents)
write(OUT/'consent-shared-data-review.json',{'release':'0.84.47','reviewed_agent_keys':['cisplatin','carboplatin','fluorouracil','cetuximab','paclitaxel'],'agent_profile_changes':{},'reason':'Current generic agent risks already contain the major harms. New indication, DPD, pump/schedule, off-label and phase-specific discussion content belongs to each regimen profile and consent aid; do not rewrite shared risks across unaffected suites.'})
write(OUT/'source-audit.json',{'release':'0.84.47','checked':DATE,'nccp_sources':json.loads((ROOT/'validation/head-neck-v08447/sources/index.json').read_text()),'additional_sources':[refs['ncis'],refs['erbitux'],refs['swog'],refs['npc'],refs['extreme'],refs['koyama'],refs['correction']], 'key_evidence_limits':{c:evidence[c]['limitations'] for c in codes},'source_corrections':[
  '00314 uses split cisplatin25mg/m²Days1–4,q28; citedForastiere trial used100mg/m²Day1,q21. No trial median assigned to the split-dose regimen.',
  '00552 is up to3adjuvantNPC cycles after00419carboplatinRT,not genericmetastaticHN. Sourcep2crossreference00417 conflicts withp1anddrugdescription.',
  '00417/00418 weeklycetux withq21chemotherapy anddifferentdailyFUinfusiondurations. EXTREME outcomes pooledplatinums andincludedcetuxcontinuation.',
  '00696 usualpaclitaxel80 differs fromKoyama100;phaseIIpostplatinum/postPD1 population narrowerthanNCCP. Corrigendum changesG1/2paronychia12/35.',
  'Cetuximab post-infusionobservation source discrepancy: currentEMA>=1h everyinfusion versusNCCPpermission toceaseafter2tolerated. Requiregovernedreconciliation.',
  'NCISmultiday guidance notdirectsingle-day extrapolation; four-daycisplatin plan deliberately requires completedprescription. Combinedcetux/taxolpremednotduplicated.'
], 'status':STATUS,'full_service_integration':'Proposals require root integration, generation and validation; this authoring pass is not a release pass.'})
print('Authored five clinician profiles and complete integration proposals.')
