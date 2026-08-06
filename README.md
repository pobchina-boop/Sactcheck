# SACTCheck

## Current release

**SACTCheck v0.59.0 — Library-Wide Organ-Function Reconciliation**

SACTCheck provides separate Solid Tumour and Haematology SACT libraries with deterministic, source-linked comparisons against encoded NCCP regimen criteria. v0.59.0 completes the organ-function remediation programme started in v0.58.1 while preserving the v0.57.0 search-first interface and cumulative ten-regimen knowledge base.

### v0.59.0 highlights

- Reconciles all 74 records previously marked partially rule-encoded for renal/hepatic coverage.
- Adds structured component-specific organ-function pathways to 70 protocols.
- Explicitly documents four mapped protocols with no prescriptive organ-function dose-adjustment table rather than inventing cutoffs.
- Adds 299 executable renal/hepatic rules while preserving optional single-value partial assessment.
- Adds a 74-record source register, reconciliation audit and SHA-256 protocol integrity register.
- Verifies through the production assessment engine that all 299 new rules can be triggered.
- Leaves independent consultant oncology and oncology-pharmacy validation pending and keeps clinical-use authorisation false.

See `RELEASE_NOTES_v0.59.0.md`, `VALIDATION_REPORT_v0.59.0.md`, `V0590_ORGAN_FUNCTION_SOURCE_REGISTER.md`, `V0590_ORGAN_FUNCTION_RECONCILIATION_AUDIT.md` and `V0590_PROTOCOL_JSON_HASHES.json`.

## Safety and governance

SACTCheck is clinical decision support only and is not an autonomous prescribing system. Protocol-level dose derivation stops at the source dose unit and does not calculate a patient-specific final dose. Automated testing does not constitute independent clinical validation. Always verify decisions against the current official NCCP regimen, local policy, the authorised prescribing system and clinical judgement.
