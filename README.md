# SACTCheck

## Current release

**SACTCheck v0.40.0 — Complete Lung Library**

SACTCheck is a clinician-facing NCCP protocol-driven SACT pre-assessment prototype. This release completes the active Lung catalogue with 59 distinct official NCCP regimen documents represented as live JSON assessment protocols rather than placeholders.

### v0.40.0 highlights

- 59 Lung protocols across NSCLC, SCLC, chemoradiation, mesothelioma, immunotherapy and molecularly targeted therapy.
- 38 new Lung protocol files and 21 existing/shared protocols reconciled to the official Lung inventory.
- Single-entry partial assessment retained throughout: any independently actionable entered field can return its own finding without unrelated mandatory inputs.
- CTCAE grade controls use toxicity-specific v5.0 descriptions and practical assessment guidance beside the selector.
- Actual ALT, AST and bilirubin results use the central local-laboratory ULN adapter.
- Protocol-specific renal bands are used where guidance is tiered; exact CrCl/GFR is retained for Calvert carboplatin dosing.
- Optional immunotherapy endocrine inputs, central supportive-care mappings, trade-name aliases and direct official NCCP PDF access are included.
- No Lung placeholders or draft regimen cards.

See `RELEASE_NOTES_v0.40.0.md` and `UPDATE_INSTRUCTIONS_v0.40.0.txt`.

## Safety and governance

SACTCheck is clinical decision support only and is not an autonomous prescribing system. The release is technically encoded and regression-tested, but rule-level clinical content remains pending independent consultant and oncology-pharmacy validation. Always verify decisions against the current official NCCP regimen and local policy.
