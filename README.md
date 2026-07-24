# SACTCheck

## Current release

**SACTCheck v0.39.0 — Complete Gastrointestinal Library**

SACTCheck is a clinician-facing NCCP protocol-driven SACT pre-assessment prototype. This release completes the active gastrointestinal catalogue with 93 distinct official NCCP regimen documents represented as live JSON assessment protocols rather than placeholders.

### v0.39.0 highlights

- 93 gastrointestinal regimen protocols across colorectal, upper GI, pancreatic, hepatobiliary, anal/rectal chemoradiation and neuroendocrine treatment.
- 65 newly added GI protocol files and 28 existing/shared protocols reconciled to the official GI inventory.
- Single-entry partial assessment retained throughout: any independently actionable entered field can return its own finding without unrelated mandatory inputs.
- CTCAE grade controls use toxicity-specific v5.0 descriptions and practical assessment guidance beside the selector.
- Actual ALT, AST and bilirubin results continue to use the central local-laboratory ULN adapter.
- Protocol-specific renal bands are used where the regimen has tiered renal guidance; exact CrCl is retained for Calvert carboplatin dosing.
- Central supportive-care and antiemetic mappings, trade-name search aliases and direct official NCCP PDF access are included.
- No GI placeholders or draft regimen cards.

See `RELEASE_NOTES_v0.39.0.md` and `UPDATE_INSTRUCTIONS_v0.39.0.txt`.

## Safety and governance

SACTCheck is clinical decision support only and is not an autonomous prescribing system. The release is technically encoded and regression-tested, but rule-level clinical content remains pending independent consultant and oncology-pharmacy validation. Always verify decisions against the current official NCCP regimen and local policy.
