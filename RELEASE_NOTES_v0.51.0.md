# SACTCheck v0.51.0 — Solid Tumour Reconciliation

**Release date:** 29 July 2026

## Purpose

This release establishes a reproducible structural and source-metadata baseline for the complete indexed Solid Tumour library before further functional development.

The NCCP states that the regimen list published on its website is not comprehensive. The reconciliation therefore compares SACTCheck with the current published NCCP web catalogue and official source documents; it does not claim that every possible national regimen is published online.

## Catalogue reconciliation

- 376 indexed protocols overall
- 361 unique Solid Tumour protocol files
- 15 Haematology protocol files, unchanged in this release
- Five Solid Tumour protocols intentionally cross-listed across tumour groups
- No duplicate protocol IDs
- No duplicate NCCP regimen codes
- No duplicate indexed paths
- No duplicate official source URLs
- No orphaned clinical protocol JSON files
- No non-HSE protocol source URLs

The generated report distinguishes unique protocol files from tumour-site placements so shared regimens are counted accurately without creating duplicate records.

## Source metadata

Twelve Solid Tumour protocols previously stored with the source version `current` now carry the explicit version displayed in the current official NCCP PDF:

- 00200 Trastuzumab IV monotherapy, version 8
- 00206 Trastuzumab emtansine, version 5
- 00217 Lapatinib and capecitabine, version 7
- 00253 Tamoxifen, version 6
- 00262 EC90, version 8
- 00263 EC75, version 7
- 00361 Fulvestrant, version 4
- 00371 Letrozole, version 4
- 00376 Exemestane, version 4
- 00423 AT 50/75, version 5
- 00619 Abemaciclib, version 4a
- 00936 Tucatinib, trastuzumab and capecitabine, version 1

The direct official PDF addresses for 00206 and 00376 were corrected. Stable internal protocol IDs were retained to avoid breaking existing bookmarks or saved references.

## Single-value assessment standardisation

All 361 Solid Tumour protocols now follow the same policy:

- Any entered relevant value can produce an immediate partial assessment.
- Blank fields remain unassessed and are never assumed normal.
- No static field, assessment profile or treatment phase blocks assessment launch.
- Conditional follow-on fields can still appear when an entered value activates a linked pathway.
- Fields previously used to define the full assessment form remain visible as optional context.

The release normalised required-input declarations in 56 protocols. It removed 66 static required flags and retained 484 formerly required context fields in the form, including 454 fields newly marked as always visible but optional.

## Reproducible audit outputs

The release adds:

- `tools/reconcile-solid-tumour-library.js`
- `V0510_SOLID_TUMOUR_RECONCILIATION.json`
- `V0510_SOLID_TUMOUR_RECONCILIATION.csv`
- `SOLID_TUMOUR_RECONCILIATION_v0.51.0.md`
- `data/nccp-solid-tumour-catalogue-sources-v0510.json`
- `data/v0510-reconciliation-change-summary.json`

Run `npm run reconcile:solid` to regenerate the reconciliation reports.

## Clinical-content boundary

No encoded rule condition, treatment threshold, dose-modification recommendation, treatment structure or Haematology protocol JSON file was changed. Rule-level comparison against every source table remains a separate Consultant Oncology and oncology-pharmacy validation task.
