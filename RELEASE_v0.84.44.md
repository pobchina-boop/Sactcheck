# SACTCheck v0.84.44 — cumulative UI and patient handbook update

## One update from v0.84.42

This complete manual package incorporates the unpublished v0.84.43 visual update and the subsequent patient handbook instructions. It installs directly over v0.84.42 at commit `67aaa3579794278074478b3f6cce4e57c803e4db`. There is no need to apply or push v0.84.43 first.

The patient rollout covers the same **228 authored treatment routes across 199 regimen codes**. The shared clinical workflow applies throughout the application. This revision changes patient presentation, explanatory content, source attribution and document assembly; clinical assessment thresholds, protocol rules and their recorded review status remain protected.

## Patient handbooks and concise guides

The full handbook now reads as one document. It combines unique material from the current authored reference, journey, logistics, phase medicine plans and records instead of joining overlapping PDFs. Exact repeated statements and duplicate blank record copies are recorded in the consolidation audit. Relevant urgent instructions remain beside the actions they explain.

The SACTCheck cover and opening contents lead to five clear chapter groups:

1. Understanding your treatment.
2. Your schedule, tests and appointments.
3. Symptoms and supportive care.
4. Your record and contact card.
5. Sources and further information.

Each chapter has a branded heading and an intentional page start. Contents links, bookmarks and continuous folios are calculated from the assembled document. The duplicated “Your complete reference / Read what you need, when you need it” navigation card is omitted from the handbook. Unique source information remains available offline.

Handbook length follows its content; there is no three-page limit. The separate concise handout keeps its established purpose. All 109 modern packs retain three pages: schedule/checks, detailed anatomy, and wallet/contact/QR information. The 119 earlier guides retain their complete two-page format and separate wallet sheet. Where first-use explanations lengthen text, spacing, table column widths and icon placement provide room without reducing font size to force the page count.

The print preparation also fixes empty or nearly empty continuation pages, detached notes, closing questions, signature fragments and isolated source footers. Complete short clinical sections and useful writing space are distinguished from accidental overflow. The detailed anatomical images, QR destinations and wallet dimensions retain their established scale.

## Shared visual and editorial language

The patient portal and print outputs share labelled investigation symbols, including an ECG waveform and an MRI scanner/magnet, together with authored treatment timelines, phase windows and concise monitoring tables. Icons never introduce a test or schedule that is absent from the source content.

The PRRT amino-acid explanation uses separate, labelled L-lysine and L-arginine molecular structures. These are original vector drawings checked against authoritative chemical records, with a consistent neutral-parent convention. The kidney-protection mechanism and safety explanation remain alongside them.

Unfamiliar abbreviations are introduced at first use in each standalone patient output and in independently selectable phase panels. Patient wording describes their own team and treatment pathway directly, removing distancing references to “the Irish system/service”.

Applicable specialist tests are named explicitly, with purpose and source-supported timing. Routine treatment-safety tests are distinguished from conditional disease markers. The update does not turn CEA, AFP, chromogranin A, 5-HIAA or LDH into a universal test panel. The relevant authored changes and source decisions are recorded in `editorial-source-provenance.json`.

Patient explanations previously tied to NCCN patient material are independently rewritten as SACTCheck prose using suitable openly accessible supporting sources. This is not a citation-removal exercise. The new content retains relevant diagnostic distinctions and qualifications, groups references for patient readability, and keeps the historical audit trail separate from current patient attribution.

## Clinical workflow carried forward from v0.84.43

- Consistent icon, title and action alignment across the eight workflow rows, including Patient platform and NCCP source.
- Disclosures start closed and open through an explicit click or keyboard activation.
- Generate consent opens the complete branded context-specific form directly.
- Supportive care opens on Guidance; Generate script produces the selected authored phase plan with patient, allergy and prescriber fields, medicine/timing information and sources.
- PRRT retains its specialist plan. Missing source-specific prescription details remain explicit; emetic-risk category alone does not select a generic prescription.
- Individual support plans without medicine rows remain clearly identified.
- The single visible Solid Tumour SACT selector uses the available width. Haematology remains hidden with its source, data and tests retained.

## Keeping future updates consistent

The current standard is documented in `PATIENT_DESIGN_STANDARD.md` and the appended project instructions. `tools/patient-publication-v08444.cjs` applies the shared branding, editorial and visual passes after intentional generation. Run `npm run patient:ui` and then `npm run patient:design:check` to detect drift.

`tools/build-patient-documents-v08444.py` produces the consolidated guide, reference and handbook PDFs. `tools/render-patient-ancillary-v08444.py` refreshes the affected supporting PDFs from current HTML. Each has an independent verifier. Stage, verify, inspect reported exceptions, publish, and recheck the canonical/download copies in that order. The canonical print HTML remains generated by the established source generator; intermediate composition HTML is an audit/rendering artifact.

The original v0.84.43 package manifest is pinned. Every allowed v0.84.44 patient-content or generated-asset change has an explicit before/after hash record. Historical manifests are not replaced with hashes calculated from an unreviewed current tree. Protocols, assessment code, detailed anatomy assets, wallet files and QR assets remain outside that content migration.

The three large companion-audit and PDF build reports are stored with lossless gzip compression. A storage manifest verifies both the original byte streams and their compressed forms. An explicit helper temporarily supplies the original inputs to the unchanged PDF tools and cleans up only the exact inputs it created. This keeps the frozen evidence and renderer fingerprints intact while retaining the repository's existing file-size limit.

## Validation and boundaries

The final results, exact counts, runtimes, hashes and evidence paths are recorded in `validation/patient-design-v08444/release-validation.json`. The document checks cover current clinical statements, named monitoring instructions, medicine table cells, contents destinations, page bounds, anatomy/wallet geometry, rendered QR content and matching download copies. The complete repository software pipeline is recorded separately from those PDF checks.

A fresh managed-browser review could not be completed: local HTTP previews were unreachable, native terminal focus was unavailable, and the browser policy rejected a local file URL. These limitations are recorded in `browser-review.json`; no bypass was attempted. The earlier v0.84.43 desktop and 390 px clinician-workflow review is retained as historical evidence and is not presented as a new v0.84.44 browser pass. Physical printing, camera scanning, Safari/iOS and assistive-technology checks remain separate.

The local runtime uses Node v24.22.1; the repository's GitHub workflow specifies Node 20. A successful local run does not claim a Node 20 Actions run. This manual delivery does not imply independent clinical, oncology-pharmacy or patient approval.

Lanreotide, depot octreotide and short-acting octreotide remain separate clinical authoring items. No new regimen or clinical decision threshold is introduced by this package.

## Delivery

Use `INSTALL_v0.84.44.md` and `COMMIT_MESSAGE_v08444.txt`. The complete ZIP contains source, generated assets and validation evidence, with a per-file manifest. Numbered smaller ZIP volumes, if supplied, contain disjoint portions of the same complete tree and must all be extracted together.

No commit, push, pull request, merge or deployment was performed. The prior complete package and a dated source/history recovery snapshot are preserved. That recovery snapshot is on the same cloud filesystem; an independently controlled offline recovery copy has not been made.

## Final verified results — 7 November 2026

All six local release gates passed: main documents, ancillary documents, complete software CI, publication consistency, exact protected bytes and built-site bytes. These are local checks with the browser and clinical-review boundaries above.

| Check | Verified result |
|---|---:|
| Authored treatment routes / regimen codes | 228 / 199 |
| Unique regenerated PDFs | 1,936 |
| Canonical and compatibility PDF files | 3,872 |
| Main document routes passing | 228 of 228 |
| Ancillary documents passing | 1,252 of 1,252 |
| Ancillary medicine/monitoring table cells checked | 58,952 |
| Preserved main anatomy/contact-page checks | 884 |
| Main PDF QR checks | 456 |
| Original ancillary QR images checked | 228 |
| Unique companion units checked | 12,784 |
| Final PDF companion counterparts checked | 25,200 |
| Protected baseline files checked | 9,997 |
| Matching public build files | 10,073 |
| Complete local CI commands passed | 27 of 27 |
| Separate chronology tests passed | 4 of 4 |

The exact `npm run test:ci` pipeline passed in 485.488 seconds in a fresh full-history isolated copy. The separate unchanged chronology test passed through the verified evidence-storage wrapper in 3.655 seconds. The wrapper restored packed storage after execution. CI command counts are not a sum of assertions; nested suites overlap.

Total handbook length across the 228 routes fell from **9,217 to 4,224 pages**, a reduction of **4,993 pages (54.17%)** compared with the previous v0.84.43 ZIP. This consolidates overlapping material and 474 duplicate blank record copies. All 87 reviewed source-clause requirements are accounted for: 86 restored once and one duplicate supply prompt represented by its complete retained counterpart.

| Route | Previous v0.84.43 handbook | Final v0.84.44 handbook |
|---|---:|---:|
| 00253 | 32 | 14 |
| 00555 | 53 | 25 |
| 00568 | 50 | 25 |
| 00588 | 34 | 16 |
| 00642 | 54 | 24 |
| 00947 | 34 | 16 |

The 109 modern concise packs remain three pages; 119 complete legacy guides remain two pages with their separate wallet sheets. The full handbook follows its content and has no three-page limit. Main documents have zero ordinary short-page flags. The ancillary audit accepts one complete two-card monitoring section rather than treating it as an accidental blank page.

Sixteen final published pages across eight representative routes match the visually inspected proofs pixel-for-pixel. Exact archive verification, including every retained baseline member and the union of the smaller ZIP volumes, is recorded separately in the delivery's package-verification report.

