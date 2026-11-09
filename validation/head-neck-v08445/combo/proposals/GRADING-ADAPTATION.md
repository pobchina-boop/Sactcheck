# v0.84.45 grading regression proposal

This proposal preserves the pre-existing platform assertions and adds exact contracts for ten freshly audited protocols. It is not a code/release whitelist: each named field, primary URL, audit metadata path, source edition and permitted supplement is enumerated. An unexpected grade field fails.

## Integration

1. Copy `head-neck-grading-v08445.cjs` to `tests/helpers/`.
2. Apply `platform-standardisation.patch` (or review/copy the full test candidate). Existing type, option, descriptor, renal, catalogue, risk and endocrine assertions remain.
3. Review and apply only `set` and `remove` keys from `grading-metadata-proposal.json` to the stated input definitions. Do not recopy entire protocols: root has additional integration metadata.
4. Re-run the normal platform test and release checks.

## Actual issues exposed

- 00385/00387 retain legacy CTCAE v5 attribution although their retained current NCCP v5 PDFs do not identify a grading edition. The proposal changes only the source label/URL/note/guidance and descriptive option text, removing the unsupported edition/CTCAE URL. It does not change selected grade values, severity thresholds or treatment rules.
- 00705/00706 already correctly separate CTCAE v4 immune fields from unspecified-edition cytotoxic fields, but currently lack `grading_source_label`. The shared renderer consequently supplies generic descriptions and, for unspecified fields, labels the panel CTCAE v5. The proposal supplies the exact source label/URL and clinician-confirmed event-grade note, disabling automatic generic grade calculation.
- 00733 preserves its separately labelled historical v5 UI orientation and the explicit NCCP Table 6 legacy diarrhoea descriptors; neither is attributed to a new NCCP edition.
- The EMA Keytruda URL is permitted only for the exact overlap-syndrome field of 00455/00558, and requires that audited supplement to remain declared. It is not accepted for other fields or regimens.

## Evidence

`verify-grading-proposal.cjs`: 10 protocols / 78 explicit grade definitions / 37 rejection checks pass. Rejects swapped primary sources, wrong audit releases, invented v5 editions, an unaudited field, misplaced overlap attribution, missing EMA supplement, generic renderer fallback and conflated cytotoxic/immune editions. Rule engines and option values remain unchanged.

`run-proposed-platform-test.cjs` compiles the proposed test with its original filename, so relative helper/root paths match production. Without metadata proposals, it correctly fails on 00385 unsupported v5. With the proposals applied in memory only, it progresses to the independent renal contract failure at 00385/crcl_ml_min (`renal_input.mode` undefined). That assertion has not been removed or relaxed. Full-suite success is not claimed.

All files here are proposals/evidence. No shared application or test file was changed by this subtask. Independent clinical and pharmacy review remains pending.
