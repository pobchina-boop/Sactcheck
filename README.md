# SACTCheck

## Current release

**SACTCheck v0.60.1 — Mission-Led Landing Page**

SACTCheck provides separate Solid Tumour and Haematology SACT libraries with deterministic, source-linked comparisons against encoded NCCP regimen criteria. v0.60.1 adds a mission-led opening experience that explains the purpose, advantages and clinical boundary of the product before launching the unchanged v0.60.0 engine and fifteen-regimen knowledge base.

### v0.60.1 highlights

- Replaces the quick-start-first welcome screen with a mission-led introduction explaining what SACTCheck is, why it exists and the clinical problem it is designed to address.
- Adds a visual **Find → Assess → Explain → Verify** pathway and clear value statements for rapid navigation, structured assessment, visible decision logic and source verification.
- Adds prominent **Launch SACTCheck Engine** controls to the welcome modal, homepage hero and mission section.
- Retains the three-step quick-start guide as optional secondary guidance.
- Adds dedicated responsive desktop, tablet and mobile styling.
- Preserves the v0.60.0 fifteen-regimen knowledge base, v0.59.0 organ-function reconciliation and all deterministic clinical rules.
- Leaves all 382 protocol JSON files byte-for-byte unchanged.

See `RELEASE_NOTES_v0.60.1.md`, `VALIDATION_REPORT_v0.60.1.md`, `RELEASE_NOTES_v0.60.0.md`, `NEXT_FIVE_REGIMEN_SOURCE_REGISTER_v0.60.0.md` and `V0601_PROTOCOL_JSON_HASHES.json`.

## Safety and governance

SACTCheck is clinical decision support only and is not an autonomous prescribing system. Protocol-level dose derivation stops at the source dose unit and does not calculate a patient-specific final dose. Automated testing does not constitute independent clinical validation. Always verify decisions against the current official NCCP regimen, local policy, the authorised prescribing system and clinical judgement.
