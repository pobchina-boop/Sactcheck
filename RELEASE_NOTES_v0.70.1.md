# SACTCheck v0.70.1 — Source Fidelity Hotfix

## Scope
Focused source-fidelity remediation after clinician testing identified a stale Lonsurf source link, ambiguous Lonsurf ANC display/context, and under-encoded ribociclib hepatobiliary management.

## Clinical source reconciliation
- NCCP 00382 is reconciled at runtime to Version 4, last reviewed 01/07/2026, using the current official HSE PDF.
- Lonsurf now explicitly separates within-cycle interruption thresholds (ANC <0.5 ×10⁹/L; platelets <50 ×10⁹/L) from start-of-next-cycle resumption thresholds (ANC ≥1.5 ×10⁹/L; platelets ≥75 ×10⁹/L).
- The >1-week delay criterion that triggers a 5 mg/m²/dose Lonsurf reduction is encoded separately from the simple interruption criterion.
- Lonsurf renal handling is updated to the v4 CrCl <30 severe-renal-impairment pathway; haemodialysis remains not recommended. Moderate/severe hepatic impairment remains not recommended.
- NCCP 00525 v6 and 00892 v2 ribociclib hepatobiliary tables are converted from a coarse manual grade selector to actual ALT/AST and bilirubin entry with automatic local-laboratory ×ULN calculation.
- Ribociclib baseline grade, recurrence, bilirubin >2 ×ULN and absence-of-cholestasis logic are represented explicitly.
- The NCCP source tables' CTCAE v4.03 basis is preserved rather than silently substituting the separate SACTCheck CTCAE v5 education layer.
- QT prolongation and ILD/pneumonitis pathways are expanded, including the adjuvant-specific recurrent QTcF >500 ms discontinuation pathway.
- The previous adjuvant ribociclib Child-Pugh B/C dose-reduction rule is removed because NCCP 00892 v2 states that no hepatic dose adjustment is necessary in early breast cancer with hepatic impairment.

## Source-link resilience
- Current direct PDF links are retained.
- A secondary NCCP regimen-catalogue route is shown for Lonsurf, metastatic/adjuvant ribociclib and adjuvant abemaciclib.
- The Abemaciclib direct source remains the current NCCP 00619 v4a PDF; no clinical Abemaciclib rule change is made in this release.

## Change Tracker
- When the production change feed has not completed its remote comparison, the header state is shown as “pending” rather than allowing an apparent zero-update state to imply source currency.

## Governance
- Current NCCP source remains authoritative.
- Independent Consultant Oncology and oncology-pharmacy review remain pending.
- This hotfix does not constitute clinical validation or treatment authorisation.
- The v0.70.0 reconciliation for NCCP 00101, 00256 and 00783 remains intact.
- The engine-first NCCP meeting UI and prior regimen-search security remediation are preserved.
