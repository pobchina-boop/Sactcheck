# SACTCheck

## Current release

**SACTCheck v0.53.0 — Immunotherapy Visual Safety**

SACTCheck provides separate Solid Tumour and Haematology SACT libraries with deterministic, source-linked comparisons against encoded NCCP regimen criteria. v0.53.0 adds an original organ-system visual safety panel to supported immune-checkpoint inhibitor regimens and links the visual map to existing symptoms, laboratory inputs and encoded assessment findings.

### v0.53.0 highlights

- Adds an in-engine **Immune safety** control for 49 supported ICI protocols.
- Organises immune-mediated toxicity monitoring into nine visual organ-system domains.
- Reuses existing entered values and deterministic assessment findings; no new management rules are introduced.
- Links to the current NCCP regimen, ESMO and SITC guidance, and relevant EMA product information.
- Preserves all clinical protocol JSON files unchanged from v0.52.5.

See `RELEASE_NOTES_v0.53.0.md`, `VALIDATION_REPORT_v0.53.0.md` and `IMMUNOTHERAPY_SAFETY_SOURCE_REGISTER_v0.53.0.md`.

## Safety and governance

SACTCheck is clinical decision support only and is not an autonomous prescribing system. Protocol-level dose derivation stops at the source dose unit and does not calculate a patient-specific final dose. Automated testing does not constitute independent clinical validation. Always verify decisions against the current official NCCP regimen, local policy, the authorised prescribing system and clinical judgement.
