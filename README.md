**Current development release: v0.62.0** — NCCP source change surveillance with a mandatory human review gate.

# SACTCheck

## Current release

**SACTCheck v0.62.0 — NCCP Change Tracker**

SACTCheck provides separate Solid Tumour and Haematology SACT libraries with deterministic, source linked comparisons against encoded NCCP regimen criteria. v0.62.0 adds a version aware source surveillance and review layer while preserving all clinical assessment rules unchanged.

### v0.62.0 highlights

1. Registers all 376 enabled protocols in a canonical NCCP source register.
2. Adds detection for new sources, updated sources, silent PDF replacement and removed or moved source candidates.
3. Adds PDF and extracted text fingerprint capture through a scheduled GitHub workflow.
4. Adds clinical significance triage for possible treatment, safety workflow, information and formatting changes.
5. Adds a dedicated What is New and What Has Changed dashboard.
6. Adds previous and current source comparison and change history fields.
7. Adds per regimen source status to the generic assessment screen.
8. Preserves a mandatory human review gate and prohibits automatic clinical rule updates.
9. Leaves all 382 protocol JSON assets unchanged from v0.61.0.

The local baseline is complete. Remote fingerprints are captured by the first repository workflow run because the release preparation environment could not access the NCCP website directly.

See `RELEASE_NOTES_v0.62.0.md`, `VALIDATION_REPORT_v0.62.0.md`, `NCCP_CHANGE_TRACKER_GUIDE_v0.62.0.md`, `NCCP_CHANGE_TRACKER_SOURCE_REGISTER_v0.62.0.md` and `V0620_PROTOCOL_JSON_HASHES.json`.

## Safety and governance

SACTCheck is clinical decision support only and is not an autonomous prescribing system. Protocol-level dose derivation stops at the source dose unit and does not calculate a patient-specific final dose. Automated testing and evidence auditing do not constitute independent clinical validation. Always verify decisions against the current official NCCP regimen, local policy, the authorised prescribing system and clinical judgement.
