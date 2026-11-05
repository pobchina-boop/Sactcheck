# v0.84.33 consolidated audit

Base: committed v0.84.32 (`7963400d502f0407d3fa3a733d774db2d3f07ef6`). Checked 4 November 2026.

This is a source-to-software reconciliation and automated/visual verification, not independent clinical authorisation. Current official NCCP binaries, extracted tables, hashes and before snapshots are retained in each source-audit folder.

| Group | Scope | Cases passed |
| --- | --- | --- |
| [triplet-source-audit](./triplet-source-audit/AUDIT.md) | 00555 / 00783 / 00691 | 357 |
| [vegf-source-audit](./vegf-source-audit/AUDIT.md) | 00238 / 00791 | 279 |
| [retro-source-audit](./retro-source-audit/AUDIT.md) | 00210 / 00213 / 00446 / 00449 / 00448 | 162 |

Detailed clinical findings and source-table locations are in the linked reports. Historical failure replays demonstrate changed behaviour; their individual assertion counts are not counts of separate clinical defects.

Integration findings: the rectal dose schedule originally failed the component-completeness contract and was fixed with phase-specific active medicines and day arrays. The legacy v0.70.0 browser overlay was found to overwrite current 00783 clinical and evidence records; explicit supersession now protects the audited record and is tested. Bare grade controls were replaced with sourced guidance, including source-specific proteinuria grading and no invented CTCAE hand-foot grade 4.

Browser integration identified duplicate bilirubin controls in 00783, 00691, 00238, 00449 and 00448. These now use the established absolute-result adapter: one entered result supplies the source-specific absolute and ULN-ratio rules. Blank results remain unassessed, and no source threshold or unit was changed.

All ten patient routes retain eight distinct anatomical anchors. The summary has three pages; the cut-out card sheet has one. The full handbook preserves the reference text and includes the actual phase-specific supportive-care sheets. Telephone examples remain explicitly marked for replacement.

Final verification: all 266 regression/build commands passed; all 798 source-based cases passed. The document pass checked 111 PDFs, their matching download copies, 40 QR codes and 1,878 reference-text blocks. Focused browser checks are recorded in `browser-validation.json`. All nine clean-application command groups passed after applying the ZIP to a separate checkout of the committed v0.84.32 base, including the release gate, source cases, full-suite integration, Pages build and deployable-site validation.

No unreviewed source ambiguity is converted into a definitive numerical prescription. Independent clinical, oncology-pharmacy and patient/PPI approval flags remain false.
