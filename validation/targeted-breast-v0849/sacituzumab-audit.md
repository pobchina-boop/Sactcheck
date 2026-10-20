# Sacituzumab govitecan — NCCP00794 audit, v0.84.9

Checked 20 October 2026. This is software/source reconciliation with synthetic assessment-engine cases, not independent Consultant or oncology-pharmacy validation and not a manual browser audit.

## Source set

- NCCP00794, **version 3**, updated 4 March 2025, review due 4 March 2030, six pages: https://healthservice.hse.ie/documents/6417/794_v3_Sacituzumab_Govitecan_Therapy.pdf
- Current official Trodelvy EU SmPC, retrieved 20 October 2026: https://www.ema.europa.eu/en/documents/product-information/trodelvy-epar-product-information_en.pdf . Dose/safety sections cross-checked against the European Commission June 2026 annex: https://ec.europa.eu/health/documents/community-register/2026/20260622170151/anx_170151_en.pdf
- ASCENT primary report, Bardia et al., NEJM 2021;384:1529–1541: https://pubmed.ncbi.nlm.nih.gov/33882206/ . Primary-population endpoints also confirmed in the official EU SmPC section 5.1. They must not be mixed with overall-population estimates.

## Findings and corrections

| Finding | Correction |
|---|---|
| Isolated ANC required treatment day to trigger either rule, although ANC <1.0 fails both days. | ANC <1.0 now withholds without requiring day. ANC 1.0–<1.5 with unknown day explicitly requests day-specific clinical review; no false clearance. Day1 <1.5 and Day8 <1.0 remain exact. |
| Febrile-neutropenia and prolonged grade4 neutropenia input fields did not cause actions. | Current febrile neutropenia and ongoing grade4 neutropenia ≥7 days now withhold and prompt urgent treatment/G-CSF and recovery assessment. Previous resolved episodes are separately recorded as occurrence history. |
| Severe diarrhoea had no independent hold; uncontrolled nausea/vomiting/diarrhoea only calculated a reduction. | Dedicated diarrhoea/nausea/vomiting inputs now hold at source thresholds, requiring recovery to grade≤1 before restart. A reduced dose is not a substitute for recovery. |
| Active uncontrolled infection was treated as a universal withhold even though NCCP moved it to cautions in v2. | Explicit Consultant review and infection-management output; no invented absolute exclusion. |
| No renal, hepatic, ECOG, age or exact eligibility assessment. | Optional source-specific inputs added. NCCP later-line TNBC criteria remain separate from broader current EU indications. All inputs stay optional. |
| Second/third severe-neutropenia wording could be interpreted as one/two level reductions from an already reduced dose. | Explicit NCCP reference doses from 10 mg/kg: second event 7.5 mg/kg, third event 5 mg/kg, fourth stop. Current holds override these history-based doses. |
| Infusion-reaction handling covered only life-threatening reactions. | Grade1–3 prompt slow/interruption and clinical management; grade4/life-threatening prompts permanent discontinuation. |
| Premedication/support content missed precise timing, Day8 antiemetics and steroid overlap. | Exact NCCP suggested premedicines and both-day high-risk antiemetic requirement documented; duplicate dexamethasone avoidance and G-CSF timing review made explicit. |
| UGT1A1 handling risked treating a lower starting dose as mandatory or assigning an invented dose. | Consultant/pharmacy consideration, no invented initial reduction, close monitoring, no mandatory unknown-genotype testing, and distinction from toxicity-related no-re-escalation policy. |
| No longitudinal monitoring record. | Baseline tests, each-cycle bloods, Day8 ANC assessment, every-second-cycle glucose/electrolytes, pregnancy testing where relevant, conditional ECG and observation duration encoded. No invented universal CT, echo, DXA or tumour-marker timetable. |

## Material source differences left explicit

1. **Second severe non-neutropenic event:** NCCP Table1 repeats 25% reduction for first and second events. Current EU SmPC provides 10→7.5→5 mg/kg. The second-event branch requires Consultant/pharmacy reconciliation and displays no automatic numeric restart dose.
2. **Liver impairment:** NCCP Table2 says no adjustment is expected in moderate/severe impairment. EU SmPC reports safety unestablished and advises avoidance when bilirubin >1.5×ULN, AST/ALT >3×ULN without liver metastases or >5×ULN with metastases. The product-label limits trigger withholding pending review; source conflict is stated.
3. **Renal/dialysis evidence:** NCCP predicts no adjustment in CrCl<60 and dialysis. EU SmPC reports absence of data for severe/end-stage renal disease (CrCl<15 in its text). CrCl<15 and dialysis return explicit review, not an inferred full-dose clearance.
4. **Toxicity duration:** NCCP uses >48 hours for other grade3 non-haematological toxicity and discontinuation after >3-week recovery delays. The current EU SmPC uses grade3–4 toxicity despite optimal treatment and dose-level recurrence rules. Both are visible; no silent substitution or restart.
5. **Indication:** Current EU licensed scope is broader. This NCCP00794 card remains restricted to unresectable/metastatic TNBC after ≥2 systemic therapies, including ≥1 for advanced disease. It does not establish Irish eligibility/reimbursement for other indications.

## Evidence interpretation

ASCENT randomised 529 patients. Its primary analysis was in **468 patients without baseline brain metastases**, with ECOG0–1: median PFS **5.6 vs1.7 months**, HR0.41 (95%CI0.32–0.52); median OS **12.1 vs6.7 months**, HR0.48 (95%CI0.38–0.59); response35%vs5%. These are group-level estimates and do not predict individual benefit. Overall-population estimates, which include brain metastases, differ and are not substituted for the primary result.

## Verification

`node validation/targeted-breast-v0849/sacituzumab-source-cases.cjs`

**143/143 source-derived scenario and structure checks passed**, covering threshold boundaries, omitted day, isolated entries, febrile neutropenia, toxicity recurrence/delay, grade-specific symptoms, organ-function conflicts, eligibility, override precedence, numeric-dose suppression under hold/review, source links and treatment/monitoring structure. Protocol validator: valid, no errors. Each of 51 rules has a source URL, page and checked date. Clinical/pharmacy approval flags remain false.

No browser execution or clinician sign-off is claimed. The release owner should also run integration/CI gates and verify the generated pages/PDFs.

## Direct source freshness confirmation

The current official breast metastatic catalogue links the same v3 asset. A fresh direct download on 20 October 2026 (rather than only a cached search extraction) confirmed **version 3**, version date **4 March 2025**, review due **4 March 2030**, and the same six-page treatment/monitoring/dose-modification tables. The retained file is `sacituzumab-nccp-current.pdf`, 1,099,465 bytes, SHA-256 `d5bcbeb3b337e61fb1e291eac19c83ec3527a5d61646f45afe07ff168ee30db6`. Details are recorded in `sacituzumab-source-freshness.json`. No rule change was needed after this freshness check.

## Grading-panel integration check

The actual shared CTCAE renderer initially displayed CTCAE v6 ANC/platelet education beside the older source pathway and incorrectly treated duration-in-days as a calculable ANC-like field. NCCP00794 v3 does not identify a CTCAE version. Eight affected laboratory/duration/Boolean fields now explicitly show source-specific dosing or qualification guidance without a fabricated version, numerical grade, or comparison panel. Nausea/vomiting use explicit named CTCAE v5 descriptors; diarrhoea/infusion metadata are explicitly v5. Two regression checks exercise the actual renderer, bringing the source-suite result to **143/143**. No treatment-action rule changed.

The final metadata pass assigns supported infusion/diarrhoea categories, named-event descriptions and practical assessment guidance. Nausea and vomiting retain explicit named v5 descriptions because the shared helper has no dedicated category; its generic category fallback does not replace those descriptions. Nausea correctly offers grades 0–3, without inventing a grade 4. The same 143 checks pass with strengthened rendering assertions. The platform-wide standardisation command was also run; its reported remaining failure at this point was the separate 00588 febrile-neutropenia grade expectation, outside this audit's file ownership.

The official [NCI CTCAE v5.0 PDF](https://dctd.cancer.gov/research/ctep-trials/for-sites/adverse-events/ctcae-v5-5x7.pdf), pages 28 and 37, was rechecked for the named gastrointestinal terms. The regimen's diarrhoea grade-3 wording now overrides a legacy shared descriptor: incontinence alone is not a v5 grade-3 criterion. Nausea grade-2 description also includes malnutrition; no grade-4 nausea option was added.
