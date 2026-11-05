# Rechecked colorectal backlog

Baseline `2e5de4a6dd9e2fcbefa18623ff21db7b9eaec40b`; active release `0.84.33`; generated 2026-11-05T14:32:01.117Z. No clinical rule, patient source, progress count or PDF is changed by this scanner.

## Counts and their limits

- Current indexed indication text independently yields **41 candidate codes**. This is not a fresh national-catalogue reconciliation.
- The current register declares **31 completed software packages**, with 10 remaining: 00212, 00214, 00215, 00244, 00382, 00455, 00551, 00558, 00890, 00900.
- **10 declared-complete packages lack currently required filenames**: 00207, 00225, 00328, 00330, 00331, 00447, 00585, 00692, 00732, 00733. Only 21 declared-complete packages have all required filenames and a QR image. File presence is not clinical/visual validation; this is not a replacement completion count.
- Existing root patient services explicitly cover another tumour context for 00212, 00214, 00215, 00455, 00558. Global suite metadata must not be counted as colorectal context completion.

## Requested five and existing work

- **00212**: Shared protocol has colorectal eligibility but the existing root patient services describe another tumour group. Preserve those services and create a distinct colorectal context. Current encoded CRC eligibility: Metastatic colorectal cancer with fluoropyrimidine-based chemotherapy.
- **00214**: Shared protocol has colorectal eligibility but the existing root patient services describe another tumour group. Preserve those services and create a distinct colorectal context. Current encoded CRC eligibility: With fluoropyrimidine-based chemotherapy for adults with metastatic carcinoma of the colon or rectum..
- **00215**: Shared protocol has colorectal eligibility but the existing root patient services describe another tumour group. Preserve those services and create a distinct colorectal context. Current encoded CRC eligibility: Metastatic colorectal cancer with fluoropyrimidine-based chemotherapy.
- **00244**: Indexed colorectal/GIST protocol with no existing dedicated patient bundle; preserve the GIST indication. Current encoded CRC eligibility: Previously treated metastatic colorectal cancer..
- **00382**: Existing colorectal-specific v0.84.24 suite and retrospective work; retain as an incomplete handbook/presentation upgrade, not a never-developed regimen. Current encoded CRC eligibility: Adults with metastatic colorectal cancer previously treated with, or unsuitable for, available fluoropyrimidine-, oxaliplatin-, irinotecan-, anti-VEGF- and anti-EGFR-based therapies..

All five remain selected for the current requested completion standard. 00382 already has colorectal-specific v0.84.24 suite/retrospective work, but lacks a complete handbook/reference PDF. Do not describe it as never developed. If prior legacy coverage is accepted as complete instead, the next register candidate is 00455 (CRC indication 00455k); its existing root patient services are lung-specific and must be preserved.

## Repeat audits and unresolved questions

00207, 00225, 00328, 00330 and 00331 have prior audits; the JSON matrix links their original and later service/source review evidence. These are new repeat reviews, not claims of first audit.

- 00328: existing `DIARRHOEA_NOT_RESOLVED` holds irinotecan only. Retained v7 p5 Table 5 requires the FOLFIRI hold at current diarrhoea grade ≥2; historical grade 2/3 one-week cases omit both fluorouracil hold rows. Confirm against fresh official sources before changing component rules.
- 00330/00331: existing rules require grade 0 recovery and hold at grade ≥1, citing p5. Retained p3 Table 3 describes recovery to grade ≤2. Establish current NCCP/SmPC attribution before relaxing anything.
- 00330: the weekly cetuximab 250 mg/m² schedule conflicts with the retained Table 3 400/300 mg/m² restart values. Existing specialist-review safeguards must remain until authoritative resolution.
- 00225: prior-treatment eligibility is in indication text but lacks a dedicated confirmation field in the previous limited review; do not invent numerical marrow cutoffs.

Historical references: `validation/mobile-next-batch/historical-retrospective-review.md`, `historical-irinotecan-review.md`, and `validation/colorectal-v0836/VALIDATION.md`. Retained PDFs and old passing tests do not prove current source validity.

## Blocked continuation

Current official source status is **blocked**. Source-current versions, dates, PDF hashes and page/table conclusions cannot be asserted by this local scan. No clinical corrections, completion increments or production-release readiness are claimed. Fresh source retrieval, source-derived boundary/component tests, full-suite propagation, font/renderer reconciliation, current CI, browser/PDF/QR/visual checks and exact-commit live verification remain required.
