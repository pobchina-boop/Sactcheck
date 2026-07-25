# SACTCheck v0.41.1 — Regimen Title Normalisation Hotfix

## Summary

This release corrects non-standard mixed-capitalisation inherited from source-document typography in regimen names. It is a display and metadata-quality hotfix; it does not change clinical decision rules, dosing thresholds or treatment logic.

## Changes

- Normalised regimen display names across the full 270-protocol library.
- Corrected source-styled forms including CARBOplatin, PACLitaxel, CISplatin, DOXOrubicin, PEMEtrexed, DOCEtaxel, cycloPHOSphamide, SUNitinib, vinCRIStine, epiRUBicin, eriBULin, PAZOPanib, DACTINomycin, VinBLAStine and prednisoLONE.
- Updated protocol titles, short titles and treatment schedule summaries where affected.
- Preserved the exact original NCCP source title in `metadata.source_title_exact` for traceability.
- Added display-layer title normalisation safeguards to the catalogue, assessment screen and protocol importer.
- Added a regression test preventing the identified source-styled casing from reappearing in visible regimen names.

## Audit result

- 85 protocols had at least one display-title field corrected.
- 151 title or schedule-summary fields were changed.
- 669 display fields were checked across the complete library.
- All 85 corrected protocols retain their exact source title separately.
- No clinical rule, threshold, dose modification or supportive-care mapping was changed.

## Validation

- Full automated regression suite passed.
- Dedicated v0.41.1 title-normalisation tests passed.
- ZIP integrity testing passed after packaging.
