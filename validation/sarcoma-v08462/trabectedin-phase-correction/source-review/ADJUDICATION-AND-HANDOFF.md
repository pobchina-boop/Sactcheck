# Trabectedin phase correction — source adjudication

The current NCCP00374 v4a indication applies to adult advanced soft-tissue sarcoma after anthracycline/ifosfamide failure or unsuitability. Its corticosteroid premedication requirement applies before treatment infusions, including a restart. Neither requirement becomes irrelevant merely because the assessment stage changes.

The implementation changes exactly two phase predicates: `STS_CONTEXT` and `DEX_PREMED_REVIEW` now cover `baseline`, `on_treatment` and `restart`. Their missing-or-false confirmation conditions, nonnumeric `consultant_review` actions, messages, component attribution and source references remain unchanged. Every other JSON value is preserved. Patient PDFs already contain the correct information and were not changed.

Application before: `0092a08c9d9af574450d4d0e5cfbbcff15e175a914bc690dcb3fbf1e06033ced`.

External candidate: `97ac4f635bc4d3bdda114a1d4efbdc320f8fc9b84c9d16c369d759a1a2b19004`.

The archived source-author draft is preserved separately from the currently integrated application metadata. The two exact JSON-pointer replacements are recorded for each lineage in `transition-manifest.json`. Applying the candidate or reconstructing its conditions belongs to the integration owner; this folder performs no application writes.

## Actual defects versus severity assumptions

- The restart premedication cue was absent, and a false indication confirmation at restart/on-treatment was not assessed. These are corrected phase-coverage gaps.
- The existing baseline/on-treatment premedication finding already required confirmation before infusion. Expecting a `withhold` enum instead of this explicit nonnumeric `consultant_review` was a conservative test-severity assumption, not evidence that the source requirement was absent.
- After the restart cue is restored, the original three premedication severity assertions (`00374-01`, `00374-05`, `00374-09`) still expect that stronger enum. Preserve the97/100 raw candidate retrospective result and record any source-adjudicated expectation change separately. The restart case initially had an actual missing-cue defect; it now has the same accepted review action as the other phases.

No blanket exemption is justified: an acceptable recalibrated case must require the exact premedication cue, its confirmation-before-infusion message, trabectedin attribution and blocked numeric dose. A generic unrelated review does not satisfy that requirement.

## Verification

The original675 author cases and154 independent cases pass against staged current candidates without changing their scripts, inputs or expectations. Old result files and application protocol files were checked unchanged during replay. The154-case candidate output contains36 additional source-authorised observations; before/after observations are recorded separately in `existing-replay-results.json`, not written over the earlier report. New focused checks pass27/27. The independent reviewer separately reports18/18 phase-cue cases (original12/18).

The source evidence is current official extracted text at indication lines19–22 and premedication lines178–181. Original PDF-binary verification, visual source-page inspection, consultant/pharmacy approval and a local prescription are not asserted.
