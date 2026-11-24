# Independent acceptance: v0.84.64 historical compatibility

Accepted for the exact external candidate and runtime hashes in `verification-accepted/independent-verification.json`, subject to the scope below. This accepts the software/source reconciliation of the preserved mismatches. It does not turn the old failed assertions into passes. Clinical approval and pharmacy approval remain false; application replay and deployment are not asserted.

## Verified results

| Evidence | Original accepted stage | Final graded stage |
|---|---:|---:|
| IE/VAC author report | 712/712 pass | 704 pass, 10 fail; 714 rows |
| IRI/TMZ, IVADo, VIT author report | 571/571 pass | 565 pass, 6 fail; 571 rows |
| Combined author reports | 1283/1283 pass | 1269 pass, 16 fail; 1285 rows |
| Independent historical assertions | 225/225 pass | 225/225 pass |
| Bounded current compatibility replay | Separate contract | 32/32 pass |

The two additional author rows are failed coverage summaries appended by the pair script, not new patient scenarios. The 32 current checks contain 32 distinct code/input pairs: 23 repeat the exact historical clinical inputs (13 neurological and 10 renal), and nine are separate controls (six explicit CNS/non-CNS cases and three product/laboratory-resolved renal cases). These counts must not be added together as though all checks were distinct new patients.

The unmodified 32-case script ran once against explicitly loaded final graded draft JSONs and the pinned runtime. Its entire result is byte-equivalent to the saved source-owner result, including all component rows. No historical clinical suite or 188-check metadata campaign was rerun. The independent verifier examined the saved traces of all four suites, verified all 342 frozen files and all official source-copy hashes, and confirmed exact pregrading-to-graded trace parity for all 1,490 recorded engine observations.

## Independent adjudication of the 16 mismatches

Eight IE/VAC cases (00675 and 00747, grade 1–4) still expect a product-specific CNS rule from a broad neurological grade alone. The actual visible control explicitly covers a named central or peripheral event. In the final candidate, unknown localisation at grades 1–2 withholds ifosfamide for assessment. At grades 3–4 the severe-event hold and source-specific NCCP findings persist. Explicit CNS=true grade-1 controls produce current CNS interruption; explicit CNS=false controls retain non-CNS review. The same biological event is not silently inferred from a legacy key or an old test title. These eight mismatches are accepted as old rule-identity expectations, with their raw failures preserved.

Five IVADo cases (00754, grades 1–4 and one ungraded symptom flag) have the same old localisation assumption. The retained `encephalopathy_grade` key has an explicit current named central/peripheral-event label; the symptom flag also explicitly requires localisation. Grades 1–2 and the ungraded ambiguous symptom remain held for assessment. Grades 3–4 retain `IFO_NEURO_STOP` and a discontinue action, as required by this regimen's distinct NCCP table. The explicit CNS control still produces interruption. These five raw failures are accepted as old rule-identity expectations, without weakening the severe-event action.

The other three failures are historical exhaustive-coverage assertions. They remain failed. The old finite inputs do not exercise the new product threshold, identity and explicit localisation branches. One accounting qualification is required: IVADo reports 11 untriggered rules, but two of those (`IFO_NEURO_LOCALISATION_UNRESOLVED` and `IFO_SEVERE_CURRENT_NEURO_HOLD`) are present in its saved engine traces. Its helper updates the `seen` accumulator only after the old yes/no assertions, so an assertion abort prevents those findings being counted. Nine branches per ifosfamide regimen are genuinely absent from the historical traces. `coverage-accounting.json` records the exact sets. No claim of exhaustive current coverage is made by this package.

## Every changed observation accounted for

Of 1,490 historical engine observations, 872 change between the original and accepted product/CNS candidates. The independent verifier reconstructed every record and its classification from the saved before/after observations:

| Mutually exclusive classification | Observations |
|---|---:|
| Product reconciliation only | 609 |
| Product reconciliation plus existing-rule explanatory wording | 59 |
| Product reconciliation plus accepted neurological localisation transition | 27 |
| Product reconciliation with changed dynamic demo inputs | 10 |
| Partial-domain context findings only | 167 |
| Total | 872 |

The 167 partial-only changes preserve all authored clinical findings, global actions and full component dose rows; the changed findings concern partial input context. Existing-rule wording changes preserve action type, component attribution and dose-blocking attributes. The 27 neurological transitions remove only the two previously identified old CNS rule IDs; additions belong to the exact accepted product and neurological rule set.

There are 1,480 identical-input comparisons, including 862 changed observations and 618 unchanged observations. Every non-ifosfamide component action is unchanged across those 1,480 comparisons. Across all 1,490 comparisons, no new quantified dose/action appears, including nested `allActions`; no new invalid input or engine error appears; no incomplete assessment becomes complete. The existing NCCP renal/hepatic findings and action attributes remain intact.

Ten observations must be distinguished: the unchanged IE/VAC author script dynamically constructs cases from protocol demo values. Earlier accepted product/CNS changes blanked four previously normal-looking values (bilirubin, AST, current broad neuro grade and prior broad neuro grade), and added eight blank product/CNS/laboratory fields. All 12 exact changes in each of these ten inputs were independently matched to the preserved ledger. They are excluded from the identical-input component claim. The later 40-definition grading change did not change these values or any saved clinical/dose observation.

## Source interpretation and renal component attribution

The retained Mitoxana 1 g SmPC, section 4.3, extracted lines L66–L68, gives restrictions tied to actual serum creatinine, bilirubin and enzyme multiples of ULN. A CrCl value is not a serum creatinine measurement. The product-specific thresholds cannot be treated as universal for every ifosfamide product. Section 4.4, L98–L110, addresses current CNS toxicity and stopping administration; it does not establish a universal permanent prohibition on every later rechallenge.

NCCP 00675 v2, L194–L223 and L288–L308, and 00747 v2, L182–L211 and L273–L281, retain separate etoposide/ifosfamide renal instructions and source-specific severe neurological event, subsequent infusion and recurrence considerations. The grade-4 discontinuation consideration is not rewritten as a mandatory permanent ban. NCCP 00754 v3, L277–L291 and Table 3 at L308–L311, separately requires clinical renal decisions below CrCl 50 or on haemodialysis and discontinuation of ifosfamide for grade ≥3 neurotoxicity. Its table explicitly uses CTCAE v4.0. Those regimen differences remain intact.

The ten original independent renal inputs omit the supplied product, actual product panel or verified units. Their final output holds only ifosfamide for that unresolved product context, while preserving all non-ifosfamide component actions and original renal findings. The missing-context hold is an accepted conservative reconciliation policy, not a claim that NCCP itself mandates these exact software checkboxes. The three new reconciled-product controls supply the named Mitoxana product, actual panel and units; low CrCl still yields the original consultant review, without invented numeric dose clearance. In the two IE/VAC controls, etoposide retains its separate consultant review. These controls intentionally resolve several product/laboratory inputs and are not single-variable experiments.

## Reproducibility and preserved setup errors

From the campaign root, reproduce into a new output path:

```text
python3 independent-review/verify.py /tmp/v64-independent-new-output
python3 independent-review/check-coverage.py /tmp/v64-independent-new-coverage.json
```

Both tools refuse to overwrite existing output. `verify.py` validates the frozen package, reads the full saved ledgers/traces and invokes only the bounded 32-case clinical contract. The shadow `Sactcheck/protocols` files intentionally contain the authenticated original application bytes; the engine receives final graded objects from `final-graded/drafts/protocols` explicitly. Both roles are pinned separately. No application path is written.

The source owner's initial 29/32 result is retained: three new IVADo controls included an undeclared haemodialysis key. Only those three keys were removed; all expected actions, 23 historical inputs and candidate bytes were unchanged. This independent review also retains three setup-only verifier failures and their exact script versions: an incorrect assumption about shadow protocol directory contents, two inaccurate literal rule IDs in its allowlist, and the differing `status` versus `passed` historical report schemas. These failures occurred before the current clinical contract ran; the corrections only implement the authenticated file layout, exact accepted IDs and actual report schemas. `harness-corrections.json` describes them. No clinical input, expected action, old report or candidate was changed.

The source material is the pinned official extracted text, not a newly verified PDF binary. Original PDF binary hashes and visual table inspection remain unverified. Browser layout, PDF pixels, deployment, broader current-rule coverage and clinical/pharmacy authorisation are outside this review. The previously accepted metadata, product and CNS suites remain separately attributed.
