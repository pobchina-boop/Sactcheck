# SACTCheck v0.45.0 Validation Report

## Release scope

Complete current NCCP Skin/Melanoma SACT catalogue reconciliation on the v0.44.0 repository baseline.

- 16 unique Skin/Melanoma regimen codes
- 9 new canonical protocol files
- 7 existing/shared canonical protocols reconciled without duplicate cards
- 338 indexed protocols across the full library

## Automated validation completed

- Protocol index regenerated successfully: 338 unique protocol IDs
- Protocol publishing/validator suite: passed
- Full repository test suite: passed, exit code 0
- Full-suite runtime in the packaged build: 21.03 seconds
- Focused Skin/Melanoma test: passed
  - 16 protocols
  - 288 input definitions
  - 216 assessment rules
  - 221 single-value assessment checks
- GU regression test retained and passed
  - 67 protocols
  - 643 single-value checks
- Regimen-card metadata coverage: 338/338 indexed protocols
- Skin/Melanoma card-metadata review items: 0
- Emetogenic/supportive-care map coverage: 338/338 indexed protocols

## Source-derived checks

- Dacarbazine: q21d, maximum 6 cycles or earlier progression/toxicity; ANC 1.5 ×10⁹/L and platelet 100 ×10⁹/L delay thresholds; source-specific renal dose bands; high emetogenic classification.
- Pembrolizumab 400 mg: corrected to q42d and separated advanced/adjuvant duration contexts.
- Nivolumab q14d/q28d: advanced and adjuvant melanoma contexts added; adjuvant duration up to 12 months.
- BRAF/MEK therapies: BRAF V600 eligibility plus pyrexia, QTc, LVEF, ocular, CK, blood-pressure and respiratory safety pathways where applicable.
- Immune-checkpoint therapies: partial immune-toxicity assessment and optional immunotherapy-only endocrine inputs.
- Vismodegib: pregnancy-prevention programme and oral-treatment safeguards.

## Governance status

Automated software validation is complete. The clinical encodings remain prototypes pending independent Consultant Medical Oncologist and oncology-pharmacy review. The application must continue to show and link the current official NCCP PDF for manual verification. No protocol result constitutes automatic prescribing clearance.
