# SACTCheck v0.63.0 Validation Report

## Release scope

This release adds the Primary Clinical Validation Workspace. No clinical protocol JSON file is intentionally changed.

## Automated validation completed

1. Complete cumulative SACTCheck test suite passed.
2. Focused v0.63.0 clinical validation workspace tests passed.
3. The clinical validation register contains all 376 enabled protocols.
4. The register creates 451 separate tissue review contexts for shared protocols.
5. Every register entry includes protocol identity, source metadata, input count, rule count and tissue context.
6. Review logging supports confirmed, not applicable, correction required, oncology pharmacy review and consultant review states.
7. Primary review completion requires every review domain to be resolved and no open issues to remain.
8. Full validation log JSON export is present.
9. CSV summary export is present.
10. JSON import and local record restoration are present.
11. Direct current NCCP source access is present where a source link exists.
12. Direct SACTCheck assessment access is present from the validation record.
13. Repository security check passed across 995 text files.
14. Static site build passed.
15. Deployable site validation passed.
16. All 382 protocol JSON assets are unchanged from v0.62.1.

## Protocol integrity

Baseline release: v0.62.1

Current release: v0.63.0

Protocol JSON files checked: 382

Protocol JSON files changed: 0

Detailed hashes are stored in V0630_PROTOCOL_JSON_HASHES.json.

## Governance boundary

The workspace records primary clinical product owner review. It does not confer formal consultant oncology validation, oncology pharmacy validation or treatment authorisation.

Independent specialist validation remains pending.
