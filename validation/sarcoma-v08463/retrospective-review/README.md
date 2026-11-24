# Five retrospective audits prepared for v0.84.63

External evidence prepared18November2026 against provisional integrated v0.84.62 clinical JSON and the actual assessment/dose-action runtime. **Exactly five suites,100 primary scenarios plus18 supplementary assertions over15additional inputs:115distinct scenarios in total.** Corrected-candidate replay is97/100 primary passes with three preserved, adjudicated action-severity mismatches; the18 supplementary checks pass. Two actual missing-stage review-cue groups were corrected externally. No clinical/pharmacy approval is implied and no application changes were made by this reviewer.

| Regimen | Complete retained source reviewed | Cases | Current passes | Retained mismatches |
|---|---|---:|---:|---:|
|00374 trabectedin|NCCP v4a,294 numbered lines/six pages|20|17|3|
|00228 eribulin, breast and liposarcoma|NCCP footer v8,271 numbered lines/six pages|20|20|0|
|00205 PLD50, breast and sarcoma|NCCP v8,267 numbered lines/five pages|20|20|0|
|00462 PLD20, AIDS-related Kaposi sarcoma|NCCP v4,235 numbered lines/five pages|20|20|0|
|00554 vinblastine/methotrexate|NCCP v3,209 numbered lines/four pages|20|20|0|

## Source-first scope

All five complete current retained NCCP captures and the source-specific limitation notes were read before the fresh expectations were authored. `cases.json` records each clinical rationale, exact source URL and retained line references. No author case set or rule identifiers are imported. These100cases are not added to or represented as reruns of the prior154-case independent draft review.

- Trabectedin checks mandatory premedication and vaccination context, current versus previous-cycle toxicity, short neutropenia with infection, prior platelet nadir, recovered transaminase history, eligibility on restart, and missing individual laboratory domains despite a composite confirmation.
- Eribulin checks both protected breast and liposarcoma contexts across scheduled days, severe current mucositis versus recovery assertions, direct history versus contradictory legacy flags, cirrhotic hepatic classification versus normal current LFTs, combined organ advice at a reduced dose, congenital longQT, initial versus subsequent count criteria, and context-specific trastuzumab.
- PLD50 checks both breast and sarcoma contexts for prior severe skin/mouth history, independent current toxicities, severe counts versus hepatic advice, the actual two-week stop row, cardiac caution, current infusion reaction versus default grades, hypersensitivity versus prior slower-infusion plans, original/current dose distinctions and separate baseline cardiac investigations.
- PLD20 checks its own CD4/extent indication, count table, original-dose combinations, competing count severities, two-week stomatitis choices, current infusion symptoms, cardiac caution, prior severe skin history, the14-day option and severe hepatic impairment before the sixth treatment. The source maximum is six cycles; two original case titles mistakenly say five-cycle maximum, while their unchanged test inputs are completed_cycles2 and their source rationale correctly quotes the six-cycle regimen. This title typo does not affect the expected actions.
- Vinblastine/MTX checks third-space fluid despite normal renal results, separate MTX omission and VBL neuropathy review, numeric count delay despite a false legacy flag, baseline versus current prescription denominators, Day22rest and Cycle13 review, concurrent drug-specific organ/toxicity advice, and baseline chest imaging.

The runner invokes the actual engine and dose-action model. It checks valid declared inputs, errors, no computed numeric treatment dose, clinically restrictive overall/component actions, separate components and visible source topics. A contraindication display marked quantified but saying `Not to be administered` is not misclassified as a numeric administered dose. Partial-laboratory cases explicitly check that the omitted named domain remains unassessed.

## Preserved first run and fixture corrections

`original-results.json` is the first raw89/100 result. `first-run-fixture/` preserves the exact original cases, construction script, runner and result. Seven raw mismatches were fixture semantics, not clinical defects:

1. Three00554cases correctly emitted `omit` for MTX and separate VBL consultant review. The generic hold-family assertion omitted the supported `omit` action. Adding it matches the intended source-derived100% reduction/omission expectation.
2. Four00228cases correctly recognised direct numeric qualifying history despite contradictory legacy flags and asked whether the event recurred at the reduced dose. The original lexical assertions required ANC/platelet words; the actual message used equivalent qualifying-event wording. This wording is now accepted without changing the intended review, inputs, source rationale or no-numeric-dose requirement.

`fixture-corrections.json` records the exact before/after lexical expectations and affected omission cases. No application, source, runtime or input values changed between raw and calibrated runs. The calibrated96/100 report is `calibrated-original-results.json`; the remaining four original clinical expectations are unchanged.

## Remaining00374 observations

- **00374-01 and00374-05:** dexamethasone confirmation=false at baseline/on-treatment produces an explicit steroid consultant-review message requiring confirmation before infusion, no numeric dose and incomplete assessment. The audit expected a hold action. Whether the hold is necessary or the existing review adequately implements the mandatory premedication requirement is awaiting source adjudication. SourceL178–L181.
- **00374-09:** the same false premedication confirmation at restart produces only the competing hepatic-review finding; no steroid cue. The current premedication rule is phase-restricted to baseline/on-treatment. This is separate from the action-severity question and may be a restart-context review omission. SourceL178–L181.
- **00374-17:** explicitly unconfirmed STS eligibility at restart produces only the competing prior-toxicity reduction review. The source indication restriction remains relevant beyond baseline; the existing context rule is baseline-only. SourceL19–L22.

The parent and source author adjudicated the hold-only expectation as a conservative action-severity assumption: the existing explicit consultant-review message requires premedication confirmation before infusion and prevents numeric prescribing. These three original mismatches remain recorded and were not relabelled as passes.

The two genuine missing-stage cues were corrected by the source author: the existing premedication and eligibility rules now cover baseline, on-treatment and restart. All other predicates, messages, action types and dose blocking are unchanged. `independent-transition-verification.json` independently verifies exactly those two condition changes from00374SHA`0092a08c9d9af574450d4d0e5cfbbcff15e175a914bc690dcb3fbf1e06033ced` to candidateSHA`97ac4f635bc4d3bdda114a1d4efbdc320f8fc9b84c9d16c369d759a1a2b19004`.

`phase-cue-supplement.cjs` supplies18 additional source-adjudicated assertions: two confirmation fields ×three phases ×missing/false/true. It checks positive review visibility, negative confirmed-field controls, incomplete coverage and no numeric dose. The two true-field checks in each phase share a true/true input, so the supplement has15distinct inputs, not18. Original snapshot:12/18 assertions passed, with six manifestations of the two stage-cue gaps. Corrected candidate:18/18 passed. These remain within the existing00374suite.

`corrected-candidate-results.json` retains the calibrated100primary expectations:97pass/3adjudicated severity mismatches. `phase-cue-corrected-results.json` is18/18. `final-results.json` records118assertions across115distinct code/input pairs, without claiming118passes or118unique scenarios. `adjudication.json` distinguishes missing cues from fixture corrections and conservative severity expectations. Integrated-application replay now confirms the same97/100 primary outcome and18/18 supplementary assertions. All five protocol hashes and runtime hashes match the corrected candidate; original and candidate snapshots remain preserved externally. This verifies the current integrated clinical baseline, not the still-pending release packaging freeze.

## Reproduce

```sh
node run-audits.cjs --output reproduced-calibrated-original-results.json
```

Default execution uses the preserved original JSON/runtime/source snapshot and validates its hashes. It refuses to overwrite existing output. Once the integration owner confirms a new baseline or authorised correction:

```sh
node run-audits.cjs --current /absolute/path/to/Sactcheck --output current-replay-results.json
```

Current replay records actual protocol/runtime hashes and preserves the original snapshot and outputs. The input manifest identifies the application snapshot as provisional; it is not a final-release freeze claim. Source percentages and contradictory boundaries stay under human prescription review.

## Limitations

Current extracted text is complete but original PDF binaries and actual source-table image pixels were unavailable. Source hashes identify saved extraction text, not original PDFs. No browser checks or fresh public-source fetches were performed.

Trabectedin has retained renal/retreatment and cardiac/source differences, and the NCCP/SmPC transaminase timing disagreement. Eribulin's footer saysv8 while its schedule-change log saysv9; the exactly50mL/min renal gap remains. Both PLD sources retain the bilirubin50–51gap and source-defined table timing; PLD20 administration timing differs from current product information. Vinblastine/MTX retains renal50overlap, NCCP/HPRA renal and bilirubin differences, direct-versus-total bilirubin ambiguity and missing numeric restart algorithms. These audits do not settle such conflicts or independently authorise clinical use.
