# SACTCheck v0.84.34 — colorectal review candidate

Prepared 5 November 2026 against main c19bef57ca5ae49816ad851f2b551b76af32fa5d (v0.84.33). Manual ZIP workflow: no commit, push or deployment has been performed. This is one batch of five new context suites and five retrospective source audits, not five separate batches.

## Scope

| NCCP | Context | Work |
|---|---|---|
| 00212 v7 | Bevacizumab 10 mg/kg every 14 days, colorectal | New colorectal suite; existing breast default preserved |
| 00214 v8 | Bevacizumab 7.5 mg/kg every 21 days, colorectal | New colorectal suite; existing lung default preserved |
| 00215 v7 | Bevacizumab 15 mg/kg every 21 days, colorectal | New colorectal suite; existing breast/lung contexts preserved |
| 00244 v5 | Regorafenib | Full colorectal oral suite and clinical audit |
| 00382 v4 | Trifluridine/tipiracil monotherapy | Full colorectal oral suite and clinical audit |
| 00207 v6 | Weekly cetuximab | Retrospective clinical and full-suite audit |
| 00225 v6 | Panitumumab monotherapy | Retrospective clinical and full-suite audit |
| 00328 v7 | Weekly cetuximab plus fortnightly FOLFIRI | Retrospective clinical and full-suite audit |
| 00330 v6 | Weekly cetuximab plus fortnightly irinotecan | Retrospective clinical and full-suite audit |
| 00331 v7 | Fortnightly cetuximab plus irinotecan | Retrospective clinical and full-suite audit |

## Clinical work and evidence

Fresh official NCCP PDFs, with supplementary EMA/manufacturer information, were retrieved successfully. Source URLs, document versions, dates, SHA-256 hashes, page/table citations, rule mappings and source-derived test cases are retained in the four source-audit directories. The earlier HSE access problem did not prevent this batch's source review.

The 1,747 passing new cases comprise 422 bevacizumab, 237 cetuximab/panitumumab monotherapy, 563 oral and 525 cetuximab-combination cases. They exercise boundaries, blank inputs, organ-function decisions, treatment holds, recovery, recurrence, dose history and component-specific actions. These are software scenarios, not a count of defects or proof of exhaustive clinical validation.

Substantive changes include regorafenib hand-foot/hepatic/hypertension decisions; Lonsurf dose/recovery safeguards and protection against legacy rule overwrite; combination dose-history and recovery handling; and correct attribution of toxicity grading editions. The clinician knowledge base, consent material, monitoring, supportive care, patient summaries and full references were reconciled with these findings. The per-context consistency matrix is adjacent to this report.

Source ambiguities remain explicit. In particular, the printed regorafenib hypertension threshold and NCCP/EMA hepatic-impairment differences are not silently normalised. BSA/tablet selection and source-defined consultant choices remain manual responsibilities. Trial evidence is distinguished by actual dose, combination and disease setting; no survival estimate is borrowed for an untested exact regimen.

## Patient and print output

All ten contexts have the three-page guide: schedule/tests/between-cycle expectations; detailed anatomical toxicity map; and treatment/contact wallet panels, automatic QR, cutting and webapp instructions. Placeholder contact numbers are clearly labelled. Full references retain the detailed anatomical illustration and explanations. Day 8 cetuximab is explicit for 00328 and 00330, with the 46-hour pump only in the appropriate FOLFIRI context.

Final PDF checks cover 105 PDFs / 737 pages, matching mirrored copies, complete retained text, bounds, ten three-page guides, ten one-page wallet sheets and 85.6 × 54 mm wallet panels. Forty QR checks decode exact intended URLs, including rasterized PDF QRs. The seven-section handbooks are 35–43 pages; this batch retains full detail rather than shortening the handbook. PDF reports record renderer/font settings and source hashes.

Desktop browser review records 55 observed page/phase states, including all ten restored anatomical maps, corrected Day 8 scheduling and a synthetic regorafenib grade 4 hypertension assessment. Automated browser launch is blocked by the environment's socket restriction; zero automated states ran. Mobile widths, complete console/network coverage, additional clinician UI examples and real-device installation/camera/printing remain unverified. See browser/REVIEW.md and results.json; a zero-failure empty run is not treated as a pass.

## Software validation

The uninterrupted `npm run test:ci` completed with exit 0, including release:gate, repository/site security, protocol generation, npm test, retained lung/colorectal checks, patient UI/provenance and all new v34 tests. Four handbook chronology/print tests also pass. Tested Node 24.22.1; repository CI specifies Node 20. The ZIP was applied to a clean copy of the verified baseline: all 1,747 source cases, ten-context asset checks, ten migration/provenance checks, Pages build and site validation passed. Seven local HTTP checks matched the built content. Full logs and machine-readable results are retained alongside this report. Browser automation is a separate blocked check and is not included in this passing claim.

## Release limits and next steps

This is a review candidate, not a verified production release. New canonical QR destinations cannot be called deployed until these files are published and checked. Independent oncology, oncology-pharmacy and patient/PPI review remains pending. The full cross-tumour consistency audit is still a separate MVP task.

The existing completion count remains 31 of 41 candidate colorectal contexts. Five additional contexts are implemented in this package but are recorded as pending remaining release validation; five other candidate contexts remain outside this batch: 00455, 00551, 00558, 00890 and 00900. The inventory is not claimed to be a complete national treatment catalogue.

Before merging to main, run the automated browser checks in a permitted environment, inspect mobile layouts, resolve any failures, and complete the remaining release review. After authorised publication verify the exact commit's Pages result, canonical version, representative pages/PDFs and QR destinations. Do not infer clinical approval or live deployment from a local build.
