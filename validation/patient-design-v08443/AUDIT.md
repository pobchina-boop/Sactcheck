# Patient design rollout: baseline scope and preservation

## Verified baseline

The inventory uses repository `pobchina-boop/Sactcheck`, commit
`67aaa3579794278074478b3f6cce4e57c803e4db`, version `0.84.42`, Git tree
`ba65db9ba843ef3d191f7acd5af2b195f453e229`. The complete remote tree was not
truncated. Every one of the 8,765 source/assets read for the inventory matched its
pinned Git blob; no fallback copy was required in the original audit.

`scope.json` is the machine-readable baseline inventory. It records every route,
authored source JSON, protocol, generator family, baseline file hash and Git blob,
PDF page count, compatibility copy, handbook section and additional support PDF.
It is intentionally a baseline record and must not be refreshed from generated
v0.84.43 outputs.

## Authoritative authored scope

There are **199 unique regimen codes and 228 authored treatment routes**. The
registry's `bundleRoutes()` returns 219; nine additional real authored contexts
exist and are supported by the context resolver:

- `00203/lung`
- `00212/colorectal`
- `00214/colorectal`
- `00215/colorectal`
- `00215/lung`
- `00226/lung`
- `00232/lung`
- `00259/lung`
- `00621/lung`

Five root pages are context selectors, not extra treatment suites. Preserve
`00320`, `00372`, `00388`, `00535` and `00849` exactly.

| Authored family | Treatment routes | Unique codes within family |
| --- | ---: | ---: |
| Breast | 84 | 84 |
| Lung | 66 | 59 |
| Colorectal | 41 | 41 |
| Neuroendocrine | 4 | 4 |
| Neuro-oncology | 10 | 10 |
| Skin/Melanoma | 22 | 16 |
| Hepatocellular | 1 | 1 |
| All routes | **228** | **199 overall** |

Families partition the authored routes for rendering. They do not narrow clinical
applicability, and their code counts overlap. The exact authored indication,
context label and scope note remain in each source JSON. In particular the
capecitabine route includes colorectal and breast material; shared taxane and
tumour-agnostic indications must remain as authored.

The latest skin metadata confirms 16 authored catalogue entries and 22 treatment
contexts. Its historical clinical-approval and all-required-gates flags are
false; authoring availability does not establish clinical approval, current
source validity or current deployment.

## Baseline completeness and documents

All 228 routes have authored source JSON, portal HTML, guide PDF, knowledge HTML,
passport PDF, wallet PDF, consent HTML/PDF, supportive-care PDF and treatment
journey PDF. All six non-reference handbook sections are available for every
route, including the logistics PDF. All existing PDF compatibility copies are
byte-identical.

The 109 modern `pt-page` routes have three-page guides, reference PDFs and full
handbooks. They exactly match the 109 routes configured in the old handbook
builder. The other 119 routes have two-page legacy guides and separate wallet
sheets; only `knowledge.pdf` and `handbook.pdf` are absent. Of these 119 routes,
110 use the earlier `suite-page` generator and nine use the v0.84.28 `ps-page`
summary. Their existing pagination is recorded, not silently treated as a failed
three-page baseline. Clinical material and wallet dimensions must be retained.

The earlier site audit's 116 missing handbooks reflected only its 219 registry
routes. The additional missing contexts are `00215/lung`, `00226/lung` and
`00621/lung`, bringing the correct total to 119.

The seven handbook source sections, in order, are:

1. `guide.pdf`
2. `knowledge.pdf`
3. `treatment-journey.pdf`
4. `supportive-care.pdf`
5. `logistics.pdf`
6. `passport.pdf`
7. `sactcard.pdf`

There are also 340 existing `support-*.pdf` files: 148 routes have one, 51 have
two, 26 have three and three routes have four. The inventory lists exact
filenames; the document verifier must reconcile applicable phase sheets with
the full handbook and avoid duplicating retained pages or reviving obsolete
support sheets.

Current phase data resolves **337 applicable sheets**. Three retained on-disk PDFs
are outside current phase data: `00203/support-combination.pdf`,
`00621/support-combination.pdf` and `00892/support-ribociclib.pdf`. Preserve those
files but do not add them to newly assembled handbooks. Include the five
single-plan endocrine support PDFs even though their pages have no selector.
`applicable-support-sheets.json` records the exact route mapping.

Comparing the 109 baseline handbooks found 44 applicable phase sheets and 14
port/pump sheets missing as complete documents (58 documents across 42 routes).
`baseline-support-coverage.json` records exact PDF stream/text comparisons and
the append list; the 107 already included documents should not be duplicated.

## Strict presentation migration

`migration-baseline.json` records the pinned before hashes for the 2,455 existing
files in the permitted presentation scope. `asset-migrations.json` is a separate
new-release record; historical migration records remain unchanged. The helper
pins the exact 228-route set, commit and tree and permits only named presentation
files and explicit shared source files. Clinical source JSON, protocols, anatomy,
wallets, QR images, selectors and other authored patient assets cannot enter this
migration.

After final rendering and candidate review, record its concrete hashes with:

```sh
node tools/record-patient-design-migration-v08443.cjs --write
```

This does not approve clinical content or bypass PDF/browser checks. The
independent regression proves the before bytes from the actual Git objects,
confirms absent-baseline files are new, checks the complete changed-file set and
checks the exact current hashes. A source archive without the pinned Git history
cannot pass that provenance gate.

```sh
node tests/patient-design-migration-v08443.test.cjs
npm run test:patient-ui
node tests/full-suite-v08442.test.cjs
```

Initial verification: all four focused migration fixture tests pass, including
rejection of protected/unsafe paths, altered baseline provenance and subsequent
mutations. Changed test/helper/recording scripts pass Node syntax checks. Full
asset/provenance checks require the final rendered manifest and are recorded
separately; the pending manifest must not be described as a passing release gate.

## Completed independent document gate

The final published-local-copy check in `document-verification.json` passes all
228 authored routes. It verifies 684 generated PDFs (13,923 pages in total),
their byte-identical compatibility copies, seven-section contents and chapter
positions, and global folios. There are 565 guide pages, 4,141 standalone reference
pages and 9,217 handbook pages.

The checker completed 1,021 actual PNG/rasterized-PDF QR decodes and 10,143 PDF
page-preservation comparisons. It checks original content streams, word/image
coordinates, page geometry and all embedded font glyph/metric tables; only font
head timestamps/checksum metadata may differ after PDF deduplication. All 337
applicable phase sheets and 18 port/pump sheets occur once as complete unscaled
documents in their correct handbook chapters. No new or inherited out-of-page
text was found with unbounded text extraction.

Clinical JSON, protocols, anatomical assets, standalone wallets, QR image bytes
and all ten patient/docs root-selector files remain unchanged. Wallet PDFs keep
their established dimensions; legacy cards are not silently resized to the
modern 85.6 by 54 mm profile. This software/PDF audit does not establish live-site
deployment, physical printing, phone-camera behavior or independent clinical
approval. Browser and complete CI results are recorded separately in the release
validation evidence.


## Completed v0.84.43 outcome

The initial/pending statements above describe the baseline and early migration fixture checks. Final implementation evidence supersedes that provisional status: the uninterrupted replacement `npm run test:ci` exited 0, all four handbook chronology tests pass, all 228 routes pass independent document verification, and all 912 current target HTML files are idempotent. `release-validation.json` records the completed full run and explicitly distinguishes the earlier interrupted attempt.

The final built site contains all 684 validated PDFs and all 456 patient index/reference pages with exact source-matching bytes; see `build-output-verification.json`. All patient index/reference pages expose both handbook and reference downloads. The full handbooks have 31–64 pages; the separate guides remain 109 modern three-page packs and 119 complete earlier two-page guides. See `visual-standard-final.json`, `document-download-links.json` and `browser-workflow-review.json` for scope, visual checks and limitations.

This is a complete locally validated manual update. It is not a new clinical source review, clinical approval or deployment verification.
