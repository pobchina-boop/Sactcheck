# SACTCheck

## Current release

**SACTCheck v0.52.5 — Dose Action Navigation**

SACTCheck provides separate Solid Tumour and Haematology SACT libraries with deterministic, source-linked comparisons against encoded NCCP regimen criteria. v0.52.5 connects assessment-result dose prompts reliably to the embedded protocol dose workspace, including protocols with an encoded dose action but no complete structured schedule.

### v0.52.5 highlights

- Result prompts now open the embedded dose workspace reliably.
- Protocols with an encoded dose action but no complete structured schedule show an action-only review panel.
- The prompt label distinguishes “Review dose & schedule” from “Review dose action”.
- Existing compact laboratory inputs, phase naming and dose calculations are unchanged.

See `RELEASE_NOTES_v0.52.5.md` and `VALIDATION_REPORT_v0.52.5.md`.

## Safety and governance

SACTCheck is clinical decision support only and is not an autonomous prescribing system. Protocol-level dose derivation stops at the source dose unit and does not calculate a patient-specific final dose. Automated testing does not constitute independent clinical validation. Always verify decisions against the current official NCCP regimen, local policy, the authorised prescribing system and clinical judgement.
