# SACTCheck v0.47.2 — Regimen search hotfix

## Purpose

Correct the regimen-library search workflow introduced in v0.47.1 and make common oncology terminology reliably searchable.

## Changes

- Fixed live catalogue filtering from the primary regimen search field.
- Added a visible matching-result count immediately beneath the search input.
- Added Enter-to-jump behaviour, focusing and scrolling to the first matching regimen.
- Moved matching cards directly beneath the search controls by temporarily collapsing favourites/recent protocols and tumour navigation while a query is active.
- Made free-text search global across tumour sites even when a tumour tile was previously selected.
- Expanded the searchable card text to include rendered card content as well as structured search metadata.
- Added punctuation, spacing and hyphen normalisation.
- Added common clinical equivalences including:
  - 5-FU, 5FU, 5 FU and fluorouracil
  - mFOLFOX6, modified FOLFOX-6 and FOLFOX variants
  - leucovorin, folinic acid and calcium folinate
  - CAPOX and XELOX
  - PLD and pegylated liposomal doxorubicin
- Added search-specific regression tests.

## Clinical-content impact

No protocol JSON files, thresholds, clinical rules, indications or source links were changed.
