# Scoped v0.84.47 PDF verification

This batch uses the approved v0.84.45 visual standard, extending the v0.84.46
rendering and independent verification tools. The explicit scope comprises five
new full service routes and seven existing or related retrospective routes.

The ordered pipeline is:

1. Freeze current profiles, generated and normalized HTML, phase support, QR
   PNGs, shared styles and release metadata before the first PDF render.
2. Render three-page guides and wallet sheets from current HTML. Verify every
   anatomical explanation, approved detailed bitmap pixels/aspect, page bounds,
   internal callout clearance, 85.6 × 54 mm wallet panels and exact PNG/PDF QR
   destinations. Recorded source/style/image/font hashes reject later drift.
3. Place the verified current guides/cards in a fresh comparison directory.
   Only prior handbooks come from the immutable v0.84.46 baseline; old clinical
   guide/card pages are not used for this content update.
4. Audit current journey, logistics and applicable access/pump companion text
   before handbook generation. Exact complete source clauses are retained.
   Table rows require their timing columns and headers. Reviewed equivalences
   are reused only when their exact current destination remains present.
5. Render and verify all current consents, passports, support sheets, timelines,
   journeys, logistics and applicable pump sheets. Inspect representative page
   images before copying validated outputs into both public download trees.
   Fresh phase-support PDFs must exist before handbook assembly, particularly
   for new routes; do not substitute historical clinical support pages.
6. Build separate complete references and consolidated handbooks. Independently
   verify clinical statements, companion retention, five chapter purposes,
   actual contents destinations/folios, anatomy/wallet page streams, fonts,
   page bounds, publication mirrors and QRs decoded from rasterized PDF pages.
   Inspect representative book pages before local publication and recheck the
   published files independently.

Reports distinguish staged checks, local publication into download paths, and
unverified live deployment/device behavior. Local file publication does not
commit, push or deploy anything. Successful automated checks do not establish
clinical approval, camera usability, physical printing or real-device behavior.

Final local results: 136 unique PDFs (851 pages), with 272 byte-identical files
across the canonical and download trees. The separate handbook/reference
verifier passed all 12 selected routes, 60 retained-page checks and 24 PDF QR
checks. All 88 ancillary documents passed 2,794 exact source-unit checks and
12 PDF QR checks. Initial pack checks passed 48 PNG/PDF QR checks. Thirteen
representative rasterized pages were inspected; this is not a visual review of
every page. `published-pdf-manifest.json` records final hashes and page counts.
`books-verification.json` intentionally reports explicit-subset coverage: its
`all_document_checks_passed: false` refers to the rest of the 244-route catalogue,
not a failed check within these 12 routes.
