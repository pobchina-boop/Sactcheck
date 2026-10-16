# SACTCheck v0.83.5 — panitumumab full suites and treatment-course graphics

Base: v0.83.4, commit `3bcc2409ff0f203edaaab81c615772b47da37720`.

This batch upgrades NCCP **00225 panitumumab**, **00447 panitumumab + modified FOLFOX-6**, and **00448 panitumumab + FOLFIRI**. It brings the colorectal full-suite inventory to 11 and the protected patient-portal registry to 24. These are software-package counts, not a claim of clinical validation or a complete national regimen inventory.

Each regimen now has an audited clinical assessment, clinical knowledge profile, patient reference and trial explanation, shared date-free 14-day cycle graph, anatomical symptom guide, consent discussion draft and printable consent aid, treatment passport, SACT card, QR routes and supportive-care sheet. The combinations include port insertion, pump connection, approximately 46-hour delivery, disconnection and later device removal guidance. Monotherapy explains infusion visits and that it has no home chemotherapy pump.

## Decision-tool corrections

The audit uses published NCCP 00225 v6, 00447 v6b and 00448 v4b. Every active rule has a source and page/table reference. Supplementary Vectibix SmPC safety is labelled separately.

- Panitumumab skin actions now distinguish active toxicity, recovery, episode number, withheld doses and failure to recover. Antibody actions remain separate from chemotherapy actions.
- 00447 uses its own renal table: oxaliplatin is contraindicated at CrCl below 30. The standalone FOLFOX reduction/dialysis percentage has been removed from this combination. Neuropathy, count recovery, source-specific diarrhoea grading and stomatitis rules have also been reconciled.
- 00448 distinguishes baseline eligibility from subsequent-cycle count thresholds. Its conflicting two-/four-week ANC recovery wording prompts review while treatment remains withheld. Irinotecan requires diarrhoea to resolve fully. Unsupported borrowed renal percentages have been removed.
- Both combination records flag broad organ-impairment exclusions that conflict with their dose-table advice. Exact bilirubin/AST gaps are explicit; the tool does not invent a percentage or infer normal missing values.
- Reductions use the **current dose level of the affected component**. Missing dose-level context prompts confirmation. A further reduction beyond the final level displays discontinuation.
- Panitumumab monotherapy's central emetogenic class is corrected from minimal to low, matching NCCP V6 table 7 and regimen 00225 v6. The combinations remain moderate risk.

## Retrospective chemotherapy/radiotherapy graphics

**00586 capecitabine + radiotherapy:** one shared graphic appears in the patient portal, reference, discussion draft, clinical knowledge entry and a new printable timeline. Chemotherapy and radiotherapy occupy the same weekly axis; tablet days 1–5, the weekly tablet break and an optional sixth week are visible. The existing two-page guide links to the course graphic. Recovery and reassessment follow, without inventing a fixed surgery interval.

**00655 durvalumab:** the existing clinical knowledge entry and patient fallback guide show concurrent platinum chemotherapy/radiotherapy first, review/recovery next, and durvalumab afterward. This extends the existing material; it does not count 00655 as a newly completed full patient suite. The diagram explains that the axis shows sequence rather than equal-duration phases.

The completed patient and knowledge inventories were checked for other scheduled RT relationships. Prior pelvic RT cautions in FOLFIRI records are not scheduled treatment phases. No routine RT course is added to regimens that do not specify one. No dates or patient information are required to view the diagrams.

## Evidence and review limits

HSE catalogue links were checked, but document migration and intermittent retrieval failures affected the combination PDFs. The audit used the published versioned sources and table-level indexed extracts. The latest unversioned copy could not be confirmed in every retrieval; reconfirm current official copies before clinical adoption.

Patient trial graphics identify their populations and endpoints. The PRIME trial used FOLFOX4, not the identical modified FOLFOX6 schedule; the FOLFIRI response comparison is second-line; the monotherapy survival numbers refer to the RAS-wild-type subgroup. They are not individual benefit predictions.

Independent consultant, oncology-pharmacy and patient/PPI review remain pending. Software success does not authorise clinical use. See `validation/colorectal-v0835/source-map.json` for the source map and declared ambiguities, and `VALIDATION.md` for the completed checks.

## Apply and check

Merge the contents of the release's `SACTCheck_DROP_IN` folder into the existing repository root. Run `npm run protocols:build` and `npm run test:ci`. Browser checks are available in `tests/clinical-audit-v0835.e2e.cjs` and `tests/treatment-relationship-v0835.e2e.cjs` with Playwright/Chromium. Use `CHROMIUM_PATH` when Chromium is installed outside Playwright's default location.

After deployment, check the v0.83.5 badge, searches for the three codes, assessment outputs, clinic knowledge/consent/support links, patient PDFs/QR routes and the 00586 course graphic. This package has not been committed, pushed or deployed by this task.
