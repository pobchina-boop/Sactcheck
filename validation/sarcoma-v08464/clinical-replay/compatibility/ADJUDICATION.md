# v0.84.64 historical compatibility adjudication

This is a bounded software/source reconciliation of the already accepted external candidates. No application or clinical rule has been edited. Independent acceptance of this compatibility package is still pending. Oncology and pharmacy approval remains separate.

## Raw results retained

| Unchanged historical suite | Original accepted candidate | Final product/CNS candidate | Final candidate plus accepted 40 definitions |
|---|---:|---:|---:|
| IE/VAC author | 712 pass / 0 fail / 712 rows | 704 pass / 10 fail / 714 rows | Identical clinical and dose observations |
| IRI/TMZ, IVADo, VIT author | 571 pass / 0 fail / 571 rows | 565 pass / 6 fail / 571 rows | Identical clinical and dose observations |
| Independent original supplement | 213 pass / 0 fail | 213 pass / 0 fail | Identical clinical and dose observations |
| Independent retained infection inputs | 12 pass / 0 fail | 12 pass / 0 fail | Identical clinical and dose observations |

The original author total is 1283. The final author report contains 1285 rows, with 1269 passing and 16 failing. The pair script appends a failure row for each newly incomplete rule-coverage inventory; it does not append corresponding passing rows. Those two added report rows are not new patient scenarios. The 225 independent assertions still pass, but their observations are not all unchanged. No old script, assertion, fixture or saved report was overwritten.

## Sixteen exact historical mismatches

`raw-failure-ledger.json` preserves every full old failure, input and before/after observation where applicable.

| Code | Original assertion | Number | Source adjudication |
|---|---|---:|---|
| 00675 | Broad current neuro grade 1–4 must emit `IFO_CURRENT_CNS_PRODUCT_INTERRUPT` | 4 | A broad named neurological grade can describe central or peripheral toxicity. Grades 1–2 with unknown localisation retain an ifosfamide hold through `IFO_NEURO_LOCALISATION_UNRESOLVED`; grades 3–4 retain the existing NCCP severe-event review and `IFO_SEVERE_CURRENT_NEURO_HOLD`. They cannot falsely establish a CNS event. Grade4 consideration remains separate; no universal permanent ban is added. |
| 00747 | Same broad grade assumptions | 4 | Same semantic distinction, retaining this regimen's source history and rechallenge rules. |
| 00754 | Broad `encephalopathy_grade` values 1–4 must emit old `IFO_CURRENT_NEURO` | 4 | The legacy key's actual visible contract is a current named neurological event, central or peripheral. Unknown localisation at grades 1–2 holds for assessment. Grade≥3 retains NCCP `IFO_NEURO_STOP` and the resulting discontinue action. |
| 00754 | `current_neuro_symptoms:true` alone must emit old CNS rule | 1 | The visible retained control explicitly asks about central/peripheral symptoms requiring localisation. It produces an ambiguity hold; the separate current CNS control establishes the product-specific interruption. |
| 00675, 00747, 00754 | Every current rule is triggered by the original finite fixtures | 3 | Those fixtures predate supplied-product identity, serum creatinine/verified ULN branches, and explicit current CNS selection. The raw coverage assertions remain failed. Product/CNS boundary acceptance is provided by the separately preserved earlier independent suites and the narrow current compatibility contract, not by relabelling these assertions as passed. |

The two IE/VAC source tables describe grade3/4 neurological management with infusion/rechallenge discussion and grade4 consideration of discontinuation. IVADo Table3 explicitly says grade≥3 neurotoxicity discontinues ifosfamide. These distinct source actions remain distinct. A current product CNS interruption is not a universal prohibition of any later rechallenge.

## Every changed clinical observation

The observation-only preload captured 1490 engine calls across the four historical scripts (some author assertions inspect schema, schedule or UI without calling the engine). Of these, 872 observations differ between the original accepted and product/CNS candidates. `all-observation-deltas.json` records every complete input, finding and component row, not only the failing assertions.

The exact allowed additions seen in these inputs are named-product identification, missing actual laboratory measures, unverified units/ULNs, unknown product with an abnormal panel, unresolved treatment phase, unresolved central/peripheral localisation, and the already accepted severe-neurological hold. Existing clinical findings are preserved except for the explicitly adjudicated old CNS findings and source-conflict explanatory wording. The existing-rule wording changes retain their exact action types, components and dose-blocking attributes.

For all 1480 identical-input observations, no non-ifosfamide component action changed. No new quantified dose appeared. No new invalid input or engine error appeared, and no observation moved from incomplete to complete. The source-specific NCCP renal/hepatic findings remain present. These are exact comparisons; there is no blanket acceptance of an arbitrary stricter action.

Ten pair author scenarios construct their inputs dynamically from the protocol's demo values. The accepted earlier product/CNS transition blanks previously normal-looking bilirubin, AST and current/prior broad neurological defaults, and adds blank actual-product/CNS fields. Therefore those ten scenarios use unchanged script bytes but different generated inputs. Their exact changes are in `dynamic-demo-input-transitions.json`; they are excluded from the identical-input component-preservation claim. The later accepted 40-definition grading transition changes none of these values and has exact trace parity with the pregrading stage.

## Renal component attribution

No historical renal assertion failed. Nevertheless, the actual final output now holds ifosfamide when a planned IE or IVADo treatment lacks the actual supplied product, serum creatinine, complete product-specific panel or verified units/ULNs. CrCl cannot substitute for serum creatinine. In the ten original independent IE/VAC renal inputs, the old renal finding and every etoposide/cyclophosphamide/doxorubicin component action remain intact; only the ifosfamide component becomes held while that separate product context is unresolved.

The named Mitoxana1g SmPC §4.3 supplies absolute serum creatinine/bilirubin and enzyme-ratio restrictions. They are not substituted for the NCCP renal table and not asserted to be universal for every ifosfamide product. The separate verified-product controls confirm that, once the exact product, actual panel and units are supplied, a low CrCl still produces the source-specific NCCP consultant review rather than an invented dose. The two pair controls retain etoposide's separate review action. These controls deliberately resolve multiple product/laboratory inputs; they are not single-variable experiments.

## Narrow current contract

`current-contract-cases.json` and `current-contract.cjs` contain 32 checks:

- 13 unchanged neurological inputs from the historical failure ledger, with explicit central/peripheral and source-severe expectations.
- 10 unchanged independent renal inputs, preserving each non-ifosfamide component action.
- 6 new explicit current CNS versus non-CNS grade1 controls across the three ifosfamide regimens.
- 3 new verified-product/actual-laboratory controls confirming retention of the source low-CrCl review.

All 32 pass. All supplied fields must be declared. The 23 unchanged inputs reproduce their exact saved current clinical/dose observations. The initial contract attempt passed29 and rejected three newly constructed IVADo controls because the pair's `haemodialysis:false` field is not declared for IVADo. That setup error is preserved in `initial-control-fixture-error`; only the three undeclared keys were removed, with no change to expected clinical behavior or accepted protocol bytes. The final32 are not added to the historical1508 count as if all were new cases.

## Source and lineage limits

`source-and-lineage.json` pins the original application baseline, accepted clinical fixes, product overlay, CNS semantic overlay, final pregrading candidate, accepted40-definition proposal and final graded candidate. Protocol IDs and NCCP versions are unchanged; no alias is required. Future application status/provenance changes must be enumerated separately and cannot overwrite this evidence chain.

Current retained official extracted text supports the source reconciliation. Binary PDF hashes and visual table verification remain unavailable/unverified. The earlier independent product347 and future-five CNS123 acceptances remain separate source stages and are not newly counted or silently rerun here. Browser layout, PDF pixels, current deployment and independent clinical/pharmacy approval are outside this compatibility package.

Reproduction commands from the campaign directory:

```text
python3 sarcoma-v64-historical-compatibility-20261118/run-replays.py
python3 sarcoma-v64-historical-compatibility-20261118/run-graded-replay.py
python3 sarcoma-v64-historical-compatibility-20261118/classify-differences.py
node sarcoma-v64-historical-compatibility-20261118/current-contract.cjs
```

The first two commands refuse to overwrite prior stage directories. Re-run them only in a disposable copy with the source archive available. Current contract outputs can be redirected by its third positional path argument after the candidate and runtime directories. Original reports must remain immutable.
