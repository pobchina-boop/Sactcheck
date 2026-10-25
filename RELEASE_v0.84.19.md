# SACTCheck v0.84.19

Five new full-service breast suites and five retrospective upgrades over committed v0.84.18, Git commit `6c1050b8a2ced301fe770fe67fd518b5a78566e5`. Prepared for review and installation; not committed, pushed or deployed by this session.

## Scope

| NCCP | Regimen | Work |
| --- | --- | --- |
| 00545 | Adjuvant zoledronic acid every six calendar months | New suite |
| 00605 | Talazoparib daily, advanced germline BRCA/HER2-negative disease | New suite |
| 00688 | Atezolizumab + nab-paclitaxel | New suite |
| 00720 | Extended-adjuvant neratinib for one year | New suite |
| 00738 | Bevacizumab + paclitaxel | New suite |
| 00202 | Docetaxel 100 mg/m² every 21 days | Retrospective upgrade |
| 00230 | Nab-paclitaxel 260 mg/m² every 21 days | Retrospective upgrade |
| 00736 | Nab-paclitaxel 100 mg/m² Days 1, 8 and 15 every 28 days | Retrospective upgrade |
| 00743 | Eribulin 1.23 mg/m² base, Days 1 and 15 every 28 days | Retrospective upgrade |
| 00485 | Dose-dense AC → weekly paclitaxel | Retrospective upgrade |

## Connected services

All ten suites connect source-based assessments, clinician rationale and evidence, patient information, medicine-specific body maps, date-free schedules, longitudinal monitoring, consent aids, guides, passports, wallet cards, practical logistics and separate supportive-care plans. Patient information contains no numerical trial prognosis. The maps explain expected care and responsibility; they do not book appointments, confirm completed tests or authorise treatment.

The oral courses, six-monthly infusion and chemotherapy cycles retain different timelines. Neratinib separates first-week liver testing, monthly testing, later six-week liver checks and its three bowel-support periods. Combination visits, taxane-only Days 8 and atezolizumab-only continuation have distinct support. Dose-dense AC retains growth-factor support and cardiac review, with a clear change to weekly paclitaxel.

## Main audit changes

- **00545:** Current v3 source; adjuvant off-label context, endocrine depletion, renal dose bands, creatinine deterioration and recovery, dental risk and calcium/vitamin D exceptions. Baseline/current creatinine are entered once; difference and ratio are calculated only from valid operands. Exact source boundaries remain review decisions. Six calendar months is displayed rather than treating 182 days as an exact booking interval.
- **00605:** Correct continuous breast monotherapy, numeric CrCl bands, blood-count holds/restarts, reduced-dose history, drug interactions and prolonged cytopenia review. No prostate-combination dose or efficacy transfer.
- **00720:** Preserve NCCP CTCAE v4, the printed combined count threshold, duration/recurrence-dependent diarrhoea actions, liver holds and interaction dose history. Severe hepatic/renal NCCP–EMA conflicts and the exact two-day diarrhoea overlap require review, without a definitive calculated dose. Use the NCCP loperamide schedule; CONTROL tolerability evidence does not silently replace it with dose escalation.
- **00688:** Replace the inherited single-agent 1,680 mg schedule with atezolizumab 840 mg on Days 1/15 and nab-paclitaxel 100 mg/m² on Days 1/8/15 every 28 days. Preserve SP142 immune-cell scoring, count-day distinctions, nab-paclitaxel versus immune hepatic pathways, immune attribution of renal injury and thyroid testing every second cycle. No solvent-taxane premedication is imported.
- **00738:** Preserve the 80 mg/m² paclitaxel schedule, bevacizumab blood-pressure/proteinuria and surgery/wound pathways, separate active medicines and first-dose versus later taxane premedication.
- **Retrospective five:** Keep source-specific count and organ thresholds. Prevent 00485 hepatic fixed-dose suggestions from increasing an already lower paclitaxel dose. Distinguish the printed platelet restart boundary after neutropenic versus thrombocytopenic AC delay; missing history remains a review decision. Explicitly attribute supplementary docetaxel cessation and every-dose eribulin FBC guidance to EMA, not NCCP.

Catalogue labels now distinguish prior adjuvant treatment from current advanced-disease intent, response reassessment from overall treatment duration, continuous daily oral dosing from review blocks, and both adjuvant/neoadjuvant uses of the AC–weekly-paclitaxel sequence.

Clinician evidence preserves study populations, endpoints and limitations: EMBRACA PFS versus nonsignificant final OS; descriptive ExteNET subgroup findings; exploratory IMpassion130 subgroup OS; E2100's 90 mg/m² trial dose versus NCCP's 80; class-level bisphosphonate evidence; exact weekly 100 mg/m² nab-paclitaxel cohort data; tolerance-led fortnightly eribulin conversion; and separate CALGB9741/E1199 component evidence.

## Coverage and next phase

There are now **99 authored platform suites**, including **71/71 enabled entries categorised exactly as Breast in the current local catalogue**. Shared/multisite entries are outside that denominator. Fifty-six suites have undergone the current rationale/evidence review; **43 platform retrospective reviews remain, including 15 Breast entries**.

This is local-catalogue completion, not a claim that every current HSE regimen is included. The current HSE metastatic-breast list includes **00947 capivasertib + fulvestrant** outside the frozen 71-entry catalogue. Reconcile the live catalogue and licensing/source changes before declaring current national coverage complete.

Suggested retrospective sequence:

1. Endocrine foundations: 00253, 00254, 00361, 00371 and 00376.
2. Endocrine combinations: 00322, 00414, 00525, 00619 and 00892.
3. Remaining HER2/ADC pathways: 00272, 00285, 00776, 00794 and 00936.

## Verification and review limits

The package contains source audits, 783 integrated source scenarios, 13 arithmetic guard checks, integration/regression evidence, 87 PDFs over 157 pages, 40 QR checks and preservation of 2,900 out-of-scope patient/data/compatibility files. All downloadable PDFs match their compatibility copies. See `validation/breast-final-v08419/INTEGRATION_REVIEW.md` for final test results and limitations.

The permanent feasibility notice remains. Independent consultant, oncology-pharmacy and patient/PPI review is pending; source reconciliation and software checks do not authorise routine clinical use or establish reimbursement/preferred treatment selection.

## Installation

1. Start from committed v0.84.18.
2. Extract the ZIP and merge its contents into the repository root containing `index.html` and `package.json`. Replace matching files and retain other files. Do not add an extra enclosing directory or upload the ZIP itself as the website.
3. Review, commit and push using `COMMIT_v0.84.19.txt`. After the hosting build, check the displayed version is v0.84.19.
4. Spot-check 00545 baseline/current creatinine, 00688 combination/Day 8/continuation, 00720 support periods and 00485 phase changes.

No deletions are required. The ZIP contains complete changed/new files and a SHA256 manifest. Downloaded source documents, preview configuration, dependencies and build output are excluded.
