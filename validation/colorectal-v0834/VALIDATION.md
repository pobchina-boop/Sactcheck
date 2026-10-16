# v0.83.4 validation record

Base: v0.83.3 / d7af341ab215cdd4d1a6cc329407fedb786851b5.
Source-check date: 16 October 2026. Environment: local candidate, synthetic inputs only.

| Check | Result |
| --- | --- |
| Full `npm run test:ci` | PASS — release gate, security, protocol build, full regression suite, static build and deployable-site integrity |
| Source-based clinical cases | PASS — 292 count, renal, hepatic, DPD, recurrence and bevacizumab cases across 00216, 00586 and 00623 |
| Actual browser input | PASS — 37 cases: 26 desktop at 1440px and 11 mobile at 390px |
| Full patient/clinic journeys | PASS — all three regimens at both widths; bodymap, date-free chronology, logistics, evidence, consent reset, supportive-care PDF, consent form and clinical knowledge links |
| Patient PDF suite | PASS — 18 unique PDFs with byte-identical compatibility copies; nonempty pages and text within page bounds; representative pages rendered and visually inspected |
| Clinical PDF export | PASS — six one-page synthetic assessments; source/code/version and action text checked; representative pages visually inspected |
| QR cards | PASS — all three PNG codes independently decoded to their canonical public regimen portals |
| Local LFT adapters | PASS — 379 protocol JSONs scanned, 467 ratio definitions in 251 regimens, including real-result collection and exact boundaries |
| Prior v0.83.3 audit | PASS — retained in the release gate |
| Deployment layout | PASS — 21 protected patient portals; route, legacy redirect and PDF integrity |
| Fresh-base overlay | PASS — applied the packaged files to a clean v0.83.3 snapshot; protocol rebuild, release gate, static build and deployment validation passed |
| Diff whitespace | PASS — `git diff --check` |

`engine-cases.json` records source-derived expectations and observed results. `browser-cases.json` records actual form values, displayed summary/dose output and exported filenames. `patient-journeys.json`, `source-map.json`, PDF check files and QR results are included. `AUDIT_RESULTS.html` is a readable offline index of the clinical cases. Browser screenshots were used for internal QA and are not distributed.

The clinical source mapping was prepared before the full-suite content. Review covers the three documents' encoded eligibility, count, organ-function and named dose-modification pathways; the cases exercise specified boundaries and representative combinations. It is not exhaustive validation of all possible input combinations, a whole-library clinical audit, or a comparative accuracy study against human reviewers. Generic non-haematological fields require clinical grading of the named adverse event. Radiation dose decisions, all possible concomitant medicines, individual tablet prescriptions and patient-specific suitability remain outside automated decisions.

Source discrepancies and ambiguities are listed in the release notes: the 00623 renal-dose conflict, legacy diarrhoea wording, unrounded renal boundaries and severe hepatic contraindication. Missing timing retains a clearly provisional count hold; supplied baseline or within-cycle timing uses its distinct source pathway. No omitted laboratory value is assumed normal.

Shared changes are limited to explicit presence-condition handling, documented-starting-dose output, month-based evidence-bar scaling, registry/routing and the capecitabine medication-review prompt. The presence-operator tests include the existing temozolomide phase-context rule. Six obsolete 00586/00623 organ-function rules are replaced; all 293 retained v0.59.0 rules still execute. Historic compatibility tests were updated for these declared replacements, the source-specific diarrhoea/HFS definitions and new asset/schedule counts. Generated audit summaries record the resulting library changes.

Consultant, oncology-pharmacy, clinical-use and patient/PPI review are pending. The ZIP is ready to apply, commit and push; this task has not deployed it. Recheck the live version, the three regimen services and the flagged 00623 renal scenario after deployment.
