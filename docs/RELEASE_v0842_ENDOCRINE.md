# SACTCheck v0.84.2 — five endocrine suites

This cumulative release adds NCCP 00253 tamoxifen, 00254 anastrozole, 00371 letrozole, 00376 exemestane and 00361 fulvestrant. It includes the complete v0.84.1 update when applied to the committed v0.84.0 baseline, `4856a9a849bf16b8312428fe1d2ce39e5e13264c`.

Each regimen now has a source-audited decision tool, clinician knowledge and primary evidence, medicine mechanism, consent form and discussion draft, supportive-care draft, sparse medicine-specific anatomy, patient portal, knowledge page, guide, reusable review passport, contact card, practical logistics, QR links and sustainability metadata. The shared monitoring and treatment-journey definitions serve both clinician and patient views.

Daily endocrine medicines have continuous-treatment milestones. They do not have invented 28-day chemotherapy cycles, toxicity nadirs or mandatory patient-date entry. Fulvestrant shows the additional Day 15 loading visit, Day 29 and subsequent 28-day intervals. Support drafts contain no automatic prophylactic antiemetic, steroid or G-CSF orders.

The maps distinguish early/curative surveillance from advanced-disease response assessment. They show surgery, indicated chemotherapy, postoperative radiotherapy and endocrine relationships; risk-qualified DXA; clinically indicated cardiac checks; blood tests; and the booking/result-review responsibilities. Letrozole's separate neoadjuvant pathway retains its NCCP eligibility and 4–8-month response/surgery window. Combined setting/receptor filters exclude HER2-positive disease from that particular pathway without excluding appropriate other letrozole settings. These maps explain expected events; they do not book tests, track completion, issue reminders or triage by Oncotype.

## Audit findings

| Area | Correction |
| --- | --- |
| Three aromatase inhibitors | Replaced sparse generic rules with agent-specific indication, menopause, organ-function, interaction and monitoring logic. AI monotherapy does not silently authorise ovarian suppression combinations. |
| Liver impairment | Preserve different anastrozole, letrozole and exemestane recommendations. Letrozole severe-hepatic dosing displays 2.5 mg every other day, not a calculated 1.25 mg daily instruction. |
| Tamoxifen | Encode significant thromboembolic history, severe-hepatic advice, interactions, symptoms and risk-triggered ECG/electrolytes. Annual gynaecological examination is distinguished from routine asymptomatic ultrasound/biopsy. |
| Fulvestrant | Encode loading/ongoing visits, eligibility, IM bleeding/nerve risks and hepatic advice. NCCP Child–Pugh B 250 mg differs from EMA product information; that discrepancy remains explicit for consultant/pharmacy reconciliation. |
| Evidence | Primary studies stay attached to their actual setting and population. CONFIRM is the primary fulvestrant evidence fit; FALCON's endocrine-naive setting and 2025 final analysis without a significant OS advantage are separately labelled. |
| Monitoring | Do not impose routine three-month CT, routine endocrine-monotherapy echo, or annual DXA on everyone. Preserve the baseline-DXA exception for patients already receiving adjuvant bisphosphonates and risk-qualified reassessment intervals. |

## Verification and limits

The audit contains 128 source-linked rules and 398 synthetic source-derived scenarios: 255 for the aromatase inhibitors and 143 for tamoxifen/fulvestrant. The release gate also checks complete service routes, generated-page parity, setting/receptor navigation, in-memory consent print/clear behaviour, evidence boundaries and preservation of 1,779 previous patient files.

Forty canonical PDFs have identical compatibility copies. PDF page counts, text bounds and 20 actual QR decodes are checked; every page was rendered for visual review. The detailed release verification records the full CI and fresh v0.84.0 overlay results in `validation/endocrine-v0842/release-validation.json`.

No interactive browser walkthrough or post-push live deployment test was performed in this environment. Automated scenario execution is not a claim of manual clinical sign-off. Direct source PDF byte downloads were unavailable: aromatase-inhibitor checks used web-extracted text and accurately labelled text checksums; visual PDF-table verification is not claimed for those three agents. The tamoxifen/fulvestrant audit records its separate page-2 table review. The old standalone v0.62.2 publication-snapshot test expects historical protocol hashes and is not a current release gate; running it against today's repository fails on already-replaced historical files. Its archived expectations were left intact; current endocrine behaviour is covered by the new source cases.

Independent consultant, oncology-pharmacy and patient/PPI review remains pending. No commit, push or publication has been performed by this update.

## Suggested first review

Open letrozole 00371 to review its separate preoperative, adjuvant and advanced pathways, then fulvestrant 00361 to check the injection schedule and explicit hepatic source discrepancy. Check tamoxifen 00253 for the risk-based ECG and gynaecological advice. The complete source audits and patient-content briefs are in `validation/endocrine-v0842/`.
