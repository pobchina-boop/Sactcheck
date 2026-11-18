# v0.84.60 deployment repair

Base release: ee5f22c222afc35b6c220bbdd9f3c8a3041d6777. This repair follows commits b07bb063 and 4661dfaf. Earlier failed check logs remain historical evidence; their missing-history limitation was resolved by fetching all 19 pinned Git histories.

## Final changes

- Retain the exact route-registration repairs for the v58-v60 migrations and all 272 protected patient routes.
- Make the 00453 transplant chronology renderer reproduce the authored conditioning days -5 to -3, stem-cell day 0 and recovery days +1 onwards. Preserve the source tracks, warnings and references. Use that renderer during UI refresh so regeneration cannot restore the incorrect unsigned axis.
- Prevent a duplicated MVAC monitoring style from making complete-pathway regeneration non-idempotent.
- Rebuild the shared journey runtime from the existing authored data. Restore its five missing sarcoma definitions (00500, 00391, 00392, 00501, 00511) and regenerate their affected knowledge/journey HTML, standalone journey PDFs and reference/handbook PDFs.
- Rebuild 00453 reference/handbook PDFs with the corrected axis. Preserve all six original guide PDFs.
- Keep original clinical-source and migration records immutable. Record exact additional file transitions in the authenticated repair overlay and apply that overlay to terminal expected hashes and sizes.

## Verification evidence

The 00453 books passed staged verification, including five preserved-page checks and two decoded QR checks. The five sarcoma books passed 25 preserved-page checks and ten QR checks. All 12 rebuilt books are byte-identical in both published mirrors. Five standalone journey PDFs passed 258 current-source-unit checks across 20 pages and both mirror checks. Representative signed-axis, journey and handbook pages were rendered and visually reviewed. These checks verify implementation and content retention; they do not establish independent clinical approval.

The publication wrapper was normalized after rendering. Original guide PDFs were deliberately retained. Consequently the generic all-document published verification reports a guide hash mismatch against its freshly rendered guide candidate; the staged content/geometry verification plus explicit published-book mirror verification are the applicable evidence for this selective repair.

Full regression and deployment results are recorded separately. A green GitHub run and live-site verification are required before marking deployment complete. Later sarcoma batches must be reconciled against this repaired baseline before application.

The legacy GU library test now uses the exact v59 source-hash contracts and the reviewed v59 field names/schedule properties. Its legacy field checks were stale; protocol data was not changed by this repair. The focused repair regression is now part of the production release gate.

## Completed local production checks

The production release gate, repository security check, protocol regeneration, every command in the main regression suite, production build and deployed-site security check passed. The main suite was resumed at each identified stale integration assertion; the original failed logs were retained. No clinical protocol JSON was changed by this repair. The exact final commit is also subject to the full GitHub production workflow.

Additional integration repairs recognise the fifteen source-verified v58/v59 schedule additions, the v58 00450 maturity/identifier contract, and the two v60 replacements in the historical organ-function audit. The test verifies the exact nine removed historical rule IDs and their current source-bound replacements. TIP's general dialysis review and stricter ifosfamide contraindication are allowed only for that exact source-hashed pair, with executable assertions that the contraindication wins and numeric dosing stays blocked. No general conflict exception was introduced.

Regression scripts regenerate historical report outputs. Their reruns are retained separately; committed historical evidence is preserved rather than replaced with run-specific timestamps or working-directory paths. The additional all-tissue CI command and final baseline preservation are tracked in the repair execution log. Live deployment must still be verified against the final commit.

The regression-stage runner now archives fresh output for 25 explicitly listed report paths and restores their pre-run bytes, on both success and failure. Unlisted source changes remain untouched and detectable. Exit codes are preserved. The production workflow wraps the report-writing stages and uploads their evidence even when a stage fails; test:ci wraps each top-level stage so preservation checks see the original historical evidence. Two subprocess tests verify success/failure handling, byte preservation, output retention and visibility of unregistered changes. The cumulative patient migration inventory now includes v58-v60 explicitly.

## Production run follow-up

GitHub run 44410614339 passed the release gate, repository security, regeneration, full main regression suite and CodeQL. It exposed two additional legacy inventory lists in the imported v43/v44 patient-design tests. Both now include the exact v58-v60 records with their existing scope validators. Historical records, file counts and byte checks remain unchanged. The full patient UI test is rerun locally before publishing this follow-up.
