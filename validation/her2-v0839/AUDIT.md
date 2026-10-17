# SACTCheck v0.83.9 — HER2 family audit

Source review: 17 October 2026. Five individually reconciled NCCP regimens; 115 encoded rules and 174 source-derived assessment cases. This is software/source reconciliation, not independent clinical validation. Consultant, oncology-pharmacy and patient/PPI review remain pending. No real patient data were used.

## What changed

| NCCP | Current PDF reviewed | Important distinctions retained |
|---|---|---|
| 00200 | IV trastuzumab q21, v8 | Early AND metastatic indications; early total one year versus ongoing metastatic review; initial 8 mg/kg and continuation 6 mg/kg; ECOG 0–2; no repeat loading simply because a continuation card is opened |
| 00201 | IV trastuzumab weekly, v6 | Metastatic setting, 4 mg/kg loading then 2 mg/kg weekly, ECOG 0–3; source says discontinue for symptomatic heart failure |
| 00272 | SC trastuzumab metastatic, v4 | Fixed 600 mg, no loading, at least 21 days between injections; all four monotherapy/partner indication contexts described; partner-drug dosing is outside this component card |
| 00285 | SC trastuzumab early, v4 | Fixed 600 mg; earlier IV/combination doses count towards the total year; early baseline cardiac criteria; neoadjuvant/adjuvant context filters |
| 00206 | Metastatic T-DM1, v5 | Prior-treatment eligibility; ongoing course, not 14 postoperative cycles; metastatic platelet, liver and LVEF tables; reductions 3.6 → 3 → 2.4 mg/kg without re-escalation |

Direct source URLs, versions, SHA-256 values and per-regimen rule counts are recorded in `data/her2-v0839-source-index.json`. Rules retain page-level NCCP references. EMA Herceptin and Kadcyla product information supplement formulation, pregnancy and cardiac follow-up details; supplementary sources are labelled separately.

## Audit findings and resolution

1. **Metastatic T-DM1 hepatic rules were incomplete.** Existing AST/ALT and bilirubin grade inputs had no corresponding full hepatic action table. Added numeric source boundaries, recovery conditions, dose-level guidance and the combined DILI branch. A withheld result does not issue an automatic restart dose.
2. **The NCCP T-DM1 bilirubin table has a printed gap.** Table 5 describes grade 3 as >3–10 ×ULN but prints grade 4 as >20 ×ULN. Current EMA Kadcyla MBC Table 2 defines grade 4 as >10 ×ULN and says discontinue. For >10–20, the tool explicitly withholds and displays both sources and the EMA discontinuation direction for urgent consultant/pharmacy reconciliation. It does not silently repair the national document or treat the gap as normal. Above 20, both sources support discontinuation. This discrepancy remains a named clinical review item.
3. **Early and metastatic T-DM1 thresholds cannot be copied.** At platelets 50–74, the metastatic table does not initiate a hold, while 00659 early-breast does. After an established metastatic platelet hold, recovery still requires ≥75. The metastatic cardiac branches use <40 and 40–45%, rather than the early-breast <45 and 45–<50% branches. Comparative tests protect these differences.
4. **Trastuzumab cardiac holds require both conditions.** Current LVEF <50 AND decline ≥10 percentage points triggers the source hold. Missing baseline change triggers review; a missing value is not normal. The weekly source's definite heart-failure stop is kept distinct from “consider discontinuation” in the other trastuzumab sources. A temporary safety hold is used while that clinical decision is made.
5. **Formulation and delayed-dose rules differ.** IV ≤7-day versus >7-day delays are separated, with re-loading subject to clinician review. SC has no loading dose and preserves ≥3 weeks between injections. IV observation is measured from infusion START, whereas SC observation follows the injection.
6. **Baseline eligibility and setting were under-specified.** Corrected the 00200 metastatic-only metadata and unrelated reimbursement-code carry-over; 00200 covers both early and metastatic disease. Early LVEF >55 with judgement at 50–55 is explicit. The 00200 PDF has an internally inconsistent exclusion wording around >55; it is not encoded as a high-LVEF contraindication. HER2, performance status and full indication confirmation are assessed without defaulting missing values.
7. **Pregnancy wording was too absolute.** The legacy generic contraindication has become a hold requiring urgent specialist risk-benefit review, consistent with the product information wording. Breastfeeding cessation and review are separate.
8. **Blood monitoring is not interchangeable.** SC sources require FBC/renal/liver tests every six weeks; metastatic T-DM1 requires them before every cycle. These IV trastuzumab sources do not prescribe a universal repeat-blood interval. All five show baseline versus ongoing checks, the 12-week echo at approximately C5 (q21) or C13 (weekly), and preservation of the existing due window when route changes or treatment is delayed.
9. **Six-monthly echo is not the default during maintenance.** NCCP 12-weekly monitoring remains visible during treatment. The EMA six-monthly schedule is identified as follow-up after trastuzumab cessation to 24 months, with longer early-breast follow-up after anthracyclines. Any less frequent on-treatment plan requires an individual specialist decision.
10. **Generic content was excessive for single HER2 antibodies.** IV body maps have three relevant highlights, SC four and T-DM1 five. Trastuzumab support drafts do not automatically populate chemotherapy antiemetics, taxane steroids or G-CSF. Consent templates use treatment-discussion prompts plus the actual agent's material risks.
11. **Earlier sustainability metadata had copied source/route fields.** Corrected 00485, 00815, 00659, 00892 and 00936 source provenance, route and administration-time descriptions. Added cross-regimen source checks. No unverified travel-saving or visit-count claim is calculated.
12. **The prior runtime version/cache fault is included in this update.** The real release bootstrap is 0.83.9. Cached JSON requests include the release in the HTTP URL, and both automated release tests and the deployable-site validator execute the actual bootstrap to catch a fallback to an earlier version.

## Evidence and monitoring boundaries

- HERA outcomes are labelled early-breast only, even on the dual-indication 00200 card.
- HannaH is an early-breast formulation comparison, not metastatic survival evidence. The metastatic SC card says so explicitly.
- The weekly monotherapy study and EMILIA are dated historical evidence, not a complete contemporary HER2 sequencing guideline or an individual prognosis.
- Early-breast surveillance is distinguished from metastatic response assessment. No blanket asymptomatic CT or tumour-marker schedule is introduced for early disease. Metastatic response imaging is individualised; markers supplement rather than replace clinical review and imaging.
- DEXA is conditional on endocrine/ovarian-suppression and bone-risk context, not a routine HER2-agent test. Baseline ECG in trastuzumab product information is distinguished from echo/MUGA. T-DM1 has no invented fixed-cycle ECG requirement.
- Maps are relative education with no patient dates required. They do not record orders, completion, results or overdue alerts. Booking owner, result reviewer, due window and escalation are workflow prompts, not an operational tracking database.
- The SC PDFs carry a September 2026 review date; retrieved source version 4 is recorded. The elapsed review date is not interpreted as clinical reapproval or an automatic withdrawal.

## Verification

- `tests/clinical-audit-v0839.test.cjs`: 174 parameter-to-output scenarios, including blank/partial inputs, boundary values, absent EF change, source discrepancies, formulation delays, eligibility and early-versus-metastatic distinctions.
- `tests/full-suite-v0839.test.cjs`: clinic/patient routes, knowledge/evidence records, consent, date-free charts, sparse anatomy, monitoring, support scripts, indication filters, source provenance and generated-file parity.
- 40 patient PDFs, 80 pages; matching compatibility copies and 20 decoded QR destinations (five PNGs and 15 printed PDF QRs). Final document layouts visually inspected, including monitoring tables, body maps, consent and symptom sheets.
- Full repository release gate, regression suite, security check, protocol build and deployable-site validation: see `verification.json` and `ci.log` for the final result.
- Browser-based manual input/interaction QA was not run because the required browser-control capability was unavailable. Assessment-engine tests are not described as manual UI validation. Real device and deployment review remain necessary.

## Reuse plan

The map covers all 376 indexed regimen files, including nested haematology directories. It identifies 38 authored patient knowledge suites, 14 further same-component-set candidates, 61 combinations using existing components, 98 partial-reuse candidates, 142 requiring new component education, and 23 requiring manual component review. Counts describe software metadata, not clinical equivalence or validation.

Use `regimen-reuse-map.csv` or `data/regimen-reuse-map-v0839.json` to group future audits. A practical next family is AC/taxane schedules: 00252, 00260, 00278 and 00316, reusing 00485 education while auditing each timing, G-CSF, HER2 partner and phase-support plan. Same-agent batches can be larger only after every mandatory indication, route, schedule, rule, monitoring and evidence check passes. New medicines should retain smaller, deeper batches.
