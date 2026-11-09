# v0.84.45 cetuximab / chemotherapy recovery audit

Baseline: v0.84.44, `a4575d67a985c97a1dfa545813a8c1a25b2ed5a2`. Audit date: 7 November 2026. This directory contains proposed changes and evidence; no commit or push was performed by this audit worker.

## Current sources, not historical substitutions

Four official NCCP URLs were freshly retrieved on 7 November 2026. Ordinary requests initially returned 403; requests with standard PDF accept/user-agent headers followed official redirects to `assets.hse.ie` and returned PDF binaries. `source-retrieval.json` records requested URL, final URL, UTC retrieval time, HTTP status, full SHA-256 and response headers. All four current binary hashes match the previously retained corresponding versions. The successful fresh fetch, rather than that historical match alone, establishes the current source check.

| Code | Current version | Document dates | SHA-256 |
|---|---|---|---|
| 00207 | 6 | Last clinical review 27 January 2025; version 6 change 16 September 2026 | `06bbdf5a1d097665e64f61c3c7ef88f0ef957afdd7726b4924bfb3a293c623b9` |
| 00328 | 7 | Last clinical review 9 September 2021; version 7 change 23 June 2026 | `78b2244839885f97731178aa53d9c94ec8d5e0130e2b48ccd0983c8b362d2703` |
| 00733 | 2a | Version 2a change 3 March 2025; review date 17 January 2029 | `967c40b801faefa172f6fa649d88b1effcaa46e8a17331a9481745f7f38a7d0a` |
| 00456 | 4 | Version 4 13 May 2025; review date 13 May 2030 | `c5bd2d4e09c53948a5a9664dcc30fe05ffe513131f904a60f06339b776e9b3d5` |

Supplementary sources are separately identified in `supplementary-sources.json`: freshly retrieved EMA Erbitux product-information PDF, and manufacturer irinotecan SmPC HTML. The irinotecan *6 precaution is labelled supplementary product information, not attributed to an NCCP paragraph that does not contain it.

## Findings and corrected behaviour

| Scope | Source | Finding / response |
|---|---|---|
| 00207 indication | p1 | GI root now has only EGFR-expressing RAS-wild-type metastatic CRC after failure of oxaliplatin and irinotecan and intolerance to irinotecan. HN platinum-ineligible RT indication remains a separate authored context. Bonner evidence is not shown as CRC evidence. |
| 00207 source identity | v6 footer | The stable legacy application key `nccp-00207-v5` is preserved; metadata explicitly identifies source v6. Do not relabel it as a v5 source. |
| All cetuximab | 00207 p3; 00328/00733 p5 | A historical grade 3–4 infusion reaction still prevents cetuximab after current symptoms have recovered. Current-grade-only input had lost that history. |
| All cetuximab observation | NCCP p1 vs EMA §4.2 | NCCP permits stopping observation after two tolerated infusions; current SmPC requires at least one hour after every infusion. Clinician content declares the discrepancy, while patient content asks for the agreed observation plan and does not promise earlier discharge. |
| 00328/00733 folinic linkage | p3 Table1 | DPD, cardiac, hepatic and other bolus 5-FU hold/omission decisions now also govern folinic acid. The linkage is not an invented folinic dose reduction or a claim that folinic acid itself has DPD toxicity. |
| 00328/00733 hepatic | p4 Table3, directly rendered | Bilirubin >85 or AST >180 contraindicates 5-FU. Exactly 85 or 180 remains unassigned and requires review. AST is an absolute-result field; the PDF does not print the AST unit. Uncertain analyte/unit must not be silently converted from ALT or ULN ratios. |
| 00328 irinotecan | p2/p4 | Bilirubin strictly >3×ULN contraindicates irinotecan. Renal caution does not define an imported numerical reduction. |
| 00328 interaction | p9 | Brivudin/sorivudin/analogous DPD-inhibitor exposure now triggers the fluorouracil contraindication and linked folinic omission. Current/recent exposure requires pharmacy assessment; a safe washout is not inferred. |
| 00328 UGT1A1 | Manufacturer SmPC §§4.4/5.2 | Add poor-metaboliser input including homozygous *6 as well as *28. No fixed reduction percentage is invented. |
| 00733 neuropathy | p5 Table5 and footnote | Historical grade4 excludes the source rechallenge route even after recovery. Good recovery from grade3 allows only individual consideration, one level below the actual dose at onset, with dose history confirmed. |
| 00733 renal | p4 Table3 | Retain the source-specific discretionary 50% original-dose pathway below CrCl30 or dialysis. It must not inherit another FOLFOX regimen's contraindication or become an automatic order. |
| 00733 licensing note | NCCP p9 vs current EMA §4.2 | Retain and explain the old unlicensed-posology footnote alongside current SmPC inclusion of 500mg/m² every two weeks. Current local consent/licensing reconciliation remains necessary. |
| 00456 counts | p3 Table1, direct binary rendering | Correct exact full-dose count boundaries to ANC ≥1.5 AND platelets ≥100. The source draws the underline separately: text extraction falsely produces `>`. Decimal gaps (1.49,1.5) and (99,100) remain review. Source count rows do not clear cisplatin, and the SmPC reduced-count discrepancy remains explicit. |
| 00456 recovery | p3 Table3 | Preserve prior severe toxicity after recovery. Previous grade3 with residual grade2 still holds; recovery to ≤1 requires review of the source75% restart, original/current denominator and other restrictions. Grade4 is not extrapolated into the grade3 row. |
| 00456 neuropathy | p3 Table3 | Recovery from ≥grade2 requires a documented choice of carboplatin AUC5 or 50% cisplatin; neither automatic full-dose restart nor automatic use of the different AUC3 regimen is appropriate. |

Rendered pages retained and inspected: `00207-page1.png`, `00328-page4.png`, `00733-page4.png`, `00733-page5.png`, `00456-page3.png`. These are clinical-source table screenshots, not output-document visual acceptance evidence.

## Verification and remaining boundaries

`source-cases.cjs` uses the actual repository assessment, protocol-validation and dose-schedule engines. It independently enumerates 190 cases covering indication isolation, current and historical toxicity, exact boundaries, decimal gaps, partial assessments, component linkage, source dose-history guards and nonnumeric specialist decisions.

- Proposed candidates: 190/190 pass.
- Integrated protocols: 190/190 pass, recorded in `integrated-results.json`.
- Frozen v0.84.44 baseline: 152/190 pass, 38 fail under the new expectations. These are 38 failing scenarios, not 38 independent clinical defects.
- Strict protocol schema validation passes for all four.
- Four patient proposals preserve their entire original anatomy arrays byte-equivalently after JSON serialization: 8,8,8,6 anatomical entries. All source IDs resolve within the proposed patient source lists.

The parent release still owns all-suite integration, historic hash migration records, PDF rebuilding, source/output visual comparison, mirrored downloads, QR decoding and live target checks, and the wider regression suite. These are not claimed complete here. Consultant, oncology-pharmacy, clinical-authorisation and patient/PPI approvals remain pending. No clinical grade edition or numeric prescription is invented to fill a source ambiguity.

## Integration

1. Merge the four files listed in `proposal-manifest.json` into their exact protocol paths. Do not migrate stable IDs accidentally. The parent has already copied these and the integrated190-case result passes.
2. Copy `content-proposals/CODE-patient.json` to `data/patient-knowledge/CODE.json` for the four codes. `00207` here is the GI root; the separate `head_neck` context is authored by the patient-content worker.
3. Merge the four `regimen_profiles` from `content-proposals/knowledge-base-profiles.json` into the new v0.84.45 addendum, replacing only the appropriate root profile IDs. Preserve the new HN context profile. No trial numbers were changed.
4. Merge the four `regimens` entries in `content-proposals/phase-support-entries.json` into `data/phase-support-v0838.json`. Do not replace the shared file wholesale. Existing medicines/doses and day-specific support are preserved. The `00207` entry is GI; HN support belongs in the new context map.
5. `content-proposals/consent-additions.json` supplies regimen-specific review points; the patient consent text is already included in each patient proposal. Do not treat that JSON as a new runtime file unless a consumer is deliberately added.
6. Regenerate affected patient/consent/knowledge/support/handbook assets using the established builders. Retain exact QR routes and card dimensions. Run the independent cases with `node validation/head-neck-v08445/cetux-chemo/source-cases.cjs --integrated`.

`recover-content.py` is a recovery authoring helper that reads baseline patient data. Do not rerun it against already integrated patient JSON or its appended guidance will be duplicated. The original mixed00207 HN content is retained under `content-proposals/00207-relocated-hn-content.json` for comparison while the separate HN route is integrated.
