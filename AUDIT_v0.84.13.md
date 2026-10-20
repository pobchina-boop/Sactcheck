# v0.84.13 source and implementation audit

Checked 20 October 2026. New full suites: NCCP 00858, 00860, 00861, 00348 and 00734. Retrospective content/evidence revision: 00857. This is software and source reconciliation, not independent clinical or pharmacy approval. The existing 00857 assessment rules were not re-audited or changed in this release.

## Material findings corrected

- Weekly carboplatin regimens had inherited three-weekly count rules. Weekly combination, Day 1 combination, paclitaxel-only visits, three-weekly AC and dose-dense AC now use their own source rules.
- Both chemotherapy-only cards contained pembrolizumab content. Immune agents, rules and postoperative immune phases have been removed from those cards. Calvert targets are AUC6 for 00348 and AUC2 for 00734.
- The six-weekly pembrolizumab variants could imply pembrolizumab on every chemotherapy cycle. Their schedules now explicitly show cycles 1, 3, 5 and 8, followed by the separate postoperative schedule.
- Cytotoxic cardiac, renal, hepatic and neuropathy rules could act outside their active phase. Phase gates and missing-context review guards prevent silent phase assumptions. Abnormal raw liver values during pembrolizumab trigger assessment without automatically diagnosing immune hepatitis.
- Historical severe neutropenia was missed once counts recovered. Prolonged/third weekly myelosuppression delays now supersede the simpler 25% guidance with the source 50%/cessation review.
- Immune stopping, withholding and endocrine exceptions are explicit. Failure to taper prednisone equivalent to ≤10 mg/day within 12 weeks after the last pembrolizumab dose remains a permanent-stop criterion; a controlled-endocrine flag cannot override it.
- Severe hepatic exclusions, prior progression on platinum in 00734, CrCl-related myelosuppression risk, source count/organ gaps, baseline-versus-ongoing differences and the dose-dense AC G-CSF requirement are visible.
- Nonimmune blood tests are weekly throughout treatment, including AC. Baseline ECG is separated from risk-based echo, and 00348's ECG recommendation is attributed to ESC rather than falsely to NCCP. No universal three-monthly CT/echo schedule is inferred.

## Source boundaries retained

00348 has a cycles 2–4 Day 1 table and ambiguous platelet notation. It does not supply the borrowed Day 8/15 table previously implied by the template. These visits and the ambiguous row require source/local clarification. Exact ddAC count equalities and fractional hepatic/renal gaps yield review rather than an invented normal value or restart dose. Reductions requiring actual previous dose and recovery are review instructions, not automatic re-escalation.

Official NCCP documents were retrieved through web PDF text extraction. Original binary download was blocked, so no original PDF checksum or visual verification of the ambiguous table is claimed. Source snapshots and page-specific audit notes are included in validation/tnbc-v08413. Direct visual oncology/pharmacy verification remains necessary for the ambiguous table.

## Evidence and audience

Six clinician knowledge profiles now have selection rationale and a reusable endpoint display. OS/PFS/EFS/DFS/iDFS/ORR/pCR/QoL use acronym, full name, symbol and colour together. Comparison, absolute difference, time point, uncertainty and maturity are separate. These colours identify endpoint families, not efficacy rankings.

KEYNOTE-522's 2026 seven-year update is explicitly a conference-abstract/descriptive update, with the formal 2024 OS paper retained. The full perioperative strategy was randomised. The q6-week pembrolizumab/ddAC cards do not claim direct randomised testing of that exact combined timing. CALGB 40603's pCR display identifies the pooled factorial comparison and the survival limitations. No borrowed numerical survival gain is populated for exact weekly AUC2 schedule 00734.

Patient pages, consent summaries, printable documents and patient source data for these six suites contain no numerical comparative efficacy panel. Their treatment rationale, risks and consent discussion remain available. This audience change has not yet been applied to the other 73 authored suites.

## Verification

- Pembro audit: 410 checks; 408 passed, no failures, two explicitly inapplicable original source cases (the second-delay percentage belongs to the platelet row, not every ANC delay).
- Platinum audit: 71 passed, including 66 real assessment-engine scenarios and five content checks.
- Full-suite checks execute the actual knowledge loader/renderer and phase-selector event handlers; check service links, receptor routing, audience separation, endpoint arithmetic, escaping and scoped retrospective hashes.
- 61 printable documents / 103 pages; matching docs compatibility copies; 24 QR asset/printed-PDF decodes to the canonical sactcheck.com routes. Representative long and short print layouts visually reviewed.
- Browser QA was attempted through the supported internal preview, but the browser security policy blocked acquiring the preview tab after an initial connection failure. No browser-workflow or mobile-browser pass is claimed. Static rendering, handler tests and release checks are separate evidence.
- See validation/tnbc-v08413/release-checks.json for final release-gate/build/security status. Clinical approval remains false in all five new protocol records.
