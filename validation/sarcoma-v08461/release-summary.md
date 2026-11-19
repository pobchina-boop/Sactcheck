# SACTCheck v0.84.61 — GIST review update

**Status: four authored review suites; scoped clinical, patient/document, integration and static-build checks passed.** Final preservation accompanies the archive; independent clinical/pharmacy acceptance remains pending.

Four new GIST service routes are included: imatinib 00335, sunitinib 00325/gist (42-day), sunitinib 00719/gist (21-day) and regorafenib 00244/gist. The planned pazopanib 00445 item remains blocked because its current catalogue-linked source could not be retrieved. It is not counted as completed. The application retains 377 protocols and now registers 275 patient-service codes, 306 bundle routes and 314 visual routes.

The new services connect assessment, clinical knowledge, supportive workflows, generic targeted-treatment consent risks, drug-specific risks, patient monitoring/support and print companions. Imatinib is continuous treatment, with a 28-day reference view rather than a fixed 28-day course. Shared-regimen routes require the intended context: GIST must not silently replace an existing colorectal or renal service. Existing 00244 colorectal profile, source KB and patient/download assets are byte protected.

## Clinical and software evidence

- 310 original author cases and119 independent adversarial cases are retained. Portable wrappers passed all 310 and 119 unchanged expectations against the final integrated application. Explicit metadata/grading transitions are reconstructed from immutable archived protocol drafts; full source/rule JSON outside those changes must compare exactly.
- 52 fresh cross-risk retrospective cases cover the preceding five sarcoma suites 00500,00391,00392,00501 and00511. Replaying earlier v60 cases is not counted as another new audit.
- Source review corrected five grading fields: sunitinib hand–foot guides now name the appropriate toxicity; the 21-day toxicity selectors identify their NCCP source without inventing a grading edition; regorafenib worst hand–foot skin reaction no longer offers an unsupported grade 4. Integration metadata now says locally integrated review, preserves prior dated CRC source evidence, and leaves human approval flags false.
- National indication codes for sunitinib 00325 now match NCCP 00325a (GIST) and 00325b (renal), while stable internal route identifiers are retained. The two source-bound transitions pin the exact source text and page/line citations.
- The direct sarcoma catalogue regression passed across 25 protocols, 664 inputs, 685 rules and 510 assessed fields; 12 reviewed grading controls passed engine/descriptor checks. Focused engine, source security, version, shared indication/context and card-coverage checks also passed.
- Context regression exercises actual registry and KB selection/rendering, including explicit selection, object patient_context and active tumour-group priority, missing/RCC guards and CRC preservation. Protocol index and compressed catalogue are rebuilt from current JSON with canonical card normalization.

The final full scoped release command passed. Global patient publication/consent/design checks found zero pending changes, and the static Pages build passed. Parent external HTTP verification passed 39 exact source/build/served-content checks, including the four GIST routes and protected CRC service.

Current official source links and complete extracted text were reviewed. Current original PDF binaries were unavailable and source-table visual layout was not verified. Source conflicts remain explicit hold/review branches. This is distinct from visual review of actual rendered patient PDFs. Automated tests do not establish independent clinical, oncology-pharmacy or patient/PPI acceptance.

## Document acceptance

All 40 canonical PDFs and 40 byte-identical download mirrors passed the scoped document checks. The four full handbooks contain 83 pages in total; each of the four concise guides has three pages. Source-specific compact monitoring rows now appear in every guide and remain consistent with the detailed reference cards. Four wallets, four consents and 20 companions are included. Checks preserve 246 earlier CRC/v60 assets and verify current source/font hashes, QR destinations, content retention and publication idempotence. Exact reports and source freezes are under `pdf/` and `documents/`.

Twelve transient rendering directories were moved intact outside the application after verification, with all 166 files and 69,755,051 bytes accounted for in `pdf/staging-relocation.json`. Canonical PDFs, required replay fixtures, reports and logs are retained; no evidence was deleted.

## Remaining acceptance boundaries

The full historical/general regression gate remains blocked by unavailable historical Git objects. A bounded v61 platform attempt with lazy fetching disabled again exposed the missing a4575d67… package object; its assertion was retained and not retried. Browser acceptance remains blocked by the recorded socket restriction. Real-device install/printing, live deployed URLs and independent clinical/pharmacy approvals remain unverified or pending. This update is prepared for manual review and application; it has not been committed, pushed or deployed by the assistant.

## Preservation and delivery

The baseline is the completed v60 working state: 21,288 files authenticated through its manifest and previous migration, anchored to actual v59 Git commit c01f1a2b236afced0c3ebfdb6b6ff864e58e7d4c. No v60 commit is invented. The new migration records v61 changes separately and protects prior evidence plus the CRC patient service.

All application ZIP members use repository-relative paths at the archive root. Apply every part of v60 before every part of v61 and commit in that sequence. Audit evidence, installation directions and copyable commit text are separate from application ZIPs. Final current-baseline preservation is performed after this source snapshot freezes; its external result accompanies the delivered archive. Document checks passed; independent human approval and the listed environment blocks remain separate.
