# Scoped document validation

This batch keeps the v0.84.45 patient visual standard. Only the routes recorded in
`../scope.json` may be rendered by the v0.84.46 tools.

The pipeline has separate evidence stages:

1. Render the authored three-page guide and wallet sheet from current HTML using
   the established per-page font profiles. Verify all anatomical text, text
   bounds, internal card text clearance, 85.6 × 54 mm wallet panels and exact
   decoded QR destinations from both PNG and PDF pixels.
2. Freeze the verified current packs in a new comparison directory, keeping the
   untouched v0.84.45 handbooks separately for the before/after comparison.
   Content updates cannot use old clinical pages as their source.
3. Inventory every current journey, logistics and applicable port/pump source.
   Exact normalized duplicates are recognized. Unmatched source clauses are
   retained in full; table cells require their timing and row context. Explicit
   reviewed equivalences can be supplied, but no fuzzy content deletion is used.
4. Build the full handbook and reference with the five approved chapter openers,
   then independently verify source retention, chronology, page bounds, contents
   destinations, preserved anatomy/wallet pages, mirrors and PDF QR decoding.
5. Render all remaining applicable current companion PDFs, verify complete HTML
   text retention and download mirrors, and inspect representative PDF pages.

Successful automated rendering does not establish visual quality, clinical
approval, real-device camera/printing usability or live QR availability.

## Final verification commands

Run from the selected checkout, using the PDF virtual environment described in
AGENTS.md. The stage and frozen comparison directories must correspond to the
reviewed current guide/card build; they are never silently replaced by historic
clinical pages.

```bash
../pdf-venv/bin/python tools/verify-head-neck-packs-v08446.py --stage ../batch46-work/packs --report validation/head-neck-v08446/pdf/pack-verification.json
../pdf-venv/bin/python tools/verify-patient-documents-v08446.py --build-report validation/head-neck-v08446/pdf/books-build.json --report validation/head-neck-v08446/pdf/books-verification.json --previous-root ../batch46-work/pack-baseline --companion-audit validation/head-neck-v08446/pdf/companion-content-retention.json --workers 3
../pdf-venv/bin/python tools/verify-head-neck-v08446-pdfs.py --build-report validation/head-neck-v08446/pdf/companion-build.json --stage ../batch46-work/companions --report validation/head-neck-v08446/pdf/companion-verification.json
```

`books-staged-verification.json` independently checks the freshly generated print
HTML as well as all PDFs before publication. The final `books-verification.json`
checks actual patient/docs download files and all frozen source hashes. The
book input inventory excludes only generated `knowledge-print.html`, which is
an output, and retains all actual clinical/patient source inputs.

The five new HN packs needed print-only padding/margin adjustments to retain
long anatomical text and rolling wallet instructions inside their original
boxes. Font sizes, artwork, connector geometry, content and card dimensions did
not change. The book composition also removes heading-only practical-care cards
only when their complete original instructions are proven to remain elsewhere,
and keeps journey captions with their table headers and first row.

See `visual-review.json` for document totals, inspected pages, and the limits of
representative visual review. Full-page chapter openers are deliberate; ordinary
sparse-page checks still apply. No live deployment or real-device claim follows
from the local PDF checks.

## Non-rendering embedded metadata reconciliation

The final generator check required adding `visual_release: 0.84.46` to embedded
`application/json` profiles in 11 knowledge routes (13 canonical/mirror files).
`metadata-input-equivalence.json` records an independent comparison of the saved
before HTML and final HTML. The only JSON difference is that field; every byte
outside its script payload is identical. Running the actual v46 book composition
against both snapshots produces byte-identical complete WeasyPrint input HTML,
clinical inventories, anatomical units and source lists. All CSS/font inputs and
all PDF output hashes remain unchanged. `verify-pdf-metadata-equivalence-v08446.py`
records this proof and explicitly reconciles only the approved raw input hashes,
preserving the old fingerprint and proof digest in each affected build record.
The final staged and published verifiers are then run again without weakening
any content, layout, source-hash or mirror checks.
