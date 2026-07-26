# SACTCheck v0.47.2 validation report

## Scope

Regimen-library search hotfix only. Clinical protocol content was not modified.

## Automated validation

- Complete historical repository test suite: **passed**.
- Protocol publishing tests: **366 passed**.
- Canonical enabled protocol count: **361**.
- New regimen-search regression suite: **passed**.

## Search equivalence tests

The normalisation engine verified that the following searches resolve correctly:

- `folfox`
- `FOLFOX-6`
- `mFOLFOX6`
- `5 fu`
- `5-FU`
- `5FU`
- `fluorouracil`
- `leucovorin` / `folinic acid`
- `CAPOX` / `XELOX`
- `PLD` / `pegylated liposomal doxorubicin`
- NCCP regimen numbers such as `00209`

A library-wide content audit identified:

- **13** indexed protocol records matching `folfox`
- **56** indexed protocol records matching each of `5 fu`, `5-FU`, `5FU` and `fluorouracil`
- **3** indexed records matching either `CAPOX` or `XELOX`

## UI behaviour checks

- Search results update on input.
- Active search hides the favourites/recent and tumour-navigation panels so matching cards move into the immediate viewport.
- Pressing Enter runs the search, scrolls to the first result and gives visible focus feedback.
- Search is not restricted by the previously active tumour tile.
- Empty searches restore the normal library layout.

## Limitations

The search system remains deterministic substring/token matching rather than ranked fuzzy search. Misspellings are not yet corrected automatically.
