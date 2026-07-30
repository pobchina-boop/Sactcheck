# SACTCheck

## Current release

**SACTCheck v0.51.0 — Solid Tumour Reconciliation**

SACTCheck provides separate Solid Tumour and Haematology SACT libraries with structured comparisons against NCCP regimen criteria. v0.51.0 establishes a reproducible reconciliation baseline for the 361 indexed Solid Tumour protocols while leaving the 15 Haematology protocol files unchanged.

### v0.51.0 highlights

- Reconciles 361 unique Solid Tumour protocol files within the 376 protocol catalogue.
- Checks duplicate IDs, NCCP codes, paths, official source URLs and orphan protocol files.
- Replaces 12 non-specific source-version labels with explicit versions from current official NCCP PDFs.
- Corrects the official PDF addresses for NCCP 00206 and 00376.
- Standardises optional single-value assessment across all 361 Solid Tumour protocols.
- Retains formerly required form fields as visible treatment context while removing mandatory launch blocking.
- Adds repeatable JSON, CSV and Markdown reconciliation reports.
- Preserves all encoded clinical rules, treatment structures and Haematology protocol JSON files unchanged.

See `RELEASE_NOTES_v0.51.0.md`, `VALIDATION_REPORT_v0.51.0.md` and `SOLID_TUMOUR_RECONCILIATION_v0.51.0.md`.

## Safety and governance

SACTCheck is clinical decision support only and is not an autonomous prescribing system. Structural reconciliation and automated regression testing do not constitute independent clinical validation. Always verify decisions against the current official NCCP regimen, local policy and clinical judgement.
