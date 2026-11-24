# Five retrospective audits prepared for v0.84.62

Prepared externally on 18 November 2026 against the frozen v0.84.61 clinical JSON, with unchanged v0.84.60 dacarbazine. **82 fresh mixed-context cases: 81 passed; 1 cardiac-context review-cue mismatch remains recorded for subsequent refinement.** Source-author adjudication found no demonstrated missed NCCP-mandated dose action in that mismatch. No clinical/pharmacy approval is implied. No application files were changed or evidence installed.

| Audited regimen | Source reviewed in full | Fresh cases | Passed | Unresolved |
|---|---|---:|---:|---:|
| 00335 imatinib GIST | NCCP v4, five pages /224 retained lines | 16 | 16 | 0 |
| 00325 sunitinib 42 days | NCCP v6, five pages /256 retained lines | 16 | 16 | 0 |
| 00719 sunitinib 21 days | NCCP v2, five pages /244 retained lines | 16 | 15 | 1 |
| 00244 regorafenib | NCCP v5, seven pages /364 retained lines | 16 | 16 | 0 |
| 00511 dacarbazine | NCCP v2, three pages /131 retained numbered lines | 18 | 18 | 0 |

## What was tested

Each case supplies its source URL, retained line references and clinical mechanism/rationale in `cases.json`. Expectations were authored from the complete retained sources before execution. The script does not import authored case sets or assert implementation rule identifiers. It executes the actual assessment engine and dose-action model using copied, hashed original runtime modules and clinical JSON.

- **00335:** HBV planning remains visible despite renal review; fluid retention, acute hepatotoxicity and persistent nonhaematological toxicity remain restrictive despite other recovery or dose-escalation context. KIT eligibility, adjuvant versus advanced dosing, bleeding/failure symptoms and breastfeeding are separate checks.
- **00325:** GIST-only imatinib prerequisites do not leak into RCC. Current hypertension, surgery, HFS and symptomatic LVEF decline override reassuring unrelated history. Opposite CYP interaction classes do not cancel into a numerical dose; the current low ANC still delays despite prior cardiac recovery.
- **00719:** Shared GIST/RCC eligibility stays distinct. Significant cardiovascular disease, severe skin reactions, confirmed SJS/TEN, major surgery and contradictory BP-control entries retain source-specific actions. Confirmed versus unconfirmed source-defined EF decline is tested separately, as is inhibitor management at an already reduced prescription.
- **00244:** Child-Pugh C is not cleared by normal enzymes or HFSR recovery. Objective severe systolic BP is not cleared by a low selected grade. Current HFSR, active liver injury and symptomatic hypertension retain their separate recovery requirements; same-class hypersensitivity remains a caution rather than an unsupported absolute contraindication.
- **00511:** Severe cytopenia, liver disease and kidney disease remain actionable across all four assessment phases despite competing count, bilirubin or CrCl entries. The post-neutropenic-sepsis reduction refers to the previous dose; renal/hepatic percentage advice must not be multiplied into an automatic prescription. Dialysis is not silently assigned a numerical renal row.

Every case checks schema-valid input, engine errors and suppression of automatic numeric prescribing. Hold/stop cases also check the affected dose-action component, rather than relying only on the headline assessment. The five audits do not constitute a global suite or repeat the preceding 119-case v0.84.61 review.

## Original unresolved result

`00719-13` enters on-treatment LVEF49%, source-defined >20% decline explicitly false, no CHF, current generic toxicity grade1 and haemodialysis. The engine emits consultant reviews for missing indication and dialysis, with no cardiac-specific finding. The model emits no numeric dose; the assessment remains incomplete.

The audit expected **cardiac-specific review, not an automatic interruption**. NCCP page3 L132–L142 discusses cardiac risk/monitoring and requires both EF<50% and >20% decline for its asymptomatic interruption/reduction rule. The extra review expectation for isolated EF49% is therefore a conservative clinical interpretation, not a verbatim numeric threshold from the source. This distinction was explicitly sent to the parent/source owner for adjudication. A code defect is not established solely by this mismatch. The original expectation and failed result are preserved; they must not be relabelled as a pass or silently relaxed. All actual source-defined hold/stop checks passed.

The source-author review confirmed that the conjunction must remain intact: isolated EF49 with the decline criterion explicitly false does not require the source-defined interruption/reduction. A cardiac-specific review cue is a reasonable conservative workflow improvement under the source's cardiomyopathy caution/periodic-LVEF discussion, rather than a proven missed source-mandated dose action. The mismatch remains **failed against its original expectation**, classified as a conservative workflow cue for subsequent refinement. Frozen v0.84.61 was not modified. This software/source adjudication is not independent consultant or pharmacy clinical approval. `adjudication.json` records this decision and `final-results.json` records the final unchanged 81/82 audit outcome.

`00719-13-diagnostic.json` is a separate, uncounted diagnostic removing unrelated indication/dialysis review signals. With GIST selected, its imatinib prerequisite confirmed and dialysis=false, the same EF49/decline=false/CHF=false combination yields `proceed_with_caution`, `complete:false`, `coverageComplete:false` and only partial-domain findings, including `PARTIAL_LVEF_PERCENT_NO_RESTRICTION`. No numeric dose is emitted. This establishes the absence of a cardiac-specific cue; it does not change the original expectations, establish overall clearance or prove that the source mandates interruption.

## Reproduction and evidence

From this directory, run:

```sh
node run-audits.cjs --output reproduced-original-results.json
```

This uses only the preserved `snapshot` and rejects changed source/protocol/runtime hashes. It refuses to overwrite an existing report. To replay unchanged expectations against a later authorised application baseline:

```sh
node run-audits.cjs --current /absolute/path/to/Sactcheck --output final-results.json
```

`original-results.json` is the first execution and is immutable evidence. `input-manifest.json` pins the five original clinical JSON files, current retained sources and four runtime modules. `cases.json` contains the frozen expectations; `define-cases.py` records how the case inventory was constructed. Result files record source-manifest, case, runner, runtime and protocol SHA256 values, timestamps, exact inputs and observed findings/dose actions. `SHA256SUMS` permits integrity checks on this external evidence directory.

## Boundaries and source limitations

Only the five named retrospective audits are included. No PDF binary/source-table image pixels were available; this is complete extracted-text reconciliation, not visual table verification. The current catalogue-linked dacarbazine v2 has an elapsed printed review date; its header says1.2mg/m² while the treatment table/title say1.2g/m², the printed ICD is C43, and renal CrCl45 overlaps two dose rows. Those limitations remain explicit in retained source review notes.

Imatinib NCCP/SmPC cytopenia guidance differs. Sunitinib42 Child-PughC NCCP guidance differs from the retained SmPC position. Sunitinib21 uses its own older calendar, cardiac eligibility and monitoring wording; these were not silently substituted with the 42-day regimen. Regorafenib's contradictory food wording and suspect printed diastolic rise >200mmHg remain source caveats, not encoded physiological clearance thresholds. No automatic dose was asserted to resolve source gaps.

No browser checks, public-source fetches, Git writes, commits, pushes, deployment or application changes occurred. Independent consultant and oncology-pharmacy approval both remain **false**. Installation into the application is pending explicit parent permission after v0.84.61 packaging/freeze.
