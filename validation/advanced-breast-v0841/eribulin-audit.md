# Eribulin source reconciliation — v0.84.1

Checked 18 October 2026. Independent consultant and oncology pharmacy validation remain pending. These are software/source audit findings, not clinical authorisation.

## 00228

Source: https://healthservice.hse.ie/documents/6564/228_eriBULin.pdf
Footer version 8; 6 pages; SHA-256 `f114a79c5c7d4058dddc067cd1a6290ae00cb12ecb42944b14aad8f02870d292`.

Page 3 dose tables were rendered and visually checked; full PDF text was reviewed.

- Initial versus ongoing count thresholds and missing-stage protection (p1–2): Separate ANC1.5/platelets>100 baseline from ANC1/platelets75 treatment-day; unsafe standalone counts act without a stage.
- Named severe toxicity and prior-event partial inputs were incompletely assessed (p2–3): Neuropathy/mucositis and qualifying historic events act independently; missing current dose/recurrence remains explicit review.
- Recurrence dose ladder must not infer recurrence from a reduced current dose alone (p3 Tables1/3): Add recurrence confirmation,0.97/0.62 targets and consider-discontinuation review; prevent re-escalation.
- Cardiac/exclusion and monitoring coverage (p2;00743pp4–5;EMA§4.4): Encode congenital QT, breastfeeding, hypersensitivity, risk-directed ECG, electrolytes;00228 significant CV exclusion remains code-specific.
- Organ impairment percentages are original-dose instructions (p3 Table2): Retain source percentages with specialist dose reconciliation; dialysis remains may-consider; numeric dose calculation disabled for ambiguous current-dose/concurrent contexts.
- Drug base/salt and cycle schedule are distinct (p1): 1.23mg/m² eribulin base, days1/8 q21; not1.4mg/m² salt substitution.
- Breast indication omitted; card reduced to sarcoma (p1): Restore00228a breast and00228b liposarcoma with prior-treatment/suitability caveats.
- CrCl exactly50 unspecified; old ≥50 input overclaimed >50 source row (p3 Table2): New measured input and gt50/eq50 bands; equality/legacy ambiguous band explicitly reviewed.
- Footer/version-control mismatch (p1/6): Preserve stable footerv8 identity; record v9review-schedule-only entry dated20May2026.

Limitations:
- Independent consultant and oncology pharmacy validation pending; source reconciliation is not clinical-use authorisation.
- Renal/hepatic percentages refer to the original dose; prior reductions and competing pathways require specialist reconciliation.
- NCCP cycle-start blood tests supplemented by EMA SmPC FBC before every dose; ECG is risk-triggered, not a universal fixed-cycle schedule.
- Current PDF footer states version 8, while its change log records version 9 dated 20/05/2026 for review-schedule amendment only; protocol identity remains nccp-00228-v8.
- Table 2 lists CrCl >50 and <50 but leaves exactly 50 mL/min unspecified; equality and legacy ge50 input require review.

## 00743

Source: https://healthservice.hse.ie/documents/6623/743_v3_eriBULin_Monotherapy_28_day.pdf
Footer version 3; 5 pages; SHA-256 `8d2cf187c0615e07a2d9e6a146fd09ea915255128467c09e59003e09c5717077`.

Page 3 dose tables were rendered and visually checked; full PDF text was reviewed.

- Initial versus ongoing count thresholds and missing-stage protection (p1–2): Separate ANC1.5/platelets>100 baseline from ANC1/platelets75 treatment-day; unsafe standalone counts act without a stage.
- Named severe toxicity and prior-event partial inputs were incompletely assessed (p2–3): Neuropathy/mucositis and qualifying historic events act independently; missing current dose/recurrence remains explicit review.
- Recurrence dose ladder must not infer recurrence from a reduced current dose alone (p3 Tables1/3): Add recurrence confirmation,0.97/0.62 targets and consider-discontinuation review; prevent re-escalation.
- Cardiac/exclusion and monitoring coverage (p2;00743pp4–5;EMA§4.4): Encode congenital QT, breastfeeding, hypersensitivity, risk-directed ECG, electrolytes;00228 significant CV exclusion remains code-specific.
- Organ impairment percentages are original-dose instructions (p3 Table2): Retain source percentages with specialist dose reconciliation; dialysis remains may-consider; numeric dose calculation disabled for ambiguous current-dose/concurrent contexts.
- Drug base/salt and cycle schedule are distinct (p1): 1.23mg/m² eribulin base, days1/15 q28; not1.4mg/m² salt substitution.
- Wrong source page count and absent off-label posology context (p1/5): Correct7→5pages; add unlicensed28-day consent/DTC note.

Limitations:
- Independent consultant and oncology pharmacy validation pending; source reconciliation is not clinical-use authorisation.
- Renal/hepatic percentages refer to the original dose; prior reductions and competing pathways require specialist reconciliation.
- NCCP cycle-start blood tests supplemented by EMA SmPC FBC before every dose; ECG is risk-triggered, not a universal fixed-cycle schedule.
- The 28-day posology is unlicensed in Ireland: patient information/consent and local Drugs and Therapeutics Committee acknowledgement apply.

## Additional monitoring source

https://www.ema.europa.eu/en/documents/product-information/halaven-epar-product-information_en.pdf

EMA SmPC §4.4 supplies blood count before every dose, periodic electrolytes and risk-directed ECG. The NCCP documents specify renal/liver tests at cycle start. No source-fixed CT, echo or tumour-marker interval is invented. NCCP00743 explains the unlicensed28-day posology on p5.

Verification:205/205 source-derived scenarios passed;381/381 protocol-publishing validator tests passed. Numeric dose checks inspect the primary displayed component row (a contraindication is marked quantified by the model but is not a numeric restart). Source reconciliation and software checks do not replace independent clinical/pharmacy review.
