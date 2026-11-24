# Eribulin 00228 external clinical draft

Reviewed 18 November 2026. This draft has **136 passing actual-engine checks covering all 43 rules**. It is outside the application and has not been independently approved for clinical use. The unchanged application baseline and draft SHA-256 values are in `eribulin-draft-manifest.json`.

## Findings and resulting behaviour

The existing shared breast/liposarcoma base already had a substantial 32-rule reconciliation. Its indications, eligibility, exclusions, treatment phases, dose levels and monitoring structure are preserved. Six existing history rules now also accept directly entered prior eribulin nadir/duration/complication data. Eleven additional rules address indication context, dose convention, proposed re-escalation, incomplete restart evidence, contradictory renal entries and urgent severe skin toxicity.

| Finding | Draft behaviour | Verification |
|---|---|---|
| Two historical inputs produced a quantified future dose despite missing current counts and recovery. An active hold could coexist with that quantified suggestion. | Keep the exact source dose-reference text, but make the action a visible specialist review and block numeric dosing. Merely adding a numeric block to `dose_reduce` hid the row in the existing viewer; the supported `consultant_review` action retains it. | Original outputs are preserved in `eribulin-original-probes.json`; actual dose-viewer tests check qualitative visibility and the overriding current hold. |
| Historic thresholds were represented only by composite boolean flags. | Preserve those flags; add paired numeric history inputs and review incomplete pairs. Current counts never substitute for prior nadirs. | Strict threshold tests distinguish nadir, duration and complication boundaries; all six historical pathways are exercised. |
| No explicit guard against a proposed increase after a reduction. | Review both the user's re-escalation flag and an objectively higher planned base dose than the documented reduced dose. | Exact/current dose and immediately-above tests, including a contradictory false boolean. |
| Shared indication context could transfer a breast-specific partner to liposarcoma. | Preserve breast content; restrict the trastuzumab footnote to its breast context and require liposarcoma eligibility confirmation. | Breast and liposarcoma context checks; original structures compared exactly. |
| EU base and salt-equivalent literature doses could be confused. | Review uncertain/salt convention and any proposed base dose above the regimen reference. No automatic conversion. | Base-reference and salt-equivalent input tests. |
| Selected renal bands could disagree with the actual result. | Explicit reconciliation without numeric prescribing; the existing exact-boundary review remains. | Matching and contradictory bands, legacy band and exact-boundary tests. |
| A restart flag alone did not document recovery or a prescribing decision. | Require separate recovery and consultant/pharmacy confirmations; actual adverse current findings still override both. | All nine missing/false/true combinations plus unresolved current neuropathy. |
| Severe blistering/peeling rash was not separately distinguished. | Urgent hold and clinical assessment for possible SJS/TEN. This is a conservative safety guard, not a fabricated permanent-stop/rechallenge algorithm. | Positive actual-engine hold and component attribution. |
| Historical binary provenance could be mistaken for a new PDF retrieval. | Preserve the old hash only as historical provenance; current evidence is explicitly extracted text. | Metadata assertions and manifest hashes. |

## Source boundaries retained

Current NCCP 00228 text was read in full, including the indication table, treatment footnotes, eligibility, current-dose and previous-cycle distinctions, organ impairment, supportive care and changelog. The existing initial versus treatment-day count distinction remains; a historical event at the lowest dose prompts consideration of discontinuation rather than an automatic permanent stop. The complete current source is separately archived at `../sarcoma-batch3-sources-20261118/00228-web.txt`.

The source's exactly-50 mL/min renal gap remains explicit. Its original-dose percentages must not be serially multiplied or used to re-escalate a previously reduced prescription. Product information expresses hepatic doses as absolute base doses and describes severe impairment differently; the draft retains the more restrictive NCCP pathway with specialist reconciliation. No US day-15 catch-up rule and no other regimen's grade-at-most-one recovery threshold were imported.

The footer says **version 8**, while the change log records **version 9, 20 May 2026**, for a review-schedule amendment. `nccp-00228-v8` remains the canonical draft ID with both facts recorded. A future source-owner-confirmed migration to v9 must update aliases, routes, index, cards, contexts and validation records together. It must retain the two indication IDs and breast/liposarcoma content.

## Supplementary primary evidence and limitations

The current manufacturer SmPC was retrieved through its public EMC page (updated 11 December 2024). Relevant extracted sections cover dose convention, prior-event thresholds, organ impairment, count monitoring, QT/electrolytes and the severe skin reaction listing. The saved extraction also records an EMA PDF fetch returning HTTP 429; no repeated bypass or download attempt was made. Previously retrieved EMA indexed excerpts and the historical EMA safety decision are supplementary evidence, not newly retrieved PDF binaries.

No actual NCCP or EMA PDF binary was retrieved for this review; no table pixels were inspected. All current hashes identify saved extracted-text artifacts or draft files. Tables with unresolved boundaries remain review paths. Browser-level UI checks, independent consultant review and oncology pharmacy approval remain outstanding.

## Test scope

`node eribulin-source-cases.cjs` invokes the application's real assessment engine, strict schema validator and dose-action model. It checks initial/day-specific eligibility, positive and negative exact boundaries, current versus historical events, recurrence sequence, incomplete inputs, dose-model visibility, organ/QT pathways, context preservation and unchanged application bytes. The only schema warning is the existing absent `metadata.review_date`; the dated source review is recorded separately and is not clinical approval.

The test harness treats the viewer's `quantified:true` flag for a contraindication displaying “Not to be administered” separately from a numeric treatment dose. It still rejects any quantified modified treatment dose before prescription reconciliation. All 43 rules are positively exercised, but rule coverage alone is not clinical validation.

## Independent draft-read corrections

A separate software reviewer found three additional gaps before freeze: missing fever history when a short prior neutropenic duration was supplied, a nonstandard current dose without a visible reconciliation action, and Child–Pugh C labelled as a formal contraindication although NCCP says not recommended. The draft now explicitly reviews missing complication history and nonstandard doses, and uses withholding/specialist review for Child–Pugh C. All three concrete probes are covered by the 136-case suite. This is software review, not consultant/pharmacy approval.
