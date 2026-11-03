# Lung closeout surveillance and integration audit — v0.84.30

Checked 2 November 2026 against the committed v0.84.29 baseline. This audit made no canonical application changes. Targeted correction proposals are in `proposed-fixes.json`; the release owner applies and verifies them.

## What was checked

- Fresh official lung catalogue retrieval and all 59 linked NCCP regimen PDFs. The current published catalogue contains the same 59 unique codes as the existing regression catalogue, including shared protocols and mesothelioma. The catalogue is a defined coverage denominator, not a claim to include every possible lung regimen.
- Source version and binary identity surveillance. All 53 already-authored suites retain their recorded source version. Forty-nine retrieved PDFs match the recorded SHA-256 exactly, with no mismatches. Four prior audits deliberately recorded no PDF binary hash because retrieval was then blocked; those four still match the recorded version and now have fresh binary hashes. See `source-status.json`.
- All 53 existing suites and their 59 actual lung patient routes: registry routing; incomplete/empty assessment behavior; unique rule IDs; clinical dose model; runtime lung knowledge rationale/evidence; consent-agent profile coverage; supportive-care mapping; patient anatomy, monitoring and chronology; longitudinal journeys; required assets; duplicate/missing source references; emitted knowledge-page citation anchors; paired PDF download copies.
- Citation metadata for all 2,893 existing clinical rules: every rule has a source URL; no unexpected explicit source-version mismatch was found. This is a provenance consistency check, not a fresh adjudication of every clinical rule.
- Targeted reading of shared breast/lung scope, oral targeted treatment durations, the durvalumab after-chemoradiotherapy sequence, and the new cytotoxic patient evidence/support source lists. This is a focused content review within the integration audit, not a comprehensive new medical review of all text.

## Source-version findings

The six source reconciliations under active development belong to the separate `rt21`, `rt28` and `bev-nintedanib` workstreams. Fresh surveillance identified changes in three of them:

| Regimen | Baseline recorded | Fresh PDF |
| --- | --- | --- |
| 00279 | 7 | 8 |
| 00309 | 6 | 6a |
| 00561 | 4 | 5 |

The other three new suites retain their baseline version: 00214 v8, 00372 v6 and 00456 v4. The detailed clinical reconciliation, boundary cases and authored service content for these six are outside this closeout sub-audit.

The four existing records without a prior binary hash are 00281, 00310, 00569 and 00579. Their retained manifests explicitly say that only web text/screenshot inspection was available. The audit does not silently convert same-version evidence into a historical byte-identity claim. Fresh hashes now provide a surveillance baseline.

## Targeted corrections proposed

1. **00284 and 00614: ambiguous/wrong evidence citation and missing supportive-care source.** Both patient source lists contain two entries with ID `trial`. The first is the Zatloukal gemcitabine/platinum comparison, which is not the single-agent gemcitabine or carboplatin/vinorelbine evidence described on those pages. Because generated HTML repeats `id="source-trial"`, the evidence anchor lands at the wrong study. Keep the correct primary trial, assign a unique ID (`ricci-2000` or `obrien-2004`) and remove the unrelated trial from these two patient, rationale/reference and journey source lists. The clinician endpoint text already cites the correct regimen-specific trial and needs no effect estimate change.
2. **00284 and 00614: unresolved `ncis` references.** Their support and support-source arrays refer to `ncis`, but it is absent from the source list. Add the verified NCCP *Antiemetic Medicines for inclusion in NCIS (Medical Oncology)* v8, dated 10 February 2025. This repairs provenance, without changing the antiemetic prescription.
3. **Eight generated knowledge pages: legacy timeline citation fallback.** The standalone 00281, 00304 and 00310 pages and all five 00849 backbone pages omit `timeline_source_ids`. The calendar renderer therefore emits inherited `nausea`, `macmillan` and `pembro` anchors that are undeclared in these bundles. Set the source IDs explicitly to the regimen's existing NCCP/NCIS sources, adding its companion regimen and nivolumab product information for 00849. Regenerate these knowledge pages and paired copies. No treatment schedule change is proposed.
4. **New release inventory: inherited previous-count field.** The v0.84.29 inventory retained `previous_authored_suites:139` despite v0.84.28 containing 149. The v0.84.30 inventory should derive its previous count from the committed baseline, namely 154, rather than inherit the stale value. Historical evidence files need not be rewritten to fix the new report.

`structural-results.json` preserves the pre-correction audit: 14 issue clusters across six regimen codes and ten routes. This count includes overlapping manifestations of the same source defect (a missing declared source and its broken emitted anchor). `proposed-fixes.json` gives exact source entries and target fields. The audit script supports `--after` to retain a separate post-correction result without overwriting the observed baseline.

## Checks without findings

All required service assets were present on the 59 existing lung routes. All 413 checked PDF/download-copy pairs matched. All 53 empty assessments remained incomplete and did not imply treatment clearance. Runtime lung KB profiles had rationale and evidence; all patient agents had consent profiles; every suite had a supportive-care mapping, anatomical content, monitoring, chronology and longitudinal journey. Patient evidence metrics were non-numeric. All nested journey references resolved. Independent consultant, pharmacy and clinical-use flags remained false.

The complete metadata/results are in `structural-results.json` and `clinical-provenance-results.json`. The main release's full source cases, regression suite, browser checks and document validation remain separate evidence and must not be claimed as completed on the strength of this sub-audit alone.

## Limits and remaining review

This is a fresh source surveillance and integration/content closeout, with targeted fixes. It is **not** a fresh rule-by-rule re-audit of all 59 protocols and does not establish clinical authorisation. Prior rule-level reconciliations remain identified by their actual release; no independent clinical, oncology-pharmacy or patient/PPI approval is inferred. The earlier lung templates remain in place outside the explicitly updated routes; all-lung/all-breast template migration is a separate task. Source PDFs and catalogue HTML are temporary research copies; versions, URLs, retrieval results and hashes are retained in the release audit data.

## Sources directly verified for the findings

- [NCCP lung SACT catalogue](https://healthservice.hse.ie/staff/information-healthcare-workers/nccp/lung-sact-regimens/)
- [NCCP SACT guidance index](https://healthservice.hse.ie/staff/information-healthcare-workers/nccp/sact-guidance-and-related-documents/)
- [NCCP NCIS antiemetics v8](https://healthservice.hse.ie/documents/7180/Supportive_Care_Antiemetics_for_inclusion_NCIS_Medical_Oncology.pdf)
- [Ricci 2000: gemcitabine monotherapy in older adults](https://pubmed.ncbi.nlm.nih.gov/10688490/)
- [O'Brien 2004: alternating IV/oral vinorelbine with carboplatin](https://pubmed.ncbi.nlm.nih.gov/15151949/)
- [Zatloukal 2003: gemcitabine/cisplatin versus gemcitabine/carboplatin](https://pubmed.ncbi.nlm.nih.gov/12928123/) — retained where relevant, removed from the two incorrectly inherited citation lists.
