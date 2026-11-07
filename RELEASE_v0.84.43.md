# SACTCheck v0.84.43 — shared patient and workflow design

## Purpose

This cumulative update applies the approved SACTCheck navy/teal design across all 228 existing authored treatment routes (199 regimen codes), starting from v0.84.42 at commit `67aaa3579794278074478b3f6cce4e57c803e4db`. It includes the generated patient documents and their download copies, shared generators, interface changes, release metadata, and validation evidence.

The full handbook remains a complete offline reference. The distilled patient guide is a separate document. This update changes presentation and document assembly; it does not add protocols or change the authored clinical source data or review status.

## Patient documents

- Every route now has a branded full handbook with a cover, actual contents page numbers, seven named chapter openings, explicit page breaks, PDF bookmarks, linked contents and continuous handbook page numbering.
- The 109 existing handbooks retain their original clinical bodies. The 119 earlier suites now also have complete reference and handbook PDFs rendered from their existing authored content.
- The resulting handbooks contain 31–64 pages, according to their content; the PRRT example contains 54 pages. They are not limited to three pages.
- The 109 modern patient guides retain their three-page structure: a visual schedule/checks page, the complete anatomical side-effect page, and the wallet/contact/QR page. Every original word on the redesigned first page is retained. Anatomy and wallet pages are preserved without scaling.
- The 119 earlier guides retain their complete two-page clinical bodies and separate wallet sheets. Their web pages, reference PDFs and handbook covers use the shared visual standard; their guide PDFs receive margin branding without removing or shrinking their clinical material.
- Course graphics, treatment dots/bars and labelled phase windows derive from authored regimen data. Continuous treatment is identified as ongoing, and a reference window is not presented as a fixed course length.
- Handbooks include all 337 current phase support sheets and all 18 applicable port/pump sheets exactly once in the appropriate chapters. This also repairs 58 omitted documents across 42 of the existing handbooks. Three superseded on-disk support PDFs remain preserved but are excluded from newly assembled handbooks.
- All 684 newly generated guide, reference and handbook PDFs have identical compatibility download copies.
- Patient portals and reference pages expose the full handbook and reference PDF downloads through shared controls; existing download choices are retained and the controls are omitted from print.

## Clinician workflow

- The eight collapsed workflow rows use consistent icon, title and action alignment. Desktop rows measure 66 px; narrow layouts wrap as required.
- Patient platform and NCCP source start closed and open through an explicit click or keyboard activation.
- Generate consent opens the existing complete, branded, context-specific consent form directly.
- Supportive care starts on Guidance. Generate script creates the selected authored treatment-phase plan with patient, allergy and prescriber fields, dose/timing information and source links.
- PRRT retains its specialist source-based plan. Unspecified prescription details remain visibly unfilled; a generic moderate-emetic chemotherapy prescription is not substituted.
- The five endocrine plans without medicine rows are labelled as individual support plans.
- The Solid Tumour SACT selector fills the available width. Haematology remains hidden, with its data and source retained.

## Maintaining the standard

`PATIENT_DESIGN_STANDARD.md` and the appended project instructions describe the approved visual and preservation rules. Shared route discovery and generator hooks apply the same standard to future authored routes. The design module reads the current public version from `package.json`.

Use `npm run patient:ui` after intentional patient-content generation and `npm run patient:design:check` to detect drift. Full PDF generation uses `tools/build-patient-documents-v08443.py`; the independent document verifier checks the resulting content, page geometry, chapter coverage, mirrored files and QR destinations. The exact-baseline preservation mode is for presentation migrations only. Clinical updates must render their changed source content.

## Validation evidence

The complete evidence is in `validation/patient-design-v08443/`.

| Check | Result |
| --- | --- |
| All-route PDF build | 228/228 routes; zero build errors |
| Generated PDFs and compatibility copies | 684/684 pairs match |
| Final deployable build output | All 684 PDFs and 456 patient download pages match the validated sources |
| Independent document verification | 228/228 routes pass |
| QR decoding and destination comparisons | 1,021 checks pass |
| Preserved page streams, resources and geometry | 10,143 checks pass |
| Newly introduced out-of-page PDF text | Zero findings |
| Clinical JSON, protocols, anatomy, wallet and QR asset preservation | Pass against the pinned baseline |
| HTML presentation consistency | Final evidence in `visual-standard-final.json` |
| Desktop and 390 px browser journeys | Final evidence in `browser-workflow-review.json` |
| Complete repository CI and chronology tests | Final result recorded in `release-validation.json` |

The browser review covers real Chromium at desktop and 390 px frame widths. It does not establish iPhone/Safari behavior, Android installation, physical camera scanning or physical printing. Those device checks and a deployed-site comparison were not performed for this manual delivery. The decoded QR destinations are unchanged; this release has not been published to those destinations.

Validation used Node 24.22.1 rather than CI's Node 20, Python 3.12.14, WeasyPrint 70.0 and the installed PyMuPDF API. Exact runtime and font hashes are recorded in the PDF evidence. This presentation release is not a new clinical or pharmacy audit.

## Manual delivery

The release ZIP contains the complete source tree and generated assets, excluding Git internals, temporary preview configuration, caches and build output. Extract it and copy the contents of `SACTCheck-v08443/` into a full-history checkout based on the exact v0.84.42 commit above. Preserve the destination checkout's `.git` directory. The historical provenance gates require those Git objects, so a standalone ZIP without the repository history cannot run that gate by itself.

The archive is complete; no individual regimen patch or PDF regeneration is required to obtain the update. Do not replace a newer or independently edited checkout without reconciling its changes first. Use `COMMIT_MESSAGE_v08443.txt` for the suggested GitHub summary and description.

No commit, push, pull request, merge or deployment was performed. A dated baseline source/archive/history recovery snapshot was made before editing; it is on the same cloud filesystem, and no independently stored offline recovery copy was made.
