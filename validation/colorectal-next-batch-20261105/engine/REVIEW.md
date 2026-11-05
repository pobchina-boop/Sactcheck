# Current engine implementation traces — source audit blocked

Execution baseline: `2e5de4a6dd9e2fcbefa18623ff21db7b9eaec40b`, package v0.84.33. The official NCCP PDFs could not be retrieved through the configured proxy. **These observations do not validate clinical thresholds, establish a current-source audit, or complete any context. No clinical rules were changed.**

The [reproducible probe](engine-probe.cjs) runs the existing assessment engine, dose-action model and actual-result/ULN converter. [Results](results.json) include the full supplied inputs, normalized entered values, triggered rules, source attributions, component actions and doses, invalid-input results and coverage gaps. Source URLs, versions and page/table labels in these results are retained encoded attribution, **not newly verified official-source citations**.

Run from the checkout:

```bash
node validation/colorectal-next-batch-20261105/engine/engine-probe.cjs --write
```

Without `--write`, the JSON goes to stdout. Only the new adjacent `results.json` is written. The default execution sandbox can block Node child-process provenance capture with `EPERM`; the recorded run used the standard execution escalation. Application files, protocol data, existing tests and PDFs are not written by this probe.

## What was exercised

There are **1,200 implementation observations**, with **zero engine crashes and zero returned evaluator errors**. Thirty-two observations contain deliberately invalid input, and remain labelled as such. This is an execution count, not 1,200 clinically passing cases.

| Context | Observations | Scope |
| --- | ---: | --- |
| 00212 | 107 | Existing bevacizumab component protocol, selected CRC indication; no partner-chemotherapy criteria are invented. |
| 00214 | 133 | Existing shared bevacizumab component, CRC indication, retained pre-treatment/ongoing selector and ULN adapters. |
| 00215 | 135 | Existing shared bevacizumab component, CRC indication; no new monotherapy/continuation indication is inferred. |
| 00244 | 66 | Current regorafenib rules, typed options, liver/HFSR conditions and input mapping. |
| 00382 | 98 | Existing CRC trifluridine/tipiracil implementation, count/organ-function boundaries and pre-treatment/on-treatment/restart selector. |
| 00207 | 58 | CRC indication, typed values and current cetuximab rules; separate head/neck indication is not altered. |
| 00225 | 58 | Current panitumumab typed values, eligibility/skin-related rules and missing-input handling. |
| 00328 | 205 | FOLFIRI component holds, diarrhoea recovery/delay, previous dose levels, skin recurrence and organ-function inputs. |
| 00330 | 170 | Weekly cetuximab/irinotecan recovery thresholds, source-conflict guard, skin recurrence and organ-function inputs. |
| 00331 | 170 | Fortnightly cetuximab/irinotecan recovery thresholds, component restart doses, skin recurrence and organ-function inputs. |

The total includes 180 isolated observations immediately below/at/above existing numeric constants, 721 existing enum/boolean option observations, 62 actual-result/ULN conversion observations, 15 assessment-type observations, and the explicit diarrhoea/skin/previous-reduction cases. All three supported condition representations (`when`, top-level field/operator/value, and top-level `all`/`any`) are inspected through the rule engine's own `conditionFromRule` API.

An isolated field is not supplied with fabricated normal values for other domains. Missing prerequisites remain unassessed. These observations therefore do **not** demonstrate complete rule coverage or replace source-derived boundary tests. Baseline and treatment-day equivalence is not assumed where a protocol has no corresponding selector.

## Requested discrepancies revisited

### 00328: component hold before two weeks remains unresolved

Fresh case `00328-current-diarrhoea-2-delay-1` produces overall `withhold`, triggering `DIARRHOEA_NOT_RESOLVED`. Its sole component action and sole dose row are **irinotecan**. Neither fluorouracil component nor folinic acid appears as a hold row. Current grades 3/4 before two weeks show the same narrower component hold.

At `00328-current-diarrhoea-2-delay-2`, the separate `DIARRHOEA_TWO_WEEK_STOP` rule produces `discontinue` for irinotecan, folinic acid, fluorouracil bolus and fluorouracil infusion. The display model names the latter two rows `5fu_bolus` and `5fu_infusion`.

The pre-existing retained-source comparison identifies NCCP 00328 v7 p5 Table 5 as the broader FOLFIRI hold instruction, while the irinotecan-only rule cites p3. See [the retained-source finding](../../mobile-next-batch/historical-irinotecan-review.md) and [its exact excerpt and provenance](../../mobile-next-batch/historical-irinotecan-review.json). The new run confirms the current encoded behavior; it does not confirm whether a newly retrieved NCCP version retains that wording. A future correction needs source-confirmed component assertions for both 5-FU components, grade 1 irinotecan-only behavior, delay boundaries, linked folinic handling, cetuximab independence and recovered-dose levels. **No correction was made from inaccessible sources.**

### 00330/00331: grade-0 restart and recovery attribution remain unresolved

For both regimens, the fresh recovery cases with worst diarrhoea grade 3 and current grade 1 or 2 at one week still produce an **irinotecan hold** through `DIARRHOEA_NOT_RESOLVED`, citing p5. Current grade 0 instead reaches a restart/review rule citing p3 Table 3. The earlier retained-source comparison describes recovery to grade ≤2 on p3 Table 3. That difference and the extra full-resolution restriction still require current official-source and supplementary-source reconciliation; relaxing it is not justified by these traces.

For `00330-diarrhoea-recovery-0-worst-3-delay-1`, the existing conflict safeguard remains: the model produces consultant review and **does not calculate a numeric cetuximab restart dose** from the conflicting 400/300 mg/m² table values against weekly 250 mg/m² maintenance. The grade-4 case similarly retains review. Preserve this safeguard until the current-source conflict is resolved.

For `00331-diarrhoea-recovery-0-worst-3-delay-1`, the model reports consultant review with cetuximab 400 mg/m² and irinotecan 150 mg/m²; the grade-4 case reports the encoded 300/120 values. These are recorded implementation outputs, not newly approved doses.

## Units, ULN conversion, missing values and prior reductions

- Every effective input definition is recorded with its actual label, type, unit property, bounds, step, options and actual-result adapter. The inventory also records encoded numeric constants and their rule/source links. Some unit properties are absent while units appear in labels; this record does not silently standardize them.
- The automatic calculator uses the supplied local laboratory ULNs, preserves full-precision decision ratios, uses the higher entered ALT/AST multiple for combined fields, and leaves missing values unentered. Explicit synthetic settings exercise exact ULN, zero result, slightly above 3×ULN, negative result, invalid/zero ULN and a missing partner transaminase. ALP has no default ULN; the probe clearly supplies a synthetic value only for arithmetic exercise.
- `creatinine_uln` in 00214/00215 has **no automatic absolute-result adapter** in the current implementation. It remains a manually entered multiple-of-ULN field. This is a presentation/conversion coverage observation, not permission to reinterpret it as baseline-relative creatinine or change a clinical criterion.
- Combined-transaminase conversion with only the first analyte entered yields a ratio plus an explicit missing-analyte notice. That does not prove the unentered analyte is normal or establish complete organ-function assessment.
- Empty-measurement cases retain only selected CRC indication context; no missing laboratory value is filled with zero/normal. Deliberately malformed/negative values and invalid-plus-hypersensitivity observations expose current validation and independent urgent-finding behavior.
- 00382 ANC 1.49 ×10⁹/L with `assessment_type=pre_treatment` or `restart` produces a hold; the same input with `on_treatment` produces consultant review in this incomplete context. The isolated value alone is not a complete clinical decision. This illustrates why baseline, next-cycle and within-cycle thresholds cannot be collapsed into one generic cutoff.
- Three explicit 00328 recovered-diarrhoea observations pass existing component levels 0/−1/−2 to the dose model. Skin-recurrence observations cover occurrence 1–4 and current grades 0/2/3 with a stated one-week interval. The inventory lists existing nadir, delay, recurrence and prior-dose-level fields; these traces do not establish that every required source history has an encoded input.
- All 13 current 00244 rule sources carry a page and generic `Current mapped NCCP source` document name but lack a rule-level URL; the protocol-level source URL remains present. This is a provenance gap for the new source audit to resolve, not evidence that an unseen current document was checked.

## Remaining gates

Retrieve and hash the current official PDFs, record actual version/date and page/table evidence, reconcile the findings above, author meaningful source-derived component/boundary tests, and only then change rules or synchronize clinician/patient outputs. Independent clinical/pharmacy review and all requested PDF/browser/QR checks remain separate. **Clinical audits completed by this artifact: 0. Context completion increment: 0.**
