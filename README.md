# SACTCheck

## Current release

**SACTCheck v0.52.3 — Input Classification & ECOG Guidance**

SACTCheck provides separate Solid Tumour and Haematology SACT libraries with deterministic, source-linked comparisons against encoded NCCP regimen criteria. v0.52.3 corrects the laboratory-input classifier, keeps performance status and reproductive criteria in the appropriate clinical section, and adds dedicated ECOG functional-status guidance while retaining the integrated dose-modification engine.

### v0.52.3 highlights

- Groups haematology, renal, hepatic and other regimen-relevant laboratory inputs near the top of the assessment.
- Keeps CTCAE and clinical toxicity inputs in a separate section.
- Reuses entered values across the assessment and Dose & Schedule engines.
- Supports percentage bands, fixed dose levels, explicit replacement doses, hold/delay, omit and discontinuation pathways.
- Resolves the governing action separately for each component and retains all triggered rules for transparency.
- Displays protocol-level modified doses without calculating a patient-specific final prescription.
- Preserves all 381 clinical protocol JSON files unchanged from v0.52.1.

See `RELEASE_NOTES_v0.52.3.md` and `VALIDATION_REPORT_v0.52.3.md`.

## Safety and governance

SACTCheck is clinical decision support only and is not an autonomous prescribing system. Protocol-level dose derivation stops at the source dose unit and does not calculate a patient-specific final dose. Automated testing does not constitute independent clinical validation. Always verify decisions against the current official NCCP regimen, local policy, the authorised prescribing system and clinical judgement.
