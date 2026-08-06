# SACTCheck

## Current release

**SACTCheck v0.60.0 — Fifteen-Regimen Knowledge Base**

SACTCheck provides separate Solid Tumour and Haematology SACT libraries with deterministic, source-linked comparisons against encoded NCCP regimen criteria. v0.60.0 preserves the completed v0.59.0 organ-function reconciliation and expands the detailed source-linked knowledge base from ten to fifteen regimens.

### v0.60.0 highlights

- Adds full profiles for FOLFIRI, gynaecological carboplatin/paclitaxel, pembrolizumab/paclitaxel/carboplatin, sacituzumab govitecan and durvalumab/gemcitabine/cisplatin.
- Adds treatment-intent, patient-selection, supportive-care, monitoring/toxicity and practical-administration modules.
- Adds or enriches V303, GOG-158, KEYNOTE-407, ASCENT and TOPAZ-1 evidence mappings.
- Increases the cumulative data set to 15 regimen profiles, 25 medicine profiles and 21 evidence records.
- Preserves the search-first interface, collapsed Clinical Scenario Interpreter and all v0.59.0 organ-function rules.
- Leaves all 382 protocol JSON files byte-for-byte unchanged.
- Keeps all new clinical content in draft status pending independent consultant oncology and oncology-pharmacy review.

See `RELEASE_NOTES_v0.60.0.md`, `VALIDATION_REPORT_v0.60.0.md`, `NEXT_FIVE_REGIMEN_SOURCE_REGISTER_v0.60.0.md` and `V0600_PROTOCOL_JSON_HASHES.json`.

## Safety and governance

SACTCheck is clinical decision support only and is not an autonomous prescribing system. Protocol-level dose derivation stops at the source dose unit and does not calculate a patient-specific final dose. Automated testing does not constitute independent clinical validation. Always verify decisions against the current official NCCP regimen, local policy, the authorised prescribing system and clinical judgement.
