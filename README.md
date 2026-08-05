# SACTCheck

## Current release

**SACTCheck v0.58.1 — Organ-Function Rule Reconciliation**

SACTCheck provides separate Solid Tumour and Haematology SACT libraries with deterministic, source-linked comparisons against encoded NCCP regimen criteria. v0.58.1 is a clinical data-integrity release built on the v0.58.0 ten-regimen knowledge base and the v0.57.0 search-first interface.

### v0.58.1 highlights

- Reconciles NCCP 00450 and 00451 mitomycin plus 5-fluorouracil chemoradiation against the current official v4c source protocols.
- Adds optional CrCl, bilirubin, AST, renal-impairment and hepatic-impairment inputs with independent partial assessment.
- Corrects the platelet treatment-delay threshold to include platelet counts from 50–99 ×10⁹/L and retains the separate <50 ×10⁹/L dose-reduction pathway.
- Adds component-specific fluorouracil and mitomycin renal/hepatic actions and fluorouracil diarrhoea/mucositis modifications.
- Adds a library-wide organ-function rule-coverage audit and visibly reclassifies protocols whose organ-function rules remain incomplete.
- Preserves the search-first interface and the cumulative ten-regimen knowledge base.

See `RELEASE_NOTES_v0.58.1.md`, `VALIDATION_REPORT_v0.58.1.md`, `V0581_ORGAN_FUNCTION_RULE_COVERAGE_AUDIT.md` and `V0581_PROTOCOL_JSON_HASHES.json`.

## Safety and governance

SACTCheck is clinical decision support only and is not an autonomous prescribing system. Protocol-level dose derivation stops at the source dose unit and does not calculate a patient-specific final dose. Automated testing does not constitute independent clinical validation. Always verify decisions against the current official NCCP regimen, local policy, the authorised prescribing system and clinical judgement.
