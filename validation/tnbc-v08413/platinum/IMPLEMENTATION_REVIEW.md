# Independent implementation review — NCCP 00348 / 00734

Reviewed 20 October 2026. Scope: `tools/reconcile-tnbc-v08413.py`, `tools/build-tnbc-v08413-content.py`, their current generated protocol/patient/knowledge JSON, and 55 targeted executions of the real assessment engine and dose-action builder. No application files edited. `implementation-cases.json` records inputs, findings, dose rows, execution time and SHA-256 snapshots. These are targeted probes, not full clinical or pharmacy validation; rendered patient pages were not part of this review.

## Recheck after corrections — 20 October 2026

All six primary defects recorded below are corrected in the current generated data. The original55 independent probes have been converted into portable acceptance assertions, extended with11 prior-platinum/prolonged-delay cases and5 content checks. **71/71 assertions passed** (66 real-engine scenarios and5 content checks), exit0. No application files were changed by this reviewer.

Runner: `tnbc-platinum-acceptance.js`. It uses only Node built-ins, loads the actual assessment engine and dose-action builder, prints PASS/FAIL per case and exits1 for failures. It can be copied unchanged into the app's `validation/` directory; run there with `node validation/tnbc-platinum-acceptance.js --output /path/to/results.json`, or supply `--root /path/to/checkout`. Detailed inputs, expected semantic actions, source pages, actual results and file hashes are saved in `acceptance-results.json`.

The seven delay-precedence cases explicitly cover14days versus14.01days, second versus third delay, severe counts versus recovered counts, and concurrent previousFN. Third/prolonged delay correctly presents50%/cessation review without conflicting25% instructions. Unknown phase for prior platinum progression remains context-required.

Other rechecked improvements: haematology page maps now include4/5; ongoing-taxane lowLVEF yields future anthracycline/cardiac review without a current doxorubicin dose row;00348 logistics explicitly attributes ECG to ESC;00734 AC support includes qualified2–3L hydration advice. Minor citation cleanup remains possible: LVEF equality rule still citesp2 rather than the eligibility/monitoring section;00348 logistics source-ID list could includeESC as well as naming it in text. Neither changes these acceptance outcomes.

The original review below is retained as historical evidence, not a list of unresolved primary defects. These software checks do not replace independent clinical/pharmacy approval.

## Initial findings before correction

| Priority | Finding and reproduction | Source / correction |
|---|---|---|
| High | Both protocols: `{treatment_phase:'taxane',assessment_stage:'baseline',severe_hepatic_impairment:true}` returns `proceed_with_caution`, no restrictive finding, and explicitly labels severe hepatic impairment as triggering no restriction. `BASELINE_HEPATIC` only covers 00860/00861. | Both official NCCP p3 list severe hepatic impairment as a paclitaxel exclusion. Add the nonimmune source restriction; make unknown stage/phase conservative without guessing a dose. This cannot be left to the generic indication confirmation. |
| High | 00348 taxane, Day1, cycle5 (also0), ANC0.4 and platelets40 returns `proceed_with_caution`; no source-scope finding. The guard catches cycle1/missing but not other out-of-range cycles. | 00348 p4 table only covers cycles2–4 Day1. Add invalid/out-of-scope cycle and phase-cycle mismatch review; do not infer normal counts when the table does not apply. The partial-domain renderer currently says platelets40 triggers no restriction because phase/cycle predicates are false. |
| Medium | Both protocols: taxane phase with `crcl_ml_min:40` returns `proceed_with_caution` with no carboplatin risk finding. `CARBO_MYEO_RISK` instead uses GFR>30 and<60. | 00348 p5 /00734 pp5–6 specifically identify CrCl<60 as greater myelosuppression risk. Evaluate the entered CrCl, retain GFR<=20 and>20–30 rules separately, and do not silently equate metrics. |
| Medium |00734 progression during prior platinum treatment has no dedicated input, rule or explicit eligibility exclusion in the new JSON. |00734 p3 excludes disease progression while receiving platinum. Add the actual exclusion or a clear source-based eligibility review field; generic `indication_eligible` alone does not expose it. |
| Medium | Patient monitoring grid and reused journey/KB grid say bloods only before each14-day AC cycle. Surrounding prose correctly says weekly throughout. | Both source monitoring sections require weekly FBC/renal/liver through treatment. Change the AC grid cell to weekly throughout AC, including pre-dose review. |
| Medium | Shared `heart` prose falsely says NCCP00734 lists age>65 as an echo criterion. |00734 p3 says echo/MUGA as clinically indicated;00348 p3 includes age>65 or clinically indicated. Preserve the distinction. |

## Secondary completeness and presentation items

- `LVEF_LOW`/`LVEF_EQUALITY` are not phase-gated. Taxane+LVEF49 creates a current doxorubicin contraindication/dose row, although doxorubicin is a future phase. The whole-pathway cardiac eligibility concern is valid, but label it as eligibility/future-phase review or restrict current-dose actions to active agents. Correct the LVEF equality citation from page2 to the actual cardiac eligibility/monitoring section (p3 for these two sources).
- Metadata `source_page_map.haematology` currently lists onlyp4; ddAC tables are onp5. Individual ddAC rules correctly citep5. Include both pages in the map.
-00348 patient logistics/grid call baseline ECG part of the plan while the fuller heart paragraph correctly attributes ECG to ESC, not NCCP. Keep that separate attribution visible wherever an ECG requirement is presented; the logistics source list is NCCP/port/PICC only.
-00734 p7 explicitly includes cyclophosphamide Day1 hydration advice (2–3L, subject to the individual plan and fluid restrictions). This has not been carried into the new phase support or longitudinal content; currently hydration is only a generic agent watch statement. Add an appropriately qualified plan reminder if the suite is intended to capture source supportive care.
- Keep nonimmune hormone rows sparse. Current rows explicitly say no routine immune-monitoring programme, so they are not false instructions, but a whole thyroid/hormone lane adds little for00348/00734 and conflicts with the user's preference for agent-specific brevity.

## Confirmed improvements and acceptable ambiguity handling

- Nonimmune protocol JSON contains no pembrolizumab or immune-toxicity inputs, rules, monitoring or drug phases. Patient agents, body-map phases, passport groups and antiemetic phases correctly exclude pembrolizumab. Remaining hormone text is an explicit statement that routine immune monitoring does not apply; no active immune contamination was found in inspected generated JSON.
-00348 AUC6 Day1 plus weekly paclitaxel,00734 AUC2 with paclitaxel every weekly visit, four21-day cycles followed by four14-day ddAC cycles are correctly represented. Calvert targets are6 and2. Mandatory G-CSF per ddAC cycle is preserved. No date-entry requirement is introduced.
-00734 weekly count transitions at ANC0.5/1 and platelets50/75/100 execute correctly: severe low values delay/review later reduction,75–<100 is clinician discretion, not automatic clearance. The action applies to both weekly agents.
- Both ddAC ANC1/platelets100 equalities return explicit review; low counts delay. Platelet second-delay reduction is kept separate from neutrophil delay.
-00348 Day8/15 and cycle1 count gaps return source-scope review, without borrowing another protocol's omission thresholds. The ambiguous<70–90 platelet band is not converted into an invented restart dose.
- GFR20 contraindicates active carboplatin; the same input in AC does not activate a carboplatin rule. Paclitaxel, doxorubicin and cyclophosphamide hepatic/renal rules are otherwise phase-gated.
- Fractional paclitaxel bilirubin gaps, doxorubicin bilirubin51, and cyclophosphamide CrCl29.5 return review with no calculated restart dose. Severe neuropathy is held for clarification of overlapping source wording. Exactly two reductions only discontinues paclitaxel when intolerance is also present.
- Missing phase plus ANC triggers explicit review. Missing phase plus severe hepatic impairment or dialysis triggers the generic engine's `partial_context_required` with phase named, not a normal/proceed result, despite no dedicated PHASE_NEEDED rule for those flags.
- Source reduction descriptions are review-only and do not automatically re-escalate to a starting dose. This is a reasonable conservative implementation until history, recovery and table ambiguity are resolved.
- Patient-facing data contains no numerical survival/clinical-evidence panel. The reviewed builder intentionally leaves evidence to a separate clinician addendum; that separate evidence population was not present in this file and was not reviewed here. Use CALGB factorial/pCR and long-term limitations from `AUDIT.md`; do not transfer KEYNOTE survival gains to these chemotherapy-only regimens.

## Source uncertainty policy

The explicit-review policy for genuine printed gaps is appropriate. Keep ambiguity tied to the exact source page and affected action. Do not invent a numeric restart dose from ambiguous00348 table alignment. Preserve the distinction between (a) a source threshold not met, (b) source table not applicable to the supplied visit, and (c) a clinical value not assessed. The reproduced cycle5 and severe-hepatic findings show why a false phase/table predicate must not be rendered as reassuring domain clearance. Independent oncology/pharmacy approval remains required; the implementation correctly retains that pending status.
