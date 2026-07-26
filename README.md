# SACTCheck

## Current release

**SACTCheck v0.45.2 — One-page clinical output and safety-language update**

SACTCheck is a clinician-facing NCCP protocol-driven SACT pre-assessment prototype. This release adds a concise, source-traceable one-page clinical summary for printing or saving as PDF while preserving the full detailed assessment for audit and validation.

### v0.45.2 highlights

- Dedicated A4 one-page assessment output.
- Compact entered-value versus encoded-criterion table.
- Abnormal and review-triggering findings prioritised above routine normal entries.
- Explicit unassessed-domain disclosure.
- Clinician decision and concise rationale/override fields kept separate from the calculated result.
- Permanent decision-support disclaimer on screen, in the PDF and in text exports.
- Non-directive wording that reports encoded criteria rather than authorising treatment.
- Complete historical and release-specific regression suite passed.

See `RELEASE_NOTES_v0.45.2.md` and `VALIDATION_REPORT_v0.45.2.md`.

## Safety and governance

SACTCheck is clinical decision support only and is not an autonomous prescribing system. The release is technically encoded and regression-tested, but rule-level clinical content remains pending independent consultant and oncology-pharmacy validation. Always verify decisions against the current official NCCP regimen and local policy.
