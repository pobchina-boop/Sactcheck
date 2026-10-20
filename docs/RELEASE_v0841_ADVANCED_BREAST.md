# SACTCheck v0.84.1

Five full suites, built on committed v0.84.0 (`4856a9a849bf16b8312428fe1d2ce39e5e13264c`). Source checks: 18 October 2026. This package is prepared for the product owner's review, commit and push; it is not a live deployment.

| NCCP | Regimen | Schedule distinction |
|---|---|---|
| 00228 | Eribulin | Days 1 and 8 every 21 days; breast and source-defined liposarcoma indications |
| 00743 | Eribulin | Days 1 and 15 every 28 days; unlicensed posology and explicit consent |
| 00230 | Nab-paclitaxel | 260 mg/m² every 21 days; response review after two cycles |
| 00736 | Nab-paclitaxel | 100 mg/m² Days 1, 8, 15 every 28 days; weekly alternative for standard-paclitaxel intolerance / hypersensitivity |
| 00205 | Pegylated liposomal doxorubicin | 50 mg/m² every 28 days; indication-specific eligibility and cumulative cardiac monitoring |

## Full service coverage

Each suite includes the clinical decision mapping, clinician knowledge and population-specific evidence, consent generator and printable consent aid, supportive-prescription draft, patient knowledge, four-point medicine-specific anatomy map, date-free reference cycle, longitudinal pathway, expected blood/ECG/echo/imaging checks, access logistics, guide, passport, contact card, QR routes and sustainability metadata. The breast filters identify these as advanced-disease regimens and do not invent a receptor restriction or an adjuvant/maintenance phase.

The treatment maps do not require patient dates or personal parameters. They distinguish expected checks from booked or completed appointments. Imaging windows are cancer- and regimen-specific; CT-TAP, tumour markers, DEXA and three-month echoes are not automatically applied to everyone. The 00230 review after two cycles takes priority over a general metastatic response interval.

## Principal audit findings

- **Weekly nab-paclitaxel:** the previous 00736 mapping reused 220/180 mg/m² reductions from the three-weekly regimen, above its own starting dose. Replaced with the source 100 → 80 → 60 ladder, current-dose history and recovery checks. Numeric dose tiles are tested.
- **Eribulin:** restored the 00228 breast indication and corrected initial versus ongoing count thresholds, recurrence-dependent reduction, cardiac restrictions and incomplete-input handling. The EU base dose is kept distinct from the mesylate expression used in trial reports.
- **PLD:** corrected indication suffixes and cancer-specific ECOG criteria, absolute bilirubin thresholds, overlapping cytopenia branches and PPE/stomatitis grade/history/delay logic. Cardiac monitoring beyond cumulative anthracycline 450 mg/m² is not encoded as an automatic lifetime treatment stop.
- **Grading guide:** PLD source-table skin/mouth grades now show their named NCCP/Caelyx source instead of a misleading CTCAE v5 label. Existing CTCAE behavior remains available for other fields.
- **Source conflicts remain declared:** examples include weekly nab-paclitaxel count thresholds across source sections, severe hepatic/neuropathy wording, PLD bilirubin table gaps/alternatives, and the 00228 footer/change-log version discrepancy. The software requests review where a numeric conclusion is not supported.

Detailed sources, hashes, findings and cases are in `validation/advanced-breast-v0841/` and `data/advanced-breast-v0841-source-index.json`.

## Validation and limits

- 608 source-derived assessment and displayed-dose scenarios: eribulin 205, nab-paclitaxel 244, PLD 159.
- 8 source-grading regression checks, alongside existing CTCAE tests.
- 40 canonical PDFs / 80 pages; 40 byte-identical compatibility copies. Two-page guides, one-page consent aids and five-page reusable passports retained.
- 20 QR decodes: source images and printed guides/passports/contact cards.
- All five guides visually inspected; regimen contact sheets and representative final monitoring/journey pages reviewed. PDF text bounds, page counts and linked asset routes checked.
- Existing generated patient files remain unchanged; 1,548 files are explicitly hash-guarded in this batch, with the established protected-asset manifest covering all 67 current pipelines.
- Full `npm run test:ci` and the clean overlay check passed; results are recorded in `validation/advanced-breast-v0841/release-validation.json`.
- No interactive browser walkthrough was available in this environment. Engine scenarios, generated-output integration, deterministic generation, PDF inspection and deployment-build checks were used.

This is source reconciliation and software verification, not independent consultant, oncology-pharmacy or patient/PPI validation. Those flags remain pending. No clinical-use authorisation, automated Oncotype triage or automatic test ordering has been added.
