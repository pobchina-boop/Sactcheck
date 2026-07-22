# SACTCheck v0.36.10

## Breast gold-standard remediation batch 7

Replaced five further breast catalogue placeholders with protocol-driven assessments:

- NCCP 00201 — trastuzumab IV weekly
- NCCP 00204 — pertuzumab, trastuzumab and docetaxel
- NCCP 00206 — trastuzumab emtansine for metastatic disease
- NCCP 00212 — bevacizumab 10 mg/kg every 14 days
- NCCP 00253 — tamoxifen monotherapy

Each newly remediated regimen now has treatment-class metadata, treatment context, route/cytotoxic classification and an explicit supportive-care/emetogenic mapping.

## Renal-band interface pilot

NCCP 00217 lapatinib plus capecitabine now uses explicit protocol-specific creatinine-clearance ranges rather than requiring an exact CrCl value:

- CrCl ≥51 mL/min
- CrCl 30–50 mL/min
- CrCl <30 mL/min
- dialysis / specialist-review pathway

This establishes the reusable pattern for staged renal-band migration across the catalogue. Exact renal values remain appropriate for regimens requiring continuous calculation, including carboplatin.

## Catalogue classification

The remediated protocols now distinguish cytotoxic chemotherapy, HER2-targeted therapy, antibody-drug conjugates, anti-angiogenic targeted therapy and endocrine therapy. Tamoxifen is explicitly classified as non-cytotoxic oral endocrine therapy.

## Governance

All encodings remain prototypes pending consultant and oncology-pharmacy validation. The official NCCP protocol remains the source of truth.
