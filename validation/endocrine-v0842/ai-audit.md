# AI source audit — v0.84.2

255/255 source-derived scenarios passed; all 79 rules exercised. Strict focused validation passed for all three protocols. Independent clinical/pharmacy validation remains pending.

| NCCP | Medicine | Version | Rules | Schedule |
|---|---|---:|---:|---|
| 00254 | anastrozole | 5 | 28 | Anastrozole 1 mg orally once daily continuously; no planned cycle break. |
| 00371 | letrozole | 4 | 26 | Letrozole 2.5 mg orally once daily continuously; no planned cycle break. |
| 00376 | exemestane | 4 | 25 | Exemestane 25 mg orally once daily continuously; no planned cycle break. |

## Material corrections

- **AI-01 (major):** 79 source-linked rules cover actual endocrine eligibility, source organ-function distinctions, interactions, symptoms and monitoring. Unsupported cytotoxic blood-count/CTCAE treatment cutoffs are not added.
- **AI-02 (major):** Child–Pugh C displays 2.5 mg every other day exactly as the NCCP table. It never calculates a 1.25 mg daily tablet instruction. Concurrent unresolved safety review prevents a numeric restart display.
- **AI-03 (major):** Anastrozole severe hepatic impairment is not recommended and prompts withholding pending review; exemestane has no hepatic reduction, with HPRA caution retained.
- **AI-04 (major):** Explicit exclusions and menopause uncertainty are encoded. AI alone does not validate an ovarian-suppression combination. Returning ovarian function prompts review before further monotherapy.
- **AI-05 (major):** Continuous once-daily oral schedules and all 11 NCCP indications are represented, including 00371 neoadjuvant 4–8-month response/surgery pathway and indication-specific prior endocrine history.
- **AI-06 (moderate):** Agent-specific optional bands/numeric inputs preserve anastrozole GFR <30 caution and the letrozole SmPC evidence gap below CrCl 10. No unsupported percentage reduction or false low-renal clearance.
- **AI-07 (moderate):** Bone risk, indicated DXA/bone protection, intolerable symptoms, oestrogen/tamoxifen prescription review and relevant CYP interactions are represented without forcing generic chemotherapy side effects.
- **AI-08 (moderate):** 25 mg preferably after a meal, no catch-up/double dosing, consider baseline vitamin D; no automatic dose doubling with CYP3A4 inducers.

## Source discrepancies and boundaries

- **00254 — Eligibility wording:** NCCP broad HR-positive indications coexist with an additional eligibility bullet listing tamoxifen contraindication or intolerance. An explicit report that tamoxifen is suitable produces a review message; missing history does not block unrelated partial assessment.
- **00254 — Hepatic source difference:** NCCP p2 says severe hepatic impairment is not recommended; NCCP p1 and the linked SmPC §§4.2/4.4 describe moderate/severe hepatic caution. The card follows the stricter NCCP no-treatment recommendation pending specialist review and does not mislabel severe hepatic disease as an absolute SmPC contraindication. Child–Pugh A/B/C is the UI classification of mild/moderate/severe impairment.
- **00371 — Hepatic source difference:** NCCP p2 supplies 2.5 mg every other day in Child–Pugh C. The NCCP-linked 2019 HPRA SmPC describes insufficient data/close supervision but does not prescribe that frequency reduction. The explicit NCCP instruction is displayed with this distinction and consultant/pharmacy confirmation.
- **00371 — Renal source difference:** NCCP no-adjustment/dialysis-expected-no-adjustment wording is broader than the linked SmPC, which says evidence is insufficient below CrCl 10 mL/min. Low CrCl/dialysis remains a specialist review; no reduced dose is guessed.
- **00254, 00376 — Product-specific indication scope:** The linked Teva anastrozole SmPC lists advanced disease, whereas NCCP also lists adjuvant indications. The linked Aromasin SmPC describes switching after 2–3 years of tamoxifen and completing 5 total years, whereas NCCP also has broader adjuvant/extended-adjuvant entries. Preserve NCCP indication codes; verify the actual dispensed product and individual endocrine-duration plan rather than silently substituting product wording.
- **00376 — Linked SmPC date:** NCCP references an August 2025 product update but links to a PDF whose visible header is 9 January 2025. The linked file was read as dated; no claim that this is the latest SmPC for every product is made.
- **00254, 00371, 00376 — Bone monitoring interval:** NCCP says risk-based baseline and regular/as-clinically-indicated BMD, without a single fixed repeat interval. Any proposed 1–2-year DXA schedule must be separately cited to a guideline and individualised, not presented as an exact NCCP mandate.
- **00254, 00371, 00376 — Source capture limitation:** Direct PDF downloads returned HTTP403; web tool text is available. Screenshot requests returned text-only ImageDisplayed markers and no image bytes. The audit checks the extracted labelled tables, does not claim visual table verification, and hashes the text snapshot rather than nonexistent PDF bytes.

## Source provenance

- NCCP 00254: https://healthservice.hse.ie/documents/6358/254_v5_Anastrazole.pdf (four pages).
  - Linked product information: https://assets.hpra.ie/products/Human/20912/Licence_PA0749-028-001_25072025123349.pdf
  - Extracted-source text SHA-256: `9b2762629cfeac114a6e9cf4a9201d8a9fba9ca112041028f134340518f94a4a`. This is not a PDF hash.
- NCCP 00371: https://healthservice.hse.ie/documents/6817/371_Letrozole_.pdf (four pages).
  - Linked product information: https://assets.hpra.ie/products/Human/21055/Licence_PA0749-085-001_12112019144136.pdf
  - Extracted-source text SHA-256: `a2d72cb177c830ca09e432faca18a9c0253f059654268cb7e916a2c120b324f7`. This is not a PDF hash.
- NCCP 00376: https://healthservice.hse.ie/documents/6568/376_Exemestane_therapy.pdf (four pages).
  - Linked product information: https://assets.hpra.ie/products/Human/23117/Licence_PA0822-111-001_09012025155108.pdf
  - Extracted-source text SHA-256: `56a511c9a83b9c23d4d8819464588f99d3614dedf80d25ee952e649d1220a983`. This is not a PDF hash.

## Verification limits

No interactive browser run or independent clinical sign-off. Source text, strict protocol schema validation, synthetic rule-engine assessments and visible dose/schedule models were checked. PDF screenshots were requested but no image bytes were supplied by the browsing tool. No universal ECG/echo/CT/DXA interval, cycle restart, chemotherapy count threshold or automatic OFS assumption is invented.

Existing actual protocol IDs are preserved; 00371 and 00376 retain their existing `vcurrent` IDs alongside source-version `v4` metadata aliases.
