# Five retrospective audits prepared for v0.84.64

Exactly **five suites and 100 distinct scenario inputs** were tested against the accepted external v0.84.63 `40-final-candidate` protocols, using frozen copies of the actual assessment engine and component dose model. The current application protocols were not substituted. **Application replay remains pending.**

The first immutable run produced **87 passed / 13 failed**. Two failures were lexical test errors: the correct IE maximum-course review said “course” rather than “cycle”. After the documented matcher correction, with identical patient inputs and clinical expectations, the result is **89 passed / 11 failed**. No candidate or application changes were made by this audit. The eleven remaining failed scenarios comprise four finding groups, including one explicitly unresolved source-policy question; they are not eleven independent defects.

| Protocol | Distinct scenarios | Passed after fixture correction | Failed |
|---|---:|---:|---:|
|00420 doxorubicin/cisplatin|20|20|0|
|00463 MAP|24|24|0|
|00100 mifamurtide|20|14|6|
|00596 ifosfamide/etoposide|16|14|2|
|00680 high-dose ifosfamide|20|17|3|
|Total|100|89|11|

## Findings awaiting candidate correction or source adjudication

- **Mifamurtide:** explicitly false high-grade osteosarcoma, postoperative multi-agent plan or surgical recovery is restricted at baseline but loses its actionable review during ongoing treatment and restart. Six scenarios, one phase-coverage finding. Chemotherapy is explicitly not complete in this matrix.
- **IE:** a planned treatment-day assessment on Day6 or Day7, with current full daily cytotoxic doses and no count delay, has no calendar-specific finding. The source lists both cytotoxics on Days1–5. Two scenarios ask for schedule clarification, not an invented percentage or permanent stop. No automatic numerical extra dose was produced.
- **High-dose ifosfamide:** explicitly false source eligibility loses its actionable review during treatment and requested restart. Two scenarios, one phase-coverage finding.
- **High-dose ifosfamide generic grade3 toxicity:** an isolated accepted `other_nonhaem_toxicity_grade:3` input produces no named-event review. This single scenario is a source-policy question. The source does not define a universal grade3 hold, reduction or permanent-stop algorithm.

All eleven outputs remain incomplete with `proceed_with_caution`, partial coverage findings and no component dose-action rows. This is a missing specific review cue; it is **not a claim that the system gave whole-patient clearance or prescribed an unsafe dose**. The source owner has been informed and is preparing bounded external corrections. Original outputs stay frozen.

## What was tested

The doxorubicin/cisplatin scenarios combine current and historical febrile neutropenia, unreconciled prior dose reductions, neurological and mucosal toxicity affecting different components, symptomatic cardiac risk despite a reassuring LVEF, Child–Pugh C despite a low bilirubin, dialysis, course limits and lifetime exposure reconciliation across treatment stages.

The MAP scenarios combine known delayed MTX clearance during later treatment or surgery, acute renal deterioration despite a low measured MTX level, missing or continuing folinic rescue, acidic urine, persistent prior rescue escalation at late sampling, unindexed CrCl versus indexed GFR, repeated treatment delays, indication and age context during active rescue, persistent post-MTX bilirubin elevation and extra preoperative MTX courses. These checks retain the source’s unresolved rescue thresholds and table ambiguities; they do not invent numerical folinic prescriptions.

IE scenarios combine unsupported indication, measured fluid accumulation despite a reassuring aggregate flag, severe previous mucositis at recovery, course/calendar history, absolute AST with uncertain units, active mucositis and interacting supportive medication. The two delegated suites add mifamurtide eligibility and recovery phase comparisons, administration/filter distinctions, fever, interactions and post-chemotherapy scheduling, plus high-dose ifosfamide counts, toxicity history, fluid/urinary risk, interactions, maximum courses and supportive care.

All 100 full inputs are distinct and have zero exact matches against 667 inputs from earlier independent/product/semantic reports. Exact deduplication is supplementary evidence; it does not itself establish semantic independence. Earlier test counts are not added to the new 100.

## Preserved evidence and replay

- `input-manifest.json` pins all five accepted candidates, all five complete retained source texts and four runtime modules.
- `core-original-results.json` plus `raw-first-run-fixtures/` preserve the original 60-case run, including both lexical errors.
- `fixture-correction-ledger.json` and `core-calibrated-original-results.json` document the exact two matcher corrections.
- `delegated-00100-00680/results.initial.json` preserves the independent 40-case run with full assessments, component actions and schedule models.
- `combined-initial-summary.json` and `combined-initial-findings.json` give the combined counts and source-specific findings.
- Every case includes its actual input, expectation, source line reference and clinical rationale. Full original failure observations are retained.

To reproduce all frozen results, including the preserved failures, use Node.js:

```bash
node verify-frozen-replay.cjs --output-dir /tmp/sarcoma-retrospective-new-run
```

The directory must not exist. This bounded verifier copies the frozen dependencies into the requested directory and confirms exact per-case input/output/classification equality. Its successful exit means that **87/13 original and 89/11 calibrated outcomes were faithfully reproduced**, not that all scenarios passed. Individual audit runners return exit1 while their findings remain. No network, browser, application checkout or installed packages are required.

## Evidence limits

All five complete retained NCCP source texts were read. Candidate/runtime/source hashes establish what was audited. Source evidence is extracted text rather than original PDF bytes or visual table pixels. The accepted ifosfamide product/CNS correction is preserved, including its authority and supplied-product limitations; this work does not resolve NCCP/product disagreement. Source ambiguities around exact renal/hepatic boundaries, MAP rescue tables/units, sampling, eligibility and treatment chronology remain explicitly reviewable.

No browser or portal/consent/PDF presentation validation, clinical approval or pharmacy approval is claimed. These five protocol-focused software audits do not establish whole-suite clinical readiness. Application replay and packaging belong to the parent release pipeline.
