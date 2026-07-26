# SACTCheck v0.45.3 validation report

## Scope

Validation of direct standard-PDF generation and adaptive pagination against the v0.45.2 clinical-output baseline.

## Automated checks

- Complete historical repository test suite: **passed**.
- Focused v0.45.3 direct-PDF test: **passed**.
- PDF header and document structure: **passed** (`PDF 1.4`).
- A4 portrait media box: **passed**.
- Routine assessment page count: **1 page**.
- Exhaustive 42-row assessment page count: **2 pages**.
- Last exhaustive row retained: **passed**.
- Page numbering: **passed**.
- Permanent disclaimer present in generated PDF: **passed**.
- Clinician decision and rationale present: **passed**.
- Assessment ID present: **passed**.
- Direct download integration: **passed**.
- `window.print()` removed from the JSON PDF action: **passed**.
- Existing v0.45.2 concise-output and v0.45.1 contextual-indication tests: **passed**.

## Render verification

Two generated documents were checked with `pdfinfo` and rendered to PNG images:

### Routine fixture

- PDF version: 1.4
- Page size: A4 portrait
- Pages: 1
- Output contained metadata, outcome, criteria table, unassessed domains, clinician decision and full disclaimer.
- No clipped text, overlap, missing footer or broken glyphs were identified.

### Exhaustive fixture

- Entered printable rows: 42
- Pages: 2
- Continuation heading and repeated table header: present
- Final row: present
- Clinician decision and disclaimer: present on the final page
- `Page 1 of 2` and `Page 2 of 2`: present
- No row was truncated across a page boundary.

## Data handling

The PDF is generated locally in the browser from the current assessment model. No assessment data is transmitted to a PDF service or external server.

## Clinical limitation

This report validates software behaviour and document layout. It does not independently validate the underlying NCCP clinical encodings. Consultant-oncologist and oncology-pharmacy review remains required before clinical reliance or deployment.
