# SACTCheck v0.84.36 — colorectal completion review candidate

## Baseline and delivery

Manual ZIP delivery only. No commit, push, merge or deployment was performed. AGENTS.md now records this preference for future tasks, while retaining the existing validation and separately authorized publication requirements. Verified GitHub main is v0.84.35 at `cd4e04061195cbe794c54498c92ad4db35961143`. Its application files match the reviewed v35 working baseline; the additional committed package manifest was preserved. The ZIP is a delta against that exact commit, with file hashes and a clean-application check.

A dated pre-change recovery archive, Git bundle, refs, patches and checksums were made outside the checkout. That snapshot is on the same cloud filesystem; it is not an independent offline backup.

## What “colorectal complete” means

All 41 explicit colorectal-coded contexts on the current public NCCP GI catalogue now have the clinician/patient software suite and printable outputs. This includes colorectal-specific routes for shared bevacizumab and pembrolizumab regimens. It does not mean every possible colorectal treatment, tumour-agnostic overlap, national guideline completeness, independent clinical approval, or the overall cross-tumour MVP.

The catalogue was freshly retrieved and reconciled with oral listings and all 377 encoded protocol indications. Adult NTRK tumour-agnostic overlap remains a separately declared scope. Historical completion of 31 suites is retained as history; current software availability is 41. Source freshness, clinical re-audit, content availability, validation and deployment are distinct fields.

## Clinical decision-tool corrections

Two remaining deep source audits were completed against fresh official NCCP and relevant EMA sources:

| Regimen | New source-based checks | Main corrections |
| --- | ---: | --- |
| 00216 Capecitabine, NCCP v8 | 605 | Previous-dose guards prevent unintended re-escalation; both nadirs are required before a numeric blood-count restart; highest episode grade and recurrence remain relevant after partial recovery; renal starting-dose and liver-attribution ambiguity is explicit; cardiac, dehydration, severe-skin and interaction pathways added; source grading badges corrected. |
| 00692 Weekly cetuximab + FOLFOX-4, NCCP v2 | 431 | Cetuximab restart requires dose history; exact recovery boundaries remain explicit; folinic acid follows the relevant component hold; prior reductions cannot be accidentally reversed; eligibility, interactions and HUS patterns reviewed; source-specific grading badges corrected. |

The clinical engine and numeric decision predicates were exercised, not merely document presence. The 00216 cases cover all 152 encoded rules. Failure counts against the preserved baseline are unmet test expectations, not counts of distinct clinical errors.

Important source distinctions remain visible: capecitabine baseline versus subsequent-cycle blood counts, the NCCP/EMA renal starting-dose difference and overlapping diarrhoea wording; FOLFOX-4 uses two separate 22-hour infusions, with an explicit Day 2 folinic-acid prescription clarification. Cetuximab and chemotherapy can require different actions. Exact four-week count recovery does not silently become an “after four weeks” stopping decision. NCCP/EMA observation differences remain a review item.

The other 39 current official PDFs are byte-identical to the retained v32–v35 audit sources. This establishes current-source identity and supports rerunning retained tests; it is not 39 newly repeated full clinical audits. All source versions, URLs, hashes, pages/tables and limitations are in the 41-row source matrix and the two criterion-level audit folders.

## Full-suite and print corrections

- Upgraded 00216 and 00692 patient content, evidence/knowledge, consent, monitoring, phase-specific support and complete printable outputs.
- Embedded the existing rich anatomical maps and all explanations into 21 older full-reference pages. Artwork was preserved. FOLFIRI’s coincident pins 5 and 7 now have distinct anchors; both descriptions remain.
- Fixed the print stacking context that allowed connectors to cross pin digits. All 41 guide anatomy pages and their handbook counterparts were corrected, retaining the original artwork, marker shapes, text, coordinates, fonts and other pages.
- Corrected pump durations for continuous weekly fluorouracil/RT (00421) and 48-hour FOLFOXIRI regimens (00555 and 00783), across reference, access sheet and handbook.
- Rebound 11 handbooks to include their complete phase-support sheets. The final cohort contains all 51 applicable linked phase sheets, not merely a web selector or URL.
- Corrected seven wallet layouts while retaining 85.6 × 54 mm front/back panels, text, QR size and cutting instructions. Replaced the truncated 00586 card sentence with a complete regimen-specific summary.
- Replaced two clipped printed timelines (00558/colorectal and 00890) with readable tables retaining every authored day range and instruction. Screen timelines remain intact.
- Removed a duplicated 00448 support paragraph, corrected 00692’s metastatic treatment-purpose wording, made its Day 8 visit explicit in the compact cycle, and rebuilt the two revised treatment-map runtimes and handbook sections.

Historical source/template labels are retained where the underlying clinical content was retained; a formatting repair does not imply a new clinical source version. Historical v21/v31 regression expectations were migrated only for the two revised suites (capecitabine alone in the v31 scope), with exact reviewed Git-byte provenance and all other assertions retained. No test was skipped to obtain a pass.

## Verification

- Complete `npm run test:ci`: passed, exit 0, on Node 24.22.1 (repository CI specifies Node 20). Full output is retained in `logs/test-ci-final.log`.
- New source cases: 605/605 capecitabine and 431/431 cetuximab/FOLFOX-4; all earlier colorectal suites also passed within the complete run.
- All-41 consistency audit: complete assets, retained anatomical explanations, monitoring and 51 support sheets; zero findings in its defined scope.
- PDF/QR verification: 441 unique PDFs, 3,277 pages, 164 exact QR checks; all mirrored copies equal. All 41 anatomical pages were individually visually inspected.
- Print chronology: 4/4 regression tests passed, including content/artwork preservation.
- UI asset migration: 12/12 checks passed, including exact baseline Git bytes and mutation rejection; no skipped tests.
- Local HTTP smoke: seven routes returned 200, release/catalogue matched the checkout (377 protocols), and the two served guides had valid PDF bytes.
- Clean-application test: passed on a fresh detached checkout of the exact v35 main commit. Every extracted file hash matched; only packaged paths changed. The 1,036 source cases, all-41 suite, UI/migration tests, historical shared-suite tests, build and security checks passed again there. Final packaging adds the resulting review evidence; application/asset bytes remain the same.

The full browser command was attempted with the correct Chromium path, but Chromium could not create its socket (EPERM). The supported escalation was rejected by the environment’s approval policy. Focused manual desktop checks covered patient navigation, Expand all, rich anatomy, monitoring, OncoWiki and a synthetic capecitabine assessment with component-specific withholding and explicit unassessed domains. This is not a substitute for the blocked automated browser suite.

All 41 canonical OncoWiki QR destinations returned HTTP 200 with matching regimen identity during the current live check. This verifies existing destinations, not deployment of this local v36 update.

## Remaining review and release stages

Independent oncology/clinical, pharmacy and patient/PPI review remain pending. Placeholder phone numbers must be replaced before patient use. The extensive handbooks still have some repeated timeline overviews and occasional screen-oriented wording; these are recorded for later print-editing refinement. Real iPhone/Safari, Android/Chrome, home-screen installation, camera scanning and physical printing are unverified. The global cross-tumour consistency audit remains a separate overall-MVP task.

Apply this package manually to the verified v35 checkout, inspect the changes, then commit and push when ready. ZIP extraction is required; uploading the ZIP file itself does not apply its contents. Deployment and live v36 asset verification follow that manual publication and have not been claimed here.

## Evidence index

- `catalogue-source-review/41-context-source-audit-matrix.md`: 41 contexts, source freshness versus historical audits.
- `capecitabine-source-audit/` and `folfox4-source-audit/`: current sources, preserved before snapshots, criterion matrices and executable source cases.
- `consistency-review/FINAL-REVIEW.md`: all-41 content, support and anatomy review.
- `pdf-qa/final-audit.json`: complete PDF, QR, text, dimensions and mirrors checks.
- `pdf-qa/marker-page-patches.json` and `post-marker-journey-rebuilds.json`: explicit page-preservation and subsequent section-migration provenance.
- `retrospective-hashes.json`: exact reviewed file transitions from v35.
- `logs/`: full validation output, including failures resolved during integration and blocked browser evidence.
