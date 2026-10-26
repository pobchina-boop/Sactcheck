# Endocrine / targeted retrospective audit — v0.84.21

Source check: **25 October 2026**. Scope: **00322, 00414, 00525, 00619 and 00892**. These are full replacement authoring values for the existing service suites. No live/shared source file or assessment rule was edited by this bounded task. Independent clinical, pharmacy and patient/PPI review remains pending; `clinical_use_authorised` remains false.

## Source verification

The current official NCCP PDFs were downloaded, text-extracted and SHA-256 recorded: 00322 v4; 00414 v5a; 00525 v6; 00619 v4a; 00892 v2. Current EMA product information was downloaded for Afinitor, Ibrance, Kisqali and Verzenios. Source hashes and primary trial links are in `sources.json`. Raw source downloads are outside the release repository.

This pass rechecked regimen schedules, indication boundaries, monitoring, supportive care and material source discrepancies relevant to retrospective service content. It is **not** a new exhaustive validation of every existing dose-adjustment branch. Previously guarded source discrepancies remain guarded.

## Material findings and remedies

| Code | Finding | Proposed service change |
|---|---|---|
| 00322 | Patient metrics were empty, but numerical trial outcomes remained in evidence prose. Existing supportive content was largely sound. | Fully qualitative patient benefit; clinician-only BOLERO-2 PFS and nonsignificant final OS. Continuous daily medicines, four-week laboratory review, glucose/lipids, urine protein, mouth prevention, pneumonitis/infection and separate exemestane decisions remain explicit. |
| 00414 | Empty patient metrics still left numerical trial outcomes in prose. Final PALOMA-2 P values depend on analysis and one-/two-sided convention. | Qualitative patient evidence; clinician endpoints explicitly pair the published final OS with one-sided P=.34, and recovered-data OS with one-sided P=.21. PALOMA-3 final and exploratory follow-up remain distinct. Preserve D1/D15 early counts, conditional later relaxation and capsule/tablet food differences. |
| 00525 | Patient evidence used a numerical OS comparison; practical advice contained both ribociclib and abemaciclib instructions. The phase-support store lacked an explicit plan. | Qualitative patient benefit; clinician MONALEESA-2, -3 and -7 endpoints retain their own partner, population and analysis status. Agent-specific practical advice, full moderate–high oral support plan, QT/CYP3A review and metastatic duration. |
| 00619 | Patient evidence displayed numerical iDFS. The card already mentioned the later OS benefit, but did not present a complete clinician endpoint distinction. Practical text mixed ribociclib and abemaciclib. The phase-support store lacked a plan. | Qualitative patient benefit; clinician seven-year OS and iDFS from the primary OS report, with significance boundary and exact endpoints. Continuous twice-daily two-year course, early diarrhoea rescue, two-weekly/monthly bloods, VTE/lung symptoms and endocrine continuation. |
| 00892 | Phase-support labelled ribociclib **oral minimal-to-low**, contradicting NCCP v2 p6 and the correct global moderate–high risk map. The endocrine component retained a fulvestrant injection risk, despite the adjuvant AI setting. Patient evidence displayed four-year numerical outcomes. | Correct phase support to **oral moderate–high**; remove fulvestrant from the adjuvant endocrine component. Preserve 400 mg, three-year limit, AI/OFS support, ECG/electrolytes and node-negative conflict review. Use qualitative patient benefit plus the newly published six-year primary evidence with descriptive/nominal qualifications. |

All five authoring entries provide explicit baseline/early/ongoing/completion schedules, medicine-specific risks/body-map content, a separate supportive-care plan, full clinician rationale/evidence, and no patient-entered dates. The oral treatment itself does not require a central line; optional fulvestrant, ovarian-suppression or bone-treatment appointments remain separate.

## Evidence update and maturity

- **BOLERO-2:** final investigator-assessed PFS and final OS are separate. OS was not statistically significant; the trial predates routine CDK4/6 therapy.
- **PALOMA-2:** the primary paper's final OS and recovered-data analysis both remain nonsignificant. Do not combine the final median pair with a different P value. **PALOMA-3:** the protocol-specified final overall-population OS and later exploratory update have distinct labels.
- **MONALEESA:** keep letrozole/postmenopausal first-line, fulvestrant mixed first-/second-line, and pre/perimenopausal goserelin populations separate. MONALEESA-7 ITT included tamoxifen; current SmPC does not recommend ribociclib with tamoxifen. Dated updated analyses are labelled rather than represented as one latest pooled trial result.
- **monarchE:** the primary OS report published online in October 2025 (journal issue February 2026) met its prespecified significance boundary. The seven-year iDFS gain must not be presented as the OS gain.
- **NATALEE:** the primary six-year article appeared **23 October 2026**, DOI **10.1016/j.annonc.2026.10.1288**. It is an in-press journal pre-proof and explicitly describes a **prespecified descriptive** analysis. OS uses a **nominal one-sided P value**; this authoring does not call it a new confirmatory significance test. The primary publisher search extraction supplied the exact results and analysis status; direct web open returned 403. The sponsor release corroborates availability, but its reported DRFS confidence interval differs from the primary article. Sponsor DRFS numbers are not reused. Earlier five-year estimates are retained only as a separately dated source, not mixed with six-year values.

## Source discrepancies retained

- **00525:** the page-1 broader indication and page-2 postmenopausal/previously untreated eligibility remain inconsistent. Existing `SOURCE_ELIGIBILITY_CONFLICT` clinical review is retained. Existing QT restart reconciliation between NCCP and current SmPC is retained; no new automatic restart is proposed.
- **00892:** selected high-risk node-negative eligibility conflicts with its node-negative exclusion. Existing `NODE_NEGATIVE_CONFLICT` review remains. NATALEE's inclusion of selected N0 patients is not treated as permission to bypass this local source conflict.
- **00414:** NCCP describes capsules; EMA also contains tablets. Food advice remains formulation-specific.
- **00322:** existing guarded renal/hepatic and other source-aware assessment decisions were not silently rewritten.
- **00619:** the existing internal `supportive_care_profile` identifier contains `low_risk` although the displayed risk is correctly moderate–high. It has no other references in the repository. `proposed-protocol-metadata.json` offers a descriptive identifier correction only; there is no dose-rule change.

## Integration and verification

`authoring.json` contains all v20 builder keys (`patient`, `clinical`, `evidence`, `journey`, `selector`, `support_plans`, `route`, `risk`, optional `evidence_records` and `protocol_metadata`). Replace the five corresponding regimen values; do not shallow-merge individual patient evidence fields with older numerical content. All patient metrics are empty and patient outcome prose is qualitative. Source lists retain existing IDs used by retained timelines and add dated primary evidence IDs.

Run `python validation/breast-completion-v08421/endocrine-retro/verify_authoring.py`. Its report is `content-checks.json`. These focused checks cover the actual cross-regimen/cross-setting regressions, source-risk correction, monitoring/duration differences, endpoint separation, and governance status. Parent integration must still regenerate/render the service pages and PDFs and run the full repository regression suite. No clinical sign-off is implied by content-check success.
