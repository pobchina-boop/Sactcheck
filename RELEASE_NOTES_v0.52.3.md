# SACTCheck v0.52.3 — Input Classification & ECOG Guidance

## Purpose

Corrects field placement after clinical review identified pregnancy and ECOG performance status inside the Haematology subsection of Bloods and organ function.

## Changes

- Replaces unbounded `anc` substring matching with bounded laboratory-term recognition.
- Keeps pregnancy, breastfeeding, hypersensitivity and ECOG performance status outside Bloods and organ function.
- Places ECOG under Other treatment criteria.
- Adds dedicated ECOG 0–5 functional-status descriptions.
- Uses concise ECOG labels in the selector and a full expandable ECOG guide.
- Explicitly states that ECOG performance status is not a CTCAE adverse-event grade.
- Prevents the CTCAE descriptor system from adding generic adverse-event severity text to ECOG values.
- Retains the integrated laboratory and component-specific protocol dose-modification engine introduced in v0.52.2.

## Clinical-content boundary

All clinical protocol JSON files are unchanged from v0.52.2. No NCCP threshold, rule condition, treatment action, dose band or derived protocol dose was changed.

## Validation

- Library-wide classification test across 6,132 input definitions.
- 739 ECOG or reproductive fields checked and protected from laboratory classification.
- ECOG 0–5 guide and CTCAE separation tested.
- Full security, protocol publishing, historical regression, Pages build and deployable-site validation passed.

The official NCCP protocol remains authoritative. Independent Consultant Oncology and oncology-pharmacy validation remains required.
