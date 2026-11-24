# Olaparib: independent decision-rule probes

Review date: 24 November 2026. Reviewer role: source reconciliation and independent software behaviour check. This does not constitute consultant or oncology-pharmacy clinical approval.

## Scope and method

I created **123 fresh scenarios with 429 assertions**, covering the decision-engine portions of **33 of the 38** acceptance groups in `clinical-source-review.md`. The scenarios derive from the NCCP/EMA source reconciliation. I did not import, read or copy the clinical engineer's 306-case expectation set. Both the clinical assessment engine and the production component-dose interpretation model were called against the actual canonical protocol files. All inputs are fictional test values.

The tests check source-directed outcomes, component specificity and missing-data disclosure. They do not assert only that a particular rule identifier fired. Where a source criterion permits treatment by that criterion alone, the tests do not treat this as complete treatment clearance.

The full input, result, assertion and source-linked finding records are in the JSON reports. The source checklist as it stood at the first run is retained in the original external review directory as `source-checklist-at-probe.md`; its hash matches the first two reports. The main checklist subsequently gained a provenance note about the retained original 00588 PDF, without changes to the clinical expectations.

## Final result

**PASS: 123/123 independent scenarios and 429/429 assertions. No unresolved discrepancy remains in the tested clinical decision paths.**

- `report-01.json`: 115/123 cases passed initially. Six apparent failures were test-harness assumptions: the production model marks a definitive “Not to be administered” result as quantified, and the word “EMA” adequately identifies the current SmPC source even without the literal string “SmPC” in the action sentence.
- `report-02.json`: those two test assumptions were corrected without changing source expectations or production code. **121/123 cases passed**. The two remaining failures are the same missing-data disclosure defect, once in each regimen. All tested dose, hold, restart-review and discontinuation actions agreed with the source expectations.
- `report-03.json`: **123/123 cases and 429/429 assertions passed** after the targeted missing-data disclosure correction. The same `probe.cjs` and exactly the same input states were replayed. Direct case-by-case comparison with report 02 found **zero changes** in action type, clinical findings, component-dose rows or invalid-input results.
- `report-04.json`: **123/123 cases and 429/429 assertions passed** after an export-order refinement. The missing flagged blood values now appear first in the coverage list so the existing compact first-eight summary retains them. The same inputs and probe were replayed again; comparison with report 03 found no clinical action, finding, component-dose or invalid-input changes.
- `report-05.json`: **123/123 cases and 429/429 assertions passed** on the final frozen catalogue-metadata bytes, using the portable repository copy of the probe. Inputs and assertions are identical to report 04; clinical action types, findings, component-dose rows and invalid-input results are unchanged.
- The original external review directory retains the initial and corrected scripts as `probe-initial.cjs` and `probe.cjs` respectively; this repository contains the portable corrected copy. All five reports are preserved. The only harness changes occurred between reports 01 and 02; no assertions or inputs were relaxed for the production-fix or final-metadata replays.

## Defect found and resolved

**Missing platelet value omitted from the unassessed-data list after an already actionable low ANC.**

Reproduction in either 00588 or 00746:

```js
const result = AssessmentEngine.assess(protocol, { anc_x10e9_l: 0.7 });
```

The treatment action correctly delays olaparib. No platelet or creatinine value is invented, and the overall result remains partial. However, `result.unassessed` omits `platelets_x10e9_l`, although it includes missing CrCl and other outstanding fields. The count rules short-circuit once the ANC itself determines the action. This makes logical rule evaluation complete for that condition but does not make the platelet measurement assessed.

The issue propagates into the named unassessed-domain strip in `generic-assessment-ui.js` and the printable summary produced by `assessment-output.js`, because both use `result.unassessed` directly. Raw input fields stay blank; the engine documentation input list would still say “Not entered”. This is a coverage-reporting defect, **not a demonstrated incorrect treatment action or a false overall proceed decision**. It violates acceptance case U01's explicit requirement that omitted relevant inputs remain named as unassessed.

Root and the clinical engineer were notified with the exact reproduction. With root authorisation, the clinical engineer added a `report_if_unassessed` input flag for ANC and platelets in these two protocols and a narrowly scoped engine disclosure step for missing, visible flagged values. Rule counts remain 87 and 88. This reviewer made no protocol or engine edits and independently confirmed the corrected coverage and unchanged clinical results.

## Clinical branches verified

- Previous olaparib dose is retained at exact ANC 1.0 and platelets 100. Either lower count triggers a hold. Fourth occurrence, severe anaemia/transfusion dependence, four-week persistent cytopenia, suspected/confirmed MDS/AML, and grade 4 febrile neutropenia remain distinct.
- The toxicity ladder stops at 200 mg twice daily. Interaction doses are not reused as later toxicity levels. Acute holds, source conflicts and mixed restrictions do not produce an invented immediate restart dose.
- CrCl 51, 50, 31, 30 and 29 mL/min produce the intended boundary behaviours. Exactly 30 and severe impairment preserve the NCCP/EMA disagreement. Child–Pugh C and haemodialysis remain review states; an unverified renal measurement cannot silently become verified CrCl.
- Strong and moderate unavoidable inhibitors yield their distinct source dose paths. Avoidable inhibition and induction require review; there is no compensatory escalation.
- Breast TNBC tumour-size, HR-positive node-count, neoadjuvant residual disease and CPS+EG branches preserve their exact boundaries. The ideal 12-week start interval is a review, not an invented absolute contraindication. Somatic-only BRCA does not satisfy breast or pancreatic germline criteria.
- Pancreatic stable disease is permitted after the full 16-week first-line platinum criterion. Relapsed ovarian sensitivity is strictly greater than six months; elevated CA125 repeat change is strictly less than 15%, with a decline treated as a valid value. First-line and relapsed duration rules remain separate.
- 00746 can accept validated genomic instability without a BRCA mutation; unknown/negative HRD, absent prior bevacizumab or prior PARP treatment generates the appropriate restriction. The interval-debulking exception to prior bevacizumab cycles is explicit.
- The bevacizumab 15-month clock includes chemotherapy and does not end olaparib automatically. Protein values 2.0, 2.1, 4.0 and 4.1 g/24 hours follow the NCCP boundaries; dipstick and spot concentration remain separate. Nephrotic syndrome overrides a reassuring quantity.
- Symptomatic/persistent hypertension, arterial events, wound healing, intracranial bleeding, different fistula types, suspected versus confirmed PRES, and active infusion reactions retain their component-specific distinctions.
- An invalid unrelated value does not hide an independently known urgent hold. Empty input does not grant clearance.

## Source-original verification

The current official indexed NCCP texts and EMA information were reconciled in the parent checklist. Additionally, the actual retained original **00588 v5b**, printed page 5, was independently re-read for the dose ladder, count table and renal/hepatic bands:

- Repository file: `validation/prostate-v08457/clinical/sources/00588.pdf`.
- Historical source-check manifest date: **16 November 2026**, recorded by `validation/prostate-v08457/clinical/new-sources.json`.
- Reread for this independent review: **24 November 2026**.
- Length: 7 pages; 1,152,036 bytes.
- SHA-256: `de66f9a3d6d802aee6d32261407a7048d2eae2441a730005e1380bda6807d489`.

This is a retained original, not a newly downloaded HSE file. The current EMA Lynparza PDF was separately downloaded and verified by the parent (SHA-256 `04cb6a8e4fff66099a345e60858378068000de050b0e7fedaddb3d5347849598`). No original-file hash is invented for 00746, whose current official PDF text was reviewed through the web source.

## Remaining checks owned by the parent

This test set does not independently verify browser behaviour, PDF visual layout, generated source links/QR codes, or end-to-end state propagation between all eight tools. Full cross-tool parts of S01/S02 and the five groups U02, U03, U04, B03 and B10 remain with the parent's patient-interface/PDF QA. In particular: regimen-only use without fictional personalised inputs; printed values, units, thresholds and sources; changing indication without stale outputs; q3-week combination monitoring with continuous tablets; and the longer bevacizumab post-treatment breastfeeding interval.

The patient profiles remain frozen for that rendering work. The parent's final 00746 card-title adjustment has been mirrored into the author's handoff copy, with its exact updated checksum in `patient-authored/data-validation.json`.

## Final tested byte identities

| Artifact | SHA-256 |
|---|---|
| NCCP 00588 JSON | `b79575c199f89fee1ff2d91105b6e2a91a22617097af08d153b67137f251ce5a` |
| NCCP 00746 JSON | `23f0159ab675264aa2208f35539323bf92f05816d90be508844649a446b353e5` |
| Assessment engine | `d433a6adf0a8f5b4ecefb8e8832206425754bba0d01ebbaa6a6d1bda54262657` |
| Component-dose model | `8eaf62b3970f0985d2d3ffa5408dacc143a3c50ec63fbe36570a1cf2b3a3ec9e` |

## Portable copied probe: path-only adaptation

The repository copy of `probe.cjs` resolves the repository root from `__dirname/../../..`. Its output directory is `SACT_OLAPARIB_REVIEW_DIR`, when supplied, or this script directory otherwise. The output directory must already exist. Its source checklist is the packaged `validation/olaparib-v08463/clinical/source-review.md`. These path substitutions preserve every scenario, input, assertion and result calculation.

The original external probe is unchanged and retained for provenance at `/workspace/scratch/bcd695be21b5/olaparib-upgrade/independent-clinical/probe.cjs`. The copied probe was checked against those bytes by reversing only the three explicit path substitutions; the remaining text is identical.

After the final protocol metadata is frozen, run the copied probe with an existing external output directory and report number `05`:

```bash
SACT_OLAPARIB_REVIEW_DIR=/path/to/existing/review-output node validation/olaparib-v08463/independent-clinical/probe.cjs 05
```

Reports 01–04 retain their original provenance. Report 05 was generated after root confirmed the final catalogue metadata was frozen, using the portable copy and an external output directory, then copied into this evidence directory. Comparison with report 04 found identical input states and assertions, and no differences in clinical action types, findings, component-dose rows or invalid-input results. The final tested identities above are the report-05 hashes.
