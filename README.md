# SACTCheck

## Current release

**SACTCheck v0.55.0 — Global Clinical Scenario Interpreter**

SACTCheck provides separate Solid Tumour and Haematology SACT libraries with deterministic, source-linked comparisons against encoded NCCP regimen criteria. v0.55.0 adds a standalone, browser-only Clinical scenario interpreter that begins with a de-identified free-text scenario, identifies possible NCCP protocols and requires exact regimen confirmation before reusing the constrained in-regimen extraction and deterministic assessment workflow.

### v0.55.0 highlights

- Adds a regimen-agnostic Clinical scenario interpreter to the main library screen.
- Ranks possible NCCP protocols using controlled local disease, regimen, drug, trade-name, acronym and NCCP-number matching.
- Shows unmatched medicines when no single candidate protocol contains every named component.
- Requires exact regimen selection before candidate clinical values are extracted or assessed.
- Includes all v0.54.0 functionality, including the in-regimen Scenario interpreter and Immunotherapy toxicity map refinements.
- Preserves all 382 clinical protocol JSON files unchanged from v0.54.0.

See `RELEASE_NOTES_v0.55.0.md`, `VALIDATION_REPORT_v0.55.0.md` and `GLOBAL_SCENARIO_INTERPRETER_GOVERNANCE_v0.55.0.md`.

## Safety and governance

SACTCheck is clinical decision support only and is not an autonomous prescribing system. Protocol-level dose derivation stops at the source dose unit and does not calculate a patient-specific final dose. Automated testing does not constitute independent clinical validation. Always verify decisions against the current official NCCP regimen, local policy, the authorised prescribing system and clinical judgement.
