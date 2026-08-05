# SACTCheck

## Current release

**SACTCheck v0.56.1 — Five-Regimen Knowledge Base Pilot**

SACTCheck provides separate Solid Tumour and Haematology SACT libraries with deterministic, source-linked comparisons against encoded NCCP regimen criteria. v0.56.1 expands the Regimen info framework into five detailed, source-linked regimen pages while retaining the cumulative Clinical scenario interpreter and immunotherapy-safety functionality from v0.56.0, v0.55.0 and v0.54.0.

### v0.56.1 highlights

- Adds five detailed regimen overview and evidence pages across gastrointestinal, lung, breast and gynaecological oncology.
- Adds trial population, intervention, comparator, endpoint, selected numerical findings, limitations, PubMed and DOI links.
- Retains 24 reusable drug profiles and 18 protocol evidence mappings.
- Corrects source `index.html` knowledge-base references so the function does not depend on an existing `_site` build.
- Preserves the exact name **Clinical scenario interpreter**.
- Changes no clinical protocol JSON, threshold, recommendation or dose calculation.

See `RELEASE_NOTES_v0.56.1.md`, `VALIDATION_REPORT_v0.56.1.md`, `FIVE_REGIMEN_EVIDENCE_SOURCE_REGISTER_v0.56.1.md` and `REGIMEN_INFORMATION_EVIDENCE_GOVERNANCE_v0.56.1.md`.

## Safety and governance

SACTCheck is clinical decision support only and is not an autonomous prescribing system. Protocol-level dose derivation stops at the source dose unit and does not calculate a patient-specific final dose. Automated testing does not constitute independent clinical validation. Always verify decisions against the current official NCCP regimen, local policy, the authorised prescribing system and clinical judgement.
