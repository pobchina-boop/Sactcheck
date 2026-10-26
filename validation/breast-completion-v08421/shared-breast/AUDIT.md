# Shared breast retrospective and schedule-gap proposals — v0.84.21

Checked 25 October 2026. These are source-reconciled authoring proposals, not clinical or pharmacy approval. All approval flags remain false. No live protocol, patient content, source-routing file or assessment rule has been edited by this bounded task.

## Deliverables and integration

- `authoring.json`: six code-keyed entries using the v0.84.20 canonical authoring schema. Contains complete patient JSON, clinician rationale, evidence, baseline and continuing monitoring, relative treatment journey, selector, supportive-care plans, route and emetogenic-risk mapping.
- `proposed/00526-schedule.json` and `proposed/00798-schedule.json`: full protocol copies with only structured treatment schedules and schedule provenance added. Existing rule engines, inputs, indications, supportive-care content and governance are unchanged.
- `sources.json`: downloaded official source URLs, SHA-256 hashes, page counts and source versions. Source PDFs/text are in the sibling scratch research directory `research-v21-shared`; the release should preserve the hashes and audit, not rely on that temporary path.
- `check-proposals.cjs`: 414 passing checks covering canonical fields, source references, evidence renderer compatibility, absence of numerical trial outcomes in patient content, stable identities, breast scope and source-specific schedules. These are proposal/source checks, not 414 new assessment cases.
- `build-proposals.py`: reproducible bounded generator. It only writes this proposal directory.

The parent integration builder must resolve protocols in both `protocols/breast` and `protocols/shared`. The v0.84.20 builder's breast-only glob is insufficient for 00226 and 00588. Preserve the dedicated 00588 targeted service renderer and `patient/00588/scope.html` gateway; do not replace them with a generic cytotoxic route.

## Current-source reconciliation

| Code | Current source | Breast scope and main checks |
|---|---|---|
| 00203 | NCCP v7; 5 pages | Advanced breast indication 00203h. Docetaxel 75 mg/m² Day 1 every 21 days. Baseline and pre-cycle FBC, renal/liver profile. Dexamethasone and fluid-retention/neuropathy checks. The six-cycle maximum is NSCLC-specific, not a breast maximum. |
| 00205 | NCCP v8; 5 pages | Metastatic breast 00205a; retain other source cancers. PLD 50 mg/m² every 28 days. Baseline ECG/LVEF plus regular ECG and risk/exposure-based LVEF; mandatory LVEF before further doses exceeding lifetime cumulative anthracycline 450 mg/m². |
| 00226 | NCCP v9; 6 pages | Metastatic breast after anthracycline failure or unsuitability. 80 mg/m² Days 1, 8, 15 and 22 every 28 days; consultant-selected three-dose alternative remains explicit. Blood and organ tests before each treatment; neuropathy review. |
| 00228 | NCCP v8; 6 pages | Previously treated advanced breast after at least one chemotherapy regimen for advanced disease, prior anthracycline/taxane unless unsuitable. Eribulin base 1.23 mg/m² Days 1 and 8 every 21 days. Halaven SmPC supplies the before-every-dose FBC requirement, including Day 8. ECG/electrolytes are risk-directed. |
| 00588 | NCCP v5b; 7 pages | Only adjuvant breast indication 00588h in this patient suite. One-year continuous tablet course after chemotherapy/local treatment; germline BRCA1/2, HER2-negative and source high-risk criteria required. FBC, renal/liver profile every four weeks throughout the year. |
| 00621 | NCCP v3; 5 pages | Metastatic breast 00621b; preserve other source indications. 80 mg/m² Days 1, 8, 15 every 28 days; no routine Day 22 dose. Blood/organ tests before each treatment. Stable protocol ID remains `nccp-00621-v9`; this pre-existing identity is not a claim that the PDF is v9. |
| 00526 | NCCP v5; 9 pages | Schedule-only addition. Source pages 1–3 distinguish IV and oral vinorelbine alternatives and antibody loading/maintenance. |
| 00798 | NCCP v3; 8 pages | Schedule-only addition. Source pages 1–3 distinguish IV and oral vinorelbine alternatives and fixed-dose SC Phesgo loading/maintenance. |

All eight downloaded NCCP versions match repository metadata. Current supplementary product documents were retrieved from EMA (Taxotere, Caelyx, Halaven, Lynparza, Phesgo) and HPRA (conventional paclitaxel, PA2315/115/001, revision 9 January 2026). Conventional paclitaxel is not albumin-bound paclitaxel.

## Confirmed defects addressed in proposals

1. **Wrong product references:** 00203 and 00621 patient source `smpc` pointed to EMA Herceptin. They now point to Taxotere and HPRA conventional paclitaxel respectively. Paclitaxel monotherapy does not inherit the trastuzumab routine three-month echo schedule.
2. **Numerical trial outcomes leaked into patient material:** 00226 had response/neuropathy comparison metrics; 00228 had numerical OS in both evidence and a chapter; 00588 retained four-/six-year outcomes in a chapter. All six proposals use qualitative patient benefit with `metrics: []`, including chapter content. Numeric outcomes reside in the clinician evidence object.
3. **00226 lacked complete longitudinal service data:** added baseline/ongoing/full-course monitoring, practical plan, anatomy, two explicit weekly schedule alternatives, reusable symptom records and longitudinal selector state.
4. **Misleading monotherapy monitoring headings:** removed phase-change/12-week column assumptions from relevant taxane monotherapy cards; follow source treatment reviews, pauses and continuation instead.
5. **00588 duplicate surveillance row:** combined the existing duplicate breast-surveillance rows, retaining annual imaging of remaining breast tissue and symptom-directed investigation. No automatic asymptomatic CT/tumour-marker or olaparib-specific echo/DXA calendar is introduced.
6. **Missing clinician schedules:** the two vinorelbine/HER2 combinations now have four complete tables: IV route Cycle 1, IV route Cycle 2+, oral route Cycle 1, oral route Cycle 2+. These are two alternative route plans, not four sequential treatment phases.

## Evidence boundaries

| Code | Clinician evidence | Boundary retained |
|---|---|---|
| 00203 | Harvey 2006, PMID 17033039: the trial directly included 75 mg/m²; ITT dose-response P=.026 and non-significant ITT TTP trend P=.067; dose-specific toxicity context. | The retrieved primary abstract does not provide a 75 mg/m² response percentage or an absolute survival benefit. These are not invented or borrowed from 100 mg/m² or other cancers. |
| 00205 | O’Brien 2004, PMID 14998846: PFS 6.9 vs 7.8 months, HR 1.00; OS 21 vs 22 months, HR 0.94. | First-line MBC with normal baseline cardiac function; lower cardiac toxicity is not cardiac safety in established heart disease. |
| 00226 | CALGB 9840, PMID 18375893: response 42% vs 29%; grade 3 sensory neuropathy 24% vs 12%. | Mixed trastuzumab context; historical metastatic-breast schedule comparison. No transplant of weekly results into the planned three-of-four-week card or other cancers. |
| 00228 | EMBRACE, PMID 21376385: OS 13.1 vs 10.6 months, HR 0.81 (95% CI 0.66–0.99). | More heavily pretreated than the entire current indication; no transfer to liposarcoma, a 28-day schedule or every earlier line. Base/mesylate equivalence remains explicit. |
| 00588 | OlympiA six-year primary update, Garber et al., DOI 10.1016/j.annonc.2026.08.002: iDFS 79.6% vs 70.3%, HR 0.65; OS 87.5% vs 83.2%, HR 0.72. | Selected high-risk germline BRCA1/2 HER2-negative early disease. Published absolute differences use unrounded estimates; long follow-up does not extend the one-year treatment course. |
| 00621 | Exact NCCP schedule/rationale with an explicit evidence gap. | No verified exact-schedule randomized breast efficacy estimate was retrieved. Empty endpoint array is intentional and is rendered as qualitative evidence. |

Numeric outcomes are source-specific clinical context, not an individual prediction or a cross-trial ranking. In particular, do not fill the intentional 00621 gap by copying CALGB values.

## Two schedule-only changes

- Both exact source indications remain HER2-positive metastatic or locally recurrent unresectable breast cancer, without prior anti-HER2 treatment or chemotherapy for metastatic disease, when taxanes are unsuitable. Neither indication is broadened.
- 00526: pertuzumab 840 mg IV / trastuzumab 8 mg/kg IV on Cycle 1 Day 1, then 420 mg / 6 mg/kg on Cycle 2+ Day 1. Antibodies may be administered in either order, before vinorelbine. The proposal lists one permitted order; it does not require an unsupported order.
- 00798: Phesgo 1200 mg/600 mg SC on Cycle 1 Day 1 over eight minutes, then 600 mg/600 mg over five minutes. Observe 30/15 minutes **after** injection and complete observation before chemotherapy.
- IV vinorelbine: 25 mg/m² on Days 1 and 8 in Cycle 1, then 30 mg/m² on Days 1 and 8 in Cycle 2+. Source footnote allows 35 mg/m² only at treating physician discretion; this is not the default.
- Oral vinorelbine: 60 mg/m², maximum 120 mg, on Days 1 and 8 for both loading and maintenance tables. Only if well tolerated may a consultant consider 80 mg/m² from Cycle 2 or 3; the source BSA table reaches 160 mg. **No automatic escalation**, no Day 15 dose and no combined oral-plus-IV dose.
- Oral capsules are taken whole with food; do not repeat after vomiting. IV vinorelbine administration/flush and route-specific safety text are distinct. Existing source/product blood-count and hepatic ambiguities remain in the pre-existing rules and audit limitations.

## Clinical-rule and approval status

No new assessment-rule correction was justified by this bounded audit. Existing source-specific thresholds and ambiguity guards are preserved. Weekly conventional paclitaxel NCCP guidance differs from generic product information in premedication and some retreatment thresholds; this requires local product/pharmacy reconciliation, not a silent replacement of NCCP weekly rules with a three-weekly SmPC schedule. The authoring explicitly records the boundary.

The parent release still needs integration, existing assessment regression tests, rendered patient/clinician review, download/PDF/QR checks and cumulative release checks. Independent consultant, oncology-pharmacy and patient/PPI approval remain pending.
