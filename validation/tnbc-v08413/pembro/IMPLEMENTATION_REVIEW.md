# Independent implementation review: 00858, 00860, 00861

Reviewed 20 October 2026 against the first generated v0.84.13 protocol build and `tools/reconcile-tnbc-v08413.py`. No application files changed. Source is the official NCCP PDFs documented in `AUDIT.md` and `source-provenance.json`. This is an independent software/source check, not independent clinician or pharmacy sign-off.

## Recheck after implementation fixes

At **2026-10-20T20:04:53Z**, the expanded actual-engine runner produced **410 checks: 408 passed, 0 failed, 2 inapplicable**. The exact protocol, engine and CTCAE helper hashes are retained in `implementation-review-results.json`. This supersedes the initial failure totals below. These are tested source scenarios, not a percentage measure of overall clinical safety or clinical validation.

The raw-liver safety gap, inactive-adjuvant cytotoxic action, recovered previous neutropenia, prolonged-delay precedence, incorrect immune grading metadata and unsupported 00860 three-week maximum-delay text have been corrected in the reviewed files. The grade checks also invoke the real CTCAE display helper: all eight immune grade fields identify the source CTCAE4 context and avoid unrelated CTCAE5/neuropathy symptom descriptors.

### Independent adjudication of endocrine exception guards

The official 00860 Table 4 was reopened during this review, including the complete p9 footnotes. The same source pattern is present in 00858/00861. We did **not** simply relax all failing permanent-discontinuation expectations to accept any restrictive output.

- Broad recurrent-grade-3 and unresolved-toxicity-at-12-weeks inputs do not identify the affected organ. With an endocrine exception unresolved, a blocking **withhold plus specialist review**, explicitly preserving the source permanent-discontinuation question, is an acceptable software guard. It is not a new NCCP rule permitting continuation. If the controlled-endocrine exception is explicitly excluded, the source permanent action must remain.
- **Failure to taper prednisone equivalent to <=10 mg/day within 12 weeks is different.** The p9 footnote specifies permanent discontinuation, and the endocrine continuation passage itself requires corticosteroid taper when needed. The controlled-endocrine boolean cannot waive that criterion. The implementation was corrected; permanent action now passes for endocrine false, true and missing.
- Controlled endocrinopathy never overrides a separate definite stop criterion. Independent combined cases for pneumonitis grade 3, colitis grade 4, hepatitis grade 3 and cardioneurological grade 3 retain permanent discontinuation.

The runner now exercises false/true/missing endocrine context for recurrence, recovery and taper separately. Missing is genuinely omitted from the input object rather than supplied as false. Source: [NCCP 00860 v2, Table 4 pp8–9](https://healthservice.hse.ie/documents/6452/860_v2_Pembro_Carbo_AUC_5_Pacli_80_DDAC.pdf).

### Remaining scope and presentation caveats

- Make grade 2 adrenal insufficiency/hypophysitis explicit in the endocrine input label/help. The current “severe or uncontrolled” label is broad enough for the blocking rule but does not teach the source grade 2 inclusion clearly. State the 12-week anchor after the last pembrolizumab dose and the steroid unit mg/day.
- The aggregate indication/eligibility confirmation remains a clinician check; these tests do not prove independent automatic stage, age, previous-therapy or all-exclusion validation.
- The adjuvant abnormal-count and cardiac review guards are conservative software safeguards, not newly asserted NCCP pembrolizumab dose cutoffs. Their displayed text appropriately distinguishes this.
- Grade inputs require an established diagnosis-specific clinical grade; they are not an automated immune-toxicity diagnostic tool. This reviewer has not performed the browser walkthrough, generated-document review or multidisciplinary clinical sign-off.

## Historical initial findings

The following findings document what was uncovered before the fixes. Read the recheck above for current status.

## Priority fixes

### P1 — raw liver values can be falsely reassuring during pembrolizumab

Actual `AssessmentEngine.assess` result for every protocol:

- `{treatment_phase:'adjuvant',alt_uln_multiple:6}` → `proceed_with_caution`, with `PARTIAL_ALT_ULN_MULTIPLE_NO_RESTRICTION`.
- `{treatment_phase:'adjuvant',bilirubin_uln_multiple:4}` → `proceed_with_caution`, with `PARTIAL_BILIRUBIN_ULN_MULTIPLE_NO_RESTRICTION`.
- AST 6×ULN → merely recorded; AST is defined as an input but has no active decision rules.

The same gap affects AC plus pembrolizumab and taxane plus pembrolizumab (ALT6 with bilirubin1 can show no restriction). Grade-only immune rules do not supply biochemical safety assessment. Add a clinically framed review/hold for significant supplied AST/ALT/bilirubin values, retaining diagnostic uncertainty. Do not diagnose immune hepatitis or permanently discontinue solely because an isolated abnormal lab was entered. Source Table4 p8 supplies the relevant biochemical thresholds; its grade/clinical context still matters.

### P1 — inactive cytotoxic rules create both false stops and false reassurance

- Adjuvant pembrolizumab plus LVEF45 → **doxorubicin contraindicated**, from ungated `LVEF_LOW`. Gate anthracycline actions to the relevant baseline/AC context. If cardiac review remains appropriate in other phases, represent that separately without issuing an inactive-drug dose decision.
- Adjuvant pembrolizumab plus ANC0.1 → **ANC no restrictive threshold triggered**. The partial-result synthesiser treats phase-inapplicable chemotherapy rows as assessed negative rows. This should be explicitly unassessed for the active therapy, or a separate clinical review, not a reassuring count interpretation. No arbitrary pembrolizumab ANC threshold should be invented.

### P1 — 00860 recovered counts erase a required previous-toxicity review

`{treatment_phase:'taxane',assessment_stage:'ongoing',day_number:1,anc_x10e9_l:2,platelets_x10e9_l:150,anc_below_0_5_duration_days:8}` does not trigger source carboplatin next-dose reduction review.

`CARBO_SEVERE_PRIOR` incorrectly ANDs the **current** ANC<0.5 with the duration of previous ANC<0.5. Source Table1 p6 requires next-dose reduction after ANC<0.5 for≥7days; it remains relevant once counts recover. Use explicitly historical evidence, and never demand that severe neutropenia persist to recognise its dosing consequence.

### P1 — prolonged recovery can lead with the less restrictive reduction pathway

00858/00861: taxane phase, ANC0.3 and haematological delay15days produces top finding “consider25% reduction”, while the prolonged-recovery “consider50% or cease” finding ranks beneath it. Suppress the uncomplicated reduction branch when the more specific prolonged/recurrent criterion is known, or otherwise make the more specific source pathway decisive and prominent. Both findings being printed does not adequately resolve conflicting dose guidance.

### P1 — general recurrence flag can override the stated endocrine exception

`immune_recurrent_grade3:true` plus `immune_endocrinopathy_controlled:true` produces unconditional permanent discontinuation. Source Table4/footnote says “unless otherwise specified”; controlled endocrine exceptions require subtype-specific review. A generic flag without toxicity identity must not conclusively resolve this. Do not let a controlled-endocrine flag override independent pneumonitis/colitis/etc stopping criteria either.

### P2 — source grade attribution and generic descriptors

The shared `grade()` helper labels every new field CTCAE5, whereas NCCP Table4 specifies CTCAE4. It maps `immune_myocarditis_neurological_grade` to **neuropathy** solely because its key contains “neuro”; colitis, nephritis and hepatitis fall back to other-nonhaematological descriptions. A clinician using those descriptors could choose the wrong grade. Give each immune field the correct source-linked definition and clinical context, or clearly require already established grade rather than supplying unrelated descriptors. Grade2 adrenal insufficiency/hypophysitis should be explicit in the endocrine pathway, not discoverable only through a broadly worded severe/uncontrolled flag.

### P2 — unverified maximum-delay claim in00860

The rebuild states a three-week maximum haematology delay for00860. The current00860 Table1 includes an unmatched superscript “a”, but the accessible full-source extraction and searches do not contain a three-week maximum-delay statement. The prior JSON had such a value; this is not adequate provenance. Verify the PDF footnote visually or remove/attribute the statement as a separate clinical review policy. Do not call this verified NCCP guidance without support.

## Corrected and verified in this build

- 00858/00861 weekly carboplatin/paclitaxel thresholds are now distinct from00860 Day1/Day8/15 rules.
- 00860/00861 ddAC thresholds are distinct from00858 q21AC, and exact ANC1/platelets100 source gaps return review.
- Carboplatin AUC is corrected in actual schedule and calculator:00858/861 AUC1.5;00860 AUC5.
- Six-week pembrolizumab appears only at neoadjuvant cycles1,3,5,8 in00860/861. Their AC interval is14days. Adjuvant branch is400mg q42×5 with the correct six-week-after-C8D1 note; erroneous400q21 branch is removed.
- Mandatory G-CSF for all ddAC cycles is represented.
- Core haematology/organ/source-gap expectations pass, accepting consultant review when it explicitly conveys the source dose recommendation instead of prescribing an automatic dose.
- Pneumonitis, colitis, hepatitis, nephritis, skin and other immune grade rows now produce executable actions, including the core recurrent/12-week/SJS-TEN and severe infusion/cardioneurological flags.

## Reproducible acceptance runner

Run:

```
node /workspace/scratch/aa44ad62d693/tnbc-v08413-research/pembro/run-implementation-review.cjs /workspace/scratch/aa44ad62d693/sactcheck-v08413
```

The runner loads actual generated JSON and `js/assessment-engine.js`; it does not invoke the generation script or edit the application. It writes `implementation-review-results.json`, including file hashes and each observed result. It maps the independent source-case set to the new schema and adds raw AST/ALT/bilirubin, cross-phase, endocrine-exception, prolonged-recovery and complete immune-grade scenarios, plus exact schedule assertions.

Two original source cases are explicitly **inapplicable**: they said merely “second AC delay” without identifying platelet versus neutrophil delay. The printed75% instruction belongs to the platelet-delay row; those cases must not force generalisation. This refinement is recorded rather than counted as a successful test.

Initial run before fixes and before adding the recovered-neutropenia case:352 checks;312pass,38fail,2inapplicable. The expanded runner now contains410 checks; rerun after further changes and use its timestamped output, not the historical totals. No browser walkthrough was performed by this reviewer.
