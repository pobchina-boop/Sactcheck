# Changelog

## v0.14 — Generic JSON Assessment Engine — 17 July 2026

- Added a standalone deterministic rule engine.
- Added a protocol-level assessment engine with required-input validation.
- Added a reusable JSON-generated assessment interface.
- Connected encoded protocol cards to live assessments rather than catalog-only cards.
- Added action-priority handling so the most restrictive triggered rule is returned while all triggered rules remain visible.
- Added explicit incomplete-data handling; the engine does not infer missing clinical values.
- Added copyable and downloadable assessment summaries.
- Added demonstration-value loading for safe interface testing.
- Added automated Node.js tests for NCCP 00857 and NCCP 00588 encoded rules.
- Retained all existing regimen-specific assessment screens as a fallback during migration.

### Validation status

The software architecture and encoded rules remain prototype material pending consultant, oncology-pharmacy and formal software validation. No clinical-use authorisation is implied by this release.
