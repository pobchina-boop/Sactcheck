# SACTCheck v0.47.1 Validation Report

## Scope

Clinician-focused usability release applied to the v0.47.0 complete adult solid-tumour baseline.

## Automated verification

- Complete repository test command: `npm test`
- Result: PASS
- Exit code: 0
- Enabled canonical protocol records: 361
- Protocol publishing/validation fixtures: 366
- Regimen-card metadata coverage: 361 published protocols
- Historical clinical engine, single-entry, tumour-library, contextual-indication and direct-PDF tests: PASS
- New clinician UI regression test: PASS

## Release-specific checks

- Canonical card count derives from enabled `protocols/index.json` records.
- Non-canonical placeholder cards are removed after canonical loading.
- Duplicate legacy-card targets cannot suppress distinct protocols.
- Main search, clear-filters and empty-state controls are present.
- Developer JSON preview is hidden unless debug mode is explicitly requested.
- Favourites and recent protocols use local browser storage only.
- Haematology is labelled as limited coverage.
- Common phased regimens display the complete phase sequence rather than a misleading single interval.
- Regimen cards combine source and clinical-validation status and retain expandable technical details.
- Assessment results use non-directive encoded-criteria terminology.
- Patient value, threshold and result are prioritised above detailed interpretation.
- Missing domains remain explicitly unassessed and are never assumed normal.
- Detailed rule output remains available through progressive disclosure.
- Direct PDF generation remains active; no browser-print action is present in the JSON assessment output.

## Clinical-content integrity

No protocol JSON files were changed by the v0.47.1 usability release. The existing NCCP source links, clinical inputs and assessment rules are retained from v0.47.0.

## Browser rendering limitation in build environment

Automated Chromium navigation was unavailable in the packaging environment because local browser navigation was administratively blocked. Validation therefore used source-level interface assertions, module syntax checks, protocol-index reconciliation and the complete Node regression suite. A short visual check in the target browser is still required after applying the drop-in package.
