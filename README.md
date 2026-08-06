**Current development release: v0.60.3** — mission hero correctly positioned above the engine, with SUNLIGHT contextual evidence added to the Lonsurf knowledge page.

# SACTCheck

## Current release

**SACTCheck v0.60.2 — Landing Hero Position Fix**

SACTCheck provides separate Solid Tumour and Haematology SACT libraries with deterministic, source-linked comparisons against encoded NCCP regimen criteria. v0.60.2 corrects the v0.60.1 homepage order so the mission hero appears above the working engine, regimen search remains the primary entry point and the clinical scenario interpreter remains secondary.

### v0.60.2 highlights

- Moves the persistent mission hero to the top of the library screen.
- Prevents the search-first controller from moving the catalogue ahead of the hero.
- Keeps regimen search above the collapsed early-development clinical scenario interpreter.
- Removes the unintended mission/promotional block after the regimen catalogue.
- Retains the fuller product explanation as optional content inside the welcome modal.
- Preserves all clinical rules, the fifteen-regimen knowledge base and the library-wide organ-function reconciliation.
- Leaves all 382 protocol JSON files byte-for-byte unchanged.

See `RELEASE_NOTES_v0.60.2.md`, `VALIDATION_REPORT_v0.60.2.md`, `RELEASE_NOTES_v0.60.1.md` and `V0602_PROTOCOL_JSON_HASHES.json`.

## Safety and governance

SACTCheck is clinical decision support only and is not an autonomous prescribing system. Protocol-level dose derivation stops at the source dose unit and does not calculate a patient-specific final dose. Automated testing does not constitute independent clinical validation. Always verify decisions against the current official NCCP regimen, local policy, the authorised prescribing system and clinical judgement.
