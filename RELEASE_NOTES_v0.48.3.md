# SACTCheck v0.48.3 — Ranked oncology search

## Purpose

This release improves regimen discovery across the complete adult solid-tumour library without altering protocol JSON, encoded NCCP thresholds or clinical decision rules.

## Search improvements

- Ranks the strongest matches first rather than retaining catalogue order.
- Gives highest priority to exact regimen titles and NCCP protocol numbers.
- Expands common oncology abbreviations and trade-name variants, including:
  - 5-FU / 5FU / fluorouracil
  - leucovorin / folinic acid / calcium folinate
  - CAPOX / XELOX
  - mFOLFOX6, modified FOLFIRINOX and other regimen spelling variants
  - pembrolizumab/pembro/Keytruda, nivolumab/nivo/Opdivo and similar common abbreviations
  - carboplatin/carbo, paclitaxel/Taxol and frequently used combination shorthand
- Accepts NCCP numbers with or without leading zeroes.
- Adds conservative typo tolerance for longer oncology terms.
- Shows a compact list of the best matching regimens beneath the search field.
- Labels why a card matched and identifies the strongest result.
- Pressing Enter jumps to the best match; Escape clears the search.
- Keeps text search global across tumour sites while retaining treatment-category and availability filters.

## Safety and scope

- No protocol JSON files changed.
- No encoded NCCP rules, thresholds, dose modifications or assessment outputs changed.
- Existing CTCAE v6.0 haematology education and v0.48.1 loader stability remain in place.
