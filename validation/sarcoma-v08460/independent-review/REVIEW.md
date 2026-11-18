# Independent sarcoma review — five suites

This independent agent review found three substantive 00501 gaps before v0.84.60 packaging. The corrected five-suite snapshot passes the same 112 source-derived interaction cases. This is software/source reconciliation by a separate agent, not independent clinician or oncology-pharmacy approval.

The reviewed scope is exactly 00500,00391,00392,00501,00511. All original frozen inputs, failures and corrected inputs are preserved. Application files were not edited by this reviewer; fixes were coordinated with the source author before release freeze.

## Confirmed defects and replay

|00501 defect|Frozen behavior|Required correction verified by replay|
|---|---|---|
|Counts in recovery or missing-day context|ANC0.1/platelets10 produced only partial-domain “no restriction” findings; no source count delay.|Very low counts now delay independently of the phase selector. Platelets75–99 in recovery require planned-day review, preserving different Day1/Day8 thresholds.|
|Prior severe nonhaematological toxicity|Prior grade3–4 history plus current neuropathy2 or3 and other toxicity0 could emit recovery-to≤1 wording; missing neuropathy could also be treated as recovered.|Both relevant current toxicity grades must establish recovery; grade>1 remains held and missing recovery information cannot generate recovered wording.|
|Planned versus actual Day8 timing|Selecting plannedDay8 with actual cycle day15,15.01 or20 bypassed delayed-day timing review.|Mismatched planned/actual day now generates review; late administration beyond source recovery window is held for specialist review without inventing a catch-up prescription.|

The precise test inputs and findings are retained in `frozen-independent-results.json` (101/112) and `current-independent-results.json` (112/112). The 11 initially failing clinical scenarios are applications of these three defects, not 11 unrelated defects. `initial-probes.json` records the first minimal reproductions.

The first harness attempt had 10 extra false failures caused by overbroad text matching: “not allocated” was absent from a synonym assertion, and a “do not extend ...70%” dialysis warning was mistaken for an affirmative70% recommendation. The original harness/result are retained as `attempt-01-*`. Only those assertion-precision issues changed before the frozen101/112 run. The112 assertions were identical between the genuine frozen-failure run and corrected-pass run.

## Independent case coverage

These 112 cases were written independently and do not import, copy or rerun the author’s225-case dataset. They challenge simultaneous abnormalities, individual component action, missing and invalid inputs, stage context, recovery/dose history, nonstandard local laboratoryULNs and dialysis state.

- 00500: baseline versus on-treatment cardiac criteria with age/FN history, prior severe toxicity with current count delay, missing recovery grade, Child–PughC overriding decimal bilirubin and dialysis review.
- 00391/00392: one low count alongside an intermediate/missing partner, permanent ifosfamide-only stop alongside doxorubicin hepatic/dialysis review, current infection versus prior-cycle80% discussion, nadir AND fever semantics, absolute AST/bilirubin strict boundaries, support deficits with neurological stop, and the distinct inclusive00391 versus strict00392 intermediate-count upper boundaries.
- 00501: the three defects above, gemcitabine versus docetaxel permanent-stop/hold separation, current febrile neutropenia versus history, and absolute bilirubin≥27µmol/L versus docetaxel localULN ratios using deliberately different laboratoryULNs.
- 00511:27 combinations of nineCrCl values and missing/false/true dialysis status; severe renal exclusion versus renal-row and prior-dose history; baseline cytopenia versus later-cycle rows.
- Every protocol: active infection with partial information, pregnancy precedence, partial normal inputs, and invalid unrelated values that must not erase an independently valid current-risk finding.

No scenario emits an automatic numerical prescription from these specialist-review rules. Per-component dose-model rows preserve the most restrictive action and retain concurrent findings. The other four protocol bytes and the assessment engine remained unchanged between original and corrected runs.

Corrected00501 SHA256: `19921ef1f94d49a132ac2be32065da0d14e0be5100d9549d32c7b48518a73d5b`. All five hashes, engine, dose-model, lab-adapter and harness hashes are recorded in the result files. Frozen and corrected snapshots are supplied to make replay independently inspectable.

## Patient, consent and support consistency

The source backed patient profiles and emitted consent/support HTML were reviewed separately; 142 propagation/consistency assertions passed. These are content assertions, not 142 additional clinical decision cases, browser checks or PDF visual checks. Exact reviewed file hashes are in `patient-consistency-results.json`.

|Suite|Consistency confirmed|
|---|---|
|00500|75mg/m² day1 every21days,3–6cycles; over70 consideration remains individualized; baselineLVEF≥50 and conditional ECHO/MUGA; anthracycline heart, extravasation and later malignancy risks; high emetogenic support.|
|00391|20mg/m²/day doxorubicin and3g/m²/day ifosfamide days1–3,totals60mg/m² and9g/m²; no substitution for00392 or10g/m² trial regimen; baselineLVEF>50; required mesna/hydration/G-CSF/PPI and neurological/urine checks.|
|00392|25mg/m²/day doxorubicin and3g/m²/day ifosfamide days1–3,totals75mg/m² and9g/m²; same support safeguards while preserving separate regimen identity.|
|00501|675mg/m² gemcitabine over90minutes days1/8,docetaxel75mg/m² over60minutes day8; separate day-specific review; off-label consent; dexamethasone8mg twice daily days7–9 with≥3 pre-doses; G-CSF conditional.|
|00511|1.2g/m² over1hour with light protection;4cycles or source-defined progression/toxicity wording; delayed blood-count/liver warnings; high emetogenic support; current linkedv2 overdue printed review date disclosed.|

All five consent forms retain the generic chemotherapy risk checklist before agent-specific risks, including infection/sepsis, heart/lung/liver/kidney effects, neuropathy, hearing, electrolytes, thrombosis, fertility and rare fatal complications. All authored individual-agent risk strings survive into emitted consent HTML. Individual benefit/alternatives/questions, voluntary consent and governance limitations are present. The00501 off-label discussion remains explicit.

Ifosfamide support explicitly retains mesna900mg/m² initial and 3000mg/m² continuous reference dosing,24-hour post-ifosfamide protection, source hydration reference with individualized monitoring, G-CSF/PPI and aprepitant–encephalopathy caution. It supplies no automatic single-day aprepitant course for the multiday regimen. Patient text does not give an automatic restart or catch-up dose, so the clinical decision fixes did not require altering reviewed patient instructions.

## Source and validation boundaries

The review uses the complete current official web-extracted source text already captured and catalogue-linked on18 November 2026 under `validation/sarcoma-v08460/clinical`. Those source snapshots and their manifest are copied here. These hashes identify extracted text, not original PDF bytes. Direct original-PDF downloads returned HTTP 403; screenshot responses supplied text markers without inspectable pixels. No independent visual verification of merged table layout is claimed. Existing ambiguities remain explicit: doxorubicin bilirubin(50,51) gap/CrCl10 equality, ifosfamideCrCl50 equality,00501 hepatic AND/OR/alp6 row ambiguity,00511CrCl45 overlap and dose-unit/ICD/review-date source inconsistencies.

Browser, device, PDF geometry/QR and rendering checks are separate parent-owned acceptance work. This content review neither replaces them nor claims they passed. The five profiles remain feasibility drafts pending independent clinical/pharmacy and patient review.

## Replay and accounting

Run with explicit `SACTCHECK_ROOT` when evidence is relocated:

```sh
SACTCHECK_ROOT=/absolute/path/to/Sactcheck node independent-cases.cjs
SACTCHECK_ROOT=/absolute/path/to/Sactcheck node independent-cases.cjs --current
SACTCHECK_ROOT=/absolute/path/to/Sactcheck python3 check-patient-consistency.py
```

The frozen command deliberately reproduces the 11 old clinical failures; it is historical evidence, not a release-gate pass. The current command checks the current repository and writes a fresh hash-bound result. Preserve existing result bytes before any future replay.

This review materially corrected v0.84.60 and belongs in its acceptance evidence. If reused for the next batch’s five retrospective suites, describe that as reuse/recheck against the final v60 hashes; do not count it as a second new 112-case audit. No commit or push was performed. Elapsed time, failed attempts and changed-input reruns are recorded in `run-log.json`.
