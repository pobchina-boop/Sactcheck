"""Build clinician-only evidence profiles; does not modify application files."""
import json
from pathlib import Path

OUT = Path(__file__).resolve().parent
CHECKED = '2026-10-21'
def source(label, url):
    return {'label': label, 'url': url}

S = {
    '00785': source('NCCP 00785 v3 — Phesgo maintenance', 'https://healthservice.hse.ie/documents/6659/785_v3_Pertuzumab_trastuzumab_Phesgo.pdf'),
    '00796': source('NCCP 00796 v4 — Phesgo and docetaxel', 'https://healthservice.hse.ie/documents/6419/796_v4_PertuzumabTrasDoc_Phesgo.pdf'),
    '00797': source('NCCP 00797 v4 — Phesgo and weekly paclitaxel', 'https://healthservice.hse.ie/documents/6420/797_v4_PertuzumabTrasPhesgo_PACLitaxel.pdf'),
    '00789': source('NCCP 00789 v3 — TCHP / Phesgo', 'https://healthservice.hse.ie/documents/6447/789_v3_TCHP_Phesgo.pdf'),
    '00790': source('NCCP 00790 v3 — TRAIN-2 / Phesgo', 'https://healthservice.hse.ie/documents/6442/790_v3_Phesgo_PACLitaxel_CARBOplatin.pdf'),
    'fed': source('FeDeriCa — Tan et al., Lancet Oncology 2021 (PK route bridge)', 'https://pubmed.ncbi.nlm.nih.gov/33357420/'),
    'cleo_os': source('CLEOPATRA — Swain et al., Lancet Oncology 2020 (end-of-study OS)', 'https://pubmed.ncbi.nlm.nih.gov/32171426/'),
    'cleo_pfs': source('CLEOPATRA — Baselga et al., NEJM 2012 (primary PFS)', 'https://pubmed.ncbi.nlm.nih.gov/22149875/'),
    'weekly': source('Weekly paclitaxel / HP — Wang et al., Oncologist 2019 (5-year follow-up)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6693713/'),
    'try': source('TRYPHAENA — Schneeweiss et al., Annals of Oncology 2013', 'https://pubmed.ncbi.nlm.nih.gov/23704196/'),
    'train_pcr': source('TRAIN-2 — van Ramshorst et al., Lancet Oncology 2018 (primary pCR)', 'https://pubmed.ncbi.nlm.nih.gov/30413379/'),
    'train_efs': source('TRAIN-2 — van der Voort et al., JAMA Oncology 2021 (secondary survival analysis)', 'https://jamanetwork.com/journals/jamaoncology/fullarticle/2780055'),
    'db09': source('DESTINY-Breast09 — Tolaney et al., NEJM 2026', 'https://pubmed.ncbi.nlm.nih.gov/41160818/'),
    'patina': source('PATINA — Metzger et al., NEJM 2026', 'https://pubmed.ncbi.nlm.nih.gov/41604639/'),
    'db11': source('DESTINY-Breast11 — Harbeck et al., Annals of Oncology 2026', 'https://pubmed.ncbi.nlm.nih.gov/41130363/'),
    'katherine': source('KATHERINE — Geyer et al., NEJM 2025', 'https://pubmed.ncbi.nlm.nih.gov/39813643/'),
    'db05': source('DESTINY-Breast05 — Loibl et al., NEJM 2026', 'https://pubmed.ncbi.nlm.nih.gov/41370739/'),
}

def refs(*keys):
    return [S[k] for k in keys]

ROUTE = 'FeDeriCa supports subcutaneous administration through pharmacokinetic non-inferiority in early breast cancer; it does not establish an additional survival benefit from changing the administration route.'
ACCESS = 'Alternatives require current NCCP, local access and individual MDT review; trial publication alone does not establish Irish availability or authorize a change to this regimen.'
ADVANCED_ALTERNATIVE = 'DESTINY-Breast09 provides newer first-line evidence for trastuzumab deruxtecan plus pertuzumab versus taxane/trastuzumab/pertuzumab, with improved PFS and important interstitial lung disease risk. This is a separate treatment choice, not an automatic replacement during stable maintenance.'
NEO_ALTERNATIVES = [
    'Choose the taxane/platinum backbone using disease risk, comorbidity, neuropathy, marrow reserve and treatment burden. TRYPHAENA and TRAIN-2 are different studies; cross-trial response percentages cannot rank their regimens.',
    'DESTINY-Breast11 reports newer neoadjuvant pCR evidence for trastuzumab deruxtecan followed by THP versus ddAC followed by THP. It did not directly compare against this NCCP regimen; survival results were immature in that report.',
    'Reassess after surgery. Residual invasive disease can change the postoperative strategy: KATHERINE supports T-DM1 over trastuzumab, while DESTINY-Breast05 provides newer T-DXd versus T-DM1 evidence in a selected high-risk residual-disease population, with additional lung toxicity considerations. These decisions are separate from this neoadjuvant card.'
]

def cleo_endpoints(maintenance=False):
    limits = 'Entire induction-plus-continuation strategy; no separate maintenance randomization. IV antibodies were studied, not Phesgo.' if maintenance else 'IV antibodies were studied. These results do not isolate the contribution of Phesgo administration or determine the optimal duration of docetaxel.'
    return [
        {
            'endpoint':'OS', 'metric':'Median OS from randomization — whole CLEOPATRA strategy',
            'intervention_value':57.1, 'comparator_value':40.8, 'unit':' months',
            'intervention_label':'Pertuzumab + trastuzumab + docetaxel strategy',
            'comparator_label':'Placebo + trastuzumab + docetaxel strategy',
            'definition':'Time from randomization to death from any cause.',
            'interpretation':'Historical strategy-level survival benefit; not a maintenance-only or SC-route survival estimate.',
            'analysis_status':'Descriptive end-of-study analysis, 2020 publication',
            'followup':'Median follow-up 99.9 versus 98.7 months; cutoff 23 November 2018',
            'hr':'0.69', 'ci':'0.58–0.82', 'limitations':limits,
            'sources':refs('cleo_os')
        },
        {
            'endpoint':'PFS', 'metric':'Primary independently assessed median PFS — whole strategy',
            'intervention_value':18.5, 'comparator_value':12.4, 'unit':' months',
            'intervention_label':'Pertuzumab + trastuzumab + docetaxel strategy',
            'comparator_label':'Placebo + trastuzumab + docetaxel strategy',
            'definition':'Time from randomization to progression or death, under the primary trial assessment.',
            'interpretation':'Improved PFS in the original randomized comparison; not an individual prediction.',
            'analysis_status':'Primary PFS analysis, 2012 publication',
            'followup':'Original analysis; a different cutoff from the end-of-study OS card',
            'hr':'0.62', 'ci':'0.51–0.75', 'limitations':limits,
            'sources':refs('cleo_pfs')
        }
    ]

profiles = {}
profiles['00785'] = {
 'treatment_rationale': {
    'summary':'Continues dual HER2 blockade after the chemotherapy component has ended in responding advanced disease. Phesgo combines the two antibodies in a subcutaneous injection; this is an antibody-only maintenance phase.',
    'setting':'HER2-positive metastatic or locally recurrent unresectable breast cancer',
    'line':'Continuation after prior pertuzumab/trastuzumab plus chemotherapy; not a new first-line induction or an adjuvant regimen',
    'factors':['Confirm continued disease control, prior treatment and the reason chemotherapy ended.','Review cardiac function, antibody tolerability and patient preference for the administration route.','For hormone-receptor-positive disease, review the endocrine component of the maintenance plan.'],
    'alternatives':['IV pertuzumab plus trastuzumab offers an alternative administration route.','PATINA tested adding palbociclib to maintenance HER2-targeted plus endocrine therapy in HR-positive/HER2-positive disease after induction without progression. It improved PFS with substantially more neutropenia; this is a separate, eligibility-dependent regimen.',ADVANCED_ALTERNATIVE],
    'limitations':ACCESS,
    'sources':refs('00785','fed','cleo_os','patina','db09')
 },
 'evidence_at_a_glance': {
    'trial':'CLEOPATRA strategy evidence + FeDeriCa route bridge',
    'population':'CLEOPATRA: 808 patients with untreated HER2-positive metastatic disease; ECOG 0–1',
    'comparison':'IV pertuzumab/trastuzumab/docetaxel versus placebo/trastuzumab/docetaxel, followed by antibody continuation.',
    'applicability':'These numbers concern the complete randomized induction-and-continuation strategy. CLEOPATRA did not randomize patients when chemotherapy stopped; no separate survival gain for maintenance Phesgo can be calculated.',
    'endpoints':cleo_endpoints(True),
    'qualitative_result':ROUTE,
    'harms':'During antibody-only maintenance, focus on cardiac dysfunction, diarrhoea and injection/hypersensitivity reactions. Chemotherapy-phase neutropenia or alopecia rates do not describe this phase.',
    'limitations':['Do not relabel induction trial medians as time gained after starting maintenance.','The original randomized chemotherapy backbone was docetaxel; continuation after another backbone does not inherit a separately measured survival effect.','PATINA concerns HR-positive disease and an additional endocrine/CDK4/6 strategy, not Phesgo alone.'],
    'checked':CHECKED, 'sources':refs('00785','cleo_os','cleo_pfs','fed','patina')
 }
}

profiles['00796'] = {
 'treatment_rationale': {
    'summary':'Combines docetaxel with dual HER2 blockade for first-line advanced HER2-positive disease. Phesgo supplies the antibody component subcutaneously; chemotherapy and later antibody maintenance remain distinct phases.',
    'setting':'HER2-positive metastatic or locally recurrent unresectable breast cancer',
    'line':'No prior anti-HER2 treatment or chemotherapy for metastatic disease under this NCCP indication',
    'factors':['Confirm metastatic treatment history and validated HER2 status.','Balance disease-control needs against docetaxel fitness, neuropathy, marrow and liver function, and cardiac risk.','Plan reassessment and the transition to antibody-only treatment when the chemotherapy component finishes.'],
    'alternatives':['NCCP 00797 is the weekly-paclitaxel alternative when docetaxel is unsuitable or not tolerated, subject to its specific indication and consent requirements.','IV antibody administration is an alternative route; Phesgo has not been shown to add survival beyond the same antibodies given IV.',ADVANCED_ALTERNATIVE],
    'limitations':ACCESS,
    'sources':refs('00796','00797','cleo_os','fed','db09')
 },
 'evidence_at_a_glance': {
    'trial':'CLEOPATRA randomized phase III + FeDeriCa route bridge',
    'population':'CLEOPATRA: 808 patients with previously untreated HER2-positive metastatic disease; ECOG 0–1',
    'comparison':'IV pertuzumab/trastuzumab/docetaxel versus placebo/trastuzumab/docetaxel; antibodies continued after chemotherapy.',
    'applicability':'The chemotherapy backbone and advanced-disease setting are relevant. CLEOPATRA used IV antibodies; its survival estimates describe the whole strategy, not a separate Phesgo trial.',
    'endpoints':cleo_endpoints(),
    'qualitative_result':ROUTE,
    'harms':'Docetaxel adds marrow suppression, febrile neutropenia and neuropathy; dual HER2 treatment adds diarrhoea and cardiac monitoring needs. Reassess the toxicity profile after chemotherapy ends.',
    'limitations':['Do not transfer these medians to the neoadjuvant setting or to weekly paclitaxel as an identical-backbone estimate.','Newer first-line evidence means historical CLEOPATRA results alone should not imply universal preference over all current alternatives.'],
    'checked':CHECKED, 'sources':refs('00796','cleo_os','cleo_pfs','fed','db09')
 }
}

profiles['00797'] = {
 'treatment_rationale': {
    'summary':'Uses weekly paclitaxel with dual HER2 blockade when docetaxel is unsuitable or poorly tolerated in first-line advanced disease. Weekly visits, neuropathy and marrow reserve remain important trade-offs.',
    'setting':'HER2-positive metastatic or locally recurrent unresectable breast cancer',
    'line':'NCCP first-line metastatic indication with a documented docetaxel suitability or intolerance issue',
    'factors':['Confirm the NCCP restriction on prior metastatic anti-HER2 therapy/chemotherapy and document why docetaxel is unsuitable.','Discuss weekly treatment attendance and pre-existing neuropathy.','The NCCP document identifies the Phesgo/paclitaxel indication as unlicensed in Ireland; follow the specified local information, consent and governance process.'],
    'alternatives':['Docetaxel with dual blockade has phase III CLEOPATRA evidence when clinically suitable.','The weekly-paclitaxel phase II evidence supports activity but cannot establish superiority or equivalence to docetaxel.',ADVANCED_ALTERNATIVE],
    'limitations':ACCESS,
    'sources':refs('00797','weekly','cleo_pfs','fed','db09')
 },
 'evidence_at_a_glance': {
    'trial':'Weekly paclitaxel + IV trastuzumab/pertuzumab phase II — 5-year follow-up',
    'population':'69 enrolled: 51 first-line and 18 second-line metastatic patients; 67 efficacy-evaluable',
    'comparison':'Single-arm study; no randomized comparator.',
    'applicability':'Closer chemotherapy-backbone evidence than CLEOPATRA, but the trial mixed first and second lines and used IV antibodies. NCCP 00797 has a narrower first-line indication.',
    'endpoints':[
      {'endpoint':'PFS','metric':'Median PFS — single-arm estimate',
       'result_text':'24.2 months overall (95% CI 17–35); first-line subgroup 25.7 months (95% CI 17.0–not reached).',
       'definition':'Time from treatment initiation to progression or death under the study definition.',
       'interpretation':'Evidence of activity, not a measured advantage over another regimen.',
       'analysis_status':'Updated phase II analysis, 2019 publication',
       'followup':'Median 59 months; cutoff 21 August 2017',
       'limitations':'Small, nonrandomized cohort. Median OS was not reached overall; this does not quantify a survival benefit. Do not compare the PFS median directly with CLEOPATRA.',
       'sources':refs('weekly')},
      {'endpoint':'PFS','metric':'Six-month PFS — primary endpoint',
       'result_text':'86% (95% CI 76–93%) in the efficacy-evaluable study population.',
       'definition':'Proportion alive without progression at six months after treatment initiation.',
       'interpretation':'A landmark estimate from the same single-arm study, not a second independent treatment benefit.',
       'analysis_status':'Primary endpoint reported with extended follow-up',
       'followup':'2017 cutoff; mixed first- and second-line cohort',
       'limitations':'No control arm; not an estimate for every patient meeting the narrower NCCP indication.',
       'sources':refs('weekly')}
    ],
    'qualitative_result':ROUTE,
    'harms':'Paclitaxel contributes neuropathy, marrow suppression and infusion hypersensitivity; the antibody component requires cardiac and injection-reaction assessment.',
    'limitations':['CLEOPATRA survival medians are not presented as if measured with this paclitaxel/Phesgo combination.','Phesgo route bridging does not remove the NCCP indication-specific consent requirement.','DESTINY-Breast09 informs current first-line alternatives; its results are not effects measured for this single-arm Phesgo/paclitaxel profile.'],
    'checked':CHECKED, 'sources':refs('00797','weekly','fed')
 }
}

profiles['00789'] = {
 'treatment_rationale': {
    'summary':'Provides anthracycline-free docetaxel/carboplatin chemotherapy with dual HER2 blockade before surgery for higher-risk HER2-positive disease. Surgical pathology then informs the separate postoperative plan.',
    'setting':'Neoadjuvant locally advanced, inflammatory or high-risk early HER2-positive breast cancer',
    'line':'Preoperative treatment; six 21-day cycles in NCCP 00789, followed by surgery and a reviewed adjuvant plan',
    'factors':['Use disease stage, nodal burden, tumour biology and fitness to justify treatment intensity.','Review cardiac function, renal dosing assessment, marrow reserve, neuropathy and infection risk.','Explain chemotherapy, surgery, postoperative HER2 therapy, radiotherapy and endocrine therapy as separate phases when indicated.'],
    'alternatives':NEO_ALTERNATIVES,
    'limitations':ACCESS,
    'sources':refs('00789','try','fed','db11','katherine','db05')
 },
 'evidence_at_a_glance': {
    'trial':'TRYPHAENA phase II cardiac-safety study + FeDeriCa route bridge',
    'population':'225 randomized across three neoadjuvant arms, including six-cycle TCHP',
    'comparison':'TCHP arm shown descriptively; the study was designed around cardiac safety, not a definitive efficacy ranking of chemotherapy backbones.',
    'applicability':'TRYPHAENA is the relevant docetaxel/carboplatin backbone study. It used IV antibodies. Its breast-only pCR definition differs from breast-and-node pCR and does not measure survival.',
    'endpoints':[
      {'endpoint':'pCR','metric':'Breast-only pathological response — TCHP arm',
       'result_text':'66.2% achieved ypT0/is after neoadjuvant TCHP.',
       'definition':'No residual invasive tumour in the breast; residual in-situ disease permitted. This displayed endpoint does not require node negativity.',
       'interpretation':'Descriptive response rate; not a cure rate or a comparative survival advantage.',
       'analysis_status':'Secondary efficacy endpoint in a phase II cardiac-safety study, 2013 publication',
       'followup':'Pathology assessed at surgery after six neoadjuvant cycles',
       'limitations':'Small treatment arm and no powered efficacy comparison. Do not compare numerically with TRAIN-2 breast-and-axilla pCR.',
       'sources':refs('try')}
    ],
    'qualitative_result':ROUTE,
    'harms':'Docetaxel/carboplatin adds myelosuppression, infection risk, neuropathy and gastrointestinal toxicity. Anthracycline avoidance does not remove the need for cardiac surveillance during HER2 therapy.',
    'limitations':['No OS improvement attributable specifically to six-cycle Phesgo/TCHP is inferred from these response data.','TRAIN-2 survival estimates belong to another trial and schedule and are not copied into this profile.','DESTINY-Breast11 used a different comparator; KATHERINE and DESTINY-Breast05 concern postoperative residual disease. Their effects are not assigned to this TCHP card.'],
    'checked':CHECKED, 'sources':refs('00789','try','fed','db11','katherine','db05')
 }
}

profiles['00790'] = {
 'treatment_rationale': {
    'summary':'Uses an anthracycline-free paclitaxel/carboplatin backbone with dual HER2 blockade before surgery. TRAIN-2 supports the anthracycline-omission strategy, while the NCCP six-cycle schedule is not identical to the original trial schedule.',
    'setting':'Neoadjuvant locally advanced, inflammatory or high-risk early HER2-positive breast cancer',
    'line':'Preoperative treatment; NCCP 00790 specifies six 21-day cycles, then surgery and pathology-directed adjuvant review',
    'factors':['Confirm disease risk, cardiac function, marrow reserve, renal assessment and neuropathy risk.','Day 1 and day 8 chemotherapy visits differ from three-weekly docetaxel TCHP.','Explain that clinical response and surgical pathology guide the subsequent systemic, radiation and endocrine phases.'],
    'alternatives':NEO_ALTERNATIVES,
    'limitations':ACCESS,
    'sources':refs('00790','train_pcr','train_efs','fed','db11','katherine','db05')
 },
 'evidence_at_a_glance': {
    'trial':'TRAIN-2 phase III — original IV-antibody strategy; FeDeriCa route bridge',
    'population':'438 patients with stage II–III HER2-positive breast cancer',
    'comparison':'Nine paclitaxel/carboplatin cycles without anthracyclines versus three FEC then six paclitaxel/carboplatin cycles; both used IV trastuzumab/pertuzumab.',
    'applicability':'Important schedule difference: NCCP 00790 prescribes six cycles; the trial non-anthracycline arm used nine. These outcomes support the strategy but are not direct efficacy estimates for six-cycle Phesgo/00790.',
    'endpoints':[
      {'endpoint':'pCR','metric':'Breast-and-axilla pCR — original trial',
       'intervention_value':68,'comparator_value':67,'unit':'%',
       'intervention_label':'Nine-cycle non-anthracycline arm','comparator_label':'FEC → paclitaxel/carboplatin arm',
       'definition':'ypT0/is ypN0: no invasive tumour in breast or axillary nodes; breast in-situ disease permitted.',
       'interpretation':'Similar observed response; no demonstrated pCR advantage from anthracyclines (P=0.95).',
       'analysis_status':'Primary pCR analysis, 2018 publication',
       'followup':'Surgery endpoint; 418 evaluable patients',
       'limitations':'140/206 without anthracyclines (95% CI 61–74%) and 141/212 with anthracyclines (95% CI 60–73%). This is not proof of survival equivalence or of the NCCP shorter schedule.',
       'sources':refs('train_pcr')},
      {'endpoint':'EFS','metric':'Three-year EFS — descriptive secondary analysis',
       'result_text':'93.6% without anthracyclines versus 92.7% with anthracyclines.',
       'definition':'From randomization to progression causing inoperability, recurrence, secondary primary malignancy or death; contralateral DCIS excluded.',
       'interpretation':'No demonstrated EFS difference; the study was not powered to establish survival equivalence.',
       'analysis_status':'Descriptive secondary analysis, 2021 publication',
       'followup':'Median 48.8 months; 44 EFS events',
       'hr':'0.90','ci':'0.50–1.63',
       'limitations':'Wide uncertainty. Original trial duration, IV administration and postoperative treatment differ from current pathway decisions.',
       'sources':refs('train_efs')}
    ],
    'qualitative_result':ROUTE,
    'harms':'Anthracycline-containing treatment produced more febrile neutropenia and cardiac toxicity in TRAIN-2. The anthracycline-free arm still had substantial marrow suppression, diarrhoea and neuropathy.',
    'limitations':['The six-versus-nine-cycle discrepancy is retained visibly above the outcome cards; no numerical benefit is claimed for shortening treatment.','pCR is a pathological response endpoint, not proof of cure. Survival analyses were descriptive and underpowered.','The original trial predated routine postoperative T-DM1 for residual disease. KATHERINE, DESTINY-Breast05 and newer neoadjuvant DESTINY-Breast11 evidence require separate eligibility and MDT review.'],
    'checked':CHECKED, 'sources':refs('00790','train_pcr','train_efs','fed','db11','katherine','db05')
 }
}

result = {
    'release':'v0.84.15', 'checked':CHECKED,
    'scope':list(profiles), 'audience':'Clinician knowledge base only; no quantitative outcomes in patient or consent content',
    'status':'Source-study evidence checked; requires integration review, not clinical authorization',
    'renderer_schema':'js/treatment-evidence-v08413.js',
    'profiles':profiles,
    'audit':{
        'route_bridge':'FeDeriCa PK non-inferiority is described qualitatively; no invented PK endpoint or survival-equality claim.',
        '00785':'CLEOPATRA induction-plus-continuation is separated from maintenance-only efficacy. PATINA is a separate HR-positive strategy.',
        '00796':'Direct docetaxel-backbone evidence, with IV-to-SC limitation and newer first-line context.',
        '00797':'Single-arm paclitaxel estimates; mixed treatment lines and NCCP unlicensed-indication statement retained.',
        '00789':'TRYPHAENA breast-only ypT0/is endpoint explicitly distinguished from total pCR and survival.',
        '00790':'NCCP six cycles versus trial nine cycles visible; secondary survival analysis not called equivalence.',
        'modern_context':'DESTINY-Breast09, PATINA, DESTINY-Breast11 and DESTINY-Breast05 are contextual evidence, not assumed Irish access or new automated treatment decisions.',
        'sources':'Official HSE PDFs opened directly. Original trial abstracts/full text checked via PubMed/JAMA and Europe PMC official bibliographic API when PubMed page retrieval was incomplete.'
    }
}
(OUT / 'evidence-audit.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
(OUT / 'source-register.json').write_text(json.dumps({'checked':CHECKED,'sources':S},ensure_ascii=False,indent=2)+'\n')
print('Built five clinician-only evidence profiles.')
