# Validation report — SACTCheck v0.45.1

## Scope

Tissue-specific indication rendering and selection for protocols shared across multiple tumour libraries.

## Automated validation

- Protocol publishing validation: passed for all indexed protocol files and authoring template.
- Historical engine, partial-assessment, boundary, catalogue, alias, tissue-integrity and tumour-library regression tests: passed.
- v0.45.1 contextual indication tests: passed.
- Shared indications mapped to tumour context: 134.
- Unresolved pre-existing source/index mismatches: 3, all handled by safe fallback wording.
- Protocol count: 338.
- Full `npm test` exit code: 0.

## Specific regression checks

- Avelumab displays urothelial indication under Genitourinary and Merkel-cell indication under Skin/Melanoma.
- Cemiplimab displays cervical indication under Gynaecology and cutaneous squamous-cell indication under Skin/Melanoma.
- Nivolumab/ipilimumab displays colorectal, renal-cell or melanoma wording according to the selected tissue.
- The active tissue is carried into the assessment screen.
- The corresponding indication is preselected.
- Selecting “All cancer types” produces neutral shared-regimen wording rather than an arbitrary primary indication.
- Search continues to include all indications.

## Residual review items

The audit flags three indications whose disease text refers to a tumour group not present in the protocol index entry:

1. Two lung indications in NCCP 00212 q14d bevacizumab.
2. One breast indication in NCCP 00215 q21d bevacizumab.

The application does not expose these indications under an unrelated tissue. Their index/catalogue linkage should be reconciled against the official NCCP catalogue in a later content audit.
