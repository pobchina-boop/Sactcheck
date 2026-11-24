# Enhertu decision-support repair — 23 November 2026

Baseline: `f3b923b247b5663b2bd90b2ffb352fccc5a347ea`, SACTCheck 0.84.62. Scope: NCCP 00776 v3b, trastuzumab deruxtecan 5.4 mg/kg monotherapy. No indication, dose ladder, source grading version or other regimen was broadened.

## Repaired behaviour

The LVEF decrease now uses the existing engine's validated difference operation: pretreatment LVEF minus current LVEF, in absolute percentage points. The independent manual-decrease input is removed from the production form. Its result is shown as arithmetic alongside the entered measurement and retained in the clinical output. Supplying an obsolete or conflicting manual decrease through an external caller cannot override the calculation. Missing, malformed or out-of-range measurements remain unassessed; a missing baseline with an entered during-treatment LVEF requests review.

The reported failure case, baseline55% and current43%, now gives12points and the NCCP interruption finding whether the old decrease field is absent, blank, zero,4, another number or malformed. Numeric source boundaries remain40%,45%,10points and20points; a decrease greater than20points can require interruption even when the current LVEF remains high.

First-dose eligibility and during-treatment toxicity now have separate conditions. A recorded baseline below50% during ongoing treatment prompts reconciliation of the original specialist decision. It does not erase stricter current hold or permanent-stop findings.

The repeat-recovery pathway requires the ongoing-treatment stage and verified baseline/current measurements. Exactly10points below baseline counts as recovery on a qualifying repeat, while exactly10points with current40–45% on the initial assessment requires interruption. A selected recovery label cannot override conflicting measurements. Incomplete or inconsistent non-recovery labels request review rather than generating an unsupported permanent-stop instruction. Confirmed symptomatic heart failure, severe LVEF recheck or relevant ILD findings retain their source actions.

The optional cycle and planned treatment-day fields now appear in the clinical handover. The generated PDF/text retain the treatment, indication, cycle/day, both measured LVEFs, calculated decrease, source-linked findings, clinician decision and outstanding domains.

A separate mixed-risk defect was identified: an ANC-related conditional reduction could display4.4mg/kg despite an unresolved independent cardiac or ILD hold. An explicit00776-only policy now defers that numeric future dose when another hold or review blocks resumption. It preserves every finding and the source's conditional reduction instruction. Isolated neutropenia still shows the source-supported future reduction when the current dose level is known.

The same public release now uses the distinct clinical-data cache revision `enhertu-20261123`. The bootstrap, cache supervisor, assessment form, dose display, knowledge loader and workflow script URLs carry the new revision. A simulated prior `durvalumab-20261123` cache is discarded, and fresh HTTP requests include the new revision, preventing an existing same-release session from silently retaining the earlier Enhertu JSON. The public release remains0.84.62 and all other clinical protocol bytes are unchanged.

## Validation completed

- 108 source-boundary, invalid/missing/conflicting-input and mixed-risk cases in `tests/enhertu-review-v08462.test.cjs`, including actual production form-preview functions and direct PDF/text output.
- 136 retained source-derived Enhertu scenarios rerun using verified LVEF measurements. Original historical result bytes were restored by the regression-stage runner; fresh output is retained outside the source checkout.
- 381 protocol presentation profiles checked by `tests/assessment-reference-v0845.test.cjs`; derived values remain hidden as direct inputs and their numeric source measurements remain available.
- Existing general engine, conditional-input, dose/schedule, dose-table clarity, integrated laboratory/dose modification and56ribociclib regression cases passed.
- Cache namespace, stale same-release upgrade, bootstrap ordering, HTTP URL revision and current-cache reuse checks passed.
- Strict schema validation passed. The current compressed catalogue and its digest were regenerated from the corrected protocol; card metadata regeneration introduced no unrelated changes.
- `test:enhertu-review` is registered in the early release gate.

Tests used Node24.22.3; GitHub Pages specifies Node20. Real browser preflight in this environment failed with Chromium SIGABRT and `socket() failed: Operation not permitted`. No repeated launch with unchanged restrictions was attempted. The function-level form tests do not establish real browser, mobile device or printed-layout acceptance. Parent task records any permitted alternative browser checks and the complete release gates separately.

Independent clinical and oncology-pharmacy authorisation remains pending. This repair and its software checks do not claim clinical-use clearance or perfection.
