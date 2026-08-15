# SACTCheck v0.67.0 validation report

Validation date: 15 August 2026

## Scope

This release expands the structured regimen knowledge base only. It does not alter deterministic clinical assessment rules.

## Knowledge base validation

The focused v0.67.0 regression suite passed.

Confirmed totals:

* 30 detailed regimen profiles
* 66 principal evidence records
* 35 reusable medicine profiles

Confirmed new profiles:

* NCCP 00689 Version 4, atezolizumab with carboplatin and etoposide
* NCCP 00204 Version 11, pertuzumab with trastuzumab and docetaxel
* NCCP 00415 Version 4, dabrafenib with trametinib

Confirmed new principal evidence records:

* IMpower133
* CLEOPATRA
* COMBI d
* COMBI v
* COMBI AD

Confirmed new medicine profiles:

* Etoposide
* Dabrafenib
* Trametinib

## Evidence completeness checks

The v0.67.0 test suite confirms that:

* IMpower133 includes updated overall survival and five year follow up.
* CLEOPATRA includes final overall survival and end of study follow up.
* Dabrafenib and trametinib includes separate metastatic and adjuvant evidence.
* COMBI AD includes the final 2024 overall survival analysis.
* The COMBI AD statistical limitation remains visible.
* Current NCCP subcutaneous atezolizumab context is represented without implying that it was randomised within the original IMpower133 trial.

## Clinical core integrity

All 382 clinical protocol JSON files were compared with the v0.66.0 baseline hashes.

Result: no clinical protocol JSON changes.

No deterministic treatment threshold, eligibility rule, dose action, organ function rule, treatment schedule or clinical input definition changed.

## Cumulative regression testing

The complete cumulative test suite passed through v0.67.0.

The final sequence included successful tests for:

* 376 registered NCCP protocols
* 451 tissue validation contexts
* national antiemetic source mapping
* all previous knowledge base releases
* the new v0.67.0 knowledge base expansion

## Security and deployment validation

Repository security check passed with 1049 text files scanned.

The static site build passed and copied 382 protocol JSON files.

Deployable site validation passed.

## Clinical governance status

The three new knowledge profiles remain draft content pending independent consultant oncology and oncology pharmacy review.

The current official NCCP source remains authoritative for treatment decisions.
