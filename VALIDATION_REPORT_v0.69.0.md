# SACTCheck v0.69.0 — Sustainability Module Validation Note

## Scope
Technical validation of the additive sustainability navigation and page only. This is not clinical validation of sustainability claims or lifecycle carbon estimates.

## Checks
- JavaScript syntax check: PASS.
- Sustainability page contains no patient-data entry fields: PASS.
- Sustainability module does not import or call the SACTCheck clinical assessment engine: PASS.
- Main library integration is confined to the existing `library-ux.js` presentation/navigation layer: PASS.
- Per-regimen context uses catalogue metadata only and does not calculate treatment decisions: PASS.
- No universal carbon score or environmental traffic-light regimen ranking: PASS.
- Evidence links are displayed separately from NCCP clinical sources: PASS.
- Bibliographically uncertain supplied references are visibly flagged rather than treated as verified: PASS.

## Required manual smoke test after drag-and-drop
1. Load the Regimen Library with Live Server.
2. Confirm the global Sustainability button opens `sustainability.html`.
3. Confirm an active regimen card has a Sustainability action.
4. Open that action and confirm the regimen name/protocol/tumour context are displayed.
5. Return to the library and confirm protocol assessment and Rule Explorer continue to open normally.
6. Hard-refresh once before production testing because `library-ux.js` retains the existing index cache URL.
