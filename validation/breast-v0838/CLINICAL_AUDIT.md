# Breast release 0.83.8: source reconciliation and review record

Prepared 17 October 2026 against main commit `5ece06792bccd726574832729ae1fb5b8193680d` (v0.83.7).

This is a source-reconciled development release. Software verification is separate from independent clinical validation. Consultant, oncology pharmacy and patient/PPI review remain pending. No patient-level prescription or treatment approval is issued by these materials.

## Scope

| NCCP | Full suite | Source reviewed | Encoded rules |
|---|---|---|---:|
| 00485 | Dose-dense AC followed by weekly paclitaxel | Version 6 | 37 |
| 00815 | Weekly paclitaxel/trastuzumab followed by trastuzumab continuation | Version 3 | 26 |
| 00659 | Adjuvant trastuzumab emtansine (T-DM1) | Version 2 | 30 |
| 00892 | Adjuvant ribociclib/endocrine treatment | Version 2 | 31 |
| 00936 | Tucatinib/capecitabine/trastuzumab | Version 1 | 63 |

The 187 encoded rules have source URL and page references. Official PDF URLs, versions and SHA-256 values are in `data/breast-v0838-source-index.json`. Original PDFs were downloaded, their tables extracted and key rendered tables inspected. The full suite includes decision mapping, knowledge/evidence, consent aids, patient portal, cycle graphic, whole-course journey, logistics, guide, passport, treatment card, QR route, supportive-care scripts and sustainability metadata. Encounter/travel counts are not invented.

## Findings corrected

**00485:** removed an inappropriate trastuzumab phase. The sequence is four dose-dense AC cycles followed by twelve weekly paclitaxel doses, with mandatory growth-factor support during dose-dense AC. Count, hepatic and renal decisions now identify the active component/phase. AC and paclitaxel use separate supportive scripts. The AC script follows the national AC-specific antiemetic row and does not carry routine dexamethasone into Days 2–4.

**00815:** separates chemotherapy-plus-antibody treatment from trastuzumab-only continuation. Paclitaxel toxicity rules do not continue into the antibody-only phase. IV and SC trastuzumab are alternatives. The decision output accounts for both current LVEF and change from baseline. The source's delayed-dose paragraph describes a weekly maintenance dose despite the three-week regimen; the tool explicitly sends this discrepancy for formulation-specific review rather than creating a weekly maintenance instruction.

**00659:** uses the early-breast T-DM1 tables. Platelets 50–74 ×10⁹/L are included in the interruption band. Grade 2 AST and ALT have different restart instructions. Bilirubin, cardiac, pneumonitis and dose-floor branches were reconciled. The course is 14 postoperative cycles, rather than a generic one-year total HER2 course. Residual invasive disease, pathology and possible radiotherapy overlap are explicit in the longitudinal map.

**00892:** adjuvant ribociclib starts at 400 mg, with the 200 mg reduction level. It does not inherit metastatic starting doses or hepatic adjustments. Baseline and on-treatment QT logic, serious arrhythmia context, recurrence, liver tests, renal review and the minimum dose are distinguished. Cycle diagrams show 21 days on/7 days off, while endocrine treatment has its own schedule. Baseline/Cycle 1 Day 14 ECG and early blood/electrolyte checks are visible. Day 25–26 is an optional local pre-cycle review window, not a replacement for source monitoring or permission to restart.

**00936:** separates continuous tucatinib, capecitabine Days 1–14 followed by a seven-day break, and three-weekly trastuzumab. Renal, liver, diarrhoea, blood-count and cardiac actions are assigned to the relevant component. A capecitabine hold does not silently become a tucatinib dose instruction. DPD, recurrent toxicity and the interpretation of creatinine changes are retained as clinical review issues.

**Runtime regression:** an older ribociclib reconciliation patch could overwrite the newly reconciled protocol JSON at load time. Modern source-checked data are now preserved. A regression test checks the loaded data against the authored source and executes both breast audit batches.

**Clinician medicine profiles:** added T-DM1, tucatinib, ribociclib and abemaciclib entries linked to EMA medicine information. Exact medicine aliases now take priority over partial matches so T-DM1 is not labelled as trastuzumab alone. Coverage and antibody/conjugate identity are regression-tested.

## Retrospective review feedback

- **00722 TCHP:** a visible baseline-versus-cycle table shows the pretreatment echo, the 12-week repeat (approximately before Cycle 5 if cycles run on time), continued cardiac surveillance during further HER2 treatment and completion assessment. Elapsed time matters when treatment is delayed. Breast imaging for surgical planning and staging/response imaging are separate rows. No universal midpoint CT, every-cycle CT or tumour-marker surveillance schedule is invented.
- **00619 abemaciclib:** baseline ECG is shown **as clinically indicated**, matching NCCP v4a. Ribociclib's routine Day 14 ECG schedule is not imported. Baseline bloods, two-weekly checks in the first two months and monthly checks in the next two months are visible.
- **00726 pertuzumab/trastuzumab maintenance:** the body map is reduced to heart function, diarrhoea and infusion/allergic reactions. Its cycle graphic no longer suggests a cytotoxic nadir pattern.
- **00525 and 00892 ribociclib:** four focused body-map issues—QT/heart rhythm, liver injury, neutropenia/infection and lung inflammation. No requirement to fill eight generic slots.
- **00857 pembrolizumab/chemotherapy sequence:** separate phase cycle charts and separate Day 1 carboplatin, weekly taxane, AC and pembrolizumab-only supportive scripts. The two postoperative pembrolizumab schedules are alternatives.

The same monitoring facts appear in patient content and the clinician knowledge addendum. Printed guides/journey maps were regenerated where affected. The smaller anatomy maps retain numbered landmarks and PDF connector lines.

## Source ambiguities deliberately left for review

- Source bands that overlap or leave decimal gaps are not silently rounded: examples include paclitaxel platelets exactly 90, selected hepatic bands and renal bands between published whole-number values.
- 00485 has conflicting cardiac wording at exactly LVEF 50%; this is surfaced for review.
- 00815 has the delayed-IV-trastuzumab dose paragraph discrepancy described above.
- 00892 has internally conflicting node-negative eligibility/exclusion wording and lung-toxicity wording; the relevant cases require review. This release does not independently resolve commissioning eligibility.
- Held treatments do not receive an automatic restart dose from a generic dose row. Recovery, recurrence, prior reductions, the active phase and the prescriber/pharmacist plan remain necessary.

## Evidence and monitoring boundaries

Evidence summaries use dated primary reports: CALGB 9741/E1199, APT ten-year analysis, KATHERINE 2025, NATALEE four-year analysis and the original HER2CLIMB analysis. CALGB/E1199 are separate evidence pillars; they are not presented as one exact trial of every NCCP step. APT is explicitly single-arm. Trial endpoints and group estimates are not individual predictions.

Longitudinal maps use NCCP regimen monitoring with linked international early/advanced breast, cardiac and bone-health guidance. Surgery, chemotherapy, radiotherapy, antibody/endocrine treatment, heart tests and imaging are separate lanes. Conditional steps remain conditional. DEXA is risk/therapy based. Routine CT or tumour-marker surveillance is not added to asymptomatic early-breast follow-up; advanced-disease imaging remains an individual reassessment plan. The consultant decks inform communication design, not prescribing authority.

These are date-free educational schedules. They do not book appointments, record completed tests, generate overdue alerts or mark missing results as normal. Local teams must assign booking, result review and escalation responsibility. Oncotype triage remains a separate future workstream.

## Verification and limits

- `npm run test:ci` passed, including the release gate, protocol validation, existing regression suite, deployment build and route/PDF security/integrity checks.
- 120 new source-derived decision scenarios passed. Inputs, expected/actual actions and findings are recorded in `engine-cases.json`.
- 139 previous-batch breast decision cases passed as regression coverage.
- Phase selection was exercised in a JavaScript VM: no initial phase, one active script, reset hides scripts. Generated HTML parity, local links, duplicate IDs, date-free patient orientation, registry routes and knowledge/sustainability presence were checked.
- 57 PDFs / 116 pages checked for non-empty pages, text within page bounds and identical compatibility copies. Thirty PNG/printed QR destinations decoded successfully. Records are in `pdf-validation.json` and `qr-validation.json`.
- Visual PDF inspection covered the new phase scripts, journey map, passport, consent aid, compact body maps and baseline/cycle monitoring tables. Explicit SVG connector presentation is included for the PDF renderer.
- **Interactive browser QA was not run.** No live site was published or deployed. Automated engine/VM tests are not a claim of manually entering values through the browser.
- The 120 new scenarios are selected source-derived cases, not exhaustive combinations or a validated accuracy percentage. Independent consultant/pharmacy sign-off, patient/PPI testing and local operational approval remain outstanding.
