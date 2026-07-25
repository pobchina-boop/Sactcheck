# SACTCheck

## Current release

**SACTCheck v0.41.0 — Complete Sarcoma Library**

SACTCheck is a clinician-facing NCCP protocol-driven SACT pre-assessment prototype. This release completes the current Sarcoma catalogue with 25 distinct NCCP regimen documents represented as live JSON assessment protocols rather than placeholders.

### v0.41.0 highlights

- 25 active Sarcoma protocols spanning soft-tissue sarcoma, osteosarcoma, Ewing sarcoma, rhabdomyosarcoma, GIST, Kaposi sarcoma and aggressive fibromatosis.
- 19 dedicated Sarcoma protocol files plus 6 canonical shared protocols reconciled for explicit Sarcoma/GIST use.
- Source-specific ifosfamide, Mesna, hydration, encephalopathy, MAP/high-dose methotrexate rescue, anthracycline cardiac, cisplatin renal, PLD, trabectedin and oral targeted-therapy pathways.
- Single-entry partial assessment retained throughout: any independently actionable entered field can return its own finding without unrelated mandatory inputs.
- CTCAE grade controls use toxicity-specific v5.0 descriptions and practical assessment guidance beside the selector.
- Actual ALT, AST and bilirubin results use the central local-laboratory ULN adapter.
- Protocol-specific renal bands are used where guidance is tiered.
- Phase-dependent antiemetic/supportive-care profiles, trade-name aliases and direct official NCCP PDF access are included.
- No Sarcoma placeholders or draft regimen cards.
- Complete catalogue expanded to 270 distinct protocols.

See `RELEASE_NOTES_v0.41.0.md`, `SARCOMA_LIBRARY_SOURCES_v0.41.0.md` and `UPDATE_INSTRUCTIONS_v0.41.0.txt`.

## Safety and governance

SACTCheck is clinical decision support only and is not an autonomous prescribing system. The release is technically encoded and regression-tested, but rule-level clinical content remains pending independent consultant and oncology-pharmacy validation. Always verify decisions against the current official NCCP regimen and local policy.
