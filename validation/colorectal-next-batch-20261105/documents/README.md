# Existing PDF, image and QR preservation — 5 November 2026

This is a new, read-only baseline check against commit
`2e5de4a6dd9e2fcbefa18623ff21db7b9eaec40b`. No clinical PDF or source HTML was
regenerated or replaced. These results preserve existing content; they do not
complete any new colorectal context or repeat clinical source audit.

## Results

- **87/87 existing PDFs, 199 pages:** baseline SHA-256 identity, identical
  `docs/patient/` copies, nonempty extracted text on every page and all text
  within page bounds passed. This includes **79 root PDFs plus eight PDFs in
  `00215/lung`**, preserving that other indication.
- All **199 pages are A4**: 165 portrait and 34 landscape. The landscape
  treatment-journey pages and their bound-handbook copies are intentional
  existing layouts, not portrait-size failures.
- **338/338 tracked image files** are byte-identical to the baseline, including
  all 44 images under `assets/` and the detailed anatomical illustrations.
  Existing PDFs are also byte-identical, preserving their embedded anatomy.
- **28 actual QR decodes passed**: ten root-route PNGs and QRs rasterized from
  all 18 existing root guide/card PDFs. Each PDF QR matches a known PNG for the
  same regimen. Exact destinations, page numbers and raster DPI are recorded.
  All decoded destinations are HTTPS URLs on `sactcheck.com` for the same code
  and have an existing local target.
- Nine existing root wallet layouts have their source CSS and actual PDF vector
  panel measurements recorded. All match their established geometry.

Full per-document hashes, page sizes, measurements and decodes:
[existing-documents.json](existing-documents.json).

## Preserve legitimate QR differences

Eight root-route `qr.png` images and their legacy guide/card QRs open
`https://sactcheck.com/patient/<code>/`. These are preserved existing portal
destinations, not incorrectly assumed to be knowledge-page links.

For **00214**, the existing `qr.png` opens
`https://sactcheck.com/patient/00214/scope.html`. Its
`oncowiki-qr.png` and the approved pack/card PDFs instead open
`https://sactcheck.com/patient/00214/knowledge.html`. Both targets exist locally;
the OncoWiki destination is checked exactly. The scope selector must not be
silently overwritten with another indication.

The QR decoding scope is the ten root PNGs and 18 root guide/card PDFs. Nested
QR image bytes were preserved by the full image check, but nested PDF QR
decoding was not claimed. No live destination responses were verified:
canonical-site access is blocked by an HTTPS proxy tunnel **403 Forbidden**.

## Presentation differences still requiring future work

The existing roots of **00212 and 00215 are breast contexts**, and **00214 is a
lung context**. Their existing packs do not establish colorectal completion.
The eight nested `00215/lung` PDFs are preserved separately.

- Only **00214** has the approved existing three-page root pack and complete
  root handbook in this set. Its wallet panels measure **85.6 × 54 mm**.
- The other eight available root guides retain their existing **two-page**
  layout. Seven legacy wallet layouts use **110 × 65 mm** panels.
- **00382** uses an existing compact CSS override and measures
  **110 × 55 mm**, not 110 × 65 mm.
- The legacy root routes lack standalone `knowledge.pdf` and `handbook.pdf`.
  **00244** has no root PDF/QR outputs; its absence is recorded as a gap rather
  than a passing or completed context.

The dimensions above come from the existing stylesheet contract and matching
rectangles in the actual wallet PDFs. They establish preserved digital geometry,
not physical printer scaling or card-cutting accuracy. All nine available card
sources mark their contact numbers as examples or instructions to insert local
numbers. The existing approved anatomical detail and useful text must be
retained when these older presentations are eventually upgraded after source
verification.

## Reproduce and inspection limits

```bash
cd /workspace/Sactcheck
/workspace/.sactcheck-tools/venv/bin/python validation/colorectal-next-batch-20261105/documents/check_existing.py
```

The script refreshes only the JSON audit in this directory. It reads baseline
Git blobs and existing documents, rasterizes QR pages in memory and never writes
a patient PDF. A zero exit code applies to preservation checks on the existing
outputs, not clinical batch completeness; missing contexts remain incomplete.

Actual representative PDF pages were rendered and opened during the
[font/renderer investigation](../fonts/README.md), including the stored 00212
anatomy page, 00214 anatomy page, wallet and consent. The full 199-page set was
checked automatically; it was not all manually viewed or clinically proofread.
Physical devices, printers, camera scanning, PDF screen-reader order and current
clinical source validity remain unverified.
