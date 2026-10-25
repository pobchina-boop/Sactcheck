"""Clinician-only primary evidence, with schedule and endpoint applicability explicit."""
from pathlib import Path
import json
R=Path(__file__).resolve().parents[1]
p=R/'data/regimen-knowledge-base-v08418-addendum.json';d=json.loads(p.read_text())
def src(label,url):return dict(label=label,url=url)
def outcome(endpoint,metric,result,interpretation,source,**kw):
    return dict(endpoint=endpoint,metric=metric,result_text=result,interpretation=interpretation,analysis_status='Peer-reviewed primary publication',sources=[source],**kw)
cmf=src('Bonadonna et al. · BMJ 2005','https://www.bmj.com/content/330/7485/217')
gc=src('O’Shaughnessy et al. · JCO 2014','https://pubmed.ncbi.nlm.nih.gov/25349301/')
gem=src('Modi et al. · Clin Breast Cancer 2005','https://pubmed.ncbi.nlm.nih.gov/15899073/')
apt=src('Tolaney et al. · APT 10-year analysis','https://pubmed.ncbi.nlm.nih.gov/36858723/')
b31=src('Perez et al. · B-31 / N9831 joint analysis','https://pmc.ncbi.nlm.nih.gov/articles/PMC4226805/')
dense=src('Citron et al. · CALGB 9741','https://pubmed.ncbi.nlm.nih.gov/12668651/')
for k in d['regimen_profiles']:
    c=k['protocol_id'].split('-')[1]
    e=dict(checked='2026-10-25',endpoints=[],limitations=['Historical study populations and treatment options may differ from current practice. These are study results, not a personalised prognosis.'])
    if c in ['00377','00378','00381']:
        e.update(trial='Historical randomised CMF adjuvant studies',population='Separate node-positive and node-negative / ER-negative adjuvant populations',comparison='CMF versus no further systemic therapy; a separate study compared six versus twelve cycles.',sources=[cmf],applicability='NCCP includes adjuvant and metastatic indications. These numerical data are adjuvant evidence; no metastatic survival estimate is assigned.')
        e['limitations']+=['Do not infer equivalence between oral CMF, IV every 28 days and IV every 21 days.','No exact-schedule metastatic numerical outcome was verified.']
        if c=='00377':
            e.update(population='386 women with operable node-positive breast cancer after radical mastectomy',comparison='Twelve cycles of adjuvant CMF versus no further systemic therapy.',qualitative_result='Relapse HR 0.71 (95% CI 0.56–0.91; P=0.005). A separate 324-patient study of premenopausal node-positive women found no evidence that twelve cycles were superior to six; this was not a formal equivalence claim.',applicability='The original efficacy comparison used twelve cycles, not the current NCCP six-cycle adjuvant course. The separate duration study informs the six-cycle strategy.')
            e['endpoints']=[outcome('OS','Death HR 0.79','95% CI 0.63–0.98; P=0.04','Historical reduction in mortality hazard; not an exact six-cycle or metastatic benefit estimate.',cmf,hr=.79,ci='0.63–0.98',followup='Median 28.5 years')]
        elif c=='00381':
            e.update(population='90 women with node-negative, ER-negative breast cancer',comparison='Twelve cycles of IV CMF every three weeks versus no systemic treatment.',qualitative_result='Relapse HR 0.65 (95% CI 0.47–0.90; P=0.009).',applicability='This IV three-week trial used twelve cycles. NCCP specifies eight adjuvant cycles. Do not present the study as a direct trial of the current eight-cycle course.')
            e['endpoints']=[outcome('OS','Death HR 0.65','95% CI 0.47–0.92; P=0.01','Historical adjuvant result in a small restricted population.',cmf,hr=.65,ci='0.47–0.92',followup='Median 20 years')]
        else:e.update(qualitative_result='No comparative numerical benefit estimate for this exact IV 28-day schedule was verified. The NCCP regimen and historical CMF family evidence support discussion, with the route and duration mismatch made explicit.',applicability='Do not transfer oral CMF or IV three-week numerical results to this IV 28-day schedule.')
    elif c=='00430':
        e.update(trial='NCT00938652 · phase III iniparib study',population='519 patients with stage IV / locally recurrent TNBC; no more than two prior metastatic chemotherapy regimens',comparison='Iniparib + gemcitabine/carboplatin (261) versus gemcitabine/carboplatin alone (258).',sources=[gc],applicability='The control backbone matches gemcitabine 1,000 mg/m² and carboplatin AUC2 on Days 1 and 8 every 21 days. The hazard ratios estimate adding iniparib, not the benefit of gemcitabine/carboplatin itself.')
        e['endpoints']=[outcome('OS','HR 0.88','95% CI 0.69–1.12; P=0.28','The addition of iniparib did not meet the prespecified OS criterion.',gc,hr=.88,ci='0.69–1.12'),outcome('PFS','HR 0.79','95% CI 0.65–0.98; P=0.027','The PFS result did not meet the prespecified coprimary significance criterion.',gc,hr=.79,ci='0.65–0.98')]
        e['limitations']+=['Neither coprimary endpoint met its prespecified criterion. Do not portray the add-on comparison as a proven benefit of GC versus another regimen.','No control-arm survival median was imported from a secondary review. NCCP marks this indication off-label; local consent and governance apply.']
        k['patient_selection']['important_cautions'].append('NCCP marks the 00430 indication unlicensed in Ireland: follow the local off-label consent and governance process.')
    elif c=='00749':
        e.update(trial='Modi et al. · single-arm phase II',population='22 enrolled; 18 response-evaluable. Metastatic breast cancer after two to four chemotherapy regimens including anthracycline and taxane.',comparison='No randomised comparator; gemcitabine 800 mg/m² on Days 1, 8 and 15 every 28 days.',sources=[gem],applicability='The dose and visit pattern match NCCP. Study treatment continued until progression; NCCP specifies six to eight cycles unless progression or unacceptable toxicity.')
        e['endpoints']=[outcome('ORR','Partial tumour regression: 3/18 (17%)','95% CI 4–41%; the denominator is 18 response-evaluable patients, not all 22 enrolled.','Evidence of activity with substantial uncertainty; no comparative survival benefit established.',gem,definition='The reported responses were partial tumour regressions among response-evaluable participants. This is not an individual probability of benefit.')]
        e['limitations']+=['Small sample, single-arm design and wide confidence interval. No randomised survival claim or cross-trial ranking.']
    elif c in ['00512','00815']:
        e.update(trial='APT · final 10-year analysis',population='406 treated; resected HER2-positive tumours ≤3 cm, initially node-negative; an amendment allowed one micrometastatic node.',comparison='Single-arm phase II: weekly paclitaxel + weekly IV trastuzumab for 12 weeks, then weekly or three-weekly trastuzumab to complete one year.',sources=[apt],applicability='NCCP 00512 and 00815 remain node-negative indications. '+('00512 follows the weekly combination schedule tested in APT.' if c=='00512' else '00815 uses three-weekly IV or locally approved SC trastuzumab during combination: an NCCP adaptation, not the exact APT combination schedule.'))
        e['endpoints']=[outcome('iDFS','10-year iDFS 91.3%','95% CI 88.3–94.4%','Single-arm outcome; includes invasive recurrences, new contralateral invasive cancers and deaths.',apt,followup='Median 10.8 years'),outcome('OS','10-year OS 94.3%','95% CI 91.8–96.8%','Observed all-cause survival; no comparator or absolute treatment benefit estimate.',apt,followup='Median 10.8 years')]
        e['qualitative_result']='10-year recurrence-free interval was 96.3% (95% CI 94.3–98.3); breast-cancer-specific survival was 98.8% (97.6–100). These endpoints differ from iDFS and OS.'
        e['limitations']+=['No randomised comparator. Do not extrapolate to high-risk node-positive, neoadjuvant or metastatic settings.','The trial allowed ECOG 0–1; NCCP eligibility and individual suitability require separate review.']
    else:
        e.update(trial='B-31 / N9831 · planned joint analysis',population='4,046 randomised patients with operable HER2-positive breast cancer',comparison='AC followed by paclitaxel with versus without trastuzumab.',sources=[b31,dense],applicability='Supports adding trastuzumab to adjuvant AC–taxane therapy. It is not a direct randomised estimate for every dose-dense, q21-antibody or neoadjuvant variant.')
        e['endpoints']=[outcome('OS','10-year OS: 84.0% versus 75.2%','HR 0.63 (95% CI 0.54–0.73)','Benefit of adding trastuzumab in the studied adjuvant population.',b31,hr=.63,ci='0.54–0.73',followup='Median 8.4 years',intervention_value=84,comparator_value=75.2,unit='%',intervention_label='With trastuzumab',comparator_label='Without trastuzumab',timepoint='10 years'),outcome('DFS','10-year DFS: 73.7% versus 62.2%','HR 0.60 (95% CI 0.53–0.68)','A disease-free survival endpoint; not neoadjuvant pathological response.',b31,hr=.60,ci='0.53–0.68',followup='Median 8.4 years',intervention_value=73.7,comparator_value=62.2,unit='%',intervention_label='With trastuzumab',comparator_label='Without trastuzumab',timepoint='10 years')]
        e['qualitative_result']='Separately, CALGB 9741 randomised 2,005 node-positive patients: four-year DFS 82% with dose-dense versus 75% with conventional scheduling (RR 0.74; P=0.010); OS RR 0.69 (P=0.013), median follow-up 36 months. That factorial trial did not include trastuzumab.'
        e['limitations']+=['The CALGB pooled dose-density comparison is not an exact HER2 regimen-specific survival estimate.','No evidence here supports concurrent AC and trastuzumab. Do not relabel adjuvant survival rates as neoadjuvant pCR.']
    e['harms']='Balance efficacy with the regimen’s drug-specific toxicity, cardiac/organ monitoring and treatment burden; see the source-linked assessment and monitoring sections.'
    k['evidence_at_a_glance']=e;k['reference_links']+=e['sources']
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
print('Ten clinician evidence panels authored; patient numerical evidence remains empty.')
