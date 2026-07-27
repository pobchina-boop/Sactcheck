# SACTCheck v0.48.3 Validation Report

## Release

**SACTCheck v0.48.3 — Ranked oncology search**

## Scope

This release improves regimen discovery only. It does not alter protocol JSON, encoded NCCP thresholds, dose-modification logic, assessment outputs or CTCAE grading content.

## Implemented search behaviour

- Best-match ranking rather than catalogue-order results.
- Exact title, title-prefix and NCCP-number prioritisation.
- NCCP number matching with or without leading zeroes.
- Oncology-specific alias expansion for common regimen acronyms, drug abbreviations and trade names.
- Conservative edit-distance matching for longer misspelled terms.
- Clickable best-match suggestions beneath the search field.
- Visible match-reason labels and highlighted top result.
- Enter-to-jump and Escape-to-clear keyboard behaviour.
- Search remains global across tumour sites while treatment-category and availability filters remain applicable.

## Representative search checks

| Query | Matches | First three ranked results |
|---|---:|---|
| FOLFOX | 31 | Modified FOLFOX-6; FOLFOX-4 Therapy; Bevacizumab + mFOLFOX6 |
| 5-FU | 56 | 5-FU + Folinic Acid; Mitomycin and 5-Fluorouracil with Radiotherapy; Cisplatin and 5-Fluorouracil |
| pembro carbo taxol | 7 | Pembrolizumab + Carboplatin/Paclitaxel → AC; weekly variant; pembrolizumab 400 mg variant |
| NCCP 555 | 1 | FOLFOXIRI (NCCP 00555) |
| AC | 16 | AC; AC → weekly paclitaxel; DD AC → paclitaxel |
| folfux | 16 | Modified FOLFOX-6; Bevacizumab + mFOLFOX6; Panitumumab + mFOLFOX6 |

## Automated validation

- `npm run test:ci`: passed.
- Repository security scan: passed.
- Full historical and release-specific regression suite: passed.
- Deployable GitHub Pages site build: passed.
- Deployable-site validation: passed.
- New v0.48.3 ranked-search tests: passed.
- JavaScript syntax checks for new modules and all inline application scripts: passed.

## Clinical-content integrity

- Canonical indexed protocols: **361**.
- Protocol JSON files compared with uploaded baseline: **382**.
- Protocol JSON files changed: **0**.
- Protocol JSON files added: **0**.
- Protocol JSON files removed: **0**.
- Encoded NCCP clinical rules changed: **0**.

## Known scope boundary

Typo tolerance is intentionally conservative and applies to longer terms. Short oncology acronyms are resolved through explicit alias rules rather than broad fuzzy matching to reduce false positives.
