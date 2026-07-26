# SACTCheck

## Current release

**SACTCheck v0.45.3 - Direct adaptive clinical PDF generation**

SACTCheck is a clinician-facing NCCP protocol-driven SACT pre-assessment prototype. This release replaces browser printing with a direct standard-PDF output that normally fits on one A4 page and expands automatically only when the entered assessment requires more space.

### v0.45.3 highlights

- Direct **Generate PDF** action with no browser print dialogue.
- Standard downloadable A4 PDF that can be opened, stored or printed normally.
- One-page output by default for routine assessments.
- Automatic continuation pages for exhaustive input without clipping or omitted entered values.
- Repeated table headings, page numbering and source-verification footers.
- Permanent decision-support disclaimer and explicit unassessed-domain disclosure.
- Local offline PDF generation with no external data transmission.
- Complete historical and release-specific regression suite passed.

See `RELEASE_NOTES_v0.45.3.md` and `VALIDATION_REPORT_v0.45.3.md`.

## Safety and governance

SACTCheck is clinical decision support only and is not an autonomous prescribing system. The release is technically encoded and regression-tested, but rule-level clinical content remains pending independent consultant and oncology-pharmacy validation. Always verify decisions against the current official NCCP regimen and local policy.
