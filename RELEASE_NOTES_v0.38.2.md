# SACTCheck v0.38.2 — Tumour-site metadata integrity hotfix

## Corrected

- Corrected NCCP 00688 atezolizumab + nab-paclitaxel to Breast only.
- Removed erroneous Lung and Genitourinary tumour-group metadata from that regimen.
- Rebuilt the protocol index so the regimen no longer appears when the GU or Lung filter is selected.
- Added strict validation preventing `metadata.tumour_group` and `metadata.tumour_groups` from silently disagreeing.
- Added defensive catalogue and assessment-page handling so the declared primary tumour group is used if inconsistent metadata is ever introduced.
- Added a library-wide tumour-site consistency regression test.

## Scope

This release changes tumour-site classification and display integrity only. The encoded treatment rules for NCCP 00688 are unchanged.
