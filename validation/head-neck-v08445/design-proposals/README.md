# v0.84.45 patient layout recovery proposals

These are proposed installable files; no production file is changed by this directory.

The document builder extends v44 in place through explicit small overrides. It retains the independent source-statement, companion-clause, original anatomical pixel/physical-scale, wallet geometry, QR and folio checks. The reviewed v44 audit is used without modification (including gzip storage); a changed/new companion requires a separately reviewed matching audit passed with `--companion-audit`.

Install Python files under `tools/`; install CSS under `assets/patient/`. The v45 CSS must include the v44 CSS text when embedded: a relative `@import` alone is not reliable in HTML rendered with a patient route base URL. Integration should concatenate the files or resolve the import before embedding. This will be corrected inside the proposal builder before final delivery.

Five deliberate chapter-openers add pages; this update does not claim shorter handbooks. Standalone legacy two-page guides are not silently relabelled as three-page packs. Original anatomy/card pages remain unscaled.

Pipeline order: finish clinical authoring and companion review; apply the final publication pass to canonical guides/knowledge/passport/companions; construct each portal from its final guide bytes; mirror canonical HTML; freeze the actual previous anatomy/card PDFs; build staged documents; run independent verification and actual visual inspection before publishing files to a release ZIP. Do not run publication in an order that feeds yesterday's guide into today's portal.

Current status: proposal recovery in progress. No full rendering, visual QA or production publication has been performed by this agent.

## Recovered checks and integration details

- Portal transform source/idempotence check: all 228 baseline authored routes pass. The six new v45 contexts must be included after authoring; this is not a 234-route claim.
- `00660` staged handbook sample: 16 to 21 pages. Independent verifier passes five preserved-page checks and two QR checks, all bounds/folios/contents/source-retention checks. The full-page openers deliberately add five pages. Ten selected pages were visually inspected in `render-smoke/contact-sheet.png`, including five chapter openers, the original anatomical page and the writable record. This is a sample, not complete visual validation.
- `patient-canonical-retention-v08445.cjs` plus JSON plan restore 86 exact reviewed display paragraphs representing 87 reviewed source clauses across 31 canonical OncoWiki documents. One short supply prompt uses its explicit, reciprocal historical cross-unit counterpart. The separate Python verifier reads the frozen historical audit directly and passes all 87 clauses, including nearby conditional source headings.
- No passport-specific reviewed counterpart is missing. `enhancePassport` intentionally returns its source unchanged. All 12,515 historical exact/equivalent counterpart destinations were compared with knowledge/passport: twelve are in separate canonical support plans or the printed chronology table. These are retained through the handbook pipeline and linked through practical companion guides; prescribing-plan text is not copied into patient narrative just to remove a valid distinct-purpose destination.
- Historical companion source files and their hashes remain unchanged. The restoration adds only the explicit clauses into an existing corresponding topic, or a named subsection inside the existing practical-support chapter. It does not change clinical assertions or source audit decisions.

Install the retention JSON under `data/` and both CJS modules under `tools/`. Run the final v44 editorial/visual pass first; restore knowledge clauses next; construct the overview **using the final guide HTML through `guideHtml`**. Finish by mirroring canonical documents. The builder reads the finished sources and retains every v44 independent check. The v45 builder now resolves inherited CSS itself when embedding, so the earlier relative-import warning is addressed.

New/updated companion sources still need their explicit reviewed inventory. `--companion-audit PATH` is supported by both wrappers. Never feed a stale baseline anatomy/card PDF to a changed clinical route; the parent integration must freeze the newly generated and verified v45 anatomy/card pages for those routes before book assembly.

Remaining parent validation: 234-route generation/verification, full current-scope clinical audits, fresh desktop/mobile portal screenshots and interactions, representative final PDF page inspection, mirrors and live QR destination checks. Source-level portal checks alone cannot establish phone readability or correct printed dimensions.
