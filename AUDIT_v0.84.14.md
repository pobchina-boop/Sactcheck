# SACTCheck v0.84.14 audit

Scope: NCCP 00200, 00201, 00206, 00659 and 00726, plus the shared patient-resource disclosure. Source review date: 21 October 2026. Baseline: b96d39271fa8d179554f69fa29b85092849d7762.

## Source reconciliation

Official NCCP PDF text was reviewed with supplemental manufacturer prescribing information and primary trial publications. Audit files distinguish NCCP rules from supplemental evidence boundaries. Original source PDF binary checksums and visual inspection of original source PDFs are not claimed. Newly generated patient PDFs were visually inspected separately.

T-DM1 review: 122 actual assessment-engine cases pass. Antibody review: 70 clinical-engine scenarios and 12 metadata/governance checks pass. Total focused checks: 204. These include missing inputs, exact boundaries, reaction severity, baseline versus ongoing context, prior platelet holds, source discrepancies, and suppression of numerical restart doses when treatment is blocked or unresolved. Baseline failures include missing optional fields and metadata completeness; they must not be reported as a count of distinct unsafe clinical defects.

The 00206 bilirubin source discrepancy remains explicitly unresolved: the printed NCCP table leaves >10–20 ×ULN unassigned, while the EMA SmPC instructs discontinuation above 10. The implementation retains withholding plus urgent source reconciliation. A software audit cannot settle that source discrepancy or authorise treatment.

## Knowledge and patient services

Five profiles load through the actual knowledge-base merge and renderer. Evidence applicability, sources and maturity are retained. HERA is early-only; weekly monotherapy uses single-arm ORR; EMILIA uses the stated primary PFS/final descriptive OS analyses; KATHERINE labels final iDFS and second-interim OS; CLEOPATRA is strategy-level, not maintenance-only evidence. Newer DESTINY comparisons qualify selection wording without asserting Irish access.

Automated checks cover local asset links, phase selector events, patient numerical-evidence exclusion, no date inputs on educational timelines, shared monitoring maps, registry routing, indication-specific metadata, consent wording and explicit retrospective hash migrations. Prior clinical fixtures now state ongoing stage or previous-hold history where the new context rule requires it; clinical thresholds were not weakened to make tests pass.

Forty PDFs contain 75 pages; all have nonblank content within page bounds and byte-identical compatibility copies. Twenty QR checks cover source QR images and printed guide/passport/card destinations. Visual inspection covered all document layouts and corrected separated journey headings and stranded footer pages. Each longitudinal printout now has three pages. The patient passport retains optional paper record fields; educational timeline pages require no patient dates.

## Browser verification

The supported preview browser loaded v0.84.14. Search 00726 and Clinic workflow were exercised. Patient platform was initially collapsed, opened all five links in a vertical list and collapsed again. The clinician rationale, endpoint cards and monitoring grid rendered. A manually entered synthetic overdue-echo value returned Clinical review required, with a requirement to obtain the result and document a specialist decision; other domains remained unassessed. No real patient data was entered.

This is targeted desktop browser verification, not a manual browser audit of every rule, every regimen or every mobile viewport. The separate source-derived engine scenarios provide broader deterministic coverage.

## Preservation and governance

2371 patient/data files outside the five-suite scope remain byte-identical to baseline. Historical audit artefacts are retained; new scoped migration records explain intentionally changed hashes. The inventory records 79 authored suites, 11 reviewed cumulatively and 68 pending retrospective review.

Independent clinical, pharmacy and patient/PPI approval remains pending. Expected-event maps are educational; they do not track test booking/completion or provide automatic reminders. The release has not been committed, pushed or deployed by this task.

Final software gate results are recorded in validation/her2-retro-v08414/release-checks.json.
